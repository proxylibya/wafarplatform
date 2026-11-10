// The pending-request service: create, replace, resend, consume, expire. One
// row per number, written only after the channel accepts, and the counts the
// code step is bounded by (FR-034, FR-038, AC-036, AC-041).
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import {
  codePointLength,
  otpLifetimeSeconds,
  otpMaxIncorrectEntries,
  otpMaxReRequests,
  otpLength,
  passwordMaxLength,
} from '@wafar/shared';
import type { SmsTransport } from '../../auth/sms/port.ts';
import { renderBody, type SmsKind } from '../../auth/sms/templates.ts';
import { hashOneTimeCode, hashResumeToken, verifyOneTimeCode } from '../../auth/service/password-policy.ts';
import type { PendingRow } from '../repository/phone-verifications.ts';

export interface PendingStore {
  findByPhone(phoneNumber: string): Promise<PendingRow | null>;
  findById(id: string): Promise<PendingRow | null>;
  upsert(row: PendingRow): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByPhone(phoneNumber: string): Promise<void>;
  incrementIncorrect(id: string, now: Date): Promise<number>;
  /**
   * Claims one re-request allowance in a single conditional write; resolves the
   * count after the claim, or null when none remains or the row moved on.
   */
  claimReRequest(id: string, now: Date, max: number): Promise<number | null>;
  /** Returns a claimed allowance when the channel refused the dispatch. */
  releaseReRequest(id: string, now: Date): Promise<void>;
  /** Writes the replacement code and its expiries without touching the counts. */
  updateCode(input: {
    id: string;
    codeHash: string;
    previousCodeHash: string;
    codeExpiresAt: Date;
    requestExpiresAt: Date;
    now: Date;
  }): Promise<void>;
  markVerified(id: string, now: Date): Promise<void>;
}

export interface StartInput {
  phoneNumber: string;
  purpose: 'sign_up' | 'recovery';
  fullName?: string;
  city?: string;
  shopName?: string;
  passwordHash?: string;
  now: Date;
}

export type StartResult =
  | { status: 'accepted'; row: PendingRow; resumeToken: string }
  | { status: 'send_failed' };

export type ConsumeResult =
  | { status: 'correct' }
  | { status: 'incorrect'; remaining: number }
  | { status: 'ended' }
  | { status: 'expired' }
  | { status: 'verified' };

function newCode(): string {
  return String(randomInt(0, 10 ** otpLength)).padStart(otpLength, '0');
}

/**
 * The pre-dispatch work a silent refusal performs on a discarded copy: the same
 * code generation and scrypt hash an accepted request performs, with nothing
 * stored and nothing dispatched (FR-029, AC-031; plan record 15).
 */
export async function discardedPreDispatch(): Promise<void> {
  await hashOneTimeCode(newCode(), randomUUID());
}

export function createPendingRequestService(store: PendingStore, sms: SmsTransport) {
  function expiries(now: Date): { codeExpiresAt: Date; requestExpiresAt: Date } {
    const at = new Date(now.getTime() + otpLifetimeSeconds * 1000);
    return { codeExpiresAt: at, requestExpiresAt: at };
  }

  async function dispatch(
    phoneNumber: string,
    purpose: 'sign_up' | 'recovery',
    code: string,
  ): Promise<boolean> {
    const kind: SmsKind = purpose === 'sign_up' ? 'otp_sign_up' : 'otp_recovery';
    const result = await sms.send({
      to: phoneNumber,
      kind,
      body: renderBody(kind, code),
    });
    return result === 'accepted';
  }

  return {
    async start(input: StartInput): Promise<StartResult> {
      const code = newCode();
      const accepted = await dispatch(input.phoneNumber, input.purpose, code);
      if (!accepted) return { status: 'send_failed' };

      const id = randomUUID();
      const resumeToken = randomBytes(32).toString('base64url');
      const { codeExpiresAt, requestExpiresAt } = expiries(input.now);
      const row: PendingRow = {
        id,
        phoneNumber: input.phoneNumber,
        purpose: input.purpose,
        state: 'pending',
        codeHash: await hashOneTimeCode(code, id),
        previousCodeHash: null,
        codeExpiresAt,
        requestExpiresAt,
        incorrectEntries: 0,
        reRequests: 0,
        resumeTokenHash: hashResumeToken(resumeToken),
        fullName: input.purpose === 'sign_up' ? (input.fullName ?? null) : null,
        city: input.purpose === 'sign_up' ? (input.city ?? null) : null,
        shopName: input.purpose === 'sign_up' ? (input.shopName ?? null) : null,
        passwordHash:
          input.purpose === 'sign_up' ? truncateHash(input.passwordHash) : null,
        verifiedAt: null,
      };
      await store.upsert(row);
      return { status: 'accepted', row, resumeToken };
    },

    async resend(
      row: PendingRow,
      now: Date,
    ): Promise<
      | { status: 'accepted'; row: PendingRow }
      | { status: 'limit' }
      | { status: 'send_failed' }
      | { status: 'expired' }
    > {
      // The verified state owns no code, and its authority never outlives the
      // request: a resend neither restarts its expiries nor dispatches a code
      // (FR-014, AC-036; domain-model.md §8).
      if (row.state !== 'pending') return { status: 'expired' };
      // The allowance is claimed before the channel is called, so two
      // concurrent resends cannot both pass the bound (FR-034).
      const claimed = await store.claimReRequest(row.id, now, otpMaxReRequests);
      if (claimed === null) return { status: 'limit' };
      const code = newCode();
      const accepted = await dispatch(row.phoneNumber, row.purpose, code);
      if (!accepted) {
        await store.releaseReRequest(row.id, now);
        return { status: 'send_failed' };
      }
      const { codeExpiresAt, requestExpiresAt } = expiries(now);
      const codeHash = await hashOneTimeCode(code, row.id);
      // The code this resend supersedes is kept so an entry of it is refused
      // as expired rather than counted against the five (FR-034).
      const previousCodeHash = row.codeHash;
      try {
        await store.updateCode({
          id: row.id,
          codeHash,
          previousCodeHash,
          codeExpiresAt,
          requestExpiresAt,
          now,
        });
      } catch (error) {
        // The channel accepted a code this request will not hold; a resend that
        // did not take effect spends no allowance (FR-034, T146, T247).
        await store.releaseReRequest(row.id, now).catch(() => undefined);
        throw error;
      }
      const updated: PendingRow = {
        ...row,
        codeHash,
        previousCodeHash,
        codeExpiresAt,
        requestExpiresAt,
        reRequests: claimed,
      };
      return { status: 'accepted', row: updated };
    },

    async consume(row: PendingRow, code: string, now: Date): Promise<ConsumeResult> {
      if (row.state !== 'pending') return { status: 'expired' };
      if (
        row.requestExpiresAt.getTime() <= now.getTime() ||
        row.codeExpiresAt.getTime() <= now.getTime()
      ) {
        return { status: 'expired' };
      }
      const matches = await verifyOneTimeCode(code, row.codeHash, row.id);
      if (matches) {
        if (row.purpose === 'recovery') {
          await store.markVerified(row.id, now);
          return { status: 'verified' };
        }
        return { status: 'correct' };
      }
      // A code a resend replaced is expired, not wrong: it is refused as such
      // and never spends one of the five entries (FR-034).
      if (
        row.previousCodeHash !== null &&
        (await verifyOneTimeCode(code, row.previousCodeHash, row.id))
      ) {
        return { status: 'expired' };
      }
      const count = await store.incrementIncorrect(row.id, now);
      if (count >= otpMaxIncorrectEntries) {
        await store.deleteById(row.id);
        return { status: 'ended' };
      }
      return { status: 'incorrect', remaining: otpMaxIncorrectEntries - count };
    },
  };
}

function truncateHash(hash: string | undefined): string | null {
  if (hash === undefined) return null;
  if (codePointLength(hash) > passwordMaxLength * 4) return null;
  return hash;
}

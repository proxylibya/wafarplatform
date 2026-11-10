// The sign-in service: the decoy verification, the fixed check order, the lock,
// and the uniform refusal. Every password check and every session it issues is
// the `auth` engine's, so no credential or session is hand-built here
// (FR-007 … FR-009, FR-027, §5.5.1; ADR-151).
import type { LockPort, SecurityEventPort } from '@wafar/shared';
import { decoyHash } from './password-policy.ts';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { createLockRepository } from '../../users/repository/user-lock.ts';
import type { Database } from '@wafar/db';

export type SignInResult =
  | { outcome: 'signed_in'; token: string; expiresAt: Date; userId: string }
  | { outcome: 'invalid'; reason: string };

export interface SignInInput {
  phoneNumber: string;
  password: string;
  now: Date;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  events: SecurityEventPort;
  lock?: LockPort;
}

export function createSignInService(db: Database, auth: AuthEngine) {
  return {
    async signIn(input: SignInInput): Promise<SignInResult> {
      const users = createUsersRepository(db);
      const locks = input.lock ?? createLockRepository(db);

      // 2. Read the account; when absent, verify against the decoy.
      const account = await users.findByPhone(input.phoneNumber);
      const credential =
        account === null ? null : await auth.readCredential(account.id);
      const stored = credential?.passwordHash ?? (await decoyHash());

      // 3. Exactly one verification, whatever the case.
      const passwordMatches = await auth.verifyPassword(input.password, stored);

      const fail = (reason: string): SignInResult => {
        input.events.emit({
          event: 'auth.sign_in.failed',
          outcome: 'failure',
          requestId: input.requestId,
          reason,
          ...(account === null ? {} : { accountId: account.id }),
        });
        return { outcome: 'invalid', reason };
      };

      if (account === null) return fail('unknown_number');

      // 4. The lock, decided without incrementing or extending.
      if (await locks.isLocked(account.id, input.now)) return fail('locked');

      // 5. The block, decided without incrementing.
      if (account.status === 'blocked') return fail('blocked');

      // 6. The administrator role, decided without incrementing.
      if (account.role === 'administrator') return fail('administrator');

      if (!passwordMatches) {
        const state = await locks.recordFailedAttempt(account.id, input.now);
        if (state.lockedUntil !== null) {
          input.events.emit({
            event: 'auth.lock.applied',
            outcome: 'success',
            requestId: input.requestId,
            accountId: account.id,
          });
        }
        return fail('wrong_password');
      }

      // 8. Success.
      await locks.recordSuccess(account.id, input.now);
      const issued = await auth.issue({
        userId: account.id,
        now: input.now,
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      });
      input.events.emit({
        event: 'auth.sign_in.succeeded',
        outcome: 'success',
        requestId: input.requestId,
        accountId: account.id,
      });
      return {
        outcome: 'signed_in',
        token: issued.token,
        expiresAt: issued.expiresAt,
        userId: account.id,
      };
    },
  };
}

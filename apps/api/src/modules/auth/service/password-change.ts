// The foundation password-change service: the value rules, the current-password
// check, the conditional credential write, the global revocation, the pending
// recovery row's deletion, and the forced-first-change rule. The credential and
// every session it ends are written through the `auth` engine inside one unit of
// work (FR-013, FR-028; ADR-151).
import { eq } from 'drizzle-orm';
import type { LockPort, SecurityEventPort } from '@wafar/shared';
import { phoneVerifications, type Database } from '@wafar/db';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { createLockRepository } from '../../users/repository/user-lock.ts';
import { checkPasswordPolicy, type PasswordRefusal } from './password-policy.ts';

export type ChangeRefusal =
  | PasswordRefusal
  | 'PASSWORD_UNCHANGED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'SESSION_ENDED'
  | 'ACCOUNT_BLOCKED';

export type ChangeResult =
  | { status: 'changed'; sessionCount: number }
  | { status: 'refused'; code: ChangeRefusal };

export interface ChangeInput {
  userId: string;
  /** The calling session's token; the conditional write checks it is live. */
  token: string;
  currentPassword: string;
  newPassword: string;
  now: Date;
  requestId: string;
  path: 'change' | 'forced_change';
  events: SecurityEventPort;
  lock?: LockPort;
}

/**
 * The administrator branch's port: the A8 service owns the change, and US6's
 * file applies it only to a restricted administrator account.
 */
export interface AdministratorPasswordChange {
  change(input: Omit<ChangeInput, 'path'>): Promise<ChangeResult>;
}

export function createPasswordChangeService(db: Database, auth: AuthEngine) {
  return {
    async change(input: ChangeInput): Promise<ChangeResult> {
      const users = createUsersRepository(db);
      const locks = input.lock ?? createLockRepository(db);

      // 1. Value rules.
      const policy = checkPasswordPolicy(input.newPassword);
      if (policy !== null) return { status: 'refused', code: policy };

      const account = await users.findById(input.userId);
      if (account === null) return { status: 'refused', code: 'SESSION_ENDED' };

      const credential = await auth.readCredential(input.userId);
      if (credential === null) return { status: 'refused', code: 'SESSION_ENDED' };

      // 2. The forced-change difference check, before the lock.
      if (
        account.mustChangePassword &&
        (await auth.verifyPassword(input.newPassword, credential.passwordHash))
      ) {
        return { status: 'refused', code: 'PASSWORD_UNCHANGED' };
      }

      // 3. The lock: one code and one text, no lock hint.
      if (await locks.isLocked(input.userId, input.now)) {
        return { status: 'refused', code: 'AUTH_INVALID_CREDENTIALS' };
      }

      // 4. The current-password check.
      const matches = await auth.verifyPassword(
        input.currentPassword,
        credential.passwordHash,
      );
      if (!matches) {
        const state = await locks.recordFailedAttempt(input.userId, input.now);
        if (state.lockedUntil !== null) {
          input.events.emit({
            event: 'auth.lock.applied',
            outcome: 'success',
            requestId: input.requestId,
            accountId: input.userId,
          });
        }
        input.events.emit({
          event: 'auth.password.current_check_failed',
          outcome: 'failure',
          requestId: input.requestId,
          path: input.path,
          accountId: input.userId,
        });
        return { status: 'refused', code: 'AUTH_INVALID_CREDENTIALS' };
      }

      // 5. The conditional write: the session must still be live in the
      // transaction, so a reset that committed first makes this write nothing.
      const passwordHash = await auth.hashPassword(input.newPassword);
      const outcome = await auth.transaction(async (scope) => {
        const live = await scope.auth.resolve(input.token, input.now);
        if (live === null || live.revokedAt !== null) {
          return { status: 'refused' as const, code: 'SESSION_ENDED' as const };
        }

        await scope.auth.writeCredential(input.userId, passwordHash);
        await createUsersRepository(scope.db).clearForcedChange(input.userId);
        const revoked = await scope.auth.revokeAll(
          input.userId,
          'password_change',
          input.now,
        );
        await scope.db
          .delete(phoneVerifications)
          .where(eq(phoneVerifications.phoneNumber, account.phoneNumber));
        return { status: 'changed' as const, sessionCount: revoked };
      });

      if (outcome.status === 'changed') {
        // A successful change ends the run of counted failures (FR-009, AC-010).
        await locks.recordSuccess(input.userId, input.now);
        // One action, one record: the sessions this change ended belong to it.
        input.events.emit({
          event: 'auth.password.changed',
          outcome: 'success',
          requestId: input.requestId,
          accountId: input.userId,
        });
      }
      return outcome;
    },
  };
}

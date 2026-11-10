// The administrator's first sign-in: the same verification order as the
// merchant's, the administrator role accepted, and a session marked restricted
// while the forced change stands. The credential check and the session are the
// `auth` engine's (FR-028, AC-030; ADR-151).
import type { SecurityEventPort } from '@wafar/shared';
import type { Database } from '@wafar/db';
import { decoyHash } from './password-policy.ts';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { createLockRepository } from '../../users/repository/user-lock.ts';

export type AdministratorSignInResult =
  | {
      outcome: 'signed_in';
      token: string;
      expiresAt: Date;
      userId: string;
      restricted: boolean;
    }
  | { outcome: 'invalid'; reason: string };

export interface AdministratorSignInInput {
  phoneNumber: string;
  password: string;
  now: Date;
  requestId: string;
  events: SecurityEventPort;
}

export function createAdministratorSignInService(db: Database, auth: AuthEngine) {
  return {
    async signInAdministrator(
      input: AdministratorSignInInput,
    ): Promise<AdministratorSignInResult> {
      const users = createUsersRepository(db);
      const locks = createLockRepository(db);

      const account = await users.findByPhone(input.phoneNumber);
      const credential =
        account === null ? null : await auth.readCredential(account.id);
      const stored = credential?.passwordHash ?? (await decoyHash());
      const matches = await auth.verifyPassword(input.password, stored);

      const fail = (reason: string): AdministratorSignInResult => {
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
      if (await locks.isLocked(account.id, input.now)) return fail('locked');
      if (account.status === 'blocked') return fail('blocked');
      if (account.role !== 'administrator') return fail('merchant_role');
      if (!matches) {
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

      await locks.recordSuccess(account.id, input.now);
      const issued = await auth.issue({ userId: account.id, now: input.now });
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
        restricted: account.mustChangePassword,
      };
    },
  };
}

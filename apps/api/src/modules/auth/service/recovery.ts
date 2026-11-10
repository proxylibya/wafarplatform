// The recovery service: the verified state and the new-password write, in one
// transaction with the global revocation and the pending row's deletion. The
// credential and the revoked sessions are the `auth` engine's writes
// (FR-013, FR-014, FR-035; ADR-151).
import { and, eq } from 'drizzle-orm';
import type { SecurityEventPort } from '@wafar/shared';
import { phoneVerifications, type Database } from '@wafar/db';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { checkPasswordPolicy, type PasswordRefusal } from './password-policy.ts';
import type { PendingRow } from '../../users/repository/phone-verifications.ts';

export type ResetResult =
  | { status: 'reset'; blocked: boolean; sessionCount: number }
  | { status: 'refused'; code: PasswordRefusal | 'RECOVERY_EXPIRED' };

export interface ResetInput {
  row: PendingRow;
  newPassword: string;
  now: Date;
  requestId: string;
  events: SecurityEventPort;
}

export function createRecoveryService(db: Database, auth: AuthEngine) {
  return {
    async reset(input: ResetInput): Promise<ResetResult> {
      const policy = checkPasswordPolicy(input.newPassword);
      if (policy !== null) return { status: 'refused', code: policy };

      const account = await createUsersRepository(db).findByPhone(
        input.row.phoneNumber,
      );
      if (account === null) return { status: 'refused', code: 'RECOVERY_EXPIRED' };

      const passwordHash = await auth.hashPassword(input.newPassword);
      const outcome = await auth.transaction(async (scope) => {
        const rows = await scope.db
          .select({ id: phoneVerifications.id, state: phoneVerifications.state })
          .from(phoneVerifications)
          .where(
            and(
              eq(phoneVerifications.id, input.row.id),
              eq(phoneVerifications.state, 'verified'),
            ),
          )
          .limit(1);
        if (rows.length === 0) {
          return { status: 'refused' as const, code: 'RECOVERY_EXPIRED' as const };
        }

        // The merchant surface sets no credential on an administrator account
        // in any state: the role is re-asserted inside the transaction, and a
        // row that reached the verified state by another path is refused and
        // ended here (FR-027).
        const current = await createUsersRepository(scope.db).findByPhone(
          input.row.phoneNumber,
        );
        if (current === null || current.role === 'administrator') {
          await scope.db
            .delete(phoneVerifications)
            .where(eq(phoneVerifications.id, input.row.id));
          return { status: 'refused' as const, code: 'RECOVERY_EXPIRED' as const };
        }

        await scope.auth.writeCredential(account.id, passwordHash);
        const revoked = await scope.auth.revokeAll(
          account.id,
          'password_change',
          input.now,
        );
        await scope.db
          .delete(phoneVerifications)
          .where(eq(phoneVerifications.id, input.row.id));
        return {
          status: 'reset' as const,
          blocked: account.status === 'blocked',
          sessionCount: revoked,
        };
      });

      if (outcome.status === 'reset') {
        input.events.emit({
          event: 'auth.password.reset',
          outcome: 'success',
          requestId: input.requestId,
          blocked: outcome.blocked,
          accountId: account.id,
        });
      }
      return outcome;
    },
  };
}

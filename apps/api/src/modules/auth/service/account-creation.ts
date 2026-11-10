// Account creation at verification: one transaction for the account, its
// credential, its session, and the pending row's deletion. Every library row is
// written through the transaction-scoped engine, so the unit of work is the one
// the library's adapter sees (FR-004, FR-034; ADR-151, T146).
import { eq } from 'drizzle-orm';
import type { SecurityEventPort } from '@wafar/shared';
import { phoneVerifications, type Database } from '@wafar/db';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import type { PendingRow } from '../../users/repository/phone-verifications.ts';

export type CreationOutcome =
  | { outcome: 'created'; userId: string; token: string; expiresAt: Date }
  | { outcome: 'existing_account' }
  | { outcome: 'blocked_account' }
  | { outcome: 'administrator_account' };

export interface CreationInput {
  row: PendingRow;
  now: Date;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  events?: SecurityEventPort;
}

export async function createAccount(
  db: Database,
  auth: AuthEngine,
  input: CreationInput,
): Promise<CreationOutcome> {
  const { row, now } = input;
  try {
    return await auth
      .transaction(async (scope) => {
        const users = createUsersRepository(scope.db);

        const account = await users.create({
          fullName: row.fullName ?? '',
          phoneNumber: row.phoneNumber,
          city: row.city ?? '',
          shopName: row.shopName,
          role: 'merchant',
        });

        await scope.auth.createCredential({
          userId: account.id,
          passwordHash: row.passwordHash ?? '',
        });
        const issued = await scope.auth.issue({
          userId: account.id,
          now,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        });
        await scope.db
          .delete(phoneVerifications)
          .where(eq(phoneVerifications.id, row.id));
        return {
          outcome: 'created' as const,
          userId: account.id,
          token: issued.token,
          expiresAt: issued.expiresAt,
        };
      })
      .then((result) => {
        input.events?.emit({
          event: 'auth.sign_up.verified',
          outcome: 'success',
          requestId: input.requestId,
          accountId: result.userId,
        });
        return result;
      });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await createUsersRepository(db).findByPhone(row.phoneNumber);
      if (existing !== null) {
        await db.delete(phoneVerifications).where(eq(phoneVerifications.id, row.id));
        if (existing.role === 'administrator') return { outcome: 'administrator_account' };
        if (existing.status === 'blocked') return { outcome: 'blocked_account' };
        return { outcome: 'existing_account' };
      }
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { code?: string; cause?: unknown };
  if (candidate.code === '23505') return true;
  return isUniqueViolation(candidate.cause);
}

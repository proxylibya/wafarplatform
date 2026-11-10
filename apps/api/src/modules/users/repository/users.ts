// The `users` module's account repository: the only writer of `users` rows
// after account creation, and the reader every lookup uses (data-model.md §4).
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { users, type Database, type Transaction } from '@wafar/db';

export type Queryable = Database | Transaction;

export interface UserRow {
  id: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  shopName: string | null;
  role: 'merchant' | 'administrator';
  status: 'active' | 'blocked';
  mustChangePassword: boolean;
  failedSignInCount: number;
  lockedUntil: Date | null;
}

function toRow(row: typeof users.$inferSelect): UserRow {
  return {
    id: row.id,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber,
    city: row.city,
    shopName: row.shopName,
    role: row.role === 'administrator' ? 'administrator' : 'merchant',
    status: row.status === 'blocked' ? 'blocked' : 'active',
    mustChangePassword: row.mustChangePassword,
    failedSignInCount: row.failedSignInCount,
    lockedUntil: row.lockedUntil,
  };
}

/** The reserved, non-routable sentinel derived from the canonical number. */
export function sentinelEmail(phoneNumber: string): string {
  return `${phoneNumber.replace(/^\+/, '')}@phone.invalid`;
}

export function newId(): string {
  return randomBytes(24).toString('base64url').slice(0, 32);
}

export function createUsersRepository(db: Queryable) {
  return {
    async findByPhone(phoneNumber: string): Promise<UserRow | null> {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber))
        .limit(1);
      const row = rows[0];
      return row === undefined ? null : toRow(row);
    },

    async findById(id: string): Promise<UserRow | null> {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const row = rows[0];
      return row === undefined ? null : toRow(row);
    },

    async create(input: {
      fullName: string;
      phoneNumber: string;
      city: string;
      shopName: string | null;
      role?: 'merchant' | 'administrator';
      mustChangePassword?: boolean;
    }): Promise<UserRow> {
      const rows = await db
        .insert(users)
        .values({
          id: newId(),
          fullName: input.fullName,
          email: sentinelEmail(input.phoneNumber),
          phoneNumber: input.phoneNumber,
          phoneNumberVerified: true,
          city: input.city,
          shopName: input.shopName,
          role: input.role ?? 'merchant',
          mustChangePassword: input.mustChangePassword ?? false,
        })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error('users insert returned no row');
      return toRow(row);
    },

    async clearForcedChange(userId: string): Promise<void> {
      await db
        .update(users)
        .set({ mustChangePassword: false, updatedAt: sql`now()` })
        .where(eq(users.id, userId));
    },
  };
}

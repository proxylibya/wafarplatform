// The lock's persistence: one conditional update, the success reset, the expiry
// clear, and the current-password check's lock refusal — the only writer of
// `users.failed_sign_in_count` and `users.locked_until` after account creation
// (FR-009, data-model.md §4).
import { and, eq, isNull, lte, or, sql } from 'drizzle-orm';
import {
  lockAfterFailures,
  lockMinutes,
  lockStateAt,
  type LockPort,
  type LockState,
} from '@wafar/shared';
import { users, type Database } from '@wafar/db';

export function createLockRepository(db: Database): LockPort {
  async function read(userId: string, now: Date): Promise<LockState> {
    const rows = await db
      .select({
        failedSignInCount: users.failedSignInCount,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const row = rows[0];
    if (row === undefined) return { failedCount: 0, lockedUntil: null };
    return lockStateAt(row.failedSignInCount, row.lockedUntil, now);
  }

  return {
    read,

    async recordFailedAttempt(userId: string, now: Date): Promise<LockState> {
      // An expired lock is cleared before the next attempt counts.
      await db
        .update(users)
        .set({ failedSignInCount: 0, lockedUntil: null, updatedAt: now })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.lockedUntil} IS NOT NULL`,
            lte(users.lockedUntil, now),
          ),
        );

      const rows = await db
        .update(users)
        .set({
          failedSignInCount: sql`${users.failedSignInCount} + 1`,
          lockedUntil: sql`CASE WHEN ${users.failedSignInCount} + 1 >= ${lockAfterFailures}
            THEN ${new Date(now.getTime() + lockMinutes * 60_000)}
            ELSE ${users.lockedUntil} END`,
          updatedAt: now,
        })
        .where(
          and(
            eq(users.id, userId),
            or(isNull(users.lockedUntil), lte(users.lockedUntil, now)),
          ),
        )
        .returning({
          failedSignInCount: users.failedSignInCount,
          lockedUntil: users.lockedUntil,
        });

      const row = rows[0];
      if (row === undefined) return read(userId, now);
      return {
        failedCount: row.failedSignInCount,
        lockedUntil: row.lockedUntil,
      };
    },

    async recordSuccess(userId: string, now: Date): Promise<void> {
      await db
        .update(users)
        .set({ failedSignInCount: 0, lockedUntil: null, updatedAt: now })
        .where(eq(users.id, userId));
    },

    async isLocked(userId: string, now: Date): Promise<boolean> {
      const state = await read(userId, now);
      return state.lockedUntil !== null;
    },
  };
}

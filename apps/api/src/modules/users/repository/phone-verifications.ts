// The pending-verification store's repository: one row per number, the
// resume-token hash, and the counters (data-model.md §7).
import { eq, lte, and, sql } from 'drizzle-orm';
import { phoneVerifications, type Database, type Transaction } from '@wafar/db';

export type Queryable = Database | Transaction;

export interface PendingRow {
  id: string;
  phoneNumber: string;
  purpose: 'sign_up' | 'recovery';
  state: 'pending' | 'verified';
  codeHash: string;
  /** The code an accepted resend superseded; never counted when entered. */
  previousCodeHash: string | null;
  codeExpiresAt: Date;
  requestExpiresAt: Date;
  incorrectEntries: number;
  reRequests: number;
  resumeTokenHash: string;
  fullName: string | null;
  city: string | null;
  shopName: string | null;
  passwordHash: string | null;
  verifiedAt: Date | null;
}

function toRow(row: typeof phoneVerifications.$inferSelect): PendingRow {
  return {
    id: row.id,
    phoneNumber: row.phoneNumber,
    purpose: row.purpose === 'recovery' ? 'recovery' : 'sign_up',
    state: row.state === 'verified' ? 'verified' : 'pending',
    codeHash: row.codeHash,
    previousCodeHash: row.previousCodeHash,
    codeExpiresAt: row.codeExpiresAt,
    requestExpiresAt: row.requestExpiresAt,
    incorrectEntries: row.incorrectEntries,
    reRequests: row.reRequests,
    resumeTokenHash: row.resumeTokenHash,
    fullName: row.fullName,
    city: row.city,
    shopName: row.shopName,
    passwordHash: row.passwordHash,
    verifiedAt: row.verifiedAt,
  };
}

export function createPhoneVerificationsRepository(db: Queryable) {
  return {
    async findByPhone(phoneNumber: string): Promise<PendingRow | null> {
      const rows = await db
        .select()
        .from(phoneVerifications)
        .where(eq(phoneVerifications.phoneNumber, phoneNumber))
        .limit(1);
      const row = rows[0];
      return row === undefined ? null : toRow(row);
    },

    async findById(id: string): Promise<PendingRow | null> {
      const rows = await db
        .select()
        .from(phoneVerifications)
        .where(eq(phoneVerifications.id, id))
        .limit(1);
      const row = rows[0];
      return row === undefined ? null : toRow(row);
    },

    async upsert(row: PendingRow): Promise<void> {
      await db
        .insert(phoneVerifications)
        .values({
          id: row.id,
          phoneNumber: row.phoneNumber,
          purpose: row.purpose,
          state: row.state,
          codeHash: row.codeHash,
          previousCodeHash: row.previousCodeHash,
          codeExpiresAt: row.codeExpiresAt,
          requestExpiresAt: row.requestExpiresAt,
          incorrectEntries: row.incorrectEntries,
          reRequests: row.reRequests,
          resumeTokenHash: row.resumeTokenHash,
          fullName: row.fullName,
          city: row.city,
          shopName: row.shopName,
          passwordHash: row.passwordHash,
          verifiedAt: row.verifiedAt,
        })
        .onConflictDoUpdate({
          target: phoneVerifications.phoneNumber,
          // A replacement is a new request, so its identifier is the one the
          // response and the resume cookie carry (FR-034, AC-036).
          set: {
            id: row.id,
            purpose: row.purpose,
            state: row.state,
            codeHash: row.codeHash,
            previousCodeHash: row.previousCodeHash,
            codeExpiresAt: row.codeExpiresAt,
            requestExpiresAt: row.requestExpiresAt,
            incorrectEntries: row.incorrectEntries,
            reRequests: row.reRequests,
            resumeTokenHash: row.resumeTokenHash,
            fullName: row.fullName,
            city: row.city,
            shopName: row.shopName,
            passwordHash: row.passwordHash,
            verifiedAt: row.verifiedAt,
            updatedAt: new Date(),
          },
        });
    },

    async deleteById(id: string): Promise<void> {
      await db.delete(phoneVerifications).where(eq(phoneVerifications.id, id));
    },

    async deleteByPhone(phoneNumber: string): Promise<void> {
      await db
        .delete(phoneVerifications)
        .where(eq(phoneVerifications.phoneNumber, phoneNumber));
    },

    async incrementIncorrect(id: string, now: Date): Promise<number> {
      const rows = await db
        .update(phoneVerifications)
        .set({
          incorrectEntries: sql`${phoneVerifications.incorrectEntries} + 1`,
          updatedAt: now,
        })
        .where(eq(phoneVerifications.id, id))
        .returning({ incorrectEntries: phoneVerifications.incorrectEntries });
      return rows[0]?.incorrectEntries ?? 0;
    },

    async incrementReRequests(id: string, now: Date): Promise<number> {
      const rows = await db
        .update(phoneVerifications)
        .set({
          reRequests: sql`${phoneVerifications.reRequests} + 1`,
          updatedAt: now,
        })
        .where(eq(phoneVerifications.id, id))
        .returning({ reRequests: phoneVerifications.reRequests });
      return rows[0]?.reRequests ?? 0;
    },

    async claimReRequest(
      id: string,
      now: Date,
      max: number,
    ): Promise<number | null> {
      const rows = await db
        .update(phoneVerifications)
        .set({
          reRequests: sql`${phoneVerifications.reRequests} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(phoneVerifications.id, id),
            eq(phoneVerifications.state, 'pending'),
            sql`${phoneVerifications.reRequests} < ${max}`,
          ),
        )
        .returning({ reRequests: phoneVerifications.reRequests });
      return rows[0]?.reRequests ?? null;
    },

    async releaseReRequest(id: string, now: Date): Promise<void> {
      await db
        .update(phoneVerifications)
        .set({
          reRequests: sql`GREATEST(${phoneVerifications.reRequests} - 1, 0)`,
          updatedAt: now,
        })
        .where(eq(phoneVerifications.id, id));
    },

    async updateCode(input: {
      id: string;
      codeHash: string;
      previousCodeHash: string;
      codeExpiresAt: Date;
      requestExpiresAt: Date;
      now: Date;
    }): Promise<void> {
      await db
        .update(phoneVerifications)
        .set({
          codeHash: input.codeHash,
          previousCodeHash: input.previousCodeHash,
          codeExpiresAt: input.codeExpiresAt,
          requestExpiresAt: input.requestExpiresAt,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(phoneVerifications.id, input.id),
            eq(phoneVerifications.state, 'pending'),
          ),
        );
    },

    async markVerified(id: string, now: Date): Promise<void> {
      await db
        .update(phoneVerifications)
        .set({ state: 'verified', verifiedAt: now, updatedAt: now })
        .where(eq(phoneVerifications.id, id));
    },

    async deleteExpired(now: Date): Promise<number> {
      const rows = await db
        .delete(phoneVerifications)
        .where(
          and(
            lte(phoneVerifications.requestExpiresAt, now),
            eq(phoneVerifications.state, 'pending'),
          ),
        )
        .returning({ id: phoneVerifications.id });
      return rows.length;
    },
  };
}

// The operational rows' hourly bound: exactly the past-bound rows go, the
// inside rows stay, a second run deletes nothing, a concurrent run behind the
// advisory lock skips, no account row is touched, and the statements read the
// four indexes the bound names (FR-018, AC-020; T153).
import { sql } from 'drizzle-orm';
import { Client } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sweep } from '@wafar/db/sweeps';
import {
  DATABASE_URL,
  createHarness,
  hasDatabase,
  seedAccount,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;

async function count(table: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (rows.rows[0] as { n: number }).n;
}

describe.skipIf(!hasDatabase)('the operational sweep', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('deletes exactly the past-bound rows, idempotently and behind the lock', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password: 'merchant password value',
    });

    // One row past and one inside each bound. The inserts and the first sweep
    // share one transaction, so `now()` is the same instant on both sides and
    // the millisecond boundary is decided rather than raced.
    const db = harness!.db;
    const { first, second } = await db.transaction(async (tx) => {
      // The base is truncated to the column's millisecond precision, so the
      // 1 ms boundary is the same instant on both sides of the comparison.
      await tx.execute(sql`
        INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at, revoked_at, revoked_reason)
        VALUES
          ('sweep-revoked-past', ${account.id}, repeat('a', 40), date_trunc('milliseconds', now()) + interval '1 hour', date_trunc('milliseconds', now()), date_trunc('milliseconds', now()) - interval '24 hours', 'sign_out'),
          ('sweep-revoked-inside', ${account.id}, repeat('b', 40), date_trunc('milliseconds', now()) + interval '1 hour', date_trunc('milliseconds', now()), date_trunc('milliseconds', now()) - interval '24 hours' + interval '1 millisecond', 'sign_out'),
          ('sweep-expired-past', ${account.id}, repeat('c', 40), date_trunc('milliseconds', now()) - interval '24 hours', date_trunc('milliseconds', now()) - interval '2 hours', NULL, NULL),
          ('sweep-expired-inside', ${account.id}, repeat('d', 40), date_trunc('milliseconds', now()) - interval '24 hours' + interval '1 millisecond', date_trunc('milliseconds', now()) - interval '2 hours', NULL, NULL)
      `);
      await tx.execute(sql`
        INSERT INTO phone_verifications
          (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at, resume_token_hash)
        VALUES
          ('sweep-pending-past', '+218900000001', 'recovery', 'pending', 'past', date_trunc('milliseconds', now()) - interval '1 second', date_trunc('milliseconds', now()) - interval '1 second', 'past'),
          ('sweep-pending-inside', '+218900000002', 'recovery', 'pending', 'inside', date_trunc('milliseconds', now()) + interval '1 hour', date_trunc('milliseconds', now()) + interval '1 hour', 'inside')
      `);
      await tx.execute(sql`
        INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
        VALUES
          ('sweep:origin:past', date_trunc('milliseconds', now()) - interval '2 hours', 1, date_trunc('milliseconds', now()) - interval '1 hour'),
          ('sweep:origin:inside', date_trunc('milliseconds', now()), 1, date_trunc('milliseconds', now()) + interval '1 hour')
      `);
      const firstSweep = await sweep(tx as unknown as typeof db);
      // A second run at the same instant deletes nothing.
      const secondSweep = await sweep(tx as unknown as typeof db);
      return { first: firstSweep, second: secondSweep };
    });
    expect(first).toEqual({
      rateLimitCounters: 1,
      sessions: 2,
      phoneVerifications: 1,
    });
    expect(second).toEqual({
      rateLimitCounters: 0,
      sessions: 0,
      phoneVerifications: 0,
    });

    // Only the inside rows remain.
    const sessionIds = (
      await harness!.db.execute(sql`SELECT id FROM sessions ORDER BY id`)
    ).rows as Array<{ id: string }>;
    expect(sessionIds.map((row) => row.id)).toEqual([
      'sweep-expired-inside',
      'sweep-revoked-inside',
    ]);
    const pendingIds = (
      await harness!.db.execute(sql`SELECT id FROM phone_verifications ORDER BY id`)
    ).rows as Array<{ id: string }>;
    expect(pendingIds.map((row) => row.id)).toEqual(['sweep-pending-inside']);
    const counterKeys = (
      await harness!.db.execute(sql`SELECT key FROM rate_limit_counters ORDER BY key`)
    ).rows as Array<{ key: string }>;
    expect(counterKeys.map((row) => row.key)).toEqual(['sweep:origin:inside']);

    // Nothing an account owns is deleted: this is an operational bound only.
    expect(await count('users')).toBe(1);
    expect(await count('accounts')).toBe(1);

    // A concurrent run behind the advisory lock skips entirely.
    const blocker = new Client({ connectionString: DATABASE_URL });
    await blocker.connect();
    try {
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock(77001)');
      await harness!.db.execute(sql`
        INSERT INTO phone_verifications
          (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at, resume_token_hash)
        VALUES
          ('sweep-blocked', '+218900000003', 'recovery', 'pending', 'blocked', now() - interval '1 second', now() - interval '1 second', 'blocked')
      `);
      const skipped = await sweep(harness!.db);
      expect(skipped).toBeNull();
      expect(await count('phone_verifications')).toBe(2);
      await blocker.query('ROLLBACK');
    } finally {
      await blocker.end();
    }

    // The four indexes the bound names exist, and the statements read them.
    const indexes = (
      await harness!.db.execute(sql`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN (
            'sessions_revoked_at_idx',
            'sessions_expires_at_idx',
            'phone_verifications_request_expires_at_idx',
            'rate_limit_counters_expires_at_idx'
          )
      `)
    ).rows as Array<{ indexname: string }>;
    expect(indexes.map((row) => row.indexname).sort()).toEqual([
      'phone_verifications_request_expires_at_idx',
      'rate_limit_counters_expires_at_idx',
      'sessions_expires_at_idx',
      'sessions_revoked_at_idx',
    ]);

    await harness!.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL enable_seqscan = off`);
      const plans = await Promise.all([
        tx.execute(sql`EXPLAIN DELETE FROM rate_limit_counters WHERE expires_at <= now()`),
        tx.execute(sql`
          EXPLAIN DELETE FROM sessions
          WHERE (revoked_at IS NOT NULL AND revoked_at <= now() - interval '24 hours')
             OR (revoked_at IS NULL AND expires_at <= now() - interval '24 hours')
        `),
        tx.execute(sql`EXPLAIN DELETE FROM phone_verifications WHERE request_expires_at <= now()`),
      ]);
      const text = plans
        .map((plan) => (plan.rows as Array<Record<string, unknown>>).map((row) => Object.values(row).join(' ')).join(' '))
        .join(' ');
      expect(text).toContain('sessions_expires_at_idx');
      expect(text).toContain('sessions_revoked_at_idx');
      expect(text).toContain('phone_verifications_request_expires_at_idx');
      expect(text).toContain('rate_limit_counters_expires_at_idx');
    });
  });
});

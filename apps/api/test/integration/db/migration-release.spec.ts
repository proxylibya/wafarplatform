// The release boundary and the migration's neutrality: the boot guard opens at
// the embedded version and refuses another applied count, a later release's
// additive step leaves the live session with both clocks, the lock and its count,
// the pending request with its code and allowance, and the spent window exactly
// as they were, and every committed migration carries no data statement against
// the four state tables (FR-054; AC-060; T150).
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EXPECTED_SCHEMA_STEPS } from '@wafar/db/schema-version';
import {
  createScratchDatabase,
  migrateScratch,
  migrationFiles,
  stampMigrations,
  statementsOf,
  type Scratch,
} from '../../support/scratch.ts';
import { assertSchemaVersion } from '../../../src/http/schema-guard.ts';

const hasDatabase = process.env['DATABASE_URL'] !== undefined;

const token = 'release-boundary-token'.padEnd(40, 'r');
const pendingToken = 'release-pending-token';
const requestId = 'release-pending-request';

interface Snapshot {
  session: Record<string, unknown> | undefined;
  lock: Record<string, unknown> | undefined;
  pending: Record<string, unknown> | undefined;
  window: Record<string, unknown> | undefined;
}

describe.skipIf(!hasDatabase)('the release boundary', () => {
  let scratch: Scratch;

  async function one(statement: string): Promise<Record<string, unknown> | undefined> {
    const rows = await scratch.db.execute(sql.raw(statement));
    return rows.rows[0] as Record<string, unknown> | undefined;
  }

  async function snapshot(): Promise<Snapshot> {
    return {
      session: await one(
        "SELECT id, user_id, token, expires_at, last_activity_at, revoked_at, revoked_reason FROM sessions WHERE id = 'release-session'",
      ),
      lock: await one(
        "SELECT failed_sign_in_count, locked_until FROM users WHERE id = 'release-account'",
      ),
      pending: await one(
        "SELECT id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at, incorrect_entries, re_requests FROM phone_verifications WHERE id = 'release-pending-request'",
      ),
      window: await one(
        "SELECT key, window_start, count, expires_at FROM rate_limit_counters WHERE key = 'account_creation:origin:unknown'",
      ),
    };
  }

  beforeAll(async () => {
    scratch = await createScratchDatabase('release');
    await migrateScratch(scratch);
  });

  afterAll(async () => {
    await scratch.drop();
  });

  it('opens at the expected version and refuses another applied count', async () => {
    await expect(assertSchemaVersion(scratch.db)).resolves.toBeUndefined();

    await stampMigrations(scratch.db, 0);
    await expect(assertSchemaVersion(scratch.db)).rejects.toThrow(
      /schema version mismatch/,
    );

    await stampMigrations(scratch.db, EXPECTED_SCHEMA_STEPS + 1);
    await expect(assertSchemaVersion(scratch.db)).rejects.toThrow(
      new RegExp(
        `expected ${EXPECTED_SCHEMA_STEPS} applied step\\(s\\), found ${EXPECTED_SCHEMA_STEPS + 1}`,
      ),
    );

    await stampMigrations(scratch.db, EXPECTED_SCHEMA_STEPS);
    await expect(assertSchemaVersion(scratch.db)).resolves.toBeUndefined();
  });

  it('leaves every operational row as it was when a later release adds a step', async () => {
    const now = new Date('2026-03-01T10:00:00.000Z');
    const later = new Date(now.getTime() + 3600_000);
    await scratch.db.execute(sql`
      INSERT INTO users (id, full_name, email, phone_number, city, failed_sign_in_count, locked_until)
      VALUES ('release-account', 'محمد علي', '218912345678@phone.invalid', '+218912345678', 'طرابلس', 3, ${later.toISOString()})
    `);
    await scratch.db.execute(sql`
      INSERT INTO accounts (id, user_id, account_id, provider_id, password)
      VALUES ('release-credential', 'release-account', 'release-account', 'credential', '$wafar$scrypt$release')
    `);
    await scratch.db.execute(sql`
      INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
      VALUES ('release-session', 'release-account', ${token}, ${later.toISOString()}, ${now.toISOString()})
    `);
    await scratch.db.execute(sql`
      INSERT INTO phone_verifications
        (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at,
         incorrect_entries, re_requests, resume_token_hash, full_name, city)
      VALUES (${requestId}, '+218912345679', 'sign_up', 'pending', 'release-code-hash',
              ${later.toISOString()}, ${later.toISOString()}, 1, 2, ${pendingToken}, 'سالم', 'طرابلس')
    `);
    await scratch.db.execute(sql`
      INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
      VALUES ('account_creation:origin:unknown', ${now.toISOString()}, 20, ${later.toISOString()})
    `);

    const before = await snapshot();
    expect(before.session).toMatchObject({ revoked_at: null });
    expect(before.lock).toMatchObject({ failed_sign_in_count: 3 });
    expect(before.pending).toMatchObject({ incorrect_entries: 1, re_requests: 2 });
    expect(before.window).toMatchObject({ count: 20 });
    expect(await one('SELECT count(*)::int AS n FROM sessions')).toMatchObject({ n: 1 });
    expect(
      await one('SELECT count(*)::int AS n FROM phone_verifications'),
    ).toMatchObject({ n: 1 });

    // A test-only additive migration stands in for a later release's step.
    await scratch.db.execute(
      sql.raw(
        'ALTER TABLE "users" ADD COLUMN "release_probe" boolean DEFAULT false NOT NULL',
      ),
    );
    await stampMigrations(scratch.db, EXPECTED_SCHEMA_STEPS + 1);
    await expect(assertSchemaVersion(scratch.db)).rejects.toThrow(
      /schema version mismatch/,
    );
    await stampMigrations(scratch.db, EXPECTED_SCHEMA_STEPS);

    // Every clock, count, code, and window reads exactly as it did: no session
    // ended, no lock lifted or applied, no pending request ended, no window reset.
    expect(await snapshot()).toEqual(before);
  });

  it('carries no data statement against the four state tables', () => {
    // Every committed migration is neutral, not only the first (T150, T245).
    for (const file of migrationFiles) {
      const statements = statementsOf(readFileSync(file, 'utf8'));
      const forbidden = statements.filter((statement) =>
        /^\s*(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"?(users|accounts|sessions|phone_verifications|rate_limit_counters|verifications)\b/i.test(
          statement,
        ),
      );
      expect(forbidden, file).toEqual([]);
      for (const statement of statements) {
        expect(statement, file).toMatch(/^(CREATE|ALTER|DROP|COMMENT)\b/i);
      }
    }
  });
});

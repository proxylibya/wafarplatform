// The release's rollback: the committed down migrations remove the six tables
// and the column the later step adds, the journal reads zero, the boot guard
// refuses to serve across the down state, and re-applying the ups restores the
// exact inverse with the seeded state of the rolled-back version gone — the
// session ended, the lock and its count gone, the pending request ended, and the
// window unspent (FR-055; AC-062; T151, T245).
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  applySql,
  createScratchDatabase,
  expectedSteps,
  migrateScratch,
  migrationDownFiles,
  migrationFiles,
  stampMigrations,
  stateTables,
  tableNames,
  type Scratch,
} from '../../support/scratch.ts';
import { assertSchemaVersion } from '../../../src/http/schema-guard.ts';

const hasDatabase = process.env['DATABASE_URL'] !== undefined;

describe.skipIf(!hasDatabase)("the release's rollback", () => {
  let scratch: Scratch;
  let applied: string[] = [];

  async function one(statement: string): Promise<Record<string, unknown> | undefined> {
    const rows = await scratch.db.execute(sql.raw(statement));
    return rows.rows[0] as Record<string, unknown> | undefined;
  }

  beforeAll(async () => {
    scratch = await createScratchDatabase('rollback');
    await migrateScratch(scratch);
  });

  afterAll(async () => {
    await scratch.drop();
  });

  it('removes the six tables, empties the journal, and re-applies as the exact inverse', async () => {
    applied = await tableNames(scratch.db);
    for (const table of stateTables) {
      expect(applied).toContain(table);
    }

    // The representative row set the six tables hold at the version being rolled
    // back.
    const now = new Date('2026-03-01T10:00:00.000Z');
    const later = new Date(now.getTime() + 3600_000);
    await scratch.db.execute(sql`
      INSERT INTO users (id, full_name, email, phone_number, city, failed_sign_in_count, locked_until)
      VALUES ('rollback-account', 'محمد علي', '218912345678@phone.invalid', '+218912345678', 'طرابلس', 4, ${later.toISOString()})
    `);
    await scratch.db.execute(sql`
      INSERT INTO accounts (id, user_id, account_id, provider_id, password)
      VALUES ('rollback-credential', 'rollback-account', 'rollback-account', 'credential', '$wafar$scrypt$rollback')
    `);
    await scratch.db.execute(sql`
      INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
      VALUES ('rollback-session', 'rollback-account', ${'rollback-token-value'.padEnd(40, 'r')}, ${later.toISOString()}, ${now.toISOString()})
    `);
    await scratch.db.execute(sql`
      INSERT INTO phone_verifications
        (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at,
         resume_token_hash, full_name, city)
      VALUES ('rollback-request', '+218912345679', 'sign_up', 'pending', 'rollback-code-hash',
              ${later.toISOString()}, ${later.toISOString()}, 'rollback-resume', 'سالم', 'طرابلس')
    `);
    await scratch.db.execute(sql`
      INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
      VALUES ('sign_in:origin:unknown', ${now.toISOString()}, 5, ${later.toISOString()})
    `);
    // The adapter's placeholder is empty in production; one row proves the down
    // migration takes it with the rest.
    await scratch.db.execute(sql`
      INSERT INTO verifications (id, identifier, value, expires_at)
      VALUES ('rollback-placeholder', 'placeholder', 'placeholder', ${later.toISOString()})
    `);

    expect(await one('SELECT count(*)::int AS n FROM users')).toMatchObject({ n: 1 });
    expect(await one('SELECT count(*)::int AS n FROM accounts')).toMatchObject({ n: 1 });
    expect(await one('SELECT count(*)::int AS n FROM sessions')).toMatchObject({ n: 1 });
    expect(await one('SELECT count(*)::int AS n FROM phone_verifications')).toMatchObject({
      n: 1,
    });
    expect(await one('SELECT count(*)::int AS n FROM rate_limit_counters')).toMatchObject({
      n: 1,
    });

    // The down migrations in reverse order, then the journal step the migrator
    // performs with them.
    for (const file of migrationDownFiles) {
      await applySql(scratch.db, readFileSync(file, 'utf8'));
    }
    await stampMigrations(scratch.db, 0);

    const afterDown = await tableNames(scratch.db);
    for (const table of stateTables) {
      expect(afterDown).not.toContain(table);
    }
    expect(
      await one('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations'),
    ).toMatchObject({ n: 0 });

    // The boot guard refuses to serve across the down state.
    await expect(assertSchemaVersion(scratch.db)).rejects.toThrow(
      /schema version mismatch/,
    );

    // Re-applying the ups restores the exact inverse: the same tables, and none
    // of the state written under the version that was rolled back.
    for (const file of migrationFiles) {
      await applySql(scratch.db, readFileSync(file, 'utf8'));
    }
    await stampMigrations(scratch.db, expectedSteps);
    expect(await tableNames(scratch.db)).toEqual(applied);

    for (const table of stateTables) {
      const count = await one(`SELECT count(*)::int AS n FROM "${table}"`);
      expect(count).toMatchObject({ n: 0 });
    }
    await expect(assertSchemaVersion(scratch.db)).resolves.toBeUndefined();

    // The holder can register again from an empty schema: the session's ending
    // ended nothing else, and the lock and the window carry no residue.
    expect(await one('SELECT count(*)::int AS n FROM users')).toMatchObject({ n: 0 });
  });
});

// The boot guard against a real database: readiness at the embedded version and
// the refusal an unmigrated (or differently migrated) database receives before
// the listener could open. Both cases run in a rolled-back transaction, so the
// shared fixture is left exactly as the migration wrote it (T126).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '@wafar/db';
import {
  EXPECTED_SCHEMA_SHA256,
  EXPECTED_SCHEMA_STEPS,
  SCHEMA_VERSION,
} from '@wafar/db/schema-version';
import { assertSchemaVersion } from '../../../src/http/schema-guard.ts';
import { migrationsDir } from '../../support/scratch.ts';

const DATABASE_URL = process.env['DATABASE_URL'];
const hasDatabase = DATABASE_URL !== undefined;

const rollback = Symbol('rollback');

async function inRolledBackTransaction(
  db: Database,
  work: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<void>,
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe.skipIf(!hasDatabase)('the schema-version guard', () => {
  let client: ReturnType<typeof createDatabase>;

  beforeAll(() => {
    client = createDatabase(DATABASE_URL!);
  });

  afterAll(async () => {
    await client.pool.end();
  });

  it('reads the version the journal stamped', () => {
    // The embedded constant is generated from the journal; this asserts the
    // generated file and the journal have not drifted apart (T126, T245).
    const journal = JSON.parse(
      readFileSync(join(migrationsDir, 'meta', '_journal.json'), 'utf8'),
    ) as { entries: unknown[] };
    expect(EXPECTED_SCHEMA_STEPS).toBe(journal.entries.length);
    expect(EXPECTED_SCHEMA_SHA256).toMatch(/^[0-9a-f]{64}$/);
    expect(SCHEMA_VERSION).toBe(
      `${EXPECTED_SCHEMA_SHA256.slice(0, 12)}:${EXPECTED_SCHEMA_STEPS}`,
    );
  });

  it('opens at the expected version', async () => {
    await expect(assertSchemaVersion(client.db)).resolves.toBeUndefined();
  });

  it('refuses a database with no applied migration, and opens once the row is back', async () => {
    await inRolledBackTransaction(client.db, async (tx) => {
      await tx.execute(sql`DELETE FROM drizzle.__drizzle_migrations`);
      await expect(assertSchemaVersion(tx)).rejects.toThrow(
        /schema version mismatch/,
      );
    });
    // The rollback restored the applied row the guard reads.
    await expect(assertSchemaVersion(client.db)).resolves.toBeUndefined();
  });

  it('refuses a database at another applied count', async () => {
    await inRolledBackTransaction(client.db, async (tx) => {
      await tx.execute(
        sql`INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (999, 'drift', 0)`,
      );
      await expect(assertSchemaVersion(tx)).rejects.toThrow(
        new RegExp(
          `expected ${EXPECTED_SCHEMA_STEPS} applied step\\(s\\), found ${EXPECTED_SCHEMA_STEPS + 1}`,
        ),
      );
    });
  });
});

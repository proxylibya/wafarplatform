// The boot-time schema-version guard: the listener opens only when the applied
// migration count equals the journal the build embedded (T126, AC-060).
import { sql } from 'drizzle-orm';
import {
  EXPECTED_SCHEMA_SHA256,
  EXPECTED_SCHEMA_STEPS,
} from '@wafar/db/schema-version';
import type { Database } from '@wafar/db';

export interface SchemaReader {
  execute: Database['execute'];
}

/** Throws when the database is unmigrated or at another version. */
export async function assertSchemaVersion(db: SchemaReader): Promise<void> {
  const result = await db.execute(
    sql`SELECT count(*)::int AS applied FROM drizzle.__drizzle_migrations`,
  );
  const applied =
    (result.rows[0] as { applied?: number } | undefined)?.applied ?? -1;
  if (applied !== EXPECTED_SCHEMA_STEPS) {
    throw new Error(
      `schema version mismatch: expected ${EXPECTED_SCHEMA_STEPS} applied step(s), found ${applied} (journal ${EXPECTED_SCHEMA_SHA256.slice(0, 12)})`,
    );
  }
}

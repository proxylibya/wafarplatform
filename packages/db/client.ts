// The database client: one pooled connection per process, parameterized
// statements only, and a 2 s statement timeout as the hard ceiling (CMV 7).
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.ts';

export type Database = ReturnType<typeof createDatabase>['db'];
export type Transaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];

export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 10,
    statement_timeout: 2000,
    query_timeout: 2000,
  });
  const db = drizzle(pool, { schema, casing: 'snake_case' });
  return { pool, db };
}

let singleton: ReturnType<typeof createDatabase> | undefined;

/** The process's single client, created on first use. */
export function database(): ReturnType<typeof createDatabase> {
  if (singleton === undefined) {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL is not set');
    singleton = createDatabase(url);
  }
  return singleton;
}

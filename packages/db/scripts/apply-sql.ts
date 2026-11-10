// Applies one migration file statement by statement with an explicit timeout.
// The canonical path remains `drizzle-orm`'s migrator; this script exists for a
// development database whose statement timeout is shorter than the migrator's
// single transaction.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const file = process.argv[2] ?? 'migrations/0001_identity_foundation.sql';
const sqlText = readFileSync(file, 'utf8');
const statements = sqlText
  .split('--> statement-breakpoint')
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0);

const client = new Client({
  connectionString: process.env['DATABASE_URL'],
  connectionTimeoutMillis: 5000,
  statement_timeout: 60000,
});
await client.connect();

await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
await client.query(`
  CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
    id serial primary key,
    hash text not null,
    created_at bigint
  )
`);

for (const statement of statements) {
  await client.query(statement);
  console.log('applied:', statement.split('\n')[0]?.slice(0, 72));
}

const hash = createHash('sha256').update(sqlText).digest('hex');
await client.query(
  'INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
  [hash, Date.now()],
);
console.log(`Recorded migration ${hash.slice(0, 12)} (${statements.length} statements).`);
await client.end();

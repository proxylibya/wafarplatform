// Probes DDL and the drizzle catalog the migrator needs.
import { Client } from 'pg';

const client = new Client({
  connectionString: process.argv[2] ?? 'postgres://wafar:wafar@localhost:5432/wafar',
  connectionTimeoutMillis: 5000,
});
await client.connect();
for (const query of [
  'CREATE SCHEMA IF NOT EXISTS probe',
  'CREATE TABLE IF NOT EXISTS probe.t (id int)',
  'INSERT INTO probe.t VALUES (1)',
  'SELECT count(*)::int AS n FROM probe.t',
  'CREATE SCHEMA IF NOT EXISTS drizzle',
  'CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (id serial primary key, hash text, created_at bigint)',
  'SELECT count(*)::int AS n FROM pg_class',
]) {
  try {
    const result = await client.query(query);
    console.log('ok  ', query, '->', JSON.stringify(result.rows));
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    console.log('fail', query, '->', failure.code, failure.message);
  }
}
await client.query('DROP SCHEMA IF EXISTS probe CASCADE');
await client.end();

// Drops the public and drizzle schemas for a clean development reset.
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env['DATABASE_URL'],
  connectionTimeoutMillis: 5000,
  statement_timeout: 60000,
});
await client.connect();
for (const statement of [
  'DROP SCHEMA IF EXISTS public CASCADE',
  'CREATE SCHEMA public',
  'DROP SCHEMA IF EXISTS drizzle CASCADE',
]) {
  try {
    await client.query(statement);
    console.log('ok  ', statement);
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    console.log('fail', statement, '->', failure.code, failure.message);
  }
}
await client.end();

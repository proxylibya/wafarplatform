// Exercises a handful of catalog queries to see what the local server answers.
import { Client } from 'pg';

const url = process.argv[2] ?? 'postgres://wafar:wafar@localhost:5432/wafar';
const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
await client.connect();
for (const query of [
  'SELECT 1 AS one',
  'SELECT current_database() AS db, current_user AS who',
  'SELECT count(*)::int AS schemas FROM information_schema.schemata',
  'SELECT table_name FROM information_schema.tables LIMIT 5',
]) {
  try {
    const result = await client.query(query);
    console.log('ok  ', query, '->', JSON.stringify(result.rows));
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    console.log('fail', query, '->', failure.code, failure.message);
  }
}
await client.end();

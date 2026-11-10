// Probes a PostgreSQL connection for the local development loop.
import { Client } from 'pg';

const url = process.argv[2];
const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  const result = await client.query('SELECT 1 AS one');
  console.log('connected:', result.rows[0]?.one);
  await client.end();
} catch (error) {
  console.error('failed:', error);
  process.exit(1);
}

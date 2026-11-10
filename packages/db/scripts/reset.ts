// Resets a development database: drops the public schema, recreates it, and
// reapplies the migrations. Never run against staging or production.
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';

if (process.env['NODE_ENV'] === 'production') {
  console.error('db:reset refuses to run in production');
  process.exit(1);
}

const url = process.env['DATABASE_URL'];
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);

await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
await db.execute(sql`CREATE SCHEMA public`);
await migrate(db, { migrationsFolder: 'migrations' });
console.log('Database reset and migrated.');
await pool.end();

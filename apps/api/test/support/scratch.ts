// A scratch database for one suite: created through the PostgreSQL client, the
// committed migration files applied to it, and dropped at the end, so a
// migration or restore drill never touches the shared fixture (T150-T152).
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { Client } from 'pg';
import { createDatabase, type Database } from '@wafar/db';
import { sql } from 'drizzle-orm';

export const migrationsDir = join(process.cwd(), 'packages', 'db', 'migrations');

interface Journal {
  entries: Array<{ tag: string }>;
}

/** The committed journal: the one list of the migrations this build embeds. */
export const migrationJournal = JSON.parse(
  readFileSync(join(migrationsDir, 'meta', '_journal.json'), 'utf8'),
) as Journal;

if (migrationJournal.entries.length === 0) {
  throw new Error('the migration journal is empty');
}

/** Every committed up migration, in the order the migrator applies it. */
export const migrationFiles = migrationJournal.entries.map((entry) =>
  join(migrationsDir, `${entry.tag}.sql`),
);

/** The paired down migrations in reverse order: the rollback's order. */
export const migrationDownFiles = [...migrationJournal.entries]
  .reverse()
  .map((entry) => join(migrationsDir, `${entry.tag}.down.sql`));

/** The applied step count the build embeds; the boot guard reads it (T126). */
export const expectedSteps = migrationJournal.entries.length;

/** The six tables of the first migration. */
export const stateTables = [
  'users',
  'accounts',
  'sessions',
  'phone_verifications',
  'verifications',
  'rate_limit_counters',
] as const;

export interface Scratch {
  name: string;
  url: string;
  db: Database;
  pool: ReturnType<typeof createDatabase>['pool'];
  drop: () => Promise<void>;
}

export function withDatabase(base: string, database: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}

function baseUrl(): string {
  const base = process.env['DATABASE_URL'];
  if (base === undefined) throw new Error('DATABASE_URL is not set');
  return base;
}

/** Splits the committed migration into the statements the journal runs. */
export function statementsOf(text: string): string[] {
  return text
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function applySql(db: Database, text: string): Promise<string[]> {
  const statements = statementsOf(text);
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
  return statements;
}

/** The journal row the migrator writes, so the boot guard reads every step. */
export async function stampMigrations(
  db: Database,
  steps = expectedSteps,
): Promise<void> {
  await db.execute(sql.raw('CREATE SCHEMA IF NOT EXISTS drizzle'));
  await db.execute(
    sql.raw(
      'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations ' +
        '(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)',
    ),
  );
  await db.execute(sql.raw('DELETE FROM drizzle.__drizzle_migrations'));
  for (let step = 0; step < steps; step += 1) {
    await db.execute(
      sql.raw(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('scratch-${step}', ${step})`,
      ),
    );
  }
}

export async function createScratchDatabase(label: string): Promise<Scratch> {
  const base = baseUrl();
  const name = `wafar_scratch_${label}_${randomBytes(4).toString('hex')}`.toLowerCase();
  const admin = new Client({ connectionString: base });
  await admin.connect();
  // The development role carries a 2 s statement timeout; creating a database
  // is not one of the statements the product's budget governs.
  await admin.query('SET statement_timeout = 0');
  await admin.query(`CREATE DATABASE "${name}"`);
  await admin.end();

  const url = withDatabase(base, name);
  const { db, pool } = createDatabase(url);
  return {
    name,
    url,
    db,
    pool,
    async drop() {
      await pool.end();
      const drop = new Client({ connectionString: base });
      await drop.connect();
      await drop.query('SET statement_timeout = 0');
      await drop.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await drop.end();
    },
  };
}

/** Applies every committed up migration and stamps its journal row. */
export async function migrateScratch(scratch: Scratch): Promise<void> {
  for (const file of migrationFiles) {
    await applySql(scratch.db, readFileSync(file, 'utf8'));
  }
  await stampMigrations(scratch.db);
}

export async function tableNames(db: Database): Promise<string[]> {
  const rows = await db.execute(
    sql.raw(
      `SELECT table_name::text AS name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`,
    ),
  );
  return (rows.rows as Array<{ name: string }>).map((row) => row.name);
}

/** The PostgreSQL client binaries the restore drill runs (T152). */
export function pgBinary(name: 'pg_dump' | 'psql'): string {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const directories: string[] = [];
  const explicit = process.env['PG_BIN'];
  if (explicit !== undefined) directories.push(explicit);
  directories.push(...(process.env['PATH'] ?? '').split(delimiter).filter(Boolean));
  if (process.platform === 'win32' && process.env['ProgramFiles'] !== undefined) {
    const root = join(process.env['ProgramFiles'], 'PostgreSQL');
    if (existsSync(root)) {
      for (const entry of readdirSync(root)) directories.push(join(root, entry, 'bin'));
    }
  }
  for (const directory of directories) {
    const candidate = join(directory, exe);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`${name} was not found; set PG_BIN to the PostgreSQL bin directory`);
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { env, timeout: 60_000 }, (error, _stdout, stderr) => {
      if (error) reject(new Error(`${command} failed: ${stderr || error.message}`));
      else resolve();
    });
  });
}

/** A plain-SQL dump of one database, written by `pg_dump`. */
export async function dumpDatabase(url: string, file: string): Promise<void> {
  await run(
    pgBinary('pg_dump'),
    ['--no-owner', '--no-privileges', '--format=plain', '--file', file, url],
    process.env,
  );
}

/** Replays a plain-SQL dump into an empty database with `psql`. */
export async function restoreDatabase(url: string, file: string): Promise<void> {
  await run(
    pgBinary('psql'),
    ['--quiet', '--set', 'ON_ERROR_STOP=1', '--dbname', url, '--file', file],
    process.env,
  );
}

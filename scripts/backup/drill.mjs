#!/usr/bin/env node
// The local restore drill (T129, FR-055, AC-061). It builds a scratch source
// database, seeds one of each state AC-061 names, takes a point-in-time logical
// backup, seals it with seal.mjs, mutates the source after the point, restores
// the sealed archive into a clean database, serves it with a fresh API, and
// asserts the state reads as at the recovery point.
//
// The production drill restores pg_basebackup plus WAL on Linux
// (scripts/backup/backup.sh and restore.sh, documented in
// docs/runbooks/backup-restore.md). This script is the host-adapted equivalent
// for a machine without Docker or a Linux cluster: the encryption path, the
// clean restore, the API boot, the state assertions, and the RTO/RPO reading are
// the same; the archive is logical instead of physical. The report records the
// departure.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { release, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Client } = require('pg');

const repository = fileURLToPath(new URL('../..', import.meta.url));
const sealScript = fileURLToPath(new URL('./seal.mjs', import.meta.url));
const dbTsx = join(repository, 'packages', 'db', 'node_modules', 'tsx', 'dist', 'cli.mjs');
const apiTsx = join(repository, 'apps', 'api', 'node_modules', 'tsx', 'dist', 'cli.mjs');
const reportPath = process.env['DRILL_REPORT'] ?? join(repository, 'reports', 't129-restore-drill.json');

const serverUrl = new URL(
  process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar',
);
const sourceName = 'wafar_drill_source';
const restoredName = 'wafar_drill_restored';
const sourceUrl = withDatabase(serverUrl, sourceName);
const restoredUrl = withDatabase(serverUrl, restoredName);
const adminUrl = withDatabase(serverUrl, 'postgres');

const work = mkdtempSync(join(tmpdir(), 'wafar-drill-'));
const dumpPath = join(work, 'source.dump');
const sealedPath = join(work, 'source.dump.sealed');
const openedPath = join(work, 'restored.dump');

const apiOrigin = process.env['DRILL_API_ORIGIN'] ?? 'http://127.0.0.1:3001';
const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://127.0.0.1:3000';

const sessionToken = 'drill-session-token-0123456789abcdef';
const failed = [];

function withDatabase(url, database) {
  const copy = new URL(url.href);
  copy.pathname = `/${database}`;
  return copy.href;
}

function pgExecutable(name) {
  const candidates = [
    process.env['PG_BIN'],
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
  ].filter((value) => value !== undefined && value !== '');
  for (const directory of candidates) {
    const executable = join(directory, `${name}.exe`);
    if (existsSync(executable)) return executable;
  }
  // A host with the client tools on PATH.
  return name;
}

function run(executable, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(executable, args, {
    cwd: options.cwd ?? repository,
    env: options.env ?? process.env,
    encoding: 'utf8',
    shell: options.shell ?? false,
  });
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${executable} ${args.join(' ')} answered ${String(result.status)}:\n${result.stderr ?? ''}${result.stdout ?? ''}`,
    );
  }
  return { ms: Date.now() - started, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

async function connection(url) {
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query('SET statement_timeout = 0');
  return client;
}

async function dropDatabase(admin, name) {
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
}

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(new URL('/health', apiOrigin).href)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

const report = {
  drill: 'T129',
  criterion: 'FR-055, AC-061',
  date: new Date().toISOString().slice(0, 10),
  method: 'logical pg_dump sealed with seal.mjs, restored into a clean database',
  host: {
    platform: process.platform,
    release: release(),
    node: process.version,
  },
  departure:
    'The production drill restores pg_basebackup plus WAL on Linux; this host has no Docker and no Linux cluster, so the drill takes a point-in-time logical dump and restores it into a clean database. The encryption, the clean restore, the API boot, the assertions, and the RTO/RPO reading are the same.',
  recoveryPoint: null,
  schema: null,
  archive: null,
  pointState: null,
  afterPointState: null,
  restoredState: null,
  assertions: [],
  timings: {},
  rto: null,
  rpo: null,
  verdict: null,
  failures: failed,
};

let api;
let admin;

try {
  const migrationsFolder = 'migrations';
  if (!existsSync(join(repository, 'packages', 'db', migrationsFolder))) {
    throw new Error('packages/db/migrations is missing');
  }

  admin = await connection(adminUrl);
  await dropDatabase(admin, sourceName);
  await dropDatabase(admin, restoredName);
  await admin.query(`CREATE DATABASE ${sourceName}`);

  const migrate = run(
    process.execPath,
    [dbTsx, 'scripts/migrate.ts'],
    {
      cwd: join(repository, 'packages', 'db'),
      env: { ...process.env, DATABASE_URL: sourceUrl },
    },
  );
  report.timings.migrateMs = migrate.ms;

  // The version the drill exercises, read from the applied journal and the
  // generated constant, so a later migration cannot leave the report claiming a
  // version it did not restore (T245).
  const versionSource = readFileSync(
    join(repository, 'packages', 'db', 'schema-version.ts'),
    'utf8',
  );
  const version = versionSource.match(/SCHEMA_VERSION = '([^']+)'/)?.[1] ?? null;
  const migrated = await connection(sourceUrl);
  let steps = 0;
  try {
    const applied = await migrated.query(
      'SELECT count(*)::int AS steps FROM drizzle.__drizzle_migrations',
    );
    steps = applied.rows[0]?.steps ?? 0;
  } finally {
    await migrated.end();
  }
  report.schema = { version, steps };

  const now = new Date();
  const windowMs = 15 * 60 * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const lockedUntil = new Date(now.getTime() + 10 * 60 * 1000);
  const codeExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const requestExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  const sessionExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const counterExpiresAt = new Date(windowStart.getTime() + windowMs + 60 * 60 * 1000);

  const source = await connection(sourceUrl);
  try {
    await source.query(
      `INSERT INTO users
         (id, full_name, email, phone_number, city, role, status, failed_sign_in_count, locked_until, phone_number_verified)
       VALUES
         ('drill-user-1', 'محمد علي', '218920000001@phone.invalid', '+218920000001', 'طرابلس', 'merchant', 'active', 5, $1, true)`,
      [lockedUntil.toISOString()],
    );
    await source.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
       VALUES ('drill-session-1', 'drill-user-1', $1, $2, $3)`,
      [sessionToken, sessionExpiresAt.toISOString(), now.toISOString()],
    );
    await source.query(
      `INSERT INTO phone_verifications
         (id, phone_number, purpose, state, code_hash, code_expires_at, request_expires_at, resume_token_hash, re_requests)
       VALUES
         ('drill-pending-1', '+218920000002', 'recovery', 'pending', 'drill-code-hash', $1, $2, 'drill-resume-hash', 1)`,
      [codeExpiresAt.toISOString(), requestExpiresAt.toISOString()],
    );
    await source.query(
      `INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
       VALUES ('sign_in:number:+218920000001', $1, 2, $2)`,
      [windowStart.toISOString(), counterExpiresAt.toISOString()],
    );
  } finally {
    await source.end();
  }

  report.pointState = {
    sessionLive: true,
    lockInForce: lockedUntil.toISOString(),
    lockCount: 5,
    pendingState: 'pending',
    rateWindowStart: windowStart.toISOString(),
    rateWindowCount: 2,
  };

  // The backup and its sealing. The plaintext dump is removed before anything
  // else happens, so only the sealed archive crosses the restore point.
  const dump = run(pgExecutable('pg_dump'), [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--file',
    dumpPath,
    sourceUrl,
  ]);
  report.timings.dumpMs = dump.ms;
  report.recoveryPoint = new Date().toISOString();
  const plaintextBytes = statSync(dumpPath).size;

  const key = randomBytes(32).toString('base64');
  const seal = run(process.execPath, [sealScript, 'seal', dumpPath, sealedPath], {
    env: { ...process.env, BACKUP_KEY_ENCRYPTION_KEY: key },
  });
  report.timings.sealMs = seal.ms;
  rmSync(dumpPath);
  const sealedBytes = statSync(sealedPath).size;
  report.archive = {
    sealedBytes,
    plaintextBytes,
    cipher: 'AES-256-GCM under a random data key wrapped by the key-encryption key',
    keyCustody: 'generated for this drill in process memory; never written beside the archive',
  };

  // Writes after the recovery point: each must be absent from the restore.
  const after = await connection(sourceUrl);
  try {
    await after.query(
      `UPDATE sessions
          SET revoked_at = now(), revoked_reason = 'sign_out', updated_at = now()
        WHERE id = 'drill-session-1'`,
    );
    await after.query(
      `UPDATE users
          SET failed_sign_in_count = 0, locked_until = NULL, updated_at = now()
        WHERE id = 'drill-user-1'`,
    );
    await after.query(
      `UPDATE phone_verifications
          SET state = 'verified', verified_at = now(), updated_at = now()
        WHERE id = 'drill-pending-1'`,
    );
    await after.query(
      `UPDATE rate_limit_counters
          SET count = 3
        WHERE key = 'sign_in:number:+218920000001' AND window_start = $1`,
      [windowStart.toISOString()],
    );
  } finally {
    await after.end();
  }
  report.afterPointState = {
    sessionRevoked: true,
    lockLifted: true,
    pendingVerified: true,
    rateWindowCount: 3,
  };

  const restoreStarted = Date.now();
  await admin.query(`CREATE DATABASE ${restoredName}`);
  const open = run(process.execPath, [sealScript, 'open', sealedPath, openedPath], {
    env: { ...process.env, BACKUP_KEY_ENCRYPTION_KEY: key },
  });
  report.timings.openMs = open.ms;
  const restore = run(pgExecutable('pg_restore'), [
    '--no-owner',
    '--no-privileges',
    '--dbname',
    restoredUrl,
    openedPath,
  ]);
  report.timings.restoreMs = restore.ms;
  rmSync(openedPath);

  // The state as at the recovery point, read before the API touches anything.
  const restored = await connection(restoredUrl);
  let state;
  try {
    const rows = await restored.query(
      `SELECT
         s.revoked_at AS session_revoked_at,
         s.expires_at AS session_expires_at,
         u.failed_sign_in_count,
         u.locked_until,
         p.state AS pending_state,
         p.verified_at AS pending_verified_at,
         c.count AS window_count,
         c.window_start
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN phone_verifications p ON p.id = 'drill-pending-1'
       JOIN rate_limit_counters c
         ON c.key = 'sign_in:number:+218920000001' AND c.window_start = $1
       WHERE s.id = 'drill-session-1' AND u.id = 'drill-user-1'`,
      [windowStart.toISOString()],
    );
    state = rows.rows[0];
    const estimatorTable = await restored.query(
      "SELECT to_regclass('public.sms_acceptance_estimate') AS table_name",
    );
    report.acceptanceEstimate = {
      persisted: estimatorTable.rows[0]?.table_name ?? null,
      note: 'The SMS port’s rolling acceptance estimate is process memory (AcceptanceEstimate); a fresh API starts with an empty window and no table holds it.',
    };
  } finally {
    await restored.end();
  }
  report.restoredState = {
    sessionRevokedAt: state.session_revoked_at ?? null,
    sessionExpiresAt: state.session_expires_at,
    failedSignInCount: state.failed_sign_in_count,
    lockedUntil: state.locked_until,
    pendingState: state.pending_state,
    pendingVerifiedAt: state.pending_verified_at ?? null,
    rateWindowStart: state.window_start,
    rateWindowCount: state.window_count,
  };

  const assert = (name, condition, measured) => {
    report.assertions.push({ name, pass: Boolean(condition), measured });
    if (!condition) failed.push(`${name}: ${JSON.stringify(measured)}`);
  };
  assert('the restored session is live', state.session_revoked_at === null, state.session_revoked_at);
  assert('the restored session has not expired', new Date(state.session_expires_at) > new Date(), state.session_expires_at);
  assert('the lock is in force at the recovery point', Number(state.failed_sign_in_count) === 5, state.failed_sign_in_count);
  assert('the lock has not been lifted', new Date(state.locked_until) > new Date(), state.locked_until);
  assert('the pending request is pending at the point', state.pending_state === 'pending', state.pending_state);
  assert('the pending request is not verified', state.pending_verified_at === null, state.pending_verified_at);
  assert('the rate-limit window reads as at the point', Number(state.window_count) === 2, state.window_count);

  // The API against the restored data, and the RTO reading.
  if (await reachable(new URL('/health', apiOrigin).href)) {
    throw new Error(`an API is already listening at ${apiOrigin}; stop it so the drill owns the process`);
  }
  api = spawn(
    process.execPath,
    [apiTsx, 'src/index.ts'],
    {
      cwd: join(repository, 'apps', 'api'),
      env: {
        ...process.env,
        NODE_ENV: 'development',
        DATABASE_URL: restoredUrl,
        BETTER_AUTH_SECRET: 'drill-secret-value-0000000000',
        BETTER_AUTH_URL: apiOrigin,
        WEB_ORIGIN: webOrigin,
        SMS_TRANSPORT: 'fake',
        SMS_FAKE_ACCEPT_MS: '0',
        LOG_LEVEL: 'error',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let apiOutput = '';
  api.stdout.on('data', (chunk) => {
    apiOutput += chunk.toString();
  });
  api.stderr.on('data', (chunk) => {
    apiOutput += chunk.toString();
  });

  if (!(await waitForHealth(120_000))) {
    throw new Error(`the restored API did not answer /health within 120 s:\n${apiOutput}`);
  }
  report.timings.apiReadyMs = Date.now() - restoreStarted;

  const health = await fetch(new URL('/health', apiOrigin).href);
  const healthBody = await health.json();
  assert('GET /health answers 200', health.status === 200, health.status);
  assert('the health body reports the database', healthBody?.database === 'ok', healthBody);

  const sessionRead = await fetch(new URL('/api/v1/auth/session', apiOrigin).href, {
    headers: { cookie: `wafar.session=${sessionToken}` },
  });
  const sessionBody = await sessionRead.json();
  assert('GET /api/v1/auth/session answers 200 with the restored session', sessionRead.status === 200, sessionRead.status);
  assert('the restored session still grants access', sessionBody?.authenticated === true, sessionBody);
  assert('the session belongs to the restored account', sessionBody?.user?.fullName === 'محمد علي', sessionBody?.user);

  const guestRead = await fetch(new URL('/api/v1/auth/session', apiOrigin).href);
  const guestBody = await guestRead.json();
  assert('a guest read stays a guest', guestRead.status === 200 && guestBody?.authenticated === false, guestBody);

  report.timings.totalMs = Date.now() - restoreStarted;
  report.rto = {
    targetHours: 4,
    measuredSeconds: Math.round((report.timings.totalMs / 1000) * 10) / 10,
    verdict: report.timings.totalMs <= 4 * 60 * 60 * 1000 ? 'pass' : 'fail',
  };
  report.rpo = {
    targetMinutes: 15,
    measuredMinutes: 0,
    note: 'The logical dump is the recovery point itself; the state after it is absent. Production bounds the window at 15 minutes with archive_timeout = 60.',
    verdict: 'pass',
  };
  report.verdict = failed.length === 0 ? 'pass' : 'fail';
} catch (error) {
  failed.push(error instanceof Error ? error.stack ?? error.message : String(error));
  report.verdict = 'fail';
} finally {
  if (api !== undefined) {
    try {
      api.kill();
    } catch {
      // The child already ended.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
  if (admin !== undefined) {
    try {
      await dropDatabase(admin, sourceName);
      await dropDatabase(admin, restoredName);
    } finally {
      await admin.end();
    }
  }
  rmSync(work, { recursive: true, force: true });
}

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (report.verdict !== 'pass') {
  console.error('T129 restore drill failed:');
  for (const failure of failed) console.error(`  - ${failure}`);
  console.error(`Drill report: ${reportPath}`);
  process.exit(1);
}

console.log(
  `T129 restore drill: PASS — sealed ${report.archive.plaintextBytes} B to ${report.archive.sealedBytes} B, ` +
    `restored and served in ${report.timings.apiReadyMs} ms, the session, lock, pending request, and rate-limit window read as at the recovery point.`,
);
console.log(`Drill report: ${reportPath}`);

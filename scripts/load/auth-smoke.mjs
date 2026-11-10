// The SC-009 load run (T117, plan.md -> The SC-009 load profile): 600 measured
// requests over 60 s at 10 per second — 200 account-creation submissions, 200
// sign-ins, and 200 recovery requests — from 20 virtual users bound to
// 127.0.0.2 … 127.0.0.21, each issuing one request every 2 s staggered 100 ms
// apart. The script seeds the deterministic fixture, starts its own API with the
// fake transport's declared 50 ms acceptance wait, warms up one account-creation
// submission per virtual user outside the 600, runs the timed window, then reads
// the sessions back, reads the rate-limit rows the run created, and probes a
// fresh origin's 21st submission for RATE_LIMITED. Its verdict is the measurement
// SC-009 records and R1's baseline for later slices.
//
// The profile never runs against production: it refuses to start when its own
// NODE_ENV is production. The measurement host is the Linux CI runner or load
// host; the report states the host it ran on, and a run on another host is a
// development check rather than the registered verdict.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { release } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blockNumber,
  loadCity,
  loadCredential,
  loadProfile,
  seedLoadFixture,
  typedForm,
} from '../fixtures/seed.mjs';

if (process.env['NODE_ENV'] === 'production') {
  console.error('The SC-009 load profile never runs against production.');
  process.exit(1);
}

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Client } = require('pg');

const apiOrigin = new URL(process.env['API_ORIGIN'] ?? 'http://127.0.0.1:3001');
const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://127.0.0.1:3000';
const databaseUrl =
  process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar';
const reportPath =
  process.env['LOAD_REPORT'] ?? join('reports', 'sc-009-load.json');

// The profile's fixed values (plan.md -> The SC-009 load profile).
const acceptMs = 50;
const virtualUsers = 20;
const rounds = 10;
const intervalMs = 2_000;
const staggerMs = 100;
const operations = ['account_creation', 'sign_in', 'recovery'];
const successStatus = { account_creation: 202, sign_in: 200, recovery: 202 };
const dispatchWait = { account_creation: acceptMs, sign_in: 0, recovery: acceptMs };
const paths = {
  account_creation: '/api/v1/auth/sign-up',
  sign_in: '/api/v1/auth/sign-in',
  recovery: '/api/v1/auth/password/forgot',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sleepUntil(at) {
  for (;;) {
    const remaining = at - Date.now();
    if (remaining <= 0) return;
    await sleep(remaining);
  }
}

/** One loopback source address per virtual user: 127.0.0.2 … 127.0.0.21. */
function originFor(index) {
  return `127.0.0.${index + 2}`;
}

function request({ localAddress, method = 'POST', path, headers = {}, body }) {
  return new Promise((resolve) => {
    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const started = performance.now();
    const req = http.request(
      {
        hostname: apiOrigin.hostname,
        port: Number(apiOrigin.port === '' ? 80 : apiOrigin.port),
        method,
        path,
        localAddress,
        agent: false,
        headers: {
          ...headers,
          ...(payload === undefined
            ? {}
            : {
                'content-type': 'application/json',
                'content-length': String(payload.length),
              }),
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString('utf8'),
            ms: performance.now() - started,
          });
        });
      },
    );
    req.on('error', (error) => {
      // A timeout or a reset is a measured outcome, not a crash: the run records
      // it as a refusal and its verdict fails on it.
      resolve({
        status: 0,
        headers: {},
        body: '',
        ms: performance.now() - started,
        error: error.message,
      });
    });
    req.setTimeout(15_000, () => req.destroy(new Error('the request timed out')));
    req.end(payload);
  });
}

function refusalCode(response) {
  if (typeof response.error === 'string') {
    return response.error.includes('timed out') ? 'TIMEOUT' : 'NETWORK_ERROR';
  }
  try {
    const parsed = JSON.parse(response.body);
    const code = parsed?.error?.code;
    if (typeof code === 'string') return code;
  } catch {
    // A non-JSON body is still a refusal; its status names it below.
  }
  return `HTTP_${response.status}`;
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
    await sleep(500);
  }
  return false;
}

const children = [];

function startApi() {
  const apiRoot = fileURLToPath(new URL('../../apps/api/', import.meta.url));
  const child = spawn(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'],
    {
      cwd: apiRoot,
      env: {
        ...process.env,
        // An untrusted peer is keyed by its peer address (contracts/auth-api.md
        // §2.5); the load class fixes the test environment, whose trusted-proxy
        // allowlist is empty, so each virtual user's own address is its origin
        // key.
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        BETTER_AUTH_SECRET: 'load-run-secret-value-000000',
        BETTER_AUTH_URL: apiOrigin.origin,
        WEB_ORIGIN: webOrigin,
        SMS_TRANSPORT: 'fake',
        SMS_FAKE_ACCEPT_MS: String(acceptMs),
        LOG_LEVEL: 'warn',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });
  children.push(child);
  return { child, output: () => output };
}

function stopApi() {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // The child already ended.
    }
  }
}

process.on('SIGINT', () => {
  stopApi();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopApi();
  process.exit(143);
});

function percentile(values, percentage) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((percentage / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function summarise(samples) {
  const durations = samples.map((sample) => sample.ms);
  const work = samples.map((sample) => sample.ms - dispatchWait[sample.operation]);
  return {
    count: samples.length,
    p50: round(percentile(durations, 50)),
    p95: round(percentile(durations, 95)),
    workP95: round(percentile(work, 95)),
    fastest: durations.length === 0 ? null : round(Math.min(...durations)),
    slowest: durations.length === 0 ? null : round(Math.max(...durations)),
  };
}

const operationsSummary = Object.fromEntries(
  operations.map((operation) => [
    operation,
    {
      attempted: 0,
      accepted: 0,
      refused: 0,
      refusalCodes: {},
      samples: [],
    },
  ]),
);
const measured = [];

function record(operation, response) {
  const summary = operationsSummary[operation];
  summary.attempted += 1;
  const accepted = response.status === successStatus[operation];
  if (accepted) {
    summary.accepted += 1;
    summary.samples.push({ operation, ms: response.ms });
  } else {
    summary.refused += 1;
    const code = refusalCode(response);
    summary.refusalCodes[code] = (summary.refusalCodes[code] ?? 0) + 1;
  }
  measured.push({
    operation,
    index: measured.length,
    status: response.status,
    ms: round(response.ms),
  });
}

function bodyFor(operation, target, formStamp) {
  if (operation === 'account_creation') {
    return {
      fullName: 'محمد علي',
      phone: typedForm(target),
      password: loadCredential,
      city: loadCity,
      website: '',
      formStamp,
    };
  }
  if (operation === 'sign_in') {
    return { phone: typedForm(target), password: loadCredential };
  }
  return { phone: typedForm(target) };
}

function targetFor(operation, index) {
  if (operation === 'account_creation') {
    return blockNumber(loadProfile.signUp, index);
  }
  if (operation === 'sign_in') {
    return blockNumber(loadProfile.signIn, index);
  }
  return blockNumber(loadProfile.recovery, index);
}

async function main() {
  const startedAt = new Date().toISOString();

  // The committed fixture: 10,000 accounts and 300 live sessions, rewritten so
  // the run measures the same population every time.
  const fixture = await seedLoadFixture(databaseUrl);

  const external = process.env['LOAD_API_EXTERNAL'] === '1';
  if (external) {
    if (!(await waitForHealth(30_000))) {
      throw new Error(`no API is listening at ${apiOrigin.href}`);
    }
  } else {
    if (await reachable(new URL('/health', apiOrigin).href)) {
      throw new Error(
        `an API is already listening at ${apiOrigin.href}; stop it so the run owns the process and its 50 ms acceptance wait`,
      );
    }
    const api = startApi();
    if (!(await waitForHealth(120_000))) {
      throw new Error(`the API did not open within 120 s:\n${api.output()}`);
    }
  }

  const database = new Client({ connectionString: databaseUrl });
  await database.connect();
  await database.query('SET statement_timeout = 0');

  try {
    const beforeRows = await database.query(
      `SELECT count(*)::int AS live
         FROM sessions
        WHERE revoked_at IS NULL AND expires_at > now()`,
    );
    const sessionsBefore = beforeRows.rows[0].live;

    // The warm-up's render-bootstrap read: one CSRF token and one form stamp,
    // used by every request in the run.
    const bootstrap = await request({
      localAddress: originFor(0),
      method: 'GET',
      path: '/api/v1/auth/csrf',
      headers: { origin: webOrigin },
    });
    if (bootstrap.status !== 200) {
      throw new Error(`the render bootstrap answered ${bootstrap.status}`);
    }
    const { csrfToken, formStamp } = JSON.parse(bootstrap.body);
    if (typeof csrfToken !== 'string' || typeof formStamp !== 'string') {
      throw new Error('the render bootstrap did not return its token and stamp');
    }
    const stampReadAt = Date.now();
    const headers = () => ({
      origin: webOrigin,
      cookie: `wafar.csrf=${csrfToken}`,
      'x-wafar-csrf': csrfToken,
      'user-agent': 'wafar-load/1',
    });

    // The stamp is at least 3 s old, so the minimum-time rule never refuses it.
    const stampWait = stampReadAt + 3_000 - Date.now();
    if (stampWait > 0) await sleep(stampWait);

    // One warm-up account-creation submission per virtual user, outside the 600
    // and reported separately; it spends one unit of each origin's budget.
    const warmUp = await Promise.all(
      Array.from({ length: virtualUsers }, (_, index) =>
        request({
          localAddress: originFor(index),
          path: paths.account_creation,
          headers: headers(),
          body: bodyFor(
            'account_creation',
            blockNumber(loadProfile.warmUp, index),
            formStamp,
          ),
        }),
      ),
    );
    const warmUpAccepted = warmUp.filter((response) => response.status === 202).length;

    // The timed window: 30 requests per virtual user at 2 s intervals, staggered
    // 100 ms apart, so the aggregate inter-arrival is a steady 10 per second.
    const windowStart = Date.now() + 500;
    const windowStartIso = new Date(windowStart).toISOString();
    await Promise.all(
      Array.from({ length: virtualUsers }, (_, user) =>
        (async () => {
          const spent = { account_creation: 0, sign_in: 0, recovery: 0 };
          for (let step = 0; step < rounds * operations.length; step += 1) {
            await sleepUntil(windowStart + step * intervalMs + user * staggerMs);
            // The global 100 ms slot cycles the three operations, so the
            // 10-per-second stream carries a steady third of each operation
            // rather than a burst of one operation twenty times over.
            const operation =
              operations[(step * virtualUsers + user) % operations.length];
            const index = user * rounds + spent[operation];
            spent[operation] += 1;
            const target = targetFor(operation, index);
            const response = await request({
              localAddress: originFor(user),
              path: paths[operation],
              headers: headers(),
              body: bodyFor(operation, target, formStamp),
            });
            record(operation, response);
          }
        })(),
      ),
    );
    const windowEndedAt = new Date().toISOString();
    const windowDurationMs =
      new Date(windowEndedAt).getTime() - new Date(windowStartIso).getTime();

    const afterRows = await database.query(
      `SELECT count(*)::int AS live
         FROM sessions
        WHERE revoked_at IS NULL AND expires_at > now()`,
    );
    const sessionsAfter = afterRows.rows[0].live;

    // The limiter probe: a fresh origin spends its 20-request account-creation
    // budget, and the 21st submission must be refused RATE_LIMITED. The two
    // counts must share one fixed window, so the probe waits for a fresh one
    // when the current window has too little room left.
    const rateWindowMs = 15 * 60 * 1000;
    const windowRemaining = rateWindowMs - (Date.now() % rateWindowMs);
    let probeWindowWaitMs = 0;
    if (windowRemaining < 180_000) {
      probeWindowWaitMs = windowRemaining + 1_000;
      await sleep(probeWindowWaitMs);
    }
    const probe = [];
    for (let index = 0; index < loadProfile.probe.count; index += 1) {
      const response = await request({
        localAddress: '127.0.0.22',
        path: paths.account_creation,
        headers: headers(),
        body: bodyFor(
          'account_creation',
          blockNumber(loadProfile.probe, index),
          formStamp,
        ),
      });
      probe.push({
        index,
        status: response.status,
        code: response.status === 202 ? null : refusalCode(response),
        retryAfter: response.headers['retry-after'] ?? null,
      });
    }

    // The rate-limit rows the run created: one per key and window, summed. The
    // origin key carries the peer address as the API saw it; a dual-stack
    // listener reports an IPv4 peer in its mapped form, so both forms are read.
    const counterRows = await database.query(
      `SELECT key, sum(count)::int AS count
         FROM rate_limit_counters
        WHERE (key LIKE 'account_creation:%' OR key LIKE 'sign_in:%' OR key LIKE 'recovery:%')
          AND (
            key LIKE '%:origin:127.0.0.%'
            OR key LIKE '%:origin:::ffff:127.0.0.%'
            OR key LIKE '%:number:+218%'
          )
        GROUP BY key
        ORDER BY key`,
    );
    const counters = new Map(
      counterRows.rows.map((row) => [row.key, Number(row.count)]),
    );

    // The slowest statement, when the database exposes pg_stat_statements.
    let slowestStatement = null;
    let slowestStatementNote = null;
    try {
      await database.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
      const rows = await database.query(
        `SELECT calls,
                round(mean_exec_time::numeric, 3) AS mean_ms,
                round(max_exec_time::numeric, 3) AS max_ms,
                query
           FROM pg_stat_statements
          ORDER BY mean_exec_time DESC
          LIMIT 1`,
      );
      slowestStatement = rows.rows[0] ?? null;
    } catch (error) {
      slowestStatementNote =
        error instanceof Error ? error.message : String(error);
    }

    return {
      startedAt,
      fixture,
      sessionsBefore,
      sessionsAfter,
      warmUp: {
        attempted: warmUp.length,
        accepted: warmUpAccepted,
        refused: warmUp.length - warmUpAccepted,
      },
      window: {
        startedAt: windowStartIso,
        endedAt: windowEndedAt,
        durationMs: windowDurationMs,
        measured: measured.length,
      },
      operations: operationsSummary,
      probeWindowWaitMs,
      probe,
      counters,
      slowestStatement,
      slowestStatementNote,
    };
  } finally {
    await database.end();
  }
}

let result;
try {
  result = await main();
} catch (error) {
  stopApi();
  console.error(
    `SC-009 load run failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
stopApi();

const failures = [];
const operationsReport = {};

for (const operation of operations) {
  const summary = operationsSummary[operation];
  const stats = summarise(summary.samples);
  operationsReport[operation] = {
    attempted: summary.attempted,
    accepted: summary.accepted,
    refused: summary.refused,
    refusalCodes: summary.refusalCodes,
    ...stats,
  };

  if (summary.attempted !== 200) {
    failures.push(`${operation}: ${summary.attempted} measured requests, not 200`);
  }
  if (summary.accepted !== 200) {
    failures.push(`${operation}: ${summary.accepted} accepted, not 200`);
  }
  if (summary.refused !== 0) {
    failures.push(`${operation}: ${summary.refused} refused`);
  }
  if (stats.fastest !== null && stats.fastest < dispatchWait[operation]) {
    failures.push(
      `${operation}: a measured dispatch took ${stats.fastest} ms, faster than the declared ${dispatchWait[operation]} ms wait`,
    );
  }
  if (!(stats.p50 <= 150)) {
    failures.push(`${operation}: p50 ${stats.p50} ms exceeds 150 ms`);
  }
  if (!(stats.p95 <= 1_000)) {
    failures.push(`${operation}: p95 ${stats.p95} ms exceeds 1000 ms`);
  }
  if (!(stats.workP95 <= 250)) {
    failures.push(`${operation}: work-only p95 ${stats.workP95} ms exceeds 250 ms`);
  }
}

const allSamples = Object.values(operationsSummary).flatMap(
  (summary) => summary.samples,
);
const aggregateStats = summarise(allSamples);
const aggregate = {
  attempted: Object.values(operationsReport).reduce(
    (sum, operation) => sum + operation.attempted,
    0,
  ),
  accepted: allSamples.length,
  refused: operations.reduce(
    (sum, operation) => sum + operationsSummary[operation].refused,
    0,
  ),
  ...aggregateStats,
};
if (!(aggregateStats.p50 <= 150)) {
  failures.push(`aggregate: p50 ${aggregateStats.p50} ms exceeds 150 ms`);
}
if (!(aggregateStats.p95 <= 1_000)) {
  failures.push(`aggregate: p95 ${aggregateStats.p95} ms exceeds 1000 ms`);
}
if (!(aggregateStats.workP95 <= 250)) {
  failures.push(
    `aggregate: work-only p95 ${aggregateStats.workP95} ms exceeds 250 ms`,
  );
}

if (result.sessionsBefore !== loadProfile.liveSessions) {
  failures.push(
    `sessions before: ${result.sessionsBefore}, not the seeded ${loadProfile.liveSessions}`,
  );
}
if (result.sessionsAfter !== loadProfile.ceilingSessions) {
  failures.push(
    `sessions after: ${result.sessionsAfter}, not the ${loadProfile.ceilingSessions} ceiling`,
  );
}
if (result.warmUp.accepted !== result.warmUp.attempted) {
  failures.push(
    `warm-up: ${result.warmUp.attempted - result.warmUp.accepted} refused`,
  );
}

// The limiter was live: each origin's planned spend, each number's one spend,
// and the probe's 21st submission refused with Retry-After.
const plannedOriginSpend = { account_creation: 11, sign_in: 10, recovery: 10 };
const counterGaps = [];

/** The peer key's form: Node reports an IPv4 peer to a dual-stack listener as
 * an IPv4-mapped address, and the API keys the peer it sees. */
function originSpend(operation, address) {
  return (
    result.counters.get(`${operation}:origin:::ffff:${address}`) ??
    result.counters.get(`${operation}:origin:${address}`) ??
    0
  );
}

for (let user = 0; user < virtualUsers; user += 1) {
  const origin = originFor(user);
  for (const operation of operations) {
    const actual = originSpend(operation, origin);
    const expected = plannedOriginSpend[operation];
    if (actual !== expected) {
      counterGaps.push(`${operation}:origin:${origin}: ${actual}, not ${expected}`);
    }
  }
}
const probeSpend = originSpend('account_creation', '127.0.0.22');
if (probeSpend !== loadProfile.probe.count) {
  counterGaps.push(
    `account_creation:origin:127.0.0.22: ${probeSpend}, not ${loadProfile.probe.count}`,
  );
}

const expectedNumberBlocks = [
  ['account_creation', loadProfile.signUp],
  ['sign_in', loadProfile.signIn],
  ['recovery', loadProfile.recovery],
  ['account_creation', loadProfile.warmUp],
  ['account_creation', loadProfile.probe],
];
for (const [operation, block] of expectedNumberBlocks) {
  for (let index = 0; index < block.count; index += 1) {
    const key = `${operation}:number:${blockNumber(block, index)}`;
    const actual = result.counters.get(key) ?? 0;
    if (actual !== 1) {
      counterGaps.push(`${key}: ${actual}, not 1`);
    }
  }
}
if (counterGaps.length > 0) {
  failures.push(...counterGaps.map((gap) => `counter: ${gap}`));
}

const probeAccepted = result.probe.filter((entry) => entry.status === 202).length;
const probeFinal = result.probe.at(-1);
if (probeAccepted !== loadProfile.probe.count - 1) {
  failures.push(
    `limiter probe: ${probeAccepted} accepted, not ${loadProfile.probe.count - 1}`,
  );
}
if (probeFinal?.status !== 429 || probeFinal?.code !== 'RATE_LIMITED') {
  failures.push(
    `limiter probe: the 21st submission answered ${probeFinal?.status} ${probeFinal?.code ?? ''}`.trim(),
  );
}
if (probeFinal?.retryAfter === null || probeFinal?.retryAfter === undefined) {
  failures.push('limiter probe: the refusal carries no Retry-After');
}

const report = {
  criterion: 'SC-009',
  environment: {
    nodeEnv: 'test',
    timezone: process.env['TZ'] ?? null,
    transport: 'fake',
    acceptMs,
  },
  profile: {
    measuredRequests: 600,
    perOperation: 200,
    virtualUsers,
    intervalMs,
    staggerMs,
    ratePerSecond: virtualUsers / (intervalMs / 1000),
    acceptMs,
    originAddresses: '127.0.0.2 - 127.0.0.21',
    probeAddress: '127.0.0.22',
    host: {
      platform: process.platform,
      release: release(),
      node: process.version,
      // The registered verdict is the Linux load job's run (plan.md -> The
      // SC-009 load profile). A run on any other host is a development check
      // and cannot stand in for it, so the report says which one it is.
      verdictScope:
        process.platform === 'linux'
          ? 'registered measurement host'
          : 'development check',
    },
  },
  startedAt: result.startedAt,
  fixture: result.fixture,
  sessions: {
    before: result.sessionsBefore,
    after: result.sessionsAfter,
    ceiling: loadProfile.ceilingSessions,
  },
  warmUp: result.warmUp,
  window: result.window,
  operations: operationsReport,
  aggregate,
  counters: {
    rows: [...result.counters.entries()].map(([key, count]) => ({ key, count })),
    totalRows: result.counters.size,
    totalSpend: [...result.counters.values()].reduce((sum, count) => sum + count, 0),
  },
  probe: {
    attempted: result.probe.length,
    accepted: probeAccepted,
    refused: result.probe.length - probeAccepted,
    windowWaitMs: result.probeWindowWaitMs,
    final: probeFinal,
  },
  slowestStatement: result.slowestStatement,
  slowestStatementNote: result.slowestStatementNote,
  verdict: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `SC-009 load run: ${report.verdict.toUpperCase()} — ${report.aggregate.accepted}/600 accepted, ` +
    `p50 ${aggregate.p50} ms, p95 ${aggregate.p95} ms, work-only p95 ${aggregate.workP95} ms, ` +
    `sessions ${result.sessionsBefore} -> ${result.sessionsAfter}.`,
);
for (const operation of operations) {
  const entry = operationsReport[operation];
  console.log(
    `  ${operation}: ${entry.accepted}/${entry.attempted} accepted, p50 ${entry.p50} ms, ` +
      `p95 ${entry.p95} ms, work-only p95 ${entry.workP95} ms, refusal codes ${JSON.stringify(entry.refusalCodes)}`,
  );
}
console.log(
  `  host: ${report.profile.host.platform} ${report.profile.host.release} — ${report.profile.host.verdictScope}`,
);
console.log(
  `  limiter probe: ${probeAccepted}/${result.probe.length} accepted, the 21st ` +
    `${probeFinal?.status ?? '?'} ${probeFinal?.code ?? ''}, Retry-After ${probeFinal?.retryAfter ?? 'missing'}`,
);
console.log(
  `  rate-limit rows: ${report.counters.totalRows} keys, ${report.counters.totalSpend} spent`,
);
if (result.slowestStatement !== null) {
  console.log(`  slowest statement: ${result.slowestStatement.query}`);
}
if (failures.length > 0) {
  console.error('SC-009 load run failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
}
console.log(`Load report: ${reportPath}`);

if (failures.length > 0) {
  process.exit(1);
}

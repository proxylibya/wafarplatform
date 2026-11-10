// The integration harness: one real database client, the deterministic fake
// transport, one injected clock, and a recorded security-event sink, so a suite
// exercises the composed API rather than a route in isolation.
import { sql } from 'drizzle-orm';
import { createDatabase, type Database } from '@wafar/db';
import type { SecurityEvent } from '@wafar/shared';
import { createApp } from '../../src/app.ts';
import type { AppDependencies } from '../../src/http/deps.ts';
import type { Env } from '../../src/env.ts';
import { createAuthEngine, type AuthEngine } from '../../src/modules/auth/engine.ts';
import { FakeSmsTransport } from '../../src/modules/auth/sms/fake.ts';
import { createLogger } from '../../src/observability/logger.ts';
import { createFaultedDatabase, type FaultControl } from './fault.ts';
import { createBarrier, type Barrier } from './barrier.ts';

export const DATABASE_URL = process.env['DATABASE_URL'];
export const hasDatabase = DATABASE_URL !== undefined;

export interface Clock {
  now: () => Date;
  advance: (ms: number) => void;
  set: (value: Date) => void;
}

export function createClock(start: Date): Clock {
  let current = start;
  return {
    now: () => current,
    advance: (ms) => {
      current = new Date(current.getTime() + ms);
    },
    set: (value) => {
      current = value;
    },
  };
}

export interface Harness {
  app: ReturnType<typeof createApp>;
  db: Database;
  auth: AuthEngine;
  pool: ReturnType<typeof createDatabase>['pool'];
  sms: FakeSmsTransport;
  clock: Clock;
  events: SecurityEvent[];
  /** The peer address every request through `call` reports. */
  peer: string;
  /** Present only when the harness was created with `barrier: true`. */
  barrier?: Barrier;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export interface HarnessOptions {
  /** The addresses whose `X-Real-IP` is honoured, per contracts/auth-api.md §2.5. */
  trustedProxies?: string[];
  /** The peer address every request reports, so the allowlist can decide. */
  peer?: string;
  /** The fake channel's acceptance duration, in milliseconds. */
  smsAcceptMs?: number;
  /** One collaborator call inside the real unit of work fails (T146). */
  fault?: FaultControl;
  /** Another database, so a suite can observe the database's absence (T148). */
  connectionString?: string;
  /**
   * Wraps the client the app receives, so a suite can hold a transaction at a
   * named point (T156's barrier). The harness's own `db` stays undecorated.
   */
  decorate?: (db: Database) => Database;
  /** Arms T156's barrier on the app's unit of work and returns it. */
  barrier?: boolean;
}

export function createHarness(options: HarnessOptions = {}): Harness {
  if (DATABASE_URL === undefined) {
    throw new Error('DATABASE_URL is not set');
  }
  const { db, pool } = createDatabase(options.connectionString ?? DATABASE_URL);
  const sms = new FakeSmsTransport(options.smsAcceptMs ?? 0);
  const clock = createClock(new Date('2026-03-01T10:00:00.000Z'));
  const events: SecurityEvent[] = [];
  const faulted = options.fault === undefined ? db : createFaultedDatabase(db, options.fault);
  const barrier = options.barrier === true ? createBarrier(faulted) : undefined;
  const wired =
    barrier !== undefined
      ? barrier.db
      : options.decorate === undefined
        ? faulted
        : options.decorate(faulted);
  const env: Env = {
    NODE_ENV: 'test',
    DATABASE_URL: options.connectionString ?? DATABASE_URL,
    BETTER_AUTH_SECRET: 'integration-secret-value-000000',
    BETTER_AUTH_URL: 'http://localhost:3001',
    WEB_ORIGIN: 'http://localhost:3000',
    TRUSTED_PROXIES: '',
    SMS_TRANSPORT: 'fake',
    SMS_FAKE_ACCEPT_MS: options.smsAcceptMs ?? 0,
    LOG_LEVEL: 'error',
  };
  const logger = createLogger({
    stream: { write: () => undefined },
    errorStream: { write: () => undefined },
    clock: clock.now,
  });
  const dependencies: AppDependencies = {
    db: wired,
    auth: createAuthEngine({
      db: wired,
      secret: env.BETTER_AUTH_SECRET,
      baseUrl: env.BETTER_AUTH_URL,
    }),
    env,
    sms,
    logger,
    events: { emit: (event) => events.push(event) },
    now: clock.now,
    trustedProxies: options.trustedProxies ?? [],
  };
  const app = createApp(dependencies);

  return {
    app,
    db,
    auth: dependencies.auth,
    pool,
    sms,
    clock,
    events,
    peer: options.peer ?? '127.0.0.1',
    ...(barrier === undefined ? {} : { barrier }),
    async reset() {
      await db.execute(
        sql.raw(
          'TRUNCATE TABLE phone_verifications, verifications, sessions, accounts, rate_limit_counters, users CASCADE',
        ),
      );
      sms.clear();
      events.length = 0;
      clock.set(new Date('2026-03-01T10:00:00.000Z'));
    },
    async close() {
      await pool.end();
    },
  };
}

export interface ResponseRecord {
  status: number;
  body: unknown;
  headers: Headers;
  cookies: string[];
}

export type CookieJar = Record<string, string>;

export function recordCookies(response: Response, jar: CookieJar): string[] {
  const set = response.headers.getSetCookie?.() ?? [];
  for (const raw of set) {
    const [pair] = raw.split(';');
    if (pair === undefined) continue;
    const index = pair.indexOf('=');
    if (index === -1) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (value === '') delete jar[name];
    else jar[name] = value;
  }
  return set;
}

function cookieHeader(jar: CookieJar): string {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export interface CallOptions {
  jar?: CookieJar;
  origin?: string | null;
  csrf?: boolean;
  headers?: Record<string, string>;
}

export async function call(
  harness: Harness,
  method: string,
  path: string,
  body?: unknown,
  options: CallOptions = {},
): Promise<ResponseRecord> {
  const jar = options.jar ?? {};
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers ?? {}),
  };
  const origin = options.origin === undefined ? 'http://localhost:3000' : options.origin;
  if (origin !== null) headers['origin'] = origin;
  const csrf = options.csrf === true;
  if (csrf && jar['wafar.csrf'] !== undefined) {
    headers['cookie'] = cookieHeader({ 'wafar.csrf': jar['wafar.csrf'] });
    if (headers['x-wafar-csrf'] === undefined) {
      headers['x-wafar-csrf'] = jar['wafar.csrf'];
    }
  } else if (options.jar !== undefined) {
    headers['cookie'] = cookieHeader(jar);
  }
  if (csrf && options.jar !== undefined) {
    headers['cookie'] = cookieHeader(jar);
  }
  const response = await harness.app.request(
    path,
    {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    // Hono's third argument becomes `c.env`; the routes read the peer from
    // `incoming.socket.remoteAddress`, exactly as the Node adapter sets it.
    {
      incoming: {
        socket: {
          remoteAddress: harness.peer,
        },
      },
    },
  );
  const cookies = recordCookies(response, jar);
  const text = await response.text();
  return {
    status: response.status,
    body: text === '' ? null : (JSON.parse(text) as unknown),
    headers: response.headers,
    cookies,
  };
}

/** The render bootstrap: one CSRF token and one form stamp. */
export async function bootstrap(
  harness: Harness,
  jar: CookieJar,
): Promise<{ csrfToken: string; formStamp: string }> {
  const response = await call(harness, 'GET', '/api/v1/auth/csrf', undefined, { jar });
  const body = response.body as { csrfToken: string; formStamp: string };
  jar['wafar.csrf'] = body.csrfToken;
  return body;
}

export function bearer(jar: CookieJar): string | undefined {
  return jar['wafar.session'];
}

export interface SeedAccountInput {
  phoneNumber: string;
  fullName?: string;
  city?: string;
  role?: 'merchant' | 'administrator';
  status?: 'active' | 'blocked';
  mustChangePassword?: boolean;
  password: string;
}

/** Seeds one account with its `$wafar$scrypt$` credential, directly. */
export async function seedAccount(
  harness: Harness,
  input: SeedAccountInput,
): Promise<{ id: string; phoneNumber: string }> {
  const { createUsersRepository } = await import(
    '../../src/modules/users/repository/users.ts'
  );
  const users = createUsersRepository(harness.db);
  const account = await users.create({
    fullName: input.fullName ?? 'محمد علي',
    phoneNumber: input.phoneNumber,
    city: input.city ?? 'طرابلس',
    shopName: null,
    ...(input.role === undefined ? {} : { role: input.role }),
    ...(input.mustChangePassword === undefined
      ? {}
      : { mustChangePassword: input.mustChangePassword }),
  });
  await harness.auth.createCredential({
    userId: account.id,
    passwordHash: await harness.auth.hashPassword(input.password),
  });
  if (input.status === 'blocked') {
    await harness.db.execute(
      sql`UPDATE users SET status = 'blocked' WHERE id = ${account.id}`,
    );
  }
  return { id: account.id, phoneNumber: account.phoneNumber };
}

// The four clocks on both sides of every bound: the lock, the code's expiry,
// the request's expiry, the inactivity clock, and the absolute lifetime are each
// read at bound - 1 ms and at the bound, with one injected clock and the
// process's own time set to the same instant (FR-009, FR-032, FR-034, AC-010,
// AC-015, AC-036; T159).
import { eq, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  lockMinutes,
  otpLifetimeSeconds,
  sessionAbsoluteSeconds,
  sessionInactivitySeconds,
} from '@wafar/shared';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import { createLockRepository } from '../../../src/modules/users/repository/user-lock.ts';
import { isExpired, isInactive } from '../../../src/modules/auth/service/sessions.ts';


const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function startSignUp(
  jar: CookieJar,
  phone: string,
): Promise<{ requestId: string; code: string }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    {
      fullName: 'محمد علي',
      phone,
      password,
      city: city(),
      website: '',
      formStamp: pair.formStamp,
    },
    { jar, csrf: true },
  );
  expect(response.status).toBe(202);
  return {
    requestId: (response.body as { requestId: string }).requestId,
    code: harness!.sms.lastCode() ?? '',
  };
}

async function enterSignUpCode(
  jar: CookieJar,
  requestId: string,
  code: string,
): Promise<{ status: number; body: unknown }> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up/verify',
    { requestId, code },
    { jar, csrf: true },
  );
}

describe.skipIf(!hasDatabase)('the four clocks on both sides of every bound', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(harness!.clock.now());
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('refuses the locked account until the bound and admits it at the bound', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const now = harness!.clock.now();
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60_000);
    await harness!.db
      .update(users)
      .set({ failedSignInCount: 5, lockedUntil })
      .where(eq(users.id, account.id));

    const locks = createLockRepository(harness!.db);
    const beforeJar: CookieJar = {};
    const atJar: CookieJar = {};
    await bootstrap(harness!, beforeJar);
    await bootstrap(harness!, atJar);

    harness!.clock.advance(lockMinutes * 60_000 - 1);
    vi.setSystemTime(harness!.clock.now());
    expect(await locks.isLocked(account.id, harness!.clock.now())).toBe(true);
    const before = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: beforeJar, csrf: true },
    );
    expect(before.status).toBe(401);

    harness!.clock.advance(1);
    vi.setSystemTime(harness!.clock.now());
    expect(await locks.isLocked(account.id, harness!.clock.now())).toBe(false);
    const atBound = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: atJar, csrf: true },
    );
    expect(atBound.status).toBe(200);
  });

  it('accepts the code before its expiry and refuses it at the expiry', async () => {
    const beforeJar: CookieJar = {};
    const before = await startSignUp(beforeJar, '0912345601');
    harness!.clock.advance(otpLifetimeSeconds * 1000 - 1);
    vi.setSystemTime(harness!.clock.now());
    const accepted = await enterSignUpCode(beforeJar, before.requestId, before.code);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toEqual({ outcome: 'created' });

    const atJar: CookieJar = {};
    const at = await startSignUp(atJar, '0912345602');
    harness!.clock.advance(otpLifetimeSeconds * 1000);
    vi.setSystemTime(harness!.clock.now());
    const refused = await enterSignUpCode(atJar, at.requestId, at.code);
    expect(refused.status).toBe(400);
    expect((refused.body as { error: { code: string } }).error.code).toBe(
      'OTP_EXPIRED',
    );
  });

  it('keeps the request live before its expiry and ends it at the expiry', async () => {
    const jar: CookieJar = {};
    const started = await startSignUp(jar, '0912345603');
    harness!.clock.advance(otpLifetimeSeconds * 1000 - 1);
    vi.setSystemTime(harness!.clock.now());
    const live = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${started.requestId}`,
      undefined,
      { jar },
    );
    expect(live.status).toBe(200);
    expect((live.body as { state: string }).state).toBe('pending');

    harness!.clock.advance(1);
    vi.setSystemTime(harness!.clock.now());
    const ended = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${started.requestId}`,
      undefined,
      { jar },
    );
    expect(ended.status).toBe(400);
    expect((ended.body as { error: { code: string } }).error.code).toBe(
      'OTP_EXPIRED',
    );
  });

  it('keeps the session live one millisecond before each session clock and ends it at the bound', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const sessions = harness!.auth;
    const user = (await harness!.db.select().from(users))[0]!;
    const issued = await sessions.issue({ userId: user.id, now: harness!.clock.now() });
    const issuedAt = harness!.clock.now();

    // The inactivity clock.
    harness!.clock.advance(sessionInactivitySeconds * 1000 - 1);
    vi.setSystemTime(harness!.clock.now());
    let row = await sessions.resolve(issued.token, harness!.clock.now());
    expect(isInactive(row!.lastActivityAt, harness!.clock.now())).toBe(false);
    expect(isExpired(row!.expiresAt, harness!.clock.now())).toBe(false);

    harness!.clock.advance(1);
    vi.setSystemTime(harness!.clock.now());
    row = await sessions.resolve(issued.token, harness!.clock.now());
    expect(isInactive(row!.lastActivityAt, harness!.clock.now())).toBe(true);

    // The absolute lifetime, at its own bound with the activity clock fresh.
    const token = 'absolute-bound-token'.padEnd(40, 'q');
    const absoluteExpiry = new Date(
      issuedAt.getTime() + sessionAbsoluteSeconds * 1000,
    );
    await harness!.db.execute(sql`
      INSERT INTO sessions (id, user_id, token, expires_at, last_activity_at)
      VALUES ('absolute-bound', ${user.id}, ${token}, ${absoluteExpiry.toISOString()}, ${harness!.clock.now().toISOString()})
    `);

    harness!.clock.set(new Date(absoluteExpiry.getTime() - 1));
    vi.setSystemTime(harness!.clock.now());
    await harness!.db.execute(
      sql`UPDATE sessions SET last_activity_at = ${harness!.clock.now().toISOString()} WHERE token = ${token}`,
    );
    const live = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `wafar.session=${token}` },
    });
    expect(live.status).toBe(200);

    harness!.clock.advance(1);
    vi.setSystemTime(harness!.clock.now());
    await harness!.db.execute(
      sql`UPDATE sessions SET last_activity_at = ${harness!.clock.now().toISOString()} WHERE token = ${token}`,
    );
    const ended = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `wafar.session=${token}` },
    });
    expect(ended.status).toBe(401);
    expect((ended.body as { error: { code: string } }).error.code).toBe(
      'SESSION_ENDED',
    );
  });
});

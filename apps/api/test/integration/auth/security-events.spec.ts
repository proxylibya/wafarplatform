// FR-037's closed security-event list, asserted through the real routes of the
// composed API: one record per named event under `EX-012`, the refusals that
// emit none, the absence of any personal data or secret, the notices bound to
// the two events FR-043 names, and the record reaching the stream before the
// response is written (FR-037, AC-040, AC-047; T179).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rateLimitCounters } from '@wafar/db';
import type { SecurityEvent } from '@wafar/shared';
import { signInPerOrigin } from '@wafar/shared';
import { securityEventNames } from '../../../src/modules/auth/service/events.ts';
import { createAdministratorSignInService } from '../../../src/modules/auth/service/sign-in-administrator.ts';
import { createApp } from '../../../src/app.ts';
import type { Env } from '../../../src/env.ts';
import { createLogger } from '../../../src/observability/logger.ts';
import { provision } from '../../support/cli.ts';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;

const phone = '+218912345678';
const national = '0912345678';
/** The number the sign-up flow creates, distinct from the seeded account. */
const signUpNational = '0912345679';
const password = 'correct horse battery staple';
const newPassword = 'a different long password 42';
const fullName = 'محمد علي';
const city = 'طرابلس';
const shopName = 'محل السلام';

const personal = [
  national,
  phone,
  '218912345678',
  fullName,
  city,
  shopName,
  '$wafar$scrypt$',
] as const;

/**
 * No record carries the number, a name, the city, or a credential form; an
 * opaque secret (the session token) is scanned the same way, while a short
 * numeric code is compared against each field's value rather than its text.
 */
function expectNoPersonalData(
  events: SecurityEvent[],
  exactSecrets: string[] = [],
): void {
  for (const event of events) {
    const line = JSON.stringify(event);
    for (const value of personal) {
      expect(line, `${event.event} carries ${value}`).not.toContain(value);
    }
    const values = Object.values(event as unknown as Record<string, unknown>);
    for (const secret of exactSecrets) {
      expect(values, `${event.event} carries a secret`).not.toContain(secret);
    }
  }
}

/** A sign-in submission on a fresh jar. */
async function signIn(
  value = password,
  jar: CookieJar = {},
): Promise<{ status: number; jar: CookieJar }> {
  await bootstrap(harness!, jar);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-in',
    { phone: national, password: value },
    { jar, csrf: true },
  );
  return { status: response.status, jar };
}

/** One full sign-up through its code, returning the pending request. */
async function signUpWithCode(
  jar: CookieJar,
): Promise<{ requestId: string; code: string }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  const started = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    {
      fullName,
      phone: signUpNational,
      password,
      city,
      shopName,
      website: '',
      formStamp: pair.formStamp,
    },
    { jar, csrf: true },
  );
  expect(started.status).toBe(202);
  return {
    requestId: (started.body as { requestId: string }).requestId,
    code: harness!.sms.lastCode() ?? '',
  };
}

describe.skipIf(!hasDatabase)('the security record', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('keeps the closed list at the eleven named events', () => {
    expect([...securityEventNames].sort()).toEqual(
      [
        'auth.administrator.provisioned',
        'auth.lock.applied',
        'auth.notice.dispatch_failed',
        'auth.otp.dispatch_failed',
        'auth.password.changed',
        'auth.password.current_check_failed',
        'auth.password.reset',
        'auth.session.revoked',
        'auth.sign_in.failed',
        'auth.sign_in.succeeded',
        'auth.sign_up.verified',
      ].sort(),
    );
  });

  it('records a successful sign-in, a failed one, and the verification that creates an account', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });

    const signed = await signIn();
    expect(signed.status).toBe(200);
    const failed = await signIn('a wrong but long password');
    expect(failed.status).toBe(401);

    const jar: CookieJar = {};
    const started = await signUpWithCode(jar);
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: started.code },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'created' });

    const names = harness!.events.map((event) => event.event);
    expect(names).toContain('auth.sign_in.succeeded');
    expect(names).toContain('auth.sign_in.failed');
    expect(names).toContain('auth.sign_up.verified');

    const succeeded = harness!.events.find(
      (event) => event.event === 'auth.sign_in.succeeded',
    );
    expect(succeeded?.accountId).toBeTruthy();
    const unknown = harness!.events.find(
      (event) => event.event === 'auth.sign_in.failed',
    );
    expect(unknown?.reason).toBe('wrong_password');

    const session = signed.jar['wafar.session'] ?? '';
    expect(JSON.stringify(harness!.events)).not.toContain(session);
    expectNoPersonalData(harness!.events, [started.code]);
  });

  it('records the failed current-password check and the change, and no revocation record', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: phone,
      password,
      fullName,
      city,
    });
    const { jar } = await signIn();

    const wrong = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: 'a wrong current password', newPassword },
      { jar, csrf: true },
    );
    expect(wrong.status).toBe(401);
    const failedCheck = harness!.events.find(
      (event) => event.event === 'auth.password.current_check_failed',
    );
    expect(failedCheck).toMatchObject({ path: 'change', accountId: account.id });

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(changed.status).toBe(200);

    expect(
      harness!.events.filter((event) => event.event === 'auth.password.changed'),
    ).toHaveLength(1);
    expect(
      harness!.events.some(
        (event) =>
          event.event === 'auth.session.revoked' &&
          event.reason === 'password_change',
      ),
    ).toBe(false);

    const notices = harness!.sms.messages.filter(
      (message) => message.kind === 'notice_password_changed',
    );
    expect(notices).toHaveLength(1);
    expectNoPersonalData(harness!.events);
  });

  it('records the forced change path and refuses a value rule or the lock without a record', async () => {
    const admin = await seedAccount(harness!, {
      phoneNumber: phone,
      password,
      fullName: 'مدير المنصة',
      city,
      role: 'administrator',
      mustChangePassword: true,
    });
    const signed = await createAdministratorSignInService(harness!.db, harness!.auth).signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't179-forced',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(signed).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (signed.outcome !== 'signed_in') return;

    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    jar['wafar.session'] = signed.token;

    const wrong = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: 'a wrong current password', newPassword },
      { jar, csrf: true },
    );
    expect(wrong.status).toBe(401);
    const forced = harness!.events.find(
      (event) => event.event === 'auth.password.current_check_failed',
    );
    expect(forced).toMatchObject({ path: 'forced_change', accountId: admin.id });

    // A value rule that refuses the submission emits no record.
    harness!.events.length = 0;
    const tooShort = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword: 'short' },
      { jar, csrf: true },
    );
    expect(tooShort.status).toBe(400);
    expect(harness!.events).toHaveLength(0);

    // The lock that refuses before the check emits no record either.
    const lockedUntil = new Date(harness!.clock.now().getTime() + 15 * 60_000);
    await harness!.db.execute(
      sql`UPDATE users SET failed_sign_in_count = 5, locked_until = ${lockedUntil.toISOString()} WHERE id = ${admin.id}`,
    );
    const locked = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(locked.status).toBe(401);
    expect(harness!.events).toHaveLength(0);
    expectNoPersonalData(harness!.events);
  });

  it('records the applied lock and the signed-out-everywhere revocation', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await signIn('a wrong but long password')).status).toBe(401);
    }
    const lock = harness!.events.find((event) => event.event === 'auth.lock.applied');
    expect(lock).toBeDefined();

    // The lock runs its full fifteen minutes; the sign-in after it succeeds.
    harness!.clock.advance(15 * 60_000 + 1);
    const { jar } = await signIn();
    expect(jar['wafar.session']).toBeTruthy();
    harness!.events.length = 0;
    harness!.sms.clear();
    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out-all', undefined, {
      jar,
      csrf: true,
    });
    expect(out.status).toBe(204);
    const revoked = harness!.events.find(
      (event) => event.event === 'auth.session.revoked',
    );
    expect(revoked).toMatchObject({ reason: 'sign_out_all' });
    expect(revoked?.sessionCount).toBe(1);
    expect(
      harness!.sms.messages.filter((message) => message.kind === 'notice_signed_out_all'),
    ).toHaveLength(1);
    expectNoPersonalData(harness!.events);
  });

  it('records the single-session sign-out, and nothing for a repeat or an unknown cookie', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    const { jar } = await signIn();
    const token = jar['wafar.session'];
    expect(token).toBeTruthy();
    harness!.events.length = 0;

    // The live session's row changed, so one record names it (FR-037, AC-040).
    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar,
      csrf: true,
    });
    expect(out.status).toBe(204);
    const revoked = harness!.events.filter(
      (event) => event.event === 'auth.session.revoked',
    );
    expect(revoked).toHaveLength(1);
    expect(revoked[0]).toMatchObject({ reason: 'sign_out', sessionCount: 1 });
    expect(revoked[0]?.accountId).toBeDefined();
    expectNoPersonalData(harness!.events);

    // A repeat of the ended session and an unknown cookie change no row, so
    // neither emits a record.
    harness!.events.length = 0;
    const repeat = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      headers: { cookie: `wafar.session=${token}` },
      csrf: true,
      jar: { 'wafar.csrf': jar['wafar.csrf'] ?? '' } as CookieJar,
    });
    expect(repeat.status).toBe(204);
    const unknown = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      headers: { cookie: 'wafar.session=unknown-token-value' },
      csrf: true,
      jar: { 'wafar.csrf': jar['wafar.csrf'] ?? '' } as CookieJar,
    });
    expect(unknown.status).toBe(204);
    expect(harness!.events).toHaveLength(0);
  });

  it('records the recovery reset', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });

    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const started = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: national },
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';

    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'verified' });

    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(200);
    expect(reset.body).toEqual({ outcome: 'reset' });
    expect(
      harness!.events.filter((event) => event.event === 'auth.password.reset'),
    ).toHaveLength(1);
    expectNoPersonalData(harness!.events, [code]);
  });

  it('records the two one-time-code dispatch failures and the notice dispatch failure', async () => {
    // The sign-up dispatch fails.
    harness!.sms.result = 'refused';
    harness!.sms.failNext = 1;
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName,
        phone: national,
        password,
        city,
        website: '',
        formStamp: pair.formStamp,
      },
      { jar, csrf: true },
    );
    expect(refused.status).toBe(502);
    expect(
      harness!.events.find(
        (event) =>
          event.event === 'auth.otp.dispatch_failed' && event.kind === 'sign_up',
      ),
    ).toBeDefined();

    // The recovery dispatch fails.
    const recoveryJar: CookieJar = {};
    await bootstrap(harness!, recoveryJar);
    harness!.sms.failNext = 1;
    const recovery = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: national },
      { jar: recoveryJar, csrf: true },
    );
    expect(recovery.status).toBe(502);
    expect(
      harness!.events.find(
        (event) =>
          event.event === 'auth.otp.dispatch_failed' && event.kind === 'recovery',
      ),
    ).toBeDefined();

    // The notice that accompanies a password change fails.
    harness!.sms.clear();
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    const { jar: changeJar } = await signIn();
    harness!.sms.result = 'refused';
    harness!.sms.failNext = 1;
    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar: changeJar, csrf: true },
    );
    expect(changed.status).toBe(200);
    expect(
      harness!.events.find(
        (event) =>
          event.event === 'auth.notice.dispatch_failed' &&
          event.kind === 'password_changed',
      ),
    ).toBeDefined();
    expectNoPersonalData(harness!.events);
  });

  it('records the operator’s provisioning', () => {
    const result = provision({
      phone,
      fullName: 'مدير المنصة',
      city,
      password,
    });
    expect(result.status).toBe(0);
    const records = result.stdout
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('{'))
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((record) => record['event'] === 'auth.administrator.provisioned');
    expect(records).toHaveLength(1);
    expect(JSON.stringify(records)).not.toContain(national);
    expect(JSON.stringify(records)).not.toContain(password);
  });

  it('emits no record for a format refusal or a rate-limit refusal', async () => {
    // The format refusal on sign-in and in recovery.
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const malformed = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '12345', password },
      { jar, csrf: true },
    );
    expect(malformed.status).toBe(400);
    const recovery = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '12345' },
      { jar, csrf: true },
    );
    expect(recovery.status).toBe(400);
    expect(harness!.events).toHaveLength(0);

    // A spent origin budget refuses before any account comparison.
    const now = harness!.clock.now();
    const windowStart = new Date(Math.floor(now.getTime() / (15 * 60_000)) * 15 * 60_000);
    await harness!.db
      .insert(rateLimitCounters)
      .values({
        key: `sign_in:origin:${harness!.peer}`,
        windowStart,
        count: signInPerOrigin,
        expiresAt: new Date(windowStart.getTime() + 15 * 60_000),
      })
      .onConflictDoUpdate({
        target: [rateLimitCounters.key, rateLimitCounters.windowStart],
        set: {
          count: signInPerOrigin,
          expiresAt: new Date(windowStart.getTime() + 15 * 60_000),
        },
      });
    const limited = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: national, password },
      { jar, csrf: true },
    );
    expect(limited.status).toBe(429);
    expect((limited.body as { error: { code: string } }).error.code).toBe('RATE_LIMITED');
    expect(harness!.events).toHaveLength(0);
  });

  it('sends no notice on an ordinary sign-in or an ordinary sign-out', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    const { jar } = await signIn();
    expect(harness!.sms.messages).toHaveLength(0);
    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar,
      csrf: true,
    });
    expect(out.status).toBe(204);
    expect(harness!.sms.messages).toHaveLength(0);
  });

  it('hands the record to the stream before the response is written', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    const order: string[] = [];
    const env: Env = {
      NODE_ENV: 'test',
      DATABASE_URL: process.env['DATABASE_URL'],
      BETTER_AUTH_SECRET: 'integration-secret-value-000000',
      BETTER_AUTH_URL: 'http://localhost:3001',
      WEB_ORIGIN: 'http://localhost:3000',
      TRUSTED_PROXIES: '',
      SMS_TRANSPORT: 'fake',
      SMS_FAKE_ACCEPT_MS: 0,
      LOG_LEVEL: 'error',
    };
    const app = createApp({
      db: harness!.db,
      auth: harness!.auth,
      env,
      sms: harness!.sms,
      logger: createLogger({ stream: { write: () => undefined } }),
      events: {
        emit: () => {
          order.push('log');
        },
      },
      now: harness!.clock.now,
      trustedProxies: [],
    });

    // The real sign-in route, through the composed API.
    const pair = await app.request('/api/v1/auth/csrf');
    const body = (await pair.json()) as { csrfToken: string };
    const csrf = body.csrfToken;
    const response = await app.request('/api/v1/auth/sign-in', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        cookie: `wafar.csrf=${csrf}`,
        'x-wafar-csrf': csrf,
      },
      body: JSON.stringify({ phone: national, password }),
    });
    order.push('response');

    expect(response.status).toBe(200);
    expect(order).toEqual(['log', 'response']);
  });

  it('names the request id on every record', async () => {
    await seedAccount(harness!, { phoneNumber: phone, password, fullName, city });
    await signIn('a wrong but long password');
    for (const event of harness!.events) {
      expect(typeof event.requestId).toBe('string');
      expect(event.requestId.length).toBeGreaterThan(0);
    }
  });
});

// The aggregate one-time-code message ceiling the two number keys produce:
// three account-creation and three recovery requests for one number each allow
// four accepted dispatches (the first and three re-requests), so at most 24
// one-time-code messages exist for that number in the window; the seventh fresh
// request and the fifth dispatch are refused; a dispatch the channel refuses at
// acceptance adds none; and no separate message budget or counter exists
// (FR-033, FR-034, AC-035, AC-036; T137).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';
const phone = '0912345678';
const e164 = '+218912345678';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

function oneTimeCodeMessages(to: string): number {
  return harness!.sms.messages.filter(
    (message) =>
      message.to === to &&
      (message.kind === 'otp_sign_up' || message.kind === 'otp_recovery'),
  ).length;
}

async function requestSignUp(jar: CookieJar): Promise<{ requestId: string }> {
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
  return { requestId: (response.body as { requestId: string }).requestId };
}

async function requestRecovery(jar: CookieJar): Promise<{ requestId: string }> {
  await bootstrap(harness!, jar);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone },
    { jar, csrf: true },
  );
  expect(response.status).toBe(202);
  return { requestId: (response.body as { requestId: string }).requestId };
}

async function resend(
  jar: CookieJar,
  requestId: string,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/verifications/resend',
    { requestId },
    { jar, csrf: true },
  );
}

describe.skipIf(!hasDatabase)('the code-dispatch ceiling', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('allows four accepted dispatches per request and at most twenty-four for the number', async () => {
    await seedAccount(harness!, {
      phoneNumber: e164,
      password,
    });

    // Three account-creation requests, each with the first dispatch and three
    // re-requests: four accepted dispatches each. Every attempt uses a fresh
    // jar, so the browser's pending tie (`wafar.pending`) does not re-render the
    // previous live request: each submission is a genuinely new verification,
    // while the number-keyed budgets stay shared (AC-036).
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const signUpJar: CookieJar = {};
      const started = await requestSignUp(signUpJar);
      for (let reRequest = 1; reRequest <= 3; reRequest += 1) {
        const response = await resend(signUpJar, started.requestId);
        expect(response.status).toBe(202);
        expect(
          (response.body as { remainingReRequests: number }).remainingReRequests,
        ).toBe(3 - reRequest);
      }
      // The fifth dispatch (fourth re-request) is refused, and the refusal
      // carries the remaining time to the request's boundary (FR-034).
      const exhausted = await resend(signUpJar, started.requestId);
      expect(exhausted.status).toBe(400);
      expect((exhausted.body as { error: { code: string } }).error.code).toBe(
        'OTP_RESEND_LIMIT',
      );
      const retryAfterSeconds = (
        exhausted.body as { error: { retryAfterSeconds: number } }
      ).error.retryAfterSeconds;
      expect(retryAfterSeconds).toBeGreaterThan(0);
      expect(retryAfterSeconds).toBeLessThanOrEqual(300);
      expect(exhausted.headers.get('Retry-After')).toBe(String(retryAfterSeconds));
    }
    expect(oneTimeCodeMessages(e164)).toBe(12);

    // The fourth fresh sign-up request is refused, so no seventh fresh request
    // can arise on this key.
    const fourthJar: CookieJar = {};
    const pair = await bootstrap(harness!, fourthJar);
    harness!.clock.advance(4000);
    const refusedSignUp = await call(
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
      { jar: fourthJar, csrf: true },
    );
    expect(refusedSignUp.status).toBe(429);
    expect(oneTimeCodeMessages(e164)).toBe(12);

    // Three recovery requests, each with four accepted dispatches. Each attempt
    // uses a fresh jar for the same reason: a new request, not a re-render.
    let recoveryJar: CookieJar = {};
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      recoveryJar = {};
      const started = await requestRecovery(recoveryJar);
      for (let reRequest = 1; reRequest <= 3; reRequest += 1) {
        const response = await resend(recoveryJar, started.requestId);
        expect(response.status).toBe(202);
      }
      const exhausted = await resend(recoveryJar, started.requestId);
      expect((exhausted.body as { error: { code: string } }).error.code).toBe(
        'OTP_RESEND_LIMIT',
      );
    }
    expect(oneTimeCodeMessages(e164)).toBe(24);

    const refusedRecovery = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone },
      { jar: recoveryJar, csrf: true },
    );
    expect(refusedRecovery.status).toBe(429);
    expect(oneTimeCodeMessages(e164)).toBe(24);

    // A dispatch the channel refuses at acceptance adds none, writes no pending
    // row, and answers OTP_SEND_FAILED.
    harness!.sms.result = 'refused';
    harness!.sms.failNext = 1;
    const otherJar: CookieJar = {};
    await bootstrap(harness!, otherJar);
    const failed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '0912345679' },
      { jar: otherJar, csrf: true },
    );
    expect(failed.status).toBe(502);
    expect((failed.body as { error: { code: string } }).error.code).toBe(
      'OTP_SEND_FAILED',
    );
    expect(oneTimeCodeMessages('+218912345679')).toBe(0);
    const pending = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM phone_verifications WHERE phone_number = ${'+218912345679'}`,
    );
    expect((pending.rows[0] as { n: number }).n).toBe(0);

    // No separate message budget or counter exists.
    const keys = await harness!.db.execute(sql`SELECT key FROM rate_limit_counters`);
    for (const row of keys.rows as Array<{ key: string }>) {
      expect(row.key).toMatch(/^(account_creation|sign_in|recovery):(origin|number):/);
      expect(row.key).not.toMatch(/message|dispatch|sms|code/i);
    }
  });

  it('claims a re-request allowance atomically under concurrent resends', async () => {
    await seedAccount(harness!, { phoneNumber: e164, password });
    const jar: CookieJar = {};
    const started = await requestSignUp(jar);
    expect(oneTimeCodeMessages(e164)).toBe(1);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => resend(jar, started.requestId)),
    );
    const accepted = responses.filter((response) => response.status === 202);
    const refused = responses.filter((response) => response.status === 400);
    expect(accepted).toHaveLength(3);
    expect(refused).toHaveLength(2);
    for (const response of refused) {
      expect((response.body as { error: { code: string } }).error.code).toBe(
        'OTP_RESEND_LIMIT',
      );
    }
    expect(oneTimeCodeMessages(e164)).toBe(4);

    const row = await harness!.db.execute(
      sql`SELECT re_requests FROM phone_verifications WHERE id = ${started.requestId}`,
    );
    expect((row.rows[0] as { re_requests: number }).re_requests).toBe(3);
  });
});

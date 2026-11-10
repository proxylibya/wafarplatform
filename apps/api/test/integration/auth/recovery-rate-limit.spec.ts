// The recovery steps' rate-limit exemption and the two number keys' aggregate
// ceiling: the request consumes the recovery budget, the code entry and the
// new-password step neither consume it nor are refused by it when it is spent,
// and three account-creation and three recovery requests for one number each
// allow the five incorrect entries, with the fourth request on either key
// refused (FR-051, FR-033, FR-034, AC-055, AC-035, AC-036; T137).
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
const newPassword = 'a different long password 42';
const phone = '0912345678';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function requestRecovery(
  jar: CookieJar,
): Promise<{ requestId: string; code: string; status: number; body: unknown }> {
  await bootstrap(harness!, jar);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone },
    { jar, csrf: true },
  );
  return {
    requestId:
      (response.body as { requestId?: string } | null)?.requestId ?? '',
    code: harness!.sms.lastCode() ?? '',
    status: response.status,
    body: response.body,
  };
}

async function requestSignUp(
  jar: CookieJar,
): Promise<{ status: number; body: unknown }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  return call(
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
}

async function enterCode(
  jar: CookieJar,
  requestId: string,
  code: string,
): Promise<{ status: number; body: unknown }> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot/verify',
    { requestId, code },
    { jar, csrf: true },
  );
}

describe.skipIf(!hasDatabase)('the recovery rate limits', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('exempts the code entry and the new-password step from the request budget', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const jar: CookieJar = {};
    const first = await requestRecovery(jar);
    expect(first.status).toBe(202);
    const second = await requestRecovery(jar);
    expect(second.status).toBe(202);
    const third = await requestRecovery(jar);
    expect(third.status).toBe(202);

    // The fourth request on the number key is refused with its retry hint.
    const fourth = await requestRecovery(jar);
    expect(fourth.status).toBe(429);
    expect(fourth.body).toMatchObject({
      error: { code: 'RATE_LIMITED', retryable: true },
    });
    const retryAfter = fourth.body as {
      error: { retryAfterSeconds: number };
    };
    expect(retryAfter.error.retryAfterSeconds).toBeGreaterThan(0);

    // The budget is spent, yet the code entry still runs: a wrong code is
    // OTP_INCORRECT, the correct one verifies, and the reset completes.
    const wrong = await enterCode(jar, third.requestId, '000000');
    expect(wrong.status).toBe(400);
    expect((wrong.body as { error: { code: string } }).error.code).toBe(
      'OTP_INCORRECT',
    );
    const verified = await enterCode(jar, third.requestId, third.code);
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'verified' });
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: third.requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(200);
    expect(reset.body).toEqual({ outcome: 'reset' });

    // No code-entry counter exists.
    const keys = await harness!.db.execute(
      sql`SELECT key FROM rate_limit_counters`,
    );
    for (const row of keys.rows as Array<{ key: string }>) {
      expect(row.key).not.toMatch(/code|entry|verify|reset/i);
      expect(row.key).toMatch(/^(account_creation|sign_in|recovery):(origin|number):/);
    }
  });

  it('allows five incorrect entries per number across the two paths and refuses the fourth request on either key', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });

    // Three account-creation requests are the number key's budget.
    const signUpJar: CookieJar = {};
    const signUpStatuses: number[] = [];
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await requestSignUp(signUpJar);
      signUpStatuses.push(response.status);
      if (response.status === 429) {
        expect((response.body as { error: { code: string } }).error.code).toBe(
          'RATE_LIMITED',
        );
      }
    }
    expect(signUpStatuses.slice(0, 3)).toEqual([202, 202, 202]);
    expect(signUpStatuses[3]).toBe(429);

    // Three recovery requests are the recovery key's budget.
    const recoveryJar: CookieJar = {};
    const recoveryStatuses: number[] = [];
    let live: { requestId: string; code: string } | null = null;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await requestRecovery(recoveryJar);
      recoveryStatuses.push(response.status);
      if (response.status === 202) {
        live = { requestId: response.requestId, code: response.code };
      } else {
        expect((response.body as { error: { code: string } }).error.code).toBe(
          'RATE_LIMITED',
        );
      }
    }
    expect(recoveryStatuses).toEqual([202, 202, 202, 429]);
    expect(live).not.toBeNull();

    // The request tolerates the five entries: four answer OTP_INCORRECT and the
    // fifth ends it, and no entry is ever refused as a rate limit - so no
    // separate code-entry budget exists even though the request budget is spent.
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const wrong = await enterCode(recoveryJar, live!.requestId, '000000');
      expect(wrong.status).toBe(400);
      expect((wrong.body as { error: { code: string } }).error.code).toBe(
        'OTP_INCORRECT',
      );
    }
    const ended = await enterCode(recoveryJar, live!.requestId, '000000');
    expect(ended.status).toBe(400);
    expect((ended.body as { error: { code: string } }).error.code).toBe(
      'OTP_REQUEST_ENDED',
    );
    const after = await enterCode(recoveryJar, live!.requestId, live!.code);
    expect(after.status).toBe(400);
    expect((after.body as { error: { code: string } }).error.code).toBe(
      'OTP_EXPIRED',
    );
  });
});

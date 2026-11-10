// The service's and the store's unavailability: `/health` answers 503 while the
// database is unreachable and the authentication surface answers the ordinary,
// retryable failure envelope; the database's return restores the probe and the
// request; and the messaging channel's refusal and 750 ms timeout fail only the
// dispatch that asked, with its structured record and its kind, while every
// other action continues (FR-040, FR-043, AC-043, AC-047; T148).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function count(table: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (rows.rows[0] as { n: number }).n;
}

describe.skipIf(!hasDatabase)('degradation', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('answers 503 for the store and restores both when it returns', async () => {
    const degraded = createHarness({
      connectionString:
        'postgres://wafar:wafar@127.0.0.1:59999/wafar?connect_timeout=1',
    });
    try {
      const health = await degraded.app.request('/health', { method: 'GET' });
      expect(health.status).toBe(503);
      expect(await health.json()).toEqual({
        status: 'degraded',
        database: 'error',
      });

      // The ordinary failure envelope, not a second "service unavailable" state.
      const jar: CookieJar = {};
      const pair = await bootstrap(degraded, jar);
      for (const [path, body] of [
        ['/api/v1/auth/sign-in', { phone: '0912345678', password }],
        ['/api/v1/auth/sign-up', { fullName: 'محمد علي', phone: '0912345678', password, city: city(), website: '', formStamp: pair.formStamp }],
        ['/api/v1/auth/password/forgot', { phone: '0912345678' }],
      ] as const) {
        const response = await call(degraded, 'POST', path, body, {
          jar,
          csrf: true,
        });
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: { code: 'INTERNAL_ERROR', retryable: true },
        });
      }
      const session = await call(degraded, 'GET', '/api/v1/auth/session', undefined, {
        headers: { cookie: 'wafar.session=the-degraded-token' },
      });
      expect(session.status).toBe(500);
      expect(session.body).toEqual({
        error: { code: 'INTERNAL_ERROR', retryable: true },
      });
    } finally {
      await degraded.close();
    }

    // The database's return restores the probe and the request.
    await harness!.reset();
    const health = await harness!.app.request('/health', { method: 'GET' });
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok', database: 'ok' });
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const signed = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar, csrf: true },
    );
    expect(signed.status).toBe(200);
  });

  it('fails only the dispatch that asks when the channel refuses or times out', async () => {
    await harness!.reset();
    const signUpJar: CookieJar = {};
    const pair = await bootstrap(harness!, signUpJar);
    harness!.clock.advance(4000);

    // Refused at acceptance: no pending row and no code.
    harness!.sms.result = 'refused';
    harness!.sms.failNext = 1;
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '0912345678',
        password,
        city: city(),
        website: '',
        formStamp: pair.formStamp,
      },
      { jar: signUpJar, csrf: true },
    );
    expect(refused.status).toBe(502);
    expect(refused.body).toEqual({
      error: { code: 'OTP_SEND_FAILED', retryable: true },
    });
    expect(await count('phone_verifications')).toBe(0);
    expect(harness!.sms.messages).toHaveLength(0);
    const signUpEvent = harness!.events.find(
      (event) => event.event === 'auth.otp.dispatch_failed',
    );
    expect(signUpEvent).toMatchObject({ kind: 'sign_up' });

    // The recovery dispatch's timeout at 750 ms: no row, no code, its own kind.
    const recoveryJar: CookieJar = {};
    await bootstrap(harness!, recoveryJar);
    harness!.sms.result = 'timed_out';
    harness!.sms.failNext = 1;
    harness!.sms.timeoutMs = 750;
    const startedAt = Date.now();
    const timedOut = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '0912345678' },
      { jar: recoveryJar, csrf: true },
    );
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(700);
    expect(timedOut.status).toBe(502);
    expect(timedOut.body).toEqual({
      error: { code: 'OTP_SEND_FAILED', retryable: true },
    });
    expect(await count('phone_verifications')).toBe(0);
    expect(harness!.sms.messages).toHaveLength(0);
    const recoveryEvent = harness!.events.find(
      (event) => event.event === 'auth.otp.dispatch_failed' && event.kind === 'recovery',
    );
    expect(recoveryEvent).toMatchObject({ kind: 'recovery' });
    harness!.sms.timeoutMs = 0;

    // The probe stays 200: the channel is outbound, not a readiness dependency.
    const health = await harness!.app.request('/health', { method: 'GET' });
    expect(health.status).toBe(200);

    // Every other action continues.
    await seedAccount(harness!, { phoneNumber: '+218912345679', password });
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345679', password },
          { jar, csrf: true },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/password/change',
          { currentPassword: password, newPassword },
          { jar, csrf: true },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(harness!, 'POST', '/api/v1/auth/sign-out-all', undefined, {
          jar,
          csrf: true,
        })
      ).status,
    ).toBe(204);
  });
});

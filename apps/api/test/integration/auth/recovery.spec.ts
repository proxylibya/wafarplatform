// The recovery flow: the uniform request, the code step, the new-password step,
// the no-account and administrator outcomes, the blocked confirmation, the
// verified state's expiry, and the reset's global revocation
// (FR-014, FR-015, FR-034, FR-013; T082, T083).
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import {
  bearer,
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

async function requestRecovery(
  jar: CookieJar,
  phone: string,
): Promise<{ requestId: string; code: string }> {
  await bootstrap(harness!, jar);
  const started = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone },
    { jar, csrf: true },
  );
  expect(started.status).toBe(202);
  return {
    requestId: (started.body as { requestId: string }).requestId,
    code: harness!.sms.lastCode() ?? '',
  };
}

async function verifyRecovery(
  jar: CookieJar,
  requestId: string,
  code: string,
): Promise<Record<string, unknown>> {
  const verified = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot/verify',
    { requestId, code },
    { jar, csrf: true },
  );
  expect(verified.status).toBe(200);
  return verified.body as Record<string, unknown>;
}

describe.skipIf(!hasDatabase)('the recovery flow', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('requests, verifies, and resets, ending every session', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    // A live session the reset must end.
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

    const started = await requestRecovery(jar, '0912345678');
    const outcome = await verifyRecovery(jar, started.requestId, started.code);
    expect(outcome).toEqual({ outcome: 'verified' });

    // A reload sees the verified state again.
    const resumed = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${started.requestId}`,
      undefined,
      { jar },
    );
    expect(resumed.status).toBe(200);
    expect((resumed.body as { state: string }).state).toBe('verified');

    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(200);
    expect(reset.body).toEqual({ outcome: 'reset' });

    const session = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(session.status).toBe(401);
    expect((session.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');

    const again: CookieJar = {};
    await bootstrap(harness!, again);
    const old = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: again, csrf: true },
    );
    expect(old.status).toBe(401);
    const fresh = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password: newPassword },
      { jar: again, csrf: true },
    );
    expect(fresh.status).toBe(200);
    expect(harness!.events.some((event) => event.event === 'auth.password.reset')).toBe(true);
    expect(account.id).toBeTruthy();
  });

  it('answers the same request for a number with no account and states no_account', async () => {
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    const outcome = await verifyRecovery(jar, started.requestId, started.code);
    expect(outcome).toEqual({ outcome: 'no_account' });
  });

  it('refuses an administrator account after the code, with no credential written', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
      role: 'administrator',
      mustChangePassword: true,
    });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    const outcome = await verifyRecovery(jar, started.requestId, started.code);
    expect(outcome).toEqual({ outcome: 'administrator_account' });
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(400);
    expect((reset.body as { error: { code: string } }).error.code).toBe('RECOVERY_EXPIRED');
  });

  it('completes the reset for a blocked account and states both facts', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
      status: 'blocked',
    });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    expect(await verifyRecovery(jar, started.requestId, started.code)).toEqual({
      outcome: 'verified',
    });
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.body).toEqual({ outcome: 'reset_blocked' });
    const event = harness!.events.find((entry) => entry.event === 'auth.password.reset');
    expect(event).toMatchObject({ blocked: true });
  });

  it('ends the verified state at the request’s lifetime', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    await verifyRecovery(jar, started.requestId, started.code);
    harness!.clock.advance(5 * 60 * 1000);
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(400);
    expect((reset.body as { error: { code: string } }).error.code).toBe('RECOVERY_EXPIRED');
  });

  it('ends the verified state when a newer request replaces it', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const first = await requestRecovery(jar, '0912345678');
    await verifyRecovery(jar, first.requestId, first.code);

    const second = await requestRecovery(jar, '0912345678');
    expect(second.requestId).not.toBe(first.requestId);

    const old = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${first.requestId}`,
      undefined,
      { jar },
    );
    expect((old.body as { error: { code: string } }).error.code).toBe('OTP_EXPIRED');

    const stale = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: first.requestId, newPassword },
      { jar, csrf: true },
    );
    expect((stale.body as { error: { code: string } }).error.code).toBe('RECOVERY_EXPIRED');
  });

  it('ends the verified state when the password changes by another path', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const session: CookieJar = {};
    await bootstrap(harness!, session);
    const signed = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: session, csrf: true },
    );
    expect(signed.status).toBe(200);
    const token = bearer(session)!;

    const recovery: CookieJar = {};
    const started = await requestRecovery(recovery, '0912345678');
    await verifyRecovery(recovery, started.requestId, started.code);

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar: session, csrf: true },
    );
    expect(changed.status).toBe(200);
    // The change's response clears the browser's cookie; the token itself is
    // still presented here so the revocation, not the clearing, is asserted.
    const ended = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `wafar.session=${token}` },
    });
    expect(ended.status).toBe(401);
    expect((ended.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');

    const stale = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword: 'yet another long password 7' },
      { jar: recovery, csrf: true },
    );
    expect((stale.body as { error: { code: string } }).error.code).toBe('RECOVERY_EXPIRED');
  });

  it('cannot authorise a second reset with the same code', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    await verifyRecovery(jar, started.requestId, started.code);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/password/reset',
          { requestId: started.requestId, newPassword },
          { jar, csrf: true },
        )
      ).status,
    ).toBe(200);

    const second = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword: 'yet another long password 7' },
      { jar, csrf: true },
    );
    expect(second.status).toBe(400);
    expect((second.body as { error: { code: string } }).error.code).toBe('RECOVERY_EXPIRED');
  });

  it('leaves the verified state live when a sign-in alone happens', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const recovery: CookieJar = {};
    const started = await requestRecovery(recovery, '0912345678');
    await verifyRecovery(recovery, started.requestId, started.code);

    const other: CookieJar = {};
    await bootstrap(harness!, other);
    const signed = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: other, csrf: true },
    );
    expect(signed.status).toBe(200);

    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword },
      { jar: recovery, csrf: true },
    );
    expect(reset.status).toBe(200);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar: other })).status,
    ).toBe(401);
  });

  it('refuses a superseded code as expired without spending an entry', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    const superseded = started.code;

    harness!.clock.advance(1000);
    const resent = await call(
      harness!,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId: started.requestId },
      { jar, csrf: true },
    );
    expect(resent.status).toBe(202);
    const live = harness!.sms.lastCode() ?? '';
    expect(live).not.toBe(superseded);

    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId: started.requestId, code: superseded },
      { jar, csrf: true },
    );
    expect(refused.status).toBe(400);
    expect((refused.body as { error: { code: string } }).error.code).toBe('OTP_EXPIRED');
    const row = await harness!.db.execute(
      sql`SELECT incorrect_entries FROM phone_verifications WHERE id = ${started.requestId}`,
    );
    expect((row.rows[0] as { incorrect_entries: number }).incorrect_entries).toBe(0);

    expect(await verifyRecovery(jar, started.requestId, live)).toEqual({
      outcome: 'verified',
    });
  });

  it('refuses a resend after verification and moves neither expiry', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const started = await requestRecovery(jar, '0912345678');
    await verifyRecovery(jar, started.requestId, started.code);

    const expiries = async (): Promise<Record<string, string>> => {
      const result = await harness!.db.execute(
        sql`SELECT code_expires_at, request_expires_at
            FROM phone_verifications WHERE id = ${started.requestId}`,
      );
      return result.rows[0] as Record<string, string>;
    };
    const before = await expiries();
    const dispatched = harness!.sms.messages.length;

    const resend = await call(
      harness!,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId: started.requestId },
      { jar, csrf: true },
    );
    expect(resend.status).toBe(400);
    expect((resend.body as { error: { code: string } }).error.code).toBe('OTP_EXPIRED');

    // No code was sent and the verified state's authority did not grow.
    expect(harness!.sms.messages.length).toBe(dispatched);
    expect(await expiries()).toEqual(before);
  });
});

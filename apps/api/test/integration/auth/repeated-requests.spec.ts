// The repeated requests whose first response was lost: a live submission the
// page is still tied to (its `X-Wafar-Pending` header naming the request)
// answers as it stands with no second dispatch and no spent allowance, while a
// submission after the page leaves that request is fresh and replaces it; a
// repeated code entry, reset, change, or sign-out of every device creates no
// second account, session, dispatch, password write, revocation, or notice
// (FR-011, FR-013, FR-031, FR-034, FR-038, FR-040, FR-043, AC-006, AC-014,
// AC-036, AC-043, AC-047; T147).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
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

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function count(table: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (rows.rows[0] as { n: number }).n;
}

async function submitSignUp(
  jar: CookieJar,
  phone: string,
  tie?: string,
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
    {
      jar,
      csrf: true,
      ...(tie === undefined ? {} : { headers: { 'x-wafar-pending': tie } }),
    },
  );
}

async function submitRecovery(
  jar: CookieJar,
  phone: string,
  tie?: string,
): Promise<{ status: number; body: unknown }> {
  await bootstrap(harness!, jar);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone },
    {
      jar,
      csrf: true,
      ...(tie === undefined ? {} : { headers: { 'x-wafar-pending': tie } }),
    },
  );
}

async function resume(
  jar: CookieJar,
  requestId: string,
): Promise<Record<string, unknown>> {
  const response = await call(
    harness!,
    'GET',
    `/api/v1/auth/verifications/${requestId}`,
    undefined,
    { jar },
  );
  expect(response.status).toBe(200);
  return response.body as Record<string, unknown>;
}

describe.skipIf(!hasDatabase)('the repeated requests whose first response was lost', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('answers a live sign-up repeat without a second dispatch or a spent allowance', async () => {
    const jar: CookieJar = {};
    const first = await submitSignUp(jar, '0912345678');
    expect(first.status).toBe(202);
    const requestId = (first.body as { requestId: string }).requestId;
    const dispatches = harness!.sms.messages.length;

    const repeat = await submitSignUp(jar, '0912345678', requestId);
    expect(repeat.status).toBe(202);
    expect((repeat.body as { requestId: string }).requestId).toBe(requestId);
    expect((repeat.body as { codeExpiresAt: string }).codeExpiresAt).toBe(
      (first.body as { codeExpiresAt: string }).codeExpiresAt,
    );
    expect(harness!.sms.messages.length).toBe(dispatches);
    expect((await resume(jar, requestId))['remainingReRequests']).toBe(3);

    // The code already sent is still valid.
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'created' });
  });

  it('keeps a live recovery repeat on its request and lets its code verify', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const first = await submitRecovery(jar, '0912345678');
    expect(first.status).toBe(202);
    const requestId = (first.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';
    const dispatches = harness!.sms.messages.length;

    const repeat = await submitRecovery(jar, '0912345678', requestId);
    expect(repeat.status).toBe(202);
    expect((repeat.body as { requestId: string }).requestId).toBe(requestId);
    expect(harness!.sms.messages.length).toBe(dispatches);
    expect((await resume(jar, requestId))['remainingReRequests']).toBe(3);

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
  });

  it('starts a fresh request when the page has left a live request', async () => {
    const jar: CookieJar = {};
    const first = await submitSignUp(jar, '0912345681');
    const requestId = (first.body as { requestId: string }).requestId;
    const dispatches = harness!.sms.messages.length;

    // The page's return to its first step drops its tie, so the submission
    // carries no tie header even though the cookie still names the live request.
    // It is a fresh request that replaces the pending one (FR-034, FR-038).
    const fresh = await submitSignUp(jar, '0912345681');
    expect(fresh.status).toBe(202);
    const freshId = (fresh.body as { requestId: string }).requestId;
    expect(freshId).not.toBe(requestId);
    expect(harness!.sms.messages.length).toBe(dispatches + 1);
    expect((await resume(jar, freshId))['remainingReRequests']).toBe(3);

    const rows = await harness!.db.execute(
      sql`SELECT id FROM phone_verifications WHERE phone_number = '+218912345681'`,
    );
    expect(rows.rows).toEqual([{ id: freshId }]);
  });

  it('starts a fresh request after the page returns to its first step', async () => {
    const jar: CookieJar = {};
    const first = await submitSignUp(jar, '0912345679');
    const requestId = (first.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';

    // The fifth incorrect entry ends the request, so the page is back on the
    // first step and no live row remains.
    const wrong = code === '000000' ? '111111' : '000000';
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await call(
        harness!,
        'POST',
        '/api/v1/auth/sign-up/verify',
        { requestId, code: wrong },
        { jar, csrf: true },
      );
    }
    expect(await count('phone_verifications')).toBe(0);

    const dispatches = harness!.sms.messages.length;
    const fresh = await submitSignUp(jar, '0912345679');
    expect(fresh.status).toBe(202);
    expect((fresh.body as { requestId: string }).requestId).not.toBe(requestId);
    expect(harness!.sms.messages.length).toBe(dispatches + 1);
  });

  it('creates no second account or session when the code entry is repeated', async () => {
    const jar: CookieJar = {};
    const first = await submitSignUp(jar, '0912345680');
    const requestId = (first.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(verified.status).toBe(200);
    const users = await count('users');
    const sessions = await count('sessions');

    const repeated = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(repeated.status).toBe(400);
    expect((repeated.body as { error: { code: string } }).error.code).toBe(
      'OTP_EXPIRED',
    );
    expect(await count('users')).toBe(users);
    expect(await count('sessions')).toBe(sessions);
    expect(await count('phone_verifications')).toBe(0);
  });

  it('writes no password and sends no second notice when the reset or the change is repeated', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const started = await submitRecovery(jar, '0912345678');
    const requestId = (started.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';
    await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId, newPassword },
      { jar, csrf: true },
    );
    expect(reset.status).toBe(200);
    const messages = harness!.sms.messages.length;

    const repeatedReset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId, newPassword },
      { jar, csrf: true },
    );
    expect(repeatedReset.status).toBe(400);
    expect((repeatedReset.body as { error: { code: string } }).error.code).toBe(
      'RECOVERY_EXPIRED',
    );
    expect(harness!.sms.messages.length).toBe(messages);

    // The new credential stands, the old one does not.
    const again: CookieJar = {};
    await bootstrap(harness!, again);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password },
          { jar: again, csrf: true },
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password: newPassword },
          { jar: again, csrf: true },
        )
      ).status,
    ).toBe(200);

    // The account's own change, then its repeat: the second is refused as an
    // ended session, writes nothing, revokes nothing, and sends no notice.
    const changeJar: CookieJar = {};
    await bootstrap(harness!, changeJar);
    expect(
      (
        await call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password: newPassword },
          { jar: changeJar, csrf: true },
        )
      ).status,
    ).toBe(200);
    const token = bearer(changeJar)!;
    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: newPassword, newPassword: 'a third long password 99' },
      { jar: changeJar, csrf: true },
    );
    expect(changed.status).toBe(200);
    const afterChange = harness!.sms.messages.length;
    const revoked = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NOT NULL`,
    );
    const revokedCount = (revoked.rows[0] as { n: number }).n;

    const repeatJar: CookieJar = {};
    await bootstrap(harness!, repeatJar);
    repeatJar['wafar.session'] = token;
    const repeatedChange = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: newPassword, newPassword: 'a fourth long password 88' },
      { jar: repeatJar, csrf: true },
    );
    expect(repeatedChange.status).toBe(401);
    expect((repeatedChange.body as { error: { code: string } }).error.code).toBe(
      'SESSION_ENDED',
    );
    expect(harness!.sms.messages.length).toBe(afterChange);

    // The repeat of the sign-out of every device revokes nothing and sends no
    // second notice.
    const repeatOutJar: CookieJar = {};
    await bootstrap(harness!, repeatOutJar);
    repeatOutJar['wafar.session'] = token;
    const repeatedOut = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-out-all',
      undefined,
      { jar: repeatOutJar, csrf: true },
    );
    expect(repeatedOut.status).toBe(204);
    expect(harness!.sms.messages.length).toBe(afterChange);
    const revokedAfter = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NOT NULL`,
    );
    expect((revokedAfter.rows[0] as { n: number }).n).toBe(revokedCount);
  });
});

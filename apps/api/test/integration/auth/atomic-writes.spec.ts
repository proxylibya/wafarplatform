// The indivisible writes: a failure injected after each part rolls the unit of
// work back, so no partial row survives, the previous credential and sessions
// are as they were, the correct code stays usable, and the response is the
// inline, explicit, retryable failure (FR-004, FR-013, FR-014, FR-028, FR-034,
// FR-040, AC-004, AC-014, AC-016, AC-036, AC-043; T146).
import { eq, sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { sessions, users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import { provision } from '../../support/cli.ts';
import { createFault } from '../../support/fault.ts';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import { createAdministratorSignInService } from '../../../src/modules/auth/service/sign-in-administrator.ts';

const password = 'correct horse battery staple';
const newPassword = 'a different long password 42';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function count(harness: ReturnType<typeof createHarness>, table: string): Promise<number> {
  const result = await harness.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (result.rows[0] as { n: number }).n;
}

describe.skipIf(!hasDatabase)('the indivisible writes', () => {
  const opened: Array<ReturnType<typeof createHarness>> = [];
  afterEach(async () => {
    while (opened.length > 0) await opened.pop()!.close();
  });

  function open(fault: ReturnType<typeof createFault>): ReturnType<typeof createHarness> {
    const harness = createHarness({ fault });
    opened.push(harness);
    return harness;
  }

  it('writes nothing when the account creation fails after the credential insert', async () => {
    const fault = createFault({ table: 'sessions', verb: 'insert' });
    const harness = open(fault);
    await harness.reset();

    const jar: CookieJar = {};
    const pair = await bootstrap(harness, jar);
    harness.clock.advance(4000);
    const started = await call(
      harness,
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
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;
    const code = harness.sms.lastCode() ?? '';

    const failed = await call(
      harness,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(500);
    expect(failed.body).toEqual({
      error: { code: 'ACCOUNT_CREATION_FAILED', retryable: true },
    });
    expect(await count(harness, 'users')).toBe(0);
    expect(await count(harness, 'accounts')).toBe(0);
    expect(await count(harness, 'sessions')).toBe(0);

    // The correct code is still usable: the pending row and its code survived.
    const resume = await call(
      harness,
      'GET',
      `/api/v1/auth/verifications/${requestId}`,
      undefined,
      { jar },
    );
    expect(resume.status).toBe(200);
    expect((resume.body as { state: string }).state).toBe('pending');

    fault.active = false;
    const retried = await call(
      harness,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(retried.status).toBe(200);
    expect(retried.body).toEqual({ outcome: 'created' });
    expect(await count(harness, 'users')).toBe(1);
    expect(await count(harness, 'accounts')).toBe(1);
    expect(await count(harness, 'sessions')).toBe(1);
  });

  it('keeps the previous password and every session when a change fails after the credential write', async () => {
    const fault = createFault({ table: 'phone_verifications', verb: 'delete' });
    const harness = open(fault);
    await harness.reset();
    await seedAccount(harness, { phoneNumber: '+218912345678', password });

    const jar: CookieJar = {};
    await bootstrap(harness, jar);
    const signed = await call(
      harness,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar, csrf: true },
    );
    expect(signed.status).toBe(200);
    const liveBefore = await count(
      harness,
      'sessions',
    );

    const failed = await call(
      harness,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(500);
    expect(failed.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR', retryable: true },
    });

    // The credential and the sessions are exactly as they were.
    const again: CookieJar = {};
    await bootstrap(harness, again);
    expect(
      (
        await call(
          harness,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password: newPassword },
          { jar: again, csrf: true },
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await call(
          harness,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password },
          { jar: again, csrf: true },
        )
      ).status,
    ).toBe(200);
    const live = await harness.db
      .select()
      .from(sessions)
      .where(sql`${sessions.revokedAt} IS NULL`);
    expect(live.length).toBe(liveBefore + 1);
    expect(harness.events.some((event) => event.event === 'auth.password.changed')).toBe(false);
  });

  it('keeps the reset’s verified state and credential when its write fails', async () => {
    const fault = createFault({ table: 'phone_verifications', verb: 'delete' });
    const harness = open(fault);
    await harness.reset();
    await seedAccount(harness, { phoneNumber: '+218912345678', password });

    const jar: CookieJar = {};
    await bootstrap(harness, jar);
    const requested = await call(
      harness,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '0912345678' },
      { jar, csrf: true },
    );
    expect(requested.status).toBe(202);
    const requestId = (requested.body as { requestId: string }).requestId;
    const code = harness.sms.lastCode() ?? '';
    const verified = await call(
      harness,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'verified' });

    const failed = await call(
      harness,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId, newPassword },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(500);
    expect(failed.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR', retryable: true },
    });

    // The previous credential and the verified state survive.
    const signInJar: CookieJar = {};
    await bootstrap(harness, signInJar);
    expect(
      (
        await call(
          harness,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: '0912345678', password },
          { jar: signInJar, csrf: true },
        )
      ).status,
    ).toBe(200);
    expect(await count(harness, 'phone_verifications')).toBe(1);
    expect(harness.events.some((event) => event.event === 'auth.password.reset')).toBe(false);

    fault.active = false;
    const retried = await call(
      harness,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId, newPassword },
      { jar, csrf: true },
    );
    expect(retried.status).toBe(200);
    expect(retried.body).toEqual({ outcome: 'reset' });
  });

  it('keeps the forced requirement and the previous password when the administrator change fails', async () => {
    const fault = createFault({ table: 'phone_verifications', verb: 'delete' });
    const harness = open(fault);
    await harness.reset();
    const provisioned = provision({
      phone: '+218912345678',
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(provisioned.status).toBe(0);

    const service = createAdministratorSignInService(harness.db, harness.auth);
    const signed = await service.signInAdministrator({
      phoneNumber: '+218912345678',
      password,
      now: harness.clock.now(),
      requestId: 't146-admin',
      events: { emit: () => undefined },
    });
    expect(signed).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (signed.outcome !== 'signed_in') return;
    const jar: CookieJar = {};
    await bootstrap(harness, jar);
    jar['wafar.session'] = signed.token;

    const failed = await call(
      harness,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(500);
    const row = (
      await harness.db.select().from(users).where(eq(users.phoneNumber, '+218912345678'))
    )[0];
    expect(row?.mustChangePassword).toBe(true);
    expect(
      (
        await service.signInAdministrator({
          phoneNumber: '+218912345678',
          password,
          now: harness.clock.now(),
          requestId: 't146-admin-again',
          events: { emit: () => undefined },
        })
      ).outcome,
    ).toBe('signed_in');
    const revoked = await harness.db
      .select()
      .from(sessions)
      .where(sql`${sessions.revokedAt} IS NOT NULL`);
    expect(revoked).toHaveLength(0);
  });

  it('keeps the previous code and consumes no allowance when the replacement cannot be installed', async () => {
    // The resend installs the replacement with UPDATEs; the second one is the
    // write that must roll back (T146, T247).
    const fault = createFault({
      table: 'phone_verifications',
      verb: 'update',
      occurrence: 2,
    });
    const harness = open(fault);
    await harness.reset();

    const jar: CookieJar = {};
    const pair = await bootstrap(harness, jar);
    harness.clock.advance(4000);
    const started = await call(
      harness,
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
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;
    const codeExpiresAt = (started.body as { codeExpiresAt: string }).codeExpiresAt;
    const firstCode = harness.sms.lastCode() ?? '';

    const failed = await call(
      harness,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(500);
    expect(failed.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR', retryable: true },
    });

    // The request is unchanged: same expiry, the allowance unspent.
    const resume = await call(
      harness,
      'GET',
      `/api/v1/auth/verifications/${requestId}`,
      undefined,
      { jar },
    );
    expect(resume.status).toBe(200);
    expect((resume.body as { codeExpiresAt: string }).codeExpiresAt).toBe(codeExpiresAt);
    expect((resume.body as { remainingReRequests: number }).remainingReRequests).toBe(3);
    const stored = await harness.db.execute(
      sql`SELECT re_requests FROM phone_verifications WHERE id = ${requestId}`,
    );
    expect(stored.rows[0]).toMatchObject({ re_requests: 0 });

    // The code already sent is still valid.
    const verified = await call(
      harness,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: firstCode },
      { jar, csrf: true },
    );
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'created' });
  });
});

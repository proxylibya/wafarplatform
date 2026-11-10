// The merchant surface refuses an administrator account: the uniform sign-in
// text for a correct password, a wrong password, and an unknown number; the
// recovery's administrator outcome after the code; and the block never
// mentioned when both the block and the role apply (FR-027, FR-014, AC-029,
// AC-016; T109).
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { users, phoneVerifications } from '@wafar/db';
import { hashOneTimeCode, hashResumeToken } from '../../../src/modules/auth/service/password-policy.ts';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import { provision } from '../../support/cli.ts';
import {
  bearer,
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'administrator initial password';
const phone = '+218912345678';
const national = '0912345678';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function requestRecovery(jar: CookieJar): Promise<{ requestId: string; code: string }> {
  await bootstrap(harness!, jar);
  const started = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone: national },
    { jar, csrf: true },
  );
  expect(started.status).toBe(202);
  return {
    requestId: (started.body as { requestId: string }).requestId,
    code: harness!.sms.lastCode() ?? '',
  };
}

describe.skipIf(!hasDatabase)('the merchant surface and an administrator account', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('gives the administrator the uniform sign-in refusal and the recovery role outcome', async () => {
    const provisioned = provision({
      phone,
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(provisioned.status).toBe(0);

    // The three sign-in transcripts share one text, one status, and no admin hint.
    const transcripts: string[] = [];
    for (const attempt of [
      { phone: national, password },
      { phone: national, password: 'the wrong password entirely' },
      { phone: '0912345679', password },
    ]) {
      const jar: CookieJar = {};
      await bootstrap(harness!, jar);
      const response = await call(
        harness!,
        'POST',
        '/api/v1/auth/sign-in',
        attempt,
        { jar, csrf: true },
      );
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: { code: 'AUTH_INVALID_CREDENTIALS' },
      });
      expect(bearer(jar)).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toMatch(/administrator|admin|role/);
      transcripts.push(JSON.stringify(response.body));
    }
    expect(new Set(transcripts).size).toBe(1);

    // The recovery's role refusal after the code.
    const recovery: CookieJar = {};
    const started = await requestRecovery(recovery);
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId: started.requestId, code: started.code },
      { jar: recovery, csrf: true },
    );
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'administrator_account' });

    // The pending row is gone, so the request cannot be retried or reset.
    const rows = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM phone_verifications`,
    );
    expect((rows.rows[0] as { n: number }).n).toBe(0);
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: started.requestId, newPassword: 'a replacement password 42' },
      { jar: recovery, csrf: true },
    );
    expect((reset.body as { error: { code: string } }).error.code).toBe(
      'RECOVERY_EXPIRED',
    );
  });

  it('never mentions the block when the account is both blocked and an administrator', async () => {
    const provisioned = provision({
      phone,
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(provisioned.status).toBe(0);
    await harness!.db
      .update(users)
      .set({ status: 'blocked' })
      .where(eq(users.phoneNumber, phone));

    // The sign-in text is the same one every sign-in failure carries.
    const signInJar: CookieJar = {};
    await bootstrap(harness!, signInJar);
    const signIn = await call(
    harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: national, password },
      { jar: signInJar, csrf: true },
    );
    expect(signIn.status).toBe(401);
    expect(signIn.body).toMatchObject({
      error: { code: 'AUTH_INVALID_CREDENTIALS' },
    });
    expect(JSON.stringify(signIn.body)).not.toMatch(/blocked|محظور/);

    // The role decides before the status: the outcome is the administrator's.
    const recovery: CookieJar = {};
    const started = await requestRecovery(recovery);
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot/verify',
      { requestId: started.requestId, code: started.code },
      { jar: recovery, csrf: true },
    );
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'administrator_account' });
    expect(JSON.stringify(verified.body)).not.toMatch(/blocked|محظور/);

    // No credential was written and no session was issued.
    const sessions = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM sessions`,
    );
    expect((sessions.rows[0] as { n: number }).n).toBe(0);
  });

  it('refuses a recovery row at the sign-up step and re-asserts the role inside the reset', async () => {
    const provisioned = provision({
      phone,
      fullName: 'مدير المنصة',
      city: city(),
      password,
    });
    expect(provisioned.status).toBe(0);

    // A recovery row's code presented at the sign-up step is refused before it
    // is compared, so it cannot mark the row verified (FR-027).
    const recovery: CookieJar = {};
    const started = await requestRecovery(recovery);
    const crossStep = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: started.code },
      { jar: recovery, csrf: true },
    );
    expect(crossStep.status).toBe(400);
    expect((crossStep.body as { error: { code: string } }).error.code).toBe(
      'OTP_EXPIRED',
    );
    const pending = await harness!.db.execute(
      sql`SELECT state FROM phone_verifications`,
    );
    expect((pending.rows[0] as { state: string }).state).toBe('pending');

    // A row that reached the verified state by another path is still refused:
    // the reset transaction re-asserts the administrator role, deletes the row,
    // writes no credential, and creates no session.
    await harness!.db.execute(sql`DELETE FROM phone_verifications`);
    const id = 'administrator-verified-recovery-row';
    const token = 'administrator-verified-recovery-token';
    const now = harness!.clock.now();
    await harness!.db.insert(phoneVerifications).values({
      id,
      phoneNumber: phone,
      purpose: 'recovery',
      state: 'verified',
      codeHash: await hashOneTimeCode('123456', id),
      codeExpiresAt: new Date(now.getTime() + 600_000),
      requestExpiresAt: new Date(now.getTime() + 600_000),
      incorrectEntries: 0,
      reRequests: 0,
      resumeTokenHash: hashResumeToken(token),
      verifiedAt: now,
    });
    const before = await harness!.db.execute(
      sql`SELECT password FROM accounts ORDER BY id`,
    );
    const resetJar: CookieJar = {};
    await bootstrap(harness!, resetJar);
    resetJar['wafar.pending'] = `${id}.${token}`;
    const reset = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/reset',
      { requestId: id, newPassword: 'a replacement password 42' },
      { jar: resetJar, csrf: true },
    );
    expect(reset.status).toBe(400);
    expect((reset.body as { error: { code: string } }).error.code).toBe(
      'RECOVERY_EXPIRED',
    );
    const after = await harness!.db.execute(
      sql`SELECT password FROM accounts ORDER BY id`,
    );
    expect(after.rows).toEqual(before.rows);
    const rows = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM phone_verifications`,
    );
    expect((rows.rows[0] as { n: number }).n).toBe(0);
    const sessions = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM sessions`,
    );
    expect((sessions.rows[0] as { n: number }).n).toBe(0);
  });
});

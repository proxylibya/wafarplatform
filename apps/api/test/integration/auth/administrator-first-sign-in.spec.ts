// The administrator's first sign-in and forced change: the restricted session,
// the change's current-password check, the repeated initial password refused,
// the lock refusing the check for its full duration, the change clearing the
// requirement and ending every session, the notice, sign-out, the inactivity
// end, and the platform revocation (FR-028, FR-013, FR-009, FR-043, AC-030;
// T108).
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions, users } from '@wafar/db';
import { lockMinutes } from '@wafar/shared';
import { provision } from '../../support/cli.ts';
import {
  bearer,
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import { authenticate, SESSION_COOKIE } from '../../../src/http/context.ts';
import { createAdministratorSignInService } from '../../../src/modules/auth/service/sign-in-administrator.ts';
import { createAdministratorPasswordChange } from '../../../src/modules/auth/service/password-change-administrator.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'administrator initial password';
const newPassword = 'a different administrator password 42';
const phone = '+218912345678';
const national = '0912345678';

async function count(query: ReturnType<typeof sql>): Promise<number> {
  const result = await harness!.db.execute(query);
  return (result.rows[0] as { n: number }).n;
}

async function provisionAdministrator(): Promise<void> {
  const result = provision({
    phone,
    fullName: 'مدير المنصة',
    city: 'طرابلس',
    password,
  });
  expect(result.status).toBe(0);
}

describe.skipIf(!hasDatabase)('the administrator’s first sign-in and forced change', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('admits the first sign-in as restricted and runs the forced change once', async () => {
    await provisionAdministrator();
    const service = createAdministratorSignInService(harness!.db, harness!.auth);
    const now = harness!.clock.now();

    // Accepted, and restricted while the forced change stands.
    const signed = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now,
      requestId: 't108-sign-in',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(signed).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (signed.outcome !== 'signed_in') return;

    // The computed rule: an unrestricted-only action is refused, the change and
    // the session's own reads stay available.
    const restricted = await authenticate(harness!.db, harness!.auth, {
      token: signed.token,
      now,
      requiresUnrestricted: true,
      isUserInitiated: false,
    });
    expect(restricted).toEqual({ kind: 'refused', code: 'PASSWORD_CHANGE_REQUIRED' });
    const readable = await authenticate(harness!.db, harness!.auth, {
      token: signed.token,
      now,
      requiresUnrestricted: false,
      isUserInitiated: false,
    });
    expect(readable.kind).toBe('session');
    expect(readable.kind === 'session' ? readable.restricted : null).toBe(true);

    // A restricted administrator signs out, and the session ends.
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    jar[SESSION_COOKIE] = signed.token;
    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar,
      csrf: true,
    });
    expect(out.status).toBe(204);
    // The response clears the browser's cookie; the token itself is ended.
    expect(out.cookies.some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=;`))).toBe(true);
    const ended = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `${SESSION_COOKIE}=${signed.token}` },
    });
    expect(ended.status).toBe(401);
    expect((ended.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');

    // A fresh sign-in is restricted again.
    const again = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-sign-in-2',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(again).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (again.outcome !== 'signed_in') return;

    // The branch admits only a restricted administrator: a merchant is refused.
    const merchant = await seedAccount(harness!, {
      phoneNumber: '+218912345679',
      password: 'merchant password value',
    });
    const branch = createAdministratorPasswordChange(harness!.db, harness!.auth);
    const notAdministrator = await branch.change({
      userId: merchant.id,
      token: 'no-session-token',
      currentPassword: 'merchant password value',
      newPassword,
      now: harness!.clock.now(),
      requestId: 't108-branch-merchant',
      events: { emit: () => undefined },
    });
    expect(notAdministrator).toEqual({ status: 'refused', code: 'SESSION_ENDED' });

    // The change requires the current password.
    const wrongCurrent = await branch.change({
      userId: signed.userId,
      token: 'no-session-token',
      currentPassword: 'the wrong current password',
      newPassword,
      now: harness!.clock.now(),
      requestId: 't108-wrong-current',
      events: { emit: () => undefined },
    });
    expect(wrongCurrent).toEqual({
      status: 'refused',
      code: 'AUTH_INVALID_CREDENTIALS',
    });

    // A repeat of the initial password is refused before the lock and the check.
    const repeated = await branch.change({
      userId: signed.userId,
      token: 'no-session-token',
      currentPassword: password,
      newPassword: password,
      now: harness!.clock.now(),
      requestId: 't108-repeat',
      events: { emit: () => undefined },
    });
    expect(repeated).toEqual({ status: 'refused', code: 'PASSWORD_UNCHANGED' });

    // The lock refuses the check for its full duration and lifts at its own end.
    const lockedUntil = new Date(harness!.clock.now().getTime() + lockMinutes * 60_000);
    await harness!.db.execute(
      sql`UPDATE users SET failed_sign_in_count = 5, locked_until = ${lockedUntil.toISOString()} WHERE phone_number = ${phone}`,
    );
    const liveBeforeLock = await count(
      sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL`,
    );
    const lockedSignIn = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-locked',
      events: { emit: () => undefined },
    });
    expect(lockedSignIn).toEqual({ outcome: 'invalid', reason: 'locked' });
    // The lock refuses the sign-in without issuing a session.
    expect(
      await count(sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL`),
    ).toBe(liveBeforeLock);

    harness!.clock.advance(lockMinutes * 60_000 - 1);
    const stillLocked = await branch.change({
      userId: signed.userId,
      token: signed.token,
      currentPassword: password,
      newPassword,
      now: harness!.clock.now(),
      requestId: 't108-still-locked',
      events: { emit: () => undefined },
    });
    expect(stillLocked).toEqual({
      status: 'refused',
      code: 'AUTH_INVALID_CREDENTIALS',
    });

    harness!.clock.advance(1);
    const atTheBound = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-unlocked',
      events: { emit: () => undefined },
    });
    expect(atTheBound).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (atTheBound.outcome !== 'signed_in') return;

    // The session timeout remains available to the restricted account.
    harness!.clock.advance(30 * 60 * 1000);
    const timedOut = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `${SESSION_COOKIE}=${atTheBound.token}` },
    });
    expect(timedOut.status).toBe(401);
    expect((timedOut.body as { error: { code: string } }).error.code).toBe(
      'SESSION_ENDED',
    );

    // A platform revocation remains available too.
    const fresh = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-revoke',
      events: { emit: () => undefined },
    });
    expect(fresh).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (fresh.outcome !== 'signed_in') return;
    const resolved = await harness!.auth.resolve(
      fresh.token,
      harness!.clock.now(),
    );
    await harness!.auth.revoke(
      resolved!.token,
      'platform_revocation',
      harness!.clock.now(),
    );
    const revoked = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      headers: { cookie: `${SESSION_COOKIE}=${fresh.token}` },
    });
    expect(revoked.status).toBe(401);
    expect((revoked.body as { error: { code: string } }).error.code).toBe(
      'SESSION_ENDED',
    );

    // The forced change: three live sessions, one credential write, every
    // session ended, the requirement cleared, and the notice sent.
    const changeJar: CookieJar = {};
    await bootstrap(harness!, changeJar);
    const signedAgain = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-change',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(signedAgain).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (signedAgain.outcome !== 'signed_in') return;
    changeJar[SESSION_COOKIE] = signedAgain.token;
    const liveBeforeSeeding = await count(
      sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL`,
    );
    await harness!.db.insert(sessions).values([
      {
        id: 'seeded-session-1',
        userId: signedAgain.userId,
        token: 'seededtoken1'.padEnd(32, 'x'),
        expiresAt: new Date(harness!.clock.now().getTime() + 12 * 60 * 60 * 1000),
        lastActivityAt: harness!.clock.now(),
      },
      {
        id: 'seeded-session-2',
        userId: signedAgain.userId,
        token: 'seededtoken2'.padEnd(32, 'y'),
        expiresAt: new Date(harness!.clock.now().getTime() + 12 * 60 * 60 * 1000),
        lastActivityAt: harness!.clock.now(),
      },
    ]);
    expect(
      await count(sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL`),
    ).toBe(liveBeforeSeeding + 2);

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar: changeJar, csrf: true },
    );
    expect(changed.status).toBe(200);
    expect(changed.body).toEqual({ outcome: 'changed' });

    const row = (await harness!.db.select().from(users).where(eq(users.phoneNumber, phone)))[0];
    expect(row?.mustChangePassword).toBe(false);
    expect(
      await count(sql`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL`),
    ).toBe(0);
    const notice = harness!.sms.messages.find(
      (message) => message.kind === 'notice_password_changed',
    );
    expect(notice).toBeDefined();
    expect(
      harness!.events.some((event) => event.event === 'auth.password.changed'),
    ).toBe(true);
    // One action, one record: no revocation record carries `password_change`.
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

    // The old password no longer signs in; the change is the credential write.
    const oldPassword = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't108-old',
      events: { emit: () => undefined },
    });
    expect(oldPassword.outcome).toBe('invalid');
    const newPasswordSignIn = await service.signInAdministrator({
      phoneNumber: phone,
      password: newPassword,
      now: harness!.clock.now(),
      requestId: 't108-new',
      events: { emit: () => undefined },
    });
    expect(newPasswordSignIn).toMatchObject({ outcome: 'signed_in', restricted: false });

    // The merchant route refuses the administrator uniformly, and no cookie
    // is issued for the number.
    const merchantJar: CookieJar = {};
    await bootstrap(harness!, merchantJar);
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: national, password: newPassword },
      { jar: merchantJar, csrf: true },
    );
    expect(refused.status).toBe(401);
    expect((refused.body as { error: { code: string } }).error.code).toBe(
      'AUTH_INVALID_CREDENTIALS',
    );
    expect(bearer(merchantJar)).toBeUndefined();
  });

  it('clears the counted failures on the forced change and starts the next run at one', async () => {
    await provisionAdministrator();
    const service = createAdministratorSignInService(harness!.db, harness!.auth);
    const signed = await service.signInAdministrator({
      phoneNumber: phone,
      password,
      now: harness!.clock.now(),
      requestId: 't176-forced-sign-in',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(signed).toMatchObject({ outcome: 'signed_in', restricted: true });
    if (signed.outcome !== 'signed_in') return;

    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    jar[SESSION_COOKIE] = signed.token;

    const failedChecks = async (): Promise<number> =>
      count(sql`SELECT failed_sign_in_count::int AS n FROM users WHERE phone_number = ${phone}`);

    // Four counted failures on the forced change's current-password check.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const refused = await call(
        harness!,
        'POST',
        '/api/v1/auth/password/change',
        { currentPassword: 'the wrong current password', newPassword },
        { jar, csrf: true },
      );
      expect(refused.status).toBe(401);
    }
    expect(await failedChecks()).toBe(4);

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(changed.status).toBe(200);
    expect(await failedChecks()).toBe(0);

    // The next failure starts a new run at one.
    const failed = await service.signInAdministrator({
      phoneNumber: phone,
      password: 'the wrong current password',
      now: harness!.clock.now(),
      requestId: 't176-next-failure',
      events: { emit: (event) => harness!.events.push(event) },
    });
    expect(failed.outcome).toBe('invalid');
    expect(await failedChecks()).toBe(1);
  });
});

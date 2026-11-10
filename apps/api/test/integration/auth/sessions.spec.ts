// The session endings: sign-in, the session read, sign-out of one device,
// sign-out of every device, the password change's global revocation, and a
// failed current-password check ending none (FR-007, FR-010, FR-011, FR-012,
// FR-013, FR-032; T059).
import { eq, sql } from 'drizzle-orm';
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { sessions } from '@wafar/db';
import { sessionAbsoluteSeconds, sessionInactivitySeconds } from '@wafar/shared';
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

async function signIn(
  jar: CookieJar,
  phone: string,
  value = password,
): Promise<number> {
  await bootstrap(harness!, jar);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-in',
    { phone, password: value },
    { jar, csrf: true },
  );
  return response.status;
}

describe.skipIf(!hasDatabase)('the session endings', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('signs in without a code and reads the session back without a phone', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    const read = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({
      authenticated: true,
      user: { fullName: 'محمد علي' },
    });
    const text = JSON.stringify(read.body);
    expect(text).not.toContain('912345678');
    expect(text).not.toContain('طرابلس');
  });

  it('signs out of one session and leaves the other live', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const first: CookieJar = {};
    const second: CookieJar = {};
    expect(await signIn(first, '0912345678')).toBe(200);
    expect(await signIn(second, '0912345678')).toBe(200);

    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar: first,
      csrf: true,
    });
    expect(out.status).toBe(204);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar: first })).body,
    ).toEqual({ authenticated: false });
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar: second })).status,
    ).toBe(200);

    // Sign-out is idempotent.
    const again = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar: first,
      csrf: true,
    });
    expect(again.status).toBe(204);
  });

  it('ends every session and dispatches one notice on sign-out-all', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const first: CookieJar = {};
    const second: CookieJar = {};
    expect(await signIn(first, '0912345678')).toBe(200);
    expect(await signIn(second, '0912345678')).toBe(200);
    const before = harness!.sms.messages.length;

    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out-all', undefined, {
      jar: first,
      csrf: true,
    });
    expect(out.status).toBe(204);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar: first })).body,
    ).toEqual({ authenticated: false });
    const other = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      jar: second,
    });
    expect(other.status).toBe(401);
    expect((other.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');
    expect(harness!.sms.messages.length).toBe(before + 1);
    expect(harness!.sms.messages.at(-1)?.kind).toBe('notice_signed_out_all');
  });

  it('ends every session on the password change and accepts only the new password', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const other: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    expect(await signIn(other, '0912345678')).toBe(200);

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(changed.status).toBe(200);
    expect(changed.body).toEqual({ outcome: 'changed' });

    const old = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      jar: other,
    });
    expect(old.status).toBe(401);
    expect((old.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar })).body,
    ).toEqual({ authenticated: false });

    const again: CookieJar = {};
    expect(await signIn(again, '0912345678', password)).toBe(401);
    expect(await signIn(again, '0912345678', newPassword)).toBe(200);
    expect(harness!.events.some((event) => event.event === 'auth.password.changed')).toBe(true);

    // One action, one record: the change emits its own record alone, and no
    // revocation record carries the endings it produced (FR-037, AC-040).
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
  });

  it('clears the run of counted failures on a successful change', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);

    const failedCount = async (): Promise<number> => {
      const result = await harness!.db.execute(
        sql`SELECT failed_sign_in_count::int AS n FROM users WHERE id = ${account.id}`,
      );
      return (result.rows[0] as { n: number }).n;
    };

    // Four counted failures on the sign-in path, then the change.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(await signIn({}, '0912345678', 'a wrong but long password')).toBe(401);
    }
    expect(await failedCount()).toBe(4);

    const changed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: password, newPassword },
      { jar, csrf: true },
    );
    expect(changed.status).toBe(200);
    expect(await failedCount()).toBe(0);

    // The next failure starts a new run at one.
    expect(await signIn({}, '0912345678', 'a wrong but long password')).toBe(401);
    expect(await failedCount()).toBe(1);
  });

  it('ends no session on a failed current-password check and reports its path', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    const failed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: 'wrong password value', newPassword },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(401);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar })).status,
    ).toBe(200);
    const event = harness!.events.find(
      (entry) => entry.event === 'auth.password.current_check_failed',
    );
    expect(event).toMatchObject({ path: 'change' });
  });

  it('refuses an empty current password as a credential failure, not a policy failure', async () => {
    const account = await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);

    const failed = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/change',
      { currentPassword: '', newPassword },
      { jar, csrf: true },
    );
    expect(failed.status).toBe(401);
    expect(failed.body).toEqual({
      error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
    });
    // The failure is counted, and the session and the credential are untouched.
    const counted = await harness!.db.execute(
      sql`SELECT failed_sign_in_count::int AS n FROM users WHERE id = ${account.id}`,
    );
    expect((counted.rows[0] as { n: number }).n).toBe(1);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar })).status,
    ).toBe(200);
  });

  it('ends the session at thirty minutes of inactivity, and not one millisecond before', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    const token = bearer(jar)!;

    harness!.clock.advance(sessionInactivitySeconds * 1000 - 1);
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar })).status,
    ).toBe(200);

    harness!.clock.advance(1);
    const ended = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(ended.status).toBe(401);
    expect((ended.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');

    const rows = await harness!.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    expect(rows[0]?.revokedReason).toBe('inactivity');
  });

  it('ends the session at twelve hours absolute, however active it is', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    const token = bearer(jar)!;

    harness!.clock.advance(sessionAbsoluteSeconds * 1000 - 1);
    // Keep the inactivity clock fresh so only the absolute clock can decide.
    await harness!.db
      .update(sessions)
      .set({ lastActivityAt: harness!.clock.now() })
      .where(eq(sessions.token, token));
    expect(
      (await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar })).status,
    ).toBe(200);

    harness!.clock.advance(1);
    await harness!.db
      .update(sessions)
      .set({ lastActivityAt: harness!.clock.now() })
      .where(eq(sessions.token, token));
    const ended = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(ended.status).toBe(401);
    expect((ended.body as { error: { code: string } }).error.code).toBe('SESSION_ENDED');
  });

  it('adds a session per sign-in and never caps or replaces one', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const now = harness!.clock.now();
    const seededTokens = ['no-cap-seeded-1', 'no-cap-seeded-2', 'no-cap-seeded-3'].map(
      (token) => token.padEnd(40, 'k'),
    );
    await harness!.db.insert(sessions).values(
      seededTokens.map((token, index) => ({
        id: `no-cap-seeded-${String(index + 1)}`,
        userId: account.id,
        token,
        expiresAt: new Date(now.getTime() + sessionAbsoluteSeconds * 1000),
        lastActivityAt: now,
      })),
    );

    const liveUnrevoked = async (): Promise<number> => {
      const rows = await harness!.db.select().from(sessions);
      return rows.filter((row) => row.revokedAt === null).length;
    };
    expect(await harness!.db.select().from(sessions)).toHaveLength(3);

    // Each seeded token grants access, and so does a fresh sign-in.
    for (const token of seededTokens) {
      const read = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
        headers: { cookie: `wafar.session=${token}` },
      });
      expect(read.status).toBe(200);
      expect((read.body as { authenticated: boolean }).authenticated).toBe(true);
    }
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    expect(await liveUnrevoked()).toBe(4);

    // One ends by sign-out, one by a platform revocation, and only those end.
    const outJar: CookieJar = {};
    await bootstrap(harness!, outJar);
    outJar['wafar.session'] = seededTokens[0]!;
    const out = await call(harness!, 'POST', '/api/v1/auth/sign-out', undefined, {
      jar: outJar,
      csrf: true,
    });
    expect(out.status).toBe(204);
    const revocation = await harness!.auth.revoke(
      seededTokens[1]!,
      'platform_revocation',
      harness!.clock.now(),
    );
    expect(revocation).toBe(true);
    expect(await liveUnrevoked()).toBe(2);
    for (const token of [seededTokens[2]!, bearer(jar)!]) {
      const read = await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
        headers: { cookie: `wafar.session=${token}` },
      });
      expect(read.status).toBe(200);
    }

    // Two more sign-ins add two sessions and end none.
    const first: CookieJar = {};
    const second: CookieJar = {};
    expect(await signIn(first, '0912345678')).toBe(200);
    expect(await liveUnrevoked()).toBe(3);
    expect(await signIn(second, '0912345678')).toBe(200);
    expect(await liveUnrevoked()).toBe(4);

    // The mutation that revokes on sign-in would leave one session, and the
    // four-session assertion fails; the transaction rolls back so the state the
    // suite established survives.
    let mutationFailed = false;
    try {
      await harness!.db.transaction(async (tx) => {
        await tx
          .update(sessions)
          .set({
            revokedAt: harness!.clock.now(),
            revokedReason: 'password_change',
            updatedAt: harness!.clock.now(),
          })
          .where(eq(sessions.userId, account.id));
        const rows = await tx.select().from(sessions);
        const remaining = rows.filter((row) => row.revokedAt === null);
        expect(remaining).toHaveLength(4);
      });
    } catch {
      mutationFailed = true;
    }
    expect(mutationFailed).toBe(true);
    expect(await liveUnrevoked()).toBe(4);
  });

  it('resets the inactivity clock only on a merchant-initiated action', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    expect(await signIn(jar, '0912345678')).toBe(200);
    const token = bearer(jar)!;

    const twoMinutesAgo = new Date(harness!.clock.now().getTime() - 2 * 60 * 1000);
    await harness!.db
      .update(sessions)
      .set({ lastActivityAt: twoMinutesAgo })
      .where(eq(sessions.token, token));

    // A background request does not count as activity.
    await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    let rows = await harness!.db.select().from(sessions).where(eq(sessions.token, token));
    expect(rows[0]?.lastActivityAt.toISOString()).toBe(twoMinutesAgo.toISOString());

    // The header without the CSRF pair is ignored: a cross-site caller cannot
    // keep the session alive (contracts/auth-api.md §2.3).
    await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      jar,
      headers: { 'x-wafar-activity': '1' },
    });
    rows = await harness!.db.select().from(sessions).where(eq(sessions.token, token));
    expect(rows[0]?.lastActivityAt.toISOString()).toBe(twoMinutesAgo.toISOString());

    // A present but unlisted origin refuses the signal.
    await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      jar,
      csrf: true,
      origin: 'https://cross-site.example',
      headers: { 'x-wafar-activity': '1' },
    });
    rows = await harness!.db.select().from(sessions).where(eq(sessions.token, token));
    expect(rows[0]?.lastActivityAt.toISOString()).toBe(twoMinutesAgo.toISOString());

    // The frame's user-initiated marker, with the pair, does.
    await call(harness!, 'GET', '/api/v1/auth/session', undefined, {
      jar,
      csrf: true,
      headers: { 'x-wafar-activity': '1' },
    });
    rows = await harness!.db.select().from(sessions).where(eq(sessions.token, token));
    expect(rows[0]?.lastActivityAt.toISOString()).toBe(harness!.clock.now().toISOString());
  });
});

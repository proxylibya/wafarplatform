// The restart's invariance: a stopped and restarted process finds the session
// and both its clocks, the lock and its count, the pending request with its
// code and allowance, and the spent rate-limit window exactly as they were; a
// request in flight when the process stopped receives no answer, and its repeat
// reaches the repeated-request outcome with no second write
// (FR-054, FR-009, FR-032, FR-033, FR-034, FR-040, AC-059; T149).
import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { sessions, users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';

const password = 'correct horse battery staple';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

describe.skipIf(!hasDatabase)('the restart’s invariance', () => {
  it('keeps every row and every window across a stop and start', async () => {
    const first = createHarness();
    await first.reset();

    const account = await seedAccount(first, {
      phoneNumber: '+218912345678',
      password,
    });
    const sessionJar: CookieJar = {};
    await bootstrap(first, sessionJar);
    const signed = await call(
      first,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar: sessionJar, csrf: true },
    );
    expect(signed.status).toBe(200);
    const token = sessionJar['wafar.session']!;
    const sessionBefore = (
      await first.db.select().from(sessions).where(eq(sessions.token, token))
    )[0]!;

    // The lock and its count.
    await first.db.execute(
      sql`UPDATE users SET failed_sign_in_count = 4, locked_until = ${new Date(
        first.clock.now().getTime() + 15 * 60_000,
      ).toISOString()} WHERE id = ${account.id}`,
    );
    const lockedUntil = (
      await first.db.select().from(users).where(eq(users.id, account.id))
    )[0]!.lockedUntil!;

    // A live sign-up request with its code, and a verified recovery state with
    // its allowance.
    const pendingJar: CookieJar = {};
    const pair = await bootstrap(first, pendingJar);
    first.clock.advance(4000);
    const started = await call(
      first,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '0912345679',
        password,
        city: city(),
        website: '',
        formStamp: pair.formStamp,
      },
      { jar: pendingJar, csrf: true },
    );
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;
    const code = first.sms.lastCode() ?? '';
    const rowBefore = (
      await first.db.execute(
        sql`SELECT * FROM phone_verifications WHERE id = ${requestId}`,
      )
    ).rows[0] as Record<string, unknown>;

    // The spent window: one number's account-creation budget is exhausted.
    const windowStart = new Date(
      Math.floor(first.clock.now().getTime() / (15 * 60_000)) * 15 * 60_000,
    );
    await first.db.execute(sql`
      INSERT INTO rate_limit_counters (key, window_start, count, expires_at)
      VALUES ('account_creation:number:+218912345678', ${windowStart.toISOString()}, 3, ${new Date(
        windowStart.getTime() + 15 * 60_000,
      ).toISOString()})
    `);

    const instant = first.clock.now();

    // The process stops; a request in flight receives no answer.
    await first.close();
    let answered = true;
    try {
      const response = await call(first, 'GET', '/api/v1/auth/session', undefined, {
        jar: sessionJar,
      });
      answered = response.status < 500;
    } catch {
      answered = false;
    }
    expect(answered).toBe(false);

    // The process starts again against the same database.
    const second = createHarness();
    second.clock.set(instant);
    try {
      // The session still grants access, with both clocks as they were.
      const read = await call(second, 'GET', '/api/v1/auth/session', undefined, {
        headers: { cookie: `wafar.session=${token}` },
      });
      expect(read.status).toBe(200);
      const sessionAfter = (
        await second.db.select().from(sessions).where(eq(sessions.token, token))
      )[0]!;
      expect(sessionAfter.expiresAt.toISOString()).toBe(
        sessionBefore.expiresAt.toISOString(),
      );
      expect(sessionAfter.lastActivityAt.toISOString()).toBe(
        sessionBefore.lastActivityAt.toISOString(),
      );

      // The lock and its count are as they were, and the lock lifts only at its
      // own expiry.
      const lockedJar: CookieJar = {};
      await bootstrap(second, lockedJar);
      const locked = await call(
        second,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: '0912345678', password },
        { jar: lockedJar, csrf: true },
      );
      expect(locked.status).toBe(401);
      const lockRow = (
        await second.db.select().from(users).where(eq(users.id, account.id))
      )[0]!;
      expect(lockRow.failedSignInCount).toBe(4);
      expect(lockRow.lockedUntil?.toISOString()).toBe(lockedUntil.toISOString());

      // The pending request is as it was: same code hash, same allowance, and
      // the code it held verifies.
      const rowAfter = (
        await second.db.execute(
          sql`SELECT * FROM phone_verifications WHERE id = ${requestId}`,
        )
      ).rows[0] as Record<string, unknown>;
      expect(rowAfter['code_hash']).toBe(rowBefore['code_hash']);
      expect(rowAfter['re_requests']).toBe(rowBefore['re_requests']);
      expect(rowAfter['code_expires_at']).toEqual(rowBefore['code_expires_at']);

      const resume = await call(
        second,
        'GET',
        `/api/v1/auth/verifications/${requestId}`,
        undefined,
        { jar: pendingJar },
      );
      expect(resume.status).toBe(200);
      expect((resume.body as { remainingReRequests: number }).remainingReRequests).toBe(3);

      // The repeat of the request the process was serving re-renders its code
      // step and dispatches nothing.
      const repeatPair = await bootstrap(second, pendingJar);
      second.clock.advance(4000);
      const dispatches = second.sms.messages.length;
      const repeat = await call(
        second,
        'POST',
        '/api/v1/auth/sign-up',
        {
          fullName: 'محمد علي',
          phone: '0912345679',
          password,
          city: city(),
          website: '',
          formStamp: repeatPair.formStamp,
        },
        { jar: pendingJar, csrf: true, headers: { 'x-wafar-pending': requestId } },
      );
      expect(repeat.status).toBe(202);
      expect((repeat.body as { requestId: string }).requestId).toBe(requestId);
      expect(second.sms.messages.length).toBe(dispatches);

      const verified = await call(
        second,
        'POST',
        '/api/v1/auth/sign-up/verify',
        { requestId, code },
        { jar: pendingJar, csrf: true },
      );
      expect(verified.status).toBe(200);
      expect(verified.body).toEqual({ outcome: 'created' });

      // The spent number key still refuses on the budget it spent.
      const blockedJar: CookieJar = {};
      const blockedPair = await bootstrap(second, blockedJar);
      second.clock.advance(4000);
      const refused = await call(
        second,
        'POST',
        '/api/v1/auth/sign-up',
        {
          fullName: 'شخص آخر',
          phone: '0912345678',
          password,
          city: city(),
          website: '',
          formStamp: blockedPair.formStamp,
        },
        { jar: blockedJar, csrf: true },
      );
      expect(refused.status).toBe(429);
      expect((refused.body as { error: { code: string } }).error.code).toBe(
        'RATE_LIMITED',
      );

      // The lock lifts only at its own expiry.
      second.clock.set(new Date(lockedUntil.getTime() + 1));
      const unlockedJar: CookieJar = {};
      await bootstrap(second, unlockedJar);
      expect(
        (
          await call(
            second,
            'POST',
            '/api/v1/auth/sign-in',
            { phone: '0912345678', password },
            { jar: unlockedJar, csrf: true },
          )
        ).status,
      ).toBe(200);
    } finally {
      await second.close();
    }
  });
});

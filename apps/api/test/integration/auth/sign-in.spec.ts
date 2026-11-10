// Sign-in: the uniform transcript, the five-failure lock and its expiry, the
// count cleared on success, and the distinct format refusal
// (FR-007, FR-008, FR-009, FR-027, FR-042; T058, T061).
import { eq } from 'drizzle-orm';
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { sessions, users } from '@wafar/db';
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

async function signInResponse(
  jar: CookieJar,
  phone: string,
  value: string,
): Promise<{ status: number; body: unknown }> {
  await bootstrap(harness!, jar);
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-in',
    { phone, password: value },
    { jar, csrf: true },
  );
  return { status: response.status, body: response.body };
}

describe.skipIf(!hasDatabase)('sign-in', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('answers one uniform refusal for an unknown number, a wrong password, an administrator, and a blocked account', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
      role: 'administrator',
      mustChangePassword: true,
    });
    await seedAccount(harness!, {
      phoneNumber: '+218912345679',
      password,
      status: 'blocked',
    });
    const cases: [string, string][] = [
      ['0911111111', password],
      ['0912345678', 'wrong password value'],
      ['0912345678', password],
      ['0912345679', password],
    ];
    for (const [phone, value] of cases) {
      const response = await signInResponse({}, phone, value);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
      });
    }
  });

  it('locks after five consecutive failures and lifts at the fifteen-minute mark', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await signInResponse({}, '0912345678', 'wrong password value')).status).toBe(401);
    }
    const locked = await harness!.db.select().from(users).where(eq(users.id, account.id));
    expect(locked[0]?.failedSignInCount).toBe(5);
    expect(locked[0]?.lockedUntil).not.toBeNull();

    // The correct password is refused while the lock holds, without extending it.
    expect((await signInResponse({}, '0912345678', password)).status).toBe(401);

    harness!.clock.advance(15 * 60 * 1000 + 1);
    const lifted = await signInResponse({}, '0912345678', password);
    expect(lifted.status).toBe(200);
    const cleared = await harness!.db.select().from(users).where(eq(users.id, account.id));
    expect(cleared[0]?.failedSignInCount).toBe(0);
  });

  it('clears the count on a successful sign-in', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    expect((await signInResponse({}, '0912345678', 'wrong password value')).status).toBe(401);
    expect((await signInResponse({}, '0912345678', password)).status).toBe(200);
    const row = await harness!.db.select().from(users).where(eq(users.id, account.id));
    expect(row[0]?.failedSignInCount).toBe(0);
    expect(row[0]?.lockedUntil).toBeNull();
  });

  it('refuses a malformed number with the distinct format code, not the uniform transcript', async () => {
    const response = await signInResponse({}, '0212345678', password);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: 'INVALID_PHONE', field: 'phone', retryable: false },
    });
  });

  it('treats an email-shaped identifier as a format refusal and never as an address', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const response = await signInResponse({}, 'person@example.com', password);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: 'INVALID_PHONE', field: 'phone', retryable: false },
    });
    expect(JSON.stringify(response.body)).not.toContain('example.com');
    expect(JSON.stringify(response.body)).not.toContain('person@');
  });

  it('issues the sign-in session as the library’s own row', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const jar: CookieJar = {};
    expect((await signInResponse(jar, '0912345678', password)).status).toBe(200);
    const token = jar['wafar.session'];
    expect(token).toBeDefined();

    // The rows the R1 policy reads are the ones the library's adapter wrote, and
    // the library's own session lookup resolves the token R1 set in the cookie.
    const rows = await harness!.db.select().from(sessions);
    expect(rows).toHaveLength(1);
    const context = await harness!.auth.raw.$context;
    const found = await context.internalAdapter.findSession(token!);
    expect(found?.session.id).toBe(rows[0]?.id);
    expect(found?.session.token).toBe(rows[0]?.token);
    expect(found?.user['phoneNumber']).toBe('+218912345678');

    // The engine's port reads the same row, so the policy and the library agree.
    const resolved = await harness!.auth.resolve(token!, harness!.clock.now());
    expect(resolved?.sessionId).toBe(rows[0]?.id);
    expect(resolved?.revokedAt).toBeNull();
  });
});

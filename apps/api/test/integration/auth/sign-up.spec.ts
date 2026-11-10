// Sign-up and verification against the composed API and a real database: no
// account before the code, one account and one session at verification, the
// four outcomes, the emoji refusal before any account comparison, and the
// library's placeholder empty at every point the flow passes
// (FR-001, FR-004, FR-006, FR-026, FR-034; T037).
import { sql } from 'drizzle-orm';
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { accounts, users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  createHarness,
  bootstrap,
  call,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

const password = 'correct horse battery staple';

async function startSignUp(
  jar: CookieJar,
  overrides: Record<string, unknown> = {},
): Promise<{ requestId: string; code: string }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  const response = await call(
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
      ...overrides,
    },
    { jar, csrf: true },
  );
  expect(response.status).toBe(202);
  const body = response.body as { requestId: string };
  return { requestId: body.requestId, code: harness!.sms.lastCode() ?? '' };
}

describe.skipIf(!hasDatabase)('sign-up and verification', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('creates nothing before the code and one account with one session after it', async () => {
    const jar: CookieJar = {};
    const started = await startSignUp(jar);

    const count = async (table: 'users' | 'sessions' | 'accounts' | 'verifications') => {
      const result = await harness!.db.execute(
        sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
      );
      return (result.rows[0] as { n: number }).n;
    };
    expect(await count('users')).toBe(0);
    expect(await count('sessions')).toBe(0);
    expect(await count('verifications')).toBe(0);

    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: '000000' },
      { jar, csrf: true },
    );
    expect(refused.status).toBe(400);
    expect(await count('users')).toBe(0);
    expect(await count('verifications')).toBe(0);

    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: started.code },
      { jar, csrf: true },
    );
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ outcome: 'created' });
    expect(await count('users')).toBe(1);
    expect(await count('sessions')).toBe(1);
    expect(await count('accounts')).toBe(1);
    expect(await count('verifications')).toBe(0);

    const rows = await harness!.db.select().from(users);
    expect(rows[0]?.email).toBe('218912345678@phone.invalid');
    expect(rows[0]?.phoneNumber).toBe('+218912345678');
    expect(harness!.events.filter((event) => event.event === 'auth.sign_up.verified')).toHaveLength(1);
  });

  it('refuses a superseded code as expired without spending an entry', async () => {
    const jar: CookieJar = {};
    const started = await startSignUp(jar);

    // An accepted resend replaces the code and keeps the old one as superseded.
    harness!.clock.advance(1000);
    const resent = await call(
      harness!,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId: started.requestId },
      { jar, csrf: true },
    );
    expect(resent.status).toBe(202);
    const superseded = started.code;
    const live = harness!.sms.lastCode() ?? '';
    expect(live).not.toBe(superseded);

    const entries = async (): Promise<number> => {
      const result = await harness!.db.execute(
        sql.raw('SELECT incorrect_entries FROM phone_verifications'),
      );
      return (result.rows[0] as { incorrect_entries: number }).incorrect_entries;
    };
    expect(await entries()).toBe(0);

    // The replaced code is expired, not wrong: it spends none of the five.
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: superseded },
      { jar, csrf: true },
    );
    expect(refused.status).toBe(400);
    expect((refused.body as { error: { code: string } }).error.code).toBe('OTP_EXPIRED');
    expect(await entries()).toBe(0);

    // The live code still creates the account.
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: started.requestId, code: live },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'created' });
  });

  it('states the existing-account outcome for an alternate spelling and writes no second account', async () => {
    const jar: CookieJar = {};

    // Create the account the first submission would create, then submit again in
    // another spelling of the same number.
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const started = await call(
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
      { jar, csrf: true },
    );
    const requestId = (started.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';
    const created = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code },
      { jar, csrf: true },
    );
    expect(created.body).toEqual({ outcome: 'created' });

    const secondPair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const second = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '00218 91 234 5678',
        password,
        city: city(),
        website: '',
        formStamp: secondPair.formStamp,
      },
      { jar, csrf: true },
    );
    const secondId = (second.body as { requestId: string }).requestId;
    const outcome = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: secondId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(outcome.body).toEqual({ outcome: 'existing_account' });
    const rows = await harness!.db.select().from(users);
    expect(rows).toHaveLength(1);
    const accountRows = await harness!.db.select().from(accounts);
    expect(accountRows).toHaveLength(1);
  });

  it('refuses an emoji in the full name with its own reason before any account comparison', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const response = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد 😀',
        phone: '0912345678',
        password,
        city: city(),
        website: '',
        formStamp: pair.formStamp,
      },
      { jar, csrf: true },
    );
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'INVALID_FULL_NAME', reason: 'emoji', retryable: false },
    });
    const rows = await harness!.db.select().from(users);
    expect(rows).toHaveLength(0);
    const pending = await harness!.db.execute(sql.raw('SELECT count(*)::int AS n FROM phone_verifications'));
    expect((pending.rows[0] as { n: number }).n).toBe(0);
  });

  it('refuses a common or breached password before any account comparison', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const submission = {
      fullName: 'محمد علي',
      phone: '0912345678',
      password: 'password1234',
      city: city(),
      website: '',
      formStamp: pair.formStamp,
    };
    const refused = await call(harness!, 'POST', '/api/v1/auth/sign-up', submission, {
      jar,
      csrf: true,
    });
    expect(refused.status).toBe(400);
    expect(refused.body).toEqual({
      error: {
        code: 'PASSWORD_TOO_COMMON',
        retryable: false,
        field: 'password',
      },
    });

    // No pending row, no code dispatched, and no record.
    const pending = await harness!.db.execute(
      sql.raw('SELECT count(*)::int AS n FROM phone_verifications'),
    );
    expect((pending.rows[0] as { n: number }).n).toBe(0);
    expect(harness!.sms.messages).toHaveLength(0);
    expect(harness!.events).toHaveLength(0);

    // The same refusal whether or not the number has an account.
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const secondJar: CookieJar = {};
    const secondPair = await bootstrap(harness!, secondJar);
    harness!.clock.advance(4000);
    const withAccount = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      { ...submission, formStamp: secondPair.formStamp },
      { jar: secondJar, csrf: true },
    );
    expect(withAccount.status).toBe(400);
    expect(withAccount.body).toEqual(refused.body);
  });

  it('keeps the hidden field’s silent success even for a common password', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const silent = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '0912345678',
        password: 'password1234',
        city: city(),
        website: 'https://spam.example',
        formStamp: pair.formStamp,
      },
      { jar, csrf: true },
    );
    expect(silent.status).toBe(202);
    expect(Object.keys(silent.body as object).sort()).toEqual(
      ['codeExpiresAt', 'expiresAt', 'phone', 'requestId'].sort(),
    );

    // Nothing was stored and no code was dispatched.
    const pending = await harness!.db.execute(
      sql.raw('SELECT count(*)::int AS n FROM phone_verifications'),
    );
    expect((pending.rows[0] as { n: number }).n).toBe(0);
    expect(harness!.sms.messages).toHaveLength(0);
    expect(harness!.events).toHaveLength(0);
  });

  it('stores only the reserved placeholder and ignores a supplied address', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const started = await call(
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
        email: 'person@example.com',
      },
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    expect(JSON.stringify(started.body)).not.toContain('person@example.com');
    const requestId = (started.body as { requestId: string }).requestId;
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'created' });

    // The stored address is the placeholder derived from the normalized number,
    // and the supplied address appears nowhere.
    const rows = await harness!.db.select().from(users);
    expect(rows[0]?.email).toBe('218912345678@phone.invalid');
    expect(JSON.stringify(rows)).not.toContain('person@example.com');

    // A real address fails the schema's own scan.
    let refused: unknown;
    try {
      await harness!.db.insert(users).values({
        id: 'seeded-real-address',
        fullName: 'شخص آخر',
        email: 'person@example.com',
        phoneNumber: '+218912345679',
        city: city(),
        shopName: null,
      });
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeDefined();
    expect((refused as { cause?: { code?: string } }).cause?.code).toBe('23514');
  });

  it('deletes the pending row once the administrator outcome is stated', async () => {
    const { createUsersRepository } = await import(
      '../../../src/modules/users/repository/users.ts'
    );
    const repository = createUsersRepository(harness!.db);
    const admin = await repository.create({
      fullName: 'مسؤول النظام',
      phoneNumber: '+218912345678',
      city: city(),
      shopName: null,
      role: 'administrator',
      mustChangePassword: true,
    });
    await harness!.auth.createCredential({
      userId: admin.id,
      passwordHash: await harness!.auth.hashPassword(password),
    });

    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const started = await call(
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
      { jar, csrf: true },
    );
    const requestId = (started.body as { requestId: string }).requestId;
    const response = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(response.body).toEqual({ outcome: 'administrator_account' });
    const pending = await harness!.db.execute(sql.raw('SELECT count(*)::int AS n FROM phone_verifications'));
    expect((pending.rows[0] as { n: number }).n).toBe(0);
  });
});

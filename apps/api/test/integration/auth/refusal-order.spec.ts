// The fixed refusal order of FR-051, stacked two at a time so the earlier step
// is the one that answers: the operation limit over the hidden field, the hidden
// field over the minimum time, the minimum time over the value rules, and the
// value rules over any account-existence comparison; plus the transport's own
// answer standing over the budget (FR-051, FR-044, AC-055, AC-048; T075, T169).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { maxBodyBytes } from '@wafar/shared';
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

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

function form(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: 'محمد علي',
    phone: '0912345678',
    password,
    city: city(),
    website: '',
    ...overrides,
  };
}

async function submit(
  jar: CookieJar,
  values: Record<string, unknown>,
  options: { young?: boolean; csrf?: boolean } = {},
): Promise<{ status: number; body: unknown }> {
  const pair = await bootstrap(harness!, jar);
  if (options.young !== true) harness!.clock.advance(4000);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    { ...values, formStamp: pair.formStamp },
    { jar, csrf: options.csrf ?? true },
  );
}

describe.skipIf(!hasDatabase)('the refusal order', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('answers the operation limit before the hidden field', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await submit(jar, form())).status).toBe(202);
    }
    const refused = await submit(jar, form({ website: 'bot.example' }));
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('answers the hidden field before the minimum time, silently', async () => {
    const jar: CookieJar = {};
    const response = await submit(jar, form({ website: 'bot.example' }), { young: true });
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ requestId: expect.any(String) });
    // The unstored request has no next step.
    const body = response.body as { requestId: string };
    const resume = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${body.requestId}`,
      undefined,
      { jar },
    );
    expect(resume.body).toMatchObject({ error: { code: 'OTP_EXPIRED' } });
  });

  it('answers the minimum time before the value rules', async () => {
    const jar: CookieJar = {};
    const response = await submit(jar, form({ fullName: '' }), { young: true });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'FORM_TOO_FAST', field: 'formStamp', retryable: true },
    });
  });

  it('answers the value rules before any account comparison', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    const response = await submit(jar, form({ fullName: 'محمد 😀' }));
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'INVALID_FULL_NAME', reason: 'emoji' },
    });
  });

  it('reports every value failure at the same step, each with its own code and reason', async () => {
    const jar: CookieJar = {};
    const response = await submit(
      jar,
      form({
        fullName: '',
        shopName: 'متجر 😀',
        city: 'مدينة ليست في القائمة',
        password: 'short',
      }),
    );
    expect(response.status).toBe(400);
    const body = response.body as {
      error: { code: string; details: { code: string; reason?: string }[] };
    };
    expect(body.error.code).toBe('INVALID_FULL_NAME');
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_FULL_NAME', reason: 'empty' }),
        expect.objectContaining({ code: 'INVALID_SHOP_NAME', reason: 'emoji' }),
        expect.objectContaining({ code: 'CITY_NOT_IN_LIST' }),
        expect.objectContaining({ code: 'PASSWORD_TOO_SHORT' }),
      ]),
    );
  });

  it('answers a transport refusal before the operation limit', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await submit(jar, form())).status).toBe(202);
    }
    const refused = await submit(jar, form(), { csrf: false });
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ error: { code: 'CSRF_FAILED' } });
  });

  it('answers an unlisted origin before the operation limit', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      { ...form(), formStamp: pair.formStamp },
      { jar, csrf: true, origin: 'https://attacker.example' },
    );
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ error: { code: 'CSRF_FAILED' } });
  });

  it('decides every transport failure before the operation’s spent budget', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const values = { ...form(), formStamp: pair.formStamp };

    // Spend the account-creation budget on this origin.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const accepted = await call(harness!, 'POST', '/api/v1/auth/sign-up', values, {
        jar,
        csrf: true,
      });
      expect(accepted.status).toBe(202);
    }
    const spent = await call(harness!, 'POST', '/api/v1/auth/sign-up', values, {
      jar,
      csrf: true,
    });
    expect(spent.status).toBe(429);

    const oversized = { junk: 'x'.repeat(maxBodyBytes) };
    const cases = [
      {
        name: 'no token',
        run: () =>
          call(harness!, 'POST', '/api/v1/auth/sign-up', values, { jar, csrf: false }),
        code: 'CSRF_FAILED',
      },
      {
        name: 'wrong token',
        run: () =>
          call(harness!, 'POST', '/api/v1/auth/sign-up', values, {
            jar,
            csrf: true,
            headers: { 'x-wafar-csrf': 'not-the-cookie-value' },
          }),
        code: 'CSRF_FAILED',
      },
      {
        name: 'unlisted origin',
        run: () =>
          call(harness!, 'POST', '/api/v1/auth/sign-up', values, {
            jar,
            csrf: true,
            origin: 'https://attacker.example',
          }),
        code: 'CSRF_FAILED',
      },
      {
        name: 'body past the 16 KB bound',
        run: () =>
          call(harness!, 'POST', '/api/v1/auth/sign-up', oversized, {
            jar,
            csrf: true,
          }),
        code: 'PAYLOAD_TOO_LARGE',
      },
      {
        name: 'a method a registered route does not serve',
        run: () => call(harness!, 'DELETE', '/api/v1/auth/sign-up', {}, { jar, csrf: true }),
        code: 'METHOD_NOT_ALLOWED',
      },
    ] as const;

    for (const testCase of cases) {
      const response = await testCase.run();
      expect(response.body, testCase.name).toMatchObject({
        error: { code: testCase.code },
      });
      // The spent budget never replaces the transport's own answer.
      expect(response.body, testCase.name).not.toMatchObject({
        error: { code: 'RATE_LIMITED' },
      });
    }
  });

  it('never replaces a refusal with a later step’s refusal', async () => {
    // The number has an account, so the account-existence comparison would
    // answer; the value rules refuse first, on every repetition, with the same
    // code and reason.
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await submit(
        jar,
        form({ fullName: '', city: 'مدينة ليست في القائمة' }),
      );
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { code: 'INVALID_FULL_NAME', reason: 'empty' },
      });
      expect(response.body).not.toMatchObject({
        error: { code: 'AUTH_INVALID_CREDENTIALS' },
      });
    }
  });

  it('runs the transport-over-budget ordering inside the registered exception EX-011', () => {
    const plan = readFileSync(
      join('specs', '001-identity-foundation', 'plan.md'),
      'utf8',
    );
    expect(plan).toContain('`EX-011`');
    expect(plan).toContain('apps/api/src/http/**');
  });
});

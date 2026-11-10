// The two-key fixed windows: each P1 operation its own budget, the origin key
// isolated, the number key global, a malformed value carrying only the origin
// key, an untrusted peer's `X-Real-IP` ignored, and the resend bounded by the
// re-request limit alone (FR-029, FR-033, FR-034, AC-033, AC-035, AC-036; T074).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  accountCreationPerOrigin,
  otpMaxReRequests,
  rateLimitWindowSeconds,
} from '@wafar/shared';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
  type Harness,
} from '../../support/harness.ts';

const trusted = hasDatabase ? createHarness({ trustedProxies: ['127.0.0.1'] }) : null;
const untrusted = hasDatabase ? createHarness({ trustedProxies: [] }) : null;
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
  harness: Harness,
  jar: CookieJar,
  origin: string,
  values: Record<string, unknown>,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const pair = await bootstrap(harness, jar);
  harness.clock.advance(4000);
  const response = await call(
    harness,
    'POST',
    '/api/v1/auth/sign-up',
    { ...values, formStamp: pair.formStamp },
    { jar, csrf: true, headers: { 'x-real-ip': origin } },
  );
  return response;
}

async function reset(): Promise<void> {
  await trusted!.reset();
}

describe.skipIf(!hasDatabase)('the two-key rate limits', () => {
  beforeAll(async () => {
    await reset();
  });

  beforeEach(async () => {
    await reset();
    await untrusted!.reset();
  });

  afterAll(async () => {
    await trusted!.close();
    await untrusted!.close();
  });

  it('isolates the origin key', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < accountCreationPerOrigin; attempt += 1) {
      const response = await submit(trusted!, jar, '127.0.0.2', form({ phone: '0212345678' }));
      expect(response.status).toBe(400);
    }
    const refused = await submit(trusted!, jar, '127.0.0.2', form({ phone: '0212345678' }));
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ error: { code: 'RATE_LIMITED', retryable: true } });
    const retryAfter = Number(refused.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(rateLimitWindowSeconds);

    // Another origin holds its own budget.
    const other = await submit(trusted!, jar, '127.0.0.3', form({ phone: '0212345678' }));
    expect(other.status).toBe(400);
  });

  it('shares the number key across origins', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await submit(trusted!, jar, '127.0.0.2', form());
      expect(response.status).toBe(202);
    }
    const refused = await submit(trusted!, jar, '127.0.0.9', form());
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('carries only the origin key for a malformed value', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < accountCreationPerOrigin; attempt += 1) {
      const response = await submit(trusted!, jar, '127.0.0.4', form({ phone: '0212345678' }));
      expect(response.status).toBe(400);
    }
    const refused = await submit(trusted!, jar, '127.0.0.4', form({ phone: '0212345678' }));
    expect(refused.status).toBe(429);

    const spent = await trusted!.db.execute(
      sql.raw(
        "SELECT key FROM rate_limit_counters WHERE key LIKE 'account_creation:number:%'",
      ),
    );
    expect(spent.rows).toHaveLength(0);
  });

  it('ignores X-Real-IP from an untrusted peer', async () => {
    const jar: CookieJar = {};
    for (let attempt = 0; attempt < accountCreationPerOrigin; attempt += 1) {
      // A different claimed address on every request; the socket is the origin.
      const response = await submit(
        untrusted!,
        jar,
        `198.51.100.${attempt + 1}`,
        form({ phone: '0212345678' }),
      );
      expect(response.status).toBe(400);
    }
    const refused = await submit(
      untrusted!,
      jar,
      '198.51.100.200',
      form({ phone: '0212345678' }),
    );
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('trusts X-Real-IP only from a listed peer', async () => {
    const listed = await submit(trusted!, {}, '203.0.113.9', form());
    expect(listed.status).toBe(202);
    const trustedKeys = await trusted!.db.execute(
      sql.raw("SELECT key FROM rate_limit_counters WHERE key LIKE 'account_creation:origin:%'"),
    );
    const trustedOrigins = trustedKeys.rows.map((row) => String(row['key']));
    expect(trustedOrigins).toContain('account_creation:origin:203.0.113.9');

    await untrusted!.reset();
    const ignored = await submit(untrusted!, {}, '203.0.113.10', form({ phone: '0912345679' }));
    expect(ignored.status).toBe(202);
    const untrustedKeys = await untrusted!.db.execute(
      sql.raw("SELECT key FROM rate_limit_counters WHERE key LIKE 'account_creation:origin:%'"),
    );
    const untrustedOrigins = untrustedKeys.rows.map((row) => String(row['key']));
    expect(untrustedOrigins).toContain('account_creation:origin:127.0.0.1');
    expect(untrustedOrigins).not.toContain('account_creation:origin:203.0.113.10');
  });

  it('bounds the resend by the re-request limit alone, without spending the operation budget', async () => {
    const jar: CookieJar = {};
    const started = await submit(trusted!, jar, '127.0.0.5', form());
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;

    const before = await trusted!.db.execute(
      sql.raw(
        "SELECT count FROM rate_limit_counters WHERE key = 'account_creation:origin:127.0.0.5'",
      ),
    );
    const spentBefore = (before.rows[0] as { count?: number } | undefined)?.count ?? 0;

    for (let attempt = 0; attempt < otpMaxReRequests; attempt += 1) {
      const resent = await call(
        trusted!,
        'POST',
        '/api/v1/auth/verifications/resend',
        { requestId },
        { jar, csrf: true, headers: { 'x-real-ip': '127.0.0.5' } },
      );
      expect(resent.status).toBe(202);
      expect(resent.body).toMatchObject({
        remainingReRequests: otpMaxReRequests - attempt - 1,
      });
    }
    const limited = await call(
      trusted!,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId },
      { jar, csrf: true, headers: { 'x-real-ip': '127.0.0.5' } },
    );
    expect(limited.status).toBe(400);
    expect(limited.body).toMatchObject({ error: { code: 'OTP_RESEND_LIMIT' } });

    const after = await trusted!.db.execute(
      sql.raw(
        "SELECT count FROM rate_limit_counters WHERE key = 'account_creation:origin:127.0.0.5'",
      ),
    );
    expect((after.rows[0] as { count?: number } | undefined)?.count ?? 0).toBe(spentBefore);
  });
});

// The transport guards: the CSRF pair and origin allowlist, the security
// headers, the 16 KB body bound, the 405 answer, and the 404 answer
// (FR-044, FR-046, FR-029; T076, T167).
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import { securityHeaders } from '../../../src/http/security.ts';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;

describe.skipIf(!hasDatabase)('the transport guards', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('issues the CSRF cookie and the signed form stamp', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    expect(pair.csrfToken.length).toBeGreaterThanOrEqual(32);
    expect(pair.formStamp).toContain('.');
    expect(jar['wafar.csrf']).toBe(pair.csrfToken);
  });

  it('refuses a mutation with no token, a wrong token, an unlisted origin, or no origin', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const body = { phone: '0912345678', password: 'whatever long value' };

    const missing = await call(harness!, 'POST', '/api/v1/auth/sign-in', body, {
      jar,
      csrf: false,
    });
    expect(missing.status).toBe(403);
    expect(missing.body).toEqual({
      error: { code: 'CSRF_FAILED', retryable: false },
    });

    const wrong = await call(harness!, 'POST', '/api/v1/auth/sign-in', body, {
      jar,
      csrf: true,
      headers: { 'x-wafar-csrf': 'not-the-cookie-value' },
    });
    expect(wrong.status).toBe(403);

    // A token of the same decoded length but one different byte is refused by
    // the constant-time comparison rather than by a length check (FR-044). The
    // byte is flipped in the decoded value, never in the base64url padding bits
    // that carry no value, and the case runs over fresh tokens so no token's
    // last character decides the result (T250).
    for (const offset of [0, 9, 18, 27]) {
      const loopJar: CookieJar = {};
      await bootstrap(harness!, loopJar);
      const token = loopJar['wafar.csrf'] ?? '';
      const decoded = Buffer.from(token, 'base64url');
      const mutated = Buffer.from(decoded);
      mutated[offset] = (mutated[offset] ?? 0) ^ 0xff;
      const differentToken = mutated.toString('base64url');
      expect(Buffer.from(differentToken, 'base64url')).toHaveLength(decoded.length);
      expect(Buffer.from(differentToken, 'base64url').equals(decoded)).toBe(false);
      const different = await call(harness!, 'POST', '/api/v1/auth/sign-in', body, {
        jar: loopJar,
        csrf: true,
        headers: { 'x-wafar-csrf': differentToken },
      });
      expect(different.status).toBe(403);
    }

    const unlisted = await call(harness!, 'POST', '/api/v1/auth/sign-in', body, {
      jar,
      csrf: true,
      origin: 'http://evil.example',
    });
    expect(unlisted.status).toBe(403);

    // An absent origin is refused exactly as an unlisted one is (FR-044).
    const absent = await call(harness!, 'POST', '/api/v1/auth/sign-in', body, {
      jar,
      csrf: true,
      origin: null,
    });
    expect(absent.status).toBe(403);
    expect(absent.body).toEqual({
      error: { code: 'CSRF_FAILED', retryable: false },
    });
  });

  it('carries the six security headers on an API response', async () => {
    const response = await call(harness!, 'GET', '/health');
    const policy = response.headers.get('content-security-policy') ?? '';
    expect(policy).toContain("default-src 'self'");
    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+'/);
    const scriptSource = policy
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('script-src'));
    expect(scriptSource).not.toContain('*');
    expect(scriptSource).not.toContain("'unsafe-inline'");
    expect(scriptSource).not.toContain("'unsafe-eval'");
    expect(scriptSource).not.toContain("'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers.get('permissions-policy')).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toBeTruthy();
    // The transport declaration appears in production only.
    expect(response.headers.get('strict-transport-security')).toBeNull();
  });

  it('refuses a body above 16 KB and accepts one at the bound', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    const base = {
      fullName: 'محمد علي',
      phone: '0912345678',
      password: 'correct horse battery staple',
      city: 'طرابلس',
      website: '',
      formStamp: pair.formStamp,
    };
    const exact = JSON.stringify({ ...base, shopName: 'x'.repeat(15_000) });
    const over = JSON.stringify({ ...base, shopName: 'x'.repeat(16 * 1024) });
    const refused = await call(harness!, 'POST', '/api/v1/auth/sign-up', over, {
      jar,
      csrf: true,
    });
    expect(refused.status).toBe(413);
    expect((refused.body as { error: { code: string } }).error.code).toBe(
      'PAYLOAD_TOO_LARGE',
    );

    const accepted = await call(harness!, 'POST', '/api/v1/auth/sign-up', exact, {
      jar,
      csrf: true,
    });
    expect(accepted.status).not.toBe(413);
  });

  it('answers 405 for a method a registered route does not serve and 404 for an unknown route', async () => {
    const method = await call(harness!, 'GET', '/api/v1/auth/sign-in');
    expect(method.status).toBe(405);
    expect((method.body as { error: { code: string } }).error.code).toBe('METHOD_NOT_ALLOWED');
    expect(method.headers.get('allow')).toContain('POST');

    const missing = await call(harness!, 'GET', '/api/v1/auth/nothing-here');
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });
});

describe('the transport declaration', () => {
  function app(production: boolean): Hono {
    const application = new Hono();
    application.use(
      '*',
      securityHeaders({
        secret: 'test-secret-value-000000',
        webOrigin: 'http://localhost:3000',
        production,
      }),
    );
    application.get('/x', (c) => c.text('ok'));
    return application;
  }

  it('is sent in production and withheld elsewhere', async () => {
    const production = await app(true).request('/x');
    expect(production.headers.get('strict-transport-security')).toBe(
      'max-age=31536000; includeSubDomains',
    );

    const development = await app(false).request('/x');
    expect(development.headers.get('strict-transport-security')).toBeNull();
  });
});

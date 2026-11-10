// The transport's own answers over every state-changing route: the CSRF pair
// and the origin allowlist, the 16 KB bound's two sides, the 405 answer, and the
// 404 answer, each decided before any service code runs
// (FR-044, FR-053, AC-048, AC-056; T167).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { maxBodyBytes } from '@wafar/shared';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;

/** Every POST route the contract registers in §5.2–§5.11. */
const mutations = [
  '/api/v1/auth/sign-up',
  '/api/v1/auth/sign-up/verify',
  '/api/v1/auth/verifications/resend',
  '/api/v1/auth/sign-in',
  '/api/v1/auth/sign-out',
  '/api/v1/auth/sign-out-all',
  '/api/v1/auth/password/change',
  '/api/v1/auth/password/forgot',
  '/api/v1/auth/password/forgot/verify',
  '/api/v1/auth/password/reset',
] as const;

describe.skipIf(!hasDatabase)('the transport refusals', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('refuses every state-changing route with no token', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    for (const path of mutations) {
      const response = await call(harness!, 'POST', path, {}, { jar, csrf: false });
      expect(response.status, path).toBe(403);
      expect(response.body, path).toEqual({
        error: { code: 'CSRF_FAILED', retryable: false },
      });
    }
  });

  it('refuses every state-changing route with a wrong token', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    for (const path of mutations) {
      const response = await call(harness!, 'POST', path, {}, {
        jar,
        csrf: true,
        headers: { 'x-wafar-csrf': 'not-the-cookie-value' },
      });
      expect(response.status, path).toBe(403);
      expect(response.body, path).toMatchObject({ error: { code: 'CSRF_FAILED' } });
    }
  });

  it('refuses every state-changing route from an unlisted origin', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    for (const path of mutations) {
      const response = await call(harness!, 'POST', path, {}, {
        jar,
        csrf: true,
        origin: 'https://attacker.example',
      });
      expect(response.status, path).toBe(403);
      expect(response.body, path).toMatchObject({ error: { code: 'CSRF_FAILED' } });
    }
  });

  it('accepts exactly sixteen kilobytes and refuses one byte more', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    // `{"junk":"` is nine characters and `"}` closes it: eleven bytes of frame.
    const frame = JSON.stringify({ junk: '' }).length;
    const atBound = { junk: 'x'.repeat(maxBodyBytes - frame) };
    const overBound = { junk: 'x'.repeat(maxBodyBytes - frame + 1) };
    expect(Buffer.byteLength(JSON.stringify(atBound), 'utf8')).toBe(maxBodyBytes);

    const refused = await call(harness!, 'POST', '/api/v1/auth/sign-in', overBound, {
      jar,
      csrf: true,
    });
    expect(refused.status).toBe(413);
    expect(refused.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });

    const accepted = await call(harness!, 'POST', '/api/v1/auth/sign-in', atBound, {
      jar,
      csrf: true,
    });
    expect(accepted.status).not.toBe(413);
  });

  it('answers 405 with Allow for a method a route does not serve, and 404 for an unknown route', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const method = await call(harness!, 'DELETE', '/api/v1/auth/sign-in', {}, { jar, csrf: true });
    expect(method.status).toBe(405);
    expect(method.body).toMatchObject({ error: { code: 'METHOD_NOT_ALLOWED' } });
    expect(method.headers.get('allow')).toBe('POST');

    const missing = await call(harness!, 'POST', '/api/v1/auth/nothing-here', {}, { jar, csrf: true });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});

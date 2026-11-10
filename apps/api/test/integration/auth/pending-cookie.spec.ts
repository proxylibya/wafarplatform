// The pending cookie's contract attributes on every dispatch: `Path=/api/v1/auth`
// so it never travels to a page route, `Max-Age=300` refreshed by each accepted
// dispatch, `HttpOnly; SameSite=Lax`, and `Secure` only in production
// (FR-038, AC-041; contracts/auth-api.md §2.2; T214).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
  type ResponseRecord,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';
const city = cities.entries[0] ?? 'طرابلس';

function pendingHeader(response: ResponseRecord): string {
  return (
    response.cookies.find((cookie) => cookie.startsWith('wafar.pending=')) ?? ''
  );
}

function expectContractAttributes(response: ResponseRecord): void {
  const cookie = pendingHeader(response);
  expect(cookie).not.toBe('');
  expect(cookie).toContain('Path=/api/v1/auth');
  expect(cookie).toContain('Max-Age=300');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  // The harness runs in the test environment, so the production-only attribute
  // is absent here and the header carries no second path.
  expect(cookie).not.toContain('Secure');
  expect(cookie).not.toContain('Path=/;');
}

describe.skipIf(!hasDatabase)('the pending cookie', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('carries the contract attributes on the sign-up, resend, and recovery dispatches', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const signUp = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '0912345678',
        password,
        city,
        website: '',
        formStamp: pair.formStamp,
      },
      { jar, csrf: true },
    );
    expect(signUp.status).toBe(202);
    expectContractAttributes(signUp);

    const requestId = (signUp.body as { requestId: string }).requestId;
    const resend = await call(
      harness!,
      'POST',
      '/api/v1/auth/verifications/resend',
      { requestId },
      { jar, csrf: true },
    );
    expect(resend.status).toBe(202);
    expectContractAttributes(resend);

    const recovery: CookieJar = {};
    await bootstrap(harness!, recovery);
    const requested = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '0923456789' },
      { jar: recovery, csrf: true },
    );
    expect(requested.status).toBe(202);
    expectContractAttributes(requested);
  });
});

// The distinct, explicit format refusal of FR-042 on the two pages that carry
// it: a value that is not a valid Libyan mobile number receives its own code,
// its own status, and its own response path, not the uniform transcript, and it
// sits outside SC-004's enumeration comparison (FR-042, AC-045; T184).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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

/** Values that are not a listed Libyan mobile number on +218. */
const malformed = ['12345', '0212345678', '0912345', '+218 12 345 6789', 'abc'];

describe.skipIf(!hasDatabase)('the format refusal', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('refuses a malformed value on sign-in with its own code and status', async () => {
    await seedAccount(harness!, { phoneNumber: '+218912345678', password });

    for (const value of malformed) {
      const jar: CookieJar = {};
      await bootstrap(harness!, jar);
      const refused = await call(
        harness!,
        'POST',
        '/api/v1/auth/sign-in',
        { phone: value, password },
        { jar, csrf: true },
      );
      expect(refused.status, `${value} is refused`).toBe(400);
      expect(refused.body, `${value} names its field`).toEqual({
        error: { code: 'INVALID_PHONE', retryable: false, field: 'phone' },
      });
    }

    // A valid number with a wrong password takes the uniform transcript: a
    // different code, a different status, and no field.
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const uniform = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password: 'a wrong but long password' },
      { jar, csrf: true },
    );
    expect(uniform.status).toBe(401);
    expect(uniform.body).toEqual({
      error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
    });
  });

  it('refuses a malformed value in recovery and never dispatches a code', async () => {
    for (const value of malformed) {
      const jar: CookieJar = {};
      await bootstrap(harness!, jar);
      const refused = await call(
        harness!,
        'POST',
        '/api/v1/auth/password/forgot',
        { phone: value },
        { jar, csrf: true },
      );
      expect(refused.status).toBe(400);
      expect(refused.body).toEqual({
        error: { code: 'INVALID_PHONE', retryable: false, field: 'phone' },
      });
    }
    expect(harness!.sms.messages).toHaveLength(0);

    // A well-formed number continues the flow: no account-existence comparison
    // happens at this step, so the response is the 202 that starts the request.
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const accepted = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: '0912345678' },
      { jar, csrf: true },
    );
    expect(accepted.status).toBe(202);
    expect(accepted.body).toMatchObject({ phone: '+218912345678' });
  });

  it('is not the uniform refusal and carries no account signal', async () => {
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const refused = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0212345678', password },
      { jar, csrf: true },
    );
    const body = refused.body as { error: Record<string, unknown> };
    expect(body.error['code']).toBe('INVALID_PHONE');
    expect(body.error['code']).not.toBe('AUTH_INVALID_CREDENTIALS');
    expect(body.error['field']).toBe('phone');
    // The refusal states the value's rule, not the account's state.
    expect(JSON.stringify(body)).not.toContain('locked');
    expect(JSON.stringify(body)).not.toContain('blocked');
    expect(JSON.stringify(body)).not.toContain('administrator');
  });
});

// FR-018's absence: a signed-in merchant has no way to delete the account. The
// account is seeded directly, with no sign-up flow, and the suite asserts that
// no route accepts its deletion and no rendered control offers it. No retention
// period and no trigger is asserted here — that half of AC-020 belongs to the
// administrator's removal, which `removal-effects.spec.ts` covers (FR-018,
// AC-020; T185).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const repoRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
const password = 'correct horse battery staple';
const phone = '+218912345678';

/** The plausible deletion shapes a client could try. */
const attempts = [
  ['DELETE', `/api/v1/auth/account`],
  ['DELETE', `/api/v1/auth/accounts/${phone}`],
  ['POST', `/api/v1/auth/account/delete`],
  ['POST', `/api/v1/auth/delete`],
  ['DELETE', `/api/v1/users/me`],
  ['POST', `/api/v1/users/me/delete`],
] as const;

/** The surfaces a control would be offered on. */
const surfaces = [
  'apps/web/app/pages/auth/sign-up.vue',
  'apps/web/app/pages/auth/sign-in.vue',
  'apps/web/app/pages/auth/forgot-password.vue',
  'apps/web/app/layouts/bare.vue',
];

describe.skipIf(!hasDatabase)('the absence of self-deletion', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('accepts no route that would delete the account', async () => {
    // Seeded directly: no sign-up flow produced this account.
    const account = await seedAccount(harness!, {
      phoneNumber: phone,
      password,
    });

    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const signed = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar, csrf: true },
    );
    expect(signed.status).toBe(200);

    for (const [method, path] of attempts) {
      const response = await call(harness!, method, path, undefined, {
        jar,
        csrf: true,
      });
      expect(
        [404, 405],
        `${method} ${path} answered ${response.status}`,
      ).toContain(response.status);
      const code = (response.body as { error?: { code?: string } } | null)?.error?.code;
      expect(['NOT_FOUND', 'METHOD_NOT_ALLOWED']).toContain(code);
    }

    // The account and its credential survived every attempt.
    const { createUsersRepository } = await import(
      '../../../src/modules/users/repository/users.ts'
    );
    const repository = createUsersRepository(harness!.db);
    const remaining = await repository.findById(account.id);
    expect(remaining).not.toBeNull();
    expect(remaining?.phoneNumber).toBe(phone);
    const read = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(read.status).toBe(200);
    expect((read.body as { authenticated: boolean }).authenticated).toBe(true);
  });

  it('registers no deletion method on the composed API', () => {
    expect(harness!.app.routes.filter((route) => route.method === 'DELETE')).toHaveLength(0);
  });

  it('offers no deletion control on any surface this slice renders', () => {
    for (const surface of surfaces) {
      const source = readFileSync(join(repoRoot, surface), 'utf8');
      expect(source, `${surface} offers a deletion control`).not.toContain('حذف');
      expect(source, `${surface} names a delete action`).not.toMatch(
        /delete-account|deleteAccount|\/account\/delete/,
      );
    }
  });
});

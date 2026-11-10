// The account's closed status set and its effects: a blocked account's sign-in
// is the uniform refusal, its rows remain, and its next request is refused
// ACCOUNT_BLOCKED with the session tombstoned (FR-016, FR-017, FR-019;
// T090).
import { and, eq, sql } from 'drizzle-orm';
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

describe.skipIf(!hasDatabase)('the account status', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('refuses a blocked account at sign-in with the uniform response', async () => {
    await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
      status: 'blocked',
    });
    const jar: CookieJar = {};
    await bootstrap(harness!, jar);
    const response = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: '0912345678', password },
      { jar, csrf: true },
    );
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
    });
    expect(jar['wafar.session']).toBeUndefined();
  });

  it('tombstones a live session when the block is observed at the next request', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
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

    await harness!.db.execute(
      sql`UPDATE users SET status = 'blocked' WHERE id = ${account.id}`,
    );

    const refused = await call(harness!, 'GET', '/api/v1/auth/session', undefined, { jar });
    expect(refused.status).toBe(401);
    expect((refused.body as { error: { code: string } }).error.code).toBe('ACCOUNT_BLOCKED');

    const row = await harness!.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, account.id), eq(sessions.revokedReason, 'blocked')));
    expect(row.length).toBeGreaterThanOrEqual(1);

    // The rows remain: the block is a status, not a deletion.
    const kept = await harness!.db.select().from(users).where(eq(users.id, account.id));
    expect(kept).toHaveLength(1);
  });
});

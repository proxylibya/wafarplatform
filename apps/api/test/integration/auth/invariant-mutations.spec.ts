// The negative and temporal invariants' failing cases: each mutation is applied
// inside a rolled-back transaction and the assertion the passing suites make is
// shown to fail — a supplied address is ignored and a seeded one is rejected, an
// email-shaped identifier is refused, a partial `users` row and a `users` row
// without its session are found by the detectors that counted zero, and one
// millisecond past each bound flips the verdict, so a build that reads a bound it
// does not enforce fails here (FR-001, FR-004, FR-007, FR-009, FR-031, FR-032,
// FR-034; AC-004, AC-006, AC-010, AC-015, AC-036, AC-057; T161).
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  accounts,
  sessions as sessionsTable,
  users,
  type Database,
  type Transaction,
} from '@wafar/db';
import {
  lockMinutes,
  otpLifetimeSeconds,
  sessionAbsoluteSeconds,
  sessionInactivitySeconds,
} from '@wafar/shared';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import { createLockRepository } from '../../../src/modules/users/repository/user-lock.ts';
import { isExpired, isInactive } from '../../../src/modules/auth/service/sessions.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';

/** A read-only handle: the pool or a mutation's transaction. */
type Queryable = Database | Transaction;

class RolledBack extends Error {}

/** Applies a mutation and rolls it back, so the seeded state never leaks. */
async function mutation(work: (tx: Transaction) => Promise<void>): Promise<void> {
  try {
    await harness!.db.transaction(async (tx) => {
      await work(tx);
      throw new RolledBack();
    });
  } catch (error) {
    if (!(error instanceof RolledBack)) throw error;
  }
}

async function count(table: string, q: Queryable = harness!.db): Promise<number> {
  const rows = await q.execute(sql.raw(`SELECT count(*)::int AS n FROM ${table}`));
  return (rows.rows[0] as { n: number }).n;
}

/** A `users` row that never reached its credential or its session. */
async function partialAccounts(q: Queryable): Promise<number> {
  const rows = await q.execute(sql.raw(`
    SELECT count(*)::int AS n FROM users u
     WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id = u.id)
        OR NOT EXISTS (SELECT 1 FROM sessions s WHERE s.user_id = u.id)
  `));
  return (rows.rows[0] as { n: number }).n;
}

function partialUser(id: string, phone: string) {
  return {
    id,
    fullName: 'صف شبه مكتمل',
    email: `${phone.replace(/\D/g, '')}@phone.invalid`,
    phoneNumber: phone,
    city: 'طرابلس',
    shopName: null,
  };
}

function codeOf(response: { body: unknown }): string {
  return String((response.body as { error?: { code?: string } }).error?.code ?? '');
}

describe.skipIf(!hasDatabase)('the invariants, mutated', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('ignores a supplied address, rejects a seeded one, and refuses an email-shaped identifier', async () => {
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
        city: 'طرابلس',
        website: '',
        formStamp: pair.formStamp,
        email: 'person@example.com',
      },
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    const verified = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId: (started.body as { requestId: string }).requestId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(verified.body).toEqual({ outcome: 'created' });

    // The supplied address is stored nowhere; the sentinel is derived from the
    // normalized number.
    const rows = await harness!.db.select().from(users);
    expect(rows[0]?.email).toBe('218912345678@phone.invalid');
    expect(JSON.stringify(rows)).not.toContain('person@example.com');

    // The mutation: a real email-shaped value cannot be stored at all.
    let rejected: { cause?: { code?: string } } | undefined;
    try {
      await harness!.db.insert(users).values({
        id: 'seeded-real-address',
        fullName: 'شخص آخر',
        email: 'person@example.com',
        phoneNumber: '+218912345679',
        city: 'طرابلس',
        shopName: null,
      });
    } catch (error) {
      rejected = error as { cause?: { code?: string } };
    }
    expect(rejected?.cause?.code).toBe('23514');
    expect(await count('users')).toBe(1);

    // An email-shaped identifier is a format refusal on both public paths.
    const signInJar: CookieJar = {};
    await bootstrap(harness!, signInJar);
    const signIn = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-in',
      { phone: 'person@example.com', password },
      { jar: signInJar, csrf: true },
    );
    expect(signIn.status).toBe(400);
    expect(codeOf(signIn)).toBe('INVALID_PHONE');

    const recovery = await call(
      harness!,
      'POST',
      '/api/v1/auth/password/forgot',
      { phone: 'person@example.com' },
      { jar: signInJar, csrf: true },
    );
    expect(recovery.status).toBe(400);
    expect(codeOf(recovery)).toBe('INVALID_PHONE');
  });

  it('finds a partial users row at each point the passing suites count zero', async () => {
    // After the form.
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
        city: 'طرابلس',
        website: '',
        formStamp: pair.formStamp,
      },
      { jar, csrf: true },
    );
    expect(started.status).toBe(202);
    expect(await count('users')).toBe(0);
    await mutation(async (tx) => {
      await tx.insert(users).values(partialUser('partial-after-form', '+218912345670'));
      expect(await count('users', tx)).toBe(1);
      expect(await partialAccounts(tx)).toBe(1);
    });

    // After an incorrect code.
    const requestId = (started.body as { requestId: string }).requestId;
    const wrong = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: harness!.sms.lastCode() === '000000' ? '000001' : '000000' },
      { jar, csrf: true },
    );
    expect(codeOf(wrong)).toBe('OTP_INCORRECT');
    expect(await count('users')).toBe(0);
    await mutation(async (tx) => {
      await tx.insert(users).values(partialUser('partial-after-code', '+218912345671'));
      expect(await count('users', tx)).toBe(1);
    });

    // After the pending request's own lifetime.
    harness!.clock.advance(otpLifetimeSeconds * 1000);
    const expired = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up/verify',
      { requestId, code: harness!.sms.lastCode() ?? '' },
      { jar, csrf: true },
    );
    expect(codeOf(expired)).toBe('OTP_EXPIRED');
    expect(await count('users')).toBe(0);
    await mutation(async (tx) => {
      await tx.insert(users).values(partialUser('partial-after-lifetime', '+218912345672'));
      expect(await count('users', tx)).toBe(1);
    });

    // The mutations left nothing behind.
    expect(await count('users')).toBe(0);
    expect(await partialAccounts(harness!.db)).toBe(0);
  });

  it('catches a users row without its session at the correct-code point', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    expect(await partialAccounts(harness!.db)).toBe(1);

    // With the live session the detector reads zero again.
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
    expect(await partialAccounts(harness!.db)).toBe(0);

    // The mutation: the session is removed and the same detector finds the row.
    await mutation(async (tx) => {
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, account.id));
      expect(await partialAccounts(tx)).toBe(1);
    });
    expect(await partialAccounts(harness!.db)).toBe(0);

    // The credential's absence is caught on the same terms.
    await mutation(async (tx) => {
      await tx.delete(accounts).where(eq(accounts.userId, account.id));
      expect(await partialAccounts(tx)).toBe(1);
    });
  });

  it('flips each clock’s verdict one millisecond past its bound', async () => {
    const account = await seedAccount(harness!, {
      phoneNumber: '+218912345678',
      password,
    });
    const locks = createLockRepository(harness!.db);
    const now = harness!.clock.now();

    const lockedUntil = new Date(now.getTime() + lockMinutes * 60_000);
    await harness!.db
      .update(users)
      .set({ failedSignInCount: 5, lockedUntil })
      .where(eq(users.id, account.id));
    expect(await locks.isLocked(account.id, new Date(lockedUntil.getTime() - 1))).toBe(
      true,
    );
    expect(await locks.isLocked(account.id, lockedUntil)).toBe(false);

    const lastActivityAt = now;
    expect(
      isInactive(
        lastActivityAt,
        new Date(lastActivityAt.getTime() + sessionInactivitySeconds * 1000 - 1),
      ),
    ).toBe(false);
    expect(
      isInactive(
        lastActivityAt,
        new Date(lastActivityAt.getTime() + sessionInactivitySeconds * 1000),
      ),
    ).toBe(true);

    const expiresAt = new Date(now.getTime() + sessionAbsoluteSeconds * 1000);
    expect(isExpired(expiresAt, new Date(expiresAt.getTime() - 1))).toBe(false);
    expect(isExpired(expiresAt, expiresAt)).toBe(true);

    // The two request clocks, through the route.
    const liveJar: CookieJar = {};
    const pair = await bootstrap(harness!, liveJar);
    harness!.clock.advance(4000);
    const started = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      {
        fullName: 'محمد علي',
        phone: '0912345678',
        password,
        city: 'طرابلس',
        website: '',
        formStamp: pair.formStamp,
      },
      { jar: liveJar, csrf: true },
    );
    expect(started.status).toBe(202);
    const requestId = (started.body as { requestId: string }).requestId;

    harness!.clock.advance(otpLifetimeSeconds * 1000 - 1);
    const live = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${requestId}`,
      undefined,
      { jar: liveJar },
    );
    expect(live.status).toBe(200);

    harness!.clock.advance(1);
    const ended = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${requestId}`,
      undefined,
      { jar: liveJar },
    );
    expect(ended.status).toBe(400);
    expect(codeOf(ended)).toBe('OTP_EXPIRED');
  });
});

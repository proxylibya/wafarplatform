// SC-004's enumeration comparison for the three public flows: the same status,
// the same body shape and field set with the four masked values replaced, the
// same header names, and a duration difference inside the recorded tolerance,
// whether or not the number has an account (FR-006, FR-008, FR-015, AC-009;
// T037, T058, T082).
//
// The three cases are this slice's three enumeration suites, and they share one
// committed fixture: `ensureEnumerationFixture` creates it once here, and each
// case reads the same fixed merchant, locked, blocked, and administrator
// accounts and the same no-account number outside the seed. The timed comparison
// keeps the deterministic per-sample numbers, because a repeated failed sign-in
// moves the account's lock and a repeated request moves the same window; the
// fixed pair states the closed outcome each case is measured on (T163).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import {
  enumerationSamples,
  enumerationWarmUp,
  withinTolerance,
} from '../../support/enumeration.ts';
import {
  ensureEnumerationFixture,
  ensureEnumerationLock,
  enumerationCity,
  enumerationNumbers,
  loadOnlyCredential,
  type EnumerationFixture,
} from '../../support/enumeration-fixture.ts';

const harness = hasDatabase ? createHarness() : null;
const password = loadOnlyCredential;
let fixture: EnumerationFixture | null = null;

function city(): string {
  return enumerationCity;
}

function numberAt(index: number): string {
  return `+21893${String(2_000_000 + index)}`;
}

function displayAt(index: number): string {
  const national = `93${String(2_000_000 + index)}`;
  return `0${national}`;
}

let requestIndex = 0;
function pace(): void {
  if (requestIndex > 0 && requestIndex % 15 === 0) {
    harness!.clock.advance(15 * 60 * 1000);
  }
  requestIndex += 1;
}

function headerNames(headers: Headers): string[] {
  return [...headers.keys()]
    .filter((name) => name !== 'date' && name !== 'x-request-id')
    .sort();
}

function masked(body: unknown): Record<string, unknown> {
  const value = { ...(body as Record<string, unknown>) };
  for (const key of ['requestId', 'phone', 'codeExpiresAt', 'expiresAt']) {
    if (key in value) value[key] = `<${key}>`;
  }
  return value;
}

async function timed<T>(work: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const started = performance.now();
  const value = await work();
  return { value, ms: performance.now() - started };
}

interface Recorded {
  status: number;
  body: unknown;
  headers: Headers;
}

/** The fixture's fixed sign-up pair: one submission per number, once. */
async function probeSignUp(typed: string): Promise<Recorded> {
  const jar: CookieJar = {};
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    {
      fullName: 'محمد علي',
      phone: typed,
      password,
      city: city(),
      website: '',
      formStamp: pair.formStamp,
    },
    { jar, csrf: true },
  );
}

async function probeSignIn(typed: string, given: string): Promise<Recorded> {
  const jar: CookieJar = {};
  await bootstrap(harness!, jar);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-in',
    { phone: typed, password: given },
    { jar, csrf: true },
  );
}

async function probeRecovery(typed: string): Promise<Recorded> {
  const jar: CookieJar = {};
  await bootstrap(harness!, jar);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone: typed },
    { jar, csrf: true },
  );
}

describe.skipIf(!hasDatabase)('the enumeration comparison', () => {
  beforeAll(async () => {
    await harness!.reset();
    // The one committed fixture all three cases read (T163).
    fixture = await ensureEnumerationFixture(harness!);
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('answers a sign-up identically for a number with an account and one without', async () => {
    // The fixed pair the committed fixture states: the merchant that holds an
    // account and the number outside the seed.
    const fixtureAccount = await probeSignUp(enumerationNumbers.merchant.typed);
    const fixtureNone = await probeSignUp(enumerationNumbers.noAccount.typed);
    expect(fixtureAccount.status).toBe(202);
    expect(fixtureNone.status).toBe(202);
    expect(masked(fixtureAccount.body)).toEqual(masked(fixtureNone.body));

    const samples = enumerationSamples();
    const total = enumerationWarmUp + samples;
    for (let index = 0; index < total; index += 1) {
      pace();
      await seedAccount(harness!, {
        phoneNumber: numberAt(index),
        password,
        city: city(),
      });
    }

    const withAccount: number[] = [];
    const without: number[] = [];
    let reference: { body: unknown; headers: Headers } | null = null;
    const jar: CookieJar = {};

    for (let index = 0; index < total; index += 1) {
      pace();
      const pair = await bootstrap(harness!, jar);
      harness!.clock.advance(4000);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/sign-up',
          {
            fullName: 'محمد علي',
            phone: `0${numberAt(index).slice(4)}`,
            password,
            city: city(),
            website: '',
            formStamp: pair.formStamp,
          },
          { jar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(202);
      reference ??= result.value;
      if (index >= enumerationWarmUp) withAccount.push(result.ms);
    }

    // The no-account block is disjoint from the seeded 0+ block and from the
    // sign-in and recovery cases' 1000+/5000+ and 2000+/6000+ blocks, so this
    // comparison measures existence, not two formats of one account.
    for (const index of [0, total - 1]) {
      const existing = await harness!.db.execute(
        sql`SELECT count(*)::int AS n FROM users WHERE phone_number = ${numberAt(7000 + index)}`,
      );
      expect((existing.rows[0] as { n: number }).n).toBe(0);
    }

    const otherJar: CookieJar = {};
    let otherFirst: { body: unknown; headers: Headers } | null = null;
    for (let index = 0; index < total; index += 1) {
      pace();
      const pair = await bootstrap(harness!, otherJar);
      harness!.clock.advance(4000);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/sign-up',
          {
            fullName: 'محمد علي',
            phone: displayAt(7000 + index),
            password,
            city: city(),
            website: '',
            formStamp: pair.formStamp,
          },
          { jar: otherJar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(202);
      otherFirst ??= result.value;
      if (index >= enumerationWarmUp) without.push(result.ms);
    }

    const verdict = withinTolerance(without, withAccount);
    expect(
      verdict.ok,
      `median difference ${verdict.medianDifference.toFixed(1)} ms, p95 difference ${verdict.p95Difference.toFixed(1)} ms`,
    ).toBe(true);
    expect(masked(reference!.body)).toEqual(masked(otherFirst!.body));
    expect(Object.keys(reference!.body as object).sort()).toEqual(
      Object.keys(otherFirst!.body as object).sort(),
    );
    expect(headerNames(reference!.headers)).toEqual(headerNames(otherFirst!.headers));
  }, 300_000);

  it('answers a failed sign-in identically for an unknown number and a wrong password', async () => {
    // The sign-up case moved the shared clock past the fixture's first lock, so
    // the lock is restated against the current instant before it is read.
    expect(fixture).not.toBeNull();
    await ensureEnumerationLock(harness!, fixture!.lockedId);

    // The fixture's four accounts and the number outside the seed share the one
    // uniform transcript: the merchant with a wrong password, the locked
    // account, the blocked account, the administrator, and the unknown number.
    const uniform = {
      error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
    };
    const merchantWrong = await probeSignIn(
      enumerationNumbers.merchant.typed,
      'a wrong but long password',
    );
    expect(merchantWrong.status).toBe(401);
    expect(merchantWrong.body).toEqual(uniform);
    for (const typed of [
      enumerationNumbers.locked.typed,
      enumerationNumbers.blocked.typed,
      enumerationNumbers.administrator.typed,
      enumerationNumbers.noAccount.typed,
    ]) {
      const response = await probeSignIn(typed, password);
      expect(response.status).toBe(401);
      expect(response.body).toEqual(uniform);
    }

    const samples = enumerationSamples();
    const total = enumerationWarmUp + samples;
    for (let index = 0; index < total; index += 1) {
      pace();
      await seedAccount(harness!, {
        phoneNumber: numberAt(1000 + index),
        password,
        city: city(),
      });
    }

    const wrongPassword: number[] = [];
    const unknown: number[] = [];
    const jar: CookieJar = {};

    for (let index = 0; index < total; index += 1) {
      pace();
      await bootstrap(harness!, jar);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: displayAt(1000 + index), password: 'wrong password value' },
          { jar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(401);
      expect(result.value.body).toEqual({
        error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
      });
      expect(result.value.body).not.toHaveProperty('phone');
      if (index >= enumerationWarmUp) wrongPassword.push(result.ms);
    }

    const unknownJar: CookieJar = {};
    for (let index = 0; index < total; index += 1) {
      pace();
      await bootstrap(harness!, unknownJar);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/sign-in',
          { phone: displayAt(5000 + index), password: 'wrong password value' },
          { jar: unknownJar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(401);
      expect(result.value.body).toEqual({
        error: { code: 'AUTH_INVALID_CREDENTIALS', retryable: false },
      });
      expect(result.value.body).not.toHaveProperty('phone');
      if (index >= enumerationWarmUp) unknown.push(result.ms);
    }

    const verdict = withinTolerance(unknown, wrongPassword);
    expect(
      verdict.ok,
      `median difference ${verdict.medianDifference.toFixed(1)} ms, p95 difference ${verdict.p95Difference.toFixed(1)} ms`,
    ).toBe(true);
  }, 300_000);

  it('answers a recovery request identically for a number with an account and one without', async () => {
    // The fixed pair again, through the recovery operation.
    const fixtureAccount = await probeRecovery(enumerationNumbers.merchant.typed);
    const fixtureNone = await probeRecovery(enumerationNumbers.noAccount.typed);
    expect(fixtureAccount.status).toBe(202);
    expect(fixtureNone.status).toBe(202);
    expect((fixtureAccount.body as { phone: string }).phone).toBe(
      enumerationNumbers.merchant.e164,
    );
    expect((fixtureNone.body as { phone: string }).phone).toBe(
      enumerationNumbers.noAccount.e164,
    );
    expect(masked(fixtureAccount.body)).toEqual(masked(fixtureNone.body));

    const samples = enumerationSamples();
    const total = enumerationWarmUp + samples;
    for (let index = 0; index < total; index += 1) {
      pace();
      await seedAccount(harness!, {
        phoneNumber: numberAt(2000 + index),
        password,
        city: city(),
      });
    }

    const withAccount: number[] = [];
    const without: number[] = [];
    let reference: { body: unknown; headers: Headers } | null = null;
    const jar: CookieJar = {};

    for (let index = 0; index < total; index += 1) {
      pace();
      await bootstrap(harness!, jar);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/password/forgot',
          { phone: displayAt(2000 + index) },
          { jar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(202);
      const body = result.value.body as { phone: string };
      expect(body.phone).toBe(numberAt(2000 + index));
      reference ??= result.value;
      if (index >= enumerationWarmUp) withAccount.push(result.ms);
    }

    const otherJar: CookieJar = {};
    let otherFirst: { body: unknown; headers: Headers } | null = null;
    for (let index = 0; index < total; index += 1) {
      pace();
      await bootstrap(harness!, otherJar);
      const result = await timed(() =>
        call(
          harness!,
          'POST',
          '/api/v1/auth/password/forgot',
          { phone: displayAt(6000 + index) },
          { jar: otherJar, csrf: true },
        ),
      );
      expect(result.value.status).toBe(202);
      const body = result.value.body as { phone: string };
      expect(body.phone).toBe(numberAt(6000 + index));
      otherFirst ??= result.value;
      if (index >= enumerationWarmUp) without.push(result.ms);
    }

    const verdict = withinTolerance(without, withAccount);
    expect(
      verdict.ok,
      `median difference ${verdict.medianDifference.toFixed(1)} ms, p95 difference ${verdict.p95Difference.toFixed(1)} ms`,
    ).toBe(true);
    expect(masked(reference!.body)).toEqual(masked(otherFirst!.body));
    expect(headerNames(reference!.headers)).toEqual(headerNames(otherFirst!.headers));
  }, 300_000);
});

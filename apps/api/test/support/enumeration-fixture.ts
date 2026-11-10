// The committed enumeration fixture: one active merchant, one locked account,
// one blocked account, and one administrator with fixed numbers, one fixed city,
// and the load-only credential, plus the no-account number outside the seed. No
// value is generated per run, so a comparison is reproducible from the
// repository alone (T037, T058, T082; T163).
import { eq } from 'drizzle-orm';
import { users } from '@wafar/db';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import { lockMinutes } from '@wafar/shared';
import { seedAccount, type Harness } from './harness.ts';

/** The one credential the enumeration cases use. */
export const loadOnlyCredential = 'correct horse battery staple';

/** The one city every enumeration account records. */
export const enumerationCity: string = cities.entries[0] ?? 'طرابلس';

export interface EnumerationNumber {
  /** The stored form. */
  e164: string;
  /** The form the page accepts. */
  typed: string;
}

function number(index: number): EnumerationNumber {
  const national = `91${String(7_000_000 + index)}`;
  return { e164: `+218${national}`, typed: `0${national}` };
}

export const enumerationNumbers = {
  /** The active merchant every flow's "has an account" case reads. */
  merchant: number(1),
  /** The account held under the sign-in lock. */
  locked: number(2),
  /** The blocked account. */
  blocked: number(3),
  /** The administrator account, restricted by the forced first change. */
  administrator: number(4),
  /** A number outside the seed, so the "no account" case is never a fixture. */
  noAccount: number(99),
} as const;

export interface EnumerationFixture {
  merchantId: string;
  lockedId: string;
  blockedId: string;
  administratorId: string;
}

/**
 * Creates the fixture's four accounts. It is idempotent, so a suite that
 * truncates the shared tables re-establishes the same fixed rows rather than
 * inventing new values.
 */
export async function ensureEnumerationFixture(
  harness: Harness,
): Promise<EnumerationFixture> {
  const existing = await harness.db
    .select({ id: users.id, phoneNumber: users.phoneNumber })
    .from(users);
  const byPhone = new Map(existing.map((row) => [row.phoneNumber, row.id]));

  const ensure = async (
    key: keyof typeof enumerationNumbers,
    options: Parameters<typeof seedAccount>[1],
  ): Promise<string> => {
    const known = byPhone.get(enumerationNumbers[key].e164);
    if (known !== undefined) return known;
    const created = await seedAccount(harness, options);
    return created.id;
  };

  const merchantId = await ensure('merchant', {
    phoneNumber: enumerationNumbers.merchant.e164,
    password: loadOnlyCredential,
    city: enumerationCity,
  });

  const lockedId = await ensure('locked', {
    phoneNumber: enumerationNumbers.locked.e164,
    password: loadOnlyCredential,
    city: enumerationCity,
  });

  const blockedId = await ensure('blocked', {
    phoneNumber: enumerationNumbers.blocked.e164,
    password: loadOnlyCredential,
    city: enumerationCity,
    status: 'blocked',
  });

  const administratorId = await ensure('administrator', {
    phoneNumber: enumerationNumbers.administrator.e164,
    password: loadOnlyCredential,
    city: enumerationCity,
    role: 'administrator',
    mustChangePassword: true,
  });

  await ensureEnumerationLock(harness, lockedId);

  return { merchantId, lockedId, blockedId, administratorId };
}

/**
 * Restates the lock against the harness's current clock. The enumeration cases
 * share one fixture but move the injected clock; a lock fixed only at the
 * fixture's creation would have expired by the sign-in case.
 */
export async function ensureEnumerationLock(
  harness: Harness,
  lockedId: string,
): Promise<void> {
  const lockedUntil = new Date(harness.clock.now().getTime() + lockMinutes * 60_000);
  await harness.db
    .update(users)
    .set({ failedSignInCount: 5, lockedUntil })
    .where(eq(users.id, lockedId));
}

/** The four cases' expected closed outcome, read by the three suites. */
export const enumerationExpectations = {
  merchant: 'has an account',
  locked: 'AUTH_INVALID_CREDENTIALS',
  blocked: 'AUTH_INVALID_CREDENTIALS',
  administrator: 'AUTH_INVALID_CREDENTIALS',
  noAccount: 'no account',
} as const;

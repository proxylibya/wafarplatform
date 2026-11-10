// The effects of an administrator removal, performed by the test in the order
// R13's operation must use: the `accounts` row first because its key is
// ON DELETE RESTRICT, the number's `phone_verifications` row next because that
// table carries no foreign key, and the `users` row last, whose `sessions` key
// cascades. The state is established before the removal so the assertions after
// it are not vacuous (FR-018, AC-020; T144).
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  accounts,
  phoneVerifications,
  sessions,
  users,
  type Database,
} from '@wafar/db';
import {
  createHarness,
  hasDatabase,
} from '../../support/harness.ts';
import { authenticate } from '../../../src/http/context.ts';
import { hashPassword, verifyPassword } from '../../../src/modules/auth/service/password-policy.ts';
import { createUsersRepository } from '../../../src/modules/users/repository/users.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'merchant password value';
const code = '428193';

async function count(table: string): Promise<number> {
  const result = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (result.rows[0] as { n: number }).n;
}

async function seedRemovableAccount(db: Database): Promise<{
  userId: string;
  token: string;
}> {
  const account = await createUsersRepository(db).create({
    fullName: 'سالم بن عامر',
    phoneNumber: '+218945550101',
    city: 'طرابلس',
    shopName: null,
  });
  await harness!.auth.createCredential({
    userId: account.id,
    passwordHash: await harness!.auth.hashPassword(password),
  });

  const token = 'removal-seeded-token'.padEnd(40, 'z');
  await db.insert(sessions).values({
    id: 'removal-session',
    userId: account.id,
    token,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    lastActivityAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'the removal suite',
  });

  await db.insert(phoneVerifications).values({
    id: 'removal-pending',
    phoneNumber: '+218945550101',
    purpose: 'sign_up',
    state: 'pending',
    codeHash: await hashPassword(code),
    codeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    requestExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    resumeTokenHash: 'a'.repeat(64),
    fullName: 'سالم بن عامر',
    city: 'طرابلس',
    passwordHash: await hashPassword(password),
  });

  return { userId: account.id, token };
}

describe.skipIf(!hasDatabase)('an administrator removal’s effects', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('ends the session, the pending request, the credential, and the person’s row', async () => {
    const seeded = await seedRemovableAccount(harness!.db);
    const now = new Date();

    // The state the removal must end is established first.
    const context = await authenticate(harness!.db, harness!.auth, {
      token: seeded.token,
      now,
      requiresUnrestricted: false,
      isUserInitiated: false,
    });
    expect(context.kind).toBe('session');
    expect(context.kind === 'session' ? context.userId : null).toBe(seeded.userId);

    const credential = (await harness!.db.select().from(accounts))[0];
    expect(credential?.password).toMatch(/^\$wafar\$scrypt\$/);
    const pending = (await harness!.db.select().from(phoneVerifications))[0];
    expect(pending?.state).toBe('pending');
    expect(await verifyPassword(code, pending!.codeHash)).toBe(true);
    expect(pending!.codeExpiresAt.getTime()).toBeGreaterThan(now.getTime());

    // The order matters: a `users` delete issued before the `accounts` delete is
    // refused by the restriction, and the transaction rolls back.
    let refusal: unknown;
    try {
      await harness!.db.transaction(async (tx) => {
        await tx.delete(users).where(eq(users.id, seeded.userId));
      });
    } catch (error) {
      refusal = error;
    }
    expect(refusal).toBeDefined();
    expect((refusal as { cause?: { code?: string } }).cause?.code).toBe('23503');
    expect(await count('users')).toBe(1);
    expect(await count('accounts')).toBe(1);

    // The order the operation must use.
    await harness!.db.delete(accounts).where(eq(accounts.userId, seeded.userId));
    await harness!.db
      .delete(phoneVerifications)
      .where(eq(phoneVerifications.phoneNumber, '+218945550101'));
    await harness!.db.delete(users).where(eq(users.id, seeded.userId));

    // No session survives, and the seeded token resolves as the guest state.
    expect(await count('sessions')).toBe(0);
    const after = await authenticate(harness!.db, harness!.auth, {
      token: seeded.token,
      now,
      requiresUnrestricted: false,
      isUserInitiated: false,
    });
    expect(after).toEqual({ kind: 'guest' });

    // No pending request survives, and the code can authorise nothing.
    expect(await count('phone_verifications')).toBe(0);
    const noRow = await harness!.db
      .select()
      .from(phoneVerifications)
      .where(eq(phoneVerifications.phoneNumber, '+218945550101'));
    expect(noRow).toHaveLength(0);

    // No credential and no account row survive.
    expect(await count('accounts')).toBe(0);
    expect(await count('users')).toBe(0);
    const gone = await harness!.db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, '+218945550101'));
    expect(gone).toHaveLength(0);

    // The library's placeholder stayed empty throughout.
    expect(await count('verifications')).toBe(0);
  });
});

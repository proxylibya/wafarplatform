// The consecutive-failure count and its fifteen-minute lock against the real
// database: five failed password verifications lock, a refusal while locked
// neither counts nor extends, expiry clears, a success clears, a value-rule
// refusal never counts, and the account's own change action counts exactly as
// sign-in does (FR-009, AC-010, SC-007; T056, T204).
import { randomInt } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { users } from '@wafar/db';
import { lockAfterFailures, lockMinutes } from '@wafar/shared';
import { createLockRepository } from '../../../src/modules/users/repository/user-lock.ts';
import { createPasswordChangeService } from '../../../src/modules/auth/service/password-change.ts';
import {
  createHarness,
  hasDatabase,
  seedAccount,
  type Harness,
} from '../../support/harness.ts';

const password = 'correct horse battery staple';

describe.skipIf(!hasDatabase)('the consecutive-failure count', () => {
  let harness: Harness;
  let locks: ReturnType<typeof createLockRepository>;
  let userId: string;

  async function readCount(): Promise<{
    failedSignInCount: number;
    lockedUntil: Date | null;
  }> {
    const rows = await harness.db
      .select({
        failedSignInCount: users.failedSignInCount,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.id, userId));
    return {
      failedSignInCount: rows[0]?.failedSignInCount ?? -1,
      lockedUntil: rows[0]?.lockedUntil ?? null,
    };
  }

  beforeAll(() => {
    harness = createHarness();
    locks = createLockRepository(harness.db);
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
    const national = `91${randomInt(0, 10_000_000).toString().padStart(7, '0')}`;
    const account = await seedAccount(harness, {
      phoneNumber: `+218${national}`,
      password,
    });
    userId = account.id;
  });

  it('counts only failed verification, locks at the fifth, and never recomputes while locked', async () => {
    const now = new Date('2026-03-01T10:00:00.000Z');
    for (let attempt = 1; attempt < lockAfterFailures; attempt += 1) {
      const state = await locks.recordFailedAttempt(userId, now);
      expect(state.failedCount).toBe(attempt);
      expect(state.lockedUntil).toBeNull();
    }
    const fifth = await locks.recordFailedAttempt(userId, now);
    expect(fifth.failedCount).toBe(lockAfterFailures);
    expect(fifth.lockedUntil?.toISOString()).toBe(
      new Date(now.getTime() + lockMinutes * 60_000).toISOString(),
    );

    // A refusal while the lock holds neither counts nor extends it.
    const during = await locks.recordFailedAttempt(
      userId,
      new Date(now.getTime() + 60_000),
    );
    expect(during.failedCount).toBe(lockAfterFailures);
    expect(during.lockedUntil?.toISOString()).toBe(
      fifth.lockedUntil?.toISOString(),
    );
  });

  it('lifts at the fifteen-minute mark and starts the count again from zero', async () => {
    const now = new Date('2026-03-01T10:00:00.000Z');
    for (let attempt = 0; attempt < lockAfterFailures; attempt += 1) {
      await locks.recordFailedAttempt(userId, now);
    }
    const atExpiry = new Date(now.getTime() + lockMinutes * 60_000);
    expect(await locks.isLocked(userId, new Date(atExpiry.getTime() - 1))).toBe(true);
    expect(await locks.isLocked(userId, atExpiry)).toBe(false);

    const after = await locks.recordFailedAttempt(userId, atExpiry);
    expect(after.failedCount).toBe(1);
    expect(after.lockedUntil).toBeNull();
  });

  it('clears on a success', async () => {
    const now = new Date('2026-03-01T10:00:00.000Z');
    await locks.recordFailedAttempt(userId, now);
    await locks.recordFailedAttempt(userId, now);
    expect((await readCount()).failedSignInCount).toBe(2);
    await locks.recordSuccess(userId, now);
    expect(await readCount()).toEqual({ failedSignInCount: 0, lockedUntil: null });
  });

  it('does not count a value-rule refusal and does count a failed current-password check', async () => {
    const now = new Date('2026-03-01T10:00:00.000Z');
    const changes = createPasswordChangeService(harness.db, harness.auth);
    const events = { emit: () => undefined };

    // A new password shorter than the minimum is refused before any check.
    const refused = await changes.change({
      userId,
      token: 'no-session-needed',
      currentPassword: password,
      newPassword: 'short',
      now,
      requestId: 'request-1',
      path: 'change',
      events,
    });
    expect(refused).toEqual({ status: 'refused', code: 'PASSWORD_TOO_SHORT' });
    expect((await readCount()).failedSignInCount).toBe(0);

    // A failed current-password check is a failed verification and counts.
    const failed = await changes.change({
      userId,
      token: 'no-session-needed',
      currentPassword: 'wrong password value',
      newPassword: 'another correct horse battery staple',
      now,
      requestId: 'request-2',
      path: 'change',
      events,
    });
    expect(failed).toEqual({ status: 'refused', code: 'AUTH_INVALID_CREDENTIALS' });
    expect((await readCount()).failedSignInCount).toBe(1);
  });
});

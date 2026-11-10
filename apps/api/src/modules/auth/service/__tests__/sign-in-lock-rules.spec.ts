// The lock's pure rules, measured without a database: the fifth failed
// verification locks for fifteen minutes, an attempt while locked neither
// counts nor extends, the lock lifts at the fifteen-minute mark and the count
// restarts from zero, and a clear row carries no count
// (FR-009, AC-010, SC-007; T056, T204).
import { describe, expect, it } from 'vitest';
import { afterFailedAttempt, lockAfterFailures, lockMinutes, lockStateAt } from '@wafar/shared';

const start = new Date('2026-03-01T10:00:00.000Z');

describe('the consecutive-failure count', () => {
  it('locks at the fifth failure and reports the lock window', () => {
    let count = 0;
    let lockedUntil: Date | null = null;
    for (let attempt = 1; attempt < lockAfterFailures; attempt += 1) {
      const state = afterFailedAttempt(count, lockedUntil, start);
      count = state.failedCount;
      lockedUntil = state.lockedUntil;
      expect(count).toBe(attempt);
      expect(lockedUntil).toBeNull();
    }
    const fifth = afterFailedAttempt(count, lockedUntil, start);
    expect(fifth.failedCount).toBe(lockAfterFailures);
    expect(fifth.lockedUntil?.toISOString()).toBe(
      new Date(start.getTime() + lockMinutes * 60_000).toISOString(),
    );
  });

  it('neither counts nor extends an attempt while the lock holds', () => {
    const fifth = afterFailedAttempt(
      lockAfterFailures - 1,
      null,
      start,
    );
    const during = afterFailedAttempt(
      fifth.failedCount,
      fifth.lockedUntil,
      new Date(start.getTime() + 60_000),
    );
    expect(during.failedCount).toBe(lockAfterFailures);
    expect(during.lockedUntil?.toISOString()).toBe(fifth.lockedUntil?.toISOString());
  });

  it('lifts at the fifteen-minute mark and starts the count again from zero', () => {
    const fifth = afterFailedAttempt(lockAfterFailures - 1, null, start);
    const atExpiry = new Date(start.getTime() + lockMinutes * 60_000);
    expect(lockStateAt(fifth.failedCount, fifth.lockedUntil, new Date(atExpiry.getTime() - 1))).toEqual(
      { failedCount: lockAfterFailures, lockedUntil: fifth.lockedUntil },
    );
    expect(lockStateAt(fifth.failedCount, fifth.lockedUntil, atExpiry)).toEqual({
      failedCount: 0,
      lockedUntil: null,
    });
    expect(afterFailedAttempt(fifth.failedCount, fifth.lockedUntil, atExpiry)).toEqual({
      failedCount: 1,
      lockedUntil: null,
    });
  });

  it('reads a cleared row as no count', () => {
    expect(lockStateAt(0, null, start)).toEqual({ failedCount: 0, lockedUntil: null });
  });
});

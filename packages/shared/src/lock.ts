// The wrong-password lock's pure rules: the count, the clear, and the expiry
// (CMV 9; FR-009, AC-010). The repository applies the same arithmetic in one
// conditional update, so the unit class measures these rules without a
// database (T204).
import { lockAfterFailures, lockMinutes } from './limits.ts';
import type { LockState } from './ports.ts';

/**
 * The state a stored row represents at `now`: an expired lock reads as clear,
 * and a cleared row carries no count.
 */
export function lockStateAt(
  failedSignInCount: number,
  lockedUntil: Date | null,
  now: Date,
): LockState {
  if (lockedUntil === null) {
    return { failedCount: failedSignInCount, lockedUntil: null };
  }
  if (lockedUntil.getTime() > now.getTime()) {
    return { failedCount: failedSignInCount, lockedUntil };
  }
  return { failedCount: 0, lockedUntil: null };
}

/**
 * The state after one failed verification at `now`: while a lock holds, the
 * attempt neither counts nor extends it; the fifth failure locks for fifteen
 * minutes; an expired lock clears before the attempt counts.
 */
export function afterFailedAttempt(
  failedSignInCount: number,
  lockedUntil: Date | null,
  now: Date,
): LockState {
  const current = lockStateAt(failedSignInCount, lockedUntil, now);
  if (current.lockedUntil !== null) return current;
  const failedCount = current.failedCount + 1;
  return {
    failedCount,
    lockedUntil:
      failedCount >= lockAfterFailures
        ? new Date(now.getTime() + lockMinutes * 60_000)
        : null,
  };
}

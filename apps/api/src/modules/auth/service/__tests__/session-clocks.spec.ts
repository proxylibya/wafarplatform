// The two session clocks and the activity rule, at both sides of every bound: a
// session lives until 30 minutes of inactivity and 12 hours absolute, only a
// merchant-initiated action resets the inactivity clock, and reopening a browser
// neither ends nor extends a session (FR-032, AC-015; T057).
import { describe, expect, it } from 'vitest';
import {
  sessionAbsoluteSeconds,
  sessionInactivitySeconds,
} from '@wafar/shared';
import { isExpired, isInactive } from '../sessions.ts';

const start = new Date('2026-03-01T10:00:00.000Z');

function plus(base: Date, ms: number): Date {
  return new Date(base.getTime() + ms);
}

describe('the session clocks', () => {
  it('ends a session at exactly thirty minutes of inactivity, and not before', () => {
    const bound = sessionInactivitySeconds * 1000;
    expect(isInactive(start, plus(start, bound - 1))).toBe(false);
    expect(isInactive(start, plus(start, bound))).toBe(true);
    expect(isInactive(start, plus(start, bound + 1))).toBe(true);
  });

  it('ends a session at exactly twelve hours absolute, and not before', () => {
    const bound = sessionAbsoluteSeconds * 1000;
    const expiresAt = plus(start, bound);
    expect(isExpired(expiresAt, plus(start, bound - 1))).toBe(false);
    expect(isExpired(expiresAt, plus(start, bound))).toBe(true);
    expect(isExpired(expiresAt, plus(start, bound + 1))).toBe(true);
  });

  it('keeps the two clocks independent of one another', () => {
    // A recent action keeps the inactivity clock open...
    const elevenHours = 11 * 60 * 60 * 1000;
    const lastActivityAt = plus(start, elevenHours - 60_000);
    const now = plus(start, elevenHours);
    expect(isInactive(lastActivityAt, now)).toBe(false);
    // ...while the absolute clock still ends the session at twelve hours.
    const expiresAt = plus(start, sessionAbsoluteSeconds * 1000);
    expect(isExpired(expiresAt, now)).toBe(false);
    expect(isExpired(expiresAt, plus(start, sessionAbsoluteSeconds * 1000))).toBe(true);
  });

  it('reads a browser restart as no activity and no extension', () => {
    // A restart produces no request the merchant initiated, so the stored
    // activity instant is unchanged and the clock reads exactly as it did.
    const lastActivityAt = plus(start, 5 * 60 * 1000);
    const beforeRestart = plus(start, 20 * 60 * 1000);
    const afterRestart = plus(start, 25 * 60 * 1000);
    expect(isInactive(lastActivityAt, beforeRestart)).toBe(false);
    expect(isInactive(lastActivityAt, afterRestart)).toBe(false);
    // The inactivity bound is still measured from the stored instant alone.
    expect(isInactive(lastActivityAt, plus(lastActivityAt, sessionInactivitySeconds * 1000))).toBe(
      true,
    );
  });
});

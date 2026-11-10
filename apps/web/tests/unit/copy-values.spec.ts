// The copy's numeral contract: each slot resolves from the shared limits, each
// rendered string carries its slot's value and no other numeral, and each value
// still falls in the agreement class its string declares (T054, AC-037).
import { describe, expect, it } from 'vitest';
import {
  fullNameMaxLength,
  otpLifetimeMinutes,
  passwordMaxLength,
  passwordMinLength,
  shopNameMaxLength,
} from '@wafar/shared';
import { messageFor, notices } from '../../app/composables/auth/useAuthMessages';

function numerals(value: string): string[] {
  return value.match(/\d+/g) ?? [];
}

describe('the message table’s numerals', () => {
  it('renders the password bounds from the limits', () => {
    expect(messageFor({ code: 'PASSWORD_TOO_SHORT' })).toContain(
      String(passwordMinLength),
    );
    expect(messageFor({ code: 'PASSWORD_TOO_LONG' })).toContain(
      String(passwordMaxLength),
    );
  });

  it('renders the field bounds from the limits', () => {
    expect(messageFor({ code: 'INVALID_FULL_NAME', reason: 'too_long' })).toContain(
      String(fullNameMaxLength),
    );
    expect(messageFor({ code: 'INVALID_SHOP_NAME', reason: 'too_long' })).toContain(
      String(shopNameMaxLength),
    );
  });

  it('carries no numeral beyond its slot', () => {
    expect(numerals(messageFor({ code: 'PASSWORD_TOO_SHORT' }))).toEqual([
      String(passwordMinLength),
    ]);
    expect(numerals(messageFor({ code: 'PASSWORD_TOO_LONG' }))).toEqual([
      String(passwordMaxLength),
    ]);
    expect(numerals(messageFor({ code: 'INVALID_FULL_NAME', reason: 'too_long' }))).toEqual([
      String(fullNameMaxLength),
    ]);
  });

  it('keeps each value in the agreement class its noun declares', () => {
    // Singular accusative (11–99): «حرفا».
    const min = passwordMinLength % 100;
    expect(min >= 11 && min <= 99).toBe(true);
    const max = passwordMaxLength % 100;
    expect(max >= 11 && max <= 99).toBe(true);
    // Singular (00–02): «حرف».
    expect(fullNameMaxLength % 100 <= 2).toBe(true);
    expect(shopNameMaxLength % 100 <= 2).toBe(true);
    // Plural genitive (03–10): «دقائق».
    const minutes = otpLifetimeMinutes % 100;
    expect(minutes >= 3 && minutes <= 10).toBe(true);
  });

  it('states the expiry hint with the recorded lifetime', () => {
    expect(notices.expiryHint).toContain(String(otpLifetimeMinutes));
  });
});

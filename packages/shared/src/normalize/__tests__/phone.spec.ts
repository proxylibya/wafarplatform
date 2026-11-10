// Unit test the accepted number spellings and the format refusal: separators, a
// national leading zero, +218 / 00218 / 218 read once, Arabic-Indic digits, and
// a landline or unlisted prefix refused (FR-031, FR-003, FR-042).
import { describe, expect, it } from 'vitest';
import {
  formatPhoneForDisplay,
  normalizePhone,
} from '../../normalize/phone.ts';

describe('normalizePhone', () => {
  it('accepts the canonical national form with a leading zero', () => {
    expect(normalizePhone('0912345678')).toEqual({
      e164: '+218912345678',
      national: '912345678',
    });
  });

  it('reads the country code once in each of its three forms', () => {
    for (const value of ['+218912345678', '00218912345678', '218912345678']) {
      expect(normalizePhone(value)?.e164).toBe('+218912345678');
    }
  });

  it('ignores spaces, dashes, and parentheses', () => {
    for (const value of ['091 234 5678', '091-234-5678', '(091) 2345678']) {
      expect(normalizePhone(value)?.e164).toBe('+218912345678');
    }
  });

  it('maps Arabic-Indic and Eastern Arabic-Indic digits', () => {
    expect(normalizePhone('٠٩١٢٣٤٥٦٧٨')?.e164).toBe('+218912345678');
    expect(normalizePhone('۰۹۱۲۳۴۵۶۷۸')?.e164).toBe('+218912345678');
  });

  it('accepts every listed prefix', () => {
    for (const prefix of ['91', '92', '93', '94', '95']) {
      expect(normalizePhone(`0${prefix}2345678`)?.national.startsWith(prefix)).toBe(
        true,
      );
    }
  });

  it('refuses a landline prefix', () => {
    expect(normalizePhone('0212345678')).toBeNull();
  });

  it('refuses an unlisted mobile prefix', () => {
    expect(normalizePhone('0992345678')).toBeNull();
  });

  it('refuses a number that is short, long, or not a number', () => {
    for (const value of ['091234567', '09123456789', '', 'abcdefghij']) {
      expect(normalizePhone(value)).toBeNull();
    }
  });

  it('renders the display form of FR-038', () => {
    expect(formatPhoneForDisplay('+218912345678')).toBe('+218 91 234 5678');
  });
});

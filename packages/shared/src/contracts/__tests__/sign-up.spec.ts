// Unit test the sign-up field rules: presence, the 100-code-point bound, no
// alphabetic-shape rule, the emoji refusal with its explicit reason, the city
// list's exact-name rule, and the password bounds (FR-001, FR-005, FR-026,
// FR-035, AC-046, AC-005).
import { describe, expect, it } from 'vitest';
import {
  cityNames,
  validateCity,
  validateFullName,
  validatePasswordLength,
  validateShopName,
  validateSignUpValues,
} from '../validation.ts';

const base = {
  fullName: 'محمد الأمين',
  phone: '0912345678',
  password: 'كلمة-سر-طويلة-1',
  city: 'طرابلس',
};

describe('the sign-up value rules', () => {
  it('accepts a complete, valid submission', () => {
    expect(validateSignUpValues(base)).toEqual([]);
  });

  it('refuses an empty or spaces-only full name with reason empty', () => {
    expect(validateFullName('   ')).toEqual([
      { code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'empty' },
    ]);
  });

  it('refuses a full name over 100 code points with reason too_long', () => {
    expect(validateFullName('ا'.repeat(101))).toEqual([
      { code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'too_long' },
    ]);
    expect(validateFullName('ا'.repeat(100))).toEqual([]);
  });

  it('refuses an emoji with reason emoji rather than a length text', () => {
    expect(validateFullName('محمد 🚗')).toEqual([
      { code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'emoji' },
    ]);
    expect(validateShopName('ورشة ✅')).toEqual([
      { code: 'INVALID_SHOP_NAME', field: 'shopName', reason: 'emoji' },
    ]);
  });

  it('applies no alphabetic-shape rule', () => {
    expect(validateFullName('Mohamed 123')).toEqual([]);
  });

  it('does not require shop-name uniqueness', () => {
    const first = validateSignUpValues({ ...base, shopName: 'ورشة النور' });
    const second = validateSignUpValues({ ...base, shopName: 'ورشة النور' });
    expect(first).toEqual([]);
    expect(second).toEqual([]);
  });

  it('accepts only an exact entry of the fixed city list', () => {
    expect(validateCity('طرابلس')).toEqual([]);
    expect(validateCity('طرابلس الغرب')).toEqual([
      { code: 'CITY_NOT_IN_LIST', field: 'city' },
    ]);
    expect(cityNames.size).toBeGreaterThanOrEqual(22);
  });

  it('refuses a phone that is not a listed Libyan mobile number', () => {
    const failures = validateSignUpValues({ ...base, phone: '0212345678' });
    expect(failures).toEqual([{ code: 'INVALID_PHONE', field: 'phone' }]);
  });

  it('reports every value failure at once, in a stable order', () => {
    const failures = validateSignUpValues({
      fullName: ' ',
      phone: '1',
      password: 'short',
      city: 'لا توجد',
      shopName: '🚗',
    });
    expect(failures.map((failure) => failure.code)).toEqual([
      'INVALID_PHONE',
      'INVALID_FULL_NAME',
      'INVALID_SHOP_NAME',
      'CITY_NOT_IN_LIST',
      'PASSWORD_TOO_SHORT',
    ]);
  });

  it('bounds the password at 12 and 128 characters', () => {
    expect(validatePasswordLength('ا'.repeat(11))).toEqual([
      { code: 'PASSWORD_TOO_SHORT', field: 'password' },
    ]);
    expect(validatePasswordLength('ا'.repeat(12))).toEqual([]);
    expect(validatePasswordLength('ا'.repeat(128))).toEqual([]);
    expect(validatePasswordLength('ا'.repeat(129))).toEqual([
      { code: 'PASSWORD_TOO_LONG', field: 'password' },
    ]);
  });
});

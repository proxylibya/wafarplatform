// The value rules of step 4 of the refusal order: one function per field, each
// returning the code and reason the envelope carries, and one collector that
// reports every failure before any account-existence comparison (FR-051).
import {
  codePointLength,
  hasEmoji,
  normalizeCode,
  normalizePhone,
} from '../normalize/index.ts';
import {
  fullNameMaxLength,
  otpLength,
  passwordMaxLength,
  passwordMinLength,
  shopNameMaxLength,
} from '../limits.ts';
import cities from '../reference/libyan-cities.json' with { type: 'json' };
import type { AuthErrorCode, FieldErrorReason } from './auth.ts';

export interface FieldFailure {
  code: AuthErrorCode;
  field: string;
  reason?: FieldErrorReason;
}

/** The fixed list's exact names, as a set the API and the combobox share. */
export const cityNames: ReadonlySet<string> = new Set(cities.entries);

export function validateFullName(value: string): FieldFailure[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [{ code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'empty' }];
  }
  if (codePointLength(trimmed) > fullNameMaxLength) {
    return [{ code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'too_long' }];
  }
  if (hasEmoji(trimmed)) {
    return [{ code: 'INVALID_FULL_NAME', field: 'fullName', reason: 'emoji' }];
  }
  return [];
}

export function validateShopName(value: string | undefined): FieldFailure[] {
  if (value === undefined) return [];
  const trimmed = value.trim();
  if (trimmed.length === 0) return [];
  if (codePointLength(trimmed) > shopNameMaxLength) {
    return [{ code: 'INVALID_SHOP_NAME', field: 'shopName', reason: 'too_long' }];
  }
  if (hasEmoji(trimmed)) {
    return [{ code: 'INVALID_SHOP_NAME', field: 'shopName', reason: 'emoji' }];
  }
  return [];
}

export function validateCity(value: string): FieldFailure[] {
  const trimmed = value.trim();
  if (!cityNames.has(trimmed)) {
    return [{ code: 'CITY_NOT_IN_LIST', field: 'city' }];
  }
  return [];
}

export function validatePhoneValue(value: string): FieldFailure[] {
  if (normalizePhone(value) === null) {
    return [{ code: 'INVALID_PHONE', field: 'phone' }];
  }
  return [];
}

export function validatePasswordLength(value: string): FieldFailure[] {
  const length = codePointLength(value);
  if (length < passwordMinLength) {
    return [{ code: 'PASSWORD_TOO_SHORT', field: 'password' }];
  }
  if (length > passwordMaxLength) {
    return [{ code: 'PASSWORD_TOO_LONG', field: 'password' }];
  }
  return [];
}

export function validateCodeValue(value: string): FieldFailure[] {
  if (normalizeCode(value) === null) {
    return [{ code: 'OTP_EXPIRED', field: 'code' }];
  }
  return [];
}

export interface SignUpValues {
  fullName: string;
  phone: string;
  password: string;
  city: string;
  shopName?: string;
}

/** Step 4 for the sign-up form: every failure, in a stable field order. */
export function validateSignUpValues(values: SignUpValues): FieldFailure[] {
  return [
    ...validatePhoneValue(values.phone),
    ...validateFullName(values.fullName),
    ...validateShopName(values.shopName),
    ...validateCity(values.city),
    ...validatePasswordLength(values.password),
  ];
}

/** Step 4 for sign-in: the format refusal alone; the rest is step 5. */
export function validateSignInValues(values: {
  phone: string;
  password: string;
}): FieldFailure[] {
  const failures = validatePhoneValue(values.phone);
  if (values.password.length === 0) {
    failures.push({ code: 'AUTH_INVALID_CREDENTIALS', field: 'password' });
  }
  return failures;
}

/** Step 4 for the recovery request. */
export function validateRecoveryValues(values: { phone: string }): FieldFailure[] {
  return validatePhoneValue(values.phone);
}

export { otpLength };

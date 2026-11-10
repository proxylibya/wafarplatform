// The four Arabic SMS bodies. Each is right-to-left, Latin-numeral,
// diacritic-free, and emoji-free, and each class is length-bounded in UCS-2 code
// units after `{code}` is replaced by six digits (FR-026, FR-043, AC-028).
import { formatPhoneForDisplay, otpLifetimeMinutes, otpLength } from '@wafar/shared';

export type SmsKind =
  | 'otp_sign_up'
  | 'otp_recovery'
  | 'notice_password_changed'
  | 'notice_signed_out_all';

const lifetime = otpLifetimeMinutes;

export const templateBodies: Record<SmsKind, string> = {
  otp_sign_up: `رمز التحقق في وفر: {code}. صالح ${lifetime} دقائق. لا تشاركه.`,
  otp_recovery: `رمز استعادة كلمة المرور في وفر: {code}. صالح ${lifetime} دقائق. لا تشاركه.`,
  notice_password_changed:
    'تم تغيير كلمة مرور حسابك في وفر، وانتهت كل الجلسات. إن لم تكن أنت، تواصل مع الإدارة.',
  notice_signed_out_all:
    'انتهت جلسات حسابك في وفر من كل الأجهزة. إن لم تكن أنت، غير كلمة المرور.',
};

export const templateBounds: Record<SmsKind, number> = {
  otp_sign_up: 70,
  otp_recovery: 70,
  notice_password_changed: 134,
  notice_signed_out_all: 134,
};

export function renderBody(kind: SmsKind, code?: string): string {
  const body = templateBodies[kind];
  if (body.includes('{code}')) {
    const value = code ?? '0'.repeat(otpLength);
    return body.replace('{code}', value);
  }
  return body;
}

/** UCS-2 code units: what a GSM/UCS-2 SMS segment counts. */
export function codeUnits(value: string): number {
  return value.length;
}

export { formatPhoneForDisplay };

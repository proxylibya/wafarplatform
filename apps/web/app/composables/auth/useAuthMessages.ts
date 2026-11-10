// The single code-to-Arabic mapping of contracts/ui-contracts.md §6. A page
// selects a row by (code, reason) and composes nothing of its own; every numeral
// is a slot filled from packages/shared/src/limits.ts (FR-008, FR-035, AC-009).
import {
  fullNameMaxLength,
  otpLength,
  otpLifetimeMinutes,
  passwordMaxLength,
  passwordMinLength,
  shopNameMaxLength,
  type AuthErrorCode,
  type FieldErrorReason,
} from '@wafar/shared';

export interface MessageInput {
  code: AuthErrorCode;
  reason?: FieldErrorReason;
}

const rows: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
  INVALID_PHONE: 'أدخل رقم هاتف ليبي صحيحا يبدأ بـ +218.',
  'INVALID_FULL_NAME:empty': 'أدخل الاسم الكامل.',
  'INVALID_FULL_NAME:too_long': `الاسم الكامل يتجاوز ${fullNameMaxLength} حرف.`,
  'INVALID_FULL_NAME:emoji': 'الاسم الكامل لا يقبل الرموز التعبيرية.',
  'INVALID_SHOP_NAME:too_long': `اسم المحل يتجاوز ${shopNameMaxLength} حرف.`,
  'INVALID_SHOP_NAME:emoji': 'اسم المحل لا يقبل الرموز التعبيرية.',
  CITY_NOT_IN_LIST: 'اختر مدينة من القائمة.',
  PASSWORD_TOO_SHORT: `كلمة المرور أقصر من ${passwordMinLength} حرفا.`,
  PASSWORD_TOO_LONG: `كلمة المرور تتجاوز ${passwordMaxLength} حرفا.`,
  PASSWORD_TOO_COMMON:
    'كلمة المرور شائعة أو ظهرت في تسريبات سابقة. اختر كلمة أخرى.',
  PASSWORD_UNCHANGED:
    'كلمة المرور الجديدة مطابقة للكلمة الحالية. اختر كلمة مختلفة.',
  RATE_LIMITED: 'تجاوزت الحد المسموح من المحاولات. أعد المحاولة بعد قليل.',
  FORM_TOO_FAST: 'أرسلت النموذج بسرعة أكبر من المعتاد. أعد المحاولة.',
  OTP_INCORRECT: 'الرمز غير صحيح.',
  OTP_EXPIRED: 'انتهت صلاحية الرمز أو أصبح غير صالح. اطلب رمزا جديدا.',
  OTP_REQUEST_ENDED:
    'انتهت محاولات التحقق. أدخل رقمك من جديد لطلب رمز جديد.',
  OTP_RESEND_LIMIT: 'تجاوزت عدد طلبات الرمز المسموح بها. أعد المحاولة بعد قليل.',
  OTP_SEND_FAILED: 'تعذر إرسال الرمز. أعد المحاولة.',
  RECOVERY_EXPIRED: 'انتهت صلاحية الطلب. اطلب رمزا جديدا.',
  ACCOUNT_CREATION_FAILED: 'تعذر إنشاء الحساب. أعد المحاولة.',
  INTERNAL_ERROR: 'حدث خطأ. أعد المحاولة.',
};

/** A refused field's message, by code and — where the code carries one — reason. */
export function messageFor(input: MessageInput): string {
  if (input.reason !== undefined) {
    const keyed = rows[`${input.code}:${input.reason}`];
    if (keyed !== undefined) return keyed;
  }
  return rows[input.code] ?? rows['INTERNAL_ERROR'] ?? 'حدث خطأ. أعد المحاولة.';
}

/** The code step's own notices, the policy statement, and the in-progress labels. */
export const notices = {
  resendAccepted: 'أرسلنا رمزا جديدا. الرمز السابق لم يعد صالحا.',
  signedInAfterVerification: 'حسابك جاهز، وأنت مسجل الدخول الآن.',
  passwordPolicy: `${passwordMinLength} حرفا على الأقل و${passwordMaxLength} حرفا كحد أقصى، وليست من كلمات المرور الشائعة أو المسربة.`,
  expiryHint: `تنتهي صلاحية الرمز بعد ${otpLifetimeMinutes} دقائق.`,
  codeHeading: 'رمز التحقق',
  codeBody: `أرسلنا رمزا من ${otpLength} أرقام برسالة SMS إلى رقمك.`,
  codeLabel: 'رمز التحقق',
  codeHint: `${otpLength} أرقام`,
  verifying: 'يجري التحقق…',
  resending: 'يجري الإرسال…',
  signInProgress: 'يجري تسجيل الدخول…',
  settingProgress: 'يجري الحفظ…',
  requestProgress: 'يجري الإرسال…',
} as const;

/** Every code the bare pages render has a row; the set is closed. */
export const renderedCodes: readonly string[] = Object.keys(rows).filter(
  (key) => !key.includes(':'),
);

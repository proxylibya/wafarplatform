// The public authentication contract: the closed error-code union and the
// request/response schemas of contracts/auth-api.md. The API validates against
// these schemas and the OpenAPI document is generated from them, so the contract
// has one source.
import { z } from 'zod';
import {
  formStampMaxSeconds,
  fullNameMaxLength,
  otpLength,
  otpMaxReRequests,
  passwordMaxLength,
  passwordMinLength,
  shopNameMaxLength,
} from '../limits.ts';

/** The 26 codes of contracts/auth-api.md §3.1 — closed for R1. */
export const authErrorCodes = [
  'CSRF_FAILED',
  'RATE_LIMITED',
  'FORM_TOO_FAST',
  'PAYLOAD_TOO_LARGE',
  'INVALID_PHONE',
  'INVALID_FULL_NAME',
  'INVALID_SHOP_NAME',
  'CITY_NOT_IN_LIST',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_TOO_LONG',
  'PASSWORD_TOO_COMMON',
  'PASSWORD_UNCHANGED',
  'AUTH_INVALID_CREDENTIALS',
  'OTP_INCORRECT',
  'OTP_EXPIRED',
  'OTP_REQUEST_ENDED',
  'OTP_RESEND_LIMIT',
  'OTP_SEND_FAILED',
  'RECOVERY_EXPIRED',
  'SESSION_ENDED',
  'ACCOUNT_BLOCKED',
  'PASSWORD_CHANGE_REQUIRED',
  'ACCOUNT_CREATION_FAILED',
  'INTERNAL_ERROR',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
] as const;

export type AuthErrorCode = (typeof authErrorCodes)[number];
export const authErrorCodeSchema = z.enum(authErrorCodes);

/** The reason that qualifies a field code carrying more than one text. */
export const fieldErrorReasons = ['empty', 'too_long', 'emoji'] as const;
export type FieldErrorReason = (typeof fieldErrorReasons)[number];
export const fieldErrorReasonSchema = z.enum(fieldErrorReasons);

export const errorDetailSchema = z.object({
  code: authErrorCodeSchema,
  field: z.string().min(1).optional(),
  reason: fieldErrorReasonSchema.optional(),
});

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: authErrorCodeSchema,
    retryable: z.boolean(),
    field: z.string().min(1).optional(),
    reason: fieldErrorReasonSchema.optional(),
    retryAfterSeconds: z.number().int().min(0).optional(),
    details: z.array(errorDetailSchema).optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

const fullName = z.string().max(fullNameMaxLength * 4);
const shopName = z.string().max(shopNameMaxLength * 4);

export const signUpRequestSchema = z.object({
  fullName,
  phone: z.string().min(1).max(32),
  password: z.string().max(passwordMaxLength * 4),
  city: z.string().min(1).max(120),
  shopName: shopName.optional(),
  /** The honeypot: must be the empty string. */
  website: z.string().max(200).optional(),
  /** The signed stamp; absent or malformed reaches the guard's refusal. */
  formStamp: z.string().max(1024).default(''),
});
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export const verifyCodeRequestSchema = z.object({
  requestId: z.string().min(1).max(128),
  code: z.string().min(otpLength).max(otpLength * 2),
});
export type VerifyCodeRequest = z.infer<typeof verifyCodeRequestSchema>;

export const resendRequestSchema = z.object({
  requestId: z.string().min(1).max(128),
});
export type ResendRequest = z.infer<typeof resendRequestSchema>;

export const signInRequestSchema = z.object({
  phone: z.string().min(1).max(32),
  password: z.string().max(passwordMaxLength * 4),
});
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  phone: z.string().min(1).max(32),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  requestId: z.string().min(1).max(128),
  newPassword: z.string().max(passwordMaxLength * 4),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const changePasswordRequestSchema = z.object({
  // An empty current password is accepted here and refused by the current-
  // password check, so it is a credential failure rather than a policy failure
  // (FR-013, FR-051).
  currentPassword: z.string().max(passwordMaxLength * 4),
  newPassword: z.string().max(passwordMaxLength * 4),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

/** The render bootstrap's answer. */
export const csrfResponseSchema = z.object({
  csrfToken: z.string().min(1),
  formStamp: z.string().min(1),
});

const isoDateTime = z.string().min(1);

export const signUpAcceptedSchema = z.object({
  requestId: z.string().min(1),
  phone: z.string().min(1),
  codeExpiresAt: isoDateTime,
  expiresAt: isoDateTime,
});

export const verificationStateSchema = z.enum(['pending', 'verified']);
export const verificationPurposeSchema = z.enum(['sign_up', 'recovery']);

export const verificationResumeSchema = z.object({
  requestId: z.string().min(1),
  purpose: verificationPurposeSchema,
  state: verificationStateSchema,
  phone: z.string().min(1),
  codeExpiresAt: isoDateTime,
  expiresAt: isoDateTime,
  remainingReRequests: z.number().int().min(0).max(otpMaxReRequests),
  payload: z
    .object({
      fullName: z.string(),
      city: z.string(),
      shopName: z.string().optional(),
    })
    .optional(),
});
export type VerificationResume = z.infer<typeof verificationResumeSchema>;

export const signUpOutcomeSchema = z.enum([
  'created',
  'existing_account',
  'blocked_account',
  'administrator_account',
]);
export type SignUpOutcome = z.infer<typeof signUpOutcomeSchema>;

export const recoveryVerifyOutcomeSchema = z.enum([
  'verified',
  'no_account',
  'administrator_account',
]);
export type RecoveryVerifyOutcome = z.infer<typeof recoveryVerifyOutcomeSchema>;

export const resendAcceptedSchema = z.object({
  codeExpiresAt: isoDateTime,
  expiresAt: isoDateTime,
  remainingReRequests: z.number().int().min(0).max(otpMaxReRequests),
});

export const signInResponseSchema = z.object({ outcome: z.literal('signed_in') });

export const resetPasswordResponseSchema = z.object({
  outcome: z.enum(['reset', 'reset_blocked']),
});

export const changePasswordResponseSchema = z.object({
  outcome: z.literal('changed'),
});

export const sessionResponseSchema = z.union([
  z.object({ authenticated: z.literal(false) }),
  z.object({
    authenticated: z.literal(true),
    user: z.object({ fullName: z.string() }),
    session: z.object({
      expiresAt: isoDateTime,
      lastActivityAt: isoDateTime,
      restricted: z.boolean(),
    }),
  }),
]);
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['ok', 'error']),
});

/** The request schemas the OpenAPI document publishes, keyed by route id. */
export const requestSchemas = {
  signUpRequest: signUpRequestSchema,
  verifyCodeRequest: verifyCodeRequestSchema,
  resendRequest: resendRequestSchema,
  signInRequest: signInRequestSchema,
  forgotPasswordRequest: forgotPasswordRequestSchema,
  resetPasswordRequest: resetPasswordRequestSchema,
  changePasswordRequest: changePasswordRequestSchema,
} as const;

export { formStampMaxSeconds, otpLength, passwordMinLength, passwordMaxLength };

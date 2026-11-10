// The slice's numeric limits, each annotated with its Constitution Mandated
// Values row. This module is the one source the Zod schemas, the API, the copy
// templates, and the pages read; no message carries a typed number (FR-026).

/** CMV 17 — password policy. */
export const passwordMinLength = 12;
export const passwordMaxLength = 128;

/** CMV 19 — profile field maximum lengths, counted in code points. */
export const fullNameMaxLength = 100;
export const shopNameMaxLength = 100;

/** CMV 18 — one-time code. */
export const otpLength = 6;
export const otpLifetimeMinutes = 5;
export const otpLifetimeSeconds = otpLifetimeMinutes * 60;
export const otpMaxIncorrectEntries = 5;
export const otpMaxReRequests = 3;

/** CMV 3 — rate limits, 15-minute fixed windows. */
export const rateLimitWindowMinutes = 15;
export const rateLimitWindowSeconds = rateLimitWindowMinutes * 60;
export const accountCreationPerOrigin = 20;
export const accountCreationPerNumber = 3;
export const signInPerOrigin = 60;
export const signInPerNumber = 20;
export const recoveryPerOrigin = 20;
export const recoveryPerNumber = 3;

/** CMV 3 — minimum time-to-submit and the form stamp's validity window. */
export const formStampMinSeconds = 3;
export const formStampMaxMinutes = 30;
export const formStampMaxSeconds = formStampMaxMinutes * 60;

/** CMV 4 — session clocks. */
export const sessionInactivityMinutes = 30;
export const sessionInactivitySeconds = sessionInactivityMinutes * 60;
export const sessionAbsoluteHours = 12;
export const sessionAbsoluteSeconds = sessionAbsoluteHours * 60 * 60;
export const sessionTokenBytes = 32;

/** CMV 9 — the pending cookie and the CSRF cookie. */
export const pendingTokenBytes = 32;
export const csrfTokenBytes = 32;

/** CMV 2 — scrypt profile. */
export const scryptN = 32768;
export const scryptR = 8;
export const scryptP = 3;
export const scryptKeyLength = 64;
export const scryptSaltBytes = 16;
export const scryptPrefix = '$wafar$scrypt$';

/** CMV 9 — wrong-password lock. */
export const lockAfterFailures = 5;
export const lockMinutes = 15;

/** CMV 3 — the body guard. */
export const maxBodyBytes = 16 * 1024;

/** CMV 13 — the messaging provider's acceptance timeout. */
export const smsTimeoutMs = 750;

/** The fake transport's acceptance duration bound (plan, Technical Context). */
export const smsFakeMaxAcceptMs = 750;

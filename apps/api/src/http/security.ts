// The transport guards: the CSRF cookie pair and origin allowlist, the signed
// form stamp, and the security headers with a per-response nonce (FR-044,
// FR-046, FR-029).
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import {
  csrfTokenBytes,
  formStampMaxSeconds,
  formStampMinSeconds,
} from '@wafar/shared';

export const CSRF_COOKIE = 'wafar.csrf';
export const CSRF_HEADER = 'x-wafar-csrf';

export function issueCsrfToken(): string {
  return randomBytes(csrfTokenBytes).toString('base64url');
}

export function issueFormStamp(secret: string, now: Date): string {
  const payload = Buffer.from(
    JSON.stringify({ t: Math.floor(now.getTime() / 1000), d: 'sign_up_form' }),
  ).toString('base64url');
  const signature = createHmac('sha256', `${secret}:form_stamp`)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export type FormStampResult =
  | { ok: true; issuedAt: Date }
  | { ok: false; reason: 'malformed' | 'forged' | 'too_young' | 'too_old' | 'wrong_destination' };

export function verifyFormStamp(
  secret: string,
  stamp: string,
  now: Date,
  destination = 'sign_up_form',
): FormStampResult {
  const [payload, signature] = stamp.split('.');
  if (payload === undefined || signature === undefined) {
    return { ok: false, reason: 'malformed' };
  }
  const expected = createHmac('sha256', `${secret}:form_stamp`)
    .update(payload)
    .digest('base64url');
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return { ok: false, reason: 'forged' };
  }

  let parsed: { t?: number; d?: string };
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      t?: number;
      d?: string;
    };
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (parsed.d !== destination) return { ok: false, reason: 'wrong_destination' };
  if (typeof parsed.t !== 'number') return { ok: false, reason: 'malformed' };

  const ageSeconds = Math.floor(now.getTime() / 1000) - parsed.t;
  if (ageSeconds < formStampMinSeconds) return { ok: false, reason: 'too_young' };
  if (ageSeconds > formStampMaxSeconds) return { ok: false, reason: 'too_old' };
  return { ok: true, issuedAt: new Date(parsed.t * 1000) };
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export interface SecurityOptions {
  secret: string;
  webOrigin: string;
  production: boolean;
}

/**
 * The CSRF pair's comparison: both values are base64url tokens compared with
 * `crypto.timingSafeEqual`, and a length mismatch is a failure (FR-044).
 */
export function csrfPairMatches(
  cookieHeader: string | undefined,
  header: string | undefined,
): boolean {
  const cookie = readCookie(cookieHeader, CSRF_COOKIE);
  if (cookie === null || header === undefined || header === '') return false;
  const left = Buffer.from(cookie, 'base64url');
  const right = Buffer.from(header, 'base64url');
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * §2.3's guard: the activity signal is honoured only with the CSRF pair and an
 * allowlisted origin. A same-origin GET carries no Origin in a browser, so the
 * token is its same-origin proof; a present but unlisted origin refuses the
 * signal, and the request itself still proceeds unchanged (FR-032).
 */
export function activitySignalHonoured(input: {
  cookieHeader: string | undefined;
  csrfHeader: string | undefined;
  origin: string | undefined;
  webOrigin: string;
}): boolean {
  if (input.origin !== undefined && input.origin !== input.webOrigin) return false;
  return csrfPairMatches(input.cookieHeader, input.csrfHeader);
}

/** The nonce and header middleware; it runs before every route. */
export function securityHeaders(options: SecurityOptions): MiddlewareHandler {
  return async (c, next) => {
    const nonce = randomBytes(16).toString('base64url');
    c.set('nonce', nonce);
    const policy = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');
    c.header('Content-Security-Policy', policy);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    c.header('Cache-Control', 'no-store');
    if (options.production) {
      c.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    await next();
  };
}

/** The CSRF pair guard for every mutation. */
export function csrfGuard(options: SecurityOptions): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === 'GET' || c.req.method === 'HEAD') {
      await next();
      return;
    }
    // An absent, malformed, or unlisted origin is refused exactly as an
    // unlisted one is: only the allowlisted site may mutate (FR-044).
    const origin = c.req.header('origin');
    if (origin === undefined || origin !== options.webOrigin) {
      return c.json(
        { error: { code: 'CSRF_FAILED', retryable: false } },
        403 as 400,
      );
    }
    const header = c.req.header(CSRF_HEADER);
    if (!csrfPairMatches(c.req.header('cookie'), header)) {
      return c.json(
        { error: { code: 'CSRF_FAILED', retryable: false } },
        403 as 400,
      );
    }
    await next();
  };
}

export function csrfCookie(token: string, production: boolean): string {
  const parts = [
    `${CSRF_COOKIE}=${token}`,
    'Path=/',
    'SameSite=Lax',
    'Max-Age=43200',
  ];
  if (production) parts.push('Secure');
  return parts.join('; ');
}

export { issueCsrfToken as issueToken };

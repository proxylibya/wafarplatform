// The dependency container every route receives: one database client, one SMS
// port, one logger, and one clock, so a test can substitute any of them.
import type { Database } from '@wafar/db';
import type { SecurityEventPort } from '@wafar/shared';
import type { AuthEngine } from '../modules/auth/engine.ts';
import type { SmsTransport } from '../modules/auth/sms/port.ts';
import type { Env } from '../env.ts';
import type { Logger } from '../observability/logger.ts';

export interface AppDependencies {
  db: Database;
  /** The one better-auth engine the services call (ADR-151). */
  auth: AuthEngine;
  env: Env;
  sms: SmsTransport;
  logger: Logger;
  events: SecurityEventPort;
  now: () => Date;
  /** The contract's trusted-proxy allowlist; an empty list trusts no header. */
  trustedProxies: string[];
}

export interface AppEnv {
  Variables: {
    nonce: string;
    requestId: string;
  };
}

export const PENDING_COOKIE = 'wafar.pending';
/** The pending cookie's scoped path, so it never travels to a page route. */
export const PENDING_COOKIE_PATH = '/api/v1/auth';

export function pendingCookie(value: string, production: boolean, maxAge = 300): string {
  const parts = [
    `${PENDING_COOKIE}=${encodeURIComponent(value)}`,
    `Path=${PENDING_COOKIE_PATH}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (production) parts.push('Secure');
  return parts.join('; ');
}

export function sessionCookie(value: string, production: boolean, maxAge = 43200): string {
  const parts = [
    `wafar.session=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (production) parts.push('Secure');
  return parts.join('; ');
}

export function clearedCookie(name: string, production: boolean, path = '/'): string {
  const parts = [`${name}=`, `Path=${path}`, 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (production) parts.push('Secure');
  return parts.join('; ');
}

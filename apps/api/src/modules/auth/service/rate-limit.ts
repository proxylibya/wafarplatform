// The two-key fixed-window rate limiter: an origin key and a number key per
// operation, an atomic increment, and `Retry-After` in seconds (FR-033).
import { and, eq, sql } from 'drizzle-orm';
import {
  accountCreationPerNumber,
  accountCreationPerOrigin,
  rateLimitWindowSeconds,
  recoveryPerNumber,
  recoveryPerOrigin,
  signInPerNumber,
  signInPerOrigin,
} from '@wafar/shared';
import { rateLimitCounters, type Database } from '@wafar/db';

export type Operation = 'account_creation' | 'sign_in' | 'recovery';

export interface Budget {
  perOrigin: number;
  perNumber: number;
}

export const budgets: Record<Operation, Budget> = {
  account_creation: { perOrigin: accountCreationPerOrigin, perNumber: accountCreationPerNumber },
  sign_in: { perOrigin: signInPerOrigin, perNumber: signInPerNumber },
  recovery: { perOrigin: recoveryPerOrigin, perNumber: recoveryPerNumber },
};

export interface CounterKey {
  origin: string;
  phoneNumber: string | null;
}

export interface LimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function windowStart(now: Date): Date {
  const step = rateLimitWindowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / step) * step);
}

async function increment(
  db: Database,
  key: string,
  start: Date,
): Promise<number> {
  const expiresAt = new Date(start.getTime() + rateLimitWindowSeconds * 1000);
  const rows = await db
    .insert(rateLimitCounters)
    .values({ key, windowStart: start, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: [rateLimitCounters.key, rateLimitCounters.windowStart],
      set: { count: sql`${rateLimitCounters.count} + 1` },
    })
    .returning({ count: rateLimitCounters.count });
  return rows[0]?.count ?? 1;
}

/** Spends both keys of one operation and reports the decision. */
export async function spend(
  db: Database,
  operation: Operation,
  counter: CounterKey,
  now: Date,
): Promise<LimitDecision> {
  const start = windowStart(now);
  const budget = budgets[operation];
  const originKey = `${operation}:origin:${counter.origin}`;
  const originCount = await increment(db, originKey, start);
  let numberCount = 0;
  if (counter.phoneNumber !== null) {
    numberCount = await increment(
      db,
      `${operation}:number:${counter.phoneNumber}`,
      start,
    );
  }
  const allowed =
    originCount <= budget.perOrigin && numberCount <= budget.perNumber;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((start.getTime() + rateLimitWindowSeconds * 1000 - now.getTime()) / 1000),
  );
  return { allowed, retryAfterSeconds };
}

/** Reads the current count without spending (used by the limiter probe). */
export async function readCount(
  db: Database,
  operation: Operation,
  kind: 'origin' | 'number',
  value: string,
  now: Date,
): Promise<number> {
  const key = `${operation}:${kind}:${value}`;
  const start = windowStart(now);
  const rows = await db
    .select({ count: rateLimitCounters.count })
    .from(rateLimitCounters)
    .where(
      and(eq(rateLimitCounters.key, key), eq(rateLimitCounters.windowStart, start)),
    );
  return rows[0]?.count ?? 0;
}

/**
 * The origin of contracts/auth-api.md §2.5: the listed proxy's X-Real-IP,
 * otherwise the peer address. A peer outside the allowlist cannot choose its key.
 */
export function originFrom(input: {
  xRealIp: string | undefined;
  peer: string | undefined;
  trustedProxies: readonly string[];
}): string {
  const peer = input.peer;
  if (peer !== undefined && input.trustedProxies.includes(peer)) {
    const claimed = input.xRealIp?.trim();
    if (claimed !== undefined && claimed !== '') return claimed;
  }
  return peer ?? 'unknown';
}

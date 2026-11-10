// The resume read and the resend: the shared endpoint both the sign-up and the
// recovery flow bind, authenticated by the pending cookie alone (FR-038,
// FR-034, contracts/auth-api.md §5.3.1, §5.4).
import { timingSafeEqual } from 'node:crypto';
import type { Hono } from 'hono';
import {
  otpMaxReRequests,
  resendRequestSchema,
} from '@wafar/shared';
import { refuse } from '../../../http/errors.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { pendingCookie, clearedCookie, PENDING_COOKIE } from '../../../http/deps.ts';
import { readCookie } from '../../../http/security.ts';
import { createPhoneVerificationsRepository } from '../../users/repository/phone-verifications.ts';
import { createPendingRequestService } from '../../users/service/pending-request.ts';
import { hashResumeToken } from '../service/password-policy.ts';
import type { PendingRow } from '../../users/repository/phone-verifications.ts';

export interface PendingLookup {
  row: PendingRow | null;
  token: string | null;
}

/**
 * The page's tie to a pending request, presented on a submission only while the
 * code step is still its own (FR-038, contracts/auth-api.md §2.2). The control
 * that returns to the first step drops it, so the next submission is fresh.
 */
export const PENDING_TIE_HEADER = 'x-wafar-pending';

export function pageStillTied(header: string | undefined, requestId: string): boolean {
  return header === requestId;
}

/** Reads `<id>.<token>` from the pending cookie and verifies its hash. */
export async function readPending(
  dependencies: AppDependencies,
  cookieHeader: string | undefined,
  requestId?: string,
): Promise<PendingLookup> {
  const raw = readCookie(cookieHeader, PENDING_COOKIE);
  if (raw === null) return { row: null, token: null };
  const separator = raw.indexOf('.');
  if (separator < 1) return { row: null, token: null };
  const id = raw.slice(0, separator);
  const token = raw.slice(separator + 1);
  if (requestId !== undefined && requestId !== id) return { row: null, token: null };

  const store = createPhoneVerificationsRepository(dependencies.db);
  const row = await store.findById(id);
  if (row === null) return { row: null, token: null };

  const expected = Buffer.from(row.resumeTokenHash, 'hex');
  const given = Buffer.from(hashResumeToken(token), 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { row: null, token: null };
  }
  return { row, token };
}

export function registerVerificationRoutes(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  app.get('/api/v1/auth/verifications/:requestId', async (c) => {
    const now = dependencies.now();
    const { row } = await readPending(
      dependencies,
      c.req.header('cookie'),
      c.req.param('requestId'),
    );
    if (row === null) return refuse(c, 'OTP_EXPIRED');
    if (row.requestExpiresAt.getTime() <= now.getTime()) {
      return refuse(c, 'OTP_EXPIRED');
    }

    const body: Record<string, unknown> = {
      requestId: row.id,
      purpose: row.purpose,
      state: row.state,
      phone: row.phoneNumber,
      codeExpiresAt: row.codeExpiresAt.toISOString(),
      expiresAt: row.requestExpiresAt.toISOString(),
      remainingReRequests: Math.max(0, otpMaxReRequests - row.reRequests),
    };
    if (row.purpose === 'sign_up') {
      body['payload'] = {
        fullName: row.fullName ?? '',
        city: row.city ?? '',
        ...(row.shopName === null ? {} : { shopName: row.shopName }),
      };
    }
    return c.json(body, 200);
  });

  app.post('/api/v1/auth/verifications/resend', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'OTP_EXPIRED');
    }
    const parsed = resendRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'OTP_EXPIRED');

    const { row } = await readPending(
      dependencies,
      c.req.header('cookie'),
      parsed.data.requestId,
    );
    if (row === null) return refuse(c, 'OTP_EXPIRED');
    if (row.requestExpiresAt.getTime() <= now.getTime()) {
      return refuse(c, 'OTP_EXPIRED');
    }

    const store = createPhoneVerificationsRepository(dependencies.db);
    const service = createPendingRequestService(store, dependencies.sms);
    const result = await service.resend(row, now);
    if (result.status === 'expired') return refuse(c, 'OTP_EXPIRED');
    if (result.status === 'limit') {
      // The remaining time to the pending request's boundary is the same
      // machine-readable value the page shows (FR-034, AC-036).
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((row.requestExpiresAt.getTime() - now.getTime()) / 1000),
      );
      return refuse(c, 'OTP_RESEND_LIMIT', { retryAfterSeconds });
    }
    if (result.status === 'send_failed') {
      dependencies.events.emit({
        event: 'auth.otp.dispatch_failed',
        outcome: 'failure',
        requestId: c.get('requestId'),
        kind: row.purpose,
        channel: dependencies.env.SMS_TRANSPORT,
      });
      return refuse(c, 'OTP_SEND_FAILED');
    }

    const token = readCookie(c.req.header('cookie'), PENDING_COOKIE) ?? '';
    c.header(
      'Set-Cookie',
      pendingCookie(token, dependencies.env.NODE_ENV === 'production'),
    );
    return c.json(
      {
        codeExpiresAt: result.row.codeExpiresAt.toISOString(),
        expiresAt: result.row.requestExpiresAt.toISOString(),
        remainingReRequests: Math.max(0, otpMaxReRequests - result.row.reRequests),
      },
      202,
    );
  });
}

export { clearedCookie };

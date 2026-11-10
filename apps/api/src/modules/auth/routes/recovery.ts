// The recovery routes: the request, the code's verification, and the new
// password. The response never reveals whether the number has an account
// (FR-014, FR-015, FR-034).
import type { Hono } from 'hono';
import {
  forgotPasswordRequestSchema,
  normalizeCode,
  normalizePhone,
  resetPasswordRequestSchema,
  validateRecoveryValues,
  verifyCodeRequestSchema,
} from '@wafar/shared';
import { refuse, refuseDetails } from '../../../http/errors.ts';
import {
  clearedCookie,
  pendingCookie,
  PENDING_COOKIE,
  PENDING_COOKIE_PATH,
} from '../../../http/deps.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { originFrom, spend } from '../service/rate-limit.ts';
import { createPhoneVerificationsRepository } from '../../users/repository/phone-verifications.ts';
import { createPendingRequestService } from '../../users/service/pending-request.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { createRecoveryService } from '../service/recovery.ts';
import { dispatchNotice } from '../service/notices.ts';
import { pageStillTied, PENDING_TIE_HEADER, readPending } from './verifications.ts';
import { peerOf } from './sign-up.ts';

export function registerRecoveryRoutes(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  const production = () => dependencies.env.NODE_ENV === 'production';

  app.post('/api/v1/auth/password/forgot', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'INVALID_PHONE', { field: 'phone' });
    }
    const parsed = forgotPasswordRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'INVALID_PHONE', { field: 'phone' });

    const normalized = normalizePhone(parsed.data.phone);
    const origin = originFrom({
      xRealIp: c.req.header('x-real-ip'),
      peer: peerOf(c),
      trustedProxies: dependencies.trustedProxies,
    });

    // Step 1: the recovery budget, both keys.
    const limit = await spend(
      dependencies.db,
      'recovery',
      { origin, phoneNumber: normalized?.e164 ?? null },
      now,
    );
    if (!limit.allowed) {
      return refuse(c, 'RATE_LIMITED', {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    // Step 4: the format refusal.
    const failures = validateRecoveryValues({ phone: parsed.data.phone });
    if (failures.length > 0) return refuseDetails(c, failures);
    if (normalized === null) return refuse(c, 'INVALID_PHONE', { field: 'phone' });

    // A repeat of the submission the page is still tied to re-renders the code
    // step without a second dispatch or a spent allowance (FR-034, AC-036). A
    // verified request is not re-rendered: a new submission starts a new
    // request, and its accepted dispatch replaces the verified row, ending the
    // verified state and withdrawing its authority to set a password (AC-016).
    const pending = await readPending(dependencies, c.req.header('cookie'));
    if (
      pending.row !== null &&
      pending.row.purpose === 'recovery' &&
      pending.row.state === 'pending' &&
      pending.row.phoneNumber === normalized.e164 &&
      pending.row.requestExpiresAt.getTime() > now.getTime() &&
      pageStillTied(c.req.header(PENDING_TIE_HEADER), pending.row.id)
    ) {
      c.header(
        'Set-Cookie',
        pendingCookie(
          `${pending.row.id}.${pending.token ?? ''}`,
          production(),
        ),
      );
      return c.json(
        {
          requestId: pending.row.id,
          phone: pending.row.phoneNumber,
          codeExpiresAt: pending.row.codeExpiresAt.toISOString(),
          expiresAt: pending.row.requestExpiresAt.toISOString(),
        },
        202,
      );
    }

    const store = createPhoneVerificationsRepository(dependencies.db);
    const service = createPendingRequestService(store, dependencies.sms);
    const started = await service.start({
      phoneNumber: normalized.e164,
      purpose: 'recovery',
      now,
    });

    if (started.status === 'send_failed') {
      dependencies.events.emit({
        event: 'auth.otp.dispatch_failed',
        outcome: 'failure',
        requestId: c.get('requestId'),
        kind: 'recovery',
        channel: dependencies.env.SMS_TRANSPORT,
      });
      return refuse(c, 'OTP_SEND_FAILED');
    }

    c.header(
      'Set-Cookie',
      pendingCookie(
        `${started.row.id}.${started.resumeToken}`,
        production(),
      ),
    );
    return c.json(
      {
        requestId: started.row.id,
        phone: started.row.phoneNumber,
        codeExpiresAt: started.row.codeExpiresAt.toISOString(),
        expiresAt: started.row.requestExpiresAt.toISOString(),
      },
      202,
    );
  });

  app.post('/api/v1/auth/password/forgot/verify', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'OTP_EXPIRED');
    }
    const parsed = verifyCodeRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'OTP_EXPIRED');

    const { row } = await readPending(
      dependencies,
      c.req.header('cookie'),
      parsed.data.requestId,
    );
    if (row === null) return refuse(c, 'OTP_EXPIRED');

    const code = normalizeCode(parsed.data.code);
    if (code === null) return refuse(c, 'OTP_INCORRECT');

    const store = createPhoneVerificationsRepository(dependencies.db);
    const service = createPendingRequestService(store, dependencies.sms);
    const consumed = await service.consume(row, code, now);
    if (consumed.status === 'expired') return refuse(c, 'OTP_EXPIRED');
    if (consumed.status === 'incorrect') return refuse(c, 'OTP_INCORRECT');
    if (consumed.status === 'ended') return refuse(c, 'OTP_REQUEST_ENDED');
    if (consumed.status === 'correct') return refuse(c, 'OTP_EXPIRED');

    // The role decides before the status: a blocked administrator is an
    // administrator account (FR-027).
    const account = await createUsersRepository(dependencies.db).findByPhone(
      row.phoneNumber,
    );
    if (account === null) {
      await store.deleteById(row.id);
      return c.json({ outcome: 'no_account' }, 200);
    }
    if (account.role === 'administrator') {
      await store.deleteById(row.id);
      return c.json({ outcome: 'administrator_account' }, 200);
    }
    return c.json({ outcome: 'verified' }, 200);
  });

  app.post('/api/v1/auth/password/reset', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'RECOVERY_EXPIRED');
    }
    const parsed = resetPasswordRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'RECOVERY_EXPIRED');

    const { row } = await readPending(
      dependencies,
      c.req.header('cookie'),
      parsed.data.requestId,
    );
    if (row === null || row.state !== 'verified') {
      return refuse(c, 'RECOVERY_EXPIRED');
    }
    if (row.requestExpiresAt.getTime() <= now.getTime()) {
      return refuse(c, 'RECOVERY_EXPIRED');
    }

    const result = await createRecoveryService(
      dependencies.db,
      dependencies.auth,
    ).reset({
      row,
      newPassword: parsed.data.newPassword,
      now,
      requestId: c.get('requestId'),
      events: dependencies.events,
    });

    if (result.status === 'refused') return refuse(c, result.code);

    const account = await createUsersRepository(dependencies.db).findByPhone(
      row.phoneNumber,
    );
    if (account !== null) {
      await dispatchNotice(dependencies.sms, {
        to: account.phoneNumber,
        kind: 'password_changed',
        now,
        requestId: c.get('requestId'),
        events: dependencies.events,
      });
    }
    c.header('Set-Cookie', clearedCookie(PENDING_COOKIE, production(), PENDING_COOKIE_PATH));
    return c.json(
      { outcome: result.blocked ? 'reset_blocked' : 'reset' },
      200,
    );
  });
}

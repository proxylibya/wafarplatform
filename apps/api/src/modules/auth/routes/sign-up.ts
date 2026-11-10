// The `POST /api/v1/auth/sign-up` route: the value rules, the honeypot's silent success,
// the minimum time-to-submit, the accepted dispatch, and the response that is
// identical whether or not the number has an account (FR-001 â€¦ FR-006, FR-029).
import { randomBytes, randomUUID } from 'node:crypto';
import type { Hono } from 'hono';
import {
  normalizePhone,
  otpLifetimeSeconds,
  signUpRequestSchema,
  validateSignUpValues,
} from '@wafar/shared';
import { refuse, refuseDetails } from '../../../http/errors.ts';
import { originFrom, spend } from '../service/rate-limit.ts';
import { inspectForm } from '../service/form-guard.ts';
import { checkPasswordPolicy } from '../service/password-policy.ts';
import { createPhoneVerificationsRepository } from '../../users/repository/phone-verifications.ts';
import { createPendingRequestService, discardedPreDispatch } from '../../users/service/pending-request.ts';
import { pendingCookie } from '../../../http/deps.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { pageStillTied, PENDING_TIE_HEADER, readPending } from './verifications.ts';

export function registerSignUpRoute(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  app.post('/api/v1/auth/sign-up', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'INTERNAL_ERROR');
    }
    const parsed = signUpRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'INTERNAL_ERROR');
    const input = parsed.data;

    const normalized = normalizePhone(input.phone);
    const origin = originFrom({
      xRealIp: c.req.header('x-real-ip'),
      peer: peerOf(c),
      trustedProxies: dependencies.trustedProxies,
    });

    // Step 1: the operation's budget, spent before anything else.
    const limit = await spend(
      dependencies.db,
      'account_creation',
      { origin, phoneNumber: normalized?.e164 ?? null },
      now,
    );
    if (!limit.allowed) {
      return refuse(c, 'RATE_LIMITED', {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    // Step 2: the honeypot's silent success, with an unstored request. The same
    // pre-dispatch work runs on a discarded copy and the refusal waits the
    // channel's current acceptance duration, so it is not observably faster
    // (FR-029, AC-031; plan record 15).
    if (input.website !== undefined && input.website !== '') {
      await dependencies.auth.hashPassword(input.password).catch(() => undefined);
      await discardedPreDispatch();
      const wait = dependencies.sms.acceptanceEstimateMs();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const requestId = randomUUID();
      const token = randomBytes(32).toString('base64url');
      c.header(
        'Set-Cookie',
        pendingCookie(
          `${requestId}.${token}`,
          dependencies.env.NODE_ENV === 'production',
        ),
      );
      const issued = now.getTime() + otpLifetimeSeconds * 1000;
      return c.json(
        {
          requestId,
          phone: normalized?.e164 ?? '',
          codeExpiresAt: new Date(issued).toISOString(),
          expiresAt: new Date(issued).toISOString(),
        },
        202,
      );
    }

    // Step 3: the minimum time-to-submit, from the signed stamp.
    const guard = inspectForm({
      website: input.website,
      formStamp: input.formStamp,
      secret: dependencies.env.BETTER_AUTH_SECRET,
      now,
    });
    if (guard.kind === 'too_fast') {
      return refuse(c, 'FORM_TOO_FAST', { field: 'formStamp' });
    }

    // Step 4: the value rules, before any account-existence comparison.
    const failures = validateSignUpValues({
      fullName: input.fullName,
      phone: input.phone,
      password: input.password,
      city: input.city,
      ...(input.shopName === undefined ? {} : { shopName: input.shopName }),
    });
    if (failures.length > 0) return refuseDetails(c, failures);

    if (normalized === null) return refuse(c, 'INVALID_PHONE', { field: 'phone' });

    // Step 4 continued: the password policy's common-or-breached limb. It sits
    // before the pending read and any account-existence comparison, so the
    // refusal is the same whether or not the number has an account (FR-035).
    const policy = checkPasswordPolicy(input.password);
    if (policy !== null) return refuse(c, policy, { field: 'password' });

    // A repeat of the submission the page is still tied to re-renders the code
    // step: the live request is answered as it stands, no second code is sent,
    // the code already sent stays valid, and no allowance is spent (FR-034,
    // AC-036).
    const pending = await readPending(dependencies, c.req.header('cookie'));
    if (
      pending.row !== null &&
      pending.row.purpose === 'sign_up' &&
      pending.row.phoneNumber === normalized.e164 &&
      pending.row.requestExpiresAt.getTime() > now.getTime() &&
      pageStillTied(c.req.header(PENDING_TIE_HEADER), pending.row.id)
    ) {
      c.header(
        'Set-Cookie',
        pendingCookie(
          `${pending.row.id}.${pending.token ?? ''}`,
          dependencies.env.NODE_ENV === 'production',
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

    const passwordHash = await dependencies.auth.hashPassword(input.password);
    const store = createPhoneVerificationsRepository(dependencies.db);
    const service = createPendingRequestService(store, dependencies.sms);
    const started = await service.start({
      phoneNumber: normalized.e164,
      purpose: 'sign_up',
      fullName: input.fullName.trim(),
      city: input.city.trim(),
      ...(input.shopName === undefined || input.shopName.trim() === ''
        ? {}
        : { shopName: input.shopName.trim() }),
      passwordHash,
      now,
    });

    if (started.status === 'send_failed') {
      dependencies.events.emit({
        event: 'auth.otp.dispatch_failed',
        outcome: 'failure',
        requestId: c.get('requestId'),
        kind: 'sign_up',
        channel: dependencies.env.SMS_TRANSPORT,
      });
      return refuse(c, 'OTP_SEND_FAILED');
    }

    c.header(
      'Set-Cookie',
      pendingCookie(
        `${started.row.id}.${started.resumeToken}`,
        dependencies.env.NODE_ENV === 'production',
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
}

/** The peer's address, when the adapter exposes one. */
export function peerOf(c: { env?: unknown }): string | undefined {
  const environment = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
  return environment?.incoming?.socket?.remoteAddress;
}

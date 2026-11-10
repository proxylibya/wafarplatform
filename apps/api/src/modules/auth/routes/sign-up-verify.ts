// The `POST /api/v1/auth/sign-up/verify` route: the four outcomes, and the one
// transaction that creates the account and its session (FR-006, FR-031).
import type { Hono } from 'hono';
import { normalizeCode, verifyCodeRequestSchema } from '@wafar/shared';
import { refuse } from '../../../http/errors.ts';
import {
  clearedCookie,
  sessionCookie,
  PENDING_COOKIE,
  PENDING_COOKIE_PATH,
} from '../../../http/deps.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { readPending } from './verifications.ts';
import { createPhoneVerificationsRepository } from '../../users/repository/phone-verifications.ts';
import { createPendingRequestService } from '../../users/service/pending-request.ts';
import { createAccount } from '../service/account-creation.ts';

export function registerSignUpVerifyRoute(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  app.post('/api/v1/auth/sign-up/verify', async (c) => {
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
    // The route consumes only its own flow's row: a recovery code presented at
    // the sign-up step is refused before the code is compared, so it can never
    // mark the recovery row verified (FR-027).
    if (row.purpose !== 'sign_up') return refuse(c, 'OTP_EXPIRED');

    const code = normalizeCode(parsed.data.code);
    if (code === null) return refuse(c, 'OTP_INCORRECT');
    const userAgent = c.req.header('user-agent');
    const peerAddress = c.req.header('x-forwarded-for');

    const store = createPhoneVerificationsRepository(dependencies.db);
    const service = createPendingRequestService(store, dependencies.sms);
    const consumed = await service.consume(row, code, now);
    if (consumed.status === 'expired') return refuse(c, 'OTP_EXPIRED');
    if (consumed.status === 'incorrect') return refuse(c, 'OTP_INCORRECT');
    if (consumed.status === 'ended') return refuse(c, 'OTP_REQUEST_ENDED');
    if (consumed.status === 'verified') return refuse(c, 'OTP_EXPIRED');

    const created = await createAccount(dependencies.db, dependencies.auth, {
      row,
      now,
      requestId: c.get('requestId'),
      events: dependencies.events,
      ...(peerAddress === undefined ? {} : { ipAddress: peerAddress }),
      ...(userAgent === undefined ? {} : { userAgent }),
    }).catch(() => null);

    if (created === null) return refuse(c, 'ACCOUNT_CREATION_FAILED');

    const production = dependencies.env.NODE_ENV === 'production';
    if (created.outcome === 'created') {
      c.header('Set-Cookie', sessionCookie(created.token, production));
      c.header('Set-Cookie', clearedCookie(PENDING_COOKIE, production, PENDING_COOKIE_PATH), {
        append: true,
      });
      return c.json({ outcome: 'created' }, 200);
    }

    c.header('Set-Cookie', clearedCookie(PENDING_COOKIE, production, PENDING_COOKIE_PATH));
    return c.json({ outcome: created.outcome }, 200);
  });
}

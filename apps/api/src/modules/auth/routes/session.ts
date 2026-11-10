// The session routes: sign-in, sign-out, sign-out everywhere, and the session
// read. Every credential check, session issuance, and revocation is the `auth`
// engine's (FR-007, FR-010, FR-011, FR-032, contracts/auth-api.md §5.5–§5.7,
// §5.12; ADR-151).
import type { Hono } from 'hono';
import { normalizePhone, signInRequestSchema } from '@wafar/shared';
import { refuse } from '../../../http/errors.ts';
import {
  clearedCookie,
  sessionCookie,
} from '../../../http/deps.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { activitySignalHonoured, readCookie } from '../../../http/security.ts';
import { authenticate, SESSION_COOKIE } from '../../../http/context.ts';
import { createSignInService } from '../service/sign-in.ts';
import { isExpired, isInactive } from '../service/sessions.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { dispatchNotice } from '../service/notices.ts';
import { originFrom, spend } from '../service/rate-limit.ts';
import { peerOf } from './sign-up.ts';

export function registerSessionRoutes(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  const auth = dependencies.auth;
  const production = () => dependencies.env.NODE_ENV === 'production';

  app.post('/api/v1/auth/sign-in', async (c) => {
    const now = dependencies.now();
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'AUTH_INVALID_CREDENTIALS');
    }
    const parsed = signInRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'AUTH_INVALID_CREDENTIALS');

    const normalized = normalizePhone(parsed.data.phone);
    const userAgent = c.req.header('user-agent');
    const origin = originFrom({
      xRealIp: c.req.header('x-real-ip'),
      peer: peerOf(c),
      trustedProxies: dependencies.trustedProxies,
    });

    // Step 1: the sign-in budget, both keys.
    const limit = await spend(
      dependencies.db,
      'sign_in',
      { origin, phoneNumber: normalized?.e164 ?? null },
      now,
    );
    if (!limit.allowed) {
      return refuse(c, 'RATE_LIMITED', {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    // Step 4: the format refusal alone.
    if (normalized === null) return refuse(c, 'INVALID_PHONE', { field: 'phone' });

    const result = await createSignInService(dependencies.db, auth).signIn({
      phoneNumber: normalized.e164,
      password: parsed.data.password,
      now,
      requestId: c.get('requestId'),
      events: dependencies.events,
      ...(userAgent === undefined ? {} : { userAgent }),
    });

    if (result.outcome === 'invalid') {
      return refuse(c, 'AUTH_INVALID_CREDENTIALS');
    }

    // The library issued the session; R1's route forwards its token in the
    // cookie the contract names (contracts/auth-api.md §2.2).
    c.header('Set-Cookie', sessionCookie(result.token, production()));
    return c.json({ outcome: 'signed_in' }, 200);
  });

  app.post('/api/v1/auth/sign-out', async (c) => {
    const now = dependencies.now();
    const token = readCookie(c.req.header('cookie'), SESSION_COOKIE);
    if (token !== null) {
      // The revocation record names the account only when a live row changed;
      // an unknown cookie and an already-ended session emit nothing
      // (contracts/auth-api.md §5.6, §6; FR-037).
      const row = await auth.resolve(token, now);
      if (
        row !== null &&
        row.revokedAt === null &&
        !isExpired(row.expiresAt, now) &&
        !isInactive(row.lastActivityAt, now)
      ) {
        const revoked = await auth.revoke(token, 'sign_out', now);
        if (revoked) {
          dependencies.events.emit({
            event: 'auth.session.revoked',
            outcome: 'success',
            requestId: c.get('requestId'),
            reason: 'sign_out',
            sessionCount: 1,
            accountId: row.userId,
          });
        }
      }
    }
    c.header('Set-Cookie', clearedCookie(SESSION_COOKIE, production()));
    return c.body(null, 204);
  });

  app.post('/api/v1/auth/sign-out-all', async (c) => {
    const token = readCookie(c.req.header('cookie'), SESSION_COOKIE);
    if (token !== null) {
      const now = dependencies.now();
      const row = await auth.resolve(token, now);
      // A repeat of the ended session revokes nothing and sends no notice.
      if (
        row !== null &&
        row.revokedAt === null &&
        !isExpired(row.expiresAt, now) &&
        !isInactive(row.lastActivityAt, now)
      ) {
        const count = await auth.revokeAll(row.userId, 'sign_out_all', now);
        dependencies.events.emit({
          event: 'auth.session.revoked',
          outcome: 'success',
          requestId: c.get('requestId'),
          reason: 'sign_out_all',
          sessionCount: count,
          accountId: row.userId,
        });
        const account = await createUsersRepository(dependencies.db).findById(
          row.userId,
        );
        if (account !== null) {
          await dispatchNotice(dependencies.sms, {
            to: account.phoneNumber,
            kind: 'signed_out_all',
            now,
            requestId: c.get('requestId'),
            events: dependencies.events,
          });
        }
      }
    }
    c.header('Set-Cookie', clearedCookie(SESSION_COOKIE, production()));
    return c.body(null, 204);
  });

  app.get('/api/v1/auth/session', async (c) => {
    const now = dependencies.now();
    // §2.3: the activity signal is honoured only behind the CSRF pair and the
    // origin allowlist; otherwise it is ignored and the read still proceeds.
    const userInitiated =
      c.req.header('x-wafar-activity') === '1' &&
      activitySignalHonoured({
        cookieHeader: c.req.header('cookie'),
        csrfHeader: c.req.header('x-wafar-csrf'),
        origin: c.req.header('origin'),
        webOrigin: dependencies.env.WEB_ORIGIN,
      });
    const context = await authenticate(
      dependencies.db,
      auth,
      {
        token: readCookie(c.req.header('cookie'), SESSION_COOKIE),
        now,
        requiresUnrestricted: false,
        isUserInitiated: userInitiated,
      },
    );

    if (context.kind === 'refused') return refuse(c, context.code);
    if (context.kind === 'guest') return c.json({ authenticated: false }, 200);

    const account = await createUsersRepository(dependencies.db).findById(
      context.userId,
    );
    return c.json(
      {
        authenticated: true,
        user: { fullName: account?.fullName ?? '' },
        session: {
          expiresAt: context.expiresAt.toISOString(),
          lastActivityAt: context.lastActivityAt.toISOString(),
          restricted: context.restricted,
        },
      },
      200,
    );
  });
}

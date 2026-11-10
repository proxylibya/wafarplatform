// The `POST /api/v1/auth/password/change` route: delegates to the foundation service and
// carries no rule of its own, so no second clearing path exists (FR-013, FR-028).
import type { Hono } from 'hono';
import { changePasswordRequestSchema } from '@wafar/shared';
import { refuse } from '../../../http/errors.ts';
import { clearedCookie } from '../../../http/deps.ts';
import { SESSION_COOKIE, authenticate } from '../../../http/context.ts';
import type { AppDependencies, AppEnv } from '../../../http/deps.ts';
import { readCookie } from '../../../http/security.ts';
import { createPasswordChangeService } from '../service/password-change.ts';
import { createUsersRepository } from '../../users/repository/users.ts';
import { dispatchNotice } from '../service/notices.ts';

export function registerPasswordChangeRoute(
  app: Hono<AppEnv>,
  dependencies: AppDependencies,
): void {
  app.post('/api/v1/auth/password/change', async (c) => {
    const now = dependencies.now();
    const context = await authenticate(dependencies.db, dependencies.auth, {
      token: readCookie(c.req.header('cookie'), SESSION_COOKIE),
      now,
      requiresUnrestricted: false,
      isUserInitiated: true,
    });
    if (context.kind === 'refused') return refuse(c, context.code);
    if (context.kind === 'guest') return refuse(c, 'SESSION_ENDED');

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return refuse(c, 'PASSWORD_TOO_SHORT');
    }
    const parsed = changePasswordRequestSchema.safeParse(payload);
    if (!parsed.success) return refuse(c, 'PASSWORD_TOO_SHORT');

    const result = await createPasswordChangeService(
      dependencies.db,
      dependencies.auth,
    ).change({
      userId: context.userId,
      token: context.token,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      now,
      requestId: c.get('requestId'),
      path: context.restricted ? 'forced_change' : 'change',
      events: dependencies.events,
    });

    if (result.status === 'refused') {
      if (result.code === 'AUTH_INVALID_CREDENTIALS') {
        return refuse(c, 'AUTH_INVALID_CREDENTIALS');
      }
      return refuse(c, result.code);
    }

    const account = await createUsersRepository(dependencies.db).findById(
      context.userId,
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
    c.header(
      'Set-Cookie',
      clearedCookie(SESSION_COOKIE, dependencies.env.NODE_ENV === 'production'),
    );
    return c.json({ outcome: 'changed' }, 200);
  });
}

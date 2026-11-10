// The HTTP composition root: the correlation id, the security headers, the
// 16 KB body guard, the `/api/v1` mount, the unversioned health probe, and the
// error envelope (FR-017, contracts/auth-api.md §2.4, §3, §5.13).
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { maxBodyBytes } from '@wafar/shared';
import { issueCsrfToken, issueFormStamp, csrfGuard, csrfCookie, securityHeaders } from './http/security.ts';
import type { AppDependencies, AppEnv } from './http/deps.ts';
import { refuse } from './http/errors.ts';
import { registerSignUpRoute } from './modules/auth/routes/sign-up.ts';
import { registerSignUpVerifyRoute } from './modules/auth/routes/sign-up-verify.ts';
import { registerVerificationRoutes } from './modules/auth/routes/verifications.ts';
import { registerSessionRoutes } from './modules/auth/routes/session.ts';
import { registerPasswordChangeRoute } from './modules/auth/routes/password-change.ts';
import { registerRecoveryRoutes } from './modules/auth/routes/recovery.ts';

export function createApp(dependencies: AppDependencies): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  const production = dependencies.env.NODE_ENV === 'production';
  const security = {
    secret: dependencies.env.BETTER_AUTH_SECRET,
    webOrigin: dependencies.env.WEB_ORIGIN,
    production,
  };

  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  });

  app.use('*', securityHeaders(security));

  // The body guard: the declared length is refused before parsing, and the
  // actual bytes are measured so a chunked body cannot slip past it.
  app.use('/api/v1/*', async (c, next) => {
    const length = Number(c.req.header('content-length') ?? '0');
    if (Number.isFinite(length) && length > maxBodyBytes) {
      return refuse(c, 'PAYLOAD_TOO_LARGE');
    }
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      const measured = await c.req.raw.clone().arrayBuffer();
      if (measured.byteLength > maxBodyBytes) {
        return refuse(c, 'PAYLOAD_TOO_LARGE');
      }
    }
    await next();
  });

  app.use('/api/v1/*', csrfGuard(security));

  app.get('/health', async (c) => {
    try {
      await dependencies.db.execute(sql`SELECT 1`);
      return c.json({ status: 'ok', database: 'ok' }, 200);
    } catch {
      return c.json({ status: 'degraded', database: 'error' }, 503);
    }
  });

  // The render bootstrap: the one read a bare page makes before its first mutation.
  app.get('/api/v1/auth/csrf', (c) => {
    const token = issueCsrfToken();
    const stamp = issueFormStamp(dependencies.env.BETTER_AUTH_SECRET, dependencies.now());
    c.header('Set-Cookie', csrfCookie(token, production));
    return c.json({ csrfToken: token, formStamp: stamp }, 200);
  });

  registerSignUpRoute(app, dependencies);
  registerSignUpVerifyRoute(app, dependencies);
  registerVerificationRoutes(app, dependencies);
  registerSessionRoutes(app, dependencies);
  registerPasswordChangeRoute(app, dependencies);
  registerRecoveryRoutes(app, dependencies);

  app.notFound((c) => {
    const method = c.req.method;
    const path = c.req.path;
    const allowed = app.routes
      .filter((route) => pathMatches(route.path, path))
      .map((route) => route.method)
      .filter((candidate) => candidate !== 'ALL');
    if (allowed.length > 0 && !allowed.includes(method)) {
      c.header('Allow', allowed.join(', '));
      return refuse(c, 'METHOD_NOT_ALLOWED');
    }
    return refuse(c, 'NOT_FOUND');
  });

  app.onError((error, c) => {
    console.error(error);
    return refuse(c, 'INTERNAL_ERROR');
  });

  return app;
}

/** Hono's route path (`/a/:id`) as a matcher for the 405 answer. */
function pathMatches(pattern: string, path: string): boolean {
  if (!pattern.includes(':')) return pattern === path;
  const source = pattern
    .split('/')
    .map((segment) =>
      segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${source}$`).test(path);
}

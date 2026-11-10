// The single shared entry point: it resolves the session, the account's status,
// the role, the forced-change restriction, and the two clocks in one place, and
// it reads or writes a session only through the `auth` engine's session port
// (FR-049, FR-053, data-model.md §5).
import type { Database } from '@wafar/db';
import type { SessionPort } from '@wafar/shared';
import { isExpired, isInactive } from '../modules/auth/service/sessions.ts';
import { createUsersRepository } from '../modules/users/repository/users.ts';

export const SESSION_COOKIE = 'wafar.session';

export type RequestContext =
  | { kind: 'guest' }
  | {
      kind: 'refused';
      code: 'SESSION_ENDED' | 'ACCOUNT_BLOCKED' | 'PASSWORD_CHANGE_REQUIRED';
    }
  | {
      kind: 'session';
      userId: string;
      sessionId: string;
      token: string;
      role: 'merchant' | 'administrator';
      restricted: boolean;
      expiresAt: Date;
      lastActivityAt: Date;
    };

export interface AuthenticateInput {
  token: string | null;
  now: Date;
  /** True when the route needs an unrestricted session. */
  requiresUnrestricted: boolean;
  /** True when the request came from a merchant-initiated handler. */
  isUserInitiated: boolean;
}

export async function authenticate(
  db: Database,
  sessionService: SessionPort,
  input: AuthenticateInput,
): Promise<RequestContext> {
  if (input.token === null) return { kind: 'guest' };

  const row = await sessionService.resolve(input.token, input.now);
  if (row === null) return { kind: 'guest' };

  if (row.revokedAt !== null) {
    return {
      kind: 'refused',
      code: row.revokedReason === 'blocked' ? 'ACCOUNT_BLOCKED' : 'SESSION_ENDED',
    };
  }

  const users = createUsersRepository(db);
  const account = await users.findById(row.userId);
  if (account === null) return { kind: 'guest' };

  if (account.status === 'blocked') {
    await sessionService.revoke(row.token, 'blocked', input.now);
    return { kind: 'refused', code: 'ACCOUNT_BLOCKED' };
  }

  if (isExpired(row.expiresAt, input.now)) {
    return { kind: 'refused', code: 'SESSION_ENDED' };
  }

  if (isInactive(row.lastActivityAt, input.now)) {
    await sessionService.revoke(row.token, 'inactivity', input.now);
    return { kind: 'refused', code: 'SESSION_ENDED' };
  }

  if (account.mustChangePassword && input.requiresUnrestricted) {
    return { kind: 'refused', code: 'PASSWORD_CHANGE_REQUIRED' };
  }

  if (input.isUserInitiated) {
    await sessionService.touch(row.token, input.now);
  }

  return {
    kind: 'session',
    userId: row.userId,
    sessionId: row.sessionId,
    token: row.token,
    role: account.role,
    restricted: account.mustChangePassword,
    expiresAt: row.expiresAt,
    lastActivityAt: row.lastActivityAt,
  };
}

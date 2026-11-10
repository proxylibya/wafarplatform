// The `auth` module's engine: one better-auth instance whose password and
// session primitives every service calls, and the transaction scope that keeps
// the library's rows inside the caller's unit of work (ADR-151, FR-004, FR-010,
// FR-013, FR-035).
import type {
  IssuedSession,
  ResolvedSession,
  SessionPort,
  SessionRevocationReason,
} from '@wafar/shared';
import type { Database, Transaction } from '@wafar/db';
import { createBetterAuth, type WafarAuth } from './better-auth.ts';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** The credential row the library's `accounts` table holds for one account. */
export interface CredentialRecord {
  id: string;
  userId: string;
  passwordHash: string;
}

export interface SessionIssueInput {
  userId: string;
  now: Date;
  ipAddress?: string;
  userAgent?: string;
}

/** The caller's unit of work: the transaction handle and the scoped engine. */
export interface AuthScope {
  db: Transaction;
  auth: AuthEngine;
}

export interface AuthEngine extends SessionPort {
  /** The composition test's proof that the designated library is the engine. */
  readonly provider: 'better-auth';
  readonly version: string;
  readonly raw: WafarAuth;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  readCredential(userId: string): Promise<CredentialRecord | null>;
  /** Creates the `accounts` row from a hash `auth.hashPassword` produced. */
  createCredential(input: {
    userId: string;
    passwordHash: string;
  }): Promise<void>;
  /** Replaces the stored hash with one `auth.hashPassword` produced. */
  writeCredential(userId: string, passwordHash: string): Promise<void>;
  /** Ends one session named by its row id, for the platform CLI. */
  revokeById(
    sessionId: string,
    reason: SessionRevocationReason,
    now: Date,
  ): Promise<boolean>;
  /** Resolves one session named by its row id, for the platform CLI. */
  resolveById(sessionId: string): Promise<ResolvedSession | null>;
  /**
   * Runs `work` inside one database transaction whose library rows are written
   * through a transaction-scoped library instance, so the account, its
   * credential, and its session commit or roll back together.
   */
  transaction<T>(work: (scope: AuthScope) => Promise<T>): Promise<T>;
}

export interface AuthEngineOptions {
  db: Database;
  secret: string;
  baseUrl: string;
  /** Unreachable while the library's HTTP handler stays unmounted (ADR-151). */
  sendOtp?: (input: { phoneNumber: string; code: string }) => Promise<void>;
}

const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const ACTIVITY_WRITE_MS = 60 * 1000;

const requireModule = createRequire(import.meta.url);

/**
 * Reads the version the installed better-auth package reports from the package
 * root the module was resolved into, so the engine names the library it
 * actually runs and a dependency update cannot leave a stale constant behind
 * (Complexity Tracking row 39).
 */
function readBetterAuthVersion(): string {
  let dir = dirname(requireModule.resolve('better-auth'));
  for (;;) {
    try {
      const manifest = JSON.parse(
        readFileSync(join(dir, 'package.json'), 'utf8'),
      ) as { name?: string; version?: string };
      if (manifest.name === 'better-auth' && typeof manifest.version === 'string') {
        return manifest.version;
      }
    } catch {
      // Not this root; keep walking up to the package that owns it.
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('the installed better-auth package was not found');
}

const BETTER_AUTH_VERSION = readBetterAuthVersion();

type LibrarySession = { id: string; token: string; userId: string } & Record<
  string,
  unknown
>;

function date(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return null;
}

function toResolved(
  session: Record<string, unknown>,
): ResolvedSession | null {
  const sessionId = typeof session['id'] === 'string' ? session['id'] : null;
  const token = typeof session['token'] === 'string' ? session['token'] : null;
  const userId = typeof session['userId'] === 'string' ? session['userId'] : null;
  const expiresAt = date(session['expiresAt']);
  if (sessionId === null || token === null || userId === null || expiresAt === null) {
    return null;
  }
  return {
    sessionId,
    token,
    userId,
    expiresAt,
    lastActivityAt: date(session['lastActivityAt']) ?? expiresAt,
    revokedAt: date(session['revokedAt']),
    revokedReason:
      typeof session['revokedReason'] === 'string' ? session['revokedReason'] : null,
  };
}

export function createAuthEngine(options: AuthEngineOptions): AuthEngine {
  const auth = createBetterAuth({
    db: options.db,
    secret: options.secret,
    baseUrl: options.baseUrl,
    sendOtp:
      options.sendOtp ??
      (() => Promise.resolve()),
  });

  const engine: AuthEngine = {
    provider: 'better-auth',
    version: BETTER_AUTH_VERSION,
    raw: auth,

    async hashPassword(password) {
      return (await auth.$context).password.hash(password);
    },

    async verifyPassword(password, hash) {
      return (await auth.$context).password.verify({ password, hash });
    },

    async readCredential(userId) {
      const context = await auth.$context;
      const accounts = await context.internalAdapter.findAccounts(userId);
      const account = accounts.find(
        (row) => (row as { providerId?: string }).providerId === 'credential',
      );
      const passwordHash = (account as { password?: string | null } | undefined)
        ?.password;
      if (account === undefined || passwordHash === null || passwordHash === undefined) {
        return null;
      }
      return { id: account.id, userId, passwordHash };
    },

    async createCredential(input) {
      const context = await auth.$context;
      await context.internalAdapter.createAccount({
        userId: input.userId,
        accountId: input.userId,
        providerId: 'credential',
        password: input.passwordHash,
      });
    },

    async writeCredential(userId, passwordHash) {
      const context = await auth.$context;
      await context.internalAdapter.updatePassword(userId, passwordHash);
    },

    async issue(input): Promise<IssuedSession> {
      const context = await auth.$context;
      const expiresAt = new Date(input.now.getTime() + SESSION_ABSOLUTE_MS);
      const session = (await context.internalAdapter.createSession(
        input.userId,
        false,
        {
          expiresAt,
          createdAt: input.now,
          updatedAt: input.now,
          lastActivityAt: input.now,
          ipAddress: input.ipAddress ?? '',
          userAgent: input.userAgent?.slice(0, 512) ?? '',
        },
        true,
      )) as unknown as LibrarySession;
      return {
        sessionId: session.id,
        token: session.token,
        expiresAt,
      };
    },

    async resolve(token) {
      const context = await auth.$context;
      const found = await context.internalAdapter.findSession(token);
      if (found === null) return null;
      return toResolved(found.session as Record<string, unknown>);
    },

    async touch(token, now) {
      const context = await auth.$context;
      const found = await context.internalAdapter.findSession(token);
      if (found === null) return;
      const row = toResolved(found.session as Record<string, unknown>);
      if (row === null || row.revokedAt !== null) return;
      if (row.lastActivityAt.getTime() > now.getTime() - ACTIVITY_WRITE_MS) return;
      await context.internalAdapter.updateSession(token, {
        lastActivityAt: now,
        updatedAt: now,
      });
    },

    async revoke(token, reason, now) {
      const context = await auth.$context;
      const found = await context.internalAdapter.findSession(token);
      if (found === null) return false;
      const row = toResolved(found.session as Record<string, unknown>);
      if (row === null || row.revokedAt !== null) return false;
      const updated = await context.internalAdapter.updateSession(token, {
        revokedAt: now,
        revokedReason: reason,
        updatedAt: now,
      });
      return updated !== null;
    },

    async revokeAll(userId, reason, now) {
      const context = await auth.$context;
      const rows = await context.internalAdapter.listSessions(userId);
      let count = 0;
      for (const row of rows) {
        const resolved = toResolved(row);
        if (resolved === null || resolved.revokedAt !== null) continue;
        const updated = await context.internalAdapter.updateSession(resolved.token, {
          revokedAt: now,
          revokedReason: reason,
          updatedAt: now,
        });
        if (updated !== null) count += 1;
      }
      return count;
    },

    async revokeById(sessionId, reason, now) {
      const context = await auth.$context;
      const row = (await context.adapter.findOne({
        model: 'session',
        where: [{ field: 'id', value: sessionId }],
      })) ?? null;
      const resolved =
        row === null ? null : toResolved(row as Record<string, unknown>);
      if (resolved === null || resolved.revokedAt !== null) return false;
      const updated = await context.internalAdapter.updateSession(resolved.token, {
        revokedAt: now,
        revokedReason: reason,
        updatedAt: now,
      });
      return updated !== null;
    },

    async resolveById(sessionId) {
      const context = await auth.$context;
      const row = (await context.adapter.findOne({
        model: 'session',
        where: [{ field: 'id', value: sessionId }],
      })) ?? null;
      return row === null
        ? null
        : toResolved(row as Record<string, unknown>);
    },

    async transaction<T>(work: (scope: AuthScope) => Promise<T>): Promise<T> {
      return options.db.transaction(async (tx) => {
        const scoped = createAuthEngine({
          ...options,
          db: tx as unknown as Database,
        });
        return work({ db: tx, auth: scoped });
      });
    },
  };

  return engine;
}

// The cross-module ports: the `users` module's lock, the `auth` module's
// credential and session collaborators, and the security-event sink. A caller
// depends on these shapes, never on another module's repository (Principle X).

export interface LockState {
  failedCount: number;
  lockedUntil: Date | null;
}

/** The `users` module's lock port; `user-lock.ts` is its only implementation. */
export interface LockPort {
  /** One conditional increment; returns the state after the attempt. */
  recordFailedAttempt(userId: string, now: Date): Promise<LockState>;
  /** Clears the count and any expired bound after a successful verification. */
  recordSuccess(userId: string, now: Date): Promise<void>;
  /** Reads the current state without writing. */
  read(userId: string, now: Date): Promise<LockState>;
  /** The current-password check's lock refusal: true while a lock is in force. */
  isLocked(userId: string, now: Date): Promise<boolean>;
}

export interface CredentialRecord {
  userId: string;
  passwordHash: string;
}

/** The `auth` module's credential port. */
export interface CredentialPort {
  read(userId: string): Promise<CredentialRecord | null>;
  readByPhone(phoneNumber: string): Promise<CredentialRecord | null>;
  /** Conditional write: resolves false when the authority re-check failed. */
  write(userId: string, passwordHash: string): Promise<void>;
}

export interface IssuedSession {
  sessionId: string;
  token: string;
  expiresAt: Date;
}

/** A resolved session row: the library's fields plus the policy's three. */
export interface ResolvedSession {
  sessionId: string;
  token: string;
  userId: string;
  expiresAt: Date;
  lastActivityAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
}

/** The `auth` module's session port; the shared entry point uses it. */
export interface SessionPort {
  issue(input: {
    userId: string;
    now: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IssuedSession>;
  resolve(token: string, now: Date): Promise<ResolvedSession | null>;
  touch(token: string, now: Date): Promise<void>;
  revoke(
    token: string,
    reason: SessionRevocationReason,
    now: Date,
  ): Promise<boolean>;
  revokeAll(userId: string, reason: SessionRevocationReason, now: Date): Promise<number>;
}

export const sessionRevocationReasons = [
  'sign_out',
  'sign_out_all',
  'password_change',
  'blocked',
  'platform_revocation',
  'inactivity',
] as const;
export type SessionRevocationReason = (typeof sessionRevocationReasons)[number];

export type SecurityEventName =
  | 'auth.sign_in.failed'
  | 'auth.sign_in.succeeded'
  | 'auth.sign_up.verified'
  | 'auth.lock.applied'
  | 'auth.password.changed'
  | 'auth.password.current_check_failed'
  | 'auth.password.reset'
  | 'auth.session.revoked'
  | 'auth.otp.dispatch_failed'
  | 'auth.notice.dispatch_failed'
  | 'auth.administrator.provisioned';

export interface SecurityEvent {
  event: SecurityEventName;
  outcome: 'success' | 'failure';
  requestId: string;
  reason?: string;
  accountId?: string;
  path?: 'change' | 'forced_change';
  blocked?: boolean;
  sessionCount?: number;
  kind?: 'sign_up' | 'recovery' | 'password_changed' | 'signed_out_all';
  channel?: string;
}

export interface SecurityEventPort {
  emit(event: SecurityEvent): void;
}

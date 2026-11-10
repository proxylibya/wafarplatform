// The session policy's two clocks: the absolute lifetime and the inactivity
// timeout the shared entry point applies to every resolved row (FR-032,
// ADR-154).
import { sessionInactivitySeconds } from '@wafar/shared';

/** True when the inactivity clock has ended the session (FR-032). */
export function isInactive(lastActivityAt: Date, now: Date): boolean {
  return now.getTime() - lastActivityAt.getTime() >= sessionInactivitySeconds * 1000;
}

/** True when the absolute lifetime has ended. */
export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}

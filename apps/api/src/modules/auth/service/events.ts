// FR-037's closed security-event list and its one emit function.
import type { SecurityEvent, SecurityEventName, SecurityEventPort } from '@wafar/shared';

/** The list is closed for R1: an event outside it cannot be emitted here. */
export const securityEventNames: readonly SecurityEventName[] = [
  'auth.sign_in.failed',
  'auth.sign_in.succeeded',
  'auth.sign_up.verified',
  'auth.lock.applied',
  'auth.password.changed',
  'auth.password.current_check_failed',
  'auth.password.reset',
  'auth.session.revoked',
  'auth.otp.dispatch_failed',
  'auth.notice.dispatch_failed',
  'auth.administrator.provisioned',
] as const;

export function createSecurityEvents(sink: SecurityEventPort): SecurityEventPort {
  return {
    emit(event: SecurityEvent): void {
      if (!securityEventNames.includes(event.event)) {
        throw new Error(`Unknown security event: ${event.event}`);
      }
      sink.emit(event);
    },
  };
}

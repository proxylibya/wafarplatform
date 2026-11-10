// The two security notices, dispatched best-effort: a failed send is recorded
// and undoes nothing (FR-043, AC-047).
import type { SecurityEventPort } from '@wafar/shared';
import type { SmsTransport } from '../sms/port.ts';
import { renderBody, type SmsKind } from '../sms/templates.ts';

export type NoticeKind = 'password_changed' | 'signed_out_all';

export async function dispatchNotice(
  sms: SmsTransport,
  input: {
    to: string;
    kind: NoticeKind;
    now: Date;
    requestId: string;
    events: SecurityEventPort;
  },
): Promise<void> {
  const template: SmsKind =
    input.kind === 'password_changed'
      ? 'notice_password_changed'
      : 'notice_signed_out_all';
  try {
    const result = await sms.send({
      to: input.to,
      kind: template,
      body: renderBody(template),
    });
    if (result !== 'accepted') {
      input.events.emit({
        event: 'auth.notice.dispatch_failed',
        outcome: 'failure',
        requestId: input.requestId,
        kind: input.kind,
      });
    }
  } catch {
    input.events.emit({
      event: 'auth.notice.dispatch_failed',
      outcome: 'failure',
      requestId: input.requestId,
      kind: input.kind,
    });
  }
}

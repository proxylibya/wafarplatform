// The SMS transport port: a one-way transactional channel with an acceptance
// answer, no in-request retry, and no fallback provider (CMV 13).
import type { SmsKind } from './templates.ts';

export type SmsResult = 'accepted' | 'refused' | 'timed_out';

export interface SmsMessage {
  to: string;
  kind: SmsKind;
  body: string;
}

export interface SmsTransport {
  send(message: SmsMessage): Promise<SmsResult>;
  /** The rolling median of the last sixteen accepted dispatch durations. */
  acceptanceEstimateMs(): number;
}

export class SmsRefusedError extends Error {}

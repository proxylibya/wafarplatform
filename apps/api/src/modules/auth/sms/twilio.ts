// The Twilio adapter: one REST call with a 750 ms timeout, no in-request retry,
// and no fallback provider. A timeout is a refusal at acceptance (CMV 13).
import { smsTimeoutMs } from '@wafar/shared';
import type { SmsMessage, SmsResult, SmsTransport } from './port.ts';
import { AcceptanceEstimate } from './acceptance-estimate.ts';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  from: string;
}

export class TwilioSmsTransport implements SmsTransport {
  private readonly estimate = new AcceptanceEstimate();

  constructor(private readonly config: TwilioConfig) {}

  async send(message: SmsMessage): Promise<SmsResult> {
    const started = performance.now();
    const body = new URLSearchParams({
      To: message.to,
      From: this.config.from,
      Body: message.body,
    });
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const authorisation = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`,
    ).toString('base64');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), smsTimeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Basic ${authorisation}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) return 'refused';
      this.estimate.record(performance.now() - started);
      return 'accepted';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'timed_out';
      console.error('[sms:twilio] dispatch failed', (error as Error).message);
      return 'refused';
    } finally {
      clearTimeout(timer);
    }
  }

  acceptanceEstimateMs(): number {
    return this.estimate.median();
  }
}

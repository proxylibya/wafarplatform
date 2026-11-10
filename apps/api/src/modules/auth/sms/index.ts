// The transport factory: the fake in development and CI, Twilio when configured.
import type { Env } from '../../../env.ts';
import { FakeSmsTransport } from './fake.ts';
import { TwilioSmsTransport } from './twilio.ts';
import type { SmsTransport } from './port.ts';

export function createSmsTransport(env: Env): SmsTransport {
  if (env.SMS_TRANSPORT === 'twilio') {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
      throw new Error('Twilio is selected but its credentials are not set');
    }
    return new TwilioSmsTransport({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      from: env.TWILIO_FROM,
    });
  }
  return new FakeSmsTransport(env.SMS_FAKE_ACCEPT_MS);
}

export type { SmsTransport };

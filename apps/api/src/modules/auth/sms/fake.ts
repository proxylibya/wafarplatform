// The deterministic fake transport: an in-memory record of every message, a
// configurable acceptance duration, and switchable refusal modes. It is the only
// transport CI uses (FR-029, plan → Technical Context).
import type { SmsMessage, SmsResult, SmsTransport } from './port.ts';
import { AcceptanceEstimate } from './acceptance-estimate.ts';

export interface RecordedMessage extends SmsMessage {
  sentAt: Date;
}

export class FakeSmsTransport implements SmsTransport {
  readonly messages: RecordedMessage[] = [];
  private readonly estimate = new AcceptanceEstimate();
  /** The answer the next sends give; `accepted` by default. */
  result: SmsResult = 'accepted';
  /** How many of the next sends give `result` instead of `accepted`. */
  failNext = 0;
  /** The deterministic stand-in for the provider's 750 ms call. */
  timeoutMs = 0;

  constructor(private readonly acceptMs = 0) {}

  async send(message: SmsMessage): Promise<SmsResult> {
    const started = performance.now();
    const wait = this.timeoutMs > 0 ? this.timeoutMs : this.acceptMs;
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    const answer = this.failNext > 0 ? this.result : 'accepted';
    if (this.failNext > 0) this.failNext -= 1;
    if (answer === 'accepted') {
      this.messages.push({ ...message, sentAt: new Date() });
      this.estimate.record(performance.now() - started);
    }
    // The one structured line a developer reads the code from; the number is
    // masked because a log carries no full number (contracts/auth-api.md §7.1).
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'sms.fake.dispatched',
        kind: message.kind,
        to: message.to.replace(/^(\+\d{3})\d+$/, '$1...'),
        body: message.body,
        answer,
      }),
    );
    return answer;
  }

  acceptanceEstimateMs(): number {
    return this.estimate.median();
  }

  /** The most recent code a message carried, for the end-to-end suite. */
  lastCode(): string | null {
    const last = this.messages.at(-1);
    if (last === undefined) return null;
    const match = /(\d{6})/.exec(last.body);
    return match?.[1] ?? null;
  }

  clear(): void {
    this.messages.length = 0;
    this.estimate.reset();
    this.result = 'accepted';
    this.failNext = 0;
    this.timeoutMs = 0;
  }
}

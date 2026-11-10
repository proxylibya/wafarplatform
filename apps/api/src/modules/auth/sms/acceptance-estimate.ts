// The rolling-median acceptance estimator: the last sixteen accepted dispatch
// durations, capped at the provider's 750 ms timeout, reset with the process.
import { smsTimeoutMs } from '@wafar/shared';

const WINDOW = 16;

export class AcceptanceEstimate {
  private readonly samples: number[] = [];

  record(durationMs: number): void {
    this.samples.push(Math.min(durationMs, smsTimeoutMs));
    if (this.samples.length > WINDOW) this.samples.shift();
  }

  median(): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
    const lower = sorted[middle - 1] ?? 0;
    const upper = sorted[middle] ?? 0;
    return (lower + upper) / 2;
  }

  get size(): number {
    return this.samples.length;
  }

  reset(): void {
    this.samples.length = 0;
  }
}

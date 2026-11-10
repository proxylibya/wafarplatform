// Unit test the acceptance estimator: the empty window, one sample, even and
// odd windows, eviction at the seventeenth sample, the cap, and the reset.
import { describe, expect, it } from 'vitest';
import { AcceptanceEstimate } from '../acceptance-estimate.ts';

describe('the acceptance estimator', () => {
  it('reads the empty window as zero', () => {
    expect(new AcceptanceEstimate().median()).toBe(0);
  });

  it('reads one sample as itself', () => {
    const estimate = new AcceptanceEstimate();
    estimate.record(200);
    expect(estimate.median()).toBe(200);
  });

  it('reads an odd window as its middle sample', () => {
    const estimate = new AcceptanceEstimate();
    for (const value of [10, 30, 20]) estimate.record(value);
    expect(estimate.median()).toBe(20);
  });

  it('reads an even window as the mean of its two middle samples', () => {
    const estimate = new AcceptanceEstimate();
    for (const value of [10, 20, 30, 40]) estimate.record(value);
    expect(estimate.median()).toBe(25);
  });

  it('evicts the oldest sample when the seventeenth arrives', () => {
    const estimate = new AcceptanceEstimate();
    for (let index = 0; index < 8; index += 1) estimate.record(100);
    for (let index = 0; index < 8; index += 1) estimate.record(300);
    expect(estimate.median()).toBe(200);
    estimate.record(1000);
    expect(estimate.size).toBe(16);
    // The oldest 100 was evicted: seven 100s, eight 300s, one 1000.
    expect(estimate.median()).toBe(300);
  });

  it('caps a sample at 750 ms', () => {
    const estimate = new AcceptanceEstimate();
    estimate.record(5000);
    expect(estimate.median()).toBe(750);
  });

  it('resets with the process', () => {
    const estimate = new AcceptanceEstimate();
    estimate.record(120);
    estimate.reset();
    expect(estimate.median()).toBe(0);
    expect(estimate.size).toBe(0);
  });
});

// The hourly sweep scheduler: it waits for the top of the hour, runs the sweep,
// reschedules, reports a failure without stopping, and stops on shutdown
// (data-model.md §14; T208).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startSweepScheduler } from '@wafar/db/sweeps';

const db = {} as never;

describe('the hourly sweep scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the sweep at the top of the next hour and reschedules', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T10:30:00.000Z'));
    const run = vi.fn(async () => undefined);
    const stop = startSweepScheduler(db, { run });

    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stops scheduling when the returned function is called', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T10:30:00.000Z'));
    const run = vi.fn(async () => undefined);
    const stop = startSweepScheduler(db, { run });

    stop();
    await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
    expect(run).not.toHaveBeenCalled();
  });

  it('reports a failed run and keeps the next hour scheduled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T10:30:00.000Z'));
    const failure = new Error('sweep failed');
    const run = vi.fn(async () => {
      throw failure;
    });
    const onError = vi.fn();
    const stop = startSweepScheduler(db, { run, onError });

    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    expect(onError).toHaveBeenCalledWith(failure);
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });
});

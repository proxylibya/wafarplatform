// The hourly idempotent sweeps: spent rate-limit windows, ended sessions, and
// expired pending requests, each behind one advisory lock so two instances do
// not sweep the same rows together, and the scheduler that runs them from the
// API process at the top of each hour (data-model.md §14).
import { sql } from 'drizzle-orm';
import type { Database } from './client.ts';

const SWEEP_LOCK_KEY = 77_001;

export interface SweepCounts {
  rateLimitCounters: number;
  sessions: number;
  phoneVerifications: number;
}

export interface SweepSchedulerOptions {
  /** The clock the schedule reads; injected by tests. */
  now?: () => Date;
  /** The timer primitives; injected by tests. */
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  /** The sweep to run; defaults to `sweep(db)`. */
  run?: () => Promise<unknown>;
  /** Receives a failed run so the next hour stays scheduled. */
  onError?: (error: unknown) => void;
}

/** Runs the three sweeps in one transaction; a second caller skips the run. */
export async function sweep(db: Database): Promise<SweepCounts | null> {
  return db.transaction(async (tx) => {
    const lock = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(${SWEEP_LOCK_KEY}) AS acquired`,
    );
    const acquired = (lock.rows[0] as { acquired: boolean } | undefined)?.acquired;
    if (acquired !== true) return null;

    const counters = await tx.execute(sql`
      DELETE FROM rate_limit_counters WHERE expires_at <= now()
    `);
    const sessions = await tx.execute(sql`
      DELETE FROM sessions
      WHERE (revoked_at IS NOT NULL AND revoked_at <= now() - interval '24 hours')
         OR (revoked_at IS NULL AND expires_at <= now() - interval '24 hours')
    `);
    const pending = await tx.execute(sql`
      DELETE FROM phone_verifications WHERE request_expires_at <= now()
    `);

    return {
      rateLimitCounters: counters.rowCount ?? 0,
      sessions: sessions.rowCount ?? 0,
      phoneVerifications: pending.rowCount ?? 0,
    };
  });
}

/**
 * Starts the API process's hourly sweep. The first run is at the top of the next
 * UTC hour; each run reschedules itself after it finishes, so a long run never
 * overlaps the next one. The returned function stops the schedule.
 */
export function startSweepScheduler(
  db: Database,
  options: SweepSchedulerOptions = {},
): () => void {
  const now = options.now ?? (() => new Date());
  const setTimer =
    options.setTimer ??
    ((callback: () => void, delay: number) => setTimeout(callback, delay));
  const clearTimer =
    options.clearTimer ??
    ((timer: ReturnType<typeof setTimeout>) => clearTimeout(timer));
  const run = options.run ?? (() => sweep(db));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const schedule = (): void => {
    if (stopped) return;
    const current = now();
    const next = new Date(current.getTime());
    next.setUTCMinutes(0, 0, 0);
    next.setUTCHours(next.getUTCHours() + 1);
    const delay = Math.max(0, next.getTime() - current.getTime());
    timer = setTimer(() => {
      void tick();
    }, delay);
  };

  const tick = async (): Promise<void> => {
    try {
      await run();
    } catch (error) {
      options.onError?.(error);
    } finally {
      schedule();
    }
  };

  schedule();
  return () => {
    stopped = true;
    if (timer !== undefined) {
      clearTimer(timer);
      timer = undefined;
    }
  };
}

// The deterministic concurrency harness (T156): a test-only decorator over the
// `UnitOfWork` port. `holdAt('beforeCommit')` arms a gate; the next unit of work
// that reaches it opens its transaction, then waits before running any of its
// statements, so a second request can be ordered on the outside and neither
// scheduling luck nor a database lock decides the order (plan.md ->
// Concurrency: how "together" is produced). No production seam is added: the
// services receive an ordinary `Database` whose `transaction` member is the
// decorated port.
import type { Database, Transaction } from '@wafar/db';

export type BarrierPoint = 'beforeCommit';

interface Gate {
  /** Resolves when `release()` frees the held unit of work. */
  readonly freed: Promise<void>;
  release(): void;
}

function createGate(): Gate {
  let release = (): void => undefined;
  const freed = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { freed, release: () => release() };
}

/** One armed gate, released on its own so two racers can be ordered. */
export interface BarrierGate {
  release(): void;
}

export interface Barrier {
  /** The decorated client: identical to the real one except its unit of work. */
  readonly db: Database;
  /**
   * Arms one gate at `point`. The next unit of work to reach that point waits
   * until the returned handle — or `release()` — frees it.
   */
  holdAt(point: BarrierPoint): BarrierGate;
  /** Resolves once every armed gate is holding one unit of work. */
  arrived(): Promise<void>;
  /** Frees every held unit of work, in no particular order. */
  release(): void;
  /** The number of gates armed but not yet occupied. */
  pending(): number;
}

export function createBarrier(real: Database): Barrier {
  const gates: Gate[] = [];
  const occupied: Gate[] = [];
  const waiters: Array<() => void> = [];
  let outstanding = 0;

  function notify(): void {
    if (outstanding > 0) return;
    while (waiters.length > 0) {
      waiters.shift()?.();
    }
  }

  const decorated = new Proxy(real, {
    get(object, property, receiver) {
      const value = Reflect.get(object, property, receiver);
      if (property === 'transaction') {
        return (work: (tx: Transaction) => Promise<unknown>, config?: unknown) => {
          const gate = gates.shift();
          const run = (
            object.transaction as (
              callback: (tx: Transaction) => Promise<unknown>,
              options?: unknown,
            ) => Promise<unknown>
          ).bind(object);
          return run(async (tx) => {
            if (gate !== undefined) {
              occupied.push(gate);
              outstanding -= 1;
              notify();
              await gate.freed;
            }
            return work(tx);
          }, config);
        };
      }
      return typeof value === 'function' ? value.bind(object) : value;
    },
  });

  return {
    db: decorated as Database,
    holdAt(point) {
      if (point !== 'beforeCommit') {
        throw new Error(`barrier: unsupported point ${String(point)}`);
      }
      const gate = createGate();
      outstanding += 1;
      gates.push(gate);
      return { release: () => gate.release() };
    },
    async arrived() {
      if (outstanding === 0) return;
      await new Promise<void>((resolve) => {
        waiters.push(resolve);
        notify();
      });
    },
    release() {
      while (occupied.length > 0) {
        occupied.shift()?.release();
      }
    },
    pending() {
      return outstanding;
    },
  };
}

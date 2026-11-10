// The test-only fault port: one collaborator call inside the real unit of work
// fails, then the transaction rolls back. No production seam is added; the
// services see the ordinary database port (T146).
import { getTableName, type Table } from 'drizzle-orm';
import type { Database } from '@wafar/db';

export interface FaultPlan {
  table: string;
  verb: 'insert' | 'update' | 'delete';
  /** Which matching call fails; 1 is the first. */
  occurrence?: number;
}

export interface FaultControl {
  plan: FaultPlan;
  /** Set false to let the same harness run the retry. */
  active: boolean;
  seen: number;
}

export function createFault(plan: FaultPlan): FaultControl {
  return { plan, active: true, seen: 0 };
}

function tableName(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  try {
    return getTableName(value as Table);
  } catch {
    return null;
  }
}

export function createFaultedDatabase(db: Database, fault: FaultControl): Database {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function wrap(target: any): any {
    return new Proxy(target, {
      get(object, property, receiver) {
        const value = Reflect.get(object, property, receiver);
        if (property === 'transaction') {
          return (work: (tx: unknown) => Promise<unknown>) =>
            db.transaction((tx) => work(wrap(tx)));
        }
        if (
          property === 'insert' ||
          property === 'update' ||
          property === 'delete'
        ) {
          return (table: unknown) => {
            if (
              fault.active &&
              property === fault.plan.verb &&
              tableName(table) === fault.plan.table
            ) {
              fault.seen += 1;
              if (fault.seen === (fault.plan.occurrence ?? 1)) {
                throw new Error(
                  `fault: ${fault.plan.verb} on ${fault.plan.table} (call ${fault.seen})`,
                );
              }
            }
            return value.call(object, table);
          };
        }
        return typeof value === 'function' ? value.bind(object) : value;
      },
    });
  }

  return wrap(db) as Database;
}

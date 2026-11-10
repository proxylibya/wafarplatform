// The unit-of-work port: a transaction handle the services pass down, so a
// module's writes commit or roll back together (data-model.md §1).
import type { Database, Transaction } from './client.ts';

export interface UnitOfWork {
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}

export function createUnitOfWork(db: Database): UnitOfWork {
  return {
    transaction: (work) => db.transaction(work),
  };
}

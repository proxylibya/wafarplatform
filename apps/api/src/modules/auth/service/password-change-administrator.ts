// The administrator's forced first change: the A8 service performs the write,
// and this branch admits only a restricted administrator and reports the
// current-password failure with its own path (FR-028, FR-013, AC-030).
import type { Database } from '@wafar/db';
import {
  createPasswordChangeService,
  type AdministratorPasswordChange,
} from './password-change.ts';
import type { AuthEngine } from '../engine.ts';
import { createUsersRepository } from '../../users/repository/users.ts';

export function createAdministratorPasswordChange(
  db: Database,
  auth: AuthEngine,
): AdministratorPasswordChange {
  const service = createPasswordChangeService(db, auth);
  return {
    async change(input) {
      const account = await createUsersRepository(db).findById(input.userId);
      if (
        account === null ||
        account.role !== 'administrator' ||
        !account.mustChangePassword
      ) {
        return { status: 'refused', code: 'SESSION_ENDED' };
      }
      return service.change({ ...input, path: 'forced_change' });
    },
  };
}

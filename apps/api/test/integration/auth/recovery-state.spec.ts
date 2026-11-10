// The change and the reset submitted together for one number, run as the three
// interleavings plan.md -> Concurrency: how "together" is produced fixes. Both
// racers open a unit of work; T156's barrier holds each at its start so the
// order is decided by the harness, not by a lock or by scheduling luck, and the
// conditional write inside the unit — not the pre-read — carries the authority
// (FR-013, FR-014; AC-014, AC-016; T083, T158).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  seedAccount,
  type CookieJar,
} from '../../support/harness.ts';
import { verifyPassword } from '../../../src/modules/auth/service/password-policy.ts';

const harness = hasDatabase ? createHarness({ barrier: true }) : null;
const password = 'correct horse battery staple';
const changePassword = 'the change wrote this one 11';
const resetPassword = 'the reset wrote this one 22';

interface Prepared {
  userId: string;
  session: CookieJar;
  recovery: CookieJar;
  requestId: string;
}

async function prepare(): Promise<Prepared> {
  const account = await seedAccount(harness!, {
    phoneNumber: '+218912345678',
    password,
  });
  const session: CookieJar = {};
  await bootstrap(harness!, session);
  const signed = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-in',
    { phone: '0912345678', password },
    { jar: session, csrf: true },
  );
  expect(signed.status).toBe(200);

  const recovery: CookieJar = {};
  await bootstrap(harness!, recovery);
  const started = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot',
    { phone: '0912345678' },
    { jar: recovery, csrf: true },
  );
  expect(started.status).toBe(202);
  const requestId = (started.body as { requestId: string }).requestId;
  const verified = await call(
    harness!,
    'POST',
    '/api/v1/auth/password/forgot/verify',
    { requestId, code: harness!.sms.lastCode() ?? '' },
    { jar: recovery, csrf: true },
  );
  expect(verified.status).toBe(200);
  expect(verified.body).toEqual({ outcome: 'verified' });
  return { userId: account.id, session, recovery, requestId };
}

async function credentialOf(userId: string): Promise<string> {
  const rows = await harness!.db.execute(
    sql`SELECT password FROM accounts WHERE user_id = ${userId}`,
  );
  return (rows.rows[0] as { password: string }).password;
}

async function liveSessions(userId: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql`SELECT count(*)::int AS n FROM sessions
        WHERE user_id = ${userId} AND revoked_at IS NULL`,
  );
  return (rows.rows[0] as { n: number }).n;
}

function change(session: CookieJar) {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/password/change',
    { currentPassword: password, newPassword: changePassword },
    { jar: session, csrf: true },
  );
}

function reset(recovery: CookieJar, requestId: string) {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/password/reset',
    { requestId, newPassword: resetPassword },
    { jar: recovery, csrf: true },
  );
}

type Order = 'change-first' | 'reset-first' | 'together';

const orders: Order[] = ['change-first', 'reset-first', 'together'];

describe.skipIf(!hasDatabase)('the change and the reset raced', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  describe.each(orders)('%s', (order) => {
    it('writes one credential and leaves the loser its specified outcome', async () => {
      const prepared = await prepare();
      const barrier = harness!.barrier;
      expect(barrier).toBeDefined();

      // Both requests open their unit of work and are held before either writes.
      const changeGate = barrier!.holdAt('beforeCommit');
      const changing = change(prepared.session);
      await barrier!.arrived();
      const resetGate = barrier!.holdAt('beforeCommit');
      const resetting = reset(prepared.recovery, prepared.requestId);
      await barrier!.arrived();

      let changed: Awaited<ReturnType<typeof change>>;
      let reset2: Awaited<ReturnType<typeof reset>>;
      if (order === 'change-first') {
        changeGate.release();
        changed = await changing;
        resetGate.release();
        reset2 = await resetting;
      } else if (order === 'reset-first') {
        resetGate.release();
        reset2 = await resetting;
        changeGate.release();
        changed = await changing;
      } else {
        changeGate.release();
        resetGate.release();
        [changed, reset2] = await Promise.all([changing, resetting]);
      }

      const codeOf = (response: { body: unknown }): string =>
        String((response.body as { error?: { code?: string } }).error?.code ?? '');

      // The credential is exactly one of the two new passwords: one write won,
      // and the pre-read decided neither outcome.
      const stored = await credentialOf(prepared.userId);
      const matchesChange = await verifyPassword(changePassword, stored);
      const matchesReset = await verifyPassword(resetPassword, stored);
      expect([matchesChange, matchesReset].filter(Boolean)).toHaveLength(1);

      // No session that existed at the winning write survives it.
      expect(await liveSessions(prepared.userId)).toBe(0);

      if (order === 'change-first') {
        expect(changed.status).toBe(200);
        expect(changed.body).toEqual({ outcome: 'changed' });
        expect(matchesChange).toBe(true);
        expect(reset2.status).toBe(400);
        expect(codeOf(reset2)).toBe('RECOVERY_EXPIRED');
      } else if (order === 'reset-first') {
        expect(reset2.status).toBe(200);
        expect(reset2.body).toEqual({ outcome: 'reset' });
        expect(matchesReset).toBe(true);
        expect(changed.status).toBe(401);
        expect(codeOf(changed)).toBe('SESSION_ENDED');
      } else {
        // Both racers passed their pre-write read; either may win, and the loser
        // is decided on the state the winner left — never both rows, neither
        // row, or a credential that is neither submitted value.
        expect([200, 400, 401]).toContain(changed.status);
        expect([200, 400]).toContain(reset2.status);
        const successes = [changed, reset2].filter(
          (response) => response.status === 200,
        );
        expect(successes.length).toBeGreaterThanOrEqual(1);
        if (changed.status === 401) expect(codeOf(changed)).toBe('SESSION_ENDED');
        if (reset2.status === 400) expect(codeOf(reset2)).toBe('RECOVERY_EXPIRED');
      }

      // The pending request is consumed either way.
      const rows = await harness!.db.execute(
        sql`SELECT count(*)::int AS n FROM phone_verifications`,
      );
      expect((rows.rows[0] as { n: number }).n).toBe(0);
    });
  });
});

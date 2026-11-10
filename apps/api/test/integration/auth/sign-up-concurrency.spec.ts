// Two submissions that meet at the same moment, run as the three interleavings
// plan.md -> Concurrency: how "together" is produced fixes: A commits first,
// B commits first, and both in flight before either commits. T156's barrier
// holds a transaction after its work and before its commit, so an order is
// decided by the harness rather than by scheduling luck.
//
// The two sign-ups for one number write a single pending row through one
// statement guarded by the row's unique key, so that race has no unit of work to
// hold: its first two interleavings are ordered by construction and the third
// starts both submissions before either writes, which is the admissible-set
// case the plan states. The two entries of one correct code both hold a unit of
// work and use the barrier in all three (FR-006, FR-031, AC-006; T038, T157).
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness({ barrier: true }) : null;
const password = 'correct horse battery staple';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

async function count(table: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (rows.rows[0] as { n: number }).n;
}

async function pendingIds(): Promise<string[]> {
  const rows = await harness!.db.execute(
    sql.raw('SELECT id::text AS id FROM phone_verifications ORDER BY id'),
  );
  return (rows.rows as Array<{ id: string }>).map((row) => row.id);
}

interface Recorded {
  status: number;
  body: unknown;
}

async function signUp(jar: CookieJar, formStamp: string): Promise<Recorded> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    {
      fullName: 'محمد علي',
      phone: '0912345678',
      password,
      city: city(),
      website: '',
      formStamp,
    },
    { jar, csrf: true },
  );
}

async function verify(
  jar: CookieJar,
  requestId: string,
  code: string,
): Promise<Recorded> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up/verify',
    { requestId, code },
    { jar, csrf: true },
  );
}

type Order = 'a-first' | 'b-first' | 'together';

const orders: Order[] = ['a-first', 'b-first', 'together'];

describe.skipIf(!hasDatabase)('the sign-up races', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  describe.each(orders)('two sign-ups for one number (%s)', (order) => {
    it('leaves one pending request and no account', async () => {
      const jarA: CookieJar = {};
      const jarB: CookieJar = {};
      const pair = await bootstrap(harness!, jarA);
      await bootstrap(harness!, jarB);
      harness!.clock.advance(4000);

      const entries: Array<{ jar: CookieJar; response: Recorded }> = [];
      if (order === 'a-first') {
        entries.push({ jar: jarA, response: await signUp(jarA, pair.formStamp) });
        entries.push({ jar: jarB, response: await signUp(jarB, pair.formStamp) });
      } else if (order === 'b-first') {
        entries.push({ jar: jarB, response: await signUp(jarB, pair.formStamp) });
        entries.push({ jar: jarA, response: await signUp(jarA, pair.formStamp) });
      } else {
        const [left, right] = await Promise.all([
          signUp(jarA, pair.formStamp),
          signUp(jarB, pair.formStamp),
        ]);
        entries.push({ jar: jarA, response: left });
        entries.push({ jar: jarB, response: right });
      }

      for (const entry of entries) {
        expect(entry.response.status).toBe(202);
        expect(Object.keys(entry.response.body as Record<string, unknown>).sort()).toEqual([
          'codeExpiresAt',
          'expiresAt',
          'phone',
          'requestId',
        ]);
      }

      // One row per number, whichever submission wrote last, and no account: the
      // pending write is this race's serialization point.
      expect(await count('phone_verifications')).toBe(1);
      expect(await count('users')).toBe(0);
      expect(await count('accounts')).toBe(0);
      expect(await count('sessions')).toBe(0);

      // The live row's own resumption states its purpose and state, not a
      // direction invented by the losing submission.
      const live = (await pendingIds())[0];
      const winner = entries.find(
        (entry) => (entry.response.body as { requestId?: string }).requestId === live,
      );
      expect(winner).toBeDefined();
      const resumed = await call(
        harness!,
        'GET',
        `/api/v1/auth/verifications/${live ?? ''}`,
        undefined,
        { jar: winner?.jar ?? {}, csrf: false },
      );
      expect(resumed.status).toBe(200);
      expect((resumed.body as { purpose: string }).purpose).toBe('sign_up');
      expect((resumed.body as { state: string }).state).toBe('pending');
    });
  });

  describe.each(orders)('two entries of one correct code (%s)', (order) => {
    it('leaves one account, one session, and no live pending request', async () => {
      const jar: CookieJar = {};
      const pair = await bootstrap(harness!, jar);
      harness!.clock.advance(4000);
      const started = await signUp(jar, pair.formStamp);
      expect(started.status).toBe(202);
      const requestId = (started.body as { requestId: string }).requestId;
      const code = harness!.sms.lastCode() ?? '';

      // Each entry presents the pending cookie the request was tied to, captured
      // before either entry clears it.
      const jarLeft: CookieJar = { ...jar };
      const jarRight: CookieJar = { ...jar };
      const barrier = harness!.barrier;
      expect(barrier).toBeDefined();

      let left: Recorded;
      let right: Recorded;
      const gateLeft = barrier!.holdAt('beforeCommit');
      const first = verify(jarLeft, requestId, code);
      await barrier!.arrived();
      const gateRight = barrier!.holdAt('beforeCommit');
      const second = verify(jarRight, requestId, code);
      await barrier!.arrived();

      if (order === 'a-first') {
        gateLeft.release();
        left = await first;
        gateRight.release();
        right = await second;
      } else if (order === 'b-first') {
        gateRight.release();
        right = await second;
        gateLeft.release();
        left = await first;
      } else {
        gateLeft.release();
        gateRight.release();
        [left, right] = await Promise.all([first, second]);
      }

      const outcomes = [left, right].map(
        (response) => (response.body as { outcome?: string }).outcome,
      );
      expect(outcomes.filter((outcome) => outcome === 'created')).toHaveLength(1);
      expect(
        outcomes.filter((outcome) => outcome === 'existing_account'),
      ).toHaveLength(1);
      expect(await count('users')).toBe(1);
      expect(await count('accounts')).toBe(1);
      expect(await count('sessions')).toBe(1);
      expect(await count('phone_verifications')).toBe(0);
    });
  });
});

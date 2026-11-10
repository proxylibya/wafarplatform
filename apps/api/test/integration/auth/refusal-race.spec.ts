// A refusal and a success racing on the same step: a sign-up a value rule will
// refuse against one that will be accepted for the same number, and the fifth
// incorrect code entry against the correct entry for one request. The barrier of
// T156 holds the unit of work, and each run asserts the admissible outcome set
// only — no second account, no second session, no partial row, and no live
// request left behind (FR-031, FR-034, FR-040; AC-006, AC-036, AC-043; T170).
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

interface Recorded {
  status: number;
  body: unknown;
}

function signUp(jar: CookieJar, formStamp: string, overrides: Record<string, unknown> = {}) {
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
      ...overrides,
    },
    { jar, csrf: true },
  );
}

function verify(jar: CookieJar, requestId: string, code: string): Promise<Recorded> {
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up/verify',
    { requestId, code },
    { jar, csrf: true },
  );
}

function codeOf(response: { body: unknown }): string {
  return String((response.body as { error?: { code?: string } }).error?.code ?? '');
}

/** A code the pending request cannot match. */
function wrongCode(real: string): string {
  return real === '000000' ? '000001' : '000000';
}

type Order = 'a-first' | 'b-first' | 'together';

const orders: Order[] = ['a-first', 'b-first', 'together'];

describe.skipIf(!hasDatabase)('a refusal and a success on one step', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  describe.each(orders)('an accepted sign-up against a refused one (%s)', (order) => {
    it('leaves one pending request, no account, and no trace of the refusal', async () => {
      const accepted: CookieJar = {};
      const refused: CookieJar = {};
      const pair = await bootstrap(harness!, accepted);
      await bootstrap(harness!, refused);
      harness!.clock.advance(4000);

      const good = (): Promise<Recorded> => signUp(accepted, pair.formStamp);
      const bad = (): Promise<Recorded> =>
        signUp(refused, pair.formStamp, { city: 'مدينة ليست في القائمة' });

      let acceptedResponse: Recorded;
      let refusedResponse: Recorded;
      if (order === 'a-first') {
        acceptedResponse = await good();
        refusedResponse = await bad();
      } else if (order === 'b-first') {
        refusedResponse = await bad();
        acceptedResponse = await good();
      } else {
        [acceptedResponse, refusedResponse] = await Promise.all([good(), bad()]);
      }

      expect(acceptedResponse.status).toBe(202);
      expect(refusedResponse.status).toBe(400);
      expect(codeOf(refusedResponse)).toBe('CITY_NOT_IN_LIST');
      expect((refusedResponse.body as { error: { field?: string } }).error.field).toBe(
        'city',
      );

      // The refused attempt wrote nothing: one row and one dispatch only.
      expect(await count('phone_verifications')).toBe(1);
      expect(await count('users')).toBe(0);
      expect(await count('sessions')).toBe(0);
      expect(harness!.sms.messages).toHaveLength(1);

      // The successful attempt's outcome reaches the resume read.
      const requestId = (acceptedResponse.body as { requestId: string }).requestId;
      const resumed = await call(
        harness!,
        'GET',
        `/api/v1/auth/verifications/${requestId}`,
        undefined,
        { jar: accepted, csrf: false },
      );
      expect(resumed.status).toBe(200);
      expect((resumed.body as { purpose: string }).purpose).toBe('sign_up');
      expect((resumed.body as { state: string }).state).toBe('pending');
    });
  });

  describe.each(orders)('the fifth incorrect entry against the correct one (%s)', (order) => {
    it('creates at most one account and leaves no live request', async () => {
      const jar: CookieJar = {};
      const pair = await bootstrap(harness!, jar);
      harness!.clock.advance(4000);
      const started = await signUp(jar, pair.formStamp);
      expect(started.status).toBe(202);
      const requestId = (started.body as { requestId: string }).requestId;
      const code = harness!.sms.lastCode() ?? '';

      // Four incorrect entries, so the fifth ends the request.
      for (let entry = 0; entry < 4; entry += 1) {
        const wrong = await verify(jar, requestId, wrongCode(code));
        expect(wrong.status).toBe(400);
        expect(codeOf(wrong)).toBe('OTP_INCORRECT');
      }

      const catchJar: CookieJar = { ...jar };
      const barrier = harness!.barrier;
      expect(barrier).toBeDefined();

      let correct: Recorded;
      let fifth: Recorded;
      if (order === 'a-first') {
        // The correct entry consumes the code and opens its unit of work; the
        // fifth entry ends the request while that unit of work is held.
        const gate = barrier!.holdAt('beforeCommit');
        const pending = verify(jar, requestId, code);
        await barrier!.arrived();
        fifth = await verify(catchJar, requestId, wrongCode(code));
        gate.release();
        correct = await pending;
      } else if (order === 'b-first') {
        fifth = await verify(catchJar, requestId, wrongCode(code));
        correct = await verify(jar, requestId, code);
      } else {
        const gate = barrier!.holdAt('beforeCommit');
        const pending = verify(jar, requestId, code);
        await barrier!.arrived();
        const other = verify(catchJar, requestId, wrongCode(code));
        gate.release();
        [correct, fifth] = await Promise.all([pending, other]);
      }

      expect(fifth.status).toBe(400);
      expect(['OTP_REQUEST_ENDED', 'OTP_EXPIRED', 'OTP_INCORRECT']).toContain(
        codeOf(fifth),
      );

      if (correct.status === 200) {
        expect(correct.body).toEqual({ outcome: 'created' });
        expect(await count('users')).toBe(1);
        expect(await count('accounts')).toBe(1);
        expect(await count('sessions')).toBe(1);
      } else {
        expect(['OTP_EXPIRED', 'OTP_REQUEST_ENDED']).toContain(codeOf(correct));
        expect(await count('users')).toBe(0);
        expect(await count('accounts')).toBe(0);
        expect(await count('sessions')).toBe(0);
      }

      // Never a live request, a partial row, or a second session left behind.
      expect(await count('phone_verifications')).toBe(0);
      expect(await count('sessions')).toBeLessThanOrEqual(1);
      expect(await count('users')).toBeLessThanOrEqual(1);
    });
  });

  it('decides a refusal arriving after a success on the state the success left', async () => {
    const jar: CookieJar = {};
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const started = await signUp(jar, pair.formStamp);
    const requestId = (started.body as { requestId: string }).requestId;
    const code = harness!.sms.lastCode() ?? '';

    const created = await verify(jar, requestId, code);
    expect(created.body).toEqual({ outcome: 'created' });

    // The request ended with the outcome; the code authorises nothing further.
    const late = await verify({ ...jar }, requestId, code);
    expect(late.status).toBe(400);
    expect(['OTP_EXPIRED', 'OTP_REQUEST_ENDED']).toContain(codeOf(late));
    expect(await count('users')).toBe(1);
    expect(await count('sessions')).toBe(1);
    expect(await count('phone_verifications')).toBe(0);
  });
});

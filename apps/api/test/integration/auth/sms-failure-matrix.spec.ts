// The messaging channel's failure matrix: the refusal at acceptance and the
// 750 ms timeout at both placements — a fresh request and a re-request, for both
// flows. Every cell fails only the dispatch that asked, leaves no pending row
// before acceptance, spends the operation's budget, leaves the re-request
// allowance untouched, and writes its structured record with its kind
// (FR-034, FR-037, FR-043; AC-036, AC-040, AC-047; T160).
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
import { readCount } from '../../../src/modules/auth/service/rate-limit.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';

type Placement = 'sign_up_fresh' | 'recovery_fresh' | 'sign_up_resend' | 'recovery_resend';
type Failure = 'refused' | 'timed_out';

interface Cell {
  placement: Placement;
  failure: Failure;
}

const cells: Cell[] = [];
for (const placement of [
  'sign_up_fresh',
  'recovery_fresh',
  'sign_up_resend',
  'recovery_resend',
] as const) {
  for (const failure of ['refused', 'timed_out'] as const) {
    cells.push({ placement, failure });
  }
}

async function count(table: string): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw(`SELECT count(*)::int AS n FROM ${table}`),
  );
  return (rows.rows[0] as { n: number }).n;
}

interface StoredRow {
  id: string;
  code_hash: string;
  code_expires_at: string;
  request_expires_at: string;
  re_requests: number;
}

async function storedRow(): Promise<StoredRow | null> {
  const rows = await harness!.db.execute(
    sql.raw(
      'SELECT id::text AS id, code_hash, code_expires_at::text AS code_expires_at, ' +
        'request_expires_at::text AS request_expires_at, re_requests ' +
        'FROM phone_verifications LIMIT 1',
    ),
  );
  return (rows.rows[0] as StoredRow | undefined) ?? null;
}

function failNext(failure: Failure): void {
  const sms = harness!.sms;
  sms.failNext = 1;
  sms.result = failure;
  sms.timeoutMs = failure === 'timed_out' ? 750 : 0;
}

function codeOf(response: { body: unknown }): string {
  return String((response.body as { error?: { code?: string } }).error?.code ?? '');
}

describe.skipIf(!hasDatabase)('the messaging channel failure matrix', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  describe.each(cells)('$placement with $failure', ({ placement, failure }) => {
    it('fails only the dispatch that asked', async () => {
      const fresh = placement.endsWith('_fresh');
      const signUpFlow = placement.startsWith('sign_up');
      const budgetOperation = signUpFlow ? 'account_creation' : 'recovery';
      const jar: CookieJar = {};
      const pair = await bootstrap(harness!, jar);
      harness!.clock.advance(4000);

      // A re-request needs the live request it re-sends, and the recovery flow
      // needs an account so the code's replay is the verified state.
      let requestId = '';
      let code = '';
      let before: StoredRow | null = null;
      if (!fresh) {
        if (signUpFlow) {
          const started = await call(
            harness!,
            'POST',
            '/api/v1/auth/sign-up',
            {
              fullName: 'محمد علي',
              phone: '0912345678',
              password,
              city: 'طرابلس',
              website: '',
              formStamp: pair.formStamp,
            },
            { jar, csrf: true },
          );
          expect(started.status).toBe(202);
          requestId = (started.body as { requestId: string }).requestId;
        } else {
          await seedAccount(harness!, { phoneNumber: '+218912345678', password });
          const started = await call(
            harness!,
            'POST',
            '/api/v1/auth/password/forgot',
            { phone: '0912345678' },
            { jar, csrf: true },
          );
          expect(started.status).toBe(202);
          requestId = (started.body as { requestId: string }).requestId;
        }
        code = harness!.sms.lastCode() ?? '';
        before = await storedRow();
        expect(before).not.toBeNull();
      }

      const dispatchedBefore = harness!.sms.messages.length;
      failNext(failure);

      const response = fresh
        ? signUpFlow
          ? await call(
              harness!,
              'POST',
              '/api/v1/auth/sign-up',
              {
                fullName: 'محمد علي',
                phone: '0912345678',
                password,
                city: 'طرابلس',
                website: '',
                formStamp: pair.formStamp,
              },
              { jar, csrf: true },
            )
          : await call(
              harness!,
              'POST',
              '/api/v1/auth/password/forgot',
              { phone: '0912345678' },
              { jar, csrf: true },
            )
        : await call(
            harness!,
            'POST',
            '/api/v1/auth/verifications/resend',
            { requestId },
            { jar, csrf: true },
          );

      expect(response.status).toBe(502);
      expect(codeOf(response)).toBe('OTP_SEND_FAILED');
      // No second dispatch: the channel saw exactly the one message the
      // placeholder request carried, and the failure added none.
      expect(harness!.sms.messages.length).toBe(dispatchedBefore);

      const records = harness!.events.filter(
        (event) => event.event === 'auth.otp.dispatch_failed',
      );
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        kind: signUpFlow ? 'sign_up' : 'recovery',
        outcome: 'failure',
        channel: 'fake',
      });

      const now = harness!.clock.now();
      const originSpent = await readCount(
        harness!.db,
        budgetOperation,
        'origin',
        harness!.peer,
        now,
      );
      expect(originSpent).toBeGreaterThan(0);

      if (fresh) {
        // The fresh failure writes no pending row, stores no code, and states no
        // code step; the operation's number key is spent too.
        expect(await count('phone_verifications')).toBe(0);
        expect(response.body as Record<string, unknown>).not.toHaveProperty('requestId');
        expect(
          await readCount(harness!.db, budgetOperation, 'number', '+218912345678', now),
        ).toBeGreaterThan(0);
        expect(await count('users')).toBe(0);
      } else {
        // The re-request leaves the previous row, its code, and both expiries
        // exactly as they were: the allowance is not spent.
        expect(await storedRow()).toEqual(before);
        expect(await count('phone_verifications')).toBe(1);
        const replayed = await call(
          harness!,
          'POST',
          signUpFlow
            ? '/api/v1/auth/sign-up/verify'
            : '/api/v1/auth/password/forgot/verify',
          { requestId, code },
          { jar, csrf: true },
        );
        expect(replayed.status).toBe(200);
        expect(replayed.body).toEqual({
          outcome: signUpFlow ? 'created' : 'verified',
        });
      }
    });
  });
});

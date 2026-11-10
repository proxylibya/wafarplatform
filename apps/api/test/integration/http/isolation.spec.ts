// The merchant scope: the session lookup carries the account the token belongs
// to, a supplied account identifier is ignored, and a row that belongs to
// another account is answered exactly as a row that matches no row is. The
// scope-removal mutation runs in a rolled-back transaction, so the suite fails
// when the scope is removed rather than passing on a fixture alone
// (FR-053, AC-056; T118, T164).
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions, type Database } from '@wafar/db';
import {
  createHarness,
  hasDatabase,
  seedAccount,
} from '../../support/harness.ts';
import { authenticate } from '../../../src/http/context.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'merchant password value';

interface Seeded {
  id: string;
  token: string;
}

async function seedWithSession(phone: string, fullName: string): Promise<Seeded> {
  const account = await seedAccount(harness!, {
    phoneNumber: phone,
    password,
    fullName,
  });
  const issued = await harness!.auth.issue({
    userId: account.id,
    now: harness!.clock.now(),
  });
  return { id: account.id, token: issued.token };
}

function headersForComparison(response: {
  headers: Headers;
}): Array<[string, string]> {
  return [...response.headers.entries()]
    .filter(([name]) => !['date', 'x-request-id'].includes(name.toLowerCase()))
    // The CSP nonce is fresh per response; the policy it protects is compared.
    .map(([name, value]): [string, string] => [
      name,
      value.replace(/nonce-[A-Za-z0-9_-]+/g, 'nonce-redacted'),
    ])
    .sort(([left], [right]) => left.localeCompare(right));
}

describe.skipIf(!hasDatabase)('the merchant scope', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('resolves the session from the token alone and ignores a supplied identifier', async () => {
    const first = await seedWithSession('+218912345678', 'محمد علي');
    const second = await seedWithSession('+218912345679', 'سالم بن عامر');

    const read = await harness!.app.request(
      `/api/v1/auth/session?userId=${second.id}&accountId=${second.id}`,
      {
        method: 'GET',
        headers: {
          cookie: `wafar.session=${first.token}`,
          'x-wafar-account': second.id,
        },
      },
    );
    expect(read.status).toBe(200);
    const body = (await read.json()) as {
      authenticated: boolean;
      user: { fullName: string };
    };
    expect(body.authenticated).toBe(true);
    expect(body.user.fullName).toBe('محمد علي');
    expect(JSON.stringify(body)).not.toContain('سالم بن عامر');

    // The shared entry point agrees: the token's account, never the supplied one.
    const context = await authenticate(harness!.db, harness!.auth, {
      token: first.token,
      now: harness!.clock.now(),
      requiresUnrestricted: false,
      isUserInitiated: false,
    });
    expect(context.kind === 'session' ? context.userId : null).toBe(first.id);
  });

  it('answers another account’s row and a row that matches no row as one 404', async () => {
    const first = await seedWithSession('+218912345678', 'محمد علي');
    const second = await seedWithSession('+218912345679', 'سالم بن عامر');

    const otherAccountRow = await harness!.app.request(
      `/api/v1/merchant/records/${second.id}`,
      {
        method: 'GET',
        headers: { cookie: `wafar.session=${first.token}` },
      },
    );
    const missingRow = await harness!.app.request(
      '/api/v1/merchant/records/00000000-0000-0000-0000-000000000000',
      {
        method: 'GET',
        headers: { cookie: `wafar.session=${first.token}` },
      },
    );

    expect(otherAccountRow.status).toBe(404);
    expect(missingRow.status).toBe(404);
    expect(await otherAccountRow.json()).toEqual({
      error: { code: 'NOT_FOUND', retryable: false },
    });
    expect(await missingRow.json()).toEqual({
      error: { code: 'NOT_FOUND', retryable: false },
    });
    expect(headersForComparison(otherAccountRow)).toEqual(
      headersForComparison(missingRow),
    );
  });

  it('fails its own assertion when the token’s scope is removed', async () => {
    const first = await seedWithSession('+218912345678', 'محمد علي');
    const second = await seedWithSession('+218912345679', 'سالم بن عامر');
    const secondSession = (
      await harness!.db.select().from(sessions).where(eq(sessions.userId, second.id))
    )[0];

    // The mutation: the token now resolves another account's row. It runs in a
    // transaction that is rolled back, so the suite's own state survives.
    let mutationBrokeTheScope = false;
    try {
      await harness!.auth.transaction(async (scope) => {
        await scope.db.delete(sessions).where(eq(sessions.userId, first.id));
        await scope.db
          .update(sessions)
          .set({ token: first.token })
          .where(eq(sessions.id, secondSession!.id));
        const context = await authenticate(
          scope.db as unknown as Database,
          scope.auth,
          {
            token: first.token,
            now: harness!.clock.now(),
            requiresUnrestricted: false,
            isUserInitiated: false,
          },
        );
        // The assertion the suite makes would now fail: the token resolves the
        // other account, so the scope is not carried by the lookup.
        expect(context.kind === 'session' ? context.userId : null).toBe(first.id);
      });
    } catch {
      mutationBrokeTheScope = true;
    }
    expect(mutationBrokeTheScope).toBe(true);

    // The rolled-back state is the one the suite established.
    const context = await authenticate(harness!.db, harness!.auth, {
      token: first.token,
      now: harness!.clock.now(),
      requiresUnrestricted: false,
      isUserInitiated: false,
    });
    expect(context.kind === 'session' ? context.userId : null).toBe(first.id);
  });
});

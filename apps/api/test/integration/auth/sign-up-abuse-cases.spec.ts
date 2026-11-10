// The hidden field's non-timing abuse cases: the minimum time-to-submit, the
// stamp's signature and destination, its thirty-minute window, and the budget
// both refusals consume (FR-029, AC-031, AC-032; T073). They run in the shared
// integration class; the timing pair lives in `sign-up-abuse.spec.ts` and the
// enumeration run (CHK032; T199).
import { createHmac } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import {
  bootstrap,
  call,
  createHarness,
  hasDatabase,
  type CookieJar,
} from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'correct horse battery staple';
const secret = 'integration-secret-value-000000';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

function form(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: 'محمد علي',
    phone: '0912345678',
    password,
    city: city(),
    website: '',
    ...overrides,
  };
}

function craftStamp(destination: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: Math.floor(harness!.clock.now().getTime() / 1000), d: destination }),
  ).toString('base64url');
  const signature = createHmac('sha256', `${secret}:form_stamp`)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

async function submit(
  jar: CookieJar,
  values: Record<string, unknown>,
  options: { stamp?: string; advance?: number } = {},
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(options.advance ?? 4000);
  return call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    { ...values, formStamp: options.stamp ?? pair.formStamp },
    { jar, csrf: true },
  );
}

async function countFor(phone: string): Promise<number> {
  const normalized = `+218${phone.replace(/^0/, '')}`;
  const rows = await harness!.db.execute(
    sql`SELECT count FROM rate_limit_counters WHERE key = ${`account_creation:number:${normalized}`}`,
  );
  return (rows.rows[0] as { count?: number } | undefined)?.count ?? 0;
}

describe.skipIf(!hasDatabase)('sign-up abuse resistance', () => {
  beforeAll(async () => {
    await harness!.reset();
  });

  afterAll(async () => {
    await harness!.close();
  });

  it('refuses a stamp younger than three seconds, retries with a fresh one, and spends the budget', async () => {
    const jar: CookieJar = {};
    const before = await countFor('0912345678');

    const young = await submit(jar, form(), { advance: 0 });
    expect(young.status).toBe(400);
    expect(young.body).toMatchObject({
      error: { code: 'FORM_TOO_FAST', field: 'formStamp', retryable: true },
    });
    expect(await countFor('0912345678')).toBe(before + 1);

    // A retry with a freshly issued stamp is accepted once the interval passed.
    const retried = await submit(jar, form());
    expect(retried.status).toBe(202);
  });

  it('refuses a missing, altered, forged, or wrong-destination stamp', async () => {
    const jar: CookieJar = {};
    const values = form({ phone: '0912345001' });
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(4000);
    const forged = pair.formStamp.split('.');
    const altered = `${forged[0]}.${'A'.repeat((forged[1] ?? '').length)}`;

    for (const [index, stamp] of [
      '',
      'not-a-stamp',
      altered,
      craftStamp('other_form'),
    ].entries()) {
      const response = await call(
        harness!,
        'POST',
        '/api/v1/auth/sign-up',
        { ...values, phone: `091234500${index + 1}`, formStamp: stamp },
        { jar, csrf: true },
      );
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { code: 'FORM_TOO_FAST', field: 'formStamp' },
      });
    }
  });

  it('refuses a stamp older than thirty minutes and ignores a time the request supplies', async () => {
    const jar: CookieJar = {};
    const values = form({ phone: '0912345002' });
    const pair = await bootstrap(harness!, jar);
    harness!.clock.advance(31 * 60 * 1000);
    const old = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      { ...values, formStamp: pair.formStamp },
      { jar, csrf: true },
    );
    expect(old.status).toBe(400);
    expect(old.body).toMatchObject({ error: { code: 'FORM_TOO_FAST' } });

    // A supplied timestamp never stands in for the signed stamp.
    const past = await call(
      harness!,
      'POST',
      '/api/v1/auth/sign-up',
      { ...values, submittedAt: '2020-01-01T00:00:00.000Z', formStamp: '' },
      { jar, csrf: true },
    );
    expect(past.status).toBe(400);
    expect(past.body).toMatchObject({ error: { code: 'FORM_TOO_FAST' } });
  });
});

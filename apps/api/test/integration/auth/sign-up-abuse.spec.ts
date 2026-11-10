// The hidden field's timing pair, and only the pair: a silent success must not
// be observably faster than an accepted submission, measured one-sided at
// median ≤ 50 ms and p95 ≤ 150 ms over 200 samples after a 20-request warm-up
// (FR-029, AC-031; T073). It lives in the enumeration class because its 400
// samples at a 200 ms acceptance wait are a timing protocol, not an ordinary
// integration case (CHK032; T199). The non-timing abuse cases are
// `sign-up-abuse-cases.spec.ts`.
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
import {
  enumerationSamples,
  enumerationWarmUp,
  median,
  percentile,
  withinTolerance,
} from '../../support/enumeration.ts';

const acceptMs = 200;
const harness = hasDatabase ? createHarness({ smsAcceptMs: acceptMs }) : null;
const password = 'correct horse battery staple';

function city(): string {
  return cities.entries[0] ?? 'طرابلس';
}

function numberAt(index: number): string {
  return `+21891${String(1_000_000 + index)}`;
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

function headerNames(headers: Headers): string[] {
  return [...headers.keys()]
    .filter((name) => name !== 'date' && name !== 'x-request-id')
    .sort();
}

function masked(body: unknown): Record<string, unknown> {
  const value = { ...(body as Record<string, unknown>) };
  for (const key of ['requestId', 'phone', 'codeExpiresAt', 'expiresAt']) {
    if (key in value) value[key] = `<${key}>`;
  }
  return value;
}

async function submit(
  jar: CookieJar,
  values: Record<string, unknown>,
): Promise<{ status: number; body: unknown; headers: Headers; ms: number }> {
  const pair = await bootstrap(harness!, jar);
  harness!.clock.advance(4000);
  const started = performance.now();
  const response = await call(
    harness!,
    'POST',
    '/api/v1/auth/sign-up',
    { ...values, formStamp: pair.formStamp },
    { jar, csrf: true },
  );
  return { ...response, ms: performance.now() - started };
}

/** Opens a fresh fixed window so the origin budget never binds the sample. */
let requestIndex = 0;
function pace(): void {
  if (requestIndex > 0 && requestIndex % 15 === 0) {
    harness!.clock.advance(15 * 60 * 1000);
  }
  requestIndex += 1;
}

async function pendingCount(): Promise<number> {
  const rows = await harness!.db.execute(
    sql.raw('SELECT count(*)::int AS n FROM phone_verifications'),
  );
  return (rows.rows[0] as { n: number }).n;
}

describe.skipIf(!hasDatabase)('the hidden field timing pair', () => {
  beforeAll(async () => {
    await harness!.reset();
  });

  afterAll(async () => {
    await harness!.close();
  });

  it('answers the hidden field with a silent success indistinguishable from an accepted submission', async () => {
    const samples = enumerationSamples();
    const acceptedJar: CookieJar = {};
    const accepted: number[] = [];
    let reference: { status: number; body: unknown; headers: Headers } | null = null;

    // The accepted case runs first: its sends populate the channel's rolling
    // acceptance estimate, which the silent refusal then waits out.
    for (let index = 0; index < enumerationWarmUp + samples; index += 1) {
      pace();
      const response = await submit(acceptedJar, form({ phone: numberAt(index) }));
      expect(response.status).toBe(202);
      if (index < enumerationWarmUp) {
        reference ??= response;
      } else {
        accepted.push(response.ms);
      }
    }
    // Keep the estimate; drop the messages the accepted case dispatched.
    harness!.sms.messages.length = 0;

    const quietJar: CookieJar = {};
    const silentlyRefused: number[] = [];
    let silentFirst: { status: number; body: unknown; headers: Headers } | null = null;
    const pendingBefore = await pendingCount();
    for (let index = 0; index < enumerationWarmUp + samples; index += 1) {
      pace();
      const response = await submit(
        quietJar,
        form({ phone: numberAt(5000 + index), website: 'https://bot.example' }),
      );
      expect(response.status).toBe(202);
      silentFirst ??= response;
      if (index >= enumerationWarmUp) silentlyRefused.push(response.ms);
    }

    // No account, no new pending row, no dispatch: the refusal is silent.
    expect(harness!.sms.messages).toHaveLength(0);
    const users = await harness!.db.execute(sql.raw('SELECT count(*)::int AS n FROM users'));
    expect((users.rows[0] as { n: number }).n).toBe(0);
    expect(await pendingCount()).toBe(pendingBefore);

    // The refusal's shape equals an accepted submission's, masks included.
    const silent = silentFirst!;
    expect(silent.status).toBe(reference!.status);
    expect(headerNames(silent.headers)).toEqual(headerNames(reference!.headers));
    expect(masked(silent.body)).toEqual(masked(reference!.body));
    expect(Object.keys(silent.body as object).sort()).toEqual(
      Object.keys(reference!.body as object).sort(),
    );
    const resume = await call(
      harness!,
      'GET',
      `/api/v1/auth/verifications/${(silent.body as { requestId: string }).requestId}`,
      undefined,
      { jar: quietJar },
    );
    expect(resume.body).toMatchObject({ error: { code: 'OTP_EXPIRED' } });

    const verdict = withinTolerance(silentlyRefused, accepted);
    expect(
      verdict.ok,
      `median difference ${verdict.medianDifference.toFixed(1)} ms, p95 difference ${verdict.p95Difference.toFixed(1)} ms`,
    ).toBe(true);
    expect(median(silentlyRefused)).toBeGreaterThanOrEqual(acceptMs - 1);
    expect(percentile(silentlyRefused, 0.95)).toBeGreaterThanOrEqual(acceptMs - 1);
  }, 300_000);
});

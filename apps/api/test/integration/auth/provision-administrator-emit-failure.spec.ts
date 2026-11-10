// The provisioning run whose structured record cannot be written: the account
// exists, the report names it and states that the record did not reach the
// stream, the exit code is non-zero, one error line reaches stderr, and nothing
// is retried, queued, or sent to a second sink (FR-028, FR-037, AC-030, AC-040;
// T154).
import { Readable } from 'node:stream';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { users } from '@wafar/db';
import { createHarness, hasDatabase } from '../../support/harness.ts';

const harness = hasDatabase ? createHarness() : null;
const password = 'administrator initial password';

describe.skipIf(!hasDatabase)('the provisioning CLI’s failed record', () => {
  beforeAll(async () => {
    await harness!.reset();
  });
  beforeEach(async () => {
    await harness!.reset();
  });
  afterAll(async () => {
    await harness!.close();
  });

  it('reports the loss, exits non-zero, and leaves the account it names', async () => {
    const emitted: Array<Record<string, unknown>> = [];
    const stderrLines: string[] = [];
    const originalExitCode = process.exitCode;
    const originalArgv = [...process.argv];
    const originalStdin = process.stdin;
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    (process.stderr as unknown as { write: (chunk: string | Uint8Array) => boolean }).write = (
      chunk,
    ) => {
      stderrLines.push(
        typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'),
      );
      return true;
    };
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      stderrLines.push(args.map((value) => String(value)).join(' '));
    };

    vi.resetModules();
    vi.doMock('../../../src/observability/logger.ts', () => ({
      createLogger: (options?: {
        onWriteFailure?: (event: string) => void;
      }) => ({
        emit: (event: Record<string, unknown>) => {
          emitted.push(event);
          if (event['event'] === 'auth.administrator.provisioned') {
            options?.onWriteFailure?.('auth.administrator.provisioned');
            process.stderr.write(
              `${JSON.stringify({
                event: 'logger.write_failed',
                level: 'error',
                outcome: 'failure',
                reason: 'auth.administrator.provisioned',
              })}\n`,
            );
          }
        },
        withRequestId: () => ({ emit: () => undefined }),
      }),
      processLogger: { emit: () => undefined, withRequestId: () => ({ emit: () => undefined }) },
    }));

    process.argv = [
      process.execPath,
      'provision-administrator',
      '--phone',
      '+218912345678',
      '--full-name',
      'مدير المنصة',
      '--city',
      'طرابلس',
      '--password-stdin',
    ];
    Object.defineProperty(process, 'stdin', {
      value: Readable.from([password]),
      configurable: true,
    });
    process.exitCode = undefined;

    try {
      await import('../../../src/cli/provision-administrator.ts');
    } finally {
      Object.defineProperty(process, 'stdin', {
        value: originalStdin,
        configurable: true,
      });
      process.argv = originalArgv;
      (
        process.stderr as unknown as { write: typeof originalStderrWrite }
      ).write = originalStderrWrite;
      console.error = originalConsoleError;
    }

    // The run exits non-zero and names the account it left behind.
    expect(process.exitCode).toBe(2);
    const row = (
      await harness!.db.select().from(users).where(eq(users.phoneNumber, '+218912345678'))
    )[0];
    expect(row).toBeDefined();
    expect(row?.role).toBe('administrator');

    // One record was attempted, it threw, and nothing was retried or queued.
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.['event']).toBe('auth.administrator.provisioned');
    expect(JSON.stringify(emitted)).not.toContain(password);

    // Exactly one error line reaches stderr, and the report names the account.
    expect(
      stderrLines.filter((line) => line.includes('logger.write_failed')),
    ).toHaveLength(1);
    const report = stderrLines.filter((line) => line.includes('Provisioning failed'));
    expect(report).toHaveLength(1);
    expect(report[0]).toContain(row!.id);
    expect(report[0]).toContain('did not reach the stream');
    expect(stderrLines.join('')).not.toContain(password);

    // Nothing was sent as a code or a notice, and no session exists.
    const pending = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM phone_verifications`,
    );
    expect((pending.rows[0] as { n: number }).n).toBe(0);
    const sessions = await harness!.db.execute(
      sql`SELECT count(*)::int AS n FROM sessions`,
    );
    expect((sessions.rows[0] as { n: number }).n).toBe(0);

    process.exitCode = originalExitCode;
  });
});

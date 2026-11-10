// Unit test the structured record's closed schema, its emission order, and its
// failure isolation (FR-037, AC-040).
import { describe, expect, it } from 'vitest';
import { createLogger, type LogStream } from '../logger.ts';

function recorder(): { stream: LogStream; lines: string[] } {
  const lines: string[] = [];
  return { stream: { write: (line) => lines.push(line) }, lines };
}

const clock = () => new Date('2026-11-05T09:40:12.345Z');

describe('the structured logger', () => {
  it('writes one line carrying exactly the closed field set', () => {
    const { stream, lines } = recorder();
    const logger = createLogger({ stream, clock });
    logger.emit({
      event: 'auth.sign_in.failed',
      outcome: 'failure',
      requestId: 'req-1',
      reason: 'wrong_password',
    });
    expect(lines).toHaveLength(1);
    const record = JSON.parse(lines[0] as string) as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual(
      ['event', 'level', 'outcome', 'reason', 'requestId', 'timestamp'].sort(),
    );
    expect(record['timestamp']).toBe('2026-11-05T09:40:12.345Z');
    expect(record['level']).toBe('warn');
  });

  it('carries the per-event fields and no others', () => {
    const { stream, lines } = recorder();
    const logger = createLogger({ stream, clock });
    logger.emit({
      event: 'auth.session.revoked',
      outcome: 'success',
      requestId: 'req-2',
      reason: 'sign_out_all',
      sessionCount: 3,
    });
    const record = JSON.parse(lines[0] as string) as Record<string, unknown>;
    expect(record['sessionCount']).toBe(3);
    expect(record['reason']).toBe('sign_out_all');
    expect(record['accountId']).toBeUndefined();
  });

  it('never carries a phone number, name, token, code, hash, or IP address', () => {
    const { stream, lines } = recorder();
    const logger = createLogger({ stream, clock });
    logger.emit({
      event: 'auth.sign_up.verified',
      outcome: 'success',
      requestId: 'req-3',
      accountId: 'acc-1',
    });
    const line = lines[0] as string;
    expect(line).not.toMatch(/\+218/);
    expect(line).not.toMatch(/token/i);
    expect(line).not.toMatch(/password/i);
  });

  it('isolates a failing stream: one stderr line, no retry, no second sink', () => {
    const { stream: errorStream, lines } = recorder();
    const logger = createLogger({
      stream: {
        write: () => {
          throw new Error('sink down');
        },
      },
      errorStream,
      clock,
    });
    expect(() =>
      logger.emit({ event: 'auth.lock.applied', outcome: 'success', requestId: 'r-9' }),
    ).not.toThrow();
    expect(lines).toHaveLength(1);
    const record = JSON.parse(lines[0] as string) as Record<string, unknown>;
    expect(record['requestId']).toBe('r-9');
    expect(record['reason']).toBe('auth.lock.applied');
    expect(record['level']).toBe('error');
  });
});

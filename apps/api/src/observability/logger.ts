// The structured JSON logger: one line per event, no personal data, and a
// failure in the sink never changes the action's outcome (FR-037, AC-040).
import type { SecurityEvent } from '@wafar/shared';

export interface LogStream {
  write(line: string): void;
}

export interface LoggerOptions {
  stream?: LogStream;
  errorStream?: LogStream;
  clock?: () => Date;
  requestId?: string;
  /** Called when the primary stream throws, so a CLI can report the loss. */
  onWriteFailure?: (event: string) => void;
}

export interface LogRecord {
  event: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  requestId: string;
  outcome: 'success' | 'failure';
  reason?: string;
  accountId?: string;
  path?: 'change' | 'forced_change';
  blocked?: boolean;
  sessionCount?: number;
  kind?: string;
  channel?: string;
}

const stdout: LogStream = { write: (line) => process.stdout.write(`${line}\n`) };
const stderr: LogStream = { write: (line) => process.stderr.write(`${line}\n`) };

export interface Logger {
  emit(event: SecurityEvent): void;
  withRequestId(requestId: string): Logger;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const stream = options.stream ?? stdout;
  const errorStream = options.errorStream ?? stderr;
  const clock = options.clock ?? (() => new Date());

  const emit = (event: SecurityEvent): void => {
    const record: LogRecord = {
      event: event.event,
      level: event.outcome === 'success' ? 'info' : 'warn',
      timestamp: clock().toISOString(),
      requestId: event.requestId,
      outcome: event.outcome,
    };
    if (event.reason !== undefined) record.reason = event.reason;
    if (event.accountId !== undefined) record.accountId = event.accountId;
    if (event.path !== undefined) record.path = event.path;
    if (event.blocked !== undefined) record.blocked = event.blocked;
    if (event.sessionCount !== undefined) record.sessionCount = event.sessionCount;
    if (event.kind !== undefined) record.kind = event.kind;
    if (event.channel !== undefined) record.channel = event.channel;

    try {
      stream.write(JSON.stringify(record));
    } catch {
      options.onWriteFailure?.(record.event);
      try {
        errorStream.write(
          JSON.stringify({
            event: 'logger.write_failed',
            level: 'error',
            timestamp: clock().toISOString(),
            requestId: record.requestId,
            outcome: 'failure',
            reason: record.event,
          }),
        );
      } catch {
        // A second failing sink is not retried and reaches no other writer.
      }
    }
  };

  return {
    emit,
    withRequestId: (requestId) => createLogger({ ...options, requestId }),
  };
}

/** The process's logger, used where no request id exists (CLI paths). */
export const processLogger = createLogger();

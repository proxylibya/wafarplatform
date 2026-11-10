// The fake transport's console line, read back by the end-to-end suites. The
// API wrapper mirrors the console to a file; a test reads the six Latin digits
// a message body carried (quickstart.md §2.1, contracts/auth-api.md §7.1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const logPath = fileURLToPath(new URL('../.artifacts/api.log', import.meta.url));

export interface Dispatch {
  /** Position in the file, so a test can assert that no later message arrived. */
  index: number;
  kind: string;
  code: string;
  body: string;
}

/** Every accepted dispatch the fake recorded, oldest first. */
export function dispatched(): Dispatch[] {
  let text = '';
  try {
    text = readFileSync(logPath, 'utf8');
  } catch {
    return [];
  }
  const entries: Dispatch[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof parsed !== 'object' || parsed === null) continue;
    const entry = parsed as {
      event?: unknown;
      kind?: unknown;
      body?: unknown;
      answer?: unknown;
    };
    if (entry.event !== 'sms.fake.dispatched' || entry.answer !== 'accepted') continue;
    if (typeof entry.kind !== 'string' || typeof entry.body !== 'string') continue;
    const match = /(\d{6})/.exec(entry.body);
    if (match === null) continue;
    entries.push({
      index: entries.length,
      kind: entry.kind,
      code: match[1] ?? '',
      body: entry.body,
    });
  }
  return entries;
}

/** The count now, for the "no second dispatch" assertion. */
export function dispatchMark(): number {
  return dispatched().length;
}

/** Waits for the next accepted dispatch of one kind, after `after` entries. */
export async function waitForDispatch(options: {
  kind?: string;
  after?: number;
  timeout?: number;
} = {}): Promise<Dispatch> {
  const deadline = Date.now() + (options.timeout ?? 20_000);
  const after = options.after ?? 0;
  for (;;) {
    const entries = dispatched().filter(
      (entry) =>
        entry.index >= after &&
        (options.kind === undefined || entry.kind === options.kind),
    );
    const last = entries.at(-1);
    if (last !== undefined) return last;
    if (Date.now() > deadline) {
      throw new Error(
        `No ${options.kind ?? 'any'} dispatch arrived within ${options.timeout ?? 20_000} ms`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// The message table's binding to the closed error-code union (T175): every code
// of contracts/auth-api.md §3.1 has exactly one placement — a §6 row per
// (code, reason) pair, §8.4's ended-session state for SESSION_ENDED and
// ACCOUNT_BLOCKED, the declared R13 surface of PASSWORD_CHANGE_REQUIRED, or the
// declared `none` placement of the four transport-and-scope codes — and no row
// names a code outside the union. The two success rows are the only rows that
// name no code, so a third fails the test. T100 keeps the rendered-string
// identity and the no-composed-sentence limb; this test keeps the table's
// completeness (FR-026, AC-028).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authErrorCodes, type AuthErrorCode } from '@wafar/shared';

const contracts = join('specs', '001-identity-foundation', 'contracts');
const uiContracts = readFileSync(join(contracts, 'ui-contracts.md'), 'utf8');

interface Row {
  label: string;
  code: AuthErrorCode | null;
  reason: string | null;
  text: string;
  where: string;
}

/** §6's text between its heading and §7's. */
function messagesSection(): string {
  const start = uiContracts.indexOf('## 6. Messages shared by the three pages');
  const end = uiContracts.indexOf('## 7. SMS bodies');
  expect(start, '§6 is missing').toBeGreaterThan(-1);
  expect(end, '§7 is missing').toBeGreaterThan(start);
  return uiContracts.slice(start, end);
}

/** §8.4's text between its heading and §8.5's. */
function endedSessionSection(): string {
  const start = uiContracts.indexOf('### 8.4 The ended-session state');
  const end = uiContracts.indexOf('### 8.5 Appearance');
  expect(start, '§8.4 is missing').toBeGreaterThan(-1);
  expect(end, '§8.4 does not end').toBeGreaterThan(start);
  return uiContracts.slice(start, end);
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function tableRows(section: string): Row[] {
  const rows: Row[] = [];
  let started = false;
  for (const line of section.split('\n')) {
    const isRow = line.trimStart().startsWith('|');
    if (!isRow) {
      // Only the first table of the section is the message table; the
      // code-step endings table that follows it is a second subject.
      if (started) break;
      continue;
    }
    started = true;
    const parts = cells(line);
    if (parts.length !== 4) continue;
    const [label, reasonCell, text, where] = parts as [string, string, string, string];
    if (label === 'Code (API)' || /^-{2,}$/.test(label)) continue;
    const codeMatch = /^`([A-Z_]+)`/.exec(label);
    const labelCode =
      codeMatch !== null
        ? (codeMatch[1] as AuthErrorCode)
        : /^INTERNAL_ERROR\b/.test(label)
          ? ('INTERNAL_ERROR' as AuthErrorCode)
          : null;
    rows.push({
      label,
      code: labelCode,
      reason: reasonCell === '—' ? null : reasonCell.replace(/`/g, ''),
      text,
      where,
    });
  }
  return rows;
}

/** The section's text with its line wrapping collapsed. */
function flat(section: string): string {
  return section.replace(/\s+/g, ' ');
}

const messageRows = tableRows(messagesSection());
const codeRows = messageRows.filter((row) => row.code !== null);
const nonCodeRows = messageRows.filter((row) => row.code === null);

/** The two declared non-code rows are the only ones that name no code. */
const declaredNonCodeLabels = new Set([
  'Resend accepted (202)',
  'Signed-in after verification',
]);

/** The codes with no §6 row and the declared placement each one has. */
const declaredElsewhere: Partial<Record<AuthErrorCode, string>> = {
  SESSION_ENDED: '§8.4 the ended-session state',
  ACCOUNT_BLOCKED: '§8.4 the ended-session state',
  PASSWORD_CHANGE_REQUIRED: 'the administrator application (R13)',
  CSRF_FAILED: 'none',
  PAYLOAD_TOO_LARGE: 'none',
  METHOD_NOT_ALLOWED: 'none',
  NOT_FOUND: 'none',
};

/** The codes whose §6 row carries several texts and therefore a reason. */
const reasoned: Partial<Record<AuthErrorCode, readonly string[]>> = {
  INVALID_FULL_NAME: ['empty', 'too_long', 'emoji'],
  INVALID_SHOP_NAME: ['too_long', 'emoji'],
};

/** A `Where` cell may name any of these surfaces, states, or absences. */
const whereVocabulary = [
  'Sign-up',
  'sign-in',
  'recovery',
  'phone field',
  'password',
  'step',
  'page',
  'administrator',
  'settings',
  'Reserved',
  'R13',
  'R7',
  'transport',
  'Any step',
  'Code steps',
];

describe('the message table’s completeness', () => {
  it('binds the closed union’s 26 codes', () => {
    expect(authErrorCodes).toHaveLength(26);
    const seen = new Set(codeRows.map((row) => row.code));
    for (const code of authErrorCodes) {
      expect(
        seen.has(code) || declaredElsewhere[code] !== undefined,
        `${code} has no placement`,
      ).toBe(true);
    }
  });

  it('names no code outside the union', () => {
    const union = new Set<string>(authErrorCodes);
    for (const row of codeRows) {
      expect(union.has(row.code as string), `${row.label} is outside the union`).toBe(
        true,
      );
    }
    // A code-bearing label follows its code, as the transport row's does.
    const transport = messageRows.find((row) =>
      row.label.replace(/`/g, '').startsWith('INTERNAL_ERROR'),
    );
    expect(transport?.label.replace(/`/g, '').startsWith('INTERNAL_ERROR')).toBe(true);
  });

  it('places every code exactly once', () => {
    for (const code of authErrorCodes) {
      const rows = codeRows.filter((row) => row.code === code);
      const elsewhere = declaredElsewhere[code];
      if (rows.length === 0) {
        expect(elsewhere, `${code} has no placement`).toBeDefined();
        continue;
      }
      // A multi-text code carries one row per declared reason; every other
      // code carries one row.
      const expected = reasoned[code] ?? [null];
      expect(rows.map((row) => row.reason), `${code} carries the wrong texts`).toEqual(
        [...expected],
      );
      // PASSWORD_UNCHANGED's row is itself the declared reserved placement; no
      // other code carries a §6 row and a second placement.
      if (elsewhere !== undefined) {
        expect(code, `${code} carries both a §6 row and another placement`).toBe(
          'PASSWORD_UNCHANGED',
        );
      }
    }
  });

  it('declares each single-text code with no reason and each multi-text code with every reason once', () => {
    for (const code of authErrorCodes) {
      const rows = codeRows.filter((row) => row.code === code);
      if (rows.length === 0) continue;
      const expected = reasoned[code];
      if (expected === undefined) {
        expect(
          rows.every((row) => row.reason === null),
          `${code} carries a reason it does not declare`,
        ).toBe(true);
        expect(rows.length, `${code} carries more than one text`).toBe(1);
        continue;
      }
      expect(rows.map((row) => row.reason)).toEqual([...expected]);
      expect(new Set(rows.map((row) => row.reason)).size, `${code} duplicates a reason`).toBe(
        expected.length,
      );
    }
  });

  it('keeps a non-code row to the two declared successes', () => {
    expect(nonCodeRows.map((row) => row.label).sort()).toEqual(
      [...declaredNonCodeLabels].sort(),
    );
    for (const row of nonCodeRows) {
      expect(row.where.length, `${row.label} has no surface`).toBeGreaterThan(0);
    }
  });

  it('gives every row a where that names a page, a state, or a declared absence', () => {
    for (const row of messageRows) {
      expect(row.where.length, `${row.label} has an empty Where`).toBeGreaterThan(0);
      expect(
        whereVocabulary.some((token) =>
          row.where.toLowerCase().includes(token.toLowerCase()),
        ),
        `${row.label}'s Where names no page, state, or declared absence: ${row.where}`,
      ).toBe(true);
    }
  });

  it('keeps PASSWORD_UNCHANGED’s row with its reserved absence stated', () => {
    const row = codeRows.find((candidate) => candidate.code === 'PASSWORD_UNCHANGED');
    expect(row).toBeDefined();
    expect(row?.where).toContain('no R1 page renders it');
    expect(row?.where).toContain('R13');
  });

  it('states the ended-session codes in §8.4 rather than as page messages', () => {
    const section = endedSessionSection();
    for (const code of ['SESSION_ENDED', 'ACCOUNT_BLOCKED'] as const) {
      expect(section).toContain(`\`${code}\``);
    }
    // The two variants are the state's whole table.
    expect(section).toContain('| `ended` |');
    expect(section).toContain('| `blocked` |');
  });

  it('names the R13 surface and the four none placements in the completeness paragraph', () => {
    const section = flat(messagesSection());
    expect(section).toContain('PASSWORD_CHANGE_REQUIRED');
    expect(section).toContain('administrator application');
    for (const code of [
      'CSRF_FAILED',
      'PAYLOAD_TOO_LARGE',
      'METHOD_NOT_ALLOWED',
      'NOT_FOUND',
    ] as const) {
      expect(section).toContain(`\`${code}\``);
    }
    // The paragraph is the one place the absence is declared.
    const none = section.slice(section.indexOf('render no state and carry no'));
    for (const code of [
      'CSRF_FAILED',
      'PAYLOAD_TOO_LARGE',
      'METHOD_NOT_ALLOWED',
      'NOT_FOUND',
    ] as const) {
      expect(none).toContain(`\`${code}\``);
    }
  });

  it('carries one Arabic text per row and composes no sentence', () => {
    for (const row of messageRows) {
      expect(row.text.length, `${row.label} has no text`).toBeGreaterThan(0);
      // Arabic letters, Arabic punctuation, Latin digits, the +218 prefix, and
      // the token SMS are the only characters a row may carry (SC-008's
      // language limb; T100 owns the full scan).
      expect(row.text).toMatch(/[\u0621-\u064A]/);
    }
  });
});

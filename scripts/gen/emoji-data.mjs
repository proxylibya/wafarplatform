#!/usr/bin/env node
// Generates the emoji range table from the vendored Unicode data. The runtime
// never reads the Unicode property escape: the predicate is built from this
// table, so its version is pinned and asserted (FR-026).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const version = '18.0.0';
const source = resolve(
  root,
  'packages/shared/vendor/unicode',
  version,
  'emoji-data.txt',
);
const target = resolve(
  root,
  'packages/shared/src/normalize/generated/emoji-data.ts',
);
const url = `https://www.unicode.org/Public/${version}/ucd/emoji/emoji-data.txt`;

const raw = readFileSync(source);
const digest = createHash('sha256').update(raw).digest('hex');
const text = raw.toString('utf8');

const ranges = [];
for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const withoutComment = line.split('#')[0] ?? '';
  const [field, property] = withoutComment.split(';').map((part) => part.trim());
  if (!field || property !== 'Extended_Pictographic') continue;
  const [start, end] = field.split('..');
  const from = Number.parseInt(start, 16);
  const to = end === undefined ? from : Number.parseInt(end, 16);
  ranges.push([from, to]);
}

ranges.sort((a, b) => a[0] - b[0]);

const body = `// Generated from Unicode ${version} emoji-data.txt. Do not edit by hand:
// run \`node scripts/gen/emoji-data.mjs\` to regenerate (FR-026).

export const EMOJI_DATA_VERSION = '${version}';
export const EMOJI_DATA_URL = '${url}';
export const EMOJI_DATA_SHA256 = '${digest}';
export const EMOJI_DATA_RANGE_COUNT = ${ranges.length};

/** Inclusive code-point ranges carrying Extended_Pictographic. */
export const EXTENDED_PICTOGRAPHIC_RANGES: ReadonlyArray<readonly [number, number]> = [
${ranges.map(([from, to]) => `  [0x${from.toString(16).toUpperCase()}, 0x${to.toString(16).toUpperCase()}],`).join('\n')}
];
`;

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current !== body) {
    console.error('emoji-data.ts is stale; run node scripts/gen/emoji-data.mjs');
    process.exit(1);
  }
  console.log(`emoji-data.ts is current (${ranges.length} ranges, ${digest}).`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body, 'utf8');
  console.log(
    `Wrote ${target}: ${ranges.length} Extended_Pictographic ranges, sha256 ${digest}.`,
  );
}

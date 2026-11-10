// Converts the vendored SecLists top-100,000 password list into the lowercase
// SHA-256 digest file the password policy reads. The source file is not
// committed; the digest file is, with its SOURCE note beside it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/gen/breached-passwords.mjs <sec-top-100k.txt>');
  process.exit(1);
}

const raw = readFileSync(source, 'utf8');
const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
const digests = lines.map((line) =>
  createHash('sha256').update(line.toLowerCase()).digest('hex'),
);
const unique = [...new Set(digests)].sort();

const target = resolve('apps/api/src/modules/auth/data/breached-passwords.sha256');
writeFileSync(target, `${unique.join('\n')}\n`, 'utf8');
console.log(`Wrote ${target}: ${unique.length} unique digests.`);

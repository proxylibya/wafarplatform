#!/usr/bin/env node
// Module-responsibility header check: every production module file opens with a
// one-line header naming its single responsibility, and never repeats the
// owning feature (the Ownership Map records that once).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['apps', 'packages'];
const SOURCE = /\.(ts|vue|mjs)$/;
const SKIP = [
  'node_modules',
  'dist',
  'build',
  '.nuxt',
  '.output',
  'coverage',
  '.turbo',
  'migrations',
  'vendor',
  'tests',
  'test',
  '__tests__',
];

const HEADER = /^(?:#![^\n]*\n)?\/\/ [A-Z][^\n]{10,}\n/;
const HEADER_VUE = /^<!-- [A-Z][^\n]{10,} -->\n/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.includes(entry)) continue;
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) out.push(...walk(path));
    else if (SOURCE.test(entry)) out.push(path);
  }
  return out;
}

const files = [];
for (const root of ROOTS) {
  try {
    files.push(...walk(root));
  } catch {
    // A workspace that does not exist yet contributes no files.
  }
}
try {
  files.push(...walk('scripts'));
} catch {
  // Optional.
}

const missing = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const isVue = file.endsWith('.vue');
  const first = isVue ? HEADER_VUE : HEADER;
  const body = isVue && source.startsWith('<script') ? source : source;
  if (!first.test(body)) missing.push(relative(process.cwd(), file));
}

if (missing.length > 0) {
  console.error('Module files without a responsibility header:');
  for (const file of missing) console.error(`  - ${file}`);
  process.exit(1);
}

console.log(`Module headers ok: ${files.length} files carry a responsibility header.`);

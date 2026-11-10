#!/usr/bin/env node
// Stamps `schema-version.ts` with the SHA-256 of the migration journal and the
// applied-step count. The boot guard compares the database with this value, so
// the expected version is generated from the same increment as the schema.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const journalPath = resolve('packages/db/migrations/meta/_journal.json');
const raw = readFileSync(journalPath);
const journal = JSON.parse(raw.toString('utf8'));
const steps = journal.entries.length;
const digest = createHash('sha256').update(raw).digest('hex');

const body = `// Generated from packages/db/migrations/meta/_journal.json. Do not edit by
// hand: run \`pnpm --filter @wafar/db stamp-version\` after a migration lands.

export const EXPECTED_SCHEMA_SHA256 = '${digest}';
export const EXPECTED_SCHEMA_STEPS = ${steps};
export const SCHEMA_VERSION = '${digest.slice(0, 12)}:${steps}';
`;

const target = resolve('packages/db/schema-version.ts');
writeFileSync(target, body, 'utf8');
console.log(`schema-version.ts: ${digest.slice(0, 12)}:${steps}`);

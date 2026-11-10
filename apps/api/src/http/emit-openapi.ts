// Emits `apps/api/openapi.json` from the generator. Run by `pnpm --filter
// @wafar/api openapi` whenever a route or contract schema lands.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOpenApiDocument } from './openapi.ts';

const document = buildOpenApiDocument();
const target = resolve('openapi.json');
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
console.log(`Wrote ${target}`);

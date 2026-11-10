#!/usr/bin/env node
// Runs @cyclonedx/cyclonedx-npm with the pnpm-aware npm shim, so the SBOM is
// generated from the workspace tree rather than failing on pnpm's `ls --all`.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shim = resolve(here, 'npm-shim.mjs');
const cli = resolve(
  here,
  '..',
  '..',
  'node_modules',
  '@cyclonedx',
  'cyclonedx-npm',
  'bin',
  'cyclonedx-npm-cli.js',
);

const result = spawnSync(
  process.execPath,
  [cli, '--output-file', 'sbom.cdx.json', '--output-format', 'JSON'],
  {
    stdio: 'inherit',
    env: { ...process.env, npm_execpath: shim },
  },
);
process.exit(result.status ?? 1);

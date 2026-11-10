#!/usr/bin/env node
// An npm-compatible `ls` shim for @cyclonedx/cyclonedx-npm on a pnpm
// workspace: the tool runs `npm ls --json --long --all`, but pnpm 10 returns
// one entry per workspace and keeps dev dependencies in a separate field. This
// shim folds the workspace entries into the single object the tool expects.
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
if (args.includes('--version')) {
  process.stdout.write('10.18.3\n');
  process.exit(0);
}
if (!args.includes('ls')) {
  process.stderr.write(`unsupported npm invocation: ${args.join(' ')}\n`);
  process.exit(1);
}

const raw = execSync('pnpm -r ls --json --long --depth Infinity', {
  encoding: 'utf8',
  maxBuffer: 512 * 1024 * 1024,
});
const entries = JSON.parse(raw);

function fold(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const dependencies = {
    ...(entry.dependencies ?? {}),
    ...(entry.devDependencies ?? {}),
    ...(entry.optionalDependencies ?? {}),
  };
  for (const [name, dependency] of Object.entries(dependencies)) {
    if (dependency && typeof dependency === 'object') {
      dependency.name ??= name;
      fold(dependency);
    }
  }
  entry.dependencies = dependencies;
  delete entry.devDependencies;
  delete entry.optionalDependencies;
  return entry;
}

const root =
  entries.find((entry) => entry?.name === 'wafar') ??
  entries.find((entry) => typeof entry?.path === 'string' && entry.path.length > 0) ??
  {};
fold(root);
root.dependencies ??= {};
for (const entry of entries) {
  if (entry === root || !entry || typeof entry !== 'object') continue;
  fold(entry);
  if (typeof entry.path === 'string' && entry.path.length > 0 && entry.name) {
    root.dependencies[entry.name] ??= entry;
  }
  for (const [name, dependency] of Object.entries(entry.dependencies ?? {})) {
    if (dependency && typeof dependency === 'object') dependency.name ??= name;
    root.dependencies[name] ??= dependency;
  }
}
process.stdout.write(JSON.stringify(root));

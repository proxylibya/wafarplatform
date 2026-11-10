#!/usr/bin/env node
// Dependency budget check: every workspace keeps at most 30 direct runtime
// dependencies and the repository at most 60, counting `dependencies` only.
// A `devDependencies` entry is a build-time tool and is not counted.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PER_WORKSPACE = 30;
const REPOSITORY = 60;

const roots = ['apps', 'packages'];
const workspaces = [];

for (const root of roots) {
  let entries = [];
  try {
    entries = readdirSync(root);
  } catch {
    continue;
  }
  for (const entry of entries) {
    const dir = join(root, entry);
    if (!statSync(dir).isDirectory()) continue;
    const manifest = join(dir, 'package.json');
    try {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      workspaces.push({ dir, name: pkg.name ?? dir, deps: Object.keys(pkg.dependencies ?? {}) });
    } catch {
      // A directory without a manifest is not a workspace.
    }
  }
}

const failures = [];
let total = 0;

for (const workspace of workspaces) {
  total += workspace.deps.length;
  if (workspace.deps.length > PER_WORKSPACE) {
    failures.push(
      `${workspace.name}: ${workspace.deps.length} runtime dependencies (limit ${PER_WORKSPACE})`,
    );
  }
}

if (total > REPOSITORY) {
  failures.push(`repository: ${total} runtime dependencies (limit ${REPOSITORY})`);
}

if (failures.length > 0) {
  console.error('Dependency budget exceeded:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Dependency budget ok: ${workspaces.length} workspaces, ${total} runtime dependencies ` +
    `(repository limit ${REPOSITORY}, workspace limit ${PER_WORKSPACE}).`,
);

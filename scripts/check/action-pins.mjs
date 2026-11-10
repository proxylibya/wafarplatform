// The supply-chain pin check (T193): every GitHub Action the CI workflow uses is
// pinned by a full commit SHA, with its version recorded in a comment. A
// floating tag would let an upstream move run unreviewed code in this pipeline.
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const dependabot = readFileSync('.github/dependabot.yml', 'utf8');
const problems = [];

const uses = [...workflow.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)\s*(?:#\s*(\S+))?/gm)];
if (uses.length === 0) {
  problems.push('ci.yml: no `uses:` entry was found');
}

for (const match of uses) {
  const reference = match[1] ?? '';
  const version = match[2];
  const at = reference.lastIndexOf('@');
  if (at === -1) {
    problems.push(`ci.yml: ${reference} carries no ref`);
    continue;
  }
  const action = reference.slice(0, at);
  const ref = reference.slice(at + 1);
  if (!/^[0-9a-f]{40}$/.test(ref)) {
    problems.push(`ci.yml: ${action} uses the floating ref ${ref}`);
  }
  if (version === undefined || !/^v\d/.test(version)) {
    problems.push(`ci.yml: ${action} does not record its version in a comment`);
  }
}

if (!/package-ecosystem:\s*github-actions/.test(dependabot)) {
  problems.push('dependabot.yml: the github-actions ecosystem is not configured');
}

if (problems.length > 0) {
  console.error('GitHub Actions are not pinned:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Action pins ok: ${uses.length} use(s), every one at a full commit SHA with its version beside it.`,
);

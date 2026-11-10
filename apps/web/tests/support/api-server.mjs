// The test wrapper that runs the API for the end-to-end suites and mirrors its
// console to a file, so a test can read the fake transport's structured line
// (quickstart.md §2.1). It is test infrastructure: the API's own logging is
// unchanged, and nothing in the product reads this file.
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const logPath = fileURLToPath(new URL('../.artifacts/api.log', import.meta.url));
const apiRoot = fileURLToPath(new URL('../../../../apps/api/', import.meta.url));

mkdirSync(dirname(logPath), { recursive: true });
writeFileSync(logPath, '');

const child = spawn(
  process.execPath,
  ['dist/index.js'],
  {
    cwd: apiRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

function relay(stream, target) {
  stream.on('data', (chunk) => {
    appendFileSync(logPath, chunk);
    target.write(chunk);
  });
}

relay(child.stdout, process.stdout);
relay(child.stderr, process.stderr);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    child.kill();
    process.exit(0);
  });
}

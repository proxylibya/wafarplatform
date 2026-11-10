// Vendors both IconPark cuts into packages/ui/vendor and pins each by SHA-256.
// Upstream is archived (ADR-098): the copy is the project's, and a missing icon
// is added by decision record.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const cuts = [
  { name: 'icon-park-outline', package: '@iconify-json/icon-park-outline' },
  { name: 'icon-park', package: '@iconify-json/icon-park' },
];

for (const cut of cuts) {
  const source = resolve(`node_modules/.pnpm/${findDir(cut.package)}/node_modules/${cut.package}/icons.json`);
  const data = JSON.parse(readFileSync(source, 'utf8'));
  const target = resolve(`packages/ui/vendor/${cut.name}`);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  const names = Object.keys(data.icons).sort();
  const digest = createHash('sha256');
  for (const name of names) {
    const body = data.icons[name].body;
    writeFileSync(join(target, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${data.width} ${data.height}">${body}</svg>\n`);
    digest.update(name).update(body);
  }
  writeFileSync(
    join(target, 'SHA256SUMS'),
    `${digest.copy().digest('hex')}  ${names.length} icons\n`,
  );
  writeFileSync(
    join(target, 'LICENCE.txt'),
    [
      'IconPark — Apache License 2.0',
      'Copyright 2020 ByteDance.',
      'The set is vendored and pinned; upstream is archived (ADR-098).',
      'Neither cut is modified.',
      '',
      `Icon count: ${names.length}`,
      '',
    ].join('\n'),
  );
  console.log(`${cut.name}: ${names.length} icons`);
}

function findDir(name) {
  const root = 'node_modules/.pnpm';
  for (const entry of readdirSync(root)) {
    if (entry.startsWith(`${name.replace('/', '+')}@`)) return entry;
  }
  throw new Error(`vendored source not installed: ${name}`);
}

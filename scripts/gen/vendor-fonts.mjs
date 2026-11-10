// Vendors the layer's self-hosted typefaces: IBM Plex Sans Arabic (arabic and
// latin subsets) and IBM Plex Mono (latin), each WOFF2 with its OFL-1.1 record.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('packages/ui/app/assets/fonts');
mkdirSync(root, { recursive: true });

const wanted = [
  { pkg: 'ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-arabic-400-normal.woff2' },
  { pkg: 'ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-arabic-600-normal.woff2' },
  { pkg: 'ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-arabic-700-normal.woff2' },
  { pkg: 'ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-latin-400-normal.woff2' },
  { pkg: 'ibm-plex-mono', file: 'ibm-plex-mono-latin-400-normal.woff2' },
  { pkg: 'ibm-plex-mono', file: 'ibm-plex-mono-latin-600-normal.woff2' },
];

for (const font of wanted) {
  copyFileSync(
    resolve(`node_modules/@fontsource/${font.pkg}/files/${font.file}`),
    join(root, font.file),
  );
}

const licence = readFileSync(resolve('node_modules/@fontsource/ibm-plex-sans-arabic/LICENSE'), 'utf8');
writeFileSync(
  join(root, 'OFL-1.1.txt'),
  [
    'IBM Plex Sans Arabic and IBM Plex Mono',
    'Copyright 2017 IBM Corp. All rights reserved.',
    'SIL Open Font License, Version 1.1',
    '',
    licence,
  ].join('\n'),
);

console.log(`Vendored ${wanted.length} WOFF2 files and the OFL-1.1 record.`);

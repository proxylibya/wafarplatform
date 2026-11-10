// Copies the API's non-TypeScript runtime assets into `dist`, so the production
// artifact carries the vendored breached-password list beside the compiled
// loader that reads it (T200; FR-035).
import { cpSync, existsSync } from 'node:fs';

const assets = [['src/modules/auth/data', 'dist/modules/auth/data']];

for (const [from, to] of assets) {
  if (!existsSync(from)) {
    console.error(`Build asset missing: ${from}`);
    process.exit(1);
  }
  cpSync(from, to, { recursive: true });
  console.log(`Copied ${from} -> ${to}`);
}

// Stamps the reference datasets with the digest of their own payload. The test
// asserts the digest, so an edited entry without a restamp fails (FR-005).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

function restamp(path, payloadKey) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const digest = createHash('sha256')
    .update(JSON.stringify(data[payloadKey]))
    .digest('hex');
  data.sha256 = digest;
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`${path}: ${digest}`);
}

restamp('packages/shared/src/reference/libyan-cities.json', 'entries');
restamp('packages/shared/src/reference/libyan-mobile-prefixes.json', 'prefixes');

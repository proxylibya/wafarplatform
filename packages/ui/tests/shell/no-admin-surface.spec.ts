// This slice ships no administrator surface: no administrator page, route, or
// component exists, and the administrator application's header binding is
// recorded in the layer's README (FR-050, AC-054; T110, T114).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const webApp = resolve('apps/web/app');

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else out.push(path);
  }
  return out;
}

describe('the administrator surface', () => {
  it('is not shipped by R1', () => {
    const sources = files(webApp);
    expect(sources.filter((file) => /admin/i.test(file))).toEqual([]);
    const pages = files(join(webApp, 'pages')).map((file) => file.replace(/\\/g, '/'));
    expect(pages.every((file) => file.includes('/auth/'))).toBe(true);
  });

  it('records the administrator header binding in the layer’s README', () => {
    const readme = readFileSync(resolve('packages/ui/app/components/shell/README.md'), 'utf8');
    expect(readme).toContain('logo at the inline-start edge');
    expect(readme).toContain('تسجيل الخروج');
    expect(readme).toContain('R13');
  });
});

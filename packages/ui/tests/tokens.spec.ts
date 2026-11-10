// The token contract test: every recorded token name and value, so a page that
// invents a colour, a size, or a duration fails here (FR-025, AC-027, AC-024).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('packages/ui/app/assets/css/tokens.css', 'utf8');

function value(name: string): string | null {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return match?.[1]?.trim() ?? null;
}

describe('the Precision token contract', () => {
  it('records the light primary of ADR-128 §2', () => {
    expect(value('--wf-primary')).toBe('oklch(55.3% 0.195 38.402)');
  });

  it('records the four light surfaces and the two borders', () => {
    expect(value('--wf-surface')).toBe('#ffffff');
    expect(value('--wf-surface-muted')).toBe('#f6f7f8');
    expect(value('--wf-surface-sunken')).toBe('#eef0f3');
    expect(value('--wf-surface-inverse')).toBe('#101418');
    expect(value('--wf-border')).toBe('#e4e7eb');
    expect(value('--wf-border-subtle')).toBe('#f1f3f5');
  });

  it('records the type scale and the two families', () => {
    expect(value('--wf-text-2xl')).toBe('1.5rem');
    expect(value('--wf-font-sans')).toContain('IBM Plex Sans Arabic');
    expect(value('--wf-font-mono')).toContain('IBM Plex Mono');
  });

  it('records the shape and the measurements of ADR-128 §4 and §5', () => {
    expect(value('--wf-radius')).toBe('0.125rem');
    expect(value('--wf-header-height')).toBe('3.5rem');
    expect(value('--wf-sidebar-width')).toBe('15rem');
    expect(value('--wf-rail-width')).toBe('4.25rem');
    expect(value('--wf-content-max')).toBe('88rem');
    expect(value('--wf-footer-height')).toBe('3.5rem');
    expect(value('--wf-bottom-bar-height')).toBe('60px');
    expect(value('--wf-raised-action')).toBe('56px');
    expect(value('--wf-icon-size')).toBe('20px');
  });

  it('records the focus ring, the motion scale, and the loading rule', () => {
    expect(value('--wf-focus-width')).toBe('2px');
    expect(value('--wf-duration-fast')).toBe('120ms');
    expect(value('--wf-loading-delay')).toBe('120ms');
    expect(value('--wf-loading-minimum')).toBe('300ms');
    expect(value('--wf-shimmer-angle')).toBe('90deg');
  });

  it('records the touch floor and a z-index scale', () => {
    expect(value('--wf-touch-floor')).toBe('44px');
    expect(value('--wf-z-header')).toBe('20');
    expect(value('--wf-z-drawer')).toBe('30');
    expect(value('--wf-z-overlay')).toBe('40');
  });

  it('defaults to light and carries a dark override', () => {
    expect(css).toContain(":root[data-appearance='dark']");
  });
});

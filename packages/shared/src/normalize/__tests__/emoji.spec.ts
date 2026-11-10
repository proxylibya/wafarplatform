// Unit test the emoji predicate's version, digest, range table, and the
// characters it must and must not refuse (FR-026).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EMOJI_DATA_RANGE_COUNT,
  EMOJI_DATA_SHA256,
  EMOJI_DATA_URL,
  EMOJI_DATA_VERSION,
} from '../generated/emoji-data.ts';
import { codePointLength, hasEmoji } from '../emoji.ts';

describe('the emoji predicate', () => {
  it('pins the Unicode version and the vendored file', () => {
    expect(EMOJI_DATA_VERSION).toBe('18.0.0');
    expect(EMOJI_DATA_URL).toContain('/18.0.0/');
    const raw = readFileSync(
      resolve('packages/shared/vendor/unicode/18.0.0/emoji-data.txt'),
    );
    expect(createHash('sha256').update(raw).digest('hex')).toBe(EMOJI_DATA_SHA256);
    expect(EMOJI_DATA_RANGE_COUNT).toBeGreaterThan(400);
  });

  it('accepts Arabic letters and bare numerals', () => {
    expect(hasEmoji('محمد الأمين')).toBe(false);
    expect(hasEmoji('1234567890')).toBe(false);
    expect(hasEmoji('١٢٣')).toBe(false);
  });

  it('refuses an Extended_Pictographic code point', () => {
    expect(hasEmoji('قطع 🚗')).toBe(true);
    expect(hasEmoji('✅')).toBe(true);
  });

  it('refuses the variation selector and the keycap sequence', () => {
    expect(hasEmoji('❤\uFE0F')).toBe(true);
    expect(hasEmoji('1\uFE0F\u20E3')).toBe(true);
    expect(hasEmoji('\u20E3')).toBe(true);
  });

  it('refuses a flag sequence', () => {
    expect(hasEmoji('🇱🇾')).toBe(true);
  });

  it('counts code points, not UTF-16 units', () => {
    expect(codePointLength('محمد')).toBe(4);
    expect(codePointLength('🚗')).toBe(1);
  });
});

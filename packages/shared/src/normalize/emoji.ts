// The emoji predicate FR-026 fixes: a code point with Extended_Pictographic, the
// variation selector U+FE0F, or the keycap U+20E3. It reads the pinned range
// table, never the runtime's property escape.
import { EXTENDED_PICTOGRAPHIC_RANGES } from './generated/emoji-data.ts';

const VARIATION_SELECTOR_16 = 0xfe0f;
const COMBINING_KEYCAP = 0x20e3;
// A flag sequence is a pair of regional indicators. The pinned table carries
// them as `Emoji` rather than `Extended_Pictographic`, and the predicate refuses
// the pair as a flag, as FR-026's refusal of emoji requires (T034).
const REGIONAL_INDICATOR_FROM = 0x1f1e6;
const REGIONAL_INDICATOR_TO = 0x1f1ff;

function isExtendedPictographic(codePoint: number): boolean {
  let low = 0;
  let high = EXTENDED_PICTOGRAPHIC_RANGES.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const entry = EXTENDED_PICTOGRAPHIC_RANGES[middle];
    if (entry === undefined) return false;
    const [from, to] = entry;
    if (codePoint < from) high = middle - 1;
    else if (codePoint > to) low = middle + 1;
    else return true;
  }
  return false;
}

/** True when the value carries an emoji, a U+FE0F selector, or a keycap. */
export function hasEmoji(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    if (codePoint === VARIATION_SELECTOR_16 || codePoint === COMBINING_KEYCAP) {
      return true;
    }
    if (codePoint >= REGIONAL_INDICATOR_FROM && codePoint <= REGIONAL_INDICATOR_TO) {
      return true;
    }
    if (isExtendedPictographic(codePoint)) return true;
  }
  return false;
}

/** Code points of a value, so a length bound counts code points, not UTF-16 units. */
export function codePointLength(value: string): number {
  let count = 0;
  for (const _ of value) count += 1;
  return count;
}

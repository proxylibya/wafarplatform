// The normalize module's public surface.
export { normalizeArabic, toLatinDigits } from './arabic.ts';
export { hasEmoji, codePointLength } from './emoji.ts';
export { normalizePhone, formatPhoneForDisplay, isCanonicalPhone } from './phone.ts';
export type { NormalizedPhone } from './phone.ts';
export { normalizeCode } from './code.ts';
export {
  EMOJI_DATA_VERSION,
  EMOJI_DATA_URL,
  EMOJI_DATA_SHA256,
  EMOJI_DATA_RANGE_COUNT,
} from './generated/emoji-data.ts';

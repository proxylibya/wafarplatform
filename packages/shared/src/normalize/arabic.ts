// Arabic text normalization shared by the number, code, and city searches: the
// Arabic-Indic and Eastern Arabic-Indic digits map to Latin, and diacritics and
// alef/ya/ta-marbuta variants fold for matching. Storage is untouched.

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';
const LATIN = '0123456789';

const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const DIGIT_MAP = new Map<string, string>();
for (let index = 0; index < 10; index += 1) {
  DIGIT_MAP.set(ARABIC_INDIC[index] as string, LATIN[index] as string);
  DIGIT_MAP.set(EASTERN_ARABIC_INDIC[index] as string, LATIN[index] as string);
}

/** Maps every Arabic-Indic and Eastern Arabic-Indic digit to its Latin digit. */
export function toLatinDigits(value: string): string {
  let result = '';
  for (const character of value) {
    result += DIGIT_MAP.get(character) ?? character;
  }
  return result;
}

/** Folds a value for diacritic- and variant-insensitive comparison. */
export function normalizeArabic(value: string): string {
  return toLatinDigits(value.normalize('NFC'))
    .replace(TASHKEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئء]/g, (match) => (match === 'ء' ? 'ء' : match === 'ؤ' ? 'و' : 'ي'))
    .replace(/\s+/g, ' ')
    .trim();
}

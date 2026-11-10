// The mobile number's one normalization: separators ignored, Arabic-Indic
// digits mapped, a country code read once, and a listed Libyan prefix plus nine
// national digits required (FR-003, FR-031, FR-042).
import { toLatinDigits } from './arabic.ts';
import prefixes from '../reference/libyan-mobile-prefixes.json' with { type: 'json' };

const LISTED = new Set<string>(prefixes.prefixes);

export interface NormalizedPhone {
  /** E.164 form, `+218` followed by the nine national digits. */
  readonly e164: string;
  /** The nine national significant digits. */
  readonly national: string;
}

/**
 * Normalizes a submitted number, or returns null when it is not a listed Libyan
 * mobile number. A landline and an unlisted prefix are both null.
 */
export function normalizePhone(input: string): NormalizedPhone | null {
  let value = toLatinDigits(input).replace(/[^\d+]/g, '');

  if (value.startsWith('+')) value = value.slice(1);
  if (value.startsWith('00218')) value = value.slice(5);
  else if (value.startsWith('218') && value.length > 9) value = value.slice(3);

  while (value.startsWith('0')) value = value.slice(1);
  if (value.length !== 9) return null;

  const prefix = value.slice(0, 2);
  if (!LISTED.has(prefix)) return null;
  if (!/^\d{9}$/.test(value)) return null;

  return { e164: `+218${value}`, national: value };
}

/** FR-038's display form: `+218 91 234 5678`. */
export function formatPhoneForDisplay(e164: string): string {
  const national = e164.replace(/^\+218/, '');
  if (national.length !== 9) return e164;
  return `+218 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

/** True when the value is already the canonical E.164 form. */
export function isCanonicalPhone(value: string): boolean {
  return /^\+218\d{9}$/.test(value);
}

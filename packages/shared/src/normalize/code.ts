// The one-time code's normalization: separators ignored, Arabic-Indic digits
// mapped, and exactly six digits required (FR-003, FR-034, CMV 18).
import { toLatinDigits } from './arabic.ts';
import { otpLength } from '../limits.ts';

/** Normalizes a submitted code, or returns null when it is not six digits. */
export function normalizeCode(input: string): string | null {
  const value = toLatinDigits(input).replace(/[\s-]/g, '');
  if (value.length !== otpLength) return null;
  if (!/^\d+$/.test(value)) return null;
  return value;
}

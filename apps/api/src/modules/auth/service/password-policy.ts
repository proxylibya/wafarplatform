// The password policy and the scrypt profile of CMV 2: the hash form, the
// three refusal reasons, and the vendored breached-password membership test
// (FR-035, AC-037).
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  codePointLength,
  passwordMaxLength,
  passwordMinLength,
  scryptKeyLength,
  scryptN,
  scryptP,
  scryptPrefix,
  scryptR,
  scryptSaltBytes,
} from '@wafar/shared';

const SCRYPT_OPTIONS = { N: scryptN, r: scryptR, p: scryptP, maxmem: 128 * 1024 * 1024 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, scryptKeyLength, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/** `$wafar$scrypt$32768$8$3$<salt>$<hash>`, the only form the store accepts. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(scryptSaltBytes);
  const key = await scrypt(password, salt);
  return `${scryptPrefix}${scryptN}$${scryptR}$${scryptP}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export interface ParsedHash {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
}

export function parseHash(stored: string): ParsedHash | null {
  if (!stored.startsWith(scryptPrefix)) return null;
  const parts = stored.slice(scryptPrefix.length).split('$');
  if (parts.length !== 5) return null;
  const [n, r, p, salt, key] = parts;
  if (n === undefined || r === undefined || p === undefined) return null;
  if (salt === undefined || key === undefined) return null;
  const parsed = {
    n: Number(n),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, 'hex'),
    key: Buffer.from(key, 'hex'),
  };
  if (!Number.isInteger(parsed.n) || parsed.n !== scryptN) return null;
  if (!Number.isInteger(parsed.r) || parsed.r !== scryptR) return null;
  if (!Number.isInteger(parsed.p) || parsed.p !== scryptP) return null;
  if (parsed.salt.length !== scryptSaltBytes) return null;
  if (parsed.key.length !== scryptKeyLength) return null;
  return parsed;
}

/** Verifies a password against a stored value; a weakened form verifies nothing. */
export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (stored === null) return false;
  const parsed = parseHash(stored);
  if (parsed === null) return false;
  const key = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      parsed.salt,
      scryptKeyLength,
      { N: parsed.n, r: parsed.r, p: parsed.p, maxmem: 128 * 1024 * 1024 },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived);
      },
    );
  });
  if (key.length !== parsed.key.length) return false;
  return timingSafeEqual(key, parsed.key);
}

/** The one-time code's hash: scrypt with the request id as salt (research R-09). */
export async function hashOneTimeCode(code: string, requestId: string): Promise<string> {
  const salt = createHash('sha256').update(`otp:${requestId}`).digest().subarray(0, 16);
  const key = await scrypt(code, salt);
  return `${scryptPrefix}${scryptN}$${scryptR}$${scryptP}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyOneTimeCode(
  code: string,
  stored: string,
  requestId: string,
): Promise<boolean> {
  const salt = createHash('sha256').update(`otp:${requestId}`).digest().subarray(0, 16);
  const parsed = parseHash(stored);
  if (parsed === null) return false;
  if (!parsed.salt.equals(salt)) return false;
  return verifyPassword(code, stored);
}

/** A constant decoy so an unknown number performs one verification (R-05). */
let decoy: Promise<string> | undefined;
export function decoyHash(): Promise<string> {
  decoy ??= hashPassword(randomBytes(32).toString('hex'));
  return decoy;
}

let breached: Set<string> | undefined;

const breachedListUrl = new URL('../data/breached-passwords.sha256', import.meta.url);
const breachedSourceUrl = new URL(
  '../data/breached-passwords.source.json',
  import.meta.url,
);

interface BreachedSource {
  uniqueDigests: number;
  sha256: string;
}

/**
 * Loads and verifies the vendored list once. A missing, truncated, or altered
 * file throws, so startup fails instead of a membership test silently passing
 * (FR-035; plan → CHK012; data-model.md → loaded once at boot).
 */
export function loadBreachedDigests(): Set<string> {
  if (breached !== undefined) return breached;
  let raw: string;
  let source: BreachedSource;
  try {
    raw = readFileSync(breachedListUrl, 'utf8');
    source = JSON.parse(readFileSync(breachedSourceUrl, 'utf8')) as BreachedSource;
  } catch {
    throw new Error(
      'The vendored breached-password list or its SOURCE record is missing or unreadable.',
    );
  }
  const digests = raw.split('\n').filter((line) => line.length === 64);
  if (digests.length !== source.uniqueDigests) {
    throw new Error(
      `The vendored breached-password list holds ${digests.length} digests, and its SOURCE record fixes ${source.uniqueDigests}.`,
    );
  }
  const digest = createHash('sha256').update(raw, 'utf8').digest('hex');
  if (digest !== source.sha256) {
    throw new Error(
      `The vendored breached-password list does not match its SOURCE record's SHA-256 (${digest}).`,
    );
  }
  breached = new Set(digests);
  return breached;
}

/** The verified list's membership test; loaded once, never fetched. */
export function breachedDigests(): Set<string> {
  return loadBreachedDigests();
}

export function isBreachedPassword(password: string): boolean {
  const digest = createHash('sha256').update(password.toLowerCase()).digest('hex');
  return breachedDigests().has(digest);
}

export type PasswordRefusal = 'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_LONG' | 'PASSWORD_TOO_COMMON';

/** The three refusal reasons FR-035 fixes, in their order. */
export function checkPasswordPolicy(password: string): PasswordRefusal | null {
  const length = codePointLength(password);
  if (length < passwordMinLength) return 'PASSWORD_TOO_SHORT';
  if (length > passwordMaxLength) return 'PASSWORD_TOO_LONG';
  if (isBreachedPassword(password)) return 'PASSWORD_TOO_COMMON';
  return null;
}

/** SHA-256 hex of a resume token; high entropy, so no slow hash (data-model §7). */
export function hashResumeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

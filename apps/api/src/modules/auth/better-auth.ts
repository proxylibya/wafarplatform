// The better-auth 1.7.18 configuration: the phone-number extension, the scrypt
// hooks of CMV row 2, the reserved placeholder email, the R1 columns the
// session policy adds, and no mounted library HTTP handler - the module owns its
// routes and calls the library server-side (FR-004, FR-035, CMV 2; ADR-151).
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import type { Database } from '@wafar/db';
import { hashPassword, verifyPassword } from './service/password-policy.ts';

export interface BetterAuthOptions {
  /** The client the library's adapter writes through. */
  db: Database;
  secret: string;
  baseUrl: string;
  /** The one-time code's dispatch, supplied by the SMS port. */
  sendOtp: (input: { phoneNumber: string; code: string }) => Promise<void>;
}

export function createBetterAuth(options: BetterAuthOptions) {
  return betterAuth({
    secret: options.secret,
    baseURL: options.baseUrl,
    database: drizzleAdapter(options.db, {
      provider: 'pg',
      usePlural: false,
    }),
    emailAndPassword: {
      enabled: true,
      password: {
        hash: (password: string) => hashPassword(password),
        verify: (input: { hash: string; password: string }) =>
          verifyPassword(input.password, input.hash),
      },
    },
    user: {
      modelName: 'users',
      fields: {
        name: 'fullName',
        emailVerified: 'emailVerified',
      },
      // The profile's city is required in the domain, but better-auth's own
      // user schema does not know it; without this declaration the 1.7 schema
      // check refuses every insert that omits a NOT NULL column the library
      // never writes (the app writes it through the users repository).
      additionalFields: {
        city: { type: 'string', required: true },
      },
    },
    // The library's model names point at the tables the first migration
    // declares, so the adapter resolves `account` and `verification` too.
    account: { modelName: 'accounts' },
    verification: { modelName: 'verifications' },
    session: {
      modelName: 'sessions',
      // The library's sliding update is disabled: the absolute lifetime is 12 h
      // and the inactivity clock is the module's (CMV 4, research R-04).
      expiresIn: 12 * 60 * 60,
      updateAge: 12 * 60 * 60,
      // The three columns the session policy adds to the library's row: the
      // inactivity clock and the tombstone pair (ADR-154). Declared here so the
      // adapter maps them, and written only by this module.
      additionalFields: {
        lastActivityAt: { type: 'date', required: false },
        revokedAt: { type: 'date', required: false },
        revokedReason: { type: 'string', required: false },
      },
    },
    plugins: [
      phoneNumber({
        sendOTP: ({ phoneNumber: number, code }) =>
          options.sendOtp({ phoneNumber: number, code }),
      }),
    ],
    advanced: {
      cookiePrefix: 'wafar',
      // The API verifies the CSRF pair in its own middleware (T019).
      disableCSRFCheck: true,
    },
  });
}

export type WafarAuth = ReturnType<typeof createBetterAuth>;

// The `auth` module's schema: the credential row, the session, the library's
// declared verification placeholder, and the rate-limit counters, with every
// constraint and index of data-model.md §5, §6, §8, and §9.
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users.ts';

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    password: text('password'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      precision: 3,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      precision: 3,
    }),
    scope: text('scope'),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('accounts_provider_account_key').on(table.providerId, table.accountId),
    index('accounts_user_id_idx').on(table.userId),
    check(
      'accounts_password_form',
      sql`${table.password} IS NULL OR ${table.password} LIKE '$wafar$scrypt$%'`,
    ),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, precision: 3 }).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, precision: 3 }),
    revokedReason: text('revoked_reason'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('sessions_token_key').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_revoked_at_idx')
      .on(table.revokedAt)
      .where(sql`${table.revokedAt} IS NOT NULL`),
    index('sessions_expires_at_idx').on(table.expiresAt),
    check('sessions_token_length_check', sql`char_length(${table.token}) >= 32`),
    check(
      'sessions_revoked_reason_check',
      sql`${table.revokedReason} IS NULL OR ${table.revokedReason} IN ('sign_out', 'sign_out_all', 'password_change', 'blocked', 'platform_revocation', 'inactivity')`,
    ),
    check(
      'sessions_revoked_pair_check',
      sql`(${table.revokedAt} IS NULL) = (${table.revokedReason} IS NULL)`,
    ),
  ],
);

/** The adapter's declared model. No R1 path writes it; the suite asserts it empty. */
export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
);

export const rateLimitCounters = pgTable(
  'rate_limit_counters',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true, precision: 3 }).notNull(),
    count: integer('count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.windowStart] }),
    index('rate_limit_counters_expires_at_idx').on(table.expiresAt),
    check('rate_limit_counters_key_length', sql`char_length(${table.key}) <= 128`),
    check('rate_limit_counters_count_check', sql`${table.count} >= 0`),
  ],
);

export const accountRoles = ['merchant', 'administrator'] as const;
export const accountStatuses = ['active', 'blocked'] as const;
export const sessionRevocationReasons = [
  'sign_out',
  'sign_out_all',
  'password_change',
  'blocked',
  'platform_revocation',
  'inactivity',
] as const;
export const verificationPurposes = ['sign_up', 'recovery'] as const;
export const verificationStates = ['pending', 'verified'] as const;

// The `users` module's schema: the account and the transient pending-verification
// store, with every constraint and index of data-model.md §4 and §7.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    fullName: text('full_name').notNull(),
    /** The reserved non-routable sentinel: `<digits>@phone.invalid`. */
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    phoneNumber: text('phone_number').notNull(),
    phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
    city: text('city').notNull(),
    shopName: text('shop_name'),
    role: text('role').notNull().default('merchant'),
    status: text('status').notNull().default('active'),
    failedSignInCount: smallint('failed_sign_in_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true, precision: 3 }),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    monthlyUploadQuotaOverride: integer('monthly_upload_quota_override'),
    activeUploadQuotaOverride: integer('active_upload_quota_override'),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_phone_number_key').on(table.phoneNumber),
    uniqueIndex('users_email_key').on(table.email),
    check('users_full_name_not_blank', sql`btrim(${table.fullName}) <> ''`),
    check('users_full_name_length', sql`char_length(${table.fullName}) <= 100`),
    check('users_shop_name_length', sql`${table.shopName} IS NULL OR char_length(${table.shopName}) <= 100`),
    check('users_email_sentinel', sql`${table.email} LIKE '%@phone.invalid'`),
    check('users_role_check', sql`${table.role} IN ('merchant', 'administrator')`),
    check('users_status_check', sql`${table.status} IN ('active', 'blocked')`),
    check('users_failed_sign_in_count_check', sql`${table.failedSignInCount} >= 0`),
    check(
      'users_monthly_upload_quota_override_check',
      sql`${table.monthlyUploadQuotaOverride} IS NULL OR ${table.monthlyUploadQuotaOverride} BETWEEN 1 AND 500`,
    ),
    check(
      'users_active_upload_quota_override_check',
      sql`${table.activeUploadQuotaOverride} IS NULL OR ${table.activeUploadQuotaOverride} BETWEEN 1 AND 1500`,
    ),
  ],
);

export const phoneVerifications = pgTable(
  'phone_verifications',
  {
    id: text('id').primaryKey(),
    phoneNumber: text('phone_number').notNull(),
    purpose: text('purpose').notNull(),
    state: text('state').notNull().default('pending'),
    codeHash: text('code_hash').notNull(),
    /** The code an accepted resend superseded; it is refused, never counted. */
    previousCodeHash: text('previous_code_hash'),
    codeExpiresAt: timestamp('code_expires_at', {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    requestExpiresAt: timestamp('request_expires_at', {
      withTimezone: true,
      precision: 3,
    }).notNull(),
    incorrectEntries: smallint('incorrect_entries').notNull().default(0),
    reRequests: smallint('re_requests').notNull().default(0),
    resumeTokenHash: text('resume_token_hash').notNull(),
    fullName: text('full_name'),
    city: text('city'),
    shopName: text('shop_name'),
    passwordHash: text('password_hash'),
    verifiedAt: timestamp('verified_at', { withTimezone: true, precision: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('phone_verifications_phone_number_key').on(table.phoneNumber),
    index('phone_verifications_request_expires_at_idx').on(table.requestExpiresAt),
    check('phone_verifications_purpose_check', sql`${table.purpose} IN ('sign_up', 'recovery')`),
    check('phone_verifications_state_check', sql`${table.state} IN ('pending', 'verified')`),
    check(
      'phone_verifications_verified_recovery_only',
      sql`${table.state} <> 'verified' OR ${table.purpose} = 'recovery'`,
    ),
    check(
      'phone_verifications_incorrect_entries_check',
      sql`${table.incorrectEntries} BETWEEN 0 AND 5`,
    ),
    check('phone_verifications_re_requests_check', sql`${table.reRequests} BETWEEN 0 AND 3`),
    check(
      'phone_verifications_full_name_payload',
      sql`${table.purpose} = 'sign_up' OR ${table.fullName} IS NULL`,
    ),
    check(
      'phone_verifications_password_payload',
      sql`${table.purpose} = 'sign_up' OR ${table.passwordHash} IS NULL`,
    ),
    check(
      'phone_verifications_password_form',
      sql`${table.passwordHash} IS NULL OR ${table.passwordHash} LIKE '$wafar$scrypt$%'`,
    ),
    check(
      'phone_verifications_previous_code_form',
      sql`${table.previousCodeHash} IS NULL OR ${table.previousCodeHash} LIKE '$wafar$scrypt$%'`,
    ),
    check(
      'phone_verifications_verified_at_pair',
      sql`(${table.state} = 'verified') = (${table.verifiedAt} IS NOT NULL)`,
    ),
  ],
);

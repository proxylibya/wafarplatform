-- Down migration for 0001_identity_foundation. Generated SQL's exact inverse,
-- in reverse dependency order. Exercised in CI and staging before production.
DROP TABLE IF EXISTS "rate_limit_counters";
--> statement-breakpoint
DROP TABLE IF EXISTS "verifications";
--> statement-breakpoint
DROP TABLE IF EXISTS "sessions";
--> statement-breakpoint
DROP TABLE IF EXISTS "accounts";
--> statement-breakpoint
DROP TABLE IF EXISTS "users";
--> statement-breakpoint
DROP TABLE IF EXISTS "phone_verifications";

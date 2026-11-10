-- Down migration for 0002_identity_foundation_previous_code. Generated SQL's
-- exact inverse: the check goes with its column, and no stored code survives.
ALTER TABLE "phone_verifications" DROP CONSTRAINT IF EXISTS "phone_verifications_previous_code_form";
--> statement-breakpoint
ALTER TABLE "phone_verifications" DROP COLUMN IF EXISTS "previous_code_hash";

CREATE TABLE "phone_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"purpose" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"code_hash" text NOT NULL,
	"code_expires_at" timestamp (3) with time zone NOT NULL,
	"request_expires_at" timestamp (3) with time zone NOT NULL,
	"incorrect_entries" smallint DEFAULT 0 NOT NULL,
	"re_requests" smallint DEFAULT 0 NOT NULL,
	"resume_token_hash" text NOT NULL,
	"full_name" text,
	"city" text,
	"shop_name" text,
	"password_hash" text,
	"verified_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_verifications_purpose_check" CHECK ("phone_verifications"."purpose" IN ('sign_up', 'recovery')),
	CONSTRAINT "phone_verifications_state_check" CHECK ("phone_verifications"."state" IN ('pending', 'verified')),
	CONSTRAINT "phone_verifications_verified_recovery_only" CHECK ("phone_verifications"."state" <> 'verified' OR "phone_verifications"."purpose" = 'recovery'),
	CONSTRAINT "phone_verifications_incorrect_entries_check" CHECK ("phone_verifications"."incorrect_entries" BETWEEN 0 AND 5),
	CONSTRAINT "phone_verifications_re_requests_check" CHECK ("phone_verifications"."re_requests" BETWEEN 0 AND 3),
	CONSTRAINT "phone_verifications_full_name_payload" CHECK ("phone_verifications"."purpose" = 'sign_up' OR "phone_verifications"."full_name" IS NULL),
	CONSTRAINT "phone_verifications_password_payload" CHECK ("phone_verifications"."purpose" = 'sign_up' OR "phone_verifications"."password_hash" IS NULL),
	CONSTRAINT "phone_verifications_password_form" CHECK ("phone_verifications"."password_hash" IS NULL OR "phone_verifications"."password_hash" LIKE '$wafar$scrypt$%'),
	CONSTRAINT "phone_verifications_verified_at_pair" CHECK (("phone_verifications"."state" = 'verified') = ("phone_verifications"."verified_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone_number" text NOT NULL,
	"phone_number_verified" boolean DEFAULT false NOT NULL,
	"city" text NOT NULL,
	"shop_name" text,
	"role" text DEFAULT 'merchant' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"failed_sign_in_count" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp (3) with time zone,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"monthly_upload_quota_override" integer,
	"active_upload_quota_override" integer,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_full_name_not_blank" CHECK (btrim("users"."full_name") <> ''),
	CONSTRAINT "users_full_name_length" CHECK (char_length("users"."full_name") <= 100),
	CONSTRAINT "users_shop_name_length" CHECK ("users"."shop_name" IS NULL OR char_length("users"."shop_name") <= 100),
	CONSTRAINT "users_email_sentinel" CHECK ("users"."email" LIKE '%@phone.invalid'),
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('merchant', 'administrator')),
	CONSTRAINT "users_status_check" CHECK ("users"."status" IN ('active', 'blocked')),
	CONSTRAINT "users_failed_sign_in_count_check" CHECK ("users"."failed_sign_in_count" >= 0),
	CONSTRAINT "users_monthly_upload_quota_override_check" CHECK ("users"."monthly_upload_quota_override" IS NULL OR "users"."monthly_upload_quota_override" BETWEEN 1 AND 500),
	CONSTRAINT "users_active_upload_quota_override_check" CHECK ("users"."active_upload_quota_override" IS NULL OR "users"."active_upload_quota_override" BETWEEN 1 AND 1500)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp (3) with time zone,
	"refresh_token_expires_at" timestamp (3) with time zone,
	"scope" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_password_form" CHECK ("accounts"."password" IS NULL OR "accounts"."password" LIKE '$wafar$scrypt$%')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counters" (
	"key" text NOT NULL,
	"window_start" timestamp (3) with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_counters_key_window_start_pk" PRIMARY KEY("key","window_start"),
	CONSTRAINT "rate_limit_counters_key_length" CHECK (char_length("rate_limit_counters"."key") <= 128),
	CONSTRAINT "rate_limit_counters_count_check" CHECK ("rate_limit_counters"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"last_activity_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp (3) with time zone,
	"revoked_reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_length_check" CHECK (char_length("sessions"."token") >= 32),
	CONSTRAINT "sessions_revoked_reason_check" CHECK ("sessions"."revoked_reason" IS NULL OR "sessions"."revoked_reason" IN ('sign_out', 'sign_out_all', 'password_change', 'blocked', 'platform_revocation', 'inactivity')),
	CONSTRAINT "sessions_revoked_pair_check" CHECK (("sessions"."revoked_at" IS NULL) = ("sessions"."revoked_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phone_verifications_phone_number_key" ON "phone_verifications" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "phone_verifications_request_expires_at_idx" ON "phone_verifications" USING btree ("request_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_number_key" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_key" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rate_limit_counters_expires_at_idx" ON "rate_limit_counters" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_revoked_at_idx" ON "sessions" USING btree ("revoked_at") WHERE "sessions"."revoked_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
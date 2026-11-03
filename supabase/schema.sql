-- DBI (Digital Business Institution) — full schema for Supabase / PostgreSQL
-- Run once in the Supabase SQL editor, then run supabase/seed.sql

CREATE TABLE IF NOT EXISTS "ad_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"title" text NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"media_url" text,
	"description" text NOT NULL,
	"publish_text" text NOT NULL,
	"budget" integer NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"budget_xaf" integer NOT NULL,
	"cost_per_view" integer DEFAULT 3 NOT NULL,
	"target_views" integer NOT NULL,
	"days" integer DEFAULT 3 NOT NULL,
	"bonus_days" integer DEFAULT 2 NOT NULL,
	"whatsapp" text,
	"phone" text,
	"website" text,
	"target_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"age_min" integer DEFAULT 18 NOT NULL,
	"age_max" integer DEFAULT 120 NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"tracking_code" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_campaigns_tracking_code_unique" UNIQUE("tracking_code")
);

CREATE TABLE IF NOT EXISTS "ad_publication_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publication_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"published_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"views" integer DEFAULT 0 NOT NULL,
	"verified_views" integer DEFAULT 0 NOT NULL,
	"proof_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ad_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"publisher_id" uuid NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"verified_views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"earned" integer DEFAULT 0 NOT NULL,
	"proof_url" text,
	"status" text DEFAULT 'accepted' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"seller_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Général' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"promo" boolean DEFAULT false NOT NULL,
	"cover_url" text,
	"duration_label" text,
	"format" text,
	"access_url" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contact_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"city" text,
	"age" integer,
	"profession" text,
	"gender" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text,
	"event" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"purpose" text DEFAULT 'activation' NOT NULL,
	"credit_amount" integer DEFAULT 0 NOT NULL,
	"method" text NOT NULL,
	"country_code" text NOT NULL,
	"currency" text NOT NULL,
	"amount" integer NOT NULL,
	"operator" text,
	"phone" text,
	"asset_code" text,
	"provider_id" text,
	"provider_reference" text,
	"status" text DEFAULT 'created' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);

CREATE TABLE IF NOT EXISTS "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"price_paid" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "smm_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" integer NOT NULL,
	"service_name" text NOT NULL,
	"category" text NOT NULL,
	"link" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_xaf" integer NOT NULL,
	"cost_usd" integer NOT NULL,
	"provider_order_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"start_count" integer,
	"remains" integer,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"attachment_url" text,
	"attachment_type" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"reference" text NOT NULL,
	"label" text,
	"operator" text,
	"destination" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"country_code" text NOT NULL,
	"dial_code" text NOT NULL,
	"whatsapp" text NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"activated_at" timestamp with time zone,
	"matricule" text,
	"balance" integer DEFAULT 0 NOT NULL,
	"gains" integer DEFAULT 0 NOT NULL,
	"balance_usd" integer DEFAULT 0 NOT NULL,
	"feuilles" integer DEFAULT 0 NOT NULL,
	"total_withdrawn" integer DEFAULT 0 NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "users_matricule_unique" UNIQUE("matricule")
);

CREATE TABLE IF NOT EXISTS "vendor_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "withdrawal_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator" text NOT NULL,
	"country_code" text NOT NULL,
	"phone" text NOT NULL,
	"holder_name" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "ad_campaigns" DROP CONSTRAINT IF EXISTS "ad_campaigns_advertiser_id_users_id_fk"; ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_id_users_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ad_publication_days" DROP CONSTRAINT IF EXISTS "ad_publication_days_publication_id_ad_publications_id_fk"; ALTER TABLE "ad_publication_days" ADD CONSTRAINT "ad_publication_days_publication_id_ad_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."ad_publications"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ad_publications" DROP CONSTRAINT IF EXISTS "ad_publications_campaign_id_ad_campaigns_id_fk"; ALTER TABLE "ad_publications" ADD CONSTRAINT "ad_publications_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ad_publications" DROP CONSTRAINT IF EXISTS "ad_publications_publisher_id_users_id_fk"; ALTER TABLE "ad_publications" ADD CONSTRAINT "ad_publications_publisher_id_users_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "catalog_items" DROP CONSTRAINT IF EXISTS "catalog_items_seller_id_users_id_fk"; ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "contact_downloads" DROP CONSTRAINT IF EXISTS "contact_downloads_user_id_users_id_fk"; ALTER TABLE "contact_downloads" ADD CONSTRAINT "contact_downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contact_downloads" DROP CONSTRAINT IF EXISTS "contact_downloads_contact_id_contacts_id_fk"; ALTER TABLE "contact_downloads" ADD CONSTRAINT "contact_downloads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_owner_id_users_id_fk"; ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_users_id_fk"; ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_user_id_users_id_fk"; ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_item_id_catalog_items_id_fk"; ALTER TABLE "purchases" ADD CONSTRAINT "purchases_item_id_catalog_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_users_id_fk"; ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "smm_orders" DROP CONSTRAINT IF EXISTS "smm_orders_user_id_users_id_fk"; ALTER TABLE "smm_orders" ADD CONSTRAINT "smm_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "support_messages" DROP CONSTRAINT IF EXISTS "support_messages_user_id_users_id_fk"; ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_users_id_fk"; ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vendor_subscriptions" DROP CONSTRAINT IF EXISTS "vendor_subscriptions_user_id_users_id_fk"; ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "withdrawal_accounts" DROP CONSTRAINT IF EXISTS "withdrawal_accounts_user_id_users_id_fk"; ALTER TABLE "withdrawal_accounts" ADD CONSTRAINT "withdrawal_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "ad_campaigns_adv_idx" ON "ad_campaigns" USING btree ("advertiser_id");
CREATE INDEX IF NOT EXISTS "ad_campaigns_status_idx" ON "ad_campaigns" USING btree ("status");
CREATE INDEX IF NOT EXISTS "ad_pub_days_pub_idx" ON "ad_publication_days" USING btree ("publication_id","day");
CREATE INDEX IF NOT EXISTS "ad_pub_campaign_idx" ON "ad_publications" USING btree ("campaign_id");
CREATE INDEX IF NOT EXISTS "ad_pub_publisher_idx" ON "ad_publications" USING btree ("publisher_id");
CREATE INDEX IF NOT EXISTS "catalog_kind_idx" ON "catalog_items" USING btree ("kind","status");
CREATE INDEX IF NOT EXISTS "catalog_seller_idx" ON "catalog_items" USING btree ("seller_id");
CREATE INDEX IF NOT EXISTS "contact_downloads_user_idx" ON "contact_downloads" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "contact_downloads_contact_idx" ON "contact_downloads" USING btree ("contact_id");
CREATE INDEX IF NOT EXISTS "contacts_country_idx" ON "contacts" USING btree ("country_code");
CREATE INDEX IF NOT EXISTS "contacts_owner_idx" ON "contacts" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "payments_provider_idx" ON "payments" USING btree ("provider_id");
CREATE INDEX IF NOT EXISTS "purchases_user_idx" ON "purchases" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "purchases_item_idx" ON "purchases" USING btree ("item_id");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "smm_orders_user_idx" ON "smm_orders" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "support_user_idx" ON "support_messages" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "transactions_user_idx" ON "transactions" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "users_referral_idx" ON "users" USING btree ("referral_code");
CREATE INDEX IF NOT EXISTS "users_referred_by_idx" ON "users" USING btree ("referred_by");
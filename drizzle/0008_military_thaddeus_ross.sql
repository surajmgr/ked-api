CREATE TYPE "public"."access_level" AS ENUM('FREE', 'PREMIUM', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('DAY', 'WEEK', 'MONTH', 'YEAR');--> statement-breakpoint
CREATE TYPE "public"."collaborator_role" AS ENUM('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."content_visibility" AS ENUM('PUBLIC', 'UNLISTED', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'PENDING_PAYMENT', 'PAID', 'CANCELED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('STRIPE', 'RAZORPAY', 'PAYPAL', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('ONE_TIME', 'SUBSCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('LIKE', 'CLAP', 'HELPFUL', 'BOOKMARK');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('BOOK', 'TOPIC', 'SUBTOPIC', 'NOTE', 'QUESTION', 'ANSWER');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE');--> statement-breakpoint
ALTER TYPE "public"."contribution_action" ADD VALUE 'READ_NOTE' BEFORE 'ANSWER_QUESTION';--> statement-breakpoint
ALTER TYPE "public"."contribution_action" ADD VALUE 'MODERATE_CONTENT';--> statement-breakpoint
CREATE TABLE "content_comments" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"parent_id" text,
	"anchor_json" jsonb,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.145' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.145' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_reactions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction" "reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.145' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_collaborators" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "collaborator_role" DEFAULT 'VIEWER' NOT NULL,
	"added_by" text NOT NULL,
	"added_at" timestamp DEFAULT '2026-02-09 13:59:19.145' NOT NULL,
	"removed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "note_documents" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"content_json" jsonb NOT NULL,
	"content_text" text,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.144' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.144' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_revisions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"version" integer NOT NULL,
	"content_json" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.144' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.148' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.148' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.148' NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_tag_follows" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.148' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"access_level" "access_level" NOT NULL,
	"source" text NOT NULL,
	"order_item_id" text,
	"subscription_id" text,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.155' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_cents" integer NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.154' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"provider_checkout_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.153' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.153' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_payment_id" text,
	"status" "payment_status" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.154' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.154' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_content_grants" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"access_level" "access_level" DEFAULT 'PAID' NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.153' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"unit_amount_cents" integer NOT NULL,
	"billing_interval" "billing_interval",
	"interval_count" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"provider_price_id" text,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.153' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.153' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"product_type" "product_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.152' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.152' NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"provider_refund_id" text,
	"status" "refund_status" DEFAULT 'PENDING' NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.155' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price_id" text,
	"provider" "payment_provider" NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT '2026-02-09 13:59:19.155' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-09 13:59:19.155' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_note_id_questions_id_fk";
--> statement-breakpoint
DROP INDEX "idx_comment_note";--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.125';--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.125';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.126';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.126';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.122';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.123';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.128';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.128';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.127';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.127';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.127';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.127';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.134';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.134';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.135';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.138';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.138';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.138';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.138';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.139';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.139';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.157';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.157';--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.159';--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.159';--> statement-breakpoint
ALTER TABLE "contribution_ledger" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.161';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "reviewed_at" SET DEFAULT '2026-02-09 13:59:19.162';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.162';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.162';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "started_at" SET DEFAULT '2026-02-09 13:59:19.164';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "completed_at" SET DEFAULT '2026-02-09 13:59:19.164';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "last_read_at" SET DEFAULT '2026-02-09 13:59:19.164';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "created_at" SET DEFAULT '2026-02-09 13:59:19.164';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-09 13:59:19.164';--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "visibility" "content_visibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "access_level" "access_level" DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "content_json" jsonb;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "visibility" "content_visibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "access_level" "access_level" DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "currency" char(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "status" "content_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "visibility" "content_visibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "visibility" "content_visibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "question_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "status" "content_status" DEFAULT 'PUBLISHED' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "visibility" "content_visibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "note_collaborators" ADD CONSTRAINT "note_collaborators_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_documents" ADD CONSTRAINT "note_documents_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tag_follows" ADD CONSTRAINT "user_tag_follows_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_id_product_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."product_prices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_content_grants" ADD CONSTRAINT "product_content_grants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_price_id_product_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."product_prices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_comments_resource" ON "content_comments" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_content_comments_author" ON "content_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_content_comments_parent" ON "content_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_content_comments_created" ON "content_comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_content_reactions_unique" ON "content_reactions" USING btree ("resource_type","resource_id","user_id","reaction");--> statement-breakpoint
CREATE INDEX "idx_content_reactions_resource" ON "content_reactions" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_content_reactions_user" ON "content_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_collaborators_unique" ON "note_collaborators" USING btree ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_note_collaborators_note" ON "note_collaborators" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_collaborators_user" ON "note_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_note_collaborators_role" ON "note_collaborators" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_documents_note_unique" ON "note_documents" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_documents_version" ON "note_documents" USING btree ("note_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_revisions_unique" ON "note_revisions" USING btree ("note_id","version");--> statement-breakpoint
CREATE INDEX "idx_note_revisions_note" ON "note_revisions" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_revisions_created_by" ON "note_revisions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_note_revisions_created" ON "note_revisions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_content_tags_unique" ON "content_tags" USING btree ("tag_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_content_tags_tag" ON "content_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_content_tags_resource" ON "content_tags" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_tags_slug" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tags_name" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_tag_follows_unique" ON "user_tag_follows" USING btree ("user_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_user_tag_follows_user" ON "user_tag_follows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_tag_follows_tag" ON "user_tag_follows" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_entitlements_unique" ON "entitlements" USING btree ("user_id","resource_type","resource_id","access_level");--> statement-breakpoint
CREATE INDEX "idx_entitlements_user" ON "entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_entitlements_resource" ON "entitlements" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_entitlements_expires" ON "entitlements" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_entitlements_order_item" ON "entitlements" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_entitlements_subscription" ON "entitlements" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_price" ON "order_items" USING btree ("price_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_order_items_unique" ON "order_items" USING btree ("order_id","product_id","price_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_user_status" ON "orders" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_created" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_provider_checkout" ON "orders" USING btree ("provider_checkout_id");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_provider" ON "payments" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_payments_provider_id" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payments_created" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_product_content_grants_unique" ON "product_content_grants" USING btree ("product_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_product_content_grants_product" ON "product_content_grants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_content_grants_resource" ON "product_content_grants" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_product_prices_product" ON "product_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_prices_active" ON "product_prices" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_product_prices_currency" ON "product_prices" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "idx_product_prices_provider" ON "product_prices" USING btree ("provider_price_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_product_prices_unique" ON "product_prices" USING btree ("product_id","currency","unit_amount_cents","billing_interval","interval_count");--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_products_type" ON "products" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "idx_products_created_by" ON "products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_refunds_payment" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_status" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_refunds_provider_id" ON "refunds" USING btree ("provider_refund_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_status" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_provider_sub" ON "subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_book_visibility" ON "books" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_book_access_level" ON "books" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "idx_note_visibility" ON "notes" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_note_access_level" ON "notes" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "idx_subtopic_status" ON "subtopics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subtopic_visibility" ON "subtopics" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_topic_visibility" ON "topics" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_comment_question" ON "comments" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_question_status" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_question_visibility" ON "questions" USING btree ("visibility");--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN "note_id";
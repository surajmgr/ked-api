CREATE TYPE "public"."upload_type" AS ENUM('BOOK_COVER', 'PROFILE_PICTURE', 'OTHER');--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "upload_type" NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-12 14:22:24.220' NOT NULL,
	"updated_at" timestamp DEFAULT '2026-02-12 14:22:24.220' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_uploads" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"upload_type" text NOT NULL,
	"provider_public_id" text,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT '2026-02-12 14:22:24.253' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.216';--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.216';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.217';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.217';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.214';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.214';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.219';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.219';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.218';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.218';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.217';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.217';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.223';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.223';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.224';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.224';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.222';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.222';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.224';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.224';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.226';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.226';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.226';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.226';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.227';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.227';--> statement-breakpoint
ALTER TABLE "content_comments" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.233';--> statement-breakpoint
ALTER TABLE "content_comments" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.233';--> statement-breakpoint
ALTER TABLE "content_reactions" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.234';--> statement-breakpoint
ALTER TABLE "note_collaborators" ALTER COLUMN "added_at" SET DEFAULT '2026-02-12 14:22:24.233';--> statement-breakpoint
ALTER TABLE "note_documents" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.232';--> statement-breakpoint
ALTER TABLE "note_documents" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.232';--> statement-breakpoint
ALTER TABLE "note_revisions" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.233';--> statement-breakpoint
ALTER TABLE "content_tags" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.235';--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.235';--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.235';--> statement-breakpoint
ALTER TABLE "user_tag_follows" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.236';--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.243';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.241';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.241';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.241';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.242';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.242';--> statement-breakpoint
ALTER TABLE "product_content_grants" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.241';--> statement-breakpoint
ALTER TABLE "product_prices" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.240';--> statement-breakpoint
ALTER TABLE "product_prices" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.240';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.240';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.240';--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.242';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.242';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.242';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.246';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.246';--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.247';--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.247';--> statement-breakpoint
ALTER TABLE "contribution_ledger" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.249';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "reviewed_at" SET DEFAULT '2026-02-12 14:22:24.250';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.250';--> statement-breakpoint
ALTER TABLE "review_tasks" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.250';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "started_at" SET DEFAULT '2026-02-12 14:22:24.252';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "completed_at" SET DEFAULT '2026-02-12 14:22:24.252';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "last_read_at" SET DEFAULT '2026-02-12 14:22:24.252';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "created_at" SET DEFAULT '2026-02-12 14:22:24.252';--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-12 14:22:24.252';--> statement-breakpoint
CREATE INDEX "idx_upload_user" ON "uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_upload_type" ON "uploads" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_uploads_user" ON "user_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_uploads_type" ON "user_uploads" USING btree ("upload_type");--> statement-breakpoint
CREATE INDEX "idx_user_uploads_created" ON "user_uploads" USING btree ("created_at");
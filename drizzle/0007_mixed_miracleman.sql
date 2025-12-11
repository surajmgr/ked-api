CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."contribution_action" AS ENUM('CREATE_NOTE', 'CREATE_BOOK', 'CREATE_TOPIC', 'CREATE_SUBTOPIC', 'ANSWER_QUESTION', 'UPVOTE_RECEIVED', 'DOWNVOTE_RECEIVED', 'CONTENT_APPROVED', 'CONTENT_REJECTED', 'QUESTION_ASKED', 'ANSWER_ACCEPTED');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('APPROVE', 'REJECT');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar" text,
	"contribution_points" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"trusted_status" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT '2025-12-10 09:01:30.506' NOT NULL,
	"updated_at" timestamp DEFAULT '2025-12-10 09:01:30.506' NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "contribution_ledger" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" "contribution_action" NOT NULL,
	"cp_delta" integer NOT NULL,
	"xp_delta" integer NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"metadata" text,
	"created_at" timestamp DEFAULT '2025-12-10 09:01:30.516' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_tasks" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"author_id" text NOT NULL,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp DEFAULT '2025-12-10 09:01:30.527' NOT NULL,
	"rejection_reason" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT '2025-12-10 09:01:30.527' NOT NULL,
	"updated_at" timestamp DEFAULT '2025-12-10 09:01:30.527' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"note_id" text NOT NULL,
	"status" "progress_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"started_at" timestamp DEFAULT '2025-12-10 09:01:30.537' NOT NULL,
	"completed_at" timestamp DEFAULT '2025-12-10 09:01:30.537' NOT NULL,
	"last_read_at" timestamp DEFAULT '2025-12-10 09:01:30.537' NOT NULL,
	"reading_time_seconds" integer DEFAULT 0 NOT NULL,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT '2025-12-10 09:01:30.537' NOT NULL,
	"updated_at" timestamp DEFAULT '2025-12-10 09:01:30.537' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.353';--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.353';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.354';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.354';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.341';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.341';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.369';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.369';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.365';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.365';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.359';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.359';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.396';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.396';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.400';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.400';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.391';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.391';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.398';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.398';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.413';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.413';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.409';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.409';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.472';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.472';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "created_at" SET DEFAULT '2025-12-10 09:01:30.499';--> statement-breakpoint
ALTER TABLE "example" ALTER COLUMN "updated_at" SET DEFAULT '2025-12-10 09:01:30.499';--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "status" "content_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "status" "content_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "status" "content_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_profile_user_id" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_profile_cp" ON "user_profiles" USING btree ("contribution_points");--> statement-breakpoint
CREATE INDEX "idx_user_profile_xp" ON "user_profiles" USING btree ("xp");--> statement-breakpoint
CREATE INDEX "idx_user_profile_trusted" ON "user_profiles" USING btree ("trusted_status");--> statement-breakpoint
CREATE INDEX "idx_contribution_ledger_user" ON "contribution_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_contribution_ledger_action" ON "contribution_ledger" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_contribution_ledger_created" ON "contribution_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contribution_ledger_reference" ON "contribution_ledger" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_review_task_content" ON "review_tasks" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_review_task_author" ON "review_tasks" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_review_task_status" ON "review_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_task_priority" ON "review_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_review_task_created" ON "review_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_review_task_reviewer" ON "review_tasks" USING btree ("reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_progress_unique" ON "user_progress" USING btree ("user_id","note_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_note" ON "user_progress" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_status" ON "user_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_progress_bookmarked" ON "user_progress" USING btree ("bookmarked");--> statement-breakpoint
CREATE INDEX "idx_user_progress_last_read" ON "user_progress" USING btree ("last_read_at");--> statement-breakpoint
CREATE INDEX "idx_book_status" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_book_created_by" ON "books" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_note_status" ON "notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_topic_status" ON "topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_topic_created_by" ON "topics" USING btree ("created_by");
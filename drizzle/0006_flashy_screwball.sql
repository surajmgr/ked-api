ALTER TABLE "example" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.278';--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.278';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.284';--> statement-breakpoint
ALTER TABLE "grade_books" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.284';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.270';--> statement-breakpoint
ALTER TABLE "grades" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.270';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.291';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.291';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.289';--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.289';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.286';--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.286';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.312';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.312';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.316';--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.316';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.309';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-24 09:43:07.309';--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.314';--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.326';--> statement-breakpoint
ALTER TABLE "ranks" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.323';--> statement-breakpoint
ALTER TABLE "user_activities" ALTER COLUMN "created_at" SET DEFAULT '2025-10-24 09:43:07.330';--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "updated_at" timestamp DEFAULT '2025-10-24 09:43:07.314' NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "updated_at" timestamp DEFAULT '2025-10-24 09:43:07.326' NOT NULL;--> statement-breakpoint
ALTER TABLE "ranks" ADD COLUMN "updated_at" timestamp DEFAULT '2025-10-24 09:43:07.323' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "updated_at" timestamp DEFAULT '2025-10-24 09:43:07.330' NOT NULL;--> statement-breakpoint
ALTER TABLE "example" ADD COLUMN "updated_at" timestamp DEFAULT '2025-10-24 09:43:07.359' NOT NULL;
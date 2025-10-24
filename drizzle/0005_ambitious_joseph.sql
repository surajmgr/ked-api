CREATE TYPE "public"."activity_type" AS ENUM('QUESTION_ASKED', 'ANSWER_GIVEN', 'NOTE_SHARED', 'VOTE_CAST', 'COMMENT_MADE', 'CONTENT_FOLLOWED');--> statement-breakpoint
CREATE TYPE "public"."auth_role" AS ENUM('USER', 'ADMIN', 'SUPERADMIN');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('GENERAL', 'ENGAGEMENT', 'CONTRIBUTION', 'CONTENT_CREATION', 'COMMUNITY_SUPPORT', 'LEARNING', 'MILESTONE', 'GAMIFICATION', 'SOCIAL');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('MARKDOWN', 'HTML', 'TEXT');--> statement-breakpoint
CREATE TYPE "public"."criteria_type" AS ENUM('CONTRIBUTION_COUNT', 'REPUTATION', 'STREAK', 'QUESTION_COUNT', 'ANSWER_COUNT', 'NOTE_COUNT', 'UPVOTE_COUNT');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('FOLLOW', 'NEW_QUESTION', 'NEW_ANSWER', 'NEW_NOTE', 'VOTE', 'ACHIEVEMENT', 'MENTION');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('UPVOTE', 'DOWNVOTE');--> statement-breakpoint
CREATE TABLE "books" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"author" text,
	"isbn" text,
	"cover_image" text,
	"category" text,
	"difficulty_level" "difficulty_level" DEFAULT 'BEGINNER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "grade_books" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"grade_id" text NOT NULL,
	"book_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grades_name_unique" UNIQUE("name"),
	CONSTRAINT "grades_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"content_type" "content_type" DEFAULT 'MARKDOWN' NOT NULL,
	"topic_id" text NOT NULL,
	"subtopic_id" text,
	"author_id" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"price" real DEFAULT 0 NOT NULL,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" real DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subtopics" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"topic_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subtopics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"book_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"question_id" text NOT NULL,
	"author_id" text NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"votes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"topic_id" text NOT NULL,
	"subtopic_id" text,
	"author_id" text NOT NULL,
	"is_solved" boolean DEFAULT false NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"votes_count" integer DEFAULT 0 NOT NULL,
	"answers_count" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text,
	"answer_id" text,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"badge_icon" text,
	"badge_color" text DEFAULT '#FFD700' NOT NULL,
	"criteria_type" "criteria_type" NOT NULL,
	"criteria_value" integer NOT NULL,
	"category" "category_type" DEFAULT 'GENERAL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranks" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_reputation" integer NOT NULL,
	"max_reputation" integer,
	"description" text,
	"color" text DEFAULT '#808080' NOT NULL,
	"icon" text,
	"privileges" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ranks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_follows" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" text,
	"topic_id" text,
	"subtopic_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_purchases" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"purchase_price" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_ratings" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"reference_id" text,
	"reference_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grade_books" ADD CONSTRAINT "grade_books_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_books" ADD CONSTRAINT "grade_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_subtopic_id_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_note_id_questions_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subtopic_id_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_answer_id_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_follows" ADD CONSTRAINT "content_follows_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_follows" ADD CONSTRAINT "content_follows_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_follows" ADD CONSTRAINT "content_follows_subtopic_id_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_purchases" ADD CONSTRAINT "note_purchases_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_ratings" ADD CONSTRAINT "note_ratings_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_book_active" ON "books" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_book_slug" ON "books" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_book_category" ON "books" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_book_difficulty" ON "books" USING btree ("difficulty_level");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_gradebook_unique" ON "grade_books" USING btree ("grade_id","book_id");--> statement-breakpoint
CREATE INDEX "idx_gradebook_grade" ON "grade_books" USING btree ("grade_id");--> statement-breakpoint
CREATE INDEX "idx_gradebook_book" ON "grade_books" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_gradebook_active_order" ON "grade_books" USING btree ("is_active","order_index");--> statement-breakpoint
CREATE INDEX "idx_grade_active_order" ON "grades" USING btree ("is_active","order_index");--> statement-breakpoint
CREATE INDEX "idx_grade_slug" ON "grades" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_note_slug" ON "notes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_note_topic" ON "notes" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_note_subtopic" ON "notes" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_note_author" ON "notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_note_public_premium" ON "notes" USING btree ("is_public","is_premium");--> statement-breakpoint
CREATE INDEX "idx_note_rating" ON "notes" USING btree ("rating_avg");--> statement-breakpoint
CREATE INDEX "idx_note_downloads" ON "notes" USING btree ("downloads_count");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_subtopic_topic_order" ON "subtopics" USING btree ("topic_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_subtopic_topic_active_order" ON "subtopics" USING btree ("topic_id","is_active","order_index");--> statement-breakpoint
CREATE INDEX "idx_subtopic_slug" ON "subtopics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_subtopic_topic" ON "subtopics" USING btree ("topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_topic_book_order" ON "topics" USING btree ("book_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_topic_book_active_order" ON "topics" USING btree ("book_id","is_active","order_index");--> statement-breakpoint
CREATE INDEX "idx_topic_slug" ON "topics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_topic_book" ON "topics" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_answer_question" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_answer_author" ON "answers" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_answer_accepted" ON "answers" USING btree ("is_accepted");--> statement-breakpoint
CREATE INDEX "idx_answer_votes" ON "answers" USING btree ("votes_count");--> statement-breakpoint
CREATE INDEX "idx_answer_created" ON "answers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_comment_note" ON "comments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_comment_author" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_comment_parent" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_created" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_question_slug" ON "questions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_question_topic" ON "questions" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_question_subtopic" ON "questions" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_question_author" ON "questions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_question_solved" ON "questions" USING btree ("is_solved");--> statement-breakpoint
CREATE INDEX "idx_question_votes" ON "questions" USING btree ("votes_count");--> statement-breakpoint
CREATE INDEX "idx_question_views" ON "questions" USING btree ("views_count");--> statement-breakpoint
CREATE INDEX "idx_question_created" ON "questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_question_tags" ON "questions" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vote_user_question" ON "votes" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vote_user_answer" ON "votes" USING btree ("user_id","answer_id");--> statement-breakpoint
CREATE INDEX "idx_vote_user" ON "votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vote_question" ON "votes" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_vote_answer" ON "votes" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "idx_achievement_criteria" ON "achievements" USING btree ("criteria_type");--> statement-breakpoint
CREATE INDEX "idx_achievement_category" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_rank_name" ON "ranks" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_rank_reputation" ON "ranks" USING btree ("min_reputation","max_reputation");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_achievement_unique" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievement_user" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievement_achievement" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievement_earned" ON "user_achievements" USING btree ("earned_at");--> statement-breakpoint
CREATE INDEX "idx_user_activity_user" ON "user_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_activity_type" ON "user_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_user_activity_created" ON "user_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_activity_reference" ON "user_activities" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_content_follow_user" ON "content_follows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_content_follow_book" ON "content_follows" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_content_follow_topic" ON "content_follows" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_content_follow_subtopic" ON "content_follows" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_content_follow_created" ON "content_follows" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_follow_unique" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "idx_follow_follower" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_follow_following" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "idx_follow_created" ON "follows" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_purchase_unique" ON "note_purchases" USING btree ("note_id","buyer_id");--> statement-breakpoint
CREATE INDEX "idx_note_purchase_note" ON "note_purchases" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_purchase_buyer" ON "note_purchases" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_note_purchase_created" ON "note_purchases" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_rating_unique" ON "note_ratings" USING btree ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_note_rating_note" ON "note_ratings" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_rating_user" ON "note_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_note_rating_value" ON "note_ratings" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_note_rating_created" ON "note_ratings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notification_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notification_user_read" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notification_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_reference" ON "notifications" USING btree ("reference_type","reference_id");
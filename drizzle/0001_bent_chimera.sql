CREATE TABLE "example" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "users_table" CASCADE;
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_slug" text NOT NULL,
	"kind" text NOT NULL,
	"correct" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"level" text,
	"goals" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"topic_slug" text PRIMARY KEY NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_records" (
	"topic_slug" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);

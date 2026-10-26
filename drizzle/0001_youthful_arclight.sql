-- Hand-fix: Postgres cannot auto-cast text to boolean, even on an empty
-- table; the USING clause makes the intent explicit. (Found by the
-- PGlite migration test, tests/db.test.ts.)
ALTER TABLE "attempts" ALTER COLUMN "correct" SET DATA TYPE boolean USING "correct"::boolean;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_topic_slug_topics_slug_fk" FOREIGN KEY ("topic_slug") REFERENCES "public"."topics"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_slug_topics_slug_fk" FOREIGN KEY ("topic_slug") REFERENCES "public"."topics"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_records" ADD CONSTRAINT "topic_records_topic_slug_topics_slug_fk" FOREIGN KEY ("topic_slug") REFERENCES "public"."topics"("slug") ON DELETE no action ON UPDATE no action;
// Drizzle schema (Postgres dialect, Supabase-compatible). Mirrors
// src/features/topics/schemas.ts. Migration generation is offline:
// `npm run db:generate` writes drizzle/ with no live database.
// HUMAN: when you wire a live DB, implement TopicStore on this schema
// (see src/features/topics/store.ts) and add a DATABASE_URL.
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const lessons = pgTable("lessons", {
  topicSlug: text("topic_slug")
    .notNull()
    .primaryKey()
    .references(() => topics.slug),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const learnerProfiles = pgTable("learner_profiles", {
  id: text("id").primaryKey(),
  // Placeholder fields only; the learner model is user-designed later.
  level: text("level"),
  goals: text("goals"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  topicSlug: text("topic_slug")
    .notNull()
    .references(() => topics.slug),
  kind: text("kind").notNull(),
  // boolean, matching AttemptSchema (z.boolean().nullable()).
  correct: boolean("correct"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const topicRecords = pgTable("topic_records", {
  topicSlug: text("topic_slug")
    .primaryKey()
    .references(() => topics.slug),
  status: text("status").notNull().default("new"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

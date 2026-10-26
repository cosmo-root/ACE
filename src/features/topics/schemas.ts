// Domain types + Zod schemas. Placeholder fields only where the AI
// harness will later decide the real shape (profile, records).
// HUMAN: these schemas are the contract the harness (Phase 2) validates
// against. Change a field here and in src/db/schema.ts together.
import { z } from "zod";

export const TopicSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type Topic = z.infer<typeof TopicSchema>;

export const LessonSchema = z.object({
  topicSlug: z.string().min(1),
  /** Full lesson body in ACE markdown (GFM + math + callouts + blocks). */
  body: z.string(),
  updatedAt: z.string().datetime({ offset: true }),
});
export type Lesson = z.infer<typeof LessonSchema>;

// Placeholder only: the learner model is the user's design space (Phase 3+).
export const LearnerProfileSchema = z.object({
  id: z.string().min(1),
  level: z.string().optional(),
  goals: z.string().optional(),
  updatedAt: z.string().datetime({ offset: true }),
});
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;

export const AttemptSchema = z.object({
  id: z.string().min(1),
  topicSlug: z.string().min(1),
  kind: z.enum(["practice", "revisit"]),
  correct: z.boolean().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type Attempt = z.infer<typeof AttemptSchema>;

// Placeholder only: pass/revisit state derives from attempts later.
export const TopicRecordSchema = z.object({
  topicSlug: z.string().min(1),
  status: z.enum(["new", "learning", "passed"]),
  updatedAt: z.string().datetime({ offset: true }),
});
export type TopicRecord = z.infer<typeof TopicRecordSchema>;

export const NewTopicSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
export type NewTopic = z.infer<typeof NewTopicSchema>;

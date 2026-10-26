// Public API of the topics feature. Owns: domain schemas, the store
// interface + in-memory implementation, seed data.
export {
  TopicSchema,
  LessonSchema,
  LearnerProfileSchema,
  AttemptSchema,
  TopicRecordSchema,
  NewTopicSchema,
} from "./schemas";
export type {
  Topic,
  Lesson,
  LearnerProfile,
  Attempt,
  TopicRecord,
  NewTopic,
} from "./schemas";
export { InMemoryTopicStore, getStore, type TopicStore } from "./store";
export { seedTopics } from "./seed";

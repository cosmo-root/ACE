// Repository interface + in-memory implementation. Default (and test)
// storage: no DB, no network. Drizzle schema in src/db/schema.ts mirrors
// these shapes for the later Postgres wiring.
// HUMAN: to go live, implement TopicStore on Drizzle and swap getStore().
import { slugifyTitle } from "../content/slugify";
import type { Lesson, Topic } from "./schemas";
import { seedTopics } from "./seed";

export interface TopicStore {
  listTopics(): Topic[];
  getTopicBySlug(slug: string): (Topic & { lesson: Lesson }) | undefined;
  createTopic(title: string): Topic;
  saveLessonBody(slug: string, body: string): Lesson;
}

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class InMemoryTopicStore implements TopicStore {
  private topics = new Map<string, Topic>();
  private lessons = new Map<string, Lesson>();

  listTopics(): Topic[] {
    // Copies: callers must not mutate the store through returned objects.
    return [...this.topics.values()]
      .map((t) => ({ ...t }))
      .sort((a, b) =>
        // Full three-way comparison: equal timestamps must return 0.
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
      );
  }

  getTopicBySlug(slug: string) {
    const topic = this.topics.get(slug);
    if (!topic) return undefined;
    const lesson = this.lessons.get(slug) ?? {
      topicSlug: slug,
      body: "",
      updatedAt: topic.updatedAt,
    };
    return { ...topic, lesson: { ...lesson } };
  }

  createTopic(title: string): Topic {
    const clean = title.trim();
    if (!clean) throw new Error("title must be non-empty");
    let slug = slugifyTitle(clean) || "untitled";
    let n = 1;
    while (this.topics.has(slug)) slug = `${slugifyTitle(clean) || "untitled"}-${++n}`;
    const topic: Topic = {
      id: newId(),
      slug,
      title: clean,
      createdAt: now(),
      updatedAt: now(),
    };
    this.topics.set(slug, topic);
    this.lessons.set(slug, { topicSlug: slug, body: "", updatedAt: topic.updatedAt });
    return { ...topic };
  }

  saveLessonBody(slug: string, body: string): Lesson {
    const topic = this.topics.get(slug);
    if (!topic) throw new Error(`unknown topic: ${slug}`);
    const lesson: Lesson = { topicSlug: slug, body, updatedAt: now() };
    this.lessons.set(slug, lesson);
    topic.updatedAt = lesson.updatedAt;
    return { ...lesson };
  }

  /** Test/seed helper. */
  seed(topics: Array<{ title: string; body?: string }>): void {
    for (const t of topics) {
      const created = this.createTopic(t.title);
      if (t.body) this.saveLessonBody(created.slug, t.body);
    }
  }
}

declare global {
  var __aceTopicStore: InMemoryTopicStore | undefined;
}

// Module singleton (dev-server/HMR safe); seeded on first use.
export function getStore(): InMemoryTopicStore {
  if (!globalThis.__aceTopicStore) {
    globalThis.__aceTopicStore = new InMemoryTopicStore();
    globalThis.__aceTopicStore.seed(seedTopics);
  }
  return globalThis.__aceTopicStore;
}

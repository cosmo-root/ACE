import { describe, expect, it } from "vitest";
import { InMemoryTopicStore, NewTopicSchema, TopicSchema } from "../src/features/topics";

describe("topic schemas", () => {
  it("rejects empty titles", () => {
    expect(NewTopicSchema.safeParse({ title: "  " }).success).toBe(false);
    expect(NewTopicSchema.safeParse({ title: "Optics" }).success).toBe(true);
  });

  it("validates a topic record", () => {
    expect(
      TopicSchema.safeParse({
        id: "t_1",
        slug: "optics",
        title: "Optics",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).success
    ).toBe(true);
  });
});

describe("InMemoryTopicStore", () => {
  it("hands out copies, not live internals", () => {
    const store = new InMemoryTopicStore();
    store.createTopic("Optics");
    store.saveLessonBody("optics", "original");
    const fetched = store.getTopicBySlug("optics");
    if (fetched) {
      fetched.title = "HACKED";
      fetched.lesson.body = "HACKED";
    }
    store.listTopics().forEach((t) => {
      t.title = "HACKED";
    });
    expect(store.getTopicBySlug("optics")?.title).toBe("Optics");
    expect(store.getTopicBySlug("optics")?.lesson.body).toBe("original");
  });

  it("creates, lists, and fetches topics with lessons", () => {
    const store = new InMemoryTopicStore();
    const a = store.createTopic("Optics");
    store.saveLessonBody(a.slug, "See [[Lenses]].");
    store.createTopic("Lenses");
    expect(store.listTopics().map((t) => t.slug)).toEqual(["optics", "lenses"]);
    expect(store.getTopicBySlug("optics")?.lesson.body).toBe("See [[Lenses]].");
    expect(store.getTopicBySlug("nope")).toBeUndefined();
  });

  it("dedupes slugs and throws on unknown lesson writes", () => {
    const store = new InMemoryTopicStore();
    store.createTopic("Optics");
    const again = store.createTopic("Optics");
    expect(again.slug).toBe("optics-2");
    expect(() => store.saveLessonBody("nope", "x")).toThrow();
    expect(() => store.createTopic("   ")).toThrow();
  });
});

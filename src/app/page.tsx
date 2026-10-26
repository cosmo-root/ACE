import { redirect } from "next/navigation";
import { NewTopicSchema, getStore } from "@/features/topics";
import { QuickSwitcher, TopicListNav } from "@/features/search";

export const dynamic = "force-dynamic";

async function createTopic(formData: FormData) {
  "use server";
  const parsed = NewTopicSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return;
  const topic = getStore().createTopic(parsed.data.title);
  redirect(`/topic/${topic.slug}`);
}

export default function Home() {
  const topics = getStore().listTopics();
  return (
    <div>
      <h1>ACE — Actually Comprehend Everything</h1>
      <p>Say what you want to study. This skeleton stores topics in memory.</p>
      <QuickSwitcher
        topics={topics.map((t) => ({ slug: t.slug, title: t.title }))}
      />
      <section>
        <h2>Topics</h2>
        {topics.length === 0 ? (
          <p>No topics yet.</p>
        ) : (
          <TopicListNav
            topics={topics.map((t) => ({ slug: t.slug, title: t.title }))}
          />
        )}
      </section>
      <section>
        <h2>Add a topic</h2>
        <form action={createTopic}>
          <label>
            Topic name <input type="text" name="title" required maxLength={200} />
          </label>
          <button type="submit">Create empty topic</button>
        </form>
      </section>
    </div>
  );
}

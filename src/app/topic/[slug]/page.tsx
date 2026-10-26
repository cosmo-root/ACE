import Link from "next/link";
import { notFound } from "next/navigation";
import { RichContent } from "@/features/content";
import { buildBacklinks } from "@/features/graph";
import { getStore } from "@/features/topics";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = getStore();
  const topic = store.getTopicBySlug(slug);
  if (!topic) notFound();

  const all = store.listTopics();
  const permalinks = all.map((t) => t.slug);
  const topicsWithBodies = all.map((t) => ({
    slug: t.slug,
    title: t.title,
    body: store.getTopicBySlug(t.slug)?.lesson.body ?? "",
  }));
  const backlinks = buildBacklinks(topicsWithBodies).get(slug) ?? [];
  const titles = new Map(all.map((t) => [t.slug, t.title] as const));

  return (
    <div>
      <p>
        <Link href="/">All topics</Link>
      </p>
      <h1>{topic.title}</h1>
      {topic.lesson.body ? (
        <RichContent source={topic.lesson.body} permalinks={permalinks} />
      ) : (
        <p>No lesson yet. This topic is empty — the AI harness will write it.</p>
      )}
      <section>
        <h2>Backlinks</h2>
        {backlinks.length === 0 ? (
          <p>No other topic links here yet.</p>
        ) : (
          <ul>
            {backlinks.map((s) => (
              <li key={s}>
                <a href={`/topic/${s}`}>{titles.get(s) ?? s}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

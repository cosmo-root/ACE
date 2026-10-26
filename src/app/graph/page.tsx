import { GraphView, buildTopicGraph } from "@/features/graph";
import { getStore } from "@/features/topics";

export const dynamic = "force-dynamic";

export default function GraphPage() {
  const store = getStore();
  const topics = store.listTopics().map((t) => ({
    slug: t.slug,
    title: t.title,
    body: store.getTopicBySlug(t.slug)?.lesson.body ?? "",
  }));
  const graph = buildTopicGraph(topics);
  return (
    <div>
      <h1>Topic graph</h1>
      <GraphView graph={graph} />
    </div>
  );
}

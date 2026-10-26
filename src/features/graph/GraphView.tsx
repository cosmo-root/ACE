"use client";

// Interactive topic graph. force-graph loads lazily (canvas 2D, no Three.js)
// and only on the /graph route. Server passes plain data; all DOM/canvas
// work happens here.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { TopicGraph } from "./buildGraph";

export function GraphView({ graph }: { graph: TopicGraph }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let destroyed = false;
    let chart: { pauseAnimation(): unknown } | null = null;
    void import("force-graph")
      .then((mod) => {
        if (destroyed) return;
        const instance = new mod.default(el);
        // Deep copy: force-graph mutates the objects it is given
        // (layout fields); the server-passed prop must stay pristine.
        instance
          .graphData({
            nodes: graph.nodes.map((n) => ({ ...n })),
            links: graph.links.map((l) => ({ ...l })),
          })
          .nodeId("id")
          .nodeLabel("title")
          .nodeVal((n) => 2 + ((n as { outDegree?: number }).outDegree ?? 0))
          .linkDirectionalArrowLength(4)
          .onNodeClick((node) => {
            if (node.id !== undefined) router.push(`/topic/${node.id}`);
          });
        chart = instance;
      })
      .catch(() => {
        el.textContent = "Graph failed to load. The topic list is on the home page.";
      });
    return () => {
      destroyed = true;
      try {
        // Public teardown API (not the private _destructor) so a
        // force-graph upgrade cannot turn unmount into a RAF leak.
        chart?.pauseAnimation();
      } catch {
        /* already gone */
      }
      el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router identity is stable; re-running on graph change only.
  }, [graph]);

  return (
    <div>
      <p>
        {graph.nodes.length} topics, {graph.links.length} links. Select a node to
        open its topic.
      </p>
      <section aria-label="All topics">
        <ul>
          {graph.nodes.map((n) => (
            <li key={n.id}>
              <a href={`/topic/${n.id}`}>{n.title}</a>
            </li>
          ))}
        </ul>
      </section>
      <div ref={ref} role="img" aria-label="Interactive topic graph" />
    </div>
  );
}

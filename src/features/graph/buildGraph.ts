// Pure topic-graph builder: nodes from topics, edges from [[wikilinks]]
// in lesson bodies. No rendering library here — that stays in GraphView.
// HUMAN: edge weights / clustering / decay belong to your later design;
// keep them as pure functions in this file.
// NOTE: leaf import, not the content barrel — keeps the server-only
// pipeline out of client reach (graph/index.ts also ships GraphView).
import { extractWikilinks } from "../content/pipeline";

export interface GraphTopic {
  slug: string;
  title: string;
  body: string;
}

export interface GraphNode {
  id: string;
  title: string;
  /** Outgoing link count (used for sizing). */
  outDegree: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface TopicGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildTopicGraph(topics: GraphTopic[]): TopicGraph {
  const known = new Set(topics.map((t) => t.slug));
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  for (const topic of topics) {
    const targets = [
      ...new Set(
        extractWikilinks(topic.body).filter((s) => s !== topic.slug && known.has(s))
      ),
    ];
    nodes.push({ id: topic.slug, title: topic.title, outDegree: targets.length });
    for (const target of targets) links.push({ source: topic.slug, target });
  }
  return { nodes, links };
}

/** slug -> slugs of topics linking to it (only known slugs). */
export function buildBacklinks(topics: GraphTopic[]): Map<string, string[]> {
  const back = new Map<string, string[]>();
  for (const t of topics) back.set(t.slug, []);
  for (const topic of topics) {
    for (const target of new Set(extractWikilinks(topic.body))) {
      if (target !== topic.slug && back.has(target)) back.get(target)!.push(topic.slug);
    }
  }
  return back;
}

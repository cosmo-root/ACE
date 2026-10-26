import { describe, expect, it } from "vitest";
import { buildBacklinks, buildTopicGraph } from "../src/features/graph";

const topics = [
  { slug: "a", title: "A", body: "Links [[B]] and [[Missing]]. Self [[A]]." },
  { slug: "b", title: "B", body: "Links [[A|ay]]." },
  { slug: "c", title: "C", body: "No links." },
];

describe("buildTopicGraph", () => {
  it("links known topics, drops unknown and self links", () => {
    const g = buildTopicGraph(topics);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["a", "b", "c"]);
    expect(g.links).toEqual([{ source: "a", target: "b" }, { source: "b", target: "a" }]);
    expect(g.nodes.find((n) => n.id === "a")?.outDegree).toBe(1);
  });

  it("counts each target once in outDegree", () => {
    const g = buildTopicGraph([{ slug: "a", title: "A", body: "[[b]] and [[b]]" }]);
    expect(g.nodes[0].outDegree).toBe(0); // b unknown here
    const g2 = buildTopicGraph([
      { slug: "a", title: "A", body: "[[B]] and [[B]]" },
      { slug: "b", title: "B", body: "" },
    ]);
    expect(g2.links).toEqual([{ source: "a", target: "b" }]);
    expect(g2.nodes.find((n) => n.id === "a")?.outDegree).toBe(1);
  });
});

describe("buildBacklinks", () => {
  it("inverts the link index", () => {
    const back = buildBacklinks(topics);
    expect(back.get("a")).toEqual(["b"]);
    expect(back.get("b")).toEqual(["a"]);
    expect(back.get("c")).toEqual([]);
  });
});

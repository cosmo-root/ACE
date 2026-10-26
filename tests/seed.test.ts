import { describe, expect, it } from "vitest";
import { seedTopics } from "../src/features/topics/seed";
import { extractWikilinks, renderMarkdown } from "../src/features/content/pipeline";
import { slugifyTitle } from "../src/features/content/slugify";
import { buildBacklinks, buildTopicGraph } from "../src/features/graph/buildGraph";

const SLUG_SAFE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function seedSlugs(): string[] {
  return seedTopics.map((t) => slugifyTitle(t.title));
}

function mainTopic() {
  const found = seedTopics.find((t) => t.title === "Quadratic Functions");
  if (found?.body) return found;
  let best = seedTopics[0];
  for (const t of seedTopics) {
    if ((t.body ?? "").length > (best.body ?? "").length) best = t;
  }
  return best;
}

describe("seed topics", () => {
  it("every seed topic has a unique non-empty title and a slug-safe title", () => {
    expect(seedTopics.length).toBeGreaterThan(0);
    const titles = seedTopics.map((t) => t.title);
    for (const title of titles) {
      expect(title.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(titles).size).toBe(titles.length);
    const slugs = seedSlugs();
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG_SAFE);
    }
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("the main lesson renders and its HTML exercises every rich-content feature", async () => {
    const main = mainTopic();
    const { html, headings } = await renderMarkdown(main.body ?? "", {
      permalinks: seedSlugs(),
    });
    expect(html).toContain("katex");
    expect(html).toContain("data-callout");
    expect(html).toContain('data-block="mermaid"');
    expect(html).toContain('data-block="plot"');
    expect(html).toContain("<table>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<mark>");
    expect(html).toContain("/topic/");
    expect(html).toContain("<h2");
    expect(html).not.toContain("<h1");
    expect(headings.length).toBeGreaterThan(0);
  });

  it("leaves no %%comment%% residue in rendered output", async () => {
    const main = mainTopic();
    const { html } = await renderMarkdown(main.body ?? "", {
      permalinks: seedSlugs(),
    });
    expect(html).not.toContain("%%");
    expect(html).not.toContain("Author note");
  });

  it("every [[wikilink]] target in every seed body resolves to a seed slug", () => {
    const known = new Set(seedSlugs());
    for (const topic of seedTopics) {
      for (const slug of extractWikilinks(topic.body ?? "")) {
        expect(known.has(slug)).toBe(true);
      }
    }
  });

  it("the main topic links out and is linked to (backlinks both directions)", () => {
    const topics = seedTopics.map((t) => ({
      slug: slugifyTitle(t.title),
      title: t.title,
      body: t.body ?? "",
    }));
    const mainSlug = slugifyTitle(mainTopic().title);
    const backlinks = buildBacklinks(topics);
    expect(backlinks.get(mainSlug)!.length).toBeGreaterThan(0);
    const linkedFromMain = topics.some((t) =>
      (backlinks.get(t.slug) ?? []).includes(mainSlug)
    );
    expect(linkedFromMain).toBe(true);
    const graph = buildTopicGraph(topics);
    expect(graph.links.some((l) => l.source === mainSlug)).toBe(true);
    expect(graph.links.some((l) => l.target === mainSlug)).toBe(true);
  });
});

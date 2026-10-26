import { describe, expect, it } from "vitest";
import {
  clearRenderCache,
  extractWikilinks,
  renderCacheSize,
  renderMarkdown,
} from "../src/features/content/pipeline";

describe("markdown pipeline", () => {
  it("renders GFM: tables, task lists, strikethrough", async () => {
    const { html } = await renderMarkdown(
      "| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~gone~~\n"
    );
    expect(html).toContain("<table>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<del>gone</del>");
  });

  it("renders math with KaTeX", async () => {
    const { html } = await renderMarkdown("Inline $x^2$ and block:\n\n$$a + b$$\n");
    expect(html).toContain("katex");
  });

  it("highlights code server-side without client JS hooks", async () => {
    const { html } = await renderMarkdown("```python\ndef f():\n    return 1\n```\n");
    expect(html).toContain('data-language="python"');
    expect(html).toContain("<span");
  });

  it("does not crash on unknown fence languages", async () => {
    const { html } = await renderMarkdown("```foobar\nsome code\n```\n");
    expect(html).toContain("some code");
  });

  it("renders Obsidian callouts, including collapsible ones", async () => {
    const { html } = await renderMarkdown(
      "> [!note] Title\n> body text\n\n> [!warning]- Fold me\n> hidden\n"
    );
    expect(html).toContain('data-callout="note"');
    expect(html).toContain('data-callout="warning"');
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
  });

  it("renders wikilinks to topic pages with existence styling", async () => {
    const { html } = await renderMarkdown("See [[Quadratic Functions]] and [[Missing Page]].", {
      permalinks: ["quadratic-functions"],
    });
    expect(html).toContain('href="/topic/quadratic-functions"');
    expect(html).toContain("ace-wikilink");
    expect(html).toContain('href="/topic/missing-page"');
    expect(html).toContain("ace-wikilink-new");
  });

  it("supports aliased wikilinks", async () => {
    const { html } = await renderMarkdown("See [[Quadratic Functions|quadratics]] here.", {
      permalinks: ["quadratic-functions"],
    });
    expect(html).toContain('href="/topic/quadratic-functions"');
    expect(html).toContain(">quadratics<");
  });

  it("turns mermaid fences into block slots that keep the source", async () => {
    const { html } = await renderMarkdown("```mermaid\nflowchart A-->B\n```\n");
    expect(html).toContain('data-block="mermaid"');
    expect(html).toContain("flowchart A-->B");
    expect(html).not.toContain("<svg");
  });

  it("turns plot fences into block slots", async () => {
    const { html } = await renderMarkdown("```plot\nfn: x^2\nx: -2 2\n```\n");
    expect(html).toContain('data-block="plot"');
    expect(html).toContain("fn: x^2");
  });

  it("keeps invalid diagram source instead of crashing", async () => {
    const { html } = await renderMarkdown("```mermaid\nthis is not valid ~~~\n```\n");
    expect(html).toContain('data-block="mermaid"');
    expect(html).toContain("this is not valid");
  });

  it("supports ==highlights== and strips %%comments%%", async () => {
    const { html } = await renderMarkdown("Keep ==this== but %%not this%%.\n");
    expect(html).toContain("<mark>this</mark>");
    expect(html).not.toContain("not this");
  });

  it("does not touch code spans or math when marking", async () => {
    const { html } = await renderMarkdown("`==literal==` and $==x==$ stay.\n");
    expect(html).not.toContain("<mark>");
  });

  it("sanitizes raw HTML: scripts and javascript: URLs die, details survive", async () => {
    const { html } = await renderMarkdown(
      '<script>alert(1)</script>\n\n<a href="javascript:alert(1)">x</a>\n\n<details><summary>s</summary><p>ok</p></details>\n'
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<details>");
  });

  it("assigns heading ids and returns them for the TOC", async () => {
    const { headings } = await renderMarkdown("# Hello World\n\n## Hello World\n");
    expect(headings.map((h) => h.id)).toEqual(["hello-world", "hello-world-1"]);
  });

  it("demotes embedded headings so the page keeps a single h1", async () => {
    const { html, headings } = await renderMarkdown("# Title\n\n### Deep\n");
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2");
    expect(headings.map((h) => h.depth)).toEqual([2, 4]);
  });
});

describe("render cache", () => {
  it("memoizes identical inputs and copies results", async () => {
    clearRenderCache();
    const a = await renderMarkdown("# Cached\n");
    expect(renderCacheSize()).toBe(1);
    const b = await renderMarkdown("# Cached\n");
    expect(renderCacheSize()).toBe(1);
    expect(b).toEqual(a);
    expect(b).not.toBe(a);
    expect(b.headings).not.toBe(a.headings);
    const c = await renderMarkdown("# Different\n");
    expect(renderCacheSize()).toBe(2);
    expect(c.html).not.toBe(a.html);
  });

  it("keys on permalinks too", async () => {
    clearRenderCache();
    await renderMarkdown("See [[X]].", { permalinks: [] });
    await renderMarkdown("See [[X]].", { permalinks: ["x"] });
    expect(renderCacheSize()).toBe(2);
  });

  it("evicts oldest entries past the cap", async () => {
    clearRenderCache();
    for (let i = 0; i < 105; i++) {
      await renderMarkdown(`# Doc ${i}\n`);
    }
    expect(renderCacheSize()).toBe(100);
    // The first entry is gone: re-rendering it grows the cache again.
    await renderMarkdown("# Doc 0\n");
    expect(renderCacheSize()).toBe(100);
  });
});

describe("extractWikilinks", () => {
  it("finds targets, skips fences, dedupes, strips aliases/fragments", () => {
    const src = [
      "See [[Quadratic Functions]] and [[Graph Theory|graphs]].",
      "```mermaid",
      "A[[not-a-link]]B",
      "```",
      "Again [[quadratic functions#vertex]] and [[Quadratic Functions]].",
    ].join("\n");
    expect(extractWikilinks(src).sort()).toEqual(["graph-theory", "quadratic-functions"]);
  });

  it("ignores wikilinks inside inline code and math, like the renderer", () => {
    const src = "Real [[Target]] but `[[Not A Link]]` and $[[x^2]]$ are not.";
    expect(extractWikilinks(src)).toEqual(["target"]);
  });

  it("treats [[a:b]] the same as the renderer (no colon split)", () => {
    expect(extractWikilinks("See [[a:b]].")).toEqual(["a-b"]);
  });
});

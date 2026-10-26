import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/features/content";

describe("slot details", () => {
  it("wraps mermaid source in <details><summary>Source</summary> with a source pre", async () => {
    const { html } = await renderMarkdown("```mermaid\nflowchart A-->B\n```\n");
    expect(html).toContain('data-block="mermaid"');
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>Source</summary>");
    expect(html).toContain("ace-block-source");
    expect(html).toContain("flowchart A-->B");
  });

  it("wraps plot source in <details><summary>Source</summary> with a source pre", async () => {
    const { html } = await renderMarkdown("```plot\nfn: x^2\n```\n");
    expect(html).toContain('data-block="plot"');
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>Source</summary>");
    expect(html).toContain("ace-block-source");
    expect(html).toContain("fn: x^2");
  });

  it("renders math alongside mermaid and plot slots without throwing", async () => {
    const { html } = await renderMarkdown(
      "Inline $x^2$ and block:\n\n$$a + b$$\n\n```mermaid\nflowchart A-->B\n```\n\n```plot\nfn: x^2\n```\n"
    );
    expect(html).toContain("katex");
    expect(html).toContain('data-block="mermaid"');
    expect(html).toContain('data-block="plot"');
    expect(html).toContain("<details>");
  });

  it("leaves the toc notice path unaffected", async () => {
    const { html } = await renderMarkdown("Just prose, no headings.\n\n```toc\n```\n");
    expect(html).toContain('data-block="toc"');
    expect(html).toContain("No headings");
    expect(html).not.toContain("<nav");
  });

  it("keeps the source text inside the details element for no-JS readers", async () => {
    const { html } = await renderMarkdown("```mermaid\nflowchart A-->B\n```\n");
    const detailsOpen = html.indexOf("<details>");
    const detailsClose = html.indexOf("</details>");
    const sourceAt = html.indexOf("flowchart");
    expect(detailsOpen).toBeGreaterThanOrEqual(0);
    expect(detailsClose).toBeGreaterThan(detailsOpen);
    expect(sourceAt).toBeGreaterThan(detailsOpen);
    expect(sourceAt).toBeLessThan(detailsClose);
  });
});

import { describe, expect, it } from "vitest";
import { isBlockLanguage, renderMarkdown } from "../src/features/content";

describe("toc block", () => {
  it("is a registered block language", () => {
    expect(isBlockLanguage("toc")).toBe(true);
  });

  it("routes a toc fence to a block slot", async () => {
    const { html } = await renderMarkdown("# Alpha\n\n```toc\n```\n");
    expect(html).toContain('data-block="toc"');
  });

  it("renders the document headings as a nav list of anchor links", async () => {
    const { html } = await renderMarkdown("# Alpha\n\n```toc\n```\n\n## Beta Gamma\n");
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Contents"');
    expect(html).toContain('href="#user-content-alpha"');
    expect(html).toContain('href="#user-content-beta-gamma"');
    expect(html).toContain(">Alpha<");
    expect(html).toContain(">Beta Gamma<");
  });

  it("ignores the fence body and extra info-string content", async () => {
    const { html } = await renderMarkdown(
      '# Alpha\n\n```toc some-option\nignored body [[Not A Link]]\n```\n'
    );
    expect(html).toContain('href="#user-content-alpha"');
  });

  it("renders a short notice instead of crashing with no headings", async () => {
    const { html } = await renderMarkdown("Just prose, no headings.\n\n```toc\n```\n");
    expect(html).toContain('data-block="toc"');
    expect(html).not.toContain("<nav");
    expect(html).toContain("No headings");
  });

  it("renders a notice for an empty fence in an empty document", async () => {
    const { html } = await renderMarkdown("```toc\n```\n");
    expect(html).toContain("No headings");
  });
});

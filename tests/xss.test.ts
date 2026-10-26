import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/features/content/pipeline";

// Hardening tests for the markdown sanitizer (rehype-sanitize +
// aceSanitizeSchema). Every assertion below was verified by running the
// pipeline: the tests pin actual behavior, not assumed behavior.
describe("xss hardening", () => {
  it("strips script elements", async () => {
    const { html } = await renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("strips style elements", async () => {
    const { html } = await renderMarkdown("<style>body{color:red}</style>\n\npara\n");
    expect(html).not.toContain("<style");
    expect(html).toContain("para");
  });

  it("strips iframe, object, and embed elements", async () => {
    const { html } = await renderMarkdown(
      '<iframe src="https://evil.test"></iframe>\n\n<object data="https://evil.test"></object>\n\n<embed src="https://evil.test">\n'
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<object");
    expect(html).not.toContain("<embed");
  });

  it("strips event-handler attributes but keeps harmless markup", async () => {
    const { html } = await renderMarkdown(
      '<p onclick="alert(1)">hi</p>\n\n<img src="x" onerror="alert(1)">\n'
    );
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("<p>hi</p>");
    expect(html).toContain('<img src="x">');
  });

  it("strips javascript:/vbscript:/data:text/html hrefs but keeps link text", async () => {
    const { html } = await renderMarkdown(
      '<a href="javascript:alert(1)">x</a>\n\n<a href="vbscript:msgbox(1)">y</a>\n\n<a href="data:text/html,<script>alert(1)</script>">z</a>\n'
    );
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("vbscript:");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain("<a>x</a>");
    expect(html).toContain("<a>y</a>");
    expect(html).toContain("<a>z</a>");
  });

  it("preserves style attributes on KaTeX output", async () => {
    const { html } = await renderMarkdown("Inline $x^2$ done\n");
    expect(html).toContain('class="katex"');
    expect(html).toContain("style=");
  });

  // Deliberate hole, documented in src/features/content/sanitize.ts:
  // `style` passes through because KaTeX and shiki emit deterministic
  // server-side styles. Verified by running: a malicious style value is
  // kept verbatim inside the quoted attribute (no filtering), so this
  // test pins confinement -- the payload must not escape the attribute
  // into markup, event handlers, or script elements. Pair with a
  // restrictive Content-Security-Policy if ACE ever renders untrusted
  // third-party HTML. CSS expression() is inert in modern browsers and
  // url(javascript:...) in inline style does not execute there.
  it("confines a malicious expression() style value to the style attribute", async () => {
    const { html } = await renderMarkdown(
      '<span style="color: red; xss: expression(alert(1))">hi</span>\n'
    );
    expect(html).toContain("style=");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    // No new elements smuggled out of the attribute.
    expect(html.match(/<span/g)).toHaveLength(1);
  });

  it("confines a malicious url(javascript:) style value to the style attribute", async () => {
    const { html } = await renderMarkdown(
      '<span style="background-image: url(javascript:alert(1))">hi</span>\n'
    );
    expect(html).toContain("style=");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html.match(/<span/g)).toHaveLength(1);
  });

  it("strips javascript: and data: srcset on source elements", async () => {
    const { html } = await renderMarkdown(
      '<picture><source srcset="javascript:alert(1)"><source srcset="data:image/svg+xml,<svg></svg>"></picture>\n'
    );
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:image");
  });

  it("keeps http(s) srcset on source elements", async () => {
    const { html } = await renderMarkdown(
      '<picture><source srcset="https://example.test/a.png 1x"></picture>\n'
    );
    expect(html).toContain("https://example.test/a.png");
  });

  it("keeps the open attribute on raw details elements", async () => {
    const { html } = await renderMarkdown(
      "<details open><summary>s</summary><p>ok</p></details>\n"
    );
    expect(html).toContain("<details open>");
    expect(html).toContain("ok");
  });

  it("strips nested malicious markup inside blockquotes", async () => {
    const { html } = await renderMarkdown(
      "> <script>alert(1)</script>\n> quote <img src=x onerror=alert(1)> text\n"
    );
    expect(html).toContain("<blockquote>");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("quote");
  });

  it("strips nested malicious markup inside callouts", async () => {
    const { html } = await renderMarkdown(
      '> [!note] Title\n> <script>alert(1)</script> body <a href="javascript:alert(1)">x</a>\n'
    );
    expect(html).toContain('data-callout="note"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("strips SVG carrying an onload handler", async () => {
    const { html } = await renderMarkdown(
      '<svg onload="alert(1)"><circle cx="5" cy="5" r="4"/></svg>\n'
    );
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("onload");
    expect(html).not.toContain("alert(1)");
  });
});

import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/features/content/pipeline";

// Adversarial sanitize fuzz for the markdown pipeline (rehype-sanitize +
// aceSanitizeSchema). Every assertion pins behavior observed by running the
// pipeline (probed 2026-10-26), not assumed behavior: where the sanitizer's
// exact output was uncertain, the tests assert the SAFE property (dangerous
// construct gone, benign content kept) rather than an exact string.
describe("xss fuzz", () => {
  it("strips nested script inside a blockquote", async () => {
    const { html } = await renderMarkdown(
      "> <script>alert(1)</script>\n> quote <b>text</b>\n"
    );
    expect(html).toContain("<blockquote>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("quote");
  });

  it("strips nested script and js href inside a callout", async () => {
    const { html } = await renderMarkdown(
      '> [!note] Title\n> <script>alert(1)</script> body <a href="javascript:alert(1)">x</a>\n'
    );
    expect(html).toContain('data-callout="note"');
    expect(html).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("drops a svg element carrying onload", async () => {
    const { html } = await renderMarkdown(
      '<svg onload="alert(1)"><circle cx="5" cy="5" r="4"/></svg>\n'
    );
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("onload");
    expect(html).not.toContain("alert(1)");
  });

  it("strips onerror from img but keeps the image", async () => {
    const { html } = await renderMarkdown('<img src="x" onerror="alert(1)">\n');
    expect(html).toContain('<img src="x">');
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).not.toContain("alert(1)");
  });

  it("drops iframe elements entirely", async () => {
    const { html } = await renderMarkdown(
      '<iframe src="https://evil.test"></iframe>\n\nstill here\n'
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("evil.test");
    expect(html).toContain("still here");
  });

  it("drops object elements entirely", async () => {
    const { html } = await renderMarkdown(
      '<object data="https://evil.test"><param name="x" value="y"></object>\n\nstill here\n'
    );
    expect(html).not.toContain("<object");
    expect(html).not.toContain("evil.test");
    expect(html).toContain("still here");
  });

  it("drops embed elements entirely", async () => {
    const { html } = await renderMarkdown(
      '<embed src="https://evil.test" type="text/html">\n\nstill here\n'
    );
    expect(html).not.toContain("<embed");
    expect(html).not.toContain("evil.test");
    expect(html).toContain("still here");
  });

  it("neuters form and password inputs: no form, no password type", async () => {
    const { html } = await renderMarkdown(
      '<form action="https://evil.test"><input type="password" name="p"><button>go</button></form>\n'
    );
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("evil.test");
    expect(html).not.toContain('type="password"');
    expect(html).not.toContain("action=");
    // Any surviving input is forced into a disabled checkbox (observed):
    // it can neither submit nor exfiltrate.
    if (html.includes("<input")) {
      expect(html).toContain("disabled");
      expect(html).toContain('type="checkbox"');
    }
  });

  it("strips javascript: and vbscript: hrefs but keeps link text", async () => {
    const { html } = await renderMarkdown(
      '<a href="javascript:alert(1)">x</a>\n\n<a href="vbscript:msgbox(1)">y</a>\n\n[y](vbscript:msgbox(1))\n'
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html.toLowerCase()).not.toContain("vbscript:");
    expect(html).toContain("<a>x</a>");
    expect(html).toContain("<a>y</a>");
  });

  it("strips data: hrefs but keeps link text", async () => {
    const { html } = await renderMarkdown(
      '<a href="data:image/svg+xml,<svg onload=alert(1)>">z</a>\n\n[z](data:text/html,<script>alert(1)</script>)\n'
    );
    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("data:image/svg+xml");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<svg");
    expect(html).toContain("<a>z</a>");
  });

  it("confines an expression() style value to the style attribute", async () => {
    const { html } = await renderMarkdown(
      '<span style="color: red; xss: expression(alert(1))">hi</span>\n'
    );
    // Documented hole (see sanitize.ts): style passes through verbatim, so
    // pin confinement: no breakout into markup, handlers, or scripts.
    expect(html).toContain("style=");
    expect(html).toContain("hi");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html.match(/<span/g)).toHaveLength(1);
  });

  it("confines a url(javascript:) style value to the style attribute", async () => {
    const { html } = await renderMarkdown(
      '<span style="background-image: url(javascript:alert(1))">hi</span>\n'
    );
    expect(html).toContain("style=");
    expect(html).toContain("hi");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html.match(/<span/g)).toHaveLength(1);
  });

  it("confines a behavior: style value to the style attribute", async () => {
    const { html } = await renderMarkdown(
      '<span style="behavior: url(evil.htc)">hi</span>\n'
    );
    expect(html).toContain("style=");
    expect(html).toContain("hi");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html.match(/<span/g)).toHaveLength(1);
  });

  it("strips ping from anchors but keeps a safe href", async () => {
    const { html } = await renderMarkdown(
      '<a href="https://ok.test" ping="https://evil.test">x</a>\n'
    );
    expect(html).toContain('href="https://ok.test"');
    expect(html).not.toContain("ping");
    expect(html).not.toContain("evil.test");
    expect(html).toContain(">x</a>");
  });

  it("strips ontoggle from details but keeps the element", async () => {
    const { html } = await renderMarkdown(
      '<details ontoggle="alert(1)"><summary>s</summary><p>ok</p></details>\n'
    );
    expect(html).toContain("<details>");
    expect(html).not.toContain("ontoggle");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("ok");
  });

  it("strips a javascript: src from markdown images but keeps alt text", async () => {
    const { html } = await renderMarkdown("![alt](javascript:alert(1))\n");
    expect(html).toContain("<img");
    expect(html).toContain('alt="alt"');
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).not.toContain("src=");
  });

  it("strips raw script inside ==highlight== markers (no mark forged)", async () => {
    const { html } = await renderMarkdown(
      "Keep ==a<script>alert(1)</script>b== end.\n"
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("end.");
  });

  it("escapes (never executes) script text inside a real ==highlight==", async () => {
    const { html } = await renderMarkdown(
      "Keep ==&lt;script&gt;alert(1)&lt;/script&gt;== end.\n"
    );
    expect(html).toContain("<mark>");
    expect(html).not.toContain("<script");
    // The payload is entity-escaped text inside the mark, not an element.
    expect(html).toContain("&#x3C;script>");
  });

  it("routes a wikilink with a javascript: target to a safe slug", async () => {
    const { html } = await renderMarkdown(
      "See [[javascript:alert(1)]] and [[javascript:alert(1)|click me]] here.\n"
    );
    expect(html).toContain('href="/topic/javascript-alert-1"');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).toContain("click me");
  });

  it("escapes a breakout attempt inside a mermaid block slot", async () => {
    const { html } = await renderMarkdown(
      "```mermaid\nflowchart A-->B\n</div><script>alert(1)</script>\n```\n"
    );
    expect(html).toContain('data-block="mermaid"');
    // Slot source is emitted as text: the breakout is entity-escaped.
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
    expect(html).toContain("flowchart A-->B");
    expect(html.match(/<div/g)).toHaveLength(1);
  });

  it("never turns \\href{javascript:...} math into a link", async () => {
    const { html } = await renderMarkdown(
      "See $\\href{javascript:alert(1)}{click}$ done.\n"
    );
    expect(html).toContain("katex");
    // KaTeX runs untrusted (no trust option), so \\href renders as an error
    // span, never an anchor: pin the absence of any link machinery.
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain("href=");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
  });

  it("never turns display \\href{javascript:...} math into a link", async () => {
    const { html } = await renderMarkdown(
      "$$\n\\href{javascript:alert(1)}{click}\n$$\n"
    );
    expect(html).toContain("katex");
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain("href=");
    expect(html).not.toContain("<script");
  });

  it("never turns \\includegraphics math into markup", async () => {
    const { html } = await renderMarkdown(
      "See $\\includegraphics{javascript:evil}$ done.\n"
    );
    expect(html).toContain("katex");
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son\w+\s*=/i);
  });

  it("decodes then strips an entity-obfuscated javascript: href", async () => {
    const { html } = await renderMarkdown(
      '<a href="&#106;avascript:alert(1)">x</a>\n\n[x](&#106;avascript:alert(1))\n'
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("<a>x</a>");
  });

  it("strips tab/newline-obfuscated javascript: URLs in attributes", async () => {
    const { html } = await renderMarkdown(
      '<a href="java\tscript:alert(1)">x</a>\n\n<a href="java\nscript:alert(1)">y</a>\n'
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("<a>x</a>");
    expect(html).toContain("<a>y</a>");
  });

  it("does not linkify a newline-split javascript: markdown destination", async () => {
    const { html } = await renderMarkdown("[x](java\nscript:alert(1))\n");
    // No link is created at all, so there is nothing to execute.
    expect(html).not.toContain("<a");
    expect(html).not.toContain("href=");
  });
});

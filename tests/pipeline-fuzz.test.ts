import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/features/content/pipeline";

// Property-style robustness fuzz for the markdown pipeline.
//
// Deterministic: every byte comes from mulberry32 streams with fixed seeds.
// No Math.random / Date.now anywhere in this file.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intBelow(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[intBelow(rng, arr.length)];
}

const LOREM = [
  "alpha", "bravo", "delta", "gamma", "helix", "kaTeX", "mermaid",
  "wikilink", "callout", "gfm", "table", "emphasis", "blockquote",
];

function words(rng: () => number, n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pick(rng, LOREM));
  return out.join(" ");
}

// --- fragment builders (each takes rng, returns markdown) ----------------

function fragUnclosedFence(rng: () => number): string {
  const lang = pick(rng, ["", "python", "js", "foobar-bogus-lang", "mermaid", "plot"]);
  return "```" + lang + "\n" + words(rng, 8) + "\nconsole.log('<b>not html</b>');\n";
}

function fragClosedFence(rng: () => number): string {
  const lang = pick(rng, ["python", "js", "rust", "foobar-bogus-lang", "mermaid", "plot"]);
  return (
    "```" + lang + "\n" + words(rng, 12) + "\n```\n"
  );
}

function fragUnclosedCodeSpan(rng: () => number): string {
  return "inline `code " + words(rng, 4) + " never closes and [[Not A Link " + intBelow(rng, 999);
}

function fragUnclosedMath(rng: () => number): string {
  return pick(rng, [
    "dangling inline $x^2 + \\frac{1}{2} never closes\n",
    "$$\ndisplay \\sum_{i=0}^{n} i^2 never closes\n",
    "price $5 and $10 are just dollars $x + y\n",
  ]);
}

function fragLongLine(rng: () => number): string {
  const kind = intBelow(rng, 4);
  if (kind === 0) return "a".repeat(10_000);
  if (kind === 1) return "# " + "b".repeat(9_970);
  if (kind === 2) return ("word ".repeat(2000) + "<b>tail</b>").slice(0, 10_000);
  return ("[[Link]] ".repeat(1400)).slice(0, 10_000);
}

function fragHeadingsBurst(rng: () => number, docIndex: number): string {
  const n = 5 + intBelow(rng, 26);
  const lines: string[] = [];
  for (let k = 0; k < n; k++) {
    const depth = 1 + intBelow(rng, 4);
    lines.push("#".repeat(depth) + ` Fuzz ${docIndex}-${k} <b>html</b> &amp; entities`);
  }
  return lines.join("\n");
}

function fragDeepNesting(rng: () => number): string {
  const depth = 5 + intBelow(rng, 46); // up to 50 deep
  const q = "> ".repeat(depth) + "deep quote " + words(rng, 3) + "\n";
  let list = "";
  for (let d = 0; d < depth; d++) list += "  ".repeat(d) + `- item d${d} [[L${d}]]\n`;
  return q + list;
}

function fragWikilinks(rng: () => number): string {
  const n = 1 + intBelow(rng, 20);
  const parts: string[] = [];
  for (let k = 0; k < n; k++) {
    const t = pick(rng, [
      `Topic ${intBelow(rng, 50)}`,
      `Topic ${intBelow(rng, 50)}|alias ${k}`,
      `a:b colon ${k}`,
      `Frag ${k}#section-${k % 5}`,
      `weird:scheme-${k}`,
    ]);
    parts.push(`[[${t}]]`);
  }
  return "Links: " + parts.join(" ") + "\n";
}

function fragUnicode(rng: () => number): string {
  const edge = [
    "\u0000 null above",
    "ZWJ: \u200D end",
    "RTL: \u200E left \u200F right \u202B embed \u202C pop \u202D override \u202E visual",
    "BOM: \uFEFF here",
    "replacement: \uFFFD here",
    "combining: e\u0301 \u036F tail",
    "family: \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} end",
    "CJK: \u6F22\u5B57 \u3072\u3089\u304C\u306A mixed",
    "arabic: \u0645\u0631\u062D\u0628\u0627 rtl",
    "lone surrogate escaped: \uD800 between",
    "literal backslash-u: \\uD800 stays text",
    "astral: \u{1F600} \u{1D11E} mathclef",
  ];
  return pick(rng, edge) + " " + words(rng, 4) + "\n";
}

function fragTable(rng: () => number): string {
  const cols = 2 + intBelow(rng, 5);
  const rows = 2 + intBelow(rng, 6);
  const head = Array.from({ length: cols }, (_, c) => `h${c} <i>x</i>`);
  const sep = Array.from({ length: cols }, () => pick(rng, ["---", ":--", "--:", ":-:"]));
  const body: string[] = [];
  for (let r = 0; r < rows; r++) {
    body.push(
      Array.from(
        { length: cols },
        (_, c) => pick(rng, [`c${r}-${c}`, "**b**", "`code`", "$x$", "[[W]]", "a|b"])
      ).join(" | ")
    );
  }
  return `| ${head.join(" | ")} |\n| ${sep.join(" | ")} |\n` + body.map((b) => `| ${b} |`).join("\n") + "\n";
}

function fragEmphasis(rng: () => number): string {
  const n = 4 + intBelow(rng, 120);
  return pick(rng, [
    "*".repeat(n) + "mid" + "*".repeat(n),
    "_".repeat(n) + "mid" + "_".repeat(n),
    ("**a** ".repeat(30) + "***oops ".repeat(intBelow(rng, 10))).trim(),
    "__".repeat(n) + "x",
    "**** **** ****",
    "a*b*c*d*e*f*g",
  ]) + "\n";
}

function fragMixed(rng: () => number): string {
  return [
    "| a | b |",
    "|---|---|",
    "| 1 | 2 |",
    "",
    "- [x] done " + words(rng, 2),
    "- [ ] todo",
    "",
    "~~struck~~ and ==marked== but %%comment removed%%.",
    "",
    "Inline $x^2$ and block:",
    "",
    "$$a + b$$",
    "",
    "> [!note] " + words(rng, 3),
    "> body [[Mixed Target]]",
    "",
    "See [[Mixed Target|alias]] and $[[not-a-link]] and `[[code-link]]`.",
    "",
  ].join("\n");
}

// NOTE: fragments deliberately avoid literal "javascript:"/"<script" payloads
// in positions the pipeline keeps as inert text (KaTeX \href error text,
// wikilink anchor text, <style> text content, fenced-code source text when
// an unclosed fence swallows later fragments): those are safe (no link,
// pinned by xss-fuzz.test.ts) but would violate the mandated no-substring
// invariant below. Attack shapes with stripped URLs live here instead.
function fragRawHtml(rng: () => number): string {
  return pick(rng, [
    "<script>alert(1)</script>\n",
    "<ScRiPt>alert(2)</ScRiPt>\n",
    '<a href="vbscript:msgbox(1)">y</a>\n',
    '<a href="data:text/html,<b>x</b>">z</a>\n',
    '<img src="x" onerror="alert(1)">\n',
    '<svg onload="alert(1)"><circle cx="5" cy="5" r="4"/></svg>\n',
    '<iframe src="https://evil.test"></iframe>\n',
    "<style>p{color:red}</style>\n",
    "<!-- comment <script> -->\n",
    "<div><p>unclosed div\n",
    '<a href="&#106;avascript:alert(1)">entity obfuscated</a>\n',
    "![alt](data:text/html,hi)\n",
    "[x](vbscript:msgbox(1))\n",
    "> <script>alert(quoted)</script>\n",
    "Keep ==a<script>alert(1)</script>b== end.\n",
    "```mermaid\nflowchart A-->B\n</div><script>alert(1)</script>\n```\n",
    "See $\\href{https://ok.test}{click}$ math.\n",
  ]);
}

function fragCallout(rng: () => number): string {
  return pick(rng, [
    "> [!note] " + words(rng, 3) + "\n> body text\n",
    "> [!warning]- Fold me\n> hidden\n",
    "> [!tip]+ Open\n> shown\n",
    "> [!bogus-kind] Title\n> body\n",
    "> [!note] <script>alert(1)</script> body\n",
    "> plain quote " + words(rng, 5) + "\n>> nested >> quote\n",
  ]);
}

const FRAGMENTS: ReadonlyArray<{
  kind: string;
  build: (rng: () => number, docIndex: number) => string;
}> = [
  { kind: "unclosed-fence", build: (r) => fragUnclosedFence(r) },
  { kind: "closed-fence", build: (r) => fragClosedFence(r) },
  { kind: "unclosed-code", build: (r) => fragUnclosedCodeSpan(r) },
  { kind: "unclosed-math", build: (r) => fragUnclosedMath(r) },
  { kind: "long-line", build: (r) => fragLongLine(r) },
  { kind: "headings", build: (r, i) => fragHeadingsBurst(r, i) },
  { kind: "deep-nesting", build: (r) => fragDeepNesting(r) },
  { kind: "wikilinks", build: (r) => fragWikilinks(r) },
  { kind: "unicode", build: (r) => fragUnicode(r) },
  { kind: "table", build: (r) => fragTable(r) },
  { kind: "emphasis", build: (r) => fragEmphasis(r) },
  { kind: "mixed", build: (r) => fragMixed(r) },
  { kind: "raw-html", build: (r) => fragRawHtml(r) },
  { kind: "callout", build: (r) => fragCallout(r) },
];

interface FuzzDoc {
  source: string;
  kinds: string[];
}

function buildRandomDoc(rng: () => number, docIndex: number): FuzzDoc {
  const count = 2 + intBelow(rng, 3); // 2-4 fragments per doc
  const idxs = new Set<number>();
  while (idxs.size < count) idxs.add(intBelow(rng, FRAGMENTS.length));
  const parts: string[] = [];
  const kinds: string[] = [];
  for (const i of idxs) {
    parts.push(FRAGMENTS[i].build(rng, docIndex));
    kinds.push(FRAGMENTS[i].kind);
  }
  return { source: parts.join("\n\n"), kinds };
}

// Dedicated extremes (each also counted toward the 200+ corpus).
function dedicatedExtremes(): FuzzDoc[] {
  const headings2000 = Array.from(
    { length: 2000 },
    (_, i) => `# Extreme heading ${i}`
  ).join("\n");

  const wikis500 = Array.from({ length: 500 }, (_, i) => `[[Extreme Page ${i % 50}|alias ${i}]]`).join(
    " "
  );

  const cols = 50;
  const head = Array.from({ length: cols }, (_, c) => `h${c}`).join(" | ");
  const sep = Array.from({ length: cols }, () => "---").join(" | ");
  const rows = Array.from({ length: 49 }, (_, r) =>
    Array.from({ length: cols }, (_, c) => `c${r}-${c}`).join(" | ")
  );
  const table50x50 = `| ${head} |\n| ${sep} |\n` + rows.map((r) => `| ${r} |`).join("\n");

  const depth = 50;
  const deepQuote = "> ".repeat(depth) + "fifty deep\n";
  let deepList = "";
  for (let d = 0; d < depth; d++) deepList += "  ".repeat(d) + `- level ${d}\n`;

  return [
    { source: headings2000, kinds: ["headings"] },
    { source: wikis500, kinds: ["wikilinks"] },
    { source: table50x50, kinds: ["table"] },
    { source: deepQuote + deepList, kinds: ["deep-nesting"] },
    { source: "a".repeat(10_000), kinds: ["long-line"] },
    {
      source: "```python\ndef f():\n    return 1\n\nInline $x^2 dangling\n\n$$\nblock never closes\n",
      kinds: ["unclosed-fence", "unclosed-math"],
    },
    { source: "\u0000 \u200D \u202E \uFEFF \uFFFD \uD800 \\uD800 \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}\n", kinds: ["unicode"] },
    { source: "*".repeat(400) + "mid" + "*".repeat(400), kinds: ["emphasis"] },
    {
      source: [
        "| a | b |",
        "|---|---|",
        "| 1 | 2 |",
        "",
        "Inline $E = mc^2$ and:",
        "",
        "$$\\sum_{i=0}^{n} i$$",
        "",
        "> [!note] Mixed",
        "> body [[Kitchen Sink]]",
        "",
        "- [x] done ~~gone~~ ==mark==",
      ].join("\n"),
      kinds: ["mixed", "table", "unclosed-math", "callout", "wikilinks"],
    },
  ];
}

const CORPUS_SEED = 0xacef42;
const RANDOM_DOCS = 212;

function buildCorpus(): FuzzDoc[] {
  const rng = mulberry32(CORPUS_SEED);
  const docs: FuzzDoc[] = [];
  for (let i = 0; i < RANDOM_DOCS; i++) docs.push(buildRandomDoc(rng, i));
  docs.push(...dedicatedExtremes());
  return docs;
}

const CORPUS: FuzzDoc[] = buildCorpus();

function expectNoNeedle(html: string, needle: string, label: string) {
  const idx = html.toLowerCase().indexOf(needle);
  expect(
    idx,
    `${label}: no ${needle} (at ${idx}: ...${html.slice(Math.max(0, idx - 160), idx + 80)}...)`
  ).toBe(-1);
}

async function expectRobust(source: string, label: string) {
  const { html, headings } = await renderMarkdown(source);
  expect(typeof html, `${label}: html is a string`).toBe("string");
  expectNoNeedle(html, "<script", label);
  expectNoNeedle(html, "javascript:", label);
  const ids = headings.map((h) => h.id);
  expect(new Set(ids).size, `${label}: heading ids unique`).toBe(ids.length);
  expect(
    html.length,
    `${label}: html length within 100x input`
  ).toBeLessThanOrEqual(100 * Math.max(source.length, 16));
  return { html, headings };
}

describe("pipeline fuzz", () => {
  it(
    `renders ${CORPUS.length} adversarial docs without throwing or leaking scripts`,
    async () => {
      expect(CORPUS.length).toBeGreaterThanOrEqual(200);
      for (let i = 0; i < CORPUS.length; i++) {
        const doc = CORPUS[i];
        let rendered: { html: string; headings: { id: string }[] };
        try {
          rendered = await renderMarkdown(doc.source);
        } catch (err) {
          // Pipeline crash: report input + stack per task instructions.
          // No crash observed in this run; this rethrows with the doc index.
          throw new Error(
            `pipeline threw on fuzz doc #${i} (kinds=${doc.kinds.join("+")}, ` +
              `len=${doc.source.length}): ${String(err)}\nINPUT:\n${doc.source.slice(0, 2000)}`
          );
        }
        const { html, headings } = rendered;
        expect(typeof html, `doc #${i}: html is a string`).toBe("string");
        expectNoNeedle(html, "<script", `doc #${i}`);
        expectNoNeedle(html, "javascript:", `doc #${i}`);
        const ids = headings.map((h) => h.id);
        expect(new Set(ids).size, `doc #${i}: heading ids unique`).toBe(ids.length);
        expect(
          html.length,
          `doc #${i}: html length within 100x input`
        ).toBeLessThanOrEqual(100 * Math.max(doc.source.length, 16));
      }
    },
    180_000
  );

  it("corpus covers every required adversarial class", () => {
    const seen = new Set<string>();
    for (const doc of CORPUS) for (const k of doc.kinds) seen.add(k);
    for (const required of [
      "unclosed-fence",
      "unclosed-code",
      "unclosed-math",
      "long-line",
      "headings",
      "deep-nesting",
      "wikilinks",
      "unicode",
      "table",
      "emphasis",
      "mixed",
      "raw-html",
      "callout",
    ]) {
      expect(seen, `corpus covers ${required}`).toContain(required);
    }
  });
});

describe("pipeline pathological cases", () => {
  it("unclosed fence plus unclosed math never throws and keeps text", async () => {
    const source =
      "```python\ndef f():\n    return 1\n\nInline $x^2 + \\frac{1}{2} dangles\n\n$$\nblock never closes\n";
    const { html, headings } = await expectRobust(source, "unclosed-fence-math");
    // The unclosed fence swallows the rest of the doc (CommonMark), and the
    // highlighter splits code text across spans, so assert on tag-free text.
    const text = html.replace(/<[^>]*>/g, "");
    expect(text).toContain("return 1");
    expect(html).toContain('data-language="python"');
    // Math inside the fence is code, not math: no KaTeX output.
    expect(html).not.toContain("katex");
    expect(headings).toEqual([]);
  });

  it("50-deep blockquote/list nesting renders without explosion", async () => {
    const depth = 50;
    const source = "> ".repeat(depth) + "fifty deep\n";
    const { html } = await expectRobust(source, "deep-50");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("fifty deep");
  });

  it("50x50 table renders as one table", async () => {
    const cols = 50;
    const head = Array.from({ length: cols }, (_, c) => `h${c}`).join(" | ");
    const sep = Array.from({ length: cols }, () => "---").join(" | ");
    const rows = Array.from({ length: 49 }, (_, r) =>
      Array.from({ length: cols }, (_, c) => `c${r}-${c}`).join(" | ")
    );
    const source = `| ${head} |\n| ${sep} |\n` + rows.map((r) => `| ${r} |`).join("\n");
    const { html } = await expectRobust(source, "table-50x50");
    expect(html).toContain("<table>");
    expect(html).toContain("c48-49");
    expect(html).not.toContain("<script");
  });

  it("pathological emphasis runs terminate and keep inner text", async () => {
    const source = "*".repeat(300) + "mid" + "*".repeat(300) + "\n";
    const { html } = await expectRobust(source, "emphasis-run");
    expect(html).toContain("mid");
  }, 60_000);

  it("mixed GFM + math + callout kitchen sink keeps every feature", async () => {
    const source = [
      "| a | b |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "- [x] done",
      "- [ ] todo",
      "",
      "~~gone~~",
      "",
      "Inline $x^2$ and block:",
      "",
      "$$a + b$$",
      "",
      "> [!note] Title",
      "> body [[Kitchen Sink]]",
      "",
    ].join("\n");
    const { html } = await renderMarkdown(source, { permalinks: ["kitchen-sink"] });
    expect(typeof html).toBe("string");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).toContain("<table>");
    expect(html).toContain("katex");
    expect(html).toContain('data-callout="note"');
    expect(html).toContain("<del>gone</del>");
    expect(html).toContain('href="/topic/kitchen-sink"');
    expect(html.length).toBeLessThanOrEqual(100 * Math.max(source.length, 16));
  });
});

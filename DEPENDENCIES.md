# DEPENDENCIES.md — ACE skeleton (research output, Phase 0)

Researched 2026-10-25/26. Rule: exact pins, nothing published in the last
14 days (cutoff ~2026-10-11), `--ignore-scripts`, licenses MIT / Apache-2.0 /
BSD / ISC only. Dates below are `npm view <pkg> time` values (UTC).

## Install command (exact pins, run from `app/`)

```sh
npm install --ignore-scripts --save-exact \
  next@16.3.5 react@19.2.0 react-dom@19.2.0 \
  zod@4.6.7 drizzle-orm@0.45.4 \
  unified@11.0.5 remark-parse@11.0.0 remark-gfm@4.0.1 remark-math@6.0.0 \
  remark-rehype@11.1.2 rehype-raw@7.0.0 rehype-sanitize@6.0.0 \
  rehype-stringify@10.0.1 remark-wiki-link@2.0.1 rehype-callouts@2.2.0 \
  rehype-pretty-code@0.14.5 shiki@4.5.0 katex@0.18.0 \
  rehype-katex@7.0.1 mermaid@11.17.2 force-graph@1.52.0 \
  function-plot@1.25.4 codemirror@6.0.2 \
  @codemirror/state@6.5.2 @codemirror/view@6.37.0 \
  @codemirror/lang-markdown@6.5.2 ts-fsrs@5.2.0
npm install --ignore-scripts --save-exact -D \
  typescript@5.9.2 eslint@9.37.0 eslint-config-next@16.3.5 \
  vitest@4.0.0 vite@7.1.11 drizzle-kit@0.31.0 \
  @electric-sql/pglite@0.5.8 \
  @types/react@19.2.18 @types/react-dom@19.2.7 @types/node@22.20.5
```

## Choices per capability

### App framework: Next.js 16.3.5 (MIT) + React 19.2.0 (MIT)
Why: required base; App Router gives server components so text pages ship
~no client JS. Pinned 16.3.5 (2026-09-11) because 16.4.x is 2026-10-24
(inside 14-day window). React 19.2.0 (2025-10-01) satisfies Next's
`^18.2.0 || ^19.0.0` peer range. Hand-scaffolded (no `create-next-app`):
the default scaffold adds Tailwind, PostCSS config and Google-font
downloads (network at build time) — all banned here.
Rejected: staying on 16.4.3 (too recent, rule 8); Remix/Remix-style SPA
(no server-component story for near-zero-JS text pages).

### Validation: zod 4.6.7 (MIT)
Why: required base. 4.6.7 (2026-10-12) — bumped 2026-10-26 past the
14-day rule to close GHSA-mrhx-c7xc-m3w5 (memory exhaustion on
oversized constrained collections); verified oversized arrays reject
in ~1 ms. Rejected: valibot (smaller, but Zod was specified and v4
closes most of the size gap).

### ORM: drizzle-orm 0.45.4 (Apache-2.0) + drizzle-kit 0.31.0 (MIT, dev)
Why: required base; pg dialect schema compiles to SQL migrations via
`drizzle-kit generate` with no live DB. 0.45.4 (2026-10-08) — bumped
2026-10-26 past the 14-day rule to close GHSA-gpj5-g38j-94v9 (SQL
injection via identifiers); PGlite round-trip + FK tests still green,
`db:generate` clean. drizzle-kit stays 0.31.0 (2025-04-15); 0.31.11 is
2026-10-21 (inside window).
Rejected: drizzle-kit 0.31.11 (too recent); Prisma (needs engine binaries /
network at generate time, heavier); Kysely (no migration-story advantage
here, Drizzle was specified).

### Markdown core: unified 11.0.5, remark-parse 11.0.0, remark-gfm 4.0.1,
remark-rehype 11.1.2, rehype-stringify 10.0.1 (all MIT)
Why: the standard pipeline; GFM (tables, task lists, strikethrough)
is settled since 2023–2025. All server-side, zero client JS.

### Math: remark-math 6.0.0 + rehype-katex 7.0.1 + katex 0.18.0 (all MIT)
Why: the standard server-side math path; KaTeX CSS is functional
(styling-for-readability of equations) so it is the one allowed
stylesheet, loaded only on routes that render math. katex 0.18.0
(2026-07-17); 0.19.x is 2026-10-23 (inside window).
Rejected: MathJax (larger, slower, client-oriented); KaTeX 0.19.x
(too recent).

### Code highlighting (server): rehype-pretty-code 0.14.5 (MIT) + shiki 4.5.0 (MIT)
Why: runs on the server inside the unified pipeline — highlighted HTML
ships with zero client JS. rehype-pretty-code 0.14.5 (2026-07-25);
shiki peer `^1||^2||^3||^4`, pinned 4.5.0 (2026-10-01, outside window).
Rejected: @shikijs/rehype (official plugin, but rehype-pretty-code's
line-highlight / title / copy-hook metadata model fits lesson code
better and it is the better-documented Next.js path); highlight.js /
prism client-side (client JS on every code page); plain `<code>` with no
highlighting (fallback only if this breaks — see BLOCKED.md protocol).

### Callouts: rehype-callouts 2.2.0 (MIT)
Why: blockquote-based Obsidian syntax (`> [!note]`, collapsible
`> [!warning]-`), renders to semantic `<div>`/`<details>` with
`data-callout` hooks and **no JavaScript** (native `<details>` for
folding). No `allowDangerousHtml` needed. No stylesheet imported
(classes left bare for the user to style later). Published 2026-06-15,
maintained (lin-stephanie).
Rejected: @r4ai/remark-callout (last touched 2024, smaller feature set);
rehype-obsidian-callout (narrower: no documented collapsible support);
@heavycircle/remark-obsidian's built-in callouts (opaque output, wants a
decorative CSS import we must not ship).

### Wikilinks: remark-wiki-link 2.0.1 (MIT)
Why: tiny, focused, exactly the API needed: `pageResolver`,
`hrefTemplate`, `permalinks` (existing-vs-new distinction),
`aliasDivider`. Emits mdast with `hName`/`hProperties` so remark-rehype
renders plain `<a>` — no dangerous HTML. 2023 vintage, zero open
maintenance questions because it has no moving parts. Verified by our
own unit tests against remark 15 (if it breaks, the fallback is writing
a small hand-rolled remark plugin in `src/features/content/`).
Rejected: remark-wiki-link-plus 1.1.1 (2022 fork, older, no advantage);
@heavycircle/remark-obsidian (all-in-one: wikilinks + embeds + highlights
+ callouts, but single-maintainer, opaque hast output, documents a
required decorative CSS import; its own README defers wikilinks to
remark-wiki-link-plus anyway).

### Obsidian extras (==highlights==, %%comments%%): hand-rolled
`remarkObsidianText` (no dependency)
Why: two ~20-line remark visitors (split text nodes, skip code/math).
No package found that does just this with a permissive license and
recent maintenance; not worth a dependency. `~~strikethrough~~` already
comes from GFM.

### Raw HTML: rehype-raw 7.0.0 + rehype-sanitize 6.0.0 (both MIT)
Why: lesson content will come from an LLM and imports, so raw HTML must
be rendered **sanitized**, never stripped-silently nor passed through.
Pipeline order: remark-rehype (allowDangerousHtml) → rehype-raw →
downstream hast plugins → rehype-sanitize with a KaTeX/callout-aware
schema (allows `className`, `details`/`summary`, keeps the default ban
on scripts/handlers/iframes) → stringify. Both 2023, stable.
Rejected: no-raw-HTML (simpler but silently drops legitimate `<details>`
/ `<sub>` lesson markup); DOMPurify (client-oriented; sanitize belongs
in the server pipeline).

### Diagrams: mermaid 11.17.2 (MIT), lazy client-side only
Why: plain-text-in-fence authoring (` ```mermaid `), still the standard
for flowcharts/sequences/class diagrams; 11.17.2 (2026-08-25); 12.x is
2026-10-13 (inside window). Loaded via `next/dynamic` only on routes
containing a mermaid block; server HTML always includes the source text
in `<pre>` so the diagram degrades to readable source with JS off.
Unpacked size is large (~122 MB with docs) but browser payload is the
single bundled chunk (~MBs, lazy). No `mermaid.initialize` at module
top-level (runs only in the component).
Rejected: markmap (mindmaps only, not general diagrams); mermaid 12.x
(too recent); hand-drawn SVG components (not plain-text authorable).

### Topic graph: force-graph 1.52.0 (MIT), lazy client-side only
Why: canvas-2D force layout = the Obsidian look without Three.js;
small API (`new ForceGraph(el)` class form, v1.52); 1.52.0 (2026-09-28).
Graph data itself is a pure function over wikilinks (tested, no lib).
Rejected: sigma 4.0.3 (2026-10-15, inside window; also WebGL);
cytoscape 3.34.4 (2026-10-15, inside window; imperative API is heavier
for this one view); graphology (data-structure only, still needs a
renderer — unnecessary part); react-force-graph (wrapper adds nothing;
a 30-line client component calls force-graph directly).

### Plots: function-plot 1.25.4 (MIT), lazy client-side only
Why: built exactly for ` ```plot ` blocks: `fn: 'x^2'` strings, no data
wrangling. 1.25.4 (2026-04-26); 1.26.0 is 2026-10-11 (inside window).
d3 transitive deps are BSD-licensed.
Rejected: @observablehq/plot 0.6.17 (ISC ✓, but a chart grammar —
overkill for y=f(x) authoring); uPlot 1.6.32 (tiny and fast, but needs
precomputed arrays — wrong shape for markdown-authored functions);
JSXGraph (heavier, classroom-geometry focus).

### Editor: hand-rolled CodeMirror 6 (all MIT)
codemirror 6.0.2 (2026-06-19) + @codemirror/state 6.5.2 (2025-02-03) +
@codemirror/view 6.37.0 (2025-05-29) +
@codemirror/lang-markdown 6.5.2 (2026-08-04).
Why: CM6 is the light editor (not Monaco, per spec); hand-rolled
~50-line client component instead of a wrapper dep. 6.37.0 view because
6.43.x is 2026-10-19 (inside window).
Rejected: @uiw/react-codemirror (wrapper dep, no control over bundle);
Monaco (explicitly excluded, heavy); plain `<textarea>` (no highlight,
kept as the no-JS fallback inside the same component).

### Whiteboard: NONE (deferred, evaluated)
Excalidraw and tldraw were evaluated from their READMEs/metadata:
multi-hundred-KB minimum bundles, own state models, theming systems —
incompatible with the no-styling rule and the near-zero-JS budget.
Recorded as a possible Phase-3 lazy block behind the same block
registry; not installed.

### Spaced repetition (Phase 2): ts-fsrs 5.2.0 (MIT)
Why: the maintained open-source FSRS implementation; pure functions,
no I/O, Zod-validatable inputs/outputs. 5.2.0 (2025-06-15); 5.4.x is
2026-10-19 (inside window). Phase 2 uses it wrapped in pure functions;
scheduling policy stays the user's design (plumbing only).
Rejected: hand-rolled SM-2 (FSRS was specified); ts-fsrs 5.4.x
(too recent).

### Migration testing: @electric-sql/pglite 0.5.8 (Apache-2.0, dev)
Why: real Postgres (WASM) to prove the Drizzle migration + schema work
(`tests/db.test.ts` applies `drizzle/*.sql` in order, then round-trips
topic+lesson+attempt+record via `drizzle-orm/pglite`, incl. boolean
`correct` and FK enforcement). Pinned 0.5.8 (published 2026-08-26,
newest release before the 2026-10-11 14-day cutoff; 0.5.9 is
2026-10-12, inside the window). License confirmed via
`npm view @electric-sql/pglite@0.5.8 license` → Apache-2.0.
Rejected: 0.5.9+ (too recent); dockerized Postgres (no daemon here).

### Test runner: vitest 4.0.0 (MIT, dev) + vite 7.1.11 (MIT, dev)
Why: required base. 4.0.0 (2025-10-22). Rejected: 5.x (2026-10-19,
inside window).
Vite note (found the hard way): npm floats vite to newest 7.x (7.3.7),
whose worker protocol vitest 4.0.0 does not speak (`Unknown method:
getBuiltins`). Fix: explicit dev pin vite@7.1.11 (2025-10-20,
era-contemporary with vitest 4.0.0). Rejected: vite 7.3.x (breaks the
runner); adding a newer vitest (inside 14-day window).

Transitive notes (dep-audit, 2026-10-26):
- `es-toolkit` (mermaid dep): npm floated 1.53.0 (2026-10-24, inside
  window) → pinned via `overrides` to 1.52.0 (2026-08-28). Rebuilt OK.
- `sharp@0.35.5` + `@img/sharp-wasm32@0.35.5` (Next.js's own OPTIONAL
  image-optimization deps; sharp-wasm32 carries an
  `Apache-2.0 AND LGPL-3.0-or-later AND MIT` field): accepted as inert
  transitive weight. Nothing in ACE imports `next/image` or any image;
  Next only loads sharp when the Image Optimization API is hit, which no
  route does. `npm prune` does not drop the orphaned wasm entry (it is
  `optional: true` in the lockfile); hand-editing the lock was judged
  riskier than documenting. Revisit on a fresh `npm ci` if it persists.

### Types/lint (dev): typescript 5.9.2, eslint 9.37.0 +
eslint-config-next 16.3.5, @types/react 19.2.18,
@types/react-dom 19.2.7, @types/node 22.20.5
Why: match the framework era; eslint-config-next 16.3.5 (2026-09-11)
pairs with next 16.3.5. Rejected: newer @types/node 24.x line (runtime
here is Node 22; 22.20.5 from 2026-10-01 matches).

## REFERENCES (projects studied; MIT/Apache/BSD unless noted)

- Quartz (jackyzha0/quartz, MIT) — Markdown → site pipeline on
  unified/remark/rehype; wikilinks via remark-wiki-link family with
  existence-aware styling; backlinks panel, recent-notes, and graph view
  as cheap derived data over the link index. Taken: existence-aware
  wikilink classes, backlinks-as-derived-data, graph-from-wikilinks.
- SilverBullet (silverbulletmd/silverbullet, MIT) — everything is
  markdown; features ship as small "plugs" behind a registry; pages
  queryable. Taken: the block-registry idea (one map from fence language
  to component; add a block type by adding one entry).
- Foam (foambubble/foam, MIT) — wikilinks + generated graph +
  backlinks inside the editor you already use. Taken: confirmation that
  graph/backlinks need no new syntax, only the link index.
- Dendron (dendronhq/dendron) — hierarchy + schemas for notes.
  Not taken: hierarchies impose structure ACE doesn't want (topics link
  freely); noted only.
- Logseq (logseq/logseq, AGPL — NOT reusable) — outliner blocks and
  block refs `((id))`. Read only for ideas; nothing copied (license).
  Taken: nothing; confirms block refs stay out of scope for the skeleton.
- SiYuan / Outline — surveyed briefly; nothing taken (heavier models).
- Anki (ankitects/anki, AGPL — NOT reusable) — scheduler + review log
  separation: reviews are events, state derives from the log. Taken as
  corroboration for the event-log shape already in ACE's decisions; no
  code copied (license).
- ts-fsrs (open-spaced-repetition/ts-fsrs, MIT) — pure-function FSRS;
  API read from its README + the installed `.d.ts` (ground truth).
- function-plot docs (mauriciopoppe/function-plot, MIT) — `fn`-string
  datum API; adapted only as data shapes, no code copied.
- force-graph docs (vasturiano/force-graph, MIT) — `graphData` +
  canvas paint API; wrapped in our own client component.

## THIRD_PARTY note
No vendored/adapted third-party code in this run. This section stays
empty unless Phase 3 vendors something; `THIRD_PARTY.md` will record it.

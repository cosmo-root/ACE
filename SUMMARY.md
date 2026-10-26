# SUMMARY.md — ACE skeleton overnight run (2026-10-26, UTC)

## Start here
Working skeleton, all green: `typecheck`, `lint` (0 errors), `tests`
(130/130 across 15 files: pipeline+render-cache+eviction, registry, graph, topics,
harness incl. no-retry-on-transport, render-route, XSS incl.
srcset-protocol, XSS-fuzz, plot, pipeline-fuzz, db-migration-on-PGlite,
seed-coherence, toc, listnav, slot-details),
`npm run build`, production smoke test (`npm run smoke`, exit 0). Open
<http://localhost:3000> after `npm run dev` (or any port via
`PORT=x npm run start` after build). Try: home → Quadratic Functions
lesson (math, callouts, code, diagram, plot) → Graph → Playground.
No API keys, DB, or network needed (in-memory seed; mock LLM provider).

## What was built
- **Shell**: Next.js 16.3.5 App Router + strict TS + ESLint + Vitest,
  hand-scaffolded (no Tailwind/fonts/boilerplate). Server components by
  default; client JS only where interactivity needs it.
- **Content core** (`src/features/content/`): server pipeline (GFM, KaTeX
  math, shiki highlighting, Obsidian callouts incl. collapsible
  `<details>`, [[wikilinks]] w/ existence styling, ==highlights==,
  %%comments%%, sanitized raw HTML), block registry (`mermaid`, `plot`,
  `toc`): `mermaid`/`plot` enhance lazily on the client while their sources
ship in server `<details>`; `toc` is fully server-rendered with no
  client renderer); diagrams show source with JS off or on
  syntax error; KaTeX CSS vendored, loaded only on math pages.
- **Pages**: `/` (list + create-topic form), `/topic/[slug]` (lesson +
  TOC + backlinks), `/playground` (client live preview via
  `/api/render`), `/graph` (lazy canvas graph + no-JS list fallback),
  quick switcher (Ctrl+K), j/k list-nav island (no-JS safe),
  `not-found`/`error` pages.
- **Data**: Zod domain schemas, Drizzle pg schema + generated migrations
  (`drizzle/` 0000 + 0001, offline), repository interface + in-memory store + seed
  demonstrating every rich feature.
- **Harness plumbing only** (`src/harness/`): LlmProvider,
  MockLlmProvider (default), OpenAI-compatible provider (Meta Model API
  target, untested live), Zod-validated call-with-one-retry helper,
  pass-through content services (no prompt text — user's design),
  Zod-validated `/api/harness/lesson` route. No scheduling/pass logic.

## Libraries / references used
See DEPENDENCIES.md (pins, dates, sizes, rejected alternatives) and
ARCHITECTURE.md (module map, removal recipes). Vendored: none
(THIRD_PARTY.md). KaTeX CSS+fonts copied to `public/vendor/katex`.

## Blocked
Nothing blocking. Production smoke (final build): home/topic/graph/
playground/API routes all 200; topic page has exactly one `<h1>`;
mermaid slot + backlinks present. E2E (40+ requests) all pass except a
curl-only artifact: plain POSTs can't invoke the server-action form
(needs the Flight protocol), but a faithful no-JS submission (multipart
+ the rendered `$ACTION_ID`) returns 303 → created topic 200 and listed.
Notes: vitest 4 needs vite@7.1.11 (protocol skew — see
DEPENDENCIES.md); eslint-config-next flat subpaths used;
`create-next-app` avoided (Tailwind/font downloads).

## `// HUMAN:` markers
Collected in ARCHITECTURE.md → HUMAN TODO (slugs, schemas, live DB,
sanitize/CSP tightening, graph weights, prompt design, render cache).

## First-load JS per route
Source: production `npm run build` (Next 16.3.5 Turbopack),
`.next/diagnostics/route-bundle-stats.json` (uncompressed) + gzip sums
of the listed chunks. Method cross-checked: chunk byte sums match the
reported totals exactly.

| Route | First load JS (uncompressed) | First load JS (gzip) |
| --- | --- | --- |
| `/` | 466,281 B | 138,266 B |
| `/topic/[slug]` | 468,233 B | 139,130 B |
| `/graph` | 465,125 B | 137,908 B |
| `/playground` | 469,750 B | 139,737 B |
| `/_not-found` | 463,725 B | 137,102 B |

Reading: ~135 KB gzip is the shared Next+React framework floor on every
route; our code adds ~1–4 KB per route. Mermaid, function-plot,
force-graph and CodeMirror ship in separate lazy chunks loaded only on
demand — text pages never fetch them. Verified in the bundle: no
shiki/unified/remark code in any client chunk (the KaTeX JS found in
three chunks is mermaid's own diagram-math dependency, all lazy-only).
Turbopack emits many small chunks; totals are what matters.

## Production render performance (30-req probe, seed lesson, all 200)
POST /api/render: median 29.9 ms, p95 68.3 ms (one 450 ms cold start).
GET /topic/quadratic-functions: median 71.1 ms (42 KB HTML).
GET /: median 10.1 ms (7 KB HTML). Verdict: snappy. Cold start (fresh
boot): first GET / 140 ms, first topic page 413 ms, first render 210 ms
— all sub-half-second, then warm medians above.
Load (100 parallel mixed requests): 100/100 HTTP 200, no 5xx, clean
logs — but render median degrades ~25x under 50-way contention (sync
remark/rehype/shiki pipeline saturates one Node process). Mitigation
shipped: bounded in-memory render cache (100 entries, pure function of
input) — repeat renders drop from ~160 ms cold to ~7 ms warm (~20x),
and a 50-way identical-body retest stays flat (all 200). Fine for a
skeleton; a persistent cache is the next lever if needed.

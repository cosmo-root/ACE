# DECISIONS.md — overnight skeleton run (2026-10-26, UTC)

## Product decisions
- Hand-scaffolded Next.js (no create-next-app): the default scaffold adds
  Tailwind + Google-font downloads (network at build). Plain `package.json`
  + configs instead.
- KaTeX CSS vendored to `public/vendor/katex/` and linked only when rendered
  HTML contains math. No global CSS file, no Tailwind, no theme stylesheets.
- Playground preview is client-side on that route only (debounced POST to
  /api/render, same server pipeline). All other content is server-rendered.
- Block slots always emit source text; JS only enhances. No-JS shows source.
- In-memory store + seed by default; Drizzle schema + generated migration for
  the later Postgres move. No DB, keys, or network needed to run.
- Phase 2 = plumbing only (providers, validation helper, Zod API routes).
  No prompts, no scheduling/pass logic — the user's design space. Phase 3
  must not touch AI/learning logic either.
- Shiki colors are the code-highlighting feature itself (like KaTeX CSS),
  not decorative theming. Kept; user styles the rest later.
- `style` allowed in the sanitize schema (KaTeX/shiki emit deterministic
  server-side styles). Hole documented in sanitize.ts; tighten with CSP
  before rendering untrusted third-party HTML.
- 2026-10-26 sanitize-review fixes: `srcSet: [http, https]` protocols
  added (base schema left <source srcset> unchecked — javascript:/data:
  bypass, now closed + tested); dead `figure` widening removed (figure
  not in tagNames; client mermaid figure is DOM-built, unaffected).
  Overlay-style phishing stays open BY DESIGN for first-party output.
- 2026-10-26 removal-drill fixes: graph recipe now lists tests + layout
  nav; added block-type removal recipe (both scratch-copy verified).
- 2026-10-26 a11y re-audit: fixed all 7 must-fix (toc slot nav labeled
  "Contents" vs page "Table of contents"; Toc text||id; data-active not
  aria-current; list keys scoped to list/body + modifier bail; dialog
  Close button; trigger label-in-name; graph role=img). Verified live in
  prod markup. Nice-to-haves left as-is (two-toc numbering, J-shift,
  reduced-motion cooldown, focus-ring UA defaults).
- 2026-10-26 user overrode NO-STYLING (temporary): added original
  `src/app/globals.css` dark theme (system fonts, flat teal accent, no
  gradients) + layout import. Element selectors only, no markup changes;
  delete both to revert. Nothing copied from DeepSeek (inspiration only).
- 2026-10-26 npm audit (15 vulns): fixed zod 4.5.0→4.6.7 + drizzle-orm
  0.44.5→0.45.4 (both past 14-day rule); gates 130/130, build + smoke
  green. Deferred: next critical (16.4.3 published 2026-10-23, too new —
  revisit after Nov 6; affected features unused here); katex proto-pollution
  (needs mermaid 12 major — breaking, nested server-side copies only).
- 2026-10-26 no-JS follow-up: diagram sources now server-wrapped in
  `<details><summary>Source` (was client-only); client wrapper skips
  pre-wrapped pres. Lesson: hand-built hast nodes need `properties`
  (rehype-katex crashes on undefined className read — 12 red, fixed).
- Wikilink alias divider is `|` (Obsidian style); `:` is literal in both
  renderer and graph extractor. `#section` / `^block` refs resolve to the
  base topic.
- Mermaid `securityLevel: "strict"`.
- force-graph `new ForceGraph(el)` (v1.52 class API), canvas 2D, node click
  navigates to the topic. Graph page ships a no-JS topic list fallback.

## Dependency decisions (see DEPENDENCIES.md for versions/dates)
- Callouts: rehype-callouts (native <details> folding, no JS, no CSS import).
- Wikilinks: remark-wiki-link 2.0.1 (2023, no moving parts) over
  @heavycircle/remark-obsidian (opaque output, wants decorative CSS).
- ==/%%: hand-rolled 40-line remark plugin (no focused maintained package).
- Highlight: rehype-pretty-code + shiki, server-side.
- Sanitize: rehype-raw + rehype-sanitize with custom schema (dashed data-*
  keys as plugins emit them; per-tag widening because tag rules shadow '*').
- Plot: function-plot (`fn:` strings) over Observable Plot / uPlot.
- Editor: hand-rolled CodeMirror 6 (~50 lines) over @uiw wrapper / Monaco.
- Whiteboard: evaluated, NOT installed (multi-hundred-KB, own theming).
- vitest 4.0.0 needed explicit vite@7.1.11: newest vite 7.3.x breaks its
  worker protocol ("Unknown method: getBuiltins"). Recorded in DEPENDENCIES.
- drizzle-kit 0.31.0 (drizzle-kit 0.31.11 too recent); generate is offline.

## Audit-driven fixes (Phase 3, from subagent audits 2026-10-26)
- a11y: lesson headings shift down one level in the pipeline (page owns
  the single h1; TOC depths follow); textarea gets aria-label; graph
  link list renders always (not only noscript); rendered blocks keep
  their source in <details> + figcaption/aria-label instead of
  `hidden`; QuickSwitcher returns focus to its trigger on close.
  Re-verified 5/5 against the running server.
- Deps: es-toolkit override (DEPENDENCIES.md); sharp noted as inert
  Next optional.
- Fresh-eyes review (9 bugs, all fixed): plot/mermaid error paths moved
  inside try (no unhandled rejections); 3-way sort comparator; wikilink
  colon-split removed (graph == renderer); extraction skips inline
  code/math (no phantom edges); outDegree deduped; Drizzle
  `correct` boolean + FKs to topics.slug (migration 0001); client
  modules import leaf files (pipeline never in client bundle —
  verified in .next chunks); playground fetch abortable (no stale
  preview); LLM fetch 30s timeout.
- Plot parser exported for unit tests (10 tests).
- Hostile review (10 findings, all fixed): transport errors never
  retried (30s stays 30s); provider strips trailing-slash base URLs and
  reports status text; mermaid loader resets on failure; mermaid error
  path keeps collapsible source + role/aria (strict mode documented as
  load-bearing — mermaid bundles its own sanitizer); QuickSwitcher
  toggle routes through close(); graph teardown uses public
  pauseAnimation + deep-copied data; store returns copies; cache key is
  JSON (no collisions) with in-flight promise dedupe; textarea forwards
  pre-CodeMirror keystrokes; render API responses validated as strings.

## Deferred to user (also collected under HUMAN TODO in docs)
- Slug scheme, learner profile shape, pass bar, scheduling, prompts.
- Live DB wiring (DATABASE_URL), CSP tightening, whiteboard block.

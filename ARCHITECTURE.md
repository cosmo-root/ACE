# ARCHITECTURE.md — ACE skeleton module map

Rule: each feature is removable by deleting its folder plus the touch
points listed. Server code imports sibling features only via their public
`index.ts`. Exception (bundle boundary, verified in `.next` output):
`use client` modules import leaf files directly (e.g.
`@/features/content/blocks`, `../content/pipeline`) so the server-only
pipeline (unified + shiki) can never enter the client bundle. Every
third-party library sits behind one small own-module wrapper so it can
be swapped by changing one folder.

## Features (`src/features/`)

### content/ — markdown pipeline + RichContent (the core)
Wraps: unified, remark-*, rehype-*, katex (CSS via /vendor), mermaid,
function-plot.
Public API (`index.ts`): `renderMarkdown`, `extractWikilinks`,
`wikilinkTargetToSlug`, `BLOCK_TYPES`, `isBlockLanguage`, `RichContent`,
`Toc`, `BlockMounts`, `slugifyTitle`, `splitWikilinkBody`,
`renderCacheSize`, `clearRenderCache`, types `RenderOptions`,
`RenderResult`, `Heading`, `BlockType`.
Files:
- `pipeline.ts` — server-only unified chain (GFM, math, wikilinks,
  ==/%%, callouts, block slots, highlight, KaTeX, ids, sanitize).
  Must never be imported by a 'use client' module.
- `remarkObsidianText.ts` — hand-rolled ==mark== / %%comment%% plugin.
- `rehypeBlockSlots.ts` — block registry (ADD A TYPE BY ADDING ONE ENTRY:
  mermaid, plot, toc) + fence-to-slot rehype plugin + `rehypeTocSlots`,
  which runs after heading ids and appends a server-rendered
  nav-of-anchor-links (or a "No headings" notice) into each toc slot.
  Diagram sources ship inside server-rendered `<details><summary>Source`
  (collapsible with JS off); the client wrapper skips pres already
  wrapped. Every hand-built hast node needs `properties` (even `{}`):
  rehype-katex reads `node.properties.className` on all elements and
  crashes on undefined (caught 2026-10-26: 12 red tests).
  `toc` needs no client renderer: BlockMounts leaves slots without a
  renderer untouched, so the block works with JS disabled.
- `rehypeHeadingIds.ts` — deterministic heading ids + TOC collection.
- `sanitize.ts` — GitHub-base schema widened for server-generated markup,
  including `nav` + `ariaLabel` for the toc block.
- `RichContent.tsx` — async server component (article + TOC + KaTeX <link>).
- `blocks.tsx` — 'use client' BlockMounts: hydrates data-block slots via
  dynamic import(). The ONLY client JS on text pages.
- `slugify.ts` — canonical slug scheme + [[target|alias]] splitting.
Remove: delete folder; touch points are imports in topics/store.ts
(slugify), graph/buildGraph.ts (extractWikilinks), app pages + /api/render
(RichContent/renderMarkdown/BlockMounts).
Replace a library: mermaid → edit `renderMermaid` in blocks.tsx only;
highlighter → swap the one `.use(rehypePrettyCode)` line in pipeline.ts;
callouts → swap the one `.use(rehypeCallouts)` line.
Remove a block type (e.g. plot): delete its `BLOCK_TYPES` entry in
`rehypeBlockSlots.ts` + its spec/parse/render code + `RENDERERS` line in
`blocks.tsx`; then delete its `tests/<block>.test.ts`, update
`tests/registry.test.ts`, the pipeline slot test, and the seed
`data-block` assertion. The fence then degrades to a highlighted code
block with source intact (verified in a scratch copy 2026-10-26).

### topics/ — domain, store, seed
Owns: Zod schemas, TopicStore interface, InMemoryTopicStore, seed data.
Public API: schemas + `InMemoryTopicStore`, `getStore`, `TopicStore`, seed.
Remove: delete folder; touch points are pages, /api/render (none — render
route takes body directly), graph page (getStore), drizzle schema mirror.
Swap storage: implement TopicStore on Drizzle (`src/db/schema.ts` mirrors
these shapes) and change `getStore()`.

### graph/ — pure builder + lazy canvas view
Wraps: force-graph (client only, dynamic import in GraphView).
Public API: `buildTopicGraph`, `buildBacklinks`, `GraphView`, types.
Remove: delete folder + `/graph` page + backlinks section in topic page +
`tests/graph.test.ts` + `buildGraph` import/assertions in
`tests/seed.test.ts` + Graph link in `layout.tsx` nav (dead link otherwise).
Swap renderer: rewrite GraphView.tsx only (data shape `TopicGraph` stays).
(Removal verified for real in a scratch copy 2026-10-26: exact recipe
above leaves typecheck + all remaining tests green.)

### editor/ — CodeMirror 6 wrapper
Wraps: @codemirror/* (client only, dynamic import in MarkdownEditor).
Public API: `MarkdownEditor`. Plain <textarea> is the built-in no-JS
fallback posting the same field.
Remove: delete folder + playground page usage (textarea keeps working).
Swap editor: rewrite MarkdownEditor.tsx only.

### search/ — quick switcher (Phase 3)
Owns: QuickSwitcher client island (Ctrl+K dialog, filters topics,
Enter navigates; dialog has a Close button) + TopicListNav island (j/k or
arrows move focus over the home topic list when focus is in the list or
on the page body, never from controls/fields; Enter follows natively;
highlight uses data-active, not aria-current). No library.
Remove: delete folder + the import and both usage sites
(`QuickSwitcher`, `TopicListNav`) in `src/app/page.tsx` +
`tests/listnav.test.ts`.

## Harness (`src/harness/` — top level, NOT under features/)

Owns: LlmProvider, MockLlmProvider, OpenAI-compatible provider, Zod
validation helper, content-service stubs calling providers.
Constraint: plumbing only — NO prompts, NO scheduling/pass logic (the
user's design space; Phase 3 must not touch AI/learning logic either).
Remove: delete the folder + `src/app/api/harness/` +
`tests/harness.test.ts` + the `/api/harness/lesson` section of
`tests/render-route.test.ts` (including its `lessonPOST` import);
rest of app unaffected.
(Removal verified for real in a scratch copy: exact recipe above leaves
typecheck + all remaining tests green.)

## App shell (`src/app/`)
`layout.tsx` (nav only), `page.tsx` (list + create server action +
QuickSwitcher), `topic/[slug]/page.tsx` (lesson + backlinks),
`playground/page.tsx` (client preview), `graph/page.tsx` (server data →
GraphView), `not-found.tsx`, `error.tsx` (route error boundary),
`api/render/route.ts` (Zod-validated render endpoint),
`api/harness/lesson/route.ts` (Zod-validated harness endpoint).

## Persistence (`src/db/`, `drizzle/`)
`schema.ts` mirrors topics/schemas.ts (pg tables). `drizzle/` holds the
generated migrations (`npm run db:generate`, offline). No live DB required.

## Tests (`tests/`, 130 total, no skips)
pipeline (+fuzz corpus + render cache), registry, graph, topics,
harness, render-route, seed-coherence, XSS (+srcset-protocol) +
XSS-fuzz, plot, toc, listnav, slot-details, pipeline-fuzz,
db-migration-on-PGlite. See TESTING.md.

## Cross-feature import graph (allowed directions)
topics -> content (slugify). graph -> content (extractWikilinks).
app pages -> content, topics, graph (public indexes only, except
`playground` imports the `blocks` leaf directly — deliberate commented
bundle exception). editor and
harness are leaves (nothing imports them except pages/routes).

## HUMAN TODO (every `// HUMAN:` marker, collected)
- [slugify.ts](src/features/content/slugify.ts) — slug scheme is the
  canonical topic identity; change it together with permalinks in topics/.
- [schemas.ts](src/features/topics/schemas.ts) — placeholder fields
  (profile, records) are yours to shape; harness validates against these.
- [store.ts](src/features/topics/store.ts) — implement TopicStore on
  Drizzle + swap getStore() to go live.
- [db/schema.ts](src/db/schema.ts) + [drizzle.config.ts](drizzle.config.ts) —
  point dbCredentials at Supabase/Postgres when you want a live DB.
- [sanitize.ts](src/features/content/sanitize.ts) — tighten `style` /
  per-tag classes + CSP before rendering untrusted third-party HTML.
- [buildGraph.ts](src/features/graph/buildGraph.ts) — edge weights,
  clustering, decay are your later design; keep as pure functions here.
- [services.ts](src/harness/services.ts) (4 markers) +
  [route.ts](src/app/api/harness/lesson/route.ts) — prompt design is
  yours: services take caller-built prompt strings and pass them through
  untouched; no prompt text lives in the harness.
- [pipeline.ts](src/features/content/pipeline.ts) — render cache is an
  in-memory 100-entry stopgap; replace with a persistent cache (or ISR)
  if ACE ever serves many users from one process.

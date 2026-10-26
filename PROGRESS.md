# PROGRESS.md — recovery record (times UTC)

- 2026-10-25 20:42 run start; inspected ACE + app/ (existing repo, no commits).
- 20:49 Phase 0 done: DEPENDENCIES.md (pins+dates+sizes+references), installed
  prod+dev deps with --ignore-scripts + exact pins (14-day rule enforced).
- 20:56 scaffold hand-written (no Tailwind/fonts): configs, layout, db schema.
- 21:0x content feature (pipeline/sanitize/blocks/RichContent), topics
  (schemas/store/seed), graph, editor, pages, /api/render.
- 21:0x typecheck green; tests written; vitest 4.0.0 worker-protocol failure
  fixed by pinning vite@7.1.11 (era-contemporary).
- 21:1x typecheck PASS; lint 0 errors (Link, ref-effect, router, css-tag
  fixes); tests 22/22 PASS after sanitize fix (dashed data-* keys,
  per-tag widening — tag rules shadow '*').
- 21:12 fanned out: db-migrator (drizzle generate), build-smoke-tester
  (build + first-load JS + prod smoke), harness-builder queued (Phase 2
  plumbing). Docs done: README Stack/Status, ARCHITECTURE, THIRD_PARTY,
  DECISIONS + DEPENDENCIES (vite pin recorded).
- 21:3x test-hardener (+21 tests: xss, render-route), a11y audit (5 real
  findings, all fixed: h1 demotion, textarea label, always-list graph,
  details-source + figcaptions, focus return), dep audit (es-toolkit
  override to 1.52.0; sharp/LGPL documented as inert Next optional).
  Suite 54/54, typecheck + lint clean, rebuilt, re-smoked (all 200,
  single h1). Fresh-eyes reviewer running.
- NEXT: reviewer findings, final gates, SUMMARY/PROGRESS close-out,
  suspend at 5:30 IST (00:00 UTC).
- 21:38 review fixes in (9 bugs: try-scope, sort, colon split, phantom
  links, outDegree, boolean+FKs, barrel imports, abort race, LLM timeout;
  5 new tests). Suite 68/68. Rebuilt + re-smoked (all 200, single h1).
  Watchdog cron 0593a25a every 30min (usage+gates+fan-out, dies 00:15).
  Workers: plot-tests done; perf/xss-fuzz/chunks queued.
- 21:42 E2E 40+ reqs pass except curl-only form artifact — disproven by
  faithful no-JS multipart+$ACTION_ID (303, topic live). Perf: render
  p50 30ms. a11y re-verify 5/5. Suite 94/94 (plot 10 + xss-fuzz 26).
- 22:1x migration proven on PGlite: es-toolkit n/a; pglite@0.5.8 picked
  (Apache-2.0, 2026-08-26). Found REAL bug: 0001 ALTER lacked USING
  (text→boolean fails on real PG) — hand-fixed, db tests green (bool
  round-trip + FK). Suite 103/103. pglite recorded in DEPENDENCIES.
- 22:1x fuzz suite in (221 deterministic docs, no crashes). E2E/load/
  release/removal workers draining. Window 20% — queuing more waves.
- 22:2x release audit: 3 discrepancies (2 doc-fixed, 1 fuzz flake =
  write-race, 5x green since). Load: 100/100 200, render ~25x slower
  under 50-way parallel (CPU-bound; noted). Removal drill verified
  editor+harness recipes for real (fixed ARCH harness path+test touch
  point). Link audit 26/26. No-JS + secrets audits running.
- 22:25 secrets clean; no-JS: home FULLY USABLE, topic/graph
  READABLE-ONLY, playground DEGRADED → added noscript preview note.
  Suite 103/103. Final e2e + docs-proof running on fresh build.
- 22:3x shipped bounded render cache (100 entries; 160ms→7ms warm,
  +2 tests). Rebuilt, re-smoked green, sizes re-recorded. Suite
  110/110 (seed tests in). Final docs check running.
- 22:4x hostile review (10 findings, all fixed +2 tests: store copies,
  transport-no-retry, QuickSwitcher toggle, pauseAnimation teardown,
  JSON cache key + inflight dedupe, textarea forwarding, html check).
  Suite 113/113. Client re-review + final e2e running.
- 22:5x client re-review clean (+2 micro-fixes: write-path copies,
  Escape focus). Claims agent verifying final numbers/build.
- 22:6x fresh-eyes RC review: db.test kind values fixed; smoke script
  green (exit 0, wired as `npm run smoke`). Fresh-install proof +
  reader fixes queued. Suite 113/113.
- 22:7x reader findings applied (sizes, HUMAN cache, TESTING rows);
  e2e-regression PASS on final build; fresh-install clean-room running.
- 22:9x fresh install proven (gates green from /tmp/ace-fresh).
  Added Parabolas seed topic (4-node demo graph). Claims re-verified.
  Suite 113/113. Graph-verify running.
- 23:2x graph-verify 3/4 EXPLAINED: stale .next (predates Parabolas).
  Final rebuild + live probe: all 4 topic links 200, /graph /playground
  200, server stopped, port closed. Gates re-green (typecheck/lint/
  113 tests). Docs-proofread 7 findings; 6 fixed (colon contradiction,
  force-graph snippet, seed comment, ARCH API+recipe, TESTING count,
  README harness wording). Starting ```toc block (Phase 3).
- 22:31 watchdog: gates green (typecheck/lint/119 tests incl. new toc block); spawned toc-verify + build-smoke, queued docs-sync.
- 22:3x build-smoke worker: fresh `npm run build` exit 0 (toc incl.),
  `npm run smoke` 13/13 ok, server stopped. Awaiting toc-verify + docs-sync.
- 22:4x toc-verify PASS (server-emitted nav, no-JS ok); docs-sync done
  (SUMMARY 119/119, 13 files, toc noted). Spawned removal-drill (graph +
  plot recipes in scratch copies) + sanitize-review (read-only).
- 23:0x removal-drill: graph recipe FAILED typecheck as written (omitted
  tests + layout nav) — ARCHITECTURE fixed + verified; plot removal
  recipe ADDED (scratch-verified, degrades to code block). Sanitize
  review: closed srcset protocol bypass (+2 tests), removed dead figure
  widening. Full gates green 121/121. DECISIONS + SUMMARY synced.
- 22:41 watchdog usage: window 45%, weekly 69% (reset ~00:00 UTC).
  Spawned kbd-nav island (j/k+Enter on home list, no-JS safe).
- 22:4x kbd-nav done green first try (pure helpers + island, 4 tests).
  Reviewed impl; full gates 125/125 (14 files). SUMMARY synced (kbd-nav
  noted). Fresh prod build ok. Spawning link-crawl + load-retest.
- 22:4x link-crawl ALL GREEN (all pages/topics/404 + single h1s);
  load retest final build: 50/50 identical all 200 (cached ~62-81ms),
  mixed all 200, ports closed. Spawned final fresh-install drill;
  cleaned old /tmp scratch.
- 23:0x a11y re-audit: 7 must-fix found, all fixed by hand (toc labels,
  data-active, key scoping, dialog Close, label-in-name, Toc fallback,
  graph role). Gates 125/125; fresh build; live markup verified; server
  stopped. Spawned final docs-consistency pass.
- 23:2x docs-final pass: counts verified (125/125, 14 files); fixed 5
  stalenesses (SUMMARY inventory, ARCH test total + search recipe,
  TESTING suite map, README status). PROGRESS tail disorder left as
  history. Awaiting deadline wrap-up.
- 22:55 watchdog usage: window 48%, weekly 70%. Spawned no-JS content
  audit + bundle re-measure (post-toc/kbd numbers check).
- 23:2x no-JS audit: all PASS except diagram source not collapsible w/o
  JS (client-only <details>). Fixed server-side (details+summary at slot
  emit; client skips pre-wrapped) — caught a rehype-katex crash on
  property-less nodes (12 red, fixed w/ properties:{}). Gates 125/125.
  Bundle table re-measured (3 rows drifted, SUMMARY updated). Final
  smoke 13/13 on final build; 2 server <details> slots live verified.
  Servers stopped, ports closed.
- 23:00 watchdog: gates green (typecheck/lint/125 tests); spawned slot-verify + slot-tests, queued docs-check.
- 23:1x slot-verify PASS (combined math+blocks, toc notice, client skip);
  slot-details.test.ts added (5 tests). Suite 130/130, 15 files.
  SUMMARY/TESTING/ARCH counts synced.
- 23:2x docs-check: bundle table verified clean; fixed its 4 findings
  (slot-details counts already synced; search recipe + listnav.test;
  playground leaf-import caveat; properties:{} on tocNav p/ul/li).
  Gates 130/130. Spawned final fresh-install drill.
- 23:2x seed lesson gained a ```toc fence (demo complete); full gates
  130/130, fresh build + smoke 13/13. Live: "Contents" + "Table of
  contents" landmarks distinct. Secrets scan clean (env/test only).
  Servers stopped. Awaiting deadline wrap (cron delete + suspend).
- 23:30 watchdog: gates green (typecheck/lint/130 tests); spawned smoke-final + cold-probe, queued readme-check.
- 23:3x cold-probe: fresh-boot TTFB 140ms home / 413ms topic / 210ms
  render (all 200, then warm). Noted in SUMMARY perf. Awaiting
  smoke-final + readme-check.
- 23:4x smoke-final 13/13, readme-check clean. Handoff-read 8/10;
  fixed 2 (renderer sentence wording, migration count plural).
- 23:5x final gates green (typecheck/lint/130 tests), `npm run dev`
  verified 200s. RUN COMPLETE — all green, servers stopped, no commits.
  Watchdog: stand down (see cron deletion + suspend note in SUMMARY).
- Post-handoff: npm audit fix (zod 4.6.7, drizzle-orm 0.45.4) — gates
  130/130, build + smoke green. next/katex advisories deferred w/ dates.
- 22:5x final fresh-install drill: ALL GREEN from clean room (install,
  typecheck, lint, 125 tests, build, smoke). Spawned a11y re-audit of
  new islands (toc nav, list-nav, switcher, graph fallback).
- 22:6x RC review: db.test kind values violated the Zod enum — fixed
  to practice/revisit. Added `npm run smoke` (scripts/smoke.sh, all
  green exit 0). Reader + smoke-verify agents running.
- 22:05 watchdog: gates green (110/110); fixed 6 proofread findings
  (sizes, test lists, wikilink fallback wording, port, cd qualifier,
  HUMAN cache marker); spawned load-retest + spot-check.
- 22:1x load-retest: cache fixes collapse (50-way identical all 200,
  flat); spot-check 5/5. Shipped eviction test + /_not-found note.
  Suite 111/111. Hostile review of Phase-3 code queued.

# TESTING.md — how this repo is tested

## Commands

```sh
npm test              # full suite (vitest run)
npm run typecheck     # tsc --noEmit, must be clean
npm run lint          # eslint ., must be clean
npm run build         # production build must pass
npm run smoke         # scripts/smoke.sh: prod server + full HTTP matrix
```

All five must pass before calling anything done. Vitest needs the
pinned `vite@7.1.11` (see DEPENDENCIES.md): newer vite 7.x breaks the
vitest 4.0.0 worker protocol.

`vitest.config.ts` maps `@/*` to `src/*`, matching tsconfig paths, so
route handlers import directly with no mocks.

## Suite map (tests/, all real logic, no snapshots)

| File | What it pins |
| --- | --- |
| `pipeline.test.ts` | GFM, KaTeX, highlighting, callouts, wikilinks, block slots, ==/%%, sanitize, heading ids + demotion, extraction, render cache + eviction |
| `pipeline-fuzz.test.ts` | 221 deterministic adversarial docs (seeded PRNG): never throws, no script/js leaks, unique ids, bounded output |
| `xss.test.ts` + `xss-fuzz.test.ts` | Tag/attr/protocol stripping, KaTeX/style confinement, fenced-source safety |
| `registry.test.ts` | Block-type map contents + matching |
| `plot.test.ts` | `parsePlotSpec` cases (exported from `blocks.tsx` for this) |
| `graph.test.ts` | Builder links/backlinks, dedupe, outDegree |
| `topics.test.ts` | Schemas, store CRUD/slugs/guards |
| `render-route.test.ts` | `/api/render` validation + rendering; `/api/harness/lesson` 400s, mock 200, 502 path |
| `harness.test.ts` | Providers, validation+retry, services, env handling |
| `db.test.ts` | Migrations applied in order on PGlite (real Postgres): round-trip incl. boolean `correct`, FK enforcement. Slow (~15 s, WASM boot) — 60 s timeouts |
| `seed.test.ts` | Seed coherence: titles/slugs, full-feature render, no %% residue, link resolution, backlinks |
| `toc.test.ts` | `toc` block: registry routing, heading nav links, fence-body ignored, no-headings notice |
| `listnav.test.ts` | List-nav helpers: key→delta mapping, wrap-around index math, empty-list guard |
| `slot-details.test.ts` | Server slot `<details>`: mermaid/plot wrapping, math+blocks regression, notice path |

## Conventions for new tests

- Deterministic: fixed seeds, no `Math.random`/`Date.now` in assertions.
- Failing input? If the pipeline throws on some input, that is a bug in
  `src/` until proven otherwise — fix the source, then keep the test.
- New block type? Add render + error-path tests alongside the registry entry.
- New API route? Test the handler directly with `Request` objects (see
  `render-route.test.ts`), including 400 paths.

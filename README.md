# ACE — Actually Comprehend Everything

Tell ACE what you want to study. It gives you a short lesson pitched at your level, then makes sure it actually stuck.

## The problem

Students already use LLMs to study, and a clear explanation feels like understanding. But feeling like you understand and being able to use an idea a week later are different things, and a chatbot has no way to tell them apart. It doesn't know your level, it never checks you, and it never brings you back. The student has to supply all of that discipline, which is exactly what most people can't keep up.

One-to-one tutoring has long been known to beat classroom teaching, largely because a tutor supplies that structure. It has never scaled. LLMs can now give anyone a patient explainer, but the structure is still missing.

## The idea

ACE is a study environment built around the way students already use LLMs, with the structure added.

It should feel effortless. You say what you want to study. ACE writes a short lesson calibrated to you: what you already know, how you learn best, and how deep the material should go. No prompt crafting, no setting up a workflow.

Behind that is a method that is well supported by research on learning: learn something properly, test yourself on real problems, then come back after time has passed and test yourself again. Knowing this is easy. Doing it every time, without drifting, is the hard part. ACE runs the loop for you: a study plan with a memory that schedules the work, checks the bar, and brings topics back on time.

## Why not just use a general chatbot?

A chatbot can explain almost anything, but it leaves the studying to you.

- **You carry the discipline.** You have to describe your level, ask for depth, request problems, and remember to come back later. ACE does that part.
- **It doesn't know what you know.** Lessons tend to land too basic or too hard, because the level is a guess. ACE keeps a profile and calibrates to it.
- **Nothing checks that you understood.** ACE has you work real problems before a topic counts as done.
- **Nothing brings you back.** Without a revisit schedule, most of what you learn fades. ACE retests you after a delay.

## What it is

A record of understanding per topic, calibrated lessons, practice from real textbooks and courses, a clear bar for passing each topic, and revisits after a delay. You do the learning. ACE keeps the order and the standard steady.

## Who it's for

Anyone who uses an LLM to help them learn, which is most students.

## What ACE is not

- Not a general-purpose chatbot. It's built for one job: studying.
- Not a course platform. It doesn't ship a catalogue of content; you bring the topic.
- Not something that swallows whole courses at once. It stays on the work in front of you.
- Not a gamified app. No streaks or points to keep you hooked.

## Run it

No API keys, database, or network needed (in-memory seed data, mock LLM provider).

```sh
# from the ACE/ workspace root (local `app/` maps to the GitHub repo root;
# on GitHub, run from the repo root instead)
cd app
npm install --ignore-scripts
npm run dev     # http://localhost:3000
```

Other commands: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build` + `npm run start`, `npm run db:generate` (writes
`drizzle/`, offline), `npm run smoke` (build + prod + full HTTP check).

To try the AI plumbing against a real OpenAI-compatible endpoint, copy
`.env.example` to `.env` and set `LLM_BASE_URL`, `LLM_API_KEY`,
`LLM_MODEL`. The harness is plumbing only — you own prompt design (see
`ARCHITECTURE.md` HUMAN TODO).

## First demo

The first demo is one full pass through the loop for a single topic: you name a topic, get a calibrated short lesson, work through problems, are scored against a rubric, and see a scheduled revisit. Everything else builds on that.

## Documentation

| Doc | What it covers |
|---|---|
| [Learning loop](docs/learning-loop.md) | How a topic moves from first lesson to passed to revisited |
| [Calibration](docs/calibration.md) | How ACE decides what level and depth a lesson should have |
| [Pass criteria](docs/pass-criteria.md) | What "proving" a topic means, and how revisits are scheduled |
| [Evaluation](docs/evaluation.md) | How each design choice will be tested before it is fixed |
| [Decisions](docs/decisions.md) | What's decided, what's proposed, and what's deliberately left open |

## Stack

Next.js App Router + TypeScript (strict), Zod, Drizzle ORM (Postgres,
Supabase-compatible), unified/remark/rehype markdown pipeline, Vitest,
ESLint. Server components by default; client components only where
interactivity requires it. No CSS, no component library. See
[DEPENDENCIES.md](DEPENDENCIES.md) for every package choice and
[ARCHITECTURE.md](ARCHITECTURE.md) for the module map.

Lessons and grading will run through the Meta Model API (OpenAI-compatible
provider, Phase 2 plumbing); the app itself needs no API keys to run.

## Status

Working skeleton (overnight build, 2026-10-26): topic list + creation, server-rendered
lessons (GFM, KaTeX math, highlighted code, Obsidian callouts, wikilinks,
Mermaid diagrams, function plots, `toc` tables of contents), playground
with live preview, wikilink topic graph, Ctrl+K quick switcher + j/k
list navigation, cached server rendering, in-memory store + seed,
Drizzle schema + migrations, harness plumbing only (mock +
OpenAI-compatible providers, validated routes).
No AI learning logic yet — prompts/scheduling/pass rules are the user's
design space. See [SUMMARY.md](SUMMARY.md).

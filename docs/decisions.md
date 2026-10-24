# Decisions

A running log of what's been decided, what's only proposed, and what's deliberately left open. Newest entries go at the bottom of each section.

## Decided

| Date | Decision | Why |
|---|---|---|
| 2026-10-24 | The core experience is: you say what you want to study, and ACE generates a short lesson calibrated to your profile and level. | A study tool should be effortless to start. |
| 2026-10-24 | The audience is anyone who uses an LLM to help them learn, which is most students. | ACE is built around a habit people already have. |
| 2026-10-24 | The method is learn, prove it on real problems, then revisit after time has passed and prove it again. | It is a well-established way to learn, and the hard part is sticking to it. |
| 2026-10-24 | Specific values (thresholds, targets, intervals) stay open until they have been tested. | They depend on real learners, so guessing them now would be wrong more often than right. See [Evaluation](evaluation.md). |

## Proposed, not yet decided

These came out of drafting and need a yes or no.

| Proposal | Detail |
|---|---|
| Non-goals | Not a general chatbot, not a course platform, not something that swallows whole courses, not gamified. (Listed in the README.) |
| Code owns the state, the model owns the content | The model writes lessons and scores answers; fixed rules apply the pass bar and schedule revisits. See [Learning loop](learning-loop.md). |
| Event log | Every attempt is recorded as an event, and a topic's state is derived from the record. |
| First demo scope | One full pass through the loop for a single topic. (Described in the README.) |

### Stack candidates

Nothing here is chosen. These are the leading options, with the reason for each.

| Layer | Candidate | Reason |
|---|---|---|
| App | TypeScript web app (for example Next.js) | One language for front and back end |
| Math rendering | KaTeX | Lessons and problems will contain equations |
| Storage | SQLite to start, Postgres later | Simple for one user, and easy to move up |
| Models | A Muse Spark model through the Meta Model API for lessons and grading, and an open-weights Meta model for routine turns such as hints | Fits the hackathon this is being built for, and gives a stronger model where quality matters and a cheaper one elsewhere |
| Scheduler | FSRS | A maintained, open-source spaced-repetition algorithm |
| Answer checking | A small worker using symbolic and unit-aware libraries | Arithmetic and units shouldn't be trusted to a language model |
| Material import | Document-to-Markdown conversion that preserves equations | Needed only if bringing your own material becomes part of the product |

## Deliberately left open (to be set by testing)

- The pass bar: how many problems, of what mix, and how strict the explain-back is.
- The target difficulty for practice.
- The revisit target and the scheduling algorithm.
- The length of the diagnostic.

## Open

- How is the learner profile built? (See [Calibration](calibration.md).)
- Does ACE support bringing your own material, or only topics you name?
- Which Meta model for lessons and grading, and which open-weights model for routine turns?
- Single-user first, or accounts from the start?

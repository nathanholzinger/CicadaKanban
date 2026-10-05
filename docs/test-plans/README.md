# Test Plans

What must be true of each feature, written as test cases: one business rule per case, in Given/When/Then, derived from the wiki and independent of how the code is built. For each case, the catalog also records which tests prove it, or that it's checked by hand.

The Test Planner owns the catalog. The Test Reconciler writes two fields on each case (see Statuses). Other roles hand changes off to the Test Planner. `.claude/guides/documentation-standards.md` covers what applies to every doc, and `.claude/guides/testing-strategy.md` covers the test layers. This README covers what's particular to the test plans.

## Where cases come from

- **Rules come from the wiki.** By the time a story closes, everything a case asserts traces to a wiki section.
- **The story plan gives scope, and detail that is still settling.** The Test Planner reads it to decide which cases to add, change or delete, and lists the IDs of the cases in scope in the plan's Scope.
- **The Test Planner reads no code, test code included, and writes no test code.** A case derived from code only proves that the code does what it does. Developers write the tests.
- **Past the wiki's edges.** Thinking through what the wiki doesn't say, such as where two rules meet, is part of the job. When the wiki is silent, the case is still written, with status `Pending PO`, and its question goes to the PO in the story plan's Open questions. The answer lands in the wiki first; then the case is kept, changed or deleted. The Test Planner never edits the wiki to match a case.
- **Everything the wiki states as settled gets a case, feel included.** Nothing in a page's Open questions does.
- **One standing exclusion:** no case differs from another only in being made through an MCP tool. A rule the wiki states once holds on every surface.
- **Cases go straight into the feature's catalog.** There is no separate test plan per story.

## Layout

- **One folder per feature,** named exactly like the feature's wiki folder.
- **A page of shared rules has no folder.** Each feature that applies the shared rules holds their cases in its own catalog, as that feature applies them, and each case's Rule field names the shared page's section.
- **A feature whose page says it isn't designed yet** has a folder holding only its `INDEX.md`, since nothing on its page derives a case.
- **An `INDEX.md` per folder** holds the wiki page's name and each suite, with one line on what it covers. It holds no counts: two roles write statuses, so a hand-kept total would drift, and the Reconciler's report prints the totals on each run.
- **One file per suite,** a cohesive part of the feature:

```markdown
# DRAG-5 — Stub → out: detach, depth overflow

**Next ID:** DRAG-5.13

<setup that several cases share, if any>

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-5.1 | A Stub popped out to its column becomes Free | P0 | Open |

---

## DRAG-5.1 — A Stub popped out to its column becomes Free

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

*Given* … *when* … *then* …

**Automation test:** `tests/ui/drag-5-stub-detach.spec.ts`
```

- **`**Rule:**`** names the most specific wiki section the case derives from, as `wiki <page> §N`: `wiki board-drag-interaction §3.2` rather than `wiki board-drag-interaction §3`. A case that derives from several sections names each one in full. When a section changes, a search for it finds every case derived from it. A `Pending PO` case has no Rule field; the absence is its marker. The wiki's own in-page reference forms aren't used here.
- **`**Automation test:**`** sits below the Given/When/Then, so the rule reads on its own first. The Reconciler writes it, with one exception: on a case the Test Planner makes `Manual`, the Test Planner writes its `none — manual: <reason>` line.
- **A preamble** holds only what several cases need and the wiki doesn't give, such as a shared setup. It doesn't restate the wiki's rules or its model.

## Writing a case

- **The *Then* names concrete expected values,** so whoever writes the test doesn't choose what to assert, and the Reconciler can check that the test asserts what the case says.
- **A title states the rule, never a bug.** A case that guards against a known mistake may say which mistake, in the present tense ("… so hovering over a covered member never moves it to the entry workphase"). It never says where or when the mistake was found.
- **A value the wiki names goes by its name,** never as a literal: a tuning-panel value, or a limit such as `CAP`. A test reads the configured value; a case never pins today's number.
- **A `Manual` case is as specific as its rule allows.** Its *Then* says what the person checking looks for, so two people checking it would judge the same thing.
- **One status per case.** If part of a rule can be pinned to precise assertions and part can't, it's two cases.
- **Current truth only.** No provenance, dates, story or audit IDs, build status, forward references, or "was" notes (`.claude/guides/documentation-standards.md`).
- **Priority:** **P0** is must-pass correctness or data integrity, **P1** is important behavior, and **P2** is an edge case worth verifying.

## Case IDs

- **A case's ID is its suite's ID and a number:** `<suite>.<n>`, such as `DRAG-5.5` or `ATT-4.5`. The item-positioning suites use `TC-<part>.<n>`, such as `TC-4.1`, where the part may carry a letter (`5a`) or be `X` for the cross-cutting guards. A new catalog takes a prefix of its own.
- **A case is written by its full ID everywhere,** in its own suite file as in every other place. A search for an ID then finds the case, every test that carries it, and every reference to it.
- **IDs are never reused.** Each suite's `**Next ID:**` line gives the next number; the Test Planner uses it and advances it. Gaps in the numbering are expected.
- **When a case's behavior is removed, the case is deleted.** No tombstone, and no "was" note. The ID stays retired.
- **A case that moves to another suite gets a new ID.** That happens only in the end-of-epic pass, or in a story that moves the wiki rules the case derives from. The epic's close-out, or the story's plan, lists old → new IDs, and a developer re-titles the tests before the Reconciler runs.

## Statuses

| Status | Means | Set by |
|---|---|---|
| `Planned` | The wiki passage it derives from is marked `**Planned:**`. It can't be built yet. | Test Planner |
| `Open` | The rule is live. The tests that carry its ID don't yet assert all of it, and it isn't `Manual`. | Test Planner: for a new case, or from `Planned`, `Pending PO`, or a `Manual` case whose reason no longer holds. Reconciler: from `Automated`, when the test is gone. |
| `Pending PO` | Written where the wiki is silent, and waiting on the PO. | Test Planner |
| `Automated` | The tests that carry the case's ID assert all of it, alone or together. | Reconciler |
| `Manual` | Checked by hand, for a present-tense reason. | Test Planner, or Reconciler once Nathan approves (see below) |

- **`Planned` follows the wiki's marker, which sits on a passage, not a section.** A section can hold both `Planned` and live cases. When the PO removes a marker, that passage's cases become `Open`, and the Reconciler moves them to `Automated` once tests carry their IDs.
- **A `Planned` case that will replace a live one** says so on its status line, as `Planned, replaces <ID>`. Both cases stay until the build lands; then the replaced case is deleted.
- **An `Open` case is always listed in some story's Scope,** the current story's or a later one's. That's what makes it a scheduled gap rather than a lost one.
- **Tests and cases map many-to-many.** One test can prove several cases, and one case can be proved by several tests together. When the tests carrying a case's ID assert only part of it, the case stays `Open`, with `—` on its Automation test line, and the Reconciler's report names those tests and the part they miss.
- **Closing a partial gap is a judgment call,** made case by case. Any of these is acceptable:
  - extend a test that already carries the ID;
  - write a new test focused on the case;
  - put the ID on another existing test that asserts the missing part.

  A test through the surface where the rule is visible is preferred, usually a Playwright test for a behavior (`.claude/guides/testing-strategy.md`).

## Which tests count, and what's manual

- **A test through a surface counts without approval:** a Playwright UI test (`tests/ui/`), a Playwright API test (`tests/api/`), or a server route test (`server/tests/routes/`). This is the layer rule in `.claude/guides/testing-strategy.md`: a rule a user or an API caller can see gets a test through that surface.
- **A test that calls internal code directly** (a client module, or a server `lib/` function) counts only once Nathan approves it. The Reconciler proposes the mapping, and writes it after approval. A later run treats an existing internal pointer as approved.
- **No internal test is mapped beside a surface test that covers the whole case.** The surface test makes the case `Automated` without it, so the Reconciler doesn't propose the internal test. An internal test that covers a part the surface tests miss is still proposed. The rule governs new mappings: an existing internal pointer beside a whole surface test stays, and a run that comes across one may propose dropping it.
- **One category of internal test is approved outright: a drag clock's logic.** That covers when a clock starts, what resets it, what counts toward it, and which band fires it, tested in the pop state machine with the threshold passed as a parameter. Such a test's pass doesn't depend on the tuned value, so a case about a clock's logic is `Open`, not `Manual`.
- **A second approved category: a client ordering or request rule whose only surface is a drag.** Examples are the ordinal preview, the order a response is applied in, the tie-break, and which anchor a placement names. It's tested in the client's pure modules for list order, response reconciliation and drag requests. A drag test reaches such a rule only incidentally, and for some of them no surface test can tell the rule from its failure.
- **`Manual`, by the Test Planner's judgment,** when the case is written: its outcome can't be reduced to precise assertions. That covers feel ("the drag reads as one continuous motion"), and a case whose pass depends on a tunable drag threshold's value (`.claude/guides/testing-strategy.md`, "What stays manual"), such as whether the tuned values feel right. A part of the same rule that can be pinned, such as reaching the gesture, the write it makes, or a clock's logic, is its own case.
- **`Manual`, by Nathan's approval,** for a case that could be automated but isn't worth it: too flaky, or too costly. The Reconciler proposes it, one case at a time or for a named category.
- **A `Manual` reason is a present-tense condition.** When it stops holding, the case goes back to `Open`.

## How tests and cases point at each other

- **A test that covers a case starts its title with the case's ID and a colon.** With several IDs, they're separated by commas. An ID on a `describe` covers every test inside it, and a case may have several tests.

```ts
it('DRAG-6.6: a rejected move fails the write and resyncs the board', …)
test.describe('DRAG-4.9, DRAG-4.10: placement between two rows', …)
```

- **A case's `**Automation test:**` line lists repo-relative file paths,** not individual tests. For a `Manual` case, it reads `none — manual: <reason>`. A case with no test yet shows `—`.
- **The ID in the test's title is the reference that matters.** It runs from the side that changes more to the side that changes less, so moving or splitting a test file carries it along. The file path is a convenience the Reconciler keeps current.
- **Deleting a test that carries an ID, or dropping the ID from its title,** goes in the story's living-docs handoff. The developer doesn't edit the plan.
- **`npm run check:docs` checks the IDs themselves.** It flags a case ID, in a test title, a code comment or the test plans, that isn't a case in the catalog; a bare `TC-n` in a test title or comment; and a suite's `**Next ID:**` that isn't past every case in that suite. It can't tell whether a case still has a test; the Reconciler checks that.

## What the Reconciler writes

`.claude/agents/test-reconciler.md` is its full definition. In the catalog, it writes exactly two fields on each case: its status (`Open` and `Automated` either way, and `Manual` once Nathan approves) and its `**Automation test:**` line. It never writes a case's text or priority, never sets `Planned` or `Pending PO`, never deletes a case, and leaves a `Manual` case the Test Planner set alone.

On every run, across the whole catalog, it moves an `Automated` case with no test carrying its ID back to `Open`, and it lists tests whose titles carry an ID the catalog doesn't have. Its report goes to `docs/audits/` while the story is open, and moves to `docs/archive/` with the story.

## When the catalog changes

- **Story planning.** For each Planned passage the story builds, the Test Planner writes or updates its `Planned` cases, and lists their IDs in the story plan's Scope.
- **Story close.** The Test Planner applies the story's living-docs handoff wherever it lands, not only to the cases in Scope:
  - `Planned` → `Open` for passages whose markers came off;
  - cases revised for changed rules, and deleted for removed ones;
  - `Pending PO` cases resolved from the PO's rulings;
  - any new or reopened case added to the story's Scope.

  `.claude/guides/story-done-checklist.md` sets the order of the steps and what must hold before sign-off.
- **A rule change outside a story.** The PO's report names the sections it touched, and the Test Planner updates the cases derived from them.
- **Epic close.** The Test Planner re-reads each feature the epic touched against the finished wiki, adds, revises or deletes cases, and may regroup suites that the story-by-story passes split awkwardly (see Case IDs for what a move does to an ID).

## When a test for a case fails

- **If the case misread a clear page,** the Test Planner fixes the case. No ruling is needed.
- **Otherwise, whether the wiki or the code is wrong is a ruling.** Neither side is assumed right, and the PO takes it to Nathan as with any other rule.

The catalog doesn't track runs. It says whether a case is automated, not how often it has passed.

# Test Plans

What must be true of each feature, written as test cases: one business rule per case, in Given/When/Then, derived from the wiki and independent of how the code is built. For each case, the catalog also records which tests prove it, or that it's checked by hand.

The Test Planner owns the catalog. The Test Reconciler writes two fields on each case (see Statuses). Other roles hand changes off to the Test Planner. `.claude/guides/documentation-standards.md` covers what applies to every doc, and `.claude/guides/testing-strategy.md` covers the test layers. This README covers what's particular to the test plans.

## Where cases come from

- **Rules come from the wiki.** By the time a story closes, everything a case asserts traces to a wiki section.
- **The story plan gives scope, and detail that is still settling.** The Test Planner reads it to decide which cases to add, change or delete, and lists the IDs of the cases in scope in the plan's Scope.
- **The Test Planner reads no code, test code included, and writes no test code.** A case derived from code only proves that the code does what it does. The QA Engineer writes the Playwright suites from the cases and shares the Vitest suites with the Coder. It spawns the read-only Planner desk for reading questions, the Test Reviewer while tests are written, and the Reconciler at the end of a scope. The Planner spawns none of them.
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

| ID       | Case                                         | Priority | Status |
| -------- | -------------------------------------------- | -------- | ------ |
| DRAG-5.1 | A Stub popped out to its column becomes Free | P0       | Open   |

---

## DRAG-5.1 — A Stub popped out to its column becomes Free

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

_Given_ … _when_ … _then_ …

**Automation test:** `tests/ui/drag-5-stub-detach.spec.ts`
```

- **`**Rule:**`** names the most specific wiki section the case derives from, as `wiki <page> §N`: `wiki board-drag-interaction §3.2` rather than `wiki board-drag-interaction §3`. A case that derives from several sections names each one in full. When a section changes, a search for it finds every case derived from it. A `Pending PO` case has no Rule field; the absence is its marker. The wiki's own in-page reference forms aren't used here.
- **`**Automation test:**`** sits below the Given/When/Then, so the rule reads on its own first. The Reconciler writes it, with one exception: on a case the Test Planner makes `Manual`, the Test Planner writes its `none — manual: <reason>` line.
- **A preamble** holds only what several cases need and the wiki doesn't give, such as a shared setup. It doesn't restate the wiki's rules or its model.

### Fields the coverage report reads

Keep these forms fixed, so `npm run report:catalog` can read them without interpreting prose:

- **ID:** the full case ID starts its `## <ID> — <title>` heading and appears once in its suite's summary table.
- **Priority and status:** the case's own line reads `**Priority:** P0 · **Status:** Open · **Rule:** wiki <page> §N`, with the case's priority, status and Rule substituted. A `Pending PO` case omits the Rule. The status is one of the Statuses table's exact names; `Planned, replaces <ID>` is the one allowed qualifier.
- **Summary status:** the `Status` cell in the `| ID | Case | Priority | Status |` table holds the same status as the case's own line. Both change together; neither is a separate judgment. A replacement uses the same `Planned, replaces <ID>` form in both.
- **Automation:** one `**Automation test:**` line per case, below its Given/When/Then. Its value is a comma-separated list of repo-relative paths, each in backticks; `—` when coverage is not confirmed; or `none — manual: <reason>` for a Manual case. A partial mapping belongs in the Reconciler's report, not in this field.

The report checks lost coverage, running tests that carry a Manual case, stale Automation paths and disagreeing statuses. It also supplies the ID-to-files map, skipped carriers apart, and totals. It reports findings; it doesn't change a case or judge whether a test proves its Then. Unknown IDs remain a `check:docs` check.

## Writing a case

- **The _Then_ names concrete expected values,** so whoever writes the test doesn't choose what to assert, and the Reconciler can check that the test asserts what the case says.
- **A title states the rule, never a bug.** A case that guards against a known mistake may say which mistake, in the present tense ("… so hovering over a covered member never moves it to the entry workphase"). It never says where or when the mistake was found.
- **A value the wiki names goes by its name,** never as a literal: a tunable value, or a limit such as `CAP`. A test reads the configured value; a case never pins today's number.
- **A `Manual` case is as specific as its rule allows.** Its _Then_ says what the person checking looks for, so two people checking it would judge the same thing.
- **One status per case.** If part of a rule can be pinned to precise assertions and part can't, it's two cases.
- **Current truth only.** No provenance, dates, story or audit IDs, build status, forward references, or "was" notes (`.claude/guides/documentation-standards.md`).
- **Priority:** **P0** is must-pass correctness or data integrity, **P1** is important behavior, and **P2** is an edge case worth verifying.

## Case IDs

- **A case's ID is its suite's ID and a number:** `<suite>.<n>`, such as `DRAG-5.5` or `ATT-4.5`. The item-positioning suites use `TC-<part>.<n>`, such as `TC-4.1`, where the part may carry a letter (`5a`) or be `X` for the cross-cutting guards. A new catalog takes a prefix of its own.
- **A case is written by its full ID everywhere,** in its own suite file as in every other place. A search for an ID then finds the case, every test that carries it, and every reference to it.
- **IDs are never reused.** Each suite's `**Next ID:**` line gives the next number; the Test Planner uses it and advances it. Gaps in the numbering are expected.
- **When a case's behavior is removed, the case is deleted.** No tombstone, and no "was" note. The ID stays retired.
- **A case that moves to another suite gets a new ID.** That happens only in the end-of-epic pass, or in a story that moves the wiki rules the case derives from. The epic's close-out, or the story's plan, lists old → new IDs. The QA Engineer re-titles the Playwright tests before the Reconciler runs. The Coder or the QA Engineer re-titles the Vitest tests, whoever Nathan asks first.

## Statuses

| Status       | Means                                                                                            | Set by                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Planned`    | The wiki passage it derives from is marked `**Planned:**`. It can't be built yet.                | Test Planner                                                                                                                                                         |
| `Open`       | The rule is live. The tests that carry its ID don't yet assert all of it, and it isn't `Manual`. | Test Planner: for a new case, or from `Planned`, `Pending PO`, or a `Manual` case whose reason no longer holds. Reconciler: from `Automated`, when coverage is lost. |
| `Pending PO` | Written where the wiki is silent, and waiting on the PO.                                         | Test Planner                                                                                                                                                         |
| `Automated`  | The tests that carry the case's ID assert all of it, alone or together.                          | Reconciler                                                                                                                                                           |
| `Manual`     | Checked by hand, for a present-tense reason.                                                     | Test Planner, or Reconciler once Nathan approves (see below)                                                                                                         |

- **`Planned` follows the wiki's marker, which sits on a passage, not a section.** A section can hold both `Planned` and live cases. When the PO removes a marker, that passage's cases become `Open`, and the Reconciler moves them to `Automated` once ID-bearing tests prove the whole Then.
- **A `Planned` case that will replace a live one** says so on its status line, as `Planned, replaces <ID>`. Both cases stay until the build lands; then the replaced case is deleted.
- **An `Open` case is always listed in some story's Scope,** the current story's or a later one's. That's what makes it a scheduled gap rather than a lost one.
- **Tests and cases map many-to-many.** One test can prove several cases, and one case can be proved by several tests together. When the tests carrying a case's ID assert only part of it, the case stays `Open`, with `—` on its Automation test line, and the Reconciler's report names those tests and the part they miss.
- **A reviewer pass changes no catalog field.** A stamp claims coverage; the Test Reviewer proposes mappings, and the Reconciler confirms whole-Then coverage at the scope's close. An authored or reviewed test doesn't make a case `Automated` before that close. A batch counts as a scope when its plan says so.
- **Closing a partial gap is a judgment call,** made case by case. Any of these is acceptable:
  - extend a test that already carries the ID;
  - write a new test focused on the case;
  - put the ID on another existing test that asserts the missing part.

  A test through the surface where the rule is visible is preferred, usually a Playwright test for a behavior (`.claude/guides/testing-strategy.md`).

## Which tests count, and what's manual

- **A test through a surface counts without approval:** a Playwright UI test (`tests/ui/`), a Playwright API test (`tests/api/`), or a server route test (`server/tests/routes/`). This is the layer rule in `.claude/guides/testing-strategy.md`: a rule a user or an API caller can see gets a test through that surface.
- **A test that calls internal code directly** (a client module, or a server `lib/` function) counts only once Nathan approves it. The Test Reviewer may propose the mapping while tests are written; the Reconciler may find a new one at the close. The QA Engineer stamps an approved mapping before the freeze; the Reconciler stamps one it finds new after approval, and writes the Automation line. A later run treats an existing internal pointer as approved.
- **No internal test is mapped beside a surface test that covers the whole case.** The surface test makes the case `Automated` without it, so the Reconciler doesn't propose the internal test. An internal test that covers a part the surface tests miss is still proposed. The rule governs new mappings: an existing internal pointer beside a whole surface test stays, and a run that comes across one may propose dropping it.
- **One category of internal test is approved outright: a drag clock's logic.** That covers when a clock starts, what resets it, what counts toward it, and which band fires it, tested in the pop state machine with the threshold passed as a parameter. Such a test's pass doesn't depend on the tuned value, so a case about a clock's logic is `Open`, not `Manual`.
- **A second approved category: a client ordering or request rule whose only surface is a drag.** Examples are the ordinal preview, the order a response is applied in, the tie-break, and which anchor a placement names. It's tested in the client's pure modules for list order, response reconciliation and drag requests. A drag test reaches such a rule only incidentally, and for some of them no surface test can tell the rule from its failure.
- **`Manual`, by the Test Planner's judgment,** when the case is written: its outcome can't be reduced to precise assertions. That covers feel ("the drag reads as one continuous motion"), and a case whose pass depends on a tunable drag threshold's value (`.claude/guides/testing-strategy.md`, "What stays manual"), such as whether the tuned values feel right. A part of the same rule that can be pinned, such as reaching the gesture, the write it makes, or a clock's logic, is its own case.
- **A held-off case stays `Open`.** The QA Engineer records why it can't reliably reach the case through the surface. The Test Reviewer weighs internal coverage, then Nathan decides with that verdict in hand. The QA Engineer writes a new Vitest test only after that approval, from the Then, never as a regression pinned to a fix.
- **`Manual`, by Nathan's approval,** for a case that could be automated but isn't worth it: too flaky, or too costly. The Reconciler may propose it, one case at a time or for a named category. During authoring, a Manual decision goes to a Planner session with the Test Reviewer's verdict and Nathan's decision. The Planner applies that approved call; the Reconciler may apply an approval at the close. The QA Engineer and the desk never set it.
- **A `Manual` reason is a present-tense condition.** When it stops holding, the case goes back to `Open`.
- **A skipped test doesn't count.** A case whose only tests are skipped is `Open`, routed by ID to the story that takes the skip up. The skipped test keeps the case's ID in its title, so that story finds it.

## How tests and cases point at each other

- **A test that covers a case starts its own title with the case's ID and a colon.** With several IDs, they're separated by commas, and a case may have several tests. Existing IDs on a `describe` count for the tests inside it; new stamps go on each test's own title, never on a `describe`.

```ts
it('DRAG-6.6: a rejected move fails the write and resyncs the board', …)
test('DRAG-4.9, DRAG-4.10: placement between two rows', …)
```

- **A case's `**Automation test:**` line lists repo-relative file paths,** not individual tests. For a `Manual` case, it reads `none — manual: <reason>`. A case with no test yet shows `—`.
- **The ID in the test's title is the reference that matters.** It runs from the side that changes more to the side that changes less, so moving or splitting a test file carries it along. The file path is a convenience the Reconciler keeps current.
- **The QA Engineer stamps its own Playwright tests as it writes them,** and approved Vitest mappings before the frozen run. The Reconciler stamps only coverage it finds new at the close, and writes the Automation line for every case it confirms. Either may remove a retired ID, never a live case's.
- **Every stamp gets a title-only diff, then `npm run check:docs`.** Freeze evidence compares test lists with ID prefixes stripped, so a title-only stamp doesn't void the green run.
- **Deleting a test that carries an ID, or dropping the ID from its title,** goes in the story's living-docs handoff. The Coder records its Vitest changes there; the QA Engineer records its Playwright changes there. Changes to an ID-bearing Vitest test's assertions or setup also go in the Coder's handoff for the Test Reviewer; a rename or import change doesn't require that review. Neither test writer edits the catalog.
- **`npm run check:docs` checks the IDs themselves.** It flags a case ID, in a test title, a code comment or the test plans, that isn't a case in the catalog; a bare `TC-n` in a test title or comment; and a suite's `**Next ID:**` that isn't past every case in that suite. It can't tell whether a case still has a test; the Reconciler checks that.

## What the Reconciler writes

`.claude/agents/test-reconciler.md` is its full definition. In the catalog, it writes exactly two fields on each case: its status (`Open` and `Automated` either way, and `Manual` once Nathan approves) and its `**Automation test:**` line. It never writes a case's text or priority, never sets `Planned` or `Pending PO`, never deletes a case, and leaves a `Manual` case the Test Planner set alone.

It runs cold once, at the end of a scope: a story's close, an epic's close, a baseline, or a batch the plan names as a scope. The QA Engineer supplies its fixed inputs: the plan's Scope and Review log, the coverage report from the green run's tree, that run's tree ID and JSON report paths, and the range's test and catalog diffs. Approvals arrive in a follow-up when needed. The Reconciler reads the catalog, cited wiki sections and tests itself.

Across the whole catalog, it acts on the coverage report rather than rebuilding the checks by hand. An `Automated` case with no running carrier goes back to `Open`; it reports a Manual case a running test carries, corrects stale Automation paths, and corrects disagreeing statuses it set or refers others to the Planner. For its scope, it judges the whole Then and answers every open Review log verdict. It diagnoses no failure and rebuilds no runtime or snapshot evidence. Its report goes to `docs/audits/` while the story is open, and moves to `docs/archive/` with the story.

## The Review log

The QA Engineer appends to the plan's Review log, word for word:

- the desk's questions and replies, each reply quoting the Then it read;
- every Test Reviewer verdict, including later passes;
- mappings Nathan declined.

Entries aren't rewritten. A changed Then visibly voids an earlier desk answer; it doesn't change the answer's record. Test gaps go to the QA Engineer, case gaps to a Planner session through Open questions, and rule gaps to the PO. The desk never rewords, splits or sets a status. The Reconciler confirms verdicts from the tests and answers each open one at the close. A declined mapping stays declined unless its test changed since.

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

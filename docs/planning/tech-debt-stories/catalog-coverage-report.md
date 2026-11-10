# Catalog Coverage Report

**Type:** tech-debt story. It adds a repo script and changes nothing the app does. The [Story 10 checkpoint audit](../../audits/code-quality-audit-story-10-checkpoint.md) covered its commits along with the app and harness work before them, and the story closes with that audit's fixes (decision 7) · **Written:** 2026-11-09 by the Architect, from the [testing roles round table](../round-tables/testing-roles.md) (Q10) · **Sequenced:** after the [Testing Roles Refactor](testing-roles-refactor.md)'s batch 3, so it's the first Coder work to run `/code-review` under the new instructions, and before Epic 3.5 Story 10's batch 4c starts · **Status:** batch 1 committed (`f9fd73d7`). Batch 2, the audit's Fix Now, is approved (2026-11-10): all four cases are written, and 2d's case prerequisite is met

## Goal

Add one command that reports how the test-plan catalog and the tests line up. The end-of-scope reconciler then reads a report instead of working it out by hand.

**Why:**

- In batch 4b, every Reconciler run checked the whole catalog by hand for lost coverage and unknown IDs. All five reports printed the same answer: none, across 484 cases.
- The round table agreed to make those checks mechanical (Agreed 15).
- Under the [Testing Roles Refactor](testing-roles-refactor.md), the reconciler runs cold at the end of a scope, and this report is one of its inputs. Without it, a cold close would rebuild the mapping from nothing.

**Out of scope:**

- **Failing the gate.** Statuses and Automation lines are the reconciler's to fix, at the end of a scope. A finding the Coder can't clear shouldn't turn `npm run check` red. (Round table: the Coder and the Reconciler.)
- **Unknown IDs.** `check:docs` already fails a test title that carries an ID the catalog doesn't have (`scripts/check-docs/rules.mts::caseIds`).
- **Narrowing to a git range,** which was the Reconciler's suggested fallback. A whole-catalog report needs no range, and the Coder judged it the simpler build.
- **Judging whether a test asserts its case.** That stays with the test reviewer and the reconciler.
- **Skips decided at run time.** All 21 of today's skips are declarations (`test.skip(...)`). A skip decided inside a test body would need a run's report to detect.

## Scope

Batch 2 adds these cases before implementation. BCU-1.9, ATT-1.15 and ATT-10.9 are `Open`; BCU-1.10 is `Planned`, following the wiki's marker. All four have unconfirmed Automation lines:

| Finding | Case                                                                                    | Batch  | Expected behavior                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1      | [BCU-1.9](../../test-plans/boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)  | 2a, 2e | A failed switch leaves B selected with no board drawn, never A's columns under B's controls                                                                               |
| #2      | [BCU-1.10](../../test-plans/boards-columns-unsorted/bcu-1-boards-and-what-they-show.md) | 2d, 2e | A read cannot undo an applied move answer, on a board switch or same-board reload; a stopped-drag flash waits through the follow-up read and starts once at final drawing |
| #3      | [ATT-1.15](../../test-plans/item-attachment/att-1-free-attached-state.md)               | 2b, 2e | An older child reorder answer leaves the later parent cascade's workphases intact, in either response order; a stale missing workphase cannot restore Unsorted attention  |
| #4      | [ATT-10.9](../../test-plans/item-attachment/att-10-creating-an-item.md)                 | 2a, 2e | Reversed depth-read answers leave the add-child control disabled at the current saved depth CAP                                                                           |

These are separate cases rather than added givens on BCU-1.7, ATT-1.3 and ATT-10.8, so the existing cases' Automated claims retain their scope. BCU-1.7, BCU-1.8, ATT-1.3 and DRAG-6.29 retain their unchanged tests as regression guards. The confirming reconciliation covers all four new cases plus TREE-1.1's changed gesture. Once 2d is built, the PO clears the Planned marker in wiki boards-columns-unsorted §3 and the Test Planner moves BCU-1.10 to Open before coverage is confirmed.

**Internal regression checks outside these cases:** retaining the drawn board after a failed same-board reload is decision 11's preservation requirement, not an explicit wiki guarantee. Depth-pill text and presentation remain the Sheet's placeholder behavior (wiki item-sheet, Open questions); ATT-10.9 asserts the settled add-child control rule. Keep both checks in 2a's internal tests without making them additional catalog obligations. ATT-1.15 asserts `invalidItems` and `needsAttention`, not a badge design, which also remains unsettled.

## Decisions

Decisions 1–6 were approved for batch 1, and 7–12 on 2026-11-10.

**1. It's a separate command, and only reports.** It's named `npm run report:catalog` (Nathan). "Coverage" alone would read as code coverage, which `npm run test:coverage` already reports. It prints to the terminal, or to a file with `--out <path>`.

- It exits 0 whatever it finds, and exits 1 only when it can't read its inputs.
- It isn't part of `npm run check`.
- The reconciler has no shell, so the session that spawns it runs the command and hands over the output.

**2. It reuses the docs checker's reading.**

- Test titles come from the docs checker's title extraction (`scripts/check-docs/extract.mts`), across its test roots: `client/src`, `server/tests` and `tests`.
- Case IDs come from its repo index (`scripts/check-docs/repoIndex.mts`).
- The extraction lacks two things today, and gains them: whether a title's call is a skip, and the `describe` a test sits in. An ID on a `describe` covers every test inside it (`docs/test-plans/README.md`).
- Whether the new code lives in `scripts/check-docs/` or in a folder of its own that imports from it is the Coder's call.

**3. What it reads from each case,** in the form the catalog README gives:

- its ID;
- the `**Status:**` on the case's own line;
- the status in its suite's table;
- its `**Automation test:**` line.

The catalog's format is the Test Planner's, and the README's "Fields the coverage report reads" fixes these forms. If the script finds it ambiguous, such as a status written two ways, the Coder raises it in this plan for the Planner and doesn't edit the catalog.

A table is read by its cells, trimmed, never by matching its text. Prettier pads a table's columns, and the catalog holds both padded and unpadded tables.

**4. The checks.** All four report; none fails anything. A "running test" is one that isn't skipped.

1. **Lost coverage:** an `Automated` case that no running test carries, by its own title or by its `describe`'s.
2. **A `Manual` case a running test now carries.**
3. **A stale Automation line:** a path that doesn't exist, or a file in which no running test carries that case's ID. A `none — manual: <reason>` line is left alone.
4. **Two statuses for one case:** the suite's table and the case's own line disagree.

**5. What it prints:**

- each check's findings, one per line with the case ID and the file paths, or "none";
- the ID-to-files map: each case, its status, and the files whose running tests carry it, with skipped carriers listed separately;
- totals: cases per status and per priority.

**6. The Coder builds it.** `scripts/` is the Coder's. The tests sit beside the code and run in `npm run test:scripts`, like the other scripts' tests.

### Batch 2: the checkpoint audit's fixes

The findings are numbered as in the [audit report](../../audits/code-quality-audit-story-10-checkpoint.md).

**7. Batch 2 is the audit's Fix Now, and the story closes with the audit.** The audit ran over `epic-3-5-story-8-13-audited..f9fd73d7`, as a checkpoint before Story 10's 4c. Its ten required findings land here, in audit-workflow §8's order: correctness, then drift. The story then closes by the story-done checklist's audit steps: a confirming Reconciler run over the cases the fixes touched, and the audit's close-out.

**8. The cases come first.** #1, #3 and #4 break rules the wiki already states, but no case holds their scenarios:

- **#1, a failed switch to another board:** new BCU-1.9. BCU-1.7 holds a late answer for another board, not a failed one (wiki boards-columns-unsorted §3).
- **#3, an older answer landing after a newer cascade:** new ATT-1.15, including the stale missing-workphase variant. ATT-1.3 holds the cascade, and DRAG-6.29 holds the same ordering for positions (wiki item-attachment §2, positioning §8).
- **#4, two reparents' depth reads answered in reverse:** new ATT-10.9. ATT-10.8 holds the control's update after a reparent without overlapping depth reads (wiki item-attachment §14).

The Test Planner has written all three in the feature catalogs and listed them in Scope. Each fix's test is written in its sub-batch, at the layer the fix lives in: a hook or component test, stamped with its case's ID. It's that case's regression test too. Whether each counts for its case is Nathan's approval. Writing the cases does not certify their tests or select their implementation layer.

**Each case also gets a Playwright test, in 2e (Nathan).** The QA Engineer writes them once 2a, 2b and 2d have landed: BCU-1.9, ATT-1.15, ATT-10.9 and BCU-1.10. Each holds or refuses an answer through the page, with `tests/helpers/holdRequests.ts` or `requestHarness.ts::holdNextWrite`, so the browser sees the answers land in the order the case names.

- **Why all in 2e,** rather than beside each fix in 2a and 2b: the Playwright suites are the QA Engineer's, so a test beside each fix would split each sub-batch across two sessions. The four tests share one technique, BCU-1.10 (2d's case) gets its test in the same place, and one Test Reviewer pass covers every new case's tests.
- **What it costs:** 2e waits for 2d, and its tests aren't shown failing before their fixes. The hook tests in 2a, 2b and 2d carry that proof.

**9. An older answer leaves a workphase that a later write has set (#3).** Workphase currency follows position currency (wiki positioning §8):

- The board records which write last set each row's workphase: the written row's own, and its attached descendants' through the cascade.
- An answer that lands after a later-sent write has set one of its rows' workphase leaves that row's workphase as it is, and cascades nothing from it.
- The bookkeeping is `lib/positionedWrite.ts::positionRecord`'s: which write last set each row. Widen it to take the rows an answer sets, or put a sibling beside it in the same file, so the rule lives in one place. The shape is the Coder's call.
- Positions are untouched. DRAG-6.29's tests pass unchanged, and the cascade still stops at a detached child, as the server's does.

**Why not a reload,** the audit's other option: the record already settles positions this way, so the board keeps one rule for an older answer.

**10. #2 is confirmed, and 2d builds it.** The PO ruled that the board has the sidebar's guarantee (Amendments, 2026-11-10) and recorded it in wiki boards-columns-unsorted §3, as Planned.

- The Test Planner has written BCU-1.10 and added it to Scope. 2d's case prerequisite is met (decision 8).
- A load during which an item answer was applied is read again, as the sidebar's is (wiki project-tree §4, `useProjectCollection.ts::refreshProjects`). Selection and load ordering (BCU-1.7, BCU-1.8) and pending placements are kept.
- **A read made again belongs to the same reload,** which confirms the PO's reading of the stop cue (Amendments). The overtaken read applies nothing, leaves the loading state on, and doesn't call `boardDrawn`. The read made again doesn't call `reloadStarted`. So a flash waiting for the board plays once, when the board is finally drawn. Wiki board-drag-interaction §10 needs no new wording: a read made again isn't another reload.
- The PO clears the Planned marker once 2d is built.

**11. A failed switch draws no board (#1).** A failed load clears a board other than the one it read, so the board area falls back to its no-board state. It never shows one board's columns under another's tab (wiki boards-columns-unsorted §3). A failed reload of the board already drawn keeps it drawn, as now. The no-board state's wording is placeholder UI, and stays as it is.

**12. Which optional findings ride along.**

- **#11, its documentation half:** the testing guide says to set the worker count with `E2E_WORKERS`, never Playwright's `--workers`, which would send tests to slots with no stack (2f). The config guard the audit offers isn't pulled in: a count above the pool already fails loudly, at a refused connection.
- **#12 and #13 aren't:** no Fix Now changes their files, and their copies still agree.
- **Two comments that still name the old single E2E stack** ride along: `tests/helpers/slots.ts`'s header (2e) and `server/vitest.config.ts`'s `DB_PATH` comment (2c).

## Work, in batches

**Batch 1 — the report (Coder).**

- The title extraction records skips and the enclosing `describe`, or a sibling function does.
- A catalog reader takes each case's ID, both statuses and its Automation line.
- The four checks and the output.
- Unit tests for each.
- The root `package.json` command.
- **`/code-review`** before the check-in, at the level the refactor sets, recorded in the return (the refactor's decision 9). This is the trial's first run.
- **Check:** the gate. Then one run on the tree at batch 4b's close, compared with that close's reconciliation report. The totals and lost-coverage results match, or each difference is explained: a hand count can be wrong too.
- **Stop** for Nathan's review.

**Batch 2 — the checkpoint audit's Fix Now (decisions 7–12).** Six sub-batches, split by owner and area:

- **The Coder's run in order,** 2a then 2b, then 2c and 2d in either order. Doing 2d before 2c gets 2e started sooner.
- **2e is the QA Engineer's,** after 2a, 2b and 2d, whose fixes its tests assert. It touches only `tests/`, so it can run beside 2c and 2f. Its E2E run never overlaps another, since two runs can't share the machine.
- **2f is the Architect's,** after 2b, which adds to what its paragraph describes.

**Every sub-batch:**

- starts once its cases are written (decision 8);
- shows each fix's test failing before the fix where it can, and says which it couldn't (audit-workflow §8);
- runs `/code-review` at `medium` before its check-in, recorded in its return;
- lists any ID-bearing Vitest test it changed or added, for the Test Reviewer;
- ends with `npm run check`, plus `npm run test:e2e` where it changes what the app or the runner does, and a stop for Nathan's review and commit.

**A drag spec that fails in a run** is run alone before the failure is put down to the sub-batch. DRAG-7.10 fails under load and is Story 10's 4c. DRAG-3.16's two tests stay skipped until 4h.

- **2a. A failed switch, and an older depth read (#1, #4). Coder.**
  - **#1, decision 11:** `useBoardLoad.ts`'s failed load, while it's still the current one, clears a board other than the one it read. `BoardView.tsx` already draws the no-board state.
  - **#4:** `ItemDetailPanel.tsx::refreshDepths` numbers each read, and applies only the latest read's answer. This covers depth reads only; the accepted window for a child created during the Sheet's refresh isn't reopened.
  - **Tests:** BCU-1.9, based on the audit's first probe in `useBoardLoad.test.ts`: load A, select B, fail B's read, and A's board isn't shown. ATT-10.9, based on the fourth probe in `ItemDetailPanel.test.tsx`: two reparents with their reads answered in reverse leave the add-child control disabled at the current saved depth CAP, with its cap reason. Preserve the internal checks that a failed reload of the drawn board keeps it drawn, and that depth pills show the current depth; those checks are outside the new cases (Scope).
  - **Size and risk:** about 10 lines across 2 files, plus tests. #1 runs only when a load fails, and #4 changes the outcome only when two reparents' reads overlap.
  - **Gate:** `check` and `test:e2e`.
- **2b. An older answer leaves a newer cascade's workphase (#3, with #9). Coder.**
  - **#3, decision 9:** `itemWriteReconciliation.ts` (`withWorkphaseCascaded`, `completeItemWrite`) and `useItemManagement.ts`, and `lib/positionedWrite.ts` if the record is shared.
  - **#9:** this batch changes what a Stub's stored workphase follows, so `useBoardDnd.ts`'s pickup comment is rewritten after the fix. It states the drag's policy: snapshot the containing Card's drawn workphase, because a Stub's stored one can lag the Card's write or differ from it by design. Behavior is unchanged.
  - **Tests:** ATT-1.15, based on the audit's third probe. P, attached C and attached G start in W1. C's reorder answer is held, P's move to W2 is answered first, and then C's lands: C and G stay in W2. With the same hierarchy initially holding no workphase, the older answer cannot restore a missing workphase, a nonempty `invalidItems`, or `needsAttention = true`. The same writes answered in order end the same way. DRAG-6.29's and ATT-1.3's tests pass unchanged.
  - **Size and risk:** about 30–40 lines across 2–3 files, plus tests. Every board item answer goes through it. The outcome changes only when an older answer lands after a later-sent write has set one of its rows' workphase.
  - **Gate:** `check` and `test:e2e`.
- **2c. A closing fence holds nothing after its run (#5). Coder.**
  - **The change:** `scripts/check-docs/extract.mts::unfencedLines` closes a fence only on a run followed by nothing but whitespace. An opening fence keeps its info string. Also `server/vitest.config.ts`'s `DB_PATH` comment, which still names Playwright's `test.db` (decision 12).
  - **Tests:** the audit's in-memory probe in `extract.test.mts`: the content line stays fenced, and the lines after the real closing fence are read. In `catalog.test.mts`, the same text through `readSuite`: no case X-1.1, and the prose after the fence kept.
  - **Check:** `npm run check:docs`'s hits and `npm run report:catalog`'s output, before and after the change, are the same, or each difference is explained.
  - **Size and risk:** about 3 lines in 1 file, plus tests. Every Markdown file both tools read goes through it, but only a fence-like line with text after its run, inside a fence, reads differently.
  - **Gate:** `check`. No E2E run: neither the app nor the runner changes.
- **2d. A board load leaves an applied answer (#2). Coder. BCU-1.10 is written (decision 10).**
  - **Confirmed:** `useBoardLoad.ts` reads again a load during which an item answer was applied. `useItemManagement.ts` says whether one was, and `BoardView.tsx` wires the two together.
  - **Tests:** BCU-1.10, from the audit's second probe: a board switch and a same-board reload cannot apply their older snapshot after a move answer was applied. A flash waiting for the board plays once, after the read made again (decision 10), with the cue's two callbacks standing in as in BCU-1.7's tests. BCU-1.7's and BCU-1.8's tests pass unchanged.
  - **Size and risk:** about 20 lines across 3 files, plus tests. Every board load goes through it, but a load is read again only when an item answer landed while it ran.
  - **Gate:** `check` and `test:e2e`.
- **2e. The cases' Playwright tests, and the test harness (#6, #7, #8). QA Engineer, after 2a, 2b and 2d.**
  - **The cases (decision 8):** a Playwright test each for BCU-1.9, ATT-1.15, ATT-10.9 and BCU-1.10, from the case's _Then_, stamped with its ID. Each holds or refuses its answers with `holdRequests.ts` or `requestHarness.ts::holdNextWrite`. Which spec each goes in is the QA Engineer's call, likely beside its family's: `attached-children.spec.ts` for ATT-1.15, `item-create-cap.spec.ts` for ATT-10.9, and the board-switching specs for the two BCU cases. A helper that needs widening, such as `holdNextWrite` holding a read, is widened here.
  - **#6:** `tests/helpers/removeDatabasesReporter.ts` keeps the last error and names it in its warning. The retries and `onExit` are unchanged.
  - **#7:** `tests/helpers/dragGesture.ts` gains a move of exactly one pointer sample, or a step option on an existing move. `tests/ui/project-tree-drag.spec.ts`'s TREE-1.1 test calls it in place of `page.mouse.move`, with the same event sequence: one sample, then the immediate release.
  - **#8:** `tests/helpers/boardLocators.ts::itemRow`'s comment names the live, sortable rows, and excludes both the overlay copy and a Card's static Stub rows.
  - **Ride-along:** `tests/helpers/slots.ts`'s header drops the old E2E stack (decision 12).
  - **Tests:** each new test passes alone, repeated, and in its file's full run, and so does TREE-1.1's. A full run leaves no `test-N.db` files behind.
  - **The Test Reviewer:** one pass over every new case's tests, both the Vitest ones that 2a, 2b and 2d listed and 2e's Playwright ones, and over TREE-1.1's changed gesture.
  - **Code review:** `/code-review` at `medium`, since shared helpers change.
  - **Size and risk:** four new tests, about 200 lines across 3–4 specs. The harness fixes are about 15 lines across 3 helpers and 1 spec, plus 2 comments. Only the TREE-1.1 test uses the new move, and no existing test changes otherwise.
  - **Gate:** `check` and `test:e2e`.
- **2f. Root guidance (#10, and #11's line). Architect.**
  - **#10:** root `AGENTS.md`'s reindex paragraph says the board numbers the Sheet's answers as they land, with the reason in `workflow/AGENTS.md`. It also names what 2b added to an older answer's rule.
  - **#11:** `.claude/guides/testing-strategy.md`, "Running the tests": set the worker count with `E2E_WORKERS`, never `--workers` (decision 12).
  - **Gate:** `check`.

**Closing the story,** after the sub-batches:

1. **A confirming Reconciler run** over BCU-1.9, ATT-1.15, ATT-10.9, BCU-1.10 and TREE-1.1, spawned by the QA Engineer.
2. **The audit's close-out** (audit-workflow §9): the Close-out table, each row checked against the code. Nathan tags `f9fd73d7` as `story-10-checkpoint-audited`. The report moves to `docs/archive/`, and the scope folder is deleted.
3. **Sign-off:** this plan moves to `docs/archive/`.

## Code map

| File                                                                                                      | Batch  | Change                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-docs/extract.mts`                                                                          | 1      | `testDeclarations`, a sibling of `testTitles`: each test and `describe` with its skip, the `describe`s around it, and the ways a computed title opens |
| `scripts/check-docs/repoIndex.mts`                                                                        | 1      | Exports `CASE_ID` and `caseIdOfHeading`, which the catalog reader shares with the case-heading reading                                                |
| `scripts/report-catalog/catalog.mts`                                                                      | 1      | The catalog reader (Decision 3): ID, both statuses, Automation line, and the fields it could not read                                                 |
| `scripts/report-catalog/carriers.mts`                                                                     | 1      | Which files carry which case: a title's leading IDs, an ID on a `describe`, skipped carriers apart                                                    |
| `scripts/report-catalog/checks.mts`                                                                       | 1      | The four checks (Decision 4)                                                                                                                          |
| `scripts/report-catalog/report.mts`                                                                       | 1      | The report text: the checks, the totals, the ID-to-files map (Decision 5)                                                                             |
| `scripts/report-catalog/sources.mts`, `args.mts`, `main.mts`                                              | 1      | Reading the catalog and the three test roots from disk; `--out`; the command and its exit codes                                                       |
| Each of the above's tests, beside it                                                                      | 1      | New; `extract.test.mts` gains the `testDeclarations` cases                                                                                            |
| `package.json` (root)                                                                                     | 1      | The `report:catalog` command                                                                                                                          |
| `client/src/components/workflow/useBoardLoad.ts`                                                          | 2a, 2d | A failed load clears another board's (#1); a load during which an answer was applied, per the PO's ruling (#2)                                        |
| `client/src/components/ItemDetailPanel.tsx`                                                               | 2a     | `refreshDepths` applies only the latest read (#4)                                                                                                     |
| `client/src/components/workflow/itemWriteReconciliation.ts`, `useItemManagement.ts`                       | 2b, 2d | Workphase currency (decision 9); `useItemManagement.ts` says whether an answer was applied during a load (#2)                                         |
| `client/src/lib/positionedWrite.ts`                                                                       | 2b     | The which-write-set-this-row record, if 2b shares it (decision 9)                                                                                     |
| `client/src/components/workflow/useBoardDnd.ts`                                                           | 2b     | The Stub pickup comment (#9)                                                                                                                          |
| `scripts/check-docs/extract.mts`                                                                          | 2c     | `unfencedLines`'s closing fence (#5)                                                                                                                  |
| `server/vitest.config.ts`                                                                                 | 2c     | The `DB_PATH` comment                                                                                                                                 |
| Each of 2a–2d's tests                                                                                     | 2a–2d  | `useBoardLoad.test.ts`, `ItemDetailPanel.test.tsx`, the 2b record's tests, `extract.test.mts`, `catalog.test.mts`                                     |
| `tests/helpers/removeDatabasesReporter.ts`, `dragGesture.ts`, `boardLocators.ts`, `slots.ts`              | 2e     | The cleanup's error (#6), the one-sample move (#7), the row comment (#8), the slots header                                                            |
| `tests/ui/project-tree-drag.spec.ts`                                                                      | 2e     | TREE-1.1's move through the helper (#7)                                                                                                               |
| `tests/ui/`: likely `attached-children.spec.ts`, `item-create-cap.spec.ts`, and the board-switching specs | 2e     | The Playwright tests for BCU-1.9, ATT-1.15, ATT-10.9 and BCU-1.10 (decision 8)                                                                        |
| `AGENTS.md` (root), `.claude/guides/testing-strategy.md`                                                  | 2f     | Sheet answers' numbering (#10); `E2E_WORKERS`, never `--workers` (#11)                                                                                |

## Acceptance

1. One command prints the four checks, the ID-to-files map and the totals, and exits 0 whatever it finds.
2. On the tree at 4b's close, its totals and lost-coverage results match that close's reconciliation report, or each difference is explained.
3. A skipped test never counts as covering a case. An ID on a `describe` covers the tests inside it.
4. Unit tests cover each check, plus a skipped test carrying an ID, an ID on a `describe`, a `none — manual` line, and an Automation line whose path is missing.
5. `npm run check` fails on nothing new, and passes.
6. Each of the audit's required findings is fixed. Each fix's test is shown failing before it where it can be, and passing after.
7. `npm run check:docs` and `npm run report:catalog` read the tree as they did before 2c, or each difference is explained.
8. The audit closes: every required finding has its disposition in the Close-out table, checked against the code.

## Open questions

Check 4's assumption is confirmed in Amendments.

No open Planner question remains. Decision 10's case is BCU-1.10, listed in Scope.

## Handoff

- **Test Planner, 2026-11-10 — decision 10:** BCU-1.10 is written as P0 / Planned, from wiki boards-columns-unsorted §3 and board-drag-interaction §10, with Automation unconfirmed. It covers the older read arriving after an applied move answer on both a board switch and a same-board reload, plus the stopped-drag flash waiting through the read made again. Scope, 2d, 2e and the confirming reconciliation name the case. The PO clears the wiki's Planned marker after 2d; the Planner then moves the case to Open. Existing cases and their certifications are unchanged.

- **PO, 2026-11-10:** the board's read-versus-write rule (audit #2) is in wiki boards-columns-unsorted §3, as Planned. The Test Planner writes its case in the BCU-1 catalog and adds it to Scope. Nothing else in the wiki or the catalog changed: wiki project-tree §4, BCU-1.7 and BCU-1.8 stand as they are.

- **Test Planner, 2026-11-10:** decision 8 is answered by BCU-1.9, ATT-1.15 and ATT-10.9, all Open and scheduled in Scope. No existing case or certification changed. The Coder writes the tests in 2a/2b; internal coverage still needs the Test Reviewer and Nathan's approval before the Reconciler confirms it. The depth-pill display and same-board failed-reload preservation remain internal checks for the reasons in Scope. No wiki change is requested for these three cases; #2's PO question remains open.

- **Auditor, 2026-11-10:** the [Story 10 checkpoint audit](../../audits/code-quality-audit-story-10-checkpoint.md) covers the confirmed 29-commit range through `f9fd73d7`, including this command and the preceding app/harness changes. Required findings remain open; #5 is the shared Markdown fence-reader defect affecting this report. The audit does not close this story or change catalog certification. The PO question above precedes implementation of #2.

- **The Testing Roles Refactor:** the rewritten reconciler reads this report at a close and names its command.
- **The Test Planner's README pass,** in the same story: keep the fields this report reads in a fixed form.

## Amendments

- **2026-11-10 — Decision 10 case written (Test Planner).** BCU-1.10 answers the PO's handoff and the Planner's Open question. Its Planned status follows the new wiki passage; its case prerequisite for 2d is met. The case states the applied-write protection and the cue's visible outcome without prescribing callbacks or test files.

- **2026-11-10 — Audit #2 ruled: the board has the sidebar's guarantee (PO, a deduction for Nathan to overrule).** Wiki project-tree §4 already holds that a read begun before a write's answer was applied never undoes it, and its Why fits the board as it stands. Nathan also wants the project and item trees to behave alike. So the rule is recorded at wiki boards-columns-unsorted §3, as Planned, for every read of the board, a switch to another board included. It states the outcome, not the mechanism: decision 10's re-read stays the build.
  - **Where it lives:** on the board's page, beside §3's rule for the selected board, with a pointer to the sidebar's. Not on positioning §8, which is about order, where this covers a workphase or a parent too. If a third surface needs it, it moves to a shared page.
  - **If overruled:** #2 is rejected, with the ruling as its reason and a one-line comment at `useBoardLoad.ts` (audit-workflow §6, "A ruling is required until its site records it"), and the PO deletes the Planned passage.
  - **For 2d to confirm:** a read made again belongs to the same reload as far as the stop cue goes. Wiki board-drag-interaction §10 lets go of the flash "when another reload starts", so a re-read that did would lose the flash of a drag a failed write stopped, if another answer lands during that reload. The PO's reading is that the flash waits for the board finally drawn. The Architect confirms it in 2d, and the PO words §10 if it needs saying.

- **2026-11-10 — Decision 8 cases written (Test Planner).** All three defects have catalog cases, with separate IDs to preserve existing coverage claims. Scope and the 2a/2b test instructions name them. ATT-1.15 includes both response orders and the stale missing-workphase attention consequence. ATT-10.9 covers the settled control rule; placeholder depth-pill presentation remains an internal check.

- **2026-11-09 — Catalog fields confirmed (Test Planner, Testing Roles Refactor batch 4).** Check 4 is correct: the suite table's Status cell and the case's own `**Status:**` are the same status and change together. `docs/test-plans/README.md`, "Fields the coverage report reads", fixes the ID, case-line status, table status and Automation line forms; `Planned, replaces <ID>` is the sole status qualifier. This answers the Planner's Open question without changing any case, status or proposed report behavior. The script remains the Coder's work.

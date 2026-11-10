# Catalog Coverage Report

**Type:** tech-debt story. It adds a repo script and changes nothing the app does, so it closes by the gate and its own acceptance, with no audit of its own. Its commits fall in the next audit's range · **Written:** 2026-11-09 by the Architect, from the [testing roles round table](../round-tables/testing-roles.md) (Q10) · **Sequenced:** after the [Testing Roles Refactor](testing-roles-refactor.md)'s batch 3, so it's the first Coder work to run `/code-review` under the new instructions, and before Epic 3.5 Story 10's batch 4c starts · **Status:** planning, for Nathan's approval

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

## Decisions

Proposed, for Nathan's approval.

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

## Code map

| File                                                         | Batch | Change                                                                                                                                                |
| ------------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-docs/extract.mts`                             | 1     | `testDeclarations`, a sibling of `testTitles`: each test and `describe` with its skip, the `describe`s around it, and the ways a computed title opens |
| `scripts/check-docs/repoIndex.mts`                           | 1     | Exports `CASE_ID` and `caseIdOfHeading`, which the catalog reader shares with the case-heading reading                                                |
| `scripts/report-catalog/catalog.mts`                         | 1     | The catalog reader (Decision 3): ID, both statuses, Automation line, and the fields it could not read                                                 |
| `scripts/report-catalog/carriers.mts`                        | 1     | Which files carry which case: a title's leading IDs, an ID on a `describe`, skipped carriers apart                                                    |
| `scripts/report-catalog/checks.mts`                          | 1     | The four checks (Decision 4)                                                                                                                          |
| `scripts/report-catalog/report.mts`                          | 1     | The report text: the checks, the totals, the ID-to-files map (Decision 5)                                                                             |
| `scripts/report-catalog/sources.mts`, `args.mts`, `main.mts` | 1     | Reading the catalog and the three test roots from disk; `--out`; the command and its exit codes                                                       |
| Each of the above's tests, beside it                         | 1     | New; `extract.test.mts` gains the `testDeclarations` cases                                                                                            |
| `package.json` (root)                                        | 1     | The `report:catalog` command                                                                                                                          |

## Acceptance

1. One command prints the four checks, the ID-to-files map and the totals, and exits 0 whatever it finds.
2. On the tree at 4b's close, its totals and lost-coverage results match that close's reconciliation report, or each difference is explained.
3. A skipped test never counts as covering a case. An ID on a `describe` covers the tests inside it.
4. Unit tests cover each check, plus a skipped test carrying an ID, an ID on a `describe`, a `none — manual` line, and an Automation line whose path is missing.
5. `npm run check` fails on nothing new, and passes.

## Open questions

None for the Planner. Check 4's assumption is confirmed in Amendments.

## Handoff

- **The Testing Roles Refactor:** the rewritten reconciler reads this report at a close and names its command.
- **The Test Planner's README pass,** in the same story: keep the fields this report reads in a fixed form.

## Amendments

- **2026-11-09 — Catalog fields confirmed (Test Planner, Testing Roles Refactor batch 4).** Check 4 is correct: the suite table's Status cell and the case's own `**Status:**` are the same status and change together. `docs/test-plans/README.md`, "Fields the coverage report reads", fixes the ID, case-line status, table status and Automation line forms; `Planned, replaces <ID>` is the sole status qualifier. This answers the Planner's Open question without changing any case, status or proposed report behavior. The script remains the Coder's work.

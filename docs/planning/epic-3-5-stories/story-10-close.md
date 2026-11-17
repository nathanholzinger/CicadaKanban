# Epic 3.5 Story 10 — the close

**Type:** story plan, Story 10's third part · **Written:** 2026-11-17 by the Architect, from Phase 5 of [Story 10's plan](story-10-dnd-automation-catch-up.md) · **Status:** not started. Step 1, D8's attributes, is first

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D14) and the Living-docs handoff, and [Story 10's second part](story-10-batches.md) holds the batches, all closed. This doc holds Phase 5: the close's steps in order, the reconciliation's five slices, the close's list, the story's audit and its fix batches, and the close's Open questions. A change to a decision is amended in the plan, and a change to a step is amended here.

## The files

| File | Holds | Read by |
| --- | --- | --- |
| This doc | The steps, the slices and their Results, the close's list, the audit's fix batches and the Open questions | Every Phase 5 session |
| [Story 10's plan](story-10-dnd-automation-catch-up.md) | The Goal, D1–D14 and the Living-docs handoff | The audit's merge step, and each owner applying the handoff |
| [Batch 4h's file](story-10-batch-4h.md) | The open Test Reviewer verdicts on six cases, and the three DRAG-1.23 stamps | Slices 1 and 3, as their Review log |
| [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) | Where a case the close leaves open goes by default | The QA Engineer, when routing |

**A Phase 5 session reads** root `AGENTS.md`, its persona, this doc, and the cases, tests and wiki sections its step needs. A Reconciler reads only the inputs its definition fixes. The QA Engineer owns Results and the close's list here, and the Architect owns the audit's fix batches.

## The steps

In order, since each reads what the one before it produced (story-done checklist). Each session ends with a handoff to Nathan, and a green result doesn't start the next step.

1. **D8's attributes — a Coder session.** Delete each client `data-*` attribute no spec reads. `data-active-context` and `data-inversion-count` go unless a batch now reads them (D8). It's an app change, so it lands before the freeze, with `/code-review`, the gate and Nathan's check-in. Nathan names the files.
2. **The skips — the QA Engineer.** Every `test.skip`, `test.fixme` and `.skip(` left in `tests/` and the unit suites must be one that Drag Automation Deferrals names (D10). Any other goes to Nathan before the freeze, to fix, delete or record there.
3. **Validation and the freeze — the QA Engineer.** `npm run check`, then `npm run test:e2e` green twice in a row, all on one tree. Freeze that tree's ID, and run `npm run report:catalog` on it. Long commands run in the background, each with a named JSON report. Anything that changes app source, a test or a helper after the freeze stops before the slices: record it, say which evidence still holds, and return to Nathan.
4. **The reconciliation — the QA Engineer spawns five Reconcilers,** one per slice, on the frozen tree (The reconciliation, below). It then checks the title-only diff, records each slice in Results, and routes what the slices leave open.
5. **The close's list (D10) — the QA Engineer,** from the catalog after the slices (The close's list, below).
6. **The coverage goal — the QA Engineer.** Run `test:coverage` in `client/` and in `server/` on the frozen tree, and record the totals against the 80% goal, with the reason for any shortfall (epic-done checklist). It changes no code.
7. **A stop for Nathan's review and commit.**
8. **The story's audit — the Architect** (`.claude/guides/audit-workflow.md`). Its range starts at `story-10-checkpoint-audited`, the newest `*-audited` tag (Nathan, 2026-11-17). [The checkpoint audit](../../audits/code-quality-audit-story-10-checkpoint.md) already read the Story 8 close-out's fixes and this story through batch 4b, app and E2E specs alike. So this one reads what came after:
   - the rest of the checkpoint audit's fix batches;
   - batches 4c to 4h, their app changes and their drag specs;
   - **batch 4a's seven production files, against the wiki**, outside the range (Nathan, 2026-11-17, in place of a separate Architect review). The checkpoint audit read them for code quality, not for whether they follow the rules they cite. [4a's retrospective](../../audits/story-10-batch-4a-workload-retrospective.md) lists the files and their paired regressions. The check is DRAG-1.5's saved and visible placement and the DRAG-1.16 and DRAG-3.19 readings, with the PO asked where a reading is in doubt.

   Its merge step reads this doc, the plan and the five slices' reports. Its Fix Now findings go in Audit fix batches, below, and each batch ends with `/code-review`, the gate and a stop for review and commit. A batch that changes a case's behavior or its tests gets its Playwright tests updated by the QA Engineer, with a Test Reviewer pass, and then a confirming Reconciler run over just the cases it touched. Nathan tags the end commit `epic-3-5-story-10-audited`.
9. **Sign-off — Nathan,** on the story-done checklist's "Before sign-off". Each owner has applied the plan's Living-docs handoff. The plan and its parts (this doc, the batch index, the batch files, the 4a to 4d log and the proof plans), the audit and the Reconciler reports move to `docs/archive/`.
10. **The epic-wide audit** follows, as the epic's, on the scope settled for it (Open questions).

**Already done:** D13 is in the living docs. The testing guide's part landed on 2026-11-13 (D13), and the test-plans README's through the [MVP test-process trim](../tech-debt-stories/mvp-test-process-trim.md)'s handoff the same day.

## The reconciliation

**Five slices, not one run (Nathan, 2026-11-17).** One Reconciler over the whole story would take about 300 cases and the tests that carry them, 33 changed E2E specs among them, about 16,000 lines. Each batch's Reconciler took 12 to 34 cases. So each family a batch confirmed before later batches touched its tests gets a slice, about a batch in size. DRAG-2, DRAG-8 and ATT-4.9 (batches 4e and 4f) and the TREE cases (4g) get none. Their tests haven't changed since their own batches' Reconcilers confirmed them, so those reports stand, and the coverage report still checks them.

| Slice | The cases it confirms | Its Review log | Last confirmed by |
| --- | --- | --- | --- |
| 1 | DRAG-1's 33 | 4h's verdicts on DRAG-1.2, 1.12, 1.22, 1.23 and 1.24, its proposed DRAG-1.23 mappings, and its Living-docs handoff (the three DRAG-1.23 stamps) | 4a, 2026-11-08; 4h changed its tests since |
| 2 | DRAG-3's 23, TC-6.4, BCU-5.6 and BCU-5.7 | None open | 4a |
| 3 | DRAG-4's 24 and DRAG-5's 11 | 4h's verdict on DRAG-4.23 | 4b, 2026-11-09 |
| 4 | DRAG-6's 28 | None open | 4d, 2026-11-13 |
| 5 | DRAG-7's 34 | None open | 4c, 2026-11-12; 4f reopened seven and 4g rechecked DRAG-7.10 |

**How they run:**

- **One frozen tree.** All five run on step 3's tree, from its green run's record and its coverage report.
- **Each slice is a scope this plan names,** with the Reconciler's fixed inputs: its row above as its Scope, its Review log, the coverage report, the green run's record and the range's diffs. Its report is `docs/audits/test-reconciliation-story-10-close-slice-<N>.md`.
- **The range** runs from `bb7633cf`, the commit before Phase 1, to the frozen tree. The QA Engineer filters each slice's diffs to its own catalog files and the test files that carry its IDs. Unfiltered, the range would bring in cases from other work done in the same weeks: the Testing Roles Refactor, the parallel E2E workers, the catalog coverage report and the checkpoint audit's fixes.
- **A slice writes only its own cases.** A case from another slice that its tests also carry is that slice's to judge. A case in no slice isn't judged again.
- **The coverage report's findings:** each slice acts on the ones for its own cases. Slice 2, which already reaches past the DRAG catalog, also acts on the ones for cases in no slice, so no finding is acted on twice.
- **One wave of five,** in parallel. Two slices can share a test file, so the QA Engineer checks the title-only diff after all five finish.
- **Earlier verdicts stay answered.** Each batch's Reconciler answered its own batch's verdicts, and its report is the record. A slice confirms its cases from the tests as they stand, not from those reports. Only 4h's verdicts are open.
- **What a slice can't confirm** goes `Open`, with the part it misses named. The QA Engineer records it in Drag Automation Deferrals, one line with the case ID and the slice, unless Nathan pulls it forward. A fix pulled forward changes a test, so the gate and the full suite run again, and that slice's Reconciler is then continued to confirm only it.
- **Nathan's approvals** of mappings and `Manual` proposals go to one follow-up per slice that needs it, sent to that slice's Reconciler.

## Results

The QA Engineer's. One row per slice, replaced as it changes; the reports hold the detail.

**Frozen tree:** — · **Green runs:** — · **Coverage report:** — · **Coverage goal:** —

| Slice | Report | Status changes | Waiting on Nathan | Routed |
| --- | --- | --- | --- | --- |
| 1 | — | — | — | — |
| 2 | — | — | — | — |
| 3 | — | — | — | — |
| 4 | — | — | — | — |
| 5 | — | — | — | — |

## The close's list (D10)

Not written yet. After the slices, the QA Engineer lists every case in `docs/test-plans/` that isn't `Automated` or `Manual`: its status, why it's still open, and the plan that names it by ID. A case no later plan fits gets a tech-debt story, which the Architect writes before the close (D10).

## Audit fix batches

Not written yet. The Architect writes them after the audit (`.claude/guides/audit-workflow.md`, "Working Fix Now"), and a Coder session works each one.

## Open questions

- **For the PO: the sidebar drag before the project cap is read.** The baseline report's Candidate New Cases notes it. `useProjectDragReorder.test.ts`'s "marks nothing invalid while the cap is unknown" pins permissive behaviour, which neither wiki project-tree §3 nor hierarchy-placement §6 settles. No case exists for it, so D10 doesn't hold the close up for it. The story-done checklist allows no Open question still waiting on the PO at sign-off, though, so it's settled or routed by then: a PO ruling, a deferral to [MVP Deferrals](../mvp-deferrals.md), or leaving it as shipped, with no rule.
- **For Nathan and the Architect, separately: the epic-wide audit's scope** (Nathan, 2026-11-06). It doesn't hold up this story's close. Nathan's starting points:
  - **Choose the files, don't take the range.** audit-workflow §10's range, from the previous `epic-N-complete` tag, would take in nearly the whole repo, since the mid-epic refactors touched nearly everything. So it's scoped to the most important files, chosen the way the close-out audit chose its own.
  - **Weigh the cost against what it would find.** This story is mostly test files. So much of an epic-wide audit right after it would re-read code the close-out audit read in full, little changed since.

  This story's audit now starts at the checkpoint tag (step 8). Whether the epic-wide audit takes it in is still part of this question.

## Amendments

- **2026-11-17 — Written (Nathan, the Architect).** Phase 5 moved here from the plan, with three changes Nathan made that day: the reconciliation runs as five slices; 4h's reconciliation joins slices 1 and 3, since 4h ran no Stop 4 of its own; and the audit's range starts at `story-10-checkpoint-audited`, with 4a's production files checked against the wiki outside it. The plan's two remaining Open questions moved here too.

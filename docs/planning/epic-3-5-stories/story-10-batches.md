# Epic 3.5 Story 10 — the inventory and the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation · **Status:** Phases 2–3 and batches 4a–4b are committed; 4b is `857720b9`. All 26 cases in 4b are Automated, with 1,400 repeat passes, final E2E 394 passed / 21 existing skips / zero failed and root gate green. The remaining batches use the Testing Roles Refactor's workflow below. Batch 4c has not started and waits for the catalog coverage report and parallel-runner work. Conditional DRAG-3.12 stays separately recorded and nonblocking; DRAG-4.35 stays retired.

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D13), Phases 1–3 and Phase 5. This doc holds the part that grows while the work runs: each Open case's batch and how it closes, each skip's fate, the checkpoint after 4a, and each batch's results. A change to a decision is amended in the plan. A change to a case's route is amended here.

**Execution boundary for 4c–4j:** Nathan opens a QA Engineer session for each stop and names its file list. The QA Engineer owns automation, its Results and the Review log; it may spawn the Planner desk, Test Reviewer and end-of-batch Reconciler. The Planner owns case decisions, remains code-blind and spawns none of them. Hooks and test routes are bundled into one separate Coder session per stop, with Nathan's check-in at its return; a behavior change still gets its own handoff. The QA Engineer shares Vitest work under D12's limits and never edits app source. D7/D12 in the main plan govern this boundary. Case assignments and batch order are unchanged. D2's bar is ten repeats from 4c on (D2, amended 2026-11-11); 4a and 4b ran twenty. Once the parallel runner lands, D2's repeats and each batch's final full run use its adopted worker count (D2, amended 2026-11-09). A flaky test that predates a batch is skipped and moved to 4i, and a batch's own failing test gets up to two fix attempts when the failure is false, then a report (D2, amended 2026-11-12).

## How to read it

- **The report owns what each case misses.** The [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping gives each Open case's ID-bearing tests and the exact clauses they miss. This doc routes the case and doesn't restate the clauses, so a batch's brief starts from the report's row. D13's current catalog wording supersedes the baseline's paint obligations: those now belong to the shared Manual cases below. Saved outcomes, target/state selection, positions and sizes still belong to the automated cases. Once a batch has run, its confirming run's report is the later word for its cases.
- **The roadmap entry's items** (1–11) reach this doc by case, through the report, which read every case they route. Their non-case items are D3's, D4's and D8's.
- **Every case ends `Automated` by a surface test,** a Playwright test written by the QA Engineer, unless its batch's notes say otherwise. A Split case's look ends `Manual`, in a shared case (D13).
- **The kinds of work:**

  | Kind   | Means                                                                                                                                                   | Writer                    |
  | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
  | Extend | A running test that carries the ID gets the clause it misses, or a running test takes the ID                                                            | QA Engineer               |
  | New    | A new test, usually a gesture                                                                                                                           | QA Engineer               |
  | Rework | A skipped spec, reworked to its case as it now reads (D3)                                                                                               | QA Engineer               |
  | Split  | The Planner rewords the case to the part a test can pin, and moves its look to a shared `Manual` case (D13). The pinned part is then an Extend or a New | Planner, then QA Engineer |
  | Coder  | A Vitest test, a test hook or a fix (D7, D12)                                                                                                           | Coder                     |

- **No request, or exactly one:** many *Then*s say so, and the request harness checks it (D4). Saved fields alone don't prove it (the report's Test Quality Concerns, #5).

## The five stops for each remaining batch

These rules apply to 4c–4j under the [Testing Roles Refactor](../tech-debt-stories/testing-roles-refactor.md), decisions 1–16. Batches 4a–4b ran under the prior roles; their committed reports retain that history. **One session per applicable numbered stop, ending with a concrete handoff to Nathan. A green result does not automatically start the next stop.** Nathan names the session's file list and directs the next stage. A checkpoint does not require a commit. Stop 3 is conditional on Coder work being needed; the other stops still apply.

### Stop 1 — Proof and variant review

The QA Engineer establishes what the batch must prove before broad test authoring:

- list the assigned case IDs and the exact missing clauses from the current cases and Reconciler report;
- describe the observable proof from the case/wiki, including requests, saved results, state and geometry where required;
- list the scenario matrix and expected expanded runnable-variant count, distinguishing catalog cases, authored tests and parameterized variants;
- name what proves each clause: a surface gesture, a surface test with no gesture, an internal test or a check by hand. Flag each clause that shows a cost signal, with the three questions answered and an option recommended (`.claude/guides/testing-strategy.md`, "When a surface test costs more than it proves"; the QA Engineer persona's "Weighing a Surface Test");
- for a case whose matrix would expand past six gesture variants, propose a split: the gestures that stay at the surface, and the variants an internal test would carry. Six is a starting number, and Nathan may keep the full matrix;
- identify helper/fixture needs, representative observations to check, known Coder dependencies and questions for the Planner or PO.

Use the read-only Planner desk for reading questions, asked from the case rather than the app. Record the questions and replies word for word in the Review log, with the quoted Then. Continue the same desk agent for a follow-up within the task. Rewording, a Split, a Pending PO question or a Manual call requires a Planner session Nathan opens; a rule gap goes to the PO through Open questions.

**Deliverable:** a proof/variant plan, Nathan's decision on each flagged clause and proposed split, and his explicit implementation file list for Stop 2. A new helper or observation is checked on a representative scenario before its matrix is expanded. New case scope or a rule ambiguity goes to its owner rather than silently joining the batch. Run the gate before the check-in.

### Stop 2 — Tests and discovery

The QA Engineer writes or extends tests and support against a named app tree. It works one matrix family at a time, rewrites the current Results packet after each family, and runs focused checks to establish the scenarios. Every test asserts its Given before its When, and each observation helper's header says whether it reads the screen or an app-provided attribute. Each added/changed test passes alone and in its file's full run. A second correction to one test's aim or timing stops work on that test and reopens its layer question in Results; a third waits for Nathan (the persona's "Weighing a Surface Test"). A failing test the batch added or changed gets at most two fix attempts when the failure is false, and then a report with what is known about why; a flaky test that predates the batch is skipped and moved to 4i (D2, amended 2026-11-12).

Before the check-in, it spawns the Test Reviewer for its tests and the Coder's listed ID-bearing Vitest assertion/setup changes. The brief names the cases, tests and changed files since the last pass; every correction after a red run is shown before-and-after, without justification. The reviewer widens to every ID in changed files. Record every verdict word for word in the Review log. Test gaps go to the QA Engineer, case gaps to a Planner session and rule gaps to the PO. The reviewer's cost notes go to Nathan in Results, with the QA Engineer's recommendation, and change no test until he decides. A Reconciler run is not part of this stop.

**Deliverable:** tests/helpers, focused results, actual variant count, reviewer verdicts and a consolidated defect/hook/question handoff. Each failing case states its expected wiki-backed clause, actual surface result, reproducer and saved evidence; it may name where diagnosis looked, never prescribe the fix. Preserve failing assertions; never edit a test to make it pass. No app source changes here. A new Vitest test is only for a held-off case after the reviewer's internal-coverage verdict and Nathan's approval, from the Then. The full D2 sweep waits for Stop 4. Run the gate, and `/code-review` at `medium` on changed shared test infrastructure, recording findings and actions in Results; correctness fixes stay in the batch, cleanup suggestions are notes.

If a Coder dependency blocks an earlier stage, hand it off when found; every test needn't be finished first. Held-off cases remain Open and explicit in Results. The Test Reviewer weighs internal coverage before Nathan decides; a Manual decision is applied in a Planner session or by the Reconciler at the close. The QA Engineer never proposes or sets Manual.

### Stop 3 — Separate Coder and review

Nathan routes one separate Coder session per stop, carrying that stop's hooks and test routes. A behavior change still gets its own handoff. The QA Engineer does not spawn a Coder. A defect handoff names the failing case/wiki clause, expected and observed surface results, reproducer and assertions that must remain intact; it never prescribes a fix. Nathan names the file list. Approved title stamps and permitted Vitest work can be done by the QA Engineer under D12, without a Coder handoff solely for those edits.

**Deliverable:** the Coder's return with start/end tree IDs, changed behavior/files, paired regression evidence, validation and `/code-review` record, followed by Nathan's check-in before automation resumes. The return lists ID-bearing Vitest tests whose assertions or setup changed, for the QA Engineer's Test Reviewer pass; renames/imports alone don't need it. Rerun the original failing surface test unchanged first. Case or rule changes go separately to their owner. Complete unfinished authoring, focused validation and reviewer answers before the freeze. If no Coder work is needed, record Stop 3 as not needed.

### Stop 4 — Frozen validation

The QA Engineer freezes the accepted tree ID, exact runnable selection and expanded variant count. Use the temporary-index method in `.claude/guides/testing-strategy.md`, "A snapshot of the tree": untracked files count and the real index stays untouched. Tree IDs replace per-file fingerprints. The QA Engineer stamps its Playwright tests and approved Vitest mappings before the freeze, checks title-only diffs and runs `check:docs`.

- apply D2's ten repeats to every added/changed drag test, with retries and every failed attempt disclosed;
- run the final full E2E suite and root gate sequentially after the repeat requirement is met;
- run long commands in the background with a named JSON report per repeat batch as the ledger; recover completed records before restarting anything after an interruption;
- retain exact selections, per-variant results, tree IDs, command exits and interruption/continuation accounting so another session can inspect completion without reconstructing the chat;
- a flaky test that predates the batch is skipped and moved to 4i (D2, amended 2026-11-12). The skip is a test change, so it ends the frozen pass: record it, explain which earlier evidence remains valid, and rerun the full suite and the gate on the new tree;
- keep authoring and repair outside this stop. A proposed app, test, helper or expected-assertion change ends the frozen pass and returns to the relevant handoff. Explain which earlier evidence remains valid before rerunning it.

**Deliverable:** the repeat ledger, final suite JSON and gate log paths, tree ID and any unresolved failure packet. Separate delivery waits from execution results. Read the reports rather than reconstructing progress from chat. Until the runner story lands, D2 runs on the current runner. Once it lands, D2's repeats and the final full run use its adopted worker count (D2). 4a and 4b's one-worker evidence stands, and isn't re-earned.

### Stop 5 — Reconciliation and closure

The QA Engineer spawns the Reconciler once, cold, at the batch's close. Its brief contains only the fixed inputs in `.claude/agents/test-reconciler.md`: plan Scope and Review log; `npm run report:catalog` output on the green run's tree; that run's record, tree ID and JSON paths; and the range's test/catalog diffs. Nathan's approvals may follow. The Reconciler reads the cases, cited wiki and tests itself, confirms whole-Then coverage, answers every open log verdict and acts on the report's global findings. It diagnoses no failure and rebuilds no runtime evidence, hashes or write masks.

**Deliverable:** the confirming report, permitted catalog updates, newly found title stamps, remaining gaps/proposals and a compact close-out in Results. Check stamps with title-only diffs and `check:docs`; compare frozen test lists with ID prefixes stripped. Record cases closed by kind, authored/expanded counts, helpers, Coder handoffs, cost and what remains. Only the Reconciler confirms Automated and writes Automation fields; an approved Manual call may also be applied by the Planner. Adjacent findings stay separately routed and don't silently widen the batch. Run the gate and end at Nathan's review/commit; don't start the next batch automatically.

### Resume packet at every stop

The QA Engineer replaces this doc's Results with one current packet, after each matrix family and at each stop or interruption. It holds the batch/stop; tree ID; each case's state (authored, red at a clause, held off or unauthored); Open questions; Nathan's file list; next owner/action and command; JSON report paths; and the tree ID at the last reviewer pass. Mark unrun checks explicitly. Git and named reports hold prior packets. The Review log is separate and append-only, so replacing Results never removes a question, reply, verdict or declined mapping.

## The batches

Each batch's cases are below in run order, which D5 sets: a later batch reuses an earlier one's setups.

- 4a builds the column, done-column, Unsorted and Descendants setups.
- 4b builds the zoom and Stub setups, and 4c the modal's.
- 4d's forced stops need all three.
- 4e and 4f check the carried branch and the tiers across every layer.
- 4g is the sidebar's own.

| Batch                                       | Extend | New | Rework | Split | Coder | Cases |
| ------------------------------------------- | -----: | --: | -----: | ----: | ----: | ----: |
| 4a. DRAG-1, DRAG-3, TC-6.4, BCU-5.6 and 5.7 |     10 |  22 |      0 |     2 |     0 |    34 |
| 4b. DRAG-4 and DRAG-5                       |      4 |  20 |      2 |     0 |     0 |    26 |
| 4c. DRAG-7                                  |      2 |   3 |      9 |     1 |     0 |    15 |
| 4d. DRAG-6                                  |      0 |  12 |      0 |     5 |     0 |    17 |
| 4e. DRAG-8                                  |      0 |  11 |      0 |     1 |     0 |    12 |
| 4f. DRAG-2 and ATT-4.9                      |      4 |   1 |      0 |     9 |     0 |    14 |
| 4g. TREE                                    |      7 |  18 |      1 |     6 |     1 |    33 |
| 4h. The six legacy skips                    |      — |   — |      — |     — |     — |     0 |
| 4i. Returned work, and a cost study         |      — |   — |      — |     — |     — |     0 |
| 4j. Deferred from 4c's close                |      — |   — |      — |     — |     — |     0 |
| **All**                                     |     27 |  87 |     12 |    24 |     1 |   151 |

The Coder column counts cases closed by Coder work alone. A batch's notes name the Coder halves of other cases. Step 5 assigned 152 Open cases; Nathan's later retirement of DRAG-4.35 leaves 151 active assignments. Batches 4a and 4b close 60 of them (34 and 26), leaving 91 still Open. DRAG-1.27 and TREE-2.8 are now shared Manual cases rather than automation assignments; the three new Manual IDs are listed under The shared looks. The 26 original Split IDs are all retained.

4h, 4i and 4j hold returned or deferred work, not new assignments. 4i, added 2026-11-12, takes DRAG-3.16 from 4h, DRAG-5.3 and DRAG-5.10's B21 test from 4b and DRAG-7.18 from 4c. Those stay counted in their original batches' rows above, which are the historical assignments; 4c's row therefore closes 14 of its 15, and 4b's DRAG-5.3 and DRAG-5.10 wait on 4i.

A zero in that historical Coder column does not mean a batch will find no product defect or need no hook. Every such discovery now reaches Nathan through the separate handoff above; the batch table does not authorize production edits.

### 4a. DRAG-1 and DRAG-3, with TC-6.4 and BCU-5.6 and 5.7

**Specs:** the DRAG-1 and DRAG-3 specs Phase 3 splits out of `drag-column-bands.spec.ts` (D4), `item-positioning.spec.ts` for TC-6.4, and new specs.

| Kind   | Cases                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Extend | DRAG-1.3, 1.9, 1.12, 1.24; DRAG-3.9, 3.10, 3.11, 3.17, 3.18; TC-6.4                                                                        |
| New    | DRAG-1.1, 1.2, 1.5, 1.6, 1.13, 1.16, 1.17, 1.18, 1.20, 1.22, 1.28, 1.33, 1.35, 1.36; DRAG-3.12, 3.16, 3.19, 3.20, 3.23, 3.24; BCU-5.6, 5.7 |
| Split  | DRAG-1.26, 3.22                                                                                                                            |

- **DRAG-1.14 and DRAG-3.25 go to 4c,** since what each misses is the modal's.
- **DRAG-1.18 and 1.20** seed their thresholds with `seedDragTuning` and never assert a duration (`.claude/guides/testing-strategy.md`, "What stays manual").
- **DRAG-1.28:** the new test asserts the copy's clamps through the surface, so the geometry mapping isn't needed (Approvals).
- **DRAG-3.9 and 3.10:** the single band shows as no divider (`data-carve-divider`) and the same release at several aims, so neither the `dragBands.test.ts` mappings nor `dragRequest.test.ts`'s DRAG-3.9 stamp is needed.
- **DRAG-3.17 and 3.19** measure their heights with `dragGesture.ts::boxOf` (D13: sizes stay automated).
- **DRAG-3.22:** the held shadow is its look. The form switching (`data-drag-overlay-form`), the pointer's continuity and the heights are automated.
- **DRAG-1.26:** exactly one current context is marked active, read from `data-active-context`. Its outline colour is the look, so D8 keeps the attribute. **DRAG-1.27** is the shared Manual case for the carried copy's tilt/held shadow and the outline colour; it needs no automation assignment.
- **BCU-5.6 and 5.7** are here because their filing gesture is DRAG-1.13's Unsorted pickup.
  - Deleting the workphase puts the items in Unknown status, as TC-2.16's test does. If that can't set up the case, the Coder adds a test route.
  - The new tests cover the D11 hook and cascade candidates, so neither mapping is needed.
- **Then the checkpoint** (below).

### 4b. DRAG-4 and DRAG-5

**Specs:** `drag-card-zoom-in.spec.ts`, whose two skips become one parameterized spec (item 7), with own-column proof under DRAG-4.1 and cross-column proof under DRAG-4.15; `drag-5-stub-detach.spec.ts`, with DRAG-5.13's skip and its row-button re-rolls (D4); and new specs. The [Stop 1 proof/variant plan](story-10-batch-4b-proof-plan.md) records the exact proposed authoring scope and observations to check before expanding it.

| Kind   | Cases                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Extend | DRAG-5.1, 5.4, 5.10, 5.16                                                                                                 |
| New    | DRAG-4.1, 4.3, 4.5, 4.8, 4.12, 4.13, 4.17, 4.19, 4.20, 4.21, 4.22, 4.30, 4.32, 4.33, 4.34; DRAG-5.2, 5.3, 5.9, 5.14, 5.15 |
| Rework | DRAG-4.15, 5.13                                                                                                           |

- **`tabBy`** drives DRAG-4.13, 4.32, 4.33 and 5.9 (item 4).
- **DRAG-4.20 and 4.22's clock logic** is in the approved clock category: what runs before the cue, and what resets it.
  - The Coder adds their IDs to `popSession.test.ts`'s clock tests (the report's Proposed Stamps), and writes any that are missing.
  - The surface tests assert the cue's phases in order (`data-drag-zoom-phase`) with seeded thresholds.
- **DRAG-4.32's case leaves the cue's style open,** so `data-placement-valid` and `data-drop-invalid` close it.
- **DRAG-4.12:** the new test covers the `KanbanCard.test.tsx` candidate, so that mapping isn't needed.
- **DRAG-4.5's quick-versus-held contrast** is what 4h re-derives the legacy six against.
- **DRAG-5.2 and 5.4** check one write and its body: no workphase field for 5.2, and nothing written on the way out for 5.4.

### 4c. DRAG-7

**Specs:** `drag-7-hierarchy-modal.spec.ts` (6 skips), `drag-7-modal-hold.spec.ts` (6) and `drag-7-overflow-row.spec.ts` (1).

**First, the traces** (item 8, Inbound deferrals): DRAG-7.17's, and the seven specs that fail in the full run, DRAG-7.9's and 7.32's skipped ones among them. Nothing new is written in this suite until they're done.

**Accepted runner-trial follow-up (Nathan, 2026-11-10): DRAG-7.10.** Fix the active “a pop out of the modal, past the Card’s box…” test in this batch. On the frozen three-worker trial it failed in two of three full runs because the expected containing-column context never appeared; one of five contention copies reached release but left the item attached. The one-/two-worker comparisons passed. Keep both observed failure modes in the discovery handoff; the cause is unresolved and the assertions remain intact. Evidence: `tests/output/parallel-workers-batch3/full-3w-2.json`, `full-3w-3.json`, `drag-3w-repeat5.json`, and the [runner report](../tech-debt-stories/e2e-parallel-workers.md). The known failure is accepted for runner adoption, not for this batch's closure: the completed rework must meet D2 at the adopted five workers.

| Kind   | Cases                                                   |
| ------ | ------------------------------------------------------- |
| Extend | DRAG-7.28; DRAG-1.14                                    |
| New    | DRAG-7.13, 7.31; DRAG-3.25                              |
| Rework | DRAG-7.6, 7.9, 7.10, 7.14, 7.15, 7.17, 7.18, 7.27, 7.32 |
| Split  | DRAG-7.12, its skip reworked to the tier attributes     |

- **DRAG-7.18 moved to 4i (Nathan, 2026-11-12).** Its two tests were authored here and passed D2, then skipped for their cost. Batch 4i holds the case and the cost study.
- **DRAG-7.28:** add its ID to DRAG-7.9's first-child test, which saves `R2` before `R1a` (the report's Proposed Stamps).
- **DRAG-7.10 (8.13 audit #8):** the Coder moves the two excursions' reset into a `popSession.test.ts` clock test. The Planner's 2026-11-12 answer below adds the reset to DRAG-7.10's Then, so the clock test carries DRAG-7.10. The spec keeps reachability and the write, with thresholds from `seedDragTuning`.
- **DRAG-7.15 and 7.27's aims:** see the roadmap entry's item 10, "From Story 8.3". The gap below `R`'s overflow row is drawn for an aim in the overflow row's band. The one-step spec aims at `R`'s row center. The overflow-row top-quarter aim's "no hold runs" expectation is dropped by the Planner's 2026-11-12 answer below: the hold runs when the ghost is beside the overflow row at its level.
- **DRAG-7.32** gets its screen-place check when it's reworked (Inbound deferrals).
- **DRAG-3.25** is here for the modal's and the backdrop's rows. Its heights are measured with `boxOf`.
- **#10, the Sheet tests' own spec,** is optional. This batch decides.

### 4d. DRAG-6

**Specs:** the DRAG-6 spec Phase 3 splits out of `drag-column-bands.spec.ts` (D4), and new specs.

| Kind  | Cases                                                                    |
| ----- | ------------------------------------------------------------------------ |
| New   | DRAG-6.7, 6.8, 6.9, 6.15, 6.16, 6.17, 6.18, 6.21, 6.22, 6.25, 6.27, 6.28 |
| Split | DRAG-6.19, 6.20, 6.23, 6.24, 6.26                                        |

- **It comes after 4b and 4c,** since the flash and the hidden-row cases (DRAG-6.20, 6.21 and 6.28) need their Stub, section and modal setups.
- **Each stop has a genuine cause,** from Phase 3's cause helper (D4): a refused drop, a stale response with reindex pairs, or a refused column reorder. The armed stop stands in for none of them. A case that names all three runs once per cause.
- **D9's surface spec is written here,** with DRAG-6.22 and 6.25.
- **DRAG-6.26:** the new tests cover Phase 1's hook and component candidates, so those mappings aren't needed.
- **DRAG-6.27:** the flash's window is automated with `data-stop-flash`. DRAG-6.20 holds the target-row state; DRAG-6.30 holds the painted pulses and banner fade. DRAG-6.23 and DRAG-6.24 hold pending-state ownership, with the painted pulse in DRAG-6.31.
- **None of these cases needs a tuned duration or the final look** (the roadmap entry's item 10, "From Story 8.4").

### 4e. DRAG-8

**Specs:** a new spec, since DRAG-8 has none.

| Kind  | Cases                                                         |
| ----- | ------------------------------------------------------------- |
| New   | DRAG-8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12 |
| Split | DRAG-8.2                                                      |

- **One setup for most of them:** the five-row branch with its Free-linked rows. The branch's absence is read from `data-carried-branch`, and its counts as text.
- **DRAG-8.7** uses the cause helper.
- **DRAG-8.10** measures its boxes with `boxOf`, and proves the line lets the pointer through by hovering a row it covers.

### 4f. DRAG-2 and ATT-4.9

**Specs:** `drag-target-classification.spec.ts`.

| Kind   | Cases                                                     |
| ------ | --------------------------------------------------------- |
| Extend | DRAG-2.4, 2.8, 2.22; ATT-4.9                              |
| New    | DRAG-2.12                                                 |
| Split  | DRAG-2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20, 2.21, 2.23 |

- **It comes after 4e,** since DRAG-2.17–2.19 check tiers across pop-out, zoom, the modal and the carried branch.
- **The tiers are read from `data-drop-tier`.** Each Split case's look is the board's tiers (D13).
- **ATT-4.9 is A3's option (a):** each target the spec classifies is replayed against the move endpoint, each from the same starting state.

### 4g. TREE

**Specs:** `project-tree-drag.spec.ts`, with TREE-1.4's and TREE-2.1's skips; `project-sidebar.spec.ts`, `project-tree-sidebar.spec.ts` and `project-tree-expansion.spec.ts`; `useProjectCollection.test.ts` for TREE-9.4.

| Kind   | Cases                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| Extend | TREE-1.8, 1.11, 1.12; TREE-2.2, 2.3; TREE-4.7; TREE-11.7                                                              |
| New    | TREE-1.2, 1.5, 1.6, 1.10, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19; TREE-2.10, 2.11, 2.12, 2.13; TREE-4.9, 4.11, 4.15 |
| Rework | TREE-1.4                                                                                                              |
| Split  | TREE-2.1, its skip reworked; TREE-2.4, 2.5, 2.6, 2.7, 2.14                                                            |
| Coder  | TREE-9.4                                                                                                              |

- **TREE-1.14** starts with the Coder's fix: leave out the held rows only, not their children (Inbound deferrals). The depths a gap beside `Y` offers are a behaviour question. If the wiki doesn't settle them, they go to the PO (D6).
- **TREE-9.4:** the Coder fixes its fixture and expected outcome. `X`, already saved in the deleted subtree, is deleted with it and stays absent. Each of the variants with several answers rechecks `Q` and that nothing else was written. If the confirming run still finds no fresh read, a surface test follows.
- **TREE-2.2, 2.3, 4.7 and 4.15** hold the answer with `holdRequests.ts`.
- **TREE-1.19, the shuffle under a still cursor,** is the likeliest to miss D2's bar. If it does, the Planner checks the case's wording before anyone proposes `Manual`.
- **TREE-2.13** measures both the line's top-edge position and its start in the ghost name's column with `boxOf`. Name-column alignment is geometry under D13 and stays automated; only the line's painted strength is Manual.
- **TREE-2.8** is the shared Manual sidebar appearance case; the remaining Split cases keep tier, ghost and line state, branch presence, saved outcomes and geometry. TREE-2.13 keeps its top-edge and name-column measurements; its painted line strength is TREE-2.8's.
- **TREE-2.1's skip** carries #12 from the 8.8, 8.11 and 8.12 audit: its title and reason say "dimmed", so both are replaced (Inbound deferrals).
- **TREE-1.8, 1.11, 1.12, 1.14, 1.19, 2.12, 2.14, 4.9 and 11.7:** the new or extended surface tests cover their App, hook and component candidates, so none of those mappings is needed.
- **The copy's hold, pixel step, styling and glide** are wiki Open questions, not gaps (the roadmap entry's item 10, "From Story 8.12").

### 4h. The six legacy skips

**DRAG-3.16 moved to 4i (Nathan, 2026-11-12).** It was restored here on 2026-11-10; its text is now in 4i.

The six legacy skips carry no catalog IDs. Their separate disposition remains as item 3 says:

1. re-check the precision problem they were skipped for, since a column drop now lands where the ghost is;
2. then re-derive each against DRAG-3 and 4b's DRAG-4.5, or delete it where its API twin pins the math.

### 4i. Returned work, and a cost study

**Added 2026-11-12 (Nathan).** Three cases and one test come back for automation work after their tests were skipped. This is a return, not a new assignment: DRAG-3.16, DRAG-5.3, DRAG-5.10 and DRAG-7.18 keep the batch counts above, and 4i restores whole-Then proof for each. From now on 4i also takes any test that predates its batch and fails flakily there (D2, amended 2026-11-12): the batch skips it, records it, and doesn't repair it. A skipped test never counts, so each case's catalog status and Automation line must reflect the gap until its test runs again; that is the catalog owner's (the Reconciler's, at each batch's close). 4i's cases run after 4h, and its stops follow the five stops above.

| Case | Moved from | Skipped | Why |
| --- | --- | --- | --- |
| DRAG-3.16 | 4h (its automation is 4a's) | 2026-11-10 | The runner trial's setup connection reset (below) |
| DRAG-5.3 | 4b | 2026-11-12 | Two failed attempts in the locked-after-A variants at five workers during 4c's Stop 4 (below) |
| DRAG-5.10's B21 test | 4b | 2026-11-12 | One failed attempt at five workers in 4c's full run (below) |
| DRAG-7.18 | 4c | 2026-11-12 | The cost of its two tests, which Nathan wants kept as a cost and benefit study (below) |

- **DRAG-3.16.** Both parameterized tests in `tests/ui/drag-band-contracts.spec.ts` are skipped: the clipped-content-top branch and the restored-content-top branch. One of five three-worker contention copies of the clipped branch failed before drag setup with `ECONNRESET` on `POST /api/projects`; its other four copies and five focused one-worker repetitions passed. Investigate that setup/transport failure, restore both variants' whole-Then proof and apply D2 at the adopted five-worker count. Do not treat the connection reset as evidence about the band outcome. Evidence is `tests/output/parallel-workers-batch3/drag-3w-repeat5.json` and `setup-reset-1w-repeat5.json`, with details in the [runner report](../tech-debt-stories/e2e-parallel-workers.md). Its prior 4a certification remains historical evidence, not current passing automation while both tests are skipped.
- **DRAG-5.3.** The one parameterized test in `tests/ui/drag-5-stub-detach.spec.ts`, "B18 … detach uses the destination meaning", is skipped: eight variants, a merged column and an expanded sub-row, each at the top, middle, bottom and locked-after-A. During 4c's Stop 4 the locked-after-A variant failed once in each form at five workers, in a test 4c did not change:
  - the expanded sub-row's, in D2's ten repeats (9 of 10): a 30 s wait for the sub-row's bottom carve divider, no cause established (`tests/output/batch4c-d2-repeat10.json`; page snapshot in `tests/output/artifacts/ui-drag-5-stub-detach-DRAG-82914-ses-the-destination-meaning-chromium-repeat4/error-context.md`);
  - the merged column's, in the first final full run: `read ECONNRESET` on `GET /api/items/:id`, six seconds into the test, which is the signature of the [flake investigation](../../audits/story-10-drag-flake-investigation.md)'s cause D (`tests/output/batch4c-final-full-e2e.json`).

  Both variants passed 20 of 20 repeats on their own and passed the rerun of the full suite (`batch4c-b18-after.json`, `batch4c-final-full-e2e-rerun.json`). 4i settles whether the reset is the transport, which is the investigation's D1 (a longer keep-alive timeout on the server, a Coder change not yet made), and what the expanded variant's wait was. Then it restores the eight variants and applies D2 at five workers. The investigation had already recorded one unexplained 30 s timeout in the merged locked-after-A variant (`batch2e-followup-full-e2e.json`).
- **DRAG-5.10's B21 test.** The parameterized test in `tests/ui/drag-5-stub-detach.spec.ts`, "B21 both copies switch through Q and back to P before … restores the original Stub", is skipped: two variants, the cancel and the nowhere ending. The nowhere variant failed once in 4c's first full run on the tree with the earlier skips (`tests/output/batch4c-after-4i-skips-full-e2e.json`): the carried copy's height read 96 against the ghost row's 24, the copy having switched to its shortCard form before the row followed. It passed 60 of 60 on its own (`batch4c-b21-after.json`), 10 of 10 in D2's repeats and the rerun of the full suite. The test predates 4c, so the rule above skips it. 4i finds what the two boxes disagree on, and whether the Coder's change to a Stub's carried shortCard width touches the moment they agree. DRAG-5.10 is also carried by the B17 test in the same file ("DRAG-5.1, DRAG-5.2, DRAG-5.10: B17 …") and by `drag-descendants-placement.spec.ts`'s B10 ("DRAG-4.30, DRAG-5.10: B10 …"), which keep running; whether they cover the whole case is the Reconciler's to say.
- **DRAG-7.18.** The two tests in `tests/ui/drag-7-modal-hold.spec.ts` (P's own Stub, and a Free Card zoomed in) are skipped. They were authored in 4c, extended after the Planner's rewording of the case, and passed D2's ten repeats at five workers (20 of 20), so the skip is for their cost, not a failure.

**The DRAG-7.18 cost study.** Nathan's reason: about 24 s of clocks to prove a single case is very costly, so the case is the study for weighing a surface test's cost against what it proves (`.claude/guides/testing-strategy.md`, "When a surface test costs more than it proves"). The facts it starts from:

- **What the case's Then asks for:** after the modal a hold opened is left by a pop to `P`'s column and the drag zooms back into `P`, a hold beside an overflow row opens the modal again at the same Descendants layer; the drag does it twice more in the same drag (two exits, two reopens); no write occurs during any exit, re-entry or opening; only a release in the final opening commits `X` at the selected gap and depth; earlier openings don't limit a later one.
- **What the tests cost,** from D2's report (`batch4c-d2-repeat10.json`), mean per run at five workers: **10.1 s** for P's own Stub and **13.0 s** for the Free Card zoomed in, **23 s** for the pair, so 231 s of test time over ten repeats. Each run chains a first hold, then two cycles of a pop (300 ms), the full zoom-in hold (1,500 + 800 ms) and a modal hold (200 + 300 ms).
- **What the waits buy:** each cycle is a step of the When. The zoom's length buys no clause: it is long because the pop rests the cursor on a Card in the column, where a short zoom would carry the drag into that Card.
- **What the history was:** no correction to the aim or the timing after the first authoring, and no failed attempt in 20. The Test Reviewer's fourth pass proves the case against the current Then and raises the cost as a note, never as a gap; it counts the two variants as one gesture repeated across two kinds of `X`, which the Terms let a case hold for either.
- **The options the guide gives, for the study to weigh:** simplify (rest the pop on column space outside any Card, so the zoom can be about a second, which the reviewer puts at 2.6 to 3.9 s a variant; one variant in place of two); one gesture with the matrix inside (the second and later reopenings in the pure module that decides them, with the surface test showing the gesture reaches it); split the case; or keep it as it was. The study is the 4i session's to write, with the three questions answered and a recommendation. It decides nothing.

**When 4i runs.** After 4h. Its stops are the five above: Stop 1 asks the three questions of DRAG-7.18 and proposes what proves each clause of the three cases, for Nathan to decide.

### 4j. Deferred from 4c's close

**Added 2026-11-12 (Nathan).** The Reconciler's [report on 4c](../../audits/test-reconciliation-story-10-batch-4c.md) raised one weak test and three candidate new cases. 4c closes without them, and they are deferred here. 4j runs after 4i and follows the five stops above.

- **A weak test: the hold-opened distance variants of DRAG-7.10 and DRAG-1.14.** In `tests/ui/drag-7-hierarchy-modal.spec.ts`, the matrix "DRAG-7.10, DRAG-1.14: P’s own Stub carried into a modal a hold opened pops once to its column | its expanded sub-row on one sample of the distance, Free, and a release after Card Q writes that placement" has two variants. Their helper `expectLeavesOnce` rests the cursor in P's box when part of it lies outside the modal, and otherwise on Card Q beside it; it asserts the rest point's owner for the click arrival only. With a hold-opened modal the point probably lies on Card Q, so the two variants would pass the same if the distance were measured from the Card's box in place of the modal's box, which wiki board-drag-interaction §3.1 and §7.3 give as the box the modal holds the drag to. The four click-opened and hold-free distance variants cut for cost on 2026-11-12 were the ones that told the two apart. The Reconciler counts DRAG-1.14 and DRAG-7.10 as covered, since the tests assert the Then's positive statement. The work is a QA Engineer's, and the Reconciler names two ways: assert where the rest point lies, or seed a `popDistancePx` small enough that a point in P's box clears the modal. Either way the Test Reviewer weighs it, D2 applies to the changed variants, and the two cases are confirmed again at 4j's close.
- **Three candidate new cases, each a ruling before it is a test:**
  1. **The modal's automatic close does not wait for an open Sheet when its Card is gone or its hierarchy is empty** (a Planner session). Wiki board-drag-interaction §9 states it, and the Reconciler finds no case's Then that holds the Card-gone half.
  2. **A Stub's drag that pops out to its column keeps the carried copy under the pointer as the copy narrows** (a Planner session). Wiki §5a states it. Only the Coder's re-anchor tests in `dragOverlayGeometry.test.ts` cover it, and they carry no case ID.
  3. **In the Sheet, Escape ends a title edit before it closes the Sheet** (the PO). The Coder's return makes it so, with a test in `ItemDetailPanel.test.tsx`, and the wiki doesn't say.

  If a ruling adds a case, 4j writes its test (a New), and the Reconciler confirms it at the close. If the Planner or the PO declines a candidate, 4j drops it. The cases, if any, take the IDs the Planner gives them; they are not an original assignment.

## The shared looks (D13)

Applied by the Planner in Phase 2 step 5. The 26 original IDs stay in place: 24 keep their automatable behavior, and DRAG-1.27 and TREE-2.8 become the shared Manual cases for their looks. Three new IDs complete the five shared look families. No case moves, deletion, renumbering or test-ID re-titling is required. Each shared case has a present-tense Manual reason and a concrete Given/When/Then at the current configured values.

| Shared Manual case | Look checked by hand                                                                                                                                                      | Behavior cases whose look it holds                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DRAG-2.24          | Board Full/Mid/Low and ghost strengths across Cards, Stubs, overflow rows, sections and the modal; no relationship colour or compounded dimming; full-strength drop lines | DRAG-2.14, DRAG-2.15, DRAG-2.16, DRAG-2.17, DRAG-2.18, DRAG-2.19, DRAG-2.20, DRAG-2.21, DRAG-2.23, DRAG-7.12, DRAG-8.2                                                                     |
| DRAG-6.31          | Pending pulses from each row's own strength to half, with nested rows and the line independent                                                                            | DRAG-6.23, DRAG-6.24                                                                                                                                                                       |
| DRAG-6.30          | The flash's two amber pulses and the banner's full-strength/final-quarter fade                                                                                            | DRAG-6.19, DRAG-6.20, DRAG-6.26; DRAG-6.27 points to it while retaining the automated flash-window rule                                                                                    |
| DRAG-1.27          | A Free pickup's tilt, the carried Stub's held shadow and the active-context outline colour                                                                                | DRAG-1.26, DRAG-3.22; DRAG-1.27 retains its own tilt obligation in this shared case                                                                                                        |
| TREE-2.8           | Sidebar Full/Mid/Low, ghost and untiered-new-row strengths from its own values; full-strength line without relationship colour                                            | TREE-2.1, TREE-2.4, TREE-2.5, TREE-2.6, TREE-2.7, TREE-2.14; TREE-2.8 retains independent sidebar values. TREE-1.1 and TREE-2.13 point to it while retaining their placement/line geometry |

**Batch handoff:** read the current case first, then the baseline residuals. Do not add an appearance assertion back to a state case, and do not use the shared Manual case to defer its saved result, affected row, state, location or size. Existing Automated statuses and pointers are unchanged; these rewrites make no new coverage claim. The later confirming runs judge each revised Open case against its current Then.

## The skips (D3)

All 24, by the report's skip register.

| Spec                                           | Skipped test                                                | Fate                                                                                                          | Batch |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----- |
| `drag-5-stub-detach.spec.ts`                   | DRAG-5.13, a grandchild Stub popped out to its Card's layer | Rework to the case as it reads, with one pop to the containing column. Its Card-layer expectation is obsolete | 4b    |
| `drag-card-zoom-in.spec.ts`                    | The two zoom-ins, own column and another                    | Rework as one parameterized spec: own-column DRAG-4.1 / cross-column DRAG-4.15 (item 7)                       | 4b    |
| `drag-7-hierarchy-modal.spec.ts`               | DRAG-7.9, R1's last child after R1a                         | Trace, then Rework                                                                                            | 4c    |
|                                                | DRAG-7.6, 7.10, 7.11, resting outside the modal pops out    | Rework to DRAG-7.6 and 7.10, with no Card layer. DRAG-7.11 is `Automated` without it                          | 4c    |
|                                                | DRAG-7.2, 7.6, an own slot behind an overflow row           | Rework to DRAG-7.6, as one re-entry spec with the shown own slot's. DRAG-7.2 is `Automated` without it        | 4c    |
|                                                | DRAG-7.2, R's only attached child dragged                   | Delete: DRAG-7.2's count tests cover it                                                                       | 4c    |
|                                                | DRAG-7.6, an own slot the section shows                     | Rework, with the re-entry spec above                                                                          | 4c    |
|                                                | DRAG-7.32, the three ways to close the Sheet                | Trace, then Rework with the screen-place check                                                                | 4c    |
| `drag-7-modal-hold.spec.ts`                    | DRAG-7.14, resting outside the section ends the hold        | Rework to the whole Card's bound, which replaced the section's                                                | 4c    |
|                                                | DRAG-7.15, from above to below R's overflow row             | Rework at item 10's aims, as one spec parameterized over W alone and W with WC                                | 4c    |
|                                                | DRAG-7.15, the same with a child                            | Merged into the spec above                                                                                    | 4c    |
|                                                | DRAG-7.17, above the overflow row with a scrolling list     | Trace (item 8), then Rework                                                                                   | 4c    |
|                                                | DRAG-7.12, the modal carries the classification             | Rework as the tier-attribute test (D13)                                                                       | 4c    |
|                                                | DRAG-7.10, 7.18, reopening the modal in the same drag       | Rework, with no Card layer. Reworked in 4c; the DRAG-7.18 tests were then skipped for their cost (4i)         | 4c    |
| `drag-7-overflow-row.spec.ts`                  | DRAG-7.27, R carries its overflow row                       | Rework, at an aim that's been tried                                                                           | 4c    |
| `project-tree-drag.spec.ts`                    | TREE-1.4, a subtree that holds every project                | Rework, aimed at the dragged project's own row                                                                | 4g    |
|                                                | TREE-2.1, descendants dimmed                                | Rework to the branch's absence and the tier attributes, with #12's title and reason replaced                  | 4g    |
| `item-repositioning-cross-column-dnd.spec.ts`  | 1.a and 2.a                                                 | Re-check, then re-derive or delete (4h)                                                                       | 4h    |
| `item-repositioning-cross-project-dnd.spec.ts` | 1.a, 2.a, 2.b and 4.b                                       | The same                                                                                                      | 4h    |

Skips added since, each temporary: DRAG-3.16's two tests (2026-11-10), DRAG-5.3's eight B18 variants, DRAG-5.10's two B21 variants and DRAG-7.18's two tests (2026-11-12), all for 4i.

## The checkpoint, after 4a

4a has every kind of work but Rework, so its stop measures the rest of the story. Its stop records:

- per kind, the cases closed and the specs written;
- the specs that missed D2's bar, and why;
- the helpers found, and the Automator–Coder round trips;
- how long the Split rewording took, for the batches that hold most of it.

Nathan then decides:

- D2's bar;
- whether the batches stay in this story, or some move to a tech-debt story under D10. The P2 cases in 4e–4g are the likeliest;
- any change to the order of the batches.

The decision is recorded here, and a change to a decision is amended in the plan.

**4a checkpoint state — 2026-11-08:** complete. All 34 cases are Automated; all 89 drag variants meet the twenty-pass bar, and final E2E/root checks pass. The Results section records overlapping per-kind spec/test counts, six Coder round trips, reusable helpers, measured runner cost, the interrupted attempt and excluded overlaps, and the absence of additional Split rewording. Nathan's three decisions above remain pending. No later batch or commit has started.

**Checkpoint direction — Nathan, 2026-11-08:** the five stops above are approved for the remaining batches, including the separate Coder handoff/session and check-in. No in-session Coder agent is part of an automation session. The [retrospective](../../audits/story-10-batch-4a-workload-retrospective.md) records the workload evidence behind this direction. D2's bar, case assignments and batch order have not changed. Nathan subsequently authorized 4b; its Stop 1 handoff is recorded in Results.

## Outside this story (D10)

- **TC-5.15 and TC-6.11, `Open`, and TC-6.13 and ATT-5.11, `Pending PO`:** the Quick Items epic. `epic-4-decisions.md` names all four by ID.
- **ATT-1.10, `Planned`:** a Card shows its tags (wiki item-attachment §12). The Tags & Type System epic holds it. `epic-5-decisions.md` names it by ID, under "Test-plan cases routed here by ID".

- **Retired DRAG-4.35 and B09's seed line-place guard:** Nathan accepts the defects until [the Descendants highlight-cue story](../tech-debt-stories/descendants-highlight-cue.md). DRAG-4.35 is removed from the catalog and active batch; its automation is removed by the relevant test owner. DRAG-4.30 retains its functional seed and saved-last-child coverage. The retired ID is not reused.

## Results

**Current packet: batch 4c, Stop 5 complete, at Nathan's review and commit (2026-11-12).** The Reconciler has run: 14 of the 15 cases are `Automated`. The frozen selection met D2 for every added or changed test that still runs, and the final full E2E run and the root gate are green, with failed attempts disclosed below. After Stop 4, Nathan skipped the DRAG-5.3, DRAG-5.10 (B21) and DRAG-7.18 tests and moved them, with DRAG-3.16, to a new batch 4i, so 4c closes 14 of its 15 cases. Nothing is committed. It replaces the Stop 3 packet; Git holds that one. Plan: [story-10-batch-4c-proof-plan.md](story-10-batch-4c-proof-plan.md).

- **What came after Stop 3.** Nathan committed the Stop 3 tree as `61a0df4b` (tree `65898343e75afe99ab22faf58116fc56ad6d95f5`); that commit holds the tree the reviewer's third pass read, plus the Planner's rewording of eight cases. It did not hold a Stop 4. The QA Engineer then extended the tests for the new text, with Nathan's go-ahead (2026-11-12), and ran Stop 4 on the result:
  - DRAG-7.10: the Coder's two-excursion clock test in `popSession.test.ts` is stamped DRAG-7.10 (title only; the clock category, so no approval);
  - DRAG-7.14: the two padding tests assert the ghost's gap and level after the modal opens (X's row under the cursor, `3:3:true`), and that the modal is inside the window by more than its margin on each side;
  - DRAG-7.18: each test runs the pop-out, zoom-back and reopening twice in one drag;
  - DRAG-7.27: the Q-carried test asserts `T` in its Given, absent while carried, and back after the cancel;
  - DRAG-7.32: a new test presses Escape while the Sheet is mid-entrance, with the page's animations slowed through the browser's animation timeline so the Given (heading visible, Sheet's right edge beyond the window) is asserted;
  - DRAG-7.31: comment only ("no item write request");
  - DRAG-7.9 and 7.17: no change; the reviewer judged the existing tests against the new text.
- **Stop 5, the close-out (2026-11-12).** The Reconciler ran once, cold, on the fixed inputs: [the report](../../audits/test-reconciliation-story-10-batch-4c.md). Its coverage report before it ran is in the QA Engineer's scratch folder (not kept in the repo); the one after is clean.
  - **Cases closed, by kind (14 of 15):** Extend 2 (DRAG-7.28, DRAG-1.14), New 3 (DRAG-7.13, 7.31, DRAG-3.25), Rework 8 (DRAG-7.6, 7.9, 7.10, 7.14, 7.15, 7.17, 7.27, 7.32) and Split 1 (DRAG-7.12). DRAG-7.18, the ninth Rework, stays `Open`, in 4i.
  - **Catalog changes** (the Reconciler's, status and Automation line only): the 14 are `Automated`; DRAG-7.2's line gains `drag-7-hierarchy-modal.spec.ts`; DRAG-3.16, DRAG-5.3 and DRAG-5.10 go from `Automated` back to `Open` with the line `—`, all for 4i. Totals: 389 Automated, 85 Open, 10 Manual, 2 Planned, 2 Pending PO (488). Run after it: `npm run report:catalog` shows no lost coverage, no stale line, no status conflict; `check:docs` 454 files, 0 hits; `npm run check` exit 0 (`tests/output/batch4c-stop5-gate.log`).
  - **Stamps found new:** DRAG-2.22 on the two DRAG-7.27 R-carried and Q-carried tests, title only (a title-only diff confirms it). DRAG-2.22 stays `Open`, assigned to 4f. The Reconciler declined the reviewer's third proposed mapping for it.
  - **Counts:** 15 catalog cases; 131 tests declared in the five files, 119 running and 12 skipped; 70 of them added or changed (the plan expected 61); 8 DRAG-7.10 matrix variants. Tests added: the `drag-stub-row-height.spec.ts` file (10), a set of re-entry, hold, overflow-row and Sheet tests in the three DRAG-7 specs, and one in `drag-5-stub-detach.spec.ts`.
  - **Helpers:** `tests/helpers/overflowTree.ts` (the shared trees, `holdAt`, `holdFreeAt`, `pointOutsideModal`, `expectInside`, `dropLineOn`, `rowIds`, `modalState`) and `boardDragSurface.ts` (`zoomIntoCard`, `withinExcess`, header comments), with the `awaitProjection` header reworded in `dragGesture.ts`. Support files from Nathan's flake-investigation session: `tests/global-setup.ts` and `tests/helpers/keepAwake.ps1`.
  - **Coder handoffs:** one separate Coder session (Stop 3): the carried copy's width for a Stub popped out of a click-opened modal; the Escape handling of the Sheet and the modal (`useEscapeKey.ts`); the `data-drag-cue` hook; and two `popSession.test.ts` clock tests (DRAG-7.10's two excursions, DRAG-7.14's run-on). The five red DRAG-7.10 tests passed unchanged on it.
  - **Cost:** four Test Reviewer passes, one `/code-review` at `medium`, a Planner session for nine questions, one Coder session. D2's ten repeats took 950 s for 1,310 attempts at five workers, the full suite about 240 s, the gate about 95 s. Failed attempts in the validation: three, all in unchanged batch 4b tests (DRAG-5.3 twice and DRAG-5.10 once), now in 4i; none in the batch's own tests.
  - **What remains:**
    - **Batch 4i:** DRAG-3.16, DRAG-5.3, DRAG-5.10's B21 test and DRAG-7.18 (the batches doc's 4i).
    - **Batch 4j (Nathan, 2026-11-12):** the Reconciler's weak-test finding (the two hold-opened Stub variants of DRAG-7.10 and DRAG-1.14 that test the distance don't assert their rest point lies in P's box) and its three candidate new cases are deferred to 4j, not fixed in 4c. The Reconciler counts the cases as covered.
    - **Candidate new cases:** in 4j, with the weak test (the batches doc's 4j; Open questions).
    - **DRAG-6.15** stays `Open` for 4d, and **DRAG-2.22** for 4f.
- **Batch 4i, after Stop 4 (Nathan, 2026-11-12).** The batches doc has a new 4i (the plan's Phase 4 and Amendments too). DRAG-3.16 moves to it from 4h. DRAG-5.3's eight B18 variants and DRAG-5.10's two B21 variants (two parameterized tests in `drag-5-stub-detach.spec.ts`) and DRAG-7.18's two tests (`drag-7-modal-hold.spec.ts`) are now `test.skip`, with a comment that states the reason, and join 4i. DRAG-7.18 is also kept as a case study in weighing a surface test's cost: 10.1 s and 13.0 s a run, 23 s for the pair. No other test, helper or app file changed. A skipped test never counts, so the Reconciler will find DRAG-5.3 and DRAG-7.18 with no running test (Nathan: that is fine for now), DRAG-5.10 left to its B17 and B10 tests, and DRAG-3.16 as before.
- **New rules for the rest of the story (Nathan, 2026-11-12), in D2 and the stops:** a flaky test that predates the batch is skipped and moved to 4i, which is how B21 got there; a test the batch added or changed that fails gets up to two fix attempts when the failure is false, then a report with what is known about why. No test of this batch needed a fix attempt after Stop 2.
- **Reviewer passes:** four, each word for word in the Review log. The fourth, on `d5a17972…` against the reworded cases: no gap, no correction after a red run. It made two optional suggestions, both taken before the freeze (the margin check above, and the early-Escape test asserting the list's scroll offset first), and the changed tests ran 9 of 9 afterwards. The reviewer hasn't seen those two edits.
- **The frozen selection.** Tree `75b654edb0aca33df7c4c194277e629494617950`, subtrees `tests` `932eaf7c836c634b1e2b8a21e220e5783f0b7675`, `client` `2a7390e8df90d5bf73797af43468069a932a512a`, `server` `9afce5ff3395c2b08caa1400e6ba21883122b7d4`. At the end of Stop 4 those three subtrees are unchanged (tree `836cf84a0f2bd77aeb6fa79becbca2dc1c93ee3b`, which differs only by another session's epic-4 planning docs). Selection: the five files whole, **131 tests**: `drag-7-hierarchy-modal.spec.ts` 44, `drag-7-modal-hold.spec.ts` 31, `drag-7-overflow-row.spec.ts` 17, `drag-5-stub-detach.spec.ts` 29, `drag-stub-row-height.spec.ts` 10. **70 of them are added or changed** against the baseline commit `175943d7` (2, 29, 24, 5 and 10 by file), by a diff of each test's own source block. That misses a test changed only through a helper in its file, which is why the whole files were repeated.
  - **Stamps:** the one new stamp is the clock test's title, a title-only diff; `check:docs` 454 files, 0 hits.
- **D2: ten repeats at five workers, retries 0** (`tests/output/batch4c-d2-repeat10.json`, 950 s). 1,310 attempts: **1,309 passed, 1 failed.** All 70 added or changed tests passed 10 of 10 (700 passes). The failure is in an unchanged test, a batch 4b one:
  - **`DRAG-5.3: B18 expanded sub-row locked-after-A detach uses the destination meaning`, repeat 4, 9 of 10.** A 30 s timeout in `locator.evaluate`, waiting for the sub-row region's bottom carve divider (`[data-carve-divider="bottom"]`). The page snapshot is in `tests/output/artifacts/ui-drag-5-stub-detach-DRAG-82914-ses-the-destination-meaning-chromium-repeat4/error-context.md`. No cause is established.
- **Final full E2E suite, five workers.** Two runs, both disclosed:
  - `batch4c-final-full-e2e.json`: 450 passed, 10 skipped, **1 failed**: `DRAG-5.3: B18 merged column locked-after-A detach uses the destination meaning`, 6.2 s in, `apiRequestContext.get: read ECONNRESET` on `GET /api/items/:id` (worker 3, port 3013, at `drag-5-stub-detach.spec.ts:608`). It is the signature of the flake investigation's cause D, a connection reset between a test's API calls when a gesture leaves about five seconds idle.
  - `batch4c-final-full-e2e-rerun.json`, the same tree: **451 passed, 10 skipped, 0 failed.** None of the 10 skips is in the five files (they ran 0 skipped).
  - **Evidence only, nothing changed:** `batch4c-b18-after.json`, the eight DRAG-5.3 B18 tests repeated 20 times at five workers: 160 of 160 passed.
  - **On the tree with the skips,** two more runs. `batch4c-after-4i-skips-full-e2e.json`: 440 passed, 20 skipped, **1 failed**, in another unchanged batch 4b test: `DRAG-5.10: B21 both copies switch through Q and back to P before nowhere restores…`, at `drag-5-stub-detach.spec.ts:755`, where the carried copy's height read 96 against the row's 24 (the copy had switched to its shortCard form and the row had not yet). It passed 60 of 60 afterwards on its own (`batch4c-b21-after.json`), and 10 of 10 in D2's repeats. `batch4c-after-4i-skips-full-e2e-rerun.json`, the same tree: **441 passed, 20 skipped, 0 failed**, the final full run for the batch. The 20 skips are the earlier 10 and the ten new ones. After the B21 skip (a flaky failure in a test that predates the batch, skipped under the new rule): `batch4c-after-b21-skip-full-e2e.json`, **439 passed, 22 skipped, 0 failed**, the batch's final full run, and `npm run check` green again (exit 0, 444, 1,105 and 327 tests; `batch4c-after-b21-skip-gate.log`).
- **Root gate** `npm run check`, on the frozen tree and again on the tree with the skips: exit 0, 444 server, 1,105 client and 327 script tests. `tests/output/batch4c-final-gate.log`, `batch4c-after-4i-skips-gate.log`.
- **Each case's state:**

  | Case | State |
  | --- | --- |
  | DRAG-7.6, 7.9, 7.10, 7.12, 7.13, 7.14, 7.15, 7.17, 7.27, 7.28, 7.31, 7.32, DRAG-1.14, DRAG-3.25 | Authored, green on the frozen tree, D2 met. The fourth pass: Proves the case |
  | DRAG-7.18 | Authored, passed D2 (20 of 20) and the fourth pass, then **skipped for cost and moved to 4i** |

  None held off, none unauthored. DRAG-2.22 and DRAG-6.15, which the reviewer widened to, keep their gaps and aren't 4c's.
- **The skips and the evidence.** The skips change no other test, and the D2 repeats and the first final full run ran with those ten tests running. For the other 119 tests of the five files, and the 68 of the 70 added or changed that still run, D2's 1,310 attempts stand unchanged. The twelve skipped tests' own passes (the 20 of DRAG-7.18, the B18 variants' 79 of 80 and B21's 20 of 20 in D2's repeats) are history and don't count. A full run and the gate were repeated on the tree with the skips; both below. Tree with the B18 and DRAG-7.18 skips: `091bf0317b71ac4d0f9383cd5dc0261eac15b32b` (`tests` `3cd76c264b5ffe8ed19b5daf2c4622691b2628e9`). Tree with the B21 skip too, the batch's final tree: `653719b829bbb74c4f80c0155203ef329c178196` (`tests` `1c5d1bc7d1cac59a9c31d9d9d00cb3b50aebfe59`, `client` `2a7390e8df90d5bf73797af43468069a932a512a`, `server` `9afce5ff3395c2b08caa1400e6ba21883122b7d4`); `client` and `server` are unchanged from the freeze.
- **Adjacent findings, not 4c's:**
  - **DRAG-5.3's B18 locked-after-A detach, merged and expanded variants, at five workers:** one failed attempt each, one in the ten repeats and one in the first full run. The merged one carries cause D's signature. The expanded one is a 30 s wait for a carve divider, and the flake investigation recorded a 30 s timeout for the merged variant too, as unexplained. Both passed 20 of 20 on their own and on the rerun. Routed by Nathan: the eight variants are skipped and belong to 4i. The investigation's D1 (a longer keep-alive timeout on the server, for the Coder) isn't in the tree.
  - **DRAG-5.10's B21 "nowhere restores" variant, once at five workers (skipped, to 4i, by Nathan under the new rule):** the carried copy's form and the ghost row's height disagreed for a moment (96 and 24). It passed 60 of 60 on its own and 10 of 10 in D2's repeats. It is a third distinct failure in `drag-5-stub-detach.spec.ts` across five full or repeated runs, each in a different unchanged test and none reproduced on its own. This one reads two boxes at two moments after a form switch. Whether the Coder's change to a Stub's carried shortCard width (`dragOverlayGeometry.ts`) touches the moment the two agree is a question for the Coder or for 4i, not something these runs show.
- **Cost notes:** decided by Nathan (2026-11-12): DRAG-7.17's gap-above test and DRAG-7.31 stay as they are; DRAG-7.18's two tests are skipped and move to 4i as a cost study (the batches doc's 4i has the facts the study starts from).
- **`/code-review` at `medium`,** Stop 2, on `tests/helpers/overflowTree.ts` and `boardDragSurface.ts`: seven findings. Fixed, three: `holdFreeAt` hard-coded Card `P`'s title; two comments that said the wrong thing. Added for a fourth: `seedTree` fails if the section's levels aren't the three its depths assume. Noted, not acted on: the cast on `x`, the nine-point grid in `pointOutsideModal`, an import cycle between the two helpers. One, a mix of coordinate spaces, judged not a real problem. No shared test infrastructure has changed since, apart from `dragGesture.ts`'s header comment.
- **The Coder's return,** as recorded at Stop 3 and unchanged: app files `ItemDetailPanel.tsx`, `KanbanCard.tsx`, `ModalShell.tsx`, `dragChrome.tsx`, `dragOverlayGeometry.ts`, `dragStructure.ts`, `useBoardDnd.ts`, new `useEscapeKey.ts` and `workflow/AGENTS.md`; Vitest `ItemDetailPanel.test.tsx`, `KanbanCard.test.tsx`, new `ModalShell.test.tsx`, `dragChrome.test.tsx`, `dragOverlayGeometry.test.ts`, `dragStructure.test.ts`, `popSession.test.ts`. The original five red DRAG-7.10 tests passed unchanged on it (`batch4c-coder-return-full.json`, 134 of 134).
- **Living-docs handoff** (for the story plan's list; that file isn't on this stop's list):
  - the skipped test "DRAG-7.2: R's only attached child dragged…" is deleted; `descendantsSection.test.ts` holds that rule;
  - DRAG-7.11 is dropped from the old pop-out test's title, and DRAG-7.10 from the old DRAG-7.18 test's, as those tests were replaced;
  - four DRAG-7.10 matrix variants are deleted, by Nathan's decision on the cost note: the click-opened and hold-free arrivals on one sample of the distance, each to the column and to the expanded sub-row. Two of them carried DRAG-1.14;
  - DRAG-1.14 is stamped on the two B25 tests in `drag-5-stub-detach.spec.ts`, title only;
  - DRAG-7.10 is stamped on the Coder's two-excursion test in `popSession.test.ts`, title only;
  - DRAG-5.3's eight B18 variants, DRAG-5.10's two B21 variants and DRAG-7.18's two tests are `test.skip`, to batch 4i, and DRAG-3.16 moves from 4h to 4i (the batches doc and the plan's Phase 4 and Amendments are updated). For the catalog owner, since a skipped test never counts: DRAG-5.3's Automation line and status, and DRAG-7.18's, must reflect that no running test carries them; DRAG-3.16's already does;
  - for the Reconciler: the reviewer's two DRAG-2.22 mappings onto DRAG-7.27's Q-carried and R-carried tests and DRAG-7.13's first test (DRAG-2.22 isn't a 4c case, so they aren't stamped).
- **Open questions:** the Planner has answered the Stop 1 and Stop 2 questions (Open questions). None open for 4c; the flaky tests are in 4i.
- **Files in scope:** Stop 2's list (Nathan, 2026-11-11), `tests/helpers/dragGesture.ts` (2026-11-12) and, for the one title stamp, `client/src/components/workflow/popSession.test.ts` (Nathan's choice of option, 2026-11-12).
- **Next owner and action:** Nathan: review and commit batch 4c. Then the next batch is 4d (DRAG-6); 4i follows 4h, and 4j follows 4i. Then the QA Engineer, Stop 5: `npm run report:catalog` on the frozen tree, and the Reconciler, spawned once, cold, with the brief `.claude/agents/test-reconciler.md` names (the plan's Scope and Review log; the coverage report; the record of this green run, its tree IDs and report paths; the range's test and catalog diffs from `175943d7`).
- **JSON report paths** (`tests/output/`): the frozen run's `batch4c-d2-repeat10.json`, `batch4c-final-full-e2e.json` and `batch4c-final-full-e2e-rerun.json`, `batch4c-b18-after.json`, `batch4c-b21-after.json`, `batch4c-after-b21-skip-full-e2e.json`, `batch4c-after-4i-skips-full-e2e.json`, `batch4c-after-4i-skips-full-e2e-rerun.json`, `batch4c-after-planner-full.json` (131 of 131, on `d5a17972…`), `batch4c-tighten.json`, `batch4c-planner-changes.json`; before the commit `batch4c-coder-return-full.json`, `batch4c-prefreeze-full.json`, `batch4c-files-full.json` to `batch4c-files-full5.json` (`-full2` interrupted by a machine suspend), the traces `batch4c-trace-alone.json`, `batch4c-trace-contention.json` and `batch4c-trace-t3-diag.json`, and one per family `batch4c-c01-focus.json` to `batch4c-c728.json`, `batch4c-c08-rework.json`, `batch4c-pass2-fixes.json`. Gate logs: `batch4c-final-gate.log`, `batch4c-after-4i-skips-gate.log`, `batch4c-after-b21-skip-gate.log`, `batch4c-planner-changes-gate.log`, `batch4c-postcoder-gate.log`, `batch4c-stop2-gate.log`.
- **Last reviewer tree:** `d5a179720838b34f3143f5d0059dd1151a983ba9`; the frozen tree adds the two optional suggestions above.
- **Not run:** the T3 trace's early-Escape sequence at real speed (the new test covers it under slowed animation); nothing else in 4c's five stops.

## Review log

The QA Engineer appends desk questions/replies (with the quoted Then), every Test Reviewer verdict and Nathan's declined mappings here, word for word. Results may be replaced; these entries may not. At the close the Reconciler answers each open verdict from the tests. A declined mapping stays declined unless its test changed since. The following decisions are carried from the pre-refactor Approvals section without rewording; its historical role names do not assign future work. Held-off cases now take the Stop 2 reviewer/Nathan route.

### Phase 2 step 4 approvals, carried forward

Nathan approved these on 2026-11-06.

- **The Reconciler's proposed internal mappings are all declined.** Each case still needs a surface test for the rest of its _Then_, and that test can check the same part. The README maps no internal test beside a surface test that covers the whole case.
  - Each case gets a fresh look at whether a Playwright test can cover it.
  - A batch that still finds an internal test the better fit proposes it again, one case at a time. The Automator holds the case off, its confirming run proposes the mapping, and Nathan approves it there (D5).
  - The ones declined:
    - DRAG-1.17, 1.27, 1.28, 3.9, 3.10, 3.22, 4.12 and 6.26;
    - TREE-1.8, 1.11, 1.12, 1.14, 1.19, 2.12, 2.14, 4.9 and 11.7;
    - BCU-5.6 and 5.7.
- **No approval is needed for:**
  - the clock-category IDs the Coder adds for DRAG-4.20 and 4.22, and DRAG-7.10's clock test;
  - DRAG-7.28's ID on DRAG-7.9's test.
- **D2's bar,** as the starting point, until the checkpoint.

D13's shared cases are `Manual` by the Planner's judgment (README), since whether a look is right can't be reduced to precise assertions. Nathan approved D13 itself.

### Batch 4c, Stop 1 — the desk's questions and replies (2026-11-11)

Asked by the QA Engineer, from the cases, one desk agent for all fourteen. The baseline tree was `16fe9e07637a66f797a82fb3c2d5c8b01c9e5aed`; the catalog was unchanged since. The harness indented the reply; that indent is the only thing removed. The Then quotes inside it are the desk's, as it read each case. The proof plan routes each verdict ([story-10-batch-4c-proof-plan.md](story-10-batch-4c-proof-plan.md)).

**The questions, as sent:**

```text
QA Engineer's reading questions for Story 10 batch 4c (DRAG-7 and two neighbours). Answer in your fixed form: for each case quote its Then whole, then one line per row in exactly one of the four forms. Rows are outcomes I mean to assert (or to leave unasserted) in the stated variant. Cases are in docs/test-plans/board-drag-interaction/ (drag-7-overflow-and-hierarchy-modal.md, drag-1-contexts-and-popping.md, drag-3-card-column-bands.md). Notation: P is the Card, K is P's column or expanded sub-row, R/R1/R1a/R2/Q/T/B as the DRAG-7 file's Terms define them; X is any carried item.

DRAG-7.10
 r1. A modal opened by a hold (not a click) while a Free Card, zoomed into P from outside, is carried: leaving the modal pops once to K, and a release after Card Q leaves that Card Free with its original parentId, request {anchorId: Q, side: after}.
 r2. The cursor rests inside P's own box but outside the modal's box: one pop takes the drag to K (not to P's section), no second exit needed.
 r3. In an expanded sub-row K, after the one pop, the drag is locked in K; resting the cursor in a sibling sub-row, or in Board, changes nothing until another pop out of K fires.
 r4. With popDelayMs never satisfied and popDistancePx > 0, a single pointer sample at least popDistancePx outside the modal's box (inside K) produces the same single pop.
 r5. Both the in-list ghost and the carried copy are shortCard after the pop.
 r6. Two excursions out of the modal, each too short to satisfy popDelayMs but together longer than it, with a return between them: the modal stays open (the clock restarting on return). Is this reset stated by DRAG-7.10's Then, or is it only DRAG-1.30's?
 r7. The same excursion test but for distance: moving outside the modal's box by less than popDistancePx and coming back leaves the modal open.

DRAG-1.14
 r1. While the modal holds the Descendants layer, one pointer sample at least popDistancePx outside the modal's box pops the item to K at once (before popDelayMs).
 r2. In an expanded sub-row K (Free Card locked in it), one pointer sample at least popDistancePx outside the sub-row's box pops it to Board at once.
 r3. With popDistancePx at 0 and the modal open, the cursor outside the modal's box for less than popDelayMs pops nothing.

DRAG-7.12
 r1. In a modal opened by a hold during the drag, R and R1 are Full, R1a is Mid, Y is Low.
 r2. R, which is also drawn in the section before the modal opens, keeps the tier it had before the modal opened.
 r3. R1, R1a and Y are not drawn before the modal opens, so their "drag-start classification" can only be asserted against the Then's stated Full/Mid/Low after it opens; nothing more is asserted about their tier before it.
 r4. The section's rows still drawn under the backdrop carry no target tier while the modal is open.

DRAG-7.14
 r1. With the cursor leaving the whole Card's box (nothing pops) and the ghost still in its gap: any cue disappears at once, the modal does not open, and no dwell runs while the cursor stays outside the Card's box.
 r2. When the cursor comes back inside the Card's box with the ghost unchanged, a fresh dwell starts.
 r3. Moving into the Card's title or padding during the dwell: the dwell runs on and completes into the cue, and the cue completes into the modal opening, with the cursor still there.
 r4. Same, but moved into the padding during the cue.
 r5. After the modal opens from the padding, the ghost is still at R's first child.

DRAG-7.15
 r1. An item with a subtree, held from below and moved UP to the gap below R's overflow row, opens the modal with the item's spot under the cursor, and a release commits it last among R's children with its child still attached.
 r2. The same for the gap above R's overflow row, held from below, with a subtree.
 r3. The item's attached child is absent from the section and the modal for the whole drag, from pickup to release.
 r4. After the release, the child is drawn directly under the item in the modal.
 r5. The cursor reaching the aim in a single approach (one pointer sample, not a hover pass) at R's own row: the modal opens, and a release writes what the modal draws.
 r6. The cursor reaching the overflow row's top quarter in a single approach: no modal hold runs, the ghost is after the overflow row, and a release writes the same as the modal-hold release at that gap.

DRAG-7.17
 r1. From the gap above R's overflow row, with a sibling of R before it carrying many attached children (so R's first-child spot lies far down the list), the modal's list is scrolled so the spot is under the cursor and a release commits the item first among R's attached children.

DRAG-7.18
 r1. The modal opens a second time after a pop out and a hold again; the case is also satisfied by asserting a third opening (two exits, two reopens)? I mean to assert only one reopen. Is one reopen enough for "as often as the drag needs", or does the Then require more?
 r2. No request of any kind is sent between pickup and the final release, other than that final write.
 r3. Re-entry into P's Descendants is by the full zoom-in hold with the side highlight naming P, for an item that was P's own Stub and, separately, for a Free Card that came into P from outside.

DRAG-7.27
 r1. With R carried, an unrelated overflow row (T given an attached child) stays drawn with its ordinary count.
 r2. With R carried, the drop line is never on R's overflow row, and the gap after Q runs to T.
 r3. With Q carried, R's row, R's overflow row, and T's row (T is also in Q's attached branch) are absent.
 r4. With P carried and zoomed into another Card's section, no overflow row of P or of P's attached branch is drawn in that section.
 r5. After R is released as B's next sibling at level 1, R.parentId = P after B, R1 and R2 remain R's attached children, R has no overflow row, and R1 and R2 show in the section at level 2.
 r6. On cancel, the original section returns and R's overflow row reads "2 children".

DRAG-7.31
 r1. No request is sent at any point from pickup through the final release (including the pop out, the zoom back and the reopening), not only on the release itself.
 r2. After the release the modal is still open and shows R2 in its original slot after R1a and before T at level L + 1.

DRAG-7.32
 r1. A click on the Sheet's backdrop at the screen point where the modal's own X button lies (under the backdrop) closes only the Sheet and does not activate the modal's X.
 r2. The modal's box (its place on screen) is the same before the Sheet opens and after each of the three ways of closing the Sheet.
 r3. The modal's list is scrolled (non-zero) before the Sheet opens, and its scroll offset is unchanged after each way of closing.
 r4. After each of the three ways of closing, one further Escape closes the modal.

DRAG-7.9
 r1. After each of the four releases (first child, after R1a, own-gap no-write, over-cap no-write) R2 is attached with P's workphase, asserted on the saved item.
 r2. "Throughout" also requires asserting R2's attached state during the drag, before release.
 r3. The closing sentence ("The modal offers every placement the section does, and those among hidden rows that the section doesn't") needs its own assertion, apart from the four bullets.

DRAG-7.6
 r1. In a tree where P also has an attached Stub X after B (a Stub of P's outside the tree, per the Terms), the last gap is below X, and a release commits R1 last among P's attached children, after X.
 r2. Released in the column before zooming back in, R1 becomes Free (isAttached 0) with parentId R, placed by the column's within-action with the request {anchorId, side} the ghost names.
 r3. R1a is still R1's attached child after the release in P's section.

DRAG-3.25
 r1. Heights are compared with each other (all equal to one s) and not against a pixel value.
 r2. The pill's box is no taller than the title's text line.
 r3. A row with a long title has height s.
 r4. The section's rows still drawn under the modal's backdrop have height s while the modal is open.
 r5. The carried copy of a Stub with a branch has box height s, and its second line lies outside (below) that box.
 r6. The in-list ghost of that Stub has no second line.
 r7. The carried copy's box height s is the same when the Stub is picked up from the modal as from the section.
```

**The replies, as received:**

```text
Test Planner desk: replies for Story 10 batch 4c

I read each case against its Then and against the wiki sections its Rule field cites. Link targets are left out of the quotes; the link text is kept.

======================================================================
DRAG-7.10: Leaving the modal closes it and pops directly to the Card's column or sub-row

Then, as I read it:
> *then* exactly one pop closes the modal and takes the drag directly to `K`, Free, bounded by `K` and shown as shortCard. No further exit from `P`'s box is required. A release with the ghost after Card `Q` commits `K`'s placement, `{anchorId: Q, side: after}`: a Stub picked up attached has `isAttached: false` with its original `parentId` preserved; an item brought in Free stays Free with its original `parentId`. No attach into `P` is committed. From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of `K`.
>
> *When* the cursor instead leaves the modal's box without satisfying either pop-out threshold and comes back, *then* the modal stays open, and the drag stays at its Descendants layer. The modal's box includes its header: *when* the cursor rests over the header for well past `popDelayMs`, *then* no pop happens, and the modal stays open.

Reading note: "Card `Q`" in this Then is a Card in `K`, beside the ghost. It can't be the Terms' `Q`, an attached Stub at level `L − 1`, which `K` doesn't draw as a Card.

- DRAG-7.10 r1 (modal opened by a hold, Free Card zoomed in from outside, one pop to K, release after Card Q keeps it Free with its original parentId, {anchorId: Q, side: after}): **Follows the Then.** "exactly one pop closes the modal and takes the drag directly to `K`" and "A release with the ghost after Card `Q` commits `K`'s placement, `{anchorId: Q, side: after}` … an item brought in Free stays Free with its original `parentId`". The Given's "opened by a click or by a hold" covers the hold. Q here is a Card in K, not the Terms' Q.
- DRAG-7.10 r2 (cursor inside P's box but outside the modal's box: one pop to K, not to P's section, no second exit): **Follows the Then.** "exactly one pop closes the modal and takes the drag directly to `K`" and "No further exit from `P`'s box is required." P's box lies inside K, so a cursor there and outside the modal's box is within the When's "outside the modal's box while remaining inside `K`".
- DRAG-7.10 r3 (expanded sub-row K: after the one pop the drag is locked in K, and resting in a sibling sub-row or in Board changes nothing until another pop out of K fires): **Follows the Then.** "bounded by `K`" and "From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of `K`." Read "changes nothing" as applying to the drag's layer and bound. The clock for the pop out of K runs meanwhile (wiki board-drag-interaction §3.1), and the row's "until another pop out of K fires" already allows for that.
- DRAG-7.10 r4 (popDelayMs never satisfied, popDistancePx > 0, one sample at least popDistancePx outside the modal's box, inside K, gives the same single pop): **Follows the Then.** "*when* the cursor satisfies `popDelayMs` or the enabled `popDistancePx` outside the modal's box while remaining inside `K`, *then* exactly one pop closes the modal and takes the drag directly to `K`". Wiki board-drag-interaction §3.1 defines the distance term, and §8 names it as "the shared pop-out threshold". The term is satisfied "once the cursor is at least that far outside the context's box", so one sample at that distance is enough.
- DRAG-7.10 r5 (both the in-list ghost and the carried copy are shortCard after the pop): **Follows the Then.** "shown as shortCard" is said of the drag, not of one copy, so it covers both of the drag's copies. Wiki board-drag-interaction §5a, which defines shortCard, has "both visible copies … the floating DragOverlay copy and the in-list ghost row — render as shortCard" at the Column/sub-row layer.
- DRAG-7.10 r6 (two excursions, each shorter than popDelayMs but longer together, with a return between: the modal stays open because the clock restarts on return; is the reset DRAG-7.10's or only DRAG-1.30's?): **The case is silent, so it needs a session.** The wiki states the outcome and the Then doesn't carry it.
  - DRAG-7.10's Then states one excursion: "leaves the modal's box without satisfying either pop-out threshold and comes back, *then* the modal stays open". It says nothing about a second excursion, or about the clock starting from zero on return.
  - The wiki states that reset for every layer: §3.1 says the pop-out clock "resets when it comes back" and "One clock serves every layer's pop-out". §7.3 says the modal's box is "the box the pop-out clock measures against".
  - DRAG-1.30's Then does state the reset ("the clock resets: a second excursion starts it from zero"), but only in its own Given, a Card locked in its column, not a drag in the modal.
  - So no Then carries the reset for the modal.
- DRAG-7.10 r7 (moving outside the modal's box by less than popDistancePx and coming back leaves it open): **Follows the Then.** "*When* the cursor instead leaves the modal's box without satisfying either pop-out threshold and comes back, *then* the modal stays open, and the drag stays at its Descendants layer". This holds with popDistancePx above 0 and the excursion also shorter than popDelayMs, since "either" includes the clock.

======================================================================
DRAG-1.14: Pop-out by distance: when enabled, either the clock or the distance satisfies

Then, as I read it:
> *then* the item pops out one layer at once. This holds for a column or sub-row (out to Board) and Descendants (out to the column/sub-row containing its Card) alike: one pop-out rule serves every layer. Descendants uses the whole Card's box on the board and the modal's box while the modal holds it. *And given* `popDistancePx` is 0, *when* the cursor moves any distance outside the context for less than `popDelayMs`, *then* no pop happens; only the clock decides.
>
> A single cursor sample decides the distance term, so this case holds at whatever values the test sets; its pass never depends on the tuned values.

- DRAG-1.14 r1 (modal holds Descendants: one sample at least popDistancePx outside the modal's box pops to K at once, before popDelayMs): **Follows the Then.** "the item pops out one layer at once. This holds for … Descendants (out to the column/sub-row containing its Card)", "Descendants uses … the modal's box while the modal holds it", and "A single cursor sample decides the distance term".
- DRAG-1.14 r2 (Free Card locked in expanded sub-row K: one sample at least popDistancePx outside the sub-row's box pops to Board at once): **Follows the Then.** "This holds for a column or sub-row (out to Board)" and "A single cursor sample decides the distance term."
- DRAG-1.14 r3 (popDistancePx 0, modal open, cursor outside the modal's box for less than popDelayMs: no pop): **Follows the Then.** "*And given* `popDistancePx` is 0, *when* the cursor moves any distance outside the context for less than `popDelayMs`, *then* no pop happens". The context's box is "the modal's box while the modal holds it".

======================================================================
DRAG-7.12: The modal's rows keep the drag's classification and Full, Mid or Low tier

Then, as I read it:
> *then* `R` and `R1` are assigned Full. `R1a` is assigned Mid, since its parent `R1` is Valid, while `Y` is assigned Low, since its parent `R1a` is not. The rows keep their drag-start classification and tiers; opening the modal does not recompute them or copy an ancestor's tier onto a descendant. The static section rows under the backdrop take no target tier (DRAG-2.20).
>
> The painted strengths and absence of compounded dimming are DRAG-2.24's.

- DRAG-7.12 r1 (modal opened by a hold during the drag: R and R1 Full, R1a Mid, Y Low): **Follows the Then.** "`R` and `R1` are assigned Full. `R1a` is assigned Mid … while `Y` is assigned Low". The When is "the modal opens during the drag", and during a drag only a hold opens it (wiki board-drag-interaction §9).
- DRAG-7.12 r2 (R, drawn in the section before the modal opens, keeps the tier it had then): **Follows the Then.** "The rows keep their drag-start classification and tiers; opening the modal does not recompute them". R's row in the modal has the Full its section row had before. Its section row under the backdrop then takes no tier (r4).
- DRAG-7.12 r3 (R1, R1a and Y aren't drawn before the modal opens, so only the stated Full/Mid/Low after it opens is asserted, and nothing about their tier before): **Follows the Then.** The stated "Full", "Mid" and "Low" are the drag-start tiers ("The rows keep their drag-start classification and tiers"). The Then gives no tier for a row before it's drawn.
- DRAG-7.12 r4 (section rows under the backdrop carry no target tier while the modal is open): **Follows the Then.** "The static section rows under the backdrop take no target tier". Wiki board-drag-interaction §4.1 agrees: "No tier … for the rows a section draws under the hierarchy modal's backdrop."

======================================================================
DRAG-7.14: The modal hold resets on a gap or level change or leaving the Card, and runs on in its padding

Then, as I read it:
> - *when* the ghost moves to another gap, such as the one below `T`, *then* the hold resets: any cue showing disappears at once, and the modal doesn't open;
> - *when* the ghost, in the gap below the overflow row, is tabbed from level `L + 1` to level `L`, *then* the hold resets the same way, and tabbing back starts a fresh dwell;
> - *when* the cursor leaves the whole Card's box while the ghost stays in its gap, *then* the hold resets the same way, and no dwell runs until the cursor is back inside it;
> - *when* the cursor moves into the Card's title or padding, outside the section's smaller box, while the ghost stays in the same gap and level, *then* the dwell or cue runs on without restarting; completing the hold there opens the modal;
> - *when* the carried copy moves within the gap without the ghost changing gap or level, such as crossing the ghost's middle, *then* the hold runs on. It holds the gap and the level steady, where a Card's zoom-in resets when the named relation changes (DRAG-4.22).
>
> This case asserts the clock's logic, with its thresholds as parameters; its pass never depends on the tuned values. Whether they feel right is DRAG-7.20.

- DRAG-7.14 r1 (cursor leaves the whole Card's box, nothing pops, ghost in its gap: any cue disappears at once, the modal doesn't open, no dwell runs while the cursor is outside): **Follows the Then.** "*when* the cursor leaves the whole Card's box while the ghost stays in its gap, *then* the hold resets the same way, and no dwell runs until the cursor is back inside it". "The same way" is "any cue showing disappears at once, and the modal doesn't open". "Nothing pops" is a condition of the variant (the excursion stays short of the pop-out thresholds), not an outcome this Then states.
- DRAG-7.14 r2 (cursor back inside the Card's box, ghost unchanged: a fresh dwell starts): **Follows the Then.** "the hold resets the same way, and no dwell runs until the cursor is back inside it". Wiki board-drag-interaction §7.3 settles what follows: the hold "runs while the ghost sits directly above or below an overflow row, at that row's level … with the cursor inside the Card's box". So once the cursor is back inside, with the ghost unchanged, the hold runs again from its reset.
- DRAG-7.14 r3 (moved into title or padding during the dwell: the dwell runs on into the cue, and the cue completes into the modal opening, with the cursor still there): **Follows the Then.** "*when* the cursor moves into the Card's title or padding, outside the section's smaller box, while the ghost stays in the same gap and level, *then* the dwell or cue runs on without restarting; completing the hold there opens the modal". Wiki board-drag-interaction §7.3 gives the hold's order: dwell, then cue.
- DRAG-7.14 r4 (same, moved into the padding during the cue): **Follows the Then.** "the dwell or cue runs on without restarting; completing the hold there opens the modal".
- DRAG-7.14 r5 (after the modal opens from the padding, the ghost is still at R's first child): **The case is silent, so it needs a session.** The wiki states the outcome and this Then doesn't carry it.
  - DRAG-7.14's Then says only that completing the hold there "opens the modal".
  - Where the ghost is then is set by wiki board-drag-interaction §7.3: "A hold opens the modal under the cursor, placed so that the ghost's spot among `R`'s children, first or last, sits under it … opening reads the gap and the depth afresh from the cursor".
  - DRAG-7.15's Then states this in its own Given: the hold completing with the cursor still, and a modal placed under the cursor fitting inside the window. That Given doesn't restrict where in the Card the cursor is.
  - Even there, the ghost is at R's first child only for a hold in the gap above the overflow row. At a window edge, DRAG-7.16's ghost needn't be there.

======================================================================
DRAG-7.15: A hold opens the modal with the ghost's spot under the cursor, so a release right after commits the same placement

Then, as I read it:
> *then* the modal opens with the ghost's spot under the cursor: from the gap above the overflow row, the gap before `R1`, at `R1`'s level; from the gap below it, the gap after `R2`, at `R2`'s level. The ghost is there, and it's the gap and the depth the cursor reads over the modal's rows. A release without moving the cursor commits what it would have before the modal opened: `X` first among `R`'s attached children, before `R1`, or last, after `R2` (DRAG-7.3, DRAG-7.4). No pop happened: the drag is still at `P`'s Descendants layer.
>
> The same holds whichever way the cursor came to the gap: moving down to it, from the rows above, or moving up to it, from those below. *And given* the item held carries a subtree, such as a Stub of `P`'s with an attached child of its own, *then* the same holds: the modal opens with the item's spot under the cursor. Its attached child is absent while it is carried (wiki board-drag-interaction §7.2), and a release right after commits the item there, with its child still attached and drawn under it again.

- DRAG-7.15 r1 (item with a subtree, moved UP from below to the gap below R's overflow row: the modal opens with its spot under the cursor, and a release commits it last among R's children, child still attached): **Follows the Then.** The direction comes from "The same holds whichever way the cursor came to the gap: … or moving up to it, from those below". The subtree comes from "*And given* the item held carries a subtree … *then* the same holds … a release right after commits the item there, with its child still attached". The spot comes from "from the gap below it, the gap after `R2`, at `R2`'s level" and "last, after `R2`". The hold needs the ghost at the overflow row's level, `L + 1` (wiki board-drag-interaction §7.3).
- DRAG-7.15 r2 (same for the gap above R's overflow row, from below, with a subtree): **Follows the Then.** The spot comes from "from the gap above the overflow row, the gap before `R1`, at `R1`'s level" and "first among `R`'s attached children, before `R1`". The direction and subtree come from "moving up to it, from those below" and the subtree sentence. The release commits the item first among R's attached children, with its child still attached.
- DRAG-7.15 r3 (the item's attached child is absent from the section and the modal for the whole drag): **Follows the Then.** "Its attached child is absent while it is carried (wiki board-drag-interaction §7.2)". §7.2's "It leaves every list that draws it: the section, the hierarchy modal and the rows a section draws under the modal's backdrop" settles that "absent" means absent from both lists, from pickup to the drag's end.
- DRAG-7.15 r4 (after the release, the child is drawn directly under the item in the modal): **Follows the Then.** "a release right after commits the item there, with its child still attached and drawn under it again". The release is in the modal, which stays open ("After a drag ends in the modal … the modal stays open where it is", wiki board-drag-interaction §7.3). The case's example is one attached child, which is drawn as the item's next row, one level deeper.
- DRAG-7.15 r5 (cursor reaches the aim at R's own row in one sample, not a hover pass: the modal opens, and a release writes what the modal draws): **Follows the Then**, provided the one sample leaves the ghost in the hold's gap at the overflow row's level and the cursor then stays still. "The same holds whichever way the cursor came to the gap" puts no limit on how many samples the approach takes. "The ghost is there, and it's the gap and the depth the cursor reads over the modal's rows. A release without moving the cursor commits what it would have before the modal opened" gives "writes what the modal draws". Which gap a cursor at R's own row gives the ghost is the list's shuffle, which this Then doesn't state.
- DRAG-7.15 r6 (cursor reaches the overflow row's top quarter in one sample: no modal hold runs, the ghost is after the overflow row, and a release writes the same as the modal-hold release at that gap): **Contradicts the Then.**
  - This case's Given is the hold completing: "*Given* the modal hold beside `R`'s overflow row completes with the cursor still". With the ghost after the overflow row at that row's level, its Then opens the modal: "from the gap below it, the gap after `R2`, at `R2`'s level".
  - Wiki board-drag-interaction §7.3 runs the hold whenever the ghost "sits directly above or below an overflow row, at that row's level". So "no modal hold runs" can't hold with the ghost there, even if the release comes before the dwell ends.
  - With the ghost there at level `L` instead, no hold runs, but then a release writes R's next sibling (DRAG-7.4), not the modal-hold release at that gap.
  - Which gap a cursor in the overflow row's top quarter gives the ghost is the list's shuffle, which this Then doesn't state.

======================================================================
DRAG-7.17: When the rows before the ghost's spot run longer than the modal, its list scrolls to put the spot under the cursor

Then, as I read it:
> *then* the modal's list is scrolled so that the spot sits under the cursor, and a release without moving the cursor commits it. From the gap below the overflow row, that's `R` with many attached children, and the release commits `X` last among them. From the gap above it, the spot is just under `R`, so it's many rows before `R`, such as a sibling of `R`'s before it with many attached children of its own, and the release commits `X` first among `R`'s attached children.

- DRAG-7.17 r1 (gap above R's overflow row, a sibling of R before it with many attached children: the list scrolls so the spot is under the cursor, and a release commits first among R's attached children): **Follows the Then.** "the modal's list is scrolled so that the spot sits under the cursor" and "From the gap above it, the spot is just under `R`, so it's many rows before `R`, such as a sibling of `R`'s before it with many attached children of its own, and the release commits `X` first among `R`'s attached children". The sibling needs enough rows that the rows before the spot run longer than the modal can show (the Given). R has no earlier sibling in the Terms tree, so the setup adds one, as the Then's example does.

======================================================================
DRAG-7.18: After leaving the modal, a hold beside an overflow row opens it again in the same drag

Then, as I read it:
> *then* the modal opens again at the same Descendants layer, and a release in it places `X` by gap and depth (DRAG-7.9). It opens as often as the drag needs. No write occurs during the exit, re-entry or modal opening; only the final release commits the selected placement.

- DRAG-7.18 r1 (assert one reopen only; is that enough for "as often as the drag needs"?): **The case is silent, so it needs a session.** The Then reads two ways on "It opens as often as the drag needs".
  - One reading: it only says there's no limit on the one reopening the When names. One reopen asserts that.
  - The other reading: it's an outcome of its own, beyond that reopening. Read that way, the Then gives no number of openings that would show it.
  - The one reopen itself follows "the modal opens again at the same Descendants layer".
- DRAG-7.18 r2 (no request of any kind between pickup and the final release, other than the final write): **Not stated by the Then or the wiki**, for requests that write nothing. "No write occurs during the exit, re-entry or modal opening; only the final release commits the selected placement" covers every write in the drag, so asserting that nothing but the final release writes follows the Then. A request that writes nothing, such as a read, is neither stated nor needed for the rule.
- DRAG-7.18 r3 (re-entry by the full zoom-in hold with the side highlight naming P, for P's own Stub and, separately, for a Free Card from outside): **Follows the Then.** The When is "*when* the side highlight names `P` for the full zoom-in hold, the drag re-enters `P`'s Descendants". The Terms' `X` is either a Free Card zoomed in from outside or a Stub of `P`'s outside the tree, and "a case holds for either, unless it names one", so both variants follow.

======================================================================
DRAG-7.27: The carried item's overflow and its branch's overflow rows are absent during the drag

Then, as I read it:
> *then* its overflow row is absent for the whole drag, not drawn at Low. The gap after `Q` runs to `T`, with neither `R`'s hidden branch nor its overflow row offered as Top, Bottom or the named neighbor. Unrelated overflow rows remain drawn and keep their ordinary counts. *When* `R` is released as `B`'s next sibling, at level 1 (DRAG-4.10), *then* `R.parentId = P`, after `B`, with `R1` and `R2` still its attached children. At level 1, `R` is no longer at the last shown level, so it has no overflow row, and `R1` and `R2` show in the section below it, at level 2.
>
> *Given* instead `Q` is picked up, *then* `R` is in its attached branch: both `R`'s row and `R`'s overflow row are absent. The same holds when Card `P` is picked up and zoomed into another section: no overflow row belonging to `P` or its attached branch is drawn there. On a cancel, the original section and its overflow rows return, with `R`'s overflow reading "2 children".

- DRAG-7.27 r1 (R carried; T given an attached child, so it has an unrelated overflow row that stays drawn with its ordinary count): **Follows the Then.** "Unrelated overflow rows remain drawn and keep their ordinary counts." The tree has no other overflow row, so the clause can only refer to one the setup adds. With one attached child, T's overflow row reads "1 child" (wiki board-drag-interaction §9).
- DRAG-7.27 r2 (R carried: the drop line is never on R's overflow row, and the gap after Q runs to T): **Follows the Then.** "its overflow row is absent for the whole drag, not drawn at Low. The gap after `Q` runs to `T`, with neither `R`'s hidden branch nor its overflow row offered as Top, Bottom or the named neighbor." No cue can be drawn on a row that's absent.
- DRAG-7.27 r3 (Q carried: R's row, R's overflow row and T's row are absent): **The case is silent, so it needs a session**, for T's row. The wiki states the outcome and this Then doesn't carry it. The Then states "both `R`'s row and `R`'s overflow row are absent", giving R's place in Q's branch as the reason, but it doesn't name T. T is Q's attached child, and its absence is wiki board-drag-interaction §7.2's ("It leaves every list that draws it"). DRAG-8.1's Then states that a branch is absent, but in its own setup, not this tree. R's row and R's overflow row follow this Then.
- DRAG-7.27 r4 (P carried and zoomed into another Card's section: no overflow row of P or its branch is drawn there): **Follows the Then.** "The same holds when Card `P` is picked up and zoomed into another section: no overflow row belonging to `P` or its attached branch is drawn there."
- DRAG-7.27 r5 (R released as B's next sibling at level 1: R.parentId = P after B, R1 and R2 still attached children, no overflow row on R, R1 and R2 at level 2 in the section): **Follows the Then.** "*then* `R.parentId = P`, after `B`, with `R1` and `R2` still its attached children. At level 1, `R` is no longer at the last shown level, so it has no overflow row, and `R1` and `R2` show in the section below it, at level 2."
- DRAG-7.27 r6 (on cancel, the original section returns and R's overflow reads "2 children"): **Follows the Then.** "On a cancel, the original section and its overflow rows return, with `R`'s overflow reading "2 children"." The sentence isn't limited to one drag, so it holds for each drag the case names.

======================================================================
DRAG-7.31: A hidden Stub returned to its pickup slot after reopening the modal writes nothing

Then, as I read it:
> *then* no request is sent. `R2.parentId = R`, it remains attached with position `p` and `P`'s workphase, and the modal stays open showing it in that original slot. The modal shows the full hierarchy, so the section's hidden-slot seed doesn't turn this set-down into a move.

- DRAG-7.31 r1 (no request at any point from pickup through the final release, including the pop out, the zoom back and the reopening): **Follows the Then.** "*then* no request is sent" is the outcome of the whole When: "*when* it pops out to `P`'s column, zooms back into `P`, … then reopens the modal by a hold, and the user moves the ghost back … and releases". So it covers the drag that the Given picks up, through the release, not only the release.
- DRAG-7.31 r2 (after the release, the modal is still open and shows R2 in its original slot after R1a and before T at level L + 1): **Follows the Then.** "the modal stays open showing it in that original slot". The When places that slot at "`R2`'s original gap after `R1a` and before `T`, at level `L + 1`".

======================================================================
DRAG-7.32: Closing the Sheet returns to the unchanged modal, and only the next Escape closes the modal

Then, as I read it:
> - *when* the Sheet's X is clicked, *then* only the Sheet closes;
> - *when* the Sheet's backdrop is clicked, *then* only the Sheet closes; the click does not dismiss the modal underneath;
> - *when* Escape is pressed, *then* only the Sheet closes, not both surfaces in the same keypress.
>
> After each, the same modal remains at its prior place, with the same list order, depths and scroll position, and nothing is written. While the Sheet is open, the modal cannot be dismissed by its own X, its backdrop or Escape. Once the Sheet has closed, another Escape closes the modal. This hold applies only to those dismissal gestures: an automatic close because the Card is gone or its hierarchy is empty does not wait for the Sheet (DRAG-7.26, DRAG-7.35).

- DRAG-7.32 r1 (a click on the Sheet's backdrop at the point where the modal's X lies closes only the Sheet and doesn't activate the modal's X): **Follows the Then.** "*when* the Sheet's backdrop is clicked, *then* only the Sheet closes; the click does not dismiss the modal underneath" and "While the Sheet is open, the modal cannot be dismissed by its own X". A click on the Sheet's backdrop counts as that click wherever it lands, including the point over the modal's X.
- DRAG-7.32 r2 (the modal's box, meaning its place on screen, is the same before the Sheet opens and after each of the three closes): **Follows the Then.** "After each, the same modal remains at its prior place". Wiki board-drag-interaction §9's "closing the Sheet, any way it closes, returns to the modal as it was" settles "prior" as the place the modal had when the Sheet opened over it. The Then names the modal's place, which is how the row describes its box.
- DRAG-7.32 r3 (the list scrolled to a non-zero offset before the Sheet opens, with the offset unchanged after each close): **Follows the Then.** "with the same list order, depths and scroll position". A non-zero offset is a setup the Given allows, not an outcome.
- DRAG-7.32 r4 (after each close, one further Escape closes the modal): **Follows the Then.** "Once the Sheet has closed, another Escape closes the modal."

======================================================================
DRAG-7.9: A drag in the modal starts at the Card's Descendants layer and places by gap and depth at any level

Then, as I read it:
> *then* its drag starts at `P`'s Descendants layer, with no pop, as any Stub's does (DRAG-5.9). *When* it's released:
> - in the gap between `R1` and `R1a` → one state, `R1`'s first child: `R2.parentId = R1`, attached, before `R1a`;
> - in the gap between `R1a` and `T`, with `R2` itself passed over, aligned with `R1a` at level `L + 2` → `R2.parentId = R1`, attached, after `R1a`;
> - in that gap at level `L + 1`, its own gap and depth → nothing is written (DRAG-4.29): the modal shows every level, so nothing between Top and Bottom is unseen;
> - in a tab state whose resulting depth exceeds `CAP` → marked invalid, and a release writes nothing (DRAG-4.18);
>
> *then* `R2` stays attached throughout, with `P`'s workphase. The modal offers every placement the section does, and those among hidden rows that the section doesn't (DRAG-7.4).

- DRAG-7.9 r1 (after each of the four releases, R2 is attached with P's workphase, asserted on the saved item): **Follows the Then.** "*then* `R2` stays attached throughout, with `P`'s workphase", together with the four bullets: two writes that keep it "attached", and two releases where "nothing is written".
- DRAG-7.9 r2 (does "throughout" also require asserting R2's attached state during the drag, before release?): **The case is silent, so it needs a session.** "`R2` stays attached throughout, with `P`'s workphase" reads two ways. It may mean across the four releases, that is, what each one leaves saved. Or it may mean across each drag, from pickup to release. Read the second way, the Then names no mid-drag outcome for "attached" beyond its first sentence's "its drag starts at `P`'s Descendants layer, with no pop".
- DRAG-7.9 r3 (does the closing sentence need its own assertion, apart from the four bullets?): **The case is silent, so it needs a session.** The sentence reads two ways.
  - One reading: it's a summary that the bullets and DRAG-7.4 illustrate.
  - The other reading: it's an outcome of its own. Then its first half, "The modal offers every placement the section does", isn't asserted by any of the four bullets, and the Then names no placement of the section's to assert for it.
  - Its second half, "those among hidden rows that the section doesn't", is what the bullets show: placements under `R1` and beside `R1a`, among rows the section hides.

======================================================================
DRAG-7.6: Back in the section, a Stub whose own slot is hidden starts as the Card's last child

Then, as I read it:
> *then* the ghost is in the last gap, below `B`, at level 1, as `P`'s last child. `R1`'s own slot, under `R`, is behind `R`'s overflow row, which reads "1 child" meanwhile (DRAG-7.2). A release then commits `R1.parentId = P`, attached, last among `P`'s attached children, after `B`, with `R1a` still its child. Released in the column instead, before zooming back in, `R1` becomes Free with `parentId = R`, placed by the column's within-action (DRAG-5.1).
>
> *Given* instead `R`, whose slot the section shows, is picked up in the modal and pulled out the same way, *then* back in the section its ghost starts in its own slot, between `Q` and `T`, at level `L`, and a release there writes nothing (DRAG-4.30, DRAG-4.29).

- DRAG-7.6 r1 (P also has an attached Stub X after B: the last gap is below X, and a release commits R1 last among P's attached children, after X): **No verdict: the row is set up outside this case's Given, so it's a question about a different case.** The Given is the tree, where `B` is P's last attached child. The Terms bring in `X` only where a case drags `X`, and this case drags `R1`. The Then names that tree's values: "the ghost is in the last gap, below `B`, at level 1, as `P`'s last child" and "last among `P`'s attached children, after `B`". A tree with another Stub after B isn't this case's Given.
- DRAG-7.6 r2 (released in the column before zooming back in: R1 Free with parentId R, placed by the column's within-action with the {anchorId, side} the ghost's slot names): **Follows the Then.** "Released in the column instead, before zooming back in, `R1` becomes Free with `parentId = R`, placed by the column's within-action". Free means `isAttached` false (wiki board-drag-interaction §8: "A detach writes `isAttached: false` and leaves `parentId` untouched"). The column's within-action is the ghost's slot, named by anchor and side (wiki board-drag-interaction §1.1's table, §2 rule 3), the neighbor the side highlight names.
- DRAG-7.6 r3 (R1a still R1's attached child after the release in P's section): **Follows the Then.** "with `R1a` still its child". "Still" keeps R1a as the Terms set it, R1's attached child.

======================================================================
DRAG-3.25: Every Stub-sized row has one fixed height, with a type pill or without

Then, as I read it:
> *then* each typed row, each untyped row and the overflow row has total height `s`. A type pill fits within the title's line, so it is no taller than that line and does not grow its row. Longer titles and other row content do not change the fixed height.
>
> *When* the hierarchy modal opens, *then* its typed and untyped rows also have height `s`, as do the static section rows still drawn under its backdrop. *When* a typed Stub is picked up from its section or the modal, *then* its in-list ghost and its carried copy each have a box of height `s`; the carried copy's border is inside that height. If the Stub has a branch, the carried copy's second line hangs outside that box and adds nothing to its height; the ghost has none. The same holds for an untyped Stub. No representation's box gains extra height from its pill, padding, content, carried border or branch line (DRAG-8.10).
>
> The case asserts one shared fixed height, without fixing its pixel value. The representation switch and pointer position when a Card zooms into Descendants remain DRAG-3.22's assertions.

- DRAG-3.25 r1 (heights compared with each other, all equal to one s, not against a pixel value): **Follows the Then.** "The case asserts one shared fixed height, without fixing its pixel value."
- DRAG-3.25 r2 (the pill's box is no taller than the title's text line): **Follows the Then.** "A type pill fits within the title's line, so it is no taller than that line and does not grow its row."
- DRAG-3.25 r3 (a row with a long title has height s): **Follows the Then.** "Longer titles and other row content do not change the fixed height."
- DRAG-3.25 r4 (section rows under the modal's backdrop have height s while the modal is open): **Follows the Then.** "as do the static section rows still drawn under its backdrop".
- DRAG-3.25 r5 (the carried copy of a Stub with a branch has box height s, and its second line lies outside, below, that box): **Follows the Then.** "the carried copy's second line hangs outside that box and adds nothing to its height". Wiki hierarchy-placement §8's "It hangs under the copy's box" settles "outside" as below.
- DRAG-3.25 r6 (that Stub's in-list ghost has no second line): **Follows the Then.** "the ghost has none".
- DRAG-3.25 r7 (the carried copy's box height s is the same when picked up from the modal as from the section): **Follows the Then.** "*When* a typed Stub is picked up from its section or the modal, *then* its in-list ghost and its carried copy each have a box of height `s`", and "The same holds for an untyped Stub."

======================================================================
Files read:
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-7-overflow-and-hierarchy-modal.md
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-1-contexts-and-popping.md (DRAG-1.14, DRAG-1.30, DRAG-1.35)
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-3-card-column-bands.md (DRAG-3.25)
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-8-carried-branch.md (DRAG-8.1)
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\README.md
- c:\Users\natha\Dev\KanbanApp\docs\wiki\board-drag-interaction\README.md (§1–§3.1, §4, §4.1, §5a, §6–§9)
- c:\Users\natha\Dev\KanbanApp\docs\wiki\hierarchy-placement\README.md (§1–§8)
```

**Tally (the QA Engineer's count, not the desk's):** 54 rows. 45 follow the Then (DRAG-7.15 r5 on a condition). Six say the case is silent (DRAG-7.10 r6, DRAG-7.14 r5, DRAG-7.18 r1, DRAG-7.27 r3, DRAG-7.9 r2 and r3). One contradicts the Then (DRAG-7.15 r6). One is not stated by the Then or the wiki (DRAG-7.18 r2). One gets no verdict because the row stood outside the case's Given (DRAG-7.6 r1).

### Batch 4c, Stop 2 — the Test Reviewer's first pass (2026-11-11)

Spawned by the QA Engineer on the working tree over baseline `16fe9e07637a66f797a82fb3c2d5c8b01c9e5aed`. The brief gave the case IDs and their tests, the changed files, fifteen corrections after red runs as before-and-after, and the state of the runs; the Coder had listed no Vitest changes and nothing was held off. The harness indented the report; that indent is the only thing removed. The routing of each verdict is in Results.

```text
Test Reviewer, Story 10 batch 4c, Stop 2, first pass (2026-11-11)

**Inputs and reading order.** The tree is the working tree on top of baseline `16fe9e07637a66f797a82fb3c2d5c8b01c9e5aed`. I read in this order:
- the cases (the whole DRAG-7 file, DRAG-1.14, DRAG-3.25, and for the widened scope DRAG-2.22, DRAG-6.15 and DRAG-5.1 to 5.16);
- `docs/test-plans/README.md`;
- wiki board-drag-interaction §1 to §3.1, §4, §4.1, §5a and §7 to §9, and hierarchy-placement §1 to §8;
- the batch 4c desk replies and the proof plan;
- the five specs;
- the helpers `overflowTree.ts`, `boardDragSurface.ts`, `dragGesture.ts`, `requestHarness.ts` and `boardLocators.ts`;
- `popSession.test.ts`, where a clause turned on an internal test.

**App source.** The only app file I read is `client/src/components/workflow/AGENTS.md`, for the test-attribute contract. It was attached when I opened `popSession.test.ts`.

**Limit.** I had no shell, so I ran no `git diff`. I judged the tests as they stand now, and judged each correction from the brief's before-and-after.

**Form.** The brief gave reasons for three corrections: #7 ("its Given: …"), #9 ("which is the Card's") and #10 ("T1 is a hidden row"). Its run-state note also gives a reason for #6 ("so the earlier clauses … are still checked"). I judged all four from the before-and-after and the Then alone.

---

## Verdicts: assigned cases

### DRAG-7.6: Test gap
Clauses the tests prove:
- **"the ghost is in the last gap, below B, at level 1"**: `awaitProjection('6:0:true')` in `tests/ui/drag-7-hierarchy-modal.spec.ts` "DRAG-7.6, DRAG-7.2: a Stub whose own slot is behind an overflow row starts back in the section as P's last child…".
- **"R's overflow row … reads '1 child' meanwhile"**: the same test, read from the screen.
- **"R1.parentId = P, attached, … after B"**: the same test, from the saved item.
- **"back in the section its ghost starts in its own slot, between Q and T, at level L, and a release there writes nothing"**: "DRAG-7.6: a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing". It checks the projection at `2:L-1`, no write, and the saved item unchanged.
- **"Released in the column instead … Free with parentId = R, placed by the column's within-action"**: "DRAG-7.6: released in the column before zooming back in…". The column context is asserted, the request carries the anchor and side the drop line draws, and the saved item has isAttached 0 and parentId R.

Gaps:
1. **The pull-out isn't confirmed (check 3).** The spec's `pullOutAndZoomBack` asserts that the modal closes. It never asserts that the drag reached P's column before the zoom back. Its final `awaitDragContext(descendants)` would pass at once if the drag had never left Descendants.
   - In "…comes back in that slot…" this can pass for the wrong reason: with no pop and no zoom, the cursor at the section's middle reads R's own slot, and the release writes nothing.
   - Fix: inside the helper, wait for the column context between the modal closing and the hover back onto P, as the third DRAG-7.6 test does.
2. **"with R1a still its child"**: the hidden-slot test asserts only R1a.parentId. The desk (7.6 r3) reads "still" as keeping R1a as R1's attached child, so R1a.isAttached should be asserted too.

### DRAG-7.9: Test gap
Clauses the tests prove:
- **"starts at P's Descendants layer, with no pop"**: `awaitDragContext` right after the pickup, in "DRAG-7.9, DRAG-7.28: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1's first child".
- **Bullet 1 (R1's first child, attached, before R1a)**: the same test. Projection `4:4:true`; saved with parent R1, isAttached 1 and position below R1a's.
- **Bullet 2 (after R1a)**: "DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1's last child, after R1a". The Given is asserted first (R2 under R, attached, in Todo; R1a the row before it). Projection `5:4:true`; saved under R1, attached, after R1a.
- **Bullet 3 (own gap and depth, nothing written)**: "DRAG-7.9, DRAG-7.19: set back down in its own gap and depth…".
- **Bullet 4 (past CAP: invalid, nothing written)**: "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…". CAP is read from the board's `itemDepthCap`, and the projection's valid flag is false.
  - This test uses its own deep tree and carries X instead of R2, because the Terms' tree can't reach CAP. Every clause still holds.
- **"R2 stays attached throughout, with P's workphase"**, read as the saved item after each of the four releases (desk r1): all four tests.

Gap:
1. **Bullet 1's "→ one state"**: no test tries a second offset in the R1/R1a gap; the first-child test aims at one x only. DRAG-7.3's test in `drag-7-overflow-row.spec.ts` shows how: tab ±5 and check that the projection stays at `4:4`.

Already routed to a Planner session: whether "throughout" covers the drag before the release, and whether the closing sentence needs its own assertion (desk r2 and r3; Open questions item 3).

### DRAG-7.10: Test gap
Clauses the eight passing matrix variants prove (hold-stub and hold-free, in "DRAG-7.10[, DRAG-1.14]: … pops once to … on …, Free, and a release after Card Q writes that placement"):
- **"exactly one pop closes the modal and takes the drag directly to K"**: the modal is gone, `data-drag-state` is locked, and `data-drag-context` is K.
- **"Free"**: the item's row in K is a Card (role article), and the saved item has isAttached 0.
- **"bounded by K"**: `withinExcess` ≤ 2 px, on the x axis for a merged column and on both axes for a sub-row (wiki §2). It is read from the painted box during the carry, and its header says it reads the screen.
- **"{anchorId: Q, side: after}"**: the drop line is on CardQ, after it, and one request is sent with that anchor and side, no parentId, and isAttached not true.
  - "a Stub picked up attached has isAttached: false with its original parentId": the hold-stub variants.
  - "an item brought in Free stays Free with its original parentId": the hold-free variants. Z's parent is null before and after, which still catches an attach into P.
- **"No attach into P"**: one request, with no parentId.
- **"From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of K"**:
  - "DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row": the drag is locked in K after the first pop, and reaches popped-out with no context only when K's clock runs out.
  - "DRAG-7.10: in an expanded sub-row, the sibling sub-row beside it is not reached…": the Given is asserted (the point is below K and nearer than the distance). The drag stays locked in K, the drop line and the request are K's, and the item is saved in K's workphase.
- **One excursion that satisfies neither threshold**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion out of the modal shorter than the pop-out delay…" and "DRAG-7.10: an excursion out of the modal shorter than the pop-out distance…". The second asserts its Given: the point is outside the modal and nearer than the distance.
- **The header**: "DRAG-7.10: the modal's header is part of the modal…".

Gaps:
1. **"shown as shortCard", for the ghost** (desk r5 reads it as both copies). The matrix asserts the carried copy's `data-drag-overlay-form` is short-card. It checks the ghost only for role article, which a full Card also has. B17 and B23 in `drag-5-stub-detach.spec.ts` show how: assert the ghost's box height equals the short-card copy's.
2. **"No further exit from P's box is required"** has no passing test.
   - `rest.owner === 'P'` is asserted only for the click arrival, and those five tests are red.
   - In the passing variants, `restPoint` may fall back to CardQ, outside P's box, and nothing records which point it used.
   - Fix: assert the owner is 'P' wherever a point in P exists, at least in the passing "…reaching Board takes another pop out of the sub-row" test, which rests at 'P' after a click.

**The red click arrival, left as written.** The click arrival fails "bounded by K" in four matrix variants and in "DRAG-7.10: resting beyond P's box, inside its column…". These tests assert the clause as the Then states it, so this is neither a test gap nor a case gap. Whether the wiki or the code is wrong is a ruling (test-plans README, "When a test for a case fails"). Until it is made, no passing test proves the click arrival.

Already routed: the two-excursion reset (desk r6; Open questions item 1).

### DRAG-7.12: Test gap
Clauses `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.12: a modal a hold opens carries the drag's tiers…" proves:
- **R and R1 Full, R1a Mid, Y Low**: `data-drop-tier` reads parent, anchor and neither on the modal's rows. This is an attribute the app provides, and the spec's comment maps the names to the tiers.
- **The Given (R and R1 Valid, R1a Depth-capped)**: `data-drop-state`, read once the modal draws those rows (desk r3).
- **"does not recompute them"**: R's tier in the section before the modal opens equals its tier in the modal (desk r2).
- **"or copy an ancestor's tier onto a descendant"**: Y is Low under a Mid R1a.

Gap:
1. **"The static section rows under the backdrop take no target tier"** is asserted as zero `[data-drop-tier]` inside article P. Nothing first shows that the section still draws rows there, so the count would also pass if it drew none. Assert one static row first, as the `staticRow` helper in `drag-stub-row-height.spec.ts` finds them.

### DRAG-7.13: Test gap
Clauses the tests prove:
- **Silent dwell, then the cue on R's overflow row, then the modal opening at P's Descendants layer**:
  - "DRAG-7.13: a Free Card zoomed into P and held above R's overflow row…". The Given is asserted first: Free with a null parent (`seedFreeCard`), and projection `3:3` before the hold.
  - The Stub version, "DRAG-7.13: a hold above R's overflow row…".
- **A release before the cue completes leaves the modal closed and commits R's first child**: "…commits a Free Card zoomed in above R's overflow row…" and the Stub version.
- **The same below the overflow row, at L+1, as R's last child**: "…held below R's overflow row, at its level, opens the modal as R's last child" and "…zoomed in below R's overflow row…".
- **B, P's own Stub, opens it too**: "DRAG-7.13: any item at the layer opens it: B…".

Gap:
1. **"a visible cue shows on R's overflow row"**: `cueOn` is checked with `toHaveCount(1)`. That proves the element is in the DOM, not that it can be seen. Assert it is visible: a painted box with height and some width, a beat into the cue.
   - `cueOn` also matches a substring of an inline style and names an app internal (`dragChrome.tsx::ZoomCue`). It doesn't use an attribute the app provides for tests.

### DRAG-7.14: Test gap
Clauses the tests prove:
- **Bullet 2 (a tab from L+1 to L resets the hold and the cue goes; tabbing back starts a fresh dwell)**: "DRAG-7.14: the hold starts over when the ghost changes level or gap".
- **Bullet 3 (leaving the whole Card's box)**: "DRAG-7.14: the cursor leaving the whole Card's box ends the hold…".
  - The ghost stays in its gap (`3:3`), the hold reads null, the cue is gone, there's no modal and no pop.
  - The hold still reads null after the dwell's length plus slack, and a fresh dwell starts on return.
- **Bullet 4, during the cue**: "…moving into the Card's title or padding during the cue…". A restart would read dwell, so the single read after 100 ms tells run-on from restart. Completing the hold there opens the modal, and the point is asserted inside the Card and left of the rows.
- **Bullet 5**: "DRAG-7.14: the carried copy moving within the gap…". With a 1.5 s dwell, a restart would read dwell.
- `popSession.test.ts`'s DRAG-7.14 tests are in the approved clock category and back the logic of bullets 1 to 3.

Gaps:
1. **Bullet 4 during the dwell, "runs on without restarting"**: in "…during the dwell lets the hold run on…", a restarted dwell would also read dwell 100 ms later and also complete within `opens(tuning)`. Nothing tells run-on from restart. Two ways to close it:
   - a comparative wait: move into the padding late in a long dwell, then require the cue within the dwell's remainder plus a margin smaller than the dwell;
   - or a `popSession.test.ts` test, in the clock category that is approved outright: the cursor moves within the layer, the target is unchanged, and the hold keeps its `since`.
2. **Bullet 1 (another gap)**: in "the hold starts over…", the step to another gap asserts only that `data-drag-modal-hold` is null. It doesn't confirm the ghost changed gap (no projection read after the hover to A), or that the cue is gone from the screen.

Already routed: where the ghost is after the hold completes in the padding (desk r5; Open questions item 4).

### DRAG-7.15: Test gap
Clauses the tests prove:
- **The spot under the cursor, for both gaps, both approaches, and with or without a child.** All eight combinations are covered:
  - the five "DRAG-7.15: held from above|below, to the gap above|below R's overflow row, for an item…" tests;
  - "DRAG-7.15, DRAG-7.19: the modal opens with the ghost's spot under the cursor…", from below to both gaps, without a child;
  - "DRAG-7.15: held from above, down to the gap above R's overflow row…", without a child.
- Each asserts that the cursor is inside the modal, that the ghost's painted row is under the cursor, and that the drag is at P's Descendants layer. `placementShown`, read from the painted rows, gives R's first child before R1 or R's last child after R2, and the release writes that parent and order.
- **"Its attached child is absent while it is carried … drawn under it again"**: the child is absent from the whole page during the drag, and is the item's next row in the modal after the release.
- **The single-approach variant** (desk r5): "DRAG-7.15: reaching R's row in a single approach…".

Gap:
1. **"X first among R's attached children"**: isAttached isn't asserted after the release; `expectReleaseCommitsShown` checks parent and order only. In the child variants the item is still drawn in the modal after the release, which shows it's attached; the no-child variants show nothing.
   - Fix: add `placed.isAttached === 1` to `expectReleaseCommitsShown`.
   - Separately, the Given's "attached child of its own" is checked by parentId only.

Already routed: the overflow row's top-quarter aim (desk r6; Open questions item 2).

### DRAG-7.17: Test gap
Clauses the tests prove:
- **From the gap below**: "DRAG-7.17: when R's children run longer than the modal…". The list is scrolled (`scrollTop` > 0), the spot is under the cursor, and the release, with the cursor unmoved, commits X after E19.
- **From the gap above**: "DRAG-7.17: from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too". A sibling S with 20 children comes before R. The list is scrolled, the spot is under the cursor, and the release commits X before R1.

Gap:
1. **"commits X last among them" and "first among R's attached children"**: neither test asserts isAttached after the release. This is the same fix as DRAG-7.15's.

### DRAG-7.18: Proves the case
- **The Given (a hold opened the modal, then a pop out to P's column)**: both "DRAG-7.18: after leaving a modal a hold opened, P's own Stub | a Free Card zoomed in…" tests assert the first opening at Descendants, the column context after the pop, and the modal gone.
- **The When**: the side highlight names P for the full zoom-in hold, the drag reaches P's Descendants again, and the projection reaches `3:3` beside the overflow row.
- **"opens again at the same Descendants layer"** and **"a release in it places X by gap and depth"**: the saved item is R's first child, before R1.
- **"No write occurs during the exit, re-entry or modal opening"**: no writes before the release.

One reopen is asserted (desk r1; Open questions item 5). The release isn't checked for isAttached, which this Then doesn't name.

### DRAG-7.27: Test gap
Clauses the tests prove (all in `tests/ui/drag-7-overflow-row.spec.ts`):
- **R carried** ("DRAG-7.27: a dragged R carries its overflow row and its branch…"):
  - the Given is asserted first ("2 children" and T's "1 child");
  - R's overflow row and branch are absent at pickup and again at the aim below B;
  - the gap after Q runs to T (section rows A, Q, R, T, T's overflow row, B);
  - the line is never on R's overflow row;
  - T's overflow row keeps "1 child";
  - the release saves R under P, after B, with R1 and R2 still its children; R's attachment shows because they're drawn in the section;
  - R has no overflow row afterwards, and there is one write.
- **The cancel**: "DRAG-7.27: cancelling a drag of R brings its overflow row back…".
- **Q carried**: "DRAG-7.27: a dragged Q carries R…".
- **P carried into another Card**: "DRAG-7.27: P carried and zoomed into another Card's section…". The Given is asserted: CAP ≥ 7, and P's two overflow rows are drawn.

Gap:
1. **"R1 and R2 show in the section below it, at level 2"**: the test checks their order only. Their indent (`descendantsIndentPx(1)`) isn't asserted.

Already routed: whether T's row is also absent when Q is carried (desk r3; Open questions item 6).

### DRAG-7.28: Test gap
Clauses the tests prove:
- **"R1's Sheet opens … available for interaction"; "not the root Card P"; "the modal stays open at the same place with the same hierarchy"; "writes nothing"**: "DRAG-7.28: a click on a row in the modal opens that item's Sheet above it". It reads the heading, the modal's box, `modalState`, a title edit opened, and no writes.
- **"carrying that row opens no Sheet"**: "DRAG-7.28: carrying a row in the modal opens no Sheet…" checks the Sheet stays closed before, during and after the release.
- **"The drag still places by gap and depth"**: parent R1 in that test, plus the saved order (R2 before R1a) in "DRAG-7.9, DRAG-7.28: a drag in the modal starts…".

Gaps:
1. **"opens above the modal"**: the test clicks the Sheet's title "where the modal lies under it", but nothing checks that the point lies inside the modal's box. If the two don't overlap, the click shows the Sheet takes input, not that it's in front of the modal. Fix: `expectInside(modal, point)` on the clicked point.
2. **"When instead a press on R1 starts its drag"**: both drag tests press R2. The Then pairs the click and the press on the same row, R1. Carry R1, or a Planner session can change the case to "a row".

### DRAG-7.31: Proves the case
`tests/ui/drag-7-hierarchy-modal.spec.ts` "DRAG-7.31: a hidden Stub returned to its pickup slot after reopening the modal writes nothing…":
- **The Given**: R2 is under R, attached, in Todo, before the pickup.
- **The When**: the ghost starts as P's last child (`7:0`), the modal reopens by a hold (`3:3`, modal visible), and the ghost returns after R1a and before T, at R2's level (`5:3`).
- **"no request is sent"**: recorded from before the pickup through the release.
- **"R2.parentId = R, … attached with position p and P's workphase"**: the saved item.
- **"the modal stays open showing it in that original slot"**: the row order and the indent.
- The `7:0` seed only arises from a zoom back from the column, so `pullOutAndZoomBack`'s unconfirmed column step (DRAG-7.6, gap 1) can't let this test pass wrongly.

Minor case gap for a Planner session: `watchWrites` records non-GET requests only, so the test proves "no write". The title says "writes nothing", but the Then says "no request is sent". The board polls notifications by GET every 15 s, so the literal reading can't be meant. The Then could say "nothing is written".

### DRAG-7.32: Proves the case
The four "DRAG-7.32: closing the Sheet over the hierarchy modal by Escape | its X | its backdrop | its backdrop over the modal's own X…" tests, each from a fresh state:
- **The Given**: the list is scrolled to 30 and read back, and the Sheet is open, in place, with R1's heading.
- **"only the Sheet closes"**: the Sheet slides out and the modal stays visible.
- **"the same modal remains at its prior place, with the same list order, depths and scroll position"**: box equality and `modalState` equality (rows, titles, indents, `scrollTop`).
- **"nothing is written"**.
- **"the modal cannot be dismissed by its own X, its backdrop or Escape"**: the click over the modal's X, the backdrop click and Escape each leave the modal open.
- **"another Escape closes the modal"**.

Note: the spec's comment says an Escape pressed while the Sheet slides in was lost in 4 of 40 runs, and calls that "a question for the case's owner (the Open questions)". The plan's Open questions, as I read them, don't hold it. I don't read it as a case gap: wiki §9 has Escape close the Sheet, with no exception while it enters. It's an adjacent finding about the app, for Nathan or the PO, and it should be recorded where the comment says it is.

### DRAG-1.14: Proves the case, with one proposed mapping
Clauses the tests prove:
- **"one pointer sample decides", for the modal's box, out to K with every clock off**: the hold-stub and hold-free distance variants of the DRAG-7.10 matrix. One `moveOnce` lands at least 150 px outside the modal, and the drag is in K.
- **For a sub-row, out to Board**: `tests/ui/drag-5-stub-detach.spec.ts` "DRAG-1.14: a yank past the pop-out distance from an expanded sub-row, with every clock off, pops it to Board". The Given is asserted (24 px seeded, locked in the sub-row), then one sample, then popped-out with no context.
- **For the Card's box, out to the column**: "DRAG-1.14: a yank past the pop-out distance, with every clock off, pops Descendants -> Column…". The detach on release shows it landed in the column.
- **"given popDistancePx is 0 … for less than popDelayMs, then no pop happens"**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion out of the modal shorter than the pop-out delay…".
- The click-arrival distance variants are red, but their DRAG-1.14 clauses are also proved by the passing hold variants.

**"Descendants uses the whole Card's box"** isn't told apart from the section's box by any DRAG-1.14 carrier. B25 does that; see the proposed mappings. Without that mapping, this clause is a test gap.

### DRAG-3.25: Test gap
Clauses the tests prove (all in `tests/ui/drag-stub-row-height.spec.ts`):
- **Typed rows, untyped rows, long-title rows, rows with a child, and the overflow row all have height `s`; the pill is no taller than the title's line**: "DRAG-3.25: a section's typed, untyped and long-title Stub rows and its overflow row are one height…". Heights are compared with each other only.
- **The modal's rows have height `s`**: "DRAG-3.25: the hierarchy modal's typed and untyped rows and the section's rows under its backdrop are one height".
- **After a pickup, the ghost and the carried copy have height `s`, the border inside it; with a branch, the second line hangs below the copy's box, adds nothing to its height, and the ghost has none**: the eight "DRAG-3.25: a typed|untyped Stub … picked up from its section|the modal…" tests.

Gaps:
1. **"the static section rows still drawn under its backdrop" have height `s`**: `staticRow` takes the title's parent as the row's box and never checks that. If that parent is an inner content box, a static row grown by padding would still read `s`.
   - Fix: first establish, on a registered row, that `itemRow(page, b.id)`'s box equals the box of B's title's parent.
2. **"When a typed Stub is picked up"**: the pickup tests never confirm the Stub is typed, for example that its pill is drawn, as the first test does. The plan notes that `seedItem`'s `type` option is unchecked, so a seeding slip would make the typed variants untyped without anything failing.

---

## Verdicts: widened scope (every ID on a test in a changed file)

- **DRAG-7.1, DRAG-7.3, DRAG-7.4, DRAG-7.5, DRAG-7.22, DRAG-7.24, DRAG-7.29** (`drag-7-overflow-row.spec.ts`): Proves the case. Each carrying test still asserts its Then. `seedOverflowTree` seeds the same tree, X included, with Y off by default.
- **DRAG-7.2**: Proves the case.
  - The count tests in `drag-7-overflow-row.spec.ts` carry it.
  - "DRAG-7.6, DRAG-7.2: …" carries "1 child" while R1 is dragged.
  - The existing internal pointer `descendantsSection.test.ts` "DRAG-7.2: leaves the dragged item out of the count, and draws none when it was the only child" carries the only-child clause, which the deleted skipped test also carried. The deletion goes in the living-docs handoff.
- **DRAG-7.7, DRAG-7.8, DRAG-7.11, DRAG-7.19, DRAG-7.23, DRAG-7.25, DRAG-7.26, DRAG-7.33, DRAG-7.34, DRAG-7.35** (`drag-7-hierarchy-modal.spec.ts`, and `drag-7-modal-hold.spec.ts` for DRAG-7.19 and DRAG-7.25): Proves the case.
  - DRAG-7.7's fixture has an extra Stub X after B, so its expected rows end in X. Every clause of the Then still holds with X as an extra last row.
- **DRAG-7.16, DRAG-7.21** (`drag-7-modal-hold.spec.ts`): Proves the case.
- **DRAG-1.1, DRAG-4.12, DRAG-5.1, DRAG-5.2, DRAG-5.3, DRAG-5.4, DRAG-5.9, DRAG-5.10, DRAG-5.13, DRAG-5.14, DRAG-5.15, DRAG-5.16** (`drag-5-stub-detach.spec.ts`): Proves the case.
  - I read each test against its Then. Per the brief, the file's only new test is the sub-row DRAG-1.14 one.
  - The `boardDragSurface.ts` helpers these tests use read as the tests expect. Without a diff I can't confirm `expectWithin` is unchanged in behavior, but it now polls `withinExcess` ≤ 2, which matches its message.
  - For DRAG-1.1, these tests carry only the Stub-start rows; its other rows are carried in other files, outside this pass.
- **DRAG-2.22** (Open): Test gap.
  - "DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold…" carries only the Depth-capped owner clause: no dwell, no cue, no modal. It reads the projection's invalid flag and doesn't assert R's `data-drop-state` depth-capped (the Given).
  - Two clauses have no test in these files: "a Mid Card … no zoom-in dwell or progress cue" and the Cycle-forming owner. For two others, see the mappings below.
  - DRAG-2.22 isn't assigned to 4c.
- **DRAG-6.15** (Open): Test gap. "DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal…" carries one cause (another item's failed drop) in one context (the modal).
  - Its assertions are good: the drag has ended, no carried copy, the rows as the server has them, one write in all, and none after the pointer comes up.
  - The stale-reindex cause, the column-reorder cause, and the column/sub-row and section contexts have no surface test here. `useBoardDnd.test.ts` carries the ID internally, without an approved mapping.
  - DRAG-6.15 isn't assigned to 4c.

---

## Cross-cutting

1. **L is pinned to today's default (check 2).**
   - `overflowTree.ts` builds its tree "with the section at its default of three levels".
   - The specs then pin depths that follow from L = 3, both in projection literals (`3:3`, `6:3`, `5:3`, `4:4`, `7:0`, `'6:0'`) and in indents.
   - No spec seeds `sectionLevels`; the overflow-row spec reads `DEFAULT_DRAG_TUNING.sectionLevels`, but the tree still assumes 3.
   - A retune would fail these tests loudly rather than let them pass wrongly. Still, the Thens name L, so the value should be the test's own: seed `sectionLevels: 3` in the specs' tunings.
2. **Helper headers (check 4).**
   - `overflowTree.ts`: `placementShown` (the screen), `pointOutsideModal` (the screen) and `holdFreeAt` (`data-drag-context`) say what they read. These don't:
     - `dropLineOn` reads the app's `data-drop-side` and the nearest row's `data-item-id` or `data-overflow-row`;
     - `rowIds` and `sectionRows` read those attributes in DOM order, not painted order. That's fine after a drag ends and at a ghost's own slot, but the header should say so;
     - `modalState` reads DOM rows, button text, computed padding and `scrollTop`;
     - `expectCentered` and `expectInside` read the screen;
     - `holdAt` waits on `data-drag-context`.
   - `boardDragSurface.ts`: `zoomIntoCard` and `withinExcess` say what they read. The file header covers screen geometry only, not these:
     - `releaseMove` reads the network answer;
     - `expectOneMove` reads the recorded requests;
     - `paintedCardOrder` reads `aria-label` plus the painted box.
   - `dragGesture.ts`: `awaitProjection`'s header says "the gap counted among all the section's rows". The app counts the rows behind an overflow row too (AGENTS.md: "a gap among *all* the rows"), and correction 10's 4 → 5 turned on exactly that. The header should say "every row of the Card's hierarchy, those behind an overflow row included".

---

## Corrections after a red run

1. **DRAG-7.10, hold-free: Z seeded before P instead of last.** Accepted. This changes how the state is reached. Z's parent is still null before and after, which still catches an attach into P.
2. **1280×720 → 1800×1100 window.** Accepted.
3. **Re-measured aim passes, `leanAtGhost`, then a poll of the drop line.** Accepted. The poll waits without moving, and the line must still be on CardQ, after it.
4. **Zoom hold 650 + 350 → 1500 + 800.** Accepted. An aim slower than 2.3 s would zoom Z into CardQ and fail the test, not pass it.
5. **`popDistancePx` 24 → 150.** Accepted. The case holds at whatever value the test sets, and one sample still decides.
6. **"Bounded by K" measured at the drop line but asserted last.** Accepted. The bound is still ≤ 2 px; only the order changed.
7. **Sibling sub-row test: `popDistancePx` 24 → 60.** Accepted. The Given is now asserted (below K, nearer than the distance), and the Then still holds.
8. **DRAG-7.13: Z seeded before P.** Accepted.
9. **DRAG-7.14, two changes.** Both accepted.
   - The wait: dwell + cue (60 s) → the dwell's length plus slack. With a 60 s cue, any hold that started during the wait would still read non-null at its end, so the check is as strong over its window.
   - The padding point: the new point is asserted inside the Card and left of the rows.
10. **DRAG-7.27: gap 4 → 5, and a re-aiming poll for "P carried".** Accepted. The 5 only checks the aim was reached; the Then's outcome (after B, level 1) is asserted on the saved item. The poll for P carried is an aim.
11. **DRAG-7.31: the x for the return aim.** Accepted. The expected projection `5:3` comes from the Then.
12. **DRAG-3.25: the row's first button instead of the exact title.** Accepted. A wrong press would fail the Descendants context or the heights. Asserting which item is carried would make it airtight.
13. **DRAG-7.17 above: a poll that re-aims until the projection matches.** Accepted. Aims short of R's gap read R's level, where no hold runs. To be airtight, also assert the running hold names R (`awaitModalHold(page, /^<R>:/)`) before the modal opens.
14. **DRAG-7.32: one test closing four times → four fresh tests, each waiting for the Sheet to be in place.** Accepted. This reaches the Given, and every clause holds. The lost-Escape observation still needs recording (see DRAG-7.32).
15. **DRAG-7.10 excursions: two 800 ms excursions with a literal delay → one excursion per test, with seeded values.** Accepted. The two-excursion reset isn't in DRAG-7.10's Then (desk r6). Its coverage now rests on the Coder's clock test (Stop 3) and the Planner's answer to item 1.

## Held-off cases
None.

## Proposed mappings
1. **DRAG-1.14** onto `tests/ui/drag-5-stub-detach.spec.ts` "DRAG-5.15: B25 title is inside the whole Card and releases the first-child gap" and "DRAG-5.15: B25 padding is inside the whole Card and releases the first-child gap". These are surface tests, so no approval is needed. With `popDistancePx` 8, a point in the Card's title or padding, asserted further than the distance above the first row, pops nothing for twice `popDelayMs`. That shows "Descendants uses the whole Card's box".
2. **DRAG-2.22**, for two of its clauses. These are surface tests, so no approval is needed. The case isn't assigned to 4c; this is for the Reconciler or a later batch.
   - "An overflow row belonging to the carried branch is absent": onto `tests/ui/drag-7-overflow-row.spec.ts` "DRAG-7.27: a dragged R carries its overflow row and its branch…" and "DRAG-7.27: a dragged Q carries R…".
   - "A Full overflow row with a Valid owner retains the ordinary valid hold behavior": onto `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.13: a hold above R's overflow row is a silent dwell…".

No internal mapping is proposed. Where the surface tests cover a whole case, an internal test isn't mapped beside them. The one internal test that would close a gap, DRAG-7.14's run-on during the dwell, doesn't exist yet.
```

**`/code-review` at `medium`** on `tests/helpers/overflowTree.ts` and `boardDragSurface.ts` (the QA Engineer's own self-check, not a reviewer verdict) returned seven findings, recorded with their actions in Results.

### Batch 4c, Stop 2 — the Test Reviewer's second pass (2026-11-11)

The same reviewer agent, continued. Its first attempt at this pass was cut off by a usage limit before any verdict; it was restarted on tree `0b49e31e624d18ada551bd480d72493fe94911ef`. The brief gave the changes made for the first pass's gaps, the lint-only edits, and the one correction made since (DRAG-7.17's gap-above test), before and after. The report is word for word.

```text
Test Reviewer, Story 10 batch 4c, Stop 2, second pass (2026-11-11)

**Inputs.** I read the files as they stand on disk, which the coordinator gives as tree `0b49e31e624d18ada551bd480d72493fe94911ef`. I have no shell, so I couldn't check that tree ID or diff it. I judged each change from its before-and-after.

**Scope.** This pass covers:
- every case I gave a Test gap in the first pass;
- every case the changes touch. Change 1 reaches DRAG-7.31. The `holdFreeAt` change (14) reaches DRAG-7.10's hold-free variants, DRAG-7.13's Free Card tests and DRAG-7.18. The B25 retitle (13) reaches DRAG-1.14 and DRAG-5.15;
- the one correction after a red run;
- the new check 7, with cost notes at the end.

**Form.** The brief carried reasons and arguments in three places:
- "it goes to a clock test in popSession.test.ts, a Coder handoff";
- "cross-cutting item 1 is answered by the guard in seedTree rather than by seeding";
- "Changes with no assertion or setup effect".

I judged each of these from the before-and-after and the Then alone. The cosmetic changes do read as having no effect: unused imports and names removed, `{ cause: error }` added, and the §4.1 comment.

---

## Verdicts

### DRAG-7.6: Proves the case
- **"ghost in the last gap, below B, at level 1"**: `awaitProjection('6:0:true')`, in `tests/ui/drag-7-hierarchy-modal.spec.ts` "DRAG-7.6, DRAG-7.2: a Stub whose own slot is behind an overflow row starts back in the section as P's last child…".
- **"R's overflow row … reads '1 child' meanwhile"**: the same test, read from the screen.
- **"R1.parentId = P, attached, … after B, with R1a still its child"**: the same test. It now asserts R1a's parentId and isAttached.
- **The When's pull-out to P's column**: `pullOutAndZoomBack` now waits for `data-drag-context` to match `/^column:/` between the modal closing and the hover back onto P. A drag that never left Descendants can no longer pass.
- **"back in the section its ghost starts in its own slot, between Q and T, at level L, and a release there writes nothing"**: "DRAG-7.6: a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing". Its zoom back now passes through the column.
- **"Released in the column instead … Free with parentId = R, placed by the column's within-action"**: "DRAG-7.6: released in the column before zooming back in…".

### DRAG-7.9: Proves the case
- **"starts at P's Descendants layer, with no pop"**, and **bullet 1, "one state, R1's first child: … attached, before R1a"**: "DRAG-7.9, DRAG-7.28: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1's first child". Offsets of −3, +3 and 0 levels from the aim each read `4:4:true` before the release. The saved item has parent R1, isAttached 1, Todo, and sits before R1a.
- **Bullet 2**: "DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1's last child, after R1a".
- **Bullet 3**: "DRAG-7.9, DRAG-7.19: set back down in its own gap and depth…".
- **Bullet 4**: "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…".
- **"R2 stays attached throughout, with P's workphase"**, as saved after each release: all four tests.
- Still with a Planner session: desk r2 and r3, Open questions item 3.

### DRAG-7.10: Proves the case, with five tests red at one clause, which needs a ruling
Clauses the matrix proves, in "DRAG-7.10[, DRAG-1.14]: … pops once to … on …, Free, and a release after Card Q writes that placement":
- **"exactly one pop … directly to K"**: the modal is gone, the state is locked and the context is K.
- **"Free"**: the item's row in K is an article, and the saved item has isAttached 0.
- **"shown as shortCard"**: the carried copy's `data-drag-overlay-form` reads short-card. The ghost's box height now equals the copy's within 0.05 px, which a full Card with no description wouldn't match.
- **"bounded by K"**: `withinExcess` is at most 2 px.
- **"{anchorId: Q, side: after}"**: one request, no parentId, isAttached not true.
  - A Stub keeps its parentId with isAttached 0.
  - A Free Card keeps its parentId and stays Free.
- **"No attach into P"**.

Clauses other tests prove:
- **"No further exit from P's box is required"**: "DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row" and "DRAG-7.10: in an expanded sub-row, the sibling sub-row beside it is not reached…". Both pass, both now assert the rest point lies in P's own box (owner P), and both show the one pop to K from there.
- **"From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of K"**: the same two tests.
- **One excursion that satisfies neither threshold**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…" and "DRAG-7.10: an excursion out of the modal shorter than the pop-out distance…".
- **The header**: "DRAG-7.10: the modal's header is part of the modal…".

**Red against the app.** For the click arrival, "bounded by K" fails in the four click matrix variants and in "DRAG-7.10: resting beyond P's box, inside its column…". The tests assert the clause as the Then states it. Whether the wiki or the code is wrong is a ruling (test-plans README, "When a test for a case fails"). Until it's made, no green test proves the click arrival's bound.

Still with a Planner session: desk r6, Open questions item 1.

### DRAG-7.12: Proves the case
In `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.12: a modal a hold opens carries the drag's tiers…":
- **R and R1 Full, R1a Mid, Y Low**: read from `data-drop-tier`.
- **The Given**: read from `data-drop-state`.
- **"does not recompute them"**: R's tier is the same before and after the modal opens.
- **"The static section rows under the backdrop take no target tier"**: the test now first finds a row titled A visible inside article P, then counts zero `[data-drop-tier]` there.

### DRAG-7.13: Proves the case
- **"during the modal hold's dwell, then nothing new is shown"; "then a visible cue shows on R's overflow row"; "when the cue completes, then the hierarchy modal opens, with the drag at P's Descendants layer"**: "DRAG-7.13: a hold above R's overflow row is a silent dwell…" and "DRAG-7.13: a Free Card zoomed into P and held above R's overflow row…". The cue element is now asserted visible, not only present. The Free Card's Given, Free with a null parent, is asserted first.
- **A release before the cue completes**: "…a release before the cue completes commits…" (Stub), and "…commits a Free Card zoomed in above|below…".
- **The same below the overflow row**: "…held below R's overflow row, at its level, opens the modal as R's last child".
- **B, P's own Stub**: "DRAG-7.13: any item at the layer opens it: B…".
- `holdFreeAt` now finds Card P by `p.title`, which is the same Card.

### DRAG-7.14: Test gap
Clauses the tests prove:
- **Bullet 1 (another gap)**: "DRAG-7.14: the hold starts over when the ghost changes level or gap". At the other gap the hold reads null, the cue count is 0, and `data-drag-projection` no longer starts with `6:`.
- **Bullet 2**: the same test.
- **Bullet 3**: "DRAG-7.14: the cursor leaving the whole Card's box ends the hold…".
- **Bullet 4, during the cue**: "…moving into the Card's title or padding during the cue…".
- **Bullet 5**: "…the carried copy moving within the gap…".
- `popSession.test.ts`'s DRAG-7.14 tests back bullets 1 to 3's logic. They're in the approved clock category.

Gap:
1. **Bullet 4 during the dwell, "the dwell … runs on without restarting"**: unchanged. "…during the dwell lets the hold run on…" can't tell run-on from restart, since a restarted dwell also reads dwell and also completes. It stays a gap until the Coder's `popSession.test.ts` test lands. That test is in the clock category, so it counts without approval; it should carry DRAG-7.14, with the cursor moving within the layer and the hold keeping its `since`.

Optional tightening for bullet 1: `not.toHaveAttribute(/^6:/)` also passes if the projection attribute were absent. With every clock off and the cursor inside P that can't happen here, but asserting the Descendants context, or the expected gap, would make it airtight.

### DRAG-7.15: Proves the case
- **Spot under the cursor, for both gaps, both approaches, with and without a child**: the five "DRAG-7.15: held from above|below, to the gap above|below R's overflow row…" tests, "DRAG-7.15, DRAG-7.19: the modal opens with the ghost's spot under the cursor…" and "DRAG-7.15: held from above, down to the gap above R's overflow row…".
- **"commits what it would have before the modal opened: X first among R's attached children, before R1, or last, after R2"**: `expectReleaseCommitsShown` now asserts `placed.isAttached` is 1, besides the parent and order read from the painted modal.
- **The Given's attached child**: its parentId and isAttached are now asserted.
- **"Its attached child is absent while it is carried … drawn under it again"**: as in the first pass.
- Still with a Planner session: desk r6, Open questions item 2.

### DRAG-7.17: Proves the case
- **From the gap below**: "DRAG-7.17: when R's children run longer than the modal…". The list is scrolled and the spot is under the cursor. The release, with the cursor unmoved, saves X under R, attached, after E19.
- **From the gap above**: "DRAG-7.17: from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too". The Given is the sibling S with 20 children before R, and the list is scrolled after the modal opens. The projection reads `24:3:true` before and after the modal opens, and the spot is under the cursor. The release saves W under R, attached, before R1. The correction is judged below.

### DRAG-7.18: Proves the case
Unchanged from the first pass. The `holdFreeAt` change touches only how the Free Card variant finds P. One reopen is asserted; desk r1 is still with a Planner session, Open questions item 5.

### DRAG-7.27: Proves the case
- **R carried**: "DRAG-7.27: a dragged R carries its overflow row and its branch…", with the clauses as in the first pass.
- **"R1 and R2 show in the section below it, at level 2"**: the test now asserts that each has padding-left `descendantsIndentPx(1)`, besides the section order.
- **The cancel**: "…cancelling a drag of R…".
- **Q carried**: "…a dragged Q carries R…".
- **P carried into another Card**: "…P carried and zoomed into another Card's section…". Dropping the unused `p` changes nothing; the Card is found by its title.
- Still with a Planner session: desk r3, Open questions item 6.

### DRAG-7.28: Proves the case
- **"R1's Sheet opens above the modal and is available for interaction"**: "DRAG-7.28: a click on a row in the modal opens that item's Sheet above it".
  - The test waits for the Sheet's painted right edge to reach the window's edge.
  - It takes a point inside both the Sheet's and the modal's painted boxes. At that point, `elementFromPoint` lies in the "Item details" complementary region. That is the screen's stacking, so the Sheet is above the modal.
  - The title click then opens an edit.
- **"The modal stays open at the same place with the same hierarchy, and opening the Sheet writes nothing. The Sheet belongs to R1"**: the same test.
- **"When instead a press on R1 starts its drag in the modal, then carrying that row opens no Sheet"**: "DRAG-7.28: carrying a row in the modal opens no Sheet, and the release still places by gap and depth". R1 is pressed and carried to the gap after R2 (`4:3:true`), and the Sheet stays shut while it's carried and after the release.
- **"The drag still places by gap and depth"**: the same test saves R1 under R, after R2, with R1a still under R1. The first-child test still carries the saved order R2 before R1a.

### DRAG-7.31: Proves the case
In "DRAG-7.31: a hidden Stub returned to its pickup slot after reopening the modal writes nothing…", its When's pop to P's column is now asserted through `pullOutAndZoomBack`. Otherwise the verdict is as in the first pass. The wording question ("no request" against "writes nothing") is still with a Planner session.

### DRAG-7.32: Proves the case
Unchanged; only the spec's comment changed. **Record note:** the comment says the lost early Escape is "recorded in Results and the Open questions". In `docs/planning/epic-3-5-stories/story-10-batches.md`, though:
- the Results entry for T3 still calls it "a Planner question";
- the Open questions section has no entry for it.

The spec and the plan should say the same thing.

### DRAG-1.14: Proves the case
- **Out to K from the modal's box, by one sample**: the hold-stub and hold-free distance variants of the DRAG-7.10 matrix.
- **Out to Board from a sub-row**: `tests/ui/drag-5-stub-detach.spec.ts` "DRAG-1.14: a yank past the pop-out distance from an expanded sub-row, with every clock off, pops it to Board".
- **Out to the column from the Card's box**: "DRAG-1.14: a yank past the pop-out distance, with every clock off, pops Descendants -> Column…".
- **"given popDistancePx is 0 … no pop happens"**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…".
- **"Descendants uses the whole Card's box"**: now carried by "DRAG-5.15, DRAG-1.14: B25 title is inside the whole Card and releases the first-child gap" and "DRAG-5.15, DRAG-1.14: B25 padding is inside the whole Card and releases the first-child gap".
  - With `popDistancePx` 8, a point in the Card's title or padding is asserted further than the distance above the first row.
  - It pops nothing for twice `popDelayMs`, and the drag stays at Descendants.
  - The stamp is title-only.

### DRAG-5.15: Proves the case
Its two B25 tests changed in title only.

### DRAG-3.25: Test gap
Clauses the tests prove:
- **Section rows of one height `s`, and a pill that fits its title's line**: "DRAG-3.25: a section's typed, untyped and long-title Stub rows and its overflow row are one height…".
- **Modal rows and static rows of height `s`**: "DRAG-3.25: the hierarchy modal's typed and untyped rows and the section's rows under its backdrop are one height". Before the modal opens, the box of B's title's parent is shown to equal B's registered row box, in height and y. So measuring the static rows by the title's parent now measures the row. This rests on the static rows having the live rows' structure, which is reasonable for the same section drawn static.
- **After a pickup, the ghost and the carried copy have height `s`; a branch's line hangs below the copy, and the ghost has none**: the eight "DRAG-3.25: a typed|untyped Stub … picked up from…" tests. The typed Given is now asserted: the Story name is drawn once on A or F before the pickup.

Gap:
1. **"The same holds for an untyped Stub"**: the untyped pickup variants check only that the Task name isn't drawn on B or E. An untyped fixture that came out with a Story or Epic pill would pass, and the untyped half would go untested. The section and modal tests' untyped rows aren't checked at all.
   - Fix: assert in `seedHeightTree` that each untyped item's saved type is empty, or that none of `fetchItemTypes`'s names is drawn on those rows. That covers all ten tests.

### DRAG-2.22 (Open, not assigned to 4c): Test gap
Unchanged. "DRAG-7.21, DRAG-2.22: …" carries only the Depth-capped owner clause. The Mid Card and Cycle-forming clauses have no test in these files. My first-pass mappings for two of its other clauses are still open (below).

### DRAG-6.15 (Open, not assigned to 4c): Test gap
Unchanged. "DRAG-7.23, DRAG-6.15: …" carries one cause (another item's failed drop) in one context (the modal).

**Widened scope.** The other IDs on tests in the changed files keep their first-pass verdict of Proves the case. In this pass their tests changed only cosmetically, or through helper headers.

---

## Changes since the first pass
1. **`pullOutAndZoomBack` waits for the column context.** Accepted. It confirms the When's pop to P's column for DRAG-7.6 and DRAG-7.31. `/^column:/` matches any column, but a zoom back into P is only possible from P's own column, so the looser match can't let a wrong path pass.
2. **R1a's isAttached.** Accepted.
3. **Offsets −3, +3 and 0 each read `4:4:true`.** Accepted. This proves "one state".
4. **The ghost's height equals the carried copy's.** Accepted. This proves the ghost is a shortCard.
5. **Owner P asserted in the two passing sub-row tests.** Accepted.
6. **A row titled A visible before the zero-tier count.** Accepted.
7. **The cue asserted visible.** Accepted.
8. **Cue count 0, and the projection no longer gap 6.** Accepted, with the optional tightening under DRAG-7.14.
9. **isAttached after the release (DRAG-7.15 and both DRAG-7.17 tests), and the child's isAttached in DRAG-7.15's Given.** Accepted.
10. **R1 and R2 at indent 1.** Accepted.
11. **The overlap-point stacking check, and R1 carried.** Accepted. The carry test's poll re-aims at a fixed point until it reads `4:3:true`, which is an aim and not a looser assertion.
12. **The static-row self-check and the pill Given.** Accepted, with the untyped residue under DRAG-3.25.
13. **DRAG-1.14 on the B25 titles.** Accepted. The stamp is title-only, so it needs a `check:docs` run.
14. **`overflowTree.ts` and `boardDragSurface.ts`.** Accepted.
    - `holdFreeAt` finds P by `p.title`, which is the same Card.
    - The listed helpers' headers now say what they read: the screen, an app attribute, the network answer, or recorded requests.
    - The `sectionLevels` guard in `seedTree` reads the configured value and fails loudly on a retune, so nothing can pass at the wrong L. The depth literals remain tied to 3 through the guard. Seeding `sectionLevels: 3` would let these tests keep running after a retune, but that's upkeep, not proof.
    - Still outstanding, and not in a changed file: `dragGesture.ts::awaitProjection`'s header says "among all the section's rows". The app counts rows behind an overflow row too.
15. **The DRAG-7.32 comment.** Accepted as a comment. See the record note under DRAG-7.32.

## Corrections after a red run
1. **DRAG-7.17, "from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too"**: X carried up from below, aimed at the overflow row's top quarter, with the QUICK hold and a re-aiming poll → W carried down from above, aimed at R's center, with the HOLD hold and one `awaitProjection`. **Accepted.**
   - Only how the state is reached and aimed changed. The carried item is a different Stub of P's, and the hold's thresholds are the test's own.
   - The expected values are unchanged: gap `4 + count` at depth 3 before and after the modal opens, the list scrolled, the spot under the cursor, and the item saved under R, attached, before R1.
   - DRAG-7.17's Then doesn't fix the approach, and DRAG-7.15's says either way.
   - Swapping the re-aiming poll for a single wait is stricter, not looser.

## Held-off cases
None.

## Proposed mappings
1. **DRAG-1.14 onto the B25 tests**: applied (change 13).
2. **DRAG-2.22**, still open. These are surface tests, so no approval is needed, and the case isn't assigned to 4c:
   - "An overflow row belonging to the carried branch is absent": onto `tests/ui/drag-7-overflow-row.spec.ts` "DRAG-7.27: a dragged R carries its overflow row and its branch…" and "DRAG-7.27: a dragged Q carries R…".
   - "A Full overflow row with a Valid owner retains the ordinary valid hold behavior": onto `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.13: a hold above R's overflow row is a silent dwell…".

## Cost notes
Nathan decides on these, with the QA Engineer's recommendation. None of them is a gap.

1. **DRAG-7.10's matrix: one gesture across twelve variants, and more than two corrections.**
   - Every variant makes the same gesture, a pop out of the modal, and the twelve differ by arrival, K and threshold.
   - It needed four corrections to its aim or timing in the first pass: #2, #3, #4 and #5.
   - The hold-free variants wait out a 2.3 s zoom, then a hold, then a pop: more than two clocks in a row.
   - What each axis buys:
     - Arrival buys the release clause, a Stub detaching against a Free Card staying Free.
     - K buys the bound's axes.
     - The threshold, clock against distance, is the pop machine's to decide. `popSession.test.ts` already carries DRAG-1.14's distance term, in the approved clock category.
   - Simpler form: keep one surface test per release outcome, with a sub-row variant for the second axis, and leave the threshold half to the pop machine. Nathan chose the full twelve (proof plan, decision 2); this gives him the cost side. It doesn't touch the click arrival's red bound.
2. **DRAG-7.17's gap-above test: a second correction to its aim and timing.** The first was #13 in the first pass; the second is this pass's.
   - Clause: "From the gap above it … the list is scrolled so that the spot sits under the cursor … and the release commits X first among R's attached children."
   - Cost: a sibling with 20 children, a 1.5 s hold, and two corrections.
   - The gap-below test already shows the gesture reaching the scroll and the write. The gap-above variant differs only in where the spot lies, which is `modalPlacement.ts`'s scroll math, and `modalPlacement.test.ts` has DRAG-7.17 tests for it, such as "scrolls the list to bring a spot deep in it under the cursor". Mapping them would need Nathan's approval, since modal geometry isn't an approved category.
   - The options are to keep the test, which now passes with no re-aim, or one gesture with the matrix inside.
3. **DRAG-7.18: a zoom hold whose length buys no clause.** Each variant waits out a hold, a pop, a 2.3 s zoom (`ZOOM_BACK` 1500 + 800) and a hold.
   - The chain itself is the When.
   - The zoom's length, though, buys no clause. It's long because the pop rests the cursor on F's row, a Card in the column, and a short zoom would carry the drag into F.
   - Resting the pop on column space outside any Card would let the zoom be short and save about 1.5 s per variant.
4. **DRAG-7.31: a chain of three clocks.** It waits out a pop (300 ms), a zoom (650 + 350) and a modal hold (200 + 300), then re-aims with a poll. The chain is the When, so each wait buys a step of it, and the waits are short. Keep it as it is.

## Files
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-hierarchy-modal.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-modal-hold.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-overflow-row.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-stub-row-height.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-5-stub-detach.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\helpers\overflowTree.ts
- c:\Users\natha\Dev\KanbanApp\tests\helpers\boardDragSurface.ts
- c:\Users\natha\Dev\KanbanApp\tests\helpers\dragGesture.ts
- c:\Users\natha\Dev\KanbanApp\docs\planning\epic-3-5-stories\story-10-batches.md
```

**After this pass** (the QA Engineer, tree `5b0f5c79bc84b1098bd5b2b94468eead5b20972f`; not yet seen by the reviewer): DRAG-3.25's gap is answered in `seedHeightTree`, which now asserts each typed item's saved type and that each untyped item's is null. DRAG-7.14's optional tightening is taken: the "starts over" test asserts the Descendants context and a projection at a gap other than 6. DRAG-7.14's remaining gap is a Coder clock test, in Open questions.

### Batch 4c, after Stop 3 — the Test Reviewer's third pass (2026-11-12)

The same reviewer agent, continued, on tree `77c65790bd2285eaa6d4f34d927697bf9e7f5a9b`. A usage limit cut off its first attempt, and it was resumed with the same brief. The brief gave the Coder's two ID-bearing Vitest changes, the QA Engineer's changes since the second pass (the DRAG-3.25 Given, DRAG-7.14's assertion at the other gap, the cue locator on `data-drag-cue`, the DRAG-7.10 matrix cut to eight by Nathan's decision, and `awaitProjection`'s header), and the runs. The report is word for word.

```text
Test Reviewer, Story 10 batch 4c, third pass, after the Coder's return (Stop 3), 2026-11-12

**Inputs.** I read the files on disk, which the coordinator gives as tree `77c65790bd2285eaa6d4f34d927697bf9e7f5a9b`. I have no shell, so I couldn't check the tree or diff it.

**Scope.**
- The Coder's two ID-bearing Vitest changes, and the new popSession test that carries no ID.
- Playwright changes 3 to 7.
- Every case with an open gap, and every case the changes touch. Change 5 reaches the cue checks in DRAG-7.13, DRAG-7.14 and DRAG-7.21.
- Check 7, with cost notes at the end.

**Run state.** 130 passed, 0 failed, on this tree. That includes the five DRAG-7.10 click-arrival tests that were red at "bounded by K".

**Form.** The brief asserts that the new DRAG-7.14 Vitest test "is in the clock category". I checked that against `docs/test-plans/README.md` rather than taking it.

**Disclosure.** For the changed DRAG-3.22 test I meant to read only the header of `client/src/components/workflow/dragOverlayGeometry.ts`. I read lines 1 to 60, which runs past the header into the body of `overlayWidthFor` (lines 33 to 36) and the first lines of `overlayShapeFor`. My verdict on that change doesn't rest on them: it needs only the before-and-after. `client/src/components/workflow/AGENTS.md` came into view when I opened `popSession.test.ts`; my definition allows that file. I used it for the `data-drag-cue` contract.

---

## Verdicts

### DRAG-7.14: Proves the case
- **Bullet 1 (another gap)**: `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.14: the hold starts over when the ghost changes level or gap". At the other gap, the hold reads null and the cue count is 0. The drag is still at P's Descendants layer, and the projection is present and not in gap 6 (`/^(?!6:)\d+:/`).
- **Bullet 2 (a tab from L+1 to L resets; tabbing back starts a fresh dwell)**: the same test.
- **Bullet 3 (leaving the whole Card's box)**: "DRAG-7.14: the cursor leaving the whole Card's box ends the hold…".
- **Bullet 4 ("the dwell or cue runs on without restarting; completing the hold there opens the modal")**:
  - The surface tests "…moving into the Card's title or padding during the dwell|cue…" show the padding is inside the layer: the hold runs on, nothing pops, and the modal opens.
  - The new `client/src/components/workflow/popSession.test.ts` test "DRAG-7.14: runs on from the same start while the cursor moves into the Card's title or padding, through the dwell and the cue, and completes there" shows the clock doesn't restart.
    - A sample in the padding during the dwell returns the same session.
    - The cue comes at `modalHoldDwellMs` with the same `since`.
    - A move back over the rows and into the padding during the cue keeps the same session.
    - The hold completes at dwell plus cue.
    - The thresholds come from the tuning. It is in the approved clock category, so it counts without approval.
- **Bullet 5**: "DRAG-7.14: the carried copy moving within the gap…".
- The other `popSession.test.ts` DRAG-7.14 tests, in the same category, back the logic of bullets 1 to 3.

### DRAG-7.10: Proves the case
The matrix is down to eight variants. Every arrival leaves on the clock; P's own Stub (hold-stub) also leaves on one sample of the distance. All eight pass.

In `tests/ui/drag-7-hierarchy-modal.spec.ts` "DRAG-7.10[, DRAG-1.14]: … pops once to … on …, Free, and a release after Card Q writes that placement":
- **"opened by a click or by a hold"**: the click, hold-stub and hold-free arrivals.
- **"satisfies popDelayMs or the enabled popDistancePx"**: the clock in all three arrivals, the distance in the two hold-stub distance variants.
- **"exactly one pop … directly to K"**: the modal is gone, the state is locked and the context is K.
- **"Free … shown as shortCard"**: the item's row in K is an article. The carried copy's form is short-card, and the ghost's height equals the copy's.
- **"bounded by K"**: `withinExcess` is at most 2 px, now green for every arrival.
- **"{anchorId: Q, side: after}"**: one request.
  - "a Stub picked up attached has isAttached: false with its original parentId": the click and hold-stub arrivals.
  - "an item brought in Free stays Free with its original parentId": the hold-free arrival.
- **"No attach into P"**: no parentId in the request.

Clauses other tests prove:
- **"No further exit from P's box is required"**:
  - the click clock variants, which assert owner P and now pass;
  - "DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row";
  - "…the sibling sub-row beside it is not reached…".
- **"From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of K"**: the same two sub-row tests.
- **One excursion that satisfies neither threshold**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…" and "DRAG-7.10: an excursion out of the modal shorter than the pop-out distance…".
- **The header**: "DRAG-7.10: the modal's header is part of the modal…".
- **Resting beyond P's box**: "DRAG-7.10: resting beyond P's box, inside its column…", now green.

Still with a Planner session: desk r6, Open questions item 1. The new two-excursion test is under Proposed mappings.

### DRAG-1.14: Proves the case
- **"Descendants uses … the modal's box", out to K by one sample, before `popDelayMs`**: the two hold-stub distance variants, to the column and to the sub-row.
- **A column or sub-row, out to Board**: `tests/ui/drag-5-stub-detach.spec.ts` "DRAG-1.14: a yank past the pop-out distance from an expanded sub-row, with every clock off, pops it to Board".
- **The Card's box, out to the column**: "DRAG-1.14: a yank past the pop-out distance, with every clock off, pops Descendants -> Column…".
- **"Descendants uses the whole Card's box"**: "DRAG-5.15, DRAG-1.14: B25 title|padding is inside the whole Card…".
- **"given popDistancePx is 0 … no pop happens"**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…".
- Two of the removed matrix variants carried DRAG-1.14 in their titles. Removing an ID-bearing test goes in the living-docs handoff (test-plans README, "How tests and cases point at each other").

### DRAG-3.25: Proves the case
- **The Given, "typed and untyped Stubs"**: `seedHeightTree` in `tests/ui/drag-stub-row-height.spec.ts` now asserts that A, R, R1, C and F are saved with their types, and that P, Q, R2, B, D, E and E1 are saved with none. That covers all ten tests. The pickup tests also check that the typed Stub's pill is drawn.
- **Section rows of one height `s`, and a pill that fits its title's line**: "DRAG-3.25: a section's typed, untyped and long-title Stub rows and its overflow row are one height…".
- **Modal rows and static rows of height `s`**: "DRAG-3.25: the hierarchy modal's typed and untyped rows and the section's rows under its backdrop are one height". The static-row measure is checked first against a registered row's box.
- **After a pickup, the ghost and the carried copy have height `s`; a branch's line hangs below the copy, and the ghost has none**: the eight "DRAG-3.25: a typed|untyped Stub … picked up from…" tests.

### DRAG-7.13: Proves the case
As in the second pass. The cue is now found by `[data-drag-cue]`, which `client/src/components/workflow/AGENTS.md` documents as the attribute on a hold's cue fill bar, inside the row it is drawn on. So the cue's absence during the dwell, and its presence and visibility during the cue, read an attribute the app provides. Tests: "DRAG-7.13: a hold above R's overflow row is a silent dwell…" and "DRAG-7.13: a Free Card zoomed into P and held above R's overflow row…".

### DRAG-7.21: Proves the case
Its cue check now reads `[data-drag-cue]`; nothing else changed. Test: "DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold…".

### DRAG-3.22: Proves the case
I widened scope to it because `dragOverlayGeometry.test.ts` changed. Its surface carriers are `tests/ui/drag-layer-transitions.spec.ts` and `tests/ui/drag-card-forms.spec.ts`; neither changed in this pass, and its verdict rests on them. The changed internal test is judged below. It doesn't count without an approved mapping, and I don't propose one beside surface tests that prove the case whole.

### DRAG-2.22 (Open, not assigned to 4c): Test gap
Unchanged. "DRAG-7.21, DRAG-2.22: …" carries only the Depth-capped owner clause. The Mid Card and Cycle-forming clauses have no test in these files.

### DRAG-6.15 (Open, not assigned to 4c): Test gap
Unchanged. "DRAG-7.23, DRAG-6.15: …" carries one cause in one context: another item's failed drop, in the modal.

**Widened scope.**
- In the changed Playwright files, every other ID keeps its second-pass verdict of Proves the case: DRAG-7.6, 7.9, 7.12, 7.15, 7.17, 7.18, 7.27, 7.28, 7.31, 7.32 and the rest of the first pass's list. Their tests didn't change in this pass beyond the cue locator and the projection helper's header.
- The changed Vitest files carry about 85 ID-bearing tests: `popSession.test.ts`, `dragOverlayGeometry.test.ts`, `KanbanCard.test.tsx`, `dragChrome.test.tsx`, `dragStructure.test.ts` and `ItemDetailPanel.test.tsx`.
  - The Coder lists no ID-bearing change in them beyond the two judged below, so I didn't re-judge those tests clause by clause.
  - None of them changes a verdict here. An internal test counts only through an approved mapping or an approved category.

---

## The Coder's ID-bearing Vitest changes
1. **New: `popSession.test.ts` "DRAG-7.14: runs on from the same start while the cursor moves into the Card's title or padding, through the dwell and the cue, and completes there".** Accepted, and it counts.
   - It is the pop state machine's clock logic, with its thresholds read from the tuning, so it is in the category approved outright.
   - It closes DRAG-7.14's one gap.
   - The test's `sample` helper builds the board's order of operations itself: the pop step, then the hold, with no target once the cursor is outside. The surface test "…the cursor leaving the whole Card's box ends the hold…" covers how the board composes them, so nothing is left unproved.
2. **Changed: `dragOverlayGeometry.test.ts` "DRAG-3.22: locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width".** Accepted.
   - The only change is a third argument, `null`, for a parameter the module's header now lists: a Card's width, which a Stub's drag sets for its shortCard.
   - The expected values are unchanged: the Stub form, at the Card's width less its inset, and at the modal list's width.
   - It is internal and has no approved mapping for DRAG-3.22, so it doesn't count, and none is proposed.

The new test with no ID, "two excursions out of the hierarchy modal's box, each shorter than popDelayMs, pop nothing: a return restarts the clock", is sound. A return into the header restores the locked session, the second excursion runs its own clock, and the drag pops only when that second excursion alone reaches `popDelayMs`. See Proposed mappings for which ID it should carry.

## Playwright changes since the second pass
3. **`seedHeightTree` asserts each item's saved type.** Accepted. This closes DRAG-3.25's gap for all ten tests.
4. **DRAG-7.14, "the hold starts over…", at the other gap.** Accepted. The test now asserts the Descendants context and a projection that is present and not in gap 6, so the check can't pass when the projection is absent.
5. **`cueOn` matches `[data-drag-cue]`.** Accepted. This is a documented attribute the app provides, scoped to the owner's overflow row. Its comment still names `dragChrome.tsx::ZoomCue`, which is harmless.
6. **The DRAG-7.10 matrix, from 12 variants to 8.** Accepted. This is Nathan's decision on cost note 1. Every DRAG-7.10 clause still has a passing test (see its verdict), and DRAG-1.14's modal-box distance clause rests on the two hold-stub distance variants. The two removed tests that carried DRAG-1.14 go in the living-docs handoff.
7. **`awaitProjection`'s header.** Accepted. It now says the gap counts every row of the Card's hierarchy, those behind an overflow row included.

## Corrections after a red run
None since the second pass.

## Held-off cases
None.

## Proposed mappings
1. **The two-excursion test needs an ID first.** "two excursions out of the hierarchy modal's box…" in `popSession.test.ts` shows wiki §3.1's clock reset at the modal's box. No case's Then states that reset for the modal yet:
   - DRAG-7.10 states one excursion;
   - DRAG-1.30 states the reset for a Card in its column;
   - DRAG-5.5 states it for the Card's box.

   So I can propose no mapping until a Planner session answers Open questions item 1. Once it carries the ID the Planner chooses, it counts without approval, since it is in the clock category.
2. **DRAG-2.22**, still open. These are surface tests, so no approval is needed, and the case isn't assigned to 4c:
   - "An overflow row belonging to the carried branch is absent": onto `tests/ui/drag-7-overflow-row.spec.ts` "DRAG-7.27: a dragged R carries its overflow row and its branch…" and "DRAG-7.27: a dragged Q carries R…".
   - "A Full overflow row with a Valid owner retains the ordinary valid hold behavior": onto `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.13: a hold above R's overflow row is a silent dwell…".

## Cost notes
Nathan decides on these, with the QA Engineer's recommendation. None of them is a gap.

1. **DRAG-7.10's matrix**: decided (eight variants); nothing to add.
2. **DRAG-7.17's gap-above test** (second pass, note 2): open, and the test is unchanged. It needed two corrections to its aim and timing. The gap-above variant differs from the gap-below one only in the modal's scroll math, which `modalPlacement.test.ts`'s DRAG-7.17 tests cover; mapping them would need Nathan's approval. The options are to keep it or to move to one gesture with the matrix inside.
3. **DRAG-7.18** (second pass, note 3): open, and the test is unchanged. The 2.3 s zoom hold (`ZOOM_BACK`) buys no clause. It's long only because the pop rests the cursor on F, a Card in the column. Resting the pop on column space outside any Card would allow a short zoom.
4. **DRAG-7.31**: keep it as it is. Its chain of clocks is the When.

None of this pass's changes adds a cost:
- change 4 adds one wait for the context;
- `seedHeightTree`'s 12 reads of saved items each buy the Given.

## Files
- c:\Users\natha\Dev\KanbanApp\client\src\components\workflow\popSession.test.ts
- c:\Users\natha\Dev\KanbanApp\client\src\components\workflow\dragOverlayGeometry.test.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-hierarchy-modal.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-modal-hold.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-stub-row-height.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\helpers\dragGesture.ts
```

### Batch 4c, after the Planner's rewording — the Test Reviewer's fourth pass (2026-11-12)

The same reviewer agent, continued, on tree `d5a179720838b34f3143f5d0059dd1151a983ba9`. The Planner had reworded DRAG-7.9, 7.10, 7.14, 7.17, 7.18, 7.27, 7.31 and 7.32 after the third pass, and the QA Engineer extended the tests for them (the clock test's DRAG-7.10 stamp, T in the Q-carried test, the ghost's gap and level in DRAG-7.14's padding tests, a second reopening in DRAG-7.18, a new early-Escape test for DRAG-7.32). The brief gave each as before and after. The report is word for word.

```text
Test Reviewer, Story 10 batch 4c, fourth pass, 2026-11-12

**Inputs.** I read the files and the catalog on disk, which the coordinator gives as tree `d5a179720838b34f3143f5d0059dd1151a983ba9`. I have no shell, so I couldn't check the tree or diff it.
- I re-read the whole DRAG-7 file. DRAG-7.9, 7.10, 7.14, 7.17, 7.18, 7.27, 7.31 and 7.32 have new text, and I judged every case the four changed files carry against its current Then.
- The other DRAG-7 cases read as they did in my first pass, so their earlier verdicts stand.
- No app source was read. Only playwright.config.ts, to see which browsers run.

**Form.** The brief gives the changes as before-and-after with no reasons, so it's in form. It notes that the five spec files haven't been rerun as wholes on this tree. That's run state, not a verdict input.

---

## Verdicts: cases with new text

### DRAG-7.9: Proves the case
- **"its drag starts at P's Descendants layer, with no pop"**, and **"in the gap between R1 and R1a → one state, R1's first child: R2.parentId = R1, attached, before R1a"**: `tests/ui/drag-7-hierarchy-modal.spec.ts` "DRAG-7.9, DRAG-7.28: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1's first child". Offsets of −3, +3 and 0 levels each read `4:4:true`. The saved item has parent R1, is attached, is in Todo, and sits before R1a.
- **"in the gap between R1a and T … aligned with R1a at level L + 2 → R2.parentId = R1, attached, after R1a"**: "DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1's last child, after R1a". Its Given is asserted first.
- **"its own gap and depth → nothing is written"**: "DRAG-7.9, DRAG-7.19: set back down in its own gap and depth…".
- **"a tab state whose resulting depth exceeds CAP → marked invalid, and a release writes nothing"**: "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…". CAP is read from the board.
- **"each saved placement leaves R2 attached, with P's workphase"**: all four tests assert isAttached 1 and Todo on the saved item, for the two writes and for the two set-downs that write nothing.
- **"The first two gaps place R2 among rows hidden by the section's overflow row"** describes where those placements land, not a separate outcome. Both place R2 under R1. `drag-7-overflow-row.spec.ts`'s DRAG-7.1 test shows, on the same tree helper, that R1, R2 and R1a are hidden in the section.

### DRAG-7.10: Proves the case
Clauses the matrix proves, in "DRAG-7.10[, DRAG-1.14]: … pops once to … on …, Free, and a release after Card Q writes that placement" (eight variants):
- **"opened by a click or by a hold"**: the click, hold-stub and hold-free arrivals.
- **"satisfies popDelayMs or the enabled popDistancePx"**: the clock in every arrival; the distance in the two hold-stub variants.
- **"exactly one pop … directly to K, Free, bounded by K and shown as shortCard"**:
  - the modal is gone, the state is locked, and the context is K;
  - the item's row in K is an article, and the saved item has isAttached 0;
  - `withinExcess` is at most 2 px;
  - the carried copy's form is short-card, and the ghost's height equals the copy's.
- **"{anchorId: Q, side: after}"**: one request, no parentId.
  - "a Stub picked up attached has isAttached: false with its original parentId": the click and hold-stub arrivals.
  - "an item brought in Free stays Free with its original parentId": the hold-free arrival.
- **"No attach into P"**.

Clauses other tests prove:
- **"No further exit from P's box is required"**: the click variants, which assert owner P, plus "DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row" and "…the sibling sub-row beside it is not reached…".
- **"From an expanded sub-row, reaching Board or a sibling sub-row requires another pop out of K"**: the same two sub-row tests.
- **One excursion that satisfies neither threshold**: "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…" and "DRAG-7.10: an excursion out of the modal shorter than the pop-out distance…".
- **The new sentence, two excursions, "returning to the box restarts the pop-out clock from zero"**: `client/src/components/workflow/popSession.test.ts` "DRAG-7.10: two excursions out of the hierarchy modal's box, each shorter than popDelayMs, pop nothing: a return restarts the clock".
  - A return into the modal's header restores the locked session.
  - The second excursion's clock starts at its own time.
  - Nothing pops until that second excursion alone reaches `popDelayMs`.
  - It is in the approved clock category, so it counts.
  - The surface single-excursion tests tie "no pop" to "the modal stays open".
- **The header**: "DRAG-7.10: the modal's header is part of the modal…".

### DRAG-7.14: Proves the case
- **Bullet 1 (another gap)**: `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.14: the hold starts over when the ghost changes level or gap". The hold reads null, the cue count is 0, the drag is still at P's Descendants, and a projection is present that isn't gap 6.
- **Bullet 2 (a tab from L+1 to L resets; tabbing back starts a fresh dwell)**: the same test.
- **Bullet 3 (leaving the whole Card's box)**: "DRAG-7.14: the cursor leaving the whole Card's box ends the hold…".
- **Bullet 4, "the dwell or cue runs on without restarting; completing the hold there opens the modal"**:
  - the two surface tests "…moving into the Card's title or padding during the dwell|cue…";
  - the clock test `popSession.test.ts` "DRAG-7.14: runs on from the same start while the cursor moves into the Card's title or padding, through the dwell and the cue, and completes there".
- **Bullet 4's new sentence, "it opens with the ghost in that same gap and at that same level, as R's first or last child"**: the same two surface tests now assert that the padding point is inside the modal's box, that X's row is painted under that point, and that the projection reads `3:3:true`, which is R's first child, the gap and level held before.
- **Bullet 5**: "DRAG-7.14: the carried copy moving within the gap…".

**Note on bullet 4's Given, not a gap.** "Given room to place the modal inside the window with the ghost's spot under the cursor" is checked as "the modal lies inside the window by `MODAL_EDGE_MARGIN_PX` on all four sides". A modal shifted by an edge also lies inside by that margin, so this check can't tell the Given's case from DRAG-7.16's. The test still can't pass for the wrong reason: a shift large enough to change the reading would break the `3:3:true` and ghost-under-cursor assertions. To confirm the Given itself, assert that each side lies more than the margin from its edge.

### DRAG-7.17: Proves the case
- **"the modal's list is scrolled so that the spot sits under the cursor, and a release without moving the cursor commits it … last among them"**: "DRAG-7.17: when R's children run longer than the modal…". The list is scrolled and the spot is under the cursor. The release saves X under R, attached, after E19.
- **"From the gap above it … the release commits X first among R's attached children"**: "DRAG-7.17: from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too". The projection reads `24:3:true` before and after the modal opens, the list is scrolled, and the spot is under the cursor. The release saves W under R, attached, before R1.
- **The new Given, "within the modal list's scroll reach beneath the cursor"**: shown by the outcome. Outside that reach, DRAG-7.16 would govern, and the spot-under-cursor and saved-placement assertions would fail rather than pass.

### DRAG-7.18: Proves the case
In the two "DRAG-7.18: after leaving a modal a hold opened, P's own Stub | a Free Card zoomed in held beside an overflow row opens it again in the same drag" tests:
- **The Given**: the first opening is by a hold, at P's Descendants.
- **"the modal opens again at the same Descendants layer"** and **"opens a second time, still at P's Descendants layer"**: the cycle runs twice. Each time:
  - one pop to P's column, asserted by the column context, and the modal is gone;
  - the full zoom-in hold back into P;
  - a hold beside the overflow row, at `3:3:true`;
  - the modal visible again at P's Descendants.
  That gives a second and a third opening. Either way of counting "a second time" is covered.
- **"No write occurs during either exit, re-entry or modal opening"**: no writes after each opening.
- **"only a release in the final opening commits X at the selected gap and depth"**: the saved item is R's first child, before R1.
- **"The number of earlier openings does not limit a later one"**: shown as far as a finite test can show it.

### DRAG-7.27: Proves the case
- **R carried**: "DRAG-7.27: a dragged R carries its overflow row and its branch…". As before, and R1 and R2 are at indent 1 after the release.
- **The cancel, "On a cancel, the original section and its overflow rows return, with R's overflow reading '2 children'"**: "…cancelling a drag of R…".
- **"Given instead Q is picked up, then R and T are in its attached branch: both rows and R's overflow row are absent"**: "DRAG-7.27: a dragged Q carries R and T, so their rows and R's overflow row are all absent".
  - The Given is asserted first: R and T saved under Q, attached; R's overflow row reads "2 children"; T's row is drawn.
  - While Q is carried, R's row, T's row, R's overflow row and R1's row are all absent.
  - After the cancel, R's overflow row reads "2 children" and T's row is back.
- **P carried into another Card**: "…P carried and zoomed into another Card's section…".

### DRAG-7.31: Proves the case
In "DRAG-7.31: a hidden Stub returned to its pickup slot after reopening the modal writes nothing…":
- **"no item write request is sent from pickup through release"**: `watchWrites` records every non-GET request from before the pickup to after the release, and it is empty. That is stricter than "item write".
- **The When**: the pop to the column, the zoom back with the ghost at `7:0:true`, the reopening by a hold, and the return to `5:3:true`.
- **"R2.parentId = R, it remains attached with position p and P's workphase, and the modal stays open showing it in that original slot"**: the saved item, and the row order and indent in the open modal.

### DRAG-7.32: Proves the case
- **The three close ways, "only the Sheet closes", and "After each, the same modal remains at its prior place, with the same list order, depths and scroll position, and nothing is written. While the Sheet is open, the modal cannot be dismissed by its own X, its backdrop or Escape. Once the Sheet has closed, another Escape closes the modal."**: the four "DRAG-7.32: closing the Sheet over the hierarchy modal by Escape | its X | its backdrop | its backdrop over the modal's own X…" tests. Their Given asserts the list scrolled to 30.
- **The new paragraph, an Escape "once the Sheet has begun opening and is visible above the modal, before its entrance motion finishes: that keypress closes only the Sheet, leaving the modal open"**: the new "DRAG-7.32: Escape pressed while the Sheet is still sliding in over the hierarchy modal closes only the Sheet".
  - The page's animations are slowed through CDP, and `playwright.config.ts` runs only Chromium, so that's sound.
  - The Given is read from the screen: R1's heading is visible, the Sheet's painted right edge lies beyond the window's width, and its left edge is inside it.
  - After Escape, the Sheet reaches its closed class and the modal stays visible at its prior box, with the same rows, indents and scroll offset. No non-GET request is sent, and the next Escape closes the modal.
  - Note: unlike the four close-way tests, this test doesn't first assert that the list's scroll offset is 30. If the scroll never took, the scroll comparison would compare 0 with 0. The four tests already prove the scroll clause, so this isn't a gap; adding `expect(before.scrollTop).toBe(SCROLLED_BY)` would make the new test stand on its own.
- My second-pass record note about the lost Escape is settled: the case now states the rule.

## Verdicts: other cases the changed files carry
- **DRAG-1.14**: Proves the case, unchanged. The modal's box by one sample is shown by the hold-stub distance variants; the sub-row and the Card's box by the `drag-5-stub-detach.spec.ts` tests; the whole Card's box by the two B25 tests; and the excursion with the distance off by "DRAG-7.10, DRAG-1.14: with the distance off…".
- **DRAG-7.6, 7.12, 7.13, 7.15, 7.28**: Proves the case. Their text and tests are as I judged in the second and third passes.
- **DRAG-7.1 to 7.5, 7.7, 7.8, 7.11, 7.16, 7.19, 7.21 to 7.26, 7.29, 7.33 to 7.35, and DRAG-7.2's internal pointer**: Proves the case. Text unchanged, tests unchanged.
- **DRAG-2.22** (Open, not assigned to 4c): Test gap, unchanged. Only its Depth-capped owner clause is carried, by "DRAG-7.21, DRAG-2.22: …".
- **DRAG-6.15** (Open, not assigned to 4c): Test gap, unchanged. One cause in one context is carried, by "DRAG-7.23, DRAG-6.15: …".
- **`popSession.test.ts`'s other IDs**: DRAG-1.1, 1.3, 1.4, 1.7, 1.11, 1.19, 1.25, 1.30, 1.35, 1.37, 3.15, 3.21, 4.19, 4.20, 4.22, 4.23, 5.1, 5.5, 7.11 and 7.13. Their text is unchanged, and the internal tests carrying them are unchanged in this pass. No verdict changes from that file beyond DRAG-7.10 and DRAG-7.14 above.

---

## Changes since the third pass
1. **`popSession.test.ts`: the two-excursion test's title now starts "DRAG-7.10: …".** Accepted. It's a title-only stamp, so it needs a `check:docs` run. It carries the new DRAG-7.10 sentence, and as a clock-logic test it counts without approval.
2. **DRAG-7.27, the Q-carried test.** Accepted. It now confirms its Given, asserts T's row absent while Q is carried, and asserts T's row returns after the cancel.
3. **DRAG-7.14, the two padding tests.** Accepted. They now prove bullet 4's new sentence (same gap and level, ghost under the cursor). See the note under DRAG-7.14 on the margin check.
4. **DRAG-7.18, two reopening cycles in the same drag.** Accepted. This proves "opens a second time" and the no-write clause across both cycles.
5. **The new DRAG-7.32 early-Escape test.** Accepted. See the note under DRAG-7.32 on the scroll offset.

The two comments in `drag-7-hierarchy-modal.spec.ts` (on the DRAG-7.31 test, and above the four close-way tests): accepted. They change no assertion.

## Corrections after a red run
None since the third pass.

## Held-off cases
None.

## Proposed mappings
1. **The two-excursion test to DRAG-7.10**: done (change 1).
2. **DRAG-2.22**, still open. These are surface tests, so no approval is needed, and the case isn't assigned to 4c:
   - "An overflow row belonging to the carried branch is absent": onto `tests/ui/drag-7-overflow-row.spec.ts` "DRAG-7.27: a dragged R carries its overflow row and its branch…" and "DRAG-7.27: a dragged Q carries R and T…".
   - "A Full overflow row with a Valid owner retains the ordinary valid hold behavior": onto `tests/ui/drag-7-modal-hold.spec.ts` "DRAG-7.13: a hold above R's overflow row is a silent dwell…".

## Cost notes
Nathan decides on these, with the QA Engineer's recommendation. None of them is a gap.

1. **DRAG-7.18: the zoom hold.** This replaces my earlier note 3, and now weighs more.
   - **Clauses**: "opens again" and "opens a second time", and no write before the final release.
   - **Cost**: each variant now chains the first hold and then two cycles, each a pop (300 ms), a zoom (`ZOOM_BACK` 1500 + 800) and a hold (200 + 300). That's about 6 s of clocks alone, more for the Free Card's first zoom, well past 4 s and more than two clocks in a row. The second cycle buys a clause the Then now states.
   - **The 2.3 s zoom buys no clause.** It's long only because each pop rests the cursor on F, a Card in the column, where a short zoom would carry the drag into F. Resting the pop on column space outside any Card would allow a zoom of about 1 s and save about 2.6 to 3.9 s per variant.
   - **One gesture repeated.** The two variants, P's own Stub and a Free Card, run the same chain to the same outcome. The Terms let a case hold for either kind of X unless it names one, so a single variant would prove the Then.
2. **DRAG-7.17's gap-above test** (earlier note 2): unchanged. It needed two corrections to its aim and timing. Its difference from the gap-below test is `modalPlacement.ts`'s scroll math, which `modalPlacement.test.ts`'s DRAG-7.17 tests cover; mapping them needs Nathan's approval. Keep it, or move to one gesture with the matrix inside.
3. **DRAG-7.31**: keep it as it is. Its clock chain is the When, and the waits are short.

No new cost from this pass's other changes:
- the CDP slowdown in the new DRAG-7.32 test buys the Then's own precision, "before its entrance motion finishes";
- the added DRAG-7.14 and DRAG-7.27 assertions add no waits.

## Files
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-7-overflow-and-hierarchy-modal.md
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-hierarchy-modal.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-modal-hold.spec.ts
- c:\Users\natha\Dev\KanbanApp\tests\ui\drag-7-overflow-row.spec.ts
- c:\Users\natha\Dev\KanbanApp\client\src\components\workflow\popSession.test.ts
- c:\Users\natha\Dev\KanbanApp\playwright.config.ts
```

**After this pass** (the QA Engineer): both optional tightenings are taken. DRAG-7.14's padding tests now assert each side of the modal is further than the margin from the window's edge, and the early-Escape test asserts the list's scroll offset first. The five changed tests ran 9 of 9 afterwards.

## Amendments

- **2026-11-11 — DRAG-7.10's "bounded by `K`" ruled: the wiki stands, and the width is a defect (PO, a deduction for Nathan to overrule).** A Stub picked up in a click-opened modal and popped out to its column is carried at the modal row's width, 574 px in a 272 px column. Wiki board-drag-interaction already settles it in three places, and none excepts a modal a click opened:
  - **§2:** a carried card follows the cursor only within its context's own extent.
  - **§3:** a pop out of Descendants leaves the item bounded by the column or sub-row that contains its Card, shown there as a Free Card.
  - **§5a:** the carried copy switches back to shortCard at the pop-out to a column. §7.3 has the modal bound the layer only while it's open.
  - **So:** no wiki or case change. The fix is the Coder's, in a session Nathan opens. The five red tests stay as written and go green with the fix. A hold-opened modal already behaves this way, so the fix makes the two arrivals agree.
  - **If overruled:** the PO writes the exception into §2 and §7.3, and a Planner session rewords DRAG-7.10 and DRAG-1.28.

- **2026-11-11 — Stops 1 and 2 weigh a surface test's cost (Nathan).** The testing-strategy guide, the QA Engineer persona and the Test Reviewer's definition now hold the standing rule; the stops point at it. Stop 1 names what proves each clause, flags the costly ones with a recommendation, and proposes a split for a case past six gesture variants, from 4d on. Stop 2 stops work on a test at its second aim or timing correction and sends the reviewer's cost notes to Nathan, from 4c's resume on. No case, status or assignment changes, and the QA Engineer still never proposes Manual. The catalog README's part waits for a Planner session (the plan's Living-docs handoff).

- **2026-11-11 — D2's repeats drop to ten (Nathan).** From 4c's Stop 4 on, an added or changed drag test passes ten repeats at the adopted five workers. The execution boundary and Stop 4 now say so. 4a and 4b's twenty-repeat evidence stands, and the batch-final full run is unchanged. D2 in the plan holds the reason.

- **Stop 5 complete (Test Planner, from the confirming Reconciler).** All 26 cases become Automated: four Extend, twenty New and two Rework. Whole-catalog identity checks are clean; the associated DRAG-3.3 pointer is maintained under the approved request category. Catalog totals become 378 Automated / 93 Open / 10 Manual / one Planned / two Pending PO, with 91 active story assignments remaining. All 70 variants meet D2 and the final suite/gate pass on the unchanged snapshot. DRAG-3.12 stays separate and nonblocking. Stop for review/commit; no 4c or new discovery cycle.

- **Stop 5 authorized (Nathan).** Confirm the fixed 26-case scope against the accepted frozen snapshot and completed runtime evidence; apply eligible case fields and write the confirming report. Keep adjacent findings separately recorded and nonblocking. End with the batch close-out for review, without committing or starting 4c.

- **Stop 4 completion — recovered without reruns (Test Planner, from the Automator).** All 70 scoped variants meet D2 with 1,400 passes and zero failures/retries/skips; final E2E is 394/21/0 and the root gate is green. The unchanged background run completed during a usage-limit delivery interruption; recovered all results without duplicate execution. App/test/configuration hashes remain frozen. Return to Nathan before confirming reconciliation; conditional DRAG-3.12 stays nonblocking and outside scope.

- **2026-11-09 — Stop 4 authorized; adjacent follow-up left separate (Nathan).** Leave conditional DRAG-3.12 recorded outside 4b and proceed with the accepted 26-case/70-variant batch. The same Automator owns the frozen twenty-repeat ledger, then final full E2E/root gate, and returns a validation checkpoint. No additional discovery pass, automatic scope expansion or confirming reconciliation begins here.

- **2026-11-09 — Null-position return review (Test Planner, from Nathan, the Automator and Reconciler).** Verified all supplied raw hashes and recovered a green 394-pass full run, including all 71 maintained batch/control variants. The foreign-middle DRAG-3.3 handoff is delivered; DRAG-6.10's path mappings retain the same end-preview proof. Sending an unchanged workphase is valid for locked-Column append, while an existing conditional Board-own-region/null/peers no-write gap remains for separate DRAG-3.12 review with UI reachability unproved. No source/test/catalog edit, new case, matrix expansion or execution in this review; D2/final closure remains pending.

- **2026-11-09 — Append-slot return and bounded checkpoint (Test Planner, from Nathan, the Automator and Reconciler).** Both unchanged middle replays pass on the six-file return. One test-only aim correction establishes the expanded held path and passes its unchanged outcome assertions; the post-edit gate passes. The wider bare-container behavior and DRAG-6.12 proof conform, while the already-catalogued DRAG-3.3 null-position request branch needs a separate Coder handoff. Preserve all failed attempts and the unrun complete affected-file/D2/final checks. No application/Vitest edit, case promotion, new ID or matrix expansion in this continuation.

- **2026-11-09 — Post-Coder Stop 2 checkpoint (Test Planner, from the Automator and Reconciler).** All 70 scoped variants are authored and the three proof corrections are applied. Preserved a DRAG-5.3 middle-band request mismatch, reproduced three times plus a geometry replay; correct saved fallback order does not satisfy the no-anchor request clause. Recorded incomplete focused validation, frozen inputs and historical evidence limits. All scoped cases stay Open, and the next app/Vitest task requires a separate Coder session and Nathan's check-in.

- **2026-11-09 — Separate Coder return accepted; automation resumed (Nathan).** Recorded the named-selection fix, completed clock stamps/reset tests and the pointer decision. Removed stale Coder Open questions. The unchanged B13 representative passes on the accepted post-Coder snapshot; the Automator resumes the remaining thirteen variants and proof corrections. Saved full-suite evidence includes all twelve B13 variants and preserves the two earlier B03 failures without a proven cause. No final validation/coverage claim.

- **2026-11-09 — Resumed Stop 2 reaches a new functional blocker (Test Planner, from the Automator).** Confirmed a P/before hold entering Origin instead of P in three of three attempts, with no write. Froze 57 scoped variants and left 13 unauthored for the next accepted source. Root gate passes; diagnostic failures remain disclosed. A proposing Reconciler review checks proof without promoting cases. The new selection failure is separate from the retired/deferred highlight defects.

- **2026-11-09 — Proposing review completed (Test Planner, from the Reconciler).** All 26 current cases and mandatory whole-catalog identity checks are reviewed; no catalog field changes. Recorded the confirmed named-Card blocker, the 13 unauthored variants, DRAG-4.1's existing-drawing title stamps, DRAG-4.12's four-variant bootstrap assertion, B01's unsupported enumeration oracle and the separate clock handoff. No new gesture, case, Manual call or internal replacement is requested.

- **2026-11-08 — Coder ID cleanup accepted and Stop 2 resumed (Nathan).** The Coder removed the retired ID stamp from the internal projection regression; the Automator verifies a title-only change and no remaining active DRAG-4.35 automation. B14 is deleted, B09's guard-only retirement is applied and all five retained pilot variants pass. Nathan authorizes continuation within the revised matrix, without an app fix or broader validation sweep.

- **2026-11-08 — DRAG-4.35 retired (Nathan, after working through the defect with the PO).** Superseded the immediate Coder fix. Removed the case, active assignment and B14 matrix; its defect and fresh future coverage belong to the Descendants highlight-cue story. The relevant test writers remove its automation. B09's separate functional seed/save test stays, with its disputed line-place guard removed under the earlier ruling. The active batch is now 26 cases / 70 scoped variants; the retired ID is not reused.

- **2026-11-08 — B09's nested-line question ruled (PO, at Nathan's direction).** Nathan took the nested-last fixture as a small defect he accepts for now, and routed it to a tech-debt story that revamps the Descendants highlight cue (`docs/planning/tech-debt-stories/descendants-highlight-cue.md`). The blue line is drawn in the row the item falls into in the flattened list, so it doesn't always sit beside the anchor the release names. That is current expected behavior. At the zoom's seed it can sit a row above the ghost, and it agrees with the ghost once the pointer moves. So:
  - **The wiki doesn't mention the scenario,** and no rule is changed. The wiki already states the seed's ghost and the saved last child (board-drag-interaction §7, hierarchy-placement §1).
  - **The disputed line-place guard is removed** from B09 and from the batch plan. The PO reads Nathan's "test case" as that guard, the line-location assertion. DRAG-4.30's seed and its saved last-child result stay, with B09's other assertions, since they are wiki rules (§7) and not in dispute. Nathan can overrule.
  - **The Planner removes** the guard from the Stop 2 table row and notes above, so the batch holds no red expectation for it. **The Automator removes** it from B09's spec. The later DRAG-4.35 retirement below supersedes the separate leaf-case repair handoff.
  - **The tech-debt story restores it** as a test once the new cue is built.

- **2026-11-08 — Batch 4b Stop 2 authorized (Nathan).** Approved the Stop 1 proof/variant plan and directed tests/discovery to the next checkpoint. The same Automator resumes within the approved Playwright scope; separate Coder and validation boundaries are unchanged.

- **2026-11-08 — Batch 4b Stop 2 early checkpoint (Test Planner, from the Automator).** Authored five expressions / six variants, executed five unique variants and stopped before expansion. Preserved B14's exact highlighted-neighbor request failure and B09's separate nested-neighbor PO question, each reproduced three times. The saved orders are correct in these fixtures; no app/helper/Vitest change, case/status edit or commit. Root gate passes; full D2/E2E and reconciliation remain unrun.

- **2026-11-08 — Batch 4b Stop 1 (Test Planner, with the Test Automator).** Prepared the 27-case proof/variant plan and 78-variant scoped forecast, clarified DRAG-4.22 from settled wiki rules, corrected the legacy own-column title assignment and recorded the separate clock-test Coder handoff. No test/app edit or runtime execution. Stopped before Stop 2.

- **2026-11-08 — Five-stop workflow approved (Nathan).** Added proof/variant review, tests/discovery, separate Coder/review, frozen validation and reconciliation/closure as explicit session stops for 4b–4h. Every applicable stop returns a concrete handoff to Nathan; the next stage does not begin automatically. Added a resume packet at each boundary. Stop 3 is conditional on Coder work; D2, case assignments and batch order are unchanged.

- **2026-11-06 — Phase 2 step 5 (Planner).** Applied D13, recorded the five shared Manual IDs, removed DRAG-1.27 and TREE-2.8 from automation assignments and adjusted the table to 152 Open cases. Clarified the three supporting references in DRAG-6.27, TREE-1.1 and TREE-2.13, preserving their timing, placement and geometry assertions. The baseline remains a pre-D13 reconciliation snapshot; current catalog wording governs the next briefs. No existing ID is retired or reassigned to another suite.

- **2026-11-06 — Phase 3 (Planner).** Recorded the completed helper/refactor phase, approved DRAG-6.25 fix and final validation. The inventory and routes are unchanged; four Automation paths and four stale internal title claims are maintained. The next batch is 4a after Phase 3 review/commit.

- **2026-11-08 — Batch 4a (Planner, from the Automator, Coder and Reconciler).** Completed the 34-case batch and all six Coder handoffs; recorded the sole DRAG-1.16 body clarification, exact D2 recovery proof, full E2E/root results and per-kind/helper/cost checkpoint. All 34 cases are Automated; 118 original story assignments remain Open. No new internal/Manual approval, ID allocation, routing change or process decision. Stopped before 4b and any commit.

- **2026-11-09 — Testing Roles Refactor, batch 4 (Test Planner).** Updated 4c–4h's five stops to the QA Engineer, read-only desk and Test Reviewer, tree IDs, one current Results packet, background JSON ledgers and one cold end-of-batch reconciliation. Replaced accumulated historical Results packets with the current between-batches packet; Git, the proof plan and the named reports retain earlier evidence. Moved Phase 2's approval text verbatim into the append-only Review log, retaining all declined mappings and granting no new ones. D7/D12 in the main plan carry the separate Coder session/check-in and shared Vitest limits. Batch 4b is committed; its cases, D2 results and deferred DRAG-3.12 finding remain settled. No 4c work or parallel-runner carry-forward is authorized by this amendment.

- **2026-11-10 — Adopted runner and bounded flake deferrals (Nathan).** Adopt three workers to reduce suite runtime while Story 10 proceeds. Keep DRAG-7.10 active and fix its missing-column-context/retained-attachment failures in 4c. Temporarily skip both DRAG-3.16 variants and restore them in 4h together with the six legacy skips; its observed failure is a project-creation connection reset before drag setup. The runner report preserves all failed attempts and comparisons. The historical assignment table and 4a/4b evidence are retained; the catalog owner receives the temporary DRAG-3.16 proof gap. D2 and the five session stops are unchanged.

- **2026-11-10 — Five-worker default after the extended trial (Nathan).** Replace the initial three-worker default with five for its measured speed benefit and no newly observed failure identity or mode. Future D2 repeats and batch-final runs use five. Re-evaluate with the smoke suite, considering lower E2E frequency outside Story 10 and capacity for simultaneous work; revisit sooner if failures or contention change. Six is dropped for its small additional saving. Failure destinations and D2's bar stand.

## Open questions

### Batch 4c Stop 5 — from the Reconciler (2026-11-12)

The [report](../../audits/test-reconciliation-story-10-batch-4c.md) has the detail.

**Deferred to batch 4j (Nathan, 2026-11-12):** the DRAG-7.10 / DRAG-1.14 hold-opened distance variants don't assert their rest point lies in P's box (Results, "What remains"), and the three candidates below. The batches doc's 4j has the facts for each.

**For a Planner session (candidate new cases, in 4j):**

1. The hierarchy modal closes by itself when its Card is gone or its hierarchy is empty, without waiting for an open Sheet. Wiki board-drag-interaction §9 states it, and the Reconciler finds no case's Then that holds the Card-gone half.
2. A Stub's drag that pops out to its column keeps the carried copy under the pointer as the copy narrows (wiki §5a). Only the Coder's unnumbered re-anchor tests in `dragOverlayGeometry.test.ts` cover it.

**For the PO (in 4j):** in the Sheet, Escape ends an edit of a title before it closes the Sheet. The Coder's return makes it so, and the wiki doesn't say.

### Batch 4c Stop 2 — defects, hooks and questions (QA Engineer, 2026-11-11; updated 2026-11-12 after the Coder's return)

**Answered by the Coder's return** (Results has the evidence):

1. **DRAG-7.10, "bounded by `K`"** (the PO ruled the wiki stands, Amendments): fixed. The five tests that were red pass unchanged.
2. **The Escape lost as the Sheet opens over the modal:** the Coder's return changes the Sheet's and the modal's Escape handling, with Vitest tests. The surface tests still wait for the Sheet to be in place, so no Playwright run has pressed Escape early since; the trace's early-Escape sequence wasn't rerun.
3. **The two clock tests in `popSession.test.ts`:** both written. The DRAG-7.14 run-on test closes the reviewer's last gap. The two-excursion test carries no ID yet: it waits on question 1 of the Stop 1 list below.
4. **The cue hook:** `data-drag-cue` on the fill bar. `cueOn` now reads it.

**Decided by Nathan (2026-11-12):** the reviewer's cost notes as recommended (DRAG-7.10's matrix cut to eight; DRAG-7.17, 7.18 and 7.31 kept); Stop 4 repeats the five files whole; `awaitProjection`'s header reworded.

**Found at Stop 4 (2026-11-12), adjacent and not 4c's:** `DRAG-5.3: B18 … locked-after-A detach uses the destination meaning` failed once in each of its two variants at five workers, in unchanged batch 4b tests. The merged variant: `read ECONNRESET` on a `GET /api/items/:id` about six seconds into the test, the flake investigation's cause D. The expanded variant: a 30 s wait for the sub-row's bottom carve divider, cause not established. Both passed 20 of 20 on their own. For Nathan to route: the investigation's D1, a longer keep-alive timeout on the server, is a Coder change that isn't in the tree.

**Answered by the Planner (2026-11-12),** besides the six Stop 1 answers below. The numbers remain for Review log references:

5. **DRAG-7.32: is a Sheet that is still sliding in "open"?** Yes, once it has begun opening and is visible above the modal. The case now says Escape during its entrance closes only the Sheet. This follows wiki board-drag-interaction §9's one-Escape-at-a-time rule; it needs no timing or animation claim.
6. **DRAG-7.31: "no request" against "writes nothing".** The title says the one and the Then said "*then* no request is sent". The case now says no item write request is sent from pickup through release. Read requests and background polling are outside the no-write rule in wiki board-drag-interaction §7.1 and hierarchy-placement §5. The test's non-GET request observation is stronger than the final-release-only check.
7. **DRAG-7.17's Given doesn't say the spot is within the modal's reach** (raised by the [flake investigation](../../audits/story-10-drag-flake-investigation.md)). The Given now requires that the modal's scroll range can put the spot under the cursor after it is kept inside the window. Where it cannot, DRAG-7.16's fresh reading governs. The gap-above test keeps the spot within reach.

### Batch 4c Stop 1 — Planner answers (QA Engineer questions, 2026-11-11; Planner answers, 2026-11-12)

From the desk's verdicts (Review log). The original question numbers remain for references there. Nathan (2026-11-11) directed that the Planner's answers stand unless the Planner needs a PO or Nathan ruling. The Planner resolved all six from the in-force wiki; no PO ruling is needed. The case changes and consequences for the QA Engineer and Coder are below.

1. **DRAG-7.10 r6.** The case's Then now includes two excursions outside the modal, each short of `popDelayMs` and `popDistancePx`, whose combined time exceeds `popDelayMs`. Returning between them restarts the clock, so the modal stays open. The Coder's two-excursion clock test carries DRAG-7.10, whose Given is a modal drag. DRAG-1.30's Given is a Card locked in its column, so its ID does not cover this modal variant. The existing surface test keeps its single-excursion assertion. Wiki board-drag-interaction §3.1 governs every pop-out layer.
2. **DRAG-7.15 r6.** Drop the overflow-row top-quarter one-step aim as stated. With the ghost directly beside the overflow row at its level, wiki board-drag-interaction §7.3 starts the hold; a release before its completion can still save the same gap by DRAG-7.13. At another level, the hold does not run but the release names another placement. No case asserts "no hold" and the same modal-hold placement together. The valid one-step aim at `R`'s own row stays. This answer supersedes item 10's contradictory aim and the earlier 4c note above.
3. **DRAG-7.9 r2 and r3.** The case now says that each of its four released placements leaves `R2` attached with `P`'s workphase; it doesn't require a separate mid-drag attachment assertion. Its named gaps already include hidden rows, so the broad closing sentence has become a concrete statement about those two gaps, without an independent every-placement enumeration. The existing saved-state assertions follow the revised Then.
4. **DRAG-7.14 r5.** The padding clause now states the ghost's gap and level when the modal can place its spot under the cursor inside the window: it stays at `R`'s first or last child. If the window edge shifts the modal, DRAG-7.16 governs the fresh cursor reading. The QA Engineer adds the ghost assertion for the within-reach padding variant. Wiki board-drag-interaction §7.3 supplies both outcomes.
5. **DRAG-7.18 r1.** A single reopen demonstrates reopening once, but the wiki's "as often as the drag needs" also covers another cycle in the same drag. The case now names two exits and two reopens, with no write before the final release. Extend the test to a second reopen; no count beyond that is fixed by the rule.
6. **DRAG-7.27 r3.** `T` is an attached child of `Q` in the suite's tree, so it leaves every list when `Q` is carried, as `R` does. The case now names `T`'s row alongside `R` and `R`'s overflow row. Extend the `Q`-carried assertion to `T`; DRAG-8.1 keeps the generic branch rule in its own setup.

**For the PO:** none.

### Standing entries

- **For the QA Engineer / Test Reviewer, before 4d's freeze — DRAG-6.5 response-order evidence (checkpoint audit, 2026-11-10):** `tests/ui/drag-preview-reconciliation.spec.ts:61–88` delays the first response by 2,500 ms, sends a second move, and waits another 3,000 ms before its final assertions. The cold audit pass asks whether this establishes that the second answer actually arrived first, independently of elapsed time. The baseline reconciliation's DRAG-6.5/E489 row records the scenario as complete, but does not address this specific ordering-observation question. Have the Test Reviewer assess it under the new workflow and record the verdict; if a correction is needed, establish the response ordering explicitly. This is a review question, not an audit coverage verdict, a new case, or a status change.

- **Separately recorded follow-up — existing conditional DRAG-3.12 Board set-down; nonblocking for 4b (Nathan):** the null-return review finds that Board layer + Free X with null position + its own covered active region + other positioned rows selects a write. DRAG-3.12/wiki board-drag-interaction §5 require no request for this own-region middle release. The branch existed before this return, and real-board reachability remains unproved. If Nathan later routes this work, add a deterministic composed regression for that exact context/peers/null boundary, then the minimal Board set-down guard if the regression confirms the static finding. Preserve the valid locked-Column bare-container append with explicit unchanged `workphaseId`, foreign-middle no-anchor fallback, positioned same-region no-write, empty-peer no-write, end preview and explicit Top/Bottom anchors. Do not remove the workphase field globally or alter case wording to match a write. The request-rule internal category is already approved; application/Vitest work still uses a separate session with exact changed files/source identity and paired red/green evidence. Nathan checks in before later automation. This adds no case ID or 4b assignment and does not hold up the batch close-out; the existing catalog status/pointer is unchanged for this deferred issue.

- **For a separate Architect review, with PO input if needed:** review 4a's seven production files and paired regressions against the wiki before accepting the app changes. The retrospective gives the review manifest and the two Planner/observer interpretations to spot-check. No new review or implementation session has been started.

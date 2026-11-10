# Epic 3.5 Story 10 — the inventory and the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation · **Status:** Phases 2–3 and batches 4a–4b are committed; 4b is `857720b9`. All 26 cases in 4b are Automated, with 1,400 repeat passes, final E2E 394 passed / 21 existing skips / zero failed and root gate green. The remaining batches use the Testing Roles Refactor's workflow below. Batch 4c has not started and waits for the catalog coverage report and parallel-runner work. Conditional DRAG-3.12 stays separately recorded and nonblocking; DRAG-4.35 stays retired.

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D13), Phases 1–3 and Phase 5. This doc holds the part that grows while the work runs: each Open case's batch and how it closes, each skip's fate, the checkpoint after 4a, and each batch's results. A change to a decision is amended in the plan. A change to a case's route is amended here.

**Execution boundary for 4c–4h:** Nathan opens a QA Engineer session for each stop and names its file list. The QA Engineer owns automation, its Results and the Review log; it may spawn the Planner desk, Test Reviewer and end-of-batch Reconciler. The Planner owns case decisions, remains code-blind and spawns none of them. Hooks and test routes are bundled into one separate Coder session per stop, with Nathan's check-in at its return; a behavior change still gets its own handoff. The QA Engineer shares Vitest work under D12's limits and never edits app source. D7/D12 in the main plan govern this boundary. D2's twenty-repeat bar, case assignments and batch order are unchanged. Once the parallel runner lands, D2's repeats and each batch's final full run use its adopted worker count (D2, amended 2026-11-09).

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

These rules apply to 4c–4h under the [Testing Roles Refactor](../tech-debt-stories/testing-roles-refactor.md), decisions 1–16. Batches 4a–4b ran under the prior roles; their committed reports retain that history. **One session per applicable numbered stop, ending with a concrete handoff to Nathan. A green result does not automatically start the next stop.** Nathan names the session's file list and directs the next stage. A checkpoint does not require a commit. Stop 3 is conditional on Coder work being needed; the other stops still apply.

### Stop 1 — Proof and variant review

The QA Engineer establishes what the batch must prove before broad test authoring:

- list the assigned case IDs and the exact missing clauses from the current cases and Reconciler report;
- describe the observable proof from the case/wiki, including requests, saved results, state and geometry where required;
- list the scenario matrix and expected expanded runnable-variant count, distinguishing catalog cases, authored tests and parameterized variants;
- identify helper/fixture needs, representative observations to check, known Coder dependencies and questions for the Planner or PO.

Use the read-only Planner desk for reading questions, asked from the case rather than the app. Record the questions and replies word for word in the Review log, with the quoted Then. Continue the same desk agent for a follow-up within the task. Rewording, a Split, a Pending PO question or a Manual call requires a Planner session Nathan opens; a rule gap goes to the PO through Open questions.

**Deliverable:** a proof/variant plan and Nathan's explicit implementation file list for Stop 2. A new helper or observation is checked on a representative scenario before its matrix is expanded. New case scope or a rule ambiguity goes to its owner rather than silently joining the batch. Run the gate before the check-in.

### Stop 2 — Tests and discovery

The QA Engineer writes or extends tests and support against a named app tree. It works one matrix family at a time, rewrites the current Results packet after each family, and runs focused checks to establish the scenarios. Every test asserts its Given before its When, and each observation helper's header says whether it reads the screen or an app-provided attribute. Each added/changed test passes alone and in its file's full run.

Before the check-in, it spawns the Test Reviewer for its tests and the Coder's listed ID-bearing Vitest assertion/setup changes. The brief names the cases, tests and changed files since the last pass; every correction after a red run is shown before-and-after, without justification. The reviewer widens to every ID in changed files. Record every verdict word for word in the Review log. Test gaps go to the QA Engineer, case gaps to a Planner session and rule gaps to the PO. A Reconciler run is not part of this stop.

**Deliverable:** tests/helpers, focused results, actual variant count, reviewer verdicts and a consolidated defect/hook/question handoff. Each failing case states its expected wiki-backed clause, actual surface result, reproducer and saved evidence; it may name where diagnosis looked, never prescribe the fix. Preserve failing assertions; never edit a test to make it pass. No app source changes here. A new Vitest test is only for a held-off case after the reviewer's internal-coverage verdict and Nathan's approval, from the Then. The full D2 sweep waits for Stop 4. Run the gate, and `/code-review` at `medium` on changed shared test infrastructure, recording findings and actions in Results; correctness fixes stay in the batch, cleanup suggestions are notes.

If a Coder dependency blocks an earlier stage, hand it off when found; every test needn't be finished first. Held-off cases remain Open and explicit in Results. The Test Reviewer weighs internal coverage before Nathan decides; a Manual decision is applied in a Planner session or by the Reconciler at the close. The QA Engineer never proposes or sets Manual.

### Stop 3 — Separate Coder and review

Nathan routes one separate Coder session per stop, carrying that stop's hooks and test routes. A behavior change still gets its own handoff. The QA Engineer does not spawn a Coder. A defect handoff names the failing case/wiki clause, expected and observed surface results, reproducer and assertions that must remain intact; it never prescribes a fix. Nathan names the file list. Approved title stamps and permitted Vitest work can be done by the QA Engineer under D12, without a Coder handoff solely for those edits.

**Deliverable:** the Coder's return with start/end tree IDs, changed behavior/files, paired regression evidence, validation and `/code-review` record, followed by Nathan's check-in before automation resumes. The return lists ID-bearing Vitest tests whose assertions or setup changed, for the QA Engineer's Test Reviewer pass; renames/imports alone don't need it. Rerun the original failing surface test unchanged first. Case or rule changes go separately to their owner. Complete unfinished authoring, focused validation and reviewer answers before the freeze. If no Coder work is needed, record Stop 3 as not needed.

### Stop 4 — Frozen validation

The QA Engineer freezes the accepted tree ID, exact runnable selection and expanded variant count. Use the temporary-index method in `.claude/guides/testing-strategy.md`, "A snapshot of the tree": untracked files count and the real index stays untouched. Tree IDs replace per-file fingerprints. The QA Engineer stamps its Playwright tests and approved Vitest mappings before the freeze, checks title-only diffs and runs `check:docs`.

- apply D2's twenty repeats to every added/changed drag test, with retries and every failed attempt disclosed;
- run the final full E2E suite and root gate sequentially after the repeat requirement is met;
- run long commands in the background with a named JSON report per repeat batch as the ledger; recover completed records before restarting anything after an interruption;
- retain exact selections, per-variant results, tree IDs, command exits and interruption/continuation accounting so another session can inspect completion without reconstructing the chat;
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
| **All**                                     |     27 |  87 |     12 |    24 |     1 |   151 |

The Coder column counts cases closed by Coder work alone. A batch's notes name the Coder halves of other cases. Step 5 assigned 152 Open cases; Nathan's later retirement of DRAG-4.35 leaves 151 active assignments. Batches 4a and 4b close 60 of them (34 and 26), leaving 91 still Open. DRAG-1.27 and TREE-2.8 are now shared Manual cases rather than automation assignments; the three new Manual IDs are listed under The shared looks. The 26 original Split IDs are all retained.

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

- **DRAG-7.28:** add its ID to DRAG-7.9's first-child test, which saves `R2` before `R1a` (the report's Proposed Stamps).
- **DRAG-7.10 (8.13 audit #8):** the Coder moves the two excursions' reset into a `popSession.test.ts` clock test. The spec keeps reachability and the write, with thresholds from `seedDragTuning`.
- **DRAG-7.15 and 7.27's aims:** see the roadmap entry's item 10, "From Story 8.3". The gap below `R`'s overflow row is drawn for an aim in the overflow row's band. The one-step spec aims at `R`'s row center and at the overflow row.
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

**Also restore DRAG-3.16 (Nathan, 2026-11-10).** Both parameterized tests in `tests/ui/drag-band-contracts.spec.ts` are temporarily skipped: the clipped-content-top branch and the restored-content-top branch. One of five three-worker contention copies of the clipped branch failed before drag setup with `ECONNRESET` on `POST /api/projects`; its other four copies and five focused one-worker repetitions passed. Investigate that setup/transport failure, restore both variants' whole-Then proof and apply D2 at the adopted five-worker count. Do not treat the connection reset as evidence about the band outcome. Evidence is `tests/output/parallel-workers-batch3/drag-3w-repeat5.json` and `setup-reset-1w-repeat5.json`, with details in the [runner report](../tech-debt-stories/e2e-parallel-workers.md).

This is a return to DRAG-3.16's existing 4a automation, not a new case or an extra original assignment in the historical batch table above. Its temporarily suspended proof must be reflected by the catalog owner; prior 4a certification remains historical evidence, not current passing automation while both tests are skipped.

The six legacy skips carry no catalog IDs. Their separate disposition remains as item 3 says:

1. re-check the precision problem they were skipped for, since a column drop now lands where the ghost is;
2. then re-derive each against DRAG-3 and 4b's DRAG-4.5, or delete it where its API twin pins the math.

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
|                                                | DRAG-7.10, 7.18, reopening the modal in the same drag       | Rework, with no Card layer                                                                                    | 4c    |
| `drag-7-overflow-row.spec.ts`                  | DRAG-7.27, R carries its overflow row                       | Rework, at an aim that's been tried                                                                           | 4c    |
| `project-tree-drag.spec.ts`                    | TREE-1.4, a subtree that holds every project                | Rework, aimed at the dragged project's own row                                                                | 4g    |
|                                                | TREE-2.1, descendants dimmed                                | Rework to the branch's absence and the tier attributes, with #12's title and reason replaced                  | 4g    |
| `item-repositioning-cross-column-dnd.spec.ts`  | 1.a and 2.a                                                 | Re-check, then re-derive or delete (4h)                                                                       | 4h    |
| `item-repositioning-cross-project-dnd.spec.ts` | 1.a, 2.a, 2.b and 4.b                                       | The same                                                                                                      | 4h    |

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

**Current packet: between 4b and 4c.** Batch 4b closed and is committed in `857720b9`; its commit tree is `631241f916defe6e8f696dd4c3537fb1a4f62f8f`. That identifies the committed close, not a newly frozen certification run. The Testing Roles Refactor's batch 4 updates this workflow before 4c. Historical packets remain in Git and the named reports; each future stop replaces this packet.

- **Completed cases:** all 26 in 4b are Automated: four Extend, twenty New and two Rework. The [confirming report](../../audits/test-reconciliation-story-10-batch-4b.md) holds final whole-Then mappings and associated DRAG-3.3 pointer maintenance. No new Manual or internal-mapping approval is pending from that close.
- **Accepted execution:** 26 authored/changed expressions, 70 scoped variants, 1,400 distinct repeat passes with zero failures/retries/scoped skips. The five-file union includes unchanged DRAG-1.14 and has 71 variants. Final E2E: 394 passed / 21 existing skips / zero failed. Root gate: 444 server / 1,040 client / 258 script tests; docs 433 / zero hits. Measured command time: 122.96 minutes. The background run completed during a delivery interruption; recovery repeated no command. These are 4b's results, not a new run under the refactored roles.
- **Evidence:** `tests/output/batch4b-stop4-completion-verified.json`, `batch4b-stop4-ledger.json`, `batch4b-stop4-freeze.json`, the 26 `batch4b-stop4-b*.json` cohorts (B14 retired), `batch4b-stop4-final-e2e.json` and `batch4b-stop4-root-check.log`. The final report and the [proof plan](story-10-batch-4b-proof-plan.md) retain the case/variant mapping. Earlier defects and Coder returns are in the 4b proposing, coder-return, post-coder, append-return and null-return reports under `docs/audits/`; no old report is rewritten.
- **Inventory at the refactor checkpoint:** 484 catalog cases: 378 Automated / 93 Open / 10 Manual / one Planned / two Pending PO. Of 151 active Story 10 assignments, 60 were closed and 91 remained Open. The later runner-adoption decision temporarily suspends DRAG-3.16's automated proof and routes its two skipped variants to 4h; these counts are the pre-deferral snapshot, not a freshly reconciled catalog. No case/status is edited in this QA session.
- **Next batch's state:** no 4c work is authored or reviewed under the new workflow. Its assigned IDs are DRAG-7.28, DRAG-1.14, DRAG-7.13, DRAG-7.31, DRAG-3.25, DRAG-7.6, DRAG-7.9, DRAG-7.10, DRAG-7.14, DRAG-7.15, DRAG-7.17, DRAG-7.18, DRAG-7.27, DRAG-7.32 and DRAG-7.12. Existing tests/skips and missing clauses remain the inventory's starting inputs; no 4c variant count or frozen tree is claimed.
- **Runner adoption and follow-ups:** Nathan adopts five workers by default after the extended worker-count trial: five's median is 3m 25.1s, 38.2s faster than four, with no newly observed failure identity or mode. Re-evaluate with the smoke suite, when E2E runs should be less frequent relative to other story work and capacity for simultaneous work may matter more; revisit sooner if failures or contention change. DRAG-7.10 stays active and is fixed in 4c; both DRAG-3.16 variants are skipped until 4h alongside the six legacy skips. D2's twenty-repeat bar remains unchanged and runs at five workers. This does not start 4c or certify the deferred cases.
- **Open questions:** conditional DRAG-3.12 remains separately recorded and nonblocking, with real-board reachability unproved; it triggers no new reconciliation/Coder loop here. The runner's default/failure-routing decision is settled. The catalog report and remaining parallel-runner documentation handoff must land before 4c starts. The catalog owner must reflect DRAG-3.16's temporary proof gap. Other role-addressed questions remain below.
- **Files in scope:** none authorized for 4c yet. Nathan names its Stop 1 file list when opening the QA Engineer session. No app/test/catalog-case edit is part of this refactor amendment.
- **Last reviewer tree:** none under the new roles. The completed 4b reconciliation is prior evidence, not a Test Reviewer pass invented after the fact. Declined mappings are carried into the Review log below.
- **Next owner/action and command:** Architect completes the parallel story's batch 4 documentation/default handoff; the catalog-report prerequisite and DRAG-3.16 catalog handoff remain. After the prerequisites land, Nathan opens the QA Engineer's 4c Stop 1 session, including the DRAG-7.10 runner-trial evidence above. Its first inventory command is `npm run report:catalog`, which the prerequisite story adds; it is not run or assumed present here. No 4c tests, D2 repeats or reconciliation have run.

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

No desk answer or Test Reviewer verdict has been issued under the new workflow yet.

## Amendments

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

- **For the QA Engineer / Test Reviewer, before 4d's freeze — DRAG-6.5 response-order evidence (checkpoint audit, 2026-11-10):** `tests/ui/drag-preview-reconciliation.spec.ts:61–88` delays the first response by 2,500 ms, sends a second move, and waits another 3,000 ms before its final assertions. The cold audit pass asks whether this establishes that the second answer actually arrived first, independently of elapsed time. The baseline reconciliation's DRAG-6.5/E489 row records the scenario as complete, but does not address this specific ordering-observation question. Have the Test Reviewer assess it under the new workflow and record the verdict; if a correction is needed, establish the response ordering explicitly. This is a review question, not an audit coverage verdict, a new case, or a status change.

- **Separately recorded follow-up — existing conditional DRAG-3.12 Board set-down; nonblocking for 4b (Nathan):** the null-return review finds that Board layer + Free X with null position + its own covered active region + other positioned rows selects a write. DRAG-3.12/wiki board-drag-interaction §5 require no request for this own-region middle release. The branch existed before this return, and real-board reachability remains unproved. If Nathan later routes this work, add a deterministic composed regression for that exact context/peers/null boundary, then the minimal Board set-down guard if the regression confirms the static finding. Preserve the valid locked-Column bare-container append with explicit unchanged `workphaseId`, foreign-middle no-anchor fallback, positioned same-region no-write, empty-peer no-write, end preview and explicit Top/Bottom anchors. Do not remove the workphase field globally or alter case wording to match a write. The request-rule internal category is already approved; application/Vitest work still uses a separate session with exact changed files/source identity and paired red/green evidence. Nathan checks in before later automation. This adds no case ID or 4b assignment and does not hold up the batch close-out; the existing catalog status/pointer is unchanged for this deferred issue.

- **For a separate Architect review, with PO input if needed:** review 4a's seven production files and paired regressions against the wiki before accepting the app changes. The retrospective gives the review manifest and the two Planner/observer interpretations to spot-check. No new review or implementation session has been started.

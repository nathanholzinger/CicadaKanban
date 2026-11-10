# Epic 3.5 Story 10 — the inventory and the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation · **Status:** Phases 2–3 and batch 4a are committed. Batch 4b is complete for review: all 26 scoped cases are Automated, with 1,400 repeat passes, final E2E 394 passed / 21 existing skips / zero failed and root gate green. The confirming report and close-out are below. Nothing is committed and 4c has not started. Conditional DRAG-3.12 stays separately recorded and nonblocking; DRAG-4.35 stays retired.

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D13), Phases 1–3 and Phase 5. This doc holds the part that grows while the work runs: each Open case's batch and how it closes, each skip's fate, the checkpoint after 4a, and each batch's results. A change to a decision is amended in the plan. A change to a case's route is amended here.

**Execution boundary for the remaining batches:** Nathan requires a separate Coder handoff/session and check-in for every Coder task, including internal tests, hooks, title stamps and small app fixes. The Planner may continue to delegate to the Test Automator and Reconciler. An automation session's implementation scope is Playwright tests and support under `tests/`; documentation ownership remains unchanged. D7/D12 in the main plan govern this boundary. Nathan has approved the five stops below for the remaining batches. D2's twenty-repeat bar, case assignments and batch order are unchanged.

## How to read it

- **The report owns what each case misses.** The [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping gives each Open case's ID-bearing tests and the exact clauses they miss. This doc routes the case and doesn't restate the clauses, so a batch's brief starts from the report's row. D13's current catalog wording supersedes the baseline's paint obligations: those now belong to the shared Manual cases below. Saved outcomes, target/state selection, positions and sizes still belong to the automated cases. Once a batch has run, its confirming run's report is the later word for its cases.
- **The roadmap entry's items** (1–11) reach this doc by case, through the report, which read every case they route. Their non-case items are D3's, D4's and D8's.
- **Every case ends `Automated` by a surface test,** a Playwright test written by the Test Automator, unless its batch's notes say otherwise. A Split case's look ends `Manual`, in a shared case (D13).
- **The kinds of work:**

  | Kind   | Means                                                                                                                                                   | Writer                  |
  | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
  | Extend | A running test that carries the ID gets the clause it misses, or a running test takes the ID                                                            | Automator               |
  | New    | A new test, usually a gesture                                                                                                                           | Automator               |
  | Rework | A skipped spec, reworked to its case as it now reads (D3)                                                                                               | Automator               |
  | Split  | The Planner rewords the case to the part a test can pin, and moves its look to a shared `Manual` case (D13). The pinned part is then an Extend or a New | Planner, then Automator |
  | Coder  | A Vitest test, a test hook or a fix (D7, D12)                                                                                                           | Coder                   |

- **No request, or exactly one:** many *Then*s say so, and the request harness checks it (D4). Saved fields alone don't prove it (the report's Test Quality Concerns, #5).

## The five stops for each remaining batch

These rules apply to 4b–4h. A batch is divided by the kind of work as well as by its cases. **Each applicable numbered stop ends with a concrete handoff to Nathan and an end to the current session; a green result does not automatically start the next stop.** Nathan directs the next stage, which can resume in a fresh context. A checkpoint does not require a commit. Stop 3 is conditional on Coder work being needed; the other stops still apply.

### Stop 1 — Proof and variant review

The Planner and Automator establish what the batch must prove before broad test authoring:

- list the assigned case IDs and the exact missing clauses from the current cases and Reconciler report;
- describe the observable proof from the case/wiki, including requests, saved results, state and geometry where required;
- list the scenario matrix and expected expanded runnable-variant count, distinguishing catalog cases, authored tests and parameterized variants;
- identify helper/fixture needs, representative observations to check, known Coder dependencies and questions for the Planner or PO.

**Deliverable:** a reviewed proof/variant plan and explicit implementation scope for Stop 2. The Planner remains code-blind; the Automator supplies implementation-facing details. A new helper or observation is checked on a representative scenario before its matrix is expanded. New case scope or a rule ambiguity is routed to its owner rather than silently added to the automation work.

### Stop 2 — Tests and discovery

The Automator writes or extends the Playwright tests and support against a fixed app snapshot. It runs focused checks to establish the scenarios and reports clause coverage, failures and observation questions. A proposing Reconciler review may identify missing proof before expensive repeats.

**Deliverable:** tests/helpers, focused results, the actual variant count and a consolidated defect/hook/question handoff. Each failing case states its expected wiki-backed clause, actual result, reproducer and saved evidence. Preserve failing assertions; do not weaken, skip or change an expected result to match the app. No app source or Vitest work occurs in this stop, and the full D2 certification sweep waits for Stop 4.

If a Coder dependency blocks an earlier stage, hand it off when found. There is no requirement to finish every test before taking that boundary. Cases held off remain explicit and go to the Reconciler under D5.

### Stop 3 — Separate Coder and review

All Coder work uses a separate handoff/session after Nathan's check-in, including internal tests, hooks, test routes, title stamps and small fixes. The Planner does not spawn a Coder inside the automation session. The handoff names the case/wiki rule, failing evidence or missing support, proposed scope and files, and which assertions must remain intact.

**Deliverable:** the Coder's return with changed behavior/files, source version, paired regression evidence and validation, followed by Nathan's review/check-in before automation resumes. Rerun the original failing surface test unchanged first. Any proposed case, expected-value or observation change is presented separately to its owner. Resume unfinished authoring/focused validation as needed before freezing the certification inputs. If no Coder work is needed, record Stop 3 as not needed in the Stop 2 handoff.

### Stop 4 — Frozen validation

Freeze the accepted app and test snapshot, exact runnable selection and expanded variant count. One Automator owns the run and its durable logs/result JSON; completed per-variant records and fingerprints, rather than chat progress counters, determine acceptance.

- apply D2's twenty repeats to every added/changed drag test, with retries and every failed attempt disclosed;
- run the final full E2E suite and root gate sequentially after the repeat requirement is met;
- retain exact selections, per-variant results, source/test fingerprints, command exits and any interruption/continuation accounting so another session can inspect completion without reconstructing the chat;
- keep authoring and repair outside this stop. A proposed app, test, helper or expected-assertion change ends the frozen pass and returns to the relevant handoff. Explain which earlier evidence remains valid before rerunning it.

**Deliverable:** the repeat-acceptance ledger, final suite/gate results, unchanged-snapshot evidence and any unresolved failure packet. Runtime stalls and delivery waits are recorded separately from executed test results and measured runner time. Long execution is a distinct task from authoring; avoid duplicate Planner/worker monitoring and repeated narrative copies of the same evidence.

### Stop 5 — Reconciliation and closure

The Planner supplies the final accepted snapshot, runtime evidence, case changes and held-off cases to the confirming Reconciler. The Reconciler checks the whole current Then, carries forward prior analysis where its inputs are unchanged, reviews changed evidence and performs all mandatory global checks. Only the Reconciler sets coverage statuses and Automation fields.

**Deliverable:** the confirming report, catalog updates, remaining gaps/proposals and a compact batch close-out for Nathan. Record cases closed by work kind, authored/expanded counts, helpers, Coder handoffs, execution cost and what remains. Any proposed Manual call or new internal mapping follows the existing approval rules. End at review/commit; do not start the next batch automatically.

### Resume packet at every stop

Update this plan's Results with the batch/current stop, completed work and the next owner/action. Include the case IDs and proof/variant matrix; changed files and allowed scope; accepted source/test version or fingerprints; completed commands and evidence paths; unresolved failures/questions and required check-ins. Mark unrun checks explicitly. Each packet must let a fresh session continue without rereading the full prior conversation. An unexpected dependency or usage interruption also leaves this packet rather than quietly joining the remaining stages into one session.

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

No case carries their IDs. As item 3 says:

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

## Approvals (Phase 2 step 4)

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

## Results

Each batch's stop adds its results here: the cases closed, the specs that missed the bar, the helpers added, and what's routed on.

**Phase 2 step 5 — 2026-11-06 (Planner):** all 26 listed Split cases are processed, with five shared Manual cases in the table above. Twenty-four existing IDs remain Open for their automatable clauses; two retain their IDs as shared Manual cases. Three new Manual IDs are allocated, and all Next ID lines are advanced. There are now 152 Open batch assignments, plus the five shared Manual appearance checks. No app or test code was read or changed in this pass. This is the step 5 stop; Phase 3 has not started.

**Validation:** documentation checks pass (418 files, zero hits), all 485 catalog cases agree with their summary tables and required metadata, and all 152 in-scope Open cases have exactly one batch assignment. `git diff --check` passes. No runtime or manual test run is claimed.

**Phase 3 — 2026-11-06:** D4's helpers and spec split are complete; [the main plan's Phase 3 results](story-10-dnd-automation-catch-up.md) record the helper contracts, small authorized DRAG-6.25 fix, commands and validation. The preservation run passed 2,200 tests with 400 expected skipped runs (12 files, 20 repeats, zero retries). After the Coder fix, all 120 genuine-cause exercises passed; the temporary diagnostic was retired. The final full E2E run passed 240 tests with 24 existing skips, and the root gate passed. The original 153 ID-bearing Playwright titles and 24 skips are preserved. Four moved DRAG-6 Automation paths are repaired and the stale TREE-2.8 internal title claims are removed; catalog statuses and all 152 Open assignments stay unchanged. Use the completed helpers in the next brief. DRAG-6.25's complete surface coverage remains with 4d. This is the review/commit stop before 4a; no batch or commit has started.

**Batch 4a completed — 2026-11-08:** Nathan authorized 4a after committing Phase 3. The Planner resumed the same Test Automator for the 34 assigned Open cases (10 Extend, 22 New, two already-reworded Split), briefing each with the baseline's exact residual and the current D13 wording. The Automator owns Playwright suites and support; app/Vitest work, if needed, is routed to the Coder. The pass uses Phase 3's helpers, keeps painted appearance in the shared Manual cases, applies D2's 20-repeat bar and ends with a confirming Reconciler run, the full E2E suite and the root gate. The checkpoint results below record per-kind closure/test counts, D2 misses, helpers, round trips and measured cost. This is the review/commit and process-decision stop before 4b; no commit has been made.

**Six Coder round trips, all applied:** four behavior defects, one state-observation hook and one existing-test title stamp. The changes are stable for the repeat runs; final batch validation remains below.

| Round | Case      | Result and focused evidence                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | DRAG-1.26 | The exact merged-column or expanded-sub-row list exposes its existing active-context state. Descendants marks only the Card; Board/end marks none. Three regressions fail before and pass after; 23 focused component tests pass. No behavior or style change.                                                                                                                                                                   |
| 2     | DRAG-3.18 | A populated done region uses its workphase name (`Move to Done`), even when the column override is `Finished display`. Empty-active names and ghost/label transitions are preserved. Red/green regressions and 27 focused components pass; the unchanged surface assertion passes.                                                                                                                                               |
| 3     | DRAG-1.33 | Successful attachment keeps the temporarily opened target `C` expanded through release, pending and saved states, including a Free item retaining raw parent `C`. Cancel/pop restoration, same-parent Stub reorder, `E`'s preference and later manual collapse remain guarded. Red/green regressions and 63 focused components pass.                                                                                             |
| 4     | DRAG-3.10 | Adds the case ID to the existing qualifying TC-2.24 server route title. Every other byte is preserved. Its append-from-maximum fallback complements the empty-region UI proof; no duplicate test or new internal mapping. Execution belongs to the final root gate.                                                                                                                                                              |
| 5     | DRAG-1.5  | Immediate release after zoom keeps the last-child relation: `B/after`, saving `A < B < X`. Stationary resampling no longer replaces it with `A/before`. Genuine movement resumes normal gap/depth choice; returning to the entry point does not freeze it again. Red/green regressions, 191 focused and 1,014 client tests pass.                                                                                                 |
| 6     | DRAG-1.5  | The visible in-list ghost and selected line now agree with that committed last-child gap. Both origins draw `A/A1/B/X` and select `B/after`; movement restores ordinary shuffle. Overlay, other sections, Stub pickup and modal reading remain separate. Six red/green regressions, 125 focused and 1,023 client tests pass. Strict surface order/line and independent immediate-release paths pass in the 18-test confirmation. |

The two DRAG-1.5 failures were separate: round 5 repaired saved intent, then round 6 repaired the visible gap. Before/after screenshots and observations remain under `tests/output/batch4a-stationary-column*` and `batch4a-stationary-subrow*`. The temporary observer diagnostic was retired after confirmation; its capture successes are not mapped coverage. App fixes follow D7 and the observation hook follows D12. No clock, timeout, hidden-ghost substitution or case relaxation resolves these defects.

**Confirmed surface scope:**

| Original work kind | Cases closed | Authored title-expression memberships | Expanded test memberships |
| ------------------ | -----------: | ------------------------------------: | ------------------------: |
| Extend             |           10 |                                    10 |   28: 27 drags and TC-6.4 |
| New                |           22 |                                    23 |                        64 |
| Split              |            2 |                                     3 |                         9 |
| Unique union       |           34 |                                    32 |   90: 89 drags and TC-6.4 |

Memberships overlap because tests can cover several cases across kinds; the three kind rows must not be added as unique tests. Of the 32 relevant authored expressions, TC-6.4 is existing and 31 are new. Six new UI files and the extended `item-positioning.spec.ts` supply the new/updated surface scope; existing tests, including the stamped route test, complement them in the confirming report. No Rework case is assigned to 4a. Both Split cases were reworded in Phase 2; there is no additional Split rewording in 4a, and no separate elapsed Phase 2 timing was recorded. DRAG-1.16 is the sole catalog-body clarification in this batch and belongs to New.

**Spec-file memberships:** Extend uses the new `drag-contexts.spec.ts` and `drag-band-contracts.spec.ts`, plus the extended `item-positioning.spec.ts`; its existing server route title stamp is separate. New spans all six new UI files. Split spans the shared new `drag-layer-transitions.spec.ts` and `drag-card-forms.spec.ts`. The unique footprint is six new UI specs plus one extended UI spec, not the sum of those memberships. The other new files are `drag-locked-contexts.spec.ts` and `unsorted-filing.spec.ts`. The confirming report supplies the exact per-case file/title mapping.

**Helpers found and written in 4a, for later briefs:**

| Helper                                                                        | Contract                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `boardDragSurface.ts`: `seedBoardFixture`, `mergeRange`, `setSectionExpanded` | Reset/seed a Flow board; merge the fixture's two adjacent phase columns; set a loaded section's real UI preference. `mergeRange` is not an arbitrary multi-column-range builder.                                                                                                                                                                                   |
| `boardDragSurface.ts`: `dragBoxOf`, `expectWithin`, `expectFollowing`         | Observe painted centre/translation with layout dimensions, so the Manual tilt does not enlarge the interaction box. Check the supplied context's clamp with the existing 2 CSS-pixel edge allowance, or positively compare both axes with pointer movement under 2 pixels of error. These do not read the app's placement/clamp result.                            |
| `boardDragSurface.ts`: `paintedCardOrder`, `paintedItemIds`                   | Read actual screen order, including nested Stubs where requested; do not substitute DOM order or untransformed layout slots.                                                                                                                                                                                                                                       |
| `boardDragSurface.ts`: `leanAtGhost`, `releaseMove`, `expectOneMove`          | Aim by the visible ghost's midpoint; release through the canonical gesture and require the matching successful PATCH; assert exactly one write and its expected body. Callers independently prove the selected relation and fresh saved outcome. The optional one-pass lean permits line observation before live zoom completes; the default remains three passes. |
| `dragGesture.ts`: `paintedBoxOf`                                              | Adds opt-in `layoutSize` for the interaction-box observation above; the default remains fully painted geometry. All actions still use the canonical gesture APIs and `tabBy` still reads the client indent.                                                                                                                                                        |
| `requestHarness.ts`: `watchBoardLoads`, `successfulWrite`                     | Observe browser board GETs separately from independent API reads; require the matching successful response. Write counts/body and held real responses remain separate evidence. Pending callers await the released answer before disposing the route.                                                                                                              |
| `seed.ts`: `deleteWorkphase`, `fetchItemTypes`, `fetchBoard`                  | Checked deletion creates genuine Unknown-status fixtures; valid type IDs come from a fresh read. Fresh resolved board reads expose typed Unsorted invalid/uncovered/attention state; `fetchDefaultBoard` delegates to that read.                                                                                                                                   |

The DRAG-3.17 rectangle-sum correction is local to its spec and does not relax a shared geometry helper.

**Oracle and case clarifications:**

- **DRAG-3.19:** equivalent reserved description space satisfies the case; an empty paragraph's visibility is not itself the rule. Empty/long and collapsed/expanded fixtures retain independent copy-height and description-slot measurements. Fractional line-height arithmetic is measured without a broad tolerance. No case or app change is needed.
- **DRAG-1.16:** the Planner clarified the current-at-release relation, following wiki board-drag-interaction §1.1 and §2. Vertical movement can change the locked list's own ghost slot. Concrete A/after, A/before and B/after examples prevent treating pickup as a frozen relation. All foreign/nowhere targets and the Descendants clause remain; ID, title, priority and Rule are unchanged.
- **Review quality:** the report-only Reconciler pass strengthened actual release after leaving `C`, `E`'s preference after attachment, saved/re-rendered one-layer reorder and branch restoration after Board and Column drops. DRAG-1.16's Descendants fixture requires the changed saved order `S1/X/S2`, so an ignored release cannot pass as an own-gap identity.

**D2 completed runs — 2026-11-08:** the final continuation passed 715/715 in 34.2 minutes, exit zero. The final acceptance artifact verifies exactly 89 variants with twenty accepted passes each and zero retries. Raw and LF-normalized before/after hashes match for all 203 app-source and 57 Playwright files. The completed segments are:

| Segment                                   | Observed result and runner wall time                                | Accepted passes |
| ----------------------------------------- | ------------------------------------------------------------------- | --------------: |
| Corrected reservation target              | 20/20, 2.3 minutes, retry zero                                      |              20 |
| Interrupted 88-variant command            | 648 passed, one failed, 1,111 unrun; 5.6 hours including suspension |             641 |
| Fresh unchanged affected DRAG-1.2 variant | 20/20, 1.2 minutes, retry zero                                      |              20 |
| 32 variants with eight prior passes each  | 384/384 further passes, 14.0 minutes, retry zero                    |             384 |
| 55 variants with seven prior passes each  | 715/715 further passes, 34.2 minutes, retry zero                    |             715 |
| Required unique acceptance                | 89 variants with twenty accepted passes each                        |           1,780 |

The arithmetic is `20 + 641 + 20 + 384 + 715 = 1,780`. The failed attempt and the affected variant's seven earlier overlapping successes are retained separately and excluded from acceptance. This is not one clean initial command. Final JSON, rather than reached-test counters or per-file milestones, supplies the per-variant proof. Earlier file-completion claims were incorrect because Playwright repeated the whole group; aggregate counts were accurate. No completed cohort was rerun.

The interrupted DRAG-1.2 A/after attempt spanned a host/tool suspension: its normally short execution took 15,290,380 ms; a two-second overlay observation spanned over four hours, followed by roughly 55 minutes of worker cleanup. Saved timing supports that attribution and does not erase the failure. The unchanged affected variant's fresh twenty passed in 1.2 minutes, maximum 3,152 ms. The original successful results were all retry zero, maximum 6,306 ms. Exact continuation lists were independently verified as disjoint, with no missing/unexpected title. Windows rejected the long selection regex before executing tests; the installed runner's exact `--test-list` files supplied the verified selection instead.

The recovered final preflight was 91 passed and one numeric precision failure: measured height 241 against an independently added rectangle sum of 240.99996948242188. The comparison now requires three-decimal agreement, a cutoff below 0.0005 CSS pixels. The reservation relationship and exact zone/hover/restoration assertions remain. This is the sole test change before the frozen repeat evidence; no app fix, timeout change or case relaxation was used for recovery. The 203 app-source files retain their raw aggregate hash, and raw/LF Playwright fingerprints match across the interruption and continuations. Continuation wake leases were accepted and restored on process exit; they prevented system-idle sleep without requesting display wake or changing persisted power settings.

Evidence is retained under `tests/output/batch4a-*`, including interruption timing, exact resumed-selection proof, per-kind counts, per-cohort JSON/logs, source/test fingerprints and lease records. These are measured runner durations, not a human engineering-time estimate. Both Split cases had no additional rewording in 4a; Phase 2 elapsed time was not separately recorded.

**Final runtime checks — 2026-11-08:**

| Check                   | Result                                                                                        | Measured duration                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| D2 unique acceptance    | 89 variants × 20 accepted passes; 1,780 total, zero retries                                   | Segment durations above; interruption kept separate |
| Final full E2E          | 329 passed, 24 existing skips; zero unexpected, flaky or retry-only results                   | 7.9 minutes                                         |
| Root gate               | Types, lint, formatting and docs pass; 444 server, 1,023 client and 258 scripts tests pass    | 85.1 seconds                                        |
| Final process lifecycle | Full E2E exit zero, then root gate exit zero; overall exit zero                               | 16:17:42–16:27:03 UTC                               |
| Wake scope              | Accepted; system-idle only, display wake not requested; previous state restored on completion | Released at 16:27:03 UTC                            |

The full suite and gate ran sequentially within one bounded scope. A roughly two-hour runtime/tool delivery gap occurred after the second cohort finished and before final validation started; it caused no executed-test failure or cohort rerun. The Automator subsequently reached a usage limit while the owned process continued to completion. On resumption, the existing saved results were recovered; neither completed check was rerun. The lease, exit codes and runner JSON/logs independently establish completion.

All 153 original authored ID-bearing Playwright title expressions remain; the 31 new expressions bring the current count to 184. The 24 existing skip/fixme declarations remain identical and are still routed to later batches. No case is proposed for Manual or a new internal mapping. No shared Manual appearance check is claimed as executed. Evidence includes `tests/output/batch4a-final-validation-proof.json`, `batch4a-final-d2-acceptance.json`, `batch4a-final-e2e-results.json`, `batch4a-final-e2e.log`, `batch4a-root-check.log` and `batch4a-final-validation-lease.json`.

**Catalog confirmation:** the [confirming Reconciler report](../../audits/test-reconciliation-story-10-batch-4a.md) promotes all 34 scoped cases to Automated: 10 Extend, 22 New and two Split. The catalog now has **352 Automated, 120 Open, 10 Manual, one Planned and two Pending PO**, 485 total. The original 152-case inventory is retained: 34 are closed and 118 remain Open in this story. The other two Open cases keep their Quick Items routing under D10.

The Reconciler applies only scoped status/Automation fields and matching summary statuses. The Planner's DRAG-1.16 clarification is the sole catalog-body change in 4a. No ID, title, priority or Rule changes, no case is held off, and no new internal or Manual approval is requested. The baseline and Phase 3 reports remain frozen. Final whole-catalog and ownership checks are recorded in the confirming report.

**Checkpoint disposition:** 4a is committed in `421ca5a7`. Nathan retained D2, the case assignments and batch order, approved the five stops, and authorized 4b. The next checkpoint is 4b's Stop 1 below.

### Batch 4b — Stop 1 complete, 2026-11-08

**Review deliverable:** the [proof/variant plan](story-10-batch-4b-proof-plan.md) lists all 27 assigned IDs, each baseline residual, the concrete scenario matrix B01–B27, the Automator's proposed files, representative observation checks and the separate Coder dependency. The Planner reviewed expected outcomes against the cases/wiki without reading code. The Automator's implementation review was read-only.

**Forecast, not completed automation:** 27 catalog cases → 27 authored expressions / 78 scoped runnable variants. Authorship comprises 20 new expressions, six existing Stub expressions extended/reworked and one parameterized replacement for the two unstamped zoom skips. One unchanged DRAG-1.14 test remains in the affected files: the full five-file union is 28 expressions / 79 variants. Shared case memberships are not summed. At freeze, 78 changed variants imply 1,560 repeat passes; a conservative full-file selection of 79 implies 1,580. D2 is unchanged; the actual selection/count is verified after authoring.

**Planner changes:** clarified DRAG-4.22's overgeneralized release-after-reset sentence from wiki §2, §3, §6.1 and §10. Card/side resets while locked use the current relation; a pop to Board uses its band/no-target meaning; cancellation writes nothing and the next pickup starts fresh. Returning after a pop also starts fresh clocks. ID, title, priority, status and Automation field are unchanged. The own-column legacy zoom remains substantive proof under DRAG-4.1; DRAG-4.15 receives the cross-column variant and Board-release contrast. No case allocation, routing or closure scope changed.

**Resume packet:**

- **Next owner/action:** Nathan reviews Stop 1 and directs Stop 2. The Planner then delegates the scoped tests/discovery to the Test Automator; begin with the six representative checks before broad expansion.
- **Accepted app/test starting snapshot:** `421ca5a7c648bb846f293f2d9f1c74de4bd0bc7c`; clean at entry and unchanged by this pass. Recheck intervening changes on resume. Case inputs include the DRAG-4.22 clarification in this handoff.
- **Changed files in this stop:** this batch plan, the main story plan, the new proof/variant plan and DRAG-4's case page. No app, test, helper, Vitest, configuration or existing audit edit.
- **Stop 2 edit scope:** the five proposed specs and four potential support files listed in the proof plan. Any need beyond that scope is reported first. No app/Coder edits are authorized inside the automation session.
- **Known dependency:** separate Coder clock-test stamps/additions for DRAG-4.20/4.22. No runtime-confirmed app defect or hook need, held-off case or unresolved PO question. The actual rendered cue is an observation risk to check before expansion.
- **Completed commands/evidence:** read-only doc/source review by the Automator, Planner case/wiki review, Git snapshot/status inspection, documentation/format/diff checks. The durable proof artifact is the linked plan; no new runtime artifact exists.
- **Not run:** Playwright, focused scenarios, D2 repeats, full E2E, root gate and reconciliation. Stop 2 has not begun; no coverage promotion or commit is claimed.

**Documentation validation:** `npm.cmd run check:docs` passes, 430 files with zero hits. Prettier passes for the three planning documents, and `git diff --check` is clean. A doc-only metadata check confirms 27 matrix rows sum to 78 scoped variants, all 27 assigned cases remain Open, DRAG-4.22 is the sole changed case and its ID/title/priority/status/Automation fields are preserved. All edits are documentation; the index is unchanged.

**Stop:** return to Nathan here. A green documentation check does not start authoring, a Coder session or validation.

### Batch 4b — Stop 2 early discovery checkpoint, 2026-11-08

Nathan approved the proof/variant plan and authorized the next checkpoint. The Planner resumed the same Test Automator for Stop 2 only: representative observations first, then the corresponding approved matrix against app snapshot `421ca5a7c648bb846f293f2d9f1c74de4bd0bc7c`. The approved five-spec/four-helper edit scope and code-blind Planner boundary remain in force. Any failing case is preserved for handoff; no app, Vitest, test-route or configuration edit, in-session Coder, full D2 sweep or frozen validation is authorized in this stop.

**Historical checkpoint outcome (before the retirement below):** stopped matrix expansion after representative discovery. Five expressions / six runnable variants are authored in two specs; five unique variants were executed. B01's own-column variant is authored but unrun. Of the approved 78 scoped variants, 72 remain unauthored. This is a partial Stop 2 handoff, not a completed batch, accepted D2 result or coverage promotion. All 27 cases remain Open.

| Pilot                                   | Observed result                                                                                                                                                                                                                                                        | Scope still outstanding                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| B01 cross-column, DRAG-4.1/DRAG-4.15    | Pass: immediate stationary release, one last-child attach, non-entry inheritance, unchanged parent fields/siblings and final saved/painted order.                                                                                                                      | Own-column variant unrun; detached-child, Board-release and other related cases not authored. |
| B09 merged entry, DRAG-4.30             | Required entry observations and saved last-child result are correct. A preserved additional visual-neighbor assertion is red: line names S2/after while ghost is below nested S2a at depth 0. PO question, not proof that the current DRAG-4.30 last-child Then fails. | Expanded entry and own-Stub return remain unauthored; resolve the line/anchor question below. |
| B11 depth 0, DRAG-4.8                   | Pass for the worked gap's shallow state.                                                                                                                                                                                                                               | Other three depths and sole-state carried-branch fixture unauthored.                          |
| B14 final crossing, DRAG-4.35           | Red: painted B/X/C gap and C/before highlight, but request sends B/after. Fresh saved order is correctly A/B/X/C; the demonstrated defect is exact request/highlight consistency. Reproduced three of three confirmation attempts.                                     | Other depth/branch/approach variants unauthored. Preserve this strict failure for the Coder.  |
| B15 invalid → valid, DRAG-4.32/DRAG-5.9 | Pass for the same-gap invalid-to-valid cue transition and valid release.                                                                                                                                                                                               | Invalid-release/no-write path unauthored; other DRAG-5.9 placements not authored.             |

Before Nathan's ruling, the B09 disputed line observation also reproduced three of three. The Planner inspected the before-release screenshots: B09's line is below S2, above S2a, while the ghost is last; B14's line is before C. These observations support the packet without the Planner reading source. They do not replace the Automator's exact request and fresh saved-row evidence.

**Runtime and corrections:** six Playwright command attempts produced 12 completed executions across five unique variants: three passed, nine failed, zero retries. Two commands executed no tests: initial backend startup failed at the sandbox's Node user lookup, and a later Windows regex-pipe selection failed before Playwright ran. The authorized local stack ran through the supported elevated route without source/configuration changes; the selector was replaced with a pipe-free equivalent. The first executed B01 attempt incorrectly compared P's derived children array as an unchanged parent field; the corrected test explicitly checks unchanged own fields and children S1/S2 → S1/S2/X. No case expectation or app behavior changed. Its corrected pilot passed. The Descendants pilot run completed two passed/two failed; the bounded B09/B14 confirmation completed six failed in 22.1 seconds, three attempts each. Thus eight failures preserve the two guards, and one was the corrected parent-observation mistake. No skip, timing change or expected-value relaxation resolves the preserved failures.

**Historical failing titles (removed/deferred by the retirement below)**, both originally in `tests/ui/drag-descendants-placement.spec.ts`:

- `DRAG-4.35: B14 leaf below approach final crossing releases the painted depth-0 B/C gap`
- `DRAG-4.30: B09 stationary foreign entry from column starts after the nested last subtree`

The executed bounded confirmation used this pipe-free selection, with a separate JSON output filename recorded in the execution summary:

```text
npx.cmd playwright test tests/ui/drag-descendants-placement.spec.ts --grep 'B[01][49]' --repeat-each=3 --trace=on --reporter=line,json
```

**Original Stop 2 scope and preservation:** only `tests/ui/drag-card-zoom-in.spec.ts` is modified and `tests/ui/drag-descendants-placement.spec.ts` is new. No helper, app, Vitest, test route or configuration edit. The two unstamped legacy zoom skips are merged into one parameterized expression; no original ID-bearing test or ID is removed and no new skip is added. Existing skip declarations go from 24 to 22 only through that merge; the obsolete DRAG-5.13 skip is still untouched. The initial five-spec/four-helper scope remains the maximum for unfinished authoring, not a claim all those files changed.

**Unchanged snapshot:** the Automator's before/after check covers 420 protected tracked app/configuration/Vitest/untouched-test files, aggregate SHA-256 `c2596c99ba52a845d48d7b6c4e6864e259b9c6ec4b2f8831df6e415667275855`, unchanged. Of 59 original Playwright files, 58 remain byte-identical; the other is the authorized legacy zoom spec. HEAD remains `421ca5a7c648bb846f293f2d9f1c74de4bd0bc7c`. These are scoped file fingerprints, not an assertion that the working tree is clean.

**Original Stop 2 gate:** one root gate passes, 86.827 seconds: types, lint, format and documentation checks (431 files, zero hits), 444 server tests, 1,023 client tests and 258 script tests. That gate excludes Playwright; the two pilot guards were red at this snapshot. The retirement below supersedes their active status. No D2 sweep, full E2E or Reconciler run occurred. After the handoff edits, documentation checks pass again (431 files, zero hits), the three planning documents pass Prettier and `git diff --check` is clean. The Planner's metadata check independently matches the two test hashes, the completed-run/preservation summaries and the allowed doc/two-spec file scope; all 27 cases remain Open and the index is unchanged.

**Durable evidence** under `tests/output/` (local ignored artifacts; retain across the separate session):

- `batch4b-stop2-execution-summary.json`: commands, completed results, totals and current test hashes.
- `batch4b-stop2-observations.json`: semantic ID-labelled observations, requests, fresh saved rows and links to all six screenshot/trace sets.
- `batch4b-stop2-evidence/B09-attempt-1-before-release.png` and `batch4b-stop2-evidence/B14-attempt-1-before-release.png`: representative images. Attempts 2/3, trace ZIPs and contexts are beside them.
- `batch4b-stop2-before-fingerprints.json` and `batch4b-stop2-after-fingerprints-and-inventory.json`: source protection and test delta.
- `batch4b-stop2-before-title-inventory.json` and `batch4b-stop2-ast-title-preservation.json`: original titles/IDs, current selection and skip accounting.
- `batch4b-stop2-root-check.log` and `batch4b-stop2-root-check-summary.json`: completed gate.
- Focused attempt prefixes: `batch4b-pilot-b01-cross`, `batch4b-pilot-b01-cross-rerun`, `batch4b-pilot-b01-fixed-oracle`, `batch4b-pilot-descendants`, `batch4b-pilot-confirm-mismatches` and `batch4b-pilot-confirm-mismatches-rerun` retain the failed startup/selector, observation correction and strict failures separately.

Original Stop 2 SHA-256 hashes were `fba1cebecf91397a2eb58eff51ca17d3c34bae7cf831635dcfded4ac76c3366b` for `drag-card-zoom-in.spec.ts` and `a2a26df41f1267416122acf09a518dea77ca6d916af34f678fb5928f5c3ec594` for `drag-descendants-placement.spec.ts`. A full-file green result is not claimed: one variant is unrun and the two guards are red.

**Current resume packet and next owner (supersedes the original repair handoff):**

1. Nathan's later decision retires DRAG-4.35 and defers its defect to the highlight-cue story. No immediate app fix or unchanged-B14 rerun is required. The earlier B09 ruling removes only its disputed line-place guard; retain DRAG-4.30's functional test.
2. The Automator removes B14's Playwright test and the B09 guard, verifies the remaining five variants, and records source/identity preservation. Nathan reports that the Coder removed the retired ID stamp from the existing Vitest test and authorizes continuation. The Automator verifies that exact title-only change; the generic projection regression remains, with no retired-case claim. No app repair is part of the cleanup.
3. The DRAG-4.20/4.22 clock-test handoff remains a separate Coder task. Nathan checks in before that work and before automation resumes on the accepted return.
4. On Nathan's direction, resume unfinished Stop 2 with the remaining 26-case/70-variant matrix. Begin with outstanding B07 cue/geometry and B17/B23 detach/branch observations. B14 is removed; no broader authoring, D2 or next batch begins as part of retirement.

### Batch 4b — retirement follow-up, 2026-11-08

Nathan and the PO defer the DRAG-4.35 defect to [the Descendants highlight-cue story](../tech-debt-stories/descendants-highlight-cue.md). The case and summary row are deleted from the catalog, leaving Next ID DRAG-4.36 unchanged. The batch's New assignments drop from 21 to 20, total cases from 27 to 26, and B14's eight planned variants are removed: 26 expressions / 70 scoped variants, or 27 expressions / 71 variants including the unchanged control. D2 itself is unchanged. These are scope reductions, not coverage promotions or passing substitutes for the defect.

B14's Playwright test is deleted outright; B09 loses only its disputed line-place assertion. Four expressions / five runnable variants remain authored, with 65 planned variants unauthored. The retained five-variant full run passes, including B01's previously unrun own-column return. The Coder's accepted ID-stamp cleanup is verified below; no retired-case automation carrier remains. Historical failure artifacts remain as evidence of the accepted defect, not active failing requirements.

**Retirement validation:** the Automator's full run of the two pilot files passes five of five variants, zero retries/skips, in 20.589 seconds. Its already-started root gate passes in 89.311 seconds (431 docs/zero hits; 444 server, 1,023 client and 258 script tests). Relative to retirement entry, only the Descendants spec changed; 426 other non-doc files and all 40 retained historical failure artifacts were byte-identical. These results precede the Coder's title-only cleanup, which was separately verified without changing the test body.

**Accepted Coder return and continuation (Nathan):** the Coder removed only `DRAG-4.35: ` from the dedicated `useBoardDnd.test.ts` title. The Automator verified the LF-normalized difference and unchanged regression body; the test remains as a generic projection regression, with no DRAG-4.35 claim. Its SHA-256 is `8496cef6642a37a92c1846c6ab33a5acd578441bda1f39b59a0d5d7083f81b50`. No app source changed and no active automation carrier of the retired ID/B14 remains. Nathan explicitly authorized unfinished Stop 2 to resume, so no extra Coder-removal session or permission is pending.

**Retirement artifacts:** `tests/output/batch4b-retirement-before.json`, `batch4b-retirement-after-summary.json`, `batch4b-retirement-focused.json`/`.log`, `batch4b-retirement-root-check-summary.json`/`.log` and the separate `batch4b-retirement-artifacts/` retain this cleanup's proof. The protected aggregate is `eb021ac935cea9c3beb8c135f685761e3626c62b5a613624fefa6ff9b3b43b73`; the retained zoom hash is unchanged and the post-retirement Descendants-spec hash is `e8c2cd2a3777139670bbd44d443ae123f5ec2dedbf92ee85b9dce7df73b0a052`. The accepted continuation snapshot, including the Coder's unit title change, is in `tests/output/batch4b-stop2-resume-before-fingerprints.json`.

**Current owner/action:** the same Automator resumes the revised matrix, first the outstanding cue/detach/branch representative pilots, then expansion only where observation is sound. Existing Playwright/helper scope and the separate Coder boundary remain. The DRAG-4.20/4.22 clock tests are still pending their own Coder session. A new representative defect/hook blocker returns another concrete checkpoint; no full D2, final full E2E or reconciliation begins automatically.

### Batch 4b — resumed Stop 2 progress and recovery, 2026-11-08

Nathan directed continuation after a usage-limit interruption. The same Automator recovered completed results before rerunning anything. The accepted app/unit/configuration snapshot remains unchanged, including the Coder's verified title-only retirement cleanup; all 40 historical failure artifacts are preserved. New evidence is under `tests/output/batch4b-stop2-resume-*`.

**Recovered authoring state:** 17 scoped expressions / 36 runnable variants are authored against the unchanged 26-case/70-variant matrix. Four of those variants were authored but unrun at the interruption: B27's Board-release contrast, B25's title/padding paths and B17's expanded-column path. They are the first checks on resume. This is partial authoring, not a batch acceptance or a coverage promotion.

**Completed focused families:**

- Cue B06–B08: nine of nine pass, covering both named targets, all three cue/release phases, unchanged rendered geometry and all four reset paths. Evidence: `batch4b-stop2-resume-cue-family-fixed.json`/`.log`.
- Descendants B09–B12/B15: 13 of 13 pass, covering both stationary seeds, own-Stub return/no-write, four worked depths and the sole-state branch, three nested-last placements, invalid release and valid recovery. Evidence: `batch4b-stop2-resume-descendants-states.json`/`.log`.
- Attachment B02/B04/B05/B20: six of six pass, 26.95 seconds, zero retries/skips. This result was already complete when the limit interrupted delivery; it was recovered without a new run. Evidence: `batch4b-stop2-resume-attach-family-position-order.json`/`.log`.
- Representative B17 merged detach and B23 nested branch passed before expansion. Evidence: `batch4b-stop2-resume-pilot-b17-scope.json` and the B23 result in `batch4b-stop2-resume-pilot-detach.json`.

**Planner-reviewed observation corrections, with expected behavior preserved:** shortCard's equal-width check at Column was an unsupported extra (wiki §5a requires its fixed height; Stub width has a separate rule). A reset gesture's repeated targeting moves consumed the fresh-dwell observation window; a single gesture and atomic observation retained the same thresholds and fresh-dwell assertion. A cancelled drag unmounts its observer, so the test checks its absence, actual cue absence/no-write and a fresh pickup. Done-column line side is not settled by wiki §2; B04 keeps the real layer/neighbor/entry and saved-placement proof without inventing P/after. Saved attached-sibling order is checked from freshly read positions and independent painted order, not the unspecified enumeration of `GET P.children`. Earlier attempts remain in separate logs/JSON. No app fix, case rewrite or expected-order relaxation resulted from these corrections.

**Subsequent progress:** the recovered-new-row selection passed five of five (B17 merged/expanded, B25 title/padding and B27 Board contrast). Authoring reached 22 expressions / 57 variants. B13's first full run had measurement/targeting failures, and B16 needed overlay-scoped and initial-gap observer/driver corrections; corrected runs were still pending when the new finding below stopped expansion. B18/B19/B21/B24, 13 planned variants, remain unauthored.

**New B13 finding, bounded confirmation in progress:** after a foreign Stub pops to the column, the actual P/before highlight remained for 59 observed Column frames through dwell and cue, with the pointer stationary. The zoom candidate stayed Origin and the first entered Descendants context was Origin, not P. No release or write occurred. This is a named-Card selection mismatch under wiki board-drag-interaction §6.1, separate from the retired DRAG-4.35 request/highlight issue. Preserve the strict P-entry assertion; do not change the relation, thresholds or target. The Automator is capturing three confirmations of one representative path, then freezes the partial snapshot for an early handoff and proposing Reconciler review.

**Current action:** no further matrix expansion, D2, final full E2E or confirming reconciliation. The independent corrected B16 check may finish without shared source changes. Confirm source fingerprints, exact runtime results and unfinished clauses in the next packet. The existing separate clock-test handoff is unchanged.

### Batch 4b — pre-Coder Stop 2 handoff, 2026-11-09

**Outcome:** froze the partial authoring snapshot after confirming a new functional selection defect. The Automator changed only the five approved specs and `tests/helpers/boardLocators.ts`, whose addition locates the existing rendered cue. The other three allowed helpers are unchanged. No app, Vitest or configuration edit was made by the Automator. The previously accepted Coder unit-title cleanup is unchanged.

**Confirmed behavior:** after foreign Stub X pops from Origin to Column, the actual side highlight remains P/before with the pointer stationary through dwell and cue. The cue candidate remains Origin, and the first entered Descendants context is Origin instead of P. Three confirmations captured 55, 56 and 57 Column frames; every frame kept P/before and every attempt entered Origin. No release or write occurred. The Planner inspected both images and the semantic metadata; the proposing Reconciler independently checked the driver, images and all three histories and supports the same finding. This violates wiki board-drag-interaction §6.1/DRAG-4.19 and blocks DRAG-4.34's foreign-Stub path. It is separate from retired DRAG-4.35's request/highlight equality and from the deferred B09 seed-line guard.

**Preserved representative**, in `tests/ui/drag-descendants-placement.spec.ts`:

`DRAG-4.19, DRAG-4.34, DRAG-5.4: B13 foreign-stub from above follows the cursor to first`

The DRAG-4.19 title stamp was added after the confirmations, with the input and strict P-entry assertion unchanged. Runtime records retain the earlier title. A narrow reproduction selection is:

```text
npx.cmd playwright test tests/ui/drag-descendants-placement.spec.ts --grep 'B13 foreign-stub from above follows the cursor to first' --repeat-each=3 --trace=on --reporter=line,json
```

Use a new JSON/output prefix on replay so the historical evidence is retained. This command is not authorization to resume testing before the separate Coder return/check-in.

**Partial scope:** 22 scoped expressions / 57 variants are authored. The unchanged DRAG-1.14 control makes the five-file listing 23 expressions / 58 variants; `--list` completed without executions. The approved matrix remains 26 expressions / 70 scoped variants. B18 (eight), B19 (two), B21 (two) and B24 (one) are the 13 unauthored variants. They were stopped at this boundary, not held off as unsuitable for surface automation. B13's full matrix is not accepted: its first run failed on measurement/targeting problems; the later full-precision observer has not received a complete 12-variant rerun past the confirmed entry blocker. No case is promoted.

**Completed checks and cost:** the recovered attachment family passed 6/6 without a new run; the final independent B16 check passed 3/3 in 10.8 seconds. The functional B13 confirmations failed 3/3 in 17.52 seconds. The resumed ledger records all 22 executed commands / 99 executions: 64 passed, 35 failed, zero retries, about 9.93 minutes of runner duration. That includes the failed observer/driver attempts and does not measure authoring/review effort or usage-limit gaps. These are focused diagnostic results, not D2 certification. The root gate passes on the frozen partial snapshot in 91.685 seconds: 433 docs/zero hits, 444 server, 1,023 client and 258 script tests. Its pass excludes the red Playwright guard. No D2 sweep, final full E2E or confirming reconciliation occurred.

**Identity and source preservation:** all 420 protected files remain unchanged against the accepted continuation snapshot, aggregate SHA-256 `89a89f475565cce8956175bcfb13666cd204f1dbd8c610a5944cd38f398ce882`. The accepted Coder unit hash remains `8496cef6642a37a92c1846c6ab33a5acd578441bda1f39b59a0d5d7083f81b50`. All nine allowed-file hashes match the frozen manifest. Original scoped IDs remain; Playwright skip declarations are 24 → 21 only through the three planned legacy reworks. DRAG-1.14's body and the 40 historical failure artifacts are unchanged. No new skip or active DRAG-4.35/B14 carrier exists. No staging or commit action was taken.

**Evidence under `tests/output/`:**

- `batch4b-stop2-resume-b13-confirmation-observations.json`: source-free histories, geometry and all three outcomes.
- `batch4b-stop2-resume-b13-evidence/attempt-1-held-P-before-wrong-cue.png`: the line before P while Origin carries the cue; attempts 2/3 are beside it.
- `batch4b-stop2-resume-b13-evidence/attempt-1-after-entry-trace.jpeg`: Origin locked with X inside, extracted unchanged from the same trace; corresponding trace ZIPs are retained.
- `batch4b-stop2-resume-frozen-partial-snapshot.json`: the exact frozen spec/helper hashes, accepted unit hash and remaining matrix.
- `batch4b-stop2-resume-execution-ledger.json`, `batch4b-stop2-resume-frozen-list.json`/`.log`, `batch4b-stop2-resume-id-preservation.json` and `batch4b-stop2-resume-final-protection.json`: execution, inventory and preservation proof.
- `batch4b-stop2-resume-root-check.log` and `batch4b-stop2-resume-root-check-summary.json`: the completed root gate.

**Proposing review completed:** [the Reconciler report](../../audits/test-reconciliation-story-10-batch-4b-proposing.md) reviews all 26 cases, independently confirms the functional blocker, and finds clean global lost-coverage/unknown-ID/Manual-ID checks across 484 cases. Its 93 evidence references are carrier links across layers, not added tests or runtime passes. It changes no catalog field: all 26 scoped cases remain Open, with no new Manual/internal replacement proposal. The prior reports and frozen source are preserved.

**Test-only proof corrections for the next authoring pass, after the accepted Coder return:**

- Add DRAG-4.1 to the two existing B09 drawing-test titles. They already inspect the live last-child ghost; retain B01/B02's immediate-release paths without adding settling waits.
- In all four existing B03 variants, require freshly saved position `1.0`, the empty attached-scope bootstrap in wiki positioning §4/TC-2.20. Retain no-anchor request, sole attached child and unchanged Free children. The existing childless-only route cannot alone prove the Free-children-only boundary; no extra route stamp or gesture is needed if B03 supplies this assertion.
- Make B01's raw `GET P.children` membership check order-insensitive, preserving the same members, fresh position order and independently painted order. Unspecified API enumeration is an unsupported extra oracle, not a product failure or case change.

No frozen test source is edited to apply these proposals now. The existing separate DRAG-4.20/4.22 clock-test handoff also remains.

**Next owner:** Nathan reviews the concrete Coder packet in Open questions; all app/Vitest work still requires a separate session and check-in. After the accepted Coder return, first rerun the frozen failing representative without test changes, then resume unfinished Stop 2, including B13's full matrix, the 13 unauthored variants and the proof corrections above. The retired highlight checks stay removed. Frozen validation is still Stop 4; confirming reconciliation is Stop 5.

**Stop:** no Coder subagent, app fix, further authoring, repeat certification or next batch begins automatically.

### Batch 4b — Coder return accepted and Stop 2 resumed, 2026-11-09

Nathan supplied the separate Coder return and explicitly authorized the Automator to resume. The original named-Card repair and DRAG-4.20/4.22 clock implementation handoffs are delivered; the old Open questions are removed. This is acceptance for continued verification/authoring, not final batch closure or a coverage promotion. Nothing is committed.

**Returned implementation:** the Coder added render-time `NamedAnchorSync` under the board's DnD context and `syncNamedAnchor` change detection so the pop machine receives the same live name the line reads after a form/layout change without a move/over event. The returned delta is the eight expected client files: `BoardView.tsx`, `dragChrome.tsx` and its tests, workflow `AGENTS.md`, `descendantsProjection.ts`, `popSession.test.ts`, `useBoardDnd.ts` and its tests. No server/configuration/new source file or Playwright edit was part of the return. The lean rule, thresholds, own-slot behavior and retired request contract remain unchanged according to the Coder's return.

**Case-pointer decision:** the [Coder-return proposing review](../../audits/test-reconciliation-story-10-batch-4b-coder-return.md) keeps the five new sync hook/component tests unstamped as implementation/regression support; they do not add an independent business clause beyond DRAG-4.19's surface proof. The five clock stamps and three added reset/cancel tests cover the missing static DRAG-4.20/4.22 clock clauses. Eligible future clock pointers are `client/src/components/workflow/popSession.test.ts` for both cases and `client/src/components/workflow/useBoardDnd.test.ts` for DRAG-4.22 cancellation. This is the already-approved clock category, with no new internal-mapping approval. The Reconciler, not the Planner, writes any eventual Automation/status fields at the confirming pass. All scoped cases remain Open; surface cue/release evidence is still required.

**Coder evidence and its limits:** the return reports the preserved representative red on old source, 3/3 green with the fix, five new sync regressions, three new clock/lifecycle regressions, and a green root gate (444 server / 1,031 client / 258 scripts). The saved `coder-named-anchor-full-e2e.json` contains 379 passed / 21 skipped / two moved-B03 failures; `coder-named-anchor-full-e2e-2.json` contains 381 passed / 21 skipped / no unexpected or flaky result. Both JSON files actually contain all twelve B13 variants, each passed once. The Coder's note that the other eleven were not run therefore means no separately reported focused replay, not absence from the full suites. The first B03 failures happened while client test files were edited; the Coder's attribution to those edits is unproven and is not used to discard the failures. Reported B03 diagnostics (sync disabled 4/4, enabled 4/4 and sixteen repeated passes) remain diagnostics. The JSON files alone do not establish exact per-run source fingerprints or the concurrency cause, and none of these results substitutes for final D2 certification.

**Accepted snapshot and first independent replay:** before any post-return Playwright edit, the Automator verified all nine pre-Coder frozen spec/helper hashes unchanged and captured the current app/unit/configuration baseline in `tests/output/batch4b-post-coder-accepted-before.json`, protected aggregate `c68f5663ac08690385b9fee2388fddb913e3b6ea64104af46d054e41fdc8595f`. The exact preserved B13 representative passed 1/1 in 10.9 seconds on that accepted snapshot, before any test edits, with strict P entry intact. Existing all-twelve Coder results are retained as history rather than needlessly rerunning the other eleven in isolation. The eventual affected-file run will include them again.

**Authorized unfinished Stop 2 work:** finish B18/B19/B21/B24's thirteen variants and apply the three test-only proof corrections above: B09's DRAG-4.1 stamps, B03's bootstrap 1.0 across all four variants and B01's order-insensitive raw membership check with actual order proof retained. Only the existing five-spec/four-helper scope is authorized; app/Vitest/configuration remain fixed. Preserve unique logs/output directories and all historical failures. A new case-derived blocker returns another early checkpoint. No retired guard is restored, no D2/final full E2E or confirming reconciliation starts, and no Coder subagent is authorized.

### Batch 4b — post-Coder Stop 2 discovery checkpoint, 2026-11-09

**Authoring is complete; validation is incomplete.** The Automator authored the remaining B18/B19/B21/B24 variants and applied all three proposing corrections: B09's DRAG-4.1 title stamps, fresh bootstrap position `1.0` in all four B03 variants, and B01's order-insensitive raw child membership check with numeric/painted order proof retained. The frozen listing contains **26 scoped expressions / 70 variants**, plus unchanged DRAG-1.14: **27 expressions / 71 variants across the five files**, with zero selected skips. There is no added case or matrix expansion. All 26 cases remain Open.

**New blocker — DRAG-5.3 / B18:** a Stub follows Descendants → containing C1 → Board, then releases over a different merged C2 before popping in. Immediately before release the cursor is between C2's actual drawn dividers, but the one detach request adds `B/after`. The case requires C2's entry workphase with **no `anchorId` or `side`** for this middle-band release. The representative failed three of three confirmations, followed by one geometry replay with the same mismatch. Expanded-middle also failed with an extra anchor in the bounded run. The unchanged strict assertions are preserved.

The [post-Coder proposing delta review](../../audits/test-reconciliation-story-10-batch-4b-post-coder.md) checks the rule and the actual geometry independently. In the merged replay, the drag is Board / `popped-out`, the cursor is `(712, 424.75)`, and the visible dividers are approximately `y=391` and `y=459`. The carried copy's centre is approximately `460.75`; its relationship to the lower guide is a diagnostic lead, not a proved cause or a reason to change the expected band. Painted `A, B, X` and fresh saved workflow position `5` are consistent with the required append fallback too, so they do not establish a Bottom release. The saved row retains parent P, becomes Free and takes C2's entry workphase; **no wrong saved order is claimed**. The mismatch is the request's anchor/side, under DRAG-5.3 and its DRAG-3.3 middle-band clause, wiki board-drag-interaction §5/§8 and item-positioning §2.1.

**Focused results and limitations:**

| Selection                                          | Passed | Failed |
| -------------------------------------------------- | -----: | -----: |
| Unchanged B13 representative, before any test edit |      1 |      0 |
| Newly authored 13 variants                         |      6 |      7 |
| B18/B21/B24 bounded driver checks                  |      7 |      4 |
| Merged-middle representative, three confirmations  |      0 |      3 |
| Same representative, geometry replay               |      0 |      1 |

These are **29 diagnostic executions: 14 passed, 15 failed, zero retries/skips**, about **3.51 minutes of recorded runner duration**, excluding authoring/review and the root gate. B19's two variants and B21's two variants have passing executions. B24 passes after its visible handle is scrolled into view; the first attempt never activated a drag. B18's merged/expanded Top and Bottom paths have passing executions. The merged held-middle path passed initially; later both held-middle paths hit an observer that still waited for a Board band after successful Column entry. That observer is corrected, but **the final correction is unrun and expanded held-middle remains unproven**. These driver/observer failures are retained rather than counted as additional confirmed app defects. The B01/B03/B09 corrections pass static checks but await affected-file runtime validation.

**Checks:** scoped TypeScript/lint/format and `npm.cmd run check` pass: 444 server / 1,031 client / 258 script tests, 433 documentation files / zero hits. That gate excludes the red Playwright guard. The completed proposing delta review finds no further static proof gap and clean global lost-coverage/unknown-ID/Manual-ID checks; the catalog and earlier reports are unchanged. Final checkpoint documentation, formatting and diff checks pass. No complete five-file run, D2 sweep, final full E2E or confirming reconciliation was performed on this final test snapshot.

**Frozen scope and evidence:**

- `tests/output/batch4b-post-coder-frozen-checkpoint.json` holds all nine allowed-file hashes, the 26-row inventory, exact result paths/exits, gate result and preservation comparison; `batch4b-post-coder-frozen-list.json` holds all expanded titles. Only `tests/ui/drag-card-zoom-in.spec.ts`, `tests/ui/drag-5-stub-detach.spec.ts` and `tests/ui/drag-descendants-placement.spec.ts` changed after the accepted Coder snapshot. The other six allowed files stayed unchanged.
- All **420 protected app/unit/configuration files** remain byte-identical to `batch4b-post-coder-accepted-before.json`, aggregate `c68f5663ac08690385b9fee2388fddb913e3b6ea64104af46d054e41fdc8595f`. The Planner independently rehashed these files and all nine frozen allowed files. No application/Vitest/configuration edit occurred during this resumption.
- The unchanged replay, new-thirteen and bounded runs are `batch4b-post-coder-preserved-b13.json`, `batch4b-post-coder-new13.json` and `batch4b-post-coder-driver-pilots.json`. The strict failures are `batch4b-post-coder-middle-confirm.json` and `batch4b-post-coder-middle-geometry.json`; corresponding logs and unique artifact directories are retained under `tests/output/`.
- The geometry JSON's `B18-before-release` and `B18-saved-result` attachments retain named IDs, final context/cursor/copy/ghost/region, the actual request and fresh saved row. Its artifact directory `batch4b-post-coder-middle-geometry-artifacts/ui-drag-5-stub-detach-DRAG-a6930-ses-the-destination-meaning-chromium/` holds `B18-before-release.png` and the trace. Do not overwrite these on replay.
- **Historical retention limit:** 37 of the original 40 manifest paths are still byte-identical. The old default-output B14 screenshot survives as three byte-identical named copies. Default `.last-run.json` changed, and the old default error-context has no exact-hash copy; three named historical B14 context/trace bundles remain. The actor/cause/timing of the default-output changes is not established. Earlier reports remain frozen; this checkpoint makes no current 40/40 preservation claim.

**Next owner/action:** Nathan reviews the separate Coder packet in Open questions. After that session's return and Nathan's check-in, replay the exact frozen failing merged-middle representative unchanged first, using a new output prefix. Then finish focused Stop 2 validation: both middle releases, both corrected held-middle paths, the three proof corrections and the complete affected-file selection, including B13. Recheck fingerprints before each accepted run. Stop 4's frozen D2/final suite and Stop 5's confirming reconciliation still require their own checkpoints; no Coder subagent or app fix starts here. DRAG-4.35/B14 and the retired seed-line guard remain removed.

### Batch 4b — append-slot Coder return and focused verification, 2026-11-09

Nathan supplied the separate DRAG-5.3 Coder return. This continuation verifies that return and the remaining expanded held-middle failure within unfinished Stop 2; it does not begin frozen validation. The Automator and Reconciler may work within their existing ownership. No application/Vitest edit or in-session Coder is authorized here.

**Returned scope:** six workflow files: `itemListOps.ts`, `placement.ts`, `dragRequest.ts` and their corresponding test files. The Coder separates an anchor-free append from the bottom band's last-neighbor placement, retaining the same last-place drawing. The [append-return proposing review](../../audits/test-reconciliation-story-10-batch-4b-append-return.md) confirms that distinction; the six-file delta does not change carried-copy/band geometry. The wider own-column bare-container detach matches wiki board-drag-interaction §10 and item-positioning §2.1. DRAG-6.12's two retargeted unit expectations retain end-preview proof, with the existing hover-displacement companion intact. No new case, pointer or status follows from a slot's implementation name.

**Snapshot and unchanged replay:** all nine frozen Playwright/helper files match the prior checkpoint; exactly the six reported protected files differ. `tests/output/batch4b-append-return-accepted-before.json` records the current 420-file baseline, protected aggregate `3c88d808070388c2d6f20a5f6e0a74980a78cbd41e094949f1cc2194d193253d`, with the six individual hashes available for verification. The Planner independently checks that delta. The first current execution is the frozen merged-middle representative unchanged: 1/1 passed, followed by unchanged expanded-middle: 1/1 passed, zero retries. Both keep the strict no-anchor/no-side request, target workphase, retained P and fresh workflow fallback assertions.

The Coder reports six-file aggregate `9c738e7bf92781922f265bede002a4cea3ac27b4e2c2c6d8c1990682a93bbc5a` without its recipe. The Automator's labeled aggregate is `f9d4765b63c684d6a034f15d1e6f93c7b231840e655ad76b3c7becbb55b0c212`: SHA-256 over UTF-8 records sorted by path, each `path + NUL + lowercase raw-file SHA-256`, joined by LF without a trailing LF. Both labels are retained; unlike individual raw-file hashes, undefined/different aggregate recipes cannot establish a source mismatch.

**Returned runtime evidence:** `coder-append-slot-full-e2e.json` records 393 passed / 21 skipped / one expanded held-middle failure, 415 total, zero flaky results. `coder-b18-middle-red-oldslot.json` records both middle failures with the old slot restored; `coder-b18-middle-green-x3.json` records three passes for each with the fix. `coder-b18-green-all.json` records seven of eight B18 variants passing. The held comparison is **three failures on fixed source and one recorded failure with the old slot restored**, not three old-slot executions in the named JSON. This comparison does not establish the held failure's cause. The Coder reports a green root gate: 444 server / 1,036 client / 258 scripts and docs 433 / zero hits. These are returned diagnostic/full-suite results, not D2 or final batch certification.

**Bounded held-path result:** the unchanged expanded held-middle representative failed once without reaching a write. It locked Review, but the ghost had already moved before A when upward leans took the cursor out of that sub-row; A/after was never established. One driver correction targets B from its live painted position, establishes actual A/X/B and guards the lean against live Review bounds. The corrected representative passes 1/1: Review stays locked, the one request names A/after, and fresh saved order is A<X<B with P retained and the exact Review workphase. This fixes the test's reachability premise without changing the required outcome. It does not prove the Coder's stale-droppable-rectangle hypothesis or a new product defect.

Only `tests/ui/drag-5-stub-detach.spec.ts` changes in this continuation, raw SHA-256 `7a9b14d4d923d1ccf27a1735feebb631f52a4e37ebefe6b611dbc69c4cde052e`. All other eight allowed files and all 420 newly accepted protected files stay unchanged. `tests/output/batch4b-append-return-frozen-checkpoint.json` retains the final hashes, exact commands and results. Four current focused executions are **three passes / one unchanged-driver failure**, zero retries/skips, **45.51 seconds of runner duration** excluding the gate and authoring/review. Titles, IDs, 26 expressions / 70 scoped variants and unchanged DRAG-1.14 control are retained. Scoped format/type/lint/diff checks pass. The single post-edit `npm.cmd run check` passes: **444 server / 1,036 client / 258 scripts, docs 433 / zero hits**; its log is `tests/output/batch4b-append-return-root-check.log`. The complete affected-file selection, D2 and final full E2E remain unrun on this final driver snapshot.

The Reconciler independently confirms the corrected driver establishes the required live Given and preserves the final request/save assertions. The Planner also views the successful pre-release screenshot under `batch4b-append-return-held-live-aim-artifacts/`. This is one demonstrated held execution, not repeat stability or a full-file pass. The report's mandatory identity checks remain clean; no catalog field, previous report, wiki, unrelated round table or staging entry changes in this continuation.

**Free/null-position scope decision:** no new case is needed. DRAG-3.3 already requires the foreign-region middle request without anchor/side even when X has no position; DRAG-6.10 covers end preview and TC-6.9 server fallback. The Reconciler finds the composed null-position request branch missing from current DRAG-3.3 carriers, with the current branch retaining anchored-last intent. Those other cases do not prove the missing request clause. DRAG-3.12 separately requires no write for a same-region Board-middle set-down, so avoiding an empty-body request there does not justify an anchor on a foreign-region middle release. The catalog's existing status/pointer is unchanged by this proposing review. Open questions route a concrete separate Coder task for Nathan to schedule, without adding this case to 4b's frozen 26-case/70-variant matrix.

**Next checkpoint:** Nathan reviews this bounded return packet and routes the DRAG-3.3 follow-up. The final held driver has one focused pass, not a full-file pass or D2 certification. A later authorized Stop 2 validation must run the complete affected-file selection, including the B01/B03/B09 proof corrections and B13, on an accepted fixed snapshot. Any further app/Vitest work still uses a separate session/check-in. Stop 4 and Stop 5 remain separate; no full suite, D2 or next batch begins automatically.

### Batch 4b — null-position Coder return review checkpoint, 2026-11-09

Nathan supplied the separate DRAG-3.3 Coder return. This is a bounded review and evidence recovery, not another authoring or execution stage. No application, Vitest, Playwright/helper, catalog, wiki or prior-report edit occurs in this continuation; only the owned plans, the new [null-return proposing report](../../audits/test-reconciliation-story-10-batch-4b-null-return.md) and source-free output metadata are written. No in-session Coder starts.

**Returned scope and identity:** five workflow files change from the accepted append-return baseline: `itemListOps.ts`, `placement.ts` (return type), `dragRequest.ts`, `placement.test.ts` and `itemListOps.test.ts`. `dragRequest.test.ts` stays unchanged. All six raw hashes supplied by Nathan match exactly, all nine frozen Playwright/helper files match, and the other 415 protected files stay unchanged. `tests/output/batch4b-null-return-accepted-before.json` records the new 420-file baseline, protected aggregate `6479bf70f08fb2c40300450352759bbc014f696268a1013dfc2b3d1d03bf0293`. The reported six-file aggregate is retained with its unspecified recipe; individual file hashes, rather than an assumed aggregate recipe, establish the match.

**DRAG-3.3 and the extra workphase field:** the null-position Free preview now selects anchor-free append while retaining end drawing. The composed foreign Board-middle request sends the target workphase without anchor/side, closing the handed-off branch. Sending an unchanged workphase is valid for the tested **locked-Column bare-container append**, where a request naming that workphase invokes the server append fallback. This must remain distinct from an **own-region Board-middle set-down**, whose existing rule is no request. The review below identifies the latter's separate conditional gap; it does not reject the Column append field or change the foreign-middle expected value.

**Retained evidence, recovered without rerunning:**

- `coder-null-position-append-full-e2e.json`: **394 passed / 21 skipped / zero failed**, 415 executions, no flaky result. The exact maintained five-file union is **71/71 passed with no missing title or retry**: all 70 scoped variants plus DRAG-1.14. This includes B01/B03/B09's stronger proof and all twelve B13 variants. All eight B18 variants pass; a separate retained selection records expanded held-middle 3/3. The Coder withdraws the stale-rectangle lead; the earlier Automator driver correction remains unchanged.
- `coder-reopen-append-green.json` records the temporary real-board fixture's workphase-only request without anchor/side, fresh X position 7 and unchanged A/B positions 1/2. `coder-reopen-append-red-oldslot.json` records an anchor/after request and X position 4, with A/B still 1/2. Those values are stdout snapshots, not JSON attachments. The claimed workflow maximum 6 is not emitted by those snapshots and remains a reported fixture fact. The deleted scratch spec is historical evidence, not a maintained regression.
- The Coder reports paired composed-request failures before the fix, restored mutations and a green root gate: **444 server / 1,040 client / 258 scripts, docs 433 / zero hits**. The Reconciler reviews the retained regression design. This continuation performs **zero test executions**, does not rerun that gate and does not repeat the historical full suite.

`tests/output/batch4b-null-return-read-only-checkpoint.json` records exact recovered variant outcomes, source hashes/deltas and sanitized scratch observations. The Coder full run took about 12.53 minutes; that is recovered runner time, not execution or engineering time in this review. Its JSON does not embed a per-run source fingerprint/concurrency record. Current raw hashes match the supplied return; that does not turn the historical run into D2 or Stop 4 certification. The 26-case/70-variant matrix and all case statuses remain unchanged.

**Maintained coverage decision:** the retained composed request regression, existing approved preview tests and delegated TC-6.9 server fallback proof suffice for the foreign-null branch. A permanent extra UI fixture is optional; the Automator need not resurrect the scratch test. At a later authorized mapping pass, the Reconciler may add the eligible `client/src/components/workflow/placement.test.ts` complement to DRAG-3.3 under the already-approved request-rule category. This proposing review writes no Automation field and requests no new approval.

**DRAG-6.10 pointers:** the three existing last-to-append expectation changes are reviewed as the same required end preview. The case's existing paths remain `client/src/components/workflow/placement.test.ts` and `client/src/components/workflow/itemListOps.test.ts`. No provenance, representation history or extra pointer belongs in the living case; the retargeting is recorded here and in the report. The new request regression is distinct from end-preview proof, and the temporary board fixture is not silently counted as permanent automation or added to 4b.

**Existing conditional DRAG-3.12 gap:** with a Free X at null position and other rows in its own covered region, the shared Board-layer middle path still yields a write. Before this return it selected an anchored-last write; now it selects a workphase-only write. Thus missing Board set-down suppression is an **uncovered existing conditional contract gap**, not a new regression introduced by the unchanged-workphase field. Wiki board-drag-interaction §5 and DRAG-3.12 require no request for that Board set-down. The new positioned-own-region and empty-peer controls do not prove this null-position/peers branch. A real-board setup has not been established; no reproduced UI failure or stale-rectangle cause is claimed. No new case or Pending PO ID is needed to restate DRAG-3.12.

**Next owner/action:** Nathan reviews the precise separate Coder guard packet in Open questions. The original DRAG-3.3 repair handoff is delivered, and the returned full run supplies green runtime evidence for all maintained batch variants. The remaining conditional guard is outside 4b's frozen matrix unless Nathan routes it in; current catalog mappings/statuses are unchanged by this proposing pass. A maintained extra board fixture is not authored during this read-only review. Stop 4's frozen twenty-repeat selection/final suite and Stop 5's confirming reconciliation still need Nathan's direction; no full-suite replay, D2 or next batch starts automatically.

### Batch 4b — Stop 4 authorized, 2026-11-09

Nathan directs that conditional DRAG-3.12 remain separately recorded and that 4b proceed. The accepted repair closes its assigned DRAG-3.3 handoff. The existing 26-case/70-variant scope is ready for frozen validation; adjacent findings do not become new 4b dependencies without Nathan explicitly adding them. This supersedes the prior return packet's next-action wording that foregrounded another Coder session.

**Authorized execution:** the same Test Automator is the sole runner/ledger owner. Freeze the accepted app/test/configuration snapshot and exact selection; verify 70 scoped added/changed variants plus the unchanged DRAG-1.14 control in the five-file union. Run twenty repeats for each scoped variant with zero retries, preserving exact per-variant outcomes and every attempt. The forecast is 1,400 scoped repeat executions; historical Coder passes and the unchanged control do not satisfy D2. After the complete repeat requirement passes on the unchanged snapshot, run the final full E2E suite and root gate sequentially. Use new `tests/output/batch4b-stop4-*` evidence paths and retain existing artifacts.

**Freeze confirmed:** `tests/output/batch4b-stop4-freeze.json` records all 420 protected and nine Playwright/helper hashes unchanged from the accepted null-position return, protected aggregate `6479bf70f08fb2c40300450352759bbc014f696268a1013dfc2b3d1d03bf0293`. `batch4b-stop4-scoped-inventory.json` lists exactly 26 expressions / 70 unique scoped variants with no duplicate or new skip; `batch4b-stop4-file-inventory.json` lists 71 with the unchanged control. The Automator executes 26 case-family cohorts, twenty repeats per variant, one worker, zero retries and a first-failure stop. Completion credit comes from its durable per-variant results; this freeze confirmation alone grants no repeat credit.

**Boundary:** no test/helper/app/Vitest/configuration edit, new case, extra discovery/reconciliation cycle or Coder subagent occurs in this stop. A selected-case failure or proposed repair ends the frozen pass with preserved evidence and a concrete checkpoint; it does not authorize an in-session fix. Record interruption/recovery and incomplete variants without silently crediting or rerunning them. The Planner records the result and returns to Nathan at Stop 4; Stop 5's confirming reconciliation is a separate stage. The separately recorded DRAG-3.12 finding remains nonblocking, with no claimed board reproducer or new batch assignment.

### Batch 4b — Stop 4 complete, recovered after delivery interruption

The frozen run meets D2 for **all 70 scoped variants: exactly twenty passes each, 1,400 total**, across 26 case-family cohorts. There are **zero failed attempts, retries or skipped scoped executions**. The unchanged DRAG-1.14 control is excluded from repeat credit and retained in the final full suite. All 28 command attempts (26 repeat cohorts, final E2E and root gate) exit zero and run sequentially.

| Check           | Accepted result                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| D2              | 70/70 variants × 20; 1,400 passes, zero failures/retries/skips                                               |
| Final full E2E  | 394 passed, 21 existing skips, zero failed/flaky; 415 total                                                  |
| Root gate       | 444 server / 1,040 client / 258 scripts; types, lint and format green; docs 433 / zero hits                  |
| Frozen identity | All 420 protected and nine Playwright/helper hashes unchanged; no added/missing full-suite title or new skip |

**Durable acceptance packet:**

- `tests/output/batch4b-stop4-freeze.json`, `batch4b-stop4-scoped-inventory.json` and `batch4b-stop4-file-inventory.json`: exact accepted snapshot, 70 scoped variants / 71 file-union variants, selections and hashes.
- `tests/output/batch4b-stop4-completion-verified.json`: independent recovery reconstruction, no verification issue, exact commands, final fingerprints and timing/termination checks. Playwright JSON omits `repeatEachIndex`; distinct spec IDs and raw execution records establish the twenty repeats. The original ledger's fallback `repeatIndex` field is not authoritative for repeat identity. The Planner independently confirms twenty distinct passing spec IDs per selected variant from the raw cohort JSON.
- `tests/output/batch4b-stop4-ledger.json`: every command/exit/time, all 70 per-variant twenty-pass records, result-file hashes and final unchanged-source comparison. The Planner independently checks those counts, unique variants, records, sequential order, result hashes and all frozen app/test hashes.
- `tests/output/batch4b-stop4-b01.json` through the named B27 cohorts, excluding retired B14, with corresponding logs: the 26 completed repeat result files.
- `tests/output/batch4b-stop4-final-e2e.json` / `.log`, `batch4b-stop4-root-check.log` and `batch4b-stop4-status.json`: final suite/gate and completed-run status.

**Interruption accounting:** the Automator's usage limit interrupted status delivery after the chat last credited B15 and reported B16 in progress. The existing background runner continued and finished normally. On Nathan's continuation, the completed ledger and original exited runner were recovered before any new execution. **No cohort, final suite or gate was restarted**, and the delivery interruption is not a test failure, retry or skipped test. No application/test/helper/configuration repair occurred; no new discovery/reconciliation pass ran.

The original run spans `2026-11-09T22:00:45.044Z` to `2026-11-10T00:03:42.910Z`. Measured D2 runner time is **107.54 minutes**, final E2E runner time **13.68 minutes**, and root-gate command time **1.55 minutes**; total measured command time is **122.96 minutes**, about two hours three minutes. These are executed-run measurements; authoring/review and the later usage-limit delivery wait are not included. The ledger, rather than chat counters, supplies completion credit.

**Next owner/action:** return this completed Stop 4 packet to Nathan. Stop 5 is ready but has not begun: the confirming Reconciler receives the accepted frozen snapshot, exact 26-case scope, runtime ledger/final results and prior proposing decisions, then writes the permitted case fields and confirming report. All 26 scoped cases remain Open in this checkpoint. DRAG-3.12 remains separately recorded and nonblocking; it does not trigger another Coder handoff or widen this batch. No commit, staging change or next-batch work is performed.

### Batch 4b — Stop 5 authorized

Nathan directs the confirming reconciliation of the accepted 26-case scope against the unchanged Stop 4 snapshot and completed validation. The Reconciler writes the permitted status/Automation fields and `docs/audits/test-reconciliation-story-10-batch-4b.md`, carrying stable assertion analysis and performing the required whole-catalog identity checks. Genuine missing scoped clauses remain explicit; adjacent observations do not become new batch dependencies. Conditional DRAG-3.12 stays separately recorded and nonblocking.

The accepted DRAG-3.3 repair may receive its already-eligible `placement.test.ts` Automation complement as associated pointer maintenance, keeping its status/text unchanged; this adds no case or closure to 4b's count. DRAG-6.10's existing paths stay valid. The Planner writes the final batch close-out after the confirming verdict, checks documentation and returns to Nathan for review. No execution, code/test edit, new Coder task, commit, archive move or next batch is authorized by this stage.

### Batch 4b — Stop 5 complete; review/commit checkpoint

The [confirming Reconciler report](../../audits/test-reconciliation-story-10-batch-4b.md) finds whole-Then coverage for **all 26 scoped cases** and makes each Automated. There is no scoped gap or held-off case, and the mandatory whole-catalog lost-coverage, unknown-ID and Manual-ID checks are clean. No new case, Manual decision, test stamp or internal-mapping approval is needed. Conditional DRAG-3.12 remains the separately recorded, nonblocking follow-up; it adds no batch assignment or repair loop.

| Closure kind | Cases Automated |
| ------------ | --------------: |
| Extend       |               4 |
| New          |              20 |
| Rework       |               2 |
| **Total**    |          **26** |

**Final inventory and implementation:** 26 authored/changed expressions expand to **70 scoped variants** across five specs; unchanged DRAG-1.14 makes the maintained file union 71. The test work changes `drag-card-zoom-in.spec.ts` and `drag-5-stub-detach.spec.ts`, adds `drag-attach-placement.spec.ts`, `drag-zoom-cues.spec.ts` and `drag-descendants-placement.spec.ts`, and updates shared support in `tests/helpers/boardLocators.ts`. The other three allowed helpers are reused unchanged. Three planned legacy skip declarations are reworked; the 21 remaining full-suite skips are outside the closed 4b scope. There is no matrix expansion or deferred scoped variant.

**Coder returns and coverage complements:** the separate returns deliver the retired-ID title cleanup, named-Card selection fix plus clock stamps/reset tests, Stub append/no-anchor distinction, and Free/null-position append/request fix. Their changed-file manifests and paired evidence remain in the earlier Results sections and return reports. All product/Vitest work stays separate from the Automator's test work; no new Coder task starts at close-out. DRAG-4.20/4.22 use their already-approved clock complements where the surface does not prove deterministic clock logic. The five sync-support tests remain unstamped. As associated maintenance, the Reconciler adds the approved `placement.test.ts` request complement to existing DRAG-3.3's Automation line, with no change to its status/text; this is not a 27th closure. DRAG-6.10's existing mappings remain unchanged.

**Validation accepted:** every scoped variant passes twenty distinct executions, **1,400/1,400 with zero failures/retries/skips**. The final full suite passes **394 tests with 21 existing skips and zero failed/flaky results**, including 71/71 maintained batch/control variants. The root gate passes **444 server / 1,040 client / 258 script tests, docs 433 / zero hits**, types, lint and format. All app/test/configuration hashes remain the accepted Stop 4 snapshot. The frozen run takes about **two hours three minutes**; earlier authoring/diagnostic and Coder-run evidence is retained above rather than counted as repeat certification or a measured total engineering effort. Recovery after the usage-limit interruption repeats no tests.

**Catalog and write boundary:** totals are now **484 cases: 378 Automated, 93 Open, 10 Manual, one Planned and two Pending PO**. There are **91 active story assignments still Open**, plus two unrelated Open cases. Only the 26 scoped statuses and Automation lines, their mirrored table statuses, and DRAG-3.3's associated Automation pointer change in the catalog. The Planner's independent comparison confirms no case-body/title/priority/ID change and no prior-report change. No source/test/helper edit or execution occurs in Stop 5.

**Evidence and next owner:** the confirming report supplies final coverage mappings; `tests/output/batch4b-stop4-completion-verified.json`, the freeze and ledger supply accepted runtime/source identity, commands and cost. `tests/output/batch4b-stop5-catalog-review.json` records the independent allowed-field comparison. Return this close-out to Nathan for review/commit. No commit, staging change, archive move, workflow-refactor implementation or 4c work is performed. Any separately planned workflow changes at the break after 4b remain Nathan's next decision.

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

## Open questions

- **Separately recorded follow-up — existing conditional DRAG-3.12 Board set-down; nonblocking for 4b (Nathan):** the null-return review finds that Board layer + Free X with null position + its own covered active region + other positioned rows selects a write. DRAG-3.12/wiki board-drag-interaction §5 require no request for this own-region middle release. The branch existed before this return, and real-board reachability remains unproved. If Nathan later routes this work, add a deterministic composed regression for that exact context/peers/null boundary, then the minimal Board set-down guard if the regression confirms the static finding. Preserve the valid locked-Column bare-container append with explicit unchanged `workphaseId`, foreign-middle no-anchor fallback, positioned same-region no-write, empty-peer no-write, end preview and explicit Top/Bottom anchors. Do not remove the workphase field globally or alter case wording to match a write. The request-rule internal category is already approved; application/Vitest work still uses a separate session with exact changed files/source identity and paired red/green evidence. Nathan checks in before later automation. This adds no case ID or 4b assignment and does not hold up the batch close-out; the existing catalog status/pointer is unchanged for this deferred issue.

- **For a separate Architect review, with PO input if needed:** review 4a's seven production files and paired regressions against the wiki before accepting the app changes. The retrospective gives the review manifest and the two Planner/observer interpretations to spot-check. No new review or implementation session has been started.

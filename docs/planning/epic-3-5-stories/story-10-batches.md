# Epic 3.5 Story 10 — the inventory and the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation · **Status:** inventory approved; the Planner's D13 rewording (Phase 2 step 5) is committed. Phase 3 is committed. Batch 4a is complete and stopped at its checkpoint for Nathan; batch 4b has not started.

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
| 4b. DRAG-4 and DRAG-5                       |      4 |  21 |      2 |     0 |     0 |    27 |
| 4c. DRAG-7                                  |      2 |   3 |      9 |     1 |     0 |    15 |
| 4d. DRAG-6                                  |      0 |  12 |      0 |     5 |     0 |    17 |
| 4e. DRAG-8                                  |      0 |  11 |      0 |     1 |     0 |    12 |
| 4f. DRAG-2 and ATT-4.9                      |      4 |   1 |      0 |     9 |     0 |    14 |
| 4g. TREE                                    |      7 |  18 |      1 |     6 |     1 |    33 |
| 4h. The six legacy skips                    |      — |   — |      — |     — |     — |     0 |
| **All**                                     |     27 |  88 |     12 |    24 |     1 |   152 |

The Coder column counts cases closed by Coder work alone. A batch's notes name the Coder halves of other cases. These are the 152 Open cases after step 5. DRAG-1.27 and TREE-2.8 are now shared Manual cases rather than automation assignments; the three new Manual IDs are listed under The shared looks. The 26 original Split IDs are all retained.

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

**Specs:** `drag-card-zoom-in.spec.ts`, whose two skips become one parameterized spec (item 7); `drag-5-stub-detach.spec.ts`, with DRAG-5.13's skip and its row-button re-rolls (D4); and new specs.

| Kind   | Cases                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Extend | DRAG-5.1, 5.4, 5.10, 5.16                                                                                                       |
| New    | DRAG-4.1, 4.3, 4.5, 4.8, 4.12, 4.13, 4.17, 4.19, 4.20, 4.21, 4.22, 4.30, 4.32, 4.33, 4.34, 4.35; DRAG-5.2, 5.3, 5.9, 5.14, 5.15 |
| Rework | DRAG-4.15, 5.13                                                                                                                 |

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
| `drag-card-zoom-in.spec.ts`                    | The two zoom-ins, own column and another                    | Rework both as one parameterized spec for DRAG-4.15 (item 7)                                                  | 4b    |
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

**Checkpoint direction — Nathan, 2026-11-08:** the five stops above are approved for the remaining batches, including the separate Coder handoff/session and check-in. No in-session Coder agent is part of an automation session. The [retrospective](../../audits/story-10-batch-4a-workload-retrospective.md) records the workload evidence behind this direction. D2's bar, case assignments and batch order have not changed; 4b has not started.

## Outside this story (D10)

- **TC-5.15 and TC-6.11, `Open`, and TC-6.13 and ATT-5.11, `Pending PO`:** the Quick Items epic. `epic-4-decisions.md` names all four by ID.
- **ATT-1.10, `Planned`:** a Card shows its tags (wiki item-attachment §12). The Tags & Type System epic holds it. `epic-5-decisions.md` names it by ID, under "Test-plan cases routed here by ID".

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

**Checkpoint stop:** 4a is ready for review/commit and Nathan's decisions on D2, the remaining batches' scope/routing and their order. Batch 4b has not started; this work makes no commit or new process decision.

## Amendments

- **2026-11-08 — Five-stop workflow approved (Nathan).** Added proof/variant review, tests/discovery, separate Coder/review, frozen validation and reconciliation/closure as explicit session stops for 4b–4h. Every applicable stop returns a concrete handoff to Nathan; the next stage does not begin automatically. Added a resume packet at each boundary. Stop 3 is conditional on Coder work; D2, case assignments and batch order are unchanged.

- **2026-11-06 — Phase 2 step 5 (Planner).** Applied D13, recorded the five shared Manual IDs, removed DRAG-1.27 and TREE-2.8 from automation assignments and adjusted the table to 152 Open cases. Clarified the three supporting references in DRAG-6.27, TREE-1.1 and TREE-2.13, preserving their timing, placement and geometry assertions. The baseline remains a pre-D13 reconciliation snapshot; current catalog wording governs the next briefs. No existing ID is retired or reassigned to another suite.

- **2026-11-06 — Phase 3 (Planner).** Recorded the completed helper/refactor phase, approved DRAG-6.25 fix and final validation. The inventory and routes are unchanged; four Automation paths and four stale internal title claims are maintained. The next batch is 4a after Phase 3 review/commit.

- **2026-11-08 — Batch 4a (Planner, from the Automator, Coder and Reconciler).** Completed the 34-case batch and all six Coder handoffs; recorded the sole DRAG-1.16 body clarification, exact D2 recovery proof, full E2E/root results and per-kind/helper/cost checkpoint. All 34 cases are Automated; 118 original story assignments remain Open. No new internal/Manual approval, ID allocation, routing change or process decision. Stopped before 4b and any commit.

## Open questions

- **For a separate Architect review, with PO input if needed:** review 4a's seven production files and paired regressions against the wiki before accepting the app changes. The retrospective gives the review manifest and the two Planner/observer interpretations to spot-check. No new review or implementation session has been started.

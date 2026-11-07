# Epic 3.5 Story 10 — the inventory and the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation · **Status:** inventory approved; the Planner's D13 rewording (Phase 2 step 5) is committed. Phase 3 is complete, including the authorized DRAG-6.25 fix; at its review/commit stop before batch 4a.

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D13), Phases 1–3 and Phase 5. This doc holds the part that grows while the work runs: each Open case's batch and how it closes, each skip's fate, the checkpoint after 4a, and each batch's results. A change to a decision is amended in the plan. A change to a case's route is amended here.

## How to read it

- **The report owns what each case misses.** The [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping gives each Open case's ID-bearing tests and the exact clauses they miss. This doc routes the case and doesn't restate the clauses, so a batch's brief starts from the report's row. D13's current catalog wording supersedes the baseline's paint obligations: those now belong to the shared Manual cases below. Saved outcomes, target/state selection, positions and sizes still belong to the automated cases. Once a batch has run, its confirming run's report is the later word for its cases.
- **The roadmap entry's items** (1–11) reach this doc by case, through the report, which read every case they route. Their non-case items are D3's, D4's and D8's.
- **Every case ends `Automated` by a surface test,** a Playwright test written by the Test Automator, unless its batch's notes say otherwise. A Split case's look ends `Manual`, in a shared case (D13).
- **The kinds of work:**

  | Kind | Means | Writer |
  |---|---|---|
  | Extend | A running test that carries the ID gets the clause it misses, or a running test takes the ID | Automator |
  | New | A new test, usually a gesture | Automator |
  | Rework | A skipped spec, reworked to its case as it now reads (D3) | Automator |
  | Split | The Planner rewords the case to the part a test can pin, and moves its look to a shared `Manual` case (D13). The pinned part is then an Extend or a New | Planner, then Automator |
  | Coder | A Vitest test, a test hook or a fix (D7, D12) | Coder |

- **No request, or exactly one:** many *Then*s say so, and the request harness checks it (D4). Saved fields alone don't prove it (the report's Test Quality Concerns, #5).

## The batches

Each batch's cases are below in run order, which D5 sets: a later batch reuses an earlier one's setups.
- 4a builds the column, done-column, Unsorted and Descendants setups.
- 4b builds the zoom and Stub setups, and 4c the modal's.
- 4d's forced stops need all three.
- 4e and 4f check the carried branch and the tiers across every layer.
- 4g is the sidebar's own.

| Batch | Extend | New | Rework | Split | Coder | Cases |
|---|---:|---:|---:|---:|---:|---:|
| 4a. DRAG-1, DRAG-3, TC-6.4, BCU-5.6 and 5.7 | 10 | 22 | 0 | 2 | 0 | 34 |
| 4b. DRAG-4 and DRAG-5 | 4 | 21 | 2 | 0 | 0 | 27 |
| 4c. DRAG-7 | 2 | 3 | 9 | 1 | 0 | 15 |
| 4d. DRAG-6 | 0 | 12 | 0 | 5 | 0 | 17 |
| 4e. DRAG-8 | 0 | 11 | 0 | 1 | 0 | 12 |
| 4f. DRAG-2 and ATT-4.9 | 4 | 1 | 0 | 9 | 0 | 14 |
| 4g. TREE | 7 | 18 | 1 | 6 | 1 | 33 |
| 4h. The six legacy skips | — | — | — | — | — | 0 |
| **All** | 27 | 88 | 12 | 24 | 1 | 152 |

The Coder column counts cases closed by Coder work alone. A batch's notes name the Coder halves of other cases. These are the 152 Open cases after step 5. DRAG-1.27 and TREE-2.8 are now shared Manual cases rather than automation assignments; the three new Manual IDs are listed under The shared looks. The 26 original Split IDs are all retained.

### 4a. DRAG-1 and DRAG-3, with TC-6.4 and BCU-5.6 and 5.7

**Specs:** the DRAG-1 and DRAG-3 specs Phase 3 splits out of `drag-column-bands.spec.ts` (D4), `item-positioning.spec.ts` for TC-6.4, and new specs.

| Kind | Cases |
|---|---|
| Extend | DRAG-1.3, 1.9, 1.12, 1.24; DRAG-3.9, 3.10, 3.11, 3.17, 3.18; TC-6.4 |
| New | DRAG-1.1, 1.2, 1.5, 1.6, 1.13, 1.16, 1.17, 1.18, 1.20, 1.22, 1.28, 1.33, 1.35, 1.36; DRAG-3.12, 3.16, 3.19, 3.20, 3.23, 3.24; BCU-5.6, 5.7 |
| Split | DRAG-1.26, 3.22 |

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

| Kind | Cases |
|---|---|
| Extend | DRAG-5.1, 5.4, 5.10, 5.16 |
| New | DRAG-4.1, 4.3, 4.5, 4.8, 4.12, 4.13, 4.17, 4.19, 4.20, 4.21, 4.22, 4.30, 4.32, 4.33, 4.34, 4.35; DRAG-5.2, 5.3, 5.9, 5.14, 5.15 |
| Rework | DRAG-4.15, 5.13 |

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

| Kind | Cases |
|---|---|
| Extend | DRAG-7.28; DRAG-1.14 |
| New | DRAG-7.13, 7.31; DRAG-3.25 |
| Rework | DRAG-7.6, 7.9, 7.10, 7.14, 7.15, 7.17, 7.18, 7.27, 7.32 |
| Split | DRAG-7.12, its skip reworked to the tier attributes |

- **DRAG-7.28:** add its ID to DRAG-7.9's first-child test, which saves `R2` before `R1a` (the report's Proposed Stamps).
- **DRAG-7.10 (8.13 audit #8):** the Coder moves the two excursions' reset into a `popSession.test.ts` clock test. The spec keeps reachability and the write, with thresholds from `seedDragTuning`.
- **DRAG-7.15 and 7.27's aims:** see the roadmap entry's item 10, "From Story 8.3". The gap below `R`'s overflow row is drawn for an aim in the overflow row's band. The one-step spec aims at `R`'s row center and at the overflow row.
- **DRAG-7.32** gets its screen-place check when it's reworked (Inbound deferrals).
- **DRAG-3.25** is here for the modal's and the backdrop's rows. Its heights are measured with `boxOf`.
- **#10, the Sheet tests' own spec,** is optional. This batch decides.

### 4d. DRAG-6

**Specs:** the DRAG-6 spec Phase 3 splits out of `drag-column-bands.spec.ts` (D4), and new specs.

| Kind | Cases |
|---|---|
| New | DRAG-6.7, 6.8, 6.9, 6.15, 6.16, 6.17, 6.18, 6.21, 6.22, 6.25, 6.27, 6.28 |
| Split | DRAG-6.19, 6.20, 6.23, 6.24, 6.26 |

- **It comes after 4b and 4c,** since the flash and the hidden-row cases (DRAG-6.20, 6.21 and 6.28) need their Stub, section and modal setups.
- **Each stop has a genuine cause,** from Phase 3's cause helper (D4): a refused drop, a stale response with reindex pairs, or a refused column reorder. The armed stop stands in for none of them. A case that names all three runs once per cause.
- **D9's surface spec is written here,** with DRAG-6.22 and 6.25.
- **DRAG-6.26:** the new tests cover Phase 1's hook and component candidates, so those mappings aren't needed.
- **DRAG-6.27:** the flash's window is automated with `data-stop-flash`. DRAG-6.20 holds the target-row state; DRAG-6.30 holds the painted pulses and banner fade. DRAG-6.23 and DRAG-6.24 hold pending-state ownership, with the painted pulse in DRAG-6.31.
- **None of these cases needs a tuned duration or the final look** (the roadmap entry's item 10, "From Story 8.4").

### 4e. DRAG-8

**Specs:** a new spec, since DRAG-8 has none.

| Kind | Cases |
|---|---|
| New | DRAG-8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12 |
| Split | DRAG-8.2 |

- **One setup for most of them:** the five-row branch with its Free-linked rows. The branch's absence is read from `data-carried-branch`, and its counts as text.
- **DRAG-8.7** uses the cause helper.
- **DRAG-8.10** measures its boxes with `boxOf`, and proves the line lets the pointer through by hovering a row it covers.

### 4f. DRAG-2 and ATT-4.9

**Specs:** `drag-target-classification.spec.ts`.

| Kind | Cases |
|---|---|
| Extend | DRAG-2.4, 2.8, 2.22; ATT-4.9 |
| New | DRAG-2.12 |
| Split | DRAG-2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20, 2.21, 2.23 |

- **It comes after 4e,** since DRAG-2.17–2.19 check tiers across pop-out, zoom, the modal and the carried branch.
- **The tiers are read from `data-drop-tier`.** Each Split case's look is the board's tiers (D13).
- **ATT-4.9 is A3's option (a):** each target the spec classifies is replayed against the move endpoint, each from the same starting state.

### 4g. TREE

**Specs:** `project-tree-drag.spec.ts`, with TREE-1.4's and TREE-2.1's skips; `project-sidebar.spec.ts`, `project-tree-sidebar.spec.ts` and `project-tree-expansion.spec.ts`; `useProjectCollection.test.ts` for TREE-9.4.

| Kind | Cases |
|---|---|
| Extend | TREE-1.8, 1.11, 1.12; TREE-2.2, 2.3; TREE-4.7; TREE-11.7 |
| New | TREE-1.2, 1.5, 1.6, 1.10, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19; TREE-2.10, 2.11, 2.12, 2.13; TREE-4.9, 4.11, 4.15 |
| Rework | TREE-1.4 |
| Split | TREE-2.1, its skip reworked; TREE-2.4, 2.5, 2.6, 2.7, 2.14 |
| Coder | TREE-9.4 |

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

| Shared Manual case | Look checked by hand | Behavior cases whose look it holds |
|---|---|---|
| DRAG-2.24 | Board Full/Mid/Low and ghost strengths across Cards, Stubs, overflow rows, sections and the modal; no relationship colour or compounded dimming; full-strength drop lines | DRAG-2.14, DRAG-2.15, DRAG-2.16, DRAG-2.17, DRAG-2.18, DRAG-2.19, DRAG-2.20, DRAG-2.21, DRAG-2.23, DRAG-7.12, DRAG-8.2 |
| DRAG-6.31 | Pending pulses from each row's own strength to half, with nested rows and the line independent | DRAG-6.23, DRAG-6.24 |
| DRAG-6.30 | The flash's two amber pulses and the banner's full-strength/final-quarter fade | DRAG-6.19, DRAG-6.20, DRAG-6.26; DRAG-6.27 points to it while retaining the automated flash-window rule |
| DRAG-1.27 | A Free pickup's tilt, the carried Stub's held shadow and the active-context outline colour | DRAG-1.26, DRAG-3.22; DRAG-1.27 retains its own tilt obligation in this shared case |
| TREE-2.8 | Sidebar Full/Mid/Low, ghost and untiered-new-row strengths from its own values; full-strength line without relationship colour | TREE-2.1, TREE-2.4, TREE-2.5, TREE-2.6, TREE-2.7, TREE-2.14; TREE-2.8 retains independent sidebar values. TREE-1.1 and TREE-2.13 point to it while retaining their placement/line geometry |

**Batch handoff:** read the current case first, then the baseline residuals. Do not add an appearance assertion back to a state case, and do not use the shared Manual case to defer its saved result, affected row, state, location or size. Existing Automated statuses and pointers are unchanged; these rewrites make no new coverage claim. The later confirming runs judge each revised Open case against its current Then.

## The skips (D3)

All 24, by the report's skip register.

| Spec | Skipped test | Fate | Batch |
|---|---|---|---|
| `drag-5-stub-detach.spec.ts` | DRAG-5.13, a grandchild Stub popped out to its Card's layer | Rework to the case as it reads, with one pop to the containing column. Its Card-layer expectation is obsolete | 4b |
| `drag-card-zoom-in.spec.ts` | The two zoom-ins, own column and another | Rework both as one parameterized spec for DRAG-4.15 (item 7) | 4b |
| `drag-7-hierarchy-modal.spec.ts` | DRAG-7.9, R1's last child after R1a | Trace, then Rework | 4c |
| | DRAG-7.6, 7.10, 7.11, resting outside the modal pops out | Rework to DRAG-7.6 and 7.10, with no Card layer. DRAG-7.11 is `Automated` without it | 4c |
| | DRAG-7.2, 7.6, an own slot behind an overflow row | Rework to DRAG-7.6, as one re-entry spec with the shown own slot's. DRAG-7.2 is `Automated` without it | 4c |
| | DRAG-7.2, R's only attached child dragged | Delete: DRAG-7.2's count tests cover it | 4c |
| | DRAG-7.6, an own slot the section shows | Rework, with the re-entry spec above | 4c |
| | DRAG-7.32, the three ways to close the Sheet | Trace, then Rework with the screen-place check | 4c |
| `drag-7-modal-hold.spec.ts` | DRAG-7.14, resting outside the section ends the hold | Rework to the whole Card's bound, which replaced the section's | 4c |
| | DRAG-7.15, from above to below R's overflow row | Rework at item 10's aims, as one spec parameterized over W alone and W with WC | 4c |
| | DRAG-7.15, the same with a child | Merged into the spec above | 4c |
| | DRAG-7.17, above the overflow row with a scrolling list | Trace (item 8), then Rework | 4c |
| | DRAG-7.12, the modal carries the classification | Rework as the tier-attribute test (D13) | 4c |
| | DRAG-7.10, 7.18, reopening the modal in the same drag | Rework, with no Card layer | 4c |
| `drag-7-overflow-row.spec.ts` | DRAG-7.27, R carries its overflow row | Rework, at an aim that's been tried | 4c |
| `project-tree-drag.spec.ts` | TREE-1.4, a subtree that holds every project | Rework, aimed at the dragged project's own row | 4g |
| | TREE-2.1, descendants dimmed | Rework to the branch's absence and the tier attributes, with #12's title and reason replaced | 4g |
| `item-repositioning-cross-column-dnd.spec.ts` | 1.a and 2.a | Re-check, then re-derive or delete (4h) | 4h |
| `item-repositioning-cross-project-dnd.spec.ts` | 1.a, 2.a, 2.b and 4.b | The same | 4h |

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

## Outside this story (D10)

- **TC-5.15 and TC-6.11, `Open`, and TC-6.13 and ATT-5.11, `Pending PO`:** the Quick Items epic. `epic-4-decisions.md` names all four by ID.
- **ATT-1.10, `Planned`:** a Card shows its tags (wiki item-attachment §12). The Tags & Type System epic holds it. `epic-5-decisions.md` names it by ID, under "Test-plan cases routed here by ID".

## Approvals (Phase 2 step 4)

Nathan approved these on 2026-11-06.

- **The Reconciler's proposed internal mappings are all declined.** Each case still needs a surface test for the rest of its *Then*, and that test can check the same part. The README maps no internal test beside a surface test that covers the whole case.
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

## Amendments

- **2026-11-06 — Phase 2 step 5 (Planner).** Applied D13, recorded the five shared Manual IDs, removed DRAG-1.27 and TREE-2.8 from automation assignments and adjusted the table to 152 Open cases. Clarified the three supporting references in DRAG-6.27, TREE-1.1 and TREE-2.13, preserving their timing, placement and geometry assertions. The baseline remains a pre-D13 reconciliation snapshot; current catalog wording governs the next briefs. No existing ID is retired or reassigned to another suite.

- **2026-11-06 — Phase 3 (Planner).** Recorded the completed helper/refactor phase, approved DRAG-6.25 fix and final validation. The inventory and routes are unchanged; four Automation paths and four stale internal title claims are maintained. The next batch is 4a after Phase 3 review/commit.

## Open questions

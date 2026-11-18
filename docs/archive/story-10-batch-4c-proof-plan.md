# Story 10 batch 4c — proof and variant review

**Type:** Stop 1 deliverable (proof/variant plan) · **Written:** 2026-11-11 by the QA Engineer · **Status:** complete. Nathan made the [decisions](#decisions-nathan-2026-11-11) and approved the Stop 2 file list on 2026-11-11. Nothing is authored, no test has run, no app, test, helper, Vitest or catalog file has been edited. Stop 2 starts when Nathan opens its session.

This is the Stop 1 deliverable under [the five stops](story-10-batch-4a-4d-log.md#the-five-stops-for-each-remaining-batch). It says what batch 4c must prove before any test is written. Every expected value below comes from the case's Then and the wiki rule it cites. The specs and helpers were read only for how to reach and observe a state. The desk's questions and replies are in the [Review log](story-10-batch-4a-4d-log.md#batch-4c-stop-1--the-desks-questions-and-replies-2026-11-11), word for word.

## Inputs and scope

- **Baseline tree:** `16fe9e07637a66f797a82fb3c2d5c8b01c9e5aed`, HEAD's tree at `175943d7` (Nathan, 2026-11-11). The working tree was clean at entry. A snapshot written by the testing guide's temporary-index method is `e35485dde45a365b0fa02ee807f89e11bacfc52d` for the same files. It differs from HEAD's tree by two gitignored files that HEAD tracks, `.claude/settings.local.json` and `server/.env`, which that method leaves out. Compare later snapshots with each other, or expect those two paths in a diff against the baseline.
- **Assigned cases (15):** [DRAG-7](../../test-plans/board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md) 7.6, 7.9, 7.10, 7.12, 7.13, 7.14, 7.15, 7.17, 7.18, 7.27, 7.28, 7.31 and 7.32; [DRAG-1.14](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md); [DRAG-3.25](../../test-plans/board-drag-interaction/drag-3-card-column-bands.md). By kind: 2 Extend (7.28, 1.14), 3 New (7.13, 7.31, 3.25), 9 Rework (7.6, 7.9, 7.10, 7.14, 7.15, 7.17, 7.18, 7.27, 7.32), 1 Split (7.12). All 15 are `Open` in the catalog. DRAG-7.20 stays `Manual`; the painted looks are DRAG-2.24's.
- **Missing clauses:** the [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping rows for these cases, read against the current case text, which governs where it is more specific.
- **Catalog report** (`npm run report:catalog`, run on the baseline tree): 488 cases (378 Automated / 96 Open / 10 Manual / 2 Planned / 2 Pending PO); 119 test files declare 1,718 tests, 22 of them skipped. Its one lost-coverage entry is DRAG-3.16, whose two variants are skipped until 4h. The 13 skips in the three DRAG-7 specs are this batch's.
- **DRAG-7.10's runner evidence** (Nathan, 2026-11-10): `tests/output/parallel-workers-batch3/full-3w-2.json`, `full-3w-3.json` and `drag-3w-repeat5.json`; the five-worker full runs `tests/output/parallel-workers-scaling-20261110/full-5w-1.json` and `full-5w-2.json`; and the [runner report](../../archive/e2e-parallel-workers.md). (The batch plan still links that report at its pre-archive path.) Two failure modes, kept apart:
  1. the expected `column:<id>` context never appears within the existing wait (`data-drag-state="popped-out"` with no context); the release and detach assertions aren't reached;
  2. the drag reaches the release but the item stays attached (`isAttached` 1, where the Then says Free).

  At five workers the second mode failed two of three full runs. The one- and two-worker comparisons passed. The cause is unresolved, and the assertions stay as written.

  **Both modes occur in the "pop out past the Card's box" test, not in the brief-excursion test.** The excursion test is the one audit #8 says to split: its literal 800 ms excursions and 1,500 ms delay are replaced, its clock reset moves into a `popSession.test.ts` test, and the surface keeps reachability with thresholds from `seedDragTuning`. That split fixes the excursion test's timing. Nothing in the evidence says it reaches either failure mode. Nathan's approval of the internal half (2026-11-11) was "if the flakiness can be solved by splitting" into a surface part and an internal part. The evidence doesn't yet show that it can, so the approval is read as covering the audit #8 split on its own terms, and the flaky test's cause is left to T4.

## The traces come first

The batch plan holds that nothing new is written in the DRAG-7 specs until the traces are done. They are discovery runs, so they belong to Stop 2, and they are designed here.

| Trace | Test | Why it's on the list |
| --- | --- | --- |
| T1 | DRAG-7.17, the skipped "from the gap above R's overflow row" | fails about one run in eight alone, and in some full runs; the ghost's painted box misses the cursor or the projection settles a gap or two above the expected one after the list scrolls |
| T2 | DRAG-7.9, the skipped "R1's last child, after R1a" | timed out in one full run; passed 6 of 6 alone |
| T3 | DRAG-7.32, the skipped Sheet close | left the Sheet open after a way of closing, once in a full run and 1 of 8 alone; 2 of 16 at an earlier HEAD |
| T4 | DRAG-7.10, "a pop out of the modal, past the Card's box…" | the two modes above |
| T5 | DRAG-7.3 | failed in 8.13's full runs |
| T6 | DRAG-7.4 | failed in 8.13's full runs |
| T7 | DRAG-7.16, bottom, top and right edge (three tests) | failed in 8.13's full runs |
| T8 | DRAG-7.29, both tests | failed in 8.13's full runs |

T5 to T8 aren't among the 15 assigned cases, and those cases are `Automated`. **Method for each:** two runs, each with a named JSON report under `tests/output/` (`PLAYWRIGHT_JSON_OUTPUT_NAME`), retries 0, no `--reporter`, and never `--workers` (the guide's "Running the tests"):
1. **Alone:** `npm run test:e2e:serial -- <file> -g "<title>" --repeat-each=20`, one worker, no load.
2. **Under contention:** `npm run test:e2e -- <the runner report's 24-file drag selection> --repeat-each=5`, at the default five workers. That's the selection (`tests/output/parallel-workers-batch3/drag-selection.json`) under which DRAG-7.10 failed, so the traces share its load. I add `--repeat-each` upward if five copies don't separate a rate.

Record every failure's error location and message, and the slot and worker, so the two runs can be compared. A trace sets no cause and fixes nothing by itself. **If T5 to T8 still fail,** that's an adjacent finding returned to Nathan, not a fix made inside the batch. T1 to T4 feed the rework of their own cases.

## Required proof by case

The desk's verdicts bound each row. A clause the desk found silent is **not asserted**, and goes to the Planner (below).

| Case | Kind | Missing proof to supply |
| --- | --- | --- |
| DRAG-7.6 | Rework | One continuous gesture from a click-opened modal: pick up `R1`, pull out, zoom back into `P` by the full hold. The ghost is in the last gap, below `B`, at level 1, and `R`'s overflow row reads "1 child" meanwhile. The release commits `R1.parentId = P`, attached, last among `P`'s attached children, with `R1a` still `R1`'s child. Alternatives: `R` picked up the same way starts in its own slot, between `Q` and `T`, at level `L`, and a release writes nothing; `R1` released in the column before zooming back is Free with `parentId = R`, placed by the column's within-action. **The fixture is the Given's tree, where `B` is `P`'s last attached child**; the shared fixture's extra Stub `X` after `B` is left out (desk, 7.6 r1). |
| DRAG-7.9 | Rework | `R2`'s release in the gap between `R1a` and `T`, aligned with `R1a`: `R2.parentId = R1`, attached, after `R1a`. After each of the four releases `R2` is saved attached with `P`'s workphase (desk, 7.9 r1): the first-child test asserts it, and the own-gap and over-cap tests don't yet. |
| DRAG-7.10 | Rework | One pop out of the modal, as the matrix below says: to `K`, Free, bounded by `K`, both copies shortCard; no further exit from `P`'s box needed; a release after Card `Q` writes `{anchorId: Q, side: after}`, a Stub with `isAttached: false` and its original `parentId`, a Free Card still Free with its original `parentId`; no attach into `P`; from an expanded sub-row, another pop out of `K` to reach Board or a sibling sub-row. A single excursion that satisfies neither threshold leaves the modal open. The header rests without a pop (kept as it is). |
| DRAG-7.12 | Split | The tier of each row of the hold-opened modal, read from `data-drop-tier`: `R` and `R1` Full, `R1a` Mid, `Y` Low. `R`'s tier is the same before and after the modal opens. The static section rows under the backdrop carry none. Painted strengths are DRAG-2.24's. Needs `Y`, an attached child of `R1a`, in the fixture. |
| DRAG-7.13 | New | A Free Card zoomed into `P` from outside, held in the gap between `R` and its overflow row: silent dwell, then a visible cue on the row, then the modal opens with the drag at `P`'s Descendants layer. A release before the cue completes commits `R`'s first child and the modal never opens. The same below the overflow row at level `L + 1`, as `R`'s last child. |
| DRAG-7.14 | Rework | Leaving the whole Card's box with the ghost in its gap: the cue goes at once, the modal doesn't open, and no dwell runs until the cursor is back inside; back inside, a fresh dwell starts. Moving into the Card's title or padding during the dwell, and separately during the cue, runs the hold on, and completing it there opens the modal. Replaces the skipped test's smaller section bound. |
| DRAG-7.15 | Rework | The modal opens with the ghost's spot under the cursor for each of gap (above or below the overflow row), approach (down from above or up from below) and subtree (none, or a child of its own). A release without moving the cursor commits the same placement. With a subtree, the child is absent from the section and the modal for the whole drag and drawn directly under the item after the release. One variant reaches the aim in a single approach at `R`'s own row. |
| DRAG-7.17 | Rework | The gap above `R`'s overflow row, with a sibling of `R` before it carrying many attached children: the list scrolls so the spot is under the cursor, and a release commits first among `R`'s attached children. |
| DRAG-7.18 | Rework | After a pop out of a hold-opened modal and a zoom back by the full hold, a hold beside an overflow row opens the modal again at the same layer, and a release places by gap and depth. No write before the final release. One reopen is asserted. |
| DRAG-7.27 | Rework | `R` carried: its overflow row is absent for the whole drag, the gap after `Q` runs to `T`, the drop line is never on `R`'s overflow row, an unrelated overflow row keeps its count, and the release as `B`'s next sibling at level 1 leaves `R1` and `R2` attached, `R` without an overflow row and both children in the section at level 2. `Q` carried: `R`'s row and `R`'s overflow row are absent. `P` carried and zoomed into another Card: no overflow row of `P` or its branch is drawn there. A cancel brings back `R`'s overflow row reading "2 children". |
| DRAG-7.28 | Extend | The saved order after the carried row's release: `R2` before `R1a`. The DRAG-7.9 first-child test already asserts it; it takes the ID. |
| DRAG-7.31 | New | One continuous gesture: `R2` out of the modal, pop out, zoom back in, reopen by a hold, ghost moved back to `R2`'s original gap after `R1a`, before `T`, at level `L + 1`, release. No request is sent from pickup through the release. `R2.parentId = R`, attached, position unchanged, `P`'s workphase; the modal is still open and shows `R2` in that slot. |
| DRAG-7.32 | Rework | The Sheet opened over the modal, closed by its X, its backdrop and Escape, each from a fresh state: only the Sheet closes; the modal is at its prior place on screen with the same list order, depths and scroll offset (non-zero before); nothing written; one further Escape closes the modal. A click on the Sheet's backdrop at the point over the modal's own X closes only the Sheet. |
| DRAG-1.14 | Extend | One pointer sample at least `popDistancePx` outside the modal's box pops to `K` at once, and outside an expanded sub-row's box pops to Board at once. With `popDistancePx` 0, the cursor outside the modal's box for less than `popDelayMs` pops nothing. |
| DRAG-3.25 | New | The section's typed and untyped Stub rows, its overflow row and a long-title row have one height `s`; the pill is no taller than the title's text line. Opening the modal: its typed and untyped rows and the static section rows under the backdrop have `s`. A typed or untyped Stub picked up from the section or the modal: the in-list ghost and the carried copy each have a box of `s`, the carried border inside it. With a branch, the carried copy's second line lies below that box and adds nothing; the ghost has none. Heights are compared with each other, never with a pixel value. |

## What is not asserted, and where it goes

Each is a Planner-session question (case silent or contradicted). None blocks the rest of the batch.

| Desk row | What it left open | What Stop 2 does instead |
| --- | --- | --- |
| DRAG-7.10 r6 | Two excursions, each short and together long, with the clock restarting on return. The wiki states it (§3.1); the Then states one excursion; DRAG-1.30 carries the reset for a Card in its column. | The surface test asserts a single excursion that satisfies neither threshold (r7 follows, clock and distance). The reset itself is the Coder's clock test (audit #8; the clock category was approved in Phase 2). Which ID that test carries needs the ruling (see Coder dependencies). |
| DRAG-7.14 r5 | Where the ghost is once a hold completes with the cursor in the Card's padding. | Asserts that the modal opens, nothing about the ghost. |
| DRAG-7.15 r6 | The roadmap's second one-step aim, the overflow row's top quarter ("no hold runs, the ghost is after the overflow row, a release writes the same"), contradicts the Then: with the ghost after the overflow row at its level the hold runs. | Not written. Only the aim at `R`'s own row is (r5). |
| DRAG-7.18 r1 | Whether "as often as the drag needs" asks for more than one reopen. | One reopen. |
| DRAG-7.27 r3 | Whether `T`'s row is also absent when `Q` is carried; DRAG-8.1 holds the branch rule. | Asserts `R`'s row and `R`'s overflow row only. |
| DRAG-7.9 r2, r3 | Whether "throughout" reaches the drag before release; whether the closing sentence is an outcome of its own. | Asserts the saved attached state and workphase after each release. No mid-drag attached check, no separate closing-sentence test. |
| DRAG-7.18 r2 | Not stated for requests that write nothing. | Counts writes only, as the Then says. |

## Scenario matrix and estimate

Every row starts from fresh fixtures, asserts its Given before its When, and reads thresholds from `seedDragTuning`. No test asserts a duration. Counts are forecasts, not results.

| Row | Cases | Scenario and observable proof | Variants |
| --- | --- | --- | ---: |
| C01 | 7.9 (+7.28) | Rework the skipped last-child release after `R1a`, aligned with `R1a`: parent `R1`, attached, after `R1a`, `P`'s workphase. Extend the own-gap and over-cap tests with saved attached state and workphase. The first-child test takes DRAG-7.28 in its title (title only). | 1 + 2 extended = 3 |
| C02a | 7.10, 1.14 | Pop-out matrix, the cursor resting inside `P`'s own box and outside the modal's box. Arrival: click-opened with a Stub, hold-opened with `P`'s own Stub, hold-opened with a Free Card zoomed in. `K`: merged column, expanded sub-row. Threshold: the clock, or the distance with one pointer sample. One pop; `K` bounded; both copies shortCard; release after a Card `Q` in `K` writes `{anchorId: Q, side: after}`, Stub `isAttached: false` with its `parentId` kept, Free Card still Free with its `parentId` kept; no attach into `P`. The distance variants carry DRAG-1.14. | 3 × 2 × 2 = 12 |
| C02b | 7.10 | The same, resting outside `P`'s box inside `K` (the active flaky test, reworked). | 1 |
| C02c | 7.10 | Expanded sub-row: after the one pop, a further pop out of `K` reaches Board. | 1 |
| C02d | 7.10 | Expanded sub-row: after the one pop, resting in a sibling sub-row leaves the drag locked in `K` until another pop. | 1 |
| C02e | 7.10, 1.14 | One excursion short of `popDelayMs` (popDistancePx 0) and back: the modal and the Descendants layer stay. This is the clock half of DRAG-1.14's last clause. | 1 |
| C02f | 7.10, 1.14 | One excursion short of `popDistancePx` and back: the modal stays. | 1 |
| C03 | 1.14 | A Free Card locked in an expanded sub-row: one sample at least `popDistancePx` outside pops it to Board at once, with every clock off. Sits beside the existing DRAG-1.14 test. | 1 |
| C04 | 7.6 | One continuous gesture from a click-opened modal: (a) `R1`, hidden own slot, zoomed back: ghost last, overflow reads "1 child", release commits last child with `R1a` kept; (b) `R`, shown own slot: ghost between `Q` and `T`, release writes nothing; (c) `R1` released in the column: Free, `parentId = R`, the column's `{anchorId, side}`. | 3 |
| C05 | 7.13 | A Free Card zoomed into `P`: the full hold above the overflow row (dwell shows nothing, cue shows on the row, modal opens, layer unchanged) and below it; a release before the cue completes commits first child (above) or last child (below), the modal never opening. | 4 |
| C06 | 7.14 | (a) The cursor leaves the whole Card's box with the ghost in its gap: cue gone, no modal, no dwell outside, a fresh dwell on return. (b) Moved into the title or padding during the dwell: the hold completes and opens the modal. (c) The same during the cue. | 3 |
| C07 | 7.15 | (a) Gap × approach × subtree for the four combinations not yet covered: last child from above with and without a child; first and last child from below with a child. (b) A single approach at `R`'s own row, for an item with a child. (c) The existing first-child-from-above test with a child gains the child's absence for the whole drag and its row under the item after the release. Each: the modal opens with the spot under the cursor, and a release writes what the modal draws. | 4 + 1 + 1 extended = 6 |
| C08 | 7.17 | The gap above the overflow row with a long run of rows before it: the list is scrolled, the spot is under the cursor, the release commits first child. After T1. | 1 |
| C09 | 7.18 | Pop out of a hold-opened modal, zoom back by the full hold, hold again, the modal opens again, release places by gap and depth; no write before it. The carried item is `P`'s own Stub, or a Free Card from outside. | 2 |
| C10 | 7.27 | (a) `R` carried and released as `B`'s next sibling at level 1, with an unrelated overflow row (`T` given a child) drawn and counted. (b) `R` carried, then cancelled: "2 children" again. (c) `Q` carried: `R`'s row and overflow row absent. (d) `P` carried and zoomed into another Card: no overflow row of `P` or its branch there. | 4 |
| C11 | 7.31 | One continuous gesture, no request from pickup to release, `R2` unchanged and shown in its original slot in the open modal. | 1 |
| C12 | 7.32 | The Sheet closed by Escape, by its X, by a backdrop click away from the modal, by a backdrop click over the modal's X. Each from a fresh state in a window short enough that the list scrolls. | 4 |
| C13 | 3.25 | (a) Static: typed, untyped, long-title Stub rows, the overflow row and the pill against the title line, one `s`. (b) Modal open: its rows and the static section rows under the backdrop, one `s`. (c) Pickup: source (section, modal) × typedness (typed, untyped) × branch (none, one), ghost and carried copy each `s`, the branch line below the carried box, none on the ghost. | 1 + 1 + 8 = 10 |
| C14 | 7.12 | A hold-opened modal during `X`'s drag: `data-drop-tier` Full on `R` and `R1`, Mid on `R1a`, Low on `Y`; `R` as before; no tier on the static section rows. | 1 |
| | | **Authored and changed variants** | **60** |

**Counts.** 15 catalog cases; about 34 authored or changed test expressions (C01 3, C02 6, C03 1, C04 3, C05 3, C06 3, C07 3, C08 1, C09 1, C10 4, C11 1, C12 1, C13 3, C14 1); **60 runnable variants** when expanded. Nathan chose the full 12 for DRAG-7.10's matrix, so the pairwise set of 7 (55 variants) is dropped. Of the 13 skipped tests, 12 are replaced as above and one is deleted. DRAG-7.28 adds one title stamp and no variant, on the existing DRAG-7.9 first-child test, and Nathan wants that retitled test repeated too. **The repeated set is 61 variants, so 610 passes** at D2's ten each (1,220 at the twenty in force when this was written; D2 was amended later on 2026-11-11). That count excludes the traces and any other untouched test in the files.

**The 13 skips.**

| Skip | Becomes |
| --- | --- |
| `hierarchy-modal`: 7.9 last child | C01 |
| `hierarchy-modal`: 7.6, 7.10, 7.11 pop out | C02 (7.10), C04 (7.6); loses DRAG-7.11 in its title, which stays `Automated` without it |
| `hierarchy-modal`: 7.2, 7.6 hidden own slot | C04 |
| `hierarchy-modal`: 7.2, R's only child dragged | **deleted**, as D3 says: DRAG-7.2's count tests cover it. It carries DRAG-7.2, so it goes in the living-docs handoff. |
| `hierarchy-modal`: 7.6 shown own slot | C04 |
| `hierarchy-modal`: 7.32 | C12 |
| `modal-hold`: 7.14 outside the section | C06 |
| `modal-hold`: 7.15 two, last child from above, alone and with a child | C07 |
| `modal-hold`: 7.17 above the overflow row | C08 |
| `modal-hold`: 7.12 | C14 |
| `modal-hold`: 7.10, 7.18 reopen | C09 |
| `overflow-row`: 7.27 | C10 |

## Implementation scope for Stop 2 (file list approved by Nathan, 2026-11-11)

**Playwright specs (edit):** `tests/ui/drag-7-hierarchy-modal.spec.ts` (C01, C02, C04, C11, C12), `tests/ui/drag-7-modal-hold.spec.ts` (C05, C06, C07, C08, C09, C14), `tests/ui/drag-7-overflow-row.spec.ts` (C10), `tests/ui/drag-5-stub-detach.spec.ts` (C03, beside its DRAG-1.14 test).
**New spec:** `tests/ui/drag-stub-row-height.spec.ts` (C13). DRAG-3.25 has no surface test, and it fits none of the three DRAG-7 specs.
**Helpers (edit):** `tests/helpers/overflowTree.ts` (the Given's tree without `X`; `Y` under `R1a`; tier reads), `tests/helpers/boardDragSurface.ts` (a helper that zooms a Free Card into a Card by the full hold, which C02, C05, C09 and C10 all need, and the 4b specs set up inline), `tests/helpers/boardLocators.ts` only if a locator is missing. `tests/helpers/dragGesture.ts` and `tests/helpers/requestHarness.ts` are used as they are.
**Not mine:** app source, Vitest suites, test routes, hooks and the catalog.
**Documents:** the Results and Review log in [the 4a to 4d log](story-10-batch-4a-4d-log.md), and this plan.

The new helpers are shared test infrastructure: each header says whether it reads the screen or an app attribute (`data-drop-tier` is an attribute the app provides), and they get `/code-review` at `medium` before the Stop 2 check-in.

**#10, the Sheet tests' own spec (decided here, as the batch asks):** not split. Moving DRAG-7.33, 7.34 and 7.35 (and 7.28's first test) to a new file would stale their `Automated` lines until the Reconciler rewrites them, at no gain to this batch's proof. Nathan approved the file list with no new Sheet spec in it.

## Representative observations to check before expanding a family

1. **The traces** (T1 to T8), before any authoring.
2. **Zoom a Free Card into `P` by the full hold, then open the modal by a hold** (C02a, C05, C09, C10d): that the helper reaches the Descendants layer with a Free Card, and what the carried copy and the ghost read there.
3. **Expanded-sub-row pops** (C02a, C02c, C02d, C03): the one-sample distance move and the sibling sub-row's lock, on one variant each.
4. **`data-drop-tier` on a hold-opened modal** (C14), with `Y` seeded: which values the rows carry, and that the static section rows carry none.
5. **Row heights** (C13): a typed Stub fixture (`seedItem`'s `type` option is unchecked), the pill by its type-name text, the title by its button, the carried copy's height with `paintedBoxOf`'s `layoutSize`, and `[data-carried-branch]` for the second line. If a locator can't be had from the screen, that's a hook for the Coder.
6. **The single-approach aim at `R`'s row** (C07b): where the ghost lands, read from what the modal draws.
7. **The long gestures** (C11, C04, C09): each reproduced once end to end.
8. **Leaving the Card's box with every pop off** (C06a): that the ghost holds its gap and `data-drag-modal-hold` clears.
9. **The cue locator.** The existing `cueOn` finds the cue by `[style*="cue-fill"]`, a style-string match. Check it still reads as the cue before more variants lean on it.

## Coder dependencies and defect handoffs

- **DRAG-7.10's clock test.** The Coder adds the two-excursion reset to `popSession.test.ts` (the Phase 2 approval for DRAG-7.10's clock test stands, and Nathan's 2026-11-11 answer, read as above, doesn't withdraw it). **Which ID it carries is open:** the desk finds the reset isn't in DRAG-7.10's Then, only in DRAG-1.30's. Planner question 1 below decides it. This is a separate Stop 3 session, after the Stop 2 check-in.
- **Hooks:** none known. C13 may need one (item 5 above). C14's `data-drop-tier` exists.
- **Defects:** DRAG-7.10's two failure modes go to the discovery handoff with the trace results. The cause isn't known, and the Coder isn't asked to fix anything before T4.
- **The Test Reviewer.** A Vitest change that changes an ID-bearing assertion or setup goes to the reviewer. The clock test would.

## Decisions (Nathan, 2026-11-11)

1. **File list for Stop 2:** approved as listed above. It takes effect when Nathan opens the Stop 2 session.
2. **DRAG-7.10's matrix:** the full 12 (arrival 3 × `K` 2 × threshold 2). The pairwise set of 7 is dropped.
3. **D2's scope:** D2's passes also apply to the DRAG-7.9 first-child test retitled for DRAG-7.28, so the repeated set is 61 variants. Nathan cut D2 from twenty repeats to ten later the same day, which makes it 610 passes, not 1,220. 4b's plan left its one unchanged test (DRAG-1.14) out of the repeat set because that test added no catalog case and no new coverage claim. This retitle does add a claim, DRAG-7.28's saved order, which is why it joins.
4. **The Planner's questions:** the QA Engineer takes the Planner's answers as they stand, unless the Planner wants input from the PO or Nathan. No Planner session has answered yet. Stop 2 goes ahead with each open clause left unasserted, and the answers are applied when they arrive.
5. **A trace that finds T5 to T8 still failing** returns to Nathan as an adjacent finding before anything is fixed.

## Questions routed

**For a Planner session (through the Open questions in the batch plan):** 1. DRAG-7.10 r6, and the ID the clock test carries. 2. DRAG-7.15 r6, the roadmap's second one-step aim, which contradicts the case. 3. DRAG-7.9 r2 and r3. 4. DRAG-7.14 r5. 5. DRAG-7.18 r1. 6. DRAG-7.27 r3. **For the PO:** none. The wiki states every outcome the desk found silent. Per decision 4, the Planner's answers are taken as they stand unless it raises the PO or Nathan itself.

## What this stop did not do

No Playwright test, repeat run, E2E run or reconciliation ran. No test, helper, app source, Vitest, catalog or wiki file changed. Nothing was committed. The catalog report ran once, read-only. The Test Reviewer wasn't spawned: there are no tests to review yet. The root gate was run before the check-in, and its result is in the batch plan's Results.

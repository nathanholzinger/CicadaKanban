# Story 10 batch 4d — proof and variant review

**Type:** Stop 1 deliverable (proof/variant plan) · **Written:** 2026-11-12 by the QA Engineer · **Status:** complete, with Nathan's rulings recorded below and the Planner's catalog pass of 2026-11-12 applied (DRAG-6.17 retired). Nothing is authored, no test has run, and no app, test, helper, Vitest, catalog or wiki file has been edited. Stop 2 starts when Nathan opens its session.

This is the Stop 1 deliverable under [the five stops](story-10-batches.md#the-five-stops-for-each-remaining-batch). It says what batch 4d must prove before any test is written, and what proves each clause. Every expected value below comes from the case's Then and the wiki rule it cites. The specs and helpers were read only for how to reach and observe a state. The desk's questions and replies, with its corrections, are in the [Review log](story-10-batches.md#batch-4d-stop-1--the-desks-questions-and-replies-2026-11-12), word for word.

## Inputs and scope

- **Baseline tree:** `13d925d5c10cf9f55fb91452f26d98f431f60563`, HEAD's tree at `4d89c152`. The working tree was clean at entry. A snapshot written by the testing guide's temporary-index method is `c2f800d90671623fa32c6119e0505468d950704e`; it differs from HEAD's tree by the two gitignored files HEAD tracks, as 4c's did.
- **Assigned cases (16):** [DRAG-6](../../test-plans/board-drag-interaction/drag-6-preview-reconciliation.md) 6.7, 6.8, 6.9, 6.15, 6.16, 6.18, 6.19, 6.20, 6.21, 6.22, 6.23, 6.24, 6.25, 6.26, 6.27 and 6.28. By kind: 11 New (6.7, 6.8, 6.9, 6.15, 6.16, 6.18, 6.21, 6.22, 6.25, 6.27, 6.28) and 5 Split (6.19, 6.20, 6.23, 6.24, 6.26). All 16 are `Open`. DRAG-6.17 was assigned when this plan was first written, and the Planner's catalog pass retired it on 2026-11-12. DRAG-6.30 and 6.31 stay `Manual`: the painted pulses, the banner's fade and the flash's colours are theirs.
- **Missing clauses:** the [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping rows for these cases, read against the current case text, which governs where it is more specific.
- **Catalog report** (`npm run report:catalog` on the baseline tree): 488 cases (389 Automated / 85 Open / 10 Manual / 2 Planned / 2 Pending PO); 121 test files declare 1,758 tests, 12 of them skipped. No lost coverage, no stale line. The counts were taken before the Planner's pass retired DRAG-6.17. Of the 16, DRAG-6.8, 6.21 and 6.28 have no test carrying their ID; the rest are carried only by Vitest tests, apart from DRAG-6.15's one surface test.
- **The batch's standing review entry** ([Open questions](story-10-batches.md#standing-entries)): the Test Reviewer assesses `tests/ui/drag-preview-reconciliation.spec.ts:61–88` (DRAG-6.5's response-order evidence) before this batch's freeze. It goes in the Stop 2 reviewer brief. It adds no case to the batch.
- **Nathan's ruling on the banner (2026-11-12):** for now the banner clauses are verified by the correct text being visible, and nothing more. Its look and placement (the top edge, the width) wait for the [UI message banners](../tech-debt-stories/ui-message-banners.md) story, which may set more rules. There is no status-region or focus assertion. The Planner's catalog pass the same day retired DRAG-6.17 and took the announcement clauses out of DRAG-6.22, 6.26 and 6.30, so no case needs aligning for the announcement. One clause is left: DRAG-6.16's Then still says the banner appears "along the window's top edge", which this ruling doesn't assert (Questions routed).
- **Nathan's ruling on the hidden places (2026-11-12):** an item "behind an overflow row" and one "in a closed hierarchy modal" are the same test case. One variant covers that place, reached by opening the modal from the overflow row; the collapsed section is the other. This answers the plan's Planner question 2.
- **Nathan's ruling on the stop matrix (2026-11-12):** all nine cause-and-context pairs run at the surface. The covering set of three and the three-plus-internal-tests option are not taken. This settles decision 1.
- **Nathan's ruling on the clocks (2026-11-12):** the clock-bound clauses use Playwright's clock. If the first representative check shows the paused clock breaks the drag, Stop 2 comes back to Nathan and doesn't fall back to real time by itself. This settles decision 2.
- **Nathan's ruling on DRAG-6.23's ghost test (2026-11-13):** the ghost test (D10's one variant) was red and is skipped, deferred to batch 4j as scope creep. The case closes `Open`, all of it 4j's.
- **Nathan's ruling on DRAG-6.24's drop-line test (2026-11-13):** the test (one of D11's four variants) passes and is skipped, deferred to batch 4j on its value against its cost. The other three D11 variants stay. The case closes `Open`.
- **Nathan's ruling on DRAG-6.7's discard clause (2026-11-13):** deferred to batch 4j as a catalogued example. No internal test is written, the case's two surface tests stay, and the case closes `Open`.
- **Nathan's ruling on DRAG-6.1 (2026-11-13):** its two gaps (the mid-list drop, the request's anchor) are closed by one test added to `client/src/components/workflow/itemWriteReconciliation.test.ts`, a sixth file he approved. The case isn't 4d's.
- **Nathan's ruling on the stop matrix and DRAG-6.22's endings (2026-11-13):** D04 runs five of its nine cells (Option C), a column under each cause and a Stub's section and the modal under the stale response. The other four are skipped and held for 4j's question. D09's released and cancelled endings stay (Option A), also a 4j question.
- **Nathan's ruling on DRAG-6.23's tiers (2026-11-12):** the three tier variants (`X` as a Full, Mid or Low row of another item's drag) are deferred to batch 4j. This batch keeps DRAG-6.23's pending-with-no-tier and ghost clauses, so DRAG-6.23 closes `Open` and is whole only when 4j's variants run. This settles decision 3.
- **Nathan's ruling on the Stop 2 file list (2026-11-12):** the five files in the implementation scope are approved. A locator may be added to `tests/helpers/boardLocators.ts` if the one needed isn't there. A change to any other file is reported, not made. This settles decision 4.
- **Rules in force from 4c:** a flaky test that predates the batch is skipped and moved to 4i; a failing test of the batch's own that is a false failure gets two fix attempts and then a report (D2, amended 2026-11-12). Stop 1 applies the weighing of a surface test for the first time.

## What already exists

- **Surface tests:** `tests/ui/drag-preview-reconciliation.spec.ts` (DRAG-6.1, 6.2, 6.5, 6.6); `drag-7-hierarchy-modal.spec.ts`'s "DRAG-7.23, DRAG-6.15" (a failed item move stops a modal drag); `board-read-order.spec.ts`'s BCU-1.10 (a held reload doesn't start the flash early). BCU-1.10 already drives the flash window with **Playwright's clock**: `page.clock.pauseAt`, then `runFor(STOP_FLASH_MS - 1)` and `runFor(1)`, with `STOP_FLASH_MS` imported from the client. It uses the dev panel's armed stop as its cause, which this batch's cases don't allow as a stand-in.
- **Helpers (Phase 3, D4):** `tests/helpers/forcedStopCause.ts::holdForcedStopCause(page, cause)` puts a live drag through each genuine resync (`failed-item-drop`, `stale-reindex`, `failed-column-reorder`) and is **used by no test yet**; `requestHarness.ts` (`holdNextWrite`, `holdNextRead`, `watchWrites`, `watchBoardLoads`, `settledWrites`, `delayMoveResponses`); `dragGesture.ts` (`boardReload`, `seedDragTuning`, `pickUp`, `cancel`); `overflowTree.ts` (the DRAG-7 trees); the column drag, written inline in `boards-layer.spec.ts` (`getByTitle('Drag to reorder')`).
- **Attributes the app provides** for reading these states: `data-forced-stop="<cause>"` on the banner (`ForcedStopCue.tsx`, which in the working tree after the Planner's pass draws only the banner while a stop is live, with no status region); `data-stop-flash` on a row (`dragChrome.tsx::useItemRow`, which Cards, section Stubs and modal rows all use); `data-pending`, `data-drop-tier`, `data-drop-state` on a row; `forcedStopCueMs` in the drag tuning. The flash window, `STOP_FLASH_MS` (1,400 ms), is a constant in the client, not a tuning value.
- **Vitest tests that carry these IDs** (`ForcedStopCue.test.tsx`, `useForcedStop.test.ts`, `useBoardDnd.test.ts`, `dragChrome.test.tsx`, `itemWriteReconciliation.test.ts`, `dragRequest.test.ts`) pin the hooks and pure modules. Nathan declined the Reconciler's proposed mappings for DRAG-6.26 (Phase 2 step 4), and each of the others is an existing pointer. None of them is read as covering a whole Then.

## Required proof by case

The desk's verdicts bound each row. A clause the desk found silent is **not asserted** and goes to the Planner (below). "Surface" is a Playwright test; every row's proof is by a surface gesture unless the third column says otherwise.

| Case | Kind | Missing proof to supply |
| --- | --- | --- |
| DRAG-6.7 | New | Two writes of one item, write 1's answer held and arriving after write 2's, with the server's real response to write 1 carrying reindex pairs: the page reloads the board once, and afterwards every reindexed item is shown in the server's order. With no pairs: the row is discarded and the board doesn't reload. |
| DRAG-6.8 | New | `X` dropped at `s1` with write 1 held, picked up again and (a) cancelled with Escape or (b) released where nothing is written (popped to Board, released nowhere): after it, `X` is pending at `s1`, not at its old slot. With write 1 already landed: `X` at its saved position, no marker. |
| DRAG-6.9 | New | `X` pending and re-dragged with the cursor still; write 1's answer released: once applied, the ghost is at the drag's current placement with no pointer movement, the marker clears, the drag goes on, and a release names the reconciled neighbours. |
| DRAG-6.15 | New | Each of the three resyncs, in each of a column/sub-row, a Card's descendants section and the hierarchy modal (nine pairs, the desk reads): the drag is over while "Loading board…" shows, no carried copy or ghost is left, `X` is where the server has it, nothing is written for `X`, and a later release sends no request. |
| DRAG-6.16 | New | The same nine runs: the banner's text is the cause's sentence (a failed drop or a failed column reorder: the write-failed one; a stale response: the refresh one), visible while "Loading board…" shows and on the reloaded board, cleared or replaced by neither transition, which is what the case's second paragraph now holds after DRAG-6.17's retirement. Its look and placement aren't asserted (Nathan's ruling), though the Then still says "along the window's top edge". |
| DRAG-6.18 | New | After the reload, a click on the banner and a click elsewhere leave it with the same text; the next drag's pickup removes it, in the fully visible part and in the fade. |
| DRAG-6.19 | Split | With `forcedStopCueMs` seeded as `T`: the banner is present until `T` has passed and absent after; a reload that takes part of `T` doesn't extend it; for the write-failed and the refresh explanation. |
| DRAG-6.20 | Split | After the reload `X`'s drawn row has `data-stop-flash` and no other row has it, for `X` a Free Card, a Stub in an expanded section and a modal row; the flash is at `X`'s reloaded place when the reload moved it; `Y` has none; neither item's saved placement changes. |
| DRAG-6.21 | New | `X` hidden after the reload (a collapsed section; behind an overflow row, which is the same place as a closed modal by Nathan's ruling): no row flashes, nothing opens or scrolls, the banner still explains. `X` is put there on the server while the drag is held. |
| DRAG-6.22 | New | No banner text and no flash for: an Escape cancel; a release that writes nothing (nowhere; a Stub at its own gap and depth); and each of a failed item drop, a failed column reorder and a stale response resyncing with no live drag. |
| DRAG-6.23 | Split | Pending `X` with no tier; pending `X` picked up again: its ghost is pending, with ghost state and no tier. **Deferred to 4j (Nathan):** another item's drag assigns `X` Full, Mid or Low, each from its own drag (the desk: a drag holds one tier), and `X` stays pending; the response then clears it and the tier still applies. |
| DRAG-6.24 | Split | `P` pending alone (`S` not, and `S` keeps its tier); `S` pending alone; both pending, one answer clearing one marker only; a drop line naming a pending row, beside a Mid Card and beside a Stub, has no pending state. |
| DRAG-6.25 | New | A column drag of `E` toward the first slot, stopped by each of the three resyncs: the board shows `A, C, E`; no reorder request, including on a later release; no item moved. |
| DRAG-6.26 | Split | The same three stops: the banner's text is the cause's sentence, the stopped column and every item have no flash state; a click leaves it, the next drag clears it, otherwise it expires at `T` from the stop and the reload doesn't extend it. |
| DRAG-6.27 | New | A reload longer than `F`: the stopped item's flash starts at the first draw, `t0`, and ends at `t0 + F` with the banner still up; a new drag or another reload before `t0 + F` ends it at that start; the other reload, with no stop behind it, draws none; ending the new drag or redrawing doesn't replay it. |
| DRAG-6.28 | New | `X` hidden at `t0`: opened at `t0 + d` (`0 < d < F`) it flashes for the rest, until `t0 + F`; opened at or after `t0 + F` it doesn't; no other item flashes and nothing opens by itself. For a collapsed section and for the modal reached from the overflow row. |

## What is not asserted, and where it goes

The desk's verdicts (Review log), applied. A clause the desk found silent isn't asserted until a Planner session answers.

| Desk row | What it left open | What Stop 2 does instead |
| --- | --- | --- |
| DRAG-6.17 r1 to r3; DRAG-6.22 r1 to r3's status part; DRAG-6.26 r2 | Whether a status live region's content stands for "assistive tech announces". | **Resolved by the Planner's pass (2026-11-12):** the wiki's screen-reading bullet is deleted, DRAG-6.17 is retired, and the announcement clauses are out of DRAG-6.22 and 6.26. Nothing is left open here. |
| DRAG-6.16's Then: "along the window's top edge" | Where the banner sits. Wiki §10 says it too. | Not asserted, by Nathan's ruling: the text only, until the UI message banners story. The case still says it, so the Test Reviewer may read the test as short of the Then (Questions routed). |
| DRAG-6.21 r5; DRAG-6.28 r5 | Whether "behind an overflow row" and "in a closed hierarchy modal" are two hidden places or one. §9 reads as one reached one way, but §9 isn't in the case's Rule field. | **Nathan's ruling:** one place. One variant for the place reached through the overflow row, with the modal as the way into view. |
| DRAG-6.15 r5 | The desk reads "ends at once" as the drag being over when "Loading board…" replaces the board, not as late as the redraw. | The test reads the drag as over while the reload is held. |
| DRAG-6.15 r6 | "This holds in" each context: the desk reads the nine cause and context pairs. | The matrix runs the nine, by Nathan's ruling (decision 1). |
| DRAG-6.23 r2 | One drag holds one tier for its whole length, so `X` can't go Full, then Mid, then Low in one drag. | Each tier is its own variant, and the three are deferred to 4j (Nathan). |
| DRAG-6.8 r5 | Where the ghost sits during the re-drag is DRAG-6.13's. | Not asserted here. |
| DRAG-6.16 r1 | The banner's full width isn't in the Then or the wiki (only "along the top edge"). | Neither the top edge nor the width is asserted, by Nathan's ruling: the text only. |
| DRAG-6.21 r4 | How `X` comes to lie in a hidden place isn't stated. | The Given moves `X` on the server while the drag is held. |

## Scenario matrix and estimate

Every row starts from fresh fixtures, asserts its Given before its When, takes expected sentences from the case (with its typographic apostrophe), and reads thresholds from `seedDragTuning`. No test asserts a duration: every clock boundary is driven by Playwright's clock, below. Counts are forecasts, not results.

| Row | Cases | Scenario and observable proof | Variants |
| --- | --- | --- | ---: |
| D01 | 6.7 | Two writes of one item on a scope whose positions are high enough that the first move reindexes (pins at 1,100 and above). The first answer is held, the second is let through, then the first is released. With pairs: one board reload, then board and server agree item by item. Without pairs (positions that don't reindex): no reload. | 2 |
| D02 | 6.8 | Ending (Escape; popped to Board and released nowhere) × write 1 (held; already landed). Pending `X` shown at `s1`, never at its old slot, or at its saved position with no marker. | 4 |
| D03 | 6.9 | `X` pending, re-dragged, cursor still; the held answer is released: ghost at the drag's placement without a pointer move, marker cleared, a release names the reconciled neighbours. | 1 |
| D04 | 6.15, 6.16, 6.20 | The stop run: cause (failed item drop, stale response, failed column reorder) × context (a Free Card in a column/sub-row, a Stub in `P`'s descendants section, a row in the open modal). The earlier write is held, `X` is picked up, the reload's read is held. While it is held: the drag is over, "Loading board…" shows, the banner's text is the cause's sentence. Released: the banner is still there; `X` is where the server has it; `X`'s row alone has `data-stop-flash`; `Y`'s has none; no write for `X`, none on a later release; saved placements unchanged. A recorder in the page shows the banner was added once and not removed. | 9 |
| D04b | 6.15, 6.20 | The same with `X` moved on the server while the drag is held: the flash is at `X`'s reloaded place. | 1 |
| D05 | 6.18 | After a stop and reload: clicks on the banner and the board leave it; the next pickup removes it, once in the visible part and once in the fade (clock advanced to the last quarter of `T`). | 2 |
| D06 | 6.19 | `T` seeded; the reload held while the clock advances part of `T`; present at `T - 1`, absent at `T`; for the write-failed and the refresh explanation. | 2 |
| D07 | 6.21, 6.28 | `X` hidden (collapsed section; behind the overflow row), the stop and reload: no flash, nothing opens or scrolls, banner up. Then the clock is advanced `d` and `X` is brought into view: it flashes until `t0 + F`, with the clock showing it on at `t0 + F - 1` and off at `t0 + F`. | 2 |
| D08 | 6.28 | The same two hidden places, brought into view at or after `t0 + F`: no flash, banner still up. | 2 |
| D09 | 6.22 | Escape cancel; release nowhere; a Stub released at its own gap and depth; and a failed item drop, a failed column reorder and a stale response resyncing with no live drag (the board is shown to have reloaded). A recorder shows no banner, no flash. | 6 |
| D10 | 6.23 | Pending `X` (answer held), with no tier. Ghost variant: pending `X` picked up again, its ghost has `data-pending` and ghost state, no tier. The three tier variants (another item's drag assigns `X` Full, Mid, Low; `X` has `data-pending` and its `data-drop-tier`; the held answer is released mid-drag and the marker clears with the tier kept) are deferred to 4j. | 1 |
| D11 | 6.24 | `P` pending alone; `S` alone; both, one answer released; a drop line naming a pending Mid Card and a pending Stub has no `data-pending`. | 4 |
| D12 | 6.25, 6.26 | Column `E` dragged toward the first slot, stopped by each of the three resyncs: order `A, C, E`, no reorder request including on a later release, no item moved, the cause's banner, no flash state anywhere. Then, for one cause: a click leaves the banner and the next drag clears it; and the banner expires at `T` from the stop without restarting. | 3 + 2 = 5 |
| D13 | 6.27 | (a) A reload held for longer than `F` with the clock advanced past `F` while it loads: the flash starts at the first draw, is on at `t0 + F - 1`, off at `t0 + F` with the banner up. (b) A new drag before `t0 + F` ends it at pickup, and ending that drag doesn't replay it. (c) Another reload (a refused drop with no live drag) before `t0 + F` ends it and draws none. | 3 |
| | | **Authored variants (9-pair matrix, DRAG-6.23's tiers deferred)** | **44** |

**Counts.** 16 catalog cases; 13 families; **44 runnable variants** with the nine-pair stop matrix (Nathan's ruling) and DRAG-6.23's three tier variants left to 4j, with the banner's text through the loading swap (DRAG-6.16's second paragraph, which DRAG-6.17 once held) carried by D04's and D12's runs, so it adds no variant. D2 repeats the whole added set at ten each: **440 passes**. DRAG-6.23 closes `Open` until 4j runs the tiers, so 15 of the 16 cases can close `Automated` here. Existing tests stay as they are; DRAG-6.5's test goes to the reviewer as a standing entry. One Free Card, one Card with Stubs and an overflow row and one two-column board with a pinned scope cover the fixtures.

## The clocks, and the weighing of the surface tests

The guide's signals ("When a surface test costs more than it proves") fire here on four things. Each answered with the three questions.

1. **The nine-pair stop matrix (D04).** It repeats one gesture across nine variants (signal: a matrix of variants).
   - *Which clause does each variant buy?* Each pair is a path the Then names: three causes reach the reload by different writes, three contexts tear the drag down differently. One run asserts DRAG-6.15, 6.16 and 6.20 together, so the gesture's cost is shared by those cases.
   - *Would a failure tell something a cheaper test wouldn't?* Yes for a pair-specific fault, such as the modal's teardown under a stale response. The existing Vitest tests pin each cause's path through `useBoardDnd` and the hook but don't run the three contexts' real drag layers.
   - *Is the precision in the Then?* Yes: the desk reads the nine pairs (r6). A covering set of three leaves six pairs unasserted, and the Test Reviewer would read that as a gap against the Then unless Nathan accepts the set.
   - **Options:** (a) the nine; (b) a covering set of three (each cause and each context once) with the other six pairs left unrun; (c) the three at the surface and the six pairs as internal tests in `useBoardDnd.test.ts`, which needs Nathan's approval, since the DRAG-6.26 mappings were declined and no variant-matrix category exists yet (the batches doc's D2 note and the plan's G2 wait for a Planner session). **Ruled by Nathan, 2026-11-12: (a).** The recommendation was the same: a stop run carries three cases at once, takes about six seconds with no real-time waits, and the nine total about a minute a pass. The saving of (b) is under 40 seconds a pass; what it gives up is a Then clause.
2. **The clock-bound clauses (DRAG-6.18's fade, 6.19, 6.27, 6.28, 6.26's expiry).** Waiting them out in real time would wait out clocks and need margins around `T` (seeded) and `F` (1,400 ms, fixed): signals "waits out more than two clocks" and "a very precise expectation".
   - *What does each wait buy?* The boundary: present at `T - 1`, gone at `T`; flash on at `t0 + F - 1`, off at `t0 + F`; not restarted by the reload.
   - *Would a failure tell something a cheaper test wouldn't?* The existing `useForcedStop` tests pin the hook's clock with fake timers, but not that the board reads the hook at draw, or that a row mounting late takes the window's remainder.
   - *Is the precision in the Then?* Yes, in `t0 + F`, `F - d` and "at expiry"; the case uses `T` and `F` as parameters.
   - **Options:** (a) Playwright's clock: `page.clock.pauseAt`, then `runFor` the exact amounts, which is what BCU-1.10 does for the flash today, with `STOP_FLASH_MS` imported and `forcedStopCueMs` seeded; (b) real time with margins around each boundary. **Ruled by Nathan, 2026-11-12: (a)**, after the representative check below shows dnd-kit's pickup works with the clock paused. If the check fails, Stop 2 comes back to Nathan and doesn't fall back to (b) by itself (Nathan, 2026-11-12). Fallback (b) takes margins no tighter than a quarter of the clock, and costs about 1.4 s and `T` of waiting per boundary variant (the check decides).
3. **DRAG-6.23's tiers (D10).** Each tier needs its own drag with `X` placed as the Full, Mid or Low row of another item's drag (signals: a complicated setup, a very precise action).
   - *Which clause does each variant buy?* That pending is independent of the tier, at each of the three tiers.
   - *Would a failure tell something cheaper tests wouldn't?* The existing `dragChrome.test.tsx` pins the classes a row chooses from its two states, not that a live drag assigns the tiers while a write is in flight.
   - *Is the precision in the Then?* Yes: "Full, Mid or Low" and ghost state.
   - **Options were:** keep the three at the surface; or hold one tier off if the setup needs a second correction (Weighing a Surface Test). **Ruled by Nathan, 2026-11-12:** the three tier variants are deferred to batch 4j. The ghost variant stays here.
4. **The announcement clauses.** Not a cost question, and no longer open: Nathan ruled that the banner's text visible is all that is verified, and the Planner's pass retired DRAG-6.17 and took the clauses out of DRAG-6.22, 6.26 and 6.30.

## Implementation scope for Stop 2 (approved by Nathan, 2026-11-12)

**Playwright specs (edit):** `tests/ui/drag-preview-reconciliation.spec.ts` (D01, D02, D03, D10, D11).
**New spec:** `tests/ui/drag-forced-stop.spec.ts` (D04 to D09, D12, D13), the surface spec D9 asks for with DRAG-6.22 and 6.25.
**Helpers:** `tests/helpers/forcedStopCause.ts` (edit: a stop run that composes the cause, the pickup in a context, the held reload and the trigger), a new `tests/helpers/stopRun.ts` (named `forcedStop.ts` when approved; the app has a `forcedStop.ts` of its own, which `check:docs` read as an ambiguous reference) (the page-side recorder of the banner and flash, and the clock steps for `T` and `F`), `tests/helpers/overflowTree.ts` (used as it is), `tests/helpers/boardLocators.ts` only if a locator is missing (the banner, "Loading board…", a column's drag handle). `tests/helpers/dragGesture.ts` and `requestHarness.ts` are used as they are.
**Not mine:** app source, Vitest suites, test routes, hooks and the catalog.
**Documents:** the Results and Review log in [story-10-batches.md](story-10-batches.md), and this plan.

The new helpers are shared test infrastructure: each header says whether it reads the screen or an app attribute (`data-forced-stop`, `data-stop-flash` and `data-pending` are what the app provides), and they get `/code-review` at `medium` before the Stop 2 check-in.

## Representative observations to check before expanding a family

1. **A real stale-reindex stop end to end** with `holdForcedStopCause('stale-reindex')`: that a pinned scope's first move answers with reindex pairs, that the second move supersedes it, and that the stop lands while `X` is held (D01, D04).
2. **A failed column reorder as the cause** of an item drag's stop, and of a column drag's (D04, D12): the column drag released, its request held then refused, the next pickup made while it is outstanding.
3. **The held board read.** "Loading board…" on screen with the banner over it, the drag already over, and the recorder showing the banner added once (D04).
4. **Playwright's clock with a live drag.** Pickup, pop and release with the clock paused (D05, D13): that dnd-kit and the pop machine behave, and the `runFor` boundaries land on the banner and the flash.
5. **A modal row's flash.** That the open modal is still open after the reload (DRAG-7.23) and `X`'s modal row carries `data-stop-flash` (D04).
6. **Hidden `X`** (D07, D08): moving `X` on the server while the drag is held, a section collapsed with the Card's control, `X` behind `R`'s overflow row.
7. **A pending `X` picked up again** (D10): its answer held, its ghost carrying `data-pending` and ghost state with no tier.
8. **Release nowhere with a write in flight** (D02): the pop to Board and a release that writes nothing, after a held drop.
9. **Two held writes for different items** (D11), `holdNextWrite` once for `P`'s move and once for `S`'s by URL.
10. **A click on the banner** (D05): the working tree's banner is `pointer-events-none`, so a locator click is expected not to reach it. Find how a test clicks where the banner is, through a helper, and that the banner stays.

## Coder dependencies and defect handoffs

- **Hooks:** none known. D9's note says the stale response "may need a test hook"; the pinned-scope arrangement in observation 1 is how the real server's response carries the pairs without one. If it doesn't, the hook is the Coder's (D12).
- **Defects:** none known. Any the runs find go through the Stop 2 handoff with failing clause, expected and observed results and a reproducer.

## Decisions for Nathan

1. **The stop matrix: ruled by Nathan, 2026-11-12.** All nine pairs, at the surface.
2. **The clocks: ruled by Nathan, 2026-11-12.** Playwright's clock. If the first representative check shows the paused clock breaks the drag, Stop 2 comes back to Nathan.
3. **DRAG-6.23's three tiers: ruled by Nathan, 2026-11-12.** Deferred to batch 4j.
4. **The Stop 2 file list: ruled by Nathan, 2026-11-12.** The five files are approved; a locator may be added to `boardLocators.ts`; any other file is reported, not changed.
5. **The announcement wording: resolved by the Planner's pass, 2026-11-12.** DRAG-6.17 is retired and the announcement clauses are out of DRAG-6.22, 6.26 and 6.30.

## Questions routed

**For a Planner session, if Nathan opens one:**
1. **Resolved by the Planner's pass (2026-11-12):** the announcement clauses are gone from the catalog and the wiki, and DRAG-6.17 is retired.
2. **Answered by Nathan's ruling:** one hidden place (DRAG-6.21 r5, DRAG-6.28 r5).
3. **DRAG-6.16's top-edge clause.** The Then says the banner appears "along the window's top edge", and wiki §10 says it too. Nathan ruled that placement isn't asserted until the UI message banners story. Either a Planner session moves the clause to that story's case, or Nathan accepts that the Test Reviewer may call DRAG-6.16's text-only test short of its Then and the Reconciler may hold the case `Open`. It doesn't block Stop 2.

**For the PO:** none.

## What this stop did not do

No Playwright test, repeat run, E2E run or reconciliation ran. No test, helper, app source, Vitest, catalog or wiki file changed. Nothing was committed. The catalog report ran once, read-only. The Test Reviewer wasn't spawned: there are no tests to review. The root gate was run before the check-in; its result is in the batch plan's Results.

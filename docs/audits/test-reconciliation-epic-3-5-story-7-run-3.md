# Test Reconciliation: Epic 3.5 Story 7 (run 3, writing, against the finished code)

**Scope:** the writing run at checklist step 5 (`.claude/guides/story-done-checklist.md`) for Epic 3.5 Story 7 (`docs/planning/epic-3-5-stories/story-7-depth-cap-and-hierarchy-modal.md`), on the clean tree at `b61ece1` (branch `claude/story-7-second-reconciliation`). It comes after the Coder's test follow-ups and the audit's Fix Now batches 1–7 (`31009c7` to `d4452ee`), and after the Test Planner's last pass. It covers:

- **the story's Scope:** DRAG-7.1–7.30, DRAG-1.34, TREE-3.11 and TREE-10.5–10.11;
- **the cases Phase 5 changed:** DRAG-2.1–2.4, DRAG-2.7, DRAG-2.10 and TREE-3.7, and TC-2.8, whose setup audit #8 changed;
- **the whole catalog,** under "On Every Run".

**What this run wrote in `docs/test-plans/`:** 18 cases `Open` → `Automated`, each in its status table row and its body, each with its Automation test line. Nothing else: no case text, no other status, no internal pointer.

- `board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md`: DRAG-7.2, 7.4, 7.6, 7.9, 7.11, 7.12, 7.14, 7.17, 7.19, 7.21, 7.22, 7.23, 7.24, 7.28, 7.30.
- `board-drag-interaction/drag-1-contexts-and-popping.md`: DRAG-1.34.
- `project-tree/tree-3-legal-parent-and-cap.md`: TREE-3.11.
- `project-tree/tree-10-which-workflow.md`: TREE-10.9.

**Inputs read:**

- the plan's Scope, its Amendments from "the proposing reconciliation's test follow-ups, first stop" on, its Open questions and its Living-docs handoff;
- run 2 (`docs/audits/test-reconciliation-epic-3-5-story-7-run-2.md`);
- the DRAG-7 suite, DRAG-1.34, the DRAG-2 suite, TREE-3.7, TREE-3.11, the TREE-10 suite and TC-2.8, as they read at `b61ece1`;
- every test in `tests/ui/drag-7-*.spec.ts`, `tests/ui/project-sidebar-resize.spec.ts`, `tests/ui/drag-target-classification.spec.ts`, `server/tests/routes/workflows.test.ts`, and TC-2.8's tests;
- the internal tests carrying scoped IDs (`descendantsProjection.test.ts`, `popSession.test.ts`, `modalPlacement.test.ts`, `dragStructure.test.ts`, `HierarchyModal.test.tsx`, `dragTuning.test.ts`), and the helpers the specs lean on (`overflowTree.ts`, `dragGesture.ts`, `boardLocators.ts`);
- an ID sweep of every test title in `tests/`, `server/tests/`, `client/src/` and `scripts/`, against all 396 status rows, and every Automation test line's file paths.

There was no shell, so no gate or test was run. The Coder's last results stand: `npm run check` passes (428 server, 565 client, 209 script tests, `check:docs` clean), and `npm run test:e2e` passes with 228 passed and 8 skipped.

## In brief

- **Written: 18 cases `Automated`.** Each rests on surface specs, except DRAG-7.14, which adds `popSession.test.ts`. That file's tests are in the approved drag-clock category, so they need no approval.
- **Still `Open` in Scope: 13.**
  - **DRAG-7.13 is routed to Story 10.** Its only miss is the first clause, the one Nathan deferred.
  - **The other 12 are unrouted:** DRAG-7.10, 7.15, 7.16, 7.25, 7.26, 7.27, 7.29, and TREE-10.5, 10.6, 10.7, 10.8, 10.10. The For sign-off list gives each one's way out.
- **Most of the 12 are a stamp or a small spec away:**
  - **TREE-10.5, 10.7 and 10.10** have whole route tests that carry no ID. A stamp makes each `Automated` on the next run.
  - **DRAG-7.16** waits only on Nathan approving `modalPlacement.test.ts` for the left edge, which no cursor can reach.
- **DRAG-7.15 reopened for a real reason.** Its new clause says the hold works whichever way the cursor came. Batch 7's guard specs reach the gap below the overflow row from above, but none reaches the gap above it from above. The batch 1 probe showed the defect at that gap too.
- **DRAG-7.26 is not counted as whole.** Its spec for "no attached descendants left" deletes all of `P`'s descendants. Code that closed the modal only once `P` had no descendants at all would still pass. The case describes descendants that remain but are detached.
- **The Phase 5 cases hold:**
  - DRAG-2.1, 2.2, 2.3, 2.7 and 2.10 are still whole.
  - DRAG-2.4 is still `Open`, outside Scope.
  - TREE-3.7 is still whole.
- **TC-2.8 holds,** on `items.hierarchy.test.ts` and `items.positioning.test.ts`. Audit #8 made the setup checked, and the done-anchor test now asserts the message and the unchanged row.
- **On every run:**
  - **Lost coverage: none.** All 293 cases that were `Automated` before this run still have a test title carrying their ID, after batch 5's E2E restructuring and batch 3's client changes. Every path on every Automation line still exists.
  - **Unknown IDs: none.**
  - **No `Manual` case is carried by a test,** and no test carries TREE-10.11 (`Planned`).
- **Fix Now guards:**
  - **No guard test passes with a defect present.**
  - **Two guards pass with or without their change, by design,** because the change is a refactor: #31's component test, and #30's cursor-x test.
  - **Three Fix Now changes have no guard:** batch 7's hook half, #75's key, and batch 2's refusal of `0` and `false`.
- **One run-2 item is retired:** DRAG-7.21's table row and body now both read `Open` (run 2's item S).

Aliases (line numbers at `b61ece1`):

| Alias | File |
|---|---|
| OR | `tests/ui/drag-7-overflow-row.spec.ts` |
| HM | `tests/ui/drag-7-hierarchy-modal.spec.ts` |
| MH | `tests/ui/drag-7-modal-hold.spec.ts` |
| PSR | `tests/ui/project-sidebar-resize.spec.ts` |
| TCS | `tests/ui/drag-target-classification.spec.ts` |
| WF | `server/tests/routes/workflows.test.ts` |
| DP | `client/src/components/workflow/descendantsProjection.test.ts` |
| PS | `client/src/components/workflow/popSession.test.ts` |
| MP | `client/src/components/workflow/modalPlacement.test.ts` |
| DS | `client/src/components/workflow/dragStructure.test.ts` |
| HMT | `client/src/components/HierarchyModal.test.tsx` |
| DT | `client/src/components/workflow/dragTuning.test.ts` |

**A reading this run applies throughout.** A sentence of a case that restates another case's rule, cites it, and adds no condition of its own belongs to the cited case. DRAG-7.8's Escape-during-a-drag sentence (DRAG-7.19) and DRAG-7.26's stays-open sentence (DRAG-7.23) are like that. A clause that applies another rule under this case's own condition belongs to this case, and a test carrying this case's ID must assert it. DRAG-7.10's "an item from outside `P` attaches as `P`'s last child", after leaving the modal, is like that, and so is DRAG-7.29's release from the gap below with the line on the overflow row. Run 2 applied the same reading without naming it.

---

## Coverage Mapping

### The scoped cases at a glance

| Case | P | Was | Now | On | Missing (if `Open`) |
|---|---|---|---|---|---|
| DRAG-7.1 | P1 | Automated | Automated | OR | — |
| DRAG-7.2 | P1 | Open | **Automated** | OR, HM | — |
| DRAG-7.3 | P0 | Automated | Automated | OR | — |
| DRAG-7.4 | P0 | Open | **Automated** | OR | — |
| DRAG-7.5 | P1 | Automated | Automated | OR | — |
| DRAG-7.6 | P1 | Open | **Automated** | HM | — |
| DRAG-7.7 | P1 | Automated | Automated | HM | — |
| DRAG-7.8 | P1 | Automated | Automated | HM | — |
| DRAG-7.9 | P0 | Open | **Automated** | HM | — |
| DRAG-7.10 | P1 | Open | Open | HM, MH | an item from outside `P` at the Card layer; "bounded by `P`'s box" |
| DRAG-7.11 | P1 | Open | **Automated** | HM | — |
| DRAG-7.12 | P2 | Open | **Automated** | MH, HM | — |
| DRAG-7.13 | P1 | Open | Open (routed) | MH | the first clause only: a Free Card from outside `P` (Story 10) |
| DRAG-7.14 | P1 | Open | **Automated** | MH, PS | — |
| DRAG-7.15 | P1 | Open | Open | MH | the gap above the overflow row, reached from the rows above |
| DRAG-7.16 | P1 | Open | Open | MH | the left edge (MP's geometry test, awaiting approval) |
| DRAG-7.17 | P2 | Open | **Automated** | MH | — |
| DRAG-7.18 | P2 | Automated | Automated | MH | — |
| DRAG-7.19 | P1 | Open | **Automated** | HM, MH | — |
| DRAG-7.20 | P2 | Manual | Manual (the Test Planner's) | — | left alone |
| DRAG-7.21 | P2 | Open | **Automated** | MH | — |
| DRAG-7.22 | P2 | Open | **Automated** | OR | — |
| DRAG-7.23 | P2 | Open | **Automated** | HM | — |
| DRAG-7.24 | P2 | Open | **Automated** | OR | — |
| DRAG-7.25 | P2 | Open | Open | MH | a click-opened modal staying centered across a reload |
| DRAG-7.26 | P2 | Open | Open | HM | `P` left with descendants, none of them attached |
| DRAG-7.27 | P2 | Open | Open | OR | the `L` = 2 instance: `R1`'s "1 child" overflow row after the move |
| DRAG-7.28 | P2 | Open | **Automated** | HM | — |
| DRAG-7.29 | P2 | Open | Open | OR | the gap below at `L + 1`, with the line on the overflow row |
| DRAG-7.30 | P2 | Open | **Automated** | OR | — |
| DRAG-1.34 | P1 | Open | **Automated** | OR, MH | — |
| TREE-3.11 | P2 | Open | **Automated** | PSR | — |
| TREE-10.5 | P1 | Open | Open | none carrying the ID (WF:240 whole) | the ID |
| TREE-10.6 | P1 | Open | Open | none carrying the ID (WF:260 partial) | the ID; `W1` unchanged; a rename not reaching `W1` |
| TREE-10.7 | P2 | Open | Open | none carrying the ID (WF:281 whole) | the ID |
| TREE-10.8 | P2 | Open | Open | none carrying the ID (WF:145, WF:154 partial) | the ID; nothing created, so a later bare create is accepted |
| TREE-10.9 | P2 | Open | **Automated** | WF | — |
| TREE-10.10 | P2 | Open | Open | none carrying the ID (WF:179, :219, :229 whole) | the ID |
| TREE-10.11 | P2 | Planned | Planned (not touched) | — | WF:193 and WF:207 would carry it once it's `Open` |

### Each written case against its _Then_

**DRAG-7.2 → Automated, on OR and HM.**

- OR:37, "DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children": "2 children", counting neither `R1a` nor `F`, and `T` with no overflow row.
- OR:64, "DRAG-7.1, DRAG-7.2: the levels count from the Card, and one hidden child reads "1 child"": the only-child count.
- OR:119 and OR:149 (DRAG-7.3 and DRAG-7.4 with DRAG-7.2): "3 children" from the release on, from both gaps.
- HM:552, "DRAG-7.2, DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card's last child, and the overflow row leaves it out of its count": "1 child" while `R1` is dragged in the section.
- HM:582, "DRAG-7.2: with R's only attached child dragged, back in the section R has no overflow row": the row is gone while `R1` is dragged, and back as "1 child" after the cancel.

**DRAG-7.4 → Automated, on OR.**

- OR:149, "DRAG-7.4, DRAG-7.2: below an overflow row, the item is the row's last child, and none lies right of the overflow row": the two states, the clamp at both ends, and the release as `R`'s attached last child after `R2`, reading "3 children".
- OR:182, "DRAG-7.4: tabbed left of the overflow row, the item is R's next sibling, after its hidden levels": `Q`'s attached child, between `R` and `T`.
- OR:257, "DRAG-7.4: with no row below the overflow row at its level, B is Bottom, and the states run from the first level to the hidden children's level": the states from level 1 to `L + 1`, with the clamp past it, and the release at level 2 as `A`'s child after `Q`.
  - `T` is moved under `B`, not removed, so the gap's Bottom is `B`. That is the case's Given.

**DRAG-7.6 → Automated, on HM.**

- HM:552 is the first Given. The ghost is at `7:0:true` with the cursor unmoved since the zoom, the overflow row reads "1 child", and the release commits `R1` as `P`'s attached last child, with `R1a` still its child.
- HM:344, "DRAG-7.6, DRAG-7.10, DRAG-7.11: resting outside the modal's box pops out of it…": the release at `P`'s Card layer. It now watches writes, so "nothing is written" is asserted. `R2`'s slot is hidden too.
- HM:606, "DRAG-7.6: back in the section, a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing": the second Given.

**DRAG-7.9 → Automated, on HM.**

- HM:204, "DRAG-7.9: a drag in the modal starts at the Descendants layer…": the start at Descendants, and `R1`'s first child before `R1a`. It reads `[isAttached, workphaseId]` as `[1, P's]`.
- HM:233, "DRAG-7.9: in the gap R2 sits in, one tab right of its own depth…": `R1`'s child after `R1a`, with the same read.
- HM:259, "DRAG-7.9, DRAG-7.19: set back down in its own gap and depth…": no writes, and `R2` unchanged.
- HM:287, "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…": the over-cap state reached, and no writes.
- Run 2's miss, the workphase and `isAttached`, is closed.

**DRAG-7.11 → Automated, on HM.**

- HM:432, "DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag":
  - one element carries the section's key, inside the modal, and each row is registered once, so the section's rows can't be Top or Bottom;
  - with the cursor resting behind the backdrop, the projection stays in `R2`'s own gap among the modal's rows;
  - the carried copy is measured with `paintedBoxOf` and held inside the list. That fixes audit #6, and the Coder showed it failing with the clamp removed.
- HM:344 now carries DRAG-7.11. The pop-out clock runs at a point inside `P`'s box and outside the modal's.
- Low, Test Quality Concerns item 3: HM:432 doesn't assert that its resting point lies inside `P`'s box.

**DRAG-7.12 → Automated, on MH (and HM).**

- MH:654, "DRAG-7.12: a modal a hold opens carries the drag's classification: a row too deep for the dragged item is de-emphasized, and R is not": the modal opens by a hold, during a drag of `X` with a chain of descendants. `R1a` reads `depth-capped` with an opacity below 1, and `R` and `R1` read `valid`, `R` at an opacity of 1.
- HM:287 adds the click-opened case.
- Low, Test Quality Concerns item 4: the opacity isn't compared with `overlayDepthCappedOpacity`.

**DRAG-7.14 → Automated, on MH and PS.**

- MH:162, "DRAG-7.14: the hold starts over when the ghost changes level or gap": a tab from `L + 1` to `L` ends the hold and the cue, tabbing back starts a fresh dwell, and another gap ends the hold.
- MH:197, "DRAG-7.14: the hold runs only with the cursor inside the section…": the third reset.
- MH:230, "DRAG-7.14: the carried copy moving within the gap, across the ghost's middle, does not reset the hold": rebuilt (run 2's item M). Each read is taken once, 100 ms after the move, with a dwell of 1.5 s, so a hold that started over would read `dwell`. The Coder showed it failing with a cue that restarts on every sample.
- PS:464, "DRAG-7.14: resets when the gap, the depth or the side changes, and the cue goes at once", and PS:475, "DRAG-7.14: the hold starts over after it ended, with a fresh dwell". They pin "the cue goes at once", which the specs' retrying waits can't.
- PS is in the approved category (a drag clock's logic, the threshold passed as a parameter), so it is on the Automation line without approval.

**DRAG-7.17 → Automated, on MH.**

- MH:587, "DRAG-7.17: when R's children run longer than the modal…": from the gap below, the list's `scrollTop` is above 0, the cursor is inside, the ghost is under it, and the release lands after `E19`.
- MH:619, "DRAG-7.17: from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too": the same from the gap above, with the release before `R1`.
- For the Test Planner, Test Quality Concerns item 5: MH:619 makes the list long with a sibling `S`'s children before `R`, not with `R`'s own children as the case's Given says. With `R`'s children long, a hold from the gap above crosses the bottom edge, which is DRAG-7.16's case (MH:493 shows exactly that).

**DRAG-7.19 → Automated, on HM and MH.**

- HM:476, "DRAG-7.19: after a release in the modal it stays open where it is, showing the item where it landed, marked pending until the response lands", which holds the response for 1.5 s:
  - `data-pending` is on, the box is unchanged, and `R2` sits under `R1` and before `R1a`, at `R1a`'s level;
  - the mark then clears with the box and the rows unchanged;
  - `R2` picks up again.
- HM:520: Escape mid-drag leaves the box, the rows and the item as they were, with nothing written, and a second Escape then closes the modal.
- HM:259: the modal is open with its box unchanged after a release that writes nothing.
- MH:259 now carries DRAG-7.19. A hold-opened modal is open after the release, in the box it opened in.
- The pending mark and the row order are asserted on a click-opened modal only. They don't depend on how the modal opened. What does depend on it, staying where it is, is asserted for both.

**DRAG-7.21 → Automated, on MH:729**, "DRAG-7.21: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits":

- `3:3:false` above the row, and `6:3:false` below it at `L + 1`, are each waited out past the whole hold (`outwait`). Then there's no hold and no modal, and a release writes nothing.
- The tab to `L`, `6:2:true`, is valid and waited out the same way, with no hold.
- Run 2's item R is closed. The Coder showed it failing with the validity check removed from the hold.

**DRAG-7.22 → Automated, on OR:292**, "DRAG-7.22: a press and drag from an overflow row's count starts no drag, and a click on it opens the modal, not the Card's Sheet":

- the click opens the modal, and the item panel stays `translate-x-full`;
- the press moved 100 px through `pickUp` and `hoverTo` gives no drag state and no carried copy, the section rows are unchanged, and nothing is written.
- Batch 5 moved it from HM to OR with its ID.

**DRAG-7.23 → Automated, on HM.**

- HM:662, "DRAG-7.23: after a release in the modal whose write failed, the reloaded board leaves it open, with the rows as the server has them": the board's GET is awaited, the modal is open, the rows are the server's, and `R2` is unmarked and still `R`'s.
- HM:686, "DRAG-7.23: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open": no drag state and no carried copy, the modal open with the server's rows, one write only (the first release's), and `R1a` unmoved.
- DRAG-7.26's sentence belongs to DRAG-7.26, and the centering to DRAG-7.25.

**DRAG-7.24 → Automated, on OR:325**, "DRAG-7.24: a press on an overflow row's indent is the Card's…":

- a click 6 px inside the row's left edge opens the item panel, and the modal stays shut;
- a press there carries an overlay whose `aria-label` is `P`.
- Low, Test Quality Concerns item 6: the panel's item isn't checked to be `P`.

**DRAG-7.28 → Automated, on HM:777**, "DRAG-7.28: a click on a row in the modal opens nothing": the click on `R1`'s title, then no panel, the modal's box unchanged, and nothing written.

**DRAG-7.30 → Automated, on OR:430**, "DRAG-7.30: a section shows at least one level": a tree built for `L` = 2, then `0` in the panel gives `A`, an overflow row reading "2 children", and `B`, with `R` and `T` undrawn.

**DRAG-1.34 → Automated, on OR and MH.**

- OR:90, "DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value, taken at once and kept across a reload": the field's default, the section redrawn at `L + 1` at once, and the redraw still in effect after a reload.
- OR:233, "DRAG-7.1, DRAG-1.34: the drop math takes the level count the section is drawn with".
- MH:781, "DRAG-1.34: the modal hold's dwell and cue are tuning-panel values, taken by the next hold and kept across a reload": both fields' defaults; the next hold still `dwell` past the default dwell; then, with a short dwell, the next hold still `cue` past the default cue, with no modal; both values back after a reload.
  - Run 2's miss, the cue, is closed.
  - Either check fails if the default is used: the modal would open and the hold would clear.
  - After the reload, the hold values are read off the panel and not off a hold. The board and the panel read one stored tuning, so this run counts it.
- DT:35 is internal and beside these. It isn't proposed.

**TREE-3.11 → Automated, on PSR:82**, "TREE-3.11: a deep project's name, cut short by a narrow sidebar, shows more as the sidebar is dragged wider":

- a chain to `PCAP`, with the deepest row at the `PCAP` indent;
- `clientWidth < scrollWidth` at the default width; wider, `clientWidth` grows; at the widest, `clientWidth >= scrollWidth`;
- the row is found by its full name (`projectName` matches whole) at each width;
- a project created under the deepest one is refused with a 400. The case cites TREE-3.5 for that, and `projects.test.ts` covers it at any width.

**TREE-10.9 → Automated, on WF:165**, "TREE-10.9: returns 400, and creates nothing, when %s is an empty string": for each field, a 400 naming the field, and the project's workflow list still empty afterward.

### The scoped cases still `Open`

**DRAG-7.10 → Open.**

- **Asserted:**
  - HM:344: a click-opened modal, left for `P`'s box: it closes, the drag is at the Card layer, and a release sets the Stub back down with nothing written.
  - MH:687, "DRAG-7.10, DRAG-7.18: after leaving a modal a hold opened…": the same pop out of a hold-opened modal.
  - HM:375: the second pop, out of `P`'s box, detaches `R2`, which is Free with its parent and workphase kept.
  - HM:630: the brief excursion, two stays outside each shorter than `popDelayMs` and longer together, leaves the drag in the modal. It would fail if the clock didn't start over.
  - HM:408: the header rest pops nothing.
- **Missing:**
  1. **"An item from outside `P` attaches as `P`'s last child"** at the Card layer, after leaving the modal. An item from outside can only reach the modal by a hold, after zooming into `P`'s section. That is the path batch 7 traced to the drag layer's defect, which Nathan deferred to Story 10. So this clause is blocked by the same defect as DRAG-7.13's first clause. It isn't routed by ID.
  2. **"Bounded by `P`'s box"** at the Card layer. The Coder found that the carried copy there is wider than `P`'s box. This bound is DRAG-1.28's rule, "The carried card is bounded by its context", which is `Open` and in the DRAG-1 range that Story 10's roadmap entry lists.
- PS:153 and DS:237, now retitled DRAG-7.10, test the modal's own box (the header inside it). HM:408 covers that at the surface, so neither is proposed.

**DRAG-7.13 → Open, routed.**

- **Asserted:**
  - MH:89: the dwell with no cue, the cue on `R`'s overflow row with no modal, then the modal, still at Descendants.
  - MH:119: a release during the cue commits `R`'s first child, and no modal opens.
  - MH:140: `B`, `P`'s own Stub, held below the row, opens the modal and commits `R`'s last child.
  - PS:452 and PS:480: the clock's stages, in the approved category.
- **The only miss is the first clause:** `X`, a Free Card zoomed in from outside `P`. Every stage spec drags a Stub of `P`.
- **So it stays `Open`, routed to Story 10** (Open questions, For Nathan, from the test follow-ups, answered 2026-10-28). The plan's "For the Architect" notes that Story 10's roadmap entry doesn't list DRAG-7.13 yet.
- This run reads "stays `Open` unless … that one clause is the only miss" as asking which kind of `Open` it is. The README doesn't allow `Automated` while a clause is unasserted, so DRAG-7.13 is a whole case routed by its one missing clause.

**DRAG-7.15 → Open.**

- **Asserted:**
  - MH:259, from the gap above the overflow row: `X` comes up from below it. The cursor is inside the modal, the ghost is painted between `R` and `R1`, the projection is `3:3:true` at Descendants, and the release commits `X` before `R1`.
  - MH:259, from the gap below: `B` comes up to it, and the release commits `B` after `R2`.
  - MH:327, "DRAG-7.15: held from above, down to the gap below R's overflow row…": `W` comes down to the gap below, and the release commits exactly what the modal paints, `R`'s last child after `R2`.
  - MH:353, "DRAG-7.15: the same hold for an item with a child of its own, whose subtree travels with it": the same, with `WC` still `W`'s.
  - The two `W` specs failed before batch 7's fix.
- **Missing: the gap above the overflow row reached from the rows above.** That is `W` held down to the gap between `R` and its overflow row, as `R`'s first child. The case says "the same holds whichever way the cursor came to the gap", and the batch 1 probe found the defect at that gap too ("above it, with a child under W, 3 and then 6"). No spec drives it, so a regression particular to that gap would pass.
- **To close it:** a third `W` spec, with `holdAt(page, w, p, () => topQuarter(overflowRow(page, r.id)), 0)` and `expectReleaseCommitsShown`, expecting `[r.id, null]`. The same spec with `WC` would cover the subtree there.
- DP:394's describe, "DRAG-7.15: the reading holds until the pointer moves", covers the mechanism without regard to the gap, at the projection (Proposed Internal Mappings, item 2).

**DRAG-7.16 → Open.**

- **Asserted:**
  - MH:493, the bottom edge: the margins; the cursor inside; the ghost under it; the projection moved off `3:3:true`; and `expectReleaseCommitsShown`, which awaits the move's response and holds the parent and both neighbors to what the modal paints. That fixes run 2's item C and audit #7, and the Coder showed it failing.
  - MH:530, the top edge: the dialog at the margin, the list scrolled, the cursor inside, the ghost under it, and the release committing what is shown.
  - MH:558, the right edge: inside the window, `6:4:true` deeper than the hold's spot, and the release under `R2`.
- **Missing: the left edge.** A cursor can't be brought near it, since the board starts right of the sidebar (Amendments, second stop). Only MP:27–32, the `it.each` "DRAG-7.16: is pulled inside the window at %s" with its "the left" row, covers it, internally (Proposed Internal Mappings, item 1). With Nathan's approval, the next run writes DRAG-7.16 `Automated` on MH and MP.

**DRAG-7.25 → Open.**

- **Asserted:**
  - MH:405, "DRAG-7.25: after a reload that follows a release in it, a modal a hold opened is centered".
  - MH:431, "DRAG-7.25: after a reload that lands mid-drag, a modal a hold opened is centered".
  - Each first asserts the modal at least 40 px off the window's middle, then within 2 px of it after the reload. Both failed before batch 1.
- **Missing: "A modal opened by a click stays centered across the reload."** HM:662 and HM:686 reload with a click-opened modal, but check only that it's open and its rows. HMT:121, "a click centers it the same way", is a mount and not a reload, and carries no ID.
- **To close it:** in HM:662, or HM:686, assert the modal centered after `reloaded` (MH's `expectCentered`), and stamp DRAG-7.25 on it.

**DRAG-7.26 → Open.**

- **Asserted:**
  - HM:732, "DRAG-7.26: the modal closes when the reloaded board no longer has its Card": `P` is deleted, and a refused release reloads the board. The modal closes, and `P` is gone.
  - HM:754, "DRAG-7.26: the modal closes when the reloaded board leaves its Card with no attached descendants": deletes `A`, `B` and `X`, and so every descendant of `P`. The modal closes, and `P`'s section has no rows.
- **Missing:** _"`P` still exists but none of its descendants is attached."_ HM:754's `P` has no descendants at all.
  - Code that closed the modal only when `P` had no descendants would pass it. The rule is about attached ones.
  - The Coder's mutation, the modal staying open with nothing to show, can't tell these apart.
  - **To close it:** detach `A`, `B` and `X` (`moveItem(…, { isAttached: false })`) instead of deleting them, and assert the modal closes and the section is empty, with `A`'s Card still on the board.
- The third sentence, the stays-open case, belongs to DRAG-7.23.

**DRAG-7.27 → Open.**

- **Asserted:** OR:359, "DRAG-7.27: a dragged R carries its overflow row, which is never a neighbor, and at the first level its children show":
  - the projection `2:L−1:true` at `R`'s own place, and `4:0:true` at `X`'s top, show the gaps counted without the overflow row;
  - the drop line is never on the overflow row at either point;
  - the release as `B`'s next sibling commits `R.parentId = P`, after `B`, with `R1` and `R2` still its children;
  - the section redraws with `R1`, `R1a` and `R2` showing and no overflow row.
- **Missing:** _"and `R1` has an overflow row reading "1 child" when `L` is 2."_ The spec runs at the default of 3 levels, where nothing is hidden after the move.
  - **To close it:** the same drag on the tree built for `L` = 2 (`sectionLevels: 2`, so `A` is `Q`), asserting `overflowRow(page, r1.id)` reads "1 child".
  - Or the Test Planner may rule that the clause instances DRAG-7.1's cut-off, and drop it.

**DRAG-7.29 → Open.**

- **Asserted:** OR:398, "DRAG-7.29: the side highlight can name an overflow row, and a release still places by gap and depth". In the gap above the row, sweeping across the ghost's middle, the line is drawn on the overflow row (`data-drop-side`, new in the second stop) at `3:3:true`. The release with the line there commits `R`'s first child.
- **Missing:** _"from the gap below it at level `L + 1`, `R`'s last child,"_ with the line on the overflow row. OR:149 releases there, but doesn't read where the line is.
  - **To close it:** the same sweep below the row at `6:3:true`, then a release committing after `R2`.

**TREE-10.5 → Open, whole once stamped.** WF:240, "clones phases from a template when templateId is given": the names in the template's order, `Review`'s `triggersNotification`, and every `isTerminal`. Low: the other phases' notification flags aren't read.

**TREE-10.6 → Open.**

- WF:260, "clones phases from an existing workflow when sourceWorkflowId is given": the names, both flags on every phase, and the board's columns.
- **Missing:** _"`W1` still has its workphases, unchanged"_, and _"when one of `W2`'s workphases is renamed, its counterpart in `W1` keeps its name."_

**TREE-10.7 → Open, whole once stamped.** WF:281, "creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given".

**TREE-10.8 → Open.**

- WF:145 and WF:154 ("returns 400 with a specific message when templateId / sourceWorkflowId does not reference an existing …"): the 400 and its message.
- **Missing:** _"no workflow is created: `P` still has none of its own, so a create for it that leaves both out is then accepted."_ WF:165's check (the project's list empty), or a bare create then returning 201, closes it.

**TREE-10.10 → Open, whole once stamped.**

- WF:179, "reads %s: null as none, making a workflow with no workphases", for each field.
- WF:219, "creates from the template when sourceWorkflowId is null".
- WF:229, "creates from the source workflow when templateId is null".

**TREE-10.11 → `Planned`, not touched.** WF:193, "returns 400, and creates nothing, when both templateId and sourceWorkflowId are named", and WF:207, "refuses a create that names both ahead of checking that either exists", are its tests. They carry no ID, which is right while the case is `Planned`. Against the case as written, WF:193 doesn't yet show that a later create naming `T` alone is accepted. The plan's "For the PO" has the marker still on, though batch 7 built the rule.

### The cases Phase 5 changed, and TC-2.8

- **DRAG-2.1, 2.2, 2.3, 2.7 and 2.10 hold,** on TCS:33, "DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified at pickup, stays classified while hovering, and clears on cancel". It is unchanged since run 2: `sectionLevels: cap`, the chain built from the board's cap, the states asserted, and `S` undrawn. DRAG-2.10 also rests on `server/tests/routes/boards.test.ts:104`.
- **DRAG-2.4 stays `Open`** (outside Scope), for run 2's reason: `NO_POP` means no popping and no entering or leaving contexts.
- **TREE-3.7 holds,** on `server/tests/routes/projects.test.ts:739` and `tests/ui/project-tree-sidebar.spec.ts:191`. Batch 5 touched `project-sidebar.spec.ts`, not this file.
- **TC-2.8 holds.**
  - `server/tests/routes/items.hierarchy.test.ts:580` ("TC-2.8: a done Free item cannot be an anchor, and the refused move writes nothing") is whole for the done anchor: the move names a workphase change, it gets a 400 with the message, and the row is unchanged.
  - `server/tests/routes/items.positioning.test.ts:435` covers the anchor that doesn't exist.
  - `items.positioning.test.ts:460` is now sound: `createItem` fails on a refused create (`fixtures.ts::created`), and the test asserts the message and the unchanged row.

---

## Lost Coverage

**None.**

- Every case that was `Automated` at `b61ece1`, 293 of them, has at least one test whose title, or whose `describe`, starts with its ID.
- I checked each one against the sweep, with special attention to the files batch 5 restructured (`project-sidebar.spec.ts`, `project-page.spec.ts`, `boards-layer.spec.ts`, `boards.spec.ts`, the DRAG-7 specs and helpers) and batch 3's client files (`dragTuning.test.ts`, `sidebarWidth.test.ts`, `dragStructure.test.ts`).
- None of the restructured E2E files held an ID except `boards-layer.spec.ts:341` (BCU-3.6), which is still there.
- Every file path on every Automation test line still exists and carries the case's ID.

## Unknown IDs

**None.**

- Every ID in a test title is a case in the catalog, and `check:docs` passes on `b61ece1`.
- The IDs in `scripts/check-docs/*.test.mts` are the checker's own fixtures, inside strings.

**A `Manual` case the Test Planner set, carried by a test:** none. No title carries DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25 or DRAG-7.20. MH's header comment names DRAG-7.20, which is fine.

**A `Planned` case carried by a test:** none. No title carries TREE-10.11 or ATT-1.10.

---

## Proposed Stamps

These are surface tests, so they need no approval. A developer adds the ID, and the next run maps it.

1. **TREE-10.5 on WF:240**, "clones phases from a template when templateId is given". Whole.
2. **TREE-10.7 on WF:281**, "creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given". Whole.
3. **TREE-10.10 on WF:179, WF:219 and WF:229.** Whole together.
4. **TREE-10.6 on WF:260,** once it also reads `W1`'s workphases after the copy and renames one of `W2`'s.
5. **TREE-10.8 on WF:145 and WF:154,** once each checks that nothing was created (the project's list empty, or a bare create then accepted).
6. **DRAG-7.25 on HM:662 (or HM:686),** once it asserts the click-opened modal centered after the reload.
7. **TREE-10.11 on WF:193 and WF:207,** only after the PO takes the marker off and the Test Planner makes the case `Open`. WF:193 then needs the follow-up create naming `T` alone.

## Proposed Internal Mappings (need approval)

1. **DRAG-7.16, the left edge ← MP:27–32**, "DRAG-7.16: is pulled inside the window at %s" (the "the left" row).
   - It covers the geometry: the dialog pulled inside at the margin, with the cursor still inside it. The surface specs cover the read afresh, which the left edge doesn't change.
   - **Recommended,** since no cursor can reach the left edge. With approval, DRAG-7.16 becomes `Automated` on MH and MP.
2. **DRAG-7.15, the gap above reached from above ← DP:394's describe**, "DRAG-7.15: the reading holds until the pointer moves" (with DP:377). It covers the held reading without regard to the gap, but not the modal's placement in that gap or what a release writes. **Not recommended:** one more `W` spec closes it at the surface.

**Dropped from run 2, now that surface specs cover them:**

- DRAG-7.4 ← DP:217: OR:257.
- DRAG-7.6 ← DP:317: HM:606.
- DRAG-7.2 ← ILO's only-child test: HM:582.
- DRAG-7.14 ← DP:246: MH:230 rebuilt.
- DRAG-7.16's top edge ← MP: MH:530.
- DRAG-7.17 ← MP:42: MH:619.
- DRAG-7.21 ← DP:269 and DP:246: MH:729.
- DRAG-7.27 ← DC:546: OR:359 covers "never a neighbor", and DRAG-7.27's remaining miss is unrelated.
- DRAG-7.29 ← DC:432: OR:398 covers the naming, and DC:432 doesn't reach the missing release from the gap below.
- DRAG-7.30 ← ILO: OR:430.

**Not proposed, beside whole surface tests:**

- HMT:102 and MP:67 (DRAG-7.25, the hold-opened centering);
- HMT:134 and the MP placement tests (DRAG-7.15);
- PS:153 and DS:237 (DRAG-7.10's box);
- DT:35 (DRAG-1.34);
- DP:269 (DRAG-7.21).

**Dropping existing pointers:** none. No scoped case had an internal pointer.

## Proposed Manual (need approval)

**None.**

- DRAG-7.16's left edge is better served by item 1 above than by `Manual`.
- DRAG-7.10's "bounded by `P`'s box" is DRAG-1.28's rule and assertable in principle (Gaps). It's for routing, not `Manual`.

---

## For sign-off

Every case in Scope still `Open` after this run. The checklist needs each one `Automated`, `Manual`, or routed by ID to a later story.

| Case | What's missing | Routed? |
|---|---|---|
| DRAG-7.13 | The first clause only: the hold by a Free Card zoomed in from outside `P`. | **Routed to Story 10** (Nathan, 2026-10-28). Story 10's roadmap entry should name DRAG-7.13 (For the Architect). |
| DRAG-7.10 | (1) An item from outside `P` attaching as `P`'s last child at the Card layer, after leaving the modal: blocked by the same drag-layer defect as DRAG-7.13's first clause. (2) "Bounded by `P`'s box" at the Card layer, which is DRAG-1.28's rule. | **Unrouted.** Both parts belong with Story 10's work (the defect, and DRAG-1.28 in the DRAG-1 range its entry lists). Recommend routing DRAG-7.10 there by ID beside DRAG-7.13. |
| DRAG-7.15 | The gap above the overflow row, reached from the rows above (`W` held down to it), alone and with `WC`. | **Unrouted.** One spec, in MH's `W` pattern. |
| DRAG-7.16 | The left edge. | **Unrouted.** Closed by Nathan approving MP:27–32 (Proposed Internal Mappings, item 1). |
| DRAG-7.25 | A click-opened modal staying centered across a reload. | **Unrouted.** One assertion in HM:662 or HM:686, and a stamp. |
| DRAG-7.26 | `P` left with descendants, none of them attached. | **Unrouted.** Detach instead of delete in HM:754's setup, or add a sibling spec. |
| DRAG-7.27 | The `L` = 2 instance: `R1`'s "1 child" overflow row after the move. | **Unrouted.** One spec on the `L` = 2 tree, or the Test Planner drops the clause. |
| DRAG-7.29 | The release from the gap below at `L + 1` with the line on the overflow row. | **Unrouted.** Extend OR:398 below the row. |
| TREE-10.5 | The ID on WF:240. | **Unrouted.** A stamp. |
| TREE-10.6 | The ID on WF:260; `W1` unchanged; a rename staying `W2`'s own. | **Unrouted.** Extend and stamp. |
| TREE-10.7 | The ID on WF:281. | **Unrouted.** A stamp. |
| TREE-10.8 | The IDs on WF:145 and WF:154; nothing created. | **Unrouted.** Extend and stamp. |
| TREE-10.10 | The ID on WF:179, :219 and :229. | **Unrouted.** A stamp. |

Not `Open`, and not for sign-off: DRAG-7.20 (`Manual`, the Test Planner's) and TREE-10.11 (`Planned`, its passage still marked).

---

## Gaps

**In Scope:** the For sign-off table. None looks hard to automate apart from DRAG-7.16's left edge (internal mapping) and the two Story 10 clauses (DRAG-7.13's first clause, and DRAG-7.10's item from outside), which the defect blocks rather than difficulty.

**Outside Scope:** the catalog's 63 other `Open` cases, the same 63 as run 2's, DRAG-2.4 among them. None changed.

---

## Duplication

Reported, not judged.

- **DRAG-7.2:** OR (four tests) and HM:552 and HM:582; ILO's `sectionEntries` tests (no IDs).
- **DRAG-7.3, 7.4, 7.5:** OR, and DP:183, :199, :217 and :236.
- **DRAG-7.6:** HM:344, :552 and :606; `placement.test.ts:258`; DP:289, :307 and :317.
- **DRAG-7.10:** HM:344, :375, :408 and :630, and MH:687; PS:153 and DS:237 (the modal's box).
- **DRAG-7.13, 7.14:** MH:89–257; PS:452, :464, :475, :480 and :486 (PS:486 carries no ID, and duplicates MH:197's reset); DP:246 and :269.
- **DRAG-7.15:** MH:259, :327 and :353; MP:20, :81, :87, :107 and :130; DP:377 and DP:394's describe; HMT:134.
- **DRAG-7.16:** MH:493, :530 and :558; MP:27–32 and :93.
- **DRAG-7.17:** MH:587 and :619; MP:42 and :50.
- **DRAG-7.19:** HM:259, :476 and :520, and MH:259.
- **DRAG-7.21:** MH:729 and DP:269.
- **DRAG-7.23, 7.25, 7.26:** one setup (`releaseRefusedMove`, the delayed refusal) across HM:662, :686, :732 and :754 and MH:405 and :431; DRAG-7.25 also on HMT:102 and MP:67.
- **DRAG-7.12:** MH:654 (hold-opened) and HM:287 (click-opened).
- **DRAG-1.34:** OR:90 and :233, MH:781, and DT:35.
- **TREE-10.10 and TREE-10.11** share WF:219 and WF:229's subject (a `null` field isn't named).
- **TC-2.8:** `items.positioning.test.ts:435` and `:460`, and `items.hierarchy.test.ts:580`.
- **BCU-1.6, TC-7.18 and TC-7.20:** `boards.test.ts:365` and `items.crossProject.test.ts:242` build one scenario. This is run 2's item E, unchanged.

---

## Test Quality Concerns

### The plan's question to the Reconciler

**"The outside-Free-Card clause is a known gap, not a lost test"** (Open questions, For Nathan, from the test follow-ups). Confirmed. No test ever carried that clause: DRAG-7.13's specs have always dragged a Stub of `P`, so nothing was lost. It is DRAG-7.13's only miss (Coverage Mapping).

The same deferral reaches one clause it doesn't name: DRAG-7.10's item from outside `P` at the Card layer. That item can only get into the modal through the same zoom into the section (For sign-off).

### Run 2's items, re-checked

- **A (PS:493, a layer change clearing the hold): closed.** PS:495, "a pop out of the section starts a fresh session, with no hold carried over", builds a running hold with an expired outside clock. The Coder showed it failing when a pop carries the hold over.
- **B (the client's cycle depth): closed.** `client/src/lib/hierarchy.test.ts:77`, "reads a parentId cycle once: the walk stops at a revisit", asserts the exact depths 2 and 3.
  - The same weakness remains on the server: WF:72, "returns a bounded depth instead of hanging when the data contains a parentId cycle", still asserts only `typeof … === 'number'`. It carries no ID. Low.
- **C and G (DRAG-7.16's bottom edge, audit #7): closed** by MH:493's `expectReleaseCommitsShown`.
- **D (the deep seed): closed** by batch 2: `server/tests/lib/deepSeed.test.ts:53` asserts Free positions across the workflow.
- **E: unchanged.** No status effect.
- **F (audit #6, DRAG-7.11): closed** by `paintedBoxOf`.
- **H (audit #8, TC-2.8): closed.**
- **M (MH:221, within the gap): closed** by MH:230's single reads.
- **R (DRAG-7.21's spec): closed** by MH:729's `outwait`.
- **S (DRAG-7.21's status written two ways): closed.** The row and the body both read `Open`, and now both read `Automated`.
- **N, O, P, Q, T:**
  - N, DRAG-7.12's de-emphasis: closed by MH:654's opacity.
  - O, DT:35 pinning the hold's defaults: unchanged, Low.
  - P, OR:37's levels checked by indent for two rows: unchanged, Low.
  - Q, the hand-rolled press: closed, now `pickUp`.
  - T, the Sheet left closed on a count click: closed by OR:292.

### Fix Now guard tests

**None passes with the defect it guards against.** Two pass with or without their change, by design, and three changes have no guard.

1. **HMT:134, "DRAG-7.15: rests the cursor on the row of the ghost's gap, past the rows that travel with it…",** is #31's guard (batch 1).
   - It passes before and after #31, since #31 swapped the modal's own traveling-rows check for `travelingRowsFor` with the same result. It does fail with "nothing travels" (the Coder's mutation), so it guards the behavior. It can't tell the refactor from no refactor.
   - The E2E guard batch 1 couldn't write is MH:353, from batch 7.
2. **MP:81, "DRAG-7.15: rests the cursor the inset past where a row at that depth is drawn",** is #30's guard (batch 3). It passed before, since the two formulas agreed. It fails if they drift (the Coder's mutation). Same kind as item 1.
3. **No guard: batch 7's hook half.** `useBoardDnd.ts::handleDragMove` stores no anchor while the reading is held. The Coder removed it, and every test passed: the pure layer carries the specs. The Coder offers to delete those three lines if they aren't worth keeping. That's a Coder or Architect call; as it stands, nothing guards them.
4. **No guard: #75's `key={hierarchyModalCard.id}`.** The audit finds it unreachable today, and batch 1 left it untested.
5. **No test: batch 2's refusal of `0` and `false`** for `templateId` and `sourceWorkflowId` ("refused too, where they read as none"). WF has no test for either. No case names them (Candidate New Cases).

### Concerns from this run

1. **DRAG-7.26's spec can pass on the wrong rule. Medium.** HM:754 empties `P` by deleting its descendants, so "no attached descendants" and "no descendants" can't be told apart (Coverage Mapping).
2. **DRAG-7.15's guard specs all hold at the gap below. Medium.** The gap above, reached from above, is untested, though the batch 1 probe saw the defect there (Coverage Mapping).
3. **HM:432 doesn't check that its resting point is inside `P`'s box. Low.**
   - It rests at `P`'s left edge + 6 px, at the height of `R2`'s row in the centered modal. Depending on the layout, that may lie below `P`'s Card.
   - The structural assertions (one element with the section's key, each row registered once) carry the "no section row is Top or Bottom" half regardless.
   - **The fix:** one assertion that the point lies inside `boxOf(article(page, 'P'))`.
4. **MH:654 reads an opacity below 1, not `overlayDepthCappedOpacity`. Low.** The case names the value. Reading `DEFAULT_DRAG_TUNING.overlayDepthCappedOpacity`, or a seeded one, and comparing would pin it. DRAG-2.6, the section's equivalent, is `Open`.
5. **DRAG-7.17's Given, for the Test Planner. Low.**
   - The case gives `R` many attached children "from either gap". From the gap above, `R`'s first child sits just under `R`, so the list needs no scroll to put it under the cursor. At the test window, the modal instead crosses the bottom edge, which is DRAG-7.16's case (MH:493 is exactly that tree).
   - MH:619 makes the list scroll from the gap above with a sibling's children before `R`. This run counts that as the rule, the list scrolled to put the spot under the cursor and the release committing `R`'s first child.
   - The Test Planner may want the Given to say "the rows before the spot run longer than the modal".
6. **OR:325 doesn't check whose Sheet opens. Low.** It checks that the item panel opens (`translate-x-0`), not that it is `P`'s. The click lands inside `P`'s article, so another item's Sheet is implausible. Reading the panel's title field would pin it.
7. **HM:662's reloaded rows equal the rows before the drag. Low.** A client that put the optimistic placement back without using the reloaded hierarchy would show the same rows. It awaits the board's GET, which makes that unlikely. Changing a row on the server before the refused release would pin "as the reloaded board has them".
8. **WF:240 reads `triggersNotification` on `Review` only. Low.** That's for TREE-10.5's stamp.

No mapped test was found tautological.

---

## Uncatalogued Tests

In the story's new and changed test files only.

**Gate and support, with no standalone rule:**

- **HMT:**
  - :121, "a click centers it the same way" (a mount; DRAG-7.25's click half needs a reload, see Coverage Mapping);
  - :148, "centers it, says so and reports nothing when %s" (#36's fallback, an implementation guard with no wiki rule).
- **MP:** :56, :71, :115, :120, :142 and :155, unchanged from run 2 apart from `centerModal`'s margin case at :71.
- **DP:**
  - :58, :96, :277, :323, :329, :338 and :387;
  - :431, `sameProjection`;
  - batch 7's tests sit under the DRAG-7.15 describe at :394, so they carry the ID.
- **PS:** :486, the hold ending outside the section (DRAG-7.14's third reset, approved category; MH:197 covers it at the surface, so a stamp is optional); :495 (see run 2's item A).
- **ILO:** the `EVERY_LEVEL` tests (batch 1), and run 2's `sectionEntries` and `overflowRowId` tests.
- **`client/src/lib/browserStorage.test.ts`, `client/src/test/storageFixtures.ts`, and DT's two refusal cases** (batch 3, #28). Storage that refuses or throws never reaches a handler. No case says so, and the wiki's persistence rule (DRAG-1.31) doesn't cover a refusal.
- **`client/src/components/sidebar/sidebarWidth.test.ts` and `useSidebarResize.test.ts`,** and PSR's five untitled tests. The width is a working placeholder (D2).
- **`server/tests/lib/deepSeed.test.ts`,** all of it: dev tooling.
- **WF:72,** the cycle-depth test (concern under run 2's item B).
- **`scripts/audit-scope/` and `scripts/check-docs/` tests** (batch 6): tooling.

**Waiting on stamps, not uncatalogued:** WF:145, :154, :179, :219, :229, :240, :260 and :281 (TREE-10.5–10.8 and TREE-10.10), and WF:193 and :207 (TREE-10.11, `Planned`).

## Candidate New Cases

1. **The level count read as a whole number** (run 2's item 2; ILO's "holds the tuning value to a whole number of at least 1", `shownLevels(3.9)` is 3). **Still a candidate, a PO gap:** wiki board-drag-interaction §9 says only "at least 1".
2. **A workflow create naming `templateId: ""` or `sourceWorkflowId: ""`** (run 2's item 4). **Closed:** TREE-10.9, now `Automated`.
3. **An item's agent that names no row is refused** (from `docs/archive/test-reconciliation-a6-last-round.md`, Candidate New Cases, item 1). **Still open, a Test Planner gap.**
4. **New, with no test yet: `0` or `false` as `templateId` or `sourceWorkflowId` is refused.** Batch 2 built it, as the Amendments say, but no test exercises it. Wiki row-references §2 leaves a non-string value to the field's page, and project-tree §10 names only `null`. So whether `0` and `false` are refusals or "none" is a **PO gap**, and a test should follow either way.

No other candidate. Every rule wiki §7.3, §9 and project-tree §10 state has a case.

---

## Totals

**Status changes in this run:** 18, `Open` → `Automated`. No case went back to `Open`.

- P0: DRAG-7.4, 7.9.
- P1: DRAG-1.34, 7.2, 7.6, 7.11, 7.14, 7.19.
- P2: DRAG-7.12, 7.17, 7.21, 7.22, 7.23, 7.24, 7.28, 7.30, TREE-3.11, TREE-10.9.

**The whole catalog: 396 cases.** That is run 2's 389, plus TREE-10.5–10.11.

The Test Planner made three status changes since run 2: DRAG-7.15 `Automated` → `Open` (revised), DRAG-7.25 `Planned` → `Open`, and the new TREE-10.5–10.10 `Open` with TREE-10.11 `Planned`. Those took the catalog to 293 `Automated` and 94 `Open` before this run.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 115 | 136 | 60 | 311 |
| Open | 21 | 37 | 18 | 76 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 2 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| **Total** | **136** | **175** | **85** | **396** |

**By folder:**

| Folder | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2) | Other |
|---|---|---|---|---|
| board-drag-interaction | 145 | 73 (32/30/11) | 67 (20/34/13) | 5 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25, 7.20; 0/2/3) |
| item-positioning | 80 | 77 (43/29/5) | 2 (0/1/1): TC-6.11, TC-5.15 | 1 `Pending PO` (TC-6.13) |
| item-attachment | 75 | 72 (30/26/16) | 1 (1/0/0): ATT-4.9 | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11) |
| project-tree | 62 | 55 (7/30/18) | 6 (0/2/4): TREE-1.13, TREE-10.5, 10.6, 10.7, 10.8, 10.10 | 1 `Planned` (TREE-10.11) |
| boards-columns-unsorted | 34 | 34 (3/21/10) | 0 | — |
| item-sheet | 0 | — | — | `INDEX.md` only |

**The story's Scope (39 cases):**

- 24 `Automated`.
- 13 `Open`: DRAG-7.10, 7.13 (routed), 7.15, 7.16, 7.25, 7.26, 7.27, 7.29, TREE-10.5, 10.6, 10.7, 10.8, 10.10.
- 1 `Manual`: DRAG-7.20.
- 1 `Planned`: TREE-10.11.

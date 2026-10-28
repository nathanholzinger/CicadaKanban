# Test Reconciliation: Epic 3.5 Story 7 (proposing run)

**Scope:** a proposing run for Epic 3.5 Story 7 (`docs/planning/epic-3-5-stories/story-7-depth-cap-and-hierarchy-modal.md`), on the clean tree at `c6b6896` (branch `claude/fervent-archimedes-gsiiqg`). It runs after the story's audit (`docs/audits/code-quality-audit-epic-3-5-story-7.md`) and before that audit's Fix Now batches, so that missing or weak tests can be written or fixed first and then guard the fixes. The confirming run comes at checklist step 5. It covers:

- **the story's Scope:** DRAG-7.1–7.23 and DRAG-1.34;
- **the cases whose tests Phase 5 changed:** DRAG-2.1–2.4, DRAG-2.7, DRAG-2.10 and TREE-3.7;
- **the Scope's check:** DRAG-4's tree and DRAG-5.13's specs at the default level count;
- **the specs that assert DRAG-7.21's and DRAG-7.22's leans;**
- **the whole catalog,** under "On Every Run";
- **the audit's questions to the Reconciler,** and the extra section Nathan asked for: regression guards for the audit's Fix Now.

**Nothing in `docs/test-plans/` was written.** This is a proposing run. The PO's wiki pass (checklist step 2) hasn't happened either: wiki board-drag-interaction §3.1, §7, §7.1, §7.3 and §9, and item-attachment §12, still mark as `**Planned:**` the passages the handoff lists as built. So DRAG-7.1–7.20 and DRAG-1.34 still read `Planned`, and DRAG-7.21–7.23 `Pending PO`. For each one, this report says what it **would** be once the Test Planner makes it `Open`. It reads the rule from the Planned passage, and what was built from the plan's Amendments and "Living-docs handoff".

**Inputs read:**

- the story plan (Scope, Decisions, Amendments, Open questions and Living-docs handoff), and the audit report (Fix Now, Watch List and "For other roles");
- wiki board-drag-interaction §3.1, §7, §7.1, §7.2, §7.3, §8 and §9;
- the DRAG-7 suite, and DRAG-1.34, DRAG-2, DRAG-4's preamble, DRAG-5.13, TREE-3.7, BCU-1.6, TC-2.8, TC-7.18 and TC-7.20;
- the drag layer's `CLAUDE.md`, and `tests/helpers/overflowTree.ts` and `dragGesture.ts`;
- every test carrying a DRAG-7 or DRAG-1.34 ID, the tests the audit questions, and the Phase 5 specs;
- an ID sweep of every test title in `tests/`, `server/tests/`, `client/src/` and `scripts/`, against the catalog's status tables.

This run had no shell, so no gate or test was run. The Coder's results stand: `npm run check` passes (420 server, 543 client, 185 script), and `npm run test:e2e` passes at a cap of 12 (207 passed, 8 skipped).

**In brief:**

- **If the Test Planner made them `Open` today, 7 of the 20 `Planned` DRAG-7 cases would be `Automated`:** DRAG-7.1, 7.3, 7.5, 7.7, 7.8, 7.15 and 7.18, each on surface specs alone. DRAG-7.20 is the Test Planner's `Manual`. The other 12 DRAG-7 cases, and DRAG-1.34, would stay `Open`. Each one's missing part is named below, and most are one assertion or one spec away.
- **The weakest cases are DRAG-7.10, 7.11, 7.16 and 7.19.** DRAG-7.11's only check on the carried copy can't fail (audit #6), and nothing asserts that the ghost stays put. DRAG-7.16's bottom-edge spec can pass on a wrong write (audit #7, and the audit's question on `moved`). DRAG-7.19 never checks the pending mark, or a hold-opened modal staying where it is, which is exactly where audit #2's defect lives.
- **One question cuts across the suite: which `X`.** The cases drag `X` as a Free Card from outside `P`, zoomed in. Every spec drags a Stub of `P`. This report accepts that for the placement cases. It doesn't for DRAG-7.13, whose own text names both origins (Test Quality Concerns, item K).
- **The Phase 5 cases hold.** DRAG-2.1, 2.2, 2.3, 2.7 and 2.10 are still whole. DRAG-2.4 is `Open`, as before. TREE-3.7 is still whole. DRAG-4's tree and DRAG-5.13's are still asserted whole at three levels, but `drag-5-stub-detach.spec.ts` leans on the default rather than seeding it.
- **Lost coverage: none. Unknown IDs: none. No `Manual` case is carried by a test.** One `Pending PO` case, DRAG-7.21, is already carried by a unit test's title.
- **The audit's questions:** all of them are confirmed (Test Quality Concerns, items A–J). Of the five Fix Now findings it lists, only #6 and #7 bear on a status, and neither fix alone makes its case whole.
- **Regression guards:** six Fix Now findings change app code (#1, #2, #3, #28, #30, #31). #2's failure paths and #31's dragged-subtree path have no test today.

Aliases used below (line numbers are the files' at `c6b6896`):

| Alias     | File                                                           |
| --------- | -------------------------------------------------------------- |
| OR        | `tests/ui/drag-7-overflow-row.spec.ts`                         |
| HM        | `tests/ui/drag-7-hierarchy-modal.spec.ts`                      |
| MH        | `tests/ui/drag-7-modal-hold.spec.ts`                           |
| TCS       | `tests/ui/drag-target-classification.spec.ts`                  |
| SD        | `tests/ui/drag-5-stub-detach.spec.ts`                          |
| PTS       | `tests/ui/project-tree-sidebar.spec.ts`                        |
| DP        | `client/src/components/workflow/descendantsProjection.test.ts` |
| PS        | `client/src/components/workflow/popSession.test.ts`            |
| MP        | `client/src/components/workflow/modalPlacement.test.ts`        |
| DS        | `client/src/components/workflow/dragStructure.test.ts`         |
| PL        | `client/src/components/workflow/placement.test.ts`             |
| ILO       | `client/src/components/workflow/itemListOps.test.ts`           |
| DT        | `client/src/components/workflow/dragTuning.test.ts`            |
| DC        | `client/src/components/workflow/dragCollision.test.ts`         |
| hier      | `client/src/lib/hierarchy.test.ts`                             |
| boards    | `server/tests/routes/boards.test.ts`                           |
| CP        | `server/tests/routes/items.crossProject.test.ts`               |
| PO        | `server/tests/routes/items.positioning.test.ts`                |
| H         | `server/tests/routes/items.hierarchy.test.ts`                  |
| projects  | `server/tests/routes/projects.test.ts`                         |
| workflows | `server/tests/routes/workflows.test.ts`                        |
| deep      | `server/tests/lib/deepSeed.test.ts`                            |

---

## Coverage Mapping

### What each scoped case would be once `Open`

"Surface" means a Playwright spec or a route test. Internal tests are named only where they bear on the status.

| Case      | P   | Now        | Would be                      | On             | Missing (if `Open`)                                                                                                     |
| --------- | --- | ---------- | ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| DRAG-7.1  | P1  | Planned    | **Automated**                 | OR             | — (a low note below)                                                                                                    |
| DRAG-7.2  | P1  | Planned    | Open                          | OR             | the dragged-child clauses, on a test carrying the ID                                                                    |
| DRAG-7.3  | P0  | Planned    | **Automated**                 | OR             | —                                                                                                                       |
| DRAG-7.4  | P0  | Planned    | Open                          | OR             | the "`T` isn't there, `B` is Bottom" Given                                                                              |
| DRAG-7.5  | P1  | Planned    | **Automated**                 | OR             | —                                                                                                                       |
| DRAG-7.6  | P1  | Planned    | Open                          | HM             | the release at `P`'s Card layer; the second Given (`R`)                                                                 |
| DRAG-7.7  | P1  | Planned    | **Automated**                 | HM             | —                                                                                                                       |
| DRAG-7.8  | P1  | Planned    | **Automated**                 | HM             | —                                                                                                                       |
| DRAG-7.9  | P0  | Planned    | Open (narrow)                 | HM             | `R2`'s workphase after a release                                                                                        |
| DRAG-7.10 | P1  | Planned    | Open                          | HM             | the brief excursion; the Card layer's no-write; an item from outside; the hold-opened variant on a test carrying the ID |
| DRAG-7.11 | P1  | Planned    | Open                          | HM             | the ghost staying out of the section; the carried copy (audit #6); the pop-out clock                                    |
| DRAG-7.12 | P2  | Planned    | Open                          | HM             | a modal opened _during_ the drag; the de-emphasis                                                                       |
| DRAG-7.13 | P1  | Planned    | Open                          | MH             | an item from outside `P` opening the modal                                                                              |
| DRAG-7.14 | P1  | Planned    | Open                          | MH, PS         | "runs on within the gap", which no counted test can fail                                                                |
| DRAG-7.15 | P1  | Planned    | **Automated**                 | MH             | —                                                                                                                       |
| DRAG-7.16 | P1  | Planned    | Open                          | MH             | the bottom edge's committed placement; the top and left edges                                                           |
| DRAG-7.17 | P2  | Planned    | Open                          | MH             | the gap above the overflow row                                                                                          |
| DRAG-7.18 | P2  | Planned    | **Automated**                 | MH             | —                                                                                                                       |
| DRAG-7.19 | P1  | Planned    | Open                          | HM             | the pending mark; a hold-opened modal staying in place; a release writing nothing                                       |
| DRAG-7.20 | P2  | Planned    | `Manual` (the Test Planner's) | —              | nothing to map                                                                                                          |
| DRAG-7.21 | P2  | Pending PO | waits on the PO               | MH:448, DP:265 | see "The Pending PO cases"                                                                                              |
| DRAG-7.22 | P2  | Pending PO | waits on the PO               | HM:523         | see "The Pending PO cases"                                                                                              |
| DRAG-7.23 | P2  | Pending PO | waits on the PO               | none           | see "The Pending PO cases"                                                                                              |
| DRAG-1.34 | P1  | Planned    | Open                          | OR, MH         | the next hold taking a changed cue                                                                                      |

### Each case against its _Then_

**DRAG-7.1 → Automated on OR.**

- OR:23, "DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children":
  - the section's rows in order, `A`, `Q`, `R`, `R`'s overflow row, `T`, `B` (and `X`);
  - `R1`, `R2` and `R1a` not drawn;
  - the overflow row at level `L + 1`, and `R` at `L`, by their indents.
- OR:50, "DRAG-7.1, DRAG-7.2: the levels count from the Card…": `P` is a Free child at depth 2, and `R1` is still hidden one level under `R`. That shows the levels counting from the Card.
- OR:76, "DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value…": raising `L` by one shows `R1` and `R2`, puts an overflow row under `R1`, and leaves `R` with none.
- Low note: "each at its level" is checked by indent only for `R` and the overflow row. `A`, `Q`, `T` and `B` are checked by order. The levels of those rows are the section's drawing (DRAG-4), not the cut-off, so this doesn't hold the case back.

**DRAG-7.2 → Open.**

- **Asserted:** "2 children", which doesn't count `R1a` or `F`, and `T` with no overflow row (OR:23); "1 child" for an only child (OR:50); "3 children" after a drop beside the row (OR:113, OR:143).
- **Missing:**
  1. _While `R1` is dragged, the row reads "1 child"._ HM:482 (DRAG-7.6) asserts exactly this, but carries only DRAG-7.6 (Proposed Stamps, item 1).
  2. _With `R1` as `R`'s only attached child, `R` has no overflow row while it's dragged._ Only ILO:309, "leaves the dragged item out of the count, and draws none when it was the only child", asserts it, with no ID, and internal. No spec reaches it. A variant of HM:482 on a tree with `R2` removed would close it at the surface (Proposed Internal Mappings, item 3, is the alternative).

**DRAG-7.3 → Automated on OR:113**, "DRAG-7.3, DRAG-7.2: between a row and its overflow row, the one state is the row's first child":

- tabbed 0, +5 and −5, the projection stays `3:L:true`, so there's one state at level `L + 1`;
- the release commits `R`'s child, attached, before `R1`;
- `X` isn't drawn, and the row reads "3 children".

The slide of the overflow row below the ghost is shown by the gap index. DP:179 asserts the same at the projection, from either neighbor (Duplication).

**DRAG-7.4 → Open.**

- **Asserted:**
  - OR:143: level `L + 1` gives `R`'s last child after `R2` and "3 children"; `L + 6` clamps to it; tabbing left stops at `T`'s level.
  - OR:176: level `L` gives `Q`'s child between `R` and `T`.
- **Missing:** _"Given instead `T` isn't there, so `B` is Bottom, then the states run from level 1 to level `L + 1`"_. No spec drives it. DP:213, "DRAG-7.4: with no row below it, the states run from the top level to R's last child, and no further", asserts it at the projection, which is internal (Proposed Internal Mappings, item 1). A spec on a tree with no `T`, tabbed to 0 and to `L + 6`, would close it at the surface.

**DRAG-7.5 → Automated on OR:200**, "DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only attached child": `L + 6` clamps to `L + 1`; the release makes `X` `T`'s attached child; `G` is still `T`'s Free child; `X` isn't drawn; and `T`'s new overflow row reads "1 child". The gap's shallow end, level 1, isn't driven. The case cites it to DRAG-4.8, which owns it.

**DRAG-7.6 → Open.** HM:482, "DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card's last child", asserts the main path:

- the modal is open by a click, and `R1` is pulled out to `P`'s Card layer, which closes the modal;
- zoomed back in, the projection is `7:0:true`, the last gap at level 1, and the row reads "1 child";
- the release commits `R1` as `P`'s attached last child, with `R1a` still its child.

**Missing:**

1. _"Released at `P`'s Card layer instead, before zooming back in, `R1` is set back down, and nothing is written."_ HM:297 (DRAG-7.10) does this for `R2`, whose slot is hidden too, but it reads only `parentId` and watches no writes (audit Watch List #37). Proposed Stamps, item 3, adds DRAG-7.6 to it once it watches writes.
2. _The second Given: `R`, whose slot the section shows, comes back in its own slot, and a release there writes nothing._ No spec drives it. DP:313, "DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before", asserts the seed only, internally (Proposed Internal Mappings, item 2).

**DRAG-7.7 → Automated on HM.**

- HM:60, "DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered…":
  - centered within 2px;
  - the rows' ids in the section's order, which also shows there's no overflow row in it;
  - each row's level by indent;
  - `F` and `G` absent, and no writes.
- HM:105, "DRAG-7.7: any of the section's overflow rows opens the same modal…": `T`'s overflow row and `R`'s open the same list. Its one-shot reads at :119 and :124 can be flaky but never pass falsely (audit Watch List #38).

**DRAG-7.8 → Automated on HM:128**, "DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written": each of the three closes it, the section and its "2 children" are unchanged, and there are no writes. The Escape-during-a-drag sentence cites DRAG-7.19, which HM:453 covers.

**DRAG-7.9 → Open (narrow).**

- **Asserted:**
  - The drag starts at `P`'s Descendants layer, with no pop (HM:163, `awaitDragContext` straight after the pickup).
  - Between `R1` and `R1a`, `R1`'s first child, attached (HM:163).
  - One tab right in `R2`'s own gap, `R1`'s last child (HM:191).
  - Its own gap and depth: no writes, and `R2` unchanged (HM:215).
  - An over-cap tab state reached, `…:false`, with no writes (HM:240).
- **Missing:** _"`R2` stays attached throughout, with `P`'s workphase."_ Only HM:163 reads `isAttached`, and no test reads `R2`'s `workphaseId` after a release. One assertion on HM:163 and HM:191 closes it. Also, "one state" between `R1` and `R1a` isn't tabbed. That's DRAG-4.8's rule and isn't held against the case.

**DRAG-7.10 → Open.**

- **Asserted:**
  - HM:297: pulled to `P`'s box left of the modal, the modal closes, the context is `P`'s Card, and the release leaves `R2` under `R`.
  - HM:326: from the modal to another Card's box, the context ends at the column, the modal closes, and the release detaches `R2`: Free, `parentId` kept, the workphase kept. That's two pops.
  - HM:356: a cursor over the header is still in the modal.
- **Missing:**
  1. _The brief excursion:_ "When the cursor instead leaves the modal's box for less than `popDelayMs` and comes back, then the modal stays open." No test.
  2. _The Card layer's "nothing is written":_ HM:297 reads `parentId` only, with no `watchWrites` (audit Watch List #37).
  3. _"An item from outside `P` attaches as `P`'s last child"_ after leaving the modal: no test.
  4. _"Bounded by `P`'s box"_ at the Card layer: not measured.
  5. _"Opened … by a hold":_ MH:406 (DRAG-7.18) pulls out of a hold-opened modal and asserts the close and the Card layer, but doesn't carry DRAG-7.10 (Proposed Stamps, item 2).
- The `popDistancePx` alternative isn't driven. It's DRAG-1.14's clock, so it's a low gap.

**DRAG-7.11 → Open.** HM:380, "DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag", asserts:

- one element carries the section's region key, and it's inside the modal;
- each row is registered once;
- the context and the modal stay put while the cursor rests over `P` behind the backdrop.

**Missing:**

1. _"The ghost doesn't move to a gap in the section":_ no projection is read before or after the rest.
2. _"The carried copy stays inside the modal's box":_ asserted with `boxOf`, which can't fail (audit #6, Test Quality Concerns, item F).
3. _"The pop-out clock runs as it does anywhere outside the modal's box":_ HM:380 seeds `NO_POP`. HM:297 rests at the same kind of point, over `P`'s Card left of the modal, and pops. Proposed Stamps, item 4, would put DRAG-7.11 on it.

**DRAG-7.12 → Open.** HM:240, "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…", reads `data-drop-state` `valid` and `depth-capped` on the modal's rows. **Missing:**

1. _"When the modal opens during the drag":_ HM:240 opens the modal by a click before the pickup, so the classification is computed with the modal already open. "Opening the modal changes no classification" is never exercised. A hold-opened variant (MH's tree with a chain like MH:448's) would close it.
2. _"De-emphasized by `overlayDepthCappedOpacity`":_ only the state attribute is read. DRAG-2.6, the section's equivalent, is `Open` for the same reason. If the Test Planner reads "as a Depth-capped Stub in the section is" as the state alone, this part drops away.

**DRAG-7.13 → Open.**

- **Asserted:**
  - MH:80: the dwell with no cue; then the cue on `R`'s overflow row and no modal; then the modal, with the context still `P`'s Descendants.
  - MH:110: a release during the cue commits `R`'s first child, and no modal opens.
  - MH:131: `B`, `P`'s own Stub, held below the row, opens it, and the release commits `R`'s last child.
  - PS:452 and PS:480 assert the clock's stages, in the approved category (a drag clock's logic).
- **Missing:** _the case's own `X`, an item from outside `P`, opening the modal._ Every spec drags a Stub of `P` (the specs call it `X`, but it's `P`'s child; `overflowTree.ts:30`). The case and wiki §7.3 both name the two origins, and the case shows the second with `B`, so the first is a clause of its own (Test Quality Concerns, item K). One spec dragging a Free Card from another column, zoomed into `P` and on into its section and held beside the row, closes it.

**DRAG-7.14 → Open.**

- **Asserted:**
  - MH:153: tabbing from `L + 1` to `L` ends the hold and removes the cue; tabbing back starts a fresh dwell; another gap ends the hold.
  - PS:464 and PS:475 (approved category): a change of gap, depth or side resets the hold, and the cue goes at once.
- **Missing, in effect:** _"The carried copy moves within the gap … the hold runs on."_
  - MH:221 crosses the ghost's middle five times and awaits `…:cue` each time. `awaitModalHold` retries, so a hold that reset would pass back through its 300 ms dwell and reach `cue` again inside the wait. The spec can't fail on a reset (Test Quality Concerns, item M).
  - The half that matters, both neighbors naming one target, is asserted only by DP:242, which carries DRAG-7.13 and is internal (Proposed Internal Mappings, item 4).
  - PS:456 and PS:459 show that a steady target runs on, but take the target as given.
- MH:188 carries DRAG-7.14 but asserts a rule the case doesn't state (Test Quality Concerns, item L).

**DRAG-7.15 → Automated on MH:247**, "DRAG-7.15: the modal opens with the ghost's spot under the cursor, so a release right after commits the same placement":

- **from above the row:** the cursor is inside the modal; the ghost is painted under it, between `R` and `R1`; the projection is `3:3:true`; the context is still Descendants; a one-pixel nudge changes nothing; and the release commits `X` before `R1`;
- **from below:** `B` dragged, the cursor inside, the ghost under it, the projection `7:3:true` (the gap after `R2`), and the release commits after `R2`.

MP:18, :65, :85 and :108, and DP:371, assert the geometry and the reseed. They aren't needed for the status (Duplication).

**DRAG-7.16 → Open.**

- **Right edge, whole:** MH:345 asserts the modal inside the window, the cursor inside it, and the projection moving to `6:4:true` (deeper than the hold's spot), and the release commits `R2`'s child.
- **Bottom edge, weak:** MH:306 asserts the modal pulled up inside the window, the cursor inside it, the ghost under the cursor, and the projection no longer `3:3:true`. Its write check is the weak part (audit #7 and the `moved` question; Test Quality Concerns, items C and G). "A release without moving the cursor commits that placement" isn't asserted.
- **Top and left edges:** only MP:25's `it.each` row, "DRAG-7.16: is pulled inside the window at %s", which is internal geometry. The handoff says a cursor can't be brought near them in a spec. That holds for the left edge. For the top edge it may not: an earlier last-level row with hidden children lengthens the modal above `R`'s spot without moving `R` in the section. That's worth one probe before the case is settled. Proposed Internal Mappings, item 5, is the fallback. The other way out is for the Test Planner to scope the case to the edges a cursor can reach.

**DRAG-7.17 → Open.** MH:374, "DRAG-7.17: when R's children run longer than the modal…", holds below the row with 20 extra children: the list's `scrollTop > 0`, the cursor is inside, the ghost is under it, the projection holds, and the release commits after `E19`. **Missing:** _"from either gap"_. The gap above the row, as `R`'s first child, isn't driven with a list long enough to scroll. MP:40 shows the scroll for any spot, internally (Proposed Internal Mappings, item 6).

**DRAG-7.18 → Automated on MH:406**, "DRAG-7.18: after leaving the modal, a hold beside an overflow row opens it again in the same drag": the hold opens the modal; pulled out, the modal closes and the context is `P`'s Card; zoomed back in and held again, it reopens at Descendants; and the release commits `R`'s first child.

**DRAG-7.19 → Open.**

- **Asserted:**
  - HM:418: after a release in a click-opened modal, its box is unchanged; `R2` is drawn under `R1` and before `R1a` at `R1a`'s level; and `R2` picks up again.
  - HM:453: Escape mid-drag leaves the modal open, the rows unchanged and no writes, and Escape then closes it.
- **Missing:**
  1. _"Marked pending until the response lands … Once the response lands, `X` is unmarked, in the same place":_ `data-pending` is never read in the modal. DRAG-6.2's spec shows how to hold a response.
  2. _The case's main Given is a modal opened during the drag:_ a hold-opened modal staying open _in the same place_ after a release isn't asserted. MH:247 checks only that it's visible. This is the path audit #2 touches.
  3. _The cancel's "in the same place":_ not measured in HM:453.
  4. _"So does one whose release writes nothing":_ HM:215 doesn't check the modal after its no-write release.

**DRAG-7.20 → `Manual`, the Test Planner's,** by its own text: the hold's feel and the ghost not jumping. No test carries it. MH:31 cites it in a comment, which is fine.

**DRAG-1.34 → Open.**

- **Asserted:**
  - OR:76: the level-count field shows its default, takes `L + 1` at once (the section redraws), and keeps it across a reload, in effect.
  - OR:227: the drop math takes a seeded level count.
  - MH:481: the dwell and cue fields show their defaults and take 4000 and 7000; the next hold is still `dwell` past the default dwell; and both fields read back after a reload.
- **Missing:** _"the next hold takes the new … cue":_ the changed cue's effect isn't asserted, only the dwell's. A long cue that is still `cue` past the default cue length would close it.
- Low: after the reload, the hold values are read from the panel, not from a hold. The level count is read in effect.
- DT:47 is internal and beside these surface tests. It isn't proposed.

### The Pending PO cases: the tests to stamp once the PO rules

- **DRAG-7.21** (over-cap beside an overflow row: no hold):
  - MH:448, "a ghost in an over-cap state beside an overflow row starts no hold". It asserts the lean in the gap _above_ the row: the projection `3:3:false`, no modal well past the whole hold, no hold, no cue, no writes, and `X` unmoved. The case says "held in either": the gap below isn't driven.
  - DP:265, "DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state", **already carries DRAG-7.21** in its title (Unknown IDs).
  - If the PO rules for the lean, stamp MH:448, and add the gap below or accept DP:265's gap-agnostic check.
- **DRAG-7.22** (a drag from an overflow row picks up nothing):
  - HM:523, "a press and drag from an overflow row picks nothing up". It presses the row's centre and moves 100px, then asserts no `data-drag-state`, the section unchanged, no modal and no writes.
  - Two cautions. It hand-rolls the drag (audit #26). And it presses the label only: a press in the row's indent gutter picks up the Card (audit Watch List #46). If the PO rules for the whole row, the spec needs a gutter press too.
- **DRAG-7.23** (a reload and an open modal): **no test.** The Phase 3 behavior (the modal closes when its Card is gone or has no attached descendants) has no test either. Audit #2's fix keeps the lean, so a test written for the fix (Regression guards, #2) would likely be the one to stamp.

### The cases whose tests Phase 5 changed

- **DRAG-2.1, DRAG-2.2, DRAG-2.3 and DRAG-2.7: still whole.** They're on TCS:33, "DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified at pickup…".
  - It now seeds `sectionLevels: cap`, so the chain to `cap − 3` is drawn whole.
  - It asserts the same states as before: `V` and `T_ok` `valid`, `T_over` `depth-capped`, `X`, `D` and `D1` `cycle-forming`, and `S` undrawn.
- **DRAG-2.10: still whole,** on boards and TCS:33, which reads the cap from the board.
- **DRAG-2.4 stays `Open`.** The spec hovers but seeds `NO_POP`, so "popping, and entering and leaving contexts" isn't driven. That's unchanged.
- **TREE-3.7: still whole.**
  - projects:739 is the route half: the listing, the rename and the sibling move past the cap.
  - PTS:191, "TREE-3.7: the sidebar shows every project of a tree past the project cap, flagging and repairing none", is the sidebar half. It now seeds the widest sidebar, so the deepest names have width. It also matches names whole, so `P1` isn't also `P10`. Every name, `P1` to `P12`, `Past 1` and `Past 2`, is visible, and `Past 2` sits at the `cap + 1` indent.
- **DRAG-7.9's Phase 5 edit:** HM:240 now rests 2px below the last row, which is still in the gap below it. The case holds as judged above.

### The Scope's check: three levels

- **DRAG-4's tree:** the cases are `Automated` on unit tests. DP's `sample()` and the cut-off suite pass `sectionLevels: 3` explicitly, and `hierarchyPlacement.test.ts` never sees a level count. So they hold whatever the default becomes.
- **The DRAG-4 surface specs** (SD:281 for DRAG-4.12, and `drag-card-zoom-in.spec.ts`) build trees no deeper than two levels.
- **DRAG-5.13** (`Open`): SD:84 and SD:110 build `S1` → `S1a` → `S1a1`, three levels, and run at the default. SD:110 asserts `S1a1`'s row visible at `P`'s Card layer. They pass at today's default of 3. They would fail if the default fell below 3, since SD seeds no `sectionLevels`. Low: seeding `sectionLevels: 3` (or more) there would make the assumption explicit.

---

## Lost Coverage

**None.** All 287 `Automated` cases have at least one test whose title carries the ID. The sweep matched each case's ID against the titles in `tests/`, `server/tests/` and `client/src/`. Since no status is written in this run, nothing would have moved anyway.

## Unknown IDs

**None.** Every ID in a test title is a case in the catalog. The IDs in `scripts/check-docs/*.test.mts` are the checker's own fixtures, inside strings.

**A `Pending PO` case carried by a test:** DRAG-7.21, on DP:265 ("DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state"). It's not unknown, and `check:docs` passes it. But it maps a test to a case whose rule isn't ruled yet. The handoff says the specs for 7.21 and 7.22 carry no ID; this unit test does.

**A Test Planner `Manual` case carried by a test:** none. No title carries DRAG-1.29, DRAG-1.32, DRAG-4.24 or DRAG-4.25.

---

## Proposed Stamps

These are surface tests, so they need no approval. A developer adds the ID, and the confirming run maps it.

1. **DRAG-7.2 on HM:482** ("DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row…"). It asserts "1 child" while `R1` is dragged, DRAG-7.2's dragged-child clause. The handoff says so, but the ID isn't there.
2. **DRAG-7.10 on MH:406** ("DRAG-7.18: after leaving the modal…"). It pulls out of a _hold_-opened modal and asserts the close and the Card layer, DRAG-7.10's "opened by a click or by a hold".
3. **DRAG-7.6 on HM:297** ("DRAG-7.10: leaving the modal for the Card's box closes it…"), **once it watches writes** (audit Watch List #37). `R2`'s slot is hidden, so its release at `P`'s Card layer is DRAG-7.6's last sentence for an equivalent Stub.
4. **DRAG-7.11 on HM:297.** It rests over `P`'s Card, outside the modal's box, and the pop-out clock fires. That's DRAG-7.11's last clause.

## Proposed Internal Mappings (need approval)

None is recommended over a surface test. Each is the fallback if no spec is written.

1. **DRAG-7.4 ← DP:213**, "DRAG-7.4: with no row below it, the states run from the top level to R's last child, and no further". It covers the `B`-as-Bottom Given: depth 0 → `P`'s child after `A`, 1 → `A`'s child, 3 → `R`'s last child, and 9 clamps to 3. **Not recommended:** the Given is reachable in a spec (seed the tree without `T`).
2. **DRAG-7.6 ← DP:313**, "DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before". It covers only the seed (`2:2`, `atOwnSlot`), not "a release there writes nothing" at the surface. **Not recommended:** HM:482's flow with `R` in place of `R1` reaches it.
3. **DRAG-7.2 ← ILO:309**, "leaves the dragged item out of the count, and draws none when it was the only child", once it carries DRAG-7.2. It's whole for the only-child clause at `sectionEntries`. **Acceptable** if Nathan prefers it to a spec. It's a pure module, though not one of the approved categories.
4. **DRAG-7.14 ← DP:242**, "DRAG-7.13: names the overflow row the ghost sits directly above or below…", once it also carries DRAG-7.14. "Either neighbor of the gap reads the same" is the neighbor-flip half. **Recommended alongside** a stronger MH:221 (Test Quality Concerns, item M): the projection isn't the pop state machine, so it's outside the clock category.
5. **DRAG-7.16 (top and left edges) ← MP:25**, "DRAG-7.16: is pulled inside the window at %s". It covers geometry only: the dialog is pulled in, and the cursor is still inside. MP:71 shows that a shifted modal reads the depth at the cursor. **Recommended for the left edge,** which a cursor can't reach. Recommended for the top edge only if a probe confirms it's unreachable (Coverage Mapping, DRAG-7.16).
6. **DRAG-7.17 (the gap above the row) ← MP:40**, "DRAG-7.17: scrolls the list to bring a spot deep in it under the cursor". `placeModal` doesn't know which gap the spot is. **Not recommended:** a long tree above `R` makes the first-child spot scroll in a spec.

**Dropping existing pointers:** none. No scoped case has an Automation line yet.

## Proposed Manual (need approval)

**None.** DRAG-7.20 is `Manual` by the Test Planner's judgment, as its text says.

---

## Gaps

**In scope, with what closes each:**

- **DRAG-7.2:** stamp HM:482; drive the only-child clause (a spec, or Proposed Internal Mappings, item 3).
- **DRAG-7.4:** a spec on the tree without `T`.
- **DRAG-7.6:** watch writes on HM:297 and stamp it; a spec for `R` coming back to its own slot and writing nothing.
- **DRAG-7.9:** read `R2.workphaseId` (and `isAttached`) after HM:163's and HM:191's releases.
- **DRAG-7.10:**
  - a brief-excursion spec (out of the modal for less than `popDelayMs`, then back: the modal is still open and the context is still Descendants);
  - watch writes on HM:297;
  - an item from outside `P`, in a hold-opened modal, pulled out and released at `P`'s Card layer: `P`'s last child;
  - the carried copy bounded by `P`'s box, measured with `paintedBoxOf`;
  - stamp MH:406.
- **DRAG-7.11:**
  - audit #6;
  - read `data-drag-projection` before and after the rest behind the backdrop, and assert it unchanged;
  - stamp HM:297.
- **DRAG-7.12:** open the modal by a hold during the drag of an item with a child, and assert the rows' states; the opacity, unless the Test Planner reads the case as the state.
- **DRAG-7.13:** a hold by an item from outside `P`.
- **DRAG-7.14:** an MH:221 that can fail on a reset; DP:242 stamped and approved.
- **DRAG-7.16:** audit #7, plus a committed-placement check at the bottom edge; settle the top and left edges (a probe, Proposed Internal Mappings, item 5, or the Test Planner).
- **DRAG-7.17:** the gap above the row with a scrolling list.
- **DRAG-7.19:** `data-pending` on and off in the modal under a held response; a hold-opened modal's box unchanged after a release; HM:453's box after the cancel; the modal still open after HM:215's no-write release.
- **DRAG-1.34:** the next hold taking a changed cue.

**Outside scope:** the catalog's 63 other `Open` cases are the last report's 63. None was in scope, and none changed.

---

## Duplication

Reported, not judged.

- **DRAG-7.3, 7.4, 7.5:** OR (the surface), and DP:179, :195, :213 and :232 (the projection).
- **DRAG-7.1, 7.2:** OR and HM:482, and ILO:281–313 (no IDs).
- **DRAG-7.6:** HM:482, PL:258, and DP:285, :303 and :313.
- **DRAG-7.13, 7.14:** MH, PS:452, :464, :475 and :480, and DP:242 and :265.
- **DRAG-7.15:** MH:247, MP:18, :65, :85 and :108, and DP:371.
- **DRAG-7.16:** MH:306 and :345, and MP:25 and :71. PS:153 and DS:238 also carry DRAG-7.16, wrongly (audit #22).
- **DRAG-7.17:** MH:374, and MP:40 and :48.
- **DRAG-1.34:** OR:76, OR:227, MH:481 and DT:47.
- **DRAG-7.9 and DRAG-7.12** share HM:240.
- **BCU-1.6, TC-7.18 and TC-7.20:** boards:365 and CP:242 build one scenario (Test Quality Concerns, item E).
- **TC-2.8 (the done-anchor half):** PO:460 and H:580 (Test Quality Concerns, item H).

---

## Test Quality Concerns

### The audit's questions to the Reconciler

**A. PS:493–498, "a layer change clears it": confirmed, it doesn't prove its point.**

- **Why:** `away` is built by the same step the test above it (PS:486) uses to show that resting outside ends the hold. So `away.modalHold` is already `null` before the layer change, and the test passes with or without the clearing.
- **What it bears on:** it carries no ID, and no case states that a layer change clears the hold. DRAG-7.14 names gap and level changes. **No status effect.**
- **The fix:** since the cursor leaving already ends the hold, a layer change with a hold running can't be reached through `step`. Either hand-build a session with a running `modalHold` and an `outsideSince` old enough that the next step pops, and assert `modalHold` is `null` after the pop, or delete the test.

**B. hier:76, "terminates against a parentId cycle": confirmed.**

- **Why:** `typeof … === 'number'` holds for any number, `NaN` and `Infinity` included, so the test proves only that `getDepth` returns.
- **What it bears on:** no case cites it. TC-5a.5's mapping is the describe at hier:160. ATT-4.6 is on the server's `itemTree.test.ts`. The server's bounded reading of a cycle is workflows:72. **No status effect.**
- **The fix:** assert a finite value bounded by the list's length (`Number.isFinite`, and `≤ nodes.length + 1`). If the client is meant to agree with the server's bounded depth, assert the same value.

**C. MH:341, `moved`: confirmed.**

- **Why:** even with #7's fix (poll until `parentId !== p.id`, compare against `R1`), `placed.parentId !== r.id || placed.position > R1's` holds for any write except `X` as `R`'s first child. DRAG-7.16 says the ghost goes where the cursor reads, and "a release without moving the cursor commits that placement". The spec checks only "not the hold's spot".
- **The fix:** after the modal opens, read `data-drag-projection` (gap and depth). Then derive the expected parent and neighbor, from the row painted directly above the ghost and the depth, and assert `X`'s `parentId` and its order against that neighbor after the write.
- **Status:** DRAG-7.16 is `Open` on this, before #7 and after it, until the write check is specific (and the top and left edges are settled).

**D. deep:68–71: confirmed, it proves the wrong rule.**

- **Why:** it asserts `workphaseId:position` unique among Free items, which is the seed's per-workphase counter. A Free item's position scope is its whole workflow (wiki item-positioning §2; TC-2.10).
- **What it bears on:** it carries no ID, and maps to no case. The seed writes rows directly and is dev tooling. **No status effect.**
- **After #1:** it should assert positions unique across every Free item of the seed's one workflow, under a retitled test. With #9, it should read the depth constants and assert a depth, not a project count, in its last test.

**E. boards:365 (BCU-1.6) and CP:242 (TC-7.18, TC-7.20): confirmed overlap. Each case is whole, and neither test is tautological.**

- **The scenario:** both move `P1` from `Q1`'s workflow to `Q2`'s, and both assert that `X` keeps `w1` and is in Unsorted on a `WF2` board.
- **BCU-1.6:** whole on boards:365: off `WF1`'s board, on `WF2`'s, still at `w1`. Its Unsorted assertion is beyond its case, which assigns Unsorted to TC-7.20 and BCU-5.2.
- **TC-7.20:** whole on CP:242: the move is a 200, `w1` is kept, and a new `WF2` board lists `X` under Unsorted.
- **TC-7.18:** whole on CP:242: `positionScope` is `"none"` on the board read and on `GET /api/items/:id`.
- **No status effect.** The optional tidy-up is to drop the Unsorted line from boards:365, or stamp TC-7.20 on it. Either way, the duplication is visible.

**F. Audit #6 (DRAG-7.11).**

- **Today:** the carried-copy check at HM:409–414 can't fail. On top of that, the ghost staying out of the section isn't asserted, and the pop-out clock clause isn't in this test. **Open.**
- **After #6 alone:** still **Open**, on the projection check and the pop clock (Gaps).

**G. Audit #7 (DRAG-7.16's bottom edge).**

- **Today:** a stale read can pass it whatever the release wrote. **Open.**
- **After #7:** still **Open**, on item C, and on the top and left edges.

**H. Audit #8 (TC-2.8).**

- **The test:** PO:460 can pass on a refused setup create. It also asserts only the 400, not "nothing is written".
- **Today:** TC-2.8 is **`Automated`** regardless. The done-anchor half is whole on H:580 ("TC-2.8: a done Free item cannot be an anchor, and the refused move writes nothing", which uses the checked `createItem`, matches the message and checks the row unchanged). The nonexistent-anchor half is whole on PO:435.
- **After #8:** unchanged. PO:460 then becomes a sound second test.

**I. Audit #21 (DRAG-7.10's title at HM:297).**

- The title promises a second pop the test doesn't drive. HM:326 drives it, and also carries DRAG-7.10, so the case's "two pops" is asserted by the pair. The title only misleads.
- **Today and after:** DRAG-7.10 is **Open**, for the reasons in Coverage Mapping, none of which the title fix touches.

**J. Audit #22 (PS:153 and DS:238 carry DRAG-7.16).**

- **What they test:** that the modal's dialog bounds the layer, so a cursor over the header is still inside. That's DRAG-7.10's box.
- **Under DRAG-7.16:** they cover nothing of its _Then_, so they have **no effect on DRAG-7.16's status**, today or after.
- **Retitled to DRAG-7.10:** PS:153 is in the approved category (what keeps the pop-out clock from starting), and DS:238 isn't. HM:356 already covers the header at the surface, so neither would be proposed, and **DRAG-7.10's status doesn't change.**

### Concerns from this run

**K. Which `X`: a cross-cutting reading for the Test Planner. Medium.**

- **The difference:** the suite's preamble makes `X` "a Free Card from elsewhere on the board … zoomed into `P` and on into its section". Every DRAG-7 spec drags a Stub of `P` (`overflowTree.ts:30` seeds `X` as `P`'s child). The specs' headers, and the handoff, say placement is the same for any item at the layer, and wiki §7.1 doesn't distinguish.
- **For placement (DRAG-7.3–7.5, 7.15–7.18):** this report accepts the Stub. The only behavioral difference is the attach write, a Free `X` turning `isAttached` on. DRAG-4's entry and attach cases own that.
- **For DRAG-7.13:** not accepted. The case shows "any item" with `B` as the second origin, so the first origin, an item from outside, is a clause of its own (wiki §7.3: "one of the Card's Stubs, or an item that zoomed in from outside").
- **The ask:** if the Test Planner wants the outside item for the placement cases too, or wants the preamble changed to "any item at the Descendants layer", that's the Test Planner's edit, not the Reconciler's. One spec with a real outside `X` (DRAG-7.13's gap) would also exercise the attach write through the overflow row.

**L. MH:188 carries DRAG-7.14 but asserts a rule no case or wiki passage states. Medium.**

- **The rule:** "the hold runs only with the cursor inside the section: resting outside it ends the hold". PS:486 asserts it too.
- **Where it stands:** the handoff lists it for the PO as "beyond §7.3's wording".
- **The ask:** take DRAG-7.14 off MH:188's title, or keep it there only once the PO's rule lands and the Test Planner adds it to the case or to a new one (Candidate New Cases, item 1).

**M. MH:221 can't fail on a reset. Medium.**

- **Why:** `awaitModalHold` retries until it matches, and the seeded dwell is 300 ms, so a reset hold reaches `cue` again inside the wait.
- **The fix:** read `data-drag-modal-hold` without retrying after each crossing (`expect(await dragMachine(page).getAttribute(…)).toBe(…)`), with a dwell long enough, a few seconds, that a reset would read `dwell`. That stays a check on the clock's logic, not its timing.

**N. HM:240 (DRAG-7.12) opens the modal before the drag, and reads the state, not the de-emphasis. Low.** See Coverage Mapping, DRAG-7.12.

**O. DT:47 pins the hold's defaults to a Card zoom-in's dwell and cue. Low.** That's the plan's starting value (E3), not a wiki rule. Wiki §3.1 leaves the values to tuning, and DRAG-1.34 doesn't name them. It's harmless, but if Nathan's hands-on retunes one clock, the test fails for no rule.

**P. OR:23's "each at its level" is checked by indent for `R` and the overflow row only. Low.** See Coverage Mapping, DRAG-7.1.

**Q. HM:523 hand-rolls its drag (audit #26), and MH:448's comment says "X is a child of R" (audit Informational #69). Low.** Both bear on the Pending PO tests to be stamped.

No mapped test was found tautological. The tests in items A–D, and HM:409–414, are the ones that can't fail on their subject.

---

## Uncatalogued Tests

In the story's new and changed test files only.

**Gate and support, with no standalone rule:**

- **DP:**
  - :273, "reads an owner that is no row as no row named: below everything";
  - :319, "in the hierarchy modal, which draws every level, its own slot is its own";
  - :325, "shows no overflow row, and clamps nothing, once the levels it holds are all shown".
- **MP:**
  - :54, "keeps a dialog taller or wider than the window at the margin";
  - :93, "a ghost above the slot lands after the row it is moved to";
  - :98, "rows that travel with the ghost are not counted";
  - :120, "is null when the ghost is not in the list…";
  - :133, `nearestRowIndex`.
- **ILO:**
  - :247 and :253, `overflowRowId`;
  - :281–:305 and :320, `sectionEntries`, the internal side of DRAG-7.1 and DRAG-7.2, with no IDs;
  - :309, under Proposed Internal Mappings, item 3.
- **DS:219,** "a section element outside its Card in the DOM resolves under the parent it names".
- **DC:**
  - :123, "a Descendants context: an overflow row inside the section is a candidate";
  - :145, "excludes an overflow row from a Card drag, as it does a Stub row";
  - :432, "over an overflow row: the same shuffle-slot rule as a Stub row…";
  - :511, "tell an item row (Card, Stub or overflow row alike) from a column…";
  - :523, "tell the section's rows from the Cards…".
- **PS:493,** "a layer change clears it" (item A).
- **deep,** all of it: dev tooling for the deep seed (items D and #9).
- **The resizable sidebar:**
  - `client/src/components/sidebar/sidebarWidth.test.ts` and `client/src/components/sidebar/useSidebarResize.test.ts`, every test;
  - `tests/ui/project-sidebar-resize.spec.ts`: "the sidebar starts at its default width", "dragging the handle on the right edge sets the sidebar's width", "the sidebar stops at its widest and narrowest", "the width a user dragged the sidebar to is kept across a reload", "a project still drags to a new place in a resized sidebar".
  - The PO ruled D2 a working placeholder, so no cases come from it.

**Genuine scenarios the catalog lacks:**

- MH:188 and PS:486: the hold ends when the cursor rests outside the section (Candidate New Cases, item 1).
- ILO:236, "holds the tuning value to a whole number of at least 1", and ILO:315, "reads a level count that is not a whole number, or below 1, as shownLevels does" (item 2).
- DC:546, "at a Descendants context: the overflow row of a traveling row, and no other": a dragged Stub at the last shown level takes its overflow row with it (item 3).
- MH:448 and HM:523: the DRAG-7.21 and DRAG-7.22 leans, already cases, waiting on the PO.

## Candidate New Cases

1. **The modal hold runs only while the cursor is inside the section's box.** Resting outside it, with the ghost held in its gap by the clamp, ends the hold and removes the cue, with no pop. Coming back starts it again.
   - **Not in the wiki:** §7.3 sets no such condition. The handoff lists it for the PO. So it's a **PO gap**.
   - **Tests:** MH:188 (which carries DRAG-7.14 today) and PS:486.
2. **The section's level count is read as a whole number of at least 1** (3.9 reads as 3, and 0 as 1).
   - **Not in the wiki:** §3.1 and §9 say only "a tuning-panel value". The handoff lists it for the PO. So it's a **PO gap**, and possibly an implementation detail of the panel the PO declines.
   - **Tests:** ILO:236 and ILO:315.
3. **A dragged Stub at the last shown level takes its overflow row with it.** The row stays drawn under it and is never named as a neighbor.
   - **Not in the wiki:** §7.2 says a dragged Stub's subtree travels, and the overflow row stands for part of it, so it may be a deduction. The handoff lists it for the PO. So it's a **PO gap**, or a Test Planner deduction once the PO confirms.
   - **Test:** DC:546. No spec.
4. **A workflow create naming `templateId: ""` or `sourceWorkflowId: ""` is refused, and nothing is created.**
   - **In the wiki:** row-references §1 ("so does an empty string"; "every write that takes such a field applies them"). Audit #3 adds the refusal tests. So it's a **Test Planner gap**.
   - **Where it lands is open:** no feature catalog holds workflow creation today. project-tree §10 owns which workflow a project uses. The Test Planner may need the PO to say which page lists these fields as references.
5. **From the earlier report, still open:** an item's agent that names no row is refused (a Test Planner gap, `docs/archive/test-reconciliation-a6-last-round.md`, Candidate New Cases, item 1).

---

## Regression guards for the audit's Fix Now

For the Coder, before each batch. It names what a regression in the touched behavior would trip, and where nothing would.

**#1, the deep seed's Free positions** (`server/src/db/deepSeed.ts`):

- **Cases:** none. It's a dev seed, and no case covers it. The rule is item-positioning §2's (TC-2.10), which governs API writes.
- **Tests:** deep, "seeds rows as the API would write them…", which itself must change with the fix (item D). deep's other tests guard the seed's shape: the paths, the depths and the board.
- **No test:** any check that the deep stack's board orders and places the way the API would. Nothing reads `deep.db` but deep.

**#2, a hold-opened modal remounting with no drag** (`client/src/components/BoardView.tsx`, `client/src/components/HierarchyModal.tsx`):

- **Cases:**
  - DRAG-7.7 (opened by a click, centered);
  - DRAG-7.15, 7.16 and 7.17 (opened by a hold, placed at the cursor);
  - DRAG-7.18 (reopened);
  - DRAG-7.19 (it stays where it is after the drag ends);
  - DRAG-7.23 (`Pending PO`; the fix keeps its lean).
- **Tests that would catch a regression:**
  - HM:60, "DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered…" (centering);
  - HM:418, "DRAG-7.19: after a release in the modal it stays open where it is…" (the box unchanged, click-opened);
  - MH:247, "DRAG-7.15: the modal opens with the ghost's spot under the cursor…";
  - MH:306 and MH:345 (DRAG-7.16), MH:374 (DRAG-7.17) and MH:406 (DRAG-7.18).
  - A guard that stopped a hold-opened modal from placing itself would fail MH:247's `expectInside` and `expectGhostUnder`.
- **No test:**
  - Failure scenario (a): a resync after a release in a hold-opened modal (a failed or stale write). Nothing asserts where the modal comes back, or whether it does.
  - Failure scenario (b): a release in the moment between the hold running out and the modal mounting.
  - A hold-opened modal's box after a release (DRAG-7.19's missing part). MH:247 checks only that it's visible.
  - A spec that holds the move's response and then fails it (as DRAG-6.6's spec does), with a hold-opened modal, would cover (a) and give DRAG-7.23 its test.

**#3, `POST /workflows` with `templateId: ''` or `sourceWorkflowId: ''`** (`server/src/routes/workflows.ts`):

- **Cases:** none directly (Candidate New Cases, item 4). TREE-10.1 and TREE-10.4 create workflows through the route.
- **Tests that would catch a regression:**
  - workflows:145, "returns 400 with a specific message when templateId does not reference an existing template";
  - workflows:154, "… when sourceWorkflowId does not reference an existing workflow";
  - workflows:163, "clones phases from a template when templateId is given";
  - workflows:182, "clones phases from an existing workflow when sourceWorkflowId is given";
  - workflows:201, "creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given". The new guard must keep an omitted field valid.
  - workflows:213 (TREE-10.4) and :230 (TREE-10.1), and `tests/api/workflows.spec.ts`.
  - Every E2E spec, through `tests/helpers/seed.ts::seedTemplatedWorkflow`.
- **No test:** a `null` `templateId` or `sourceWorkflowId`. The fix treats `null` as none, and no test sends it.

**#28, one browser-storage module for the drag tuning and the sidebar width** (`client/src/components/workflow/dragTuning.ts`, `client/src/components/sidebar/sidebarWidth.ts`):

- **Cases:** DRAG-1.31 (`Open`), and DRAG-1.34 and DRAG-7.1's level count (`Planned`), whose values persist in the browser.
- **Tests that would catch a regression:**
  - DT, all of it;
  - `client/src/components/sidebar/sidebarWidth.test.ts`, including "is the default when there is no storage, or reading it throws" and "does nothing without storage, and survives a write that throws";
  - `client/src/components/sidebar/useSidebarResize.test.ts`;
  - OR:76, "DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value, taken at once and kept across a reload";
  - MH:481, "DRAG-1.34: the modal hold's dwell and cue are tuning-panel values…";
  - `tests/ui/project-sidebar-resize.spec.ts`, "the width a user dragged the sidebar to is kept across a reload";
  - every E2E spec that seeds tuning through `seedDragTuning`, the load path. A broken read fails the drag suite broadly.
- **No test:** a refused write for the drag tuning (the guard the fix adds); the panel's `onChange` surviving a throwing `setItem`; `dragTuning.ts` reading through a throwing `getItem`.

**#30, `modalPlacement.ts` calling `descendantsIndentPx`** (`client/src/components/workflow/modalPlacement.ts`):

- **Cases:** DRAG-7.15 and DRAG-7.16 (the depth read at the cursor).
- **Tests that would catch a regression:**
  - MP:65, "DRAG-7.15: reads back the depth the cursor was placed at, at every level";
  - MP:71, "DRAG-7.16: a modal shifted sideways reads the depth the cursor is at…";
  - MH:247 (the projection `3:3:true` and `7:3:true` right after opening);
  - MH:345 (`6:4:true` at the right edge).
- **Note:** MP:65 and MP:71 check `cursorXInList` against `depthAtCursor`, both in the one module, so a change to both that drifts from the rendered indent passes them. The E2E specs are the ones tied to the real indent.

**#31, `HierarchyModal.tsx` calling `travelingRowsFor`** (`client/src/components/HierarchyModal.tsx`):

- **Cases:** DRAG-7.15, 7.16 and 7.17 (the spot under the cursor).
- **Tests that would catch a regression:** MP:98, "rows that travel with the ghost are not counted" (the pure `gapAtSlot`), and MH:247, MH:345 and MH:374, for an item with no subtree.
- **No test:** a hold that _opens_ the modal while dragging an item with descendants. Every opening spec drags a childless `X` or `B`, and MH:448's `X` has a chain but never opens it. That's the one path where the traveling rows decide the slot.

**Comments, docs, tests or scope-script only, with no app behavior to guard:**

- #4, #5, #29: `scripts/audit-scope/`.
- #6, #7, #8, #18, #20, #21, #22, #26, #27, #32, #33, #34, #35: tests.
- #9: the seed's header comment and its test.
- #10, #11, #12, #13, #14, #15, #16, #17, #23, #24: comments.
- #19: a Bruno request's doc.
- #25: a comment, or a test helper move.

---

## Totals

**Status changes in this run:** none. It's a proposing run.

**The whole catalog: 381 cases.** That's the last report's 357, plus DRAG-1.34 and the 23 DRAG-7 cases. No case outside those changed status since that report: 287 `Automated` and 63 `Open`, as then.

| Status     | P0      | P1      | P2     | Total   |
| ---------- | ------- | ------- | ------ | ------- |
| Automated  | 112     | 126     | 49     | 287     |
| Open       | 21      | 31      | 11     | 63      |
| Manual     | 0       | 2       | 2      | 4       |
| Planned    | 3       | 14      | 5      | 22      |
| Pending PO | 0       | 0       | 5      | 5       |
| **Total**  | **136** | **173** | **72** | **381** |

**By folder:**

| Folder                  | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2)             | Other                                                                                                                          |
| ----------------------- | ----- | -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| board-drag-interaction  | 138   | 51 (29/20/2)         | 59 (20/30/9)                | 4 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25); 21 `Planned` (DRAG-1.34, DRAG-7.1–7.20; 3/14/4); 3 `Pending PO` (DRAG-7.21–7.23, P2) |
| item-positioning        | 80    | 77 (43/29/5)         | 2 (0/1/1): TC-6.11, TC-5.15 | 1 `Pending PO` (TC-6.13)                                                                                                       |
| item-attachment         | 75    | 72 (30/26/16)        | 1 (1/0/0): ATT-4.9          | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11)                                                                              |
| project-tree            | 54    | 53 (7/30/16)         | 1 (0/0/1): TREE-1.13        | —                                                                                                                              |
| boards-columns-unsorted | 34    | 34 (3/21/10)         | 0                           | —                                                                                                                              |
| item-sheet              | 0     | —                    | —                           | `INDEX.md` only                                                                                                                |

**If the Test Planner made the Planned cases `Open` on today's tree,** and the Reconciler then ran:

- `Automated` would go to 294: DRAG-7.1, 7.3, 7.5, 7.7, 7.8, 7.15 and 7.18 (P0: 7.3; P1: 7.1, 7.5, 7.7, 7.8, 7.15; P2: 7.18).
- `Open` would go to 76: DRAG-1.34, 7.2, 7.4, 7.6, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.16, 7.17 and 7.19.
- `Manual` would go to 5, with DRAG-7.20.
- ATT-1.10 would stay `Planned`.

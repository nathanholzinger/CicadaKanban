# Test Reconciliation: Epic 3.5 Story 7 (run 2, writing)

**Scope:** a writing run for Epic 3.5 Story 7 (`docs/planning/epic-3-5-stories/story-7-depth-cap-and-hierarchy-modal.md`), on the clean tree at `4c11569` (branch `claude/fervent-archimedes-gsiiqg`). It comes after the PO's wiki pass (`9b4c0da`) and the Test Planner's pass (`4c11569`), and before the audit's Fix Now batches (`docs/audits/code-quality-audit-epic-3-5-story-7.md`), so that missing or weak tests can be written first and then guard the fixes. The confirming run comes at checklist step 5. It covers:

- **the story's Scope:** DRAG-7.1–7.30, DRAG-1.34 and TREE-3.11;
- **the cases whose tests Phase 5 changed:** DRAG-2.1–2.4, DRAG-2.7, DRAG-2.10 and TREE-3.7;
- **the whole catalog,** under "On Every Run";
- **the audit's questions to the Reconciler,** and the extra section Nathan asked for: regression guards for the audit's Fix Now.

**What this run wrote in `docs/test-plans/`:** seven cases `Open` → `Automated`, each with its Automation test line, all in `board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md` (status table and case body both). Nothing else: no case text, no other status, no internal pointer. Every other scoped case keeps `Open` and `—`.

**Inputs read:**

- the story plan (Scope, Amendments, Open questions, and the Living-docs handoff), and the audit report (Fix Now, Watch List and "For other roles");
- wiki board-drag-interaction §7, §7.1, §7.2, §7.3 and §9, as they read after the PO's pass;
- the DRAG-7 suite as the Test Planner left it, DRAG-1.34, TREE-3.7 and TREE-3.11, DRAG-2's Phase 5 cases, and DRAG-4.29 and DRAG-4.30;
- the earlier proposing run, `docs/audits/test-reconciliation-epic-3-5-story-7.md`;
- every test carrying a DRAG-7, DRAG-1.34 or TREE-3.11 ID, the tests the audit questions, the Phase 5 specs, `tests/ui/project-sidebar-resize.spec.ts`, and the helpers they use (`overflowTree.ts`, `dragGesture.ts`, `boardLocators.ts`), plus `StubRows.tsx::OverflowRow` (to see what HM:523 presses);
- an ID sweep of every test title in `tests/`, `server/tests/` and `client/src/`, against all 389 status rows.

This run had no shell, so no gate or test was run. The Coder's results stand: `npm run check` passes (420 server, 543 client, 185 script), `npm run test:e2e` passes at a cap of 12 (207 passed, 8 skipped), and `npm run check:docs` passes on `4c11569`. The test files are unchanged since the earlier run's `c6b6896`: every line number the earlier report cites still points at the same test.

**In brief:**

- **Written: 7 cases `Automated`,** each on surface specs alone: DRAG-7.1, 7.3, 7.5 (`tests/ui/drag-7-overflow-row.spec.ts`), DRAG-7.7, 7.8 (`tests/ui/drag-7-hierarchy-modal.spec.ts`), and DRAG-7.15, 7.18 (`tests/ui/drag-7-modal-hold.spec.ts`). These are the seven the earlier run expected, and none of them was revised since.
- **Still `Open` in scope: 23 cases.** The 12 from Phase 0 the earlier run named (DRAG-7.2, 7.4, 7.6, 7.9–7.14, 7.16, 7.17, 7.19), DRAG-1.34, the three resolved cases (DRAG-7.21–7.23), the six new ones (DRAG-7.24, 7.26–7.30), and TREE-3.11. **No test carries the ID of nine of them:** DRAG-7.22, 7.23, 7.24, 7.26–7.30 and TREE-3.11. Of those, DRAG-7.22 has an unstamped spec (HM:523) and DRAG-7.29 has two partial ones (OR:113, OR:143). The other seven have no spec at all. DRAG-7.21's ID is only on an internal test (DP:265), and its spec (MH:448) is unstamped.
- **Where the revisions changed my judgment:**
  - **DRAG-7.14:** its third reset (the cursor leaving the section) is now in the case, so MH:188 fits it and earlier concern L is closed. The case is still `Open`, on MH:221, which can't fail on a reset.
  - **The suite's terms now let `X` be a Stub of `P` outside the tree,** which is what every spec drags. Earlier concern K is closed for the placement cases. DRAG-7.13 now names a Free Card from outside `P` for its main drag, so its gap is firmer, not smaller.
  - **DRAG-7.10 and DRAG-7.11:** the header and the carried copy's clamp to the list are now in the cases. HM:356 covers the header. HM:380's clamp check is the one audit #6 says can't fail.
- **A new finding: MH:448, the spec for DRAG-7.21, can pass with the defect it guards against.** `toHaveCount(0, {timeout})` passes at once, and `awaitModalHold(page, null)` retries until a hold that wrongly ran has opened the modal and cleared itself (Test Quality Concerns, item R).
- **A catalog inconsistency for the Test Planner:** DRAG-7.21's status-table row reads `Pending PO`, while its body reads `Open` and has a Rule field. This run counts it `Open`, as the body and the plan say, and doesn't touch either field.
- **The Phase 5 cases hold:** DRAG-2.1, 2.2, 2.3, 2.7 and 2.10 are still whole, DRAG-2.4 is still `Open`, and TREE-3.7 is still whole.
- **Lost coverage: none. Unknown IDs: none. No Test Planner `Manual` case is carried by a test.** DRAG-7.21's ID on DP:265 now points at a live case.
- **Regression guards:** six Fix Now findings change app code (#1, #2, #3, #28, #30, #31). #2 bears on three cases with no test: DRAG-7.23, DRAG-7.25 (`Planned`, built by the fix) and DRAG-7.26. Write DRAG-7.23's and DRAG-7.26's specs before #2's batch.

Aliases used below (line numbers are the files' at `4c11569`):

| Alias     | File                                                           |
| --------- | -------------------------------------------------------------- |
| OR        | `tests/ui/drag-7-overflow-row.spec.ts`                         |
| HM        | `tests/ui/drag-7-hierarchy-modal.spec.ts`                      |
| MH        | `tests/ui/drag-7-modal-hold.spec.ts`                           |
| TCS       | `tests/ui/drag-target-classification.spec.ts`                  |
| SD        | `tests/ui/drag-5-stub-detach.spec.ts`                          |
| PTS       | `tests/ui/project-tree-sidebar.spec.ts`                        |
| PSR       | `tests/ui/project-sidebar-resize.spec.ts`                      |
| DCB       | `tests/ui/drag-column-bands.spec.ts`                           |
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

### The scoped cases at a glance

"Surface" means a Playwright spec or a route test. Internal tests are named only where they bear on the status.

| Case      | P   | Was        | Now                            | On                 | Missing (if `Open`)                                                                                                          |
| --------- | --- | ---------- | ------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| DRAG-7.1  | P1  | Open       | **Automated** (written)        | OR                 | —                                                                                                                            |
| DRAG-7.2  | P1  | Open       | Open                           | OR                 | the two dragged-child clauses, on a test carrying the ID                                                                     |
| DRAG-7.3  | P0  | Open       | **Automated** (written)        | OR                 | —                                                                                                                            |
| DRAG-7.4  | P0  | Open       | Open                           | OR                 | the "`T` isn't there, `B` is Bottom" Given                                                                                   |
| DRAG-7.5  | P1  | Open       | **Automated** (written)        | OR                 | —                                                                                                                            |
| DRAG-7.6  | P1  | Open       | Open                           | HM                 | the release at `P`'s Card layer writing nothing; the second Given (`R`)                                                      |
| DRAG-7.7  | P1  | Open       | **Automated** (written)        | HM                 | —                                                                                                                            |
| DRAG-7.8  | P1  | Open       | **Automated** (written)        | HM                 | —                                                                                                                            |
| DRAG-7.9  | P0  | Open       | Open                           | HM                 | `R2`'s workphase after a release                                                                                             |
| DRAG-7.10 | P1  | Open       | Open                           | HM                 | the brief excursion; the Card layer's no-write; an item from outside; the box bound; the hold-opened variant under the ID    |
| DRAG-7.11 | P1  | Open       | Open                           | HM                 | the ghost staying out of the section; a carried-copy check that can fail (audit #6); the pop-out clock                       |
| DRAG-7.12 | P2  | Open       | Open                           | HM                 | a modal opened _during_ the drag; the de-emphasis                                                                            |
| DRAG-7.13 | P1  | Open       | Open                           | MH                 | the main drag: a Free Card from outside `P`                                                                                  |
| DRAG-7.14 | P1  | Open       | Open                           | MH                 | a within-gap check that can fail on a reset                                                                                  |
| DRAG-7.15 | P1  | Open       | **Automated** (written)        | MH                 | —                                                                                                                            |
| DRAG-7.16 | P1  | Open       | Open                           | MH                 | the bottom edge's committed placement; the top and left edges                                                                |
| DRAG-7.17 | P2  | Open       | Open                           | MH                 | the gap above the overflow row                                                                                               |
| DRAG-7.18 | P2  | Open       | **Automated** (written)        | MH                 | —                                                                                                                            |
| DRAG-7.19 | P1  | Open       | Open                           | HM                 | the pending mark; a hold-opened modal staying in place; the cancel's place; a no-write release                               |
| DRAG-7.20 | P2  | Manual     | Manual (the Test Planner's)    | —                  | left alone                                                                                                                   |
| DRAG-7.21 | P2  | Open\*     | Open                           | none carrying the ID at the surface (DP:265 internal) | stamp MH:448 and make it able to fail; the gap below at `L + 1`; the tab to `L`                     |
| DRAG-7.22 | P2  | Open       | Open                           | none carrying the ID (HM:523 unstamped) | stamp HM:523; the click not opening `P`'s Sheet                                                               |
| DRAG-7.23 | P2  | Open       | Open                           | none               | everything                                                                                                                   |
| DRAG-7.24 | P2  | Open (new) | Open                           | none               | everything                                                                                                                   |
| DRAG-7.25 | P2  | Planned    | Planned (not touched)          | —                  | —                                                                                                                            |
| DRAG-7.26 | P2  | Open (new) | Open                           | none               | everything                                                                                                                   |
| DRAG-7.27 | P2  | Open (new) | Open                           | none (DC:546 internal, no ID) | everything at the surface                                                                                         |
| DRAG-7.28 | P2  | Open (new) | Open                           | none               | everything                                                                                                                   |
| DRAG-7.29 | P2  | Open (new) | Open                           | none (OR:113, OR:143 assert the releases, without the ID) | the highlight drawn on the overflow row; the ID                                       |
| DRAG-7.30 | P2  | Open (new) | Open                           | none (ILO:236, :305, :315 internal, no ID) | everything at the surface                                                                            |
| DRAG-1.34 | P1  | Open       | Open                           | OR, MH             | the next hold taking a changed cue                                                                                           |
| TREE-3.11 | P2  | Open (new) | Open                           | none               | everything                                                                                                                   |

\* DRAG-7.21's table row reads `Pending PO`, and its body `Open` (Test Quality Concerns, item S).

### Each case against its _Then_

**DRAG-7.1 → Automated (written), on OR.**

- OR:23, "DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children":
  - the section's rows in order, `A`, `Q`, `R`, `R`'s overflow row, `T`, `B`, and `X` (a Stub of `P` outside the tree, which the terms allow);
  - `R1`, `R2` and `R1a` not drawn;
  - the overflow row at level `L + 1`, and `R` at `L`, by their indents;
  - rows above level `L` showing their children (`A`, `Q`), and no overflow row but `R`'s, by the row list.
- OR:50, "DRAG-7.1, DRAG-7.2: the levels count from the Card, and one hidden child reads "1 child"": `P` is a detached child at depth 2, and `R`, three levels below `P`, is drawn, while `R1` is behind an overflow row. That shows the levels counting from the Card.
- OR:76, "DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value, taken at once and kept across a reload": `L + 1` shows `R1` and `R2`, an overflow row under `R1` for `R1a`, and none under `R`.
- Low note, unchanged: "each at its level" is checked by indent only for `R` and the overflow row. The rest are checked by order. Their levels are DRAG-4's drawing, not the cut-off.

**DRAG-7.2 → Open.**

- **Asserted:** "2 children", counting neither `R1a` nor `F`, and `T` with no overflow row (OR:23); "1 child" for an only child (OR:50); "3 children" after a drop beside the row, from both gaps (OR:113, OR:143).
- **Missing:**
  1. _While `R1` is dragged, the row reads "1 child"._ HM:482 asserts exactly this, but carries only DRAG-7.6 (Proposed Stamps, item 1).
  2. _With `R1` as `R`'s only attached child, `R` has no overflow row while it's dragged._ Only ILO:309, "leaves the dragged item out of the count, and draws none when it was the only child", asserts it: internal, with no ID. A variant of HM:482 on a tree without `R2` closes it at the surface. Proposed Internal Mappings, item 3, is the alternative.

**DRAG-7.3 → Automated (written), on OR:113**, "DRAG-7.3, DRAG-7.2: between a row and its overflow row, the one state is the row's first child":

- tabbed 0, +5 and −5, the projection stays `3:L:true`: one state, at level `L + 1`, with the ghost's slot between `R` and the overflow row (gap 3), so the overflow row has slid below it;
- the release commits `R`'s child, attached, before `R1`;
- `X` isn't drawn, and the row reads "3 children".

**DRAG-7.4 → Open.**

- **Asserted:**
  - OR:143: level `L + 1` gives `R`'s last child after `R2`, and "3 children". `L + 6` clamps to it, and tabbing left stops at `T`'s level.
  - OR:176: level `L` gives `Q`'s child between `R` and `T`.
- **Missing:** _"Given instead `T` isn't there, so `B` is Bottom, then the states run from level 1 to level `L + 1`"._ No spec drives it. DP:213, "DRAG-7.4: with no row below it, the states run from the top level to R's last child, and no further", asserts it at the projection, which is internal (Proposed Internal Mappings, item 1). A spec on a tree without `T`, tabbed to 0 and to `L + 6`, closes it.

**DRAG-7.5 → Automated (written), on OR:200**, "DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only attached child":

- from `T`'s level, `L + 6` clamps to `L + 1`;
- the release makes `X` `T`'s attached child, and `G` is still `T`'s Free child;
- `X` isn't drawn, and `T`'s new overflow row reads "1 child".

The gap's shallow end, level 1, isn't driven. The case cites it to DRAG-4.8, which owns it.

**DRAG-7.6 → Open.**

- **Asserted:** HM:482, "DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card's last child":
  - the modal is open by a click, and `R1` is pulled out to `P`'s Card layer, which closes the modal;
  - zoomed back in, the projection is `7:0:true`, the last gap at level 1, and the row reads "1 child";
  - the release commits `R1` as `P`'s attached last child, with `R1a` still its child.
  - Low: the case says "below `B` … after `B`". The spec's tree has `X` after `B`, so the last gap is below `X`, and the spec asserts "after `X`". That's the rule, `P`'s last child, with the terms' outside Stub present.
- **Missing:**
  1. _"Released at `P`'s Card layer instead, before zooming back in, `R1` is set back down, and nothing is written."_ HM:297 does this for `R2`, whose slot is hidden too. But it reads only `parentId`, with no `watchWrites` (audit Watch List #37), and it carries only DRAG-7.10 (Proposed Stamps, item 3).
  2. _The second Given: `R`, whose slot the section shows, comes back in its own slot, and a release there writes nothing._ No spec drives it. DP:313, "DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before", asserts the seed only, internally (Proposed Internal Mappings, item 2).

**DRAG-7.7 → Automated (written), on HM.**

- HM:60, "DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered, with every attached descendant at its level":
  - centered in the window, within 2px;
  - the rows in the section's order (`A`, `Q`, `R`, `R1`, `R1a`, `R2`, `T`, `B`, `X`), with no overflow row among them;
  - each row's level by indent;
  - `F` and `G` absent, and no writes.
- HM:105, "DRAG-7.7: any of the section's overflow rows opens the same modal, the Card's whole hierarchy": `T`'s overflow row and `R`'s open the same list, ten rows long. Its one-shot reads can be flaky, but never pass falsely (audit Watch List #38).

**DRAG-7.8 → Automated (written), on HM:128**, "DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written": each of the three closes it, the section and its "2 children" are as before, and nothing is written. The case's last sentence cites DRAG-7.19, whose spec is HM:453.

**DRAG-7.9 → Open (narrow).**

- **Asserted:**
  - The drag starts at `P`'s Descendants layer, with no pop (HM:163).
  - Between `R1` and `R1a`: `R1`'s first child, attached (HM:163).
  - One tab right in `R2`'s own gap: `R1`'s last child (HM:191).
  - Its own gap and depth: no writes, and `R2` unchanged (HM:215).
  - An over-cap tab state reached, `…:false`, and no writes (HM:240).
- **Missing:** _"`R2` stays attached throughout, with `P`'s workphase."_ Only HM:163 reads `isAttached`, and no test reads `R2`'s `workphaseId` after a release. One assertion each on HM:163 and HM:191 closes it.

**DRAG-7.10 → Open.** The revision added the header sentence, and HM:356 covers it.

- **Asserted:**
  - HM:297: pulled to `P`'s box left of the modal, the modal closes, the context is `P`'s Card, and the release leaves `R2` under `R`.
  - HM:326: from the modal to another Card's box, the context ends at the column, the modal closes, and the release detaches `R2`: Free, its parent kept, its workphase kept. That's two pops.
  - HM:356, "DRAG-7.10: the modal's header is part of the modal: a cursor resting over it pops nothing": resting over the header for three times `popDelayMs` keeps the context and the modal.
- **Missing:**
  1. _The brief excursion:_ out of the modal's box for less than `popDelayMs` and back, the modal stays open. No test.
  2. _The Card layer's "nothing is written":_ HM:297 reads `parentId` only, with no `watchWrites`.
  3. _"An item from outside `P` attaches as `P`'s last child"_ at that layer: no test.
  4. _"Bounded by `P`'s box"_ at the Card layer: not measured.
  5. _"Opened … by a hold":_ MH:406 pulls out of a hold-opened modal and asserts the close and the Card layer, but carries only DRAG-7.18 (Proposed Stamps, item 2).
- The `popDistancePx` alternative isn't driven. It's DRAG-1.14's clock, so it's a low gap.

**DRAG-7.11 → Open.** The revision made the case say the carried copy stays inside the modal's _list_. HM:380, "DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag", asserts:

- one element carries the section's region key, and it's inside the modal; each row is registered once;
- the context and the modal stay put while the cursor rests over `P`'s section behind the backdrop;
- the carried copy inside the list, measured with `boxOf`.

**Missing:**

1. _"The ghost doesn't move to a gap in the section":_ no projection is read before or after the rest.
2. _"The carried copy stays inside the modal's list":_ the check can't fail, since `boxOf` takes off the overlay's transform (audit #6). With `paintedBoxOf` it would be whole.
3. _"The pop-out clock runs as it does anywhere outside the modal's box":_ HM:380 seeds `NO_POP`. HM:297 rests at the same kind of point, over `P`'s Card left of the modal, and pops (Proposed Stamps, item 4).

**DRAG-7.12 → Open.** HM:240, "DRAG-7.9, DRAG-7.12: a tab state past the depth cap is reachable in the modal and writes nothing, and the rows carry the drag's classification", reads `data-drop-state` `valid` and `depth-capped` on the modal's rows. **Missing:**

1. _"When the modal opens during the drag":_ HM:240 opens it by a click before the pickup, so "opening the modal changes no classification" is never exercised. A hold-opened variant, with a dragged item that has a child, closes it.
2. _"De-emphasized by `overlayDepthCappedOpacity`":_ only the state attribute is read. DRAG-2.6, the section's equivalent, is `Open` for the same reason.

**DRAG-7.13 → Open.**

- **Asserted:**
  - MH:80: the dwell shows no cue; then the cue on `R`'s overflow row, and no modal; then the modal, with the context still `P`'s Descendants.
  - MH:110: a release during the cue commits `R`'s first child, and the modal never opens.
  - MH:131: `B`, `P`'s own Stub, held below the row, opens it, and the release commits `R`'s last child. That's the case's `B` sentence and its below-the-row sentence.
  - PS:452 and PS:480 assert the clock's stages, in the approved category (a drag clock's logic).
- **Missing:** _the case's main drag, "`X`, a Free Card zoomed in from outside `P`"._ MH:80 and MH:110 drag `X`, a Stub of `P` (`overflowTree.ts:30`). The revised terms say a case holds for either origin "unless it names one", and DRAG-7.13 now names one. One spec closes it: a Free Card from another column, zoomed into `P` and on into its section, held between `R` and its overflow row through the dwell, the cue and the modal opening, with an early-release variant. It would also exercise the attach write through the overflow row.
- **Changed from the earlier run:** the same conclusion, now on the case's own words rather than a reading of the terms.

**DRAG-7.14 → Open.**

- **Asserted:**
  - _Another gap:_ MH:153's last step, "DRAG-7.14: the hold starts over when the ghost changes level or gap", moves to `A`'s gap and the hold ends.
  - _Tabbed from `L + 1` to `L` and back:_ MH:153 asserts that the hold ends, the cue goes, and tabbing back starts a fresh dwell.
  - _The cursor leaving the section:_ MH:188, "DRAG-7.14: the hold runs only with the cursor inside the section: resting outside it ends the hold". With the ghost still at `3:3:true` and the drag still the section's, the hold ends, and the cue goes. `awaitModalHold(page, null)` could pass only if no new dwell ran, so it does assert "no dwell runs until the cursor is back". Coming back starts it again.
  - PS:464 and PS:475 (approved category): a change of gap, depth or side resets the hold, and the cue goes at once.
- **Missing, in effect:** _"The carried copy moves within the gap … the hold runs on."_ MH:221 crosses the ghost's middle five times and awaits `…:cue` each time. `awaitModalHold` retries, and the seeded dwell is 300 ms, so a hold that reset would reach `cue` again inside the wait (Test Quality Concerns, item M). The half that matters, both neighbors naming one target, is asserted only by DP:242, which is internal and carries DRAG-7.13 (Proposed Internal Mappings, item 4).
- **Changed from the earlier run:** MH:188 now fits the case. The earlier run flagged it for asserting a rule the case didn't state (its item L). The Test Planner folded the rule in as the third reset.

**DRAG-7.15 → Automated (written), on MH:247**, "DRAG-7.15: the modal opens with the ghost's spot under the cursor, so a release right after commits the same placement":

- **from above the row:** the cursor is inside the modal; the ghost is painted under it, between `R` and `R1`; the projection is `3:3:true`; the context is still Descendants; a one-pixel nudge changes nothing; and the release commits `X` before `R1`;
- **from below:** the cursor is inside, the ghost under it, the projection `7:3:true` (the gap after `R2`), and the release commits after `R2`.
- Low: the second half drags `B`, since `X` is by then `R`'s child and out of the section. `B` is a childless Stub of `P`, as the terms' `X` is. Taking it out of the section leaves the gap after `R2` unchanged.

**DRAG-7.16 → Open.**

- **Right edge, whole:** MH:345 asserts the modal inside the window, the cursor inside it, and the projection moving to `6:4:true`, deeper than the hold's spot, and the release commits `R2`'s child.
- **Bottom edge, weak:** MH:306 asserts the modal pulled up inside the window, the cursor inside it, the ghost under the cursor, and the projection no longer `3:3:true`. Its write check can pass on a stale read (audit #7), and even fixed it checks only "not the hold's spot" (Test Quality Concerns, item C). "A release without moving the cursor commits that placement" isn't asserted.
- **Top and left edges:** only MP:25's `it.each` row, "DRAG-7.16: is pulled inside the window at %s", which is internal geometry. The handoff says a cursor can't be brought near them in a spec. That holds for the left edge. For the top edge, an earlier last-level row with hidden children lengthens the modal above `R`'s spot without moving `R` in the section, so one probe is worth making first. Proposed Internal Mappings, item 5, is the fallback.

**DRAG-7.17 → Open.** MH:374, "DRAG-7.17: when R's children run longer than the modal, its list scrolls to put the ghost's spot under the cursor", holds below the row with 20 extra children: the list's `scrollTop > 0`, the cursor is inside, the ghost under it, the projection holds, and the release commits after `E19`. **Missing:** _"from either gap"_. The gap above the row, as `R`'s first child, isn't driven with a list long enough to scroll.

**DRAG-7.18 → Automated (written), on MH:406**, "DRAG-7.18: after leaving the modal, a hold beside an overflow row opens it again in the same drag": the hold opens the modal; pulled out, the modal closes and the context is `P`'s Card; zoomed back in and held again, it reopens at Descendants; and the release commits `R`'s first child.

**DRAG-7.19 → Open.**

- **Asserted:**
  - HM:418: after a release in a click-opened modal, its box is unchanged; `R2` is drawn under `R1` and before `R1a`, at `R1a`'s level; and `R2` picks up again.
  - HM:453: Escape mid-drag leaves the modal open, the rows unchanged and nothing written, and Escape then closes it.
- **Missing:**
  1. _"Marked pending until the response lands … Once the response lands, `X` is unmarked, in the same place":_ `data-pending` is never read in the modal. DCB:751 (DRAG-6.1, DRAG-6.2) shows how to hold a response (`delayMoveResponses`).
  2. _The case's main Given is a modal opened during the drag:_ a hold-opened modal staying open _in the same place_ after a release isn't asserted. MH:247 checks only that it's visible. Audit #2 touches this path.
  3. _The cancel's "in the same place":_ not measured in HM:453.
  4. _"So does one whose release writes nothing":_ HM:215 doesn't check the modal after its no-write release.

**DRAG-7.20 → `Manual`, the Test Planner's.** Left alone. No title carries it. MH:31 names it in a comment, which is fine.

**DRAG-7.21 → Open.** The rule: over-cap in either gap beside the overflow row, no dwell, no cue, no modal, and nothing committed; tabbed to `L` below the row, a valid state with no hold.

- **The surface spec:** MH:448, "a ghost in an over-cap state beside an overflow row starts no hold", carries no ID. It drives the gap _above_ the row only: the projection `3:3:false`, then no modal, no hold, no cue, no writes, and `X` unmoved.
- **Why it doesn't count yet, beyond the ID:**
  1. It can pass with the defect (Test Quality Concerns, item R). It doesn't wait out the hold.
  2. The gap below the row at `L + 1` isn't driven.
  3. The tab to level `L`, valid with no hold, isn't driven.
- **The internal tests:** DP:265, "DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state", carries the ID and asserts the gate gap-agnostically (`modalHoldTarget` is null for an invalid state). DP:242 asserts that one tab left of the overflow row below it names no overflow row (`overflowBeside` null), which is the "no hold at `L`" half. Both are internal (Proposed Internal Mappings, item 7).
- **Changed from the earlier run:** the case was `Pending PO`. The PO ruled the lean, and the case is now live, with the tab-to-`L` sentence the earlier text didn't have.

**DRAG-7.22 → Open.** Narrowed to a press on the count.

- **The surface spec:** HM:523, "a press and drag from an overflow row picks nothing up", carries no ID. It presses the row's centre and moves 100px, then asserts no `data-drag-state` (so no drag of `P` or anything else, and no carried copy), the section unchanged, no modal and no writes. The centre is on the count: `StubRows.tsx::OverflowRow` draws the count as a full-width button right of the indent, and that button stops the press. So the spec fits the narrowed case.
- **Missing:**
  1. The ID (Proposed Stamps, item 6).
  2. _"When the count is clicked instead, … `P`'s Sheet doesn't open."_ HM:60 and every other spec click the count and see the modal open, but none asserts that `itemPanel(page)` stays closed.
- HM:523 hand-rolls its drag (audit #26). The fix (`pickUp`, `hoverTo`, `release`) keeps it pressing the count, since `pickUp` presses the locator's centre.
- **Changed from the earlier run:** the earlier caution that the spec doesn't press the indent no longer applies. The indent is now DRAG-7.24, a different rule.

**DRAG-7.23 → Open. No test.** A reload after a failed release in the modal leaves it open, listing the reloaded hierarchy, and a reload landing mid-drag in the modal stops the drag, writes nothing, and leaves it open.

- **Reachable in a spec:** DCB:820 (DRAG-6.6) fails a move with `page.route(…)` and waits for the board's reload. Doing that from a release in a click-opened modal covers the first half. For the mid-drag half, delay the first move's response and then fail it (as DCB:782 delays one) while a second drag runs in the modal.
- DRAG-6.15's own test is `client/src/components/workflow/useBoardDnd.test.ts:60`, which renders the hook. A spec is preferred here, since the modal staying open is BoardView's state.

**DRAG-7.24 → Open. No test.** A press on the overflow row's indent, left of the count, starts `P`'s drag, with `P` carried, and a click there opens `P`'s Sheet and not the modal. A spec presses a few pixels inside the row's left edge (inside `descendantsIndentPx(L)`), moves past the activation distance, and asserts the drag state and the carried copy's `aria-label` of `P`; and clicks there, asserting `itemPanel(page)` shows `P`, and `hierarchyModal(page, 'P')` has count 0.

**DRAG-7.26 → Open. No test.** The modal closes on a reload when `P` is gone, or when `P` has no attached descendants left, and stays open while one is left. Built in Phase 3 with no test (the earlier run noted this under DRAG-7.23). A spec opens the modal by a click, deletes `P` (or detaches its last attached child) through the API, triggers a reload as above, and asserts the modal's count. The third sentence is DRAG-7.23's, so its spec serves both.

**DRAG-7.27 → Open. No test at the surface.** `R` picked up in the section carries its overflow row, the overflow row is never the highlighted neighbor, the gap after `Q` runs to `T`, and a release as `B`'s next sibling at level 1 commits `R.parentId = P` after `B`, with `R1` and `R2` still its children. With `L` at 2, `R1` then shows an overflow row reading "1 child".

- No spec picks `R` up in the section. DC:546, "at a Descendants context: the overflow row of a traveling row, and no other", asserts the "never a neighbor" half at `travelingRowsFor`, internally and with no ID (Proposed Internal Mappings, item 8).
- A spec: seed `sectionLevels: 2`, pick `R` up, read `data-drag-projection` with the ghost just below `Q` (the next gap is `T`'s), release after `B` at level 1, then read `R`'s row and the "1 child" overflow row under `R1`.

**DRAG-7.28 → Open. No test.** A click on `R1`'s row in a click-opened modal opens no Sheet, leaves the modal as it was, and writes nothing. A spec clicks the row's title, then asserts `itemPanel(page)` closed, the modal visible with the same rows, and `watchWrites` empty.

**DRAG-7.29 → Open.**

- **The releases:** OR:113 (between `R` and the overflow row, `R`'s first child) and OR:143 (below it at `L + 1`, `R`'s last child) commit what the gap and the depth say, and never `X` as the overflow row's child. Neither carries DRAG-7.29.
- **Missing:** _"When the side highlight names the overflow row … then it's drawn on the overflow row."_ No spec reads the drop line. `dragChrome.tsx::DropSideIndicator` draws it as a child of `OverflowRow`'s element, with no data attribute. DC:432, "over an overflow row: the same shuffle-slot rule as a Stub row, and the row is named as a neighbor", asserts the naming internally (Proposed Internal Mappings, item 9).
- **To close it:** extend OR:113 (and OR:143) to read the drop line inside `overflowRow(page, r.id)` while it is the named neighbor, and stamp both with DRAG-7.29.

**DRAG-7.30 → Open. No test at the surface.** With the tree built for `L = 2` (so `A` is `Q`), the level count set below 1 in the tuning panel shows one level: `A` and `B`, with an overflow row under `A` reading "2 children".

- ILO:236 ("holds the tuning value to a whole number of at least 1"), ILO:305 ("puts the overflow row under a first-level row when one level shows") and ILO:315 ("reads a level count that is not a whole number, or below 1, as shownLevels does") cover the rule at `sectionEntries`, internally and with no ID (Proposed Internal Mappings, item 10).
- A spec in OR:76's pattern, with `fill('0')` on "Levels a section shows", closes it at the surface.

**DRAG-1.34 → Open.**

- **Asserted:**
  - OR:76: the level-count field shows its default, takes `L + 1` at once (the section redraws), and the redrawn section survives a reload.
  - OR:227: the drop math takes a seeded level count.
  - MH:481: the dwell and cue fields show their defaults and take 4000 and 7000; the next hold is still `dwell` past the default dwell; and both fields read back after a reload.
- **Missing:** _"the next hold takes the new … cue":_ only the dwell's effect is asserted. A long cue that is still `cue` past the default cue length closes it.
- DT:47 is internal and beside these surface tests. It isn't proposed.

**TREE-3.11 → Open. No test.** A chain down to `D` at depth `PCAP`, with a long name: at the default width `D` is listed under its parent with its name cut short; dragged wider, more of it is drawn, and a name that fits is drawn whole; the row always carries the full name.

- PSR's tests drive the handle and check the width, and PTS:191 (TREE-3.7) seeds the widest sidebar so every name has room. None measures a name.
- A spec: seed the chain (as PTS:191 does), and at the default width assert `projectSidebar.projectName('D…')` exists with its full text and `scrollWidth > clientWidth`. Then drag the handle wider (PSR's `dragHandleBy`, audit #25) and assert the drawn width grew, and, for a name that fits, `scrollWidth <= clientWidth`.
- The case's last clause, "a write that would put a project at depth `PCAP + 1` is refused at any width", is a server rule that no width reaches. It's TREE-3.5's, which `projects.test.ts` covers.

### The cases whose tests Phase 5 changed

- **DRAG-2.1, DRAG-2.2, DRAG-2.3 and DRAG-2.7: still whole,** on TCS:33, "DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified at pickup, stays classified while hovering, and clears on cancel". It seeds `sectionLevels: cap`, so the chain to `cap − 3` is drawn whole. It asserts `V` and `T_ok` `valid`, `T_over` `depth-capped`, `X`, `D` and `D1` `cycle-forming`, and `S` undrawn.
- **DRAG-2.10: still whole,** on boards:102 and TCS:33, which reads the cap from the board.
- **DRAG-2.4 stays `Open`.** The spec hovers but seeds `NO_POP`, so "popping, and entering and leaving contexts" isn't driven. Unchanged.
- **TREE-3.7: still whole.** projects:739 is the route half (the listing, the rename and the sibling move past the cap). PTS:191, "TREE-3.7: the sidebar shows every project of a tree past the project cap, flagging and repairing none", is the sidebar half: every name from `P1` to `P12`, `Past 1` and `Past 2` visible, and `Past 2` at the `cap + 1` indent. It seeds the widest sidebar. That doesn't weaken it against TREE-3.11's new rule, since TREE-3.7 asks only that each project is shown.
- **DRAG-7.9's Phase 5 edit:** HM:240 now rests 2px below the last row, still in the gap below it. DRAG-7.9 holds as judged above.

---

## Lost Coverage

**None.** All 287 cases that were `Automated` before this run have a test whose title (or `describe`) carries the ID. I checked the IDs that appear only once in the sweep against their titles. With this run's seven, 294 cases are `Automated`, each with at least one test title carrying its ID.

## Unknown IDs

**None.** Every ID in a test title is a case in the catalog. The IDs in `scripts/check-docs/*.test.mts` are the checker's own fixtures, inside strings.

- **Re-checked because the catalog changed:** no test title carries DRAG-7.24–7.30 or TREE-3.11. DRAG-7.21's ID on DP:265 now points at a live case, where the earlier run flagged it as on a `Pending PO` case.
- **Revised cases against the tests carrying their IDs:**
  - DRAG-7.14 now fits MH:188 (it didn't before);
  - DRAG-7.10 and DRAG-7.11 fit HM:356 and HM:380 more closely than before;
  - DRAG-7.13 still matches MH:80 and MH:110 as partial tests: they assert its stages, but not with the origin the case now names.
- **Tests carrying an ID they don't cover,** unchanged: PS:153 and DS:238 carry DRAG-7.16 but test DRAG-7.10's box (audit #22; Test Quality Concerns, item J).

**A Test Planner `Manual` case carried by a test:** none. No title carries DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25 or DRAG-7.20.

---

## Proposed Stamps

Surface tests, so they need no approval. A developer adds the ID, and the confirming run maps it.

1. **DRAG-7.2 on HM:482** ("DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card's last child"). It asserts "1 child" while `R1` is dragged, DRAG-7.2's first dragged-child clause. The handoff says so, but the ID isn't on it.
2. **DRAG-7.10 on MH:406** ("DRAG-7.18: after leaving the modal, a hold beside an overflow row opens it again in the same drag"). It pulls out of a _hold_-opened modal, DRAG-7.10's "opened by a click or by a hold".
3. **DRAG-7.6 on HM:297** ("DRAG-7.10: leaving the modal for the Card's box closes it…"), **once it watches writes** (audit Watch List #37). `R2`'s slot is hidden too, so its release at `P`'s Card layer is DRAG-7.6's last sentence for an equivalent Stub.
4. **DRAG-7.11 on HM:297.** It rests over `P`'s Card outside the modal's box, and the pop-out clock fires: DRAG-7.11's last clause.
5. **DRAG-7.21 on MH:448** ("a ghost in an over-cap state beside an overflow row starts no hold"), **once it waits out the hold** (item R), with the gap below at `L + 1` and the tab to `L` added to it or to a sibling spec. Also drop its comment that the case is waiting on the PO (MH:453).
6. **DRAG-7.22 on HM:523** ("a press and drag from an overflow row picks nothing up"). Add a click on the count asserting `itemPanel(page)` stays closed, here or on HM:60.
7. **DRAG-7.29 on OR:113 and OR:143,** once they read the drop line on the overflow row (Coverage Mapping, DRAG-7.29).

## Proposed Internal Mappings (need approval)

None is recommended over a surface test. Each is the fallback if no spec is written. Items 1–6 are the earlier run's, re-checked against the revised cases. 7–10 are new.

1. **DRAG-7.4 ← DP:213**, "DRAG-7.4: with no row below it, the states run from the top level to R's last child, and no further". It covers the `B`-as-Bottom Given. **Not recommended:** the Given is reachable in a spec.
2. **DRAG-7.6 ← DP:313**, "DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before". It covers only the seed, not "a release there writes nothing". **Not recommended:** HM:482's flow with `R` in place of `R1` reaches it.
3. **DRAG-7.2 ← ILO:309**, "leaves the dragged item out of the count, and draws none when it was the only child", once it carries DRAG-7.2. Whole for the only-child clause at `sectionEntries`. **Acceptable** if Nathan prefers it to a spec. It isn't one of the approved categories.
4. **DRAG-7.14 ← DP:242**, "DRAG-7.13: names the overflow row the ghost sits directly above or below, at its level, and no other state", once it also carries DRAG-7.14. "Either neighbor of the gap reads the same" is the within-gap half. **Recommended alongside** a stronger MH:221 (item M). The projection isn't the pop state machine, so it's outside the clock category.
5. **DRAG-7.16 (top and left edges) ← MP:25**, "DRAG-7.16: is pulled inside the window at %s". Geometry only: the dialog is pulled in, and the cursor is still inside. **Recommended for the left edge,** which a cursor can't reach. For the top edge, only if a probe confirms it's unreachable.
6. **DRAG-7.17 (the gap above the row) ← MP:40**, "DRAG-7.17: scrolls the list to bring a spot deep in it under the cursor". **Not recommended:** a long tree above `R` makes the first-child spot scroll in a spec.
7. **DRAG-7.21 ← DP:265** (already carries the ID) **and DP:242.** DP:265 asserts that an over-cap state starts no hold, whichever gap. DP:242's line 256 asserts that the tab to `L` below the row is no hold target. **Acceptable** for the "either gap" and tab-to-`L` clauses if MH:448 is fixed and drives only the gap above. Not an approved category: it's the projection, not the pop state machine.
8. **DRAG-7.27 ← DC:546**, "at a Descendants context: the overflow row of a traveling row, and no other", once it carries DRAG-7.27. It covers "never a neighbor" only. **Not recommended alone:** the release and the redrawn section need a spec anyway, and that spec can read the projection for the neighbor half.
9. **DRAG-7.29 ← DC:432**, "over an overflow row: the same shuffle-slot rule as a Stub row, and the row is named as a neighbor". It covers the naming, not the line drawn on the row or the release. **Not recommended:** Proposed Stamps, item 7, closes it at the surface.
10. **DRAG-7.30 ← ILO:305 and ILO:315** (with ILO:236), once they carry DRAG-7.30. They cover "below 1 reads as 1" and "at one level the overflow row sits under a first-level row", at `sectionEntries`. **Not recommended:** one spec in OR:76's pattern reaches it through the panel.

**Dropping existing pointers:** none. No scoped case had an Automation line before this run, and this run wrote surface files only.

## Proposed Manual (need approval)

**None.** Every `Open` scoped case can be reached by a spec, or (DRAG-7.16's left edge) by the internal mapping in item 5. DRAG-7.20 is `Manual` by the Test Planner's judgment, and is left alone.

---

## Gaps

**In scope, with what closes each:**

- **DRAG-7.2:** stamp HM:482; drive the only-child clause (a spec, or Proposed Internal Mappings, item 3).
- **DRAG-7.4:** a spec on the tree without `T`.
- **DRAG-7.6:** watch writes on HM:297 and stamp it; a spec for `R` coming back to its own slot and writing nothing.
- **DRAG-7.9:** read `R2.workphaseId` (and `isAttached`) after HM:163's and HM:191's releases.
- **DRAG-7.10:** a brief-excursion spec; watch writes on HM:297; an item from outside `P`, pulled out of a hold-opened modal and released at `P`'s Card layer as its last child; the carried copy bounded by `P`'s box (`paintedBoxOf`); stamp MH:406.
- **DRAG-7.11:** audit #6; `data-drag-projection` unchanged across the rest behind the backdrop; stamp HM:297.
- **DRAG-7.12:** open the modal by a hold during the drag of an item with a child, and read the rows' states; the opacity, unless the Test Planner reads the case as the state.
- **DRAG-7.13:** a hold by a Free Card zoomed in from outside `P`.
- **DRAG-7.14:** an MH:221 that can fail on a reset; DP:242 stamped and approved.
- **DRAG-7.16:** audit #7, plus a committed-placement check at the bottom edge (item C); settle the top and left edges.
- **DRAG-7.17:** the gap above the row with a scrolling list.
- **DRAG-7.19:** `data-pending` on and off in the modal under a held response; a hold-opened modal's box unchanged after a release; HM:453's box after the cancel; the modal still open after HM:215's no-write release.
- **DRAG-7.21:** fix and stamp MH:448; the gap below at `L + 1`; the tab to `L`.
- **DRAG-7.22:** stamp HM:523; the click not opening the Sheet.
- **DRAG-7.23, 7.24, 7.26, 7.27, 7.28, 7.30, TREE-3.11:** a spec each, as sketched in Coverage Mapping. DRAG-7.23's and DRAG-7.26's can share setup.
- **DRAG-7.29:** the drop line on the overflow row in OR:113 and OR:143, and stamp them.
- **DRAG-1.34:** the next hold taking a changed cue.

None of them looks hard enough to propose `Manual`. The fiddliest are DRAG-7.23's mid-drag reload and DRAG-7.26's reload trigger, and DCB:782's and DCB:820's patterns reach both.

**Outside scope:** the catalog's 63 other `Open` cases are the earlier run's 63, DRAG-2.4 among them. None changed.

---

## Duplication

Reported, not judged.

- **DRAG-7.3, 7.4, 7.5:** OR (the surface), and DP:179, :195, :213 and :232 (the projection).
- **DRAG-7.1, 7.2, 7.30:** OR and HM:482, and ILO:236 and ILO:281–315 (no IDs).
- **DRAG-7.6:** HM:482, PL:258, and DP:285, :303 and :313.
- **DRAG-7.13, 7.14:** MH:80–245, PS:452, :464, :475, :480 and :486, and DP:242 and :265. PS:486 (no ID) and MH:188 both assert DRAG-7.14's third reset.
- **DRAG-7.15:** MH:247, MP:18, :65, :85 and :108, and DP:371.
- **DRAG-7.16:** MH:306 and :345, and MP:25 and :71. PS:153 and DS:238 also carry DRAG-7.16, wrongly (audit #22).
- **DRAG-7.17:** MH:374, and MP:40 and :48.
- **DRAG-7.21:** MH:448 and DP:265.
- **DRAG-7.27, 7.29:** DC:432 and DC:546 at the collision layer; OR:113 and OR:143 at the surface for 7.29's releases.
- **DRAG-1.34:** OR:76, OR:227, MH:481 and DT:47.
- **DRAG-7.9 and DRAG-7.12** share HM:240.
- **BCU-1.6, TC-7.18 and TC-7.20:** boards:365 and CP:242 build one scenario (item E).
- **TC-2.8 (the done-anchor half):** PO:460 and H:580 (item H).

---

## Test Quality Concerns

### The audit's questions to the Reconciler

These are the earlier run's answers, re-checked. Only F, G and the last question change with the revised cases.

**A. PS:493–498, "a layer change clears it": confirmed, it doesn't prove its point.**

- **Why:** `away` is built by the same step PS:486 uses to show that resting outside ends the hold. So `away.modalHold` is already `null` before the layer change, and the test passes with or without the clearing.
- **What it bears on:** it carries no ID, and no case says a layer change clears the hold. DRAG-7.14 now names the cursor leaving the section, which is PS:486's subject, not PS:493's. **No status effect.**
- **The fix:** a layer change with a hold running can't be reached through `step`, since leaving the section already ends it. Either hand-build a session with a running `modalHold` and an `outsideSince` old enough that the next step pops, and assert `modalHold` is `null` after the pop, or delete the test.

**B. hier:76, "terminates against a parentId cycle": confirmed.**

- **Why:** `typeof … === 'number'` holds for `NaN` and `Infinity`, so the test proves only that `getDepth` returns.
- **What it bears on:** no case cites it. TC-5a.5's mapping is the describe at hier:160, and ATT-4.6 is on the server's `itemTree.test.ts`. **No status effect.**
- **The fix:** assert a finite value no larger than the list's length plus one, and the server's bounded value if the client is meant to agree.

**C. MH:341, `moved`: confirmed.**

- **Why:** even with #7's fix, `placed.parentId !== r.id || placed.position > R1's` holds for any write except `X` as `R`'s first child. DRAG-7.16 says the ghost goes where the cursor reads, and "a release without moving the cursor commits that placement". The spec checks only "not the hold's spot".
- **The fix:** after the modal opens, read `data-drag-projection` (gap and depth). Derive the expected parent and neighbor from the row painted directly above the ghost and the depth, and assert `X`'s `parentId` and its order against that neighbor after the write.
- **Status:** DRAG-7.16 is `Open` on this, before #7 and after it, until the write check is specific (and the top and left edges are settled).

**D. deep:68–71: confirmed, it proves the wrong rule.**

- **Why:** it asserts `workphaseId:position` unique among Free items, the seed's per-workphase counter. A Free item's position scope is its whole workflow (wiki item-positioning §2; TC-2.10).
- **What it bears on:** no ID, and no case. **No status effect.**
- **After #1:** assert positions unique across every Free item of the seed's one workflow, under a retitled test. With #9, assert a depth from the constants, not a project count.

**E. boards:365 (BCU-1.6) and CP:242 (TC-7.18, TC-7.20): confirmed overlap. Each case is whole, and neither test is tautological.**

- Both move `P1` from `Q1`'s workflow to `Q2`'s, and both assert that `X` keeps `w1` and is in Unsorted on a `WF2` board.
- BCU-1.6 is whole on boards:365; its Unsorted line is beyond its case. TC-7.20 and TC-7.18 are whole on CP:242.
- **No status effect.** Optionally drop the Unsorted line from boards:365, or stamp TC-7.20 on it.

**F. Audit #6 (DRAG-7.11).**

- **Today:** the carried-copy check at HM:409–414 can't fail. The revised case now names this clause explicitly ("held to the modal's list"), so the defect sits on the case's own words. The ghost staying out of the section isn't asserted, and the pop-out clock clause isn't in this test. **Open.**
- **After #6 alone:** still **Open**, on the projection check and the pop clock (Gaps).

**G. Audit #7 (DRAG-7.16's bottom edge).**

- **Today:** a stale read can pass it whatever the release wrote. **Open.**
- **After #7:** still **Open**, on item C and the top and left edges.

**H. Audit #8 (TC-2.8).**

- PO:460 can pass on a refused setup create, and asserts only the 400.
- TC-2.8 is **`Automated`** regardless: H:580 ("TC-2.8: a done Free item cannot be an anchor, and the refused move writes nothing") is whole for the done-anchor half, and PO:435 for the nonexistent anchor. After #8, PO:460 becomes a sound second test.

**I. Audit #21 (DRAG-7.10's title at HM:297).** The title promises a second pop the test doesn't drive. HM:326 drives it and also carries DRAG-7.10, so the case's "two pops" is asserted by the pair. DRAG-7.10 is **Open** for other reasons, which the title fix doesn't touch.

**J. Audit #22 (PS:153 and DS:238 carry DRAG-7.16).** They test that the modal's dialog bounds the layer, which is DRAG-7.10's box, now in its text. They have **no effect on DRAG-7.16's status**. Retitled to DRAG-7.10, neither would be proposed, since HM:356 covers the header at the surface. PS:153 would fall in the approved clock category (what keeps the pop-out clock from starting), DS:238 wouldn't.

**K. "DRAG-7.1–7.19 and DRAG-1.34 still read `Planned` though specs carry their IDs":** resolved. The Test Planner made them `Open` (`4c11569`), and this run moved the seven whole ones to `Automated`.

### Concerns from this run

**L. The earlier run's "which `X`" (its item K): closed for placement, and sharper for DRAG-7.13. Low.** The terms now let `X` be a childless Stub of `P` outside the tree, which `overflowTree.ts:30` seeds. DRAG-7.13 names a Free Card from outside `P`, so its specs need one (Coverage Mapping).

**M. MH:221 can't fail on a reset. Medium.** Unchanged from the earlier run.

- **Why:** `awaitModalHold` retries, and the seeded dwell is 300 ms, so a reset hold reaches `cue` again inside the wait.
- **The fix:** after each crossing, read `data-drag-modal-hold` without retrying (`expect(await dragMachine(page).getAttribute('data-drag-modal-hold')).toBe(…)`), with a dwell of a few seconds so a reset would read `dwell`. Or keep the cue running and check, without retrying, that the cue's `since` didn't move. Either stays a check on the clock's logic.

**N. HM:240 (DRAG-7.12) opens the modal before the drag, and reads the state, not the de-emphasis. Low.** See Coverage Mapping, DRAG-7.12.

**O. DT:47 pins the hold's defaults to a Card zoom-in's dwell and cue. Low.** That's the plan's starting value. Wiki §3.1 leaves the values to tuning, and DRAG-1.34 doesn't name them. If Nathan's hands-on retunes one, the test fails for no rule.

**P. OR:23's "each at its level" is checked by indent for `R` and the overflow row only. Low.**

**Q. HM:523 hand-rolls its drag (audit #26), and MH:458's comment says "X is a child of R" (audit Informational #69). Low.** Both now bear on stamps (Proposed Stamps, items 5 and 6).

**R. MH:448 can pass with the defect it guards against. Medium. New.**

- **Why:**
  - `expect(hierarchyModal(page, 'P')).toHaveCount(0, { timeout })` passes the moment the count is 0, which it is right away. It doesn't wait out the hold, though its comment says "well past the whole hold".
  - `awaitModalHold(page, null)` retries until no hold is running. If a hold wrongly ran, it would read `dwell`, then `cue`, then clear itself when the modal opened (with `QUICK`, after 500 ms), and then the wait passes.
  - With the modal open, the cue check still passes, and the release in the modal, still over-cap at the same depth, writes nothing. So every assertion passes.
- **The fix:** wait the hold out first, as HM:356 waits out the pop clock: `await page.waitForTimeout(clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs))`. Then assert the modal's count is 0. And read `data-drag-modal-hold` without retrying, at least once mid-dwell. The wait is a margin over seeded values, not a tuned threshold, so this is still the clock's logic.
- **Status:** DRAG-7.21 is `Open` until this lands, whatever else is added.

**S. DRAG-7.21's status is written two ways. For the Test Planner. New.** Its status-table row reads `Pending PO`, and its body reads `Status: Open` with a Rule field. The plan's "Done 2026-10-28" says it's `Open`. This run counts it `Open` in the totals and leaves both fields alone: the move from `Pending PO` is the Test Planner's. `check:docs` doesn't compare the table with the body.

**T. No spec asserts that a click on an overflow row's count leaves `P`'s Sheet closed. Low. New.** It's DRAG-7.22's second sentence, and its only defense is `OverflowRow`'s `stopPropagation`.

No mapped test was found tautological. The tests in items A–D and R, and HM:409–414, are the ones that can't fail on their subject.

---

## Uncatalogued Tests

In the story's new and changed test files only.

**Gate and support, with no standalone rule:**

- **DP:** :273, "reads an owner that is no row as no row named: below everything"; :319, "in the hierarchy modal, which draws every level, its own slot is its own"; :325, "shows no overflow row, and clamps nothing, once the levels it holds are all shown".
- **MP:** :54, "keeps a dialog taller or wider than the window at the margin"; :93, "a ghost above the slot lands after the row it is moved to"; :98, "rows that travel with the ghost are not counted"; :120, "is null when the ghost is not in the list…"; :133, `nearestRowIndex`.
- **ILO:** :247 and :253, `overflowRowId`; :281–:300 and :320, `sectionEntries`, the internal side of DRAG-7.1 and DRAG-7.2, with no IDs; :305 and :315, under Proposed Internal Mappings, item 10; :309, under item 3.
- **DS:219,** "a section element outside its Card in the DOM resolves under the parent it names".
- **DC:** :123, "a Descendants context: an overflow row inside the section is a candidate"; :145, "excludes an overflow row from a Card drag, as it does a Stub row"; :511 and :523, the row-type predicates. (DC:432 and :546 are under Proposed Internal Mappings, items 8 and 9.)
- **PS:493,** "a layer change clears it" (item A).
- **deep,** all of it: dev tooling for the deep seed (items D and #9).
- **The resizable sidebar:** `client/src/components/sidebar/sidebarWidth.test.ts` and `useSidebarResize.test.ts`, every test; and PSR's five tests ("the sidebar starts at its default width", "dragging the handle on the right edge sets the sidebar's width", "the sidebar stops at its widest and narrowest", "the width a user dragged the sidebar to is kept across a reload", "a project still drags to a new place in a resized sidebar"). The width is a working placeholder (D2), so no cases come from it. TREE-3.11 uses the handle, but its rule is about the name, and none of these measures one.

**Genuine scenarios the catalog lacks:**

- **ILO:236's whole-number half,** "3.9 reads as 3". DRAG-7.30 now holds the "at least 1" half. Wiki §9 says only "at least 1".
- **PS:486,** "resting outside the section ends the hold: it runs with the cursor inside": no longer uncatalogued. It's DRAG-7.14's third reset, and in the approved clock category. It carries no ID; stamping it is optional, since MH:188 covers that reset at the surface.
- MH:448 and HM:523 are no longer uncatalogued: they're DRAG-7.21's and DRAG-7.22's, waiting on stamps.

## Candidate New Cases

The earlier run's candidates, re-checked:

1. **The hold runs only with the cursor inside the section:** now DRAG-7.14's third reset. **Closed.**
2. **The level count is read as a whole number of at least 1:** "at least 1" is now wiki §9 and DRAG-7.30. **The whole-number half stays a candidate,** a **PO gap**: §9 doesn't say a fractional value is cut down, and the PO may rule it an implementation detail of the panel. Test: ILO:236 (`shownLevels(3.9)` is 3), ILO:315.
3. **A dragged Stub at the last shown level takes its overflow row with it:** now wiki §9 and DRAG-7.27. **Closed.**
4. **A workflow create naming `templateId: ""` or `sourceWorkflowId: ""` is refused, and nothing is created.** The rule is in the wiki (row-references §1), so it's a **Test Planner gap**, but no page names these two fields as references. The plan routed that question to the PO ("For the PO", from this run's predecessor). **Still open.** Audit #3 adds the refusal tests.
5. **An item's agent that names no row is refused:** a Test Planner gap, from `docs/archive/test-reconciliation-a6-last-round.md`, Candidate New Cases, item 1. **Still open.**

No new candidate from this run. Every rule wiki §7.3 and §9 now state has a case.

---

## Regression guards for the audit's Fix Now

For the Coder, before each batch: what a regression in the touched behavior would trip, and where nothing would.

**#1, the deep seed's Free positions** (`server/src/db/deepSeed.ts`):

- **Cases:** none. It's a dev seed. The rule is item-positioning §2's (TC-2.10), which governs API writes.
- **Tests:** deep, "seeds rows as the API would write them…", which must itself change with the fix (item D). deep's other tests guard the seed's shape.
- **No test:** anything that checks the deep stack's board orders and places as the API would. Nothing reads `deep.db` but deep.

**#2, a hold-opened modal remounting with no drag** (`client/src/components/BoardView.tsx`, `client/src/components/HierarchyModal.tsx`):

- **Cases:**
  - DRAG-7.7 (a click opens it centered; `Automated`);
  - DRAG-7.15, 7.16, 7.17 (a hold places it at the cursor; 7.15 `Automated`) and DRAG-7.18 (reopened; `Automated`);
  - DRAG-7.19 (it stays where it is after the drag ends);
  - **DRAG-7.23** (a reload leaves it open, `Open`): the fix must keep this;
  - **DRAG-7.25** (`Planned`): after a reload, a hold-opened modal is centered. This is what the fix builds. Its last sentence, a click-opened modal staying centered, holds today;
  - **DRAG-7.26** (`Open`): the modal closes when its Card is gone or has no attached descendants. The fix touches the same mount and the same BoardView state.
- **Tests that would catch a regression:**
  - HM:60 (DRAG-7.7, centering) and HM:418 (DRAG-7.19, a click-opened modal's box unchanged after a release);
  - MH:247 (DRAG-7.15), MH:306 and MH:345 (DRAG-7.16), MH:374 (DRAG-7.17) and MH:406 (DRAG-7.18). A guard that stopped a hold-opened modal from placing itself would fail MH:247's `expectInside` and `expectGhostUnder`.
- **No test:**
  - **Failure scenario (a)**, a resync after a release in a hold-opened modal. Nothing asserts that the modal comes back, or where. That's DRAG-7.23's spec plus DRAG-7.25's.
  - **Failure scenario (b)**, a release between the hold running out and the modal mounting. Hard to time in a spec. After the fix, it's DRAG-7.25's centering on a mount with no session.
  - DRAG-7.26's closing, built in Phase 3 and untested.
  - A hold-opened modal's box after a release (DRAG-7.19's missing part).
- **Order:** write DRAG-7.23's spec (click-opened, with a failed write, as in DCB:820) and DRAG-7.26's before the batch, since both describe behavior that holds today and that the fix must keep. Write DRAG-7.25's spec with the fix. A hold-opened variant of DRAG-7.23's spec fails today on the corner placement, which is the defect, so it goes in with the fix too. The Test Planner moves DRAG-7.25 to `Open` once the PO takes its marker off.

**#3, `POST /workflows` with `templateId: ''` or `sourceWorkflowId: ''`** (`server/src/routes/workflows.ts`):

- **Cases:** none directly (Candidate New Cases, item 4). TREE-10.1 and TREE-10.4 create workflows through the route.
- **Tests that would catch a regression:**
  - workflows:145 and :154 (a template or source that doesn't exist is a 400);
  - workflows:163 and :182 (cloning from each);
  - workflows:201 (neither given: a bare workflow). The new guard must keep an omitted field valid;
  - workflows:213 (TREE-10.4) and :230 (TREE-10.1), and `tests/api/workflows.spec.ts`;
  - every E2E spec, through `tests/helpers/seed.ts::seedTemplatedWorkflow`.
- **No test:** a `null` `templateId` or `sourceWorkflowId`. The fix treats `null` as none, and no test sends it.

**#28, one browser-storage module for the drag tuning and the sidebar width** (`client/src/components/workflow/dragTuning.ts`, `client/src/components/sidebar/sidebarWidth.ts`):

- **Cases:** DRAG-1.31 and DRAG-1.34 (`Open`), and DRAG-7.1's level count (`Automated`), whose values persist in the browser.
- **Tests that would catch a regression:**
  - DT, all of it;
  - `sidebarWidth.test.ts`, including "is the default when there is no storage, or reading it throws" and "does nothing without storage, and survives a write that throws", and `useSidebarResize.test.ts`;
  - OR:76 ("DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value, taken at once and kept across a reload") and MH:481 ("DRAG-1.34: the modal hold's dwell and cue are tuning-panel values…");
  - PSR, "the width a user dragged the sidebar to is kept across a reload";
  - every E2E spec that seeds tuning through `seedDragTuning`, the load path. A broken read fails the drag suite broadly.
- **No test:** a refused write for the drag tuning (the guard the fix adds); the panel's `onChange` surviving a throwing `setItem`; `dragTuning.ts` reading through a throwing `getItem`.

**#30, `modalPlacement.ts` calling `descendantsIndentPx`** (`client/src/components/workflow/modalPlacement.ts`):

- **Cases:** DRAG-7.15 and DRAG-7.16 (the depth read at the cursor).
- **Tests that would catch a regression:** MP:65 and MP:71; MH:247 (`3:3:true` and `7:3:true` right after opening); MH:345 (`6:4:true` at the right edge).
- **Note:** MP:65 and MP:71 check `cursorXInList` against `depthAtCursor`, both in the one module, so a change to both that drifts from the rendered indent passes them. The E2E specs are the ones tied to the real indent.

**#31, `HierarchyModal.tsx` calling `travelingRowsFor`** (`client/src/components/HierarchyModal.tsx`):

- **Cases:** DRAG-7.15, 7.16 and 7.17 (the spot under the cursor). DRAG-7.27 shares `travelingRowsFor`, but the modal has no overflow rows, so the fix doesn't change what it reads there.
- **Tests that would catch a regression:** MP:98, "rows that travel with the ghost are not counted" (the pure `gapAtSlot`); DC:540 and DC:546 (`travelingRowsFor` itself); and MH:247, MH:345 and MH:374, for an item with no subtree.
- **No test:** a hold that _opens_ the modal while dragging an item with descendants. Every opening spec drags a childless `X` or `B`, and MH:448's `X` has a chain but never opens the modal. That's the one path where the traveling rows decide the slot. DRAG-7.12's missing hold-opened variant (an item with a child) would cover it, so one spec serves both.

**Comments, docs, tests or scope-script only, with no app behavior to guard:**

- #4, #5, #29: `scripts/audit-scope/`.
- #6, #7, #8, #18, #20, #21, #22, #26, #27, #32, #33, #34, #35: tests. #6 and #7 bear on DRAG-7.11 and DRAG-7.16 (items F and G). #26 bears on DRAG-7.22's stamp (item Q).
- #9: the seed's header comment and its test.
- #10–#17, #23, #24: comments.
- #19: a Bruno request's doc.
- #25: a comment, or a test helper move.

---

## Totals

**Status changes in this run:** seven, `Open` → `Automated`: DRAG-7.1, 7.3, 7.5, 7.7, 7.8, 7.15, 7.18 (P0: 7.3; P1: 7.1, 7.5, 7.7, 7.8, 7.15; P2: 7.18). No case went back to `Open`.

**The whole catalog: 389 cases.** That's the earlier run's 381, plus DRAG-7.24–7.30 and TREE-3.11. DRAG-7.21 is counted `Open`, as its body reads (item S).

| Status     | P0      | P1      | P2     | Total   |
| ---------- | ------- | ------- | ------ | ------- |
| Automated  | 113     | 131     | 50     | 294     |
| Open       | 23      | 40      | 23     | 86      |
| Manual     | 0       | 2       | 3      | 5       |
| Planned    | 0       | 0       | 2      | 2       |
| Pending PO | 0       | 0       | 2      | 2       |
| **Total**  | **136** | **173** | **80** | **389** |

**By folder:**

| Folder                  | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2)                          | Other                                                                                       |
| ----------------------- | ----- | -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| board-drag-interaction  | 145   | 58 (30/25/3)         | 81 (22/39/20)                            | 5 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25, 7.20; 0/2/3); 1 `Planned` (DRAG-7.25, P2)          |
| item-positioning        | 80    | 77 (43/29/5)         | 2 (0/1/1): TC-6.11, TC-5.15              | 1 `Pending PO` (TC-6.13)                                                                    |
| item-attachment         | 75    | 72 (30/26/16)        | 1 (1/0/0): ATT-4.9                       | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11)                                           |
| project-tree            | 55    | 53 (7/30/16)         | 2 (0/0/2): TREE-1.13, TREE-3.11          | —                                                                                           |
| boards-columns-unsorted | 34    | 34 (3/21/10)         | 0                                        | —                                                                                           |
| item-sheet              | 0     | —                    | —                                        | `INDEX.md` only                                                                             |

**The story's Scope (32 cases):** 7 `Automated`, 23 `Open` (DRAG-1.34, DRAG-7.2, 7.4, 7.6, 7.9–7.14, 7.16, 7.17, 7.19, 7.21–7.24, 7.26–7.30, TREE-3.11), 1 `Manual` (DRAG-7.20), 1 `Planned` (DRAG-7.25), and DRAG-7.21's table row to reconcile.

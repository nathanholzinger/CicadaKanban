# Epic 3.5 Story 8.8 — A pickup takes its descendants with it

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.8 entry and Nathan's design (2026-11-04) · **Status:** built and settled, for review and commit: the collapse replaces 8.5's rows, every pickup carries its branch, and the line shows under the copy in both forms. The handoff is written

## Goal

A trial of carrying a dragged Stub's branch with it, in place of Story 8.5's dimmed rows.

**Nathan's design** (2026-11-04):
- When a Stub with descendants is picked up, the descendant rows collapse into it.
- The carried Stub becomes two lines tall. The second line reads "+ X children, Y total descendants".
- When the drag ends, the branch is drawn as a tree again.

**Extended after the hands-on** (Nathan, 2026-11-04; Amendment 3): every pickup carries its branch, a Card's as well as a Stub's, and the second line shows under the copy in both its forms.

**What happens today** (Story 8.5, wiki board-drag-interaction §4.1 and §7.2):
- The dragged Stub's descendants stay drawn where they are, at Low.
- The drag passes over them, and never names one as the ghost's neighbor (`dragCollision.ts::travelingRowsFor`).
- The carried copy is one Stub row.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds it, and Nathan tries it hands-on.
- He decides whether it replaces 8.5's dimmed rows.
- The PO and the Test Planner write the docs after.
- No new drag specs. A drag spec that fails because it pins today's look is skipped with a one-line reason, for Story 10.

**Out of scope:**
- **A Card's attached children drawn on its copy.** A dragged Card is a shortCard, and its attached children aren't drawn (§5a). That stays. From Phase 4 the copy shows their count, not their rows (D7, D8).
- **A two-line ghost.** Nathan chose the copy alone to start. If a one-row ghost reads wrong hands-on, growing it is a follow-up.
- **Free descendants.** They're Cards in their columns, and they stay where they're drawn, at their tier.
- **An animation** for the collapse or the expansion. Like the ghost's expansion on drop (§5a), it's instant. How either should move is "The cues' final look"'s.
- **The second line's final look.** It's a working placeholder for "The cues' final look".
- **The project sidebar.** It keeps its descendants drawn in place (Story 8.7). Its collapse is Story 8.11's.

## Scope

- **Wiki passages:** none ahead of the build. The PO writes the rules once Nathan approves a solution (code first).
- **Test-plan cases:** none until then. The Planner derives them after the PO's pass.

## Inbound deferrals

None. The roadmap's 8.8 entry is the story's own finding, and nothing else was routed to it.

## Approach and phases

### Decisions

**D1. What collapses: the branch** (Nathan, 2026-11-04: count only the rows that collapse).
- **The branch is the dragged Stub's attached descendants,** through attached links only. That's the rows its section draws under it, and the rows an overflow row of the branch stands for.
- **A Free descendant isn't part of it, nor is anything under one.** A Free child of the Stub is a Card in a column, and its own Stubs are in that Card's section. They stay where they're drawn, at Low or Mid, as today.
  - So the branch isn't `classification.subtreeIds`, which holds every descendant, Free ones included. It's a set of its own, and the count and the hiding read the same set.
- **It's read once at pickup,** from the tree the board draws: the pending one, with placements, as the tiers are. It's held for the whole drag, as the tiers are (§4.1, "One tier for the whole drag").
- **A Stub with no attached descendants** is picked up as today: one line, nothing collapses.

**D2. Where the branch leaves.** Every list that draws it, for the whole drag:
- the section of the Card that holds the dragged Stub;
- the hierarchy modal (`HierarchyModal.tsx`);
- the static rows a section draws under the modal's backdrop.

These all draw `itemListOps.ts::sectionEntries`, which already leaves the dragged item out of an overflow row's count. Leaving the branch out there, with the overflow rows its rows own, covers all three.
- **The placement math doesn't change.** The projection already leaves the dragged subtree out of its rows (`descendantsProjection.ts`, `toRows`), so the gaps and depths offered are the same. Only where they're drawn moves.
- **The rows below the branch move up at pickup,** by its height. That's the jump 8.5 avoided and the zoom-in morph's story is about. The trial is how Nathan finds out whether it reads badly.
- **What the drag measures after pickup has to see the collapsed layout.** That covers dnd-kit's droppable rects, the Card's box the copy is clamped to (`dragOverlayGeometry.ts::clampToCurrentContext`), and the pop regions. Rendering the collapse from the same state that starts the drag should do it. The Coder checks each.

**D3. The copy's second line** (Nathan's wording). Phase 4 lifts its two limits below, "Only while the copy is a Stub" and "Only on a Stub's pickup" (D7, D8).
- **"+ X children, Y total descendants".**
  - X is the Stub's attached children.
  - Y is the whole branch.
  - When every descendant is a child (Y equals X), it reads "+ X children" alone.
  - One child reads "+ 1 child".
- **Only while the copy is a Stub:** at the Descendants layer, and in the hierarchy modal.
  - Popped out to a column, the copy is a shortCard and shows none. shortCard keeps its one exact height, which the drop bands reserve (§5).
  - Zoomed back into a section, the second line shows again.
- **Only on a Stub's pickup.** A Free Card zoomed into a section has a Stub copy too. It isn't a Stub's pickup, so it shows no line (Out of scope).
- **Its look is a placeholder:** the overflow row's text style (`StubRows.tsx::OVERFLOW_TEXT_CLASS`) is a natural start. The Coder's call.

**D4. The copy's measured box stays one row, and so does the ghost** (Nathan, 2026-11-04: copy only to start).
- **The second line hangs below the title line,** outside the box dnd-kit measures, for example absolutely positioned under the overlay's child. Three things read that box as one row today, and keep reading it:
  - the lean (`dragCollision.ts::dropAnchorFor`);
  - the re-anchor at a form switch (`useBoardDnd.ts`, `reanchorOverlayTransform`);
  - the clamp.
- **The ghost stays one Stub row.** The side highlight and the gap math read one known row height (§5a).
- **What follows:**
  - **The second line covers the row just below the ghost,** the gap the user may be aiming at. That's the blue line hidden under the copy today (the zoom-in morph's story), one row worse.
  - **The clamp bounds the one row,** so at a section's last row the second line can hang past the Card's bottom edge. That's acceptable for the trial.
  - **The depth cue's step** moves both lines.
  - **The over-cap outline** wraps the title line or both lines. The Coder's call.

**D5. When the drag ends, the branch is drawn again,** at once:
- **On a drop:** under the item, where the preview puts it (§10).
- **On a cancel, a release that writes nothing, or a release past the cap:** where it was.
- **On a forced stop:** where the reloaded board draws it.

**D6. Behind a switch in the tuning panel, off by default, for the trial.** Settled at the hands-on: the collapse replaces 8.5's rows, and the switch is gone (Amendment 2).
- **A boolean in `dragTuning.ts`, with a checkbox in `DragTuningPanel.tsx`,** beside the forced-stop flash's.
  - The name is the Coder's: `collapseCarriedBranch`, for example.
  - **Off is today's drag:** 8.5's dimmed rows, unchanged.
- **Off by default,** so the drag specs stay as they are until Nathan decides. A spec that seeds the tuning gets the default, if `loadDragTuning` fills in a missing key. The Coder checks.
- **Everything else 8.5 draws stays,** with the switch on or off: the tier of every other target, including a Free descendant and the Stubs in its section.
  - With the switch on, the branch's rows aren't drawn, so their Low isn't seen. The walk still classifies them, and `travelingRowsFor` still guards the drag with the switch off.

**D7. Every pickup carries its branch** (Nathan, 2026-11-04; Phase 4).
- **A Card's pickup reads its branch as a Stub's does:** `carriedBranchOf`, once, at pickup, over the board's placement-aware accessor. For a Free Card, that's its attached descendants, the rows of its own section at every depth. A Free child of the Card isn't part of it, nor is anything under one (D1).
- **What it changes besides the line:**
  - **Today a carried Free Card's children are drawn under its previewed row** when it zooms into a section, at Low (Amendment 2). They leave every list that draws them, as a Stub's branch does (D2): the section, the hierarchy modal and the static rows under its backdrop. `sectionEntries` already takes the branch's ids, so the lists need nothing new.
  - **So the zoom adds one row to the section, not the branch's rows,** and the rows below the ghost move down less at the zoom-in.
- **`travelingRowsFor` likely goes.** A carried Free Card's children were the last rows it stepped past (Amendment 2). Once they're out of the lists, no drawn row is a descendant of the carried item.
  - The Coder checks that no such row is left before removing it, `HierarchyModal.tsx`'s use included.
  - If it goes, its tests go with it, and the handoff says so.
- **Phase 3 realigned two tests** to model a Free Card's drag with its children drawn (Amendment 2). No drag does that now, so they're realigned again or retired.

**D8. The line shows under the copy in both forms** (Nathan, 2026-11-04: under the shortCard, as under the Stub; Phase 4).
- **Stub form:** as D3 and D4 have it.
- **shortCard form:** the same `StubRows.tsx::CarriedBranchLine`, hung under the shortCard's box, outside the box dnd-kit measures.
  - The copy's box stays `SHORT_CARD_HEIGHT_PX`. So the drop bands' reservation (§5), the lean, the clamp and the re-anchor all read what they read today.
  - **The shortCard copy's root is `overflow-hidden`** while it's ghost-like, which would clip a line hung outside it. Either the clip moves to the copy's content, or the line hangs from a wrapper. The Coder's call.
  - The line turns with the copy's `rotate-2`, so it reads as part of it.
- **Through every switch,** both ways: a Card zoomed into a section keeps its line as a Stub, and a Stub popped out to a column keeps its line as a shortCard. The branch is held on the session (D1), so only the drawing changes with the form.
- **The ghost shows none,** in either form (D4).
- **What follows:**
  - **At a column, the line covers the top of the Card below the ghost,** and the gap above that Card. It's D4's covered row, at a column.
  - **At a sub-row, the clamp bounds the shortCard alone,** so the line can hang past the sub-row's bottom, as D4's can hang past a Card's.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus the E2E runs the phase names, against the test servers.

**Phase 1: the trial, behind the switch** (D1–D6).
- **The switch,** in the tuning and the panel.
- **The branch at pickup:**
  - a pure walk over the drawn tree, through attached children only, which returns the branch's ids and its two counts;
  - beside `itemListOps.ts::getAttachedChildrenFrom`, or wherever its header says it belongs;
  - held on the drag's session for the drag.
  - **A note on the session:** four test files write a whole `DragSession` by hand (the closed mid-Story 8 audit's #19). A required field is an edit in each of them. A fixture in `client/src/test/`, like `makeItem`, would make it one. The Coder's call, optional or a fixture.
- **The lists leave the branch out** while the switch is on: `sectionEntries` takes the branch's ids, as it takes `activeId`, and drops their rows and the overflow rows they own.
- **The copy's second line,** in `KanbanCard.tsx`'s overlay-Stub branch, by D3 and D4. `BoardView.tsx` hands it the branch's counts beside `overlayProjection`.
- **Tests** (unit and component tests work as usual):
  - **the walk:**
    - children and the whole branch;
    - a Free child left out, with everything under it;
    - rows past the section's shown levels counted;
    - a placement-previewed row read where the board draws it;
  - **the wording:** "+ 1 child", "+ X children" alone, and both counts;
  - **`sectionEntries`:** the branch's rows and their overflow rows left out, every other row and overflow count unchanged;
  - **the copy:** the second line shows only in the Stub form, with a branch, with the switch on.
- **Gate:** `npm run check` and `npm run test:e2e`. With the switch off, nothing should change there.

**Phase 2: Nathan's hands-on**
- **Where:**
  - the dev stack, for a Stub with children and grandchildren;
  - the deep stack (`npm run seed:deep`, then `npm run dev:deep` in `server/` and `client/`), for a branch past the section's shown levels and for the hierarchy modal.
- **Turn the switch on in the panel,** then try:
  - **Pick up a Stub with a branch.**
    - The branch leaves, and the rows below move up.
    - The copy reads, for example, "+ 2 children, 5 total descendants".
  - **Aim at the gap just below the ghost.** The second line covers the row there. Does the ghost, or the line, still read?
  - **Move right and left through depths.** Both lines step together.
  - **Pop out to a column:** the copy is a shortCard, with no second line. **Zoom into another Card's section:** the second line again.
  - **A Stub with a Free child:** the child's Card stays in its column, and the count leaves it out.
  - **A branch past the shown levels:** the count includes the rows its overflow row stood for.
  - **In the hierarchy modal:** the branch is gone from its rows too.
  - **End the drag every way:** a drop, Escape, a release that writes nothing, and a release past the cap. Each draws the branch as a tree again, where D5 says.
  - **Turn the switch off** and compare with 8.5's dimmed rows.
- **Nathan decides:** the collapse replaces 8.5's rows, 8.5's rows stay, or the trial changes and the plan is amended.

**Phase 3: settle**
- **If the collapse replaces 8.5's rows:**
  - the switch goes, and the collapse is how a Stub's drag draws its branch;
  - the code only the switched-off path used goes with it. Check `travelingRowsFor`: in a section it may have nothing left to step past, while it still guards the modal;
  - a drag spec that now fails because it pins the branch's rows at Low is skipped with a one-line reason, for Story 10.
- **If 8.5's rows stay:** the switch and the collapse's code go.
- **The Coder writes the handoff.**
- **Gate:** `npm run check` and `npm run test:e2e`.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

**Phase 4: every pickup carries its branch, and the line shows in both forms** (D7, D8).
- **The pickup:** `useBoardDnd.ts::handleDragStart` reads the branch for a Card's pickup too.
- **The copy:** `KanbanCard.tsx` draws the line in the shortCard form as well, by D8. `overlayBranch` and its doc, which say Stub form only today, cover both forms.
- **`travelingRowsFor`,** by D7.
- **Names and comments that say "a Stub's pickup"** and now mean every pickup:
  - `carriedBranchOf`'s `stubId`;
  - `DragSession.branch`'s comment, "Null for a Free Card's drag";
  - `workflow/AGENTS.md`'s map, which says a carried Stub takes its branch with it.
- **Tests:**
  - **the pickup:** a Free Card with attached descendants holds its branch. One with none, or with only Free children, holds none;
  - **the section and the modal:** a carried Free Card zoomed in draws its previewed row, and not its branch;
  - **the copy:**
    - the line in both forms with a branch, and in neither without one;
    - the shortCard copy's box stays shortCard's height, with the line outside its flow;
    - the in-list ghost shows none, in either form.
- **Gate:** `npm run check` and `npm run test:e2e`. Some drag specs may fail because they pin a carried Card's children drawn under its row, or a copy with no line. Each is skipped with a one-line reason, for Story 10.

**Phase 5: Nathan's hands-on, and the handoff**
- **Where:**
  - the dev stack;
  - the deep stack, for a branch past the section's shown levels and for the hierarchy modal.
- **Try:**
  - **Pick up a Card with attached descendants.** The shortCard copy has the line under it.
  - **Zoom it into another Card's section.** The Stub copy keeps the line, and the Card's children don't appear under the ghost.
  - **Pop it back out.** The shortCard keeps the line.
  - **Pick up a Stub with a branch, pop it out to a column, and zoom back in.** The line stays through both switches.
  - **At a column, aim at the Card just below the ghost.** The line covers its top. Do the bands and the side line still read?
  - **At a sub-row's bottom,** the line hangs past it.
  - **A Card with only Free children:** no line.
  - **In the hierarchy modal,** with a Card carried in: its children aren't among the rows.
  - **End the drag every way** (D5).
- **Nathan decides:** it stays as built, or the plan is amended.
- **The Coder extends the handoff.** What Phase 4 adds:
  - **For the PO:**
    - §5a's shortCard bullet: a dragged Card's attached children stay unrendered, and its carried copy now shows their count;
    - the handoff's decision "The second line shows only while the copy is a Stub", which D7 and D8 replace;
    - hierarchy-placement §7's "the dragged entry's descendants are Low": the handoff keeps it for the sidebar and a Free Card's rows. After Phase 4 it holds for the sidebar alone, until Story 8.11;
    - §7.2's rows that are "passed over, never named", if `travelingRowsFor` goes.
  - **For the Test Planner:** DRAG-3.19 ("both copies of a dragged Card are shortCard, and its attached children are unrendered"), and the new case the handoff asks for, which now covers both forms.
  - **Skipped specs,** each with its reason.
- **Gate,** if the hands-on changed code: `npm run check` and `npm run test:e2e`.

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|
| `workflow/itemListOps.ts::carriedBranchOf`, `CarriedBranch` | The branch (D1, D7): `hierarchyRows` from the carried item, a Card or a Stub, over the board's placement-aware accessor, so attached links only, as the board draws the tree, at every depth. Its ids, its children (the depth-0 rows) and its whole count. Null when it has no rows. |
| `workflow/itemListOps.ts::carriedBranchLabel` | The second line's wording (D3): "+ 1 child", "+ X children" when every descendant is a child, else "+ X children, Y total descendants". |
| `workflow/itemListOps.ts::sectionEntries` (`branchIds`) | D2: the branch's rows are not drawn, and are not counted by any overflow row. So the overflow row of a row that left goes with it, and so does the carried Stub's own, whose children are the branch. Every other row and count stays. |
| `workflow/DragSessionContext.ts::DragSession.branch` | Held from pickup for the whole drag. Null for an item with no attached descendants. |
| `workflow/useBoardDnd.ts::handleDragStart` | Reads the branch once, for every pickup, from `deps.getAttachedChildren`, the reads the lists draw with. `endSession` clears the session, so the branch is drawn again at once on a drop, a cancel and a forced stop (D5). |
| `workflow/dragCollision.ts::dropAnchorFor`, `namedAnchorFor` | No longer step past rows that travel (D7). The carried item's descendants are never rows of the list the ghost slides through, so a neighbor is the row beside the ghost. `travelingRowsFor` and `AnchorSession` are gone, and `namedAnchorFor` takes no session. |
| `workflow/modalPlacement.ts::gapAtSlot`, `slotForGap` | Count every row before the ghost, with no `travels` predicate. `HierarchyModal.tsx` and `dragChrome.tsx::useLiveDropSide` pass none. |
| `workflow/AGENTS.md` | The mental model, the concern list, the "one way" list and the test attributes say a carried item, a Card or a Stub, takes its branch with it, that no neighbor is stepped past, and that the second line is `data-carried-branch` in either form. |
| `KanbanCard.tsx` (`entries`, `overlayBranch`, `branchLine`) | The section leaves the branch out, which also covers the static rows under the modal's backdrop. The carried copy's second line hangs from the Stub form's box, and from the shortCard form's root (D8). The shortCard's `overflow-hidden` moved from its root to its content (`h-full overflow-hidden`), so the root doesn't clip the line. The in-list ghost, which gets no `overlayBranch`, shows none. |
| `StubRows.tsx::CarriedBranchLine` | The second line (D3, D4, D8): absolute under the box it hangs from, one row tall, `pointer-events-none`, the overflow row's text style over a fill. It adds nothing to the box dnd-kit measures, and turns with a shortCard copy's `rotate-2`. Carries `data-carried-branch`. |
| `HierarchyModal.tsx` | The modal's rows leave the branch out. |
| `BoardView.tsx` | Hands the overlay `session.branch` beside `overlayProjection`. |
| `client/src/test/dragFixtures.ts::makeDragSession` | A whole drag session with every field defaulted. The four tests that wrote one by hand (`BandGuides`, `dragChrome`, `HierarchyModal`, `KanbanCard`) build it here. |
| `itemListOps.test.ts` | The walk (children and the whole branch; a Free child left out with everything under it; rows past the shown levels; a pending attach and a pending detach read where the board draws them; none), the wording, and `sectionEntries` with a branch. |
| `useBoardDnd.test.ts` | The pickup: the branch for a Stub and for a Free Card, a Free child and what is under it left out, none for an item with no attached descendants. |
| `KanbanCard.test.tsx` | The section without the branch of a carried Stub and of a carried Free Card, the static rows under the backdrop, the branch drawn again after the drag; the copy's second line in both forms with a branch and in neither without one, none on the in-list row, the shortCard copy's height with the line out of its flow and its root unclipped, and the Stub copy's line inside the indented box. |
| `HierarchyModal.test.tsx` | The modal's rows without the branch, and the cursor resting on the row of the ghost's gap. DRAG-7.15's test reads rows with no `travels`. |
| `dragCollision.test.ts`, `modalPlacement.test.ts` | The stepping tests are gone with `travelingRowsFor`: DRAG-4.8's step-past test, the `travelingRowsFor` cases, and `gapAtSlot`'s "rows that travel are not counted". `namedAnchorFor` is tested without a session. |

## Amendments

**1. 2026-11-04, Phase 1 built** (Coder).
- **The branch is `hierarchyRows` from the Stub, not a new walk.** It already walks attached children only, through the board's placement-aware accessor, and its `seen` set stops a cycle in the data. `carriedBranchOf` takes the ids and the two counts off those rows.
- **The carried Stub's own overflow row leaves with the branch** (D2's "the overflow rows its rows own"). A Stub at the section's last shown level has one for its children, which are all the branch, so counting the branch out leaves it none. With the switch off it is drawn as before.
- **`DragSession.branch` is required, and the session has a fixture** (the plan left optional or a fixture to the Coder). `dragFixtures.ts::makeDragSession` builds one; the four tests that wrote a whole session by hand use it, so the next field is one edit.
- **The wording is in `itemListOps.ts`, beside the walk,** since `StubRows.tsx` exports only components. The line's element is `StubRows.tsx::CarriedBranchLine`.
- **The second line hangs from the copy's box,** which is `relative`: `top-[calc(100%+1px)]`, a row tall, at the box's width. The overlay's root, and so the box dnd-kit measures, is still one row. **The over-cap outline is on the box alone** (D4 left it to the Coder: the title line).
- **The checkbox is under "Section"** in the panel, with the section's levels.
- **D2's measuring checks, made in the browser with a throwaway spec (deleted),** on the overflow-tree fixture carrying Q (R, T, R1, R2 and R1a under it; the Free F and G left out):
  - **At pickup** the section draws A, Q, B and X. The Card is 84px shorter and B 84px higher. The copy reads "+ 2 children, 5 total descendants", is one 24px row, and its line hangs a row below it at Q's indent.
  - **dnd-kit's droppable rects see the collapse.** Aiming at the top and bottom quarter of A, Q, B and X names the same line and the same projection with the switch on as off.
  - **The clamp reads the collapsed Card.** With the cursor taken below the Card, the copy stops at the Card's new bottom. With the switch off it follows the cursor.
  - **A pop out** draws the shortCard with no second line.
  - **The hierarchy modal** carrying Q lists A, Q, B and X. Cancel draws all nine of its rows again.
  - **Ending the drag:** Escape draws the branch back in place. A drop of Q after X writes it, and draws R and T under it, one level shallower.
  - **Not the switch's:** with the cursor within a few rows of the window's bottom, dnd-kit's autoscroll moves the board, switch on or off.
- **The new tests were checked against the code.** With `KanbanCard.tsx` or `HierarchyModal.tsx` not passing the branch to `sectionEntries`, or with the pickup reading the branch whatever the switch says, the tests of the section, the static rows, the modal and the pickup fail.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 397 files with 0 hits, the client has 699 tests (27 new), the server 438 and the scripts 245.
  - **`npm run test:e2e`:** 216 passed, 21 skipped and 0 failed, as at the close of 8.7. With the switch off, nothing changed there.
- **Not built, as the plan has it:** no new drag spec, and no wiki or test-plan change.

**2. 2026-11-04, Phase 2: Nathan's hands-on, and Phase 3 settled** (Nathan, Coder).
- **Nathan's decision:** the collapse replaces 8.5's rows. The "+ X children, Y total descendants" line is locked in as built, for now, and needs no switch.
- **The switch is gone:** the tuning value and its default, the panel's checkbox, and the pickup's condition. The branch is read for every Stub's pickup. A `collapseCarriedBranch` key stored in a browser's tuning, as Nathan's holds from the hands-on, is ignored: `loadDragTuning` reads only the keys it has.
- **Two tests went with it:** the switch's default, and "none with the switch off".
- **What stayed, and why:**
  - **8.5's tiers.** They still draw a Free descendant, the Stubs in its section, a Free Card's drag and the project sidebar. The walk still classifies a Stub's branch, which is no longer drawn.
  - **`travelingRowsFor`.** A carried Free Card's children are drawn below its previewed row in a section and in the modal, and that drag holds no branch, so the rows are still there to step past. If a carried Free Card took its children out of the lists as a Stub's pickup does, it would have nothing left to step past in either, and could go. Its comment now says whose rows they are.
- **Two tests were realigned.** The session of the modal's DRAG-7.15 test and the section's "no branch" case both modeled a Stub with its children drawn, which a Stub's pickup no longer gives. They model a carried Free Card's drag, which does.
- **No spec is skipped.** No drag spec pinned the branch's rows at Low, and the cases that describe them (DRAG-2.17, DRAG-7.27) have no automation.
- **`workflow/AGENTS.md` is placed,** as the directory's map: what a carried Stub takes with it, `carriedBranchOf` as the one source, the rows `travelingRowsFor` steps past, and `data-carried-branch`.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 397 files with 0 hits, the client has 697 tests, the server 438 and the scripts 245.
  - **`npm run test:e2e`:** 216 passed, 21 skipped and 0 failed, run with nothing else running. An earlier run with the same code had one failure, `boards-layer.spec.ts`'s workphase delete notice, which is no drag spec. It passed alone (13 of 13) and in this run.

**3. 2026-11-04, Phase 4 planned** (Architect, from Nathan's hands-on).
- **Nathan asked for two more changes after Phase 3:**
  - a dragged Card carries the line too;
  - the line stays through a switch between the Card and Stub forms. He found it hands-on: a Card picked up and zoomed into a section drew its Stub copy with no line.
- **That was the plan's D3, not a defect in the build.** D3 gave the line to a Stub's pickup only, and to the Stub form only. D7 and D8 lift both limits.
- **Nathan chose the line under the shortCard,** as under the Stub. The other option was the count in the shortCard's reserved description line: it keeps the height exact and covers nothing, but the line moves at every switch.
- **Routed elsewhere from the same hands-on** (roadmap):
  - the copy that sometimes leaves the cursor at a context switch is Story 8.10;
  - the sidebar's collapse is Story 8.11.
- **The PO's and the Planner's passes wait for Phase 5,** so the wiki is written once.

**4. 2026-11-04, Phase 4 built** (Coder).
- **The pickup reads the branch once, before the Card or Stub fork,** so both pickups hold it. `carriedBranchOf`'s parameter is now `itemId`, and the comments that said "a Stub's pickup" say "the carried item's".
- **The line shows under the copy in both forms** (D8). `KanbanCard.tsx` builds it once (`branchLine`) and hangs it from the Stub form's indented box and from the shortCard form's root. Only the DragOverlay's copy gets it: the in-list ghost is given no `overlayBranch`.
- **The shortCard's clip moved,** the Coder's call D8 left open. The root's `overflow-hidden` is gone, and the content wrapper takes `h-full overflow-hidden`, so it still clips to the card's fixed height and the root doesn't clip the line. The line is the root's child, so it turns with `rotate-2`.
- **`travelingRowsFor` is gone** (D7). Checked before removing it, with a throwaway spec (deleted): a carried Free Card X, holding XA (then XAA) and a Free child XF, zoomed into P's section.
  - **The section drew PA, PB and X,** and no row of XA or XAA. XF stayed a Card in its column.
  - **Through the forms:** the shortCard copy read "+ 1 child, 2 total descendants", the Stub copy kept it after the zoom, and the shortCard copy kept it after a pop out. Cancel drew XA again.
  - **The shortCard copy** kept its root unclipped, with the line hung below it, turned with it and covering the top of the Card below.
  - **The modal and the static rows** are covered by the section's tests, which read the same `sectionEntries` set.
- **What went with it:**
  - `travelingRowsFor` and `AnchorSession`;
  - `dropAnchorFor`'s `travels` parameter, so a neighbor is the row beside the ghost;
  - `namedAnchorFor`'s session, and the `useDragSession` read in `dragChrome.tsx::useLiveDropSide`;
  - `gapAtSlot` and `slotForGap`'s `travels`, and `HierarchyModal.tsx`'s use.
- **Tests that went with it:**
  - DRAG-4.8's step-past test in `dragCollision.test.ts`, which is the only test of that file that carried DRAG-4.8, so the case's Automation line there is stale;
  - the three `travelingRowsFor` cases;
  - `namedAnchorFor`'s two session cases, replaced by one without a session;
  - `modalPlacement.test.ts`'s "rows that travel with the ghost are not counted".
- **Phase 3's two realigned tests were redone.** The modal's DRAG-7.15 test now carries a branch, as a pickup does, and reads rows B, D and C. The section's "no branch" case is replaced by the branch of a carried Stub and of a carried Free Card.
- **The new tests were checked against the code.** With the Card's pickup not reading the branch, the Card's line missing from the shortCard form, or the root's `overflow-hidden` back, the pickup test, the line's test and the unclipped-root test fail.
- **No spec is skipped.** No drag spec pinned a carried Card's children drawn under its row, or a copy with no line.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 397 files with 0 hits, the client has 693 tests, the server 438 and the scripts 245.
  - **`npm run test:e2e`:** 216 passed, 21 skipped and 0 failed, run with nothing else running.
- **The handoff is Phase 5's.** The decisions it records about the second line's forms and a Free Card's children are superseded by D7 and D8, and are rewritten after Nathan's hands-on.

**5. 2026-11-04, Phase 5: Nathan's hands-on, and the handoff** (Nathan, Coder).
- **Nathan tried Phase 4 and approved it as built.** Nothing changed in the code, so Phase 4's gate stands: `npm run check` passes, and `npm run test:e2e` is 216 passed, 21 skipped and 0 failed.
- **The handoff is rewritten** for D7 and D8, in place of the Phase 3 text.
- **One expectation in Phase 5's own text is corrected there.** It said hierarchy-placement §7's "the dragged entry's descendants are Low" would hold for the sidebar alone after Phase 4. On the board it also holds for the Stubs under a Free descendant of the dragged item, which stay drawn at Low: their parent is Cycle-forming, and the Free Card rule gives the Free descendant itself Mid.
- **DRAG-4.8's Automation line is stale,** since the only test of `dragCollision.test.ts` that carried it went with `travelingRowsFor`. The handoff says so for the Planner.

## Open questions

None yet.

## Living-docs handoff

Written by the Coder at the end of Phase 5, after Nathan's hands-on approved the build as it stands. It replaces the Phase 3 handoff: D7 and D8 changed what the second line is and who carries it. The wiki and the test plans are the PO's and the Test Planner's, and none is edited here.

- **Behavior decisions made while building, for the PO to rule on:**
  - **Every pickup carries its branch,** a Card's as well as a Stub's (D7). It is the item's attached descendants only (D1, Nathan: count only the rows that collapse). A Free child, and everything under it, is not counted and does not collapse: it stays where it is drawn, at its tier.
  - **The branch is out of every list that draws it, for the whole drag:** a Card's section, the hierarchy modal and the static rows under its backdrop. It is read once at pickup and held, so a response that lands mid-drag does not change what is hidden.
  - **The count reads "+ X children, Y total descendants".** X is the item's attached children and Y the whole branch, rows past the section's shown levels included. When every descendant is a child it reads "+ X children", and one child "+ 1 child". An item with no attached descendants has no line.
  - **The line shows under the copy in both forms and through every switch** (D8). A Card picked up and zoomed into a section keeps it as a Stub copy, a Stub popped out to a column keeps it as a shortCard, and either keeps it zooming back. The ghost, in the list or the section, shows none.
  - **The carried item's own overflow row goes with its branch.** An item at a section's last shown level used to draw an overflow row for its children. They are the branch, so none is drawn. Every other overflow row counts as before, the dragged item left out.
  - **The rows below move at the pickup and the zoom.** A Stub's pickup moves the rows below its branch up by the branch's height. A Card's pickup moves nothing, since it was a shortCard already, and its zoom into a section adds one row, not its branch's rows. All of it is undone at the end of the drag, which draws the branch again at once, where the board then has it.
  - **The second line hangs outside the copy's box and covers what is below it.** At the Descendants layer that is the row just below the ghost. At a column or a sub-row it is the top of the Card below the ghost, and the gap above that Card. At a section's or a sub-row's last row the line can hang past the box's bottom edge. The look is a placeholder, with the overflow row's text style.
  - **The copy's box is what it was:** a Stub row for the Stub form, `SHORT_CARD_HEIGHT_PX` for the shortCard, so the bands' reservation, the lean, the clamp and the re-anchor read what they read before. The shortCard's line turns with the copy.
  - **The over-cap outline wraps the Stub copy's box alone,** not the second line.
  - **Nathan's hands-on:** he tried Phase 4 and approved it as built.
- **Planned passages now built:** D1 to D5, D7 and D8 as the plan has them. D6's trial switch was built and is gone.
- **Passages superseded,** each for the PO:
  - **board-drag-interaction §7.2,** the first paragraph: a dragged Stub's subtree "stays where it's drawn, at Low, and is passed over, never named". The attached part of an item's subtree is not drawn while it is carried, so there is no row to pass over. §3.2's "never a placement candidate" holds.
  - **§4.1 and hierarchy-placement §7,** "the dragged entry's descendants are Low". On the board the attached descendants are no longer drawn. A Free descendant is a Card in its column at Mid, and the Stubs in its section stay drawn at Low, so the rule still holds for them. It holds for the project sidebar until Story 8.11. Phase 5's plan text said it would hold for the sidebar alone, which leaves out those Stubs.
  - **§5a, the shortCard's last bullet:** the attached-children indicator and count are suppressed and the children go unrendered. The children still do. The carried copy now says their count on a second line outside its box.
  - **§5a, "Every Stub-sized row is one fixed height":** it holds for the box the drag measures. The carried copy of an item with a branch is drawn a row taller, by its second line, in the Stub form and in the shortCard form.
  - **§5a, which copy is which:** both copies are a Stub at the Descendants layer. The in-list ghost shows no line; only the carried copy does.
  - **§9, the overflow row:** "when `R` itself is dragged, its overflow row goes with it ... it stays drawn, at Low". It is not drawn.
  - **§7.3:** the modal's rows, and the section's static rows under its backdrop, leave out the carried item's branch.
  - **§10:** on every end of the drag the branch is drawn again, under the item where the preview puts it, or where it was.
- **Implementation passages to place:** placed by the Coder, in `workflow/AGENTS.md` (the Code map).
- **Test-plan cases affected,** for the Test Planner after the PO's pass. None below has automation.
  - **DRAG-2.17** says a dragged Stub's descendants stay drawn at Low and never ride with the copy. The attached ones are not drawn now, and a Card's children go the same way. Its second paragraph, a Free descendant `D` at Mid and its Stub `D1` at Low, still holds.
  - **DRAG-7.27** says a dragged row's overflow stays drawn at Low. It is not drawn.
  - **DRAG-3.19** says a dragged Card's copies have no count. The carried copy now has the line. Its "S1 and S2 are not rendered anywhere" and its return on a drop still hold.
  - **DRAG-3.22:** the carried Stub copy has the line, the ghost none.
  - **DRAG-3.25:** the carried copy's border is inside its height, and the second line is outside it.
  - **DRAG-4.8's** Automation line names `dragCollision.test.ts`, which no longer holds a DRAG-4.8 test. The one that did, "steps past rows that travel with the dragged item", went with `travelingRowsFor`: a dragged item's descendants are no longer rows of the list the ghost slides through. The case's other tests, `hierarchyPlacement.test.ts` and `descendantsProjection.test.ts`, stand.
  - **DRAG-7.12 and DRAG-7.15** hold. DRAG-7.15's clause on an item that carries a subtree reads "its child still under it": the child moves with the item and is not drawn under it. Its test in `HierarchyModal.test.tsx` now carries a branch.
  - **A new case, or cases,** for the collapse and the line:
    - the branch collapses on a pickup, of a Card or a Stub, from the section, the modal and the static rows;
    - the line's wording, and none for an item with no attached descendants or with only Free children;
    - the line in both forms and through each switch;
    - the in-list ghost shows none;
    - a Free child stays where it is drawn, and is not counted;
    - the branch is drawn again on a drop, a cancel, a release that writes nothing, a release past the cap and a forced stop.
  - **Tests the new cases can cite,** all without a case ID today: `itemListOps.test.ts` (the walk, the wording, `sectionEntries` with a branch), `useBoardDnd.test.ts` (the pickup), `KanbanCard.test.tsx` (the section, the static rows, the copy in both forms) and `HierarchyModal.test.tsx`.
- **Skipped specs:** none. No drag spec pinned the branch's rows at Low, a carried Card's children drawn under its row, or a copy with no line.
- **Wiki sections added, changed, moved or removed** (PO, at close):

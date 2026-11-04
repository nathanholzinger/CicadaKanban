# Epic 3.5 Story 8.8 — A pickup takes its descendants with it

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.8 entry and Nathan's design (2026-11-04) · **Status:** built and settled, for review and commit: the collapse replaces 8.5's rows, and the handoff is written

## Goal

A trial of carrying a dragged Stub's branch with it, in place of Story 8.5's dimmed rows.

**Nathan's design** (2026-11-04):
- When a Stub with descendants is picked up, the descendant rows collapse into it.
- The carried Stub becomes two lines tall. The second line reads "+ X children, Y total descendants".
- When the drag ends, the branch is drawn as a tree again.

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
- **A Card's drag.** A dragged Card is a shortCard, and its attached children aren't drawn (§5a). That stays.
- **A two-line ghost.** Nathan chose the copy alone to start. If a one-row ghost reads wrong hands-on, growing it is a follow-up.
- **Free descendants.** They're Cards in their columns, and they stay where they're drawn, at their tier.
- **An animation** for the collapse or the expansion. Like the ghost's expansion on drop (§5a), it's instant. How either should move is "The cues' final look"'s.
- **The second line's final look.** It's a working placeholder for "The cues' final look".
- **The project sidebar.** It keeps its descendants drawn in place (Story 8.7).

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

**D3. The copy's second line** (Nathan's wording).
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

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|
| `workflow/itemListOps.ts::carriedBranchOf`, `CarriedBranch` | The branch (D1): `hierarchyRows` from the Stub over the board's placement-aware accessor, so attached links only, as the board draws the tree, at every depth. Its ids, its children (the depth-0 rows) and its whole count. Null when it has no rows. |
| `workflow/itemListOps.ts::carriedBranchLabel` | The second line's wording (D3): "+ 1 child", "+ X children" when every descendant is a child, else "+ X children, Y total descendants". |
| `workflow/itemListOps.ts::sectionEntries` (`branchIds`) | D2: the branch's rows are not drawn, and are not counted by any overflow row. So the overflow row of a row that left goes with it, and so does the carried Stub's own, whose children are the branch. Every other row and count stays. |
| `workflow/DragSessionContext.ts::DragSession.branch` | Held from pickup for the whole drag. Null for a Free Card's drag, and for a Stub with no attached descendants. |
| `workflow/useBoardDnd.ts::handleDragStart` | Reads the branch once, for a Stub's pickup only, from `deps.getAttachedChildren`, the reads the lists draw with. `endSession` clears the session, so the branch is drawn again at once on a drop, a cancel and a forced stop (D5). |
| `workflow/dragCollision.ts::travelingRowsFor` | Kept, with its comment corrected. A carried Stub's branch is not drawn, so the rows it steps past in a section and in the modal are a carried Free Card's children, which its previewed row draws below it. |
| `workflow/AGENTS.md` | The mental model, the concern list, the "one way" list and the test attributes say a carried Stub takes its branch with it, and that the second line is `data-carried-branch`. |
| `KanbanCard.tsx` (`entries`, `overlayBranch`) | The section leaves the branch out, which also covers the static rows under the modal's backdrop. The carried copy's box is `relative` and holds the second line, so the line steps with the depth cue. |
| `StubRows.tsx::CarriedBranchLine` | The second line (D3, D4): absolute under the copy's box, one row tall, `pointer-events-none`, the overflow row's text style over the copy's fill. It adds nothing to the box dnd-kit measures. Carries `data-carried-branch`. |
| `HierarchyModal.tsx` | The modal's rows leave the branch out. |
| `BoardView.tsx` | Hands the overlay `session.branch` beside `overlayProjection`. |
| `client/src/test/dragFixtures.ts::makeDragSession` | A whole drag session with every field defaulted. The four tests that wrote one by hand (`BandGuides`, `dragChrome`, `HierarchyModal`, `KanbanCard`) build it here. |
| `itemListOps.test.ts` | The walk (children and the whole branch; a Free child left out with everything under it; rows past the shown levels; a pending attach and a pending detach read where the board draws them; none), the wording, and `sectionEntries` with a branch. |
| `useBoardDnd.test.ts` | The pickup: the branch for a Stub, none for a Stub with none, none for a Free Card. |
| `KanbanCard.test.tsx` | The section with and without the branch (no branch is a Free Card's drag, whose children are drawn), the static rows under the backdrop, the branch drawn again after the drag; the copy's second line in the Stub form only, with a branch, outside the box's flow and inside the indented box. |
| `HierarchyModal.test.tsx` | The modal's rows without the branch, and the cursor resting on the same row of the ghost's gap. The session with no branch is a Free Card's, so DRAG-7.15's test still reads rows that travel. |

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

## Open questions

None yet.

## Living-docs handoff

Written by the Coder at the end of Phase 3. The collapse replaces 8.5's rows.

- **Behavior decisions made while building, for the PO to rule on:**
  - **The branch is the attached descendants only** (D1, Nathan: count only the rows that collapse). A Free child of the Stub, and everything under it, is not counted and does not collapse: it stays where it is drawn, at its tier.
  - **The count reads "+ X children, Y total descendants".** X is the Stub's attached children and Y the whole branch, rows past the section's shown levels included. When every descendant is a child it reads "+ X children", and one child "+ 1 child".
  - **The carried Stub's own overflow row goes with the branch.** A Stub at a section's last shown level used to draw an overflow row for its children. They are the branch, so none is drawn. Every other overflow row counts as before, the dragged item left out.
  - **The second line shows only while the copy is a Stub,** at the Descendants layer and in the hierarchy modal. Popped out, the copy is a shortCard with none. A Free Card's drag holds no branch (out of scope in D3), so a Free Card with children zoomed into a section still draws them below its row, at Low, as 8.5 did.
  - **The rows below the branch move up at pickup, by its height,** and back down when the drag ends.
  - **The branch is read once at pickup and held,** so a response that lands mid-drag does not change what is hidden. Any end of the drag draws it again, where the board then has it.
  - **The second line hangs from the copy's box** and covers the row below the ghost. At a section's last row it can hang past the Card's bottom edge. The look is a placeholder.
  - **The over-cap outline wraps the copy's box alone,** not the second line.
- **Planned passages now built:** D1 to D5 as the plan has them. D6's switch was built for the trial and is gone.
- **Passages superseded:**
  - wiki board-drag-interaction §7.2: a dragged Stub's rows "stay where they're drawn, at Low", and the rule that a dragged row's overflow row stays drawn at Low;
  - §4.1: the carried item's own descendants at Low, for a Stub's attached branch, which is not drawn now. Hierarchy-placement §7's "the dragged entry's descendants are Low" still holds for the sidebar and for a Free Card's rows;
  - §5a: "Every Stub-sized row is one fixed height", for the carried copy. Its box is one row and its second line hangs outside the box the drag measures, so it is drawn two rows tall;
  - §7.3 and §9: the hierarchy modal, and a Card's section, draw without the branch.
- **Implementation passages to place:** placed by the Coder, in `workflow/AGENTS.md` (the Code map).
- **Test-plan cases affected,** for the Test Planner after the PO's pass. None has automation.
  - **DRAG-2.17 and DRAG-7.27** say a dragged Stub's descendants, and a dragged row's overflow row, stay drawn at Low. That is 8.5's drawing, which is gone.
  - **DRAG-3.25's** carried copy gains a second line outside its one height.
  - **DRAG-7.12** (the modal's rows keep the drag's classification and tier) holds for the rows that are drawn.
  - **DRAG-7.15's** clause on an item that carries a subtree holds, with the subtree not drawn under it.
  - **A new case** is due for the second line and the collapse.
- **Skipped specs:** none. No drag spec pinned a branch's rows at Low.
- **Wiki sections added, changed, moved or removed** (PO, at close):

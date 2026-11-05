# Epic 3.5 Story 8.12 — The sidebar's ghost moves to the gap

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.12 entry · **Status:** planning. It runs next, after Story 8.11 closes

## Goal

Give the project sidebar's drag the ghost a Stub has in a Card's descendants section (wiki board-drag-interaction §2, §7.1) (Nathan, 2026-11-04):
- the dragged project's own row, its ghost, moves to the gap, drawn at the depth the project will land at;
- the rows slide aside to make room;
- the blue line stays, and travels with the ghost;
- a release draws the move at once, and the copy glides into the ghost's place.

**What happens today** (wiki project-tree §1, §2 and §4, Story 8.11):
- **The ghost row stays where the project was picked up.** The line alone shows the gap: "an indicator line, not a ghost".
- **The gap is a row and one of its halves:** the row nearest the dragged row's box, and which half of it that box's center is in (`projectTreeUtils.ts::resolveGap`, `dragCollision.ts::resolveDropSide`).
- **The copy, `SortableProjectRow.tsx::DragGhost`, follows the pointer freely.** Its name sits at the row's left edge, whatever the project's depth.
- **A move is drawn when its response arrives** (`App.tsx::handleReorderProject`). The copy goes at release with no drop animation (8.11's D7). The row and its branch stay at the pickup until the response lands.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"), with one exception of Nathan's (2026-11-04):
- The Coder builds it, and Nathan tries it hands-on. The PO and the Test Planner write the docs after he approves.
- **No trial switch.** The gesture is the board's, which Nathan has settled, applied to the sidebar. The copy's sideways hold (D4) is the one call he may overturn in the hands-on.
- **The exception: the sidebar's drag specs are updated here, not skipped for Story 10.**
  - Once Nathan approves the gesture (Phase 3), the specs are updated to it, and Story 8.11's skipped TREE-1.1 and TREE-1.11/TREE-3.9 are unskipped.
  - Where a spec checks the line, it checks the ghost in the same test, not in a second set of tests.
- No new drag specs beyond those.

**Out of scope:**
- **What the board does.** Nothing it draws or places changes.
- **The cues' final look:** the ghost's strength, the line's and the copy's looks, and the 14px indent and pointer travel per level. They're "The cues' final look"'s (roadmap, Story 8).
- **The copy covering the ghost.** On the board the ghost is hidden under the carried copy, and that's the zoom-in morph's (roadmap, Story 8). If the sidebar's copy hides its ghost the same way, Phase 2 says whether it matters here.
- **Story 8.11's carried branch.** It's unchanged: not drawn during the drag, and drawn again at its end, now at the project's new place (D5).

## Scope

- **Wiki passages:** none ahead of the build. The PO writes the rules once Nathan approves (code first).
- **Test-plan cases:** for the Test Planner, after the PO's pass. The handoff lists the ones affected.

## Inbound deferrals

From Story 8.11 (its Amendment 4 and Phase 5, Nathan, 2026-11-04):

1. **D7's remainder: the movement after a drop is still awkward.** The copy goes at release, and the row and its branch stay at the pickup until the response lands, then move. D5 and D6 answer it.
2. **D8's remainder: the line isn't always drawn where the cursor suggests.** A release lands at the depth the line shows. D2 and D4 answer it.
3. **Sometimes a gap offers only "child of the row above,"** where Nathan expected hierarchy-placement §1's full range. Nathan suspects how the cursor is read, more than the placement rule. The leads, from the roadmap's entry:
   - **The cursor sits about 30px left of the line.** The drag starts on the handle, and since 8.11's D8 the line starts at the name's column. A cursor placed where the line should start reads about two levels deeper, which clamps to the deepest state, often "child of the row above". D4 puts the copy's name on the line's column, a level at a time.
   - **The gap is read from the dragged row's box and a row's half.** D2 replaces that reading.
   - **A scrolled list,** unchecked. Phase 2 tries it.
   - **The rule itself:** right under a project whose first child is shown, the only state is "first child" (hierarchy-placement §1's worked example).
   - **If it outlasts the build,** it's a defect, fixed in Story 8 (roadmap, "A defect is fixed in Story 8, whichever story finds it").
4. **Story 8.11's wiki and test-plan pass leaves out what this story changes right away** (Nathan). This plan's handoff covers those passages and cases, 8.11's D7 and D8 among them (Phase 4).
5. **Story 8.11's skipped specs.** TREE-1.1 and TREE-1.11/TREE-3.9 are updated and unskipped here (Phase 3). TREE-1.4 stays skipped. Its rows haven't been drawn since 8.11, and the Planner rewrites the case first (8.11's handoff).

## Approach and phases

### Decisions

**D1. The ghost is the dragged project's own row, slid to the gap.**
- **`SortableContext`'s items become the drawn rows, the dragged project's own row included.** Today `rowIds` leaves that row out, and that's what keeps the rows still: dnd-kit's sortable strategy has no active row to shuffle around.
- **`verticalListSortingStrategy` then slides the rows** between the ghost's own slot and `over`, and gives the dragged row its transform to the gap.
- **`SortableProjectRow` applies the transform to the dragged row too.**
  - Its comment today says the dragged row mustn't follow the cursor, or its droppable would follow it, and `closestCenter` would always return it.
  - Here the row doesn't follow the cursor. The strategy moves it a whole slot at a time, and dnd-kit measures it without its transform (D2).
- **The ghost is drawn at the projection's depth,** its own depth before the first projection, at the ghost's strength as today.
- **A test surface for the ghost,** as `data-drop-line` is for the line: that the row is the ghost, and the depth it's drawn at. The Coder names it.

**D2. The gap is the ghost's slot** (board-drag-interaction §2, rules 1 and 2).
- **dnd-kit measures each row without its transform** (`getTransformAgnosticClientRect`, `@dnd-kit/core`'s default for droppables). So the boxes it hits against stay where the rows were at pickup while they slide, and a ghost that moves under a still cursor doesn't move them. The gap can't flip back and forth.
- **`over` is the row whose box the dragged box's center is nearest** (`closestCenter`, unchanged). The ghost takes `over`'s slot, the standard sortable shuffle:
  - **`over` below the ghost's own slot:** the gap after it;
  - **`over` above it:** the gap before it;
  - **the dragged row itself:** its own gap (wiki project-tree §1).
- **One pure function in `projectTreeUtils.ts` turns the rows, the dragged id and `over` into the gap.** It replaces `resolveGap`'s row-and-half reading, and `resolveDropSide` leaves the sidebar's drag. It reads the drawn order at pickup, never the slid one.
- **Why not a row's half:** board-drag-interaction §2's reason, "the gap is drawn from list order, so choosing the side by which half of a card the carried card's center is in can land a drop one slot away from the ghost". It's also the depth report's second lead.
- **What follows the gap doesn't change:** `computeProjection`, the cap's check, and `releaseOf` with its own-slot rule.

**D3. The line stays, along the ghost's top edge** (Nathan, 2026-11-04: "the ghost will travel with the blue line").
- **It's always drawn at the top of the ghost,** between the ghost and the row above it, Top. It starts where a name at the projected depth starts (8.11's D8).
- **Why the top** (Nathan): the depth is decided against the project above. Hierarchy-placement §1 says the same: the entry is placed "somewhere in Top's hierarchy", as its child, its next sibling, or the next sibling of one of its ancestors, and Bottom "only caps how far left the walk can go".
- **Today the line is drawn on a neighbor's side,** above the row below the gap, or below the last row (`useProjectDragReorder.ts::dropLine`). With the ghost in the gap, that would put the line under the ghost in most gaps and over it at the list's end. Drawn by the ghost's own row, it's in one place in every gap, the gap above the first row included. It moves when the ghost does.
- **Where the board differs:** its line marks the neighbor a release names, above or below the ghost (board-drag-interaction §2, rule 3). On the sidebar a release names the gap and the depth, not a side (wiki project-tree §1), so the line has no side to show.
- **When there's no line:** as today, before the first move, and when the dragged project's subtree holds every project (TREE-1.4).
- **Over the cap:**
  - the line stays red;
  - the copy takes the board's invalid outline (`dragChrome.tsx::INVALID_PLACEMENT_CLASS`), as the board's copy does over the cap, since the copy covers the ghost.
- **The test surfaces stay,** `data-drop-line` and `data-drop-invalid`, now on the ghost's row. What `data-drop-line` holds once the line has no side is the Coder's call.

**D4. The copy is held to the list's width, and steps with the depth.** This is what the board's carried Stub does in a Card's section (roadmap, "The cues' final look": "pinned to a section row's width", its box stepping "right by one indent per level").
- **A modifier on the sidebar's `DragOverlay` alone** holds the copy's x where it was picked up. The copy still follows the pointer up and down.
- `DndContext` takes no modifier. So `delta.x`, which the depth reads, stays the pointer's travel, and so does the box dnd-kit hits against.
- **`DragGhost` is laid out as a row at the projection's depth.** It takes the row's padding and its leading controls' widths, from `projectTreeUtils.ts`'s pairs (8.11's D8), so its name sits where the ghost's name and the line's start do.
  - It keeps its look otherwise, and the branch line under it (8.11's D5).
  - At pickup, before any projection, it draws exactly over the project's row.
- **What it answers: the depth report's first lead.** The cursor stays on the copy's handle, as at pickup, a level at a time. The copy's name, the ghost's and the line's start share one column.
- **The one call Nathan may overturn in Phase 2:** a copy that follows the pointer sideways, as today.

**D5. The move is drawn at release, and goes back if it's refused.**
- **At a release that writes, the sidebar draws the project at its new place at once.** Its branch goes with it.
- **By relation, not by a number.**
  - The release's parent and the sibling it names (`prevId` or `nextId`) are laid over the tree, as the board's pending placements are (`itemListOps.ts::applyPlacements`, which is items-only).
  - A position worked out in the client would be a second position-math layer (root AGENTS.md, "One position math layer").
- **Laid over once, where the tree is read.** Three readings must agree:
  - the drawn rows;
  - the real tree's children (`fullChildrenOf`);
  - what the next pickup reads (`getSubtree`, `classifyTargets`).
  - It's table-generic, so it goes beside `hierarchy.ts::sortedChildrenByParent`. The Coder settles its shape.
- **Held in `App.tsx`,** which sends the move and folds its response:
  - **cleared in the same update that folds the response** (`positionedWrite.ts::applyWriteResponse`), so no frame shows the old place;
  - **on a failure,** cleared with the refetch, and the project goes back (wiki project-tree §4);
  - **cleared only by its own request's answer,** so a second drag released while the first's response is out loses neither.
- **A collapsed parent still opens on the drop** (8.11's D9).
- **What it changes mid-drag** (wiki project-tree §1, "The drag counts the tree as it was at pickup"):
  - The user's last move is in the tree at pickup now, so its response lands on what's already drawn.
  - What's left of the window is a refused move, which goes back mid-drag.
  - The tiers and branch held at pickup (8.11's D1) are unchanged.

**D6. The drop animation comes back.**
- **8.11's D7 (`dropAnimation={null}`) is undone.** With the move drawn at release, the dragged row is at its new place when dnd-kit animates, so the copy glides into it, as on the board.
- **An end that writes nothing glides the copy back** to the project's own slot, where the ghost returns: Escape, the own gap, a release past the cap.
- **The scroll:** dnd-kit scrolls the dragged row into view before it animates (8.11's D7). That's now the place the project landed.
- `DragGhost`'s comment changes back.
- **The E2E helper's wait:** `dragGesture.ts::settled` waits 60ms past the copy for the click dnd-kit swallows after a drag. It holds either way, and keeping it is the Coder's call.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` against the test servers.

**Phase 1: the build** (D1–D6).
- **The ghost and the shuffle** (D1, D2):
  - the dragged row in `rowIds`;
  - the gap from `over`;
  - the dragged row's transform and depth;
  - the ghost's test surface.
- **The line and the cap** (D3): the line moves to the ghost's top edge, drawn by the ghost's own row, and the copy takes the over-cap outline.
- **The copy** (D4): the overlay's modifier, and `DragGhost` at a depth.
- **The move at release** (D5): the overlay beside `sortedChildrenByParent`, `App.tsx`'s pending move, and the sidebar's tree reading it.
- **The drop animation** (D6).
- **Comments that say the ghost stays, that the line is the only cue, that the gap is a row's half, or that a move shows on its response:**
  - `SortableProjectRow.tsx`: the style comment and `DragGhost`'s;
  - `useProjectDragReorder.ts`: the module header, `handleDragMove`, and `dropLine`'s;
  - `projectTreeUtils.ts`: the module header and `resolveGap`'s;
  - `dragChrome.tsx`'s `useLiveDropSide`, which says the sidebar draws no ghost;
  - `App.tsx::handleReorderProject`, which says the list changes only on success.
- **Tests:**
  - **the gap:**
    - `over` below, above, and the dragged row itself;
    - the list's two ends;
    - past a collapsed row, and past the hidden branch;
    - the drawn order read, never the slid one;
  - **the hook:**
    - the dragged row in `rowIds`;
    - the gap and the projection for each `over`;
    - the release unchanged;
    - the existing placement tests that drive `resolveGap`'s half move to the new reading. It's a changed rule, so they change with it;
  - **the overlay:**
    - the project under its new parent, beside the sibling it names, with its subtree;
    - last when it names no neighbor (TREE-6.2);
    - the only child of an empty parent;
    - the next pickup's subtree and tiers read it;
  - **`App.tsx`:**
    - drawn at release;
    - cleared with the response in one update;
    - after a failure, gone back with the refetch;
    - two moves out at once;
  - **the line:** on the ghost's top edge in every gap, the list's first and last included, at the depth's name; none before the first move, or when the subtree holds every project;
  - **the copy:** at a depth, its name at `projectNameIndentPx`; the modifier holds x and passes y;
  - **the row:** the dragged row takes its transform and the projection's depth.
- **E2E:**
  - A sidebar drag spec that fails on the new gesture is skipped with the reason "updated in Story 8.12's Phase 3", and Phase 3 takes it up.
  - The board's drag specs should be unchanged.
- **Gate.**

**Phase 2: Nathan's hands-on**
- **Where:**
  - the dev stack, with a project that has children and grandchildren, one of them collapsed, in a list long enough to scroll;
  - the deep stack (`npm run seed:deep`, then `npm run dev:deep` in `server/` and `client/`), for a deep branch and the cap.
- **Try:**
  - **Pick up and move.** The ghost moves to the gap, the rows slide aside, and the line rides along the ghost's top edge.
  - **A still cursor.** Does the ghost ever flip back and forth?
  - **The depth.** The copy and the ghost step with it, and the cursor stays on the copy's handle.
  - **The depth range, retested** (inbound 3).
    - Drag to the gap under the last row of a nested branch, and move left: every depth of the range should come up.
    - If one doesn't, note the rows above and below the line, the dragged project's depth, where the cursor was against the line, and whether the list was scrolled.
  - **Under the copy.** Is the ghost or the line hidden by it, and does it matter here?
  - **The cap:** the red line, and the copy's outline.
  - **A drop.** The copy glides into the new place, and the project and its branch are there at once.
  - **A refused drop,** with the dev server stopped. The move is drawn, then goes back when the request fails.
  - **Every end with no write:** Escape, the own gap, past the cap. The copy glides back.
  - **Two drags in quick succession.**
  - **A scrolled list,** and a drop near its bottom.
  - **The copy's sideways hold (D4):** keep it, or let the copy follow the pointer?
- **Nathan decides:** approve as built, or amend the plan.

**Phase 3: settle, and the specs**
- Whatever the hands-on changes is built here, with an amendment.
- **The specs** (Nathan, 2026-11-04). Every sidebar drag spec runs against the approved gesture. One that fails because its aim or its check pins the line-only gesture is updated:
  - **where it checks the line, it checks the ghost in the same test:** the ghost's slot, that is, the rows on either side of it, and its depth;
  - **TREE-1.1 and TREE-1.11/TREE-3.9 are unskipped and updated,** their line's start checked at `projectNameIndentPx` (8.11's D8);
  - **Phase 1's skips are taken up;**
  - **TREE-1.4 and TREE-2.1 stay skipped.** They aren't this story's;
  - **the titles keep their case IDs.** The cases' text follows at close;
  - **`ProjectSidebarPage.ts`** gains the ghost's locator beside `dropLine`;
  - **every drag goes through `tests/helpers/dragGesture.ts`** (root AGENTS.md).
- **Gate.**

**Phase 4: hand off**
- **The Coder writes the Living-docs handoff,** with at least:
  - **project-tree §1:**
    - "An indicator line, not a ghost. Rows don't slide aside to make room": now the ghost and the line, with the gap read from list order (D1–D3).
    - "The line's position is the gap", and "a release saves exactly the gap and depth the line shows": they hold for the ghost too.
    - "A move is shown when its response arrives (§4), so the user's own last move can land mid-drag": the move is drawn at release (D5).
  - **project-tree §2:**
    - the ghost at the gap and the depth;
    - the line along the ghost's top edge, against the project above (D3);
    - the copy held to the list's width and stepping with the depth (D4);
    - the copy's over-cap outline (D3).
  - **project-tree §4,** "After a failed write, the sidebar shows the project where it was before the attempt": a move is drawn at release, and goes back when it fails (D5).
  - **hierarchy-placement:** both surfaces now read the gap as the ghost's slot, from list order, never a row's half. Board-drag-interaction §2 and §7.1 hold that rule for the board. The PO decides whether it becomes a shared rule.
  - **Left out of Story 8.11's pass for this story** (Nathan):
    - 8.11's D7 is undone here (D6);
    - 8.11's D8, where the line starts, is kept as the line's (D3). The PO decides whether it's a rule.
  - **For the Test Planner:**
    - TREE-1.1, the line and the ghost;
    - TREE-1.8 and TREE-1.9, whose own gap is now resting on the dragged row itself;
    - TREE-1.11/TREE-3.9, the over-cap state on the line and the copy;
    - TREE-1.14 to TREE-1.16, whose mid-drag window narrows to a refused move (D5);
    - TREE-4.8, a failed move drawn, then gone back;
    - new cases for the ghost, the shuffle, and the copy at the depth.
  - **What's left for Story 10,** if anything.
- **Gate,** if code changed.

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|

## Amendments

## Open questions

- **For Nathan, in Phase 2:** D4's held copy, or a copy that follows the pointer sideways, as today.

## Living-docs handoff

Written by the Coder in Phase 4.

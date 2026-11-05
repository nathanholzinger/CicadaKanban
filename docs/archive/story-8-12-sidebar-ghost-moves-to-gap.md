# Epic 3.5 Story 8.12 — The sidebar's ghost moves to the gap

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.12 entry · **Status:** Phases 1–3 built, committed and approved (Amendment 2). Phase 4 wrote the Living-docs handoff (Amendment 3), and the PO's pass is done (Amendment 4). Phase 5, a move drawn by slot, is folded in (Amendment 5) and built (Amendment 7). The tests carry the cases' IDs (Amendment 8), for the Reconciler

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
- **Test-plan cases (Test Planner, after the PO's pass):**
  - Revised: **TREE-1.1–TREE-1.6, TREE-1.8–TREE-1.16; TREE-2.1–TREE-2.8, TREE-2.10, TREE-2.12; TREE-3.9; TREE-4.7, TREE-4.8.** Ghost and line wording, own-gap behavior, invalid cues, edit/create/rollback windows, branch restoration, immediate drawing and rollback. TREE-2.6's response setup now uses a parent edit too; TREE-3.9 qualifies its cap agreement to an unchanged pickup tree.
  - Added, all **Open**: **TREE-1.17–TREE-1.19** (nearest-row slots and both ends, drawn versus hidden rows, stability through the shuffle); **TREE-2.13** (the line's top edge, name column, onset and absence); **TREE-4.9–TREE-4.12** (release-to-answer placement with the branch, independent moves and answers, the next pickup's branch/height/tiers, and slot-based drawing without client-computed positions).
  - Existing statuses and Automation lines await the Reconciler. **TREE-1.4 and TREE-2.1** retain their skipped-spec route to **Story 10's item 10**. Any remaining gesture-dependent coverage for the new cases and revised TREE-1.14–TREE-1.16, TREE-2.6 and TREE-4.8 is named there too. No tests are mapped by this pass.

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

**Phase 5: a move drawn by slot** (Amendment 5).
- **The build:**
  - `withMoveApplied` changes the moved project's `parentId` only;
  - `sortedChildrenByParent` takes the moves out and puts each by its slot;
  - `App.tsx` passes the moves to the sidebar beside the tree, and `flattenTree` and `fullChildrenOf` pass them on.
- **Comments:**
  - `hierarchy.ts`: the module header, `withMoveApplied`'s rank sentences, and `sortedChildrenByParent`'s;
  - `App.tsx`: the `sidebarProjects` comment.
- **Tests:**
  - **`lib/hierarchy.test.ts`:**
    - the order tests read the slot layer;
    - no node's `position` changes;
    - the same project moved twice while both moves are out: the later one wins;
  - **`projectTreeUtils.test.ts`:** `flattenTree` and `fullChildrenOf` with a move out;
  - **`App.pendingMove.test.tsx`:** it should pass unchanged. It's the check that nothing drawn moved.
- **The plan:**
  - the code map's rows for `hierarchy.ts` and `App.tsx`;
  - in the handoff, "A drawn move uses ranks" and the Architect's "Wiki positioning §5 and the ranks" are marked settled by Amendment 5.
  - If a test the handoff lists for the Planner is renamed, the handoff says so.
- **No hands-on.** Nothing drawn changes.
- **Gate.**

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|
| `projectTreeUtils.ts::resolveGap` | The gap is the ghost's slot: `over`'s place in the drawn list, the dragged project's own row included (D2). Replaces the row-and-half reading; `resolveDropSide` and `gapIndexFor` left the sidebar's drag. |
| `useProjectDragReorder.ts` (`rowIds`, `ghost`, `gap`) | `rowIds` are the rows drawn, the dragged project's own among them (D1). `ghost` is `GhostState`: the depth it is drawn at, whether the line rides it, whether it is past the cap. `gap` is the ghost's gap among the rows without the dragged subtree. `dropLine` is gone. |
| `SortableProjectRow.tsx::SortableProjectRow` | Takes the strategy's transform in every state, the dragged row's included (D1). Drawn at `ghost.depth`; carries the line on its top edge (D3). Test surfaces: `data-drag-ghost` (the depth it is drawn at) and `data-drop-line` (the depth the line is drawn at), `data-drop-invalid` as before. |
| `SortableProjectRow.tsx::DragGhost` | The copy laid out as the row at a depth: the row's padding, then the handle's and the chevron's room, so its name sits at `projectNameIndentPx` (D4). Its edge is a ring, so it takes no room. Over the cap it takes `INVALID_PLACEMENT_CLASS` (D3). |
| `ProjectSidebar.tsx::HOLD_COPY_X` | The overlay's modifier, on the `DragOverlay` alone: x stays at the pickup, y follows the pointer (D4). The default drop animation is back (D6). |
| `lib/hierarchy.ts::PendingMove`, `withMoveApplied`, `sortedChildrenByParent` | A sent move laid over the tree by its relation (D5), table-generic. `withMoveApplied` gives the moved project the release's parent and changes nothing else. `sortedChildrenByParent(nodes, moves)` takes each move out of the children it sits in and puts it in its new parent's by its slot, after the sort, in the order sent. No `position` is read or written (Amendment 5). |
| `App.tsx` (`pendingMoves`, `sidebarProjects`, `handleReorderProject`) | The moves out, oldest first. `sidebarProjects` is the tree with their parents laid over once, and `pendingMoves` goes to the sidebar beside it for the order. Each move leaves with its own answer, in the update that folds the answer or on its failure (D5). |
| `ProjectSidebar.tsx` (`pendingMoves`), `projectTreeUtils.ts::flattenTree`, `fullChildrenOf`, `useProjectDragReorder.ts` (`moves`) | The moves out, read where siblings are ordered: the render list, the real tree's children, and the hook's first-child lookup and branch walk, which are `fullChildrenOf`'s (Amendment 7). |
| `useProjectDragReorder.test.ts`, `projectTreeUtils.test.ts`, `SortableProjectRow.test.tsx`, `lib/hierarchy.test.ts`, `App.pendingMove.test.tsx` | The gap, the hook, the row and the copy, the overlay, and the move in `App.tsx` (Phase 1's tests, with Phase 5's: the slot layer, the render list and children with a move out, a pickup reading a move out, and TREE-4.12's positions). |
| `tests/helpers/projectTreeDrag.ts` (`aim`, `aimAtOwnRow`, `ghostSlot`) | `aim` aims at a row and has no side: the ghost takes the slot of the row the copy is nearest. `aimAtOwnRow` aims at the pickup point, for the dragged project's own gap. `ghostSlot` reads the rows on either side of the ghost as painted, which a spec polls while the rows slide. |
| `tests/pages/ProjectSidebarPage.ts::ghost` | The dragged project's row, beside `dropLine`. |
| `tests/ui/project-tree-drag.spec.ts`, `tests/ui/project-tree-sidebar.spec.ts` | TREE-1.1, TREE-1.8, TREE-1.9, TREE-1.11/TREE-3.9, TREE-2.3 and TREE-4.7's drag run against the ghost (Amendment 2). TREE-1.4 and TREE-2.1 stay skipped for Story 10. |

## Amendments

**Amendment 1: Phase 1 built (Coder).** D1–D6 are built as planned. What the plan left to the Coder, and what the build found:
- **The gap function needs no dragged id.** `resolveGap(drawn, overId)` is `over`'s index in the drawn list. The ghost takes `over`'s slot, so that index is the gap among the rows without the ghost whether `over` is below the ghost's slot, above it, or the ghost itself. Every gap has exactly one row it belongs to. An id that names no row reads as below everything.
- **The overlay (D5) writes ranks.** `withMoveApplied` puts the moved project under the release's parent, beside the sibling it names (last when it names none), and ranks the new parent's children 0, 1, 2… in that order, so `sortedChildrenByParent` and every reader of `parentId` agree. The ranks sit on a copy that is never stored or sent, and the answer replaces them. **For the PO or the Architect:** wiki positioning §5 says the client never computes a position value "not even for display". A rank is an index in the drawn list, the ordinal feedback that section describes, but it is held in the `position` field of the copy. The alternative is threading the moves through `flattenTree`, `fullChildrenOf`, `getSubtree` and `classifyTargets` separately, which is the disagreement D5 names. Say if §5 wants a word on this.
- **A refused move leaves at the failure, not with the refetch.** `handleReorderProject` clears it when the request fails and starts the refetch after. With the server stopped, the refetch fails too, and a move that waited for it would stay drawn. Phase 2's "goes back when the request fails" is that.
- **The test surfaces.** The ghost's row carries `data-drag-ghost` with its depth. The line carries `data-drop-line` with its depth (it has no side), and `data-drop-invalid`. The ghost's row sits above the rows it slides past (`z-10`), so the row above never covers the line.
- **The copy's edge is a ring, not a border,** so its name is not pushed in by the border's width and sits exactly at `projectNameIndentPx` over the ghost's.
- **Skipped specs, worded without IDs.** The plan suggests the reason "updated in Story 8.12's Phase 3", which `check:docs` rejects in a code comment, so the reasons state the fact. TREE-1.1 and TREE-1.11/TREE-3.9 already had a reason that said the ghost was still to come, and it now says the specs are what's left. TREE-1.8, TREE-1.9, TREE-2.3 and TREE-4.7's drag ("a drag of X under P, after B") are skipped as well: each aims at a row's half or reads the line's side. TREE-4.8 still passes, since a refused move goes back either way.
- **The E2E helper's 60ms guard stays.** A copy already at its place, a set-down in the project's own slot, goes at once, so the guard after the wait for the copy is still needed. Its comment now says that.
- **Comments that said the sidebar draws no ghost** are corrected: `dragChrome.tsx`, `dragCollision.ts::namedAnchorFor` and `dragRegions.ts` besides the ones the plan lists.
- **Checked in a browser** (a throwaway Playwright probe, deleted): the ghost moves to the gap and the rows slide; the line is at `projectNameIndentPx` on the ghost's top edge; the copy stays at the list's left edge and its width; a still cursor holds one gap; a release draws the project at its new place at once, with the answer 900ms out; a refusal puts it back; Escape glides the copy home in about 300ms.
- **Gate:** `npm run check` passes (438 server, 778 client, 245 script tests). `npm run test:e2e`: 209 passed, 28 skipped, none failed. That is 8.11's 213 passed and 24 skipped, less the four specs skipped here (TREE-1.8, TREE-1.9, TREE-2.3, TREE-4.7's drag). The board's drag specs are unchanged.

**Amendment 2: Phase 2 approved, and the specs updated (Coder, Nathan, 2026-11-04).** Nathan tried Phase 1 and approved it as built: "the placement feels much more intuitive now". He raised nothing to change, so D4's held copy stays, which settles the open question below. He asked for the skipped specs to be unskipped where that is straightforward, and the rest deferred to Story 10.
- **Unskipped, all straightforward:** TREE-1.1, TREE-1.8, TREE-1.9, TREE-1.11/TREE-3.9, TREE-2.3 and TREE-4.7's drag. Their titles keep their case IDs.
- **Where a spec checks the line, it checks the ghost in the same test.** The ghost's slot is the rows on either side of it (`ghostSlot`), and its depth is `data-drag-ghost`. TREE-1.1 and TREE-1.11/TREE-3.9 check the line's start at `projectNameIndentPx`. TREE-1.1 also checks that B slid a row down while the rows above it stayed, and that no row was added for the ghost. TREE-1.11/TREE-3.9 also checks the carried copy's dashed outline over the cap and none inside it.
- **TREE-1.8, TREE-1.9, TREE-2.3 and TREE-4.7's drag** aim at the dragged project's own row (`aimAtOwnRow`) for its own gap, where they aimed at a neighbor's half.
- **`aim` lost its `side` argument.** Every caller is updated, `TREE-1.12`, `TREE-2.2`, `TREE-4.8` and the resize spec's drag among them. TREE-4.8 aimed at A, which under the ghost is the gap above A, so the move it refused was not the under-A move it describes. It passed either way, since a refused move goes back wherever it was aimed. It now aims at the gap under A.
- **Deferred to Story 10: TREE-1.4 and TREE-2.1,** as the plan has them. Their rows aren't drawn while X is carried, and the Planner rewrites the cases first. Only their calls to `aim` changed, so they still compile, and each is still skipped with its own reason.
- **The drawn-then-back case** (a refused move drawn at the release, then put back) has no spec. `App.pendingMove.test.tsx` covers it, and so did the Phase 1 probe. A spec would need a delayed refusal. Say if you want one in TREE-4.8.
- **Gate:** `npm run check` passes. The sidebar specs ran five times over with none failing. `npm run test:e2e`: 215 passed, 22 skipped, none failed, which is Phase 1's 209 and 28 with the six unskipped.

**Amendment 3: Phase 4 wrote the Living-docs handoff (Coder, Nathan, 2026-11-04).** Nothing was built, so the gate was not rerun, and the docs the Coder doesn't own are untouched. One correction to D5, which the handoff carries to the PO:
- **D5 says what's left of the mid-drag window is a refused move.** It is not the only thing. A drag's own move is drawn at the release, but an edit from the project page's parent dropdown, a create, and the read that follows a refusal are not, so each can still land after a pickup. D5's other claims hold: the user's last drag is already in the tree at the next pickup, and the tiers and branch held at pickup are unchanged. The handoff words §1's last bullet around those causes, and TREE-1.14 to TREE-1.16 around an edit or a refused move going back.

**Amendment 4: the wiki (PO, 2026-11-04).** The handoff's decisions and superseded passages, as it lists them.
- **The gap is the ghost's slot, now a shared rule,** in hierarchy-placement §1: the ghost is a row standing for the entry, drawn at the gap and at the depth a release there gives, while the rows slide aside in the list's standard shuffle; Top and Bottom are the rows on either side of it; the gap is read from list order, never a row's half, with the board's Why. "Chosen by vertical position" and "how a surface shows the gap is its own" go. Each surface's page says how its ghost takes a slot, and the intro says so.
- **Board §7.1's gap bullet** keeps the board's own half, the column's shuffle (§2), and cites hierarchy-placement §1. §2's own "Why not the half" stays, since it's the column's rule too. No section number changed.
- **Project-tree:**
  - **§1:** "An indicator line, not a ghost" is replaced by the ghost and the slot it takes: the row the drag copy is nearest, below, above or its own; every gap reached from one row; a still cursor holding one gap; a release saving the gap and depth the ghost shows. A new bullet: the list is the rows drawn, a collapsed project once, its hidden rows and the branch not at all. "Resting on" its own row becomes the ghost nearest it. The empty hierarchy leaves the ghost where it is. Past the cap the line and the copy are marked invalid. The last bullet's window is now the changes no drag drew: an earlier create's or parent edit's answer, and a refused move going back with the read that follows (Amendment 3). Its cycle, cap and Why sentences stand.
  - **§2:** the dragged row is the ghost, at its strength and at the depth; only the ghost is dimmed on a tree well within the cap; the values bullet names the ghost. A new paragraph: the line on the ghost's top edge in every gap, the Why of the top, its start at the ghost's name, full strength, none until the pointer first moves nor in an empty hierarchy. The branch paragraph says the own row stays at the pickup, as the ghost.
  - **§4:** a new paragraph, a drag's move is drawn at its release with its branch, by the relation it sends; the answer puts the project where it's drawn (positioning §5), so a success doesn't visibly change; moves released one after another each settle by their own answer. A failed move goes back as soon as it fails, without waiting for the read.
  - **"The look of the drag's cues"** gains the ghost's look, the copy's red outline, its hold to the width and layout at the ghost's depth, the 14px a level, and the glide at a drop and at an end that writes nothing.
- **Deductions, for Nathan to overrule:**
  - **The gap's reading is shared,** by the wiki README's convention and as the tiers (8.7) and the branch (8.11) went. The handoff left it to the PO.
  - **The line's start is a rule** (8.11's D8), as the handoff recommends: it's what tells a gap's depths apart. Worded as "where the ghost's name starts", not in pixels.
  - **The held copy and the glide are looks,** in the Open questions, as the handoff recommends, since the board's equivalents aren't rules either. So is the copy's name sitting over the ghost's.
  - **§4 states the answer changes nothing drawn,** from positioning §5's ordinal argument, in place of "replaces the drawn move in one update", which is how the client gets there.
  - **"Several moves out" is worded as "released one after another"** and left at each settling by its own answer.
- **Not taken into the wiki:** 8.11's D7, undone here. The scrolled list and two drags in quick succession, which neither the build nor the hands-on ran.
- **For Nathan: the ranks against positioning §5** (Amendment 1). §5 says the client never computes a position "not even for display", and its Why is that a number held in client state is one something will be tempted to send. `withMoveApplied` puts ranks in the `position` of a copy. The board's `itemListOps.ts::applyPlacements` places by slot and never touches `position`. Options: §5 gains a sentence that a display-only rank is ordinal feedback; or §5 stands and the sidebar's overlay orders by slot as the board's does, a fix for the Architect to place. **The PO recommends the second:** the rule's Why is the very risk, and the board shows it can be met. **Nathan ruled the second (2026-11-04),** since it's how the board's items work: `applyPlacements` places a dragged or dropped item by slot in the columns and in a Card's descendants section, and its module header says `position` is never touched client-side. §5 stands unchanged. The sidebar's `withMoveApplied` is to lay a move over the tree by slot, without writing ranks into `position`, in the same three readings D5 names. For the Architect to place: the roadmap treats it as a defect fixed in Story 8.
- **For the Test Planner:** the handoff's list stands. The new cases' ground: the ghost and its slot, project-tree §1 and hierarchy-placement §1; the line, §2; the copy's invalid mark, §1; the move at the release and its failure, §4. The copy's hold, its step and the glide are Open questions, so no cases for them.
- **For the Architect:** the handoff's items stand, and the ranks fix above.
- **Checks:** `check:docs` passes. Nothing is committed.

**Amendment 5: a move drawn by slot, folded in (Architect, Nathan, 2026-11-04).** This is Amendment 4's ranks fix. Nathan folded it into this story as Phase 5, rather than leave it as a Story 8 defect for later. D5's other rules hold: when a move is drawn, when it leaves, and the three readings that agree.
- **The parent is laid over, and no position is.**
  - `withMoveApplied` gives the moved project the release's parent and leaves every `position` as the server sent it.
  - The board's `itemListOps.ts::withPendingParents` does the same.
  - `getSubtree`, `classifyTargets` and `getAncestors` read parents only, so they're unchanged.
- **The order is laid over where siblings are sorted.**
  - `sortedChildrenByParent` takes the moves out, none by default.
  - After the sort, each move, in the order sent, takes its project out and puts it back in its parent's children:
    - after `prevId`;
    - before `nextId`;
    - last when it names neither, or the one it names isn't there, as `withMoveApplied` does today.
  - A parent no node has counts as the top level, as the sort's rule has it.
  - This is `applyPlacements`' rule: take the item out and put it back by its slot, in the order recorded.
- **The sidebar takes the moves beside the tree.**
  - `App.tsx` passes `pendingMoves` with `sidebarProjects`, and `flattenTree` and `fullChildrenOf` pass them to `sortedChildrenByParent`. Those two are the only readers of sibling order.
  - So D5's three readings still agree. The parent is laid over once, in `App.tsx`, and the order once, in the one sorted index.
  - The prop's shape is the Coder's call.
- **Why not `applyPlacements` itself:**
  - It's items-only, and it lives in the board's directory, which `lib/` mustn't import from.
  - Moving it would touch the board, which this story leaves alone.
  - The two spell one slot rule. Sharing it isn't part of this fix.
- **What it settles:**
  - Wiki positioning §5 stands, as Nathan ruled. No client copy holds a computed `position`.
  - The root AGENTS.md needs no change.
  - The PO's §4 passage stands: a move is drawn "by the relation it sends".
- **For the Test Planner:** no case changes. What's drawn, and when, is the same.

**Amendment 6: test-plan follow-up (Test Planner, 2026-11-04).** Applied the handoff after the PO's wiki pass, deriving the catalog changes from the settled wiki without reading code or test code.
- **The ghost and line:** rewrote TREE-1's line-only and row-half wording around the ghost's slot and depth, the top-edge line, own-row return, shuffle and fixed row count. TREE-1.11 and TREE-1.13 now mark the copy as well as the line invalid; their exact styling stays undesigned. TREE-2's ghost, tier and restoration wording follows, and TREE-2.13 covers line onset and alignment across gaps and depths.
- **The remaining response windows:** TREE-1.14 and TREE-1.15 use parent edits and creates answered after pickup. TREE-1.16 uses a parent edit or an earlier drag being refused, and keeps the moved-out branch hidden until the drag ends. TREE-2.6 uses a parent edit for tier lifetime. No case still treats an unanswered successful drag as absent from the next pickup tree; TREE-4.11 covers that tree explicitly.
- **The move:** TREE-4.7 and TREE-2.12 draw it and its branch at release. TREE-4.8 and TREE-2.3 require rollback at the failure, not after the read. New TREE-4.9 and TREE-4.10 pin the accepted placement and independent answers, including one failure with another move pending or already successful. TREE-3.9 keeps the shared-cap rule without promising that a pickup state remains legal after a later tree change.
- **Positions:** read Nathan's ruling added to Amendment 4 during this pass. Positioning §5 stands. New TREE-4.12 requires the drawn move to keep the server-returned position values while ordering by slot; it takes its numeric position from the answer. It covers the rule Nathan kept without depending on how the Architect replaces the ranks.
- **Shared rules:** the project cases cite hierarchy-placement §1 where they assert ghost-slot placement. The board's gap case DRAG-4.8 already cites that section and still matches it; no board case changes are needed for the shared-rule move.
- **For the Coder and Reconciler:** the eight new cases are Open with no Automation mapping. Stamp the handoff's tests only where their assertions cover those cases and assess all revised mappings. TREE-4.8's existing undelayed-refusal spec is reported not to prove the drawn-then-back intermediate state; its current Automated status is not a new coverage judgment. The six reported unskips need confirming against their revised cases. TREE-1.4's reported skipped-only mapping still needs its Automated status corrected by the Reconciler; TREE-2.1 remains Open. No existing status or Automation field is changed here.
- **Routing:** the roadmap's Story 10 item 10 records the reported unskips and names the remaining gesture-dependent cases, including the new IDs. TREE-4.12's implementation coverage belongs with this story's Phase 5, which the Architect added during this pass, with only any remaining gesture-dependent coverage routed to Story 10. Phase 5 changes no expected visible placement in the cases. No copy-hold, pixel step, exact invalid styling or glide case is written: the PO left those in Open questions. No new Pending PO case arose.
- **Checks:** `npm run check:docs` passes (403 files, zero hits), and `git diff --check` passes. This documentation pass ran no runtime tests.

**Amendment 7: Phase 5 built (Coder, 2026-11-04).** A move is drawn by slot, as Amendment 5 has it. No position is written on any copy, and what is drawn is what it was. What the plan left to the Coder, and what the build found:
- **The prop's shape.** `ProjectSidebar` takes `pendingMoves` beside `projects`, whose parents are laid over. `flattenTree` and `fullChildrenOf` take the moves as a last parameter, none by default.
- **`useProjectDragReorder` takes them too.** Amendment 5 names `flattenTree` and `fullChildrenOf` as the readers of sibling order, and the hook is a third caller of `fullChildrenOf`: its first-child lookup, which names the neighbor of a tab into a gap, and its branch walk. Left on the stored order, a project moved to a parent's front would be passed over for the old first child. The hook's `moves` is its last parameter, none by default.
- **`sortedChildrenByParent` takes a move's node out of whichever children hold it,** so a caller that hasn't laid the parent over still orders right, and a parent it empties is dropped from the index, so `get(parent)` is still undefined for a project with no children.
- **Tests.**
  - `lib/hierarchy.test.ts`: the `withMoveApplied` block is now "a move laid over the tree", renamed since it tests both halves. The order tests read the slot layer, no node's `position` changes, and the later of two moves of one project wins while both are out. They run with positions of their own, so a place by slot is told from a place by position.
  - `sidebar/projectTreeUtils.test.ts`: the render list and the real tree's children with a move out, one a parent's first child.
  - `sidebar/useProjectDragReorder.test.ts`: a pickup reads a move still out. The first child a tab names, the branch, and a tab into the moved project.
  - `App.pendingMove.test.tsx`: every tree assertion passes as it was, which is the check that nothing drawn moved. The stand-in sidebar had to read `pendingMoves`, since it is the sidebar's reader, and so it changed. New: **TREE-4.12**, whose title carries the ID. It is the case's example, with the positions of every project read off what the sidebar was given before and after the answer.
  - TREE-4.9 and TREE-4.10 overlap that file's tests but not their fixtures, so they are not stamped. The Reconciler judges those.
- **The handoff's two ranks lines** are marked settled by Amendment 5. The handoff's test list names `lib/hierarchy.test.ts` for the move laid over a tree, which still holds, and the describe's new name is above.
- **Not changed:** the root `AGENTS.md`, which says no project write takes a number. Whether it names `withMoveApplied` beside the board's `applyPlacements` stays the Architect's call. Wiki positioning §5 stands as Nathan ruled.
- **No hands-on,** as planned: nothing drawn changes.
- **Gate:** `npm run check` passes (438 server, 794 client, 245 script tests). `npm run test:e2e`: 215 passed, 22 skipped, none failed, the same as before Phase 5.

**Amendment 8: the tests take the cases' IDs (Coder, 2026-11-04).** The close step for the code. Titles state the revised cases, and a test carries an ID only where it asserts what the case says. No behavior changed, and no E2E spec's body did.
- **Retitled to the revised cases:** the hook's TREE-1.6, TREE-1.9 and TREE-1.10, and the E2E specs for TREE-1.1 and TREE-1.9. TREE-1.8, TREE-1.11/TREE-3.9, TREE-2.2, TREE-2.3, TREE-4.7 and TREE-4.8 kept their titles, which the cases still state. TREE-1.4's and TREE-2.1's skipped specs are untouched, for Story 10 to rewrite.
- **New tests that carry an ID:**
  - **TREE-1.17:** `sidebar/useProjectDragReorder.test.ts`, the case's table of five slots and the write each saves, every gap reached from one row, and no second gap when the copy crosses a row's middle; and `sidebar/projectTreeUtils.test.ts`, `resolveGap`.
  - **TREE-1.18:** the same two files, with the case's tree: the slot list, the gap each nearest row names, and the tab right of `T` that still names `T1`.
  - **TREE-2.1:** the hook, with the case's tree: the branch is out of the rows and of placement, the ghost has no tier and follows the gap and depth, and a release or a cancel clears the tiers and the ghost and draws the branch again.
  - **TREE-2.10:** `sidebar/SortableProjectRow.test.tsx`, the count line inside the copy, out of its box and taking no pointer, and none on the ghost in the list.
  - **TREE-2.12:** the hook, for the Escape, the own gap, the past-the-cap and the valid-drop ends, and a collapsed `A` that stays collapsed; and `App.pendingMove.test.tsx`, the drop under `Q` drawn with its branch at the release.
  - **TREE-2.13:** the hook, none before the first move and one in every gap after, and the four depths of the gap between `A1a` and `B`; and the row, the line at each depth in the ghost's name column, farther right at each deeper state, on the top edge, at full strength.
  - **TREE-4.8:** `App.pendingMove.test.tsx`, the move drawn under `A` at the release, then `X` restored as soon as it fails, whether the read is unanswered or fails too. The spec carries the create and the edit.
  - **TREE-4.9, TREE-4.10:** the same file, with the cases' trees. TREE-4.10 replaces the two two-move tests Phase 1 wrote.
  - **TREE-4.11:** the hook, with the case's chain: `P`'s branch, its line, its height, `S` Full and `T` Mid.
  - **TREE-4.12:** Phase 5's test, as Amendment 7 has it.
- **What no unit test can assert, for the Reconciler to see:**
  - **TREE-1.19.** It is about rows sliding under a held copy, which dnd-kit measures without their transform. That needs the gesture, so it is Story 10's with the other gesture-dependent cases, and its test is not stamped.
  - **TREE-2.1's `B` moves up by the branch's height, and TREE-2.10's copy box one row tall.** Both read a layout, which the unit tests don't have. Their specs are Story 10's.
  - **TREE-4.9's reload clause.** The tests above stop at the drawn tree and the answer. A reload is the server's, and the E2E specs for TREE-1.12 and TREE-4.7 read it after one, without carrying TREE-4.9's ID.
  - **TREE-2.9 and TREE-2.11** are 8.11's cases and not in this Scope. Their tests exist (the wording in `dragChrome.test.tsx`, the counts in the hook's branch tests, the copy's line in `SortableProjectRow.test.tsx`) and carry no ID yet.
- **Gate:** `npm run check` passes (438 server, 831 client, 245 script tests). The sidebar specs ran after the two retitles, with 15 passed and 2 skipped. The full `npm run test:e2e` ran after Phase 5, 215 passed and 22 skipped, and no E2E body has changed since.

## Open questions

- **For Nathan, in Phase 2:** D4's held copy, or a copy that follows the pointer sideways, as today. *Settled in Amendment 2: the held copy stays.*

## Living-docs handoff

Written by the Coder in Phase 4, after Nathan approved the gesture (Amendment 2) and the specs were unskipped and committed. No code changed in this phase. The wiki and the test plans are the PO's and the Test Planner's, and none is edited here. Story 8.11's pass left out what this story changes (its Amendment 5), so this handoff covers those passages and cases.

- **Behavior decisions made while building, for the PO to rule on:**
  - **The ghost** (D1, D2):
    - **The dragged project's own row is the ghost.** It moves to the gap and is drawn at the depth the project would land at, its own depth before the first move. It is drawn at `projectDraggedOpacity` with no tier, as that row was. The rows between it and the gap slide a row's height aside, and no row is added for it.
    - **The gap is the ghost's slot: the slot of the row the carried copy is nearest** (board-drag-interaction §2, rules 1 and 2, as on the board).
      - Nearest a row below the ghost's own slot, the ghost lands after it. Nearest one above, it lands before it. Nearest its own row, it stays in its own gap.
      - Every gap, the list's two ends included, belongs to exactly one row, and no row has two. A row's half is never read.
      - The rows the copy is measured against are where they were at pickup, so a still cursor holds one gap.
      - The list counts the rows drawn: a collapsed project once, its hidden children not at all, and the carried project's branch not at all. The placement still reads the real tree.
  - **The line** (D3):
    - **It is always on the ghost's top edge,** between the ghost and the row above, since the depth is decided against the project above (hierarchy-placement §1). It moves with the ghost, and it has no side.
    - **It starts at the name's column for the projected depth** (8.11's D8), so the ghost's name and the line's start share a column, and the depths of one gap can be told apart. **The PO decides whether that is a rule.** I recommend one sentence in §2, since it is what tells adjacent depths apart and the ghost, the line and the copy all use it.
    - **It is blue, and red past the cap.** There is none before the first move, and none when the dragged subtree holds every project.
  - **The carried copy** (D4):
    - It is held to the list's width: its x stays where it was picked up, and it follows the pointer up and down. It is laid out as the project's row at the projected depth, so its name sits at the ghost's name and the line's start. At pickup it is exactly over the row.
    - The depth is still the pointer's sideways travel, 14px a level, so the cursor stays on the copy's handle, a level at a time.
    - **Past the cap it takes the board's dashed red outline** (board-drag-interaction §7.2), as well as the red line. The ghost is not outlined.
    - Nathan kept the held copy (Amendment 2). I recommend it joins the Open questions' look of the drag's cues, with the board's equivalent, and is not a rule.
  - **A move is drawn at the release** (D5):
    - **A release that writes draws the project at its new place at once,** with its branch, by the relation it sends. A collapsed parent opens on the drop (§11).
    - **The answer replaces the drawn move in one update,** so no frame shows the old place.
    - **A refused move goes back at the failure,** and the read of the tree follows. It does not wait for that read, which fails too when the server is down.
    - **Several moves out at once each leave with their own answer.** A second drag released meanwhile loses neither.
    - **The next pickup reads the tree with the moves laid over,** so its subtree, tiers and branch include the user's last drag.
    - **What can still land mid-drag** (Amendment 3). §1 says the user's own last move can land mid-drag. A drag's move no longer does. An edit from the project page's parent dropdown, a create, a refused move going back, and the read after a refusal can. §1's last bullet keeps its rules for these. The cycle it describes is reachable by an edit that puts a project under the dragged one.
  - **Where a drag ends** (D6). A drop glides the copy into the project's new place. An end that writes nothing (Escape, the own gap, a release past the cap) glides it back to the project's own slot, where the ghost returns. The branch is drawn again at every end (hierarchy-placement §8). The board's glide is no wiki rule, so I recommend this one is a look, with the copy's.
  - **A drawn move uses ranks** (Amendment 1). While a move is out, the new parent's children are ranked 0, 1, 2… in the `position` of a copy that is never stored or sent. Wiki positioning §5 says the client never computes a position "not even for display". A rank is an index in the drawn list, which §5 calls the ordinal feedback. **The PO or the Architect decides whether §5 says so,** or wants the moves threaded through each reader of the tree instead. *Settled by Amendment 5, built in Amendment 7: Nathan ruled for the second. The overlay lays the parent over and places each move by slot, and no position is written.*
  - **8.11's D7 is undone** (D6), so it goes to neither the wiki nor the test plan. **8.11's D8 is kept** as the line's start (above).
- **Planned passages now built:** none. None were planned.
- **Passages superseded,** each for the PO:
  - **project-tree §1, "An indicator line, not a ghost":** the whole bullet. The dragged project's own row is a ghost that moves to the gap, the rows slide aside to make room, and a line rides the ghost's top edge. The bullet's "the line's position is the gap" and "a release saves exactly the gap and depth the line shows" hold for the ghost too. "The line is the only cue" goes.
  - **project-tree §1, the cap bullet:** "its line is marked invalid" gains the carried copy, outlined as the board's is. "How the invalid line looks isn't a rule yet" is true of both.
  - **project-tree §1, "The drag counts the tree as it was at pickup":** "A move is shown when its response arrives (§4), so the user's own last move can land mid-drag" goes. A drag's move is drawn at the release, and the causes that remain are Amendment 3's. The cycle and cap sentences hold for them. Why not stop the drag, as the board does at a reload: the window is one response's time, and a refused drop costs one retry.
  - **project-tree §1, resting on the dragged project's own row, and the empty hierarchy:** both hold. "Resting" is the copy nearest the row, and the empty hierarchy draws no line and leaves the ghost where it is.
  - **project-tree §2:**
    - "The dragged project's own row is drawn at a strength of its own" becomes the ghost, at that strength, at the gap and the depth.
    - "The rows below move up by the branch's height, and the project's own row stays" no longer holds for the row: it is the ghost, and the rows slide to make room. The branch still leaves the rows.
    - New: the line along the ghost's top edge, against the project above, starting at the name's column; the copy held to the list's width and stepping with the depth; the copy's outline past the cap.
  - **project-tree §4, "After a failed write, the sidebar shows the project where it was before the attempt":** a drag's move is drawn at the release and goes back when it fails. A failed create shows no new project and a failed edit leaves the project where it was, as written. New: a move's answer replaces the drawn move in one update.
  - **project-tree, Open questions, "The look of the drag's cues":** gains the ghost's strength, the copy's look and hold, and the glide, beside the over-cap look and the tiers'.
  - **hierarchy-placement §1:** "chosen by vertical position" and "how a surface shows the gap is its own". Both surfaces now read the gap as the ghost's slot, from list order, never a row's half. Board-drag-interaction §2 and §7.1 hold that rule for the board, and project-tree §1 would for the sidebar. **The PO decides whether it becomes a shared rule here.** §5 and §8 hold: §8's "wherever the hierarchy then has it" is, on the sidebar, the new place from the release.
- **Implementation passages to place:** placed by the Coder, in docs the Coder owns:
  - the module headers of `useProjectDragReorder.ts`, `projectTreeUtils.ts`, `SortableProjectRow.tsx`, `ProjectSidebar.tsx` and `hierarchy.ts`, and the comments in `dragChrome.tsx`, `dragCollision.ts` and `dragRegions.ts` that said the sidebar draws no ghost;
  - `workflow/AGENTS.md` and the root `AGENTS.md`, neither of which says anything this story makes false.

  Nothing for the PO.
- **Test-plan cases affected,** for the Test Planner after the PO's pass:
  - **TREE-1, wording.** Where a case says the line is in or shows a gap, the ghost is in it, with the line on its top edge. That is TREE-1.2, TREE-1.3, TREE-1.5, TREE-1.6 and TREE-1.10, whose rules and hook tests hold, and the TREE-1 row of `INDEX.md`.
  - **TREE-1.1:** "no row slides aside, and no ghost is shown" is reversed. The ghost is between `A1a` and `B` at `A1a`'s depth, `B` has slid a row down, the rows above have not, and the line is on the ghost's top edge, starting at the name's column. A release saves `A1` as the parent, after `A1a`, where the ghost was. Its spec is updated.
  - **TREE-1.8 and TREE-1.9:** "until the line shows another gap" and "the line moves to `X`'s own gap" become the ghost and the line with it. Their rules hold. Their specs are updated.
  - **TREE-1.11:** "its line is marked invalid" gains the carried copy's outline. Its spec is updated (TREE-3.9 is the same test).
  - **TREE-1.14 to TREE-1.16:** their setups are "the user's earlier saved move whose response is still pending", which no longer lands after a pickup. Reword around Amendment 3: an edit or a create whose answer lands after the pickup (TREE-1.14 and TREE-1.15), and for TREE-1.16 an edit that moves a descendant out, or a refused move going back. Their rules hold. They stay Open, with no test.
  - **TREE-1.6:** the hook test no longer hands the hook an `over` dnd-kit does not report. It rests on `X`'s own row, as the case says.
  - **TREE-2.1:** "`X`'s own row stays drawn at `projectDraggedOpacity`" becomes the ghost. "`B` moves up by the height their rows occupied" holds at the pickup. Its spec stays skipped for Story 10.
  - **TREE-2.3:** `X` is drawn under `T` at the release, `T` is opened, and then `X` goes back when the server refuses. The case's end state holds. Its spec is updated.
  - **TREE-2.7:** the line is on the ghost now, not beside `S`. It stays at full strength while the ghost it rides, like `S`'s content, is dimmed. Reword; the rule holds.
  - **TREE-2.12:** the last sentence, "This case does not fix when a successful move changes `X`'s place in the sidebar", goes: it changes it at the release. The first bullet's "drawn under `X` throughout the move" is now exact.
  - **TREE-4.7:** the first bullet holds. Its drag spec is updated.
  - **TREE-4.8:** the first bullet gains the drawn-then-back: `X` is drawn under `A` at the release, then shown top-level and last after the refusal. Its spec aims at the gap under `A` now. It does not delay the refusal, so the in-between has no spec.
  - **New cases for the ghost and the move:**
    - the ghost moves to the gap, is drawn at the projected depth, adds no row, and the rows slide aside;
    - the gap is the slot of the row the copy is nearest: below the ghost's slot, above it, its own row, the list's two ends, past a collapsed project, past the hidden branch, and a still cursor holding one gap;
    - the line is on the ghost's top edge in every gap, starts at the name's column, and is red past the cap; there is none before the first move, or when the subtree holds every project;
    - the copy is held to the list's width and steps with the depth, its name at the ghost's column; it is outlined past the cap;
    - a release draws the move at once with its branch, the answer replaces it in one update, a refused move goes back, and two moves out each leave with their own answer;
    - an end that writes nothing glides the copy back.
  - **Tests the new cases can cite,** none with a case ID yet:
    - the gap: `sidebar/projectTreeUtils.test.ts` (`resolveGap`);
    - the ghost, its slot and the line's state: `sidebar/useProjectDragReorder.test.ts`;
    - the ghost's row, its line, and the copy: `sidebar/SortableProjectRow.test.tsx`;
    - a move laid over a tree: `lib/hierarchy.test.ts` ("a move laid over the tree", `withMoveApplied` and the moves `sortedChildrenByParent` takes);
    - the render list and the real tree's children with a move out: `sidebar/projectTreeUtils.test.ts`; a pickup reading one: `sidebar/useProjectDragReorder.test.ts`;
    - a move from its release to its answer: `App.pendingMove.test.tsx`, which also carries TREE-4.12.
  - **Skipped specs, all in `tests/ui/project-tree-drag.spec.ts`:** TREE-1.4 and TREE-2.1 stay skipped for Story 10, each with its reason. The six specs this story unskipped are TREE-1.1, TREE-1.8, TREE-1.9, TREE-1.11/TREE-3.9, TREE-2.3 and TREE-4.7's drag, and their case texts above are what follows.
- **For the Architect:**
  - **Story 10's item 10** says "TREE-1.1 and TREE-1.11/TREE-3.9 remain skipped only until Story 8.12 updates and unskips them". They are unskipped, with TREE-1.8, TREE-1.9, TREE-2.3 and TREE-4.7's drag. It holds TREE-1.4 and TREE-2.1 for the sidebar now, as before.
  - **Gesture-dependent coverage no spec has** (Story 8 allows no new drag specs): the copy held at the list's x and stepping with the depth, a refused move drawn then put back, two drags released in quick succession, and a scrolled list. The unit tests cover the move's life from release to answer and two moves out (`App.pendingMove.test.tsx`) and the copy's depth, and Phase 1's probe checked the held x and a refusal in a browser. The Coder ran no scrolled list and no two drags in quick succession, and the hands-on's report doesn't mention either.
  - **The roadmap's 8.12 entry** has a "Today" paragraph that says the ghost stays at the pickup and that this reverses "an indicator line, not a ghost". That is right as the problem's statement and wrong as live.
  - **The depth range** (inbound 3). D2 and D4 are the answer, and Nathan's hands-on said the placement feels more intuitive and raised nothing against the range. The Coder ran neither the scrolled list nor the deep stack against it. If it comes back, the roadmap treats it as a defect, fixed in Story 8.
  - **Wiki positioning §5 and the ranks** (above, for the PO). The root `AGENTS.md` says no project write takes a number, which is still true. Whether it names `withMoveApplied` beside the board's `applyPlacements` is the Architect's call. *Settled by Amendment 5: the ranks are gone, wiki positioning §5 stands, and the root `AGENTS.md` needs no change.*
- **Left to the Coder at close:**
  - **The unit tests take the new cases' IDs** in their titles, and the old ones whose wording moved are retitled: the hook's TREE-1.6 and TREE-2.x describes, and `SortableProjectRow.test.tsx`'s TREE-2.1 and TREE-2.7. *Done: Amendment 8.*
  - **The gate,** if that changes anything. *Done: Amendment 8.*
- **Test-plan handoff applied** (Test Planner): Scope and Amendment 6 record the revised cases, eight new Open cases, Reconciler checks and Story 10 routes. TREE-4.12 covers positioning §5 for Phase 5; the visible placement cases need no further change for that implementation fix.
- **Wiki sections added, changed, moved or removed** (PO, at close): hierarchy-placement §1 (the gap is the ghost's slot, now shared) and its intro; board-drag-interaction §7.1's gap bullet (its shared half moved to hierarchy-placement §1); project-tree §1, §2, §4 and the Open questions' "The look of the drag's cues". Positioning §5 is unchanged: Nathan kept it, and the sidebar's ranks are to go (Amendment 4).

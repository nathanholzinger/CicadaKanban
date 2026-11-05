# Epic 3.5 Story 8.11 — A project's pickup takes its descendants with it

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.11 entry · **Status:** Phase 1 built and committed (Amendment 1). Phase 2, Nathan's hands-on, found three fixes to fold in, D7–D9 (Amendment 2). Phase 3 built them, and Nathan committed them (Amendment 3). Phase 4, Nathan's hands-on, approved D9, and moved what's left of D7 and D8, with the depth-range report, to Story 8.12, "The sidebar's ghost moves to the gap" (Amendments 4 and 5). Phase 5 wrote the Living-docs handoff, for the PO's and the Test Planner's passes (Amendment 6)

## Goal

Give the project sidebar's drag the carried branch that Story 8.8 gave the board (Nathan, 2026-11-04):
- at pickup, the dragged project's descendants leave the sidebar's rows;
- the drag copy gains the second line, "+ X children, Y total descendants";
- the descendants are drawn again when the drag ends.

**What happens today** (wiki project-tree §1 and §2, Story 8.7):
- The dragged project's descendants stay drawn in place, at Low, and take no pointer.
- Resting on one of them means the project's own gap (`projectTreeUtils.ts::resolveGap`).
- The copy, `SortableProjectRow.tsx::DragGhost`, shows the project's name alone.

**Where it differs from the board:**
- **The branch is the whole subtree.** Projects have no Free links, so every descendant goes with its parent.
- **It reads the real tree.** A row under a collapsed project isn't drawn, but it moves with the project, so it counts, as 8.8 counts the rows behind an overflow row. The sidebar keeps the real tree beside the drawn one (`fullChildrenOf`).
- **The copy has one form.** It never switches between a shortCard and a Stub, so the line has one place to go, and nothing re-anchors.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds it, and Nathan tries it hands-on.
- The PO and the Test Planner write the docs after he approves.
- No trial switch: the behavior is 8.8's, which Nathan has settled, applied to the sidebar.
- No new drag specs. A drag spec that fails because it pins today's drawing is skipped with a one-line reason, for Story 10.

**Found in the hands-on, and folded in** (Nathan, 2026-11-04). All three are older than this story:
- **A drop's copy flies back to where it was picked up,** though the project lands where the line showed (D7).
- **The drop line for "child of Top" reads as Top's sibling.** It starts left of Top's name (D8).
- **A new subproject is hidden under its parent,** which starts collapsed when it was created after the sidebar loaded (D9). Not a drag change: it rides along because it's the same sidebar.

D9 closes with this story. D7 and D8 ship as built, each better than what it replaced, and what's left of them moves out (below).

**Found, and moved out** (Phase 4, Nathan, 2026-11-04) to Story 8.12, "The sidebar's ghost moves to the gap" ([`story-8-12-sidebar-ghost-moves-to-gap.md`](story-8-12-sidebar-ghost-moves-to-gap.md)), which runs next. In that story the dragged project's ghost row follows the gap, as a Stub's does. Moved there:
- **Sometimes the only depth a gap offers is "child of the row above",** where Nathan expected hierarchy-placement §1's full range. It outlasted D8. Nathan suspects how the cursor is read, more than the placement rule.
- **The drop line isn't always drawn where the cursor suggests** (D8's remainder).
- **The movement after a drop is still awkward** (D7's remainder).

**Out of scope:**
- **What the board does.** Its walk, wording and line move to where the sidebar can use them, and nothing the board draws or places changes.
- **The tiers of the rows that stay.** They're Story 8.7's, unchanged.
- **The line's final look.** It keeps the board's placeholder look. Tuning it, on both surfaces, is "The cues' final look"'s (roadmap, Story 8). D8 moves where the drop line starts, not how it looks, and the indent per level stays 14px.
- **A line on the ghost row.** The dragged project's own row in the list stays one row at the ghost's strength, as the board's ghost shows no line.

## Scope

- **Wiki passages:** none ahead of the build. The PO writes the rules once Nathan approves (code first).
- **Test-plan cases (Test Planner, after the PO's pass):**
  - Revised sidebar expectations: **TREE-1.4, TREE-1.6, TREE-1.9, TREE-2.1 and TREE-2.4.** TREE-1.9 changes only its last sentence; its gap-reading assertions wait for 8.12.
  - Added, all **Open**: **TREE-2.9–TREE-2.12** (real-subtree counts and hidden rows, copy-only line and box/pointer behavior, narrow-sidebar truncation, and restoration at every end) and **TREE-11.1–TREE-11.8** (initial/new-project expansion, chevrons/reload, successful and failed creates and parent changes, unchanged-parent edits, and top-level writes). TREE-11.1 is the new-project/first-subproject case the Coder's D9 spec awaits.
  - Rule-pointer updates: **TREE-2.2 and TREE-2.3** cite project-tree §11; **DRAG-1.33, DRAG-2.17, DRAG-3.19, DRAG-3.22, DRAG-3.25, DRAG-7.27 and DRAG-8.1–DRAG-8.12** cite shared hierarchy-placement §8. **DRAG-8.10** also makes the shared line's one-row height and taking no pointer explicit. Board behavior otherwise stays the same.
  - **8.12 retains** TREE-1.1, TREE-1.8, the rest of TREE-1.9, TREE-1.11/TREE-3.9, TREE-1.14–TREE-1.16 and TREE-4.8, with D7/D8. **Story 10's item 10 retains** the skipped TREE-1.4 and TREE-2.1 surface specs, plus remaining gesture-dependent coverage after reconciliation. Existing statuses and Automation lines are left for the Reconciler to confirm.

## Inbound deferrals

None. The roadmap's 8.11 entry is the story's own, found with Story 8.8.

## Approach and phases

### Decisions

**D1. The branch is read once at pickup and held for the drag.**
- It's every descendant of the dragged project in the real tree, collapsed ones included, with two counts: the project's children, and the whole branch.
- It's held as the sidebar already holds what it draws by (`useProjectDragReorder.ts::drawnAtPickup`: the tiers and the subtree), and as 8.8 holds the board's branch.
- **A response that lands mid-drag changes none of it** (wiki project-tree §1, "The drag counts the tree as it was at pickup"):
  - a descendant that the response moves out stays hidden until the drag ends, and stays out of placement, as it does today (TREE-1.16);
  - a project the response moves under the dragged one isn't in the branch. It's drawn where the tree puts it, and stays a place to drop, as §1 says, though the branch's rows above it aren't drawn.
- Either needs the user's last move to land mid-drag, a window of one response's time.

**D2. One walk, in the shared layer** (root AGENTS.md, "One position math layer").
- `CarriedBranch` and `carriedBranchOf` move from `workflow/itemListOps.ts` to `lib/hierarchyPlacement.ts`, beside `flattenHierarchyOf`. They become table-generic: a root id and a `childrenOf`, the shape of the module's other walks. The Coder settles the exact signature.
- **The board** passes what it passes today, its placement-aware attached children, so its branch doesn't change.
- **The sidebar** passes the real tree's children (`hierarchy.ts::sortedChildrenByParent`, which `fullChildrenOf` reads).
- On the sidebar the walk's ids are `getSubtree`'s `descendantIds`, since projects have no Free links. The hook keeps `getSubtree` for what it answers today: the ids placement leaves out, and the height the cap reads. The copy's branch, and the rows that leave, are the walk's.
- The module's header says it now also holds what a drag carries.

**D3. The line and its wording go to `dragChrome.tsx`.**
- `carriedBranchLabel` (from `itemListOps.ts`) and `CarriedBranchLine` (from `StubRows.tsx`) move to `components/dragChrome.tsx`, the drag chrome both surfaces already import.
- The line uses the overflow row's text look, `StubRows.tsx`'s `OVERFLOW_TEXT_CLASS`. `StubRows.tsx` imports `dragChrome.tsx`, so the line can't read the class from there without an import cycle. It moves where both reach it, `dragChrome.tsx` or `cardMetrics.ts`, the Coder's call.
- The wording doesn't change: "+ 1 child", "+ X children", "+ X children, Y total descendants".

**D4. The sidebar draws its rows without the branch, from pickup to the drag's end.**
- The rows `ProjectSidebar.tsx` draws are `flatItems` without the branch's ids, as the board's `sectionEntries` takes `branchIds`. The hook says which rows are drawn, so its tests cover them.
- The dragged project's own row stays, at the ghost's strength.
- `SortableProjectRow`'s `isDescendantOfActive` goes, with the dimmed, pointer-less drawing it gives a descendant. So does the hook's `descendantIds` output.
- **Placement doesn't change.** From reading the hook:
  - `rows`, what a gap is computed against, already leaves the whole subtree out (`toRows(flatItems, exclude)`);
  - `resolveGap`'s scan and `releaseOf`'s own slot read `flatItems`, where the subtree comes right after the project's row, so their indexes are the same whether the branch is drawn or not;
  - so the drop line, the projection, the cap's check and the release are what they are today. The hook keeps reading the full `flatItems` for them.
- **What dnd-kit measures changes.** At pickup the rows below the branch move up by its height. `SortableContext`'s items change in the same render, which re-measures. The Coder checks that the collision reads the moved rows from the first move on.
- `resolveGap` keeps its path for an `over` inside the subtree, which the project's own row still takes. A descendant can't be `over` any more, so its comment changes.

**D5. The copy's second line, under `DragGhost`.**
- `DragGhost` takes the branch's counts and hangs `CarriedBranchLine` under its box, as the board's copy does: out of the flow, covering what is below it, taking no pointer. There's no line when the project has no descendants.
- dnd-kit measures `DragGhost`'s own box, the overlay's one child, so the collision and the drop side read what they read today.
- The overlay takes the source row's width, so the copy and its line are as wide as the sidebar's row. At a narrow sidebar the line truncates.

**D6. Every end of the drag draws the branch again at once:** a drop, Escape, a set-down in its own gap, a release past the cap.
- A move is drawn when its response arrives (`App.tsx::handleReorderProject`). So after a drop, the branch shows under the project where it was until the response lands, then goes with it, as the project's own row does today.
- A refused move leaves both where they were (wiki project-tree §4).

**D7. The copy goes at release, with no flight back** (Phase 2, Nathan, 2026-11-04).
- **Today:**
  - At every end of the drag, dnd-kit's default drop animation glides the copy to the dragged project's row.
  - After a drop, that row is still where it was picked up, since a move is drawn when its response arrives (D6). So the copy flies back there, and the drop reads as landing at the pickup.
  - The board doesn't show this because it draws a move at release, before the response (its pending placements).
- **The sidebar's `DragOverlay` takes `dropAnimation={null}`.** At every end of the drag the copy goes at once, Escape and a set-down in the project's own gap included. The project's row never leaves its place during the drag, so the copy has no place to show it going back to.
- The row moves when the response lands, as today. On the local server that's a frame or two.
- **It agrees with project-tree §1:** the line is the only cue, and it always matches the save.
- **It also drops a scroll.** Before animating, dnd-kit scrolls the dragged row into view (`@dnd-kit/core`'s `useDropAnimation`), so a drop far down a scrolled list could scroll the list back to the pickup. This is from dnd-kit's source, not seen in the browser.
- **Not done: drawing the move at release,** as the board does, so the copy could land at the new place. It needs a pending state in `App.tsx`, and an undo for a refused move. It's a story of its own if the response's wait ever shows.
- `DragGhost`'s comment says the copy outlives the drag by the drop animation. That changes. The E2E helper's wait for the copy to go (`tests/helpers/dragGesture.ts`) still holds, and finishes sooner.
- **Kept as built** (Phase 4, Nathan, 2026-11-04). It's better than the flight back, but the movement after a drop is still awkward. Story 8.12 draws the move at release, which should settle it.

**D8. The drop line starts where a name at its depth starts** (Phase 2, Nathan, 2026-11-04).
- **Today:**
  - It starts at `projectTreeUtils.ts::projectRowIndentPx(depth)`, the row's left padding, where the drag handle sits.
  - The handle is hidden through a drag, and so is a leaf's chevron.
  - A name starts 36px further right: the handle (12px), a 4px gap, the chevron (16px) and another 4px gap.
  - So the line for "child of Top" starts 2px left of Top's chevron and 22px left of Top's name, and reads as Top's sibling. The line for "sibling of Top" starts left of anything drawn.
- **After D8,** a sibling's line starts under Top's name, and a child's 14px right of it. The red over-cap line starts at the same place.
- **One spelling, beside `projectRowIndentPx`:** where a row's name starts at a depth. The row's own padding keeps `projectRowIndentPx`.
  - The 36px is the row's leading controls, which are Tailwind classes in `SortableProjectRow.tsx`.
  - The Coder settles how the number and the row's classes stay in step, so a change to one changes the other or says it must.
- **Placement doesn't change.** The pointer still travels 14px a level, measured from pickup. Only where the line is drawn moves.
- `projectRowIndentPx`'s comment, which says the line begins where the row's content does, changes.
- **Kept as built** (Phase 4, Nathan, 2026-11-04). A release lands at the depth the line shows, but the line isn't always where the cursor suggests. That moves to Story 8.12, with the depth-range report.

**D9. Every project starts open, and a project put under a collapsed one opens it** (Phase 2, Nathan, 2026-11-04).
- **Today:**
  - `ProjectSidebar.tsx`'s `expandedIds` starts, at the sidebar's first render, as every project's id.
  - A project created after that isn't in it, so it's collapsed, and its first subproject is hidden under it.
  - A reload opens every project.
- **The sidebar keeps the collapsed projects instead.** Every project is open unless the user collapsed it, a new one included. A reload still opens every project.
- **A collapsed project opens when a project is put under it,** by any of the three writes that can:
  - **a drop,** as today (wiki project-tree §2). It opens on the drop, before the response;
  - **a create** through `App.tsx`'s create dialog, which both the sidebar's "Add subproject" and the project page's subprojects list open;
  - **a parent change** from the project page's dropdown (`App.tsx::handleUpdateProject`).
- **A create and a parent change open the parent once the write succeeds.** Both draw their result from the response. A failed one leaves the parent as it was.
- **Opening wins over a collapse set by hand,** as the drop's rule already has it (Nathan, 2026-11-04). The dropdown's case is in on his "fold it all in".
- **How the sidebar hears of a create or a parent change is the Coder's call.** For example, the collapsed set could move up to `App.tsx`, or `App.tsx` could hand the sidebar the parent to open. The drop's `expand` either keeps its path or joins the new one, so there's one way a project opens.
- **The wiki has no rule for collapse yet.** Project-tree's Open questions list the chevrons. The PO writes it after Nathan's approval (code first).

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` against the test servers.

**Phase 1: the build** (D1–D6).
- **The moves** (D2, D3): the walk and its type to `hierarchyPlacement.ts`, the wording and the line to `dragChrome.tsx`. Their imports follow, in `useBoardDnd.ts`, `DragSessionContext.ts`, `KanbanCard.tsx` and `StubRows.tsx`. The board's behavior doesn't change.
- **The sidebar's branch** (D1): read in `drawnAtPickup`, held in `Drawn`, and returned by the hook with the rows to draw (D4).
- **The rows and the copy** (D4, D5): `ProjectSidebar.tsx` draws the hook's rows and hands `DragGhost` the counts. `SortableProjectRow` loses `isDescendantOfActive`.
- **Comments that name what moved, or say the descendants stay drawn:**
  - module headers: `itemListOps.ts`, `StubRows.tsx`, `KanbanCard.tsx`, `hierarchyPlacement.ts`, `dragChrome.tsx`, `useProjectDragReorder.ts`;
  - `dragCollision.ts` and `modalPlacement.ts`, which point at `itemListOps.ts::carriedBranchOf`;
  - `workflow/AGENTS.md`, which names both old homes;
  - `Drawn.subtree`, `SortableProjectRow`'s `rowOpacityClass`, and `projectTreeUtils.ts::resolveGap`.
- **Tests:**
  - **the walk:** its general cases go beside `flattenHierarchyOf`'s: the ids, both counts, none for a leaf. The board's own cases stay as tests of the board's reading: a Free child left out, a previewed row, rows past the section's shown levels.
  - **the wording:** moves with it, unchanged.
  - **the sidebar's hook:**
    - the branch at pickup, its ids and counts;
    - the rows under a collapsed descendant, counted;
    - held when a response lands mid-drag: a descendant moved out stays in it;
    - none for a project with no children;
    - the rows to draw leave the branch out and keep the project's own row;
    - all of it cleared on a release and a cancel.
  - **placement:** the existing tests pass as they stand.
  - **the copy:** `DragGhost` shows the line with a branch, and none without.
  - `SortableProjectRow`'s tests of `isDescendantOfActive` go with it.
- **E2E:** no new specs.
  - TREE-1.4's spec in `tests/ui/project-tree-drag.spec.ts` aims at `X1` and `X2` during `X`'s drag, rows that aren't drawn now. Its rule still holds, so it's skipped with a one-line reason, for Story 10.
  - Any other sidebar spec that fails only because a descendant isn't drawn is skipped the same way.
  - The board's drag specs should be unchanged.
- **Gate.**

**Phase 2: Nathan's hands-on**
- **Where:**
  - the dev stack, with a project that has children and grandchildren, one of the children collapsed;
  - the deep stack (`npm run seed:deep`, then `npm run dev:deep` in `server/` and `client/`), for a deep branch and the cap.
- **Try:**
  - **Pick up a project with a branch.** The branch leaves, the rows below move up, and the copy reads, for example, "+ 2 children, 5 total descendants".
  - **A collapsed child:** the rows under it count.
  - **A project with no children:** no line.
  - **Aim just below the copy.** Does the drop line still show, or does the second line cover it?
  - **The cap:** the over-cap line still shows red where it did.
  - **End the drag every way:** a drop, Escape, a set-down in its own gap, a release past the cap. Each draws the branch again. After a drop, the branch shows where it was until the move lands.
  - **A narrow sidebar:** the line truncates.
  - **The list scrolled near its bottom:** the pickup shortens it. Does the list jump under the cursor?
  - **The wording:** does "children" read right in the sidebar, whose button says "Add subproject"?
- **Nathan decides:** approve as built, or amend the plan. He amended it with D7–D9 (Amendment 2).

**Phase 3: the hands-on's fixes** (D7–D9).
- **D7:** the sidebar's `DragOverlay` takes `dropAnimation={null}`, and `DragGhost`'s comment changes.
- **D8:** the name's start at a depth, beside `projectRowIndentPx`. The drop line's `marginLeft` reads it, and `projectRowIndentPx`'s comment changes.
- **D9:**
  - the collapsed set, in place of `expandedIds`;
  - a collapsed parent opens on a drop, as today, and on a create's or a parent change's success;
  - one way a project opens, for all three.
- **Tests:**
  - **D7:** no test pins it. `ProjectSidebar.tsx` has no unit test (Amendment 1), and Story 8 adds no drag specs, so Phase 4's hands-on covers it.
  - **D8:** the name's start at each depth, beside `projectRowIndentPx`'s tests. Also the line's start in `SortableProjectRow.test.tsx`, if the Coder's spelling leaves it a test of its own.
  - **D9,** wherever the collapsed set ends up:
    - a project created after the first render starts open;
    - a create under a collapsed parent opens it, and so does a parent change into one;
    - a failed create or parent change leaves the parent collapsed;
    - a parent the user collapsed stays collapsed through a write that doesn't put a project under it.
  - **E2E:** none in this phase. The drag specs should pass as they stand. D9 isn't a drag, so its spec follows the Planner's case in Phase 5.
- **Gate.**

**Phase 4: Nathan's hands-on of the fixes**
- **Try:**
  - **A drop (D7).** The copy goes at release, with no flight back, and the project moves to the line's place.
  - **Escape, and a set-down in the project's own gap (D7).** Does an end with no write still read as one, with the copy gone at once?
  - **The line (D8).** A sibling's line starts under Top's name, and a child's 14px right of it. Is 14px enough to tell them apart, or is the indent "The cues' final look"'s?
  - **The depth range, retested after D8.** Drag to the gap under the last row of a nested branch, and move left until the line starts under each name in turn. Every depth of hierarchy-placement §1's range should come up.
    - If the line won't change even with the cursor at the sidebar's left edge, note the rows above and below the line and the dragged project's depth. That's a defect for a story of its own, not this one.
  - **A new project, then a subproject under it (D9).** Both show.
  - **A subproject created under a project you collapsed (D9),** from the sidebar and from the project page. The parent opens.
  - **The project page's parent dropdown (D9),** moving a project under a collapsed one. It opens.
- **Nathan decides:** approve, or amend the plan. He approved D9. He kept D7 and D8 as built, and moved what's left of them out, with the depth range (Amendment 4).

**Phase 5: settle and hand off**
- Whatever Phase 4 changes is built here, with an amendment.
- **D9's spec follows the Planner's case at close,** titled with its ID: a subproject created under a new project shows. It isn't a drag spec, so it isn't routed to Story 10.
- **The Coder writes the Living-docs handoff,** with at least:
  - **project-tree §1:** "Resting on the dragged project's own row, or a row of its subtree". The subtree's rows aren't drawn now, so only the project's own row is left to rest on, as on the board. The paragraph's "the subtree's dimmed (§2)" goes.
  - **project-tree §2:** "The dragged project's descendants are Low", "On a tree well within the cap, only the dragged project's descendants dim", and the example's "`X`'s child are Low". The copy's second line is new.
  - **hierarchy-placement §7:** "The dragged entry's descendants are Low, at every depth, wherever a surface draws them". The sidebar now draws none of them. Both surfaces now carry a branch with the same line, so the PO decides whether that becomes a shared rule here, with each surface's page saying what its branch holds.
  - **D7 and D8 go to neither the wiki nor the test plan.** Neither changes a stated rule, and Story 8.12 replaces both (Amendment 4).
  - **Anything Story 8.12 changes right away is left out of this story's wiki and test-plan pass** (Nathan, 2026-11-04). The handoff says so for each item it affects, so the PO and the Planner don't write a rule or a case that 8.12 rewrites next. 8.12's plan lists what it changes: the line becoming the line and the ghost, the gap read from the ghost's slot, the move drawn at release, and the copy. 8.12's own handoff covers those passages and cases.
  - **The skipped specs stay skipped here:** TREE-1.4, TREE-1.1 and TREE-1.11/TREE-3.9 (Nathan, 2026-11-04). Story 8.12 updates and unskips TREE-1.1 and TREE-1.11/TREE-3.9.
  - **project-tree §2's "A collapsed project opens when a project is dropped into it" (D9).** It now holds for a create and a parent change too, on their success. Every project starts open, a new one included.
    - The chevrons come off the page's Open questions if the PO makes that a rule.
    - §5 (creating a project) and §7 (an edit can change a project's parent) may each name the opening.
  - **For the Test Planner:**
    - TREE-2.1, whose descendants are dimmed;
    - TREE-1.6, whose subtree rows can't be rested on now, and TREE-1.9's last sentence, which points at it;
    - TREE-1.16, whose moved-out `Y` stays hidden for the drag (D1);
    - TREE-1.4, whose spec is skipped;
    - TREE-1.1 and TREE-1.11/TREE-3.9, whose specs Phase 3 skipped for the line's start (Amendment 3);
    - a new case, or cases, for the sidebar's carried branch and its line;
    - TREE-2.2, a collapsed project opening on a drop, extended to a create and a parent change, or joined by cases of their own in TREE-5 and TREE-7 (D9).
- **Gate,** if code changed.

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|
| `lib/hierarchyPlacement.ts::carriedBranchOf`, `CarriedBranch` | The branch (D1, D2), table-generic: a root id and an ids-only `childrenOf`, walked by `flattenHierarchy`. Its ids, its children (the depth-0 rows) and its whole count. Null when there are no rows. The board and the sidebar call it; neither keeps a walk of its own. |
| `workflow/itemListOps.ts` | No longer holds the branch or its wording. `sectionEntries` still takes `branchIds`, the board's reading of the set. `descendantsChildrenOf` is the board's `childrenOf` for the walk. |
| `workflow/useBoardDnd.ts::handleDragStart` | `carriedBranchOf(activeId, descendantsChildrenOf(deps.getAttachedChildren))`: the board passes what it passed, its placement-aware attached children, so its branch is unchanged. |
| `workflow/DragSessionContext.ts`, `KanbanCard.tsx` | Import `CarriedBranch` from the shared layer. |
| `dragChrome.tsx::carriedBranchLabel`, `CarriedBranchLine` | The wording and the second line (D3), one for both surfaces. The line's element is unchanged: absolute under the box it hangs from, one row tall, `pointer-events-none`, `data-carried-branch`. |
| `cardMetrics.ts::OVERFLOW_TEXT_CLASS` | The overflow row's text look, the line's too. It moved to the leaf module beside `STUB_ROW_BOX_CLASS`, which `StubRows.tsx` and `dragChrome.tsx` both read, so neither imports the other for it (D3). |
| `StubRows.tsx` | Imports `OVERFLOW_TEXT_CLASS`; the line and its wording are gone from it. |
| `sidebar/useProjectDragReorder.ts` (`Drawn.branch`, `drawnItems`, `branch`) | The sidebar's branch (D1, D4): read at pickup from `fullChildrenOf(projects)`, the real tree, so a collapsed project's rows count. Held in `Drawn` with the tiers and the subtree, so a response that lands mid-drag changes none of it. The hook returns `drawnItems`, `flatItems` without the branch's ids, and `branch`. `descendantIds` is gone. Placement reads `flatItems` and `exclude` as before. |
| `ProjectSidebar.tsx` | Draws `drag.drawnItems`, and hands `DragGhost` `drag.branch`. |
| `sidebar/SortableProjectRow.tsx` | `isDescendantOfActive` is gone, with the dimmed, pointer-less drawing it gave a descendant. `DragGhost` takes the branch, is `relative`, and hangs `CarriedBranchLine` under its box (D5). |
| `sidebar/projectTreeUtils.ts::resolveGap` | Comment only: the only row of the dragged block that can be `over` is the project's own. Its path for an `over` inside `exclude` stays. |
| `workflow/dragCollision.ts`, `workflow/modalPlacement.ts`, `workflow/AGENTS.md` | Comments and the Code map name `lib/hierarchyPlacement.ts::carriedBranchOf` and `dragChrome.tsx` for the walk, the line and the wording. AGENTS.md says the sidebar's pickup walks the same function. |
| `lib/hierarchyPlacement.test.ts` | The walk's general cases: the ids at any depth, both counts, a branch deeper than its children, none for a leaf, the item itself never in it, a cycle in the data. |
| `workflow/itemListOps.test.ts` | The board's reading of the walk: a Free child left out with everything under it, rows past the section's shown levels, a pending attach and a pending detach, none with only a Free child. The wording moved. |
| `dragChrome.test.tsx` | The wording, and the line: its element, out of the flow, taking no pointer. |
| `sidebar/useProjectDragReorder.test.ts` | The sidebar's branch: its ids and counts at pickup, the rows under a collapsed descendant and a collapsed carried project, none for a project with no children, the rows to draw leaving the branch and keeping the project's own, drawn again on a release, a release that writes nothing, a release past the cap and a cancel, held when a response lands mid-drag (a descendant moved out stays hidden, a project moved under the carried one is drawn). TREE-1.14's test reads the held branch where it read `descendantIds`. |
| `sidebar/SortableProjectRow.test.tsx` | `DragGhost`'s line with a branch, inside the copy and out of its box, and none without. The descendant-row test went with `isDescendantOfActive`. |
| `tests/ui/project-tree-drag.spec.ts` | TREE-1.4's spec is skipped, with its reason. Phase 3 skips TREE-1.1 and TREE-1.11/TREE-3.9 too, for the drop line's start (Amendment 3). Story 8.12's Phase 3 updates and unskips those two, and their skip reasons say so (Amendment 5). TREE-1.4 and TREE-2.1 stay skipped, for Story 10. |
| `ProjectSidebar.tsx` (`dropAnimation={null}`) | D7: the overlay has no drop animation, so the copy goes at release at every end of the drag. |
| `sidebar/SortableProjectRow.tsx::DragGhost` | Its comment says the copy goes at release. |
| `sidebar/projectTreeUtils.ts::projectNameIndentPx`, `ROW_HANDLE_WIDTH_*`, `ROW_CHEVRON_WIDTH_*`, `ROW_GAP_*` | D8: where a name starts at a depth, from the row's padding and the row's leading controls. Each control is a class and the number it sets, spelled twice as `cardMetrics.ts`'s pairs are, and `projectTreeUtils.test.ts` pins each pair. `projectRowIndentPx` keeps the row's padding and its comment. |
| `sidebar/SortableProjectRow.tsx` (drop line, row classes) | D8: the line's `marginLeft` is `projectNameIndentPx(indicatorDepth)`, the over-cap line's too. The row draws its gap, handle and chevron with the shared classes, so the number and the row can't part unseen. |
| `sidebar/useCollapsedProjects.ts` | D9: the projects the user collapsed, with `toggle` and `expand`. Every other project is open, a new one included, and nothing is stored. `expand` is the one way a collapsed project opens. |
| `sidebar/projectTreeUtils.ts::parentPutUnder` | D9: the parent a successful write put a project under: the written project's parent when it isn't the one the project had before. None for a top-level project, and none for a write that left it where it was. |
| `App.tsx` | D9: holds the collapsed set (`useCollapsedProjects`), hands it to the sidebar with `onToggleCollapse` and `onExpandProject`, and opens the parent after a create and after a parent change succeed. A failed write returns before it. |
| `ProjectSidebar.tsx` (`collapsedIds`, `onToggleCollapse`, `onExpandProject`) | D9: no collapse state of its own. It derives the open set from the projects and the collapsed ids, and hands `onExpandProject` to the drag hook as the drop's `expand`. |
| `workflow/dragRegions.ts`, `sidebar/useProjectDragReorder.ts` | Comments only: the sidebar's copy goes at release, and `expand` is `useCollapsedProjects`'s. |
| `tests/helpers/dragGesture.ts::settled` | The helper waits 60ms past the copy going (`POST_DRAG_CLICK_GUARD_MS`), since dnd-kit swallows the click after a drag for 50ms (Amendment 3). |
| `sidebar/projectTreeUtils.test.ts`, `sidebar/SortableProjectRow.test.tsx` | The class and number pairs, the name's start at each depth, `parentPutUnder`; the drop line's start, the over-cap line's, and the row's controls drawn by the shared classes. |
| `sidebar/useCollapsedProjects.test.ts`, `App.test.tsx` | The collapsed set; and `App.tsx`'s wiring: every project open, a new one included; a create and a parent change into a collapsed parent open it; a failed one, and a project a write doesn't put anything under, leave it collapsed. |

## Amendments

**1. 2026-11-04, Phase 1 built** (Coder).
- **The walk's signature (D2, left to the Coder):** `carriedBranchOf(itemId, childrenOf)`, where `childrenOf` is the ids-only accessor `flattenHierarchy` reads (`(parentId: string | null) => readonly string[]`). It is `flattenHierarchy` plus the two counts, so it takes nothing a surface doesn't already have:
  - **the board** passes `descendantsChildrenOf(deps.getAttachedChildren)`, the ids-only form of the accessor it walks with, so its branch is the one it had;
  - **the sidebar** passes `fullChildrenOf(projects)`.
- **The sidebar's ids are the walk's, not `getSubtree`'s** (D2 said they'd be the same set). The hook keeps `getSubtree` for `subtreeIds` (the ids placement leaves out) and `height` (the cap), as planned.
- **The line's text class is in `cardMetrics.ts`** (D3 left `dragChrome.tsx` or `cardMetrics.ts` to the Coder). `cardMetrics.ts` is the leaf module that already holds `STUB_ROW_BOX_CLASS`, which the class is built on, so `dragChrome.tsx` and `StubRows.tsx` read it from there with no import between them.
- **The wording is exported from `dragChrome.tsx`,** beside the line, with the lint exception that file's other non-component exports carry.
- **The hook returns the rows to draw (`drawnItems`) and `branch`;** `descendantIds` is gone. `rowIds` for `SortableContext` is unchanged: it already left the dragged subtree out.
- **Placement is unchanged,** as D4 read it. The existing placement tests, TREE-1.2 to TREE-1.11 among them, pass as they stand, TREE-1.6's and TREE-1.4's included: the hook still takes an `over` on a row of the subtree, which dnd-kit no longer reports.
- **Checked in the browser with a throwaway spec (deleted),** on a tree of A, X (with X1 and X1a, and X2), B, C and D:
  - **At pickup** the sidebar draws A, X, B, C and D. B moves up 96px, to sit right under X's row. The copy's box is one row, 34px, and the line hangs under it, 24px tall, at the copy's width. It reads "+ 2 children, 3 total descendants".
  - **dnd-kit reads the moved rows from the first move** (D4's check). Aimed at D's top the line is on D, at C's top it is on C, and a release after C saves X between C and D, under no parent. The tree then draws A, B, C, X, X1, X1a, X2 and D.
  - **Every end draws the branch again:** Escape, and a set-down in X's own gap, which writes nothing. A project with no children has no line and no row leaves. With X1 collapsed, X's pickup still says "+ 2 children, 3 total descendants".
  - **A narrow sidebar** (about 130px) truncates the line with an ellipsis.
  - **Not probed:** a release past the cap, and the branch showing under X after a drop until the response lands. Both are the hook's own state, which the unit tests pin, and Nathan's hands-on covers them.
- **The new tests were checked against the code.** With `drawnAtPickup` holding no branch, the hook's branch, rows-to-draw, held-branch and TREE-1.14 tests fail (9). With the hook returning `flatItems` as the rows to draw, five of them fail. With `DragGhost` drawing no line, its two line tests fail. **`ProjectSidebar.tsx` has no unit test:** that it draws the hook's `drawnItems` and hands `DragGhost` the branch is covered only by the browser check above, not by a test in the repo.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 398 files with 0 hits, the client has 710 tests (17 net new), the server 438 and the scripts 245.
  - **`npm run test:e2e`:** 215 passed, 22 skipped and 0 failed. The one skip over 8.8's close is TREE-1.4's spec, with its reason. It aims at X1 and X2, which aren't drawn now, and the hook's tests of TREE-1.4 hold its rule. No other spec failed for the sidebar's rows.
- **Not built, as the plan has it:** no new drag spec, and no wiki or test-plan change.

**2. 2026-11-04, Phase 2's hands-on folds in three fixes** (Architect, for Nathan).
- **Added:**
  - D7, the copy goes at release;
  - D8, the drop line starts at the name's column;
  - D9, every project starts open, and one put under a collapsed project opens it.
  - Each is older than this story. Nathan found them in the hands-on and asked for all three to be folded in. D9 isn't a drag change.
- **The phases grew from three to five.** Phase 3 builds D7–D9, and Phase 4 is Nathan's hands-on of them. The old Phase 3, settle and hand off, is now Phase 5, and its handoff list has gained D7–D9's passages and cases.
- **The Goal** gains what the hands-on found, and the depth-range report that isn't fixed here. Phase 4 retests that after D8.
- **Out of scope** now says that D8 moves the line's start, not its look.
- **D9's parent-change case was asked as its own question,** and is in on Nathan's "fold it all in". It comes out cleanly if he'd rather the dropdown leave a hand-set collapse alone.

**3. 2026-11-04, Phase 3 built** (Coder).
- **D7:** `ProjectSidebar.tsx`'s `DragOverlay` takes `dropAnimation={null}`. In the browser, with the move response held 800ms, the copy was gone 4ms after the release, and X's row stayed at its pickup place until the response landed and then moved.
- **D8, the Coder's calls:**
  - **The number and the row's classes stay in step** as `cardMetrics.ts`'s pairs do. The row's handle, chevron and gap are each a class and the width it sets, in `projectTreeUtils.ts` (`ROW_HANDLE_WIDTH_*`, `ROW_CHEVRON_WIDTH_*`, `ROW_GAP_*`), and `SortableProjectRow.tsx` draws its row with the classes. `projectNameIndentPx` adds up the numbers, and a test pins each class to its number.
  - **In the browser,** on a tree of A, A1 (under A), A1a (under A1), B and X: the line for depth 0, 1 and 2 starts at x = 48, 62 and 76, which is where A's, A1's and A1a's names start. The line for depth 3 starts at 90, 14px right of A1a's name.
- **D9, the Coder's calls:**
  - **The collapsed set is `sidebar/useCollapsedProjects.ts`, called by `App.tsx`.** `App.tsx` writes two of the three ways a project opens, so the state couldn't stay in the sidebar. The sidebar takes `collapsedIds`, `onToggleCollapse` and `onExpandProject`, and derives its open set (`expandedIds`) for `flattenTree` and the row, whose signatures are unchanged. The drop's `expand` is `onExpandProject`, so there is one way a project opens.
  - **A create and a parent change open the parent through `projectTreeUtils.ts::parentPutUnder(before, written)`:** the written project's parent, when it isn't the parent the project had before. So a rename, or an edit that leaves a project under the parent it has, doesn't open a parent the user collapsed. `App.tsx` opens it after the awaited write, so a failed write returns first and leaves it collapsed.
  - **`App.tsx` has its first unit test.** `ProjectPage` and the notifications bell are mocked, two buttons stand in for the page's writes, and the sidebar, the create dialog and `App.tsx`'s handlers are real.
  - **In the browser:** a project created after the load shows its first subproject; a subproject created under a collapsed P opens it, from the sidebar's "Add subproject"; and R's parent dropdown set to P opens a collapsed P.
- **A change to the plan's Phase 3, a spec and a helper:**
  - **TREE-1.1 and TREE-1.11/TREE-3.9 are skipped.** The plan said the drag specs should pass as they stand. These two assert the drop line's `margin-left` at the row's padding (`projectRowIndentPx`), which is the start D8 moved. They're skipped with a one-line reason, as the roadmap has it (skipped, not updated), for Story 10. Amendment 5 routes them to Story 8.12 instead, and their skip reasons say so. Each loses coverage that has nothing to do with the line's start: TREE-1.1 the line's side, the rows not sliding aside, and a release saving what the line shows; TREE-1.11/TREE-3.9 the cap's marking and the refused release. Pointing each at `projectNameIndentPx` would keep them, and is one line apiece.
  - **`tests/helpers/dragGesture.ts::settled` waits 60ms past the copy going** (`POST_DRAG_CLICK_GUARD_MS`). The plan said D7 left the helper's wait as it was, finishing sooner. The wait is right for the copy, but dnd-kit also swallows the click after a drag for 50ms (`@dnd-kit/core`'s `AbstractPointerSensor`, a capture-phase `stopPropagation` on `document`), which the board's drop animation outlasts and the sidebar's copy, going at release, no longer does. TREE-4.8 failed once in a group run, at the click on "New project" right after a refused drop, and passed on its own and on two reruns. A throwaway spec (deleted) that clicked right after a release saw three of five clicks swallowed, and none once it waited 20ms. A real user doesn't click within 50ms of a drop.
- **The new tests were checked against the code.**
  - With a create not opening its parent, the create's test fails. With a parent change not opening it, that test fails.
  - With `parentPutUnder` answering the written parent whatever the project had before, its rename case and the App's rename case fail.
  - With the drop line at the row's padding, the row's two line tests fail.
  - With the create opening its parent before the write is answered, the failed-create test fails.
  - With the sidebar's collapsed set starting with a project in it, the hook's tests and four of the App's fail.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 401 files with 0 hits, the client has 733 tests (23 new), the server 438 and the scripts 245.
  - **`npm run test:e2e`:** 213 passed, 24 skipped and 0 failed. The two skips over Phase 1's are TREE-1.1 and TREE-1.11/TREE-3.9.
- **Not built, as the plan has it:** no new drag spec, and D9's spec waits for the Planner's case (Phase 5). The depth-range report is Phase 4's retest.

**4. 2026-11-04, Phase 4's hands-on** (Architect, for Nathan).
- **D9 is approved,** and closes with the story.
- **D7 and D8 stay as built,** each better than what it replaced. What's left of them moves to a new roadmap entry, Story 8's "The sidebar's ghost moves to the gap":
  - D7's: the movement after a drop is still awkward;
  - D8's: the line isn't always drawn where the cursor suggests.
- **The depth-range report moves there too.** It outlasted D8, and Nathan suspects how the cursor is read, more than the placement rule.
- **The Goal** now says what moved out, and D7 and D8 each say they're kept as built.
- **The handoff:** D7 and D8 no longer go to the PO, since the ghost story replaces both. The Planner's list gains the two specs Phase 3 skipped.

**5. 2026-11-04, the ghost story is Story 8.12, and runs next** (Architect, for Nathan).
- Its plan is [`story-8-12-sidebar-ghost-moves-to-gap.md`](story-8-12-sidebar-ghost-moves-to-gap.md), and the Goal, D7, D8 and the handoff now name it.
- **Phase 5's handoff gains two rules from Nathan:**
  - anything 8.12 changes right away is left out of this story's wiki and test-plan pass;
  - the skipped specs stay skipped here, and 8.12 updates and unskips TREE-1.1 and TREE-1.11/TREE-3.9.

**6. 2026-11-04, Phase 5 wrote the handoff** (Coder).
- **Nothing to build.** Phase 4 approved D9 and kept D7 and D8 as built (Amendment 4), so no code changed in this phase and the gate wasn't rerun. Phase 3's last gate stands: `npm run check` passes, `npm run test:e2e` has 213 passed, 24 skipped and 0 failed.
- **The handoff is written** (Living-docs handoff), with the plan's Phase 5 list and Amendment 5's two rules applied:
  - **what 8.12 changes right away is left out,** named at the top of the handoff and again on each passage and case it touches;
  - **the skipped specs stay skipped here:** TREE-1.4 and TREE-2.1 for Story 10, TREE-1.1 and TREE-1.11/TREE-3.9 for 8.12.
- **Beyond the plan's list, the handoff adds:**
  - TREE-2.4's bullet on `X1`, which isn't drawn now;
  - TREE-1.9's last sentence, which follows TREE-1.6;
  - D9's rule that only a write that puts a project under a parent it didn't have opens one;
  - the carried branch's rule for the PO to word without saying when a move lands, since 8.12 draws it at release;
  - the tests the new cases can cite.
- **Left to close:** D9's spec, which waits for the Planner's case, and the unit tests' case IDs.

**7. 2026-11-04, the wiki (PO).** The handoff's decisions and superseded passages, less what Story 8.12 changes right away (Amendment 5).
- **The carried branch is now a shared rule,** new hierarchy-placement §8, "A dragged entry's branch goes with it". Both surfaces carry one, with one wording and one line, and the wiki README's convention puts a rule more than one feature applies on a shared page. The handoff left it to the PO.
  - **§8 holds:** the branch isn't drawn from pickup to the drag's end, each surface saying what it holds; the entry's own row stays; the Why; placement doesn't change; read once at pickup and held; drawn again at once at every end, under the entry wherever the hierarchy then has it; the second line's wording, X and Y; it hangs outside the measured box, covers what's below and takes no pointer; only the carried copy has it; why not grow the box.
  - **§7's descendants bullet** now says a surface draws only those outside the branch.
  - **The intro and Related line** name §8.
- **Board §5a and §7.2 keep the board's own handling** and cite §8: the branch as attached descendants, the lists it leaves, the Free descendant, the board's tree with its pending writes, the rows that move, where the branch is drawn on each end; the line through every switch, the ghost with none, the box's readers, what it covers. Their section numbers are unchanged, so the DRAG cases' citations hold.
- **Project-tree:**
  - **§1,** "Resting on the dragged project's own row": the subtree's rows aren't drawn, so only the project's own row is left to rest on. It means the project's own gap, as before.
  - **§2:** the descendants aren't drawn; on a tree well within the cap every row is Full and only the dragged row is dimmed; the example's `X`'s child isn't drawn. A new paragraph: the pickup takes the whole subtree, a collapsed project's rows included, by §8, and the rows below move up. The second line counts the children and the whole subtree, and is cut short in a narrow sidebar.
  - **§11 (new), "Which projects the sidebar shows open"** (D9): every project starts open, a new one included, and a reload opens every project; a collapsed project opens when the app puts a project under it, a hand-set collapse included, by a drop (on the drop), a create or a parent change (on success); only a write that gives a project a parent it didn't have opens one. Its Why: a new project that started collapsed would hide its first subproject.
  - **§2's drop-opening paragraph** now points to §11, and §5 and §7 each name the opening.
  - **The intro** says the collapse is a rule, not a placeholder, and the chevrons leave the Open questions' sidebar controls.
  - **"The look of the drag's cues"** gains the second line's look.
- **Left out for Story 8.12,** as the handoff names them: §1's line bullet and its last bullet, the mid-drag window included; §2's ghost, line and copy; §4's failed write; the gap's reading; D7 and D8. §2's new paragraph doesn't say when a move lands, and the branch is "read at pickup and held" by §8, with no window.
- **Deductions, for Nathan to overrule:**
  - **The move to a shared page,** which the handoff left to the PO.
  - **"Children" stands** in the sidebar's line, though its button says "Add subproject": one wording for both surfaces, and the hands-on raised nothing.
  - **The collapse is a numbered section, §11,** not a paragraph in §2, since a create and a parent change aren't drags. §2 keeps a pointer, so TREE-2.2's citation still lands.
  - **§11 says "the app"** puts the project under the parent, since only the app's own writes open one.
- **For the Test Planner:** the handoff's list stands. The new branch cases' ground is hierarchy-placement §8 and project-tree §2; the collapse cases' is §11. Hierarchy-placement has no catalog, so §8 is tested through each surface's, as §7 is.
- **Checks:** `check:docs` passes.

**8. 2026-11-04, test-plan follow-up (Test Planner).** Applied the Coder's handoff after the PO's wiki pass, deriving the cases from the settled rules without reading code or test code.
- **The branch:** TREE-2.1 now removes the descendants instead of dimming them, keeps the dragged row and unrelated tiers, and checks the rows below moving up. TREE-2.4 removes its drawn-Low descendant. TREE-1.4 and TREE-1.6 aim at the dragged project's own row; TREE-1.9's closing sentence no longer offers descendant rows to rest on.
- **The new cases:** TREE-2.9–TREE-2.12 cover the real tree's hidden rows, exact wording and zero branch, the copy's one-row measured box, the line's pointer behavior and truncation, and the branch's return on a drop, Escape, own-gap release and over-cap release. They do not fix when a move lands or build a new mid-drag response-window scenario. TREE-2.9 states only the shared pickup snapshot's lifetime; the changing-subtree windows remain with TREE-1.14–TREE-1.16 in 8.12.
- **Expansion:** the new TREE-11 suite follows project-tree §11. TREE-2.2 and TREE-2.3 keep the existing drop cases, adding the new section as a Rule pointer. No case is moved or retired. The create and edit cases distinguish unanswered, successful and failed writes, and check that unrelated or unchanged parents do not open.
- **The board:** followed the shared-rule move to hierarchy-placement §8 without changing the board's own branch, list, pending-write or release rules. DRAG-8.10 also gains the shared line's one-row height and no-pointer assertions.
- **For the Coder and Reconciler:** all twelve new cases are Open with no Automation mapping. Assign IDs to the handoff's existing tests where their assertions cover the new cases, add D9's first-subproject spec for TREE-11.1, and assess the revised cases against their current mappings. TREE-1.4's only mapped surface spec is reported skipped; its current Automated status needs the Reconciler's correction. TREE-1.6's mapped test is reported to inject an unreachable descendant hit, so it needs a check against the revised own-row case. This pass makes no new coverage claim and leaves existing status/Automation fields unchanged.
- **Routing:** Story 10's item 10 names TREE-1.4 and the current TREE-2.1 behavior, and carries any remaining gesture-dependent TREE-2.9–TREE-2.12 and DRAG-8.10 coverage after reconciliation. 8.12's cases and skips remain as the handoff directs. No Pending PO question arose.
- **Checks:** `npm run check:docs` passes (402 files, zero hits), and `git diff --check` passes. No runtime tests were run for this documentation pass.

## Open questions

None yet.

## Living-docs handoff

Written by the Coder in Phase 5, after Nathan's Phase 4 hands-on approved D9 and kept D7 and D8 as built (Amendment 4). The hands-on changed nothing to build, so no code changed in this phase. The wiki and the test plans are the PO's and the Test Planner's, and none is edited here.

**Left out of this pass for Story 8.12** (Nathan, Amendment 5). 8.12 changes these right away, so no rule or case is written for them here. Each item below that touches one says so.
- **project-tree §1:** "An indicator line, not a ghost", "the line's position is the gap", "a release saves exactly the gap and depth the line shows", and "a move is shown when its response arrives (§4)".
- **project-tree §2:** the ghost, the line and the copy. **§4:** "after a failed write, the sidebar shows the project where it was".
- **The gap's reading,** a row's half, and so TREE-1.1, TREE-1.8, TREE-1.9, TREE-1.11/TREE-3.9, TREE-1.14 to TREE-1.16 and TREE-4.8.
- **D7 and D8,** below.

- **Behavior decisions made while building, for the PO to rule on:**
  - **The carried branch** (D1 to D6):
    - **A pickup takes the project's whole branch out of the rows,** every descendant in the real tree. A descendant under a collapsed project goes and counts too, though no row drew it. The project's own row stays, at the strength of its own (project-tree §2).
    - **Placement doesn't change.** The branch was never a candidate, and the rows below moving up changes no gap, projection, cap check or release.
    - **The project's own row is the only row of its block to rest on.** The rows of its subtree aren't drawn.
    - **The branch is drawn again when the drag ends, at every end:** a drop, Escape, a set-down in the project's own gap, a release past the cap. It's drawn under the project wherever the tree then has it. **The PO words this without saying when a move lands,** which 8.12 changes: today the branch shows at the old place until the response arrives.
    - **It is read once at pickup and held,** the tree as it was then (§1's last bullet). A response landing mid-drag changes none of it. A descendant the response moves out stays hidden until the drag ends. A project it moves under the carried one isn't in the branch: it's drawn where the tree puts it, and stays a place to drop. 8.12 narrows that window to a refused move, so the PO leaves §1's last bullet for 8.12's pass. If the branch is written in, it says "read at pickup" and no more.
    - **The copy's second line says what the branch holds:** "+ 2 children, 5 total descendants". When every descendant is a child it names the children alone, "+ 3 children" or "+ 1 child". A project with no children has no line. The children are the project's own, the total is the whole branch, collapsed rows counted.
    - **The line hangs under the copy's box,** out of the flow and one row tall. It covers what is below the copy, takes no pointer, and truncates in a narrow sidebar. The copy's box stays the one row it was, so what the drag measures is unchanged. The line's look is a placeholder, "The cues' final look"'s.
    - **The wording is the board's,** one function for both surfaces. The sidebar says "children" where its button says "Add subproject". The hands-on raised no change, so it stands unless the PO rules otherwise.
  - **Collapse** (D9):
    - **Every project starts open, a new one included.** A project created after the sidebar loaded used to start collapsed, hiding its first subproject. Collapse isn't remembered: a reload opens every project.
    - **A collapsed project opens when a project is put under it,** by any of three writes:
      - **a drop,** on the drop and before the response, so it stays open if the move fails (TREE-2.3);
      - **a create,** from the sidebar's "Add subproject" or the project page's subprojects list, both through the create dialog;
      - **a parent change** from the project page's dropdown (§7).

      A create and a parent change open it once the write has succeeded. A failed one leaves it collapsed.
    - **Opening wins over a collapse set by hand,** as the drop's rule had it.
    - **Only a write that puts a project under a parent it didn't have opens one.** A rename, or an edit naming the parent the project already has, leaves a collapsed parent collapsed. A top-level project has no parent to open.
  - **D7 and D8 go to neither the wiki nor the test plan.** Neither changes a stated rule, and 8.12 replaces both.
    - **D7:** the copy goes at release, with no drop animation. 8.12 brings the animation back, with the move drawn at release.
    - **D8:** the drop line starts where a name at its depth starts. 8.12 keeps that start as the line's, and its handoff asks the PO whether it's a rule.
- **Planned passages now built:** none. None were planned.
- **Passages superseded,** each for the PO:
  - **project-tree §1, "Resting on the dragged project's own row, or a row of its subtree":** "Those rows stay in place, the subtree's dimmed (§2)" goes. Only the project's own row is drawn to rest on. "None of them is ever Top or Bottom" still holds.
  - **project-tree §2:**
    - "The dragged project's descendants are Low, so the branch reads as going with it": the sidebar draws none of them, so nothing dims for them. They are still no place to drop, and still Low in the pickup's classification, which no row shows.
    - "On a tree well within the cap, only the dragged project's descendants dim": only the dragged project's own row does.
    - The example's "`P12` and `X`'s child are Low": `X`'s child isn't drawn.
    - New: the copy's second line.
  - **project-tree §2, "A collapsed project opens when a project is dropped into it":** it holds for a create and a parent change too, on their success, and every project starts open (D9). §5 and §7 may each name the opening. "The collapse chevrons" can come off the Open questions if the PO makes the rule.
  - **hierarchy-placement §7, "The dragged entry's descendants are Low, at every depth, wherever a surface draws them":** it's true as written, since the sidebar draws none. The page for the sidebar says it draws none. Both surfaces now carry a branch, with one wording and one line, so the PO decides whether that becomes a shared rule in §7, each page saying what its branch holds: the board's attached descendants, the sidebar's whole subtree.
- **Implementation passages to place:** placed by the Coder, in docs the Coder owns:
  - the module headers of `hierarchyPlacement.ts`, `dragChrome.tsx`, `useProjectDragReorder.ts`, `projectTreeUtils.ts`, `useCollapsedProjects.ts` and `ProjectSidebar.tsx`;
  - `workflow/AGENTS.md`, which says the sidebar's pickup walks the same function over its real tree.

  Nothing for the PO.
- **Test-plan cases affected,** for the Test Planner after the PO's pass:
  - **TREE-2.1:** it says `X1` and `X1a` "stay drawn in place at Low". They aren't drawn. The tiers clearing at the drag's end and the dragged row's own strength still hold. Its skipped spec's reason, the descendants' old 0.4, is stale for the same cause.
  - **TREE-2.4:** the bullet "`X1` is Low by descent from `X`". `X1` isn't drawn. The rest holds.
  - **TREE-1.6:** the cursor can't rest on `X1`'s or `X2`'s row, which aren't drawn. Its rule holds: no depth makes `X` a child of `X1` or `X2`, since they're out of placement. The case reduces to resting on `X`'s own row. Its hook test still passes, by handing the hook an `over` that dnd-kit no longer reports, so no gesture reaches that path now.
  - **TREE-1.9's last sentence** points at TREE-1.6. The rest of TREE-1.9 is 8.12's.
  - **TREE-1.4:** its rule holds. Its spec aims at `X1` and `X2`, which aren't drawn, so it's skipped for Story 10. The Planner rewrites the case's aim first (the cursor on `X`'s own row), and the spec follows.
  - **TREE-1.16:** a moved-out `Y` stays hidden for the drag, so there is no row to rest on (D1). 8.12 narrows the window TREE-1.14 to TREE-1.16 describe, so the Planner takes the three together in 8.12's pass. Until then no test pins TREE-1.16 (it's Open).
  - **TREE-2.2,** a collapsed project opening on a drop, extended to a create and a parent change, or joined by cases of their own in TREE-5 and TREE-7. TREE-2.3 holds. The rules to cover:
    - a project created after the sidebar loaded starts open, so its first subproject shows;
    - a create under a collapsed parent opens it, from the sidebar and from the project page; a failed create leaves it collapsed;
    - a parent change into a collapsed project opens it; a failed one leaves it collapsed;
    - a rename, or an edit naming the parent the project already has, leaves a collapsed parent collapsed.
  - **A new case, or cases, for the carried branch and its line:**
    - the pickup takes the branch out of the rows, a collapsed descendant's rows included;
    - the line's wording: children and total, children alone, one child, and none for a project with no children;
    - the copy's box is one row, the line outside it;
    - the branch is drawn again at every end of the drag;
    - the branch is read at pickup and held when a response lands mid-drag (8.12's pass takes the window, as above).
  - **Tests the new cases can cite,** all without a case ID today:
    - the walk: `lib/hierarchyPlacement.test.ts`;
    - the board's reading of it: `workflow/itemListOps.test.ts`;
    - the wording and the line: `dragChrome.test.tsx`;
    - the sidebar's branch, its rows to draw and its held state: `sidebar/useProjectDragReorder.test.ts`;
    - the copy's line: `sidebar/SortableProjectRow.test.tsx`;
    - the collapse: `sidebar/useCollapsedProjects.test.ts`, `sidebar/projectTreeUtils.test.ts` (`parentPutUnder`) and `App.test.tsx`, which renders the real sidebar and create dialog.
  - **Skipped specs, all in `tests/ui/project-tree-drag.spec.ts`:**
    - **TREE-1.4 and TREE-2.1** stay skipped for Story 10.
    - **TREE-1.1 and TREE-1.11/TREE-3.9** stay skipped here, and 8.12's Phase 3 updates and unskips them. Their reasons say so.
- **For the Architect:**
  - **Story 10's item 10 gains one skipped spec:** TREE-1.4's, with its reason in a comment above it. TREE-2.1's is already there.
  - **The roadmap's 8.11 entry** has a "Today" paragraph that still says the sidebar draws the dragged project's descendants at Low and shows the copy's name alone. That is right as the problem's statement and wrong as live.
  - **`tests/helpers/dragGesture.ts::settled` waits 60ms past the copy going** (Amendment 3), since dnd-kit swallows the click for 50ms after a drag. The board's drop animation outlasts that, and the sidebar's copy, going at release, didn't. 8.12 says keeping it is the Coder's call.
  - **Root `AGENTS.md`:** nothing it says is made false.
- **Left to the Coder at close:**
  - **D9's spec,** once the Planner's case exists: a subproject created under a new project shows. It isn't a drag spec, so it isn't routed to Story 10.
  - **The unit tests above take the new cases' IDs** in their titles.
  - **The gate,** if that code work changes anything.
- **Wiki sections added, changed, moved or removed** (PO, at close): hierarchy-placement §8 (new), its Related line, intro and §7's descendants bullet; board-drag-interaction §5a and §7.2 (the shared half moved to hierarchy-placement §8) and its Related line; project-tree §1, §2, §5, §7, §11 (new), its Related line, intro and two Open questions. Amendment 7.
- **Test-plan handoff applied** (Test Planner): Scope and Amendment 8 list the revised cases, twelve new Open cases, shared-rule pointer changes and coverage follow-up. The 8.12 exclusions remain in force.

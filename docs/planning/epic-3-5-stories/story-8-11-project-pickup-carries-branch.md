# Epic 3.5 Story 8.11 — A project's pickup takes its descendants with it

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.11 entry · **Status:** planned. A Coder session builds Phase 1

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

**Out of scope:**
- **What the board does.** Its walk, wording and line move to where the sidebar can use them, and nothing the board draws or places changes.
- **The tiers of the rows that stay.** They're Story 8.7's, unchanged.
- **The line's final look.** It keeps the board's placeholder look. Tuning it, on both surfaces, is "The cues' final look"'s (roadmap, Story 8).
- **A line on the ghost row.** The dragged project's own row in the list stays one row at the ghost's strength, as the board's ghost shows no line.

## Scope

- **Wiki passages:** none ahead of the build. The PO writes the rules once Nathan approves (code first).
- **Test-plan cases:** for the Test Planner, after the PO's pass. The handoff lists the ones affected.

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
- **Nathan decides:** approve as built, or amend the plan.

**Phase 3: settle and hand off**
- Whatever the hands-on changes is built here, with an amendment.
- **The Coder writes the Living-docs handoff,** with at least:
  - **project-tree §1:** "Resting on the dragged project's own row, or a row of its subtree". The subtree's rows aren't drawn now, so only the project's own row is left to rest on, as on the board. The paragraph's "the subtree's dimmed (§2)" goes.
  - **project-tree §2:** "The dragged project's descendants are Low", "On a tree well within the cap, only the dragged project's descendants dim", and the example's "`X`'s child are Low". The copy's second line is new.
  - **hierarchy-placement §7:** "The dragged entry's descendants are Low, at every depth, wherever a surface draws them". The sidebar now draws none of them. Both surfaces now carry a branch with the same line, so the PO decides whether that becomes a shared rule here, with each surface's page saying what its branch holds.
  - **For the Test Planner:**
    - TREE-2.1, whose descendants are dimmed;
    - TREE-1.6, whose subtree rows can't be rested on now, and TREE-1.9's last sentence, which points at it;
    - TREE-1.16, whose moved-out `Y` stays hidden for the drag (D1);
    - TREE-1.4, whose spec is skipped;
    - a new case, or cases, for the sidebar's carried branch and its line.
- **Gate,** if code changed.

## Code map

Filled in by the Coder.

## Amendments

## Open questions

None yet.

## Living-docs handoff

Written by the Coder in Phase 3.

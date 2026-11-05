# Epic 3.5 Story 8.11 — A project's pickup takes its descendants with it

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's 8.11 entry · **Status:** Phase 1 built, for review and commit (Amendment 1). Phase 2 is Nathan's hands-on

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
| `tests/ui/project-tree-drag.spec.ts` | TREE-1.4's spec is skipped, with its reason. |

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

## Open questions

None yet.

## Living-docs handoff

Written by the Coder in Phase 3.

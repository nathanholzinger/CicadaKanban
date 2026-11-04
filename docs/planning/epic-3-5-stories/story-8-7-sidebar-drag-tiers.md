# Epic 3.5 Story 8.7 — The project sidebar's drag cues match the board's

**Type:** story · **Written:** 2026-11-03 by the Architect, from the roadmap's 8.7 entry (Nathan, found with Story 8.5) · **Status:** Phase 1 built, for review and commit

## Goal

A project drag draws every row in the sidebar by what it can be to the dragged project, on the board's rule (Story 8.5, wiki board-drag-interaction §4.1). Its strengths are the board's, held in tuning values of the sidebar's own. The board and the sidebar get the tiers from one derivation.

**What happens today** (`sidebar/SortableProjectRow.tsx::rowOpacityClass`, `sidebar/useProjectDragReorder.ts`):
- The dragged project's row and its descendants are dimmed to 0.4, and the descendants take no drop.
- Every other row is drawn at full strength, even one too deep to take the dragged project.
- A tab state past the project cap turns the drop line red.
- The sidebar computes no states or tiers at all. It walks the dragged project's subtree (`hierarchy.ts::getSubtree`) for the dim and the cap.

**The rule, as on the board's Stub rows.** Every project row is placed among siblings, so naming a row as the line's anchor gives the dragged project that row's parent, as naming a Stub does on the board:

| Tier | Drawn at | Which rows |
|---|---|---|
| Full | 1 | A project that can be the dragged project's parent |
| Mid (MO) | `projectAnchorOpacity`, 0.6 | A project past the cap, whose own parent can take the dragged project |
| Low (LO) | `projectNeitherOpacity`, 0.3 | The dragged project's descendants, and a project whose own parent can't take the dragged project |
| The dragged row | `projectDraggedOpacity`, 0.3 | The dragged project's own row |

- **MO shows only near the cap.** A row is past the cap when its depth plus 1 plus the dragged subtree's height is over 12 (wiki project-tree §3). So MO is one band of rows at one depth, with LO under it. On a shallow tree, only the dragged project's descendants dim.
- **There's nothing like a Free Card in the sidebar.** On the board a Free Card is never LO, because a reposition in a column sets no parent. A project row always sets one.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds it, and Nathan tries it hands-on.
- The PO and the Test Planner write the docs after.
- No new drag specs. A drag spec that fails because it pins today's look is skipped with a one-line reason, for Story 10.

**Out of scope:**
- **The board's tiers and their values.** They don't change. The lift in D1 must leave them exactly as they are.
- **The sidebar's other cues:** the drop line, its red past the cap, and the carried copy (`SortableProjectRow.tsx::DragGhost`). Their look is "The cues' final look"'s, and how an over-cap tab state looks is open in wiki project-tree.
- **A pending pulse in the sidebar.** No project write is drawn ahead of its response: `App.tsx::handleReorderProject` applies the move when the server answers. So there's no pending row to pulse, and no pending tree for the tiers to count over.
- **How a hovered row names a gap.** The sidebar's `resolveGap` and the board's `travelingRowsFor` stay apart (ledger L1-7b; Story 7 kept the two surfaces' drag code apart).
- **Carrying the branch with the copy.** That's Story 8.8's trial, on the board. The sidebar keeps its descendants drawn in place.

## Scope

- **Wiki passages:** none planned, since the story runs code first.
  - **At close, the PO decides:**
    - what wiki project-tree §2 says, since it says only that the descendants dim;
    - whether the tier rule, now on both surfaces, moves to a page of shared rules that both cite.
- **Test-plan cases:**
  - **TREE-2.1** ("the dragged project's descendants are dimmed for the whole drag"). Its spec pins today's 0.4 (`tests/ui/project-tree-drag.spec.ts`), so it fails once LO is 0.3 (Phase 2).
  - **The rest are the Test Planner's,** after the build.

## Inbound deferrals

None. The roadmap's 8.7 entry is the story's own finding, and nothing else was routed to it.

## Approach and phases

### Decisions

**D1. One derivation, table-generic, in `client/src/lib/`.**
- **Today the states and tiers are the board's alone** (`workflow/dragClassification.ts::classifyDragTargets`, over `Item[]`). Its walk reads only an item's `id` and `parentId`, the cap, and whether the item is drawn as a Stub. It already calls `hierarchy.ts`'s `getSubtree`, `getDepth` and `isWithinDepthCap`, which the sidebar uses too.
- **The walk moves into `client/src/lib/`,** over `hierarchy.ts::TreeNode`s, next to the helpers it calls. That's root `AGENTS.md`'s "One position math layer": the legal-parent checks are table-generic, for items and projects. `DropTargetState` and `DropTier` move with it. The file is the Coder's call, `hierarchy.ts` or one of its own.
- **Its one item-specific input becomes a parameter:** whether naming a target as the anchor gives the carried item that target's parent.
  - On the board that's a Stub (`isStubOf`, as today), since a Free Card's reposition sets no parent.
  - In the sidebar it's every row.
- **`classifyDragTargets` stays as the board's adapter.** It keeps the pending tree, `isStubOf` and `subtreeIds`, and its callers don't change.
  - **The lift's check:** `dragClassification.test.ts` passes without a change.
- **The top level needs an answer of its own.** The walk tiers a row by its parent's state (`states.get(item.parentId ?? '')`). A top-level project has no parent, so a plain reuse reads it as "not valid" and draws every top-level project at LO.
  - The top level can take the carried item when `isWithinDepthCap(0, height, cap)`. That holds for any subtree within the cap, so a top-level row is Full or MO.
  - On the board no Stub is top-level, so the board's tiers are unaffected.

**D2. The sidebar's tiers** (the Goal's table).
- **One tier for the whole drag,** computed once at pickup, as the board's are. Today the subtree walk reruns whenever `projects` changes (a `useMemo`), so a response landing mid-drag would redraw the tiers. Computing once at pickup keeps them as they were when the drag began.
- **Before the cap is known** (`projectDepthCap` is null), nothing is past it. The descendants are LO and every other row is Full. The same holds for the line, which marks nothing invalid then.
- **The tier dims the row's content, not its drop line.** The line already sits outside the dimmed box (`SortableProjectRow.tsx`), as it does on the board's rows.
- **What a row does stays as it is:**
  - the descendants still take no drop (`pointer-events-none`, wiki project-tree §2);
  - an LO row that isn't a descendant still names the gap above or below it for the line, since a gap beside it can be valid at another depth;
  - the red line past the cap stays.
- **Each row carries `data-drop-tier` during a drag,** as the board's rows do. A later spec then reads the tier, not an opacity.

**D3. The board's values, in values of the sidebar's own** (Nathan, 2026-11-04).
- **Three new tuning values** (`dragTuning.ts`):
  - `projectAnchorOpacity` for MO, at 0.6;
  - `projectNeitherOpacity` for LO, at 0.3;
  - `projectDraggedOpacity` for the dragged project's row, at 0.3, the board's ghost value.

  Today's 0.4 goes. The names are a suggestion; the Coder may pick others.
- **They're separate from the board's three** (`overlayAnchorOpacity`, `overlayNeitherOpacity`, `overlayGhostOpacity`), so either surface can be tuned without moving the other. They start at the same values.
- **They go in the panel beside the board's** (`DragTuningPanel.tsx`), since the panel is where every tuning value is changed.
- **The sidebar reads them from storage at pickup.** The panel lives on the board (`BoardView.tsx`), outside the sidebar, and keeps the values in localStorage (`dragTuning.ts::loadDragTuning`). So a change in the panel takes effect on the next sidebar drag, as it does on the board's.
  - Lifting the tuning's state into `App.tsx` would also work. The panel is temporary, so the smaller change is preferred. The Coder's call.
- **The sidebar draws with the board's classes and its own values:**
  - the tier classes are the board's (`dragChrome.tsx::TIER_CLASS`, `GHOST_ROW`);
  - they read custom properties (`--drag-tier-anchor`, `--drag-tier-neither`, `--drag-tier-ghost`). `BoardView.tsx` sets them from the board's values, and the sidebar sets the same names on its own root, from its own.

  `dragChrome.tsx` already shares the drop line's look with the sidebar this way.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus the E2E runs the phase names, against the test servers.

**Phase 1: the shared derivation** (D1). The app does nothing new.
- **The walk moves to `client/src/lib/`.** `classifyDragTargets` becomes the board's adapter over it.
- **The board's tests pass unchanged:** `dragClassification.test.ts`, and every test that reads the tiers.
- **Unit tests for the lifted walk, over projects** (`client/src/test/projectFixture.ts::makeProject`):
  - a top-level row;
  - a row past the cap whose parent can take the carried project (MO), and that row's child (LO);
  - the carried project's descendants at every depth (LO);
  - a subtree tall enough that the top level is only MO.
- **Gate:** `npm run check`.

**Phase 2: the sidebar's tiers** (D2, D3).
- **The hook computes the tiers once at pickup,** from the lifted walk, and hands each row its tier.
- **The row draws its tier and carries `data-drop-tier`.** The dragged row is drawn at the ghost's value.
- **The three values join the tuning and the panel,** and the sidebar sets the custom properties from them.
- **TREE-2.1's spec pins 0.4, so it fails.** Skip it with a one-line reason, for Story 10. The descendants are still dimmed; only the number changed. Story 8.5 did the same for DRAG-7.12.
- **Tests:** the hook's tests (`useProjectDragReorder.test.ts`) may check the tiers it hands out. Unit tests work as usual.
- **Gate:** `npm run check`, and `tests/ui/project-tree-drag.spec.ts` alone. Nothing but TREE-2.1 should change there.

**Phase 3: Nathan's hands-on**
- **Where:** the deep stack (`npm run seed:deep`, then `npm run dev:deep` in `server/` and `client/`). Its project tree reaches the cap, which is the only place MO shows. On a shallow tree, only the descendants dim.
- **What to try:**
  - **Drag a project with a subtree** from near the top. Its descendants are LO, and every other row is Full.
  - **Drag a project whose subtree is tall enough** that the deep chain's bottom is past the cap. One depth of rows is MO, and the rows under them are LO.
  - **Aim at an MO row:** the line beside it is at full strength. Aim at a tab state past the cap: the line is red, as today.
  - **With a board open beside the sidebar,** change the sidebar's three values in its panel, and drag again. The board's rows keep theirs.
- **Nathan approves the tiers as built, or changes them.** The values are settled (D3), so they change only if they look wrong in the sidebar.

**Phase 4: settle**
- **Whatever Phase 3 changed.**
- **The Coder writes the handoff.**
- **Gate:** `npm run check` and `npm run test:e2e`.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Filled in by the Coder, phase by phase.

| Symbol | Carries |
|---|---|
| `lib/dragTargets.ts::classifyTargets` | The walk, over `hierarchy.ts::TreeNode`s: each node's state against the carried one and the tier it is drawn at, from one `getSubtree`. Its one surface-specific input is `anchorSetsParent`; the top level answers for a node with no parent node (D1). |
| `lib/dragTargets.ts::DropTargetState`, `DropTier`, `DragClassification` | The types, moved with the walk. Their importers read them from here; the board's adapter does not re-export them. |
| `workflow/dragClassification.ts::classifyDragTargets` | The board's adapter: hands `classifyTargets` the pending tree and `isStubOf` as `anchorSetsParent`. Its signature and result are as they were. |
| `workflow/dragClassification.ts::isValidParent` | Stays with the board: the region gate's and the over-cap cue's one answer. |
| `lib/dragTargets.test.ts` | The walk over projects: a top-level row, a row past the cap and its child, the carried project's descendants, and a subtree only the top level can take. |

## Amendments

**1. 2026-11-04, D3 settled before the build** (Nathan).
- The sidebar takes the board's values: 0.6 for MO and 0.3 for LO.
- It holds them in tuning values of its own, so either surface can be tuned without moving the other.
- The dragged project is drawn at 0.3, as the board's ghost is, also in a value of its own.
- D3, the Goal's table, Phases 2 and 3 and the handoff's expectations changed to match. Phase 3 no longer decides the values.

**2. 2026-11-04, Phase 1 built** (Coder).
- **The file is its own, `lib/dragTargets.ts`,** not `hierarchy.ts`. `hierarchy.ts` is the tree math (subtree, depth, the cap rule). The walk reads states and tiers off it, and a surface's say on what naming a node does, so it sits beside it.
- **The types moved with the walk,** and the five modules that read them now import them from `lib/dragTargets.ts`. `dragClassification.ts` doesn't re-export them: one path for each type. `DragClassification` keeps its name and its three fields.
- **The parameter is `anchorSetsParent`.** The board hands it `isStubOf`, as before; the sidebar will hand it `() => true`.
- **The top level is answered by `parentId === null` only.** A node whose `parentId` names a node that isn't in the tree still reads as "not a legal parent", as it did on the board. `getDepth` reads the same node as a root. It matters only for data with a dangling parent, which the sidebar's tree already treats as a root (`sortedChildrenByParent`). Phase 2 decides whether the hook needs to answer it.
- **The board is unchanged:** `dragClassification.test.ts` and every test that reads the tiers pass without an edit. No Stub on the board is top-level, so the new answer never reaches it.
- **The new tests were checked against the old answer.** With the top level made to read as "not a legal parent", as a plain reuse would, the top-level test of an anchor fails.

## Open questions

None yet.

## Living-docs handoff

Written by the Coder in Phase 4. What it's expected to hold:

- **Behavior decisions made while building, for the PO to rule on:**
  - the sidebar's tiers, which wiki project-tree §2 doesn't state;
  - the top level's answer (D1);
  - the tiers before the cap is known (D2);
  - the sidebar's values, the board's at names of their own (D3).
- **Planned passages now built:** none, since none are planned.
- **Implementation passages to place:**
  - the lifted walk's module header;
  - `dragClassification.ts`'s header, now the board's adapter;
  - `client/src/components/workflow/AGENTS.md`'s lines on `dragClassification.ts` and the tiers.
- **Test-plan cases affected:**
  - TREE-2.1's skipped spec, for Story 10.
  - A candidate for the Test Planner: the sidebar's tiers, read through `data-drop-tier`. Its specs need a chain of projects to the cap, as TREE-1.11's spec builds (`fetchProjectDepthCap`).
- **For the Architect:** root `AGENTS.md`'s "One position math layer" names the lifted walk, if it lands in `client/src/lib/`.
- **Wiki sections added, changed, moved or removed** (PO, at close):

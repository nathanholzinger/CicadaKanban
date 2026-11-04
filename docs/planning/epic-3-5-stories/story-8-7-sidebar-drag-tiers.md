# Epic 3.5 Story 8.7 — The project sidebar's drag cues match the board's

**Type:** story · **Written:** 2026-11-03 by the Architect, from the roadmap's 8.7 entry (Nathan, found with Story 8.5) · **Status:** built, for review and commit; the handoff is written

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

- **Wiki passages:** project-tree §2 now states the sidebar's tiers and tuning values. New hierarchy-placement §7 owns the shared tier rule; board-drag-interaction §4.1 retains the board's own handling and points to it. No existing section is renumbered.
- **Test-plan cases:**
  - **TREE-2.1:** qualified to a shallow tree where `A` is a legal parent; descendants are Low, the dragged row has its own strength, and dim clears on drop/cancel. Its old-value spec is skipped for Story 10, so the Reconciler reviews its full-case coverage. Existing status and pointer are unchanged by the Planner.
  - **New, Open:** TREE-2.4 (Full/Mid/Low cap boundary), TREE-2.5 (root/top-level boundary, including an already over-cap subtree), TREE-2.6 (tier lifetime across a response and next pickup), TREE-2.7 (drop-line isolation and valid gaps beside Low rows), TREE-2.8 (sidebar/board values independent).
  - **Shared-rule references updated:** DRAG-2.14, DRAG-2.15, DRAG-2.16, DRAG-2.17, DRAG-2.18, DRAG-2.19, DRAG-2.20, DRAG-2.21, DRAG-2.22, DRAG-2.23, DRAG-6.24 and DRAG-7.12 now also cite hierarchy-placement §7. DRAG-2.16 explicitly retains valid shallower states beside Low rows, and DRAG-2.19 states that a response landing mid-drag does not recompute tiers. Board-specific §4.1 references remain.

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
| `sidebar/useProjectDragReorder.ts::drawnAtPickup` | Computes the tiers once, in `handleDragStart`: `classifyTargets` with `() => true` as `anchorSetsParent`, over `projects` and the cap (`Infinity` while it is null), and reads the sidebar's three strengths from storage (`loadDragTuning`). Held in state until the drag ends. |
| `sidebar/useProjectDragReorder.ts` (`tiers`, `tierVars`) | What the hook hands out: each row's tier by id, and the three custom properties the tier classes read. Empty and undefined outside a drag. |
| `ProjectSidebar.tsx` | Sets `tierVars` on the list that holds the rows, and hands each row its tier. |
| `sidebar/SortableProjectRow.tsx` (`tier`, `rowOpacityClass`) | Draws the row's content by its tier (the dragged row by the ghost's class), carries `data-drop-tier`, and keeps the descendants' `pointer-events-none`. The drop line stays outside the dimmed box. |
| `dragChrome.tsx::TIER_CLASS`, `GHOST_ROW` | The board's tier classes, now exported for the sidebar to draw with. The board's use is unchanged. |
| `workflow/dragTuning.ts::projectAnchorOpacity`, `projectNeitherOpacity`, `projectDraggedOpacity` | The sidebar's three strengths, 0.6, 0.3 and 0.3. The old 0.4 is gone. |
| `DragTuningPanel.tsx::PROJECT_FIELDS` | The three values in the panel, under "Project sidebar", beside the board's. |
| `sidebar/SortableProjectRow.test.tsx` | The row: the board's classes per tier, the ghost's class for the dragged row, `pointer-events-none` on a descendant only, and the line outside the dimmed box. |

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

**3. 2026-11-04, Phase 2 built** (Coder).
- **The hook holds the tiers and the strengths together, from pickup to the end of the drag.** It hands out `tiers` (by id) and `tierVars` (the three custom properties). `ProjectSidebar.tsx` sets the properties on the list, so they reach only the sidebar's rows; the board sets the same names on its own root.
- **The strengths are read from storage at pickup,** so a change in the panel takes effect on the next sidebar drag. The tuning's state was not lifted: the panel is temporary.
- **The cap's absence is `Infinity`.** Before `projectDepthCap` is known nothing is past it, so the walk hands the descendants "neither" and every other row "parent", with no branch of its own.
- **The dangling-parent question from Amendment 2 needs no answer.** `projects.parent_id` is a foreign key, so no project in the sidebar's data has a parent the tree lacks.
- **A row's behavior and its look read two walks of one subtree.** The descendants' `pointer-events-none` and the line's rows still read the hook's live `getSubtree`, which follows `projects`; the look reads the walk from pickup. They agree unless a response changes the subtree mid-drag, in which case the look stays as the drag began and the behavior follows the tree.
- **A project a collapsed project hides has a tier,** though no row draws it, since the walk covers every project and not the rendered rows.
- **The panel's labels are apart from the board's** ("Project anchor, not a parent: opacity"), since they are each field's accessible name.
- **`dragChrome.tsx` exports `TIER_CLASS` and `GHOST_ROW`.** `TIER_CLASS` is an object, so the Fast Refresh lint rule takes a disable on it, with the reason, as `useItemRow` does.
- **TREE-2.1's spec is skipped,** with the one-line reason in the spec. Run alone first, `project-tree-drag.spec.ts` failed only there, on the number (0.3 received, 0.4 pinned), and the other nine passed. They still pass, with that one skipped.
- **Checked in the browser, with a throwaway spec (deleted).** On the test stack's cap of 12, with a chain of 12 projects and X carrying one child: rows 1 to 10 are "parent" at 1, row 11 is "anchor" at the sidebar's anchor value, row 12 and X1 are "neither" at its neither value, and X is at its dragged value with no tier. All of it is gone after a cancel. The three board values, seeded apart, moved nothing.

**4. 2026-11-04, Phase 3: Nathan's hands-on.** Nathan tried the sidebar's tiers and approved them as built. Nothing changed: the values stay the settled 0.6, 0.3 and 0.3 (D3).

**5. 2026-11-04, Phase 4: settled.**
- **Phase 3 changed nothing,** so the code is as Phase 2 left it.
- **The workflow `AGENTS.md` is placed,** since a directory's `AGENTS.md` is the Coder's to fix in the change that made it stale. It now says four things:
  - `dragClassification.ts` is the board's adapter over `lib/dragTargets.ts::classifyTargets`, with a Stub as the one row that names its parent;
  - `dragTuning.ts` holds the sidebar's three strengths;
  - the classification walk and the tier classes sit outside the directory and are shared with the sidebar;
  - the tiers rule: a surface passes `anchorSetsParent`, never a copy of the walk, and the sidebar draws with the board's classes at its own values.
- **The gate.**
  - **`npm run check`:** passes. `check:docs` is 397 files with 0 hits, the client has 660 tests, the server 432 and the scripts 235.
  - **`npm run test:e2e`:** 216 passed, 21 skipped and 0 failed, run with nothing else running. The skips are the 20 that stood after 8.6 (DRAG-7.17's second case among them) and TREE-2.1. Against 8.6's 217 passed, the one fewer pass is TREE-2.1, which moved to skipped.
  - **DRAG-7.17's second case is skipped,** so its flake (Amendment 7 of 8.6's plan) couldn't show in this run. It is Story 10's.

**6. 2026-11-04, the wiki (PO).**
- **The tier rule moved to a page of shared rules,** as new hierarchy-placement §7, "Each entry is drawn by what it can be". The wiki README's convention decides it: a rule more than one feature applies goes on a shared page, and each feature's page states only its own handling.
  - **§7 holds:** the three tiers by two answers (whether an entry is a legal parent, and whether its parent is); a legal parent's parent is legal too; an entry at the root's level takes the root's answer, each surface's page saying when the root can; the dragged entry's descendants are Low; the tier passes down; the dragged entry at a strength of its own; one tier per drag; a tier is only drawn, so a gap beside a Low entry can still hold a valid state; opacity alone, at values of each surface's own; the dim spares the drop line.
  - **The header and intro** now name the tiers and §7, and the Related line points to board §4.1 and project-tree §2.
- **Board §4.1 keeps the board's own handling** and cites §7: the table of targets, a Valid target as §7's legal parent, the Free Card, the Stub as an entry (its "tier passes down" bullet folded into §7), the overflow row, the rows with no tier, the layers, the board's values, a Card's Stubs at their own tier, and no pop or hold on a dimmed target. Its section number and title are unchanged, so the DRAG cases' citations hold.
- **Project-tree §2 is rewritten.** Every row is drawn by §7's tiers, and every row is an entry. Then the top of the tree's answer (Full or Mid, Low only for a subtree already past the cap), Mid only near the cap, the descendants Low and still no drop, the dragged row, the sidebar's three tunable values apart from the board's, and Amendment 3's numbers as an example. The collapsed-project rule is unchanged, now a paragraph.
- **Project-tree's Open question** "How an over-cap tab state looks" became "The look of the drag's cues (§1, §2)", with the tiers' final look and today's (opacity alone, and a red line past the cap).
- **Deductions, for Nathan to overrule:**
  - **The move to a shared page,** which the plan left to the PO.
  - **Before the cap is known is left out.** It lasts until the cap loads, which a user can't notice. Nothing past the cap is consistent with the line's behavior then.
  - **A row's behavior following the live tree while its tier holds** is left out too. They part only if a response changes the dragged subtree mid-drag, and §7's "one tier per drag" is the rule.
  - **A collapsed project's hidden rows** have tiers no one sees, so the wiki says nothing of them.
- **For the Test Planner:**
  - TREE-2.1's wording fits §2, with the two qualifications the handoff names: a row that isn't a descendant can be Mid or Low near the cap, and the dragged row is dimmed too.
  - The handoff's `data-drop-tier` candidate is §2's example.
  - Hierarchy-placement §7 has no catalog of its own, so the shared rules are tested through each surface's catalog. Board §4.1's cases now cite generic rules that live in §7, which the Test Planner may want to note.
- **Checks:** `check:docs` passes (397 files, 0 hits).

**7. 2026-11-04, Test Planner's handoff pass.**
- Applied the PO's wiki update as the five new Open sidebar cases in Scope and the TREE-2.1 qualification. The cases use the cap and the named sidebar opacity values, without pinning 12 or the current 0.6/0.3 settings. Top-level depths in the tier/cap cases are absolute, starting at 1, as project-tree §3 states.
- Added hierarchy-placement §7 references to affected board cases, keeping their board-specific rules. The shared page gets no catalog of its own. The existing collapsed-project cases, TREE-2.2 and TREE-2.3, are unchanged.
- No cases are derived from the omitted cap-loading interval, hidden rows' internal tier assignments or the internal distinction between the pickup tier and live placement walk. TREE-2.6 tests only the settled visible tier lifetime and recomputation at the next pickup. The tuning panel, final colors/weights and branch-carry trial remain outside these cases.
- **Coder/Reconciler:** assess the handoff's shared-walk, sidebar-hook and row tests against the full cases, hand candidate ID stamps to the Coder and propose any needed internal mappings. No tests were read or edited by the Planner, and no automation mapping is approved by this handoff. The deleted browser probe and successful hands-on do not establish running catalog coverage.
- **TREE-2.1:** its spec is skipped with a reason, not a current failure. Reconciliation must apply the skipped-test and full-Then rules, including the qualified fixture and dragged-row strength, before retaining its Automated status. The Planner leaves status/mapping changes to the Reconciler. The board's existing approval categories do not automatically approve the new shared/project mappings.
- All five new IDs, the skipped TREE-2.1 spec and the updated board assertions are carried to the roadmap's Story 8 close-out and Story 10 item 10. No new drag spec is requested during Story 8.

## Open questions

None.

## Living-docs handoff

Written by the Coder in Phase 4.

- **Behavior decisions made while building, for the PO to rule on:**
  - **The sidebar draws every project row by what it can be to the dragged project, on the board's rule.** Wiki project-tree §2 says only that the descendants are dimmed, and says nothing of any other row.
    - **Full:** a project that can be the dragged project's parent.
    - **Mid:** a project past the cap whose own parent can take the dragged project.
    - **Low:** the dragged project's descendants, and a project whose own parent can't take it.
    - **The dragged row** is drawn apart from all three.
    - **The tier rule is now on both surfaces.** The plan left it to the PO whether it moves to a page of shared rules that both cite.
  - **Mid shows only near the cap.** A project is past the cap when its depth plus 1 plus the dragged subtree's height is over the cap (wiki project-tree §3), so Mid is one band of rows at one depth, with Low under it. On a shallow tree only the descendants dim, as before, and every other row is at full strength.
  - **The descendants went from 0.4 to 0.3, and the dragged row from 0.4 to 0.3.** Each is a tuning value of the sidebar's own: `projectNeitherOpacity` (the descendants are Low), `projectDraggedOpacity`, and `projectAnchorOpacity` (Mid, 0.6). They start at the board's values and are apart from the board's three, so either surface can be tuned without moving the other. Wiki board-drag-interaction §4.1 names the board's three, so the PO decides whether the sidebar's are named in project-tree.
  - **The top level has an answer of its own.** A top-level project has no parent project to ask, so the top level takes the dragged project when its whole subtree fits from depth 1. A top-level row past the cap is then Mid, never Low. It shows only when the dragged subtree reaches the cap, and then every top-level row is Mid. For a subtree already past the cap at the top level, every row is Low.
  - **Before the cap is known, nothing is past it:** the descendants are Low and every other row Full. The drop line marks nothing invalid then, in the same state.
  - **The tiers hold for the whole drag,** computed at pickup, as the board's are. A response landing mid-drag redraws nothing, though what a row does (the descendants take no drop, which rows the line can name) still follows the live tree.
  - **Unchanged, as the plan stated:** the tier dims a row's content and not its drop line; the descendants still take no drop; a Low row that isn't a descendant still names the gap above or below it, since a gap beside it can be valid at another depth; the red line past the cap stays.
- **Planned passages now built:** none, since none were planned.
- **Passages superseded:** none known. Wiki project-tree §2 stays true for the descendants and is incomplete otherwise.
- **Implementation passages placed,** all in docs the Coder owns:
  - `lib/dragTargets.ts`'s module header and the comments on its two inputs;
  - `dragClassification.ts`'s header, now the board's adapter;
  - `useProjectDragReorder.ts`'s header and `drawnAtPickup`;
  - the comments in `dragChrome.tsx` and `dragTuning.ts` that point at the tiers' new home;
  - four places in `client/src/components/workflow/AGENTS.md` (Amendment 5).

  Nothing for the PO to place.
- **Test-plan cases affected:**
  - **TREE-2.1's spec is skipped, for Story 10.** It pins the descendants' old 0.4, and they are now drawn at 0.3. The case's text still holds on its shallow fixture. The Test Planner may qualify two things in it: "`A` isn't dimmed" holds only away from the cap, since near it a row that isn't a descendant can be Mid or Low, and the dragged project's own row is drawn dimmed too.
  - **New unit tests with no case ID:** `lib/dragTargets.test.ts` (the walk over projects), the "tier each row is drawn at" block in `useProjectDragReorder.test.ts`, and `SortableProjectRow.test.tsx`. They pin the rule's implementation, and they are the unit half of the candidate below. The Test Reconciler may leave them unmapped until a case exists.
  - **A candidate for the Test Planner: the sidebar's tiers, read through `data-drop-tier`.** The spec needs a chain of projects to the cap, as TREE-1.11's builds (`fetchProjectDepthCap`), and the sidebar's three strengths seeded through `seedDragTuning` apart from the board's three. The throwaway check in Amendment 3 is the case's numbers: at a cap of 12, with a dragged project carrying one child, rows 1 to 10 are Full, row 11 is Mid, row 12 and the child are Low, the dragged row has no tier, and every row is clear after a cancel.
  - **Planner applied:** TREE-2.4 through TREE-2.8 now hold the separate tier, root, lifetime, line/gap and independent-value expectations; TREE-2.1 is qualified for the shallow fixture and own-row dim. They trace to project-tree §2 and shared hierarchy-placement §7. The board references and two explicit shared-rule assertions are updated as listed in Scope. Coverage assessment and any required internal approval remain with the Reconciler.
- **For the Architect:**
  - **Root `AGENTS.md`'s "One position math layer"** can name `lib/dragTargets.ts` beside `lib/hierarchyPlacement.ts`: the drag's classification walk, table-generic over `{id, parentId}` nodes, shared by the board and the project sidebar, with `anchorSetsParent` the one thing a surface supplies.
  - **Story 10's item 10 gains one skipped spec:** TREE-2.1's, in `tests/ui/project-tree-drag.spec.ts`, with the reason in a comment above it.
  - **The roadmap's 8.7 entry** has a "Today" paragraph that still says the sidebar dims the dragged project and its descendants to 0.4 and doesn't dim a project too deep to take the dragged one. That is right as the problem's statement and wrong as live.
- **Wiki sections added, changed, moved or removed** (PO, at close): hierarchy-placement §7 (new), its header and intro; board-drag-interaction §4.1 (the shared half moved out); project-tree §2, its Related line and an Open question. Amendment 6.

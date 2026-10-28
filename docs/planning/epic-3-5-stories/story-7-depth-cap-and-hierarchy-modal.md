# Epic 3.5 Story 7 — Depth cap, the hierarchy modal and a resizable sidebar

**Type:** story · **Written:** 2026-10-26 by the Architect, from Nathan's rulings the same day · **Status:** planning

## Goal

Let hierarchies go deeper than today's provisional cap of 6, and give every surface a way to show them:
- **a Card's Descendants section** shows a set number of levels, and a placeholder stands in for what's deeper;
- **a hierarchy modal** shows a Card's whole hierarchy, opened by clicking a placeholder, or by holding a drag over one, and takes a drop the way the section does;
- **the project sidebar** gets a draggable width.

Then set the real cap, one value for items and projects, from how deep the modal shows comfortably. Nathan wants it at least 10.

**Why there's a cap at all** (Nathan, 2026-10-26): only because the UI can't present deeper trees well. Without that, depth would be unlimited.

**Out of scope:**
- **Breadth,** a Card with many descendants at shallow levels. If the hands-on shows it needs a solution, it becomes a new roadmap story or a tech-debt story.
- **Collapsing or hiding the sidebar.** That comes later, so a user may drag it to a useless width for now, as long as dragging it back out is easy.
- **Depth so great that indenting each level no longer fits the modal or the sidebar** (the roadmap entry's deferral, and item-attachment's "Beyond the cap" open question).
- **Aligning drag across the sidebar and the board** (D12).
- **Folding the Card layer into the Descendants layer.** It's an optional story in the Epic 3.5 roadmap (Nathan, 2026-10-26), so this story keeps the Card layer.
- **Free descendants in the section or the modal** (D7).

## Scope

- **Wiki passages:** wiki board-drag-interaction §3.1, §7, §7.1, §7.3 and §9; wiki item-attachment §12. D2 has none: it's a working placeholder (Open questions, For the PO).
- **Test-plan cases:**
  - DRAG-7.1–7.19 and DRAG-7.21–7.24, DRAG-7.26–7.30, a new suite for the overflow row and the hierarchy modal (wiki board-drag-interaction §7, §7.1, §7.3 and §9), `Open`. DRAG-7.20 is the hold's feel, `Manual`.
  - DRAG-7.25, a hold-opened modal centered after a reload (§9), `Planned`: it's built by audit #2's fix.
  - DRAG-1.34, the new tuning values (§3.1), `Open`.
  - TREE-3.11, a deep project's name in a narrow sidebar (wiki project-tree §3), `Open`.
  - **To check when the cut-off is built:** DRAG-4's tree and DRAG-5.13's run three levels below the Card, so they assume a section shows at least three.
    - **Checked in Phase 2:** the specs that carry them pass unchanged at the default of three levels.

## Inbound deferrals

None. A6 routed nothing to this story (`docs/archive/a6-audit-guidance-and-first-run.md`, Handoff).

## Approach and phases

### Decisions

Nathan ruled these on 2026-10-26.

**D1. Two caps, one value.**
- `ITEM_DEPTH_CAP` and `PROJECT_DEPTH_CAP` stay separate code constants, so either can change later on its own. They aren't a user setting.
- Both take one value, picked in Phase 5's hands-on, at least 10.
- The value is grounded in how deep the modal shows a hierarchy comfortably. The sidebar and a Card's section inform it too; items never appear in the sidebar.
- Until Phase 5, both stay 6.

**D2. The sidebar's width is draggable,** by a handle on its right edge, like an IDE's file pane.
- **Default:** 240px, as today.
- **Max:** wide enough that a 10th-level project with a reasonably long name shows in full. At the 10th level a name starts about 186px in (138px of indent, the grab handle, the expand arrow and the right padding), so a 30-character name needs about 420px. That's the starting point, and Nathan's hands-on settles it.
- **Min:** about 120px, so the handle stays easy to grab.
- **Stored in the browser** (`localStorage`), per viewer.
- Nathan wants to see how it feels before deciding whether the sidebar needs anything more. Whether this is a rule or a working placeholder is the PO's call; the sidebar's other controls are in project-tree's Open questions.

**D3. A Card's section shows a set number of levels:** 3, counted from the Card. A Card at depth 4 shows depths 5 to 7. The number is a Drag tuning panel value, defaulting to 3, so it can be tuned in the same hands-on as the cap.

**D4. A placeholder stands in for the hidden levels.**
- Below a row at the last shown level (call it R) whose children are hidden, the section draws one placeholder row, "1 child" or "N children", one level under R.
- N is R's direct children. That they can have children of their own, and why they're hidden, should read as self-evident: a Card can show only so much.
- N counts attached children only: a Free child shows as a Card of its own (D7), so a row whose children are all Free has no placeholder. While one of R's children is dragged, N leaves it out, since the ghost shows it.
- The PO's name for it is the overflow row.

**D5. The placeholder moves like any row.** It slides above or below the ghost, the way every Stub does, so there are two gaps beside it. Each is read by wiki hierarchy-placement §1 as it stands, with the placeholder standing in for R's children:
- **Between R and its placeholder:** one state, R's first child, as in the gap under any row whose children follow it.
- **Below the placeholder:** R's last child at the placeholder's level, or, tabbed left, R's sibling or higher.
- **One exception:** no state lies right of the placeholder, since it isn't an item and can't take a child.

**D6. A drop in the section can go one level deeper than the section shows,** as R's first or last child.
- **R's first or last child,** by the two gaps of D5. The placeholder's count goes up by one.
- **Under a last-level row with no children,** the item becomes its only child, and the section then draws it as a new placeholder.
- **Placing precisely among R's children** takes the modal.

**D7. The modal shows a Card's whole hierarchy:**
- **The set:** the same set the section draws, the Card's attached descendants, at every level, with the Card as the root. Free descendants stay out, as they do from the section: they show on the board as Cards of their own.
- **Why that set** (Nathan): it's consistent with what the section does today. `positioning-on-create-and-edit.md` may later change which children a parent shows.

**D8. How it opens:**
- **By click** on a placeholder when no drag is running.
- **By a hold** during a drag, while the ghost sits in either gap beside a placeholder at the placeholder's level (D5). It works like zooming into a Card (wiki board-drag-interaction §6.1): a silent wait, then a cue on the placeholder. Letting go before the cue completes drops the item where the ghost shows. Any item that has reached the Descendants layer can open it, including a Free Card that zoomed in.

**D9. During a drag, the modal is the Card's Descendants layer, drawn whole.** While it's open:
- **Which rows count:** the modal's box bounds the layer, and the cursor and the ghost are read against the modal's rows. The Card's box and its section, under the backdrop, take no part.
- **What a release does:** it places the item by gap and depth among the Card's descendants, as in the section (wiki board-drag-interaction §7). An over-cap tab state is reachable and commits nothing.
- **Leaving it:** pulling away past the pop-out threshold is the usual Descendants → Card pop. The modal closes, and the drag is at the Card layer, so detaching still takes two pops.

  The alternative, a layer of its own below Descendants, would drop the drag back into the section first. That's three pops to leave, and the first lands somewhere that shows less than the modal.
- **After the drag ends in it,** by a release or a cancel, the modal stays open, where it opened. The user gets a moment to check where the item landed, and can pick it back up if it's wrong (D11). A write still in flight shows in the modal as it would in the section (wiki board-drag-interaction §10).
- **Back in the section after leaving it:** a Stub whose own slot is behind a placeholder starts as an item from outside does, in the last gap as the Card's last child, so a release right after the zoom moves it there. The section can't draw a ghost in a slot it doesn't show. Folding the Card layer in (Out of scope) would remove this case.

**D10. Where it opens during a drag: under the cursor.**
- **Placement:** the modal is placed so that the spot the ghost held in the section, R's first or last child (D6), sits under the cursor, so the ghost stays in about the same place.
- **At a window edge:** the modal is kept inside the window. When that shifts it, the cursor still lies inside it, because the modal is smaller than the window. The ghost then goes where the cursor reads against the modal's rows, not where it was in the section.
- **Opening re-reads the gap and the depth from the cursor.** Zooming into a section, by contrast, doesn't move the ghost.
- **A long list:** if R's children run longer than the modal, the modal scrolls its list to put that spot under the cursor.

**D11. Opened by click, it's centered.**
- No drag is running, so the cursor isn't read.
- **A drag can start in it,** from any row, and works as in a drag-opened modal. Pulling the row away closes the modal, and the drag goes on at the Card layer, like a Stub dragged in and pulled back out.
- **Closing it should be easy:** an X button, or a click anywhere outside it. Escape closes it too, as for the app's other modals, except during a drag, when Escape cancels the drag and the modal stays open (D9).

**D12. The modal uses the board's Descendants code. The sidebar keeps its own.**
- The difference Story 6.1's ledger kept on purpose stands (L1-7b): when the named row belongs to the dragged subtree, the board steps past it (`dragCollision.ts::travelingRowsFor`), and the sidebar maps it to "after the nearest eligible predecessor" (`projectTreeUtils.ts::resolveGap`).
- Nathan, 2026-10-26: combining them is more effort than keeping them apart.

**D13. Picking the cap.**
- **The seed:** a dev-only seed builds project and item chains about 12 levels deep, with names as long as real ones. It writes into a database file of its own (the server's `DB_PATH`), never `kanban.db`, and it writes rows directly, so it can go past any cap. The cap gates writes and never invalidates data (wiki hierarchy-placement §6), so the seeded trees stay readable at any value.
- **Trying values:** Nathan tries caps by changing the two constants on that stack. The client reads both caps from the server, so one restart switches the whole app.

### For the build

These are the Architect's, for the Coder. They're the places where the decisions above meet the drag layer's existing rules (`client/src/components/workflow/CLAUDE.md`).

**E1. One cut-off, read by the render and by the drop math alike.**
- The section's visible rows, placeholders included, come from one function: `itemListOps.ts::hierarchyRows` or one beside it. `KanbanCard.tsx` and `descendantsProjection.ts` both read that list, as they read `hierarchyRows` today, so they can't disagree about which row is where.
- **The placeholder is a row of its own.** It joins the section's `SortableContext` with an id of its own and a row type of its own in `dragCollision.ts`'s row data, so it slides with the rest.
- **D5's gaps map onto the full hierarchy.** The projection turns a gap beside a placeholder into the matching gap among all of the Card's descendants:
  - above it, the gap under R, before R's first child;
  - below it, the gap after R's last descendant.

  Then it clamps the depth at the placeholder's level. `lib/hierarchyPlacement.ts`, shared with the sidebar, then gives first child, last child and the shallower states unchanged, and never sees a placeholder.
- **One clamp for both cases:** no state deeper than the shown levels plus one. That covers D5's exception and D6's childless row.
- **Nothing past the projection sees a placeholder id:** not the anchors, the release or `dragRequest.ts::toRequest`. The board has every row, and only the drawing is cut.

**E2. One drag registration per item, and one element per region.**
- **The rows:** while the modal is open, the Card's section rows don't register with dnd-kit. The modal's rows register through `dragChrome.tsx::useItemRow`, as the section's do. Two rows registered under one item id would break the shuffle.
- **The region:** the modal carries the Card's Descendants region key (`descendantsRegionKey`) while it's open, and the section drops it. So `dragStructure.ts` finds one element for the key. The region's `parentRegionKey`, the Card, makes pulling away land at the Card layer with no new pop rule.

**E3. Opening the modal isn't a layer change.**
- **The pop machine:** the context key stays the Card's Descendants. What changes is the structure, which `dragStructure.ts` re-resolves after the switch as it does after a remount, and the projection's seed (E5).
- **The hold:** it's a new clock in `popSession.ts`, with the other clocks. It has a dwell and a cue like the Card zoom-in's, with tuning values of its own starting at that zoom-in's.
- **What the hold keys on:** the projection's gap and depth, not the named neighbor. In the gap between R and its placeholder, the named neighbor flips between "after R" and "before the placeholder" as the carried copy crosses the ghost's middle (`dragCollision.ts::dropAnchorFor`), while the gap stays the same. A clock keyed on the neighbor would restart on each flip.

**E4. The carried copy draws above the modal.**
- `dragOverlayGeometry.ts::clampToCurrentContext` reads the locked region's rect, so with E2 it clamps to the modal's box with no change.
- The modal renders inside the board's `DndContext`. A portal keeps the React context.

**E5. In the modal, depth is read from the cursor's x against the modal's own indents,** not as an offset from where the drag came in. So a modal shifted at a window edge still reads the depth the cursor is at (D10). Entering a section keeps today's seeded reading.

**E6. Classification is unchanged.** It's computed once per drag, over the board's items, and the modal reads `dragClassification.ts::isValidParent` as the section does.

**E7. Specs that build Stub chains toward the cap.**
- `tests/ui/drag-target-classification.spec.ts` builds a chain of Stubs under one Card down to `cap − 3`. At a cap of 10, its deepest rows sit past the section's 3 levels, behind a placeholder.
- When Phase 5 raises the cap, such a spec either sets a section depth that shows the whole chain (through `tests/helpers/dragGesture.ts::seedDragTuning`) or reshapes its fixture.
- The project-tree specs build project chains too. The sidebar hides no level, and a cut-off name keeps its accessible name, so they're unaffected.

### Phases

Each phase ends with the gate (`npm run check`, and the E2E suite against the test servers for a phase that touches the drag) and a stop for review and commit. Each phase from 1 to 4 also ends with Nathan's hands-on.

**Phase 0: docs ahead of the build** (PO, Test Planner)
- **The PO** writes D3–D11 into wiki board-drag-interaction §7 and §9 as Planned. That answers its Open question "Whether a Card shows its whole hierarchy": it doesn't, a placeholder stands in for the rest, and the board knows exactly what's hidden. The PO also places D2 where it belongs.
- **The Test Planner** writes cases for the Planned passages. DRAG-5.6–5.8 were withdrawn when overflow was demoted to an open question, so the new IDs are the Test Planner's call.
- **The grounding text** in item-attachment §8 and project-tree §3 waits for Phase 5.

**Phase 1: the resizable sidebar** (D2)
- Small, and independent of the rest.
- The handle is plain pointer handling, not a dnd-kit draggable, so it can't interfere with the sidebar's own `DndContext`.

**Phase 2: the deep seed, and the section's cut-off** (D3–D6, D13's seed, E1)
- The seed comes first, so there's deep data to look at.
- Then:
  - the tuning value;
  - the placeholder row;
  - its two gaps and the depth clamp.

**Phase 3: the modal, opened by click** (D7, D9, D11, E2, E4, E5)
- It shows the whole hierarchy, and a drag can start in it, place by gap and depth, and pull away to the Card layer.
- It stays open when a drag ends in it, and closes by its X or a click outside.

**Phase 4: the modal, opened by a hold during a drag** (D8, D10, E3)
- The hold, the placement under the cursor, the shift at a window edge and the scroll to R's children. After the release, the modal stays where it opened.
- The hands-on tunes the hold and checks a drag opened near each window edge.

**Phase 5: the cap** (D1, D13, E7)
- Nathan tries values on the seeded stack, along with the section depth, and picks them.
- The Coder:
  - sets both constants, and the section depth's default if it changed;
  - adjusts E7's specs.
- The PO updates the value and the grounding in item-attachment §8 and project-tree §3, and the examples that assume 6.
- The Test Planner checks att-4 and any case built on a chain of 6.

**After Phase 5: the story's audit** (Auditor)
- **The range:** its base is `a6-rerun-audited`, so it also takes in A6's batch 6 and the Reconciler's two commits after it. A6's plan intended that.
- **First under the finished rules:** it's the first audit of a story's own diff under them, so its report notes whether anything in them still needs changing.
- **Then its Fix Now,** in the batches below.

### The audit's Fix Now, in batches

*By the Architect, from `docs/audits/code-quality-audit-epic-3-5-story-7.md`. Each finding was checked against the code at `31009c7`.*

**Already fixed** by the test follow-ups (`31009c7`):
- the Fix Now findings #6, #7, #8, #11, #20, #21, #22 and #26;
- the Watch List's #37 and #38.

Batch 1 writes the Fix Now ones' Close-out rows, as fixed in `31009c7`.

**Order.** The batches go area by area, as A6's batch 6 did. Within an area, correctness comes first, then structure, then comments, so that each comment is written once, beside its final code.
- **The modal goes first:** #2 is the one defect a user can reach.
- **The scope script goes last:** nothing runs it until Story 8's audit. It still has to land before that audit (the report's "The audit rules", item 3).

**Decisions on the audit rules, approved by Nathan 2026-10-27.** These are from the report's "The audit rules, after their first story audit."
1. **Item 1:** the default config gives E2E and T an instance each, as this run's config did. In batch 6.
2. **Item 2:** `HierarchyModal.tsx` and `ModalShell.tsx` join `config.mts::BOARD_COMPONENTS`, so the modal's code sits in C1 with the rest of the board. In batch 6.
3. **Item 4:** a comment or test title that's wrong about the code is Fix Now, however small. *Done (Architect):* in `.claude/guides/audit-workflow.md` §6, the persona's tagging rules, and the drift agent.

The guide's §2 points at `config.mts` for the default split, so 1 and 2 need no guide edit.

**Batch 1: the hierarchy modal.** #2, with #36 and #75; #31; then #55, #10, and #23's modal half.
- **#2:**
  - **The fix:** `HierarchyModal.tsx` decides once, when it mounts, whether to place itself at the cursor: it does when it has an anchor and a drag is running. `position` and the layout effect's guard both read that decision. A mount with no drag centers the modal, as a click does.
  - **Why it covers both failure scenarios and DRAG-7.25:** every reload goes through `BoardView.tsx::loadBoard`, which unmounts the board.
  - **Leave `anchor` alone:** BoardView doesn't clear it after placing (the report says why).
- **#36:** when the placement comes back null (no projection, or no row for the spot), the modal centers in the same way and warns. The finding's reading derived from the cursor isn't built, since that path is unreachable today.
- **#75:** a `key` on the modal in `BoardView.tsx`, from its Card's id. One line.
- **#31:** `placeAtCursor` passes `travelingRowsFor(session) ?? (() => false)`, and its own check goes. One line; the result is unchanged.
- **#55:** one exported constant for "every level", beside `itemListOps.ts::shownLevels`. `HierarchyModal.tsx` and `useBoardDnd.ts::levelsDrawnAt` read it in place of a bare `Infinity`.
- **Comments:**
  - #10, `ModalShell.tsx`'s header and comment;
  - #23's pointer, `wiki board-drag-interaction §9`, in the modal's header;
  - #69's line on `HierarchyModalContext.ts`: only the Card reads the context.
- **Guard tests.** The reconciliation report's "Regression guards" found none for #2 or #31.
  - **DRAG-7.25:** a hold-opened modal is centered after a reload, both after a release whose write fails and after a reload mid-drag (set up as DRAG-7.23's specs are). The case is `Planned`. The spec carries its ID, and the handoff lists the centering as built.
  - **Failure scenario (b),** a release between the hold running out and the mount, can't be timed by a spec. The same decision at mount covers it.
  - **For #31:** a hold that opens the modal while the dragged item has descendants: the spot under the cursor, and what a release writes. No spec drags an item with a subtree into the modal today.
- **Size:**
  - **Code:** about 15 lines in `HierarchyModal.tsx`; 1 in `BoardView.tsx`; 2–3 each in `itemListOps.ts` and `useBoardDnd.ts`.
  - **Comments only:** two files.
  - **Tests:** two or three new specs.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 2: the server.** #1 with #9; #3; #19.
- **#1:**
  - **The fix:** each Free item gets its position from `positionResolver.ts::resolveAppendPosition` over `itemPositionScope.ts::positionScopeFor`, inside the seed's transaction. `freePositions` and `nextFreePosition` go.
  - **The test:** it asserts positions unique among every Free item of the workflow, and its title says "ordered across the workflow" (the reconciliation report's item D).
- **#9:**
  - **The header:** the seed writes directly, so no cap holds it. Items go one level past the cap, and projects reach it.
  - **The tests:** they read `ITEM_DEPTH_CAP` and `PROJECT_DEPTH_CAP` and are titled "to the caps". The last one asserts a depth, not a count.
- **In `deepSeed.ts` beside them:**
  - a Free child's type is `kindAt(0)`, the Informational note under #36;
  - the letters comment at 87–88, #69.
- **#52:**
  - **The fix:** one `lib/` helper copies a list of workphases into a new workflow, and the seed and both of the route's branches (template and copy) call it. About 30 lines come out and one function goes in.
  - **Where it lives** is the Coder's call: beside `defaultBoard.ts::createDefaultBoard`, which every new workflow also gets, or in a module of its own.
  - **Guards:** `workflows.test.ts`'s template and copy tests, and the seed's tests.
- **#3:**
  - **The fix:** both guards test `!== undefined && !== null` and call `getOrNotFound.ts::existsById`. So does the project check above them, which is #53's part in this file.
  - **The behavior change:** `templateId: ''` or `sourceWorkflowId: ''` is now a 400, where today it's a 201. No client path or MCP tool sends either.
  - **Tests:** a refusal for each `''`, and a `null` for each, read as none, the guard the reconciliation report says no test has.
  - **No case ID yet:** project-tree §10's cases are the Test Planner's (Open questions, For the Test Planner). If they land first, the tests carry their IDs.
  - **Unchanged:** a create that names both. Both are still checked, and the template is taken (Open questions, For the Architect).
- **#19:** `move-project.bru`'s doc.
- **Gate:** `npm run check` and `npm run test:e2e`, since every spec's setup creates a workflow through this route.

**Batch 3: client structure.** #28, #30, #35.
- **#28:** a new `client/src/lib/browserStorage.ts`, which `sidebarWidth.ts` and `dragTuning.ts` both call.
  - **What it holds:** the storage interface, `browserStorage()`, and a guarded read and write.
  - **What changes:** `dragTuning.ts` gets the guard, so a refused write no longer throws out of the tuning panel's `onChange`.
  - **Tests:** one memory fake in `client/src/test/`, with a variant that refuses, serves both test files. New tests cover a refused write and a read that throws, for the drag tuning; the reconciliation report lists neither.
- **#30:** `cursorXInList` and `depthAtCursor` go through `cardMetrics.ts::descendantsIndentPx`. Two lines.
- **#35:** the test calls `buildCardInColumn`.
- **Beside #28:** #69's line in `sidebarWidth.ts`. The widest width is sized for a 10th-level name, and a deeper one may be cut (Nathan, 2026-10-27).
- **Not taken:** #28's optional ride-along, the direct `localStorage` calls in `App.tsx` and `useBoardManagement.ts`. They're older code with no defect found, and taking them would bring `App.tsx` into Story 8's audit.
- **Gate:** `npm run check` and `npm run test:e2e`. Every drag spec loads the tuning through `seedDragTuning`, and the modal-hold specs read #30's placement.

**Batch 4: the drag layer's comments.** Comments and test titles only. #12–#17 and #24; #23's half at `itemListOps.ts::sectionEntries` (`wiki board-drag-interaction §9` and `item-attachment §12`); with #46, #60 and #69's client lines.
- **#15** takes its own Informational note with it: `dragChrome.tsx`'s header, the `useItemRow` comment and `ItemRowOptions.parentId`.
- **#46** is now ruled: the overflow row's indent is the Card's (DRAG-7.24). `StubRows.tsx`'s comment and the drag layer's `CLAUDE.md` narrow "a press on it goes no further" to a press on its count.
- **#60:** `dragCollision.test.ts`'s title gains "of the context Card".
- **#69's lines:**
  - `popSession.ts:420-421`, the reference split across a line, which `check:docs` can't read;
  - the consumers of `hierarchyRows` in `itemListOps.ts:239-245` and `itemListOps.test.ts:202`;
  - overflow rows in `useBoardDnd.ts:404-407` and in `AttachedChildRow`'s comment;
  - `dragCollision.test.ts:313-320`'s ghost-height header.
- **Gate:** `npm run check`, which runs `check:docs`.

**Batch 5: E2E.** #27, #32, #33, #34, #25; with #47, part of #61, and part of #65.
- **#27:**
  - `project-sidebar.spec.ts` moves onto `seedProject` and `seedProjects`, and drops the `API` import.
  - A new `seed.ts::seedBoard` replaces `boards-layer.spec.ts:239`'s hand-rolled post.
  - **With #61's sidebar delete sequence:** one `ProjectSidebarPage` method, used by `project-sidebar.spec.ts` and `project-page.spec.ts`.
- **#32:** `overflowTree.ts` exports `rowIds(scope)`. `sectionRows` calls it, and `modalRowIds` goes.
- **#33:** `itemRow` takes a `Page` or a `Locator`, and both `modalRow` copies go.
  - **With #47:** a `region(scope, key)` locator in `boardLocators.ts` and an exported overlay locator replace the literal `data-drag-region` and `data-drag-overlay` in the two DRAG-7 specs.
- **#34:** `boards.spec.ts` calls `seedTemplatedWorkflow`.
- **#25:** a one-line rule (f) reason at `dragHandleBy`, which stays in its spec. TREE-3.11 now uses it too, in the same file.
- **#65:** DRAG-7.22's spec moves to `drag-7-overflow-row.spec.ts`, beside DRAG-7.24's, and keeps its ID.
- **#26's ride-along:** `drag-column-bands.spec.ts:189` uses `dragMachine`.
- **Not taken:**
  - **#61's Stub-handle locator:** its nine sites in `drag-5-stub-detach.spec.ts` and `drag-target-classification.spec.ts` differ in `exact`, so sharing it changes a selector at each site; it isn't a move.
  - #61's other helpers, and #65's split of the placement specs.
- **Size:** 13 files, all test code.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 6: the scope script.** #4 with #43; #5 with #45, #77 and #49; #29; #18. Then the config defaults (decisions 1 and 2).
- **#4:** a hunk is a removal site when it removes a non-blank line and none of the lines it adds is in the settled changed list. `scan.test.mts`'s fixture gains a commit that unwraps a guard.
- **#43:** the diffs run with `--no-color --no-ext-diff`, and `scan.test.mts` points `GIT_CONFIG_GLOBAL` at an empty file.
- **#5:** git's own `error.message` prints after the guess. With it:
  - **#45:** `main.mts` clears `scope-*.md` in `--out` first.
  - **#77:** `parseConfig` checks the shapes of the values, a bad regular expression fails inside the config's `try`, and `showAt` tells a missing path from a git failure.
  - **#49:** one `parseSpec`, which refuses a kind it doesn't know.
- **#29:** `lineKinds.mts` exports `splitLines`, and `scan.mts` calls it.
- **#18:** the assertion checks that no scope names the file the code moved from as a source, or it's deleted.
- **#69's line:** `AttachGhostRow`, which names no file, comes out of `BOARD_COMPONENTS`.
- **The config defaults:**
  - **E2E and T:** every pass gets an E2E instance and a T instance in place of `E2E-T`, as this run's `docs/audits/epic-3-5-story-7-scopes/config.json` split them. That's 23 instances in all.
  - **The board group:** `HierarchyModal` and `ModalShell` join `BOARD_COMPONENTS`, so the files and their tests fall in C1 and C1t.
  - **Tests:** `config.test.mts` and `scopes.test.mts`, which name `E2E-T` instances, follow.
- **Not taken:**
  - **#44,** a copy beside a move hidden as moved. It's the same kind of gap as #4, but its fix changes how moves are found; it isn't a one-line rule.
  - #50 and #51.
- **Gate:** `npm run check`, which runs the script's tests.

**Across the batches:**
- **Each batch** ends with its gate and a stop for Nathan's review and commit, and fills in its rows in the report's Close-out table.
- **A test that moves keeps its case ID.** The Reconciler's one run (`.claude/guides/story-done-checklist.md`, step 5) comes after batch 6.
- **Comment-only files stay comment-only:**
  - **Which:** `popSession.ts`, `descendantsProjection.ts`, `dragRegions.ts`, `StubRows.tsx` and `cardMetrics.ts` get only batch 4's comments. So Story 8's audit gives them to the drift pass alone.
  - **What that rules out:** #57, the hold's timing in `popSession.ts`, and #58, the `data-item-id` literal in `StubRows.tsx`. With #36, a renamed attribute now centers the modal and warns, rather than leaving it unplaced in silence.
- **The optional findings left out:**
  - **Watch List:** #39–#42, #44, #48, #50, #51, #53's helper across the routes (the API contract epic's Story 2 may take it), #54, #56–#59, #61's other helpers, and #62–#66;
  - **Informational:** every finding except the #69 lines above.
- **At close-out:**
  - The report's "For other roles" go to Open questions (`.claude/guides/audit-workflow.md` §9).
  - The Architect widens `.claude/guides/testing-strategy.md`'s "Server lib" row, since `deepSeed.test.ts` tests `server/src/db/`.

## Code map

*What's expected, by the Architect. The Coder corrects it as built.*

| Symbol | Carries |
|---|---|
| `server/src/lib/itemTree.ts::ITEM_DEPTH_CAP`, `PROJECT_DEPTH_CAP` | D1: 12 each, as built in Phase 5, until Nathan's hands-on picks the value (Amendments, Phase 5) |
| `client/src/components/ProjectSidebar.tsx`, `sidebar/useSidebarResize.ts`, `sidebar/sidebarWidth.ts` | D2: the aside takes the width; its list scrolls in a box inside it, so the handle on the aside's right edge stays put. The hook is the handle's pointer handlers, and the module holds the default, the limits and the storage |
| `client/src/components/workflow/dragTuning.ts::DragTuning`, `client/src/components/DragTuningPanel.tsx` | D3's section depth, as `sectionLevels` (default 3), with its panel field; E3's hold, as `modalHoldDwellMs` and `modalHoldCueMs` (500 and 800, a Card zoom-in's), with their panel fields |
| `client/src/components/workflow/itemListOps.ts::sectionEntries`, with `shownLevels`, `overflowRowId` and `overflowOwnerOf`, beside `hierarchyRows` | D3–D5, E1: the rows the section draws, an overflow row under each last-level row that has attached children. The render and the drop math both read the level count through `shownLevels` |
| `client/src/components/StubRows.tsx::OverflowRow`, `SectionRows` | D4: the overflow row, a button that opens the modal, with no drag source (a press on its count goes no further than the row, and a press on its indent is the Card's, DRAG-7.24), `data-overflow-row` and no `data-item-id`; D8: it draws the hold's cue (`ZoomCue`). `SectionRows` is the one list of rows that a section and the modal both draw, with a static drawing for the section while the modal is open |
| `client/src/components/KanbanCard.tsx` | D3, D4: the section's render, through `sectionEntries` and `SectionRows`; E2: while the modal is open the section draws static and is no region |
| `client/src/components/workflow/dragCollision.ts` (row data) | E1: the row role `'overflow'`, and a section row's `sectionCardId`, which the section collision filter matches against the context's Card (the modal sits over other Cards' rows), with `isOverflowRow` and `isSectionRow` (a collision candidate in a section, no Card-layer target, a Stub row's ghost height), and `travelingRowsFor` stepping past the overflow row of a traveling row |
| `client/src/components/workflow/descendantsProjection.ts` | D5, D6, E1: `gapForAnchor`, which turns an overflow-row neighbor into the gap among all the rows, and the depth clamp, handed to the shared library as a number; E3: `overflowBeside` and `modalHoldTarget`, what the hold keys on; E5: `reseedProjection`, which the reading at the cursor goes into |
| `client/src/lib/hierarchyPlacement.ts::computeProjection` | E1's clamp as an optional `maxDepth`, the deepest state a surface offers when it draws fewer levels than its rows hold. The sidebar passes none, and the library never sees an overflow row |
| `client/src/components/workflow/popSession.ts` | E3: the hold that opens the modal, `advanceModalHold` on `PopSession.modalHold`, keyed on the target's gap, depth and side, with its timer in `popDueAt`; `containmentRect` reads a region's `boundsRect` |
| `client/src/components/workflow/dragRegions.ts::dragRegionProps`, `dragStructure.ts::findParentRegionKey` | E2: a region element that isn't inside its parent's names it (`data-drag-parent-region`), which the modal's list does for its Card |
| `client/src/components/HierarchyModal.tsx`, on `ModalShell.tsx` | D7, D9, D11: the modal, centered, with its list as the Card's Descendants region; Escape, the X and a click outside close it only with no drag running. Opened by a hold, it places itself under the cursor in a layout effect (D10, E5), and reports what the cursor reads against its rows. `ModalShell.tsx` takes a position, a ref to its dialog and extra attributes for it |
| `client/src/components/workflow/modalPlacement.ts` | D10, E5: the pure geometry of the placement: the dialog's position and the list's scroll (`placeModal`), the gap the ghost takes from the row under the cursor (`slotForGap`, `gapAtSlot`) and the depth at the cursor's x (`depthAtCursor`) |
| `client/src/components/workflow/dragRegions.ts::boundsRect`, `DRAG_BOUNDS_ATTR`, `dragStructure.ts` | D9: the modal's list is the layer's region and its dialog the bounds the pop-out test measures against, so the header is inside the modal |
| `client/src/components/workflow/HierarchyModalContext.ts`, `client/src/components/BoardView.tsx`, `workflow/useBoardDnd.ts` | D9: which Card's modal is open (`BoardView.tsx` owns it, and renders the modal inside the board root); `useBoardDnd.ts` draws every level there (`levelsDrawnAt`) and closes it when the drag's context leaves the Card's Descendants layer. D8, D10: `evaluatePop` advances the hold, and when it has run its length opens the modal with the cursor (`openHierarchyModalAt`); `readModalPlacement` takes the modal's reading and reseeds the projection with it |
| `client/src/components/workflow/descendantsProjection.ts`, `placement.ts`, `DragSessionContext.ts::DescendantsProjection` | D9: `slotHidden`, a Stub whose own slot the section doesn't draw comes back into the section as an item from outside does: the last gap, previewed as the Card's last child |
| `server/src/db/deepSeed.ts`, `deepDbPath.ts` and `seedDeep.ts`; `server/.env.deep`, `client/.env.deep`; the `seed:deep` and `dev:deep` scripts of `server/` and `client/` | D13: the seed, and the stack it runs on (Amendments, Phase 2) |

## Amendments

- **2026-10-26, D5 replaced (Nathan and the PO, with the Architect's cost check).** The placeholder moves like any row, not as one block with R. The section now offers R's first child and R's last child, which D6, D8, D10, E1 and E3 now say.
  - **Why:** it's the shared placement rule as it stands, and it's the cheaper build. A row that stays put needs a sorting strategy of its own, since rows that slide past a fixed row overlap it. It also needs a collision exception that draws the ghost below the row while the carried copy is over it.
- **2026-10-26, Phase 0 written (PO).** Nathan took the PO's recommendations on D8's cue and D9's hidden slot, and the PO answered the plan's three questions (Open questions).
  - **Changed in place:**
    - **Scope:** its wiki passages.
    - **D4:** the wording, and what N counts.
    - **D9:** the hidden slot.
  - **D4's attached-only count, a deduction:** from D7. The modal shows only attached descendants, and a Free child shows as its own Card.
  - **D4's dragged child left out, a deduction:** from wiki board-drag-interaction §7.2 and hierarchy-placement §4. A dragged item's subtree travels with the carried copy, and the ghost already shows the item.
  - **The wiki:**
    - **board-drag-interaction:** §3.1 (the tuning values), §7 (the hidden slot), §7.1 (the overflow row's gaps), a new §7.3 (the modal during a drag) and §9 (the cut-off, the overflow row, the modal), all Planned. §9 is retitled "Depth overflow and the hierarchy modal", and its "Not settled" now states today's rule, a section that lists every level. §7.2's pointer to the Open question is gone, and so is the Open question. The look of the overflow row, the modal and the hold's cue is under Open questions.
    - **item-attachment:** §12 (Planned), and "expanded-hierarchy modal" renamed "hierarchy modal" in §8 and Open questions.
    - No section number changed.
- **2026-10-26, Phase 0's cases (Test Planner):** a new suite, DRAG-7, for §9's cut-off, overflow row and modal, §7.1's overflow-row gaps, §7.3, and §7's hidden slot; and DRAG-1.34 for §3.1's new tuning values. No live case changed. Three cases are `Pending PO`.
- **2026-10-26, Phase 2 built (Coder).** The deep seed, and the section's cut-off.
  - **The seed:** `npm run seed:deep` in `server/` removes and rebuilds `server/data/deep.db` and seeds it, writing rows directly, so it goes past any cap.
    - **What's in it:** a project chain 12 levels deep with siblings along it and a second root; one workflow on the root project from the "flow" template, with its default board; and four Cards in Todo and In Progress: a single path of Stubs 12 levels deep, a Card holding the DRAG-7 tree (its letters in the titles) with a Free child that has a chain of its own, a Card whose third-level row has 20 children, and a Free Card to drag in.
    - **Which file it writes:** only one named `deep….db`. A `DB_PATH` that isn't refuses, so the dev, test and vitest databases can't be reached from it.
    - **The stack:** `npm run dev:deep` in `server/` serves it on port 3003, and the same in `client/` serves the UI on 5175. The two ports are apart from the E2E stack's 3002 and 5174, which a Playwright run could otherwise reuse, and that stack's test routes would reset the data. The two `.env.deep` files carry the ports and the path. Cap trials: change the two constants and restart the server; the client reads both caps from it.
  - **The cut-off:**
    - **The level count** is the tuning value `sectionLevels`, 3 by default, in the panel under "Section". It is read as a whole number of at least 1, since the panel takes any number.
    - **The overflow row** sits one level under each last-level row with attached children, reads "1 child" or "N children", and slides with the rows. It is no drag source, and a click on it opens the modal (Phase 3).
    - **Where the drop math differs from the plan's wording:** E1 puts the clamp in the projection. It lives there, as the number `computeProjection` takes (`maxDepth`), so the shared library still never sees an overflow row.
  - **The dragged child left out of N** is built and unit-tested, and no spec reaches it until Phase 3, since a hidden row can't be picked up from the section.
  - **Checks:** `npm run check` passes (420 server tests, 504 client, 185 script), and `npm run test:e2e` passes with 179 and 8 skipped.
- **2026-10-26, Phase 3 built (Coder).** The modal opened by a click, a drag in it, and the hidden-slot start.
  - **What it does:** a click on an overflow row opens it, centered. Its list holds every attached descendant at its level and is the Card's Descendants region: a drag started on a row starts at that layer, places by gap and depth with every level offered, and an over-cap state is reachable and writes nothing. The Card's own section draws static under the backdrop and is no region. Leaving the list's box for the pop-out threshold closes it, and the drag is at the Card layer, so detaching still takes two pops. A drag that ends in it by a release or a cancel leaves it open. Escape, the X and a click outside close it only with no drag running.
  - **A Stub with a hidden slot:** one picked up in the modal and pulled back out, whose own slot the section doesn't draw, comes back into the section in the last gap, as the Card's last child (D9). The projection seeds it so (`slotHidden`), and `placementFor` previews it there, so the overflow row leaves it out of its count meanwhile.
  - **Phase 2's note on the overflow row was wrong, and is fixed.** It said a drag started from the row picks up nothing. A press on it reached the Card's own drag listeners, so it picked up the Card. A press on it now goes no further.
  - **Where the build differs from the plan's wording:**
    - **E4, a portal:** the modal is a child of the board root, not portaled. Its backdrop is `fixed`, so it takes no part in the board's layout, and being inside the root keeps one DOM element tree for the drag's regions and the overlay's color variables, with the React context unchanged. The carried copy draws above it.
    - **E5, the depth read against the modal's own indents:** not built. For a drag that starts in a click-opened modal the seeded reading reads the cursor's own depth, since nothing moves under the cursor. The reading against the indents is needed once the modal opens under the cursor, and is built with that, in Phase 4.
    - **The region is the modal's list,** its scroll box, not the dialog with its header. A row scrolled out of view lies outside the region's rect, so it isn't a collision candidate, as for a section clipped by its column. The header, with the X, is outside the layer's box.
    - **A section row's registration carries its Card** (`sectionCardId`), and the collision filter matches it: the modal sits over the board, so rows of other Cards' sections lie inside its box.
  - **Built beyond the plan:** the modal closes when its Card is gone or has no attached descendants left, DRAG-7.23's lean, which is still `Pending PO`.
  - **Not wired:** a click on a row in the modal opens nothing. The Sheet would open behind the modal's backdrop.
  - **The guard on Escape can't be told from its absence by a spec:** with it removed, a keypress during a drag still doesn't reach the modal's handler, so the modal stays open either way. The guard states the plan's rule and stays.
  - **Checks:** `npm run check` passes (420 server tests, 513 client, 185 script), and `npm run test:e2e` passes with 193 and 8 skipped.
- **2026-10-27, Phase 4 built (Coder).** The modal opened by a hold during a drag, placed under the cursor.
  - **The hold (D8, E3):** while the ghost sits directly above or below an overflow row, at its level, a silent dwell and then a cue on the row end in the modal opening. The tuning panel holds both (`modalHoldDwellMs`, `modalHoldCueMs`), at a Card zoom-in's 500 and 800. The cue is the zoom-in cue's look, a placeholder. It is not a layer change: the context stays the Card's Descendants, and a release before it completes commits where the ghost is.
    - **What it keys on:** the projection's gap, depth and side of the overflow row, not the named neighbor, which flips between the owner and the overflow row as the carried copy crosses the ghost's middle. A tab to another level or a move to another gap resets it, and the cue goes at once.
    - **Any item at the layer can open it:** one of the Card's Stubs, or an item from outside (the projection is the same for both).
    - **Beyond the plan:** it runs only with the cursor inside the section's box, so a cursor resting outside ends it; and not in an over-cap state, as a Card's zoom-in never starts on an invalid target (DRAG-7.21's lean, still `Pending PO`).
  - **Where it opens (D10):** under the cursor. The modal mounts at the window's corner, measures itself, and moves so that the row whose slot the ghost holds is under the cursor, its depth's column at the cursor's x, before the first paint. A list longer than the modal scrolls to bring the spot there. The dialog is kept inside the window.
    - **The reading (D10, E5):** it then reads the gap and the depth afresh from the cursor, the gap from the row under the cursor and the depth from the cursor's x against its own indents, and the projection carries on from them. A modal that fitted reads back the spot it was placed for. A shifted one reads where the cursor is, which needn't be the owner's first or last child: a modal pulled left by a narrow window puts the cursor further along the indents, and the ghost goes in deeper, as the owner's last sibling's first child.
    - **The ghost's row** slides into its slot as any row does, in about 200 ms after the modal appears, so it is drawn at the end of the list for a moment first. That is for the hands-on (DRAG-7.20).
  - **Where the build differs from the plan's wording:**
    - **The modal's box (D9, Phase 3's region):** Phase 3 made the list the region and left the header outside it. A modal shifted at an edge can put the cursor over the header, and the cursor must stay inside the modal then, so the dialog is now the bounds the pop-out test measures (`boundsRect`). The list stays the region: the carried copy is clamped to it, and its rows are the collision candidates.
    - **E5, read once, not continuously:** the depth is read from the cursor's x against the indents at the moment of opening, and the projection measures the pointer's travel from there, as it does everywhere else. That reads the same depth an absolute reading would, up to rounding, and keeps one rule for the section and the modal.
    - **D10's placement is exact only for the ghost's row:** the row the cursor rests on is the one whose slot the ghost takes, whichever way the ghost is moving (`modalPlacement.ts::slotForGap`), so the ghost is under the cursor and not just near it.
  - **Edges tested:** the bottom edge (a modal as tall as the window allows, with the spot high in it) and the right edge (a narrow window) have E2E specs. The top and left edges are tested on the geometry only (`modalPlacement.test.ts`): with the section where the board puts it, a cursor can't be brought near them.
  - **Two behaviors no spec can tell from their absence:**
    - The hold is cleared as the modal opens. Without that, a sample landing before the modal's state has committed would open it a second time, and the second open places the same modal in the same spot.
    - The reading is taken at the modal's levels (`evaluatePop(cardId)` in `readModalPlacement`), because the hook has not yet seen the modal's Card in its deps in the commit that mounted it. Without that, the one sample taken there clamps the depth to the section's levels, and the next sample, from the seed, reads the right one.
    - Both are kept because they state the rule; neither shows once a second sample has run.
  - **Checks:** `npm run check` passes (420 server tests, 543 client, 185 script), and `npm run test:e2e` passes with 207 and 8 skipped.
- **2026-10-27, Phase 5 built (Coder).** The cap raised, and the specs that assumed 6.
  - **The value:** both constants are 12. Nathan hasn't picked yet, so 12 is a starting value for his hands-on (D1), chosen as the depth the deep seed goes to. The section depth's default stays 3. To try another value, change the two constants and restart the server. The code comments on them no longer name a number, so a new value is a one-line change each.
  - **The suite at other values:** the server and client tests and the test-plan cases are written against the constants, so they hold at any value. The full E2E suite passes at 12 (207 passed, 8 skipped), and passed at 10 before DRAG-7.9's edit below. At 15 the full suite had that one spec failing. After the fixes, the three spec files that depend on the cap (the hierarchy modal's, the classification's and the project-tree sidebar's, 24 tests) pass at 10, 12, 15 and 20. Only those three were run at 20.
  - **What assumed 6, and what changed:**
    - **E7, the classification spec** (DRAG-2.1 to DRAG-2.4, DRAG-2.7, DRAG-2.10): its chain of Stubs runs to `cap − 3`, nine levels at 12, so its deepest rows sat behind overflow rows and drew no state. It seeds the section depth to the cap.
    - **TREE-3.7's spec:** two things. Its chain's names run `P1` to `P12`, and the page object's `projectName` matched by substring, so `P1` found four rows. It matches the whole name now, and every caller already passes one. And at the default 240px a name at the 13th or 14th level has no room left after its indents and draws at no width, so the spec seeds the widest sidebar.
    - **DRAG-7.9's over-cap spec:** at 15 it rested the cursor on the last row's lower quarter, and the ghost stayed above that row. Probing fresh drags, the last gap was reached only with the cursor at or below the row's lower edge at 15, and from about six pixels above it at 12. That is the sortable's side rule (`dragCollision.ts::dropAnchorFor`, the carried copy's centre against the slot's), which depends on measured rects. I didn't trace why the threshold moves with the row count, and it isn't new: the section's list works the same way. The spec now rests the cursor at the row's lower edge, still inside the list.
    - **Nothing else:** the other specs read the cap from the board or the API, or build no chain toward it.
  - **The sidebar at a deeper cap** (Open questions, For Nathan): its maximum width, 420px, was sized for a 10th-level name. Nothing is changed.
  - **Mutation check:** without the seeded section depth, the classification spec fails (the deepest row isn't drawn). Without the whole-name match, and without the wide sidebar, TREE-3.7 failed before each fix. DRAG-7.9's edit is the one that no value up to 12 can tell from its absence; it fails at 15 without it.
  - **Checks:** `npm run check` passes (420 server tests, 543 client, 185 script), and `npm run test:e2e` passes at 12 with 207 and 8 skipped.
- **2026-10-27, Nathan's rulings on the cap and the open edges, and the wiki written (PO).**
  - **The cap (D1):** 12, for items and projects, as built. Depth would be unlimited if the UI could show it. 12 is a value the UI is known to show well, and deep enough that real use should rarely want more.
  - **The sidebar at 12:** a deep project or a long name is read by dragging the sidebar wider, as in an IDE's file pane, and a narrow sidebar hides much of it. That's expected, and the maximum width stays 420px. The width itself stays a working placeholder (D2).
  - **A click on a row in the modal** stays inert. Opening the Sheet from the modal is for Story 8 or a story of its own, and is under board-drag-interaction's Open questions.
  - **DRAG-7.23:** a reload leaves the modal open while its Card has attached descendants, and after a reload a modal a hold opened is centered, as one opened by a click is. The centering is Planned: it's audit finding #2's fix.
  - **DRAG-7.21 and DRAG-7.22,** and Phases 2–5's behavior decisions in the handoff, taken as built. DRAG-7.22 covers the overflow row's count. The row's indent belongs to the Card, as beside a Stub row (audit #46).
  - **The wiki:** the handoff's built passages lose their markers, and the rulings go in. The sections are listed in the handoff (Wiki sections added, changed, moved or removed).
- **2026-10-28, the proposing reconciliation's test follow-ups, first stop (Coder).** `docs/audits/test-reconciliation-epic-3-5-story-7.md` ran before the audit's Fix Now batches, so that tests which are missing or can't fail get fixed first and then guard the fixes. The Coder's part of it is in three stops: this one makes the tests that exist sound and puts case IDs on them; the next writes the specs the Open cases still lack; the Fix Now batches follow, each with its guard test (the report's "Regression guards").
  - **Stamps (surface tests, so no approval):**
    - DRAG-7.2 on the DRAG-7.6 spec that reads "1 child" while `R1` is dragged;
    - DRAG-7.10 on the spec that pulls out of a hold-opened modal;
    - DRAG-7.6 and DRAG-7.11 on the pop-out spec, which now also watches writes;
    - DRAG-7.19 on the specs that release in the modal, or cancel in it, and check its box;
    - DRAG-7.21 and DRAG-7.22, now that the PO has ruled them.
    - DRAG-7.14 stays on the spec for the hold ending when the cursor rests outside the section: the Test Planner folded it into the case as its third reset.
  - **Specs that couldn't fail, now able to:**
    - **DRAG-7.11 (audit #6):** the carried copy is measured where it is painted. The ghost is checked to stay in the dragged row's own gap while the cursor rests behind the backdrop, at the height of that row.
    - **DRAG-7.16, bottom edge (audit #7, and the report's item C):** the spec reads the parent and siblings the painted ghost lies between, waits on the move's response, and holds what was written to them. It was "not R's first child"; a release that always wrote the Card as the parent now fails it.
    - **DRAG-7.14, within the gap (item M):** each read is taken once, a few frames after the move, with a dwell of 1.5 s. The old read retried, so by the Reconciler's reading (item M) a hold that started over reached the cue again inside the wait and passed. A cue that restarts on every sample fails the new one.
    - **DRAG-7.21:** the old spec's "no modal" check was `toHaveCount(0)`, which passes at once, so it never waited out the hold. It waits for the whole hold and more, from both gaps, and checks that the level where the item fits starts none either. Without the validity check on the hold, it fails.
    - **DRAG-7.19:** the pending mark is held and read in the modal; the modal's box is checked after a release, a release that writes nothing, a cancel, and a release in a hold-opened modal.
    - **DRAG-7.9:** the released item's workphase and `isAttached` are read.
    - **DRAG-1.34:** the next hold takes the changed cue, as well as the dwell.
    - **DRAG-7.22:** a click on the count opens the modal and not the Sheet; the press goes through `pickUp` and `hoverTo`, not a hand-rolled drag (audit #26).
  - **Unit and server tests (items A, B and audit #8, #11, #22):** the hold-clearing test builds a session with a running hold and an expired outside clock, since resting outside already ends the hold; it fails when a pop carries the hold over. The cycle test reads the exact depths the server's walk gives. TC-2.8's setup creates are checked, and its done-anchor test asserts the message and the unchanged row. Two tests that carried DRAG-7.16 are retitled DRAG-7.10. A comment on the sidebar's depth is corrected.
  - **Smaller fixes from the audit:** #20 (a comment), #21 (a title), #37 and #38 (reads that didn't wait, and a write check that didn't watch writes).
  - **Helpers:** `delayMoveResponses` moved from the DRAG-6 spec to `dragGesture.ts`, and `placementShown` joins `overflowTree.ts`.
  - **Where the report's proposals went differently:** the test of a layer change clearing the hold was rebuilt, not deleted. A pickup's own 10px nudge reads as depth 4 for the dragged row, not its own 3, so the DRAG-7.11 spec asserts the gap and leaves the depth out.
  - **Mutation checks, each shown failing and then restored:** the carried copy's horizontal clamp removed (DRAG-7.11); a cue that restarts on every sample (DRAG-7.14); the hold ignoring the over-cap state (DRAG-7.21); a release always writing the Card as the parent (DRAG-7.16); a pop that carries the hold over (the unit test); a refused setup create (TC-2.8). Not shown failing, no mutation tried: the pending mark and the modal's box after a release, a no-op release and a cancel (DRAG-7.19), the cue (DRAG-1.34), and the workphase and `isAttached` read (DRAG-7.9).
  - **Checks:** `npm run check` passes. The full `npm run test:e2e` passes with 207 and 8 skipped.
- **2026-10-28, the proposing reconciliation's test follow-ups, second stop (Coder).** The specs the Open cases still lacked, in the same commit as the first stop.
  - **New specs, by case:**
    - **DRAG-7.2:** with `R`'s only attached child dragged, `R` has no overflow row (the modal, pulled out and zoomed back in).
    - **DRAG-7.4:** the tree without `T`, so `B` is Bottom: the states run from the first level to the hidden children's level, and a release at the second level makes the item `A`'s child.
    - **DRAG-7.6:** `R`, whose slot the section shows, comes back in its own slot, and a release there writes nothing.
    - **DRAG-7.10:** a brief excursion out of the modal leaves the drag in it; two stays outside, each shorter than the pop-out delay and together longer, with a return between.
    - **DRAG-7.12:** the classification on the rows of a modal a hold opened, `R1a` Depth-capped and dimmer than `R`.
    - **DRAG-7.16, top edge:** the modal is pulled down to the margin by a list that fills the window, its list scrolls to bring the spot back under the cursor, and the release commits what the ghost showed.
    - **DRAG-7.17, the gap above the row:** with a long run of hidden rows before `R`, so `R`'s first child lies far down the list.
    - **DRAG-7.23:** a failed release in the modal, and a reload that lands mid-drag in it. The modal is open after both, with the rows as the server has them, and the mid-drag reload writes nothing for the drag it stops.
    - **DRAG-7.24:** a click on the overflow row's indent opens the Card's Sheet, and a press on it carries the Card.
    - **DRAG-7.26:** the modal closes when the reloaded board has no Card, and when the Card has no attached descendants.
    - **DRAG-7.27:** a dragged `R` carries its overflow row: the gap after `Q` runs to `T`, the line is never drawn on it, and at the first level `R`'s children show.
    - **DRAG-7.28:** a click on a row in the modal opens no Sheet and writes nothing.
    - **DRAG-7.29:** the line is drawn on the overflow row at one point of the carried copy's sweep across the ghost's middle, and a release there places by gap and depth.
    - **DRAG-7.30:** a level count of 0 in the panel shows one level.
    - **TREE-3.11:** a deep name is cut short at the default width, shows more as the sidebar is dragged wider and all of it at the widest, and a project under the deepest is refused at any width.
  - **Test surface added to the app:** the board's live drop line carries `data-drop-side` (`before`/`after`), as the sidebar's carries `data-drop-line`. DRAG-7.27 and DRAG-7.29 read which row the line is on. The drag layer's `CLAUDE.md` lists it.
  - **Not done, with what was found:**
    - **DRAG-7.13, an item from outside `P`.** A Free Card from `P`'s column zooms into `P`'s Card and on into its section with the real gesture (the context reads `card:` and then `descendants:`). Inside the section, the projection then stays at `0:0:true` wherever the cursor goes, at the entry and after, with the layout settled. I didn't trace whether that is a drag-layer defect or an artifact of how the spec drives it: the Card-zoom specs for it are already skipped for the layout shifting under the cursor (`drag-card-zoom-in.spec.ts`). DRAG-7.13's main drag stays untested; its `B` clause is covered.
    - **DRAG-7.16, left edge,** stays on the geometry's unit test: a cursor can't be brought near it. The top edge could, so the Phase 4 note that it couldn't was wrong.
    - **DRAG-7.10, "bounded by `P`'s box"** at the Card layer: the carried copy there is wider than `P`'s box, and moving the cursor out of it starts the pop-out clock, so the bound can't be read.
    - **DRAG-7.25** (`Planned`) and the failure paths of audit #2's fix: they come with that fix.
  - **Mutation checks, each shown failing and then restored:** a dragged row no longer carrying its overflow row (DRAG-7.27); the modal staying open with nothing left to show (DRAG-7.26, the no-descendants half; the Card-gone half has no mutation); the level count not held to one (DRAG-7.30); the overflow count and the hidden-slot preview both no longer leaving out the dragged child (DRAG-7.2; either alone is enough, so one mutation alone passes); a press on the overflow row's indent no longer reaching the Card (DRAG-7.24). Not shown failing: DRAG-7.4's, 7.6's, 7.10's, 7.12's, 7.17's, 7.23's, 7.28's, 7.29's and TREE-3.11's new specs, and DRAG-7.16's top edge.
  - **Checks:** `npm run check` passes. The full `npm run test:e2e` passes with 224 and 8 skipped.
- **2026-10-28, the audit's Fix Now, batch 1: the hierarchy modal (Coder).** The Architect's batch 1 (The audit's Fix Now, in batches), with the Close-out rows for what `31009c7` fixed.
  - **#2:** `HierarchyModal.tsx` decides once, as it mounts, whether the cursor places it: `placeAt` is the anchor when a drag is running, and none otherwise. `position` and the layout effect both read it, so a mount with no drag centers the modal as a click does. That covers the remount after a board reload (both failure scenarios in the audit, and DRAG-7.25) and an open the drag ended before it committed. `BoardView.tsx` still doesn't clear the anchor.
  - **#36:** a placement with no projection, or no row for the spot, centers the modal (`modalPlacement.ts::centerModal`), warns once, and reports nothing, so the drag keeps the gap and depth it had. The reading derived from the cursor isn't built, as the batch plan says.
  - **#75:** `key={hierarchyModalCard.id}` on the modal, so each open is its own mount. The decision above depends on it: without the key, a modal for another Card would keep the last one's `placeAt`.
  - **#31:** the placement passes `travelingRowsFor(session) ?? (() => false)`, and the modal's own check is gone.
  - **#55:** `itemListOps.ts::EVERY_LEVEL`, read by the modal and by `useBoardDnd.ts::levelsDrawnAt`.
  - **Comments:** #10 (`ModalShell.tsx`'s header and comment), #23's pointer in the modal's header (the half at `sectionEntries` is batch 4's), and #69's line on `HierarchyModalContext.ts`. The drag layer's `CLAUDE.md` now says the decision is made at mount, names `EVERY_LEVEL` and `centerModal`, and lists the modal's placement among the readers of `travelingRowsFor`.
  - **Guard tests:**
    - **DRAG-7.25, two specs in `drag-7-modal-hold.spec.ts`:** one after a release whose write is refused, one after a reload that lands mid-drag. Each first checks that the modal opened away from the window's middle, then that it is centered after the reload. Both failed before the fix, with the modal at the window's corner, 352px off, and pass after.
    - **`HierarchyModal.test.tsx`, new** (jsdom, with the layout stood in for): a mount with an anchor and no drag centers the modal, and a drag that begins afterward doesn't move it (DRAG-7.25), as a click does. It failed before. A hold-opened modal rests the cursor on the row of the ghost's gap, past a dragged item's child that travels with it (DRAG-7.15), which is #31's guard: it passes before and after, since the result is unchanged. #36's two paths center the modal, warn once and report nothing, which failed before.
    - **`modalPlacement.test.ts`:** `centerModal`. **`itemListOps.test.ts`:** `EVERY_LEVEL` is past any depth, and a section drawn at it has no overflow row.
    - **#75 has no test:** the audit finds it unreachable today.
    - **Failure scenario (b),** a release between the hold running out and the mount, isn't timed by a spec, as planned. The component test mounts the modal with no drag running, which is its state.
  - **Mutation checks, each restored:** the modal's `travels` replaced by "nothing travels" fails the DRAG-7.15 component test (the dialog at 142px, not 110px). The DRAG-7.25 specs and the component test's mount and #36 cases were shown failing on the unfixed code. Not shown failing before the code: `EVERY_LEVEL`'s tests, which were written with the constant.
  - **The E2E spec the batch plan asks for under #31 isn't written.** A dragged item's subtree only changes the placement when the item is held below it, a downward hold, and a downward hold hits the defect below. The component test is #31's guard in the meantime.
  - **A defect, not in the audit and not fixed: a hold from above names the wrong gap once the modal opens.**
    - **What happens:** the modal opens as it should, with the item's spot under the cursor and the placement's own reading right, and the carried copy painted under the cursor. Then the next drag-move event names its anchor against the sortable shuffle while the rows are still moving, and the cursor never moves to correct it. The projection ends one or more gaps from the line the modal draws, and a release commits that, not what the modal shows.
    - **Probed** on the overflow tree with a new item `W` first in `P`, held with the same gesture as DRAG-7.15's: below `R`'s overflow row, the section reads gap 6 and the modal 7, with the line before `T`; above it, with a child under `W`, 3 and then 6. From below (an item the hold moves up), it holds: `X` and `B`, the items DRAG-7.15's specs drag, and a probe with a child under `B`. It needs no subtree, and the unfixed `HierarchyModal.tsx` from `31009c7` does the same, so it predates the batch.
    - **Why no spec saw it:** every hold spec drags an item up to the gap.
    - **A fix to try,** in the drag layer: after `readModalPlacement`, keep its reading until the pointer moves. It needs its own test, and then the spec for #31 can be written. See Open questions, For Nathan.
  - **Helpers:** `refuseMoves` and `boardReload` moved from the hierarchy-modal spec to `dragGesture.ts`, for the new specs.
  - **Close-out:** rows for #6, #7, #8, #11, #20, #21, #22 and #26, each checked against the code, since they were fixed in `31009c7`, and for #2, #10 and #31. #23's row waits for batch 4.
  - **Checks:** `npm run check` passes (420 server, 551 client, 185 script tests). The full `npm run test:e2e` passes with 226 and 8 skipped.
- **2026-10-28, the audit's Fix Now, batch 2: the server (Coder).** The Architect's batch 2.
  - **#1:** the deep seed gives each Free item `positionResolver.ts::resolveAppendPosition` over `itemPositionScope.ts::positionScopeFor`, inside its transaction, so Free items are ordered across the workflow as the API orders them. The per-workphase counters are gone. The test asserts positions unique among every Free item, which sit in more than one workphase, and its title says "ordered across the workflow". It failed before, with 5 distinct positions among 6 Free items.
  - **#9:** the seed's test reads `ITEM_DEPTH_CAP` and `PROJECT_DEPTH_CAP`: the project chain reaches the project cap and the item chains go one level past the item cap. The last case asserts the deepest item and project depths the API reads, where it counted projects. The header says the seed writes directly, so no cap holds it. Both caps raised to 13 fail the first case, which the old literal passed.
  - **Beside them in `deepSeed.ts`:** a Free child is typed from level 0, so `F` and `G` are Epics, where they had an attached child's type (the Informational note under #36); the letters comment says the Card is `P` and its title carries no letter (#69). `level` and `nodeLevel` are told apart in `insertNode`'s comment.
  - **#52:** `lib/workflowWorkphases.ts::copyWorkphases` is the one copy: the create route's template and copy branches and the seed call it. It is a module of its own, since `createDefaultBoard` also serves `POST /boards` and the migrations. The route's `startingWorkphases` picks the list, the template first as before. The guards are the template and copy tests with flags added (the template's `isTerminal`; the copy's `triggersNotification` and `isTerminal`), and the seed test's read of the flow template's flags. A helper that drops `isTerminal` fails all three.
  - **#3:** both fields are guarded by `namesARow` (not left out, not `null`) and checked through `getOrNotFound.ts::existsById`, as the project check above them now is (#53's part in this file). `templateId: ''` and `sourceWorkflowId: ''` are a 400 and nothing is created. `null` reads as none. The tests, with no case ID since project-tree §10's cases aren't written: a refusal for each `''`, which failed before (a 201), and a `null` for each, which passed before and guards. `0` and `false` are refused too, where they read as none; no client sends either.
  - **A create that names both** is unchanged, the template taken, and no test pins it: it is the open question For the Architect.
  - **#19:** `move-project.bru`'s doc now says the neighbor the move names is verified, and `prevId` is used when both are named.
  - **Bruno:** `create-workflow.bru` sends `{{templateId}}`, blank in the environment until set, so it is now a 400 until then, as a blank `projectId` is. It gets a docs block saying what the two fields do.
  - **Not taken:** #53's `namesMissingRow` helper for the other routes (optional; the API contract epic's Story 2 moves them to schemas), and the seed's own `node.workphase ?? 'Todo'`, a copy of `resolveCreate`'s rule (#74) that agrees today.
  - **Close-out:** rows for #1, #3, #9 and #19.
  - **Checks:** `npm run check` passes (424 server, 551 client, 185 script tests; `check:docs` clean). The full `npm run test:e2e` passes with 226 and 8 skipped.

## Open questions

- **For Nathan, answered 2026-10-26:**
  - **D2's max:** about 420px, for a 30-character name, as the starting point. The hands-on settles it.
  - **D6:** last child.
  - **D11:** a drag that starts in a modal opened by click works as in a drag-opened one.
  - **D9:** a release in the modal leaves it open, rather than closing it as recommended, so the user can check the drop and redo it. An X or a click outside closes it.
- **For Nathan, from the PO, answered 2026-10-26** (on the PO's recommendations):
  - **D8's hold:** a silent wait, then a cue, as for zooming into a Card.
  - **D9, a Stub whose own slot is hidden:** back in the section, it starts as an item from outside does. The simplest fix, since that start is already built.
- **For the PO:**
  - **D2:** a rule, or a working placeholder under project-tree's Open questions?
    - **Answered (PO):** a working placeholder, beside the sidebar's other controls. Its values are tuned by feel, Nathan wants to try it before deciding more, and collapsing the sidebar comes later. So no test cases come from it. The PO writes it in once Phase 1 builds it, since the entry describes what exists.
  - **D4:** the placeholder's wording.
    - **Answered (PO):** "1 child" or "N children". Not "See N children": during a drag the row opens by a hold, not a click. The wiki calls it an overflow row, since "placeholder" already names the placeholder Stub (wiki board-drag-interaction §6.1) and working placeholders.
  - **Hierarchy-placement §1** depends on nothing being missing between Top and Bottom. Does D5's placeholder, which stands in for R's children and takes no child, need a sentence there, or only in board-drag-interaction §7.1?
    - **Answered (PO):** only §7.1. The shared page leaves how a surface shows the gap to the surface, as project-tree §1 handles collapsed projects on its own page.
  - **From the Test Planner's cases, each `Pending PO` with its lean in the case:**
    - **DRAG-7.21:** does the hold that opens the modal run in an over-cap state beside an overflow row? §7.3 sets no condition, and a Card's zoom-in never starts on an invalid target (§6.1). The Test Planner leans no: every placement among `R`'s children is at that level, so the modal would offer nothing valid that the section doesn't.
    - **DRAG-7.22:** what does a drag started from an overflow row pick up? The row isn't an item. The Test Planner leans nothing, since it's a control, though it could pick up its Card.
    - **DRAG-7.23:** what does a board reload do to an open modal, mid-drag (§10 stops the drag) or after a failed release in it? The Test Planner leans: it stays open on the reloaded hierarchy while its Card still has attached descendants, and closes otherwise.
    - **Answered 2026-10-27 (Nathan, on the PO's recommendations):**
      - **DRAG-7.21:** the lean. The hold doesn't run in an over-cap state (wiki board-drag-interaction §7.3).
      - **DRAG-7.22:** the lean, for a press on the row's count. A press on the row's indent is the Card's, as beside a Stub row (wiki board-drag-interaction §9).
      - **DRAG-7.23:** the lean, with one change: the modal is centered after a reload, not left where it was, since a hold-opened modal's placement came from a drag that has ended. The centering is Planned (wiki board-drag-interaction §9).
  - **From the Test Reconciler's proposing run** (`docs/audits/test-reconciliation-epic-3-5-story-7.md`, Candidate New Cases), via the Test Planner: `POST /workflows` takes `templateId` and `sourceWorkflowId`, which name rows, and audit #3 found `''` read as none there. Wiki row-references §1 refuses that, but says each feature's page names its own references, and no page names these two, so no catalog has a case for them. Which page should name them as references?
    - **Answered 2026-10-27 (PO):** project-tree §10, beside the rule that `POST /api/workflows` gives a project its workflow. It names both as references, says each copies its row's workphases, and that leaving both out makes a workflow with no workphases. TREE's catalog takes the cases. What a create naming both does is left out until the Architect says (For the Architect).
- **For Nathan, from Phase 5:**
  - **The cap's value.** Both constants are 12 as built, a starting value: the depth the deep seed goes to, and one line each to change. D1 has the pick settled in the hands-on, at least 10. The specs hold at 10, 12 and 15 (Amendments, Phase 5).
    - **Answered 2026-10-27:** 12, for both (Amendments).
  - **The sidebar's widest width** was sized for a 10th-level name (D2). At 12 levels, a 30-character name starts 214px in and needs about 450px, so it is cut off at 420px. Whether the maximum follows the cap, or a long name at the deepest level may be cut, is part of the same hands-on.
    - **Answered 2026-10-27:** a long name at the deepest level may be cut. Widening the sidebar is how it's read, and the maximum stays 420px (Amendments).
- **For Nathan, from the test follow-ups:**
  - **Does a Free Card that has zoomed into a section follow the cursor there?** The spec for DRAG-7.13's main drag found the ghost stuck at the section's top (`0:0:true`) once a Free Card from the same column had zoomed into `P` and on into its section (Amendments, 2026-10-28, second stop). Dragging the deep stack's "Free Card to drag in" onto a Card and into its section by hand settles whether that is the spec's doing or a defect. If it is a defect, it also bears on DRAG-1.21 and DRAG-4.1, which have no passing spec either.
- **For Nathan, from the Fix Now batch 1:**
  - **A hold from above opens the modal with the projection a gap or more off the line the modal draws** (Amendments, 2026-10-28, batch 1). It predates the batch and the audit didn't find it, so it is outside the batch's list. The wiki rule is board-drag-interaction §7.3's: the modal opens with the ghost's spot under the cursor, so a release right after commits that placement. By hand: pick an item above `R`'s overflow row, hold it just below the row until the modal opens, and let go without moving. It should write the placement the modal shows, and by the probes it writes one gap further down.
  - **Fix it in this story,** as a batch of its own after the modal's, or route it? The fix I'd try, untried, is to keep the placement's reading until the pointer moves. It is in the drag layer's core and needs its own test. It would also let the E2E spec for audit #31 be written. Or it goes to the next story that reworks the drag layer, with the spec held until then.
- **For the Architect:**
  - **Root `CLAUDE.md`, "Running the App":** it could list the deep stack: `npm run seed:deep` and `npm run dev:deep` in `server/`, and `npm run dev:deep` in `client/`, for a database of 12-level trees on ports 3003 and 5175 (Amendments, Phase 2).
  - **From the PO, for wiki project-tree §10:** what does `POST /api/workflows` do when it names both `templateId` and `sourceWorkflowId`? Is it refused, or is one of them taken, and which? The wiki says nothing about it until then (For the PO).
- **For the Test Planner:**
  - **Phase 0's Planned passages are written** (Scope). They're ready for cases. The Open question "Whether a Card shows its whole hierarchy" is deleted, since §9 answers it.
    - **Done 2026-10-26 (Test Planner):** the cases are in Scope. Three edges the passages leave open are `Pending PO` (For the PO).
  - E7's specs, in Phase 5.
    - **Done 2026-10-27 (Coder).** The specs are adjusted (Amendments, Phase 5).
  - **Phase 5's check of att-4 and any case built on a chain of 6:** the Coder found no literal 6 in a case. ATT-4, TREE-1.x, TREE-3 and DRAG-2 are written against `CAP`, `PCAP` and the cap the board reports, and DRAG-7's terms say `CAP` is deep enough for the states a case names. The Test Planner confirms.
    - **Confirmed 2026-10-27 (Test Planner):** no case holds a literal 6 or a chain sized by one. The fixed depths left are ATT-4.6's root and leaf (`1 + 1 + 0 = 2`), and TREE-1's and TREE-3.8's project `M` at depth 3 with a subtree height of `PCAP` or more. Both hold at any cap of 10 or more.
  - **The PO's rulings are in the wiki** (Amendments, 2026-10-27), for the Test Planner's pass:
    - DRAG-7.21–7.23 are answered (For the PO). DRAG-7.23's then-clause changes: the modal is centered after the reload, not left where it is.
    - New rules with no case yet: the hold resets when the cursor leaves the section (board-drag-interaction §7.3); the modal's header is inside its box for the pop-out clock (§7.3, which DRAG-7.10's spec already covers); a dragged `R` carries its overflow row (§9); a click on a row in the modal opens nothing (§9); the modal closes when its Card is gone or has no attached descendants left (§9).
    - The project-tree §3 example now runs to `P11`, and a narrow sidebar cutting deep names short is a rule (§3).
    - **Done 2026-10-28 (Test Planner):**
      - **Statuses:** DRAG-7.1–7.19 and DRAG-1.34 `Planned` → `Open`, and DRAG-7.20 `Manual`.
      - **The rulings:** DRAG-7.21–7.23 are `Open`, with the leans written in. DRAG-7.22 is narrowed to the count, and a press on the indent is a new case, DRAG-7.24. DRAG-7.23 no longer says where the modal sits. The centering after a reload is DRAG-7.25, `Planned`.
      - **New cases for the new rules:**
        - the modal closing when its Card is gone or has no attached descendants, DRAG-7.26;
        - a dragged `R` carrying its overflow row, DRAG-7.27;
        - a click on a row in the modal opening nothing, DRAG-7.28;
        - the overflow row as the side highlight's neighbor (§7.1), DRAG-7.29;
        - `sectionLevels` at least 1 (§9), DRAG-7.30;
        - the narrow sidebar (project-tree §3), TREE-3.11.
      - **Folded into existing cases:** the hold resetting when the cursor leaves the section, as a third reset in DRAG-7.14 (its spec already asserts it under that ID). The header inside the modal's box goes in DRAG-7.10. The carried copy held to the modal's list goes in DRAG-7.11.
      - **The suite's terms:** `X` is any childless item at `P`'s Descendants layer, a Free Card zoomed in or a Stub of `P`'s outside the tree, since placement there is the same for both. DRAG-7.13 now names a Free Card from outside `P` for its main drag, so that its two origins stay distinct.
      - **The cap at 12:** no case changes. ATT-4's and TREE-3's terms no longer say the value is open. They still name it by `CAP` and `PCAP`.
  - **A hold from a row above the target** (Open questions, For Nathan, from the Fix Now batch 1): DRAG-7.15's text covers it, since a release right after the modal opens commits what the modal shows, but every hold spec drags an item up to the gap, so none drives it. Once it is fixed, a spec for it, or a clause in the case naming the direction, is the Test Planner's call.
  - **Project-tree §10 names a workflow create's two references** (For the PO), ready for cases: what each copies, what leaving both out makes, and the refusal of one that names no row, `''` included (wiki row-references §1). The `''` refusal is audit #3's fix, so its test comes with that batch.
    - **Done 2026-10-28 (Coder, Fix Now batch 2):** the tests are in `server/tests/routes/workflows.test.ts` without IDs, until the cases are written: a refusal for each `''`, and a `null` for each read as none. A create that names both is not tested (For the Architect).

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
  - **Phase 2, the overflow row:**
    - It is no drag source, so a drag started on it picks up nothing (DRAG-7.22's lean, which Phase 3 made true), and a click on it opens the modal.
    - A dragged Stub at the last shown level takes its overflow row with it: the row stays drawn under it and is never named as a neighbor, as the Stub's other descendants aren't.
    - The live drop line can be drawn on an overflow row, when the row is the named neighbor.
    - The level count the panel takes is read as a whole number of at least 1.
    - The overflow row's look is a muted count in a Stub-sized row, a placeholder look.
  - **Phase 3, the hierarchy modal:**
    - The modal's header, with its title and X, is inside the layer's box (Phase 4 corrected Phase 3's note): a cursor over it is still in the modal, and the pop-out clock doesn't run. The carried copy is clamped to the list.
    - A click on a row in the modal opens nothing. Opening the Sheet from it needs the modal to give way to the panel, or the panel to draw above it.
    - The modal closes when its Card is gone or has no attached descendants left (DRAG-7.23's lean).
    - The overflow row's press is the Card's no more: a press on it neither starts the Card's drag nor opens the Sheet (DRAG-7.22's lean).
  - **Phase 4, the hold and the placement under the cursor:**
    - The hold runs only with the cursor inside the section's box, and not in an over-cap state (DRAG-7.21's lean). Both are beyond §7.3's wording.
    - The cue is a Card zoom-in's cue on the overflow row, a placeholder look; the dwell and the cue start at a Card zoom-in's 500 and 800 ms.
    - A modal shifted at a window edge reads a gap and a depth of its own from the cursor, which can put the ghost anywhere in the list, including a level deeper than the hold's (§7.3 says so).
    - The ghost's row slides into its slot in the modal for about 200 ms after it appears, as a row does between gaps. Whether that reads as the ghost jumping is DRAG-7.20's hands-on.
  - **Phase 5, the cap:**
    - The value is Nathan's pick (D1); 12 is what was built in until he makes it. The PO writes the picked number.
    - At the default sidebar width the deepest levels of a deep project tree draw no name: at 12 levels a name has about 26px. The sidebar's resize handle is the way to read them (D2), and its maximum was sized for a 10th-level name (Open questions, For Nathan).
- **Planned passages now built:**
  - **Fix Now batch 1:** board-drag-interaction §9's sentence that after a reload a modal a hold opened is centered, as one a click opens is (DRAG-7.25).
  - **Phase 4:**
    - board-drag-interaction §7.3's hold, its placement under the cursor, the scroll of a long list, the shift at a window edge, opening again in the same drag, and §3.1's two hold values;
    - §9's hold beside an overflow row opening the modal;
    - item-attachment §12's hold half.
  - **Phase 3:**
    - board-drag-interaction §7's hidden slot, and §7.3 but its hold: the modal's bounds, its rows' classification, a release placing by gap and depth, leaving it as the pop out of Descendants, and staying open after a drag ends in it;
    - §9's click on an overflow row opening the modal, centered, and its closing by the X, a click outside it or Escape (Escape cancelling the drag instead during one), and the modal showing a Card's whole hierarchy;
    - item-attachment §12's modal half.
  - **Phase 2:**
    - board-drag-interaction §3.1's level count (the hold's dwell and cue are still Planned);
    - §7.1's overflow row gaps, all but "anywhere else among `R`'s children is the hierarchy modal's";
    - §9's set number of levels, the overflow row and its count;
    - item-attachment §12's Planned bullet on a Card showing a set number of levels (the modal half stays Planned).
- **Passages superseded** *(expected)*:
  - board-drag-interaction §9's "at every level", and §7's "in its own slot", for a Stub whose slot is hidden (the Open question "Whether a Card shows its whole hierarchy" went in Phase 0);
  - item-attachment §8's grounding for 6, which names the hierarchy modal, and its Open question "`CAP`'s real value";
  - project-tree's Open question "The project cap's real value".
- **Passages that name 6, once the value is picked** (Phase 5, found by searching the wiki, the test plans and the planning docs):
  - **The wiki (PO):**
    - **item-attachment §8:** "`CAP` is provisionally 6", and the paragraph "Grounding for the provisional 6", whose sidebar arithmetic (240px, a depth-6 row leaving about 158px, depth 8 about 130px) is for the PO to redo against the picked value and the resizable sidebar.
    - **project-tree §3:** "is provisionally 6, the depth the sidebar can indent legibly", and the example "with the cap at 6" (`P1` to `P5`, a move under `P4` but not `P5`), whose numbers follow the cap.
    - **The two Open questions** on the cap's real value (item-attachment's and project-tree's), already expected above.
  - **The test plans (Test Planner):** none. No case holds a literal 6 (Open questions, For the Test Planner).
  - **The planning docs,** which the closing checklist doesn't list, so they need an owner when the value is picked: `mvp-roadmap.md`'s Projects and Work Items lines ("provisionally 6", "Story 7 sets it"), `epic-3-5-roadmap.md` (the A5d paragraph, "provisionally 6, like the item cap") and `epic-8-decisions.md` ("A5d plans that cap, provisionally 6").
- **Implementation passages to place:**
  - **The sidebar's width (D2), built in Phase 1,** a working placeholder beside the sidebar's other controls in project-tree's Open questions. What exists:
    - a handle on the sidebar's right edge, dragged with the pointer;
    - 240px by default, held between 120px and 420px;
    - kept in the browser, per viewer, stored when the drag ends and read at load, where a stored width outside the limits is pulled inside them;
    - no keyboard control and no reset gesture.
  - **The section's cut-off and the overflow row (Phase 2),** placed in the module headers of `descendantsProjection.ts`, `itemListOps.ts` and `StubRows.tsx`, in the site comments of `dragCollision.ts` and `KanbanCard.tsx`, and in the drag layer's `CLAUDE.md` (the mental model, the concerns, "one way to do each of these", and the test surfaces).
- **Test-plan cases affected:**
  - **Fix Now batch 1:**
    - DRAG-7.25 has two E2E specs in `tests/ui/drag-7-modal-hold.spec.ts` (after a release whose write is refused, and after a reload that lands mid-drag), which carry the ID, and a component test in `client/src/components/HierarchyModal.test.tsx` for a mount with no drag. The mid-drag half sets up as DRAG-7.23's does.
    - DRAG-7.15's and DRAG-7.25's IDs are also on `HierarchyModal.test.tsx`'s placement cases and `modalPlacement.test.ts`'s `centerModal`.
  - **Phase 5:**
    - DRAG-2.1 to DRAG-2.4, DRAG-2.7 and DRAG-2.10's spec shows every level its chain reaches (the section depth seeded to the cap), where the chain's deepest rows would otherwise sit behind an overflow row and carry no state to read. The cases are unchanged.
    - DRAG-7.9's over-cap spec rests the cursor at the lower edge of the list's last row, not a quarter up from it, so the last gap is reached whatever the cap.
    - TREE-3.7's spec seeds the widest sidebar, so the deepest names have room to be seen.
    - The page object's `projectName` matches the whole name now, so `P1` is not also `P10`.
  - **Phase 4:**
    - DRAG-7.13 to DRAG-7.18 have E2E specs in `tests/ui/drag-7-modal-hold.spec.ts`, which carry their IDs. They seed short values for the dwell and the cue and assert the stages and what a release writes, never that the values feel right.
    - DRAG-7.14's third clause, the carried copy moving within the gap, is asserted by the cue running on across moves that cross the ghost's middle, and by the projection's unit test that both neighbors name one target.
    - DRAG-7.16 is asserted at the bottom, right and top edges. The left edge is covered by the geometry's unit test only, since a cursor can't be brought near it.
    - DRAG-7.17 is asserted by the list's scroll and a release, from the gap below the overflow row and from the one above it.
    - DRAG-7.20 stays `Manual`: it is Nathan's hands-on.
    - DRAG-1.34's hold half is asserted through the panel: the fields, the next hold taking the new dwell, and a reload keeping them.
    - A ghost in an over-cap state beside an overflow row starts no hold: DRAG-7.21's spec, which carries the ID now that the PO has ruled it.
    - The header counts as part of the modal for the pop-out clock (DRAG-7.10's box): a spec in `tests/ui/drag-7-hierarchy-modal.spec.ts`, which carries DRAG-7.10.
  - **Phase 3:**
    - DRAG-7.6 to DRAG-7.12 and DRAG-7.19 have E2E specs in `tests/ui/drag-7-hierarchy-modal.spec.ts`, which carry their IDs. DRAG-7.7 is the click, and its two clauses on `P`'s size and look are open and not asserted. DRAG-7.9's over-cap state is built from the cap the board reports. DRAG-7.12 is asserted on the modal's rows under a drag of an item with a child. DRAG-7.10's two pops are timing-driven, as the section's are.
    - DRAG-7.2's dragged-child clause is asserted by DRAG-7.6's spec: the overflow row reads "1 child" meanwhile.
    - A press and drag from an overflow row's count picks nothing up, and a click on it opens the modal and not the Sheet: DRAG-7.22's spec, which carries the ID now that the PO has ruled it.
    - Not yet reachable: DRAG-7.13 to DRAG-7.18 and DRAG-7.20 (the hold), and DRAG-7.21 and DRAG-7.23 (`Pending PO`).
  - **Phase 2:**
    - DRAG-7.1 to DRAG-7.5 have E2E specs in `tests/ui/drag-7-overflow-row.spec.ts`, which carry their IDs. They drive `X` as a Stub of `P` picked up in its own section, which starts at the Descendants layer with no pop, where the cases name a Free Card zoomed in. Placement there is the same for any item at the layer. DRAG-7.2's dragged-child clause waits for Phase 3.
    - DRAG-1.34's panel half, the level count, is asserted through the panel and a reload, and its hold values are Phase 4's.
    - DRAG-4's tree and DRAG-5.13's pass unchanged (Scope).
- **Wiki sections added, changed, moved or removed** (PO, at close):
  - **Written 2026-10-27.** No section added, moved or removed, and no number changed.
  - **board-drag-interaction:**
    - §3.1: the three new tuning values join the panel's list, with the hold's two values. Marker off.
    - §7: the hidden slot, marker off, and the "in its own slot" it replaced narrowed to a slot the section shows.
    - §7.1: the overflow row's gaps, marker off. The overflow row can be the side highlight's neighbor.
    - §7.3: markers off. New: the hold needs the cursor inside the section, and doesn't run in an over-cap state (DRAG-7.21); the modal's box includes its header, and the carried copy is held to its list.
    - §9: markers off, and "at every level" deleted. New: `sectionLevels` is at least 1; a dragged `R` carries its overflow row; the overflow row is a control (DRAG-7.22); a click on a row in the modal opens nothing; the modal closes when its Card is gone or has no attached descendants; a reload leaves it open (DRAG-7.23), with the centering after a reload Planned.
    - Open questions: the hold's cue borrows the zoom-in's look; the overflow row's and the modal's placeholder looks; new, opening a Sheet from the modal.
  - **item-attachment:** §8, `CAP` is 12, with its grounding rewritten; §12, the levels bullet's marker off. Open questions: "`CAP`'s real value" deleted, and "Beyond the cap" reworded.
  - **project-tree:** §3, the project cap is 12, the sidebar's width doesn't limit it, and the example runs to `P11`. Open questions: "The project cap's real value" deleted, and the sidebar's width added as a working placeholder. §10, a workflow create's `templateId` and `sourceWorkflowId` named as references (For the PO).
  - **Planning docs:** `mvp-roadmap.md`, `epic-3-5-roadmap.md` and `epic-8-decisions.md` no longer say "provisionally 6".

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
  - DRAG-7.1–7.20, a new suite for the overflow row and the hierarchy modal (wiki board-drag-interaction §7, §7.1, §7.3 and §9), all `Planned`. DRAG-7.20 is the hold's feel, `Manual` once built.
  - DRAG-1.34, the new tuning values (§3.1), `Planned`.
  - DRAG-7.21–7.23, `Pending PO` (Open questions, For the PO).
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

## Code map

*What's expected, by the Architect. The Coder corrects it as built.*

| Symbol | Carries |
|---|---|
| `server/src/lib/itemTree.ts::ITEM_DEPTH_CAP`, `PROJECT_DEPTH_CAP` | D1: the value picked in Phase 5 |
| `client/src/components/ProjectSidebar.tsx`, `sidebar/useSidebarResize.ts`, `sidebar/sidebarWidth.ts` | D2: the aside takes the width; its list scrolls in a box inside it, so the handle on the aside's right edge stays put. The hook is the handle's pointer handlers, and the module holds the default, the limits and the storage |
| `client/src/components/workflow/dragTuning.ts::DragTuning`, `client/src/components/DragTuningPanel.tsx` | D3's section depth, as `sectionLevels` (default 3), with its panel field; E3's hold comes with Phase 4 |
| `client/src/components/workflow/itemListOps.ts::sectionEntries`, with `shownLevels`, `overflowRowId` and `overflowOwnerOf`, beside `hierarchyRows` | D3–D5, E1: the rows the section draws, an overflow row under each last-level row that has attached children. The render and the drop math both read the level count through `shownLevels` |
| `client/src/components/StubRows.tsx::OverflowRow` | D4: the overflow row. It is no drag source, carries `data-overflow-row` and no `data-item-id`, and does nothing on a click until Phase 3 |
| `client/src/components/KanbanCard.tsx` | D3, D4: the section's render, through `sectionEntries`; E2: no registration while the modal is open (Phase 3) |
| `client/src/components/workflow/dragCollision.ts` (row data) | E1: the row role `'overflow'`, with `isOverflowRow` and `isSectionRow` (a collision candidate in a section, no Card-layer target, a Stub row's ghost height), and `travelingRowsFor` stepping past the overflow row of a traveling row |
| `client/src/components/workflow/descendantsProjection.ts` | D5, D6, E1: `gapForAnchor`, which turns an overflow-row neighbor into the gap among all the rows, and the depth clamp, handed to the shared library as a number; E3: what the hold keys on; E5: the modal's depth reading |
| `client/src/lib/hierarchyPlacement.ts::computeProjection` | E1's clamp as an optional `maxDepth`, the deepest state a surface offers when it draws fewer levels than its rows hold. The sidebar passes none, and the library never sees an overflow row |
| `client/src/components/workflow/popSession.ts` | E3: the hold that opens the modal |
| `client/src/components/workflow/dragStructure.ts` | E2, E3: the modal as the Descendants region |
| the modal component, and `client/src/components/ModalShell.tsx` if it's shared | D7, D9–D11: its rows, its placement under the cursor, its centered form |
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
    - **The overflow row** sits one level under each last-level row with attached children, reads "1 child" or "N children", and slides with the rows. It is no drag source and does nothing on a click until Phase 3.
    - **Where the drop math differs from the plan's wording:** E1 puts the clamp in the projection. It lives there, as the number `computeProjection` takes (`maxDepth`), so the shared library still never sees an overflow row.
  - **The dragged child left out of N** is built and unit-tested, and no spec reaches it until Phase 3, since a hidden row can't be picked up from the section.
  - **Checks:** `npm run check` passes (420 server tests, 504 client, 185 script), and `npm run test:e2e` passes with 179 and 8 skipped.

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
- **For the Architect:**
  - **Root `CLAUDE.md`, "Running the App":** it could list the deep stack: `npm run seed:deep` and `npm run dev:deep` in `server/`, and `npm run dev:deep` in `client/`, for a database of 12-level trees on ports 3003 and 5175 (Amendments, Phase 2).
- **For the Test Planner:**
  - **Phase 0's Planned passages are written** (Scope). They're ready for cases. The Open question "Whether a Card shows its whole hierarchy" is deleted, since §9 answers it.
    - **Done 2026-10-26 (Test Planner):** the cases are in Scope. Three edges the passages leave open are `Pending PO` (For the PO).
  - E7's specs, in Phase 5.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
  - **Phase 2, the overflow row:**
    - It is no drag source, so a drag started on it picks up nothing (DRAG-7.22's lean). It does nothing on a click until Phase 3 builds the modal.
    - A dragged Stub at the last shown level takes its overflow row with it: the row stays drawn under it and is never named as a neighbor, as the Stub's other descendants aren't.
    - The live drop line can be drawn on an overflow row, when the row is the named neighbor.
    - The level count the panel takes is read as a whole number of at least 1.
    - The overflow row's look is a muted count in a Stub-sized row, a placeholder look.
- **Planned passages now built:**
  - **Phase 2:**
    - board-drag-interaction §3.1's level count (the hold's dwell and cue are still Planned);
    - §7.1's overflow row gaps, all but "anywhere else among `R`'s children is the hierarchy modal's";
    - §9's set number of levels, the overflow row and its count;
    - item-attachment §12's Planned bullet on a Card showing a set number of levels (the modal half stays Planned).
- **Passages superseded** *(expected)*:
  - board-drag-interaction §9's "at every level", and §7's "in its own slot", for a Stub whose slot is hidden (the Open question "Whether a Card shows its whole hierarchy" went in Phase 0);
  - item-attachment §8's grounding for 6, which names the hierarchy modal, and its Open question "`CAP`'s real value";
  - project-tree's Open question "The project cap's real value".
- **Implementation passages to place:**
  - **The sidebar's width (D2), built in Phase 1,** a working placeholder beside the sidebar's other controls in project-tree's Open questions. What exists:
    - a handle on the sidebar's right edge, dragged with the pointer;
    - 240px by default, held between 120px and 420px;
    - kept in the browser, per viewer, stored when the drag ends and read at load, where a stored width outside the limits is pulled inside them;
    - no keyboard control and no reset gesture.
  - **The section's cut-off and the overflow row (Phase 2),** placed in the module headers of `descendantsProjection.ts`, `itemListOps.ts` and `StubRows.tsx`, in the site comments of `dragCollision.ts` and `KanbanCard.tsx`, and in the drag layer's `CLAUDE.md` (the mental model, the concerns, "one way to do each of these", and the test surfaces).
- **Test-plan cases affected:**
  - **Phase 2:**
    - DRAG-7.1 to DRAG-7.5 have E2E specs in `tests/ui/drag-7-overflow-row.spec.ts`, which carry their IDs. They drive `X` as a Stub of `P` picked up in its own section, which starts at the Descendants layer with no pop, where the cases name a Free Card zoomed in. Placement there is the same for any item at the layer. DRAG-7.2's dragged-child clause waits for Phase 3.
    - DRAG-1.34's panel half, the level count, is asserted through the panel and a reload, and its hold values are Phase 4's.
    - DRAG-4's tree and DRAG-5.13's pass unchanged (Scope).
- **Wiki sections added, changed, moved or removed** (PO, at close):

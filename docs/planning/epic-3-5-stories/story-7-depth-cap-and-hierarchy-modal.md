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
- **Free descendants in the section or the modal** (D7).

## Scope

- **Wiki passages:** *(PO, once D2–D11 are written in as Planned)*
- **Test-plan cases:** *(Test Planner, once the passages exist)*

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
- Below a row at the last shown level (call it R) whose children are hidden, the section draws one placeholder row, "N children", one level under R.
- N is R's direct children. That they can have children of their own, and why they're hidden, should read as self-evident: a Card can show only so much.

**D5. R and its placeholder are one block.**
- In the section's shuffle, the ghost goes above R or below its placeholder, never between them.
- If the placeholder were an ordinary row, the gap between R and it would mean "R's first child" and the gap below it "R's last child". That's two precise spots, and precise placement among R's children belongs to the modal (D6).

**D6. A drop in the section can go one level deeper than the section shows,** as R's last child.
- **Below R's placeholder,** at the level under R, the item lands as R's last child, and the placeholder's count goes up by one.
- **Under a last-level row with no children,** the item becomes its only child, and the section then draws it as a new placeholder.
- **Placing precisely among R's children** takes the modal.
- **Last, not first:** a ghost drawn after "N children" reads as coming after them, and the Card layer's auto-drop is last child too.

**D7. The modal shows a Card's whole hierarchy:**
- **The set:** the same set the section draws, the Card's attached descendants, at every level, with the Card as the root. Free descendants stay out, as they do from the section: they show on the board as Cards of their own.
- **Why that set** (Nathan): it's consistent with what the section does today. `positioning-on-create-and-edit.md` may later change which children a parent shows.

**D8. How it opens:**
- **By click** on a placeholder when no drag is running.
- **By hover** over a placeholder during a drag, past a hold. That works for any item that has reached the Descendants layer, including a Free Card that zoomed in.

**D9. During a drag, the modal is the Card's Descendants layer, drawn whole.** While it's open:
- **Which rows count:** the modal's box bounds the layer, and the cursor and the ghost are read against the modal's rows. The Card's box and its section, under the backdrop, take no part.
- **What a release does:** it places the item by gap and depth among the Card's descendants, as in the section (wiki board-drag-interaction §7). An over-cap tab state is reachable and commits nothing.
- **Leaving it:** pulling away past the pop-out threshold is the usual Descendants → Card pop. The modal closes, and the drag is at the Card layer, so detaching still takes two pops.

  The alternative, a layer of its own below Descendants, would drop the drag back into the section first. That's three pops to leave, and the first lands somewhere that shows less than the modal.
- **After the drag ends in it,** by a release or a cancel, the modal stays open, where it opened. The user gets a moment to check where the item landed, and can pick it back up if it's wrong (D11). A write still in flight shows in the modal as it would in the section (wiki board-drag-interaction §10).

**D10. Where it opens during a drag: under the cursor.**
- **Placement:** the modal is placed so that the spot the ghost would take among R's children (R's last child, D6) sits under the cursor, so the ghost stays in about the same place.
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
- D5's block rule lives where the named anchor becomes a gap, the way `travelingRowsFor` steps past a dragged subtree.
- The release's anchors come from the board's full data: the board has every row, and only the drawing is cut.

**E2. One drag registration per item, and one element per region.**
- **The rows:** while the modal is open, the Card's section rows don't register with dnd-kit. The modal's rows register through `dragChrome.tsx::useItemRow`, as the section's do. Two rows registered under one item id would break the shuffle.
- **The region:** the modal carries the Card's Descendants region key (`descendantsRegionKey`) while it's open, and the section drops it. So `dragStructure.ts` finds one element for the key. The region's `parentRegionKey`, the Card, makes pulling away land at the Card layer with no new pop rule.

**E3. Opening the modal isn't a layer change.**
- **The pop machine:** the context key stays the Card's Descendants. What changes is the structure, which `dragStructure.ts` re-resolves after the switch as it does after a remount, and the projection's seed (E5).
- **The hold:** it's a new clock in `popSession.ts`, with the other clocks, and a new tuning value starting at the Card zoom-in's.
- **Naming the placeholder:** start with the mechanism that names a Card to zoom into, the ghost's neighbor (wiki board-drag-interaction §6.1). The section shuffles like a column, and that mechanism already handles rows moving under a cursor that hasn't moved. Phase 4's hands-on settles it.

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
  - the block rule;
  - the drop one level past the shown levels.

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
| `client/src/components/ProjectSidebar.tsx` | D2: the width and its handle |
| `client/src/components/workflow/dragTuning.ts::DragTuning` | D3's section depth; E3's hold |
| `client/src/components/workflow/itemListOps.ts::hierarchyRows` (or a function beside it) | D3–D5, E1: the visible rows and the placeholders |
| `client/src/components/StubRows.tsx` | D4: the placeholder row |
| `client/src/components/KanbanCard.tsx` | D3, D4: the section's render; E2: no registration while the modal is open |
| `client/src/components/workflow/descendantsProjection.ts` | D5, D6, E1: the block rule and the one-deeper drop; E5: the modal's depth reading |
| `client/src/components/workflow/popSession.ts` | E3: the hold that opens the modal |
| `client/src/components/workflow/dragStructure.ts` | E2, E3: the modal as the Descendants region |
| the modal component, and `client/src/components/ModalShell.tsx` if it's shared | D7, D9–D11: its rows, its placement under the cursor, its centered form |
| the deep seed (a dev script; its home is the Coder's call) | D13 |

## Amendments

## Open questions

- **For Nathan, answered 2026-10-26:**
  - **D2's max:** about 420px, for a 30-character name, as the starting point. The hands-on settles it.
  - **D6:** last child.
  - **D11:** a drag that starts in a modal opened by click works as in a drag-opened one.
  - **D9:** a release in the modal leaves it open, rather than closing it as recommended, so the user can check the drop and redo it. An X or a click outside closes it.
- **For the PO:**
  - **D2:** a rule, or a working placeholder under project-tree's Open questions?
  - **D4:** the placeholder's wording.
  - **Hierarchy-placement §1** depends on nothing being missing between Top and Bottom. Does D5's block rule need a sentence there, or only in board-drag-interaction §7.1?
- **For the Test Planner:** E7's specs, in Phase 5.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:**
- **Passages superseded** *(expected)*:
  - board-drag-interaction §9's "Not settled", and its Open question "Whether a Card shows its whole hierarchy";
  - item-attachment §8's grounding for 6, which names an "expanded-hierarchy modal", and its Open question "`CAP`'s real value";
  - project-tree's Open question "The project cap's real value".
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Wiki sections added, changed, moved or removed** (PO, at close):

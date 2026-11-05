# Epic 3.5 Story 8.13 — The hierarchy modal opens a Stub's Sheet, and a create stops at the cap

**Type:** story · **Written:** 2026-11-04 by the Architect, from Nathan's manual testing · **Status:** planning

## Goal

Two small fixes Nathan found in manual testing (2026-11-04):
- **A click on a Stub in the hierarchy modal opens its Sheet,** as a click on a Stub in a Card's section does. The modal stays open under the Sheet, and closing the Sheet returns to it.
- **A create stops at the depth cap.** At a parent the cap allows no child under, the three controls that create a child show disabled, saying why:
  - "Add subproject" on a sidebar row;
  - "Add subproject" on a project's Overview tab;
  - the add-child "+ Add" in an item's Sheet.

**What happens today:**
- **A click on a row in the modal opens nothing** (wiki board-drag-interaction §9, and its Open question "Opening a Sheet from the hierarchy modal"). The rows can already take a click: `StubRows.tsx::AttachedChildRow` calls `onCardClick`, but `HierarchyModal.tsx` passes `SectionRows` none.
- **The three create controls are always offered.** At the cap the API refuses the create (wiki project-tree §3, item-attachment §8), so the user picks a name or title and then gets a refusal.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"). The Coder builds it, and Nathan tries it hands-on. The PO and the Test Planner write the docs after he approves. Neither fix is a drag, so the specs and unit tests it adds are ordinary ones, not the new drag tests Story 8 holds back.

**A spec the story breaks is fixed here, never skipped** (Nathan, 2026-11-04). Story 8 skipped such specs because the next change to the gesture would likely break them again. 8.13 leaves the drag's behavior alone, so that reason doesn't hold, and Story 10 inherits no skip from it.

**When it runs:** after the fixes from the audit and reconciliation of Stories 8.8, 8.11 and 8.12 (`stories-8-8-8-11-8-12-fixes.md`). Both phases touch files those stories changed: `HierarchyModal.tsx` and `BoardView.tsx` (8.8), `App.tsx`, `lib/hierarchy.ts` and `SortableProjectRow.tsx` (8.11, 8.12).

**Out of scope:**
- **The Done-column report:** a Stub pulled out of a Card couldn't be moved straight to the Done column. Dropped for now (Nathan, 2026-11-04). Neither Nathan nor the Architect could reproduce it.
  - **The Architect's probe:** a throwaway spec on the test servers, since deleted, moved a Stub straight into Done:
    - on the flow and quick workflows;
    - with Done empty and with a Card in it;
    - for a direct child and for an item detached earlier.
  - **The one near miss, a lead if it comes back:** a Stub's drag pops out twice before a column's band means anything, out of its Card and then out of its column. At the default timings that's about 1s of rest. A release before the second pop lands the Stub in its own column, as a detach in place.
- **The parent pickers.** The Sheet's and the Overview tab's parent selectors apply no cap either, so they can offer a parent the API refuses (wiki item-sheet's Open questions). Nathan asked about creates only. The pickers are a candidate to fold in if he wants them.
- **The modal's header.** The Card at the modal's root, its title, opens nothing, and nothing asked it to.
- **Every look:** the disabled control's style, and the modal and the Sheet stacked. These belong to the cues' final look, which moved to the Dashboard, Navigation & Notifications epic (`epic-8-decisions.md`), or to the Sheet's own epic.

## Scope

- **Wiki passages:** none ahead of the build. The PO writes the rules once Nathan approves (code first).
- **Test-plan cases (Test Planner, after the PO's pass):**
  - Revised: **DRAG-7.28,** "A click on a row in the modal opens nothing". Its spec is updated in Phase 1 to what the build does, and checked against the revised case in Phase 3.
  - Added: cases for the disabled create controls, wherever the PO puts the rule (Open questions).

## Inbound deferrals

None.

## Approach and phases

### Decisions

**D1. A click on a Stub row in the modal opens that item's Sheet.**
- `HierarchyModal` takes the board's open-a-Sheet handler and passes it on to `SectionRows`. `BoardView` hands it `setSelectedItemId`, as it does to the columns.
- A click during a drag opens nothing. The row's click is already held off while it's dragged (`AttachedChildRow`'s `isDragging`), and a drag in the modal is §7.3's, unchanged.
- The overflow row is unchanged. In the modal it draws only where the section would cut a level off, which it never does there.

**D2. The modal stays open under the Sheet** (Nathan, 2026-11-04). The Sheet, its backdrop included, draws above the modal. Closing the Sheet by its X, Escape, or a click on its backdrop returns to the modal as it was.
- **While the Sheet is open, nothing closes the modal.** Today `ModalShell` and the Sheet (`ItemDetailPanel.tsx::ItemDetailPanelContent`) both listen for Escape on `document`, so one press would close both. The modal ignores close requests while a Sheet is open. The next Escape closes it.
- **The stacking today:**
  - `ModalShell` is `fixed z-50`, drawn inside the board root.
  - The Sheet's backdrop is `z-40` and its panel `z-50`, drawn after the board, so the modal sits above the Sheet's backdrop.
  - The Coder picks how to lift the Sheet, a z-index or the render order, and checks that the board's other modals still close as they do.
- **The Sheet's own links** to a parent or a child stay in the Sheet.
- **An edit made in the Sheet shows in the modal,** which reads the board's items. §9's closing rules hold: the modal closes once its Card is gone, or has no attached descendants left.

**D3. A create control shows disabled, saying why, at a parent the cap allows no child under** (Nathan, 2026-11-04).
- It's drawn but can't be clicked. Its hover title gives the reason, and it's marked disabled for a screen reader.
- The wording is the Coder's draft and Nathan's call hands-on, for example "At the depth cap (12 levels)". The cap in the text is the one read from the server, never a literal.
- **The Sheet's "+ Add" is `DetailSection.tsx`'s `onAdd` button,** shared with the Sheet's other sections. It takes the disabled state and reason as an optional prop. Today the only way to withhold it is to leave out `onAdd`, which hides it.
- **The sidebar row's actions show on hover,** so the disabled button shows there too.

**D4. One rule, in `lib/hierarchy.ts`.**
- **The rule:** a parent at depth `D` takes a new child only if `D + 1 <= CAP`. That's wiki hierarchy-placement §6's formula with `H = 0`, since a create has no subtree (project-tree §3).
- **Its spelling:** `hierarchy.ts::isWithinDepthCap(D, 0, cap)`, behind one named helper the three controls share (the root AGENTS.md's "One position math layer").
- **Data already past the cap** (§6): every parent at the cap or below it shows the control disabled. The formula is the whole rule.
- **The depths come in two bases, and the off-by-one is the risk:**

  | Control | Depth it has | Base |
  |---|---|---|
  | Sidebar row | `FlatItem.depth` (`projectTreeUtils.ts::flattenTree`) | top level 0, so add 1 |
  | Overview tab | `getDepth(project.id, allProjects)` | top level 1, as is |
  | Sheet | the API's `ItemDetail.depth` (`routes/items.ts`) | root 0, so add 1 |

**D5. Each cap comes from where it's read today.**
- **The project cap:** `GET /projects/depth-cap`, read into `App.tsx`'s `projectDepthCap`. The sidebar already has it, and passes it to each row. `App.tsx` also passes it through `ProjectPage` to `ProjectOverviewTab`.
- **The item cap:** the board's `itemDepthCap` (`GET /boards/:id`). `BoardView` passes it through `ItemDetailPanel` to `ChildrenSection`.
- **Until the project cap is read (null),** the controls are offered, as the sidebar's drag offers every state then (`useProjectDragReorder.ts`, `depthCap ?? Infinity`). The API still refuses a create past the cap.
- **"New project" at the sidebar's top** always makes a top-level project, at depth 1, so it's never disabled.

### Phase 1: the modal opens a Stub's Sheet (D1, D2)

- **Build:**
  - `HierarchyModal.tsx`: the open-a-Sheet prop, passed to `SectionRows`.
  - `BoardView.tsx`: it passes `setSelectedItemId`, holds the modal open while the Sheet is, and draws the Sheet above the modal.
  - `ItemDetailPanel.tsx`: only as far as lifting the Sheet takes.
  - `HierarchyModal.tsx`'s header: it says what the modal is for a drag. It gains that a click on a row opens the row's Sheet above it. No comment in `client/src` says a click there opens nothing today.
- **Tests:**
  - **Unit:** in `HierarchyModal.test.tsx`, a row click calls the handler with the row's id.
  - **Escape:** Escape with the Sheet open closes the Sheet and leaves the modal open, and a second Escape closes the modal. It goes wherever the Coder can drive both, a component test or a non-drag spec.
  - **DRAG-7.28's spec** (`tests/ui/drag-7-hierarchy-modal.spec.ts`) now fails as intended, and it's updated in place, not skipped:
    - a click on `R1`'s row opens `R1`'s Sheet;
    - the modal stays open under it, as it was;
    - nothing is written.

    Its title keeps the case's ID, and Phase 3 checks it against the case as the Planner revises it.
- **Hands-on (Nathan):** open a deep Card's modal, click a Stub, then close the Sheet each way and check that the modal is as it was. Also open a parent or a child from the Sheet, and try Escape with the Sheet over the modal.
- The gate, then a stop for review and commit.

### Phase 2: a create stops at the cap (D3–D5)

- **Build:**
  - `lib/hierarchy.ts`: the helper (D4).
  - The three controls: `SortableProjectRow.tsx`, `ProjectOverviewTab.tsx`, and `ChildrenSection.tsx` by way of `DetailSection.tsx`.
  - The caps passed down: `ProjectSidebar.tsx`, `App.tsx`, `ProjectPage.tsx`, `BoardView.tsx`, `ItemDetailPanel.tsx`.
- **Tests:**
  - **`hierarchy.test.ts`,** for the helper: a parent at depth `CAP - 1` takes a child, and one at `CAP` doesn't. The helper reads the cap it's given, never a number of its own.
  - **Component tests:** each control, enabled below the cap, and disabled with its reason at the cap. The sidebar row is in `SortableProjectRow.test.tsx`, the Sheet in `ItemDetailPanel.test.tsx`, and the Overview tab in a test of its own or `ProjectPage`'s.
  - **The API's refusals of a create past the cap** are covered already (TREE-3.4, TREE-3.5, and the item cap's cases).
- **Hands-on (Nathan),** on the deep stack, whose project and item trees reach the caps: `npm run seed:deep`, then `npm run dev:deep` in `server/` and in `client/`.
  - Hover each control at a parent one level short of the cap, and at a parent at the cap.
  - Settle the reason's wording.
- The gate, then a stop for review and commit.

### Phase 3: the docs follow

- **The Coder** fills in the Living-docs handoff below.
- **The PO** writes the rules, and places the create-at-cap rule (Open questions).
- **The Planner** revises DRAG-7.28 and writes the create-at-cap cases.
- **The Coder** then brings DRAG-7.28's spec, its title and its assertions, in line with the revised case, and stamps any new cases' tests with their IDs.
- **A Reconciler run** if it seems worth it. Otherwise Story 8's close-out takes it up (roadmap, "How each story closes").

## Code map

Expected, from the Architect's reading. The Coder corrects it while building.

| Symbol | Carries |
|---|---|
| `HierarchyModal.tsx` (its open-a-Sheet prop) | D1 |
| `BoardView.tsx` (the modal held open under the Sheet, and the stacking) | D1, D2 |
| `lib/hierarchy.ts` (the create-at-cap helper) | D4 |
| `DetailSection.tsx` (the add button's disabled state and reason) | D3 |
| `SortableProjectRow.tsx`, `ProjectOverviewTab.tsx`, `ChildrenSection.tsx` (each control) | D3, D4 |
| `App.tsx`, `ProjectPage.tsx`, `ProjectSidebar.tsx`, `ItemDetailPanel.tsx` (the caps passed down) | D5 |

## Amendments

**1. Phase 1 as built (Coder).**
- **The stacking is a z-index.** The Sheet's backdrop is `z-[60]` and its panel `z-[70]` (`ItemDetailPanel.tsx`), above `ModalShell`'s `z-50`, always, not only over the hierarchy modal. The other modals share `ModalShell`, so none of them moves. The one other `z-50` surface is the notifications bell's dropdown, which now draws under an open Sheet's backdrop as the modals do.
- **The hold is a prop.** `HierarchyModal` takes `sheetOpen`, from `BoardView`'s `selectedItemId !== null`, and ignores every close request while it's true: Escape, its X and a click on its backdrop. The Sheet's own Escape listener closes the Sheet in the same keypress.
- **The new specs:** DRAG-7.28's title now reads "a click on a row in the modal opens that item's Sheet above it". A second spec, with no case ID, closes the Sheet by Escape, its X and its backdrop and checks the modal is as it was each time, then that a last Escape closes the modal.

## Open questions

- **For the PO, after Nathan's hands-on: where the create-at-cap rule lives.** It holds for items and projects alike, so hierarchy-placement §6 is a candidate. It would sit beside "A feature's UI and its API always enforce the same `CAP`". The alternatives are each feature's page:
  - project-tree §5, "Creating a project";
  - for items, item-attachment §14, or the item-sheet page's Open questions, since that page states no rules of its own and its "Adding a child" entry lives there.
- **For Nathan, hands-on:** the reason's wording (D3).

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:** none (code first).
- **Passages superseded:**
  - board-drag-interaction §9, "A click on a row in the modal opens nothing: the item's Sheet would open behind the modal".
  - Its Open question, "Opening a Sheet from the hierarchy modal (§9)", is answered by D2.
- **Implementation passages to place:**
- **Test-plan cases affected:** DRAG-7.28, its spec updated in Phase 1 ahead of the case.
- **Wiki sections added, changed, moved or removed** (PO, at close):

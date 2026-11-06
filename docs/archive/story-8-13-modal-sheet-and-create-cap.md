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
  - Revised: **DRAG-7.28** opens the clicked row's Sheet above the modal and opens no Sheet for a row being dragged; **DRAG-7.8** qualifies ordinary modal dismissal to no Sheet open above it. Existing statuses and Automation fields await the Reconciler's assessment against the revised cases.
  - Added, all **Open**: **DRAG-7.32–DRAG-7.34** (Sheet dismissal and Escape order, parent/child Sheet navigation, and edits reflected in the modal); **TREE-5.2–TREE-5.5** (both project create controls at the cap boundary, disabled behavior at and past it, unread-cap state and always-offered New project); **ATT-10.6–ATT-10.7** (the Sheet's add-child boundary and disabled behavior).
  - Added **Open**, following the PO's Amendment 5 ruling: **DRAG-7.35**, the empty modal closing immediately while its Sheet remains open, then returning to the board when the Sheet closes. Amendment 6 records the resolved case and its Rule pointer.
  - **Audit-fix follow-up (Amendment 8):** revise **DRAG-7.33** to child-only navigation and **TREE-11.7** for a rename requested while an earlier move is unanswered. Add **TREE-9.4**, **TREE-4.13** and **ATT-10.8**, all Open, for deleted projects staying gone after old answers, response order preserving newer positions, and the add-child control following a reparent's current depth. Existing statuses and Automation fields are unchanged by this Planner follow-up.

## Inbound deferrals

None.

## Approach and phases

### Decisions

**D1. A click on a Stub row in the modal opens that item's Sheet.**
- `HierarchyModal` takes the board's open-a-Sheet handler and passes it on to `SectionRows`. `BoardView` hands it `setSelectedItemId`, as it does to the columns.
- A click during a drag opens nothing. The row's click is already held off while it's dragged (`AttachedChildRow`'s `isDragging`), and a drag in the modal is §7.3's, unchanged.
- The overflow row is unchanged. In the modal it draws only where the section would cut a level off, which it never does there.

**D2. The modal stays open under the Sheet** (Nathan, 2026-11-04). The Sheet, its backdrop included, draws above the modal. Closing the Sheet by its X, Escape, or a click on its backdrop returns to the modal as it was.
- **While the Sheet is open, its modal ignores Escape, its X and outside-click close requests.** Today `ModalShell` and the Sheet (`ItemDetailPanel.tsx::ItemDetailPanelContent`) both listen for Escape on `document`, so one press would close both. The modal ignores those close requests while a Sheet is open. The next Escape closes it. Automatic closing when its Card is gone or its hierarchy is empty does not wait for the Sheet (Amendment 5).
- **The stacking today:**
  - `ModalShell` is `fixed z-50`, drawn inside the board root.
  - The Sheet's backdrop is `z-40` and its panel `z-50`, drawn after the board, so the modal sits above the Sheet's backdrop.
  - The Coder picks how to lift the Sheet, a z-index or the render order, and checks that the board's other modals still close as they do.
- **A link in the Sheet to one of the item's children** opens that child's Sheet in its place, over the same modal. The Sheet has no link to the item's parent, only the Parent picker, which reparents (Amendment 7; Nathan, 2026-11-05).
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

**2. Phase 2 as built (Coder).**
- **The helper is `hierarchy.ts::noChildReason(parentDepth, cap)`,** not a bare boolean. It returns the reason, or null when the parent takes a child, so the three controls take their disabled state and their wording from one place. It is `isWithinDepthCap(parentDepth, 0, cap)` behind a `null` for an unread cap. The wording is a draft: "At the depth cap (N levels)", with N the cap passed in.
- **The bases, as D4 lists them:** `SortableProjectRow` passes `item.depth + 1`, `ProjectOverviewTab` passes `getDepth(project.id, allProjects)`, and `ChildrenSection` passes `(item.depth ?? 0) + 1`.
- **`DetailSection` takes `addDisabledReason`,** beside `onAdd`: set, the "+ Add" shows disabled with the reason as its title. Leaving `onAdd` out still hides it.
- **The caps reach each control by the route D5 names.** `ChildrenSection` takes `itemDepthCap` from `ItemDetailPanel`, from `BoardView`'s `board.itemDepthCap`. `ProjectOverviewTab` takes `projectDepthCap` from `ProjectPage`, from `App.tsx`. `ProjectSidebar` passes it to each row.
- **The disabled controls use `disabled`, not `aria-disabled`.** A disabled button takes no click and no focus, so the reason is for a hover.
- **The overview tab's button gains `aria-label="Add subproject"`,** so its accessible name stays what its title gave it.

**3. The wiki (PO, 2026-11-05).**
- **The click in the modal,** board-drag-interaction §9: a click on a row opens that item's Sheet above the modal, and a row being dragged opens nothing. It doesn't say "as a Stub's click in a Card's section does", since the wiki states no rule for that click. The modal stays open under it, and the Sheet closing any way returns to the modal as it was. The Sheet's links to a parent or a child open that Sheet in its place, over the same modal, and an edit made in the Sheet shows in the modal. The closing rule gains that while a Sheet is open nothing closes the modal: Escape closes the Sheet, the next the modal. The passage it supersedes and its Open question go. The modal's look gains how a Sheet shows above it, today drawn over it with its backdrop dimming the modal.
- **The create-at-cap rule is shared,** in hierarchy-placement §6 beside "A feature's UI and its API always enforce the same `CAP`": a control that creates a child shows disabled at a parent at depth `D` with `D + 1 > CAP`, a parent past the cap included; it's drawn, takes no click and no keyboard focus, and gives its reason on hover, "At the depth cap (N levels)". Its Why is the user naming an entry only to be refused. Each feature's page names its controls. The disabled look is the page's first Open question, as today's placeholder.
- **Each feature's controls:** project-tree §5, "Add subproject" on a sidebar row and on the Overview tab, "New project" always offered, and every "Add subproject" offered until the cap is read. Item-attachment §14, the Sheet's add-child control. Item-sheet's "Adding a child" points there.
- **Deductions, for Nathan to overrule:**
  - **The rule is shared,** by the wiki README's convention, as it holds for items and projects alike.
  - **The wording is a rule,** since Nathan's hands-on passed with it, so a case may pin it. Its `N` is the feature's cap.
  - **No keyboard focus is a rule,** as the handoff states it: a `disabled` button. It means a keyboard user never reaches the reason. If Nathan wants the reason reachable, the control would be `aria-disabled` and focusable instead, a code change.
  - **The Sheet drawing above every modal, and over the bell's open list,** is a placeholder in item-sheet's Open questions ("What the Sheet draws over"), not a rule: that page states none of its own, and only the hierarchy modal's case was asked for.
  - **The links in the Sheet and an edit showing in the modal** are rules (D2), though no test covers them. The Planner may write cases for them.
- **Not taken into the wiki:** the modal's header opening nothing, which nothing asked for. The parent pickers' missing cap, already in project-tree's and item-sheet's Open questions.
- **For the Test Planner:** DRAG-7.28's ground is §9's click paragraph, and the Sheet-over-modal closing is §9's closing paragraph. The create controls' ground is hierarchy-placement §6, with each control named in project-tree §5 and item-attachment §14. The helper's own cases (an unread cap, data past the cap) are §6 and project-tree §5. The disabled look is an Open question, so no case for it.
- **For the Architect:** the roadmap's Story 8 line, "Today a click there opens nothing", as the handoff says.
- **Resolved Open questions removed:** where the rule lives (above), and the reason's wording (Nathan's hands-on).
- **Checks:** `check:docs` passes. Nothing is committed.

**4. Test-plan follow-up (Test Planner, 2026-11-05).** Read the handoff and the PO's uncommitted wiki updates, without reading production or test code.
- **The settled modal rules:** revised DRAG-7.28 and qualified DRAG-7.8. New DRAG-7.32–DRAG-7.34 cover the three Sheet dismissals and two-Escape order, navigation replacing the foreground Sheet over the same modal, and a title edit reaching the modal without reopening it. These cases do not pin z-indexes, dimming, typography or the Sheet's behavior over other modals.
- **The shared cap rule:** four new TREE-5 cases apply it to both project controls, and two new ATT-10 cases to the Sheet's add-child control. Depths use the wiki's absolute root-at-1 convention; a child at exactly CAP is legal. The disabled controls remain present, advertise the feature's cap in the exact reason, take no click or keyboard focus, and cannot start a create. Cases include existing over-cap data, unread project-cap state and the always-offered top-level project create. No item unread-cap state is invented: the handoff says the item cap is available before the Sheet opens.
- **Catalog placement:** hierarchy-placement holds shared rules and gets no catalog. The cap cases belong in project-tree §5 and item-attachment §14's suites. Item-sheet still has no settled rules of its own, so its catalog remains an INDEX only. Updated the three affected feature INDEX entries.
- **One rule intersection needs the PO:** DRAG-7.35 stays Pending PO until the wiki says whether automatic empty-modal closing overrides the Sheet-open hold. The normal closing and title-edit cases avoid that unsettled boundary.
- **For the Coder/Reconciler:** the handoff's existing Sheet-dismissal and create-control tests are candidates for the new IDs, not mapped coverage. Stamp only their asserted portions, and assess all revised/new cases against the full Then. Sheet links and edits are explicitly reported untested. All new live cases start Open with no Automation pointer; this pass changes no existing status or mapping and grants no new internal-test approval. These non-drag coverage tasks belong to 8.13 or the scheduled Story 8 close-out, not an automatic Story 10 deferral. The reported drag failures below retain their existing route and are not new skips or automation judgments from this pass.

**5. DRAG-7.35: the empty modal under a Sheet (PO, 2026-11-05).** **Nathan ruled the first option:** the modal closes at once, with the Sheet left open.
- **The wiki:** board-drag-interaction §9's closing paragraph now scopes the hold to the three closing gestures ("none of these closes the modal"), and says the automatic close, a Card gone or no attached descendants left, doesn't wait for a Sheet. Closing the Sheet then returns to the board. Its Why: the hold keeps a gesture from closing a modal the user is still using, and an empty modal isn't one.
- **The build already does this,** by reading: `BoardView.tsx` closes the modal from the board's items and never reads `selectedItemId` there, and `sheetOpen` reaches only the modal's own close requests. No code change is expected.
- **For the Test Planner:** DRAG-7.35's *then* is now settled, so it can leave Pending PO. The case's ground is §9's closing paragraph: the modal gone at once, the Sheet still open, and closing it showing the board.
- **For the Reconciler:** the Gaps table's note, that DRAG-7.32's fixtures keep a branch to avoid DRAG-7.35, no longer binds. A fixture may now empty the hierarchy.

**6. DRAG-7.35 resolved in the catalog (Test Planner, 2026-11-05).** Applied the PO's Amendment 5 clarification from wiki board-drag-interaction §9 without reading code or test code.
- **No new ID is needed.** DRAG-7.35 changes from Pending PO to Open, gains its Rule pointer and a concrete Then: detaching the last attached descendant closes the modal immediately, leaves that item's Sheet open, and closing the Sheet by its X, backdrop or Escape returns to the board without restoring the modal or causing another hierarchy write. Its Automation field remains `—`; the PO's code reading is not a coverage claim.
- **DRAG-7.32** now explicitly distinguishes blocked dismissal gestures from automatic Card-gone/empty-hierarchy closing, with references to DRAG-7.26 and DRAG-7.35. Its unchanged-modal assertions apply while the hierarchy remains present. A test may exercise an emptied hierarchy, but then the expected result is DRAG-7.35's automatic close and return to the board, not an unchanged modal.
- **For the Reconciler:** the report's Pending PO action and blanket instruction to avoid an emptied hierarchy are superseded by Amendment 5 and these cases. Assess any empty-hierarchy fixture against the settled automatic-close outcome. DRAG-7.32 and DRAG-7.35 remain Open until their full cases have confirmed test coverage; no approval or stamp is inferred by this Planner pass. The existing source-review report is not edited here.

**7. The Sheet's links, and the audit fixes (PO, 2026-11-05).**
- **No parent link; Nathan ruled to drop that half.** §9 named a link in the Sheet to the item's parent, which I took from D2 without checking the Sheet. It has links to children and a Parent picker, which reparents, a write. §9 now says a link to one of the item's children opens that child's Sheet in its place, over the same modal. **For the Test Planner:** DRAG-7.33's R → R1 → R1a sequence is the whole rule, so its parent step (R1 → R → R1) goes, and the case can be built as the Coder has it. The Coder's partial note stands answered. D2's "a parent or a child" is the Architect's.
- **Audit fixes #1, #3, #4, from the handoff's decisions, for Nathan to overrule:**
  - **#1, a deleted project stays gone:** a sentence in project-tree §9, since it's a rule about what the sidebar shows, not how the client gets there. It doesn't name the order-of-arrival mechanism (`deletedIds`).
  - **#3, the Sheet after a reparent:** the add-child control follows the new depth, in item-attachment §14, since it's the cap rule applied to where the item is now. That the Sheet reads the item again is a placeholder, in item-sheet's Open questions ("After a reparent"), as that page states no rules of its own.
  - **#4 and #2 need no change:** project-tree §11 already says a rename never opens a parent, and positioning §8 and project-tree §4 are met as they stand, as the handoff says.
- **For the Architect:** the roadmap's and D2's mention of a parent link.
- **Checks:** `check:docs` passes. Nothing is committed.

**8. Root `AGENTS.md`, the roadmap, D2 and the known limits (Architect, 2026-11-05).**
- **Audit #5 and #6 are fixed in root `AGENTS.md`.** The reindex guardrail names `useProjectCollection.ts::foldWrite` for the sidebar's folds, and says that `applyWriteResponse`'s `newer` names the rows a later write has already set, and that the sidebar passes it. The `attachments` row now reads "External file links per item (a label, a type and an optional URL), added and deleted in the item's Sheet". The Open question that held their wording is removed. Close-out rows 5 and 6 are the audit's to mark.
- **The parent link (Amendment 7):** D2 now says a link to a child opens that child's Sheet in its place, and that the Sheet has no parent link. The roadmap's entry never mentioned one.
- **The roadmap's Story 8.13 entry** now says what the modal and the create controls did before this story, where it said "Today".
- **The four known limits (the audit fixes' handoff) are accepted.** None needs a fix or a route:
  - **Writes ordered by when they were sent.** The server handles each request whole (better-sqlite3, and no `await` in a project handler), in the order the requests reach it. Only two writes of different projects sent in the same instant could reach it the other way round, and writes go out on a release or a submit. If that happened, a row's drawn position would lag until the next read of the whole tree. The server's positions stay right. **For the Coder:** one comment at `writeInTurn`, saying why the order sent is the server's order and what a reordering would cost, so a cold audit doesn't work it out again.
  - **A read landing before an older write's answer.** It shows the tree without that write only until the write's own answer folds in on top, and a move stays drawn by `pendingMoves` meanwhile.
  - **A project deleted in another tab.** The app has no sync between tabs (root `AGENTS.md`, Known Issues), so another tab's change shows at the next read. This is that existing limit, not a new one.
  - **A child added while the Sheet reads again after a reparent.** The window is one local read, and adding a child means typing its name first. The child is stored, and reopening the Sheet shows it.
- **The board's item writes look to have #2's gap.** `useItemManagement.ts`'s tracker keeps writes in order per item only. Routed to Story 8's close-out audit (`story-8-close-out-audit.md`, Inbound deferrals), whose scope reads that file whole.

**8. Planner follow-up to the audit fixes and Amendment 7 (Test Planner, 2026-11-05).** Read the Coder's handoff and the PO's uncommitted wiki changes without reading code or tests.
- **DRAG-7.33** now follows the settled child-only sequence R → R1 → R1a over the same modal. The parent-link requirement is removed from its title and Then; no new ID is needed. It remains Open for the Reconciler to assess against the Coder's existing child-navigation spec. No Sheet parent-navigation rule is inferred from the reparenting picker.
- **TREE-9.4 (new, P0 Open)** derives from project-tree §9's deleted-project rule. An older saved write's answer cannot restore a deleted project or descendant or show another project under the deleted parent, including late child creates and moves. The Coder's four untagged regressions under `App.pendingMove.test.tsx`'s "a write answered after its project was deleted" are candidates for stamps, not coverage claimed here.
- **TREE-4.13 (new, P1 Open)** derives from project-tree §4 and positioning §7–§8. With the server's saved write order fixed, delivering answers in reverse must preserve the latest saved positions, both against an old reindex pair and against an old written-row value, while applying the other current pairs. Its concrete example distinguishes X = 5 from stale X = 1, and preserves the unaffected Y/R pairs. It does not require a particular request-send order, generation counter or queue. The handoff's cross-project reindex and `positionedWrite.test.ts` regressions are candidates for this ID.
- **ATT-10.8 (new, P1 Open)** derives from item-attachment §14 and the shared cap formula: moving a leaf up from CAP enables its add-child control at CAP − 1; moving back to CAP disables it with the cap reason. This transition is its own case, preserving ATT-10.6 and ATT-10.7's existing boundary coverage and mappings. The Sheet's general post-reparent layout/read mechanism and whether it stays open remain outside the case, in item-sheet's Open questions.
- **TREE-11.7** gains the earlier-move/rename window from the existing project-tree §11 rule. Collapse P after the move succeeds and before the outstanding rename answers; that rename, including an explicit unchanged-parent edit, must leave P collapsed and its children hidden. TREE-11.5 already states the distinct successful parent-change rule and needs no text change.
- **For the Coder/Reconciler:** the three new IDs need stamps on tests that assert their actual portions. The newly stamped App and Sheet internal tests in the handoff are proposals to assess, not approvals inferred from older mappings or this Planner pass. In particular, ATT-10.8 is a new mapping even if its candidate tests already carry ATT-10.6/ATT-10.7. The bounded optional refusal-test overlap question remains for the Reconciler; no new run is launched here. These audit regression/cap-transition cases belong to 8.13's close-out, not automatic Story 10 drag deferrals. No additional case is needed for #7's unchanged reference behavior; the Coder's known-limit decisions remain with the Architect, not silently codified from implementation.
- **Statuses:** all three new cases are Open with `—`; existing status and Automation fields are unchanged. The two affected feature INDEX entries and story Scope include the follow-up. No test code, wiki or prior report was edited by the Planner.

## Open questions

- **For the Architect/Coder — Story 8.13 code quality audit (2026-11-05):** [the report](../../audits/code-quality-audit-story-8-13.md) covers `epic-3-5-story-8-12-audited..2c4b124`. Required findings #1–#4 are reproduced correctness defects: post-delete project resurrection, older cross-project reindex pairs overwriting newer positions, the Sheet's stale child-cap depth after reparenting, and a queued rename reopening a collapsed parent. #5–#6 are root `AGENTS.md` corrections for its owner, the Architect (the project-fold pointer moved to `useProjectCollection.ts`; attachments already have a UI). #7 uses the existing `namesARow` helper at the item reference checks. Plan and disposition these before this audit closes; the Auditor made no application fixes. #8's existing timing-dependent DRAG-7.10 spec is explicitly routed into Story 10's Inbound deferrals. The broader 8.N audit is separate and has not begun.
- **For the Test Reconciler — optional bounded overlap check from this audit:** `App.pendingMove.test.tsx:147–175` and `:237–253` both cover refusal restoration, including failed recovery reads. Determine whether the second fixture protects an additional clause or could be consolidated when these tests are next touched. This is a note, not a required finding, removal instruction or request to rerun full reconciliation. Regression/catalog mapping for the four new correctness fixes remains with the appropriate owners after their changes are planned.
- **For Story 10, the drag specs that fail in the full E2E run.** Across the two full runs during this story, six `drag-7-*` specs failed, three each time: DRAG-7.10, 7.3 and 7.29 in the first; DRAG-7.16, 7.4 and 7.29 in the second. DRAG-7.10, 7.3 and 7.29 were run alone at the commit before Phase 1 (`ed771e3`) and failed there at about the same rate, so the story didn't cause them. 7.16 and 7.4 were not run there. They look timing-sensitive under load. A third full run, after the gaps were closed, failed DRAG-7.10, 7.16 and 7.4, none of which a new test touches.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
  - **The Sheet draws above every modal,** not only the hierarchy modal (Amendment 1). Nothing but the modal and the notifications bell's dropdown shares its screen. An open Sheet's backdrop now covers the bell's dropdown, as it does a modal.
  - **While a Sheet is open the modal ignores Escape, its X and a click on its backdrop.** Escape closes the Sheet, and the next closes the modal. The Sheet's backdrop covers the modal's, so the click is the Sheet's in practice.
  - **The create controls are offered while the project cap is unread (null),** since the API refuses a create past the cap anyway (D5). The item cap is always read by the time a Sheet is open.
  - **A disabled create control is a `disabled` button,** so it takes no click and no keyboard focus, and its reason shows on hover as its title. The reason's wording, "At the depth cap (N levels)", is the Coder's draft. Nathan's hands-on on the deep stack passed with it.
  - **Where the create-at-cap rule lives** is the Open question below, still the PO's.
  - **Not covered by a test:** the Sheet's own links to a parent or a child staying in the Sheet, and an edit made in the Sheet showing in the modal (D2). Both are code paths this story didn't change, and the plan's hands-on lists them for Nathan.
- **Planned passages now built:** none (code first).
- **Passages superseded:**
  - board-drag-interaction §9, "A click on a row in the modal opens nothing: the item's Sheet would open behind the modal" (`README.md`, the passage around line 1012).
  - Its Open question, "Opening a Sheet from the hierarchy modal (§9)", is answered by D2.
  - The roadmap's Story 8 entry says "Today a click there opens nothing" (`epic-3-5-roadmap.md`, around line 1327). It describes the state before this story, for the Architect.
- **Implementation passages to place:**
  - **Placed already, by the Coder:**
    - `HierarchyModal.tsx`'s header: a row's click opens its Sheet above it, and the order of the Escapes.
    - `ItemDetailPanel.tsx`'s comment above the z-indexes.
    - `hierarchy.ts::noChildReason`'s comment, with the two depth bases.
    - `workflow/AGENTS.md`, in the hierarchy-modal paragraph: the click, the Sheet above it and the `sheetOpen` hold.
  - **None left for the PO or the Planner.**
- **Test-plan cases affected:**
  - **DRAG-7.28** (Revised, Planner). The case still reads "A click on a row in the modal opens nothing". Its tests now say what the build does: the E2E spec (`drag-7-hierarchy-modal.spec.ts`) is "a click on a row in the modal opens that item's Sheet above it", and a unit test in `HierarchyModal.test.tsx` carries the ID. Both are to be checked against the revised case.
  - **Stamped by the Coder after the reconciliation (2026-11-05), as partial coverage:** DRAG-7.32 on the Sheet-closing E2E spec and on the `HierarchyModal.test.tsx` Escape test; TREE-5.2 to TREE-5.4 on `SortableProjectRow.test.tsx` and `ProjectOverviewTab.test.tsx`; ATT-10.6 and ATT-10.7 on `ItemDetailPanel.test.tsx`; TREE-5.5 on `project-sidebar.spec.ts`. **Nathan approved the internal (component-test) mappings among them,** the exact file-to-case pairs in the reconciliation report's Proposed Internal Mappings, for the Reconciler to write.
  - **Gaps closed by the Coder after the reconciliation (2026-11-05),** in new or extended surface tests, each stamped with its ID:
    - **DRAG-7.28:** the Sheet takes the pointer where it lies over the modal, and the hierarchy is compared before and after; a second spec carries a row and asserts no Sheet opens, during the drag or on the release, and the release places by gap and depth.
    - **DRAG-7.32:** the modal's rows, indents and a nonzero scroll are compared after each of the four closings (Escape, the Sheet's X, its backdrop, and a click on the modal's own X, which lies under the Sheet's backdrop); nothing is written; the last Escape closes the modal.
    - **DRAG-7.33:** the child links R → R1 → R1a. Amendment 7 removes the parent-link requirement from the wiki, and Amendment 8 applies that ruling to the case. Its revised whole-case coverage remains for the Reconciler to confirm.
    - **DRAG-7.34:** a rename in the Sheet shows in the open modal, with the other rows and the indents unchanged, and the updated modal is what the Sheet's closing returns to.
    - **DRAG-7.35:** detaching the modal's last attached descendant from its open Sheet closes the modal at once and leaves the Sheet open; closing it by its X, backdrop or Escape returns to the board with the detach the one write. Added because Amendments 5 and 6 settled the case.
    - **TREE-5.2 to TREE-5.5 and ATT-10.6/10.7:** `project-tree-create-cap.spec.ts` and `item-create-cap.spec.ts` drive the real dialogs and Sheet against the server's caps, read back what was stored, hold the cap request unanswered, and use pinned parents (projects) or a cap the board answers (items) for data past the cap. The caps are answered other than they are, in some specs, so only a client that reads them passes.
    - **Not closed:** the keyboard reach of the sidebar's hover actions is asserted through the disabled button's focus only; the unit tests' stamps stay as they were.
  - **No case, no ID:** the helper's rule (`hierarchy.test.ts::noChildReason`), including an unread cap and data already past it. The reconciliation proposed no mapping for it.
  - **No test was deleted, and none lost its case ID.**
  - **Planner handoff applied:** Scope and Amendment 4 list the revised cases, nine new Open cases, the Pending PO boundary and the Coder/Reconciler follow-up. No test files were read or edited by the Planner, and no new Automated claim was made.
- **Code quality audit fixes (2026-11-05), #1–#4 and #7 of [the report](../../audits/code-quality-audit-story-8-13.md), made by the Coder in one change.** #5 and #6 are with the Architect (Open questions), #8 is Story 10's, and #9–#11 are optional or already open.
  - **Behavior decisions, for the PO to rule on:**
    - **A late answer for a deleted project is dropped (#1).** The sidebar never shows a project, or one put under it, back after the server deleted it, whatever answer lands afterward. The wiki's project-tree §9 already says a delete removes the subtree. This only closes an order of arrival it left open.
    - **After a reparent the Sheet reads the item again (#3).** Its depth, its children's depths and the add-child control follow the new place. Nothing was said of the Sheet's open state after a reparent.
    - **A rename never opens a parent (#4),** whichever write was ahead of it. project-tree §11 says this already.
  - **Passages superseded:** none. Wiki positioning §7–§8 and project-tree §4 are met by #2's fix. Its rule is unchanged: the settled list shows the server's order after the disclosed positions are applied.
  - **Implementation passages placed by the Coder:**
    - `useProjectCollection.ts`'s header: three new guarantees, a deleted project stays gone (`deletedIds`, `foldWrite`), a row keeps the position of the latest-sent write that set it (`positionSetBy`), and an edit is compared with the project as the previous answer left it (`appliedRows`).
    - `positionedWrite.ts`: the optional `newer` argument of `applyWriteResponse`, and the written row keeping its position when a later write set it.
    - `ItemDetailPanel.tsx::refreshDepths`'s comment.
    - **For the Architect, one more mention in root `AGENTS.md`'s reindex guardrail** (already asked for in Open questions): the sidebar's folds go through `foldWrite`, and `applyWriteResponse` takes `newer` for an answer older than a write that has set the row.
  - **Test-plan cases affected:**
    - **Stamped by the Coder, in internal tests (component and hook tests) for the Reconciler to judge. Nathan approved internal tests for the three new cases below; the TREE-11 pair still needs it:** **TREE-11.7** (a rename queued behind a move leaves the collapsed parent collapsed) and **TREE-11.5** (an edit that does reparent still opens it), both in `App.pendingMove.test.tsx`.
    - **Written for the Planner's cases (Amendment 8), internal tests approved by Nathan:**
      - **TREE-9.4** in `useProjectCollection.test.ts`: seven held-answer scenarios (a rename and a move of P, an edit and a move of C, a create of N under P, and a move of the unrelated X under P and under C), each answered after P's delete is reflected; the tree stays `Q, X`, Q is unchanged, nothing shows under P, and the old answer sends no write. Also two orders of several answers landing, and a create under a deleted project opening no parent.
      - **TREE-4.13** in the same file: R's older answer landing after X's, with X keeping `Q` and 5, `Q`'s children `B, X` and no render drawing X before B, `P`'s children `Y, R` at 2 and 3; the saved order ending the same; and an older answer's own position for a row a newer write set (it keeps 2). `positionedWrite.test.ts` has two unit tests of `applyWriteResponse`'s `newer`, with no ID.
      - **ATT-10.8** in `ItemDetailPanel.test.tsx`: one test through the whole case, the Sheet open throughout (disabled at the cap with its reason, enabled and starting a create after the reparent up under S, no create sent, then disabled again under T, out of the tab order, no create). It replaces the two shorter reparent tests that carried ATT-10.6/10.7, so those two IDs are back to their boundary tests.
      - Each was checked by removing its fix: the hook's delete guard (10 of 13 failed), `newer` (2 failed) and the Sheet's re-read (the test failed).
    - **#3:** the server cap remains the existing rule, and ATT-10.8 is the Sheet's following the item's new depth.
    - **#7 changed no behavior;** the existing reference-shape cases still hold.
    - **No test was deleted, and none lost its case ID.**
  - **Known limits, for the Architect to judge:** the fixes order writes by when this client sent them and assume the server takes requests in that order; a whole-tree read taken before an older in-flight write is processed can still be read as newer than it; a deleted project is only flagged on a read when another tab deleted it; and a child added between a reparent and the Sheet's read can drop out of the Sheet's list until it is reopened.
- **Wiki sections added, changed, moved or removed** (PO, at close): board-drag-interaction §9 (the click opens the Sheet above the modal, the modal held open under it, the empty-hierarchy close not waiting for a Sheet, Amendment 5, and the Sheet's links being to children only, Amendment 7); project-tree §9 (a deleted project stays gone) and item-attachment §14 (the add-child control follows a reparent), Amendment 7 and its Open questions (the Sheet question removed, the modal's look gains the Sheet above it); hierarchy-placement §6 (the create-at-cap rule, now shared), its Related line and a new Open question (the disabled control's look); project-tree §5 and item-attachment §14 (each feature's controls); item-sheet's Open questions ("Adding a child", and a new "What the Sheet draws over"). See Amendment 3.

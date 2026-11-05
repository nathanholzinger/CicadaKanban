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

## Open questions

- **For the Architect/Coder — Story 8.13 code quality audit (2026-11-05):** [the report](../../audits/code-quality-audit-story-8-13.md) covers `epic-3-5-story-8-12-audited..2c4b124`. Required findings #1–#4 are reproduced correctness defects: post-delete project resurrection, older cross-project reindex pairs overwriting newer positions, the Sheet's stale child-cap depth after reparenting, and a queued rename reopening a collapsed parent. #5–#6 are root `AGENTS.md` corrections for its owner, the Architect (the project-fold pointer moved to `useProjectCollection.ts`; attachments already have a UI). #7 uses the existing `namesARow` helper at the item reference checks. Plan and disposition these before this audit closes; the Auditor made no application fixes. #8's existing timing-dependent DRAG-7.10 spec is explicitly routed into Story 10's Inbound deferrals. The broader 8.N audit is separate and has not begun.
- **For the Test Reconciler — optional bounded overlap check from this audit:** `App.pendingMove.test.tsx:147–175` and `:237–253` both cover refusal restoration, including failed recovery reads. Determine whether the second fixture protects an additional clause or could be consolidated when these tests are next touched. This is a note, not a required finding, removal instruction or request to rerun full reconciliation. Regression/catalog mapping for the four new correctness fixes remains with the appropriate owners after their changes are planned.
- **For Story 10, the drag specs that fail in the full E2E run.** Across the two full runs during this story, six `drag-7-*` specs failed, three each time: DRAG-7.10, 7.3 and 7.29 in the first; DRAG-7.16, 7.4 and 7.29 in the second. DRAG-7.10, 7.3 and 7.29 were run alone at the commit before Phase 1 (`ed771e3`) and failed there at about the same rate, so the story didn't cause them. 7.16 and 7.4 were not run there. They look timing-sensitive under load. A third full run, after the gaps were closed, failed DRAG-7.10, 7.16 and 7.4, none of which a new test touches.
- **For the PO and the Test Planner: DRAG-7.33 and wiki board-drag-interaction §9 name a link in the Sheet to the item's parent, and the Sheet has none.** It has links to children (`ChildrenSection`) and a Parent picker (`ParentSection`) that reparents the item, which is a write, not a navigation. The case's R1 → R → R1 → R1a sequence can't be followed. Either the Sheet gains a parent link (a code story), or the wiki and the case drop the parent half. The plan's D2 repeats the claim. The Coder built the child half and left the case partial.

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
    - **DRAG-7.33, partly:** the child links only (R → R1 → R1a). **The Sheet has no link to an item's parent,** only a picker that reparents it, so the case's parent step is not built. See Open questions.
    - **DRAG-7.34:** a rename in the Sheet shows in the open modal, with the other rows and the indents unchanged, and the updated modal is what the Sheet's closing returns to.
    - **DRAG-7.35:** detaching the modal's last attached descendant from its open Sheet closes the modal at once and leaves the Sheet open; closing it by its X, backdrop or Escape returns to the board with the detach the one write. Added because Amendments 5 and 6 settled the case.
    - **TREE-5.2 to TREE-5.5 and ATT-10.6/10.7:** `project-tree-create-cap.spec.ts` and `item-create-cap.spec.ts` drive the real dialogs and Sheet against the server's caps, read back what was stored, hold the cap request unanswered, and use pinned parents (projects) or a cap the board answers (items) for data past the cap. The caps are answered other than they are, in some specs, so only a client that reads them passes.
    - **Not closed:** the keyboard reach of the sidebar's hover actions is asserted through the disabled button's focus only; the unit tests' stamps stay as they were.
  - **No case, no ID:** the helper's rule (`hierarchy.test.ts::noChildReason`), including an unread cap and data already past it. The reconciliation proposed no mapping for it.
  - **No test was deleted, and none lost its case ID.**
  - **Planner handoff applied:** Scope and Amendment 4 list the revised cases, nine new Open cases, the Pending PO boundary and the Coder/Reconciler follow-up. No test files were read or edited by the Planner, and no new Automated claim was made.
- **Wiki sections added, changed, moved or removed** (PO, at close): board-drag-interaction §9 (the click opens the Sheet above the modal, the modal held open under it, and the empty-hierarchy close not waiting for a Sheet, Amendment 5) and its Open questions (the Sheet question removed, the modal's look gains the Sheet above it); hierarchy-placement §6 (the create-at-cap rule, now shared), its Related line and a new Open question (the disabled control's look); project-tree §5 and item-attachment §14 (each feature's controls); item-sheet's Open questions ("Adding a child", and a new "What the Sheet draws over"). See Amendment 3.

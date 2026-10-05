# A5b — Wiki and Test-Plan Rehoming: the Project Sidebar and the Sheet

**Type:** tech-debt story. It's mostly docs. Its one behavior change, the sidebar's set-down, is a rule the wiki already holds, and it restructures no code, so it closes without an audit. · **Written:** 2026-09-26 by Nathan, as A5; split out on 2026-09-30 by the Architect; planned on 2026-10-04 by the Architect · **Status:** approved 2026-10-05, with Nathan's answers to its open questions; batch 1 (the PO) is next · **Sequenced:** after A5a (closed), before A5c

## Goal

During A3 Test Plan Rules and Sweep it was noticed that a project side bar test case was incorrectly mapped into a board-drag-interaction test plan. This appears to be stem from the fact that there is no appropriate home for project sidebar behavior so those rules were folded into the board-drag-interaction section. And then the test cases were written to match the wiki layout. We should address all know behavior/rule mismatches, but also do a full sweep through the wiki looking for more. Behaviors and Rules that do not belong in the current section should be moved to an appropriate home, with new sections created for rules that don't yet have a home. Ask Nathan for input when it is unclear. When Wiki rules move we should also rehome any related test cases, and also double check if the automation tests are living in appropriate files.

*Split note (2026-09-30):* A5's item-movement rulings became A5a, and its boards-columns-unsorted write-up became A5c. This story keeps the rehoming: the project sidebar (D1), the Sheet (D2), the sweep for other misplaced rules (D3), and the comments that cite what moves (D4). Its one code change is the sidebar fix in D1.

*Out of scope (Architect, 2026-10-04):*
- **The project API's other rules:** creating, editing and deleting a project, and reparenting one from its own page. No page states them. They go to A5d (D5).
- **Defining the Sheet.** Its layout and behavior are a placeholder until the Work Item Detail & Chat UI epic designs it (ruling 14). This story gives it a page that says so, and moves nothing onto it that needs precise rules or a robust test plan (D2).
- **boards-columns-unsorted** (A5c).

## Decisions

### D1 project sidebar details mis-mapped into board-drag-interaction

DRAG-4.28 and several references to 'project sidebar' are incorreclty mapped into board-drag-interaction.

*Added by the Test Planner, from A3 batch 3 (2026-09-27):*
- **DRAG-4.26 is routed here by ID** (Nathan, at A3 batch 3's Stop 1). It's the sidebar's gap-and-depth placement with an indicator line. It's `Open`, and no sidebar drag test exists at any layer, so its test is written once it has moved to the sidebar's suite.
- **DRAG-4.28 and 4.31 are routed here too** (2026-09-28). The PO's §7.1 changes made both `Open`:
  - 4.28: no project can be tabbed shallower than the top level, and an empty sidebar hierarchy offers one state;
  - 4.31: the sidebar places against the real tree under a collapsed project.

  §7.1 now states both rules, so what moves is the rules and their cases.
- **Sidebar behavior that tests pin but no wiki page states** (from A3 batch 3's Reconciler report, candidate new case 5):
  - a named row inside the dragged subtree maps to the gap after the nearest eligible row before it;
  - the dragged project's descendants are dimmed during the drag;
  - a collapsed project opens when a project is dropped into it.
- **Moving the cases.** When the rules move, DRAG-4.26, 4.28 and 4.31 get new IDs in the sidebar's suite, and this plan lists old → new (A3 D4).
- **Tests to map once they move.** Client tests already pin DRAG-4.28's and 4.31's rules without carrying their IDs: hierarchyPlacement's null-root and collapsed-Top tests, and projectTreeUtils'. A3's confirming run lists them. They're internal, so each mapping needs Nathan's approval.

*Added by the Auditor, from A4's handoff (2026-09-30):* one sidebar gap, routed here by Nathan rather than to A6's audit.
- **The sidebar writes on a set-down in its own slot.** §7.1 says an item set back down in its own gap, at its own depth, writes nothing, since with full context the release can't move it. The board keeps to that (`descendantsProjection.ts::descendantsReleasePlacement`). The sidebar doesn't, per the Coder: once the pointer has left the project's own row and come back, `useProjectDragReorder.ts`'s `handleDragEnd` sends the move, and the server places the project between the same neighbors. Nothing visibly moves, but `position` and `updatedAt` change. A release before the pointer leaves its own row writes nothing.
  - §7.1 says "item", but its reason holds in the sidebar, which always has full context. When the sidebar's rules move, their new home says whether a set-down in its own slot writes (a ruling for Nathan).
  - If it writes nothing, this story carries one code fix: a check against the project's own slot before `onReorderProject`, like the board's. Its case goes in the sidebar's new suite.
  - **Ruled (Nathan, 2026-09-30):** it writes nothing, so this story carries the fix.

**The page's structure is the PO's call, at a stop** (Nathan, 2026-09-30). The Architect's guess: the sidebar gets a page of its own, and the gap-and-depth rule the board and the sidebar share stays on board-drag-interaction, with the sidebar's page pointing to it. Which way it goes sets how many comments D4 re-points.

*Planned by the Architect (2026-10-04):*
- **What leaves board-drag-interaction.** These passages are about the sidebar only:
  - §7.1: the indicator line in place of a ghost; the sidebar's empty hierarchy; the sidebar's root; and "The project sidebar always has full context", under a collapsed project;
  - §2's "Why not the half of the hovered card", its last sentence;
  - §7's "the same ruleset as the project sidebar, deliberately";
  - the Open question "Whether a Card shows its whole hierarchy", its sentence about the sidebar.

  The shared rule (the gap, the depth range, the worked example and the boundaries) stays on board-drag-interaction, or moves to a page both cite. That's the PO's structure call in batch 1. The Architect still leans to staying, which moves fewer pointers.
- **What the new page adds.** Each of these is a ruling for Nathan in batch 1, since no page states it:
  - D1's three behaviors that tests pin;
  - the set-down rule, which is already ruled. It's `**Planned:**` until batch 3 builds it.
- **Name the page for the lasting feature,** per the wiki README: the project tree, not the sidebar gesture. Then the project API's rules have a home when D5's follow-up writes them. The exact name is the PO's call.
- **The sidebar's cases get tests here, not in Story 10** (confirmed by Nathan, 2026-10-05). DRAG-4.26, 4.28 and 4.31 are `Open`, and no test carries their IDs.
  - Story 10 defers the board's drag tests because their thresholds are still being tuned. The sidebar has no pop clocks or bands, so that reason doesn't apply to it.
  - Batch 3 maps the four internal tests A3's run lists, each with Nathan's approval.
  - It writes one E2E sidebar drag, for what only the browser shows: the line, and that a release saves what the line shows.
  - It writes tests for the rules the page newly states.

### D2 The Sheet's rules get a page of their own

From A5's D2 (ATT-4.13, ruling 14):

> **ATT-4.13.** Item parent picker is on the Item Sheet and should probably live in a seperate space from where it lives in the current wiki heirarchy. Rules that describe Sheet components should fall into a bucket of work that is classified as in-progress and minimally functioning code is good enough until we get to epic 7

*Added by the Architect (2026-09-30), from A5's grooming:*
- **The bucket is a wiki page for the Sheet,** whose header says its rules stay provisional until the Work Item Detail & Chat UI epic (Epic 7 on today's roadmap). The docs have one marker, `**Planned:**`, which means decided but not built. The Sheet is the other way round: built, with its rules not settled. Whether the page's header is enough, or the standards guide needs a marker for it, is the Architect's call when this story is planned.
- **Its cases move there:** ATT-4.12 and 4.13, both `Pending PO`, routed here by ID from A5a. ATT-4.13's question (does the picker offer parents from other projects?) waits for the Sheet epic.
- **The over-cap picker is covered by the ruling, not fixed.** A4's handoff to Nathan: `hierarchy.ts::buildParentOptions` offers parents at which the item's subtree would exceed the depth cap, and picking one gets the API's 400. Item-attachment §7 says the UI never offers a target the API would refuse. Under ruling 14, the Sheet's page states the gap as provisional until the Sheet epic. The roadmap's Sheet epic already notes the fix.
- **A5a changes the Sheet's code, not its rules.** Under A5a's R6, the parent picker sends `isAttached: true` when reparenting a top-level item, which keeps today's behavior until the Work Item Detail & Chat UI epic. Nathan ruled it an implementation detail, so the page doesn't state it. A5a's handoff names anything else that changed.

*Planned by the Architect (2026-10-04), revised with Nathan's answer (2026-10-05):*
- **What Nathan wants** (2026-10-05): "it to be clear that the page layout and behavior is in a placeholder state until epic 7 so we don't need to spend a lot of effort precisely defining the things we know are in flux or developing robust test plans." He's agnostic about whether that takes a marker.
- **How the page does it, with the wiki's existing parts:**
  - **The page's opening paragraph says the Sheet isn't designed yet,** in the present tense. The wiki names no epic, so the roadmap says when the Sheet gets designed.
  - **What the Sheet does today goes under Open questions.** The wiki README already sends "a placeholder look" there, and nothing in Open questions derives a test case. That includes:
    - the parent picker: its own project only, without the item or its descendants, and no depth cap;
    - the Attached checkbox, shown only when the item has a parent;
    - the children list, with each child's Attached/Detached toggle;
    - the add-child;
    - ATT-4.13's question, whether the picker offers parents from other projects.

  So no new marker and no guide change are needed. The README says "Nothing marks status at page level", meaning the Planned marker. Whether the opening paragraph needs a line in the README allowing it is the PO's call.
- **What the page doesn't restate.** A rule that holds on every surface is stated once, on its own page. A Sheet write follows item-attachment like any other: an attached child takes its parent's workphase, for example (A5a's handoff). The flag the picker sends on a first parent stays unstated (A5a's R6).
- **The over-cap picker is tracked in the roadmap, not as a rule.** The Work Item Detail & Chat UI epic's entry already carries the fix. Item-attachment §7 says the UI never offers a target the API would refuse. The PO says, in §7 or on the Sheet's page, how that meets a surface whose design is a placeholder.
- **Its cases: no robust test plan.**
  - ATT-4.12 and 4.13 are resolved against the new text: deleted, or moved and routed by ID to the Work Item Detail & Chat UI epic's entry. That's the Test Planner's call, and the Architect names any routed case in the entry.
  - The Sheet's catalog folder may hold only its INDEX until the Sheet is designed.
  - This story writes no Sheet tests.

### D3 The sweep for other misplaced rules

The Goal asks for a full sweep of the wiki, and a check that automated tests live in the right files. A2 already swept the wiki's wording, so (Nathan, 2026-09-30):
- **The wiki sweep** is a PO pass for rules on the wrong page only.
- **The test-file check** covers the tests for cases that move.

*Planned by the Architect (2026-10-04):* the sweep runs in batch 1, before anything is written, so what it finds joins the same ruling stop and the same move. The sidebar's tests are unit tests beside their modules (`hierarchyPlacement.test.ts`, `projectTreeUtils.test.ts`), which is where the testing guide puts them, so the test-file check is expected to find nothing to move. Batch 3 confirms it.

### D4 Re-point comments when a rule moves

*Added by Nathan on behalf of The Coder (2026-09-30):*
- **Re-point comments when a rule moves.** it matters because the checker can't catch it: §7 and §7.1 still exist after the sidebar's rules move out, so stale pointers pass. The sites are:
  - useProjectDragReorder.ts's header;
  - projectTreeUtils.ts::fullChildrenOf;
  - hierarchyPlacement.ts's header and root CLAUDE.md's "One position math layer", which cite §7/§7.1 for the rule the board and sidebar share.

From A4's handoff to A5 (`docs/archive/a4-code-comment-sweep.md`): every pointer A4 wrote cites the wiki as it stood. When a rule moves or is renumbered, the comments that cite it are found by searching for `wiki <page> §N`. Root `CLAUDE.md`'s citation goes to the Architect.

*Planned by the Architect (2026-10-04):* a search on 2026-10-04 found nothing past the list above.
- **Re-pointed:**
  - `useProjectDragReorder.ts`'s header and `projectTreeUtils.ts::fullChildrenOf` always move;
  - `hierarchyPlacement.ts`'s header and root `CLAUDE.md`'s citation move only if the shared rule does.
- **Stay:** the board's own pointers at §7, §7.1 and §7.2. These are in `descendantsProjection.ts`, `dragCollision.ts`, `DragSessionContext.ts`, `dragChrome.tsx`, `hierarchyPlacement.ts`'s cycle note, and `components/workflow/CLAUDE.md`.
- **None for the Sheet.** Its page holds no numbered rules for code to cite (D2, revised 2026-10-05).

### D5 The project tree's other rules: a follow-up story

*Added by the Architect (2026-10-04), found while planning:*
- **No page states the project API.** That covers creating, editing, moving and deleting a project, and the project page's parent dropdown, which reparents through `PUT /projects/:id`. Tests pin much of it without case IDs: `server/tests/routes/projects.test.ts`, `tests/api/projects.spec.ts` and `tests/ui/project-page.spec.ts`.
- **Two gaps, which a page would have to rule on:**
  - **A reparent through `PUT /projects/:id` keeps the project's old position number,** which is then compared against its new siblings. So where it lands among them is arbitrary. `PATCH /projects/:id/move` re-resolves the position, appending when the write names no neighbor. Item-positioning §2.1 re-resolves an item whose scope changes. Projects share that position system (root `CLAUDE.md`, "Positioning"), and Nathan wants project and item tree operations to match.
  - **`POST /projects` stores a `parentId` that names no project.** The column is a soft reference, and the route doesn't check it, so the project is orphaned: the sidebar walks down from the top and never reaches it. `PUT` and `PATCH /move` do check, and an item create is refused the same way (ATT-4.1).
- **A follow-up story, A5d, after A5c** (Nathan, 2026-10-05), shaped like A5c:
  - the PO writes the project rules onto the page A5b creates, each unstated rule as a ruling;
  - the Test Planner writes the catalog;
  - the Coder fixes the two gaps and maps the tests.

  Its plan is `a5d-project-tree-rules.md`.
- **What the page takes** (Nathan, 2026-10-05): "If it's a rule that might be described as a business rule or a behavior rule (position is determined by anchor+side, midpoint is coarsest fit, etc) then it belongs in the wiki. If it API contract details like - the Request needs these request params to do the calculation and the UI needs those return params to display everything - then we'll leave documentation to openapi". That's the split C7 of `api-contract-zod-openapi.md` already makes. It holds for the sidebar's rules in this story too.

### D6 The board toolbar's "New child items go to" control

*Added by the Architect (2026-10-04), from A5a's handoff:*
- **It feeds nothing.** It set the workphase of a child created from the Sheet. The server ignored that for an attached child, and every child the Sheet creates is attached. A5a's batch 2b removed the pass-through, and the control, its state in `BoardView.tsx` and its `kanban_child_col_*` localStorage key are left.
- **Ruled (Nathan, 2026-10-05): batch 3 removes it.** That's the control in `BoardToolbar.tsx`, its state in `BoardView.tsx`, and the localStorage key. No page states it.

## Work, in batches

Each batch ends with a stop for Nathan's review and commit. A batch that changes code ends with the gate first.

**Batch 1: the PO's proposal.** No living doc changes yet.
- The D3 sweep: each rule on the wrong page, with a proposed home.
- The structure:
  - the project tree page: its name, its sections, and whether the shared gap-and-depth rule stays on board-drag-interaction;
  - the Sheet's page: its name, its opening paragraph, and its Open questions (D2).
- The rulings each newly stated rule needs: D1's three behaviors, and anything the sweep or the Sheet's controls turn up.
- All of it goes in this plan's Amendments, for Nathan.
- **Stop:** Nathan rules on the structure and the rulings.

**Batch 2: the pages and the cases.**
- **The PO:**
  - writes the two pages: the project tree's with each moved rule, each ruling, and the set-down as `**Planned:**` (D1); the Sheet's as D2 describes;
  - updates board-drag-interaction and item-attachment where rules left them, including how item-attachment §7 meets the Sheet (D2);
  - lists the old → new anchors in the Handoff.
- **The Test Planner:**
  - writes two new catalog folders, named like the pages;
  - moves DRAG-4.26, 4.28 and 4.31, and ATT-4.12 and 4.13, with new IDs, listing old → new in the Handoff;
  - resolves ATT-4.12 and 4.13 against the new text (D2);
  - writes cases for the rules the project tree's page newly states, and for any rule the sweep moves;
  - updates the INDEX pages.
- **The Architect:**
  - names any case routed to the Work Item Detail & Chat UI epic in its roadmap entry;
  - moves root `CLAUDE.md`'s citation, if the shared rule moved.
- `npm run check:docs` reports 0 hits.
- **Stop:** Nathan reviews the pages.

**Batch 3: the code** (Coder).
- **The set-down.** `useProjectDragReorder.ts::handleDragEnd` sends nothing when the projection resolves to the project's own gap at its own depth, as the board does (`hierarchyPlacement.ts::ownSlotOf`, `descendantsProjection.ts::descendantsReleasePlacement`). A test carries its case ID.
- **The sidebar's tests** (D1):
  - proposes each internal mapping for Nathan's approval at this batch's stop;
  - writes the E2E sidebar drag;
  - writes tests for the newly stated sidebar rules.
- **Re-titles** any test that carries a moved ID. No test carries DRAG-4.26, 4.28 or 4.31, or ATT-4.12 or 4.13. TC-5a.6's test does: it becomes DRAG-6.14, and the Test Planner moves the case in the same batch (Nathan, 2026-10-05).
- **D4's pointers,** using batch 2's anchor map, and index pointers to the project tree page's sections in the modules that enforce them.
- **D6:** removes the toolbar control.
- **The test-file check** (D3).
- **The gate** plus `npm run test:e2e`, since there's a new spec.
- **Stop:** Nathan approves the internal mappings, and reviews.

**Close.**
- **The PO** takes the set-down's marker off and fills in the Handoff's "Wiki sections added, changed, moved or removed".
- **The Test Planner** moves the set-down's case from `Planned` to `Open`.
- **The Reconciler** runs over the four touched catalogs, the two new ones, board-drag-interaction and item-attachment, and over item-positioning, for A5a's cases (Nathan, 2026-10-05).
- **The Architect** archives this plan when Nathan signs off.

## Code map

The starting list. The Coder keeps it current.

| File | Batch | Change |
|---|---|---|
| `client/src/components/sidebar/useProjectDragReorder.ts` | 3 | Done: `handleDragEnd` writes only what `projectTreeUtils.ts::releaseOf` returns, so a set-down in the project's own slot sends nothing (D1), and `handleDragMove` reads the project's own row as the gap its block collapses to (the PO's own-row ruling). Its header cites `wiki hierarchy-placement §1` and `wiki project-tree §1`, and the `expand` call `wiki project-tree §2` (D4) |
| `client/src/components/sidebar/projectTreeUtils.ts` | 3 | Done: new `releaseOf`, the set-down, which compares the projection's gap and depth with `hierarchyPlacement.ts::ownSlotOf` over the render list. `fullChildrenOf` and `resolveGap` cite `wiki project-tree §1` (D4) |
| `client/src/lib/hierarchyPlacement.ts` | 3 | Done: its header cites `wiki hierarchy-placement §1`, `toRows` §4 and `ownSlotOf` §5 (D4) |
| `client/src/components/sidebar/SortableProjectRow.tsx` | 3 | Done: test surfaces `data-drop-line` (the side of its row the line is drawn on) and `data-drag-overlay` (the carried copy); `rowOpacityClass` cites `wiki project-tree §2` |
| `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts` | 3 | Done, for Nathan's approval: the four internal tests A3's run lists carry TREE-1.3, 1.4 and 1.5 (D1) |
| `client/src/components/sidebar/useProjectDragReorder.test.ts` | 3 | New: TREE-1.2 to 1.6, 1.8 and 1.9, through the hook, asserting the `onReorderProject` call (D1) |
| `tests/ui/project-tree-drag.spec.ts`, `tests/pages/ProjectSidebarPage.ts`, `tests/helpers/seed.ts` | 3 | New spec: TREE-1.1, 1.7, 1.8, 1.9, 2.1 and 2.2 (D1). The page object gains the handle and line locators, and `seed.ts` gains `seedProjects` and `fetchProject` |
| `client/src/components/workflow/itemWriteReconciliation.test.ts` | 3 | Done: TC-5a.6's test is DRAG-6.14, after the Test Planner moved the case |
| `client/src/components/BoardToolbar.tsx`, `BoardView.tsx` | 3 | Done: the "New child items go to" control, its state, the Backlog default that seeded it and its `kanban_child_col_*` key are gone (D6) |
| `client/src/components/workflow/CLAUDE.md` | 3 | Done: its opening paragraph names the `hierarchy-placement` page beside board-drag-interaction and item-attachment. The Descendants bullet cites `wiki hierarchy-placement §1` for the gap + depth rule, as board-drag-interaction §7.1 applies it. Its §3.2, §7.2 pointer for the over-cap state stays (D4) |
| Root `CLAUDE.md` | 2 | Done: "One position math layer" cites `wiki hierarchy-placement §1`, and the repo layout lists the new pages (Architect) |
| `docs/planning/mvp-roadmap.md` | 2 | The Work Item Detail & Chat UI epic's entry names any case routed to it (Architect) |

## Acceptance

- No sidebar-only rule is left on board-drag-interaction, and no sidebar case is left in DRAG-4. If the shared rule stays there, it says the sidebar uses it.
- The Sheet has a page that says its design is a placeholder, with what it does today under Open questions. ATT-4.12 and 4.13 are resolved.
- Every moved case has a new ID, listed old → new in the Handoff. `check:docs` finds no retired ID in a test or a doc.
- A sidebar set-down in the project's own slot writes nothing, and a test carrying its case ID shows it.
- Every sidebar case is `Automated`. Any Sheet case left is routed by ID to the Work Item Detail & Chat UI epic.
- The toolbar's "New child items go to" control is gone.
- No comment cites a section for a rule that has left it (D4).
- `npm run check` and `npm run test:e2e` pass, and the Reconciler's run reports no lost coverage.
- A5a's cases, folded in at batch 2, are `Automated` or routed by ID, and ATT-9.10 is answered.

## Handoff

- **Wiki sections added, changed, moved or removed, with old → new anchors** (PO):
  - *Written by the PO, batch 2 (2026-10-05).* `check:docs -- docs/wiki` reports 0 hits on 8 files.
  - **Added:**
    - **`hierarchy-placement`**, the shared rules: §1 gap and depth (with the worked example, its entries renamed `A › A1 › A1a`, then `B`), §2 boundaries, §3 the root, §4 the dragged entry carries its whole subtree, §5 a set-down in its own gap writes nothing. No catalog of its own.
    - **`project-tree`:** §1, dragging a project places it by gap and depth (the sidebar's rules, call 3's deduction, call 4's no cap, and the set-down as `**Planned:**`); §2, what the drag shows (calls 2a and 2b).
    - **`item-sheet`:** an opening paragraph saying the Sheet isn't designed yet, and Open questions only (D2, call 5).
  - **Moved, old → new:**

    | Old | New |
    |---|---|
    | board-drag-interaction §7.1: the gap, the depth range, the tab states and the worked example | hierarchy-placement §1 |
    | board-drag-interaction §7.1: the boundaries | hierarchy-placement §2 |
    | board-drag-interaction §7.1: "The root, per context", its general rule | hierarchy-placement §3 |
    | board-drag-interaction §7.1: the set-down in its own gap writes nothing, its general rule | hierarchy-placement §5 |
    | board-drag-interaction §7.2: the dragged item carries its whole subtree, its general rule | hierarchy-placement §4 |
    | board-drag-interaction §7.1: the indicator line, the sidebar's root, the sidebar's empty hierarchy, "The project sidebar always has full context" | project-tree §1 |
    | board-drag-interaction §2, "Why not the half of the hovered card": its sentence on the sidebar's line | project-tree §1 |
    | item-positioning §5a: "On the board, the inversion check runs only for a write the board previewed" | board-drag-interaction §10 |

  - **Changed where they stand:**
    - board-drag-interaction: the Related line gains hierarchy-placement. §7's "the same ruleset as the project sidebar, deliberately" now cites hierarchy-placement. §7.1 and §7.2 keep the board's own application: the gap as the ghost's neighbors, root `P`, no empty hierarchy, the set-down against a column's, the subtree travelling with the carried copy, and the depth cap per tab state, unchanged. The Open question "Whether a Card shows its whole hierarchy" cites hierarchy-placement §1 and project-tree §1.
    - item-positioning §5a: a one-line pointer to board-drag-interaction §10 replaces the paragraph that moved.
    - item-attachment §7: "The two enforcement points must agree" holds for the board's drag, and the Sheet's parent picker is outside it while the Sheet isn't designed (call 5). §12's Sheet bullet links item-sheet.
    - The wiki README's "Page layout": a page of shared rules (no catalog of its own), and a page for a feature that isn't designed yet.
  - **No section was renumbered or removed.** board-drag-interaction §7.1 and §7.2 keep their numbers and headings.
  - **For the Test Planner:**
    - The new pages link `test-plans/project-tree/` and `test-plans/item-sheet/`, so those are the folder names.
    - The test-plans README mirrors the wiki README's shared-page rule.
    - A case that cites board-drag-interaction §7.1 or §7.2 for a general rule above now cites hierarchy-placement. A case for the board's own application keeps §7.1 or §7.2.
    - A case that cites item-positioning §5a for the board's check now cites board-drag-interaction §10.
  - **For the Coder's D4 pointers in batch 3,** found by searching for `wiki board-drag-interaction §7`:
    - `useProjectDragReorder.ts`'s header and `projectTreeUtils.ts::fullChildrenOf` go to project-tree §1;
    - `hierarchyPlacement.ts`'s header goes to hierarchy-placement §1, and `hierarchyPlacement.ts::toRows` to §4;
    - each board pointer that cites §7.1 or §7.2 for a general rule moves to the matching hierarchy-placement section. One for the board's own application stays, such as `dragCollision.ts::dropAnchorFor` for the gap as the ghost's neighbors, and `descendantsProjection.ts::advanceProjection` for the cap per tab state;
    - the set-down is in both places: the general rule at hierarchy-placement §5, the board's application at board-drag-interaction §7.1. The index pointer goes at the site that mainly enforces it;
    - root `CLAUDE.md`'s citation goes to hierarchy-placement (the Architect).
- **Moved cases, old → new** (Test Planner):
  - *Written by the Test Planner, batch 2 (2026-10-05).* No test carries an old ID, so nothing needs re-titling.

    | Old | New |
    |---|---|
    | DRAG-4.26 | TREE-1.1 (the line) and TREE-1.2 (the depths and their placements) |
    | DRAG-4.28 | TREE-1.3 (the top level as the floor) and TREE-1.4 (the empty hierarchy) |
    | DRAG-4.31 | TREE-1.5 |
    | ATT-4.12 | deleted |
    | ATT-4.13 | deleted |
    | TC-5a.6 | DRAG-6.14 (batch 3, beside its test's re-title) |
- **From the Coder, batch 3 (2026-10-05):**
  - **For the PO:**
    - **At Close, the set-down's `**Planned:**` comes off project-tree §1.** The build is in.
    - **Behavior decision, for a ruling: the cursor comes back to the dragged project's own row** (not a row of its subtree). The sidebar keeps the last line, where the cursor was before, and a release saves it. Before the cursor has left, there's no line, and a release writes nothing. project-tree §1 rules only on resting on the subtree's rows. On the board the ghost goes back to its own slot. If the sidebar should too, it's a small change to `useProjectDragReorder.ts::handleDragMove`, and TREE-1.8 would then hold for a return to the own row as well.
    - **Behavior decision: with no eligible row, no line is drawn** (TREE-1.4's tree: the dragged project's subtree holds every project). There's no row to draw it against. The release writes nothing, since that one depth is the own slot. project-tree §1 says nothing of the line there.
  - **For the Test Planner:**
    - **TREE-1.8 to `Open` at Close,** with the PO's marker.
    - **TC-5a.6 to DRAG-6.14.** Its test (`itemWriteReconciliation.test.ts`, "TC-5a.6: a write the board never previewed…") still carries the old ID. It becomes DRAG-6.14 in the same commit as the catalog move, since the checker rejects a title whose case isn't there. I held the re-title for that reason.
    - **The tests that carry sidebar IDs,** for the Reconciler's Automation lines:
      - `tests/ui/project-tree-drag.spec.ts`: TREE-1.1, 1.7, 1.8, 1.9, 2.1, 2.2;
      - `client/src/components/sidebar/useProjectDragReorder.test.ts`: TREE-1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9;
      - `client/src/lib/hierarchyPlacement.test.ts`: TREE-1.3, 1.4, 1.5;
      - `client/src/components/sidebar/projectTreeUtils.test.ts`: TREE-1.5.
  - **For the Reconciler, with Nathan's approval:** the internal mappings are the three unit-test files above, since they call a client hook and modules directly. The E2E spec needs no approval. The four existing tests, in `hierarchyPlacement.test.ts` and `projectTreeUtils.test.ts`, are A3's list. The hook's tests are new, and assert the exact `onReorderProject` call a gesture makes.
  - **To A5d:** `App.tsx::handleReorderProject` merges only the moved project into the sidebar's state, and `positionResolver.ts` says project moves don't disclose a reindex. If a move ever triggers one, the renumbered siblings keep their old positions on the client until the next fetch. Found by reading; no test ran it. Item writes disclose and fold in (root `CLAUDE.md`'s "Reindex disclosure"), and Nathan wants project and item operations to match.
- **To the Work Item Detail & Chat UI epic:** the Sheet's page and its Open questions, and any case routed there, named in its roadmap entry (batch 2).
- **To A5d:** the project tree's page, which this story creates.

## Open questions

For Nathan, at plan approval. All four are answered. Question 5 came later.
1. **D5:** the project tree's other rules and its two gaps go in a follow-up story, A5d, after A5c.
   - **Answered (Nathan, 2026-10-05):** business and behavior rules go in the wiki, and API contract details go to OpenAPI. The Architect reads that as approving A5d, scoped to behavior rules, and wrote its plan.
2. **D6:** remove the toolbar's "New child items go to" control in batch 3.
   - **Answered (Nathan, 2026-10-05):** yes, since it's dead.
3. **D2:** no new marker, and the Sheet's rules spread over rule, Planned and Open question.
   - **Answered (Nathan, 2026-10-05):** he's agnostic about a marker. What matters is that the Sheet's layout and behavior read clearly as a placeholder until the Sheet epic, with no precise rules or robust test plans. D2 is revised to match.
4. **D1:** the sidebar's cases get their tests here, not in Story 10.
   - **Answered (Nathan, 2026-10-05):** yes.
5. **For the PO, before close** (from A5a, folded in at batch 2): ATT-9.10. Item-attachment §2a gives an item leaving attachment the workphase it was shown in, or refuses the write when there's none, and lists three writes it applies to: a detach, a reparent to root and a create. §11 calls a detach that lands under a different parent a reparent, not a detach. Does the rule apply to a reparent that leaves an Attached item Free under a new parent? A5a's batch 2b applies it, and §2a's first sentence reads as though it does. If it does, the list names a fourth write.
   - **Answered (PO, 2026-10-05), a deduction:** yes. §2a's rule is "a write that leaves an item Free without naming a workphase gives it the one it was shown in", and a detach that also reparents is such a write. The list now names it as a fourth write: the item takes the workphase it was shown in before the write, under its old parent, which is what A5a's batch 2b built. ATT-9.10 can leave `Pending PO`.

## Amendments

- **2026-10-05, Nathan's answers at plan approval** (Open questions 1–4).
  - D2 is revised. The Sheet's page says its design is a placeholder, and puts what it does today under Open questions. The picker's cap is no longer a Planned rule; the roadmap tracks it. The Sheet gets no cases beyond resolving ATT-4.12 and 4.13, and no index pointers.
  - D5 is approved, as A5d, scoped to behavior rules.
  - D6 is ruled: batch 3 removes the control.
  - D1's tests land here.
- **2026-10-05, batch 1 (the PO): the proposal.** No living doc has changed. Each numbered call is for Nathan, with the PO's recommendation first.
  - **The D3 sweep.** The PO read all five wiki pages for rules on the wrong page. Besides the sidebar's passages (D1) and the Sheet (D2), it found:
    - **S1. item-positioning §5a's paragraph "On the board, the inversion check runs only for a write the board previewed".** It's board behavior: the board's preview, its pending placement, and the tuning panel's inversion log. board-drag-interaction §10 already holds the rest of the inversion rule, so the rule is split across two pages. Proposed home: board-drag-interaction §10, with §5a keeping a one-line pointer (call 6).
    - **S2. item-positioning §6's "Column range validation":** a column never spans a terminal and a non-terminal workphase. It's a column rule, and its home is boards-columns-unsorted. A5c writes that page out in full and already takes the column-range 400s, so it moves there, not here (call 7).
    - **S3. item-attachment §12's Sheet bullet** defines the Sheet. It stays, since §12 is the wiki's list of representations, and gains a link to the Sheet's page.
    - **Looked at and left in place:**
      - item-positioning §4 (a merged column's union-sort, and its drop rule) says how positions order and resolve, and board-drag-interaction cites it;
      - board-drag-interaction §4's `itemDepthCap` paragraph names an API field, which is the API contract epic's to document, not a rule on the wrong page;
      - item-attachment §8 grounds the cap in the sidebar's width, which is a reason, not a sidebar rule.
  - **The project tree's page.** Folder `project-tree`, titled "Project Tree". Its question: how projects nest and are ordered, and how the sidebar rearranges them. A5d adds the project API's rules.
    - **Call 1: the shared gap-and-depth rule stays on board-drag-interaction** (§7.1, §7.2), and the project tree's page cites it, stating only what differs.
      - Why: the wiki states a rule that holds on more than one surface once, and pages already cite each other for it. A5d's project positions will cite item-positioning the same way. It also moves the fewest anchors.
      - The other way: a page of its own for the shared rule, cited by both. That reads more cleanly, but a new page needs its own catalog. The generic placement cases (DRAG-4.8 to 4.10 and their tests) would move and be re-titled, and more pointers would move.
    - **Sections (written in batch 2):**
      - **§1, "Dragging a project places it by gap and depth":**
        - the shared rule, cited;
        - an indicator line in place of a ghost: the line is the gap, and a release saves what the line shows (from board-drag-interaction §2's last sentence and §7.1);
        - the root at the top of the tree (from §7.1);
        - the empty hierarchy (from §7.1);
        - full context under a collapsed project (from §7.1);
        - resting on the dragged subtree (call 3);
        - no depth cap (call 4);
        - a set-down in its own slot writes nothing, as `**Planned:**` (ruled 2026-09-30).
      - **§2, "What the drag shows":** dimmed descendants (call 2a), and a collapsed project opening (call 2b).
      - A5d's rules take the next free numbers, from §3.
    - **What stays on board-drag-interaction:**
      - the shared rule, worded for any hierarchy, and the board's root, `P`;
      - §7's "the same ruleset as the project sidebar, deliberately" becomes a pointer: the project tree's drag uses the same rule (project-tree §1);
      - §7.1's empty-hierarchy boundary keeps its board sentence and points to project-tree §1 for where it arises;
      - the Open question "Whether a Card shows its whole hierarchy" points to project-tree §1 for the sidebar.
    - **Anchors that move:** board-drag-interaction §2's last sentence, and §7.1's indicator line, sidebar root, sidebar empty hierarchy and full context, all to project-tree §1. Under call 1 nothing else moves, so D4 re-points only `useProjectDragReorder.ts`'s header and `projectTreeUtils.ts::fullChildrenOf`.
  - **Rulings the page newly states:**
    - **Call 2a: the dragged project's descendants are dimmed for the whole drag,** so the branch reads as going with it, and none of it is a place to drop. On the board, a carried Card's Stubs go with it the same way (board-drag-interaction §5a). Recommended: yes. It's how the sidebar shows what isn't possible, which Nathan's ruling on A4's click-or-drag question said the wiki should describe.
    - **Call 2b: dropping a project into a collapsed project, as its child, opens it,** so the moved project is in view. That matches the board, where a Card the item is attached into stays open (board-drag-interaction §1.1). Recommended: yes.
    - **Call 3, a deduction to confirm: resting on a row of the dragged project's own subtree points at the gap the subtree leaves,** which is its own slot. It follows from §7.2, where the subtree is taken out before any gap is computed. The sidebar still draws those rows, dimmed, and draws no ghost, so the line goes where the subtree was.
    - **Call 4: project depth has no cap,** so every tab state in the range is valid. §7.2's cap is the item cap (item-attachment §8), and no page caps projects. Root `CLAUDE.md` describes the project tree as unlimited depth. Recommended: yes, with A5d stating the tree's depth rule.
  - **The Sheet's page.** Folder `item-sheet`, titled "Item Sheet". It has no numbered sections, only Open questions.
    - **Opening paragraph (draft):** "The Sheet is an item's full detail view. It isn't designed yet. What it does today is a working placeholder, described under Open questions, so this page states no rules of its own and no test case is derived from it. A write made from the Sheet follows the same rules as any other ([item-attachment], [item-positioning])."
    - **Open questions:**
      - the Sheet's layout and behavior as a whole;
      - the parent picker. It lists its own project's items, without the item and its descendants, and applies no depth cap, so it can offer a parent the API refuses, and picking one shows the API's error. Whether it offers other projects' parents is ATT-4.13's question;
      - the Attached checkbox, shown only when the item has a parent;
      - the children list, with each child's Attached/Detached toggle;
      - the add-child, which creates an Attached child that takes the item's workphase.
    - **Call 5: how item-attachment §7 meets the Sheet.** §7 says the UI never presents a target the API would reject. Recommended: §7 says that holds for the board's drag, and that the Sheet's placeholder parent picker is outside it while the Sheet isn't designed (item-sheet's Open questions). Otherwise §7 stays as is, and the picker breaks an unmarked rule.
    - **The wiki README (the PO's call, no ruling needed).** "Page layout" gains one line: a page for a feature that isn't designed yet says so in its opening paragraph, keeps what the feature does today under Open questions, and may have no numbered sections. "Nothing marks status at page level" stays, since it's about the Planned marker.
  - **Calls 6 and 7, from the sweep:**
    - **Call 6:** S1 moves to board-drag-interaction §10 in batch 2. Recommended: yes. The Test Planner rehomes any case that cites §5a for it.
    - **Call 7:** S2 goes to A5c, and A5c's plan names it. Recommended: yes.
- **2026-10-05, Nathan's rulings at batch 1's stop.**
  - **Agreed as recommended:** calls 2a (dimmed descendants), 2b (a collapsed project opens on a drop into it), 4 (project depth has no cap), 5 (item-attachment §7 holds for the board's drag, and the Sheet's placeholder picker is outside it), 6 (item-positioning §5a's board paragraph moves to board-drag-interaction §10) and 7 (the column range rule goes to A5c, whose plan now names it).
  - **Call 1, ruled the other way:** shared rules get a page of their own, which each component's page points to. A component's own handling, or its exceptions, go on its own page as further bullets or sections. The test plans flatten: each component's catalog holds every case that applies to it, shared rules included. Follow-ups are under discussion.
  - **Call 3, confirmed:** resting on a row of the dragged project's own subtree means the gap that subtree collapses to, which is the project's own gap. The depth range still applies there. It's what the board does by construction, applied to rows the sidebar still draws.
  - **Call 1's follow-ups, ruled:**
    - **The shared page is `hierarchy-placement`.**
      - It takes the gap and the depth range, the worked example, the boundaries, "each surface names its root", the set-down rule, and "the dragged item carries its whole subtree".
      - board-drag-interaction §7 keeps the ghost's neighbors from the shuffle, root `P`, "zooming in doesn't move the ghost", the depth cap per tab state and its invalid cue, and the Card's whole-hierarchy question.
      - project-tree §1 keeps the sidebar's own rules.
    - **A page of shared rules has no catalog.** Each component's catalog tests the shared rules as that component applies them, so DRAG-4's board cases stay, and only their Rule lines change. The wiki README says so (the PO, batch 2), and the test-plans README follows (the Test Planner, batch 2).
    - **Positions get the same split in A5d, not here.** A5d's plan says so.
  - **D4 grows:** `hierarchyPlacement.ts`'s header, root `CLAUDE.md`'s citation, and the board's pointers to a shared part of §7.1 or §7.2 move to `hierarchy-placement`. Batch 2's anchor map lists each one.
- **2026-10-05, batch 2 (the Architect).**
  - **Root `CLAUDE.md`:**
    - "One position math layer" cites `wiki hierarchy-placement §1`, and calls the rule the one the board's Descendants layer and the project sidebar share, not the Card's own;
    - the repo layout's wiki line names hierarchy placement and the project tree, and its test-plans line says a page of shared rules has no catalog.
  - **`documentation-standards.md`:** "the test-plan folders mirror the page names" gains the exception for a page of shared rules, pointing to the wiki README. It's a `.claude/` guide, so Nathan approves it at this stop.
  - **`client/src/components/workflow/CLAUDE.md` goes to the Coder in batch 3,** not here. A directory's `CLAUDE.md` belongs to whoever changes code in that directory (the standards guide's ownership table), and batch 3 re-points that directory's comments. Its two citations are in the Code map.
  - **The Work Item Detail & Chat UI epic's roadmap entry waits for the Test Planner.** It routes ATT-4.12 "to A5b as `Pending PO`". Once the Test Planner resolves ATT-4.12 and 4.13, the Architect rewrites that line: it names any case routed there, or says the Sheet's page holds the picker under Open questions.
    - *Done, after the Test Planner's batch 2.* The entry gains a bullet for the `item-sheet` page, which says the Sheet isn't designed yet: this epic designs it, then the PO writes its rules and the Test Planner its cases. The over-cap bullet now says item-attachment §7 leaves out the placeholder picker, and that the fix is still this epic's. It also says no case tracks it, since ATT-4.12 is deleted and ATT-4.13's question is under the Sheet page's Open questions.
  - **Story 10's item-positioning line** in `epic-3-5-roadmap.md` routes TC-2.32, 6.10 and 7.18 to A5b, which took over A5a's close-out (the Test Planner's note).
  - `npm run check:docs` reports 0 hits on 260 files.
- **2026-10-05, batch 2 (the Test Planner): the catalogs follow the pages.**
  - **The project tree's catalog** is `test-plans/project-tree/`, prefix `TREE`, with one suite per section of the page. Under call 1's flattening it tests the shared rules as the sidebar applies them, beside the sidebar's own:
    - TREE-1.1, the line, and a release saving what it shows;
    - TREE-1.2, a gap's depths and the placement each saves;
    - TREE-1.3, the boundaries, and the top level as the floor;
    - TREE-1.4, the empty hierarchy;
    - TREE-1.5, a collapsed project;
    - TREE-1.6, resting on the dragged subtree (call 3);
    - TREE-1.7, no depth cap (call 4);
    - TREE-1.8, the set-down, `Planned` until batch 3 builds it;
    - TREE-2.1, the dimmed descendants (call 2a), and TREE-2.2, a collapsed project opening (call 2b).

    All but TREE-1.8 are `Open`. They're this story's cases, and batch 3 tests them (D1).
  - **The moved cases** are in the Handoff. DRAG-4.26 and 4.28 each split in two, since the sidebar's catalog now states the shared placements and boundaries itself.
  - **ATT-4.12 and 4.13 are deleted.** The Sheet's page states no rules. Its parent picker, ATT-4.13's question included, is under its Open questions, which derive no case, and item-attachment §7 now leaves the picker out. No case is routed to the Work Item Detail & Chat UI epic, so its roadmap line can say the Sheet's page holds the picker (the Architect).
  - **The Sheet's catalog,** `test-plans/item-sheet/`, holds only its INDEX.
  - **Rule lines moved to hierarchy-placement,** where a case asserts a shared rule: DRAG-4.8, 4.9, 4.10, 4.11, 4.18 (its cycle), 4.29 and 4.33, and DRAG-5.9. Those that also assert the board's own application keep board-drag-interaction §7.1. DRAG-4.30 and 4.32 keep §7 and §7.2, since both are the board's own.
  - **TC-5a.6 cites board-drag-interaction §10,** and stays in TC-5a for now. Its rule moved pages, so it belongs in DRAG-6, but a test carries its ID, and moving it in this batch would fail `check:docs` until the test was re-titled. It can move as DRAG-6.14 in batch 3, beside that re-title, if Nathan wants it there.
  - **The test-plans README** says a page of shared rules has no folder, and a feature whose page says it isn't designed holds only its INDEX.
  - **INDEX pages:** the two new ones, and DRAG-4's line in board-drag-interaction's.
  - **For batch 3:**
    - A3's confirming run lists the internal tests that pin DRAG-4.28's and 4.31's rules: hierarchyPlacement's null-root and collapsed-Top tests, and projectTreeUtils'. Each is proposed against TREE-1.3, 1.4 or 1.5 now.
    - The E2E sidebar drag is TREE-1.1's, and the set-down's test carries TREE-1.8.
  - **Checks:** `check:docs` reports 0 hits on 264 files, and every table, heading, status and link in the catalog agrees. The catalog is 275 cases: 164 `Automated`, 89 `Open`, 15 `Planned`, 4 `Manual` and 3 `Pending PO`.
- **2026-10-05, Nathan's rulings at batch 2 (the Test Planner's recommendations), and A5a's step 3.**
  - **A5a's leftovers fold into this story.** A5a was archived before its step 3 (the Test Planner's pass) and step 5 (the Reconciler). So:
    - **The Test Planner applied A5a's step 3 pass** in this batch, against the wiki as A5a's step 2 left it:
      - `Open` from `Planned`, since their markers came off: ATT-1.14, 3.11, 5.9, 5.10, 9.2, 9.4 to 9.7 and 9.9; TC-2.32, 7.18 and 7.19;
      - deleted, since the passages they derived from are gone: ATT-5.4, 5.5 and 7.3, and TC-7.17. ATT-7.3's two tests already carry ATT-9.4, and the other three have none left;
      - ATT-1.7's detach paragraph and ATT-7.7's workphase clause cite §2a, the workphase the item was shown in. Their expected values are unchanged;
      - ATT-1.8 and 1.14 stay two cases, since a test carries each ID;
      - ATT-5's preamble no longer links TC-7.17.
    - **This story's close confirms them:** the Reconciler's run covers item-positioning too (Close).
    - **ATT-9.10 is this story's Open question 5,** for the PO.
  - **TC-5a.6 moves to DRAG-6.14 in batch 3,** beside its test's re-title.
  - **The cases this story carries, by ID:**
    - **the project tree's,** `Open`: TREE-1.1 to 1.7, TREE-2.1 and 2.2; and `Planned`: TREE-1.8;
    - **A5a's,** `Open`: ATT-1.8, 1.14, 3.11, 5.7, 5.9, 5.10, 9.1 to 9.9, 10.1 to 10.3; TC-2.32, 6.10, 7.18, 7.19, 7.20. The Coder's A5a amendments say each has a test;
    - **`Pending PO`:** ATT-9.10.
  - **For the Architect:** Story 10's item-positioning line in `epic-3-5-roadmap.md` routes TC-2.32, 6.10 and 7.18 to A5a. They're this story's now.
  - **Checks:** `check:docs` reports 0 hits on 264 files, and the catalog agrees with itself. It's 271 cases: 160 `Automated`, 102 `Open`, 2 `Planned` (ATT-1.10 and TREE-1.8), 4 `Manual` and 3 `Pending PO` (ATT-5.11 and TC-6.13 in Epic 4, and ATT-9.10 here).
- **2026-10-05, batch 3 (the Coder): the code.**
  - **Built:**
    - **The set-down (D1).** A project released in its own gap, at its own depth, sends no request. `projectTreeUtils.ts::releaseOf` compares the projection's gap and depth with `hierarchyPlacement.ts::ownSlotOf` over the render list, as the board does for a Stub, and `handleDragEnd` writes only what it returns. It doesn't open the parent either, since nothing moved. A release before the pointer left the project's own row already wrote nothing.
    - **D6.** The "New child items go to" control is gone, with its state in `BoardView.tsx`, the Backlog default that seeded it and its `kanban_child_col_*` key. `BoardToolbar` loses three props. Old keys stay in a browser's localStorage, unread.
    - **D4's pointers,** by batch 2's map:
      - `useProjectDragReorder.ts`'s header cites hierarchy-placement §1 and project-tree §1, and `fullChildrenOf` project-tree §1;
      - `hierarchyPlacement.ts`'s header cites hierarchy-placement §1, and `toRows` §4;
      - `workflow/CLAUDE.md` names hierarchy-placement in its opening paragraph and cites it from the Descendants bullet.
    - **Index pointers** at the sidebar's own enforcement sites: `releaseOf` project-tree §1, the hook's `expand` call §2, `SortableProjectRow.rowOpacityClass` §2 (the dimming), `resolveGap` §1 (resting on the subtree), and the library's `ownSlotOf` hierarchy-placement §5.
    - **Two test surfaces,** after the board's `data-drag-overlay`: `data-drop-line` on the line, and `data-drag-overlay` on the carried copy, which makes `release()`'s "drag finished" wait real for the sidebar.
  - **The Coder's calls:**
    - **The board's pointers stay at board-drag-interaction §7, §7.1 and §7.2.** Each states the board's own application: the gap as the ghost's neighbors, the cap per tab state, the set-down at `descendantsReleasePlacement`. The map says the set-down's index pointer goes at the site that mainly enforces it. I read that as one pointer per surface, so the board's stays at §7.1 and the sidebar's is project-tree §1.
    - **Five E2E tests, where the plan said one.** TREE-1.1 is the line and its save. TREE-1.7 needs the cap the API reports, which a unit test can't read. TREE-1.8 needs to see no request and an unchanged `updatedAt`. TREE-2.1 and 2.2 are what the drag shows. The placement cases, TREE-1.2 to 1.6, are unit tests through the hook. Any E2E test can drop to a unit test if Nathan prefers fewer.
    - **TREE-1.4's tree draws no line,** since no row is left to draw it against, and its release writes nothing. **A return to the dragged project's own row keeps the last line.** Neither is in the wiki; both are in the handoff for the PO.
  - **The test-file check (D3)** found nothing to move. The tests for each moved case sit beside their module: DRAG-4.8 to 4.11 and 4.18 in `hierarchyPlacement.test.ts`, 4.29 and 4.30 in `descendantsProjection.test.ts`, 5.9 in `drag-5-stub-detach.spec.ts` and `placement.test.ts`, and TC-5a.6's in `itemWriteReconciliation.test.ts`. No test carries DRAG-4.26, 4.28, 4.31, 4.33 or ATT-4.12, 4.13.
  - **Tests:**
    - **Unit, through the hook** (`useProjectDragReorder.test.ts`, 22 tests): TREE-1.2 (the depths of the A1a/B gap, each placement, the one-depth gap under A1), 1.3 (above the first row, below a nested last row, clamping, the floor), 1.4, 1.5, 1.6 (including that no depth makes the project a child of its own subtree) and 1.8 (the cursor leaving and returning, a release before leaving, a nested own gap from either neighbor, a project with children, and a write at another depth or in another gap).
    - **E2E** (`project-tree-drag.spec.ts`, 6 tests): TREE-1.1, 1.7, 1.8, 2.1 and 2.2 (both ways).
    - **The four internal mappings, proposed for Nathan's approval:** in `hierarchyPlacement.test.ts`, "a null root…" is TREE-1.3, "an empty hierarchy under a null root…" is TREE-1.4, and the collapsed-Top describe is TREE-1.5; in `projectTreeUtils.test.ts`, the `fullChildrenOf` describe is TREE-1.5.
  - **Held: TC-5a.6's test to DRAG-6.14.** The catalog still has the case as TC-5a.6, and the checker rejects a title whose case isn't there. The test changes in the commit that moves the case.
  - **Checks:** `npm run check` passes: 351 server tests, 422 client (22 new), 75 scripts, 0 checker hits on 266 files. The full E2E suite: 151 passed, 8 skipped. The new spec passed three runs in a row. To confirm the tests bite, I disabled the own-slot check and the `expand` call: TREE-1.8 and TREE-2.2 failed in the browser (the old code sent a `PATCH /projects/:id/move`), and three hook tests failed. Both lines are back.
- **2026-10-05, Nathan's answers at batch 3's stop.**
  - **The four internal mappings are approved:** `hierarchyPlacement.test.ts`'s null-root test (TREE-1.3), its empty-hierarchy test (TREE-1.4) and its collapsed-Top describe (TREE-1.5), and `projectTreeUtils.test.ts`'s `fullChildrenOf` describe (TREE-1.5).
  - **The hook's tests (`useProjectDragReorder.test.ts`) weren't named in the answer,** so the Reconciler proposes them for approval.
  - **The TC-5a.6 re-title stays held,** until the Test Planner has moved the case to DRAG-6.14.
  - **Nathan hands the Coder's notes to the Test Planner and the PO** (the Handoff's "From the Coder, batch 3").
- **2026-10-05, batch 3 (the Test Planner): TC-5a.6 is DRAG-6.14.**
  - The case moved with its rule, from item-positioning §5a to board-drag-interaction §10. Its text is unchanged, except that "its own panel" is now "its Sheet", the wiki's name for it, and it points to DRAG-6.4 for the previewed write.
  - **It's `Open` until the Reconciler's run.** A new ID's status is the Test Planner's to set, and `Automated` is the Reconciler's. Its test, `itemWriteReconciliation.test.ts`'s, was TC-5a.6's approved internal pointer, and it's a response-reconciliation rule whose only surface is a drag, which the second approved category covers.
  - **The Coder re-titles the test in the same commit.** Until then, `check:docs` reports the test's old ID.
  - **Still to come from the Test Planner at Close:** TREE-1.8 to `Open` with the PO's marker, and any case the PO's rulings on the Coder's two behavior decisions need.
- **2026-10-05, at close (the PO).**
  - **project-tree §1's set-down is unmarked:** batch 3 built it.
  - **Open question 5 (ATT-9.10), a deduction:** item-attachment §2a's list of the writes that leave an item Free names a fourth: a detach that also reparents. It takes the workphase it was shown in before the write. The rule's own wording already covered it, and A5a's batch 2b built it.
  - **The Coder's two behavior decisions go to Nathan:** a return to the dragged project's own row, and the line in an empty hierarchy.
  - **Nathan's rulings on the two, as the PO recommended:**
    - **The dragged project's own row means its own gap,** as the rows of its subtree do. Hierarchy-placement §4 takes the entry and its descendants out of the candidates, so the own row is part of the block that collapses. When the pointer comes back to the row, the line moves to the project's own gap, and a release at its own depth writes nothing, as on the board. project-tree §1 gains a **Planned** bullet for it. The Coder's fix is in `useProjectDragReorder.ts::handleDragMove`, and TREE-1.8 covers the return. At close, the PO merges the bullet into the one before it ("a row of the dragged project or its subtree").
    - **An empty hierarchy draws no line:** the one state is where the project already is, and a release writes nothing. project-tree §1's empty-hierarchy bullet says so. It's today's behavior, so TREE-1.4 gains it as an assertion, with nothing to build.
- **2026-10-05, at close (the Test Planner): the PO's handoff applied.**
  - **TREE-1.8 is `Open`,** since project-tree §1's set-down is unmarked. Its *when* now says the line comes back to the project's own gap, so it doesn't overlap TREE-1.9.
  - **The return to the project's own row is a new case, TREE-1.9, `Planned`.** The PO's note puts it in TREE-1.8, but project-tree §1 marks that bullet `**Planned:**` until the Coder's `handleDragMove` fix lands, and a case has one status (test-plans README). So TREE-1.8 is the set-down, which is built, and TREE-1.9 is the return. TREE-1.9 goes to `Open` when the PO merges the bullet, and its test carries TREE-1.9.
  - **TREE-1.4** gains its assertion: no line is drawn, and a release sends no request. Its title says so. It's today's behavior, so it stays `Open`.
  - **ATT-9.10 is `Open`,** from the PO's deduction: item-attachment §2a's fourth write. It's a detached child of the new parent, in the workphase it was shown in before the write. Since §2a's refusal holds for every write in the list, the case also asserts the refusal when the old Card has no workphase. A5a's batch 2b built both, and the Reconciler judges whether a test asserts all of it.
  - **TC-5a.6 → DRAG-6.14** was moved at batch 3 (the entry above). The Coder's re-title goes with it.
  - **The cases this story carries now:** the project tree's TREE-1.1 to 1.8, 2.1 and 2.2 `Open`, and TREE-1.9 `Planned`; A5a's, as listed at batch 2, with ATT-9.10 `Open`; and DRAG-6.14 `Open`. None is `Pending PO`.
- **2026-10-05, at close (the Coder): the own-row fix, and TC-5a.6's re-title.**
  - **The own row is the block's gap.** `useProjectDragReorder.ts::handleDragMove` no longer returns early when dnd-kit reports the dragged project's own row as `over`. `exclude` already holds that row, so `resolveGap` reads it as a row of the dragged block, the same as a row of its subtree, and the line moves to the project's own gap. A release there at the own depth writes nothing (`releaseOf`).
  - **A consequence, for the PO.** The own row now projects like any other row, so a sideways offset picks a depth there. A project picked up and dragged 7px or more sideways, still over its own row, shows the line indented a level, and a release saves that (for example, X below B becomes B's first child). It's the gap's range, and the line shows it. Before the cursor leaves, a pointer that stays within about 7px sideways still resolves to the own depth.
  - **Tests, by the Test Planner's split.** TREE-1.9 is the return to the own row; TREE-1.8 keeps the set-down and the release before leaving.
    - Hook: TREE-1.9 has two tests (the return to either half of the row, and an offset on the own row picking that gap's depths). TREE-1.4 gains "draws no line", and its subtree loop includes the own row. The own row is also in TREE-1.6's no-child sweep.
    - E2E: TREE-1.9 is its own test. TREE-1.8's "released before leaving" now rests the pointer back at the start, because `pickUp` drifts 10px sideways, and on the own row that picks a depth.
  - **TC-5a.6's test is DRAG-6.14,** in `itemWriteReconciliation.test.ts`. Nothing in code, tests or comments cites TC-5a.6 any more.
  - **Checks:** `npm run check` passes: 351 server tests, 426 client, 75 scripts, 0 checker hits on 266 files. The full E2E suite: 152 passed, 8 skipped, and the sidebar spec passed three runs in a row. An earlier full run had one failure, DRAG-3.17 in `drag-column-bands.spec.ts`, a board spec that passes alone and in the clean run. I edited a client test file while that run was going, which restarts the dev server mid-test. To confirm the own-row tests bite, I put the early return back: six hook tests and the E2E's own-row step failed (before the split into TREE-1.8 and TREE-1.9).

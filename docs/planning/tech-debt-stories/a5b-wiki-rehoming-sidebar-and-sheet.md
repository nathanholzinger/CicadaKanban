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
- **Re-titles** any test that carries a moved ID. None is expected: no test carries DRAG-4.26, 4.28 or 4.31, or ATT-4.12 or 4.13, today.
- **D4's pointers,** using batch 2's anchor map, and index pointers to the project tree page's sections in the modules that enforce them.
- **D6:** removes the toolbar control.
- **The test-file check** (D3).
- **The gate** plus `npm run test:e2e`, since there's a new spec.
- **Stop:** Nathan approves the internal mappings, and reviews.

**Close.**
- **The PO** takes the set-down's marker off and fills in the Handoff's "Wiki sections added, changed, moved or removed".
- **The Test Planner** moves the set-down's case from `Planned` to `Open`.
- **The Reconciler** runs over the four touched catalogs: the two new ones, board-drag-interaction and item-attachment.
- **The Architect** archives this plan when Nathan signs off.

## Code map

The starting list. The Coder keeps it current.

| File | Batch | Change |
|---|---|---|
| `client/src/components/sidebar/useProjectDragReorder.ts` | 3 | The set-down fix (D1), and its header's pointer (D4) |
| `client/src/components/sidebar/projectTreeUtils.ts` | 3 | `fullChildrenOf`'s pointer (D4) |
| `client/src/lib/hierarchyPlacement.ts` | 3 | Its header's pointer, if the shared rule moves (D4) |
| `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts` | 3 | The sidebar cases' IDs, as Nathan approves each mapping, and the set-down's test (D1) |
| `tests/ui/` | 3 | A sidebar drag spec (D1) |
| `client/src/components/BoardToolbar.tsx`, `BoardView.tsx` | 3 | The "New child items go to" control, its state and its localStorage key go (D6) |
| Root `CLAUDE.md` | 2 | "One position math layer"'s citation, if the shared rule moves (Architect) |
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

## Handoff

- **Wiki sections added, changed, moved or removed, with old → new anchors** (PO):
- **Moved cases, old → new** (Test Planner):
- **To the Work Item Detail & Chat UI epic:** the Sheet's page and its Open questions, and any case routed there, named in its roadmap entry (batch 2).
- **To A5d:** the project tree's page, which this story creates.

## Open questions

For Nathan, at plan approval. All four are answered.
1. **D5:** the project tree's other rules and its two gaps go in a follow-up story, A5d, after A5c.
   - **Answered (Nathan, 2026-10-05):** business and behavior rules go in the wiki, and API contract details go to OpenAPI. The Architect reads that as approving A5d, scoped to behavior rules, and wrote its plan.
2. **D6:** remove the toolbar's "New child items go to" control in batch 3.
   - **Answered (Nathan, 2026-10-05):** yes, since it's dead.
3. **D2:** no new marker, and the Sheet's rules spread over rule, Planned and Open question.
   - **Answered (Nathan, 2026-10-05):** he's agnostic about a marker. What matters is that the Sheet's layout and behavior read clearly as a placeholder until the Sheet epic, with no precise rules or robust test plans. D2 is revised to match.
4. **D1:** the sidebar's cases get their tests here, not in Story 10.
   - **Answered (Nathan, 2026-10-05):** yes.

## Amendments

- **2026-10-05, Nathan's answers at plan approval** (Open questions 1–4).
  - D2 is revised. The Sheet's page says its design is a placeholder, and puts what it does today under Open questions. The picker's cap is no longer a Planned rule; the roadmap tracks it. The Sheet gets no cases beyond resolving ATT-4.12 and 4.13, and no index pointers.
  - D5 is approved, as A5d, scoped to behavior rules.
  - D6 is ruled: batch 3 removes the control.
  - D1's tests land here.

# A5c — Write boards-columns-unsorted Out in Full

**Type:** tech-debt story. It may change behavior where a ruling settles a gap, and each change carries a test. If a change alters what the API accepts, the story closes by the full story-done checklist, audit included, as A5a did. · **Written:** 2026-09-30 by the PO, as A5's D3; split out the same day by the Architect; planned on 2026-10-05 by the Architect · **Status:** approved 2026-10-05, with Nathan's answers to its open questions; batch 1 (the PO) is next · **Sequenced:** after A5a and A5b (both closed), before A5d

## Goal

*Added by the PO, from A4's handoff (2026-09-30):* Nathan folded this in. A2 handed it off as a follow-up story, which was never written.

The page states only the core rules so far, as unnumbered bullets, and it has no test plan. This story:
- **numbers its sections,** so code comments can cite them and the Test Planner can derive cases from them;
- **takes the rules the code has that the page doesn't state,** each as a ruling for Nathan before it's written, as with A4's handoff items:
  - `DELETE /boards/:id` refuses a workflow's last board with a 409;
  - `POST` and `PUT /api/columns` return a 400 for a range whose start comes after its end, or whose workphases aren't in the board's workflow;
  - `unsorted` also carries `needsAttention`, which the page doesn't describe;
- **gets the page a test plan,** written by the Test Planner. The page already uses the API's field names, which the Test Planner asked for during A2;
- **hands the Coder A4's D4 table for this page,** which maps each rule to its main enforcing site, so the new section numbers get their index pointers.

The page states today's behavior. A later epic reworks how columns and workphases relate (Nathan, 2026-09-30), and when isn't known.

*Split note (2026-09-30):* this was A5's D3, and became its own story when A5 split into A5a–c. It runs last because A5a changes what lands in Unsorted.

*Out of scope (Architect, 2026-10-05):*
- **Designing the board's presentation.** How columns merge and subdivide, a board's column order, the column editor and the Unsorted bucket's look are a minimum-viable placeholder (D1). The page says so and states no rules for them.
- **Workflow inheritance:** which workflow a project uses. It's A5d's, on the project tree's page (D4).
- **The API contract:** a request's and a response's fields beyond what a rule needs. They go to OpenAPI, under C7 of `api-contract-zod-openapi.md` (Nathan, 2026-10-05).

## Decisions

*Added by the Architect (2026-09-30), from A5's grooming:*
- **What Unsorted is for.** The API refuses what isn't allowed. Unsorted (the "needs attention" surface) catches what gets past: direct DB edits, and cascades not designed yet. The page describes it that way.
- **What lands there after A5a:**
  - **A full item with no workphase,** whatever the cause: created without one, or its workphase deleted. Every item today is a full item. Epic 4's status model may change this (`docs/planning/epic-4-decisions.md` §13).
  - **Items left in another workflow's workphase by a project move.** A5a refuses the item writes that would do it, but not project moves, since the sidebar offers them.
  - A5a's handoff to this story may add to the list.
- **The three rules above** (the last-board 409, the column range 400s, `needsAttention`) are each still a ruling for Nathan, in the first batch.

*Added by the PO, from A5b's sweep (2026-10-05):* one rule moves here (Nathan, A5b's call 7).
- **item-positioning §6's "Column range validation"**: a column's range never spans a terminal and a non-terminal workphase, since active and done items are never compared in one sorted list. It's a column rule, so it moves to this page, beside the column-range 400s. item-positioning §6 keeps the reason, the active/done split, and points here.
- The Test Planner moves any case that cites §6 for it, and the Coder re-points its index pointer (A4's D4 table: `columnRanges.ts::validateColumnRange`).

*Planned by the Architect (2026-10-05), with Nathan's answers to three questions asked before planning:*

### D1 The API's rules are firm; the board's presentation is a placeholder

**Nathan (2026-10-05):** "a lot of the boards-columns-unsorted page can be written as representing a minimum-viable-placeholder that has many questions to ask and decisions to make in epic 8 or later. I expect the way columns merge and subdivide to be reworked and freely re-ordering columns that present a different phase order than workflow will probably be changed. I think tho that your recommendation sounds mostly right. I believe the API is largely doing what we want it to and we can have a firmer descriptive take on the rules and test cases. It's presentation layer that should be treated more as a placeholder."

So the page has two tiers:
- **The API's rules get numbered sections and full cases.** The page describes what the API does today, firmly. A rule the later rework may change is still a rule until it does. The page can add an Open question about where it's headed.
- **The board's presentation goes under Open questions,** where the wiki README already puts "a placeholder look". Nothing there derives a case. Existing UI tests that pin it stay as unmapped support, the way the Sheet's do.
- **The opening paragraph says which tier is which.** The wiki README has a pattern for a page whose whole feature isn't designed, but none for a page that's half settled. Whether the README needs a line for one is the PO's call.

**The Architect's starting split, for the PO's batch 1.** The PO decides where each piece lands.

| Firm: the API's rules | Placeholder: the board's presentation |
|---|---|
| **Boards.** A board belongs to a workflow, and every workflow has at least one. `DELETE` of the last is refused with a 409. A new board, made with its workflow or by `POST /boards`, gets one column per workphase, in the workflow's order | **Merged and expanded columns:** how each looks, and how columns merge and subdivide. Nathan expects this reworked. `epic-8-decisions.md`'s column merging-expanding section records the facet idea (date buckets, group-by-tag) |
| **Columns.** A column's range runs from its start to its end, and what it covers is worked out on every read from the workflow's current order. A range is refused with a 400 when an end isn't in the board's workflow, when its start comes after its end, when it overlaps another column on the board (the response names that column), or when it spans done and active (D5). A column can always be deleted. A column with no name is called by the workphases it covers. `broken` is worked out on every read | **A board's column order showing workphases out of the workflow's order.** Today `PATCH /columns/reorder` takes any order, which is firm, but Nathan expects free reordering to change. Whether a board's order may differ from the workflow's is an Open question |
| **Column order.** The order belongs to the board, and changes neither coverage nor items (the page's second bullet today) | **The column editor:** what it offers (gap G2) |
| **What workphase writes do to columns.** A new workphase goes after every other one, so no column covers it. A delete shrinks each column that covers the workphase, deletes a column it was the only workphase of, and the response lists both. Its items lose their workphase and show in Unsorted. A terminal-flag change that would leave a column spanning done and active is refused (D5). A reorder follows G1's ruling | **The Unsorted bucket, the "needs attention" badge and the "broken" badge:** how they look, and their tooltips |
| **Unsorted:** `uncovered`, `invalidItems` and `needsAttention`; what it's for (above); what lands there (above) | **The inherited view** (D4): a project that inherits its workflow sees its ancestor's board filtered to its own items, with management hidden |
| **What a board shows** (D4): the items of every project whose effective workflow is the board's | **A board's show-attached-children setting:** whether Cards open with their attached children showing |
| **Items never reference a board or a column.** MCP works at the workphase level (the page's last bullet today) | **A project with no workflow** has no board (gap G4) |

A drop into a column, a broken column refusing drops and Unsorted being drag-source only are board-drag-interaction's, and item-positioning's for the entry workphase. The page points to them rather than restating them.

### D2 The rules the page newly states, each a ruling in batch 1

The stub's three: the last-board 409, the range 400s, and `needsAttention`. Found while planning, from reading `routes/boards.ts`, `routes/columns.ts`, `routes/workphases.ts` and `lib/columnRanges.ts`:
- **The overlap 400.** A range that overlaps another column on the same board is refused, and the response names that column.
- **A workphase delete shrinks columns.** Each column covering it shrinks to what's left. A column it was the only workphase of is deleted. The response lists both, and is a 204 when no column changed.
- **A column can always be deleted.** Its workphases show in Unsorted unless another column covers them.
- **A column with no name is called by what it covers.** The name is one workphase's, or the first and last joined by a dash, or "(empty range)". `displayMode` is `merged` unless a write asks for `expanded`.
- **What a board shows** (D4).
- **The column rule that moves from item-positioning, and the terminal-flag refusal** (D5).

Each rule is written descriptively. Rules an API caller can see get cases. The presentation tier gets none (D1).

### D3 The gaps: fix now or defer, each Nathan's call

**Nathan (2026-10-05):** "if a finding is a code gap then we can decide if we want to address it now or defer it, but 'no code' should not be a strict rule."

The PO's batch 1 proposes a rule for each gap. Nathan rules at batch 1's stop, choosing between fixing it in batch 3 and deferring it. A deferred gap goes under the page's Open questions, and the Architect records it in `epic-8-decisions.md` (Open question 2), unless its ruling sends it elsewhere. The Architect's recommendations:

- **G1. A workphase reorder is never checked.** `PATCH /workphases/reorder` checks only that the ids exist.
  - **What it can do:**
    - invert a column, which `broken` catches;
    - make two columns overlap, so one workphase's items show in both;
    - make a column span done and active;
    - pull an uncovered workphase into a column's range.
  - No UI or MCP tool sends a reorder today: `api/workphases.ts::reorderWorkphases` has no caller. So only a direct API call reaches it.
  - Found by reading. The server side is certain, since each column works out its coverage alone. The double-rendered item on the client hasn't been run.
  - **Recommended: fix now, in part.**
    - Refuse a reorder that would make two columns overlap, or a column span done and active, with a 400 naming the column. That's the same check the terminal-flag change already runs (`columnRanges.ts::findColumnsMixingTerminalAfterFlip`), extended to overlap.
    - Keep inversion, which is flagged `broken`, the page's existing catch. A broken column still shows its items and only refuses drops.
    - An overlap or a span produces a board the other rules call impossible: an item drawn twice, or done and active items in one sorted list (item-positioning §6's reason).
    - Pulling a workphase into a range is coverage following the workflow's order, as the page's first bullet already says.
  - **The alternatives:**
    - refuse inversion too, so `broken` is reachable only by a direct database edit;
    - defer all of it, since nothing sends a reorder.
- **G2. The column editor offers ranges the API refuses,** an overlap or a done/active span, then shows the 400. It does stop a start after the end.
  - **Recommended: defer.** The editor is presentation, a placeholder (D1). That's the same treatment as the Sheet's over-cap parent picker (A5b's D2).
- **G3. `needsAttention` and the bucket disagree.**
  - **(a) The server lists a drifted Stub in `invalidItems`** (A5a's handoff). That's an Attached item whose own workphase is none or foreign. Item-attachment says it shows with its parent, and Unsorted doesn't list it. The client's bucket filters it out but still shows the badge.
    - **Recommended: fix now.** The server leaves Attached children out of `invalidItems`, so `needsAttention` follows what Unsorted lists. ATT-9.3's server half, unasserted since A5a, gets its test.
  - **(b) The badge is board-wide, but an inherited view's bucket lists only its own project's items.** Another project's drift raises the badge over an empty bucket. The tooltip mentions only uncovered workphases.
    - **Recommended: defer.** It's presentation (D1).
- **G4. A project with no workflow has no board.** Item-attachment says a top-level item created without a workphase "shows in Unsorted ... even in a project with no workflow". No board shows it there.
  - **Recommended: defer,** as an Open question on this page. The PO corrects item-attachment's line. The Inbox epic collates items no column holds. `epic-4-decisions.md` §12's ATT-5.11 already asks about workflow-less projects.
- **G5. The inherited view filters to the project alone.** Project `B` inherits `A`'s workflow, and so does `B`'s child `C`. `A`'s board shows `A`'s, `B`'s and `C`'s items, while `B`'s view shows only `B`'s, not `C`'s.
  - **Recommended: defer,** as an Open question. It's presentation (D1), and it's what project-owned boards will rework.

### D4 What a board shows is this page's

**Nathan (2026-10-05), agreeing with the Architect's recommendation:**
- this page states which items a board shows, including the inherited view;
- the project tree's page states which workflow a project uses;
- each page links the other.

The no-workflow case is G4.
- **Firm:** `GET /boards/:id` returns the items of every project whose effective workflow is the board's. That includes items whose workphase is none or foreign, which is how they reach Unsorted at all (A4's D4 table: `workflowItems.ts::getBoardScopeItems`).
- **Placeholder:** the inherited view (D1, G5).
- A5d's plan names this, so A5d doesn't re-decide it.

### D5 The moved column rule, the terminal-flag refusal, and their cases

- **The column rule moves here** (A5b's call 7, above). item-positioning §6 keeps the reason and points here.
- **The terminal-flag refusal is stated here as a rule.** It's TC-6.12's reading, which Nathan kept (`epic-4-decisions.md` §12), and the API enforces it today. A flag change that would leave a column spanning done and active is refused with a 400, and the response names the column. A change on a workphase no column covers, or one a column covers alone, is accepted.
- **Cases** (the Test Planner's call; these are the candidates):
  - TC-6.7 and 6.8 move to the new catalog with new IDs, and their tests are re-titled;
  - TC-6.12 moves too, and is mapped here rather than routed to the Quick Items epic (Nathan, Open question 1). Its tests are in `workphases.test.ts`, without its ID.
  - TC-6.11 and 6.13 are about items, not columns, and stay.

### D6 Tests and pointers

- **Tests already pin most of the firm rules without case IDs:**
  - `server/tests/routes/boards.test.ts`, `columns.test.ts` and `workphases.test.ts`;
  - `tests/api/boards.spec.ts` and `columns.spec.ts`.

  These are route tests and API specs, so they count without approval. Batch 3 re-titles them once the cases exist. A client test, such as `UnsortedBucket.test.tsx`, needs Nathan's approval to map.
- **New tests** cover a rule no test pins, and each fix ruled in batch 1.
- **The UI specs** `tests/ui/boards.spec.ts` and `boards-layer.spec.ts` mostly pin presentation. They stay as unmapped support, except where one asserts a firm rule.
- **Index pointers:** A4's D4 table maps each of the page's bullets to its enforcing site. The Coder adds `wiki boards-columns-unsorted §N` there once the sections are numbered. `validateColumnRange`'s pointer moves off item-positioning §6. A search for `wiki item-positioning §6` finds any other pointer to the moved rule.

## Work, in batches

Each batch ends with a stop for Nathan's review and commit. A batch that changes code ends with the gate first.

**Batch 1: the PO's proposal.** No living doc changes yet.
- **The page's structure:** its sections, the firm/placeholder split (D1), its opening paragraph, and whether the wiki README needs a line for a half-placeholder page.
- **A ruling for each newly stated rule** (D2), and a proposed rule for each gap (D3).
- **Where the moved column rule and the terminal-flag refusal land** (D5).
- **A sweep of the other pages** for anything about boards, columns or Unsorted that belongs here. item-attachment's line about a project with no workflow is one (G4).
- All of it goes in this plan's Amendments, for Nathan.
- **Stop:** Nathan rules on the structure, the rules, and each gap: fix now or defer.

**Batch 2: the page and the cases.**
- **The PO:**
  - writes the page;
  - points item-positioning §6 here;
  - corrects item-attachment's line;
  - updates the README if batch 1 calls for it;
  - lists sections added, changed or moved in the Handoff;
  - marks each gap ruled "fix now" as `**Planned:**`.
- **The Test Planner:**
  - writes the new catalog folder;
  - moves TC-6.7, 6.8 and 6.12, listing old → new in the Handoff;
  - writes cases for the firm rules, with each fix's cases `Planned`;
  - updates the INDEX pages.
- **The Architect:**
  - records each gap ruled deferred in `epic-8-decisions.md`'s A5c section. It already lists the presentation tier, and G2, G3(b) and G5 as recommended deferrals (Open question 2);
  - once TC-6.12 has its new ID, takes it off `epic-4-decisions.md` §12's list, which then holds four cases, and updates Epic 3.5 Story 10's item-positioning line (Open question 1);
  - updates root `CLAUDE.md` if the page's scope line changes.
- `npm run check:docs` reports 0 hits.
- **Stop:** Nathan reviews the page and the cases.

**Batch 3: the code** (Coder).
- **Each fix ruled "fix now,"** with a test carrying its case ID. On G1 and G3(a) as recommended:
  - **G1:** `PATCH /workphases/reorder` refuses a reorder that would make columns overlap, or a column span done and active, through one `columnRanges.ts` check shared with the terminal-flag change.
  - **G3(a):** `computeUnsorted` leaves Attached children out of `invalidItems`.
- **Re-titles** the existing tests that assert a firm rule (D6), and the tests of the moved cases.
- **Proposes** any client test's mapping, for Nathan's approval.
- **Adds index pointers** (D6).
- **The gate.** Then `npm run test:e2e` if an E2E spec changed.
- **Stop:** Nathan approves the mappings, and reviews.

**Close.**
- **The PO** takes the markers off and fills in the Handoff's "Wiki sections added, changed, moved or removed".
- **The Test Planner** moves the fixes' cases from `Planned` to `Open`.
- **The Reconciler** runs over the new catalog, item-positioning (for the moved cases), and item-attachment (ATT-9.3's server half).
- **If a fix changed what the API accepts** (G1 would), the full story-done checklist applies, audit included.
- **The Architect** archives this plan when Nathan signs off.

## Code map

The starting list. The Coder keeps it current.

| File | Batch | Change |
|---|---|---|
| `server/src/lib/columnRanges.ts` | 3 | G1: a check for a workphase reorder that would make columns overlap or a column span done and active, sharing `findColumnsMixingTerminalAfterFlip`'s simulation. G3(a): `computeUnsorted` leaves Attached children out of `invalidItems`. Index pointers on `getCoveredWorkphases`, `isColumnBroken`, `validateColumnRange` (re-pointed off item-positioning §6), `computeUnsorted` and `shrinkColumnsForDeletedWorkphase` |
| `server/src/routes/workphases.ts` | 3 | G1: the reorder route calls the new check before its transaction. Pointers on the POST's append and the flag change's refusal |
| `server/src/routes/boards.ts` | 3 | Pointers: `createDefaultBoard`, the last-board 409, and `GET /:id`'s board scope |
| `server/src/routes/columns.ts` | 3 | Pointers, if the page states the column delete or the name default as rules |
| `server/src/lib/workflowItems.ts` | 3 | A pointer on `getBoardScopeItems` (D4) |
| `client/src/components/workflow/useBoardDnd.ts` | 3 | A pointer on `handleDragEnd`'s column branch (column order) |
| `server/tests/routes/boards.test.ts`, `columns.test.ts`, `workphases.test.ts`; `tests/api/boards.spec.ts`, `columns.spec.ts` | 3 | Re-titles with the new case IDs, and new tests for unpinned rules and each fix |
| `client/src/components/UnsortedBucket.test.tsx` | 3 | A mapping, for Nathan's approval, if a firm case needs it |
| `docs/planning/epic-8-decisions.md`, `epic-4-decisions.md`, `epic-3-5-roadmap.md` | 2 | The Architect's routing (batch 2). Done at planning: Epic 4's §11 moved to Epic 8, with pointers left in Epic 4's §10 and §11, and Epic 8's A5c section added |

## Acceptance

- **The page:**
  - It has numbered sections for the API's rules.
  - Its opening paragraph says the board's presentation is a placeholder.
  - Its Open questions hold the presentation and each deferred gap.
  - `check:docs` reports 0 hits.
- **The moved rule:** no column rule is left on item-positioning §6 beyond its pointer here. TC-6.7, 6.8 and 6.12 are moved, and TC-6.12 is off Epic 4's §12.
- **The catalog:** every case for a firm rule is `Automated`, or routed by ID.
- **The fixes:** each fix ruled "fix now" is built, and a test carrying its case ID shows it.
- **The gate:** `npm run check` passes, as does `npm run test:e2e` if a spec changed. The Reconciler's run reports no lost coverage.
- **Pointers:** every row of A4's D4 table for this page has its index pointer, and no comment cites item-positioning §6 for the column rule.
- **Routing:** each deferred gap is recorded in `epic-8-decisions.md`, or wherever its ruling sends it.

## Handoff

- **Wiki sections added, changed, moved or removed.**
  - *Written by the PO, batch 2 (2026-10-05).* `npm run check:docs` reports 0 hits on 266 files.
  - **Added: boards-columns-unsorted §1 to §10,** and its Open questions. The page had no numbered sections, so its six bullets moved into them:

    | Old bullet | New |
    |---|---|
    | A column covers a range, worked out on every read | §4 |
    | Columns reorder by dragging, and the order is the board's | §7 |
    | Unsorted: `uncovered` and `invalidItems` | §10 |
    | Unsorted: a new workphase never joins a column | §8 |
    | Broken columns | §9 |
    | Every workflow has at least one board, set up 1:1 | §1 |
    | Items never reference a board or a column, and MCP | §2 |

    New in the sections: §1's last board (call 1); §3, what a board shows (D4, call 8); §4's default name and `displayMode` (call 2) and the column delete (call 3); §5's range 400s (call 4); §6's two rules and the writes they refuse (call 5, D5), with the unchecked reorder (G1); §8's delete (call 6) and reorder (G1); §10's `needsAttention` (call 7) and an Attached item's place (G3(a)).
  - **Moved, old → new:** item-positioning §6's "Column range validation" → boards-columns-unsorted §6. item-positioning §6 keeps the reason and points there.
  - **Changed where they stand:**
    - item-attachment §2a: an Attached item with a stray workphase isn't shown in Unsorted, though `unsorted.invalidItems` lists it (G3(a)). "A project with no workflow" reads "a project that uses no workflow, its own or an ancestor's".
    - item-attachment §9: the sentence on what Unsorted is for links boards-columns-unsorted §10 (S4).
    - item-attachment §14: an item created with no workphase shows in Unsorted on the boards of the workflow its project uses, and shows nowhere in a project that uses no workflow (G4).
    - item-attachment's Open question "A project with no workflow" is reworded the same way, and asks the same questions.
    - item-positioning §7.3 links boards-columns-unsorted §3 and §10, and board-drag-interaction's opening paragraph links §7.
    - The wiki README's "Page layout": a page whose feature is settled only in part.
  - **No section was renumbered or removed.**
  - **For the Test Planner:**
    - The page links `test-plans/boards-columns-unsorted/`, so that's the folder name.
    - TC-6.7, 6.8 and 6.12 cite boards-columns-unsorted §6.
    - The deductions are in the body, so they can carry cases: a board delete takes its columns (§1), a board with no columns (§4), a delete that changes no column is a 204 (§8, worked example), a done column (§6), and an Attached item in Unsorted only inside its ancestor's Card (§10). So is one written in batch 2, deduction j below.
    - §4's default name says "joined by a dash" and no more. The exact separator isn't a rule.
    - ATT-9.3's server half reads the other way now (item-attachment §2a, boards-columns-unsorted §10).
    - ATT-10.3 and TC-7.20 assert that an item shows in Unsorted, and can cite boards-columns-unsorted §10. If ATT-10.3's project uses no workflow, item-attachment §14 now says the item shows nowhere.
  - **For the Coder's index pointers in batch 3,** by A4's D4 table and the Code map:
    - §1: `createDefaultBoard` and the last board's 409; §2: `schema.ts`'s `items` and `mcp.ts`'s tools; §3: `getBoardScopeItems`;
    - §4: `getCoveredWorkphases`, and `routes/columns.ts`'s default name and delete; §5 and §6: `validateColumnRange`, re-pointed off item-positioning §6, and the flag change's refusal;
    - §7: `handleDragEnd`'s column branch; §8: the workphase POST's append and `shrinkColumnsForDeletedWorkphase`; §9: `isColumnBroken`; §10: `computeUnsorted`.
  - **For the Architect:** root `CLAUDE.md` needs no change. Its lines on this page name the same scope.
- **To A5d:** what a board shows is this page's, and which workflow a project uses is the project tree's (D4). A5d's Decisions say so.
  - §3 states which workflow a project uses in a clause, linked to project-tree. Once project-tree states the rule, the PO cuts the clause to the link (call 8).
  - item-attachment already says "a project that uses no workflow, its own or an ancestor's".

## Open questions

For Nathan, at plan approval. Both are answered.
1. **TC-6.12's routing** (D5). It's routed to the Quick Items epic because that epic may retire the terminal flag. The API enforces the refusal today, and its tests exist (`workphases.test.ts`, in the two tests `epic-4-decisions.md` §12 names).
   - **Recommended: map it here.** You asked for a firm, descriptive take on the API's rules (D1). When the Quick Items epic retires the flag, the page and the case change with it.
   - §12 then holds four cases, and the Architect updates it and Story 10's line.
   - **Answered (Nathan, 2026-10-05):** as recommended.
2. **Where deferred gaps and the page's presentation questions go on the roadmap.** You named "epic 8 or later", and the Dashboard, Navigation & Notifications epic is today's Epic 8. Neither the column rework nor project-owned boards has a roadmap entry yet.
   - **Recommended:** a "Carried in from A5c" block in that epic's entry, listing the page's Open questions as decisions for it or later. `epic-4-decisions.md` §11 gets a line saying where the column rework went.
   - **Answered (Nathan, 2026-10-05):** not the roadmap. Epic 8 is where UI that does enough for now, but isn't meant to be the final product, is revisited. Most of `epic-4-decisions.md` §11 moves to `epic-8-decisions.md`, which also takes A5c's deferrals. Epic 4's §10 gets a one-line pointer there for the start-time context.
   - *Done (Architect, 2026-10-05):* `epic-8-decisions.md` gains two sections at its end: the column merging-expanding rework, moved from Epic 4, and the board's presentation from A5c, with G2, G3(b) and G5 as recommended deferrals for batch 1's stop. Epic 4's §11 keeps a pointer and C-6b's trigger, since the done-column rework is that epic's. Its §10 gains its pointer.

## Amendments

- **2026-10-05, at approval (Architect):** Nathan answered both open questions. D5 maps TC-6.12 here. Deferrals go to `epic-8-decisions.md`, not the roadmap, so D1's table, D3, batch 2's Architect items, the Code map and Acceptance now say so. The move from Epic 4 to Epic 8 is done.
- **2026-10-05, batch 1 (the PO): the proposal.** No living doc has changed. Each numbered call is for Nathan, with the PO's recommendation first. Each deduction is lettered and names the rules it follows from.
  - **The page's structure.** The folder and title stay, `boards-columns-unsorted` and "Boards, Columns & Unsorted", and its catalog is `test-plans/boards-columns-unsorted/`.
    - **Opening paragraph (draft):** "This page answers "what is a board, which items does it show, what does a column cover, and where does an item go that no column covers." Its numbered sections state what the API does. How the board presents it is a working placeholder: how columns merge and subdivide, the column editor, the Unsorted bucket's look and the inherited view are under Open questions, and no test case is derived from them. A drop into a column is [board-drag-interaction]'s, and how a column orders its items is [item-positioning]'s."
    - **Related:** board-drag-interaction (dragging items on a board), item-positioning (how a column orders its items), project-tree (which workflow a project uses, call 8).
    - **Sections (written in batch 2):**
      - **§1, "A board is a view of one workflow":** a board belongs to a workflow, and every workflow has at least one. A new board, made with its workflow or by `POST /api/boards`, gets one column per workphase, in the workflow's order, so it's usable at once. The last board can't be deleted (call 1). Deleting any other board deletes its columns, and no item changes (deduction a).
      - **§2, "Items never reference a board or a column":** today's last bullet. MCP tools work at the workphase level.
      - **§3, "What a board shows"** (D4, ruled): `GET /api/boards/:id` returns the items of every project that uses the board's workflow, its own or inherited (call 8), including items whose workphase is none or isn't the workflow's. That's how they reach Unsorted (§10).
        - *Deduction b,* from D4 and §10's `invalidItems`: a project moved under a different workflow brings its items onto that workflow's boards, still holding workphases of the old one, so they're in `invalidItems`. The old workflow's boards no longer show them.
      - **§4, "A column covers a range of workphases":** today's first bullet, a column created with no name (call 2), and a column delete (call 3).
      - **§5, "A column's range is checked when it's written":** the range 400s (call 4).
      - **§6, "A board's columns never overlap or mix done and active":** both rules, stated once, and every write that would break them (call 5, D5 and G1, below).
      - **§7, "A board's column order is its own":** today's second bullet.
      - **§8, "What a workphase write does to columns":** a new workphase (the last sentence of today's Unsorted bullet), a delete (call 6), a reorder (G1), and a terminal-flag change (§6).
      - **§9, "Broken columns":** today's bullet. Why a broken column takes no drop is board-drag-interaction §4's.
      - **§10, "Unsorted":** what it holds, what it's for, `needsAttention` (call 7), and how it meets attachment (G3(a)). That it's drag-source only is board-drag-interaction §3's.
      - **Open questions:** D1's placeholder column, each deferred gap, and whether a default column name follows its workphases (call 2).
    - **Firm or placeholder.** D1's split stands as the Architect drew it, with two placements made by the PO:
      - **Dragging a column reorders the columns** is firm (§7). It's one sentence, A4's handoff ruled it in, and board-drag-interaction's opening paragraph points here for it. How the column drag looks is the placeholder's.
      - **A column order out of the workflow's:** what `PATCH /api/columns/reorder` accepts today, any order, is firm (§7). Whether a board should be allowed that order is an Open question.
    - **The wiki README (the PO's call, no ruling needed).** "A page for a feature that isn't designed yet" gains a sentence: a page whose feature is settled only in part numbers its settled rules as usual, says in its opening paragraph which part is a placeholder, and keeps that part under Open questions. The README already sends a placeholder look or an undecided behavior to Open questions, but says nothing of the opening paragraph for a page that's half settled, and this page is the first.
  - **Rulings the page newly states (D2).** Each is worded from the Architect's reading of the code. If a test shows the code does otherwise, it comes back as a ruling.
    - **Call 1: the last board.** `DELETE /api/boards/:id` refuses a workflow's last board with a 409, and nothing changes. Recommended: yes. It's how the API keeps "every workflow has at least one board", which the page already states.
    - **Call 2: a column created with no name.**
      - It's named for the range it's created with: its workphase's name when it covers one, or its first's and last's joined by a dash. Its `displayMode` is `merged` unless the write asks for `expanded`. Recommended: firm, since a caller reads both back. What `merged` and `expanded` look like is the placeholder's.
      - D2 doesn't say whether the name is fixed at the write or worked out on every read. The two differ only after a workphase is renamed or reordered. Recommended: §4 states the name at creation, which is the same either way, and an Open question asks whether a default name should follow its workphases. The Architect can say what the code does, for the question's context.
      - "(empty range)" isn't on the page. A range the API accepts always covers a workphase (§5), so no create reaches it.
    - **Call 3: a column can always be deleted,** and no item changes. Its workphases go to `uncovered` unless another column on the board covers them. Recommended: yes.
      - *Deduction c,* from this and §10's `uncovered`: a board can be left with no columns, and then every workphase of its workflow is in `uncovered`.
    - **Call 4: the range 400s.** A column write is refused with a 400, and nothing changes, when its start or its end isn't a workphase of the board's workflow, or when its start comes after its end in the workflow's order. Recommended: yes.
    - **Call 5: no overlap.** A column write whose range would cover a workphase another column on the same board covers is refused with a 400 naming that column, and nothing changes. Recommended: yes. The reason the page gives: an item in that workphase would show in both columns.
    - **Call 6: a workphase delete shrinks the columns covering it.**
      - Each column covering the workphase shrinks to what's left of its range, and a column it was the only workphase of is deleted. The response lists the columns shrunk and the columns deleted, and is a 204 when no column changed. The workphase's items lose it, and show in Unsorted (§10).
      - Worked example, since the rule computes a range: workphases `W1, W2, W3, W4`, column `A` covering `W1` to `W3`, and column `B` covering `W4` alone. Deleting `W1` shrinks `A` to `W2` to `W3`. Deleting `W4` deletes `B`. Deleting `W2` leaves `A` running from `W1` to `W3`, now covering `W1` and `W3`, so no column changed and the response is a 204 (*deduction d,* from a range being stored as its two ends, §4).
      - Recommended: yes. The response's field names go to OpenAPI (out of scope).
    - **Call 7: `needsAttention`.** `unsorted.needsAttention` is true when Unsorted holds anything: a workphase in `uncovered`, or an item in `invalidItems`. How the board shows it is the placeholder's. Recommended: yes. Today a drifted Stub raises it too, which is G3(a).
    - **Call 8: which workflow a project uses, before A5d writes it.** §3 needs it, and it belongs on the project tree's page (D4), which A5d writes. Recommended: §3 says it in a clause, "its own workflow, or its nearest ancestor's when it has none", and links project-tree. A5d states the rule there in full and cuts the clause to the link. The other way, a bare link now, points to a page that doesn't state the rule until A5d.
  - **Where the moved rule and the terminal-flag refusal land (D5): §6.** It states both rules once, then the writes that would break them, each refused with a 400 naming the column, and nothing changes:
    - a column create or edit: an overlap (call 5), or a range spanning done and active (moved from item-positioning §6);
    - a terminal-flag change that would leave a column spanning done and active (TC-6.12's reading). One on a workphase no column covers, or one a column covers alone, is accepted;
    - a workphase reorder, as `**Planned:**`, if G1 is fixed now.
    - *Deduction e,* from the span rule: every column is a done column, all terminal, or an active one, all non-terminal. That gives "done column", which item-positioning §7.4 and board-drag-interaction §5 use, a definition.
    - *Deduction f,* from §8's add and delete: no other workphase write breaks §6. A new workphase is covered by no column, and a delete only takes coverage away.
    - item-positioning §6's bullet becomes a pointer that keeps the reason: "A board's columns never mix done and active workphases ([boards-columns-unsorted] §6), since active and done items are never compared in one sorted list: done's ordering isn't position-based at all."
    - So TC-6.7, 6.8 and 6.12 all cite §6.
  - **The gaps (D3).** A proposed rule for each, with the PO's recommendation. A gap ruled "fix now" goes on the page as `**Planned:**` in batch 2, and a deferred one under Open questions.
    - **G1, a workphase reorder. Recommended: fix now, in part,** as the Architect recommends.
      - **Proposed rule** (§8, listed in §6): a reorder is refused with a 400 when it would make two columns on any of the workflow's boards overlap, or a column span done and active. The message names each column it would break, and nothing changes. Otherwise coverage follows the new order: a workphase moved into a column's range joins it, one moved out of every range goes to `uncovered`, and a column whose start now comes after its end is `broken` (§9).
      - **One more reason to keep inversion:** refusing it would leave no way to reverse a column's workphases without first narrowing the column, since call 4 refuses the reversed range until the reorder has happened. The inverted state is what the reorder passes through, and §9 already handles it.
      - Deferring all of it leaves §6 a rule the API's own reorder can break, with only "nothing sends a reorder" as the guard.
    - **G2, the column editor. Recommended: defer,** as an Open question.
    - **G3(a), a drifted Stub in `invalidItems`. Recommended: fix now.**
      - **Proposed rule** (§10): `invalidItems` lists only Free items. An Attached item shows with its parent whatever its own `workphaseId` says (item-attachment §2a), so it's never in `invalidItems`, and `needsAttention` doesn't count it.
      - Written as a partial build: today's `invalidItems` sentence unmarked, and a `**Planned:**` sentence that leaves Attached items out.
      - *Deduction g,* from item-attachment §2a: an Attached item is in Unsorted only inside its Free ancestor's Card, when that ancestor is.
    - **G3(b), the badge in an inherited view. Recommended: defer,** as an Open question with the inherited view.
    - **G4, a project that uses no workflow. Recommended: defer,** as an Open question here.
      - item-attachment §14's line becomes: "A top-level create may omit it, even in a project that uses no workflow, and the item then has none. It shows in Unsorted on the boards of the workflow its project uses ([boards-columns-unsorted] §3, §10). A project that uses no workflow, its own or an ancestor's, has no board, so nothing shows the item yet ([boards-columns-unsorted], Open questions)."
      - item-attachment says "a project with no workflow" in two more places, §2a and an Open question, and each means one that uses none, its own or an ancestor's. Batch 2 words all three the same way, since §3 makes the difference visible. That's the PO's call; the rulings don't change.
    - **G5, the inherited view's filter. Recommended: defer,** as an Open question.
  - **The sweep (D3's last item).** The PO read the other six pages for anything about boards, columns or Unsorted that belongs here. Besides S2 (D5) and item-attachment §14 (G4):
    - **S4. item-attachment §9's "Unsorted is for what gets past"** says what Unsorted is for. It stays, as §9's reason, and links §10, which states it in full.
    - **Links that gain a section number:** item-positioning §7.3 and item-attachment §14 link §10, and board-drag-interaction's opening paragraph links §7.
    - **Looked at and left in place:**
      - item-positioning §4, a merged column's union sort and its drop rule: they order and resolve positions;
      - board-drag-interaction §3 and §4: Unsorted is drag-source only, and Unsorted and a broken column take no drop. They're drag rules, and §9 and §10 point to them;
      - board-drag-interaction §5's merged-column entry workphase and done columns, and item-positioning §7.4: drop rules, which deduction e now underpins;
      - hierarchy-placement, project-tree and item-sheet hold nothing on boards, columns or Unsorted.
  - **To A5d:** §3's clause on which workflow a project uses is cut to a link once project-tree states the rule (call 8).
- **2026-10-05, Nathan's rulings at batch 1's stop.**
  - **Agreed as recommended:** calls 2, 4, 6, 7 and 8, and deferring G2, G3(b), G4 and G5.
  - **Calls 1, 3 and 5 go on the page only if the code already does them.** Otherwise each goes to `epic-8-decisions.md`'s A5c section, as something to take into account when reworking how boards present and meet workflows.
    - The Architect's D2 reads all three from the code, and A4's D4 table names the last board's 409 site, so batch 2 writes them.
    - Batch 3's tests pin each one. If a test shows the code does otherwise, the rule comes off the page and goes to `epic-8-decisions.md`, as ruled.
  - **G1, deferred, with a principle for the rework:** editing a workflow or its workphases shouldn't need to consider boards. A board recognizes when its configuration is out of sync with its workflow. How precisely is an A5c deferral, for `epic-8-decisions.md`.
    - **So a workphase reorder stays unchecked, and §8 says so.** Coverage follows the new order: a workphase moved into a column's range joins it, one moved out of every range goes to `uncovered`, and a column whose start now comes after its end is `broken` (§9). A reorder can also leave columns overlapping, or a column spanning done and active. What the board shows then is an Open question. `broken` is today's one case of a board recognizing that it's out of sync.
    - **§6 states its two rules for the writes that check them,** a column write and a terminal-flag change, and says a reorder isn't checked (§8). Deduction e becomes: a column is a done column or an active one, unless a reorder has left it spanning. Deduction f becomes: a new workphase or a delete can't break §6, and a reorder can.
    - *Deduction h,* from D1 ("a rule the later rework may change is still a rule until it does") and this ruling: two rules the code has today make a workphase write consider boards. They're the terminal-flag refusal (D5) and the delete that shrinks columns (call 6). Both stay on the page as today's rules, and TC-6.12 stays mapped here. The G1 deferral names them, for the rework to weigh against the principle.
  - **G3(a), closed by the wiki, with no code change.** An Attached item shows with its parent, and that rule supersedes the item's own workphase, so the board ignores a Stub's workphase once it sees the item is Attached. The client already does this (A5a's ATT-9.3 tests).
    - **§10:** `invalidItems` lists every item on the board whose workphase is none or isn't the workflow's, Attached ones included, and `needsAttention` counts them (call 7). The board shows an Attached one with its parent (item-attachment §2a), never in the bucket by itself.
    - *Deduction i,* from this and G3(b)'s deferral: a drifted Stub raises the "needs attention" badge over a bucket that doesn't list it. That's the badge's presentation, so it joins G3(b)'s Open question and deferral.
    - **item-attachment §2a's "Unsorted doesn't list it"** becomes "the board doesn't show it in Unsorted", since the API's `unsorted.invalidItems` does list it (§10).
    - **For the Test Planner:** ATT-9.3's server half, unasserted since A5a, now reads the other way: the server lists a drifted Stub in `invalidItems`. Whether ATT-9.3 keeps a server half is the Test Planner's call.
  - **No fix is ruled, so batch 3 has none.** The Code map's G1 and G3(a) changes and batch 3's fix items drop. No change alters what the API accepts, which is the Type line's condition for the full checklist. The Coder keeps the Code map current, and the Architect adjusts Work and Close.
  - **For the Architect's routing in batch 2** (`epic-8-decisions.md`'s A5c section):
    - G1, as a new deferral: the principle, overlap and span after a reorder, `broken` as today's case of the board recognizing it, and deduction h's two rules;
    - G2, G3(b) with deduction i, G4 and G5, confirmed as deferred;
    - calls 1, 3 and 5, only if batch 3's tests show the code doesn't do them.
- **2026-10-05, Nathan's answer on deduction h.**
  - **The terminal-flag refusal stays, only as far as moving the rule takes it.** It already follows from the wiki's column rule, has tests (`workphases.test.ts`, without IDs) and is what the code does, so moving the rule to §6 states it in one clause, and TC-6.12 maps to the existing tests. Nothing beyond the move and the mappings: the Quick Items epic is expected to remove the terminal flag.
  - **Call 6 goes on the page,** as ruled.
- **2026-10-05, batch 2 (the PO): the page is written.** The Handoff lists the sections.
  - Written as ruled at batch 1's stop and in Nathan's answer on deduction h. No gap is fixed now, so the page carries no `**Planned:**` marker.
  - *Deduction j,* from §5's range 400s and §9's definition: no column write makes a broken column, and an edit whose range passes fixes one. §5 and §9 say so, and through the API only a workphase reorder makes one.
  - The opening paragraph and the Open questions follow the README's new line for a page settled only in part.

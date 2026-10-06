# A5c — Write boards-columns-unsorted Out in Full

**Type:** tech-debt story. A ruling could have changed behavior, but none did (batch 1's stop): batch 3 is tests and code pointers, so the story closes without an audit. · **Written:** 2026-09-30 by the PO, as A5's D3; split out the same day by the Architect; planned on 2026-10-05 by the Architect · **Status:** approved 2026-10-05, with Nathan's answers to its open questions; batch 2 is written, for Nathan's review at its stop; batch 3 (the Coder) is next · **Sequenced:** after A5a and A5b (both closed), before A5d

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

*Ruled at batch 1's stop (2026-10-05):* every gap is deferred, and G3(a) is settled by the wiki with no code change. G1's deferral comes with a principle for the rework. The Amendments have the rulings.

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
- **No fix:** none was ruled at batch 1's stop.
- **Calls 1, 3 and 5's tests decide whether those rules stay** (BCU-1.2, BCU-2.4 and BCU-3.1). If a test shows the code doesn't do one, the rule comes off the page and joins `epic-8-decisions.md`'s A5c section (Nathan, batch 1's stop). The PO and the Architect make that move at close. By reading, the code does all three.
- **Re-titles** the existing tests that assert a firm rule (D6), and the tests of the moved cases.
- **Proposes** any client test's mapping, for Nathan's approval.
- **Adds index pointers** (D6).
- **The gate.** Then `npm run test:e2e` if an E2E spec changed or was added. BCU-3.6 and BCU-5.5 are seen on the board.
- **Stop:** Nathan approves the mappings, and reviews.

**Close.**
- **The PO** brings the Handoff's "Wiki sections added, changed, moved or removed" up to date. The page carries no `**Planned:**` marker. A rule from calls 1, 3 or 5 that batch 3's tests disproved comes off it.
- **The Test Planner** applies the Handoff. That includes deleting the case of any rule that comes off the page.
- **The Reconciler** runs over the new catalog, item-positioning (for the moved cases), and item-attachment (ATT-9.3 and ATT-10.3, whose wording changed).
- **No audit:** no fix was ruled, and nothing restructures code.
- **The Architect** archives this plan when Nathan signs off.

## Code map

The starting list. The Coder keeps it current.

| File | Batch | Change |
|---|---|---|
| `server/src/lib/columnRanges.ts` | 3 | Done. Index pointers on `getCoveredWorkphases` (§4), `validateColumnRange` (§5 on the endpoint and order checks, §6 on the overlap and the terminal mix; re-pointed off item-positioning §6), `findColumnsMixingTerminalAfterFlip` (§6, the flag change), `shrinkColumnsForDeletedWorkphase` (§8), `isColumnBroken` (§9), `computeColumnRange` (§9, a broken column still covers what lies between its ends) and `computeUnsorted` (§10). No fix (batch 1's stop) |
| `server/src/routes/workphases.ts` | 3 | Done. A pointer on the POST's append (§8). The flag change's refusal (§6) has its pointer on `findColumnsMixingTerminalAfterFlip`, its one site. The reorder stays unchecked (G1, deferred) |
| `server/src/routes/boards.ts` | 3 | Done. Pointers on `createDefaultBoard` (§1), the last-board 409 (§1) and `displayNameFor` (§4, where an unnamed column's name is worked out, so not `routes/columns.ts`). The board scope (§3) has its pointer on `getBoardScopeItems` only |
| `server/src/routes/columns.ts` | 3 | Done. Pointers on the POST's `displayMode` default (§4) and the DELETE (§4) |
| `server/src/lib/workflowItems.ts` | 3 | Done. A pointer on `getBoardScopeItems` (§3) |
| `server/src/db/schema.ts` | 3 | Done (new row). A pointer on `items`: no board or column field (§2). `mcp.ts` has none, since the schema is that rule's one site |
| `client/src/components/workflow/useBoardDnd.ts` | 3 | Done. A pointer on `handleDragEnd`'s column branch (§7) |
| `server/tests/routes/boards.test.ts`, `columns.test.ts`, `workphases.test.ts`, `server/tests/fixtures.ts` | 3 | Done. BCU-1.1 to 1.6, 2.1 to 2.8, 3.1, 3.4, 3.5, 4.1 to 4.7 and 5.1 to 5.4 carry their IDs: 28 tests, 17 of them new and 11 from existing tests, extended or retitled (BCU-4.6 moved from `boards.test.ts` to `workphases.test.ts`). Existing tests that a test above now covers whole are gone. `fixtures.ts` gains `readBoard`, `boardsOf`, `columnOn`, `covers` and `reorderWorkphases`, which the three files share. The Amendments have the table |
| `tests/ui/boards-layer.spec.ts`, `tests/ui/attached-children.spec.ts` | 3 | Done. A new E2E test, BCU-3.6 (dragging a column), and BCU-5.5's ID on `attached-children.spec.ts`'s Unknown-status test |
| `tests/api/boards.spec.ts`, `columns.spec.ts` | 3 | No change. Each rule they pin is asserted whole by a route test above, so they stay unmapped support |
| `server/tests/routes/columns.test.ts`'s TC-6.7 and TC-6.8 tests | 3 | **Held.** Three titles move to BCU-3.2 and BCU-3.3 once the Test Planner moves the cases |
| `client/src/components/UnsortedBucket.test.tsx` | 3 | No mapping proposed: no firm case needs a client test. Its ATT-9.3 test stays ATT-9.3's |
| `docs/planning/epic-8-decisions.md`, `epic-4-decisions.md`, `epic-3-5-roadmap.md` | 2 | Done (Architect). At planning: Epic 4's §11 moved to Epic 8, with pointers left in Epic 4's §10 and §11, and Epic 8's A5c section added. In batch 2: the A5c section carries the ruled deferrals, and TC-6.12 is off Epic 4's §12 and Story 10's line |

## Acceptance

- **The page:**
  - It has numbered sections for the API's rules.
  - Its opening paragraph says the board's presentation is a placeholder.
  - Its Open questions hold the presentation and each deferred gap.
  - `check:docs` reports 0 hits.
- **The moved rule:** no column rule is left on item-positioning §6 beyond its pointer here. TC-6.7, 6.8 and 6.12 are moved, and TC-6.12 is off Epic 4's §12.
- **The catalog:** every case for a firm rule is `Automated`, or routed by ID.
- **No fix:** none was ruled. Calls 1, 3 and 5 are on the page with passing tests, or moved to `epic-8-decisions.md`.
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
  - *Changed after the Test Planner's batch 2 (PO, 2026-10-05),* answering Open questions 3 and 4. No section added, renumbered or removed:
    - **§6:** the lead says "refused with a 400", and only an overlap and a terminal-flag change name a column, by `conflictingColumnId` and in the message. A flag change that would leave several columns mixing names one. BCU-3.2 asserts no column; BCU-3.1 and 3.4 can assert `conflictingColumnId`.
    - **§9:** a broken column still covers the workphases between its two ends, so none is in `uncovered`, with BCU-2.8's example. BCU-2.8 can leave `Pending PO`.
    - **§4:** a pointer to §9 for a start after the end.
  - *Changed after Nathan's rulings on call 9 and G6 (PO, 2026-10-05).* No section added, renumbered or removed:
    - **§4:** a column with no name of its own is named for what it covers, worked out on every read, so it follows a workphase rename or a change of range. BCU-2.2 gains a rename.
    - **Open questions:** "A column's default name" is deleted. "The column editor" gains that its 400 names an unnamed column by an id the board never shows.
- **Moved cases, old → new** (Test Planner):
  - *Written by the Test Planner, batch 2 (2026-10-05).* `columns.test.ts` carries TC-6.7's and TC-6.8's IDs, so those two move in batch 3, beside the Coder's re-title. Their new IDs are reserved, so the Coder can use them.

    | Old | New |
    |---|---|
    | TC-6.12 | BCU-3.4 (batch 2; no test carries its ID) |
    | TC-6.7 | BCU-3.2 (batch 3, beside its tests' re-title) |
    | TC-6.8 | BCU-3.3 (batch 3, beside its tests' re-title) |
- **To A5d:** what a board shows is this page's, and which workflow a project uses is the project tree's (D4). A5d's Decisions say so.
  - §3 states which workflow a project uses in a clause, linked to project-tree. Once project-tree states the rule, the PO cuts the clause to the link (call 8).
  - item-attachment already says "a project that uses no workflow, its own or an ancestor's".
- **From the Coder, batch 3 (2026-10-05).**
  - **For the Test Planner:**
    - **TC-6.7 and TC-6.8 are still in item-positioning, so their three tests keep the old IDs.** `columns.test.ts` has two tests titled TC-6.7 and one titled TC-6.8. Once BCU-3.2 and BCU-3.3 are in the catalog, the Coder re-titles them (BCU-3.2 takes two, BCU-3.3 one), since `check:docs` flags a test title whose ID isn't declared.
    - **BCU-1.5's Z can't be built as written.** "Z, top-level, on WF2": a workflow has one owner project, so no project outside D's subtree can use D's. The test gives Z a workflow of its own and asserts that `z` is on neither board, and WF2's board returns `d` and `e`. Reword Z as a top-level project on a workflow of its own, or drop it.
    - **BCU-5.5's test has a detached child with no workphase as its Free ancestor,** not a top-level item. It's the same rule, and the Reconciler can judge whether the case's wording needs the top-level form.
  - **For the PO:** nothing comes off the page. BCU-1.2, 2.4 and 3.1 pass against the code, so calls 1, 3 and 5 stand. BCU-2.5's id that is no workphase at all gets a 400, not a 404, and BCU-3.1 and 3.4's messages name the column, as §5 and §6 say.
  - **For the Reconciler:**
    - **Every case in the catalog has a test carrying its ID,** except BCU-3.2 and BCU-3.3 (above). The Amendments' table gives each case's file. BCU-3.6 and BCU-5.5 are E2E tests.
    - **TC-6.8 was on a wrong test.** `columns.test.ts`'s "TC-6.8: creates a column spanning a range, defaulting displayMode to merged" asserted BCU-2.3's rule and is BCU-2.3's now. TC-6.8's own test is the one that allows an all-terminal range.
    - **`tests/api/boards.spec.ts` and `columns.spec.ts`, and the UI specs, carry no ID.** A route test above asserts each rule they pin whole, so they're unmapped support.
    - **No client test is proposed for Nathan's approval.**

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

For the PO, from the Test Planner's batch 2. Neither blocks batch 3.

3. **Which workphases a broken column covers** (BCU-2.8, `Pending PO`).
   - §9 says a broken column "keeps showing its covered items". §4's "from its `startWorkphaseId` to its `endWorkphaseId`, in the workflow's order" doesn't say what a range covers when its start comes after its end.
   - In BCU-2.8's example, column `A` runs from `W1` to `W3`, and the workphases are reordered to `W3, W2, W1, W4`. Does `A` still cover `W3`, `W2` and `W1`, the workphases between its two ends, or none? And are any of them in `unsorted.uncovered`?
   - *What the code does, as context, not a ruling (Architect, batch 2):* a broken column covers the workphases between its two ends in the new order. `columnRanges.ts::computeColumnRange` takes the lower and higher of the two ends' places. In BCU-2.8's example `A` covers `W3`, `W2` and `W1`, none of them is in `uncovered`, and the board response lists their items in `A`'s sub-rows.
   - **Answered (PO, 2026-10-05), by deduction k:** the workphases between its two ends. In BCU-2.8's example `A` covers `W3`, `W2` and `W1`, and none of them is in `uncovered`. §9 says so, with that example, and §4 points there.
4. **Which column a 400 names when a column write's own range would cover both done and active workphases.**
   - §6 refuses a write that would break either of its rules "with a 400 naming the column".
   - For an overlap, the 400 names the other column (BCU-3.1). For a terminal-flag change, it names the column that would mix (BCU-3.4).
   - A column create whose own range mixes has no column to name yet.
   - Unless §6 says what that 400 names, BCU-3.2, TC-6.7's new ID, asserts only the 400 and that nothing changes, as TC-6.7 does today.
   - *What the code does, as context, not a ruling (Architect, batch 2):*
     - **A range that mixes on its own** gets a 400 that names no column: "A column cannot span both a terminal (done) and a non-terminal workphase".
     - **An overlap and a terminal-flag change** each name the column in two ways: the response's `conflictingColumnId`, and the message, which quotes the column's name or, when it has none, its id. Every column a new board starts with has no name, so its message shows an id, not the name the board shows (§4).
     - **A flag change that would mix several columns** names only the first.
   - **Answered (PO, 2026-10-05):** none. §6's lead over-generalized: the rulings name a column only for an overlap (call 5) and a terminal-flag change (D5). §6 now says "refused with a 400" for all three writes, and names a column only for those two. So BCU-3.2 asserts the 400 and that nothing changes, as TC-6.7 does.
     - **How the 400 names it,** stated in §6 so BCU-3.1 and 3.4 can assert it: `conflictingColumnId` is the column's id, and the message quotes the column's own name, or its id when it has none. A flag change that would leave several columns mixing names one of them. That's precision on what was ruled, and what the code does. The message showing an id the board never shows is call 9's question, below.
     - That bears on BCU-3.1 and BCU-3.4 in batch 3. Whether "naming the column" in the message by id meets §6 is the PO's to read.

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
- **2026-10-05, batch 2 (the Test Planner): the catalog.** `npm run check:docs` reports 0 hits on 272 files, and the catalog agrees with itself.
  - **The new catalog is `test-plans/boards-columns-unsorted/`, with prefix `BCU`.** It has an INDEX and five suites, one per part of the page:
    - **BCU-1,** boards and what they show (§1 to §3);
    - **BCU-2,** a column and its range (§4, §5, §9);
    - **BCU-3,** a board's columns together (§6, §7);
    - **BCU-4,** what a workphase write does to columns (§8);
    - **BCU-5,** Unsorted (§10).
  - **30 cases: 29 `Open` and 1 `Pending PO`.** BCU-2.8 is the `Pending PO` one, Open question 3. None is `Planned`, since no fix is ruled. The deductions the PO listed carry cases:
    - a, in BCU-1.3;
    - b, in BCU-1.6;
    - c, in BCU-2.4;
    - d, in BCU-4.3;
    - g, in BCU-5.5;
    - j, in BCU-2.7.
  - **The cases in this story's scope:**
    - BCU-1.1 to 1.6, BCU-2.1 to 2.8, BCU-3.1 and 3.4 to 3.6, BCU-4.1 to 4.7, and BCU-5.1 to 5.5;
    - BCU-3.2 and 3.3, once they move in batch 3;
    - from the other catalogs, ATT-9.3, whose wording changed (below).
  - **The moved cases** are in the Handoff:
    - **TC-6.12 is BCU-3.4 now.** It asserts what TC-6.12 did, in §6's words, and adds that the 400 names the column, as §6 says. It's `Open`, since its tests in `workphases.test.ts` don't carry an ID yet.
    - **TC-6.7 and TC-6.8 move in batch 3,** as BCU-3.2 and 3.3. Their tests carry their IDs, and `check:docs` flags a test title whose ID isn't in the catalog.
    - **Until batch 3:** TC-6.7 and 6.8 cite wiki boards-columns-unsorted §6, and BCU-3.4 links them.
  - **ATT-9.3's server half: ATT-9.3 now covers only what the board shows.**
    - That the API lists a drifted Stub in `unsorted.invalidItems` is a case of its own, BCU-5.4.
    - ATT-9.3's *Then* said "Unsorted doesn't list it". It now says "the board doesn't show it in Unsorted", and it cites §10 too.
    - Its tests are client tests of what the board shows (M2, A5b), so it stays `Automated`.
  - **Rule fields only.** None of these assertions changed, so each case stays `Automated`:
    - **ATT-10.3** cites §10. Its `P0` "uses no workflow, its own or an ancestor's", as item-attachment now says. It asserts nothing about where that project's item shows, so item-attachment §14's "nothing shows the item yet", one of this page's Open questions, needs no case.
    - **TC-7.20** cites §3 and §10.
  - **For the Coder, batch 3:**
    - **Re-title the existing tests that assert a firm rule (D6) with their BCU IDs.** Each case's *Then* gives its values. A test that asserts only part of a case is extended, or joined by a new one.
    - **TC-6.7's and TC-6.8's tests are re-titled BCU-3.2 and BCU-3.3.** The Test Planner moves the two cases in the same batch.
    - **Where a case asserts what the page says and the code may not,** a failing test is a ruling (the test-plans README's "When a test for a case fails"):
      - BCU-2.5: a range end that's no workphase at all gets a 400, not a 404;
      - BCU-3.1 and BCU-3.4: the 400's message names the column;
      - calls 1, 3 and 5, which are BCU-1.2, BCU-2.4 and BCU-3.1: under Nathan's ruling at batch 1, if their tests show the code doesn't do them, those rules come off the page and go to `epic-8-decisions.md`.
    - **Two cases are seen on the board,** BCU-3.6 (dragging a column) and BCU-5.5 (an Attached item inside its ancestor's Card in Unsorted). A UI test counts outright. A client test needs Nathan's approval.
  - **For the Architect:** TC-6.12 is BCU-3.4, for `epic-4-decisions.md` §12 and Epic 3.5 Story 10's item-positioning line.
  - **For the PO:** Open questions 3 and 4.
- **2026-10-05, batch 2 (the Architect).** `npm run check:docs` reports 0 hits.
  - **`epic-8-decisions.md`'s A5c section** now carries the ruled deferrals:
    - G1, with Nathan's principle, the overlap and the span a reorder can leave, `broken` as today's one case of a board recognizing it's out of sync, and deduction h's two rules (the terminal-flag refusal, which the Quick Items epic is expected to retire, and the delete that shrinks columns);
    - G2, G3(b) with deduction i, G4 and G5, each confirmed;
    - the page's other Open questions, including the default column name;
    - a closing line saying calls 1, 3 and 5 join the list only if batch 3's tests disprove them.
  - **TC-6.12 → BCU-3.4.** It's off `epic-4-decisions.md` §12's list, which is retitled for four cases, with a dated line saying where it went. §12's line on TC-6.11's tests names them by their `describe` instead of line numbers, which had drifted. Its quote of item-attachment's Open question follows the PO's rewording. Epic 3.5 Story 10's item-positioning line routes TC-5.15, 6.11 and 6.13 to Epic 4, and says TC-6.12 moved here.
  - **Root `CLAUDE.md` and the guides need no change.** The PO checked root `CLAUDE.md`. The guides name only the shared-rules page as a kind without a catalog, and a page settled only in part has one.
  - **Work, Close, the Code map and Acceptance follow batch 1's rulings.** There's no fix and no audit. Calls 1, 3 and 5 now depend on their tests. The Code map's pointer rows carry the PO's section numbers, and its G1 and G3(a) changes are gone.
  - **For the PO, the code's behavior as context:**
    - **Call 2's question:** a column created with no name stores none. `GET /api/boards/:id` works its name out from what it covers on every read, so today the name already follows its workphases when one is renamed or the range changes. The page's Open question asks whether it should.
    - **Open questions 3 and 4:** see each question.
    - **Calls 1, 3 and 5,** by reading: the code does all three. `routes/boards.ts`'s `DELETE` refuses the last board with a 409. `routes/columns.ts`'s `DELETE` checks nothing. `validateColumnRange` refuses an overlap. Batch 3's tests confirm it.
- **2026-10-05, after batch 2 (the PO): Open questions 3 and 4, and two calls for Nathan.**
  - *Deduction k,* from §9's "keeps showing its covered items" and §4's range from one end to the other: a broken column covers the workphases between its two ends. Covering none would leave it nothing to show, so that's the one reading §9 allows. The Architect reports the code does the same. §9 states it with an example.
  - §6's naming is corrected and made precise (Open question 4's answer).
  - **Call 9, for Nathan: a column's default name follows its workphases.** The Architect reports `GET /api/boards/:id` works an unnamed column's name out on every read, so a rename or a range change already shows. Call 2 put that under Open questions while it was unknown.
    - **Recommended:** §4 states it as today's rule, like coverage, and the Open question goes. D1 has the page describe what the API does, and calls 1, 3 and 5 went in on the same footing. BCU-2.2 gains a rename.
    - The other way: keep the Open question, and BCU-2.2 asserts the name at creation only.
  - **G6, for Nathan: the 400 names an unnamed column by its id.** The overlap's and the flag change's messages quote a column's own name, or its id when it has none. Every column a new board starts with has none, so the message usually shows an id where the board shows a name (§4).
    - **Recommended: defer, with G2.** An API caller has `conflictingColumnId`, so the message matters only where a person reads it, which today is the column editor showing the API's 400. The column editor's Open question gains it, and the Architect adds it to G2's deferral.
    - The other way: fix now. The message quotes the default name, §6's sentence is marked `**Planned:**`, and batch 3 changes the code.
- **2026-10-05, Nathan's rulings on call 9 and G6.** Both as recommended.
  - **Call 9:** §4 states that an unnamed column's name follows its workphases, and its Open question is deleted.
  - **G6, deferred with G2:** the column editor's Open question gains it. *For the Architect:* add it to G2's deferral in `epic-8-decisions.md`, and take the default column name off that section's list of the page's Open questions.
  - *Done (Architect, 2026-10-05):* `epic-8-decisions.md`'s column editor entry names G2 and G6, and says the message matters only where a person reads it, since an API caller has `conflictingColumnId`. The default column name is off the list. `npm run check:docs` reports 0 hits.
- **2026-10-05, after the PO's answers and Nathan's rulings (the Test Planner).** Applied from the Handoff's two "Changed after" entries.
  - **BCU-2.8 is `Open`,** from Open question 3's answer. It's titled "A broken column still covers the workphases between its two ends", and cites §9 for its example: `A` still covers `W3`, `W2` and `W1`, still shows their items, and none of them is in `uncovered`. No case is `Pending PO` now.
  - **BCU-2.2 follows call 9.** It's titled "A column with no name of its own is named for what it covers, and the name follows its workphases". It gains:
    - a workphase rename, with no column written;
    - a range change;
    - a column that has a name of its own, which keeps it through a rename.
  - **BCU-3.1 and BCU-3.4 assert how the 400 names the column** (§6, Open question 4's answer). `conflictingColumnId` is the column's id, and the message quotes the column's own name.
    - BCU-3.1 also asserts that the message quotes the id when the column has no name of its own. That id showing to a person is G6, deferred.
    - BCU-3.4 also asserts that a flag change leaving two columns mixing, on two boards, names one of them.
  - **BCU-3.2, TC-6.7's new ID, asserts no column,** only the 400 and that nothing changes, as TC-6.7 does. It's still written in batch 3.
  - **The case count is unchanged:** 30, all `Open`.
  - **For the Coder, batch 3:** the watch-out on "the 400's message names the column" now has §6's exact form, for BCU-3.1 and 3.4.

- **2026-10-05, batch 3 (the Coder): the tests and the index pointers.** No source behavior changed, so the story still closes without an audit.
  - **Calls 1, 3 and 5 stand.** BCU-1.2, 2.4 and 3.1 pass against the code, so no rule comes off the page. BCU-2.5's "no workphase at all gets a 400, not a 404" and BCU-3.1's and 3.4's "the message names the column" hold too.
  - **The cases and their tests.** Where a test already asserted part of a case, it's extended or retitled and the partial tests it replaces are deleted. A case with one whole test needs no second one, so the API specs and the UI specs stay unmapped support.

    | Case | Test, in | What |
    |---|---|---|
    | BCU-1.1 | `boards.test.ts` | The "quick"-template test, replaced by one on the "flow" template that also reads a board made by `POST /api/boards` |
    | BCU-1.2 | `boards.test.ts` | The 409 test, extended: the board still reads with its columns; a second board; the first deleted; the second refused |
    | BCU-1.3 | `boards.test.ts` | The non-last delete test, extended: the board reads 404, neither column exists, and the kept board is unchanged |
    | BCU-1.4 | `boards.test.ts` | New: the seven writes in turn, each asserted to have succeeded, and every item row compared with a snapshot after each |
    | BCU-1.5 | `boards.test.ts` | New, with Z on a workflow of its own (the Handoff) |
    | BCU-1.6 | `boards.test.ts` | New: a project move, read on both workflows' boards |
    | BCU-2.1, 2.2, 2.7, 2.8 | `columns.test.ts` | New. 2.2 renames a workphase, changes a range, and checks that a named column keeps its name. 2.7 and 2.8 reorder the workphases first |
    | BCU-2.3 | `columns.test.ts` | The test labeled TC-6.8 that asserted the `displayMode` default, retitled and given the `expanded` half |
    | BCU-2.4 | `columns.test.ts` | The unconditional delete test, extended to what `uncovered` lists after each delete |
    | BCU-2.5, 2.6 | `columns.test.ts` | New, replacing four partial tests (an inverted POST, a foreign-workphase POST, and the PUT test of both). 2.5 adds a start of another workflow and an id that's no workphase, and that nothing changed |
    | BCU-3.1 | `columns.test.ts` | New, replacing the POST overlap test: `conflictingColumnId`, the message (the name, or the id when there is none), the edit, and the other board |
    | BCU-3.4 | `workphases.test.ts` | The two flip tests, merged and extended: the column named, items unchanged, two boards, and the accepted cases |
    | BCU-3.5 | `columns.test.ts` | The reorder test, extended to coverage, the other board's order and the workflow's order |
    | BCU-3.6 | `boards-layer.spec.ts` | New E2E: the last column's handle dragged to the first, saved, with each column's Cards unchanged |
    | BCU-4.1, 4.5, 4.7 | `workphases.test.ts` | New |
    | BCU-4.2 | `workphases.test.ts` | The boundary and sole-workphase tests, merged, with the end-of-range case added |
    | BCU-4.3 | `workphases.test.ts` | The interior-delete test, retitled |
    | BCU-4.4 | `workphases.test.ts` | The delete-with-items test, extended to two items and `invalidItems` |
    | BCU-4.6 | `workphases.test.ts` | Moved from `boards.test.ts` and rewritten as the case says: `A` broken, `B` not, and back |
    | BCU-5.1 to 5.4 | `boards.test.ts` | New. 5.2 and 5.4 give an item its foreign or missing workphase by a direct database edit, since the API refuses it |
    | BCU-5.5 | `attached-children.spec.ts` | The existing Unknown-status test, retitled |
    | BCU-3.2, 3.3 | `columns.test.ts` | **Held.** TC-6.7's and TC-6.8's three tests keep their IDs until the cases move |
  - **Pointers** are on the Code map's sites. Two differ from the Handoff's list. An unnamed column's name is worked out in `boards.ts::displayNameFor`, so §4's name pointer is there, not in `routes/columns.ts`. Rules with one enforcing site carry one pointer: the flag change's refusal (§6) is on `findColumnsMixingTerminalAfterFlip` only, and the board scope (§3) on `getBoardScopeItems` only. A search for `wiki item-positioning §6` finds no pointer to the column rule; the other five concern items' active/done split.
  - **Checks:** `npm run check` passes (363 server tests, 426 client, 75 scripts, 0 checker hits on 272 files), and so does the full E2E suite (154 passed, 8 skipped). Each new server assertion was made to fail by breaking its rule in the source, 23 breaks in all, and BCU-3.6 by skipping the column branch of `handleDragEnd`. Every break was caught by the case it targets, and each file was put back.

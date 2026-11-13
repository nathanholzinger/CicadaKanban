# Epic 4 Story 1 — The Status Model

**Type:** story · **Written:** 2026-11-12 by the Architect · **Status:** planning. D4 and D6 are ruled (2026-11-12). D1–D3 and D5 come next, and the plan is approved once they're made · **Sequenced:** after `positioning-on-create-and-edit.md` is decided and the API contract epic is built ([`epic-4-roadmap.md`](epic-4-roadmap.md), Sequencing). Nothing here is built before then.

## Goal

Every item holds a status, `backlog`, `active` or `done` (working names). A workflow's workphases subdivide Active and nothing else. Done stops being a property of a workphase, and the code stops reading the terminal flag. The terminal workphases and the flag's database columns stay until the epic's Story 7 (D6). An attached item stops holding a workphase, and holds a status it reads alongside its parent's.

It builds the roadmap's ground rules G1–G6, G7, G9's 400, G10, G11, G14 and G15, and the answers Phase 0 gives to Q2, Q6, Q17 and Q22. It also takes the board's minimum: the change that keeps the board working once Done is a status (D4).

**Out of scope:**
- **The board's Backlog column, the Done column's new behaviors, and a Stub's done look** (G8's Backlog half, G12, G16, G17). They're Story 2's. This story takes only the board change that keeps the board working (D4).
- **Deleting the terminal workphases and dropping the flag's database columns** (Story 7, D6). Until then a board can show its old "Done" workphase beside the new Done column.
- **Two position values** (Story 3). This story changes which items hold the one position there is, and nothing else about positions.
- **A stored kind, and Free Quick Items** (Story 5). An attached item is treated as quick by being attached (G10), so this story needs no `kind` field unless D2 rules that attaching changes it (Q17).
- **A Stub's checkbox** (Story 4). This story gives an attached item a status the API can set. The board's control for it comes later.
- **A move between workflows** (G9). It keeps today's behavior, refused when it strands a Free item, and the wiki and cases go no further into it.

## Scope

- **Wiki passages** *(the PO fills this in at Phase 1)*. Expected to touch:
  - a new page for the status model;
  - item-attachment §2, §2a, §10, §12 and §14, and its Open question on a project that uses no workflow;
  - item-positioning §2, §5 and §6;
  - boards-columns-unsorted §3, §6, §8 and §10;
  - board-drag-interaction, for the Done column and Stubs, as far as D4 brings the board into this story.
- **Test-plan cases** *(the Test Planner fills this in at Phase 2)*:
  - fixed: TC-5.15;
  - answered: ATT-5.11's first half;
  - retired: TC-6.11, TC-6.13 and BCU-3.4;
  - new: the new page's catalog;
  - revised: the cases under the sections above.

## Inbound deferrals

Each was routed to Epic 4 before this plan existed, and the roadmap's Story 1 entry lists it here.

- **`epic-4-decisions.md` §9: an attached item's workphase, copy or inherit.** It closes under G10 and G11. The workphase cascade (`attachedCascade.ts::cascadeWorkphaseToAttachedDescendants`) goes, and nothing is written in its place.
- **`epic-4-decisions.md` §12:**
  - **TC-5.15** (A3's Open question 18). The magnitude threshold's `n` counts done items. It's fixed by D3's scope: `n` counts the items that aren't Done.
  - **TC-6.11 and TC-6.13.** Retired with the terminal flag (G5). TC-6.11's tests are the three backfill tests under `describe('isTerminal flip')` in `server/tests/routes/workphases.test.ts`. They carry no ID, and they go with the backfill.
  - **ATT-5.11, first half.** A write that names a workphase for an item whose project uses no workflow is refused with a 400 (G9). Its second half goes to the Sheet's epic by ID, and Phase 7 checks that `epic-7-decisions.md` names it.
- **BCU-3.4** (the terminal-flag refusal; `epic-4-decisions.md` §12 records its leaving that list). Retired with the flag.
- **The A6 audit's #44 and #45, with the re-run's #24 and #25** (`docs/audits/code-quality-audit-a6.md`, `code-quality-audit-a6-rerun.md`; approved for this rework on 2026-10-21 and 2026-10-23):
  - **#44 and #25: the workflow-membership rule written four ways,** in `routes/items.ts` (twice), `routes/boards.ts` through `getBoardScopeItems`, and `routes/workflows.ts`. Each builds an `isTerminalOf` lookup for `withPositionScope`. With the flag gone, the lookup changes, and the four become one `withPositionScopes(rows, workphaseRows)` in `itemPositionScope.ts`, the shape the re-run proposed.
  - **#45 and #24: the active/done split in three homes,** the terminal-flag backfill (`routes/workphases.ts::backfillItemsForTerminalFlip`), `POST /items` and `itemHierarchy.ts::applyHierarchyRequest`. The backfill goes with the flag. The other two become one rule in the primitive, read by status, with the check before the append, so a move into Done no longer fires a reindex it discards (#24).
- **Story 6.1's C-6b** (the card-list facts derived in three places, `epic-8-decisions.md`'s column-rework item 2) is due "when the done-column rework settles `isTerminal`". It's Story 2's under the roadmap's split. Under D4 the client's `isTerminal` reads change here, so Phase 5 says whether C-6b comes with them.

## Approach and phases

### Phase 0 — Decisions

Nathan rules these, D2 with the PO, before Phase 1 starts. D4 and D6 shaped the phases, and are ruled. D1–D3 change what this story's passages and rules say, but not its phases.

**D1. The names (the roadmap's Q22).** *Blocks Phase 1.*
- **The three statuses.** Nathan leans to Backlog, Active and Done, as the API's `backlog`, `active` and `done`.
- **The two kinds.** Nathan says quick and full; the MVP roadmap's entry says `kanban | quick`. This story names the kind only in the wiki, since it stores none (Q17).
- **The column for what a board can't place.** The wiki and the API call it Unsorted, with a `needsAttention` flag. Nathan calls it the needs-attention column. A rename touches the API field names, so it's cheapest here, while Story 1 is reshaping the board response anyway.
- **A collision to weigh:** the seeded workflow template called "quick" (Todo, Done). After G5 it's a one-workphase template called "quick", beside a Quick Item kind.

**D2. Does a workphase outlive Active, or attachment? (Q2, with Q17).** *Nathan takes it to the PO.* The options and the slip-and-undo table are under the roadmap's Q2. What each answer changes here:

| | (a) Cleared | (b) Kept as a memory |
|---|---|---|
| A write that leaves Active, or attaches | Clears `workphaseId` | Leaves it |
| Making an item Active, naming no workphase | The first workphase (G6) | The kept one if the workflow still has it, else the first |
| Story 7's cleanup, for attached items | Clears their copied workphase | Keeps it, never updated |
| Story 7's cleanup, for Done items | Their old terminal workphase is deleted, so it's cleared | The same |
| What reads must check | Status and attachment first until Story 7. After it, `workphaseId` alone means Active and Free | Status and attachment, before `workphaseId`, always |
| Q17's stored kind, if Nathan ties it to this | Attaching makes it quick | Attaching leaves it |

**D3. Which items hold a position? (Q6).** *Nathan is picking at the recommendation.* It's in the roadmap's Q6, with its three things to pick at. Here it decides:
- what `itemPositionScope.ts::classifyPositionScope` returns for a Backlog item, and where its scope comes from when it holds no workphase: the workflow its project uses;
- whether Backlog to Active keeps the position (one shared order) or appends (two orders);
- TC-5.15's `n`.

**D4. How this story and Story 2 land.** *The decision with the most effect on this plan.*

Under any answer to D2, this story breaks the board as it's built today:
- **The board's Done gesture stops making an item Done.** Once the server reads status rather than the terminal flag, a drop on a terminal workphase's column is an ordinary workphase move. The client still draws that column as a done list, ordered by completion and with no reorder, so the item looks done while it's Active.
- **Attached items lose the cascade.** The board client gathers every item out of the board response's sub-rows, `uncovered` and `invalidItems` (`useBoardLoad.ts`), and finds attached items in the sub-row of the workphase they copied. An attached item created with no workphase lands in `invalidItems`, and its board raises `needsAttention`.
- **The client reads `isTerminal`** in about a dozen files for the done list's order, bands and shuffle. Eight UI spec files, two drag helpers and four API spec files rely on a Done column.

The options:
- **(A) Expand here, contract in Story 2.** This story adds `status` and runs the server's rules on it, but keeps the terminal workphases and the cascade, kept in step by a temporary shim: a write to Done also files the item in a terminal workphase. Story 2 moves the board over, then deletes the shim and the flag. The board never breaks, at the price of throwaway code with two meanings of "done" at once.
- **(B) Back to back.** This story is server-only, as the roadmap's first draft had it, and Story 2 follows at once. The board, and the E2E suite with it, is broken in between, and the specs that break are skipped. That's Story 8's code-first route, which left Story 10 its catch-up.
- **(C) One story.** Stories 1 and 2 merge. Nothing breaks, and nothing is thrown away, but it's the epic's largest story by far.
- **(D) This story takes the board's minimum.** The server half as planned, plus the smallest board change that keeps every surface working:
  - the board response carries each item's status, lists attached items by tree, not by workphase, and counts only a Free, Active, full item toward `needsAttention` (G7);
  - the board shows a Done column after its configured columns, reading status rather than a terminal workphase. A drop on it is a status write. It keeps today's done-list rules: no manual order, oldest first, a set-down writes nothing;
  - an old terminal workphase's column, which stays until Story 7 (D6), is drawn as an ordinary column.

  Story 2 keeps the Backlog column, newest-first (G16), the zoom into a done Card (G17), the side highlight in a done list, a Stub's done look (G12), and C-6b.

**Ruled: (D)** (Nathan, 2026-11-12), as the Architect recommended. Main never holds a broken board, no spec is skipped, and there's no shim to write and then delete. The Done column is the one board feature this story can't do without, since the terminal workphases it replaces are gone.
- **A Coder's option worth sizing in Phase 3:** the board response synthesizes the Done column as a column with a reserved id, so the drag layer keeps treating it as a done card list. Its region's `isTerminal` becomes "is the Done column", and its drop sends a status in place of a workphase.
- **The roadmap's Story 1 and Story 2 entries** are redrawn to match.

**D6. Does the destructive half of the migration wait for a follow-up story?** *Nathan's suggestion (2026-11-12).*
- **Nothing guards a workphase's name.** G3 allows a workflow its own "Backlog" or "Done" workphase. The migration deleted the terminal workphases because they were Done in the old model, not because of their names.
- **The suggestion:** leave existing workflows as they are, so a board can show its old "Done" workphase beside the new Done column. Verify the new behavior on a new test board without the doubles, and verify that the doubles look awkward but break nothing. The migration becomes its own story.
- **What can't wait: the status backfill.** The new `status` column defaults to `backlog` (G2), and a board reads status first (G7). Added with no backfill, every existing item reads as Backlog and leaves its column. So this story still sets each existing item's status from today's data, by D5. It's a backfill and deletes nothing: every item keeps its workphase.
- **After the backfill, the old "Done" columns are empty.** Their items are Done, so they show in the new Done column. The old column stays as an ordinary workphase, and a card dropped on it is an Active item there.
- **What Story 7 takes:**
  - deleting the terminal workphases;
  - dropping the flag's database columns, which this story's code stops reading;
  - under D2's (a), clearing attached items' copied workphases, which nothing reads after this story.
- **Ruled: split** (Nathan, 2026-11-12), with the exception below, as the Architect recommended. No user data is deleted in the same story that changes what the data means, and the doubles are harmless once the backfill has run.
- **The exception, taken here:** drop the "Done" phase from the two seeded workflow templates. They're system data, not anyone's work. Otherwise every new workflow is born with the double, and a new test board without one is just a new workflow.

**D5. Smaller rules, for this story's wiki.** The Architect's recommendations. Nathan rules them with D1–D3, or leaves them to the PO's Phase 1:
- **The status backfill** (G5, D6). Each Free item in a terminal workphase becomes Done, keeping its `completedAt` and its workphase. Every other Free item becomes Active, one with no workphase included, so it stays in needs-attention as it shows today, and nothing becomes Backlog by its own status. An attached item stores `backlog` and reads as its parent's (G11), so the backfill walks no tree.
- **Writing an attached item's status earlier than its parent's.** It's accepted and stored, and it reads as the parent's. Reopening the parent shows it. That's the stored half of G11.
- **A create that names a status and a workphase that disagree,** such as Backlog with a workphase, or a workphase with Done. It's refused with a 400.
- **A Done item's position and `completedAt`.** Entering Done drops the position and sets `completedAt`. Leaving it clears `completedAt` and appends, as leaving a terminal workphase does today. Backlog to Active follows D3.
- **What the API returns for an attached item:** its stored status and the status in effect. A filter by status, such as the Inbox's later, reads the one in effect.
- **Entering Done and notifications.** A workphase can raise a notification when an item enters it. Recommendation: Done raises none, as no seeded Done workphase does today. Revisit with the Dashboard, Navigation & Notifications epic's events.
- **Which writes may name a status.** The hierarchy primitive takes it, since status decides position and `completedAt`. Which entry points accept it follows `positioning-on-create-and-edit.md`'s Decision 4, as `workphaseId` does. MCP's `create_item` and `move_item` gain it.

### Phase 1 — The wiki *(PO)*

The PO writes the decisions in as `**Planned:**` passages, on a new status-model page and in the sections Scope lists, and fills in Scope's wiki passages. It needs D1's names. The roadmap's ground rules and Phase 0's answers are the source. Nothing in the code changes.

**Stop:** Nathan reviews the passages.

### Phase 2 — The test plan *(Test Planner)*

The Test Planner writes the new page's catalog, revises the cases under the changed sections, retires TC-6.11, TC-6.13 and BCU-3.4 once the passages drop their rules, and fills in Scope's cases. ATT-5.11's second half is re-routed to the Sheet's epic by ID.

**Stop:** Nathan reviews the cases.

### Phase 3 — Schema and migration *(Coder)*

- **Schema:** `items.status`, required, defaulting to `backlog` (G2). The code stops reading `workphases.isTerminal` and `workflow_template_phases.isTerminal`. `types.ts` is synced by hand, or from the contract if the API contract epic's OD1 has replaced that.
- **A SQL migration** in `server/drizzle/`, in this order:
  1. add the column, and backfill each item's status by D5;
  2. delete the seeded templates' "Done" phases (D6's exception).

  Nothing else is deleted. Story 7 deletes the terminal workphases, drops the flag's columns, and under D2's (a) clears attached items' copied workphases.
- **The seeds:** `runMigrations.ts`'s templates, `deepSeed.ts`, and the server tests' fixtures.
- **A migration test** over a seeded database with every case: Done Free items, active ones with and without a workphase, attached items under each, a column covering only Done.
- **Sizing for D4:** the Coder sizes the synthesized-column option before Phase 5 starts.

**Stop:** the gate, review and commit.

### Phase 4 — The server's rules *(Coder)*

- **The hierarchy primitive** (`itemHierarchy.ts`) takes a status:
  - `validateHierarchyRequest` and `resolveCreate` refuse what D5 and G9 refuse;
  - `applyHierarchyRequest` sets `completedAt` and the position by status, in one place (#45, #24), and applies D2 to `workphaseId`;
  - `attachedCascade.ts` is deleted, and nothing writes down the tree.
- **The status in effect:** one function, the later of an attached item's own status and its parent's in effect, walking up at most to the depth cap. It lives beside `itemTree.ts`'s walks.
- **Positions:** `itemPositionScope.ts` classifies by status (D3), and the four lookups become one `withPositionScopes` (#44, #25). TC-5.15's `n` counts only the items that aren't Done.
- **Routes:**
  - `POST /items` takes a status (G14);
  - `PUT /workphases/:id` loses the flag and its backfill (`backfillItemsForTerminalFlip`);
  - `columnRanges.ts` loses the done-and-active column rule and `findColumnsMixingTerminalAfterFlip`;
  - `GET /workflows/:id` returns status.
- **MCP:** `create_item` and `move_item` take a status, and their descriptions stop saying an attached item takes its parent's workphase.
- **Vitest:** route and lib tests for every rule above. The tests that assert the flag are deleted with it, and listed in the handoff.

**Stop:** the gate, review and commit.

### Phase 5 — The board's minimum *(Coder)*

- **The board response:** each item's status, attached items listed by tree, `needsAttention` by G7, and the Done column (D4).
- **The client:**
  - the Done column draws from status, and a drop on it writes `status: done`;
  - the done list keeps today's rules;
  - an old terminal workphase's column is an ordinary column until Story 7 deletes it;
  - the client's `isTerminal` reads become reads of "is the Done column", and C-6b comes with them if the Coder finds it cheaper now than in Story 2.
- **Hands-on, by Nathan:** a new test board, with no double, for the new behavior, and an existing board, with its old "Done" column, to see the double is only awkward.
- **Vitest** for the client's pure modules, as the drag layer's `AGENTS.md` requires.

**Stop:** the gate, review and commit.

### Phase 6 — The Playwright tests *(QA Engineer)*

- **The Scope's `Open` cases,** API cases first.
- **The specs this story breaks,** fixed here: about a dozen files that rely on a Done column, and `tests/helpers/boardDragScenario.ts` and `boardDragSurface.ts`. A test a story breaks is fixed in that story, unless the code is still being reworked.
- **The Test Reviewer** for every changed ID-bearing test.

**Stop:** a green full run, review and commit.

### Phase 7 — Close

By the story-done checklist:
1. the Coder's handoff;
2. the PO clears the Planned markers;
3. the Test Planner's pass;
4. the Reconciler;
5. the audit;
6. Nathan signs off.

`epic-7-decisions.md` must name ATT-5.11's second half before the Reconciler runs.

## Code map

Planned, and kept current once coding starts.

| Symbol | Carries |
|---|---|
| `schema.ts::items` (`status`) | G1, G2 |
| `itemHierarchy.ts::validateHierarchyRequest`, `resolveCreate` | G9's 400, D5's refusals, G14 |
| `itemHierarchy.ts::applyHierarchyRequest` | The active/done split, once (#45, #24); D2 |
| the status-in-effect walk, beside `itemTree.ts` | G11 |
| `itemPositionScope.ts::classifyPositionScope`, `withPositionScopes` | D3; #44, #25 |
| `attachedCascade.ts` | Deleted (G10) |
| `routes/workphases.ts::backfillItemsForTerminalFlip` | Deleted (G5) |
| `columnRanges.ts::findColumnsMixingTerminalAfterFlip` | Deleted (G5) |
| `routes/boards.ts` | G7; D4's Done column and attached items |

## Results

## Review log

## Amendments

- **2026-11-12 — D4 and D6 ruled (Nathan).** This story takes the board's minimum, and the migration's destructive half moves to the epic's Story 7, with the templates' "Done" phases dropped here. The Goal, Out of scope, D2's table, Phase 3 and Phase 5 changed to match, and the roadmap's Stories 1, 2 and 7 were redrawn.

## Open questions

- **For Nathan:** D1 and D3, and D5 unless he leaves it to the PO.
- **For Nathan, with the PO:** D2.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:**
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Vitest tests whose assertions or setup changed:**
- **Wiki sections added, changed, moved or removed** (PO, at close):

# A5a — Item Movement Rules

**Type:** story, in the A-series. It changes what the API accepts, so it closes by the full story-done checklist, audit included. · **Written:** 2026-09-30 by the Architect, from A5's D2 and the rulings made while grooming it · **Status:** planning · **Sequenced:** first of A5's three stories (A5a, A5b, A5c), before A6

## Goal

Settle the item-movement rules A3 left `Pending PO`, write them into the wiki, and make the API enforce them.

The principle behind the rulings (Nathan, 2026-09-30):
- **The UI and the MCP tools** offer only what's intended.
- **The API** refuses what isn't allowed, and its message says what to do instead. Agents write through MCP, which calls the same REST API, so a UI guard alone never stops a bad write. MCP passes the API's error text to the agent word for word.
- **Unsorted** catches what gets past: direct DB edits, and cascades not designed yet, such as a project moving under a different workflow.

Out of scope:
- The sidebar's rules, the Sheet's page and ATT-4.12/4.13 (A5b); boards-columns-unsorted (A5c).
- Re-filing items when a project or subtree changes workflow. The likely shape is a write that carries a map from old workphase to new, or a default, committed with the move. It's a later design, not this story's.
- Epic 4's status model (`docs/planning/epic-4-decisions.md` §13).

## Scope

- **Wiki passages** *(PO, in phase 1)*: item-attachment §1, §4, §7, §9 and §11, plus wherever the create rules land; item-positioning §2, §6 and §7.3. The PO replaces this line with the exact passages.
- **Test-plan cases** *(Test Planner, in phase 1)*: ATT-1.8, 1.10, 1.13, 3.11, 5.7, 5.8; TC-2.32, 6.10, 7.18; and any case the phase adds. TC-6.13 goes to Epic 4 (R11). ATT-4.12 and 4.13 go to A5b.

## Inbound deferrals

Everything below came through A5's plan, which was split into A5a–c on 2026-09-30:
- **The `Pending PO` cases in Scope,** routed by the Test Planner from A3 batches 4, 5 and 6.
- **A4's handoff to the PO:** a create with a parent and no attachment flag (R6).
- **The Test Planner's list of tests that pin today's answers,** kept under "Tests that pin today's answers" below.

## Approach and phases

### Rulings

Each ruling says what the code does today and what changes. "Refused" means a 400 whose message names the way out.

**R1. An attached item takes its parent's workphase** (ATT-1.13, ruling 13).
- Refused: a write whose resulting state is attached and names a workphase other than the resulting parent's.
- Accepted: naming the resulting parent's own workphase, or omitting it, in which case the item takes the parent's.
- "Parent" means the parent after the write. So two writes stay legal:
  - a detach that files the item in the same write, which is what a Stub dropped on a column sends (`dragRequest.ts::toRequest`);
  - an attach that names the new parent's workphase.
- Today `PATCH /move` refuses already, and `PUT` takes no workphase. `POST` ignores a disagreeing workphase instead (`routes/items.ts`'s create). It refuses from now on.
- A stored copy that drifts, for example through a DB edit, shows with its parent on the board. Unsorted doesn't catch it. The integrity check in `epic-4-decisions.md` §9 belongs to Epic 4.

**R2. A create names its project, its parent, or both** (ATT-5.7, ruling 15).
- `projectId` alone: a top-level item.
- `parentId` alone: the child takes the parent's project.
- Both, and they agree: fine. Both, and they disagree: refused.
- Neither: refused.
- This is today's code, so R2 changes only the wiki.

**R3. A Free item's workphase belongs to its project's workflow, or it has none** (ATT-5.8; ruling 16, broadened on 2026-09-30).
- A write is refused if it would leave any Free item it moves in a workphase that item's project's workflow doesn't use. That covers:
  - naming such a workphase, with or without a reparent;
  - a cross-workflow reparent of a Free item, or of any item with detached descendants. These are refused until re-filing is designed (see the Goal).
- Allowed:
  - a cross-workflow reparent of an attached item with no detached descendants, since the whole subtree takes the new parent's workphase;
  - a cross-project reparent within one workflow (ATT-5.1).
- Project moves stay allowed, since the sidebar offers them. Their items land in Unsorted, which is what it's for.
- It's a data rule, so it belongs in the shared primitive, which `PUT` and `PATCH /move` both run, and `POST` applies it too. `routes/items.ts::crossWorkflowMoveError` becomes redundant. The Coder confirms that and removes it.
- No item write reaches item-positioning §7.3 (nulling positions on a cross-workflow reparent) any more. The PO decides how §7.3 reads. TC-7.18 still matters, for items a project move leaves behind.

**R4. A write that leaves an item Free without naming a workphase gives it the one it was shown in** (Nathan, 2026-09-30).
- That's its nearest Free ancestor's workphase. It isn't the root's, because a detached item partway up starts its own chain. It isn't the item's own stored copy either, which differs only after drift.
- It applies to three writes:
  - a detach;
  - a reparent to root of an attached item;
  - a create under a parent with `isAttached: false`.
- If that ancestor has no workphase, the write is refused. The message offers two ways out:
  - name a workphase in the same write, which is the fix when moving a sub-item into a workflow while its parent has none;
  - fix the Free ancestor's status, which is the fix for an item in Unsorted.
- An explicit `workphaseId: null` stays accepted, as today. Omitted means "where you were shown", and `null` means none on purpose. The message doesn't suggest `null`, because a full item with none shows in Unsorted.
- Today a detach keeps the item's stored copy (`itemHierarchy.ts::deriveResultingState`), and a detached create with no workphase stores none.
- This is §9's "materialize on detach", so it holds whichever way Epic 4 rules on §9.

**R5. An item may have no workphase** (Nathan, 2026-09-30).
- A top-level create may omit its workphase, even in a project with no workflow. The code allows it today, and still will.
- Every item today is a full item. A full item with no workphase isn't what the board expects, so it shows in Unsorted, whatever the cause. The UI doesn't need to handle this well until Epic 4 (§13). A5c's page states it.
- MCP's `create_item` description ("omit to leave the item unsorted") stays accurate.

**R6. The attachment flag is a state: an item is attached to its parent** (ATT-1.8, 3.11, and A4's handoff; decided 2026-09-30).
- This reverses Ruling A from A3 batch 4, which let a parentless item hold the flag. The flag is set only on an item with a parent.
- Refused: an explicit `isAttached: true` whose resulting state has no parent. `PUT` and `PATCH /move` refuse it today. `POST` stores it, and from now on refuses it.
- A parentless create stores the flag clear. Today it stores true by default (`routes/items.ts`'s create, and `schema.ts`'s column default).
- A create with a parent and no flag is Attached. That's the PO's recommendation, and today's code.
- A reparent that omits the flag keeps the item's state. An attached item stays attached. A top-level item, whose flag is clear, becomes a detached child. Item-attachment §4 narrows to "No reparent attaches by default."
- A reparent to root clears the flag (§11), as today.
- A migration clears the flag on existing parentless rows.
- **The Sheet.** Its parent picker sends only `parentId` (`ParentSection.tsx`). So under R6, reparenting a top-level item there would make it a detached child, where today it attaches. The plan has the Sheet send `isAttached: true` when the item has no parent, which keeps today's behavior (Open question 1). Board drags send the flag explicitly, so they don't change.

**R7. Tags get no tests until the Tags & Type System epic** (ATT-1.10; Nathan, A3 batch 4). Item-attachment §12's tags get `**Planned:**`.

**R8. The raw position is retired** (TC-2.32).
- `PATCH /items/:id/move` stops accepting `position`.
- `PATCH /items/reorder` goes, and so does `api/items.ts::reorderItems`, which has no caller.
- Test setup that needs an exact position writes it outside the API. That's the "new pipe" for something the API disallows:
  - server tests write the DB directly, as the ATT-4.7 test already does;
  - E2E's `seed.ts::seedPositionedItems` pins through a new test-only route under `/api/test`, mounted only with `ENABLE_TEST_ROUTES`.

**R9. An item in another workflow's workphase has `positionScope` `"none"`** (TC-7.18, the Test Planner's view). Item-positioning §2's list of `"none"` cases gains it. `itemPositionScope.ts::classifyPositionScope` needs the item's project's workflow to tell. The Coder picks how to supply it, since callers already build lookups.

**R10. Done items tied on `completedAt` order by `createdAt`, as the client does today** (TC-6.10, `itemListOps.ts::byCompletedAtThenCreatedAt`). This changes only the wiki.

**R11. TC-6.13 goes to Epic 4,** into `epic-4-decisions.md` §12 beside TC-6.11 and 6.12, since it depends on the terminal flag.

### Phases

Each phase ends with the gate (`npm run check`) and a stop for review and commit.

**Phase 1: the wiki and the cases.** No code.
- The PO writes R1–R10 into item-attachment and item-positioning.
  - A rule the code doesn't meet yet is `**Planned:**`: R1's create refusal, R3, R4, R6, R8 and R9. R2, R5 and R10 are today's behavior.
  - Tags (R7).
  - How §7.3 reads (R3).
  - If a rule moves to another section, phase 2 re-points the comments that cite it, found by searching for `wiki <page> §N` (A5b's D4).
- The Test Planner resolves each `Pending PO` case against the new text: kept, changed or deleted.
  - It adds the cases the rules need, for example R4's three writes, R3's refusal for descendants, and R6's create.
  - It fills in Scope.
  - It updates the catalog's routing for ATT-4.12 and 4.13 (to A5b) and TC-6.13 (to Epic 4).
- The Architect adds TC-6.13 to `epic-4-decisions.md` §12 and to Story 10's item-positioning line in the Epic 3.5 roadmap.
- **Stop:** Nathan reviews the wiki text before any code.

**Phase 2: the hierarchy rules** (Coder): R1, R3, R4 and R6.
- The primitive (`itemHierarchy.ts`) and `POST`. Whether `POST` goes through `validateHierarchyRequest` or shares its checks is the Coder's call, recorded in the Code map.
- The migration for parentless flags. Whether the column default changes is the Coder's call.
- The Sheet's flag (R6), and the MCP tool descriptions. Every new refusal's message names the way out.
- Tests for the phase's cases, each titled with its case ID. Tests that pin a superseded answer are updated (the list below).

**Phase 3: positions** (Coder): R8 and R9.
- The test route, `seedPositionedItems`, and the server tests that pinned positions through the API.
- Bruno's item requests and their docs.
- The gate plus `npm run test:e2e`, since the E2E seed changes.

**Then the story-done checklist,** steps 1–6. The PO takes the `**Planned:**` markers off at step 2.

### Tests that pin today's answers

From the Test Planner's A3 batch 4 confirming run. Each group ends with what happens to it under the rulings.
- **The ATT-1.8 refusals:** `items.hierarchy.test.ts`'s "ATT-1.8: rejects isAttached: true with no resulting parent" and "ATT-1.8: PUT rejects a parentless attach". *Stay:* R6 keeps the refusal.
- **Clearing the parent clears the flag:** `items.hierarchy.test.ts`'s "ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag…", and `items.test.ts`'s "ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase". *Stay.*
- **Depend on a parentless create storing the flag:**
  - ATT-1.1's test in `items.test.ts`;
  - `items.hierarchy.test.ts`'s "ATT-4.7: a tree already past the cap loads…", whose chain is attached only through that flag;
  - `items.test.ts`'s "creates a parentless item with isAttached true (the default)…", which also carries TC-2.17.

  *Change:* a parentless create stores the flag clear. ATT-4.7's chain needs real attached links.
- **ATT-1.13:**
  - `items.hierarchy.test.ts`'s "rejects a workphaseId that contradicts the parent an attached item inherits from…" *stays*;
  - `items.test.ts`'s "an attached child inherits the parent workphase even when a different one is passed" *inverts*: the create refuses.
- **ATT-3.11 and ATT-4.12:** `attached-children.spec.ts`'s "the Parent dropdown excludes descendants, and reparenting nests the item under its new parent". *Keeps passing* if the Sheet sends the flag (R6). `items.test.ts`'s "accepts reparenting under a parent in a different project…" asserts nothing about the flag.
- **ATT-5.7:** `items.test.ts`'s "rejects creating a child whose projectId differs from its parent". *Stays.*
- **ATT-5.8:** `items.hierarchy.test.ts`'s "rejects a workphaseId from a workflow the item's project does not use…" and "rejects a one-step reparent into a different-workflow project that also names a workphaseId". *Stay:* R3 keeps both refusals. Their messages may change if `crossWorkflowMoveError` goes.
- **Misstamped:** `items.hierarchy.test.ts`'s "ATT-3.9, ATT-3.10: a Free item can be reparented…" reparents a top-level item, which is ATT-3.11's scenario. Whether it gains ATT-3.11 is the Test Planner's call. Its flag is clear, so it stays Free under R6.

## Code map

The starting list. The Coder keeps it current and records which symbol carries which ruling.

| File | Phase | Change |
|---|---|---|
| `server/src/lib/itemHierarchy.ts` | 2 | R1's check against the resulting parent, R3's subtree check, R4's nearest Free ancestor, R6's flag |
| `server/src/routes/items.ts` | 2, 3 | `POST`: R1, R3, R4, R6. `crossWorkflowMoveError` removed (R3). `PATCH /move` drops `position`, and `PATCH /reorder` goes (R8) |
| `server/drizzle/` | 2 | A migration clearing the flag on parentless rows (R6) |
| `server/src/db/schema.ts` | 2 | The flag's default, if the Coder changes it (R6) |
| `server/src/mcp.ts` | 2 | The `create_item`, `update_item` and `move_item` descriptions |
| `client/src/components/item-detail/ParentSection.tsx` | 2 | Sends `isAttached: true` when reparenting an item with no parent (R6) |
| `client/src/test/itemFixture.ts` | 2 | A parentless fixture's default flag (R6) |
| `server/src/lib/itemPositionScope.ts` | 3 | R9 |
| `server/src/routes/testHelpers.ts` | 3 | The position-pinning test route (R8) |
| `client/src/api/items.ts` | 3 | `reorderItems` and `MoveItemInput.position` go (R8) |
| `tests/helpers/seed.ts` | 3 | `seedPositionedItems` pins through the test route (R8) |
| `bruno/items/` | 3 | Requests and docs (R8, and the rules they describe) |
| Server tests and E2E specs | 2, 3 | New cases, and the tests listed above |

## Amendments

## Open questions

1. **For Nathan:** under R6, should the Sheet send `isAttached: true` when reparenting a top-level item, which keeps today's behavior? Or may the item become a detached child until the Sheet epic? The plan assumes the first.
2. **For the Test Planner:** does a case already cover a create with a parent and no flag (R6, from A4's handoff)?
3. **For the PO:** how item-positioning §7.3 reads once no item write reaches it (R3).

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:**
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Wiki sections added, changed, moved or removed** (PO, at close):
- **To the Architect:** root `CLAUDE.md`'s "One hierarchy-write primitive", if `POST`'s route through the primitive changes.
- **To A5b:** anything phase 2 changes in the Sheet (`ParentSection.tsx`), for the Sheet's page.
- **To A5c:** R5's rule for a full item with no workphase, and R3's project moves, for the page's account of Unsorted.

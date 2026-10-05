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

- **Wiki passages** *(PO, in phase 1)*. Each `**Planned:**` passage is one phase 2 or 3 builds, and the PO takes its marker off at close.
  - **item-attachment:**
    - the opening paragraph: names the workphase rules, creates and deletes;
    - §1: "Attached with no parent" narrowed to a move or an edit, and a **Planned** bullet holding a create to it (R6);
    - §2a, new, "The workphase a write leaves an item in":
      - an Attached item takes its parent's workphase, and a move naming another is refused (R1). **Planned:** a create is refused the same way;
      - an Attached item shows with its parent whatever its own `workphaseId` says (R1);
      - **Planned:** an item leaving attachment takes the workphase it was shown in (R4);
      - a Free item's workphase belongs to its project's workflow, and a move naming another is refused (R3). **Planned:** a create too, and the cross-workflow reparent (§9);
    - §4: "Omitting the flag keeps the item's current state" narrowed to a detached child, and a **Planned** paragraph for a top-level item, ending "No reparent attaches by default" (R6);
    - §7: a **Planned** paragraph replacing "and neither is cross-workflow" (R3);
    - §9: a **Planned** paragraph refusing a cross-workflow reparent that would leave a Free item in the moved subtree, replacing the cross-workflow paragraph and the closing note (R3);
    - §11: *Replaced by §2a* notes on "takes its own workphase" and "Its workphase is whatever it holds at that moment" (R4);
    - §12: tags moved out of the Card bullet into a **Planned** bullet (R7);
    - §14, new, "Creating an item": project, parent or both (R2); a child is created Attached unless the create clears the flag (R6); a workphase is optional (R5);
    - Open questions: a new entry, "Re-filing across workflows".
  - **item-positioning:**
    - §2: a **Planned** paragraph retiring the raw position (R8), and a **Planned** paragraph adding `"none"` for an item in another workflow's workphase (R9);
    - §2.1: a *Replaced by §7.3* note on the cross-workflow row (R3);
    - §6: a new bullet, a done list's order and its tie-break, with an example (R10);
    - §7.2: a *Replaced by §7.3* note on its closing sentence (R3);
    - §7.3: a **Planned** paragraph (no item write nulls a position any more), and a paragraph on the items a project move leaves behind (R3; Open question 3);
    - Open questions: a new entry, what a project move under a different workflow does to its items' positions.
- **Test-plan cases** *(Test Planner, in phase 1)*:
  - **`Open`,** live today: ATT-1.8, 5.7, 9.1, 9.3, 9.8, 10.1, 10.2, 10.3; TC-6.10, 7.20. Each needs a test that carries its ID.
  - **`Planned`,** built in phase 2 or 3: ATT-1.14, 3.11, 5.9, 5.10, 9.2, 9.4, 9.5, 9.6, 9.7, 9.9; TC-2.32, 7.18, 7.19. Each becomes `Open` when the PO takes its passage's marker off.
  - **Replaced once built, then deleted:** ATT-5.4 (by 5.9), ATT-5.5 (by 5.10) and ATT-7.3 (by 9.4); TC-7.17 (by 7.19).
  - **`Pending PO`:** ATT-9.10 (Open question 5), for the PO at step 2.
  - **Routed elsewhere:** ATT-1.10 is `Planned` until the Tags & Type System epic builds §12's tags (R7). ATT-4.12 and 4.13 go to A5b, and TC-6.13 (R11) and ATT-5.11 (Open question 4) to Epic 4, all four still `Pending PO`.

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
- **The Sheet keeps today's behavior until the Work Item Detail & Chat UI epic** (Nathan, Open question 1).
  - Its parent picker sends only `parentId` (`ParentSection.tsx`). Under R6, reparenting a top-level item there would make it a detached child, where today it attaches. So it sends `isAttached: true` when the item has no parent.
  - It's an implementation detail, not a rule. The wiki doesn't state it, and no case tests it. Internal tests that already cover it stay, and none is added.
  - Board drags send the flag explicitly, so they don't change.

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
- The Sheet's flag (R6's Sheet bullet, with no case), and the MCP tool descriptions. Every new refusal's message names the way out.
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
- **ATT-3.11 and ATT-4.12:** `attached-children.spec.ts`'s "the Parent dropdown excludes descendants, and reparenting nests the item under its new parent". *Keeps passing,* since the Sheet sends the flag (R6's Sheet bullet). `items.test.ts`'s "accepts reparenting under a parent in a different project…" asserts nothing about the flag.
- **ATT-5.7:** `items.test.ts`'s "rejects creating a child whose projectId differs from its parent". *Stays.*
- **ATT-5.8:** `items.hierarchy.test.ts`'s "rejects a workphaseId from a workflow the item's project does not use…" and "rejects a one-step reparent into a different-workflow project that also names a workphaseId". *Stay:* R3 keeps both refusals. Their messages may change if `crossWorkflowMoveError` goes.
- **Misstamped:** `items.hierarchy.test.ts`'s "ATT-3.9, ATT-3.10: a Free item can be reparented…" reparents a top-level item, which is ATT-3.11's scenario. Whether it gains ATT-3.11 is the Test Planner's call. Its flag is clear, so it stays Free under R6.

## Code map

The starting list. The Coder keeps it current and records which symbol carries which ruling. Phase 2 is three batches: 2a the flag (R6), 2b the workphase a write leaves (R1's create refusal, R4), 2c R3.

| File | Phase | Change |
|---|---|---|
| `server/src/lib/itemHierarchy.ts` | 2 | 2c: R3 is `foreignWorkphaseError` (the data rule, called by `validateHierarchyRequest` and `POST`) and `crossWorkflowError` (the subtree check, in `validateHierarchyRequest`); `nullForeignWorkphasePositions` is removed, since no item write reaches it. R6 needs nothing here: `deriveResultingState` already keeps the flag when a write omits it, so a top-level item, whose flag is now clear, becomes a detached child. 2b: R4 is `shownWith` (the item's nearest Free ancestor) and `deriveResultingState`'s `leavesAttachment` branch, with the refusal in `validateHierarchyRequest`; R1's refusal now shares `ATTACHED_WORKPHASE_ERROR` with the create; `resolveCreateWorkphase` is what `POST` calls (R1's create refusal, R4's detached create). `POST` shares these checks rather than going through `validateHierarchyRequest`, which needs an existing item |
| `server/src/routes/items.ts` | 2, 3 | `POST`: R6 (2a: `attached` is false without a parent, and `isAttached: true` without one is a 400), R1 and R4 (2b: `resolveCreateWorkphase`), R3 (2c: `foreignWorkphaseError` after the existence check). `crossWorkflowMoveError` removed (R3, 2c). `PATCH /move` drops `position`, and `PATCH /reorder` goes (R8) |
| `server/drizzle/` | 2a | `0011_parentless_items_not_attached.sql` clears the flag on parentless rows (R6) |
| `server/src/db/schema.ts` | 2a | The flag's column default stays set (R6). Changing it means rebuilding `items`, and the one insert, `POST`, now states the flag. Only the comment changed |
| `server/src/mcp.ts` | 2 | The `create_item`, `update_item` and `move_item` descriptions. 2a: the flag's sentences. 2b: `create_item`'s workphase and flag, `update_item`'s leaving-attachment sentence. 2c: `move_item` |
| `client/src/components/item-detail/ChildrenSection.tsx` | 2b | The add-child create names no workphase, so it passes R1. Its `childDefaultWorkphaseId` prop goes, with its pass-through in `ItemDetailPanel.tsx` and `BoardView.tsx` |
| `client/src/components/item-detail/ParentSection.tsx` | 2a | `handleParentChange` sends `isAttached: true` when a parentless item gets its first parent (R6) |
| `client/src/test/itemFixture.ts` | 2a | `makeItem`'s flag defaults to set with a parent and clear without (R6) |
| `server/src/lib/itemPositionScope.ts` | 3 | R9: `classifyPositionScope` gives `"none"` when the lookup answers null for a non-null workphase. The lookup is the caller's `isTerminalOf`, which now answers only for the workphases of the workflow the item's project uses |
| `server/src/routes/items.ts`, `boards.ts` | 3 | R9's lookups: `items.ts::isTerminalOfProject` (the single-item routes) and `GET /:id`'s filtered rows; `boards.ts` builds its from the board's workflow's workphases, not every workphase in the database. `workflows.ts` already did |
| `server/src/lib/reorder.ts` | 3 | Its header and the unused `extraSet` go with the item reorder (R8) |
| `server/src/routes/testHelpers.ts` | 3 | `PATCH /api/test/items/:id/position` (R8) |
| `client/src/api/items.ts` | 3 | `reorderItems` and `MoveItemInput.position` go (R8) |
| `tests/helpers/seed.ts` | 3 | `pinItemPosition`, and `seedPositionedItems` pins through it (R8) |
| `server/tests/fixtures.ts` | 3 | `setItemPosition`, the one direct-write pin the server tests share (R8) |
| `bruno/items/` | 3 | `move-item.bru`'s docs, and new docs on `create-item.bru` and `update-item.bru` (R8, and the rules they describe) |
| Server tests and E2E specs | 2, 3 | New cases, and the tests listed above |

## Amendments

- **2026-09-30, phase 1 (the PO): R1–R10 written into the wiki.** Scope lists the exact passages. No section was renumbered. Two sections are new: item-attachment §2a and §14.
  - **Nathan's ruling while writing:** in R3, "a cross-workflow reparent of a Free item" means Free *after* the write. A Free item that attaches across workflows, with no detached descendant, is allowed: its whole subtree takes the new parent's workphase, which is R3's own reason for allowing an attached item. An item that ends Free is refused, even when the write names a workphase of the new workflow.
  - **Where the rules landed (the PO's call):**
    - R1, R3's data rule and R4 share a new item-attachment §2a, since all three say which workphase a write leaves an item in. R3's reparent refusal is in §9, beside the passage it replaces, and in §7's disqualifiers.
    - The create rules (R2, R5, R6's default) are a new item-attachment §14. Its create-only refusals stay with the rule they belong to, in §1 and §2a, each marked Planned for the create.
    - R1's last bullet, a drifted Attached item showing with its parent, is in §2a as today's behavior. It's also ruling 13's "if it's attached then show it alongside the parent, ignoring workphase".
  - **Planned passages, and what they leave in force:** each partial build states the built part unmarked and marks the rest, per the wiki README.
    - §1's "attached with no parent" rule is narrowed to a move or an edit, which refuse today. A create's refusal, and a parentless create storing the flag clear, are Planned.
    - §4's "a Free item reparented without the flag is still Free" is narrowed to a detached child. A top-level item's case, and "No reparent attaches by default", are Planned, since a top-level item holds the flag today.
    - §12's tags are Planned (R7).
  - **The PO's deductions:**
    - **R8:** a move that names a `position` is refused with a 400 whose message says to name an anchor and side instead. The plan says the route "stops accepting" it. The Goal's principle, that the API refuses what isn't allowed and says what to do instead, rules out ignoring it.
    - **R10:** a done list reads oldest completion first. That comes from board-drag-interaction §10, where a done list shows a previewed item last, as the newest completion.
    - **R4:**
      - the reason, "leaving attachment never moves an item on the board", from R4's "the one it was shown in";
      - a create under a parent with the flag clear takes the workphase its parent is shown in, which is R4's rule applied to an item not yet shown anywhere.
    - **R3's reason in §9:** "a write never leaves an item where only Unsorted can show it", from the Goal's principle that Unsorted catches only what gets past.
    - **§14's reason for the Attached default,** from §11: an item becomes Free by an explicit detach. It was the PO's recommendation, and R6 ruled it.
    - **The re-filing Open question (item-attachment),** from the plan's Out of scope: how a write re-files a subtree into another workflow.
  - **For the Test Planner:** every case under the sections above. ATT-1.8, 1.10, 1.13, 3.11, 5.7 and 5.8, and TC-2.32, 6.10 and 7.18 have their answers. New rules without a case yet include §2a's drift rule, R4's three writes and its refusal, R3's cross-workflow cases and §14's create rules.
  - **For phase 2's pointers:** §2a and §14 are new sections with no index pointers yet. R4 replaces §11's workphase passages, so a comment citing §11 for a detach's workphase moves to §2a. The §9 and §7.3 pointers at `itemHierarchy.ts::nullForeignWorkphasePositions` go if that function does (A4's D4 tables).
- **2026-09-30, phase 1 (the Test Planner): the cases, against the PO's text.** Scope lists every ID. The catalog is 269 cases: 164 `Automated`, 83 `Open`, 14 `Planned`, 4 `Manual` and 4 `Pending PO`.
  - **The nine `Pending PO` cases:**
    - ATT-1.8 keeps the move and edit refusals, and is `Open`. A create's half is ATT-1.14, `Planned`.
    - ATT-1.10 is `Planned` (R7).
    - ATT-1.13 moves to ATT-9.1, a move (`Open`), and ATT-9.2, a create (`Planned`).
    - ATT-3.11 is `Planned`: the reparent makes a top-level item a detached child.
    - ATT-5.7 is `Open`: the create is refused.
    - ATT-5.8 moves to ATT-9.8, a move (`Open`), and ATT-9.9, a create (`Planned`). Its one-step re-file is part of ATT-5.9.
    - TC-2.32 is `Planned` (R8), with the PO's 400.
    - TC-6.10 is `Open` (R10), with the wiki's example.
    - TC-7.18 is `Planned` (R9). Its fixture is a project move now, since no reparent will leave a Free item in another workflow.
  - **Two new suites,** for the PO's two new sections: ATT-9 for §2a, and ATT-10 for §14.
    - The test-plans README moves a case to another suite only in a story that moves its rule, as §2a now holds ATT-1.13's and ATT-5.8's. No test carries either ID, so nothing needs re-titling, and both IDs are retired.
    - ATT-5.6 stays in ATT-5, with §14 added to its Rule. A test carries its ID, so moving it would fail `check:docs` in lint until the test was re-titled. ATT-5.7 stays beside it.
  - **New cases for the rules with none:**
    - §2a's drift rule (ATT-9.3);
    - R4's three writes and its refusal (ATT-9.4 to 9.7);
    - R3's cross-workflow reparents, refused (ATT-5.9) and accepted (ATT-5.10), and the positions the accepted one resolves (TC-7.19);
    - §14's create rules (ATT-10.1 to 10.3);
    - item-positioning §7.3's items that a project move leaves behind (TC-7.20).
  - **Replaced live cases** (`Planned, replaces`): ATT-9.4 replaces ATT-7.3, ATT-5.9 replaces ATT-5.4, ATT-5.10 replaces ATT-5.5, and TC-7.19 replaces TC-7.17. The old cases stay `Automated` until the build lands, and the close pass deletes them.
  - **Smaller edits:**
    - ATT-3.9 drops "Nothing attaches by default", which is §4's Planned sentence now;
    - TC-2.14's Given names a workphase of the item's own project's workflow, since R9 takes the rest;
    - TC-6.13's question starts from R10's tie-break;
    - ATT-5's preamble, and both INDEX pages.
  - **Unsorted:** ATT-10.3 and TC-7.20 assert that an item shows in Unsorted, since item-attachment §14 and item-positioning §7.3 say so. The rest of Unsorted is A5c's page.
  - **TC-7.20 stays in this Scope** (Nathan, 2026-09-30). The rule is right, and the code met it before the wiki recorded it, so it's `Open` and needs a test here.
  - **For the Coder in phase 2, titles only.** Each test is one the plan lists under "Tests that pin today's answers". Whether each asserts all of its case is the Reconciler's call at step 5.
    - `items.hierarchy.test.ts`'s "rejects a workphaseId that contradicts the parent an attached item inherits from…" takes ATT-9.1.
    - `items.test.ts`'s "an attached child inherits the parent workphase even when a different one is passed", once it inverts, takes ATT-9.2.
    - `items.test.ts`'s "rejects creating a child whose projectId differs from its parent" takes ATT-5.7.
    - `items.hierarchy.test.ts`'s "rejects a workphaseId from a workflow the item's project does not use…" takes ATT-9.8, and "rejects a one-step reparent into a different-workflow project that also names a workphaseId" takes ATT-5.9.
    - The test that reparents a top-level item (the list's last entry) takes ATT-3.11, which is its scenario. It doesn't need ATT-3.9, whose Given is a detached child.
    - TC-2.17 stays. Once a create stores the flag clear, its test sets up the parentless row that holds the flag by a direct database write.
  - **For the close pass (step 3):** once the markers come off, ATT-1.7's detach paragraph and ATT-7.7's workphase clause cite §2a, not §11. Their expected values don't change; the reason does. ATT-1.8 and 1.14 may merge.
  - **Routing:** A5b names ATT-4.12 and 4.13. TC-6.13 and ATT-5.11 wait on the Architect's phase 1 edits: `epic-4-decisions.md` §12 names both, and Story 10's item-positioning line names TC-6.13. ATT-5.11 goes to Epic 4 by Nathan's ruling on Open question 4.
  - **Checks:** `check:docs -- docs/test-plans` reports 0 hits, and every table, heading, status and link agrees.
- **2026-09-30, phase 1 (the Architect): the routing for TC-6.13 and ATT-5.11.**
  - `epic-4-decisions.md` §12 names both, with each one's question. It now lists five routed cases. TC-6.13 is there for the terminal flag, beside TC-6.11 and 6.12. ATT-5.11 is there so the routed cases sit together, and §13's "For the discussion" points to it, since the status model is what settles it.
  - Story 10's item-positioning line in `epic-3-5-roadmap.md` routes TC-6.13 to Epic 4, and TC-2.32, 6.10 and 7.18 to A5a.
  - `mvp-roadmap.md`'s Epic 7 entry routes ATT-4.12 to A5b, not A5.
  - **In passing:** the planning docs' paths to the A3 reconciliation reports and three closed audit reports pointed at `docs/audits/`. They point at `docs/archive/` now, in `epic-3-5-roadmap.md`, `epic-4-decisions.md` and `epic-5-decisions.md`.
- **2026-09-30, phase 2 batch 2a (the Coder): the attachment flag (R6).** Phase 2 is three batches, each ending with the gate and a stop: 2a the flag, 2b the workphase a write leaves (R1's create refusal, R4), 2c R3 (the foreign-workphase rule and the cross-workflow reparent), which removes `crossWorkflowMoveError` and `nullForeignWorkphasePositions`.
  - **Built:**
    - `POST` stores the flag clear without a parent, and refuses `isAttached: true` without one (ATT-1.14);
    - migration `0011` clears the flag on existing parentless rows;
    - the Sheet's parent picker sends `isAttached: true` when a parentless item gets its first parent (R6's Sheet bullet; no case, no new test, `attached-children.spec.ts`'s reparent test still passes);
    - `makeItem` defaults the flag by parent;
    - MCP's `create_item.is_attached`, `update_item`'s description and `update_item.is_attached` state the flag's rules.
  - **The Coder's calls:**
    - **The column default stays set.** SQLite can't change a default in place, so it would mean rebuilding `items`, the table every other table points at. The one insert, `POST`, states the flag, so the default is never used; the schema comment says so. A direct insert that omits the flag still gets a set flag, which is drift of the kind §2a already tolerates.
    - **`itemHierarchy.ts` needs no change for R6.** A write that omits the flag already keeps the item's state, so the migration and `POST` are enough to make a top-level item's reparent detach it (ATT-3.11). Only `deriveResultingState`'s comment changed.
  - **Tests updated:** `itemTree.test.ts::seedChain` and `items.hierarchy.test.ts::seedChainPastCap` set the flag with `parentId`, since they build their chains by direct write and the flag no longer comes free; ATT-4.7's sibling too. TC-2.17's test writes the flagged parentless row directly. ATT-1.14's is new. The reparent-a-top-level-item test takes ATT-3.11 and runs through both `PUT` and `PATCH /move`.
  - **Checks:** `npm run check` passes: 347 server tests, 398 client, 75 scripts, 0 checker hits. `attached-children.spec.ts` and `attachedChildren.spec.ts` pass (15 E2E tests).
- **2026-09-30, phase 2 batch 2b (the Coder): the workphase a write leaves an item in (R1's create refusal, R4).**
  - **Built:**
    - a write that leaves an Attached item Free (a detach, or a reparent to root) and names no workphase gives it the one it was shown in: its nearest Free ancestor's, not its own stored copy (ATT-9.4, 9.5). With no workphase there it's refused, and the message offers the two ways out without `null` (ATT-9.7);
    - a create under a parent with the flag clear takes the workphase its parent is shown in, or is refused the same way (ATT-9.6, 9.7);
    - a create making an Attached child and naming another workphase than its parent's is refused with the move's message (ATT-9.2);
    - the Sheet's add-child create names no workphase; MCP's `create_item` and `update_item` descriptions state the new rules.
  - **The Coder's calls:**
    - **`POST` shares the checks; it doesn't go through `validateHierarchyRequest`.** That function takes an existing item (its cycle check, its current parent and flag). The shared parts are `resolveCreateWorkphase` and `ATTACHED_WORKPHASE_ERROR`. Recorded for the Architect (below).
    - **The nearest Free ancestor is found by walking the stored parent links**, as `shownWith`: an item that's Free, or whose parent row is missing, ends the walk. A `parentId` cycle in the data ends it too.
    - **A detach that also reparents, and names no workphase, takes the workphase the item was shown in before the write**, the old parent's chain. R4 says "the one it was shown in", and the item hasn't been shown anywhere else yet.
  - **Found while building: the Sheet's add-child sent a workphase.** `ChildrenSection` sent the board toolbar's "New child items go to" workphase (`childDefaultWorkphaseId`, which defaults to a workphase named Backlog). The server ignored it for an attached child, which is every child the Sheet creates, so the setting never did anything. R1 would have made it a 400 in any workflow with a Backlog phase. The create now names none, and the prop is gone from `ChildrenSection`, `ItemDetailPanel` and `BoardView`'s pass-through. **The toolbar's control and `BoardView`'s state and localStorage key for it are still there and now read by nothing.** For Nathan: remove them, or give the setting a meaning in the Sheet epic. It's listed under To A5b below.
  - **Tests:**
    - `ATT-9.1` to `9.7` are new in `items.hierarchy.test.ts`, on ATT-9's chain, each through both entry points where it applies. The earlier test for a contradicting workphase takes ATT-9.1 too.
    - `items.test.ts`: ATT-5.7's test now uses a sub-project on the same workflow and checks nothing was created. ATT-10.1 to 10.3 are new. The test "an attached child inherits the parent workphase even when a different one is passed" is deleted: ATT-9.2's test replaces it with the refusal.
    - ATT-9.3 is a client test in `itemListOps.test.ts` (Stub in its parent's list, a Card in no column) and a new `UnsortedBucket.test.tsx` (Unsorted doesn't list it). The server isn't involved: the client reads `positionScope`, not the workphase.
    - Four tests that built a detached child under a parent with no workphase now name `workphaseId: null`, since a detached create with no workphase is refused there (R4).
  - **Checks:** `npm run check` passes: 355 server tests, 400 client, 75 scripts, 0 checker hits.
- **2026-09-30, phase 2 batch 2c (the Coder): R3. Phase 2 is complete.**
  - **Built:**
    - a Free item can't be left in a workphase its project's workflow doesn't use: a move that names one is refused, with or without a reparent, and so is a create (`itemHierarchy.ts::foreignWorkphaseError`; ATT-9.8, 9.9);
    - a reparent into a project on another workflow is refused when the moving item ends Free, or any descendant is detached. Naming the new workflow's workphase doesn't help (`crossWorkflowError`; ATT-5.9). An item that ends Attached with no detached descendant crosses: it and its attached descendants take the new parent's workphase, and no position is nulled (ATT-5.10, TC-7.19). Each message names the way out;
    - `routes/items.ts::crossWorkflowMoveError` is removed, and so is `itemHierarchy.ts::nullForeignWorkphasePositions`: no item write reaches it. MCP's `create_item`, `update_item` and `move_item` descriptions state the rules.
  - **The Coder's calls:**
    - **`crossWorkflowMoveError` was redundant, and the primitive covers more.** Its two refusals are `foreignWorkphaseError` and `crossWorkflowError`. It guarded only `PATCH /move`, so `PUT` could cross workflows with a Free item; it can't now. It also refused any workphase named on a cross-workflow reparent, even one that ends Attached and names the new parent's workphase. R1 accepts that, so it's accepted.
    - **A project with no workflow passes both checks.** `foreignWorkphaseError` has no workflow to compare a named workphase with, and a move into or out of such a project isn't cross-workflow, as `crossWorkflowMoveError` skipped it. The wiki's §2a and §9 don't say, and ATT-5.11 is Epic 4's. It's under the handoff's behavior decisions.
    - **The cross-workflow test compares the two projects' workflows, never an item's stored workphase.** An item already left in Unsorted by a project move can still be reparented within its project, or filed by naming a workphase of its own project's workflow.
  - **Found while testing ATT-9.3: Unsorted's `needsAttention` is raised by a drifted Stub.** `unsorted.invalidItems` lists every item whose workphase is none or outside the workflow, Stubs included. The client's bucket filters them out, so it lists nothing yet shows the "needs attention" badge, whose tooltip is about uncovered workphases. Under the handoff's To A5c.
  - **Tests:**
    - new in `items.hierarchy.test.ts`'s `across workflows`: ATT-5.9, 5.10, 9.8, 9.9, TC-7.19, TC-7.20;
    - TC-2.24's test no longer builds its position-less item by a cross-workflow reparent: it writes the null position directly;
    - the tests for ATT-5.4, ATT-5.5 and TC-7.17 are deleted, replaced by ATT-5.9, 5.10 and TC-7.19;
    - the two tests that carried ATT-7.3's ID now carry ATT-9.4's, which replaces it.
  - **Checks:** `npm run check` passes: 356 server tests, 400 client, 75 scripts, 0 checker hits.
- **2026-09-30, phase 3 (the Coder): positions (R8, R9). The code is complete.**
  - **Built:**
    - **R8.** `PATCH /items/:id/move` refuses a `position`, whatever its value, with a 400 that says to name an anchor and side (TC-2.32). `position` is out of `HierarchyRequest`, its shape check and its apply branch. `PATCH /items/reorder` is gone, so a request to set several positions gets a 404. `api/items.ts::reorderItems` and `MoveItemInput.position` go. `reorder.ts` serves workphases and columns only, so its `extraSet` went too.
    - **The pin.** `PATCH /api/test/items/:id/position`, mounted with the other test routes. E2E's `seed.ts::pinItemPosition` calls it, and `seedPositionedItems` uses that. Server tests pin by writing the row, through `fixtures.ts::setItemPosition`.
    - **R9.** `classifyPositionScope` gives `"none"` to an item whose workphase isn't one of the workflow its project uses (TC-7.18).
    - **Bruno.** `move-item.bru`'s docs state the refusal and the new rules. `create-item.bru` and `update-item.bru` had no docs and have them now.
  - **The Coder's calls:**
    - **R9 needed no new parameter.** The callers already pass an `isTerminalOf` lookup. Its contract is now "the terminal flag of a workphase of the workflow the item's project uses, else null", and null on a non-null workphase is `"none"`. `boards.ts` builds it from the board's workflow's workphases, where it used every workphase in the database; `workflows.ts` already did; `items.ts` filters by the item's project's workflow (`isTerminalOfProject`, and `GET /:id`'s rows). A dangling workphase classifies as `"none"` too.
    - **In a project with no workflow, an item with a named workphase is `"none"`,** since its project uses no workflow. That follows from 2c's decision, and it's the same question (handoff).
    - **Three E2E specs sent `position: 1` alongside a workphase** (`attachedChildren.spec.ts`, `attached-children.spec.ts`, `boards.spec.ts`). It did nothing they asserted, so they send the workphase alone. `drag-column-bands.spec.ts` needs its 2.5, so it pins through `pinItemPosition`.
  - **Tests:**
    - TC-2.32's test is new, and replaces the four tests of `PATCH /items/reorder` and the two that sent a raw position (the explicit-position and non-numeric ones);
    - TC-7.18 is carried by the project-move test (now `TC-7.18, TC-7.20`, which also checks `positionScope`) and a `classifyPositionScope` unit test;
    - TC-6.10's test is the existing done-list tie test, extended to the case's example: both creation orders;
    - "a position-only move logs no status change" is now a same-workphase move, since a position-only move no longer exists;
    - every pin in `items.test.ts` and `items.hierarchy.test.ts` is `setItemPosition`, one helper in place of `items.hierarchy.test.ts`'s local one.
  - **Checks:** `npm run check` passes: 351 server tests, 400 client, 75 scripts, 0 checker hits. The full E2E suite: 145 passed, 8 skipped. Two tests in `item-positioning.spec.ts` failed the first run, since the spec pinned positions through its own helper that sent `position` to `PATCH /move`. It uses `pinItemPosition` now, and the spec passes.
- **2026-09-30, the Test Planner's review of the handoff, before step 2.**
  - **The pass itself waits for the PO's step 2.** Every case change the handoff names follows a marker coming off, or a passage going: `Planned` to `Open`, the replaced cases deleted, and the citations that move from §11 to §2a. The PO's rulings on the two behavior decisions (a project with no workflow) may add cases too.
  - **One question for step 2:** ATT-9.10, `Pending PO` (Open question 5). It's the Coder's third call in 2b, a reparent that leaves an Attached item Free, which §2a's list of writes doesn't name.
  - **At step 3, then:**
    - `Planned` to `Open`, for the passages whose markers came off: ATT-1.14, 3.11, 5.9, 5.10, 9.2, 9.4 to 9.7, 9.9; TC-2.32, 7.18, 7.19. ATT-1.10 stays `Planned` (R7);
    - delete ATT-5.4, 5.5 and 7.3, and TC-7.17, and the links to them;
    - ATT-1.7's detach paragraph and ATT-7.7's workphase clause cite §2a (the phase 1 amendment's close-pass note), and ATT-1.8 and 1.14 may merge;
    - cases from the PO's rulings, and ATT-9.10 resolved;
    - any new case added to Scope.
- **2026-10-04, step 2 (the PO): the wiki follows the build.** The handoff's "Wiki sections added, changed, moved or removed" lists each passage.
  - **Nathan's ruling on the Coder's first behavior decision:** what a project with no workflow allows goes to Epic 4, both halves, beside ATT-5.11. It's an Open question on item-attachment. The PO added the first half to `epic-4-decisions.md` §12's ATT-5.11 entry.
  - **The PO's deduction on the second:** `positionScope` in a project with no workflow follows from R9's wording, so it needed no ruling.

## Open questions

1. **For Nathan:** under R6, should the Sheet send `isAttached: true` when reparenting a top-level item, which keeps today's behavior? Or may the item become a detached child until the Sheet epic? The plan assumes the first.
   - **Answered (Nathan, 2026-09-30):** keep today's behavior until the Work Item Detail & Chat UI epic. It's an implementation detail: no wiki rule and no case. Internal tests that already cover it stay, and none is added. R6's Sheet bullet holds the ruling, and the Epic 7 roadmap entry carries it in.
2. **For the Test Planner:** does a case already cover a create with a parent and no flag (R6, from A4's handoff)?
   - **Answered (Test Planner, 2026-09-30):** no case did. ATT-10.2 does now: a create with a parent and no flag makes an Attached child.
3. **For the PO:** how item-positioning §7.3 reads once no item write reaches it (R3).
   - **Done (PO, 2026-09-30):**
     - The two cross-workflow paragraphs stay as the rule until R3 is built. A **Planned** paragraph replaces them, together with §2.1's cross-workflow row and §7.2's sentence about it. The one cross-workflow reparent R3 allows leaves every moved item Attached, so no item write nulls a position.
     - A second paragraph covers the items a project move under a different workflow leaves behind: they show in Unsorted, and what the move does to their positions isn't a rule yet. That's under item-positioning's Open questions, since re-filing is out of this story's scope. R9's `"none"` covers their `positionScope`.
4. **For the PO:** ATT-5.11. Is a reparent between a project with no workflow and one with a workflow cross-workflow (item-attachment §9), and so refused when it leaves a Free item in the moved subtree? A Free item coming from the project with no workflow has no workphase to keep, and §2a lets a Free item have none. The other way, a Free item would keep its workphase in a project that uses no workflow.
   - **Routed (Nathan, 2026-09-30):** to Epic 4, which he expects to settle it: a move there that keeps the item in the backlog has no workflow to consider. ATT-5.11 stays `Pending PO`, and the Architect names it in `epic-4-decisions.md` §12, beside TC-6.13.
5. **For the PO, at step 2:** ATT-9.10. Item-attachment §2a's rule for an item leaving attachment, the workphase it was shown in or a refusal, lists three writes: a detach, a reparent to root and a create. §11 calls a detach that lands under a different parent a reparent, not a detach. Does the rule apply to a reparent that leaves an Attached item Free under a new parent? 2b's build applies it (the Coder's third call there), and §2a's first sentence reads as though it does. If it does, the list names a fourth write.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
  - **A project with no workflow (phase 2, 2c).** A Free item's workphase "belongs to its project's workflow" (item-attachment §2a), and a cross-workflow reparent is refused (§9). Neither says what a project with no workflow means. The code compares nothing there: a create or move may name any workphase in such a project, and a reparent into or out of one isn't cross-workflow. That's today's behavior, kept. ATT-5.11 asks the second half and is Epic 4's.
    - **Ruled (Nathan, 2026-10-04): routed to Epic 4, both halves, beside ATT-5.11.** Epic 4's status model is what defines a project with no workflow. The wiki says it isn't a rule yet: §2a ends "What a project with no workflow allows isn't a rule yet (Open questions)", and item-attachment's Open questions gains "A project with no workflow". The code's leniency stays, and no case is written for it. `epic-4-decisions.md` §12's ATT-5.11 entry now names the first half too.
  - **`positionScope` in that project (phase 3).** It follows: an item there with a named workphase is `"none"`, since its project uses no workflow and so uses none of the workphase's. item-positioning §2's new case ("a workphase its project's workflow doesn't use") doesn't say either.
    - **The PO's deduction, no ruling needed:** §2's case now reads "its workphase isn't one of its project's workflow's". A project with no workflow has none, so an item there with a named workphase is `"none"`, which is what the code does.
- **Planned passages now built:**
  - item-attachment §1's create bullet (a create stores the flag clear, and refuses it without a parent);
  - §2a's Planned paragraphs: a create's refusal for an Attached child (R1), the shown-in workphase (R4), a create naming a foreign workphase, and the cross-workflow reparent;
  - §4's top-level reparent paragraph;
  - §7's cross-workflow paragraph, and §9's;
  - item-positioning §7.3's Planned paragraph;
  - item-positioning §2's two: the raw position is retired (R8), and `"none"` for an item in another workflow's workphase (R9).
- **Passages superseded:** the ones the PO's *Replaced by* notes mark, which the code no longer follows.
  - item-attachment §9's paragraph "Cross-*workflow* reparenting is also allowed at the API" and its closing note; §7's "and neither is cross-workflow"; §11's "takes its own workphase" and "Its workphase is whatever it holds at that moment";
  - item-positioning §2.1's cross-workflow row, §7.2's closing sentence, and §7.3's two cross-workflow paragraphs.
- **Implementation passages to place:** none for the wiki. The test-only pin route, `PATCH /api/test/items/:id/position`, is for the testing guide (To the Architect).
- **Test-plan cases affected:** every case here has a test now, so none stays `Open` for want of one.
  - **`Planned` cases built,** each `Open` once the PO takes its marker off: ATT-1.14, 3.11, 5.9, 5.10, 9.2, 9.4 to 9.7, 9.9; TC-2.32, 7.18, 7.19.
  - **`Open` cases with a test:** ATT-1.8, 5.7, 9.1, 9.3 (client: `itemListOps.test.ts`, `UnsortedBucket.test.tsx`), 9.8, 10.1 to 10.3; TC-6.10 (client: `itemListOps.test.ts`), TC-7.20.
  - **Replaced cases, for the close pass to delete:** ATT-5.4, 5.5 and TC-7.17 have no test left. ATT-7.3's two tests (`items.hierarchy.test.ts`, `attached-children.spec.ts`) already carry ATT-9.4.
  - **Rewritten tests that keep their case:** TC-2.17's, which writes its flagged parentless row directly, and TC-2.24's re-file test, which writes its null position directly.
  - **Not asserted anywhere, for the Reconciler:** ATT-9.3's server side. The server lists a drifted Stub in `unsorted.invalidItems` (To A5c), so only the client is tested.
- **Wiki sections added, changed, moved or removed** (PO, at close):
  - *Applied (PO, 2026-10-04):* the markers on every passage listed as built are off, and the passages they replaced are deleted. `check:docs -- docs/wiki` reports 0 hits.
  - **item-attachment:**
    - **added in phase 1:** §2a, "The workphase a write leaves an item in", and §14, "Creating an item";
    - **§1:** the "attached with no parent" refusal covers a create, and a parentless create stores the flag clear;
    - **§2a:** R1's refusal covers a create; R4 (the shown-in workphase) and R3 (a create naming a foreign workphase, and the cross-workflow reparent) are rules now. It ends with the no-workflow sentence;
    - **§4:** omitting the flag keeps a Free item Free, so a top-level item becomes a detached child, and "No reparent attaches by default" is back unmarked;
    - **§7:** cross-workflow is a disqualifier whenever the moved subtree would hold a Free item after the write;
    - **§9:** the paragraph "Cross-*workflow* reparenting is also allowed at the API" and the section's closing note on scope are deleted, and the refusal paragraph stands in their place;
    - **§11:** a newly Free item takes the workphase it was shown in (§2a), and a reparent to root's workphase is §2a's. The two passages that said it kept its own are deleted;
    - **Open questions:** "A project with no workflow" is new. "Re-filing across workflows" (phase 1) stays;
    - **still Planned:** §12's tags (R7), which no story here builds.
  - **item-positioning:**
    - **§2:** "The API takes no final position from any caller" is a rule now (R8). `positionScope`'s `"none"` is a list of three cases, the third an item whose workphase isn't one of its project's workflow's (R9);
    - **§2.1:** the cross-workflow row is deleted;
    - **§6:** the done list's order and tie-break (R10, phase 1);
    - **§7.2:** the closing sentence about the cross-workflow row is deleted;
    - **§7.3:** the two cross-workflow paragraphs are deleted, and the paragraph that replaced them now opens "Cross-*workflow* reparenting leaves no position comparing against nothing". The paragraph on items a project move leaves behind is unchanged.
  - **Moved between sections:** an item leaving attachment's workphase, from §11 to §2a. No section was renumbered or removed.
  - **For the Test Planner's pass:** ATT-1.7's detach paragraph and ATT-7.7's workphase clause cite §2a now, as your close note said. Every case the handoff lists as `Planned` and built has its passage unmarked. No case covers a project with no workflow, since it's an Open question.
- **To the Architect:** root `CLAUDE.md`'s "One hierarchy-write primitive", if `POST`'s route through the primitive changes. It does, from 2b: `POST /items` still checks the parent at the route (exists, same project, depth cap), but now also takes its item's workphase from `itemHierarchy.ts::resolveCreateWorkphase`, which holds the create to the same workphase rules as a move, and uses `itemHierarchy.ts` to log. It doesn't go through `validateHierarchyRequest`. 2c and phase 3 add to it: `POST` also refuses a Free item's workphase from another workflow through `itemHierarchy.ts::foreignWorkphaseError`. Root `CLAUDE.md`'s API table also lists `/api/items` as "Item CRUD + move + reorder + comments"; `PATCH /items/reorder` is gone (phase 3, R8), so "reorder" goes from that row. The workphase and column rows keep theirs, and so does the Coder persona's "Batch reorders" paragraph. `.claude/guides/testing-strategy.md` can name the test-only pin route (`PATCH /api/test/items/:id/position`, with `ENABLE_TEST_ROUTES`) as how an E2E spec gets an exact position now.
  - *Applied (Architect, 2026-10-04):*
    - root `CLAUDE.md`'s primitive bullet covers workphase writes, and says `POST` takes its workphase from `resolveCreateWorkphase` and `foreignWorkphaseError`;
    - its API table drops "reorder" from `/api/items`, and adds the pin to `/api/test`;
    - its Positioning bullet says no item or project write takes a final number. Projects ignore one rather than refuse it, so the bullet doesn't say "refuses";
    - the Coder persona's "Batch reorders" names workphases and columns, and says items and projects have none;
    - `testing-strategy.md` gains "Setting up a state the API refuses": server tests write the database, E2E uses a test route, and a test never loosens a real API rule.
- **To A5b:** anything phase 2 changes in the Sheet (`ParentSection.tsx`, `ChildrenSection.tsx`) that the Sheet's page should state. R6's flag isn't one, since it's an implementation detail. From 2b: the Sheet's add-child names no workphase, so a new child takes its parent's. The board toolbar's "New child items go to" control (`BoardToolbar.tsx`, `BoardView.tsx`'s `childDefaultWorkphaseId` state and `kanban_child_col_*` localStorage key) now feeds nothing, as it never did for an attached child. Nathan's call: remove it, or give it a meaning in the Work Item Detail & Chat UI epic. It's the toolbar's, not the Sheet's, so it may not belong on the Sheet's page.
- **To A5c:** R5's rule for a full item with no workphase, and R3's project moves, for the page's account of Unsorted. And from 2c: `GET /boards/:id`'s `unsorted.invalidItems` lists a drifted Stub (an Attached item whose own workphase is none or outside the workflow), so `needsAttention` is true. The client's bucket doesn't list it (item-attachment §2a), but still shows the badge, whose tooltip says a workphase is uncovered. Whether the server should leave Stubs out of `invalidItems` is the page's to say.

# Test Reconciliation: A5b, with A5a's folded-in cases

**Run:** the closing run for A5b, "Wiki and Test-Plan Rehoming: the Project Sidebar and the Sheet" (`docs/planning/tech-debt-stories/a5b-wiki-rehoming-sidebar-and-sheet.md`). It covers A5b's cases and A5a's folded-in cases. A5a, "Item Movement Rules" (`docs/archive/a5a-item-movement-rules.md`), was archived without a Reconciler run, and Nathan ruled (2026-10-05) that its cases fold into A5b and this run confirms them. It's a normal run: the case fields my rules allow are written, and what needs Nathan's approval is proposed below, with its cases left `Open`.

**Scope:**
- **A5b's:** TREE-1.1 to 1.9, TREE-2.1 and 2.2 (`docs/test-plans/project-tree/`), and DRAG-6.14 (moved from TC-5a.6). `docs/test-plans/item-sheet/` holds only its INDEX.
- **A5a's, folded in:** ATT-1.8, 1.14, 3.11, 5.7, 5.9, 5.10, 9.1 to 9.10 and 10.1 to 10.3, and TC-2.32, 6.10, 7.18, 7.19 and 7.20.
- **Re-cited, status unchanged:** DRAG-4.8, 4.9, 4.10, 4.11, 4.18, 4.29, 4.33 and DRAG-5.9 (Rule lines now cite hierarchy-placement), and ATT-1.7 and ATT-7.7 (workphase clauses now cite item-attachment §2a).
- **Across the whole catalog:** lost coverage, unknown IDs, and `Manual` cases a test carries.

**In brief:**
- **25 cases go to `Automated`:** 6 of A5b's and 19 of A5a's. 11 stay `Open`: 6 wait on an approval below, and 5 have tests that miss part of the case (named under Gaps). Some cases are both.
- **Lost coverage: none.** All 184 `Automated` cases have a test carrying their ID in every file on their Automation test line.
- **Unknown IDs: none.** No test, and no comment in `server/src` or `client/src`, names a deleted or moved ID.
- **`Manual` cases carried by a test: none.**
- **Approvals needed:** the sidebar hook tests (TREE-1.2 to 1.6), ATT-9.3's two client tests, TC-6.10's client test, and, optionally, a duplicate unit test for TC-7.18.
- **Re-cited cases still map.** No test changes the result for them.

---

## How to read this report

Line numbers are the files' current ones. Aliases:

| Alias | File |
|---|---|
| treeE2E | `tests/ui/project-tree-drag.spec.ts` |
| hook | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| treeUtils | `client/src/components/sidebar/projectTreeUtils.test.ts` |
| hierPlace | `client/src/lib/hierarchyPlacement.test.ts` |
| reconcile | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| listOps | `client/src/components/workflow/itemListOps.test.ts` |
| unsortedUI | `client/src/components/UnsortedBucket.test.tsx` |
| descProj | `client/src/components/workflow/descendantsProjection.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| items | `server/tests/routes/items.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |

A test *carries* an ID when its title, or an enclosing `describe`'s title, starts with the ID.

**Which tests count:**
- **Surface tests count without approval:** treeE2E, attachedUI, hier and items.
- **Already approved:** reconcile:152 (DRAG-6.14; TC-5a.6's existing pointer, and the second approved category), and the four sidebar tests Nathan approved on 2026-10-05: hierPlace:42 (TREE-1.3), hierPlace:241 (TREE-1.4), the hierPlace describe at :250 (TREE-1.5) and the treeUtils describe at :148 (TREE-1.5).
- **Not yet approved:** hook, listOps' ATT-9.3 and TC-6.10 tests, unsortedUI and scopeLib.

---

## Coverage Mapping

### Project tree: A5b

| Case | Tests carrying its ID | What they assert against the *Then* | Written |
|---|---|---|---|
| TREE-1.1 (P1) | treeE2E:31 "TREE-1.1: an indicator line shows the gap, and a release saves exactly what the line shows" | **All of it.** It checks every part of the *Then*: <ul><li>exactly one line, on `B`'s row, on its `before` side, indented to depth 2 (`projectRowIndentPx(2)`);</li><li>no row of `A`, `A1`, `A1a` or `B` has a transform, so nothing slid aside;</li><li>still five drag handles, so no ghost row was added;</li><li>after the release, `X.parentId` is `A1` and `X.position` is greater than `A1a`'s, with `X`'s row drawn at depth 2.</li></ul> | `Automated`, treeE2E |
| TREE-1.2 (P0) | hook describe :74 "TREE-1.2: a gap offers the depths from Bottom's to Top's + 1, and each places the project differently" | **All of it, if M1 is approved.** <ul><li>Each of depths 3, 2, 1 and 0 between `A1a` and `B` makes the case's call: `(X, A1a, -, -)`, `(X, A1, A1a, -)`, `(X, A, A1, -)` and `(X, null, A, -)`.</li><li>Offsets of -4 and 9 clamp to 0 and 3, so the range is exactly four depths.</li><li>In the gap between `A1` and `A1a`, five offsets all resolve to depth 2 and `(X, A1, -, A1a)`.</li></ul> No surface test carries the ID. | `Open`, pending M1 |
| TREE-1.3 (P1) | hierPlace:42 "TREE-1.3: a null root (the sidebar's virtual top) yields depth-0 rows with parentId null" (approved); hook describe :115 "TREE-1.3: the boundaries" | **hierPlace:42 alone asserts only part of "the floor":** a null root's children are depth-0 rows with `parentId` null.<br>**The hook asserts all four bullets** with the case's tree:<ul><li>above `A`: depth 0 for offsets -2, 1 and 5, saving before `A`;</li><li>below `B1`: depths 0, 1 and 2, with the three placements;</li><li>offsets 9 and -9 clamp to 2 and 0;</li><li>the floor: a release at -9 saves after `B` at the top level.</li></ul> | `Open`, pending M1 |
| TREE-1.4 (P2) | hierPlace:241 "TREE-1.4: an empty hierarchy under a null (sidebar virtual) root reads parentId null" (approved); hook describe :154 "TREE-1.4: when the dragged project's subtree holds every project, one depth is offered, the top level" | hierPlace:241 asserts that the one state resolves to the top level, with no anchor. The hook asserts depth 0 on every row of `X`, `X1` and `X2`, on both sides, at offsets -3, 0 and 4, and no line (`dropLine` null). **Missing at every layer: "a release sends no request".** Neither hook test releases. | `Open`: part missed, and pending M1 |
| TREE-1.5 (P1) | hierPlace describe :250 "TREE-1.5: resolvePlacement — a Top whose children are hidden from rows (a collapsed Top)" (approved); treeUtils describe :148 "TREE-1.5: fullChildrenOf — a collapsed Top" (approved); hook describe :176 "TREE-1.5: a collapsed project hides its subtree from view, not from placement" | **The approved tests assert only the tabbed-right bullet.** Top + 1 under a collapsed Top resolves ahead of its real first child, including with the dragged subtree excluded (hierPlace:264, :272; treeUtils:161).<br>**The aligned-with-`T` bullet is asserted only by hook:188:** `X` after `T`'s whole subtree, before `U`, as `(X, null, T, -)`. Hook:180 asserts the tabbed-right bullet with the case's own tree. | `Open`, pending M1 |
| TREE-1.6 (P1) | hook describe :197 "TREE-1.6: resting on a row of the dragged project's own subtree means its own gap" | **All of it, if M1 is approved.** <ul><li>Resting on `X1` or `X2`, on either half, the line is `{B, before}`, `X`'s own gap. Depth 0 is offered, and an offset of 5 clamps to 1.</li><li>A release at depth 1 saves `(X, A, -, -)`.</li><li>Sweeping every row, side and offset never names `X1` or `X2`.</li></ul> That `X1` and `X2` stay `X`'s children is implied, not read (Test Quality 2). | `Open`, pending M1 |
| TREE-1.7 (P2) | treeE2E:65 "TREE-1.7: every depth offered is valid: projects have no depth cap" | **All of it.** <ul><li>The chain is `cap + 2` projects long, with `cap` read from the board's `itemDepthCap`.</li><li>`X` is tabbed one right of the deepest, and the line is at that depth.</li><li>After the release, `X.parentId` is the deepest project and `X1.parentId` is still `X`.</li></ul> The sidebar has no invalid cue at all (Test Quality 4). | `Automated`, treeE2E |
| TREE-1.8 (P1) | treeE2E:94 "TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing"; hook describe :240, same title | **treeE2E is whole alone.** <ul><li>The line goes to `before` `B`, then to `after` `B` (`X`'s own gap), and `X` is released there.</li><li>Then `X` is picked up again, rested back at the pickup point and released before the cursor has left its row.</li><li>No non-GET request is made, and `X`'s whole row (parent, position, `updatedAt`) equals what it was before.</li></ul> | `Automated`, treeE2E. The hook is a duplicate (M1) |
| TREE-1.9 (P1) | treeE2E:130 "TREE-1.9: coming back to the dragged project's own row means its own gap"; hook describe :299, same title | **treeE2E is whole alone.** <ul><li>The line is `before` `B`.</li><li>The cursor goes back to the pickup point on `X`'s row, and the line is now `after`, and the only one.</li><li>The release sends no request, and `X` is unchanged.</li></ul> Hook:300 pins the line's anchor as `B` (Test Quality 3). | `Automated`, treeE2E. The hook is a duplicate (M1) |
| TREE-2.1 (P2) | treeE2E:157 "TREE-2.1: the dragged project's descendants are dimmed for the whole drag" | At two cursor positions, `X1` and `X1a` are at opacity 0.4 and `A` at 1. After a **cancel**, `X1` and `X1a` are at 1. **Missing: after a release, no row is dimmed.** No test reads opacity after a release. | `Open`: part missed |
| TREE-2.2 (P2) | treeE2E describe :185 "TREE-2.2: a collapsed project opens when a project is dropped into it as its child" (:210, :216) | **All of it.** One tab right of `T`: `T` shows "Collapse", and `X`, `T1` and `T2` are visible. Aligned with `T`: `T` still shows "Expand", and `T1` is hidden. | `Automated`, treeE2E |

### board-drag-interaction

| Case | Tests carrying its ID | What they assert | Written |
|---|---|---|---|
| DRAG-6.14 (P2) | reconcile:152 "DRAG-6.14: a write the board never previewed (a Sheet edit, an inline create) is folded in with no tripwire, even when the id has an unrelated placement" | **All of it, as TC-5a.6's approved pointer.** It also falls in the second approved category, a response-reconciliation rule whose only surface is a drag. A response that inverts the order is folded in with no claimed placement: `inversions` stays empty, the position is applied, and `X`'s unrelated placement is untouched. The same response, under the claimed placement, is DRAG-6.4's inversion (reconcile:145), so the test can fail. | `Automated`, reconcile |

**Re-cited cases (Rule lines now cite hierarchy-placement):** their mappings hold. Each file on each Automation test line still has a test carrying the ID, and the bodies assert what A3's runs read in them.

| Case | Status | Tests carrying its ID | Note |
|---|---|---|---|
| DRAG-4.8 | `Automated` | hierPlace:53, :150 (describe), :289; descProj:93; dragCollision:347 | Unchanged |
| DRAG-4.9 | `Automated` | hierPlace:177 (describe), :181, :185; descProj:142 | Unchanged |
| DRAG-4.10 | `Automated` | hierPlace:177 (describe), :192, :199 | Unchanged |
| DRAG-4.11 | `Automated` | hierPlace:163, :167, :171, :208 (describe), :350, :355 | Unchanged |
| DRAG-4.18 | `Automated` | hierPlace:298, :316; descProj:100, :148 | Unchanged |
| DRAG-4.29 | `Automated` | descProj:129 | Unchanged |
| DRAG-4.33 | `Open`, Story 10 | none | No test carries it, and no ID-less test covers a nested last row on the board. hierPlace:167 covers a last row that isn't nested |
| DRAG-5.9 | `Open`, Story 10 | detach:34, placement:260 | Partial, as before. detach:34 asserts a reorder inside `P` that stays attached, without pinning the anchor. Bullets 2 to 4 (below `S2`, the reparent under `S1a`, the over-cap state) and "`X.workphaseId` stays `P`'s" aren't asserted |

### item-attachment: A5a's

| Case | Tests carrying its ID | What they assert | Written |
|---|---|---|---|
| ATT-1.8 (P0) | hier:162 "ATT-1.8: rejects isAttached: true with no resulting parent"; hier:498 "ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position"; hier:1207 "ATT-1.8: PUT rejects a parentless attach" | **Asserted:** <ul><li>a move setting `X`'s flag is refused with 400 and "requires a parentId";</li><li>a move with `{parentId: null, isAttached: true}` on `Y` is refused with 400, and `Y.parentId` is kept;</li><li>a PUT setting `X`'s flag is refused with 400;</li><li>a move with `{parentId: null}` on `Y` is accepted, with the flag clear.</li></ul>**Missing:** <ul><li>the **edit** (PUT) that sets `Y.parentId` to null and sets the flag is never sent;</li><li>"`X` and `Y` are exactly as before": `X`'s row isn't re-read after either refusal, and `Y`'s is checked only for `parentId`.</li></ul> | `Open`: part missed |
| ATT-1.14 (P0) | items:1425 "ATT-1.14: a create cannot set the flag without a parent, and a parentless create stores it clear" | **All of it.** The flagged create gets a 400 with "requires a parentId", and the item count is unchanged. The unflagged create gets a 201 with `parentId` null and `isAttached` 0. | `Automated`, items |
| ATT-3.11 (P1) | hier:415 "ATT-3.10, ATT-3.11: a top-level item reparented without the flag becomes a detached child, and keeps its position" | **All of it.** Through both move and PUT, `X` ends with `parentId` P, `isAttached` 0, its own workphase (Todo, not P's In Progress), position `7.5` and scope `"workflow"`. | `Automated`, hier |
| ATT-5.7 (P2) | items:133 "ATT-5.7: rejects creating a child whose projectId differs from its parent, even on one workflow" | **All of it.** The sub-project uses its parent's workflow. The create gets a 400 with "different project", and the count is unchanged. | `Automated`, items |
| ATT-5.9 (P1) | hier:712 "ATT-5.9: a cross-workflow reparent that would leave a Free item in the moved subtree is refused" | **All of it.** The test makes seven writes. `X` goes by PUT, by move, and by move naming `w2`. `Y`, which has detached child `Y2`, and `Z`, which has detached child `Z2` and is attached, each go by PUT and by move. Each gets a 400 with "crosses workflows" and names the item left Free, and all six rows are unchanged after each write. | `Automated`, hier |
| ATT-5.10 (P1) | hier:751 "ATT-5.10: a cross-workflow reparent that leaves every moved item Attached is accepted" | **All of it, through move and PUT.** `X` is attached to `B`: attached, in `P2` and `w2`, and `X1` is in `P2` and `w2` too. `Y` goes the same way, with `Y1`. | `Automated`, hier |
| ATT-9.1 (P1) | hier:177 "ATT-9.1: rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one"; hier:1256 "ATT-9.1: a move that leaves an item Attached cannot name a workphase other than its parent's" | **All of it, across the two.** hier:1256 has the setup's `X`: <ul><li>naming `W3` is refused with the case's message, and `X` is unchanged;</li><li>naming `W2`, or nothing, is accepted in `W2`;</li><li>`F` naming `W2` is accepted;</li><li>`X` detached naming `W3` is accepted.</li></ul>For `F` naming its own workphase, hier:1256 checks only the status and the parent. hier:177 asserts that same write in its own fixture (a Free item attaching and naming its own workphase), with the message and the unchanged workphase. | `Automated`, hier |
| ATT-9.2 (P2) | hier:1286 "ATT-9.2: a create that makes an Attached child cannot name a workphase other than its parent's" | **All of it.** With and without `isAttached: true`, the create gets a 400 with the case's message, and the count is unchanged. | `Automated`, hier |
| ATT-9.3 (P1) | listOps describe :400 "ATT-9.3: an attached item shows with its parent, whatever its own workphaseId says"; unsortedUI describe :24, same title | **All of the client side, if M2 is approved.** <ul><li>`X` drifted to `w3` or to none is still in `A`'s attached list.</li><li>The `w3` list is empty, and a merged `w2`+`w3` column lists only `D`.</li><li>Unsorted lists no Card for it, even when flagged for attention.</li></ul> No surface test carries the ID. | `Open`, pending M2 |
| ATT-9.4 (P0) | hier:353 "ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-9.4, TC-2.14, TC-7.13: detaches with placement…"; hier:1303 "ATT-9.4: a detach that names no workphase leaves the item in the one it was shown in"; attachedUI:295 "ATT-9.4: detaching a child via the detail panel keeps it in place when the parent moves" | **hier:1303 is whole**, through move and PUT: <ul><li>`X` is Free in `W2`, with scope `"workflow"`;</li><li>`D` moves to `W1`, `A` follows, and `X` stays in `W2`;</li><li>with `X` drifted to `W3`, the detach still leaves it in `W2`.</li></ul>attachedUI:295 shows the same thing through the UI: the parent moves, and the detached child stays in Todo, as a Card in that column. | `Automated`, hier, attachedUI |
| ATT-9.5 (P1) | hier:1328 "ATT-9.5: a reparent to root of an Attached item that names no workphase leaves it in the one it was shown in" | **All of it, through move and PUT.** `parentId` null, `isAttached` 0, `W2`, and `W2` again with `X` drifted to `W3`. | `Automated`, hier |
| ATT-9.6 (P1) | hier:1346 "ATT-9.6: a detached child created with no workphase takes the one its parent is shown in" | **All of it.** <ul><li>Under `A`: `parentId` A, `isAttached` 0, `W2`, scope `"workflow"`.</li><li>With `A` drifted to `W3`: still `W2`.</li><li>Under `D`: `W2`.</li></ul> | `Automated`, hier |
| ATT-9.7 (P1) | hier:1362 "ATT-9.7: when the nearest Free ancestor has no workphase, a write that leaves an item Free must name one" | **Asserted:** <ul><li>The four moves and edits (detach and reparent to root, by move and by PUT) are refused with a message naming both ways out and not matching `/null/`, and each row is unchanged.</li><li>The detached create is refused, with no item created.</li><li>Naming `W1` or `null` is accepted, and so is the detach once `D` is in `W3`.</li></ul>**Missing:** the **create's** message is checked only for `file "D" into a workphase first`. It isn't checked for the other way out (naming a workphase in the same write), or for not suggesting `null`. | `Open`: part missed |
| ATT-9.8 (P1) | hier:818 "ATT-9.8: a move can't leave a Free item in a workphase its project's workflow doesn't use" | **All of it.** With no reparent, and reparented under `B` while left Free, each move gets a 400 with the message, and `F`'s row is unchanged. | `Automated`, hier |
| ATT-9.9 (P2) | hier:838 "ATT-9.9: a create can't name a workphase its project's workflow doesn't use" | **All of it.** A top-level create and a detached child of `B` each get a 400, and the count is unchanged. | `Automated`, hier |
| ATT-9.10 (P2) | none | See Proposed Stamps S1 and Gaps | `Open`: no test carries it |
| ATT-10.1 (P1) | items:149 "ATT-10.1: a create names its project, its parent, or both, and is refused with neither" | **All of it.** A project alone makes a top-level item in `P1`. Both make a child of `P` in `P1`. Neither gets a 400, and the count rises by only the two accepted creates. | `Automated`, items |
| ATT-10.2 (P1) | items:169 "ATT-10.2: a child is created Attached unless the create clears the flag" | **All of it.** <ul><li>With no flag: `isAttached` 1, `W1`, scope `"attached-siblings"`. That scope also implies the parent.</li><li>With the flag cleared and `W2` named: `parentId` P, `isAttached` 0, `W2`, scope `"workflow"`.</li></ul> | `Automated`, items |
| ATT-10.3 (P2) | items:191 "ATT-10.3: a create may omit the workphase" | **All of it.** <ul><li>A top-level create in `P1` has workphase null and scope `"none"`, and is in the WF1 board's `unsorted.invalidItems`.</li><li>In `P0`, the workphase is null.</li><li>An attached child naming no workphase, or `W1`, is in `W1`.</li></ul> | `Automated`, items |

**Re-cited cases (workphase clauses now cite §2a):**
- **ATT-1.7:** holds on hier:262, hier:353, attachedUI:382 and attachedUI:424. hier:353 asserts that the detached item keeps the workphase it was shown in (Todo, `P`'s). The expected values didn't change.
- **ATT-7.7:** holds on hier:498, hier:513 and items:1462. Both paths keep `W1` (Todo): the move (hier:498) and the edit (items:1462). See Test Quality 6 for items:1462's position check.

### item-positioning: A5a's

| Case | Tests carrying its ID | What they assert | Written |
|---|---|---|---|
| TC-2.32 (P1) | items:294 "TC-2.32: a move that names a final position is refused, and no endpoint sets several outright" | **All of it.** <ul><li>`{position: 3.0}`, `{position: 3.0, anchorId: A, side: after}` and `{position: 'later'}` each get a 400 with "name an anchorId and side", and `X` stays at `2.0`.</li><li>`PATCH /items/reorder` gets a 404, and both positions are unchanged.</li></ul> | `Automated`, items |
| TC-6.10 (P2) | listOps:117 "TC-6.10: breaks an exact completedAt tie by createdAt, oldest first" | **All of it, if M3 is approved.** The case's values: `A` at 100, `B` and `C` at 300, read `a, b, c` and then `a, c, b`. No surface test carries the ID. | `Open`, pending M3 |
| TC-7.18 (P1) | hier:862 "TC-7.18, TC-7.20: an item a project move leaves in another workflow's workphase shows in Unsorted, with no position scope"; scopeLib:25 "TC-7.18: classifies a detached/root item in a workphase outside its workflow as none" | **hier:862 is whole alone.** `positionScope` is `"none"` both through `GET /items/:id` and in the board's `invalidItems`. scopeLib:25 is an internal duplicate (M4). | `Automated`, hier |
| TC-7.19 (P1) | hier:789 "TC-7.19: the cross-workflow reparent that is allowed nulls no position" | **All of it.** <ul><li>The anchored attach puts `X` at `1.5`, with `X1` still at `1.0` and no reindex.</li><li>The unanchored attach puts `W` at `3`.</li><li>None of the four moved positions is null.</li></ul> | `Automated`, hier |
| TC-7.20 (P1) | hier:862, as above | **All of it.** The project move gets a 200, `X` keeps `w1`, and `X` is in the WF2 board's `unsorted.invalidItems`. | `Automated`, hier |

---

## Lost Coverage

**None.**
- **Every `Automated` case has a carrying test, in every file on its line.** For each of the 184 `Automated` cases, a test carrying its ID was found in every file on its Automation test line.
- **The files edited since A3's runs were re-checked line by line.** They are hier and items (A5a), hierPlace, treeUtils, listOps and reconcile (A5b), and attachedUI (A5a's re-title of ATT-7.3's test to ATT-9.4).
- **No case goes back to `Open`.**

---

## Unknown IDs

**None.**
- **Every ID in a test is a live case.** Every case ID in `tests/`, `server/tests/` and `client/src/**/*.test.*` names a case in the catalog.
- **No deleted or moved ID appears anywhere outside `docs/`.** That covers ATT-4.12, 4.13, 5.4, 5.5 and 7.3, ATT-1.13 and 5.8, TC-7.17, TC-5a.6, and DRAG-4.26, 4.28 and 4.31.
- **Source files cite no case ID.** No source file in `server/src` or `client/src` cites one at all.
- **The checker agrees.** This matches the Coder's 0 `check:docs` hits.

---

## Proposed Stamps

Each is a test that covers a case without carrying its ID. A developer adds the ID, and a later run confirms it.

| # | Case | Test | What it covers | Field change? |
|---|---|---|---|---|
| S1 | ATT-9.10 (P2) | hier:438 "ATT-3.9: a reparent that omits the flag keeps each child Free or Attached; one that names it lands in that state", its "Attached to Free" combination (:460) | **The accepted half, in a simpler tree.** Stub `Y`, attached to `A` in Todo, is moved with `{parentId: B, isAttached: false}` to `B`, in In Progress. It lands Free, under `B`, in Todo: the workphase it was shown in, not `B`'s. Here the nearest Free ancestor is the old parent itself, whereas the case's is `D`, two levels up. **The refusal half, with `D` having no workphase, has no test anywhere.** Stamping hier:438 alone would leave ATT-9.10 `Open`. Closing the gap is the developer's call (README "Closing a partial gap"): for example, ATT-9.7's test (hier:1362) could add the detach-and-reparent among its refusals, and a test on ATT-9's setup could carry both halves | None until a test carries the ID |

No other stamp is proposed. The ID-less tests that duplicate a carried case are listed under Duplication.

---

## Proposed Internal Mappings (need approval)

For each, here is whether a surface test asserts the case on its own, and what approval would change.

### M1: the sidebar hook tests (`useProjectDragReorder.test.ts`)

- **What they test:** they render the hook with dnd-kit's events and assert the exact `onReorderProject(id, parentId, prevId, nextId)` call a gesture makes, or that none is made.
- **Their expected values come from the cases' trees,** not from today's output.
- **They're a hook, not one of the pure modules the second approved category names.** The sidebar has no pop clocks or bands, so a surface test can reach every one of these rules, as treeE2E:31 and :65 show. The Coder chose unit tests for the placement cases (A5b plan, batch 3, "Five E2E tests, where the plan said one").

| Case | Hook test | A surface test alone? | If approved |
|---|---|---|---|
| TREE-1.2 | describe :74 | No. treeE2E:31 asserts one of its four placements (depth 2) and carries TREE-1.1, not TREE-1.2 | `Automated`, on hook |
| TREE-1.3 | describe :115 | No | `Automated`, on hierPlace and hook |
| TREE-1.4 | describe :154 | No | **Still `Open`.** No test releases, so "a release sends no request" is unasserted (Gaps) |
| TREE-1.5 | describe :176 | No. treeE2E:210 drops one tab right of a collapsed `T` and asserts that `T` opens, but not where `X` lands. It carries TREE-2.2 | `Automated`, on hierPlace, treeUtils and hook |
| TREE-1.6 | describe :197 | No | `Automated`, on hook |
| TREE-1.8 | describe :240 | **Yes:** treeE2E:94 | The hook is a duplicate: approve it to add it to the line, or leave it as unmapped support |
| TREE-1.9 | describe :299 | **Yes:** treeE2E:130 | The same. The hook also pins the line's anchor as `B`, which treeE2E:130 doesn't (Test Quality 3) |

### M2: ATT-9.3's client tests

- **The tests:** the listOps describe at :400 and the unsortedUI describe at :24.
- **No surface test asserts ATT-9.3.** The rule shows on the board without a drag, so it isn't in either approved category.
  - A UI test would need a drifted `workphaseId`, which no API write makes. The testing guide's way to set up a state the API refuses is a test route, and only the position pin exists today.
  - The server's side is unasserted, as A5a's handoff said. `GET /boards/:id` lists a drifted Stub in `unsorted.invalidItems` and sets `needsAttention`, which is routed to A5c. unsortedUI:30 shows the client's answer to that: the bucket opens, flagged, with no Card in it.
- **If approved:** ATT-9.3 becomes `Automated`, on listOps and unsortedUI.

### M3: TC-6.10's client test (listOps:117)

- **No surface test asserts TC-6.10.**
  - The done order is a client read-time sort (`itemListOps.ts::byCompletedAtThenCreatedAt`). It shows in a done column without a drag (compare TC-6.4's UI test, `tests/ui/item-positioning.spec.ts:26`), so it isn't in an approved category.
  - A UI test would need two items with the same `completedAt`, which the API never stamps. A move stamps the time of the write, and a terminal-flag change stamps `now + index`. So it would need a test route too.
- **If approved:** TC-6.10 becomes `Automated`, on listOps.

### M4 (optional): TC-7.18's unit test (scopeLib:25)

- **hier:862 already asserts all of TC-7.18,** which is `Automated` on it.
- **scopeLib:25 is a duplicate,** and a thin one: it passes the lookup's `null` directly (Test Quality 9).
- **Approving it only adds the file to the line.** I don't recommend it, but it's Nathan's call.

**Already approved and counted:** hierPlace:42, hierPlace:241, the hierPlace describe at :250, and the treeUtils describe at :148. None makes its case whole alone, so no line names them yet. They join TREE-1.3's and TREE-1.5's lines if M1 is approved, and TREE-1.4's once its release clause is covered too.

---

## Proposed Manual (need approval)

**None.** Every `Open` case in scope can be automated, most at the surface already in use.

---

## Gaps

### `Open` in scope, by what closes them

| Case (P) | What's missing | Closed by |
|---|---|---|
| TREE-1.2 (P0) | Nothing in the hook tests | M1 |
| TREE-1.3 (P1) | Nothing, if the hook counts | M1 |
| TREE-1.5 (P1) | The aligned-with-`T` bullet, which only the hook asserts | M1 |
| TREE-1.6 (P1) | Nothing in the hook tests | M1 |
| TREE-1.4 (P2) | "A release sends no request." Neither hook test releases, and no surface test carries the ID | M1, plus a test that releases in the case's tree |
| TREE-2.1 (P2) | "When the drag ends by a **release**, no row is dimmed": treeE2E:157 checks only a cancel | A test that releases and reads `X1`'s and `X1a`'s opacity |
| ATT-1.8 (P0) | <ul><li>The edit: a PUT with `{parentId: null, isAttached: true}` on `Y` is never sent.</li><li>"`X` and `Y` are exactly as before": `X`'s row isn't re-read after hier:162's or hier:1207's refusal, and `Y`'s is checked only for `parentId`.</li></ul> | A test that covers both |
| ATT-9.3 (P1) | Nothing on the client, if M2 is approved. The server lists the drifted Stub in `invalidItems`, which is A5c's | M2 |
| ATT-9.7 (P1) | The create's refusal message: it isn't checked for the "name a workphase in the same write" way out, or for not suggesting `null` (hier:1385–1387) | Two assertions on hier:1362 |
| ATT-9.10 (P2) | No test carries the ID. The accepted half is covered without it (S1). The refusal half, a detach that also reparents when `D` has no workphase, has no test | A test, or a stamp plus a refusal (S1) |
| TC-6.10 (P2) | Nothing, if M3 is approved | M3 |

- **A5b's plan doesn't route these on.** All eleven are in this story's scope. The test-plans README requires every `Open` case to be in some story's Scope, so any of them still `Open` at sign-off needs routing.
- **A5b's Acceptance isn't met yet.** It asks for "every sidebar case `Automated`" and "A5a's cases `Automated` or routed by ID". Both depend on the rows above.

### `Open` outside the scope: no change

- **Story 10:** 66 DRAG cases and ATT-4.9.
- **Epic 4:** TC-5.15, 6.11 and 6.12.

No test was added or edited for one of these since A3's close, except as noted for DRAG-4.33 and DRAG-5.9 above.

---

## Duplication

Reported, not judged.

**The sidebar, at three layers:**
- **TREE-1.8 and TREE-1.9 at the hook and in the browser.** treeE2E:94 and :130, and hook:240 and :299, assert the same releases.
- **TREE-1.3, 1.4 and 1.5 at the library and the hook.** hierPlace and treeUtils assert the library half: the null root, the empty hierarchy, a collapsed Top's real first child. The hook asserts the same cases through the gesture.
- **TREE-1.5 is in three files:** hierPlace:250, treeUtils:148 and hook:176.
- **TREE-1.2 and TREE-1.1 share a gap.** hook:75's depth-2 row and treeE2E:31 assert the same gap and depth (`A1a` and `B`, depth 2, saved under `A1` after `A1a`): one as a request, one as a save.
- **TREE-1.6's gap is also asserted ID-less** by treeUtils:131 ("an excluded (dimmed descendant) over id resolves to the gap the whole dragged block collapsed to").

**Item writes:**
- **ATT-9.4** is on hier:353, hier:1303 and attachedUI:295.
- **ATT-9.1** is on hier:177 and hier:1256, which assert the same rule in two fixtures.
- **ATT-7.7, ATT-9.5 and ATT-1.8** overlap on a reparent to root:
  - hier:498 carries ATT-1.8 and ATT-7.7;
  - items:1462 asserts the same through PUT;
  - hier:1328 (ATT-9.5) asserts the shown-in workphase for both entry points.
- **ATT-10.1 is duplicated ID-less:** items:96 "creates a root item given an explicit projectId", and items:111 "returns 400 when neither projectId nor a resolvable parentId is given".
- **ATT-10.2's second half is duplicated ID-less:** items:1410 "a detached child keeps its explicitly passed workphase".
- **ATT-10.3 and TC-2.16** both assert `"none"` and Unsorted for an item with no workphase: items:191 and `server/tests/routes/boards.test.ts:133`.
- **ATT-5.10 and TC-7.19** use the same cross-workflow attach: hier:751 asserts state, and hier:789 asserts positions.
- **TC-7.18 and TC-7.20** share hier:862. TC-7.18 is also on scopeLib:25 (M4).

---

## Test Quality Concerns

1. **The hook tests (M1) assert the request, not the saved tree.**
   - Their values come from the cases, not from today's output. The cases say "saves", though, and the save runs through `App.tsx::handleReorderProject` and `PATCH /projects/:id/move`.
   - Only treeE2E:31 and :65 run that path, for two placements.
   - Approving M1 accepts the request as proof of the save for TREE-1.2, 1.3, 1.5 and 1.6.
2. **TREE-1.6's "with `X1` and `X2` still its children" is implied, not read.**
   - Hook:212 asserts exactly one call, naming only `X`.
   - Nothing reads `X1`'s or `X2`'s parent afterwards. treeE2E:65 does that for TREE-1.7's tree.
3. **treeE2E:130 (TREE-1.9) doesn't pin the line to `B`'s row.**
   - It asserts the line is on some row's `after` side and is the only line. treeE2E:31 pins the row with `row('B').locator('..')`.
   - A line drawn after `X`'s own row would pass, since the release resolves to the same gap and writes nothing.
   - hook:300 does pin the anchor as `B`.
4. **treeE2E:65 (TREE-1.7) can't fail on "isn't marked invalid".**
   - `SortableProjectRow.tsx` has no invalid cue, so the save at the deep depth is the real proof, and the test samples one depth.
   - If the sidebar ever gains a cue, this test needs to assert that it's absent.
5. **hierPlace:42 (TREE-1.3) asserts a precondition of the floor, not the floor itself.** It checks the rows' shape under a null root, and drives no placement. It's thin for its ID, but approved.
6. **items:1462 (ATT-7.7, the PUT path) can't tell a fresh position from a kept one.**
   - It asserts `position` isn't null. The child's kept sibling position is `1.0`, and a fresh workflow append would be `2.0`.
   - hier:498 pins `41` on the move path. The case stays `Automated`: the re-cited clause, the workphase, holds on both paths, and A3 judged the rest.
7. **ATT-1.8's refusals don't re-read the rows.** hier:162 doesn't re-read `X`. hier:1207 checks only the status, with no message and no re-read (Gaps).
8. **hier:1274 (ATT-9.1, `F` naming its own workphase) checks only the status and the parent.** It doesn't check the message, so any 400 passes. The case is whole only because hier:177 asserts the same write with the message.
9. **scopeLib:25 (TC-7.18) doesn't test the rule.**
   - It passes `null` as the lookup's answer, so it asserts the classifier's mapping.
   - The rule lives in the callers' lookups (`items.ts::isTerminalOfProject`, `boards.ts`), which only hier:862 exercises.
10. **listOps:408 (ATT-9.3) reads `A`'s attached list, not `D`'s Card.**
    - It calls `getAttachedChildrenFrom(items, 'a')`. `D`'s Card renders its descendants through `itemListOps.ts::hierarchyRows`.
    - That `X` is in `A`'s list implies it's in `D`'s walk, but the test doesn't walk from `D`.
11. **reconcile:152 (DRAG-6.14) doesn't use the case's fixture.**
    - Its fixture isn't a Stub detached from its Sheet. It's a write folded in with no claimed placement while `X` holds an unrelated one.
    - That is the rule's mechanism, the board claiming only the placement it passes, and A3 judged it whole for TC-5a.6.

---

## Uncatalogued Tests

### (a) Plumbing and guards, with no standalone business rule

New since A3's close, or in files this story changed:

| File | Tests | Why none maps |
|---|---|---|
| treeUtils | `flattenTree` (:40, :47, :54, :65, :73); `getDescendantIds` (:83, :88); `eligibleRows` (:103, :115); `resolveGap` (:124, :131, :138); `siblingIdsFromAnchor` (:181, :186) | <ul><li>The sidebar's plumbing.</li><li>:131 and :138 pin TREE-1.6's and TREE-1.4's gap at the module, duplicating the hook.</li><li>:40 and :47 are Candidate 2.</li></ul> |
| hierPlace | `ownSlotOf` (:117), `flattenHierarchyOf` (:62), `toRows` (:77), `gapIndexFor` (:94), `computeProjection` (:335) | <ul><li>The shared library.</li><li>`ownSlotOf` is hierarchy-placement §5's own slot, which DRAG-4.29 (descProj:129) and TREE-1.8 (treeE2E:94) assert through their surfaces.</li></ul> |
| hier | :192 "rejects a non-boolean isAttached"; :895 "still allows a same-workflow reparent that names a workphaseId, and a re-file into the project's own workflow" | <ul><li>:192 is request shape, which is the API contract epic's.</li><li>:895 guards against over-refusing (ATT-9.8, ATT-5.1).</li></ul> |
| items | :1403 "an attached child of a parent with no workphase gets a null workphase"; :1391 "accepts reparenting under a parent in a different project and adopts its projectId"; :96, :111, :1410 | <ul><li>Support for ATT-1.3, and the PUT path for ATT-5.1.</li><li>:96, :111 and :1410 duplicate ATT-10.1 and 10.2 (Duplication).</li><li>:50 is Candidate 3.</li></ul> |

### (b) Features with no catalog

As A3's close listed, with two changes:
- **The sidebar's placement and drag display now have a catalog** (TREE-1, TREE-2).
- **The rest of the project tree is A5d's.** That covers project CRUD, `PATCH /projects/:id/move`'s anchors, the project page's parent dropdown, `tests/ui/project-sidebar.spec.ts` and `tests/api/projects.spec.ts`.

The Sheet has no catalog by design. Its page holds only Open questions.

---

## Candidate New Cases

None is added here. "TP gap" means the rule is in the wiki; "PO gap" means it isn't.

| # | Scenario | Tests | Wiki | Gap |
|---|---|---|---|---|
| 1 | **On the dragged project's own row, a sideways offset picks a depth of its own gap.** Resting on `X`'s row in TREE-1's tree, depth 1 makes `X` `B`'s first child, and an offset of 6 clamps to 1. This is the Coder's "consequence" at close: about 7px sideways shows the line a level in, and a release saves it | hook:314 "resting on X's own row, an offset still picks a depth of that gap: tabbed right, X is B's first child" (inside TREE-1.9's describe, beyond TREE-1.9's *Then*) | wiki project-tree §1: resting on the own row "means the gap the subtree collapses to … with its depth range" | **TP gap**, P2. TREE-1.6 asserts the range on a subtree row, and TREE-1.9 asserts only the own depth on the own row. Extending TREE-1.9's *Then* would cover it |
| 2 | **Sibling projects are ordered by position, then by creation time when position is missing** | treeUtils:40 "sorts siblings by position, tie-breaking by createdAt when position is null", :47 | No page states how projects are ordered | **PO gap**, for A5d's project-tree rules |
| 3 | **An explicit `workphaseId: null` is accepted on a create too**, leaving a detached child with no workphase whatever its parent holds | items:50 "a detached child created with workphaseId: null has no workphase, whatever its parent holds" | wiki item-attachment §2a: "A write that names `workphaseId: null` is accepted and leaves the item with no workphase on purpose", said of all four writes | **TP gap**, P2. ATT-9.7 asserts `null` for a detach only |

**Noticed while checking TC-2.32, not from a test:**
- `POST /items` and `PUT /items/:id` ignore a `position` in the body. They don't refuse it, as `PATCH /move` does.
- wiki item-positioning §2 refuses it on a move, and says no endpoint sets positions outright, which ignoring satisfies.
- Whether a create or an edit should refuse it instead is a question for the API contract epic or the PO. No case is proposed.

---

## Totals

The catalog after this run's writes: 272 cases.

### Overall

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 99 | 70 | 15 | 184 |
| `Open`: A5b (this story) | 2 | 5 | 4 | 11 |
| `Open`: Story 10 (66 DRAG, ATT-4.9) | 23 | 34 | 10 | 67 |
| `Open`: Epic 4 (TC-5.15, 6.11, 6.12) | 0 | 2 | 1 | 3 |
| `Manual` (the Test Planner's: DRAG-1.29, 1.32, 4.24, 4.25) | 0 | 2 | 2 | 4 |
| `Planned` (ATT-1.10) | 0 | 0 | 1 | 1 |
| `Pending PO` (ATT-5.11, TC-6.13; Epic 4) | 0 | 0 | 2 | 2 |
| **All** | **124** | **113** | **35** | **272** |

Before this run: 159 `Automated` and 106 `Open`. This run moved 25 cases.

### By feature

| Feature | `Automated` | `Open` | `Manual` | `Planned` | `Pending PO` | Total |
|---|---|---|---|---|---|---|
| project-tree | 5 (P1 3, P2 2) | 6 (P0 1, P1 3, P2 2) | 0 | 0 | 0 | 11 |
| board-drag-interaction | 43 (P0 27, P1 15, P2 1) | 66 (P0 22, P1 34, P2 10) | 4 (P1 2, P2 2) | 0 | 0 | 113 |
| item-attachment | 59 (P0 28, P1 22, P2 9) | 5 (P0 2, P1 2, P2 1) | 0 | 1 (P2) | 1 (P2) | 66 |
| item-positioning | 77 (P0 44, P1 30, P2 3) | 4 (P1 2, P2 2) | 0 | 0 | 1 (P2) | 82 |

### Suites this run changed

| Suite | `Automated` | `Open` | Other | Total |
|---|---|---|---|---|
| TREE-1 | 4 | 5 | — | 9 |
| TREE-2 | 1 | 1 | — | 2 |
| DRAG-6 | 6 | 7 | — | 13 |
| ATT-1 | 10 | 1 | 1 `Planned` | 12 |
| ATT-3 | 8 | 0 | — | 8 |
| ATT-5 | 6 | 0 | 1 `Pending PO` | 7 |
| ATT-9 | 7 | 3 | — | 10 |
| ATT-10 | 3 | 0 | — | 3 |
| TC-2 | 30 | 0 | — | 30 |
| TC-7 | 12 | 0 | — | 12 |

The other suites are unchanged:
- **board-drag-interaction:** DRAG-1 9/21/2 `Manual`, DRAG-2 5/5, DRAG-3 11/11, DRAG-4 9/14/2 `Manual`, DRAG-5 3/8.
- **item-attachment:** ATT-2 2, ATT-4 9/1, ATT-6 3, ATT-7 7, ATT-8 4.
- **item-positioning:** TC-1 1, TC-3 4, TC-4 1, TC-5 14/1, TC-5a 4, TC-6 9/3/1 `Pending PO`, TC-X 2.

### By story

**A5b: 12 cases.**
- **`Automated` (6):** TREE-1.1, 1.7, 1.8, 1.9, TREE-2.2 and DRAG-6.14.
- **`Open`, pending approval (4):** TREE-1.2, 1.3, 1.5 and 1.6, all M1.
- **`Open`, the tests miss part (2):**
  - TREE-1.4: "a release sends no request". It's also pending M1.
  - TREE-2.1: no row is dimmed after a release.

**A5a, folded in: 24 cases.**
- **`Automated` (19):** ATT-1.14, 3.11, 5.7, 5.9, 5.10, 9.1, 9.2, 9.4, 9.5, 9.6, 9.8, 9.9, 10.1, 10.2 and 10.3, and TC-2.32, 7.18, 7.19 and 7.20.
- **`Open`, pending approval (2):** ATT-9.3 (M2) and TC-6.10 (M3).
- **`Open`, the tests miss part (3):**
  - **ATT-1.8:** the PUT that sets `Y.parentId` to null with the flag set is never sent, and the refused rows aren't re-read whole.
  - **ATT-9.7:** the create's refusal message isn't checked for the "name a workphase" way out, or for not suggesting `null`.
  - **ATT-9.10:** no test carries the ID. The accepted half is covered ID-less by hier:438 (S1), and the refusal half has no test.

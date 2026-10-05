# Test Reconciliation: A5b close (confirming run)

**Run:** the confirming run for A5b, "Wiki and Test-Plan Rehoming: the Project Sidebar and the Sheet" (`docs/planning/tech-debt-stories/a5b-wiki-rehoming-sidebar-and-sheet.md`). It covers A5b's cases and the A5a cases folded into it. It follows the closing run's report, `docs/audits/test-reconciliation-a5b.md`, which isn't edited. The plan's last three Amendments entries, all dated 2026-10-05, list what changed since that run:
- Nathan's rulings on the closing run's proposals;
- the Coder's tests for the five gaps that report named;
- the Coder's tests for TREE-1.10 and ATT-9.11.

The ID checks were run by search. This run had no shell, so the checker, `npm run check` and `npm run test:e2e` weren't run again. The Coder's results stand for those.

**Nathan's approvals (2026-10-05), applied:**
- **M1:** the sidebar hook's tests. They make TREE-1.2, 1.3, 1.5, 1.6 and the new TREE-1.10 whole. The internal tests approved at batch 2 join two of those lines beside the hook: hierPlace:42 on TREE-1.3's, and hierPlace's describe at :250 and treeUtils' at :148 on TREE-1.5's.
- **M2:** ATT-9.3's two client tests.
- **M3:** TC-6.10's client test.
- **M4, declined:** scopeLib:25 isn't on TC-7.18's line.
- **The new rule in `docs/test-plans/README.md`** ("Which tests count"): no internal test is mapped beside a surface test that covers the whole case. I applied it to every case in scope (Coverage Mapping, "The rule").

**Fields written, and nothing else in the catalog:** 13 cases went from `Open` to `Automated`. Each one's status changed in its suite table and its status line, and its Automation test line changed from `—` to:

| Case | Suite file | Automation test line |
|---|---|---|
| TREE-1.2, 1.6, 1.10 | `project-tree/tree-1-gap-and-depth.md` | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| TREE-1.3 | the same | `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts` |
| TREE-1.4 | the same | `tests/ui/project-tree-drag.spec.ts` |
| TREE-1.5 | the same | `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts` |
| TREE-2.1 | `project-tree/tree-2-what-the-drag-shows.md` | `tests/ui/project-tree-drag.spec.ts` |
| ATT-1.8 | `item-attachment/att-1-free-attached-state.md` | `server/tests/routes/items.hierarchy.test.ts` |
| ATT-9.3 | `item-attachment/att-9-workphase-a-write-leaves.md` | `client/src/components/workflow/itemListOps.test.ts`, `client/src/components/UnsortedBucket.test.tsx` |
| ATT-9.7, 9.10, 9.11 | the same | `server/tests/routes/items.hierarchy.test.ts` |
| TC-6.10 | `item-positioning/part-6-active-done-split.md` | `client/src/components/workflow/itemListOps.test.ts` |

**In brief:**
- **13 cases go to `Automated`:** 7 of A5b's (TREE-1.2, 1.3, 1.4, 1.5, 1.6, 1.10 and 2.1) and 6 of A5a's (ATT-1.8, 9.3, 9.7, 9.10 and 9.11, and TC-6.10).
- **Every case in scope is now `Automated`:** 38 cases, 13 of A5b's and 25 of A5a's. None is `Open`, so none needs routing by ID before sign-off.
- **Lost coverage: none.** The 25 cases the closing run made `Automated` still hold. Deleting "ATT-1.8: PUT rejects a parentless attach" lost nothing: the folded test sends the same write and asserts more.
- **Unknown IDs: none.**
- **`Manual` cases carried by a test: none.**
- **Nothing needs approval.** No stamp, internal mapping or `Manual` status is proposed. Stamp S1 is withdrawn, since ATT-9.10 has its own test.
- **The catalog:** 274 cases. 197 are `Automated`, 70 `Open` (all outside this story), 4 `Manual`, 1 `Planned` and 2 `Pending PO`.

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
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| items | `server/tests/routes/items.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |

A test *carries* an ID when its title, or an enclosing `describe`'s title, starts with the ID.

---

## Coverage Mapping

### The five gaps the Coder closed

| Case | Tests carrying its ID | What they assert against the *Then* | Written |
|---|---|---|---|
| TREE-1.4 (P2) | treeE2E:65 "TREE-1.4: when the dragged project's subtree holds every project, no line is drawn and a release writes nothing" | **Whole, through the surface.** <ul><li>It seeds the case's tree: `X` is the only top-level project, with children `X1` and `X2`, and no other project exists.</li><li>The cursor goes over `X1`, `X2` and `X`'s own row in turn, at -3, 0 and +3 tabs, on both halves of each. At all 18 positions, no line is drawn.</li><li>A release over each of the three rows sends no non-GET request, and `X`, `X1` and `X2` match their stored rows from before.</li></ul>"Exactly one depth, the top level, where `X` already is": with no line drawn, a depth shows only in what a release writes. Each release is at +3 tabs, past any depth this tree could offer, and writes nothing. So no deeper depth is offered, and nothing is shallower than the top level (TREE-1.3's floor). Test Quality 12 discloses this reading. | `Automated`, treeE2E. Two tests carry the ID and stay off its line under the new rule: the hook's describe at :154 and hierPlace:241 (approved at batch 2). See Duplication |
| TREE-2.1 (P2) | treeE2E:199 "TREE-2.1: the dragged project's descendants are dimmed for the whole drag" | **Whole.** <ul><li>At two cursor positions, `X1` and `X1a` are at opacity 0.4, and `A` is at 1. After a cancel, `X1` and `X1a` are at 1 (unchanged from the closing run).</li><li>**New:** a second drag dims `X1`, then releases `X` ahead of `A`. Once the save shows (`X.position` is polled until it's below `A`'s), `X1` and `X1a` are at opacity 1.</li></ul> | `Automated`, treeE2E |
| ATT-1.8 (P0) | hier:162 "ATT-1.8: a move or an edit that would leave the flag on a parentless item is refused"; hier:508 "ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position" | **Whole.** <ul><li>hier:162 snapshots `X` (top-level) and `Y` (attached to `P`).</li><li>It sends each refused write through both move and PUT: `{isAttached: true}` on `X`, and `{parentId: null, isAttached: true}` on `Y`.</li><li>All four get a 400 with "requires a parentId". After each one, both rows equal the snapshot.</li><li>hier:508: a move with `{parentId: null}` on an attached Stub gets a 200, with `parentId` null and `isAttached` 0.</li></ul> | `Automated`, hier |
| ATT-9.7 (P1) | hier:1369 "ATT-9.7: when the nearest Free ancestor has no workphase, a write that leaves an item Free must name one" | **Whole.** <ul><li>**New:** the create's refusal (:1392–1395) is checked against `WAYS_OUT` (:1260). That pattern reads "workphaseId in the same write, or file "D" into a workphase first", so it names both ways out. The test also asserts `not.toMatch(/null/)`, as it does for the four moves and edits.</li><li>The rest is as before. Each refused write leaves the row as it was, and the refused create leaves the item count unchanged. Naming `W1` or `null` is accepted. Once `D` is filed in `W3`, a PUT detach lands in `W3`.</li></ul> | `Automated`, hier |
| ATT-9.10 (P2) | hier:1413 "ATT-9.10: a detach that also reparents, naming no workphase, leaves the item in the one it was shown in" | **Whole, through move and PUT,** on ATT-9's setup with top-level `B` in `W3`. <ul><li>`X` is given parent `B` with the flag cleared and no workphase. It gets a 200, with `parentId` `B`, `isAttached` 0 and `W2`: `D`'s workphase, not `B`'s `W3`.</li><li>With `X`'s own copy drifted to `W1`, it still lands in `W2` (Candidate 1).</li><li>With `D` moved out of every workphase, the same write gets a 400 matching `WAYS_OUT`, and `X`'s row is unchanged.</li></ul> | `Automated`, hier. Stamp S1 is withdrawn: hier:448 keeps its title |

**The deleted test, "ATT-1.8: PUT rejects a parentless attach,"** was hier:1207 at the closing run. It sent a PUT setting `X`'s flag, and checked only the status. hier:162's PUT row sends the same write, and checks the status, the message and both rows. Nothing it asserted is lost. ATT-1.8 was `Open`, so no Automation test line named it.

### The two new cases

| Case | Tests carrying its ID | What they assert | Written |
|---|---|---|---|
| TREE-1.10 (P2) | hook:317 "TREE-1.10: resting on X's own row, an offset still picks a depth of that gap: tabbed right, X is B's first child". It sits inside TREE-1.9's describe (:302), so it carries TREE-1.9 too | **Whole, under M1.** On `X`'s own row in TREE-1's tree: <ul><li>at offset 0, the depth is 0;</li><li>tabbed one right, the line is `{anchorId: 'B', side: 'after'}`, `X`'s own gap below `B`, at depth 1;</li><li>tabbed 6 right, the depth is still 1;</li><li>the release calls `('X', 'B', null, null)`, which makes `X` `B`'s first child.</li></ul>The *Then*'s last sentence, "At its own depth, a release there writes nothing", links to TREE-1.9. Tests carrying TREE-1.8 and TREE-1.9 assert it: treeE2E:136's second half, and treeE2E:172. No surface test carries TREE-1.10 | `Automated`, hook |
| ATT-9.11 (P2) | hier:1448 "ATT-9.11: naming workphaseId: null leaves an item Free with no workphase, whatever it was shown in" | **Whole,** on ATT-9's setup with `D` in `W2`. <ul><li>A move detaching `X` with `{isAttached: false, workphaseId: null}` gets a 200, with `isAttached` 0 and `workphaseId` null.</li><li>A create of `Y` under `A`, with the flag clear and `workphaseId: null`, gives `parentId` `A`, `isAttached` 0 and `workphaseId` null.</li></ul>The case names no route ("when `X` is detached"). PUT takes no `workphaseId`, so a move is the only detach that can name `null` (see "Noticed" under Candidate New Cases) | `Automated`, hier |

### The approved mappings (M1 to M3)

| Case | Tests carrying its ID | What they assert | Written |
|---|---|---|---|
| TREE-1.2 (P0) | hook describe :74 | As the closing run read it, body unchanged. <ul><li>Depths 3, 2, 1 and 0 between `A1a` and `B` each make the case's call.</li><li>Offsets of -4 and 9 clamp to 0 and 3.</li><li>In the `A1`/`A1a` gap, five offsets all resolve to depth 2 and `('X', 'A1', null, 'A1a')`.</li></ul> | `Automated`, hook |
| TREE-1.3 (P1) | hook describe :115; hierPlace:42 | The hook asserts all four bullets, unchanged: above `A`, below `B1`, clamping, and the floor. hierPlace:42 joins by Nathan's ruling: a null root yields depth-0 rows with `parentId` null | `Automated`, hook and hierPlace |
| TREE-1.5 (P1) | hook describe :179; hierPlace describe :250; treeUtils describe :148 | <ul><li>hook:183, tabbed right: `('X', 'T', null, 'T1')`.</li><li>hook:191, aligned: `('X', null, 'T', null)`.</li><li>hierPlace:264 and :272, and treeUtils:161, assert the tabbed-right bullet in the library.</li></ul> | `Automated`, hook, hierPlace and treeUtils |
| TREE-1.6 (P1) | hook describe :200 | Unchanged. <ul><li>Resting on `X1` or `X2`, on either half, the line is `{B, before}` at depth 0, and an offset of 5 clamps to 1.</li><li>A release at depth 1 calls `('X', 'A', null, null)`.</li><li>A sweep of every row, side and offset never names `X1` or `X2`.</li></ul>That `X1` and `X2` stay `X`'s children is read from the one request, which names only `X` (Test Quality 2) | `Automated`, hook |
| ATT-9.3 (P1) | listOps describe :400; unsortedUI describe :24 | Unchanged since the closing run. With `X` drifted to `w3` or to none, it is still in `A`'s attached list. The `w3` list is empty, and a merged `w2`+`w3` column lists only `D`. Unsorted lists no Card for `X`, even when flagged for attention | `Automated`, listOps and unsortedUI |
| TC-6.10 (P2) | listOps:117 | Unchanged. The case's values: `A` at 100, `B` and `C` at 300. They read `a, b, c`, and then `a, c, b` | `Automated`, listOps |

### The rule, applied to every case in scope

- **TREE-1.4:** treeE2E:65 covers the whole case, so the hook's describe at :154 and hierPlace:241 aren't mapped.
- **TREE-1.8 and TREE-1.9** stay on treeE2E alone (:136 and :172), each whole as the closing run found. The hook's describes at :243 and :302 aren't mapped.
- **TC-7.18** stays on hier:872 alone. scopeLib:25 isn't mapped (M4).
- **No other line in scope pairs an internal test with a surface test that covers the whole case.**
  - DRAG-6.14, TREE-1.2, 1.3, 1.5, 1.6, 1.10, ATT-9.3 and TC-6.10 have internal tests only, and no surface test carries their IDs.
  - Every other case in scope is on surface tests only.
- **Outside the scope, I didn't re-judge older lines.** Some pair an approved internal pointer with surface tests, such as TC-2.7, 2.8, 2.11, 2.28, 5a.1, 7.1, 7.2 and 7.4. I read the rule as governing what the Reconciler proposes, and those pointers were approved before it. Whether it reaches back to them is Nathan's call.

### The 25 cases the closing run made `Automated`, confirmed

Each still has a test carrying its ID in every file on its line. Each body asserts what the closing run read in it. Line numbers moved only where tests were added above them.

| Case | Tests carrying its ID now | Holds |
|---|---|---|
| TREE-1.1 | treeE2E:31 | Yes, body unchanged |
| TREE-1.7 | treeE2E:107 | Yes, body unchanged |
| TREE-1.8 | treeE2E:136 | Yes, body unchanged. Its second half rests the pointer back at the pickup point, which is the case's "at its own depth" |
| TREE-1.9 | treeE2E:172 | Yes, body unchanged |
| TREE-2.2 | treeE2E describe :238 (:263, :269) | Yes, body unchanged |
| DRAG-6.14 | reconcile:152 | Yes, file unchanged |
| ATT-1.14, 5.7, 10.1, 10.2, 10.3; TC-2.32 | items:1425, :133, :149, :169, :191; :294 | Yes, file unchanged |
| ATT-3.11 | hier:425 | Yes |
| ATT-5.9, 5.10 | hier:722, :761 | Yes |
| ATT-9.1 | hier:187, :1263 | Yes. `F` naming its own workphase is now at :1281 (Test Quality 8) |
| ATT-9.2, 9.5, 9.6 | hier:1293, :1335, :1353 | Yes |
| ATT-9.4 | hier:363, :1310; attachedUI:295 | Yes |
| ATT-9.8, 9.9 | hier:828, :848 | Yes |
| TC-7.18, 7.20 | hier:872 | Yes |
| TC-7.19 | hier:799 | Yes |

**The re-cited cases' mappings are unchanged.** None of their files changed:
- DRAG-4.8, 4.9, 4.10, 4.11, 4.18 and 4.29 are `Automated`. DRAG-4.33 and 5.9 are `Open`, routed to Story 10.
- ATT-1.7 holds on hier:272, :363 and attachedUI:382, :424.
- ATT-7.7 holds on hier:508, :523 and items:1462.

---

## Lost Coverage

**None.**
- **Every `Automated` case from before this run still has a carrying test, in every file on its line.** That's all 184 of them.
- **Only three test files changed since the closing run.** `git status` lists only hook, hier and treeE2E as changed since the last commit, which predates that run. Every other test file is as the closing run read it.
  - **hook:** it was on no Automation test line before this run.
  - **treeE2E:** the five cases on it keep their tests (the table above).
  - **hier:** all 64 cases already `Automated` with hier on their line still have a test carrying their ID in hier. That's 46 ATT cases and 18 TC cases (TC-2.8, 2.14, 2.20, 2.24, 5.2, 5.10–5.14, 7.10, 7.11, 7.13–7.15 and 7.18–7.20).
- **The one deleted test carried only ATT-1.8,** which was `Open`.
- **No case goes back to `Open`.**

---

## Unknown IDs

**None.**
- **Every ID in the three changed files is live.** That includes TREE-1.10 on hook:317 and ATT-9.11 on hier:1448, and the comments in hier: "ATT-9's setup", "ATT-5.9's setup" and "as ATT-9.7's are".
- **No source file in `server/src` or `client/src` cites a case ID.** Outside tests and `docs/`, IDs appear in only three places:
  - root `CLAUDE.md`'s example (DRAG-5.5);
  - `.claude/settings.json` (TC-2.21, 6.5, 1.1, X.1, 5.4 and 5.6), all live;
  - the checker's own fixtures in `scripts/check-docs/`.
- **The checker agrees.** This matches the Coder's 0 `check:docs` hits on 266 files.

---

## Proposed Stamps

**None.**
- **S1 is withdrawn.** ATT-9.10 has its own test, hier:1413, and hier:448 keeps its title.
- **items:50 isn't stamped.** "a detached child created with workphaseId: null has no workphase, whatever its parent holds" covers ATT-9.11's create half without the ID. A stamp would only add items to a case that is already whole (Duplication).

---

## Proposed Internal Mappings (need approval)

**None.**
- **M1 to M3 are written, and M4 is declined.**
- **The carriers left off a line need no approval.** Duplication lists the internal tests that carry an ID but aren't on its line. Under the new rule, none can be mapped while its case's surface test covers the whole case.

---

## Proposed Manual (need approval)

**None.**

---

## Gaps

**None in scope.** Every case in A5b's and A5a's scope is `Automated`.
- **What this report can say about A5b's Acceptance:**
  - "Every sidebar case is `Automated`" holds.
  - "A5a's cases … `Automated` or routed by ID, and ATT-9.10 is answered" holds.
  - "the Reconciler's run reports no lost coverage" holds.
- **`Open` outside the scope, unchanged:**
  - Story 10: 66 DRAG cases and ATT-4.9.
  - Epic 4: TC-5.15, 6.11 and 6.12.

---

## Duplication

Reported, not judged.

**Internal tests that carry an ID but aren't on its line.** The checker passes them, since their IDs are live.
- **The tests:**
  - hook describe :154 (TREE-1.4);
  - hook describe :243 (TREE-1.8);
  - hook describe :302 (TREE-1.9);
  - hierPlace:241 (TREE-1.4);
  - scopeLib:25 (TC-7.18).
- **If a case's surface test were deleted,** a later run would still catch it, since the line still names that test's file. That run would then judge whether the internal carrier makes the case whole, and the hook is approved under M1.
- **Whether these tests keep their IDs** is the Coder's and Nathan's call. Nothing here asks for a change.

**The sidebar:**
- **hook:317 carries both TREE-1.9 and TREE-1.10:** TREE-1.9 through its describe, TREE-1.10 through its own title. What it asserts is TREE-1.10's: a write at depth 1. It adds nothing to TREE-1.9.
- **TREE-1.4's tree is tested at three layers:**
  - in the browser, treeE2E:65;
  - through the hook: the describe at :154, whose test at :166 now releases over each row and asserts neither `onReorderProject` nor `expand` was called;
  - in the library: hierPlace:241, and treeUtils:138 without the ID.
- **TREE-1.8 and TREE-1.9** are asserted in the browser and in the hook, as the closing run reported.
- **TREE-1.3 and TREE-1.5** are asserted in the hook and in the library, now on one line each.

**Item writes:**
- **ATT-9.10's accepted half is duplicated without the ID** at hier:448, in its "Attached to Free" combination (:470).
- **ATT-9.11's create half is duplicated without the ID** at items:50.
- **ATT-9.10's refusal is ATT-9.7's,** reached through a fourth write. Both match `WAYS_OUT` (:1260).

The closing run's list otherwise stands.

---

## Test Quality Concerns

Numbered as in the closing run, which keeps the numbering from 1 to 11, with new concerns after.

1. **The hook tests assert the request a gesture sends, not the saved tree.** Nathan approved M1 knowing this. It now covers TREE-1.2, 1.3, 1.5, 1.6 and 1.10. Only treeE2E:31 and :107 run a placement through the save.
2. **TREE-1.6's "with `X1` and `X2` still its children" is read from the one request, which names only `X`.** In TREE-1.7's tree, treeE2E:107 shows a project's child staying with it through the save (`X1.parentId` is still `X`).
3. **treeE2E:136 (TREE-1.8) and :172 (TREE-1.9) read the line's side, not its row.**
   - A line drawn after `X`'s own row, rather than `B`'s, would pass both, since the release still writes nothing.
   - The hook pins the row at :249 and :311, but under the new rule the hook isn't on either line. So the surface tests are the only mapped proof of "below `B`".
   - Pinning the row as TREE-1.1 does at treeE2E:45 (`row('B').locator('..')`) would close it.
   - It isn't a gap: the release proves the gap, and the closing run judged both cases whole.
4. **treeE2E:107 (TREE-1.7) can't fail on "isn't marked invalid".** The sidebar has no invalid cue. Unchanged.
5. **hierPlace:42 (TREE-1.3) asserts a precondition of the floor, not the floor itself.** It's now on the line by Nathan's ruling. The hook asserts the case.
6. **items:1462 (ATT-7.7's PUT path) can't tell a fresh position from a kept one.** Unchanged.
7. **Resolved:** ATT-1.8's refusals now re-read both rows whole, through both entry points (hier:162).
8. **hier:1281 (ATT-9.1, `F` naming its own workphase) checks only the status and the parent.** hier:187 asserts the same write with its message. Unchanged.
9. **scopeLib:25 passes the lookup's `null` directly,** so it doesn't test TC-7.18's rule. It's now unmapped (M4).
10. **listOps:408 (ATT-9.3) reads `A`'s attached list, not `D`'s Card walk** (`itemListOps.ts::hierarchyRows`). Nathan approved it with M2.
11. **reconcile:152 (DRAG-6.14) doesn't use the case's fixture.** Unchanged.
12. **treeE2E:65 (TREE-1.4) releases once per row, at +3 tabs on the bottom half.** That's the release that could show a deeper depth, which is how this run reads "exactly one depth" (Coverage Mapping). No release at 0 or -3 tabs is sent through the browser. The hook's test at :166 releases at depth 0.
13. **hier:1369 (ATT-9.7) sends its refused create under `A` only.**
    - ATT-9.6's other create, directly under `D`, isn't sent while `D` has no workphase.
    - Both go through `itemHierarchy.ts::resolveCreateWorkphase` and its call to `shownWith`. For `D`, `shownWith` returns `D` itself. For `A`, it walks up to `D`, so the create under `A` is the one that exercises the walk.
    - This run reads the case as whole.
14. **hier:1413 (ATT-9.10) checks its refusal against `WAYS_OUT` but not for the absence of `null`.** The message comes from the same builder as ATT-9.7's (`itemHierarchy.ts::noShownWorkphaseError`), so "as the writes of ATT-9.7 are" holds. Noted only.
15. **treeE2E:199 (TREE-2.1) reads `X1` and `X1a` after the release, not `A` or `X`.** That's the same reading of "no row is dimmed" as its cancel half.

---

## Uncatalogued Tests

### (a) Plumbing, guards and duplicates

Changes since the closing run's list:
- **items:50** is no longer a candidate. Its scenario became ATT-9.11, and it now duplicates that case's create half without the ID.
- **hier:448's "Attached to Free" combination** duplicates ATT-9.10's accepted half without the ID (formerly S1).
- **treeUtils:40 and :47** (sibling project order) are routed to A5d as a PO gap (the plan's Handoff, "To A5d").

The rest of the closing run's list stands:
- treeUtils' and hierPlace's plumbing;
- hier:202 and :905;
- items:96, :111, :1391, :1403 and :1410.

### (b) Features with no catalog

As the closing run listed them.

---

## Candidate New Cases

None is added here. "TP gap" means the rule is in the wiki; "PO gap" means it isn't.

**The closing run's candidates:** candidate 1 became TREE-1.10, candidate 3 became ATT-9.11, and candidate 2 went to A5d.

| # | Scenario | Tests | Wiki | Gap |
|---|---|---|---|---|
| 1 | **A detach that also reparents leaves the item where it was shown, even when its own stored workphase has drifted.** `X`'s copy is drifted to `W1`, and it still lands in `W2` | hier:1413, its drifted step (:1426–1433), through move and PUT | wiki item-attachment §2a: "not the item's own `workphaseId`, which differs only after a direct database edit", said of every write in its list | **TP gap**, P2. ATT-9.4, 9.5 and 9.6 each carry a drift clause, and ATT-9.10 doesn't. Extending its *Then* would cover it |

**Noticed by reading `server/src/routes/items.ts`, not from a test and not run:**
- **`PUT /items/:id` ignores a `workphaseId` in the body.** So a PUT detaching with `workphaseId: null` would be accepted, and would leave the item in the workphase it was shown in, not with none.
- **item-attachment §2a says** "A write that names `workphaseId: null` is accepted and leaves the item with no workphase on purpose". ATT-9.5 counts an edit among its writes.
- **Already tracked** in `docs/planning/tech-debt-stories/positioning-on-create-and-edit.md` ("Position isn't the only such field").
- **No case is proposed.** Whether the wiki says which writes can carry a workphase is the PO's call.

---

## Totals

The catalog after this run's writes: 274 cases. That's the closing run's 272, plus TREE-1.10 and ATT-9.11.

### Overall

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 101 | 75 | 21 | 197 |
| `Open`: A5b (this story) | 0 | 0 | 0 | 0 |
| `Open`: Story 10 (66 DRAG, ATT-4.9) | 23 | 34 | 10 | 67 |
| `Open`: Epic 4 (TC-5.15, 6.11, 6.12) | 0 | 2 | 1 | 3 |
| `Manual` (the Test Planner's: DRAG-1.29, 1.32, 4.24, 4.25) | 0 | 2 | 2 | 4 |
| `Planned` (ATT-1.10) | 0 | 0 | 1 | 1 |
| `Pending PO` (ATT-5.11, TC-6.13; Epic 4) | 0 | 0 | 2 | 2 |
| **All** | **124** | **113** | **37** | **274** |

**Before this run:** 184 `Automated`, and 13 `Open` in this story's scope: the closing run's 11, plus TREE-1.10 and ATT-9.11. This run moved all 13.

**The catalog agrees with itself.** 197 status lines and 197 table rows read `Automated`. 73 Automation test lines read `—`: the 70 `Open` cases, the `Planned` one and the 2 `Pending PO`. 4 read `none — manual`.

### By feature

| Feature | `Automated` | `Open` | `Manual` | `Planned` | `Pending PO` | Total |
|---|---|---|---|---|---|---|
| project-tree | 12 (P0 1, P1 6, P2 5) | 0 | 0 | 0 | 0 | 12 |
| board-drag-interaction | 43 (P0 27, P1 15, P2 1) | 66 (P0 22, P1 34, P2 10) | 4 (P1 2, P2 2) | 0 | 0 | 113 |
| item-attachment | 64 (P0 29, P1 24, P2 11) | 1 (P0) | 0 | 1 (P2) | 1 (P2) | 67 |
| item-positioning | 78 (P0 44, P1 30, P2 4) | 3 (P1 2, P2 1) | 0 | 0 | 1 (P2) | 82 |

### Suites this run changed

| Suite | `Automated` | `Open` | Other | Total |
|---|---|---|---|---|
| TREE-1 | 10 | 0 | — | 10 |
| TREE-2 | 2 | 0 | — | 2 |
| ATT-1 | 11 | 0 | 1 `Planned` | 12 |
| ATT-9 | 11 | 0 | — | 11 |
| TC-6 | 10 | 2 | 1 `Pending PO` | 13 |

The other suites are as the closing run's report gives them.

### Every case in scope, after this run

**A5b: 13 cases, all `Automated`** (P0 1, P1 6, P2 6).

| Case | P | Automation test line |
|---|---|---|
| TREE-1.1 | P1 | treeE2E |
| TREE-1.2 | P0 | hook |
| TREE-1.3 | P1 | hook, hierPlace |
| TREE-1.4 | P2 | treeE2E |
| TREE-1.5 | P1 | hook, hierPlace, treeUtils |
| TREE-1.6 | P1 | hook |
| TREE-1.7 | P2 | treeE2E |
| TREE-1.8 | P1 | treeE2E |
| TREE-1.9 | P1 | treeE2E |
| TREE-1.10 | P2 | hook |
| TREE-2.1 | P2 | treeE2E |
| TREE-2.2 | P2 | treeE2E |
| DRAG-6.14 | P2 | reconcile |

**A5a, folded in: 25 cases, all `Automated`** (P0 3, P1 15, P2 7).

| Case | P | Automation test line |
|---|---|---|
| ATT-1.8 | P0 | hier |
| ATT-1.14 | P0 | items |
| ATT-3.11 | P1 | hier |
| ATT-5.7 | P2 | items |
| ATT-5.9 | P1 | hier |
| ATT-5.10 | P1 | hier |
| ATT-9.1 | P1 | hier |
| ATT-9.2 | P2 | hier |
| ATT-9.3 | P1 | listOps, unsortedUI |
| ATT-9.4 | P0 | hier, attachedUI |
| ATT-9.5 | P1 | hier |
| ATT-9.6 | P1 | hier |
| ATT-9.7 | P1 | hier |
| ATT-9.8 | P1 | hier |
| ATT-9.9 | P2 | hier |
| ATT-9.10 | P2 | hier |
| ATT-9.11 | P2 | hier |
| ATT-10.1 | P1 | items |
| ATT-10.2 | P1 | items |
| ATT-10.3 | P2 | items |
| TC-2.32 | P1 | items |
| TC-6.10 | P2 | listOps |
| TC-7.18 | P1 | hier |
| TC-7.19 | P1 | hier |
| TC-7.20 | P1 | hier |

**Re-cited, status unchanged:**
- DRAG-4.8, 4.9, 4.10, 4.11, 4.18 and 4.29 are `Automated`.
- DRAG-4.33 and DRAG-5.9 are `Open`, in Story 10.
- ATT-1.7 and ATT-7.7 are `Automated`.

**Nothing in scope is `Open`,** so the Test Planner's scope check has no case to route by ID.

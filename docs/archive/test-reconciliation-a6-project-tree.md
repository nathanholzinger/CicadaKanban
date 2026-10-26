# Test Reconciliation: A6 close, project-tree

**Scope:** `docs/test-plans/project-tree/`, the 51 TREE cases, at `57d3ca2` plus the working tree's uncommitted docs: the A6 plan, `bcu-2-a-column-and-its-range.md`, wiki boards-columns-unsorted and `documentation-standards.md`. None of those touches project-tree. This is one of five parallel instances for A6's batch 4 (`docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`), one per catalog folder, and a closing run follows. It covers:
- every TREE case, mapped by ID and checked against its whole *Then*;
- lost coverage for every `Automated` TREE case;
- unknown TREE IDs in any test title or comment in the repo;
- the plan's Open questions to the Reconciler that name a TREE case or a file covering one.

Inputs read: the ten suite files and `INDEX.md`; wiki project-tree §1 to §10 and hierarchy-placement §1 to §6; the plan's Open questions, batch 3 code map and Amendments; the audit report's block for the Reconciler (`docs/audits/code-quality-audit-a6.md`); the A5d close report and A5b's mapping notes (`docs/archive/`); and every test carrying a TREE ID, with the helpers and fixtures they use. IDs were found by search, not by line, since batch 3 moved lines. This run had no shell, so no test, `check:docs` or E2E run was repeated. The Coder's batch 3g and 3h results stand for those.

**In brief:**
- **One status change: TREE-3.9 goes from `Open` to `Automated`.** A route test and an E2E test carry its ID, and together they assert all of it. Both are surface tests, so no approval is needed.
- **Lost coverage: none.** Every `Automated` TREE case still has a test carrying its ID. Every file on a TREE Automation line still carries that case's ID. Batch 3 moved no TREE file, so no other line needed re-pointing.
- **Unknown IDs: none.** Every TREE ID in a title is a catalog case, and no TREE ID appears only in a comment.
- **`Manual` cases carried by a test: none.** project-tree has no `Manual` case.
- **Nothing needs Nathan's approval.** No stamp, internal mapping or `Manual` status is proposed.
- **project-tree is whole:** all 51 cases are `Automated`.
- **For the closing run:** a hook test under TREE-1.11's describe pins what the sidebar does before it knows the cap, which no case states and which strains TREE-3.9's "never" (Test Quality 1, Candidate 1). There's also one small candidate case (Candidate 2).

---

## How to read this report

Line numbers are the files' current ones. Aliases:

| Alias | File |
|---|---|
| projects | `server/tests/routes/projects.test.ts` |
| workflows | `server/tests/routes/workflows.test.ts` |
| treeDrag | `tests/ui/project-tree-drag.spec.ts` |
| treeSidebar | `tests/ui/project-tree-sidebar.spec.ts` |
| hook | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| placement | `client/src/lib/hierarchyPlacement.test.ts` |
| treeUtils | `client/src/components/sidebar/projectTreeUtils.test.ts` |
| hierarchy | `client/src/lib/hierarchy.test.ts` |

A test *carries* an ID when its title, or an enclosing `describe`'s title, starts with the ID. projects, workflows, treeDrag and treeSidebar are surface tests. hook, placement and treeUtils are internal: their pointers on TREE-1.2, 1.3, 1.5, 1.6 and 1.10 were approved at A5b's close, and this run adds none.

---

## Coverage Mapping

### Fields written

| Case | Suite file | Status | Automation test line |
|---|---|---|---|
| TREE-3.9 (P1) | `project-tree/tree-3-legal-parent-and-cap.md` | `Open` → `Automated`, in the table and on the status line | `—` → `server/tests/routes/projects.test.ts`, `tests/ui/project-tree-drag.spec.ts` |

No other field changed.

### Each case against its *Then*

"Whole" means every clause of the *Then* is asserted. Every case was re-checked at its current lines. The tests are the ones the A5d close judged, apart from the retitles and fixture changes noted.

**TREE-1, the drag:**

| Case | Tests carrying the ID | Against the *Then* |
|---|---|---|
| TREE-1.1 (P1) | treeDrag:24 | **Whole.** One line is drawn: `before`, on `B`'s row, indented to depth 2. Every row's `transform` is `none`, and there are still five handles, so no row was added for a ghost. After the release, the test polls `X`'s parent until it reads `A1` (batch 3g's #50), and `X`'s position is past `A1a`'s. `X`'s row is indented to depth 2. |
| TREE-1.2 (P0) | hook:67 (describe, six tests) | **Whole.** In the gap between `A1a` and `B`, each of depths 3 to 0 draws the line before `B` and sends its own move: `A1a`'s child; `A1`'s, after `A1a`; `A`'s, after `A1`; top level, after `A`. Offsets of −4 and 9 clamp to 0 and 3. In the gap between `A1` and `A1a`, every offset gives depth 2 and `A1`'s child, before `A1a`. |
| TREE-1.3 (P1) | hook:108 (describe, three tests); placement:42 | **Whole, through the hook.** Above the first row: depth 0 and a move before `A`, at three offsets. Below `B1`: depths 0 to 2 and their three moves. Offsets of 9 and −9 clamp to 2 and 0, and a release at the floor sends top level, after `B`. placement:42 proves a premise only (Test Quality 2). |
| TREE-1.4 (P2) | treeDrag:99 | **Whole.** The cursor goes over `X1`, `X2` and `X`'s own row, at tabs −3, 0 and 3 and on both halves, and no line is ever drawn. The three releases send no non-GET request, and all three rows read back unchanged. hook:147 and placement:241 carry the ID too, off the line (Open question 1). |
| TREE-1.5 (P1) | hook:172; placement:250; treeUtils:106 | **Whole, through the hook.** One tab right of a collapsed `T` sends `T`'s child, before `T1`. Aligned with `T`, it sends top level, after `T`. The two module tests prove the first half's lookup of a real first child. |
| TREE-1.6 (P1) | hook:193 (describe, four tests) | **Whole.** Resting on `X1` or `X2`, on either half, the line is before `B`, at depth 0, or 1 when tabbed. A release on `X1`, tabbed once, sends `A`'s child with no neighbor. No gap, depth or side ever sends `X1` or `X2`. "With `X1` and `X2` still its children" follows from the move, which TREE-6.4 proves at the route. |
| TREE-1.8 (P1) | treeDrag:183 | **Whole.** First case: the line goes `before` (the gap above `B`), then `after` (`X`'s own gap), and `X` is released there. Second case: `X` is picked up and released at its start, with the line `after`. No non-GET request is sent, and `X`'s whole row, `updatedAt` included, reads back equal. On which row the line sits, see Test Quality 3. hook:236 carries the ID too, off the line. |
| TREE-1.9 (P1) | treeDrag:216 | **Whole.** The line is `before` on the way out, and `after` (one line) once the cursor is back on `X`'s row. The release writes nothing, and `X` is unchanged. See Test Quality 3. hook:295 carries the ID too, off the line. |
| TREE-1.10 (P2) | hook:311 | **Whole.** It's now its own describe (batch 3f). On `X`'s own row, depth 0. Tabbed once, the line is after `B` at depth 1, and tabbed six times it's still 1. The release sends `B`'s child, with no neighbor. The case's last sentence is TREE-1.9's. |
| TREE-1.11 (P1) | treeDrag:138 | **Whole.** The cap is read from `GET /api/projects/depth-cap`, and a chain is seeded to cap − 1. One tab right of `T`: one line, indented to that depth and marked `data-drop-invalid="true"`. Its release sends nothing, and `X` is unchanged. Aligned with `T`: the line isn't marked invalid, and the release saves `X` under `S`, after `T`. hook:328 carries the ID too, off the line (Test Quality 1). |
| TREE-1.12 (P1) | treeDrag:58 | **Whole.** The two request bodies equal `{parentId: A1, prevId: A1a, nextId: null}` and `{parentId: null, prevId: null, nextId: A}` exactly. The stored places match, and the sidebar shows `X` first. |

**TREE-2, what the drag shows (treeDrag):**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-2.1 (P2) | :240 | **Whole.** `X1` and `X1a` are at opacity 0.4 at two cursor places, and `A` is at 1. After a cancel, and again after a release, both are at 1. |
| TREE-2.2 (P2) | :279 (describe, two tests) | **Whole.** One tab right: `T` shows Collapse, with `X`, `T1` and `T2` visible. Aligned: `T` shows Expand, and `T1` is hidden. |
| TREE-2.3 (P2) | :317 | **Whole.** A stubbed 400 refuses the move. `T` shows Collapse, the order reads `T, T1, T2, X`, and `X` is at depth 0. |

**TREE-3, a legal parent and the cap:**

| Case | Tests | Against the *Then* |
|---|---|---|
| TREE-3.1 (P0) | projects:289 | **Whole.** An edit and a move each get a 400 matching `/existing project/i`, and the place is unchanged. |
| TREE-3.2 (P0) | projects:301 | **Whole.** Both writes get a 400 matching `/own parent/i`, and nothing changes. |
| TREE-3.3 (P0) | projects:313 | **Whole.** Four 400s matching `/descendant/i`, and `A` is unchanged. `C` moved under `A` is accepted. |
| TREE-3.4 (P1) | projects:157 | **Whole.** A 400 matching `/existing project/i`, and the list is unchanged. |
| TREE-3.5 (P1) | projects:637 | **Whole.** Move and edit under `S` are accepted, with `M1` at the cap. Under `T`, a 400 matching `/exceeds the cap/i`, and `M` stays top-level. A create under `T` is accepted at the cap, and one under it is refused with the list unchanged. |
| TREE-3.6 (P1) | projects:668 | **Whole.** Accepted under a target at cap − 3, refused under one at cap − 2. Together these rule out `H` = 0, 1 or 3. |
| TREE-3.7 (P2) | projects:687; treeSidebar:190 | **Whole, together.** The route test builds a tree two levels past the cap with `setProjectParent`, and checks that `Past 2` reads at depth cap + 2. Every project is listed, and a rename and a move among siblings are each accepted, with the parent unchanged. The sidebar shows every project, indents `Past 2` to cap + 1, and draws no line. |
| TREE-3.8 (P2) | projects:708 | **Whole.** `M`, at depth 3, has a chain of `PROJECT_DEPTH_CAP` descendants written with `setProjectParent`. A move to the top level gets a 400, and `M`'s place is unchanged. |
| TREE-3.9 (P1) | projects:604; treeDrag:138 | **Whole, together. Stamped this run.** The route test: the depth-cap body is exactly `{projectDepthCap}`, a positive integer. A chain created down to that depth is accepted, its last project reading back at that depth, and a create one level deeper gets a 400. The value comes off the API, never `PROJECT_DEPTH_CAP`. The E2E test (TREE-1.11's) reads the same value. The sidebar's boundary between valid and invalid sits exactly there: the at-cap state isn't marked invalid, and the API saves its release; the state one deeper is marked invalid and writes nothing. That's the same standard DRAG-2.10 is `Automated` on, a route test plus an E2E test. See Test Quality 1 and 4. |

**TREE-4, sibling order and disclosure:**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-4.1 (P0) | projects:539 | **Whole.** |
| TREE-4.2 (P1) | projects:85 | **Whole.** `createdAt` is set directly, and the list reads `N, C, B, A`. |
| TREE-4.3 (P1) | treeSidebar:19 | **Whole.** Positions, and now `createdAt`, are pinned through the test routes. `P`'s children read `C, B, A`, and the top level reads `TC, TB, TA`. |
| TREE-4.4 (P2) | treeSidebar:117 | **Whole.** `N` has no position and was created last, and the sidebar reads `P, N, A, B`. |
| TREE-4.5 (P1) | projects:445 | **Whole.** The pairs are compared by id, so their order doesn't matter, and their shape is exact. The quiet move discloses none, at `3`. |
| TREE-4.6 (P1) | projects:477 | **Whole.** A create and a parent edit each disclose the three pairs, compared by id. |
| TREE-4.7 (P1) | treeSidebar:137 (describe; :154, :169, :180) | **Whole.** |
| TREE-4.8 (P2) | treeSidebar:69 | **Whole.** After a refused drag, create and parent edit, the order reads `A, B, X`, with no `Z`, and `X` is at depth 0. |

**TREE-5 to TREE-10:**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-5.1 (P1) | projects:132 | **Whole.** Positions `3`, `1`, `2`, and `5` after children at `1.0` and `4.2`. |
| TREE-6.1 (P0) | projects:342 | **Whole.** |
| TREE-6.2 (P1) | projects:364 | **Whole.** |
| TREE-6.3 (P1) | projects:390 | **Whole.** Four refused neighbors, each named as `prevId` and as `nextId`, with `X`'s place unchanged after each. |
| TREE-6.4 (P1) | projects:513 | **Whole.** |
| TREE-6.5 (P2) | projects:417 | **Whole.** |
| TREE-6.6 (P1) | projects:431 | **Whole.** |
| TREE-7.1 (P1), TREE-7.2 (P1) | projects:236, :263 | **Whole, each.** |
| TREE-8.1 to 8.4 | projects:180, :202, :252, :167 | **Whole, each.** |
| TREE-9.1 (P0) | projects:741 | **Whole.** Test Quality 5 is carried over. |
| TREE-9.2 (P1), TREE-9.3 (P2) | projects:848, :871 | **Whole, each.** |
| TREE-10.1 (P1), 10.3 (P2), 10.4 (P1) | workflows:235, :349, :218 | **Whole, each.** |
| TREE-10.2 (P1) | projects:569 | **Whole.** |

---

## Lost Coverage

**None.** Every `Automated` TREE case has at least one test carrying its ID. Every file named on a TREE Automation line still carries that case's ID:
- treeDrag for TREE-1.1, 1.4, 1.8, 1.9, 1.11, 1.12 and 2.1 to 2.3;
- hook for TREE-1.2, 1.3, 1.5, 1.6 and 1.10;
- placement for TREE-1.3 and 1.5;
- treeUtils for TREE-1.5;
- projects for TREE-3.1 to 3.8, 4.1, 4.2, 4.5, 4.6, 5.1, 6.1 to 6.6, 7.1, 7.2, 8.1 to 8.4, 9.1 to 9.3 and 10.2;
- treeSidebar for TREE-3.7, 4.3, 4.4, 4.7 and 4.8;
- workflows for TREE-10.1, 10.3 and 10.4.

## Unknown IDs

**None** in the TREE range. A search of every file outside `docs/`, including `bruno/` and `scripts/`, for `TREE-<n>.<n>` finds only catalog IDs, all at the start of a test or `describe` title. No TREE ID sits only in a comment. Retired TREE-1.7 appears nowhere.

**`Manual` cases carried by a test: none.** project-tree has no `Manual` case.

## Proposed Stamps

**None.** Every TREE case carries its ID on its tests.

## Proposed Internal Mappings (need approval)

**None.** The hook tests carrying TREE-1.4, 1.8, 1.9 and 1.11, and placement:241 carrying TREE-1.4, each sit beside a surface test that covers the whole case. So they aren't proposed (`docs/test-plans/README.md`, "Which tests count"). See Open question 1.

**Existing internal pointers:** none sits beside a whole surface test. TREE-1.2, 1.3, 1.5, 1.6 and 1.10 have no surface test, so their approved internal pointers are what make them `Automated`. No drop is proposed.

## Proposed Manual (need approval)

**None.**

## Gaps

**None in project-tree.** TREE-3.9 was the catalog's only `Open` case.

---

## Duplication

Reported, not judged. Each looks intended.

1. **TREE-1.4, 1.8, 1.9 and 1.11 are carried at two layers,** treeDrag on their lines and the hook off them: hook:147, :236, :295 and :328. TREE-1.4 has a third, placement:241. The hook tests pin the line's anchor and the exact `onReorderProject` call, where the E2E tests pin what the user sees and the server stores.
2. **TREE-1.3 and TREE-1.5 are carried in two and three internal files,** all on their lines. The hook test is the one that proves each whole.
3. **TREE-3.9 and TREE-1.11 share treeDrag:138,** and TREE-3.9's route test (projects:604) repeats TREE-3.5's create half (projects:657–665), reading the cap from the API where TREE-3.5's test reads the constant.
4. **TREE-3.7 has two layers,** projects:687 for the API and treeSidebar:190 for the sidebar. Each half needs its own surface.
5. **A project moved into another workflow** is set up in four tests across three catalogs: BCU-1.6 (`server/tests/routes/boards.test.ts:367`), TREE-10.2 (projects:569), TC-7.18/TC-7.20 (`server/tests/routes/items.crossProject.test.ts:245`, split out of `items.hierarchy.test.ts` in batch 3f) and TREE-9.2 (projects:848). Each asserts something the others don't.
6. **TREE-4.1's second half and TREE-4.5** (projects:539 and :445) use the same 1500/1600 siblings. One reads the stored rows, the other the disclosed pairs.
7. **Sibling order is asserted at three layers:**
   - projects:85 and treeSidebar:19 and :117 carry TREE-4.2 to 4.4;
   - treeUtils's `flattenTree` sort tests (:26, :34, :41) and hierarchy's `byPositionThenCreatedAt` tests (:105) pin the same comparator, without an ID.
8. **The unmapped API spec `tests/api/projects.spec.ts`** re-asserts rules the route tests own:
   - :21, a nested create (TREE-5.1);
   - :67 and :76, the own-parent and descendant refusals on `PUT` (TREE-3.2, 3.3);
   - :88, the delete cascade (TREE-9.1).

   It's unchanged since the A5d close.

---

## Test Quality Concerns

### The plan's Open questions to the Reconciler

These are the plan's items, under "For the Test Reconciler" and in the Coder's batch 3e, 3f and 3g notes, that name a TREE case or a file covering one.

1. **The sidebar hook's TREE-1.4, 1.8, 1.9 and 1.11 tests, which the Automation lines don't list.** That's correct, and nothing changes. Each case has an E2E test in treeDrag that asserts its whole *Then* (Coverage Mapping), so an internal test beside it isn't mapped. They're support (Duplication 1). On batch 3f's moves:
   - **TREE-1.10** now has its own describe at hook:311. Its line names the hook, which still carries it, and the test asserts the case whole.
   - **TREE-1.9's** hook describe (:295) lost nothing its line depends on, since that line names only treeDrag.
   - **TREE-1.11** now heads the hook's cap describe (:328). Its first two tests match the case's two bullets, on a chain with the cap set to 4. Its third, "marks nothing invalid while the cap is unknown" (:354), is outside the case: concern 1 below.
2. **placement's TREE-1.3 and TREE-1.4 null-root tests: do they prove those cases?**
   - **TREE-1.3, placement:42: no, not on its own.** It asserts that a null root's children flatten to depth 0 with `parentId` null. That's the premise of "the top level as the floor" (wiki project-tree §1, "the root is the top of the tree"), but no clause of the case: it has no gap, no depth offered, no clamp and no release. TREE-1.3 is whole through hook:108, which asserts all four clauses. The pointer is approved and does no harm. Whether the ID stays on that title is the Coder's call. Dropping it would change no status.
   - **TREE-1.4, placement:241: in part.** It asserts that an empty hierarchy under the sidebar's null root resolves to the top level with no anchor. That's the case's "exactly one depth is offered: the top level", at the module. It doesn't assert "no line" or "no request". treeDrag:99 asserts the whole case at the surface, so this test stays off the line.
3. **The E2E title carrying TREE-3.9 while the case was `Open`.** It's answered by this run's stamp. treeDrag:138 asserts the sidebar half, and projects:604, retitled to carry the ID, asserts the API half. Together they cover the case.
4. **Batch 3e's deleted wrappers.** No TREE case lost a test. `projectTreeUtils.test.ts`'s `getDescendantIds` and `eligibleRows` describes carried no ID: A5b's run listed them as sidebar plumbing. A5b's approved TREE mapping in that file is the `fullChildrenOf` describe (TREE-1.5), still at treeUtils:106. The tests that cover the deleted ground carry no ID, and no TREE case needs them: hierarchy's `getDescendantIds` tests (:24) and placement's `toRows` tests (:77). The same goes for `isWithinDepthCap`'s tests, now in hierarchy (:89), and the sidebar's depth-0 case at :99 (Candidate 2).
5. **Batch 3f's server fixtures, in projects and workflows.** Every TREE Automation line naming either file still holds:
   - **`workflowWithPhases`** is used by no test in either file.
   - **`setProjectPosition`** sets up ten TREE tests: 4.1, 4.2, 4.5, 4.6, 5.1, 6.1, 6.2, 6.3, 6.6 and 7.1. Each fails if the write doesn't land. For example, TREE-4.5's `reindexed` would be absent, and TREE-6.6's `X` would read `1`, not `2.0`.
   - **`setProjectParent`** sets up TREE-3.7 and 3.8. TREE-3.7 checks the written depth directly (cap + 2). TREE-3.8 would accept the move if the chain weren't written, since `M`'s height would then be 0. Those are the "two, in `projects.test.ts`" the Coder's revert caught.
   - **workflows' TREE tests** (TREE-10.1, 10.3, 10.4) use only `createProject`, `createWorkflow`, `templatedWorkflow`, `createItem`, `boardsOf` and `readBoard`, which batch 3f didn't change.
6. **Batch 3g's helpers, in the two project-tree specs.** The specs read the same with them:
   - **`watchWrites`** records every non-GET request. The Coder showed that a recorder that also logged GETs fails the four "writes nothing" tests.
   - **`projectNames`** fails on a listed name that's showing but left out of the expected order, so TREE-4.8's "no new project is shown" (`Z`) is still asserted.
   - **TREE-1.1** now polls for the saved parent before it reads the position, as the audit asked.

### Concerns

1. **hook:354, under TREE-1.11's describe, pins a behavior no case states, and strains TREE-3.9.**
   - **What it asserts:** "marks nothing invalid while the cap is unknown". `App.tsx` reads the project cap in a fetch of its own, apart from the projects. Until that fetch answers, every tab state shows valid. If it fails, the error is only logged, and the cap stays unknown for the session.
   - **The tension:** in that state the sidebar shows over-cap states as valid. A release in one sends a move the API refuses, and the project goes back (TREE-4.8). TREE-3.9 says "a state it shows as valid is never one the API refuses", and wiki hierarchy-placement §6 says a feature's UI and API "always enforce the same `CAP`". The board doesn't have this window: its cap comes with the board read (DRAG-2.10).
   - **Not blocking.** TREE-3.9's *Given* starts from a cap the API reports, and the tests assert that. The ID is on this test only because it sits inside the describe, and the case says nothing of an unknown cap.
   - **For the closing run:** a PO question (Candidate 1). Until it's ruled, either the test leaves the describe (the Coder's), or the case gains a clause once the PO rules (the Test Planner's).
2. **placement:42 carries TREE-1.3 and proves only its premise** (Open question 2).
3. **treeDrag:183 and :216 (TREE-1.8, TREE-1.9) pin the line's side, not its row.**
   - The case says the line is "below `B`". The tests assert one line, marked `after`. In TREE-1's tree only `B` can hold an `after` line, since the line anchors only on rows outside the dragged subtree (`useProjectDragReorder.ts`, `dropLine`), and hook:242 and :304 pin the anchor `B`.
   - So the tests pass on the rule, but because of how the code is built, not by anything they check themselves. Not blocking.
   - **Fix:** check that `B`'s row holds the line, as treeDrag:38 does for TREE-1.1.
4. **projects:604 (TREE-3.9) checks the refused create's status, not its reason.** The parent exists and the name is valid, so the cap is the only refusal that applies today. Matching `/exceeds the cap/i`, as TREE-3.5's test does (projects:625), would tie the refusal to the rule it proves.
5. **TREE-9.1, projects:774–778: "unchanged" is still asserted as survival.** This is carried over unchanged from the A5d close's concern 3. `Q`, `WQ` and `Q`'s item are each found, and `WQ`'s board keeps its one column, but no row is compared before and after. It's judged whole, as before.

**The A5d close's other points are resolved:**
- its concern 1: TREE-4.3 now pins `createdAt` through `pinProjectCreatedAt`. The other half still stands, by design: `GET /api/projects` already returns the tie-break's order, so it's TREE-4.7's drag case, not TREE-4.3, where the sidebar must order siblings by itself;
- its concern 2: TREE-4.5 and 4.6 now compare the pairs by id;
- its judgment 3: TREE-3.5 now says "the resulting depth would exceed the cap", which the message matches.

---

## Uncatalogued Tests

From the files carrying TREE IDs. Tests about other catalogs' rules in those files are left to their instances.

### Gate and contract support (no standalone business rule; no mapping forced)

- **projects:**
  - :79, an empty list;
  - :106, a project with its `workflows` array;
  - :116, :231, :337 and :728, the 404s;
  - :124, a root create's null defaults;
  - :194, an edit updates only the fields it names;
  - :529, a move returns the full row;
  - :733, a leaf delete;
  - :210 and :221, which clear and change a parent through `PUT`. TREE-7.1 and 7.2 cover both in substance.
- **hook:** every test carries an ID. Only :354 is outside its case (concern 1).
- **treeUtils:** `flattenTree` (:26 to :67), `resolveGap` (:82 to :96) and `siblingIdsFromAnchor` (:138, :143): the sidebar's plumbing. Its sort tests duplicate TREE-4.3 and 4.4 at the module.
- **hierarchy:** `getDescendantIds`, `getDepth` / `getSubtreeHeight`, `isWithinDepthCap` and `byPositionThenCreatedAt`: shared client math behind TREE-1.11, 2.1, 4.3 and 4.4 and the board's classification. No ID. The one scenario among them is Candidate 2.
- **`tests/ui/project-sidebar.spec.ts` and `project-page.spec.ts`:** the sidebar's other controls and the project page, the placeholder tier under wiki project-tree's Open questions. They stay unmapped by design.

### Pins an open question

- **projects:279, "ignores a supplied position field entirely":** an edit ignores a position it names. This is unchanged from the A5d close. `positioning-on-create-and-edit.md` owns the question.

### Possibly a rule, not stated anywhere

- **projects:781**, "cascades through a nested project tree, workflow, workphase, items, and related records". It's A5d close's candidate 2, still without a case: an item's labels, attachments, notifications and chat go with it.
- **workflows:310**, "removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete". It's new in batch 3d (#25), and it's the same kind of rule: what a delete takes with it beyond what wiki project-tree §9 lists. Both are low priority. Notifications aren't on any wiki page, attachments and chat are schema only, and labels are due to be replaced.

## Candidate New Cases

Not added. Each is for its owner to decide.

1. **What the sidebar does before it knows the project cap.** *A Product Owner gap: no page states it.*
   - Wiki hierarchy-placement §6 says the UI and API "always enforce the same `CAP`", and wiki project-tree §1 marks over-cap tab states. Neither page says what the sidebar does while it doesn't know the cap, or when reading the cap fails.
   - Today the sidebar marks nothing invalid in that state, and hook:354 pins that (concern 1). A release in an over-cap state is then refused by the API and reverted (TREE-4.8).
   - The options are the PO's: as today, refuse every drag until the cap is known, or something else. TREE-3.9's "never" reads against today's behavior.
2. **The sidebar's top level for a subtree taller than the cap.** *A Test Planner gap: the rule is in the wiki.*
   - Wiki hierarchy-placement §6 says such a subtree "fails the check for every target, the top level included", and wiki project-tree §1 says a tab state past the cap is offered and marked invalid.
   - TREE-3.8 asserts this for the API. On the sidebar, only the client math asserts it, with no ID: hierarchy:99, where target depth 0 fits a mover up to cap − 1 levels tall, and not one at cap.
   - It's an edge, at most P2. TREE-1.11 covers the sidebar's cap in general, and this adds its top-level boundary.

---

## Totals

**Status changes in this run:**
- `Open` → `Automated`: TREE-3.9 (P1).
- `Automated` → `Open`: none.

**project-tree after this run: 51 cases.**

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 7 | 29 | 15 | 51 |
| Open | 0 | 0 | 0 | 0 |
| Manual | 0 | 0 | 0 | 0 |
| Pending PO | 0 | 0 | 0 | 0 |
| Planned | 0 | 0 | 0 | 0 |
| **Total** | **7** | **29** | **15** | **51** |

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| TREE-1 | 11 | 1 | 8 | 2 |
| TREE-2 | 3 | 0 | 0 | 3 |
| TREE-3 | 9 | 3 | 4 | 2 |
| TREE-4 | 8 | 1 | 5 | 2 |
| TREE-5 | 1 | 0 | 1 | 0 |
| TREE-6 | 6 | 1 | 4 | 1 |
| TREE-7 | 2 | 0 | 2 | 0 |
| TREE-8 | 4 | 0 | 1 | 3 |
| TREE-9 | 3 | 1 | 1 | 1 |
| TREE-10 | 4 | 0 | 3 | 1 |

Before this run: 50 `Automated` and 1 `Open` (TREE-3.9). The whole-catalog totals are the closing run's.

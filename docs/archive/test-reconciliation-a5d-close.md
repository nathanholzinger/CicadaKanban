# Test Reconciliation: A5d close

**Run:** the closing run for A5d, "Write the Project Tree's Rules Out in Full" (`docs/planning/tech-debt-stories/a5d-project-tree-rules.md`), against commit `91cdbd1` on `main`, with a clean working tree. It covers:
- project-tree: TREE-1.11, 1.12, 2.3, 3.1 to 3.8, 4.1 to 4.8, 5.1, 6.1 to 6.6, 7.1, 7.2, 8.1 to 8.4, 9.1 to 9.3 and 10.1 to 10.4 (39 cases);
- boards-columns-unsorted: every case, BCU-1.1 to BCU-5.5, carried in from A5c's unrun Close (32 cases);
- item-positioning and item-attachment: a check that no `Automated` case lost its test after their Rule lines moved and `itemTree.ts` and `itemWriteReconciliation.ts` were generalized;
- the whole-catalog checks: lost coverage, unknown IDs, and `Manual` cases a test now carries.

Inputs read: the plan's Amendments tables from batch 3a and batch 3b, its Handoff notes from the Coder for both batches, A5c's batch 3 table (`docs/archive/a5c-boards-columns-unsorted-page.md`), the cases, the wiki sections they cite (project-tree §1 to §10, positioning §1 to §8, hierarchy-placement §6, boards-columns-unsorted §4 and §10), and every test carrying a TREE or BCU ID. The ID checks were run by search. This run had no shell, so `npm run check`, `check:docs` and `npm run test:e2e` weren't run again. The Coder's results from batch 3b stand for those.

**In brief:**
- **70 cases go from `Open` to `Automated`:** all 39 TREE cases in scope, and 31 of the 32 BCU cases.
- **BCU-1.5 stays `Open`.** Its test asserts the opposite of one clause of the case, and the case can't be set up as written. It's a judgment for the Test Planner (Gaps, and Judgments for the Test Planner).
- **Lost coverage: none.** Every `Automated` case in the catalog still has a test carrying its ID. Every item-positioning and item-attachment Automation test line still names files that carry its ID.
- **Unknown IDs: none.** Nothing carries TREE-1.7, TC-6.7 or TC-6.8 any more.
- **`Manual` cases carried by a test: none.**
- **Nothing needs Nathan's approval.** No stamp, internal mapping or `Manual` status is proposed.
- **project-tree is whole:** all 50 cases are `Automated`, which meets the plan's Acceptance line for the catalogs.
- **The catalog:** 341 cases. 264 are `Automated`, 70 `Open`, 4 `Manual`, 2 `Pending PO` and 1 `Planned`.

---

## How to read this report

Line numbers are the files' current ones at `91cdbd1`. Aliases:

| Alias | File |
|---|---|
| projects | `server/tests/routes/projects.test.ts` |
| workflows | `server/tests/routes/workflows.test.ts` |
| boards | `server/tests/routes/boards.test.ts` |
| columns | `server/tests/routes/columns.test.ts` |
| workphases | `server/tests/routes/workphases.test.ts` |
| treeDrag | `tests/ui/project-tree-drag.spec.ts` |
| treeSidebar | `tests/ui/project-tree-sidebar.spec.ts` |
| boardsLayer | `tests/ui/boards-layer.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| items | `server/tests/routes/items.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |

A test *carries* an ID when its title, or an enclosing `describe`'s title, starts with the ID. Every test mapped below is a route test or a Playwright test, so each counts without approval.

---

## Coverage Mapping

### Fields written

70 cases went from `Open` to `Automated`. Each one's status changed in its suite table and on its status line. Its Automation test line changed from `—` to:

| Cases | Suite file | Automation test line |
|---|---|---|
| TREE-1.11, 1.12 | `project-tree/tree-1-gap-and-depth.md` | `tests/ui/project-tree-drag.spec.ts` |
| TREE-2.3 | `project-tree/tree-2-what-the-drag-shows.md` | `tests/ui/project-tree-drag.spec.ts` |
| TREE-3.1 to 3.6, 3.8 | `project-tree/tree-3-legal-parent-and-cap.md` | `server/tests/routes/projects.test.ts` |
| TREE-3.7 | the same | `server/tests/routes/projects.test.ts`, `tests/ui/project-tree-sidebar.spec.ts` |
| TREE-4.1, 4.2, 4.5, 4.6 | `project-tree/tree-4-sibling-order.md` | `server/tests/routes/projects.test.ts` |
| TREE-4.3, 4.4, 4.7, 4.8 | the same | `tests/ui/project-tree-sidebar.spec.ts` |
| TREE-5.1 | `project-tree/tree-5-creating-a-project.md` | `server/tests/routes/projects.test.ts` |
| TREE-6.1 to 6.6 | `project-tree/tree-6-moving-a-project.md` | `server/tests/routes/projects.test.ts` |
| TREE-7.1, 7.2 | `project-tree/tree-7-editing-the-parent.md` | `server/tests/routes/projects.test.ts` |
| TREE-8.1 to 8.4 | `project-tree/tree-8-a-projects-name.md` | `server/tests/routes/projects.test.ts` |
| TREE-9.1 to 9.3 | `project-tree/tree-9-deleting-a-project.md` | `server/tests/routes/projects.test.ts` |
| TREE-10.1, 10.3, 10.4 | `project-tree/tree-10-which-workflow.md` | `server/tests/routes/workflows.test.ts` |
| TREE-10.2 | the same | `server/tests/routes/projects.test.ts` |
| BCU-1.1 to 1.4, 1.6 | `boards-columns-unsorted/bcu-1-boards-and-what-they-show.md` | `server/tests/routes/boards.test.ts` |
| BCU-2.1 to 2.8 | `boards-columns-unsorted/bcu-2-a-column-and-its-range.md` | `server/tests/routes/columns.test.ts` |
| BCU-3.1, 3.2, 3.3, 3.5 | `boards-columns-unsorted/bcu-3-a-boards-columns-together.md` | `server/tests/routes/columns.test.ts` |
| BCU-3.4 | the same | `server/tests/routes/workphases.test.ts` |
| BCU-3.6 | the same | `tests/ui/boards-layer.spec.ts` |
| BCU-4.1 to 4.7 | `boards-columns-unsorted/bcu-4-workphase-writes-and-columns.md` | `server/tests/routes/workphases.test.ts` |
| BCU-5.1 to 5.4 | `boards-columns-unsorted/bcu-5-unsorted.md` | `server/tests/routes/boards.test.ts` |
| BCU-5.5 | the same | `tests/ui/attached-children.spec.ts` |

BCU-1.5 is unchanged: `Open`, with `—`.

### project-tree

Every case in scope has one test, or two for TREE-3.7, that asserts all of its *Then*. The tables below give what each test asserts against the case. "Whole" means every clause of the *Then* is asserted.

**TREE-1 and TREE-2, the drag (treeDrag):**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-1.11 (P1) | treeDrag:141 | **Whole.** It reads the cap from `GET /api/projects/depth-cap` and builds the case's chain: `S` at depth cap − 2 and `T` at cap − 1, with `X` and `X1` last. One tab right of `T`, the line is drawn at that depth with `data-drop-invalid="true"`. A release sends no non-GET request, and `X`'s row is unchanged. Aligned with `T`, the line isn't marked invalid, and the release saves `X` under `S`, after `T`. |
| TREE-1.12 (P1) | treeDrag:58 | **Whole.** The first release's request body equals `{parentId: A1, prevId: A1a, nextId: null}` exactly, so it carries no position. The stored row has `X` under `A1`, after `A1a`. The second release, above the first row, sends `{parentId: null, prevId: null, nextId: A}`. `X` is stored before `A`, and the sidebar shows it first. |
| TREE-2.3 (P2) | treeDrag:329 | **Whole.** A route stub refuses the move with a 400. `T` shows its Collapse control, the order reads `T, T1, T2, X`, and `X` is indented at depth 0. |

**TREE-3, a legal parent and the cap (projects, except TREE-3.7's second test):**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-3.1 (P0) | projects:290 | **Whole.** An edit and a move each get a 400 matching `/existing project/i`. The project's parent and position are unchanged. |
| TREE-3.2 (P0) | projects:302 | **Whole.** Both writes get a 400 matching `/own parent/i`, and nothing changes. |
| TREE-3.3 (P0) | projects:314 | **Whole.** `B` and `C`, through both writes: four 400s matching `/descendant/i`, and `A` is unchanged. `C` moved under `A` gets a 200. |
| TREE-3.4 (P1) | projects:158 | **Whole.** A 400 matching `/existing project/i`, and the list is the same as before. |
| TREE-3.5 (P1) | projects:620 | **Whole.** Each scenario starts from a fresh `capTree()`. The move under `S` is accepted, with `M1` at `PROJECT_DEPTH_CAP`. The move under `T` gets a 400 matching `/exceeds the cap/i`, and `M` stays top-level. The edit to `T` is refused the same way, and the edit to `S` is accepted. A create under `T` is accepted at depth cap, and a create under it gets the cap refusal with the list unchanged. On the message, see Judgments. |
| TREE-3.6 (P1) | projects:651 | **Whole.** `M` has height 2 through `M2a`. It's accepted under a target at cap − 3 and refused under one at cap − 2. The accepted move rules out counting descendants (3), and the refusal rules out `H = 0` or `H = 1`. |
| TREE-3.7 (P2) | projects:670 and treeSidebar:174 | **Whole, with the two together.** The route test builds a tree two levels past the cap by writing rows. The list returns every project. A rename of one past the cap and a move among its siblings are each accepted, with the parent unchanged. The sidebar test shows every project of such a tree, `Past 2` indented at its stored depth, and no line. |
| TREE-3.8 (P2) | projects:691 | **Whole.** `M` at depth 3 has a chain of `PCAP` descendants. Moving it to the top level gets a 400, and its row is unchanged. |

**TREE-4, sibling order and disclosure:**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-4.1 (P0) | projects:534 | **Whole.** `C` moved after `A1` lands at `2`, between `A1` (1.0) and `A2` (3.0). With `A`'s children at 1500 and 1600, `C` with no neighbor makes them `1` and `2` and lands at `3`. `A` and `B` keep `1` and `2`. |
| TREE-4.2 (P1) | projects:86 | **Whole.** `createdAt` is set directly, so `B` is created first. The list reads `N, C, B, A`. |
| TREE-4.3 (P1) | treeSidebar:13 | **Whole as written.** `P`'s children read `C, B, A`, and the top level reads `TC, TB, TA` after `P`. See Test Quality 1. |
| TREE-4.4 (P2) | treeSidebar:101 | **Whole.** `N` has no position and was created last. The sidebar reads `P, N, A, B`. |
| TREE-4.5 (P1) | projects:446 | **Whole.** The response's `position` is `3`. `reindexed` equals `[{A,1},{B,2},{X,3}]` exactly, so each pair carries nothing more. A move into siblings at 1 and 2 returns `reindexed ?? []` empty, at `3`. See Test Quality 2. |
| TREE-4.6 (P1) | projects:476 | **Whole.** A create under `P` and an edit of `X`'s parent to `P`, each from a fresh tree, return the three pairs. |
| TREE-4.7 (P1) | treeSidebar:121 (describe; tests at :138, :153 and :164) | **Whole.** Each test waits for its write to land: `X` at depth 1, or `New` present. The drag reads `P, A, B, X`, and again after a reload. The create reads `New` after `B`. The edit reads `X` after `B`. Without the pairs, each would read the new project first. |
| TREE-4.8 (P2) | treeSidebar:53 | **Whole.** A route stub refuses every non-GET project write with a 400. After the refused drag, create and parent edit, the sidebar reads `A, B, X`, and `X` is at depth 0. |

**TREE-5 to TREE-10 (projects and workflows):**

| Case | Test | Against the *Then* |
|---|---|---|
| TREE-5.1 (P1) | projects:133 | **Whole.** Positions `3`, `1`, `2`, and `5` after children at `1.0` and `4.2`. |
| TREE-6.1 (P0) | projects:343 | **Whole.** `1.5` after `A`, and `2.5` before `C` (made with `A`'s second child `Y`, which leaves the resolution unchanged). `X` at 1.5, moved after `A`, lands at `2`. |
| TREE-6.2 (P1) | projects:365 | **Whole.** `4` to the top level, and `1` under `Q` (made with `Y`, with explicit nulls). With the parent unchanged, `X` at 1.5 lands at `4`. |
| TREE-6.3 (P1) | projects:391 | **Whole.** Four refused neighbors, each named as `prevId` and as `nextId`. All eight writes get a 400, and `X`'s place is unchanged each time. |
| TREE-6.4 (P1) | projects:508 | **Whole.** `X1`, `X2` and `X1a` keep their parents and positions `1`, `2` and `1`. |
| TREE-6.5 (P2) | projects:418 | **Whole.** As `prevId` and as `nextId`: 400s matching `/itself/i`, and `X` is unchanged. |
| TREE-6.6 (P1) | projects:432 | **Whole.** A position alone, and with `prevId`, each gets a 400. The message, "position is not accepted: name a prevId or nextId to place the project instead", says to name a neighbor. `X.position` is still `2.0`. |
| TREE-7.1 (P1) | projects:237 | **Whole.** A rename, and an edit naming the same parent, each keep exactly `2.37`. |
| TREE-7.2 (P1) | projects:264 | **Whole.** `4` under `P`, then `2` at the top level. |
| TREE-8.1 (P1) | projects:181 | **Whole, with the reworded `null`.** `{}`, `{name: null}` and `{name: ""}` each get a 400, and the list is unchanged. |
| TREE-8.2 (P2) | projects:203 | **Whole.** |
| TREE-8.3 (P2) | projects:253 | **Whole.** `""` and `null` each get a 400, and the name is still `Alpha`. |
| TREE-8.4 (P2) | projects:168 | **Whole.** A create named `"   "` gets a 400 with the list unchanged. A rename to it gets a 400, and the name is kept. |
| TREE-9.1 (P0) | projects:724 | **Whole.** `P`, `C` and `D` are gone, with `W`, `W2`, their boards, columns and workphases, and all five items, children included. `Q`, `WQ`, `WQ`'s column and `Q`'s item remain. See Test Quality 3 on "unchanged". |
| TREE-9.2 (P1) | projects:832 | **Whole.** `q` keeps `w1` after the move. After the delete, it has `workphaseId` null, and `R`'s board's `invalidItems` is `[q]`. `Q` is still under `R`. |
| TREE-9.3 (P2) | projects:855 | **Whole.** Label `L` and `S`'s `item_labels` row remain, and `WT`'s board still lists `S`'s item. |
| TREE-10.1 (P1) | workflows:217 | **Whole.** `W3` for `C` gets a 201. `W3`'s board lists `c` and `e`, both in `invalidItems`. `W1`'s board lists only `p`, and `W2`'s only `d`. |
| TREE-10.2 (P1) | projects:564 | **Whole.** `WF2`'s board lists `p1` and `p1a`, both in `invalidItems`, and `WF1`'s lists none. `P1b`'s item stays on `W3`. `Q3`'s item stays on `W4` and isn't on `WF2`. |
| TREE-10.3 (P2) | workflows:311 | **Whole.** After `W2`'s delete, `W1`'s board lists `p`, `c` and `d`, with `c` and `d` in `invalidItems`, each with a null `workphaseId`. After `W1`'s delete, `WZ`'s board lists only `z`. |
| TREE-10.4 (P1) | workflows:200 | **Whole.** A 409 whose message contains `W1` ("Project already has a workflow: "W1""), and `P` still has `W1` alone. `C` gets a 201. |

### boards-columns-unsorted

A5c's batch 3 table gave each case's test, and every one carries its case's ID. BCU-3.2 and BCU-3.3 carry their new IDs, and their tests are rewritten on BCU-3's setup.

| Case | Test | Against the *Then* |
|---|---|---|
| BCU-1.1 (P1) | boards:35 | **Whole.** The flow template's four workphases stand in for the case's three. The bootstrapped board and a `POST /api/boards` board each have one column per workphase, in order. |
| BCU-1.2 (P1) | boards:250 | **Whole.** A 409, and the board still reads with its two columns. With a second board the first deletes with a 204, and then the second gets a 409. |
| BCU-1.3 (P1) | boards:266 | **Whole.** A 404 on the deleted board, neither of its columns exists, and the kept board reads exactly as before. |
| BCU-1.4 (P0) | boards:283 | **Whole.** The seven writes in turn, each checked for success. After each, every item row equals the snapshot, Free and Attached alike. |
| BCU-1.5 (P1) | boards:344 | **Not whole: stays `Open`.** See Gaps. |
| BCU-1.6 (P1) | boards:379 | **Whole.** `WF1`'s board no longer has `X`. `WF2`'s does, and `X` still holds `w1`. |
| BCU-2.1 (P0) | columns:151 | **Whole.** |
| BCU-2.2 (P2) | columns:165 | **Whole.** Names follow two renames and a range edit, and no column write is made between them, which §4's "worked out whenever the board is read" asks. The named column, `Mine`, sits on the second board, since `C` covers `W4` on `B` by then. The rule is the same. |
| BCU-2.3 (P2) | columns:192 | **Whole.** |
| BCU-2.4 (P1) | columns:408 | **Whole.** With an item in a covered workphase, `uncovered` reads `W1, W2`, then all four. |
| BCU-2.5 (P1) | columns:205 | **Whole.** Three refused creates leave the board with no columns, and the refused edit leaves `A` as it was. |
| BCU-2.6 (P1) | columns:229 | **Whole.** |
| BCU-2.7 (P2) | columns:437 | **Whole.** |
| BCU-2.8 (P2) | columns:451 | **Whole.** It covers `W3, W2, W1`, its sub-rows hold the three items in that order, and `uncovered` is empty. |
| BCU-3.1 (P1) | columns:248 | **Whole.** `conflictingColumnId` is `A`, and the message quotes `"Early"`, then `A`'s id once the name is cleared. The refused edit leaves `C` as it was, and the other board accepts the range. |
| BCU-3.2 (P0) | columns:493 | **Whole.** A create from `W3` to `D1` gets a 400 and leaves no columns. An edit to `D1` gets a 400, and `A` keeps `W2` to `W3`. |
| BCU-3.3 (P1) | columns:512 | **Whole.** |
| BCU-3.4 (P1) | workphases:118 | **Whole.** A 400 naming `Early`. `W2` is still non-terminal, and the items read back identical, with `completedAt` null. With a second board's column, one of the two is named. With no column covering `W2`, and with a column covering `W2` alone, each change is accepted. |
| BCU-3.5 (P1) | columns:367 | **Whole.** The setup has no `D1` or `D2`, so "the workflow's order is unchanged" is asserted on its four workphases. |
| BCU-3.6 (P1) | boardsLayer:392 | **Whole.** `Review` is dragged before `Todo`. The board reads `Review, Todo, Doing`, and again after `openBoard`, which reloads the page. Each column's cards are unchanged. |
| BCU-4.1 to 4.7 | workphases:64, :419, :400, :381, :304, :329, :343 | **Whole, each.** BCU-4.3's test uses its own three-workphase setup, with one column from `Todo` to `Done`, deleting the middle one. The rule is the same. |
| BCU-5.1 to 5.3 (P1) | boards:403, :421, :442 | **Whole, each.** |
| BCU-5.4 (P2) | boards:462 | **Whole.** `X` with a foreign workphase, then with none: `invalidItems` is `[X]` and `needsAttention` is true each time. The setup leaves out ATT-9's `R`, so `D` is top-level. That has no bearing on `invalidItems`. |
| BCU-5.5 (P2) | attachedUI:67 | **Whole against §10's rule.** The Free ancestor is a detached child, not the case's top-level `D`. See Judgments. |

### item-positioning and item-attachment: no lost coverage

- **Every `Automated` case still has a test carrying its ID:** 76 TC cases and 64 ATT cases. The 49 Rule lines that batch 2 re-pointed changed no status.
- **Every Automation test line names only files that carry the case's ID.** Each line was checked against the titles.
- **The generalized code moved no tests.** `itemWriteReconciliation.test.ts` still carries TC-5a.1, 5a.2, 5a.4, TC-2.28, 2.29, 2.30, DRAG-6.4 and DRAG-6.14. `items.hierarchy.test.ts` and `items.test.ts` still carry ATT-4.4, 4.5, 4.7, 4.10 and 4.11, which exercise the depth walk that `itemTree.ts` now shares with projects.
- **TC-2.32 still agrees with its moved rule.** The case reads "a 400 whose message says to name an anchor and side", and items:294 asserts `/name an anchorId and side/`. Positioning §2's "a neighbor and a side" is the same rule in shared words, as batch 2's Amendments say.

---

## Lost Coverage

**None.** Every `Automated` case in all five catalogs has at least one test whose title, or an enclosing `describe`'s title, starts with its ID. No case went back to `Open`.

The retired IDs are gone from the code: no test or comment carries TREE-1.7, TC-6.7 or TC-6.8. TREE-1.7's test was replaced by TREE-1.11's (treeDrag:141). TC-6.7's two tests and TC-6.8's one were replaced by BCU-3.2's and BCU-3.3's (columns:493 and :512).

## Unknown IDs

**None.** Every case ID at the start of a test title, in `server/tests/`, `tests/` and `client/src/`, is a case in the catalog. `scripts/check-docs/check.test.mts` carries `BCU-1.1` and `BCU-1.2` as fixture strings inside the checker's own tests, not as test titles.

**`Manual` cases carried by a test: none.** No test carries DRAG-1.29, 1.32, 4.24 or 4.25.

## Proposed Stamps

**None.** Every case in scope carries its ID on its test.

## Proposed Internal Mappings (need approval)

**None.** No client test carries a TREE-3 to TREE-10 or BCU ID. The surface tests cover every stamped case whole, so no internal test is proposed beside them (`docs/test-plans/README.md`, "Which tests count").

**Existing internal pointers:** none in scope sits beside a whole surface test. TREE-1.4's, 1.8's and 1.9's lines already name only treeDrag (Duplication 2). Item-positioning lines that name client tests beside a surface test, such as TC-2.11, TC-2.28 and TC-5a.1, weren't re-judged in this run, since their statuses were only checked for lost coverage. So no drop is proposed.

## Proposed Manual (need approval)

**None.**

## Gaps

### In scope

**BCU-1.5 (P1): stays `Open`, `—`.** boards:344 "BCU-1.5: a board shows the items of every project that uses its workflow, its own or inherited" asserts every clause but one:
- **Asserted:** `WF`'s board lists exactly `a`, `b` and `c`, not `d`, `e` or `z`. `WF2`'s board lists `d` and `e`. `a0`, with no workphase, joins `WF`'s board.
- **Missed, and asserted the other way:** the case's *Given* has "`Z`, top-level, on `WF2`", and its *Then* says `WF2`'s board lists `d`, `e` and `z`. The test gives `Z` a workflow of its own, `WF3`. It asserts that `WF2`'s board is exactly `{d, e}`, so `z` is on neither board.
- **Why no test can assert the case's version:** a workflow has one owning project. A top-level project uses only its own workflow, since it has no ancestor (wiki project-tree §10). So no API setup puts top-level `Z` on `D`'s `WF2`. A5c's Coder reported this in A5c's handoff for the Test Planner. A5c's Close never ran, and batch 2's re-pointing of BCU-1.5's Rule line left `Z` as it was.
- **To close it:** a Test Planner rewording. A5c's Coder suggested `Z` on a workflow of its own, with `z` on neither board. boards:344 already asserts that version whole, so the next run would stamp it. BCU-1.5 is in A5d's Scope, so it needs the rewording at this Close, or a place in a later story's Scope.

### Outside this run's scope

69 other cases are `Open`: 66 in board-drag-interaction, plus ATT-4.9, TC-5.15 and TC-6.11. They weren't re-judged. Several DRAG cases already have tests carrying their IDs, among them DRAG-1.1, 1.5, 1.24, 4.1, 5.1 and 6.6. epic-4-decisions.md routes TC-6.11 to the Quick Items epic, and its tests exist, without the ID, in workphases:169 and :197.

---

## Duplication

Reported, not judged. Each one looks intended.

1. **TREE-3.7 has two layers:** projects:670 for the API half, and treeSidebar:174 for "the sidebar shows each of them". Each half needs its own surface.
2. **TREE-1.4, 1.8 and 1.9** are each carried by treeDrag (:99, :189 and :225), which is on their lines, and by client tests that stay off them: the hook's describes in `client/src/components/sidebar/useProjectDragReorder.test.ts` at :154, :243 and :302, and `client/src/lib/hierarchyPlacement.test.ts:241` for TREE-1.4. This is unchanged since A5b.
3. **A project moved into another workflow** is set up in four tests across three catalogs. Each asserts something the others don't:
   - BCU-1.6 (boards:379): the item keeps its workphase;
   - TREE-10.2 (projects:564): the subtree, and a project that owns its workflow;
   - TC-7.20 (hier:872): Unsorted and `positionScope`;
   - TREE-9.2 (projects:832): the move is the setup for a delete.
4. **TREE-4.1's second half and TREE-4.5** (projects:534 and :446) use the same 1500/1600 siblings. TREE-4.1 reads the stored rows, and TREE-4.5 the response's pairs.
5. **Inheritance** is BCU-1.5's (boards:344), with which workflow each project uses read through the boards. TREE-10.1 and 10.3 (workflows:217 and :311) change it by a create and a delete, on similar trees.
6. **The unmapped API spec, `tests/api/projects.spec.ts`,** re-asserts rules the route tests own:
   - :21, a nested create (TREE-5.1);
   - :67 and :76, own-parent and descendant refusals on `PUT` (TREE-3.2 and 3.3);
   - :88, the delete cascade (TREE-9.1).

   The route tests assert each one whole, so the spec stays unmapped support, as the Coder's 3a handoff says. A5c's notes say the same of `tests/api/boards.spec.ts` and `columns.spec.ts`.

---

## Test Quality Concerns

None of these blocks a stamp. Each test asserts the case's rule, not just today's output. The concerns are about how firmly.

1. **TREE-4.3, treeSidebar:13: the creation-time tie isn't pinned.**
   - `B` is "created first" only because its `POST` comes first. `createdAt` is `Date.now()`, so two creates in the same millisecond tie, and their order then rests on row order. TREE-4.2's route test sets `createdAt` directly (projects:93).
   - Also, `GET /api/projects` already returns the tie-break's order. So a sidebar that sorted by position alone, with a stable sort, would pass too. The case is about the visible order, and that's asserted.
   - Pinning `createdAt` through a test route, as `pinProjectPosition` pins a position, would make the tie certain. The rule it should verify is wiki positioning §1, "the tie-break".
2. **TREE-4.5 and 4.6, projects:458, :492 and :501: the pairs' order is pinned.** `toEqual` on `reindexed` asserts the order A, B, then the written project. Positioning §7 asks for "a collection of `{id, position}` pairs" and gives no order. A change that reorders the pairs would fail these tests without breaking the rule. An order-blind comparison that keeps the exact-shape check would match §7.
3. **TREE-9.1, projects:757–761: "unchanged" is asserted as survival.**
   - For `Q`, `WQ` and `Q`'s items, the test checks that `Q`, `WQ` and `Q`'s item are each found by GET, and that `WQ`'s board still has its one column. It doesn't compare rows before and after.
   - I judged it whole. Each plausible way a delete reaches outside the subtree is caught: deleting `Q`, `WQ`, its board, its column or `Q`'s items. A deleted `WQ` workphase would fail, or take its column with it (`columns` references `workphases` with no `ON DELETE` action).
   - A row snapshot, as BCU-1.4's test takes (boards:299), would make the case's "unchanged" exact.
4. **Outside this run's scope: workphases:169 and :197 pin an unsettled question.**
   - These are the terminal-flag backfill tests, which TC-6.11 is routed with. They also fix what TC-6.13, a `Pending PO` case, asks: the order in which one flag change completes, then reopens, several items.
   - **A code fact for that question:** workphases:192–194 asserts strictly increasing `completedAt` in position order. TC-6.13's *Given* assumes one write ties them on `completedAt`. Today's code doesn't tie them.
   - That's for the PO's answer, and for the Test Planner's wording of TC-6.13.

## Judgments for the Test Planner

Cases where a test asserts something other than the case as written:

1. **BCU-1.5 contradicts its test,** and its `Z` can't be built. It stays `Open` (Gaps).
2. **BCU-5.5's Free ancestor isn't top-level in its test.**
   - The case's *Given* has "top-level Free item `D`, which has no workphase". attachedUI:67's ancestor, `Diverged Free Kid`, is a detached child of another item. Its workphase was deleted, and its attached child came along.
   - Wiki boards-columns-unsorted §10 says an Attached item shows "inside its nearest Free ancestor's Card", with no top-level condition. So the test asserts the rule, and I stamped it.
   - Whether the case keeps "top-level" (a simpler setup a test could also use), or widens to "a Free item", is the Test Planner's call. A5c's Coder left this to the Reconciler.
3. **TREE-3.5's message names "the cap", not "the project cap".**
   - The refusal reads "Resulting hierarchy depth N exceeds the cap of C". Items' cap gives the same wording (`lib/itemTree.ts::withinCapError`), and projects:608 matches `/exceeds the cap/i`.
   - The case, as reworded at Close, says the message "says the parent would put the subtree past the project cap". I read it as met: the message names the condition the write breaks (project-tree §3), and the write is to a project.
   - If "names the project cap" means the word "project" must appear, the test and the message fall short, and the case goes back to `Open` on the next run.
4. **Setups that differ from the case's, judged equivalent:**
   - BCU-1.1 uses four workphases, not three.
   - BCU-2.2 puts `Mine` on the second board.
   - BCU-3.5 has no `D1` or `D2`.
   - BCU-4.3 builds its own setup.
   - BCU-5.4 leaves out ATT-9's `R`.
   - TREE-6.1's and 6.2's second scenarios use `A`'s other child `Y`, not `X` from the starting state.
   - TREE-4.5's no-reindex scenario uses `Q`, `Q1`, `Q2` and `Y`.

   None needs action unless the Test Planner wants the cases' wording to follow.

---

## Uncatalogued Tests

From the test files this run read. Tests that carry an ID are mapped above.

### Gate and contract support (no standalone business rule; no mapping forced)

- **projects:**
  - :80, an empty list;
  - :107, a project with its `workflows` array;
  - :117, :232, :338 and :711, the 404s;
  - :125, a root create's null defaults;
  - :195, an edit updates only the fields it names;
  - :524, a move returns the full row;
  - :716, a leaf delete;
  - :211 and :222, which clear and change a parent through `PUT`. TREE-7.1 and 7.2 cover both in substance.
- **workflows:**
  - the CRUD, template and clone tests;
  - :70, a bounded depth on a corrupted `parentId` cycle;
  - :86, `positionScope` on the workflow read, which TC-2.13 and 2.14 cover through items;
  - :272, :293 and :341, the delete tests. TREE-10.3 and boards-columns-unsorted §8 cover what a workflow delete does to items.

  No wiki page states workflows' own rules. A5d's Out of scope leaves templates, copying and workphases to a later page.
- **boards:**
  - :23 and :194, the bootstrap columns (BCU-1.1);
  - :70, the resolved column fields;
  - :167, a named column (BCU-2.2's `Mine`);
  - :49, :65, :184, :189, :210, :215 and :245, the list, the 404s, the 400s and the rename.
- **columns:**
  - the pure helper tests, :45 to :93, internal tests of `lib/columnRanges.ts` whose rules BCU-2 to BCU-5 assert through the routes;
  - the 400s and 404s;
  - :277 and :298, adjacent ranges and an overlapping edit (BCU-3.1);
  - :313, which keeps `displayMode` on a name-only edit and clears a name.
- **workphases:**
  - :53, a new workphase appended at max + 1, the simple append math that BCU-4.1's "goes last" asserts as a rule;
  - the flag-coercion, omitted-field, reorder and empty-delete tests;
  - :169, :197 and :227, TC-6.11's tests, which are routed (Gaps), and see Test Quality 4.
- **The UI specs `tests/ui/project-page.spec.ts` and `project-sidebar.spec.ts`:** the project page and the sidebar's other controls, the placeholder tier under project-tree's Open questions. They stay unmapped by design.

### Pins an open question

- **projects:280, "ignores a supplied position field entirely":** an edit that names a position ignores it. `positioning-on-create-and-edit.md` asks whether a create or an edit takes a position, and D5 says this test pins today's answer. Nathan ruled that ignoring one is acceptable for now. It gets no case until that story rules.

### Possibly a rule, not stated anywhere

- **boards:225, "persists the showAttachedChildren toggle, which defaults to on":** a board's setting to show or hide attached children, on by default and kept across a rename. No wiki page mentions it. It reads as board presentation, which boards-columns-unsorted holds as a placeholder, so I don't propose a case. The PO can say otherwise.

## Candidate New Cases

Not added. Each is for its owner to decide.

1. **The sidebar's project cap is the one the API enforces.** *A Test Planner gap: the rule is in the wiki.*
   - Hierarchy-placement §6 says "A feature's UI and its API always enforce the same `CAP`: one value". Items have DRAG-2.10 for it. Projects have no case.
   - Two tests already exercise it:
     - projects:599 asserts that `GET /api/projects/depth-cap` returns `PROJECT_DEPTH_CAP`. It's a route test, but it reads the constant directly.
     - treeDrag:141, TREE-1.11's test, reads the cap from that route and finds the sidebar's invalid state exactly past it. A sidebar holding a different value would fail it.
   - The PO said at Close that the page needs no change, so this is only about the catalog.
2. **Deleting a project deletes its items' dependent rows.** *A Product Owner gap: no wiki page states it.*
   - projects:764, "cascades through a nested project tree, workflow, workphase, items, and related records", deletes a project. It asserts that each deleted item's `item_labels` rows, attachments, notifications, chat threads and chat messages go with it, and that the label survives.
   - The label is TREE-9.3's. The dependent rows are DB-owned (root `CLAUDE.md`, migration 0009), but no page says what happens to an item's comments, attachments or notifications when the item goes.
   - It's low priority: attachments and chat are schema only, and labels are due to be replaced. The Coder's 3a note says the same of this test.

---

## Totals

**Status changes in this run:**
- **`Open` → `Automated`, 70 cases:**
  - TREE-1.11, 1.12, 2.3, 3.1 to 3.8, 4.1 to 4.8, 5.1, 6.1 to 6.6, 7.1, 7.2, 8.1 to 8.4, 9.1 to 9.3 and 10.1 to 10.4 (39);
  - BCU-1.1 to 1.4, 1.6, 2.1 to 2.8, 3.1 to 3.6, 4.1 to 4.7 and 5.1 to 5.5 (31).
- **`Automated` → `Open`:** none.
- **Unchanged in scope:** BCU-1.5, `Open`.

**The catalog after this run: 341 cases.**

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 109 | 116 | 39 | 264 |
| Open | 23 | 36 | 11 | 70 |
| Manual | 0 | 2 | 2 | 4 |
| Pending PO | 0 | 0 | 2 | 2 |
| Planned | 0 | 0 | 1 | 1 |
| **Total** | **132** | **154** | **55** | **341** |

| Catalog | Cases | Automated | Open | Manual | Pending PO | Planned |
|---|---|---|---|---|---|---|
| board-drag-interaction | 113 | 43 | 66 | 4 | 0 | 0 |
| boards-columns-unsorted | 32 | 31 | 1 | 0 | 0 | 0 |
| item-attachment | 67 | 64 | 1 | 0 | 1 | 1 |
| item-positioning | 79 | 76 | 2 | 0 | 1 | 0 |
| project-tree | 50 | 50 | 0 | 0 | 0 | 0 |
| item-sheet | 0 | 0 | 0 | 0 | 0 | 0 |

Before this run, the counts were the Test Planner's at Close step 3: 194 `Automated`, 140 `Open`, 4 `Manual`, 2 `Pending PO` and 1 `Planned`.

- **`Open`, by catalog:**
  - board-drag-interaction, 66: 22 P0, 34 P1, 10 P2;
  - ATT-4.9, P0;
  - TC-6.11, P1;
  - TC-5.15, P2;
  - BCU-1.5, P1.
- **`Pending PO`:** ATT-5.11 and TC-6.13, both P2.
- **`Planned`:** ATT-1.10, P2.
- **`Manual`:** DRAG-1.32 and 4.25, P1, and DRAG-1.29 and 4.24, P2.

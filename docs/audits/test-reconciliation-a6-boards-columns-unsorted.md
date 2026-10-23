# Test Reconciliation: A6 close, boards-columns-unsorted

**Run:** one of five parallel instances of A6's closing Reconciler run (batch 4 of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`), followed by a closing run. **Scope:** `docs/test-plans/boards-columns-unsorted/`, all 33 BCU- cases, read against commit `57d3ca2` on `main` plus the uncommitted edits that are current: the plan, `bcu-2-a-column-and-its-range.md` (BCU-2.8's new title, and the new BCU-2.9) and wiki boards-columns-unsorted (§4, §9 and §10 as the PO wrote them on 2026-10-22). The checks across the whole catalog were run for BCU- IDs only; the other instances own the other prefixes.

**Inputs read:** the five suite files and `INDEX.md`; wiki boards-columns-unsorted in full; the plan's Open questions, and its Code map and Amendments for batches 3d to 3h; the previous BCU run, `docs/archive/test-reconciliation-a5d-close.md`, and A5d's archived plan on BCU-1.5's rewording; `docs/audits/code-quality-audit-a6.md`'s items for the Reconciler; every test carrying a BCU- ID; and the other tests in `boards.test.ts`, `columns.test.ts`, `workphases.test.ts`, `lib/columnRanges.test.ts`, `boards-layer.spec.ts`, `boards.spec.ts`, `workflow-inheritance.spec.ts`, `workflow-creation.spec.ts`, `tests/api/boards.spec.ts`, `tests/api/columns.spec.ts` and `useColumnManagement.test.ts`. The ID checks were run by search. This run had no shell, so no gate or test suite was run; the Coder's 3g and 3h results stand for those.

**In brief:**
- **One status change:** BCU-1.5 goes from `Open` to `Automated`. A5d's Test Planner reworded it after that story's run, and that run had found the test already asserted the reworded version. The re-check that would have stamped it never landed.
- **BCU-2.9 stays `Open`, with no test.** No test asserts any of it through a surface. It's in no story's Scope (Gaps).
- **BCU-2.8 stays `Automated`.** Its text didn't change, and its test still asserts all of it. The test's title is the case's old title, which now states something wiki §9 contradicts (Test Quality Concerns 1).
- **Lost coverage: none.** Batch 3f's move of the eight `columnRanges` helper tests took no BCU- ID with it, and batch 3g's split of `boards.spec.ts` touched no file a BCU- Automation line names.
- **Unknown IDs: none.**
- **Nothing needs Nathan's approval:** no internal mapping or `Manual` status is proposed. One thing needs his routing: BCU-2.9 needs a place in a story's Scope.
- **The folder after this run:** 33 cases, 32 `Automated` and 1 `Open`.

---

## How to read this report

Line numbers are the files' at `57d3ca2`. Aliases:

| Alias | File |
|---|---|
| boards | `server/tests/routes/boards.test.ts` |
| columns | `server/tests/routes/columns.test.ts` |
| workphases | `server/tests/routes/workphases.test.ts` |
| ranges | `server/tests/lib/columnRanges.test.ts` |
| boardsLayer | `tests/ui/boards-layer.spec.ts` |
| boardsUI | `tests/ui/boards.spec.ts` |
| inheritanceUI | `tests/ui/workflow-inheritance.spec.ts` |
| creationUI | `tests/ui/workflow-creation.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| boardsAPI | `tests/api/boards.spec.ts` |
| columnsAPI | `tests/api/columns.spec.ts` |
| colMgmt | `client/src/components/workflow/useColumnManagement.test.ts` |

A test *carries* an ID when its title, or an enclosing `describe`'s title, starts with the ID. Every test mapped below is a route test or a Playwright test, so each counts without approval.

---

## Coverage Mapping

### Fields written

| Case | Suite file | Status | Automation test line |
|---|---|---|---|
| BCU-1.5 | `bcu-1-boards-and-what-they-show.md` | `Open` → `Automated` | `—` → `server/tests/routes/boards.test.ts` |

Nothing else in the folder changed. Every other Automation line still names exactly the files whose tests carry the case's ID, so none needed re-pointing after batch 3's moves.

### Each case against its *Then*

"Whole" means every clause of the case's *Then* is asserted. Setups the previous run judged equivalent (BCU-1.1's four workphases, BCU-2.2's `Mine` on the second board, BCU-3.4's and BCU-3.5's missing terminal workphases, BCU-4.3's own setup, BCU-5.4's missing `R`, BCU-5.5's Free child) are unchanged, and the Test Planner kept the cases as they are. They aren't raised again.

| Case | Test | Against the *Then* |
|---|---|---|
| BCU-1.1 (P1) | boards:35 | **Whole.** The bootstrapped board and a `POST /api/boards` board each cover one workphase per column, in the workflow's order. |
| BCU-1.2 (P1) | boards:240 | **Whole.** A 409, and the board still reads with its columns. With a second board, the first deletes with a 204, and the second then gets a 409. See Test Quality Concerns 3. |
| BCU-1.3 (P1) | boards:256 | **Whole.** A 404 on the deleted board, none of its columns left in the table, and the kept board reads exactly as before. |
| BCU-1.4 (P0) | boards:273 | **Whole.** The case's seven writes in turn, each checked for success. After each one, the whole `items` table equals its snapshot, Free and Attached rows alike. |
| BCU-1.5 (P1) | boards:332 | **Whole: newly `Automated`.** `WF`'s board is exactly `{a, b, c}` and `WF2`'s exactly `{d, e}`, so `d`, `e` and `z` are off the first and `z` off the second. `Z` owns `WZ`, as the reworded case has it. `a0`, with no workphase, makes `WF`'s board `{a, b, c, a0}`. `itemIdsOn` reads every place a board returns an item: column sub-rows, `uncovered` rows and `invalidItems`. |
| BCU-1.6 (P1) | boards:367 | **Whole.** `WF1`'s board loses `X`, `WF2`'s gains it, and `X` still holds `w1`. |
| BCU-2.1 (P0) | columns:64 | **Whole.** Ends `W1` and `W3`, covering `W1, W2, W3` in order, `uncovered` exactly `[W4]`, and a `W4`-to-`W4` column covering `W4` alone. |
| BCU-2.2 (P2) | columns:78 | **Whole.** |
| BCU-2.3 (P2) | columns:105 | **Whole.** See Test Quality Concerns 4. |
| BCU-2.4 (P1) | columns:321 | **Whole.** |
| BCU-2.5 (P1) | columns:118 | **Whole.** |
| BCU-2.6 (P1) | columns:142 | **Whole.** |
| BCU-2.7 (P2) | columns:350 | **Whole.** The range it already has is refused with a 400 and `A` stays `broken`; `W3` to `W1` is accepted and `A` isn't `broken`. |
| BCU-2.8 (P2) | columns:364 | **Whole, against the retitled case.** `A` is `broken`, covers `W3, W2, W1`, its sub-rows hold the three items in that order, and `uncovered` is empty. The case's text didn't change, only its title. See Test Quality Concerns 1 on the test's title. |
| BCU-2.9 (P2) | none | **No test: stays `Open`, `—`.** See Gaps. |
| BCU-3.1 (P1) | columns:161 | **Whole.** |
| BCU-3.2 (P0) | columns:406 | **Whole.** |
| BCU-3.3 (P1) | columns:425 | **Whole.** |
| BCU-3.4 (P1) | workphases:114 | **Whole.** |
| BCU-3.5 (P1) | columns:280 | **Whole.** |
| BCU-3.6 (P1) | boardsLayer:334 | **Whole.** `Review` is dragged before `Todo`. The board reads `Review, Todo, Doing`, and again after `openBoard` reloads the page, and each column's cards are as before. Batch 3g moved its setup onto `seedColumn` and `seedItem`; what it asserts is unchanged. |
| BCU-4.1 (P1) | workphases:60 | **Whole.** |
| BCU-4.2 (P1) | workphases:410 | **Whole.** |
| BCU-4.3 (P2) | workphases:393 | **Whole.** |
| BCU-4.4 (P1) | workphases:374 | **Whole.** |
| BCU-4.5 (P1) | workphases:300 | **Whole.** |
| BCU-4.6 (P1) | workphases:325 | **Whole.** |
| BCU-4.7 (P2) | workphases:339 | **Whole.** |
| BCU-5.1 (P1) | boards:391 | **Whole.** |
| BCU-5.2 (P1) | boards:405 | **Whole.** |
| BCU-5.3 (P1) | boards:426 | **Whole.** |
| BCU-5.4 (P2) | boards:446 | **Whole.** |
| BCU-5.5 (P2) | attachedUI:67 | **Whole against §10's rule.** |

---

## Lost Coverage

**None.** Each of the 31 cases that were `Automated` before this run has a test carrying its ID, in the file its Automation line names.

- **Batch 3f's server split.** The eight helper tests that left `columns.test.ts` are ranges:30, :35, :39, :43, :48, :53, :61 and :68, under "column range helpers" (ranges:26). None carried a BCU- ID before the move: the previous run listed them, at columns:45 to :93, as internal tests with no ID. No BCU- Automation line named them. Every case whose line names `columns.test.ts`, BCU-2.1 to 2.8, 3.1, 3.2, 3.3 and 3.5, still has its test there.
- **Batch 3g's E2E split.** No BCU- Automation line names `tests/ui/boards.spec.ts`. The two E2E files that BCU- lines name, `boards-layer.spec.ts` (BCU-3.6) and `attached-children.spec.ts` (BCU-5.5), were edited by 3g, not split, and both IDs are still on their tests.

## Unknown IDs

**None.** The BCU- IDs at the start of test titles are BCU-1.1 to 1.6, 2.1 to 2.8, 3.1 to 3.6, 4.1 to 4.7 and 5.1 to 5.5, each a case in the catalog. `scripts/check-docs/check.test.mts:266–273` holds `BCU-1.1` and `BCU-1.2` as fixture strings inside the checker's own test, not as test titles.

**`Manual` cases carried by a test:** none. The folder has no `Manual` case.

## Proposed Stamps

**None.** Every case except BCU-2.9 already carries its ID on a test that asserts it whole, and no existing test covers BCU-2.9 (Gaps).

## Proposed Internal Mappings (need approval)

**None.** Two internal tests were considered and not proposed:
- **ranges:61, "treats unknown workphase ids as unresolvable: null range, broken column, no overlap", for BCU-2.9.** It asserts one clause of BCU-2.9, `broken`, for an end that names no workphase, at the helper level. The case would stay `Open` with it. Every clause of BCU-2.9 is reachable through `GET /api/boards/:id` and `PUT /api/columns/:id`, so the route test that closes it would cover the whole case, and the README's rule then leaves no room for the internal pointer beside it.
- **colMgmt:20 (three tests), the client half of BCU-3.6's drop.** boardsLayer:334 covers BCU-3.6 whole, so no internal test is mapped beside it (`docs/test-plans/README.md`, "Which tests count").

## Proposed Manual (need approval)

**None.** BCU-2.9 can be automated as a route test (Gaps).

---

## Gaps

**BCU-2.9 (P2), "A column with an end outside the workflow is broken, and covers no workphase": `Open`, `—`, no test.**
- **What exists:** no route or Playwright test makes such a column. Every broken column the suites build comes from a workphase reorder (columns:338's describe, workphases:325, boardsLayer:162), which is §9's other kind. ranges:61 asserts that the helpers treat an end that names no workphase as broken and rangeless, and nothing else (Proposed Internal Mappings).
- **Nothing in the code needs to change.** `routes/boards.ts:22` already names a column that covers nothing "(empty range)", and the Architect's facts in the plan say a read gives such a column `broken: true` and no sub-rows, and leaves its workphases in `uncovered`.
- **How a route test would build it, for whoever writes it:**
  - The case's `V1` variants need only a direct `db.update(columns)` write, as BCU-5.2's and BCU-5.4's tests already write `items`. `V1` is a real workphase, so the foreign key holds.
  - The third variant, "an id that names no workphase", is refused by SQLite with foreign keys on: `columns.start_workphase_id` and `end_workphase_id` reference `workphases.id` (`server/src/db/schema.ts:107–112`), and `server/src/db/index.ts` turns enforcement on. The test needs `sqlite.pragma('foreign_keys = OFF')` around that one write (`sqlite` is exported from `db/index.ts`), as the test reset does.
  - The case's setup fits `columns.test.ts::setupFour` plus one more workflow for `V1`, which BCU-2.5's test already builds that way.
- **Not in any Scope.** The plan's Open questions add BCU-2.9 as `Open`, and Nathan's note of 2026-10-22 says tests for the new cases come after this run. No story's Scope lists it, and the README says an `Open` case always sits in one. It needs one: A6's, if its test lands before sign-off, or a later story's.
- **"Takes no drop"** is DRAG-1.9's and DRAG-2.8's, as BCU-2.9 says. Whether their tests reach a column with an end outside the workflow is the board-drag-interaction instance's call. The client reads only `broken`, not why (the Architect's fact), so a test of either kind exercises the same path.

No other BCU- case is `Open`.

---

## Duplication

Reported, not judged. Each one looks intended: a route test holds the rule, and a UI or API spec checks that the board or the published API shows it.

1. **A new board's columns (BCU-1.1):** boards:35 carries it. boards:187 (a `POST /api/boards` board, by display name), boards:24 (a workflow with no workphases gets one board with no columns), boardsAPI:10 (bootstrap, all `merged`), boardsLayer:37 (a second board made in the UI shows 1:1 columns) and creationUI:44 (a templated workflow's board shows its four workphases) say the same.
2. **The last board and a board delete (BCU-1.2, 1.3):** boardsAPI:50, and through the UI boardsLayer:25 (no "Delete board" button on a workflow's only board) and boardsLayer:237 (a delete falls back to the remaining board).
3. **Inheritance (BCU-1.5):** inheritanceUI:83 (a child's item on the parent's board) and inheritanceUI:221 (a child with its own workflow keeps its item off the parent's board) are BCU-1.5's `b` and `d` clauses through the UI. The rest of inheritanceUI is the inherited view, a placeholder (Uncatalogued Tests). TREE-10.1 and 10.3 change which workflow a project uses on similar trees, in the project-tree catalog.
4. **A project moved into another workflow (BCU-1.6):** still set up as well by TREE-10.2, TC-7.20 and TREE-9.2, each asserting something the others don't. That's unchanged since the previous run.
5. **Column names and display mode (BCU-2.2, 2.3):** boards:70 and boards:163 (a computed name, and a name of its own), columnsAPI:33 (a created column is `merged` and named for its range), columns:190 (an `expanded` create).
6. **A column delete (BCU-2.4):** boardsLayer:285, through the UI: the column's workphase and its item land in Unsorted.
7. **A broken column after a reorder (BCU-2.7, 2.8, 4.6):** the three route tests each make the same reorder, by design. boardsLayer:167 shows the `broken` badge, whose look is a placeholder. ranges:39 and :43 assert the min/max range and the flag at the helper level.
8. **Overlap (BCU-3.1):** columns:211 (an overlapping edit), columnsAPI:48 (an overlapping create names the conflicting column), boardsLayer:141 (the column editor's inline error, a placeholder), ranges:53.
9. **A board's column order (BCU-3.5, 3.6):** columnsAPI:65 and boardsLayer:311 (an API reorder, then the rendered order), and colMgmt's three tests (the drop's client half). The plan's batch 3e note says the E2E reached `onColumnDrop` only through BCU-3.6 before colMgmt existed.
10. **A new workphase is uncovered (BCU-4.1):** boardsUI:45, through the UI: no column for it, and it's in Unsorted.
11. **A workphase delete shrinks or deletes columns (BCU-4.2):** boardsLayer:200, the UI's "1 column resized" and "1 column removed" notices.
12. **An item whose workphase is deleted (BCU-4.4):** boards:140, TC-2.16, asserts it reaches `invalidItems`, in the item-positioning catalog.
13. **Unsorted (BCU-5.1, 5.2):** ranges:68 asserts `computeUnsorted` at the helper level; boards:70 reads `uncovered` and `needsAttention` on the resolved board.

---

## Test Quality Concerns

None of these blocks a status. Each mapped test asserts its case's rule, not just today's output. The first two answer the plan's Open questions; 3 and 4 are minor.

1. **BCU-2.8's test title is the case's old title, and §9 now contradicts it** (the plan's "From the Test Planner (2026-10-22)": BCU-2.8 retitled).
   - columns:364 is titled "BCU-2.8: a broken column still covers the workphases between its two ends". Since the PO's §9, a broken column with an end outside the workflow covers none, so as a general statement the title is now false. The case is retitled "A column whose start comes after its end still covers the workphases between its two ends".
   - What the test asserts is unchanged and still the case, since the case's text didn't change: an inverted column covers its two ends' span, shows their items, and leaves nothing in `uncovered`. So BCU-2.8 stays `Automated`.
   - **For a developer:** retitle the test to the case's title. The ID stays at its start, so nothing re-maps.
2. **BCU-2.9: whether an existing test covers it** (the same section). No. Only ranges:61 touches it, for one clause at the helper level, and it isn't proposed (Proposed Internal Mappings, Gaps). Every clause, the "(empty range)" name and the fix by an edit included, needs a new route test.
3. **BCU-1.2, boards:240: "nothing changes" is asserted as a column count.** After the refused delete, the test checks that the board reads with two columns, the quick template's two. That count rests on the template, so it isn't today's output restated. Comparing the read with one taken before the delete, as BCU-1.3's test does at boards:262–268, would assert the case's "nothing changes" exactly.
4. **BCU-2.3, columns:105, also asserts the new column's `position` is `1.0`.** That's the append math root `CLAUDE.md` describes for column positions, not a wiki rule, and not in BCU-2.3's *Then*. A change to how columns are numbered would fail this test without breaking its case. Dropping the assertion, or moving it to a test of its own, would keep BCU-2.3's test to its rule.

**The plan's other items for the Reconciler, checked for this folder:**
- **Batch 3f's server-test splits:** no BCU- case lost its test (Lost Coverage).
- **Batch 3g's split of `tests/ui/boards.spec.ts`:** nothing a BCU- Automation line names is gone (Lost Coverage).
- **The report's block ("For the Test Reconciler, on its next run"), batch 3b's, 3e's and 3f (1 of 2)'s notes, and the Test Planner's other bullets:** none names a BCU- case or a file that carries one. They're for the other instances, or for the closing run.

---

## Uncatalogued Tests

From the files read for this folder. Tests that carry a BCU- ID are mapped above; tests carrying another catalog's ID (boards:103 DRAG-2.10, :109 TC-1.1, :140 TC-2.16; workphases:163 and :192, TC-6.11's routed backfill tests) are the other instances'.

### Gate and contract support (no standalone business rule; no mapping forced)

- **boards:** :49, the `workflowId` filter; :65, :182, :200 and :235, the 404s; :177, a 400; :205, a rename; :70, the resolved column's fields; :24, :163 and :187, which restate BCU-1.1's and BCU-2.2's rules (Duplication 1 and 5).
- **columns:** :49 and :54, a 400 and a 404; :190 and :211, adjacent ranges and an overlapping edit (Duplication 5 and 8); :206 and :316, 404s; :247, :252 and :264, the reorder's body checks and its `missingIds`.
- **workphases:** :33 and :43, the 400s; :49, a new workphase appended at max + 1, the append math under BCU-4.1's "goes last"; :80, :85 and :101, a 404, flag coercion and omitted fields; :223, an attached child's position on a terminal flip (item-positioning's, not this folder's); :249, :254, :270 and :283, the reorder's body checks; :360 and :365, a 404 and an empty delete.
- **ranges, all eight tests:** internal tests of `lib/columnRanges.ts`, whose rules the BCU- route tests assert through the API.
- **boardsAPI and columnsAPI:** each re-asserts a rule a route test owns (Duplication 1, 2, 5, 8 and 9), as the previous run and A5c's notes found.
- **boardsUI** (the "board basics" left after 3g's split): :40, the board loads its workphases as columns; :45, a new workphase lands in Unsorted (Duplication 10); :60, an item created through the API shows in its column; :72, the "+ Add item" form. The plan records the PO's ruling that the form stays off the wiki page, since existing rules decide what its create does. No case.
- **boardsLayer**, other than BCU-3.6's test: the board's presentation of rules the route tests own: the board switcher, rename and delete controls (:25, :37, :62, :237), the column editor (:86, :115, :141, :255), the `broken` badge (:167), the workphase-delete notice (:200), a column delete (:285) and an API reorder (:311). The column editor, the badges and the Unsorted bucket's look are placeholders under wiki boards-columns-unsorted's Open questions, so they derive no case.
- **inheritanceUI:** the inherited view (:59, :67, :75, :91, and the read-only describe at :119) is a placeholder under the wiki's Open questions, "The inherited view". :83 and :221 restate BCU-1.5's clauses (Duplication 3).
- **colMgmt:** the column drop's client half (Duplication 9). Its "save from position 1" is the append math; see Possibly a rule for its reload.
- **creationUI:** workflow creation from scratch, a template or a copy, and a stale copy source. No wiki page states workflows' own rules; it's outside this folder, for the closing run.

### Possibly a rule, not stated anywhere

- **colMgmt:41, "reloads the board when the save fails":** a refused column reorder puts the board back as the server has it. Wiki boards-columns-unsorted §7 doesn't say what the board does when the reorder is refused, though wiki board-drag-interaction §10 has the matching rule for an item drop (DRAG-6.6, "A failed drop resyncs the board from the server; the guess is never kept"). It's low priority: a reorder is refused only for a malformed body or a column that no longer exists. The PO can say whether §7 should state it.
- **boards:215, the `showAttachedChildren` toggle:** the previous run listed it here. The wiki now has it under Open questions ("A board's show-attached-children setting"), so it derives no case until that's settled.

## Candidate New Cases

Not added. Each is for its owner to decide.

1. **A column edit can change `displayMode` and the column's own name, and leaves what it doesn't name.** *A Product Owner gap: the wiki doesn't state it.*
   - columns:226, "updates displayMode only when explicitly set, and sets/clears the name override", switches a column to `expanded` with an edit, keeps `expanded` across a name-only edit, sets a name, clears it to `null`, and switches back to `merged`.
   - Wiki §4 states only the create's default ("`merged` unless the create asks for `expanded`") and that a column with no name of its own is named for what it covers. It says nothing of an edit changing either, though the column editor offers both.
   - If the PO states it, one Test Planner clause follows from §4 as it stands: a column whose name is cleared is named for what it covers again. No test asserts the name after a clear. columns:226 checks only the stored `name`, and BCU-3.1's test (columns:180–184) clears a name only to check the 400's message.

---

## Totals

**Status changes in this run:**
- **`Open` → `Automated`:** BCU-1.5 (P1).
- **`Automated` → `Open`:** none.
- **Unchanged `Open`:** BCU-2.9 (P2), no test.

**boards-columns-unsorted after this run: 33 cases.**

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 3 | 21 | 8 | 32 |
| Open | 0 | 0 | 1 | 1 |
| Manual | 0 | 0 | 0 | 0 |
| Pending PO | 0 | 0 | 0 | 0 |
| Planned | 0 | 0 | 0 | 0 |
| **Total** | **3** | **21** | **9** | **33** |

| Suite | Cases | Automated | Open |
|---|---|---|---|
| BCU-1 | 6 | 6 | 0 |
| BCU-2 | 9 | 8 | 1 (BCU-2.9) |
| BCU-3 | 6 | 6 | 0 |
| BCU-4 | 7 | 7 | 0 |
| BCU-5 | 5 | 5 | 0 |

Before this run: 31 `Automated` (3 P0, 20 P1, 8 P2) and 2 `Open` (BCU-1.5, P1; BCU-2.9, P2). The P0 cases are BCU-1.4, 2.1 and 3.2.

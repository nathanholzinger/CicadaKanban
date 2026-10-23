# BCU-2 — A column and its range

**Next ID:** BCU-2.10

**The setup,** for the cases that name it: workflow `WF` with non-terminal workphases `W1`, `W2`, `W3` and `W4`, in that order, and board `B` of `WF`, holding only the columns each case names. `V1` is a workphase of another workflow, `WF2`.

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-2.1 | A column covers the workphases from its start to its end, in the workflow's order | P0 | Automated |
| BCU-2.2 | A column with no name of its own is named for what it covers, and the name follows its workphases | P2 | Automated |
| BCU-2.3 | A column's display mode is `merged` unless its create asks for `expanded` | P2 | Automated |
| BCU-2.4 | A column can always be deleted, and the workphases it covered go to `uncovered` | P1 | Automated |
| BCU-2.5 | A column's start and end must be workphases of its board's workflow | P1 | Automated |
| BCU-2.6 | A column's start can't come after its end | P1 | Automated |
| BCU-2.7 | An edit whose range passes fixes a broken column | P2 | Automated |
| BCU-2.8 | A column whose start comes after its end still covers the workphases between its two ends | P2 | Automated |
| BCU-2.9 | A column with an end outside the workflow is broken, and covers no workphase | P2 | Open |

---

## BCU-2.1 — A column covers the workphases from its start to its end, in the workflow's order

**Priority:** P0 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §4

*Given* the setup, with column `A` on `B` from `W1` to `W3`, *when* `B` is read with `GET /api/boards/:id`, *then* `A`'s `startWorkphaseId` is `W1`, its `endWorkphaseId` is `W3`, and it covers `W1`, `W2` and `W3`, in that order. `W4` is in no column. *When* a column is created from `W4` to `W4`, *then* it covers `W4` alone.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.2 — A column with no name of its own is named for what it covers, and the name follows its workphases

**Priority:** P2 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §4

*Given* the setup, with `W1` named `Todo`, `W2` named `Doing`, `W3` named `Review` and `W4` named `Ship`, *when* column `A` is created on `B` covering `W1` alone, with no name, *then* `B` returns its name as `Todo`. *When* column `C` is created from `W2` to `W3` with no name, *then* its name is `Doing` and `Review` joined by a dash, in that order. The spacing around the dash isn't part of the rule.
- *When* `W1` is renamed `Backlog`, *then* `A`'s name is `Backlog`, with no column written.
- *When* `W3` is renamed `QA`, *then* `C`'s name is `Doing` and `QA` joined by a dash.
- *When* `C` is edited to run from `W2` to `W4`, still with no name, *then* its name is `Doing` and `Ship` joined by a dash.
- *Starting again from the setup, given* a column on `B` covering `W4` alone, created with the name `Mine`, *when* `W4` is renamed, *then* its name is still `Mine`.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.3 — A column's display mode is `merged` unless its create asks for `expanded`

**Priority:** P2 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §4

*Given* the setup, *when* a column is created on `B` covering `W1` alone, naming no `displayMode`, *then* its `displayMode` is `merged`. *When* a column covering `W2` alone is created asking for `expanded`, *then* its `displayMode` is `expanded`.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.4 — A column can always be deleted, and the workphases it covered go to `uncovered`

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §4, wiki boards-columns-unsorted §10

*Given* the setup, with columns `A` from `W1` to `W2` and `C` from `W3` to `W4` on `B`, *when* `A` is deleted, *then* it's accepted, and `B`'s `unsorted.uncovered` lists `W1` and `W2`. *When* `C` is deleted too, *then* it's accepted, `B` has no columns, and `uncovered` lists `W1`, `W2`, `W3` and `W4`. That no item changes is [BCU-1.4](bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.5 — A column's start and end must be workphases of its board's workflow

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §5

*Given* the setup, *when* a column is created on `B` from `W1` to `V1`, or from `V1` to `W2`, or from an id that's no workphase at all to `W2`, *then* each is refused with a 400, and `B`'s columns are unchanged. *Given* column `A` on `B` from `W1` to `W2`, *when* `A` is edited to end at `V1`, *then* it's refused with a 400, and `A` still runs from `W1` to `W2`.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.6 — A column's start can't come after its end

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §5

*Given* the setup, *when* a column is created on `B` from `W3` to `W1`, *then* it's refused with a 400, and `B`'s columns are unchanged. *Given* column `A` on `B` from `W1` to `W2`, *when* `A` is edited to run from `W2` to `W1`, *then* it's refused with a 400, and `A` still runs from `W1` to `W2`. *When* a column is created from `W3` to `W3`, *then* it's accepted: a start that is its end doesn't come after it.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.7 — An edit whose range passes fixes a broken column

**Priority:** P2 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §5, wiki boards-columns-unsorted §9

*Given* the setup, with column `A` on `B` from `W1` to `W3`, made `broken` by reordering `WF`'s workphases to `W3, W2, W1, W4` ([BCU-4.6](bcu-4-workphase-writes-and-columns.md)), *when* `A` is edited to run from `W3` to `W1`, which is in order now, *then* it's accepted, and `A` isn't `broken`. *When* instead `A` is edited to run from `W1` to `W3`, the range it already has, *then* it's refused with a 400, since its start comes after its end ([BCU-2.6](bcu-2-a-column-and-its-range.md)).

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.8 — A column whose start comes after its end still covers the workphases between its two ends

**Priority:** P2 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §9

*Given* the setup, with column `A` on `B` from `W1` to `W3`, column `C` covering `W4` alone, and an item in each of `W1`, `W2` and `W3`, *when* `WF`'s workphases are reordered to `W3, W2, W1, W4`, so `A` is `broken` ([BCU-4.6](bcu-4-workphase-writes-and-columns.md)), *then* `A` still covers `W3`, `W2` and `W1`, in that order, and still shows the three items. None of the three workphases is in `unsorted.uncovered`.

**Automation test:** `server/tests/routes/columns.test.ts`

## BCU-2.9 — A column with an end outside the workflow is broken, and covers no workphase

**Priority:** P2 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §9, wiki boards-columns-unsorted §4, wiki boards-columns-unsorted §10

*Given* the setup, with column `A` on `B` from `W1` to `W3` and no name of its own, column `C` covering `W4` alone, and an item in each of `W1`, `W2` and `W3`, *when* a direct database edit makes one of these changes to `A`:
- its end is `V1`;
- its start is `V1`;
- its end is an id that names no workphase;

*then*, each time, `B`'s read flags `A` `broken`, `A` covers no workphase, shows none of the three items, and is named "(empty range)". `unsorted.uncovered` lists `W1`, `W2` and `W3`, and not `W4`. `C` isn't `broken`. *When* `A`, with its end at `V1`, is then edited to run from `W1` to `W3`, *then* it's accepted, `A` isn't `broken`, it covers `W1`, `W2` and `W3` again with their items, and `uncovered` is empty. That a broken column takes no drop is [DRAG-1.9](../board-drag-interaction/drag-1-contexts-and-popping.md)'s and [DRAG-2.8](../board-drag-interaction/drag-2-target-classification.md)'s.

**Automation test:** —

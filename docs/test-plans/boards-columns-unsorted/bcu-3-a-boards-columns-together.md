# BCU-3 — A board's columns together

**Next ID:** BCU-3.7

**The setup,** for the cases that name it: workflow `WF` with non-terminal workphases `W1`, `W2` and `W3` and terminal workphases `D1` and `D2`, in that order, and board `B` of `WF`, holding only the columns each case names.

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-3.1 | A column write can't make two columns on a board cover the same workphase | P1 | Open |
| BCU-3.4 | A terminal-flag change that would leave a column covering both terminal and non-terminal workphases is refused | P1 | Open |
| BCU-3.5 | A board's column order is its own, and changes no column's coverage | P1 | Open |
| BCU-3.6 | Dragging a column reorders the board's columns | P1 | Open |

---

## BCU-3.1 — A column write can't make two columns on a board cover the same workphase

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §6

*Given* the setup, with column `A`, named `Early`, on `B` from `W1` to `W2`, *when* a column is created on `B` from `W2` to `W3`, *then* it's refused with a 400, and `B`'s columns are unchanged. The response's `conflictingColumnId` is `A`'s id, and its message quotes `Early`. *Given* also column `C` on `B` covering `W3` alone, *when* `C` is edited to run from `W2` to `W3`, *then* it's refused the same way, naming `A`, and `C` still covers `W3` alone. *And given* `A` has no name of its own, *then* the message quotes `A`'s id instead. *When* a column from `W1` to `W2` is created on another board of `WF`, *then* it's accepted: the rule holds within one board.

**Automation test:** —

## BCU-3.4 — A terminal-flag change that would leave a column covering both terminal and non-terminal workphases is refused

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §6

*Given* the setup, with column `A`, named `Early`, on `B` from `W1` to `W2`, and Free items in `W2`, *when* `W2` is made terminal, *then* it's refused with a 400, and nothing changes: `W2` is still non-terminal, and its items keep their positions and their `null` `completedAt`. The response's `conflictingColumnId` is `A`'s id, and its message quotes `Early`. *And given* board `B2` of `WF` also has a column, `A2`, from `W2` to `W3`, *then* the change is refused the same way, naming one of `A` and `A2`. *And given* `W2` is covered by no column, or only by a column covering `W2` alone, *when* it's made terminal, *then* the change is accepted. The same rule for a column write is [TC-6.7](../item-positioning/part-6-active-done-split.md)'s and [TC-6.8](../item-positioning/part-6-active-done-split.md)'s.

**Automation test:** —

## BCU-3.5 — A board's column order is its own, and changes no column's coverage

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §7

*Given* the setup, with columns `A` covering `W1`, `C` covering `W2` and `E` covering `W3` on `B`, in that order, and board `B2` of `WF`, whose columns cover `W1`, `W2` and `W3`, in that order, *when* `B`'s columns are reordered to `E`, `A`, `C` with `PATCH /api/columns/reorder`, *then* it's accepted, and `B` returns its columns as `E`, `A`, `C`, each still covering the same workphase, so `B` shows `W3` before `W1` and `W2`. `B2`'s columns are still in their order, and `WF`'s workphases are still `W1, W2, W3, D1, D2`. That no item changes is [BCU-1.4](bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** —

## BCU-3.6 — Dragging a column reorders the board's columns

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §7

*Given* a board showing columns `A`, `C` and `E`, in that order, each holding items, *when* column `E` is dragged to before `A` and released, *then* the board shows `E`, `A`, `C`, and still does after a reload. Each column shows the same items as before.

**Automation test:** —

# BCU-4 — What a workphase write does to columns

**Next ID:** BCU-4.8

**The setup,** for the cases that name it: workflow `WF` with non-terminal workphases `W1`, `W2`, `W3` and `W4`, in that order, and a board of `WF` with two columns: `A`, from `W1` to `W3`, and `B`, covering `W4` alone.

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-4.1 | A new workphase goes last, and no column covers it until one is given it | P1 | Open |
| BCU-4.2 | A workphase delete shrinks each column covering it, and deletes a column it was the only workphase of | P1 | Open |
| BCU-4.3 | A workphase delete that leaves every column's ends in place changes no column | P2 | Open |
| BCU-4.4 | A deleted workphase's items lose it, and show in Unsorted | P1 | Open |
| BCU-4.5 | After a workphase reorder, what each column covers follows the new order | P1 | Open |
| BCU-4.6 | A reorder that puts a column's start after its end leaves it broken, worked out on every read | P1 | Open |
| BCU-4.7 | A workphase reorder isn't checked against a board's columns | P2 | Open |

---

## BCU-4.1 — A new workphase goes last, and no column covers it until one is given it

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8

*Given* the setup, *when* workphase `W5` is created in `WF`, *then* it's last in `WF`'s order, after `W4`. `A` and `B` cover what they did before, and the board's `unsorted.uncovered` lists `W5`. *When* `B` is then edited to run from `W4` to `W5`, *then* `B` covers `W4` and `W5`, and `uncovered` is empty.

**Automation test:** —

## BCU-4.2 — A workphase delete shrinks each column covering it, and deletes a column it was the only workphase of

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8

*Given* the setup, *when* `W1` is deleted, *then* `A` runs from `W2` to `W3`, and the response lists `A` among the columns shrunk and no column among those deleted. *Starting again from the setup, when* `W3` is deleted, *then* `A` runs from `W1` to `W2`, and the response lists `A` among the columns shrunk. *Starting again, when* `W4` is deleted, *then* `B` no longer exists, and the response lists `B` among the columns deleted.

**Automation test:** —

## BCU-4.3 — A workphase delete that leaves every column's ends in place changes no column

**Priority:** P2 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8

*Given* the setup, *when* `W2` is deleted, *then* the response is a 204, and no column changes: `A` still runs from `W1` to `W3`, and now covers `W1` and `W3`.

**Automation test:** —

## BCU-4.4 — A deleted workphase's items lose it, and show in Unsorted

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8, wiki boards-columns-unsorted §10

*Given* the setup, with Free items `X1` and `X2` in `W4`, *when* `W4` is deleted, *then* `X1`'s and `X2`'s `workphaseId` is `null`, and the board's `unsorted.invalidItems` lists both.

**Automation test:** —

## BCU-4.5 — After a workphase reorder, what each column covers follows the new order

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8, wiki boards-columns-unsorted §4

*Given* the setup, *when* `WF`'s workphases are reordered to `W2, W1, W3, W4`, *then* it's accepted. `A` still runs from `W1` to `W3`, and now covers `W1` and `W3`, and the board's `unsorted.uncovered` lists `W2`. *Starting again from the setup, with `A` edited to run from `W1` to `W2`, so `W3` is in `uncovered`, when* the workphases are reordered to `W1, W3, W2, W4`, *then* `A` covers `W1`, `W3` and `W2`, in that order, and `uncovered` is empty. No column is written by either reorder.

**Automation test:** —

## BCU-4.6 — A reorder that puts a column's start after its end leaves it broken, worked out on every read

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8, wiki boards-columns-unsorted §9

*Given* the setup, *when* `WF`'s workphases are reordered to `W3, W2, W1, W4`, *then* it's accepted, and `A`, whose start `W1` now comes after its end `W3`, is `broken`. `B` isn't. *When* they're reordered back to `W1, W2, W3, W4`, *then* `A` isn't `broken`, though no column was written.

**Automation test:** —

## BCU-4.7 — A workphase reorder isn't checked against a board's columns

**Priority:** P2 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §8, wiki boards-columns-unsorted §6

*Given* workflow `WF` with non-terminal workphases `W1`, `W2`, `W3` and `W4`, and terminal workphase `D1`, in that order, and a board of `WF` with columns `A`, from `W1` to `W2`, and `C`, from `W3` to `W4`, *when* the workphases are reordered to `W1, W3, W2, W4, D1`, *then* it's accepted, and `A` and `C` both cover `W3` and `W2`. *Starting again, when* they're reordered to `W1, D1, W2, W3, W4`, *then* it's accepted, and `A` covers `W1`, `D1` and `W2`, terminal and non-terminal workphases both. What the board shows in either state isn't asserted.

**Automation test:** —

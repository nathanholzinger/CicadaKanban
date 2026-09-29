# TC-6 — Active/done split

**Next ID:** TC-6.14

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-6.1 | `completedAt` is set when a Free item enters a terminal workphase | P0 | Automated |
| TC-6.2 | `completedAt` is cleared when a done item is reopened | P0 | Automated |
| TC-6.3 | A done Free item has no stored position | P0 | Automated |
| TC-6.4 | Done items are ordered by completion, the newest last | P0 | Automated |
| TC-6.5 | Attached children keep their positions under a terminal cascade | P0 | Automated |
| TC-6.6 | `positionScope` stays `"attached-siblings"` under a terminal cascade | P0 | Automated |
| TC-6.7 | A column range can't mix terminal and non-terminal workphases | P0 | Automated |
| TC-6.8 | A range that's all terminal, or all non-terminal, is accepted | P1 | Automated |
| TC-6.9 | A reopened done item takes the append fallback | P1 | Automated |
| TC-6.10 | Two done items completed at the same moment | P2 | Pending PO |
| TC-6.11 | Changing a workphase's terminal flag applies the split to the items already in it | P1 | Open |
| TC-6.12 | A terminal-flag change that would leave a column mixing terminal and non-terminal workphases is rejected | P1 | Open |
| TC-6.13 | Several Free items made done, or reopened, by one flag change | P2 | Pending PO |

---

## TC-6.1 — `completedAt` is set when a Free item enters a terminal workphase

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* a Free item, *when* it is created in a terminal workphase, or moves to one from a non-terminal workphase, *then* its `completedAt` is set to the time of that write.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.2 — `completedAt` is cleared when a done item is reopened

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* a done Free item with `completedAt` set, *when* it moves to a non-terminal workphase, *then* its `completedAt` is `null`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.3 — A done Free item has no stored position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* an item, *when* it becomes a Free item in a terminal workphase, whether it's created there, moved there or detached there, *then* its `position` is `null`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.4 — Done items are ordered by completion, the newest last

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6, wiki board-drag-interaction §10

*Given* done Free items `D1`, `D2` and `D3`, created in that order but completed in the order `D2`, `D3`, `D1`, *when* their done list is sorted, *then* it reads `D2, D3, D1`: by `completedAt`, oldest first. Neither position nor creation time plays a part.

**Automation test:** `tests/ui/item-positioning.spec.ts`

## TC-6.5 — Attached children keep their positions under a terminal cascade

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* attached child `X` of `P` at position `p`, *when* `P` moves to a terminal workphase and the move cascades to `X`, *then* `X.position` is still `p`, and `X.completedAt` stays `null`. Only a Free item loses its position on entering a terminal workphase.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.6 — `positionScope` stays `"attached-siblings"` under a terminal cascade

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6, wiki item-positioning §2

*Given* attached child `X` of `P`, *when* `P` moves to a terminal workphase and the move cascades to `X`, *then* `X`'s `positionScope` is still `"attached-siblings"`, not `"none"`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.7 — A column range can't mix terminal and non-terminal workphases

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* a board, *when* a column is created, or an existing one edited, with a range that covers both a terminal and a non-terminal workphase, *then* the request is rejected, and nothing about the columns changes.

**Automation test:** `server/tests/routes/columns.test.ts`

## TC-6.8 — A range that's all terminal, or all non-terminal, is accepted

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §6

*Given* a board, *when* a column is created with a range covering only terminal workphases, or only non-terminal ones, *then* it is accepted.

**Automation test:** `server/tests/routes/columns.test.ts`

## TC-6.9 — A reopened done item takes the append fallback

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2, wiki item-positioning §6

*Given* a done Free item with no position, in a workflow whose true last Free item is at `6.0`, *when* it moves to a non-terminal workphase with no anchor, *then* its position is `7`, by the append fallback. No earlier position comes back.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-6.10 — Two done items completed at the same moment

**Priority:** P2 · **Status:** Pending PO

*Given* done Free items `D1` and `D2` with the same `completedAt`, `D1` created first, *when* their done list is sorted, *then* — **question for the PO:** wiki item-positioning §6 orders a done list by `completedAt`, and wiki item-positioning §5a's tie-break (`position`, then `createdAt`) is for a sort by position. What decides a tie in `completedAt`? The client puts the one created first ahead today.

**Automation test:** —

## TC-6.11 — Changing a workphase's terminal flag applies the split to the items already in it

**Priority:** P1 · **Status:** Open · **Rule:** wiki item-positioning §6

*Given* non-terminal workphase `W` holding Free item `X` at `4.0`, with attached child `S` at `1.0`, in a workflow whose true last Free item outside `W` is at `6.0`, *when* `W` is made terminal, *then* `X`'s `completedAt` is set to the time of that write, and its `position` is `null`, as if it had moved into a terminal workphase ([TC-6.1](part-6-active-done-split.md), [TC-6.3](part-6-active-done-split.md)). `S` keeps `1.0`, and its `completedAt` stays `null` ([TC-6.5](part-6-active-done-split.md)). *And when* `W` is made non-terminal again, *then* `X`'s `completedAt` is `null`, and its position is `7`, by the append fallback: `4.0` doesn't come back ([TC-6.9](part-6-active-done-split.md)). `S` still has `1.0`.

**Automation test:** —

## TC-6.12 — A terminal-flag change that would leave a column mixing terminal and non-terminal workphases is rejected

**Priority:** P1 · **Status:** Open · **Rule:** wiki item-positioning §6

*Given* a board with a column covering non-terminal workphases `W1` and `W2`, *when* `W2` is made terminal, *then* the request is rejected, and nothing changes: `W2` is still non-terminal, and its items keep their positions and their `null` `completedAt`. *And given* `W2` is covered by no column, or only by a column whose range is `W2` alone, *when* it is made terminal, *then* the change is accepted. The same rule for a column write is [TC-6.7](part-6-active-done-split.md)'s and [TC-6.8](part-6-active-done-split.md)'s.

**Automation test:** —

## TC-6.13 — Several Free items made done, or reopened, by one flag change

**Priority:** P2 · **Status:** Pending PO

*Given* workphase `W` holding Free items `X1` (`1.0`) and `X2` (`2.0`), *when* `W` is made terminal and later non-terminal again ([TC-6.11](part-6-active-done-split.md)), *then* — **question for the PO:** wiki item-positioning §6 sets each item's `completedAt` at the time of the write, so the two tie ([TC-6.10](part-6-active-done-split.md)). On the way back, wiki item-positioning §2 gives each one a fresh position by the append fallback, but doesn't say in which order. Does the done list keep `X1` ahead of `X2`, and does reopening them restore that order? The server keeps the order both ways today.

**Automation test:** —

# BCU-1 — Boards and what they show

**Next ID:** BCU-1.7

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-1.1 | A new board starts with one column per workphase, in the workflow's order | P1 | Open |
| BCU-1.2 | A workflow's last board can't be deleted | P1 | Open |
| BCU-1.3 | Deleting a board that isn't its workflow's last deletes its columns | P1 | Open |
| BCU-1.4 | No board or column write changes an item | P0 | Open |
| BCU-1.5 | A board shows the items of every project that uses its workflow, its own or inherited | P1 | Open |
| BCU-1.6 | A project that comes to use another workflow takes its items to that workflow's boards | P1 | Open |

---

## BCU-1.1 — A new board starts with one column per workphase, in the workflow's order

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §1

*Given* a newly created workflow whose workphases are `W1`, `W2` and `W3`, in that order, *when* its boards are read, *then* it has a board whose columns are three, in this order: one covering `W1` alone, one covering `W2` alone, and one covering `W3` alone. *When* a second board is created for it with `POST /api/boards`, *then* the new board's columns are the same three, in the same order.

**Automation test:** —

## BCU-1.2 — A workflow's last board can't be deleted

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §1

*Given* workflow `WF` with one board, `B`, *when* `B` is deleted with `DELETE /api/boards/:id`, *then* it's refused with a 409, and nothing changes: `B` and its columns are still returned by `GET /api/boards/:id`. *When* a second board, `B2`, is created and `B` is deleted, *then* the delete is accepted. *When* `B2`, now the last, is deleted, *then* it's refused with a 409.

**Automation test:** —

## BCU-1.3 — Deleting a board that isn't its workflow's last deletes its columns

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §1

*Given* workflow `WF` with boards `B1` and `B2`, `B2` with columns `C1` and `C2`, *when* `B2` is deleted, *then* it's accepted: `GET /api/boards/:id` for `B2` is a 404, neither `C1` nor `C2` exists any more, and `B1` and its columns are unchanged. That no item changes is [BCU-1.4](bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** —

## BCU-1.4 — No board or column write changes an item

**Priority:** P0 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §2

*Given* board `B` of workflow `WF`, a second board of `WF`, and items in each of `WF`'s workphases, some Free and some Attached, *when* each of these writes is made in turn:
- a board created;
- `B` renamed;
- a column created;
- a column's range edited;
- `B`'s columns reordered;
- a column deleted;
- the second board deleted;

*then* after each one, every item's row is unchanged, its `workphaseId`, `position` and `updatedAt` included.

**Automation test:** —

## BCU-1.5 — A board shows the items of every project that uses its workflow, its own or inherited

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §3

*Given* these projects, each holding one item in a workphase of the workflow it uses:
- `A`, on workflow `WF`, holding `a`;
- `B`, `A`'s child, with no workflow of its own, holding `b`;
- `C`, `B`'s child, with none either, holding `c`;
- `D`, `A`'s child, on workflow `WF2`, holding `d`;
- `E`, `D`'s child, with no workflow of its own, holding `e`;
- `Z`, top-level, on `WF2`, holding `z`;

*when* a board of `WF` is read, *then* its items are `a`, `b` and `c`, and not `d`, `e` or `z`: `D` uses its own workflow, and `E` uses `D`'s, its nearest ancestor that has one. *When* a board of `WF2` is read, *then* its items are `d`, `e` and `z`. *And given* `A` also holds `a0`, with no workphase, *then* `WF`'s board returns `a0` too ([BCU-5.2](bcu-5-unsorted.md)).

**Automation test:** —

## BCU-1.6 — A project that comes to use another workflow takes its items to that workflow's boards

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §3

*Given* project `P1`, with no workflow of its own, under project `Q1` on workflow `WF1`; Free item `X` in `P1`, at workphase `w1` of `WF1`; and project `Q2` on workflow `WF2`, *when* `P1` is moved under `Q2`, *then* a board of `WF1` no longer returns `X`, and a board of `WF2` does, with `X` still holding `w1`. That `X` is in Unsorted there is [TC-7.20](../item-positioning/part-7-board-placement-intents.md)'s and [BCU-5.2](bcu-5-unsorted.md)'s.

**Automation test:** —

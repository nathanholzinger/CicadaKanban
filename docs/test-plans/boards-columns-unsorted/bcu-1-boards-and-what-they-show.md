# BCU-1 — Boards and what they show

**Next ID:** BCU-1.11

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-1.1 | A new board starts with one column per workphase, in the workflow's order | P1 | Automated |
| BCU-1.2 | A workflow's last board can't be deleted | P1 | Automated |
| BCU-1.3 | Deleting a board that isn't its workflow's last deletes its columns | P1 | Automated |
| BCU-1.4 | No board or column write changes an item | P0 | Automated |
| BCU-1.5 | A board shows the items of every project that uses its workflow, its own or inherited | P1 | Automated |
| BCU-1.6 | A project that comes to use another workflow takes its items to that workflow's boards | P1 | Automated |
| BCU-1.7 | A late load for another board cannot replace the selected board or complete its loading or cue | P0 | Automated |
| BCU-1.8 | A shared change begun on another board refreshes the board currently selected | P1 | Automated |
| BCU-1.9 | A failed switch cannot show the previous board under the selected board's name or controls | P0 | Open |
| BCU-1.10 | A board read cannot undo a write whose answer was applied while it ran | P0 | Planned |

---

## BCU-1.1 — A new board starts with one column per workphase, in the workflow's order

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §1

*Given* a newly created workflow whose workphases are `W1`, `W2` and `W3`, in that order, *when* its boards are read, *then* it has a board whose columns are three, in this order: one covering `W1` alone, one covering `W2` alone, and one covering `W3` alone. *When* a second board is created for it with `POST /api/boards`, *then* the new board's columns are the same three, in the same order.

**Automation test:** `server/tests/routes/boards.test.ts`

## BCU-1.2 — A workflow's last board can't be deleted

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §1

*Given* workflow `WF` with one board, `B`, *when* `B` is deleted with `DELETE /api/boards/:id`, *then* it's refused with a 409, and nothing changes: `B` and its columns are still returned by `GET /api/boards/:id`. *When* a second board, `B2`, is created and `B` is deleted, *then* the delete is accepted. *When* `B2`, now the last, is deleted, *then* it's refused with a 409.

**Automation test:** `server/tests/routes/boards.test.ts`

## BCU-1.3 — Deleting a board that isn't its workflow's last deletes its columns

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §1

*Given* workflow `WF` with boards `B1` and `B2`, `B2` with columns `C1` and `C2`, *when* `B2` is deleted, *then* it's accepted: `GET /api/boards/:id` for `B2` is a 404, neither `C1` nor `C2` exists any more, and `B1` and its columns are unchanged. That no item changes is [BCU-1.4](bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** `server/tests/routes/boards.test.ts`

## BCU-1.4 — No board or column write changes an item

**Priority:** P0 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §2

*Given* board `B` of workflow `WF`, a second board of `WF`, and items in each of `WF`'s workphases, some Free and some Attached, *when* each of these writes is made in turn:
- a board created;
- `B` renamed;
- a column created;
- a column's range edited;
- `B`'s columns reordered;
- a column deleted;
- the second board deleted;

*then* after each one, every item's row is unchanged, its `workphaseId`, `position` and `updatedAt` included.

**Automation test:** `server/tests/routes/boards.test.ts`

## BCU-1.5 — A board shows the items of every project that uses its workflow, its own or inherited

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §3, wiki project-tree §10

*Given* these projects, each holding one item in a workphase of the workflow it uses:
- `A`, on workflow `WF`, holding `a`;
- `B`, `A`'s child, with no workflow of its own, holding `b`;
- `C`, `B`'s child, with none either, holding `c`;
- `D`, `A`'s child, on workflow `WF2`, holding `d`;
- `E`, `D`'s child, with no workflow of its own, holding `e`;
- `Z`, top-level, on a workflow of its own, `WZ`, holding `z`;

*when* a board of `WF` is read, *then* its items are `a`, `b` and `c`, and not `d`, `e` or `z`: `D` uses its own workflow, and `E` uses `D`'s, its nearest ancestor that has one. *When* a board of `WF2` is read, *then* its items are `d` and `e`, and not `z`: `Z` uses only its own. *And given* `A` also holds `a0`, with no workphase, *then* `WF`'s board returns `a0` too ([BCU-5.2](bcu-5-unsorted.md)).

**Automation test:** `server/tests/routes/boards.test.ts`, `tests/ui/workflow-inheritance.spec.ts`

## BCU-1.6 — A project that comes to use another workflow takes its items to that workflow's boards

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §3, wiki project-tree §10

*Given* project `P1`, with no workflow of its own, under project `Q1` on workflow `WF1`; Free item `X` in `P1`, at workphase `w1` of `WF1`; and project `Q2` on workflow `WF2`, *when* `P1` is moved under `Q2`, *then* a board of `WF1` no longer returns `X`, and a board of `WF2` does, with `X` still holding `w1`. That `X` is in Unsorted there is [TC-7.20](../item-positioning/part-7-board-placement-intents.md)'s and [BCU-5.2](bcu-5-unsorted.md)'s.

**Automation test:** `server/tests/routes/boards.test.ts`

## BCU-1.7 — A late load for another board cannot replace the selected board or complete its loading or cue

**Priority:** P0 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §3, wiki board-drag-interaction §10

*Given* workflow `WF` with workphases `W1, W2`, board `A` with column `CA` covering both, and board `B` with separate columns `CB1` for `W1` and `CB2` for `W2`, with items `X1` in `W1` and `X2` in `W2`, *when* a load for selected `A` is held, the user selects `B`, `B` loads, and the held `A` answer then arrives, *then* `B` stays selected and shows `CB1` with `X1` and `CB2` with `X2`. No `CA` replaces those columns, and no answer for `A` supplies the displayed board under `B`'s name or controls.

*Given* `A`'s held snapshot has `X1` named `Old`, and a successful rename between the two reads means `B` loads `X1` named `Current`, *then* `X1` stays `Current` when `A`'s answer lands. The selected board's items, as well as its columns, are preserved.

*Given* the same selection change with `B`'s own load still unanswered, *when* `A`'s answer arrives, *then* `B` stays loading; `A`'s data is not shown as its loaded result.

*Given* instead `B` has loaded while `A`'s old answer is still held, then a forced stop on `B` starts its own reload with a cue waiting for that reload, *when* `A`'s answer arrives before `B`'s reload, *then* `B` stays loading and its cue keeps waiting. `A`'s completion does not start the stopped item's flash window. `B`'s own successful reload draws `B` and allows its cue to proceed. The cue's subsequent lifetime is [DRAG-6.27](../board-drag-interaction/drag-6-preview-reconciliation.md)'s.

**Automation test:** `client/src/components/workflow/useBoardLoad.test.ts`

## BCU-1.8 — A shared change begun on another board refreshes the board currently selected

**Priority:** P1 · **Status:** Automated · **Rule:** wiki boards-columns-unsorted §1, wiki boards-columns-unsorted §3, wiki boards-columns-unsorted §4

*Given* `A` and `B` of the same workflow, laid out as in [BCU-1.7](bcu-1-boards-and-what-they-show.md), with `W1` named `Ready` and `CB1` using its workphase's name, *when* a rename of `W1` to `Doing` begins while `A` is selected, the user selects `B` and lets it load, and the rename then succeeds, *then* the selected board is read again as `B`. It still shows `CB1` with `X1` and `CB2` with `X2`, and `CB1` now shows `Doing`. `CA` never replaces `B`'s columns, and selection never returns to `A`.

This holds even though the successful write's follow-up load starts after the selection change: starting later does not make `A` the selected board. If `B` is still loading when the rename succeeds, the completed view is likewise `B` with the shared new workphase name.

**Automation test:** `client/src/components/workflow/useBoardLoad.test.ts`

## BCU-1.9 — A failed switch cannot show the previous board under the selected board's name or controls

**Priority:** P0 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §3

*Given* workflow `WF` with workphases `W1, W2`, selected and loaded board `A` with column `CA` covering both, and board `B` with separate columns `CB1` for `W1` and `CB2` for `W2`, *when* the user selects `B` and `B`'s load fails, *then* `B` stays selected and its loading ends, with no board drawn. `CA` is absent, and no column of `A` is shown or available to manage under `B`'s name or controls. The failure does not restore selection to `A`. No particular error message or no-board wording is prescribed.

**Automation test:** —

## BCU-1.10 — A board read cannot undo a write whose answer was applied while it ran

**Priority:** P0 · **Status:** Planned · **Rule:** wiki boards-columns-unsorted §3, wiki board-drag-interaction §10

*Given* workflow `WF` with non-terminal workphases `W1, W2`, selected and loaded board `A` with column `CA` covering both, board `B` with separate columns `CB1` for `W1` and `CB2` for `W2`, and Free items `X` in `W1` and `Y` in `W2`, *when* a move of `X` to `W2` is sent from `A`, the user selects `B`, and `B`'s read captures `X` still in `W1` before the move is saved, with its answer held, *then*, once the successful move answer has been applied, `X` holds `workphaseId = W2` in the board's item state.

*When* the held `B` read then arrives, *then* its older snapshot applies nothing and cannot restore `X.workphaseId = W1` or show `X` in `CB1`. `B` stays selected and loading until a current read completes it. *When* that read arrives with `X` in `W2`, *then* loading ends and `B` shows empty `CB1` and `CB2` containing both `X` and `Y`, matching the saved workphases. `CA` never replaces `B`'s columns, and selection never returns to `A`.

*Given* instead `B` is already selected and loaded with the same initial items, *when* a reload captures `X` in `W1`, the successful move answer is applied with `X` in `W2`, and the held reload answer then arrives, *then* the same protection holds: the older snapshot applies nothing, `B` stays loading until its current read completes, and its completed view has empty `CB1` and `X` and `Y` in `CB2`. A same-board reload cannot undo the applied write any more than a board switch can.

*Given* that same-board reload belongs to a stopped item drag of `Y`, with its flash waiting for the board and `Y` visible in the final view, and no new drag or separate reload starts, *when* the older snapshot arrives after `X`'s move answer, *then* loading and the waiting flash are not completed by it. Reading again belongs to the same reload and does not cancel or start the flash window. *When* the current board finally draws, *then* `Y`'s flash window opens exactly once with its full configured length `F`; no part of `F` was spent waiting for either read. The window's subsequent lifetime is [DRAG-6.27](../board-drag-interaction/drag-6-preview-reconciliation.md)'s, and its painted pulses are [DRAG-6.30](../board-drag-interaction/drag-6-preview-reconciliation.md)'s.

**Automation test:** —

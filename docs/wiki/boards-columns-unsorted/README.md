# Boards, Columns & Unsorted

**Test suite:** [`../../test-plans/boards-columns-unsorted/`](../../test-plans/boards-columns-unsorted/)

**Related:** [`../board-drag-interaction/`](../board-drag-interaction/)
(dragging items on a board) · [`../item-positioning/`](../item-positioning/)
(how a column orders its items) · [`../project-tree/`](../project-tree/)
(the tree a project inherits its workflow through)

This page answers "what is a board, which items does it show, what does a
column cover, and where does an item go that no column covers." Its
numbered sections state what the API does. How the board presents it is a
working placeholder: how columns merge and subdivide, the column editor,
the Unsorted bucket's look and the inherited view are under Open
questions, and no test case is derived from them. A drop into a column is
[`../board-drag-interaction/`](../board-drag-interaction/)'s, and how a
column orders its items is
[`../item-positioning/`](../item-positioning/)'s.

---

## 1. A board is a view of one workflow

**A board belongs to one workflow, and every workflow has at least one
board.** A board is a named view of its workflow's workphases, laid out
as columns. A board made with its workflow, or by `POST /api/boards`,
starts with one column per workphase, in the workflow's order, so it's
usable at once.

**A workflow's last board can't be deleted.** `DELETE /api/boards/:id` on
it is refused with a 409, and nothing changes. Deleting any other board
deletes its columns, and no item changes (§2).

## 2. Items never reference a board or a column

**Boards and columns are a presentation layer over an item's
`workphaseId`.** No item stores a board or a column, so creating,
editing or deleting a board or a column never changes an item. MCP tools
work at the workphase level, and boards don't affect them.

## 3. What a board shows

**`GET /api/boards/:id` returns the items of every project that uses the
board's workflow.** A project uses its own workflow, or, when it has
none, that of its nearest ancestor in the project tree that has one
([`../project-tree/`](../project-tree/)). The items include those whose
workphase is none, or isn't one of the workflow's, which is how they
reach Unsorted (§10).

**A project that comes to use a different workflow brings its items with
it,** for example when it moves under an ancestor with another workflow.
The items show on the new workflow's boards, still holding workphases of
the old one, so they're in Unsorted. The old workflow's boards no longer
show them. What the move does to their positions isn't a rule yet
([`../item-positioning/`](../item-positioning/) §7.3).

What a project that inherits its workflow sees of its ancestor's board is
a placeholder (Open questions).

## 4. A column covers a range of workphases

**A column covers the workphases from its `startWorkphaseId` to its
`endWorkphaseId`, in the workflow's order.** Both are set in the `POST`
and `PUT /api/columns` request bodies, and returned on every column by
`GET /api/boards/:id`. What a column covers is worked out whenever the
board is read, from the workflow's current order, so adding or reordering
workphases never requires changing a column (§8). What a column covers
when its start comes after its end is §9's.

**A column with no name of its own is named for what it covers:** its
workphase's name when it covers one, or its first's and its last's
joined by a dash. The name is worked out whenever the board is read, like
what the column covers, so it follows a workphase rename or a change of
range. Its `displayMode` is `merged` unless the create asks for
`expanded`. What each mode looks like is a placeholder (Open questions).

**A column can always be deleted,** and no item changes. The workphases
it covered go to Unsorted's `uncovered`, unless another column on the
board covers them (§10). So a board can be left with no columns, and
every workphase of its workflow is then in `uncovered`.

## 5. A column's range is checked when it's written

**A column create or edit is refused with a 400, and nothing changes,**
when its start or its end isn't a workphase of the board's workflow, or
when its start comes after its end in the workflow's order. So no column
write makes a broken column (§9), and an edit whose range passes fixes
one.

## 6. A board's columns don't overlap or mix done and active

Two rules hold for the columns of one board:
- **No two columns cover the same workphase.** An item in that workphase
  would show in both.
- **No column covers both a terminal and a non-terminal workphase.**
  Active and done items are never compared in one sorted list, since
  done's ordering isn't position-based at all
  ([`../item-positioning/`](../item-positioning/) §6). So, short of a
  reorder (below), every column is either a done column, covering only
  terminal workphases, or an active one.

**A write that would break either rule is refused with a 400, and
nothing changes:**
- a column create or edit whose range would cover a workphase another
  column on the board covers. The response names that column: its
  `conflictingColumnId` is the column's id, and its message quotes the
  column's own name, or its id when it has none (§4);
- a column create or edit whose range would cover both terminal and
  non-terminal workphases;
- a change to a workphase's terminal flag that would leave a column
  covering both. The response names that column the same way, and names
  one of them when the change would leave several covering both. A
  change on a workphase no column covers, or one a column covers alone,
  is accepted.

**A workphase reorder isn't checked against columns** (§8), so it can
leave two columns overlapping, or a column covering both. What the board
shows then isn't a rule yet (Open questions). No other workphase write
can break either rule: a new workphase is covered by no column, and a
delete only takes coverage away (§8).

## 7. A board's column order is its own

**A board's columns are reordered by dragging a column,** and the order
belongs to that board alone. `PATCH /api/columns/reorder` takes any
order, so a board can show workphases out of their workflow's order. The
column order changes nothing about the workphases a column covers, which
follow the workflow's order (§4), or the items in them, which never
reference a column (§2). Whether a board should be allowed an order
other than its workflow's is open (Open questions).

## 8. What a workphase write does to columns

**A new workphase goes after every other one in its workflow, so no
column covers it.** It's in Unsorted's `uncovered` until a column's range
is extended, or a new column added, to cover it. It never joins an
existing column by itself.

**A workphase delete shrinks the columns covering it.** Each column
covering the workphase shrinks to what's left of its range, and a column
it was the only workphase of is deleted. The response lists the columns
shrunk and the columns deleted, and is a 204 when no column changed. The
workphase's items lose it, and show in Unsorted (§10).

Example: workphases `W1, W2, W3, W4`, column `A` covering `W1` to `W3`,
and column `B` covering `W4` alone.
- Deleting `W1` shrinks `A` to `W2` to `W3`.
- Deleting `W4` deletes `B`.
- Deleting `W2` changes no column: `A` still runs from `W1` to `W3`, and
  now covers `W1` and `W3`. The response is a 204.

**A workphase reorder is never checked against columns.** Coverage
follows the new order (§4): a workphase moved into a column's range joins
it, one moved out of every range goes to `uncovered`, and a column whose
start now comes after its end is broken (§9). A reorder can also leave
columns overlapping, or a column covering both terminal and non-terminal
workphases (§6).

**A change to a workphase's terminal flag is checked against columns**
(§6).

## 9. Broken columns

**A column whose start comes after its end in the workflow's order is
flagged `broken`.** Through the API, only a workphase reorder makes one
(§8), since a column write can't (§5). The flag is worked out on every
read of the board, never stored.

**A broken column still covers the workphases between its two ends,** so
none of them is in `uncovered` (§10). It keeps showing their items, but
takes no drop ([`../board-drag-interaction/`](../board-drag-interaction/)
§4) until an edit gives it a range that passes §5.

Example: column `A` runs from `W1` to `W3`, and the workphases are
reordered to `W3, W2, W1, W4`. `A` is broken, and still covers `W3`, `W2`
and `W1`. An edit to run from `W3` to `W1` fixes it.

## 10. Unsorted

**Unsorted is returned with every board by `GET /api/boards/:id`, as the
board's `unsorted`.** It's worked out on every read, not a column anyone
creates. It holds:
- **`uncovered`:** each of the workflow's workphases that no column on
  the board covers;
- **`invalidItems`:** each item the board shows (§3) whose `workphaseId`
  is missing, or isn't one of the workflow's;
- **`needsAttention`:** true when either list holds anything.

**Unsorted holds what the board can't place in a column, so nothing on a
board is lost from view.** The API refuses what isn't allowed, so most
of what lands here got past it: a direct database edit, or a cascade
whose handling isn't designed yet.
- An item with no workphase: created without one
  ([`../item-attachment/`](../item-attachment/) §14), or left without one
  when its workphase is deleted (§8).
- An item holding a workphase its project's workflow doesn't use, after
  its project comes to use a different workflow (§3), or a direct
  database edit.
- A workphase no column covers: a new one (§8), or one left out by a
  column's delete or edit (§4), or by a reorder (§8).

**An Attached item shows with its parent, whatever its own `workphaseId`
says** ([`../item-attachment/`](../item-attachment/) §2a), and that rule
comes first. `invalidItems` lists an Attached item whose own workphase is
missing or isn't the workflow's, and `needsAttention` counts it, but the
board shows it inside its nearest Free ancestor's Card, never in Unsorted
by itself. It's in Unsorted only inside that ancestor's Card, when the
ancestor is.

**Unsorted is drag-source only.** A drag can start there, and nothing
drops into it ([`../board-drag-interaction/`](../board-drag-interaction/)
§3, §4).

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **How columns merge and subdivide (§4).** A column covering more than
  one workphase shows them `merged`, as one list, or `expanded`, as one
  sub-row per workphase. How each looks, and how columns merge and
  subdivide, is expected to be reworked. The drop rules in each mode
  ([`../board-drag-interaction/`](../board-drag-interaction/) §5) and a
  merged column's order
  ([`../item-positioning/`](../item-positioning/) §4) are rules today.
- **A board's column order (§7).** Whether a board may show workphases in
  an order other than its workflow's.
- **The column editor.** It offers ranges the API refuses (§6), one that
  overlaps another column or covers both terminal and non-terminal
  workphases, and then shows the API's 400. It does stop a range whose
  start comes after its end (§5). The 400 names a column with no name of
  its own by its id, which the board never shows (§4, §6).
- **A board out of step with its workflow (§6, §8).** A workphase reorder
  can leave columns overlapping, or a column covering both terminal and
  non-terminal workphases. Only a column whose start comes after its end
  is flagged (§9). How a board recognizes the rest, and what it shows
  then, is undecided.
- **The Unsorted bucket and its badges.** How the bucket, the "needs
  attention" badge and the "broken" badge look, and their tooltips. The
  badge is raised by anything in `unsorted` (§10), so it can show over a
  bucket that lists nothing: in an inherited view, for another project's
  item, or for an Attached item whose own workphase is missing. Its
  tooltip mentions only uncovered workphases.
- **The inherited view (§3).** A project that inherits its workflow sees
  its ancestor's board filtered to its own items, with board and
  workphase management hidden. It shows only the project's own items, not
  those of its descendants that inherit the same workflow, while the
  ancestor's board shows them all.
- **A board's show-attached-children setting:** whether Cards open with
  their attached children showing.
- **A project that uses no workflow,** its own or an ancestor's, has no
  board. An item created there with no workphase
  ([`../item-attachment/`](../item-attachment/) §14) shows nowhere.

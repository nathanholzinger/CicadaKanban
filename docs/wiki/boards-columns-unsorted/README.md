# Boards, Columns & Unsorted

**Related:** [`../board-drag-interaction/`](../board-drag-interaction/)
(dragging on a board) · [`../item-positioning/`](../item-positioning/)
(how a column orders its items)

This page answers "what is a board, what does a column cover, and where
does an item go that no column covers." It holds only the core rules so
far, not a full description of boards and columns.

- A board's column covers a range of workphases, from its
  `startWorkphaseId` to its `endWorkphaseId` (set in the `POST` and `PUT`
  `/api/columns` request bodies, and returned on every column by
  `GET /api/boards/:id`). The covered set is worked out whenever the board is
  read, from the workflow's current workphase order, so adding or
  reordering workphases never requires changing a column.
- **Unsorted** is returned with every board by `GET /api/boards/:id`, as
  the board's `unsorted`; it's derived, not a column anyone creates. It
  holds any workphase not covered by any column on that board (its
  `uncovered`), plus items with a missing or dangling `workphaseId` (its
  `invalidItems`). A new workphase always lands in Unsorted until a column's
  range is extended (or a new column added) to cover it — it never
  auto-joins an existing column.
- **Broken columns**: if an out-of-band workphase reorder inverts a
  column's start/end order, the column is flagged `broken` (worked out on
  every read, never stored) — it keeps showing its covered items but
  rejects new drops until its range is fixed.
- Every workflow always has at least one board, created 1:1 with its
  current workphases when the workflow is created. Creating an additional
  board also sets it up 1:1, so it's usable immediately.
- Items never reference a board or column directly — boards and columns
  are a pure presentation layer over an item's `workphaseId`. MCP tools
  operate at the workphase level and are unaffected by this layer.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

None open.

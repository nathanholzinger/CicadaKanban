#TODO: This page needs expanding. right now it's a quick capture of info pulled out of CLAUDE.md,
but it is not a full detailed explaination of what boards and columns are and how they work

- A board's column range is defined by `start_workphase_id`/`end_workphase_id` — the
  covered set is computed at read time from the workflow's current workphase *positions*
  (ranks), not stored. This means adding/reordering workphases never requires a column
  migration.
- **Unsorted** is a computed bucket (not a DB row) returned by `GET /api/boards/:id` —
  any workphase not covered by any column on that board, plus items with a null/dangling
  `workphase_id`. A new workphase always lands in Unsorted until a column's range is
  extended (or a new column added) to cover it — it never auto-joins an existing column.
- **Broken columns**: if an out-of-band workphase reorder inverts a column's start/end
  order, the column is flagged `broken` (derived every read, never stored) — it keeps
  showing its covered items but rejects new drops until its range is fixed.
- Every workflow always has at least one board (auto-bootstrapped 1:1 with its current
  workphases on workflow creation, and backfilled for pre-existing workflows via
  `runMigrations.ts`). Creating an additional board also bootstraps it 1:1 for immediate
  usability.
- Items never reference a board or column directly — boards/columns are a pure
  presentation layer over `items.workphase_id`. MCP tools operate at the workphase level
  and are unaffected by this layer.
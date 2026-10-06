# Test Plan — Boards, Columns & Unsorted

**Wiki page:** boards-columns-unsorted

**Suite IDs:** `BCU-1` … `BCU-5`. A case is written by its full ID, `<suite>.<n>` (e.g. `BCU-2.1`), in its own suite file as everywhere else.

| Suite | What it covers |
|---|---|
| [BCU-1 — Boards and what they show](bcu-1-boards-and-what-they-show.md) | A new board's columns, the last board, deleting a board, no board or column write changing an item, and the items of every project that uses the board's workflow |
| [BCU-2 — A column and its range](bcu-2-a-column-and-its-range.md) | What a column covers, its default name and display mode, deleting a column, the range checks on a column write, and a broken column: what it covers, and fixing it |
| [BCU-3 — A board's columns together](bcu-3-a-boards-columns-together.md) | No overlap, no column covering done and active, the terminal-flag change, and a board's own column order |
| [BCU-4 — What a workphase write does to columns](bcu-4-workphase-writes-and-columns.md) | A new workphase, a delete that shrinks or deletes columns, a reorder's coverage, broken columns, and the reorder going unchecked |
| [BCU-5 — Unsorted](bcu-5-unsorted.md) | `uncovered`, `invalidItems` and `needsAttention`, and an Attached item's place |

# Test Plan — Board Drag Interaction

**Wiki page:** board-drag-interaction

**Suite IDs:** `DRAG-1` … `DRAG-8`. A case is written by its full ID, `<suite>.<n>` (e.g. `DRAG-3.9`), in its own suite file as everywhere else.

| Suite | What it covers |
|---|---|
| [DRAG-1 — Contexts, the layer stack, and popping](drag-1-contexts-and-popping.md) | Where a drag starts, the three layers and their transition rules, placing by the ghost in a column, and popping out and in |
| [DRAG-2 — Target classification at drag start](drag-2-target-classification.md) | The three classification states, Full/Mid/Low target tiers, pending-tree assignment, and independent row strength |
| [DRAG-3 — Board-layer drop bands, and the dragged card's shape](drag-3-card-column-bands.md) | What a release at Board layer commits in each band, how the bands are carved, done and empty regions, shortCard and Stub-row copies, and the shared Stub-row height |
| [DRAG-4 — Card attach and hierarchy placement](drag-4-attach-and-stub-placement.md) | Zooming into a Card's Descendants, the starting gap, and placement by gap and depth, including an empty hierarchy |
| [DRAG-5 — Stub → out: detach](drag-5-detach-and-overflow.md) | Moving a Stub within its Card, detaching it, picking it up again, and reparenting it into another Card |
| [DRAG-6 — Optimistic preview, reconciliation, and failure](drag-6-preview-reconciliation.md) | What the board shows on release, reconciling responses, re-drags, failures, item and column drags stopped by a resync, the banner, and the stopped item's flash window |
| [DRAG-7 — Depth overflow and the hierarchy modal](drag-7-overflow-and-hierarchy-modal.md) | How many levels a Card's section shows, overflow rows and gaps, the modal's opening and closing, Sheets opened over it with navigation and edits, and a board reload |
| [DRAG-8 — The carried branch](drag-8-carried-branch.md) | Attached-branch pickup and lifetime, Free descendants, pending writes, layout and restoration, and the carried copy's count line |

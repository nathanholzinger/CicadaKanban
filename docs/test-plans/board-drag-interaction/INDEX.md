# Test Plan — Board Drag Interaction

**Wiki page:** board-drag-interaction

**Suite IDs:** `DRAG-1` … `DRAG-7`. A case is written by its full ID, `<suite>.<n>` (e.g. `DRAG-3.9`), in its own suite file as everywhere else.

| Suite | What it covers |
|---|---|
| [DRAG-1 — Contexts, the layer stack, and popping](drag-1-contexts-and-popping.md) | Where a drag starts, the three layers and their transition rules, placing by the ghost in a column, and popping out and in |
| [DRAG-2 — Target classification at drag start](drag-2-target-classification.md) | The three classification states, and the relationship and Depth-capped overlays |
| [DRAG-3 — Board-layer drop bands, and the dragged card's shape](drag-3-card-column-bands.md) | What a release at Board layer commits in each band, how the bands are carved, done and empty regions, and shortCard and Stub-row copies |
| [DRAG-4 — Card attach and hierarchy placement](drag-4-attach-and-stub-placement.md) | Zooming into a Card's Descendants, the starting gap, and placement by gap and depth, including an empty hierarchy |
| [DRAG-5 — Stub → out: detach](drag-5-detach-and-overflow.md) | Moving a Stub within its Card, detaching it, and reparenting it into another Card |
| [DRAG-6 — Optimistic preview, reconciliation, and failure](drag-6-preview-reconciliation.md) | What the board shows on release, reconciling responses, re-drags, failures, and the cue for an item drag stopped by a resync |
| [DRAG-7 — Depth overflow and the hierarchy modal](drag-7-overflow-and-hierarchy-modal.md) | How many levels a Card's section shows, the overflow row and its gaps, and the hierarchy modal: opened by a click or by a hold during a drag, how it closes, and a board reload |

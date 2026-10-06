# Test Plan — Item Positioning & Board-Scoped Ordering

**Wiki page:** item-positioning

**Suite IDs:** `TC-1` … `TC-7`, with `TC-5a` and `TC-X`. A case is written by its full ID, `TC-<suite>.<n>` (e.g. `TC-4.1`), in its own suite file as everywhere else.

Items position by positioning's shared rules, which have no catalog of their own, so the cases here test them as items apply them, beside item-positioning's own. Projects share the same resolution, and project-tree's catalog repeats only what differs for them.

| Suite | What it covers |
|---|---|
| [TC-1 — Position is one value per item](part-1-position-scalar.md) | One position per item, read by every board |
| [TC-2 — Anchor and side resolution](part-2-anchor-resolution.md) | Resolving against the anchor's true neighbor, the fallbacks, the comparison scope, `positionScope`, when a scope change reassigns a position, and the client's role |
| [TC-3 — Attached-sibling reorder](part-3-attached-sibling-reorder.md) | Reordering and placing an attached child among its parent's attached children |
| [TC-4 — Merged-column interleaving](part-4-merged-column.md) | A merged column's single order across its covered workphases |
| [TC-5 — Reindexing and its disclosure](part-5-reindex.md) | When a scope is reindexed, what a reindex keeps and touches, and the renumbered positions a response discloses |
| [TC-5a — Client reconciliation order](part-5a-client-reconciliation.md) | The list after a position write, applying a response in order, and the tie-break |
| [TC-6 — Active/done split](part-6-active-done-split.md) | `completedAt`, a done item's missing position and its order, attached children under a done parent, and a workphase's terminal flag changing |
| [TC-7 — Placement intents from the board gesture](part-7-board-placement-intents.md) | First and last as an anchor and side, the anchor's resulting scope, a placement with a reparent, cross-project and cross-workflow reparents, the items a project move leaves in another workflow, and a done Card's Stubs |
| [TC-X — Cross-cutting guards](cross-cutting-regression.md) | A detached child's scope, and a moving item never being its own neighbor |

# TC-4 — Merged-column interleaving

**Next ID:** TC-4.6

How a drop into a merged or expanded column resolves, by whether the item's workphase is in the column's covered set, is only ever a drop's, so its cases are the gesture's: [DRAG-3.6](../board-drag-interaction/drag-3-card-column-bands.md), [DRAG-3.7](../board-drag-interaction/drag-3-card-column-bands.md) and [DRAG-3.8](../board-drag-interaction/drag-3-card-column-bands.md).

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-4.1 | A merged column is one order by position, not one workphase after another | P0 | Automated |

---

## TC-4.1 — A merged column is one order by position, not one workphase after another

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §4

*Given* a merged column covering `W1` and `W2`, with `W1` items at `1.0` and `2.0` and a `W2` item at `1.5`, *when* the column renders, *then* it reads the `1.0` item, the `1.5` item, then the `2.0` item: one order by position across its covered workphases, not `W1`'s items followed by `W2`'s.

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`

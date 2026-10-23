# TC-5a — Client reconciliation order

**Next ID:** TC-5a.7

These hold for any client that keeps a locally ordered list. What the board adds (the pending marker, the inversion log, sequencing responses per item, resyncing on a failure) is [DRAG-6](../board-drag-interaction/drag-6-preview-reconciliation.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-5a.1 | After a successful position write, the list shows the server's order without a reload | P0 | Automated |
| TC-5a.2 | Applying the reindex pairs before comparing records no false inversion | P0 | Automated |
| TC-5a.4 | Disclosed ids the client doesn't hold are ignored, not fetched | P1 | Automated |
| TC-5a.5 | Every client sort breaks ties the same way: position, a missing one as `0`, then creation time | P1 | Automated |

---

## TC-5a.1 — After a successful position write, the list shows the server's order without a reload

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §8, wiki item-positioning §5a

*Given* a list the client renders, *when* a write that returns positions succeeds, whether it's a board move, a sibling reorder, an inline create or a Sheet edit, and whether or not it triggered a reindex, *then* the list reads in the server's saved order (by position, then the tie-break of [TC-5a.5](part-5a-client-reconciliation.md)). The list isn't reloaded, and every row other than the written item keeps its order relative to the rest. A failed write, or a stale response that carried reindex pairs, resyncs instead ([DRAG-6.6](../board-drag-interaction/drag-6-preview-reconciliation.md), [DRAG-6.7](../board-drag-interaction/drag-6-preview-reconciliation.md)).

**Automation test:** `tests/ui/item-positioning.spec.ts`, `client/src/lib/positionedWrite.test.ts`, `client/src/components/workflow/dragRequest.test.ts`

## TC-5a.2 — Applying the reindex pairs before comparing records no false inversion

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §8, wiki item-positioning §5a

*Given* a board rendering `A` (`1.0`), `C` (`1.5`) and `E` (`1.75`), with `X` previewed after `A` (`A, X, C, E`), *when* the response arrives with `X = 2`, and `reindexed` holding `A → 1`, `X → 2`, `C → 3` and `E → 4`, *then* afterwards the positions read `A = 1`, `X = 2`, `C = 3`, `E = 4`, the list reads `A, X, C, E`, and the tuning panel's inversion log gains no entry. A comparison made before the pairs landed, against `A = 1.0`, `X = 2`, `C = 1.5` and `E = 1.75`, would log an inversion that never happened.

**Automation test:** `client/src/components/workflow/itemWriteReconciliation.test.ts`

## TC-5a.4 — Disclosed ids the client doesn't hold are ignored, not fetched

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §7, wiki positioning §8

*Given* a `reindexed` collection with pairs for items the client never loaded, *when* the client applies it, *then* it applies the pairs for the items it holds and skips the rest. It sends no request for the others, and its list gains no rows.

**Automation test:** `client/src/lib/positionedWrite.test.ts`

## TC-5a.5 — Every client sort breaks ties the same way: position, a missing one as `0`, then creation time

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §1, wiki item-positioning §5a

*Given* any list the client sorts by position, including the order it reads first and last from ([TC-7.3](part-7-board-placement-intents.md)), *when* two items have the same `position`, *then* the one created earlier sorts first. *And when* one item has no `position`, *then* it sorts as though its position were `0`. A client that sorts ties any other way disagrees with the server ([TC-5.6](part-5-reindex.md)).

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`

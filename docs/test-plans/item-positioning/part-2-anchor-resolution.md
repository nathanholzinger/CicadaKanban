# TC-2 — Anchor and side resolution

**Next ID:** TC-2.34

The client cases (TC-2.11 and TC-2.27–2.30) hold for any client that keeps a locally ordered list. What the board adds is [DRAG-6](../board-drag-interaction/drag-6-preview-reconciliation.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-2.1 | An item placed between two neighbors lands strictly between them | P0 | Automated |
| TC-2.2 | Coarsest-fit rounding | P0 | Automated |
| TC-2.4 | Append fallback: after the true last item | P0 | Automated |
| TC-2.5 | Prepend fallback: before the true first item, floor-bounded and never negative | P0 | Automated |
| TC-2.6 | An item created with no anchor is placed after the scope's true last item | P1 | Automated |
| TC-2.7 | Bootstrap: an empty scope starts at `1.0`, and an empty workphase isn't an empty scope | P0 | Automated |
| TC-2.8 | An anchor with no position, or one that doesn't exist, is rejected | P1 | Automated |
| TC-2.9 | A narrow view can't leapfrog an unseen true neighbor | P0 | Automated |
| TC-2.10 | A Free item's comparison scope is its whole workflow | P0 | Automated |
| TC-2.11 | The client never computes a position: its requests carry relative intent only | P0 | Automated |
| TC-2.12 | Precision exhaustion reindexes the scope, then retries the insert | P0 | Automated |
| TC-2.13 | `positionScope` is `"attached-siblings"` for an attached child | P1 | Automated |
| TC-2.14 | `positionScope` is `"workflow"` for a Free item in an active workphase | P1 | Automated |
| TC-2.15 | `positionScope` is `"none"` for a done Free item | P1 | Automated |
| TC-2.16 | `positionScope` is `"none"` for an item with no workphase | P1 | Automated |
| TC-2.17 | `positionScope` is `"workflow"` for a parentless item that holds the attachment flag | P1 | Automated |
| TC-2.18 | `position` is a number or `null` | P2 | Automated |
| TC-2.19 | Detaching reassigns a fresh workflow-scoped position | P0 | Automated |
| TC-2.20 | Attaching reassigns a fresh position among the new siblings | P0 | Automated |
| TC-2.21 | Reparenting while staying attached reassigns a fresh position | P0 | Automated |
| TC-2.23 | A redundant re-attach to the same parent leaves the position alone | P1 | Automated |
| TC-2.24 | A workphase-only move with no anchor keeps the position | P0 | Automated |
| TC-2.25 | A parent's workphase cascade leaves its attached children's positions alone | P0 | Automated |
| TC-2.27 | Optimistic feedback is ordinal: an index, not a number | P0 | Automated |
| TC-2.28 | Under a narrow view, the server's answer renders exactly as the preview did | P0 | Automated |
| TC-2.29 | The preview holds when the anchor's own position is still in flight | P1 | Automated |
| TC-2.30 | A pending item is never represented as `position: null` | P0 | Automated |
| TC-2.31 | A move within the item's own workphase that names no anchor appends it | P2 | Automated |
| TC-2.32 | A write can't name a final position | P1 | Open |
| TC-2.33 | A Free item's true neighbor, or its anchor, can be in another project on the same workflow | P1 | Automated |

---

## TC-2.1 — An item placed between two neighbors lands strictly between them

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* items at `1.0` and `2.0`, adjacent in a comparison scope, *when* an item is moved with the item at `1.0` as its anchor and side `after`, *then* its position is `1.5`: strictly between the two, and the coarsest value that fits ([TC-2.2](part-2-anchor-resolution.md)).

**Automation test:** `server/tests/routes/items.test.ts`, `tests/api/itemRepositioningAttachedSiblings.spec.ts`

## TC-2.2 — Coarsest-fit rounding

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* neighbors at `1.5` and `2.0`, *when* an item is placed between them, *then* its position is `1.8`: the first value, searching 0 decimal places, then 1, then 2 and on, that falls strictly between them. The raw midpoint, `1.75`, isn't used.

**Automation test:** `server/tests/lib/positionResolver.test.ts`

## TC-2.4 — Append fallback: after the true last item

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* anchor `A` at `2.4`, the true last item in its comparison scope, *when* an item is placed after `A`, *then* its position is `3`: `A`'s position plus `1.0`, rounded. It isn't `3.4`.

**Automation test:** `server/tests/lib/positionResolver.test.ts`

## TC-2.5 — Prepend fallback: before the true first item, floor-bounded and never negative

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* anchor `A` at `1.0`, the true first item in its comparison scope, *when* an item is placed before `A`, *then* its position is `0.5`: the coarsest fit between a floor of `0.0` and `A`, not `A`'s position minus `1.0`. *And when* that prepend is repeated, each new item placed before the current true first item, *then* every position resolved is greater than `0.0`, however many times it repeats. A reindex may renumber the scope along the way ([TC-2.12](part-2-anchor-resolution.md)), but no position reaches `0.0` or below.

**Automation test:** `server/tests/routes/items.test.ts`, `tests/api/itemRepositioningAttachedSiblings.spec.ts`

## TC-2.6 — An item created with no anchor is placed after the scope's true last item

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* a workflow whose true last Free item is at `4.2`, in any of its workphases, *when* a top-level item is created in the workflow with no anchor, *then* its position is `5`, as if placed after that item ([TC-2.4](part-2-anchor-resolution.md)).

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.7 — Bootstrap: an empty scope starts at `1.0`, and an empty workphase isn't an empty scope

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* a workflow with no positioned item in any workphase, *when* an item is created in it with no anchor, or moved in with no position to keep, *then* its position is `1.0`. The same holds for the first attached child of a parent that has none. *And given* a workflow whose workphase `W2` is empty while `W1` holds an item at `3.0`, *when* an item is created in `W2` with no anchor, *then* its position is `4`, not `1.0`: the scope is the whole workflow, so an empty workphase never bootstraps on its own.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/lib/positionResolver.test.ts`

## TC-2.8 — An anchor with no position, or one that doesn't exist, is rejected

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2, wiki item-positioning §7.1

*Given* a done item `D`, in a terminal workphase with no position, *when* a move names `D` as its anchor, *then* the request is rejected with a 400, and nothing in it is written: no workphase change and no position. *And when* a move names an anchor id that no item has, *then* it's rejected the same way. No fallback ignores the anchor and appends instead.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`, `server/tests/lib/positionResolver.test.ts`

## TC-2.9 — A narrow view can't leapfrog an unseen true neighbor

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* the true order `A` (`1.0`), `B` (`2.8`), `C` (`3.0`), `D` (`4.0`), and a view that shows only `A`, `C` and `D`, *when* `D` is placed before `C`, *then* its position is `2.9`: between `C` and its true predecessor `B`. It's never below `2.8`, which would put `D` ahead of `B`, an item the view never saw.

**Automation test:** `server/tests/lib/positionResolver.test.ts`

## TC-2.10 — A Free item's comparison scope is its whole workflow

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* a workflow with workphases `W1` and `W2`, Free items `A` (`1.0`) and `C` (`3.0`) in `W1` and `B` (`2.0`) in `W2`, and an attached child of `A` at `1.2`, *when* an item is placed after `A` in `W1`, *then* its position is `1.5`: `A`'s true neighbor is `B`, in another workphase, whether the column shows `W1` alone or both. The attached child is scoped to its parent, so it's no neighbor of a Free item.

**Automation test:** `server/tests/routes/items.test.ts`, `tests/api/itemRepositioningCrossColumn.spec.ts`

## TC-2.11 — The client never computes a position: its requests carry relative intent only

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* any client write that places an item (a board drop, a sibling reorder, or an inline create), *when* the request is sent, *then* it names what the placement is relative to (an anchor and a side, a workphase, a parent, or a combination) and carries no `position` value. What the client shows meanwhile is [TC-2.27](part-2-anchor-resolution.md)'s and [TC-2.30](part-2-anchor-resolution.md)'s: an index, with the item's `position` left as it was.

**Automation test:** `tests/ui/item-positioning.spec.ts`, `client/src/components/workflow/dragRequest.test.ts`, `client/src/components/workflow/placement.test.ts`

## TC-2.12 — Precision exhaustion reindexes the scope, then retries the insert

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2, wiki item-positioning §5

*Given* two adjacent items so close that no value at the search's maximum decimal depth falls strictly between them, *when* an item is placed between them, *then* the scope is first reindexed to clean sequential values in its current order ([TC-5.1](part-5-reindex.md)), and the item is then placed strictly between the same two neighbors' new values. The write succeeds.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.13 — `positionScope` is `"attached-siblings"` for an attached child

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* an item with a parent and the attachment flag set, *when* it is read through the API, *then* its `positionScope` is `"attached-siblings"`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.14 — `positionScope` is `"workflow"` for a Free item in an active workphase

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* a Free item, top-level or a detached child, in a non-terminal workphase of its project's workflow, *when* it is read through the API, *then* its `positionScope` is `"workflow"`.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-2.15 — `positionScope` is `"none"` for a done Free item

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2, wiki item-positioning §6

*Given* a Free item in a terminal workphase, *when* it is read through the API, *then* its `positionScope` is `"none"`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.16 — `positionScope` is `"none"` for an item with no workphase

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* an item whose `workphaseId` is empty, because its workphase was deleted, *when* its `positionScope` is computed, *then* it is `"none"`: the same value as a done item's, for a different reason.

**Automation test:** `server/tests/routes/boards.test.ts`

## TC-2.17 — `positionScope` is `"workflow"` for a parentless item that holds the attachment flag

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* an item in a non-terminal workphase with no `parentId`, whose attachment flag is set, *when* its `positionScope` is computed, *then* it is `"workflow"`, not `"attached-siblings"`, which needs both the flag and a parent.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.18 — `position` is a number or `null`

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-positioning §1, wiki item-positioning §2

*Given* any item, *when* it is read through the API, *then* its `position` is a number or `null`, and nothing else. `positionScope` sits beside it, and doesn't change its shape.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.19 — Detaching reassigns a fresh workflow-scoped position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2.1

*Given* attached child `X` of `P` at sibling-scoped `1.0`, in a workflow whose true last Free item is at `7.0`, *when* `X` is detached with no anchor, *then* its position is `8`, by the append fallback in the workflow scope, and its `positionScope` is `"workflow"`. The sibling-scoped `1.0` isn't kept.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.20 — Attaching reassigns a fresh position among the new siblings

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2.1

*Given* Free item `X` at workflow position `5.0`, and `P` whose attached children's true last is at `2.0`, *when* `X` is attached to `P` with no anchor, *then* its position is `3`, by the append fallback among `P`'s attached children, and its `positionScope` is `"attached-siblings"`. *And given* `P` has no attached children, *then* it's `1.0` ([TC-2.7](part-2-anchor-resolution.md)). The workflow-scoped `5.0` isn't kept.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-2.21 — Reparenting while staying attached reassigns a fresh position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2.1

*Given* attached child `X` of `A` at `1.0`, and `B` whose attached children's true last is at `4.0`, *when* `X` is reparented to `B` and stays attached, with no anchor, *then* its position is `5`, among `B`'s attached children. `A`'s `1.0` isn't kept.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.23 — A redundant re-attach to the same parent leaves the position alone

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2.1

*Given* `X`, attached to `P` at position `p`, *when* a write attaches `X` to `P` again, *then* `X.position` is still `p`: its scope didn't change, so nothing is reassigned.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.24 — A workphase-only move with no anchor keeps the position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2, wiki item-positioning §2.1

*Given* Free item `X` at a position the append fallback wouldn't produce, such as `2.37`, *when* `X` moves to another workphase of the same workflow with no anchor, *then* `X.position` is exactly `2.37`: its scope is the workflow either way. *And given* `X` has no position to keep, as a reopened done item has none ([TC-6.9](part-6-active-done-split.md)), *then* it takes the append fallback instead.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-2.25 — A parent's workphase cascade leaves its attached children's positions alone

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2.1

*Given* attached child `X` of `P` at position `p`, *when* `P` moves to another non-terminal workphase and the move cascades to `X`, *then* `X.workphaseId` follows `P`, and `X.position` is still `p`: `X` is scoped to its parent either way. The terminal case is [TC-6.5](part-6-active-done-split.md).

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.27 — Optimistic feedback is ordinal: an index, not a number

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* a rendered list `A, C, E`, and item `X` placed after `A`, *when* the client shows the placement before the server responds, *then* `X` is rendered at index 1 (`A, X, C, E`), and `X.position` isn't given a value to put it there. The order comes from the placement, not from a sort by `position`.

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`

## TC-2.28 — Under a narrow view, the server's answer renders exactly as the preview did

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* the true order `A, B, C, D, E`, and a client that has loaded only `A, C, E`, *when* the client places `X` after `A`, *then* the server resolves `X` between `A` and `B`, and the client's list, sorted with the server's value, reads `A, X, C, E`. *When* it instead places `X` before `C`, *then* the server resolves `X` between `B` and `C`, and the list again reads `A, X, C, E`. Either way, the order after the response is the one the preview drew ([TC-2.27](part-2-anchor-resolution.md)).

**Automation test:** `tests/api/itemRepositioningCrossColumn.spec.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`

## TC-2.29 — The preview holds when the anchor's own position is still in flight

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* item `Y`, just placed, with its write still pending, *when* the client places `X` after `Y` at once, *then* the preview shows `X` directly after `Y`. *And when* both responses have landed and been reconciled ([TC-5a.1](part-5a-client-reconciliation.md)), *then* `X` is still directly after `Y`.

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`

## TC-2.30 — A pending item is never represented as `position: null`

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* an item whose position write is in flight, *when* the client marks it pending, *then* its `position` is exactly what it was before the write, not `null`, and a separate marker shows that it's pending. *And when* the list re-sorts while the write is pending, for example because another item's response lands, *then* the pending item keeps its place. It doesn't jump to the front, as a `null` counted as `0` would ([TC-5a.5](part-5a-client-reconciliation.md)).

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`

## TC-2.31 — A move within the item's own workphase that names no anchor appends it

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* Free item `X` at `1.0` in workphase `W1`, in a workflow whose true last Free item other than `X` is at `2.0`, *when* a move names `X`'s own workphase and no anchor, *then* `X.position` is `3`, by the append fallback, as for a create with no anchor. Only a move to a different workphase keeps the position ([TC-2.24](part-2-anchor-resolution.md)).

**Automation test:** `server/tests/routes/items.test.ts`

## TC-2.32 — A write can't name a final position

**Priority:** P1 · **Status:** Open · **Rule:** wiki item-positioning §2

*Given* Free items `X` at `2.0` and `A` at `4.0` in one workflow, *when* a move names `position: 3.0` for `X`, alone or with `{anchorId: A, side: after}`, *then* it's refused with a 400 whose message says to name an anchor and side instead, and `X.position` is still `2.0`. *And when* a request asks to set several items' positions outright, *then* no endpoint takes it: it gets a 404, and no position changes.

**Automation test:** —

## TC-2.33 — A Free item's true neighbor, or its anchor, can be in another project on the same workflow

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* projects `P1` and `P2` on one workflow, and, in one workphase, Free items `A` (`1.0`), `D` (`3.0`) and `C` (`5.0`) in `P1` and `B` (`2.0`) in `P2`, *when* `C` is placed after `A`, as `P1`'s board asks, since it doesn't show `B`, *then* `C`'s position is `1.5`: `A`'s true neighbor is `B`, whatever its project ([TC-2.9](part-2-anchor-resolution.md)). *And when* `C` is instead placed with `{anchorId: B, side: after}`, *then* it's accepted, and `C`'s position is `2.5`, between `B` and `D`: `B` is in `C`'s scope, though not in its project.

**Automation test:** `tests/api/itemRepositioningCrossProject.spec.ts`

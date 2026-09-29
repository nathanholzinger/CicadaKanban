# TC-7 — Placement intents from the board gesture

**Next ID:** TC-7.19

Which gesture or band produces which request is [`../board-drag-interaction/`](../board-drag-interaction/INDEX.md)'s. These cases hold the request's form and what the server resolves it to. A placement that takes a path wiki item-positioning §2 already has, as an empty region, a done column and the middle band do, is asserted with the DRAG case that makes the request: [DRAG-3.3](../board-drag-interaction/drag-3-card-column-bands.md), [DRAG-3.9](../board-drag-interaction/drag-3-card-column-bands.md), [DRAG-3.10](../board-drag-interaction/drag-3-card-column-bands.md) and [DRAG-4.12](../board-drag-interaction/drag-4-attach-and-stub-placement.md). What a legal parent is, and what attaching means, is [`../item-attachment/`](../item-attachment/INDEX.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-7.1 | "First in list" is an ordinary before-anchor request on the first rendered item | P0 | Automated |
| TC-7.2 | "Last in list" is an ordinary after-anchor request on the last rendered item | P0 | Automated |
| TC-7.3 | First and last are read off the rendered order, with ties broken by creation time | P1 | Automated |
| TC-7.4 | The first visible item is the right anchor under a narrow view | P0 | Automated |
| TC-7.10 | An anchor outside the resulting scope is rejected, and nothing commits | P1 | Automated |
| TC-7.11 | An attach with a placement resolves among the new parent's children, after the reparent | P0 | Automated |
| TC-7.13 | A detach with a placement resolves in the workflow scope, against the anchor | P0 | Automated |
| TC-7.14 | A cross-project reparent is positioned like any other | P1 | Automated |
| TC-7.15 | A done Card's Stubs are anchorable and place normally | P0 | Automated |
| TC-7.17 | A cross-workflow reparent nulls the position of every moved item that keeps its own workphase | P1 | Automated |
| TC-7.18 | The `positionScope` of an item left in another workflow's workphase | P1 | Pending PO |

---

## TC-7.1 — "First in list" is an ordinary before-anchor request on the first rendered item

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.1

*Given* a target context (a merged column, an expanded sub-row, or a parent's Stub list) rendering `A` (`2.0`), `B` (`3.0`) and `C` (`4.0`), with `A` the true first item of its scope, *when* item `X` is placed first in the list, *then* the request is `{anchorId: A, side: before}`, with nothing else to mark it as first, and `X`'s position is `1`: the floor-bounded prepend any placement before `A` gets ([TC-2.5](part-2-anchor-resolution.md)).

**Automation test:** `server/tests/routes/items.test.ts`, `client/src/components/workflow/dragRequest.test.ts`

## TC-7.2 — "Last in list" is an ordinary after-anchor request on the last rendered item

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.1

*Given* the same target context rendering `A`, `B` and `C` (`4.0`), *when* `X` is placed last in the list, *then* the request is `{anchorId: C, side: after}`. `X`'s position is `5` if `C` is the true last item of its scope ([TC-2.4](part-2-anchor-resolution.md)), or `4.2` if an item the view doesn't show follows `C` at `4.4`.

**Automation test:** `server/tests/routes/items.test.ts`, `client/src/components/workflow/dragRequest.test.ts`

## TC-7.3 — First and last are read off the rendered order, with ties broken by creation time

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §7.1, wiki item-positioning §5a

*Given* a target context whose two leading items, `A` and `B`, have the same `position`, with `A` created first, *when* an item is placed first in the list, *then* the request's anchor is `A`, the item the tie-break sorts first ([TC-5a.5](part-5a-client-reconciliation.md)). *And given* its two trailing items tie, *when* an item is placed last, *then* the anchor is the one of them created later.

**Automation test:** `client/src/components/workflow/dragRequest.test.ts`

## TC-7.4 — The first visible item is the right anchor under a narrow view

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.1

*Given* the true order `Z` (`1.0`), `A` (`2.0`), `B` (`3.0`), in a view that shows only `A` and `B`, *when* `X` is placed first in the list, *then* the request is `{anchorId: A, side: before}`, `X`'s position is `1.5`, between `Z` and `A`, and the view reads `X, A, B`: first in the list the user was looking at. `X` isn't placed ahead of `Z`, an item the user never saw.

**Automation test:** `tests/api/itemRepositioningCrossColumn.spec.ts`, `client/src/components/workflow/dragRequest.test.ts`

## TC-7.10 — An anchor outside the resulting scope is rejected, and nothing commits

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §7.1

*Given* Free Card `X`, Card `P` with attached children `S1` and `S2`, and Card `Q` with attached child `T1`, *when* one request attaches `X` to `P` but names `T1` as its anchor, *then* it is rejected with a 400, and `X` is unchanged: still Free, with the same parent, workphase and position ([ATT-3.7](../item-attachment/att-3-reparent-placement-atomicity.md)). Each of these is rejected the same way, and changes nothing:

- a move of Free item `F` that reparents nothing, naming `T1`, which is scoped to `Q`'s attached children, not the workflow;
- a move naming an anchor in another workflow;
- a move naming the moving item itself, which is never in its own scope ([TC-X.6](cross-cutting-regression.md)).

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-7.11 — An attach with a placement resolves among the new parent's children, after the reparent

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.1, wiki item-positioning §7.2

*Given* Free Card `X` at workflow position `50.0`, and Card `P` with attached children `S1` (`1.0`) and `S2` (`2.0`), *when* one request attaches `X` to `P` with `{anchorId: S1, side: after}`, *then* it's accepted, though `S1` isn't in `X`'s scope when the request arrives: the anchor is checked against where `X` will be. `X`'s position is `1.5`, drawn from `P`'s children. It isn't `50.0` kept, or a value resolved among `X`'s old workflow neighbors.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-7.13 — A detach with a placement resolves in the workflow scope, against the anchor

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.2

*Given* attached child `X` of `P` at sibling-scoped `2.0`, and Free Cards `F1` (`10.0`) and `F2` (`11.0`) in the same workflow, *when* one request detaches `X` with `{anchorId: F1, side: after}`, *then* `X` is Free, still naming `P` as its parent ([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)), and its position is `10.5`, not `2.0`.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-7.14 — A cross-project reparent is positioned like any other

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §7.3

*Given* projects `P1` and `P2` on the same workflow, Free Card `X` in `P1` at `5.0`, Card `Q` in `P2` with attached children `Q1` (`1.0`) and `Q2` (`2.0`), and Free item `B` in `P2`, *when* `X` is attached to `Q` with `{anchorId: Q1, side: after}`, *then* `X`'s position is `1.5`, as for the same attach within one project ([TC-7.11](part-7-board-placement-intents.md)). *And given* `X` is a detached child of an item in `P1`, *when* it is instead reparented to `B` with no anchor and stays Free, *then* its position is still `5.0`: the project change doesn't re-resolve it ([ATT-3.10](../item-attachment/att-3-reparent-placement-atomicity.md)). The project cascade is [ATT-5](../item-attachment/att-5-cross-project-reparenting.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-7.15 — A done Card's Stubs are anchorable and place normally

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §7.4

*Given* Card `P` in a terminal workphase, with no position and `completedAt` set, and attached children `S1` (`1.0`) and `S2` (`2.0`), *when* an item is attached to `P` with `{anchorId: S1, side: after}`, *then* it's accepted, and the item's position is `1.5`, among `P`'s attached children. `P` itself can't be an anchor ([TC-2.8](part-2-anchor-resolution.md)); its Stubs can. The rest of the attach is [ATT-6.1](../item-attachment/att-6-attaching-to-done-parent.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-7.17 — A cross-workflow reparent nulls the position of every moved item that keeps its own workphase

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §7.3, wiki item-positioning §2.1

*Given* project `P1` on workflow `WF1` and project `P2` on workflow `WF2`; Free item `X` in `P1` at `5.0`, with attached child `X1` at sibling-scoped `1.0` and detached child `X2` at `7.0`; and item `B` in `P2`, *when* `X` is reparented to `B` through the API and stays Free, *then* `X.position` and `X2.position` are `null`: each keeps a workphase from `WF1`, which `P2` doesn't use. `X1.position` is still `1.0`, since it's scoped to `X`. What their `positionScope` reads is [TC-7.18](part-7-board-placement-intents.md)'s. *And when* `X` is then moved into a workphase of `WF2` with no anchor, *then* it takes a position by the append fallback in `WF2`'s scope, having none to keep ([TC-2.24](part-2-anchor-resolution.md)). *And given* the same tree, *when* `X` is instead attached to `B`, *then* `X`'s position is resolved among `B`'s attached children, and `X2.position` is `null`.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-7.18 — The `positionScope` of an item left in another workflow's workphase

**Priority:** P1 · **Status:** Pending PO

*Given* `X`, reparented across workflows and still Free, so it holds a workphase from `WF1` in a project on `WF2` ([TC-7.17](part-7-board-placement-intents.md)), *when* it is read through the API, *then* — **question for the PO:** wiki item-positioning §7.3 says such an item's `positionScope` is `"none"`. The definition in wiki item-positioning §2 gives `"none"` only to a done item and to one with no workphase, and the API returns `"workflow"`. Which does it read?

**Automation test:** —

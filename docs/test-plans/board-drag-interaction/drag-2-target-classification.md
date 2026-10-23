# DRAG-2 — Target classification at drag start

**Next ID:** DRAG-2.11

The classification states are asserted, never the overlays' colors or weights: the overlays' look is an open question.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-2.1 | A legal target is classified Valid | P0 | Automated |
| DRAG-2.2 | The dragged item and every descendant are classified Cycle-forming | P0 | Automated |
| DRAG-2.3 | A target whose resulting depth would exceed `CAP` is classified Depth-capped | P0 | Automated |
| DRAG-2.4 | Classification is computed once at drag start and doesn't change mid-gesture | P1 | Open |
| DRAG-2.5 | Free descendants of the carried item carry the relationship overlay | P1 | Open |
| DRAG-2.6 | Depth-capped targets are de-emphasized, not hidden | P2 | Open |
| DRAG-2.7 | Every Stub is classified individually | P0 | Automated |
| DRAG-2.8 | A Stub drag is classified exactly like a Card drag, and a place that's no target isn't classified | P1 | Open |
| DRAG-2.9 | Cycle-forming wins over Depth-capped | P1 | Automated |
| DRAG-2.10 | The board's depth cap is the one the API enforces, carried by `GET /boards/:id` | P1 | Automated |

---

## DRAG-2.1 — A legal target is classified Valid

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of item `X` with subtree height `H`, and a visible Card `T` at depth `D` that isn't `X`, isn't a descendant of `X`, and satisfies `D + 1 + H <= CAP` (wiki item-attachment §8), *when* the drag begins, *then* `T` is classified **Valid**.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.2 — The dragged item and every descendant are classified Cycle-forming

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X`, where `X` has a detached descendant `D` (its own Card elsewhere on the board), and `D` has an attached Stub `D1`, shown inside `D`'s Card, *when* the drag begins, *then* `X` itself, `D` and `D1` are each classified **Cycle-forming**. Descent follows the hierarchy, attached or not: `D` is reached through a detached link, and `D1` through an attached one. (`X`'s own attached Stubs travel with `X` and aren't shown during its drag, wiki board-drag-interaction §5a, so they aren't on the board to classify.)

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.3 — A target whose resulting depth would exceed `CAP` is classified Depth-capped

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` with subtree height `H`, counting detached descendants ([ATT-4.5](../item-attachment/att-4-legal-parent-depth-cap.md)), and two visible targets, `T_ok` at depth `D` with `D + 1 + H = CAP` and `T_over` at depth `D + 1`, *when* the drag begins, *then* `T_ok` is **Valid** and `T_over` is **Depth-capped**: legal as a parent, but the resulting depth would exceed `CAP`.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.4 — Classification is computed once at drag start and doesn't change mid-gesture

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` in progress, with targets classified as in [DRAG-2.1](drag-2-target-classification.md), [DRAG-2.2](drag-2-target-classification.md) and [DRAG-2.3](drag-2-target-classification.md), *when* the cursor moves across the board, hovering, popping, and entering and leaving contexts, *then* every target keeps the classification it had at drag start. The item being carried doesn't change mid-gesture, so neither does what any target is to it.

**Automation test:** —

## DRAG-2.5 — Free descendants of the carried item carry the relationship overlay

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` with a detached descendant `D`, a Card elsewhere on the board, *when* the drag begins, *then* `D` carries the relationship overlay ("these are yours") for the whole drag, as well as being Cycle-forming ([DRAG-2.2](drag-2-target-classification.md)). This case asserts that the overlay is there; its color is a tuning-panel value (`overlayFreeDescendantColor`), and its final look is open.

**Automation test:** —

## DRAG-2.6 — Depth-capped targets are de-emphasized, not hidden

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a Depth-capped target as in [DRAG-2.3](drag-2-target-classification.md), *when* the drag begins, *then* it is still rendered in its place (not removed, not collapsed) and is dimmed relative to a Valid target, by the tuning panel's `overlayDepthCappedOpacity`. It is a real target that this item can't use, unlike a place that's no target at all, which isn't classified ([DRAG-2.8](drag-2-target-classification.md)).

**Automation test:** —

## DRAG-2.7 — Every Stub is classified individually

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of Card `X`, and Cards `P` and `Q` with Stubs, where `P`'s Stub `S_P` is a legal parent for `X` and `Q`'s Stub `S_Q` would put `X` past `CAP`, *when* the drag begins, *then* `S_P` is classified **Valid** and `S_Q` **Depth-capped**. No Stub is excluded just for being a Stub.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.8 — A Stub drag is classified exactly like a Card drag, and a place that's no target isn't classified

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a drag of a Stub, *when* the drag begins, *then* every target is classified by the same rules as for a Card drag: Valid, Cycle-forming or Depth-capped ([DRAG-2.1](drag-2-target-classification.md), [DRAG-2.2](drag-2-target-classification.md), [DRAG-2.3](drag-2-target-classification.md)). No target is excluded because the dragged item is a Stub.

*And given* any drag, *when* it begins, *then* the Unsorted bucket, a broken column and an expanded column's outer wrapper carry no classification at all. They're nowhere: no drag enters them, and a release there writes nothing ([DRAG-1.9](drag-1-contexts-and-popping.md)).

**Automation test:** —

## DRAG-2.9 — Cycle-forming wins over Depth-capped

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` with a descendant `D` placed deep enough that `D` would also fail the depth cap as a parent for `X`, *when* the drag begins, *then* `D` is classified **Cycle-forming**, not Depth-capped. A descendant is never a real target for its own ancestor.

**Automation test:** `client/src/components/workflow/dragClassification.test.ts`

## DRAG-2.10 — The board's depth cap is the one the API enforces, carried by `GET /boards/:id`

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a board, *when* it is read with `GET /boards/:id`, *then* the response carries `itemDepthCap`, equal to the cap the API enforces: a write that puts the moving subtree's deepest item at depth `itemDepthCap` is accepted, and one that puts it at `itemDepthCap + 1` is refused ([ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)). The board classifies Depth-capped targets against that same value, so a target the board classifies Valid is never one the API refuses.

**Automation test:** `server/tests/routes/boards.test.ts`, `tests/ui/drag-target-classification.spec.ts`

# ATT-7 — Detaching preserves the parent relationship

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §11

**Suite ID:** `ATT-7`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `ATT-7.n`.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | Detaching clears the attachment flag and leaves `parentId` in place | P0 | ⏳ pending triage |
| TC-2 | On becoming Free, the item takes a workflow-scoped board position | P0 | ⏳ pending triage |
| TC-3 | On becoming Free, the item keeps the workphase it held and stops tracking its former parent | P0 | ⏳ pending triage |
| TC-4 | On becoming Free, the item is eligible for `completedAt` | P1 | ⏳ pending triage |
| TC-5 | A detach that lands inside a different parent's context is a reparent, not a detach | P0 | ⏳ pending triage |

---

## TC-1 — Detaching clears the attachment flag and leaves `parentId` in place

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, *when* `X` is detached (by any entry
point — drag out, Sheet checkbox, badge), *then* `X`'s attachment flag is
clear and `X.parentId` is still `P`. It is now a Free Card that records
its parent. Severing the relationship (clearing `parentId`) is a separate,
explicit act that a detach never performs.

**Automation test:** —

## TC-2 — On becoming Free, the item takes a workflow-scoped board position

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-2.19](../item-positioning/part-2-anchor-resolution.md)
(no anchor — append fallback) and [TC-7.13](../item-positioning/part-7-board-placement-intents.md)
(with anchor). *Given* `X` detached from `P`, *when* its position is
read, *then* `positionScope = "workflow"` and its `position` was freshly
resolved in the workflow-wide scope — not carried over from `P`'s sibling
list.

**Automation test:** —

## TC-3 — On becoming Free, the item keeps the workphase it held and stops tracking its former parent

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` attached to `P` in workphase `W1`, *when* `X` is detached in
place (no workphase specified), *then* `X.workphaseId = W1` — the
workphase it held at that moment is now its own. *And when* `P`
subsequently moves to `W2`, *then* `X.workphaseId` is still `W1` — the
cascade no longer reaches it, even though `X.parentId` is still `P`.

*(The board-side consequence — detaching in place must not walk the item
back to a merged column's entry workphase — is
[DRAG-5.2](../board-drag-interaction/drag-5-detach-and-overflow.md).)*

**Automation test:** —

## TC-4 — On becoming Free, the item is eligible for `completedAt`

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` detached from `P` (still `parentId = P`), *when* `X` is
moved to a terminal workphase, *then* `X.completedAt` is set and
`X.position` dropped exactly as for any other Free item
([TC-6.1](../item-positioning/part-6-active-done-split.md) /
[TC-6.3](../item-positioning/part-6-active-done-split.md)) — its lingering
parent link does not exempt it. *And* the detach itself, when the item is
detached *directly into* a terminal workphase, sets `completedAt` in that
same change.

**Automation test:** —

## TC-5 — A detach that lands inside a different parent's context is a reparent, not a detach

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, and a different Card `Q`, *when* one
gesture pulls `X` out of `P` and lands it inside `Q`'s context (as a
Stub of `Q`), *then* the result is a reparent per [ATT-3](att-3-reparent-placement-atomicity.md):
`X.parentId = Q`, `X` attached, workphase inherited from `Q`, position
resolved among `Q`'s siblings. It does **not** pass through a Free state
with `parentId = P`, and `parentId` is not left at `P`.

**Automation test:** —

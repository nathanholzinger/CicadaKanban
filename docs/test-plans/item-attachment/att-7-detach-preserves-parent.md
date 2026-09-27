# ATT-7 — Detaching preserves the parent relationship

**Next ID:** ATT-7.7

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §11

| ID | Case | Priority | Automated |
|---|---|---|---|
| ATT-7.1 | Detaching clears the attachment flag and leaves `parentId` in place | P0 | ⏳ pending triage |
| ATT-7.2 | On becoming Free, the item takes a workflow-scoped board position | P0 | ⏳ pending triage |
| ATT-7.3 | On becoming Free, the item keeps the workphase it held and stops tracking its former parent | P0 | ⏳ pending triage |
| ATT-7.4 | On becoming Free, the item is eligible for `completedAt` | P1 | ⏳ pending triage |
| ATT-7.5 | A detach that lands inside a different parent's context is a reparent, not a detach | P0 | ⏳ pending triage |
| ATT-7.6 | Re-attaching a detached child to the parent it still names is a real attach, not a no-op | P0 | ✅ `server/tests/routes/items.hierarchy.test.ts` — "a detached child re-attached to the parent it still names…" |

---

## ATT-7.1 — Detaching clears the attachment flag and leaves `parentId` in place

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, *when* `X` is detached (by any entry
point — drag out, Sheet checkbox, badge), *then* `X`'s attachment flag is
clear and `X.parentId` is still `P`. It is now a Free Card that records
its parent. Severing the relationship (clearing `parentId`) is a separate,
explicit act that a detach never performs.

**Automation test:** —

## ATT-7.2 — On becoming Free, the item takes a workflow-scoped board position

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-2.19](../item-positioning/part-2-anchor-resolution.md)
(no anchor — append fallback) and [TC-7.13](../item-positioning/part-7-board-placement-intents.md)
(with anchor). *Given* `X` detached from `P`, *when* its position is
read, *then* `positionScope = "workflow"` and its `position` was freshly
resolved in the workflow-wide scope — not carried over from `P`'s sibling
list.

**Automation test:** —

## ATT-7.3 — On becoming Free, the item keeps the workphase it held and stops tracking its former parent

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

## ATT-7.4 — On becoming Free, the item is eligible for `completedAt`

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

## ATT-7.5 — A detach that lands inside a different parent's context is a reparent, not a detach

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, and a different Card `Q`, *when* one
gesture pulls `X` out of `P` and lands it inside `Q`'s context (as a
Stub of `Q`), *then* the result is a reparent per [ATT-3](att-3-reparent-placement-atomicity.md):
`X.parentId = Q`, `X` attached, workphase inherited from `Q`, position
resolved among `Q`'s siblings. It does **not** pass through a Free state
with `parentId = P`, and `parentId` is not left at `P`.

**Automation test:** —

## ATT-7.6 — Re-attaching a detached child to the parent it still names is a real attach, not a no-op

**Priority:** P0 · **Automated:** ✅ `server/tests/routes/items.hierarchy.test.ts` — "a detached child re-attached to the parent it still names is a real attach"

*Given* `X` detached from `P` (ATT-7.1: flag clear, `parentId` still `P`,
workflow-scoped position), *when* `X` is attached to `P` again — a request
naming the parent it already names, with the flag set — *then* it is
[ATT-1.7](att-1-free-attached-state.md)'s Free → Attached transition in
full: `X` attached, workphase re-inherited from `P`, `positionScope =
"attached-siblings"` with a fresh position resolved in `P`'s Stub scope
(last, when no anchor is given), and a hierarchy activity entry recorded.
The unchanged `parentId` does not make this a redundant request; the
attachment flag is what changed, and the flag is the scope. Contrast the
genuinely redundant case — an *already attached* child re-attached to the
same parent — which is not a scope change, keeps its position, and logs
nothing.

*(Why it's catalogued: [ATT-1.2](att-1-free-attached-state.md) makes a
detached child "exactly as Free as a top-level item," which implies this;
but the Story 4 audit found the board client treating "same `parentId`"
as "already here" and no-oping the gesture —
`docs/audits/code-quality-audit-epic-3-5-story-4.md` #1. The drag-side
half is [DRAG-4.1](../board-drag-interaction/drag-4-attach-and-stub-placement.md)'s
detached-child clause.)*

**Automation test:** `server/tests/routes/items.hierarchy.test.ts` (the
API consequence); `client/src/components/workflow/dragRequest.test.ts`
"a detached child re-attaching to its own former parent is not identity"
(`isIdentity` — the client's request derivation). The E2E gesture is
Story 10's.

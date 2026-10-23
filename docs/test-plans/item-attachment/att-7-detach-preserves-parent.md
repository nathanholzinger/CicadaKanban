# ATT-7 — Detaching preserves the parent, and severing it

**Next ID:** ATT-7.9

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-7.1 | Detaching clears the attachment flag and leaves `parentId` in place | P0 | Automated |
| ATT-7.2 | On becoming Free, the item takes a workflow-scoped board position | P0 | Automated |
| ATT-7.4 | On becoming Free, the item is eligible for `completedAt` | P1 | Automated |
| ATT-7.5 | A detach that lands inside a different parent's context is a reparent, not a detach | P0 | Automated |
| ATT-7.6 | Re-attaching a detached child to the parent it still names is a real attach, not a no-op | P0 | Automated |
| ATT-7.7 | Reparenting an Attached item to root makes it top-level and Free, with a fresh workflow position | P0 | Automated |
| ATT-7.8 | Reparenting an already Free child to root leaves its position alone unless the write carries an anchor | P1 | Automated |

---

## ATT-7.1 — Detaching clears the attachment flag and leaves `parentId` in place

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §11

*Given* Stub `X` attached to `P`, *when* `X` is detached, whichever write makes the change, *then* `X`'s attachment flag is clear, and `X.parentId` is still `P`: `X` is a Free Card that records its parent. A detach never clears `parentId`; severing the relationship is a separate write ([ATT-7.7](att-7-detach-preserves-parent.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-7.2 — On becoming Free, the item takes a workflow-scoped board position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §11

*Given* `X` detached from `P`, *when* its position is read, *then* `positionScope = "workflow"`, and its `position` was freshly resolved in the workflow-wide scope, not carried over from `P`'s attached siblings: by the append fallback with no anchor, or against the anchor when one is given ([TC-2.19](../item-positioning/part-2-anchor-resolution.md), [TC-7.13](../item-positioning/part-7-board-placement-intents.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.positioning.test.ts`

## ATT-7.4 — On becoming Free, the item is eligible for `completedAt`

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §11

*Given* `X` detached from `P`, with `parentId` still `P`, *when* `X` moves to a terminal workphase, *then* `X.completedAt` is set and `X.position` is dropped, as for any Free item ([TC-6.1](../item-positioning/part-6-active-done-split.md), [TC-6.3](../item-positioning/part-6-active-done-split.md)): its parent link doesn't exempt it. *And given* `P` is in a terminal workphase, so `X` holds that workphase when it's detached in place, *then* the detach itself sets `X.completedAt` and drops `X.position`, in the same change.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.positioning.test.ts`

## ATT-7.5 — A detach that lands inside a different parent's context is a reparent, not a detach

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §11

*Given* Stub `X` attached to `P`, and a different Card `Q`, *when* one write moves `X` out of `P` and into `Q` as its Stub, *then* the result is a reparent ([ATT-3.1](att-3-reparent-placement-atomicity.md)): `X.parentId = Q`, `X` attached, its workphase inherited from `Q`, and its position resolved among `Q`'s attached children. It never passes through a Free state with `parentId = P`, and `parentId` isn't left at `P`.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-7.6 — Re-attaching a detached child to the parent it still names is a real attach, not a no-op

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §11, wiki item-attachment §1

*Given* `X` detached from `P` ([ATT-7.1](att-7-detach-preserves-parent.md): flag clear, `parentId` still `P`, a workflow-scoped position), *when* a write attaches `X` to `P` again, naming the parent it already names with the flag set, *then* it is [ATT-1.7](att-1-free-attached-state.md)'s Free → Attached change in full: `X` attached, its workphase inherited from `P` again, and `positionScope = "attached-siblings"`, with a fresh position among `P`'s attached children (last, when no anchor is given). A hierarchy activity entry is recorded ([ATT-8.1](att-8-hierarchy-changes-logged.md)). The unchanged `parentId` doesn't make the request redundant: the flag changed, and the flag decides the scope. By contrast, re-attaching an already attached child to the same parent is redundant: its scope doesn't change, it keeps its position, and nothing is logged.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-7.7 — Reparenting an Attached item to root makes it top-level and Free, with a fresh workflow position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §11, wiki item-attachment §1, wiki item-attachment §2a

*Given* `X` attached to `P`, in `P`'s workphase `W1`, *when* a write sets `X.parentId` to null, whether it edits `X` or moves it, *then* it is accepted, and `X` is top-level and Free: `parentId` is null, and `X.workphaseId` is still `W1`, the workphase it was shown in ([ATT-9.5](att-9-workphase-a-write-leaves.md)). Its flag is clear ([ATT-1.8](att-1-free-attached-state.md)). The scope changes, from `P`'s attached siblings to the workflow, so `X` gets a fresh workflow-scoped position, as any detach does ([ATT-7.2](att-7-detach-preserves-parent.md)). *And given* `W1` is terminal, *then* `X` is now a Free item in a done workphase: `completedAt` is set and `position` is null ([ATT-7.4](att-7-detach-preserves-parent.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.attached.test.ts`

## ATT-7.8 — Reparenting an already Free child to root leaves its position alone unless the write carries an anchor

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §11

*Given* `X`, a detached child of `P` at workflow-scoped position `p`, *when* a write sets `X.parentId` to null with no anchor, *then* `X` is top-level, and `X.position` is still `p`: its scope was the workflow before and after. *When* the same write carries an anchor and side, *then* `X` is repositioned against that anchor, as any Free item is ([ATT-3.10](att-3-reparent-placement-atomicity.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

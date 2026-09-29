# ATT-5 — Cross-project and cross-workflow reparenting

**Next ID:** ATT-5.9

What a cross-project or cross-workflow reparent does to positions is item-positioning's ([TC-7.14](../item-positioning/part-7-board-placement-intents.md) and [TC-7.17](../item-positioning/part-7-board-placement-intents.md), and wiki item-positioning §7.3).

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-5.1 | Reparenting across two projects on the same workflow is accepted | P0 | Automated |
| ATT-5.2 | The new project cascades to the entire descendant subtree, detached descendants included | P0 | Automated |
| ATT-5.4 | A Free item reparented across workflows keeps every workphase it and its detached descendants hold | P1 | Automated |
| ATT-5.5 | An Attached item reparented across workflows inherits its new parent's workphase | P1 | Automated |
| ATT-5.6 | An item created under a parent takes the parent's project | P1 | Automated |
| ATT-5.7 | A create naming a project other than its parent's | P2 | Pending PO |
| ATT-5.8 | A write that names a workphase from a workflow the item's project doesn't use | P2 | Pending PO |

---

## ATT-5.1 — Reparenting across two projects on the same workflow is accepted

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §9, wiki item-attachment §7

*Given* projects `P1` and `P2`, both on workflow `W`, Free Card `X` in `P1`, and Card `B` in `P2`, *when* `X` is attached to `B`, *then* it is accepted: `X.parentId = B`, `X` attached, `X.projectId = P2`, and `X.workphaseId = B.workphaseId`, a workphase of `W`. A different project doesn't disqualify a parent.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.2 — The new project cascades to the entire descendant subtree, detached descendants included

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §9

*Given* `X` in `P1` with attached child `X1`, detached child `X2`, and `X2`'s own child `X2a`, *when* `X` is reparented under `B` in `P2`, *then* `X`, `X1`, `X2` and `X2a` all read `projectId = P2` after the one commit ([ATT-3.6](att-3-reparent-placement-atomicity.md)). The cascade follows the hierarchy, not the attachment flag: no descendant is left in `P1` under a parent now in `P2`.

The project cascade changes no workphase: `X1`, attached, takes `B`'s workphase through the ordinary cascade, and `X2` and `X2a`, detached, keep their own.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.4 — A Free item reparented across workflows keeps every workphase it and its detached descendants hold

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §9, wiki item-attachment §7

*Given* project `P1` on workflow `W1` and project `P2` on workflow `W2`, Free item `X` in `P1` at workphase `w1` of `W1`, with attached child `X1` and detached child `X2` at workphase `w1b` of `W1`, and item `B` in `P2`, *when* `X` is reparented to `B` through the API and stays Free, *then* it is accepted: `X`, `X1` and `X2` all have `projectId = P2`, `X.workphaseId` is still `w1`, and `X2.workphaseId` is still `w1b`. Neither workphase is nulled or remapped, though neither is in `W2`. That is what `P2`'s board shows under Unsorted's "Unknown status" (wiki boards-columns-unsorted), until someone re-files them. `X1` still follows `X`'s workphase ([ATT-1.3](att-1-free-attached-state.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.5 — An Attached item reparented across workflows inherits its new parent's workphase

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §9

*Given* the projects and workflows of [ATT-5.4](att-5-cross-project-reparenting.md), item `X` attached to `A` in `P1`, with attached child `X1` and detached child `X2` at workphase `w1b` of `W1`, and item `B` in `P2` at workphase `w2` of `W2`, *when* `X` is reparented to `B` and stays attached, *then* `X` and `X1` take `w2`, inherited and cascaded as usual ([ATT-1.3](att-1-free-attached-state.md)), and `X` is positioned among `B`'s attached siblings ([ATT-3.1](att-3-reparent-placement-atomicity.md)). `X2`, detached, keeps `w1b`, as in [ATT-5.4](att-5-cross-project-reparenting.md). All three have `projectId = P2`.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.6 — An item created under a parent takes the parent's project

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §9

*Given* item `P` in project `P1`, *when* item `X` is created under `P` by a write that names no project, *then* `X.projectId = P1`. A hierarchy can't straddle two projects.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-5.7 — A create naming a project other than its parent's

**Priority:** P2 · **Status:** Pending PO

*Given* item `P` in project `P1`, *when* item `X` is created under `P` by a write that names project `P2`, *then* — **question for the PO:** a hierarchy can't straddle two projects (wiki item-attachment §9). Is the create refused, or does `X` take `P1`, the way a reparent's cascade overrides the moving subtree's project? The Reconciler found it is refused today.

**Automation test:** —

## ATT-5.8 — A write that names a workphase from a workflow the item's project doesn't use

**Priority:** P2 · **Status:** Pending PO

*Given* item `X` in project `P1` on workflow `W1`, and project `P2` on workflow `W2`, *when* a write names a workphase of `W2` for `X`:

- with no reparent, while `X` stays in `P1`;
- or in the same write that reparents `X` under an item in `P2`, re-filing it into `W2` in one step;

*then* — **question for the PO:** wiki item-attachment §9 accepts a cross-workflow reparent and leaves the moved items' workphases as they were, to be re-filed later. It doesn't say whether a write may name a workphase outside the workflow the item's project uses once the write lands, or whether a reparent may re-file in the same write. The Reconciler found that the move endpoint refuses both today.

**Automation test:** —

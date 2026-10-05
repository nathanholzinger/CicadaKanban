# ATT-5 — Cross-project and cross-workflow reparenting

**Next ID:** ATT-5.12

What a cross-project or cross-workflow reparent does to positions is item-positioning's ([TC-7.14](../item-positioning/part-7-board-placement-intents.md) and [TC-7.19](../item-positioning/part-7-board-placement-intents.md), and wiki item-positioning §7.3).

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-5.1 | Reparenting across two projects on the same workflow is accepted | P0 | Automated |
| ATT-5.2 | The new project cascades to the entire descendant subtree, detached descendants included | P0 | Automated |
| ATT-5.6 | An item created under a parent takes the parent's project | P1 | Automated |
| ATT-5.7 | A create naming a project other than its parent's is refused | P2 | Automated |
| ATT-5.9 | A cross-workflow reparent that would leave a Free item in the moved subtree is refused | P1 | Automated |
| ATT-5.10 | A cross-workflow reparent that leaves every moved item Attached is accepted | P1 | Automated |
| ATT-5.11 | A Free item reparented between a project with no workflow and one with a workflow | P2 | Pending PO |

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

## ATT-5.6 — An item created under a parent takes the parent's project

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki item-attachment §9

*Given* item `P` in project `P1`, *when* item `X` is created under `P` by a write that names no project, *then* `X.projectId = P1`. A hierarchy can't straddle two projects.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-5.7 — A create naming a project other than its parent's is refused

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki item-attachment §9

*Given* item `P` in project `P1`, and project `P2` on the same workflow, *when* item `X` is created under `P` by a write that names project `P2`, *then* it's refused with a 400, and no item is created. A hierarchy can't straddle two projects, even two on one workflow.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-5.9 — A cross-workflow reparent that would leave a Free item in the moved subtree is refused

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §9, wiki item-attachment §7

*Given* project `P1` on workflow `WF1` and project `P2` on `WF2`, item `B` in `P2` at workphase `w2` of `WF2`, and, in `P1`:

- Free item `X` at `w1` of `WF1`, with attached child `X1`;
- item `Y` attached to `A`, with detached child `Y2`;
- Free item `Z` at `w1`, with detached child `Z2`;

*when* any of these writes is made, by editing the item or by moving it, *then* it's refused with a 400, and nothing in `X`'s, `Y`'s or `Z`'s subtree changes:

- `X` is reparented to `B` and stays Free, naming no workphase or, in a move, naming `w2`;
- `Y` is reparented to `B` and stays attached;
- `Z` is attached to `B`.

Each would leave a Free item in the moved subtree: `X` itself, `Y2` or `Z2`. Naming `w2` for `X` doesn't help, since no write re-files items across workflows. The reparent that's accepted is [ATT-5.10](att-5-cross-project-reparenting.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.10 — A cross-workflow reparent that leaves every moved item Attached is accepted

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §9

*Given* the projects and workflows of [ATT-5.9](att-5-cross-project-reparenting.md), item `B` in `P2` at `w2`, and, in `P1`, Free item `X` at `w1` with attached child `X1`, and item `Y` attached to `A`, with attached child `Y1`, neither with a detached descendant, *when* `X` is attached to `B`, or `Y` is reparented to `B` and stays attached, *then* it's accepted: the moving item is attached to `B`, and it and its attached child are in `w2` and in `P2`. Their positions are [TC-7.19](../item-positioning/part-7-board-placement-intents.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-5.11 — A Free item reparented between a project with no workflow and one with a workflow

**Priority:** P2 · **Status:** Pending PO

*Given* project `P0`, which has no workflow, holding Free item `X` with no workphase, and item `B` in project `P2` on workflow `WF2`, at workphase `w2`, *when* `X` is reparented under `B` and stays Free, naming `w2` or no workphase, *then* — **question for the PO:** wiki item-attachment §9 refuses a cross-workflow reparent that would leave a Free item in the moved subtree, since that item would keep a workphase of its old workflow. `X` has no workflow to leave and no workphase to keep, and wiki item-attachment §2a lets a Free item have none. Is a reparent between a project with no workflow and one with a workflow cross-workflow, and so refused? Or is it accepted, leaving `X` Free in `P2`, in `w2` or with no workphase? The same question runs the other way: a Free item in `w2`, reparented under an item in `P0`, would keep `w2` in a project that uses no workflow.

**Automation test:** —

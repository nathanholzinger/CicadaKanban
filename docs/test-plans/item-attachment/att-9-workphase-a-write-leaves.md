# ATT-9 — The workphase a write leaves an item in

**Next ID:** ATT-9.14

**The setup,** for the cases that name it: workflow `WF`, with non-terminal workphases `W1`, `W2` and `W3`, and project `P1` on `WF`. In `P1`, `R` is a top-level item in `W1`, and `D` is a detached child of `R`, in `W2`. `A` is attached to `D`, and `X` is attached to `A`, so `A` and `X` are Stubs in `D`'s Card, and `D` is the nearest Free ancestor of each.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-9.1 | A move that leaves an item Attached can't name a workphase other than its parent's | P1 | Automated |
| ATT-9.2 | A create that makes an Attached child can't name a workphase other than its parent's | P2 | Automated |
| ATT-9.3 | An Attached item shows with its parent, whatever its own `workphaseId` says | P1 | Automated |
| ATT-9.4 | A detach that names no workphase leaves the item in the one it was shown in | P0 | Automated |
| ATT-9.5 | A reparent to root of an Attached item that names no workphase leaves it in the one it was shown in | P1 | Automated |
| ATT-9.6 | A detached child created with no workphase takes the one its parent is shown in | P1 | Automated |
| ATT-9.7 | When the nearest Free ancestor has no workphase, a write that leaves an item Free must name a workphase or `null` | P1 | Automated |
| ATT-9.8 | A move can't leave a Free item in a workphase its project's workflow doesn't use | P1 | Automated |
| ATT-9.9 | A create can't name a workphase its project's workflow doesn't use | P2 | Automated |
| ATT-9.10 | A detach that also reparents, naming no workphase, leaves the item in the one it was shown in | P2 | Automated |
| ATT-9.11 | Naming `workphaseId: null` leaves an item Free with no workphase, whatever it was shown in | P2 | Automated |
| ATT-9.12 | A write that names a workphase that doesn't exist is refused | P2 | Automated |
| ATT-9.13 | A workphase given as an empty string names no workphase, and is refused | P2 | Open |

---

## ATT-9.1 — A move that leaves an item Attached can't name a workphase other than its parent's

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, and top-level item `F` in `W1`, *when* a move leaves `X` attached to `A` and names `W3`, *then* it's refused with a 400 whose message says to omit the workphase or name the parent's, and `X` is unchanged. *When* the move names `W2`, `A`'s workphase, or no workphase, *then* it's accepted, and `X` is in `W2`. The parent that counts is the one after the write:

- a move that attaches `F` to `A` and names `W2` is accepted, and `F` is attached, in `W2`. One that names `W1`, `F`'s own workphase, is refused the same way;
- a move that detaches `X` and names `W3` is accepted, and `X` is Free in `W3`.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.2 — A create that makes an Attached child can't name a workphase other than its parent's

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, *when* a create makes item `Y` attached to `A` and names `W3`, *then* it's refused with a 400 whose message says to omit the workphase or name the parent's, and no item is created. A create that names `W2`, or no workphase, is [ATT-10.3](att-10-creating-an-item.md)'s.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.3 — An Attached item shows with its parent, whatever its own `workphaseId` says

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a, wiki boards-columns-unsorted §10

*Given* the setup, with `X`'s own `workphaseId` changed by a direct database edit, to `W3` or to none, *when* the board renders, *then* `X` is still a Stub in `D`'s Card. No column shows `X` as a Card, and the board doesn't show it in Unsorted. That the API's `unsorted.invalidItems` lists it is [BCU-5.4](../boards-columns-unsorted/bcu-5-unsorted.md)'s.

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`, `client/src/components/UnsortedBucket.test.tsx`

## ATT-9.4 — A detach that names no workphase leaves the item in the one it was shown in

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, *when* `X` is detached with no workphase in the write, *then* `X` is Free in `W2`, the workphase of `D`, whose Card it was shown in. It isn't `W1`, the root's. *And given* `X`'s own `workphaseId` was changed to `W3` by a direct database edit, *then* the detach still leaves `X` in `W2`. *And when* `D` then moves to `W1`, *then* `A` follows it, and `X`, now detached, stays in `W2` ([ATT-1.6](att-1-free-attached-state.md)). The board's side, a detach in place that doesn't move the item to a merged column's entry workphase, is [DRAG-5.2](../board-drag-interaction/drag-5-detach-and-overflow.md)'s.

**Automation test:** `server/tests/routes/items.workphase.test.ts`, `server/tests/routes/items.hierarchy.test.ts`, `tests/ui/attached-children.spec.ts`

## ATT-9.5 — A reparent to root of an Attached item that names no workphase leaves it in the one it was shown in

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, *when* a write sets `X.parentId` to null and names no workphase, whether it edits `X` or moves it, *then* `X` is top-level and Free, in `W2`, `D`'s workphase, not `W1`, the root's. *And given* `X`'s own `workphaseId` was changed to `W3` by a direct database edit, *then* `X` is still left in `W2`.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.6 — A detached child created with no workphase takes the one its parent is shown in

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a, wiki item-attachment §14

*Given* the setup, *when* item `Y` is created under `A` with the attachment flag clear and no workphase, *then* `Y` is a detached child of `A`, Free, in `W2`: `A` is shown in `D`'s Card, and `D` is in `W2`. *And given* `A`'s own `workphaseId` was changed to `W3` by a direct database edit, *then* `Y` is still in `W2`. *When* `Y` is instead created the same way under `D`, *then* it's in `W2`, `D`'s own workphase.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.7 — When the nearest Free ancestor has no workphase, a write that leaves an item Free must name a workphase or `null`

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, with `D` moved out of any workphase, so `D`, `A` and `X` have none, *when* any of the writes of [ATT-9.4](att-9-workphase-a-write-leaves.md), [ATT-9.5](att-9-workphase-a-write-leaves.md) and [ATT-9.6](att-9-workphase-a-write-leaves.md) names no workphase, *then* it's refused with a 400, and nothing is stored. The message offers two ways out, naming a workphase in the same write or filing `D` into a workphase first, and doesn't suggest `null`.

- *When* the detach names `W1` instead, *then* it's accepted, and `X` is Free in `W1`.
- *When* it names `workphaseId: null`, *then* it's accepted, and `X` is Free with no workphase.
- *When* `D` is first moved to `W3`, *then* the detach naming no workphase is accepted, and `X` is Free in `W3`.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.8 — A move can't leave a Free item in a workphase its project's workflow doesn't use

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* project `P1` on workflow `WF1`, another workflow `WF2` with workphase `v`, Free item `F` in `P1` at workphase `w1` of `WF1`, and item `B` in `P1`, *when* a move names `v` for `F`, with no reparent, or while reparenting `F` under `B` and leaving it Free, *then* each is refused with a 400, and `F` is unchanged. A cross-workflow reparent that names a workphase of the new workflow is [ATT-5.9](att-5-cross-project-reparenting.md)'s.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.9 — A create can't name a workphase its project's workflow doesn't use

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the projects and workflows of [ATT-9.8](att-9-workphase-a-write-leaves.md), *when* a create makes a top-level item in `P1`, or a detached child of `B`, and names `v`, *then* it's refused with a 400, and no item is created. Under an attached parent, naming `v` is [ATT-9.2](att-9-workphase-a-write-leaves.md)'s.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.10 — A detach that also reparents, naming no workphase, leaves the item in the one it was shown in

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, and top-level item `B` in `W3`, *when* a write gives `X` parent `B`, clears its attachment flag and names no workphase, *then* `X` is a detached child of `B`, Free, in `W2`: the workphase of `D`, whose Card it was shown in before the write. It isn't `W3`, `B`'s. *And given* `X`'s own `workphaseId` was changed to `W1` by a direct database edit, *then* `X` is still left in `W2`. *And given* `D` has no workphase, *then* the write is refused with a 400, as the writes of [ATT-9.7](att-9-workphase-a-write-leaves.md) are, and nothing is stored.

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.11 — Naming `workphaseId: null` leaves an item Free with no workphase, whatever it was shown in

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, in which `D`, whose Card `X` is shown in, is in `W2`, *when* `X` is detached naming `workphaseId: null`, *then* it's accepted, and `X` is Free with no workphase, not in `W2`. *When* item `Y` is created under `A` with the attachment flag clear and `workphaseId: null`, *then* `Y` is a detached child of `A` with no workphase. Where the Card has no workphase, `null` is one of the ways out ([ATT-9.7](att-9-workphase-a-write-leaves.md)).

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.12 — A write that names a workphase that doesn't exist is refused

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §2a

*Given* the setup, and an id `Q` that names no workphase, *when* each of these writes names `Q`:
- a create of a top-level item in `P1`;
- a create of a child attached to `A`;
- a create of a detached child of `A`;
- a move of `R`, which leaves it Free;
- a move that leaves `X` attached to `A`;

*then* each is refused with a 400, no item is created, and `R` and `X` are unchanged. A workphase that doesn't exist is neither the parent's nor one `WF` uses, so it's refused whether the write leaves the item Attached ([ATT-9.1](att-9-workphase-a-write-leaves.md), [ATT-9.2](att-9-workphase-a-write-leaves.md)) or Free ([ATT-9.8](att-9-workphase-a-write-leaves.md), [ATT-9.9](att-9-workphase-a-write-leaves.md)).

**Automation test:** `server/tests/routes/items.workphase.test.ts`

## ATT-9.13 — A workphase given as an empty string names no workphase, and is refused

**Priority:** P2 · **Status:** Open · **Rule:** wiki item-attachment §2a, wiki row-references §1

*Given* the setup, *when* each of these writes names `workphaseId: ""`:
- a create of a top-level item in `P1`;
- a create of a child attached to `A`;
- a create of a detached child of `A`;
- a move of `R`, which leaves it Free;
- a move that leaves `X` attached to `A`;

*then* each is refused with a 400, no item is created, and `R` and `X` are unchanged. An empty string isn't `null`, which leaves an item Free with no workphase ([ATT-9.11](att-9-workphase-a-write-leaves.md)), and it isn't a workphase left out, which keeps an item where it's shown ([ATT-9.4](att-9-workphase-a-write-leaves.md)). A workphase that doesn't exist is [ATT-9.12](att-9-workphase-a-write-leaves.md)'s.

**Automation test:** —

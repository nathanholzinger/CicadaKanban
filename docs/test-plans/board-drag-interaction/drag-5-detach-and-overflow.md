# DRAG-5 — Stub → out: detach

**Next ID:** DRAG-5.15

**Terms.** *The full zoom-in hold* is as in [DRAG-1](drag-1-contexts-and-popping.md). A Stub's drag starts at its containing Card's Descendants layer. Leaving the Card is two one-layer pops, each on `popDelayMs` (or `popDistancePx`): Descendants → Card, with the cursor outside the descendants section, then Card → the column that holds the Card, with the cursor outside the Card's box. The attachment side of a detach is [ATT-7](../item-attachment/att-7-detach-preserves-parent.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-5.1 | A Stub popped out to the column becomes Free, and is placed by the column's within-action | P0 | Open |
| DRAG-5.2 | Detaching in place keeps the inherited workphase, even a merged column's non-entry workphase | P0 | Open |
| DRAG-5.3 | Detaching into a different column goes through Board and takes that column's workphase by its band | P0 | Open |
| DRAG-5.4 | A Stub zoomed into a different Card is reparented, as that Card's last child | P0 | Automated |
| DRAG-5.5 | A momentary excursion out of the descendants section doesn't detach | P0 | Automated |
| DRAG-5.9 | A Stub drag's within-action is hierarchy placement: reorder and reparent inside the Card need no detach | P0 | Open |
| DRAG-5.10 | A detached Stub is shown as a Card from the column layer on | P1 | Open |
| DRAG-5.11 | A decisive pull away from the Card cascades Descendants → Card → column, one layer at a time | P1 | Open |
| DRAG-5.12 | A Stub released at its own parent's Card layer is set back down, and nothing is written | P0 | Automated |
| DRAG-5.13 | A nested Stub's drag starts in its containing Card's section, and popping out lands on that Card | P1 | Open |
| DRAG-5.14 | A Stub detached in place inside a done column becomes a done Free item | P1 | Open |

---

## DRAG-5.1 — A Stub popped out to the column becomes Free, and is placed by the column's within-action

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

*Given* Stub `X` attached to Card `P`, in a column rendering `P, Q`, *when* `X` is dragged, the cursor stays outside `P`'s descendants section for `popDelayMs` (out to `P`'s Card layer), then outside `P`'s box for `popDelayMs` (out to the column), and the user releases with the ghost after `Q` and the side highlight on `Q`, *then* the request writes `isAttached: false` and leaves `parentId` alone: `X.parentId` is still `P` ([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)), and `X` is placed in the workflow-wide scope by `{anchorId: Q, side: after}` ([TC-7.13](../item-positioning/part-7-board-placement-intents.md)). `X` now renders as a Card ([DRAG-5.10](drag-5-detach-and-overflow.md)). Moving a Stub out of its Card is a detach, never a reparent.

**Automation test:** —

## DRAG-5.2 — Detaching in place keeps the inherited workphase, even a merged column's non-entry workphase

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki item-positioning §4

*Given* a merged column covering `W2, W3`, with `W2` its entry workphase, Card `P` in `W3`, and Stub `X` attached to `P` (so `X.workphaseId` is `W3`), *when* `X` is detached by popping out to `P`'s column and releasing there ([DRAG-5.1](drag-5-detach-and-overflow.md)), *then* the request carries **no** workphase change, and `X.workphaseId` is still `W3` afterwards. `X` was already a member of the column's covered set, so this is a position-only move ([DRAG-3.7](drag-3-card-column-bands.md)). The entry workphase applies only to a drop into a column the item wasn't already in, and `X` must not be moved back to `W2`.

**Automation test:** —

## DRAG-5.3 — Detaching into a different column goes through Board and takes that column's workphase by its band

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki board-drag-interaction §5

*Given* Stub `X` attached to `P` in column `C1`, and a different column `C2` whose covered set doesn't include `X`'s inherited workphase, *when* `X` pops out to `C1` ([DRAG-5.1](drag-5-detach-and-overflow.md)), then out of `C1` to Board ([DRAG-1.3](drag-1-contexts-and-popping.md)), and is released in one of `C2`'s bands, *then* the commit is a detach plus that band's meaning in `C2` ([DRAG-3.1](drag-3-card-column-bands.md), [DRAG-3.2](drag-3-card-column-bands.md), [DRAG-3.3](drag-3-card-column-bands.md)): `C2`'s entry workphase (or the sub-row's own workphase in an expanded column), with the band's anchor and side, or no anchor for the middle band. `X.parentId` is still `P`. *When* the cursor instead stays in `C2`'s middle band for `popInDelayMs` before the release, *then* `X` is locked in `C2`, and the release is `C2`'s reposition.

**Automation test:** —

## DRAG-5.4 — A Stub zoomed into a different Card is reparented, as that Card's last child

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §8, wiki board-drag-interaction §6

*Given* Stub `X` attached to `P`, and a different Valid Card `Q` in the same column, *when* `X` pops out to the column ([DRAG-5.1](drag-5-detach-and-overflow.md)), the side highlight names `Q` for the full zoom-in hold, and the user releases, *then* the commit is a reparent: `X.parentId = Q`, attached, workphase inherited from `Q`, and last among `Q`'s children, since `X` arrived from outside `Q` ([DRAG-4.1](drag-4-attach-and-stub-placement.md), [ATT-7.5](../item-attachment/att-7-detach-preserves-parent.md)). It never passes through a detach that leaves `parentId = P`. Going on into `Q`'s descendants section places `X` precisely instead ([DRAG-4.8](drag-4-attach-and-stub-placement.md)). A `Q` in another column is reached the same way, after Board and that column's pop in ([DRAG-4.15](drag-4-attach-and-stub-placement.md)).

**Automation test:** `tests/ui/drag-5-stub-detach.spec.ts`

## DRAG-5.5 — A momentary excursion out of the descendants section doesn't detach

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3.1, wiki board-drag-interaction §8

*Given* Stub `X` attached to `P`, with siblings `S1, S2`, at `P`'s Descendants layer, *when* the cursor briefly leaves the descendants section, for less than `popDelayMs`, during a sibling reorder and comes back, and the user releases with the ghost below `S2` at `S2`'s depth, *then* the commit is a sibling reorder within `P`, `{anchorId: S2, side: after}` ([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md), [DRAG-4.9](drag-4-attach-and-stub-placement.md)), with `X` still attached to `P`.

This case asserts the clock's logic, with its threshold as a parameter; its pass never depends on the tuned values. Whether they feel right is [DRAG-1.32](drag-1-contexts-and-popping.md).

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/dragRequest.test.ts`

## DRAG-5.9 — A Stub drag's within-action is hierarchy placement: reorder and reparent inside the Card need no detach

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki board-drag-interaction §7.1

*Given* Stub `X` attached to Card `P`, whose Stubs are `S1, X, S2`, where `S1` has a child `S1a`, *when* `X` is picked up and, without ever leaving `P`'s descendants section, released with the ghost:

- in the gap above `S1` → `{anchorId: S1, side: before}`, `X.parentId = P`, still attached;
- in the gap below `S2`, at `S2`'s depth → `{anchorId: S2, side: after}`, `X.parentId = P`;
- in the gap below `S1a`, one tab right of `S1a` → `X.parentId = S1a`, attached, as its first child: a reparent within `P`'s hierarchy with no detach;
- in a tab state past `CAP` → marked invalid, and a release writes nothing ([DRAG-4.18](drag-4-attach-and-stub-placement.md));

*then* in every case `X` stays attached and never passes through a Free state, and `X.workphaseId` stays `P`'s. The common case, reordering among siblings, costs no pop.

**Automation test:** —

## DRAG-5.10 — A detached Stub is shown as a Card from the column layer on

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a, wiki board-drag-interaction §8

*Given* Stub `X` attached to `P`, *when* `X` pops out to `P`'s column ([DRAG-5.1](drag-5-detach-and-overflow.md)), *then* from that moment both its carried copy and its ghost are shortCard in the column's list, no longer Stub rows, and `X` is absent from `P`'s descendants section for the rest of the drag. *When* `X` then zooms into a Card `Q` ([DRAG-5.4](drag-5-detach-and-overflow.md)), *then* both copies are Stub rows again, inside `Q` ([DRAG-3.22](drag-3-card-column-bands.md)). *When* the drag is cancelled, or released where nothing is written ([DRAG-1.9](drag-1-contexts-and-popping.md)), after `X` has popped out, *then* `X` renders back as `P`'s Stub, unchanged.

**Automation test:** —

## DRAG-5.11 — A decisive pull away from the Card cascades Descendants → Card → column, one layer at a time

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

*Given* `popDistancePx` above 0, and Stub `X` at `P`'s Descendants layer, *when* the cursor is pulled in one motion to a point at least `popDistancePx` outside `P`'s descendants section and at least `popDistancePx` outside `P`'s box, *then* `X` pops out to `P`'s Card layer, and the Card's own pop out, judged afresh against the same distant cursor, fires straight after: `X` arrives locked in the column, shown as a Card, and a release commits the detach and the column's reposition ([DRAG-5.1](drag-5-detach-and-overflow.md)). Both pops happen, in that order. *When* the cursor instead stops inside `P`'s box but outside its descendants section, *then* only the first pop happens, and a release sets `X` back down ([DRAG-5.12](drag-5-detach-and-overflow.md)).

A single cursor sample decides both pops, so this case holds at whatever values the test sets; its pass never depends on the tuned values.

**Automation test:** —

## DRAG-5.12 — A Stub released at its own parent's Card layer is set back down, and nothing is written

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §8, wiki board-drag-interaction §6

*Given* Stub `X` attached to `P` at position `p`, among `P`'s Stubs `S1, X, S2`, *when* `X` pops out of the descendants section to `P`'s Card layer and the user releases anywhere inside `P`'s box, *then* **nothing is written**: no request is made, `X.parentId` is `P`, `X` is attached, `X.position` is `p`, and `X` renders back between `S1` and `S2`. For an item brought in from outside `P`, the same release attaches it as the last child ([DRAG-4.1](drag-4-attach-and-stub-placement.md), [DRAG-4.14](drag-4-attach-and-stub-placement.md)). Where the drag started decides which, not anything about the release.

**Automation test:** `tests/ui/drag-5-stub-detach.spec.ts`

## DRAG-5.13 — A nested Stub's drag starts in its containing Card's section, and popping out lands on that Card

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §1, wiki board-drag-interaction §8

*Given* Card `P` with Stub `S1`, which has its own child `S1a`, *when* `S1a` is picked up, *then* its drag starts in `P`'s descendants section, the same section `S1`'s drag would start in, not a list of `S1`'s children. *When* the cursor then stays outside `P`'s descendants section for `popDelayMs`, *then* `S1a` pops out to `P`'s Card layer, never to `S1`, and a release there sets it back down ([DRAG-5.12](drag-5-detach-and-overflow.md)).

**Automation test:** —

## DRAG-5.14 — A Stub detached in place inside a done column becomes a done Free item

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki item-attachment §11, wiki item-positioning §7.4

*Given* Card `P` in a done column's terminal workphase, with Stub `X` attached to it, *when* `X` is detached by popping out to that done column and released there, *then* the request writes `isAttached: false`, with no workphase change and no anchor, since a Free done item can't be named as an anchor. `X.parentId` is still `P`. As a Free item in a terminal workphase, `X` gets `completedAt` in the same change and has no position ([ATT-7.4](../item-attachment/att-7-detach-preserves-parent.md)), and it previews and lands as the newest completion ([DRAG-6.11](drag-6-preview-reconciliation.md)).

**Automation test:** —

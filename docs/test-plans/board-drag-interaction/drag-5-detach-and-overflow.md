# DRAG-5 — Stub → out: detach

**Next ID:** DRAG-5.16

**Terms.** *The full zoom-in hold* is as in [DRAG-1](drag-1-contexts-and-popping.md). A column is merged unless a case says expanded. The attachment side of a detach is [ATT-7](../item-attachment/att-7-detach-preserves-parent.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-5.1 | A Stub popped out to the column becomes Free, and is placed by the column's within-action | P0 | Open |
| DRAG-5.2 | Detaching in place keeps the inherited workphase, even a merged column's non-entry workphase | P0 | Open |
| DRAG-5.3 | Detaching into a different column goes through Board and takes that column's workphase by its band | P0 | Open |
| DRAG-5.4 | A Stub zoomed into a different Card is reparented, as that Card's last child | P0 | Automated |
| DRAG-5.5 | A momentary excursion out of the Card's box doesn't detach | P0 | Open |
| DRAG-5.9 | A Stub drag's within-action is hierarchy placement: reorder and reparent inside the Card need no detach | P0 | Open |
| DRAG-5.10 | A detached Stub is shown as a Card from the column layer on | P1 | Open |
| DRAG-5.13 | A nested Stub starts in its containing Card's Descendants and pops to that Card's column | P1 | Open |
| DRAG-5.14 | A Stub detached in place inside a done column becomes a done Free item | P1 | Open |
| DRAG-5.15 | Title and padding stay inside Descendants, and a release there commits gap and depth | P0 | Open |

---

## DRAG-5.1 — A Stub popped out to the column becomes Free, and is placed by the column's within-action

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

*Given* Stub `X` attached to Card `P`, in a column rendering `P, Q`, *when* `X` is dragged and the cursor stays outside `P`'s whole box but inside the column for `popDelayMs`, *then* exactly one pop takes `X` directly to the column, Free and bounded by that column. *When* the user releases with the ghost after `Q` and the side highlight on `Q`, *then* the request writes `isAttached: false` and leaves `parentId` alone: `X.parentId` is still `P` ([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)), and `X` is placed in the workflow-wide scope by `{anchorId: Q, side: after}` ([TC-7.13](../item-positioning/part-7-board-placement-intents.md)). `X` now renders as a Card ([DRAG-5.10](drag-5-detach-and-overflow.md)). Moving a Stub out of its Card is a detach, never a reparent. In an expanded column, that one pop lands in the sub-row that contains `P`, never the whole column or a sibling sub-row.

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

*Given* Stub `X` attached to `P`, and a different Valid Card `Q` in the same column, *when* `X` pops out to the column ([DRAG-5.1](drag-5-detach-and-overflow.md)), the side highlight names `Q` for the full zoom-in hold, and the user releases immediately after the zoom without moving the cursor, *then* the commit is a reparent: `X.parentId = Q`, attached, workphase inherited from `Q`, and last among `Q`'s children, since `X` arrived from outside `Q` ([DRAG-4.1](drag-4-attach-and-stub-placement.md), [ATT-7.5](../item-attachment/att-7-detach-preserves-parent.md)). It never passes through a committed detach that leaves `parentId = P`. Moving the cursor after the zoom places `X` precisely at the same Descendants layer ([DRAG-4.34](drag-4-attach-and-stub-placement.md)). A `Q` in another column is reached the same way, after Board and that column's pop in ([DRAG-4.15](drag-4-attach-and-stub-placement.md)).

**Automation test:** `tests/ui/drag-5-stub-detach.spec.ts`

## DRAG-5.5 — A momentary excursion out of the Card's box doesn't detach

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §3.1, wiki board-drag-interaction §8

*Given* Stub `X` attached to `P`, with siblings `S1, S2`, at `P`'s Descendants layer, *when* the cursor briefly leaves the whole Card's box without satisfying either `popDelayMs` or the enabled `popDistancePx`, comes back during a sibling reorder, and the user releases with the ghost below `S2` at `S2`'s depth, *then* no pop happened, and the commit is a sibling reorder within `P`, `{anchorId: S2, side: after}` ([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md), [DRAG-4.9](drag-4-attach-and-stub-placement.md)), with `X` still attached to `P`. Returning inside the Card resets the pop-out clock: the next excursion starts at zero.

This case asserts the clock's logic, with its threshold as a parameter; its pass never depends on the tuned values. Whether they feel right is [DRAG-1.32](drag-1-contexts-and-popping.md).

**Automation test:** —

## DRAG-5.9 — A Stub drag's within-action is hierarchy placement: reorder and reparent inside the Card need no detach

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki hierarchy-placement §1, wiki hierarchy-placement §2

*Given* Stub `X` attached to Card `P`, whose Stubs are `S1, X, S2`, where `S1` has a child `S1a`, *when* `X` is picked up and, without ever leaving `P`'s descendants section, released with the ghost:

- in the gap above `S1` → `{anchorId: S1, side: before}`, `X.parentId = P`, still attached;
- in the gap below `S2`, at `S2`'s depth → `{anchorId: S2, side: after}`, `X.parentId = P`;
- in the gap below `S1a`, one tab right of `S1a` → `X.parentId = S1a`, attached, as its first child: a reparent within `P`'s hierarchy with no detach;
- in a tab state past `CAP` → marked invalid, and a release writes nothing ([DRAG-4.18](drag-4-attach-and-stub-placement.md));

*then* in every case `X` stays attached and never passes through a Free state, and `X.workphaseId` stays `P`'s. The common case, reordering among siblings, costs no pop.

**Automation test:** —

## DRAG-5.10 — A detached Stub is shown as a Card from the column layer on

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a, wiki board-drag-interaction §8

*Given* Stub `X` attached to `P`, *when* `X` pops out to `P`'s column ([DRAG-5.1](drag-5-detach-and-overflow.md)), *then* from that moment both its carried copy and its ghost are shortCard in the column's list, no longer Stub rows, and `X` is absent from `P`'s descendants section while outside `P`. *When* `X` then zooms into a Card `Q` ([DRAG-5.4](drag-5-detach-and-overflow.md)), *then* both copies are Stub rows again, inside `Q` ([DRAG-3.22](drag-3-card-column-bands.md)). This also holds on zooming back into `P` during the same drag. *When* the drag is cancelled, or released where nothing is written ([DRAG-1.9](drag-1-contexts-and-popping.md)), after `X` has popped out, *then* `X` renders back as `P`'s Stub, unchanged.

**Automation test:** —

## DRAG-5.13 — A nested Stub starts in its containing Card's Descendants and pops to that Card's column

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §1, wiki board-drag-interaction §8, wiki board-drag-interaction §10

*Given* Card `P` with Stub `S1`, whose child `S1a` has a child of its own, `S1b`, *when* `S1a` is picked up, *then* its drag starts in `P`'s Descendants layer, bounded by `P`'s whole box, the same context `S1`'s drag would start in, not a list of `S1`'s children. *When* the cursor then stays outside `P`'s box but inside its column for `popDelayMs`, *then* one pop takes `S1a` directly to that column, never to `S1` or another nested context. Both copies are shortCard, and `P`'s section shows neither `S1a` nor its carried subtree. A release with the ghost after Card `Q` writes `S1a.isAttached: false`, `S1a.parentId = S1`, and `{anchorId: Q, side: after}`, with `S1b` still attached beneath `S1a`.

**Automation test:** —

## DRAG-5.14 — A Stub detached in place inside a done column becomes a done Free item

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §8, wiki item-attachment §11, wiki item-positioning §7.4

*Given* Card `P` in a done column's terminal workphase, with Stub `X` attached to it, *when* `X` is detached by popping out to that done column and released there, *then* the request writes `isAttached: false`, with no workphase change and no anchor, since a Free done item can't be named as an anchor. `X.parentId` is still `P`. As a Free item in a terminal workphase, `X` gets `completedAt` in the same change and has no position ([ATT-7.4](../item-attachment/att-7-detach-preserves-parent.md)), and it previews and lands as the newest completion ([DRAG-6.11](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-5.15 — Title and padding stay inside Descendants, and a release there commits gap and depth

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §7, wiki board-drag-interaction §8

*Given* Stub `X` picked up from between siblings `S1` and `S2` inside Card `P`, *when* the cursor moves outside the section's rows but remains over `P`'s title or padding for longer than `popDelayMs`, *then* the drag stays at `P`'s Descendants layer, both copies remain Stub rows, and no pop-out clock runs. Distance from the section's smaller box doesn't satisfy `popDistancePx` either: only the whole Card bounds the layer. *When* the user releases there with the ghost above `S1`, at depth 0, *then* the request places `X` as `P`'s first child, before `S1`, still attached and in `P`'s workphase. It doesn't restore the pickup slot between `S1` and `S2`. A release in its own gap and depth is the separate no-write case ([DRAG-4.29](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

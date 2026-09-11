# DRAG-5 — Stub → out: detach, and the depth-overflow placeholder

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §8, §9

**Suite ID:** `DRAG-5`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-5.n`.

**Supersedes** [`TC-3.3`](../item-positioning/part-3-attached-sibling-reorder.md)
(the Epic 3.2 "drag out of parent is blocked" guard). The attachment-side
consequences of a detach are [ATT-7](../item-attachment/att-7-detach-preserves-parent.md).

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A Stub popped out of its parent Card becomes Free and is positioned by the receiving context | P0 | ⏳ pending triage |
| TC-2 | Detaching in place keeps the inherited workphase — even a non-entry workphase of a merged column | P0 | ⏳ pending triage |
| TC-3 | Detaching into a different column takes that column's workphase per its bands | P0 | ⏳ pending triage |
| TC-4 | A Stub landing inside a different parent's context is a reparent | P0 | ⏳ pending triage |
| TC-5 | A momentary excursion out of the parent does not detach | P0 | ⏳ pending triage |
| TC-6 | Dragging a Stub over "see X children" and holding opens the overflow modal mid-drag | P1 | ⏳ pending triage |
| TC-7 | Placement inside the overflow modal follows the hierarchy ruleset unchanged | P1 | ⏳ pending triage |
| TC-8 | Clicking "see X children" opens the same modal | P2 | ⏳ pending triage |

---

## TC-1 — A Stub popped out of its parent Card becomes Free and is positioned by the receiving context

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, `P` in a column region rendering `P, Q`,
*when* `X` is dragged, the cursor leaves `P`'s context and rests in the
column region for ≥ `THRESHOLD` (pop), and the user releases hovering
the lower half of `Q`, *then* the committed change is: `X`'s attachment
cleared, `X.parentId` still `P` ([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)),
and `X` positioned in the workflow-wide scope via `{anchorId: Q, side:
after}` ([TC-7.13](../item-positioning/part-7-board-placement-intents.md)).
`X` now renders as a Card.

**Automation test:** —

## TC-2 — Detaching in place keeps the inherited workphase — even a non-entry workphase of a merged column

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a merged column covering `W2, W3` (`W2` is the entry workphase),
`P` in `W3`, and Stub `X` attached to `P` (so `X.workphaseId = W3`),
*when* `X` is detached by dragging it out of `P` and releasing within the
same column, *then* the request carries **no** workphase change and after
the commit `X.workphaseId` is still `W3`. `X` was already a member of
the column's covered set, so this is a position-only reorder by the
covered-set rule ([TC-4.2](../item-positioning/part-4-merged-column.md));
"takes the first workphase in the range" applies only to a drop into a
column the item wasn't already in. `X` must not be silently walked back
to `W2`.

**Automation test:** —

## TC-3 — Detaching into a different column takes that column's workphase per its bands

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P` in column `C1`, and a different column
`C2` whose covered set does not include `X`'s inherited workphase, *when*
`X` is dragged out of `P`, popped into `C2`'s region, and released in one
of `C2`'s bands, *then* the commit is a detach plus whatever that band
means in `C2` ([DRAG-3](drag-3-card-column-bands.md)): the entry
workphase of `C2` (or the exact sub-row workphase in expanded mode), with
the band's anchor+side or — for the middle band — the workphase-only
form. `X.parentId` is still `P`.

**Automation test:** —

## TC-4 — A Stub landing inside a different parent's context is a reparent

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [ATT-7.5](../item-attachment/att-7-detach-preserves-parent.md).
*Given* Stub `X` attached to `P` and a different Card `Q`, *when* `X` is
dragged out of `P` and pops into `Q`'s context (sustained ≥ `THRESHOLD`)
and is released, *then* the commit is a reparent: `X.parentId = Q`,
attached, workphase inherited from `Q`, position among `Q`'s Stubs at the
dropped slot ([DRAG-4.4](drag-4-attach-and-stub-placement.md)). It is not
a detach that left `parentId = P`.

**Automation test:** —

## TC-5 — A momentary excursion out of the parent does not detach

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P` with siblings `S1, S2`, *when* the cursor
briefly leaves `P`'s context (for less than `THRESHOLD`) during a sibling
reorder and returns, and the user releases hovering `S2`, *then* the
commit is a sibling reorder within `P` ([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md))
— `X` still attached to `P`. Popping out is never incidental
([DRAG-1.3](drag-1-contexts-and-popping.md)).

**Automation test:** —

## TC-6 — Dragging a Stub over "see X children" and holding opens the overflow modal mid-drag

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `P` whose descendant hierarchy is too deep to list, showing
the "see X children" placeholder in place of the remaining Stubs, *when*
a Stub is dragged over the placeholder and the cursor rests there past
the configured threshold, *then* the expanded-hierarchy modal opens while
the drag is still in progress — the drag is not cancelled or restarted,
and the dragged item can be placed inside the modal (TC-7).

*(The wiki says "a threshold" for this without naming it; parameterize on
whatever the dev/test panel exposes for it, and don't assume it equals the
pop `THRESHOLD`.)*

**Automation test:** —

## TC-7 — Placement inside the overflow modal follows the hierarchy ruleset unchanged

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the modal open mid-drag per TC-6, showing `P`'s full hierarchy,
*when* the dragged item is released above an anchor, below it, or below
and indented, *then* the commits are exactly
[DRAG-4.8](drag-4-attach-and-stub-placement.md),
[DRAG-4.9](drag-4-attach-and-stub-placement.md), and
[DRAG-4.10](drag-4-attach-and-stub-placement.md) respectively — the same
three-way ruleset, with the depth cap and cycle rules applying to targets
in the modal as anywhere else.

**Automation test:** —

## TC-8 — Clicking "see X children" opens the same modal

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* the placeholder on `P`, *when* it is clicked (no drag), *then* the
same wider modal opens showing `P`'s full hierarchy.

**Automation test:** —

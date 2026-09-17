# DRAG-5 — Stub → out: detach, and the depth-overflow placeholder

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §8 (hardened 2026-09-17; Story 5, not built), §9 (open question — Story 7)

**Suite ID:** `DRAG-5`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-5.n`.

**Supersedes** [`TC-3.3`](../item-positioning/part-3-attached-sibling-reorder.md)
(the Epic 3.2 "drag out of parent is blocked" guard). The attachment-side
consequences of a detach are [ATT-7](../item-attachment/att-7-detach-preserves-parent.md).

**Where a Stub drag starts, and how it leaves (Story 5).** A Stub picked
up among its siblings starts at its parent Card's **Descendants** layer
([DRAG-1.1](drag-1-contexts-and-popping.md)), so its within-action is
hierarchy placement ([DRAG-4.8–4.11](drag-4-attach-and-stub-placement.md))
— a plain sibling reorder is the golden path and costs no pop. Leaving
the parent is **two** one-layer zoom-outs, each on the shared `POP_OUT`
clock (or `POP_OUT_DISTANCE`): Descendants → Card (cursor outside the
descendants section), then Card → the column that contains it (cursor
outside the Card's box). There is no two-layers-at-once rule; a decisive
pull away from the whole Card is expected to satisfy both in quick
succession through the distance term (TC-11,
[DRAG-1.19](drag-1-contexts-and-popping.md)). The intermediate stop at
the parent's Card layer is a real state, though not one the user is
expected to linger in: a release there is the Card layer's auto-drop,
which for a Stub picked up **from within this same Card** means **set it
back down where it was picked up — nothing is written** (TC-12).

**Withdrawn (Product Owner, 2026-09-17):** the overflow placeholder
cases TC-6–TC-8. Story 7 will decide whether an overflow modal exists at
all or the hierarchy is simply restricted to the depth the UI can
display; nothing is planned for §9 until then.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A Stub popped out to the column becomes Free and is positioned by the column's within-action | P0 | ⏳ pending triage |
| TC-2 | Detaching in place keeps the inherited workphase — even a non-entry workphase of a merged column | P0 | ⏳ pending triage |
| TC-3 | Detaching into a different column goes through Board and takes that column's workphase per its band | P0 | ⏳ pending triage |
| TC-4 | A Stub zoomed into a different Card is a reparent — attached as that Card's last child | P0 | ⏳ pending triage |
| TC-5 | A momentary excursion out of the parent does not detach | P0 | ⏳ pending triage |
| TC-6 | ~~Dragging a Stub over "see X children" and holding opens the overflow modal mid-drag~~ | — | ⏸ withdrawn |
| TC-7 | ~~Placement inside the overflow modal follows the hierarchy ruleset unchanged~~ | — | ⏸ withdrawn |
| TC-8 | ~~Clicking "see X children" opens the same modal~~ | — | ⏸ withdrawn |
| TC-9 | A Stub drag's within-action is hierarchy placement — reorder and reparent inside the parent need no detach | P0 | ⏳ pending triage |
| TC-10 | A detached Stub is represented as a Card from the column layer on | P1 | ⏳ pending triage |
| TC-11 | A decisive pull away from the Card cascades Descendants → Card → column, one layer at a time | P1 | ⏳ pending triage |
| TC-12 | A Stub released at its own parent's Card layer is set back down where it was picked up — nothing is written | P0 | ⏳ pending triage |

---

## TC-1 — A Stub popped out to the column becomes Free and is positioned by the column's within-action

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, `P` in a column region rendering `P, Q`,
*when* `X` is dragged, the cursor rests outside `P`'s descendants section
for ≥ `POP_OUT` (out to `P`'s Card layer), then outside `P`'s box for ≥
`POP_OUT` (out to the column) so that `X` arrives locked in `P`'s column,
and the user releases hovering the lower half of `Q`, *then* the
committed change is: `X`'s attachment cleared, `X.parentId` still `P`
([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)), and `X`
positioned in the workflow-wide scope via `{anchorId: Q, side: after}`
([TC-7.13](../item-positioning/part-7-board-placement-intents.md)). `X`
now renders as a Card (TC-10). Moving a Stub out of a Card is an
un-attach, never a reparent.

**Automation test:** —

## TC-2 — Detaching in place keeps the inherited workphase — even a non-entry workphase of a merged column

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a merged column covering `W2, W3` (`W2` is the entry workphase),
`P` in `W3`, and Stub `X` attached to `P` (so `X.workphaseId = W3`),
*when* `X` is detached by popping out to `P`'s column and releasing there
(TC-1), *then* the request carries **no** workphase change and after the
commit `X.workphaseId` is still `W3`. `X` was already a member of the
column's covered set, so this is a position-only reorder by the
covered-set rule ([TC-4.2](../item-positioning/part-4-merged-column.md));
"takes the first workphase in the range" applies only to a drop into a
column the item wasn't already in. `X` must not be silently walked back
to `W2`.

**Automation test:** —

## TC-3 — Detaching into a different column goes through Board and takes that column's workphase per its band

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P` in column `C1`, and a different column
`C2` whose covered set does not include `X`'s inherited workphase, *when*
`X` pops out to `C1` (TC-1), then out of `C1` to Board (≥ `POP_OUT`
outside `C1`'s list box — [DRAG-1.3](drag-1-contexts-and-popping.md)),
and is released in one of `C2`'s bands, *then* the commit is a detach
plus whatever that band means in `C2` ([DRAG-3](drag-3-card-column-bands.md)):
the entry workphase of `C2` (or the exact sub-row workphase in expanded
mode), with the band's anchor+side or — for the middle band — the
workphase-only form. `X.parentId` is still `P`. *And when* instead the
cursor rests in `C2`'s middle band ≥ `POP_IN` before release, *then* `X`
is locked in `C2` and the release is `C2`'s anchor+side reposition.

A release while still locked in `C1` with the cursor merely *over* `C2`
commits `C1`'s reposition ([DRAG-1.16](drag-1-contexts-and-popping.md)),
not anything in `C2`.

**Automation test:** —

## TC-4 — A Stub zoomed into a different Card is a reparent — attached as that Card's last child

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [ATT-7.5](../item-attachment/att-7-detach-preserves-parent.md).
*Given* Stub `X` attached to `P`, and a different Valid Card `Q` in the
same column, *when* `X` pops out to the column (TC-1), the cursor rests
on `Q` for ≥ `CARD_POP_IN` ([DRAG-1.17](drag-1-contexts-and-popping.md)),
and the user releases, *then* the commit is a reparent: `X.parentId =
Q`, attached, workphase inherited from `Q`, positioned as `Q`'s **last
child** — `X` arrived from outside `Q`, so the auto-drop is "last"
([DRAG-4.1](drag-4-attach-and-stub-placement.md)). It is not a detach
that left `parentId = P`. A `Q` in a different column is reached the
same way after Board and that column's pop-in
([DRAG-4.15](drag-4-attach-and-stub-placement.md)). A precise slot among
`Q`'s children is Descendants placement ([DRAG-4.8–4.10](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## TC-5 — A momentary excursion out of the parent does not detach

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P` with siblings `S1, S2`, at `P`'s
Descendants layer, *when* the cursor briefly leaves the descendants
section (for less than `POP_OUT`) during a sibling reorder and returns,
and the user releases with the Stub-ghost below `S2` at `S2`'s depth,
*then* the commit is a sibling reorder within `P`
([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md),
[DRAG-4.9](drag-4-attach-and-stub-placement.md)) — `X` still attached to
`P`. Popping out is never incidental
([DRAG-1.3](drag-1-contexts-and-popping.md)), and by rule 1 a release
during the excursion commits the same thing
([DRAG-1.16](drag-1-contexts-and-popping.md)).

**Automation test:** —

## TC-6 — ~~Dragging a Stub over "see X children" and holding opens the overflow modal mid-drag~~

**Priority:** — · **Automated:** ⏸ withdrawn

**Was:** holding a dragged Stub over the "see X children" placeholder
past a threshold opened the expanded-hierarchy modal mid-drag.
**Withdrawn 2026-09-17:** Story 7 will decide whether an overflow modal
exists or the hierarchy is restricted to displayable depth. Not planned
until then.

**Automation test:** —

## TC-7 — ~~Placement inside the overflow modal follows the hierarchy ruleset unchanged~~

**Priority:** — · **Automated:** ⏸ withdrawn

**Was:** inside the modal, releases resolved by the same three-way
ruleset as the board. **Withdrawn 2026-09-17** with TC-6. If a modal
does exist, [DRAG-4.8–4.11](drag-4-attach-and-stub-placement.md) apply
inside it unchanged.

**Automation test:** —

## TC-8 — ~~Clicking "see X children" opens the same modal~~

**Priority:** — · **Automated:** ⏸ withdrawn

**Was:** a click (no drag) on the placeholder opened the same modal.
**Withdrawn 2026-09-17** with TC-6.

**Automation test:** —

## TC-9 — A Stub drag's within-action is hierarchy placement — reorder and reparent inside the parent need no detach

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, whose Stubs are `S1, X, S2` and where
`S1` has child `S1a`, *when* `X` is picked up and — without ever leaving
`P`'s descendants section — released with the Stub-ghost:

- in the gap above `S1` → `{anchorId: S1, side: before}`, `X.parentId =
  P`, still attached (sibling reorder, [DRAG-4.11](drag-4-attach-and-stub-placement.md));
- in the gap below `S2`, at `S2`'s depth → `{anchorId: S2, side:
  after}`, `X.parentId = P` ([DRAG-4.9](drag-4-attach-and-stub-placement.md));
- in the gap below `S1a`, tabbed right of `S1a` → `X.parentId = S1a`,
  attached, its first child — a reparent *within* `P`'s subtree with no
  detach step ([DRAG-4.9](drag-4-attach-and-stub-placement.md));
- in a tab state past `CAP` → marked invalid; a release there writes
  nothing and `X` stays where it was
  ([DRAG-4.18](drag-4-attach-and-stub-placement.md)).

*Then* in every case `X` remains attached and never passes through a Free
state; `X.workphaseId` is unchanged (still `P`'s). `X`'s own descendants
travel with it and are never Top/Bottom candidates
([DRAG-4.8](drag-4-attach-and-stub-placement.md)). The Descendants layer
is where a Stub starts, so the common case — reordering among siblings —
costs no pop at all.

**Automation test:** —

## TC-10 — A detached Stub is represented as a Card from the column layer on

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P`, *when* `X` pops out to `P`'s column
(TC-1), *then* from that moment the carried item and its ghost are a
**Card** in the column's list — no longer a Stub inside `P` — and `X` is
absent from `P`'s descendants section for the rest of the drag; the
Column ↔ Card boundary converts the representation both ways. *And when*
`X` then zooms into a Card `Q` (TC-4), *then* it is a Stub-ghost again,
inside `Q`. *And when* the drag is cancelled (or released where nothing is
written, [DRAG-1.9](drag-1-contexts-and-popping.md)) after `X` has popped
out, *then* `X` renders back as `P`'s Stub, unchanged.

**Automation test:** —

## TC-11 — A decisive pull away from the Card cascades Descendants → Card → column, one layer at a time

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `POP_OUT_DISTANCE` non-zero and Stub `X` at `P`'s Descendants
layer, *when* the cursor is pulled in one motion to a point that is at
once ≥ `POP_OUT_DISTANCE` outside `P`'s descendants section *and* ≥
`POP_OUT_DISTANCE` outside `P`'s box, *then* `X` pops out to `P`'s Card
layer (first pop) and, the Card's own pop-out threshold being evaluated
fresh against the same distant cursor, at once pops out to the column
(second pop) — arriving locked in the column, represented as a Card
(TC-10), with a release committing the column's reposition and the
detach (TC-1). Both pops occur, in that order; no rule skips a layer.
*And when* instead the cursor stops inside `P`'s box but outside its
descendants section, *then* only the first pop occurs, `X` is at `P`'s
Card layer, and a release sets it back down — nothing written (TC-12).
*And given* `POP_OUT_DISTANCE` is `0`, *then* the same cascade takes two
full `POP_OUT` durations back to back.

**Automation note:** threshold-timed — stays manual until the values lock.

**Automation test:** —

## TC-12 — A Stub released at its own parent's Card layer is set back down where it was picked up — nothing is written

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Stub `X` attached to `P` at position `p` among `P`'s Stubs `S1,
X, S2`, *when* `X` is dragged, pops out of the descendants section to
`P`'s Card layer (≥ `POP_OUT` outside the section, inside `P`'s box), and
the user releases anywhere inside `P`'s box, *then* **nothing is
written**: no request is made, `X.parentId = P`, attached, `X.position =
p`, and `X` renders back between `S1` and `S2`. The Card layer's
auto-drop for an item picked up *within* this Card is "put it back."
*Contrast* an item brought in from outside `P`, for which the same
release is "last child" ([DRAG-4.1](drag-4-attach-and-stub-placement.md),
[DRAG-4.14](drag-4-attach-and-stub-placement.md)) — what distinguishes
the two is where the drag started, not anything about the release.

*(Product Owner ruling 2026-09-17; wiki §8 to carry it as an addendum.)*

**Automation test:** —

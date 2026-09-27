# DRAG-3 — Card → column region: drop bands (Board layer)

**Next ID:** DRAG-3.20

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §5, §5a

**Board layer only.** The bands are Board layer's within-action
([DRAG-1](drag-1-contexts-and-popping.md) §1.1): they govern a release only
while the drag is genuinely popped out (or was picked up from Unsorted).
While the drag is locked in a column/sub-row or a Card, a bare hover over
some other region's band means nothing — the locked layer's within-action
is what a release commits ([DRAG-1.16](drag-1-contexts-and-popping.md)).
Every case below starts "at Board layer."

**Parameterization (§5, reworked 2026-09-16).** Bands are no longer a
percentage of the rendered slice. The one tunable is `GHOST_H`
(`ghostCardHeightPx`, provisionally 96px), a pixel height measured against
the region's **real content** (never the visible-scrolled slice):

- **Two or more cards:** the top divider sits `GHOST_H` below the content's
  top edge and the bottom divider `GHOST_H` above its bottom edge. Above
  the top divider is the **top band**; below the bottom divider the
  **bottom band**; between them the **middle band**. (The dividers
  deliberately bisect the first and last rendered card; where the line
  crosses a card is cosmetic, what a release above or below it means is
  not.)
- **Exactly one card:** the dividers sit `GHOST_H / 2` from each edge, so
  the card keeps a real middle band.
- **Empty region, or a terminal (done) region regardless of card count:**
  a single band spanning the region's height — no top/bottom distinction.

The region is the column's list box in merged mode and a single sub-row in
expanded mode ([DRAG-1.1](drag-1-contexts-and-popping.md)); header, footer
and the gaps around sub-rows are nowhere ([DRAG-1.9](drag-1-contexts-and-popping.md))
and have no band. Pop clocks are `POP_OUT` and `POP_IN` as defined in
[DRAG-1](drag-1-contexts-and-popping.md).

"Released without popping in" means a release at Board layer before
`POP_IN` has fired for this region. It commits the band's meaning; only a
completed pop in reaches in-context placement (DRAG-3.4).

Every band produces one of the request shapes catalogued in
[`../item-positioning/part-7-board-placement-intents.md`](../item-positioning/part-7-board-placement-intents.md);
cases here assert *which* request a release produces, and cross-reference
Part 7 for the number the server then resolves. The dashed guide lines,
the band tint and the locked-layer outline are visual (Story 8) and have
no cases; the band *labels* and the dragged card's collapse have one P2
case each (DRAG-3.18, DRAG-3.19), flagged in INDEX as droppable if they're judged
visual too.

| ID | Case | Priority | Automated |
|---|---|---|---|
| DRAG-3.1 | Top band → `{anchorId: first item in the region, side: before}` | P0 | ⏳ pending triage |
| DRAG-3.2 | Bottom band → `{anchorId: last item in the region, side: after}` | P0 | ⏳ pending triage |
| DRAG-3.3 | Middle band, released without popping in → workphase-only move, position kept | P0 | ⏳ pending triage |
| DRAG-3.4 | Middle band, held past `POP_IN` → pop in, then anchor+side hovering | P0 | ⏳ pending triage |
| DRAG-3.5 | The dividers sit `GHOST_H` from each content edge, and move with the configured value | P1 | ⏳ pending triage |
| DRAG-3.6 | A drop into a merged column from outside its covered set takes the entry workphase | P0 | ⏳ pending triage |
| DRAG-3.7 | A drop into a merged column by an item already in its covered set leaves the workphase alone | P0 | ⏳ pending triage |
| DRAG-3.8 | Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first/last of the sub-row | P0 | ⏳ pending triage |
| DRAG-3.9 | Done column: a single band; any release is workphase-only with no anchor | P0 | ⏳ pending triage |
| DRAG-3.10 | Empty region: a single band; any release is a workphase-only move | P1 | ⏳ pending triage |
| DRAG-3.11 | Ghost placement is ordinal and follows the band's meaning | P1 | ⏳ pending triage |
| DRAG-3.12 | Middle band, item already in this region → nothing is written | P0 | ⏳ pending triage |
| DRAG-3.13 | A band is measured against the region's content rect as it was on entry, not the live rect | P1 | ⏳ pending triage |
| DRAG-3.14 | The frozen rect follows the region's own top edge — a real scroll or a sibling's reflow | P1 | ⏳ pending triage |
| DRAG-3.15 | Exactly one card: the dividers halve, so the card keeps a middle band | P1 | ⏳ pending triage |
| DRAG-3.16 | Bands are measured against real content, not the visible slice; a scrolled-away divider is unreachable | P1 | ⏳ pending triage |
| DRAG-3.17 | Every region reserves `GHOST_H` at Board layer; net height is constant; the reservation collapses when locked | P2 | ⏳ pending triage |
| DRAG-3.18 | Band labels name the within-action: "Move Top" / "Move Bottom" / "Move to {name}" | P2 | ⏳ pending triage |
| DRAG-3.19 | Both copies of the dragged card render collapsed; its attached children are unrendered for the drag | P2 | ⏳ pending triage |

---

## DRAG-3.1 — Top band → `{anchorId: first item in the region, side: before}`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` at Board layer over a column region whose rendered
order is `A, B, C`, *when* the cursor is above the top divider and the
user releases without popping in, *then* the request is `{anchorId: A,
side: before}` — plus a workphase change to the region's workphase if `X`
isn't already a covered member (DRAG-3.6/DRAG-3.7). `A` is the first item of the
client's rendered order under the tie-break
([TC-7.3](../item-positioning/part-7-board-placement-intents.md)).
Server-side result: [TC-7.1](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## DRAG-3.2 — Bottom band → `{anchorId: last item in the region, side: after}`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same region `A, B, C`, *when* the cursor is below the bottom
divider and the user releases without popping in, *then* the request is
`{anchorId: C, side: after}` (plus the workphase change if applicable).
Server-side result: [TC-7.2](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## DRAG-3.3 — Middle band, released without popping in → workphase-only move, position kept

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with position `p` at Board layer over a column region
`X` is not a covered member of, *when* the cursor is between the
dividers and the user releases before `POP_IN` has fired, *then* the
request is a workphaseId-only move — no `anchorId`, no `side` — and after
the server responds `X.workphaseId` is the region's workphase and
`X.position` is exactly `p`
([TC-2.24](../item-positioning/part-2-anchor-resolution.md) /
[TC-7.16](../item-positioning/part-7-board-placement-intents.md)). If `X`
had no position (a reopened done item), it receives one via the append
fallback ([TC-6.9](../item-positioning/part-6-active-done-split.md)) and
previews at the end ([DRAG-6.10](drag-6-preview-reconciliation.md)).

The band is the quick auto-placement — "move it here" — for when the
column change is what matters and the exact position isn't.

**Automation test:** —

## DRAG-3.4 — Middle band, held past `POP_IN` → pop in, then anchor+side hovering

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same setup, *when* the cursor rests in the middle band for ≥
`POP_IN`, *then* `X` pops into the column and is thereafter positioned by
ordinary anchor+side hovering ([DRAG-1.5](drag-1-contexts-and-popping.md)):
a release hovering the lower half of `B` commits `{anchorId: B, side:
after}` (plus workphase change if applicable), not the band's meaning. A
cross-column in-context placement from a locked column costs both clocks
— `POP_OUT` out of the old context, then `POP_IN` here — run back to back
when the cursor simply rests.

The pop-in clock counts time anywhere in the region, but fires only from
the middle band — see [DRAG-1.11](drag-1-contexts-and-popping.md) for the
band-time cases.

**Automation test:** —

## DRAG-3.5 — The dividers sit `GHOST_H` from each content edge, and move with the configured value

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `GHOST_H` set to a specific value and a region with two or more
cards, *when* a release occurs just above the top divider (`GHOST_H − 1`
below the content's top edge), just below it (`GHOST_H + 1`), just above
the bottom divider, and just below it, *then* each resolves to the band
the configured value places it in — DRAG-3.1 / DRAG-3.3 / DRAG-3.3 / DRAG-3.2
respectively — and changing `GHOST_H` moves those outcomes accordingly.
Both dividers derive from this one value; there is no separately tunable
top or bottom boundary. The provisional 96px is a starting point, not a
constant.

**Automation test:** —

## DRAG-3.6 — A drop into a merged column from outside its covered set takes the entry workphase

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a merged column covering `W2, W3` (`W2` first in range —
`entryWorkphaseId`) and a Card `X` currently in `W1`, *when* `X` is
released in the column at Board layer by any band, *then* the request's
workphase is `W2` — the first workphase in the column's range — combined
with the band's placement (DRAG-3.1/2/3). Cross-reference
[TC-4.4](../item-positioning/part-4-merged-column.md).

**Automation test:** —

## DRAG-3.7 — A drop into a merged column by an item already in its covered set leaves the workphase alone

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same merged column and a Card `X` currently in `W3` (a
covered member, not the entry workphase), *when* `X` is released in the
column at Board layer via the top or bottom band, *then* the request
carries the band's anchor+side and **no** workphase change — `X` stays in
`W3`. Membership in the covered set is what decides, not which specific
workphase the hovered or bounding card is in. Cross-reference
[TC-4.2](../item-positioning/part-4-merged-column.md). (The middle band
for a covered member is DRAG-3.12.)

**Automation test:** —

## DRAG-3.8 — Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first/last of the sub-row

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an expanded column with sub-rows `W2` (rendering `A, B`) and `W3`
(rendering `C, D`), and a Card `X` at Board layer, *when* `X` is released
above the `W3` sub-row's top divider, *then* the request is `{anchorId:
C, side: before}` with workphase `W3` — first item *of that sub-row*,
exact workphase, no range ambiguity. *And when* released below the `W3`
sub-row's bottom divider, *then* `{anchorId: D, side: after}`, workphase
`W3`. Each sub-row carves its own dividers from its own content.

**Automation test:** —

## DRAG-3.9 — Done column: a single band; any release is workphase-only with no anchor

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a done column (terminal covered set) rendering `D1, D2` by
`completedAt`, *when* a Card `X` at Board layer is released anywhere in
its region — top edge, bottom edge, over `D1`, over `D2` — *then* the
request is the same workphaseId-only move with no `anchorId` in every
case, and the server resolves it as a workphase change with `completedAt`
set and `position` dropped. Server side:
[TC-7.8](../item-positioning/part-7-board-placement-intents.md). A
terminal region presents a **single band** unconditionally, regardless of
card count — there is nothing to place a positioned insert against.

The column still accepts card-drops and attach-drops (zooming into a done
*Card* in it — [DRAG-4.3](drag-4-attach-and-stub-placement.md)); it just
never produces a positioned insert. Done/terminal handling gets a fuller
rework in Epic 4.

**Automation test:** —

## DRAG-3.10 — Empty region: a single band; any release is a workphase-only move

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a column region with no items, *when* a Card at Board layer is
released anywhere in it, *then* the request is a workphaseId-only move
with no anchor — there is no "first" or "last" to carve two dead zones
around, so the region is one band spanning its own height. Server side:
[TC-7.5](../item-positioning/part-7-board-placement-intents.md) /
[TC-7.6](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## DRAG-3.11 — Ghost placement is ordinal and follows the band's meaning

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `X` with position `p` at Board layer over a region
rendering `A, B, C` whose positions bracket `p` between `A` and `B`,
*when* the cursor is in the top band, *then* the ghost is rendered at
index 0; in the bottom band, at the end; in the middle band, at index 1
— where `p` already falls in this region's order. In every case the
ghost's index is computed from the rendered order and `X`'s *existing*
position; no position value is invented
([TC-2.27](../item-positioning/part-2-anchor-resolution.md)). An `X` with
no position previews at the end instead
([DRAG-6.10](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-3.12 — Middle band, item already in this region → nothing is written

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a merged column covering `W2, W3` and a Card `X` currently in
`W3` (a covered-set member — [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
§8's rule), *when* `X` is dragged, popped out of the column to Board,
brought back into its middle band and released before popping in, *then*
**nothing is written**: no request is made, `X.workphaseId` stays `W3` and
`X.position` is unchanged — the item is simply being set back down.
(While `X` is still locked in the column there are no bands at all; a
release there is an anchor+side reposition,
[DRAG-1.2](drag-1-contexts-and-popping.md).)

*In an expanded column* the region is the sub-row, so "already in this
region" means already in that sub-row's exact workphase: `X` from the
`W2` sub-row released in the `W3` sub-row's middle band is a workphase
change to `W3` (DRAG-3.3, DRAG-3.8), not a set-down. *(Reading flagged for the
Product Owner — see INDEX.)*

Contrast DRAG-3.3 (an item from elsewhere takes the workphase) and DRAG-3.7 (a
covered member in the top or bottom band still gets the band's
anchor+side).

**Automation test:** —

## DRAG-3.13 — A band is measured against the region's content rect as it was on entry, not the live rect

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `X` at Board layer whose cursor enters a region `R` in
`R`'s bottom band as measured against `R`'s content rect at the moment
of entry, *when* the ghost's own insertion grows `R`'s list so that the
cursor's position now falls in the *live* rect's middle band, and the
user releases without moving, *then* the release still resolves by the
bottom band — the frozen rect. The frozen rect is held for as long as the
cursor stays in `R`; leaving and re-entering `R` freezes a fresh one. The
drop must not change the band it is about to be resolved by.

**Automation test:** —

## DRAG-3.14 — The frozen rect follows the region's own top edge — a real scroll or a sibling's reflow

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a region `R` with a frozen rect from the cursor's entry (DRAG-3.13),
*when* `R`'s own top edge moves by `Δ` while the cursor stays over `R` —
because the column scrolled (auto-scroll during the drag, or otherwise),
**or** because a sibling region in the same scrolling body reserved or
released its carve-out and reflowed `R` downward or upward with no scroll
at all — *then* the frozen rect moves by `Δ` with the content it belongs
to: the dividers are the frozen dividers translated by however far `R`'s
top edge moved, not left behind at their pre-move screen position. A
release after the move resolves by the band the cursor is in *relative to
the moved rect*. The freeze is against the hovered region's own insertion
only (which grows its bottom edge, never its top).

This holds for a merged column's list box and an expanded column's
sub-row alike — both sit in the same kind of scrolling body.

**Automation test:** —

## DRAG-3.15 — Exactly one card: the dividers halve, so the card keeps a middle band

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a region rendering exactly one card `A`, *when* a Card `X` at
Board layer is released `GHOST_H / 2 − 1` below the content's top edge,
*then* the request is `{anchorId: A, side: before}` (DRAG-3.1); released
`GHOST_H / 2 + 1` below it, *then* the middle band's meaning (DRAG-3.3 — or
DRAG-3.12 if `X` is a covered member); and symmetrically at the bottom edge,
`{anchorId: A, side: after}` (DRAG-3.2) below the halved divider. With the
normal full-`GHOST_H` dividers the single card would be bisected with
nothing left on either side of the cut; halving keeps a real middle band.
*And given* a second card is added to the region, *then* the dividers
revert to the full `GHOST_H` offsets (DRAG-3.5).

**Automation test:** —

## DRAG-3.16 — Bands are measured against real content, not the visible slice; a scrolled-away divider is unreachable

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a long region `R` whose content overflows its scroll box, scrolled
so that its content's top edge — and with it the top divider — is out of
view above the visible slice, *when* a Card `X` at Board layer is
released at the very top of the *visible* slice, *then* the release
resolves by the **middle** band — the top divider is `GHOST_H` from the
*content's* top edge, which is above the fold; the top band is neither
drawn nor reachable until the region (or the page) scrolls to it.
*And when* the region scrolls so that the content's top edge comes into
view, *then* a release within `GHOST_H` of it resolves by the top band
(DRAG-3.1). Whether the cursor is *in* `R` at all is still the visible-clip
rule of [DRAG-1.10](drag-1-contexts-and-popping.md); this case is about
where the dividers sit once it is.

**Automation test:** —

## DRAG-3.17 — Every region reserves `GHOST_H` at Board layer; net height is constant; the reservation collapses when locked

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* a drag at Board layer, *when* the region heights are measured,
*then* every column/sub-row region is exactly `GHOST_H` taller than its
resting height — as two half-height dead zones at its top and bottom
edges when it is not the hover target, and as the ghost's own slot when
it is — so a region's total height is the same whether or not the cursor
is over it, and does not change as the drag moves around the board.
*And when* the drag locks into any layer (a column/sub-row or a Card),
*then* the reservation is gone from every region — collapsed, not merely
hidden — and cards render adjacent with no reserved gap; popping back out
to Board restores it.

**Automation test:** —

## DRAG-3.18 — Band labels name the within-action: "Move Top" / "Move Bottom" / "Move to {name}"

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* a drag at Board layer, *when* a region is not the hover target,
*then* its top dead zone reads **"Move Top"** and its bottom dead zone
**"Move Bottom"**; its middle band carries no label. *And given* an empty
region, or a terminal region, *then* its single band reads **"Move to
{name}"** — the region's own name (a sub-row's workphase name; a terminal
region is labeled by its workphase's name). *And given* a region with
exactly one card, *then* the card's middle band is unlabeled. Labels are
asserted as text; their look is Story 8's.

**Automation test:** —

## DRAG-3.19 — Both copies of the dragged card render collapsed; its attached children are unrendered for the drag

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* a Card `X` with a multi-line description and attached children
`S1, S2`, *when* `X` is being dragged — at any layer — *then* both its
floating copy and its in-place row render collapsed: title on one line,
description clamped to one line (the line reserved even when `X` has no
description), and the attached-children indicator and count absent. `S1`
and `S2` are **not rendered anywhere** for the life of the drag — not
inside `X`'s collapsed copies, not dimmed, simply absent — and reappear
inside `X` on release. On drop, `X` expands back to full height at once.

**Automation test:** —

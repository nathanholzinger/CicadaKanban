# DRAG-3 — Card → column region: drop bands

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §5

**Suite ID:** `DRAG-3`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-3.n`.

**Parameterization.** Band boundaries are tunable. Cases are written
against `TOP_BAND` / `BOTTOM_BAND` (provisionally the top and bottom 20%
of the region's height; the remainder is the middle band), never literal
percentages. The region is the whole column in merged mode and a single
sub-row in expanded mode ([DRAG-1.1](drag-1-contexts-and-popping.md)).

Every band produces one of the request shapes catalogued in
[`../item-positioning/part-7-board-placement-intents.md`](../item-positioning/part-7-board-placement-intents.md);
cases here assert *which* request a release produces, and cross-reference
Part 7 for the number the server then resolves.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | Top band → `{anchorId: first item in the region, side: before}` | P0 | ⏳ pending triage |
| TC-2 | Bottom band → `{anchorId: last item in the region, side: after}` | P0 | ⏳ pending triage |
| TC-3 | Middle band, released without holding → workphase-only move, position kept | P0 | ⏳ pending triage |
| TC-4 | Middle band, held past `THRESHOLD` → pop, then anchor+side hovering | P0 | ⏳ pending triage |
| TC-5 | Band boundaries are the configured values | P1 | ⏳ pending triage |
| TC-6 | A drop into a merged column from outside its covered set takes the entry workphase | P0 | ⏳ pending triage |
| TC-7 | A drop into a merged column by an item already in its covered set leaves the workphase alone | P0 | ⏳ pending triage |
| TC-8 | Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first/last of the sub-row | P0 | ⏳ pending triage |
| TC-9 | Done column: top and bottom bands produce no anchor; the drop is workphase-only | P0 | ⏳ pending triage |
| TC-10 | Empty region: every band is a workphase-only move | P1 | ⏳ pending triage |
| TC-11 | Ghost placement is ordinal and follows the band's meaning | P1 | ⏳ pending triage |

---

## TC-1 — Top band → `{anchorId: first item in the region, side: before}`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` held over a column region whose rendered order is `A,
B, C`, *when* the cursor is in `TOP_BAND` and the user releases without
holding, *then* the request is `{anchorId: A, side: before}` — plus a
workphase change to the region's workphase if `X` isn't already a covered
member (TC-6/TC-7). `A` is the first item of the client's rendered order
under the tie-break ([TC-7.3](../item-positioning/part-7-board-placement-intents.md)).
Server-side result: [TC-7.1](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## TC-2 — Bottom band → `{anchorId: last item in the region, side: after}`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same region `A, B, C`, *when* the cursor is in `BOTTOM_BAND`
and the user releases without holding, *then* the request is `{anchorId:
C, side: after}` (plus the workphase change if applicable). Server-side
result: [TC-7.2](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## TC-3 — Middle band, released without holding → workphase-only move, position kept

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with position `p` held over a different column region,
*when* the cursor is in the middle band and the user releases before
`THRESHOLD`, *then* the request is a workphaseId-only move — no
`anchorId`, no `side` — and after the server responds `X.workphaseId` is
the region's workphase and `X.position` is exactly `p`
([TC-2.24](../item-positioning/part-2-anchor-resolution.md) /
[TC-7.16](../item-positioning/part-7-board-placement-intents.md)). If `X`
had no position (a reopened done item), it receives one via the append
fallback ([TC-6.9](../item-positioning/part-6-active-done-split.md)).

**Automation test:** —

## TC-4 — Middle band, held past `THRESHOLD` → pop, then anchor+side hovering

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same setup, *when* the cursor rests in the middle band for ≥
`THRESHOLD`, *then* `X` pops into the column and is thereafter positioned
by ordinary anchor+side hovering ([DRAG-1.5](drag-1-contexts-and-popping.md)):
a release hovering the lower half of `B` commits `{anchorId: B, side:
after}` (plus workphase change if applicable), not the band's meaning.

**Automation test:** —

## TC-5 — Band boundaries are the configured values

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `TOP_BAND` and `BOTTOM_BAND` set to specific values, *when* a
release occurs just inside the top boundary, just outside it, just inside
the bottom boundary, and just outside it, *then* each resolves to the band
the configured values place it in (TC-1 / TC-3 / TC-2 respectively) —
and changing the configured values moves those outcomes accordingly. The
20/60/20 split is a starting point, not a constant.

**Automation test:** —

## TC-6 — A drop into a merged column from outside its covered set takes the entry workphase

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a merged column covering `W2, W3` (`W2` first in range —
`entryWorkphaseId`) and a Card `X` currently in `W1`, *when* `X` is
released in the column by any band, *then* the request's workphase is
`W2` — the first workphase in the column's range — combined with the
band's placement (TC-1/2/3). Cross-reference
[TC-4.4](../item-positioning/part-4-merged-column.md).

**Automation test:** —

## TC-7 — A drop into a merged column by an item already in its covered set leaves the workphase alone

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same merged column and a Card `X` currently in `W3` (a
covered member, not the entry workphase), *when* `X` is released in the
column via the top or bottom band, *then* the request carries the band's
anchor+side and **no** workphase change — `X` stays in `W3`. Membership
in the covered set is what decides, not which specific workphase the
hovered or bounding card is in. Cross-reference
[TC-4.2](../item-positioning/part-4-merged-column.md).

**Automation test:** —

## TC-8 — Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first/last of the sub-row

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an expanded column with sub-rows `W2` (rendering `A, B`) and `W3`
(rendering `C, D`), and a Card `X` from elsewhere, *when* `X` is released
in the `W3` sub-row's `TOP_BAND`, *then* the request is `{anchorId: C,
side: before}` with workphase `W3` — first item *of that sub-row*, exact
workphase, no range ambiguity. *And when* released in the `W3` sub-row's
`BOTTOM_BAND`, *then* `{anchorId: D, side: after}`, workphase `W3`.

**Automation test:** —

## TC-9 — Done column: top and bottom bands produce no anchor; the drop is workphase-only

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a done column (terminal covered set) rendering `D1, D2` by
`completedAt`, *when* a Card `X` is released in its `TOP_BAND` or
`BOTTOM_BAND`, *then* the request is a workphaseId-only move with no
`anchorId` — the same request the middle band produces — and the server
resolves it as a workphase change with `completedAt` set and `position`
dropped. Server side: [TC-7.8](../item-positioning/part-7-board-placement-intents.md).

The column still accepts card-drops and attach-drops (a drop onto a done
*Card* in it — [DRAG-4.3](drag-4-attach-and-stub-placement.md)); it just
never produces a positioned insert.

**Automation test:** —

## TC-10 — Empty region: every band is a workphase-only move

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a column region with no items, *when* a Card is released in it
in the top, middle, or bottom band, *then* all three produce the same
workphaseId-only request with no anchor. Server side:
[TC-7.5](../item-positioning/part-7-board-placement-intents.md) /
[TC-7.6](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** —

## TC-11 — Ghost placement is ordinal and follows the band's meaning

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `X` with position `p` held over a region rendering `A, B,
C` whose positions bracket `p` between `A` and `B`, *when* the cursor is
in `TOP_BAND`, *then* the ghost is rendered at index 0; in `BOTTOM_BAND`,
at the end; in the middle band, at index 1 — where `p` already falls in
this region's order. In every case the ghost's index is computed from the
rendered order and `X`'s *existing* position; no position value is
invented ([TC-2.27](../item-positioning/part-2-anchor-resolution.md)).

**Automation test:** —

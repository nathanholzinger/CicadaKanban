# DRAG-3 — Board-layer drop bands, and the dragged card's shape

**Next ID:** DRAG-3.25

**Terms.** Cases are at Board layer unless they say otherwise. `h` is shortCard's height, and `gap` is the card lists' shared gap: fixed facts about the card component, not tuning-panel values. *Released without popping in* means a release at Board layer before the region's pop in has fired. Each band produces a request shape catalogued in [`../item-positioning/part-7-board-placement-intents.md`](../item-positioning/part-7-board-placement-intents.md); cases here assert which request a release produces.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-3.1 | Top band → `{anchorId: first item in the region, side: before}` | P0 | Automated |
| DRAG-3.2 | Bottom band → `{anchorId: last item in the region, side: after}` | P0 | Automated |
| DRAG-3.3 | Middle band, released without popping in → a workphase-only move that keeps the position | P0 | Automated |
| DRAG-3.4 | Middle band, held for `popInDelayMs` → pop in, then placement by the ghost's named neighbor | P0 | Automated |
| DRAG-3.5 | With two or more cards, the dividers sit `h` in from each edge, derived rather than tuned | P1 | Open |
| DRAG-3.6 | A drop into a merged column from outside its covered set takes the entry workphase | P0 | Automated |
| DRAG-3.7 | A drop into a merged column by a covered-set member leaves the workphase alone | P0 | Automated |
| DRAG-3.8 | Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first and last of the sub-row | P0 | Automated |
| DRAG-3.9 | A done region is a single band; any release is a workphase-only move with no anchor | P0 | Automated |
| DRAG-3.10 | An empty region is a single band; any release is a workphase-only move | P1 | Automated |
| DRAG-3.11 | The ghost's placement is ordinal and follows the band's meaning | P1 | Open |
| DRAG-3.12 | Middle band, item already in this region → nothing is written | P0 | Open |
| DRAG-3.15 | Exactly one card: the divider halves, so the card keeps a middle band | P1 | Automated |
| DRAG-3.16 | Bands are measured against the real content, not the visible slice | P1 | Open |
| DRAG-3.17 | The reservation is exact: a region's height never changes with hovering, and the reservation collapses when locked | P2 | Open |
| DRAG-3.18 | Band labels name the within-action: "Move Top", "Move Bottom", "Move to {name}" | P2 | Open |
| DRAG-3.19 | At Board and Column layers, both copies of a dragged Card are shortCard, and its attached children are unrendered | P2 | Open |
| DRAG-3.20 | Band guides show only at Board layer | P2 | Open |
| DRAG-3.21 | A band reads the region's live content on every sample | P1 | Automated |
| DRAG-3.22 | From the Card layer down, both copies of the dragged item are Stub rows | P2 | Open |
| DRAG-3.23 | A Card popped into a done column is released as a workphase change with no anchor | P0 | Open |
| DRAG-3.24 | A card set back down inside its own done column: the ghost stays in its slot, and nothing is written | P1 | Open |

---

## DRAG-3.1 — Top band → `{anchorId: first item in the region, side: before}`

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5

*Given* Card `X` at Board layer over a region rendering `A, B, C`, *when* the cursor is above the top divider and the user releases without popping in, *then* the request is `{anchorId: A, side: before}`, plus a change to the region's workphase if `X` isn't already a covered member ([DRAG-3.6](drag-3-card-column-bands.md), [DRAG-3.7](drag-3-card-column-bands.md)). `A` is first in the client's rendered order under the tie-break ([TC-7.3](../item-positioning/part-7-board-placement-intents.md)). The server's result is [TC-7.1](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.2 — Bottom band → `{anchorId: last item in the region, side: after}`

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5

*Given* the same region rendering `A, B, C`, *when* the cursor is below the bottom divider and the user releases without popping in, *then* the request is `{anchorId: C, side: after}`, plus the workphase change if it applies. The server's result is [TC-7.2](../item-positioning/part-7-board-placement-intents.md).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.3 — Middle band, released without popping in → a workphase-only move that keeps the position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §7.5

*Given* Card `X` with position `p` at Board layer over a region `X` isn't a covered member of, *when* the cursor is between the dividers and the user releases without popping in, *then* the request is a workphase-only move, with no `anchorId` and no `side`. After the response, `X.workphaseId` is the region's workphase and `X.position` is exactly `p` ([TC-2.24](../item-positioning/part-2-anchor-resolution.md)). An `X` with no position gets one by the append fallback ([TC-6.9](../item-positioning/part-6-active-done-split.md)), and previews last ([DRAG-6.10](drag-6-preview-reconciliation.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.4 — Middle band, held for `popInDelayMs` → pop in, then placement by the ghost's named neighbor

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5

*Given* the setup of [DRAG-3.3](drag-3-card-column-bands.md), over a region rendering `A, B, C`, *when* the cursor stays in the middle band for `popInDelayMs`, *then* `X` pops into the column, and from then on it is placed by anchor and side ([DRAG-1.2](drag-1-contexts-and-popping.md)), not by band. A release with the ghost between `B` and `C` and the side highlight on `B` commits `{anchorId: B, side: after}`, plus the workphase change if it applies. Releasing without holding, or after popping out but before popping in, commits the band's meaning instead.

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.5 — With two or more cards, the dividers sit `h` in from each edge, derived rather than tuned

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* a region with two or more cards, not terminal and not the hover target, *when* a release happens just above the top divider (less than `h` below the content's top edge) and just below it (more than `h` below), *then* they resolve by the top band ([DRAG-3.1](drag-3-card-column-bands.md)) and the middle band ([DRAG-3.3](drag-3-card-column-bands.md)) respectively, and the same holds mirrored at the bottom divider ([DRAG-3.2](drag-3-card-column-bands.md)). Each dead zone outside the list is `(h + gap) / 2` tall. Every divider position and dead-zone height comes from `h` and `gap`; no tuning-panel value moves them. That the top divider cuts through the first card (and the bottom one through the last) is intended.

**Automation test:** —

## DRAG-3.6 — A drop into a merged column from outside its covered set takes the entry workphase

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §4

*Given* a merged column covering `W2, W3`, with `W2` first in its range (the column's entry workphase), and Card `X` in `W1`, *when* `X` is released in the column at Board layer, in any band, *then* the request's workphase is `W2`, combined with the band's placement ([DRAG-3.1](drag-3-card-column-bands.md), [DRAG-3.2](drag-3-card-column-bands.md), [DRAG-3.3](drag-3-card-column-bands.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.7 — A drop into a merged column by a covered-set member leaves the workphase alone

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §4

*Given* the same merged column, and Card `X` in `W3` (a covered member, not the entry workphase), *when* `X` is released in the column at Board layer in the top or bottom band, *then* the request carries the band's anchor and side and **no** workphase change: `X` stays in `W3`. Membership of the covered set decides it, not which workphase a neighboring card is in. A covered member in the middle band is [DRAG-3.12](drag-3-card-column-bands.md).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.8 — Expanded column: a sub-row drop takes exactly that sub-row's workphase, with first and last of the sub-row

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §4

*Given* an expanded column with sub-rows `W2` (rendering `A, B`) and `W3` (rendering `C, D`), and Card `X` at Board layer, *when* `X` is released above the `W3` sub-row's top divider, *then* the request is `{anchorId: C, side: before}` with workphase `W3`: the first item of that sub-row, in exactly that workphase. *When* it is released below the `W3` sub-row's bottom divider, *then* the request is `{anchorId: D, side: after}`, workphase `W3`. Each sub-row carves its own bands from its own content.

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.9 — A done region is a single band; any release is a workphase-only move with no anchor

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §7.4

*Given* a done column (a terminal covered set) rendering `D1, D2` by `completedAt`, *when* Card `X` at Board layer is released anywhere in its region (near the top, near the bottom, over `D1`, over `D2`), *then* every release sends the same workphase-only move with no `anchorId`. The server applies it as a workphase change with `completedAt` set and `position` dropped ([TC-6.1](../item-positioning/part-6-active-done-split.md), [TC-6.3](../item-positioning/part-6-active-done-split.md)). A done region has no top or bottom band, whatever its card count: a Free done item has no position to anchor against. Its one reserved zone is at the bottom, where the ghost previews as the newest completion ([DRAG-6.11](drag-6-preview-reconciliation.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.10 — An empty region is a single band; any release is a workphase-only move

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §7.1

*Given* a column region with no items, *when* Card `X` at Board layer is released anywhere in it, *then* the request is a workphase-only move with no anchor. There's no first or last to carve two zones around, so the region has one zone, `h` tall. The server keeps the item's position, or gives an item with none the append fallback ([TC-2.24](../item-positioning/part-2-anchor-resolution.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-3.11 — The ghost's placement is ordinal and follows the band's meaning

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* Card `X` with position `p` at Board layer over a region rendering `A, B, C`, where `p` falls between `A`'s and `B`'s positions, *when* the cursor is in the top band, *then* the ghost is at index 0; in the bottom band, at the end; in the middle band, at index 1, where `p` already falls in this region's order. The ghost's index comes from the rendered order and `X`'s existing position; no position value is invented ([TC-2.27](../item-positioning/part-2-anchor-resolution.md)). An `X` with no position previews at the end instead ([DRAG-6.10](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-3.12 — Middle band, item already in this region → nothing is written

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* a merged column covering `W2, W3`, and Card `X` in `W3`, a covered-set member, *when* `X` is popped out of the column to Board, brought back into its middle band and released without popping in, *then* **nothing is written**: no request is made, `X.workphaseId` stays `W3`, and `X.position` is unchanged. The item is simply being set back down.

*In an expanded column* the region is the sub-row, so "already in this region" means already in that sub-row's exact workphase: `X` from sub-row `W2`, released in sub-row `W3`'s middle band, is a workphase change to `W3` ([DRAG-3.3](drag-3-card-column-bands.md), [DRAG-3.8](drag-3-card-column-bands.md)), not a set-down.

**Automation test:** —

## DRAG-3.15 — Exactly one card: the divider halves, so the card keeps a middle band

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5

*Given* a region rendering exactly one card, `A`, *when* Card `X` at Board layer is released less than `(h + gap) / 2` below the content's top edge, *then* the request is `{anchorId: A, side: before}` ([DRAG-3.1](drag-3-card-column-bands.md)). Released further in, it is the middle band's meaning ([DRAG-3.3](drag-3-card-column-bands.md), or [DRAG-3.12](drag-3-card-column-bands.md) for a covered member). The bottom edge is the mirror image, `{anchorId: A, side: after}`. With the normal dividers `h` from each edge, the one card would be cut with nothing left in the middle. *And given* a second card joins the region, *then* the dividers go back to `h` from each edge ([DRAG-3.5](drag-3-card-column-bands.md)).

**Automation test:** `client/src/components/workflow/dragBands.test.ts`, `client/src/components/workflow/popSession.test.ts`

## DRAG-3.16 — Bands are measured against the real content, not the visible slice

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* a long region `R` whose content overflows its scroll box, scrolled so that the content's top edge, and the top divider with it, is out of view above, *when* Card `X` at Board layer is released at the very top of the visible slice, *then* it resolves by the **middle** band. The top divider sits `h` below the content's top edge, which is out of view, and the top band is neither drawn nor reachable until the region scrolls to it. *When* the region scrolls so that the content's top edge is in view, *then* a release within `h` of it resolves by the top band ([DRAG-3.1](drag-3-card-column-bands.md)). Whether the cursor is in `R` at all is [DRAG-1.10](drag-1-contexts-and-popping.md)'s rule.

**Automation test:** —

## DRAG-3.17 — The reservation is exact: a region's height never changes with hovering, and the reservation collapses when locked

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* a drag at Board layer, *when* each region's total height is measured, first while the cursor is elsewhere and then while the region is the hover target, *then* the two heights are equal, for every shape:

- **with one or more cards (not terminal):** two zones of `(h + gap) / 2` outside the list when not hovered; when hovered, the zones collapse and the ghost row takes their place;
- **empty:** one zone of `h`; when hovered, the ghost alone;
- **done, with cards:** one bottom zone of `h + gap`.

*When* the drag locks into anything, a column, sub-row or Card, *then* every region's reservation is gone, collapsed and not merely hidden, and cards render next to each other with no reserved space. Popping back out to Board restores it.

**Automation test:** —

## DRAG-3.18 — Band labels name the within-action: "Move Top", "Move Bottom", "Move to {name}"

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §5

*Given* a drag at Board layer:

- *given* a region with one or more cards, not terminal and not the hover target, *then* its top zone reads **"Move Top"** and its bottom zone **"Move Bottom"**, and the middle band has no label;
- *given* an empty region, *then* its one zone reads **"Move to {name}"**, the region's name;
- *given* a done region with cards, *then* its bottom zone reads **"Move to {name}"**, the workphase's name;
- *given* a region that is the hover target, *then* its zones, and their labels, give way to the ghost.

The labels are asserted as text; their look is open.

**Automation test:** —

## DRAG-3.19 — At Board and Column layers, both copies of a dragged Card are shortCard, and its attached children are unrendered

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a

*Given* Card `X` with a long description, an assignee and attached children `S1, S2`, *when* `X` is dragged at Board or Column layer, *then* both its carried copy and its in-list ghost render as shortCard: one pills row, the title on one line, the description clamped to exactly one line (with the line kept even when `X` has no description), no assignee footer, and no attached-children indicator or count. Both copies are the same fixed height whatever `X` contains.

`S1` and `S2` aren't rendered anywhere for as long as `X` is being dragged: not inside `X`'s copies, not dimmed, simply absent. *When* `X` is dropped, *then* it returns to full height, and `S1` and `S2` render inside it again.

**Automation test:** —

## DRAG-3.20 — Band guides show only at Board layer

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §5, wiki board-drag-interaction §1.1

*Given* a drag at Board layer, *then* every column and sub-row region shows its two band dividers ([DRAG-3.5](drag-3-card-column-bands.md)). Which band a release resolves by is shown by the ghost, not by the guides ([DRAG-3.11](drag-3-card-column-bands.md)). *When* the drag locks into a column, sub-row or Card, *then* no region shows any dividers. This case asserts where guides appear, not how they look.

**Automation test:** —

## DRAG-3.21 — A band reads the region's live content on every sample

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §5

*Given* Card `X` at Board layer over region `R`, *when* `R`'s content moves under a still cursor (the column scrolls, or a sibling region above it reflows), *then* a release resolves by the band the cursor is in relative to `R`'s content as it is now: where the dividers are drawn at that moment. The ghost appearing in `R` doesn't move `R`'s content, since it takes over `R`'s reservation without changing `R`'s height; that's [DRAG-3.17](drag-3-card-column-bands.md)'s rule.

**Automation test:** `client/src/components/workflow/popSession.test.ts`

## DRAG-3.22 — From the Card layer down, both copies of the dragged item are Stub rows

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a

*Given* Card `X` locked in a column, as shortCard, *when* `X` zooms into Card `P`, *then* both its carried copy and its ghost become Stub rows like `P`'s own rows. The carried copy is as wide as a row in `P`'s section, keeps a "held" shadow so it reads as carried, and stays under the pointer through the switch. *When* `X` pops back out to the column, *then* both copies are shortCard again, still under the pointer. *And given* a Stub's own drag, *then* its copies are Stub rows from pickup.

**Automation test:** —

## DRAG-3.23 — A Card popped into a done column is released as a workphase change with no anchor

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §7.4

*Given* Card `X` in workphase `W1`, popped into a done column, *when* the user releases anywhere in the column, *then* the request is a workphase-only move to the done workphase, with no anchor: a Free done item has no position, so it can't be named as an anchor. The server sets `X.completedAt` and drops `X.position`, and `X` previews and lands as the newest completion ([DRAG-6.11](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-3.24 — A card set back down inside its own done column: the ghost stays in its slot, and nothing is written

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* a done column rendering `D1, X, D2` by `completedAt`, where `X` is a Free item with no position, *when* `X` is picked up and the cursor moves up and down the column's list, *then* the ghost stays in `X`'s own slot, between `D1` and `D2`, and no card shuffles: a done list has no slot to choose. *When* the user releases anywhere in the column, *then* `X` is being set back down, and no request is sent: its workphase, `completedAt` and place in the list are unchanged.

**Automation test:** —

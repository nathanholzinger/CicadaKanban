# DRAG-1 — Contexts, the layer stack, and popping

**Next ID:** DRAG-1.34

**Terms.** *Sustained* means the cursor stays for at least the named tuning-panel value. *The full zoom-in hold* is `cardZoomDwellMs` then `cardPopInDelayMs`, holding steady the relation the side highlight names ([DRAG-4.19](drag-4-attach-and-stub-placement.md)). A column is merged unless a case says expanded.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-1.1 | A drag starts in exactly one layer, set by the item and its column's display mode | P0 | Open |
| DRAG-1.2 | A release at Column layer lands the item exactly where the ghost is | P0 | Open |
| DRAG-1.3 | A sustained signal outside the locked context pops out one layer | P0 | Automated |
| DRAG-1.4 | Brushing past a Card while repositioning never attaches | P0 | Automated |
| DRAG-1.5 | After a zoom in, a release commits the new layer's within-action | P0 | Open |
| DRAG-1.6 | Expanded mode: a sibling sub-row is a different context, reached only through Board | P0 | Open |
| DRAG-1.7 | A Cycle-forming Card can be named for a reposition, but is never zoomed into | P0 | Automated |
| DRAG-1.8 | A Depth-capped Card can be named for a reposition, but is never zoomed into | P0 | Automated |
| DRAG-1.9 | At Board layer, nowhere is no region, and a release there writes nothing | P0 | Open |
| DRAG-1.10 | A region is clipped to what is visible | P1 | Automated |
| DRAG-1.11 | The Board → Column pop-in clock counts time in the region and fires only from the middle band | P1 | Automated |
| DRAG-1.12 | A popped-out card can pop back into the column it just left | P1 | Open |
| DRAG-1.13 | A drag picked up from Unsorted starts at Board layer, with no context | P1 | Open |
| DRAG-1.14 | Pop-out by distance: when enabled, either the clock or the distance satisfies | P2 | Open |
| DRAG-1.16 | Rule 1: a release always commits the locked layer's within-action, wherever the bare cursor rests | P0 | Open |
| DRAG-1.17 | Rule 2: a pop moves exactly one layer | P0 | Open |
| DRAG-1.18 | Rule 3: distance never satisfies a zoom in | P1 | Open |
| DRAG-1.19 | A distant yank out of a Card cascades through two pops, one layer at a time | P1 | Open |
| DRAG-1.20 | Only the locked column's or sub-row's own Cards can be zoomed into | P0 | Open |
| DRAG-1.21 | Card → Descendants: holding over the descendants section zooms in; popping out returns to the Card | P1 | Open |
| DRAG-1.22 | The dragged card's own slot counts: resting over its pickup place opens no gap elsewhere | P1 | Open |
| DRAG-1.23 | At either end of a list the one neighbor is named; a ghost alone names nothing | P0 | Automated |
| DRAG-1.24 | Setting a card back down in its own slot saves the named anchor; only a card alone writes nothing | P0 | Open |
| DRAG-1.25 | A short merged column's empty space below its last card still counts as the context | P1 | Automated |
| DRAG-1.26 | The locked layer always carries an outline, in `activeContextOutlineColor` | P2 | Open |
| DRAG-1.27 | The carried card tilts on pickup | P2 | Open |
| DRAG-1.28 | The carried card is bounded by its context | P1 | Open |
| DRAG-1.29 | After a pop out, the carried card snaps to the cursor over `popSnapMs` | P2 | Manual |
| DRAG-1.30 | The pop-out clock runs from leaving the context, wherever the cursor goes, and resets on return | P1 | Automated |
| DRAG-1.31 | The tuning panel exposes every threshold and overlay value, and its values persist | P1 | Open |
| DRAG-1.32 | Popping feels deliberate: never incidental, never sluggish | P1 | Manual |
| DRAG-1.33 | A drag leaves every Card's list of Stubs as the user set it, except a Card it zooms into | P2 | Open |

---

## DRAG-1.1 — A drag starts in exactly one layer, set by the item and its column's display mode

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1, wiki board-drag-interaction §1.1

*Given* each of the following, *when* a drag begins, *then* its starting layer and context are:

- a Free Card in a **merged** column → Column layer; the context is the column's **list box** (its body, not its header or footer);
- a Free Card in an **expanded** column → Column layer; the context is the sub-row the Card is rendered in, not the column;
- an item picked up from **Unsorted** → Board layer, with no context ([DRAG-1.13](drag-1-contexts-and-popping.md));
- a **Stub**, at any depth → the **Descendants** layer of its containing Card, the nearest Free ancestor ([DRAG-5.13](drag-5-detach-and-overflow.md)).

A Free Card's drag never starts inside a Card. Nothing the user does at pickup chooses the layer.

**Automation test:** —

## DRAG-1.2 — A release at Column layer lands the item exactly where the ghost is

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* a column rendering `A, B, Q, X`, *when* `X` is dragged up until the ghost opens a gap between `A` and `B`, *then*:

- with the carried card above the ghost's middle, the side highlight is on `A`, and a release commits `{anchorId: A, side: after}`;
- with the carried card below the ghost's middle, the side highlight is on `B`, and a release commits `{anchorId: B, side: before}`.

In both, `X` lands between `A` and `B`, where the ghost was, and `workphaseId`, `parentId` and `isAttached` are unchanged. The card the side highlight names is always the card the release names. The side is never chosen by which half of a hovered card the cursor is over.

**Automation test:** —

## DRAG-1.3 — A sustained signal outside the locked context pops out one layer

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3, wiki board-drag-interaction §3.1

*Given* a Card locked in its column, *when* the cursor leaves the context (into another column, a sibling sub-row, or nowhere) and stays out for `popDelayMs`, *then* the item pops out to Board: it belongs to no context and follows the cursor freely. It doesn't yet belong to whatever region the cursor is in; entering one is a separate act ([DRAG-1.5](drag-1-contexts-and-popping.md), [DRAG-1.11](drag-1-contexts-and-popping.md)).

The same clock pops a Card out to its column and Descendants out to its Card ([DRAG-1.17](drag-1-contexts-and-popping.md), [DRAG-1.21](drag-1-contexts-and-popping.md)). This case asserts that the pop is reachable; its pass never depends on the clock's value. [DRAG-1.30](drag-1-contexts-and-popping.md) covers a momentary excursion.

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-1.4 — Brushing past a Card while repositioning never attaches

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3.1, wiki board-drag-interaction §6.1

*Given* Card `X` being repositioned within its column past Cards `A` and `B`, *when* the side highlight names each of them only briefly, for less than the full zoom-in hold, and the user releases between `A` and `B`, *then* the commit is a reposition naming `A` or `B`, and `X.parentId` is unchanged. Popping is never incidental.

This case asserts the clock's logic, with its threshold as a parameter; its pass never depends on the tuned values. Whether they feel right is [DRAG-1.32](drag-1-contexts-and-popping.md).

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/placement.test.ts`

## DRAG-1.5 — After a zoom in, a release commits the new layer's within-action

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §3

*Given* a Card that has zoomed in one layer, *when* it is released, *then* the commit is the new layer's within-action and nothing else:

- **Board → Column/sub-row** (sustained `popInDelayMs` in the middle band, [DRAG-3.4](drag-3-card-column-bands.md)): the anchor and side the ghost's named neighbor gives, not the band the cursor is in. The item is now bounded by the new context.
- **Column/sub-row → Card** (the full zoom-in hold): the auto-drop, as the **last child** for an item from outside ([DRAG-4.1](drag-4-attach-and-stub-placement.md)), wherever inside the Card the cursor is ([DRAG-4.14](drag-4-attach-and-stub-placement.md)).
- **Card → Descendants** (sustained `descendantsPopInDelayMs`, [DRAG-1.21](drag-1-contexts-and-popping.md)): the hierarchy placement at the ghost's gap and depth ([DRAG-4.8](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-1.6 — Expanded mode: a sibling sub-row is a different context, reached only through Board

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1

*Given* an expanded column with sub-rows `W1` and `W2`, and Card `X` locked in `W1` with the ghost at some slot there, *when* the cursor moves into `W2` and the user releases before `X` pops out, *then* the commit is `W1`'s reposition at the ghost's slot, and `X.workphaseId` stays `W1`.

*And when* the cursor stays in `W2` for `popDelayMs`, *then* `X` pops out to Board. A release there is `W2`'s band meaning ([DRAG-3.8](drag-3-card-column-bands.md)); staying `popInDelayMs` in `W2`'s middle band pops `X` into `W2` for placement by anchor and side. Either way the result is a workphase change to exactly `W2`, reached by popping. The gap between the two sub-rows is nowhere ([DRAG-1.9](drag-1-contexts-and-popping.md)).

**Automation test:** —

## DRAG-1.7 — A Cycle-forming Card can be named for a reposition, but is never zoomed into

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3.2, wiki board-drag-interaction §6.1

*Given* Card `X` with a detached descendant `D`, a Free Card in the same column, *when* `X` is locked into that column and the side highlight names `D` for well past the full zoom-in hold, *then* the dwell never starts: no cue appears on `D`, nothing zooms in, and a release commits the column's reposition naming `D`. `X` is never reparented, and the user never sees an item settle and bounce back. Validity is judged by the rule the API enforces ([ATT-4.2](../item-attachment/att-4-legal-parent-depth-cap.md), [ATT-4.3](../item-attachment/att-4-legal-parent-depth-cap.md)).

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/dragRegions.test.ts`, `client/src/components/workflow/dragClassification.test.ts`

## DRAG-1.8 — A Depth-capped Card can be named for a reposition, but is never zoomed into

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3.2, wiki board-drag-interaction §6.1

*Given* Card `X` with subtree height `H`, and Card `T` at depth `D` in the same column with `D + 1 + H > CAP` ([ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)), *when* `X` is locked into that column and the side highlight names `T` for well past the full zoom-in hold, *then* the dwell never starts, no cue appears, nothing zooms in, and a release commits the column's reposition. `T` stays a zoom-in target for another drag whose subtree fits.

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/dragRegions.test.ts`, `client/src/components/workflow/dragClassification.test.ts`

## DRAG-1.9 — At Board layer, nowhere is no region, and a release there writes nothing

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1, wiki board-drag-interaction §3.1

*Given* a Card at Board layer, *when* the cursor is over any of the following, *then* it is in no region, and no pop-in clock starts:

- a column's header or footer;
- the board toolbar;
- the gap between two columns;
- in an expanded column, the gap between two sub-rows, or the space below the last one;
- the Unsorted bucket;
- a broken column.

*When* the user releases there, *then* nothing is written: no request is made, the item's `workphaseId`, `position`, `parentId` and `isAttached` are unchanged, and it renders back where it started. A Card still locked in a column with its cursor over one of these places is different: it pops out after `popDelayMs` ([DRAG-1.3](drag-1-contexts-and-popping.md)), and a release before that commits the locked column's reposition ([DRAG-1.16](drag-1-contexts-and-popping.md)).

**Automation test:** —

## DRAG-1.10 — A region is clipped to what is visible

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §1

*Given* an expanded column whose sub-rows overflow its view, with sub-row `W3` scrolled out of sight, *when* a Card at Board layer has its cursor where `W3`'s box would be, *then* the cursor is nowhere ([DRAG-1.9](drag-1-contexts-and-popping.md)): no pop-in clock starts, and a release writes nothing. *When* the column scrolls so that `W3` comes into view under the cursor, *then* `W3` is a region from that moment: the pop-in clock starts, and a release resolves by `W3`'s band. Where a divider sits inside a visible region is [DRAG-3.16](drag-3-card-column-bands.md).

**Automation test:** `client/src/components/workflow/dragRegions.test.ts`

## DRAG-1.11 — The Board → Column pop-in clock counts time in the region and fires only from the middle band

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3, wiki board-drag-interaction §3.1

*Given* a Card at Board layer whose cursor enters region `R`'s top band:

- *When* the cursor stays in `R` for `popInDelayMs` without leaving the top band, *then* no pop in has happened, and the card is still at Board layer. What a release there commits is [DRAG-3.1](drag-3-card-column-bands.md)'s.
- *When* the cursor stays in the top band for `popInDelayMs` and then slides into the middle band, *then* the card pops in at once: time in the top or bottom band counts toward the clock.
- *When* the cursor leaves `R` before `popInDelayMs` and comes back, *then* the clock starts over.

*And given* a card that pops out with its cursor already inside a region, *then* the pop-in clock starts at the pop out itself, so the popped-out state always lasts at least `popInDelayMs`.

This case asserts the clock's logic, with its threshold as a parameter; its pass never depends on the tuned values. Whether they feel right is [DRAG-1.32](drag-1-contexts-and-popping.md).

**Automation test:** `client/src/components/workflow/popSession.test.ts`

## DRAG-1.12 — A popped-out card can pop back into the column it just left

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §3

*Given* Card `X` in a column rendering `A, B, X`, *when* the cursor leaves the column for `popDelayMs` (a pop out), comes back into its middle band for `popInDelayMs` (a pop in), and the user releases with the ghost directly above `A` and the side highlight naming `A`, *then* the commit is `{anchorId: A, side: before}`, with `workphaseId`, `parentId` and `isAttached` unchanged.

*And when* the user instead releases in the column's middle band at Board layer, after popping out but before popping in, *then* nothing is written: `X` is a member of the column's covered set, being set back down ([DRAG-3.12](drag-3-card-column-bands.md)).

**Automation test:** —

## DRAG-1.13 — A drag picked up from Unsorted starts at Board layer, with no context

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §3

*Given* an item in the Unsorted bucket, *when* it is picked up, *then* the drag starts at Board layer: no context, no bounding, and the carried card follows the cursor freely from the first movement. From there:

- a release over Unsorted, or anywhere else that is nowhere ([DRAG-1.9](drag-1-contexts-and-popping.md)), writes nothing;
- a release in a column region's band commits that band's meaning, with the workphase change into that column ([DRAG-3.1](drag-3-card-column-bands.md), [DRAG-3.2](drag-3-card-column-bands.md), [DRAG-3.3](drag-3-card-column-bands.md));
- staying `popInDelayMs` in a region's middle band pops the item in, and a Card can be zoomed into only from there, never straight from Board ([DRAG-1.17](drag-1-contexts-and-popping.md)).

**Automation test:** —

## DRAG-1.14 — Pop-out by distance: when enabled, either the clock or the distance satisfies

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §3.1

*Given* `popDistancePx` set above 0, *when* the cursor moves at least that far outside the locked context's box before `popDelayMs` has elapsed, *then* the item pops out one layer at once. This holds for a column or sub-row (out to Board), a Card (out to its column) and Descendants (out to its Card) alike: one pop-out rule serves every layer. *And given* `popDistancePx` is 0, *when* the cursor moves any distance outside the context for less than `popDelayMs`, *then* no pop happens; only the clock decides.

A single cursor sample decides the distance term, so this case holds at whatever values the test sets; its pass never depends on the tuned values.

**Automation test:** —

## DRAG-1.16 — Rule 1: a release always commits the locked layer's within-action, wherever the bare cursor rests

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §2

*Given* Card `X` locked in column `C1`, with the ghost after `A` and the side highlight on `A`, *when* the cursor moves, before a pop out fires, over any of: column `C2`'s list box (in any band), a sibling sub-row, a Card in `C2`, `C1`'s own header, the gap between columns, or Unsorted, and the user releases, *then* the commit is `C1`'s reposition, `{anchorId: A, side: after}`, with `workphaseId` and `parentId` unchanged. `C2`'s bands, `C2`'s Cards and "nowhere writes nothing" play no part, since none of them is the locked layer.

*And given* `X` zoomed into Card `P`, *when* the cursor leaves `P`'s box and the user releases before `popDelayMs` elapses, *then* the commit is still `P`'s within-action: `X` attached as `P`'s last child ([DRAG-4.1](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-1.17 — Rule 2: a pop moves exactly one layer

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1

- *Given* Card `X` at Board layer and a Valid Card `P` in column `K`, *when* the cursor rests on `P` for any length of time, *then* what can happen is `K`'s own pop in (the middle band, `popInDelayMs`), landing at Column layer, bounded by `K`. Only then can a zoom into `P` begin. A release at Board layer with the cursor on `P` commits `K`'s band meaning ([DRAG-3.1](drag-3-card-column-bands.md)), never an attach.
- *Given* `X` zoomed into `P`, *when* the cursor stays outside `P`'s box for `popDelayMs`, *then* `X` pops out to `K`, not to Board: it is at Column layer, bounded by `K`'s list box, with its ghost back among `K`'s cards. A release now is `K`'s reposition, and no attach is committed ([DRAG-4.17](drag-4-attach-and-stub-placement.md)). Reaching Board takes a second pop out.
- *Given* `X` zoomed into `P`, and `P`'s sibling `Q` in the same column, *when* the cursor moves onto `Q`, *then* nothing zooms into `Q` until `X` has popped out to `K` and the side highlight has named `Q` for the full zoom-in hold. There is no direct hop from sibling to sibling.

**Automation test:** —

## DRAG-1.18 — Rule 3: distance never satisfies a zoom in

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1

*Given* `popDistancePx` above 0, and Card `X` locked in column `K` with the side highlight naming `K`'s Card `P` and the cursor far inside `P`'s box, *when* the user releases before the full zoom-in hold completes, *then* the commit is `K`'s reposition: nothing zoomed in. How far or how fast the cursor moved never counts. The same holds for `descendantsPopInDelayMs` at Card → Descendants.

The case holds at whatever values the test sets; its pass never depends on the tuned values.

**Automation test:** —

## DRAG-1.19 — A distant yank out of a Card cascades through two pops, one layer at a time

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1

*Given* `popDistancePx` above 0 and Card `X` zoomed into `P` in column `K`, *when* the cursor is yanked to a point at least `popDistancePx` outside `P`'s box and at least `popDistancePx` outside `K`'s list box, *then* `X` pops out to `K`, and `K`'s own pop out, judged afresh against the same distant cursor, fires straight after, leaving `X` at Board layer. Both pops happen, in that order. *When* the cursor instead comes to rest inside `K` but outside `P`, *then* only the first pop happens, and `X` stays locked in `K`. The same cascade carries a Stub out through its Card ([DRAG-5.11](drag-5-detach-and-overflow.md)).

A single cursor sample decides both pops, so this case holds at whatever values the test sets; its pass never depends on the tuned values.

**Automation test:** —

## DRAG-1.20 — Only the locked column's or sub-row's own Cards can be zoomed into

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §6.1

*Given* Card `X` alone in column `C1`, so the side highlight names nothing ([DRAG-4.23](drag-4-attach-and-stub-placement.md)), and a Valid Card `Q` in column `C2`, *when* the cursor rests on `Q` for well past the full zoom-in hold while `X` is still locked in `C1` (no pop out has fired), *then* nothing zooms into `Q`: the side highlight only ever names a neighbor of the ghost in `C1`'s own list, and `Q` never becomes one. A release commits `C1`'s within-action, which for a card alone writes nothing ([DRAG-1.24](drag-1-contexts-and-popping.md)). Attaching to `Q` takes a pop out to Board, a pop into `C2`, then a zoom into `Q` ([DRAG-4.15](drag-4-attach-and-stub-placement.md)).

*And given* an expanded column, with `X` alone in sub-row `W2` and Card `Q` in sub-row `W3` of the same column, *then* the same holds: `Q` is in a different context, and isn't a zoom-in target from `W2`.

**Automation test:** —

## DRAG-1.21 — Card → Descendants: holding over the descendants section zooms in; popping out returns to the Card

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §3, wiki board-drag-interaction §3.1

*Given* Card `X` zoomed into Card `P`, where `P` has attached children, *when* the cursor rests on `P`'s descendants section for `descendantsPopInDelayMs`, *then* `X` zooms into `P`'s Descendants layer, with no dwell and no cue at this edge. Both copies of `X` are Stub rows among `P`'s hierarchy, bounded to the section. A release commits the hierarchy placement at the ghost's gap and depth ([DRAG-4.8](drag-4-attach-and-stub-placement.md)) instead of the auto-drop. *When* the cursor rests on `P` but outside its descendants section, *then* nothing zooms in, and a release is the auto-drop ([DRAG-4.1](drag-4-attach-and-stub-placement.md)).

*And given* `X` at Descendants layer, *when* the cursor stays outside the descendants section for `popDelayMs`, *then* `X` pops out exactly one layer, to `P`'s Card layer. A release there is the auto-drop: the last child for an `X` from outside `P`, and set back down for `P`'s own Stub ([DRAG-5.12](drag-5-detach-and-overflow.md)).

A `P` with no attached children has no descendants section, so its Descendants layer can't be reached, and the auto-drop is the only outcome ([DRAG-4.12](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-1.22 — The dragged card's own slot counts: resting over its pickup place opens no gap elsewhere

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* Card `X` picked up from a column rendering `A, X, B`, *when* the carried card rests over the place it was picked up from, *then* no card shuffles: the ghost stays in `X`'s own slot, between `A` and `B`. A release there is [DRAG-1.24](drag-1-contexts-and-popping.md)'s set-down.

**Automation test:** —

## DRAG-1.23 — At either end of a list the one neighbor is named; a ghost alone names nothing

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §2

- *Given* a column rendering `A, B, X`, *when* `X`'s ghost is in the first slot, above `A`, *then* the side highlight is on `A`, and a release commits `{anchorId: A, side: before}` wherever the carried card sits relative to the ghost's middle.
- *Given* a column rendering `X, A, B`, *when* `X`'s ghost is in the last slot, below `B`, *then* a release commits `{anchorId: B, side: after}`.
- *Given* Card `X` in workphase `W1` with position `p`, popped into an empty column for workphase `W2`, *when* its ghost is alone in the list and the user releases, *then* the release takes the column's no-anchor slot, the middle band's meaning: the request carries `workphaseId: W2` and no anchor, and `X.position` stays `p` ([DRAG-3.3](drag-3-card-column-bands.md)). An item with no comparable position to keep lands last ([DRAG-6.10](drag-6-preview-reconciliation.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`, `tests/ui/item-repositioning-cross-column-dnd.spec.ts`

## DRAG-1.24 — Setting a card back down in its own slot saves the named anchor; only a card alone writes nothing

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* a column rendering `A, X, B`, and an item `U` this view doesn't show whose position falls between `A`'s and `X`'s in the workflow-wide order (wiki item-positioning §2), *when* `X` is picked up and released in its own slot with the side highlight on `A`, *then* a request is made, `{anchorId: A, side: after}`, and `X`'s saved position lands directly after `A`'s, so that it now also sorts before `U`. The column still renders `A, X, B`.

*And given* `X` alone in its column's list, *when* it is picked up and set back down in its own slot, *then* nothing is written: there is no neighbor to name.

**Automation test:** —

## DRAG-1.25 — A short merged column's empty space below its last card still counts as the context

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §2, wiki board-drag-interaction §3

*Given* merged column `K` whose cards fill only the top part of its body, and Card `X` locked in `K`, *when* the cursor moves into `K`'s empty space below the last card and rests there for well past `popDelayMs`, *then* `X` doesn't pop out. For whether the context holds, a merged column is bounded by its outer body (its full available height), not the content-sized list box its bands use. What a release there commits is [DRAG-1.16](drag-1-contexts-and-popping.md)'s.

*When* the cursor leaves `K`'s outer body, for example into the gap between columns, and stays for `popDelayMs`, *then* `X` pops out ([DRAG-1.3](drag-1-contexts-and-popping.md)). A sub-row's box already is its full bound, so sub-rows have no such space.

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/dragRegions.test.ts`

## DRAG-1.26 — The locked layer always carries an outline, in `activeContextOutlineColor`

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1

*Given* a drag, *when* it is locked in a column or sub-row, *then* that column or sub-row shows the locked outline. *When* it zooms into a Card, *then* the outline moves to that Card. Exactly one outline marks the locked context at a time, and it follows the lock as the drag pops. At Board layer nothing is locked, and no outline shows. The outline is drawn in the tuning panel's `activeContextOutlineColor`: changing that value changes the outline.

**Automation test:** —

## DRAG-1.27 — The carried card tilts on pickup

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* a Free Card, *when* it is picked up, *then* its carried copy is tilted, showing that it is held. This case asserts that the tilt is there, not its angle.

**Automation test:** —

## DRAG-1.28 — The carried card is bounded by its context

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §2

*Given* Card `X` locked in a merged column, *when* the cursor moves sideways out of the column, *then* the carried card stays within the column's horizontal extent, while still moving freely up and down within it. *Given* `X` locked in an expanded column's sub-row, *when* the cursor drifts toward the sub-row above or below, *then* the carried card also stays within the sub-row vertically. The carried card only leaves its context through a pop.

**Automation test:** —

## DRAG-1.29 — After a pop out, the carried card snaps to the cursor over `popSnapMs`

**Priority:** P2 · **Status:** Manual · **Rule:** wiki board-drag-interaction §3

*Given* Card `X` locked in its column with the cursor well outside it, *when* `X` pops out to Board, *then* the carried card moves from where it was held to the cursor in a short tween lasting `popSnapMs`, chasing the cursor if it moves meanwhile. With `popSnapMs` at 0, it jumps to the cursor at once. A pop out of a Card to its column snaps the same way, to the wider context.

**Automation test:** none — manual: judged by feel, and its length is a tunable value (`popSnapMs`).

## DRAG-1.30 — The pop-out clock runs from leaving the context, wherever the cursor goes, and resets on return

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §3.1

*Given* a Card locked in its column, *when* the cursor leaves the context and comes back before `popDelayMs` has elapsed, *then* no pop happens and the clock resets: a second excursion starts it from zero. What a release then commits is [DRAG-1.16](drag-1-contexts-and-popping.md)'s. *When* the cursor instead leaves and moves between places outside the context (the gap between columns, then another column, then nowhere) without coming back, *then* the clock keeps running from the moment it left, and the pop fires once `popDelayMs` has elapsed since then. Moving between foreign places never restarts it.

This case asserts the clock's logic, with its threshold as a parameter; its pass never depends on the tuned values. Whether they feel right is [DRAG-1.32](drag-1-contexts-and-popping.md).

**Automation test:** `client/src/components/workflow/popSession.test.ts`

## DRAG-1.31 — The tuning panel exposes every threshold and overlay value, and its values persist

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §3.1

*Given* the tuning panel, *when* it is opened, *then* it exposes `popDelayMs`, `popDistancePx`, `popInDelayMs`, `cardZoomDwellMs`, `cardPopInDelayMs`, `descendantsPopInDelayMs`, `popSnapMs`, `overlayFreeDescendantColor`, `overlayDepthCappedOpacity` and `activeContextOutlineColor`. *When* one of them is changed, *then* the next drag behaves by the new value without a rebuild. *And when* the page is reloaded, *then* the changed value is still in effect. Where the panel lives and who sees it are open questions, and aren't asserted.

**Automation test:** —

## DRAG-1.32 — Popping feels deliberate: never incidental, never sluggish

**Priority:** P1 · **Status:** Manual · **Rule:** wiki board-drag-interaction §3.1

*Given* ordinary use at a natural pace (reordering within a column, moving a card to another column, zooming into a Card), *when* a person drags, *then* brushing past a neighboring context while reordering never pops, and a deliberate move into another context pops without feeling sluggish. This is the judgment the tuning panel's values are set by.

**Automation test:** none — manual: judged by feel against the tuned values.

## DRAG-1.33 — A drag leaves every Card's list of Stubs as the user set it, except a Card it zooms into

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §6.1

*Given* Card `C`, whose list of Stubs the user has collapsed, and Card `E`, whose list the user has expanded, *when* a drag of another Card `X` changes layers (pops out to Board, pops into `C`'s column, and out again) and is released, *then* `C`'s list is still collapsed and `E`'s is still expanded, at every layer change and after the release.

The exceptions:

- `X`'s own Stubs aren't shown while it's dragged ([DRAG-3.19](drag-3-card-column-bands.md)). After the release, `X`'s list is back as the user set it, collapsed or expanded.
- *When* the drag zooms into collapsed `C` ([DRAG-4.19](drag-4-attach-and-stub-placement.md)), *then* `C` opens. *When* the drag then pops out of `C` and is released elsewhere, *then* `C` is collapsed again. *When* `X` is instead attached into `C`, *then* `C` stays open after the release, so `X`'s new place is in view.

**Automation test:** —

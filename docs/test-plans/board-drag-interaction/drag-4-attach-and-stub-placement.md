# DRAG-4 — Card attach and hierarchy placement

**Next ID:** DRAG-4.36

**Terms.** *The full zoom-in hold* is as in [DRAG-1](drag-1-contexts-and-popping.md). *The tree* is Card `P`'s hierarchy, with depths counted from `P`'s children at 0:

```
S1        (0)
  S1a     (1)
    S1a1  (2)
S2        (0)
```

The consequences of an attach (inheritance, the project cascade, a done parent's legality) are [`../item-attachment/`](../item-attachment/INDEX.md)'s cases. Cases here assert which request the gesture produces. The project sidebar places by the same shared rules, and its cases are [`../project-tree/`](../project-tree/INDEX.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-4.1 | Releasing immediately after zooming into a Card attaches as its last child, inheriting its workphase | P0 | Open |
| DRAG-4.3 | A done Card beside the ghost can be zoomed into and attached to | P1 | Open |
| DRAG-4.5 | The same aim means two things: a quick release inserts between, a hold attaches | P0 | Open |
| DRAG-4.8 | Descendants placement: vertical position picks the gap, and the depth range is `[Bottom … Top + 1]` | P0 | Automated |
| DRAG-4.9 | Descendants placement: Top's depth → sibling after Top's subtree; Top + 1 → Top's first child | P0 | Automated |
| DRAG-4.10 | Descendants placement: shallower levels walk Top's ancestors; the shallowest is "before Bottom" | P0 | Automated |
| DRAG-4.11 | Descendants placement: boundaries and clamping | P1 | Automated |
| DRAG-4.12 | A childless Card has one Descendants placement state: its sole child | P1 | Open |
| DRAG-4.13 | Placement among a done Card's Stubs works normally | P1 | Open |
| DRAG-4.15 | An attach to a Card in another column takes three pops; the destination column's bands play no part | P0 | Open |
| DRAG-4.17 | Popping out of the Card before release cancels the attach | P0 | Open |
| DRAG-4.18 | An over-cap tab state is reachable, marked, and commits nothing; a cycle is unreachable | P0 | Automated |
| DRAG-4.19 | The Card zoomed into is the one the side highlight names | P0 | Open |
| DRAG-4.20 | The hold is a silent dwell, then a visible cue on the named Card, ending in the zoom in | P1 | Open |
| DRAG-4.21 | The cue never moves or resizes anything | P1 | Open |
| DRAG-4.22 | Both stages reset when the named relation changes, on a pop out, and on a cancel | P1 | Open |
| DRAG-4.23 | A ghost alone in its list names no Card, so nothing can be zoomed into | P1 | Automated |
| DRAG-4.24 | The cue's progress says how long to keep holding, and that letting go still repositions | P2 | Manual |
| DRAG-4.25 | Zooming in takes a deliberate hold, and once inside, the ghost reads as nesting | P1 | Manual |
| DRAG-4.29 | A Stub set back down in its own gap, at its own depth, writes nothing | P1 | Automated |
| DRAG-4.30 | Zooming into a Card seeds the ghost independently of the cursor's gap | P1 | Open |
| DRAG-4.32 | An over-cap tab state shows a visible invalid cue | P1 | Open |
| DRAG-4.33 | Below a nested last item, a sibling placement after each of its ancestors is offered | P1 | Open |
| DRAG-4.34 | After zooming in from outside, cursor movement chooses the ghost's gap and depth | P0 | Open |
| DRAG-4.35 | A Descendants release after the last move lands at the ghost's gap and depth | P0 | Open |

---

## DRAG-4.1 — Releasing immediately after zooming into a Card attaches as its last child, inheriting its workphase

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §6, wiki board-drag-interaction §7

*Given* Free Card `X` in workphase `W1`, and Card `P` in `W2` with Stubs `S1, S2`, *when* `X` is locked into `P`'s column, the side highlight names `P` for the full zoom-in hold, and the user releases immediately after the zoom without moving the cursor, *then* the committed change is: `X.parentId = P`, `X.isAttached` true, `X.workphaseId = W2`, and `X` last among `P`'s attached children, after `S2`. The zoom starts the ghost in that last-child state. `X` now renders as a Stub inside `P`. `P` itself is unchanged ([ATT-2.1](../item-attachment/att-2-reparenting-is-one-way.md)), and every field lands in one commit ([ATT-3.6](../item-attachment/att-3-reparent-placement-atomicity.md)).

*And given* `X` is a detached child of `P` (Free, with `X.parentId` already `P`, [ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md)), *then* the same gesture commits the same attach: `X` attached, last among `P`'s Stubs, with its workphase inherited again ([ATT-7.6](../item-attachment/att-7-detach-preserves-parent.md)). The same `parentId` doesn't make `X` already there. A Stub picked up attached inside `P` and brought back during the same drag has its own-slot seed instead ([DRAG-4.30](drag-4-attach-and-stub-placement.md)).

Moving the cursor after the zoom chooses another placement at the same Descendants layer ([DRAG-4.34](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-4.3 — A done Card beside the ghost can be zoomed into and attached to

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §6, wiki board-drag-interaction §6.1, wiki board-drag-interaction §2

*Given* Card `P` in a terminal workphase, the newest completion in its done column, *when* `X` pops into that done column, where its ghost rests after `P` as the newest completion (wiki board-drag-interaction §2, rule 6), the user holds the carried card over `P`, which is also the ghost's only neighbor, for the full zoom-in hold, and releases immediately after the zoom without moving the cursor, *then* the release commits the same attach as [DRAG-4.1](drag-4-attach-and-stub-placement.md): `X.parentId = P`, `X` attached, and last among `P`'s Stubs. What an attach to a done parent does to `X`'s workphase and `completedAt` is item-attachment's rule ([ATT-6.1](../item-attachment/att-6-attaching-to-done-parent.md)). A done column's single band ([DRAG-3.9](drag-3-card-column-bands.md)) governs only a release at Board layer, never a zoom into one of its Cards.

**Automation test:** —

## DRAG-4.5 — The same aim means two things: a quick release inserts between, a hold attaches

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §6

*Given* Cards `A` and `B` next to each other in a column, and Card `X` locked in that column with its ghost between them and the side highlight on `B`, *when* the user releases before the full zoom-in hold completes, *then* the commit is a reposition, `{anchorId: B, side: before}`, with `X.parentId` unchanged: inserting is the default. *When* the user instead holds the same relation for the full zoom-in hold and releases immediately after the zoom without moving the cursor, *then* the commit is an attach to `B` as its last child ([DRAG-4.1](drag-4-attach-and-stub-placement.md)). The hold separates the two, not the aim.

**Automation test:** —

## DRAG-4.8 — Descendants placement: vertical position picks the gap, and the depth range is `[Bottom … Top + 1]`

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §1, wiki hierarchy-placement §4, wiki board-drag-interaction §7.1

*Given* `X` at `P`'s Descendants layer over the tree, *when* the ghost is in the gap between `S1a1` (Top, depth 2) and `S2` (Bottom, depth 0), *then* exactly four tab states are offered, at depths **0, 1, 2 and 3**, and each commits a different placement ([DRAG-4.9](drag-4-attach-and-stub-placement.md), [DRAG-4.10](drag-4-attach-and-stub-placement.md)). None is shallower than `S2`'s depth: that would make `X` an ancestor of `S2`, and an item chooses its parent, never its children. *When* the ghost is in the gap between `S1` and `S1a` (Bottom is Top's child), *then* exactly one state is offered: depth 1, `S1`'s first child, before `S1a`.

The gap is where the rows slide aside to make room, in the same list shuffle as a column's ([DRAG-1.2](drag-1-contexts-and-popping.md)). `X` and its own subtree travel with it, are passed over, and are never Top or Bottom.

**Automation test:** `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/workflow/descendantsProjection.test.ts`, `client/src/components/workflow/dragCollision.test.ts`

## DRAG-4.9 — Descendants placement: Top's depth → sibling after Top's subtree; Top + 1 → Top's first child

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §1

*Given* the tree, with the ghost in the gap between `S1a1` (Top) and `S2` (Bottom), *when* `X` is released **aligned with Top** (depth 2), *then* `X` is Top's sibling after Top's whole subtree: `X.parentId = S1a`, attached, `{anchorId: S1a1, side: after}`. *When* it is released **one tab right of Top** (depth 3), *then* `X` is Top's **first child**: `X.parentId = S1a1`, attached, and placed before any existing child of `S1a1`. To land anywhere else among a parent's children, the user anchors against one of those children.

"Sibling after `S1a`" isn't reached from the gap directly under `S1a`, which offers only "first child of `S1a`" ([DRAG-4.8](drag-4-attach-and-stub-placement.md)). It is reached from the gap below the last item of `S1a`'s subtree, tabbed to `S1a`'s depth ([DRAG-4.10](drag-4-attach-and-stub-placement.md)).

**Automation test:** `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/workflow/descendantsProjection.test.ts`

## DRAG-4.10 — Descendants placement: shallower levels walk Top's ancestors; the shallowest is "before Bottom"

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §1

*Given* the tree, with the ghost in the gap between `S1a1` (Top, depth 2) and `S2` (Bottom, depth 0), *when* `X` is released **one tab left** of Top (depth 1), *then* `X` is a sibling of Top's parent, after that parent's subtree: `X.parentId = S1`, attached, `{anchorId: S1a, side: after}`. *When* it is released **two tabs left** (depth 0), *then* `X` is a sibling of Top's grandparent: `X.parentId = P`, attached, `{anchorId: S1, side: after}`. That is the same placement as "before `S2`": the client sends one relation, and the result is identical either way. Bottom only caps how far left the walk goes. These middle levels are reachable from no other gap, so the walk is what makes "last child of `S1`" placeable at all.

**Automation test:** `client/src/lib/hierarchyPlacement.test.ts`

## DRAG-4.11 — Descendants placement: boundaries and clamping

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §2, wiki hierarchy-placement §3, wiki board-drag-interaction §7.1

*Given* the tree:

- **above the first item** (no Top; Bottom is `S1`): one state, depth 0: `X.parentId = P`, `{anchorId: S1, side: before}`, the root's first child;
- **below the last item** (Top is `S2`; no Bottom): the states from depth 0 up to Top's depth + 1: depth 0 is `{anchorId: S2, side: after}` under `P`, and depth 1 is `S2`'s first child. A nested last item is [DRAG-4.33](drag-4-attach-and-stub-placement.md)'s;
- **clamping:** an offset further left than Bottom's depth resolves as Bottom's depth, and one further right than Top's depth + 1 resolves as Top's depth + 1. No offset produces "no state";
- **the root floor:** no gap offers a state shallower than `P`'s own children. `X` can't be tabbed out of `P`; leaving `P` is a zoom out ([DRAG-5.1](drag-5-detach-and-overflow.md)).

A `P` with no attached children offers the empty hierarchy's one state ([DRAG-4.12](drag-4-attach-and-stub-placement.md)).

**Automation test:** `client/src/lib/hierarchyPlacement.test.ts`

## DRAG-4.12 — A childless Card has one Descendants placement state: its sole child

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §7.1, wiki hierarchy-placement §2

*Given* Valid Card `P` with no attached children, *when* `X` zooms into `P`, *then* the drag reaches `P`'s Descendants layer and offers exactly one state: gap 0, depth 0, `P`'s sole attached child. Moving within the Card, including offsets beyond either end of the depth range, keeps that one state. *When* the user releases, immediately or after moving, *then* the request attaches `X` to `P` with no anchor, and its position resolves by the append fallback in `P`'s empty Stub scope ([TC-2.20](../item-positioning/part-2-anchor-resolution.md)). The same holds when `P` has Free children but no attached ones: those children stay Free and aren't placement rows.

**Automation test:** —

## DRAG-4.13 — Placement among a done Card's Stubs works normally

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5, wiki item-positioning §7.4

*Given* Card `P` in a terminal workphase, with Stubs `S1, S2` that keep their positions, *when* `X` is released immediately after zooming into `P` ([DRAG-4.1](drag-4-attach-and-stub-placement.md)) or placed in another gap and depth after cursor movement ([DRAG-4.34](drag-4-attach-and-stub-placement.md)), *then* the requests are made and accepted exactly as for a parent that isn't done: `P`'s Stubs can be named as anchors ([TC-7.15](../item-positioning/part-7-board-placement-intents.md)).

**Automation test:** —

## DRAG-4.15 — An attach to a Card in another column takes three pops; the destination column's bands play no part

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §1.1, wiki board-drag-interaction §6

*Given* Free Card `X` locked in column `C1` (workphase `W1`), and a Valid Card `P` in column `C2`, a merged column covering `W2, W3`, with `P` in `W3`, *when* the cursor leaves `C1` for `popDelayMs` (out to Board), stays in `C2`'s middle band for `popInDelayMs` (into `C2`), the side highlight names `P` for the full zoom-in hold (into `P`'s Descendants), and the user releases immediately after that zoom without moving the cursor, *then* `X` is attached to `P` as its last child, with `X.workphaseId = W3`, inherited from `P`, not `C2`'s entry workphase `W2`, and no band anchor from `C2`. *When* the cursor rests on `P` at Board layer, without `C2`'s pop in having fired, *then* a release commits `C2`'s band meaning ([DRAG-3.1](drag-3-card-column-bands.md)), not an attach.

**Automation test:** —

## DRAG-4.17 — Popping out of the Card before release cancels the attach

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §3, wiki board-drag-interaction §6

*Given* Free Card `X` zoomed into `P` in column `C`, *when* the cursor stays outside `P`'s box for `popDelayMs`, *then* one pop takes `X` out to `C`, at Column layer ([DRAG-1.17](drag-1-contexts-and-popping.md)): its Stub-row ghost is gone from `P`, and `X` is back in `C`'s list as shortCard. A release with the ghost after `C`'s Card `Q` and the side highlight on `Q` commits `{anchorId: Q, side: after}`, with `X.parentId` unchanged and `X` still Free. No attach request is made.

**Automation test:** —

## DRAG-4.18 — An over-cap tab state is reachable, marked, and commits nothing; a cycle is unreachable

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §3.2, wiki hierarchy-placement §4

*Given* `X` with subtree height `H` at `P`'s Descendants layer, where `P` is at absolute depth `d` in the workflow, *when* the user tabs to a state whose resulting depth, `d` plus the state's depth below `P` plus `H`, exceeds `CAP` (typically the deepest state, a child of Top; [ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)), *then* the state can still be reached, the ghost shows there marked invalid, and a release in it **commits nothing**: no request is made, and `X` goes back to where it was picked up. *When* the user tabs to a shallower state in the same gap that fits, *then* that state commits normally ([DRAG-4.9](drag-4-attach-and-stub-placement.md), [DRAG-4.10](drag-4-attach-and-stub-placement.md)). Validity is per state, not per gap, and the cap is checked against `X`'s deepest descendant, not `X` alone. The visible cue is [DRAG-4.32](drag-4-attach-and-stub-placement.md)'s.

*And given* `X` has descendants, *then* no tab state in any gap makes `X` its own descendant: its subtree travels with it and is never Top or Bottom ([DRAG-4.8](drag-4-attach-and-stub-placement.md)). A cycle simply has no state, and needs no cue.

**Automation test:** `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/workflow/descendantsProjection.test.ts`

## DRAG-4.19 — The Card zoomed into is the one the side highlight names

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §6.1

*Given* Card `X` locked in a column rendering `A, B, Q`, *when* the side highlight names `A` (with `side: after`) for the full zoom-in hold, *then* `X` enters `A`'s Descendants layer, whichever card the cursor is over at the time. *When* the side highlight instead names `B` (with `side: before`) for the full hold, *then* `X` enters `B`'s Descendants layer. The card under the cursor plays no part: it also slides aside to open the ghost's gap.

**Automation test:** —

## DRAG-4.20 — The hold is a silent dwell, then a visible cue on the named Card, ending in the zoom in

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §6.1

*Given* Card `X` locked in a column, with the side highlight naming Valid Card `A`:

- *during* the first `cardZoomDwellMs`, *then* nothing new is shown beyond the side highlight;
- *after* the dwell, *then* a visible cue appears on `A` and runs for `cardPopInDelayMs`;
- *when* the cue completes, *then* `X` enters `A`'s Descendants layer: `A` takes the locked outline ([DRAG-1.26](drag-1-contexts-and-popping.md)), opens with the ghost in its starting gap ([DRAG-4.30](drag-4-attach-and-stub-placement.md)), and the carried copy becomes a Stub row ([DRAG-3.22](drag-3-card-column-bands.md)).

A release at any point before the cue completes commits the reposition ([DRAG-4.5](drag-4-attach-and-stub-placement.md)). The cue's look is open; this case asserts only the order of what appears.

**Automation test:** —

## DRAG-4.21 — The cue never moves or resizes anything

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §6.1

*Given* the cue running on the named Card `A` ([DRAG-4.20](drag-4-attach-and-stub-placement.md)), *when* the positions and sizes of the cards, the ghost and the side highlight are compared from the cue's start to just before it completes, *then* none has changed: the ghost hasn't moved, and `A` is still the card named. A release during the cue commits what it would have when the cue started.

**Automation test:** —

## DRAG-4.22 — Both stages reset when the named relation changes, on a pop out, and on a cancel

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §6.1

*Given* the cue running on Card `A`, named with `side: after`:

- *when* the ghost moves so that a different card is named, *then* the cue on `A` disappears at once, and a fresh dwell starts for the new relation;
- *when* the ghost moves past `A` so that `A` is named on its other side (`side: before`), *then* the cue also disappears and a fresh dwell starts: a change of side is a new relation;
- *when* `X` pops out of the column, or the drag is cancelled, *then* the cue disappears, and nothing is left counting toward a zoom in.

After any reset, a release commits the reposition for the relation named at that moment.

**Automation test:** —

## DRAG-4.23 — A ghost alone in its list names no Card, so nothing can be zoomed into

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §6.1

*Given* Card `X` locked in a column whose list holds only `X`'s ghost, *when* the cursor rests anywhere in the column for well past the full zoom-in hold, *then* no side highlight shows, no dwell starts, no cue appears, and nothing zooms in. What a release commits is [DRAG-1.23](drag-1-contexts-and-popping.md)'s.

**Automation test:** `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/dragCollision.test.ts`

## DRAG-4.24 — The cue's progress says how long to keep holding, and that letting go still repositions

**Priority:** P2 · **Status:** Manual · **Rule:** wiki board-drag-interaction §6.1

*Given* a person holding a card on a named Card while its cue runs, *when* they watch the cue, *then* its progress tells them how much longer to hold, and it reads as something they can still back out of: letting go before it completes just repositions.

**Automation test:** none — manual: judged by feel.

## DRAG-4.25 — Zooming in takes a deliberate hold, and once inside, the ghost reads as nesting

**Priority:** P1 · **Status:** Manual · **Rule:** wiki board-drag-interaction §6.1, wiki board-drag-interaction §5a

*Given* ordinary repositioning at a natural pace, *when* a person pauses briefly on a card's slot, *then* it stays a reposition: zooming in takes a deliberate hold, and erring toward too hard is acceptable. *When* they do zoom in, *then* the Stub-row ghost among the Card's rows reads as "this will nest", not "this will replace".

**Automation test:** none — manual: judged by feel against the tuned values.

## DRAG-4.29 — A Stub set back down in its own gap, at its own depth, writes nothing

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §5, wiki board-drag-interaction §7.1

*Given* Stub `X` attached to Card `P`, whose Stubs are `S1, X, S2`, *when* `X` is picked up at `P`'s Descendants layer and released with the ghost in its own gap, between `S1` and `S2`, at its own depth, *then* no request is sent, and `X`'s parent, attachment and position are unchanged. With full context nothing between `S1` and `S2` is unseen, so the release can't move `X`. In a column the same set-down still saves its named anchor ([DRAG-1.24](drag-1-contexts-and-popping.md)).

**Automation test:** `client/src/components/workflow/descendantsProjection.test.ts`

## DRAG-4.30 — Zooming into a Card seeds the ghost independently of the cursor's gap

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7

*Given* Card `P` whose Stubs are `S1, S2`, where `S2` has a child `S2a`, so the last row is nested at depth 1:

- *when* Free Card `X`, locked in `P`'s column/sub-row, zooms into `P`'s Descendants layer, and the cursor hasn't moved since, *then* the ghost is in the last gap, below `S2a`, at depth 0: `P`'s last child, after `S2`'s whole subtree, not `S2`'s child at `S2a`'s depth. This holds even if the cursor is over `S1` when the zoom completes. A release then attaches `X` to `P`, last among `P`'s attached children;
- *when* `P`'s own Stub `S1`, picked up attached and popped out to `P`'s column during the same drag, zooms back into the Descendants layer, and the cursor hasn't moved since, *then* its ghost is in its own slot, at its own depth, and a release writes nothing ([DRAG-4.29](drag-4-attach-and-stub-placement.md)). The column's named neighbor `P` and the cursor's position over another row never replace that pickup slot with the last gap.

From there, the cursor moves the ghost as usual ([DRAG-4.8](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-4.32 — An over-cap tab state shows a visible invalid cue

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §3.2

*Given* `X` at `P`'s Descendants layer, *when* the user tabs to a state over the depth cap ([DRAG-4.18](drag-4-attach-and-stub-placement.md)), *then* the ghost shows a visible invalid cue there. *When* the user tabs back to a state in the same gap that fits, *then* the cue is gone. The cue's look is open; this case asserts only that it is there.

**Automation test:** —

## DRAG-4.33 — Below a nested last item, a sibling placement after each of its ancestors is offered

**Priority:** P1 · **Status:** Open · **Rule:** wiki hierarchy-placement §2

*Given* Card `P` whose Stubs are `S1, S2`, where `S2` has a child `S2a`, the last row, *when* `X` at `P`'s Descendants layer is in the gap below `S2a` (Top `S2a`, no Bottom), *then* exactly three states are offered, each committing a different placement:

- depth 0: `P`'s child, after `S2`'s whole subtree;
- depth 1: `S2`'s child, after `S2a`;
- depth 2: `S2a`'s first child.

**Automation test:** —

## DRAG-4.34 — After zooming in from outside, cursor movement chooses the ghost's gap and depth

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §6, wiki board-drag-interaction §7, wiki board-drag-interaction §7.1

*Given* Free Card `X` zoomed into Card `P`, with the tree, and its ghost starting as `P`'s last child, *when* the cursor moves to each of the following placements, *then* the carried Stub follows it within `P`'s whole box, the rows shuffle to open the chosen gap, and the ghost shows the corresponding depth:

- above `S1`, at depth 0 → a release attaches `X` to `P` before `S1`;
- between `S1a1` and `S2`, at depth 0 → a release attaches `X` to `P`, after `S1`'s subtree and before `S2`;
- in that same gap at depth 3 → a release attaches `X` to `S1a1` as its first child.

Each release lands exactly where the ghost showed. The ghost neither stays in the starting last gap nor stays at the first row as the cursor moves to later rows. This holds after naming `P` from above or from below in its column. `X` is absent from the origin column's list while inside `P`, and the origin gap closes. *Given* instead `X` is a Stub of another Card, popped out to the column in the same drag, *then* the same placements reparent it to the selected parent in one write, with the new parent's workphase inherited.

**Automation test:** —

## DRAG-4.35 — A Descendants release after the last move lands at the ghost's gap and depth

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §2, wiki board-drag-interaction §7.1, wiki hierarchy-placement §1

*Given* Card `P` with attached children `A, B, C, X`, where `A`, `B` and `C` are leaves, *when* `X` is dragged at `P`'s Descendants layer, the final pointer move crosses into a different row, and the pointer stops, *then* the side highlight names a neighbor of the gap the rows have opened for the ghost. No further pointer move is needed to make the release agree with that shown gap and depth. *When* the user releases there without moving again or opening the hierarchy modal, *then*:

- with the ghost between `B` and `C`, at depth 0, `X.parentId = P`, still attached, and `P`'s children are `A, B, X, C`. The request names the neighbor the highlight shows: `B/after` or `C/before`;
- with the ghost in that same gap, at depth 1, `X.parentId = B`, attached as `B`'s first child, and `P`'s children are `A, B, C`.

In both, `X` keeps `P`'s workphase, and the write places it where the ghost was shown at release, rather than in the gap named before the final row crossing. The same holds when `X` carries an attached child `XC`: `XC` stays attached beneath `X`, and neither travelling row is a gap neighbor. Each outcome holds when the final move approaches from above or below. Different approaches need not select the same gap at the same cursor point; each release must match its own shown placement.

**Automation test:** —

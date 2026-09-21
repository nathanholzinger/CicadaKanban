# DRAG-4 — Card → Card attach (Card layer) and hierarchy placement (Descendants layer)

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §6, §7 (§7 hardened 2026-09-17 from the Product Owner's "Placement rules for a Hierarchy"; Story 6, not built)

**Suite ID:** `DRAG-4`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-4.n`.

**Two layers, two within-actions.** A Card zoomed into another Card is at
**Card layer**, whose within-action is the **auto-drop** — no band, no
anchor, no choice of slot, wherever inside the Card the cursor rests:

- an item brought in from **outside** the Card is attached as its
  **last child** (Story 4 as built);
- a Stub picked up from **within** this same Card is set back down where
  it was picked up — nothing is written
  ([DRAG-5.12](drag-5-detach-and-overflow.md)).

The auto-drop is a different gesture from **manually** dragging a Stub to
sit directly beneath a line item at Descendants layer, which lands it as
that item's **first child** (TC-9). Last-by-auto vs. first-by-hand are
two cases, not one rule. *(Product Owner, 2026-09-17.)*

Zooming one layer further, into the Card's descendants section
([DRAG-1.21](drag-1-contexts-and-popping.md)), reaches **Descendants
layer**, whose within-action is the hierarchy placement rule below (Story
6, not built). From the Card layer down the carried item is represented
as a Stub-ghost, not a Card.

**The hierarchy placement rule (Descendants layer).** With full context,
the ghost sits in a **gap** between two rendered items — **Top** (the item
it will sit directly under) and **Bottom** (the item it will sit directly
above) — chosen by vertical position; **horizontal offset** then picks a
depth from a range of discrete tab states:

> **range = [ Bottom's depth … Top's depth + 1 ]**, depth increasing as
> you tab right (deeper).

- **Top's depth + 1** (tabbed once right of Top) → **Top's first child**.
- **Top's depth** (aligned with Top) → Top's sibling, positioned **after
  Top's entire subtree**.
- **Each shallower level** down to Bottom's depth → sibling of Top's
  ancestor at that depth, positioned after *that* ancestor's subtree. The
  shallowest of these is the same placement as "Bottom's sibling, just
  before it."
- Nothing shallower than Bottom: that would make New Bottom's ancestor,
  and an item may choose its parent, never its children.
- The range is floored at the hierarchy's **root** — the project in the
  sidebar, the Card `P` whose Descendants layer this is on the board. New
  can never be tabbed out of `P`; leaving `P` is a zoom-out, not a tab
  state.
- An offset past either end **clamps** to the nearest valid level.
- The dragged item and its whole subtree are removed from the Top/Bottom
  candidates first (they travel with it), so no gap can place it under
  its own descendant.
- A tab state whose resulting depth — counting the dragged subtree's
  height and `P`'s *absolute* depth in the workflow — would exceed `CAP`
  is still reachable and visibly marked invalid; a drop there is a
  **no-op**, the same as setting the item back down. *(An explicit
  exception to §3.2's "never enterable," for a discrete tab state rather
  than a target you pop into.)*

**Superseded here (2026-09-16):** the Stub *bands* — `FIRST_CHILD_BAND` /
`LAST_CHILD_BAND` / `POP_BAND` — are gone; a Card's within-action has no
band. TC-4, TC-6 and TC-7 stay in place as ⏸ superseded.

**Parameterization.** `CARD_POP_IN` (Column → Card, duration-only) and
`DESC_POP_IN` (Card → Descendants, duration-only, Story 6), plus
`POP_OUT` / `POP_IN` — all as defined in
[DRAG-1](drag-1-contexts-and-popping.md); the depth cap is `CAP`. Never
literals. The tab-step width (how far right is "one tab") is a UI
constant, not asserted.

The consequences of an attach — inheritance, cascade, project cascade,
done-parent legality — are [`../item-attachment/`](../item-attachment/)'s
rules applied unmodified; cases here assert the gesture produces the
right request and cross-reference the consequence.

**Automation status (2026-09-21).** The Card-layer cases (TC-1, 5, 12,
14–17) have no E2E and no `popSession` unit coverage — the Story 4 code
audit's #3. Deferred as a block to **Epic 3.5 Story 10** (roadmap), which
triages this whole suite once Stories 5–8 stop moving the thresholds; not
a gap to fill story by story.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | Zooming into a Card and releasing attaches as its last child, inheriting the parent's workphase | P0 | ⏳ pending triage |
| TC-2 | Attach across projects triggers the project cascade | P1 | ⏳ pending triage |
| TC-3 | Attach onto a done Card is allowed | P1 | ⏳ pending triage |
| TC-4 | ~~Attach at a slot: the anchor is one of the new parent's Stubs~~ | — | ⏸ superseded |
| TC-5 | Same geometry, two meanings: quick release inserts between, a hold attaches | P0 | ⏳ pending triage |
| TC-6 | ~~`FIRST_CHILD_BAND` quick release → first child; `LAST_CHILD_BAND` quick release → last child~~ | — | ⏸ superseded |
| TC-7 | ~~In the overlap, time decides: release commits the quick-drop, holding pops~~ | — | ⏸ superseded |
| TC-8 | Descendants placement — vertical position picks the gap; the depth range is `[Bottom … Top + 1]` | P0 | ⏳ pending triage |
| TC-9 | Descendants placement — Top's depth → sibling after Top's subtree; Top + 1 → Top's first child | P0 | ⏳ pending triage |
| TC-10 | Descendants placement — shallower levels walk Top's ancestors; the shallowest is "before Bottom" | P0 | ⏳ pending triage |
| TC-11 | Descendants placement — boundaries: first gap, last gap, Bottom is Top's child, empty hierarchy, clamping | P1 | ⏳ pending triage |
| TC-12 | Attach into a Card with no Stubs makes the item its sole child | P1 | ⏳ pending triage |
| TC-13 | Placement inside a done Card's Stub list works normally | P1 | ⏳ pending triage |
| TC-14 | The auto-drop is invariant to where inside the Card the cursor rests | P0 | ⏳ pending triage |
| TC-15 | A cross-column attach costs three pops; the destination column's band plays no part | P0 | ⏳ pending triage |
| TC-16 | The ghost shows only the within-action's result: a Stub at the last slot, wherever the cursor is | P1 | ⏳ pending triage |
| TC-17 | Popping out of the Card before release cancels the attach; the release is the column's reposition | P0 | ⏳ pending triage |
| TC-18 | Descendants placement — an over-cap tab state is reachable, marked, and a no-op on drop; a cycle is unreachable | P0 | ⏳ pending triage |

---

## TC-1 — Zooming into a Card and releasing attaches as its last child, inheriting the parent's workphase

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` in workphase `W1`, and Card `P` in `W2` with Stubs
`S1, S2`, *when* `X` is dragged, locked into `P`'s column (popping out
and in if it started elsewhere — TC-15), the cursor rests on `P` for ≥
`CARD_POP_IN` ([DRAG-1.17](drag-1-contexts-and-popping.md)), and the user
releases, *then* the committed change is: `X.parentId = P`, `X`
attached, `X.workphaseId = W2`, `X` positioned as the **last** of `P`'s
attached children — after `S2` (the request carries no anchor of the
user's choosing; the position resolves to the end of `P`'s Stub scope),
and `X` now renders as a Stub inside `P`. `P`'s row is untouched
([ATT-2.1](../item-attachment/att-2-reparenting-is-one-way.md)). All
fields land in one commit ([ATT-3.6](../item-attachment/att-3-reparent-placement-atomicity.md)).

Placing `X` as some item's *first* child is a different gesture — the
manual tabbed-right placement at Descendants layer (TC-9).

*And given* `X` is a **detached child of `P`** — Free, `X.parentId = P`
already ([ATT-7.1](../item-attachment/att-7-detach-preserves-parent.md))
— *then* the same gesture commits the same attach: `X` attached, last
among `P`'s Stubs, workphase re-inherited
([ATT-7.6](../item-attachment/att-7-detach-preserves-parent.md)). The
client must not read "same `parentId`" as "already in this list" and
set `X` back down — only `P`'s own *attached* Stub is at home there
([DRAG-5.12](drag-5-detach-and-overflow.md)). *(Added 2026-09-21 from
`docs/audits/code-quality-audit-epic-3-5-story-4.md` #1, where exactly
that no-op was found.)*

**Automation test:** — *(E2E deferred to Story 10 — see the roadmap.
The client's request derivation for the detached-child clause is unit-
covered: `boardDndUtils.test.ts` "a detached child re-attaching to its
own parent is not identity" / "toRequest … detached child".)*

## TC-2 — Attach across projects triggers the project cascade

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [ATT-5.1](../item-attachment/att-5-cross-project-reparenting.md)
/ [ATT-5.2](../item-attachment/att-5-cross-project-reparenting.md). *Given*
`X` in project `P1` and `P` in project `P2` (same workflow, both on the
board), *when* `X` is attached to `P` by drag (TC-1), *then* `X` and its
entire descendant subtree read `projectId = P2`.

**Automation test:** —

## TC-3 — Attach onto a done Card is allowed

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [ATT-6.1](../item-attachment/att-6-attaching-to-done-parent.md).
*Given* `P` in a terminal workphase rendered in a done column, *when* `X`
is locked into that done column ([DRAG-3.9](drag-3-card-column-bands.md)
governs only a Board-layer release there; popping in still works), zooms
into `P` (≥ `CARD_POP_IN`) and is released, *then* the attach is
committed: `X` inherits the terminal workphase, receives no
`completedAt`, and is positioned last among `P`'s Stubs.

**Automation test:** —

## TC-4 — ~~Attach at a slot: the anchor is one of the new parent's Stubs~~

**Priority:** — · **Automated:** ⏸ superseded

**Was:** with `X` popped into `P`'s context and released hovering the
lower half of `S1`, the request carried `{anchorId: S1, side: after}` and
the server placed `X` between `S1` and `S2`. **Superseded by** §6 as built
(2026-09-16): the Card layer's within-action is the auto-drop (TC-1,
TC-14). An anchored slot among a parent's Stubs is reached only at
Descendants layer (TC-8–TC-10).

**Automation test:** —

## TC-5 — Same geometry, two meanings: quick release inserts between, a hold attaches

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Cards `A` and `B` adjacent in a column and a dragged Card `X`
locked in that column with the cursor at the boundary between them, over
the edge of `B`, *when* the user releases before `CARD_POP_IN`, *then*
the commit is a reposition — `X` anchored against `A` or `B`,
`X.parentId` unchanged — insertion is the default. *And when* the user
instead holds there with the cursor on `B` for ≥ `CARD_POP_IN` and then
releases, *then* the commit is an attach to `B` as its last child
(TC-1). The pop threshold separates the two, not aim; the neighbors'
sliding apart for the ghost reads as "insert here" and is exactly what it
means until the hold completes.

*(Supersedes the Epic 3.2 interim "drop on card X = anchor X, side
before" default that [TC-X.5](../item-positioning/cross-cutting-regression.md)
guarded.)*

**Automation test:** —

## TC-6 — ~~`FIRST_CHILD_BAND` quick release → first child; `LAST_CHILD_BAND` quick release → last child~~

**Priority:** — · **Automated:** ⏸ superseded

**Was:** a Card over `P`'s top half released quickly attached as first
child; over the bottom half, as last child. **Superseded by** §6 as built
and the design doc's layer table: the Card layer has no bands; a release
is always the auto-drop (TC-1, TC-14). Any other slot is Descendants
placement (TC-8–TC-10).

**Automation test:** —

## TC-7 — ~~In the overlap, time decides: release commits the quick-drop, holding pops~~

**Priority:** — · **Automated:** ⏸ superseded

**Was:** inside the 20–80% `POP_BAND`, a quick release committed the
half's quick-drop and a hold popped into the hierarchy context.
**Superseded by** the layer model: there is no band to overlap; the
hierarchy (Descendants) layer is reached by holding over the Card's
descendants section ([DRAG-1.21](drag-1-contexts-and-popping.md)), not
by holding in a band.

**Automation test:** —

## TC-8 — Descendants placement — vertical position picks the gap; the depth range is `[Bottom … Top + 1]`

**Priority:** P0 · **Automated:** ⏳ pending triage

*(Story 6.)* *Given* `X` at `P`'s Descendants layer, where `P`'s
hierarchy renders (depths relative to `P`'s children = 0):

```
S1        (0)
  S1a     (1)
    S1a1  (2)
S2        (0)
```

*when* the ghost's vertical position places it in the gap between
`S1a1` (Top, depth 2) and `S2` (Bottom, depth 0), *then* exactly the tab
states at depths **0, 1, 2, 3** are offered — `[Bottom's depth …
Top's depth + 1]` — and each commits a different placement (TC-9,
TC-10): depth 3 → child of `S1a1`; 2 → sibling after `S1a1`; 1 →
sibling after `S1a` (after its subtree); 0 → sibling after `S1`, which
is the same placement as before `S2`. No state shallower than `S2`'s
depth is offered: it would make `X` `S2`'s ancestor, and an item chooses
its parent, never its children. *And given* the gap between `S1` and
`S1a` (Bottom is Top's child), *then* exactly one state is offered —
depth 1, first child of `S1`, before `S1a`.

The Top/Bottom candidates exclude `X` itself and its own subtree, which
travel with it.

**Automation test:** —

## TC-9 — Descendants placement — Top's depth → sibling after Top's subtree; Top + 1 → Top's first child

**Priority:** P0 · **Automated:** ⏳ pending triage

*(Story 6.)* *Given* the tree of TC-8 and the ghost in the gap between
`S1a1` (Top, depth 2) and `S2` (Bottom), *when* `X` is released
**aligned with Top** (depth 2), *then* `X` is Top's sibling positioned
after Top's entire subtree: `X.parentId = S1a`, attached, `{anchorId:
S1a1, side: after}`. *And when* released **tabbed once right of Top**
(depth 3), *then* `X` is Top's **first child**: `X.parentId = S1a1`,
attached, positioned before any existing child of `S1a1` (`{anchorId:
<first child>, side: before}` if it has children; the sole child
otherwise). To land elsewhere among a parent's children the user anchors
against one of those children, never directly under the parent.

Top is always the item *rendered* immediately above the ghost. So for an
item with descendants — `S1a`, whose child `S1a1` renders directly
beneath it — "sibling after `S1a`" is not reached from the gap directly
under `S1a` (that gap offers only "first child of `S1a`", TC-8); it is
reached from the gap below the **last item of `S1a`'s subtree**, tabbed
to `S1a`'s depth (TC-10's walk). "After Top" always means after Top's
whole subtree.

**Automation test:** —

## TC-10 — Descendants placement — shallower levels walk Top's ancestors; the shallowest is "before Bottom"

**Priority:** P0 · **Automated:** ⏳ pending triage

*(Story 6.)* *Given* the tree of TC-8 and the ghost in the gap between
`S1a1` (Top, depth 2) and `S2` (Bottom, depth 0), *when* `X` is released
**tabbed once left** of Top (depth 1), *then* `X` is a sibling of Top's
parent, positioned after that parent's subtree: `X.parentId = S1`,
attached, `{anchorId: S1a, side: after}`. *And when* released **tabbed
twice left** (depth 0), *then* `X` is a sibling of Top's grandparent:
`X.parentId = P`, attached, `{anchorId: S1, side: after}` — which, with
full context, is the same placement as `{anchorId: S2, side: before}`;
the client sends one relation, not both, and the server's result is
identical either way. Bottom's only role is to cap how far left the walk
can go.

These intermediate levels are reachable from **no other gap** (the gap
directly beneath `S1a` offers only "first child of `S1a`"), so the walk
is what makes "last child of `S1`" placeable at all.

**Automation test:** —

## TC-11 — Descendants placement — boundaries: first gap, last gap, Bottom is Top's child, empty hierarchy, clamping

**Priority:** P1 · **Automated:** ⏳ pending triage

*(Story 6.)* *Given* the tree of TC-8:

- **Above the first item** (no Top; Bottom = `S1`): one state, depth 0
  → `X.parentId = P`, `{anchorId: S1, side: before}` — first child of the
  root.
- **Below the last item** (Top = `S2`; no Bottom): states from the root
  depth up to Top + 1 — depth 0 → `{anchorId: S2, side: after}` under
  `P`; depth 1 → first child of `S2`. Had the last item been nested
  (say `S2a` under `S2`), the range would run from depth 0 (sibling after
  `S2`) through `S2a`'s depth (sibling after `S2a`) to `S2a` + 1 (child
  of `S2a`).
- **Bottom is Top's child** (gap between `S1` and `S1a`): exactly one
  state — depth 1, first child of `S1`, before `S1a` (TC-8).
- **Empty hierarchy**: not reachable as a Descendants layer — a `P` with
  no Stubs has no descendants section ([DRAG-1.21](drag-1-contexts-and-popping.md));
  the Card layer's auto-drop makes `X` the sole child (TC-12). In the
  project sidebar, where the empty root *is* reachable, the one state is
  the root's sole child.
- **Clamping**: an offset further left than Bottom's depth resolves as
  Bottom's depth; further right than Top + 1 resolves as Top + 1. No
  offset produces "no state."
- **The root floor**: from any gap, no state shallower than `P`'s own
  children is offered — `X` cannot be tabbed out of `P`; leaving `P` is a
  zoom-out ([DRAG-5](drag-5-detach-and-overflow.md)).

**Automation test:** —

## TC-12 — Attach into a Card with no Stubs makes the item its sole child

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.7](../item-positioning/part-7-board-placement-intents.md).
*Given* `P` with no Stubs, *when* `X` zooms into `P` and is released,
*then* the request is attach-to-`P` with no anchor and the position
resolves via the append fallback in the new (empty) scope — the auto-drop
of TC-1 with nothing to be last *after*. A `P` with no children has no
descendants section, so Descendants layer is not reachable from it and
the auto-drop is the only outcome ([DRAG-1.21](drag-1-contexts-and-popping.md)).

**Automation test:** —

## TC-13 — Placement inside a done Card's Stub list works normally

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.15](../item-positioning/part-7-board-placement-intents.md).
*Given* `P` done (terminal workphase) with Stubs `S1, S2` that retain
their positions, *when* `X` is auto-dropped (TC-1) or placed among them
via Descendants placement (TC-8–TC-10), *then* the requests are produced
and accepted exactly as for a non-done parent — the Stubs are anchorable;
`P`'s terminality is irrelevant to its Stubs' scope.

**Automation test:** —

## TC-14 — The auto-drop is invariant to where inside the Card the cursor rests

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` (from outside `P`) zoomed into `P` (Stubs `S1, S2, S3`),
*when* the user releases with the cursor at `P`'s top edge, over `P`'s
title, over `S1`, over `S3`, or at `P`'s bottom edge — anywhere inside
`P`'s box but not having zoomed into the descendants section — *then*
every release commits the identical request: attach to `P`, last child
(after `S3`). No band, no anchor, no per-position variation. This is
the Card layer's within-action and, by rule 1, the only thing a release
here can mean. (For a Stub that was picked up *inside* `P`, the same
invariance holds and the auto-drop is "set back down" —
[DRAG-5.12](drag-5-detach-and-overflow.md).)

**Automation test:** —

## TC-15 — A cross-column attach costs three pops; the destination column's band plays no part

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` locked in column `C1` (workphase `W1`) and a Valid
target Card `P` in column `C2` (a merged column covering `W2, W3`, with
`P` in `W3`), *when* the cursor leaves `C1` for ≥ `POP_OUT` (out to
Board), rests in `C2`'s middle band ≥ `POP_IN` (into `C2`), rests on `P`
≥ `CARD_POP_IN` (into `P`), and the user releases, *then* the commit is
attach to `P` as last child with `X.workphaseId = W3` — inherited from
`P`, **not** `C2`'s entry workphase `W2`, and with no band anchor from
`C2`. The write is TC-1's; only the path differs. *And when* the cursor
rests on `P` from Board layer without `C2`'s pop-in having fired, *then*
a release commits `C2`'s band meaning ([DRAG-3](drag-3-card-column-bands.md)),
not an attach ([DRAG-1.17](drag-1-contexts-and-popping.md)).

**Automation test:** —

## TC-16 — The ghost shows only the within-action's result: a Stub at the last slot, wherever the cursor is

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` (from outside) zoomed into `P` (Stubs `S1, S2, S3`), *when*
the cursor moves around inside `P`'s box, *then* the placement preview
is a Stub-ghost pinned after `S3` throughout — it does not track the
cursor to `S1` or `S2` — and `X` is absent from its origin column's list
(the gap closes, as in any cross-list move). The carried card itself
still follows the cursor, bounded to `P`'s box. The ghost is only ever
shown in the position/workphase/hierarchy the release would commit
(TC-14), so nothing in the preview promises a slot the release can't
deliver.

**Automation test:** —

## TC-17 — Popping out of the Card before release cancels the attach; the release is the column's reposition

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` zoomed into `P` in column `C` (Stub-ghost pinned last inside
`P`), *when* the cursor stays outside `P`'s box for ≥ `POP_OUT` (or
`POP_OUT_DISTANCE`), *then* `X` pops out to `C` — locked at Column layer
([DRAG-1.17](drag-1-contexts-and-popping.md)), the Stub-ghost gone, `X`
back as a Card-ghost in `C`'s list — and a release hovering the lower
half of `C`'s Card `Q` commits `{anchorId: Q, side: after}` with
`X.parentId` unchanged and `X` still Free. No attach request is made.
*And when* the cursor leaves `P` but returns before `POP_OUT`, *then* `X`
is still at Card layer and a release attaches (TC-1) — the excursion was
momentary.

**Automation test:** —

## TC-18 — Descendants placement — an over-cap tab state is reachable, marked, and a no-op on drop; a cycle is unreachable

**Priority:** P0 · **Automated:** ⏳ pending triage

*(Story 6.)* *Given* `X` with subtree height `h` at `P`'s Descendants
layer, where `P` sits at absolute depth `d_P` in the workflow and the gap
below Top `T` offers tab states whose resulting absolute depths are
`d_P + 1 + (relative depth)` for each state, *when* the user tabs to a
state where `resulting depth + h > CAP` (typically the deepest, child-of-
`T`, state — [ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)),
*then* the state is still reachable and the ghost renders there with the
invalid cue (look TBD, Story 8), and a release in that state **commits
nothing** — no request; `X` is set back down where it was picked up
(or, for an `X` brought in from outside, remains where the drag's
current placement had it, unwritten). *And when* the user tabs to a
shallower state that fits, *then* that state commits normally (TC-9,
TC-10). Validity is per *state*, not per gap — the cap is checked
against `X`'s deepest descendant, not `X` alone.

*And given* `X` has descendants, *then* no tab state in any gap makes `X`
a descendant of itself: `X`'s subtree travels with it and is excluded
from the Top/Bottom candidates (TC-8), so a cycle is structurally
unreachable — no cue is needed, the state simply does not exist.
Classification was computed at drag start and does not change inside the
hierarchy ([DRAG-2.4](drag-2-target-classification.md)).

*(The reachable-but-marked invalid state is an explicit exception to
§3.2's "never enterable," ruled 2026-09-17 for discrete tab states.)*

**Automation test:** —

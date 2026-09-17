# DRAG-1 — Contexts, the layer stack, and popping

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §1, §1.1, §2, §3 (the Descendants layer hardened 2026-09-17; Stories 5/6, not built)

**Suite ID:** `DRAG-1`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-1.n`.

**What's in scope here.** Per the wiki's own note, only drop *resolution*
is catalogued — given a release after this cursor behavior, what change is
committed. The tilt, the axis-lock feel, the pop-snap tween, the locked-
layer outline, the ghost/highlight rendering, and whether a pop *reads*
right are manual-verification by design and have no cases.

**The layer stack (§1.1, re-plan 2026-09-16; Descendants from the design
doc).** A drag is always in exactly one layer:

| Layer | Reached from | Zoom-in target | Within-action (what a release commits) |
|---|---|---|---|
| **Board** | the top; or a column/sub-row popping out | a column/sub-row | the hovered region's band ([DRAG-3](drag-3-card-column-bands.md)); nowhere → nothing |
| **Column/sub-row** | Board; or a Card popping out | one of *its own* Cards | reposition — anchor + side |
| **Card** | its own column/sub-row only | its descendants section (Story 6) | the **auto-drop**: last child for an item from outside; set back down for its own Stub ([DRAG-4](drag-4-attach-and-stub-placement.md), [DRAG-5.12](drag-5-detach-and-overflow.md)) |
| **Descendants** (Story 6) | its Card only | *(none)* | hierarchy placement by gap + depth range ([DRAG-4.8–4.11](drag-4-attach-and-stub-placement.md)) |

Three rules govern every transition: **(1)** a release always commits the
*locked* layer's within-action, wherever the bare cursor is; **(2)** a pop
moves exactly one layer — in to the next layer down, out to the current
layer's own parent; **(3)** zooming in is duration-only, zooming out is
duration *or* distance.

**Parameterization.** Every clock is a tunable panel value; none is
settled. Cases are written against the names, never the provisional
literals:

- `POP_OUT` — the pop-out clock, shared by every layer's zoom-out. Starts
  the moment the cursor leaves the locked context, resets when it comes
  back; fires once `POP_OUT` has elapsed **or**, when `POP_OUT_DISTANCE`
  is non-zero, once the cursor is at least that far outside the context's
  rect (either satisfies; distance ships disabled at `0`).
- `POP_IN` — Board → Column/sub-row. Starts when a popped-out card's cursor
  enters a region (or at the pop-out itself, if already in one); fires only
  if the cursor is in the region's middle band when it runs out.
- `CARD_POP_IN` — Column/sub-row → one of its own Cards. Duration-only;
  starts when the cursor rests on the Card, fires once elapsed. Kept apart
  from `POP_IN` because this edge can mean a reparent.
- `DESC_POP_IN` — Card → Descendants (Story 6). Duration-only; starts when
  the cursor rests on the Card's descendants section. *(Name assumed; the
  design doc says only that thresholds "will likely be different for
  different context pops.")*

"Sustained" means the cursor rests continuously for at least the clock
named; "momentary" means it leaves before.

**Region vocabulary.** A *region* is the bounded box of a context (§1): a
merged column's list box, an expanded column's individual sub-row, or a
Card (reachable only from its own column/sub-row). Everything else — a
column's header and footer, the board toolbar, the gap between columns,
the gaps between sub-rows and the space below the last one, Unsorted, a
broken column — is **nowhere**. Nowhere matters only at Board layer
(TC-9); once anything is locked, rule 1 governs (TC-16).

**Automation split (§3.1 ruling, 2026-09-15).** Automated tests assert
*reachability* — that it is possible to pop out, pop in, zoom into a Card,
place in a column — and the correctness of the resulting write. A case
whose pass depends on a threshold value ("move here, wait this long,
expect that") stays in the manual plan until the values lock, and may stay
manual even then. Such cases carry an **Automation note** below their
Given/When/Then; the Automated column is still the Test Reconciler's to
set.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A drag starts in exactly one layer, determined by the item and its column's display mode — never inside a Card | P0 | ⏳ pending triage |
| TC-2 | In-context release at Column layer is a reposition: anchor+side, workphase and parent unchanged | P0 | ⏳ pending triage |
| TC-3 | A sustained cursor signal outside the locked context pops out one layer; a momentary one does not | P0 | ⏳ pending triage |
| TC-4 | Brushing past a Card while reordering never attaches | P0 | ⏳ pending triage |
| TC-5 | After a pop in, a release commits the new layer's within-action | P0 | ⏳ pending triage |
| TC-6 | Expanded mode: a sibling sub-row is a different context, reachable only through Board | P0 | ⏳ pending triage |
| TC-7 | A cycle-forming target is never poppable | P0 | ⏳ pending triage |
| TC-8 | A depth-capped target is never poppable | P0 | ⏳ pending triage |
| TC-9 | Board layer: nowhere is no region — releasing there writes nothing | P0 | ⏳ pending triage |
| TC-10 | A region is clipped to what is visible | P1 | ⏳ pending triage |
| TC-11 | The Board → Column pop-in clock counts time in the region and fires from the middle band | P1 | ⏳ pending triage |
| TC-12 | A popped-out card can pop back into the column it just left | P1 | ⏳ pending triage |
| TC-13 | A drag picked up from Unsorted starts at Board layer, with no context | P1 | ⏳ pending triage |
| TC-14 | Pop-out by distance: when enabled, either clock or distance satisfies, at every layer | P2 | ⏳ pending triage |
| TC-15 | ~~A Card's region is hit-tested before the column that contains it~~ | — | ⏸ superseded |
| TC-16 | Rule 1: a release always commits the locked layer's within-action, wherever the bare cursor rests | P0 | ⏳ pending triage |
| TC-17 | Rule 2: a pop moves exactly one layer — Board never reaches a Card directly; a Card pops out to its column | P0 | ⏳ pending triage |
| TC-18 | Rule 3: zooming in is duration-only — distance never satisfies a zoom-in | P1 | ⏳ pending triage |
| TC-19 | A distant yank out of a Card cascades through two pops, one layer at a time | P1 | ⏳ pending triage |
| TC-20 | Only the locked column/sub-row's own Cards are zoom-in targets | P0 | ⏳ pending triage |
| TC-21 | Card → Descendants: holding over the descendants section zooms in; popping out returns to the Card | P1 | ⏳ pending triage |

---

## TC-1 — A drag starts in exactly one layer, determined by the item and its column's display mode — never inside a Card

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* each of the following, *when* a drag begins, *then* the drag's
starting layer and context are:

- a Free item (Card) in a **merged** column → Column layer; the context
  is the column's **list box** (its body — not the header or footer);
- a Free item (Card) in an **expanded** column → Column layer; the
  context is the individual sub-row the item is rendered in, not the
  column;
- an item picked up from **Unsorted** → Board layer, no context (TC-13);
- an Attached item (Stub) → the **Descendants** layer of its parent Card
  (Story 5), so that its within-action is placement among the hierarchy
  it already belongs to — a sibling reorder needs no pop. *(Product Owner
  ruling, 2026-09-17; the wiki's §1 "a Stub's context is its parent Card"
  predates the layer model and is to be corrected.)*

A Free Card's drag **never starts inside a Card**; a Card is reachable only
by zooming in from the column/sub-row that contains it (TC-17). The
starting layer is determined entirely by what the item already is and how
its column is displayed; no input from the user selects it.

**Automation test:** —

## TC-2 — In-context release at Column layer is a reposition: anchor+side, workphase and parent unchanged

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card in a merged column rendering `A, B, C` with the Card
being `C`, *when* the user drags `C` and releases with the cursor still
within the column's list box, hovering the lower half of `A`, *then* the
committed change is a reposition: `{anchorId: A, side: after}`,
`workphaseId` unchanged, `parentId` and attachment unchanged. This is the
Column layer's within-action, and by rule 1 it is what *every* release
while locked here commits (TC-16).

The default assumption is reposition until the user demonstrates
otherwise.

**Automation test:** —

## TC-3 — A sustained cursor signal outside the locked context pops out one layer; a momentary one does not

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card locked in its column context, *when* the cursor leaves the
context — into another column, a sibling sub-row, or nowhere — and stays
out continuously for ≥ `POP_OUT`, *then* the item pops **out** to Board:
it belongs to no context and follows the cursor freely. It does not yet
belong to whatever region the cursor is in; entering one is a separate
act (TC-5, TC-11).

*And given* the same setup, *when* the cursor leaves the context but
returns before `POP_OUT` elapses, *then* no pop occurs, the pop-out clock
resets, and the drag is still locked in its original context — a release
then is an in-context reposition (TC-2).

Leaving and entering are separate, deliberate acts, and the popped-out
state between them is a real place to be. The same clock governs a pop
out of a Card to its column (TC-17) and, in Story 6, out of Descendants.

Assert *that* a sustained signal pops and a momentary one doesn't,
parameterized on `POP_OUT` — never on the provisional literal.

**Automation note:** the "pops out" half is reachability and automatable;
the "momentary does not" half is threshold-timed and stays manual until
the values lock.

**Automation test:** —

## TC-4 — Brushing past a Card while reordering never attaches

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` being reordered within its column past neighboring
Cards `A` and `B`, *when* the cursor's path crosses `A`'s and `B`'s boxes
(each for less than `CARD_POP_IN`) and the user releases between `A` and
`B`, *then* the committed change is a reposition — `X` anchored against
`A` or `B` — and `X.parentId` is unchanged. Popping is never incidental;
hovering between two cards is a reposition no matter how precise the aim,
and hovering *on* a card is too until the hold completes
([DRAG-4.5](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## TC-5 — After a pop in, a release commits the new layer's within-action

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card that has zoomed in one layer, *when* it is released, *then*
the commit is the new layer's within-action and nothing else:

- **Board → Column/sub-row** (region's middle band ≥ `POP_IN`,
  [DRAG-3.4](drag-3-card-column-bands.md)): a release hovering a specific
  card there commits anchor+side against that card — not the band the
  cursor happens to be in. The item is now bounded by the new context
  exactly as it was by the origin.
- **Column/sub-row → Card** (rest on one of the column's own Cards ≥
  `CARD_POP_IN`): a release commits the auto-drop — an attach as the
  **last child** ([DRAG-4.1](drag-4-attach-and-stub-placement.md)) —
  regardless of where inside the Card the cursor is
  ([DRAG-4.14](drag-4-attach-and-stub-placement.md)).
- **Card → Descendants** (Story 6, TC-21): a release commits the
  hierarchy placement at the ghost's gap and tab depth
  ([DRAG-4.8–4.11](drag-4-attach-and-stub-placement.md)).

Staying long enough says "I want *into* this context"; the bands are quick
auto-placements available only at Board layer.

**Automation test:** —

## TC-6 — Expanded mode: a sibling sub-row is a different context, reachable only through Board

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an expanded column with sub-rows for `W1` and `W2` and a Card
`X` locked in the `W1` sub-row (ghost at some slot there), *when* the
cursor moves into the `W2` sub-row and releases before `POP_OUT` elapses,
*then* the commit is `W1`'s in-context reposition at the ghost's current
slot — `X.workphaseId` stays `W1`. The bare cursor being over `W2`
changes nothing (rule 1, TC-16); `W2`'s band is not what a release means
while `W1` is locked.

*And when* the cursor rests in the `W2` sub-row for ≥ `POP_OUT`, *then*
`X` pops out to Board — from which `W2`'s band meaning is available on
release ([DRAG-3.8](drag-3-card-column-bands.md)), and staying ≥ `POP_IN`
in `W2`'s middle band pops into the `W2` sub-row for anchor+side
placement there (TC-5). Either way the result is a genuine workphase
change to exactly `W2`, reached by popping — never an in-context
reposition that happened to cross a line.

Sibling sub-rows of one column are separate contexts; moving between them
is two pops, out and in. The gap between the two sub-rows is nowhere
(TC-9).

**Automation test:** —

## TC-7 — A cycle-forming target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with descendant `D` (attached or detached) also visible
on the board, *when* `X` is dragged, locked into the column containing
`D`, and the cursor rests on `D` — or on `X`'s own in-place row — for
well past `CARD_POP_IN`, *then* no zoom into `D` occurs, no attach is
offered, and a release there commits the column's own reposition, never
anything that reparents `X`. Validity is decided before the affordance is
offered, using the same rule the API enforces
([ATT-4.2/4.3](../item-attachment/att-4-legal-parent-depth-cap.md)).
The user never watches the item settle and bounce back.

**Automation test:** —

## TC-8 — A depth-capped target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with subtree height `h` and a target Card `T` at depth
`D` with `D + 1 + h > CAP` (parameterized on `CAP`, see
[ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)), *when*
`X` is locked into `T`'s column and the cursor rests on `T` for well past
`CARD_POP_IN`, *then* no zoom into `T` occurs and no attach is offered; a
release commits the column's own reposition. `T` remains a legitimate
target for *other* drags whose subtree fits.

**Automation test:** —

## TC-9 — Board layer: nowhere is no region — releasing there writes nothing

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card at Board layer (popped out, or picked up from Unsorted),
*when* the cursor is over any of the following, *then* it is in no region:

- a column's own header or footer (the stripe above or below the list
  box — the box alone counts);
- the board toolbar;
- the gap between two columns;
- in an expanded column, the gap between two sub-rows, or the space below
  the last sub-row;
- the Unsorted bucket;
- a broken column.

*When* the user releases there, *then* **nothing is written**: no request
is made, the item's `workphaseId`, `position`, `parentId` and attachment
are all unchanged, and it is rendered back where it started. *And when* a
card locked in a column rests with its cursor over any of these for ≥
`POP_OUT`, *then* it pops out to Board (TC-3) — but a release *before*
that pop commits the locked column's reposition, not nothing (TC-16).

**Automation test:** —

## TC-10 — A region is clipped to what is visible

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an expanded column whose sub-rows overflow its viewport, with
sub-row `W3` scrolled out of view, *when* a Board-layer Card's cursor is
where `W3`'s box *would* be, *then* the cursor is nowhere (TC-9): the
pop-in clock does not start, and a release writes nothing. *When* the
column scrolls so that `W3` comes into view under the cursor, *then* `W3`
is a region from that moment — the pop-in clock starts, and a release
resolves by `W3`'s band. You can only be in what you can see. (Whether a
*divider* inside a visible region is reachable is a separate rule —
[DRAG-3.16](drag-3-card-column-bands.md).)

**Automation test:** —

## TC-11 — The Board → Column pop-in clock counts time in the region and fires from the middle band

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Board-layer Card whose cursor enters column region `R`'s top
band ([DRAG-3](drag-3-card-column-bands.md)):

- *When* the cursor stays in `R` for ≥ `POP_IN` without leaving the top
  band and the user releases, *then* no pop in has occurred and the
  release commits the top band's meaning ([DRAG-3.1](drag-3-card-column-bands.md))
  — the clock fires from the middle band only.
- *When* the cursor stays in `R`'s top band for ≥ `POP_IN` and then slides
  into the middle band, *then* the card pops in **at once** — time in the
  top or bottom band counted toward the clock — and is thereafter
  positioned in-context (TC-5).
- *When* the cursor leaves `R` before `POP_IN` and enters `R` again,
  *then* the clock starts over from the re-entry.

*And given* a card that pops out while the cursor is already inside a
region (it left its context straight into a neighbor), *then* the pop-in
clock starts at the pop-out itself — the popped-out state always lasts at
least `POP_IN`, and the two clocks run back to back when the cursor simply
rests.

**Automation note:** threshold-timed — stays manual until the values lock
(§3.1 ruling, 2026-09-15). The automatable core is that it is *possible*
to pop in and that the resulting write is in-context (TC-5).

**Automation test:** —

## TC-12 — A popped-out card can pop back into the column it just left

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `X` in merged column `C` rendering `A, B, X`, *when* the
cursor leaves `C`'s list box for ≥ `POP_OUT` (pop out to Board), returns
into `C`'s middle band, and stays ≥ `POP_IN` (pop in — any column,
including the one it just left), and the user then releases hovering the
upper half of `A`, *then* the commit is a reposition `{anchorId: A, side:
before}` with `workphaseId`, `parentId` and attachment unchanged — the
same result an uninterrupted in-context reorder would give.

*And when* instead the user releases in `C`'s middle band at Board layer
(after popping out, before popping in), *then* nothing is written — `X`
is already a member of `C`'s covered set and is simply being set back
down ([DRAG-3.12](drag-3-card-column-bands.md)).

**Automation test:** —

## TC-13 — A drag picked up from Unsorted starts at Board layer, with no context

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an item in the Unsorted bucket (drag-source only), *when* it is
picked up, *then* the drag begins at Board layer: no context, no bounding,
the card follows the cursor freely from the first movement, and no
pop-out clock is involved. From there:

- a release over Unsorted, or anywhere else that is nowhere (TC-9), writes
  nothing;
- a release in a column region's band commits that band's meaning
  ([DRAG-3.1–3.3](drag-3-card-column-bands.md)), including the workphase
  change into that column;
- resting in a region ≥ `POP_IN` in its middle band pops the item in
  (TC-11), after which placement is in-context (TC-5), and from there a
  Card can be zoomed into (TC-17) — never straight from Board.

**Automation test:** —

## TC-14 — Pop-out by distance: when enabled, either clock or distance satisfies, at every layer

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* `POP_OUT_DISTANCE` set to a non-zero value, *when* the cursor
moves at least that far outside the locked context's rect before
`POP_OUT` has elapsed, *then* the item pops out one layer immediately —
either signal satisfies. This holds for a column/sub-row (out to Board)
and for a Card (out to its column, TC-17) alike: one shared pop-out rule.
*And given* `POP_OUT_DISTANCE` set to `0` (its shipped value), *when* the
cursor moves any distance outside the context in less than `POP_OUT`,
*then* no pop occurs — distance is disabled and only the clock decides.

**Automation note:** threshold-timed — stays manual until the values lock
(§3.1 ruling, 2026-09-15).

**Automation test:** —

## TC-15 — ~~A Card's region is hit-tested before the column that contains it~~

**Priority:** — · **Automated:** ⏸ superseded

**Was:** at any layer, the cursor inside a Card's box was in the Card's
region rather than the containing column's, so the pop-in clock ran toward
the Card and a release resolved by the Card's bands (2026-09-15 draft of
§1). **Superseded by** §1.1 (2026-09-16): a Card is never a Board-layer
region at all — Board-layer band resolution never considers Card geometry,
so a column's own top/bottom bands are always reachable regardless of what
Card is drawn there. A Card becomes a region only for the drag locked into
the column/sub-row that contains it. See TC-17 and TC-20.

**Automation test:** —

## TC-16 — Rule 1: a release always commits the locked layer's within-action, wherever the bare cursor rests

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` locked in column `C1` (ghost at slot `{anchorId: A,
side: after}`), *when* the cursor is moved — for less than `POP_OUT` —
over any of: a different column `C2`'s list box (in its top, middle, or
bottom band), a sibling sub-row, a Card in `C2`, `C1`'s own header, the
gap between columns, Unsorted; and the user releases, *then* the commit
is `C1`'s reposition at the ghost's slot — `{anchorId: A, side: after}`,
`workphaseId` and `parentId` unchanged. `C2`'s bands, `C2`'s Cards, and
"nowhere writes nothing" all play no part: none of them is the locked
layer.

*And given* `X` zoomed into Card `P` (locked at Card layer), *when* the
cursor leaves `P`'s box — into the column around it, or off the board —
and the user releases before `POP_OUT` elapses, *then* the commit is
still `P`'s within-action: attach `X` as `P`'s last child
([DRAG-4.1](drag-4-attach-and-stub-placement.md)).

The card is bounded by its context and never visually leaves it, so
nothing shown ever promises a foreign region's meaning. Reaching any
other meaning requires an actual pop first (TC-3), never a glance.

**Automation test:** —

## TC-17 — Rule 2: a pop moves exactly one layer — Board never reaches a Card directly; a Card pops out to its column

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` at Board layer and a Valid target Card `P` in column
`C`, *when* the cursor rests on `P` for any duration, *then* what happens
is `C`'s own pop-in (≥ `POP_IN`, middle band — TC-11), landing at Column
layer with `X` bounded by `C`; only *then* does the `CARD_POP_IN` clock
start against `P`. There is no Board → Card hop, and a release at Board
layer with the cursor on `P` commits `C`'s band meaning
([DRAG-3](drag-3-card-column-bands.md)), never an attach.

*And given* `X` zoomed into `P` (Card layer), *when* the cursor stays
outside `P`'s box for ≥ `POP_OUT`, *then* `X` pops out to **`C`** —
locked at Column layer, bounded by `C`'s list box, ghost back among `C`'s
cards — **not** to Board. A release now is `C`'s reposition; the attach
is not committed ([DRAG-4.17](drag-4-attach-and-stub-placement.md)).
Reaching Board from here takes a second `POP_OUT` (TC-19).

*And given* `X` zoomed into `P`, and `P`'s sibling Card `Q` in the same
column, *when* the cursor moves onto `Q`, *then* nothing zooms into `Q`
until `X` has first popped out to `C` (≥ `POP_OUT` outside `P`) and then
rested on `Q` ≥ `CARD_POP_IN` — there is no direct sibling-to-sibling hop.

**Automation test:** —

## TC-18 — Rule 3: zooming in is duration-only — distance never satisfies a zoom-in

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `POP_OUT_DISTANCE` set to a non-zero value, and a Card `X` locked
in column `C` with the cursor moved decisively deep into the box of `C`'s
Card `P` (well past `POP_OUT_DISTANCE` from `P`'s edge) but for less than
`CARD_POP_IN`, *when* the user releases, *then* the commit is `C`'s
reposition — no zoom into `P` occurred. Only the elapsed `CARD_POP_IN`
clock zooms in; how far or how fast the cursor moved is irrelevant.
Likewise `DESC_POP_IN` for Card → Descendants (Story 6). The asymmetry is
deliberate: zooming in can mean a reparent, so it earns an unambiguous
hold; zooming out never changes what anything is.

**Automation note:** threshold-timed — stays manual until the values lock.

**Automation test:** —

## TC-19 — A distant yank out of a Card cascades through two pops, one layer at a time

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `POP_OUT_DISTANCE` non-zero and a Card `X` zoomed into `P` in
column `C`, *when* the cursor is yanked far enough that it is at once ≥
`POP_OUT_DISTANCE` outside `P`'s box *and* ≥ `POP_OUT_DISTANCE` outside
`C`'s list box, *then* `X` pops out to `C` (first pop), and `C`'s own
pop-out threshold, evaluated fresh against the same still-distant cursor,
fires at once (second pop) — leaving `X` at Board layer. Both pops happen,
in that order, as a consequence of rule 2 alone; there is no two-layer
skip. *And when* instead the cursor comes to rest inside `C` but outside
`P`, *then* only the first pop occurs and `X` stays locked in `C`. The
same cascade carries a Stub from Descendants through Card to the column
([DRAG-5.11](drag-5-detach-and-overflow.md)) — the distance term is what
makes a quick double zoom-out feel like one gesture without a special
rule.

**Automation note:** threshold-timed — stays manual until the values lock.

**Automation test:** —

## TC-20 — Only the locked column/sub-row's own Cards are zoom-in targets

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` locked in column `C1`, and a Valid target Card `Q` in a
different column `C2`, *when* the cursor rests on `Q` for well past
`CARD_POP_IN` (but less than `POP_OUT` — or, with the pop-out clock
running, before it fires), *then* nothing zooms into `Q`; a release
commits `C1`'s reposition (rule 1). Attaching to `Q` requires popping out
to Board, into `C2`, then into `Q`
([DRAG-4.15](drag-4-attach-and-stub-placement.md)).

*And given* an expanded column with `X` locked in the `W2` sub-row and a
Card `Q` rendered in the `W3` sub-row of the same column, *then* the same
holds — `Q` belongs to a different context and is not a zoom-in target
from `W2`.

**Automation test:** —

## TC-21 — Card → Descendants: holding over the descendants section zooms in; popping out returns to the Card

**Priority:** P1 · **Automated:** ⏳ pending triage

*(Story 6 — from the design doc's layer table; to be hardened into the
wiki.)*

*Given* a Card `X` zoomed into Card `P` (Card layer), where `P` has
attached children rendered as its descendants section, *when* the cursor
rests on that descendants section for ≥ `DESC_POP_IN`, *then* `X` zooms
into `P`'s **Descendants** layer: it is now represented as a Stub-ghost
positioned among `P`'s hierarchy, bounded to the descendants section, and
a release commits the hierarchy placement at the ghost's gap and tab
depth ([DRAG-4.8–4.11](drag-4-attach-and-stub-placement.md)) rather than
the auto-drop. *And when* the cursor rests on `P` but outside its
descendants section for any duration, *then* no zoom-in occurs and a
release still commits the auto-drop ([DRAG-4.1](drag-4-attach-and-stub-placement.md)).

*And given* `X` at Descendants layer, *when* the cursor stays outside the
descendants section for ≥ `POP_OUT` (or `POP_OUT_DISTANCE`), *then* `X`
pops out exactly one layer, to `P`'s Card layer — a release then is the
auto-drop: last child for an `X` that came from outside `P`, set back
down for a Stub of `P`'s own ([DRAG-5.12](drag-5-detach-and-overflow.md)).
There is no two-layer skip; a decisive pull away from the
whole Card reaches the column by cascading through the Card layer's own
pop-out (TC-19, [DRAG-5.11](drag-5-detach-and-overflow.md)). *(Product
Owner ruling, 2026-09-17.)*

A `P` with no attached children has no descendants section, so its
Descendants layer is unreachable and the auto-drop is the only outcome
([DRAG-4.12](drag-4-attach-and-stub-placement.md)) — with nothing to
reposition or reparent among, there is nothing manual placement could
offer. *(Product Owner ruling, 2026-09-17.)*

**Automation test:** —

# Board Drag Interaction — Contexts, Popping & Drop Resolution

**Test suite:** [`../../test-plans/board-drag-interaction/`](../../test-plans/board-drag-interaction/)

**Related:** [`../item-attachment/`](../item-attachment/) (what the gesture
is allowed to produce) · [`../item-positioning/`](../item-positioning/)
(what an item's position compares against) ·
[`../positioning/`](../positioning/) (how the resulting position
resolves) ·
[`../hierarchy-placement/`](../hierarchy-placement/) (the gap-and-depth
rule the Descendants layer places by)

This page answers "what happens as the user drags, and what does a release
at a given place mean." The *consequences* of any resolved drop —
attachment, reparenting, cascades, validity — live in
[`../item-attachment/`](../item-attachment/) and hold identically for
non-drag paths. The page covers dragging an item, Card or Stub. Dragging
a column reorders the board's columns
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §7), and none
of this page's layers, pops or bands apply to it.

**Resolution and feel.** These rules come in two kinds. Drop
**resolution**: given a release at this place, what change is committed.
Interaction **feel**: does the pop happen when it should, does the ghost
read as "this will nest" rather than "this will replace". Both are rules
here; which of them can be pinned to precise assertions is the test
plans' call.

---

## 1. A drag always begins inside a context

**A context is the region a dragged item currently belongs to** — the
region within which a drag means "reposition," and outside which it means
something else. There are two kinds:

- **A column region** — the context for Free items (Cards). *Which* region
  depends on the column's display mode:
  - **Merged** (all covered workphases in one swimlane) — the context is
    **the column's list box** (its body; not the header or footer).
  - **Expanded** (each covered workphase rendered as its own sub-row) — the
    context is **the individual sub-row**, not the column containing them.
    Sibling sub-rows are separate contexts, and moving between two sub-rows
    of the same column is a context change like any other.
- **A Card** — the context a *Free* Card zooms into from the column/
  sub-row that contains it (§1.1). Its within-action is the auto-drop
  (§6).
- **A Card's Descendants** — the context for its Stubs (its attached
  descendants, **at every depth** — one Descendants layer per Card, never
  one per Stub; §7.1's root), one layer inside the Card (§1.1). Its
  within-action is manual hierarchy placement (§7). Why not the Card
  itself: the Card layer's within-action is the auto-drop, so a Stub
  whose context was the Card could never be reordered by hand.

**A region is a bounded box.** Only the box counts — not the column's
horizontal stripe above or below it. A column's header and footer, the
board toolbar, the gap between columns, the gaps between sub-rows and the
space below the last one are **nowhere**: no region, no context. A region
is also clipped to what is visible — a sub-row scrolled out of its column's
view is not a region until it scrolls back in; you can only be in what you
can see. Resting nowhere pops the card out (§3); releasing nowhere writes
nothing (§5). A Card's region (§6) is the same kind of box.

Every drag starts inside exactly one, determined by what the item already
is and how its column is currently displayed — except a drag picked up
from Unsorted, which starts popped out with no context (§3). Nothing about
the drag's start is a user choice. **A Free Card's drag never starts
inside a Card** — only a column/sub-row, or (from Unsorted) nowhere; a
Card is reachable only by zooming in (§1.1, §3). **A Stub's drag starts
at its *containing Card's* Descendants layer** — the nearest Free
ancestor's section, whatever the Stub's depth beneath it: a grandchild's
drag starts in the same section as its parent's, and popping out of it
lands on that Card, never on the parent Stub (§1.1, §8). Reordering it
among its siblings costs no pop at all.

**Why the sub-row and not the column, in expanded mode:** an expanded
column exists precisely to make each workphase individually targetable. If
the whole column were the context, moving between its sub-rows would be a
free in-context reposition — and the workphase distinction the display mode
was configured to expose would carry no weight during a drag, which is the
one moment it most needs to.

### 1.1 The board is a strict stack of layers

**There are exactly four layers, and a drag is always in exactly one:**

| Layer | Reached from | Zoom-in target | Within-action |
|---|---|---|---|
| **Board** | (the top) | a column/sub-row | §5's band, on release |
| **Column/sub-row** | Board, or a Card popping out | one of its own Cards | reposition — the ghost's slot, named by anchor + side (§2) |
| **Card** | its own column/sub-row; or its Descendants popping out | its own descendants section (§7) | the auto-drop (§6): last child for an item from outside; set back down for its own Stub |
| **Descendants** | its own Card, only; or where a Stub's drag starts (at any depth beneath that Card) | *(none)* | manual hierarchy placement — gap + depth (§7) |

A Card with no attached children has no descendants
section, so its Descendants layer is unreachable and the auto-drop is its
only outcome — with nothing to reposition or reparent among, manual
placement has nothing to offer.

**Three rules govern every transition:**

1. **A release always commits the locked layer's own within-action** —
   never a foreign region's, no matter where the bare cursor is resting.
   Why: a Card is a region too. If a bare hover could commit whatever
   region it rests on, every column's bands and every Card's attach would
   be live at once, all the time, and a release could mean too many
   things. Locking one layer keeps exactly one meaning live (§2).
2. **Popping is always exactly one layer.** Zooming in reaches only the
   *next* layer down — Board into a column/sub-row, a column/sub-row into
   one of *its own* Cards, a Card into its own descendants section — never
   a foreign column's Card and never two layers in one hop. Popping out
   always lands on the current layer's own *parent* — Descendants' is its
   Card, a Card's is the column/sub-row that contains it, **never Board
   directly**. Moving from one Card to a different one — even a sibling
   in the same column — always passes back through the column layer
   first; there is no direct sibling-to-sibling hop. There is likewise no
   "two layers at once" pop out of Descendants: a
   decisive pull away from the whole Card is expected to satisfy
   Descendants' and then the Card's pop-out in quick succession through
   rule 3's distance term, and the intermediate stop at Card layer is a
   real state, however brief (§8).
3. **Zooming in is a duration-only signal; zooming out is duration *or*
   distance**, at every edge of the stack (§3.1). The asymmetry is
   deliberate: zooming in can mean a
   reparent, so it earns a sustained, unambiguous hold; zooming out never
   changes what anything *is*, so a fast, decisive yank is allowed to
   satisfy it. A "yank a Card's own attach-preview out, and the cursor is
   already well past the column too" gesture cascades through **two**
   pops in quick succession as a consequence of rule 2 alone — no special
   two-layer-skip case is needed: the first pop lands on the containing
   column, and that column's own zoom-out threshold is then evaluated
   fresh against the same, still-distant cursor position.

**Because of rule 1, the band guides (§5) only draw anything at Board
layer.** A locked column/sub-row shows no dashed lines
on any *other* column, and a locked Card shows nothing at all — there is
nothing to cue, since nothing about a bare hover elsewhere would change
what a release does.

**The locked layer itself always gets an outline, at every layer** —
whichever region or Card is currently locked — so which layer you're in
is legible on the board itself, not only from the tuning panel's text
readout. Its color is a tuning-panel value, `activeContextOutlineColor`
(§3.1).

**A drag leaves every Card's list of Stubs as the user set it**,
collapsed or expanded, through every layer change and after the release.
The exceptions:

- **The carried Card's own Stubs aren't shown while it's dragged** (§5a).
  After the release, its list is back as the user set it.
- **A Card the drag zooms into opens** (§6.1). If the drag leaves it
  again, it goes back to how the user set it. If the item is attached into
  it, it stays open, so the item's new place is in view.

## 2. Default assumption: reposition in place

**A drag is assumed to be a reposition within its current context until the
user demonstrates otherwise.** This is the central bias of the whole
interaction: the common case (reordering) requires no precision, and the
rarer, more consequential cases (changing workphase, changing parent) are
what require the user to do something deliberate.

While the item is in-context:

- It receives a **tilt** on pickup, indicating it's held.
- It is **bounded by its context.** The card follows the cursor only within
  the context's own extent; movement that would carry it outside is not
  followed until a pop.
  - In a **merged** column this reduces to a horizontal axis lock — the
    only way the card *itself* is ever visibly held back is sideways; it
    moves freely up and down within the column. *(This is about how far
    the carried card itself follows the cursor, a separate question from
    the paragraph below.)*
  - In an **expanded** column the sub-row bounds the card **vertically as
    well**. Drifting toward the sub-row above or below is held exactly the
    way drifting toward the next column is, and crossing it is a pop.

  **Whether the *context itself still holds* is a separate question from
  the clamp above, and for a merged column the two are measured against
  different boxes.** §1's region — what §5's bands are measured against —
  is the column's content-sized list box, sized to its own cards; a short
  merged column's own empty space below its last card is outside that
  box, i.e. nowhere. Measured against that box, leaving the cards for the
  empty space would count as leaving the context and start the pop-out
  clock (§3) — visibly wrong, since the cursor is still plainly inside the
  column. So the context is judged to still hold there: a merged column
  is bounded, for *this* purpose only, by its own outer body (the
  column's full available-height box) — taller than, and never resized to
  match, the content-sized box §5's bands carve out of. Sub-rows have no such gap (a sub-row's
  box already is its full bound) and are unaffected either way.
- A **ghost** shows the slot it would land in, and a **side highlight** on
  a neighboring item shows which item it is anchoring to and on which side.
  In a column or sub-row, **a release lands the item exactly where the
  ghost is**:
  1. **The ghost's slot follows the list's standard shuffle** — the
     neighboring cards slide aside to open a gap wherever the carried card
     is, the ordinary sortable-list behavior.
  2. **The dragged card's own slot counts too.** Resting over the place it
     was picked up from opens no gap anywhere else; nothing shuffles.
  3. **The slot is saved by naming one of its two neighbors** — "after"
     the card above the ghost, or "before" the card below it. Which one
     depends on where the carried card sits relative to the ghost's
     middle: above it names the card above; below it names the card
     below. The side highlight sits on the named neighbor, so the
     highlight and the release always name the same card.
  4. **At either end of the list there is only one neighbor**, so it is
     always the one named. A ghost alone in its list names nothing, and
     the release takes the column's no-anchor slot (§5's middle-band
     meaning; an item with no comparable position to keep lands last,
     §10).
  5. **Setting a card back down in its own slot is not a no-op** when it
     has a neighbor. On screen, "after the card above" and "before the
     card below" are the same slot; in the workflow-wide order they can
     differ, because items this view doesn't show can sit between the two
     neighbors ([`../positioning/`](../positioning/) §5). So the
     release saves the named anchor, and the item may move relative to
     those unseen items. Only a card alone in its list, set back down, has
     nothing to name and writes nothing (§10).
  6. **A done column or sub-row has no slot to choose.** Its Free items
     carry no position and are ordered by completion (§5's done columns;
     [`../item-positioning/`](../item-positioning/) §7.4), so the ghost
     doesn't follow rule 1's shuffle. It stays where a release will land
     the item (§10): an item from another column, as the newest
     completion; a card already in the list, in its own slot. Released
     there, that card is being set back down, and nothing is written.
     A release here names no card, so rule 3's side highlight has no
     slot to show. Which Card it names here, and how it's drawn, isn't a
     rule yet (Open questions).

  **Why not the half of the hovered card:** the gap is drawn from list
  order, so choosing the side by which half of a card the carried card's
  center is in can land a drop one slot away from the ghost. **The same
  rule holds in a Card's descendants section (§7.1)**, where the rows of
  a dragged Stub's own subtree travel with it and are passed over, never
  named.

**A release always commits the in-context meaning above, no matter where
the bare cursor is resting** (§1.1 rule 1). The card never visually leaves
its context (it's bounded, per the bullet above), so nothing shown ever
promises a foreign region's meaning. Reaching any *other* meaning — a column's band (§5), a
different column/sub-row's in-context placement, a Card's attach (§6) —
always requires an actual pop first (§3), never just a glance.

## 3. Popping

**The cursor, not the card, decides whether the context holds.** Because
the card is axis-locked, the cursor can leave the context while the card
cannot follow. For a merged column, "the context" here is its outer body,
not the content-sized box §5's bands are measured against (§2).
Popping is two-way, and each way takes its own sustained signal (§3.1), and
each way moves exactly one layer of §1.1's stack:

- **Pop out.** When the cursor has stayed *outside* the card's context —
  anywhere: another column, the gap between columns, Unsorted — past the
  pop-out threshold, the item pops out to its **parent layer** (§1.1 rule
  2): a column/sub-row's parent is Board — the item **snaps to the cursor
  and follows it freely**, belonging to no context; a Card's parent is the
  column/sub-row that contains it — the item becomes bounded by *that*
  instead, still locked, just one layer shallower; Descendants' parent is
  its Card (§8). The snap is a short tween from where the card was
  clamped to the cursor (or to the new, wider context), chasing it if it
  moves meanwhile; its length is a tuning-panel value (`popSnapMs`; 0
  teleports).
- **Pop in.** From Board, a popped-out item enters a column/sub-row when
  the cursor has stayed in that context's *region* past the pop-in
  threshold and is in the middle band (§5) when the clock runs out — any
  column, **including the one it just left**. From inside a locked
  column/sub-row, the cursor resting on the card the side highlight names,
  past its own (duration-only, §1.1 rule 3) two-stage threshold (a dwell,
  then a cue — §6.1), zooms into it instead — never a foreign column's
  Card, and never reachable from Board directly. From inside a locked
  Card, the cursor resting on *that Card's*
  descendants section past its own duration-only threshold zooms into
  Descendants (§7). Either way, the clock counts time in the region/Card, not in a
  band: time spent in the top or bottom band of a column still counts
  toward its own pop-in, and sliding into the middle band after it pops in
  at once. The item is now positioned within the new context under its
  rules **and bounded by it**, exactly as it was bounded by the one before.

A release while genuinely popped out to Board still resolves by whatever
column/sub-row is under the cursor: its band (§5), or nothing at all
between columns — this is Board layer's *own* in-context meaning (§2),
just phrased as a band instead of an anchor because there's no specific
card to anchor against yet. Staying in a region long enough says "I want
*into* this column's context, to choose the position myself" (or, for one
of its own Cards, to go on and attach into it, §6). The bands are three
quick auto-placements — top, bottom, or just "move it here" — for when the
column change is what matters and the exact position isn't. Popping in is
only needed to reach a column's *in-context* placement (anchor + side).

The one drag that starts without a context is one picked up outside every
context (Unsorted is drag-source only): it begins popped out.

**Why two ways:** leaving and entering are separate, deliberate acts, and
the popped-out state between them is a real place to be — neither a
single pop that frees the card for the rest of the drag, nor a direct
transfer between contexts with no free state at all.

### 3.1 A pop requires a demonstration of deliberateness

**The rule is that popping is never incidental** — it takes a sustained
signal from the cursor, not a momentary crossing. This is what lets §2's
"assume reposition" bias hold: brushing past a neighboring context while
reordering must not reparent anything.

**The thresholds are tunable values, not fixed here.** Their provisional
value is about half a second of the cursor resting continuously inside
(or outside) a context. The model is settled — pop out, then pop in; a
placement in a different column costs both, back to back — and none of
the values are: all are tuned by feel, with no target settle time
committed. Each edge of §1.1's stack has its own clock:

- **Pop-out** (any layer, into its parent) — starts the moment the cursor
  leaves the context, wherever it goes, and resets when it comes back.
  Fires once `popDelayMs` has elapsed **or**, when `popDistancePx` is
  non-zero, once the cursor is at least that far outside the context's
  box; either satisfies. `popDistancePx` defaults to 0, which turns the
  distance term off. One clock serves every layer's pop-out, since
  zooming out never signals a reparent (§1.1 rule 3).
- **Pop-in, Board → Column/sub-row** — starts when a popped-out card's
  cursor enters a region (or at the pop-out itself, if the cursor is
  already in one), so the popped-out state always lasts at least
  `popInDelayMs`; fires from the middle band only.
- **Pop-in, Column/sub-row → Card** — duration-only, in two stages keyed
  on the relation the side highlight names (§6.1): a silent dwell
  (`cardZoomDwellMs`, about 500 ms), then a visible cue
  (`cardPopInDelayMs`, the cue's own length). The whole hold is their
  sum. It's kept apart from `popInDelayMs` because this is the edge that
  can mean a reparent, so it can be tuned to a more deliberate hold than
  an ordinary column pop-in.
- **Pop-in, Card → Descendants** — duration-only
  (`descendantsPopInDelayMs`, by default the same as
  `cardPopInDelayMs`), starting when the cursor rests on the locked
  Card's descendants section. There's no dwell and cue here: this edge
  names no neighbor to hold steady against.

The cursor's region is the bounded box of §1 — outside every box, over
Unsorted or a broken column, the cursor is nowhere and a release there
writes nothing (subject to §2's "always the locked context's own
within-action" once anything is locked at all).

**The tuning panel exposing every threshold is part of this feature, not
a debugging convenience.** The correct value can only be found by feel,
and feel can only be compared by changing one number between two
attempts without a rebuild. The panel also exposes the overlay colors of
§4. Its values persist in the browser across reloads: `popDelayMs`,
`popDistancePx`, `popInDelayMs`, `cardZoomDwellMs`, `cardPopInDelayMs`,
`descendantsPopInDelayMs`, `popSnapMs`, `overlayFreeDescendantColor`,
`overlayDepthCappedOpacity`, and `activeContextOutlineColor` (§1.1's
locked-layer outline). The panel is a tool for the humans doing the
tuning, and it's retired once the values lock and become constants.
Where it lives and who sees it is open (Open questions).

### 3.2 Invalid targets are never poppable

**A context the drop would be rejected from must not be enterable.** If the
API would refuse the resulting parent — cycle, over the depth cap — the
gesture must never let the user pop into it in the first place.

The user should never watch an item settle into a place and then bounce
back. Validity is decided before the affordance is offered, using the same
rules the API enforces (see [`../item-attachment/`](../item-attachment/)
§7–§8).

**One explicit exception: a tab state at Descendants layer (§7).** A tab state is a discrete depth the ghost snaps to inside a
context the item is already in, not a target it pops into. An over-cap tab
state is therefore *reachable* — the ghost renders there with a visible
invalid cue (its look isn't a rule yet; see Open questions) — and a
release in it **commits nothing**,
exactly as if the item had been set back down. The rule above still
holds for what it was written for: no *context* — a column, a Card — that
would reject the drop is ever enterable. A cycle needs no cue at all: the
dragged item's own subtree travels with it and is never a placement
candidate, so no tab state can make an item its own descendant.

## 4. Target classification at drag start

**When a drag begins, every visible target is classified against the item
being carried**, and that classification is shown. Three states:

| State | Meaning |
|---|---|
| **Valid** | A legal drop for this item. |
| **Cycle-forming** | The target is the dragged item, or one of its descendants. |
| **Depth-capped** | Legal parent-wise, but the resulting depth would exceed `CAP`. |

**Classification is computed once, at drag start.** The item being carried
doesn't change mid-gesture, so neither does what any target *is* to it.
This is a per-drag property, not a per-hover one.

**Cycle-forming wins.** A descendant of the carried item is Cycle-forming
even when it would also fail the depth cap — it is never a "real target"
for its own ancestor.

**A place that's no target at all isn't classified.** The Unsorted
bucket, a broken column and an expanded column's outer wrapper are nowhere
(§1, §3.1): no drag enters them, and a release there writes nothing, for
every item alike.

**A Stub drag is classified exactly like a Card drag**, full stop.

**The depth cap reaches the board over the API.** `GET /boards/:id`
carries `itemDepthCap`, the cap the API itself enforces, so the board and
the API always judge depth against the same value
([`../item-attachment/`](../item-attachment/) §8).

Settled overlay assignments:

- **Free descendants of the carried item** get the **green** relationship
  overlay — "these are yours," visible on the board while you hold their
  ancestor.
- **Depth-capped targets** are **de-emphasized**, not hidden — "real
  target, not for this item." They're dimmed by a tuning-panel value,
  `overlayDepthCappedOpacity`.

**Every Stub is classified individually**, like any other target.

The *classification* is settled. The overlays' final **look** isn't a
rule yet (Open questions).

## 5. Card → column region: drop bands

**This section is Board layer's own within-action (§1.1) — it governs a
release only while the drag is genuinely popped all the way out, never a
bare hover while still locked somewhere else (§1.1 rule 1).** A Card held
over a column region, at Board layer, resolves by **vertical band**. Per
§1, the region is the whole column in merged mode and a single sub-row in
expanded mode; the bands are measured against whichever one applies:

| Band | Meaning |
|---|---|
| **Top** (above the top divider) | Position **before the first item** in the column. The ghost renders at the top of the list. |
| **Bottom** (below the bottom divider) | Position **after the last item** in the column. The ghost renders at the bottom of the list. |
| **Middle** (between the dividers) | **No position change.** An item from elsewhere takes the column's workphase and keeps the position it already has; the ghost renders wherever that existing position places it in this column's order. An item **already in this column or sub-row** — a covered-set member of the region it is released in (§8) — released here is simply being set back down — nothing is written. In an expanded column the region is the sub-row, so a member of sub-row `W2` released in sub-row `W3`'s middle band is a workphase change to `W3`, not a set-down. |

**Bands are pixel carve-outs anchored to the region's real content, never a
fraction of whatever's currently rendered.** Where the dividers sit is
governed by reservation, not a live measurement — and the reservation is
*exact*: a region's total rendered height never
changes whether or not it's the live hover target. Both drag copies — the
floating DragOverlay and the in-list ghost row — render as a fixed-height
**shortCard** at this layer (§5a), so the geometry below is built from two fixed facts
about that component, never a value found by feel: its height (`h`) and
the card lists' own shared gap (`gap`). Three shapes, read off the region's live
content rect and live card count on every sample:

- **A positional region (1 or more real cards, not terminal):** two zones
  of `(h + gap) / 2` each, outside the list, labeled **"Move Top"** /
  **"Move Bottom"** — not the live hover target. (No "Move Auto": a middle
  release needs no label of its own, since in-context hovering already
  reads as "keep this position.") **The live hover target** (about to be
  committed on release, though not yet locked in) collapses both zones and
  fills the same reserved height with a real ghost — the ordinal placement
  of §10 — instead: the non-hovered list has `n − 1` gaps between its `n`
  cards and the hovered one has `n`, and the ghost row brings exactly
  `h + gap`, so the total never changes. **Hovering takes over the
  reservation; it doesn't add to it — net height never changes.**
- **A genuinely empty region:** one zone of `h` alone, labeled **"Move to
  {name}"** — there's no "first" or "last" to carve two dead zones around,
  and the hovered list holds the ghost with no sibling to gap against.
- **A terminal (done) region with cards:** one **bottom-only** zone of
  `h + gap`, also labeled **"Move to {name}"** — a done region's ghost
  always previews as the newest completion, i.e. last (§10), exactly where
  this zone is. A terminal region with *no* cards collapses to the empty
  case above.

The carve is measured against the region's real content, **never the
visible-scrolled slice** — sharper than §1's "clipped to visible," which
governs only whether the cursor is *in* the region at all. A divider
scrolled out of view is neither drawn nor reachable until the cursor (or
the page) scrolls to it.

**The divider lines sit a full `h` in from each edge of a positional
region, and for two or more cards this deliberately bisects the first and
last rendered card.** That's intentional, not a bug: the dead zone is only
`(h + gap) / 2` tall, so a divider a full `h` from the edge falls at the
vertical midpoint of the real card now sitting there — a real card's own
height *is* exactly `h` for the life of the drag, both drag copies being
shortCard (§5a). Exactly where the line crosses a card is cosmetic; what a
release above or below it means is not.

**Exactly one card in a region halves the edge too** — to `(h + gap) / 2`,
the same as the dead-zone height — instead of the normal full `h`, so the
card stays a real, unlabeled middle band rather than being bisected with
nothing left on either side of the cut. This changes only where the *divider line* sits, never the
dead-zone reservation itself, which is already `(h + gap) / 2` on both
sides regardless of card count.

**The reserved space exists only at Board layer, and it collapses, not
merely hides, everywhere else.** §1.1 already states that the drawn guides
disappear the moment anything is locked (this region or a different one) —
that's a claim about the *cues*. This is a separate claim about the
*layout*: the carve-out and its dead zones vanish entirely the same
moment, and cards render back-to-basics adjacent with no reserved gap left
behind.

**The middle band is also the pop-eligible zone.** Holding there pops the
Card into the column — out of its old context first, then in (§3: two
thresholds, run back to back when the cursor simply rests) — after which
it is positioned by ordinary anchor+side hovering rather than by band.
Releasing without holding, or after popping out but before popping in,
commits the band's meaning.

**The reservation is derived from shortCard, not tuned.** `h` and `gap`
are fixed facts about the card component (§5a). The dividers, both
dead-zone heights and the one-card exception above all derive from the
same two numbers, so what the guides draw always matches what a release
resolves to. Neither is a tuning-panel value.

**A band reads the region's live content rect and live card count on
every sample, never one frozen at drag start.** Why not freeze it: the
reservation is exact, so the ghost's insertion changes *where* the
reservation currently is, never the region's *total* size, and a live
read on every sample has nothing to get wrong.

**The bands are shown only at Board layer:** while
genuinely popped out, every column/sub-row draws two subtle dashed lines
at the boundaries, drawn from the same live rect the drop resolves
against. Which band a release resolves by is the ghost's to show (the
table above). The
moment the drag is locked into anything — a column/sub-row *or* a Card —
every guide disappears: there are no bands to cue there (§2), and the
absence of lines says so. Their look isn't a rule yet (Open
questions).

**Merged columns:** an item moved into a column covering multiple
workphases takes the **first workphase in the column's range**. The
ambiguity is harmless because positions compare across the whole workflow,
not within a workphase — see [`../item-positioning/`](../item-positioning/)
§2 and §4.

**Expanded columns:** the bands apply **within each sub-row**, and a drop
resolves to that sub-row's **exact** workphase — there is no range left to
be ambiguous about. "First item" and "last item" mean first and last *of
that sub-row*. Because each sub-row is its own context (§1), landing in a
different sub-row of the same column is a genuine workphase change reached
by popping, not an in-context reposition that happens to cross a line.

**Done columns** accept attach-drops and card-drops, but **not positioned
inserts.** Free done items carry no position, so they cannot serve as
anchors and there is no "first" or "last" to place against — the top and
bottom bands have nothing to resolve to. A drop into a done column resolves
as a workphase change; ordering there is by completion time.
(A done *Card's* Stubs do keep positions, and **are** anchorable — §7
applies inside a done card normally.)

**A terminal (done) region collapses to a single band on the board itself,
unconditionally, regardless of card count** — the same single-band
treatment as a genuinely empty region above, labeled by the workphase's own
name. Done changes the *geometry* a carried card sees while hovering,
not only what a release *resolves to* (the rule above), for the same
reason: there's nothing to place a positioned insert against.

## 5a. The dragged card's own visual collapse

**At Board and Column/sub-row layers, both visible copies of a Card being
dragged — the floating DragOverlay copy and the in-list ghost row — render
as shortCard**, a fixed-height compact mode. These are the only layers with
bands (§5), so the carve-out reservation always has shortCard's one exact
height to reserve.

**From the Card layer down — Card and Descendants — both copies are a Stub
row instead**, like the rows the item will be placed among. The carried copy switches at the zoom-in from a column into a
Card and switches back at the pop-out to a column; a Stub's own drag starts
at the Descendants layer, so it is a Stub from pickup. It is as wide as a
row in that Card's section, keeps a "held" treatment (a shadow) so it reads
as carried rather than as one of the rows, and stays under the pointer
through the switch in both directions. **Why:** a shortCard held inside a
Card's box covers most of the descendants section, hiding exactly the rows
the user is placing among — and at Descendants layer (§7) the rows are
where a depth is chosen.

shortCard is a Card *mode*, not a fifth representation tier alongside
Stub/Card/Sheet/Headline — a compact Card on the board is still the
board's draggable unit:

- **One pills row.**
- **Title** truncates to one line.
- **Description** clamps to exactly one line, with the space reserved even
  when the item has no description at all — so the collapsed height
  doesn't vary on whether a description happens to be set.
- **No assignee footer** — never rendered while dragging, not even
  collapsed.
- **The attached-children indicator and count are fully suppressed** — not
  shown collapsed, not shown dimmed, simply gone from both copies. This
  means **an item's own attached children go completely unrendered, not
  merely visually hidden, for as long as that item is being dragged** — a
  deliberate side effect, not an oversight.

**Why:** a full Card's real height is otherwise unbounded (a long
description, many attached children, an assignee footer). shortCard fixes
both drag copies to one exact height, which is what makes §5's carve-out
reservation *exact* rather than an approximation.

**On drop, the ghost returns to full height.** How it gets there isn't a
rule yet (Open questions).

## 6. Card → Card: attach

**Dropping a Card onto another Card attaches it as a Stub, inheriting the
new parent's workphase — always as the last child.** No band, no anchor,
no choice of position among the parent's existing Stubs. This is the Card
layer's **auto-drop**, and it has exactly two cases:

- an item brought into the Card **from outside** — a Free Card, or a Stub
  detached from another parent — is attached as the **last child**;
- the Card's **own Stub**, popped out of Descendants to the Card layer and
  released there (§8), is **set back down where it was picked up** —
  nothing is written.

Placing an item as some Stub's *first* child is a different gesture — the
manual tabbed-right placement at Descendants layer (§7) — not a variant
of the auto-drop. Any position among the parent's children is the
Descendants layer's own job (§7), reached only by zooming one
layer further in.

An attach's consequences — the reparent, the workphase inheritance, the `projectId` cascade if the two
cards are in different projects, the legality of a done parent — are all
[`../item-attachment/`](../item-attachment/)'s rules, applied unmodified.

**How this is distinguished from inserting *between* two cards.** The drag
visuals push neighboring cards apart to make room for the ghost, which
reads as "inserting between these two" — the very gesture attaching has to
be told apart from. **The pop threshold is what separates them**, not
geometry: hovering between two cards is a reposition no matter how precise
the aim, and entering a card's context requires the sustained hold of
§6.1. Insertion is the default
because it's the common case; nesting costs a deliberate hold.

This is why §2's "assume reposition" bias and §3.1's "never incidental"
rule carry real weight here — they are the answer to this ambiguity, not
general principles that happen to apply. What the transition means is
settled; how its cue finally looks isn't (Open questions).

The carried card keeps following the cursor while locked into the target
Card's context (bounded to its box, the same "clamped, not frozen"
treatment as any other locked context, §2). It's the *ghost* — the
placement preview among the target's Stubs — that's pinned, always at
the last position, never tracking where inside the card the cursor
happens to be. Since the within-action can't change no matter where the
cursor rests, nothing about the preview is left to promise otherwise.

### 6.1 Which Card is zoomed into

**The Card zoomed into is the one the side highlight names.** Cards
always just make room for the ghost (§2); what matters is the **named
relation** — which neighbor of the ghost the side highlight names, and on
which side (§2, rule 3). Holding that relation steady is the signal. Why
not the Card under the cursor: it also slides aside to open the ghost's
gap, so resting on it would mean both "move out of the way" and "let me
in", and the cursor would keep leaving it and restarting the clock.

**Friction is intended.** Reparenting is the rarer action, so zooming in
takes a deliberate hold. Erring toward too hard is fine — better than
zooming in by accident while repositioning (§2's bias).

- **First a dwell, with nothing new shown** beyond the side highlight
  itself, so an ordinary pause while repositioning stays a reposition.
- **Then a visible cue on the named card, ending in the pop.** The cue
  shows its progress, which says how long to keep holding, and that
  letting go before it completes still just repositions. When it
  completes the pop happens and the locked-layer visuals take over: the
  card gets the locked outline (§1.1), opens with its placeholder Stub,
  and the carried copy becomes a Stub (§5a). The cue's look isn't a rule
  yet (Open questions).
- **The cue never moves or resizes anything.** Nothing on screen changes
  shape while it runs, so it can't shift the ghost or change which card is
  named.
- **Both clocks reset whenever the named relation changes**: a different
  card, or the same card on its other side. The same card only changes
  side when the ghost moves past it — always a visible reshuffle — so the
  cue only ever runs while nothing on screen is moving, and a release
  commits the same thing it would have when the cue started. Both also
  reset on a pop-out and on a cancel. Why not reset only when the named
  card changes: a wobble across one card would keep the cue running
  through a reshuffle, and a release's meaning would change mid-cue with
  nothing on screen to show it.
- **An invalid target never starts the dwell.** A Cycle-forming or
  Depth-capped card (§4) can still be named for a reposition, but it is
  never a zoom-in candidate (§3.2).
- **A release before the pop commits the reposition** (§1.1 rule 1:
  nothing has been entered yet).

Both stages are durations, so §1.1 rule 3 (zooming in is duration-only)
still holds, and both are tuning-panel values like every other (§3.1).
The Card's own box keeps its other jobs: bounding the carried copy once
inside, and deciding when the drag pops back out. A ghost alone in its
list names no card, so there is nothing to zoom into from there.

## 7. The Descendants layer: manual hierarchy placement

The Descendants layer is one inside a Card (§1.1), and a Stub's drag
*starts* there (§1, §8). A Free Card, or a Stub detaching from elsewhere,
reaches it by zooming into any Valid Card and holding over that Card's
descendants section (§3). Its within-action is precise placement in the
parent's hierarchy, by the gap-and-depth rule the project sidebar uses too
([`../hierarchy-placement/`](../hierarchy-placement/)). From the Card
layer down **both copies are Stub rows** — the in-list ghost and the
carried copy under the cursor — and the Column ↔ Card boundary converts
both, both ways (§5a, §8).

**Zooming in doesn't move the ghost.** At the zoom into Descendants, the
ghost starts where the Card layer showed it: in the last gap, as `P`'s
last child, for an item from outside (§6); in its own slot, for `P`'s own
Stub coming back in (§8). The cursor moves it from there. So a release
right after the zoom commits what it would have at the Card layer.

Why not a band on the Card (top half for first child, bottom half for
last child, a middle to hold): a Card's within-action is the auto-drop
(§6), and placement here is a **range** of depths, not three fixed
options.

### 7.1 Gap and depth

**Placement here is
[`../hierarchy-placement/`](../hierarchy-placement/)'s gap and depth**,
with Card `P`'s descendants section as the hierarchy. On the board:

- **The gap is the ghost's two neighbors**, in the same list shuffle as a
  column's (§2): Top is the row above the ghost, and Bottom the row below.
  The gap is wherever the rows slide aside to make room, never a
  which-half-of-a-row reading.
- **The root is Card `P`**, so the shallowest level is *`P`'s own
  children* ([`../hierarchy-placement/`](../hierarchy-placement/) §3). An
  item can never be tabbed out of `P` — leaving `P` is a zoom-out (§8),
  not a tab state.
- **The hierarchy is never empty here.** A childless Card has no
  Descendants layer (§1.1), so the empty-hierarchy boundary
  ([`../hierarchy-placement/`](../hierarchy-placement/) §2) doesn't arise.
- **An item set back down in its own gap, at its own depth, writes
  nothing** ([`../hierarchy-placement/`](../hierarchy-placement/) §5).
  That gap and depth resolve to the slot it was picked up from (§2, rule
  2). A column is different: there the same set-down still saves its
  anchor, because items the view doesn't show can sit between the
  neighbors (§2, rule 5).

### 7.2 What travels with the item, and what's invalid

**The dragged item carries its whole subtree**
([`../hierarchy-placement/`](../hierarchy-placement/) §4). On the board,
a dragged Stub's subtree travels with the carried copy, and its rows are
passed over, never named (§2).

**The depth cap is checked per tab state, against the deepest descendant,
at absolute depth.** A state's resulting depth is `P`'s absolute depth in
the workflow plus the relative depth, plus the dragged subtree's height
([`../hierarchy-placement/`](../hierarchy-placement/) §6;
[`../item-attachment/`](../item-attachment/) §8). A state that would
exceed the depth cap is still reachable — the ghost snaps there with a
visible invalid cue (its look isn't a rule yet; Open questions) — and a
release in it **commits
nothing**, the same as setting the item back down where it was picked
up. This is the one exception to §3.2's "never enterable," for the
reason given there. Sibling states in the same gap that do fit stay
valid; validity is per state, never per gap.

Whether a Card on the board always shows its whole hierarchy, as
[`../hierarchy-placement/`](../hierarchy-placement/) §1 needs, is open
(Open questions).

## 8. Stub → out: detach

**A Stub can be dragged out of its parent Card.** Its drag starts at its
*containing Card's* Descendants layer (§1, §1.1) — for a grandchild that
is still the Card's whole section, not its parent Stub's sub-list — so
the common case — reordering it among its siblings, or moving it under a
sibling — is the within-action there (§7) and needs no pop at all.
Leaving the Card is a zoom-out, and by §1.1 rule 2 it is **two one-layer
pops**:

1. **Descendants → Card** — the cursor rests outside the descendants
   section (still inside the Card's box) past the shared pop-out
   threshold (§3.1). The item is now at the parent's Card layer, still
   attached, bounded by the Card.
2. **Card → column/sub-row** — the cursor rests outside the Card's box
   past the same threshold. The item is now **Free**: it arrives locked in
   the column that contains the Card, represented as a Card rather than a
   Stub, and is positioned by that column's within-action (anchor + side)
   — or, after a further pop out to Board, by any column's band (§5).

There is no special "two layers at once" rule. The distance term of the
pop-out clock (§3.1) is expected to do that work: a decisive pull away
from the whole Card is already far outside the descendants section *and*
far outside the Card, so the first pop fires and the second, evaluated
fresh against the same distant cursor, fires right behind it.

**The intermediate stop at Card layer is a real state, though not one the
user is expected to linger in.** A release there is the Card layer's
auto-drop (§6), and for the Card's own Stub that means **set it back down
where it was picked up — nothing is written**. (An item brought in from
*outside* the Card auto-drops as the last child; what distinguishes the
two is where the drag started, not anything about the release.)

Once Free, the item's relationship to its former parent is **preserved** —
detaching is not un-parenting. The exception is zooming into a different
Card, which is a reparent: the item arrives from outside and auto-drops as
that Card's last child (§6), or goes on into its Descendants for a precise
slot (§7). See [`../item-attachment/`](../item-attachment/) §11.

**Detaching in place keeps the inherited workphase.** A Stub's workphase is
already its parent's, so it is already a member of the covered set of the
column the parent sits in — which makes a drop there a position-only
reorder with `workphaseId` untouched, by the existing covered-set rule in
[`../item-positioning/`](../item-positioning/) §4. §5's "takes the first
workphase in the range" applies only to a drop into a column the item
wasn't already in. This matters for a parent sitting in a *non-entry*
workphase of a merged column: detaching its child in place must not
silently walk that child back to the entry workphase.

**A detach writes `isAttached: false` and leaves `parentId` untouched.**

## 9. Depth overflow

**Not settled — see Open questions.** What happens to a hierarchy too
deep for a Card to show isn't a rule yet. Whatever is decided, §7's
placement rule applies unchanged inside any surface that shows the
hierarchy.

## 10. Optimistic preview, reconciliation, and failure

**The board previews a drop ordinally: the item is placed at the ghost's
index, with no position value invented for it.** The number is the server's
to produce, and the client waits for it without guessing. In a column or
sub-row the saved anchor is always one of the ghost's own neighbors (§2),
so the preview and the write can't disagree about the slot.

This is correct rather than merely close enough — see
[`../positioning/`](../positioning/) §5 for
why the rendered order the client draws always matches the rendered
projection of the server's answer, and why that holds even when the anchor's
own value is still in flight.

**A previewed item is marked pending; its `position` is left alone.** It is
specifically *not* set to `null` — null already means "not ordered by
position" (a done item), and would sort the pending item to the top of the
list ([`../item-positioning/`](../item-positioning/) §2).

**On the response**, in this order: apply any reindex pairs, assign the
authoritative position, clear the pending marker, and only then check for
inversions. The order matters; see
[`../positioning/`](../positioning/) §8.

**An inversion is a tripwire, not routine maintenance.** Given the property
above, a correctly reconciled response should never invert the rendered
order. If one fires, the client and server disagreed about what the drop
meant — worth surfacing, not silently repairing.

**The check runs only for a write the board previewed.** A Sheet edit
that reassigns a position made no ordinal claim. The board compares the
rendered order of positioned Free items with the pending placement to
the order after the response, with the placement cleared, and a
difference goes in the inversion log (below).

**Re-dragging an item whose write is still pending** puts two writes in
flight against one row. Responses must be sequenced per item so a stale one
can't be applied last. A stale response's own row is discarded; if it also
carried reindex pairs, the client resyncs rather than guess whether they
are still current, by reloading the board. What the board shows
meanwhile: if the earlier write is still in flight, cancelling the
re-drag — or releasing it where nothing is written — restores the earlier
write's pending marker rather than clearing it. A response landing
mid-drag of the same item clears the ghost only for the instant it takes
the board to notice.

**The client never keeps a guess the server rejected.** A failed drop
resyncs the board from the server. §3.2 should make this nearly
unreachable — an invalid target shouldn't have been poppable — so a
rejection arriving at all means the two enforcement points have drifted.

**A reload that lands mid-drag stops the drag, whatever caused it.**
Either resync above, a failed drop's or a stale response's, can land
while the user is dragging an item, and so can any other reload of the
board. The drag ends at once and nothing is written. The item
is wherever the reloaded board shows it, which is where the server has
it and may not be where the drag picked it up. A reload is the path for
when something has gone wrong, and picking the item up again costs
little. Why not keep the drag going on the reloaded board: the reload can
move or remove what the drag is locked into, such as a Card the failed
drop had put in this column, and the release would then land somewhere
the user never saw.

**Planned:** a drag the board stops shows a cue that says so, so the
drag's end doesn't read as a slip of the user's hand. Its look isn't a
rule yet (Open questions).

**The placement a release implies is shown at the moment of release**,
before the request is even sent, so the board never shows its pre-drop
order while waiting for the response.

The preview is a **placement** layered over the position sort, in the
same terms as the request: a workphase, and a slot that is first, last,
where the item's kept position already falls, or an anchor and side. So
the picture before and after the response is the same one. **The
general rule: the preview shows where the write will actually land the
item.**

- **"Where its kept position falls" never means "no position."** An item
  with none to keep (a reopened done item, a first-time workphase
  assignment) previews last instead, matching the append fallback it will
  actually resolve to
  ([item-positioning](../item-positioning/) §2 and §7.5). Sorted by
  position, it would otherwise draw at the top, then land
  at the bottom.
- **An item whose kept position isn't *comparable* in the list it's
  previewing into** — a Stub, numbered among its attached siblings,
  arriving Free in a column's workflow-wide list (§8) — also rests last,
  matching the append fallback a detach without an anchor resolves to.
  Hover displacement moves it from there exactly as for any Card.

The placement is the ghost during the drag and the pending marker after
release; nothing in the item is touched until the response. An inversion
is recorded in the tuning panel's inversion log (kept across board
reloads while the board is open) — the panel is where it surfaces;
nothing goes to the console.

**A done list orders a previewed item as the newest completion, not the
oldest.** A card dragged into a done column has no `completedAt` yet; the
done list orders a missing one last, not first, matching the server's
stamp on the write.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **The look of the drag's cues.** The classification overlays (§4), the
  band guides (§5, including whether the band under the cursor gets a
  highlight of its own), the zoom-in cue (§6.1) and the invalid tab-state cue
  (§3.2, §7.2) each have a working placeholder; their final palette,
  weight and animation are best tuned against real gestures rather than
  guessed up front. The cue for a drag a reload stops (§10) has no
  placeholder. Today's zoom-in cue is a dashed outline in the
  attach-preview blue — the same dashed style as the placeholder Stub a
  Card shows once you're inside it — and a thin bar along the card's
  inside bottom edge, filling left to right. The fuller transition (the
  card opening, the placeholder growing, the carried copy shrinking toward
  it) is undesigned.
- **Whether the ghost's expansion on drop animates (§5a).** Today it's
  instant.
- **Where the tuning panel lives, and who sees it (§3.1).** Today it opens
  from the board toolbar ("Drag tuning").
- **Whether a Card shows its whole hierarchy (§7, §9).** Hierarchy
  placement depends on knowing nothing is missing between Top and Bottom
  ([`../hierarchy-placement/`](../hierarchy-placement/) §1). The project
  sidebar always has the whole tree
  ([`../project-tree/`](../project-tree/) §1). A Card on the board
  may not, and the board may not know when it doesn't. A hierarchy too
  deep to show is one such case: it could get a "see X children"
  placeholder that opens a wider modal on click or on a held drag-over,
  or be capped at what the UI can display. Where a Card's section can't
  be trusted to be complete, placement there would change, for example to
  offering only an anchor and side against a visible Stub, and so would a
  set-down in its own gap (§7.1). Until this is decided, a Card's
  descendants section follows §7 as written.
- **Zooming into a Card in a done column (§2, rule 6; §6.1).** The Card
  zoomed into is the one the side highlight names, a neighbor of the
  ghost. A done list's ghost doesn't move, so only the Cards beside it
  could be named. What the highlight shows in a done list is decided
  with this: a done list's release names no card, so naming the Card to
  zoom into is the highlight's only job there. Today it's drawn as if
  the ghost had slid: carrying `X` over `D1` in `D1, X, D2` draws it at
  `D1`'s top, where `X` isn't.
- **Free-item reparent as a board gesture.** Would add a third
  drop-meaning to disambiguate here. See
  [`../item-attachment/`](../item-attachment/) Open questions.

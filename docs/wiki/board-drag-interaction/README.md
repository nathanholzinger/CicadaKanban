# Board Drag Interaction — Contexts, Popping & Drop Resolution

**Build status:** Rules settled for Epic 3.5; Stories 2–6 build them.
**§4 (target classification) implemented as of Story 2, full classification
(no Stub exclusion) as of Story 5** — computed once at drag start
(`client/src/components/workflow/dragClassification.ts`), shown as a
`data-drop-state` attribute plus provisional overlays on every Card and
Stub. **§1–§3 (contexts, popping), §5 (column bands) and §10 (ordinal
preview, reconciliation, per-item sequencing) implemented as of Story 3,
re-planned and rebuilt for Story 4 (2026-09-16)** — the pop machine is
`workflow/popSession.ts`, the regions `workflow/dragRegions.ts`, the
placement layer `workflow/itemListOps.ts`, and every threshold and band is
a dev/test-panel value (`workflow/dragTuning.ts`, toolbar → "Drag tuning").
**§6 (attach), narrowed, implemented as of Story 4** — a Card is now a
full context (§1.1), but its *within-action* is a constant (always append
as the last child, §6) rather than the full anchor+side ruleset. **§1's
Descendants layer, §8 (detach) and §10's `parentId: null` preview
implemented as of Story 5 (2026-09-21)** — a Stub's drag starts there
(`descendantsRegionKey`, `dragRegions.ts`), pops out through the Card
layer to the column that contains it exactly as §8 describes, and every
item drag (Card or Stub) shares one dnd-kit registration
(`data: {type: 'item', role}`, decision 4). **§7 (the Descendants layer's
full manual hierarchy placement — gap + depth, beyond the interim direct-
sibling reorder Story 5 built) is Story 6's**; placing a Stub anywhere but
directly among its own siblings, or zooming into a Card's own Descendants
section from the Card layer, stays held closed until then. **Built so far
in Story 6 (2026-09-23/24):** §5a's Stub-shaped carried copy from the Card
layer down (Phase C), and §2's rule that a column drop lands exactly where
the ghost is (a hands-on finding). Planned next: §6's zoom-in target
change, then §7's gap + depth (Phase D).

**The 2026-09-16 re-plan is a genuine rule change, not just Story 4's
build catching up to §6.** Working the story with the Product Owner
surfaced that Story 3's original model — any region's band decides on
release regardless of whether the drag had ever left its own context —
produces too many simultaneously-live gesture meanings once a Card is
also a region: every column's bands *and* every card's attach bands are
armed at once, all the time. The fix settled on (§1.1, §2, §3) is a strict
layer stack: **Board → a Column/sub-row → one of its own Cards**, never
more than one layer away from the locked context, and **a release always
commits the locked context's own within-action**, full stop, regardless of
where the bare cursor happens to be resting. A hovered-but-not-locked
region only ever matters at Board layer (§5) — which is also the only
layer where the band guides (`BandGuides.tsx`) draw anything.

**Stories 5/6 rules settled with the Product Owner (2026-09-17):** a
fourth layer, **Descendants**, one inside the Card (§1.1) — it is where a
Stub's drag starts and where manual hierarchy placement lives, under a
single depth-range rule shared with the project sidebar (§7, which
replaces the earlier Stub-band draft entirely); the detach path is two
one-layer pops (§8); and the overflow placeholder (§9) is no longer a
settled rule — Story 7 decides whether it exists at all. **Story 5
(2026-09-21) builds the layer's origin, its two-pop exit, and the interim
sibling-reorder within-action; §7's full gap + depth placement, and
zooming into a Descendants section from the Card layer at all, are
Story 6's.**

**Test suite:** [`../../test-plans/board-drag-interaction/`](../../test-plans/board-drag-interaction/)

**Related:** [`../item-attachment/`](../item-attachment/) (what the gesture
is allowed to produce) · [`../item-positioning/`](../item-positioning/)
(how the resulting position resolves)

This page answers "what happens as the user drags, and what does a release
at a given place mean." The *consequences* of any resolved drop —
attachment, reparenting, cascades, validity — live in
[`../item-attachment/`](../item-attachment/) and hold identically for
non-drag paths.

**A note on what's testable here.** These rules split into two halves.
Drop **resolution** (given a release at this place, what change is
committed) is ordinary automatable behavior. Interaction **feel** (does the
pop happen when it should, does the ghost read as "this will nest" rather
than "this will replace") is not meaningfully assertable and is a manual-
verification job by design — not a coverage gap to close. Test cases
derived from this page should come from the first half.

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
  sub-row that contains it (§1.1, Story 4). Its within-action is the
  auto-drop (§6).
- **A Card's Descendants** — the context for its Stubs (its attached
  descendants, **at every depth** — one Descendants layer per Card, never
  one per Stub; §7.1's root), one layer inside the Card (§1.1, Stories
  5/6). Its within-action is manual hierarchy placement (§7). *(Ruled
  2026-09-17. Earlier drafts named the Card itself as a Stub's context;
  under the layer stack that would leave a Stub no way to be reordered by
  hand, since the Card layer's within-action is the auto-drop. The
  every-depth reading ruled 2026-09-21, Story 5 decision 1.)*

**A region is a bounded box.** Only the box counts — not the column's
horizontal stripe above or below it. A column's header and footer, the
board toolbar, the gap between columns, the gaps between sub-rows and the
space below the last one are **nowhere**: no region, no context. A region
is also clipped to what is visible — a sub-row scrolled out of its column's
view is not a region until it scrolls back in; you can only be in what you
can see. Resting nowhere pops the card out (§3); releasing nowhere writes
nothing (§5). A Card's region (§6, Story 4) is the same kind of box.
*(Ruled 2026-09-15, reconciliation #20; built in the Story 3 follow-up
(2026-09-15) — `dragRegions.ts`'s region lookup is now simple containment
(`childRegionAt`, one function for every layer as of Story 4.1 Phase 0 —
replacing the Story 4 re-plan's separate `nonCardRegionAt`/`cardRegionAt`
pair), and a sub-row is clipped to its column's visible scroll box in
`measureRegions`. Story 3 as built had used the column's full horizontal
stripe with a nearest-sub-row fallback.)*

Every drag starts inside exactly one, determined by what the item already
is and how its column is currently displayed — except a drag picked up
from Unsorted, which starts popped out with no context (§3). Nothing about
the drag's start is a user choice. **A Free Card's drag never starts
inside a Card** — only a column/sub-row, or (from Unsorted) nowhere; a
Card is reachable only by zooming in (§1.1, §3). **A Stub's drag starts
at its *containing Card's* Descendants layer** — the nearest Free
ancestor's section, whatever the Stub's depth beneath it: a grandchild's
drag starts in the same section as its parent's, and popping out of it
lands on that Card, never on the parent Stub (§1.1, §8; ruled 2026-09-21,
Story 5 decision 1). Reordering it among its siblings costs no pop at all.

**Why the sub-row and not the column, in expanded mode:** an expanded
column exists precisely to make each workphase individually targetable. If
the whole column were the context, moving between its sub-rows would be a
free in-context reposition — and the workphase distinction the display mode
was configured to expose would carry no weight during a drag, which is the
one moment it most needs to.

### 1.1 The board is a strict stack of layers (re-plan, 2026-09-16)

**There are exactly four layers, and a drag is always in exactly one:**

| Layer | Reached from | Zoom-in target | Within-action |
|---|---|---|---|
| **Board** | (the top) | a column/sub-row | §5's band, on release |
| **Column/sub-row** | Board, or a Card popping out | one of its own Cards | reposition — the ghost's slot, named by anchor + side (§2) |
| **Card** | its own column/sub-row; or its Descendants popping out | its own descendants section (Story 6) | the auto-drop (§6): last child for an item from outside; set back down for its own Stub |
| **Descendants** (Stories 5/6) | its own Card, only; or where a Stub's drag starts (at any depth beneath that Card) | *(none)* | manual hierarchy placement — gap + depth (§7) |

*(Three layers as built for Story 4; the Descendants row ruled
2026-09-17.)* A Card with no attached children has no descendants
section, so its Descendants layer is unreachable and the auto-drop is its
only outcome — with nothing to reposition or reparent among, manual
placement has nothing to offer.

**Three rules govern every transition, settled with the Product Owner
before Story 4's build:**

1. **A release always commits the locked layer's own within-action** —
   never a foreign region's, no matter where the bare cursor is resting.
   This replaces §2/§3's original "the bands are three quick auto-
   placements for when the cursor is somewhere else" framing: that framing
   made sense when a bare hover's meaning was independent of whether the
   drag had ever left its context, but it does not survive a Card also
   being a region (armed alongside every column's bands, all the time) —
   see §2.
2. **Popping is always exactly one layer.** Zooming in reaches only the
   *next* layer down — Board into a column/sub-row, a column/sub-row into
   one of *its own* Cards, a Card into its own descendants section — never
   a foreign column's Card and never two layers in one hop. Popping out
   always lands on the current layer's own *parent* — Descendants' is its
   Card, a Card's is the column/sub-row that contains it, **never Board
   directly**. Moving from one Card to a different one — even a sibling
   in the same column — always passes back through the column layer
   first; there is no direct sibling-to-sibling hop. There is likewise no
   "two layers at once" pop out of Descendants (ruled 2026-09-17): a
   decisive pull away from the whole Card is expected to satisfy
   Descendants' and then the Card's pop-out in quick succession through
   rule 3's distance term, and the intermediate stop at Card layer is a
   real state, however brief (§8).
3. **Zooming in is a duration-only signal; zooming out is duration *or*
   distance**, same as Story 3 already built for the Board ↔ Column/sub-row
   edge (§3.1). The asymmetry is deliberate: zooming in can mean a
   reparent, so it earns a sustained, unambiguous hold; zooming out never
   changes what anything *is*, so a fast, decisive yank is allowed to
   satisfy it. A "yank a Card's own attach-preview out, and the cursor is
   already well past the column too" gesture cascades through **two**
   pops in quick succession as a consequence of rule 2 alone — no special
   two-layer-skip case is needed: the first pop lands on the containing
   column, and that column's own zoom-out threshold is then evaluated
   fresh against the same, still-distant cursor position.

**Because of rule 1, the band guides (§5, `BandGuides.tsx`) only draw
anything at Board layer.** A locked column/sub-row shows no dashed lines
on any *other* column, and a locked Card shows nothing at all — there is
nothing to cue, since nothing about a bare hover elsewhere would change
what a release does.

**The locked layer itself always gets an outline, at every layer** —
whichever region or Card is currently `contextKey` (`BandGuides.tsx` for a
column/sub-row, `KanbanCard.tsx` for a Card), so which layer you're in is
legible on the board itself, not only from the dev panel's text readout.
*As built:* `activeContextOutlineColor`, a panel value (§3.1).

## 2. Default assumption: reposition in place

**A drag is assumed to be a reposition within its current context until the
user demonstrates otherwise.** This is the central bias of the whole
interaction: the common case (reordering) requires no precision, and the
rarer, more consequential cases (changing workphase, changing parent) are
what require the user to do something deliberate.

While the item is in-context:

- It receives a **tilt** on pickup, indicating it's held. *(Existing
  behavior.)*
- It is **bounded by its context.** The card follows the cursor only within
  the context's own extent; movement that would carry it outside is not
  followed until a pop.
  - In a **merged** column this reduces to a horizontal axis lock — the
    only way the card *itself* is ever visibly held back is sideways; it
    moves freely up and down within the column. *(This is about the
    overlay's own clamp, `clampToCurrentContext` — unchanged by the
    paragraph below.)*
  - In an **expanded** column the sub-row bounds the card **vertically as
    well**. Drifting toward the sub-row above or below is held exactly the
    way drifting toward the next column is, and crossing it is a pop.

  **Whether the *context itself still holds* is a separate question from
  the clamp above, and for a merged column the two are measured against
  different boxes (ruled by the Product Owner 2026-09-18, F6).** §1's
  region — what §5's bands are measured against — is the column's
  content-sized list box, sized to its own cards; a short merged column's
  own empty space below its last card is outside that box, i.e. nowhere.
  Read literally, leaving the cards and entering that empty space would
  count as leaving the context and start the pop-out clock (§3) — visibly
  wrong, since the cursor is still plainly inside the column. The context
  is judged to still hold there instead: a merged column is bounded, for
  *this* purpose only, by its own outer body (the column's full
  available-height box, before Story 3's follow-up narrowed the region to
  its content) — taller than, and never resized to match, the content-sized
  box §5's bands still carve out of. Sub-rows have no such gap (a sub-row's
  box already is its full bound) and are unaffected either way.
- A **ghost** shows the slot it would land in, and a **side highlight** on
  a neighboring item shows which item it is anchoring to and on which side.
  In a column or sub-row, **a release lands the item exactly where the
  ghost is** (ruled by the Product Owner 2026-09-24):
  1. **The ghost's slot follows the list's standard shuffle** — the
     neighboring cards slide aside to open a gap wherever the carried card
     is, the ordinary sortable-list behavior, not a custom rule.
  2. **The dragged card's own slot counts too.** Resting over the place it
     was picked up from opens no gap anywhere else; nothing shuffles.
  3. **The slot is saved by naming one of its two neighbors** — "after"
     the card above the ghost, or "before" the card below it. Which one
     depends on where the carried card sits relative to the ghost's
     middle: above it names the card above; below it names the card
     below. The side highlight sits on the named neighbor.
  4. **At either end of the list there is only one neighbor**, so it is
     always the one named. A ghost alone in its list names nothing, and
     the release takes the column's no-anchor slot (§5's middle-band
     meaning, with §10's #29 rule for an item with no comparable position
     to keep).
  5. **Setting a card back down in its own slot is not a no-op** when it
     has a neighbor. On screen, "after the card above" and "before the
     card below" are the same slot; in the workflow-wide order they can
     differ, because items this view doesn't show can sit between the two
     neighbors ([`../item-positioning/`](../item-positioning/) §2). So the
     release saves the named anchor, and the item may move relative to
     those unseen items. Only a card alone in its list, set back down, has
     nothing to name and writes nothing (§10).

  *(Replaces the rule as first built, never stated here: the side came
  from which half of the hovered card the carried card's center was in,
  while the gap was drawn from list order — so a drop could land one slot
  away from the ghost. Found in Story 6's hands-on, 2026-09-24; built and
  merged the same day — `boardDndUtils.ts::dropAnchorFor`, the one
  function both the side highlight and the release read. **Scope: columns
  and sub-rows only.** A Card's Descendants section keeps the which-half
  rule until Story 6 Phase D brings it onto this one (§7.1). The project
  sidebar is unchanged: it draws an indicator line and no ghost, so the
  line is already its only cue and already matches the save.)*

**A release always commits the in-context meaning above, no matter where
the bare cursor is resting** (re-plan, 2026-09-16 — §1.1 rule 1). The card
never visually leaves its context (it's bounded, per the bullet above), so
nothing shown ever promises a foreign region's meaning the way a bare
hover once implied. Reaching any *other* meaning — a column's band (§5), a
different column/sub-row's in-context placement, a Card's attach (§6) —
always requires an actual pop first (§3), never just a glance.

## 3. Popping

**The cursor, not the card, decides whether the context holds.** Because
the card is axis-locked, the cursor can leave the context while the card
cannot follow. "The context" here is a merged column's outer body, not the
content-sized box §5's bands are measured against — §2's F6 addendum.
Popping is two-way, and each way takes its own sustained signal (§3.1), and
each way moves exactly one layer of §1.1's stack:

- **Pop out.** When the cursor has stayed *outside* the card's context —
  anywhere: another column, the gap between columns, Unsorted — past the
  pop-out threshold, the item pops out to its **parent layer** (§1.1 rule
  2): a column/sub-row's parent is Board — the item **snaps to the cursor
  and follows it freely**, belonging to no context; a Card's parent is the
  column/sub-row that contains it — the item becomes bounded by *that*
  instead, still locked, just one layer shallower; Descendants' parent is
  its Card (§8). *As built:* a short
  tween (`popSnapMs`, a panel value; 0 teleports) from where the card was
  clamped to the cursor (or to the new, wider context), chasing it if it
  moves meanwhile.
- **Pop in.** From Board, a popped-out item enters a column/sub-row when
  the cursor has stayed in that context's *region* past the pop-in
  threshold and is in the middle band (§5) when the clock runs out — any
  column, **including the one it just left**. From inside a locked
  column/sub-row, the cursor resting on one of *that column's own* Cards
  past its own (duration-only, §1.1 rule 3) threshold zooms into it instead
  (§6) — never a foreign column's Card, and never reachable from Board
  directly. *(Planned, not built: the target becomes the card the side
  highlight names, after a dwell and a cue — §6.)* From inside a locked Card, the cursor resting on *that Card's*
  descendants section past its own duration-only threshold zooms into
  Descendants (§7, Story 6). Either way, the clock counts time in the region/Card, not in a
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

*(Amended twice on 2026-09-11 after Story 3's hands-on. The original text
read "the axis lock releases … follows it fully thereafter" — one pop, then
free for the rest of the drag; the first amendment made a pop a direct
transfer between contexts with no free state at all. The two-way model
above is what the gesture wants: leaving and entering are separate,
deliberate acts, and the popped-out state between them is a real place to
be.)*

### 3.1 A pop requires a demonstration of deliberateness

**The rule is that popping is never incidental** — it takes a sustained
signal from the cursor, not a momentary crossing. This is what lets §2's
"assume reposition" bias hold: brushing past a neighboring context while
reordering must not reparent anything.

**The threshold's parameters are tuned, not specified here.** Provisional
value: the cursor rests inside (or outside) a context window continuously
for **0.5 seconds**. Candidate refinements the tuning should make
comparable — a **distance** term alongside duration (the further outside
the context the cursor travels, the sooner the pop), *either* threshold
satisfying rather than both, or a combined function.

*As built (Story 3), ratified 2026-09-15, extended for Story 4's re-plan
(2026-09-16):* two clocks per edge of §1.1's stack — the **model** is
settled (pop out, then pop in; a cross-column in-context placement costs
both, back to back); **none of the values are**. All are being tuned by
feel, with no target settle time committed. **Pop-out** (any layer, into
its parent) — starts the moment the cursor leaves the context (wherever it
goes), resets when it comes back; fires once `popDelayMs` has elapsed
**or** — when `popDistancePx` is non-zero — once the cursor is at least
that far outside the context's rect (either satisfies; distance ships
disabled). Shared by every layer's pop-out, since zooming out never
signals a reparent (§1.1 rule 3) — Descendants → Card included, once
built. **Pop-in, Board → Column/sub-row** —
starts when a popped-out card's cursor enters a region (or at the pop-out
itself, if the cursor is already in one), so the popped-out state always
lasts at least `popInDelayMs`; fires from the middle band only. **Pop-in,
Column/sub-row → Card** — its own, separate, duration-only clock
(`cardPopInDelayMs`, no distance term): starts when the cursor rests on
one of the locked context's own Cards, fires once that alone has elapsed.
Kept apart from `popInDelayMs` because this edge is the one that can mean
a reparent — the tuning is free to make it a more deliberate hold than an
ordinary column pop-in, though nothing requires it. *(Planned, not built
— §6: this edge becomes two stages keyed on the relation the side
highlight names, a silent dwell and then a visible cue. Suggested: a new
panel value for the dwell (about 500 ms; `cardZoomDwellMs` proposed), and
`cardPopInDelayMs` reused for the cue.)* **Pop-in, Card →
Descendants** (Story 6, not built) — a fourth clock, duration-only,
starting when the cursor rests on the locked Card's descendants section;
its own panel value, to be named when built, and free to share a value
with `cardPopInDelayMs` if the tuning finds no reason to differ. The cursor's region is
the bounded box of §1 — outside every box, over Unsorted or a broken
column, the cursor is nowhere and a release there writes nothing (subject
to §2's "always the locked context's own within-action" once anything is
locked at all). *(Story 3 as built decided the region by the column's
horizontal extent instead, so a drag only left a region sideways;
superseded by §1's rule in the Story 3 follow-up (2026-09-15).)*

**The dev/test panel exposing every threshold is a required deliverable of
this feature, not a debugging convenience.** The correct value can only be
found by feel, and feel can only be compared by changing one number between
two attempts without a rebuild. The panel also exposes the overlay colors
of §4. *As built:* the panel's values persist in `localStorage` under
`kanban_drag_tuning` — `popDelayMs`, `popDistancePx`, `popInDelayMs`,
`cardPopInDelayMs`, `popSnapMs`, `overlayFreeDescendantColor`,
`overlayDepthCappedOpacity`, `activeContextOutlineColor` (§1.1's locked-
layer outline) — and tests seed that key, so every case runs against the
configured value. The panel is a tuning-phase tool for the humans doing the
tuning: where it lives and who sees it is deliberately not specified here,
and it is retired once the values lock and become constants. *(The retired
Stub-band draft's `stubFirstChildBand`/`stubLastChildBand`/
`stubPopBandStart`/`stubPopBandEnd` were tuning fields in Story 4's first,
retired trial build — a Card's within-action has no band at all now, §6.
`ghostCardHeightPx`, once here too, left the panel in Story 4.1 Phase 1:
§5's reservation is now a fixed fact about the shortCard component
(`KanbanCard.tsx::SHORT_CARD_HEIGHT_PX` plus the card lists' own gap),
never a value found by feel — see §5.)*

Derived test cases should assert *that* a sustained signal pops and a
momentary one doesn't, parameterized on the threshold — never on 0.5s
itself. More broadly (ruled 2026-09-15): automated tests assert
**reachability** — it is possible to pop out, pop in, place in a column —
and the correctness of the resulting write. A case whose pass depends on
a threshold value (move here, wait this long, expect that) is fragile
against retuning and is a feel judgment besides; it stays in the manual
test plan until the values lock, and may stay manual even then.

### 3.2 Invalid targets are never poppable

**A context the drop would be rejected from must not be enterable.** If the
API would refuse the resulting parent — cycle, over the depth cap — the
gesture must never let the user pop into it in the first place.

The user should never watch an item settle into a place and then bounce
back. Validity is decided before the affordance is offered, using the same
rules the API enforces (see [`../item-attachment/`](../item-attachment/)
§7–§8).

**One explicit exception (ruled 2026-09-17): a tab state at Descendants
layer (§7).** A tab state is a discrete depth the ghost snaps to inside a
context the item is already in, not a target it pops into. An over-cap tab
state is therefore *reachable* — the ghost renders there with a visible
invalid cue (look TBD, Story 8) — and a release in it **commits nothing**,
exactly as if the item had been set back down. The rule above still
holds for what it was written for: no *context* — a column, a Card — that
would reject the drop is ever enterable. A cycle needs no cue at all: the
dragged item's own subtree travels with it and is never a placement
candidate, so no tab state can make an item its own descendant.

## 4. Target classification at drag start

**When a drag begins, every visible target is classified against the item
being carried**, and that classification is shown. Four states:

| State | Meaning |
|---|---|
| **Valid** | A legal drop for this item. |
| **Cycle-forming** | The target is the dragged item, or one of its descendants. |
| **Depth-capped** | Legal parent-wise, but the resulting depth would exceed `CAP`. |
| **Inert** | Not a target for this drag at all. |

**Classification is computed once, at drag start.** The item being carried
doesn't change mid-gesture, so neither does what any target *is* to it.
This is a per-drag property, not a per-hover one.

**Cycle-forming wins.** A descendant of the carried item is Cycle-forming
even when it would also fail the depth cap — it is never a "real target"
for its own ancestor.

**What is Inert** (settled in Story 2):

- For a **Card** drag: the Unsorted bucket, a broken column, and an
  expanded column's outer wrapper (a drop must land on a specific sub-row).
  These are non-targets for *every* item, not just this one, which is what
  separates Inert from Depth-capped.
- For a **Stub** drag: nothing — classified exactly like a Card would be
  (DRAG-2.8), full stop. *(As of Story 5, 2026-09-21. The interim rule
  through Story 4 — every target outside its own parent's Stub list Inert,
  only its siblings Valid — retired here: `dragClassification.ts` no
  longer branches on the dragged item's own attachment at all.)*

**The depth cap reaches the board over the API.** `GET /boards/:id`
carries `itemDepthCap`, the server's `ITEM_DEPTH_CAP`; the client never
hard-codes it, so changing the constant moves both enforcement points
([`../item-attachment/`](../item-attachment/) §8, ATT-4.8).

Settled overlay assignments:

- **Free descendants of the carried item** get the **green** relationship
  overlay — "these are yours," visible on the board while you hold their
  ancestor.
- **Depth-capped targets** are **de-emphasized**, not hidden — "real
  target, not for this item." *As built:* dimmed through
  `overlayDepthCappedOpacity`, a panel value; the final treatment is Story
  8's.

**This replaces the current blanket exclusion of Stubs from Card drags.**
Today a Card drag treats every Stub as a non-target; under these rules each
Stub is classified individually.

The *classification* is settled. The final **visual treatment** — exact
palette, weight, animation — is deliberately deferred to Story 8, so the
cues get tuned against real working gestures rather than guessed at up
front.

## 5. Card → column region: drop bands

**This section is Board layer's own within-action (§1.1) — it governs a
release only while the drag is genuinely popped all the way out, never a
bare hover while still locked somewhere else (§2 rule 1).** A Card held
over a column region, at Board layer, resolves by **vertical band**. Per
§1, the region is the whole column in merged mode and a single sub-row in
expanded mode; the bands are measured against whichever one applies:

| Band | Meaning |
|---|---|
| **Top** (above the top divider) | Position **before the first item** in the column. The ghost renders at the top of the list and the band is tinted. |
| **Bottom** (below the bottom divider) | Position **after the last item** in the column. The ghost renders at the bottom of the list and the band is tinted. |
| **Middle** (between the dividers) | **No position change.** An item from elsewhere takes the column's workphase and keeps the position it already has; the ghost renders wherever that existing position places it in this column's order. An item **already in this column or sub-row** — a covered-set member of the region it is released in (§8) — released here is simply being set back down — nothing is written. In an expanded column the region is the sub-row, so a member of sub-row `W2` released in sub-row `W3`'s middle band is a workphase change to `W3`, not a set-down. *(Wording clarified 2026-09-17.)* |

*(Reworked 2026-09-16, addendum to Story 3 below — this replaces the
original 20/60/20-of-the-rendered-slice model entirely, not just its
numbers. The semantics above — before-first / after-last / no-change — are
unchanged; what changed is where the dividers actually sit.)*

**Bands are pixel carve-outs anchored to the region's real content, never a
fraction of whatever's currently rendered.** Where the dividers sit is
governed by reservation, not a live measurement — and the reservation is
*exact* (Story 4.1 Phase 1): a region's total rendered height never
changes whether or not it's the live hover target. Both drag copies — the
floating DragOverlay and the in-list ghost row — render as a fixed-height
**shortCard** at this layer (§5a), so the geometry below is built from two fixed facts
about that component, never a value found by feel: its height (`h` —
`KanbanCard.tsx::SHORT_CARD_HEIGHT_PX`) and the card lists' own shared gap
(`gap` — `CARD_LIST_GAP_PX`). Three shapes, read off the region's live
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
shortCard (§5a; no longer an approximation, as an earlier draft of this
section had it). Exactly where the line crosses a card is cosmetic; what a
release above or below it means is not.

**Exactly one card in a region halves the edge too** — to `(h + gap) / 2`,
the same as the dead-zone height — instead of the normal full `h`, so the
card stays a real, unlabeled middle band rather than being bisected with
nothing left on either side of the cut (Product Owner special rule,
2026-09-16). This changes only where the *divider line* sits, never the
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
are fixed facts about the card component (§5a), read by both
`dragRegions.ts`'s band math and `BandGuides.tsx`'s carve-out render — the
dividers, both dead-zone heights, and the one-card exception above all
derive from the same two numbers. Neither is a dev/test-panel value; they
left the panel in Story 4.1 Phase 1, along with the retired
`ghostCardHeightPx` (§3.1).

**A band reads the region's live content rect and live card count on
every sample, never one frozen at drag start.** *(Story 3 built a frozen
copy, kept stable against the ghost's own insertion but tracking a real
scroll; the Story 3 follow-up generalized it to also track a sibling
region's own carve-out reflow. Story 4.1 Phase 1 deletes the freeze
entirely — `followRegionTop` and the sticky-hover check it existed for are
gone. The freeze was needed only because the old reservation was
*approximate*: a hovered region's own rendered size genuinely changed
shape as the ghost joined it. The exact-reservation math above rules that
out by construction — the ghost's insertion changes *where* the
reservation currently is, never the region's *total* size — so a live
read on every sample has nothing left to get wrong.)*

**The bands are shown only at Board layer** (`BandGuides.tsx`, added after
Story 3's hands-on, re-scoped in the Story 4 re-plan 2026-09-16): while
genuinely popped out, every column/sub-row draws two subtle dashed lines
at the boundaries, and the one the cursor is in tints the band the cursor
is in — drawn from the same live rect the drop resolves against. The
moment the drag is locked into anything — a column/sub-row *or* a Card —
every guide disappears: there are no bands to cue there (§2), and the
absence of lines says so. Look is provisional (Story 8).

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
name. New as of the 2026-09-16 addendum: previously "done" only changed
what a release *resolved to* (the rule above); now it also changes the
*geometry* a carried card sees while hovering, for the same reason —
there's nothing to place a positioned insert against. Not crucial as
labeled; done/terminal handling gets a fuller rework in Epic 4
([[project_epic4_done_column_rework]]).

## 5a. The dragged card's own visual collapse

**At Board and Column/sub-row layers, both visible copies of a Card being
dragged — the floating DragOverlay copy and the in-list ghost row — render
as shortCard**, a fixed-height compact mode (Story 4.1 Phase 1; named and
settled with the Product Owner 2026-09-17). These are the only layers with
bands (§5), so the carve-out reservation always has shortCard's one exact
height to reserve.

**From the Card layer down — Card and Descendants — both copies are a Stub
row instead**, like the rows the item will be placed among (ruled by the
Product Owner 2026-09-23, reopening Story 5 decision 6; built in Story 6
Phase C). The carried copy switches at the zoom-in from a column into a
Card and switches back at the pop-out to a column; a Stub's own drag starts
at the Descendants layer, so it is a Stub from pickup. It is as wide as a
row in that Card's section, keeps a "held" treatment (a shadow) so it reads
as carried rather than as one of the rows, and stays under the pointer
through the switch in both directions. **Why:** a shortCard held inside a
Card's box covers most of the descendants section, hiding exactly the rows
the user is placing among — and at Descendants layer (§7) the rows are
where a depth is chosen.

shortCard is a Card
*mode*, not a fifth representation tier alongside Stub/Card/Sheet/
Headline — a compact Card on the board is still the board's draggable
unit, and it's built as a presentational body with no knowledge of
dragging, so a later board-density option can reuse it unchanged:

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
both drag copies to one exact height
(`KanbanCard.tsx::SHORT_CARD_HEIGHT_PX`), which is what makes §5's carve-out
reservation *exact* rather than an approximation — earlier drafts of this
section, before Phase 1, described the collapsed height as only
approximately matching the reservation constant; there is no longer a gap
between the two to approximate.

**On drop, the ghost expands back to full height instantaneously** — no
animation yet. Flagged as a likely follow-up if this collapsed treatment
sticks, not decided as final.

## 6. Card → Card: attach

**Dropping a Card onto another Card attaches it as a Stub, inheriting the
new parent's workphase.** As built for Story 4 (narrowed scope, re-plan
2026-09-16): **always as the last child** — no band, no anchor, no choice
of position among the parent's existing Stubs. This is the Card layer's
**auto-drop**, and it has exactly two cases (ruled 2026-09-17):

- an item brought into the Card **from outside** — a Free Card, or a Stub
  detached from another parent — is attached as the **last child**;
- the Card's **own Stub**, popped out of Descendants to the Card layer and
  released there (§8), is **set back down where it was picked up** —
  nothing is written.

Placing an item as some Stub's *first* child is a different gesture — the
manual tabbed-right placement at Descendants layer (§7) — not a variant
of the auto-drop. Any position among the parent's children is Story 6's
Descendants layer, reached only by zooming one layer further in.

This is the headline gesture of the epic. Its consequences — the attach,
the reparent, the workphase inheritance, the `projectId` cascade if the two
cards are in different projects, the legality of a done parent — are all
[`../item-attachment/`](../item-attachment/)'s rules, applied unmodified.

**How this is distinguished from inserting *between* two cards.** The drag
visuals push neighboring cards apart to make room for the ghost, which
reads as "inserting between these two" — the very gesture attaching has to
be told apart from. **The pop threshold is what separates them**, not
geometry: hovering between two cards is a reposition no matter how precise
the aim, and entering a card's context requires the sustained signal of
§1.1 rule 3 (`cardPopInDelayMs`, duration-only). Insertion is the default
because it's the common case; nesting costs a deliberate hold.

This is why §2's "assume reposition" bias and §3.1's "never incidental"
rule carry real weight here — they are the answer to this ambiguity, not
general principles that happen to apply. The remaining work is making the
moment of transition *legible* (Story 8's cue polish), not deciding what it
means.

**Planned — agreed with the Product Owner 2026-09-23, reset rule and cue
decided 2026-09-24; not yet built (Story 6, next): the Card zoomed into
is the one the side highlight names.** As built, the zoom-in target is
whichever Card's box the cursor rests in. But a card under the cursor
also slides aside to open the ghost's gap (§2), so resting on a card meant
both "move out of the way" and "let me in," and the zoom-in clock kept
restarting. The planned rule stops the two competing: cards always just
make room, and what matters is the **named relation** — which neighbor of
the ghost the side highlight names, and on which side (§2, rule 3).
Holding that relation steady is the signal.

**Friction is intended.** Reparenting is the rarer action, so zooming in
takes a deliberate hold. Erring toward too hard is fine — better than
zooming in by accident while repositioning (§2's bias).

- **First a dwell, with nothing new shown** beyond the side highlight
  itself, so an ordinary pause while repositioning stays a reposition.
- **Then a visible cue on the named card, ending in the pop.** Provisional
  look: a dashed outline in the attach-preview blue (the same dashed style
  as the placeholder Stub a Card shows once you're inside it), and a thin
  bar along the card's inside bottom edge filling left to right over the
  cue's length. When the bar is full the pop happens and the locked-layer
  visuals take over: the dashed outline becomes the solid outline (§1.1),
  the card opens with its placeholder Stub, and the carried copy becomes a
  Stub (§5a). The fill says how long to keep holding, and that letting go
  before it's full still just repositions. The full morph (the card
  opening, the placeholder growing, the carried copy shrinking toward it)
  is Story 8's.
- **The cue never moves or resizes anything.** Nothing on screen changes
  shape while it runs, so it can't shift the ghost or change which card is
  named.
- **Both clocks reset whenever the named relation changes**: a different
  card, or the same card on its other side. The same card only changes
  side when the ghost moves past it — always a visible reshuffle — so the
  cue only ever runs while nothing on screen is moving, and a release
  commits the same thing it would have when the cue started. Both also
  reset on a pop-out and on a cancel. *(The PO's first choice, to confirm
  in hands-on. The fallback, if this proves too unforgiving: reset only
  when the named card changes, so a wobble across it keeps the cue
  running — at the cost of the cue running through a reshuffle and a
  release's meaning changing mid-cue with nothing to show it.)*
- **An invalid target never starts the dwell.** A Cycle-forming or
  Depth-capped card (§4) can still be named for a reposition, but it is
  never a zoom-in candidate (§3.2).
- **A release before the pop commits the reposition** (§1.1 rule 1:
  nothing has been entered yet).

Both stages are durations, so §1.1 rule 3 (zooming in is duration-only)
still holds, and both are panel values tuned like every other (§3.1).
The Card's own box keeps its other jobs: bounding the carried copy once
inside, and deciding when the drag pops back out. A ghost alone in its
list names no card, so there is nothing to zoom into from there.

**As built:** the carried card keeps following the cursor while locked
into the target Card's context (bounded to its box, same "clamped, not
frozen" treatment as any other locked context, §2) — it's the *ghost*
(the placement preview among the target's Stubs) that's pinned, always at
the last position, never tracking where inside the card the cursor
happens to be. This is what keeps the moment legible even before Story 8's
cue polish: since the within-action can't change no matter where the
cursor rests, nothing about the preview is left to promise otherwise.

## 7. The Descendants layer: manual hierarchy placement

**§7.1–§7.2's full gap + depth ruleset below is not yet built (Story 6).**
The layer itself is built (Story 5): it's one inside a Card (§1.1), a
Stub's drag *starts* there (§1, §8), and its within-action, until Story 6,
is the interim direct-sibling reorder — a Free Card reaching it by
zooming into the Card and holding over its descendants section is still
Story 6's, since `childRegionAt` never returns one as a zoom-in candidate
yet (decision 3). The full ruleset below is precise placement in the
parent's hierarchy — the same ruleset as the project sidebar,
deliberately, and Story 6 consolidates the two into one shared library.
From the Card layer down **both copies are Stub rows** — the in-list
ghost and the carried copy under the cursor — and the Column ↔ Card
boundary converts both, both ways (§5a, §8, DRAG-5.10). *(The in-list
ghost's switch implemented as of Story 5; the carried copy's as of Story 6
Phase C, 2026-09-23. Story 5 decision 6, ruled 2026-09-21, had kept the
carried copy a shortCard at every layer; the Product Owner reopened it
2026-09-23 after the Phase B hands-on, because the shortCard covered the
rows being placed among.)*

*(Ruled 2026-09-17, replacing the earlier draft of this section entirely.
That draft had a Card-level Stub band — top half "first child," bottom
half "last child," middle "hold to pop into the hierarchy" — and a
three-option placement rule. There is no band: a Card's within-action is
the auto-drop (§6), and placement here is a **range** of depths, not
three fixed options. `stubFirstChildBand`/`stubLastChildBand`/
`stubPopBandStart`/`stubPopBandEnd` were tuning fields in Story 4's
first, retired trial build and no longer exist.)*

### 7.1 Gap and depth

With full context of the hierarchy, the ghost sits in a **gap** between
two rendered items, chosen by vertical position: **Top**, the item it will
sit directly under, and **Bottom**, the item it will sit directly above.
On the board these are **the ghost's two neighbors in the same list
shuffle as a column's** (§2) — the gap is wherever the rows slide aside to
make room, never a which-half-of-a-row reading (Story 6 decision 2,
amended 2026-09-24). The project sidebar draws an indicator line instead
of a ghost, so there the line's position is the gap.
**Horizontal offset** then picks a depth from a range of discrete tab
states — depth counted the way the rest of this wiki counts it, increasing
as you tab **right** (deeper):

> **range = [ Bottom's depth … Top's depth + 1 ]**

- **Top's depth + 1** — tabbed once right of Top: the item becomes
  **Top's first child**. To land anywhere else among Top's children, the
  user anchors against one of those children instead — never directly
  under the parent.
- **Top's depth** — aligned with Top: the item becomes Top's sibling,
  positioned **just after Top** — which means after Top's *entire
  subtree* in render order, since that is where the gap is.
- **Each shallower level**, down to Bottom's depth — tabbed left of Top:
  walk Top's ancestors. One tab left → sibling of Top's parent, just after
  it (after *its* subtree); two tabs left → sibling of Top's grandparent;
  and so on. The shallowest of these, at Bottom's depth, is the same
  placement as "Bottom's sibling, just before it" — the client sends one
  relation, and the result is identical either way.
- **Nothing shallower than Bottom.** That would make the item Bottom's
  ancestor. An item may choose its parent; it may never choose its
  children.

By and large the item is being placed somewhere in Top's hierarchy — as
its child, its next sibling, or the next sibling of one of its ancestors.
Bottom only caps how far left the walk can go.

**Worked example.** With the parent's hierarchy rendered as `S1 › S1a ›
S1a1`, then `S2` at the top level, the gap between `S1a1` (Top, depth 2)
and `S2` (Bottom, depth 0) offers exactly four states: depth 3, child of
`S1a1`; depth 2, after `S1a1` under `S1a`; depth 1, after `S1a` under
`S1`; depth 0, after `S1` — a.k.a. before `S2`. The gap directly beneath
`S1a` (Bottom `S1a1` is Top's own child) offers exactly **one** state:
first child of `S1a`, before `S1a1`. Note that "sibling after `S1a`" is
*not* reached from the gap under `S1a`; it is reached from the gap below
the last item of `S1a`'s subtree, tabbed to `S1a`'s depth.

**Boundaries.**

- **Above the first item** (no Top): one state, at Bottom's depth — the
  first child of the root.
- **Below the last item** (no Bottom): every state from the root's depth
  up to Top's depth + 1. If the last item is nested, that includes a
  sibling placement after each of its ancestors.
- **An empty hierarchy** (no Top, no Bottom): one state — the root's sole
  child. On the board this never arises as a Descendants layer (a
  childless Card has none, §1.1); in the project sidebar it does.
- **Offsets past either end clamp** to the nearest valid state. No offset
  produces "no state."

**The root, per context.** The range is floored at the hierarchy's root:
the project in the sidebar; on the board, the Card `P` whose Descendants
layer this is, so the shallowest level anywhere is *`P`'s own children*.
An item can never be tabbed out of `P` — leaving `P` is a zoom-out (§8),
not a tab state.

### 7.2 What travels with the item, and what's invalid

**The dragged item carries its whole subtree.** The item and its
descendants are removed from the Top/Bottom candidates before any gap is
computed, so no tab state can make an item a child of its own descendant —
a cycle is structurally unreachable, not merely disallowed.

**The depth cap is checked per tab state, against the deepest descendant,
at absolute depth.** A state's resulting depth is `P`'s absolute depth in
the workflow plus the relative depth, plus the dragged subtree's height
([`../item-attachment/`](../item-attachment/) §8). A state that would
exceed `ITEM_DEPTH_CAP` is still reachable — the ghost snaps there with a
visible invalid cue (look TBD, Story 8) — and a release in it **commits
nothing**, the same as setting the item back down where it was picked
up. This is the one exception to §3.2's "never enterable," for the
reason given there. Sibling states in the same gap that do fit stay
valid; validity is per state, never per gap.

**Without full context** — a hierarchy the UI knows is partial — only the
basic anchor+side relation against a visible item is offered; the walk
and the concatenation above depend on knowing nothing is missing between
Top and Bottom. Whether the board ever shows a partial hierarchy is Story
7's question (§9).

## 8. Stub → out: detach

**A Stub can be dragged out of its parent Card.** Its drag starts at its
*containing Card's* Descendants layer (§1, §1.1) — for a grandchild that
is still the Card's whole section, not its parent Stub's sub-list — so
the common case — reordering it among its siblings, or moving it under a
sibling — is the within-action there (§7) and needs no pop at all.
Leaving the Card is a zoom-out, and by §1.1 rule 2 it is **two one-layer
pops** (ruled 2026-09-17):

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

**Implemented as of Story 5 (2026-09-21).** `useBoardDnd.ts::handleDragStart`
routes a Stub drag to `descendantsRegionKey(containingCardId)` instead of
the old `pop: null` bypass; the two pops fall out of `popSession.ts`'s
existing layer-generic pop-out clock, unchanged, once a `descendants`
region carries a real `parentRegionKey`; and `toRequest`
(`boardDndUtils.ts`) sends the detach (`isAttached: false`, `parentId`
untouched) once `placementFor`'s card-list branch previews the item Free.

## 9. Depth overflow

**Not a settled rule as of 2026-09-17 — see Open questions.** An earlier
draft of this section specified a "see X children" placeholder for a Card
whose hierarchy is too deep to list, opening a wider modal on click or on
a held drag-over. Story 7 will decide between that and simply restricting
the hierarchy to the depth the UI has room to display; nothing here is
derivable until it does. Whatever lands, §7's placement rule applies
unchanged inside any surface that shows the hierarchy.

## 10. Optimistic preview, reconciliation, and failure

**The board previews a drop ordinally: the item is placed at the ghost's
index, with no position value invented for it.** The number is the server's
to produce, and the client waits for it without guessing. In a column or
sub-row the saved anchor is always one of the ghost's own neighbors (§2),
so the preview and the write can't disagree about the slot.

This is correct rather than merely close enough — see
[`../item-positioning/`](../item-positioning/) §2, "Client-side role," for
why the rendered order the client draws always matches the rendered
projection of the server's answer, and why that holds even when the anchor's
own value is still in flight.

**A previewed item is marked pending; its `position` is left alone.** It is
specifically *not* set to `null` — null already means "not ordered by
position" (a done item), and would sort the pending item to the top of the
list. Same reference as above.

**On the response**, in this order: apply any reindex collection, assign the
authoritative position, clear the pending marker, then check for inversions
— and re-sort only if one is found. The order matters; see
[`../item-positioning/`](../item-positioning/) §5a.

**An inversion is a tripwire, not routine maintenance.** Given the property
above, a correctly reconciled response should never invert the rendered
order. If one fires, the client and server disagreed about what the drop
meant — worth surfacing, not silently repairing.

**Re-dragging an item whose write is still pending** puts two writes in
flight against one row. Responses must be sequenced per item so a stale one
can't be applied last. A stale response's own row is discarded; if it also
carried reindex pairs, the client resyncs rather than guess whether they
are still current (reconciliation #15, built in the Story 3 follow-up
(2026-09-15) — `ItemWriteTracker.complete` reports `needsResync` alongside
`applied`, and `sendItemMove` reloads the board when it's set). *As built
(Story 3), what the board shows meanwhile:* drag start stashes the item's
current placement — non-null only when a re-drag finds an earlier write of
the same item still outstanding — before the ghost overwrites it;
cancelling, or releasing where nothing is written, restores that stashed
marker instead of clearing outright, when that earlier write is still in
flight (reconciliation #22). A response landing mid-drag of the same item
clears the ghost only for the instant it takes the board to notice: the
same follow-up made that a reactive correction (keyed on the placement
going missing while the item is still the active drag) rather than waiting
for the pop machine's next state change.

**The client never keeps a guess the server rejected.** A failed drop
resyncs the board from the server. §3.2 should make this nearly
unreachable — an invalid target shouldn't have been poppable — so a
rejection arriving at all means the two enforcement points have drifted.

*As of Story 3, the placement the request implies is computed client-side
and applied to render state synchronously on release — before the request
is even sent — so the pre-drop transient described in earlier drafts of
this section ("the board may briefly show its pre-drop order until the
response lands") no longer applies. See the placement-layer description
below.*

*As built (Story 3):* the preview is a **placement** layered over the
position sort — `{ workphaseId?, slot }`, where the slot is `first`, `last`,
`existing` (where the item's kept position already falls), or
`{ anchorId, side }` — the same relation the request carries, so the
picture before and after the response is the same one. **`existing` never
means "no position"** — an item with none to keep (a reopened done item, a
first-time workphase assignment) previews at `last` instead, matching the
append fallback it will actually resolve to (item-positioning §2 addendum,
§7.5; the position-sort's null-coerced-to-zero tie-break would otherwise
draw it at the top, then have it land at the bottom — reconciliation #29,
the mirror of the done-list fix below). **The general rule behind #29
(ruled 2026-09-21, Story 5 decision 5): the preview shows where the write
will actually land the item.** So an item whose kept position is not
*comparable* in the list it's previewing into — a Stub, numbered among
its attached siblings, arriving Free in a column's workflow-wide list
(§8) — likewise rests at `last`, never `existing`, matching the append
fallback a detach without an anchor resolves to; hover displacement moves
it from there exactly as for any Card. *(Implemented as of Story 5,
2026-09-21 — `popSession.ts::noAnchorSlot`, keyed off whether the drag's
own `origin` carries a `parentId`.)* The
placement is the ghost during the drag and the pending marker
(`data-pending`) after release; nothing in the item is touched until the
response. An inversion is recorded in the
dev/test panel's inversion log (kept across board reloads while the board
is open) — the panel is where it surfaces; nothing goes to the console.

**A done list orders a previewed item as the newest completion, not the
oldest.** A card dragged into a done column has no `completedAt` yet; the
comparator (`byCompletedAtThenCreatedAt`) sorts a missing one last, not
first, matching the server's stamp on the write — the mirror of the fix
above, needed because the two lists don't share a comparator.

---

## Open questions

Not settled. **Do not derive test cases from anything in this section.**
Everything *outside* this section is settled and derivable, including the
threshold and band values, which are settled *as tunable parameters* with
provisional values (§3.1).

- **Overlay visual treatment (§4).** Classification is settled; palette,
  weight, and animation are deferred until there are real gestures to tune
  them against. The invalid-tab-state cue of §7.2 belongs to the same
  Story 8 pass.
- **Depth overflow (§9, Story 7).** Whether a too-deep hierarchy gets a
  "see X children" placeholder and modal, or the hierarchy is simply
  capped at what the UI can display. Until decided, the board is assumed
  to show a Card's hierarchy with full context (§7.2).
- **Free-item reparent as a board gesture.** Would add a third drop-meaning
  to disambiguate here. See [`../item-attachment/`](../item-attachment/)
  Open questions.

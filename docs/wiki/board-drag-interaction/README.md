# Board Drag Interaction — Contexts, Popping & Drop Resolution

**Build status:** Rules settled for Epic 3.5; Stories 2–6 build them.
**§4 (target classification) implemented as of Story 2** — computed once
at drag start (`client/src/components/workflow/dragClassification.ts`),
shown as a `data-drop-state` attribute plus provisional overlays on every
Card and Stub. **§1–§3 (contexts, popping), §5 (column bands) and §10
(ordinal preview, reconciliation, per-item sequencing) implemented as of
Story 3** — the pop machine is `workflow/popSession.ts`, the regions
`workflow/dragRegions.ts`, the placement layer `workflow/itemListOps.ts`,
and every threshold and band is a dev/test-panel value
(`workflow/dragTuning.ts`, toolbar → "Drag tuning"). A Card's context is
its column region (or sub-row); a *Card* is not yet a context to pop into
— §6 (attach), §7 (Stub bands) and §8 (detach) are Stories 4–6, and
dragging a Stub out of its parent stays held closed pending Story 5.

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
- **A Card** — the context for its Stubs (its attached descendants).

**A region is a bounded box.** Only the box counts — not the column's
horizontal stripe above or below it. A column's header and footer, the
board toolbar, the gap between columns, the gaps between sub-rows and the
space below the last one are **nowhere**: no region, no context. A region
is also clipped to what is visible — a sub-row scrolled out of its column's
view is not a region until it scrolls back in; you can only be in what you
can see. Resting nowhere pops the card out (§3); releasing nowhere writes
nothing (§5). A Card's region (§6, Story 4) is the same kind of box,
hit-tested before the column that contains it — one rule for every region.
*(Ruled 2026-09-15, reconciliation #20; built in the Story 3 follow-up
(2026-09-15) — `dragRegions.ts::regionAt` is now simple containment, and a
sub-row is clipped to its column's visible scroll box in
`measureDragRegions`. Story 3 as built had used the column's full
horizontal stripe with a nearest-sub-row fallback.)*

Every drag starts inside exactly one, determined by what the item already
is and how its column is currently displayed — except a drag picked up
from Unsorted, which starts popped out with no context (§3). Nothing about
the drag's start is a user choice.

**Why the sub-row and not the column, in expanded mode:** an expanded
column exists precisely to make each workphase individually targetable. If
the whole column were the context, moving between its sub-rows would be a
free in-context reposition — and the workphase distinction the display mode
was configured to expose would carry no weight during a drag, which is the
one moment it most needs to.

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
    context spans the column's full height, so the only way out is
    sideways, and the card moves freely up and down within it.
  - In an **expanded** column the sub-row bounds the card **vertically as
    well**. Drifting toward the sub-row above or below is held exactly the
    way drifting toward the next column is, and crossing it is a pop.
- A **ghost** shows the slot it would land in, and a **side highlight** on
  a neighboring item shows which item it is anchoring to and on which side.

## 3. Popping

**The cursor, not the card, decides whether the context holds.** Because
the card is axis-locked, the cursor can leave the context while the card
cannot follow. Popping is two-way, and each way takes its own sustained
signal (§3.1):

- **Pop out.** When the cursor has stayed *outside* the card's context —
  anywhere: another column, the gap between columns, Unsorted — past the
  pop-out threshold, the item pops out: it **snaps to the cursor and
  follows it freely**, belonging to no context. *As built:* a short tween
  (`popSnapMs`, a panel value; 0 teleports) from where the card was
  clamped to the cursor, chasing the cursor if it moves meanwhile.
- **Pop in.** A popped-out item enters a context when the cursor has
  stayed in that context's *region* past the pop-in threshold and is in
  the middle band (§5) when the clock runs out — any column, **including
  the one it just left**. The clock counts time in the region, not in the
  band: time spent in the top or bottom band counts, and sliding into the
  middle band after it pops in at once. The item is now positioned within
  that context under its rules **and bounded by it**, exactly as it was
  bounded by the origin.

A release while popped out still resolves by whatever is under the cursor:
a column's band (§5), or nothing at all between columns. **The two paths
are two intents.** Staying in a region long enough says "I want *into* this
column's context, to choose the position myself" (or, once §6 lands, to go
on into a card's context). The bands are three quick auto-placements — top,
bottom, or just "move it here" — for when the column change is what
matters and the exact position isn't. Popping in is only needed to reach a
column's *in-context* placement (anchor + side).

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

*As built (Story 3), ratified 2026-09-15:* two clocks — the **model** is
settled (pop out, then pop in; a cross-column in-context placement costs
both, back to back); **neither value is**. Both are being tuned by feel,
with no target settle time committed. **Pop-out** — starts the moment the
cursor leaves the context (wherever it goes), resets when it comes back;
fires once `popDelayMs` has elapsed **or** — when `popDistancePx` is
non-zero — once the cursor is at least that far outside the context's rect
(either satisfies; distance ships disabled). **Pop-in** — starts when a
popped-out card's cursor enters a region (or at the pop-out itself, if the
cursor is already in one), so the popped-out state always lasts at least
`popInDelayMs`; fires from the middle band only. The cursor's region is
the bounded box of §1 — outside every box, over Unsorted or a broken
column, the cursor is nowhere and a release there writes nothing. *(Story 3
as built decided the region by the column's horizontal extent instead, so a
drag only left a region sideways; superseded by §1's rule in the Story 3
follow-up (2026-09-15).)*

**The dev/test panel exposing every threshold is a required deliverable of
this feature, not a debugging convenience.** The correct value can only be
found by feel, and feel can only be compared by changing one number between
two attempts without a rebuild. The panel also exposes the band boundaries
of §5 and §7.1 and the overlay colors of §4. *As built:* the panel's
values persist in `localStorage` under `kanban_drag_tuning` — `popDelayMs`,
`popDistancePx`, `popInDelayMs`, `popSnapMs`, `columnTopBand`,
`columnBottomBand`, `stubFirstChildBand`,
`stubLastChildBand`, `stubPopBandStart`, `stubPopBandEnd`,
`overlayFreeDescendantColor`, `overlayDepthCappedOpacity` — and tests seed
that key, so every case runs against the configured value. The panel is a
tuning-phase tool for the humans doing the tuning: where it lives and who
sees it is deliberately not specified here, and it is retired once the
values lock and become constants.

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
- For a **Stub** drag, *until Story 5 opens the detach direction*: every
  target outside its own parent's Stub list. Its siblings are Valid
  (reposition targets); the parent Card, other Cards, and other Cards'
  Stubs are Inert. Story 5 replaces this interim rule with the full
  classification.

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

A Card held over a column region resolves by **vertical band**. Per §1, the
region is the whole column in merged mode and a single sub-row in expanded
mode; the bands are measured against whichever one applies:

| Band | Meaning |
|---|---|
| **Top 20%** | Position **before the first item** in the column. The ghost renders at the top of the list and the band is tinted (below). |
| **Bottom 20%** | Position **after the last item** in the column. The ghost renders at the bottom of the list and the band is tinted. |
| **Middle 60%** | **No position change.** An item from elsewhere takes the column's workphase and keeps the position it already has; the ghost renders wherever that existing position places it in this column's order. An item **already in this column** (a covered-set member, §8) released here is simply being set back down — nothing is written. |

**The middle band is also the pop-eligible zone.** Holding there pops the
Card into the column — out of its old context first, then in (§3: two
thresholds, run back to back when the cursor simply rests) — after which
it is positioned by ordinary anchor+side hovering rather than by band.
Releasing without holding, or after popping out but before popping in,
commits the band's meaning.

**Band boundaries are dev/test-panel values**, same as the pop threshold —
20/60/20 is a starting point to tune, not a settled constant.

**A band is measured against the region's rect as it was when the cursor
entered it**, for as long as the cursor stays. The ghost's own insertion
grows the hovered list — and in an expanded column moves the sub-rows
below it — so measuring against the live rect would let the drop change
the band it is about to be resolved by. **The freeze is against the
ghost's insertion only: the frozen rect follows scroll.** It is held in
scroll-content coordinates and translated by the live scroll offset, so
auto-scrolling a long column moves the band with the sub-row it belongs
to rather than leaving it behind. *(Frozen rect settled in Story 3;
scroll-following ruled 2026-09-15, reconciliation #20/#21, built in the
Story 3 follow-up (2026-09-15) — `popSession.ts`'s `PopHover` carries the
region's scroll offset alongside the frozen rect and translates the rect
by the change in it each sample, so a real scroll carries the band with it
while the ghost's own insertion still can't move it.)*

**The bands are shown while a Card is carried** (`BandGuides.tsx`, added
after Story 3's hands-on): every region the card doesn't currently belong
to draws two subtle dashed lines at the boundaries, and the region the
cursor is in tints the band the cursor is in — drawn from the same frozen
rect the drop resolves against. The card's own context draws nothing:
in-context there are no bands, and the absence of lines says so. Look is
provisional (Story 8).

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

## 6. Card → Card: attach

**Dropping a Card onto another Card attaches it as a Stub at the dropped
slot, inheriting the new parent's workphase.**

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
§3.1. Insertion is the default because it's the common case; nesting costs
a deliberate hold.

This is why §2's "assume reposition" bias and §3.1's "never incidental"
rule carry real weight here — they are the answer to this ambiguity, not
general principles that happen to apply. The remaining work is making the
moment of transition *legible* (Story 8's cue polish), not deciding what it
means.

## 7. Stub drop bands and hierarchy placement

### 7.1 Bands, when dropping onto a Card as a child

| Band | Meaning |
|---|---|
| **Top 50%** | Place as the **first child**. |
| **Bottom 50%** | Place as the **last child**. |
| **Middle 60%** (i.e. 20%–80%), held past the threshold | **Pop** into the full hierarchy context, where §7.2's three-way ruleset applies. |

**These bands overlap on purpose.** The 20–50% and 50–80% regions are
simultaneously quick-drop regions and pop-eligible regions. **The overlap
is resolved by time, not by geometry:** release immediately and the
quick-drop meaning commits; hold and it pops into precise placement.

This is the same shape as the column's middle band (§5) — a coarse default
that's instantly available, with precision reachable by waiting. A user who
knows where they want it doesn't have to aim; a user who needs precision
doesn't have to give up.

**These boundaries are dev/test-panel values too.** 50/50 and the 60%
overlap are starting points to tune alongside the pop threshold, not
settled constants.

### 7.2 Three-way placement inside a hierarchy

Once popped into a hierarchy context, placement uses the **same ruleset as
the project sidebar**, deliberately — it's an interaction users already
know from that tree:

1. **Above an anchor** → sibling; inherits the anchor's parent.
2. **Below an anchor** → sibling; inherits the anchor's parent.
3. **Below an anchor, indented right** → **child of** the anchor.

Options 2 and 3 occupy the same vertical position and are distinguished by
**horizontal cursor offset**, exactly as in the sidebar.

## 8. Stub → out: detach

**A Stub can be dragged out of its parent Card.** Popping out of the parent
context makes the item Free; it lands where it is dropped and is positioned
by whatever context received it.

Its relationship to its former parent is **preserved** — detaching is not
un-parenting. The exception is landing inside a different parent's context,
which is a reparent. See [`../item-attachment/`](../item-attachment/) §11.

**Detaching in place keeps the inherited workphase.** A Stub's workphase is
already its parent's, so it is already a member of the covered set of the
column the parent sits in — which makes a drop there a position-only
reorder with `workphaseId` untouched, by the existing covered-set rule in
[`../item-positioning/`](../item-positioning/) §4. §5's "takes the first
workphase in the range" applies only to a drop into a column the item
wasn't already in. This matters for a parent sitting in a *non-entry*
workphase of a merged column: detaching its child in place must not
silently walk that child back to the entry workphase.

This direction is currently held closed in the board's drag layer; this
epic opens it.

## 9. Depth overflow: "See X children"

A Card whose descendant hierarchy is too deep to list shows a placeholder —
**"see X children"** — in place of the remaining Stubs.

- **Clicking it** opens a wider modal showing the full hierarchy.
- **Dragging a Stub over it** and holding past a threshold opens the same
  modal mid-drag, so a drag can reach into the overflow without being
  restarted.
- Inside the modal, §7.2's placement ruleset applies unchanged.

## 10. Optimistic preview, reconciliation, and failure

**The board previews a drop ordinally: the item is placed at the ghost's
index, with no position value invented for it.** The number is the server's
to produce, and the client waits for it without guessing.

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
position sort — `{ list, slot }`, where the slot is `first`, `last`,
`existing` (where the item's kept position already falls), or
`{ anchorId, side }` — the same relation the request carries, so the
picture before and after the response is the same one. **`existing` never
means "no position"** — an item with none to keep (a reopened done item, a
first-time workphase assignment) previews at `last` instead, matching the
append fallback it will actually resolve to (item-positioning §2 addendum,
§7.5; the position-sort's null-coerced-to-zero tie-break would otherwise
draw it at the top, then have it land at the bottom — reconciliation #29,
the mirror of the done-list fix below). The placement is the ghost during
the drag and the pending marker (`data-pending`) after release; nothing in
the item is touched until the response. An inversion is recorded in the
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
  them against.
- **Free-item reparent as a board gesture.** Would add a third drop-meaning
  to disambiguate here. See [`../item-attachment/`](../item-attachment/)
  Open questions.

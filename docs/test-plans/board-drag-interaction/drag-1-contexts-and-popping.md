# DRAG-1 — Contexts, the reposition default, and popping

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §1, §2, §3

**Suite ID:** `DRAG-1`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-1.n`.

**What's in scope here.** Per the wiki's own note, only drop *resolution*
is catalogued — given a release at this place, after this cursor
behavior, what change is committed. The tilt, the axis-lock feel, the
pop-snap tween, the ghost/highlight rendering, and whether the pop *reads*
right are manual-verification by design and have no cases.

**Parameterization.** Popping is two-way with a clock each (§3.1, model
ratified 2026-09-15; neither value is settled):

- `POP_OUT` — the pop-out clock. Starts the moment the cursor leaves the
  card's context (wherever it goes), resets when the cursor comes back;
  fires once `POP_OUT` has elapsed. When `POP_OUT_DISTANCE` is non-zero it
  *also* fires once the cursor is at least that far outside the context's
  rect — either satisfies. Distance ships disabled (`0`).
- `POP_IN` — the pop-in clock. Starts when a popped-out card's cursor
  enters a region (or at the pop-out itself, if the cursor is already in
  one); fires only if the cursor is in the region's middle band
  ([DRAG-3](drag-3-card-column-bands.md)) when it runs out.

"Sustained" means the cursor rests continuously for at least the clock
named; "momentary" means it leaves before. Cases are written against the
names, never the provisional literals.

**Region vocabulary.** A *region* is the bounded box of a context (§1): a
merged column's list box, an expanded column's individual sub-row, or (from
Story 4) a Card. Everything else — a column's header and footer, the board
toolbar, the gap between columns, the gaps between sub-rows and the space
below the last one, Unsorted, a broken column — is **nowhere**.

**Automation split (§3.1 ruling, 2026-09-15).** Automated tests assert
*reachability* — that it is possible to pop out, pop in, place in a column
— and the correctness of the resulting write. A case whose pass depends on
a threshold value ("move here, wait this long, expect that") stays in the
manual plan until the values lock, and may stay manual even then. Cases of
that kind carry an **Automation note** below their Given/When/Then; the
Automated column is still the Test Reconciler's to set.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A drag starts in exactly one context, determined by the item and the column's display mode | P0 | ⏳ pending triage |
| TC-2 | In-context release is a reposition: anchor+side, workphase and parent unchanged | P0 | ⏳ pending triage |
| TC-3 | A sustained cursor signal outside the context pops out; a momentary one does not | P0 | ⏳ pending triage |
| TC-4 | Brushing past a Card while reordering never attaches | P0 | ⏳ pending triage |
| TC-5 | After a pop in, placement follows the new context's rules | P0 | ⏳ pending triage |
| TC-6 | Expanded mode: a sibling sub-row is a different context | P0 | ⏳ pending triage |
| TC-7 | A cycle-forming target is never poppable | P0 | ⏳ pending triage |
| TC-8 | A depth-capped target is never poppable | P0 | ⏳ pending triage |
| TC-9 | Nowhere is no region: resting there pops out, releasing there writes nothing | P0 | ⏳ pending triage |
| TC-10 | A region is clipped to what is visible | P1 | ⏳ pending triage |
| TC-11 | The pop-in clock counts time in the region and fires from the middle band | P1 | ⏳ pending triage |
| TC-12 | A popped-out card can pop back into the column it just left | P1 | ⏳ pending triage |
| TC-13 | A drag picked up from Unsorted starts popped out, with no context | P1 | ⏳ pending triage |
| TC-14 | Pop-out by distance: when enabled, either clock or distance satisfies | P2 | ⏳ pending triage |
| TC-15 | A Card's region is hit-tested before the column that contains it | P1 | ⏳ pending triage |

---

## TC-1 — A drag starts in exactly one context, determined by the item and the column's display mode

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* each of the following, *when* a drag begins, *then* the drag's
starting context is:

- a Free item (Card) in a **merged** column → the column's **list box**
  (its body — not the header or footer);
- a Free item (Card) in an **expanded** column → the individual sub-row
  the item is rendered in, not the column;
- an Attached item (Stub) → its parent Card.

The context is determined entirely by what the item already is and how
its column is currently displayed; no input from the user selects it. The
one exception is a drag picked up from Unsorted, which starts with no
context at all (TC-13).

**Automation test:** —

## TC-2 — In-context release is a reposition: anchor+side, workphase and parent unchanged

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card in a merged column rendering `A, B, C` with the Card
being `C`, *when* the user drags `C` and releases with the cursor still
within the column's list box, hovering the lower half of `A`, *then* the
committed change is a reposition: `{anchorId: A, side: after}`,
`workphaseId` unchanged, `parentId` and attachment unchanged. Likewise for
a Stub released within its parent Card among its siblings — a sibling
reorder ([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md)),
parent unchanged.

The default assumption is reposition until the user demonstrates
otherwise.

**Automation test:** —

## TC-3 — A sustained cursor signal outside the context pops out; a momentary one does not

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card being dragged within its column context, *when* the cursor
leaves the context — into another region, or into nowhere (TC-9) — and
stays out continuously for ≥ `POP_OUT`, *then* the item pops **out**: it
belongs to no context and follows the cursor freely. It does not yet
belong to whatever region the cursor is in; entering one is a separate
act (TC-5, TC-11).

*And given* the same setup, *when* the cursor leaves the context but
returns before `POP_OUT` elapses, *then* no pop occurs, the pop-out clock
resets, and the drag is still in its original context — a release then
is an in-context reposition (TC-2).

Leaving and entering are separate, deliberate acts, and the popped-out
state between them is a real place to be: a release while popped out
resolves by whatever is under the cursor — a column's band
([DRAG-3.3](drag-3-card-column-bands.md)) or nothing at all (TC-9).

Assert *that* a sustained signal pops and a momentary one doesn't,
parameterized on `POP_OUT` — never on the provisional literal. The same
holds for whichever refinement the tuning settles on (TC-14's distance
term, either-of, or a combined function): the case is about the boundary
the parameter defines.

**Automation note:** the "pops out" half is reachability and automatable;
the "momentary does not" half is threshold-timed and stays manual until
the values lock.

**Automation test:** —

## TC-4 — Brushing past a Card while reordering never attaches

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` being reordered within its column past neighboring
Cards `A` and `B`, *when* the cursor's path crosses `A`'s and `B`'s
regions (each for less than `POP_OUT`, so `X` never leaves its context)
and the user releases between `A` and `B`, *then* the committed change is
a reposition — `X` anchored against `A` or `B` — and `X.parentId` is
unchanged. Popping is never incidental; hovering between two cards is a
reposition no matter how precise the aim.

**Automation test:** —

## TC-5 — After a pop in, placement follows the new context's rules

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a popped-out Card that has popped into another Card `Q`'s context
(Story 4), *when* the cursor then hovers among `Q`'s Stubs and releases,
*then* the commit is an anchor+side placement among `Q`'s attached
children ([DRAG-4.8–4.10](drag-4-attach-and-stub-placement.md)) — not a
column-band resolution. *And given* a popped-out Card that has popped into
a different column region's context (by staying in the region ≥ `POP_IN`
with the cursor in its middle band —
[DRAG-3.4](drag-3-card-column-bands.md)), *when* it is released hovering a
specific card there, *then* the commit is anchor+side against that card —
not the band it happens to be in. The item is now bounded by the new
context exactly as it was by the origin.

The two paths are two intents: staying in a region long enough says "I
want *into* this context, to choose the position myself"; the bands
([DRAG-3](drag-3-card-column-bands.md)) are quick auto-placements for when
the column change is what matters and the exact position isn't.

**Automation test:** —

## TC-6 — Expanded mode: a sibling sub-row is a different context

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an expanded column with sub-rows for `W1` and `W2` and a Card
starting in the `W1` sub-row, *when* the cursor moves into the `W2`
sub-row and releases without holding, *then* the commit is the `W2`
sub-row's band meaning ([DRAG-3.8](drag-3-card-column-bands.md)) — a
genuine workphase change to exactly `W2` — never an in-context
reposition that happens to have crossed a line. *And when* the cursor
rests in the `W2` sub-row for ≥ `POP_OUT` and then ≥ `POP_IN` in its
middle band, *then* it pops out of `W1` and into the `W2` sub-row context
and is then positioned there by anchor+side (TC-5).

Sibling sub-rows of one column are separate contexts; moving between them
is a context change like any other. The gap between the two sub-rows is
nowhere (TC-9).

**Automation test:** —

## TC-7 — A cycle-forming target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with descendant `D` (attached or detached) also visible
on the board, *when* `X` is dragged and the cursor rests over `D` — or
over `X`'s own region — for well past `POP_OUT` + `POP_IN`, *then* no pop
into `D` occurs, no attach is offered, and a release there commits nothing
that reparents `X`. Validity is decided before the affordance is offered,
using the same rule the API enforces
([ATT-4.2/4.3](../item-attachment/att-4-legal-parent-depth-cap.md)).
The user never watches the item settle and bounce back.

**Automation test:** —

## TC-8 — A depth-capped target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with subtree height `h` and a target Card `T` at depth
`D` with `D + 1 + h > CAP` (parameterized on `CAP`, see
[ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)), *when*
`X` is dragged and the cursor rests over `T` for well past `POP_OUT` +
`POP_IN`, *then* no pop into `T` occurs and no attach is offered. `T`
remains a legitimate target for *other* drags whose subtree fits.

**Automation test:** —

## TC-9 — Nowhere is no region: resting there pops out, releasing there writes nothing

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card being dragged, *when* the cursor is over any of the
following, *then* it is in no region and no context:

- the column's own header or footer (the stripe above or below the list
  box — the box alone counts);
- the board toolbar;
- the gap between two columns;
- in an expanded column, the gap between two sub-rows, or the space below
  the last sub-row;
- the Unsorted bucket;
- a broken column.

*When* the cursor rests in any of these for ≥ `POP_OUT`, *then* the card
pops out (TC-3). *When* the user releases in any of these — whether still
in-context, or popped out — *then* **nothing is written**: no request is
made, the item's `workphaseId`, `position`, `parentId` and attachment are
all unchanged, and it is rendered back where it started.

*(Ruled 2026-09-15. Story 3 as built decided the region by the column's
full horizontal stripe with a nearest-sub-row fallback; the box rule
supersedes it.)*

**Automation test:** —

## TC-10 — A region is clipped to what is visible

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an expanded column whose sub-rows overflow its viewport, with
sub-row `W3` scrolled out of view, *when* a popped-out Card's cursor is
where `W3`'s box *would* be, *then* the cursor is nowhere (TC-9): the
pop-in clock does not start, and a release writes nothing. *When* the
column scrolls so that `W3` comes into view under the cursor, *then* `W3`
is a region from that moment — the pop-in clock starts, and a release
resolves by `W3`'s band. You can only be in what you can see.

**Automation test:** —

## TC-11 — The pop-in clock counts time in the region and fires from the middle band

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a popped-out Card whose cursor enters column region `R`'s
`TOP_BAND` ([DRAG-3](drag-3-card-column-bands.md)):

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
cursor leaves `C`'s list box for ≥ `POP_OUT` (pop out), returns into `C`'s
middle band, and stays ≥ `POP_IN` (pop in — any column, including the one
it just left), and the user then releases hovering the upper half of `A`,
*then* the commit is a reposition `{anchorId: A, side: before}` with
`workphaseId`, `parentId` and attachment unchanged — the same result an
uninterrupted in-context reorder would give.

*And when* instead the user releases in `C`'s middle band after popping
out but before popping in, *then* nothing is written — `X` is already a
member of `C`'s covered set and is simply being set back down
([DRAG-3.12](drag-3-card-column-bands.md)).

**Automation test:** —

## TC-13 — A drag picked up from Unsorted starts popped out, with no context

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an item in the Unsorted bucket (drag-source only), *when* it is
picked up, *then* the drag begins popped out: no context, no bounding, the
card follows the cursor freely from the first movement, and no pop-out
clock is involved. From there:

- a release over Unsorted, or anywhere else that is nowhere (TC-9), writes
  nothing;
- a release in a column region's band commits that band's meaning
  ([DRAG-3.1–3.3](drag-3-card-column-bands.md)), including the workphase
  change into that column;
- resting in a region ≥ `POP_IN` in its middle band pops the item in
  (TC-11), after which placement is in-context (TC-5).

**Automation test:** —

## TC-14 — Pop-out by distance: when enabled, either clock or distance satisfies

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* `POP_OUT_DISTANCE` set to a non-zero value, *when* the cursor
moves at least that far outside the context's rect before `POP_OUT` has
elapsed, *then* the card pops out immediately — either signal satisfies.
*And given* `POP_OUT_DISTANCE` set to `0` (its shipped value), *when* the
cursor moves any distance outside the context in less than `POP_OUT`,
*then* no pop occurs — distance is disabled and only the clock decides.

**Automation note:** threshold-timed — stays manual until the values lock
(§3.1 ruling, 2026-09-15).

**Automation test:** —

## TC-15 — A Card's region is hit-tested before the column that contains it

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a popped-out Card `X` and a Valid target Card `Q` rendered inside
column region `R`, *when* the cursor is inside `Q`'s box, *then* the
region the cursor is in is `Q`'s — not `R`'s — for every purpose that
depends on it: the pop-in clock runs toward `Q`'s context
([DRAG-4.1](drag-4-attach-and-stub-placement.md)), not `R`'s, and a
release resolves by `Q`'s bands ([DRAG-4.6](drag-4-attach-and-stub-placement.md)),
not `R`'s. *When* the cursor is inside `R`'s box but over no Card, *then*
the region is `R`. One rule for every region: a Card's box is the same
kind of bounded box as a column's, tested first.

*(Card regions arrive with Story 4; until then the cursor over a Card is
in the containing column's region.)*

**Automation test:** —

# Item Positioning & Board-Scoped Ordering

**Test suite:** [`../../test-plans/item-positioning/`](../../test-plans/item-positioning/)

**Related:** [`../item-attachment/`](../item-attachment/) (what a legal
parent is, and what attaching means) · [`../board-drag-interaction/`](../board-drag-interaction/)
(the board gesture that produces these placements)

---

## 1. Position is a single item-owned scalar

An item's `position` is one nullable number — not a per-board value.
Boards read it; they never own their own copy. This is the same kind of
fact as the item's `workphaseId` (its current state), just a second axis
of it.

## 2. Position resolution: anchor + side

Writes that change position don't send a client-computed final number.
The client sends **relative intent** — insert this item immediately
`before`/`after` a specific other item, by id (the "anchor") — and the
server resolves the actual number against that item's **true current**
neighbor (a fresh query, never a client-supplied value), inside the same
transaction as the write.

**Planned:** the API takes no final position from any caller. A move that
names a `position` is refused with a 400 whose message says to name an
anchor and side instead, and no endpoint sets positions outright.

**Why:** a client's local view of neighbors can be narrower than the true
full order (e.g. a subproject board that doesn't load a parent project's
full item set). Resolving locally from a narrow view can silently leapfrog
an item past a true neighbor the acting view never saw. Resolving against
a fresh authoritative query, always, closes this for every comparison
scope (attached-sibling list, merged-column union) at once.

**Comparison scope.** A detached/root item's position is comparable against
every other active item in its **whole workflow**, not just its own
workphase — a workphase boundary alone was never a meaningful place to stop
comparing positions (two items in different workphases of the same workflow
still need to sort/collide cleanly — a merged column, a reindex, or a plain
append into a workphase that merely happens to be empty right now would
otherwise risk colliding or misordering against items elsewhere in the same
workflow). Attached children stay parent-scoped, `(parentId, isAttached)`
(§3) — narrower than workflow, and untouched by this. There is no scope
narrower than "the whole workflow" for a detached/root item — in particular
a merged column's covered workphaseIds is **not** a position-comparison
boundary, just a rendering filter (§4).

**Resolution steps, in order:**

1. Query the anchor's true current position.
2. Look for a true bounding neighbor beyond the anchor in the requested
   direction, against the full authoritative table — never limited to
   what the requesting view currently has loaded or displayed, and never
   narrower than the comparison scope above. The check is always "does a
   true neighbor exist," never "is one visible here."
3. If a true bounding neighbor exists: **coarsest-fit insert** between the
   anchor and that neighbor (below).
4. If none exists (the anchor is the true last item for side `after`, or
   true first item for side `before`): degrade to the **append fallback**
   (below).
5. Pure creation with no anchor resolves the same way, treating the target
   scope's true last item as an implicit anchor — or the **bootstrap
   fallback** if the scope is empty.

**Coarsest-fit rounding** (step 3): don't take the raw arithmetic midpoint
— search increasing decimal precision (0 places, then 1, then 2, …),
rounding the exact midpoint at each level, and take the first result that
falls strictly between the two neighbors. Example: between 1.5 and 2.0,
the raw midpoint is 1.75, but 1.8 already fits (1 decimal), so use 1.8.

**Append fallback** (step 4): `round(anchor.position + 1.0)` for `after`
with no true successor. For `before` with no true predecessor, **not** a
symmetric `round(anchor.position - 1.0)` — instead a coarsest-fit insert
between `0.0` (a virtual floor) and the anchor's position. This keeps a
repeatedly-prepended item's position bounded above zero instead of
drifting negative without limit, which would otherwise collide with the
tie-break's treatment of a missing position as 0 when sorting alongside
unpositioned items (§5a). A workphaseId-only move with no anchor at all
(dropping an item into a different workphase, no specific target card)
does **not** go through this path — see the workphase-only rule below. Item creation with no explicit
position, and a same-workphase reorder/append with no specific target card,
both still do.

**Bootstrap fallback** (step 5, scope is completely empty): start at `1.0`.
Because scope is workflow-wide (never workphase-narrow — see above), this
only fires when the *whole workflow* has no positioned items yet, or a
parent has no children yet — never merely because one particular workphase
is currently empty while others in the same workflow aren't. Why not a
rank-aware bootstrap, anchoring an empty workphase to its nearest
non-empty neighbor by rank: it would only matter if two independently
empty *workphases* could collide at `1.0`, and with a workflow-wide scope
they can't.

**A workphaseId-only move with no anchor keeps the item's existing
position, unchanged** — a distinct, deliberate exception to steps 4/5
above. Since position is workflow-scoped, an item's existing value is
already comparable against everything else in its workflow; changing its
workphaseId alone doesn't make that value stop being meaningful, so there's
no need to compute a new one. (This is also the shape the MCP `move_item`
tool already sends — `{workphaseId}` alone.) The one exception: if the item
has no existing position to keep — reopening a done item, or a first-time
workphase assignment — it still needs a fresh one via the append fallback,
same as creation.

**Tight-gap reindex trigger:** if the coarsest-fit search exhausts a max
decimal depth with nothing fitting, that's precision exhaustion — reindex
the relevant local comparison scope first (§5), then retry the insert.

**`positionScope` (computed, read-only API field):** alongside the
existing `position: number | null` (unchanged shape), a derived field —
`"attached-siblings"` (item is attached, has a `parentId`),
`"workflow"` (detached/root, non-terminal workphase — comparable against
the whole workflow, see above), or `"none"` (not currently ordered — either
a detached/root item in a terminal/done workphase, see §6, or one with no
`workphaseId` at all, e.g. its workphase was deleted out from under it and
its `workphaseId` was cleared). Both land on the same value because neither
has a meaningful comparison scope, even though the reason differs (ordered-
by-`completedAt` vs. not ordered at all). Computed whenever the item is
read, never stored. Tells a client (or a human reading the API) what an
item's `position` is actually comparable against.

**Planned:** a detached/root item whose workphase belongs to a workflow
its project doesn't use is `"none"` as well: it shows in Unsorted, where
its position compares against nothing (§7.3). Replaces the `"workflow"`
case's "detached/root, non-terminal workphase" for such an item.

**Client-side role: the client never computes a position value, not even
for display.** Optimistic feedback is **ordinal** — the item is shown at an
index in the rendered list — and the number arrives from the server.

Why not compute a number for display only: a plausible-but-wrong number
held in client state is a number something will eventually be tempted to
send, and it buys nothing (see below).

**Why ordinal is sufficient, and why it's correct rather than approximate:**
the server places an item strictly between its anchor and that anchor's
true neighbor in the requested direction. Anything occupying that gap is,
by definition, not in the requesting view — otherwise it would have been
the anchor's visible neighbor. So the item always lands adjacent to its
anchor on the requested side *within the rendered set*, whatever number it
receives and whatever unseen items sit around it. The rendered projection
of the server's answer is exactly what the client already drew.

Worked through: rendered `A, C, E`, with true order `A, B, C, D, E`.
Requesting `after A` resolves between A and B → renders `A, X, C, E`.
Requesting `before C` resolves between B and C → renders `A, X, C, E`. Same
picture, and it's the one the client predicted.

The flip side: the two relations are the same *rendered* slot but not the
same *true* slot, so the choice of anchor is never cosmetic. With the same
view, dragging `C` and setting it back down where it was saves "after A"
(landing between A and B) if the carried card leans up, or "before E"
(landing between D and E) if it leans down
([`../board-drag-interaction/`](../board-drag-interaction/) §2). Both
render `A, C, E`, but `C` has moved relative to the unseen `B` and `D` —
which is why a set-down with a neighbor to name is a real write, not a
no-op.

This holds under stacked operations too — an item may be positioned against
an anchor whose own value is still in flight, because the ordinal
relationship doesn't depend on either number.

**A pending item must not be represented as `position: null`.** Null is
already load-bearing: it means "not ordered by position" — a done item
ordered by `completedAt` (§6), or an item with no workphase at all — and
the tie-break (§5a) counts it as `0`, sorting nulls to the *front*. A
pending item marked null would be indistinguishable from a done one and
would jump to the top of the list the moment anything re-sorted. Pending
needs its own marker; `position` stays untouched until the real value
lands.

Reconciliation on the response, and what to do when a reindex fires: §5a.

### 2.1 Scope-change reassignment principle

Assign a fresh position via the append fallback exactly when an operation
changes an item's *relevant comparison scope* without an explicit anchor —
never when the scope is unchanged:

| Operation | Scope change? | Result |
|---|---|---|
| Attach ↔ detach toggle | Yes (parent-scoped ↔ workflow-scoped) | Fresh position |
| Reparent while staying attached | Yes (old parent's siblings → new parent's) | Fresh position |
| A parent's workphase change cascading to its attached descendants | No (still parent-scoped regardless of workphaseId) | Position untouched |
| Workphase change, no anchor | No (workflow-scoped either way) | Position kept (§2's workphase-only rule) |
| Cross-workflow reparent, for each subtree item keeping its own workphase (§7.3) | Yes (old workflow's scope → none) | Position nulled; re-filing later assigns a fresh one via the no-position path. *Replaced by §7.3 once built.* |
| Active → done transition | N/A — see §6 | Position dropped entirely, not reassigned |

## 3. Attached-child sibling reordering

Attached children are a **locally-sortable list** scoped to one parent's
children — reordering siblings under the same parent, using the anchor +
side mechanism above. On the board, that reorder and the cross-boundary
attach and detach are the drag gesture's job
([board-drag-interaction](../board-drag-interaction/) §7 and §8).

A new attached child's position is scoped to `(parentId, isAttached)` —
not to `workphaseId` — via the same append-fallback logic as everything
else. (Scoping it to `workphaseId` would incorrectly pull in unrelated
top-level items and other parents' attached children sharing that
workphase.)

## 4. Merged-column interleaving

A merged column's item list is a **union-sort across the column's covered
workphaseIds** — not a concatenation of independently-sorted
per-workphase lists. This is what makes genuine cross-workphase
interleaving visible and draggable.

There is **no forced "regroup"** mechanism — grouped-by-workphase-rank is
an emergent tendency from typical usage, not an actively-enforced
guarantee. Once interleaved by normal use, items stay interleaved.

**Drop resolution rule:** whether a drop within a merged column is a
"same-visual-group reorder" (position-only, `workphaseId` untouched) or a
"genuine cross-column move" (workphaseId reassigned) is decided by **"is
the active item's current workphaseId already a member of the target
column's covered set"** — not by which specific workphase the anchor card
belongs to. If yes: position-only reorder regardless of which covered
workphase the active item or its anchor happens to be in. If no: snaps to
the column's entry workphase, its `entryWorkphaseId` (generic drop on
column body), or the precise
hovered workphaseId (expanded mode). Expanded/single-workphase columns are
unaffected — covered-set membership degenerates to exact equality there.

## 5. Reindexing (precision + magnitude)

**A reindex resets a given set of items to clean sequential values,
preserving their current relative order.**

**Two triggers, both lazy and reactive** — never a scheduled job, never a
whole-project sweep:

1. **Tight-gap:** an insert-between search exhausts precision (§2) →
   reindex just that local comparison scope, then retry.
2. **Magnitude threshold:** an append's value would cross
   `max(1000, n + 100)`, where `n` is the number of items in the scope →
   reindex the relevant scope first, then append. The threshold scales with scope size (1000 as a
   floor) so a scope that genuinely holds 1200+ items doesn't reindex on
   every single append.

**Active items reindex as one coordinated scope** — every non-terminal
workphase's items reset *together*, in one operation, never
per-workphase independently. This is what prevents two separately-reset
scopes from drifting into overlapping ranges and colliding later.

**Done items are excluded entirely** — see §6.

### 5.1 Reindexing must be disclosed to the caller

The disclosure is an optional `reindexed` field on the item-write
responses (`POST /items`, `PUT /items/:id`, `PATCH /items/:id/move`).

**A response to a write that triggered a reindex must carry the renumbered
positions.** A reindex changes rows the caller never asked about, so a
caller that only reads back the item it wrote is left holding one fresh
value and a set of stale ones.

**Why silence is unsafe rather than merely inefficient:** a reindex
*preserves relative order* by definition, so a caller that mixes the one
new number into its old ones can compute an ordering that is wrong while
looking perfectly consistent. Given rendered `A=1.0, C=1.5, E=1.75` and a
reindex to `A=1, X=2, C=3, E=4`, a caller that learns only `X=2` sees
`1.0, 2, 1.5, 1.75` and concludes X belongs last. Nothing errors; the list
is simply wrong from then on.

Shape of the disclosure:

- The response carries a **collection of `{id, position}` pairs** covering
  every item the reindex renumbered — chosen over a bare "you should
  requery" flag, which costs a round trip and leaves a window in which the
  caller knows its data is stale but hasn't corrected it yet. The values
  already exist in the transaction; withholding them to be asked again is
  work for both sides.
- **`{id, position}` and nothing more.** A reindex changes positions and
  never any other field, so a full row would imply otherwise.
- **The written item is included** in the collection when it was part of the
  reindexed scope, so a caller has exactly one rule — apply every pair —
  rather than a merge with precedence to reason about.
- **Absent or empty means no reindex occurred**, which is the overwhelmingly
  common case and should cost nothing to report.
- The collection covers the **whole reindexed scope**, which may be far
  wider than any one caller's view. A caller **applies the pairs it holds
  and ignores the rest**; an unrecognized id means "not in this view," never
  "missing data to go fetch."

## 5a. Client reconciliation order

**After a successful write that returns positions, the list shows the order
the server saved** — without a reload, and without moving any row that was
already correctly ordered. This holds for every such write: a board move, a
sibling reorder, an inline create, a Sheet edit, including one that
triggers a reindex. The exceptions are
[board-drag-interaction](../board-drag-interaction/) §10's: a failed write,
or a stale response that carried reindex pairs, resyncs the board instead.

**Why it holds:** a client that holds a locally ordered list takes each
response to a position write in this order:

1. **Apply every reindex pair it holds.**
2. **Then assign the written item's authoritative position.**
3. **Only then compare anything.** The order follows `position` and the
   tie-break below.

**The order matters.** A comparison made before the pairs land mixes old
values with new ones, and reports an order that was never wrong. On the
board, that would be a false entry in the inversion log.

**On the board, the inversion check runs only for a write the board
previewed** — a Sheet edit that reassigns a position made no ordinal claim.
The board compares the rendered order of positioned Free items with the
pending placement to the order after the response, with the placement
cleared; a difference is recorded in the tuning panel's inversion log, and
nothing goes to the console
([board-drag-interaction](../board-drag-interaction/) §10).

**Tie-break:** wherever items are sorted, the order is `position` — a
missing one counting as 0 — then `createdAt`. It's cheap, deterministic,
and keeps an exact tie's order from depending on unspecified database row
order. A client that sorts any other way will diverge from the server on
exact ties.

## 6. Active/done split

Resolves magnitude growth for done items with **no mechanism at all** for
them — the "looks wrong" problem was never really about large numbers, it
was about *disproportionate* ones (position 1547 among 5 Todo items looks
broken; position 23,456 among 25,000 completed items looks exactly
right). Active churns (bounded count, unboundedly growing magnitude —
genuinely disproportionate, needs reindexing). Done accumulates (magnitude
and count grow together — never disproportionate, needs nothing).

- The active/done split needs no new field — a workphase's terminal flag
  fully determines it.
- **`completedAt`** (nullable timestamp): set when a detached/root
  item's effective workphase transitions to terminal; cleared (set null)
  if it transitions back to non-terminal (reopened).
- **Done items (detached/root items whose workphase is terminal) get no
  stored position** — ordering is derived from `completedAt` at read
  time, never written or compared as `position`.
- **A done list reads oldest completion first, and items that completed
  at the same moment read in creation order.** Example: `A` completed at
  10:00, and `B` and `C` both at 10:05, with `B` created before `C`: the
  list reads `A, B, C`. An item previewed into a done list has no
  `completedAt` yet, and reads last
  ([`../board-drag-interaction/`](../board-drag-interaction/) §10).
- **Exception: attached children keep their position** even when their
  (cascaded) workphase is terminal — their comparison scope is
  `(parentId, isAttached)`, not workphaseId, so position stays meaningful
  regardless of the parent's status. Only detached/root items lose
  position on terminal transition.
- **Column range validation:** a board column's range cannot span a
  terminal and a non-terminal workphase together — active and done items
  must never be directly compared in one sorted list, since done's
  ordering isn't position-based at all.

## 7. Placement intents from the board gesture

These extend §2's resolution model; they don't replace any part of it.

### 7.1 First-in-list and last-in-list are anchor + side, chosen by the client

The board gesture's "first in list" and "last in list" placements (drop
bands — see [`../board-drag-interaction/`](../board-drag-interaction/) §5
and §7.1) introduce **no new request shape**. They are ordinary §2
anchor + side requests where **the client picks the anchor from its own
rendered list**:

- **First in list** → `{ anchorId: <first item in the target context>, side: 'before' }`
- **Last in list** → `{ anchorId: <last item in the target context>, side: 'after' }`

"The target context" is the region the drop resolves into — the whole
column in merged mode, the individual sub-row in expanded mode, or a
parent's Stub list — exactly as
[`../board-drag-interaction/`](../board-drag-interaction/) §1 defines it.
"First" and "last" are read off the client's rendered order, using §5a's
tie-break, so an exact tie can't make the client and server disagree about
which item is first.

**Why the client choosing the anchor is safe, when the client computing a
number is not.** §2's narrow-view hazard is about the *number*: a midpoint
computed from two visible neighbors can leapfrog an unseen item between
them. Choosing an anchor has no such hazard — the server still resolves
against that anchor's *true* neighbor, so nothing is jumped. Picking the
first visible item is no different in kind from picking a neighbor of the
ghost ([`../board-drag-interaction/`](../board-drag-interaction/) §2);
every drag already chooses its anchor from what's on screen.

**Why "first visible" is the *right* anchor, not merely an acceptable one.**
If the view is narrower than the true order — an unseen item Z sits before
the visible first item A — then anchoring `before A` lands the item between
Z and A, and the rendered result is: first in the list the user was looking
at. That is what "first in list" meant. A server-side "true first" would
instead place it ahead of Z, an item the user never saw and expressed no
intent about. The same §2 "Client-side role" argument that makes the
ordinal preview correct makes this choice correct: the rendered projection
of the server's answer matches the slot the user picked.

**Empty target context — no anchor exists.** First and last are then the
same slot and both degrade to the existing anchor-free paths, unchanged:

- Into a **column region** with no items: a workphaseId-only move, which
  keeps the item's position if it has one, or takes the append fallback if
  it doesn't (§2's workphase-only rule).
- Into a **parent's empty Stub list**: an attach/reparent with no anchor,
  which is a scope change and takes the append fallback (§2.1).

**Done columns:** the visible first/last items there have no position and
so cannot be anchors (§7.4). The bands do not produce an anchor request in a
done column; the drop is workphase-only.

**Scope check happens against the item's *resulting* state.** When the same
request also reparents or attaches (a Card dropped as a Stub), the anchor is
one of the *new* parent's children — a scope the item isn't in yet. The
server validates the anchor's scope against where the item will be after
the reparent, not where it is now; this is §7.2's sequencing rule seen from
the validation side.

**An anchor outside the resulting scope is rejected** — 400, and per
[`../item-attachment/`](../item-attachment/) §6 nothing in the request
commits: not the reparent, not the workphase change, not the cascade. The
same applies to an anchor that doesn't exist or has no position (§7.4).
There is no fallback that ignores the anchor and appends instead; a
request that names an anchor means that anchor.

### 7.2 Reparenting re-resolves position, and the order matters

A reparent-with-placement always resolves a fresh position, and always
resolves it **after** the new parent is in effect — the target scope is
derived from the new parent, so resolving first would resolve against the
scope being left. Rationale and the Free-item exception:
[`../item-attachment/`](../item-attachment/) §4–§5.

§2.1's scope-change table has no rows of its own for the *gesture* — a
gesture-driven attach, detach, or reparent lands on the rows already
there. A single request can carry the scope change and the placement
together. (The cross-workflow row comes from the API-only case, §7.3.)
*Replaced by §7.3 once built.*

### 7.3 Cross-project reparenting doesn't change the comparison scope

A board is scoped to one workflow, and a detached/root item's position
scope is that whole workflow (§2). So a cross-project drop *on a board* is
between two projects already sharing the workflow — the comparison scope on
both sides of the move is the same one.

**Consequence:** cross-project placement resolution is not a special case.
Whether the position re-resolves is decided as for any reparent, never by
the project change. A reparent that carries a placement always re-resolves
(§7.2), and so does one of an item that is Attached before or after the
write (§2.1). A Free item that stays Free, reparented with no anchor, keeps
its position ([`../item-attachment/`](../item-attachment/) §4). On a board
every reparent is an attach, so it always re-resolves. There is no
cross-project positioning rule to write.

**Cross-*workflow* reparenting (API-only — see
[`../item-attachment/`](../item-attachment/) §9) is different in one
way.** An *attached* item's placement is still unremarkable — it lands in
its new parent's sibling scope, which has nothing to do with workflows.
But every item in the moved subtree that keeps its own `workphaseId` — the
moved item itself if it is Free, and every detached descendant — now
holds a workphase from a workflow its project doesn't use. Those items
sit in "Unknown status," which is not position-ordered (`positionScope`
is `"none"`), and a position number resolved in the old workflow's scope
means nothing there.

**So the reparent nulls their `position`.** This keeps the invariant
that an item with no meaningful comparison scope has no stored position —
the same treatment §6 gives a done item, for the same reason. It also
means re-filing needs no new rule: when a user later moves the item into
a workphase of the new workflow, it has no position to keep and takes the
append fallback through §2's existing "no existing position" path, like a
reopened done item or a first-time assignment. It's the cross-workflow
row of §2.1's scope-change table.

**Planned:** no reparent reaches the two paragraphs above. A
cross-workflow reparent is refused whenever the moved subtree would hold a
Free item after the write ([`../item-attachment/`](../item-attachment/)
§9). The one that's allowed leaves every moved item Attached: the moving
item lands in its new parent's sibling scope, and its attached descendants
keep theirs, none of which has anything to do with workflows (§2.1). So no
item write nulls a position, and §2.1 has no cross-workflow row. Replaces
the paragraphs "Cross-*workflow* reparenting (API-only" and "So the
reparent nulls their `position`", §2.1's cross-workflow row, and §7.2's
closing sentence about it.

An item can still hold a workphase its project's workflow doesn't use,
when its project moves under a different workflow. It shows in Unsorted
([`../boards-columns-unsorted/`](../boards-columns-unsorted/)). What the
move does to its position, and how it's re-filed, isn't a rule yet (Open
questions).

### 7.4 Done columns accept drops, but never positioned inserts

Follows from §6 with no new mechanism: a detached/root item in a terminal
workphase has **no stored position**, so it can be neither an anchor nor a
"first"/"last" boundary. A drop into a done column resolves as a workphase
change; ordering there is by `completedAt`.

**A done Card's Stubs are anchorable, and unaffected.** Per §6's exception,
attached children keep their positions regardless of the workphase they
inherited — their scope is `(parentId, isAttached)`, which has nothing to
do with terminality. Placement inside a done card's Stub list works
normally.

### 7.5 The column's middle band is §2's workphaseId-only move

The gesture's middle band on a column
([board-drag-interaction](../board-drag-interaction/) §5) means *take this
workphase, keep your position* — which is precisely §2's workphase-only
rule: a workphaseId-only move with no anchor keeps the item's existing
position, unchanged.

This is a consistency worth stating rather than a new rule. The band exists
because that behavior is useful to reach deliberately; the behavior exists
because a workflow-wide position stays meaningful across a workphase
change. The same §2 exception still applies — an item with **no** position
to keep (a reopened done item, a first-time workphase assignment) still
gets a fresh one via the append fallback.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **Whether a Free child also needs a position among its siblings (§1,
  §2.1).** An item has one position, compared in one scope: among its
  parent's attached children, or among the workflow's Free items. So a
  Free item reparented with no anchor keeps its position
  ([`../item-attachment/`](../item-attachment/) §4), and a detached child
  has no place among its parent's other children. If a surface ever shows
  all of a parent's children together, attached or not, a Free child
  would need a second position there. The alternative is to show attached
  and detached children as two separate groups.
- **What a project move under a different workflow does to its items'
  positions (§7.3).** Its items can be left holding a workphase the new
  workflow doesn't use, and so a position that compares against nothing.
  Whether the move nulls those positions, as a done item has none (§6),
  and how the items are later re-filed, is undecided.

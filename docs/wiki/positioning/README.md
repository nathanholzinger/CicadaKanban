# Positioning — Anchor, Side and Reindexing

**Test suite:** none of its own. Each feature that positions by these
rules tests them in its own catalog:
[`../../test-plans/item-positioning/`](../../test-plans/item-positioning/)
and [`../../test-plans/project-tree/`](../../test-plans/project-tree/).

**Related:** [`../item-positioning/`](../item-positioning/) (an item's
scopes, the active/done split, and the board's placements) ·
[`../project-tree/`](../project-tree/) §4 (a project's siblings)

This page answers "how does a write place an entry among others, and how
does a client keep the order the server saved." Its rules are shared:
items and projects both place by them. An *entry* is one thing a
position orders: an item or a project. Each feature's page names its
comparison scopes, says which of its writes place an entry, and states
any rule of its own, marking as Planned any rule here that it's still to
be built to.

---

## 1. A position orders an entry within its comparison scope

**An entry's `position` is a number compared only against the positions
of the other entries in its comparison scope.** Each feature's page
names its scopes: an item's is its workflow's Free items, or its
parent's attached children
([`../item-positioning/`](../item-positioning/) §2, §3), and a project's
is its siblings ([`../project-tree/`](../project-tree/) §4). Two entries
in different scopes are never compared.

**The tie-break:** wherever entries are sorted, the order is `position`,
a missing one counting as 0, then creation time. It's cheap,
deterministic, and keeps an exact tie's order from depending on
unspecified database row order. A client that sorts any other way
diverges from the server on exact ties.

Example: `A` and `B` both at `2.0`, `A` created first, and `C` with no
position, read `C, A, B`.

## 2. A write names a neighbor and a side, never a number

**A write that places an entry names a neighbor and a side, never a
final number.** The caller sends relative intent: place this entry
immediately `before` or `after` a named entry, the anchor. The server
resolves the number against that anchor's **true current** neighbors (a
fresh query, never a value the caller supplies), inside the same
transaction as the write (§3).

**The API takes no final position from any caller.** A move that names
a `position` is refused with a 400 whose message says to name a neighbor
and a side instead, and no endpoint sets positions outright.

**Why:** a caller's view of the neighbors can be narrower than the true
order, for example a subproject's board, which doesn't load its parent
project's full item set. A number worked out from a narrow view can
silently leapfrog a true neighbor that the view never saw. Resolving
against a fresh query, always, closes this for every comparison scope at
once.

**A named neighbor must be one the entry can be placed against.** A
write is refused with a 400, and nothing in it changes, when its
neighbor:
- doesn't exist;
- has no position, since resolution starts from the neighbor's position
  (§3);
- isn't in the entry's *resulting* scope, the one it's in after the
  write, which differs from its current one when the same write also
  changes its scope;
- is the entry itself (below).

There's no fallback that ignores the neighbor and places the entry at
the end instead. A write that names a neighbor means that neighbor.

**An entry is never its own neighbor.** Resolution leaves the entry out
of its scope while it places it, so its own current place never counts
as a neighbor. Example: `A` at `1.0`, `X` at `1.5` and `B` at `3.0`, in
one scope. `X` placed after `A` lands at `2`, between `A` and `B`.
Counting `X`'s own place as `A`'s neighbor would give a value below
`1.5`.

## 3. How a position resolves

**Resolution steps, in order:**

1. Query the anchor's true current position.
2. Look for a true bounding neighbor beyond the anchor in the requested
   direction, in the whole comparison scope: never limited to what the
   requesting view has loaded or shows. The check is always "does a
   true neighbor exist," never "is one visible here."
3. If one exists: a **coarsest-fit insert** between the anchor and that
   neighbor (below).
4. If none exists, because the anchor is the scope's true last entry for
   `after`, or its true first for `before`: the **append fallback**
   (below).
5. A write that places an entry with no anchor resolves the same way,
   treating the scope's true last entry as an implicit anchor, or takes
   the **bootstrap fallback** if the scope is empty.

**Coarsest-fit rounding** (step 3): not the raw arithmetic midpoint. The
search tries increasing decimal precision, 0 places, then 1, then 2 and
so on, rounding the exact midpoint at each level, and takes the first
result that falls strictly between the two neighbors. Example: between
`1.5` and `2.0`, the raw midpoint is `1.75`, but `1.8` already fits at
one decimal place, so the entry gets `1.8`.

**Append fallback** (step 4): `round(anchor's position + 1.0)` for
`after` with no true successor. For `before` with no true predecessor,
**not** a symmetric `round(anchor's position - 1.0)`, but a coarsest-fit
insert between `0.0`, a virtual floor, and the anchor's position. That
keeps an entry that's prepended again and again above zero, instead of
drifting negative without limit, which would collide with the
tie-break's treatment of a missing position as 0 (§1). Examples: after a
true last at `4.2`, an append gives `5`; before a true first at `1.0`, a
prepend gives `0.5`.

**Bootstrap fallback** (step 5, an empty scope): start at `1.0`. It
fires only when the whole comparison scope has no positioned entry yet.

**Tight-gap reindex trigger:** if the coarsest-fit search exhausts its
maximum decimal depth with nothing fitting, that's precision
exhaustion. The scope is reindexed first (§6), then the insert is
retried.

## 4. When a write gives an entry a new position

**A position changes only when a write places the entry, or changes its
scope:**
- **A write that places the entry** names a neighbor (§2), or names
  none, and the entry goes after its scope's true last entry, or starts
  an empty scope (§3, step 5).
- **A write that changes the entry's scope without naming a neighbor**
  places it the same way, after its new scope's true last entry. Its old
  position means nothing among its new neighbors.
- **Any other write keeps the entry's position,** even one that changes
  something else about it, except where a feature's page says otherwise:
  an item made done loses its position
  ([`../item-positioning/`](../item-positioning/) §6).

Each feature's page says which of its writes place an entry, and which
change its scope: [`../item-positioning/`](../item-positioning/) §2.1,
and [`../project-tree/`](../project-tree/) §5, §6 and §7.

## 5. The client never computes a position

**The client never computes a position value, not even for display.**
Its feedback is **ordinal**: the entry is shown at an index in the
rendered list, and the number arrives from the server.

Why not compute a number for display only: a plausible but wrong number
held in client state is a number something will eventually be tempted
to send, and it buys nothing (below).

**Why ordinal is sufficient, and correct rather than approximate:** the
server places an entry strictly between its anchor and that anchor's
true neighbor in the requested direction. Anything in that gap is, by
definition, not in the requesting view, or it would have been the
anchor's visible neighbor. So the entry always lands next to its anchor,
on the requested side, *within the rendered set*, whatever number it
receives and whatever unseen entries sit around it. The rendered
projection of the server's answer is exactly what the client already
drew.

Worked through: rendered `A, C, E`, with true order `A, B, C, D, E`.
Requesting `after A` resolves between `A` and `B`, and renders
`A, X, C, E`. Requesting `before C` resolves between `B` and `C`, and
renders `A, X, C, E`. It's the same picture, and the one the client
predicted.

**The flip side: the two relations are the same rendered slot but not
the same true slot, so the choice of anchor is never cosmetic.** With
the same view, dragging `C` and setting it back down where it was saves
"after `A`", landing between `A` and `B`, if the carried card leans up,
or "before `E`", landing between `D` and `E`, if it leans down
([`../board-drag-interaction/`](../board-drag-interaction/) §2). Both
render `A, C, E`, but `C` has moved relative to the unseen `B` and `D`.
So where a view may be narrower than the true order, a set-down with a
neighbor to name is a real write, not a no-op.

**With full context, nothing between two rendered neighbors is unseen,**
so the two relations name one true slot, and a set-down in its own gap
writes nothing
([`../hierarchy-placement/`](../hierarchy-placement/) §5). The project
sidebar always has full context ([`../project-tree/`](../project-tree/)
§1).

This holds under stacked writes too: an entry may be placed against an
anchor whose own value is still in flight, because the ordinal relation
doesn't depend on either number.

## 6. Reindexing

**A reindex resets a comparison scope's positions to clean sequential
values, keeping their order:** §1's order, so an exact tie keeps its
creation order.

**Two triggers, both lazy and reactive,** never a scheduled job, and
never a sweep beyond the scope a write places in:
1. **Tight gap:** an insert's coarsest-fit search exhausts its precision
   (§3). The scope is reindexed, then the insert is retried.
2. **Magnitude threshold:** an append's value would cross
   `max(1000, n + 100)`, where `n` is the number of entries in the
   scope. The scope is reindexed first, then the append is made. The
   threshold scales with the scope's size, with 1000 as a floor, so a
   scope that really holds 1200 or more entries doesn't reindex on every
   append.

**A reindex renumbers the whole scope it fires in, and nothing outside
it.** Each feature's page says what its scopes hold.

Example: entries at `1500` and `1600`, and one placed after the last.
The append would give `1601`, past the threshold of `1000`, so the scope
is reindexed first, to `1` and `2`, and the entry lands at `3`.

## 7. A write that reindexes discloses it

**A response to a write that triggered a reindex carries the renumbered
positions.** A reindex changes entries the caller never asked about, so
a caller that reads back only the entry it wrote is left holding one
fresh value and a set of stale ones.

**Why silence is unsafe rather than merely inefficient:** a reindex
keeps the order by definition, so a caller that mixes the one new number
into its old ones can compute an order that's wrong while looking
perfectly consistent. Given rendered `A=1.0, C=1.5, E=1.75` and a
reindex to `A=1, X=2, C=3, E=4`, a caller that learns only `X=2` sees
`1.0, 2, 1.5, 1.75`, and concludes `X` belongs last. Nothing errors; the
list is simply wrong from then on.

The disclosure's shape:
- **A collection of `{id, position}` pairs,** covering every entry the
  reindex renumbered. It's chosen over a bare "you should requery" flag,
  which costs a round trip and leaves a window in which the caller knows
  its data is stale but hasn't corrected it yet. The values already
  exist in the transaction; withholding them to be asked again is work
  for both sides.
- **`{id, position}` and nothing more.** A reindex changes positions and
  never any other field, so a full row would imply otherwise.
- **The written entry is included** when it was part of the reindexed
  scope, so a caller has exactly one rule, to apply every pair, rather
  than a merge with a precedence to reason about.
- **Absent or empty means no reindex happened,** which is by far the
  common case, and costs nothing to report.
- **It covers the whole reindexed scope,** which may be far wider than
  any one caller's view. A caller applies the pairs it holds and ignores
  the rest: an unknown id means "not in this view," never "missing data
  to go fetch."

Which writes disclose is each feature's page's.

## 8. Applying a response

**After a successful write that returns positions, a client's list
shows the order the server saved,** without a reload, and without moving
any row that was already correctly ordered, including after a write
that triggered a reindex. Each feature's page names the writes this
covers, and any exception.

**Why it holds:** a client that holds a locally ordered list takes each
response to a position write in this order:
1. **Apply every reindex pair it holds** (§7).
2. **Then assign the written entry's position.**
3. **Only then compare anything.** The order follows `position` and the
   tie-break (§1).

**The order matters.** A comparison made before the pairs land mixes old
values with new ones, and reports an order that was never wrong.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

None open.

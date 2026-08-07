# Item Positioning & Board-Scoped Ordering

**Build status:** Not yet implemented — this page documents Epic 3.2's
hardened design (all open questions resolved) ahead of the code landing.
Update the status line below once it ships, and re-verify every rule below
against actual behavior at that point.

**Test suite:** [`../../test-plans/item-positioning/`](../../test-plans/item-positioning/)
**Design history:** `.claude/plans/epic-3.2-decisions.md`

---

## 1. Position is a single item-owned scalar

`items.position` is one nullable `REAL` value per item — not a per-board
value. Boards read it; they never own their own copy. This is the same
kind of fact as `items.workphaseId` (an item's current state), just a
second axis of it. A future "personal boards" concept (team-shared vs. an
individual's divergent ordering) is a deliberately deferred idea, not
built — if it ever is, it's an additive sparse override table that falls
back to this scalar, not a migration away from it.

## 2. Position resolution: anchor + side

Writes that change position don't send a client-computed final number.
The client sends **relative intent** — insert this item immediately
`before`/`after` a specific other item, by id (the "anchor") — and the
server resolves the actual number against that item's **true current**
neighbor (a fresh query, never a client-supplied value), inside the same
transaction as the write.

**Why:** a client's local view of neighbors can be narrower than the true
full order (e.g. a subproject board that doesn't load a parent project's
full item set). Resolving locally from a narrow view can silently leapfrog
an item past a true neighbor the acting view never saw. Resolving against
a fresh authoritative query, always, closes this for every comparison
scope (attached-sibling list, merged-column union) at once.

**Resolution steps, in order:**

1. Query the anchor's true current position.
2. Look for a true bounding neighbor beyond the anchor in the requested
   direction, against the full authoritative table — never limited to
   what the requesting view currently has loaded or displayed. The check
   is always "does a true neighbor exist," never "is one visible here."
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
with no true successor, `round(anchor.position - 1.0)` for `before` with
no true predecessor. Item creation with no explicit position and a
cross-workphase move/drop with no specific target card both resolve
through this same path.

**Bootstrap fallback** (step 5, scope is completely empty): anchor to the
nearest non-empty workphase by rank, rather than restarting at a fixed
baseline like `1.0` — this is what prevents two independently-empty
workphaces from each bootstrapping at `1.0` and later colliding when
merged/compared.

**Tight-gap reindex trigger:** if the coarsest-fit search exhausts a max
decimal depth with nothing fitting, that's precision exhaustion — reindex
the relevant local comparison scope first (§5), then retry the insert.

**`positionScope` (computed, read-only API field):** alongside the
existing `position: number | null` (unchanged shape), a derived field —
`"attached-siblings"` (item is attached, has a `parentId`),
`"workphase"` (detached/root, non-terminal workphase), or `"none"`
(detached/root, terminal/done workphase — see §6). Purely computed at
serialization time, never stored. Tells a client (or a human reading the
API) what an item's `position` is actually comparable against.

**Client-side role:** `positionBetween`/`computeDropPosition` can still
run client-side for optimistic instant visual feedback, but the server's
resolution is authoritative — a mismatch resolves via the existing
resync-on-failure path (`loadBoard()`), never by trusting the client's
guess.

### Scope-change reassignment principle

Assign a fresh position via the append fallback exactly when an operation
changes an item's *relevant comparison scope* without an explicit anchor —
never when the scope is unchanged:

| Operation | Scope change? | Result |
|---|---|---|
| Attach ↔ detach toggle | Yes (parent-scoped ↔ workphase-scoped) | Fresh position |
| Reparent while staying attached | Yes (old parent's siblings → new parent's) | Fresh position |
| `cascadeWorkphaseToAttachedDescendants` | No (still parent-scoped regardless of workphaseId) | Position untouched — unchanged from today |
| Active → done transition | N/A — see §6 | Position dropped entirely, not reassigned |

## 3. Attached-child sibling reordering

Attached children are a **locally-sortable list** scoped to one parent's
children — reordering siblings under the same parent, using the anchor +
side mechanism above. This is **not** wired into the board-level drag
context — dragging a child *out* of its parent stays blocked until Epic
3.5, which owns the cross-boundary attach/detach gesture.

A new attached child's position is scoped to `(parentId, isAttached)` —
not to `workphaceId` — via the same append-fallback logic as everything
else. (Scoping it to `workphaceId` would incorrectly pull in unrelated
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
"same-visual-group reorder" (position-only, `workphaceId` untouched) or a
"genuine cross-column move" (workphaceId reassigned) is decided by **"is
the active item's current workphaceId already a member of the target
column's covered set"** — not by which specific workphase the hovered card
belongs to. If yes: position-only reorder regardless of which covered
workphase the active/hovered item happens to be in. If no: snaps to
`entryWorkphaseId` (generic drop on column body) or the precise hovered
workphaseId (expanded mode). Expanded/single-workphase columns are
unaffected — covered-set membership degenerates to exact equality there.

## 5. Reindexing (precision + magnitude)

One shared server-side primitive: **reindex a given set of items to clean
sequential values, preserving current relative order.**

**Two triggers, both lazy and reactive** — never a scheduled job, never a
whole-project sweep:

1. **Tight-gap:** an insert-between search exhausts precision (§2) →
   reindex just that local comparison scope, then retry.
2. **Magnitude threshold:** an append's value would cross
   `max(1000, currentScopeItemCount + 100)` → reindex the relevant scope
   first, then append. The threshold scales with scope size (1000 as a
   floor) so a scope that genuinely holds 1200+ items doesn't reindex on
   every single append.

**Active items reindex as one coordinated scope** — every non-terminal
workphace's items reset *together*, in one operation, never
per-workphace independently. This is what prevents two separately-reset
scopes from drifting into overlapping ranges and colliding later.

**Done items are excluded entirely** — see §6.

**Tie-break:** wherever items are sorted client-side, secondary sort key
`(a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt` —
cheap, deterministic, prevents an exact-tie's order from depending on
unspecified DB row order.

## 6. Active/done split

Resolves magnitude growth for done items with **no mechanism at all** for
them — the "looks wrong" problem was never really about large numbers, it
was about *disproportionate* ones (position 1547 among 5 Todo items looks
broken; position 23,456 among 25,000 completed items looks exactly
right). Active churns (bounded count, unboundedly growing magnitude —
genuinely disproportionate, needs reindexing). Done accumulates (magnitude
and count grow together — never disproportionate, needs nothing).

- The active/done split needs no new field — `workphases.isTerminal`
  (already exists) fully determines it.
- **`items.completedAt`** (nullable timestamp): set when a detached/root
  item's effective workphace transitions to terminal; cleared (set null)
  if it transitions back to non-terminal (reopened).
- **Done items (detached/root items whose workphace is terminal) get no
  stored position** — ordering is derived from `completedAt` at read
  time, never written or compared as `position`.
- **Exception: attached children keep their position** even when their
  (cascaded) workphace is terminal — their comparison scope is
  `(parentId, isAttached)`, not workphaceId, so position stays meaningful
  regardless of the parent's status. Only detached/root items lose
  position on terminal transition.
- **Column range validation:** a board column's range cannot span a
  terminal and a non-terminal workphace together — active and done items
  must never be directly compared in one sorted list, since done's
  ordering isn't position-based at all.
- **Explicitly deferred, not built now:** a "generation" tagging scheme
  (per-recalculation epoch marker + composite `(generation, position)`
  sort) would let done items also be periodically compacted later, if
  `completedAt`-based ordering ever stops being sufficient at scale.
  Cleanly layerable on top later — not needed now. Also set aside: a third
  "inbox" status bucket (pre-workflow items) — may overlap with Epic 6's
  "Inbox" concept, worth a naming check whenever it's actually scoped.

## Explicitly out of scope for this feature (as currently scoped)

- Per-board position table / personal boards (§1 — deferred idea)
- Generation-tagging for done-item recalculation (§6 — deferred, layerable
  later)
- A third "inbox" status bucket (§6 — not needed for this fix)
- Column sort-by-computed-field (e.g. "time in column") and its
  drag-while-sorted behavior — no sort feature exists yet to attach it to
- Epic 3.5's board-level attach/detach drag gesture and its visual
  anchor/side hover cue (dynamic upper/lower-half indicator) — this
  feature ships a minimal functional default (dropping on card X resolves
  to anchor X, side `before`) with no new UI; 3.5 layers the polished cue
  on top

## Already correct, not touched by this feature

Detached-child free positioning within a workphase, cycle prevention, and
the same-project reparent constraint — all pre-existing and already
correct; this feature doesn't change them.

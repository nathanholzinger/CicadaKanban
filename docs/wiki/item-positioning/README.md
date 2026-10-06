# Item Positioning & Board-Scoped Ordering

**Test suite:** [`../../test-plans/item-positioning/`](../../test-plans/item-positioning/)

**Related:** [`../positioning/`](../positioning/) (how a position
resolves, is reindexed and is applied, for items and projects alike) ·
[`../item-attachment/`](../item-attachment/) (what a legal parent is, and
what attaching means) · [`../board-drag-interaction/`](../board-drag-interaction/)
(the board gesture that produces these placements)

This page answers "what does an item's position compare against, and
how does a drop on the board place an item." How a position resolves,
is reindexed and is applied by a client is
[`../positioning/`](../positioning/)'s, since items share those rules
with projects. This page holds an item's own scopes, merged columns, the
active/done split, and the board's placement intents.

---

## 1. Position is a single item-owned scalar

An item's `position` is one nullable number — not a per-board value.
Boards read it; they never own their own copy. This is the same kind of
fact as the item's `workphaseId` (its current state), just a second axis
of it.

## 2. An item's comparison scope and the workphase-only move

**An item's position resolves by anchor and side, as
[`../positioning/`](../positioning/) §2 and §3 state:** a write names an
anchor item and a side, never a number, and the server resolves it
against the anchor's true neighbors in a fresh query. This section holds
what's particular to items.

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

**The append fallback** ([`../positioning/`](../positioning/) §3) is
what an item created with no anchor takes, and so is a move within its
own workphase that names no anchor. A workphaseId-only move with no
anchor at all (dropping an item into a different workphase, no specific
target card) doesn't: see the workphase-only rule below.

**The bootstrap fallback** ([`../positioning/`](../positioning/) §3)
starts an empty scope at `1.0`. Because an item's scope is
workflow-wide (never workphase-narrow — see above), it only fires when
the *whole workflow* has no positioned items yet, or a parent has no
children yet — never merely because one particular workphase is
currently empty while others in the same workflow aren't. Why not a
rank-aware bootstrap, anchoring an empty workphase to its nearest
non-empty neighbor by rank: it would only matter if two independently
empty *workphases* could collide at `1.0`, and with a workflow-wide
scope they can't.

**A workphaseId-only move with no anchor keeps the item's existing
position, unchanged:** it's a write that doesn't place the item
([`../positioning/`](../positioning/) §4). Since position is
workflow-scoped, an item's existing value is already comparable against
everything else in its workflow; changing its workphaseId alone doesn't
make that value stop being meaningful, so there's no need to compute a
new one. (This is also the shape the MCP `move_item` tool already sends
— `{workphaseId}` alone.) The one exception: if the item has no existing
position to keep — reopening a done item, or a first-time workphase
assignment — it still needs a fresh one via the append fallback, same as
creation.

**`positionScope` (computed, read-only API field):** alongside the
existing `position: number | null` (unchanged shape), a derived field —
`"attached-siblings"` (item is attached, has a `parentId`),
`"workflow"` (detached/root, in a non-terminal workphase of its project's
workflow — comparable against the whole workflow, see above), or `"none"`
(not currently ordered). An item is `"none"` when it's detached/root and
one of these holds:
- its workphase is terminal (§6);
- it has no `workphaseId` at all, e.g. its workphase was deleted out from
  under it and its `workphaseId` was cleared;
- its workphase isn't one of its project's workflow's, so it shows in
  Unsorted (§7.3).

All three land on the same value because none has a meaningful comparison
scope, even though the reasons differ (ordered by `completedAt`, or not
ordered at all). Computed whenever the item is read, never stored. Tells a client (or a human reading the API) what an
item's `position` is actually comparable against.

**The client never computes an item's position, and its feedback is
ordinal** ([`../positioning/`](../positioning/) §5).

**A pending item must not be represented as `position: null`.** Null is
already load-bearing: it means "not ordered by position" — a done item
ordered by `completedAt` (§6), or an item with no workphase at all — and
the tie-break ([`../positioning/`](../positioning/) §1) counts it as `0`,
sorting nulls to the *front*. A pending item marked null would be
indistinguishable from a done one and would jump to the top of the list
the moment anything re-sorted. Pending needs its own marker; `position`
stays untouched until the real value lands.

Reconciliation on the response, and what to do when a reindex fires:
[`../positioning/`](../positioning/) §8, and §5a for items.

### 2.1 Which item writes take a new position

An item takes a fresh position by the append fallback exactly when a
write changes its comparison scope without naming an anchor, never when
the scope is unchanged ([`../positioning/`](../positioning/) §4). For
items:

| Operation | Scope change? | Result |
|---|---|---|
| Attach ↔ detach toggle | Yes (parent-scoped ↔ workflow-scoped) | Fresh position |
| Reparent while staying attached | Yes (old parent's siblings → new parent's) | Fresh position |
| A parent's workphase change cascading to its attached descendants | No (still parent-scoped regardless of workphaseId) | Position untouched |
| Workphase change, no anchor | No (workflow-scoped either way) | Position kept (§2's workphase-only rule) |
| Active → done transition | N/A — see §6 | Position dropped entirely, not reassigned |

## 3. Attached-child sibling reordering

Attached children are a **locally-sortable list** scoped to one parent's
children — reordering siblings under the same parent, by anchor and side
([`../positioning/`](../positioning/) §2). On the board, that reorder
and the cross-boundary attach and detach are the drag gesture's job
([board-drag-interaction](../board-drag-interaction/) §7 and §8).

A new attached child's position is scoped to `(parentId, isAttached)` —
not to `workphaseId` — via the append fallback, like everything else
([`../positioning/`](../positioning/) §3). (Scoping it to `workphaseId`
would incorrectly pull in unrelated top-level items and other parents'
attached children sharing that workphase.)

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

## 5. Which items reindex together

**Items reindex as [`../positioning/`](../positioning/) §6 states:**
their scope's positions reset to clean sequential values, in order, on a
tight gap or past the magnitude threshold, over the whole scope the
reindex fires in. What that scope holds for items:

**Active items reindex as one coordinated scope** — every non-terminal
workphase's items reset *together*, in one operation, never
per-workphase independently. This is what prevents two separately-reset
scopes from drifting into overlapping ranges and colliding later.

**Done items are excluded entirely** — see §6.

**A parent's attached children are a scope of their own** (§3), so a
reindex of them never touches the workflow's items, and a reindex of the
workflow's items never touches them.

### 5.1 Which item writes disclose a reindex

**Every item write that can reindex discloses it, as
[`../positioning/`](../positioning/) §7 states,** in an optional
`reindexed` field on its response: `POST /items`, `PUT /items/:id` and
`PATCH /items/:id/move`.

## 5a. Which item writes the client reconciles

**After a successful item write that returns positions, the list shows
the order the server saved,** as [`../positioning/`](../positioning/) §8
states. This holds for every such write: a board move, a sibling
reorder, an inline create, a Sheet edit, including one that triggers a
reindex. The exceptions are
[board-drag-interaction](../board-drag-interaction/) §10's: a failed
write, or a stale response that carried reindex pairs, resyncs the board
instead.

The client applies the pairs first, then the written item's position,
and only then compares anything
([`../positioning/`](../positioning/) §8). On the board, a
comparison made before the pairs land would be a false entry in the
inversion log.

**On the board,** which writes the comparison checks, and what happens
to a difference, are
[`../board-drag-interaction/`](../board-drag-interaction/) §10's.

Every client sort of items breaks ties by
[`../positioning/`](../positioning/) §1's tie-break.

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
- **A board's columns never mix done and active workphases**
  ([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §6),
  since active and done items must never be directly compared in one
  sorted list: done's ordering isn't position-based at all.

## 7. Placement intents from the board gesture

These extend [`../positioning/`](../positioning/)'s resolution model
(§2, §3); they don't replace any part of it.

### 7.1 First-in-list and last-in-list are anchor + side, chosen by the client

The board gesture's "first in list" and "last in list" placements (drop
bands — see [`../board-drag-interaction/`](../board-drag-interaction/) §5
and §7.1) introduce **no new request shape**. They are ordinary anchor +
side requests ([`../positioning/`](../positioning/) §2) where **the
client picks the anchor from its own rendered list**:

- **First in list** → `{ anchorId: <first item in the target context>, side: 'before' }`
- **Last in list** → `{ anchorId: <last item in the target context>, side: 'after' }`

"The target context" is the region the drop resolves into — the whole
column in merged mode, the individual sub-row in expanded mode, or a
parent's Stub list — exactly as
[`../board-drag-interaction/`](../board-drag-interaction/) §1 defines it.
"First" and "last" are read off the client's rendered order, using the
tie-break ([`../positioning/`](../positioning/) §1), so an exact tie
can't make the client and server disagree about which item is first.

**Why the client choosing the anchor is safe, when the client computing a
number is not.** The narrow-view hazard
([`../positioning/`](../positioning/) §2) is about the *number*: a midpoint
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
intent about. The same argument that makes the ordinal preview correct
([`../positioning/`](../positioning/) §5) makes this choice correct: the
rendered projection of the server's answer matches the slot the user
picked.

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

**The anchor is checked against the item's *resulting* scope**
([`../positioning/`](../positioning/) §2). When the same request also
reparents or attaches (a Card dropped as a Stub), the anchor is one of
the *new* parent's children — a scope the item isn't in yet. This is
§7.2's sequencing rule seen from the validation side.

**An anchor the request can't use is rejected** — 400, and per
[`../item-attachment/`](../item-attachment/) §6 nothing in the request
commits: not the reparent, not the workphase change, not the cascade.
That holds for every anchor [`../positioning/`](../positioning/) §2
refuses: one outside the resulting scope, one that doesn't exist, one
with no position, such as a done item (§7.4), and the moving item
itself. A request that names an anchor means that anchor.

### 7.2 Reparenting re-resolves position, and the order matters

A reparent-with-placement always resolves a fresh position, and always
resolves it **after** the new parent is in effect — the target scope is
derived from the new parent, so resolving first would resolve against the
scope being left. Rationale and the Free-item exception:
[`../item-attachment/`](../item-attachment/) §4–§5.

§2.1's scope-change table has no rows of its own for the *gesture* — a
gesture-driven attach, detach, or reparent lands on the rows already
there. A single request can carry the scope change and the placement
together.

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

**Cross-*workflow* reparenting leaves no position comparing against
nothing.** It's refused whenever the moved subtree would hold a Free item
after the write ([`../item-attachment/`](../item-attachment/) §9). The
one that's allowed leaves every moved item Attached: the moving item
lands in its new parent's sibling scope, and its attached descendants
keep theirs, none of which has anything to do with workflows (§2.1).

An item can still hold a workphase its project's workflow doesn't use,
when its project comes to use a different workflow
([`../project-tree/`](../project-tree/) §10). It shows in Unsorted
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §3, §10).
What that does to its position, and how it's re-filed, isn't a rule yet
(Open questions).

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
- **What a project's coming to use a different workflow does to its
  items' positions (§7.3).** Its items can be left holding a workphase
  the new workflow doesn't use, and so a position that compares against
  nothing. Whether the change nulls those positions, as a done item has
  none (§6), and how the items are later re-filed, is undecided.

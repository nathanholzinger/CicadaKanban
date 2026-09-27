# Story 4.1 — the clean-slate anchor draft

Working document of the 2026-09-17 planning session for
[`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md). **Not
a rule source** — the wiki is. This is the design the code was compared
against ([`story-4-1-comparison.md`](story-4-1-comparison.md)); where the two
disagree, the comparison and the plan record which side won. In particular
§9's Option A (dropping dnd-kit sortable) was **rejected** — the sidebar's
`computeProjection` is already §7.1 in the sortable world — and §5.2's
near-half Card candidate was left untried in favor of the tuned layout-space
rule.

**What this is.** A design for the board drag layer written from the *settled
rules only* (`wiki/board-drag-interaction/` as of 2026-09-17, four layers,
Stories 5/6 rules included), without reading the code. It exists to be
compared against the as-built code, not to replace it. Differences will sort
into (a) vestige of a retired rule, (b) the draft was naive to a real
constraint, (c) same rule, different shape — and the draft is not presumed
right where it's simpler.

**Not clean-room.** The wiki's "as built" notes expose module names and a
few mechanisms (`popSession`, `dragRegions`, `layoutRect`, `followRegionTop`,
the `DragOverlay`-modifier-through-a-ref trick, `AttachGhostRow`). The draft
deliberately doesn't reuse those names or partitions, but I've seen them.

**Efficiency, as agreed:** (1) one mechanism per rule rather than one per
story, (2) per-pointer-move work, (3) how much of Stories 5/6 falls out of
the shape for free.

**Out of scope, on purpose:** Story 7 (overflow), Story 8 (visuals), Story 9
(free-item reparent gesture), threshold *values*, keyboard/a11y, auto-scroll,
the server contract (Story 1), and §4 classification's internals (consumed
as an input).

---

## 0. The whole design in one paragraph

A drag is a `path` into a strict tree of layers — `[]` Board, `[R]` a
column/sub-row, `[R, C]` one of R's Cards, `[R, C, ▽]` C's descendants
section. Every layer is a row in one table giving its **box** (bounds the
carried copy; the exit clock runs while the pointer is outside it), its
**candidates** (what the hold clock can zoom into), its **hold delay and
gate**, and its **within-action** (what a release means, expressed as a
`Placement`). One pure `step(state, t, pointer, geometry, tuning)` runs each
frame: exit pops one level (cascading on distance), hold pushes one level
(never cascading), then the current layer's within-action produces the
`Placement`. The board renders every list from that `Placement` (the ghost
row *is* the item drawn at its placed slot), the overlay copy is clamped to
the box, and release turns the `Placement` into a request through one
adapter that also decides "identity → write nothing". Rules 1–3 of §1.1 are
structural consequences of the tree, not code.

---

## 1. Vocabulary

| Term | Meaning |
|---|---|
| **Layer** | A depth in the path: Board, Column, Card, Descendants. |
| **Box** | The one rect that bounds the locked layer. Board has none. |
| **Candidate** | A child region the pointer can rest in to zoom one layer deeper. |
| **Hold** | The pop-in clock: `{ id, since }` — which candidate, since when. Duration-only, per-edge delay. |
| **Exit** | The pop-out clock: `{ since }` — since when the pointer has been outside the box. Duration *or* distance, one shared delay. |
| **Within-action** | The locked layer's own meaning for a release, as a `Placement`. |
| **Placement** | Where the item would land, in *gesture* terms: a list (region or parent) and a slot. Ghost, request and pending marker are all this one value (§10). |
| **Origin** | The `Placement` the item was picked up from. "Set back down" = placement equals origin. |
| **Identity** | A placement that resolves to the list and ordinal the item already occupies. Writes nothing, at every layer. |

---

## 2. The layer table (the core artifact)

| Layer | `path` | Box | Candidates (hold clock) | Hold delay · gate | Within-action |
|---|---|---|---|---|---|
| **Board** | `[]` | none — unbounded, no exit clock | every enterable region: a merged column's list box, or each sub-row of an expanded column; each clipped to its scroll viewport. Not: Unsorted, broken columns, an expanded column's outer wrapper. | `popIn` · pointer is in the candidate's **middle band** at fire time (time in the edge bands still counts) | **band** on the region under the pointer (§5), or `null` when nowhere |
| **Column** | `[R]` | R's box | R's own Card rows whose §4 classification is Valid, minus the carried item's own row | `cardPopIn` · none | **reorder** — anchor + side (§2); for a terminal R, `existing` (no positioned insert) |
| **Card** | `[R, C]` | C's box | C's descendants section, iff C has ≥ 1 attached child | `descendantsPopIn` · none | **auto-drop** (§6): `origin` if the item was picked up inside C, else `{ parent C, last }` |
| **Descendants** | `[R, C, ▽]` | the section's box | none | — | **gap + depth** (§7), with per-state validity |

**Exit (pop out), every non-Board layer, identical:** pointer outside the
box for `popOut` ms, *or* (when `popOutDistance > 0`) at least that far
outside it → `path.pop()`, fresh clocks, re-evaluate the same pointer
against the new box immediately (that's the §8 "two pops back to back"
without a rule for it).

**What the table makes structural (no code expresses these as rules):**

- Rule 1 — release commits the locked layer's within-action: `placement`
  is *only ever* computed by `withinAction(path)`. A bare hover matters only
  at Board, because only Board's within-action reads the pointer's region.
- Rule 2 — exactly one layer per pop: push/pop on an array.
- "Never a foreign column's Card", "no sibling-to-sibling hop", "never Board
  → Card directly", "a Card only via its column": Column's candidates are
  *its own* rows, Card's candidates are *its own* section, Board's are
  regions. There is nothing to exclude.
- §3.2 "invalid targets never poppable": candidates are filtered by the
  per-drag Valid set. The one exception (over-cap tab states) is inside
  Descendants' within-action as `valid: false`, never a candidate question.
- A childless Card has no Descendants layer: its candidate list is empty.
- Where a drag starts: a Free Card `[regionOf(item)]`; a Stub
  `[regionOf(parentCard), parentCard, ▽]`; from Unsorted `[]`.

---

## 3. State

```ts
type Side = 'before' | 'after';
type Slot = 'first' | 'last' | 'existing' | { anchorId: string; side: Side };

type Placement =
  | { in: 'region'; regionId: string; slot: Slot }                  // lands Free in a column/sub-row
  | { in: 'parent'; parentId: string; slot: Slot; valid?: false }   // lands attached under parentId
  | null;                                                           // a release here means nothing

interface DragState {
  itemId: string;
  origin: Placement;               // { …, slot: 'existing' } where it was picked up; null from Unsorted
  subtree: ReadonlySet<string>;    // the carried item's descendants (attached or not) — never candidates, never Top/Bottom
  subtreeHeight: number;           // for the cap predicate
  enterable: ReadonlySet<string>;  // §4 classification, once at drag start: the Cards this drag may zoom into
  path: string[];                  // [] | [R] | [R, C] | [R, C, '▽']
  hold: { id: string; since: number } | null;
  exit: { since: number } | null;
  placement: Placement;            // what a release now would mean — also the ghost
  carried: Point;                  // the overlay copy's target position (pointer clamped to the box)
}
```

`Placement` is a discriminated union, not a free-shaped record with an
optional `parentId`: the two arms have different lists, different commit
paths, and Descendants adds `valid` to exactly one of them.

The only "hysteresis" state is `hold`/`exit` timestamps. `placement` is
recomputed every frame; the reorder and gap slots are stable without stored
state because the ghost row is a real list member (§5 below).

---

## 4. The step

Runs on every animation frame while dragging (`t = performance.now()`), with
the latest pointer position; pointer events only update the position. One
tick source, so a motionless hold fires, and tests drive it with synthetic
`(t, pointer)` sequences.

```ts
function step(s: DragState, t: number, p: Point, geo: Geometry, k: Tuning): DragState {
  // 1. Exit — pop out, cascading through the same pointer on distance.
  if (s.path.length > 0) {
    const box = geo.boxOf(s.path);
    if (!contains(box, p)) {
      const exit = s.exit ?? { since: t };
      const far = k.popOutDistance > 0 && distanceOutside(box, p) >= k.popOutDistance;
      if (t - exit.since >= k.popOut || far) {
        const popped = { ...s, path: s.path.slice(0, -1), exit: null, hold: null };
        return step(popped, t, p, geo, k);          // fresh clocks; distance may cascade, duration cannot
      }
      return settle({ ...s, exit, hold: null }, p, geo); // outside the parent ⇒ inside no child
    }
  }
  // 2. Hold — pop in, one layer, never cascading (each zoom-in earns its own hold).
  const cand = geo.candidateAt(s.path, p, s.enterable, s.itemId);
  const hold = !cand ? null : cand === s.hold?.id ? s.hold : { id: cand, since: t };
  if (hold && t - hold.since >= k.popInFor(s.path) && geo.gate(s.path, hold.id, p)) {
    return settle({ ...s, path: [...s.path, hold.id], hold: null, exit: null }, p, geo);
  }
  return settle({ ...s, exit: null, hold }, p, geo);
}

function settle(s: DragState, p: Point, geo: Geometry): DragState {
  const box = geo.boxOf(s.path);                       // undefined at Board
  const pc = box ? clampPoint(p, box) : p;             // §2 "bounded by its context"
  return { ...s, carried: pc, placement: withinAction(s, pc, geo) };
}
```

Properties worth naming, because the comparison will look for their
equivalents:

- **Two timestamps, no timers.** Nothing is scheduled or cancelled; a clock
  is "the pointer has been in condition X since `since`." Resets are
  assignments to `null`.
- **Pop-out then pop-in in one frame is impossible** (the new hold starts
  at `t`), which is the "popped-out state lasts at least `popIn`" rule for
  free. "Starts at the pop-out itself if the cursor is already in a region"
  is the cascade re-running candidate detection.
- **The within-action always receives the clamped pointer**, so the ghost
  keeps tracking the nearest in-box point while the exit clock runs.
- `popInFor(path)` is a lookup — `popIn` / `cardPopIn` / `descendantsPopIn`
  by target layer — not three code paths. `gate` is `true` everywhere except
  Board → Column.

---

## 5. Within-actions — four kinds

```ts
function withinAction(s: DragState, p: Point, geo: Geometry): Placement {
  const [R, C, D] = s.path;
  if (D) return gapAndDepth(s, C, p, geo);                                              // §7
  if (C) return isInside(s.origin, C) ? s.origin : { in: 'parent', parentId: C, slot: 'last' }; // §6
  if (R) return geo.isTerminal(R) ? { in: 'region', regionId: R, slot: 'existing' }
                                  : reorder(s, R, p, geo);                             // §2
  const H = geo.regionAt(p);                                                           // Board: the bare hover
  return H ? { in: 'region', regionId: H, slot: band(H, p, geo) } : null;              // §5
}
```

### 5.1 Band (Board)

```ts
function band(R: string, p: Point, geo: Geometry): Slot {
  const { contentBox, cardCount, terminal } = geo.region(R);   // content box, not the visible slice
  if (terminal || cardCount === 0) return 'existing';          // single band ("Move to {name}")
  const edge = cardCount >= 2 ? k.ghostHeight : k.ghostHeight / 2;   // the one-card special rule
  const y = p.y - contentBox.top;
  return y < edge ? 'first' : y > contentBox.height - edge ? 'last' : 'existing';
}
```

**No frozen rect.** Under the reservation model every region holds exactly
one ghost-height for the whole time the drag is at Board — hovered (the
ghost row fills it) or not (two half-height spacers). If the ghost row is
rendered at *exactly* `ghostHeight`, a region's content height is invariant
at Board layer and nothing but scroll moves its top edge, so the live
content box is the right thing to measure. The as-built freeze +
`followRegionTop` exist to absorb a residual; the draft removes the
residual instead (§7.2 below). *Check: is the ghost row exact-height, or
its natural collapsed height?*

### 5.2 Reorder (Column, positional region)

```ts
function reorder(s: DragState, R: string, p: Point, geo: Geometry): Placement {
  const rows = geo.rowsOf(R).filter(r => r.id !== s.itemId);     // live visual boxes; the ghost row excluded
  const i = rows.filter(r => midY(r.box) < p.y).length;           // slot = how many siblings the pointer is below
  const slot: Slot = rows.length === 0 ? 'existing'
    : i === 0 ? { anchorId: rows[0].id, side: 'before' }
    : { anchorId: rows[i - 1].id, side: 'after' };
  return { in: 'region', regionId: R, slot };
}
```

**Why this is stable with no stored slot.** The ghost row is a real member
of the list at slot `i`, one ghost-height tall. Crossing sibling S's
midpoint moves the ghost past S, which moves S by one ghost-height in the
opposite direction — so S's midpoint moves *away* from the pointer by
`ghostHeight` the instant it's crossed. That is a hysteresis band of one
ghost-height, for free, in both directions.

**Card candidate at this layer** = the sibling whose *visual* box contains
the pointer. By the argument above the pointer can only ever be in a
sibling's near half (the far half would have swapped it away), so "resting
on a Card" means literally resting on the visible card, next to the ghost.
*Feel divergence to check, not a vestige claim:* the as-built reads
transform-free layout rects, which makes the resting zone "where the card
was" — visually, the ghost. The draft's resting zone is half a card; if
that's too small for an 800 ms hold, "the ghost row plus the adjacent near
half" is a one-line change to `candidateAt`, not architecture.

### 5.3 Auto-drop (Card)

`origin` if the drag started inside C (its own Stub: ghost stays at its
original slot, release is identity), else `{ parent C, last }` — the ghost
pinned last regardless of where inside C the pointer rests. What
distinguishes the two is `origin`, i.e. where the drag started (§6, §8).

### 5.4 Gap + depth (Descendants)

```ts
function gapAndDepth(s: DragState, C: string, p: Point, geo: Geometry): Placement {
  const rows = geo.hierarchyRowsOf(C).filter(r => !s.subtree.has(r.id) && r.id !== s.itemId);
  //   DFS order, { id, parentId, depth, box }; depth 0 = C's direct children; the carried subtree removed (§7.2: cycles unreachable)
  const g = rows.filter(r => midY(r.box) < p.y).length;            // same stable gap rule as reorder
  const top = rows[g - 1], bottom = rows[g];
  const lo = bottom?.depth ?? 0, hi = (top?.depth ?? -1) + 1;      // range = [Bottom's depth … Top's depth + 1]
  const depth = clamp(Math.round((p.x - geo.indentOriginX(C)) / k.indentPx), lo, hi);  // offsets past either end clamp

  const target = !top                    ? { parentId: C,      slot: 'first' as const }
    : depth === top.depth + 1            ? { parentId: top.id, slot: 'first' as const }          // tabbed right of Top
    : (a => ({ parentId: a.parentId, slot: { anchorId: a.id, side: 'after' as const } }))
        (ancestorAtDepth(top, depth, rows));                       // Top itself, or its ancestor at `depth`; parentId is C at depth 0
  const valid = geo.absDepth(target.parentId) + 1 + s.subtreeHeight <= geo.cap;   // item-attachment §8, fed the resolved parent
  return { in: 'parent', ...target, ...(valid ? {} : { valid: false }) };
}
```

Every §7.1 case is this one function: the "before Bottom" reading of the
shallowest state is the same placement as "after Top's ancestor at
Bottom's depth" (one relation sent); no-Top → root's first child; no-Bottom
→ range down to 0; the one-state gap where Bottom is Top's child gives
`lo = hi = top.depth + 1`. Validity is the *same predicate* every
parent-giving write uses, with the tab state's resolved parent — not a
second formula.

The same function serves the project sidebar with `C = project`,
`absDepth(project) = 0`, and the rows being the project's tree — which is
Story 6's consolidation.

---

## 6. Placement → commit (one adapter)

```ts
function toRequest(item: Item, pl: Placement, board: Board): MoveItemInput | null {
  if (!pl || pl.valid === false) return null;          // nowhere, or an over-cap tab state: nothing written
  if (isIdentity(item, pl, board)) return null;         // set back down, at any layer
  const place = placeFields(pl.slot);                   // first / last / anchor+side per Story 1's shape; 'existing' → none
  if (pl.in === 'parent') return { parentId: pl.parentId, isAttached: true, ...place };
  const R = board.region(pl.regionId);
  return {
    ...(R.covers(item.workphaseId) ? {} : { workphaseId: R.entryWorkphaseId }),  // covered-set rule
    ...(item.isAttached ? { isAttached: false } : {}),                            // detach keeps parentId (§8)
    ...place,
  };
}
```

- **Identity** = same list *and* same ordinal: `in: 'parent'` with the
  item already attached to that parent; `in: 'region'` with the item Free
  and its workphase in R's covered set (for a sub-row, the exact
  workphase). `existing` in the same list is identity by definition;
  `first`/`last`/anchor compare the resolved index against the current one.
  This subsumes every "nothing is written" clause in the wiki (Board middle
  band for a member, Card layer's own Stub, an invalid tab state, a reorder
  back into the same slot) without a special case per layer.
- **Detach in place keeps the inherited workphase** falls out of the
  covered-set rule: a Stub's workphase is its parent's, which is in the
  parent's column's set.
- **Terminal regions:** `existing`, no anchor; the server nulls the
  position; the preview draws the item as the newest completion (§10's
  done-list comparator rule, unchanged).
- After the request: §10 exactly as built — pending marker (= the
  placement), per-item sequencing, reindex pairs → position → clear →
  inversion tripwire → resync on stale-with-pairs; on identity/cancel,
  restore the stashed pre-drag marker if an earlier write is still in
  flight.

The gesture layer never knows what a workphase or `isAttached` is; the
adapter is the only place gesture terms become item terms.

---

## 7. Measurement

### 7.1 What is read, per frame

| Layer | Read |
|---|---|
| Board | every enterable region's content box and visible box (content ∩ scroll viewport). Card boxes are never read. |
| Column `[R]` | R's box; each Valid row's visual box (also the midpoints for the slot). |
| Card `[R, C]` | C's box; the descendants section's box. |
| Descendants | the section's box; each hierarchy row's box; the indent origin x. |

Nothing else on the board is measured, ever. Order of magnitude: ≤ ~20
`getBoundingClientRect` calls per frame, on elements that are not
transformed. That is the budget; no `getComputedStyle`, no transform
parsing, no per-frame caching layer unless profiling asks for one.

### 7.2 Why live rects are enough

Live rects go wrong in exactly two situations, and the draft designs both
away rather than compensating:

1. **A hovered list changes height because of the ghost.** Removed by the
   reservation invariant (§5.1): the ghost row is rendered at exactly
   `ghostHeight`, the same as the spacers it replaces, so a region's height
   is constant at Board layer. At Column/Card/Descendants the ghost row
   *moves* within a list but the list's height is constant for the same
   reason. (Cross-list moves change two lists' heights — that's the
   "origin list closes its gap" behaviour the rules accept, and it happens
   at a layer change, not during a hover.)
2. **Rows carry CSS transforms.** The draft has none on hit-tested rows:
   the list re-renders with the ghost at its slot (§8). Any transform-based
   slide animation — dnd-kit's sortable or a hand-rolled FLIP — reintroduces
   "visual rect ≠ layout rect" and with it either transform subtraction or
   a frozen rect. That is the concrete cost of the animation, and it should
   be paid knowingly (§9).

Clipping to the visible slice is an intersection at hit-test time, not a
second measurement. Scroll needs no handling: rects are read live.

A layer change re-renders (reservation on/off, ghost changes list), so the
frame after a change measures settled layout — one frame of latency, no
special casing.

---

## 8. Rendering from state

The machine lives in a ref and ticks on rAF. It publishes to React only
`{ path, placement, hoverRegion, band }` when one of them changes (shallow
compare); `carried` goes to the overlay through a ref at frame rate and
never re-renders the board.

**Every list renders from one selector:**

```ts
listMembers(listId, items, placement)
  // base members of the list — a region: Free items in its covered set; a hierarchy: attached children of the parent, DFS
  // minus the carried item wherever it currently lives
  // plus the carried item at its slot iff placement targets this list
```

Both kinds of list — region lists and Card hierarchies — use it; the
carried item's row is rendered by the *list's own row component* with a
`ghost` flag (a collapsed Card row in a column, a Stub row in a hierarchy —
"represented as a Stub-ghost from the Card layer down" is automatic). There
is no separate ghost component and no second mechanism for the in-column
case: the ghost row moving between slots *is* the neighbours moving out of
the way. The ghost row is excluded from candidates by id, so a Card can't
zoom into its own preview, and nothing else about it needs guarding.

`computeChildCounts`, free-item ordering and the inversion tripwire read
the same effective membership, so they're placement-aware by construction
rather than each learning about `parentId`.

**Per-layer decorations, all from `path`:**

- Board (`path.length === 0`): every region renders its reservation
  (ghost row if hovered, else two `ghostHeight/2` spacers; one spacer for
  empty/terminal), the dashed dividers at `edge` from each end of the
  content box, and the band tint on the hovered region. Nowhere else.
- The locked element — `path.at(-1)`'s region, Card, or section — gets the
  outline (`activeContextOutlineColor`).
- Descendants: the ghost row indented to the chosen depth; `valid === false`
  adds the invalid cue.
- Classification overlays (`data-drop-state`) from the per-drag
  classification, unchanged.
- §5a: the carried item's row and the overlay copy both render collapsed to
  `ghostHeight` for the life of the drag; its own children unrendered.

**The overlay copy** is dnd-kit's `DragOverlay` with one modifier that reads
`carried` from the ref and eases toward it (`popSnap`); a layer change moves
the clamp box, the easing absorbs the jump, and there is no separate "snap"
state.

---

## 9. dnd-kit's role

**Option A (the draft):** sensor + overlay only. `DndContext` supplies the
pointer sensor and activation distance, `onDragStart/End/Cancel`, and the
`DragOverlay`. `collisionDetection` returns nothing; `over` is never read;
no `useSortable`, no `useDroppable`; rows use `useDraggable` for the handle.
Everything the rules describe is the machine's. Neighbour movement is the
list re-rendering with the ghost row at its new slot — a snap by default.
If a slide animation is wanted, it is a FLIP on rows keyed by id, and it
brings back the transform-vs-layout measurement question of §7.2 (bounded,
since the animation is short and the swap rule has a ghost-height of
hysteresis, but real).

**Option B (fallback):** keep `SortableContext` on positional column lists
purely as the slide animation, with `collisionDetection` fed from the
machine (`[{ id: anchor }]` at Column layer, `[]` elsewhere) so sortable
never decides anything. Costs: a second preview mechanism (transforms
in-list, membership cross-list), the `over`/index mapping to keep sortable's
shift in agreement with the machine's slot, and transformed rows on the
hit-test path (hence transform-free reads or a frozen rect). This is, as far
as the docs describe it, the as-built shape — named here as the thing to
check the code against, not as a recommendation.

---

## 10. Parameters

All panel values, persisted under the existing key; each maps to one cell
of the table:

| Value | Where it's read |
|---|---|
| `popOut`, `popOutDistance` | exit, every non-Board layer (distance disabled at 0) |
| `popIn` | hold, Board → Column |
| `cardPopIn` | hold, Column → Card |
| `descendantsPopIn` | hold, Card → Descendants (may share `cardPopIn`'s value; still its own row) |
| `popSnap` | overlay easing |
| `ghostHeight` | reservation, dividers (`edge`), the ghost row's fixed height, §5a collapse |
| `indentPx` | Descendants depth — a layout constant shared with the sidebar, probably not tunable |
| overlay colours, outline colour | decorations only |

Nothing else is a threshold. The retired `columnTopBand`/`columnBottomBand`
and `stub*Band` fields have no cell to live in.

---

## 11. Testability

`step`, `withinAction`, `band`, `reorder`, `gapAndDepth` are pure over
`(state, t, pointer, geometry, tuning)`. `Geometry` is an interface
(`boxOf`, `candidateAt`, `gate`, `regionAt`, `region`, `rowsOf`,
`hierarchyRowsOf`, `isTerminal`, `absDepth`, `cap`) implemented once by DOM
reads and once by fixtures.

- **Reachability** (the automated half of `epic-3-5-decisions.md` Q1): feed
  `(t, pointer)` sequences against a fixture board; assert `path` and
  `placement`. Parameterised on the tuning object, never on a literal
  delay. No browser.
- **Write correctness:** `toRequest(item, placement, board)` table tests,
  including every identity case.
- **E2E:** the DOM `Geometry` adapter and one smoke path per gesture; feel
  stays manual.

---

## 12. Worked traces (for the comparison to replay against the code)

**Attach A (column X) under B (column Y), Y positional, B Valid.**
start `[X]` (reorder ghost at A's own slot) → pointer leaves X: exit runs →
`popOut` → `[]`, reservations appear, hold starts on whatever region is
under the pointer → rest in Y's middle band `popIn` → `[Y]`, reservations
collapse, ghost at Y's reorder slot → rest on B's near half `cardPopIn` →
`[Y, B]`, ghost is a Stub row pinned last in B, overlay clamped to B →
release → `{ parent B, last }` → `{ parentId: B, isAttached: true, last }`.

**Detach Stub S from P (in column X) to the column, decisively (§8).**
start `[X, P, ▽]` (gap ghost at S's own slot) → yank outside the section:
`popOut` (or distance) → `[X, P]`, ghost at S's original slot (origin),
re-evaluate: pointer already outside P's box → if `popOutDistance` is on and
satisfied, `[X]` in the same frame; else another `popOut` → `[X]`, S is a
Card ghost at X's reorder slot → release → `{ region X, after N }` →
`{ isAttached: false, anchor N/after }`, workphase untouched (covered set).
A release during the `[X, P]` stop → `origin` → identity → nothing.

**Quick release near a sibling while locked in X:** `[X]` throughout —
hold on the sibling never reaches `cardPopIn` — release → reorder
placement. Attach is unreachable without the hold; nothing to mitigate.

---

## 13. Where the draft expects to differ — hypotheses to sort into (a)/(b)/(c)

Questions to answer while reading, not conclusions:

1. **Layers as a table vs. parallel mechanisms.** Is there one hold clock
   parameterised by edge, or `hoverFor` + `hoverForCard` (+ a third for
   Descendants)? One candidate function per layer, or `nonCardRegionAt` +
   `cardRegionAt` with exclusion flags (`attachToCardId`)? Does Story 5/6
   need a new mechanism or a new row?
2. **Frozen rect + `followRegionTop`.** Needed only if the hovered region's
   height actually changes at Board layer. Is the ghost row exact-height?
   If it is, the freeze is (a); if the residual is real and hard to remove,
   (b).
3. **Two preview mechanisms.** dnd-kit sortable transforms for in-column
   plus placement-driven membership for cross-list; `resolveBoardCollisions`
   as a suppression policy ("keeps dnd-kit from shifting a sibling against
   a hover rule 1 ignores"); `layoutRect`'s transform subtraction on the
   hot path; `AttachGhostRow` as a separate component to keep a collision
   closure from misreading it. All one root cause if (a); a deliberate
   trade for sortable's animation if (b)/(c).
4. **`Placement` shape.** Optional `parentId` on a region-shaped record
   (`renderedIsStub`/`renderedParentId` derivations) vs. a discriminated
   union; where `isAttached`/workphase get derived — one adapter or several
   call sites.
5. **Identity.** Is "set back down / nothing written" detected uniformly
   at commit, or case by case (Board middle band, Card own-Stub, …)?
6. **Clocks.** Timestamps evaluated per frame, or `setTimeout`s that need
   cancelling on every transition? Is there one tick source?
7. **Per-frame reads.** What is measured on every pointer move, and is
   anything measured that the locked layer can't use (e.g. Card boxes at
   Board, all regions at Column)?
8. **Retired-rule residue.** Column-stripe / nearest-sub-row fallback;
   percentage bands; Stub-band fields; one-pop-then-free or
   direct-transfer remnants in the state shape; any "restrict candidates"
   branch that exists only for a hover rule 1 ignores.
9. **Selectors.** One `listMembers` for regions and hierarchies, or
   `selectBoardItems` + `getAttachedChildrenFrom` each learning about the
   placement separately; are `computeChildCounts` and the tripwire
   placement-aware by construction or by patch?
10. **React boundary.** Does per-frame machine state re-render the board,
    or only the overlay?
11. **Known keeps (expected (b)):** the `DragOverlay` modifier reading the
    machine through a ref; classification once at drag start; §10's commit
    sequencing; the panel and the localStorage seed in tests.

---

## 14. Choices the rules don't pin down (the draft's own calls)

Flagged so they aren't mistaken for rules during the comparison:

- **Column-layer Card candidate = near half of the visible card** (§5.2).
  The alternative ("ghost row + adjacent near half", or the as-built layout
  slot) is a `candidateAt` policy, not architecture — but it *is* a feel
  difference the PO has to judge.
- **Snap, not slide, by default** (§9). Slide is buyable back with a FLIP
  at the §7.2 cost.
- **Exact-height ghost row** makes the reservation invariant real (§5.1).
  If a collapsed card can't be forced to exactly `ghostHeight`, the freeze
  comes back.
- **Terminal region's within-action = `existing`** at both Board and Column
  layer; Column layer for a done column exists only to reach its Cards.
- **Identity writes nothing at every layer**, extending the wiki's
  per-layer "nothing is written" clauses to a reorder released in its own
  slot.
- **The overlay copy stays a collapsed Card below Card layer**; only the
  in-list ghost row takes the Stub form. The wiki says "represented as a
  Stub-ghost" without saying which copy.
- **`indentPx` is a layout constant**, not a panel value.

# Story 4.1 — Drag-layer efficiency refactor (vestige removal before Story 5)

Implementation plan for Epic 3.5 Story 4.1. No rule changes: the wiki is
the spec throughout, and this story exists to make the code look as if the
rules that *are* on the page had been there from the start. Becomes a
historical record once done.

**Status: planned 2026-09-17, not started.**

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 4.1
- Working documents: [`story-4-1-anchor-draft.md`](story-4-1-anchor-draft.md)
  (the clean-slate design) · [`story-4-1-comparison.md`](story-4-1-comparison.md)
  (the line-referenced comparison, bucketed)
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §1.1 (the layer stack), §2, §3, §5 (reservation: "net height never
  changes"), §6, §10 ("the ghost is the placement is the request")
- Cases: **no new behavior, so the existing catalog is the regression gate**
  — [`drag-1-contexts-and-popping.md`](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md),
  [`drag-3-card-column-bands.md`](../../test-plans/board-drag-interaction/drag-3-card-column-bands.md),
  [`drag-4-attach-and-stub-placement.md`](../../test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md)
  TC-1–13, [`drag-6-preview-reconciliation.md`](../../test-plans/board-drag-interaction/drag-6-preview-reconciliation.md),
  and the item-positioning part-2/5a/7 cases Story 3 already cites. One
  new automated case (the reservation invariant, Phase 1) and two hands-on
  checks (Phases 1, 4).
- Prior story: [`story-4-card-to-card-attach.md`](story-4-card-to-card-attach.md)
- Depends on: Story 4 (done). **Unblocks:** Stories 5 and 6 — both are
  cheaper by an order of "add a row" vs. "add a branch in twelve places"
  after Phases 0 and 3.

**Verified by:** the existing unit suites (`popSession`, `dragRegions`,
`boardDndUtils`, `itemListOps`) and E2E drag suites (`drag-column-bands`,
`boards-layer`, `item-repositioning-cross-column-dnd`,
`item-repositioning-cross-project-dnd`, `attached-children`,
`drag-target-classification`) staying green through every phase; feel
re-checked by hand only where a phase touches something visible (the
pinned ghost height, the clamp).

---

## Why this story exists — the anchor-comparison process (2026-09-17)

Stories 3 and 4 were built hands-on, with the rules changing several times
along the way (one-pop-then-free → two-way pop; column-stripe regions →
containment; 20/60/20 bands → pixel carve-outs; "any hovered band decides"
→ "the locked layer decides"; Card Stub-bands → constant auto-drop). To find
what the iteration left behind without anchoring on the code's own shape, a
**clean-slate framework was drafted from the settled four-layer rules
first** (Stories 5/6's rules included), *then* compared against the code.
Every difference was sorted into:

- **(a) vestige** — exists because of a rule that no longer holds, or
  because a later story wrapped an earlier story's shape instead of
  reshaping it;
- **(b) the draft was naive** — the code carries a real constraint the
  clean design missed;
- **(c) same rule, different shape** — a judgment call.

The draft and the full comparison are committed alongside this plan
([`story-4-1-anchor-draft.md`](story-4-1-anchor-draft.md),
[`story-4-1-comparison.md`](story-4-1-comparison.md)); the findings that
matter are condensed below so this file stands alone.

### What the draft got wrong — kept as built (b)

1. **dnd-kit sortable stays as the in-context renderer.** The draft dropped
   it for placement-driven list rendering. Two constraints it was naive to:
   the in-column feel is Product-Owner-tuned, and the project sidebar is
   *already* the Descendants layer's §7.1 rule inside the sortable world —
   `sidebar/projectTreeUtils.ts::computeProjection` is `range =
   [next.depth … prev.depth + 1]` driven by `over` + `delta.x`, and Story 6
   consolidates with it. Kept with it: `KanbanCard.tsx::AttachGhostRow`
   (a non-sortable stand-in), layout-space Card rects
   (`dragRegions.ts::layoutRect`), the E2E helper's `boxOf`, and Board-layer
   `hoverContainerId` (so a bare hover never shifts a target list).
2. **One timer beats a per-frame tick.** `popSession.ts::popDueAt` + a
   single `setTimeout` fires a motionless hold at the exact due instant
   with no per-frame work; the machine is still pure over `now`.
3. **Re-drag reconciliation (#22)** — `priorPlacement` and the reactive
   reassertion effect in `useBoardDnd.ts`. The draft had nothing. Note
   `priorPlacement` ("the pending marker before this drag") is a different
   thing from the `origin` this story adds ("where it was picked up");
   Story 5 needs both.
4. **Card candidate hit-testing in layout space** (resting where the card
   *was*, i.e. on the ghost beside it) is the tuned feel. The draft's
   "near half of the visible card" isn't obviously better. Untouched.
5. **`snapTick`'s per-frame re-render during `popSnapMs`** is a dnd-kit
   constraint (overlay modifiers only re-run on render).

### What the draft and the code agree on — no action

Pure machine; timestamp clocks; regions as data measured from
`data-drag-region`; classification once at drag start, consumed as the
candidate filter (`resolveCardTarget → null` = not a region, which is §3.2
for free); one commit path (`sendItemMove` + the write tracker); the
`DragOverlay` modifier reading the machine through a ref; every threshold a
panel value; `data-drag-state`/`-context` as the E2E surface.

---

## Findings — the vestiges this story removes (a)

### F1. The freeze family absorbs an inexact reservation

`PopHover.rect`, `.cardCount`, `.scrollTop`, `popSession.ts::followRegionTop`,
the sticky-hover block at the top of `advancePopSession`'s Board branch,
`hoverForCard`'s rect freeze (a Card hover has no band — it freezes only so
`===` short-circuits a re-render), `dragRegions.ts::translateRect`,
`DragRegion.scrollTop`, and `BandGuides.tsx`'s `effectiveCardCount` all
exist to keep a band stable while the hovered region changes shape under
the cursor.

**Root cause is in the render layer, not the machine.** §5 rules that at
Board layer "hovering takes over the reservation; it doesn't add to it —
net height never changes." As built it *approximately* doesn't change: the
ghost row is a collapsed `KanbanCard` at its natural height
(`KanbanCard.tsx`'s `isGhostLike` comment: "an approximation rather than
measuring for exactly"), sitting inside a `gap-2`/`gap-1.5` flex list,
while the dead zones it replaces are exact `ghostCardHeightPx / 2` divs
outside the flex gap (`DragCarveFrame`). And `data-drag-card-count` is the
region's rendered length *including* the ghost. So a hover changes both the
region's height and its card count — precisely the two things `PopHover`
freezes — and the sticky-hover block is the visible symptom
("hover-causes-reshape-causes-unhover").

The freeze was *necessary* under Story 3's percentage-band model. When the
carve-out rework (2026-09-16) made "net height never changes" a rule, the
code kept absorbing the residual — and generalized the freeze twice (scroll,
then sibling reflow) — instead of making the rule true. `PopHover.scrollTop`'s
own comment already says nothing needs it.

Two more residuals the freeze covers, found while settling the fix: the
collapsed copy's height still varies with the assignee footer (rendered
conditionally even when ghost-like), and a terminal region with cards
reserves nothing at all — its label is an absolute overlay, so the ghost's
entry grows it. Phase 1's shortCard and reservation math (decision 3)
close both.

### F2. Layer identity is branched, not tabled

Two predicates answer "is this the Card layer": `popSession.ts::isCardKey`
(key prefix) and `region.attachToCardId !== undefined` (`dragRegions.ts`,
`popSession.ts`, `useBoardDnd.ts`). `useBoardDnd.ts` also branches on
`key.startsWith('column:')` (`regionItems`) and `startsWith('subrow:')`
(`clampToCurrentContext`). `dragRegions.ts`'s header claims every branch
keys off `attachToCardId`, "never on a separate kind enum" — `popSession.ts`
does the opposite. `parentRegionKey` is set only on Card regions, so pop-out
is `isCardKey(ctx) ? region.parentRegionKey : null` instead of
`region.parentRegionKey ?? null`. `nonCardRegionAt` and `cardRegionAt` are
one function (`find(r => r.parentRegionKey === parent && contains(r.rect,
p))`) with `parent` undefined vs. a key.

Story 4 added the Card layer by wrapping Story 3's two-state machine
(Board / locked) in guards. The sites a fourth layer must touch today:

| # | Site | Branch |
|---|---|---|
| 1 | `popSession.ts::advancePopSession` | Board vs. locked; `isCardKey` gates zoom-in; parent lookup |
| 2 | `popSession.ts::hoverFor` / `hoverForCard` | two hold-clock builders |
| 3 | `popSession.ts::popDueAt` | three clocks |
| 4 | `popSession.ts::placementFor` | Card early return |
| 5 | `popSession.ts::releaseIntent` | `isCardKey` + `attachToCardId` |
| 6 | `useBoardDnd.ts::clampToCurrentContext` | `subrow:` prefix + `attachToCardId` |
| 7 | `useBoardDnd.ts::collisionDetection` | Card hover never drives `over` |
| 8 | `useBoardDnd.ts::regionItems` | `column:` prefix |
| 9 | `useBoardDnd.ts::resolveCardDrop` | three intent kinds |
| 10 | `useBoardDnd.ts::handleDragStart` | a Stub drag bypasses the machine (`pop: null`) |
| 11 | `useBoardDnd.ts::handleDragEnd` + `boardDndUtils.ts::resolveBoardCollisions` | a separate `attached-child` path |
| 12 | `dragRegions.ts::measureDragRegions` | `card:` prefix → two constructors |

### F3. The request is resolved twice, in opposite directions from the ghost

§10: the ghost *is* the placement *is* the request *is* the pending marker.
As built that identity holds only after release. During the drag the ghost
is `popSession.ts::placementFor`; at Column layer it returns `'existing'`,
because the in-context slot lives in dnd-kit's `over` and the sortable
displacement, not in the placement. At release `useBoardDnd.ts::resolveCardDrop`
goes machine → `ReleaseIntent` → one of `resolveDropTarget` (Epic 3.2) /
`bandDropResolution` / attach → `DropResolution` → `buildMoveInput` →
`MoveItemInput` — and then `pendingPlacementFor` **re-derives a placement
from the request** to draw the marker. Two functions answer "where is the
item" from two inputs, held in agreement by `itemListOps.ts::workphaseOnlySlot`
(audit #3 records that they had drifted once already). `resolveDropTarget`
predates the machine: Story 3 layered the ghost *onto* the existing
release-time resolver instead of deriving the release from the ghost.
Story 6's gap+depth placement would need a *third* pair.

**Story 5 landmine in the same place:** `KanbanCard.tsx` decides "this row
is the attach ghost" by `session.pop` being non-null, and its own comment
records the bug that guard prevents (a Stub sibling-reorder mistaken for
the attach ghost). Story 5 makes `pop` non-null for Stub drags, inverting
the guard. With an `origin` on the session the test becomes "the placement
puts the active item under this parent *and* its origin didn't" — no
dependency on drag type.

### F4. Card regions are column-shaped with nominal fields

`dragRegions.ts::cardRegionFromKey` fills `containerId: cardId`,
`columnId: cardId`, `coveredWorkphaseIds: [wp]`, `targetWorkphaseId: wp`,
`isTerminal: false`, `cardCount: 0`. The only reader of a region's
workphase fields, `regionWorkphaseFor`, is reached after `placementFor`'s
Card early return, so `CardTarget.workphaseId` is dead — and
`useBoardDnd.ts::measureRegions` does an `items.find` per Valid card **per
pointer move** to compute it.

### F5. Measurement scope

`useBoardDnd.ts::evaluatePop` calls `measureDragRegions` on every
`pointermove`: a `querySelectorAll` over the board, and per element
`findVerticalScrollAncestor` (a `getComputedStyle` per ancestor),
`currentTranslate` (another `getComputedStyle`), and for Cards
`findParentRegionKey`. All three are *structural* facts recomputed per
sample, for every region including ones the locked layer cannot use (Board
never reads Card regions; a locked column never reads other columns). The
header comment's "a handful of getBoundingClientRect calls" undersells it.
`resolveCardDrop` re-measures the whole board at release, though
`releaseIntent`'s comment says no fresh geometry is needed there.

### F6. `clampToCurrentContext` clamps x-only for merged columns

It encodes §2's "in a merged column this reduces to a horizontal axis lock —
the context spans the column's full height." That stopped being true in the
Story 3 follow-up, when the region moved to the content-sized list box
(`BoardColumn.tsx`: "sizes to its own content rather than the column's
available height"). Today the pointer below a short merged column's last
card is *nowhere* (the exit clock runs) while the overlay follows it there.
Code and wiki disagree whichever way it's ruled.

### F7. Small

`PopHover.scrollTop` / `DragRegion.scrollTop` (unread — fixtures only);
`translateRect(rect, deltaScrollTop)` (the parameter is a top-edge delta
now); `boardDndUtils.ts::createBoardCollisionDetection` (test-only);
`scopeWorkphaseIds` (the server keeps it "only so this legacy request shape
stays valid" and maps it to a same-workphase move; the client sends it only
because a container-hover reorder has no anchor).

### F8. `DndContext` gets no modifier — a hypothesis, not a finding

"So the collision rect and `delta` stay raw." Under §1.1 rule 1 no consumer
wants the raw rect: `closestCorners` restricted to in-context candidates
picks by a rect that may be a column away, and `resolveDropSide` takes the
side from the unclamped copy — so during the exit clock `over` and the side
line can flip to an edge card the visible copy isn't near. Plausibly a
pre-rule-1 leftover from when a bare hover elsewhere *did* resolve.
Test-first (Phase 4); it may interact with the overlay tween.

### Judgment calls left alone (c)

`contextKey` + a `parentRegionKey` chain instead of a path array (same
information, once the chain is universal); `Placement.parentId?: string |
null` with presence semantics (subtle, but encapsulated by the `rendered*`
helpers — `computeChildCounts` and `freeItemOrder` are placement-aware by
*sharing* them, not by patch); `selectBoardItems` and
`getAttachedChildrenFrom` sharing a shape without sharing a function; the
terminal-anchor special case in `resolveDropTarget` (a real server
constraint; disappears in Phase 3).

---

## Decisions proposed while planning (2026-09-17) — to ratify hands-on

1. **Sortable stays; the placement is the truth and sortable is its
   renderer.** Mid-drag at Column layer the ghost row sits at `'existing'`
   and dnd-kit's displacement draws the slot (unchanged); at every other
   layer the placement draws the ghost (unchanged). What changes is that the
   *release* derives the request from a placement, never the other way
   round (Phase 3).
2. **Identity writes nothing, at every layer.** A placement that resolves to
   the list and ordinal the item already occupies sends no request and
   restores the pre-drag marker — the same path Cancel takes. This subsumes
   every per-case "nothing is written" (a covered-set member in the middle
   band; an empty/done region; hovering itself) and adds one: a Card
   released back into its own slot. Story 5's "set it back down" is this
   rule with `origin` as the placement.
3. **Both drag copies are shortCards, and the reservation derives from
   it** (Phase 1; settled with the Product Owner 2026-09-17). A
   **shortCard** is the Card's fixed-height compact mode — one pills row,
   one truncated title line, one description line always rendered (empty
   space when there's none); no assignee footer, no children, no count. It
   is a *Card mode*, not a fifth representation tier (a compact Card on
   the board is still the board's draggable unit), and it's built as a
   presentational body that knows nothing about dragging, so a later
   board density option reuses it unchanged. The dead zones read its
   height plus the list gap; `ghostCardHeightPx` leaves the panel — once
   the ghost is a fixed component, nothing about the *reservation* is
   left to tune by feel. Visible: the collapsed copies no longer vary with
   the assignee footer, and the footer isn't shown while dragging.
4. **One `kind` discriminant replaces every key-prefix and `attachToCardId`
   predicate** (Phase 0). `attachToCardId` stays as a Card region's payload,
   never as a type test.
5. **A locked Card context yields no `over`.** Today the target Card is its
   own only collision candidate, which can light `useLiveDropSide`'s side
   line on it; rule 1 says nothing in-context is previewable there. Expected
   visible change: none, or one stray line gone.
6. **F6 and F8 are Phase 4, test-first, and F6 needs a wiki ruling** before
   any code moves (below).

---

## Build order

Phases 0–3 intend **no behavior change** beyond decisions 2, 3 and 5 above.
Each phase ends green on every suite named under "Verified by" before the
next starts; a phase that can't get there stops the story for a decision.

### Phase 0 — Region kinds and a universal parent chain (mechanical)

`dragRegions.ts`

- `DragRegion` becomes a discriminated union on `kind: 'column' | 'subrow'
  | 'card'` (Story 5 adds `'descendants'`). Column/sub-row regions keep
  their fields; a Card region carries only `key`, `kind`, `rect`,
  `contentRect`, `parentRegionKey`, `attachToCardId`.
- `parentRegionKey: string | null` on **every** region — `null` for a
  column/sub-row. Pop-out is then `region.parentRegionKey` with no branch.
- `childRegionAt(regions, point, parentKey: string | null)` replaces
  `nonCardRegionAt` (`parentKey: null`) and `cardRegionAt`.
- `measureDragRegions`'s `resolveCardTarget` becomes `isValidCard(id):
  boolean`; `CardTarget` and its `items.find` per card per move go.
- `currentTranslate` runs only for `kind === 'card'` (columns and sub-rows
  never carry a sortable transform — the code already says so and applies
  it anyway).
- Delete `DragRegion.scrollTop`, `createBoardCollisionDetection`.

`popSession.ts`

- One locked branch, parametric on the region: zoom-in candidate =
  `childRegionAt(regions, pointer, contextKey)` for every locked layer (a
  Card has no child regions yet → null, as today); pop-in delay =
  `popInDelayFor(candidate.kind)` (`column`/`subrow` → `popInDelayMs`;
  `card` → `cardPopInDelayMs`); gate = `band === 'middle'` for a
  column/sub-row candidate, none otherwise; pop-out target =
  `contextRegion.parentRegionKey`.
- One `hoverFor`; band fields only for a column/sub-row candidate.
  `popDueAt`, `placementFor`, `releaseIntent` read `kind`. `isCardKey`
  goes.
- Delete `PopHover.scrollTop`.

`useBoardDnd.ts` — `clampToCurrentContext` and `regionItems` read `kind`;
`collisionDetection` reads `hover.kind` and, for a Card context, passes no
candidates (decision 5).

Tests: `test/dragFixtures.ts::region` gains `kind` + `parentRegionKey`;
`dragRegions.test.ts` / `popSession.test.ts` / `boardDndUtils.test.ts`
follow the renames; a region-shape case per kind. E2E untouched (the DOM
attribute format is unchanged; the helper's `pastColumnEnd` selector still
matches).

### Phase 1 — Make the reservation exact; delete the freeze family

Render layer first, so the machine change is a pure deletion.

- **Invariant to establish:** for every column/sub-row region, at Board
  layer, `contentRect.height` is identical whether or not the region is the
  live hover target — the ghost row occupies exactly what the dead zones
  did.
- **shortCard** (decision 3): extract today's `isGhostLike` branch of
  `KanbanCard.tsx` into a presentational body component — pills row,
  truncated title, always-rendered description line; no footer, no
  children, no count — with a fixed outer height. `KanbanCard` stays the
  sortable wrapper (node ref, listeners, drag attributes, overlays) and
  chooses the short or the full body; the DragOverlay copy is shortCard +
  tilt/shadow, the in-list ghost row is shortCard + ghost styling. **The
  dependency points drag → card, never the reverse:** the card module owns
  `SHORT_CARD_HEIGHT_PX` (a fact about the card), and nothing drag-specific
  — the reservation constant, `data-drag-overlay`, dashed/dimmed ghost
  styling, "children suppressed because dragging" — lives inside the
  component. That is what keeps a future board density mode a
  one-line change at the call site.
- **The reservation is derived, not tuned:** `ghostCardHeightPx` leaves
  `dragTuning.ts` and the panel (`loadDragTuning`'s key filter already
  ignores a stale stored value — no migration). `DragCarveFrame` reads
  `SHORT_CARD_HEIGHT_PX` (`h`) and the list gap (`gap` — the two card
  lists, `BoardColumn`'s merged list and `WorkphaseCardList`, standardize on
  one constant exported from one place). The math, so the height is
  identical hovered or not:
  - **positional region, n ≥ 1 cards:** two zones of `(h + gap) / 2`
    outside the list. The non-hovered list has `n − 1` gaps and the
    hovered one `n` — the ghost row brings `h + gap`.
  - **empty region:** one zone of `h`. The hovered list holds the ghost
    alone — no gap.
  - **terminal region with cards:** one **bottom** zone of `h + gap`,
    carrying the "Move to {name}" label. The ghost previews as the newest
    completion, i.e. last, exactly where the zone was. *As built this
    region reserves nothing — the label is an absolute overlay — and grows
    on hover; the freeze has been covering it silently.*
  - **dividers:** one card → `edge = zone height`, so the card is exactly
    the middle band; two or more → `edge = h`, bisecting the first/last
    real card, cosmetic as §5 already says.
- `DragCarveFrame` receives a **ghost-exclusive** card count (the callers
  pass `items.length` minus the active item, or the frame subtracts it via
  `useDragSession`) — so `data-drag-card-count` is the count of *other*
  cards and never changes on hover. `effectiveCardCount` goes.
- `popSession.ts`: `PopHover` shrinks to `{ regionKey, since, band?,
  poppable? }`; `hoverFor` reads the band off the live `region.contentRect`
  and live `cardCount`; `followRegionTop` and the sticky-hover block are
  deleted (the Board branch is plain `childRegionAt`). `hoverFor` still
  returns the same object when the band is unchanged, so the re-render
  short-circuit survives.
- `dragRegions.ts`: delete `translateRect`.

Tests: `popSession.test.ts`'s scroll and sibling-reflow cases become "the
band reads the live rect" cases; the sticky-hover case (if present) is
deleted with the block. **New E2E case** in `drag-column-bands.spec.ts`:
measure a region's box, hover into its middle band, measure again — equal
heights — once per reservation case (positional, empty, terminal). This is
the tripwire that keeps Phase 1's invariant honest after any future
card-chrome change, which is exactly the failure a component-owned height
can't prevent on its own.

Gate: hands-on with the Product Owner — the shortCard reads fine as both
copies, the terminal region's bottom zone reads fine, and no hover flicker
at a region's bottom edge with the sticky block gone.

### Phase 2 — Measure only what the locked layer can use

- Split `measureDragRegions` into `resolveDragStructure(root, columns,
  isValidCard)` — per drag and after each layer change: elements, keys,
  kinds, parent keys, scroll ancestors, column facts — and
  `measureRegions(structure, scope)` — per sample: rects only, for the
  context region and its children (`parentRegionKey === contextKey`; at
  Board, every column/sub-row).
- `resolveCardDrop` reads `regionsRef` instead of re-measuring at release.

Gate: suites green; an informal timing of `evaluatePop` before/after
(no test — it's a per-move cost, not a behavior).

### Phase 3 — Placement as the single source of the request

- `DragSession.origin: Placement` — set in `handleDragStart`:
  `{ workphaseId: item.workphaseId, slot: 'existing' }` for a Free Card
  (Unsorted included); Story 5 sets `{ parentId, slot: 'existing' }` for a
  Stub.
- `placementFor(session, regions, item, over)` gains an `over` argument —
  `{ anchorId, side } | 'container' | null`. Mid-drag it's called with
  `null` at Column layer (ghost at `'existing'`, sortable draws — decision
  1); at release it's called with dnd-kit's `over` and `resolveDropSide`'s
  side, and returns the anchor slot. Board-band, terminal, Card and re-drag
  (`priorPlacement`) branches are the ones it already has.
- `boardDndUtils.ts::toRequest(item, placement, board): MoveItemInput |
  null` — the one adapter from gesture terms to item terms: `parentId` →
  `{ parentId, isAttached: true, …slot }`; `workphaseId` → the covered-set
  rule (send `workphaseId` only when the item isn't already a member),
  `isAttached: false` when the origin was attached (Story 5), and the slot's
  anchor/first/last fields per Story 1's shape. Returns `null` for a
  `null` placement or an identity.
- `isIdentity(item, placement, listItems)` — same list (a `workphaseId`
  placement whose workphase is the item's own; a `parentId` placement
  matching the item's current parent) and same ordinal (`'existing'`
  always; `'first'`/`'last'`/anchor compared against the rendered list
  minus the item).
- `handleDragEnd`'s Card branch becomes: placement → `toRequest` → either
  `restorePriorPlacement` (null) or `sendItemMove(…, pending = placement)`.
- **Delete:** `ReleaseIntent`/`releaseIntent`, `DropResolution`,
  `resolveDropTarget`, `bandDropResolution`, `buildMoveInput`,
  `pendingPlacementFor`, `resolveCardDrop`, and `scopeWorkphaseIds` from the
  client's `MoveItemInput` (every positional reorder now anchors; the
  server keeps accepting the legacy shape).

Tests: the `boardDndUtils.test.ts` cases for the deleted functions are
rewritten as `placementFor(…, over)` / `toRequest` / `isIdentity` tables —
the *cases* (TC-2.11, TC-7.x, DRAG-3.x, DRAG-4.x) are preserved, the
function under test changes. E2E: unchanged, except any spec that asserted
a write for a same-slot release (decision 2) — expected none.

### Phase 4 — Test-first, and one wiki ruling

- **F8:** try the clamp modifier on `DndContext` as well (or instead), so
  `over` and the side line track the visible copy during the exit clock.
  Keep it only if the overlay tween composes cleanly; record the outcome
  either way in the `useBoardDnd.ts` comment that currently explains the
  raw rect.
- **F6, needs a Product Owner ruling first:** either (i) clamp both axes for
  every kind — §1's box rule, matching sub-rows and Cards; visible as the
  card stopping at the last card's bottom edge in a short merged column —
  or (ii) make the merged region span the column body again so §2's
  sentence holds. Recommend (i). Amend §1/§2 to match whichever wins.

---

## After this story — what Stories 5 and 6 cost

- **Story 5** = a `'descendants'` kind whose region is a Card's children
  section (`data-drag-region="descendants:<cardId>"`, `parentRegionKey =
  card:<id>`); `handleDragStart` starts a Stub drag *inside* the machine at
  that key instead of `pop: null`; the existing `attached-child` branch of
  `resolveBoardCollisions` becomes that layer's in-context collision policy
  (same code, reached through the machine); `origin` gives the set-down and
  fixes the `KanbanCard` ghost-identification guard; `popInDelayFor` gains a
  row (`descendantsPopInDelayMs`); `clampToCurrentContext` gains a row.
- **Story 6** = `computeProjection` lifted out of the sidebar into the
  Descendants within-action, returning a `{ parentId, slot: { anchorId,
  side } }` placement the same `toRequest` already sends, with the
  projected depth driving the indent indicator exactly as the sidebar's
  `indicatorDepth` does.

---

## Risks / things to watch

- **Phase 1's invariant has three cases, and each has to hold** (the
  reservation math above). If one resists — the terminal bottom zone is
  the newest and least tried — keep the freeze for that one case rather
  than everywhere; the E2E invariant case per region kind is the real test
  of whether the freeze is still needed anywhere.
- **Phase 3 is the largest test churn.** Do it as one commit with the
  rewritten unit tables, not incrementally — a half-migrated resolver is
  worse than either endpoint.
- **Stale element refs in Phase 2.** React can remount a region's element
  across a layer change (the ghost migrates lists; reservations toggle).
  Re-resolving structure after every layer change, not only at drag start,
  is the mitigation; if it proves flaky, per-sample `querySelectorAll` with
  per-drag caching of the *computed-style* facts alone still removes most
  of the cost.
- **Coverage gate** (`architecture_testing`): deleting code with its tests
  is fine; deleting code and keeping the tests is not. Each phase's
  deletions take their tests with them or rewrite them.
- **Feel must not move.** No threshold, band or clamp changes outside Phase
  4, and Phase 4's are ruled before built.

---

## Drift to fix as part of this story (wiki / comments)

- Wiki §2 "in a merged column this reduces to a horizontal axis lock — the
  context spans the column's full height" — contradicts §1's content-sized
  box and `BoardColumn.tsx`. Resolved by Phase 4's F6 ruling.
- `dragRegions.ts` header: "never on a separate kind enum" — reversed by
  Phase 0.
- `popSession.ts` `PopHover.scrollTop` comment ("carried along for whatever
  else keys off it") — deleted with the field.
- `dragRegions.ts::measureDragRegions` header: "a handful of
  getBoundingClientRect calls per pointer move" — rewritten by Phase 2.
- `popSession.ts::releaseIntent` "needs no fresh geometry at release time"
  vs. `resolveCardDrop` re-measuring — resolved by Phase 2.
- `KanbanCard.tsx` `isGhostLike` "accepts as an approximation" and wiki §5a
  "keeps that approximation close" — rewritten by Phase 1: the reservation
  is exact. §5a names the mode **shortCard**, adds "no assignee footer" to
  its list, and drops the approximation language.
- Wiki §5 "The reservation height is a dev/test-panel value … a starting
  point to tune" and §3.1's panel list (`ghostCardHeightPx`) — the
  reservation is shortCard's height plus the list gap, three cases as in
  Phase 1; not a panel value.
- Naming conventions (`docs/wiki` vocabulary, and the `naming_conventions`
  note): **shortCard** is a Card *mode* — the fixed-height compact form
  used for both drag copies, available to a board density option later —
  not a fifth tier alongside Stub / Card / Sheet / Headline.
- CLAUDE.md's "Pop State Machine…" section: the frozen-rect and
  `followRegionTop` paragraph, `nonCardRegionAt`/`cardRegionAt`, and the
  `resolveDropTarget`/`bandDropResolution`/`pendingPlacementFor` names —
  updated at the end of Phase 3.

---

## Out of scope

Stories 5–9; dropping sortable (Option A of the draft — rejected, see
above); any threshold or band retune; Story 8's visual treatment; the
sidebar's own drag code (Story 6 touches it, this story doesn't); the
`DragTuningPanel` beyond removing readouts of deleted fields.

---

## As built

*(Empty until the story is done.)*

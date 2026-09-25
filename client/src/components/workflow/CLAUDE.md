# Board Drag Gesture — Working Notes

Full rules and rationale: `docs/wiki/board-drag-interaction/README.md` (contexts,
popping, drop resolution) and `docs/wiki/item-attachment/README.md` (attach/detach
consequences). This file is the survival kit — read it before changing anything in
this directory, then go to the wiki for the "why."

## The mental model

- **Board → a Column/sub-row → one of its own Cards → its own Descendants section**
  is a strict stack, never more than one layer deep from wherever the cursor is. A
  drag starts in exactly one **context** — a Free item's pickup region for a Card, or
  (Story 5) `descendantsRegionKey(containingCardId)` deterministically for a Stub,
  never hit-tested — and is either **locked** to it (DragOverlay clamped, cursor
  roaming inside) or **popped out** (cursor left past a delay/distance threshold,
  card follows the cursor at the parent layer).
- **A release always commits the locked layer's own within-action** — never a foreign
  region's — regardless of where the bare cursor rests. Column/sub-row and Descendants
  alike: the drop lands where the ghost is — dnd-kit's sortable shuffle decides its
  slot (the dragged row's own slot is a collision candidate too, as in stock dnd-kit),
  and the dragged copy, above or below the ghost's middle, picks which neighbor names
  it: "after" the row above, "before" the row below
  (`dragCollision.ts::dropAnchorFor`, the one function the blue line and the release
  both read, generalized to Stub rows in Story 6 Phase D). Card: `origin` itself ("set
  back down") for the drag's own containing Card, else append as the last child (an
  item from outside, or a Story 5 reparent — full anchor+side placement _among_ a
  Card's Stubs happens one layer further in, at Descendants). Descendants: §7's gap +
  depth rule — the named neighbor picks the **gap**, horizontal offset from a seeded
  depth picks the **depth** (`useBoardDnd.ts`'s live projection,
  `DragSessionContext.ts::DescendantsProjection`), and release resolves the placement
  via `lib/hierarchyPlacement.ts::resolvePlacement`; a foreign item's _first_ entry
  into a section takes `region.cardId` as its parent, never `origin`'s own (that's the
  same-section case — a Stub already home there). An over-cap tab state (§7.2) is
  reachable but commits nothing on release, the one exception to §3.2. A dragged
  Stub's own descendants stay rendered below it but travel with it, so `dropAnchorFor`
  steps past them (`travelingRowsFor` — Descendants only; at a column a Free
  descendant is a real anchor). The carried Stub shows the projected depth by
  indenting an inner box (`KanbanCard.tsx::overlayStubIndent`, provisional until
  Story 8) — never its root, so nothing dnd-kit measures changes. **Only at Board
  layer** does the hover **band** (top/middle/bottom) decide.
- **Every item row shares one dnd-kit registration** (decision 4, 2026-09-21):
  `data: {type: 'item', role: 'card' | 'stub', parentId?}`, never a `type` that
  differs between a Stub's row and a popped-out Card row for the same id — the hazard
  that guards against is `active.data.current` lagging a mid-drag remount as a Stub's
  row unmounts from its Descendants section and remounts as a Card row. Every policy
  decision (`resolveBoardCollisions`, the pop machine) reads the session's own state
  instead — never `role`/`parentId` off the _active_ row, only off a _droppable_ one.
- **The ghost is a `Placement`, never a position** (`itemListOps.ts`). Nothing in
  `items` mutates during a drag. On release the placement becomes the pending marker;
  `dragRequest.ts::toRequest` turns it into the actual API request, and `isIdentity`
  recognizes a no-op (covered-set member dropped back on its own workphase) so nothing
  is sent.
- **Reindex disclosure must be folded in, never merged alone.** Any item-write response
  may carry `reindexed: {id, position}[]`; every write path folds it through
  `itemListOps.ts::completeItemWrite` (pairs first, written item last) before clearing
  the placement.

## Where each concern lives (pure, unit-tested modules)

- `popSession.ts` — the pop state machine (locked / popped-out), two states per layer.
  No placement rules of its own (Story 6.1 Phase 1, C-2) — `placement.ts` reads its
  `PopSession` but never writes it.
- `placement.ts` — the machine's placement rules: `placementRegion(session, regions)`
  is the one answer to "which region is the placement against" — `placementFor` and
  the hook's release both read it. `overlayFormFor` reads the same result to decide
  which form the carried copy draws as (Stub vs. shortCard).
- `dragRegions.ts` — regions (Board/Column/sub-row/Card/Descendants). Structural
  resolution (`resolveDragStructure`) runs once per drag; live rects (`measureRegions`)
  run per sample. `isCardList(region)` is the one kind predicate: a column or sub-row
  — a flat list of Free items with bands and a workphase — vs. anything else. Never
  write `kind !== 'card'` to mean it. A `descendants` region resolves for the drag's
  own `originCardId` unconditionally, and for any other Valid Card too (Story 6 Phase
  D) — the same `isValidCard` gate a `card:` region already uses, which is also what
  keeps an invalid target (cycle-forming, depth-capped) from ever becoming a zoom-in
  candidate, no separate check needed. `childRegionAt` finds it from a locked Card's
  own context. `dragRegionProps(key)` is the one "register this element as a drag
  region" idiom, spread onto a region's own root element.
- `dragBands.ts` — the pixel drop-band math (§5), split out of `dragRegions.ts` (Story
  6.1 Phase 1, C-4): `reservationFor`/`bandBoundaries`/`bandFor` turn a region's own
  `isTerminal`/`cardCount` into boundaries; `distanceOutside` is the pop threshold's
  optional distance term; `clipToVisible` clips a region's rect to a scrolling
  ancestor's visible box.
- `lib/hierarchyPlacement.ts` — the Descendants layer's own placement rule (§7),
  table-generic and shared with the project sidebar: `flattenHierarchy` (a Card's
  descendants as `Row[]`, the dragged subtree excluded), `gapIndexFor`/
  `depthRangeFor`/`resolvePlacement` (§7.1's gap + depth walk). Pure, no React, no
  dnd-kit — never imports `Item`. `useBoardDnd.ts`'s live projection and
  `useBoardDnd.ts::releaseDescendants` are its board-side callers;
  `itemListOps.ts::descendantsChildrenOf` is the `getAttachedChildren` adapter both
  need.
- `dragClassification.ts` — classifies every item against the carried one, once per
  drag start: valid / cycle-forming / depth-capped / inert. A Stub is classified
  exactly like a Card (Story 5) — no interim exclusion.
- `itemListOps.ts` — list selectors, ordinal placements, the reindex fold-in, the
  inversion tripwire.
- `dragCollision.ts` — collision detection and anchor naming, split out of
  `boardDndUtils.ts` (Story 6.1 Phase 1, C-3): `resolveBoardCollisions`,
  `dropAnchorFor`/`travelingRowsFor` (the anchor + lean), row-data typing
  (`itemRowData`/`isCardRow`/`isStubRow`).
- `dragRequest.ts` — the request-shape half of the same split: `toRequest` (placement
  → API request), `isIdentity` (recognizes a no-op), `sendItemMove` (the one "send,
  fold in, or resync" block).
- `dragTuning.ts` — every threshold/band/overlay value, tunable at runtime via
  `DragTuningPanel.tsx` (toolbar → "Drag tuning"), persisted in `localStorage` under
  `kanban_drag_tuning`. `descendantsPopInDelayMs` (Story 6 Phase D) is the fourth
  clock, Card → Descendants — duration-only, no dwell/cue split.
- `useBoardDnd.ts` — composes all of the above: clocks, DOM measurement, dnd-kit
  plumbing. Also owns the Descendants layer's live projection (seed at pickup or at
  the zoom-in transition, refreshed every sample from the named neighbor + pointer x,
  cleared on pop-out) and its own release path (`releaseDescendants`) — the one
  mid-drag/release asymmetry in the file: the _ghost_ still comes from
  `placement.ts::placementFor`'s Descendants branch (a static preview — `origin`/
  `priorPlacement` for the same section, an append for a foreign item — since `over`
  never resolves there any more), the _release_ from `resolvePlacement` against the
  final projection.
- `DragSessionContext.ts` — the whole drag's state (`activeItem`, `classification`,
  `pop`, `priorPlacement`, `origin`, `containingCardId`, `projection`) plus
  `PlacementsContext`, read via `useDropTargetState(itemId)`/`useIsPending` — no prop
  drilling. `pop`/`origin` are non-optional as of Story 5 — every item drag runs the
  machine; `containingCardId` is null for a Free Card drag, the section-root Card for
  a Stub's; `projection` (`DescendantsProjection`, Story 6 Phase D) is null whenever
  the drag isn't currently locked at a `descendants:` context.

## Testing conventions

- Thresholds/bands are deliberately unlocked, tuned by feel. Automated tests assert
  **reachability and write correctness**, never a timing sequence — timing-dependent
  cases stay manual.
- E2E specs seed drag tuning via `tests/helpers/dragGesture.ts::seedDragTuning`
  (presets `NO_POP`/`POP_OUT_ONLY`/`SUSTAINED`) and read thresholds back from the
  value it returns, never a literal; import region keys from `dragRegions.ts` rather
  than re-spelling `column:`/`subrow:`/`descendants:`. Use `dragGesture.ts`
  (`pickUp`/`hoverTo`/`release`/`cancel`/`dragTo`/`awaitDragContext`/`awaitPoppedOut`)
  — never hand-roll a drag or read `boundingBox()` directly for a drop target.
- The board root carries `data-drag-state` (`locked`/`popped-out`), `data-drag-context`,
  and (Story 6 Phase D) `data-drag-projection` (`"<gap>:<depth>:<valid>"`, present only
  while locked at a `descendants:` context) for tests; Cards/Stubs carry `data-item-id`
  - `data-drop-state` + (the active row only, while over cap) `data-placement-valid`.

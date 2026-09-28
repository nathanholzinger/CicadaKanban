# Board Drag Gesture — Working Notes

The rules and their reasons are in the wiki's `board-drag-interaction` page (contexts,
popping, drop resolution) and its `item-attachment` page (what attaching and detaching
do). This file is the map: read it before changing anything in this directory, then go
to the wiki for the "why". What each module owns in detail is in its own header.

## The mental model

- **Board → a Column/sub-row → one of its own Cards → its own Descendants section**
  is a strict stack, never more than one layer deep from wherever the cursor is. A
  drag starts in exactly one **context** — a Free item's pickup region for a Card, or
  `descendantsRegionKey(containingCardId)` for a Stub, deterministically, never
  hit-tested — and is either **locked** to it (DragOverlay clamped, cursor roaming
  inside) or **popped out** (cursor left past a delay/distance threshold, card follows
  the cursor at the parent layer).
- **A release always commits the locked layer's own within-action** — never a foreign
  region's — regardless of where the bare cursor rests. Column/sub-row and Descendants
  alike: the drop lands where the ghost is — dnd-kit's sortable shuffle decides its
  slot (the dragged row's own slot is a collision candidate too, as in stock dnd-kit),
  and the dragged copy, above or below the ghost's middle, picks which neighbor names
  it: "after" the row above, "before" the row below
  (`dragCollision.ts::dropAnchorFor`, which every reader — the blue line, the pop
  machine, the release — asks the same way, through `namedAnchorFor`; a bare, non-row
  `over` names no anchor at all). Card: `origin` itself ("set back down") for the
  drag's own containing Card, else append as the last child (an item from outside,
  including a Stub from another Card's section — full anchor + side placement _among_
  a Card's Stubs happens one layer further in, at Descendants). Descendants: the gap +
  depth rule (wiki board-drag-interaction §7) — the named neighbor picks the **gap**,
  horizontal offset from a seeded depth picks the **depth** (`descendantsProjection.ts`,
  `DragSessionContext.ts::DescendantsProjection`). The seed is where the ghost already
  was, so zooming in never moves it: a Stub's own slot, or the Card's last child for an
  item from outside. Release resolves the placement via
  `lib/hierarchyPlacement.ts::resolvePlacement`, and writes nothing at the Stub's own
  gap and depth; a foreign item's _first_ entry
  into a section takes `region.cardId` as its parent, never `origin`'s own (that's the
  same-section case — a Stub already home there). An over-cap tab state is reachable
  but commits nothing on release, the one exception to "a release always commits"
  (wiki board-drag-interaction §3.2, §7.2). A dragged Stub's own descendants stay
  rendered below it but travel with it, so `dropAnchorFor` steps past them
  (`travelingRowsFor` — Descendants only; at a column a Free descendant is a real
  anchor). The carried Stub shows the projected depth by indenting an inner box
  (`KanbanCard.tsx::overlayStubIndent`; the look is a placeholder) — never its root, so
  nothing dnd-kit measures changes. **Only at Board layer** does the hover **band**
  (top/middle/bottom) decide.
- **Every item row shares one dnd-kit registration:**
  `data: {type: 'item', role: 'card' | 'stub', parentId?}`, never a `type` that
  differs between a Stub's row and a popped-out Card row for the same id — the hazard
  that guards against is `active.data.current` lagging a mid-drag remount as a Stub's
  row unmounts from its Descendants section and remounts as a Card row. Every policy
  decision (`resolveBoardCollisions`, the pop machine) reads the session's own state
  instead — never `role`/`parentId` off the _active_ row, only off a _droppable_ one.
  A Card row and a Stub row both register through `dragChrome.tsx::useItemRow`.
- **The ghost is a `Placement`, never a position** (`itemListOps.ts`). Nothing in
  `items` mutates during a drag. On release the placement becomes the pending marker;
  `dragRequest.ts::toRequest` turns it into the actual API request, and `isIdentity`
  recognizes a no-op (covered-set member dropped back on its own workphase) so nothing
  is sent.
- **Reindex disclosure must be folded in, never merged alone.** Any item-write response
  may carry `reindexed: {id, position}[]`; every write path folds it through
  `itemWriteReconciliation.ts::completeItemWrite` (pairs first, written item last)
  before clearing the placement.

## Where each concern lives

The drag gesture's pure, unit-tested modules:

- `popSession.ts` — the pop state machine: locked or popped out at each layer, and the
  clocks that move a drag between them. It holds no placement rules.
- `placement.ts` — the ghost's placement at every layer, and which form the carried
  copy draws as.
- `dragRegions.ts` — the regions (Board/Column/sub-row/Card/Descendants): their keys,
  their structure (resolved once per drag), and their live rects (measured per sample).
- `dragBands.ts` — the pixel band and reservation math for a card-list region.
- `dragCollision.ts` — row-data typing, collision detection, and naming the anchor a
  drop lands beside.
- `dragRequest.ts` — turning a placement into the API request, and sending it.
- `dragClassification.ts` — classifying every item against the carried one, once per
  drag start.
- `descendantsProjection.ts` — the Descendants layer's live gap and depth.
- `dragOverlayGeometry.ts` — the DragOverlay's own geometry: its width, its re-anchor
  across a form switch, and its clamp to the current context.
- `itemListOps.ts` — list selectors and ordinal placements over the board's items.
- `itemWriteReconciliation.ts` — folding an item write's response into the item state.
- `dragTuning.ts` — every tunable threshold, band and overlay value, and where they
  persist.

The hooks and contexts that run it:

- `useBoardDnd.ts` — composes all of the above: clocks, DOM measurement, dnd-kit
  plumbing.
- `DragSessionContext.ts` — the whole drag's state, read through hooks instead of
  props.
- `DragTuningContext.ts` — the live tuning values, for the components that draw
  thresholds and bands.
- `usePendingGhostGuard.ts` — keeps the ghost in place while an earlier write is
  still pending.
- `useSnapTween.ts` — the eased snap when a pop moves the carried copy's clamp target.

The board's own state, outside the gesture:

- `useItemManagement.ts` — the item state and the per-item write tracker.
- `useBoardManagement.ts`, `useColumnManagement.ts`, `useWorkphaseManagement.ts` —
  board, column and workphase CRUD for `BoardView.tsx`.

Outside this directory: `lib/hierarchyPlacement.ts` holds the Descendants layer's gap +
depth rule, shared with the project sidebar; `components/dragChrome.tsx` holds a row's
drag registration and its live drop-side line.

## One way to do each of these

- **Which region the placement is against:** `placement.ts::placementRegion`. The
  mid-drag ghost and the release both read it.
- **What kind a region is:** `dragRegions.ts::isCardList` — a column or sub-row (a
  flat list of Free items with bands and a workphase) against anything else. Never
  write `kind !== 'card'` to mean it.
- **Registering an element as a drag region:** `dragRegions.ts::dragRegionProps`,
  spread onto the region's own root element.
- **Reading a region key:** `dragRegions.ts::parseRegionKey`, with `descendantsCardIdOf`
  for "is this context a section, and whose", and `CARD_LIST_REGION_SELECTOR` for the
  column/sub-row DOM query. Never `startsWith`, `slice` or `split` a key by hand.
- **Row data:** written only by `dragCollision.ts::itemRowData`/`columnData`, read
  only through `isItemData`/`isColumnData`/`isCardRow`/`isStubRow`. Never read
  `data.type` by hand.
- **The anchor a drop names:** `dragCollision.ts::namedAnchorFor`, the one call shape
  the blue line, the pop machine and the release all use.
- **The rows that travel with the dragged item:** `dragClassification.ts`'s
  `subtreeIds`, read by both the projection's exclusion and
  `dragCollision.ts::travelingRowsFor`. Never re-derive it by filtering for
  cycle-forming states.
- **"Is this a legal parent?":** `dragClassification.ts::isValidParent`. The region
  gate and the over-cap cue both read it, so they can't disagree.
- **A Card's descendants as rows:** `itemListOps.ts::hierarchyRows`, the one walk. The
  projection drops the dragged subtree from the same list rather than walking again.
- **Starting and ending a drag:** `useBoardDnd.ts::beginDragAt` starts a Card's drag
  and a Stub's alike, from the item as the board draws it; `useBoardDnd.ts::endSession`
  is the one end.
- **Sending a move:** `dragRequest.ts::sendItemMove`, the one "send, fold in, or
  resync" block, reached through `useBoardDnd.ts::commitRelease`.
- **Short-card sizing:** `cardMetrics.ts::SHORT_CARD_METRICS`, the one value the pop
  machine and the band guides both pass to `dragBands.ts`.
- **Which way dependencies run:** `placement.ts` reads the pop machine's session but
  never writes it; `itemWriteReconciliation.ts` reads `itemListOps.ts`, never the
  reverse.

## Testing conventions

- Thresholds/bands are deliberately unlocked, tuned by feel. Automated tests assert
  **reachability and write correctness**, never a timing sequence — timing-dependent
  cases stay manual.
- E2E specs seed drag tuning via `tests/helpers/dragGesture.ts::seedDragTuning`
  (presets `NO_POP`/`POP_OUT_ONLY`/`SUSTAINED`) and read thresholds back from the
  value it returns, never a literal; import region keys from `dragRegions.ts` rather
  than re-spelling `column:`/`subrow:`/`descendants:`. Unit tests of the pop machine
  and placement share one board and runner (`client/src/test/popFixtures.ts`:
  `threeColumnBoard`, `POP_TEST_TUNING`/`POP_TEST_METRICS`, `runPop`, `hoverAt`).
  Use `dragGesture.ts`
  (`pickUp`/`hoverTo`/`release`/`cancel`/`dragTo`/`awaitDragContext`/`awaitPoppedOut`)
  — never hand-roll a drag or read `boundingBox()` directly for a drop target.
- The board root carries, for tests: `data-drag-state` (`locked`/`popped-out`),
  `data-drag-context`, `data-drag-band` (the hovered band, Board layer only),
  `data-drag-zoom-candidate`/`data-drag-zoom-phase` (the Card named for a zoom-in and
  its hold stage), and `data-drag-projection` (`"<gap>:<depth>:<valid>"`, present only
  while locked at a `descendants:` context). Cards/Stubs carry `data-item-id` and
  `data-drop-state`, plus `data-placement-valid` on the active row while over cap.

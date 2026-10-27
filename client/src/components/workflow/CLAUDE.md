# Board Drag Gesture — Working Notes

The rules and their reasons are in the wiki's `board-drag-interaction` page (contexts,
popping, drop resolution), its `hierarchy-placement` page (the gap-and-depth rule the
Descendants layer shares with the project sidebar) and its `item-attachment` page (what
attaching and detaching do). This file is the map: read it before changing anything in
this directory, then go to the wiki for the "why". What each module owns in detail is in
its own header.

## The mental model

- **Board → a Column/sub-row → one of its own Cards → its own Descendants section**
  is a strict stack, never more than one layer deep from wherever the cursor is. A
  drag starts in exactly one **context**: a Stub's is
  `descendantsRegionKey(containingCardId)`, deterministically; a Free Card's is the
  column or sub-row under the cursor at pickup (a hit test,
  `useBoardDnd.ts::beginDragAt`), or none from Unsorted. It is either **locked** to it
  (DragOverlay clamped, cursor roaming inside) or **popped out** (cursor left past a
  delay/distance threshold, card follows the cursor at the parent layer).
- **A release always commits the locked layer's own within-action** — never a foreign
  region's — regardless of where the bare cursor rests. Column/sub-row and Descendants
  alike: the drop lands where the ghost is — dnd-kit's sortable shuffle decides its
  slot (the dragged row's own slot is a collision candidate too, as in stock dnd-kit),
  and the dragged copy, above or below the ghost's middle, picks which neighbor names
  it: "after" the row above, "before" the row below
  (`dragCollision.ts::dropAnchorFor`, which every reader — the blue line, the pop
  machine, the release — asks the same way, through `namedAnchorFor`; a bare, non-row
  `over` names no anchor at all). A done list is the exception: it has no slot to
  choose, so its rows never slide (`CardList.tsx`'s no-shuffle strategy), and the
  ghost stays where a release will land it (wiki board-drag-interaction §2, rule 6).
  Card: `origin` itself ("set back down") for the
  drag's own containing Card, else append as the last child (an item from outside,
  including a Stub from another Card's section — full anchor + side placement _among_
  a Card's Stubs happens one layer further in, at Descendants). Descendants: the gap +
  depth rule (wiki hierarchy-placement §1, as wiki board-drag-interaction §7.1 applies it) —
  the named neighbor picks the **gap**, horizontal offset from a seeded depth picks the
  **depth** (`descendantsProjection.ts`,
  `DragSessionContext.ts::DescendantsProjection`). The seed is where the ghost already
  was, so zooming in never moves it: a Stub's own slot, or the Card's last child for an
  item from outside. Release writes the last sample's resolved placement (the
  projection's `resolved` field; `lib/hierarchyPlacement.ts::resolvePlacement` runs per
  sample), and nothing at the Stub's own
  gap and depth; a foreign item's _first_ entry
  into a section takes `region.cardId` as its parent, never `origin`'s own (that's the
  same-section case — a Stub already home there). An over-cap tab state is reachable
  but commits nothing on release, the one exception to "a release always commits"
  (wiki board-drag-interaction §3.2, §7.2). A dragged Stub's own descendants stay
  rendered below it but travel with it, so `dropAnchorFor` steps past them
  (`travelingRowsFor` — Descendants only; at a column a Free descendant is a real
  anchor). A section can draw fewer levels than it holds: below a row at the last
  shown level, an **overflow row** stands for its hidden children. It is a row of the
  section's shuffle, so it can be the named neighbor, and the projection turns that
  into a gap among *all* the rows (`descendantsProjection.ts::gapForAnchor`) and
  offers no depth past the overflow row's level. Nothing past the projection sees its
  id. An overflow row is not an item: nothing drags from it, and a press on it goes no
  further than the row, so it doesn't pick up the Card either.
  **The hierarchy modal is that same layer, drawn whole.** While it's open (`BoardView.tsx`
  holds which Card's, `HierarchyModalContext.ts`), its list carries the Card's Descendants
  region key and names the Card as its parent region, since it isn't inside the Card's
  element; the Card's own section draws static and is no region, so one element carries the
  key and each item registers one row. The drop math draws every level there
  (`useBoardDnd.ts::levelsDrawnAt`). Its own `descendantsSectionRect` and Card id bound the
  collision candidates: the modal sits over the board, so another Card's rows can lie inside
  its box. Leaving its box is the usual pop out of Descendants and closes it; a drag that ends
  in it, by a release or a cancel, leaves it open. A Stub whose own slot the section doesn't
  draw (picked up in the modal and pulled back out) comes back into the section as an item
  from outside does: the projection's seed is the last gap, `projection.slotHidden`, and
  `placement.ts::placementFor` previews it as the Card's last child. The list is the layer's
  region and the dialog its bounds (`dragRegions.ts::DRAG_BOUNDS_ATTR`, read into the region's
  `boundsRect`), so a cursor over the header is still in the modal. A click opens it centered.
  **A hold during a drag opens it under the cursor.** While the ghost sits directly above or
  below an overflow row, at its level (`DescendantsProjection.overflowBeside`, which
  `descendantsProjection.ts::modalHoldTarget` turns into the hold's target, and not in an
  over-cap state), a Card's zoom-in shape runs, a dwell and then a cue
  (`popSession.ts::advanceModalHold`, `PopSession.modalHold`). It is keyed on that gap, depth and side, never on
  the named neighbor, which flips between the row's owner and the overflow row while the gap
  stays. It runs only with the cursor inside the layer, is not a layer change, and the context
  key stays the Card's Descendants. When it has run its length `useBoardDnd.ts::evaluatePop`
  opens the modal with the cursor (`BoardView.tsx::openHierarchyModalAt`); the modal places
  itself in a layout effect (`HierarchyModal.tsx`, the pure geometry in `modalPlacement.ts`):
  the spot the ghost held under the cursor, the list scrolled to bring it there, the dialog held
  inside the window. It then reports what the cursor reads against its rows, the gap and the
  depth from the cursor's x against its own indents, which `useBoardDnd.ts::readModalPlacement`
  reseeds the projection with (`descendantsProjection.ts::reseedProjection`), so a modal that
  fitted keeps the ghost's spot and a shifted one reads where the cursor is. The carried Stub
  shows the projected depth by indenting an inner box
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
  clocks that move a drag between them, and the hold that opens the hierarchy modal, which
  moves it nowhere. It holds no placement rules.
- `placement.ts` — the ghost's placement at every layer, and which form the carried
  copy draws as.
- `dragRegions.ts` — the regions' vocabulary (Board/Column/sub-row/Card/Descendants):
  their kinds, keys and DOM attributes, and hit-testing by containment.
- `dragStructure.ts` — the regions read off the live DOM: their structure (resolved at
  pickup, and again after a layer change or when a remount outdates it) and their live
  rects (measured per sample).
- `dragBands.ts` — the pixel band and reservation math for a card-list region.
- `dragCollision.ts` — row-data typing, collision detection, and naming the anchor a
  drop lands beside.
- `dragRequest.ts` — turning a placement into the API request, and sending it.
- `dragClassification.ts` — classifying every item against the carried one, once per
  drag start.
- `descendantsProjection.ts` — the Descendants layer's live gap and depth, placed
  against the whole section whatever levels it draws, and the overflow row the ghost is
  beside.
- `modalPlacement.ts` — where the hierarchy modal opens during a drag and what the cursor
  reads there: the dialog's position and the list's scroll, the gap a row under the cursor
  gives the ghost, and the depth at the cursor's x. Numbers in, numbers out; the modal
  measures the DOM.
- `dragOverlayGeometry.ts` — the DragOverlay's own geometry: its width, its re-anchor
  across a form switch, and its clamp to the current context.
- `itemListOps.ts` — list selectors and ordinal placements over the board's items, and
  the rows a Card's section draws (`sectionEntries`).
- `itemWriteReconciliation.ts` — folding an item write's response into the item state.
- `dragTuning.ts` — every tunable threshold, band and overlay value, and where they
  persist.

The hooks and contexts that run it:

- `useBoardDnd.ts` — composes all of the above: clocks, DOM measurement, dnd-kit
  plumbing. A column dropped on another goes to `useColumnManagement.ts::onColumnDrop`,
  which is handed `resyncBoard` to call if the save fails, so that a live item drag ends
  before the reload.
- `DragSessionContext.ts` — the whole drag's state, read through hooks instead of
  props.
- `DragTuningContext.ts` — the live tuning values, for the components that draw a drag
  cue from them: a Card's zoom-in cue, timed by `cardPopInDelayMs`.
- `HierarchyModalContext.ts` — which Card's hierarchy modal is open, and how to open and
  close it. `BoardView.tsx` owns the state, which `useBoardDnd.ts` also reads and closes.
- `usePendingGhostGuard.ts` — keeps the ghost in place while an earlier write is
  still pending.
- `useSnapTween.ts` — the eased snap when a pop moves the carried copy's clamp target.
- `useLatest.ts` — the latest value of a hook's input in a ref, for the callbacks that
  outlive one render.

The board's own state, outside the gesture:

- `useItemManagement.ts` — the item state and the per-item write tracker.
- `useBoardManagement.ts`, `useColumnManagement.ts`, `useWorkphaseManagement.ts` —
  board, column and workphase CRUD for `BoardView.tsx`; `useColumnManagement.ts` also
  holds the column-reorder drop.

Outside this directory: `lib/hierarchyPlacement.ts` holds the Descendants layer's gap +
depth rule, shared with the project sidebar; `components/dragChrome.tsx` holds a row's
drag registration, its live drop-side line, and the looks the drag shares (the
active-context outline, the drop line's shape).

## One way to do each of these

- **Which region the placement is against:** `placement.ts::placementRegion`. The
  mid-drag ghost and the release both read it.
- **What kind a region is:** `dragRegions.ts::isCardList` — a column or sub-row (a
  flat list of Free items with bands and a workphase) against anything else. Never
  write `kind !== 'card'` to mean it.
- **Registering an element as a drag region:** `dragRegions.ts::dragRegionProps`,
  spread onto the region's own root element. An element that isn't inside its parent
  region's (the hierarchy modal's list) passes the parent's key as `parentKey`. A test
  builds the elements it reads with `client/src/test/dragFixtures.ts::regionEl`.
- **Reading a region key:** `dragRegions.ts::parseRegionKey`, with `descendantsCardIdOf`
  for "is this context a section, and whose", and `CARD_LIST_REGION_SELECTOR` for the
  column/sub-row DOM query. Never `startsWith`, `slice` or `split` a key by hand.
- **Row data:** written only by `dragCollision.ts::itemRowData`/`columnData`, read
  only through `isItemData`/`isColumnData`/`isCardRow`/`isStubRow`/`isOverflowRow`.
  A section's row is a Stub or an overflow row (`isSectionRow`), and carries the Card whose
  section it is a row of (`sectionCardId`). Never read `data.type` by hand.
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
- **Where the hierarchy modal opens during a drag:** `modalPlacement.ts`
  (`placeModal`, `slotForGap`, `gapAtSlot`, `depthAtCursor`). The same functions place it and
  read it, so a modal that fitted reads back the spot it was placed for.
- **What the section draws:** `itemListOps.ts::sectionEntries` over those rows, cut at
  `shownLevels(tuning.sectionLevels)`. The render and the drop math both read the level
  count through `shownLevels`, so they can't disagree about which levels exist. The
  overflow row's id is `overflowRowId(ownerId)`, read back with `overflowOwnerOf`.
- **The latest value of a prop or callback in a ref:** `useLatest.ts::useLatest`.
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
  `threeColumnBoard`, which also holds column A's two Cards and one Card's section;
  `POP_TEST_TUNING`, which pins the values the cases depend on; `POP_TEST_METRICS`;
  `step`, `runPop`, `hoverAt`).
  Use `dragGesture.ts`
  (`pickUp`/`hoverTo`/`release`/`cancel`/`dragTo`/`awaitDragContext`/`awaitPoppedOut`,
  and `awaitModalHold` for the modal hold) — never hand-roll a drag or read `boundingBox()`
  directly for a drop target. What a spec asserts about where something is drawn, such as the
  ghost under the cursor, it reads with `paintedBoxOf`, which includes the shuffle's
  transforms where `boxOf` does not.
- What needs `useBoardDnd`'s live session, such as a reload landing mid-drag, is tested by
  rendering the hook: `useBoardDnd.test.ts` starts a drag on a board with no columns,
  which begins in no context, and calls the hook's handlers with the events they read.
  The gesture itself is tested through the pure modules and the E2E specs.
- The board root carries, for tests: `data-drag-state` (`locked`/`popped-out`),
  `data-drag-context`, `data-drag-band` (the hovered band, Board layer only),
  `data-drag-zoom-candidate`/`data-drag-zoom-phase` (the Card named for a zoom-in and
  its hold stage), `data-drag-modal-hold` (`"<overflow row owner id>:<dwell|cue>"`, the hold
  that opens the hierarchy modal, absent while none runs), and `data-drag-projection` (`"<gap>:<depth>:<valid>"`, the gap
  counted among all the section's rows, present only while locked at a `descendants:`
  context). Cards/Stubs carry `data-item-id` and
  `data-drop-state`, `data-pending` while their write is in flight, and
  `data-placement-valid` on the active row while over cap. An overflow row carries
  `data-overflow-row` (its owner's id) and no `data-item-id`. The hierarchy modal is a
  `role=dialog` named `Hierarchy of <title>`, whose rows carry `data-item-id` (the section's
  rows under it draw with none). The carried copy carries
  `data-drag-overlay` (`dragRegions.ts::DRAG_OVERLAY_ATTR`, which the E2E helper's
  "drag finished" wait counts down) and `data-drag-overlay-form`, and a Card that is
  the locked context `data-active-context`. A region's element carries
  `data-drag-region` (its key), a card list's also `data-drag-card-count`, and the
  carve-out's zones and dividers `data-carve-zone` and `data-carve-divider`.

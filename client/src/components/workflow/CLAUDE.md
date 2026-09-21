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
  region's — regardless of where the bare cursor rests. Column/sub-row: dnd-kit's
  `over` decides anchor+side. Card: `origin` itself ("set back down") for the drag's
  own containing Card, else append as the last child (an item from outside, or a
  Story 5 reparent — full anchor+side placement _among_ a Card's Stubs is Story 6's).
  Descendants: the interim within-action is a same-parent sibling reorder, scoped to
  `origin`'s own real `parentId` (Story 6 opens full gap+depth placement). **Only at
  Board layer** does the hover **band** (top/middle/bottom) decide.
- **Every item row shares one dnd-kit registration** (decision 4, 2026-09-21):
  `data: {type: 'item', role: 'card' | 'stub', parentId?}`, never a `type` that
  differs between a Stub's row and a popped-out Card row for the same id — the hazard
  that guards against is `active.data.current` lagging a mid-drag remount as a Stub's
  row unmounts from its Descendants section and remounts as a Card row. Every policy
  decision (`resolveBoardCollisions`, the pop machine) reads the session's own state
  instead — never `role`/`parentId` off the _active_ row, only off a _droppable_ one.
- **The ghost is a `Placement`, never a position** (`itemListOps.ts`). Nothing in
  `items` mutates during a drag. On release the placement becomes the pending marker;
  `boardDndUtils.ts::toRequest` turns it into the actual API request, and `isIdentity`
  recognizes a no-op (covered-set member dropped back on its own workphase) so nothing
  is sent.
- **Reindex disclosure must be folded in, never merged alone.** Any item-write response
  may carry `reindexed: {id, position}[]`; every write path folds it through
  `itemListOps.ts::completeItemWrite` (pairs first, written item last) before clearing
  the placement.

## Where each concern lives (pure, unit-tested modules)

- `popSession.ts` — the pop state machine (locked / popped-out), two states per layer.
  `placementRegion(session, regions)` is the one answer to "which region is the
  placement against" — `placementFor` and the hook's release both read it.
- `dragRegions.ts` — regions (Board/Column/sub-row/Card/Descendants) and their pixel
  drop bands. Structural resolution (`resolveDragStructure`) runs once per drag; live
  rects (`measureRegions`) run per sample. `isCardList(region)` is the one kind
  predicate: a column or sub-row — a flat list of Free items with bands and a
  workphase — vs. anything else. Never write `kind !== 'card'` to mean it. A
  `descendants` region only ever resolves for the drag's own `originCardId` (Story 5
  decisions 2/3), and `childRegionAt` never returns one as a zoom-in candidate yet —
  Story 6 opens that.
- `dragClassification.ts` — classifies every item against the carried one, once per
  drag start: valid / cycle-forming / depth-capped / inert. A Stub is classified
  exactly like a Card (Story 5) — no interim exclusion.
- `itemListOps.ts` — list selectors, ordinal placements, the reindex fold-in, the
  inversion tripwire.
- `boardDndUtils.ts` — collision detection + request-shape helpers (`toRequest`,
  `isIdentity`).
- `dragTuning.ts` — every threshold/band/overlay value, tunable at runtime via
  `DragTuningPanel.tsx` (toolbar → "Drag tuning"), persisted in `localStorage` under
  `kanban_drag_tuning`.
- `useBoardDnd.ts` — composes all of the above: clocks, DOM measurement, dnd-kit
  plumbing.
- `DragSessionContext.ts` — the whole drag's state (`activeItem`, `classification`,
  `pop`, `priorPlacement`, `origin`, `containingCardId`) plus `PlacementsContext`, read
  via `useDropTargetState(itemId)`/`useIsPending` — no prop drilling. `pop`/`origin`
  are non-optional as of Story 5 — every item drag runs the machine; `containingCardId`
  is null for a Free Card drag, the section-root Card for a Stub's.

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
- The board root carries `data-drag-state` (`locked`/`popped-out`) and
  `data-drag-context` for tests; Cards/Stubs carry `data-item-id` + `data-drop-state`.

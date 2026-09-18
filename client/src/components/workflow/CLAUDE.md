# Board Drag Gesture — Working Notes

Full rules and rationale: `docs/wiki/board-drag-interaction/README.md` (contexts,
popping, drop resolution) and `docs/wiki/item-attachment/README.md` (attach/detach
consequences). This file is the survival kit — read it before changing anything in
this directory, then go to the wiki for the "why."

## The mental model
- **Board → a Column/sub-row → one of its own Cards** is a strict stack, never more
  than one layer deep from wherever the cursor is. A drag starts in exactly one
  **context** (the region at pickup) and is either **locked** to it (DragOverlay
  clamped, cursor roaming inside) or **popped out** (cursor left past a delay/distance
  threshold, card follows the cursor at the parent layer).
- **A release always commits the locked layer's own within-action** — never a foreign
  region's — regardless of where the bare cursor rests. Column/sub-row: dnd-kit's
  `over` decides anchor+side. Card: always append as the last child (full anchor+side
  placement there is a known gap, not yet built). **Only at Board layer** does the
  hover **band** (top/middle/bottom) decide.
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
- `dragRegions.ts` — regions (Board/Column/sub-row/Card) and their pixel drop bands.
  Structural resolution (`resolveDragStructure`) runs once per drag; live rects
  (`measureRegions`) run per sample.
- `dragClassification.ts` — classifies every item against the carried one, once per
  drag start: valid / cycle-forming / depth-capped / inert.
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
  `pop`, `priorPlacement`, `origin`) plus `PlacementsContext`, read via
  `useDropTargetState(itemId)`/`useIsPending` — no prop drilling.

## Testing conventions
- Thresholds/bands are deliberately unlocked, tuned by feel. Automated tests assert
  **reachability and write correctness**, never a timing sequence — timing-dependent
  cases stay manual.
- E2E specs seed `kanban_drag_tuning` via `addInitScript` and read thresholds back
  from that object, never a literal; import region keys from `dragRegions.ts` rather
  than re-spelling `column:`/`subrow:`. Use `tests/helpers/dragGesture.ts`
  (`pickUp`/`hoverTo`/`release`/`cancel`/`dragTo`) — never hand-roll a drag or read
  `boundingBox()` directly for a drop target.
- The board root carries `data-drag-state` (`locked`/`popped-out`) and
  `data-drag-context` for tests; Cards/Stubs carry `data-item-id` + `data-drop-state`.

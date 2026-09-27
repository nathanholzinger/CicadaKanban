# Story 2 — Drop-target validity + relationship overlays

Implementation plan for Epic 3.5 Story 2. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: done 2026-09-11.** Built as planned, with the deviations recorded
in "As built" at the bottom.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 2
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §3.2, §4 · [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md)
  §7–§8 · [`../../wiki/item-positioning/`](../../wiki/item-positioning/README.md)
  §5, §5a
- Cases: [`../../test-plans/board-drag-interaction/drag-2-target-classification.md`](../../test-plans/board-drag-interaction/drag-2-target-classification.md)
  DRAG-2.1–2.7 · [`../../test-plans/item-attachment/att-4-legal-parent-depth-cap.md`](../../test-plans/item-attachment/att-4-legal-parent-depth-cap.md)
  ATT-4.8/4.9 · DRAG-6.3 (the apply-order half only)
- Prior story: [`story-1-server-reparent-with-placement.md`](story-1-server-reparent-with-placement.md)

**Verified by:** pick up a Card, assert what every target *is* — no drop
needed. **No drop outcome changes in this story**: every release does
exactly what it does today.

---

## Decisions made while planning (2026-09-11)

Settled with the Product Owner before this plan was written.

1. **`CAP` reaches the client over the API.** `GET /boards/:id` gains
   `itemDepthCap` (the server's `ITEM_DEPTH_CAP`); the client's
   classification function takes `cap` as a parameter and never hard-codes
   it. Changing the server constant moves both enforcement points (ATT-4.8)
   with no build-config changes. The one-line formula `D + 1 + h <= CAP`
   exists on both sides — accepted (Story 1 audit #21); each side feeds it
   from its own traversal (DB-backed vs. in-memory).
2. **Inert is named.** For a Card drag: the Unsorted bucket, a broken
   column, and an expanded column's outer wrapper (a drop must land on a
   sub-row) — every place `resolveDropTarget` already answers `null`. For a
   *Stub* drag: every target outside its own parent's Stub list, until
   Story 5 opens the detach direction. Recorded in wiki §4.
3. **Stubs are classified and shown, but a Card still can't drop on one.**
   Card→Stub has no meaning until Story 6; letting it collide now would
   fire an anchored move the server rejects (400 → resync). The
   classification map is the per-drag truth Stories 3/4/6 consult when they
   give those drops meaning; `boardCollisionDetection` is unchanged here.
4. **Reindex client half = apply the pairs, then the written item.** The
   board's render order is derived from `position` on every render
   (`selectBoardItems` sorts), so applying the pairs to state *is* the
   re-sort — there is no separate step to gate. The inversion tripwire
   (DRAG-6.4) needs Story 3's ordinal preview to compare against and moves
   there. Applied on every write path that can reindex: move (card and
   attached-sibling), create, and the Sheet's PUT.
5. **Testable surface is a `data-drop-state` attribute** on every Card and
   Stub during a drag. The overlay *look* is provisional (Story 8 tunes it);
   tests assert the state, never the color.
6. **`MoveItemInput` widens to the full server surface** (`parentId`,
   `isAttached`) — closes Story 1 audit #22 — even though nothing sends
   them yet.

---

## Target design

### Server: `GET /boards/:id` carries the cap

[`boards.ts`](../../../server/src/routes/boards.ts) adds
`itemDepthCap: ITEM_DEPTH_CAP` to the response. One test in
`boards.test.ts`. Client `BoardWithDetails` gains `itemDepthCap: number`.

### `client/src/lib/hierarchy.ts` — depth and height over the flat list

Extends the shared tree module (never duplicate tree math inline —
project convention):

```ts
// 1-based: a root is at depth 1. Ancestors resolved via getAncestors, so a
// dangling parentId reads as a root and a cycle terminates.
export function getDepth(id: string, nodes: readonly TreeNode[]): number;

// Levels below `id` — a leaf is 0. Counts every descendant, attached or
// not (wiki item-attachment §8). Level-ordered BFS beside getDescendantIds.
export function getSubtreeHeight(id: string, nodes: readonly TreeNode[]): number;
```

The board's `items` state is every item in the workflow's project scope
(`getBoardScopeItems`), and a hierarchy can't straddle projects, so an
item's whole ancestor chain and subtree are always present in that list —
depth and height computed from it are the true values. `filterProjectId`
narrows *rendering*, not the list.

### `client/src/components/workflow/dragClassification.ts` — pure, unit-tested

Sibling of `boardDndUtils.ts`: decides what every item *is* to the item
being carried; contains no dnd-kit runtime.

```ts
export type DropTargetState = 'valid' | 'cycle-forming' | 'depth-capped' | 'inert';

export interface DragClassification {
  activeId: string;
  /** Per item id. Items absent from the map were not classified (not on this board). */
  states: ReadonlyMap<string, DropTargetState>;
  /** Cycle-forming descendants that render as their own Cards — the green overlay (wiki §4). */
  freeDescendantIds: ReadonlySet<string>;
}

export function isWithinDepthCap(targetDepth: number, subtreeHeight: number, cap: number): boolean; // D + 1 + h <= cap

export function classifyDragTargets(activeId: string, items: readonly Item[], cap: number): DragClassification;
```

**Rules, per item `T`** (Card drag — `active.positionScope !== 'attached-siblings'`):

1. `T === active` or `T ∈ descendants(active)` → `cycle-forming`
   (descent through the hierarchy, attachment irrelevant — DRAG-2.2). If
   `T` is Free, it's also in `freeDescendantIds` (DRAG-2.5).
2. else `!isWithinDepthCap(getDepth(T), getSubtreeHeight(active), cap)` →
   `depth-capped` (DRAG-2.3, 2.6).
3. else → `valid` (DRAG-2.1).

Stubs go through the same three rules — no blanket exclusion (DRAG-2.7).
Cycle-forming beats depth-capped when both apply (a descendant is never a
"real target" for its ancestor).

**Stub drag** (`active.positionScope === 'attached-siblings'`), interim
until Story 5: siblings under the same parent → `valid`; the active item →
`cycle-forming`; everything else → `inert`. `freeDescendantIds` still
populated (a Stub's Free descendants are still "yours").

`subtreeHeight(active)` and `descendants(active)` are computed once per
call, not per target.

### Wiring — computed once at drag start, read by every Card and Stub

- `useBoardDnd` holds `classification: DragClassification | null` beside
  `activeItem`; set in `handleDragStart` (item drags only — column drags
  leave it null), cleared in `handleDragEnd` and a new `handleDragCancel`
  (also clears `activeItem`, which today survives an Escape-cancel).
  Classification is *never* recomputed mid-gesture (DRAG-2.4) — it's a
  per-drag value, not derived from `over`.
- A `DragClassificationContext` (`createContext<DragClassification | null>`)
  provided by `BoardView` inside `DndContext`; a `useDropTargetState(itemId)`
  hook returns `{ state, isFreeDescendant } | null`. Context rather than
  props for the same reason `useLiveDropSide` reads `useDndContext`
  directly: no drilling through BoardColumn / WorkphaseCardList /
  UnsortedBucket.
- `KanbanCard` and `AttachedChildRow` (Stub) both: `data-drop-state={state}`
  while a drag is active, plus provisional overlay classes —
  `freeDescendant` → green ring (`ring-2 ring-emerald-500/60`);
  `depth-capped` → dimmed (`opacity-40`). `inert` and `valid` render no
  cue in this story (Story 8 decides). The `isOverlay` (DragOverlay) card
  never shows a state.
- `boardCollisionDetection` **unchanged** (decision 3).

### Reindex disclosure — client half

- [`api/items.ts`](../../../client/src/api/items.ts): `MoveItemInput` gains
  `parentId?: string | null; isAttached?: boolean`; new
  `ReindexedPosition = { id: string; position: number }` and
  `ItemWriteResponse = Item & { reindexed?: ReindexedPosition[] }`;
  `moveItem`, `createItem`, `updateItem` return it.
- [`useItemManagement.ts`](../../../client/src/components/workflow/useItemManagement.ts):
  one pure `applyItemWriteResponse(items, response): Item[]` — apply every
  pair the list holds (unknown ids ignored: "not in this view"), then
  upsert the written item with `reindexed` stripped. Used by
  `applyItemMove`, the attached-sibling branch in `useBoardDnd`,
  `handleItemUpdated`, `handleCreateItem`, `handleChildCreated` — the Sheet
  and the board consume the disclosure the same way.

### Explicitly unchanged

- Drop resolution (`resolveDropTarget`, `resolveDropSide`, `applyItemMove`
  request shapes), collision detection, the attached-sibling sortable
  contexts, and the diagnostic drop-side indicator.
- Stubs are not draggable out of their parent (Story 5).
- No pending marker, ordinal preview, or inversion tripwire (Story 3).
- No dev/test panel (Story 3).

---

## Implementation sequence

Each step leaves the suite green.

### Step 0 — Baseline
`npm run test:unit && npm run typecheck && npm run lint` green.

### Step 1 — Cap over the API
- `boards.ts` GET adds `itemDepthCap`; `boards.test.ts` asserts it equals
  `ITEM_DEPTH_CAP`.
- `types.ts`: `BoardWithDetails.itemDepthCap`.

### Step 2 — Tree math (`lib/hierarchy.ts`)
- `getDepth`, `getSubtreeHeight`. Tests in `hierarchy.test.ts`: root depth
  1; leaf height 0; height through a detached branch; dangling parentId
  reads as root; cycle terminates (same seeded-cycle pattern as the
  existing tests).

### Step 3 — Classification (`dragClassification.ts`)
- Pure module + `dragClassification.test.ts`, one `it` per DRAG-2 case,
  fixtures built as plain `Item[]` with `positionScope` set the way the API
  sets it, every depth case parameterized on a `cap` argument:
  - DRAG-2.1 valid target; DRAG-2.2 X/S/D/D1 all cycle-forming; DRAG-2.3
    `T_ok` valid at `D + 1 + h = cap`, `T_over` depth-capped; DRAG-2.5 only
    the *Free* descendants in `freeDescendantIds`; DRAG-2.6 depth-capped ≠
    inert; DRAG-2.7 two Stubs classified differently on their own merits;
    Stub-drag interim (siblings valid, others inert); cycle-forming beats
    depth-capped.

### Step 4 — Wire it into the board
- `useBoardDnd`: `classification` state, `handleDragCancel`, cap read from
  `board.itemDepthCap`. Return both.
- New `DragClassificationContext` + `useDropTargetState` (small file next
  to the pure module, since it's the only React-aware piece).
- `BoardView`: provide the context; pass `onDragCancel`.
- `KanbanCard` / `AttachedChildRow`: attribute + provisional classes.
- Existing `boardDndUtils.test.ts` / component tests stay green.

### Step 5 — Reindex client half
- `api/items.ts` types and return types.
- `applyItemWriteResponse` in `useItemManagement.ts` + tests in
  `useItemManagement.test.ts`: applies known pairs, ignores unknown ids,
  upserts the written item last, strips `reindexed`, no-op when absent.
- Replace the five `setItems(prev => prev.map(...))` call sites with it.

### Step 6 — E2E (`tests/ui/drag-target-classification.spec.ts`)
- `dragGesture.ts` gains `pickUp(page, source)` (pointerdown + past the
  activation distance, no release) and `release(page)`; the existing
  `dragTo` is expressed as pick-up → approach → release so there's still
  one recipe.
- One spec, seeded via the API: `X` with attached Stub `S`, detached child
  `D` (own Card) with child `D1`; a chain to depth `CAP - 1` ending in
  `T_ok`, plus `T_over` one deeper (created attached under `T_ok`, so
  it's a Stub); an unrelated Card `V`. Pick up `X`, then assert
  `data-drop-state` on each: `V` valid, `T_ok` valid, `T_over`
  depth-capped, `S`/`D`/`D1` cycle-forming; move the cursor across two
  columns and re-assert (DRAG-2.4); release in place and assert every
  attribute is gone and nothing moved. `CAP` read from the board response,
  never hard-coded.

### Step 7 — Docs
- Wiki `board-drag-interaction/` §4: the Inert set (decision 2) and the
  Stub-drag interim; build-status header → "§4 implemented (Story 2)".
- Wiki `item-positioning/` §5a: apply-order half implemented; tripwire →
  Story 3. Header updated.
- `client/CLAUDE.md`: `dragClassification.ts`, `hierarchy.ts` additions,
  the context hook, `applyItemWriteResponse`, `pickUp`/`release`.
- `epic-3-5-roadmap.md`: Story 2 done, both "Needs attention" items
  resolved with pointers.

### Step 8 — Verification
`npm run test:all`, `npm run lint`, server `test:coverage` gate still green.

---

## Risks / things to watch

- **Re-render at drag start.** Providing a new context value re-renders
  every Card and Stub once when a drag begins and once when it ends. At
  single-user board sizes that's fine; if it ever isn't, the map can be
  held in a ref and read through `useSyncExternalStore`.
- **dnd-kit measurement loop.** Classification reads `items` once in
  `handleDragStart`; nothing in the render path calls a fresh-array
  function inline (the known gotcha in `KanbanCard`'s comment).
- **`handleDragCancel` is new behavior.** Today an Escape mid-drag leaves
  `activeItem` set (the DragOverlay lingers until the next drop). Clearing
  it is a small bug fix, called out so it isn't mistaken for scope creep.
- **`applyItemWriteResponse` ordering.** Pairs first, written item last —
  the written item is authoritative for its own row and is also in the
  pairs; applying it first and then a stale pair over it would be the
  silent-wrong order §5a warns about. Pinned by a test.

---

## As built (deviations from the plan above)

- **`handleDragCancel` also reverts the optimistic re-bucket.** The E2E
  spec surfaced it: hovering a Card across another column runs
  `handleDragOver`'s live workphase preview, and an Escape-cancel left the
  card drawn in that column until reload — a pre-existing bug, not just
  the lingering DragOverlay the plan named. The handler restores
  `workphaseId` from the `activeItem` snapshot. No server write was ever
  involved, so nothing else changes.
- **`data-item-id` on Cards and Stubs**, in addition to `data-drop-state`.
  A nested Stub's title text is also inside every ancestor Stub's row, so
  text-based locators are ambiguous; an id attribute is the unambiguous
  hook. The DragOverlay copy deliberately carries neither attribute.
- **`dragGesture.ts` gained `hoverTo` and `cancel`** beside the planned
  `pickUp`/`release`; `dragTo` is now composed from them. `cancel` presses
  Escape (dnd-kit's PointerSensor cancels on it) then releases the button,
  so a spec can assert mid-drag state and walk away without a drop.
- **`ItemDetailPanel`'s `onUpdate`/`onChildCreated` are typed
  `ItemWriteResponse`.** The raw responses already flowed through
  untouched, so the runtime behavior was right; the type now says so.
- **Both E2E cases live in one spec** (`drag-target-classification.spec.ts`):
  the Card-drag case covers DRAG-2.1–2.7 and the pickup → hover → cancel
  lifecycle in one gesture; a second case pins the Stub-drag interim rule
  so Story 5 has something to flip.
- **Client tests:** `dragClassification.test.ts` (14), `hierarchy.test.ts`
  (+4), `useItemManagement.test.ts` (+6). Server: `boards.test.ts` (+1).

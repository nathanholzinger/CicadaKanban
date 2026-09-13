# Story 3 — Pop state machine + Card → Column drop bands

Implementation plan for Epic 3.5 Story 3. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: done 2026-09-11.** Built as planned, with the deviations recorded
in "As built" at the bottom.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 3
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §1–§3, §5, §10 · [`../../wiki/item-positioning/`](../../wiki/item-positioning/README.md)
  §2 "Client-side role", §5a, §7
- Cases: [`drag-1-contexts-and-popping.md`](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md)
  DRAG-1.1–1.6 · [`drag-3-card-column-bands.md`](../../test-plans/board-drag-interaction/drag-3-card-column-bands.md)
  DRAG-3.1–3.11 · [`drag-6-preview-reconciliation.md`](../../test-plans/board-drag-interaction/drag-6-preview-reconciliation.md)
  DRAG-6.1–6.6 · [`part-2-anchor-resolution.md`](../../test-plans/item-positioning/part-2-anchor-resolution.md)
  TC-2.27–2.30 · [`part-5a-client-reconciliation.md`](../../test-plans/item-positioning/part-5a-client-reconciliation.md)
  TC-5a.1–5a.5 · [`part-7-board-placement-intents.md`](../../test-plans/item-positioning/part-7-board-placement-intents.md)
  TC-7.1–7.6, 7.8, 7.16
- Prior story: [`story-2-drop-target-classification.md`](story-2-drop-target-classification.md)

**Verified by:** automated state-transition cases on the pure machine, E2E
drops parameterized on the tuning values, and manual feel (the pop, the
clamp, the snap) — per `epic-3-5-decisions.md` Q1.

DRAG-1.7/1.8 (invalid targets never poppable) have no *Card*-context to
pop into until Story 4 — the machine already refuses them (a region is
the only poppable thing here), and Story 4 wires the classification map
into the Card-context check.

---

## Decisions made while planning (2026-09-11)

Settled with the Product Owner before this plan was written.

1. **Threshold = duration, with an optional distance term.** The pop fires
   when the cursor has rested in a poppable region's middle band for
   `popDelayMs`, *or* — when `popDistancePx > 0` — when the cursor is at
   least that far outside the current context's rect. Either satisfies.
   Distance ships disabled (0) so the default feel is the wiki's
   provisional 0.5 s; both are panel values.
2. **The dev/test panel is always available** (single-user app), toggled
   from the board toolbar, collapsed by default. Values persist in
   `localStorage` under `kanban_drag_tuning` as a partial override of the
   defaults; E2E seeds them with `addInitScript` so every case is written
   against the *configured* value, never the literal. The panel exposes the
   pop threshold + distance, the column bands, the Stub bands (stored now,
   consumed by Story 6), the overlay colors (§4 — the Tailwind constants
   become CSS custom properties on the board root), and diagnostics (the
   live context/band, and the inversion counter).
3. **Expanded sub-rows are in scope** — each sub-row is a region with its
   own bands and pop, exactly as §1/§5 already state. The machinery is
   parametric on "a region + its item list + its workphase," so this is a
   region-registration and a test, not a second model.
4. **§10's closing "may briefly show its pre-drop order" paragraph is
   deleted.** The ordinal placement is set synchronously on release, so
   there is no transient to describe. The roadmap's "Optimistic preview"
   open item closes with it.
5. **DRAG-6.5 per-item response sequencing is in scope.** Every position
   write takes a per-item sequence number; a response that isn't the
   latest for its item is dropped whole (pairs included — the later
   response supersedes them). A rejected write still resyncs.
6. **Story 2 audit items folded in:** #12 (`isStub`), #13
   (`useDropTargetProps`), #14 (`dragSession` collapse; `isCardBeingDragged`
   moves into the context), #15 (`itemListOps.ts` split). #6–#11, #16, #17
   stay where the audit left them.
7. **A release with the cursor in no region, or an Inert one, is a no-op**
   (nothing written, preview cleared) — matching Story 2's "abandoned drop
   must not strand the preview" behavior and the wiki's Inert definition.
   The card is still visibly clamped to its context, so nothing looks like
   it moved.
8. **Nothing in `items` is mutated during a drag.** Story 2's
   `handleDragOver` re-bucket (rewriting `workphaseId` optimistically) goes
   away; the ghost is a *placement* layered over the position-sort, so the
   restore-on-cancel logic and the "stable `activeItem` snapshot" caveat
   both disappear with it.

---

## Target design

### The vocabulary the code uses

- **Region** — a droppable column body (merged) or a sub-row block
  (expanded), measured from the DOM via a `data-drag-region` attribute.
  Carries what resolution needs: `key`, `rect`, the column's horizontal
  extent, `columnId`, `coveredWorkphaseIds`, `targetWorkphaseId` (entry
  workphase for merged, the exact workphase for a sub-row), `isTerminal`.
  Unsorted, broken columns and an expanded column's outer wrapper register
  no region — they are Inert (§4).
- **Context** — the region the carried item currently belongs to (§1).
  Starts as the origin region; changes only on a pop.
- **Band** — `top` / `middle` / `bottom` of a region's rect, measured
  against `columnTopBand` / `columnBottomBand`; a point above or below the
  rect (still inside the column's x-range) clamps to the nearest band.
- **Placement** — the ordinal preview (§10): `{ workphaseId, slot }` where
  `slot` is `'existing'` (position-sorted where it already falls),
  `'first'`, `'last'`, or `{ anchorId, side }`. Layered over the position
  sort by the list selectors; the item's `position` is never touched.

### Pure modules (`client/src/components/workflow/`)

- **`dragTuning.ts`** — `DragTuning` (`popDelayMs`, `popDistancePx`,
  `columnTopBand`, `columnBottomBand`, `stubFirstChildBand`,
  `stubLastChildBand`, `stubPopBandStart`, `stubPopBandEnd`,
  `overlayFreeDescendantColor`, `overlayDepthCappedOpacity`),
  `DEFAULT_DRAG_TUNING`, `DRAG_TUNING_STORAGE_KEY`, `loadDragTuning()` /
  `saveDragTuning()` (partial override merged over defaults, bad values
  ignored).
- **`dragRegions.ts`** — `DragRegion`, `measureDragRegions(root, columns)`
  (queries `[data-drag-region]`, builds regions from the column
  definitions), `regionAt(regions, point)` (x-range hit test, nearest
  sub-row vertically), `bandFor(y, rect, tuning)`, `regionContainerId`
  (the dnd-kit droppable id the region resolves to — the column id or the
  `subrow::` id).
- **`popSession.ts`** — the state machine, no React/dnd-kit:
  ```ts
  interface PopSession {
    contextKey: string;          // current context region
    locked: boolean;             // clamped to the context until the first pop (§3)
    hover: { regionKey: string; band: Band; since: number } | null; // cursor in a non-context region
  }
  startPopSession(originKey): PopSession
  advancePopSession(session, pointer, regions, tuning, now): PopSession  // pure transition
  releaseIntent(session, pointer, regions): { kind: 'in-context' } | { kind: 'band'; region; band } | { kind: 'none' }
  ```
  Rules: cursor in the context region (or nowhere / Inert) → `hover = null`;
  in another region → `hover` with `since` kept while the region stays the
  same; `band === 'middle'` and (`now - since >= popDelayMs` or the
  distance term) → pop: `contextKey = region.key`, `locked = false`,
  `hover = null`.
- **`itemListOps.ts`** — the pure list functions moved out of
  `useItemManagement.ts` (audit #15) plus: `Placement`,
  `applyPlacements(sorted, placements)`, `applyItemWriteResponse`,
  `findInversion(before, after)`, `isStub` (audit #12).
- **`boardDndUtils.ts`** — `createBoardCollisionDetection(getSession)`
  (a factory; the closure reads the live session), `bandDropResolution
  (region, band, activeItem, regionItems)` → `DropResolution | null`
  (TC-7.1/7.2/7.5/7.8/7.16).

### Collision detection under the machine

`over` is what drives dnd-kit's sortable shifting and the side indicator,
so it has to agree with the machine:

- Card drag, cursor in the context region (or nowhere): `closestCorners`
  restricted to the context's container and the cards whose rect lies in
  it — the in-context reorder, unchanged in feel.
- Card drag, cursor in another region: `over` is that region's container
  (never a card in it), so the target column's sortable doesn't shift
  against a hover the band ignores, and the ghost's index comes from the
  placement alone. After a pop the region *is* the context, so this
  collapses to the first rule.
- Attached-child and column drags: unchanged.

### Overlay clamp (§2 "bounded by its context")

A `DragOverlay` modifier reading the session ref: while `locked`, the
overlay's x is clamped to the context rect (merged column) and its y too
for a sub-row; once popped it passes the transform through unchanged,
which is the "snap to the cursor" of §3. `DndContext` gets no modifier —
`delta` and the collision rect stay raw.

### Hook wiring

- `useItemManagement` owns `placements` state, applies it in every
  selector (Cards *and* Stubs), and exposes `setPlacement`,
  `clearPlacement`, and a per-item `writes` tracker (`begin` → seq,
  `complete(seq, response)` → applies §5a, clears the placement, runs the
  inversion check, or ignores a stale response; `fail(seq)` → clears the
  placement). Inversion → `console.warn` + counter exposed for the panel.
- `useBoardDnd` holds one `dragSession: { activeItem, classification,
  pop } | null` (audit #14), tracks the pointer with a window
  `pointermove` listener for the life of a drag, schedules the pop timer,
  measures regions on each evaluation, mirrors the session into a ref for
  the collision closure and the overlay modifier, and on release resolves
  either in-context (via `over`) or by band. Returns `collisionDetection`,
  `overlayModifiers`, and the session.
- `BoardView` provides `DragSessionContext` (replaces
  `DragClassificationContext`; `isCardBeingDragged` reads from it) and
  `DragTuningContext`, renders the panel, and stamps `data-drag-context`
  / `data-drag-locked` on the board root for tests.
- `KanbanCard`: `useDropTargetProps(itemId, activeType, { isOverlay })`
  (audit #13) returns the attrs + class + indicator for Card and Stub
  alike; adds `data-pending` while a placement is pending.

### Explicitly unchanged

- Server. Every request shape already exists (TC-7.1: no new shape).
- Stub drags: sibling reorder only, still held closed (Story 5).
- Card → Card (Story 4), Stub bands (Story 6): the machine only knows
  column regions; a hovered Card counts as its column's region.

---

## Implementation sequence

Each step leaves the suite green.

### Step 0 — Baseline
`npm run test:unit && npm run typecheck && npm run lint` green.

### Step 1 — `itemListOps.ts` split + placements + tripwire
- Move the pure functions; `useItemManagement.ts` keeps the hook.
- `Placement`, `applyPlacements`, `findInversion`, `isStub`. Tests:
  TC-2.27 (ordinal, position untouched), TC-2.29 (anchor pending),
  TC-2.30 (not null), TC-5a.1–5a.3 (order; re-sort only on inversion),
  first/last, anchor filtered out → falls back to existing.

### Step 2 — Tuning + regions + machine
- `dragTuning.ts` (+ load/merge tests), `dragRegions.ts` (+ band tests,
  DRAG-3.5), `popSession.ts` (+ transition tests: DRAG-1.3 sustained vs
  momentary parameterized on `popDelayMs`; leaving resets `since`;
  top/bottom bands never pop; nowhere/Inert → hover null; distance term;
  after a pop the old context is a plain region).

### Step 3 — Collision + band resolution
- `createBoardCollisionDetection`, `bandDropResolution`; tests on both
  (TC-7.1/7.2/7.5/7.8/7.16, DRAG-3.6/3.7).

### Step 4 — Wire the board
- `data-drag-region` on merged bodies and sub-row blocks.
- `useBoardDnd` rewrite; `DragSessionContext`; `BoardView`;
  `KanbanCard`'s `useDropTargetProps` + pending marker; overlay CSS vars.
- Existing E2E suites stay green (their cross-column drops all land in a
  band whose meaning equals the value they already assert).

### Step 5 — Dev/test panel
- `DragTuningContext` + `DragTuningPanel.tsx`; toolbar toggle.

### Step 6 — E2E (`tests/ui/drag-column-bands.spec.ts`)
- Tuning seeded per case. Cases: DRAG-3.1/3.2 (top/bottom band → first/
  last), DRAG-3.3 (middle, momentary → workphase-only, position kept),
  DRAG-3.4 + DRAG-1.3 (hold past the configured delay → pop → anchor+side),
  DRAG-1.3 momentary with a large delay, DRAG-3.6/3.7 (merged entry vs
  member), DRAG-3.8 (sub-row), DRAG-3.9 (done column), DRAG-3.10 (empty),
  DRAG-6.1/6.2 (delayed response via `page.route` → ordinal slot +
  `data-pending`, position unchanged), DRAG-6.5 (two writes, first
  response delayed past the second → final state is write 2).

### Step 7 — Docs
- Wiki `board-drag-interaction/`: header, §3.1 (parameter names), §10
  (delete the closing paragraph). `item-positioning/` header + §5a status.
- `client/CLAUDE.md`, roadmap (Story 3 done, both open items resolved),
  this file's "As built".

### Step 8 — Verification
`npm run test:all`, `npm run lint`, server coverage gate.

---

## Risks / things to watch

- **dnd-kit's `over` vs the band.** If the target column's sortable ever
  receives a card `over` while the machine is in band mode, cards shift
  against a hover the drop ignores. The collision closure is the single
  guard; the E2E band cases would show it as a wrong anchor.
- **Timer + React.** The pop timer fires outside any dnd-kit event; it
  re-runs the transition with the last pointer and sets state, which
  re-renders `DndContext` and re-runs collision with the new context.
- **Region measurement cost.** A handful of `getBoundingClientRect` calls
  per pointer move; fine at board size.
- **E2E timing.** Momentary cases seed a large `popDelayMs` so a slow CI
  hover can't accidentally pop; sustained cases seed a small one and wait
  explicitly past it.

---

## As built (deviations from the plan above)

- **Popping is two-way, with a real popped-out state between.** The plan
  (and wiki §3 as written) had the lock release on the first pop and never
  re-engage. Two hands-on rounds reshaped it: first to "a pop is a direct
  transfer, the card re-locks to the new column" (no free state at all),
  then to the model that stuck — **pop out** when the cursor has been
  outside the context past `popDelayMs` (anywhere: another column, a gap,
  Unsorted; the card then follows the cursor and belongs to nothing), and
  **pop in** when a popped-out card's cursor rests in any column's middle
  band past a second value, `popInDelayMs` — the column it just left
  included. The pop-in clock starts at the pop-out, so the free state
  always lasts at least `popInDelayMs`. `PopSession` is
  `{ contextKey | null, hover, outsideSince }`; `isLocked` is `contextKey
  !== null`; a release while popped out still resolves by the band under
  the cursor. Wiki §3/§3.1/§5 amended (2026-09-11). The board root carries
  `data-drag-state` (`locked` / `popped-out`) for tests.
- **The bands are drawn** (`BandGuides.tsx`, after the hands-on): dashed
  lines at the configured boundaries on every region the card doesn't
  belong to, and the hovered region's guide tints the band the cursor is in
  — rendered as one fixed-position box from the machine's frozen entry
  rect, so it shows exactly what the drop resolves against; the other
  regions' lines are in-element percentages. The merged column body gained
  a `relative` wrapper (the region element) around the scrolling body so
  the lines sit over the visible box. `data-band-highlight` is the test
  hook; the tuning values reach the guides through a small
  `DragTuningContext`.
- **The snap is a tween, not a teleport** (`popSnapMs`, default 150 ms,
  panel value, 0 = instant): a `requestAnimationFrame` loop re-renders the
  overlay each frame while the clamp modifier interpolates (ease-out
  cubic) from the card's last drawn position toward the live clamped
  target — so it chases a cursor that keeps moving. Added after the first
  hands-on; the plan had the card jump.
- **E2E targeting is in layout space.** `dragGesture.ts::boxOf` now
  subtracts every CSS transform on the element and its ancestors. dnd-kit
  measures droppable rects at drag start and does not re-measure while its
  sortable preview slides neighbours around with transforms, so a point
  aimed at a card's *visual* rect mid-drag can be nearest a different
  card's collision rect — the older suites' 3.a cases ("after A") had been
  passing on the timing of a mid-transition re-measure and started failing
  once Story 3's extra work per pointer move shifted that timing. Layout
  shifts (the ghost inserted into another column's list) are real
  re-measures and still show up. `release`/`cancel` also wait for the
  DragOverlay (`data-drag-overlay`) to unmount, since a pointerdown during
  dnd-kit's drop animation can fail to start the next drag.
- **The band spec runs at 1600×900**: four columns plus the sidebar
  overflow the default viewport, and a band point in a partly off-screen
  column depends on auto-scroll timing.
- **Bands are measured against the region's rect as it was on entry**
  (`PopHover.rect`), not the live rect. The plan measured live; the
  expanded-column E2E case caught the problem on its first run — hovering
  the In Progress sub-row inserted the ghost there and pushed the Review
  sub-row down under the pointer, so a drop aimed at Review's top band
  resolved as In Progress's bottom band. Freezing the rect for the life of
  a hover makes the band a function of where the cursor went, not of what
  the ghost did in response. Recorded in wiki §5; unit-tested.
- **A drag from Unsorted has no context** (`PopSession.contextKey: null`,
  never locked): Unsorted registers no region, so there is nothing to clamp
  to. The item follows the cursor until it pops into a region; a release
  outside every region writes nothing (as before).
- **`useBoardDnd` takes one `deps` object** instead of seven positional
  parameters, and returns `collisionDetection` + `overlayModifiers` — both
  read the machine through refs, because dnd-kit calls them during *its*
  render. The React Compiler's `refs` rule shaped this: the collision
  function is a `useCallback` over a pure `resolveBoardCollisions(args,
  session)` rather than the planned factory closure (the factory still
  exists for tests).
- **`ItemListState` is one atom** (`items`, `placements`, `inversions`) so a
  response's reconciliation (pairs → row → clear placement → tripwire) is a
  single reducer step, `completeItemWrite`. The tripwire's log lives in
  state rather than a `console.warn` side effect inside an updater; the
  panel renders it. `setItems` is gone — a board load is `replaceItems`
  (which also drops every placement), everything else is a reducer.
- **`DragTuningContext` was planned and dropped** — the hook takes the
  tuning as a dep, the panel takes it as props, and the overlays read CSS
  custom properties BoardView sets; nothing needed a context.
- **The tripwire runs only for a write the board previewed.** A Sheet edit
  that reparents (and so reassigns a position) makes no ordinal claim and
  must not trip it; the plan didn't say either way.
- **Existing drag suites passed unchanged** (22/22 + 6 pre-existing skips):
  every cross-column drop they make lands in a band whose meaning equals
  the value they already assert (a bottom-band `pastColumnEnd` is "after
  the last item"; a card-center drop is the middle band's "keep position",
  which is what the 3.0-stays-3.0 cases wanted). Their header narratives
  still describe pre-Epic-3.2 failure modes; only the comments naming the
  re-bucket mechanism were reworded.
- **Client tests:** `popSession.test.ts` (21), `dragRegions.test.ts` (12),
  `dragTuning.test.ts` (4), `itemListOps.test.ts` (+17 over the moved
  suite), `boardDndUtils.test.ts` (+13). E2E:
  `tests/ui/drag-column-bands.spec.ts` (14 cases — DRAG-1.3/1.4/1.5/1.6,
  DRAG-3.1–3.4, 3.6–3.10, DRAG-6.1/6.2/6.5, the no-region release, popping
  out and back into the origin column, a popped-out band release, and a
  second pop-in; DRAG-3.7 is reached by popping out and coming back, since
  a member's own column is its context and has no bands). Server:
  untouched.

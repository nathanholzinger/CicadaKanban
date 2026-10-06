// The drag gesture's clocks, DOM measurement, and dnd-kit plumbing — composes
// popSession.ts, placement.ts, dragRegions.ts, dragCollision.ts, dragRequest.ts,
// dragOverlayGeometry.ts, dragClassification.ts, descendantsProjection.ts,
// itemListOps.ts, and the hooks usePendingGhostGuard.ts and useSnapTween.ts.

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragMoveEvent,
  type DragStartEvent,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithDetails, Item } from '../../types';
import { moveItem } from '../../api/items';
import { findNearestAncestor } from '../../lib/hierarchy';
import type { AnchorRelation } from '../../lib/hierarchyPlacement';
import { isStub } from '../../lib/isStub';
import { isColumnData, namedAnchorFor, resolveBoardCollisions, type CollisionSession } from './dragCollision';
import { sendItemMove, toRequest } from './dragRequest';
import { clampToCurrentContext, overlayShapeFor, reanchorOverlayTransform } from './dragOverlayGeometry';
import { classifyDragTargets, isValidParent, type DragClassification } from './dragClassification';
import {
  childRegionAt,
  descendantsRegionKey,
  hasDetachedElements,
  hasNewRegionElements,
  isCardList,
  measureRegions,
  regionElements,
  resolveDragStructure,
  type CardListRegion,
  type DescendantsRegion,
  type DragRegion,
  type DragStructure,
  type Point,
} from './dragRegions';
import type { DragTuning } from './dragTuning';
import { advancePopSession, popDueAt, startPopSession, type ParentKeyOf, type PopSession } from './popSession';
import { placementFor, placementRegion, resolvePlacementOver, type OverlayForm } from './placement';
import { renderedIsStub, renderedParentId, renderedWorkphaseId, type Placement, type Placements } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { DragSession } from './DragSessionContext';
import {
  NO_PROJECTION,
  advanceProjection,
  descendantsReleasePlacement,
  sameProjection,
  type ProjectionState,
} from './descendantsProjection';
import { usePendingGhostGuard } from './usePendingGhostGuard';
import { useSnapTween } from './useSnapTween';
import { SHORT_CARD_METRICS } from '../cardMetrics';

// A Stub's drag starts at its *containing Card's* Descendants layer: the
// nearest Free ancestor, whatever the Stub's own depth beneath it. Built on
// `hierarchy.ts::findNearestAncestor` (cycle-safe) rather than a bespoke
// parentId walk, so a corrupted parentId cycle in the data degrades the
// same way it already does everywhere else in the hierarchy math. `null`
// only if every ancestor up to a dangling/missing parentId is itself a
// Stub, which the depth cap makes unreachable in practice.
function containingCardIdOf(item: Item, items: readonly Item[]): string | null {
  return findNearestAncestor(item, items, n => !isStub(n))?.id ?? null;
}

// Drag-and-drop for the board's DndContext — the board drag's gesture
// layer. The rules live in pure modules (popSession.ts, placement.ts,
// dragRegions.ts, dragBands.ts, dragCollision.ts, dragRequest.ts,
// descendantsProjection.ts, itemListOps.ts, lib/hierarchyPlacement.ts);
// this hook owns the clocks, the DOM measurements, and the dnd-kit
// plumbing:
//
//   - the pointer is tracked with a window listener for the life of any
//     item drag (Card or Stub alike), and every sample runs the pop machine
//     against freshly measured regions (a pop that needs no movement — the
//     cursor resting — fires from a timer);
//   - the machine's state is mirrored into a ref so the closures dnd-kit
//     calls during *its* render can read it: the collision detection (which
//     decides `over`) and the clamp modifier (which clamps the card to its
//     context while locked — passed to both `DndContext` and `DragOverlay`,
//     so `over` and the live side line track the same bounded position the
//     overlay is actually drawn at);
//   - the ghost is an ordinal placement over the list selectors — nothing
//     in `items` is mutated during a drag, so cancel is just clearing it;
//   - a release resolves in-context through `dropAnchorFor`'s own anchor +
//     lean (a column/sub-row), through the gap + depth rule against the
//     session's own live projection (a Descendants section,
//     `releaseDescendants`), or, popped out, through that region's band —
//     and the write goes out with its pending placement attached.
//
// Position values are never computed here: the request carries relative
// intent and the server's number lands through the write tracker.

export interface BoardDndDeps {
  board: BoardWithDetails | null;
  setBoard: React.Dispatch<React.SetStateAction<BoardWithDetails | null>>;
  items: Item[];
  tuning: DragTuning;
  /** The live ordinal placements — read at drag start to stash a re-dragged item's pending marker. */
  placements: Placements;
  previewPlacement: (itemId: string, placement: Placement | null) => void;
  writes: ItemWriteTracker;
  getWorkphaseItems: (workphaseId: string, isTerminal?: boolean) => Item[];
  getMergedColumnItems: (coveredWorkphaseIds: readonly string[], isTerminal?: boolean) => Item[];
  /** A Descendants region's own "others" list — the parent's other attached children, placement-aware. */
  getAttachedChildren: (parentId: string) => Item[];
  handleReorderColumns: (orders: { id: string; position: number }[]) => Promise<void>;
  loadBoard: () => Promise<void>;
  /** The element the regions are measured under (the DndContext's wrapper). */
  rootRef: RefObject<HTMLElement | null>;
}

// The pop timer's teardown, at module scope taking its ref so the
// pointer-tracking effect's cleanup can call it too: a hook-local function
// would be a dependency `exhaustive-deps` asks that effect to list, while a
// `useRef` result never is.
function clearPopTimer(popTimer: RefObject<ReturnType<typeof setTimeout> | null>) {
  if (popTimer.current !== null) clearTimeout(popTimer.current);
  popTimer.current = null;
}

export function useBoardDnd(deps: BoardDndDeps) {
  const { board } = deps;
  const [session, setSession] = useState<DragSession | null>(null);

  // Mirrors for the closures that run outside React's render of this hook.
  const sessionRef = useRef<DragSession | null>(null);
  const { setGhost, restorePriorPlacement } = usePendingGhostGuard(sessionRef, deps);
  const regionsRef = useRef<DragRegion[]>([]);
  // The board's structural facts (elements, kinds, parent chains, scroll
  // ancestors, column facts) — resolved once per drag, again after each
  // layer change, and again when a sample finds the DOM changed under it
  // (`sampleRegions`); not on every pointer sample.
  const structureRef = useRef<DragStructure>([]);
  // Every region element present at that resolve, the ones that resolved to
  // nothing included — what `sampleRegions` compares the live DOM against to
  // notice a region that mounted since.
  const structureElementsRef = useRef<ReadonlySet<Element>>(new Set());
  // The Card whose section a Stub's drag started in, null for a Free Card's
  // drag: its Card and Descendants regions resolve regardless of
  // `isValidCard`. Set by `beginDragAt`.
  const originCardIdRef = useRef<string | null>(null);
  // The carried copy's form at pickup — a Stub for a Stub's drag, the
  // shortCard for a Free Card's. `clampToContext`'s re-anchor reads it to
  // know whether the *current* form differs from the one the pointer's
  // original offset was measured against. Set by `beginDragAt`.
  const pickupFormRef = useRef<OverlayForm>('short-card');
  // The row `dropAnchorFor` names right now — the one the blue line draws —
  // set from dnd-kit's `onDragMove` (`handleDragMove`), since this hook
  // isn't rendered under `DndContext` and can't read `useDndContext()` the
  // way a row does. Fed into the pop machine and the projection as plain
  // data.
  const namedAnchorRef = useRef<AnchorRelation | null>(null);
  // The Descendants layer's projection and the seed it's measured from
  // (`descendantsProjection.ts`); `session.projection` mirrors the former.
  const projectionRef = useRef<ProjectionState>(NO_PROJECTION);
  const pointerRef = useRef<Point | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest props, for the pointer/timer callbacks that live across renders.
  const latest = useRef(deps);
  useEffect(() => {
    latest.current = deps;
  });
  // The pop timer calls back into the evaluation; a ref so the timeout
  // never holds a stale closure.
  const evaluateRef = useRef<() => void>(() => {});
  const { start: startSnap, cancel: cancelSnap, draw: drawSnapped } = useSnapTween(deps.tuning.popSnapMs);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function updateSession(next: DragSession | null) {
    sessionRef.current = next;
    setSession(next);
  }

  // One end of a drag — clear the pop timer, cancel any snap in flight, and
  // clear the session — for `handleDragCancel` and `handleDragEnd`. The
  // pointer-tracking effect's cleanup shares the two clock steps but not the
  // session write: it runs after the session is already null, or on
  // unmount.
  function endSession() {
    clearPopTimer(popTimer);
    cancelSnap();
    // The projection outlives nothing: the next drag seeds its own.
    projectionRef.current = NO_PROJECTION;
    updateSession(null);
  }

  // `classification` decides which Cards resolve as regions at all (an
  // invalid target — cycle-forming, depth-capped — is never poppable, and
  // here that's simply "never a region," so nothing downstream has to
  // re-check validity). It's a parameter rather than read off the session
  // ref because the very first resolution of a drag (`beginDragAt`) runs
  // before the session exists yet — every call site below already has its
  // own classification in scope regardless.
  //
  // Structural (element ↔ key ↔ kind ↔ parent chain ↔ scroll ancestor ↔
  // column facts) and re-resolved per drag, after each layer change, and
  // whenever `sampleRegions` finds the DOM changed under it (what a layer
  // change's render mounts lands after the layer change's own re-resolve —
  // see `sampleRegions`).
  function resolveStructure(classification: DragClassification): DragStructure {
    const root = latest.current.rootRef.current ?? document;
    const isValidCard = (cardId: string): boolean => isValidParent(classification, cardId);
    structureRef.current = resolveDragStructure(
      root,
      latest.current.board?.columns ?? [],
      isValidCard,
      originCardIdRef.current ?? undefined,
    );
    structureElementsRef.current = new Set(regionElements(root));
    return structureRef.current;
  }

  // The per-sample read: live rects and live card counts, scoped to
  // exactly what the locked layer can use — `scope` is the pop machine's
  // current `contextKey`, so this is the context region itself plus its
  // own children (Board never reads a Card region; a locked column never
  // reads another column's).
  //
  // Re-resolves first if the DOM has changed under the structure since the
  // last resolve: a cached element gone (a remount — it would measure as an
  // empty box, so its region would silently drop out), or a region element
  // that wasn't there. A layer change re-resolves synchronously, *before*
  // React renders the new layer, so whatever that render mounts or remounts
  // lands after it: a column's Cards remounted by a render, or a collapsed
  // Card, forced open by the zoom-in into it, mounting its Descendants
  // section only then — without this, that layer could never be entered. No
  // session yet means the drag is starting and the structure was resolved a
  // moment ago.
  function sampleRegions(scope: string | null): DragRegion[] {
    const classification = sessionRef.current?.classification;
    const root = latest.current.rootRef.current ?? document;
    const isStale = () =>
      hasDetachedElements(structureRef.current) || hasNewRegionElements(root, structureElementsRef.current);
    if (classification && isStale()) resolveStructure(classification);
    regionsRef.current = measureRegions(structureRef.current, scope);
    return regionsRef.current;
  }

  // Advances the Descendants layer's projection by one sample (see
  // `descendantsProjection.ts`). `previousContextKey` is the context the
  // sample started in, before any of its own transitions (null at pickup):
  // a different one than `pop.contextKey` is a fresh entry into a section.
  function updateDescendantsProjection(
    previousContextKey: string | null,
    pop: PopSession,
    classification: DragClassification,
  ) {
    projectionRef.current = advanceProjection(projectionRef.current, {
      previousContextKey,
      contextKey: pop.contextKey,
      classification,
      originCardId: originCardIdRef.current,
      namedAnchor: namedAnchorRef.current,
      pointerX: pointerRef.current?.x ?? null,
      getAttachedChildren: latest.current.getAttachedChildren,
    });
  }

  // A context's parent, off the structure rather than a measured region: a
  // context clipped out of view has no region in the sample, but its place
  // in the stack doesn't change.
  const parentKeyOf: ParentKeyOf = key => structureRef.current.find(s => s.key === key)?.parentRegionKey ?? null;

  // One step of the pop machine against the current pointer; re-arms the
  // pop timer when the cursor is resting in a pop-eligible band.
  function evaluatePop() {
    const current = sessionRef.current;
    const pointer = pointerRef.current;
    if (!current || !pointer) return;
    const { tuning } = latest.current;
    const now = performance.now();
    const priorContextKey = current.pop.contextKey;
    let regions = sampleRegions(current.pop.contextKey);
    let pop = advancePopSession(
      current.pop,
      pointer,
      regions,
      tuning,
      SHORT_CARD_METRICS,
      now,
      namedAnchorRef.current,
      parentKeyOf,
    );
    // A layer change: the sample above was scoped to the *old* layer, so a
    // hover onto something only visible from the *new* one (a sibling
    // region at Board, a Card inside the column just entered) can't have
    // been seen yet. Re-resolve for the new scope and re-run this same
    // sample against it before anything downstream reads a region —
    // including `popDueAt` below, which would otherwise schedule no
    // further timer at all off a hover that was never actually looked for,
    // stranding a timer-driven transition (no further pointermove ever
    // arrives to self-correct it) the instant it lands.
    //
    // A single re-resolve/re-sample/re-run only ever catches one hop. A
    // yank far enough (a yank out of a Stub's section, say) to clear two
    // thresholds in the same sample cascades `pop.contextKey` through an
    // intermediate layer internally (`advancePopSession` re-evaluates the
    // same sample after each transition) that this `regions` sample was
    // never scoped for — `pop.contextKey` would report the fully-cascaded
    // layer while `regions` stays scoped to an intermediate stop
    // `placementRegion` can't find anything in, silently dropping the ghost
    // (and any release in that window) until the next pointer sample or
    // timer self-corrects it. Looping the resample/rerun until the context
    // truly stabilizes (not just once) catches every hop this same sample is
    // due for; bounded by the layer count so a pathological oscillation
    // can't spin forever. `startSnap` runs once per hop.
    let previousContextKey = current.pop.contextKey;
    for (let hops = 0; pop.contextKey !== previousContextKey && hops < 4; hops++) {
      startSnap();
      resolveStructure(current.classification);
      previousContextKey = pop.contextKey;
      regions = sampleRegions(pop.contextKey);
      pop = advancePopSession(
        pop,
        pointer,
        regions,
        tuning,
        SHORT_CARD_METRICS,
        now,
        namedAnchorRef.current,
        parentKeyOf,
      );
    }
    updateDescendantsProjection(priorContextKey, pop, current.classification);
    const { projection } = projectionRef.current;
    // The projection can change (a fresh gap or depth choice) on a sample
    // where `pop` itself doesn't — a locked
    // Descendants context has no further child region, so
    // `advancePopSession`'s own "inside" branch keeps returning the same
    // `pop` object once `hover`/`outsideSince` are already both null,
    // exactly the case while the cursor roams choosing a gap and depth.
    if (pop !== current.pop || !sameProjection(projection, current.projection)) {
      const next = { ...current, pop, projection };
      updateSession(next);
      setGhost(current.activeItem.id, placementFor(next, regions));
    }
    clearPopTimer(popTimer);
    const due = popDueAt(pop, regions, tuning);
    if (due !== null) popTimer.current = setTimeout(() => evaluateRef.current(), Math.max(0, due - now));
  }
  useEffect(() => {
    evaluateRef.current = evaluatePop;
  });

  // Pointer tracking for the life of an item drag — every item drag runs the
  // pop machine, so `pop` is never absent once `session` is.
  const machineActive = session !== null;
  useEffect(() => {
    if (!machineActive) return;
    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      evaluateRef.current();
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      clearPopTimer(popTimer);
      cancelSnap();
    };
  }, [machineActive, cancelSnap]);

  // dnd-kit calls this during its own render; it reads the mirrors.
  const collisionDetection = useCallback<CollisionDetection>(args => {
    const current = sessionRef.current;
    let live: CollisionSession | null = null;
    if (current) {
      const { pop } = current;
      const regions = regionsRef.current;
      const hover = pop.hover ? regions.find(r => r.key === pop.hover?.regionKey) : undefined;
      const context = pop.contextKey === null ? undefined : regions.find(r => r.key === pop.contextKey);
      // Locked at a Descendants context, the in-context candidates are every
      // Stub row inside the section's own rect (any depth: the section is
      // one flat list) — read off the region we already measured, never
      // dnd-kit's `active.data.current`, which can lag a mid-drag remount.
      const descendantsSectionRect = context?.kind === 'descendants' ? context.rect : null;
      live = {
        // A Card hover (locked column/sub-row, tracking a zoom-in
        // candidate) never forces `over` — a mere hover, not yet a pop,
        // must never drive anything a release would act on.
        hoverContainerId: hover && isCardList(hover) ? hover.containerId : null,
        // A locked Card context has no `over` either: its within-action is
        // a constant, never a preview — otherwise the target Card would be
        // its own only collision candidate, which could light the live side
        // indicator on it for no reason a release would ever honor.
        // Descendants has its own branch above instead (a card-list
        // container concept doesn't apply to it).
        context: context && isCardList(context) ? { containerId: context.containerId, rect: context.rect } : null,
        descendantsSectionRect,
      };
    }
    return resolveBoardCollisions(args, live);
  }, []);

  // The DragOverlay can't leave the context rect
  // (`dragOverlayGeometry.ts::clampToCurrentContext`). A pop swaps the rect
  // for the new context's, and since the cursor is inside it at that moment
  // the card's target is under the cursor — the snap on a pop, tweened over
  // `popSnapMs` from where it was clamped (`useSnapTween`) — and it is
  // bounded there from then on. No context (a drag from Unsorted that
  // hasn't popped yet) passes the transform through.
  //
  // This same modifier is also passed to `DndContext` itself
  // (BoardView.tsx), not only `DragOverlay`: dnd-kit feeds a
  // `DndContext`-level modifier's output into both the collision rect
  // (`over`) and `active.rect.current.translated` (`resolveDropSide`'s
  // input), so without it those two would track the *raw*, unclamped
  // position while only the visible copy is bounded — during the exit
  // clock, `closestCorners` could pick a card a column away from the
  // visible copy, and the live side line could flip to it too. Calling this
  // twice (once for each context) is idempotent for the *clamp*:
  // `clampAxis` clamping an already-clamped value returns it unchanged. The
  // snap tween isn't — both calls read the same tween, so for ≤`popSnapMs`
  // after a pop the second application re-eases an already-eased point and
  // its result is the one that sticks. Cosmetic: the window is ≤150ms by
  // default and the collision rect only diverges from the drawn copy within
  // it, never after.
  //
  // `reanchorOverlayTransform` runs first, before the clamp — the carried
  // copy's own form switch (shortCard -> Stub, at the Card-layer boundary)
  // shrinks the box out from under dnd-kit's own pointer-glued transform
  // (dnd-kit tracks the *pickup* point, not a fraction of the box, so a box
  // that shrinks leaves the pointer beside it, not on it). Targets the
  // overlay shape's width and `CARRIED_STUB_HEIGHT_PX` — the same numbers
  // the render side already uses to size the Stub — rather than dnd-kit's
  // own `draggingNodeRect`: swapping the overlay's rendered shape leaves
  // that measurement stuck for a stretch (its ResizeObserver is bound once,
  // at the DragOverlay's *first* mount, to whatever the pickup form's
  // content happened to be), so it can't be trusted as the target's own
  // dimensions here. Folding the
  // re-anchor in ahead of `clampToCurrentContext` means the clamp bounds
  // where the copy will *actually* sit post-re-anchor, and the snap tween
  // (already started by the same contextKey change that changes the form)
  // interpolates the whole move — position and re-anchor together — in one
  // motion, exactly like any other pop.
  const clampToContext = useCallback<Modifier>(
    ({ transform, draggingNodeRect, activatorEvent, activeNodeRect }) => {
      const pop = sessionRef.current?.pop ?? null;
      const shape = overlayShapeFor(pop, regionsRef.current);
      const reanchored = reanchorOverlayTransform(
        transform,
        activeNodeRect,
        activatorEvent,
        pointerRef.current,
        pickupFormRef.current,
        shape.form,
        shape.widthPx,
      );
      return drawSnapped(clampToCurrentContext(reanchored, draggingNodeRect, pop, regionsRef.current));
    },
    [drawSnapped],
  );
  // Shared by `DndContext` and `DragOverlay` alike (above) — one array
  // reference so passing it to both doesn't create a new one every render.
  const dragModifiers = useMemo(() => [clampToContext], [clampToContext]);

  // Card lists only: a Card region's within-action, the auto-drop, never
  // consults the region's rendered items.
  //
  // A call of its own, never merged with `BoardColumn.tsx`'s render lists:
  // both already read the same selectors (`getMergedColumnItems`,
  // `getWorkphaseItems`), so the release list and the rendered list can't
  // disagree.
  function regionItems(region: CardListRegion): Item[] {
    const { getMergedColumnItems, getWorkphaseItems } = latest.current;
    return region.kind === 'column'
      ? getMergedColumnItems(region.coveredWorkphaseIds, region.isTerminal)
      : getWorkphaseItems(region.targetWorkphaseId, region.isTerminal);
  }

  // "Which list is this release against" — one derivation, read by both
  // `placementOver`'s anchor/bare-container distinction and `others`'
  // candidate rows. Card-list regions only: a Descendants release resolves
  // through `releaseDescendants` instead, before this is ever called; a
  // Card region (or no region at all) has no release list either, `null`
  // both ways.
  function releaseListFor(region: DragRegion | undefined): { rows: Item[]; containerId: string } | null {
    if (!region) return null;
    if (isCardList(region)) return { rows: regionItems(region), containerId: region.containerId };
    return null;
  }

  // Where a drag starts, and its session (wiki board-drag-interaction §1). A
  // Stub's drag starts at its containing Card's Descendants layer —
  // deterministic, not hit-tested; a Free Card's in the column or sub-row
  // under the cursor, since a Card is never a starting context, or in none
  // from Unsorted. The rest is the same for both: resolve the structure, start
  // the pop machine there, seed the projection (a Stub's drag enters its own
  // section), and set the ghost from the session's own placement.
  function beginDragAt(start: Omit<DragSession, 'pop' | 'projection'>) {
    const { containingCardId, classification } = start;
    originCardIdRef.current = containingCardId;
    pickupFormRef.current = containingCardId ? 'stub' : 'short-card';
    resolveStructure(classification);
    const pointer = pointerRef.current;
    const startContextKey = containingCardId
      ? descendantsRegionKey(containingCardId)
      : pointer && (childRegionAt(sampleRegions(null), pointer, null)?.key ?? null);
    const regions = sampleRegions(startContextKey);
    const pop = startPopSession(startContextKey);
    updateDescendantsProjection(null, pop, classification);
    const session: DragSession = { ...start, pop, projection: projectionRef.current.projection };
    updateSession(session);
    setGhost(session.activeItem.id, placementFor(session, regions));
  }

  function handleDragStart(event: DragStartEvent) {
    if (isColumnData(event.active.data.current) || !board) return;
    const activeId = String(event.active.id);
    const stored = deps.items.find(i => i.id === activeId);
    if (!stored) return;

    // Reset alongside the other per-drag state, though the next
    // `onDragMove` overwrites it regardless of what a previous drag left.
    namedAnchorRef.current = null;

    // Whatever this item's placement was *before* this drag — non-null
    // only for a re-drag of an item whose earlier write is still pending
    // (its marker is sitting right there). Read before the ghost below
    // overwrites it; restored, instead of cleared, if that write is still
    // in flight when this drag ends without writing anything.
    const priorPlacement = deps.placements.get(activeId) ?? null;

    // The drag starts from the item as the board draws it, through the same
    // placement-aware reads the render uses, never from the stored row
    // alone. The two differ only for a re-drag of an item whose earlier
    // write is still in flight (`priorPlacement`), and there the stored row
    // is where it *used* to be: a stale workphase would make "move it back"
    // look like no change (nothing sent, or an anchor-only request the
    // server applies in the new workphase), and a Stub whose detach or
    // attach hadn't landed yet would start in the wrong layer.
    const { placements } = deps;
    const activeItem = { ...stored, workphaseId: renderedWorkphaseId(stored, placements) };
    const parentId = renderedParentId(stored, placements);

    // The cap comes off the board response (never hard-coded client-side)
    // so the server's constant governs both enforcement points.
    const classification = classifyDragTargets(activeId, deps.items, board.itemDepthCap);

    const activator = event.activatorEvent as Partial<PointerEvent>;
    pointerRef.current = { x: activator.clientX ?? 0, y: activator.clientY ?? 0 };

    // `renderedIsStub` reads the item as drawn (above) — never dnd-kit's
    // own `data.role`, which only exists to keep the *droppable* side
    // (KanbanCard.tsx) legible and is never load-bearing here.
    if (renderedIsStub(stored, placements)) {
      const containingCardId = containingCardIdOf({ ...stored, parentId }, deps.items);
      if (!containingCardId) return; // malformed data — every ancestor is itself a Stub
      // A Stub's own stored `workphaseId` is a cache that goes stale the
      // moment its containing Card is moved through a client-observed write
      // this session (`itemWriteReconciliation.ts::applyItemWriteResponse`
      // upserts only the written row). An attached item's `workphaseId`
      // always equals its nearest Free ancestor's, and a parent move writes
      // that ancestor's row directly, so the containing Card's *current* row
      // is the fresh one. Snapshotted onto `activeItem` itself, once, here —
      // every downstream `placementFor`/`toRequest` call in this drag
      // (mid-drag and at release alike) reads `session.activeItem.workphaseId`
      // and gets the fresh value for free, rather than the Stub's own copy.
      // The Card's own move can be the write still in flight, so it's read
      // as drawn too, as above.
      const containingCard = deps.items.find(i => i.id === containingCardId);
      beginDragAt({
        activeItem: containingCard
          ? { ...activeItem, workphaseId: renderedWorkphaseId(containingCard, placements) }
          : activeItem,
        classification,
        priorPlacement,
        // Where the drag started: the Stub's own direct parent (not
        // necessarily `containingCardId` — a grandchild's direct parent is
        // another Stub), at its sorted slot. What `placementFor`'s Card
        // branch and `isIdentity` compare a release against.
        origin: { parentId, slot: 'existing' },
        containingCardId,
      });
      return;
    }

    beginDragAt({
      activeItem,
      classification,
      priorPlacement,
      // Where the drag started: the Card's own list, at the ordinal the
      // sort already gives it. What `isIdentity` compares a release against,
      // at every layer.
      origin: { workphaseId: activeItem.workphaseId ?? undefined, slot: 'existing' },
      containingCardId: null,
    });
  }

  // dnd-kit's notice that `active`/`over` changed this frame — this hook's
  // only source for the named anchor (`namedAnchorRef`, above), since it
  // isn't rendered under `DndContext`. Names it exactly as the blue line and
  // the release do (`namedAnchorFor`), then runs the pop machine against it
  // at once: dnd-kit's move events aren't guaranteed to interleave with the
  // raw `pointermove` listener in either order, so waiting for the next one
  // could show the cue a frame late, but never leaves it stale.
  function handleDragMove(event: DragMoveEvent) {
    if (isColumnData(event.active.data.current)) return;
    namedAnchorRef.current = namedAnchorFor(event.active, event.over, sessionRef.current);
    evaluateRef.current();
  }

  // The ghost's placement is otherwise only ever set on the machine's own
  // state changes — a response completing an earlier, still-outstanding
  // write for the *active* drag's item (a re-drag scenario) clears it from
  // underneath the live gesture the moment it lands. `usePendingGhostGuard`
  // corrects that reactively, the instant it's visible in
  // `deps.placements`, rather than waiting for the next pointer move or
  // band crossing; cancelling or a no-op release
  // restores the item's pre-drag pending marker the same way, via
  // `restorePriorPlacement` (also that hook's).

  // Escape / a cancelled gesture: nothing was written, so the ghost is the
  // only thing to undo.
  function handleDragCancel() {
    const current = sessionRef.current;
    endSession();
    if (current) restorePriorPlacement(current);
  }

  // A reload swaps the board for "Loading board…", which unmounts the
  // `DndContext` with no `onDragCancel`. One landing during a *later* drag
  // (a failed or needs-resync write from the previous one) would orphan
  // that drag's session: the pointer listener and the pop machine would
  // keep running with the button released, and the reassert effect would
  // re-add its ghost into the reloaded board. So every reload this hook asks
  // for ends a live drag first, the way Escape would
  // (wiki board-drag-interaction §10).
  function resyncBoard() {
    if (sessionRef.current) handleDragCancel();
    return latest.current.loadBoard();
  }

  // A release at the Descendants layer (the gap + depth rule): the last
  // sample's own resolved placement, not `over`'s bare anchor. Over the cap,
  // or at the Stub's own gap and depth, there's nothing to write, the same
  // path as a null placement.
  async function releaseDescendants(session: DragSession, region: DescendantsRegion) {
    const placement = descendantsReleasePlacement(session.projection, region.cardId);
    const targetRows = placement ? latest.current.getAttachedChildren(placement.parentId) : [];
    await commitRelease(session, placement, targetRows);
  }

  // The one release tail, for a Descendants release and `handleDragEnd`'s
  // card-list and Card releases alike: `placement` against the target list's
  // other rows becomes the request (`dragRequest.ts::toRequest`, then
  // `sendItemMove`). Nothing to write — a null placement (drawn where it
  // already is, or an over-cap state), or an identity — means the ghost
  // goes and the item is where it was, or, if it had a pending marker from
  // an earlier write still in flight, that comes back instead. The restore
  // sits here with the send so no release path can drop it.
  async function commitRelease(session: DragSession, placement: Placement | null, targetRows: readonly Item[]) {
    const activeId = session.activeItem.id;
    const others = targetRows.filter(i => i.id !== activeId);
    const input = toRequest(session.activeItem, session.origin, placement, others);
    if (!input || !placement) {
      restorePriorPlacement(session);
      return;
    }
    await sendItemMove(moveItem, activeId, input, placement, deps.writes, resyncBoard);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const current = sessionRef.current;
    endSession();

    const activeId = String(active.id);

    // ── Column reorder (wiki boards-columns-unsorted §7) ──
    if (isColumnData(active.data.current)) {
      if (!over || activeId === String(over.id) || !board) return;
      const cols = board.columns;
      const oldIndex = cols.findIndex(c => c.id === activeId);
      const newIndex = cols.findIndex(c => c.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(cols, oldIndex, newIndex);
      deps.setBoard(prev => (prev ? { ...prev, columns: reordered } : prev));
      try {
        await deps.handleReorderColumns(reordered.map((c, i) => ({ id: c.id, position: i + 1 })));
      } catch (err) {
        console.error('Failed to reorder columns:', err);
        resyncBoard();
      }
      return;
    }

    if (!current) return;

    // ── Item drop: the ghost's own placement is the request ──
    // No fresh geometry at release — `regionsRef` already holds exactly
    // what the machine's own final state needs, scoped to `current.pop`'s
    // own contextKey/hover by the last sample. `over` only means anything
    // while locked in a column/sub-row or a Descendants section (Board-band
    // and Card are `placementFor`'s own branches); a bare container hover or
    // a done region's own card both fall back to the same no-anchor slot
    // `placementFor`'s in-context branch already uses mid-drag, so `over`
    // only ever narrows toward a specific anchor, never introduces a new
    // kind of answer. A Stub's drag ends the same way: `origin` is what
    // tells `toRequest` a sibling reorder from a detach from an attach.
    const regions = regionsRef.current;
    const region = placementRegion(current.pop, regions);

    // A Descendants release resolves from the session's projection
    // (`releaseDescendants`), never from `over`: mid-drag the ghost's *list
    // position* is `placementFor`'s static preview; only the release reads
    // the gap + depth the projection chose.
    if (region?.kind === 'descendants') {
      await releaseDescendants(current, region);
      return;
    }

    const list = releaseListFor(region);
    // Release always gives a decisive answer while locked in a column/
    // sub-row (`null` is reserved for `placementFor`'s mid-drag calls,
    // where there's genuinely nothing fresh yet to prefer over
    // `priorPlacement`) — over resolving to anything but the column/
    // sub-row's own container is a specific anchor; the container itself,
    // or dnd-kit finding no collision at all, is a bare hover with nothing
    // to anchor beside.
    //
    // The release sends exactly the anchor the blue line names
    // (`namedAnchorFor`), `over` being the dragged card's own row included
    // (`resolveBoardCollisions`: the ghost resting in its own slot). "After
    // the card above" and "before the card below" look the same in this
    // column but can differ in the workflow-wide order when items from
    // other workphases sit between them
    // (wiki board-drag-interaction §2, rule 5), so "stay" would contradict
    // the line. A ghost
    // with no neighbor at all has nothing to anchor to: the bare
    // container's slot (`resolvePlacementOver`).
    const anchor = namedAnchorFor(active, over, current);
    const placementOver = resolvePlacementOver(list, over ? String(over.id) : null, anchor);
    await commitRelease(current, placementFor(current, regions, placementOver), list?.rows ?? []);
  }

  // Which form `BoardView.tsx`'s `DragOverlay` draws right now, and how
  // wide — the same `overlayShapeFor` the re-anchor modifier reads, off the
  // same `session`/`regionsRef` pairing. `regionsRef.current` is safe to
  // read at render time here: every call site that changes `session`
  // (`beginDragAt`, `evaluatePop`'s hop loop) samples regions into it first,
  // in the same synchronous pass, so it already reflects this exact
  // `session` by the time React re-renders.
  const overlayShape = session ? overlayShapeFor(session.pop, regionsRef.current) : null;

  return {
    sensors,
    session,
    collisionDetection,
    dragModifiers,
    overlayForm: overlayShape?.form ?? 'short-card',
    overlayWidthPx: overlayShape?.widthPx ?? null,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}

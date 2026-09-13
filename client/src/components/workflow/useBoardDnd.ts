import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithDetails, Item, Column } from '../../types';
import { moveItem, type MoveItemInput } from '../../api/items';
import {
  bandDropResolution,
  buildColumnForWorkphaseMap,
  buildMoveInput,
  pendingPlacementFor,
  resolveBoardCollisions,
  resolveDropSide,
  resolveDropTarget,
  sendItemMove,
  type CollisionSession,
} from './boardDndUtils';
import { classifyDragTargets } from './dragClassification';
import { measureDragRegions, regionAt, type DragRegion, type Point } from './dragRegions';
import type { DragTuning } from './dragTuning';
import {
  advancePopSession,
  placementFor,
  popDueAt,
  releaseIntent,
  startPopSession,
  type PopSession,
} from './popSession';
import type { Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { DragSession } from './DragSessionContext';

// Drag-and-drop for the board's DndContext — the gesture layer of
// docs/wiki/board-drag-interaction. The rules live in pure modules
// (popSession.ts, dragRegions.ts, boardDndUtils.ts, itemListOps.ts); this
// hook owns the clocks, the DOM measurements, and the dnd-kit plumbing:
//
//   - the pointer is tracked with a window listener for the life of a Card
//     drag, and every sample runs the pop machine against freshly measured
//     regions (a pop that needs no movement — the cursor resting — fires
//     from a timer);
//   - the machine's state is mirrored into a ref so two closures dnd-kit
//     calls during *its* render can read it: the collision detection (which
//     decides `over`) and the DragOverlay modifier (which clamps the card
//     to its context while locked);
//   - the ghost is an ordinal placement (§10) over the list selectors —
//     nothing in `items` is mutated during a drag, so cancel is just
//     clearing it;
//   - a release resolves in-context through dnd-kit's `over` (anchor +
//     side) or, in another region, through that region's band (§5), and
//     the write goes out with its pending placement attached.
//
// Position values are never computed here (item-positioning §2): the
// request carries relative intent and the server's number lands through the
// write tracker.

export interface BoardDndDeps {
  board: BoardWithDetails | null;
  setBoard: React.Dispatch<React.SetStateAction<BoardWithDetails | null>>;
  items: Item[];
  tuning: DragTuning;
  previewPlacement: (itemId: string, placement: Placement | null) => void;
  writes: ItemWriteTracker;
  getWorkphaseItems: (workphaseId: string, isTerminal?: boolean) => Item[];
  getMergedColumnItems: (coveredWorkphaseIds: readonly string[], isTerminal?: boolean) => Item[];
  findWorkphaseForItem: (itemId: string) => string | null;
  handleReorderColumns: (orders: { id: string; position: number }[]) => Promise<void>;
  loadBoard: () => Promise<void>;
  /** The element the regions are measured under (the DndContext's wrapper). */
  rootRef: RefObject<HTMLElement | null>;
}

export function useBoardDnd(deps: BoardDndDeps) {
  const { board } = deps;
  const [session, setSession] = useState<DragSession | null>(null);

  // Mirrors for the closures that run outside React's render of this hook.
  const sessionRef = useRef<DragSession | null>(null);
  const regionsRef = useRef<DragRegion[]>([]);
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
  // The snap tween (§3): where the overlay was drawn last, and the tween in
  // flight, if any. `snapTick` exists only to re-render the overlay each
  // frame — the cursor may be perfectly still when a pop fires.
  const overlayTranslate = useRef<Point>({ x: 0, y: 0 });
  const snap = useRef<{ from: Point; startedAt: number } | null>(null);
  const snapFrame = useRef<number | null>(null);
  const [, setSnapTick] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Maps every covered workphase id -> the column that covers it.
  const columnForWorkphase = useMemo(() => buildColumnForWorkphaseMap<Column>(board?.columns ?? []), [board]);

  function updateSession(next: DragSession | null) {
    sessionRef.current = next;
    setSession(next);
  }

  function clearPopTimer() {
    if (popTimer.current !== null) clearTimeout(popTimer.current);
    popTimer.current = null;
  }

  function cancelSnap() {
    if (snapFrame.current !== null) cancelAnimationFrame(snapFrame.current);
    snapFrame.current = null;
    snap.current = null;
  }

  // Starts the tween from wherever the overlay was last drawn; each frame
  // re-renders so the modifier below can interpolate toward the (moving)
  // clamped target until the configured duration is up.
  function startSnap() {
    cancelSnap();
    if (latest.current.tuning.popSnapMs <= 0) return;
    snap.current = { from: { ...overlayTranslate.current }, startedAt: performance.now() };
    const frame = () => {
      const active = snap.current;
      if (!active) return;
      if (performance.now() - active.startedAt >= latest.current.tuning.popSnapMs) {
        snap.current = null;
        snapFrame.current = null;
      } else {
        snapFrame.current = requestAnimationFrame(frame);
      }
      setSnapTick(t => t + 1);
    };
    snapFrame.current = requestAnimationFrame(frame);
  }

  function measureRegions(): DragRegion[] {
    const root = latest.current.rootRef.current ?? document;
    regionsRef.current = measureDragRegions(root, latest.current.board?.columns ?? []);
    return regionsRef.current;
  }

  // One step of the pop machine against the current pointer; re-arms the
  // pop timer when the cursor is resting in a pop-eligible band.
  function evaluatePop() {
    const current = sessionRef.current;
    const pointer = pointerRef.current;
    if (!current?.pop || !pointer) return;
    const { tuning, previewPlacement } = latest.current;
    const now = performance.now();
    const regions = measureRegions();
    const pop = advancePopSession(current.pop, pointer, regions, tuning, now);
    if (pop !== current.pop) {
      if (pop.contextKey !== current.pop.contextKey) startSnap();
      updateSession({ ...current, pop });
      previewPlacement(current.activeItem.id, placementFor(pop, regions, current.activeItem.workphaseId));
    }
    clearPopTimer();
    const due = popDueAt(pop, tuning);
    if (due !== null) popTimer.current = setTimeout(() => evaluateRef.current(), Math.max(0, due - now));
  }
  useEffect(() => {
    evaluateRef.current = evaluatePop;
  });

  // Pointer tracking for the life of a Card drag.
  const machineActive = session?.pop != null;
  useEffect(() => {
    if (!machineActive) return;
    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      evaluateRef.current();
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (popTimer.current !== null) clearTimeout(popTimer.current);
      popTimer.current = null;
      if (snapFrame.current !== null) cancelAnimationFrame(snapFrame.current);
      snapFrame.current = null;
      snap.current = null;
    };
  }, [machineActive]);

  // dnd-kit calls this during its own render; it reads the mirrors.
  const collisionDetection = useCallback<CollisionDetection>(args => {
    const pop = sessionRef.current?.pop;
    let live: CollisionSession | null = null;
    if (pop) {
      const regions = regionsRef.current;
      const hover = pop.hover ? regions.find(r => r.key === pop.hover?.regionKey) : undefined;
      const context = regions.find(r => r.key === pop.contextKey);
      live = {
        hoverContainerId: hover?.containerId ?? null,
        context: context ? { containerId: context.containerId, rect: context.rect } : null,
      };
    }
    return resolveBoardCollisions(args, live);
  }, []);

  // §2 "bounded by its context": the DragOverlay can't leave the context
  // rect — sideways for a merged column, either axis for a sub-row. A pop
  // swaps the rect for the new context's, and since the cursor is inside it
  // at that moment the card's target is under the cursor — the snap of §3,
  // tweened over `popSnapMs` from where it was clamped — and it is bounded
  // there from then on. No context (a drag from Unsorted that hasn't popped
  // yet) passes the transform through. DndContext itself gets no modifier,
  // so the collision rect and `delta` stay raw.
  const clampToContext = useCallback<Modifier>(({ transform, draggingNodeRect }) => {
    const target = clampToCurrentContext(
      transform,
      draggingNodeRect,
      sessionRef.current?.pop ?? null,
      regionsRef.current,
    );
    const tween = snap.current;
    let drawn = target;
    if (tween) {
      const progress = Math.min(1, (performance.now() - tween.startedAt) / latest.current.tuning.popSnapMs);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic: fast start, settles
      drawn = {
        ...target,
        x: tween.from.x + (target.x - tween.from.x) * eased,
        y: tween.from.y + (target.y - tween.from.y) * eased,
      };
    }
    overlayTranslate.current = { x: drawn.x, y: drawn.y };
    return drawn;
  }, []);
  const overlayModifiers = useMemo(() => [clampToContext], [clampToContext]);

  function resolveDrop(active: Item, overId: string) {
    return resolveDropTarget(
      active.id,
      active.workphaseId,
      overId,
      latest.current.board?.columns ?? [],
      columnForWorkphase,
      latest.current.findWorkphaseForItem,
    );
  }

  function regionItems(region: DragRegion): Item[] {
    const { getMergedColumnItems, getWorkphaseItems } = latest.current;
    return region.key.startsWith('column:')
      ? getMergedColumnItems(region.coveredWorkphaseIds, region.isTerminal)
      : getWorkphaseItems(region.targetWorkphaseId, region.isTerminal);
  }

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type === 'column' || !board) return;
    const activeId = String(event.active.id);
    const activeItem = deps.items.find(i => i.id === activeId);
    if (!activeItem) return;

    // The cap comes off the board response (never hard-coded client-side)
    // so the server's constant governs both enforcement points.
    const classification = classifyDragTargets(activeId, deps.items, board.itemDepthCap);
    if (type !== 'card') {
      updateSession({ activeItem, classification, pop: null });
      return;
    }

    // §1: the drag starts in exactly one context — the region the cursor
    // (which is on the card) is in. Null from Unsorted: nothing to lock to.
    const activator = event.activatorEvent as Partial<PointerEvent>;
    pointerRef.current = { x: activator.clientX ?? 0, y: activator.clientY ?? 0 };
    const regions = measureRegions();
    const pop = startPopSession(regionAt(regions, pointerRef.current)?.key ?? null);
    updateSession({ activeItem, classification, pop });
    deps.previewPlacement(activeId, placementFor(pop, regions, activeItem.workphaseId));
  }

  // Escape / a cancelled gesture: nothing was written, so the ghost is the
  // only thing to undo.
  function handleDragCancel() {
    const current = sessionRef.current;
    clearPopTimer();
    cancelSnap();
    updateSession(null);
    if (current) deps.previewPlacement(current.activeItem.id, null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type;
    const current = sessionRef.current;
    clearPopTimer();
    cancelSnap();
    updateSession(null);

    const activeId = String(active.id);

    // ── Column reorder ──
    if (type === 'column') {
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
        deps.loadBoard();
      }
      return;
    }

    if (!current) return;
    const { activeItem } = current;
    // Resolved once, shared by every branch that anchors against `over` —
    // which half of the hovered card the dragged card's current position
    // falls in.
    const side = resolveDropSide(active.rect.current.translated, over?.rect);

    // ── Attached-sibling reorder (Epic 3.2 Part 3) ──
    // Position-only, scoped to the parent's other attached children — the
    // server derives that scope from the anchor's own (parentId, isAttached)
    // state. Never touches workphaseId; dragging a Stub *out* of its parent
    // stays closed until Story 5.
    if (type === 'attached-child') {
      if (!over || activeId === String(over.id)) return;
      const anchorId = String(over.id);
      const pending: Placement = { slot: { anchorId, side } };
      await sendItemMove(moveItem, activeId, { anchorId, side }, pending, deps.writes, deps.loadBoard);
      return;
    }

    // ── Card drop: in-context via `over`, or another region's band ──
    const input = resolveCardDrop(current, over ? String(over.id) : null, side);
    if (!input) {
      // Nothing to write (between columns, an Inert surface, a band that
      // asks for nothing new): the ghost goes and the card is where it was.
      deps.previewPlacement(activeId, null);
      return;
    }
    const pending = pendingPlacementFor(input, activeItem.workphaseId);
    await sendItemMove(moveItem, activeId, input, pending, deps.writes, deps.loadBoard);
  }

  function resolveCardDrop(ended: DragSession, overId: string | null, side: 'before' | 'after'): MoveItemInput | null {
    const { activeItem, pop } = ended;
    const pointer = pointerRef.current;
    const regions = measureRegions();
    const intent =
      pop && pointer ? releaseIntent(pop, pointer, regions, latest.current.tuning) : { kind: 'none' as const };

    if (intent.kind === 'in-context') {
      if (!overId) return null;
      const resolution = resolveDrop(activeItem, overId);
      return resolution ? buildMoveInput(resolution, side) : null;
    }
    if (intent.kind === 'band') {
      const resolved = bandDropResolution(intent.region, intent.band, activeItem, regionItems(intent.region));
      return resolved ? buildMoveInput(resolved.resolution, resolved.side) : null;
    }
    return null;
  }

  return { sensors, session, collisionDetection, overlayModifiers, handleDragStart, handleDragEnd, handleDragCancel };
}

type OverlayTransform = Parameters<Modifier>[0]['transform'];
type OverlayRect = Parameters<Modifier>[0]['draggingNodeRect'];

// The overlay's translation clamped to the context's rect — sideways for a
// merged column, either axis for a sub-row; untouched with no context.
function clampToCurrentContext(
  transform: OverlayTransform,
  rect: OverlayRect,
  pop: PopSession | null,
  regions: readonly DragRegion[],
): OverlayTransform {
  if (!pop || !rect) return transform;
  const context = regions.find(r => r.key === pop.contextKey);
  if (!context) return transform;
  const x = clampAxis(transform.x, rect.left, rect.width, context.rect.left, context.rect.right);
  const y = context.key.startsWith('subrow:')
    ? clampAxis(transform.y, rect.top, rect.height, context.rect.top, context.rect.bottom)
    : transform.y;
  return { ...transform, x, y };
}

// Keeps `origin + size` inside `[min, max]` by adjusting the translation.
function clampAxis(translate: number, origin: number, size: number, min: number, max: number): number {
  const low = min - origin;
  const high = max - size - origin;
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  return Math.min(hi, Math.max(lo, translate));
}

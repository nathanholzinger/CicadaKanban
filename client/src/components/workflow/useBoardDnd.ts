// The drag gesture's clocks, DOM measurement, and dnd-kit plumbing — composes
// popSession.ts, dragRegions.ts, boardDndUtils.ts, dragClassification.ts, itemListOps.ts.

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
import type { BoardWithDetails, Item } from '../../types';
import { moveItem } from '../../api/items';
import { findNearestAncestor } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';
import {
  resolveBoardCollisions,
  resolveDropSide,
  sendItemMove,
  toRequest,
  type CollisionSession,
} from './boardDndUtils';
import { classifyDragTargets, type DragClassification } from './dragClassification';
import {
  childRegionAt,
  descendantsRegionKey,
  isCardList,
  measureRegions,
  resolveDragStructure,
  type CardListRegion,
  type DragRegion,
  type DragStructure,
  type Point,
  type ShortCardMetrics,
} from './dragRegions';
import type { DragTuning } from './dragTuning';
import {
  advancePopSession,
  placementFor,
  placementRegion,
  popDueAt,
  startPopSession,
  type PlacementOver,
  type PopSession,
} from './popSession';
import { parentOpinionOf, type Placement, type Placements } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { DragSession } from './DragSessionContext';
import { CARD_LIST_GAP_PX, SHORT_CARD_HEIGHT_PX } from '../cardMetrics';

// Story 5 — a Stub's drag starts at its *containing Card's* Descendants
// layer: the nearest Free ancestor, whatever the Stub's own depth beneath
// it (wiki §1, §1.1, decision 1). Built on `getAncestors` (root..immediate-
// parent order, cycle-safe — audit Finding #11) rather than a bespoke
// parentId walk, so a corrupted parentId cycle in the data degrades the
// same way it already does everywhere else in the hierarchy math. `null`
// only if every ancestor up to a dangling/missing parentId is itself a
// Stub, which the depth cap makes unreachable in practice.
function containingCardIdOf(item: Item, items: readonly Item[]): string | null {
  return findNearestAncestor(item, items, n => !isStub(n))?.id ?? null;
}

// Story 4.1 Phase 1: the reservation basis, sourced from the card module
// (KanbanCard.tsx owns both — decision 3's "dependency points drag →
// card, never the reverse") and handed to the pure pop machine as plain
// data, the same way `tuning` already is.
const SHORT_CARD_METRICS: ShortCardMetrics = { heightPx: SHORT_CARD_HEIGHT_PX, gapPx: CARD_LIST_GAP_PX };

// Drag-and-drop for the board's DndContext — the gesture layer of
// docs/wiki/board-drag-interaction. The rules live in pure modules
// (popSession.ts, dragRegions.ts, boardDndUtils.ts, itemListOps.ts); this
// hook owns the clocks, the DOM measurements, and the dnd-kit plumbing:
//
//   - the pointer is tracked with a window listener for the life of a Card
//     drag, and every sample runs the pop machine against freshly measured
//     regions (a pop that needs no movement — the cursor resting — fires
//     from a timer);
//   - the machine's state is mirrored into a ref so the closures dnd-kit
//     calls during *its* render can read it: the collision detection (which
//     decides `over`) and the clamp modifier (which clamps the card to its
//     context while locked — passed to both `DndContext` and `DragOverlay`,
//     Phase 4/F8, so `over` and the live side line track the same bounded
//     position the overlay is actually drawn at);
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
  /** The live ordinal placements — read at drag start to stash a re-dragged item's pending marker (reconciliation #22). */
  placements: Placements;
  previewPlacement: (itemId: string, placement: Placement | null) => void;
  writes: ItemWriteTracker;
  getWorkphaseItems: (workphaseId: string, isTerminal?: boolean) => Item[];
  getMergedColumnItems: (coveredWorkphaseIds: readonly string[], isTerminal?: boolean) => Item[];
  /** Story 5: a Descendants region's own "others" list — the parent's other attached children, placement-aware. */
  getAttachedChildren: (parentId: string) => Item[];
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
  // Story 4.1 Phase 2: the board's structural facts (elements, kinds,
  // parent chains, scroll ancestors, column facts) — resolved once per
  // drag and again after each layer change, not on every pointer sample.
  const structureRef = useRef<DragStructure>([]);
  // Story 5: the active drag's own containing Card, if it started as a
  // Stub — threaded into every `resolveStructure` call (its Card/
  // Descendants regions resolve regardless of `isValidCard`, decisions 2/3)
  // without changing `resolveStructure`'s own call sites into needing the
  // full session. Null for a Free Card drag, for the life of that drag.
  const originCardIdRef = useRef<string | null>(null);
  const pointerRef = useRef<Point | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The ghost we last asked to be shown for the active drag's item — so the
  // reactive re-assertion below (#22) can tell "we meant it to be nothing
  // right now" from "something else cleared what we wanted." Compared by
  // reference: `previewPlacement` always stores exactly the object it's
  // given, so an unmolested placement reads back `===` this.
  const wantedPlacementRef = useRef<Placement | null>(null);
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

  // `classification` decides which Cards resolve as regions at all (§3.2:
  // an invalid target — cycle-forming, depth-capped — is never poppable,
  // and here that's simply "never a region," so nothing downstream has to
  // re-check validity). It's a parameter rather than read off the session
  // ref because the very first resolution of a drag (handleDragStart) runs
  // before the session exists yet — every call site below already has its
  // own classification in scope regardless.
  //
  // Story 4.1 Phase 2: structural (element ↔ key ↔ kind ↔ parent chain ↔
  // scroll ancestor ↔ column facts) and re-resolved only per drag and after
  // each layer change — a ghost migrating lists can remount the elements
  // underneath a cached reference, which is exactly what a layer change is
  // liable to cause.
  function resolveStructure(classification: DragClassification): DragStructure {
    const root = latest.current.rootRef.current ?? document;
    const isValidCard = (cardId: string): boolean => classification.states.get(cardId) === 'valid';
    structureRef.current = resolveDragStructure(
      root,
      latest.current.board?.columns ?? [],
      isValidCard,
      originCardIdRef.current ?? undefined,
    );
    return structureRef.current;
  }

  // The per-sample read: live rects and live card counts, scoped to
  // exactly what the locked layer can use — `scope` is the pop machine's
  // current `contextKey`, so this is the context region itself plus its
  // own children (F5: Board never reads a Card region; a locked column
  // never reads another column's).
  function sampleRegions(scope: string | null): DragRegion[] {
    regionsRef.current = measureRegions(structureRef.current, scope);
    return regionsRef.current;
  }

  // The one place the active drag's ghost is set — records what we asked
  // for in `wantedPlacementRef` so the reactive effect below knows whether
  // a later absence is ours or someone else's (#22).
  function setGhost(itemId: string, placement: Placement | null) {
    wantedPlacementRef.current = placement;
    deps.previewPlacement(itemId, placement);
  }

  // One step of the pop machine against the current pointer; re-arms the
  // pop timer when the cursor is resting in a pop-eligible band.
  function evaluatePop() {
    const current = sessionRef.current;
    const pointer = pointerRef.current;
    if (!current?.pop || !pointer) return;
    const { tuning } = latest.current;
    const now = performance.now();
    let regions = sampleRegions(current.pop.contextKey);
    let pop = advancePopSession(current.pop, pointer, regions, tuning, SHORT_CARD_METRICS, now);
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
    // Audit epic-3-5-story-5 #2 (Story 4 #13, worsened by Story 5's third
    // layer): a single re-resolve/re-sample/re-run only ever catches one
    // hop. A yank far enough (or, with a Card layer now in the stack, a
    // yank out of a Stub's section) to clear two thresholds in the same
    // sample cascades `pop.contextKey` through an intermediate layer
    // internally (`advancePopSession`'s own `transitionTo` recursion) that
    // this `regions` sample was never scoped for — `pop.contextKey` ends up
    // reporting the fully-cascaded layer while `regions` stays scoped to an
    // intermediate stop `placementRegion` can't find anything in, silently
    // dropping the ghost (and any release in that window) until the next
    // pointer sample or timer self-corrects it. Looping the resample/rerun
    // until the context truly stabilizes (not just once) catches every hop
    // this same sample is due for; bounded by the layer count so a
    // pathological oscillation can't spin forever. `startSnap` still runs
    // once per hop, same as before.
    let previousContextKey = current.pop.contextKey;
    for (let hops = 0; pop.contextKey !== previousContextKey && hops < 4; hops++) {
      startSnap();
      resolveStructure(current.classification);
      previousContextKey = pop.contextKey;
      regions = sampleRegions(pop.contextKey);
      pop = advancePopSession(pop, pointer, regions, tuning, SHORT_CARD_METRICS, now);
    }
    if (pop !== current.pop) {
      const next = { ...current, pop };
      updateSession(next);
      setGhost(current.activeItem.id, placementForSession(next, regions));
    }
    clearPopTimer();
    const due = popDueAt(pop, regions, tuning);
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
    const current = sessionRef.current;
    const pop = current?.pop;
    let live: CollisionSession | null = null;
    if (pop && current) {
      const regions = regionsRef.current;
      const hover = pop.hover ? regions.find(r => r.key === pop.hover?.regionKey) : undefined;
      const context = pop.contextKey === null ? undefined : regions.find(r => r.key === pop.contextKey);
      // Story 5: locked at a Descendants context, the in-context
      // candidates are the section's rows sharing the *origin's* own real
      // parentId (decision 1's "direct siblings" scope) — read off our own
      // session state, never dnd-kit's `active.data.current`, which is
      // exactly what decision 4 keeps from being load-bearing here.
      const siblingScopeParentId = context?.kind === 'descendants' ? parentOpinionOf(current.origin) : null;
      live = {
        // A Card hover (locked column/sub-row, tracking a zoom-in
        // candidate) never forces `over` — rule 1: a mere hover, not yet a
        // pop, must never drive anything a release would act on.
        hoverContainerId: hover && isCardList(hover) ? hover.containerId : null,
        // A locked Card or Descendants context has no `over` either
        // (decision 5, Story 4.1 Phase 0; Story 5 for Descendants): its
        // within-action is a constant, never a preview — today the target
        // Card would otherwise be its own only collision candidate, which
        // could light the live side indicator on it for no reason a
        // release would ever honor.
        context: context && isCardList(context) ? { containerId: context.containerId, rect: context.rect } : null,
        siblingScopeParentId,
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
  // yet) passes the transform through.
  //
  // Story 4.1 Phase 4 (F8) — this same modifier is now also passed to
  // `DndContext` itself (BoardView.tsx), not only `DragOverlay`: dnd-kit
  // feeds a `DndContext`-level modifier's output into both the collision
  // rect (`over`) and `active.rect.current.translated` (`resolveDropSide`'s
  // input), so without it those two tracked the *raw*, unclamped position
  // while only the visible copy was bounded — during the exit clock,
  // `closestCorners` could pick a card a column away from the visible copy,
  // and the live side line could flip to it too. Calling this twice (once
  // for each context) is idempotent for the *clamp*: `clampAxis` clamping
  // an already-clamped value returns it unchanged. The snap tween isn't —
  // both calls read the same `snap`/`overlayTranslate` refs, so for
  // ≤`popSnapMs` after a pop the second application re-eases an
  // already-eased point and its result is the one that sticks (audit
  // epic-3-5-story-4 watch-list #15). Cosmetic: the window is ≤150ms by
  // default and the collision rect only diverges from the drawn copy
  // within it, never after.
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
  // Shared by `DndContext` and `DragOverlay` alike (F8, above) — one array
  // reference so passing it to both doesn't create a new one every render.
  const dragModifiers = useMemo(() => [clampToContext], [clampToContext]);

  // Card lists only (a Card region never reaches a band resolution —
  // Story 4's within-action is a constant append, resolved without
  // consulting the region's rendered items at all).
  function regionItems(region: CardListRegion): Item[] {
    const { getMergedColumnItems, getWorkphaseItems } = latest.current;
    return region.kind === 'column'
      ? getMergedColumnItems(region.coveredWorkphaseIds, region.isTerminal)
      : getWorkphaseItems(region.targetWorkphaseId, region.isTerminal);
  }

  // Story 5: a Descendants region's own sibling scope — the origin's real
  // parent's other attached children (decision 1's "direct siblings," the
  // same scope `resolveBoardCollisions`' `siblingScopeParentId` restricts
  // collisions to). Null `parentId` (shouldn't arise — a Stub always has
  // one) reads as no siblings at all rather than every top-level Card.
  function siblingItems(parentId: string | null): Item[] {
    return parentId ? latest.current.getAttachedChildren(parentId) : [];
  }

  // Audit epic-3-5-story-5 #8: "which list is this release against" is one
  // fact about the region — Story 6's own "has a sortable container"
  // property — that `handleDragEnd` used to derive twice, twenty lines
  // apart: once for `placementOver`'s anchor/bare-container distinction,
  // again for `others`' candidate rows. One derivation, read by both; a
  // card region (or no region at all) has no release list, `null` either
  // way. `containerId: null` is exactly how a Descendants list (no bare-
  // container concept) tells apart from a card list's own real container.
  function releaseListFor(
    region: DragRegion | undefined,
    origin: Placement,
  ): { rows: Item[]; containerId: string | null } | null {
    if (!region) return null;
    if (region.kind === 'descendants') return { rows: siblingItems(parentOpinionOf(origin)), containerId: null };
    if (isCardList(region)) return { rows: regionItems(region), containerId: region.containerId };
    return null;
  }

  // Audit epic-3-5-story-5 #9: `placementFor`'s eight positional arguments
  // were unpacked from the session at four sites (each growing again
  // whenever Story 5 added a parameter). `PlacementSubject` is the slice
  // every one of those sites already had in hand — a full `DragSession`
  // satisfies it structurally, so a call site just passes what it's got.
  type PlacementSubject = Pick<DragSession, 'pop' | 'origin' | 'containingCardId' | 'priorPlacement'> & {
    activeItem: Pick<Item, 'workphaseId' | 'position'>;
  };
  function placementForSession(
    subject: PlacementSubject,
    regions: readonly DragRegion[],
    over: PlacementOver = null,
  ): Placement | null {
    return placementFor(
      subject.pop,
      regions,
      subject.activeItem.workphaseId,
      subject.activeItem.position,
      subject.origin,
      subject.containingCardId,
      subject.priorPlacement,
      over,
    );
  }

  // Closes both of `handleDragStart`'s branches identically: commit the
  // session, then set its own ghost from the same session's own placement.
  function beginSession(session: DragSession, regions: readonly DragRegion[]) {
    updateSession(session);
    setGhost(session.activeItem.id, placementForSession(session, regions));
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === 'column' || !board) return;
    const activeId = String(event.active.id);
    const activeItem = deps.items.find(i => i.id === activeId);
    if (!activeItem) return;

    // Whatever this item's placement was *before* this drag — non-null
    // only for a re-drag of an item whose earlier write is still pending
    // (its marker is sitting right there). Read before the ghost below
    // overwrites it; restored, instead of cleared, if that write is still
    // in flight when this drag ends without writing anything (#22).
    const priorPlacement = deps.placements.get(activeId) ?? null;

    // The cap comes off the board response (never hard-coded client-side)
    // so the server's constant governs both enforcement points.
    const classification = classifyDragTargets(activeId, deps.items, board.itemDepthCap);

    const activator = event.activatorEvent as Partial<PointerEvent>;
    pointerRef.current = { x: activator.clientX ?? 0, y: activator.clientY ?? 0 };

    // Story 5: a Stub's drag starts at its containing Card's Descendants
    // layer — deterministic, not hit-tested (unlike a Free Card's start
    // below, which depends on where the cursor happened to pick it up).
    // `isStub(activeItem)` reads the real, stored item — never dnd-kit's
    // own `data.role`, which only exists to keep the *droppable* side
    // (KanbanCard.tsx) legible and is never load-bearing here.
    if (isStub(activeItem)) {
      const containingCardId = containingCardIdOf(activeItem, deps.items);
      if (!containingCardId) return; // malformed data — every ancestor is itself a Stub
      originCardIdRef.current = containingCardId;
      resolveStructure(classification);
      const startContextKey = descendantsRegionKey(containingCardId);
      const regions = sampleRegions(startContextKey);
      const pop = startPopSession(startContextKey);
      // Story 4.1 Phase 3, extended by decision 2: where the drag
      // genuinely started — the Stub's own real, direct parent (not
      // necessarily `containingCardId`: a grandchild's direct parent is
      // another Stub), at its already-sorted slot. What `placementFor`'s
      // Card branch and `isIdentity` compare a resolved release against.
      const origin: Placement = { parentId: activeItem.parentId, slot: 'existing' };
      // Audit epic-3-5-story-5 #1: a Stub's own stored `workphaseId` is a
      // cache that goes stale the moment its containing Card is moved
      // through a client-observed write this session (`completeItemWrite`
      // upserts only the written row) — epic-4-decisions.md §9's own
      // invariant ("an attached item's workphaseId always equals its
      // nearest Free ancestor's") says the containing Card's *current* row
      // is always the fresh one, since a parent move writes that row
      // directly. Snapshotted onto `activeItem` itself, once, here — every
      // downstream `placementFor`/`toRequest` call in this drag (mid-drag
      // and at release alike) reads `session.activeItem.workphaseId` and
      // gets the fresh value for free, rather than the Stub's own copy.
      const containingCard = deps.items.find(i => i.id === containingCardId);
      const freshActiveItem = containingCard ? { ...activeItem, workphaseId: containingCard.workphaseId } : activeItem;
      beginSession(
        { activeItem: freshActiveItem, classification, pop, priorPlacement, origin, containingCardId },
        regions,
      );
      return;
    }

    // §1: the drag starts in exactly one context — always a column/sub-row
    // (a Card is never a *starting* context — only reachable by zooming
    // in), the region the cursor (which is on the card) is in. Null from
    // Unsorted: nothing to lock to.
    originCardIdRef.current = null;
    resolveStructure(classification);
    const boardScope = sampleRegions(null);
    const startContextKey = childRegionAt(boardScope, pointerRef.current, null)?.key ?? null;
    const regions = startContextKey === null ? boardScope : sampleRegions(startContextKey);
    const pop = startPopSession(startContextKey);
    // Story 4.1 Phase 3: where the item genuinely started — a Free Card's
    // own list, at whatever ordinal the position sort already gives it.
    // What `isIdentity` ultimately compares a resolved release against, at
    // every layer (decision 2).
    const origin: Placement = { workphaseId: activeItem.workphaseId ?? undefined, slot: 'existing' };
    beginSession({ activeItem, classification, pop, priorPlacement, origin, containingCardId: null }, regions);
  }

  // The ghost's placement is otherwise only ever set here, on the machine's
  // own state changes — a response completing an earlier, still-outstanding
  // write for the *active* drag's item (a re-drag scenario) clears it from
  // underneath the live gesture the moment it lands. This corrects that as
  // soon as it's visible in `deps.placements`, rather than waiting for the
  // next pointer move or band crossing (reconciliation #22). Compared
  // against `wantedPlacementRef`, not mere presence: the ghost legitimately
  // reads as absent whenever the cursor is over nothing, and reacting to
  // *that* would fight `previewPlacement`'s own Map churn forever.
  useEffect(() => {
    const current = sessionRef.current;
    if (!current?.pop) return;
    const wanted = wantedPlacementRef.current;
    if ((latest.current.placements.get(current.activeItem.id) ?? null) === wanted) return;
    latest.current.previewPlacement(current.activeItem.id, wanted);
  }, [deps.placements]);

  // Restores the item's pre-drag pending marker (if its write is still in
  // flight) instead of clearing the ghost outright — cancelling, or a
  // release that writes nothing, otherwise leaves it looking un-pending
  // until that write's response lands (wiki §10, reconciliation #22).
  function restorePriorPlacement(ended: DragSession) {
    const restore = deps.writes.isPending(ended.activeItem.id) ? ended.priorPlacement : null;
    deps.previewPlacement(ended.activeItem.id, restore);
  }

  // Escape / a cancelled gesture: nothing was written, so the ghost is the
  // only thing to undo.
  function handleDragCancel() {
    const current = sessionRef.current;
    clearPopTimer();
    cancelSnap();
    updateSession(null);
    if (current) restorePriorPlacement(current);
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
    const { activeItem, origin } = current;
    // Resolved once, shared by every branch that anchors against `over` —
    // which half of the hovered card the dragged card's current position
    // falls in.
    const side = resolveDropSide(active.rect.current.translated, over?.rect);

    // ── Item drop: the ghost's own placement is the request (decision 1) ──
    // No fresh geometry at release — `regionsRef` already holds exactly
    // what the machine's own final state needs, scoped to `current.pop`'s
    // own contextKey/hover by the last sample (Phase 2). `over` only means
    // anything while locked in a column/sub-row or a Descendants section
    // (Board-band and Card are the branches `placementFor` already had,
    // unchanged); a bare container hover or a done region's own card both
    // fall back to the same no-anchor slot `placementFor`'s in-context
    // branch already uses mid-drag, so `over` only ever narrows toward a
    // specific anchor, never introduces a new kind of answer. Story 5's
    // Stub drag ends the same way — the `attached-child` branch this used
    // to have of its own is gone; `origin` is what tells `toRequest` apart
    // a sibling reorder from a detach from an attach.
    const regions = regionsRef.current;
    const region = placementRegion(current.pop, regions);
    const list = releaseListFor(region, origin);
    // Release always gives a decisive answer while locked anywhere (`null`
    // is reserved for `placementFor`'s mid-drag calls, where there's
    // genuinely nothing fresh yet to prefer over `priorPlacement`) — over
    // resolving to anything but a column/sub-row's own container is a
    // specific anchor; the container itself, or dnd-kit finding no
    // collision at all, is a bare hover with nothing to anchor beside. A
    // Descendants context has no "container" concept at all (its own
    // droppable candidates are always specific sibling rows, never a bare
    // wrapper — `resolveBoardCollisions`'s `siblingScopeParentId` filter),
    // so any `over` there is already a specific anchor.
    const placementOver: PlacementOver = !list
      ? null
      : list.containerId === null
        ? over
          ? { anchorId: String(over.id), side }
          : null
        : over && String(over.id) !== list.containerId
          ? { anchorId: String(over.id), side }
          : 'container';
    const placement = placementForSession(current, regions, placementOver);
    const others = list ? list.rows.filter(i => i.id !== activeId) : [];
    const input = toRequest(activeItem, origin, placement, others);
    if (!input) {
      // Nothing to write — a null placement (drawn where it already is)
      // or an identity (decision 2): the ghost goes and the card is where
      // it was, or, if it had a pending marker from an earlier write still
      // in flight, that comes back instead (#22).
      restorePriorPlacement(current);
      return;
    }
    await sendItemMove(moveItem, activeId, input, placement, deps.writes, deps.loadBoard);
  }

  return { sensors, session, collisionDetection, dragModifiers, handleDragStart, handleDragEnd, handleDragCancel };
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
  // A sub-row bounds both axes (§1); so does a Card's Stub context, once
  // popped into one (Story 4 planning) — a merged column bounds x only.
  const y =
    context.kind !== 'column'
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

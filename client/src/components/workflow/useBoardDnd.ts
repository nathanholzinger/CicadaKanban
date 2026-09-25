// The drag gesture's clocks, DOM measurement, and dnd-kit plumbing — composes
// popSession.ts, dragRegions.ts, boardDndUtils.ts, dragClassification.ts, itemListOps.ts.

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
  type Over,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithDetails, Item } from '../../types';
import { moveItem } from '../../api/items';
import { findNearestAncestor, getDepth, getSubtreeHeight } from '../../lib/hierarchy';
import { flattenHierarchy, gapIndexFor, depthRangeFor, resolvePlacement } from '../../lib/hierarchyPlacement';
import { isStub } from '../../lib/isStub';
import {
  resolveBoardCollisions,
  dropAnchorFor,
  sendItemMove,
  toRequest,
  travelingRowsFor,
  type CollisionSession,
  type DropAnchor,
} from './boardDndUtils';
import { classifyDragTargets, isWithinDepthCap, type DragClassification } from './dragClassification';
import {
  childRegionAt,
  descendantsRegionKey,
  hasDetachedElements,
  isCardList,
  measureRegions,
  resolveDragStructure,
  type CardListRegion,
  type DescendantsRegion,
  type DragRegion,
  type DragStructure,
  type Point,
  type ShortCardMetrics,
} from './dragRegions';
import type { DragTuning } from './dragTuning';
import {
  advancePopSession,
  overlayFormFor,
  placementFor,
  placementRegion,
  popDueAt,
  startPopSession,
  type OverlayForm,
  type PlacementOver,
  type PopSession,
} from './popSession';
import { descendantsChildrenOf, type Placement, type Placements } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { DescendantsProjection, DragSession } from './DragSessionContext';
import {
  CARD_CONTENT_INSET_PX,
  CARD_LIST_GAP_PX,
  DESCENDANTS_INDENT_PX,
  SHORT_CARD_HEIGHT_PX,
  STUB_ROW_HEIGHT_PX,
} from '../cardMetrics';

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

// Story 6 Phase D, §7.2: "the dragged item carries its whole subtree" — the
// active item and every one of its descendants, never a Top/Bottom
// candidate at any Card's Descendants layer. `classification.states`
// already computed exactly this set at drag start (`dragClassification.ts`'s
// own `descendantIds ∪ activeId`, marked `'cycle-forming'` for the same
// reason a descendant can never be a *real target* for its own ancestor) —
// reading it back here is one fewer tree walk, not a second one.
function excludeIdsFor(classification: DragClassification): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const [id, state] of classification.states) if (state === 'cycle-forming') ids.add(id);
  return ids;
}

// Story 4.1 Phase 1: the reservation basis, sourced from the card module
// (KanbanCard.tsx owns both — decision 3's "dependency points drag →
// card, never the reverse") and handed to the pure pop machine as plain
// data, the same way `tuning` already is.
const SHORT_CARD_METRICS: ShortCardMetrics = { heightPx: SHORT_CARD_HEIGHT_PX, gapPx: CARD_LIST_GAP_PX };

// Story 6 Phase C: how wide the carried Stub (`KanbanCard.tsx`'s own
// `overlayIsStub` branch) draws — a row's own width in the context Card's
// section, read off
// whichever region is currently locked. A `descendants` region's rect
// already *is* that width (a row spans its section's full box); a `card`
// region's rect is the Card's own outer bound, so a row's width is that
// minus the Card's own inset on both sides — the same number whether or
// not the section itself has resolved (it hasn't yet for a childless Card,
// or for a target Card the drag hasn't zoomed into; Phase D is what would
// ever make a *different* Card's `descendants` region resolve here, and
// this needs no change when it does).
function overlayWidthFor(region: DragRegion | undefined): number | null {
  if (!region) return null;
  if (region.kind === 'descendants') return region.rect.width;
  if (region.kind === 'card') return region.rect.width - 2 * CARD_CONTENT_INSET_PX;
  return null;
}

// Drag-and-drop for the board's DndContext — the gesture layer of
// docs/wiki/board-drag-interaction. The rules live in pure modules
// (popSession.ts, dragRegions.ts, boardDndUtils.ts, itemListOps.ts,
// lib/hierarchyPlacement.ts); this hook owns the clocks, the DOM
// measurements, and the dnd-kit plumbing:
//
//   - the pointer is tracked with a window listener for the life of any
//     item drag (Card or Stub alike, Story 5), and every sample runs the
//     pop machine against freshly measured regions (a pop that needs no
//     movement — the cursor resting — fires from a timer);
//   - the machine's state is mirrored into a ref so the closures dnd-kit
//     calls during *its* render can read it: the collision detection (which
//     decides `over`) and the clamp modifier (which clamps the card to its
//     context while locked — passed to both `DndContext` and `DragOverlay`,
//     Phase 4/F8, so `over` and the live side line track the same bounded
//     position the overlay is actually drawn at);
//   - the ghost is an ordinal placement (§10) over the list selectors —
//     nothing in `items` is mutated during a drag, so cancel is just
//     clearing it;
//   - a release resolves in-context through `dropAnchorFor`'s own anchor +
//     lean (a column/sub-row), through §7's gap + depth rule against the
//     session's own live projection (a Descendants section,
//     `releaseDescendants`), or, popped out, through that region's band
//     (§5) — and the write goes out with its pending placement attached.
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
  // drag, again after each layer change, and again when a sample finds one
  // of its elements remounted; not on every pointer sample.
  const structureRef = useRef<DragStructure>([]);
  // Story 5: the active drag's own containing Card, if it started as a
  // Stub — threaded into every `resolveStructure` call (its Card/
  // Descendants regions resolve regardless of `isValidCard`, decisions 2/3)
  // without changing `resolveStructure`'s own call sites into needing the
  // full session. Null for a Free Card drag, for the life of that drag.
  const originCardIdRef = useRef<string | null>(null);
  // Story 6 Phase C: the overlay's own form at pickup — a Stub for a Stub's
  // own drag (it starts at the Descendants layer), the shortCard for a Free
  // Card drag (Board/Column layer). `clampToContext`'s re-anchor reads this
  // once per drag to know whether the *current* form differs from the one
  // the pointer's original offset was measured against — set fresh in every
  // `handleDragStart` branch below, same as `originCardIdRef`, so it never
  // needs an explicit reset elsewhere.
  const pickupFormRef = useRef<OverlayForm>('short-card');
  // Story 6, hands-on finding 3 (2026-09-24): the live named relation
  // (`boardDndUtils.ts::dropAnchorFor`'s own answer) — the same one the
  // blue line already draws (`KanbanCard.tsx::useLiveDropSide`), computed
  // here from dnd-kit's own `onDragMove` (`handleDragMove`, below) since
  // this hook isn't rendered under `DndContext` and so can't read
  // `useDndContext()` the way a Card row does. Fed into `advancePopSession`
  // as plain data, the same way `tuning`/`metrics` already are — the pure
  // pop machine never touches dnd-kit itself. Reset at the top of every
  // drag alongside the other per-drag refs, though the very next
  // `onDragMove` overwrites it regardless.
  const namedAnchorRef = useRef<DropAnchor | null>(null);
  // Story 6 Phase D, §7.2: the dragged item's own subtree (itself included)
  // — never a Top/Bottom candidate at any Card's Descendants layer.
  // Computed once at drag start (`excludeIdsFor`) from the same
  // classification every other validity question already reads, reused at
  // every Card's section for the life of the drag (the set is drag-global,
  // not per-Card).
  const excludeIdsRef = useRef<ReadonlySet<string>>(new Set());
  // Story 6 Phase D, §7.2: the dragged subtree's own height — the depth-cap
  // check's other input (`isWithinDepthCap`), computed once at drag start.
  const subtreeHeightRef = useRef<number>(0);
  // Story 6 Phase D, decision 3: the Descendants layer's own seed — the
  // depth and pointer-x the live projection's `depth = seedDepth +
  // round(deltaX / INDENT)` measures from. Set at pickup for a Stub's own
  // drag (it starts already locked there) or at the zoom-in transition for
  // an item entering from Card layer (`updateDescendantsProjection`, below);
  // null whenever the drag isn't currently locked at a `descendants:`
  // context (cleared on pop-out, same function).
  const projectionSeedRef = useRef<{ seedDepth: number; seedX: number } | null>(null);
  // The live tab state (`{gap, depth, valid}`) mirrored onto
  // `session.projection` — see `DragSessionContext.ts`'s own doc comment.
  const projectionRef = useRef<DescendantsProjection | null>(null);
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
  // scroll ancestor ↔ column facts) and re-resolved per drag, after each
  // layer change, and whenever `sampleRegions` finds a cached element gone
  // from the document (the remount that follows a layer change lands after
  // the layer change's own re-resolve — see `sampleRegions`).
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
  //
  // Re-resolves first if React has remounted any cached element since the
  // last resolve. A layer change re-resolves synchronously, *before* React
  // renders the new layer, and that render can remount a column's Cards
  // (Board layer's carve-out zones move them to a different child slot of
  // `DragCarveFrame`). A detached element measures as an empty box, so its
  // region silently dropped out: no Card in a column entered through Board
  // layer could ever be zoomed into (found in the Story 6 hands-on,
  // 2026-09-23). No session yet means the drag is starting and the
  // structure was resolved a moment ago.
  function sampleRegions(scope: string | null): DragRegion[] {
    const classification = sessionRef.current?.classification;
    if (classification && hasDetachedElements(structureRef.current)) resolveStructure(classification);
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

  // Story 6 Phase D, decision 4: the Descendants layer's own live tab state
  // (§7.1), mirrored onto `projectionRef` — null whenever `pop.contextKey`
  // isn't currently a `descendants:` context (decision 4's "cleared on
  // pop-out"). `previousContextKey` is the contextKey this same
  // `evaluatePop` sample started with, before any of its own transitions —
  // comparing it against `pop.contextKey`'s final value is what tells a
  // *fresh* zoom-in (seed here, decision 3's "the entered gap's Top depth,
  // aligned") from an ongoing hold in the same section (reseed skipped). A
  // Stub's own drag seeds itself at pickup instead (`handleDragStart`,
  // decision 3's other half — it starts already locked there, so there's
  // no zoom-in transition for this function to ever see), so the reseed
  // branch below is Phase D's zoom-in case exclusively.
  function updateDescendantsProjection(previousContextKey: string | null, pop: PopSession) {
    const key = pop.contextKey;
    if (!key || !key.startsWith('descendants:')) {
      projectionSeedRef.current = null;
      projectionRef.current = null;
      return;
    }
    const cardId = key.slice('descendants:'.length);
    const { getAttachedChildren, items, board } = latest.current;
    const childrenOf = descendantsChildrenOf(getAttachedChildren);
    const rows = flattenHierarchy(cardId, childrenOf, excludeIdsRef.current);

    if (key !== previousContextKey) {
      const gap = rows.length;
      const top = rows[gap - 1];
      projectionSeedRef.current = { seedDepth: top?.depth ?? 0, seedX: pointerRef.current?.x ?? 0 };
    }
    const seed = projectionSeedRef.current;
    if (!seed) return; // shouldn't happen — seeded above, or at pickup for a Stub's own drag

    // The gap follows the named relation `dropAnchorFor` already computed
    // this sample (`namedAnchorRef`, `handleDragMove`) — the same "gap is
    // the ghost's slot" rule Column layer uses (decision 2's amendment).
    // No fresh name this sample (a bare hover over the section with no row
    // under the cursor) keeps the last known gap rather than resetting it —
    // the sidebar's own "over the ghost row itself... keep the last
    // projection" reasoning, generalized to "no row named at all."
    const anchor = namedAnchorRef.current;
    const gap = anchor ? gapIndexFor(rows, anchor.anchorId, anchor.side) : (projectionRef.current?.gap ?? rows.length);
    const { lo, hi } = depthRangeFor(rows, gap);
    const pointerX = pointerRef.current?.x ?? seed.seedX;
    const rawDepth = seed.seedDepth + Math.round((pointerX - seed.seedX) / DESCENDANTS_INDENT_PX);
    const depth = Math.max(lo, Math.min(hi, rawDepth));
    const placement = resolvePlacement(rows, gap, depth, cardId, childrenOf, excludeIdsRef.current);
    // §7.2: the depth cap against the *resolved* parent's absolute depth —
    // the same predicate classification already uses, fed the placement's
    // own answer rather than a fixed one.
    const cap = board?.itemDepthCap ?? Number.POSITIVE_INFINITY;
    const parentDepth = getDepth(placement.parentId ?? cardId, items);
    const valid = isWithinDepthCap(parentDepth, subtreeHeightRef.current, cap);
    projectionRef.current = { gap, depth, valid };
  }

  function sameProjection(a: DescendantsProjection | null, b: DescendantsProjection | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.gap === b.gap && a.depth === b.depth && a.valid === b.valid;
  }

  // One step of the pop machine against the current pointer; re-arms the
  // pop timer when the cursor is resting in a pop-eligible band.
  function evaluatePop() {
    const current = sessionRef.current;
    const pointer = pointerRef.current;
    if (!current?.pop || !pointer) return;
    const { tuning } = latest.current;
    const now = performance.now();
    const priorContextKey = current.pop.contextKey;
    let regions = sampleRegions(current.pop.contextKey);
    let pop = advancePopSession(current.pop, pointer, regions, tuning, SHORT_CARD_METRICS, now, namedAnchorRef.current);
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
      pop = advancePopSession(pop, pointer, regions, tuning, SHORT_CARD_METRICS, now, namedAnchorRef.current);
    }
    updateDescendantsProjection(priorContextKey, pop);
    // Story 6 Phase D: the projection can change (a fresh gap or depth
    // choice) on a sample where `pop` itself doesn't — a locked
    // Descendants context has no further child region, so
    // `advancePopSession`'s own "inside" branch keeps returning the same
    // `pop` object once `hover`/`outsideSince` are already both null,
    // exactly the case while the cursor roams choosing a gap and depth.
    if (pop !== current.pop || !sameProjection(projectionRef.current, current.projection)) {
      const next = { ...current, pop, projection: projectionRef.current };
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

  // Pointer tracking for the life of a Card drag — every item drag runs the
  // pop machine (Story 5), so `pop` is never absent once `session` is.
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
      // Story 6 Phase B: locked at a Descendants context, the in-context
      // candidates are every Stub row inside the section's own rect (any
      // depth, decision 1's flat list) — read off the region we already
      // measured, never dnd-kit's `active.data.current`, which is exactly
      // what decision 4 keeps from being load-bearing here.
      const descendantsSectionRect = context?.kind === 'descendants' ? context.rect : null;
      live = {
        // A Card hover (locked column/sub-row, tracking a zoom-in
        // candidate) never forces `over` — rule 1: a mere hover, not yet a
        // pop, must never drive anything a release would act on.
        hoverContainerId: hover && isCardList(hover) ? hover.containerId : null,
        // A locked Card context has no `over` either (decision 5, Story
        // 4.1 Phase 0): its within-action is a constant, never a preview —
        // today the target Card would otherwise be its own only collision
        // candidate, which could light the live side indicator on it for
        // no reason a release would ever honor. Descendants has its own
        // branch above instead (a card-list container concept doesn't
        // apply to it).
        context: context && isCardList(context) ? { containerId: context.containerId, rect: context.rect } : null,
        descendantsSectionRect,
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
  //
  // Story 6 Phase C: `reanchorOverlayTransform` runs first, before the
  // clamp — the carried copy's own form switch (shortCard -> Stub, at the
  // Card-layer boundary) shrinks the box out from under dnd-kit's own
  // pointer-glued transform (dnd-kit tracks the *pickup* point, not a
  // fraction of the box, so a box that shrinks leaves the pointer beside
  // it, not on it). Targets `overlayWidthPx`/`STUB_ROW_HEIGHT_PX` — the
  // same numbers the render side already uses to size the Stub — rather
  // than dnd-kit's own `draggingNodeRect`: swapping the overlay's rendered
  // shape leaves that measurement stuck for a stretch (its ResizeObserver
  // is bound once, at the DragOverlay's *first* mount, to whatever the
  // pickup form's content happened to be; verified against a live drag,
  // not just @dnd-kit/core's source), so it can't be trusted as the
  // target's own dimensions here. Folding the re-anchor in ahead of
  // `clampToCurrentContext` means the clamp bounds where the copy will
  // *actually* sit post-re-anchor, and the snap tween below (already
  // triggered by the same contextKey change that changes the form)
  // interpolates the whole move — position and re-anchor together — in one
  // motion, exactly like any other pop.
  const clampToContext = useCallback<Modifier>(({ transform, draggingNodeRect, activatorEvent, activeNodeRect }) => {
    const pop = sessionRef.current?.pop ?? null;
    const overlayRegion = placementRegion(pop, regionsRef.current);
    const currentForm = overlayFormFor(overlayRegion);
    const reanchored = reanchorOverlayTransform(
      transform,
      activeNodeRect,
      activatorEvent,
      pointerRef.current,
      pickupFormRef.current,
      currentForm,
      overlayWidthFor(overlayRegion),
    );
    const target = clampToCurrentContext(reanchored, draggingNodeRect, pop, regionsRef.current);
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

  // Audit epic-3-5-story-5 #8: "which list is this release against" is one
  // fact about the region that `handleDragEnd` used to derive twice, twenty
  // lines apart: once for `placementOver`'s anchor/bare-container
  // distinction, again for `others`' candidate rows. One derivation, read
  // by both. Card-list regions only, since Story 6.1 Phase 0 (L1-5): a
  // Descendants release resolves through `releaseDescendants` instead
  // (Story 6 Phase D), before this is ever called; a Card region (or no
  // region at all) has no release list either, `null` both ways.
  function releaseListFor(region: DragRegion | undefined): { rows: Item[]; containerId: string } | null {
    if (!region) return null;
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

    // Story 6, finding 3: reset alongside the other per-drag refs, though
    // the next `onDragMove` overwrites it regardless of what a *previous*
    // drag left behind.
    namedAnchorRef.current = null;

    // Whatever this item's placement was *before* this drag — non-null
    // only for a re-drag of an item whose earlier write is still pending
    // (its marker is sitting right there). Read before the ghost below
    // overwrites it; restored, instead of cleared, if that write is still
    // in flight when this drag ends without writing anything (#22).
    const priorPlacement = deps.placements.get(activeId) ?? null;

    // The cap comes off the board response (never hard-coded client-side)
    // so the server's constant governs both enforcement points.
    const classification = classifyDragTargets(activeId, deps.items, board.itemDepthCap);
    // Story 6 Phase D, §7.2: the dragged subtree, never a Top/Bottom
    // candidate at any Card's Descendants layer this drag might reach —
    // computed once here, reused for every Card's section for the life of
    // the drag (not per-Card).
    excludeIdsRef.current = excludeIdsFor(classification);
    subtreeHeightRef.current = getSubtreeHeight(activeId, deps.items);

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
      // Story 6 Phase C: deterministically a Stub, same reasoning as the
      // comment above (this branch's own drag always starts at the
      // Descendants layer) — no region lookup needed to know it.
      pickupFormRef.current = 'stub';
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
      // Story 6 Phase D, decision 3: a Stub's own drag seeds the
      // projection at its own current depth (relative to its section's
      // root Card, the same reading `flattenHierarchy`'s rows give every
      // row) and its pickup x — there's no zoom-in transition to seed
      // from, since this drag starts already locked at Descendants.
      projectionSeedRef.current = {
        seedDepth: getDepth(activeId, deps.items) - getDepth(containingCardId, deps.items) - 1,
        seedX: pointerRef.current.x,
      };
      updateDescendantsProjection(startContextKey, pop);
      beginSession(
        {
          activeItem: freshActiveItem,
          classification,
          pop,
          priorPlacement,
          origin,
          containingCardId,
          projection: projectionRef.current,
        },
        regions,
      );
      return;
    }

    // §1: the drag starts in exactly one context — always a column/sub-row
    // (a Card is never a *starting* context — only reachable by zooming
    // in), the region the cursor (which is on the card) is in. Null from
    // Unsorted: nothing to lock to.
    originCardIdRef.current = null;
    // Story 6 Phase C: deterministically the shortCard, same reasoning as
    // the comment above (a Free Card never starts inside a Card).
    pickupFormRef.current = 'short-card';
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
    // A Free Card never starts locked at Descendants, so this only ever
    // clears the projection refs (harmless) — but it's still the one call
    // site that keeps them from ever leaking a *previous* drag's seed into
    // this one, the same reasoning `namedAnchorRef`'s own reset above has.
    updateDescendantsProjection(startContextKey, pop);
    beginSession(
      {
        activeItem,
        classification,
        pop,
        priorPlacement,
        origin,
        containingCardId: null,
        projection: projectionRef.current,
      },
      regions,
    );
  }

  // Story 6, hands-on finding 3 (2026-09-24): dnd-kit's own notification
  // that `active`/`over` changed shape this frame — the only source this
  // hook has for the live named relation (`namedAnchorRef`, above), since
  // it isn't rendered under `DndContext` and can't read `useDndContext()`
  // directly the way a Card row does. Recomputes `dropAnchorFor` exactly
  // the way the live blue line and `handleDragEnd` already do, then runs
  // the pop machine against it immediately — dnd-kit's own move events
  // aren't guaranteed to interleave with the raw `pointermove` listener
  // above in either order, so waiting for the next one could show the cue
  // a frame late rather than not at all, but never leaves it stale.
  function handleDragMove(event: DragMoveEvent) {
    if (event.active.data.current?.type === 'column') return;
    const travels = travelingRowsFor(sessionRef.current);
    namedAnchorRef.current = event.over ? dropAnchorFor(event.active, event.over, travels) : null;
    evaluateRef.current();
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

  // Story 6 Phase D — release at the Descendants layer (§7.1's full gap +
  // depth rule): `resolvePlacement` against the session's own *final*
  // projection (already live from the last sample, the same "regionsRef
  // already holds exactly what the machine needs" reasoning `handleDragEnd`
  // itself relies on) — not `over`'s bare anchor, which is only ever the
  // interim, mid-drag ordering (Story 5's table). An invalid state (§7.2's
  // "still reachable... commits nothing," the one exception to §3.2) takes
  // the same no-write path as a null placement — the marker restored,
  // never sent. `resolved.parentId` is never actually null for a board
  // Card's section (`resolvePlacement`'s root is always the real
  // `region.cardId`, never the sidebar's virtual `null` root) — the
  // fallback exists only so `getAttachedChildren` never sees `null`.
  async function releaseDescendants(session: DragSession, region: DescendantsRegion, activeId: string) {
    const { activeItem, origin } = session;
    const projection = session.projection;
    if (!projection || !projection.valid) {
      restorePriorPlacement(session);
      return;
    }
    const { getAttachedChildren } = latest.current;
    const childrenOf = descendantsChildrenOf(getAttachedChildren);
    const rows = flattenHierarchy(region.cardId, childrenOf, excludeIdsRef.current);
    const resolved = resolvePlacement(
      rows,
      projection.gap,
      projection.depth,
      region.cardId,
      childrenOf,
      excludeIdsRef.current,
    );
    const resolvedParentId = resolved.parentId ?? region.cardId;
    const others = getAttachedChildren(resolvedParentId).filter(i => i.id !== activeId);
    const placement: Placement = {
      parentId: resolvedParentId,
      slot: resolved.anchor ? { anchorId: resolved.anchor.id, side: resolved.anchor.side } : 'first',
    };
    const input = toRequest(activeItem, origin, placement, others);
    if (!input) {
      restorePriorPlacement(session);
      return;
    }
    await sendItemMove(moveItem, activeId, input, placement, deps.writes, deps.loadBoard);
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
    // Every branch that anchors against `over` takes its anchor from
    // `dropAnchorFor`, the same function the live blue line reads.
    const anchorOn = (o: Over): PlacementOver => dropAnchorFor(active, o);

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

    // Story 6 Phase D — release at the Descendants layer: §7's full gap +
    // depth rule, resolved fresh here against the session's own live
    // projection — not the static preview
    // `popSession.ts::placementFor`'s own Descendants branch still shows
    // mid-drag (decision 4's own "the projection carries the visual" — the
    // ghost's *list position* stayed Story 5's throughout the hold; only
    // the *release* changes). `releaseListFor`/`placementOver` below are
    // card-list-only (Story 6.1 Phase 0, L1-5) — a Descendants release
    // never reaches them.
    if (region?.kind === 'descendants') {
      await releaseDescendants(current, region, activeId);
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
    // Option A + lean (2026-09-24): the release sends exactly the anchor
    // the blue line names, `over` being the dragged card's own row
    // included (`resolveBoardCollisions`: the ghost resting in its own
    // slot). "After the card above" and "before the card below" look the
    // same in this column but can differ in the workflow-wide order when
    // items from other workphases sit between them (item-positioning §2),
    // so "stay" would contradict the line. A ghost with no neighbor at all
    // has nothing to anchor to: the bare container's slot.
    const placementOver: PlacementOver = !list
      ? null
      : !over || String(over.id) === list.containerId
        ? 'container'
        : (anchorOn(over) ?? 'container');
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

  // Story 6 Phase C: which form `BoardView.tsx`'s `DragOverlay` should draw
  // right now, and how wide a Stub-form draw should be — read off the same
  // `session`/`regionsRef` pairing `collisionDetection` and
  // `placementForSession` already use, so this agrees with the machine's
  // own idea of "where the drag is" by construction, not by re-deriving it.
  // `regionsRef.current` is safe to read at render time here: every call
  // site that changes `session` (`beginSession`, `evaluatePop`'s hop loop)
  // always samples regions into it first, in the same synchronous pass, so
  // it already reflects this exact `session` by the time React re-renders.
  const overlayRegion = session ? placementRegion(session.pop, regionsRef.current) : undefined;
  const overlayForm = overlayFormFor(overlayRegion);
  const overlayWidthPx = overlayWidthFor(overlayRegion);

  return {
    sensors,
    session,
    collisionDetection,
    dragModifiers,
    overlayForm,
    overlayWidthPx,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}

type OverlayTransform = Parameters<Modifier>[0]['transform'];
type OverlayRect = Parameters<Modifier>[0]['draggingNodeRect'];

// Story 6 Phase C: keeps the pointer on the carried copy across its own
// form switch into a Stub (shortCard/Stub -> Stub, at the Card-layer
// boundary) — dnd-kit's own transform only ever tracks the *pickup* point
// (pure pointer delta since activation, independent of the dragged node's
// size — verified against @dnd-kit/core's own source: the overlay case
// never folds a node-rect delta into `transform`), so a box that shrinks
// after pickup leaves that same point glued to the pointer while the
// box's visible edges move out from under it — exactly the "grabbed near
// the bottom edge" case the plan calls out.
//
// Targets `stubWidthPx` (the render side's own `overlayWidthFor`) and the
// fixed `STUB_ROW_HEIGHT_PX` rather than dnd-kit's live `draggingNodeRect`
// — see the call site's comment for why that measurement can't be trusted
// here. `pickupRect` (`activeNodeRect`, the *source* row, never swapped
// out mid-drag) stands in for "the overlay's own resting position," which
// is what it's frozen at for the whole drag regardless of which form is
// currently rendered (`PositionedOverlay`'s own `top`/`left`, verified
// live: both equal the pickup rect's).
//
// Never compensates back *out* of Stub form (`currentForm !== 'stub'`):
// growing larger while keeping the same pickup offset can never push the
// pointer outside the (now bigger) box the way shrinking can, so the
// natural, untouched transform already keeps the pointer on the copy —
// this is also what keeps every drag that never reaches Stub form
// byte-identical to before this phase. Nor while *already* in Stub form
// at pickup (`pickupForm === 'stub'`, a Stub's own drag) — nothing shrunk
// out from under anything, the natural offset is already right.
//
// Deliberately computes an absolute x/y from `pointerNow` instead of an
// offset relative to the incoming `transform`: this same modifier array
// runs *twice* per frame (F8, above — once inside `DndContext`'s own
// transform tracking, again inside `DragOverlay`'s render, chained, the
// second call's input being the first call's output), and `clampAxis` is
// safe to re-apply because clamping an in-range value is a true no-op —
// an *additive* compensation isn't, and would double itself on the second
// call. Reading `pointerRef.current` (this hook's own tracked pointer,
// independent of dnd-kit's modifier pipeline) instead of deriving "where
// the pointer is" from `transform` sidesteps that: both chained calls
// read the same live pointer and the same fixed target, so both compute
// the identical absolute answer.
function reanchorOverlayTransform(
  transform: OverlayTransform,
  pickupRect: OverlayRect,
  pointerAtPickup: Event | null,
  pointerNow: Point | null,
  pickupForm: OverlayForm,
  currentForm: OverlayForm,
  stubWidthPx: number | null,
): OverlayTransform {
  if (currentForm !== 'stub' || pickupForm === 'stub') return transform;
  if (!pickupRect || !pointerAtPickup || !pointerNow || stubWidthPx == null) return transform;
  if (!('clientX' in pointerAtPickup) || !('clientY' in pointerAtPickup)) return transform;
  const pickup = pointerAtPickup as PointerEvent;
  const pickupOffsetX = pickup.clientX - pickupRect.left;
  const fractionX = pickupRect.width > 0 ? pickupOffsetX / pickupRect.width : 0.5;
  return {
    ...transform,
    x: pointerNow.x - pickupRect.left - fractionX * stubWidthPx,
    y: pointerNow.y - pickupRect.top - STUB_ROW_HEIGHT_PX / 2,
  };
}

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

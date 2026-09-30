// The whole drag's context: activeItem, classification, pop, priorPlacement, origin,
// containingCardId, projection, plus PlacementsContext. useDropTargetState/
// useIsPending read it without prop drilling.

import { createContext, useContext } from 'react';
import type { Item } from '../../types';
import type { DragClassification, DropTargetState } from './dragClassification';
import { cardRegionKey, parseRegionKey } from './dragRegions';
import type { PopSession } from './popSession';
import type { Placement, Placements } from './itemListOps';
import type { ResolvedPlacement } from '../../lib/hierarchyPlacement';

// The Descendants layer's own tab state: which gap the ghost sits in, which
// depth is currently chosen within that gap's range, and whether the
// resulting parent is within the depth cap. Render state on the *session*,
// not a placement field — mid-drag the placement stays whatever put the row
// in the list (`placement.ts::placementFor`'s own Descendants branch); this
// is the visual the indentation and the invalid cue read, and what release
// resolves the real placement from. `data-drag-projection` on the board
// root exposes it as `"<gap>:<depth>:<valid>"` for E2E, the same style as
// `data-drag-context`.
export interface DescendantsProjection {
  gap: number;
  depth: number;
  valid: boolean;
  /**
   * The last sample's own resolved `{parentId, anchor}` —
   * `useBoardDnd.ts::releaseDescendants` sends this directly rather than
   * rebuilding the section's rows and calling `resolvePlacement` a second
   * time at release. Kept even while `!valid`, when a release commits
   * nothing (`descendantsProjection.ts::descendantsReleasePlacement`).
   */
  resolved: ResolvedPlacement;
  /**
   * The dragged Stub's own gap and depth, in its own Card's section: where
   * it already is. A release here writes nothing
   * (wiki board-drag-interaction §7.1).
   */
  atOwnSlot: boolean;
}

// Everything about the drag in progress, in one value: the carried item,
// what every target is to it, and the pop machine's state. Provided by
// BoardView for the life of a drag and null otherwise; read by Cards, Stubs
// and columns through the hooks below — a context rather than props for the
// same reason dragChrome.tsx's useLiveDropSide reads useDndContext directly:
// it would otherwise drill through BoardColumn / WorkphaseCardList /
// UnsortedBucket for values only the leaves need.
export interface DragSession {
  activeItem: Item;
  classification: DragClassification;
  /** The pop machine — every item drag runs it (a Stub's own sibling reorder is the Descendants layer's within-action, not a bypass). */
  pop: PopSession;
  /**
   * The item's placement as it stood *before* this drag touched it — null
   * for most drags, but a re-drag of an item whose earlier write is still
   * in flight starts with its pending marker already there. Restored on
   * cancel or a release that writes nothing, in place of clearing it
   * outright, when that write is still outstanding.
   */
  priorPlacement: Placement | null;
  /**
   * Where the item genuinely started — `{workphaseId, slot: 'existing'}`
   * for a Free Card, `{parentId, slot: 'existing'}` for a Stub — its own
   * real, direct `parentId`, not necessarily `containingCardId` below (a
   * grandchild's direct parent is another Stub). Unlike `priorPlacement` (a
   * *pending* marker from an earlier, still-in-flight write), this is
   * always set, and is what `isIdentity` compares a resolved release
   * against.
   */
  origin: Placement;
  /**
   * The Stub drag's own containing Card — the nearest Free ancestor,
   * whatever the Stub's depth beneath it — null for a Free Card drag.
   * Distinct from `origin`'s own `parentId`: this is the section root
   * `placementFor`'s Card-branch compares a locked Card region against to
   * tell "this is where I started" (→ `origin`, set back down) from "this is
   * a different Card" (→ attach as its last child), regardless of how many
   * Stub generations sit in between.
   */
  containingCardId: string | null;
  /**
   * The Descendants layer's own live tab state — null whenever the drag
   * isn't currently locked at a `descendants:` context (cleared on
   * pop-out). Seeded at the zoom-in transition (or at pickup, for a Stub's
   * own drag) and refreshed on every sample while locked there
   * (`useBoardDnd.ts`).
   */
  projection: DescendantsProjection | null;
}

export const DragSessionContext = createContext<DragSession | null>(null);

export function useDragSession(): DragSession | null {
  return useContext(DragSessionContext);
}

// Whether an item drag (Card or Stub) is live anywhere on the board — gates
// the column drop highlights.
export function useIsCardBeingDragged(): boolean {
  return useContext(DragSessionContext) !== null;
}

export interface DropTargetView {
  state: DropTargetState;
  /** A Free descendant of the carried item — the green relationship overlay. */
  isFreeDescendant: boolean;
}

// What this item is to the item currently being dragged, or null when no
// drag is in progress (or the item wasn't on the board when it began).
export function useDropTargetState(itemId: string): DropTargetView | null {
  const session = useContext(DragSessionContext);
  const state = session?.classification.states.get(itemId);
  if (!session || !state) return null;
  return { state, isFreeDescendant: session.classification.freeDescendantIds.has(itemId) };
}

// Which of this Card's own layers the drag is locked at: its Card layer,
// its Descendants section, or neither (null). Merely being hovered toward a
// zoom-in (before the threshold fires) doesn't count: a release
// right now would still commit the column's within-action. KanbanCard reads
// it three ways — forced open while either layer is locked (a collapsed Card
// can't show the ghost landing inside it, nor keep a Stub's own section
// drawn), the attach ghost at the Card layer, and the projected depth in the
// section.
export function useCardContextLayer(itemId: string): 'card' | 'descendants' | null {
  const contextKey = useContext(DragSessionContext)?.pop.contextKey;
  const parsed = contextKey ? parseRegionKey(contextKey) : null;
  if (!parsed || parsed.id !== itemId) return null;
  return parsed.kind === 'card' || parsed.kind === 'descendants' ? parsed.kind : null;
}

// Whether this Card is the locked column/sub-row's current zoom-in
// candidate — the one the blue line names — and which stage of the hold
// it's in. `'dwell'` shows nothing new (the blue line already draws the
// relation); `'cue'` is when the dashed outline + fill bar appear.
// `hover.phase` is only ever set by this candidate kind
// (`popSession.ts::namedCardCandidate`), never by a Board-layer band hover,
// so no extra check is needed to tell them apart.
export function useZoomCandidatePhase(itemId: string): 'dwell' | 'cue' | null {
  const hover = useContext(DragSessionContext)?.pop.hover;
  if (!hover?.phase || hover.regionKey !== cardRegionKey(itemId)) return null;
  return hover.phase;
}

// The ordinal placements (itemListOps.ts) — the live ghost and every
// pending write — so a Card or Stub can mark itself pending.
export const PlacementsContext = createContext<Placements>(new Map());

// Pending = the board is drawing this item at a slot the server hasn't
// confirmed yet (wiki board-drag-interaction §10). The item being carried
// right now has a placement too (the ghost) but isn't "pending" until it's
// released.
export function useIsPending(itemId: string): boolean {
  const placements = useContext(PlacementsContext);
  const session = useContext(DragSessionContext);
  return placements.has(itemId) && session?.activeItem.id !== itemId;
}

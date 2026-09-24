// The whole drag's context: activeItem, classification, pop, priorPlacement, origin,
// plus PlacementsContext. useDropTargetState/useIsPending read it without prop drilling.

import { createContext, useContext } from 'react';
import type { Item } from '../../types';
import type { DragClassification, DropTargetState } from './dragClassification';
import { cardRegionKey, descendantsRegionKey } from './dragRegions';
import type { PopSession } from './popSession';
import type { Placement, Placements } from './itemListOps';

// Epic 3.5 Story 6 Phase D (decision 4) — the Descendants layer's own §7.1
// tab state: which gap the ghost sits in, which depth is currently chosen
// within that gap's range, and whether the resulting parent is within the
// depth cap (§7.2). Render state on the *session*, not a placement field —
// mid-drag the placement stays whatever put the row in the list
// (`popSession.ts::placementFor`'s own Descendants branch, Story 5's
// table); this is the visual the indentation and the invalid cue read, and
// what release resolves the real placement from
// (`lib/hierarchyPlacement.ts::resolvePlacement`). `data-drag-projection`
// on the board root exposes it as `"<gap>:<depth>:<valid>"` for Story 10's
// E2E, the same style as `data-drag-context`.
export interface DescendantsProjection {
  gap: number;
  depth: number;
  valid: boolean;
}

// Everything about the drag in progress, in one value (audit
// epic-3-5-story-2 #14): the carried item, what every target is to it
// (Story 2), and the pop machine's state (Story 3). Provided by BoardView
// for the life of a drag and null otherwise; read by Cards, Stubs and
// columns through the hooks below — a context rather than props for the
// same reason KanbanCard's useLiveDropSide reads useDndContext directly: it
// would otherwise drill through BoardColumn / WorkphaseCardList /
// UnsortedBucket for values only the leaves need.
export interface DragSession {
  activeItem: Item;
  classification: DragClassification;
  /** The pop machine — every item drag runs it (Story 5: a Stub's own sibling reorder is the Descendants layer's within-action, not a bypass). */
  pop: PopSession;
  /**
   * The item's placement as it stood *before* this drag touched it — null
   * for most drags, but a re-drag of an item whose earlier write is still
   * in flight starts with its pending marker already there. Restored on
   * cancel or a release that writes nothing, in place of clearing it
   * outright, when that write is still outstanding (wiki–code
   * reconciliation #22).
   */
  priorPlacement: Placement | null;
  /**
   * Story 4.1 Phase 3: where the item genuinely started — `{workphaseId,
   * slot: 'existing'}` for a Free Card, `{parentId, slot: 'existing'}` for
   * a Stub (Story 5) — its own real, direct `parentId`, not necessarily
   * `containingCardId` below (a grandchild's direct parent is another
   * Stub). Unlike `priorPlacement` (a *pending* marker from an earlier,
   * still-in-flight write), this is always set, and is what `isIdentity`
   * compares a resolved release against — "same list, same ordinal" as
   * where the drag began is the general form decision 2 (2026-09-17)
   * names: a release back into the item's own slot writes nothing, at
   * every layer.
   */
  origin: Placement;
  /**
   * Story 5: the Stub drag's own containing Card — the nearest Free
   * ancestor, whatever the Stub's depth beneath it (decision 1) — null for
   * a Free Card drag. Distinct from `origin`'s own `parentId`: this is the
   * section root `placementFor`'s Card-branch compares a locked Card
   * region against to tell "this is where I started" (→ `origin`, set
   * back down) from "this is a different Card" (→ attach as its last
   * child), regardless of how many Stub generations sit in between.
   */
  containingCardId: string | null;
  /**
   * Story 6 Phase D: the Descendants layer's own live tab state — null
   * whenever the drag isn't currently locked at a `descendants:` context
   * (cleared on pop-out, per decision 4). Seeded at the zoom-in transition
   * (or at pickup, for a Stub's own drag) and refreshed on every sample
   * while locked there (`useBoardDnd.ts`).
   */
  projection: DescendantsProjection | null;
}

export const DragSessionContext = createContext<DragSession | null>(null);

export function useDragSession(): DragSession | null {
  return useContext(DragSessionContext);
}

// Whether an item drag (Card or Stub) is live anywhere on the board — gates
// the column drop highlights. Was a prop drilled three components deep.
export function useIsCardBeingDragged(): boolean {
  return useContext(DragSessionContext) !== null;
}

export interface DropTargetView {
  state: DropTargetState;
  /** A Free descendant of the carried item — the green relationship overlay (wiki §4). */
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

// Story 4: whether this Card is the pop machine's live attach target right
// now — the drag has popped fully into it. Merely being hovered toward
// that (before the zoom-in threshold fires) does *not* count (re-plan,
// 2026-09-16, rule 1): a release right now would still commit the column's
// own within-action, not attach here, so showing this cue early would
// promise something a drop wouldn't deliver. A collapsed Card can't show
// the ghost landing inside it, so KanbanCard uses this to force itself open
// for as long as it's true, independent of the user's own expand/collapse
// choice. Story 5: also true for the intermediate stop at a Stub's own
// containing Card (its within-action there is "set back down," not
// attach) — same forced-open need, since the Stub's own section has to
// stay visible for the drag's own row to keep rendering somewhere sane.
// Story 6 Phase D: also true once the drag has zoomed *into* this Card's
// own Descendants section — the section obviously has to stay rendered
// through its own within-action, not just through the Card layer above it.
export function useIsAttachTarget(itemId: string): boolean {
  const pop = useContext(DragSessionContext)?.pop;
  return pop?.contextKey === cardRegionKey(itemId) || pop?.contextKey === descendantsRegionKey(itemId);
}

// Story 6, hands-on finding 3 (2026-09-24): whether this Card is the
// locked column/sub-row's current zoom-in candidate — the one the blue
// line names — and which stage of the hold it's in. `'dwell'` shows
// nothing new (the blue line already draws the relation); `'cue'` is when
// the dashed outline + fill bar appear. `hover.phase` is only ever set by
// this candidate kind (`popSession.ts::namedCardCandidate`), never by a
// Board-layer band hover, so no extra check is needed to tell them apart.
export function useZoomCandidatePhase(itemId: string): 'dwell' | 'cue' | null {
  const hover = useContext(DragSessionContext)?.pop.hover;
  if (!hover?.phase || hover.regionKey !== cardRegionKey(itemId)) return null;
  return hover.phase;
}

// The ordinal placements (itemListOps.ts) — the live ghost and every
// pending write — so a Card or Stub can mark itself pending (wiki §10).
export const PlacementsContext = createContext<Placements>(new Map());

// Pending = the board is drawing this item at a slot the server hasn't
// confirmed yet. The item being carried right now has a placement too (the
// ghost) but isn't "pending" until it's released.
export function useIsPending(itemId: string): boolean {
  const placements = useContext(PlacementsContext);
  const session = useContext(DragSessionContext);
  return placements.has(itemId) && session?.activeItem.id !== itemId;
}

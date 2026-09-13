import { createContext, useContext } from 'react';
import type { Item } from '../../types';
import type { DragClassification, DropTargetState } from './dragClassification';
import type { PopSession } from './popSession';
import type { Placements } from './itemListOps';

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
  /** The pop machine — Card drags only; a Stub drag stays in its sibling list (Story 5 opens it). */
  pop: PopSession | null;
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

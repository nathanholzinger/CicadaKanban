import { createContext, useContext } from 'react';
import type { DragClassification, DropTargetState } from './dragClassification';

// The per-drag classification (dragClassification.ts), provided by BoardView
// for the life of a drag and null otherwise. Read by every Card and Stub
// through useDropTargetState below — a context rather than props for the
// same reason KanbanCard's useLiveDropSide reads useDndContext directly: it
// would otherwise drill through BoardColumn / WorkphaseCardList /
// UnsortedBucket for a value only the leaf needs.
export const DragClassificationContext = createContext<DragClassification | null>(null);

export interface DropTargetView {
  state: DropTargetState;
  /** A Free descendant of the carried item — the green relationship overlay (wiki §4). */
  isFreeDescendant: boolean;
}

// What this item is to the item currently being dragged, or null when no
// drag is in progress (or the item wasn't on the board when it began).
export function useDropTargetState(itemId: string): DropTargetView | null {
  const classification = useContext(DragClassificationContext);
  const state = classification?.states.get(itemId);
  if (!classification || !state) return null;
  return { state, isFreeDescendant: classification.freeDescendantIds.has(itemId) };
}

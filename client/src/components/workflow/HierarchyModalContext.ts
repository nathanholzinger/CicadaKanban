// Which Card's hierarchy modal is open, and how to open and close it. A context rather than props
// for the reason `DragSessionContext.ts` is one: a Card reads it without it drilling through
// BoardColumn and CardList (its overflow row gets `onOpen` as a prop). `BoardView.tsx` owns the
// state, which the drag hook (`useBoardDnd.ts`) also reads and closes.

import { createContext, useContext } from 'react';

export interface HierarchyModalState {
  /** The Card whose whole hierarchy the modal shows; null while it's closed. */
  openCardId: string | null;
  open: (cardId: string) => void;
  close: () => void;
}

export const HierarchyModalContext = createContext<HierarchyModalState>({
  openCardId: null,
  open: () => {},
  close: () => {},
});

export function useHierarchyModal(): HierarchyModalState {
  return useContext(HierarchyModalContext);
}

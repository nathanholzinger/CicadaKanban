// Which Cards' lists of Stubs the user has opened or closed by hand, kept by item id above everything
// the board's reload and a Card's moves unmount (wiki item-attachment §12). A Card is a different
// component instance in each column and sub-row it is drawn in, and after each reload, so a choice
// held in the Card itself would be lost with it. A Card with no entry starts from the board's setting
// as the board last loaded it (`KanbanCard.tsx`). `BoardView.tsx` holds the store, in memory only:
// reloading the page starts every list again from the setting.

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface CardExpansionState {
  /** The Cards whose list the user has set, by item id: true open, false closed. */
  choices: ReadonlyMap<string, boolean>;
  choose: (itemId: string, open: boolean) => void;
}

export const CardExpansionContext = createContext<CardExpansionState>({
  choices: new Map(),
  choose: () => {},
});

export function useCardExpansion(): CardExpansionState {
  return useContext(CardExpansionContext);
}

/** The store itself, for whoever provides the context. */
export function useCardExpansionStore(): CardExpansionState {
  const [choices, setChoices] = useState<ReadonlyMap<string, boolean>>(() => new Map());
  const choose = useCallback((itemId: string, open: boolean) => {
    setChoices(prev => (prev.get(itemId) === open ? prev : new Map(prev).set(itemId, open)));
  }, []);
  return useMemo(() => ({ choices, choose }), [choices, choose]);
}

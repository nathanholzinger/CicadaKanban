// Tells a row whether it is the item that was being dragged when the board stopped the drag, so it
// flashes on the reloaded board.

import { createContext, useContext } from 'react';

// The item to flash, or null: no flash is due (none was reported, it has played, or another reload
// has started since), or the flash is switched off. `useForcedStop.ts` holds when it is due.
export const ForcedStopFlashContext = createContext<string | null>(null);

export function useIsFlashedAfterStop(itemId: string): boolean {
  return useContext(ForcedStopFlashContext) === itemId;
}

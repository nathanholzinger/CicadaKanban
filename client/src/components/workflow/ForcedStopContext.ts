// Tells a row whether it is the item that was being dragged when the board stopped the drag, so it
// flashes on the reloaded board.

import { createContext, useContext } from 'react';

// The item to flash, or null: no stop is showing, or the flash is switched off.
export const ForcedStopFlashContext = createContext<string | null>(null);

export function useIsFlashedAfterStop(itemId: string): boolean {
  return useContext(ForcedStopFlashContext) === itemId;
}

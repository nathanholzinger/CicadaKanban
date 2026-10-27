// Supplies the live dragTuning values to the components that draw a drag cue.

import { createContext, useContext } from 'react';
import { DEFAULT_DRAG_TUNING, type DragTuning } from './dragTuning';

// The live tuning values (dragTuning.ts), owned by BoardView and edited by
// the dev/test panel, for the pieces of the board that *draw* them — a
// Card's zoom-in cue, timed by `cardPopInDelayMs`, and an overflow row's hold cue, timed by
// `modalHoldCueMs`. The drag hook takes the
// tuning as a plain dependency instead; nothing here is read on the pointer
// path.
export const DragTuningContext = createContext<DragTuning>(DEFAULT_DRAG_TUNING);

export function useDragTuning(): DragTuning {
  return useContext(DragTuningContext);
}

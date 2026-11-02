// A drag the board stops (wiki board-drag-interaction §10): a reload the drag layer asks for ends
// a live item drag, nothing is written, and the board says so. This is the signal the hook reports
// (`useBoardDnd.ts::resyncBoard`) and the words the cue draws for it (`ForcedStopCue.tsx`).

import type { Point } from './dragRegions';

// Why the board reloaded. A failed write also undid an earlier drop the user may not have noticed;
// a refresh did not, it only took the pairs a stale response carried.
export type StopCause = 'write-failed' | 'refresh';

export interface ForcedStop {
  cause: StopCause;
  /** The pointer's last position, where the drag was when it ended. */
  point: Point | null;
  /** The item that was being dragged, for the board to find on the reloaded board. */
  itemId: string;
}

export const STOP_WORDING: Record<StopCause, string> = {
  'write-failed': 'Your last move didn’t save, so the board reloaded. Nothing moved.',
  refresh: 'The board refreshed, which stopped your drag. Nothing moved.',
};

export type StopLook = 'banner' | 'note';

// The tuning value is a free string (`dragTuning.ts` keeps only the type of a stored value).
export function stopLookOf(value: string): StopLook {
  return value === 'note' ? 'note' : 'banner';
}

// One stop the dev/test panel has armed: the next item drag calls for a reload `afterMs` after it
// starts, with `cause`, down the same path a failed write or a stale response takes.
export interface ArmedStop {
  cause: StopCause;
  afterMs: number;
}

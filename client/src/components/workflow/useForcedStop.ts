// The cue for a drag the board stopped: the stop the drag layer reported, until `cueMs` has passed
// or the next drag starts (wiki board-drag-interaction §10). Held by `BoardView`, above the reload
// the stop causes, which swaps the board for "Loading board…" and unmounts everything below it.

import { useCallback, useEffect, useState } from 'react';
import type { ForcedStop } from './forcedStop';

export function useForcedStop(cueMs: number) {
  const [stop, setStop] = useState<ForcedStop | null>(null);

  // A new stop starts the clock afresh; a cleared one has none running.
  useEffect(() => {
    if (!stop) return;
    const timer = setTimeout(() => setStop(null), cueMs);
    return () => clearTimeout(timer);
  }, [stop, cueMs]);

  const clear = useCallback(() => setStop(null), []);
  return { stop, report: setStop, clear };
}

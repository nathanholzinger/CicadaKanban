// The cue for a drag the board stopped (wiki board-drag-interaction §10), in two lifetimes:
//   - the banner is the stop the drag layer reported, until `cueMs` has passed or the next drag starts;
//   - the flash is the stopped item, named for the reloaded board to draw flashing. It waits for the
//     reload the stop caused to draw the board, plays for `STOP_FLASH_MS`, and a flash that is playing
//     is let go sooner by another reload starting, so a reload with no stop behind it flashes nothing.
//     A flash still waiting survives reloads starting, until the board is drawn. A stop with no item
//     (a column drag's) names none.
// Held by `BoardView`, above the reload the stop causes, which swaps the board for "Loading
// board…" and unmounts everything below it.

import { useCallback, useEffect, useState } from 'react';
import { STOP_FLASH_MS, type ForcedStop } from './forcedStop';

// `key` changes with each stop, so a stop that replaces a live one draws a fresh banner.
interface HeldStop {
  stop: ForcedStop;
  key: number;
}

// `playing` is false until the stop's reload has drawn the board.
interface Flash {
  itemId: string;
  playing: boolean;
}

export function useForcedStop(cueMs: number) {
  const [held, setHeld] = useState<HeldStop | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);

  // A new stop starts the clock afresh; a cleared one has none running.
  useEffect(() => {
    if (!held) return;
    const timer = setTimeout(() => setHeld(null), cueMs);
    return () => clearTimeout(timer);
  }, [held, cueMs]);

  const playing = flash?.playing ?? false;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setFlash(null), STOP_FLASH_MS);
    return () => clearTimeout(timer);
  }, [playing]);

  const report = useCallback((stop: ForcedStop) => {
    setHeld(prev => ({ stop, key: (prev?.key ?? 0) + 1 }));
    setFlash(stop.itemId === null ? null : { itemId: stop.itemId, playing: false });
  }, []);
  const clear = useCallback(() => {
    setHeld(null);
    setFlash(null);
  }, []);
  // A reload is starting. The one a stop asks for starts right after it is reported, so a flash
  // still waiting is left alone; one already playing is let go, so the rows this reload draws
  // don't flash again.
  const reloadStarted = useCallback(() => setFlash(prev => (prev?.playing ? null : prev)), []);
  // The reloaded board is drawn, and a flash waiting for it plays.
  const boardDrawn = useCallback(
    () => setFlash(prev => (prev && !prev.playing ? { ...prev, playing: true } : prev)),
    [],
  );

  return {
    stop: held?.stop ?? null,
    stopKey: held?.key,
    /** The item whose row flashes, or null when no flash is due. */
    flashItemId: flash?.itemId ?? null,
    report,
    clear,
    reloadStarted,
    boardDrawn,
  };
}

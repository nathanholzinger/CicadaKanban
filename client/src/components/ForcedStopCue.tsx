// The cue a drag the board stopped shows (wiki board-drag-interaction §10): a banner along the
// window's top edge, drawn only while a stop is live. The cue's own lifetime is `useForcedStop.ts`'s,
// and `BoardView` draws this above the reload that swaps the board out from under it.

import { STOP_WORDING, type ForcedStop } from './workflow/forcedStop';

interface ForcedStopCueProps {
  stop: ForcedStop | null;
  /** Changes with each stop, so one that replaces a live stop draws a fresh banner and restarts the fade. */
  stopKey?: number;
  /** How long the cue stays, which the fade is timed to. */
  cueMs: number;
}

const BANNER =
  'pointer-events-none fixed inset-x-0 top-0 z-[100] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 shadow-lg';

export default function ForcedStopCue({ stop, stopKey, cueMs }: ForcedStopCueProps) {
  if (!stop) return null;
  return (
    <p
      key={stopKey}
      data-forced-stop={stop.cause}
      className={BANNER}
      style={{
        animationName: 'forced-stop-fade',
        animationDuration: `${cueMs}ms`,
        animationTimingFunction: 'linear',
        animationFillMode: 'forwards',
      }}
    >
      {STOP_WORDING[stop.cause]}
    </p>
  );
}

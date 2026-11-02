// The cue a drag the board stopped shows (wiki board-drag-interaction §10): a banner along the
// window's top edge. The status element is always present, so assistive tech has a live region to
// announce into when a stop lands; the cue's own lifetime is `useForcedStop.ts`'s, and `BoardView`
// draws this above the reload that swaps the board out from under it.

import { STOP_WORDING, type ForcedStop } from './workflow/forcedStop';

interface ForcedStopCueProps {
  stop: ForcedStop | null;
  /** How long the cue stays, which the fade is timed to. */
  cueMs: number;
}

const BANNER = 'fixed inset-x-0 top-0 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 shadow-lg';

export default function ForcedStopCue({ stop, cueMs }: ForcedStopCueProps) {
  return (
    <div role="status" className="pointer-events-none fixed top-0 left-0 z-[100]">
      {stop && (
        <p
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
      )}
    </div>
  );
}

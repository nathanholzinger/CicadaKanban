// The cue a drag the board stopped shows (wiki board-drag-interaction §10). Two candidate looks, one
// text: a banner along the top edge, or a note at the point the drag stopped. The status element is
// always present, so assistive tech has a live region to announce into when a stop lands; the cue's
// own lifetime is `useForcedStop.ts`'s, and `BoardView` draws this above the reload that swaps the
// board out from under it.

import type { CSSProperties } from 'react';
import { STOP_WORDING, type ForcedStop, type StopLook } from './workflow/forcedStop';

interface ForcedStopCueProps {
  stop: ForcedStop | null;
  look: StopLook;
  /** How long the cue stays, which the fade is timed to. */
  cueMs: number;
}

const BANNER = 'fixed inset-x-0 top-0 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 shadow-lg';
const NOTE =
  'fixed w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-md border border-amber-500 bg-zinc-900 px-3 py-1.5 text-xs text-amber-200 shadow-lg';
// Keeps the note's centered box inside the window.
const NOTE_HALF_WIDTH_PX = 160;
const NOTE_RISE_PX = 16;

function noteStyle(point: NonNullable<ForcedStop['point']>): CSSProperties {
  const left = Math.min(Math.max(point.x, NOTE_HALF_WIDTH_PX), Math.max(window.innerWidth - NOTE_HALF_WIDTH_PX, 0));
  return { left, top: Math.max(point.y - NOTE_RISE_PX, 0) };
}

export default function ForcedStopCue({ stop, look, cueMs }: ForcedStopCueProps) {
  // A note needs the pointer; without one the banner says it.
  const notePoint = look === 'note' ? (stop?.point ?? null) : null;
  return (
    <div role="status" className="pointer-events-none fixed top-0 left-0 z-[100]">
      {stop && (
        <p
          data-forced-stop={stop.cause}
          data-forced-stop-look={notePoint ? 'note' : 'banner'}
          className={notePoint ? NOTE : BANNER}
          style={{
            ...(notePoint ? noteStyle(notePoint) : null),
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

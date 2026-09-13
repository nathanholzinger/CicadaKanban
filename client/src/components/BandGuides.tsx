import type { CSSProperties } from 'react';
import { useDragSession } from './workflow/DragSessionContext';
import { useDragTuning } from './workflow/DragTuningContext';
import type { Band } from './workflow/dragRegions';

// Epic 3.5 Story 3 — the column drop bands, made visible (docs/wiki/board-
// drag-interaction §5). While a Card is being dragged, every region the
// card doesn't currently belong to shows two dashed lines at the configured
// band boundaries: above the first is "before the first item", below the
// second "after the last", between them "keep your position" (and the
// pop-eligible zone). The card's own context shows nothing — in-context a
// release is anchor + side, and the absence of lines is what says so.
//
// Two renderings of the same thing:
//   - BandGuides, inside each region element, at percentages of its live
//     height — for every region the cursor is *not* in;
//   - HoveredBandGuide, one fixed-position box drawn from the rect the pop
//     machine froze when the cursor entered the region (popSession.ts's
//     PopHover.rect), with the band the cursor is in tinted. The frozen
//     rect is what the drop resolves against, so the lines show exactly
//     where it will land even after the ghost's insertion has grown the
//     list under it.
//
// Provisional look, like the §4 overlays — Story 8 tunes it.

const LINE = 'pointer-events-none absolute right-2 left-2 border-t border-dashed border-zinc-400/35';
const SECTION = 'pointer-events-none absolute right-0 left-0 bg-blue-400/10';

function linePositions(tuning: { columnTopBand: number; columnBottomBand: number }) {
  return { top: tuning.columnTopBand, bottom: 1 - tuning.columnBottomBand };
}

interface BandGuidesProps {
  regionKey: string;
}

export function BandGuides({ regionKey }: BandGuidesProps) {
  const session = useDragSession();
  const tuning = useDragTuning();
  const pop = session?.pop;
  if (!pop || pop.contextKey === regionKey || pop.hover?.regionKey === regionKey) return null;
  const { top, bottom } = linePositions(tuning);
  return (
    <>
      <div aria-hidden className={LINE} style={{ top: `${top * 100}%` }} />
      <div aria-hidden className={LINE} style={{ top: `${bottom * 100}%` }} />
    </>
  );
}

// The band the cursor is in, as a slice of the frozen rect.
function sectionStyle(band: Band, top: number, bottom: number): CSSProperties {
  if (band === 'top') return { top: 0, height: `${top * 100}%` };
  if (band === 'bottom') return { top: `${bottom * 100}%`, bottom: 0 };
  return { top: `${top * 100}%`, height: `${(bottom - top) * 100}%` };
}

export function HoveredBandGuide() {
  const session = useDragSession();
  const tuning = useDragTuning();
  const hover = session?.pop?.hover;
  if (!hover) return null;
  const { top, bottom } = linePositions(tuning);
  const { rect, band } = hover;
  return (
    <div
      aria-hidden
      data-band-highlight={band}
      className="pointer-events-none fixed z-40 rounded-xl"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      <div className={`${SECTION} rounded-xl`} style={sectionStyle(band, top, bottom)} />
      <div className={LINE} style={{ top: `${top * 100}%` }} />
      <div className={LINE} style={{ top: `${bottom * 100}%` }} />
    </div>
  );
}

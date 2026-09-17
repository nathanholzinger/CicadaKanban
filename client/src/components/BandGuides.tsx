import type { ReactNode } from 'react';
import { useDragSession } from './workflow/DragSessionContext';
import { useDragTuning } from './workflow/DragTuningContext';
import { DRAG_CARD_COUNT_ATTR, DRAG_REGION_ATTR } from './workflow/dragRegions';

// Epic 3.5 Story 8 re-plan (2026-09-16) — the column drop bands, made
// visible (docs/wiki/board-drag-interaction §5), reworked from Story 3's
// percentage-of-height overlay to a content-anchored, space-reserving one.
// These are Board layer's own cues, and only Board layer's: while a Card is
// genuinely locked into anything — a column/sub-row, or a Card — every
// carve-out disappears, since nothing about a bare hover elsewhere changes
// what a release commits.
//
// At Board layer, every region reserves exactly one collapsed ghost card's
// height (`tuning.ghostCardHeightPx`) for the life of the drag, so nothing
// about a region's total size ever changes as the drag moves around the
// board — only *where* that reservation currently is:
//   - not the live hover target: two half-height dead zones, "Move Top" /
//     "Move Bottom", carved out of the region's own real content (its
//     cards shift down to make room) — never the visible-scrolled slice,
//     so a boundary scrolled out of view is neither drawn nor reachable
//     until it's scrolled to.
//   - the live hover target (about to be committed on release, though not
//     yet locked in): the dead zones collapse and a real ghost (itemListOps'
//     ordinal placement) fills the reservation instead — same net height.
//     The divider lines stay, at the same fixed offsets, since the ghost's
//     own insertion is exactly what they have to stay stable against.
// Terminal and truly-empty regions collapse to one single band spanning
// their own height (no top/bottom to speak of — dragRegions.ts::bandFor).
//
// Two special cases the Product Owner settled 2026-09-16: an empty region
// carves the *full* ghost height, not two halves (nothing to shift out of
// the way); a region with exactly one card halves both edges instead of
// the normal full height, so the card stays a real, unlabeled middle band
// rather than being bisected into top/bottom with nothing left between.
//
// Card (KanbanCard.tsx) draws the active-context outline directly on
// itself; this file draws it for a column/sub-row instead, plus everything
// above — a column/sub-row and a Card are the two places a context can be.

// Whichever region — column, sub-row, or Card — is the pop machine's
// current `contextKey` (wiki §1.1) gets this ring, so the locked layer is
// legible without reading the dev panel. Shared with KanbanCard.tsx, which
// applies it directly to a Card's own element rather than an overlay div.
export const ACTIVE_CONTEXT_OUTLINE = 'ring-2 ring-(--active-context-outline)';

const DIVIDER = 'pointer-events-none absolute right-2 left-2 border-t border-dashed border-zinc-400/35';
const ZONE_LABEL =
  'pointer-events-none flex items-center justify-center text-[10px] font-medium tracking-wide text-zinc-500 uppercase';
const SINGLE_BAND_BORDER = 'rounded-lg border border-dashed border-zinc-600/50';

interface DragCarveFrameProps {
  regionKey: string;
  /** The region's own current card count — its rendered `items.length`, ghost included once one's previewing there. */
  cardCount: number;
  isTerminal: boolean;
  /** The name a single collapsed band names itself after — "Move to {targetLabel}". */
  targetLabel: string;
  children: ReactNode;
}

// Wraps a region's own card-list content (dead-zones-and-all at Board
// layer) — the one place §5's band geometry becomes pixels, and the one
// place `[DRAG_REGION_ATTR]` is applied: this component's own root is
// always "the region" `measureDragRegions` finds, in every branch below,
// so a carve-out div is always a descendant of it rather than a sibling a
// region-scoped lookup can't reach. `cardCount` must be the region's *own*
// rendered count (ghost-inclusive), matching what dragRegions.ts::bandFor
// resolves against once this region becomes the live hover target — see
// PopHover.cardCount's own comment for why that freezes rather than
// tracking the ghost's own insertion live.
export function DragCarveFrame({ regionKey, cardCount, isTerminal, targetLabel, children }: DragCarveFrameProps) {
  const session = useDragSession();
  const tuning = useDragTuning();
  const pop = session?.pop;

  const regionAttrs = { [DRAG_REGION_ATTR]: regionKey, [DRAG_CARD_COUNT_ATTR]: cardCount };
  const wrap = (content: ReactNode, extraClassName = '') => (
    <div {...regionAttrs} className={`relative ${extraClassName}`}>
      {content}
    </div>
  );

  if (!pop) return wrap(children);

  const isActiveContext = pop.contextKey === regionKey;
  if (pop.contextKey !== null) {
    // Locked into this region or a different one: no carve-out cues
    // anywhere (rule: nothing but the current 3 actions gets a cue). The
    // active-context outline is a separate, unrelated concern that still
    // draws on whichever one is locked.
    if (!isActiveContext) return wrap(children);
    return wrap(
      <>
        {children}
        <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-xl ${ACTIVE_CONTEXT_OUTLINE}`} />
      </>,
    );
  }

  // Board layer. `hoveredHere` uses the frozen, pre-ghost card count for
  // exactly the reason PopHover.cardCount is frozen at all: this region's
  // own live count already includes the ghost hovering it just inserted.
  const hoveredHere = pop.hover?.regionKey === regionKey;
  const effectiveCardCount = hoveredHere ? (pop.hover?.cardCount ?? cardCount) : cardCount;

  if (isTerminal || effectiveCardCount === 0) {
    if (effectiveCardCount === 0) {
      // Genuinely empty, not (yet) the live hover target: nothing in
      // `children` to show at all, so the label is the only cue there is.
      // Once hovered, a real ghost (itemListOps' ordinal placement) is
      // already the live content — rendering *that* instead, same as the
      // terminal-with-cards branch below, rather than a label with nothing
      // under it.
      if (!hoveredHere) {
        return wrap(
          <div
            aria-hidden="true"
            data-carve-zone="single"
            className={`${ZONE_LABEL} ${SINGLE_BAND_BORDER}`}
            style={{ height: tuning.ghostCardHeightPx }}
          >
            Move to {targetLabel}
          </div>,
        );
      }
      return wrap(children);
    }
    return wrap(
      <>
        {children}
        {!hoveredHere && (
          <div
            aria-hidden="true"
            data-carve-zone="single"
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/70 text-[11px] font-medium tracking-wide text-zinc-400 uppercase"
          >
            Move to {targetLabel}
          </div>
        )}
      </>,
    );
  }

  const edge = effectiveCardCount === 1 ? tuning.ghostCardHeightPx / 2 : tuning.ghostCardHeightPx;
  const halfHeight = tuning.ghostCardHeightPx / 2;
  return wrap(
    <>
      {!hoveredHere && (
        <div aria-hidden="true" data-carve-zone="top" className={ZONE_LABEL} style={{ height: halfHeight }}>
          Move Top
        </div>
      )}
      {children}
      {!hoveredHere && (
        <div aria-hidden="true" data-carve-zone="bottom" className={ZONE_LABEL} style={{ height: halfHeight }}>
          Move Bottom
        </div>
      )}
      <div aria-hidden data-carve-divider="top" className={DIVIDER} style={{ top: edge }} />
      <div aria-hidden data-carve-divider="bottom" className={DIVIDER} style={{ bottom: edge }} />
    </>,
  );
}

// The drop bands made visible while a Card is carried: dashed boundary lines per
// region + the hovered band tinted. (Epic 3.5)

import type { ReactNode } from 'react';
import { useDragSession } from './workflow/DragSessionContext';
import { DRAG_CARD_COUNT_ATTR, DRAG_REGION_ATTR } from './workflow/dragRegions';
import { CARD_LIST_GAP_PX, SHORT_CARD_HEIGHT_PX } from './KanbanCard';

// Epic 3.5 Story 8 re-plan (2026-09-16) — the column drop bands, made
// visible (docs/wiki/board-drag-interaction §5), reworked from Story 3's
// percentage-of-height overlay to a content-anchored, space-reserving one.
// These are Board layer's own cues, and only Board layer's: while a Card is
// genuinely locked into anything — a column/sub-row, or a Card — every
// carve-out disappears, since nothing about a bare hover elsewhere changes
// what a release commits.
//
// Story 4.1 Phase 1: the reservation is exact now, not approximate — a
// region's total rendered height never changes whether or not it's the
// live hover target, because the ghost row (KanbanCard.tsx's shortCard) is
// pinned to exactly `SHORT_CARD_HEIGHT_PX`, and every zone below is sized
// from that same constant plus the card lists' own shared gap
// (`CARD_LIST_GAP_PX`) rather than the height alone. Both are fixed facts
// about the card, owned by KanbanCard.tsx — nothing here tunes them.
//   - not the live hover target: dead zones carved out of the region's own
//     real content (its cards shift down to make room) — never the
//     visible-scrolled slice, so a boundary scrolled out of view is
//     neither drawn nor reachable until it's scrolled to.
//   - the live hover target (about to be committed on release, though not
//     yet locked in): the dead zones collapse and a real ghost (itemListOps'
//     ordinal placement) fills the reservation instead — same net height.
//     The divider lines stay, at the same fixed offsets, since the ghost's
//     own insertion is exactly what they have to stay stable against.
// Terminal and truly-empty regions collapse to one single band spanning
// their own height (no top/bottom to speak of — dragRegions.ts::bandFor).
//
// The reservation math, so the height is identical hovered or not (a
// non-hovered list has one fewer gap than the hovered one, since the ghost
// row brings both its own height *and* one more gap when it joins):
//   - 1+ cards, non-terminal: two zones of `(h + gap) / 2` each.
//   - genuinely empty: one zone of `h` alone — the hovered list holds the
//     ghost with no sibling to gap against.
//   - terminal with cards: one *bottom-only* zone of `h + gap` — a done
//     region's ghost always previews last (§10's newest-completion rule),
//     exactly where this zone is. Reserving nothing here (as built before
//     this phase, an absolute overlay instead) let the ghost's entry grow
//     the region; the frozen-rect family silently covered for it.
//
// Two special cases the Product Owner settled 2026-09-16: an empty region
// carves the *full* card height, not two halves (nothing to shift out of
// the way); a region with exactly one card halves both edges instead of
// the normal full height, so the card stays a real, unlabeled middle band
// rather than being bisected into top/bottom with nothing left between —
// matching `dragRegions.ts::bandBoundaries`'s own edge formula exactly, so
// the divider drawn here is the boundary a release actually resolves
// against.
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
  /** The region's own current *raw* card count — its rendered `items.length`, the active drag's own row included if it's currently one of them. */
  cardCount: number;
  /**
   * Whether the active drag's own item is currently one of this region's
   * rendered rows — either because a ghost genuinely just joined (this
   * region is the live Board-layer hover target), or because it's resting
   * unclaimed in its own, otherwise-empty origin region while the cursor
   * is elsewhere entirely (wiki §5: with nowhere hovered, an item "is drawn
   * where it already is"). Either way `children` already reserves exactly
   * the space that row needs, since it's rendered at the same fixed
   * shortCard height regardless of which of the two reasons applies — so
   * this, not whether the region happens to be hovered right now, is what
   * decides whether the dead-zone/label chrome collapses (Story 4.1 Phase
   * 1): showing both at once would double the reservation.
   */
  hasActiveItemRow: boolean;
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
// region-scoped lookup can't reach.
export function DragCarveFrame({
  regionKey,
  cardCount,
  hasActiveItemRow,
  isTerminal,
  targetLabel,
  children,
}: DragCarveFrameProps) {
  const session = useDragSession();
  const pop = session?.pop;

  // Ghost-exclusive: the count of *other* cards, excluding the active
  // item's own row whenever it's currently here — never based on whether
  // this region happens to be the live hover target right now, which is
  // a different question `hasActiveItemRow` can disagree with (Story 4.1
  // Phase 1 — see that prop's own comment for the case that caught this).
  const otherCardCount = hasActiveItemRow ? cardCount - 1 : cardCount;

  const regionAttrs = { [DRAG_REGION_ATTR]: regionKey, [DRAG_CARD_COUNT_ATTR]: otherCardCount };
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

  // Board layer.
  if (isTerminal || otherCardCount === 0) {
    if (otherCardCount === 0) {
      // Genuinely nothing *else* here. If the active item's own row isn't
      // here either, there's truly nothing in `children` to show, so the
      // label is the only cue there is. If it is, that row already reserves
      // exactly the space the label would have — rendering it instead, same
      // as the terminal-with-cards branch below, rather than doubling up.
      if (!hasActiveItemRow) {
        return wrap(
          <div
            aria-hidden="true"
            data-carve-zone="single"
            className={`${ZONE_LABEL} ${SINGLE_BAND_BORDER}`}
            style={{ height: SHORT_CARD_HEIGHT_PX }}
          >
            Move to {targetLabel}
          </div>,
        );
      }
      return wrap(children);
    }
    // Terminal, with cards: a real bottom-only reservation now (Phase 1),
    // sized for the ghost that always previews last there — not an
    // absolute overlay that let the ghost's entry grow the region.
    return wrap(
      <>
        {children}
        {!hasActiveItemRow && (
          <div
            aria-hidden="true"
            data-carve-zone="single"
            className={ZONE_LABEL}
            style={{ height: SHORT_CARD_HEIGHT_PX + CARD_LIST_GAP_PX }}
          >
            Move to {targetLabel}
          </div>
        )}
      </>,
    );
  }

  const zoneHeight = (SHORT_CARD_HEIGHT_PX + CARD_LIST_GAP_PX) / 2;
  const edge = otherCardCount === 1 ? zoneHeight : SHORT_CARD_HEIGHT_PX;
  return wrap(
    <>
      {!hasActiveItemRow && (
        <div aria-hidden="true" data-carve-zone="top" className={ZONE_LABEL} style={{ height: zoneHeight }}>
          Move Top
        </div>
      )}
      {children}
      {!hasActiveItemRow && (
        <div aria-hidden="true" data-carve-zone="bottom" className={ZONE_LABEL} style={{ height: zoneHeight }}>
          Move Bottom
        </div>
      )}
      <div aria-hidden data-carve-divider="top" className={DIVIDER} style={{ top: edge }} />
      <div aria-hidden data-carve-divider="bottom" className={DIVIDER} style={{ bottom: edge }} />
    </>,
  );
}

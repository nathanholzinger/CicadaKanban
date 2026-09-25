// The drop bands made visible while a Card is carried: dashed boundary lines per
// region + the hovered band tinted. (Epic 3.5)

import { Fragment, type ReactNode } from 'react';
import { useDragSession } from './workflow/DragSessionContext';
import { DRAG_CARD_COUNT_ATTR, dragRegionProps } from './workflow/dragRegions';
import { reservationFor, type Reservation } from './workflow/dragBands';
import { SHORT_CARD_METRICS } from './cardMetrics';

// Epic 3.5 Story 3's carve-out addendum (2026-09-16) — the column drop bands, made
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
// rather than being bisected into top/bottom with nothing left between.
// The shape/height/edge math itself lives in `dragRegions.ts::reservationFor`
// now (audit epic-3-5-story-4 #9) — this file only turns its answer into
// markup, so the divider drawn here is the boundary a release actually
// resolves against (`dragRegions.ts::bandBoundaries`) by construction,
// never by two independently-typed formulas agreeing by comment.
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
  /** The rows `children` actually renders — the same array, so the counts below can't drift from the list (audit epic-3-5-story-4 #7: derived here once, not by each caller). */
  items: readonly { id: string }[];
  isTerminal: boolean;
  /** The name a single collapsed band names itself after — "Move to {targetLabel}". */
  targetLabel: string;
  children: ReactNode;
  /**
   * Set when this region's own list is also the dnd-kit droppable (an
   * expanded column's sub-row) — its padded/rounded surface chrome, and the
   * droppable node ref itself, live on this frame's own wrap instead of on
   * `children`'s own div, applied uniformly whether this renders the
   * empty-zone label or `children` (audit epic-3-5-story-4 #2: the two used
   * to differ by the padding alone, a 12px jump on an otherwise-height-
   * stable empty sub-row). Omit for a region whose droppable, if any, is an
   * ancestor (a merged column) or that isn't droppable at all.
   */
  droppable?: {
    containerRef: (element: HTMLElement | null) => void;
    className: string;
  };
}

// Wraps a region's own card-list content (dead-zones-and-all at Board
// layer) — the one place §5's band geometry becomes pixels, and the
// column/sub-row site of `dragRegionProps` (`dragRegions.ts`): this
// component's own root is always "the region" `measureDragRegions` finds,
// in every branch below, so a carve-out div is always a descendant of it
// rather than a sibling a region-scoped lookup can't reach.
export function DragCarveFrame({
  regionKey,
  items,
  isTerminal,
  targetLabel,
  children,
  droppable,
}: DragCarveFrameProps) {
  const session = useDragSession();

  // Whether the active drag's own item is currently one of this region's
  // rendered rows — by list membership, never by whether this region is
  // the live hover target right now. Either because a ghost genuinely just
  // joined (this region is the live Board-layer hover target), or because
  // it's resting unclaimed in its own, otherwise-empty origin region while
  // the cursor is elsewhere entirely (wiki §5: with nowhere hovered, an
  // item "is drawn where it already is"). Either way `children` already
  // reserves exactly the space that row needs, since it's rendered at the
  // same fixed shortCard height regardless of which of the two reasons
  // applies — so this is what decides whether the dead-zone/label chrome
  // collapses (Story 4.1 Phase 1): showing both at once would double the
  // reservation.
  const hasActiveItemRow = items.some(i => i.id === session?.activeItem.id);
  // Ghost-exclusive: the count of *other* cards, excluding the active
  // item's own row whenever it's currently here.
  const otherCardCount = hasActiveItemRow ? items.length - 1 : items.length;

  // The droppable node ref and its padded surface chrome sit on this same
  // wrap div, applied uniformly across every branch below — including the
  // empty-zone label, which otherwise renders with none of it (#2).
  const regionAttrs = { ...dragRegionProps(regionKey), [DRAG_CARD_COUNT_ATTR]: otherCardCount };
  const wrap = (content: ReactNode, extraClassName = '') => (
    <div
      {...regionAttrs}
      ref={droppable?.containerRef}
      className={`relative ${droppable?.className ?? ''} ${extraClassName}`}
    >
      {content}
    </div>
  );
  // The region's own cards, in one keyed slot that every branch below
  // renders them through. Board layer puts a carve-out zone *before* them,
  // and React matches unkeyed children by index. Without the key every
  // Card in the region would remount on the way into and out of Board layer —
  // reseting each one's hand-set expand/collapse to the board's default
  const cards = <Fragment key="cards">{children}</Fragment>;

  if (!session) return wrap(cards);
  const pop = session.pop;

  const isActiveContext = pop.contextKey === regionKey;
  if (pop.contextKey !== null) {
    // Locked into this region or a different one: no carve-out cues
    // anywhere (rule: nothing but the current 3 actions gets a cue). The
    // active-context outline is a separate, unrelated concern that still
    // draws on whichever one is locked.
    if (!isActiveContext) return wrap(cards);
    return wrap(
      <>
        {cards}
        <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-xl ${ACTIVE_CONTEXT_OUTLINE}`} />
      </>,
    );
  }

  // Board layer — dragRegions.ts::reservationFor is the one place §5's
  // shape/height/edge math lives (audit epic-3-5-story-4 #9); this only
  // turns its answer into markup.
  const reservation = reservationFor({ isTerminal, cardCount: otherCardCount }, SHORT_CARD_METRICS);

  if (reservation.shape !== 'positional') {
    // 'empty' / 'none': genuinely nothing *else* here. If the active item's
    // own row isn't here either, there's truly nothing in `children` to
    // show, so the label is the only cue there is. If it is, that row
    // already reserves exactly the space the label would have — rendering
    // it instead, same as 'terminal' below, rather than doubling up.
    if (reservation.shape !== 'terminal')
      return hasActiveItemRow ? wrap(cards) : wrap(<SingleZone reservation={reservation} targetLabel={targetLabel} />);
    // 'terminal', with cards: a real bottom-only reservation (Phase 1),
    // sized for the ghost that always previews last there — not an
    // absolute overlay that let the ghost's entry grow the region.
    return wrap(
      <>
        {cards}
        {!hasActiveItemRow && <SingleZone reservation={reservation} targetLabel={targetLabel} />}
      </>,
    );
  }

  return wrap(
    <>
      {!hasActiveItemRow && (
        <div aria-hidden="true" data-carve-zone="top" className={ZONE_LABEL} style={{ height: reservation.zoneHeight }}>
          Move Top
        </div>
      )}
      {cards}
      {!hasActiveItemRow && (
        <div
          aria-hidden="true"
          data-carve-zone="bottom"
          className={ZONE_LABEL}
          style={{ height: reservation.zoneHeight }}
        >
          Move Bottom
        </div>
      )}
      <div aria-hidden data-carve-divider="top" className={DIVIDER} style={{ top: reservation.edge }} />
      <div aria-hidden data-carve-divider="bottom" className={DIVIDER} style={{ bottom: reservation.edge }} />
    </>,
  );
}

// The one collapsed-band label — 'empty'/'none' get the standalone bordered
// box (nothing else to show), 'terminal' sits unbordered right after real
// cards (audit epic-3-5-story-4 #9: these were two near-identical divs).
function SingleZone({ reservation, targetLabel }: { reservation: Reservation; targetLabel: string }) {
  const bordered = reservation.shape !== 'terminal';
  return (
    <div
      aria-hidden="true"
      data-carve-zone="single"
      className={bordered ? `${ZONE_LABEL} ${SINGLE_BAND_BORDER}` : ZONE_LABEL}
      style={{ height: reservation.zoneHeight }}
    >
      Move to {targetLabel}
    </div>
  );
}

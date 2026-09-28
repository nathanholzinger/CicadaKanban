// The Descendants layer's live projection (docs/wiki/board-drag-interaction
// §7.1): the gap the ghost sits in and the depth the pointer has chosen,
// seeded on each entry into a section and advanced every sample. Pure — the
// hook (`useBoardDnd.ts`) keeps the state between samples and hands in the
// pointer, the named anchor and the board's children accessor.

import type { Item } from '../../types';
import {
  computeProjection,
  gapIndexFor,
  ownSlotOf,
  toRows,
  type AnchorRelation,
  type Row,
} from '../../lib/hierarchyPlacement';
import { DESCENDANTS_INDENT_PX } from '../cardMetrics';
import { isValidParent, type DragClassification } from './dragClassification';
import { descendantsCardIdOf } from './dragRegions';
import { descendantsChildrenOf, hierarchyRows, type PlacementSlot } from './itemListOps';
import type { DescendantsProjection } from './DragSessionContext';

// What the depth is measured from: the gap and depth the section was
// entered at, and where the pointer was then.
interface ProjectionSeed {
  gap: number;
  depth: number;
  pointerX: number;
}

export interface ProjectionState {
  seed: ProjectionSeed | null;
  projection: DescendantsProjection | null;
}

export const NO_PROJECTION: ProjectionState = { seed: null, projection: null };

export interface ProjectionSample {
  /** The context the sample started in (null at pickup). A different one than `contextKey` means the section was just entered. */
  previousContextKey: string | null;
  contextKey: string | null;
  classification: DragClassification;
  /** The Card whose section a Stub's drag started in; null for a Free Card's drag. */
  originCardId: string | null;
  /** The row `dropAnchorFor` names this sample, if any. */
  namedAnchor: AnchorRelation | null;
  pointerX: number | null;
  getAttachedChildren: (parentId: string) => readonly Item[];
}

// One sample. Outside a section there's no projection. On entry the seed is
// set where the ghost already is, so zooming in never moves it (wiki
// board-drag-interaction §7): the drag's own section seeds at the dragged
// row's own slot and depth, so resting still resolves to where it came from;
// any other section seeds at its last gap at depth 0, the Card's last child,
// where the Card layer's auto-drop showed it. Never at the last row's depth:
// when that row is nested, the ghost would become its sibling. Then the gap
// follows the named row — the same "the gap is the ghost's slot" rule Column
// layer uses — or, with no row named (a hover over the section between rows,
// or before dnd-kit's first move event), stays where it was. The depth is the
// seed's plus the pointer's travel since, in indents, clamped to the gap's
// range.
export function advanceProjection(state: ProjectionState, sample: ProjectionSample): ProjectionState {
  const cardId = descendantsCardIdOf(sample.contextKey);
  if (!cardId) return NO_PROJECTION;
  const { classification, getAttachedChildren } = sample;
  // §7.2: the dragged item and its whole subtree are never a Top or Bottom.
  const exclude = classification.subtreeIds;
  const allRows = toRows(hierarchyRows(cardId, getAttachedChildren));
  const rows = toRows(allRows, exclude);

  const own = cardId === sample.originCardId ? ownSlotOf(allRows, classification.activeId) : null;
  const seed =
    !state.seed || sample.contextKey !== sample.previousContextKey
      ? seedFor(own, rows, sample.pointerX ?? 0)
      : state.seed;
  const previousGap = seed === state.seed ? (state.projection?.gap ?? null) : null;

  const anchor = sample.namedAnchor;
  const gap = anchor ? gapIndexFor(rows, anchor.anchorId, anchor.side) : (previousGap ?? seed.gap);
  const pointerX = sample.pointerX ?? seed.pointerX;
  const { depth, placement } = computeProjection(
    rows,
    gap,
    seed.depth,
    pointerX - seed.pointerX,
    DESCENDANTS_INDENT_PX,
    cardId,
    descendantsChildrenOf(getAttachedChildren),
    exclude,
  );
  // §7.2: the depth cap against the resolved parent — the same answer, off
  // the same drag-start snapshot, as the gate that decides whether this
  // section was a region at all.
  const valid = isValidParent(classification, placement.parentId ?? cardId);
  const atOwnSlot = own !== null && gap === own.gap && depth === own.depth;
  return { seed, projection: { gap, depth, valid, resolved: placement, atOwnSlot } };
}

function seedFor(own: { gap: number; depth: number } | null, rows: readonly Row[], pointerX: number): ProjectionSeed {
  if (own) return { gap: own.gap, depth: own.depth, pointerX };
  return { gap: rows.length, depth: 0, pointerX };
}

// Whether two projections draw the same thing: `resolved` follows from the
// other three.
export function sameProjection(a: DescendantsProjection | null, b: DescendantsProjection | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.gap === b.gap && a.depth === b.depth && a.valid === b.valid;
}

// What a release at the section writes: the last sample's resolved parent
// and anchor, or nothing (null) with no projection or over the cap — §7.2's
// one exception to §3.2, a state that's reachable but commits nothing. Also
// nothing at the dragged Stub's own gap and depth: with the whole hierarchy
// shown, no unseen item can sit between its neighbors, so it's already there
// (wiki board-drag-interaction §7.1). The resolved parent is never null for
// a board section, whose root is always a real Card; `cardId` only stands in
// to keep the type honest.
export function descendantsReleasePlacement(
  projection: DescendantsProjection | null,
  cardId: string,
): { parentId: string; slot: PlacementSlot } | null {
  if (!projection?.valid || projection.atOwnSlot) return null;
  const { parentId, anchor } = projection.resolved;
  return { parentId: parentId ?? cardId, slot: anchor ?? 'first' };
}

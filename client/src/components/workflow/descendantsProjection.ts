// The Descendants layer's live projection
// (wiki board-drag-interaction §7.1): the gap the ghost sits in and the
// depth the pointer has chosen, seeded on each entry into a section and
// advanced every sample. Pure — the hook (`useBoardDnd.ts`) keeps the state
// between samples and hands in the pointer, the named anchor and the
// board's children accessor. It places against the whole section, whatever
// levels the section draws: an overflow row is only ever a neighbor to name,
// and turns into the gap among all the rows before anything is resolved. It also names the
// overflow row the ghost sits directly beside, at its level, which the hold that opens the
// hierarchy modal keys on (`overflowBeside`, `modalHoldTarget`), and takes a reading from the
// cursor when the modal has just opened under it (`reseedProjection`), and keeps that reading
// until the pointer moves (`holdsReading`).

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
import { descendantsChildrenOf, hierarchyRows, overflowOwnerOf, shownLevels, type PlacementSlot } from './itemListOps';
import type { DescendantsProjection } from './DragSessionContext';
import type { ModalHoldTarget } from './popSession';

// What the depth is measured from: the gap and depth the section was
// entered at, and where the pointer was then. `slotHidden`: the dragged Stub's
// own slot is one the section doesn't draw, so it entered as an item from outside.
interface ProjectionSeed {
  gap: number;
  depth: number;
  pointerX: number;
  slotHidden: boolean;
}

interface Pointer {
  x: number;
  y: number;
}

export interface ProjectionState {
  seed: ProjectionSeed | null;
  projection: DescendantsProjection | null;
  /** Where the pointer was when the modal's reading was taken, while that reading is held (`holdsReading`). */
  held: Pointer | null;
}

export const NO_PROJECTION: ProjectionState = { seed: null, projection: null, held: null };

export interface ProjectionSample {
  /** The context the sample started in (null at pickup). A different one than `contextKey` means the section was just entered. */
  previousContextKey: string | null;
  contextKey: string | null;
  classification: DragClassification;
  /** The Card whose section a Stub's drag started in; null for a Free Card's drag. */
  originCardId: string | null;
  /** The row `dropAnchorFor` names this sample, if any: an item's row, or an overflow row. */
  namedAnchor: AnchorRelation | null;
  pointerX: number | null;
  pointerY: number | null;
  getAttachedChildren: (parentId: string) => readonly Item[];
  /** How many levels the section draws (`itemListOps.ts::shownLevels`): the tuning value, or `EVERY_LEVEL` in the hierarchy modal. */
  sectionLevels: number;
}

// One sample. Outside a section there's no projection. On entry the seed is
// set where the ghost already is, so zooming in never moves it
// (wiki board-drag-interaction §7): the drag's own section seeds at the
// dragged row's own slot and depth, so resting still resolves to where it
// came from; any other section seeds at its last gap at depth 0, the Card's
// last child, where the Card layer's auto-drop showed it. So does the drag's
// own section when its slot is at a level the section doesn't draw: that
// slot has no row to hold a ghost. Never at the last
// row's depth: when that row is nested, the ghost would become its sibling.
// Then the gap follows the named row — the same "the gap is the ghost's
// slot" rule Column layer uses — or, with no row named (a hover over the
// section between rows, or before dnd-kit's first move event), stays where
// it was. The depth is the seed's plus the pointer's travel since, in
// indents, clamped to the gap's range and to one past the last shown level:
// an overflow row stands for the children one level deeper than the section
// draws, and nothing is offered right of it. A reading the modal took stands, and no neighbor
// named meanwhile moves it, while the pointer is where it was taken (`holdsReading`).
export function advanceProjection(state: ProjectionState, sample: ProjectionSample): ProjectionState {
  const cardId = descendantsCardIdOf(sample.contextKey);
  if (!cardId) return NO_PROJECTION;
  const { classification, getAttachedChildren } = sample;
  // The dragged item and its whole subtree are never a Top or Bottom.
  const exclude = classification.subtreeIds;
  const allRows = toRows(hierarchyRows(cardId, getAttachedChildren));
  const rows = toRows(allRows, exclude);

  const ownRow = cardId === sample.originCardId ? ownSlotOf(allRows, classification.activeId) : null;
  const own = ownRow && ownRow.depth < shownLevels(sample.sectionLevels) ? ownRow : null;
  const seed =
    !state.seed || sample.contextKey !== sample.previousContextKey
      ? seedFor(own, ownRow !== null && own === null, rows, sample.pointerX ?? 0)
      : state.seed;
  const previousGap = seed === state.seed ? (state.projection?.gap ?? null) : null;

  const pointer =
    sample.pointerX === null || sample.pointerY === null ? null : { x: sample.pointerX, y: sample.pointerY };
  const held = seed === state.seed && holdsReading(state, pointer) ? state.held : null;
  const anchor = held ? null : sample.namedAnchor;
  const gap = anchor ? gapForAnchor(rows, anchor) : (previousGap ?? seed.gap);
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
    shownLevels(sample.sectionLevels),
  );
  // The depth cap, per state, against the resolved parent
  // (wiki board-drag-interaction §7.2) — the same answer, off the same
  // drag-start snapshot, as the gate that decides whether this section was
  // a region at all.
  const valid = isValidParent(classification, placement.parentId ?? cardId);
  const atOwnSlot = !seed.slotHidden && own !== null && gap === own.gap && depth === own.depth;
  const overflowBeside = overflowBesideGhost(rows, gap, depth, shownLevels(sample.sectionLevels));
  return {
    seed,
    projection: { gap, depth, valid, resolved: placement, atOwnSlot, slotHidden: seed.slotHidden, overflowBeside },
    held,
  };
}

// The overflow row the ghost sits directly above or below, at the row's level: the one place the
// hold that opens the hierarchy modal runs (wiki board-drag-interaction §7.3). The overflow row
// of a last-level row `R` stands for its attached children outside the dragged subtree, so `R`
// has one exactly when `rows` holds a child of it:
//   - directly above: the gap just under `R`, with its first hidden child below it;
//   - directly below: the gap at the end of `R`'s subtree, past at least one hidden row.
// Both at `levels`, `R`'s children's level: any shallower state at the second gap is a sibling
// of `R` or higher, and a ghost there is beside the overflow row without being on it. With every
// level drawn (the modal, `levels` infinite) there is no overflow row and nothing to find.
function overflowBesideGhost(
  rows: readonly Row[],
  gap: number,
  depth: number,
  levels: number,
): DescendantsProjection['overflowBeside'] {
  if (depth !== levels) return null;
  const top = rows[gap - 1];
  const bottom = rows[gap];
  if (!top) return null;
  if (top.depth === levels - 1) return bottom && bottom.depth > top.depth ? { ownerId: top.id, side: 'before' } : null;
  if (top.depth < levels || (bottom && bottom.depth >= levels)) return null;
  // `top` is a hidden row, and the gap ends its owner's subtree: the owner is the nearest row
  // above at the last shown level.
  for (let i = gap - 2; i >= 0; i--) {
    if (rows[i].depth < levels) return { ownerId: rows[i].id, side: 'after' };
  }
  return null;
}

// What the hold that opens the modal keys on, off the projection: nothing in an over-cap state,
// as a Card's zoom-in never starts on an invalid target (wiki board-drag-interaction §6.1).
export function modalHoldTarget(projection: DescendantsProjection | null): ModalHoldTarget | null {
  if (!projection?.valid || !projection.overflowBeside) return null;
  const { ownerId, side } = projection.overflowBeside;
  return { ownerId, side, gap: projection.gap, depth: projection.depth };
}

// The projection read afresh from where the cursor is over a layer that has just changed shape
// under it (the modal opening): the next sample resolves from this gap and depth, and the pointer
// it measures its travel from is at `pointerX`. The hold's own reading is dropped, and nothing else:
// `slotHidden` stays, because the rows `own` is read from still place the Stub as the Card's last
// child, where a real move would be taken for its own slot and dropped. The reading is held where
// the pointer is (`holdsReading`).
export function reseedProjection(
  state: ProjectionState,
  read: { gap: number; depth: number; pointerX: number; pointerY: number },
): ProjectionState {
  const { gap, depth, pointerX, pointerY } = read;
  if (!state.seed) return state;
  return { seed: { ...state.seed, gap, depth, pointerX }, projection: null, held: { x: pointerX, y: pointerY } };
}

// Whether the reading the modal took still stands: the pointer is where it was taken. Opening the
// modal re-clamps the carried copy with the pointer still, and the move event that follows names a
// neighbor against rows that are still sliding into place, a gap or more from the one the modal
// drew under the cursor (wiki board-drag-interaction §7.3). A neighbor named with the pointer
// still is that event's, not the user's, so the reading is kept until the pointer moves, along
// either axis. Once it has moved, the reading is no longer held, and a return to the same point
// doesn't hold it again.
export function holdsReading(state: ProjectionState, pointer: Pointer | null): boolean {
  return state.held !== null && pointer !== null && state.held.x === pointer.x && state.held.y === pointer.y;
}

// The gap a named neighbor puts the ghost in, among all the section's rows. An item's row
// is the gap beside it. An overflow row stands for the hidden children of its owner, so just
// above it is the gap under the owner, before its first child, and just below it the gap after
// the owner's whole subtree, hidden levels included. An owner that isn't a row reads as no
// row named, as `gapIndexFor` does: below everything.
function gapForAnchor(rows: readonly Row[], anchor: AnchorRelation): number {
  const ownerId = overflowOwnerOf(anchor.anchorId);
  if (ownerId === null) return gapIndexFor(rows, anchor.anchorId, anchor.side);
  const at = rows.findIndex(r => r.id === ownerId);
  if (at === -1) return rows.length;
  if (anchor.side === 'before') return at + 1;
  let end = at + 1;
  while (end < rows.length && rows[end].depth > rows[at].depth) end++;
  return end;
}

// Deliberately separate from the sidebar's seed (its drag's own depth at
// pickup, in `useProjectDragReorder.ts::handleDragMove`): a sidebar drag
// always starts at its own row, but a board drag can also enter a section
// from the Card layer, and that entry seeds where the Card layer showed the
// ghost. The depth step itself is shared
// (`hierarchyPlacement.ts::computeProjection`).
function seedFor(
  own: { gap: number; depth: number } | null,
  slotHidden: boolean,
  rows: readonly Row[],
  pointerX: number,
): ProjectionSeed {
  if (own) return { gap: own.gap, depth: own.depth, pointerX, slotHidden };
  return { gap: rows.length, depth: 0, pointerX, slotHidden };
}

// Whether two projections draw the same thing: `resolved` follows from the
// other three.
export function sameProjection(a: DescendantsProjection | null, b: DescendantsProjection | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.gap === b.gap && a.depth === b.depth && a.valid === b.valid;
}

// What a release at the section writes: the last sample's resolved parent
// and anchor, or nothing (null) with no projection or over the cap — a
// state that's reachable but commits nothing
// (wiki board-drag-interaction §7.2). Also nothing at the dragged Stub's own
// gap and depth: the gap is counted among all the section's rows, drawn or
// not, so no hidden item can sit between its neighbors and it's already there
// (wiki board-drag-interaction §7.1). The resolved parent is never null for
// a board section, whose root is always a real Card; `cardId` only stands in
// to keep the type honest.
//
// The anchor stays an `{anchorId, side}` slot, since the item move carries
// exactly that. Deliberately separate from
// `projectTreeUtils.ts::siblingIdsFromAnchor`, which turns the same relation
// into the projects API's `prevId`/`nextId`: two APIs, two shapes.
export function descendantsReleasePlacement(
  projection: DescendantsProjection | null,
  cardId: string,
): { parentId: string; slot: PlacementSlot } | null {
  if (!projection?.valid || projection.atOwnSlot) return null;
  const { parentId, anchor } = projection.resolved;
  return { parentId: parentId ?? cardId, slot: anchor ?? 'first' };
}

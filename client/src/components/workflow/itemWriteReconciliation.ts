// Folding an item write's response into the board's item state
// (wiki positioning §8): apply the reindexed pairs, upsert the written row,
// clear its pending placement, and run the inversion tripwire
// (wiki board-drag-interaction §10). Every item-write path goes through
// `completeItemWrite`. The state it folds into, `ItemListState` (items,
// placements, inversions), is defined here too, with `EMPTY_ITEM_LIST_STATE`
// and `withPlacement`. Pure; reads `itemListOps.ts`'s placements and sort,
// never the other way round.

import type { Item } from '../../types';
import type { ItemWriteResponse } from '../../api/items';
import { applyWriteResponse } from '../../lib/positionedWrite';
import {
  NO_PLACEMENTS,
  applyPlacements,
  byPositionThenCreatedAt,
  renderedIsStub,
  type Placement,
  type Placements,
} from './itemListOps';

// Fold an item-write response into the list, pairs first, then the written row
// (`lib/positionedWrite.ts::applyWriteResponse`).
//
// Only the written row is upserted: the server's `workphaseId` cascade to
// attached descendants isn't mirrored here, so their stored copies stay
// stale until the next load. A drag never reads those copies — a Stub's
// drag takes its containing Card's `workphaseId` at drag start
// (`useBoardDnd.ts`).
export function applyItemWriteResponse(items: readonly Item[], response: ItemWriteResponse): Item[] {
  return applyWriteResponse(items, response);
}

// The board-wide rendered order of Free, positioned items — what the ordinal
// preview makes a claim about. Positions compare workflow-wide, so the
// claim "X sits right after A" holds across the whole loaded set, not just
// one column. Unpositioned items (done, or no workphase) make no ordering
// claim and are left out — and, once a Card previews attaching, so does
// it: its position is about to stop being comparable to anything, exactly
// like a done item's, and the tripwire (findInversion) must not judge it
// against a scale it's leaving.
export function freeItemOrder(items: readonly Item[], placements: Placements): string[] {
  const sorted = items.filter(i => !renderedIsStub(i, placements) && i.position !== null).sort(byPositionThenCreatedAt);
  return applyPlacements(sorted, placements).map(i => i.id);
}

export interface Inversion {
  itemId: string;
  expected: string[];
  actual: string[];
}

// The inversion tripwire: after a correctly reconciled response the position
// sort should reproduce exactly the order the preview drew. Compares the two
// sequences over the ids they share (an item that left the positioned set —
// moved to done — makes no claim either way).
export function findInversion(
  before: readonly string[],
  after: readonly string[],
): Pick<Inversion, 'expected' | 'actual'> | null {
  const common = new Set(before.filter(id => after.includes(id)));
  const expected = before.filter(id => common.has(id));
  const actual = after.filter(id => common.has(id));
  return expected.every((id, i) => id === actual[i]) ? null : { expected, actual };
}

export interface ItemListState {
  items: Item[];
  placements: Placements;
  /** Every inversion the tripwire has caught this session; surfaced by the dev/test panel. */
  inversions: readonly Inversion[];
}

export const EMPTY_ITEM_LIST_STATE: ItemListState = { items: [], placements: NO_PLACEMENTS, inversions: [] };

export function withPlacement(state: ItemListState, itemId: string, placement: Placement | null): ItemListState {
  const placements = new Map(state.placements);
  if (placement) placements.set(itemId, placement);
  else placements.delete(itemId);
  return { ...state, placements };
}

// A write's response, in reconciliation order: apply the reindex
// collection, assign the written item, clear its pending placement, then
// check for an inversion — the check runs on a list where the item is an
// ordinary positioned row. Re-sorting is implicit: render order is
// derived from `position` every render, so applying the rows *is* the
// re-sort (nothing is rebuilt when nothing changed). The tripwire
// only fires for a write the board previewed; a Sheet edit that reassigns a
// position made no ordinal claim.
//
// `recorded` is the exact placement object `writes.begin` stashed when this
// write started (undefined for a write that was never placement-tracked —
// a Sheet PUT, an inline create, a child create). Clearing the placement
// and running the tripwire only happens when the item's *current*
// placement is still that same object, by reference — not mere presence —
// so a placement written after this write began (a re-drag's live ghost, a
// different write's own marker) is left untouched: this write isn't the
// one that owns it. Without this, a response landing mid-re-drag would
// clear the live ghost and log a false inversion, and an unrelated write
// (a Sheet PUT) would clear a pending marker it never recorded.
export function completeItemWrite(
  state: ItemListState,
  response: ItemWriteResponse,
  recorded?: Placement | null,
): ItemListState {
  const items = applyItemWriteResponse(state.items, response);
  if (recorded === undefined || state.placements.get(response.id) !== recorded) return { ...state, items };

  const before = freeItemOrder(state.items, state.placements);
  const next = withPlacement({ ...state, items }, response.id, null);
  const inversion = findInversion(before, freeItemOrder(next.items, next.placements));
  if (!inversion) return next;
  return { ...next, inversions: [...state.inversions, { itemId: response.id, ...inversion }] };
}

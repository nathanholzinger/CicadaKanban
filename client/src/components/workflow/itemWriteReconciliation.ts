// Folding an item write's response into the board's item state
// (wiki positioning §8): apply the reindexed pairs, upsert the written row, carry its workphase
// to its attached descendants as the server does (unless a later-sent write has set that row's workphase),
// clear its pending placement, and run the inversion tripwire
// (wiki board-drag-interaction §10). Every item-write path goes through
// `completeItemWrite`. The state it folds into, `ItemListState` (items,
// placements, inversions), is defined here too, with `EMPTY_ITEM_LIST_STATE`
// and `withPlacement`. Pure; reads `itemListOps.ts`'s placements and attached children,
// `lib/hierarchy.ts::byPositionThenCreatedAt` and `lib/hierarchyPlacement.ts::flattenHierarchy`, and
// `itemListOps.ts` never reads it.

import type { Item } from '../../types';
import type { ItemWriteResponse } from '../../api/items';
import { byPositionThenCreatedAt } from '../../lib/hierarchy';
import { flattenHierarchy } from '../../lib/hierarchyPlacement';
import { applyWriteResponse, recordSet, setLater } from '../../lib/positionedWrite';
import {
  NO_PLACEMENTS,
  applyPlacements,
  getAttachedChildrenFrom,
  renderedIsStub,
  type Placement,
  type Placements,
} from './itemListOps';

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
  /**
   * Which write last set each row's workphase, by the number it was sent with: the written row's, and its
   * attached descendants' through the cascade (`withWorkphases`). It lives here, not in a ref beside the
   * position record, because the rows a cascade moves are known only over the loaded rows.
   */
  workphaseSetBy: ReadonlyMap<string, number>;
}

export const EMPTY_ITEM_LIST_STATE: ItemListState = {
  items: [],
  placements: NO_PLACEMENTS,
  inversions: [],
  workphaseSetBy: new Map(),
};

export function withPlacement(state: ItemListState, itemId: string, placement: Placement | null): ItemListState {
  const placements = new Map(state.placements);
  if (placement) placements.set(itemId, placement);
  else placements.delete(itemId);
  return { ...state, placements };
}

// A write that changes an item's workphase is answered with the written row alone, the server having moved
// the item's attached descendants to it (`attachedCascade.ts::cascadeWorkphaseToAttachedDescendants`). This
// is the same move over the loaded rows, so their copies agree with the server's: Unsorted's "needs
// attention" badge counts them (`itemListOps.ts::hasUnknownStatusItem`). It stops at a detached child, as
// the server's walk does. When the write left the workphase as it was, nothing moves, as on the server,
// so an Attached item holding a workphase of its own stays there for the badge to count.
//
// Workphase currency follows position currency (wiki positioning §8). `workphaseSetBy` says which write
// last set each row's workphase, and an answer for write `sent` that lands after a later-sent write set one
// of its rows' leaves that row's workphase as it is and cascades nothing from it. That is a written row an
// older answer carries a stale workphase for, and a row the cascade would otherwise move back. Only a write
// that changes a row's workphase sets it: the written row, when its answer's differs from the loaded one, and
// the attached descendants its cascade moves are recorded as `sent`'s. An answer that carries the workphase
// the row already holds sets nothing, so it claims no row, and an older write's cascade landing after it
// still reaches the row. An answer with no `sent` is the latest write there is, and records nothing.
function withWorkphases(
  state: ItemListState,
  after: Item[],
  id: string,
  sent: number | undefined,
): Pick<ItemListState, 'items' | 'workphaseSetBy'> {
  const unchanged = { items: after, workphaseSetBy: state.workphaseSetBy };
  const was = state.items.find(i => i.id === id);
  const written = after.find(i => i.id === id);
  if (!written) return unchanged;
  const later =
    sent === undefined ? new Set<string>() : setLater(state.workphaseSetBy, sent, state.workphaseSetBy.keys());
  if (later.has(id)) {
    const kept = was ? after.map(i => (i.id === id ? { ...i, workphaseId: was.workphaseId } : i)) : after;
    return { items: kept, workphaseSetBy: state.workphaseSetBy };
  }
  if (was && was.workphaseId === written.workphaseId) return unchanged;

  const moved = new Set<string>();
  if (was) {
    const attached = flattenHierarchy(id, parentId =>
      parentId === null
        ? []
        : getAttachedChildrenFrom(after, parentId)
            .map(child => child.id)
            .filter(childId => !later.has(childId)),
    );
    for (const row of attached) moved.add(row.id);
  }
  const items =
    moved.size > 0 ? after.map(i => (moved.has(i.id) ? { ...i, workphaseId: written.workphaseId } : i)) : after;
  if (sent === undefined) return { items, workphaseSetBy: state.workphaseSetBy };
  const workphaseSetBy = new Map(state.workphaseSetBy);
  recordSet(workphaseSetBy, sent, [id, ...moved]);
  return { items, workphaseSetBy };
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
// `newer` names the rows whose position a later-sent write has already set, which this response, an older
// one, must leave as they are (`lib/positionedWrite.ts::positionRecord`, which the caller asks). `sent` is
// the number the write was sent with, which a row's workphase is held to the same way
// (`withWorkphases`, over `state.workphaseSetBy`).
//
// Only the written row is upserted (`lib/positionedWrite.ts::applyWriteResponse`); the server's
// `workphaseId` cascade to its attached descendants is mirrored over it (`withWorkphases`).
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
  newer?: ReadonlySet<string>,
  sent?: number,
): ItemListState {
  const { items, workphaseSetBy } = withWorkphases(
    state,
    applyWriteResponse(state.items, response, newer),
    response.id,
    sent,
  );
  if (recorded === undefined || state.placements.get(response.id) !== recorded) {
    return { ...state, items, workphaseSetBy };
  }

  const before = freeItemOrder(state.items, state.placements);
  const next = withPlacement({ ...state, items, workphaseSetBy }, response.id, null);
  const inversion = findInversion(before, freeItemOrder(next.items, next.placements));
  if (!inversion) return next;
  return { ...next, inversions: [...state.inversions, { itemId: response.id, ...inversion }] };
}

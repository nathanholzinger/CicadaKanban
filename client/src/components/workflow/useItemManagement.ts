// Item state atom + per-item write tracker: the tracker sequences writes so a
// stale response can't clobber a newer one, and folds a current one in through
// `itemWriteReconciliation.ts::completeItemWrite`. Writes of different items aren't sequenced, so every write
// the board sends is also numbered across items (`lib/positionedWrite.ts::positionRecord`): an answer that
// lands after a later-sent write's leaves the positions that write set, whether a disclosed pair or its own
// row.

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Item } from '../../types';
import { createItem, type ItemWriteResponse } from '../../api/items';
import {
  computeChildCounts,
  getAttachedChildrenFrom,
  getMergedColumnItemsFrom,
  getUnknownStatusItemsFrom,
  getWorkphaseItemsFrom,
  removeItemAndDescendants,
  type Placement,
} from './itemListOps';
import { positionRecord } from '../../lib/positionedWrite';
import { EMPTY_ITEM_LIST_STATE, completeItemWrite, withPlacement } from './itemWriteReconciliation';

// A position write in flight, tracked per item so a stale response can never
// land last (wiki board-drag-interaction §10): `begin` records the
// pending placement and hands back a sequence number; `complete`/`fail` are
// no-ops for any sequence that isn't the item's latest.
export interface ItemWriteTracker {
  begin(itemId: string, pending: Placement | null): number;
  /**
   * Folds the response in (in reconciliation order) unless it's stale — a
   * stale response's own row is always discarded, since the newer write
   * supersedes it. But a reindex it disclosed renumbered *other* rows too,
   * and those are real, committed changes a discarded response must not
   * take with it — `needsResync` says so, for the caller to resync the
   * whole board from rather than silently lose them.
   */
  complete(itemId: string, seq: number, response: ItemWriteResponse): { applied: boolean; needsResync: boolean };
  /** Clears the pending placement so nothing from the guess survives; the caller resyncs. */
  fail(itemId: string, seq: number): void;
  /** Whether a write for this item is currently outstanding — for restoring its pending marker after a re-drag that ends up writing nothing. */
  isPending(itemId: string): boolean;
}

// The pure list operations live in itemListOps.ts; this hook only closes
// over state. State is one atom — items, ordinal placements, and the
// inversion log — so a write's reconciliation (pairs → row → clear the
// placement → tripwire) is a single pure reducer step rather than three
// setStates that could interleave with another response.
export function useItemManagement(projectId: string | undefined, filterProjectId: string | undefined) {
  const [list, setList] = useState(EMPTY_ITEM_LIST_STATE);
  const { items, placements, inversions } = list;
  // Each item's latest tracked write: its sequence among that item's writes, and the number it was sent with
  // among every write the board sends.
  const writeSeq = useRef(new Map<string, { seq: number; sent: number }>());
  // The writes sent, numbered, and which one last set each item's position.
  const positionWrites = useRef(positionRecord());
  // Item ids with a write currently outstanding — from `begin` until the
  // matching non-stale `complete`/`fail` — backing `isPending`.
  // `placements` alone can't answer this: a live drag's ghost occupies the
  // same slot and would read as "pending" too.
  const inFlight = useRef(new Set<string>());
  // The placement each outstanding write recorded via `begin` — so
  // `complete` can tell "this write's own marker is still there" from
  // "something else (a re-drag's ghost, a different write) now owns this
  // id's placement" and only clear/tripwire in the former case. Keyed the
  // same as `writeSeq`.
  const recordedPlacement = useRef(new Map<string, Placement | null>());

  // A board load replaces the list wholesale and drops every placement —
  // each belonged to the list it was made against. Every other change is a
  // reducer step below.
  const replaceItems = useCallback((next: Item[]) => {
    setList(s => ({ ...s, items: next, placements: new Map() }));
  }, []);

  // The live ghost during a drag: where the carried item is drawn,
  // with no position invented. Null clears it.
  const previewPlacement = useCallback((itemId: string, placement: Placement | null) => {
    setList(s => withPlacement(s, itemId, placement));
  }, []);

  const writes = useMemo<ItemWriteTracker>(
    () => ({
      begin(itemId, pending) {
        const seq = (writeSeq.current.get(itemId)?.seq ?? 0) + 1;
        writeSeq.current.set(itemId, { seq, sent: positionWrites.current.send() });
        inFlight.current.add(itemId);
        recordedPlacement.current.set(itemId, pending);
        setList(s => withPlacement(s, itemId, pending));
        return seq;
      },
      complete(itemId, seq, response) {
        const latest = writeSeq.current.get(itemId);
        if (latest?.seq !== seq) {
          // The row is discarded — a newer write supersedes it — but a
          // reindex it disclosed renumbered *other* rows too, and those
          // are real, committed changes this response is the only carrier
          // of; losing them along with the stale row would be silently
          // wrong, not merely stale. The caller resyncs instead.
          return { applied: false, needsResync: Boolean(response.reindexed?.length) };
        }
        inFlight.current.delete(itemId);
        const recorded = recordedPlacement.current.get(itemId) ?? null;
        recordedPlacement.current.delete(itemId);
        const newer = positionWrites.current.answer(latest.sent, response);
        setList(s => completeItemWrite(s, response, recorded, newer));
        return { applied: true, needsResync: false };
      },
      fail(itemId, seq) {
        if (writeSeq.current.get(itemId)?.seq !== seq) return;
        inFlight.current.delete(itemId);
        recordedPlacement.current.delete(itemId);
        setList(s => withPlacement(s, itemId, null));
      },
      isPending(itemId) {
        return inFlight.current.has(itemId);
      },
    }),
    [],
  );

  function getWorkphaseItems(workphaseId: string, isTerminal?: boolean): Item[] {
    return getWorkphaseItemsFrom(items, workphaseId, filterProjectId, isTerminal, placements);
  }

  function getMergedColumnItems(coveredWorkphaseIds: readonly string[], isTerminal?: boolean): Item[] {
    return getMergedColumnItemsFrom(items, coveredWorkphaseIds, filterProjectId, isTerminal, placements);
  }

  function getUnknownStatusItems(workflowWorkphaseIds: readonly string[]): Item[] {
    return getUnknownStatusItemsFrom(items, workflowWorkphaseIds, filterProjectId, placements);
  }

  function getAttachedChildren(parentId: string): Item[] {
    return getAttachedChildrenFrom(items, parentId, placements);
  }

  // Every write path lands through completeItemWrite so a reindex the server
  // disclosed is applied the same way whether the write came from the
  // board, the Sheet, or an inline create.
  async function handleCreateItem(workphaseId: string, title: string, type: string | null) {
    try {
      const sent = positionWrites.current.send();
      const newItem = await createItem({ type: type ?? undefined, title, projectId, workphaseId });
      const newer = positionWrites.current.answer(sent, newItem);
      setList(s => completeItemWrite(s, newItem, undefined, newer));
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  }

  // The Sheet sends its own writes and passes only the answer up, so its answers are numbered as they land:
  // each is the latest write there is, and an answer for a drag or an inline create that lands after it
  // leaves the positions it set. That holds while the board sends nothing between a Sheet write and its
  // answer, which the Sheet's covering the board makes so; a drag finished in the moment after the Sheet
  // closes could still be numbered after a write that went out before it.
  function foldSheetAnswer(response: ItemWriteResponse) {
    positionWrites.current.answer(positionWrites.current.send(), response);
    setList(s => completeItemWrite(s, response));
  }

  function handleItemUpdated(updated: ItemWriteResponse) {
    foldSheetAnswer(updated);
  }

  function handleItemDeleted(id: string) {
    setList(s => ({ ...s, items: removeItemAndDescendants(s.items, id) }));
  }

  function handleChildCreated(item: ItemWriteResponse) {
    foldSheetAnswer(item);
  }

  const childCounts = computeChildCounts(items, placements);

  return {
    items,
    placements,
    inversions,
    replaceItems,
    previewPlacement,
    writes,
    childCounts,
    getWorkphaseItems,
    getMergedColumnItems,
    getUnknownStatusItems,
    getAttachedChildren,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  };
}

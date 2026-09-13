import { useCallback, useMemo, useRef, useState } from 'react';
import type { Item } from '../../types';
import { createItem, type ItemWriteResponse } from '../../api/items';
import {
  EMPTY_ITEM_LIST_STATE,
  completeItemWrite,
  computeChildCounts,
  getAttachedChildrenFrom,
  getMergedColumnItemsFrom,
  getWorkphaseItemsFrom,
  removeItemAndDescendants,
  withPlacement,
  type Placement,
} from './itemListOps';

// A position write in flight, tracked per item so a stale response can never
// land last (wiki board-drag-interaction §10, DRAG-6.5): `begin` records the
// pending placement and hands back a sequence number; `complete`/`fail` are
// no-ops for any sequence that isn't the item's latest.
export interface ItemWriteTracker {
  begin(itemId: string, pending: Placement | null): number;
  /** Folds the response in (§5a order) unless it's stale. Returns whether it was applied. */
  complete(itemId: string, seq: number, response: ItemWriteResponse): boolean;
  /** Clears the pending placement so nothing from the guess survives; the caller resyncs. */
  fail(itemId: string, seq: number): void;
}

// The pure list operations live in itemListOps.ts; this hook only closes
// over state. State is one atom — items, ordinal placements, and the
// inversion log — so a write's reconciliation (pairs → row → clear the
// placement → tripwire) is a single pure reducer step rather than three
// setStates that could interleave with another response.
export function useItemManagement(projectId: string | undefined, filterProjectId: string | undefined) {
  const [list, setList] = useState(EMPTY_ITEM_LIST_STATE);
  const { items, placements, inversions } = list;
  const writeSeq = useRef(new Map<string, number>());

  // A board load replaces the list wholesale and drops every placement —
  // each belonged to the list it was made against. Every other change is a
  // reducer step below.
  const replaceItems = useCallback((next: Item[]) => {
    setList(s => ({ ...s, items: next, placements: new Map() }));
  }, []);

  // The live ghost during a drag (§10): where the carried item is drawn,
  // with no position invented. Null clears it.
  const previewPlacement = useCallback((itemId: string, placement: Placement | null) => {
    setList(s => withPlacement(s, itemId, placement));
  }, []);

  const writes = useMemo<ItemWriteTracker>(
    () => ({
      begin(itemId, pending) {
        const seq = (writeSeq.current.get(itemId) ?? 0) + 1;
        writeSeq.current.set(itemId, seq);
        setList(s => withPlacement(s, itemId, pending));
        return seq;
      },
      complete(itemId, seq, response) {
        if (writeSeq.current.get(itemId) !== seq) return false;
        setList(s => completeItemWrite(s, response));
        return true;
      },
      fail(itemId, seq) {
        if (writeSeq.current.get(itemId) !== seq) return;
        setList(s => withPlacement(s, itemId, null));
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

  function getAttachedChildren(parentId: string): Item[] {
    return getAttachedChildrenFrom(items, parentId, placements);
  }

  function findWorkphaseForItem(itemId: string): string | null {
    return items.find(i => i.id === itemId)?.workphaseId ?? null;
  }

  // Every write path lands through completeItemWrite so a reindex the server
  // disclosed is applied the same way whether the write came from the
  // board, the Sheet, or an inline create.
  async function handleCreateItem(workphaseId: string, title: string, type: string | null) {
    try {
      const newItem = await createItem({ type: type ?? undefined, title, projectId, workphaseId });
      setList(s => completeItemWrite(s, newItem));
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  }

  function handleItemUpdated(updated: ItemWriteResponse) {
    setList(s => completeItemWrite(s, updated));
  }

  function handleItemDeleted(id: string) {
    setList(s => ({ ...s, items: removeItemAndDescendants(s.items, id) }));
  }

  function handleChildCreated(item: ItemWriteResponse) {
    setList(s => completeItemWrite(s, item));
  }

  const childCounts = computeChildCounts(items);

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
    getAttachedChildren,
    findWorkphaseForItem,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  };
}

import { useState } from 'react';
import type { Item } from '../../types';
import { createItem } from '../../api/items';

// Deterministic tie-break for an exact position match — prevents order from
// depending on unspecified DB row order (Epic 3.2 Part 5).
function byPositionThenCreatedAt(a: Item, b: Item): number {
  return (a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt;
}

// Attached children with a parent render nested inside the parent's card
// (see getAttachedChildrenFrom) instead of as separate top-level board cards.
// `isTerminal` (Epic 3.2 Part 6): a done workphase's items have no stored
// position at all — ordered by completedAt instead.
export function getWorkphaseItemsFrom(
  items: readonly Item[],
  workphaseId: string,
  filterProjectId?: string,
  isTerminal?: boolean,
): Item[] {
  const filtered = items.filter(
    item =>
      item.workphaseId === workphaseId &&
      (!filterProjectId || item.projectId === filterProjectId) &&
      !(item.isAttached && item.parentId),
  );
  return isTerminal
    ? filtered.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    : filtered.sort(byPositionThenCreatedAt);
}

// Epic 3.2 Part 4: a merged column's item list is a union-sort across its
// covered workphases, not a concatenation of independently-sorted
// per-workphase lists — this is what makes genuine cross-workphase
// interleaving possible (today's rendering forced grouped-by-workphase order
// unconditionally). `isTerminal` mirrors getWorkphaseItemsFrom above — a
// column can't span both terminal and non-terminal workphases (Part 6's
// column-range validation), so it's uniform across the whole covered set.
export function getMergedColumnItemsFrom(
  items: readonly Item[],
  coveredWorkphaseIds: readonly string[],
  filterProjectId?: string,
  isTerminal?: boolean,
): Item[] {
  const coveredSet = new Set(coveredWorkphaseIds);
  const filtered = items.filter(
    item =>
      item.workphaseId !== null &&
      coveredSet.has(item.workphaseId) &&
      (!filterProjectId || item.projectId === filterProjectId) &&
      !(item.isAttached && item.parentId),
  );
  return isTerminal
    ? filtered.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    : filtered.sort(byPositionThenCreatedAt);
}

export function getAttachedChildrenFrom(items: readonly Item[], parentId: string): Item[] {
  return items.filter(item => item.parentId === parentId && item.isAttached).sort(byPositionThenCreatedAt);
}

// Counts attached children only — these are the ones the card's expand
// toggle reveals nested underneath it. Detached children render as
// ordinary top-level cards and aren't counted here.
export function computeChildCounts(items: readonly Item[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (item.parentId && item.isAttached) {
      counts[item.parentId] = (counts[item.parentId] ?? 0) + 1;
    }
  }
  return counts;
}

export function useItemManagement(projectId: string | undefined, filterProjectId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);

  function getWorkphaseItems(workphaseId: string, isTerminal?: boolean): Item[] {
    return getWorkphaseItemsFrom(items, workphaseId, filterProjectId, isTerminal);
  }

  function getMergedColumnItems(coveredWorkphaseIds: readonly string[], isTerminal?: boolean): Item[] {
    return getMergedColumnItemsFrom(items, coveredWorkphaseIds, filterProjectId, isTerminal);
  }

  function getAttachedChildren(parentId: string): Item[] {
    return getAttachedChildrenFrom(items, parentId);
  }

  function findWorkphaseForItem(itemId: string): string | null {
    return items.find(i => i.id === itemId)?.workphaseId ?? null;
  }

  async function handleCreateItem(workphaseId: string, title: string, type: string | null) {
    try {
      const newItem = await createItem({ type: type ?? undefined, title, projectId, workphaseId });
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  }

  function handleItemUpdated(updated: Item) {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleChildCreated(item: Item) {
    setItems(prev => [...prev, item]);
  }

  const childCounts = computeChildCounts(items);

  return {
    items,
    setItems,
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

import { useState } from 'react';
import type { Item } from '../../types';
import { createItem } from '../../api/items';

// Attached children with a parent render nested inside the parent's card
// (see getAttachedChildrenFrom) instead of as separate top-level board cards.
export function getWorkphaseItemsFrom(items: readonly Item[], workphaseId: string, filterProjectId?: string): Item[] {
  return items
    .filter(
      item =>
        item.workphaseId === workphaseId &&
        (!filterProjectId || item.projectId === filterProjectId) &&
        !(item.isAttached && item.parentId),
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getAttachedChildrenFrom(items: readonly Item[], parentId: string): Item[] {
  return items
    .filter(item => item.parentId === parentId && item.isAttached)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
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

  function getWorkphaseItems(workphaseId: string): Item[] {
    return getWorkphaseItemsFrom(items, workphaseId, filterProjectId);
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
    getAttachedChildren,
    findWorkphaseForItem,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  };
}

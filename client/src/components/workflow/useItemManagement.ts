import { useState } from 'react';
import type { Item } from '../../types';
import { createItem } from '../../api';

export function useItemManagement(
  projectId: string | undefined,
  filterProjectId: string | undefined,
) {
  const [items, setItems] = useState<Item[]>([]);

  function getWorkphaseItems(workphaseId: string): Item[] {
    return items
      .filter(item => item.workphaseId === workphaseId && (!filterProjectId || item.projectId === filterProjectId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
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
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleChildCreated(item: Item) {
    setItems(prev => [...prev, item]);
  }

  const childCounts: Record<string, number> = {};
  for (const item of items) {
    if (item.parentId) {
      childCounts[item.parentId] = (childCounts[item.parentId] ?? 0) + 1;
    }
  }

  return {
    items,
    setItems,
    childCounts,
    getWorkphaseItems,
    findWorkphaseForItem,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  };
}

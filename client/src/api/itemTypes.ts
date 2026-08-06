import type { ItemType } from '../types';
import { API } from './shared';

export async function fetchItemTypes(): Promise<ItemType[]> {
  const res = await fetch(`${API}/item-types`);
  if (!res.ok) throw new Error('Failed to fetch item types');
  return res.json();
}

export async function createItemType(data: { name: string; color?: string }): Promise<ItemType> {
  const res = await fetch(`${API}/item-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item type');
  return res.json();
}

export async function updateItemType(id: string, data: { name?: string; color?: string | null }): Promise<ItemType> {
  const res = await fetch(`${API}/item-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item type');
  return res.json();
}

export async function deleteItemType(id: string): Promise<void> {
  const res = await fetch(`${API}/item-types/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete item type');
  }
}

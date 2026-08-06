import type { Item, ItemDetail } from '../types';
import { API } from './shared';

export async function fetchItem(id: string): Promise<ItemDetail> {
  const res = await fetch(`${API}/items/${id}`);
  if (!res.ok) throw new Error('Failed to fetch item');
  return res.json();
}

export async function createItem(data: {
  type?: string | null;
  title: string;
  projectId?: string;
  workphaseId?: string;
  parentId?: string;
  description?: string;
  assigneeType?: string;
  agentId?: string;
  isAttached?: boolean;
}): Promise<Item> {
  const res = await fetch(`${API}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export type UpdateItemInput = Partial<Pick<Item, 'title' | 'description' | 'assigneeType' | 'agentId' | 'parentId'>> & {
  isAttached?: boolean;
};

export async function updateItem(id: string, data: UpdateItemInput): Promise<Item> {
  const res = await fetch(`${API}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to update item');
  }
  return res.json();
}

export async function moveItem(id: string, workphaseId: string, position: number): Promise<Item> {
  const res = await fetch(`${API}/items/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workphaseId, position }),
  });
  if (!res.ok) throw new Error('Failed to move item');
  return res.json();
}

export async function reorderItems(itemOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/items/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder items');
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API}/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

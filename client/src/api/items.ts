import type { Item, ItemDetail } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchItem(id: string): Promise<ItemDetail> {
  return apiJson(`/items/${id}`, undefined, 'Failed to fetch item');
}

export function createItem(data: {
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
  return apiJson('/items', { method: 'POST', body: data }, 'Failed to create item');
}

export type UpdateItemInput = Partial<Pick<Item, 'title' | 'description' | 'assigneeType' | 'agentId' | 'parentId'>> & {
  isAttached?: boolean;
};

export function updateItem(id: string, data: UpdateItemInput): Promise<Item> {
  return apiJson(`/items/${id}`, { method: 'PUT', body: data }, 'Failed to update item');
}

// Epic 3.2: prefers {anchorId, side} (resolved server-side against true
// current data, never a client-computed value) over a raw `position`, which
// stays supported only as a direct-control escape hatch — the board drag
// path no longer sends it. `scopeWorkphaseIds` widens the anchor/append
// scope to a merged column's covered set when the item isn't changing
// workphase (a same-visual-group reorder); omit it for a plain single
// workphase.
export interface MoveItemInput {
  workphaseId?: string;
  position?: number;
  anchorId?: string;
  side?: 'before' | 'after';
  scopeWorkphaseIds?: string[];
}

export function moveItem(id: string, data: MoveItemInput): Promise<Item> {
  return apiJson(`/items/${id}/move`, { method: 'PATCH', body: data }, 'Failed to move item');
}

export function reorderItems(itemOrders: { id: string; position: number }[]): Promise<void> {
  return apiVoid('/items/reorder', { method: 'PATCH', body: { itemOrders } }, 'Failed to reorder items');
}

export function deleteItem(id: string): Promise<void> {
  return apiVoid(`/items/${id}`, { method: 'DELETE' }, 'Failed to delete item');
}

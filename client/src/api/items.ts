import type { Item, ItemDetail } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchItem(id: string): Promise<ItemDetail> {
  return apiJson(`/items/${id}`, undefined, 'Failed to fetch item');
}

// One row a server-side reindex renumbered — `{id, position}` and nothing
// more (wiki item-positioning §5.1).
export interface ReindexedPosition {
  id: string;
  position: number;
}

// Every item write (POST / PUT / PATCH move) answers with the fresh row and,
// only when a lazy reindex renumbered other rows in the same transaction,
// the `reindexed` collection covering every one of them (the written item
// included). Absent means no reindex fired. Fold it in with
// `itemWriteReconciliation.ts::completeItemWrite` — never merge the row alone.
export type ItemWriteResponse = Item & { reindexed?: ReindexedPosition[] };

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
}): Promise<ItemWriteResponse> {
  return apiJson('/items', { method: 'POST', body: data }, 'Failed to create item');
}

export type UpdateItemInput = Partial<Pick<Item, 'title' | 'description' | 'assigneeType' | 'agentId' | 'parentId'>> & {
  isAttached?: boolean;
};

export function updateItem(id: string, data: UpdateItemInput): Promise<ItemWriteResponse> {
  return apiJson(`/items/${id}`, { method: 'PUT', body: data }, 'Failed to update item');
}

// Prefers {anchorId, side} (resolved server-side against true current
// data, never a client-computed value) over a raw `position`, which stays
// supported only as a direct-control escape hatch — the board drag never
// sends it.
//
// `parentId` (null = make top-level) and `isAttached` ride along with any
// of the above and commit in the same transaction — the shape the board's
// attach/detach gestures send. Omitting `isAttached` keeps the item's
// current state. `projectId` is never sent: a cross-project parent derives
// and cascades it server-side (wiki item-attachment §9).
//
// The server also accepts a `scopeWorkphaseIds` field, which has no effect
// on scope; this type leaves it out.
export interface MoveItemInput {
  workphaseId?: string;
  position?: number;
  anchorId?: string;
  side?: 'before' | 'after';
  parentId?: string | null;
  isAttached?: boolean;
}

export function moveItem(id: string, data: MoveItemInput): Promise<ItemWriteResponse> {
  return apiJson(`/items/${id}/move`, { method: 'PATCH', body: data }, 'Failed to move item');
}

export function reorderItems(itemOrders: { id: string; position: number }[]): Promise<void> {
  return apiVoid('/items/reorder', { method: 'PATCH', body: { itemOrders } }, 'Failed to reorder items');
}

export function deleteItem(id: string): Promise<void> {
  return apiVoid(`/items/${id}`, { method: 'DELETE' }, 'Failed to delete item');
}

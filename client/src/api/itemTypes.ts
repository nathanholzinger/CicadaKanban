import type { ItemType } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchItemTypes(): Promise<ItemType[]> {
  return apiJson('/item-types', undefined, 'Failed to fetch item types');
}

export function createItemType(data: { name: string; color?: string }): Promise<ItemType> {
  return apiJson('/item-types', { method: 'POST', body: data }, 'Failed to create item type');
}

export function updateItemType(id: string, data: { name?: string; color?: string | null }): Promise<ItemType> {
  return apiJson(`/item-types/${id}`, { method: 'PUT', body: data }, 'Failed to update item type');
}

export function deleteItemType(id: string): Promise<void> {
  return apiVoid(`/item-types/${id}`, { method: 'DELETE' }, 'Failed to delete item type');
}

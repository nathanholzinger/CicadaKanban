import type { Label } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchLabels(): Promise<Label[]> {
  return apiJson('/labels', undefined, 'Failed to fetch labels');
}

export function createLabel(data: { name: string; color: string }): Promise<Label> {
  return apiJson('/labels', { method: 'POST', body: data }, 'Failed to create label');
}

export function deleteLabel(id: string): Promise<void> {
  return apiVoid(`/labels/${id}`, { method: 'DELETE' }, 'Failed to delete label');
}

export function fetchItemLabels(itemId: string): Promise<Label[]> {
  return apiJson(`/labels/item/${itemId}`, undefined, 'Failed to fetch item labels');
}

export function addLabelToItem(itemId: string, labelId: string): Promise<void> {
  return apiVoid(`/labels/item/${itemId}`, { method: 'POST', body: { labelId } }, 'Failed to add label');
}

export function removeLabelFromItem(itemId: string, labelId: string): Promise<void> {
  return apiVoid(`/labels/item/${itemId}/${labelId}`, { method: 'DELETE' }, 'Failed to remove label');
}

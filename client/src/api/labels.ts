import type { Label } from '../types';
import { API } from './shared';

export async function fetchLabels(): Promise<Label[]> {
  const res = await fetch(`${API}/labels`);
  if (!res.ok) throw new Error('Failed to fetch labels');
  return res.json();
}

export async function createLabel(data: { name: string; color: string }): Promise<Label> {
  const res = await fetch(`${API}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create label');
  return res.json();
}

export async function deleteLabel(id: string): Promise<void> {
  const res = await fetch(`${API}/labels/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete label');
}

export async function fetchItemLabels(itemId: string): Promise<Label[]> {
  const res = await fetch(`${API}/labels/item/${itemId}`);
  if (!res.ok) throw new Error('Failed to fetch item labels');
  return res.json();
}

export async function addLabelToItem(itemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/item/${itemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
  if (!res.ok) throw new Error('Failed to add label');
}

export async function removeLabelFromItem(itemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/item/${itemId}/${labelId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove label');
}

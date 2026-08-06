import type { ColumnDisplayMode, ColumnRow } from '../types';
import { API } from './shared';

export async function createColumn(data: {
  boardId: string;
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}): Promise<ColumnRow> {
  const res = await fetch(`${API}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to create column');
  }
  return res.json();
}

export async function updateColumn(
  id: string,
  data: {
    startWorkphaseId?: string;
    endWorkphaseId?: string;
    displayMode?: ColumnDisplayMode;
    name?: string | null;
  },
): Promise<ColumnRow> {
  const res = await fetch(`${API}/columns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to update column');
  }
  return res.json();
}

export async function reorderColumns(columnOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/columns/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder columns');
}

export async function deleteColumn(id: string): Promise<void> {
  const res = await fetch(`${API}/columns/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete column');
}

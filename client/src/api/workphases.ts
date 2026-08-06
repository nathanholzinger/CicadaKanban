import type { WorkPhase, ColumnRow } from '../types';
import { API } from './shared';

export async function createWorkPhase(data: {
  workflowId: string;
  name: string;
  triggersNotification?: boolean;
  isTerminal?: boolean;
}): Promise<WorkPhase> {
  const res = await fetch(`${API}/workphases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workphase');
  return res.json();
}

export async function updateWorkPhase(id: string, data: { name?: string }): Promise<WorkPhase> {
  const res = await fetch(`${API}/workphases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update workphase');
  return res.json();
}

export type WorkphaseDeleteReport = {
  shrunkColumns: ColumnRow[];
  deletedColumns: ColumnRow[];
};

// Deleting a workphase can shrink or remove board columns that covered it —
// returns that report (200) or null when nothing needed adjusting (204).
export async function deleteWorkPhase(id: string): Promise<WorkphaseDeleteReport | null> {
  const res = await fetch(`${API}/workphases/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete workphase');
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function reorderWorkPhases(workphaseOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/workphases/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workphaseOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder workphases');
}

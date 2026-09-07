import type { Workphase, ColumnRow } from '../types';
import { apiJson, apiRequest, apiVoid } from './shared';

export function createWorkphase(data: {
  workflowId: string;
  name: string;
  triggersNotification?: boolean;
  isTerminal?: boolean;
}): Promise<Workphase> {
  return apiJson('/workphases', { method: 'POST', body: data }, 'Failed to create workphase');
}

export function updateWorkphase(id: string, data: { name?: string }): Promise<Workphase> {
  return apiJson(`/workphases/${id}`, { method: 'PUT', body: data }, 'Failed to update workphase');
}

export type WorkphaseDeleteReport = {
  shrunkColumns: ColumnRow[];
  deletedColumns: ColumnRow[];
};

// Deleting a workphase can shrink or remove board columns that covered it —
// returns that report (200) or null when nothing needed adjusting (204). Uses
// apiRequest directly (not apiJson/apiVoid) since which of those two shapes
// applies depends on the response status, not just the request.
export async function deleteWorkphase(id: string): Promise<WorkphaseDeleteReport | null> {
  const res = await apiRequest(`/workphases/${id}`, { method: 'DELETE' }, 'Failed to delete workphase');
  if (res.status === 204) return null;
  return res.json();
}

export function reorderWorkphases(workphaseOrders: { id: string; position: number }[]): Promise<void> {
  return apiVoid('/workphases/reorder', { method: 'PATCH', body: { workphaseOrders } }, 'Failed to reorder workphases');
}

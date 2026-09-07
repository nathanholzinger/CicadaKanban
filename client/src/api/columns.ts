import type { ColumnDisplayMode, ColumnRow } from '../types';
import { apiJson, apiVoid } from './shared';

export function createColumn(data: {
  boardId: string;
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}): Promise<ColumnRow> {
  return apiJson('/columns', { method: 'POST', body: data }, 'Failed to create column');
}

export function updateColumn(
  id: string,
  data: {
    startWorkphaseId?: string;
    endWorkphaseId?: string;
    displayMode?: ColumnDisplayMode;
    name?: string | null;
  },
): Promise<ColumnRow> {
  return apiJson(`/columns/${id}`, { method: 'PUT', body: data }, 'Failed to update column');
}

export function reorderColumns(columnOrders: { id: string; position: number }[]): Promise<void> {
  return apiVoid('/columns/reorder', { method: 'PATCH', body: { columnOrders } }, 'Failed to reorder columns');
}

export function deleteColumn(id: string): Promise<void> {
  return apiVoid(`/columns/${id}`, { method: 'DELETE' }, 'Failed to delete column');
}

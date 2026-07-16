import { useState } from 'react';
import type { ColumnDisplayMode } from '../../types';
import { createColumn, updateColumn, deleteColumn, reorderColumns } from '../../api';

interface ColumnRangeInput {
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}

export function useColumnManagement(boardId: string | null, reload: () => Promise<void>) {
  const [error, setError] = useState('');

  async function handleCreateColumn(data: ColumnRangeInput): Promise<boolean> {
    if (!boardId) return false;
    setError('');
    try {
      await createColumn({ boardId, ...data });
      await reload();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create column');
      return false;
    }
  }

  async function handleUpdateColumn(id: string, data: Partial<ColumnRangeInput>): Promise<boolean> {
    setError('');
    try {
      await updateColumn(id, data);
      await reload();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column');
      return false;
    }
  }

  async function handleDeleteColumn(id: string) {
    await deleteColumn(id);
    await reload();
  }

  async function handleReorderColumns(orders: { id: string; position: number }[]) {
    await reorderColumns(orders);
  }

  return { error, setError, handleCreateColumn, handleUpdateColumn, handleDeleteColumn, handleReorderColumns };
}

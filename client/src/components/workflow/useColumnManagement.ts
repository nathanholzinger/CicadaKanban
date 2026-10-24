// Column CRUD, and the column-reorder drop, for BoardView.

import { useState, type Dispatch, type SetStateAction } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithDetails, ColumnDisplayMode } from '../../types';
import { createColumn, updateColumn, deleteColumn, reorderColumns } from '../../api/columns';

interface ColumnRangeInput {
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}

export function useColumnManagement(
  boardId: string | null,
  board: BoardWithDetails | null,
  setBoard: Dispatch<SetStateAction<BoardWithDetails | null>>,
  reload: () => Promise<void>,
) {
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

  // A column dropped on another takes its place (wiki boards-columns-unsorted §7): the
  // board reorders at once, the new order is saved, and a failed save resyncs the board
  // to what the server has. `resync` is the drag layer's (`useBoardDnd.ts::resyncBoard`),
  // not a bare `reload`: the failure can land during the next drag, and a reload then
  // unmounts the drag's `DndContext` and orphans its session.
  async function onColumnDrop(activeId: string, overId: string, resync: () => Promise<void>) {
    const columns = board?.columns;
    if (!columns) return;
    const oldIndex = columns.findIndex(c => c.id === activeId);
    const newIndex = columns.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(columns, oldIndex, newIndex);
    setBoard(prev => (prev ? { ...prev, columns: reordered } : prev));
    try {
      await reorderColumns(reordered.map((c, i) => ({ id: c.id, position: i + 1 })));
    } catch (err) {
      console.error('Failed to reorder columns:', err);
      await resync();
    }
  }

  return { error, setError, handleCreateColumn, handleUpdateColumn, handleDeleteColumn, onColumnDrop };
}

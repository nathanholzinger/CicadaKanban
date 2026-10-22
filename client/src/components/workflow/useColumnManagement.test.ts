import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { BoardWithDetails } from '../../types';
import { reorderColumns } from '../../api/columns';
import { useColumnManagement } from './useColumnManagement';

vi.mock('../../api/columns');

// A board with columns `ids`, in that order — the only part of it the drop reads.
const boardOf = (...ids: string[]) => ({ columns: ids.map(id => ({ id })) }) as unknown as BoardWithDetails;
const orderOf = (board: BoardWithDetails | null) => board?.columns.map(c => c.id);

function columnDrop(board: BoardWithDetails | null) {
  const setBoard = vi.fn();
  const reload = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useColumnManagement('board-1', board, setBoard, reload));
  return { setBoard, reload, drop: result.current.onColumnDrop };
}

describe('useColumnManagement: onColumnDrop', () => {
  beforeEach(() => {
    vi.mocked(reorderColumns).mockReset().mockResolvedValue(undefined);
  });

  it('reorders the board at once, and saves the new order as positions from 1', async () => {
    const board = boardOf('a', 'b', 'c');
    const { setBoard, reload, drop } = columnDrop(board);

    await drop('a', 'c');

    const update = setBoard.mock.calls[0][0] as (prev: BoardWithDetails | null) => BoardWithDetails | null;
    expect(orderOf(update(board))).toEqual(['b', 'c', 'a']);
    expect(reorderColumns).toHaveBeenCalledWith([
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
      { id: 'a', position: 3 },
    ]);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads the board when the save fails', async () => {
    vi.mocked(reorderColumns).mockRejectedValue(new Error('refused'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { reload, drop } = columnDrop(boardOf('a', 'b'));

    await drop('b', 'a');

    expect(reload).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalled();
  });

  it('does nothing for a column the board does not hold, or with no board', async () => {
    const withBoard = columnDrop(boardOf('a', 'b'));
    await withBoard.drop('a', 'gone');
    await withBoard.drop('gone', 'a');
    const withoutBoard = columnDrop(null);
    await withoutBoard.drop('a', 'b');

    expect(withBoard.setBoard).not.toHaveBeenCalled();
    expect(withoutBoard.setBoard).not.toHaveBeenCalled();
    expect(reorderColumns).not.toHaveBeenCalled();
  });
});

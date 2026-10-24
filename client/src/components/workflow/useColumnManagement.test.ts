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
  const resync = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useColumnManagement('board-1', board, setBoard, reload));
  return {
    setBoard,
    reload,
    resync,
    drop: (activeId: string, overId: string) => result.current.onColumnDrop(activeId, overId, resync),
  };
}

describe('useColumnManagement: onColumnDrop', () => {
  beforeEach(() => {
    vi.mocked(reorderColumns).mockReset().mockResolvedValue(undefined);
  });

  it('reorders the board at once, and saves the new order as positions from 1', async () => {
    const board = boardOf('a', 'b', 'c');
    const { setBoard, resync, drop } = columnDrop(board);

    await drop('a', 'c');

    const update = setBoard.mock.calls[0][0] as (prev: BoardWithDetails | null) => BoardWithDetails | null;
    expect(orderOf(update(board))).toEqual(['b', 'c', 'a']);
    expect(reorderColumns).toHaveBeenCalledWith([
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
      { id: 'a', position: 3 },
    ]);
    expect(resync).not.toHaveBeenCalled();
  });

  // The drag layer's resync ends a live item drag before it reloads (`useBoardDnd.test.ts`); a
  // reload of the hook's own would leave that drag's session behind.
  it('resyncs through the callback it is given when the save fails, never by reloading itself', async () => {
    vi.mocked(reorderColumns).mockRejectedValue(new Error('refused'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { reload, resync, drop } = columnDrop(boardOf('a', 'b'));

    await drop('b', 'a');

    expect(resync).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
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

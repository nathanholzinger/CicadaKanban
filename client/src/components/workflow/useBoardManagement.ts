import { useState, useEffect, useCallback } from 'react';
import type { Board } from '../../types';
import { fetchBoards, createBoard, updateBoard, deleteBoard } from '../../api';

export function useBoardManagement(workflowId: string) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardIdState] = useState<string | null>(null);

  const loadBoards = useCallback(async () => {
    const data = await fetchBoards(workflowId);
    const sorted = [...data].sort((a, b) => a.position - b.position);
    setBoards(sorted);

    const stored = localStorage.getItem(`kanban_active_board_${workflowId}`);
    const resolved = stored && sorted.some(b => b.id === stored) ? stored : (sorted[0]?.id ?? null);
    setActiveBoardIdState(resolved);

    return sorted;
  }, [workflowId]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  function setActiveBoardId(id: string) {
    setActiveBoardIdState(id);
    localStorage.setItem(`kanban_active_board_${workflowId}`, id);
  }

  async function handleCreateBoard(name: string) {
    const board = await createBoard({ workflowId, name });
    setBoards(prev => [...prev, board].sort((a, b) => a.position - b.position));
    setActiveBoardId(board.id);
    return board;
  }

  async function handleRenameBoard(id: string, name: string) {
    const updated = await updateBoard(id, { name });
    setBoards(prev => prev.map(b => (b.id === id ? updated : b)));
  }

  async function handleToggleShowAttachedChildren(id: string, show: boolean) {
    const updated = await updateBoard(id, { showAttachedChildren: show });
    setBoards(prev => prev.map(b => (b.id === id ? updated : b)));
    return updated;
  }

  async function handleDeleteBoard(id: string) {
    await deleteBoard(id);
    const next = boards.filter(b => b.id !== id);
    setBoards(next);
    if (activeBoardId === id) {
      const fallback = next[0]?.id ?? null;
      if (fallback) setActiveBoardId(fallback);
    }
  }

  return {
    boards,
    activeBoardId,
    setActiveBoardId,
    handleCreateBoard,
    handleRenameBoard,
    handleDeleteBoard,
    handleToggleShowAttachedChildren,
    reloadBoards: loadBoards,
  };
}

import type { Board, BoardWithDetails } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchBoards(workflowId: string): Promise<Board[]> {
  return apiJson(`/boards?workflowId=${workflowId}`, undefined, 'Failed to fetch boards');
}

export function fetchBoard(id: string): Promise<BoardWithDetails> {
  return apiJson(`/boards/${id}`, undefined, 'Failed to fetch board');
}

export function createBoard(data: { workflowId: string; name: string }): Promise<Board> {
  return apiJson('/boards', { method: 'POST', body: data }, 'Failed to create board');
}

export function updateBoard(id: string, data: { name?: string; showAttachedChildren?: boolean }): Promise<Board> {
  return apiJson(`/boards/${id}`, { method: 'PUT', body: data }, 'Failed to update board');
}

export function deleteBoard(id: string): Promise<void> {
  return apiVoid(`/boards/${id}`, { method: 'DELETE' }, 'Failed to delete board');
}

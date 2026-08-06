import type { Board, BoardWithDetails } from '../types';
import { API } from './shared';

export async function fetchBoards(workflowId: string): Promise<Board[]> {
  const res = await fetch(`${API}/boards?workflowId=${workflowId}`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function fetchBoard(id: string): Promise<BoardWithDetails> {
  const res = await fetch(`${API}/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(data: { workflowId: string; name: string }): Promise<Board> {
  const res = await fetch(`${API}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function updateBoard(id: string, data: { name?: string; showAttachedChildren?: boolean }): Promise<Board> {
  const res = await fetch(`${API}/boards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API}/boards/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete board');
  }
}

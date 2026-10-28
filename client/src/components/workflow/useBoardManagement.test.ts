// The active board a workflow remembers, and that a viewer whose browser blocks site data still
// gets the workflow's boards (`lib/browserStorage.ts`).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Board } from '../../types';
import { fetchBoards } from '../../api/boards';
import { useBoardManagement } from './useBoardManagement';

vi.mock('../../api/boards');

const board = (id: string, position: number) => ({ id, position, workflowId: 'wf' }) as Board;
const BOARDS = [board('first', 1), board('second', 2)];
const KEY = 'kanban_active_board_wf';

// `localStorage` as the page sees it, put back after a test that replaces it.
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

beforeEach(() => {
  localStorage.clear();
  vi.mocked(fetchBoards).mockResolvedValue(BOARDS);
});

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
});

describe('useBoardManagement: the active board', () => {
  it('starts on the workflow’s first board, and on the one the viewer chose, once chosen', async () => {
    const { result } = renderHook(() => useBoardManagement('wf'));
    await waitFor(() => expect(result.current.activeBoardId).toBe('first'));

    act(() => result.current.setActiveBoardId('second'));
    expect(result.current.activeBoardId).toBe('second');
    expect(localStorage.getItem(KEY)).toBe('second');

    // A later visit finds the choice.
    const again = renderHook(() => useBoardManagement('wf'));
    await waitFor(() => expect(again.result.current.activeBoardId).toBe('second'));
  });

  it('falls back to the first board when the one remembered is gone', async () => {
    localStorage.setItem(KEY, 'deleted');
    const { result } = renderHook(() => useBoardManagement('wf'));
    await waitFor(() => expect(result.current.activeBoardId).toBe('first'));
  });

  it('still loads the boards, and lets the viewer choose one, where the browser blocks its site data', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
      configurable: true,
    });
    const { result } = renderHook(() => useBoardManagement('wf'));
    await waitFor(() => expect(result.current.boards.map(b => b.id)).toEqual(['first', 'second']));
    expect(result.current.activeBoardId).toBe('first');

    act(() => result.current.setActiveBoardId('second'));
    expect(result.current.activeBoardId).toBe('second');
  });
});

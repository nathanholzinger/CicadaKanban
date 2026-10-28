// The drag hook's handling of a column drop whose save fails. The gesture itself is tested through
// the pure modules it runs and the E2E drag specs; this file holds only what needs the hook's live
// session.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { BoardWithDetails } from '../../types';
import { moveItem } from '../../api/items';
import { makeItem } from '../../test/itemFixture';
import { DEFAULT_DRAG_TUNING } from './dragTuning';
import { NO_PLACEMENTS } from './itemListOps';
import { useBoardDnd, type BoardDndDeps } from './useBoardDnd';

vi.mock('../../api/items');

// The board has no columns: the drag starts in no context, which is all the session needs.
const board = { columns: [], itemDepthCap: 4 } as unknown as BoardWithDetails;

const columnDrop = {
  active: { id: 'a', data: { current: { type: 'column' } } },
  over: { id: 'b' },
} as unknown as DragEndEvent;
const itemPickup = {
  active: { id: 'x', data: { current: {} } },
  activatorEvent: { clientX: 5, clientY: 5 },
} as unknown as DragStartEvent;
const itemRelease = { active: { id: 'x', data: { current: {} } }, over: null } as unknown as DragEndEvent;

function depsWith(onColumnDrop: BoardDndDeps['onColumnDrop']): BoardDndDeps {
  return {
    board,
    items: [makeItem('x')],
    tuning: DEFAULT_DRAG_TUNING,
    placements: NO_PLACEMENTS,
    previewPlacement: vi.fn(),
    writes: {
      begin: () => 1,
      complete: () => ({ applied: true, needsResync: false }),
      fail: () => {},
      isPending: () => false,
    },
    getWorkphaseItems: () => [],
    getMergedColumnItems: () => [],
    getAttachedChildren: () => [],
    onColumnDrop,
    loadBoard: vi.fn().mockResolvedValue(undefined),
    rootRef: { current: null },
    hierarchyModalCardId: null,
    openHierarchyModalAt: vi.fn(),
    closeHierarchyModal: vi.fn(),
  };
}

describe('useBoardDnd: the hierarchy modal reporting its placement', () => {
  it('closes the modal, and reads nothing from it, when the drag is no longer in the modal’s layer', () => {
    const deps = depsWith(async () => {});
    const { result } = renderHook(() => useBoardDnd(deps));
    // The drag began in no context, as one that popped out of the modal's Card before the modal
    // mounted would be.
    act(() => result.current.handleDragStart(itemPickup));
    const before = result.current.session;

    act(() => result.current.readModalPlacement('p', { gap: 1, depth: 0, pointerX: 5, pointerY: 5 }));

    expect(deps.closeHierarchyModal).toHaveBeenCalledOnce();
    expect(result.current.session).toBe(before);
  });

  it('does nothing with no drag running', () => {
    const deps = depsWith(async () => {});
    const { result } = renderHook(() => useBoardDnd(deps));

    act(() => result.current.readModalPlacement('p', { gap: 1, depth: 0, pointerX: 5, pointerY: 5 }));

    expect(deps.closeHierarchyModal).not.toHaveBeenCalled();
  });
});

describe('useBoardDnd: a column reorder whose save fails', () => {
  beforeEach(() => {
    vi.mocked(moveItem).mockReset();
  });

  it('DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing', async () => {
    let failSave!: () => void;
    const saveFails = new Promise<void>(resolve => {
      failSave = resolve;
    });
    const deps = depsWith(async (_activeId, _overId, resync) => {
      await saveFails;
      await resync();
    });
    const { result } = renderHook(() => useBoardDnd(deps));

    let reorder!: Promise<void>;
    act(() => {
      reorder = result.current.handleDragEnd(columnDrop);
    });
    act(() => result.current.handleDragStart(itemPickup));
    expect(result.current.session).not.toBeNull();

    await act(async () => {
      failSave();
      await reorder;
    });

    expect(result.current.session).toBeNull();
    expect(deps.previewPlacement).toHaveBeenLastCalledWith('x', null);
    expect(deps.loadBoard).toHaveBeenCalledOnce();
    await act(() => result.current.handleDragEnd(itemRelease));
    expect(moveItem).not.toHaveBeenCalled();
  });

  it('reloads the board when no drag is live', async () => {
    const deps = depsWith(async (_activeId, _overId, resync) => {
      await resync();
    });
    const { result } = renderHook(() => useBoardDnd(deps));

    await act(() => result.current.handleDragEnd(columnDrop));

    expect(deps.loadBoard).toHaveBeenCalledOnce();
    expect(result.current.session).toBeNull();
  });
});

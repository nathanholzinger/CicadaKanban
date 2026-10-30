// The drag hook's handling of a column drop whose save fails. The gesture itself is tested through
// the pure modules it runs and the E2E drag specs; this file holds only what needs the hook's live
// session.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { BoardWithDetails, Item } from '../../types';
import { moveItem } from '../../api/items';
import { makeItem } from '../../test/itemFixture';
import { DEFAULT_DRAG_TUNING } from './dragTuning';
import { NO_PLACEMENTS, type Placement, type Placements } from './itemListOps';
import { useBoardDnd, type BoardDndDeps } from './useBoardDnd';

vi.mock('../../api/items');

// The board has no columns: the drag starts in no context, which is all the session needs.
const boardWithCap = (itemDepthCap: number): BoardWithDetails =>
  ({ columns: [], itemDepthCap }) as unknown as BoardWithDetails;
const board = boardWithCap(4);

const columnDrop = {
  active: { id: 'a', data: { current: { type: 'column' } } },
  over: { id: 'b' },
} as unknown as DragEndEvent;
const pickupOf = (id: string): DragStartEvent =>
  ({ active: { id, data: { current: {} } }, activatorEvent: { clientX: 5, clientY: 5 } }) as unknown as DragStartEvent;
const itemPickup = pickupOf('x');
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

// Picks `id` up on a board of `items` with `placements` still pending, and returns the session the
// pickup began.
function pickupSession(id: string, items: Item[], placements: Placements, cap = 4) {
  const deps = { ...depsWith(async () => {}), board: boardWithCap(cap), items, placements };
  const { result } = renderHook(() => useBoardDnd(deps));
  act(() => result.current.handleDragStart(pickupOf(id)));
  return result.current.session;
}

// A Stub's drag starts at its containing Card's layer, the nearest Free ancestor as the board draws
// it: another item's attachment that has not landed yet moves the Stub's whole ancestry.
describe('useBoardDnd: where a Stub’s drag starts', () => {
  it('is the Card it is drawn under, when an ancestor’s attachment is still pending', () => {
    // A is Free and holds X. A has been dropped on B and the write is in flight, so the board draws
    // B → A → X: A is a Stub now and has no Descendants region to start in.
    const items = [makeItem('b'), makeItem('a'), makeItem('x', { parentId: 'a' })];
    const placements = new Map([['a', { parentId: 'b', slot: 'last' as const }]]);
    const deps = { ...depsWith(async () => {}), items, placements };
    const { result } = renderHook(() => useBoardDnd(deps));

    act(() => result.current.handleDragStart(itemPickup));

    expect(result.current.session?.containingCardId).toBe('b');
    // The origin is still the Stub's own direct parent, which is not the Card it starts in.
    expect(result.current.session?.origin).toEqual({ parentId: 'a', slot: 'existing' });
  });

  it('is the nearest Free ancestor when nothing is pending', () => {
    const items = [makeItem('b'), makeItem('a', { parentId: 'b' }), makeItem('x', { parentId: 'a' })];
    const deps = { ...depsWith(async () => {}), items };
    const { result } = renderHook(() => useBoardDnd(deps));

    act(() => result.current.handleDragStart(itemPickup));

    expect(result.current.session?.containingCardId).toBe('b');
  });

  it('is a Card whose own detach is still pending, which is drawn Free', () => {
    // P holds C, which holds X. C has been pulled out and the write is in flight, so the board draws C
    // as a Card of its own, with X in it. P is behind C, which the detach keeps as C's parent.
    const items = [makeItem('p'), makeItem('c', { parentId: 'p' }), makeItem('x', { parentId: 'c' })];
    const placements = new Map<string, Placement>([['c', { parentId: null, slot: 'last' }]]);

    expect(pickupSession('x', items, placements)?.containingCardId).toBe('c');
  });
});

// The drag's targets are classified once at pickup (wiki board-drag-interaction §4), against the tree
// as the writes still in flight leave it: depths and cycles count the parent each item will have.
describe('useBoardDnd: what a drag’s targets are classified against', () => {
  const pendingAttach = new Map<string, Placement>([['a', { parentId: 'b', slot: 'last' }]]);

  it('counts depth through an ancestor whose attachment is still pending', () => {
    // A is Free and holds X and Y. A has been dropped on B and the write is in flight, so the board
    // draws B → A → Y. With a cap of 3, Y is one level too deep for X to go under, and A is not.
    const items = [makeItem('b'), makeItem('a'), makeItem('x', { parentId: 'a' }), makeItem('y', { parentId: 'a' })];
    const { states } = pickupSession('x', items, pendingAttach, 3)!.classification;

    expect(states.get('y')).toBe('depth-capped');
    expect(states.get('a')).toBe('valid');
  });

  it('classifies an item a pending attachment puts in the dragged Card as its descendant', () => {
    // F is Free and has been dropped on P, the write in flight: F is drawn as one of P's Stubs, so it
    // can't take P, and it is no Card of its own to mark.
    const items = [makeItem('p'), makeItem('f')];
    const placements = new Map<string, Placement>([['f', { parentId: 'p', slot: 'last' }]]);
    const { states, freeDescendantIds } = pickupSession('p', items, placements)!.classification;

    expect(states.get('f')).toBe('cycle-forming');
    expect(freeDescendantIds.has('f')).toBe(false);
  });

  describe('a detach that is still pending, which keeps its parent', () => {
    // P holds C, and C has been pulled out to Free with the write in flight. The board draws C with no
    // parent, but a detach leaves C under P (wiki item-attachment §11), so the tree has it there.
    const detaching = new Map<string, Placement>([['c', { parentId: null, slot: 'last' }]]);

    it('is still a descendant of its parent, and now a Card of its own to mark', () => {
      const items = [makeItem('p'), makeItem('c', { parentId: 'p' })];
      const { states, freeDescendantIds } = pickupSession('p', items, detaching)!.classification;

      expect(states.get('c')).toBe('cycle-forming');
      expect(freeDescendantIds.has('c')).toBe(true);
    });

    it('still sits one level down, for the depth of what is put under it', () => {
      // Z carries a Stub, so it needs two levels under a target: C at depth 2 leaves it one past the
      // cap of 3, where C as a root would leave it exactly at the cap.
      const items = [makeItem('p'), makeItem('c', { parentId: 'p' }), makeItem('z'), makeItem('zc', { parentId: 'z' })];

      expect(pickupSession('z', items, detaching, 3)!.classification.states.get('c')).toBe('depth-capped');
    });
  });
});

// The row the drag names as the ghost's neighbor comes from dnd-kit's events. A move event carries
// the `over` of the render before it, so the move that crosses into a new row still names the old
// one, and `onDragOver` is what announces the new one: the section paints the ghost by that `over`,
// so a projection read from the move alone parts from the picture whenever the pointer stops there.
describe('useBoardDnd: the row a Stub’s drag names as the ghost’s neighbor', () => {
  const rowsOf = ['a', 'x', 'b'];
  const items = [
    makeItem('p'),
    makeItem('a', { parentId: 'p', position: 1 }),
    makeItem('x', { parentId: 'p', position: 2 }),
    makeItem('b', { parentId: 'p', position: 3 }),
  ];
  const sectionRows = (parentId: string) => items.filter(i => i.parentId === parentId);

  // dnd-kit's `over` for the row `id`, and the carried copy over the bottom of its rect.
  const eventOver = (id: string) => ({
    active: { id: 'x', data: { current: {} }, rect: { current: { translated: { top: 100, height: 26 } } } },
    over: {
      id,
      rect: { top: 100, height: 24 },
      data: {
        current: {
          type: 'item',
          role: 'stub',
          sectionCardId: 'p',
          sortable: { containerId: 'section', index: rowsOf.indexOf(id), items: rowsOf },
        },
      },
    },
  });

  function startDragOfX() {
    const deps = { ...depsWith(async () => {}), items, getAttachedChildren: sectionRows };
    const hook = renderHook(() => useBoardDnd(deps));
    act(() => hook.result.current.handleDragStart(itemPickup));
    return hook.result;
  }

  it('is the row dnd-kit announces over a move event that names the row before it', () => {
    const result = startDragOfX();

    act(() => result.current.handleDragMove(eventOver('a') as unknown as DragMoveEvent));
    expect(result.current.session?.projection?.gap).toBe(0);

    // The pointer stops in B's row: the move that got it there still carries A, and the announcement
    // names B, after which the ghost is the last row.
    act(() => result.current.handleDragOver(eventOver('b') as unknown as DragOverEvent));
    expect(result.current.session?.projection?.gap).toBe(2);
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

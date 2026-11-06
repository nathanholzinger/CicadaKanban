// The drag hook's cases that need its live session: the hierarchy modal reporting its placement,
// where a Stub's drag starts, what a drag's targets are classified against, the branch a Stub's
// pickup takes with it, the row a Stub's drag names as the ghost's neighbor, a pointer sample that
// would cycle through the pop machine, a column reorder whose save fails, and a drag the board
// stops. The
// gesture itself is tested through the pure modules it runs and the E2E drag specs.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { BoardWithDetails, Item } from '../../types';
import { moveItem } from '../../api/items';
import { column, rect, regionEl } from '../../test/dragFixtures';
import { makeItem } from '../../test/itemFixture';
import { columnData, itemRowData } from './dragCollision';
import { columnRegionKey, descendantsRegionKey, subrowRegionKey } from './dragRegions';
import { DEFAULT_DRAG_TUNING } from './dragTuning';
import { NO_PLACEMENTS, getAttachedChildrenFrom, type Placement, type Placements } from './itemListOps';
import { useBoardDnd, type BoardDndDeps } from './useBoardDnd';

vi.mock('../../api/items');

// The board has no columns: a Free Card's drag starts in no context, which is all the session needs. A Stub's
// drag starts in its containing Card's Descendants context whatever the columns.
const boardWithCap = (itemDepthCap: number): BoardWithDetails =>
  ({ columns: [], itemDepthCap }) as unknown as BoardWithDetails;
const board = boardWithCap(4);

const columnDrop = {
  active: { id: 'a', data: { current: columnData() } },
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
    onDragStopped: vi.fn(),
    armedStop: null,
    disarmStop: vi.fn(),
    rootRef: { current: null },
    hierarchyModalCardId: null,
    openHierarchyModalAt: vi.fn(),
    closeHierarchyModal: vi.fn(),
  };
}

// The hook on `depsWith`'s board, with `overrides` over its deps, and the drag of `id` begun.
function startDrag(overrides: Partial<BoardDndDeps> = {}, id = 'x') {
  const deps = { ...depsWith(async () => {}), ...overrides };
  const { result } = renderHook(() => useBoardDnd(deps));
  act(() => result.current.handleDragStart(pickupOf(id)));
  return { deps, result };
}

// Picks `id` up on a board of `items` with `placements` still pending, and returns the session the
// pickup began.
function pickupSession(id: string, items: Item[], placements: Placements, cap = 4) {
  return startDrag({ board: boardWithCap(cap), items, placements }, id).result.current.session;
}

// A column save that fails once `failSave` is called, so an item drag can start in between.
function failingColumnSave() {
  let failSave!: () => void;
  const saveFails = new Promise<void>(resolve => {
    failSave = resolve;
  });
  const deps = depsWith(async (_activeId, _overId, resync) => {
    await saveFails;
    await resync();
  });
  return { deps, failSave };
}

describe('useBoardDnd: the hierarchy modal reporting its placement', () => {
  it('closes the modal, and reads nothing from it, when the drag is no longer in the modal’s layer', () => {
    // The drag began in no context, as one that popped out of the modal's Card before the modal
    // mounted would be.
    const { deps, result } = startDrag();
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

// A Stub's drag starts at its containing Card's layer, the nearest Free ancestor as the board draws
// it: another item's attachment that has not landed yet moves the Stub's whole ancestry.
describe('useBoardDnd: where a Stub’s drag starts', () => {
  it('DRAG-1.36: is the Card it is drawn under, when an ancestor’s attachment is still pending', () => {
    // A is Free and holds X. A has been dropped on B and the write is in flight, so the board draws
    // B → A → X: A is a Stub now and has no Descendants region to start in.
    const items = [makeItem('b'), makeItem('a'), makeItem('x', { parentId: 'a' })];
    const placements = new Map([['a', { parentId: 'b', slot: 'last' as const }]]);

    const session = pickupSession('x', items, placements);

    expect(session?.containingCardId).toBe('b');
    // The origin is still the Stub's own direct parent, which is not the Card it starts in.
    expect(session?.origin).toEqual({ parentId: 'a', slot: 'existing' });
  });

  it('is the nearest Free ancestor when nothing is pending', () => {
    const items = [makeItem('b'), makeItem('a', { parentId: 'b' }), makeItem('x', { parentId: 'a' })];

    expect(pickupSession('x', items, NO_PLACEMENTS)?.containingCardId).toBe('b');
  });

  it('DRAG-1.36: is a Card whose own detach is still pending, which is drawn Free', () => {
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

  it('DRAG-2.11: counts depth through an ancestor whose attachment is still pending', () => {
    // A is Free and holds X and Y. A has been dropped on B and the write is in flight, so the board
    // draws B → A → Y. With a cap of 3, Y is one level too deep for X to go under, and A is not.
    const items = [makeItem('b'), makeItem('a'), makeItem('x', { parentId: 'a' }), makeItem('y', { parentId: 'a' })];
    const { states } = pickupSession('x', items, pendingAttach, 3)!.classification;

    expect(states.get('y')).toBe('depth-capped');
    expect(states.get('a')).toBe('valid');
  });

  it('DRAG-2.12, DRAG-2.23: classifies an item a pending attachment puts in the dragged Card as its descendant', () => {
    // F is Free and has been dropped on P, the write in flight: F is drawn as one of P's Stubs, so it
    // can't take P, and as a Stub under the carried item it can't be named either.
    const items = [makeItem('p'), makeItem('f')];
    const placements = new Map<string, Placement>([['f', { parentId: 'p', slot: 'last' }]]);
    const { states, tiers } = pickupSession('p', items, placements)!.classification;

    expect(states.get('f')).toBe('cycle-forming');
    expect(tiers.get('f')).toBe('neither');
  });

  describe('a detach that is still pending, which keeps its parent', () => {
    // P holds C, and C has been pulled out to Free with the write in flight. The board draws C with no
    // parent, but a detach leaves C under P (wiki item-attachment §11), so the tree has it there.
    const detaching = new Map<string, Placement>([['c', { parentId: null, slot: 'last' }]]);

    it('DRAG-2.12, DRAG-2.23: is still a descendant of its parent, and now a Card of its own, so an anchor', () => {
      const items = [makeItem('p'), makeItem('c', { parentId: 'p' })];
      const { states, tiers } = pickupSession('p', items, detaching)!.classification;

      expect(states.get('c')).toBe('cycle-forming');
      expect(tiers.get('c')).toBe('anchor');
    });

    it('DRAG-2.11: still sits one level down, for the depth of what is put under it', () => {
      // Z carries a Stub, so it needs two levels under a target: C at depth 2 leaves it one past the
      // cap of 3, where C as a root would leave it exactly at the cap.
      const items = [makeItem('p'), makeItem('c', { parentId: 'p' }), makeItem('z'), makeItem('zc', { parentId: 'z' })];

      expect(pickupSession('z', items, detaching, 3)!.classification.states.get('c')).toBe('depth-capped');
    });
  });
});

// A pickup reads its branch once, from the tree the board draws, whether the item is a Card or a Stub.
describe('useBoardDnd: the branch a pickup takes with it', () => {
  // P holds X, which holds Y (then Z) and a Free child F. A Free Card W holds the Stub V. A Free Card U
  // has only a Free child G.
  const items = [
    makeItem('p'),
    makeItem('x', { parentId: 'p' }),
    makeItem('y', { parentId: 'x', position: 1 }),
    makeItem('z', { parentId: 'y' }),
    makeItem('f', { parentId: 'x', isAttached: 0 }),
    makeItem('w'),
    makeItem('v', { parentId: 'w' }),
    makeItem('u'),
    makeItem('g', { parentId: 'u', isAttached: 0 }),
  ];
  const pickup = (id: string) =>
    startDrag({ items, getAttachedChildren: parentId => getAttachedChildrenFrom(items, parentId) }, id).result.current
      .session;

  it('DRAG-8.1, DRAG-8.2, DRAG-8.8: holds a Stub’s attached descendants and the two counts, a Free child left out', () => {
    const { branch } = pickup('x')!;

    expect([...branch!.ids].sort()).toEqual(['y', 'z']);
    expect([branch!.children, branch!.descendants]).toEqual([1, 2]);
  });

  it('DRAG-8.1, DRAG-8.2, DRAG-8.8: holds a Free Card’s attached descendants the same way, a Free child and what is under it left out', () => {
    const { branch } = pickup('p')!;

    expect([...branch!.ids].sort()).toEqual(['x', 'y', 'z']);
    expect([branch!.children, branch!.descendants]).toEqual([1, 3]);
    expect(pickup('w')!.branch).toMatchObject({ children: 1, descendants: 1 });
  });

  it('DRAG-8.1, DRAG-8.2, DRAG-8.8: holds none for an item with no attached descendants, a Free child apart', () => {
    expect(pickup('v')!.branch).toBeNull();
    expect(pickup('z')!.branch).toBeNull();
    expect(pickup('u')!.branch).toBeNull();
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
          ...itemRowData('stub', undefined, 'p'),
          sortable: { containerId: 'section', index: rowsOf.indexOf(id), items: rowsOf },
        },
      },
    },
  });

  it('DRAG-4.35: is the row dnd-kit announces over a move event that names the row before it', () => {
    const { result } = startDrag({ items, getAttachedChildren: sectionRows });

    act(() => result.current.handleDragMove(eventOver('a') as unknown as DragMoveEvent));
    expect(result.current.session?.projection?.gap).toBe(0);

    // The pointer stops in B's row: the move that got it there still carries A, and the announcement
    // names B, after which the ghost is the last row.
    act(() => result.current.handleDragOver(eventOver('b') as unknown as DragOverEvent));
    expect(result.current.session?.projection?.gap).toBe(2);
  });
});

// A sample far from the Card the drag names, with every clock at zero: the machine zooms into the
// Card and pops straight back out, which it used to repeat until the stack overflowed. The sample
// settles in the column or sub-row, the drag goes on, and nothing is written.
describe.each([
  { name: 'a merged column', merged: true },
  { name: 'an expanded column’s sub-row', merged: false },
])('useBoardDnd: a zero-delay pop cycle in $name', ({ merged }) => {
  const ZERO_CLOCKS = {
    ...DEFAULT_DRAG_TUNING,
    cardZoomDwellMs: 0,
    cardPopInDelayMs: 0,
    popInDelayMs: 0,
    popDelayMs: 0,
    popDistancePx: 10,
  };
  const listKey = merged ? columnRegionKey('a') : subrowRegionKey('a', 'todo');
  const cardKey = descendantsRegionKey('p');
  const items = [makeItem('x', { position: 1 }), makeItem('p', { position: 2 })];
  const awayFromP = { x: 50, y: 200 };
  const insideP = { x: 50, y: 100 };
  let container: HTMLElement;

  beforeEach(() => {
    vi.mocked(moveItem).mockReset();
    // The list's box, with the Card P in its top, as the board's DOM has them.
    container = document.createElement('div');
    container.append(regionEl(listKey, rect(0, 0, 100, 400), regionEl(cardKey, rect(10, 10, 80, 100))));
    document.body.append(container);
  });
  afterEach(() => container.remove());

  // The drag of X picked up inside the list, far from P, with P named as the ghost's neighbor.
  function dragNamingP() {
    const deps: BoardDndDeps = {
      ...depsWith(async () => {}),
      board: {
        columns: [column('a', ['todo'], { displayMode: merged ? 'merged' : 'expanded' })],
        itemDepthCap: 4,
      } as unknown as BoardWithDetails,
      items,
      tuning: ZERO_CLOCKS,
      rootRef: { current: container },
    };
    const { result } = renderHook(() => useBoardDnd(deps));
    const pickup = {
      active: { id: 'x', data: { current: {} } },
      activatorEvent: { clientX: awayFromP.x, clientY: awayFromP.y },
    } as unknown as DragStartEvent;
    act(() => result.current.handleDragStart(pickup));
    const overP = {
      active: { id: 'x', data: { current: {} }, rect: { current: { translated: { top: 190, height: 26 } } } },
      over: { id: 'p', rect: { top: 10, height: 100 }, data: { current: itemRowData('card') } },
    } as unknown as DragMoveEvent;
    return { result, overP };
  }
  const pointerTo = (point: { x: number; y: number }) =>
    act(() => {
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: point.x, clientY: point.y }));
    });

  it('DRAG-1.37: completes the sample, which settles in the list with the drag still running', () => {
    const { result, overP } = dragNamingP();
    expect(result.current.session?.pop.contextKey).toBe(listKey);

    act(() => result.current.handleDragMove(overP));

    expect(result.current.session?.pop.contextKey).toBe(listKey);
    expect(result.current.session?.pop.hover).toBeNull();
    expect(moveItem).not.toHaveBeenCalled();
  });

  it('DRAG-1.37: a later sample inside P, which is still named, zooms into its Descendants layer', () => {
    const { result, overP } = dragNamingP();
    act(() => result.current.handleDragMove(overP));

    pointerTo(insideP);

    expect(result.current.session?.pop.contextKey).toBe(cardKey);
    expect(moveItem).not.toHaveBeenCalled();
  });
});

describe('useBoardDnd: a column reorder whose save fails', () => {
  beforeEach(() => {
    vi.mocked(moveItem).mockReset();
  });

  it('DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing', async () => {
    const { deps, failSave } = failingColumnSave();
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

  it('DRAG-6.22: reloads the board when no drag is live', async () => {
    const deps = depsWith(async (_activeId, _overId, resync) => {
      await resync();
    });
    const { result } = renderHook(() => useBoardDnd(deps));

    await act(() => result.current.handleDragEnd(columnDrop));

    expect(deps.loadBoard).toHaveBeenCalledOnce();
    expect(result.current.session).toBeNull();
    expect(deps.onDragStopped).not.toHaveBeenCalled();
  });
});

// A reload the hook asks for that ends a live item drag is reported once, so the board can say it
// stopped the drag (wiki board-drag-interaction §10). Nothing else is: not a cancel, not a release
// that writes nothing, not a reload with no drag running.
describe('useBoardDnd: a drag the board stops', () => {
  beforeEach(() => {
    vi.mocked(moveItem).mockReset();
  });

  it('DRAG-6.16: is reported once, with the cause, when a failed write reloads the board mid-drag', async () => {
    const { deps, failSave } = failingColumnSave();
    const { result } = renderHook(() => useBoardDnd(deps));
    let reorder!: Promise<void>;
    act(() => {
      reorder = result.current.handleDragEnd(columnDrop);
    });
    act(() => result.current.handleDragStart(itemPickup));

    await act(async () => {
      failSave();
      await reorder;
    });

    expect(deps.onDragStopped).toHaveBeenCalledExactlyOnceWith({ cause: 'write-failed', itemId: 'x' });
  });

  it('DRAG-6.22: is not reported for Escape or any other cancel', () => {
    const { deps, result } = startDrag();

    act(() => result.current.handleDragCancel());

    expect(result.current.session).toBeNull();
    expect(deps.onDragStopped).not.toHaveBeenCalled();
  });

  it('DRAG-6.22: is not reported for a release that writes nothing', async () => {
    const { deps, result } = startDrag();

    await act(() => result.current.handleDragEnd(itemRelease));

    expect(moveItem).not.toHaveBeenCalled();
    expect(deps.onDragStopped).not.toHaveBeenCalled();
  });

  describe('with a stop armed for the next drag', () => {
    const armedStop = { cause: 'refresh' as const, afterMs: 1500 };
    const advance = (ms: number) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      });

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('DRAG-6.16: is reported with the cause "refresh" when an armed stop fires, once, and spends the arm', () => {
      const { deps, result } = startDrag({ armedStop });

      advance(1499);
      expect(deps.onDragStopped).not.toHaveBeenCalled();
      advance(1);

      expect(deps.onDragStopped).toHaveBeenCalledExactlyOnceWith({ cause: 'refresh', itemId: 'x' });
      expect(deps.disarmStop).toHaveBeenCalledOnce();
      expect(deps.loadBoard).toHaveBeenCalledOnce();
      expect(result.current.session).toBeNull();
    });

    it('DRAG-6.22: is not reported when a drag is cancelled before an armed stop fires', () => {
      const { deps, result } = startDrag({ armedStop });
      act(() => result.current.handleDragCancel());

      advance(5000);

      expect(deps.onDragStopped).not.toHaveBeenCalled();
      expect(deps.disarmStop).not.toHaveBeenCalled();
    });
  });
});

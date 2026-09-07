import { describe, it, expect, vi } from 'vitest';
import type { CollisionDetection } from '@dnd-kit/core';
import type { Item } from '../../types';
import {
  buildColumnForWorkphaseMap,
  resolveDropTarget,
  subrowContainerId,
  boardCollisionDetection,
  resolveDropSide,
  applyItemMove,
  type DropColumn,
  type DropResolution,
} from './boardDndUtils';

// Minimal fixture for boardCollisionDetection's args — every candidate gets
// an identical rect, close enough to the pointer that closestCorners would
// happily pick any of them; the interesting assertion is which ones survive
// the *filter* before closestCorners ever runs, not the geometry itself.
const SAME_RECT = { top: 0, left: 0, right: 10, bottom: 10, width: 10, height: 10 };

function collisionArgs(
  activeId: string,
  activeData: Record<string, unknown>,
  containers: Array<{ id: string; data: Record<string, unknown> }>,
): Parameters<CollisionDetection>[0] {
  return {
    active: { id: activeId, data: { current: activeData }, rect: { current: SAME_RECT } } as never,
    collisionRect: SAME_RECT as never,
    droppableRects: new Map(containers.map(c => [c.id, SAME_RECT])) as never,
    droppableContainers: containers.map(c => ({ id: c.id, data: { current: c.data }, rect: { current: SAME_RECT } })) as never,
    pointerCoordinates: { x: 5, y: 5 },
  };
}

function column(id: string, workphaseIds: string[], overrides: Partial<DropColumn> = {}): DropColumn {
  return {
    id,
    broken: false,
    displayMode: 'merged',
    entryWorkphaseId: workphaseIds[0],
    subRows: workphaseIds.map(w => ({ workphase: { id: w } })),
    ...overrides,
  };
}

// Board fixture: merged col-1 covers [todo, review], expanded col-2 covers
// [dev, qa], broken col-3 covers [old].
const columns = [
  column('col-1', ['todo', 'review']),
  column('col-2', ['dev', 'qa'], { displayMode: 'expanded' }),
  column('col-3', ['old'], { broken: true }),
];
const columnMap = buildColumnForWorkphaseMap(columns);

// workphase lookup shared by both the dragged (active) item and whatever
// card is being hovered over.
const workphases: Record<string, string> = {
  'card-in-review': 'review',
  'card-in-qa': 'qa',
  'card-in-old': 'old',
  'card-unplaced': '',
  'active-in-todo': 'todo',
  'active-in-review': 'review',
  'active-in-dev': 'dev',
  'active-in-qa': 'qa',
  'active-nowhere': 'nowhere', // a real workphase, just not covered by any column here
};
const findWorkphaseForItem = (id: string) => workphases[id] || null;

// Mirrors useBoardDnd's real call: the active item's workphase is resolved
// once (as if from a stable activeItem captured at drag-start), not re-read
// live on every call — see resolveDropTarget's doc comment for why that
// distinction matters.
function resolve(activeId: string, overId: string) {
  return resolveDropTarget(activeId, findWorkphaseForItem(activeId), overId, columns, columnMap, findWorkphaseForItem);
}

describe('subrowContainerId', () => {
  it('encodes column and workphase into the droppable id', () => {
    expect(subrowContainerId('col-2', 'qa')).toBe('subrow::col-2::qa');
  });
});

describe('buildColumnForWorkphaseMap', () => {
  it('maps every covered workphase to its column', () => {
    expect(columnMap.get('todo')?.id).toBe('col-1');
    expect(columnMap.get('review')?.id).toBe('col-1');
    expect(columnMap.get('qa')?.id).toBe('col-2');
    expect(columnMap.has('elsewhere')).toBe(false);
  });
});

describe('boardCollisionDetection', () => {
  it('never collides an item with itself', () => {
    const result = boardCollisionDetection(collisionArgs('card-a', { type: 'card' }, [{ id: 'card-a', data: { type: 'card' } }]));
    expect(result).toHaveLength(0);
  });

  it('excludes attached-child containers from a card drag (the collision-hijack bug this guards against)', () => {
    // Regression: a card being dragged must never resolve onto its own (or
    // any) attached child, even when that child's rect happens to be
    // closest — this is exactly what let a nested "Cascading Kid" row
    // hijack its parent's cross-column drop once attached children became
    // draggable (Epic 3.2 Part 3).
    const result = boardCollisionDetection(
      collisionArgs('card-a', { type: 'card' }, [
        { id: 'child-1', data: { type: 'attached-child', parentId: 'card-a' } },
        { id: 'col-1', data: { type: 'column' } },
      ]),
    );
    expect(result.map(r => r.id)).not.toContain('child-1');
    expect(result.map(r => r.id)).toContain('col-1');
  });

  it('scopes an attached-child drag to siblings under the same parent only', () => {
    const result = boardCollisionDetection(
      collisionArgs('child-a', { type: 'attached-child', parentId: 'parent-1' }, [
        { id: 'child-b', data: { type: 'attached-child', parentId: 'parent-1' } }, // true sibling
        { id: 'child-c', data: { type: 'attached-child', parentId: 'parent-2' } }, // different parent
        { id: 'col-1', data: { type: 'column' } }, // never a valid target for an attached-child drag
      ]),
    );
    expect(result.map(r => r.id)).toEqual(['child-b']);
  });
});

describe('resolveDropTarget', () => {
  it('rejects dropping an item onto itself', () => {
    expect(resolve('active-in-todo', 'active-in-todo')).toBeNull();
  });

  describe('sub-row drops (expanded column)', () => {
    it('is a reorder when the active item is already in that workphase', () => {
      expect(resolve('active-in-qa', subrowContainerId('col-2', 'qa'))).toEqual({
        kind: 'reorder',
        scopeWorkphaseIds: ['qa'],
        anchorId: null,
      });
    });

    it('is a move when the active item is in a different workphase', () => {
      expect(resolve('active-in-dev', subrowContainerId('col-2', 'qa'))).toEqual({
        kind: 'move',
        targetWorkphaseId: 'qa',
        anchorId: null,
      });
    });

    it('rejects a sub-row of a broken column', () => {
      expect(resolve('active-in-todo', subrowContainerId('col-3', 'old'))).toBeNull();
    });
  });

  describe('column body drops', () => {
    it('merged column body: reorder (append) when the active item is already a covered-set member', () => {
      expect(resolve('active-in-review', 'col-1')).toEqual({
        kind: 'reorder',
        scopeWorkphaseIds: ['todo', 'review'],
        anchorId: null,
      });
    });

    it('merged column body: move to entryWorkphaseId when the active item is not a member', () => {
      expect(resolve('active-in-dev', 'col-1')).toEqual({
        kind: 'move',
        targetWorkphaseId: 'todo',
        anchorId: null,
      });
    });

    it('merged column body: move when the active item has no known workphase', () => {
      expect(resolve('card-unplaced', 'col-1')).toEqual({
        kind: 'move',
        targetWorkphaseId: 'todo',
        anchorId: null,
      });
    });

    it("rejects an expanded column's outer wrapper — a specific sub-row is required", () => {
      expect(resolve('active-in-qa', 'col-2')).toBeNull();
    });

    it('rejects a broken column outright', () => {
      expect(resolve('active-in-todo', 'col-3')).toBeNull();
    });
  });

  describe('hovering a specific card', () => {
    it('merged column: reorder across the whole covered set, not just the hovered card\'s own workphase (the pre-Epic-3.2 bug)', () => {
      // active-in-todo hovering card-in-review: different literal workphases,
      // but both are members of col-1's covered set — a same-visual-group
      // reorder, not a workphase change.
      expect(resolve('active-in-todo', 'card-in-review')).toEqual({
        kind: 'reorder',
        scopeWorkphaseIds: ['todo', 'review'],
        anchorId: 'card-in-review',
      });
    });

    it('merged column: move to entryWorkphaseId when the active item is genuinely from outside the covered set', () => {
      expect(resolve('active-in-dev', 'card-in-review')).toEqual({
        kind: 'move',
        targetWorkphaseId: 'todo',
        anchorId: 'card-in-review',
      });
    });

    it('expanded column: reorder when hovering a card in the same workphase', () => {
      expect(resolve('active-in-qa', 'card-in-qa')).toEqual({
        kind: 'reorder',
        scopeWorkphaseIds: ['qa'],
        anchorId: 'card-in-qa',
      });
    });

    it('expanded column: move to the precise hovered workphase otherwise', () => {
      expect(resolve('active-in-dev', 'card-in-qa')).toEqual({
        kind: 'move',
        targetWorkphaseId: 'qa',
        anchorId: 'card-in-qa',
      });
    });

    it('rejects a card whose column is broken, and unresolvable targets', () => {
      expect(resolve('active-in-todo', 'card-in-old')).toBeNull();
      expect(resolve('active-in-todo', 'card-unplaced')).toBeNull();
      expect(resolve('active-in-todo', 'something-unknown')).toBeNull();
    });
  });

  describe('resolveDropSide', () => {
    const card = (top: number, height = 100) => ({ top, height });

    it('defaults to before when the active rect is missing', () => {
      expect(resolveDropSide(null, card(100))).toBe('before');
      expect(resolveDropSide(undefined, card(100))).toBe('before');
    });

    it('defaults to before when the over rect is missing', () => {
      expect(resolveDropSide(card(100), null)).toBe('before');
      expect(resolveDropSide(card(100), undefined)).toBe('before');
    });

    it('resolves before when the dragged card is centered in the target\'s upper region', () => {
      // Target spans 100-200 (center 150); dragged card centered at 115,
      // mirroring the E2E suite's topQuarter (15% down the target).
      expect(resolveDropSide(card(65), card(100))).toBe('before');
    });

    it('resolves after when the dragged card is centered in the target\'s lower region', () => {
      // Dragged card centered at 185, mirroring bottomQuarter (85% down).
      expect(resolveDropSide(card(135), card(100))).toBe('after');
    });

    it('resolves before on an exact center-to-center tie', () => {
      expect(resolveDropSide(card(100), card(100))).toBe('before');
    });

    it('resolves before on a near-tie within the epsilon', () => {
      // Active center at 150.5 vs. target center 150 — 0.5px over, inside
      // the 1px tie band.
      expect(resolveDropSide(card(100.5), card(100))).toBe('before');
    });

    it('resolves after just outside the epsilon', () => {
      // Active center at 152 vs. target center 150 — 2px over, past the
      // 1px tie band.
      expect(resolveDropSide(card(102), card(100))).toBe('after');
    });
  });
});

// TC-2.11: extracted from useBoardDnd's handleDragEnd so the "server
// resolution is authoritative over a stale client guess, resync via
// loadBoard() on failure" contract can be unit tested directly — no
// dnd-kit runtime or rendered component needed, per the same reasoning
// this whole module already exists for (see its header comment).
describe('applyItemMove', () => {
  const moveResolution: DropResolution = { kind: 'move', targetWorkphaseId: 'wp-2', anchorId: 'anchor-1' };
  const reorderResolution: DropResolution = { kind: 'reorder', scopeWorkphaseIds: ['wp-1', 'wp-2'], anchorId: null };

  function fakeItem(id: string): Item {
    return {
      id,
      type: null,
      parentId: null,
      projectId: 'p1',
      workphaseId: 'wp-2',
      title: `Item ${id}`,
      description: null,
      position: 1.5,
      assigneeType: null,
      agentId: null,
      isAttached: 0,
      createdAt: 0,
      updatedAt: 0,
      completedAt: null,
    };
  }

  it('updates items via setItems on a successful move, and never calls loadBoard', async () => {
    const updated = fakeItem('active-1');
    const moveItem = vi.fn(async () => updated);
    const setItems = vi.fn();
    const loadBoard = vi.fn();

    await applyItemMove(moveItem, 'active-1', moveResolution, 'after', setItems, loadBoard);

    expect(moveItem).toHaveBeenCalledWith('active-1', { workphaseId: 'wp-2', anchorId: 'anchor-1', side: 'after' });
    expect(setItems).toHaveBeenCalledTimes(1);
    const updater = setItems.mock.calls[0][0] as (prev: Item[]) => Item[];
    expect(updater([fakeItem('active-1'), fakeItem('other')]).find(i => i.id === 'active-1')).toBe(updated);
    expect(loadBoard).not.toHaveBeenCalled();
  });

  it('sends scopeWorkphaseIds (not workphaseId) for a reorder resolution', async () => {
    const moveItem = vi.fn(async () => fakeItem('active-1'));
    await applyItemMove(moveItem, 'active-1', reorderResolution, 'before', vi.fn(), vi.fn());

    expect(moveItem).toHaveBeenCalledWith('active-1', { scopeWorkphaseIds: ['wp-1', 'wp-2'] });
  });

  it('falls back to loadBoard and never calls setItems when the move is rejected (server authoritative over a stale client guess)', async () => {
    const moveItem = vi.fn(async () => {
      throw new Error('anchorId does not reference an existing item');
    });
    const setItems = vi.fn();
    const loadBoard = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await applyItemMove(moveItem, 'active-1', moveResolution, 'after', setItems, loadBoard);

    expect(setItems).not.toHaveBeenCalled();
    expect(loadBoard).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

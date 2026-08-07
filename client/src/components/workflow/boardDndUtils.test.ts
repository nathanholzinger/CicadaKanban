import { describe, it, expect } from 'vitest';
import type { CollisionDetection } from '@dnd-kit/core';
import { buildColumnForWorkphaseMap, resolveDropTarget, subrowContainerId, boardCollisionDetection, type DropColumn } from './boardDndUtils';

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

// Workphace lookup shared by both the dragged (active) item and whatever
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

// Mirrors useBoardDnd's real call: the active item's workphace is resolved
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
});

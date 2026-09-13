import { describe, it, expect, vi } from 'vitest';
import type { CollisionDetection } from '@dnd-kit/core';
import { makeItem } from '../../test/itemFixture';
import { rect, region } from '../../test/dragFixtures';
import {
  buildColumnForWorkphaseMap,
  resolveDropTarget,
  subrowContainerId,
  createBoardCollisionDetection,
  bandDropResolution,
  pendingPlacementFor,
  resolveDropSide,
  buildMoveInput,
  sendItemMove,
  type CollisionSession,
  type DropColumn,
  type DropResolution,
} from './boardDndUtils';
import type { ItemWriteTracker } from './useItemManagement';

// Minimal fixture for the collision detection's args — by default every
// candidate gets an identical rect, close enough to the pointer that
// closestCorners would happily pick any of them; the interesting assertion
// is which ones survive the *filter* before closestCorners ever runs, not
// the geometry itself. A container may carry its own rect for the
// in-context containment rule.
const SAME_RECT = rect(0, 0, 10, 10);

type Container = { id: string; data: Record<string, unknown>; rect?: ReturnType<typeof rect> };

function collisionArgs(
  activeId: string,
  activeData: Record<string, unknown>,
  containers: Container[],
): Parameters<CollisionDetection>[0] {
  return {
    active: { id: activeId, data: { current: activeData }, rect: { current: SAME_RECT } } as never,
    collisionRect: SAME_RECT as never,
    droppableRects: new Map(containers.map(c => [c.id, c.rect ?? SAME_RECT])) as never,
    droppableContainers: containers.map(c => ({
      id: c.id,
      data: { current: c.data },
      rect: { current: c.rect ?? SAME_RECT },
    })) as never,
    pointerCoordinates: { x: 5, y: 5 },
  };
}

// The Epic 3.2 behavior: no pop machine in play.
const boardCollisionDetection = createBoardCollisionDetection(() => null);

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
    const result = boardCollisionDetection(
      collisionArgs('card-a', { type: 'card' }, [{ id: 'card-a', data: { type: 'card' } }]),
    );
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

  // Epic 3.5 Story 3: `over` follows the pop machine (wiki §2–§3, §5).
  describe('under the pop machine', () => {
    const withSession = (session: CollisionSession | null) => createBoardCollisionDetection(() => session);
    const context = { containerId: 'col-a', rect: rect(0, 0, 100, 400) };
    const containers: Container[] = [
      { id: 'col-a', data: { type: 'column' }, rect: rect(0, 0, 100, 400) },
      { id: 'card-a1', data: { type: 'card' }, rect: rect(5, 10, 90, 50) },
      { id: 'col-b', data: { type: 'column' }, rect: rect(120, 0, 100, 400) },
      { id: 'card-b1', data: { type: 'card' }, rect: rect(125, 10, 90, 50) },
      { id: 'child-1', data: { type: 'attached-child', parentId: 'card-a1' }, rect: rect(10, 30, 80, 20) },
    ];

    it('in-context: only the context container and the cards inside it are candidates', () => {
      const detect = withSession({ hoverContainerId: null, context });
      const ids = detect(collisionArgs('card-x', { type: 'card' }, containers)).map(c => c.id);
      expect(ids).toContain('col-a');
      expect(ids).toContain('card-a1');
      expect(ids).not.toContain('col-b');
      expect(ids).not.toContain('card-b1');
      expect(ids).not.toContain('child-1');
    });

    it("hovering another region: `over` is exactly that region's container, never a card in it", () => {
      const detect = withSession({ hoverContainerId: 'col-b', context });
      expect(detect(collisionArgs('card-x', { type: 'card' }, containers)).map(c => c.id)).toEqual(['col-b']);
    });

    it('no context (picked up in Unsorted) and no hover: nothing to collide with', () => {
      const detect = withSession({ hoverContainerId: null, context: null });
      expect(detect(collisionArgs('card-x', { type: 'card' }, containers))).toHaveLength(0);
    });

    it('the machine only governs card drags — an attached-child drag is scoped to its siblings as before', () => {
      const detect = withSession({ hoverContainerId: 'col-b', context });
      const ids = detect(collisionArgs('child-x', { type: 'attached-child', parentId: 'card-a1' }, containers)).map(
        c => c.id,
      );
      expect(ids).toEqual(['child-1']);
    });
  });
});

// DRAG-3.1–3.3, 3.6, 3.7, 3.9, 3.10 / TC-7.1, 7.2, 7.5, 7.8, 7.16: the
// request a band release turns into.
describe('bandDropResolution', () => {
  const merged = region('column:m', rect(0, 0, 100, 400), {
    coveredWorkphaseIds: ['w2', 'w3'],
    targetWorkphaseId: 'w2',
  });
  const rendered = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const outsider = { id: 'X', workphaseId: 'w1' };
  const member = { id: 'X', workphaseId: 'w3' };

  it('top band → before the first rendered item, plus the entry workphase for an outsider (DRAG-3.1, 3.6)', () => {
    expect(bandDropResolution(merged, 'top', outsider, rendered)).toEqual({
      resolution: { kind: 'move', targetWorkphaseId: 'w2', anchorId: 'A' },
      side: 'before',
    });
  });

  it('bottom band → after the last rendered item (DRAG-3.2)', () => {
    expect(bandDropResolution(merged, 'bottom', outsider, rendered)).toEqual({
      resolution: { kind: 'move', targetWorkphaseId: 'w2', anchorId: 'C' },
      side: 'after',
    });
  });

  it('middle band → workphase-only, no anchor (DRAG-3.3 / TC-7.16)', () => {
    expect(bandDropResolution(merged, 'middle', outsider, rendered)).toEqual({
      resolution: { kind: 'move', targetWorkphaseId: 'w2', anchorId: null },
      side: 'before',
    });
  });

  it('a covered-set member keeps its workphase: the band is a reorder, and the middle band is nothing at all (DRAG-3.7)', () => {
    expect(bandDropResolution(merged, 'top', member, rendered)).toEqual({
      resolution: { kind: 'reorder', scopeWorkphaseIds: ['w2', 'w3'], anchorId: 'A' },
      side: 'before',
    });
    expect(bandDropResolution(merged, 'middle', member, rendered)).toBeNull();
  });

  it('the carried item is skipped when the preview already drew it in the region', () => {
    const withX = [{ id: 'X' }, ...rendered];
    expect(bandDropResolution(merged, 'top', outsider, withX)?.resolution).toMatchObject({ anchorId: 'A' });
  });

  it('empty region: every band is a workphase-only move (DRAG-3.10 / TC-7.5)', () => {
    for (const band of ['top', 'middle', 'bottom'] as const) {
      expect(bandDropResolution(merged, band, outsider, [])?.resolution).toEqual({
        kind: 'move',
        targetWorkphaseId: 'w2',
        anchorId: null,
      });
    }
    expect(bandDropResolution(merged, 'top', member, [])).toBeNull();
  });

  it('done region: no anchor in any band — a workphase-only move (DRAG-3.9 / TC-7.8)', () => {
    const done = region('column:d', rect(0, 0, 100, 400), {
      isTerminal: true,
      coveredWorkphaseIds: ['done'],
      targetWorkphaseId: 'done',
    });
    for (const band of ['top', 'middle', 'bottom'] as const) {
      expect(bandDropResolution(done, band, outsider, [{ id: 'D1' }, { id: 'D2' }])?.resolution).toEqual({
        kind: 'move',
        targetWorkphaseId: 'done',
        anchorId: null,
      });
    }
  });
});

// The pending marker's ordinal claim (§10) mirrors the request exactly.
describe('pendingPlacementFor', () => {
  it('an anchored request pins the item beside its anchor in the target list', () => {
    expect(pendingPlacementFor({ workphaseId: 'w2', anchorId: 'A', side: 'after' }, 'w1')).toEqual({
      workphaseId: 'w2',
      slot: { anchorId: 'A', side: 'after' },
    });
    expect(pendingPlacementFor({ scopeWorkphaseIds: ['w1'], anchorId: 'A', side: 'before' }, 'w1')).toEqual({
      workphaseId: 'w1',
      slot: { anchorId: 'A', side: 'before' },
    });
  });

  it('a bare workphase change keeps its slot; a bare same-group reorder is an append', () => {
    expect(pendingPlacementFor({ workphaseId: 'w2' }, 'w1')).toEqual({ workphaseId: 'w2', slot: 'existing' });
    expect(pendingPlacementFor({ scopeWorkphaseIds: ['w1'] }, 'w1')).toEqual({ workphaseId: 'w1', slot: 'last' });
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
    it("merged column: reorder across the whole covered set, not just the hovered card's own workphase (the pre-Epic-3.2 bug)", () => {
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

    it("resolves before when the dragged card is centered in the target's upper region", () => {
      // Target spans 100-200 (center 150); dragged card centered at 115,
      // mirroring the E2E suite's topQuarter (15% down the target).
      expect(resolveDropSide(card(65), card(100))).toBe('before');
    });

    it("resolves after when the dragged card is centered in the target's lower region", () => {
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

// TC-2.11: the request shape a resolved drop produces, pinned directly.
describe('buildMoveInput', () => {
  it('sends workphaseId plus the anchor for a cross-column move', () => {
    const resolution: DropResolution = { kind: 'move', targetWorkphaseId: 'wp-2', anchorId: 'anchor-1' };
    expect(buildMoveInput(resolution, 'after')).toEqual({ workphaseId: 'wp-2', anchorId: 'anchor-1', side: 'after' });
  });

  it('sends scopeWorkphaseIds (not workphaseId) for a reorder resolution, with no anchor when there is none', () => {
    const resolution: DropResolution = { kind: 'reorder', scopeWorkphaseIds: ['wp-1', 'wp-2'], anchorId: null };
    expect(buildMoveInput(resolution, 'before')).toEqual({ scopeWorkphaseIds: ['wp-1', 'wp-2'] });
  });
});

// TC-2.11: extracted from useBoardDnd's handleDragEnd so the "server
// resolution is authoritative over a stale client guess, resync via
// loadBoard() on failure" contract can be unit tested directly — no
// dnd-kit runtime or rendered component needed, per the same reasoning
// this whole module already exists for (see its header comment).
describe('sendItemMove', () => {
  const input = { workphaseId: 'wp-2', anchorId: 'anchor-1', side: 'after' as const };
  const pending = pendingPlacementFor(input, 'wp-1');
  const fakeItem = (id: string) => makeItem(id, { isAttached: 0, workphaseId: 'wp-2', position: 1.5 });
  const tracker = () => ({
    begin: vi.fn<ItemWriteTracker['begin']>(() => 7),
    complete: vi.fn<ItemWriteTracker['complete']>(() => true),
    fail: vi.fn<ItemWriteTracker['fail']>(),
  });

  it('begins the write with its pending placement, completes it with the response, and never calls loadBoard', async () => {
    const updated = fakeItem('active-1');
    const moveItem = vi.fn(async () => updated);
    const writes = tracker();
    const loadBoard = vi.fn();

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(writes.begin).toHaveBeenCalledWith('active-1', pending);
    expect(moveItem).toHaveBeenCalledWith('active-1', input);
    expect(writes.complete).toHaveBeenCalledWith('active-1', 7, updated);
    expect(writes.fail).not.toHaveBeenCalled();
    expect(loadBoard).not.toHaveBeenCalled();
  });

  it('DRAG-6.6: a rejected move fails the write (the guess is dropped) and resyncs via loadBoard', async () => {
    const moveItem = vi.fn(async () => {
      throw new Error('anchorId does not reference an existing item');
    });
    const writes = tracker();
    const loadBoard = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(writes.complete).not.toHaveBeenCalled();
    expect(writes.fail).toHaveBeenCalledWith('active-1', 7);
    expect(loadBoard).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

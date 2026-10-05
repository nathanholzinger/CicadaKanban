import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import type { DropSide } from '../../lib/hierarchyPlacement';
import type { Project } from '../../types';
import { flattenTree, INDENT_WIDTH } from './projectTreeUtils';
import { useProjectDragReorder, type ReorderProject } from './useProjectDragReorder';

// A tree from `[id, parentId]` pairs, in sibling order, a parent before its
// children.
function tree(...rows: Array<readonly [id: string, parentId: string | null]>): Project[] {
  return rows.map(([id, parentId], i) => ({
    id,
    parentId,
    name: id,
    description: null,
    position: i + 1,
    createdAt: i,
    updatedAt: 0,
  }));
}

const ROW_HEIGHT = 32;
const OVER_TOP = 100;
// How far the carried copy's centre sits from the hovered row's: clear of the
// tie band either way.
const LEAN_PX = 10;

// The sidebar's drag as dnd-kit reports it to the hook: pick a project up,
// hover the carried copy over the top or bottom half of a row with the pointer
// at `depth` (the absolute depth its offset picks), and release. `collapsed`
// names the projects whose children the sidebar doesn't draw.
function sidebarDrag(projects: Project[], collapsed: readonly string[] = []) {
  const onReorderProject = vi.fn<ReorderProject>().mockResolvedValue(undefined);
  const expand = vi.fn<(id: string) => void>();
  const expanded = new Set(projects.map(p => p.id).filter(id => !collapsed.includes(id)));
  const flatItems = flattenTree(projects, expanded);
  const { result } = renderHook(() => useProjectDragReorder(projects, flatItems, onReorderProject, expand));
  let activeId = '';
  let overId = '';

  return {
    onReorderProject,
    expand,
    get hook() {
      return result.current;
    },
    pickUp(id: string) {
      activeId = id;
      act(() => result.current.handleDragStart({ active: { id } } as unknown as DragStartEvent));
    },
    hover(over: string, side: DropSide, depth: number) {
      const seedDepth = flatItems.find(i => i.id === activeId)!.depth;
      const top = side === 'before' ? OVER_TOP - LEAN_PX : OVER_TOP + LEAN_PX;
      overId = over;
      act(() =>
        result.current.handleDragMove({
          delta: { x: (depth - seedDepth) * INDENT_WIDTH, y: 0 },
          over: { id: over, rect: { top: OVER_TOP, height: ROW_HEIGHT } },
          active: { id: activeId, rect: { current: { translated: { top, height: ROW_HEIGHT } } } },
        } as unknown as DragMoveEvent),
      );
    },
    release() {
      act(() => result.current.handleDragEnd({ over: { id: overId } } as unknown as DragEndEvent));
    },
  };
}

// TREE-1's tree: top-level A, B and X, where A has a child A1, and A1 has a
// child A1a. X is the project dragged.
const TREE_1 = tree(['A', null], ['A1', 'A'], ['A1a', 'A1'], ['B', null], ['X', null]);

describe('TREE-1.2: a gap offers the depths from Bottom’s to Top’s + 1, and each places the project differently', () => {
  it.each([
    [3, 'A1a', null, null],
    [2, 'A1', 'A1a', null],
    [1, 'A', 'A1', null],
    [0, null, 'A', null],
  ] as const)('between A1a and B, depth %i saves X under %s after %s', (depth, parentId, prevId, nextId) => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 'before', depth);
    expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'before' });
    expect(drag.hook.projectedDepth).toBe(depth);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', parentId, prevId, nextId);
  });

  it('none is shallower than B’s depth or deeper than A1a’s + 1', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 'before', -4);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.hover('B', 'before', 9);
    expect(drag.hook.projectedDepth).toBe(3);
  });

  it('the gap between A1 and A1a offers exactly one depth: A1’s first child, before A1a', () => {
    for (const depth of [-3, 0, 1, 2, 6]) {
      const drag = sidebarDrag(TREE_1);
      drag.pickUp('X');
      drag.hover('A1a', 'before', depth);
      expect(drag.hook.projectedDepth).toBe(2);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'A1', null, 'A1a');
    }
  });
});

// A, whose only child is the dragged X, and B, whose only child B1 is the last
// row. X sits at depth 1.
const TREE_3 = tree(['A', null], ['X', 'A'], ['B', null], ['B1', 'B']);

describe('TREE-1.3: the boundaries', () => {
  it('above the first row, one depth is offered, the top level, and X becomes the first top-level project', () => {
    for (const depth of [-2, 1, 5]) {
      const drag = sidebarDrag(TREE_3);
      drag.pickUp('X');
      drag.hover('A', 'before', depth);
      expect(drag.hook.projectedDepth).toBe(0);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, null, 'A');
    }
  });

  it('below the last row, depths 0 to 2 are offered: after B, B’s child after B1, B1’s first child', () => {
    for (const [depth, parentId, prevId] of [
      [0, null, 'B'],
      [1, 'B', 'B1'],
      [2, 'B1', null],
    ] as const) {
      const drag = sidebarDrag(TREE_3);
      drag.pickUp('X');
      drag.hover('B1', 'after', depth);
      expect(drag.hook.projectedDepth).toBe(depth);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', parentId, prevId, null);
    }
  });

  it('an offset past either end clamps to the nearest depth, and the top level is the floor', () => {
    const drag = sidebarDrag(TREE_3);
    drag.pickUp('X');
    drag.hover('B1', 'after', 9);
    expect(drag.hook.projectedDepth).toBe(2);
    drag.hover('B1', 'after', -9);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'B', null);
  });
});

describe('TREE-1.4: when the dragged project’s subtree holds every project, one depth is offered, the top level', () => {
  it.each(['before', 'after'] as const)('hovering a row of X’s subtree, %s, at any offset', side => {
    const drag = sidebarDrag(tree(['X', null], ['X1', 'X'], ['X2', 'X']));
    drag.pickUp('X');
    for (const over of ['X', 'X1', 'X2']) {
      for (const depth of [-3, 0, 4]) {
        drag.hover(over, side, depth);
        expect(drag.hook.projectedDepth).toBe(0);
      }
    }
  });

  it('draws no line, since no row is left to draw it against', () => {
    const drag = sidebarDrag(tree(['X', null], ['X1', 'X'], ['X2', 'X']));
    drag.pickUp('X');
    for (const over of ['X', 'X1', 'X2']) {
      drag.hover(over, 'after', 0);
      expect(drag.hook.dropLine).toBeNull();
    }
  });
});

describe('TREE-1.5: a collapsed project hides its subtree from view, not from placement', () => {
  // T is collapsed: its children T1 and T2 aren't drawn.
  const projects = tree(['T', null], ['T1', 'T'], ['T2', 'T'], ['U', null], ['X', null]);

  it('tabbed once right of T, X goes ahead of T’s first child, which isn’t shown', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    drag.hover('U', 'before', 1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'T', null, 'T1');
  });

  it('aligned with T, X goes after T’s whole subtree, before U', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    drag.hover('U', 'before', 0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'T', null);
  });
});

describe('TREE-1.6: resting on a row of the dragged project’s own subtree means its own gap', () => {
  const projects = tree(['A', null], ['X', null], ['X1', 'X'], ['X2', 'X'], ['B', null]);

  it.each(['X1', 'X2'])('resting on %s, the line is in X’s own gap, between A and B, offering two depths', over => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    for (const side of ['before', 'after'] as const) {
      drag.hover(over, side, 0);
      expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'before' });
      expect(drag.hook.projectedDepth).toBe(0);
      drag.hover(over, side, 5);
      expect(drag.hook.projectedDepth).toBe(1);
    }
  });

  it('released there as A’s first child, X is saved there', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    drag.hover('X1', 'after', 1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'A', null, null);
  });

  it('no depth in any gap makes X a child of X1 or X2', () => {
    const drag = sidebarDrag(projects);
    for (const over of ['A', 'X', 'X1', 'X2', 'B']) {
      for (const side of ['before', 'after'] as const) {
        for (const depth of [-3, 0, 1, 2, 6]) {
          drag.pickUp('X');
          drag.hover(over, side, depth);
          drag.release();
        }
      }
    }
    const writes = drag.onReorderProject.mock.calls;
    expect(writes.length).toBeGreaterThan(0);
    for (const [, parentId, prevId, nextId] of writes) {
      expect([parentId, prevId, nextId]).not.toContain('X1');
      expect([parentId, prevId, nextId]).not.toContain('X2');
    }
  });
});

describe('TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing', () => {
  it('sends nothing when the cursor leaves X’s row and comes back to its own gap', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 'before', 0);
    drag.hover('B', 'after', 0);
    expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'after' });
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
    expect(drag.expand).not.toHaveBeenCalled();
  });

  it('sends nothing when X is released before the cursor has left its row', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('X', 'before', 0);
    expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'after' });
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('a nested project’s own gap is the same one from either neighbor', () => {
    // X is A's last child, after A1: the gap between A1 and B, at depth 1.
    const projects = tree(['A', null], ['A1', 'A'], ['X', 'A'], ['B', null]);
    for (const [over, side] of [
      ['A1', 'after'],
      ['B', 'before'],
    ] as const) {
      const drag = sidebarDrag(projects);
      drag.pickUp('X');
      drag.hover(over, side, 1);
      drag.release();
      expect(drag.onReorderProject).not.toHaveBeenCalled();
    }
  });

  it('a project with children, resting on one of them, is set down in its own gap too', () => {
    const drag = sidebarDrag(tree(['A', null], ['X', null], ['X1', 'X'], ['B', null]));
    drag.pickUp('X');
    drag.hover('X1', 'after', 0);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('still writes at another depth in its own gap, or at its own depth in another gap', () => {
    const own = sidebarDrag(TREE_1);
    own.pickUp('X');
    own.hover('B', 'after', 1);
    own.release();
    expect(own.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', null, null);

    const elsewhere = sidebarDrag(TREE_1);
    elsewhere.pickUp('X');
    elsewhere.hover('B', 'before', 0);
    elsewhere.release();
    expect(elsewhere.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'A', null);
  });
});

describe('TREE-1.9: coming back to the dragged project’s own row means its own gap', () => {
  it.each(['before', 'after'] as const)(
    'the cursor leaves for the gap above B and comes back to the %s half of X’s row: the line is in X’s own gap, and a release sends nothing',
    side => {
      const drag = sidebarDrag(TREE_1);
      drag.pickUp('X');
      drag.hover('B', 'before', 0);
      expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'before' });
      drag.hover('X', side, 0);
      expect(drag.hook.dropLine).toEqual({ anchorId: 'B', side: 'after' });
      drag.release();
      expect(drag.onReorderProject).not.toHaveBeenCalled();
    },
  );

  it('resting on X’s own row, an offset still picks a depth of that gap: tabbed right, X is B’s first child', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('X', 'after', 0);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.hover('X', 'after', 1);
    expect(drag.hook.projectedDepth).toBe(1);
    drag.hover('X', 'after', 6);
    expect(drag.hook.projectedDepth).toBe(1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', null, null);
  });
});

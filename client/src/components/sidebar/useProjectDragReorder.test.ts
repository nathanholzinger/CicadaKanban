import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import type { Project } from '../../types';
import { makeProject } from '../../test/projectFixture';
import { DEFAULT_DRAG_TUNING, saveDragTuning } from '../workflow/dragTuning';
import { tierVars } from '../dragChrome';
import { flattenTree, INDENT_WIDTH } from './projectTreeUtils';
import { useProjectDragReorder, type ReorderProject } from './useProjectDragReorder';

// A tree from `[id, parentId]` pairs, in sibling order, a parent before its
// children.
function tree(...rows: Array<readonly [id: string, parentId: string | null]>): Project[] {
  return rows.map(([id, parentId], i) => makeProject(id, { parentId, position: i + 1, createdAt: i }));
}

// The sidebar's drag as dnd-kit reports it to the hook: pick a project up, rest the carried copy
// nearest a row, which is the row whose slot the ghost takes, with the pointer at `depth` (the
// absolute depth its offset picks), and release. `collapsed` names the projects whose children
// the sidebar doesn't draw.
function sidebarDrag(projects: Project[], collapsed: readonly string[] = [], depthCap: number | null = null) {
  const onReorderProject = vi.fn<ReorderProject>().mockResolvedValue(undefined);
  const expand = vi.fn<(id: string) => void>();
  const expanded = new Set(projects.map(p => p.id).filter(id => !collapsed.includes(id)));
  const flatItems = flattenTree(projects, expanded);
  const { result } = renderHook(() => useProjectDragReorder(projects, flatItems, onReorderProject, expand, depthCap));
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
    hover(over: string, depth: number) {
      const seedDepth = flatItems.find(i => i.id === activeId)!.depth;
      overId = over;
      act(() =>
        result.current.handleDragMove({
          delta: { x: (depth - seedDepth) * INDENT_WIDTH, y: 0 },
          over: { id: over },
        } as unknown as DragMoveEvent),
      );
    },
    // The two rows the ghost sits between, among the rows without the dragged project; null at either end of the list.
    slot() {
      const rows = result.current.drawnItems.filter(i => i.id !== activeId).map(i => i.id);
      const { gap } = result.current;
      return gap === null ? null : [rows[gap - 1] ?? null, rows[gap] ?? null];
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
    drag.hover('B', depth);
    expect(drag.slot()).toEqual(['A1a', 'B']);
    expect(drag.hook.projectedDepth).toBe(depth);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', parentId, prevId, nextId);
  });

  it('none is shallower than B’s depth or deeper than A1a’s + 1', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', -4);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.hover('B', 9);
    expect(drag.hook.projectedDepth).toBe(3);
  });

  it('the gap between A1 and A1a offers exactly one depth: A1’s first child, before A1a', () => {
    for (const depth of [-3, 0, 1, 2, 6]) {
      const drag = sidebarDrag(TREE_1);
      drag.pickUp('X');
      drag.hover('A1a', depth);
      expect(drag.hook.projectedDepth).toBe(2);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'A1', null, 'A1a');
    }
  });
});

// The boundaries' tree: A, whose only child is the dragged X, and B, whose only child
// B1 is the last row. X sits at depth 1.
const BOUNDARY_TREE = tree(['A', null], ['X', 'A'], ['B', null], ['B1', 'B']);

describe('TREE-1.3: the boundaries', () => {
  it('above the first row, one depth is offered, the top level, and X becomes the first top-level project', () => {
    for (const depth of [-2, 1, 5]) {
      const drag = sidebarDrag(BOUNDARY_TREE);
      drag.pickUp('X');
      drag.hover('A', depth);
      expect(drag.slot()).toEqual([null, 'A']);
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
      const drag = sidebarDrag(BOUNDARY_TREE);
      drag.pickUp('X');
      drag.hover('B1', depth);
      expect(drag.slot()).toEqual(['B1', null]);
      expect(drag.hook.projectedDepth).toBe(depth);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', parentId, prevId, null);
    }
  });

  it('an offset past either end clamps to the nearest depth, and the top level is the floor', () => {
    const drag = sidebarDrag(BOUNDARY_TREE);
    drag.pickUp('X');
    drag.hover('B1', 9);
    expect(drag.hook.projectedDepth).toBe(2);
    drag.hover('B1', -9);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'B', null);
  });
});

describe('TREE-1.4: when the dragged project’s subtree holds every project, one depth is offered, the top level', () => {
  // Every project is X's, and its children are not drawn while it is carried: its own row is the only one.
  const everyProject = () => tree(['X', null], ['X1', 'X'], ['X2', 'X']);

  it('resting on its own row, at any offset, offers the top level', () => {
    const drag = sidebarDrag(everyProject());
    drag.pickUp('X');
    expect(drag.hook.drawnItems.map(i => i.id)).toEqual(['X']);
    for (const depth of [-3, 0, 4]) {
      drag.hover('X', depth);
      expect(drag.hook.projectedDepth).toBe(0);
    }
  });

  it('draws no line, since no row is left to place against, and a release sends nothing', () => {
    const drag = sidebarDrag(everyProject());
    drag.pickUp('X');
    drag.hover('X', 0);
    expect(drag.hook.ghost).toEqual({ depth: 0, line: false, invalid: false });
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
    expect(drag.expand).not.toHaveBeenCalled();
  });
});

describe('TREE-1.5: a collapsed project hides its subtree from view, not from placement', () => {
  // T is collapsed: its children T1 and T2 aren't drawn.
  const projects = tree(['T', null], ['T1', 'T'], ['T2', 'T'], ['U', null], ['X', null]);

  it('tabbed once right of T, X goes ahead of T’s first child, which isn’t shown', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    drag.hover('U', 1);
    expect(drag.slot()).toEqual(['T', 'U']);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'T', null, 'T1');
  });

  it('aligned with T, X goes after T’s whole subtree, before U', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    drag.hover('U', 0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'T', null);
  });

  it('counts T once in the list the gap is read from, and T’s children not at all', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['T', 'U', 'X']);
    drag.hover('X', 0);
    expect(drag.hook.gap).toBe(2);
    expect(drag.slot()).toEqual(['U', null]);
  });
});

describe('TREE-1.6: the dragged project’s own subtree is never a place to drop', () => {
  const projects = tree(['A', null], ['X', null], ['X1', 'X'], ['X2', 'X'], ['B', null]);

  it('has no row of its own in the list: only X’s own row stands for it, in X’s own gap, between A and B', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['A', 'X', 'B']);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['A', 'B']);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.hover('X', 5);
    expect(drag.hook.projectedDepth).toBe(1);
  });

  it('released there as A’s first child, X is saved there', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    drag.hover('X', 1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'A', null, null);
  });

  it('no depth in any gap makes X a child of X1 or X2', () => {
    const drag = sidebarDrag(projects);
    for (const over of ['A', 'X', 'B']) {
      for (const depth of [-3, 0, 1, 2, 6]) {
        drag.pickUp('X');
        drag.hover(over, depth);
        drag.release();
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
    drag.hover('B', 0);
    expect(drag.slot()).toEqual(['A1a', 'B']);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['B', null]);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
    expect(drag.expand).not.toHaveBeenCalled();
  });

  it('sends nothing when X is released before the cursor has left its row', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['B', null]);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('a nested project’s own gap is its own row’s, and a neighbor’s row is the neighbor’s gap', () => {
    // X is A's last child, after A1: the gap between A1 and B, at depth 1.
    const projects = tree(['A', null], ['A1', 'A'], ['X', 'A'], ['B', null]);
    const own = sidebarDrag(projects);
    own.pickUp('X');
    own.hover('X', 1);
    expect(own.slot()).toEqual(['A1', 'B']);
    own.release();
    expect(own.onReorderProject).not.toHaveBeenCalled();

    // Nearest B, the ghost is after B, not in its own gap: the same depth is a write there.
    const next = sidebarDrag(projects);
    next.pickUp('X');
    next.hover('B', 1);
    expect(next.slot()).toEqual(['B', null]);
    next.release();
    expect(next.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', null, null);
  });

  it('a project with children, resting on its own row, is set down in its own gap too', () => {
    const drag = sidebarDrag(tree(['A', null], ['X', null], ['X1', 'X'], ['B', null]));
    drag.pickUp('X');
    drag.hover('X', 0);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('still writes at another depth in its own gap, or at its own depth in another gap', () => {
    const own = sidebarDrag(TREE_1);
    own.pickUp('X');
    own.hover('X', 1);
    own.release();
    expect(own.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', null, null);

    const elsewhere = sidebarDrag(TREE_1);
    elsewhere.pickUp('X');
    elsewhere.hover('B', 0);
    elsewhere.release();
    expect(elsewhere.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', null, 'A', null);
  });
});

describe('TREE-1.9: coming back to the dragged project’s own row means its own gap', () => {
  it('the cursor leaves for the gap above B and comes back to X’s row: the ghost is in X’s own gap, and a release sends nothing', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 0);
    expect(drag.slot()).toEqual(['A1a', 'B']);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['B', null]);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });
});

describe('TREE-1.10: on the dragged project’s own row, the cursor picks among its own gap’s depths', () => {
  it('resting on X’s own row, an offset still picks a depth of that gap: tabbed right, X is B’s first child', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('X', 0);
    expect(drag.hook.projectedDepth).toBe(0);
    drag.hover('X', 1);
    // Still X's own gap, below B, one level in.
    expect(drag.slot()).toEqual(['B', null]);
    expect(drag.hook.projectedDepth).toBe(1);
    drag.hover('X', 6);
    expect(drag.hook.projectedDepth).toBe(1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', null, null);
  });
});

// A chain P1 to P3, each the only child of the one before, and X, with a child X1.
const capChain = tree(['P1', null], ['P2', 'P1'], ['P3', 'P2'], ['X', null], ['X1', 'X']);

describe('TREE-1.11: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing', () => {
  it('marks a tab state that puts the subtree past the cap invalid, and a release in it sends nothing', () => {
    // Cap 4: X under P3 is at depth 4, and X1 at 5.
    const drag = sidebarDrag(capChain, [], 4);
    drag.pickUp('X');
    drag.hover('X', 3);
    expect(drag.slot()).toEqual(['P3', null]);
    expect(drag.hook.projectedDepth).toBe(3);
    expect(drag.hook.dropInvalid).toBe(true);
    expect(drag.hook.ghost).toEqual({ depth: 3, line: true, invalid: true });
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
    expect(drag.expand).not.toHaveBeenCalled();
  });

  it('leaves a tab state that fits the cap valid, and a release in it writes', () => {
    // X aligned with P3 is P2's child, at depth 3, and X1 at 4.
    const drag = sidebarDrag(capChain, [], 4);
    drag.pickUp('X');
    drag.hover('X', 2);
    expect(drag.hook.dropInvalid).toBe(false);
    expect(drag.hook.ghost?.invalid).toBe(false);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'P2', 'P3', null);
  });
});

// The ghost is the dragged project's own row: it is one of the rows the sortable context holds, and it
// moves to the gap, which is the slot of the row the copy is nearest.
describe('the ghost', () => {
  // A, B, C and X at the top level, X last.
  const flat = tree(['A', null], ['B', null], ['C', null], ['X', null]);

  it('is none outside a drag, and the dragged project’s own row from the pickup to the drag’s end', () => {
    const drag = sidebarDrag(flat);
    expect(drag.hook.ghost).toBeNull();
    drag.pickUp('X');
    expect(drag.hook.ghost).not.toBeNull();
    drag.release();
    expect(drag.hook.ghost).toBeNull();

    drag.pickUp('X');
    act(() => drag.hook.handleDragCancel());
    expect(drag.hook.ghost).toBeNull();
  });

  it('is among the sortable context’s rows, which are the rows drawn, in order', () => {
    const drag = sidebarDrag(flat);
    expect(drag.hook.rowIds).toEqual(['A', 'B', 'C', 'X']);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['A', 'B', 'C', 'X']);
  });

  it('is drawn at its own depth, and has no gap or line, until the first move', () => {
    const drag = sidebarDrag(tree(['A', null], ['X', 'A']));
    drag.pickUp('X');
    expect(drag.hook.ghost).toEqual({ depth: 1, line: false, invalid: false });
    expect(drag.hook.gap).toBeNull();
    expect(drag.slot()).toBeNull();
  });

  it('takes the slot of the row the copy is nearest: after a row below its own slot, before one above it', () => {
    const drag = sidebarDrag(flat);
    drag.pickUp('B');
    drag.hover('C', 0);
    expect(drag.slot()).toEqual(['C', 'X']);
    drag.hover('A', 0);
    expect(drag.slot()).toEqual([null, 'A']);
    drag.hover('B', 0);
    expect(drag.slot()).toEqual(['A', 'C']);
  });

  it('offers every gap, the list’s first and last included, and the line is on the ghost in each', () => {
    const drag = sidebarDrag(flat);
    drag.pickUp('B');
    const slots = ['A', 'B', 'C', 'X'].map(over => {
      drag.hover(over, 0);
      expect(drag.hook.ghost?.line).toBe(true);
      return drag.slot();
    });
    expect(slots).toEqual([
      [null, 'A'],
      ['A', 'C'],
      ['C', 'X'],
      ['X', null],
    ]);
  });

  it('is drawn at the projection’s depth, and its line with it', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 2);
    expect(drag.hook.ghost).toEqual({ depth: 2, line: true, invalid: false });
    drag.hover('B', 0);
    expect(drag.hook.ghost).toEqual({ depth: 0, line: true, invalid: false });
  });

  it('keeps one gap under a still cursor, and the same row is the same gap however often it is hovered', () => {
    const drag = sidebarDrag(flat);
    drag.pickUp('X');
    drag.hover('B', 0);
    const gap = drag.hook.gap;
    for (const over of ['B', 'B', 'X', 'B', 'C', 'B']) {
      drag.hover(over, 0);
      if (over === 'B') expect(drag.hook.gap).toBe(gap);
    }
  });

  it('draws no line, and holds no gap, when nothing is over any row', () => {
    const drag = sidebarDrag(flat);
    drag.pickUp('X');
    drag.hover('B', 0);
    expect(drag.hook.ghost?.line).toBe(true);
    act(() => drag.hook.handleDragMove({ delta: { x: 0, y: 0 }, over: null } as unknown as DragMoveEvent));
    expect(drag.hook.gap).toBeNull();
    expect(drag.hook.ghost).toEqual({ depth: 0, line: false, invalid: false });
  });

  it('counts a collapsed project once, and the carried project’s branch not at all, past both', () => {
    // T is collapsed, so T1 isn't drawn, and X carries X1, which isn't either.
    const projects = tree(['T', null], ['T1', 'T'], ['U', null], ['X', null], ['X1', 'X'], ['Y', null]);
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['T', 'U', 'X', 'Y']);
    drag.hover('Y', 0);
    expect(drag.slot()).toEqual(['Y', null]);
    drag.hover('U', 0);
    expect(drag.slot()).toEqual(['T', 'U']);
  });
});

// What the pickup takes with it: the carried project's descendants leave the rows the sidebar
// draws, and its copy says their counts. Where the project can be dropped is the tests above's: the
// branch leaves the drawing, not the walk.
describe('the carried project’s branch', () => {
  // X carries X1, which carries X1a, and X2. Y has no children.
  const projects = tree(['A', null], ['X', null], ['X1', 'X'], ['X1a', 'X1'], ['X2', 'X'], ['Y', null]);
  const expandedAll = (list: Project[]) => new Set(list.map(p => p.id));
  const idsOf = (rows: readonly { id: string }[]) => rows.map(r => r.id);

  it('is none before a pickup, with every row drawn', () => {
    const drag = sidebarDrag(projects);
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'X2', 'Y']);
  });

  it('holds every descendant at pickup, with its children and the whole branch counted', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    const { branch } = drag.hook;
    expect(branch?.ids).toEqual(new Set(['X1', 'X1a', 'X2']));
    expect([branch?.children, branch?.descendants]).toEqual([2, 3]);
  });

  it('leaves the branch out of the rows to draw, and keeps the project’s own row', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('X');
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
    expect(drag.hook.rowIds).toEqual(['A', 'X', 'Y']);
    expect(drag.hook.activeItem?.id).toBe('X');
  });

  it('counts the rows under a collapsed descendant, which were not drawn to begin with', () => {
    const drag = sidebarDrag(projects, ['X1']);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X2', 'Y']);
    drag.pickUp('X');
    expect(drag.hook.branch?.ids).toEqual(new Set(['X1', 'X1a', 'X2']));
    expect([drag.hook.branch?.children, drag.hook.branch?.descendants]).toEqual([2, 3]);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
  });

  it('counts the whole branch of a collapsed project, though none of it was drawn', () => {
    const drag = sidebarDrag(projects, ['X']);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
    drag.pickUp('X');
    expect([drag.hook.branch?.children, drag.hook.branch?.descendants]).toEqual([2, 3]);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
  });

  it('is none for a project with no children, and every row stays drawn', () => {
    const drag = sidebarDrag(projects);
    drag.pickUp('Y');
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'X2', 'Y']);
  });

  it('is drawn again on a release, a release that writes nothing, and a cancel', () => {
    const drag = sidebarDrag(projects);

    drag.pickUp('X');
    drag.hover('Y', 0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledTimes(1);
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'X2', 'Y']);

    drag.pickUp('X');
    drag.hover('A', 0);
    drag.hover('X', 0);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledTimes(1);
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'X2', 'Y']);

    drag.pickUp('X');
    expect(drag.hook.branch).not.toBeNull();
    act(() => drag.hook.handleDragCancel());
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'X2', 'Y']);
  });

  it('is drawn again on a release past the cap, which writes nothing', () => {
    // Cap 4: X under P3 is at depth 4, and X1 at 5.
    const drag = sidebarDrag(tree(['P1', null], ['P2', 'P1'], ['P3', 'P2'], ['X', null], ['X1', 'X']), [], 4);
    drag.pickUp('X');
    drag.hover('X', 3);
    expect(drag.hook.dropInvalid).toBe(true);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['P1', 'P2', 'P3', 'X']);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
    expect(drag.hook.branch).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['P1', 'P2', 'P3', 'X', 'X1']);
  });

  describe('when a response lands mid-drag', () => {
    function pickUpThenRespond(next: (list: Project[]) => Project[]) {
      const hook = renderHook(
        ({ list }) => useProjectDragReorder(list, flattenTree(list, expandedAll(list)), vi.fn(), vi.fn(), 4),
        { initialProps: { list: projects } },
      );
      act(() => hook.result.current.handleDragStart({ active: { id: 'X' } } as unknown as DragStartEvent));
      const held = hook.result.current.branch;
      hook.rerender({ list: next(projects) });
      return { ...hook, held };
    }

    it('holds the branch it began with: a descendant it moves out stays in the branch, and hidden', () => {
      const { result, held } = pickUpThenRespond(list => list.map(p => (p.id === 'X2' ? { ...p, parentId: null } : p)));

      expect(result.current.branch).toBe(held);
      expect(result.current.branch?.ids.has('X2')).toBe(true);
      expect(idsOf(result.current.drawnItems)).toEqual(['A', 'X', 'Y']);
    });

    it('does not take in a project it moves under the carried one: it is drawn where the tree puts it', () => {
      const { result, held } = pickUpThenRespond(list => [
        ...list,
        makeProject('Late', { parentId: 'X', position: 99, createdAt: 99 }),
      ]);

      expect(result.current.branch).toBe(held);
      expect(result.current.branch?.ids.has('Late')).toBe(false);
      expect(idsOf(result.current.drawnItems)).toEqual(['A', 'X', 'Late', 'Y']);
    });
  });
});

// Every row is drawn by what it can be to the dragged project, on the board's rule
// (`lib/dragTargets.ts`), at strengths of the sidebar's own.
describe('the tier each row is drawn at', () => {
  afterEach(() => localStorage.clear());

  // X carries X1, which carries X1a. The chain P1 to P4 is the target the cap cuts: at cap 5,
  // with X's subtree two levels tall, P2 is the last legal parent.
  const projects = tree(
    ['P1', null],
    ['P2', 'P1'],
    ['P3', 'P2'],
    ['P4', 'P3'],
    ['X', null],
    ['X1', 'X'],
    ['X1a', 'X1'],
  );

  it('TREE-2.1: has none before a pickup, and none once the drag is released or cancelled', () => {
    const drag = sidebarDrag(projects, [], 12);
    expect(drag.hook.tiers.size).toBe(0);
    expect(drag.hook.tierVars).toBeUndefined();
    drag.pickUp('X');
    expect(drag.hook.tiers.size).toBeGreaterThan(0);
    drag.release();
    expect(drag.hook.tiers.size).toBe(0);
    expect(drag.hook.tierVars).toBeUndefined();

    drag.pickUp('X');
    act(() => drag.hook.handleDragCancel());
    expect(drag.hook.tiers.size).toBe(0);
    expect(drag.hook.tierVars).toBeUndefined();
  });

  it('TREE-2.1: is "neither" for the dragged project’s descendants at every depth, and none for its own row, on a shallow tree', () => {
    const drag = sidebarDrag(projects, [], 12);
    drag.pickUp('X');
    const { tiers } = drag.hook;
    expect(tiers.has('X')).toBe(false);
    expect(tiers.get('X1')).toBe('neither');
    expect(tiers.get('X1a')).toBe('neither');
    for (const id of ['P1', 'P2', 'P3', 'P4']) expect(tiers.get(id), id).toBe('parent');
  });

  it('TREE-2.4: is "anchor" for a row past the cap whose own parent can take the project, and "neither" below it', () => {
    const drag = sidebarDrag(projects, [], 5);
    drag.pickUp('X');
    const { tiers } = drag.hook;
    expect(tiers.get('P1')).toBe('parent');
    expect(tiers.get('P2')).toBe('parent');
    expect(tiers.get('P3')).toBe('anchor');
    expect(tiers.get('P4')).toBe('neither');
    expect(tiers.get('X1')).toBe('neither');
  });

  it('marks nothing past the cap while the cap is unknown: the descendants "neither", every other row a "parent"', () => {
    const drag = sidebarDrag(projects, [], null);
    drag.pickUp('X');
    const { tiers } = drag.hook;
    expect(tiers.get('X1')).toBe('neither');
    expect(tiers.get('X1a')).toBe('neither');
    for (const id of ['P1', 'P2', 'P3', 'P4']) expect(tiers.get(id), id).toBe('parent');
  });

  it('counts a row a collapsed project hides, as the board counts a row the section does not draw', () => {
    // P2 is collapsed, so P3 and P4 aren't drawn, but they are projects and have a tier.
    const drag = sidebarDrag(projects, ['P2'], 5);
    drag.pickUp('X');
    expect(drag.hook.tiers.get('P3')).toBe('anchor');
    expect(drag.hook.tiers.get('P4')).toBe('neither');
  });

  it('TREE-2.6: holds for the whole drag: a response that lands mid-drag redraws nothing', () => {
    const onReorderProject = vi.fn<ReorderProject>().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ list }) =>
        useProjectDragReorder(list, flattenTree(list, new Set(list.map(p => p.id))), onReorderProject, vi.fn(), 5),
      { initialProps: { list: projects } },
    );
    act(() => result.current.handleDragStart({ active: { id: 'X' } } as unknown as DragStartEvent));
    const { tiers, tierVars } = result.current;

    // A project lands under X: it joins X's subtree, and is under no tier the drag began with.
    rerender({ list: [...projects, makeProject('Late', { parentId: 'X' })] });
    expect(result.current.tiers).toBe(tiers);
    expect(result.current.tierVars).toBe(tierVars);
    expect(result.current.tiers.has('Late')).toBe(false);
  });

  // The three strengths go in as the properties the board's classes read, by `tierVars`, which is
  // the one place that spells their names.
  // The carried project's subtree — which rows are its descendants, which are left out of placement,
  // and the height the cap reads — is the one the drag began with, as the tiers are.
  it('TREE-1.14, TREE-1.15: holds the carried branch, and the height the cap reads, for the whole drag', () => {
    const list = tree(['P1', null], ['P2', 'P1'], ['X', null], ['X1', 'X']);
    const { result, rerender } = renderHook(
      ({ current }) =>
        useProjectDragReorder(current, flattenTree(current, new Set(current.map(p => p.id))), vi.fn(), vi.fn(), 4),
      { initialProps: { current: list } },
    );
    act(() => result.current.handleDragStart({ active: { id: 'X' } } as unknown as DragStartEvent));
    const { branch } = result.current;
    expect(branch?.ids).toEqual(new Set(['X1']));
    // X's subtree is one level tall, so as P2's child (depth 2) it fits the cap of 4.
    act(() =>
      result.current.handleDragMove({
        delta: { x: 2 * INDENT_WIDTH, y: 0 },
        over: { id: 'X' },
      } as unknown as DragMoveEvent),
    );
    expect(result.current.projectedDepth).toBe(2);
    expect(result.current.dropInvalid).toBe(false);

    // A project lands under X1: X's subtree is a level taller now, but the drag is still the one
    // that began with a subtree of one level.
    rerender({ current: [...list, makeProject('X1a', { parentId: 'X1' })] });
    expect(result.current.branch).toBe(branch);
    expect(result.current.branch?.ids.has('X1a')).toBe(false);
    expect(result.current.dropInvalid).toBe(false);
  });

  describe('TREE-2.8: the strengths', () => {
    const OWN = {
      projectAnchorOpacity: 0.45,
      projectNeitherOpacity: 0.15,
      projectDraggedOpacity: 0.2,
    };
    const asVars = (t: typeof OWN) =>
      tierVars({ anchor: t.projectAnchorOpacity, neither: t.projectNeitherOpacity, ghost: t.projectDraggedOpacity });

    it('are the defaults the panel starts at, when nothing is stored', () => {
      const drag = sidebarDrag(projects, [], 12);
      drag.pickUp('X');
      expect(drag.hook.tierVars).toEqual(asVars(DEFAULT_DRAG_TUNING));
    });

    it('are read from storage at pickup, so a change in the panel takes effect on the next drag', () => {
      const drag = sidebarDrag(projects, [], 12);
      saveDragTuning({ ...DEFAULT_DRAG_TUNING, ...OWN });
      drag.pickUp('X');
      expect(drag.hook.tierVars).toEqual(asVars(OWN));
    });

    it('are apart from the board’s three, which the sidebar never reads', () => {
      saveDragTuning({
        ...DEFAULT_DRAG_TUNING,
        overlayAnchorOpacity: 0.9,
        overlayNeitherOpacity: 0.8,
        overlayGhostOpacity: 0.7,
      });
      const drag = sidebarDrag(projects, [], 12);
      drag.pickUp('X');
      expect(drag.hook.tierVars).toEqual(asVars(DEFAULT_DRAG_TUNING));
    });
  });
});

// No wiki rule states what the sidebar does before it has the project cap; this pins that it
// marks nothing invalid.
describe('before the sidebar has the project cap', () => {
  it('marks nothing invalid while the cap is unknown', () => {
    const drag = sidebarDrag(capChain);
    drag.pickUp('X');
    drag.hover('X', 3);
    expect(drag.hook.dropInvalid).toBe(false);
    expect(drag.hook.ghost?.invalid).toBe(false);
  });
});

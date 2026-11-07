import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Project } from '../../types';
import { makeProject } from '../../test/projectFixture';
import { DEFAULT_DRAG_TUNING, saveDragTuning } from '../workflow/dragTuning';
import { carriedBranchLabel } from '../dragChrome';
import { withMoveApplied, type PendingMove } from '../../lib/hierarchy';
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
// the sidebar doesn't draw. `moves` are moves sent and not yet answered, drawn as `App.tsx` hands them to
// the sidebar: their parents on `projects`, their places among the siblings beside.
function sidebarDrag(
  sent: Project[],
  collapsed: readonly string[] = [],
  depthCap: number | null = null,
  moves: readonly PendingMove[] = [],
) {
  const projects = moves.reduce((tree, move) => withMoveApplied(tree, move), sent);
  const onReorderProject = vi.fn<ReorderProject>().mockResolvedValue(undefined);
  const expand = vi.fn<(id: string) => void>();
  const expanded = new Set(projects.map(p => p.id).filter(id => !collapsed.includes(id)));
  const flatItems = flattenTree(projects, expanded, moves);
  const { result } = renderHook(() =>
    useProjectDragReorder(projects, flatItems, onReorderProject, expand, depthCap, moves),
  );
  let activeId = '';
  // The row and the sideways travel the last event carried: the release's event names them, as dnd-kit's
  // end event does.
  let overId = '';
  let deltaX = 0;
  const pointerAt = (over: string, depth: number) => {
    const seedDepth = flatItems.find(i => i.id === activeId)!.depth;
    overId = over;
    deltaX = (depth - seedDepth) * INDENT_WIDTH;
    return { delta: { x: deltaX, y: 0 }, over: { id: over } };
  };

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
    // dnd-kit's move event: the pointer moved, with the `over` of the render before it.
    hover(over: string, depth: number) {
      act(() => result.current.handleDragMove(pointerAt(over, depth) as unknown as DragMoveEvent));
    },
    // dnd-kit's announcement of a new `over`, which a move event of the same render carried one render late.
    announce(over: string, depth: number) {
      act(() => result.current.handleDragOver(pointerAt(over, depth) as unknown as DragOverEvent));
    },
    // The two rows the ghost sits between, among the rows without the dragged project; null at either end of the list.
    slot() {
      const rows = result.current.drawnItems.filter(i => i.id !== activeId).map(i => i.id);
      const { gap } = result.current;
      return gap === null ? null : [rows[gap - 1] ?? null, rows[gap] ?? null];
    },
    release() {
      act(() =>
        result.current.handleDragEnd({ delta: { x: deltaX, y: 0 }, over: { id: overId } } as unknown as DragEndEvent),
      );
    },
    // The release with an end event of its own, naming a row no earlier event named.
    releaseAt(over: string, depth: number) {
      act(() => result.current.handleDragEnd(pointerAt(over, depth) as unknown as DragEndEvent));
    },
  };
}

// TREE-1's tree: top-level A, B and X, where A has a child A1, and A1 has a
// child A1a. X is the project dragged.
const TREE_1 = tree(['A', null], ['A1', 'A'], ['A1a', 'A1'], ['B', null], ['X', null]);

// dnd-kit's move event carries the `over` of the render before it, and the announcement of the new one
// follows without the pointer having to move again, so a release can come with the move still naming the
// row before.
describe('TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed', () => {
  const FLAT = tree(['A', null], ['B', null], ['C', null]);

  it('after A’s last movement makes B the nearest row, a release without moving again saves A after B at the top level', () => {
    const drag = sidebarDrag(FLAT);
    drag.pickUp('A');
    // The move that crosses into B's row still names A, and the sortable then draws A's ghost after B.
    drag.hover('A', 0);
    drag.announce('B', 0);
    expect(drag.slot()).toEqual(['B', 'C']);

    drag.release();

    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('A', null, 'B', null);
  });

  it('draws the ghost at the announced row, with its line, before any further move', () => {
    const drag = sidebarDrag(FLAT);
    drag.pickUp('A');
    drag.hover('A', 0);
    expect(drag.slot()).toEqual([null, 'B']);

    drag.announce('B', 0);

    expect(drag.slot()).toEqual(['B', 'C']);
    expect(drag.hook.ghost).toMatchObject({ depth: 0, line: true });
  });

  it('reads the depth from the announcement’s own offset, so a tab made with the announcement is saved', () => {
    const drag = sidebarDrag(tree(['A', null], ['B', null], ['C', null], ['D', null]));
    drag.pickUp('A');
    drag.hover('A', 0);

    drag.announce('B', 1);

    expect(drag.hook.projectedDepth).toBe(1);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('A', 'B', null, null);
  });

  it('places the release from its own event: the row it names, not the last one a move or an announcement named', () => {
    const drag = sidebarDrag(FLAT);
    drag.pickUp('A');
    drag.hover('B', 0);

    // The end event names C, with no event in between.
    drag.releaseAt('C', 0);

    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('A', null, 'C', null);
  });

  it('still writes nothing when the announcement names the project’s own row, which is its own gap', () => {
    const drag = sidebarDrag(FLAT);
    drag.pickUp('A');
    drag.hover('B', 0);
    drag.announce('A', 0);

    drag.release();

    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });
});

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

describe('TREE-1.6: nearest the dragged project’s own row means its own gap, with its descendants absent', () => {
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
    // The line moves with the ghost: it is back at the top level, in X's own gap.
    expect(drag.hook.ghost).toEqual({ depth: 0, line: true, invalid: false });
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

describe('TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap', () => {
  it('the cursor leaves for the gap above B and comes back to X’s row: the ghost is in X’s own gap, and a release sends nothing', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    drag.hover('B', 0);
    expect(drag.slot()).toEqual(['A1a', 'B']);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['B', null]);
    // The line returns with the ghost, at X's own depth.
    expect(drag.hook.ghost).toEqual({ depth: 0, line: true, invalid: false });
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();
  });
});

describe('TREE-1.10: nearest the dragged project’s own row, horizontal offset picks among its own gap’s depths', () => {
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

  it('TREE-1.16, TREE-2.9: counts the rows under a collapsed descendant, which were not drawn to begin with', () => {
    const drag = sidebarDrag(projects, ['X1']);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X2', 'Y']);
    drag.pickUp('X');
    expect(drag.hook.branch?.ids).toEqual(new Set(['X1', 'X1a', 'X2']));
    expect([drag.hook.branch?.children, drag.hook.branch?.descendants]).toEqual([2, 3]);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
  });

  it('TREE-1.16, TREE-2.9: counts the whole branch of a collapsed project, though none of it was drawn', () => {
    const drag = sidebarDrag(projects, ['X']);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
    drag.pickUp('X');
    expect([drag.hook.branch?.children, drag.hook.branch?.descendants]).toEqual([2, 3]);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'Y']);
  });

  it('TREE-1.16, TREE-2.9: is none for a project with no children, and every row stays drawn', () => {
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

    it('TREE-1.16, TREE-2.9: holds the branch it began with: a descendant it moves out stays in the branch, and hidden', () => {
      const { result, held } = pickUpThenRespond(list => list.map(p => (p.id === 'X2' ? { ...p, parentId: null } : p)));

      expect(result.current.branch).toBe(held);
      expect(result.current.branch?.ids.has('X2')).toBe(true);
      expect(idsOf(result.current.drawnItems)).toEqual(['A', 'X', 'Y']);
    });

    it('TREE-1.16, TREE-2.9: does not take in a project it moves under the carried one: it is drawn where the tree puts it', () => {
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

  describe('the strengths', () => {
    const OWN = {
      projectAnchorOpacity: 0.45,
      projectNeitherOpacity: 0.15,
      projectDraggedOpacity: 0.2,
    };
    // The three properties the board's classes read, spelled out from the panel's named values: the
    // expectation does not go through `tierVars`, which the hook calls, so it can't pass by restating it.
    const asVars = (t: typeof OWN) => ({
      '--drag-tier-anchor': t.projectAnchorOpacity,
      '--drag-tier-neither': t.projectNeitherOpacity,
      '--drag-tier-ghost': t.projectDraggedOpacity,
    });

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

describe('TREE-1.17: the ghost takes the nearest row’s slot, never a row’s half', () => {
  // Top-level leaves A, B, X, C and D, in that order, and X dragged.
  const leaves = () => tree(['A', null], ['B', null], ['X', null], ['C', null], ['D', null]);

  it.each([
    ['A', [null, 'A'], ['X', null, null, 'A']],
    ['B', ['A', 'B'], ['X', null, 'A', null]],
    ['X', ['B', 'C'], null],
    ['C', ['C', 'D'], ['X', null, 'C', null]],
    ['D', ['D', null], ['X', null, 'D', null]],
  ] as const)('nearest %s, the ghost is between %j, and a release at the top level saves %j', (over, slot, write) => {
    const drag = sidebarDrag(leaves());
    drag.pickUp('X');
    drag.hover(over, 0);
    expect(drag.slot()).toEqual(slot);
    drag.release();
    if (write) expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith(...write);
    else expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('reaches every gap, both ends included, from exactly one row', () => {
    const drag = sidebarDrag(leaves());
    drag.pickUp('X');
    const gaps = ['A', 'B', 'X', 'C', 'D'].map(over => {
      drag.hover(over, 0);
      return drag.hook.gap;
    });
    expect(gaps).toEqual([0, 1, 2, 3, 4]);
  });

  it('selects no second gap when the copy moves from above a row’s middle to below it', () => {
    const drag = sidebarDrag(leaves());
    drag.pickUp('X');
    const nearB = (translatedTop: number) =>
      act(() =>
        drag.hook.handleDragMove({
          delta: { x: 0, y: 0 },
          over: { id: 'B', rect: { top: 100, height: 32 } },
          active: { id: 'X', rect: { current: { translated: { top: translatedTop, height: 32 } } } },
        } as unknown as DragMoveEvent),
      );
    nearB(90);
    const above = drag.hook.gap;
    nearB(110);
    expect(drag.hook.gap).toBe(above);
    expect(drag.slot()).toEqual(['A', 'B']);
  });
});

describe('TREE-1.18: the slot list counts a collapsed project once and leaves hidden children and the branch out', () => {
  // T is collapsed, hiding T1 and T2, and X carries X1 and X2.
  const projects = tree(
    ['A', null],
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['X', null],
    ['X1', 'X'],
    ['X2', 'X'],
    ['B', null],
  );

  it('lists A, T, X and B, and takes the gap each nearest row names', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['A', 'T', 'X', 'B']);
    drag.hover('T', 0);
    expect(drag.slot()).toEqual(['A', 'T']);
    drag.hover('B', 0);
    expect(drag.slot()).toEqual(['B', null]);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual(['T', 'B']);
  });

  it('still places X ahead of the real first child T1 when tabbed right of T: counting rows drawn hides nothing from placement', () => {
    const drag = sidebarDrag(projects, ['T']);
    drag.pickUp('X');
    drag.hover('X', 1);
    expect(drag.slot()).toEqual(['T', 'B']);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'T', null, 'T1');
  });
});

describe('TREE-2.1: the dragged project’s descendants are absent for the whole drag, and its own row is the ghost', () => {
  const projects = tree(['A', null], ['X', null], ['X1', 'X'], ['X1a', 'X1'], ['B', null]);
  const idsOf = (rows: readonly { id: string }[]) => rows.map(r => r.id);

  it('leaves the branch out of the rows and out of placement, and keeps the ghost, untiered, following the gap', () => {
    const drag = sidebarDrag(projects, [], 12);
    drag.pickUp('X');
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'B']);
    expect(drag.hook.tiers.get('A')).toBe('parent');
    expect(drag.hook.tiers.get('B')).toBe('parent');
    expect(drag.hook.tiers.has('X')).toBe(false);
    expect(drag.hook.ghost).not.toBeNull();

    drag.hover('A', 0);
    expect(drag.slot()).toEqual([null, 'A']);
    drag.hover('B', 1);
    expect(drag.slot()).toEqual(['B', null]);
    expect(drag.hook.ghost?.depth).toBe(1);
  });

  it.each(['release', 'cancel'] as const)('clears the tiers and the ghost at a %s, and draws the branch again', end => {
    const drag = sidebarDrag(projects, [], 12);
    drag.pickUp('X');
    drag.hover('B', 0);
    if (end === 'release') drag.release();
    else act(() => drag.hook.handleDragCancel());
    expect(drag.hook.tiers.size).toBe(0);
    expect(drag.hook.tierVars).toBeUndefined();
    expect(drag.hook.ghost).toBeNull();
    expect(idsOf(drag.hook.drawnItems)).toEqual(['A', 'X', 'X1', 'X1a', 'B']);
  });
});

describe('TREE-2.12: every end of the drag draws the branch again under the project', () => {
  // X carries A, whose child is A1, and B. Q is unrelated.
  const projects = tree(['X', null], ['A', 'X'], ['A1', 'A'], ['B', 'X'], ['Q', null]);
  const idsOf = (rows: readonly { id: string }[]) => rows.map(r => r.id);
  const ALL = ['X', 'A', 'A1', 'B', 'Q'];

  it.each([
    ['a valid drop under Q', 12, 'Q', 1, ['X', 'Q', null, null]],
    ['Escape', 12, null, 0, null],
    ['a release in X’s own gap at its own depth', 12, 'X', 0, null],
    ['a release past the project cap', 3, 'Q', 1, null],
  ] as const)('%s: the branch is drawn again, and the copy’s second line ends', (_end, cap, over, depth, write) => {
    const drag = sidebarDrag(projects, [], cap);
    drag.pickUp('X');
    expect(idsOf(drag.hook.drawnItems)).toEqual(['X', 'Q']);
    expect(drag.hook.branch?.ids).toEqual(new Set(['A', 'A1', 'B']));
    if (over) drag.hover(over, depth);
    if (over) drag.release();
    else act(() => drag.hook.handleDragCancel());

    expect(idsOf(drag.hook.drawnItems)).toEqual(ALL);
    expect(drag.hook.branch).toBeNull();
    if (write) expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith(...write);
    else expect(drag.onReorderProject).not.toHaveBeenCalled();
  });

  it('keeps A1 hidden after the drag when A was collapsed at pickup: drawing the branch again expands nothing', () => {
    const drag = sidebarDrag(projects, ['A']);
    expect(idsOf(drag.hook.drawnItems)).toEqual(['X', 'A', 'B', 'Q']);
    drag.pickUp('X');
    expect(drag.hook.branch?.ids).toEqual(new Set(['A', 'A1', 'B']));
    act(() => drag.hook.handleDragCancel());
    expect(idsOf(drag.hook.drawnItems)).toEqual(['X', 'A', 'B', 'Q']);
    expect(drag.expand).not.toHaveBeenCalled();
  });
});

describe('TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move', () => {
  it('draws no line before the pointer’s first move, with the ghost at its pickup depth', () => {
    const drag = sidebarDrag(tree(['A', null], ['A1', 'A'], ['X', 'A']));
    drag.pickUp('X');
    expect(drag.hook.ghost).toEqual({ depth: 1, line: false, invalid: false });
  });

  it('draws one line on the ghost in any gap it takes: above the first row, between rows, below the last', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    for (const over of ['A', 'A1', 'A1a', 'B', 'X']) {
      drag.hover(over, 0);
      expect(drag.hook.ghost?.line, over).toBe(true);
    }
  });

  it('draws the ghost, and the line with it, at each of the four depths of the gap between A1a and B', () => {
    const drag = sidebarDrag(TREE_1);
    drag.pickUp('X');
    for (const depth of [0, 1, 2, 3]) {
      drag.hover('B', depth);
      expect(drag.slot()).toEqual(['A1a', 'B']);
      expect(drag.hook.ghost).toEqual({ depth, line: true, invalid: false });
    }
  });

  it('draws no line when X’s subtree holds every project, even after the pointer has moved', () => {
    const drag = sidebarDrag(tree(['X', null], ['X1', 'X'], ['X2', 'X']));
    drag.pickUp('X');
    drag.hover('X', 3);
    expect(drag.hook.ghost?.line).toBe(false);
  });
});

describe('TREE-4.11: the next pickup counts earlier drag moves before their answers arrive', () => {
  // The project cap is 6. Z1 > Z2 > S > T is the chain, S at depth 3 and T at 4. P is a leaf, and X has the child
  // X1. X's move under P is out when P is picked up.
  const CAP = 6;
  const projects = tree(['Z1', null], ['Z2', 'Z1'], ['S', 'Z2'], ['T', 'S'], ['P', null], ['X', null], ['X1', 'X']);
  const moveX: PendingMove = { id: 'X', parentId: 'P', prevId: null, nextId: null };

  it('has X and X1 beneath P already: hidden in its carried branch, and counted on its copy’s line', () => {
    const drag = sidebarDrag(projects, [], CAP, [moveX]);
    drag.pickUp('P');
    expect(drag.hook.branch?.ids).toEqual(new Set(['X', 'X1']));
    expect(drag.hook.drawnItems.map(i => i.id)).toEqual(['Z1', 'Z2', 'S', 'T', 'P']);
    expect(carriedBranchLabel(drag.hook.branch!)).toBe('+ 1 child, 2 total descendants');
  });

  it('reads P’s subtree height as 2: S is Full, and T is Mid', () => {
    const drag = sidebarDrag(projects, [], CAP, [moveX]);
    drag.pickUp('P');
    expect(drag.hook.tiers.get('S')).toBe('parent');
    expect(drag.hook.tiers.get('T')).toBe('anchor');
    // Under S, X1 would be at depth 6, the cap, and under T at 7: a leaf P would fit under T.
    drag.hover('P', 3);
    expect(drag.hook.dropInvalid).toBe(false);
    drag.hover('P', 4);
    expect(drag.hook.dropInvalid).toBe(true);
  });
});

// A move sent and not yet answered is in the tree a pickup reads: its parent is on the project, and its place
// among the siblings is the moves'. The first child a tab into the gap under a parent names, and the branch
// a pickup carries, are read from the real tree's children, which the moves order.
describe('a move still out, read by the next pickup', () => {
  // P, with the child C1; then Q and X at the top level. Q's move under P, ahead of C1, is out.
  const projects = tree(['P', null], ['C1', 'P'], ['Q', null], ['X', null]);
  const moveQ: PendingMove = { id: 'Q', parentId: 'P', prevId: null, nextId: 'C1' };

  it('names the moved project as the first child of its new parent, ahead of the stored order', () => {
    const drag = sidebarDrag(projects, [], null, [moveQ]);
    drag.pickUp('X');
    expect(drag.hook.rowIds).toEqual(['P', 'Q', 'C1', 'X']);
    drag.hover('Q', 1);
    expect(drag.slot()).toEqual(['P', 'Q']);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'P', null, 'Q');
  });

  it('carries the whole branch of its new parent, the moved project included', () => {
    const drag = sidebarDrag(projects, [], null, [moveQ]);
    drag.pickUp('P');
    expect(drag.hook.branch?.ids).toEqual(new Set(['Q', 'C1']));
    expect(drag.hook.drawnItems.map(i => i.id)).toEqual(['P', 'X']);
  });

  it('lets a tab into the moved project make the dragged project its first child', () => {
    const drag = sidebarDrag(projects, [], null, [moveQ]);
    drag.pickUp('X');
    drag.hover('C1', 2);
    expect(drag.slot()).toEqual(['Q', 'C1']);
    expect(drag.hook.projectedDepth).toBe(2);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'Q', null, null);
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

// A drag as an earlier write's answer meets it: the sidebar's tree and its moves out change under the
// hook while a project is carried, as `App.tsx` changes them when an edit or a create lands, or a move is
// refused. `respond` is that change; the rows drawn are flattened again each time, as the sidebar does.
function liveDrag(first: Project[], depthCap: number | null = null, firstMoves: readonly PendingMove[] = []) {
  const onReorderProject = vi.fn<ReorderProject>().mockResolvedValue(undefined);
  const { result, rerender } = renderHook(
    ({ list, moves }: { list: Project[]; moves: readonly PendingMove[] }) => {
      const projects = moves.reduce((tree, move) => withMoveApplied(tree, move), list);
      const flatItems = flattenTree(projects, new Set(projects.map(p => p.id)), moves);
      return useProjectDragReorder(projects, flatItems, onReorderProject, vi.fn(), depthCap, moves);
    },
    { initialProps: { list: first, moves: firstMoves } },
  );
  let seedDepth = 0;
  let overId = '';
  let deltaX = 0;

  return {
    onReorderProject,
    get hook() {
      return result.current;
    },
    pickUp(id: string) {
      seedDepth = result.current.drawnItems.find(i => i.id === id)!.depth;
      act(() => result.current.handleDragStart({ active: { id } } as unknown as DragStartEvent));
    },
    // The carried copy nearest the row `over`, with the pointer at the absolute depth `depth`.
    hover(over: string, depth: number) {
      overId = over;
      deltaX = (depth - seedDepth) * INDENT_WIDTH;
      act(() =>
        result.current.handleDragMove({ delta: { x: deltaX, y: 0 }, over: { id: over } } as unknown as DragMoveEvent),
      );
    },
    // The two rows the ghost sits between, among the rows without the dragged project; null at either end of the list.
    slot() {
      const rows = result.current.drawnItems.filter(i => i.id !== result.current.activeItem?.id).map(i => i.id);
      const { gap } = result.current;
      return gap === null ? null : [rows[gap - 1] ?? null, rows[gap] ?? null];
    },
    release() {
      act(() =>
        result.current.handleDragEnd({ delta: { x: deltaX, y: 0 }, over: { id: overId } } as unknown as DragEndEvent),
      );
    },
    cancel() {
      act(() => result.current.handleDragCancel());
    },
    respond(list: Project[], moves: readonly PendingMove[] = []) {
      rerender({ list, moves });
    },
  };
}

const drawnIds = (rows: readonly { id: string }[]) => rows.map(row => row.id);

// A chain `owner`1 under `owner`, `owner`2 under `owner`1, and so on, `levels` deep.
const chainBelow = (owner: string, levels: number) =>
  Array.from({ length: levels }, (_, i) => [`${owner}${i + 1}`, i === 0 ? owner : `${owner}${i}`] as const);

describe('TREE-1.14: a project added to the dragged subtree after pickup stays a candidate, and a cyclic release is refused', () => {
  // Top-level X and B, with room under the cap. Y goes under X after X is picked up, by an edit of its parent
  // that was out at the pickup or by a create. The answer lands mid-drag.
  const CAP = 6;
  const underX = [...tree(['X', null], ['B', null]), makeProject('Y', { parentId: 'X', position: 1, createdAt: 9 })];
  it.each([
    ['an edit of Y’s parent to X', tree(['X', null], ['Y', null], ['B', null])],
    ['a create of Y under X', tree(['X', null], ['B', null])],
  ] as const)(
    'after %s, Y is drawn under X and is no part of the held branch, and the next pickup of X holds it, hidden and out of placement',
    (_, atPickup) => {
      const drag = liveDrag(atPickup, CAP);
      drag.pickUp('X');
      const { branch } = drag.hook;
      expect(branch).toBeNull();

      drag.respond(underX);

      // The drag continues, with the pickup's branch, and Y shown under X among the rows.
      expect(drag.hook.branch).toBe(branch);
      expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'Y', 'B']);
      drag.cancel();

      // The tree is the one the answer left, and the next pickup of X has Y in its branch, hidden and out of
      // placement: resting on X's own row is its own gap, and a release writes nothing.
      drag.pickUp('X');
      expect(drag.hook.branch?.ids).toEqual(new Set(['Y']));
      expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B']);
      drag.hover('X', 0);
      expect(drag.slot()).toEqual([null, 'B']);
      drag.release();
      expect(drag.onReorderProject).not.toHaveBeenCalled();
    },
  );
});

describe('TREE-1.15: cap states keep the pickup subtree height when a response grows or shrinks it', () => {
  // The cap is 4, and T is at depth 3, one under it: X as T's child is at depth 4 when it has no subtree, and
  // past the cap when it has one level.
  const CAP = 4;
  const chain = [
    ['A1', null],
    ['A2', 'A1'],
    ['T', 'A2'],
  ] as const;
  const asTChild = 3; // the 0-based depth of T's child, which `hover` takes

  it.each([
    ['an edit of Y’s parent to X', tree(...chain, ['X', null], ['Y', null])],
    ['a create of Y under X', tree(...chain, ['X', null])],
  ] as const)(
    'after %s, the state making X T’s child is still valid by the pickup height, and sent; the next pickup marks it invalid',
    (_, atPickup) => {
      const drag = liveDrag(atPickup, CAP);
      drag.pickUp('X');
      drag.hover('X', asTChild);
      expect(drag.hook.dropInvalid).toBe(false);

      // Y lands under X: the drag continues with the sidebar showing it there, and the state is still valid.
      drag.respond(tree(...chain, ['X', null], ['Y', 'X']));
      expect(drawnIds(drag.hook.drawnItems)).toEqual(['A1', 'A2', 'T', 'X', 'Y']);
      drag.hover('X', asTChild);
      expect(drag.hook.projectedDepth).toBe(asTChild);
      expect(drag.hook.dropInvalid).toBe(false);
      drag.release();
      // The move is sent. The server refuses it, since the saved subtree has one level and reaches 5.
      expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'T', null, null);

      // The tree the refusal leaves has Y under X, and the same state is now invalid and writes nothing.
      drag.pickUp('X');
      expect(drag.hook.branch?.ids).toEqual(new Set(['Y']));
      drag.hover('X', asTChild);
      expect(drag.hook.dropInvalid).toBe(true);
      drag.release();
      expect(drag.onReorderProject).toHaveBeenCalledTimes(1);
    },
  );

  it('after Y, X’s only child, is made top-level, the state stays invalid by the pickup height, and the next pickup finds it valid', () => {
    const drag = liveDrag(tree(...chain, ['X', null], ['Y', 'X']), CAP);
    drag.pickUp('X');
    const { branch } = drag.hook;
    drag.hover('X', asTChild);
    expect(drag.hook.dropInvalid).toBe(true);

    // Y belongs at the top level now, but it stays in the held branch, and hidden, for this drag.
    drag.respond(tree(...chain, ['X', null], ['Y', null]));
    expect(drag.hook.branch).toBe(branch);
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['A1', 'A2', 'T', 'X']);
    drag.hover('X', asTChild);
    expect(drag.hook.dropInvalid).toBe(true);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();

    // The suppression ends: X and Y are both drawn top-level. X now has height 0, so the same state is valid.
    expect(drag.hook.branch).toBeNull();
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['A1', 'A2', 'T', 'X', 'Y']);
    drag.pickUp('X');
    drag.hover('X', asTChild);
    expect(drag.hook.dropInvalid).toBe(false);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'T', null, null);
  });
});

describe('TREE-1.16: a descendant moved out after pickup stays excluded until the next drag', () => {
  const CAP = 6;

  it('after an edit puts Y, X’s child, under B, Y stays hidden and out of placement for the drag, then is drawn under B and a candidate at the next pickup', () => {
    const drag = liveDrag(tree(['X', null], ['Y', 'X'], ['B', null]), CAP);
    drag.pickUp('X');
    const { branch } = drag.hook;
    expect(branch?.ids).toEqual(new Set(['Y']));

    drag.respond(tree(['X', null], ['B', null], ['Y', 'B']));

    // The drag continues. Y is hidden, so no row of it is nearest or names a neighbor, and X's own gap at its
    // own depth writes nothing.
    expect(drag.hook.branch).toBe(branch);
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B']);
    drag.hover('X', 0);
    expect(drag.slot()).toEqual([null, 'B']);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();

    // At the drag's end Y is drawn under B, and a new pickup reads it as outside X's subtree: the gap after Y,
    // aligned with it, places X under B, after Y.
    expect(drag.hook.branch).toBeNull();
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B', 'Y']);
    drag.pickUp('X');
    expect(drag.hook.branch).toBeNull();
    drag.hover('Y', 1);
    expect(drag.slot()).toEqual(['Y', null]);
    drag.release();
    expect(drag.onReorderProject).toHaveBeenCalledExactlyOnceWith('X', 'B', 'Y', null);
  });

  it('after an earlier drag of Y under X is refused, Y’s row stays hidden in the branch until the drag ends, and is drawn under B after', () => {
    // Y is saved under B. A drag of Y under X is drawn, and its answer is out.
    const saved = tree(['X', null], ['B', null], ['Y', 'B']);
    const moveY: PendingMove = { id: 'Y', parentId: 'X', prevId: null, nextId: null };
    const drag = liveDrag(saved, CAP, [moveY]);
    drag.pickUp('X');
    const { branch } = drag.hook;
    expect(branch?.ids).toEqual(new Set(['Y']));
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B']);

    // The refusal takes the move away, and the read after it has Y under B. Neither makes Y a candidate.
    drag.respond(saved, []);
    expect(drag.hook.branch).toBe(branch);
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B']);
    drag.hover('X', 0);
    drag.release();
    expect(drag.onReorderProject).not.toHaveBeenCalled();

    // After the drag, Y is drawn under B, and a new pickup reads that tree.
    expect(drawnIds(drag.hook.drawnItems)).toEqual(['X', 'B', 'Y']);
    drag.pickUp('X');
    expect(drag.hook.branch).toBeNull();
  });
});

describe('TREE-2.4: legal parents are Full, the cap boundary is Mid, and deeper rows are Low', () => {
  afterEach(() => localStorage.clear());

  // The chain P1 to P_CAP, P1 at depth 1, and X with one child X1: X's subtree is one level tall.
  it.each([4, 5, 7])('at cap %i, P1 to P_(CAP-2) are Full, P_(CAP-1) is Mid, P_CAP is Low, and X1 is absent', cap => {
    const chain = Array.from({ length: cap }, (_, i) => [`P${i + 1}`, i === 0 ? null : `P${i}`] as const);
    const drag = sidebarDrag(tree(...chain, ['X', null], ['X1', 'X']), [], cap);
    drag.pickUp('X');
    const { tiers, branch, tierVars } = drag.hook;

    for (let level = 1; level <= cap - 2; level++) expect(tiers.get(`P${level}`), `P${level}`).toBe('parent');
    expect(tiers.get(`P${cap - 1}`)).toBe('anchor');
    expect(tiers.get(`P${cap}`)).toBe('neither');
    // X1 is out of the rows as the carried branch, apart from the tiers, and X's ghost has no tier of its own.
    expect(branch?.ids).toEqual(new Set(['X1']));
    expect(drawnIds(drag.hook.drawnItems)).toEqual([...chain.map(([id]) => id), 'X']);
    expect(tiers.has('X')).toBe(false);
    expect(tierVars).toMatchObject({ '--drag-tier-ghost': DEFAULT_DRAG_TUNING.projectDraggedOpacity });
  });
});

describe('TREE-2.5: top-level rows take the root’s legal-parent answer', () => {
  afterEach(() => localStorage.clear());

  const CAP = 5;
  const others = [
    ['A', null],
    ['B', null],
    ['B1', 'B'],
  ] as const;

  it('with X’s subtree one level under the cap, the root takes it: every other top-level row is Mid, and their nested rows Low', () => {
    const drag = sidebarDrag(tree(...others, ['X', null], ...chainBelow('X', CAP - 1)), [], CAP);
    drag.pickUp('X');
    const { tiers } = drag.hook;

    expect(tiers.get('A')).toBe('anchor');
    expect(tiers.get('B')).toBe('anchor');
    expect(tiers.get('B1')).toBe('neither');
    expect(tiers.has('X')).toBe(false);
  });

  it('with X’s subtree at the cap, no root can take it: every other row is Low, top-level included, and the ghost has no tier', () => {
    const drag = sidebarDrag(tree(...others, ['X', null], ...chainBelow('X', CAP)), [], CAP);
    drag.pickUp('X');
    const { tiers, tierVars } = drag.hook;

    for (const id of ['A', 'B', 'B1']) expect(tiers.get(id), id).toBe('neither');
    expect(tiers.has('X')).toBe(false);
    expect(tierVars).toMatchObject({ '--drag-tier-ghost': DEFAULT_DRAG_TUNING.projectDraggedOpacity });
  });
});

describe('TREE-2.6: a response landing mid-drag does not redraw the pickup tiers', () => {
  afterEach(() => localStorage.clear());

  // The cap is 5. R1 > R2 > Q puts Q at depth 3, CAP - 2, with Q's child Q1 (Mid) and Q1's child Q2 (Low) below it. X has
  // one child, so its subtree is one level tall. P is a top-level leaf, Full for X, and its parent edit to Q is out.
  const CAP = 5;
  const atPickup = tree(
    ['R1', null],
    ['R2', 'R1'],
    ['Q', 'R2'],
    ['Q1', 'Q'],
    ['Q2', 'Q1'],
    ['P', null],
    ['X', null],
    ['X1', 'X'],
  );
  const answered = atPickup.map(p => (p.id === 'P' ? { ...p, parentId: 'Q', position: 9 } : p));

  it('keeps P Full through the rest of the drag, and every Mid and Low row as it was, then draws P Mid at the next pickup', () => {
    const drag = liveDrag(atPickup, CAP);
    drag.pickUp('X');
    const { tiers, tierVars } = drag.hook;
    expect(tiers.get('P')).toBe('parent');
    expect(tiers.get('Q1')).toBe('anchor');
    expect(tiers.get('Q2')).toBe('neither');

    // P's saved parent is applied: it is drawn under Q, and the tiers are the pickup's, P among them.
    drag.respond(answered);
    expect(drawnIds(drag.hook.drawnItems)).toContain('P');
    expect(drag.hook.tiers).toBe(tiers);
    expect(drag.hook.tierVars).toBe(tierVars);
    expect(drag.hook.tiers.get('P')).toBe('parent');
    expect(drag.hook.tiers.get('Q1')).toBe('anchor');
    expect(drag.hook.tiers.get('Q2')).toBe('neither');

    // A cancel clears them, and the next pickup reads the saved tree: P, at depth 4, is Mid, since its parent
    // Q can take X.
    drag.cancel();
    expect(drag.hook.tiers.size).toBe(0);
    drag.pickUp('X');
    expect(drag.hook.tiers.get('P')).toBe('anchor');
  });
});

describe('TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse', () => {
  // The branch is the carried copy's line: its wording is the copy's, and none when nothing is carried.
  const lineOf = (list: Project[], collapsed: readonly string[] = []) => {
    const drag = sidebarDrag(list, collapsed);
    drag.pickUp('X');
    return { drag, line: drag.hook.branch ? carriedBranchLabel(drag.hook.branch) : null };
  };
  // A and B under X; A has A1, which has A1a; B has B1.
  const FIVE = tree(['Q', null], ['X', null], ['A', 'X'], ['A1', 'A'], ['A1a', 'A1'], ['B', 'X'], ['B1', 'B']);

  it.each([
    ['no children', tree(['Q', null], ['X', null]), null],
    ['one leaf child', tree(['Q', null], ['X', null], ['K', 'X']), '+ 1 child'],
    ['three leaf children', tree(['Q', null], ['X', null], ['K1', 'X'], ['K2', 'X'], ['K3', 'X']), '+ 3 children'],
    [
      'one child with one child of its own',
      tree(['Q', null], ['X', null], ['K', 'X'], ['K1', 'K']),
      '+ 1 child, 2 total descendants',
    ],
    ['children A and B, with A1, A1a and B1 below', FIVE, '+ 2 children, 5 total descendants'],
  ] as const)('%s: the line is %j', (_, list, line) => {
    expect(lineOf(list as Project[]).line).toBe(line);
  });

  it.each([['A'], ['X'], ['A', 'X']])(
    'with %j collapsed, the five descendants still count, and none is left among the rows drawn',
    (...collapsed) => {
      const { drag, line } = lineOf(FIVE, collapsed);

      expect(line).toBe('+ 2 children, 5 total descendants');
      expect(drag.hook.branch?.ids).toEqual(new Set(['A', 'A1', 'A1a', 'B', 'B1']));
      expect(drawnIds(drag.hook.drawnItems)).toEqual(['Q', 'X']);
    },
  );

  it('holds the counts and the membership for the whole drag, and never counts X itself', () => {
    const { drag, line } = lineOf(FIVE, ['A']);
    const { branch } = drag.hook;

    drag.hover('Q', 0);
    drag.hover('X', 0);
    drag.hover('Q', 0);
    expect(drag.hook.branch).toBe(branch);
    expect(carriedBranchLabel(drag.hook.branch!)).toBe(line);
    expect(drag.hook.branch?.ids.has('X')).toBe(false);
  });
});

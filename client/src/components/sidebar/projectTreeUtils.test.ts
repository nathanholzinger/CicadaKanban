import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  fullChildrenOf,
  parentPutUnder,
  projectNameIndentPx,
  projectRowIndentPx,
  resolveGap,
  siblingIdsFromAnchor,
  INDENT_WIDTH,
  ROW_CHEVRON_WIDTH_CLASS,
  ROW_CHEVRON_WIDTH_PX,
  ROW_GAP_CLASS,
  ROW_GAP_PX,
  ROW_HANDLE_WIDTH_CLASS,
  ROW_HANDLE_WIDTH_PX,
  type FlatItem,
} from './projectTreeUtils';
import { computeProjection, toRows } from '../../lib/hierarchyPlacement';
import { makeProject } from '../../test/projectFixture';

function flat(id: string, depth: number, parentId: string | null, overrides: Partial<FlatItem> = {}): FlatItem {
  return {
    id,
    depth,
    parentId,
    project: makeProject(id),
    hasChildren: false,
    collapsed: false,
    ...overrides,
  };
}

describe('flattenTree', () => {
  it('sorts siblings by position, then by createdAt on a tie', () => {
    const r1 = makeProject('r1', { position: 2, createdAt: 100 });
    const r2 = makeProject('r2', { position: 1, createdAt: 200 });
    const tied = makeProject('tied', { position: 2, createdAt: 50 });
    const result = flattenTree([r1, r2, tied], new Set());
    expect(result.map(i => i.id)).toEqual(['r2', 'tied', 'r1']);
  });

  it('counts a missing position as 0, ahead of a positive one whatever its createdAt', () => {
    const a = makeProject('a', { position: 0.5, createdAt: 1 });
    const n = makeProject('n', { position: null, createdAt: 999 });
    const b = makeProject('b', { position: 2, createdAt: 2 });
    expect(flattenTree([a, b, n], new Set()).map(i => i.id)).toEqual(['n', 'a', 'b']);
  });

  it('falls back to createdAt ordering when position is null for both siblings', () => {
    const c1 = makeProject('c1', { position: null, createdAt: 50 });
    const c2 = makeProject('c2', { position: null, createdAt: 10 });
    const result = flattenTree([c1, c2], new Set());
    expect(result.map(i => i.id)).toEqual(['c2', 'c1']);
  });

  it('nests children depth-first under their parent and sets hasChildren', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => ({ id: i.id, depth: i.depth, parentId: i.parentId }))).toEqual([
      { id: 'root', depth: 0, parentId: null },
      { id: 'child', depth: 1, parentId: 'root' },
    ]);
    expect(result[0].hasChildren).toBe(true);
  });

  it('collapses a project (excludes its descendants) when its id is absent from expandedIds', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set()); // root not expanded
    expect(result.map(i => i.id)).toEqual(['root']);
    expect(result[0].collapsed).toBe(true);
  });

  it('expands a project (includes its descendants) when its id is present in expandedIds', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => i.id)).toEqual(['root', 'child']);
    expect(result[0].collapsed).toBe(false);
  });
});

// A move sent and not yet answered is drawn by the render list and by the real tree's children alike: its
// parent is on the project (`withMoveApplied`), its place among the siblings is the moves' (`moves`).
describe('a move out, read by the render list and the real tree', () => {
  // P, with the children C1 and C2, then Q and R at the top level. Each sits at a position of its own.
  const projects = [
    makeProject('P', { position: 10 }),
    makeProject('C1', { parentId: 'P', position: 10 }),
    makeProject('C2', { parentId: 'P', position: 20 }),
    makeProject('Q', { position: 20 }),
    makeProject('R', { position: 30 }),
  ];
  const everyProject = new Set(projects.map(p => p.id));
  const move = { id: 'R', parentId: 'P', prevId: 'C1', nextId: null };
  const laidOver = projects.map(p => (p.id === 'R' ? { ...p, parentId: 'P' } : p));
  const rowsOf = (items: FlatItem[]) => items.map(i => `${i.id}@${i.depth}`);

  it('draws the project under its new parent, beside the sibling it names, whatever its position', () => {
    expect(rowsOf(flattenTree(laidOver, everyProject, [move]))).toEqual(['P@0', 'C1@1', 'R@1', 'C2@1', 'Q@0']);
  });

  it('leaves every project’s position as the server sent it', () => {
    const items = flattenTree(laidOver, everyProject, [move]);
    expect(items.map(i => i.project.position)).toEqual([10, 10, 30, 20, 20]);
  });

  it('draws it where the sort alone would put it when no move is out', () => {
    expect(rowsOf(flattenTree(laidOver, everyProject))).toEqual(['P@0', 'C1@1', 'C2@1', 'R@1', 'Q@0']);
    expect(rowsOf(flattenTree(laidOver, everyProject, []))).toEqual(rowsOf(flattenTree(laidOver, everyProject)));
  });

  it('shows the parent it left without a chevron when the project was its only child', () => {
    const only = [makeProject('P', { position: 1 }), makeProject('C', { parentId: 'P', position: 1 })];
    const to = { id: 'C', parentId: null, prevId: 'P', nextId: null };
    const items = flattenTree(
      only.map(p => (p.id === 'C' ? { ...p, parentId: null } : p)),
      new Set(['P', 'C']),
      [to],
    );
    expect(rowsOf(items)).toEqual(['P@0', 'C@0']);
    expect(items[0].hasChildren).toBe(false);
  });

  it('reads the same place in the real tree’s children, collapsed or not', () => {
    expect(fullChildrenOf(laidOver, [move])('P')).toEqual(['C1', 'R', 'C2']);
    expect(fullChildrenOf(laidOver, [move])(null)).toEqual(['P', 'Q']);
    expect(fullChildrenOf(laidOver)('P')).toEqual(['C1', 'C2', 'R']);
  });

  it('puts a project moved to a parent’s front first among its children, which a first-child lookup reads', () => {
    const front = { id: 'R', parentId: 'P', prevId: null, nextId: 'C1' };
    expect(fullChildrenOf(laidOver, [front])('P')[0]).toBe('R');
  });
});

// The gap is the ghost's slot: the dragged project's own row is one of the rows drawn, and the gap is
// the place of the row the copy is nearest, among the rows without the dragged one.
describe('TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn', () => {
  // A, B, X, C, D, drawn in that order, with X the dragged project: its gap is among A, B, C and D.
  const drawn = ['A', 'B', 'X', 'C', 'D'].map(id => ({ id }));
  // The two rows a gap sits between, among the rows without X; null at either end of the list.
  const between = (gap: number) => {
    const rows = drawn.filter(r => r.id !== 'X').map(r => r.id);
    return [rows[gap - 1] ?? null, rows[gap] ?? null];
  };

  it('puts the ghost after a row below its own slot, and before a row above it', () => {
    expect(between(resolveGap(drawn, 'C'))).toEqual(['C', 'D']);
    expect(between(resolveGap(drawn, 'D'))).toEqual(['D', null]);
    expect(between(resolveGap(drawn, 'B'))).toEqual(['A', 'B']);
    expect(between(resolveGap(drawn, 'A'))).toEqual([null, 'A']);
  });

  it('leaves the ghost in its own gap when the copy is nearest its own row', () => {
    expect(between(resolveGap(drawn, 'X'))).toEqual(['B', 'C']);
  });

  it('gives every gap exactly one row to be nearest, the list’s two ends included', () => {
    const gaps = drawn.map(r => resolveGap(drawn, r.id));
    expect(gaps).toEqual([0, 1, 2, 3, 4]);
    expect(between(0)).toEqual([null, 'A']);
    expect(between(4)).toEqual(['D', null]);
  });

  it('reads the order it is given, so the same row is the same gap however the rows have slid', () => {
    expect(resolveGap(drawn, 'C')).toBe(3);
    expect(resolveGap(drawn, 'B')).toBe(1);
    expect(resolveGap(drawn, 'C')).toBe(3);
  });

  it('counts a collapsed project once, and the children it hides not at all', () => {
    // T is collapsed, so T1 and T2 are not drawn: U is the row after T, and the gap above it is T's.
    const tree = [flat('T', 0, null, { hasChildren: true, collapsed: true }), flat('U', 0, null), flat('X', 0, null)];
    expect(resolveGap(tree, 'U')).toBe(1);
    expect(resolveGap(tree, 'X')).toBe(2);
  });

  it('counts the dragged project’s branch not at all, since it is not drawn', () => {
    // X carries X1, which is not a row: the rows drawn are A, X and B.
    const tree = [flat('A', 0, null), flat('X', 0, null), flat('B', 0, null)];
    expect(resolveGap(tree, 'B')).toBe(2);
    expect(resolveGap(tree, 'A')).toBe(0);
  });

  it('reads an id that names no row as below everything', () => {
    expect(resolveGap(drawn, 'nowhere')).toBe(4);
  });
});

describe('TREE-1.5: fullChildrenOf — a collapsed Top', () => {
  it('returns a project’s real children regardless of collapse state', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const childrenOfReal = fullChildrenOf([root, child]);
    expect(childrenOfReal('root')).toEqual(['child']);
  });

  // `root` collapsed means `child` never enters `flatItems`, or the rows made
  // from it, so the gap right after `root` (Top + 1, "root's first child") has
  // no next row to read a first child off of. `computeProjection` must still
  // resolve `child` as the anchor, using `fullChildrenOf`, not the rows.
  it('a collapsed Top still resolves Top + 1 to its real first child', () => {
    const root = makeProject('root', { position: 1 });
    const child = makeProject('child', { parentId: 'root' });
    const sibling = makeProject('sibling', { position: 2 });
    const dragged = makeProject('dragged', { position: 3 });
    const flatCollapsed = flattenTree([root, child, sibling, dragged], new Set()); // root collapsed
    expect(flatCollapsed.map(i => i.id)).toEqual(['root', 'sibling', 'dragged']); // child never rendered

    const rows = toRows(flatCollapsed, new Set(['dragged']));
    const childrenOfReal = fullChildrenOf([root, child, sibling, dragged]);
    const gap = resolveGap(flatCollapsed, 'sibling'); // the ghost takes sibling's slot: between root (Top) and sibling (Bottom)
    const result = computeProjection(rows, gap, 0, 14, INDENT_WIDTH, null, childrenOfReal, new Set()); // one tab right of root

    expect(result).toEqual({
      depth: 1,
      placement: { parentId: 'root', anchor: { anchorId: 'child', side: 'before' } },
    });
  });
});

describe('siblingIdsFromAnchor', () => {
  it('an "after" anchor is the previous sibling; "before" is the next', () => {
    expect(siblingIdsFromAnchor({ anchorId: 'A', side: 'after' })).toEqual({ prevId: 'A', nextId: null });
    expect(siblingIdsFromAnchor({ anchorId: 'B', side: 'before' })).toEqual({ prevId: null, nextId: 'B' });
  });

  it('no anchor (the sole child of its parent) is neither', () => {
    expect(siblingIdsFromAnchor(null)).toEqual({ prevId: null, nextId: null });
  });
});

// A Tailwind step is a quarter of a rem, which is 4px at the browser's default size.
const stepOf = (px: number) => px / 4;

describe('where a project’s name starts in its row', () => {
  it('sets each leading control by a class that is the same width as the number the name’s start adds up', () => {
    expect(ROW_HANDLE_WIDTH_CLASS).toBe(`w-${stepOf(ROW_HANDLE_WIDTH_PX)}`);
    expect(ROW_CHEVRON_WIDTH_CLASS).toBe(`w-${stepOf(ROW_CHEVRON_WIDTH_PX)}`);
    expect(ROW_GAP_CLASS).toBe(`gap-${stepOf(ROW_GAP_PX)}`);
  });

  it('is the row’s padding and then the handle, the chevron and the gap around each', () => {
    expect(projectNameIndentPx(0)).toBe(projectRowIndentPx(0) + 12 + 4 + 16 + 4);
  });

  it('steps by the indent per depth, as the row’s own padding does', () => {
    for (const depth of [0, 1, 2, 5]) {
      expect(projectNameIndentPx(depth) - projectNameIndentPx(0)).toBe(depth * INDENT_WIDTH);
      expect(projectNameIndentPx(depth) - projectRowIndentPx(depth)).toBe(
        projectNameIndentPx(0) - projectRowIndentPx(0),
      );
    }
  });
});

describe('parentPutUnder: the parent a write opens', () => {
  const before = makeProject('X', { parentId: 'A' });

  it('is the parent a create puts a project under', () => {
    expect(parentPutUnder(undefined, makeProject('N', { parentId: 'P' }))).toBe('P');
  });

  it('is none for a top-level project', () => {
    expect(parentPutUnder(undefined, makeProject('N'))).toBeNull();
    expect(parentPutUnder(before, makeProject('X', { parentId: null }))).toBeNull();
  });

  it('is the new parent of a project a write moved under another', () => {
    expect(parentPutUnder(before, makeProject('X', { parentId: 'P' }))).toBe('P');
    expect(parentPutUnder(makeProject('X'), makeProject('X', { parentId: 'P' }))).toBe('P');
  });

  it('is none for a write that left the project under the parent it had, a rename among them', () => {
    expect(parentPutUnder(before, makeProject('X', { parentId: 'A', name: 'Renamed' }))).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import {
  flattenHierarchy,
  gapIndexFor,
  depthRangeFor,
  resolvePlacement,
  computeProjection,
  type Row,
} from './hierarchyPlacement';

// DRAG-4 TC-8's tree, rooted at Card `P`:
//   S1        (0)
//     S1a     (1)
//       S1a1  (2)
//   S2        (0)
function childrenOf(id: string | null): readonly string[] {
  if (id === 'P') return ['S1', 'S2'];
  if (id === 'S1') return ['S1a'];
  if (id === 'S1a') return ['S1a1'];
  return [];
}

function byId(rows: readonly Row[], id: string): Row {
  const row = rows.find(r => r.id === id);
  if (!row) throw new Error(`no row ${id}`);
  return row;
}

describe('flattenHierarchy', () => {
  it('is a parents-before-children DFS, depth 0 at the root’s direct children', () => {
    const rows = flattenHierarchy('P', childrenOf);
    expect(rows.map(r => r.id)).toEqual(['S1', 'S1a', 'S1a1', 'S2']);
    expect(byId(rows, 'S1')).toEqual({ id: 'S1', parentId: 'P', depth: 0 });
    expect(byId(rows, 'S1a')).toEqual({ id: 'S1a', parentId: 'S1', depth: 1 });
    expect(byId(rows, 'S1a1')).toEqual({ id: 'S1a1', parentId: 'S1a', depth: 2 });
    expect(byId(rows, 'S2')).toEqual({ id: 'S2', parentId: 'P', depth: 0 });
  });

  it('a null root (the sidebar’s virtual top) yields depth-0 rows with parentId null', () => {
    const rows = flattenHierarchy(null, id => (id === null ? ['top1'] : []));
    expect(rows).toEqual([{ id: 'top1', parentId: null, depth: 0 }]);
  });

  it('an empty hierarchy (no children of the root) yields no rows', () => {
    expect(flattenHierarchy('lonely', childrenOf)).toEqual([]);
  });

  // §7.2: the dragged item's whole subtree is removed from the
  // Top/Bottom candidates before any gap is computed.
  it('excludes the given ids, and never walks into their children', () => {
    const rows = flattenHierarchy('P', childrenOf, new Set(['S1']));
    expect(rows.map(r => r.id)).toEqual(['S2']);
  });
});

describe('gapIndexFor', () => {
  const rows = flattenHierarchy('P', childrenOf);

  it('before a row is the gap at its own index', () => {
    expect(gapIndexFor(rows, 'S1a1', 'before')).toBe(2);
  });

  it('after a row is the gap at the next index', () => {
    expect(gapIndexFor(rows, 'S1a1', 'after')).toBe(3);
  });

  it('before the first row is gap 0; after the last is gap rows.length', () => {
    expect(gapIndexFor(rows, 'S1', 'before')).toBe(0);
    expect(gapIndexFor(rows, 'S2', 'after')).toBe(4);
  });

  it('an unrecognized over id falls back to the conservative "below everything"', () => {
    expect(gapIndexFor(rows, 'ghost', 'before')).toBe(rows.length);
  });
});

// TC-8 — the depth range offered by a gap is [Bottom's depth … Top's depth + 1].
describe('depthRangeFor', () => {
  const rows = flattenHierarchy('P', childrenOf);

  it('the gap between S1a1 (Top, depth 2) and S2 (Bottom, depth 0) offers depths 0–3', () => {
    const gap = gapIndexFor(rows, 'S2', 'before');
    expect(depthRangeFor(rows, gap)).toEqual({ lo: 0, hi: 3 });
  });

  it('the gap between S1 and S1a (Bottom is Top’s own child) offers exactly one depth', () => {
    const gap = gapIndexFor(rows, 'S1a', 'before');
    expect(depthRangeFor(rows, gap)).toEqual({ lo: 1, hi: 1 });
  });

  it('above the first item (no Top) offers depth 0 only', () => {
    expect(depthRangeFor(rows, 0)).toEqual({ lo: 0, hi: 0 });
  });

  it('below the last item (no Bottom) offers the root’s depth up to Top + 1', () => {
    expect(depthRangeFor(rows, rows.length)).toEqual({ lo: 0, hi: 1 });
  });

  it('an empty hierarchy offers depth 0 only', () => {
    expect(depthRangeFor([], 0)).toEqual({ lo: 0, hi: 0 });
  });
});

// TC-9 / TC-10 — the relation each depth in the S1a1/S2 gap resolves to.
describe('resolvePlacement — TC-9 / TC-10’s worked gap', () => {
  const rows = flattenHierarchy('P', childrenOf);
  const gap = gapIndexFor(rows, 'S2', 'before'); // between S1a1 (Top) and S2 (Bottom)

  it('TC-9: Top + 1 (depth 3) is Top’s first child — S1a1 has none, so no anchor', () => {
    expect(resolvePlacement(rows, gap, 3, 'P', childrenOf)).toEqual({ parentId: 'S1a1', anchor: null });
  });

  it('TC-9: Top’s own depth (2) is Top’s sibling, after Top’s whole subtree', () => {
    expect(resolvePlacement(rows, gap, 2, 'P', childrenOf)).toEqual({
      parentId: 'S1a',
      anchor: { id: 'S1a1', side: 'after' },
    });
  });

  it('TC-10: one tab left (depth 1) is a sibling of Top’s parent, after its subtree', () => {
    expect(resolvePlacement(rows, gap, 1, 'P', childrenOf)).toEqual({
      parentId: 'S1',
      anchor: { id: 'S1a', side: 'after' },
    });
  });

  it('TC-10: two tabs left (depth 0, Bottom’s depth) is a sibling of Top’s grandparent', () => {
    expect(resolvePlacement(rows, gap, 0, 'P', childrenOf)).toEqual({
      parentId: 'P',
      anchor: { id: 'S1', side: 'after' },
    });
  });
});

// TC-11 — boundaries: first gap, last gap, Bottom-is-Top's-child, empty hierarchy.
describe('resolvePlacement — TC-11’s boundaries', () => {
  const rows = flattenHierarchy('P', childrenOf);

  it('above the first item: first child of the root, before S1', () => {
    expect(resolvePlacement(rows, 0, 0, 'P', childrenOf)).toEqual({
      parentId: 'P',
      anchor: { id: 'S1', side: 'before' },
    });
  });

  it('below the last item at depth 0: sibling after S2, under P', () => {
    expect(resolvePlacement(rows, rows.length, 0, 'P', childrenOf)).toEqual({
      parentId: 'P',
      anchor: { id: 'S2', side: 'after' },
    });
  });

  it('below the last item at depth 1 (Top + 1): first (and only) child of S2', () => {
    expect(resolvePlacement(rows, rows.length, 1, 'P', childrenOf)).toEqual({ parentId: 'S2', anchor: null });
  });

  it('Bottom is Top’s own child: first child of S1, before S1a', () => {
    const gap = gapIndexFor(rows, 'S1a', 'before');
    expect(resolvePlacement(rows, gap, 1, 'P', childrenOf)).toEqual({
      parentId: 'S1',
      anchor: { id: 'S1a', side: 'before' },
    });
  });

  it('an empty hierarchy offers the root’s sole child, no anchor', () => {
    expect(resolvePlacement([], 0, 0, 'P', childrenOf)).toEqual({ parentId: 'P', anchor: null });
  });

  it('an empty hierarchy under a null (sidebar virtual) root reads parentId null', () => {
    expect(resolvePlacement([], 0, 0, null, childrenOf)).toEqual({ parentId: null, anchor: null });
  });
});

// Sidebar difference 6 (found 2026-09-23): a Top whose children are hidden
// from `rows` (a collapsed project, or any future case where a row's real
// children aren't all rendered) must still resolve Top + 1 to its *real*
// first child from the full tree, never "no anchor" just because the next
// rendered row isn't that child.
describe('resolvePlacement — a Top whose children are hidden from rows (a collapsed Top)', () => {
  function fullChildrenOf(id: string | null): readonly string[] {
    if (id === null) return ['A', 'B'];
    if (id === 'A') return ['A1', 'A2'];
    return [];
  }
  // A is "collapsed": A1/A2 are real children in the full tree but never
  // made it into `rows` — the very next row after A is B, an unrelated
  // top-level sibling, not A's child.
  const rows: Row[] = [
    { id: 'A', parentId: null, depth: 0 },
    { id: 'B', parentId: null, depth: 0 },
  ];

  it('Top + 1 still resolves to Top’s real first child, not the next row', () => {
    const gap = gapIndexFor(rows, 'B', 'before'); // between A (Top) and B (Bottom)
    expect(resolvePlacement(rows, gap, 1, null, fullChildrenOf)).toEqual({
      parentId: 'A',
      anchor: { id: 'A1', side: 'before' },
    });
  });

  it('the dragged subtree is excluded from that lookup too', () => {
    const gap = gapIndexFor(rows, 'B', 'before');
    expect(resolvePlacement(rows, gap, 1, null, fullChildrenOf, new Set(['A1']))).toEqual({
      parentId: 'A',
      anchor: { id: 'A2', side: 'before' },
    });
  });
});

// TC-18 — validity is per state, injected by the caller (production never
// enumerates a whole gap at once — the board/sidebar each resolve one depth
// per sample — so this drives the same two production functions a caller
// actually uses, `depthRangeFor` for the range and `resolvePlacement` per
// depth, rather than a test-only wrapper over them (Story 6.1 Phase 0,
// SW-3 — `tabStates`/`TabState` had no production caller and are gone).
describe('depthRangeFor + resolvePlacement — every reachable depth in a gap', () => {
  const rows = flattenHierarchy('P', childrenOf);

  it('enumerates every depth in the gap’s range with its resolved placement', () => {
    const gap = gapIndexFor(rows, 'S2', 'before');
    const { lo, hi } = depthRangeFor(rows, gap);
    const depths = [];
    for (let depth = lo; depth <= hi; depth++) depths.push(depth);
    expect(depths).toEqual([0, 1, 2, 3]);
    expect(resolvePlacement(rows, gap, 3, 'P', childrenOf)).toEqual({ parentId: 'S1a1', anchor: null });
  });

  it('validity is per state, decided by the caller from the resolved parentId — not per gap', () => {
    const gap = gapIndexFor(rows, 'S2', 'before');
    const { lo, hi } = depthRangeFor(rows, gap);
    // A depth-cap stand-in: only S1a1 itself (the deepest state's parent) is over cap.
    const isValid = (parentId: string | null) => parentId !== 'S1a1';
    const states = [];
    for (let depth = lo; depth <= hi; depth++) {
      const { parentId } = resolvePlacement(rows, gap, depth, 'P', childrenOf);
      states.push({ depth, valid: isValid(parentId) });
    }
    expect(states).toEqual([
      { depth: 0, valid: true },
      { depth: 1, valid: true },
      { depth: 2, valid: true },
      { depth: 3, valid: false },
    ]);
  });

  it('excludes the dragged subtree, so no depth can ever resolve a cycle', () => {
    // X = S1a, dragged with its own child S1a1 — both removed from candidacy.
    const exclude = new Set(['S1a', 'S1a1']);
    const withoutDraggedSubtree = flattenHierarchy('P', childrenOf, exclude);
    expect(withoutDraggedSubtree.map(r => r.id)).toEqual(['S1', 'S2']);
    const gap = gapIndexFor(withoutDraggedSubtree, 'S2', 'before');
    const { lo, hi } = depthRangeFor(withoutDraggedSubtree, gap);
    for (let depth = lo; depth <= hi; depth++) {
      const placement = resolvePlacement(withoutDraggedSubtree, gap, depth, 'P', childrenOf, exclude);
      expect(placement.parentId).not.toBe('S1a');
      expect(placement.anchor?.id).not.toBe('S1a1');
    }
  });
});

// Story 6.1 Phase 2 (L2-1): the depth step itself, generalized from the
// sidebar's own `computeProjection` (which used to spell this same formula
// a second time, `INDENT_WIDTH`/`null` root the only real differences) —
// the board's `useBoardDnd.ts::updateDescendantsProjection` and the
// sidebar's `ProjectSidebar.tsx` both call this now, supplying their own
// `indentPx`/`rootId`.
describe('computeProjection', () => {
  const rows = flattenHierarchy('P', childrenOf);
  const gap = gapIndexFor(rows, 'S2', 'before'); // between S1a1 (Top, depth 2) and S2 (Bottom, depth 0) — range 0..3

  it('resolves depth from the seed plus delta/indent, then the same placement resolvePlacement would', () => {
    const result = computeProjection(rows, gap, 2, 0, 10, 'P', childrenOf);
    expect(result).toEqual({ depth: 2, placement: { parentId: 'S1a', anchor: { id: 'S1a1', side: 'after' } } });
  });

  it('rounds the raw depth from deltaX/indentPx before clamping', () => {
    // 14px indent, a 20px rightward delta rounds to +1 step from the seed.
    const result = computeProjection(rows, gap, 1, 20, 14, 'P', childrenOf);
    expect(result.depth).toBe(2);
  });

  it("clamps to the gap's own hi when the delta pushes past it", () => {
    const result = computeProjection(rows, gap, 2, 500, 10, 'P', childrenOf); // huge rightward delta
    expect(result).toEqual({ depth: 3, placement: { parentId: 'S1a1', anchor: null } });
  });

  it("clamps to the gap's own lo when the delta pushes past it", () => {
    const result = computeProjection(rows, gap, 2, -500, 10, 'P', childrenOf); // huge leftward delta
    expect(result).toEqual({ depth: 0, placement: { parentId: 'P', anchor: { id: 'S1', side: 'after' } } });
  });

  it('excludes the dragged subtree from the resolved placement too', () => {
    const exclude = new Set(['S1a', 'S1a1']);
    const withoutDraggedSubtree = flattenHierarchy('P', childrenOf, exclude);
    const g = gapIndexFor(withoutDraggedSubtree, 'S2', 'before');
    const result = computeProjection(withoutDraggedSubtree, g, 0, 0, 10, 'P', childrenOf, exclude);
    expect(result).toEqual({ depth: 0, placement: { parentId: 'P', anchor: { id: 'S1', side: 'after' } } });
  });
});

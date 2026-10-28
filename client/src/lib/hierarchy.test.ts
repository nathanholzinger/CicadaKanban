import { describe, it, expect } from 'vitest';
import {
  byPositionThenCreatedAt,
  getAncestors,
  getDescendantIds,
  getDepth,
  getSubtree,
  isWithinDepthCap,
  buildParentOptions,
  sortedChildrenByParent,
  type Positioned,
  type TreeNode,
} from './hierarchy';

interface NamedNode extends TreeNode, Positioned {
  name: string;
}

// Tied on position and creation unless a case says otherwise, so a case that
// doesn't care about sibling order keeps the order it lists them in.
function node(id: string, parentId: string | null = null, position: number | null = null, createdAt = 0): NamedNode {
  return { id, parentId, position, createdAt, name: `Node ${id}` };
}

describe('getDescendantIds', () => {
  const nodes = [node('root'), node('a', 'root'), node('b', 'root'), node('a1', 'a'), node('a1x', 'a1'), node('other')];

  it('collects descendants through multiple levels', () => {
    expect(getDescendantIds('root', nodes)).toEqual(new Set(['a', 'b', 'a1', 'a1x']));
  });

  it('does not include the node itself or unrelated nodes', () => {
    const result = getDescendantIds('a', nodes);
    expect(result).toEqual(new Set(['a1', 'a1x']));
    expect(result.has('a')).toBe(false);
    expect(result.has('other')).toBe(false);
  });

  it('returns an empty set for a leaf', () => {
    expect(getDescendantIds('a1x', nodes)).toEqual(new Set());
  });

  it('is safe when the id does not exist in the collection', () => {
    expect(getDescendantIds('ghost', nodes)).toEqual(new Set());
  });

  it('terminates instead of looping forever when the data contains a parentId cycle', () => {
    const cyclic = [node('a', 'b'), node('b', 'a')];
    expect(getDescendantIds('a', cyclic)).toEqual(new Set(['b']));
  });
});

// The client half of the depth-cap math: `isWithinDepthCap` takes a target's
// depth and a dragged subtree's height. The board's drag-target classification
// reads the depth with `getDepth`, and the sidebar's over-cap cue passes its
// drag projection's depth; both read the height off `getSubtree`. Same counting
// convention as the server's `itemTree.ts::hierarchyDepth` and `subtreeHeight`
// (root = 1, leaf height = 0).
describe('getDepth', () => {
  const nodes = [node('root'), node('a', 'root'), node('b', 'root'), node('a1', 'a'), node('a1x', 'a1'), node('other')];

  it('a root is at depth 1; depth counts the ancestor chain', () => {
    expect(getDepth('root', nodes)).toBe(1);
    expect(getDepth('a', nodes)).toBe(2);
    expect(getDepth('a1x', nodes)).toBe(4);
  });

  it('a dangling parentId reads as a root; an unknown id is depth 1', () => {
    const orphan = [node('x', 'missing'), node('y', 'x')];
    expect(getDepth('x', orphan)).toBe(1);
    expect(getDepth('y', orphan)).toBe(2);
    expect(getDepth('ghost', orphan)).toBe(1);
  });

  // The walk stops at a revisit and never counts the node itself, as the server's
  // `itemTree.ts::ancestorsOf` does, so both sides read a cycle's depth alike.
  it('reads a parentId cycle once: the walk stops at a revisit', () => {
    const cyclic = [node('a', 'b'), node('b', 'a'), node('c', 'a')];
    expect(getDepth('a', cyclic)).toBe(2); // b, then a again
    expect(getDepth('c', cyclic)).toBe(3); // a, b, then a again
  });
});

describe('getSubtree', () => {
  const nodes = [node('root'), node('a', 'root'), node('b', 'root'), node('a1', 'a'), node('a1x', 'a1'), node('other')];

  it('names the descendants, and the subtree is the node and them', () => {
    const { descendantIds, subtreeIds } = getSubtree('a', nodes);
    expect(descendantIds).toEqual(new Set(['a1', 'a1x']));
    expect(subtreeIds).toEqual(new Set(['a', 'a1', 'a1x']));
  });

  it('a leaf has height 0; height is the deepest generation below', () => {
    expect(getSubtree('a1x', nodes).height).toBe(0);
    expect(getSubtree('a', nodes).height).toBe(2);
    expect(getSubtree('root', nodes).height).toBe(3); // via a -> a1 -> a1x, not the shorter b branch
  });

  it('a leaf, and an unknown id, are a subtree of themselves with height 0', () => {
    const leaf = getSubtree('a1x', nodes);
    expect(leaf.descendantIds).toEqual(new Set());
    expect(leaf.subtreeIds).toEqual(new Set(['a1x']));
    expect(getSubtree('ghost', nodes)).toEqual({ descendantIds: new Set(), subtreeIds: new Set(['ghost']), height: 0 });
  });

  it('terminates against a parentId cycle, the loop back to the node skipped', () => {
    const cyclic = [node('a', 'b'), node('b', 'a'), node('c', 'a')];
    const { descendantIds, subtreeIds, height } = getSubtree('a', cyclic);
    expect(descendantIds).toEqual(new Set(['b', 'c']));
    expect(subtreeIds).toEqual(new Set(['a', 'b', 'c']));
    expect(height).toBe(1); // b and c are one generation
  });
});

describe('sortedChildrenByParent', () => {
  const idsOf = (list: NamedNode[] | undefined) => list?.map(n => n.id);

  it('groups each node under its parent, roots under null, siblings by position then creation', () => {
    const byParent = sortedChildrenByParent([
      node('r2', null, 2),
      node('r1', null, 1),
      node('late', 'r1', 3, 1),
      node('early', 'r1', 1, 9),
      node('tied-b', 'r1', 2, 5),
      node('tied-a', 'r1', 2, 4),
    ]);
    expect(idsOf(byParent.get(null))).toEqual(['r1', 'r2']);
    expect(idsOf(byParent.get('r1'))).toEqual(['early', 'tied-a', 'tied-b', 'late']);
    expect(byParent.get('r2')).toBeUndefined();
  });

  it('keys a node whose parent is not in the list as a root, its own children still under it', () => {
    const byParent = sortedChildrenByParent([node('x', 'missing', 2), node('y', null, 1), node('x1', 'x')]);
    expect(idsOf(byParent.get(null))).toEqual(['y', 'x']);
    expect(idsOf(byParent.get('x'))).toEqual(['x1']);
    expect(byParent.has('missing')).toBe(false);
  });

  it('does not reorder the list it is given', () => {
    const given = [node('b', null, 2), node('a', null, 1)];
    sortedChildrenByParent(given);
    expect(given.map(n => n.id)).toEqual(['b', 'a']);
  });
});

// The depth rule once, for the board's drag classification and the sidebar's
// over-cap cue alike. Every case parameterizes on `cap` rather than a literal.
describe('isWithinDepthCap', () => {
  const CAP = 6;

  it('is the whole rule: D + 1 + h <= cap', () => {
    expect(isWithinDepthCap(1, 0, CAP)).toBe(true); // root target, leaf mover
    expect(isWithinDepthCap(CAP - 1, 0, CAP)).toBe(true); // exactly cap
    expect(isWithinDepthCap(CAP, 0, CAP)).toBe(false); // one deeper target
    expect(isWithinDepthCap(CAP - 1, 1, CAP)).toBe(false); // one more level under the mover
  });

  it('a target depth of 0, the sidebar’s virtual top, fits a mover up to cap - 1 levels tall', () => {
    expect(isWithinDepthCap(0, CAP - 1, CAP)).toBe(true);
    expect(isWithinDepthCap(0, CAP, CAP)).toBe(false);
  });
});

describe('TC-5a.5: byPositionThenCreatedAt', () => {
  const sorted = (nodes: NamedNode[]) => [...nodes].sort(byPositionThenCreatedAt).map(n => n.id);

  it('orders by position first, whatever the creation order', () => {
    expect(sorted([node('late', null, 2, 1), node('early', null, 1, 9)])).toEqual(['early', 'late']);
  });

  it('breaks an exact position tie by creation', () => {
    expect(sorted([node('b', null, 1, 20), node('a', null, 1, 10)])).toEqual(['a', 'b']);
  });

  it('counts a missing position as 0, ahead of a positive one whatever its creation', () => {
    expect(sorted([node('p', null, 0.5, 1), node('none', null, null, 999)])).toEqual(['none', 'p']);
  });

  it('treats a missing position and a stored 0 as the same', () => {
    expect(sorted([node('zero', null, 0, 2), node('none', null, null, 1)])).toEqual(['none', 'zero']);
  });
});

describe('getAncestors', () => {
  it('returns an empty array for a top-level node', () => {
    const root = node('root');
    expect(getAncestors(root, [root])).toEqual([]);
  });

  it('returns the parent for a node one level deep', () => {
    const parent = node('parent');
    const child = node('child', 'parent');
    expect(getAncestors(child, [parent, child])).toEqual([parent]);
  });

  it('returns ancestors root-first for a node three levels deep', () => {
    const grandparent = node('grandparent');
    const parent = node('parent', 'grandparent');
    const child = node('child', 'parent');
    expect(getAncestors(child, [grandparent, parent, child])).toEqual([grandparent, parent]);
  });

  it('does not throw when a parentId points to a node absent from the array', () => {
    const child = node('child', 'missing-parent');
    expect(getAncestors(child, [child])).toEqual([]);
  });

  it('terminates instead of looping forever when the data contains a parentId cycle', () => {
    const a = node('a', 'b');
    const b = node('b', 'a');
    expect(getAncestors(a, [a, b])).toEqual([b]);
  });
});

describe('buildParentOptions', () => {
  const nodes = [node('root'), node('a', 'root'), node('a1', 'a'), node('sibling', 'root')];

  it('excludes the current node and all of its descendants', () => {
    const options = buildParentOptions(nodes, 'a', n => n.name, '(none)');
    expect(options.map(o => o.value)).toEqual(['', 'root', 'sibling']);
  });

  it('starts with the none entry and applies labelOf', () => {
    const options = buildParentOptions(nodes, 'a1', n => n.name.toUpperCase(), 'Top level');
    expect(options[0]).toEqual({ value: '', label: 'Top level' });
    expect(options.find(o => o.value === 'root')?.label).toBe('NODE ROOT');
  });

  it('preserves the input order of the remaining nodes', () => {
    const options = buildParentOptions(nodes, 'a1', n => n.name, '(none)');
    expect(options.map(o => o.value)).toEqual(['', 'root', 'a', 'sibling']);
  });
});

describe('buildParentOptions with indent', () => {
  // Deliberately out of tree order, to prove grouping (not flat input order)
  // drives output — a node always lands under its parent even when the
  // parent appears later in `nodes`. Siblings tied on position and creation
  // keep their input order.
  const nodes = [node('a1', 'a'), node('sibling', 'root'), node('root'), node('a', 'root'), node('a1x', 'a1')];

  it('groups each node directly under its parent, depth-first', () => {
    const options = buildParentOptions(nodes, 'ghost', n => n.name, '(none)', true);
    expect(options.map(o => o.value)).toEqual(['', 'root', 'sibling', 'a', 'a1', 'a1x']);
  });

  it('prefixes labels with a · per depth level, root unprefixed', () => {
    const options = buildParentOptions(nodes, 'ghost', n => n.name, '(none)', true);
    expect(options.find(o => o.value === 'root')?.label).toBe('Node root');
    expect(options.find(o => o.value === 'a')?.label).toBe('· Node a');
    expect(options.find(o => o.value === 'a1')?.label).toBe('·· Node a1');
    expect(options.find(o => o.value === 'a1x')?.label).toBe('··· Node a1x');
  });

  it('excludes the current node and its descendants, and their subtree is skipped entirely', () => {
    const options = buildParentOptions(nodes, 'a', n => n.name, '(none)', true);
    expect(options.map(o => o.value)).toEqual(['', 'root', 'sibling']);
  });

  it('treats a node with a dangling parentId as a root', () => {
    const orphan = [...nodes, node('orphan', 'does-not-exist')];
    const options = buildParentOptions(orphan, 'ghost', n => n.name, '(none)', true);
    expect(options.map(o => o.value)).toEqual(['', 'root', 'sibling', 'a', 'a1', 'a1x', 'orphan']);
  });

  // The sidebar draws siblings in this order, and a reorder there changes only
  // their positions, so the dropdown reads them, not the order it was handed.
  it('lists siblings by position, then creation, not by the order of `nodes`', () => {
    const reordered = [
      node('root', null, 1),
      node('last', 'root', 3, 1),
      node('first', 'root', 1, 9),
      node('tied-late', 'root', 2, 5),
      node('tied-early', 'root', 2, 4),
      node('first-child', 'first', 1),
    ];
    const options = buildParentOptions(reordered, 'ghost', n => n.name, '(none)', true);
    expect(options.map(o => o.value)).toEqual(['', 'root', 'first', 'first-child', 'tied-early', 'tied-late', 'last']);
  });
});

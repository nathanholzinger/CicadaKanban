import { describe, it, expect } from 'vitest';
import { getAncestors, getDescendantIds, buildParentOptions, type TreeNode } from './hierarchy';

interface NamedNode extends TreeNode {
  name: string;
}

function node(id: string, parentId: string | null = null): NamedNode {
  return { id, parentId, name: `Node ${id}` };
}

describe('getDescendantIds', () => {
  const nodes = [
    node('root'),
    node('a', 'root'),
    node('b', 'root'),
    node('a1', 'a'),
    node('a1x', 'a1'),
    node('other'),
  ];

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
});

describe('buildParentOptions', () => {
  const nodes = [
    node('root'),
    node('a', 'root'),
    node('a1', 'a'),
    node('sibling', 'root'),
  ];

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
  // parent appears later in `nodes`. Sibling order within a group still
  // follows input order.
  const nodes = [
    node('a1', 'a'),
    node('sibling', 'root'),
    node('root'),
    node('a', 'root'),
    node('a1x', 'a1'),
  ];

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
});

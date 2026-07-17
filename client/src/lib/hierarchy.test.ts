import { describe, it, expect } from 'vitest';
import { getDescendantIds, buildParentOptions, type TreeNode } from './hierarchy';

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

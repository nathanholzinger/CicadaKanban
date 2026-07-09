import { describe, it, expect } from 'vitest';
import { getAncestors } from './App';
import type { Project } from './types';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    parentId: null,
    name: 'Project',
    description: null,
    position: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('getAncestors', () => {
  it('returns an empty array for a top-level project', () => {
    const project = makeProject({ id: 'root', parentId: null });
    expect(getAncestors(project, [project])).toEqual([]);
  });

  it('returns the parent for a project one level deep', () => {
    const parent = makeProject({ id: 'parent', parentId: null });
    const child = makeProject({ id: 'child', parentId: 'parent' });
    expect(getAncestors(child, [parent, child])).toEqual([parent]);
  });

  it('returns ancestors root-first for a project three levels deep', () => {
    const grandparent = makeProject({ id: 'grandparent', parentId: null });
    const parent = makeProject({ id: 'parent', parentId: 'grandparent' });
    const child = makeProject({ id: 'child', parentId: 'parent' });
    const all = [grandparent, parent, child];
    expect(getAncestors(child, all)).toEqual([grandparent, parent]);
  });

  it('does not throw when a parentId points to a project absent from the array', () => {
    const child = makeProject({ id: 'child', parentId: 'missing-parent' });
    expect(getAncestors(child, [child])).toEqual([]);
  });
});

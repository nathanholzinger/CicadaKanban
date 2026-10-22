// makeProject: the one Project factory for tests, so a field added to `Project` lands here
// and nowhere else. A top-level project named after its id, with no position; override
// whatever the case is about.

import type { Project } from '../types';

export function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    parentId: null,
    name: id,
    description: null,
    position: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

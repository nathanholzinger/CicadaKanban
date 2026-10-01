// makeItem: the one Item factory for tests. Never hand-write a 15-field Item literal.

import type { Item } from '../types';

// positionScope is server-computed in production (never hand-set by a
// caller) — derived here from isAttached/parentId the same way the API
// does, so fixtures stay consistent with real data instead of every test
// separately tracking two things that always agree. The flag defaults to a
// child's state: set with a parent, clear without (wiki item-attachment §1).
// An explicit override still wins, for tests about the field itself.
export function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  const parentId = overrides.parentId ?? null;
  const isAttached = overrides.isAttached ?? (parentId ? 1 : 0);
  return {
    id,
    type: null,
    parentId,
    projectId: 'p1',
    workphaseId: 'todo',
    title: `Item ${id}`,
    description: null,
    position: null,
    assigneeType: null,
    agentId: null,
    isAttached,
    createdAt: 0,
    updatedAt: 0,
    completedAt: null,
    positionScope: isAttached && parentId ? 'attached-siblings' : 'workflow',
    ...overrides,
  };
}

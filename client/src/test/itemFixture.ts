// makeItem: the one Item factory for tests. Never hand-write a 15-field Item literal.

import type { Item } from '../types';

// positionScope is server-computed in production (never hand-set by a caller). The
// fixture derives it from isAttached/parentId, so a test doesn't track two things that
// always agree: an attached item with a parent is 'attached-siblings', any other
// 'workflow'. It is never 'none', which the API gives an item in a terminal workphase
// (wiki item-positioning §2), since the fixture knows no workphase's terminality.
// isAttached defaults to a child's state: set with a parent, clear without
// (wiki item-attachment §1, §14). An explicit override still wins, for tests about
// the field itself.
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

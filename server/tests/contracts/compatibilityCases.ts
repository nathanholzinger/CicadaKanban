// Transport examples shared by route characterization and candidate validators. Bodies stay
// independent of a schema library; the captured route outcomes include database-dependent failures.

export type FixtureName =
  | 'project'
  | 'foreignProject'
  | 'movingProject'
  | 'prevProject'
  | 'nextProject'
  | 'childProject'
  | 'workflow'
  | 'foreignWorkflow'
  | 'todo'
  | 'active'
  | 'done'
  | 'foreignPhase'
  | 'prevItem'
  | 'movingItem'
  | 'nextItem'
  | 'parentItem'
  | 'attachedChild'
  | 'detachedChild'
  | 'anchorChild'
  | 'unsortedItem'
  | 'doneItem'
  | 'foreignItem';

export type FixtureIds = Record<FixtureName, string>;
export type FixtureVariant = 'ordinary' | 'item-reindex' | 'project-reindex' | 'project-null-anchor' | 'foreign-item';
type JsonBody = Record<string, unknown> | unknown[];

export interface CompatibilityCase {
  name: string;
  method: 'get' | 'patch';
  path: (ids: FixtureIds) => string;
  body?: (ids: FixtureIds) => JsonBody;
  rawBody?: string;
  fixture?: FixtureVariant;
  status: number;
}

const itemMove = (
  name: string,
  body: (ids: FixtureIds) => JsonBody,
  status = 400,
  target: FixtureName | 'missing' = 'movingItem',
  fixture: FixtureVariant = 'ordinary',
): CompatibilityCase => ({
  name,
  method: 'patch',
  path: ids => `/api/items/${target === 'missing' ? 'missing' : ids[target]}/move`,
  body,
  status,
  fixture,
});

const projectMove = (
  name: string,
  body: (ids: FixtureIds) => JsonBody,
  status = 400,
  target: FixtureName | 'missing' = 'movingProject',
  fixture: FixtureVariant = 'ordinary',
): CompatibilityCase => ({
  name,
  method: 'patch',
  path: ids => `/api/projects/${target === 'missing' ? 'missing' : ids[target]}/move`,
  body,
  status,
  fixture,
});

export const compatibilityCases: CompatibilityCase[] = [
  itemMove('item empty body', () => ({})),
  itemMove('item unknown fields alone do not express intent', () => ({ surprise: true })),
  itemMove('item unknown fields ignored alongside workphase', f => ({ workphaseId: f.active, surprise: true }), 200),
  itemMove(
    'ATT-1.3, ATT-1.6, TC-2.24: item workphase-only cascades attached descendants and notifies',
    f => ({ workphaseId: f.active }),
    200,
  ),
  itemMove('ATT-9.11: item explicit null workphase clears it', () => ({ workphaseId: null }), 200),
  itemMove(
    'TC-6.1, TC-6.3: item terminal workphase clears position and sets completion',
    f => ({ workphaseId: f.done }),
    200,
  ),
  itemMove(
    'TC-6.2, TC-6.9: item reopening appends and clears completion',
    f => ({ workphaseId: f.todo }),
    200,
    'doneItem',
  ),
  itemMove(
    'ATT-9.1: item attached child rejects explicit null workphase',
    () => ({ workphaseId: null }),
    400,
    'attachedChild',
  ),
  itemMove(
    'ATT-7.1, ATT-9.4: item detach keeps parent and takes shown workphase',
    () => ({ isAttached: false }),
    200,
    'attachedChild',
  ),
  itemMove('ATT-7.7, ATT-9.5: item null parent clears attachment', () => ({ parentId: null }), 200, 'attachedChild'),
  itemMove('ATT-3.11: item reparent without flag stays free', f => ({ parentId: f.parentItem }), 200),
  itemMove(
    'TC-7.11: item attach and anchor use resulting sibling scope',
    f => ({
      parentId: f.parentItem,
      isAttached: true,
      anchorId: f.anchorChild,
      side: 'after',
    }),
    200,
  ),
  itemMove('item anchor-only intent requires side', f => ({ anchorId: f.prevItem })),
  itemMove('item side alone is not intent', () => ({ side: 'after' })),
  itemMove('item invalid side ignored without anchor', f => ({ workphaseId: f.todo, side: 'sideways' }), 200),
  itemMove('TC-2.34: item empty anchor is a missing row', () => ({ anchorId: '', side: 'after' })),
  itemMove('item null anchor is not omission', () => ({ anchorId: null, side: 'after' })),
  itemMove('item numeric anchor reaches row lookup', () => ({ anchorId: 42, side: 'after' })),
  itemMove('item object anchor reaches binding error', () => ({ anchorId: {}, side: 'after' }), 500),
  itemMove('TC-X.6: item self anchor refused', f => ({ anchorId: f.movingItem, side: 'before' })),
  itemMove('TC-7.10: item foreign anchor refused by scope', f => ({ anchorId: f.foreignItem, side: 'after' })),
  itemMove('item done anchor refused by scope before missing position', f => ({ anchorId: f.doneItem, side: 'after' })),
  itemMove('TC-2.5: item before anchor resolves position', f => ({ anchorId: f.prevItem, side: 'before' }), 200),
  itemMove(
    'TC-5.2, TC-5.9: item append after large anchor discloses reindex',
    f => ({ anchorId: f.nextItem, side: 'after' }),
    200,
    'movingItem',
    'item-reindex',
  ),
  itemMove(
    'item nonempty legacy scope array provides intent even with null element',
    () => ({ scopeWorkphaseIds: [null] }),
    200,
  ),
  itemMove('item empty legacy scope array does not provide intent', () => ({ scopeWorkphaseIds: [] })),
  itemMove('item legacy scope string does not provide intent', f => ({ scopeWorkphaseIds: f.todo })),
  itemMove(
    'item invalid legacy scope ignored with explicit intent',
    f => ({ workphaseId: f.todo, scopeWorkphaseIds: 9 }),
    200,
  ),
  itemMove('TC-2.32: item explicit position wins over other faults', () => ({
    position: null,
    parentId: 4,
    isAttached: 'yes',
  })),
  itemMove('item parent shape wins over flag and phase shapes', () => ({
    parentId: 4,
    isAttached: 'yes',
    workphaseId: 9,
  })),
  itemMove('item flag shape wins over phase shape', () => ({ isAttached: null, workphaseId: 9 })),
  itemMove('item phase shape wins over missing side', f => ({ workphaseId: 9, anchorId: f.prevItem })),
  itemMove('item missing side wins over nonexistent phase', f => ({ workphaseId: 'missing', anchorId: f.prevItem })),
  itemMove('item nonexistent phase wins over nonexistent parent', () => ({
    workphaseId: 'missing',
    parentId: 'missing',
  })),
  itemMove('item nonexistent parent wins over parentless attach', () => ({ parentId: 'missing', isAttached: true })),
  itemMove('ATT-1.8: item parentless attach refused', () => ({ isAttached: true })),
  itemMove('ATT-9.8: item foreign workphase refused', f => ({ workphaseId: f.foreignPhase })),
  itemMove('item missing target wins over malformed fields', () => ({ position: 4, isAttached: null }), 404, 'missing'),
  itemMove('item array body has no intent', () => []),
  {
    name: 'item missing body reaches global error handler',
    method: 'patch',
    path: f => `/api/items/${f.movingItem}/move`,
    status: 500,
  },
  {
    name: 'item JSON null rejected by body parser',
    method: 'patch',
    path: f => `/api/items/${f.movingItem}/move`,
    rawBody: 'null',
    status: 500,
  },
  {
    name: 'item malformed JSON rejected by body parser',
    method: 'patch',
    path: f => `/api/items/${f.movingItem}/move`,
    rawBody: '{',
    status: 500,
  },
  projectMove('TREE-6.2: project empty body appends', () => ({}), 200),
  projectMove('project unknown fields alone still append', () => ({ surprise: true }), 200),
  projectMove('project array body appends', () => [], 200),
  projectMove('TREE-6.2: project both null neighbors append', () => ({ prevId: null, nextId: null }), 200),
  projectMove(
    'project prev selects neighbor and ignores missing next row',
    f => ({ prevId: f.prevProject, nextId: 'missing' }),
    200,
  ),
  projectMove(
    'project prev selects neighbor and ignores empty next row',
    f => ({ prevId: f.prevProject, nextId: '' }),
    200,
  ),
  projectMove('project unused next still gets type checked', f => ({ prevId: f.prevProject, nextId: 42 })),
  projectMove('project invalid selected prev does not fall back to next', f => ({
    prevId: 'missing',
    nextId: f.nextProject,
  })),
  projectMove('TREE-6.1: project null prev permits next neighbor', f => ({ prevId: null, nextId: f.nextProject }), 200),
  projectMove('project explicit null parent makes root', () => ({ parentId: null }), 200, 'childProject'),
  projectMove('TREE-6.2: project reparent appends in resulting sibling group', f => ({ parentId: f.project }), 200),
  projectMove('TREE-6.6: project explicit position wins over all field shapes', () => ({
    position: null,
    prevId: 3,
    nextId: 4,
    parentId: 5,
  })),
  projectMove('project prev shape wins over next and parent', () => ({ prevId: false, nextId: 4, parentId: 5 })),
  projectMove('project next shape wins over parent', () => ({ nextId: false, parentId: 5 })),
  projectMove('project missing parent wins over missing neighbor', () => ({ parentId: 'missing', prevId: 'missing' })),
  projectMove('TREE-3.10: project empty parent names missing row', () => ({ parentId: '' })),
  projectMove('TREE-6.5: project self neighbor refused', f => ({ prevId: f.movingProject })),
  projectMove('TREE-6.3: project neighbor outside resulting scope refused', f => ({
    parentId: f.project,
    prevId: f.prevProject,
  })),
  projectMove(
    'TREE-6.3: project neighbor without position refused',
    f => ({ prevId: f.prevProject }),
    400,
    'movingProject',
    'project-null-anchor',
  ),
  projectMove(
    'TREE-4.5: project append after large neighbor discloses reindex',
    f => ({ prevId: f.nextProject }),
    200,
    'movingProject',
    'project-reindex',
  ),
  projectMove(
    'project missing target wins over malformed fields',
    () => ({ position: null, prevId: false }),
    404,
    'missing',
  ),
  {
    name: 'project missing body reaches global error handler',
    method: 'patch',
    path: f => `/api/projects/${f.movingProject}/move`,
    status: 500,
  },
  {
    name: 'item detail includes children activity workflow and depths',
    method: 'get',
    path: f => `/api/items/${f.movingItem}`,
    status: 200,
  },
  {
    name: 'TC-2.13: attached item detail has sibling scope and depth',
    method: 'get',
    path: f => `/api/items/${f.attachedChild}`,
    status: 200,
  },
  {
    name: 'TC-2.16: unsorted item detail has null workflow and no scope',
    method: 'get',
    path: f => `/api/items/${f.unsortedItem}`,
    status: 200,
  },
  {
    name: 'TC-2.15: done item detail has completion and no scope',
    method: 'get',
    path: f => `/api/items/${f.doneItem}`,
    status: 200,
  },
  {
    name: 'TC-7.18: foreign item detail derives stored workflow but no scope',
    method: 'get',
    path: f => `/api/items/${f.movingItem}`,
    fixture: 'foreign-item',
    status: 200,
  },
  {
    name: 'missing item detail returns 404 without ID format validation',
    method: 'get',
    path: () => '/api/items/not-a-uuid',
    status: 404,
  },
  { name: 'workflow list without filter', method: 'get', path: () => '/api/workflows', status: 200 },
  {
    name: 'workflow list filters by project',
    method: 'get',
    path: f => `/api/workflows?projectId=${f.project}`,
    status: 200,
  },
  {
    name: 'workflow list empty filter means no filter',
    method: 'get',
    path: () => '/api/workflows?projectId=',
    status: 200,
  },
  {
    name: 'workflow list nonexistent project returns empty list',
    method: 'get',
    path: () => '/api/workflows?projectId=missing',
    status: 200,
  },
  {
    name: 'workflow list repeated project filter stringifies array',
    method: 'get',
    path: f => `/api/workflows?projectId=${f.project}&projectId=${f.foreignProject}`,
    status: 200,
  },
  {
    name: 'workflow list bracket key is an unknown parameter',
    method: 'get',
    path: f => `/api/workflows?projectId[x]=${f.project}`,
    status: 200,
  },
  {
    name: 'workflow list ignores unknown query parameter',
    method: 'get',
    path: () => '/api/workflows?surprise=1',
    status: 200,
  },
];

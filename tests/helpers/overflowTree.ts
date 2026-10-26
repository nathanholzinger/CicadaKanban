import type { APIRequestContext, Page } from '@playwright/test';
import { pickWorkphases, seedItem, seedTemplatedWorkflow } from './seed';
import { DRAG_REGION_ATTR, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

// The tree of the overflow-row and hierarchy-modal cases, with the section at its default of
// three levels. Card `P` in Todo holds A, then B, then X. A holds Q, which holds R and T; R holds
// R1 (which holds R1a) and R2, and has a Free child F; T has only a Free child G. So the section's
// rows are A, Q, R, R's overflow row, T, B and X, and the modal's are A, Q, R, R1, R1a, R2, T, B
// and X.
export async function seedOverflowTree(request: APIRequestContext, name: string) {
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const child = (title: string, parent: { id: string }) => seedItem(request, { title, parentId: parent.id });
  const free = (title: string, parent: { id: string }) =>
    seedItem(request, { title, parentId: parent.id, isAttached: false, workphaseId: todo.id });
  const a = await child('A', p);
  const q = await child('Q', a);
  const r = await child('R', q);
  const t = await child('T', q);
  const r1 = await child('R1', r);
  const r2 = await child('R2', r);
  const r1a = await child('R1a', r1);
  const f = await free('F', r);
  const g = await free('G', t);
  const b = await child('B', p);
  const x = await child('X', p);
  return { project, workflow, todo, p, a, q, r, t, r1, r2, r1a, f, g, b, x };
}

// The ids of what P's section draws, in order: an item's id, or `overflow:<owner id>`.
export async function sectionRows(page: Page, cardId: string): Promise<string[]> {
  const section = page.locator(`[${DRAG_REGION_ATTR}="${descendantsRegionKey(cardId)}"]`);
  return section
    .locator('[data-item-id], [data-overflow-row]')
    .evaluateAll(els =>
      els.map(el => el.getAttribute('data-item-id') ?? `overflow:${el.getAttribute('data-overflow-row')}`),
    );
}

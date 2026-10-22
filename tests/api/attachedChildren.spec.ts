import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { API as BASE } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, moveItem, fetchItem } from '../helpers/seed';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('attached child inherits parent workphase on create and follows on move; detached child does not', async ({
  request,
}) => {
  const { project, workflow } = await seedTemplatedWorkflow(request, 'Cascade Move Project');
  const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');

  const parent = await seedItem(request, { title: 'Parent', projectId: project.id, workphaseId: todo.id });

  const attachedChild = await seedItem(request, { title: 'Attached Child', parentId: parent.id });
  expect(attachedChild.workphaseId).toBe(todo.id);
  expect(attachedChild.isAttached).toBe(1);

  const detachedChild = await seedItem(request, {
    title: 'Detached Child',
    parentId: parent.id,
    isAttached: false,
    workphaseId: todo.id,
  });
  expect(detachedChild.isAttached).toBe(0);

  // Move the parent — attached child follows, detached child stays put.
  await moveItem(request, parent.id, { workphaseId: inProgress.id });

  const movedAttached = await fetchItem(request, attachedChild.id);
  expect(movedAttached.workphaseId).toBe(inProgress.id);

  const movedDetached = await fetchItem(request, detachedChild.id);
  expect(movedDetached.workphaseId).toBe(todo.id);
});

test("reattaching a child snaps it to the parent's current workphase", async ({ request }) => {
  const { project, workflow } = await seedTemplatedWorkflow(request, 'Reattach Project');
  const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');

  const parent = await seedItem(request, { title: 'Parent', projectId: project.id, workphaseId: inProgress.id });
  const child = await seedItem(request, {
    title: 'Child',
    parentId: parent.id,
    isAttached: false,
    workphaseId: todo.id,
  });

  const reattached = await (await request.put(`${BASE}/items/${child.id}`, { data: { isAttached: true } })).json();
  expect(reattached.workphaseId).toBe(inProgress.id);
});

test('rejects reparenting an item to its own descendant', async ({ request }) => {
  const { project } = await seedTemplatedWorkflow(request, 'Cycle Guard Project');

  const root = await seedItem(request, { title: 'Root', projectId: project.id });
  const child = await seedItem(request, { title: 'Child', parentId: root.id });
  const grandchild = await seedItem(request, { title: 'Grandchild', parentId: child.id });

  const res = await request.put(`${BASE}/items/${root.id}`, { data: { parentId: grandchild.id } });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/descendant/i);
});

test('rejects an item being its own parent', async ({ request }) => {
  const { project } = await seedTemplatedWorkflow(request, 'Self Parent Project');
  const item = await seedItem(request, { title: 'Solo', projectId: project.id });

  const res = await request.put(`${BASE}/items/${item.id}`, { data: { parentId: item.id } });
  expect(res.status()).toBe(400);
});

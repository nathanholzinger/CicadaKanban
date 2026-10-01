import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { API as BASE } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases } from '../helpers/seed';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('attached child inherits parent workphase on create and follows on move; detached child does not', async ({
  request,
}) => {
  const { project, workflow } = await seedTemplatedWorkflow(request, 'Cascade Move Project');
  const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');

  const parent = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Parent', projectId: project.id, workphaseId: todo.id },
    })
  ).json();

  const attachedChild = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Attached Child', parentId: parent.id },
    })
  ).json();
  expect(attachedChild.workphaseId).toBe(todo.id);
  expect(attachedChild.isAttached).toBe(1);

  const detachedChild = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Detached Child', parentId: parent.id, isAttached: false, workphaseId: todo.id },
    })
  ).json();
  expect(detachedChild.isAttached).toBe(0);

  // Move the parent — attached child follows, detached child stays put.
  await request.patch(`${BASE}/items/${parent.id}/move`, { data: { workphaseId: inProgress.id } });

  const movedAttached = await (await request.get(`${BASE}/items/${attachedChild.id}`)).json();
  expect(movedAttached.workphaseId).toBe(inProgress.id);

  const movedDetached = await (await request.get(`${BASE}/items/${detachedChild.id}`)).json();
  expect(movedDetached.workphaseId).toBe(todo.id);
});

test("reattaching a child snaps it to the parent's current workphase", async ({ request }) => {
  const { project, workflow } = await seedTemplatedWorkflow(request, 'Reattach Project');
  const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');

  const parent = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Parent', projectId: project.id, workphaseId: inProgress.id },
    })
  ).json();
  const child = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Child', parentId: parent.id, isAttached: false, workphaseId: todo.id },
    })
  ).json();

  const reattached = await (await request.put(`${BASE}/items/${child.id}`, { data: { isAttached: true } })).json();
  expect(reattached.workphaseId).toBe(inProgress.id);
});

test('rejects reparenting an item to its own descendant', async ({ request }) => {
  const { project } = await seedTemplatedWorkflow(request, 'Cycle Guard Project');

  const root = await (await request.post(`${BASE}/items`, { data: { title: 'Root', projectId: project.id } })).json();
  const child = await (await request.post(`${BASE}/items`, { data: { title: 'Child', parentId: root.id } })).json();
  const grandchild = await (
    await request.post(`${BASE}/items`, { data: { title: 'Grandchild', parentId: child.id } })
  ).json();

  const res = await request.put(`${BASE}/items/${root.id}`, { data: { parentId: grandchild.id } });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/descendant/i);
});

test('rejects an item being its own parent', async ({ request }) => {
  const { project } = await seedTemplatedWorkflow(request, 'Self Parent Project');
  const item = await (await request.post(`${BASE}/items`, { data: { title: 'Solo', projectId: project.id } })).json();

  const res = await request.put(`${BASE}/items/${item.id}`, { data: { parentId: item.id } });
  expect(res.status()).toBe(400);
});

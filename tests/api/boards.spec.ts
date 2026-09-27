import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { API as BASE } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases } from '../helpers/seed';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('creating a workflow bootstraps one board with 1:1 merged columns', async ({ request }) => {
  const { workflow } = await seedTemplatedWorkflow(request, 'Board Bootstrap Project');

  const res = await request.get(`${BASE}/boards?workflowId=${workflow.id}`);
  expect(res.ok()).toBeTruthy();
  const boards = await res.json();
  expect(boards.length).toBe(1);

  const detail = await (await request.get(`${BASE}/boards/${boards[0].id}`)).json();
  expect(detail.columns.map((c: { displayName: string }) => c.displayName)).toEqual([
    'Todo',
    'In Progress',
    'Review',
    'Done',
  ]);
  expect(detail.columns.every((c: { displayMode: string }) => c.displayMode === 'merged')).toBe(true);
});

test('GET /api/boards/:id returns the resolved column shape with items and unsorted state', async ({ request }) => {
  const { project, workflow } = await seedTemplatedWorkflow(request, 'Board Shape Project');
  const [todo] = pickWorkphases(workflow, 'Todo');

  const item = await (
    await request.post(`${BASE}/items`, {
      data: { title: 'Shape Item', projectId: project.id, workphaseId: todo.id },
    })
  ).json();

  const boards = await (await request.get(`${BASE}/boards?workflowId=${workflow.id}`)).json();
  const board = await (await request.get(`${BASE}/boards/${boards[0].id}`)).json();

  const todoCol = board.columns.find((c: { displayName: string }) => c.displayName === 'Todo');
  expect(todoCol.broken).toBe(false);
  expect(todoCol.entryWorkphaseId).toBe(todo.id);
  expect(todoCol.subRows[0].workphase.id).toBe(todo.id);
  expect(todoCol.subRows[0].items.map((i: { id: string }) => i.id)).toEqual([item.id]);
  expect(board.unsorted.needsAttention).toBe(false);
  expect(board.unsorted.uncovered).toEqual([]);
});

test('deleting the last remaining board is rejected; a non-last board deletes cleanly', async ({ request }) => {
  const { workflow } = await seedTemplatedWorkflow(request, 'Board Delete Project');
  const boards = await (await request.get(`${BASE}/boards?workflowId=${workflow.id}`)).json();

  const last = await request.delete(`${BASE}/boards/${boards[0].id}`);
  expect(last.status()).toBe(409);

  const second = await (
    await request.post(`${BASE}/boards`, {
      data: { workflowId: workflow.id, name: 'Second Board' },
    })
  ).json();
  const del = await request.delete(`${BASE}/boards/${second.id}`);
  expect(del.status()).toBe(204);

  const remaining = await (await request.get(`${BASE}/boards?workflowId=${workflow.id}`)).json();
  expect(remaining.map((b: { id: string }) => b.id)).not.toContain(second.id);
});

test('PUT /api/boards/:id persists rename and the showAttachedChildren toggle', async ({ request }) => {
  const { workflow } = await seedTemplatedWorkflow(request, 'Board Update Project');
  const boards = await (await request.get(`${BASE}/boards?workflowId=${workflow.id}`)).json();
  expect(boards[0].showAttachedChildren).toBe(1); // migration 0007 default

  const res = await request.put(`${BASE}/boards/${boards[0].id}`, {
    data: { name: 'Renamed View', showAttachedChildren: false },
  });
  expect(res.ok()).toBeTruthy();

  const updated = await (await request.get(`${BASE}/boards/${boards[0].id}`)).json();
  expect(updated.name).toBe('Renamed View');
  expect(updated.showAttachedChildren).toBe(0);
});

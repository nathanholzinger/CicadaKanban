import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

const BASE = 'http://localhost:3002/api';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('POST /api/projects creates a project', async ({ request }) => {
  const res = await request.post(`${BASE}/projects`, {
    data: { name: 'New Project', description: 'A test project' },
  });
  expect(res.status()).toBe(201);
  const project = await res.json();
  expect(project.name).toBe('New Project');
  expect(project.description).toBe('A test project');
  expect(project.id).toBeTruthy();
  expect(project.parentId).toBeNull();
});

test('POST /api/projects supports nested subprojects via parentId', async ({ request }) => {
  const parentRes = await request.post(`${BASE}/projects`, { data: { name: 'Parent' } });
  const parent = await parentRes.json();

  const childRes = await request.post(`${BASE}/projects`, {
    data: { name: 'Child', parentId: parent.id },
  });
  expect(childRes.status()).toBe(201);
  const child = await childRes.json();
  expect(child.parentId).toBe(parent.id);
});

test('GET /api/projects/:id returns project with its workflows', async ({ request }) => {
  const projectRes = await request.post(`${BASE}/projects`, { data: { name: 'Project With Workflow' } });
  const project = await projectRes.json();

  const templatesRes = await request.get(`${BASE}/workflow-templates`);
  const templates = await templatesRes.json();
  const flow = templates.find((t: { name: string }) => t.name === 'flow');

  await request.post(`${BASE}/workflows`, {
    data: { name: 'My Workflow', projectId: project.id, templateId: flow.id },
  });

  const res = await request.get(`${BASE}/projects/${project.id}`);
  expect(res.status()).toBe(200);
  const detail = await res.json();
  expect(detail.id).toBe(project.id);
  expect(Array.isArray(detail.workflows)).toBe(true);
  expect(detail.workflows).toHaveLength(1);
  expect(detail.workflows[0].name).toBe('My Workflow');
});

test('PUT /api/projects/:id updates name and description', async ({ request }) => {
  const createRes = await request.post(`${BASE}/projects`, { data: { name: 'Old Name' } });
  const project = await createRes.json();

  const updateRes = await request.put(`${BASE}/projects/${project.id}`, {
    data: { name: 'New Name', description: 'Updated' },
  });
  expect(updateRes.status()).toBe(200);
  const updated = await updateRes.json();
  expect(updated.name).toBe('New Name');
  expect(updated.description).toBe('Updated');
});

test('PUT /api/projects/:id rejects setting a project as its own parent', async ({ request }) => {
  const { id } = await (await request.post(`${BASE}/projects`, { data: { name: 'Self Parent Test' } })).json();

  const res = await request.put(`${BASE}/projects/${id}`, { data: { parentId: id } });

  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/own parent/i);
});

test('PUT /api/projects/:id rejects setting a descendant as parent', async ({ request }) => {
  const parent = await (await request.post(`${BASE}/projects`, { data: { name: 'Cycle Parent' } })).json();
  const child = await (await request.post(`${BASE}/projects`, { data: { name: 'Cycle Child', parentId: parent.id } })).json();

  const res = await request.put(`${BASE}/projects/${parent.id}`, { data: { parentId: child.id } });

  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/descendant/i);
});

test('DELETE /api/projects/:id cascades to workflows, columns, and items', async ({ request }) => {
  const projectRes = await request.post(`${BASE}/projects`, { data: { name: 'Doomed Project' } });
  const project = await projectRes.json();

  const templatesRes = await request.get(`${BASE}/workflow-templates`);
  const templates = await templatesRes.json();
  const quick = templates.find((t: { name: string }) => t.name === 'quick');

  const workflowRes = await request.post(`${BASE}/workflows`, {
    data: { name: 'Doomed Workflow', projectId: project.id, templateId: quick.id },
  });
  const workflow = await workflowRes.json();
  const todoCol = workflow.columns.find((c: { name: string }) => c.name === 'Todo');

  await request.post(`${BASE}/items`, {
    data: { title: 'Doomed Item', projectId: project.id, columnId: todoCol.id },
  });

  const deleteRes = await request.delete(`${BASE}/projects/${project.id}`);
  expect(deleteRes.status()).toBe(204);

  const workflowCheck = await request.get(`${BASE}/workflows/${workflow.id}`);
  expect(workflowCheck.status()).toBe(404);
});

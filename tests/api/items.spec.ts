import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

const BASE = 'http://localhost:3002/api';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('POST /api/items creates item with projectId; GET returns derived workflowId', async ({ request }) => {
  const projectRes = await request.post(`${BASE}/projects`, { data: { name: 'Item Test Project' } });
  const project = await projectRes.json();

  const templatesRes = await request.get(`${BASE}/workflow-templates`);
  const templates = await templatesRes.json();
  const quick = templates.find((t: { name: string }) => t.name === 'quick');

  const workflowRes = await request.post(`${BASE}/workflows`, {
    data: { name: 'Item Workflow', projectId: project.id, templateId: quick.id },
  });
  const workflow = await workflowRes.json();
  const todoPhase = workflow.workphases.find((p: { name: string }) => p.name === 'Todo');

  const itemRes = await request.post(`${BASE}/items`, {
    data: { title: 'Test Item', projectId: project.id, workphaseId: todoPhase.id },
  });
  expect(itemRes.status()).toBe(201);
  const item = await itemRes.json();
  expect(item.projectId).toBe(project.id);

  const getRes = await request.get(`${BASE}/items/${item.id}`);
  const detail = await getRes.json();
  expect(detail.workflowId).toBe(workflow.id);
});

test('POST /api/items inherits projectId from parent when omitted', async ({ request }) => {
  const projectRes = await request.post(`${BASE}/projects`, { data: { name: 'Inherit Project' } });
  const project = await projectRes.json();

  const parentRes = await request.post(`${BASE}/items`, {
    data: { title: 'Parent Item', projectId: project.id },
  });
  expect(parentRes.status()).toBe(201);
  const parent = await parentRes.json();

  const childRes = await request.post(`${BASE}/items`, {
    data: { title: 'Child Item', parentId: parent.id },
  });
  expect(childRes.status()).toBe(201);
  const child = await childRes.json();
  expect(child.projectId).toBe(project.id);
});

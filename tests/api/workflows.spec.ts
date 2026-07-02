import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

const BASE = 'http://localhost:3002/api';

test.beforeAll(() => {
  resetAndSeedDb();
});

test('POST /api/workflows with templateId creates workflow with template columns', async ({ request }) => {
  const projectRes = await request.post(`${BASE}/projects`, { data: { name: 'Template Test Project' } });
  const project = await projectRes.json();

  const templatesRes = await request.get(`${BASE}/workflow-templates`);
  const templates = await templatesRes.json();
  const quick = templates.find((t: { name: string }) => t.name === 'quick');

  const workflowRes = await request.post(`${BASE}/workflows`, {
    data: { name: 'Quick Workflow', projectId: project.id, templateId: quick.id },
  });
  expect(workflowRes.status()).toBe(201);
  const workflow = await workflowRes.json();
  expect(workflow.columns).toHaveLength(2);
  expect(workflow.columns[0].name).toBe('Todo');
  expect(workflow.columns[1].name).toBe('Done');
  expect(workflow.columns[1].isTerminal).toBe(1);
});

test('GET /api/workflows?projectId filters by project', async ({ request }) => {
  const p1Res = await request.post(`${BASE}/projects`, { data: { name: 'Project A' } });
  const p1 = await p1Res.json();
  const p2Res = await request.post(`${BASE}/projects`, { data: { name: 'Project B' } });
  const p2 = await p2Res.json();

  await request.post(`${BASE}/workflows`, { data: { name: 'WF for A', projectId: p1.id } });
  await request.post(`${BASE}/workflows`, { data: { name: 'WF for B', projectId: p2.id } });

  const res = await request.get(`${BASE}/workflows?projectId=${p1.id}`);
  const workflows = await res.json();
  expect(workflows.every((w: { projectId: string }) => w.projectId === p1.id)).toBe(true);
  expect(workflows.find((w: { name: string }) => w.name === 'WF for A')).toBeTruthy();
  expect(workflows.find((w: { name: string }) => w.name === 'WF for B')).toBeFalsy();
});

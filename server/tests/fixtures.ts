import request from 'supertest';
import { app } from '../src/index.js';

export async function createProject(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/projects')
    .send({ name: 'Test Project', ...overrides });
  return res.body;
}

export async function createWorkflow(projectId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workflows')
    .send({ name: 'Test Workflow', projectId, ...overrides });
  return res.body;
}

export async function createWorkphase(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workphases')
    .send({ workflowId, name: 'Test Phase', ...overrides });
  return res.body;
}

export async function createBoard(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/boards')
    .send({ workflowId, name: 'Test Board', ...overrides });
  return res.body;
}

export async function createColumn(
  boardId: string,
  startWorkphaseId: string,
  endWorkphaseId: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/columns')
    .send({ boardId, startWorkphaseId, endWorkphaseId, ...overrides });
  return res.body;
}

export async function createItem(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/items')
    .send({ title: 'Test Item', ...overrides });
  return res.body;
}

export async function findTemplateByName(name: 'quick' | 'flow') {
  const res = await request(app).get('/api/workflow-templates');
  return res.body.find((t: { name: string }) => t.name === name);
}

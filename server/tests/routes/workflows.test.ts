import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { workflows } from '../../src/db/schema.js';
import { createProject, createWorkflow, createWorkphase, createItem, findTemplateByName } from '../fixtures.js';

describe('GET /api/workflows', () => {
  it('returns all workflows when no projectId filter is given', async () => {
    const p1 = await createProject();
    const p2 = await createProject();
    await createWorkflow(p1.id);
    await createWorkflow(p2.id);
    const res = await request(app).get('/api/workflows');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by projectId when given', async () => {
    const p1 = await createProject();
    const p2 = await createProject();
    const w1 = await createWorkflow(p1.id);
    await createWorkflow(p2.id);
    const res = await request(app).get(`/api/workflows?projectId=${p1.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(w1.id);
  });
});

describe('GET /api/workflows/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/workflows/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns workphases ordered by position and items with computed depth', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: workphase.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, workphaseId: workphase.id, parentId: root.id, title: 'Child' });

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(200);
    expect(res.body.workphases).toHaveLength(1);

    const items = res.body.items as Array<{ id: string; depth: number }>;
    expect(items.find(i => i.id === root.id)?.depth).toBe(0);
    expect(items.find(i => i.id === child.id)?.depth).toBe(1);
  });

  // Regression coverage for audit Finding #17: this was the one read path
  // with no positionScope attached at all.
  it('attaches positionScope to every item, matching GET /api/items/:id for the same rows', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: workphase.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, workphaseId: workphase.id, parentId: root.id, title: 'Child' });

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    const items = res.body.items as Array<{ id: string; positionScope: string }>;
    expect(items.find(i => i.id === root.id)?.positionScope).toBe('workflow');
    expect(items.find(i => i.id === child.id)?.positionScope).toBe('attached-siblings');
  });
});

describe('POST /api/workflows', () => {
  it('returns 400 when name is missing', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/workflows').send({ projectId: project.id });
    expect(res.status).toBe(400);
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await request(app).post('/api/workflows').send({ name: 'W' });
    expect(res.status).toBe(400);
  });

  it('clones phases from a template when templateId is given', async () => {
    const project = await createProject();
    const flow = await findTemplateByName('flow');
    const res = await request(app).post('/api/workflows').send({
      name: 'From Template', projectId: project.id, templateId: flow.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual([
      'Todo', 'In Progress', 'Review', 'Done',
    ]);
    expect(res.body.workphases.find((p: { name: string }) => p.name === 'Review').triggersNotification).toBe(1);

    // A default board is bootstrapped 1:1 with the just-created workphases
    const boardsRes = await request(app).get(`/api/boards?workflowId=${res.body.id}`);
    expect(boardsRes.body).toHaveLength(1);
    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(detail.body.columns.map((c: { displayName: string }) => c.displayName)).toEqual([
      'Todo', 'In Progress', 'Review', 'Done',
    ]);
  });

  it('clones phases from an existing workflow when sourceWorkflowId is given', async () => {
    const project = await createProject();
    const source = await createWorkflow(project.id);
    await createWorkphase(source.id, { name: 'Backlog' });
    await createWorkphase(source.id, { name: 'Done' });

    const res = await request(app).post('/api/workflows').send({
      name: 'Cloned', projectId: project.id, sourceWorkflowId: source.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Backlog', 'Done']);

    const boardsRes = await request(app).get(`/api/boards?workflowId=${res.body.id}`);
    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(detail.body.columns.map((c: { displayName: string }) => c.displayName)).toEqual(['Backlog', 'Done']);
  });

  it('creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/workflows').send({ name: 'Bare', projectId: project.id });
    expect(res.status).toBe(201);
    expect(res.body.workphases).toEqual([]);

    // Still gets a default board (with zero columns, since there are no phases yet)
    const boardsRes = await request(app).get(`/api/boards?workflowId=${res.body.id}`);
    expect(boardsRes.body).toHaveLength(1);
    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(detail.body.columns).toEqual([]);
  });
});

describe('PUT /api/workflows/:id', () => {
  it('updates name and description', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id, { description: 'old' });
    const res = await request(app).put(`/api/workflows/${workflow.id}`).send({ name: 'Renamed', description: 'new' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.description).toBe('new');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/workflows/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/workflows/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/workflows/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes the workflow, its workphases, and boards/columns, but items survive with a null workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);
    const item = await createItem({ projectId: project.id, workphaseId: workphase.id });
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const boardId = boardsRes.body[0].id;

    const res = await request(app).delete(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/workflows/${workflow.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/boards/${boardId}`)).status).toBe(404);

    // The item is NOT deleted — deleting the workphases nulls its workphaseId
    // (ON DELETE SET NULL), so it survives and surfaces as "Unknown status".
    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.workphaseId).toBeNull();
  });

  it('does not fail on cross-project items inheriting the workflow (finding #1 regression)', async () => {
    // A child project with no workflow of its own inherits the parent's; an item
    // in the child sits in one of the (parent) workflow's workphases.
    const parent = await createProject();
    const workflow = await createWorkflow(parent.id);
    const workphase = await createWorkphase(workflow.id);
    const child = await createProject({ parentId: parent.id });
    const crossProjectItem = await createItem({ projectId: child.id, workphaseId: workphase.id });

    // Previously this threw an FK-violation 500 and left the DB half-torn-down.
    const res = await request(app).delete(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${crossProjectItem.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.workphaseId).toBeNull();
  });

  it('deletes a workflow with a null projectId without touching any project\'s items', async () => {
    // workflow.projectId is only reachable as null by seeding directly — the
    // POST route requires projectId, so the API can never produce this state.
    const orphanId = randomUUID();
    const now = Date.now();
    db.insert(workflows).values({
      id: orphanId, projectId: null, name: 'Orphan', createdAt: now, updatedAt: now,
    }).run();

    const res = await request(app).delete(`/api/workflows/${orphanId}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/workflows/${orphanId}`)).status).toBe(404);
  });
});

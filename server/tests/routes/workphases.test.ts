import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createWorkflow, createWorkphase, createItem, createColumn } from '../fixtures.js';

describe('POST /api/workphases', () => {
  it('returns 400 when workflowId or name is missing', async () => {
    const missingWorkflowId = await request(app).post('/api/workphases').send({ name: 'Todo' });
    expect(missingWorkflowId.status).toBe(400);

    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const missingName = await request(app).post('/api/workphases').send({ workflowId: workflow.id });
    expect(missingName.status).toBe(400);
  });

  it('places the first workphase at position 1.0 and appends the next at max + 1.0', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);

    const first = await request(app).post('/api/workphases').send({ workflowId: workflow.id, name: 'Todo' });
    expect(first.body.position).toBe(1.0);

    const second = await request(app).post('/api/workphases').send({ workflowId: workflow.id, name: 'Done' });
    expect(second.body.position).toBe(2.0);
  });
});

describe('PUT /api/workphases/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/workphases/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('updates name and coerces truthy/falsy flags to 1/0', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id, { name: 'Todo' });

    const res = await request(app).put(`/api/workphases/${phase.id}`).send({
      name: 'In Progress', triggersNotification: true, isTerminal: false,
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('In Progress');
    expect(res.body.triggersNotification).toBe(1);
    expect(res.body.isTerminal).toBe(0);
  });

  it('preserves existing fields when they are omitted from the body', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id, { name: 'Todo', triggersNotification: true });

    const res = await request(app).put(`/api/workphases/${phase.id}`).send({});
    expect(res.body.name).toBe('Todo');
    expect(res.body.triggersNotification).toBe(1);
  });
});

describe('PATCH /api/workphases/reorder', () => {
  it('returns 400 when workphaseOrders is not an array', async () => {
    const res = await request(app).patch('/api/workphases/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('reorders multiple workphases', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const a = await createWorkphase(workflow.id, { name: 'A' });
    const b = await createWorkphase(workflow.id, { name: 'B' });

    const res = await request(app).patch('/api/workphases/reorder').send({
      workphaseOrders: [{ id: a.id, position: 5 }, { id: b.id, position: 1 }],
    });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/workphases/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/workphases/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes an empty workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const res = await request(app).delete(`/api/workphases/${phase.id}`);
    expect(res.status).toBe(204);
  });

  it('deletes a workphase that still has items — the items survive with a null workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const item = await createItem({ projectId: project.id, workphaseId: phase.id });

    const res = await request(app).delete(`/api/workphases/${phase.id}`);
    expect(res.status).toBe(204);

    // Not blocked or deleted — the FK nulls the item's workphaseId.
    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.workphaseId).toBeNull();
  });

  it('deleting an interior workphase leaves a covering column untouched (204, no shrink reported)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const col = await createColumn(boardsRes.body[0].id, todo.id, done.id);

    const res = await request(app).delete(`/api/workphases/${inProgress.id}`);
    expect(res.status).toBe(204);

    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    const resolved = detail.body.columns.find((c: { id: string }) => c.id === col.id);
    expect(resolved.startWorkphaseId).toBe(todo.id);
    expect(resolved.endWorkphaseId).toBe(done.id);
    expect(resolved.subRows.map((r: { workphase: { id: string } }) => r.workphase.id)).toEqual([todo.id, done.id]);
  });

  it('deleting a boundary workphase repoints the column and reports it as shrunk (200)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const col = await createColumn(boardsRes.body[0].id, todo.id, done.id);

    const res = await request(app).delete(`/api/workphases/${todo.id}`);
    expect(res.status).toBe(200);
    expect(res.body.shrunkColumns.map((c: { id: string }) => c.id)).toEqual([col.id]);

    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    const resolved = detail.body.columns.find((c: { id: string }) => c.id === col.id);
    expect(resolved.startWorkphaseId).toBe(inProgress.id);
    expect(resolved.endWorkphaseId).toBe(done.id);
  });

  it('deleting a column\'s sole covered workphase deletes the column and reports it (200)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const col = await createColumn(boardsRes.body[0].id, todo.id, todo.id);

    const res = await request(app).delete(`/api/workphases/${todo.id}`);
    expect(res.status).toBe(200);
    expect(res.body.deletedColumns.map((c: { id: string }) => c.id)).toEqual([col.id]);

    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(detail.body.columns.find((c: { id: string }) => c.id === col.id)).toBeUndefined();
  });
});

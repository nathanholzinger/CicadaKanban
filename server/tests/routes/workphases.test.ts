import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createWorkflow, createWorkphase, createItem } from '../fixtures.js';

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

  it('returns 409 with itemCount when items still reference it', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    await createItem({ projectId: project.id, workphaseId: phase.id });

    const res = await request(app).delete(`/api/workphases/${phase.id}`);
    expect(res.status).toBe(409);
    expect(res.body.itemCount).toBe(1);
  });
});

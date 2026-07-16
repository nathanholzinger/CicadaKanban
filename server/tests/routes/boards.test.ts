import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createWorkflow, createWorkphase, createBoard, createColumn, createItem } from '../fixtures.js';

describe('workflow creation bootstraps a default board', () => {
  it('POST /api/workflows creates exactly one board with 1:1 columns matching its workphases', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id, { name: 'Bootstrap Test' });

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    expect(boardsRes.body.length).toBe(1);

    // No template/source given, so the workflow (and thus the board) starts with zero workphases/columns
    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(detail.body.columns).toEqual([]);
  });

  it('bootstraps 1:1 columns when created from a template', async () => {
    const project = await createProject();
    const templates = await request(app).get('/api/workflow-templates');
    const quick = templates.body.find((t: { name: string }) => t.name === 'quick');

    const workflow = await createWorkflow(project.id, { templateId: quick.id });
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const detail = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);

    expect(detail.body.columns.length).toBe(2); // 'quick' template = Todo, Done
    expect(detail.body.columns.map((c: { displayName: string }) => c.displayName)).toEqual(['Todo', 'Done']);
  });
});

describe('GET /api/boards', () => {
  it('lists boards, optionally filtered by workflowId', async () => {
    const project = await createProject();
    const workflowA = await createWorkflow(project.id);
    const workflowB = await createWorkflow(project.id);

    const filtered = await request(app).get(`/api/boards?workflowId=${workflowA.id}`);
    expect(filtered.body.length).toBe(1);
    expect(filtered.body[0].workflowId).toBe(workflowA.id);

    const all = await request(app).get('/api/boards');
    expect(all.body.length).toBe(2);
    void workflowB;
  });
});

describe('GET /api/boards/:id', () => {
  it('returns 404 for a non-existent board', async () => {
    const res = await request(app).get('/api/boards/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('resolves columns into displayName/broken/entryWorkphaseId/subRows and computes unsorted', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const board = boardsRes.body[0];

    const merged = await createColumn(board.id, todo.id, inProgress.id, { name: null });
    const item1 = await createItem({ projectId: project.id, workphaseId: todo.id });
    const item2 = await createItem({ projectId: project.id, workphaseId: done.id }); // uncovered -> unsorted

    const res = await request(app).get(`/api/boards/${board.id}`);
    expect(res.status).toBe(200);

    const col = res.body.columns.find((c: { id: string }) => c.id === merged.id);
    expect(col.displayName).toBe('Todo – In Progress');
    expect(col.broken).toBe(false);
    expect(col.entryWorkphaseId).toBe(todo.id);
    expect(col.subRows.map((r: { workphase: { id: string } }) => r.workphase.id)).toEqual([todo.id, inProgress.id]);
    expect(col.subRows.find((r: { workphase: { id: string } }) => r.workphase.id === todo.id).items
      .map((i: { id: string }) => i.id)).toEqual([item1.id]);

    expect(res.body.unsorted.needsAttention).toBe(true);
    expect(res.body.unsorted.uncovered.map((r: { workphase: { id: string } }) => r.workphase.id)).toEqual([done.id]);
    expect(res.body.unsorted.uncovered[0].items.map((i: { id: string }) => i.id)).toEqual([item2.id]);
  });

  it('flags a column as broken after an out-of-band workphase reorder inverts its range', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const board = boardsRes.body[0];
    const col = await createColumn(board.id, todo.id, inProgress.id);

    // Reorder so 'In Progress' now sorts before 'Todo' — inverts col's range
    await request(app).patch('/api/workphases/reorder').send({
      workphaseOrders: [{ id: todo.id, position: 2 }, { id: inProgress.id, position: 1 }],
    });

    const res = await request(app).get(`/api/boards/${board.id}`);
    const resolved = res.body.columns.find((c: { id: string }) => c.id === col.id);
    expect(resolved.broken).toBe(true);
    // Still shows its (now min/max-resolved) items rather than emptying into Unsorted
    expect(resolved.subRows.length).toBe(2);
  });
});

describe('POST /api/boards', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/boards').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent workflow', async () => {
    const res = await request(app).post('/api/boards').send({ workflowId: 'does-not-exist', name: 'X' });
    expect(res.status).toBe(404);
  });

  it('bootstraps a new board with 1:1 columns matching the workflow\'s current workphases', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    await createWorkphase(workflow.id, { name: 'Todo' });
    await createWorkphase(workflow.id, { name: 'Done' });

    const res = await request(app).post('/api/boards').send({ workflowId: workflow.id, name: 'QA View' });
    expect(res.status).toBe(201);

    const detail = await request(app).get(`/api/boards/${res.body.id}`);
    expect(detail.body.columns.length).toBe(2);
    expect(detail.body.columns.map((c: { displayName: string }) => c.displayName)).toEqual(['Todo', 'Done']);
  });
});

describe('PUT /api/boards/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/boards/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('renames a board', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const board = await createBoard(workflow.id, { name: 'Original' });

    const res = await request(app).put(`/api/boards/${board.id}`).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });
});

describe('DELETE /api/boards/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/boards/does-not-exist');
    expect(res.status).toBe(404);
  });

  it("returns 409 when deleting a workflow's last remaining board", async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);

    const res = await request(app).delete(`/api/boards/${boardsRes.body[0].id}`);
    expect(res.status).toBe(409);
  });

  it('deletes a non-last board along with its columns', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    await createWorkphase(workflow.id, { name: 'Todo' });
    // Bootstrapped with a 1:1 column for 'Todo' since it exists at creation time
    const secondBoard = await createBoard(workflow.id, { name: 'Second' });

    const res = await request(app).delete(`/api/boards/${secondBoard.id}`);
    expect(res.status).toBe(204);

    const remaining = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    expect(remaining.body.map((b: { id: string }) => b.id)).not.toContain(secondBoard.id);
  });
});

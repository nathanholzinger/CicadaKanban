import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { columns } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { ITEM_DEPTH_CAP } from '../../src/lib/itemTree.js';
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

  // Epic 3.5 Story 2: the client's drag-target classification reads the cap
  // off the board rather than hard-coding it (ATT-4.8 — one constant moves
  // both enforcement points).
  it('carries the item depth cap the API enforces', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const res = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(res.body.itemDepthCap).toBe(ITEM_DEPTH_CAP);
  });

  it('reports identical position for the same item across two different boards on one workflow (TC-1.1)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    // The workflow's auto-bootstrapped default board predates `todo`
    // (bootstrap only covers workphases that exist at workflow-creation
    // time), so it needs an explicit column covering it, same as a
    // genuinely independent second board would.
    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const boardOne = boardsRes.body[0];
    await createColumn(boardOne.id, todo.id, todo.id);

    // A second, wholly independent board on the same workflow — position
    // is a single item-owned scalar (wiki §1), not a per-board value;
    // boards only ever read it, never own their own copy.
    const boardTwo = await createBoard(workflow.id, { name: 'Second Board' });
    await createColumn(boardTwo.id, todo.id, todo.id);

    const detailOne = await request(app).get(`/api/boards/${boardOne.id}`);
    const detailTwo = await request(app).get(`/api/boards/${boardTwo.id}`);

    const onBoardOne = detailOne.body.columns[0].subRows[0].items.find((i: { id: string }) => i.id === item.id);
    const onBoardTwo = detailTwo.body.columns[0].subRows[0].items.find((i: { id: string }) => i.id === item.id);
    expect(onBoardOne.position).toBe(item.position);
    expect(onBoardTwo.position).toBe(item.position);
    expect(onBoardOne.position).toBe(onBoardTwo.position);
  });

  it('surfaces items whose workphase was deleted as invalidItems (Unknown status)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const keep = await createWorkphase(workflow.id, { name: 'Keep' });
    const stranded = await createItem({ projectId: project.id, workphaseId: todo.id });

    // Deleting the workphase nulls the item's workphaseId (SET NULL) rather than
    // deleting it — the board must still surface it instead of dropping it.
    await request(app).delete(`/api/workphases/${todo.id}`);

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const res = await request(app).get(`/api/boards/${boardsRes.body[0].id}`);
    expect(res.status).toBe(200);

    const invalidIds = res.body.unsorted.invalidItems.map((i: { id: string }) => i.id);
    expect(invalidIds).toContain(stranded.id);
    expect(res.body.unsorted.needsAttention).toBe(true);
    void keep;
  });

  it('uses an explicit column name as the displayName override', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const board = boardsRes.body[0];
    const named = await createColumn(board.id, todo.id, inProgress.id, { name: 'Active Work' });

    const res = await request(app).get(`/api/boards/${board.id}`);
    const col = res.body.columns.find((c: { id: string }) => c.id === named.id);
    expect(col.displayName).toBe('Active Work');
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

  it('persists the showAttachedChildren toggle, which defaults to on', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const board = await createBoard(workflow.id, { name: 'Toggle Board' });
    expect(board.showAttachedChildren).toBe(1);

    const off = await request(app).put(`/api/boards/${board.id}`).send({ showAttachedChildren: false });
    expect(off.status).toBe(200);
    expect(off.body.showAttachedChildren).toBe(0);

    // A rename-only update must not reset the toggle.
    const renamed = await request(app).put(`/api/boards/${board.id}`).send({ name: 'Still Off' });
    expect(renamed.body.showAttachedChildren).toBe(0);

    const on = await request(app).put(`/api/boards/${board.id}`).send({ showAttachedChildren: true });
    expect(on.body.showAttachedChildren).toBe(1);
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

    const orphanedColumns = db.select().from(columns).where(eq(columns.boardId, secondBoard.id)).all();
    expect(orphanedColumns).toEqual([]);
  });
});

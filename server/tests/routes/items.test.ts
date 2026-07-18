import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createWorkflow, createWorkphase, createItem } from '../fixtures.js';

describe('GET /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('computes depth via the parent chain and derives workflowId from the workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Root' });
    // Attached by default — inherits the parent's current workphase.
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child' });

    const rootRes = await request(app).get(`/api/items/${root.id}`);
    expect(rootRes.body.depth).toBe(0);
    expect(rootRes.body.workflowId).toBe(workflow.id);

    const childRes = await request(app).get(`/api/items/${child.id}`);
    expect(childRes.body.depth).toBe(1);
    expect(childRes.body.workphaseId).toBe(phase.id);
    expect(childRes.body.workflowId).toBe(workflow.id);
  });

  it('a detached child does not inherit the parent workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child', isAttached: false });

    const childRes = await request(app).get(`/api/items/${child.id}`);
    expect(childRes.body.workphaseId).toBeNull();
    expect(childRes.body.workflowId).toBeNull();
  });
});

describe('POST /api/items', () => {
  it('returns 400 when title is missing', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items').send({ projectId: project.id });
    expect(res.status).toBe(400);
  });

  it('creates a root item given an explicit projectId', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items').send({ title: 'Task', projectId: project.id });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(project.id);
  });

  it('inherits projectId from parentId when projectId is omitted', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const res = await request(app).post('/api/items').send({ title: 'Child', parentId: parent.id });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(project.id);
  });

  it('returns 400 when neither projectId nor a resolvable parentId is given', async () => {
    const res = await request(app).post('/api/items').send({ title: 'Orphan' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-existent workphaseId rather than an opaque FK 500', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items')
      .send({ title: 'Task', projectId: project.id, workphaseId: 'no-such-workphase' });
    expect(res.status).toBe(400);
  });

  it('positions the first item in a workphase at 1.0 and the next at max + 1.0', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const first = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'First' });
    expect(first.position).toBe(1.0);

    const second = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Second' });
    expect(second.position).toBe(2.0);
  });

  it('logs a "Created" activity entry', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.body.activity.some((a: { type: string; content: string }) => a.content === 'Created')).toBe(true);
  });
});

describe('PUT /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/items/does-not-exist').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('updates only the provided fields', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Original', description: 'Original desc' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Renamed');
    expect(res.body.description).toBe('Original desc');
  });

  it('logs an assignment activity entry only when assigneeType or agentId is touched', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });

    await request(app).put(`/api/items/${item.id}`).send({ title: 'No assignment change' });
    const afterTitle = await request(app).get(`/api/items/${item.id}`);
    expect(afterTitle.body.activity.some((a: { type: string }) => a.type === 'assignment')).toBe(false);

    await request(app).put(`/api/items/${item.id}`).send({ assigneeType: 'human' });
    const afterAssign = await request(app).get(`/api/items/${item.id}`);
    expect(afterAssign.body.activity.some((a: { type: string }) => a.type === 'assignment')).toBe(true);
  });
});

describe('PATCH /api/items/:id/move', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).patch('/api/items/does-not-exist/move').send({ position: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when neither workphaseId nor position is given', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when moving to a non-existent workphaseId', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: 'no-such-workphase' });
    expect(res.status).toBe(400);
  });

  it('a position-only move does not add a new status_change entry beyond the one logged at creation', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const before = await request(app).get(`/api/items/${item.id}`);
    const countBefore = before.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;

    await request(app).patch(`/api/items/${item.id}/move`).send({ position: 5 });

    const after = await request(app).get(`/api/items/${item.id}`);
    const countAfter = after.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;
    expect(countAfter).toBe(countBefore);
  });

  it('a workphase move logs a status_change entry and creates a notification only when the target triggers one', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const quiet = await createWorkphase(workflow.id, { name: 'Todo' });
    const noisy = await createWorkphase(workflow.id, { name: 'Review', triggersNotification: true });
    const item = await createItem({ projectId: project.id, workphaseId: quiet.id });

    const toNoisy = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: noisy.id });
    expect(toNoisy.status).toBe(200);

    const afterNoisy = await request(app).get(`/api/items/${item.id}`);
    expect(afterNoisy.body.activity.some(
      (a: { type: string; content: string }) => a.type === 'status_change' && a.content.includes('Moved'),
    )).toBe(true);

    const notifications = await request(app).get('/api/notifications');
    expect(notifications.body.some((n: { itemId: string }) => n.itemId === item.id)).toBe(true);
  });
});

describe('PATCH /api/items/reorder', () => {
  it('returns 400 when itemOrders is not an array', async () => {
    const res = await request(app).patch('/api/items/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('reorders multiple items', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const b = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 5 }, { id: b.id, position: 1 }],
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/items/:id/comments', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).post('/api/items/does-not-exist/comments').send({ content: 'hi' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty or whitespace-only content', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).post(`/api/items/${item.id}/comments`).send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('adds a trimmed comment to the activity log', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const post = await request(app).post(`/api/items/${item.id}/comments`).send({ content: '  hello  ' });
    expect(post.status).toBe(201);

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.body.activity.some((a: { type: string; content: string }) => a.type === 'comment' && a.content === 'hello')).toBe(true);
  });
});

describe('DELETE /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes a leaf item', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).delete(`/api/items/${item.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/items/${item.id}`)).status).toBe(404);
  });

  it('cascades through a multi-level parent/child/grandchild chain', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).delete(`/api/items/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/items/${parent.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${child.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).status).toBe(404);
  });
});

describe('attached children', () => {
  async function setupTwoPhases() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress };
  }

  it('moving a parent cascades through attached children and grandchildren', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    expect((await request(app).get(`/api/items/${child.id}`)).body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('a detached child halts the cascade for its whole branch', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Root' });
    const detached = await createItem({
      projectId: project.id, parentId: root.id, title: 'Detached', isAttached: false, workphaseId: todo.id,
    });
    // Attached under the detached child — inherits its phase, but must not follow the root.
    const branchChild = await createItem({ projectId: project.id, parentId: detached.id, title: 'Branch Child' });

    await request(app).patch(`/api/items/${root.id}/move`).send({ workphaseId: inProgress.id });

    expect((await request(app).get(`/api/items/${detached.id}`)).body.workphaseId).toBe(todo.id);
    expect((await request(app).get(`/api/items/${branchChild.id}`)).body.workphaseId).toBe(todo.id);
  });

  it('reattaching snaps to the parent workphase and cascades to own attached descendants', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent' });
    const child = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Child', isAttached: false, workphaseId: todo.id,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    expect(grandchild.workphaseId).toBe(todo.id);

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('reparenting an attached item shifts it and its attached descendants to the new parent workphase', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent 1' });
    const parent2 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent 2' });
    const item = await createItem({ projectId: project.id, parentId: parent1.id, title: 'Item' });
    const itemChild = await createItem({ projectId: project.id, parentId: item.id, title: 'Item Child' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: parent2.id });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${itemChild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('rejects an item becoming its own parent or reparenting to a descendant', async () => {
    const project = await createProject();
    const root = await createItem({ projectId: project.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const selfRes = await request(app).put(`/api/items/${root.id}`).send({ parentId: root.id });
    expect(selfRes.status).toBe(400);
    expect(selfRes.body.error).toMatch(/own parent/i);

    const cycleRes = await request(app).put(`/api/items/${root.id}`).send({ parentId: grandchild.id });
    expect(cycleRes.status).toBe(400);
    expect(cycleRes.body.error).toMatch(/descendant/i);
  });

  it('an attached child inherits the parent workphase even when a different one is passed', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, workphaseId: inProgress.id, title: 'Child' });
    expect(child.workphaseId).toBe(todo.id);
  });

  it('an attached child of a parent with no workphase gets a null workphase', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.workphaseId).toBeNull();
  });

  it('a detached child keeps its explicitly passed workphase', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Child', isAttached: false, workphaseId: inProgress.id,
    });
    expect(child.workphaseId).toBe(inProgress.id);
    expect(child.isAttached).toBe(0);
  });
});

describe('deleting a referenced entity nulls the item FK (SET NULL, not blocked)', () => {
  it('deleting an item type leaves referencing items typeless', async () => {
    const project = await createProject();
    const type = (await request(app).post('/api/item-types').send({ name: 'Bug' })).body;
    const item = await createItem({ projectId: project.id, type: type.id });

    const del = await request(app).delete(`/api/item-types/${type.id}`);
    expect(del.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.type).toBeNull();
  });

  it('deleting an agent unassigns referencing items', async () => {
    const project = await createProject();
    const agent = (await request(app).post('/api/agents')
      .send({ name: 'Claude', claudeProjectId: 'p1', surface: 'code' })).body;
    const item = await createItem({ projectId: project.id, assigneeType: 'agent', agentId: agent.id });

    const del = await request(app).delete(`/api/agents/${agent.id}`);
    expect(del.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.agentId).toBeNull();
  });
});

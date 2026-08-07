import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items, activityLog, attachments, notifications, itemLabels, labels, chatThreads, chatMessages } from '../../src/db/schema.js';
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

  it('returns 400 for a non-existent parentId instead of storing an invisible orphan', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items')
      .send({ title: 'Child', projectId: project.id, parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  it('rejects creating a child whose projectId differs from its parent (finding #11)', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const parent = await createItem({ projectId: projectA.id, title: 'Parent A' });
    const res = await request(app).post('/api/items')
      .send({ title: 'Child', projectId: projectB.id, parentId: parent.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different project/i);
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

  it('a workphaseId-only move (no position given) defaults to the end of the target workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    const existing = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Already done' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(existing.position);
  });

  it('an explicit position on a move is respected as-is, not overridden by the default', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    await createItem({ projectId: project.id, workphaseId: done.id, title: 'Already done' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: done.id, position: 0.5 });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(0.5);
  });
});

describe('Epic 3.2 — position resolution', () => {
  async function setupTwoPhases(doneOverrides: Record<string, unknown> = {}) {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true, ...doneOverrides });
    return { project, workflow, todo, done };
  }

  it('POST scopes a new attached child to its true siblings, not the whole workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    // Unrelated top-level items sharing the workphase must not pollute the
    // new child's position (the pre-Epic-3.2 bug: nextPosition was scoped
    // only to workphaseId).
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 1' });
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 2' });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children
  });

  it('POST into a terminal workphase gets no position, but a completedAt timestamp', async () => {
    const { project, done } = await setupTwoPhases();
    const res = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(res.status).toBe(201);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('attaching to a parent reassigns a fresh position scoped to the new siblings', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    await createItem({ projectId: project.id, parentId: parent.id, title: 'Existing sibling' }); // position 1.0
    const detached = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Detached', isAttached: false });

    const res = await request(app).put(`/api/items/${detached.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0); // fresh, past the existing sibling — not its old workphace-scoped value
  });

  it('detaching reassigns a fresh position scoped to the workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing root' }); // position 1.0
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' }); // position 2.0
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, position 1.0 among siblings

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(2.0); // fresh, past the workphase's existing items
  });

  it('detaching into a terminal workphase clears position and sets completedAt', async () => {
    const { project, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Done, keeps a position

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('reparenting while staying attached reassigns a fresh position scoped to the new parent', async () => {
    const { project, todo } = await setupTwoPhases();
    const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
    const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
    await createItem({ projectId: project.id, parentId: parentB.id, title: 'Existing under B' }); // position 1.0
    const child = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0);
  });

  it('a redundant re-attach to the same parent leaves position untouched', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(child.position);
  });

  it('move resolves anchorId+side against the true neighbor, not a client-supplied guess', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
    const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0

    const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(a.position);
    expect(res.body.position).toBeLessThan(b.position);
  });

  it('excludes the item itself from its own scope query on reposition', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id }); // 1.0
    const x = await createItem({ projectId: project.id, workphaseId: todo.id }); // 2.0
    const b = await createItem({ projectId: project.id, workphaseId: todo.id }); // 3.0
    // Force x to sit numerically between a and b — if x's own (pre-move) row
    // weren't excluded from its scope query, resolving "after a" would find
    // x itself as the closest neighbor and anchor against its stale value.
    await request(app).patch(`/api/items/${x.id}/move`).send({ position: 1.5 });

    const res = await request(app).patch(`/api/items/${x.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    // Correctly resolves against the true next neighbor (b, at 3.0),
    // skipping x's own stale 1.5 — a buggy resolution would land below 1.5.
    expect(res.body.position).toBeGreaterThan(1.5);
    expect(res.body.position).toBeLessThan(3.0);
  });

  it('move rejects an invalid side when anchorId is given', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: a.id, side: 'sideways' });
    expect(res.status).toBe(400);
  });

  it('move rejects a non-existent anchorId', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: 'no-such-item', side: 'after' });
    expect(res.status).toBe(400);
  });

  it('move rejects anchoring to a done item (no position to anchor against)', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const active = await createItem({ projectId: project.id, workphaseId: todo.id });
    const doneItem = await request(app).post('/api/items').send({ title: 'Done item', projectId: project.id, workphaseId: done.id });

    const res = await request(app).patch(`/api/items/${active.id}/move`).send({ anchorId: doneItem.body.id, side: 'after' });
    expect(res.status).toBe(400);
  });

  it('moving into a terminal workphase clears position and sets completedAt', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('moving out of a terminal workphase clears completedAt and assigns a fresh position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const item = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(item.body.completedAt).toBeGreaterThan(0);

    const res = await request(app).patch(`/api/items/${item.body.id}/move`).send({ workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    expect(res.body.position).not.toBeNull();
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

  it('rejects an entry without a string id and finite numeric position', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 'first' }],
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 with missingIds when any item does not exist', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 1 }, { id: 'ghost', position: 2 }],
    });
    expect(res.status).toBe(404);
    expect(res.body.missingIds).toEqual(['ghost']);
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

  it('deleting a parent also deletes its detached descendants (finding #27 — whole-subtree delete regardless of attach state)', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const detachedChild = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Detached Child', isAttached: false,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: detachedChild.id, title: 'Grandchild' });

    const res = await request(app).delete(`/api/items/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/items/${detachedChild.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).status).toBe(404);
  });

  it('cascades an item\'s dependent rows (labels, activity, notifications, attachments, chat) via ON DELETE CASCADE', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });
    await request(app).post(`/api/items/${item.id}/comments`).send({ content: 'a comment' }); // seeds activityLog

    // Seed the tables without a POST route directly, then assert the DB cascade.
    const label = { id: randomUUID(), name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments).values({
      id: randomUUID(), itemId: item.id, type: 'local_file', label: 'notes.txt', createdAt: Date.now(),
    }).run();
    db.insert(notifications).values({
      id: randomUUID(), itemId: item.id, message: 'hi', type: 'item_in_workphase', createdAt: Date.now(),
    }).run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages).values({
      id: randomUUID(), threadId: thread.id, role: 'user', content: 'hello', createdAt: Date.now(),
    }).run();

    expect((await request(app).delete(`/api/items/${item.id}`)).status).toBe(204);

    // Item's own dependent rows are gone; the global label survives.
    expect(db.select().from(activityLog).where(eq(activityLog.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(attachments).where(eq(attachments.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatThreads).where(eq(chatThreads.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id)).all()).toHaveLength(0);
    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(1);
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

  it('a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged (finding #10)', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    // Force divergence: the attached child sits in a different workphase than its parent.
    db.update(items).set({ workphaseId: inProgress.id }).where(eq(items.id, child.id)).run();
    db.update(items).set({ workphaseId: inProgress.id }).where(eq(items.id, grandchild.id)).run();

    // A title-only edit must leave workphaseId untouched (no snap back to the parent's Todo).
    const res = await request(app).put(`/api/items/${child.id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
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

  it('rejects reparenting to a non-existent parentId', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  it('rejects reparenting an item under a parent in a different project (finding #11)', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const itemA = await createItem({ projectId: projectA.id, title: 'Item A' });
    const parentB = await createItem({ projectId: projectB.id, title: 'Parent B' });

    const res = await request(app).put(`/api/items/${itemA.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different project/i);
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

  it('creates a parentless item with isAttached true (the default) and respects its explicit workphaseId', async () => {
    const { project, todo } = await setupTwoPhases();
    const res = await request(app).post('/api/items').send({
      title: 'Solo Root', projectId: project.id, workphaseId: todo.id, isAttached: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(1);
    // No parent to override it — the given workphaseId is used as-is.
    expect(res.body.workphaseId).toBe(todo.id);
  });

  it('reparenting to null while attached leaves isAttached flagged, not cleared (finding #27 stored-state note)', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    expect(child.isAttached).toBe(1);

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(1); // flag stays set even though there's no parent to attach to
    expect(res.body.workphaseId).toBe(todo.id); // no resync attempted — nothing to snap to
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

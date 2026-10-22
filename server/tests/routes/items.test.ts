import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import {
  items,
  activityLog,
  attachments,
  notifications,
  itemLabels,
  labels,
  chatThreads,
  chatMessages,
} from '../../src/db/schema.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  createBoard,
  setItemPosition,
  workflowWithPhases,
  setItemParent,
} from '../fixtures.js';

// Item CRUD through the item routes: read, create, update, move, comments and delete.

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

  it('a detached child created with workphaseId: null has no workphase, whatever its parent holds', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Root' });
    const child = await createItem({
      projectId: project.id,
      parentId: root.id,
      title: 'Child',
      isAttached: false,
      workphaseId: null,
    });

    const childRes = await request(app).get(`/api/items/${child.id}`);
    expect(childRes.body.workphaseId).toBeNull();
    expect(childRes.body.workflowId).toBeNull();
  });

  it('returns a bounded depth instead of hanging when the data contains a parentId cycle', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id, title: 'A' });
    const b = await createItem({ projectId: project.id, title: 'B' });
    setItemParent(a.id, b.id);
    setItemParent(b.id, a.id);

    const res = await request(app).get(`/api/items/${a.id}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.depth).toBe('number');
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

  it('ATT-5.6: inherits projectId from parentId when projectId is omitted', async () => {
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
    const res = await request(app)
      .post('/api/items')
      .send({ title: 'Task', projectId: project.id, workphaseId: 'no-such-workphase' });
    expect(res.status).toBe(400);
  });

  it('returns 400, not an opaque FK 500, for a projectId, type or agentId that names no row', async () => {
    const project = await createProject();
    const type = (await request(app).post('/api/item-types').send({ name: 'Bug' })).body;
    const agent = (
      await request(app).post('/api/agents').send({ name: 'Claude', claudeProjectId: 'p1', surface: 'code' })
    ).body;
    const before = db.select().from(items).all().length;

    const refusals = [
      ['projectId', { projectId: 'no-such-project' }, /projectId does not reference an existing project/],
      ['type', { projectId: project.id, type: 'no-such-type' }, /type does not reference an existing item type/],
      ['agentId', { projectId: project.id, agentId: 'no-such-agent' }, /agentId does not reference an existing agent/],
    ] as const;
    for (const [field, body, message] of refusals) {
      const res = await request(app)
        .post('/api/items')
        .send({ title: 'T', ...body });
      expect(res.status, field).toBe(400);
      expect(res.body.error, field).toMatch(message);
    }
    expect(db.select().from(items).all().length).toBe(before);

    // A type and an agent that exist are stored.
    const created = await request(app)
      .post('/api/items')
      .send({ title: 'T', projectId: project.id, type: type.id, agentId: agent.id });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ type: type.id, agentId: agent.id });
  });

  it('ATT-4.10: returns 400 for a non-existent parentId instead of storing an invisible orphan', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/items')
      .send({ title: 'Child', projectId: project.id, parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  it('ATT-5.7: rejects creating a child whose projectId differs from its parent, even on one workflow', async () => {
    const projectA = await createProject();
    await createWorkflow(projectA.id);
    // A sub-project with no workflow of its own uses its parent's.
    const projectB = await createProject({ name: 'B', parentId: projectA.id });
    const parent = await createItem({ projectId: projectA.id, title: 'Parent A' });
    const before = db.select().from(items).all().length;

    const res = await request(app)
      .post('/api/items')
      .send({ title: 'Child', projectId: projectB.id, parentId: parent.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different project/i);
    expect(db.select().from(items).all().length).toBe(before);
  });

  it('ATT-10.1: a create names its project, its parent, or both, and is refused with neither', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'P' });
    const before = db.select().from(items).all().length;

    const alone = await request(app).post('/api/items').send({ title: 'Top', projectId: project.id });
    expect(alone.status).toBe(201);
    expect(alone.body).toMatchObject({ parentId: null, projectId: project.id });

    const both = await request(app)
      .post('/api/items')
      .send({ title: 'Child', projectId: project.id, parentId: parent.id });
    expect(both.status).toBe(201);
    expect(both.body).toMatchObject({ parentId: parent.id, projectId: project.id });

    const neither = await request(app).post('/api/items').send({ title: 'Orphan' });
    expect(neither.status).toBe(400);
    expect(db.select().from(items).all().length).toBe(before + 2);
  });

  it('ATT-10.2: a child is created Attached unless the create clears the flag', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });

    const attached = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached' });
    expect(attached).toMatchObject({ isAttached: 1, workphaseId: todo.id, positionScope: 'attached-siblings' });

    const detached = await createItem({
      projectId: project.id,
      parentId: parent.id,
      title: 'Detached',
      isAttached: false,
      workphaseId: inProgress.id,
    });
    expect(detached).toMatchObject({
      parentId: parent.id,
      isAttached: 0,
      workphaseId: inProgress.id,
      positionScope: 'workflow',
    });
  });

  it('ATT-10.3: a create may omit the workphase', async () => {
    const {
      project,
      workflow,
      phases: [todo],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const board = await createBoard(workflow.id);
    const bare = await createProject({ name: 'No workflow' });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });

    const top = await createItem({ projectId: project.id, title: 'No workphase' });
    expect(top).toMatchObject({ workphaseId: null, positionScope: 'none' });
    const boardRes = await request(app).get(`/api/boards/${board.id}`);
    const unsortedIds = boardRes.body.unsorted.invalidItems.map((i: { id: string }) => i.id);
    expect(unsortedIds).toContain(top.id);

    const inBare = await createItem({ projectId: bare.id, title: 'In a project with no workflow' });
    expect(inBare).toMatchObject({ workphaseId: null });

    for (const extra of [{}, { workphaseId: todo.id }]) {
      const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child', ...extra });
      expect(child.workphaseId).toBe(todo.id);
    }
  });

  it('TC-2.6, TC-2.7: positions the first item in a workphase at 1.0 and the next at max + 1.0', async () => {
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

  // PUT rejects an empty title, as POST does.
  it('returns 400 and leaves the title unchanged when title is set to an empty string', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Keep Me' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ title: '' });
    expect(res.status).toBe(400);

    const stillThere = await request(app).get(`/api/items/${item.id}`);
    expect(stillThere.body.title).toBe('Keep Me');
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
    const res = await request(app).patch('/api/items/does-not-exist/move').send({ workphaseId: 'w' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no workphaseId, parentId, isAttached or anchorId is given', async () => {
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

  it('TC-2.32: a move that names a final position is refused, and no endpoint sets several outright', async () => {
    const {
      project,
      phases: [todo],
    } = await workflowWithPhases(['Todo']);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    setItemPosition(x.id, 2.0);
    setItemPosition(a.id, 4.0);
    const positionOf = async (id: string) => (await request(app).get(`/api/items/${id}`)).body.position;

    for (const body of [{ position: 3.0 }, { position: 3.0, anchorId: a.id, side: 'after' }, { position: 'later' }]) {
      const res = await request(app).patch(`/api/items/${x.id}/move`).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error).toMatch(/name an anchorId and side/);
    }
    expect(await positionOf(x.id)).toBe(2.0);

    // The batch endpoint is gone, so no request sets positions outright.
    const reorder = await request(app)
      .patch('/api/items/reorder')
      .send({
        itemOrders: [
          { id: x.id, position: 3 },
          { id: a.id, position: 1 },
        ],
      });
    expect(reorder.status).toBe(404);
    expect([await positionOf(x.id), await positionOf(a.id)]).toEqual([2.0, 4.0]);
  });

  it('a same-workphase move does not add a new status_change entry beyond the one logged at creation', async () => {
    const {
      project,
      phases: [todo],
    } = await workflowWithPhases(['Todo']);
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });
    const before = await request(app).get(`/api/items/${item.id}`);
    const countBefore = before.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;

    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: todo.id });
    expect(res.status).toBe(200);

    const after = await request(app).get(`/api/items/${item.id}`);
    const countAfter = after.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;
    expect(countAfter).toBe(countBefore);
  });

  it('a workphase move logs a status_change entry and creates a notification only when the target triggers one', async () => {
    const {
      project,
      phases: [quiet, noisy],
    } = await workflowWithPhases(['Todo', { name: 'Review', triggersNotification: true }]);
    const item = await createItem({ projectId: project.id, workphaseId: quiet.id });

    const toNoisy = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: noisy.id });
    expect(toNoisy.status).toBe(200);

    const afterNoisy = await request(app).get(`/api/items/${item.id}`);
    expect(
      afterNoisy.body.activity.some(
        (a: { type: string; content: string }) => a.type === 'status_change' && a.content.includes('Moved'),
      ),
    ).toBe(true);

    const notifications = await request(app).get('/api/notifications');
    expect(notifications.body.some((n: { itemId: string }) => n.itemId === item.id)).toBe(true);
  });

  it("TC-2.24: a workphaseId-only move with no anchor keeps the item's existing position exactly unchanged", async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });
    // Pinned to a value the append fallback would never produce, so a pass here
    // can't be coincidental.
    setItemPosition(moving.id, 7.5);

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);
    // Position is workflow-scoped, not workphase-scoped — an
    // existing value is already comparable against everything else in the
    // workflow, so a bare workphaseId change doesn't get a fresh one.
    expect(res.body.position).toBe(7.5);
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
    expect(
      res.body.activity.some((a: { type: string; content: string }) => a.type === 'comment' && a.content === 'hello'),
    ).toBe(true);
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

  it('deleting a parent also deletes its detached descendants', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const detachedChild = await createItem({
      projectId: project.id,
      parentId: parent.id,
      title: 'Detached Child',
      isAttached: false,
      workphaseId: null,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: detachedChild.id, title: 'Grandchild' });

    const res = await request(app).delete(`/api/items/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/items/${detachedChild.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).status).toBe(404);
  });

  it("cascades an item's dependent rows (labels, activity, notifications, attachments, chat) via ON DELETE CASCADE", async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });
    await request(app).post(`/api/items/${item.id}/comments`).send({ content: 'a comment' }); // seeds activityLog

    // Seed the tables without a POST route directly, then assert the DB cascade.
    const label = { id: randomUUID(), name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments)
      .values({
        id: randomUUID(),
        itemId: item.id,
        type: 'local_file',
        label: 'notes.txt',
        createdAt: Date.now(),
      })
      .run();
    db.insert(notifications)
      .values({
        id: randomUUID(),
        itemId: item.id,
        message: 'hi',
        type: 'item_in_workphase',
        createdAt: Date.now(),
      })
      .run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages)
      .values({
        id: randomUUID(),
        threadId: thread.id,
        role: 'user',
        content: 'hello',
        createdAt: Date.now(),
      })
      .run();

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
    const agent = (
      await request(app).post('/api/agents').send({ name: 'Claude', claudeProjectId: 'p1', surface: 'code' })
    ).body;
    const item = await createItem({ projectId: project.id, assigneeType: 'agent', agentId: agent.id });

    const del = await request(app).delete(`/api/agents/${agent.id}`);
    expect(del.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.agentId).toBeNull();
  });
});

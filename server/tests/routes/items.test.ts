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
} from '../fixtures.js';

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
    db.update(items).set({ parentId: b.id }).where(eq(items.id, a.id)).run();
    db.update(items).set({ parentId: a.id }).where(eq(items.id, b.id)).run();

    const res = await request(app).get(`/api/items/${a.id}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.depth).toBe('number');
  });
});

describe('POST /api/items', () => {
  async function setupTodoAndInProgress() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress };
  }

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
    const { project, todo, inProgress } = await setupTodoAndInProgress();
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
    const { project, workflow, todo } = await setupTodoAndInProgress();
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
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
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
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
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
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const quiet = await createWorkphase(workflow.id, { name: 'Todo' });
    const noisy = await createWorkphase(workflow.id, { name: 'Review', triggersNotification: true });
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
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });
    // Pinned to a value append-fallback would never naturally produce, so a
    // pass here can't be coincidental the way `toBeGreaterThan` checks
    // elsewhere in this describe block can be.
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

describe('position resolution', () => {
  async function setupTwoPhases(doneOverrides: Record<string, unknown> = {}) {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true, ...doneOverrides });
    return { project, workflow, todo, done };
  }

  async function setupThreePhases() {
    const { project, workflow, todo, done } = await setupTwoPhases();
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress, done };
  }

  const move = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/items/${id}/move`).send(body);
  const fetchItem = async (id: string) => (await request(app).get(`/api/items/${id}`)).body;

  // An item created at the workflow's end, then pinned to `position` (written directly: no request names one).
  async function itemAt(projectId: string, workphaseId: string, position: number, title = 'Pinned') {
    const created = await createItem({ projectId, workphaseId, title });
    setItemPosition(created.id, position);
    return { ...created, position };
  }

  it('TC-2.6: a create with no anchor goes after the true last Free item, in whichever workphase it is', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    await itemAt(project.id, inProgress.id, 4.2);
    const created = await createItem({ projectId: project.id, workphaseId: todo.id });
    expect(created.position).toBe(5);
  });

  it("TC-2.7: an empty workphase isn't an empty scope: a create there goes after the workflow's last item", async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    await itemAt(project.id, todo.id, 3.0);
    const created = await createItem({ projectId: project.id, workphaseId: inProgress.id });
    expect(created.position).toBe(4);
  });

  it("TC-2.10: a Free item's true neighbor may be in another workphase, and is never an attached child", async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    const a = await itemAt(project.id, todo.id, 1.0, 'A');
    await itemAt(project.id, inProgress.id, 2.0, 'B');
    await itemAt(project.id, todo.id, 3.0, 'C');
    const child = await createItem({ projectId: project.id, parentId: a.id, title: 'A1' });
    setItemPosition(child.id, 1.2);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const res = await move(x.id, { anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.5); // between A and B, not between A and its child's 1.2
  });

  it('TC-2.31: a move naming its own workphase and no anchor appends the item', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    expect(x.position).toBe(1.0);
    await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Y' }); // 2.0

    const res = await move(x.id, { workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(3);
  });

  it('TC-2.5: every prepend before the true first item stays above 0.0, through the reindex that repeating it forces', async () => {
    const { project, todo } = await setupTwoPhases();
    let first = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'first' });
    expect(first.position).toBe(1.0);
    const resolved: number[] = [];
    let reindexed = false;
    // Each prepend halves the gap to the floor, so the resolver's decimal
    // depth runs out within a few dozen steps.
    for (let step = 0; step < 100 && !reindexed; step++) {
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: `x${step}` });
      const res = await move(x.id, { anchorId: first.id, side: 'before' });
      expect(res.status).toBe(200);
      resolved.push(res.body.position);
      reindexed = Array.isArray(res.body.reindexed);
      first = res.body;
    }
    expect(reindexed).toBe(true);
    expect(resolved[0]).toBe(0.5); // the floor-bounded fit, not 1.0 − 1.0
    expect(resolved.every(p => p > 0)).toBe(true);
  });

  it("TC-3.4: a new attached child goes after its own parent's last child, whatever is last in the workphase", async () => {
    const { project, todo } = await setupTwoPhases();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const q = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Q' });
    await createItem({ projectId: project.id, parentId: p.id, title: 'P1' }); // 1.0
    await createItem({ projectId: project.id, parentId: p.id, title: 'P2' }); // 2.0
    const q1 = await createItem({ projectId: project.id, parentId: q.id, title: 'Q1' });
    setItemPosition(q1.id, 5.0);
    await itemAt(project.id, todo.id, 7.0, 'F');

    const child = await createItem({ projectId: project.id, parentId: p.id, title: 'P3' });
    expect(child.position).toBe(3);
  });

  it('TC-5.4, TC-5.13, TC-5.14: the magnitude trigger renumbers every active workphase in one sequence, and discloses them all', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    // Both created before either is pinned: a create after a pin this high would reindex on its own.
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'B' });
    setItemPosition(a.id, 1100);
    setItemPosition(b.id, 1200);

    // n = 2, so the next append (1201) crosses max(1000, 102).
    const res = await request(app).post('/api/items').send({ title: 'N', projectId: project.id, workphaseId: todo.id });
    expect(res.status).toBe(201);
    expect(res.body.position).toBe(3);
    expect(res.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: res.body.id, position: 3 },
    ]);
  });

  it('TC-6.9: a reopened done item takes the append fallback, not the position it had before', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    expect(x.position).toBe(1.0);
    await itemAt(project.id, todo.id, 6.0, 'E');
    expect((await move(x.id, { workphaseId: done.id })).body.position).toBeNull();

    const res = await move(x.id, { workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(7);
  });

  it('TC-7.1: "first in list" is a before-anchor on the first item, and resolves by the floor-bounded prepend', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await itemAt(project.id, todo.id, 2.0, 'A');
    await itemAt(project.id, todo.id, 3.0, 'B');
    await itemAt(project.id, todo.id, 4.0, 'C');
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const res = await move(x.id, { anchorId: a.id, side: 'before' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1);
  });

  it('TC-7.2: "last in list" is an after-anchor on the last item: an append when it is the true last, a fit before an unseen neighbor', async () => {
    const { project, todo } = await setupTwoPhases();
    await itemAt(project.id, todo.id, 2.0, 'A');
    await itemAt(project.id, todo.id, 3.0, 'B');
    const c = await itemAt(project.id, todo.id, 4.0, 'C');
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const last = await move(x.id, { anchorId: c.id, side: 'after' });
    expect(last.status).toBe(200);
    expect(last.body.position).toBe(5);

    await itemAt(project.id, todo.id, 4.4, 'unseen');
    const beforeUnseen = await move(x.id, { anchorId: c.id, side: 'after' });
    expect(beforeUnseen.status).toBe(200);
    expect(beforeUnseen.body.position).toBe(4.2);
  });

  it("TC-X.1: a detached child is positioned in the workflow, not among its parent's children", async () => {
    const { project, todo } = await setupTwoPhases();
    const p = await itemAt(project.id, todo.id, 10.0, 'P');
    const detachedChild = async (title: string, position: number) => {
      const created = await createItem({
        projectId: project.id,
        parentId: p.id,
        title,
        isAttached: false,
        workphaseId: todo.id,
      });
      setItemPosition(created.id, position);
      return created;
    };
    const d1 = await detachedChild('D1', 1.0);
    await itemAt(project.id, todo.id, 2.0, 'T');
    const d2 = await detachedChild('D2', 3.0);

    const res = await move(d2.id, { anchorId: d1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.5); // between D1 and its workflow neighbor T
  });

  it('TC-2.7, TC-2.18, TC-3.4: POST scopes a new attached child to its true siblings, not the whole workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    // Unrelated top-level items sharing the workphase must not pollute the
    // new child's position, as they would if the scope were the workphase.
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 1' });
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 2' });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children
    expect(typeof child.position).toBe('number'); // TC-2.18: position's shape is unchanged (number|null)
  });

  it('TC-2.18, TC-6.1, TC-6.3: POST into a terminal workphase gets no position, but a completedAt timestamp', async () => {
    const { project, done } = await setupTwoPhases();
    const before = Date.now();
    const res = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    const after = Date.now();
    expect(res.status).toBe(201);
    expect(res.body.position).toBeNull(); // TC-2.18: the other half of position's number|null shape
    expect(res.body.completedAt).toBeGreaterThanOrEqual(before); // the time of the write
    expect(res.body.completedAt).toBeLessThanOrEqual(after);
  });

  it('TC-2.20: attaching to a parent reassigns a fresh position scoped to the new siblings', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    await createItem({ projectId: project.id, parentId: parent.id, title: 'Existing sibling' }); // position 1.0
    const detached = await createItem({
      projectId: project.id,
      workphaseId: todo.id,
      title: 'Detached',
      isAttached: false,
    });
    // A workflow position the sibling append can't coincide with.
    setItemPosition(detached.id, 5.0);

    const res = await request(app).put(`/api/items/${detached.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0); // fresh, past the existing sibling — not its old workflow-scoped value
    expect(res.body.positionScope).toBe('attached-siblings');
  });

  it('ATT-7.2, TC-2.19: detaching reassigns a fresh position scoped to the workflow', async () => {
    const { project, todo } = await setupTwoPhases();
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing root' }); // position 1.0
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' }); // position 2.0
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, position 1.0 among siblings

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(3); // appended past the workflow's last Free item, not 1.0 kept
    expect(res.body.positionScope).toBe('workflow');
  });

  it('ATT-7.4, TC-6.3: detaching into a terminal workphase clears position and sets completedAt', async () => {
    const { project, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Done, keeps a position

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('ATT-3.1, TC-2.21: reparenting while staying attached reassigns a fresh position scoped to the new parent', async () => {
    const { project, todo } = await setupTwoPhases();
    const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
    const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
    await createItem({ projectId: project.id, parentId: parentB.id, title: 'Existing under B' }); // position 1.0
    const child = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0);
  });

  it('TC-2.23: a redundant re-attach to the same parent leaves position untouched', async () => {
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

  describe('top-level items sharing one workphase', () => {
    // Fresh GET-based reads, not the move response — a genuine persisted-
    // order check on reload, same convention as
    // itemRepositioningAttachedSiblings.spec.ts's siblingOrder helper.
    async function orderOf(items: { id: string; title: string }[]): Promise<string> {
      const fetched = await Promise.all(items.map(i => request(app).get(`/api/items/${i.id}`)));
      return fetched
        .map((res, idx) => ({ title: items[idx].title, position: res.body.position as number }))
        .sort((x, y) => x.position - y.position)
        .map(i => i.title)
        .join('');
    }

    async function seedABC() {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
      const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
      const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0
      return { a, b, c };
    }

    it('TC-2.5: C before A — becomes the new true first item', async () => {
      const { a, b, c } = await seedABC();
      const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'before' });
      expect(res.status).toBe(200);
      // No true predecessor before A -> floor-anchored coarsest-fit between
      // 0.0 and A's 1.0, not a flat A.position - 1.0.
      expect(res.body.position).toBe(0.5);
      expect(await orderOf([a, b, c])).toBe('CAB');
    });

    it('TC-2.1: C after A / C before B — same true-neighbor midpoint from either anchor', async () => {
      const { a, b, c } = await seedABC();
      const afterA = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(afterA.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');

      const beforeB = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: b.id, side: 'before' });
      expect(beforeB.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');
    });

    it('A after C — becomes the new true last item', async () => {
      const { a, b, c } = await seedABC();
      const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: c.id, side: 'after' });
      expect(res.status).toBe(200);
      // No true successor after C -> append fallback, C.position + 1.0.
      expect(res.body.position).toBe(4.0);
      expect(await orderOf([a, b, c])).toBe('BCA');
    });
  });

  it('TC-X.6: excludes the item itself from its own scope query on reposition', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id }); // 1.0
    const x = await createItem({ projectId: project.id, workphaseId: todo.id }); // 2.0
    await createItem({ projectId: project.id, workphaseId: todo.id }); // b: 3.0
    // Force x to sit numerically between a and b — if x's own (pre-move) row
    // weren't excluded from its scope query, resolving "after a" would find
    // x itself as the closest neighbor and anchor against its stale value.
    setItemPosition(x.id, 1.5);

    const res = await request(app).patch(`/api/items/${x.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    // Correctly resolves against the true next neighbor (b, at 3.0),
    // skipping x's own stale 1.5 — a buggy resolution would land below 1.5.
    expect(res.body.position).toBe(2);
  });

  it('move rejects an invalid side when anchorId is given', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: a.id, side: 'sideways' });
    expect(res.status).toBe(400);
  });

  it('TC-2.8: move rejects a non-existent anchorId, and writes neither the workphase nor a position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await move(a.id, { anchorId: 'no-such-item', side: 'after', workphaseId: done.id });
    expect(res.status).toBe(400);
    expect(await fetchItem(a.id)).toMatchObject({ workphaseId: todo.id, position: a.position, completedAt: null });
  });

  it('TC-2.8: move rejects anchoring to a done item (no position to anchor against)', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const active = await createItem({ projectId: project.id, workphaseId: todo.id });
    const doneItem = await request(app)
      .post('/api/items')
      .send({ title: 'Done item', projectId: project.id, workphaseId: done.id });

    const res = await request(app)
      .patch(`/api/items/${active.id}/move`)
      .send({ anchorId: doneItem.body.id, side: 'after' });
    expect(res.status).toBe(400);
  });

  describe("move rejects an anchorId outside the subject's position scope", () => {
    // What a refused move would have changed: none of it did.
    const unchanged = (item: { parentId: string | null; workphaseId: string | null; position: number | null }) => ({
      parentId: item.parentId,
      workphaseId: item.workphaseId,
      position: item.position,
    });

    it("TC-7.10: rejects anchoring a detached item against someone else's attached child", async () => {
      const { project, todo } = await setupTwoPhases();
      const detached = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Detached' });
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });

      const res = await request(app)
        .patch(`/api/items/${detached.id}/move`)
        .send({ anchorId: attachedChild.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
      expect(await fetchItem(detached.id)).toMatchObject(unchanged(detached));
    });

    it('rejects anchoring an attached child against an attached child of a different parent', async () => {
      const { project, todo } = await setupTwoPhases();
      const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
      const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
      const childOfA = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child of A' });
      const childOfB = await createItem({ projectId: project.id, parentId: parentB.id, title: 'Child of B' });

      const res = await request(app)
        .patch(`/api/items/${childOfA.id}/move`)
        .send({ anchorId: childOfB.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
    });

    it('TC-7.10: rejects anchoring against an item in a different workflow', async () => {
      const { project, todo } = await setupTwoPhases();
      const subject = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Subject' });

      const otherProject = await createProject();
      const otherWorkflow = await createWorkflow(otherProject.id);
      const otherPhase = await createWorkphase(otherWorkflow.id, { name: 'Other Todo' });
      const foreignAnchor = await createItem({
        projectId: otherProject.id,
        workphaseId: otherPhase.id,
        title: 'Foreign Anchor',
      });

      const res = await request(app)
        .patch(`/api/items/${subject.id}/move`)
        .send({ anchorId: foreignAnchor.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
      expect(await fetchItem(subject.id)).toMatchObject(unchanged(subject));
    });

    it('still allows anchoring within the same workflow-wide scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id });
      const b = await createItem({ projectId: project.id, workphaseId: todo.id });

      const res = await request(app).patch(`/api/items/${b.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(res.status).toBe(200);
    });

    it('still allows anchoring within the same attached-siblings scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child A' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child B' });

      const res = await request(app).patch(`/api/items/${childB.id}/move`).send({ anchorId: childA.id, side: 'after' });
      expect(res.status).toBe(200);
    });
  });

  it('TC-6.1, TC-6.3: moving into a terminal workphase clears position and sets completedAt', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const before = Date.now();
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: done.id });
    const after = Date.now();
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThanOrEqual(before); // the time of the write
    expect(res.body.completedAt).toBeLessThanOrEqual(after);
  });

  it('TC-6.2, TC-6.9: moving out of a terminal workphase clears completedAt and assigns a fresh position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const existing = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing' }); // position 1.0
    const item = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(item.body.completedAt).toBeGreaterThan(0);

    const res = await request(app).patch(`/api/items/${item.body.id}/move`).send({ workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    // TC-6.9: proves the fresh position specifically follows append-fallback
    // (past the true last item in scope) — not just "some non-null value".
    expect(res.body.position).toBeGreaterThan(existing.position);
  });

  it('TC-2.13: GET returns positionScope = "attached-siblings" for an attached child', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });

    const res = await request(app).get(`/api/items/${child.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('attached-siblings');
  });

  // GET /:id computes every child's positionScope from one batched
  // workphase lookup; two distinct workphases across parent + children in
  // one response catch a batching mistake that only shows up with more than
  // one workphaseId involved.
  it('GET attaches positionScope to the item and to every child in its children array', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });
    const detachedChild = await createItem({
      projectId: project.id,
      parentId: parent.id,
      workphaseId: done.id,
      isAttached: false,
      title: 'Detached Child',
    });

    const res = await request(app).get(`/api/items/${parent.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');

    const children = res.body.children as Array<{ id: string; positionScope: string }>;
    expect(children.find(c => c.id === attachedChild.id)?.positionScope).toBe('attached-siblings');
    expect(children.find(c => c.id === detachedChild.id)?.positionScope).toBe('none');
  });

  it('ATT-1.1, TC-2.14: GET returns positionScope = "workflow" for a top-level item in a non-terminal workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');
  });

  it('TC-2.15: GET returns positionScope = "none" for a done item', async () => {
    const { project, done } = await setupTwoPhases();
    const item = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });

    const res = await request(app).get(`/api/items/${item.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('none');
  });

  describe('multi-workphase active-scope reindex', () => {
    async function getPosition(id: string) {
      return (await request(app).get(`/api/items/${id}`)).body.position;
    }

    it('TC-2.12, TC-5.1, TC-5.4, TC-5.9, TC-5.13, TC-5.14: reindexes every non-terminal workphase in the workflow together, in one coordinated pass', async () => {
      const { project, todo, inProgress } = await setupThreePhases();

      // A tight, unresolvable gap within `todo` — the trigger.
      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(itemT1.id, 1.0);
      setItemPosition(itemT2.id, 1.0 + 1e-13);

      // A third item in a DIFFERENT non-terminal workphase, same workflow —
      // this is what proves the coordinated (not per-workphase) scope.
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      setItemPosition(itemP1.id, 5.0);

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });
      expect(res.status).toBe(200);

      // Precision exhausted between T1 and T2 -> the reindex ran over the
      // full workflow-wide scope (positionScopeFor), not just `todo` ->
      // T1/T2/P1 all land as clean sequential integers in one pass, then
      // Mover's insert retries and resolves the now-open T1/T2 gap.
      expect(await getPosition(itemT1.id)).toBe(1);
      expect(await getPosition(itemT2.id)).toBe(2);
      expect(await getPosition(itemP1.id)).toBe(3); // the coordination proof: a different workphase, reindexed together
      expect(res.body.position).toBe(1.5);
      // Every renumbered item is disclosed, In Progress's P1 too, and then the mover's own pair.
      expect(res.body.reindexed).toEqual([
        { id: itemT1.id, position: 1 },
        { id: itemT2.id, position: 2 },
        { id: itemP1.id, position: 3 },
        { id: mover.id, position: 1.5 },
      ]);
    });

    // positionScopeFor's workflow-wide scope includes terminal workphase ids
    // with no isTerminal filter, so a done item (position: null) is a scope
    // member by workphaseId alone. SQLite sorts NULL first in ASC order, so
    // a reindex that orders by position without its own isNotNull filter
    // would give that done item a real position, when a done item has none.
    // The neighbor lookups are safe on their own (gt()/lt() against a real
    // value never match a null); the reindex's order-and-renumber pass is
    // the one step that needs the filter.
    it('TC-5.5: excludes a done item from an active-scope reindex', async () => {
      const { project, todo, inProgress, done } = await setupThreePhases();

      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(itemT1.id, 1.0);
      setItemPosition(itemT2.id, 1.0 + 1e-13);
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      setItemPosition(itemP1.id, 5.0);

      const doneItem = await request(app)
        .post('/api/items')
        .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
      expect(doneItem.body.position).toBeNull();
      expect(doneItem.body.completedAt).toBeGreaterThan(0);

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });

      const reread = await request(app).get(`/api/items/${doneItem.body.id}`);
      expect(reread.body.position).toBeNull();
      expect(reread.body.completedAt).toBe(doneItem.body.completedAt);
    });
  });

  // positionScopeFor's two branches (attached-siblings: `parentId = X AND
  // isAttached = 1`; workflow-wide: everything else, explicitly excluding
  // `isAttached = 1 AND parentId IS NOT NULL`) are literal complements of
  // each other, so no row can satisfy both — but TC-5.5 (above) is proof
  // that reasoning about a scope predicate isn't the same as verifying it
  // under an actual reindex, so this checks both leak directions directly
  // rather than trusting the construction argument alone.
  describe('reindex scope isolation: attached-siblings vs. workflow-wide', () => {
    it('TC-5.7: an attached-siblings reindex does not touch an unrelated workflow-wide item', async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      setItemPosition(childA.id, 1.0);
      setItemPosition(childB.id, 1.0 + 1e-13); // tight gap -> reindex trigger

      const farAway = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'FarAway' });
      setItemPosition(farAway.id, 500.0);

      const newChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'NewChild' });
      const res = await request(app)
        .patch(`/api/items/${newChild.id}/move`)
        .send({ anchorId: childA.id, side: 'after' });

      // The attached-siblings reindex itself worked (childA/childB got
      // clean sequential positions, newChild resolved into the gap)...
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2);
      expect(res.body.position).toBe(1.5);
      // ...but a workflow-wide item sharing the same workphase, and the
      // parent itself, are both completely untouched by it.
      expect((await request(app).get(`/api/items/${farAway.id}`)).body.position).toBe(500);
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(parent.position);
    });

    it("TC-5.8: a workflow-wide reindex does not touch an unrelated parent's attached children", async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      setItemPosition(childA.id, 1.0);
      setItemPosition(childB.id, 2.0); // plenty of room, not a trigger

      const t1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const t2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(t1.id, 10.0);
      setItemPosition(t2.id, 10.0 + 1e-13); // tight gap -> reindex trigger

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: t1.id, side: 'after' });

      // The workflow-wide reindex itself worked — `parent` is itself a
      // plain top-level (non-attached) item, so it's a workflow-wide scope
      // member too and gets swept into the same reindex, ahead of T1/T2 by
      // position order.
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${t1.id}`)).body.position).toBe(2);
      expect((await request(app).get(`/api/items/${t2.id}`)).body.position).toBe(3);
      expect(res.body.position).toBe(2.5);
      // ...but the unrelated parent's attached children, sharing the same
      // workphase, are completely untouched by it.
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1.0);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2.0);
    });
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

describe('attached children', () => {
  async function setupTwoPhases() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress };
  }

  it('ATT-1.3: moving a parent cascades through attached children and grandchildren', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    expect((await request(app).get(`/api/items/${child.id}`)).body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it("TC-2.25: cascading a non-terminal-to-non-terminal move leaves an attached child's position untouched", async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    // A cascade only ever writes {workphaseId, updatedAt} on a cascaded
    // child — position is a separate, untouched axis regardless of how many
    // times the parent's workphase changes.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(inProgress.id);
    expect(updatedChild.body.position).toBe(child.position);
  });

  it('ATT-1.4, ATT-1.5, TC-6.5, TC-6.6: an attached child keeps its position when its parent cascades into a terminal workphase', async () => {
    const { project, workflow, todo } = await setupTwoPhases();
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0);

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    // The parent itself does go through the active->done transition...
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);

    // ...but the attached child's own scope is (parentId, isAttached), never
    // workphaseId, and done-tracking is for Free items only, so its position
    // and completedAt are untouched even though its cascaded workphaseId is
    // now terminal.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(done.id);
    expect(updatedChild.body.position).toBe(child.position);
    expect(updatedChild.body.completedAt).toBeNull();
    expect(updatedChild.body.positionScope).toBe('attached-siblings');
  });

  it('ATT-1.5: a Stub reads done under a done parent and not done once it reopens, with only its workphase written', async () => {
    const { project, workflow, todo } = await setupTwoPhases();
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const row = () => db.select().from(items).where(eq(items.id, child.id)).get()!;

    // Each change writes the cascaded workphase and the modification
    // timestamp on the child, and nothing else: no completedAt either way.
    for (const workphaseId of [done.id, todo.id]) {
      const before = row();
      expect((await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId })).status).toBe(200);
      const after = row();
      expect(after).toEqual({ ...before, workphaseId, updatedAt: after.updatedAt });
      expect(after.completedAt).toBeNull();
    }
  });

  it('ATT-1.6: a detached child keeps its workphase, position and completedAt through every move of its parent', async () => {
    const { project, workflow, todo, inProgress } = await setupTwoPhases();
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const detachedChild = (title: string, workphaseId: string) =>
      createItem({ projectId: project.id, parentId: parent.id, title, isAttached: false, workphaseId });
    // One active (a position, no completedAt) and one done (completedAt, no position).
    const active = await detachedChild('Active', inProgress.id);
    const finished = await detachedChild('Finished', done.id);
    expect(finished.completedAt).not.toBeNull();
    const tracked = (id: string) => {
      const { workphaseId, position, completedAt } = db.select().from(items).where(eq(items.id, id)).get()!;
      return { workphaseId, position, completedAt };
    };
    const before = { active: tracked(active.id), finished: tracked(finished.id) };

    // Between live workphases, into a terminal one, and back out of it.
    for (const workphaseId of [inProgress.id, done.id, todo.id]) {
      expect((await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId })).status).toBe(200);
      expect({ active: tracked(active.id), finished: tracked(finished.id) }).toEqual(before);
    }
  });

  it('ATT-1.3, ATT-1.6: a detached child halts the cascade for its whole branch', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Root' });
    const detached = await createItem({
      projectId: project.id,
      parentId: root.id,
      title: 'Detached',
      isAttached: false,
      workphaseId: todo.id,
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
      projectId: project.id,
      parentId: parent.id,
      title: 'Child',
      isAttached: false,
      workphaseId: todo.id,
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

  it('a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged', async () => {
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

  it('ATT-4.10: rejects an item becoming its own parent or reparenting to a descendant', async () => {
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

  it('ATT-4.10: rejects reparenting to a non-existent parentId', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  // A cross-project reparent is accepted and the child takes the parent's
  // project (ATT-5.1). The full cascade cases live in
  // items.hierarchy.test.ts; this pins the PUT entry point.
  it('accepts reparenting under a parent in a different project and adopts its projectId', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const itemA = await createItem({ projectId: projectA.id, title: 'Item A' });
    const parentB = await createItem({ projectId: projectB.id, title: 'Parent B' });

    const res = await request(app).put(`/api/items/${itemA.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(parentB.id);
    expect(res.body.projectId).toBe(projectB.id);
  });

  it('TC-3.4: an attached child of a parent with no workphase has none itself, and is still placed among its siblings', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const a = await createItem({ projectId: project.id, parentId: parent.id, title: 'A' });
    const b = await createItem({ projectId: project.id, parentId: parent.id, title: 'B' });
    const c = await createItem({ projectId: project.id, parentId: parent.id, title: 'C' });
    for (const child of [a, b, c]) {
      expect(child).toMatchObject({ workphaseId: null, positionScope: 'attached-siblings' });
    }
    // Each goes after the one before it, as under a parent that has a workphase.
    expect([a.position, b.position, c.position]).toEqual([1, 2, 3]);

    // Once the parent is filed, its children come along with the positions they
    // had, so one can be dropped before another.
    const filed = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: todo.id });
    expect(filed.status).toBe(200);
    const reorder = await request(app).patch(`/api/items/${b.id}/move`).send({ anchorId: a.id, side: 'before' });
    expect(reorder.status).toBe(200);
    expect(reorder.body.position).toBeLessThan(a.position);
  });

  it('a detached child keeps its explicitly passed workphase', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({
      projectId: project.id,
      parentId: parent.id,
      title: 'Child',
      isAttached: false,
      workphaseId: inProgress.id,
    });
    expect(child.workphaseId).toBe(inProgress.id);
    expect(child.isAttached).toBe(0);
  });

  it('ATT-1.14: a create cannot set the flag without a parent, and a parentless create stores it clear', async () => {
    const { project, todo } = await setupTwoPhases();
    const countItems = () => db.select().from(items).all().length;

    const before = countItems();
    const refused = await request(app)
      .post('/api/items')
      .send({ title: 'Solo Root', projectId: project.id, workphaseId: todo.id, isAttached: true });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatch(/requires a parentId/);
    expect(countItems()).toBe(before);

    const unflagged = await request(app)
      .post('/api/items')
      .send({ title: 'Solo Root', projectId: project.id, workphaseId: todo.id });
    expect(unflagged.status).toBe(201);
    expect(unflagged.body.parentId).toBeNull();
    expect(unflagged.body.isAttached).toBe(0);
    // No parent to override it — the given workphaseId is used as-is.
    expect(unflagged.body.workphaseId).toBe(todo.id);
  });

  it('TC-2.17: a parentless item that holds the attachment flag has positionScope "workflow"', async () => {
    const { project, todo } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Solo Root' });
    // No write sets the flag on a top-level item, so the row is written directly.
    db.update(items).set({ isAttached: 1 }).where(eq(items.id, item.id)).run();

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.isAttached).toBe(1);
    // The flag alone isn't attached-siblings: that takes a parent too.
    expect(res.body.positionScope).toBe('workflow');
  });

  // "Attached ⇒ has a parent" holds in the stored row: clearing the parent
  // clears the flag.
  it('ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    expect(child.isAttached).toBe(1);

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(0);
    expect(res.body.workphaseId).toBe(todo.id); // no workphase change is implied
    expect(res.body.positionScope).toBe('workflow'); // now a Free item, freshly positioned
    expect(res.body.position).not.toBeNull();
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

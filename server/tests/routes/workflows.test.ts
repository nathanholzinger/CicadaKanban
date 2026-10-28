import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { notifications, workflows } from '../../src/db/schema.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  findTemplateByName,
  boardsOf,
  readBoard,
  itemIdsOn,
  setItemParent,
  setItemWorkphase,
  templatedWorkflow,
} from '../fixtures.js';

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
    const child = await createItem({
      projectId: project.id,
      workphaseId: workphase.id,
      parentId: root.id,
      title: 'Child',
    });

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(200);
    expect(res.body.workphases).toHaveLength(1);

    const items = res.body.items as Array<{ id: string; depth: number }>;
    expect(items.find(i => i.id === root.id)?.depth).toBe(0);
    expect(items.find(i => i.id === child.id)?.depth).toBe(1);
  });

  it('returns a bounded depth instead of hanging when the data contains a parentId cycle', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);
    const a = await createItem({ projectId: project.id, workphaseId: workphase.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: workphase.id, title: 'B' });
    setItemParent(a.id, b.id);
    setItemParent(b.id, a.id);

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(200);
    const items = res.body.items as Array<{ id: string; depth: number }>;
    expect(typeof items.find(i => i.id === a.id)?.depth).toBe('number');
    expect(typeof items.find(i => i.id === b.id)?.depth).toBe('number');
  });

  it('attaches positionScope to every item, matching GET /api/items/:id for the same rows', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: workphase.id, title: 'Root' });
    const child = await createItem({
      projectId: project.id,
      workphaseId: workphase.id,
      parentId: root.id,
      title: 'Child',
    });
    // A project under this one inherits the workflow, so its item is as much this
    // workflow's as the owner's.
    const inheritor = await createProject({ parentId: project.id });
    const inherited = await createItem({ projectId: inheritor.id, workphaseId: workphase.id, title: 'Inherited' });
    // A project on a workflow of its own, with an item filed into this workflow's
    // workphase, which no write does: the item shows in Unsorted, so nothing orders it.
    const other = await createProject();
    await createWorkflow(other.id);
    const foreign = await createItem({ projectId: other.id, title: 'Foreign' });
    setItemWorkphase(foreign.id, workphase.id);

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    const items = res.body.items as Array<{ id: string; title: string; positionScope: string }>;
    expect(items.find(i => i.id === root.id)?.positionScope).toBe('workflow');
    expect(items.find(i => i.id === child.id)?.positionScope).toBe('attached-siblings');
    expect(items.find(i => i.id === inherited.id)?.positionScope).toBe('workflow');
    expect(items.find(i => i.id === foreign.id)?.positionScope).toBe('none');

    for (const item of items) {
      const single = await request(app).get(`/api/items/${item.id}`);
      expect(single.body.positionScope, item.title).toBe(item.positionScope);
    }
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

  // Unchecked, a bad projectId hits the FK constraint (an opaque 500), and a
  // bad templateId or sourceWorkflowId (neither is an FK) silently creates a
  // zero-workphase workflow.
  it('returns 400 with a specific message when projectId does not reference an existing project', async () => {
    const res = await request(app).post('/api/workflows').send({ name: 'W', projectId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/projectId/);
  });

  it('returns 400 with a specific message when templateId does not reference an existing template', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/templateId/);
  });

  it('returns 400 with a specific message when sourceWorkflowId does not reference an existing workflow', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, sourceWorkflowId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sourceWorkflowId/);
  });

  // An empty string names no row, so it is refused and nothing is created, where it would otherwise
  // read as none and make a workflow with no workphases (wiki row-references §1).
  it.each(['templateId', 'sourceWorkflowId'])(
    'returns 400, and creates nothing, when %s is an empty string',
    async field => {
      const project = await createProject();
      const res = await request(app)
        .post('/api/workflows')
        .send({ name: 'W', projectId: project.id, [field]: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain(field);
      expect((await request(app).get(`/api/workflows?projectId=${project.id}`)).body).toEqual([]);
    },
  );

  // `null` names none, as leaving the field out does (wiki row-references §2).
  it.each(['templateId', 'sourceWorkflowId'])(
    'reads %s: null as none, making a workflow with no workphases',
    async field => {
      const project = await createProject();
      const res = await request(app)
        .post('/api/workflows')
        .send({ name: 'W', projectId: project.id, [field]: null });
      expect(res.status).toBe(201);
      expect(res.body.workphases).toEqual([]);
    },
  );

  it('clones phases from a template when templateId is given', async () => {
    const project = await createProject();
    const flow = await findTemplateByName('flow');
    const res = await request(app).post('/api/workflows').send({
      name: 'From Template',
      projectId: project.id,
      templateId: flow.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
    expect(res.body.workphases.find((p: { name: string }) => p.name === 'Review').triggersNotification).toBe(1);
    expect(res.body.workphases.map((p: { isTerminal: number }) => p.isTerminal)).toEqual([0, 0, 0, 1]);

    // A default board is bootstrapped 1:1 with the just-created workphases
    const boards = await boardsOf(res.body.id);
    expect(boards).toHaveLength(1);
    const detail = await readBoard(boards[0].id);
    expect(detail.columns.map(c => c.displayName)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
  });

  it('clones phases from an existing workflow when sourceWorkflowId is given', async () => {
    const source = await createWorkflow((await createProject()).id);
    await createWorkphase(source.id, { name: 'Backlog', triggersNotification: 1 });
    await createWorkphase(source.id, { name: 'Done', isTerminal: 1 });
    const other = await createProject();

    const res = await request(app).post('/api/workflows').send({
      name: 'Cloned',
      projectId: other.id,
      sourceWorkflowId: source.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Backlog', 'Done']);
    expect(res.body.workphases.map((p: { triggersNotification: number }) => p.triggersNotification)).toEqual([1, 0]);
    expect(res.body.workphases.map((p: { isTerminal: number }) => p.isTerminal)).toEqual([0, 1]);

    const [board] = await boardsOf(res.body.id);
    const detail = await readBoard(board.id);
    expect(detail.columns.map(c => c.displayName)).toEqual(['Backlog', 'Done']);
  });

  it('creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/workflows').send({ name: 'Bare', projectId: project.id });
    expect(res.status).toBe(201);
    expect(res.body.workphases).toEqual([]);

    // Still gets a default board (with zero columns, since there are no phases yet)
    const boards = await boardsOf(res.body.id);
    expect(boards).toHaveLength(1);
    expect((await readBoard(boards[0].id)).columns).toEqual([]);
  });

  it('TREE-10.4: a project has at most one workflow of its own', async () => {
    const p = await createProject({ name: 'P' });
    const c = await createProject({ name: 'C', parentId: p.id });
    const w1 = await createWorkflow(p.id, { name: 'W1' });

    const second = await request(app).post('/api/workflows').send({ name: 'W2', projectId: p.id });
    expect(second.status).toBe(409);
    expect(second.body.error).toContain('W1');
    expect((await request(app).get(`/api/workflows?projectId=${p.id}`)).body.map((w: { id: string }) => w.id)).toEqual([
      w1.id,
    ]);

    // C uses P's, and may be given one of its own.
    const own = await request(app).post('/api/workflows').send({ name: 'W3', projectId: c.id });
    expect(own.status).toBe(201);
  });

  it('TREE-10.1: a workflow given to a project makes it, and each descendant that used the ancestor’s through it, use the new one', async () => {
    // P owns W1, and has a child C. C's children are D, which owns W2, and E,
    // which has none. Each project has an item in a workphase of the workflow it
    // uses.
    const p = await templatedWorkflow('quick', { name: 'P' });
    const c = await createProject({ name: 'C', parentId: p.project.id });
    const d = await templatedWorkflow('quick', { name: 'D', parentId: c.id });
    const e = await createProject({ name: 'E', parentId: c.id });
    const itemIn = (projectId: string, workphaseId: string, title: string) =>
      createItem({ projectId, workphaseId, title });
    const ip = await itemIn(p.project.id, p.workphaseIds[0], 'p');
    const ic = await itemIn(c.id, p.workphaseIds[0], 'c');
    const ie = await itemIn(e.id, p.workphaseIds[0], 'e');
    const id = await itemIn(d.project.id, d.workphaseIds[0], 'd');
    const [board1] = await boardsOf(p.workflow.id);
    const [board2] = await boardsOf(d.workflow.id);
    expect(itemIdsOn(await readBoard(board1.id))).toEqual(new Set([ip.id, ic.id, ie.id]));

    // C used P's workflow, and is given one of its own.
    const res = await request(app).post('/api/workflows').send({ name: 'W3', projectId: c.id });
    expect(res.status).toBe(201);
    const [board3] = await boardsOf(res.body.id);

    // C and E use it now, and their items, still holding W1's workphases, are in
    // its Unsorted. D keeps W2, and P keeps W1.
    const onNew = await readBoard(board3.id);
    expect(itemIdsOn(onNew)).toEqual(new Set([ic.id, ie.id]));
    expect(new Set(onNew.unsorted.invalidItems.map(i => i.id))).toEqual(new Set([ic.id, ie.id]));
    expect(itemIdsOn(await readBoard(board1.id))).toEqual(new Set([ip.id]));
    expect(itemIdsOn(await readBoard(board2.id))).toEqual(new Set([id.id]));
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
    const [{ id: boardId }] = await boardsOf(workflow.id);

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

  it("removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete", async () => {
    for (const via of ['workflow', 'project'] as const) {
      const project = await createProject();
      const workflow = await createWorkflow(project.id);
      const notification = {
        id: randomUUID(),
        workflowId: workflow.id,
        message: 'hi',
        type: 'workflow',
        createdAt: Date.now(),
      };
      db.insert(notifications).values(notification).run();

      const res = await request(app).delete(
        via === 'workflow' ? `/api/workflows/${workflow.id}` : `/api/projects/${project.id}`,
      );
      expect(res.status, via).toBe(204);
      expect(db.select().from(notifications).where(eq(notifications.id, notification.id)).all(), via).toHaveLength(0);
    }
  });

  it('does not fail on cross-project items inheriting the workflow', async () => {
    // A child project with no workflow of its own inherits the parent's; an item
    // in the child sits in one of the (parent) workflow's workphases.
    const parent = await createProject();
    const workflow = await createWorkflow(parent.id);
    const workphase = await createWorkphase(workflow.id);
    const child = await createProject({ parentId: parent.id });
    const crossProjectItem = await createItem({ projectId: child.id, workphaseId: workphase.id });

    // Not an FK-violation 500 that leaves the DB half-torn-down.
    const res = await request(app).delete(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${crossProjectItem.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.workphaseId).toBeNull();
  });

  it('TREE-10.3: after the workflow a project uses is deleted, it uses the nearest one left above it, or none', async () => {
    // P owns W1, and its child C owns W2. D, C's child, has none. Each has an
    // item in a workphase of the workflow it uses. Z is on a workflow of its own.
    const p = await templatedWorkflow('quick', { name: 'P' });
    const c = await templatedWorkflow('quick', { name: 'C', parentId: p.project.id });
    const d = await createProject({ name: 'D', parentId: c.project.id });
    const z = await templatedWorkflow('quick', { name: 'Z' });
    const itemIn = (projectId: string, workphaseId: string, title: string) =>
      createItem({ projectId, workphaseId, title });
    const ip = await itemIn(p.project.id, p.workphaseIds[0], 'p');
    const ic = await itemIn(c.project.id, c.workphaseIds[0], 'c');
    const id = await itemIn(d.id, c.workphaseIds[0], 'd');
    const iz = await itemIn(z.project.id, z.workphaseIds[0], 'z');
    const [boardOfP] = await boardsOf(p.workflow.id);
    const [boardOfZ] = await boardsOf(z.workflow.id);
    const workphaseOf = async (itemId: string) => (await request(app).get(`/api/items/${itemId}`)).body.workphaseId;

    // C and D now use W1, the nearest workflow above them. Their items lost
    // their workphases, so they're in its Unsorted.
    expect((await request(app).delete(`/api/workflows/${c.workflow.id}`)).status).toBe(204);
    const afterW2 = await readBoard(boardOfP.id);
    expect(itemIdsOn(afterW2)).toEqual(new Set([ip.id, ic.id, id.id]));
    expect(new Set(afterW2.unsorted.invalidItems.map(i => i.id))).toEqual(new Set([ic.id, id.id]));
    expect([await workphaseOf(ic.id), await workphaseOf(id.id)]).toEqual([null, null]);

    // No workflow is left above any of them: Z's boards don't list their items.
    expect((await request(app).delete(`/api/workflows/${p.workflow.id}`)).status).toBe(204);
    expect(itemIdsOn(await readBoard(boardOfZ.id))).toEqual(new Set([iz.id]));
  });

  it("deletes a workflow with a null projectId without touching any project's items", async () => {
    // workflow.projectId is only reachable as null by seeding directly — the
    // POST route requires projectId, so the API can never produce this state.
    const orphanId = randomUUID();
    const now = Date.now();
    db.insert(workflows)
      .values({
        id: orphanId,
        projectId: null,
        name: 'Orphan',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const res = await request(app).delete(`/api/workflows/${orphanId}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/workflows/${orphanId}`)).status).toBe(404);
  });
});

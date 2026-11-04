import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { boards, columns, notifications, workflows, workphases } from '../../src/db/schema.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createBoard,
  createColumn,
  createItem,
  findTemplateByName,
  boardsOf,
  readBoard,
  itemIdsOn,
  getRow,
  setItemParent,
  setItemWorkphase,
  templatedWorkflow,
  reorderWorkphases,
  workflowWithPhases,
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
    // Created in one order and reordered to another, so the order read back is the position's, not
    // the order the rows were written in.
    const [first, second, third] = [
      await createWorkphase(workflow.id, { name: 'First' }),
      await createWorkphase(workflow.id, { name: 'Second' }),
      await createWorkphase(workflow.id, { name: 'Third' }),
    ];
    expect((await reorderWorkphases([third, first, second])).status).toBe(200);
    const root = await createItem({ projectId: project.id, workphaseId: first.id, title: 'Root' });
    const child = await createItem({
      projectId: project.id,
      workphaseId: first.id,
      parentId: root.id,
      title: 'Child',
    });

    const res = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(res.status).toBe(200);
    expect(res.body.workphases.map((w: { id: string }) => w.id)).toEqual([third.id, first.id, second.id]);

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
    // The walk meets one of the two first. That one counts its parent, which counts the first as a
    // synthetic root, so the pair reads 1 and 2, whichever order they come in.
    const depths = [a, b].map(item => items.find(i => i.id === item.id)?.depth);
    expect(depths.sort()).toEqual([1, 2]);
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
  const workflowsOf = async (projectId: string) =>
    (await request(app).get(`/api/workflows?projectId=${projectId}`)).body;
  // What a workphase is copied by (its id and its owner are its own).
  const settingsOf = (
    phases: Array<{ name: string; position: number; triggersNotification: number; isTerminal: number }>,
  ) =>
    phases.map(({ name, position, triggersNotification, isTerminal }) => ({
      name,
      position,
      triggersNotification,
      isTerminal,
    }));

  it('returns 400 when name is missing', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/workflows').send({ projectId: project.id });
    expect(res.status).toBe(400);
  });

  // Unchecked, a bad projectId hits the FK constraint (an opaque 500), and a
  // bad templateId or sourceWorkflowId (neither is an FK) silently creates a
  // zero-workphase workflow.
  it('TREE-10.12: returns 400 with a specific message when projectId does not reference an existing project', async () => {
    const res = await request(app).post('/api/workflows').send({ name: 'W', projectId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/projectId/);
  });

  // A projectId that is left out, null or empty is refused as missing, and one that isn't a string, as
  // a value that can't name a project. better-sqlite3 throws on binding most of those (a 500), and
  // flattens an array to the one id it holds, so that created the workflow (wiki row-references §1).
  // Each message names the field all the same.
  it('TREE-10.12: refuses a projectId that is left out, null, unknown, empty or not a string, and creates nothing', async () => {
    const p = await createProject({ name: 'P' });
    const q = await createProject({ name: 'Q' });
    const w = await createWorkflow(q.id);
    const workflowIds = async () =>
      (await request(app).get('/api/workflows')).body.map((workflow: { id: string }) => workflow.id).sort();
    const before = await workflowIds();

    const values = [null, 'does-not-exist', '', false, 0, 7, true, {}, [], [p.id], [q.id]];
    for (const body of [{}, ...values.map(projectId => ({ projectId }))]) {
      const res = await request(app)
        .post('/api/workflows')
        .send({ name: 'W', ...body });
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error, JSON.stringify(body)).toContain('projectId');
    }

    expect(await workflowIds()).toEqual(before);
    expect(await workflowsOf(p.id)).toEqual([]);
    expect((await workflowsOf(q.id)).map((workflow: { id: string }) => workflow.id)).toEqual([w.id]);
    // Nothing the refusals did stands in the way of a create that names the project by its id.
    const created = await request(app).post('/api/workflows').send({ name: 'W', projectId: p.id });
    expect(created.status).toBe(201);
  });

  // The checks run in order: a value that isn't a string is refused as one, ahead of whether it
  // names a project or whether that project already has a workflow of its own.
  it('TREE-10.12: refuses a projectId that is not a string ahead of the ownership check', async () => {
    const owner = await createProject();
    const ownerWorkflow = await createWorkflow(owner.id);
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: [owner.id] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('projectId');
    expect(res.body.error).not.toMatch(/already has a workflow/);
    expect((await workflowsOf(owner.id)).map((w: { id: string }) => w.id)).toEqual([ownerWorkflow.id]);
  });

  it('TREE-10.8: returns 400 with a specific message, and creates nothing, when templateId does not reference an existing template', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/templateId/);
    expect(await workflowsOf(project.id)).toEqual([]);
  });

  it('TREE-10.8: returns 400 with a specific message, and creates nothing, when sourceWorkflowId does not reference an existing workflow', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, sourceWorkflowId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sourceWorkflowId/);
    expect(await workflowsOf(project.id)).toEqual([]);
  });

  // An empty string names no row, so it is refused and nothing is created, where it would otherwise
  // read as none and make a workflow with no workphases (wiki row-references §1).
  it.each(['templateId', 'sourceWorkflowId'])(
    'TREE-10.9: returns 400, and creates nothing, when %s is an empty string',
    async field => {
      const project = await createProject();
      const res = await request(app)
        .post('/api/workflows')
        .send({ name: 'W', projectId: project.id, [field]: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain(field);
      expect(await workflowsOf(project.id)).toEqual([]);
    },
  );

  // A value that isn't a string can't name a row, and better-sqlite3 throws on binding most of them, so
  // the shape is refused before the existence check, where it would otherwise be a 500.
  it.each(['templateId', 'sourceWorkflowId'])(
    'returns 400, and creates nothing, when %s is not a string',
    async field => {
      const project = await createProject();
      // The array holds an id the field would name, which is the value that would pass the lookup.
      const named =
        field === 'templateId'
          ? (await findTemplateByName('flow')).id
          : (await createWorkflow((await createProject()).id)).id;
      for (const value of [true, false, 7, 0, {}, [], [named]]) {
        const res = await request(app)
          .post('/api/workflows')
          .send({ name: 'W', projectId: project.id, [field]: value });
        expect(res.status, JSON.stringify(value)).toBe(400);
        expect(res.body.error, JSON.stringify(value)).toContain(field);
      }
      expect(await workflowsOf(project.id)).toEqual([]);
    },
  );

  // `null` names none, as leaving the field out does (wiki row-references §2).
  it.each(['templateId', 'sourceWorkflowId'])(
    'TREE-10.10: reads %s: null as none, making a workflow with no workphases',
    async field => {
      const project = await createProject();
      const res = await request(app)
        .post('/api/workflows')
        .send({ name: 'W', projectId: project.id, [field]: null });
      expect(res.status).toBe(201);
      expect(res.body.workphases).toEqual([]);
    },
  );

  // A create that names both would have to drop one without a sign, so it is refused whole, ahead of
  // either field's existence check.
  it('TREE-10.11: returns 400, and creates nothing, when both templateId and sourceWorkflowId are named', async () => {
    const project = await createProject();
    const source = await createWorkflow((await createProject()).id);
    await createWorkphase(source.id, { name: 'Backlog' });
    const flow = await findTemplateByName('flow');
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: flow.id, sourceWorkflowId: source.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('templateId');
    expect(res.body.error).toContain('sourceWorkflowId');
    expect(await workflowsOf(project.id)).toEqual([]);

    // The project still has no workflow of its own, so a create naming the template alone is accepted.
    const alone = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: flow.id });
    expect(alone.status).toBe(201);
    expect(alone.body.workphases.map((p: { name: string }) => p.name)).toEqual([
      'Todo',
      'In Progress',
      'Review',
      'Done',
    ]);
  });

  it('TREE-10.11: refuses a create that names both ahead of checking that either exists', async () => {
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: 'no-template', sourceWorkflowId: 'no-workflow' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('templateId');
    expect(res.body.error).toContain('sourceWorkflowId');
    expect(res.body.error).not.toMatch(/does not reference/);
    expect(await workflowsOf(project.id)).toEqual([]);
  });

  // A field that is `null` isn't named, so a caller that always sends both can ask for the one it means.
  it('TREE-10.10: creates from the template when sourceWorkflowId is null', async () => {
    const project = await createProject();
    const flow = await findTemplateByName('flow');
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: flow.id, sourceWorkflowId: null });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
  });

  it('TREE-10.10: creates from the source workflow when templateId is null', async () => {
    const source = await createWorkflow((await createProject()).id);
    await createWorkphase(source.id, { name: 'Backlog' });
    const project = await createProject();
    const res = await request(app)
      .post('/api/workflows')
      .send({ name: 'W', projectId: project.id, templateId: null, sourceWorkflowId: source.id });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Backlog']);
  });

  it('TREE-10.5: clones phases from a template when templateId is given', async () => {
    const project = await createProject();
    const flow = await findTemplateByName('flow');
    const res = await request(app).post('/api/workflows').send({
      name: 'From Template',
      projectId: project.id,
      templateId: flow.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
    expect(res.body.workphases.map((p: { triggersNotification: number }) => p.triggersNotification)).toEqual([
      0, 0, 1, 0,
    ]);
    expect(res.body.workphases.map((p: { isTerminal: number }) => p.isTerminal)).toEqual([0, 0, 0, 1]);
    // Each is a copy of the template's phase: the same settings, and an id of its own.
    expect(settingsOf(res.body.workphases)).toEqual(settingsOf(flow.workphases));
    expect(res.body.workphases.map((p: { id: string }) => p.id)).not.toEqual(
      flow.workphases.map((p: { id: string }) => p.id),
    );

    // A default board is bootstrapped 1:1 with the just-created workphases
    const boards = await boardsOf(res.body.id);
    expect(boards).toHaveLength(1);
    const detail = await readBoard(boards[0].id);
    expect(detail.columns.map(c => c.displayName)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
  });

  it('TREE-10.6: clones phases from an existing workflow when sourceWorkflowId is given', async () => {
    const source = await createWorkflow((await createProject()).id);
    await createWorkphase(source.id, { name: 'Backlog', triggersNotification: 1 });
    await createWorkphase(source.id, { name: 'Done', isTerminal: 1 });
    const workphasesOf = async (workflowId: string) =>
      (await request(app).get(`/api/workflows/${workflowId}`)).body.workphases as Array<{ id: string; name: string }>;
    const before = await workphasesOf(source.id);
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

    // They are the clone's own: the source still has its workphases, unchanged, and renaming one of
    // the clone's leaves its counterpart's name alone.
    expect(await workphasesOf(source.id)).toEqual(before);
    const rename = await request(app).put(`/api/workphases/${res.body.workphases[0].id}`).send({ name: 'Renamed' });
    expect(rename.status).toBe(200);
    expect((await workphasesOf(res.body.id)).map(p => p.name)).toEqual(['Renamed', 'Done']);
    expect(await workphasesOf(source.id)).toEqual(before);
  });

  it('TREE-10.7: creates a bare workflow with no phases when neither templateId nor sourceWorkflowId is given', async () => {
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

  // W has two boards, with a column over each of its two workphases, and notifications, one of them
  // on item X. Q, another project, owns V, with a board, a column, a workphase and a notification of
  // its own. X holds W's first workphase and Z, in Q, its second; a request can't file Z in a
  // workflow Q doesn't use (wiki item-attachment §2a), so its workphase is written directly, as is
  // W's having no owner. Y, in Q, holds V's.
  it.each(['owned', 'ownerless'] as const)(
    'TREE-10.13: deletes an %s workflow with its boards, columns, workphases and notifications, and keeps every item',
    async variant => {
      const w = await workflowWithPhases(['W1', 'W2'], { name: 'P' });
      const [w1, w2] = w.phases;
      const b1 = w.board;
      await createColumn(b1.id, w1.id, w1.id);
      await createColumn(b1.id, w2.id, w2.id);
      const b2 = await createBoard(w.workflow.id, { name: 'B2' });
      const v = await workflowWithPhases(['V1'], { name: 'Q' });
      const [v1] = v.phases;
      await createColumn(v.board.id, v1.id, v1.id);

      const x = await createItem({ title: 'X', projectId: w.project.id, workphaseId: w1.id });
      const z = await createItem({ title: 'Z', projectId: v.project.id });
      setItemWorkphase(z.id, w2.id);
      const y = await createItem({ title: 'Y', projectId: v.project.id, workphaseId: v1.id });

      const notify = (workflowId: string, itemId: string | null = null) =>
        db
          .insert(notifications)
          .values({ id: randomUUID(), itemId, workflowId, message: 'hi', type: 'workflow', createdAt: Date.now() })
          .run();
      notify(w.workflow.id);
      notify(w.workflow.id, x.id);
      notify(v.workflow.id);

      if (variant === 'ownerless') {
        db.update(workflows).set({ projectId: null }).where(eq(workflows.id, w.workflow.id)).run();
      }

      // What a workflow has, in each table: the rows of its own, and the columns of its boards.
      const dependentsOf = (workflowId: string, boardIds: string[]) => ({
        workflow: db.select().from(workflows).where(eq(workflows.id, workflowId)).all(),
        boards: db.select().from(boards).where(eq(boards.workflowId, workflowId)).all(),
        columns: db
          .select()
          .from(columns)
          .all()
          .filter(column => boardIds.includes(column.boardId)),
        workphases: db.select().from(workphases).where(eq(workphases.workflowId, workflowId)).all(),
        notifications: db.select().from(notifications).where(eq(notifications.workflowId, workflowId)).all(),
      });
      const sizes = (rows: Record<string, unknown[]>) =>
        Object.fromEntries(Object.entries(rows).map(([table, list]) => [table, list.length]));
      const wBoards = [b1.id, b2.id];
      const vBefore = dependentsOf(v.workflow.id, [v.board.id]);
      const [xBefore, yBefore, zBefore] = [getRow(x.id), getRow(y.id), getRow(z.id)];
      expect(sizes(dependentsOf(w.workflow.id, wBoards))).toEqual({
        workflow: 1,
        boards: 2,
        columns: 4,
        workphases: 2,
        notifications: 2,
      });
      expect(sizes(vBefore)).toEqual({ workflow: 1, boards: 1, columns: 1, workphases: 1, notifications: 1 });

      const res = await request(app).delete(`/api/workflows/${w.workflow.id}`);
      expect(res.status).toBe(204);

      expect(sizes(dependentsOf(w.workflow.id, wBoards))).toEqual({
        workflow: 0,
        boards: 0,
        columns: 0,
        workphases: 0,
        notifications: 0,
      });
      expect(getRow(x.id)).toEqual({ ...xBefore, workphaseId: null });
      expect(getRow(z.id)).toEqual({ ...zBefore, workphaseId: null });
      expect(getRow(y.id)).toEqual(yBefore);

      const vBoard = await readBoard(v.board.id);
      expect(vBoard.unsorted.invalidItems.map(item => item.id)).toEqual([z.id]);
      expect(vBoard.columns.flatMap(column => column.subRows.flatMap(row => row.items.map(item => item.id)))).toEqual([
        y.id,
      ]);
      expect(dependentsOf(v.workflow.id, [v.board.id])).toEqual(vBefore);
      for (const project of [w.project, v.project]) {
        expect((await request(app).get(`/api/projects/${project.id}`)).status).toBe(200);
      }
    },
  );

  it('TREE-10.13: deletes the workflow, its workphases, and boards/columns, but items survive with a null workphase', async () => {
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

  it("TREE-10.13: removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete", async () => {
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

  it('TREE-10.13: does not fail on cross-project items inheriting the workflow', async () => {
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

  it("TREE-10.13: deletes a workflow with a null projectId without touching any project's items", async () => {
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

    // Another project, with its own workflow and items.
    const other = await workflowWithPhases(['Todo', 'Done']);
    const [todo, done] = other.phases;
    const inTodo = await createItem({ projectId: other.project.id, workphaseId: todo.id, title: 'In Todo' });
    const inDone = await createItem({ projectId: other.project.id, workphaseId: done.id, title: 'In Done' });

    const res = await request(app).delete(`/api/workflows/${orphanId}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/workflows/${orphanId}`)).status).toBe(404);

    const workphaseOf = async (id: string) => (await request(app).get(`/api/items/${id}`)).body.workphaseId;
    expect([await workphaseOf(inTodo.id), await workphaseOf(inDone.id)]).toEqual([todo.id, done.id]);
    expect((await request(app).get(`/api/workflows/${other.workflow.id}`)).status).toBe(200);
  });
});

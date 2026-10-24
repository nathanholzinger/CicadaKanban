import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { columns, items } from '../../src/db/schema.js';
import { inArray } from 'drizzle-orm';
import { ITEM_DEPTH_CAP } from '../../src/lib/itemTree.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createBoard,
  createColumn,
  createItem,
  readBoard,
  boardsOf,
  covers,
  itemIdsOn,
  setItemWorkphase,
  templatedWorkflow,
  workflowWithPhases,
} from '../fixtures.js';

describe('workflow creation bootstraps a default board', () => {
  it('POST /api/workflows creates exactly one board with 1:1 columns matching its workphases', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id, { name: 'Bootstrap Test' });

    const boards = await boardsOf(workflow.id);
    expect(boards).toHaveLength(1);

    // No template/source given, so the workflow (and thus the board) starts with zero workphases/columns
    expect((await readBoard(boards[0].id)).columns).toEqual([]);
  });

  it('BCU-1.1: a new board starts with one column per workphase, in the workflow’s order', async () => {
    const { workflow, workphaseIds } = await templatedWorkflow('flow');
    expect(workphaseIds).toHaveLength(4);

    // The board made with the workflow, and one made afterwards by POST /api/boards.
    const [first] = await boardsOf(workflow.id);
    const second = await createBoard(workflow.id, { name: 'Second' });
    for (const { id } of [first, second]) {
      expect((await readBoard(id)).columns.map(covers)).toEqual(workphaseIds.map(w => [w]));
    }
  });
});

describe('GET /api/boards', () => {
  it('lists boards, optionally filtered by workflowId', async () => {
    const workflowA = await createWorkflow((await createProject()).id);
    const workflowB = await createWorkflow((await createProject()).id);

    const filtered = await request(app).get(`/api/boards?workflowId=${workflowA.id}`);
    expect(filtered.body.length).toBe(1);
    expect(filtered.body[0].workflowId).toBe(workflowA.id);

    const all = await request(app).get('/api/boards');
    expect(all.body.map((b: { workflowId: string }) => b.workflowId).sort()).toEqual(
      [workflowA.id, workflowB.id].sort(),
    );
  });
});

describe('GET /api/boards/:id', () => {
  it('returns 404 for a non-existent board', async () => {
    const res = await request(app).get('/api/boards/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('resolves columns into displayName/broken/entryWorkphaseId/subRows and computes unsorted', async () => {
    const {
      project,
      board,
      phases: [todo, inProgress, done],
    } = await workflowWithPhases(['Todo', 'In Progress', 'Done']);

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
    expect(
      col.subRows
        .find((r: { workphase: { id: string } }) => r.workphase.id === todo.id)
        .items.map((i: { id: string }) => i.id),
    ).toEqual([item1.id]);

    expect(res.body.unsorted.needsAttention).toBe(true);
    expect(res.body.unsorted.uncovered.map((r: { workphase: { id: string } }) => r.workphase.id)).toEqual([done.id]);
    expect(res.body.unsorted.uncovered[0].items.map((i: { id: string }) => i.id)).toEqual([item2.id]);
  });

  // The client's drag-target classification reads the cap off the board
  // rather than hard-coding it (DRAG-2.10 — one constant moves both
  // enforcement points).
  it('DRAG-2.10: carries the item depth cap the API enforces', async () => {
    const { board } = await workflowWithPhases([]);
    const res = await request(app).get(`/api/boards/${board.id}`);
    expect(res.body.itemDepthCap).toBe(ITEM_DEPTH_CAP);
  });

  it('TC-1.1: reports identical position for the same item across two different boards on one workflow', async () => {
    const {
      project,
      workflow,
      board: boardOne,
      phases: [todo],
    } = await workflowWithPhases(['Todo']);
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    // The workflow's default board predates `todo` (bootstrap covers only the workphases that
    // exist when the workflow is made), so it needs a column covering it.
    await createColumn(boardOne.id, todo.id, todo.id);

    // A second, wholly independent board on the same workflow — position
    // is a single item-owned scalar, not a per-board value;
    // boards only ever read it, never own their own copy. This one is made after `todo`, so
    // it is bootstrapped with a column covering it.
    const boardTwo = await createBoard(workflow.id, { name: 'Second Board' });

    const detailOne = await request(app).get(`/api/boards/${boardOne.id}`);
    const detailTwo = await request(app).get(`/api/boards/${boardTwo.id}`);

    const onBoardOne = detailOne.body.columns[0].subRows[0].items.find((i: { id: string }) => i.id === item.id);
    const onBoardTwo = detailTwo.body.columns[0].subRows[0].items.find((i: { id: string }) => i.id === item.id);
    expect(onBoardOne.position).toBe(item.position);
    expect(onBoardTwo.position).toBe(item.position);
    expect(onBoardOne.position).toBe(onBoardTwo.position);
  });

  it('TC-2.16: surfaces items whose workphase was deleted as invalidItems (Unknown status)', async () => {
    const {
      project,
      board,
      phases: [todo, keep],
    } = await workflowWithPhases(['Todo', 'Keep']);
    const stranded = await createItem({ projectId: project.id, workphaseId: todo.id });

    // Deleting the workphase nulls the item's workphaseId (SET NULL) rather than
    // deleting it — the board must still surface it instead of dropping it.
    await request(app).delete(`/api/workphases/${todo.id}`);

    const res = await request(app).get(`/api/boards/${board.id}`);
    expect(res.status).toBe(200);

    const invalidIds = res.body.unsorted.invalidItems.map((i: { id: string }) => i.id);
    expect(invalidIds).toContain(stranded.id);
    expect(res.body.unsorted.needsAttention).toBe(true);
    // With no workphase, it's in no position order: the same scope as a done item's.
    expect((await request(app).get(`/api/items/${stranded.id}`)).body.positionScope).toBe('none');
    void keep;
  });

  it('uses an explicit column name as the displayName override', async () => {
    const {
      board,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const named = await createColumn(board.id, todo.id, inProgress.id, { name: 'Active Work' });

    const res = await request(app).get(`/api/boards/${board.id}`);
    const col = res.body.columns.find((c: { id: string }) => c.id === named.id);
    expect(col.displayName).toBe('Active Work');
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

  it("bootstraps a new board with 1:1 columns matching the workflow's current workphases", async () => {
    const { workflow } = await workflowWithPhases(['Todo', 'Done']);

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

  it('BCU-1.2: a workflow’s last board can’t be deleted', async () => {
    const { workflow } = await templatedWorkflow('quick');
    const [only] = await boardsOf(workflow.id);
    const before = await readBoard(only.id);

    const refused = await request(app).delete(`/api/boards/${only.id}`);
    expect(refused.status).toBe(409);
    expect(await readBoard(only.id)).toEqual(before);

    // With a second board, the first can go; the second is then the last.
    const second = await createBoard(workflow.id, { name: 'Second' });
    expect((await request(app).delete(`/api/boards/${only.id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/boards/${second.id}`)).status).toBe(409);
  });

  it('BCU-1.3: deleting a board that isn’t its workflow’s last deletes its columns', async () => {
    const { workflow } = await templatedWorkflow('quick');
    const [kept] = await boardsOf(workflow.id);
    const doomed = await createBoard(workflow.id, { name: 'Second' });
    const doomedColumnIds = (await readBoard(doomed.id)).columns.map(c => c.id);
    expect(doomedColumnIds).toHaveLength(2);
    const keptBefore = await readBoard(kept.id);

    expect((await request(app).delete(`/api/boards/${doomed.id}`)).status).toBe(204);

    expect((await request(app).get(`/api/boards/${doomed.id}`)).status).toBe(404);
    expect(db.select().from(columns).where(inArray(columns.id, doomedColumnIds)).all()).toEqual([]);
    expect(await readBoard(kept.id)).toEqual(keptBefore);
  });
});

describe('what a board is and shows', () => {
  it('BCU-1.4: no board or column write changes an item', async () => {
    // Two boards with no columns yet; the workphases come after.
    const { project, workflow, board } = await workflowWithPhases([]);
    const second = await createBoard(workflow.id, { name: 'Second' });
    const phases: { id: string; name: string }[] = [];
    for (const name of ['W1', 'W2', 'W3', 'W4']) phases.push(await createWorkphase(workflow.id, { name }));
    const a = await createColumn(board.id, phases[0].id, phases[0].id);
    const c = await createColumn(board.id, phases[1].id, phases[2].id);

    // A Free item in each workphase, each with an Attached Stub.
    for (const phase of phases) {
      const free = await createItem({ projectId: project.id, workphaseId: phase.id, title: `Free in ${phase.name}` });
      await createItem({ projectId: project.id, parentId: free.id, title: `Stub in ${phase.name}` });
    }
    const snapshot = () =>
      db
        .select()
        .from(items)
        .all()
        .sort((x, y) => x.id.localeCompare(y.id));
    const before = snapshot();
    expect(before).toHaveLength(8);

    const writes: [string, () => Promise<{ status: number }>][] = [
      ['a board created', () => request(app).post('/api/boards').send({ workflowId: workflow.id, name: 'Third' })],
      ['a board renamed', () => request(app).put(`/api/boards/${board.id}`).send({ name: 'Renamed' })],
      [
        'a column created',
        () =>
          request(app)
            .post('/api/columns')
            .send({ boardId: board.id, startWorkphaseId: phases[3].id, endWorkphaseId: phases[3].id }),
      ],
      [
        'a column’s range edited',
        () => request(app).put(`/api/columns/${c.id}`).send({ endWorkphaseId: phases[1].id }),
      ],
      [
        'the columns reordered',
        () =>
          request(app)
            .patch('/api/columns/reorder')
            .send({
              columnOrders: [
                { id: c.id, position: 1 },
                { id: a.id, position: 2 },
              ],
            }),
      ],
      ['a column deleted', () => request(app).delete(`/api/columns/${a.id}`)],
      ['the second board deleted', () => request(app).delete(`/api/boards/${second.id}`)],
    ];
    for (const [label, write] of writes) {
      // A refused write would leave the items alone for the wrong reason.
      expect((await write()).status, label).toBeLessThan(300);
      expect(snapshot(), label).toEqual(before);
    }
  });

  it('BCU-1.5: a board shows the items of every project that uses its workflow, its own or inherited', async () => {
    const withWorkflow = async (project: { id: string }) => {
      const workflow = await createWorkflow(project.id);
      return { board: (await boardsOf(workflow.id))[0], phase: await createWorkphase(workflow.id, { name: 'Todo' }) };
    };
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B', parentId: a.id });
    const c = await createProject({ name: 'C', parentId: b.id });
    const d = await createProject({ name: 'D', parentId: a.id });
    const e = await createProject({ name: 'E', parentId: d.id });
    // Z is top-level and uses a workflow of its own: a workflow has one owner,
    // so no project outside D's subtree can use D's.
    const z = await createProject({ name: 'Z' });
    const wf = await withWorkflow(a);
    const wf2 = await withWorkflow(d);
    const wf3 = await withWorkflow(z);

    const itemOf = (project: { id: string }, phase: { id: string }, title: string) =>
      createItem({ projectId: project.id, workphaseId: phase.id, title });
    const ia = await itemOf(a, wf.phase, 'a');
    const ib = await itemOf(b, wf.phase, 'b');
    const ic = await itemOf(c, wf.phase, 'c');
    const id = await itemOf(d, wf2.phase, 'd');
    const ie = await itemOf(e, wf2.phase, 'e');
    await itemOf(z, wf3.phase, 'z');

    // D uses its own workflow, and E uses D's, its nearest ancestor that has one.
    expect(itemIdsOn(await readBoard(wf.board.id))).toEqual(new Set([ia.id, ib.id, ic.id]));
    expect(itemIdsOn(await readBoard(wf2.board.id))).toEqual(new Set([id.id, ie.id]));

    // An item with no workphase comes with its project.
    const a0 = await createItem({ projectId: a.id, title: 'a0' });
    expect(itemIdsOn(await readBoard(wf.board.id))).toEqual(new Set([ia.id, ib.id, ic.id, a0.id]));
  });

  it('BCU-1.6: a project that comes to use another workflow takes its items to that workflow’s boards', async () => {
    const q1 = await templatedWorkflow('quick', { name: 'Q1' });
    const q2 = await templatedWorkflow('quick', { name: 'Q2' });
    const p1 = await createProject({ name: 'P1', parentId: q1.project.id });
    const w1 = q1.workphaseIds[0];
    const x = await createItem({ projectId: p1.id, workphaseId: w1, title: 'X' });
    const [board1] = await boardsOf(q1.workflow.id);
    const [board2] = await boardsOf(q2.workflow.id);
    expect(itemIdsOn(await readBoard(board1.id))).toContain(x.id);
    expect(itemIdsOn(await readBoard(board2.id))).not.toContain(x.id);

    const moved = await request(app).patch(`/api/projects/${p1.id}/move`).send({ parentId: q2.project.id });
    expect(moved.status).toBe(200);

    expect(itemIdsOn(await readBoard(board1.id))).not.toContain(x.id);
    const onNew = await readBoard(board2.id);
    expect(itemIdsOn(onNew)).toContain(x.id);
    // Still holding the old workflow's workphase, so it's in Unsorted there.
    expect(onNew.unsorted.invalidItems.map(i => i.id)).toEqual([x.id]);
    expect((await request(app).get(`/api/items/${x.id}`)).body.workphaseId).toBe(w1);
  });
});

describe('Unsorted', () => {
  it('BCU-5.1: uncovered lists each of the workflow’s workphases that no column on the board covers', async () => {
    const {
      board,
      phases: [w1, w2, w3],
    } = await workflowWithPhases(['W1', 'W2', 'W3']);
    const column = await createColumn(board.id, w1.id, w1.id);
    const uncovered = async () => (await readBoard(board.id)).unsorted.uncovered.map(r => r.workphase.id);

    expect(await uncovered()).toEqual([w2.id, w3.id]);
    const edit = { startWorkphaseId: w2.id, endWorkphaseId: w2.id };
    expect((await request(app).put(`/api/columns/${column.id}`).send(edit)).status).toBe(200);
    expect(await uncovered()).toEqual([w1.id, w3.id]);
  });

  it('BCU-5.2: invalidItems lists each item the board shows whose workphase is missing or isn’t the workflow’s', async () => {
    const wf = await templatedWorkflow('quick', { name: 'P' });
    const other = await templatedWorkflow('quick', { name: 'Q' });
    const [boardOfWf] = await boardsOf(wf.workflow.id);

    const itemIn = (projectId: string, workphaseId: string | undefined, title: string) =>
      createItem({ projectId, workphaseId, title });
    const x = await itemIn(wf.project.id, undefined, 'X');
    const y = await itemIn(wf.project.id, wf.workphaseIds[0], 'Y');
    const z = await itemIn(wf.project.id, wf.workphaseIds[0], 'Z');
    const q1 = await itemIn(other.project.id, undefined, 'Q1');
    // The API refuses a workphase of another workflow, so Y gets one by a direct edit.
    setItemWorkphase(y.id, other.workphaseIds[0]);

    const board = await readBoard(boardOfWf.id);
    expect(board.unsorted.invalidItems.map(i => i.id).sort()).toEqual([x.id, y.id].sort());
    expect(itemIdsOn(board)).toContain(z.id);
    // Q1 is another project's, on another workflow: not on this board at all.
    expect(itemIdsOn(board)).not.toContain(q1.id);
  });

  it('BCU-5.3: needsAttention is true when uncovered or invalidItems holds anything', async () => {
    const { project, workflow } = await templatedWorkflow('quick');
    const [{ id: boardId }] = await boardsOf(workflow.id);
    const needsAttention = async () => (await readBoard(boardId)).unsorted.needsAttention;
    expect(await needsAttention()).toBe(false);

    // A workphase no column covers.
    const [first] = (await readBoard(boardId)).columns;
    expect((await request(app).delete(`/api/columns/${first.id}`)).status).toBe(204);
    expect(await needsAttention()).toBe(true);

    // Covered again, an item with no workphase raises it with `uncovered` empty.
    await createColumn(boardId, first.startWorkphaseId, first.endWorkphaseId);
    expect(await needsAttention()).toBe(false);
    await createItem({ projectId: project.id, title: 'No workphase' });
    const board = await readBoard(boardId);
    expect(board.unsorted.uncovered).toEqual([]);
    expect(board.unsorted.needsAttention).toBe(true);
  });

  it('BCU-5.4: invalidItems lists an Attached item whose own workphase is missing or isn’t the workflow’s', async () => {
    const { project, workflow, workphaseIds } = await templatedWorkflow('flow');
    const [{ id: boardId }] = await boardsOf(workflow.id);
    const [foreign] = (await workflowWithPhases(['V1'])).phases;
    // D is Free in the second workphase, A is attached to D, and X to A.
    const d = await createItem({ projectId: project.id, workphaseId: workphaseIds[1], title: 'D' });
    const a = await createItem({ projectId: project.id, parentId: d.id, title: 'A' });
    const x = await createItem({ projectId: project.id, parentId: a.id, title: 'X' });
    expect((await readBoard(boardId)).unsorted.needsAttention).toBe(false);

    for (const drifted of [foreign.id, null]) {
      setItemWorkphase(x.id, drifted);
      const { unsorted } = await readBoard(boardId);
      expect(unsorted.invalidItems.map(i => i.id)).toEqual([x.id]);
      expect(unsorted.needsAttention).toBe(true);
    }
  });
});

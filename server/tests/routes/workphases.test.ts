import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  createColumn,
  createBoard,
  readBoard,
  columnOn,
  covers,
  reorderWorkphases,
  workflowWithPhases,
} from '../fixtures.js';

// A workflow with non-terminal workphases W1 to W4, in that order, and a board with
// two columns: `a`, from W1 to W3, and `b`, covering W4 alone.
async function setupAB() {
  const { project, workflow, board, phases: w } = await workflowWithPhases(['W1', 'W2', 'W3', 'W4']);
  const a = await createColumn(board.id, w[0].id, w[2].id);
  const b = await createColumn(board.id, w[3].id, w[3].id);
  return { project, workflow, board, w, a, b };
}

const ends = (column: { startWorkphaseId: string; endWorkphaseId: string }) => [
  column.startWorkphaseId,
  column.endWorkphaseId,
];

describe('POST /api/workphases', () => {
  it('returns 400 when workflowId or name is missing', async () => {
    const missingWorkflowId = await request(app).post('/api/workphases').send({ name: 'Todo' });
    expect(missingWorkflowId.status).toBe(400);

    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const missingName = await request(app).post('/api/workphases').send({ workflowId: workflow.id });
    expect(missingName.status).toBe(400);
  });

  it('returns 400 with a specific message when workflowId does not reference an existing workflow', async () => {
    const res = await request(app).post('/api/workphases').send({ workflowId: 'does-not-exist', name: 'Todo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workflowId/);
  });

  it('places the first workphase at position 1.0 and appends the next at max + 1.0', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);

    const first = await request(app).post('/api/workphases').send({ workflowId: workflow.id, name: 'Todo' });
    expect(first.body.position).toBe(1.0);

    const second = await request(app).post('/api/workphases').send({ workflowId: workflow.id, name: 'Done' });
    expect(second.body.position).toBe(2.0);
  });

  it('BCU-4.1: a new workphase goes last, and no column covers it until one is given it', async () => {
    const { workflow, board, w, a, b } = await setupAB();
    const w5 = await createWorkphase(workflow.id, { name: 'W5' });

    const workflowRead = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(workflowRead.body.workphases.map((p: { id: string }) => p.id)).toEqual([...w.map(p => p.id), w5.id]);
    const read = await readBoard(board.id);
    expect(covers(read.columns.find(c => c.id === a.id)!)).toEqual([w[0].id, w[1].id, w[2].id]);
    expect(covers(read.columns.find(c => c.id === b.id)!)).toEqual([w[3].id]);
    expect(read.unsorted.uncovered.map(r => r.workphase.id)).toEqual([w5.id]);

    const extended = await request(app).put(`/api/columns/${b.id}`).send({ endWorkphaseId: w5.id });
    expect(extended.status).toBe(200);
    const after = await readBoard(board.id);
    expect(covers(after.columns.find(c => c.id === b.id)!)).toEqual([w[3].id, w5.id]);
    expect(after.unsorted.uncovered).toEqual([]);
  });
});

describe('PUT /api/workphases/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/workphases/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('updates name and coerces truthy/falsy flags to 1/0', async () => {
    const {
      phases: [phase],
    } = await workflowWithPhases(['Todo']);

    const res = await request(app).put(`/api/workphases/${phase.id}`).send({
      name: 'In Progress',
      triggersNotification: true,
      isTerminal: false,
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('In Progress');
    expect(res.body.triggersNotification).toBe(1);
    expect(res.body.isTerminal).toBe(0);
  });

  it('preserves existing fields when they are omitted from the body', async () => {
    const {
      phases: [phase],
    } = await workflowWithPhases([{ name: 'Todo', triggersNotification: true }]);

    const res = await request(app).put(`/api/workphases/${phase.id}`).send({});
    expect(res.body.name).toBe('Todo');
    expect(res.body.triggersNotification).toBe(1);
  });

  // Flipping isTerminal re-validates the covering columns and backfills the
  // items.
  describe('isTerminal flip', () => {
    it('BCU-3.4: a terminal-flag change that would leave a column covering both terminal and non-terminal workphases is refused', async () => {
      const { project, workflow, board } = await workflowWithPhases([]);
      // A second board with no columns, before the workphases exist.
      const otherBoard = await createBoard(workflow.id, { name: 'Other' });
      const [w1, w2, w3] = [
        await createWorkphase(workflow.id, { name: 'W1' }),
        await createWorkphase(workflow.id, { name: 'W2' }),
        await createWorkphase(workflow.id, { name: 'W3' }),
      ];
      const early = await createColumn(board.id, w1.id, w2.id, { name: 'Early' });
      const xs = [
        await createItem({ projectId: project.id, workphaseId: w2.id, title: 'X1' }),
        await createItem({ projectId: project.id, workphaseId: w2.id, title: 'X2' }),
      ];
      const itemRead = async (id: string) => (await request(app).get(`/api/items/${id}`)).body;
      const itemsBefore = await Promise.all(xs.map(x => itemRead(x.id)));
      const makeW2Terminal = () => request(app).put(`/api/workphases/${w2.id}`).send({ isTerminal: true });
      const w2IsTerminal = async () => {
        const read = await request(app).get(`/api/workflows/${workflow.id}`);
        return read.body.workphases.find((p: { id: string }) => p.id === w2.id).isTerminal;
      };

      const refused = await makeW2Terminal();
      expect(refused.status).toBe(400);
      expect(refused.body.conflictingColumnId).toBe(early.id);
      expect(refused.body.error).toContain('"Early"');
      // Nothing changed: W2 is still non-terminal, and its items are as they were.
      expect(await w2IsTerminal()).toBe(0);
      expect(await Promise.all(xs.map(x => itemRead(x.id)))).toEqual(itemsBefore);
      expect(itemsBefore.map(i => i.completedAt)).toEqual([null, null]);

      // With a column on another board covering W2 too, one of the two is named.
      const early2 = await createColumn(otherBoard.id, w2.id, w3.id);
      const again = await makeW2Terminal();
      expect(again.status).toBe(400);
      expect([early.id, early2.id]).toContain(again.body.conflictingColumnId);

      // Covered by no column, W2 can change.
      for (const id of [early.id, early2.id]) await request(app).delete(`/api/columns/${id}`);
      expect((await makeW2Terminal()).status).toBe(200);
      expect(await w2IsTerminal()).toBe(1);
      expect((await request(app).put(`/api/workphases/${w2.id}`).send({ isTerminal: false })).status).toBe(200);

      // So can a workphase a column covers alone.
      await createColumn(board.id, w2.id, w2.id);
      expect((await makeW2Terminal()).status).toBe(200);
      expect(await w2IsTerminal()).toBe(1);
    });

    it('backfills items on a non-terminal -> terminal flip, preserving their position order as completedAt order, and clears position', async () => {
      const {
        project,
        phases: [review],
      } = await workflowWithPhases(['Review']);
      const a = await createItem({ projectId: project.id, workphaseId: review.id, title: 'A' });
      const b = await createItem({ projectId: project.id, workphaseId: review.id, title: 'B' });
      const c = await createItem({ projectId: project.id, workphaseId: review.id, title: 'C' });
      expect(a.position).toBeLessThan(b.position);
      expect(b.position).toBeLessThan(c.position);

      const res = await request(app).put(`/api/workphases/${review.id}`).send({ isTerminal: true });
      expect(res.status).toBe(200);

      const [ra, rb, rc] = await Promise.all(
        [a, b, c].map(i =>
          request(app)
            .get(`/api/items/${i.id}`)
            .then(r => r.body),
        ),
      );
      expect(ra.position).toBeNull();
      expect(rb.position).toBeNull();
      expect(rc.position).toBeNull();
      expect(ra.completedAt).not.toBeNull();
      expect(ra.completedAt).toBeLessThan(rb.completedAt);
      expect(rb.completedAt).toBeLessThan(rc.completedAt);
    });

    it('backfills items on a terminal -> non-terminal flip, preserving their completedAt order as position order, and clears completedAt', async () => {
      const {
        project,
        phases: [review],
      } = await workflowWithPhases(['Review']);
      const a = await createItem({ projectId: project.id, workphaseId: review.id, title: 'A' });
      const b = await createItem({ projectId: project.id, workphaseId: review.id, title: 'B' });
      const c = await createItem({ projectId: project.id, workphaseId: review.id, title: 'C' });
      // Round-trip through the 0->1 flip (covered above) to get real,
      // distinct completedAt values in a known order without depending on
      // wall-clock resolution between separate API calls.
      await request(app).put(`/api/workphases/${review.id}`).send({ isTerminal: true });

      const res = await request(app).put(`/api/workphases/${review.id}`).send({ isTerminal: false });
      expect(res.status).toBe(200);

      const [ra, rb, rc] = await Promise.all(
        [a, b, c].map(i =>
          request(app)
            .get(`/api/items/${i.id}`)
            .then(r => r.body),
        ),
      );
      expect(ra.completedAt).toBeNull();
      expect(rb.completedAt).toBeNull();
      expect(rc.completedAt).toBeNull();
      expect(typeof ra.position).toBe('number');
      expect(ra.position).toBeLessThan(rb.position);
      expect(rb.position).toBeLessThan(rc.position);
    });

    it("does not touch an attached child's position/completedAt when its parent's workphase flips terminal", async () => {
      const {
        project,
        phases: [review],
      } = await workflowWithPhases(['Review']);
      const parent = await createItem({ projectId: project.id, workphaseId: review.id, title: 'Parent' });
      const childRes = await request(app).post('/api/items').send({
        title: 'Child',
        parentId: parent.id,
        projectId: project.id,
      });
      const child = childRes.body;
      expect(child.position).not.toBeNull();

      await request(app).put(`/api/workphases/${review.id}`).send({ isTerminal: true });

      const reloaded = await request(app)
        .get(`/api/items/${child.id}`)
        .then(r => r.body);
      expect(reloaded.position).toBe(child.position);
      expect(reloaded.completedAt).toBeNull();
    });
  });
});

describe('PATCH /api/workphases/reorder', () => {
  it('returns 400 when workphaseOrders is not an array', async () => {
    const res = await request(app).patch('/api/workphases/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('reorders multiple workphases', async () => {
    const {
      phases: [a, b],
    } = await workflowWithPhases(['A', 'B']);

    const res = await request(app)
      .patch('/api/workphases/reorder')
      .send({
        workphaseOrders: [
          { id: a.id, position: 5 },
          { id: b.id, position: 1 },
        ],
      });
    expect(res.status).toBe(200);
  });

  it('rejects an entry without a string id and finite numeric position', async () => {
    const {
      phases: [a],
    } = await workflowWithPhases(['A']);

    const res = await request(app)
      .patch('/api/workphases/reorder')
      .send({
        workphaseOrders: [{ id: a.id, position: 'first' }],
      });
    expect(res.status).toBe(400);
  });

  it('returns 404 with missingIds when any workphase does not exist', async () => {
    const {
      phases: [a],
    } = await workflowWithPhases(['A']);

    const res = await request(app)
      .patch('/api/workphases/reorder')
      .send({
        workphaseOrders: [
          { id: a.id, position: 1 },
          { id: 'ghost', position: 2 },
        ],
      });
    expect(res.status).toBe(404);
    expect(res.body.missingIds).toEqual(['ghost']);
  });

  it('BCU-4.5: after a workphase reorder, what each column covers follows the new order', async () => {
    // W2 moves out of A's range: A still runs from W1 to W3, and now covers W1 and W3.
    const first = await setupAB();
    expect((await reorderWorkphases([first.w[1], first.w[0], first.w[2], first.w[3]])).status).toBe(200);
    const moved = await readBoard(first.board.id);
    const a = moved.columns.find(c => c.id === first.a.id)!;
    expect(ends(a)).toEqual([first.w[0].id, first.w[2].id]);
    expect(covers(a)).toEqual([first.w[0].id, first.w[2].id]);
    expect(moved.unsorted.uncovered.map(r => r.workphase.id)).toEqual([first.w[1].id]);

    // A runs from W1 to W2, so W3 is uncovered; reordered, W3 sits between them.
    const second = await setupAB();
    const edited = await request(app).put(`/api/columns/${second.a.id}`).send({ endWorkphaseId: second.w[1].id });
    expect(edited.status).toBe(200);
    expect((await readBoard(second.board.id)).unsorted.uncovered.map(r => r.workphase.id)).toEqual([second.w[2].id]);
    expect((await reorderWorkphases([second.w[0], second.w[2], second.w[1], second.w[3]])).status).toBe(200);
    const joined = await readBoard(second.board.id);
    expect(covers(joined.columns.find(c => c.id === second.a.id)!)).toEqual([
      second.w[0].id,
      second.w[2].id,
      second.w[1].id,
    ]);
    expect(joined.unsorted.uncovered).toEqual([]);
  });

  it('BCU-4.6: a reorder that puts a column’s start after its end leaves it broken, worked out on every read', async () => {
    const { board, w, a, b } = await setupAB();

    expect((await reorderWorkphases([w[2], w[1], w[0], w[3]])).status).toBe(200);
    expect((await columnOn(board.id, a.id)).broken).toBe(true);
    expect((await columnOn(board.id, b.id)).broken).toBe(false);

    // Reordered back, with no column written, it isn't broken.
    expect((await reorderWorkphases(w)).status).toBe(200);
    const restored = await columnOn(board.id, a.id);
    expect(restored.broken).toBe(false);
    expect(ends(restored)).toEqual([w[0].id, w[2].id]);
  });

  it('BCU-4.7: a workphase reorder isn’t checked against a board’s columns', async () => {
    const { board, phases } = await workflowWithPhases(['W1', 'W2', 'W3', 'W4', { name: 'D1', isTerminal: true }]);
    const w = phases.slice(0, 4);
    const d1 = phases[4];
    const a = await createColumn(board.id, w[0].id, w[1].id);
    const c = await createColumn(board.id, w[2].id, w[3].id);

    // Both columns now cover W3 and W2.
    expect((await reorderWorkphases([w[0], w[2], w[1], w[3], d1])).status).toBe(200);
    const overlapping = await readBoard(board.id);
    expect(covers(overlapping.columns.find(col => col.id === a.id)!)).toEqual([w[0].id, w[2].id, w[1].id]);
    expect(covers(overlapping.columns.find(col => col.id === c.id)!)).toEqual([w[2].id, w[1].id, w[3].id]);

    // A now covers a terminal workphase and non-terminal ones.
    expect((await reorderWorkphases([w[0], d1, w[1], w[2], w[3]])).status).toBe(200);
    const mixed = await readBoard(board.id);
    expect(covers(mixed.columns.find(col => col.id === a.id)!)).toEqual([w[0].id, d1.id, w[1].id]);
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

  it('BCU-4.4: a deleted workphase’s items lose it, and show in Unsorted', async () => {
    const { project, board, w } = await setupAB();
    const items = [
      await createItem({ projectId: project.id, workphaseId: w[3].id, title: 'X1' }),
      await createItem({ projectId: project.id, workphaseId: w[3].id, title: 'X2' }),
    ];

    expect((await request(app).delete(`/api/workphases/${w[3].id}`)).status).toBe(200);

    // Not blocked or deleted — the FK nulls each item's workphaseId.
    for (const item of items) {
      const read = await request(app).get(`/api/items/${item.id}`);
      expect(read.status).toBe(200);
      expect(read.body.workphaseId).toBeNull();
    }
    const { unsorted } = await readBoard(board.id);
    expect(unsorted.invalidItems.map(i => i.id).sort()).toEqual(items.map(i => i.id).sort());
  });

  it('BCU-4.3: a workphase delete that leaves every column’s ends in place changes no column', async () => {
    const {
      board,
      phases: [todo, inProgress, done],
    } = await workflowWithPhases(['Todo', 'In Progress', 'Done']);
    const col = await createColumn(board.id, todo.id, done.id);

    const res = await request(app).delete(`/api/workphases/${inProgress.id}`);
    expect(res.status).toBe(204);

    const resolved = await columnOn(board.id, col.id);
    expect(resolved.startWorkphaseId).toBe(todo.id);
    expect(resolved.endWorkphaseId).toBe(done.id);
    expect(covers(resolved)).toEqual([todo.id, done.id]);
  });

  it('BCU-4.2: a workphase delete shrinks each column covering it, and deletes a column it was the only workphase of', async () => {
    const ids = (columns: { id: string }[]) => columns.map(c => c.id);

    // W1 is A's start: A runs from W2 to W3.
    const start = await setupAB();
    const deletedStart = await request(app).delete(`/api/workphases/${start.w[0].id}`);
    expect(deletedStart.status).toBe(200);
    expect(ids(deletedStart.body.shrunkColumns)).toEqual([start.a.id]);
    expect(deletedStart.body.deletedColumns).toEqual([]);
    expect(ends(await columnOn(start.board.id, start.a.id))).toEqual([start.w[1].id, start.w[2].id]);

    // W3 is A's end: A runs from W1 to W2.
    const end = await setupAB();
    const deletedEnd = await request(app).delete(`/api/workphases/${end.w[2].id}`);
    expect(deletedEnd.status).toBe(200);
    expect(ids(deletedEnd.body.shrunkColumns)).toEqual([end.a.id]);
    expect(deletedEnd.body.deletedColumns).toEqual([]);
    expect(ends(await columnOn(end.board.id, end.a.id))).toEqual([end.w[0].id, end.w[1].id]);

    // W4 is B's only workphase: B is deleted.
    const only = await setupAB();
    const deletedOnly = await request(app).delete(`/api/workphases/${only.w[3].id}`);
    expect(deletedOnly.status).toBe(200);
    expect(ids(deletedOnly.body.deletedColumns)).toEqual([only.b.id]);
    expect(ids((await readBoard(only.board.id)).columns)).toEqual([only.a.id]);
  });
});

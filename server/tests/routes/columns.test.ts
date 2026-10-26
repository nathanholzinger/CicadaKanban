import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  createWorkphase,
  createBoard,
  createColumn,
  createItem,
  readBoard,
  columnOn,
  covers,
  reorderWorkphases,
  setColumnEnds,
  workflowWithPhases,
} from '../fixtures.js';

// The workflow's default board, which starts with no columns, and the workphases Todo,
// In Progress and Done, to build custom ranges on (workphases added afterward land in
// Unsorted, not auto-added).
async function setupCleanBoard() {
  const {
    project,
    workflow,
    board,
    phases: [todo, inProgress, done],
  } = await workflowWithPhases(['Todo', 'In Progress', 'Done']);
  return { project, workflow, board, todo, inProgress, done };
}

// A workflow with non-terminal workphases Todo, Doing, Review and Ship (`w[0]` to
// `w[3]`), in that order, and two boards, `board` and `otherBoard`, that start
// with no columns.
async function setupFour() {
  const { project, workflow, board } = await workflowWithPhases([]);
  // Made before the workphases, so it starts with no columns too.
  const otherBoard = await createBoard(workflow.id, { name: 'Other' });
  const w: { id: string; name: string }[] = [];
  for (const name of ['Todo', 'Doing', 'Review', 'Ship']) w.push(await createWorkphase(workflow.id, { name }));
  return { project, workflow, board, otherBoard, w };
}

const postColumn = (boardId: string, startWorkphaseId: string, endWorkphaseId: string, extra = {}) =>
  request(app)
    .post('/api/columns')
    .send({ boardId, startWorkphaseId, endWorkphaseId, ...extra });
const putColumn = (columnId: string, body: Record<string, unknown>) =>
  request(app).put(`/api/columns/${columnId}`).send(body);

describe('POST /api/columns', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/columns').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent board', async () => {
    const { todo, done } = await setupCleanBoard();
    const res = await request(app).post('/api/columns').send({
      boardId: 'does-not-exist',
      startWorkphaseId: todo.id,
      endWorkphaseId: done.id,
    });
    expect(res.status).toBe(404);
  });

  it('BCU-2.1: a column covers the workphases from its start to its end, in the workflow’s order', async () => {
    const { board, w } = await setupFour();
    const a = await createColumn(board.id, w[0].id, w[2].id);

    const read = await readBoard(board.id);
    const resolved = read.columns.find(c => c.id === a.id)!;
    expect(resolved).toMatchObject({ startWorkphaseId: w[0].id, endWorkphaseId: w[2].id });
    expect(covers(resolved)).toEqual([w[0].id, w[1].id, w[2].id]);
    expect(read.unsorted.uncovered.map(r => r.workphase.id)).toEqual([w[3].id]);

    const last = await createColumn(board.id, w[3].id, w[3].id);
    expect(covers(await columnOn(board.id, last.id))).toEqual([w[3].id]);
  });

  it('BCU-2.2: a column with no name of its own is named for what it covers, and the name follows its workphases', async () => {
    const { board, otherBoard, w } = await setupFour();
    const nameOf = async (columnId: string) => (await columnOn(board.id, columnId)).displayName;
    // The spacing around the dash isn't part of the rule.
    const joined = (first: string, last: string) => new RegExp(`^${first}\\s*[-–—]\\s*${last}$`);
    const rename = (id: string, name: string) => request(app).put(`/api/workphases/${id}`).send({ name });

    const a = await createColumn(board.id, w[0].id, w[0].id);
    const c = await createColumn(board.id, w[1].id, w[2].id);
    expect(await nameOf(a.id)).toBe('Todo');
    expect(await nameOf(c.id)).toMatch(joined('Doing', 'Review'));

    // No column is written by a rename.
    expect((await rename(w[0].id, 'Backlog')).status).toBe(200);
    expect(await nameOf(a.id)).toBe('Backlog');
    expect((await rename(w[2].id, 'QA')).status).toBe(200);
    expect(await nameOf(c.id)).toMatch(joined('Doing', 'QA'));

    expect((await putColumn(c.id, { endWorkphaseId: w[3].id })).status).toBe(200);
    expect(await nameOf(c.id)).toMatch(joined('Doing', 'Ship'));

    // A name of its own is kept.
    const mine = await createColumn(otherBoard.id, w[3].id, w[3].id, { name: 'Mine' });
    expect((await rename(w[3].id, 'Launch')).status).toBe(200);
    expect((await columnOn(otherBoard.id, mine.id)).displayName).toBe('Mine');
  });

  it('BCU-2.3: a column’s display mode is merged unless its create asks for expanded', async () => {
    const { board, w } = await setupFour();

    const merged = await postColumn(board.id, w[0].id, w[0].id);
    expect(merged.status).toBe(201);
    expect(merged.body.displayMode).toBe('merged');

    const expanded = await postColumn(board.id, w[1].id, w[1].id, { displayMode: 'expanded' });
    expect(expanded.status).toBe(201);
    expect(expanded.body.displayMode).toBe('expanded');
  });

  it('appends a new column after the board’s last', async () => {
    const { board, w } = await setupFour();
    const first = await postColumn(board.id, w[0].id, w[0].id);
    const second = await postColumn(board.id, w[1].id, w[1].id);
    expect([first.body.position, second.body.position]).toEqual([1.0, 2.0]);
  });

  it('BCU-2.5: a column’s start and end must be workphases of its board’s workflow', async () => {
    const { board, w } = await setupFour();
    const [v1] = (await workflowWithPhases(['V1'])).phases;

    // Each is refused with a 400, and the board is left with no columns.
    for (const [label, start, end] of [
      ['an end of another workflow', w[0].id, v1.id],
      ['a start of another workflow', v1.id, w[1].id],
      ['a start that is no workphase at all', 'no-such-workphase', w[1].id],
    ] as const) {
      const res = await postColumn(board.id, start, end);
      expect(res.status, label).toBe(400);
      expect(res.body.error, label).toMatch(/belong to this board's workflow/);
      expect((await readBoard(board.id)).columns, label).toEqual([]);
    }

    const a = await createColumn(board.id, w[0].id, w[1].id);
    const edited = await putColumn(a.id, { endWorkphaseId: v1.id });
    expect(edited.status).toBe(400);
    expect(edited.body.error).toMatch(/belong to this board's workflow/);
    const after = await columnOn(board.id, a.id);
    expect([after.startWorkphaseId, after.endWorkphaseId]).toEqual([w[0].id, w[1].id]);
  });

  it('BCU-2.10: a start or end given as an empty string names no workphase: a create and an edit refuse it, and nothing changes', async () => {
    const { board, w } = await setupFour();

    for (const [label, start, end] of [
      ['a start', '', w[1].id],
      ['an end', w[0].id, ''],
    ] as const) {
      const res = await postColumn(board.id, start, end);
      expect(res.status, label).toBe(400);
      expect(res.body.error, label).toMatch(/startWorkphaseId and endWorkphaseId are required/);
      expect((await readBoard(board.id)).columns, label).toEqual([]);
    }

    const a = await createColumn(board.id, w[0].id, w[1].id);
    for (const [label, body] of [
      ['a start', { startWorkphaseId: '' }],
      ['an end', { endWorkphaseId: '' }],
    ] as const) {
      const res = await putColumn(a.id, body);
      expect(res.status, label).toBe(400);
      expect(res.body.error, label).toMatch(/belong to this board's workflow/);
      const after = await columnOn(board.id, a.id);
      expect([after.startWorkphaseId, after.endWorkphaseId], label).toEqual([w[0].id, w[1].id]);
    }
  });

  it('BCU-2.6: a column’s start can’t come after its end', async () => {
    const { board, w } = await setupFour();

    const inverted = await postColumn(board.id, w[2].id, w[0].id);
    expect(inverted.status).toBe(400);
    expect(inverted.body.error).toMatch(/must not come after/);
    expect((await readBoard(board.id)).columns).toEqual([]);

    const a = await createColumn(board.id, w[0].id, w[1].id);
    const edited = await putColumn(a.id, { startWorkphaseId: w[1].id, endWorkphaseId: w[0].id });
    expect(edited.status).toBe(400);
    expect(edited.body.error).toMatch(/must not come after/);
    const after = await columnOn(board.id, a.id);
    expect([after.startWorkphaseId, after.endWorkphaseId]).toEqual([w[0].id, w[1].id]);

    // A start that is its end doesn't come after it.
    expect((await postColumn(board.id, w[2].id, w[2].id)).status).toBe(201);
  });

  it('BCU-3.1: a column write can’t make two columns on a board cover the same workphase', async () => {
    const { board, otherBoard, w } = await setupFour();
    const early = await createColumn(board.id, w[0].id, w[1].id, { name: 'Early' });
    const columnIds = async () => (await readBoard(board.id)).columns.map(c => c.id);

    const created = await postColumn(board.id, w[1].id, w[2].id);
    expect(created.status).toBe(400);
    expect(created.body.conflictingColumnId).toBe(early.id);
    expect(created.body.error).toContain('"Early"');
    expect(await columnIds()).toEqual([early.id]);

    const c = await createColumn(board.id, w[2].id, w[2].id);
    const edited = await putColumn(c.id, { startWorkphaseId: w[1].id });
    expect(edited.status).toBe(400);
    expect(edited.body.conflictingColumnId).toBe(early.id);
    expect(edited.body.error).toContain('"Early"');
    expect(covers(await columnOn(board.id, c.id))).toEqual([w[2].id]);

    // Without a name of its own, the message quotes the column's id.
    expect((await putColumn(early.id, { name: null })).status).toBe(200);
    const unnamed = await postColumn(board.id, w[1].id, w[1].id);
    expect(unnamed.status).toBe(400);
    expect(unnamed.body.conflictingColumnId).toBe(early.id);
    expect(unnamed.body.error).toContain(`"${early.id}"`);

    // The rule holds within one board.
    expect((await postColumn(otherBoard.id, w[0].id, w[1].id)).status).toBe(201);
  });

  it('allows adjacent, non-overlapping ranges', async () => {
    const { board, todo, inProgress, done } = await setupCleanBoard();

    await createColumn(board.id, todo.id, todo.id);
    const res = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: inProgress.id,
      endWorkphaseId: done.id,
      displayMode: 'expanded',
    });
    expect(res.status).toBe(201);
    expect(res.body.displayMode).toBe('expanded');
  });
});

describe('PUT /api/columns/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/columns/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it("updates a column's range and rejects overlap with a sibling", async () => {
    const { board, todo, inProgress, done } = await setupCleanBoard();
    const colA = await createColumn(board.id, todo.id, todo.id);
    const colB = await createColumn(board.id, inProgress.id, done.id);

    // Widening colA to cover 'inProgress' now overlaps colB
    const conflict = await request(app).put(`/api/columns/${colA.id}`).send({ endWorkphaseId: inProgress.id });
    expect(conflict.status).toBe(400);

    // Renaming without touching the range succeeds
    const renamed = await request(app).put(`/api/columns/${colB.id}`).send({ name: 'Later Stages' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe('Later Stages');
  });

  it('updates displayMode only when explicitly set, and sets/clears the name override', async () => {
    const { board, todo } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id); // defaults to merged

    const expanded = await request(app).put(`/api/columns/${col.id}`).send({ displayMode: 'expanded' });
    expect(expanded.body.displayMode).toBe('expanded');

    // A name-only update must not silently flip displayMode back to merged.
    const named = await request(app).put(`/api/columns/${col.id}`).send({ name: 'Focus' });
    expect(named.body.displayMode).toBe('expanded');
    expect(named.body.name).toBe('Focus');

    const cleared = await request(app).put(`/api/columns/${col.id}`).send({ name: null });
    expect(cleared.body.name).toBeNull();

    const merged = await request(app).put(`/api/columns/${col.id}`).send({ displayMode: 'merged' });
    expect(merged.body.displayMode).toBe('merged');
  });
});

describe('PATCH /api/columns/reorder', () => {
  it('returns 400 when columnOrders is not an array', async () => {
    const res = await request(app).patch('/api/columns/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an entry without a string id and finite numeric position', async () => {
    const { board, todo } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id);

    const res = await request(app)
      .patch('/api/columns/reorder')
      .send({
        columnOrders: [{ id: col.id, position: 'first' }],
      });
    expect(res.status).toBe(400);
  });

  it('returns 404 with missingIds when any column does not exist', async () => {
    const { board, todo } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id);

    const res = await request(app)
      .patch('/api/columns/reorder')
      .send({
        columnOrders: [
          { id: col.id, position: 1 },
          { id: 'ghost', position: 2 },
        ],
      });
    expect(res.status).toBe(404);
    expect(res.body.missingIds).toEqual(['ghost']);
  });

  it('BCU-3.5: a board’s column order is its own, and changes no column’s coverage', async () => {
    const { workflow, board, otherBoard, w } = await setupFour();
    const [a, c, e] = [
      await createColumn(board.id, w[0].id, w[0].id),
      await createColumn(board.id, w[1].id, w[1].id),
      await createColumn(board.id, w[2].id, w[2].id),
    ];
    const otherColumns = [
      await createColumn(otherBoard.id, w[0].id, w[0].id),
      await createColumn(otherBoard.id, w[1].id, w[1].id),
      await createColumn(otherBoard.id, w[2].id, w[2].id),
    ];

    const res = await request(app)
      .patch('/api/columns/reorder')
      .send({
        columnOrders: [
          { id: e.id, position: 1 },
          { id: a.id, position: 2 },
          { id: c.id, position: 3 },
        ],
      });
    expect(res.status).toBe(200);

    // The board shows W3 before W1 and W2, each column still covering its own workphase.
    const reordered = await readBoard(board.id);
    expect(reordered.columns.map(col => col.id)).toEqual([e.id, a.id, c.id]);
    expect(reordered.columns.map(covers)).toEqual([[w[2].id], [w[0].id], [w[1].id]]);
    // Nothing else moved: the other board's order, and the workflow's.
    expect((await readBoard(otherBoard.id)).columns.map(col => col.id)).toEqual(otherColumns.map(col => col.id));
    const workflowRead = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(workflowRead.body.workphases.map((p: { id: string }) => p.id)).toEqual(w.map(p => p.id));
  });
});

describe('DELETE /api/columns/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/columns/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('BCU-2.4: a column can always be deleted, and the workphases it covered go to uncovered', async () => {
    const { project, board, w } = await setupFour();
    const a = await createColumn(board.id, w[0].id, w[1].id);
    const c = await createColumn(board.id, w[2].id, w[3].id);
    // An item in a covered workphase doesn't stop the delete.
    await createItem({ projectId: project.id, workphaseId: w[0].id });
    const uncovered = async () => (await readBoard(board.id)).unsorted.uncovered.map(r => r.workphase.id);

    expect((await request(app).delete(`/api/columns/${a.id}`)).status).toBe(204);
    expect(await uncovered()).toEqual([w[0].id, w[1].id]);

    expect((await request(app).delete(`/api/columns/${c.id}`)).status).toBe(204);
    expect((await readBoard(board.id)).columns).toEqual([]);
    expect(await uncovered()).toEqual(w.map(p => p.id));
  });
});

describe('a broken column', () => {
  // `A` runs from W1 to W3; reordering the workphases to W3, W2, W1, W4 puts its
  // start after its end.
  async function brokenColumn() {
    const setup = await setupFour();
    const { board, w } = setup;
    const a = await createColumn(board.id, w[0].id, w[2].id);
    expect((await reorderWorkphases([w[2], w[1], w[0], w[3]])).status).toBe(200);
    expect((await columnOn(board.id, a.id)).broken).toBe(true);
    return { ...setup, a };
  }

  it('BCU-2.7: an edit whose range passes fixes a broken column', async () => {
    const { board, w, a } = await brokenColumn();

    // The range it already has is refused: its start comes after its end.
    const same = await putColumn(a.id, { startWorkphaseId: w[0].id, endWorkphaseId: w[2].id });
    expect(same.status).toBe(400);
    expect((await columnOn(board.id, a.id)).broken).toBe(true);

    // In order now, from W3 to W1.
    const fixed = await putColumn(a.id, { startWorkphaseId: w[2].id, endWorkphaseId: w[0].id });
    expect(fixed.status).toBe(200);
    expect((await columnOn(board.id, a.id)).broken).toBe(false);
  });

  it('BCU-2.8: a column whose start comes after its end still covers the workphases between its two ends', async () => {
    const { project, board, w } = await setupFour();
    const a = await createColumn(board.id, w[0].id, w[2].id);
    await createColumn(board.id, w[3].id, w[3].id);
    const items: { id: string }[] = [];
    for (const phase of w.slice(0, 3)) {
      items.push(await createItem({ projectId: project.id, workphaseId: phase.id, title: `In ${phase.name}` }));
    }

    expect((await reorderWorkphases([w[2], w[1], w[0], w[3]])).status).toBe(200);

    const read = await readBoard(board.id);
    const resolved = read.columns.find(c => c.id === a.id)!;
    expect(resolved.broken).toBe(true);
    expect(covers(resolved)).toEqual([w[2].id, w[1].id, w[0].id]);
    expect(resolved.subRows.map(r => r.items.map(i => i.id))).toEqual([[items[2].id], [items[1].id], [items[0].id]]);
    expect(read.unsorted.uncovered).toEqual([]);
  });
});

describe('BCU-2.9: a column with an end outside the workflow is broken, and covers no workphase', () => {
  // `A` runs from W1 to W3 with no name of its own, `C` covers W4 alone, and each of W1, W2 and W3
  // holds an item. V1 is a workphase of another workflow.
  async function setupOutside() {
    const setup = await setupFour();
    const { project, board, w } = setup;
    const a = await createColumn(board.id, w[0].id, w[2].id);
    const c = await createColumn(board.id, w[3].id, w[3].id);
    const items: { id: string }[] = [];
    for (const phase of w.slice(0, 3)) {
      items.push(await createItem({ projectId: project.id, workphaseId: phase.id, title: `In ${phase.name}` }));
    }
    const [v1] = (await workflowWithPhases(['V1'])).phases;
    return { ...setup, a, c, items, v1 };
  }

  it('is flagged broken, covers and shows nothing, is named for that, and leaves its workphases in uncovered', async () => {
    const { board, w, a, c, items, v1 } = await setupOutside();

    for (const [label, edit] of [
      ['its end is V1', { endWorkphaseId: v1.id }],
      ['its start is V1', { startWorkphaseId: v1.id }],
      ['its end is an id that names no workphase', { endWorkphaseId: 'no-such-workphase' }],
    ] as const) {
      setColumnEnds(a.id, { startWorkphaseId: w[0].id, endWorkphaseId: w[2].id, ...edit });

      const read = await readBoard(board.id);
      const outside = read.columns.find(column => column.id === a.id)!;
      expect(outside.broken, label).toBe(true);
      expect(outside.subRows, label).toEqual([]);
      expect(outside.displayName, label).toBe('(empty range)');
      const uncoveredIds = read.unsorted.uncovered.map(row => row.workphase.id);
      const uncoveredItemIds = read.unsorted.uncovered.flatMap(row => row.items.map(i => i.id));
      expect(uncoveredIds, label).toEqual(w.slice(0, 3).map(p => p.id));
      expect(uncoveredItemIds, label).toEqual(items.map(i => i.id));
      expect(read.columns.find(column => column.id === c.id)!.broken, label).toBe(false);
    }
  });

  it('is fixed by an edit to a range inside the workflow', async () => {
    const { board, w, a, items, v1 } = await setupOutside();
    setColumnEnds(a.id, { endWorkphaseId: v1.id });
    expect((await columnOn(board.id, a.id)).broken).toBe(true);

    const fixed = await putColumn(a.id, { startWorkphaseId: w[0].id, endWorkphaseId: w[2].id });
    expect(fixed.status).toBe(200);

    const read = await readBoard(board.id);
    const column = read.columns.find(c => c.id === a.id)!;
    expect(column.broken).toBe(false);
    expect(covers(column)).toEqual(w.slice(0, 3).map(p => p.id));
    expect(column.subRows.map(row => row.items.map(i => i.id))).toEqual(items.map(i => [i.id]));
    expect(read.unsorted.uncovered).toEqual([]);
  });
});

describe('terminal/non-terminal column ranges', () => {
  // A workflow with non-terminal W1, W2 and W3 and terminal D1 and D2, in that order,
  // and its default board, which starts with no column.
  async function setupWithTerminal() {
    const { board, phases } = await workflowWithPhases([
      'W1',
      'W2',
      'W3',
      { name: 'D1', isTerminal: true },
      { name: 'D2', isTerminal: true },
    ]);
    return { board, w: phases.slice(0, 3), d: phases.slice(3) };
  }

  async function boardColumns(boardId: string) {
    return (await readBoard(boardId)).columns.map(c => ({
      id: c.id,
      start: c.startWorkphaseId,
      end: c.endWorkphaseId,
    }));
  }

  it('BCU-3.2: a column write can’t make a column cover both terminal and non-terminal workphases', async () => {
    const { board, w, d } = await setupWithTerminal();

    const created = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: w[2].id,
      endWorkphaseId: d[0].id,
    });
    expect(created.status).toBe(400);
    expect(created.body.error).toMatch(/terminal/i);
    expect(await boardColumns(board.id)).toEqual([]);

    const a = await createColumn(board.id, w[1].id, w[2].id);
    const edited = await request(app).put(`/api/columns/${a.id}`).send({ endWorkphaseId: d[0].id });
    expect(edited.status).toBe(400);
    expect(edited.body.error).toMatch(/terminal/i);
    expect(await boardColumns(board.id)).toEqual([{ id: a.id, start: w[1].id, end: w[2].id }]);
  });

  it('BCU-3.3: a column whose range is all terminal, or all non-terminal, is accepted', async () => {
    const { board, w, d } = await setupWithTerminal();

    const done = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: d[0].id,
      endWorkphaseId: d[1].id,
    });
    expect(done.status).toBe(201);
    expect(covers(await columnOn(board.id, done.body.id))).toEqual([d[0].id, d[1].id]);

    const active = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: w[0].id,
      endWorkphaseId: w[2].id,
    });
    expect(active.status).toBe(201);
    expect(covers(await columnOn(board.id, active.body.id))).toEqual([w[0].id, w[1].id, w[2].id]);
  });
});

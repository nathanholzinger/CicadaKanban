import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createBoard,
  createColumn,
  createItem,
  readBoard,
  columnOn,
  covers,
  reorderWorkphases,
} from '../fixtures.js';
import {
  computeColumnRange,
  isColumnBroken,
  getCoveredWorkphases,
  columnsOverlap,
  computeUnsorted,
} from '../../src/lib/columnRanges.js';
import { buildRankMap } from '../../src/lib/workphaseOrder.js';

// ── Pure helpers (no DB) ─────────────────────────────────────────────────────

function phase(id: string, position: number) {
  return {
    id,
    position,
    name: id,
    workflowId: 'w',
    agentId: null,
    triggersNotification: 0,
    isTerminal: 0,
    createdAt: 0,
  };
}

describe('pure range helpers', () => {
  const phases = [phase('a', 1), phase('b', 2), phase('c', 3), phase('d', 4)];
  const rankMap = buildRankMap(phases);

  it('buildRankMap assigns ordinal ranks in position order', () => {
    expect(rankMap.get('a')).toBe(0);
    expect(rankMap.get('d')).toBe(3);
  });

  it('computeColumnRange resolves a normal (non-inverted) range', () => {
    expect(computeColumnRange({ startWorkphaseId: 'b', endWorkphaseId: 'c' }, rankMap)).toEqual([1, 2]);
  });

  it('computeColumnRange uses min/max so an inverted range still resolves', () => {
    expect(computeColumnRange({ startWorkphaseId: 'c', endWorkphaseId: 'b' }, rankMap)).toEqual([1, 2]);
  });

  it('isColumnBroken is false for a normal range and true for an inverted one', () => {
    expect(isColumnBroken({ startWorkphaseId: 'b', endWorkphaseId: 'c' }, rankMap)).toBe(false);
    expect(isColumnBroken({ startWorkphaseId: 'c', endWorkphaseId: 'b' }, rankMap)).toBe(true);
  });

  it('getCoveredWorkphases returns the inclusive slice between start and end', () => {
    const covered = getCoveredWorkphases({ startWorkphaseId: 'b', endWorkphaseId: 'd' }, phases, rankMap);
    expect(covered.map(w => w.id)).toEqual(['b', 'c', 'd']);
  });

  it('columnsOverlap detects overlapping and non-overlapping ranges', () => {
    const rangeA = { startWorkphaseId: 'a', endWorkphaseId: 'b' };
    const rangeB = { startWorkphaseId: 'b', endWorkphaseId: 'c' };
    const rangeC = { startWorkphaseId: 'c', endWorkphaseId: 'd' };
    expect(columnsOverlap(rangeA, rangeB, rankMap)).toBe(true);
    expect(columnsOverlap(rangeA, rangeC, rankMap)).toBe(false);
  });

  it('treats unknown workphase ids as unresolvable: null range, broken column, no overlap', () => {
    const withUnknown = { startWorkphaseId: 'a', endWorkphaseId: 'zz' };
    expect(computeColumnRange(withUnknown, rankMap)).toBeNull();
    expect(isColumnBroken(withUnknown, rankMap)).toBe(true);
    expect(columnsOverlap(withUnknown, { startWorkphaseId: 'a', endWorkphaseId: 'b' }, rankMap)).toBe(false);
  });

  it('computeUnsorted reports uncovered workphases and invalid item references', () => {
    const columnsForBoard = [{ startWorkphaseId: 'a', endWorkphaseId: 'b' }];
    const workflowItems = [
      { id: 'i1', workphaseId: 'a' },
      { id: 'i2', workphaseId: 'z' }, // not a real workphase in this workflow
      { id: 'i3', workphaseId: null },
    ];
    const { uncovered, invalidItems } = computeUnsorted(phases, columnsForBoard, rankMap, workflowItems);
    expect(uncovered.map(w => w.id)).toEqual(['c', 'd']);
    expect(invalidItems.map(i => i.id)).toEqual(['i2', 'i3']);
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────

// The workflow's default board is auto-bootstrapped by POST /api/workflows at
// creation time, when the workflow has zero workphases yet — so it starts
// with zero columns, giving these tests a clean slate to build custom ranges
// on top of (workphases added afterward land in Unsorted, not auto-added).
async function setupCleanBoard() {
  const project = await createProject();
  const workflow = await createWorkflow(project.id);
  const boardsBefore = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
  const board = boardsBefore.body[0];

  const todo = await createWorkphase(workflow.id, { name: 'Todo' });
  const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
  const done = await createWorkphase(workflow.id, { name: 'Done' });

  return { project, workflow, board, todo, inProgress, done };
}

// Workflow `WF` with non-terminal workphases Todo, Doing, Review and Ship (W1 to
// W4), in that order, and two boards, `board` and `otherBoard`, that start
// with no columns.
async function setupFour() {
  const project = await createProject();
  const workflow = await createWorkflow(project.id);
  const [board] = (await request(app).get(`/api/boards?workflowId=${workflow.id}`)).body;
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
    expect(merged.body.position).toBe(1.0);

    const expanded = await postColumn(board.id, w[1].id, w[1].id, { displayMode: 'expanded' });
    expect(expanded.status).toBe(201);
    expect(expanded.body.displayMode).toBe('expanded');
  });

  it('BCU-2.5: a column’s start and end must be workphases of its board’s workflow', async () => {
    const { board, w } = await setupFour();
    const v1 = await createWorkphase((await createWorkflow((await createProject()).id)).id, { name: 'V1' });

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

  it('BCU-2.8: a broken column still covers the workphases between its two ends', async () => {
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

describe('terminal/non-terminal column ranges', () => {
  async function setupWithTerminal() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const boardsBefore = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const board = boardsBefore.body[0];
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    return { project, workflow, board, inProgress, done };
  }

  async function boardColumns(boardId: string) {
    const res = await request(app).get(`/api/boards/${boardId}`);
    return res.body.columns as { id: string; startWorkphaseId: string; endWorkphaseId: string }[];
  }

  it('TC-6.7: POST rejects a range spanning a terminal and non-terminal workphase', async () => {
    const { board, inProgress, done } = await setupWithTerminal();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: inProgress.id,
      endWorkphaseId: done.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terminal/i);
    expect(await boardColumns(board.id)).toEqual([]);
  });

  it('TC-6.8: POST allows a range entirely within terminal workphases', async () => {
    const { board, done } = await setupWithTerminal();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id,
      startWorkphaseId: done.id,
      endWorkphaseId: done.id,
    });
    expect(res.status).toBe(201);
  });

  it('TC-6.7: PUT rejects extending a range to cross the terminal boundary', async () => {
    const { board, inProgress, done } = await setupWithTerminal();
    const created = await createColumn(board.id, inProgress.id, inProgress.id);
    const res = await request(app).put(`/api/columns/${created.id}`).send({ endWorkphaseId: done.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terminal/i);
    expect(await boardColumns(board.id)).toEqual([
      expect.objectContaining({ id: created.id, startWorkphaseId: inProgress.id, endWorkphaseId: inProgress.id }),
    ]);
  });
});

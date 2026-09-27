import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createWorkflow, createWorkphase, createColumn, createItem } from '../fixtures.js';
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
  return { id, position, name: id, workflowId: 'w', agentId: null, triggersNotification: 0, isTerminal: 0, createdAt: 0 };
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

describe('POST /api/columns', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/columns').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent board', async () => {
    const { todo, done } = await setupCleanBoard();
    const res = await request(app).post('/api/columns').send({
      boardId: 'does-not-exist', startWorkphaseId: todo.id, endWorkphaseId: done.id,
    });
    expect(res.status).toBe(404);
  });

  it('creates a column spanning a range, defaulting displayMode to merged', async () => {
    const { board, todo, done } = await setupCleanBoard();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: todo.id, endWorkphaseId: done.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.displayMode).toBe('merged');
    expect(res.body.position).toBe(1.0);
  });

  it('rejects an inverted range', async () => {
    const { board, todo, done } = await setupCleanBoard();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: done.id, endWorkphaseId: todo.id,
    });
    expect(res.status).toBe(400);
  });

  it("rejects a workphase id that does not belong to the board's workflow", async () => {
    const { board, todo } = await setupCleanBoard();
    const otherWorkflow = await createWorkflow((await createProject()).id);
    const foreignPhase = await createWorkphase(otherWorkflow.id, { name: 'Foreign' });

    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: todo.id, endWorkphaseId: foreignPhase.id,
    });
    expect(res.status).toBe(400);
  });

  it('rejects overlapping ranges on the same board', async () => {
    const { board, todo, inProgress, done } = await setupCleanBoard();

    const first = await createColumn(board.id, todo.id, inProgress.id);
    expect(first.id).toBeTruthy();

    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: inProgress.id, endWorkphaseId: done.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.conflictingColumnId).toBe(first.id);
  });

  it('allows adjacent, non-overlapping ranges', async () => {
    const { board, todo, inProgress, done } = await setupCleanBoard();

    await createColumn(board.id, todo.id, todo.id);
    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: inProgress.id, endWorkphaseId: done.id, displayMode: 'expanded',
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

  it('rejects an inverted range and a foreign workphase on update', async () => {
    const { board, todo, done } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id);

    // nextStart=done outranks the kept nextEnd=todo
    const inverted = await request(app).put(`/api/columns/${col.id}`).send({ startWorkphaseId: done.id });
    expect(inverted.status).toBe(400);
    expect(inverted.body.error).toMatch(/must not come after/i);

    const otherWorkflow = await createWorkflow((await createProject()).id);
    const foreignPhase = await createWorkphase(otherWorkflow.id, { name: 'Foreign' });
    const foreign = await request(app).put(`/api/columns/${col.id}`).send({ endWorkphaseId: foreignPhase.id });
    expect(foreign.status).toBe(400);
    expect(foreign.body.error).toMatch(/belong to this board's workflow/i);
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

    const res = await request(app).patch('/api/columns/reorder').send({
      columnOrders: [{ id: col.id, position: 'first' }],
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 with missingIds when any column does not exist', async () => {
    const { board, todo } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id);

    const res = await request(app).patch('/api/columns/reorder').send({
      columnOrders: [{ id: col.id, position: 1 }, { id: 'ghost', position: 2 }],
    });
    expect(res.status).toBe(404);
    expect(res.body.missingIds).toEqual(['ghost']);
  });

  it('reorders columns and the board reflects the new order', async () => {
    const { board, todo, done } = await setupCleanBoard();
    const colA = await createColumn(board.id, todo.id, todo.id);
    const colB = await createColumn(board.id, done.id, done.id);

    const res = await request(app).patch('/api/columns/reorder').send({
      columnOrders: [{ id: colA.id, position: 5 }, { id: colB.id, position: 1 }],
    });
    expect(res.status).toBe(200);

    const detail = await request(app).get(`/api/boards/${board.id}`);
    expect(detail.body.columns.map((c: { id: string }) => c.id)).toEqual([colB.id, colA.id]);
  });
});

describe('DELETE /api/columns/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/columns/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes a column unconditionally, even with items in its covered workphase', async () => {
    const { project, board, todo } = await setupCleanBoard();
    const col = await createColumn(board.id, todo.id, todo.id);
    await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).delete(`/api/columns/${col.id}`);
    expect(res.status).toBe(204);
  });
});

describe('Epic 3.2 — terminal/non-terminal column ranges', () => {
  async function setupWithTerminal() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const boardsBefore = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const board = boardsBefore.body[0];
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    return { project, workflow, board, inProgress, done };
  }

  it('POST rejects a range spanning a terminal and non-terminal workphase', async () => {
    const { board, inProgress, done } = await setupWithTerminal();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: inProgress.id, endWorkphaseId: done.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terminal/i);
  });

  it('POST allows a range entirely within terminal workphases', async () => {
    const { board, done } = await setupWithTerminal();
    const res = await request(app).post('/api/columns').send({
      boardId: board.id, startWorkphaseId: done.id, endWorkphaseId: done.id,
    });
    expect(res.status).toBe(201);
  });

  it('PUT rejects extending a range to cross the terminal boundary', async () => {
    const { board, inProgress, done } = await setupWithTerminal();
    const created = await createColumn(board.id, inProgress.id, inProgress.id);
    const res = await request(app).put(`/api/columns/${created.id}`).send({ endWorkphaseId: done.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terminal/i);
  });
});

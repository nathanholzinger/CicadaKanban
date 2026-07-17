import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

const BASE = 'http://localhost:3002/api';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

// A bare workflow's default board bootstraps with zero columns (no workphases
// exist yet at creation time), leaving the whole range free for these tests.
async function setupBareBoard(request: import('@playwright/test').APIRequestContext, name: string) {
  const project = await (await request.post(`${BASE}/projects`, { data: { name } })).json();
  const workflow = await (await request.post(`${BASE}/workflows`, {
    data: { name, projectId: project.id },
  })).json();
  const boards = await (await request.get(`${BASE}/boards?workflowId=${workflow.id}`)).json();

  const phases: Array<{ id: string; name: string }> = [];
  for (const phaseName of ['Todo', 'In Progress', 'Done']) {
    phases.push(await (await request.post(`${BASE}/workphases`, {
      data: { workflowId: workflow.id, name: phaseName },
    })).json());
  }
  return { board: boards[0], phases };
}

test('POST /api/columns creates a merged range column', async ({ request }) => {
  const { board, phases } = await setupBareBoard(request, 'Column Create Project');

  const res = await request.post(`${BASE}/columns`, {
    data: { boardId: board.id, startWorkphaseId: phases[0].id, endWorkphaseId: phases[1].id },
  });
  expect(res.status()).toBe(201);
  const column = await res.json();
  expect(column.displayMode).toBe('merged');

  const detail = await (await request.get(`${BASE}/boards/${board.id}`)).json();
  const resolved = detail.columns.find((c: { id: string }) => c.id === column.id);
  expect(resolved.displayName).toBe('Todo – In Progress');
});

test('POST /api/columns rejects an overlapping range with the conflicting column id', async ({ request }) => {
  const { board, phases } = await setupBareBoard(request, 'Column Overlap Project');
  const first = await (await request.post(`${BASE}/columns`, {
    data: { boardId: board.id, startWorkphaseId: phases[0].id, endWorkphaseId: phases[1].id },
  })).json();

  const res = await request.post(`${BASE}/columns`, {
    data: { boardId: board.id, startWorkphaseId: phases[1].id, endWorkphaseId: phases[2].id },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/overlaps/i);
  expect(body.conflictingColumnId).toBe(first.id);
});

test('PATCH /api/columns/reorder persists the new order on the board', async ({ request }) => {
  const { board, phases } = await setupBareBoard(request, 'Column Reorder Project');
  const colA = await (await request.post(`${BASE}/columns`, {
    data: { boardId: board.id, startWorkphaseId: phases[0].id, endWorkphaseId: phases[0].id },
  })).json();
  const colB = await (await request.post(`${BASE}/columns`, {
    data: { boardId: board.id, startWorkphaseId: phases[2].id, endWorkphaseId: phases[2].id },
  })).json();

  const res = await request.patch(`${BASE}/columns/reorder`, {
    data: { columnOrders: [{ id: colA.id, position: 5 }, { id: colB.id, position: 1 }] },
  });
  expect(res.ok()).toBeTruthy();

  const detail = await (await request.get(`${BASE}/boards/${board.id}`)).json();
  expect(detail.columns.map((c: { id: string }) => c.id)).toEqual([colB.id, colA.id]);
});

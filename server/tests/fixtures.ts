import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/index.js';
import { db } from '../src/db/index.js';
import { items } from '../src/db/schema.js';

export async function createProject(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/projects')
    .send({ name: 'Test Project', ...overrides });
  return res.body;
}

export async function createWorkflow(projectId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workflows')
    .send({ name: 'Test Workflow', projectId, ...overrides });
  return res.body;
}

export async function createWorkphase(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workphases')
    .send({ workflowId, name: 'Test Phase', ...overrides });
  return res.body;
}

export async function createBoard(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/boards')
    .send({ workflowId, name: 'Test Board', ...overrides });
  return res.body;
}

export async function createColumn(
  boardId: string,
  startWorkphaseId: string,
  endWorkphaseId: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/columns')
    .send({ boardId, startWorkphaseId, endWorkphaseId, ...overrides });
  return res.body;
}

export async function createItem(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/items')
    .send({ title: 'Test Item', ...overrides });
  return res.body;
}

export async function findTemplateByName(name: 'quick' | 'flow') {
  const res = await request(app).get('/api/workflow-templates');
  return res.body.find((t: { name: string }) => t.name === name);
}

type ItemRef = { id: string };
export type ResolvedColumn = {
  id: string;
  displayName: string;
  broken: boolean;
  startWorkphaseId: string;
  endWorkphaseId: string;
  subRows: { workphase: { id: string }; items: ItemRef[] }[];
};
// A board as `GET /api/boards/:id` returns it: the fields the board tests read.
export type BoardBody = {
  columns: ResolvedColumn[];
  unsorted: {
    uncovered: { workphase: { id: string }; items: ItemRef[] }[];
    invalidItems: ItemRef[];
    needsAttention: boolean;
  };
};

export async function readBoard(boardId: string) {
  return (await request(app).get(`/api/boards/${boardId}`)).body as BoardBody;
}

export async function boardsOf(workflowId: string) {
  return (await request(app).get(`/api/boards?workflowId=${workflowId}`)).body as { id: string }[];
}

export async function columnOn(boardId: string, columnId: string) {
  return (await readBoard(boardId)).columns.find(c => c.id === columnId)!;
}

// The workphases a column covers, in order.
export const covers = (column: ResolvedColumn) => column.subRows.map(r => r.workphase.id);

// Reorders a workflow's workphases to `order`, first to last.
export function reorderWorkphases(order: { id: string }[]) {
  return request(app)
    .patch('/api/workphases/reorder')
    .send({ workphaseOrders: order.map((p, i) => ({ id: p.id, position: i + 1 })) });
}

// Pins an item's position by writing the row. The API takes no final position
// from any caller (wiki item-positioning §2), so a test that needs an exact
// layout goes around it.
export function setItemPosition(id: string, position: number | null) {
  db.update(items).set({ position }).where(eq(items.id, id)).run();
}

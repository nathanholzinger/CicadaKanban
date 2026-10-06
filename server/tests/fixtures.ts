import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/index.js';
import { db } from '../src/db/index.js';
import { items, projects } from '../src/db/schema.js';

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

// A project with a workflow built from the "quick" (Todo, Done) or "flow"
// (Todo, In Progress, Review, Done) template, so its default board starts with
// real 1:1 columns.
export async function templatedWorkflow(template: 'quick' | 'flow', projectOverrides: Record<string, unknown> = {}) {
  const project = await createProject(projectOverrides);
  const { id: templateId } = await findTemplateByName(template);
  const workflow = await createWorkflow(project.id, { templateId });
  const workphaseIds = [...(workflow.workphases as { id: string; position: number }[])]
    .sort((a, b) => a.position - b.position)
    .map(w => w.id);
  return { project, workflow, workphaseIds };
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

// Every item a board returns, wherever it sits: in a column, in an uncovered
// workphase, or in `invalidItems`.
export function itemIdsOn(board: BoardBody): Set<string> {
  const ids = new Set<string>();
  for (const column of board.columns) for (const row of column.subRows) for (const i of row.items) ids.add(i.id);
  for (const row of board.unsorted.uncovered) for (const i of row.items) ids.add(i.id);
  for (const i of board.unsorted.invalidItems) ids.add(i.id);
  return ids;
}

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
// from any caller (wiki positioning §2), so a test that needs an exact
// layout goes around it.
export function setItemPosition(id: string, position: number | null) {
  db.update(items).set({ position }).where(eq(items.id, id)).run();
}

// The same for a project, which the API never gives a position of its own
// choosing, or none.
export function setProjectPosition(id: string, position: number | null) {
  db.update(projects).set({ position }).where(eq(projects.id, id)).run();
}

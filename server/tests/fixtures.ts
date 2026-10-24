import { expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/index.js';
import { db, sqlite } from '../src/db/index.js';
import { columns, items, projects } from '../src/db/schema.js';

// The body of a setup request whose status is asserted. A refused create that handed back its
// `{ error }` body would show up steps later as an id that is undefined, so a setup step that
// fails does so at its own line. A test of a refusal sends the request itself.
function created(res: request.Response, what: string) {
  expect(res.ok, `${what} → ${res.status} ${JSON.stringify(res.body)}`).toBe(true);
  return res.body;
}

export async function createProject(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/projects')
    .send({ name: 'Test Project', ...overrides });
  return created(res, 'POST /projects');
}

export async function createWorkflow(projectId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workflows')
    .send({ name: 'Test Workflow', projectId, ...overrides });
  return created(res, 'POST /workflows');
}

export async function createWorkphase(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/workphases')
    .send({ workflowId, name: 'Test Phase', ...overrides });
  return created(res, 'POST /workphases');
}

export async function createBoard(workflowId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/boards')
    .send({ workflowId, name: 'Test Board', ...overrides });
  return created(res, 'POST /boards');
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
  return created(res, 'POST /columns');
}

export async function createItem(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/items')
    .send({ title: 'Test Item', ...overrides });
  return created(res, 'POST /items');
}

export async function createAgent(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/agents')
    .send({ name: 'Claude', claudeProjectId: 'p1', surface: 'code', ...overrides });
  return created(res, 'POST /agents');
}

export async function createItemType(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/item-types')
    .send({ name: 'Bug', ...overrides });
  return created(res, 'POST /item-types');
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

// A phase for `workflowWithPhases`: its name, or its name with the fields to create it with.
type PhaseSpec = string | ({ name: string } & Record<string, unknown>);

// A project, its workflow, the workflow's default board and workphases created in the
// order given, back in the same order. The workflow starts with none, so its board
// starts with no columns: bootstrap covers only the workphases that exist when a
// workflow is made, and a test that wants a column over them adds one.
export async function workflowWithPhases(phases: PhaseSpec[], projectOverrides: Record<string, unknown> = {}) {
  const project = await createProject(projectOverrides);
  const workflow = await createWorkflow(project.id);
  const [board] = await boardsOf(workflow.id);
  const created = [];
  for (const phase of phases) {
    created.push(await createWorkphase(workflow.id, typeof phase === 'string' ? { name: phase } : phase));
  }
  return { project, workflow, board, phases: created };
}

// One project owning a three-phase workflow (Todo, In Progress, Done*).
export async function setupWorkflow(name = 'P') {
  const {
    project,
    workflow,
    phases: [todo, inProgress, done],
  } = await workflowWithPhases(['Todo', 'In Progress', { name: 'Done', isTerminal: true }], { name });
  return { project, workflow, todo, inProgress, done };
}

type ItemRef = { id: string; positionScope: string };
export type ResolvedColumn = {
  id: string;
  displayName: string;
  broken: boolean;
  startWorkphaseId: string;
  endWorkphaseId: string;
  subRows: { workphase: { id: string }; items: ItemRef[] }[];
};
// A board as `GET /api/boards/:id` returns it, narrowed to the fields the board tests read.
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

// An item's move and its edit, sent through the routes.
export const move = (id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/items/${id}/move`).send(body);
export const put = (id: string, body: Record<string, unknown>) => request(app).put(`/api/items/${id}`).send(body);

type ItemRow = typeof items.$inferSelect;

// An item's stored row, for what a response leaves out and what a refused write must not touch.
export function getRow(id: string): ItemRow {
  return db.select().from(items).where(eq(items.id, id)).get()!;
}

export const countItems = () => db.select().from(items).all().length;

// Pins an item's position by writing the row. The API takes no final position
// from any caller (wiki positioning §2), so a test that needs an exact
// layout goes around it.
export function setItemPosition(id: string, position: number | null) {
  db.update(items).set({ position }).where(eq(items.id, id)).run();
}

// Files an item in a workphase by writing the row, for the tests of a state no write produces: an
// item in another workflow's workphase, or in none, or an attached child stored in a workphase
// other than its parent's.
export function setItemWorkphase(id: string, workphaseId: string | null) {
  db.update(items).set({ workphaseId }).where(eq(items.id, id)).run();
}

// The same for a project, which the API never gives a position of its own
// choosing, or none.
export function setProjectPosition(id: string, position: number | null) {
  db.update(projects).set({ position }).where(eq(projects.id, id)).run();
}

// Sets an item's parent by writing the row, for the tests of data no write produces: a
// tree past the depth cap, or a parentId cycle. `isAttached`, when given, is written with it.
export function setItemParent(id: string, parentId: string | null, isAttached?: boolean) {
  const attachment = isAttached === undefined ? {} : { isAttached: isAttached ? 1 : 0 };
  db.update(items)
    .set({ parentId, ...attachment })
    .where(eq(items.id, id))
    .run();
}

// Sets a column's start or end by writing the row, for the tests of data no write produces: an end
// in another workflow, or one that names no workphase. SQLite refuses the second with foreign keys
// on, so they are off for the write.
export function setColumnEnds(id: string, ends: { startWorkphaseId?: string; endWorkphaseId?: string }) {
  sqlite.pragma('foreign_keys = OFF');
  try {
    db.update(columns).set(ends).where(eq(columns.id, id)).run();
  } finally {
    sqlite.pragma('foreign_keys = ON');
  }
}

// Sets a project's parent by writing the row, as `setItemParent` does for an item.
export function setProjectParent(id: string, parentId: string | null) {
  db.update(projects).set({ parentId }).where(eq(projects.id, id)).run();
}

import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { API } from './api';

type WorkflowTemplateName = 'flow' | 'quick';

interface SeededProject {
  id: string;
  name: string;
}
interface SeededWorkflow {
  id: string;
  workphases: Array<{ id: string; name: string }>;
}

// The body of a response whose status is asserted. A failed create or read that
// handed back its `{ error }` body would show up steps later as a card that never
// appeared or a chain link missing its parent.
async function checkedJson(res: APIResponse, what: string) {
  expect(res.ok(), `${what} → ${res.status()}`).toBe(true);
  return res.json();
}

// A project, with the status asserted.
export async function seedProject(request: APIRequestContext, data: Record<string, unknown>): Promise<SeededProject> {
  return checkedJson(await request.post(`${API}/projects`, { data }), `POST /projects ${JSON.stringify(data)}`);
}

// A workflow on an existing project: bare, or built from a named template.
export async function seedWorkflow(
  request: APIRequestContext,
  projectId: string,
  name: string,
  templateName?: WorkflowTemplateName,
): Promise<SeededWorkflow> {
  const data: Record<string, unknown> = { name, projectId };
  if (templateName) {
    const templates = await checkedJson(await request.get(`${API}/workflow-templates`), 'GET /workflow-templates');
    const template = templates.find((t: { name: string }) => t.name === templateName);
    expect(template, `no "${templateName}" workflow template`).toBeDefined();
    data.templateId = template.id;
  }
  return checkedJson(await request.post(`${API}/workflows`, { data }), `POST /workflows ${JSON.stringify(data)}`);
}

// A project with a workflow from a named template. Callers that need
// specific named phases out of the response use pickWorkphases below.
export async function seedTemplatedWorkflow(
  request: APIRequestContext,
  name: string,
  templateName: WorkflowTemplateName = 'flow',
): Promise<{ project: SeededProject; workflow: SeededWorkflow }> {
  const project = await seedProject(request, { name });
  return { project, workflow: await seedWorkflow(request, project.id, name, templateName) };
}

// A workflow with no phases yet — pair with addWorkphases below to build one
// up incrementally.
export async function seedBareWorkflow(
  request: APIRequestContext,
  name: string,
): Promise<{ project: SeededProject; workflow: SeededWorkflow }> {
  const project = await seedProject(request, { name });
  return { project, workflow: await seedWorkflow(request, project.id, name) };
}

export async function addWorkphases(
  request: APIRequestContext,
  workflowId: string,
  names: string[],
): Promise<Array<{ id: string; name: string }>> {
  const phases: Array<{ id: string; name: string }> = [];
  for (const name of names) {
    const data = { workflowId, name };
    phases.push(await checkedJson(await request.post(`${API}/workphases`, { data }), `POST /workphases ${name}`));
  }
  return phases;
}

// The id of the workflow's default board, the one it is created with.
async function defaultBoardId(request: APIRequestContext, workflowId: string): Promise<string> {
  const boards = await checkedJson(
    await request.get(`${API}/boards?workflowId=${workflowId}`),
    `GET /boards?workflowId=${workflowId}`,
  );
  expect(boards.length, `workflow ${workflowId} has no board`).toBeGreaterThan(0);
  return boards[0].id;
}

// A column on the workflow's default board covering `startWorkphaseId` through
// `endWorkphaseId`, one workphase when the end is left out. A workflow made bare,
// with its phases added after, starts with no columns, so a spec builds them.
export async function seedColumn(
  request: APIRequestContext,
  workflowId: string,
  startWorkphaseId: string,
  endWorkphaseId: string = startWorkphaseId,
): Promise<{ id: string }> {
  const data = { boardId: await defaultBoardId(request, workflowId), startWorkphaseId, endWorkphaseId };
  return checkedJson(await request.post(`${API}/columns`, { data }), `POST /columns ${JSON.stringify(data)}`);
}

export interface SeededItem {
  id: string;
  title: string;
  parentId: string | null;
  projectId: string | null;
  workphaseId: string | null;
  position: number | null;
  isAttached: number;
  createdAt: number;
}

// POST /items with the status asserted. The bare
// `(await request.post(…/items)).json()` shape hands the next step an
// `{ error }` body when the create fails — a chain link silently missing
// its parent, a fixture item that never existed.
export async function seedItem(request: APIRequestContext, data: Record<string, unknown>): Promise<SeededItem> {
  return checkedJson(await request.post(`${API}/items`, { data }), `POST /items ${JSON.stringify(data)}`);
}

// PATCH /items/:id/move with the status asserted, for a setup move that must have
// landed before the spec goes on. A spec of a refused move sends its own.
export async function moveItem(request: APIRequestContext, id: string, move: Record<string, unknown>) {
  return checkedJson(
    await request.patch(`${API}/items/${id}/move`, { data: move }),
    `PATCH /items/${id}/move ${JSON.stringify(move)}`,
  );
}

// Projects from `[name, parent name | null]` pairs, in sibling order, a parent
// before its children, with every status asserted. Returns each project's id
// by name.
export async function seedProjects(
  request: APIRequestContext,
  tree: ReadonlyArray<readonly [name: string, parent: string | null]>,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const [name, parent] of tree) {
    if (parent !== null && !(parent in ids)) {
      throw new Error(`seedProjects: "${name}" names the parent "${parent}", which isn't seeded before it`);
    }
    ids[name] = (await seedProject(request, { name, parentId: parent === null ? undefined : ids[parent] })).id;
  }
  return ids;
}

export interface ProjectRow {
  id: string;
  parentId: string | null;
  position: number | null;
  updatedAt: number;
}

export async function fetchProject(request: APIRequestContext, id: string): Promise<ProjectRow> {
  return checkedJson(await request.get(`${API}/projects/${id}`), `GET /projects/${id}`);
}

// Pins one project to an exact position, or to none (`null`), through the
// test-only route `PATCH /api/test/projects/:id/position`: no project request
// names a final position (wiki positioning §2), and none leaves it empty.
export async function pinProjectPosition(
  request: APIRequestContext,
  id: string,
  position: number | null,
): Promise<void> {
  const res = await request.patch(`${API}/test/projects/${id}/position`, { data: { position } });
  expect(res.ok(), `pin project ${id} at ${position} → ${res.status()}`).toBe(true);
}

// Pins one project's creation time through the test-only route
// `PATCH /api/test/projects/:id/created-at`, so a tie's order is certain.
export async function pinProjectCreatedAt(request: APIRequestContext, id: string, createdAt: number): Promise<void> {
  const res = await request.patch(`${API}/test/projects/${id}/created-at`, { data: { createdAt } });
  expect(res.ok(), `pin project ${id} created at ${createdAt} → ${res.status()}`).toBe(true);
}

// Gives one project a parent by writing the row, through the test-only route
// `PATCH /api/test/projects/:id/parent`: no project write builds a tree deeper
// than the project cap.
export async function pinProjectParent(request: APIRequestContext, id: string, parentId: string | null): Promise<void> {
  const res = await request.patch(`${API}/test/projects/${id}/parent`, { data: { parentId } });
  expect(res.ok(), `pin project ${id} under ${parentId} → ${res.status()}`).toBe(true);
}

// The project depth cap the API enforces, which the sidebar offers tab states
// against.
export async function fetchProjectDepthCap(request: APIRequestContext): Promise<number> {
  const body = await checkedJson(await request.get(`${API}/projects/depth-cap`), 'GET /projects/depth-cap');
  return body.projectDepthCap;
}

export interface PositionedItemPlan<K extends string> {
  key: K;
  projectId: string;
  workphaseId: string;
  position: number;
  /** Defaults to `Item ${key}`. */
  title?: string;
}

// Pins one item to an exact position through the test-only route,
// `PATCH /api/test/items/:id/position`: the item API takes no final position
// (wiki positioning §2).
export async function pinItemPosition(request: APIRequestContext, id: string, position: number): Promise<void> {
  const res = await request.patch(`${API}/test/items/${id}/position`, { data: { position } });
  expect(res.ok(), `pin ${id} at ${position} → ${res.status()}`).toBe(true);
}

// Creates items and pins each to an explicit position ("plan → create → pin"),
// for the repositioning scenarios and the band spec. Append alone places each
// new item after the workflow's last, so it can't reproduce a layout with
// fractional positions or one out of creation order, which is why the pin
// exists. Every item is created before any is pinned: a create reindexes its
// scope when the positions in it are large, and that would renumber an item
// pinned just before.
// Returns the created rows keyed by plan key, with `position` as pinned.
export async function seedPositionedItems<K extends string>(
  request: APIRequestContext,
  plan: ReadonlyArray<PositionedItemPlan<K>>,
): Promise<Record<K, SeededItem & { position: number }>> {
  const created: SeededItem[] = [];
  for (const { key, projectId, workphaseId, title } of plan) {
    created.push(await seedItem(request, { title: title ?? `Item ${key}`, projectId, workphaseId }));
  }
  const items = {} as Record<K, SeededItem & { position: number }>;
  for (const [i, { key, position }] of plan.entries()) {
    await pinItemPosition(request, created[i].id, position);
    items[key] = { ...created[i], position };
  }
  return items;
}

// GETs one item by id, with the status asserted.
export async function fetchItem(request: APIRequestContext, id: string) {
  return checkedJson(await request.get(`${API}/items/${id}`), `GET /items/${id}`);
}

// The fields of a column that callers of `fetchDefaultBoard` read.
export interface SeededColumn {
  id: string;
  entryWorkphaseId: string;
}
// The fields of a board that callers of `fetchDefaultBoard` read.
export interface SeededBoard {
  id: string;
  columns: SeededColumn[];
  itemDepthCap: number;
  showAttachedChildren: number;
}

// The workflow's auto-bootstrapped default board, resolved (columns + Unsorted)
// — the `boards?workflowId=` → `boards/:id` two-step that every board-driven
// spec repeated.
export async function fetchDefaultBoard(request: APIRequestContext, workflowId: string): Promise<SeededBoard> {
  const id = await defaultBoardId(request, workflowId);
  return checkedJson(await request.get(`${API}/boards/${id}`), `GET /boards/${id}`);
}

// The column whose entry workphase is `workphaseId` — a merged column that
// covers it further in isn't found.
export function columnForWorkphase(board: SeededBoard, workphaseId: string): SeededColumn {
  const found = board.columns.find(c => c.entryWorkphaseId === workphaseId);
  if (!found) throw new Error(`No column covers workphase "${workphaseId}" as its entry`);
  return found;
}

// Pulls named phases out of a workflow's `workphases` array, in the given
// order.
export function pickWorkphases(workflow: SeededWorkflow, ...names: string[]): Array<{ id: string; name: string }> {
  return names.map(name => {
    const phase = workflow.workphases.find(p => p.name === name);
    if (!phase) throw new Error(`Workflow has no workphase named "${name}"`);
    return phase;
  });
}

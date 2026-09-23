import { expect, type APIRequestContext } from '@playwright/test';
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

// "POST project -> GET workflow-templates -> find by name -> POST workflow"
// was duplicated under 3 different names across tests/api and tests/ui —
// createFlowWorkflow, setupWorkflow, and two createTemplatedWorkflow's, one
// per template (audit Finding #27). Callers that need specific named phases
// out of the response use pickWorkphases below.
export async function seedTemplatedWorkflow(
  request: APIRequestContext,
  name: string,
  templateName: WorkflowTemplateName = 'flow',
): Promise<{ project: SeededProject; workflow: SeededWorkflow }> {
  const project = await (await request.post(`${API}/projects`, { data: { name } })).json();
  const templates = await (await request.get(`${API}/workflow-templates`)).json();
  const template = templates.find((t: { name: string }) => t.name === templateName);
  const workflow = await (
    await request.post(`${API}/workflows`, {
      data: { name, projectId: project.id, templateId: template.id },
    })
  ).json();
  return { project, workflow };
}

// A workflow with no phases yet — pair with addWorkphases below to build one
// up incrementally (was createBareWorkflow in boards-layer.spec.ts).
export async function seedBareWorkflow(
  request: APIRequestContext,
  name: string,
): Promise<{ project: SeededProject; workflow: SeededWorkflow }> {
  const project = await (await request.post(`${API}/projects`, { data: { name } })).json();
  const workflow = await (
    await request.post(`${API}/workflows`, {
      data: { name, projectId: project.id },
    })
  ).json();
  return { project, workflow };
}

export async function addWorkphases(
  request: APIRequestContext,
  workflowId: string,
  names: string[],
): Promise<Array<{ id: string; name: string }>> {
  const phases: Array<{ id: string; name: string }> = [];
  for (const name of names) {
    const phase = await (await request.post(`${API}/workphases`, { data: { workflowId, name } })).json();
    phases.push(phase);
  }
  return phases;
}

// POST /items with the status asserted. The bare
// `(await request.post(…/items)).json()` shape hands the next step an
// `{ error }` body when the create fails — a chain link silently missing
// its parent, a fixture item that never existed — so every seeded item
// goes through here (audit epic-3-5-story-2 #16 / story-3 #7).
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

export async function seedItem(request: APIRequestContext, data: Record<string, unknown>): Promise<SeededItem> {
  const res = await request.post(`${API}/items`, { data });
  expect(res.ok(), `POST /items ${JSON.stringify(data)} → ${res.status()}`).toBe(true);
  return res.json();
}

export interface PositionedItemPlan<K extends string> {
  key: K;
  projectId: string;
  workphaseId: string;
  position: number;
  /** Defaults to `Item ${key}`. */
  title?: string;
}

// Creates items and pins each to an explicit position — the "plan → create
// → PATCH position" loop the repositioning scenarios and the band spec each
// wrote by hand. Append alone can't reproduce an interleaved layout (each
// workphase has its own append counter), which is why the pin exists.
// Returns the created rows keyed by plan key, with `position` as pinned.
export async function seedPositionedItems<K extends string>(
  request: APIRequestContext,
  plan: ReadonlyArray<PositionedItemPlan<K>>,
): Promise<Record<K, SeededItem & { position: number }>> {
  const items = {} as Record<K, SeededItem & { position: number }>;
  for (const { key, projectId, workphaseId, position, title } of plan) {
    const created = await seedItem(request, { title: title ?? `Item ${key}`, projectId, workphaseId });
    const pinned = await request.patch(`${API}/items/${created.id}/move`, { data: { position } });
    expect(pinned.ok(), `pin ${key} at ${position} → ${pinned.status()}`).toBe(true);
    items[key] = { ...created, position };
  }
  return items;
}

// GETs one item by id — spelled independently at least three times across
// the drag/repositioning specs (`item`/`getC`/`getItem`, audit
// epic-3-5-story-4 #6).
export async function fetchItem(request: APIRequestContext, id: string) {
  return (await request.get(`${API}/items/${id}`)).json();
}

// The minimal shape every caller of `fetchDefaultBoard` actually reads off
// the response — untyped before (audit epic-3-5-story-5 #13), which is why
// `drag-5-stub-detach.spec.ts` had to re-annotate its own `.find` callback's
// param inline, three times, to get at a column's `entryWorkphaseId`.
export interface SeededColumn {
  id: string;
  entryWorkphaseId: string;
  displayName: string;
}
export interface SeededBoard {
  id: string;
  columns: SeededColumn[];
  itemDepthCap: number;
}

// The workflow's auto-bootstrapped default board, resolved (columns + Unsorted)
// — the `boards?workflowId=` → `boards/:id` two-step that every board-driven
// spec repeated.
export async function fetchDefaultBoard(request: APIRequestContext, workflowId: string): Promise<SeededBoard> {
  const boards = await (await request.get(`${API}/boards?workflowId=${workflowId}`)).json();
  expect(boards.length, `workflow ${workflowId} has no board`).toBeGreaterThan(0);
  return (await request.get(`${API}/boards/${boards[0].id}`)).json();
}

// The column covering a given workphase — the `board.columns.find(c =>
// c.entryWorkphaseId === workphaseId)` lookup `drag-5-stub-detach.spec.ts`
// (audit epic-3-5-story-5 #13) and `drag-column-bands.spec.ts`'s own
// `columnKeyOf` each re-rolled independently, re-annotating the untyped
// callback param every time before `fetchDefaultBoard` had a return type.
export function columnForWorkphase(board: SeededBoard, workphaseId: string): SeededColumn {
  const found = board.columns.find(c => c.entryWorkphaseId === workphaseId);
  if (!found) throw new Error(`No column covers workphase "${workphaseId}" as its entry`);
  return found;
}

// Pulls named phases out of a workflow's `workphases` array, in the given
// order — the "pick phases out of the response" half of what Finding #27
// flagged as duplicated (e.g. repeated `workflow.workphases.find(p => p.name
// === 'Todo')` per phase per call site).
export function pickWorkphases(workflow: SeededWorkflow, ...names: string[]): Array<{ id: string; name: string }> {
  return names.map(name => {
    const phase = workflow.workphases.find(p => p.name === name);
    if (!phase) throw new Error(`Workflow has no workphase named "${name}"`);
    return phase;
  });
}

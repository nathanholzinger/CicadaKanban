import type { APIRequestContext } from '@playwright/test';
import { API } from './api';
import { seedPositionedItems } from './seed';

export type ScenarioItem = { id: string; title: string; workphaseId: string | null; position: number | null; createdAt: number };
export type ScenarioWorkphase = { id: string; name: string };

export interface RepositioningScenario {
  project: { id: string; name: string };
  workflow: { id: string };
  colOnePhase: ScenarioWorkphase;
  colTwoPhase: ScenarioWorkphase;
  items: Record<'A' | 'B' | 'C' | 'D' | 'E', ScenarioItem>;
}

// Builds the shared 8-case repositioning scenario: items A-E at positions
// 1.0-5.0, with A/C/E in "Column One"'s workphase and B/D in "Column Two"'s
// workphase. Position values are pinned explicitly via the /move endpoint's
// raw `position` field (the documented direct-control escape hatch, see
// items.ts:307-311) — per-workphase append alone would land A/C/E at
// 1.0/2.0/3.0 and B/D at 1.0/2.0 (each workphase has its own independent
// append counter), not the interleaved 1.0-5.0 this scenario requires.
export async function seedRepositioningScenario(request: APIRequestContext, projectName: string): Promise<RepositioningScenario> {
  const project = await (await request.post(`${API}/projects`, { data: { name: projectName } })).json();
  const workflow = await (await request.post(`${API}/workflows`, { data: { name: projectName, projectId: project.id } })).json();

  const colOnePhase = await (await request.post(`${API}/workphases`, { data: { workflowId: workflow.id, name: 'Column One' } })).json();
  const colTwoPhase = await (await request.post(`${API}/workphases`, { data: { workflowId: workflow.id, name: 'Column Two' } })).json();

  const items = await seedPositionedItems(request, [
    { key: 'A', projectId: project.id, workphaseId: colOnePhase.id, position: 1.0 },
    { key: 'B', projectId: project.id, workphaseId: colTwoPhase.id, position: 2.0 },
    { key: 'C', projectId: project.id, workphaseId: colOnePhase.id, position: 3.0 },
    { key: 'D', projectId: project.id, workphaseId: colTwoPhase.id, position: 4.0 },
    { key: 'E', projectId: project.id, workphaseId: colOnePhase.id, position: 5.0 },
  ]);

  return { project, workflow, colOnePhase, colTwoPhase, items };
}

export interface CrossProjectRepositioningScenario {
  rootProject: { id: string; name: string };
  project1a: { id: string; name: string };
  project1b: { id: string; name: string };
  workflow: { id: string };
  sharedPhase: ScenarioWorkphase;
  items: Record<'A' | 'B' | 'C' | 'D' | 'E', ScenarioItem>;
}

// Builds the cross-project repositioning scenario: a root project owning
// one workflow with one shared workphase, and two child sub-projects
// (project1a, project1b) with no workflow of their own — they inherit the
// root's ("workflow inheritance" rule, CLAUDE.md; see
// client/src/App.tsx:122-132). Items A/C/E belong to project1a, B/D to
// project1b, all five sharing the one workphase — position scope is
// workflow-wide and provably blind to projectId (positionScopeFor,
// items.ts:29-58), so this scenario isolates project membership as the
// only variable, unlike seedRepositioningScenario's column/workphase split.
// Same position-pinning approach as seedRepositioningScenario, for the same
// reason (append alone won't reproduce the interleaved 1.0-5.0 layout).
export async function seedCrossProjectRepositioningScenario(request: APIRequestContext, rootName: string): Promise<CrossProjectRepositioningScenario> {
  const rootProject = await (await request.post(`${API}/projects`, { data: { name: rootName } })).json();
  const project1a = await (await request.post(`${API}/projects`, { data: { name: `${rootName} 1a`, parentId: rootProject.id } })).json();
  const project1b = await (await request.post(`${API}/projects`, { data: { name: `${rootName} 1b`, parentId: rootProject.id } })).json();

  const workflow = await (await request.post(`${API}/workflows`, { data: { name: rootName, projectId: rootProject.id } })).json();
  const sharedPhase = await (await request.post(`${API}/workphases`, { data: { workflowId: workflow.id, name: 'Shared Phase' } })).json();

  const items = await seedPositionedItems(request, [
    { key: 'A', projectId: project1a.id, workphaseId: sharedPhase.id, position: 1.0 },
    { key: 'B', projectId: project1b.id, workphaseId: sharedPhase.id, position: 2.0 },
    { key: 'C', projectId: project1a.id, workphaseId: sharedPhase.id, position: 3.0 },
    { key: 'D', projectId: project1b.id, workphaseId: sharedPhase.id, position: 4.0 },
    { key: 'E', projectId: project1a.id, workphaseId: sharedPhase.id, position: 5.0 },
  ]);

  return { rootProject, project1a, project1b, workflow, sharedPhase, items };
}

type WorkflowItemRow = { title: string; position: number; createdAt: number; workphaseId: string | null; projectId: string | null };

// Sorts by position then createdAt (the same tie-break the DB's own
// reindex/list queries use) so a real cross-workphase position collision —
// the workphase-scoped resolver can produce one, see repositioningScenario's
// header comment — still yields a deterministic, reproducible order rather
// than a flaky one. Shared by both suites so they apply identical tie-break
// logic to the same underlying data.
async function orderOf(request: APIRequestContext, workflowId: string, predicate: (item: WorkflowItemRow) => boolean): Promise<string> {
  const workflow = await (await request.get(`${API}/workflows/${workflowId}`)).json();
  const matched = (workflow.items as WorkflowItemRow[])
    .filter(predicate)
    // `position` is null by design for a done/unsorted item (Part 6) — the
    // `?? 0` guard (audit Finding #20, matching siblingOrder's existing
    // convention below) keeps a future done-item scenario deterministic
    // instead of `NaN`-comparator flake. Not reachable today (every
    // scenario here is active-only); hardened for whenever one isn't.
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt);
  return matched.map(i => i.title.replace('Item ', '')).join('');
}

export function columnOrder(request: APIRequestContext, workflowId: string, workphaseId: string): Promise<string> {
  return orderOf(request, workflowId, i => i.workphaseId === workphaseId);
}

export function fullOrder(request: APIRequestContext, workflowId: string): Promise<string> {
  return orderOf(request, workflowId, () => true);
}

// A single project's own item order — the "collated" full order narrowed to
// one project's membership, mirroring the client's filterProjectId narrowing
// (ProjectPage.tsx, useItemManagement.ts) but computed server-side so it's
// independent of whatever the UI happens to render.
export function projectOrder(request: APIRequestContext, workflowId: string, projectId: string): Promise<string> {
  return orderOf(request, workflowId, i => i.projectId === projectId);
}

export interface AttachedSiblingsScenario {
  project: { id: string; name: string };
  workflow: { id: string };
  phase: ScenarioWorkphase;
  parent: ScenarioItem;
  items: Record<'A' | 'B' | 'C', ScenarioItem>;
  // Isolation control group (TC-3.2): a second parent with its own attached
  // child, and an unrelated top-level item, all sharing `phase` — proves a
  // reorder among `parent`'s children doesn't leak into either.
  otherParent: ScenarioItem;
  otherChild: ScenarioItem;
  topLevel: ScenarioItem;
}

// Builds the attached-sibling scenario for Part 3 (TC-3.1/TC-3.5): one
// parent with three attached children A/B/C, created via plain POST with no
// explicit position — natural append gives A=1.0, B=2.0, C=3.0, scoped to
// (parentId, isAttached) per positionScopeFor (server/src/routes/items.ts),
// not the workphase or workflow. Unlike seedRepositioningScenario, positions
// here are NOT manually pinned — the whole point is exercising the resolver
// against its natural append/anchor behavior for this scope.
export async function seedAttachedSiblingsScenario(request: APIRequestContext, projectName: string): Promise<AttachedSiblingsScenario> {
  const project = await (await request.post(`${API}/projects`, { data: { name: projectName } })).json();
  const workflow = await (await request.post(`${API}/workflows`, { data: { name: projectName, projectId: project.id } })).json();
  const phase = await (await request.post(`${API}/workphases`, { data: { workflowId: workflow.id, name: 'Todo' } })).json();

  const parent = await (await request.post(`${API}/items`, { data: { title: 'Parent', projectId: project.id, workphaseId: phase.id, isAttached: false } })).json();

  const items = {} as AttachedSiblingsScenario['items'];
  for (const key of ['A', 'B', 'C'] as const) {
    items[key] = await (await request.post(`${API}/items`, { data: { title: `Item ${key}`, parentId: parent.id } })).json();
  }

  const otherParent = await (await request.post(`${API}/items`, { data: { title: 'Other Parent', projectId: project.id, workphaseId: phase.id, isAttached: false } })).json();
  const otherChild = await (await request.post(`${API}/items`, { data: { title: 'Other Child', parentId: otherParent.id } })).json();
  const topLevel = await (await request.post(`${API}/items`, { data: { title: 'Top Level', projectId: project.id, workphaseId: phase.id, isAttached: false } })).json();

  return { project, workflow, phase, parent, items, otherParent, otherChild, topLevel };
}

// A parent's attached-children order, read via a DIFFERENT codepath than the
// move response itself — GET /api/items/:parentId's `children` array — so
// asserting against this is a genuine persistence/reload check (TC-3.1), not
// just trusting what PATCH .../move echoed back. Same position+createdAt
// tie-break convention as orderOf.
export async function siblingOrder(request: APIRequestContext, parentId: string): Promise<string> {
  const parentDetail = await (await request.get(`${API}/items/${parentId}`)).json();
  const children = parentDetail.children as Array<{ title: string; position: number | null; createdAt: number }>;
  return children
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt)
    .map(i => i.title.replace('Item ', ''))
    .join('');
}

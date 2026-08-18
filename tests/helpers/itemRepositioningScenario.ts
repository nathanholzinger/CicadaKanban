import type { APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3002/api';

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

  const plan: Array<{ key: keyof RepositioningScenario['items']; workphaseId: string; position: number }> = [
    { key: 'A', workphaseId: colOnePhase.id, position: 1.0 },
    { key: 'B', workphaseId: colTwoPhase.id, position: 2.0 },
    { key: 'C', workphaseId: colOnePhase.id, position: 3.0 },
    { key: 'D', workphaseId: colTwoPhase.id, position: 4.0 },
    { key: 'E', workphaseId: colOnePhase.id, position: 5.0 },
  ];

  const items = {} as RepositioningScenario['items'];
  for (const { key, workphaseId, position } of plan) {
    const created = await (await request.post(`${API}/items`, {
      data: { title: `Item ${key}`, projectId: project.id, workphaseId },
    })).json();
    await request.patch(`${API}/items/${created.id}/move`, { data: { position } });
    items[key] = { ...created, position };
  }

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
// root's (client/CLAUDE.md's "workflow inheritance" rule; see
// client/src/App.tsx:136-146). Items A/C/E belong to project1a, B/D to
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

  const plan: Array<{ key: keyof CrossProjectRepositioningScenario['items']; projectId: string; position: number }> = [
    { key: 'A', projectId: project1a.id, position: 1.0 },
    { key: 'B', projectId: project1b.id, position: 2.0 },
    { key: 'C', projectId: project1a.id, position: 3.0 },
    { key: 'D', projectId: project1b.id, position: 4.0 },
    { key: 'E', projectId: project1a.id, position: 5.0 },
  ];

  const items = {} as CrossProjectRepositioningScenario['items'];
  for (const { key, projectId, position } of plan) {
    const created = await (await request.post(`${API}/items`, {
      data: { title: `Item ${key}`, projectId, workphaseId: sharedPhase.id },
    })).json();
    await request.patch(`${API}/items/${created.id}/move`, { data: { position } });
    items[key] = { ...created, position };
  }

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
    .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt);
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

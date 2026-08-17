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

type WorkflowItemRow = { title: string; position: number; createdAt: number; workphaseId: string | null };

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

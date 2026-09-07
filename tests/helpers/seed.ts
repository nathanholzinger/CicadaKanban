import type { APIRequestContext } from '@playwright/test';
import { API } from './api';

type WorkflowTemplateName = 'flow' | 'quick';

interface SeededProject { id: string; name: string }
interface SeededWorkflow { id: string; workphases: Array<{ id: string; name: string }> }

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
  const workflow = await (await request.post(`${API}/workflows`, {
    data: { name, projectId: project.id, templateId: template.id },
  })).json();
  return { project, workflow };
}

// A workflow with no phases yet — pair with addWorkphases below to build one
// up incrementally (was createBareWorkflow in boards-layer.spec.ts).
export async function seedBareWorkflow(
  request: APIRequestContext,
  name: string,
): Promise<{ project: SeededProject; workflow: SeededWorkflow }> {
  const project = await (await request.post(`${API}/projects`, { data: { name } })).json();
  const workflow = await (await request.post(`${API}/workflows`, {
    data: { name, projectId: project.id },
  })).json();
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

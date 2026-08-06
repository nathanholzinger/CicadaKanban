import type { Workflow, WorkflowWithDetails } from '../types';
import { API } from './shared';

export async function fetchWorkflows(): Promise<Workflow[]> {
  const res = await fetch(`${API}/workflows`);
  if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function fetchWorkflow(id: string): Promise<WorkflowWithDetails> {
  const res = await fetch(`${API}/workflows/${id}`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export type CreateWorkflowInput = {
  projectId: string;
  name: string;
  templateId?: string;
  sourceWorkflowId?: string;
};

export async function createWorkflow(data: CreateWorkflowInput): Promise<WorkflowWithDetails> {
  const res = await fetch(`${API}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API}/workflows/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workflow');
}

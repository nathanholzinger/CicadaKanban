import type { CreatedWorkflow, WorkflowWithDetails } from '../types';
import type { WorkflowListResponse } from './pilotTypes';
import { apiJson, apiVoid } from './shared';

export function fetchWorkflows(): Promise<WorkflowListResponse> {
  return apiJson('/workflows', undefined, 'Failed to fetch workflows');
}

export function fetchWorkflow(id: string): Promise<WorkflowWithDetails> {
  return apiJson(`/workflows/${id}`, undefined, 'Failed to fetch workflow');
}

export type CreateWorkflowInput = {
  projectId: string;
  name: string;
  templateId?: string;
  sourceWorkflowId?: string;
};

export function createWorkflow(data: CreateWorkflowInput): Promise<CreatedWorkflow> {
  return apiJson('/workflows', { method: 'POST', body: data }, 'Failed to create workflow');
}

export function deleteWorkflow(id: string): Promise<void> {
  return apiVoid(`/workflows/${id}`, { method: 'DELETE' }, 'Failed to delete workflow');
}

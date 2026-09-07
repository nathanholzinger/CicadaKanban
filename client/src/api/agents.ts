import type { Agent } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchAgents(): Promise<Agent[]> {
  return apiJson('/agents', undefined, 'Failed to fetch agents');
}

export function createAgent(data: {
  name: string;
  claudeProjectId: string;
  surface: string;
  repoPath?: string;
  notes?: string;
}): Promise<Agent> {
  return apiJson('/agents', { method: 'POST', body: data }, 'Failed to create agent');
}

export function updateAgent(
  id: string,
  data: {
    name?: string;
    claudeProjectId?: string;
    surface?: string;
    repoPath?: string;
    notes?: string;
  },
): Promise<Agent> {
  return apiJson(`/agents/${id}`, { method: 'PUT', body: data }, 'Failed to update agent');
}

export function deleteAgent(id: string): Promise<void> {
  return apiVoid(`/agents/${id}`, { method: 'DELETE' }, 'Failed to delete agent');
}

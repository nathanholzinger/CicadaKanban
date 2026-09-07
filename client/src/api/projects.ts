import type { Project } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchProjects(): Promise<Project[]> {
  return apiJson('/projects', undefined, 'Failed to fetch projects');
}

export function createProject(data: { name: string; description?: string; parentId?: string }): Promise<Project> {
  return apiJson('/projects', { method: 'POST', body: data }, 'Failed to create project');
}

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  parentId?: string | null;
};

export function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  return apiJson(`/projects/${id}`, { method: 'PUT', body: data }, 'Failed to update project');
}

export function deleteProject(id: string): Promise<void> {
  return apiVoid(`/projects/${id}`, { method: 'DELETE' }, 'Failed to delete project');
}

export type MoveProjectInput = {
  parentId?: string | null;
  prevId?: string | null;
  nextId?: string | null;
};

// Reposition and/or reparent a single project. Never computes or sends a
// final position value — the server always resolves it against true
// current sibling data (see positionResolver.ts); prevId/nextId just name
// this project's resulting predecessor/successor, with both omitted meaning
// "append to the end," never "the scope is empty."
export function moveProject(id: string, data: MoveProjectInput): Promise<Project> {
  return apiJson(`/projects/${id}/move`, { method: 'PATCH', body: data }, 'Failed to move project');
}

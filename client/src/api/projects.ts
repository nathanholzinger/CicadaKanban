import type { Project } from '../types';
import { API } from './shared';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(data: { name: string; description?: string; parentId?: string }): Promise<Project> {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  parentId?: string | null;
};

export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  const res = await fetch(`${API}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
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
export async function moveProject(id: string, data: MoveProjectInput): Promise<Project> {
  const res = await fetch(`${API}/projects/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to move project');
  return res.json();
}

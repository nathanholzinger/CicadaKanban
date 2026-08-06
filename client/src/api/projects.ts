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

export async function reorderProjects(
  projectOrders: { id: string; parentId: string | null; position: number }[],
): Promise<void> {
  const res = await fetch(`${API}/projects/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder projects');
}

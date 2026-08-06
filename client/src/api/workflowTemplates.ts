import type { WorkflowTemplate } from '../types';
import { API } from './shared';

export async function fetchWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const res = await fetch(`${API}/workflow-templates`);
  if (!res.ok) throw new Error('Failed to fetch workflow templates');
  return res.json();
}

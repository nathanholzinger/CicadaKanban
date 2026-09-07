import type { WorkflowTemplate } from '../types';
import { apiJson } from './shared';

export function fetchWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  return apiJson('/workflow-templates', undefined, 'Failed to fetch workflow templates');
}

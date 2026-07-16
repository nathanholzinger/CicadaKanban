import type { Agent, Attachment, Workflow, WorkflowWithDetails, WorkflowTemplate, WorkPhase, ItemType, Label, Notification, Project, Item, ItemDetail, Board, BoardWithDetails, ColumnDisplayMode, ColumnRow } from './types';

const API = '/api';

// ============================================================
// Projects
// ============================================================

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(data: {
  name: string;
  description?: string;
  parentId?: string;
}): Promise<Project> {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id: string, data: { name?: string; description?: string | null; parentId?: string | null }): Promise<Project> {
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
  projectOrders: { id: string; parentId: string | null; position: number }[]
): Promise<void> {
  const res = await fetch(`${API}/projects/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder projects');
}

// ============================================================
// Workflows
// ============================================================

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

export async function createWorkflow(data: {
  projectId: string;
  name: string;
  templateId?: string;
  sourceWorkflowId?: string;
}): Promise<WorkflowWithDetails> {
  const res = await fetch(`${API}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function fetchWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const res = await fetch(`${API}/workflow-templates`);
  if (!res.ok) throw new Error('Failed to fetch workflow templates');
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API}/workflows/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workflow');
}

// ============================================================
// WorkPhases
// ============================================================

export async function createWorkPhase(data: {
  workflowId: string;
  name: string;
  triggersNotification?: boolean;
  isTerminal?: boolean;
}): Promise<WorkPhase> {
  const res = await fetch(`${API}/workphases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workphase');
  return res.json();
}

export async function updateWorkPhase(id: string, data: { name?: string }): Promise<WorkPhase> {
  const res = await fetch(`${API}/workphases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update workphase');
  return res.json();
}

// Deleting a workphase can shrink or remove board columns that covered it —
// returns that report (200) or null when nothing needed adjusting (204).
export async function deleteWorkPhase(id: string): Promise<{ shrunkColumns: ColumnRow[]; deletedColumns: ColumnRow[] } | null> {
  const res = await fetch(`${API}/workphases/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete workphase');
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function reorderWorkPhases(workphaseOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/workphases/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workphaseOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder workphases');
}

// ============================================================
// Boards
// ============================================================

export async function fetchBoards(workflowId: string): Promise<Board[]> {
  const res = await fetch(`${API}/boards?workflowId=${workflowId}`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function fetchBoard(id: string): Promise<BoardWithDetails> {
  const res = await fetch(`${API}/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(data: { workflowId: string; name: string }): Promise<Board> {
  const res = await fetch(`${API}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function updateBoard(id: string, data: { name?: string }): Promise<Board> {
  const res = await fetch(`${API}/boards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API}/boards/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete board');
  }
}

// ============================================================
// Columns
// ============================================================

export async function createColumn(data: {
  boardId: string;
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}): Promise<ColumnRow> {
  const res = await fetch(`${API}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to create column');
  }
  return res.json();
}

export async function updateColumn(id: string, data: {
  startWorkphaseId?: string;
  endWorkphaseId?: string;
  displayMode?: ColumnDisplayMode;
  name?: string | null;
}): Promise<ColumnRow> {
  const res = await fetch(`${API}/columns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to update column');
  }
  return res.json();
}

export async function reorderColumns(columnOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/columns/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder columns');
}

export async function deleteColumn(id: string): Promise<void> {
  const res = await fetch(`${API}/columns/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete column');
}

// ============================================================
// Items
// ============================================================

export async function fetchItem(id: string): Promise<ItemDetail> {
  const res = await fetch(`${API}/items/${id}`);
  if (!res.ok) throw new Error('Failed to fetch item');
  return res.json();
}

export async function createItem(data: {
  type?: string | null;
  title: string;
  projectId?: string;
  workphaseId?: string;
  parentId?: string;
  description?: string;
  assigneeType?: string;
  agentId?: string;
}): Promise<Item> {
  const res = await fetch(`${API}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateItem(
  id: string,
  data: Partial<Pick<Item, 'title' | 'description' | 'assigneeType' | 'agentId' | 'parentId'>>,
): Promise<Item> {
  const res = await fetch(`${API}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function moveItem(
  id: string,
  workphaseId: string,
  position: number,
): Promise<Item> {
  const res = await fetch(`${API}/items/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workphaseId, position }),
  });
  if (!res.ok) throw new Error('Failed to move item');
  return res.json();
}

export async function reorderItems(itemOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/items/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder items');
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API}/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

// ============================================================
// Attachments
// ============================================================

export async function fetchAttachments(itemId: string): Promise<Attachment[]> {
  const res = await fetch(`${API}/attachments/item/${itemId}`);
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}

export async function createAttachment(itemId: string, data: {
  type: string; label: string; externalUrl?: string; filePath?: string;
}): Promise<Attachment> {
  const res = await fetch(`${API}/attachments/item/${itemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create attachment');
  return res.json();
}

export async function deleteAttachment(id: string): Promise<void> {
  const res = await fetch(`${API}/attachments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete attachment');
}

// ============================================================
// Labels
// ============================================================

export async function fetchLabels(workflowId?: string): Promise<Label[]> {
  const url = workflowId ? `${API}/labels?workflowId=${workflowId}` : `${API}/labels`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch labels');
  return res.json();
}

export async function createLabel(data: { workflowId?: string; name: string; color: string }): Promise<Label> {
  const res = await fetch(`${API}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create label');
  return res.json();
}

export async function deleteLabel(id: string): Promise<void> {
  const res = await fetch(`${API}/labels/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete label');
}

export async function fetchItemLabels(itemId: string): Promise<Label[]> {
  const res = await fetch(`${API}/labels/item/${itemId}`);
  if (!res.ok) throw new Error('Failed to fetch item labels');
  return res.json();
}

export async function addLabelToItem(itemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/item/${itemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
  if (!res.ok) throw new Error('Failed to add label');
}

export async function removeLabelFromItem(itemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/item/${itemId}/${labelId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove label');
}

// ============================================================
// Notifications
// ============================================================

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark notification read');
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API}/notifications/read-all`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark all notifications read');
}

// ============================================================
// Item Types
// ============================================================

export async function fetchItemTypes(): Promise<ItemType[]> {
  const res = await fetch(`${API}/item-types`);
  if (!res.ok) throw new Error('Failed to fetch item types');
  return res.json();
}

export async function createItemType(data: { name: string; color?: string }): Promise<ItemType> {
  const res = await fetch(`${API}/item-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item type');
  return res.json();
}

export async function updateItemType(id: string, data: { name?: string; color?: string | null }): Promise<ItemType> {
  const res = await fetch(`${API}/item-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item type');
  return res.json();
}

export async function deleteItemType(id: string): Promise<void> {
  const res = await fetch(`${API}/item-types/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete item type');
  }
}

// ============================================================
// Agents
// ============================================================

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${API}/agents`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function createAgent(data: {
  name: string;
  claudeProjectId: string;
  surface: string;
  repoPath?: string;
  notes?: string;
}): Promise<Agent> {
  const res = await fetch(`${API}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create agent');
  return res.json();
}

export async function updateAgent(id: string, data: {
  name?: string;
  claudeProjectId?: string;
  surface?: string;
  repoPath?: string;
  notes?: string;
}): Promise<Agent> {
  const res = await fetch(`${API}/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update agent');
  return res.json();
}

export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`${API}/agents/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete agent');
  }
}

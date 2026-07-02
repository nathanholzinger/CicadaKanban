import type { Agent, Attachment, Board, BoardWithDetails, Column, ItemType, Label, Notification, Project, WorkItem, WorkItemDetail } from './types';

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

export async function updateProject(id: string, data: { name?: string; description?: string | null }): Promise<Project> {
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

// ============================================================
// Boards
// ============================================================

export async function fetchBoards(): Promise<Board[]> {
  const res = await fetch(`${API}/boards`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function fetchBoard(id: string): Promise<BoardWithDetails> {
  const res = await fetch(`${API}/boards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(
  name: string,
  description?: string,
  includeDefaultColumns = true,
): Promise<Board> {
  const res = await fetch(`${API}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, includeDefaultColumns }),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API}/boards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete board');
}

// ============================================================
// Work Items
// ============================================================

// ============================================================
// Columns
// ============================================================

export async function createColumn(data: {
  boardId: string;
  name: string;
  triggersNotification?: boolean;
  isTerminal?: boolean;
}): Promise<Column> {
  const res = await fetch(`${API}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create column');
  return res.json();
}

export async function updateColumn(id: string, data: { name?: string }): Promise<Column> {
  const res = await fetch(`${API}/columns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update column');
  return res.json();
}

export async function deleteColumn(id: string): Promise<void> {
  const res = await fetch(`${API}/columns/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to delete column');
  }
}

export async function reorderColumns(columnOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/columns/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder columns');
}

// ============================================================
// Work Items
// ============================================================

export async function fetchWorkItem(id: string): Promise<WorkItemDetail> {
  const res = await fetch(`${API}/work-items/${id}`);
  if (!res.ok) throw new Error('Failed to fetch work item');
  return res.json();
}

export async function createWorkItem(data: {
  type?: string | null;
  title: string;
  boardId?: string;
  columnId?: string;
  parentId?: string;
  description?: string;
  assigneeType?: string;
  agentId?: string;
}): Promise<WorkItem> {
  const res = await fetch(`${API}/work-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create work item');
  return res.json();
}

export async function updateWorkItem(
  id: string,
  data: Partial<Pick<WorkItem, 'title' | 'description' | 'assigneeType' | 'agentId' | 'parentId'>>,
): Promise<WorkItem> {
  const res = await fetch(`${API}/work-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update work item');
  return res.json();
}

export async function moveWorkItem(
  id: string,
  columnId: string,
  position: number,
): Promise<WorkItem> {
  const res = await fetch(`${API}/work-items/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnId, position }),
  });
  if (!res.ok) throw new Error('Failed to move work item');
  return res.json();
}

export async function reorderWorkItems(itemOrders: { id: string; position: number }[]): Promise<void> {
  const res = await fetch(`${API}/work-items/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemOrders }),
  });
  if (!res.ok) throw new Error('Failed to reorder work items');
}

export async function deleteWorkItem(id: string): Promise<void> {
  const res = await fetch(`${API}/work-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete work item');
}

// ============================================================
// Attachments
// ============================================================

export async function fetchAttachments(workItemId: string): Promise<Attachment[]> {
  const res = await fetch(`${API}/attachments/work-item/${workItemId}`);
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}

export async function createAttachment(workItemId: string, data: {
  type: string; label: string; externalUrl?: string; filePath?: string;
}): Promise<Attachment> {
  const res = await fetch(`${API}/attachments/work-item/${workItemId}`, {
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

export async function fetchLabels(boardId?: string): Promise<Label[]> {
  const url = boardId ? `${API}/labels?boardId=${boardId}` : `${API}/labels`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch labels');
  return res.json();
}

export async function createLabel(data: { boardId?: string; name: string; color: string }): Promise<Label> {
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

export async function fetchWorkItemLabels(workItemId: string): Promise<Label[]> {
  const res = await fetch(`${API}/labels/work-item/${workItemId}`);
  if (!res.ok) throw new Error('Failed to fetch work item labels');
  return res.json();
}

export async function addLabelToWorkItem(workItemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/work-item/${workItemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
  if (!res.ok) throw new Error('Failed to add label');
}

export async function removeLabelFromWorkItem(workItemId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API}/labels/work-item/${workItemId}/${labelId}`, { method: 'DELETE' });
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

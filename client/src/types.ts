export interface Project {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ItemType {
  id: string;
  name: string;
  color: string | null;
  createdAt: number;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Column {
  id: string;
  boardId: string;
  agentId: string | null;
  name: string;
  position: number;
  triggersNotification: number;
  isTerminal: number;
  createdAt: number;
}

export interface WorkItem {
  id: string;
  type: string | null;
  parentId: string | null;
  depth?: number;
  boardId: string | null;
  columnId: string | null;
  title: string;
  description: string | null;
  position: number | null;
  assigneeType: string | null;
  agentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BoardWithDetails extends Board {
  columns: Column[];
  workItems: WorkItem[];
}

export interface Agent {
  id: string;
  name: string;
  notes: string | null;
  claudeProjectId: string;
  surface: 'chat' | 'code' | 'cowork';
  repoPath: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityLogEntry {
  id: string;
  workItemId: string;
  type: string;
  content: string;
  metadata: string | null;
  createdAt: number;
}

export interface WorkItemDetail extends WorkItem {
  children: WorkItem[];
  activity: ActivityLogEntry[];
}

export interface Attachment {
  id: string;
  workItemId: string;
  type: 'google_doc' | 'github_file' | 'local_file' | 'export';
  label: string;
  externalUrl: string | null;
  filePath: string | null;
  metadata: string | null;
  createdAt: number;
}

export interface Label {
  id: string;
  boardId: string | null;
  name: string;
  color: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  workItemId: string | null;
  boardId: string | null;
  message: string;
  type: string;
  isRead: number;
  createdAt: number;
}

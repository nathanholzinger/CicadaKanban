export interface Project {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  position: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ItemType {
  id: string;
  name: string;
  color: string | null;
  createdAt: number;
}

export interface Workflow {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkPhase {
  id: string;
  workflowId: string;
  agentId: string | null;
  name: string;
  position: number;
  triggersNotification: number;
  isTerminal: number;
  createdAt: number;
}

export interface Item {
  id: string;
  type: string | null;
  parentId: string | null;
  depth?: number;
  projectId: string | null;
  workphaseId: string | null;
  title: string;
  description: string | null;
  position: number | null;
  assigneeType: string | null;
  agentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowWithDetails extends Workflow {
  workphases: WorkPhase[];
  items: Item[];
}

export interface WorkflowTemplatePhase {
  id: string;
  templateId: string;
  name: string;
  position: number;
  triggersNotification: number;
  isTerminal: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  workphases: WorkflowTemplatePhase[];
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
  itemId: string;
  type: string;
  content: string;
  metadata: string | null;
  createdAt: number;
}

export interface ItemDetail extends Item {
  children: Item[];
  activity: ActivityLogEntry[];
}

export interface Attachment {
  id: string;
  itemId: string;
  type: 'google_doc' | 'github_file' | 'local_file' | 'export';
  label: string;
  externalUrl: string | null;
  filePath: string | null;
  metadata: string | null;
  createdAt: number;
}

export interface Label {
  id: string;
  workflowId: string | null;
  name: string;
  color: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  itemId: string | null;
  workflowId: string | null;
  message: string;
  type: string;
  isRead: number;
  createdAt: number;
}

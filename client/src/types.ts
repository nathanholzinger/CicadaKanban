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
  name: string;
  position: number;
  triggersNotification: number;
  isTerminal: number;
  createdAt: number;
}

// Epic 3.2: derived, read-only — what an item's `position` is actually
// comparable against, computed server-side from isAttached/parentId/
// workphaseId/workphase.isTerminal (never stored). Read by
// useItemManagement.ts/UnsortedBucket.tsx to distinguish attached children
// from everything else, instead of re-deriving isAttached && parentId
// themselves. Optional because hand-built Item fixtures (tests) may omit it
// — real API responses always include it.
export type PositionScope = 'attached-siblings' | 'workflow' | 'none';

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
  positionScope?: PositionScope;
  assigneeType: string | null;
  agentId: string | null;
  isAttached: number;
  createdAt: number;
  updatedAt: number;
  // Epic 3.2 Part 6: set when this item's workphase became terminal (done);
  // null otherwise. A detached/root item with completedAt set has no
  // position — ordered by this field instead. Attached children keep their
  // position regardless of their (cascaded) workphase's status.
  completedAt: number | null;
}

export interface WorkflowWithDetails extends Workflow {
  workphases: WorkPhase[];
  items: Item[];
}

export interface Board {
  id: string;
  workflowId: string;
  name: string;
  position: number;
  showAttachedChildren: number;
  createdAt: number;
  updatedAt: number;
}

export type ColumnDisplayMode = 'merged' | 'expanded';

export interface ColumnSubRow {
  workphase: WorkPhase;
  items: Item[];
}

// Raw DB row shape — what POST /api/columns and PUT /api/columns/:id return.
// Mirrors ColumnRow in server/src/routes/columnRanges.ts
export interface ColumnRow {
  id: string;
  boardId: string;
  name: string | null;
  startWorkphaseId: string;
  endWorkphaseId: string;
  displayMode: ColumnDisplayMode;
  position: number;
  createdAt: number;
}

// Resolved shape — only GET /api/boards/:id produces the extra fields below.
export interface Column extends ColumnRow {
  displayName: string;
  broken: boolean;
  entryWorkphaseId: string;
  subRows: ColumnSubRow[];
}

export interface BoardWithDetails extends Board {
  columns: Column[];
  unsorted: {
    uncovered: ColumnSubRow[];
    invalidItems: Item[];
    needsAttention: boolean;
  };
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

// Labels are global — not scoped to a workflow.
export interface Label {
  id: string;
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

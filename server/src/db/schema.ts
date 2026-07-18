import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

// ============================================================
// Item Types (user-defined, purely descriptive)
// ============================================================

export const itemTypes = sqliteTable('item_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Workflow Templates (system-seeded blueprints, not project-scoped)
// ============================================================

export const workflowTemplates = sqliteTable('workflow_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
});

export const workflowTemplatePhases = sqliteTable('workflow_template_phases', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => workflowTemplates.id),
  name: text('name').notNull(),
  position: real('position').notNull(),
  triggersNotification: integer('triggers_notification').notNull().default(0),
  isTerminal: integer('is_terminal').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Core Tables
// ============================================================

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'),  // self-referential FK to projects.id
  name: text('name').notNull(),
  description: text('description'),
  position: real('position'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  notes: text('notes'),
  claudeProjectId: text('claude_project_id').notNull(),
  surface: text('surface').notNull(), // app-level: 'chat' | 'code' | 'cowork'
  repoPath: text('repo_path'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const workphases = sqliteTable('workphases', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id),
  name: text('name').notNull(),
  position: real('position').notNull(),
  triggersNotification: integer('triggers_notification').notNull().default(0),
  isTerminal: integer('is_terminal').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Boards & Columns (UI-layer views over a workflow's workphases)
// ============================================================

export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id),
  name: text('name').notNull(),
  position: real('position').notNull(),
  showAttachedChildren: integer('show_attached_children').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const columns = sqliteTable('columns', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id),
  name: text('name'), // nullable — falls back to a computed displayName from covered workphase(s)
  startWorkphaseId: text('start_workphase_id').notNull().references(() => workphases.id),
  endWorkphaseId: text('end_workphase_id').notNull().references(() => workphases.id),
  displayMode: text('display_mode').notNull().default('merged'), // app-level: 'merged' | 'expanded'
  position: real('position').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  // An item outlives the descriptive/positional things it points at: deleting a
  // type, workphase, or assigned agent nulls the reference rather than the item.
  type: text('type').references(() => itemTypes.id, { onDelete: 'set null' }),
  parentId: text('parent_id'),  // self-referential FK to items.id
  projectId: text('project_id').references(() => projects.id),
  workphaseId: text('workphase_id').references(() => workphases.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  position: real('position'),
  isAttached: integer('is_attached').notNull().default(1),
  assigneeType: text('assignee_type'), // app-level: 'human' | 'agent'
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ============================================================
// Labels (many-to-many with items)
// ============================================================

// Labels are global (not scoped to a workflow) — a single reusable set shared
// across every project and workflow. See .claude/plans/epic-5-decisions.md.
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const itemLabels = sqliteTable('item_labels', {
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.itemId, table.labelId] }),
]);

// ============================================================
// Chat (threads + messages for agent conversations)
// ============================================================

export const chatThreads = sqliteTable('chat_threads', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  // Interim: nulls on agent delete so agents stay deletable. Authorship should
  // eventually be a snapshot (see .claude/plans/epic-8-decisions.md).
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  label: text('label'),
  createdAt: integer('created_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // app-level: 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Attachments (references to external files / local exports)
// ============================================================

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // app-level: 'google_doc' | 'github_file' | 'local_file' | 'export'
  label: text('label').notNull(),
  externalUrl: text('external_url'),
  filePath: text('file_path'),
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Activity Log (system-generated audit trail on items)
// ============================================================

export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // app-level: 'status_change' | 'assignment' | 'attachment_added' | 'comment' | 'action_triggered'
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Notifications
// ============================================================

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  itemId: text('item_id').references(() => items.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').references(() => workflows.id),
  message: text('message').notNull(),
  type: text('type').notNull(), // app-level enum
  isRead: integer('is_read').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

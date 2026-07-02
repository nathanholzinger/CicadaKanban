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
// Core Tables
// ============================================================

export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
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

export const columns = sqliteTable('columns', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id),
  agentId: text('agent_id').references(() => agents.id),
  name: text('name').notNull(),
  position: real('position').notNull(),
  triggersNotification: integer('triggers_notification').notNull().default(0),
  isTerminal: integer('is_terminal').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

export const workItems = sqliteTable('work_items', {
  id: text('id').primaryKey(),
  type: text('type').references(() => itemTypes.id),
  parentId: text('parent_id'),  // self-referential FK to work_items.id
  boardId: text('board_id').references(() => boards.id),
  columnId: text('column_id').references(() => columns.id),
  title: text('title').notNull(),
  description: text('description'),
  position: real('position'),
  assigneeType: text('assignee_type'), // app-level: 'human' | 'agent'
  agentId: text('agent_id').references(() => agents.id),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ============================================================
// Labels (many-to-many with work items)
// ============================================================

export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  boardId: text('board_id').references(() => boards.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const workItemLabels = sqliteTable('work_item_labels', {
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  labelId: text('label_id').notNull().references(() => labels.id),
}, (table) => [
  primaryKey({ columns: [table.workItemId, table.labelId] }),
]);

// ============================================================
// Chat (threads + messages for agent conversations)
// ============================================================

export const chatThreads = sqliteTable('chat_threads', {
  id: text('id').primaryKey(),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  agentId: text('agent_id').references(() => agents.id),
  label: text('label'),
  createdAt: integer('created_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => chatThreads.id),
  role: text('role').notNull(), // app-level: 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Attachments (references to external files / local exports)
// ============================================================

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  type: text('type').notNull(), // app-level: 'google_doc' | 'github_file' | 'local_file' | 'export'
  label: text('label').notNull(),
  externalUrl: text('external_url'),
  filePath: text('file_path'),
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at').notNull(),
});

// ============================================================
// Activity Log (system-generated audit trail on work items)
// ============================================================

export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
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
  workItemId: text('work_item_id').references(() => workItems.id),
  boardId: text('board_id').references(() => boards.id),
  message: text('message').notNull(),
  type: text('type').notNull(), // app-level enum
  isRead: integer('is_read').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

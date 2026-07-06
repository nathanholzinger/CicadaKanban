# Kanban App — Project Context

## What This Is

A personal single-user Kanban board with Claude agent integration. Built for one human
user (Nathan) to track personal projects and optionally assign tasks to Claude agents
via deep links into Claude Desktop/Code projects. All Claude usage stays within the
native claude.ai interface — no Anthropic API billing.

---

## Architecture

### Stack
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 (`client/`)
- **Database:** SQLite via Drizzle ORM (`server/data/kanban.db`)
- **Drag and drop:** @dnd-kit/core + @dnd-kit/sortable
- **MCP:** Model Context Protocol server (`server/src/mcp.ts`) — 8 tools wrapping the
  REST API, used by external Claude agents

### Key Decisions
- **SQLite** chosen for local simplicity. Drizzle ORM makes a future Postgres migration
  clean. Foreign keys enabled via `PRAGMA foreign_keys = ON` in `server/src/db/index.ts`.
- **Projects are the root entity.** Workflows belong to projects. Items derive their
  workflow through `column → workflow` — there is no `board_id` on items.
- **Workflow inheritance:** A project with no workflow inherits from its nearest ancestor
  that has one. Computed at runtime in `client/src/App.tsx`.
- **Single user:** No auth system. App runs locally on `localhost`.
- **No API billing:** Claude integration uses deep links (`claude://...`) and the local
  MCP server — no calls to the Anthropic API.

---

## Data Model

All tables defined in `server/src/db/schema.ts`.

### Core Hierarchy
```
projects (tree — unlimited depth via parent_id self-ref)
  └── workflows  (one per project, or inherited from parent)
        └── columns  (stages — position REAL NOT NULL)
              └── items  (cards — also a tree via parent_id; position REAL nullable)
```

### Full Table List

| Table | Purpose |
|---|---|
| `projects` | Hierarchical folders — `id, parent_id, name, description, position, created_at, updated_at` |
| `workflows` | Kanban stage sets — `id, project_id, name, description, created_at, updated_at` |
| `workflow_templates` | System-seeded blueprints ("quick", "flow") — read-only in MVP |
| `workflow_template_columns` | Columns for each template |
| `columns` | Workflow stages — `id, workflow_id, agent_id?, name, position, triggers_notification, is_terminal, created_at` |
| `items` | Kanban cards — `id, type?, parent_id?, project_id, column_id?, title, description?, position?, assignee_type?, agent_id?, created_at, updated_at` |
| `item_types` | Descriptive labels: Epic, Story, Task (seeded). FK target for `items.type`. |
| `agents` | Claude agent registrations — `claude_project_id`, `surface` (chat/code/cowork), `repo_path` |
| `labels` | Flat tags scoped to a workflow (will be replaced by tag buckets in Epic 5) |
| `item_labels` | Many-to-many join: item ↔ label |
| `chat_threads` | Agent conversation threads per item (schema only — no API/UI yet) |
| `chat_messages` | Messages within a thread (schema only — no API/UI yet) |
| `attachments` | External file links per item (schema only — no UI yet) |
| `activity_log` | Audit trail on items: status changes, assignments, comments |
| `notifications` | Created when item moves to a `triggers_notification` column; polled by frontend |

### Position Field Pattern
`columns.position` is `REAL NOT NULL`. `items.position` and `projects.position` are
`REAL` (nullable — null means unordered). Ordering uses the midpoint strategy:
inserting between 2.0 and 3.0 → 1.5. New items go at `max(existing) + 1.0`.

---

## API Routes

Base URL: `http://localhost:3001`

| Prefix | Owns |
|---|---|
| `GET /api/health` | Health check |
| `/api/projects` | Project CRUD + hierarchy reorder (`PATCH /reorder`) |
| `/api/workflows` | Workflow CRUD + full detail (`GET /:id` returns columns + items) |
| `/api/workflow-templates` | Read-only system templates |
| `/api/columns` | Column CRUD + reorder |
| `/api/items` | Item CRUD + move (`PATCH /:id/move`) + reorder + comments (`POST /:id/comments`) |
| `/api/agents` | Agent CRUD |
| `/api/notifications` | Mark read (`PATCH /:id/read`), mark all read (`PATCH /read-all`) |
| `/api/labels` | Label CRUD (workflow-scoped) |
| `/api/attachments` | Attachment CRUD |
| `/api/item-types` | Item type CRUD |
| `/api/test` | Reset + seed DB — only when `ENABLE_TEST_ROUTES=true` |

---

## File Structure

```
KanbanApp/
├── .mcp.json                    ← MCP server config (points to server/src/mcp.ts)
├── .claude/
│   ├── guides/                  ← codebase-walkthrough.md, audit docs
│   ├── personas/                ← architect.md, coder.md, test-planner.md, auditor.md
│   └── checklists/              ← epic-done.md
├── server/
│   ├── .env                     ← HOST, PORT, DB_PATH
│   ├── drizzle/                 ← generated migration SQL files (0000–0004)
│   ├── data/kanban.db           ← SQLite database
│   └── src/
│       ├── index.ts             ← Express entry point, route mounting
│       ├── mcp.ts               ← MCP server (8 tools, calls :3001 API)
│       ├── db/
│       │   ├── schema.ts        ← Drizzle table definitions (source of truth)
│       │   ├── index.ts         ← DB connection (foreign keys enabled)
│       │   └── runMigrations.ts ← migration runner + seed
│       └── routes/              ← one file per route prefix
├── client/
│   ├── CLAUDE.md                ← you are here
│   ├── vite.config.ts           ← Tailwind plugin + /api proxy to :3001
│   └── src/
│       ├── App.tsx              ← state root, layout, workflow inheritance
│       ├── types.ts             ← TypeScript interfaces (manually synced with schema)
│       ├── api.ts               ← fetch wrappers for all endpoints
│       └── components/
│           ├── ProjectSidebar.tsx    ← project tree + dnd-kit drag reorder
│           ├── ProjectPage.tsx       ← project detail (overview + board tabs)
│           ├── WorkflowView.tsx      ← kanban board (columns + cards)
│           ├── KanbanColumn.tsx      ← droppable column
│           ├── KanbanCard.tsx        ← draggable card
│           ├── ItemDetailPanel.tsx   ← slide-in item detail
│           ├── SetupWorkflowModal.tsx
│           ├── CreateProjectModal.tsx
│           └── AgentsModal.tsx
├── tests/                       ← Playwright E2E (7 spec files, ~45 tests)
│   ├── api/                     ← REST endpoint tests via Playwright request fixture
│   └── ui/                      ← browser interaction tests
└── bruno/                       ← saved HTTP requests (manual API testing)
```

---

## Running the App

```powershell
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

- Frontend: `http://localhost:5174`
- API: `http://localhost:3001`
- Drizzle Studio (DB browser): `cd server && npm run db:studio`
- E2E tests: `npm run test:e2e` (from project root)

---

## Known Issues / Open Items

- `items.ts` delete route only recurses one level (grandchildren become orphaned). Fix
  planned before Epic 2.
- `client/src/types.ts` — `ActivityLogEntry.workItemId`, `Attachment.workItemId`, and
  `Notification.workItemId` should be `itemId` (stale from pre-rename era). Dormant
  bug — fix before any code accesses these fields.
- `workflows.projectId` is nullable — query `SELECT * FROM workflows WHERE project_id
  IS NULL` to check for orphaned workflows.
- No WebSocket/SSE — notifications polled every 15s. Fine for single-user local use.

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
  workflow through `workphase → workflow` — there is no `workflow_id` on items directly.
- **Workflow inheritance:** A project with no workflow inherits from its nearest ancestor
  that has one. Computed at runtime in `client/src/App.tsx`.
- **A workflow is a flat, ordered list of workphases** (data layer — an item sits in
  exactly one). **Boards are a separate UI layer**: a board's columns each cover a
  contiguous range of workphases (by position), with a `merged` (one swimlane) or
  `expanded` (each workphase its own sub-row) display mode. This lets different boards
  show the same workflow at different levels of granularity. See Epic 2 in
  `.claude/guides/codebase-walkthrough.md` for the full design rationale.
- **Single user:** No auth system. App runs locally on `localhost`.
- **No API billing:** Claude integration uses deep links (`claude://...`) and the local
  MCP server — no calls to the Anthropic API.
- **Error handling:** a global Express error middleware (registered last in
  `server/src/index.ts`) is the backstop — logs the real error, returns
  `500 { error: 'Internal server error' }`. Multi-step mutations (board bootstrap,
  delete cascades, workphase-delete column shrink) run inside `db.transaction()`.
- **Boards → project-owned (decided 2026-07-15, lands in Epic 7):** boards will be
  rescoped from workflow-owned to project-owned, paired with URL routing
  (`/projects/:id`, `/board/:id`, `/items/:id`). Until then the code below reflects
  workflow-owned boards. See Epic 7 openers in `.claude/plans/mvp-roadmap.md`.

---

## Data Model

All tables defined in `server/src/db/schema.ts`.

### Core Hierarchy
```
projects (tree — unlimited depth via parent_id self-ref)
  └── workflows   (one per project, or inherited from parent)
        ├── workphases  (data layer: flat ordered stages — position REAL NOT NULL)
        │     └── items (also a tree via parent_id; position REAL nullable)
        └── boards       (UI layer: named views of the workflow)
              └── columns  (each covers a contiguous range of workphases)
```

### Full Table List

| Table | Purpose |
|---|---|
| `projects` | Hierarchical folders — `id, parent_id, name, description, position, created_at, updated_at` |
| `workflows` | Kanban stage sets — `id, project_id, name, description, created_at, updated_at` |
| `workflow_templates` | System-seeded blueprints ("quick", "flow") — read-only in MVP |
| `workflow_template_phases` | Phases for each template |
| `workphases` | Workflow stages (data layer) — `id, workflow_id, name, position, triggers_notification, is_terminal, created_at` |
| `boards` | Named views of a workflow (UI layer) — `id, workflow_id, name, position, created_at, updated_at` |
| `columns` | A board's columns — `id, board_id, name?, start_workphase_id, end_workphase_id, display_mode, position, created_at`. `name` is nullable and falls back to the covered workphase(s)' own name(s) |
| `items` | Kanban cards — `id, type?, parent_id?, project_id, workphase_id?, title, description?, position?, assignee_type?, agent_id?, created_at, updated_at` |
| `item_types` | Descriptive labels: Epic, Story, Task (seeded). FK target for `items.type`. |
| `agents` | Claude agent registrations — `claude_project_id`, `surface` (chat/code/cowork), `repo_path` |
| `labels` | Flat global tags — a single reusable set shared across all projects/workflows (will be replaced by tag buckets in Epic 5) |
| `item_labels` | Many-to-many join: item ↔ label |
| `chat_threads` | Agent conversation threads per item (schema only — no API/UI yet) |
| `chat_messages` | Messages within a thread (schema only — no API/UI yet) |
| `attachments` | External file links per item (schema only — no UI yet) |
| `activity_log` | Audit trail on items: status changes, assignments, comments |
| `notifications` | Created when item moves to a `triggers_notification` workphase; polled by frontend |

### Position Field Pattern
`workphases.position` and `columns.position` are `REAL NOT NULL`. `items.position` and
`projects.position` are `REAL` (nullable — null means unordered). Ordering uses the
midpoint strategy: inserting between 2.0 and 3.0 → 1.5. New rows go at `max(existing) + 1.0`.

### Boards, Columns, and Unsorted (Epic 2)
- A board's column range is defined by `start_workphase_id`/`end_workphase_id` — the
  covered set is computed at read time from the workflow's current workphase *positions*
  (ranks), not stored. This means adding/reordering workphases never requires a column
  migration.
- **Unsorted** is a computed bucket (not a DB row) returned by `GET /api/boards/:id` —
  any workphase not covered by any column on that board, plus items with a null/dangling
  `workphase_id`. A new workphase always lands in Unsorted until a column's range is
  extended (or a new column added) to cover it — it never auto-joins an existing column.
- **Broken columns**: if an out-of-band workphase reorder inverts a column's start/end
  order, the column is flagged `broken` (derived every read, never stored) — it keeps
  showing its covered items but rejects new drops until its range is fixed.
- Every workflow always has at least one board (auto-bootstrapped 1:1 with its current
  workphases on workflow creation, and backfilled for pre-existing workflows via
  `runMigrations.ts`). Creating an additional board also bootstraps it 1:1 for immediate
  usability.
- Items never reference a board or column directly — boards/columns are a pure
  presentation layer over `items.workphase_id`. MCP tools operate at the workphase level
  and are unaffected by this layer.

---

## API Routes

Base URL: `http://localhost:3001`

| Prefix | Owns |
|---|---|
| `GET /api/health` | Health check |
| `/api/projects` | Project CRUD + hierarchy reorder (`PATCH /reorder`) |
| `/api/workflows` | Workflow CRUD + full detail (`GET /:id` returns workphases + items) |
| `/api/workflow-templates` | Read-only system templates |
| `/api/workphases` | Workphase CRUD + reorder |
| `/api/boards` | Board CRUD (`GET /:id` returns resolved columns + Unsorted) |
| `/api/columns` | Column CRUD + reorder (range validation: direction, no overlap) |
| `/api/items` | Item CRUD + move (`PATCH /:id/move`) + reorder + comments (`POST /:id/comments`) |
| `/api/agents` | Agent CRUD |
| `/api/notifications` | Mark read (`PATCH /:id/read`), mark all read (`PATCH /read-all`) |
| `/api/labels` | Label CRUD (global) |
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
│   ├── drizzle/                 ← migration SQL files (0000–0006)
│   ├── data/kanban.db           ← SQLite database
│   └── src/
│       ├── index.ts             ← Express entry point, route mounting, global error middleware (registered last)
│       ├── mcp.ts               ← MCP server (8 tools, calls :3001 API)
│       ├── db/
│       │   ├── schema.ts        ← Drizzle table definitions (source of truth)
│       │   ├── index.ts         ← DB connection (foreign keys enabled)
│       │   └── runMigrations.ts ← migration runner + seed + board backfill
│       ├── lib/                 ← shared domain logic (routes import from lib/, never from each other)
│       │   ├── columnRanges.ts  ← rank map, range coverage/overlap/broken, getOrderedWorkphases, shrink-on-workphase-delete
│       │   ├── workflowItems.ts ← getWorkflowItems (items in any of a workflow's workphases)
│       │   ├── boardCascade.ts  ← deleteBoardsById (transactional columns→boards delete, used by 3 delete paths)
│       │   └── getOrNotFound.ts ← fetch-single-entity-or-404 helper (used across all route files)
│       └── routes/              ← one file per route prefix (boards.ts, columns.ts, workphases.ts, ...)
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
│           ├── BoardView.tsx         ← board orchestration: loads active board, composes hooks, renders DnD board
│           ├── BoardToolbar.tsx      ← board switcher + board create/rename/delete, add-column/manage-workphases entry points
│           ├── WorkphaseManagerPanel.tsx ← workphase rename/delete/add rows + column-shrink notices
│           ├── BoardColumn.tsx       ← droppable column (merged or per-workphase expanded sub-rows)
│           ├── UnsortedBucket.tsx    ← uncovered-workphase items, drag-source only
│           ├── ColumnEditorModal.tsx ← range picker (start/end workphase, display mode)
│           ├── KanbanCard.tsx        ← draggable card
│           ├── ItemDetailPanel.tsx   ← slide-in item detail
│           ├── ModalShell.tsx        ← shared modal chrome (backdrop, header, footer, Esc) — all centered modals wrap this
│           ├── SetupWorkflowModal.tsx
│           ├── CreateProjectModal.tsx
│           ├── AgentsModal.tsx
│           └── workflow/             ← useBoardManagement, useColumnManagement, useWorkphaseManagement, useItemManagement, useBoardDnd (all drag logic)
├── tests/                       ← Playwright E2E
│   ├── api/                     ← REST endpoint tests via Playwright request fixture
│   └── ui/                      ← browser interaction tests (boards.spec.ts, boards-layer.spec.ts, ...)
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

- `workflows.projectId` is nullable — query `SELECT * FROM workflows WHERE project_id
  IS NULL` to check for orphaned workflows.
- No WebSocket/SSE — notifications polled every 15s. Fine for single-user local use.
- Cascade-deleting a workflow/project still has two independent hand-rolled
  implementations (`routes/workflows.ts` DELETE and `routes/projects.ts`'s
  `deleteProjectById`). The **board+columns portion** now goes through the shared
  `lib/boardCascade.ts`, but the item/workphase cleanup order is still duplicated —
  a change to one (e.g. adding a new dependent table) must be mirrored in the other.
- `npm audit` in `server/`: 4 moderate findings (esbuild dev-server advisories reached
  via drizzle-kit's bundled loader). Accepted, not fixed — `npm audit fix --force`
  would downgrade drizzle-kit to 0.18.1. Dev-tooling only; no production exposure for
  a localhost single-user app. Revisit on the next drizzle-kit major upgrade.

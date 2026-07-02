# Kanban App — Project Context

## What This Is
A personal single-user Kanban board with Claude agent integration. Built for one human user (Nathan) to track personal projects and optionally assign tasks to Claude agents via deep links into Claude Desktop/Code projects. All Claude usage stays within the native claude.ai interface — no API billing.

---

## Architecture Decisions

### Stack
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4 (`client/`)
- **Database:** SQLite via Drizzle ORM (`server/data/kanban.db`)
- **Drag and drop:** @dnd-kit/core + @dnd-kit/sortable

### Key Decisions Made
- **SQLite** chosen over Postgres for simplicity. Migration path to Postgres is clean (Drizzle handles it). Use `PRAGMA foreign_keys = ON` — enabled in `server/src/db/index.ts`.
- **Type enums:** `work_items.type` uses a **lookup table** (`work_item_types`) with a FK reference for DB-level enforcement. Other type fields (`attachments.type`, `activity_log.type`, etc.) are **application-level only** — TypeScript union types, no DB constraint.
- **Column behavior** driven by boolean flags (`is_terminal`, `triggers_notification`) rather than a type enum. Columns can also have an optional `agent_id` FK for "agent column" workflows.
- **No API billing:** The app does not make Anthropic API calls. Agent integration works via `claude://` deep links into Claude Desktop projects. MCP server (not yet built) will allow Claude to write back to the board.
- **Single user:** No auth system. App runs locally on `localhost`.

### Claude Integration Design (not yet built)
- Cards/columns can be associated with an **Agent** record, which stores a `claude_project_id` (UUID from the claude.ai project URL) and `surface` (chat | code | cowork).
- Action buttons on cards will construct deep links: `claude://claude.ai/project/{claude_project_id}` or `claude://code/new?q=...&folder={repo_path}`
- A **local MCP server** (to be built) will expose tools like `update_card_status`, `add_artifact`, `move_to_review` so Claude can write back to the board without API calls.
- Outbound: deep links from the Kanban app → Claude. Inbound: MCP tools from Claude → the Kanban board.

---

## Data Model

All tables defined in `server/src/db/schema.ts`.

### Lookup Tables (DB-enforced via FK)
- **work_item_types** — `type TEXT PK`. Seeded with `epic`, `story`, `task`.

### Core Tables
- **boards** — `id, name, description?, created_at, updated_at`
- **columns** — `id, board_id→boards, agent_id?→agents, name, position (float), triggers_notification (0|1), is_terminal (0|1), created_at`
- **work_items** — `id, type→work_item_types, parent_id?→work_items (self-ref), board_id?→boards, column_id?→columns, title, description?, position (float), assignee_type? (human|agent), agent_id?→agents, created_at, updated_at`
- **agents** — `id, name, notes?, claude_project_id, surface (chat|code|cowork), repo_path?, created_at, updated_at`
- **labels** — `id, board_id?→boards, name, color, created_at`
- **work_item_labels** — `work_item_id→work_items, label_id→labels` (composite PK)
- **chat_threads** — `id, work_item_id→work_items, agent_id?→agents, label?, created_at`
- **chat_messages** — `id, thread_id→chat_threads, role (user|assistant), content, created_at`
- **attachments** — `id, work_item_id→work_items, type (app-level: google_doc|github_file|local_file|export), label, external_url?, file_path?, metadata? JSON, created_at`
- **activity_log** — `id, work_item_id→work_items, type (app-level: status_change|assignment|attachment_added|comment|action_triggered), content, metadata? JSON, created_at`
- **notifications** — `id, work_item_id?→work_items, board_id?→boards, message, type, is_read (0|1), created_at`

### Position Field Pattern
Columns and work_items use a `position REAL` field for drag-and-drop ordering. Inserting between two items uses the midpoint (e.g. between 1.0 and 2.0 → 1.5), avoiding full reindexes.

---

## API Routes

Base URL: `http://localhost:3001`

### Boards (`/api/boards`)
- `GET /` — list all boards
- `GET /:id` — board with columns and work items
- `POST /` — create board (body: `{ name, description?, includeDefaultColumns? }`)
- `PUT /:id` — update name/description
- `DELETE /:id` — delete board and all contents

### Columns (`/api/columns`)
- `POST /` — create column (body: `{ boardId, name, agentId?, triggersNotification?, isTerminal? }`)
- `PUT /:id` — update column
- `PATCH /reorder` — batch reorder (body: `{ columnOrders: [{ id, position }] }`)
- `DELETE /:id` — delete (blocked if column has items)

### Work Items (`/api/work-items`)
- `GET /:id` — item with children + activity log
- `POST /` — create (body: `{ type, title, boardId?, columnId?, parentId?, description?, assigneeType?, agentId? }`)
- `PUT /:id` — update details
- `PATCH /:id/move` — drag-and-drop move (body: `{ columnId, position }`)
- `PATCH /reorder` — batch reorder (body: `{ itemOrders: [{ id, position }] }`)
- `DELETE /:id` — delete with children

---

## File Structure

```
KanbanApp/
├── CLAUDE.md                        ← you are here
├── server/
│   ├── .env                         ← HOST, PORT, DB_PATH
│   ├── package.json                 ← "type": "module", tsx dev script
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── drizzle/                     ← generated migration SQL files
│   ├── data/
│   │   └── kanban.db                ← SQLite database file
│   └── src/
│       ├── index.ts                 ← Express entry point
│       ├── db/
│       │   ├── schema.ts            ← Drizzle table definitions
│       │   ├── index.ts             ← DB connection (foreign keys enabled)
│       │   └── migrate.ts           ← migration runner + seed
│       └── routes/
│           ├── boards.ts
│           ├── columns.ts
│           └── workItems.ts
└── client/
    ├── package.json
    ├── vite.config.ts               ← Tailwind plugin + /api proxy to :3001
    └── src/
        ├── index.css                ← @import "tailwindcss" only
        ├── main.tsx
        ├── App.tsx                  ← board selector + top nav
        ├── types.ts                 ← shared TypeScript interfaces
        ├── api.ts                   ← fetch wrappers for all endpoints
        └── components/
            ├── BoardView.tsx        ← DndContext + column layout
            ├── KanbanColumn.tsx     ← droppable column + inline card creation
            └── KanbanCard.tsx       ← draggable card with type badge
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

Frontend: `http://localhost:5173`
API: `http://localhost:3001`
Drizzle Studio (DB browser): `cd server && npm run db:studio`

---

## Known Issues / TODOs in Code

- `workItems.ts` route has a `// TODO: check if the new column triggers a notification` comment in `PATCH /:id/move` — notification creation is not yet wired up.
- Card delete in `routes/workItems.ts` only goes one level deep (deletes children but not grandchildren recursively).
- No error boundary in React — unhandled fetch failures will silently fail.
- `parent_id` on `work_items` is not enforced as a FK by Drizzle due to SQLite self-referential FK limitations — enforced at application level only.

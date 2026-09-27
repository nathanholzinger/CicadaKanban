# Codebase Walkthrough — Cicada Kanban

> Frozen snapshot as of Epic 2 complete (2026-07-15) — boards layer + post-epic
> audit fixes. This file covers Epics 1–2 only and is no longer updated;
> later epics get their own `epic{n}-codebase-walkthrough.md` file, created
> during that epic's Orientation Checkpoint (see `.claude/guides/epic-done-checklist.md`).

## How to Run

```powershell
# Terminal 1 — backend (port 3001)
cd server; npm run dev

# Terminal 2 — frontend (port 5174)
cd client; npm run dev
```

- Frontend: http://localhost:5174
- API: http://localhost:3001
- DB browser: `cd server; npm run db:studio`
- E2E tests: `npm run test:e2e` (from project root)
- Unit tests: `npm run test:unit` (from project root)

---

## Architecture Overview

```
┌────────────────────────────────┐
│  Browser (React / Vite)        │  :5174
│  client/src/                   │
│  ├── App.tsx   (state root)    │
│  ├── api.ts    (fetch layer)   │
│  └── components/               │
└──────────────┬─────────────────┘
               │  /api/* proxied by Vite dev server
               ▼
┌────────────────────────────────┐
│  Express Server                │  :3001
│  server/src/index.ts           │
│  13 route files + src/lib/     │
└──────────────┬─────────────────┘
               │  Drizzle ORM (better-sqlite3)
               ▼
┌────────────────────────────────┐
│  SQLite database               │
│  server/data/kanban.db         │
└────────────────────────────────┘

External Claude agents
     │  stdio  (Model Context Protocol)
     ▼
┌────────────────────────────────┐
│  MCP server                    │
│  server/src/mcp.ts             │
│  8 tools — calls :3001 API     │
└────────────────────────────────┘
```

**How the pieces fit:**

- Vite proxies `/api/*` to port 3001, so client code just calls `/api/projects` with no
  hardcoded port. This is configured in `client/vite.config.ts`.
- The MCP server is a **separate process** from the Express server. It speaks the
  [Model Context Protocol](https://modelcontextprotocol.io) over stdio and internally
  makes HTTP requests to `localhost:3001`. The Express server must be running for MCP
  tools to work.
- **Bruno** (`/bruno/`) is a collection of saved HTTP requests — think of it as a
  lightweight Postman. Useful for manually hitting individual API endpoints without
  running the full frontend.
- **Playwright tests** (`/tests/`) spin up their own Express instance on port 3002 and
  their own Vite client on port 5174, using a separate test database (`test.db`). Your
  dev data in `kanban.db` is never touched by tests.

---

## Data Model Tour

All tables are defined in `server/src/db/schema.ts`. Drizzle ORM translates the
TypeScript column definitions into SQL — that file is the source of truth.

Think of this like fixture data structures in a test suite: understanding what each
table stores and how they relate is the foundation for understanding everything else.

### The Core Hierarchy

```
projects (tree — unlimited depth)
  └── workflows  (one per project, or inherited from parent)
        ├── workphases  (data layer — ordered stages: Todo → In Progress → Done)
        │     └── items  (cards — also a tree, unlimited depth)
        └── boards      (UI layer — named views of the workflow)
              └── columns  (each covers a contiguous range of workphases)
```

### Table Reference

**`projects`**
The top-level folders shown in the left sidebar. Supports unlimited nesting via a
`parent_id` that self-references the same table. `position REAL` (nullable) controls
sidebar order within a level.

**`workflows`**
Define the stages items move through. Each project can own one workflow, or inherit
one from its nearest ancestor. `project_id` links back to `projects` (nullable —
allowing workflows not yet associated with a project, though this case isn't surfaced
in the current UI).

**`workphases`**
The stages within a workflow (e.g., "Todo", "In Progress", "Done"). Key flags:
- `triggers_notification` (0|1): moving an item here creates a `notifications` row
- `is_terminal` (0|1): marks a "done" state — UI applies distinct styling
- `agent_id` (nullable FK): reserved for future "auto-assign to agent" behavior
- `position REAL NOT NULL`: ordering is mandatory for workphases (unlike items/projects)

**`boards`** *(Epic 2)*
Named views of a workflow — the UI layer over the workphase data layer. Every workflow
always has at least one board (auto-bootstrapped 1:1 with its workphases on creation,
backfilled for pre-existing workflows by `runMigrations.ts`). Items never reference a
board — boards are pure presentation over `items.workphase_id`, which is why the MCP
tools are unaffected by this layer.

**`columns`** *(Epic 2)*
A board's columns. Each covers a **contiguous range** of workphases via
`start_workphase_id` / `end_workphase_id` — the covered set is computed at read time
from current workphase *positions* (ranks), never stored, so reordering workphases never
requires a column migration. `display_mode`: `merged` (one swimlane) or `expanded` (one
sub-row per covered workphase). `name` is nullable — falls back to the covered
workphases' names. Two derived-at-read concepts: **broken** (a reorder inverted the
range — shown but rejects drops until fixed) and **Unsorted** (any workphase not covered
by any column, plus items with null/dangling `workphase_id` — a computed bucket, not a row).

**`items`**
The kanban cards. Can be nested (child items via `parent_id` self-reference). Key fields:
- `workphase_id` (nullable): which stage this item is in — null means "in project, not on board"
- `project_id`: which project owns this item
- `type` (nullable FK → `item_types`): Epic, Story, Task — purely descriptive, no behavior
- `assignee_type` / `agent_id`: human or Claude agent assignment
- `position REAL` (nullable): float ordering within a workphase

**`item_types`**
User-defined descriptive labels (Epic, Story, Task seeded on startup). Just name +
color — no workflow behavior is attached to a type.

**`agents`**
Registered Claude agents. Stores `claude_project_id` (the UUID from the claude.ai
project URL) and `surface` (chat | code | cowork). The app uses these to build deep
links that open Claude directly to the right project. `repo_path` is for Claude Code
agents. Does not make any Anthropic API calls — deep links only.

**`workflow_templates`** + **`workflow_template_phases`**
System-seeded read-only blueprints: "quick" (Todo → Done) and "flow"
(Todo → In Progress → Review → Done). Used when creating a new workflow.

**`labels`** + **`item_labels`**
Flat tagging system. Labels are scoped to a workflow; `item_labels` is the many-to-many
join table. This will be replaced by a tag bucket system in Epic 5.

**`chat_threads`** + **`chat_messages`**
Schema reserved for future agent conversation history attached to items. No API routes
or UI yet — coming in Epic 7.

**`attachments`**
External file links (Google Docs, GitHub files, local paths). Schema exists; UI coming
in Epic 7.

**`activity_log`**
System-generated audit trail. Every status change, assignment, and comment writes a row
here. Types: `status_change`, `assignment`, `attachment_added`, `comment`,
`action_triggered`. The item detail panel surfaces this as a timeline.

**`notifications`**
Created automatically when an item moves into a workphase with `triggers_notification = 1`.
The frontend polls for unread notifications every 15 seconds and shows them in the
header bell icon.

---

## Server Tour

**Entry point:** `server/src/index.ts`
Runs migrations on startup, mounts 13 route files, guards test routes behind the
`ENABLE_TEST_ROUTES=true` env var, and registers a **global error-handling middleware
last** — the backstop for any route that throws or rejects (logs the real error, returns
`500 { error: 'Internal server error' }`). Route-level try/catch survives only where it
adds a more specific message (e.g. project delete).

API base: `http://localhost:3001/api`

| Prefix | File | Owns |
|---|---|---|
| `/projects` | `routes/projects.ts` | Project CRUD, hierarchy, position reorder |
| `/workflows` | `routes/workflows.ts` | Workflow CRUD, fetch with workphases+items |
| `/workflow-templates` | `routes/workflowTemplates.ts` | Read-only system templates |
| `/workphases` | `routes/workphases.ts` | Workphase CRUD, position reorder |
| `/boards` | `routes/boards.ts` | Board CRUD; `GET /:id` resolves columns + Unsorted |
| `/columns` | `routes/columns.ts` | Column CRUD, reorder (validated: string ids, finite positions, all ids must exist), range validation |
| `/items` | `routes/items.ts` | Item CRUD, move (workphase change), reorder, comments |
| `/agents` | `routes/agents.ts` | Agent CRUD |
| `/notifications` | `routes/notifications.ts` | Mark read, mark all read |
| `/labels` | `routes/labels.ts` | Label CRUD (scoped to workflow) |
| `/attachments` | `routes/attachments.ts` | Attachment CRUD |
| `/item-types` | `routes/itemTypes.ts` | Item type CRUD |
| `/test` | `routes/testHelpers.ts` | Reset + seed DB (test env only) |

### Shared Domain Logic: `server/src/lib/`

Extracted after the Epic 2 audit so route files stop importing from each other. Routes
import from `lib/`; `lib/` never imports from routes.

| File | Owns |
|---|---|
| `lib/columnRanges.ts` | Column-range domain logic: `buildRankMap`, `computeColumnRange`, `isColumnBroken`, `getCoveredWorkphases`, `columnsOverlap`, `computeUnsorted` (pure — unit-tested directly), plus `getOrderedWorkphases(workflowId)` (fetch + rank map in one call) and `shrinkColumnsForDeletedWorkphase` (repoints/deletes column ranges when a workphase is deleted; accepts a `tx` handle) |
| `lib/workflowItems.ts` | `getWorkflowItems(workphases)` — all items sitting in any of a workflow's workphases (shared by boards + workflows `GET /:id`) |
| `lib/boardCascade.ts` | `deleteBoardsById(ids)` — transactional columns-then-boards delete, shared by the boards, workflows, and projects delete paths |
| `lib/getOrNotFound.ts` | `getOrNotFound(row, res, msg)` — the fetch-single-entity-or-404 idiom, used across every route file |

### Shared Patterns

**Position ordering** — Items, workphases, and projects are ordered by a `position REAL`
float. The midpoint strategy: inserting between 2.0 and 3.0 gives 2.5, avoiding a full
reindex on every drag. New items go at `max(existing) + 1.0`. Batch reorders arrive as
`PATCH /reorder` with `[{ id, position }]`. Queries sort by `position ASC`.

**Activity logging** — `routes/items.ts` has a `logActivity(itemId, type, content,
metadata?)` helper (lines 9–23) called from create, update, move, and comment
operations. Writes synchronously to `activity_log` — SQLite is fast enough locally.

**Notification creation** — When an item moves into a workphase with
`triggers_notification = 1`, the items route inserts a `notifications` row inline.
No background job — synchronous SQLite insert.

**Transactions** — Multi-step mutations are wrapped in `db.transaction()` (free with
better-sqlite3's synchronous driver): board bootstrap (`createDefaultBoard`), the
board+columns delete cascade (`deleteBoardsById`), and workphase delete + column shrink.
A failure mid-sequence rolls back rather than leaving partial state.

**Workphase delete reports column fallout** — `DELETE /api/workphases/:id` is the one
DELETE that doesn't always return a bare 204: if removing the workphase shrank or
deleted board columns, it returns `200 { shrunkColumns, deletedColumns }`, which the
client surfaces as a notice in the workphase manager panel.

**MCP server** (`server/src/mcp.ts`) — A separate process, not part of Express. It has
no direct DB access; it calls the same Express API endpoints the browser does. 8 tools:
`list_projects`, `list_workflows`, `get_workflow`, `get_item`, `create_item`,
`update_item`, `move_item`, `add_item_comment`. The `move_item` tool is the most complex:
it fetches the item, fetches the workflow to get existing workphase items, then calculates
a position before calling `PATCH /items/:id/move`.

---

## Client Tour

### State Root: `App.tsx`

`client/src/App.tsx` is the entire app's state root. If you're wondering "where does
that data come from?", the answer is almost always App.tsx.

State it owns:
- `projects: Project[]` — all projects, fetched once on mount
- `workflows: Workflow[]` — all workflows, fetched once on mount
- `notifications: Notification[]` — polled every 15 seconds
- `selectedProjectId: string | null` — persisted to `localStorage` across reloads
- `showAgentsModal`, `showCreateProjectModal` — modal visibility flags

App.tsx also computes `effectiveWorkflow` on every render — the "which workflow applies
to this project" logic (see Workflow Inheritance below).

### The Fetch Layer: `api.ts`

`client/src/api.ts` is a flat file of named `async function` wrappers around `fetch()`.
Every component that needs to talk to the server imports from here:

```typescript
const projects = await fetchProjects();
const created = await createProject({ name, description, parentId });
```

No global fetch client, no interceptors, no caching — just straightforward async
functions that `throw` on non-2xx responses. This is deliberately simple.

### TypeScript Interfaces: `types.ts`

`client/src/types.ts` mirrors the server's schema. Frontend and backend have **no shared
type package** — kept in sync manually. When the server schema changes, this file needs
to be updated too.

### Component Tree

```
App.tsx  (state + layout)
│
├── header  (Agents button, Notifications bell — inline JSX in App.tsx)
│
├── ProjectSidebar.tsx
│   └── SortableTreeNode (dnd-kit sortable, one per project)
│
└── main
    ├── (empty state: "Select a project")
    │
    └── ProjectPage.tsx  (when a project is selected)
        ├── Overview tab: project name, description, subproject list
        ├── Board tab → BoardView.tsx  (orchestration only — loads the active board, composes the hooks below)
        │   ├── BoardToolbar.tsx  (board switcher + board create/rename/delete, add-column & manage-workphases entry points)
        │   ├── WorkphaseManagerPanel.tsx  (workphase rename/delete/add rows + column-shrink notices)
        │   ├── BoardColumn.tsx  (one per board column — merged: flat list; expanded: one sub-row per covered workphase)
        │   │   └── KanbanCard.tsx  (one per item, draggable)
        │   ├── UnsortedBucket.tsx  (uncovered workphases + invalid items; drag-source only)
        │   ├── ColumnEditorModal.tsx  (range picker: start/end workphase, merged/expanded)
        │   └── ItemDetailPanel.tsx  (slide-in on item click)
        └── SetupWorkflowModal.tsx  (template / copy / custom)

ModalShell.tsx          (shared modal chrome: backdrop, dialog frame, header, optional
                         footer/close button, Escape-to-close — wraps ColumnEditorModal,
                         SetupWorkflowModal, CreateProjectModal, and AgentsModal)
CreateProjectModal.tsx  (modal, rendered from App.tsx)
AgentsModal.tsx         (modal, rendered from App.tsx)
```

**BoardView's hooks** (`components/workflow/`): `useBoardManagement` (board list +
active board, persisted per-workflow in localStorage), `useWorkphaseManagement`,
`useColumnManagement`, `useItemManagement` (items + per-workphase lookups), and
`useBoardDnd` — all drag-and-drop logic: sensors, drop-target resolution (merged column
vs. expanded sub-row vs. Unsorted vs. broken), column reorder, same-workphase reorder,
and cross-workphase moves with midpoint positioning.

**Data flow** — App.tsx passes state down as props and passes mutation handlers down as
callback props. When a component needs to update something (rename a project, move an
item), it calls the handler → handler calls `api.ts` → on success, updates local state.
No global state library (no Redux, no Zustand) — plain React `useState` with prop
drilling. This works fine at the current scale.

### Workflow Inheritance

The most non-obvious client logic. A project either owns a workflow or inherits one from
its nearest ancestor that has one.

`App.tsx` (lines 140–150) computes this inline on every render:

```typescript
const effectiveWorkflow = (() => {
  if (!selectedProject) return null;
  // Check if this project owns a workflow
  const own = workflows.find(w => w.projectId === selectedProject.id);
  if (own) return { workflow: own, isInherited: false, ownerProject: selectedProject };
  // Walk up the ancestor chain (nearest ancestor first)
  const ancestors = getAncestors(selectedProject, projects);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const inherited = workflows.find(w => w.projectId === ancestors[i].id);
    if (inherited) return { workflow: inherited, isInherited: true, ownerProject: ancestors[i] };
  }
  return null;
})();
```

`getAncestors()` (lines 10–21) walks `parentId` links up the tree using an in-memory
Map of all projects. This is O(depth) per call and runs on every render — fine now,
candidate for `useMemo` if the project tree grows deep.

When `isInherited: true`, `BoardView` receives `readOnly=true` — board, column, and
workphase **management** controls are hidden (the structure belongs to the owner project;
a banner links there). Items still work: creating an item on an inherited board scopes it
to the *viewing* project, and the board filters to that project's items.

*(Note: per the 2026-07-15 decision, boards become project-owned in Epic 7 — after that,
`readOnly` narrows to workphase management only, and every project manages its own boards.)*

---

## Key Patterns

### Real-number position ordering
All ordered lists use a float `position` field. Inserting between A and B:
`(A.position + B.position) / 2`. New items: `max(existing) + 1.0`. No reindexing.
Workphases use `REAL NOT NULL`; items and projects allow `NULL` (meaning "unordered").

### Optimistic updates on drag-and-drop
`handleReorderProject` in App.tsx updates local state immediately, then calls the API.
If the API fails, it refetches from the server to restore truth. This prevents the
UI from feeling laggy during drags.

### dnd-kit drag handle pattern
Drag uses `@dnd-kit/core` + `@dnd-kit/sortable`. In `ProjectSidebar.tsx`, only the ⠿
grip icon triggers drag — clicking the row navigates. Achieved by attaching the
`useSortable` listeners to the handle element, not the whole row.
`activationConstraint: { distance: 5 }` prevents accidental drags on normal clicks.

### ENABLE_TEST_ROUTES guard
The test reset endpoint only mounts when `ENABLE_TEST_ROUTES=true` (see
`server/src/index.ts` line 41). This env var is set by `playwright.config.ts` when
spinning up the test server. The dev server never sets it — dev data is safe.

### MCP is a wrapper, not a data store
`mcp.ts` has no DB access — it calls the same Express API the browser uses. Changes to
the API are automatically reflected in what Claude agents can do, with no extra wiring.
The Epic 2 boards layer required **no MCP changes** — boards are pure presentation over
`items.workphase_id`, and MCP operates at the workphase level.

### Shared modal chrome
All centered modals render through `ModalShell` (backdrop, dialog frame, header,
optional footer/close button, Escape-to-close). Modals needing native form semantics
(Enter-to-submit) wrap their own `<form>` around body+footer inside `children`; others
use the `footer` prop. New modals should start from `ModalShell`, not copy dialog markup.

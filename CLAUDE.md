# Kanban App — Project Context

## What This Is

A personal single-user Kanban board with Claude agent integration. Built for one human
user (Nathan) to track personal projects and optionally assign tasks to Claude agents
via deep links into Claude Desktop/Code projects. No auth system, runs on `localhost`.
All Claude usage stays within the native claude.ai interface — no Anthropic API billing
(deep links + local MCP server only).

## Stack
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 (`client/`)
- **Database:** SQLite via Drizzle ORM (`server/data/kanban.db`), foreign keys enabled
- **Drag and drop:** @dnd-kit/core + @dnd-kit/sortable
- **MCP:** Model Context Protocol server (`server/src/mcp.ts`) — tools wrapping the
  REST API, used by external Claude agents

---

## Data Model

All tables defined in `server/src/db/schema.ts` (source of truth for columns/types).

### Core Hierarchy
```
projects (tree — unlimited depth via parent_id self-ref)
  └── workflows   (one per project, or inherited from parent)
        ├── workphases  (data layer: flat ordered stages — position REAL NOT NULL)
        │     └── items (also a tree via parent_id; position REAL nullable)
        └── boards       (UI layer: named views of the workflow)
              └── columns  (each covers a contiguous range of workphases)
```

### Tables
| Table | Purpose |
|---|---|
| `projects` | Hierarchical folders, unlimited depth |
| `workflows` | Kanban stage sets, one per project or inherited from an ancestor |
| `workflow_templates` / `workflow_template_phases` | System-seeded blueprints ("quick", "flow") — read-only in MVP |
| `workphases` | Workflow stages (data layer) |
| `boards` | Named UI views of a workflow |
| `columns` | A board's columns — each covers a contiguous range of workphases |
| `items` | Kanban cards — tree via `parent_id`, derive workflow via `workphase → workflow` (no `workflow_id` on items directly) |
| `item_types` | Descriptive labels: Epic, Story, Task (seeded) |
| `agents` | Claude agent registrations (`claude_project_id`, `surface`, `repo_path`) |
| `labels` / `item_labels` | Flat global tags, many-to-many (Epic 6 will rework this — see [[project_epic6_labels_rework]]) |
| `chat_threads` / `chat_messages` | Agent conversation threads — **schema only, no API/UI yet** |
| `attachments` | External file links per item — **schema only, no UI yet** |
| `activity_log` | Audit trail on items |
| `notifications` | Created when an item moves to a `triggers_notification` workphase, polled by frontend every 15s |

### Architecture decisions
- **Workflow inheritance:** a project with no workflow inherits from its nearest
  ancestor that has one (computed at runtime, `client/src/App.tsx`).
- **Boards are project-owned (decided 2026-07-15, lands in Epic 7):** boards will be
  rescoped from workflow-owned to project-owned, paired with URL routing. Until then
  the code reflects workflow-owned boards. See Epic 7 in `docs/planning/mvp-roadmap.md`.
- **Positioning:** `workphases.position`/`columns.position` are simple append-at-end
  math (`nextPosition` in `server/src/lib/positionResolver.ts`). `items.position`/
  `projects.position` share a table-generic, server-resolved anchor+side system in the
  same file — the client sends relative intent (insert before/after an anchor, by id),
  never a final number. Full rules: `docs/wiki/item-positioning/README.md`.
- **Attach/detach, hierarchy limits, boards/columns/Unsorted:** see the Conventions
  section below for the one-primitive guardrails; full rules live in
  `docs/wiki/item-attachment/README.md` and `docs/wiki/boards-columns-unsorted/README.md`.
- **Error handling:** a global Express error middleware (registered last) is the
  backstop. Multi-step mutations run inside `db.transaction()`. Details:
  `.claude/guides/error-handling-patterns.md`.

---

## Conventions & Guardrails

These are the "don't reinvent this" rules that aren't obvious from reading any one file:

- **One position math layer.** Client `hierarchy.ts`, server `positionResolver.ts` /
  `itemPositionScope.ts` / `itemTree.ts` are table-generic (items + projects). Extend
  those, never duplicate inline. Client `lib/hierarchyPlacement.ts` is the sibling
  layer one level up — a Card's descendants section's own gap + depth rule
  (`flattenHierarchyOf`/`resolvePlacement`, Epic 3.5 Story 6 §7), shared by the board's
  Descendants layer and the project sidebar. Table-generic the same way (`{id,
  parentId, depth}` rows, a `childrenOf` callback) — extend it, never duplicate its
  walk inline either.
- **One hierarchy-write primitive.** Every write that can give an item a parent
  (`POST /items`, `PUT /items/:id`, `PATCH /items/:id/move`) routes through
  `server/src/lib/itemHierarchy.ts`. Don't reimplement reparent/attach/depth-cap logic
  at the route level.
- **Reindex disclosure must be folded in, never merged alone.** Any item-write response
  may carry `reindexed: {id, position}[]`. Every write path folds it through
  `client/src/components/workflow/itemWriteReconciliation.ts::completeItemWrite`.
- **Routes import from `lib/`, never from each other.** Shared domain logic lives in
  `server/src/lib/`; route files stay thin.
- **`types.ts` is manually synced with `schema.ts`** — no codegen. Update both.
- **Never hand-write a 15-field Item literal in a test** — use
  `client/src/test/itemFixture.ts::makeItem`.
- **Never hand-roll a drag or read `boundingBox()` in an E2E spec** — use
  `tests/helpers/dragGesture.ts`.
- **DB owns referential integrity** (CASCADE/SET NULL in `schema.ts`), **app owns
  behavior**. An item's dependent-row cleanup (labels, activity log, notifications,
  attachments, chat) is DB-owned via `ON DELETE CASCADE` (migration `0009`) — a new
  item-dependent table needs one FK, not a mirrored delete loop. Board+column cascade
  and the workflow-delete chain are still hand-rolled (`server/src/lib/boardCascade.ts`)
  — next conversion candidates. The `parent_id` subtree walk stays app-side by design
  (soft ref, "are you sure" delete).
- **Board-scoped drag/drop conventions** (pop machine, drop bands, pure modules) live in
  `client/src/components/workflow/CLAUDE.md` — loaded automatically when working in
  that directory.

---

## API Routes

Base URL: `http://localhost:3001`

| Prefix | Owns |
|---|---|
| `GET /api/health` | Health check |
| `/api/projects` | Project CRUD + hierarchy move |
| `/api/workflows` | Workflow CRUD + full detail |
| `/api/workflow-templates` | Read-only system templates |
| `/api/workphases` | Workphase CRUD + reorder |
| `/api/boards` | Board CRUD (resolved columns + Unsorted) |
| `/api/columns` | Column CRUD + reorder |
| `/api/items` | Item CRUD + move + reorder + comments |
| `/api/agents` | Agent CRUD |
| `/api/notifications` | Mark read / mark all read |
| `/api/labels` | Label CRUD (global) |
| `/api/attachments` | Attachment CRUD |
| `/api/item-types` | Item type CRUD |
| `/api/test` | Reset + seed DB — only when `ENABLE_TEST_ROUTES=true` |

---

## Repo Layout

```
KanbanApp/
├── .mcp.json           ← MCP server config (points to server/src/mcp.ts)
├── .claude/
│   ├── agents/          ← subagent definitions (harness-discovered path, don't relocate)
│   ├── guides/          ← pattern/library guides (testing, drizzle, react, tailwind, error-handling, prettier, audit workflow)
│   └── personas/
├── docs/
│   ├── planning/        ← mvp-roadmap.md, epic-N-decisions.md (canonical decisions per epic)
│   ├── audits/          ← code-quality-audit-epicN.md (past audit results)
│   ├── walkthroughs/    ← epicN-codebase-walkthrough.md (design rationale narratives)
│   ├── wiki/            ← feature-organized source of truth (hardened, testable rules) — read before touching positioning, attachment, board drag, or boards/columns/Unsorted
│   └── test-plans/      ← feature-organized test-case catalog, folder-aligned with wiki/
├── server/src/          ← see module headers in lib/*.ts for what each shared module owns
├── client/src/          ← see client/CLAUDE.md and module headers in components/workflow/*.ts
├── tests/               ← Playwright E2E (api/, helpers/, pages/, ui/)
└── bruno/               ← saved HTTP requests (manual API testing)
```

Module-level comments in `server/src/lib/*.ts` and `client/src/components/workflow/*.ts`
describe what each file owns — read the file header before assuming a helper doesn't
exist yet.

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
- Gates: `npm run check` (from project root) — type-check, lint, format check and unit
  tests across `client/`, `server/` and `tests/`
- E2E tests: `npm run test:e2e` (from project root) — slower, so kept out of `check`

---

## Known Issues

- `workflows.project_id` is nullable — query `SELECT * FROM workflows WHERE project_id
  IS NULL` to check for orphaned workflows.
- No WebSocket/SSE — notifications polled every 15s. Fine for single-user local use.
- `npm audit` in `server/`: moderate findings via drizzle-kit's bundled esbuild
  dev-server. Accepted, not fixed (dev-tooling only, no production exposure). Revisit
  on the next drizzle-kit major upgrade.

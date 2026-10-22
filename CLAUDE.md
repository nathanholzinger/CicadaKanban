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
projects (tree via parent_id self-ref, depth-capped)
  └── workflows   (one per project, or inherited from parent)
        ├── workphases  (data layer: flat ordered stages — position REAL NOT NULL)
        │     └── items (also a tree via parent_id; position REAL nullable)
        └── boards       (UI layer: named views of the workflow)
              └── columns  (each covers a contiguous range of workphases)
```

### Tables
| Table | Purpose |
|---|---|
| `projects` | Hierarchical folders, depth-capped for display (`PROJECT_DEPTH_CAP`, `server/src/lib/itemTree.ts`) |
| `workflows` | Kanban stage sets, one per project or inherited from an ancestor |
| `workflow_templates` / `workflow_template_phases` | System-seeded blueprints ("quick", "flow") — read-only in MVP |
| `workphases` | Workflow stages (data layer) |
| `boards` | Named UI views of a workflow |
| `columns` | A board's columns — each covers a contiguous range of workphases |
| `items` | Kanban cards — tree via `parent_id`, derive workflow via `workphase → workflow` (no `workflow_id` on items directly) |
| `item_types` | Descriptive labels: Epic, Story, Task (seeded) |
| `agents` | Claude agent registrations (`claude_project_id`, `surface`, `repo_path`) |
| `labels` / `item_labels` | Flat global tags, many-to-many. Provisional: the tag system is due to be replaced, so fix bugs here but don't consolidate or refactor it |
| `chat_threads` / `chat_messages` | Agent conversation threads — **schema only, no API/UI yet** |
| `attachments` | External file links per item — **schema only, no UI yet** |
| `activity_log` | Audit trail on items |
| `notifications` | Created when an item moves to a `triggers_notification` workphase, polled by frontend every 15s |

### Architecture decisions
- **Workflow inheritance:** a project with no workflow of its own inherits its nearest
  ancestor's, and one with its own overrides it for its subtree (computed at runtime,
  `client/src/App.tsx` and `server/src/lib/workflowItems.ts`). Full rule:
  wiki project-tree §10.
- **Boards belong to workflows in the code, but they're due to become project-owned,**
  paired with URL routing. Don't add new code that depends on a board's workflow
  ownership where a project would serve.
- **Positioning:** `workphases.position`/`columns.position` are simple append-at-end
  math (`nextPosition` in `server/src/lib/positionResolver.ts`). `items.position`/
  `projects.position` share a table-generic, server-resolved anchor+side system in the
  same file — a caller sends relative intent (insert before/after an anchor, by id),
  never a final number: no item or project write takes one. Shared rules:
  `docs/wiki/positioning/README.md`; an item's own scopes and the board's placements:
  `docs/wiki/item-positioning/README.md`.
- **Attach/detach, hierarchy limits, boards/columns/Unsorted:** see the Conventions
  section below for the one-primitive guardrails; full rules live in
  `docs/wiki/item-attachment/README.md` and `docs/wiki/boards-columns-unsorted/README.md`.
  The depth cap's formula is wiki hierarchy-placement §6.
- **Error handling:** a global Express error middleware (registered last) is the
  backstop. Multi-step mutations run inside `db.transaction()`. Details:
  `.claude/guides/error-handling-patterns.md`.

---

## Conventions & Guardrails

These are the "don't reinvent this" rules that aren't obvious from reading any one file:

- **One position math layer.** Client `hierarchy.ts`, server `positionResolver.ts` /
  `itemTree.ts` are table-generic (items + projects), including the legal-parent and
  neighbor checks (`itemTree.ts::parentRefusal`, `positionResolver.ts::anchorRefusal`).
  Extend those, never duplicate inline. `itemPositionScope.ts` is the items-only half:
  what an item's position compares against. Client `lib/hierarchyPlacement.ts` is the
  sibling layer one level up — the gap + depth rule (`flattenHierarchyOf`/
  `resolvePlacement`, wiki hierarchy-placement §1) that the board's Descendants layer
  and the project sidebar share. Table-generic the same way (`{id, parentId, depth}`
  rows, a `childrenOf` callback) — extend it, never duplicate its walk inline either.
- **One hierarchy-write primitive.** Every write that changes an existing item's parent,
  attachment or workphase (`PUT /items/:id`, `PATCH /items/:id/move`) routes through
  `server/src/lib/itemHierarchy.ts` (`validateHierarchyRequest`, then
  `applyHierarchyRequest`). `POST /items` has no existing item to validate, so it checks
  a new item's parent at the route (`itemTree.ts::parentRefusal`: it exists and the
  depth cap holds; the project is the parent's), but takes its attachment flag and
  workphase from the primitive's `itemHierarchy.ts::resolveCreate`, so a create and a
  move can't disagree. Don't reimplement reparent/attach/workphase/depth-cap logic at
  the route level.
- **Reindex disclosure must be folded in, never merged alone.** Any item-write or
  project-write response may carry `reindexed: {id, position}[]` (server:
  `positionResolver.ts::withReindexDisclosure`, which `routes/items.ts::respondWithItem`
  and `routes/projects.ts::projectResponse` call). Every write
  path folds it through `client/src/lib/positionedWrite.ts::applyWriteResponse`: the
  board's item writes by way of
  `client/src/components/workflow/itemWriteReconciliation.ts::completeItemWrite`, the
  sidebar's project writes in `App.tsx`.
- **Routes import from `lib/`, never from each other.** Shared domain logic lives in
  `server/src/lib/`; route files stay thin.
- **`types.ts` is manually synced with `schema.ts`** — no codegen. Update both.
- **Never hand-write an Item or Project literal in a client test** — use
  `client/src/test/itemFixture.ts::makeItem` or `projectFixture.ts::makeProject`.
- **Never hand-roll a drag or read `boundingBox()` in an E2E spec** — use
  `tests/helpers/dragGesture.ts`.
- **Never hand-roll E2E setup** — reset with `tests/helpers/db.ts::resetAndSeedDb`,
  create, read and move with the `tests/helpers/seed.ts` helpers, and open a board with
  `ProjectSidebarPage.ts::openBoard`. The reset and the seed helpers fail on a refused
  request, where a hand-rolled call lets the test carry on from the wrong state.
  `openBoard` matches the Board tab exactly, where a loose match also hits "+ New board".
- **A test that covers a test-plan case starts its title with the case's ID**
  (`DRAG-5.5: …`) — see `docs/test-plans/README.md`.
- **DB owns referential integrity** (CASCADE/SET NULL in `schema.ts`), **app owns
  behavior**. An item's dependent-row cleanup (labels, activity log, notifications,
  attachments, chat) is DB-owned via `ON DELETE CASCADE` (migration `0009`) — a new
  item-dependent table needs one FK, not a mirrored delete loop. The board+column cascade
  (`server/src/lib/boardCascade.ts`), the workflow-delete chain
  (`workflowCascade.ts::deleteWorkflowsById`) and a project's delete
  (`projectCascade.ts::deleteProjectById`) are hand-rolled, and are candidates for the
  same conversion. The `parent_id` subtree walk stays app-side by
  design (soft ref, "are you sure" delete).
- **Board-scoped drag/drop conventions** (pop machine, drop bands, pure modules) live in
  `client/src/components/workflow/CLAUDE.md` — loaded automatically when working in
  that directory.

---

## Docs and Process

- **Documentation and comments** follow `.claude/guides/documentation-standards.md`:
  who owns which doc, which way references point, and no provenance in living docs.
  Code comments follow `.claude/guides/code-comments.md`. `npm run check:docs` checks
  the mechanical rules.
- **Never edit a living doc you don't own** (the wiki, the test plans). Hand the change
  off in the story plan instead.
- **Closing a story:** `.claude/guides/story-done-checklist.md`. Plans follow
  `.claude/guides/story-plan-template.md`.
- **`docs/archive/` holds closed plans, audits and reports.** They're frozen and out of
  date by design. Skip them unless asked.

---

## API Routes

Base URL: `http://localhost:3001`

| Prefix | Owns |
|---|---|
| `GET /api/health` | Health check |
| `/api/projects` | Project CRUD + hierarchy move + depth cap |
| `/api/workflows` | Workflow CRUD + full detail |
| `/api/workflow-templates` | Read-only system templates |
| `/api/workphases` | Workphase CRUD + reorder |
| `/api/boards` | Board CRUD (resolved columns + Unsorted) |
| `/api/columns` | Column CRUD + reorder |
| `/api/items` | Item CRUD + move + comments |
| `/api/agents` | Agent CRUD |
| `/api/notifications` | Mark read / mark all read |
| `/api/labels` | Label CRUD (global) |
| `/api/attachments` | Attachment CRUD |
| `/api/item-types` | Item type CRUD |
| `/api/test` | Reset + seed DB; pin an item's position, or a project's position, created-at or parent — only when `ENABLE_TEST_ROUTES=true` |

---

## Repo Layout

```
KanbanApp/
├── .mcp.json           ← MCP server config (points to server/src/mcp.ts)
├── .claude/
│   ├── agents/          ← subagent definitions (harness-discovered path, don't relocate)
│   ├── guides/          ← documentation standards, code comments, story plans and checklists, audit workflow, pattern/library guides
│   └── personas/
├── docs/
│   ├── planning/        ← roadmaps, story plans, decisions docs — open work (transient)
│   ├── audits/          ← open audit and Reconciler reports (transient)
│   ├── archive/         ← closed plans, audits, reports and walkthroughs (frozen — skip unless asked)
│   ├── wiki/            ← feature-organized source of truth (hardened, testable rules) — read before touching positioning, attachment, board drag, hierarchy placement, the project tree, or boards/columns/Unsorted
│   └── test-plans/      ← feature-organized test-case catalog, folder-aligned with wiki/ (a page of shared rules has none)
├── scripts/             ← repo tooling (check-docs)
├── server/src/          ← see module headers in lib/*.ts for what each shared module owns
├── client/src/          ← see module headers; the drag layer's conventions are in components/workflow/CLAUDE.md
├── tests/               ← Playwright E2E (api/, helpers/, pages/, ui/)
└── bruno/               ← saved HTTP requests (manual API testing)
```

Module headers in `server/src/lib/`, `client/src/lib/` and
`client/src/components/workflow/` describe what each file owns — read the file header
before assuming a helper doesn't exist yet.

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

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- Drizzle Studio (DB browser): `cd server && npm run db:studio`
- Gates: `npm run check` (from project root) — type-check, lint (which runs
  `check:docs`), format check, and unit tests across `client/`, `server/` and `scripts/`
- E2E tests: `npm run test:e2e` (from project root) — slower, so kept out of `check`.
  Playwright starts its own stack (client 5174 → server 3002 on `test.db`), apart
  from the dev database

---

## Known Issues

- `workflows.project_id` is nullable — query `SELECT * FROM workflows WHERE project_id
  IS NULL` to check for orphaned workflows.
- No WebSocket/SSE — notifications polled every 15s. Fine for single-user local use.
- `npm audit` in `server/`: moderate findings via drizzle-kit's bundled esbuild
  dev-server. Accepted, not fixed (dev-tooling only, no production exposure). Revisit
  on the next drizzle-kit major upgrade.

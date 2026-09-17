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
  `docs/walkthroughs/epic1and2-codebase-walkthrough.md` for the full design rationale.
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
  workflow-owned boards. See Epic 7 openers in `docs/planning/mvp-roadmap.md`.

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
| `items` | Kanban cards — `id, type?, parent_id?, is_attached, project_id, workphase_id?, title, description?, position?, assignee_type?, agent_id?, created_at, updated_at` |
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
`workphases.position` and `columns.position` are `REAL NOT NULL`, ordered by simple
append-at-end math (`server/src/lib/positions.ts::nextPosition`). `items.position` and
`projects.position` are `REAL` (nullable — null means unordered) and share one
table-generic, server-resolved system instead (`server/src/lib/positionResolver.ts`):
the client never computes or sends a final number, only relative intent — insert
`before`/`after` a specific anchor item/project, by id — and the server resolves the
actual value against that anchor's **true current** neighbor, always re-queried fresh,
never trusted from the client's (possibly narrower) view. See
`docs/wiki/item-positioning/README.md` for the full design (anchor+side resolution,
coarsest-fit rounding, lazy reindexing, and the active/done split where done items get
no stored position at all — ordered by `completedAt` instead).

### Item Positioning & Board-Scoped Ordering (Epic 3.2)
- Items gain a computed, read-only `positionScope` field on every API response:
  `"attached-siblings"` (attached child, position comparable only against its parent's
  other children), `"workflow"` (detached/root, active — comparable against the whole
  workflow), or `"none"` (not currently ordered — a done item, or one with no
  `workphaseId` at all).
- `PATCH /items/:id/move` and `PATCH /projects/:id/move` both accept anchor-relative
  intent (`anchorId`/`side` for items; `prevId`/`nextId` naming the resulting
  predecessor/successor for projects) as the primary shape. Items also still accept a
  raw `position` (validated as a finite number) and a bare `workphaseId` with no anchor,
  which deliberately **keeps the item's existing position unchanged** rather than
  reassigning one — see the wiki's §2 addendum.
- Projects reorder the same way items do — there is no more batch `PATCH
  /projects/reorder` (retired: it validated each reparent independently against
  current state, so a two-entry batch could collude to write an undetected cycle).

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

### Attached / Detached Children (Epic 3)
- Items gain `is_attached` (default `true`). An **attached** child mirrors its
  parent's current `workphase_id` and moves with it; a **detached** child keeps
  its own, independent `workphase_id`.
- The cascade (`server/src/lib/attachedCascade.ts::cascadeWorkphaseToAttachedDescendants`)
  fires on every server path that changes a parent's workphase — the move
  endpoint, PUT reparent/attach, and MCP's `move_item` all route through it.
  A **detached** child halts the cascade for its whole branch: its own
  attached children do not follow, by construction.
- Attaching (`is_attached: true`) snaps the item to its parent's current
  workphase immediately; detaching leaves the item's `workphase_id` exactly
  where it was.
- Attached children render nested under their parent card (non-draggable —
  detaching is done via the item detail panel checkbox or the child badge,
  not drag-and-drop yet). `boards.showAttachedChildren` toggles whether they
  show expanded/indented or collapsed by default. The board-level **drag
  gesture** to attach/detach is Epic 3.5 Stories 4–6; its server half (Story 1),
  target classification (Story 2), the pop machine + column bands (Story 3), and
  the Card → Card attach direction (Story 4) are done. Detach (Story 5) and
  full anchor+side+indent hierarchy placement (Story 6) remain.

### Hierarchy Changes — One Primitive, Three Entry Points (Epic 3.5 Story 1)
- Every write that can give an item a parent goes through
  `server/src/lib/itemHierarchy.ts` — `validateHierarchyRequest` (pre-transaction,
  returns the 400 message) + `applyHierarchyRequest` (inside the transaction: project
  cascade → parent/flag/workphase write → position resolved against the *resulting*
  scope → active/done split → workphase cascade → cross-workflow position nulling →
  activity log). `PATCH /items/:id/move` accepts `parentId`/`isAttached` alongside
  `workphaseId`/`anchorId`/`side`/`position`, all in one commit; `PUT /items/:id`
  (the Sheet's edit endpoint) accepts `parentId`/`isAttached` and calls the same
  primitive; `POST /items` shares the legality guard. Full rules:
  `docs/wiki/item-attachment/README.md`.
- **Depth cap:** `ITEM_DEPTH_CAP` (provisionally 6, `server/src/lib/itemTree.ts`) —
  a target at depth `D` (root = 1) is legal iff `D + 1 + subtreeHeight <= CAP`,
  detached descendants counted. Enforced on POST/PUT/move, never in the schema.
  The client reads it as `board.itemDepthCap` from `GET /boards/:id` (Story 2, below).
- **Cross-project reparent is allowed**: `projectId` is derived from the new parent
  and cascades to the whole subtree (detached descendants included). Never sent by
  the client. Cross-*workflow* is accepted too (Sheet/MCP only): workphases are left
  as-is, items keeping a now-foreign workphase get `position: null` and surface in
  Unsorted → "Unknown status".
- **`parentId: null`** = reparent to root — clears `isAttached` too; `isAttached: true`
  with no resulting parent is a 400, as is a `workphaseId` that contradicts the parent
  an attached item inherits from.
- **Reindex disclosure:** any item-write response may carry `reindexed: {id, position}[]`
  when a lazy reindex renumbered rows the caller never asked about. Absent otherwise.
  The client applies it as of Story 2 (below); the inversion tripwire is Story 3.
- Hierarchy changes log a `hierarchy_change` activity entry on the moving item.

### Drag-Target Classification (Epic 3.5 Story 2)
- When a Card or Stub is picked up, `useBoardDnd` classifies every item on the board
  against it **once** (`workflow/dragClassification.ts::classifyDragTargets` — pure,
  unit-tested): `valid` / `cycle-forming` (the item and its whole subtree, attached or
  not) / `depth-capped` (`D + 1 + h > cap`, `isWithinDepthCap`) / `inert`. The cap is
  `board.itemDepthCap` from `GET /boards/:id`, never hard-coded. Stubs are classified
  individually, same as Cards. A Stub drag is interim until Story 5: siblings valid,
  everything else inert.
- Cards and Stubs read their state through `workflow/DragSessionContext.ts`'s
  `useDropTargetState(itemId)` (a context provided by BoardView inside DndContext — no
  prop drilling) and render `data-item-id` + `data-drop-state` attributes (the E2E
  surface) plus provisional overlays: green ring for a Free descendant of the carried
  item, dimmed for depth-capped — both CSS custom properties set from the dev/test
  panel. Story 8 tunes the look.
- **Classification doesn't change any drop outcome yet.** Stubs are still excluded
  from Card drags; Stories 4/6 consult the map when they give those drops a meaning.
  Rules: `docs/wiki/board-drag-interaction/README.md` §4.
- **Reindex disclosure, client half:** every item-write response may carry
  `reindexed: {id, position}[]` (`api/items.ts::ItemWriteResponse`); every write path
  (board move, attached-sibling reorder, inline create, the Sheet's PUT) folds it in
  through `workflow/itemListOps.ts::completeItemWrite` — pairs first, written item
  last, then the placement is cleared and the inversion tripwire runs. Never merge a
  written row alone.

### Pop State Machine, Column Drop Bands, Card Attach, Ordinal Preview (Epic 3.5 Stories 3–4)
- **The board is a strict stack of layers, never more than one deep from where you
  are: Board → a Column/sub-row → one of its own Cards** (wiki §1.1, re-planned for
  Story 4, 2026-09-16 — a genuine rule change over Story 3's flatter model, not just
  Story 4 catching up to it). A Card drag starts in exactly one **context** — the
  region the cursor is in at pickup, registered by a `data-drag-region` attribute and
  measured from the DOM by `workflow/dragRegions.ts` — never a Card (a Card is reachable
  only by zooming in). A region is a **bounded box**: `nonCardRegionAt`/`cardRegionAt`
  are plain containment, nothing more — a column's header/footer, the gaps between
  columns or sub-rows, and the space below the last sub-row are nowhere, and a sub-row
  (or a Card) is additionally clipped to its column's visible scroll box
  (`measureDragRegions`'s `findVerticalScrollAncestor` + `clipToVisible`) — scrolled
  fully out of view, it registers no region at all (wiki §1, wiki–code reconciliation
  #20). `workflow/popSession.ts` is the pure machine, two states per layer: **locked** —
  the DragOverlay is clamped to the context (a `DragOverlay` modifier — `DndContext`
  itself gets no modifier, so `delta` and the collision rect stay raw) while the cursor
  roams; **popped out**, one layer only (Board has no parent) — the cursor stayed
  outside the context past `popDelayMs` (or past `popDistancePx`, either satisfies): the
  card tweens to the cursor's parent layer (`popSnapMs`), following it freely at Board
  layer or bounded by the wider context one layer down. Popping back **in** is
  duration-only, never distance, and is two different clocks depending on the edge:
  Board → Column/sub-row uses `popInDelayMs` and fires only from the middle band;
  Column/sub-row → one of its own Cards uses its own `cardPopInDelayMs` (default 800ms,
  longer on purpose — this edge can mean a reparent) and has no band at all, just
  presence and duration. A drag from Unsorted starts popped out with no context.
- **A release always commits the locked layer's own within-action**, never a foreign
  region's, regardless of where the bare cursor rests (wiki §1.1 rule 1 — this is what
  keeps a Card's bands and a column's bands from being simultaneously live once a Card
  is also a region). Column/sub-row: dnd-kit's `over` decides (anchor + side, unchanged
  from Epic 3.2). Card: always append as the last Stub — no band, no anchor (§6,
  narrowed scope; full anchor+side+indent placement is Story 6). **Only at Board layer**
  (genuinely popped all the way out) does a bare hover's **band** decide
  (`boardDndUtils.ts::bandDropResolution`): top → before the region's first rendered
  item, bottom → after its last, middle → workphase-only (position kept); an empty or
  done region is workphase-only in any band; a covered-set member keeps its workphase
  (no-op). Between columns / over Unsorted / a broken column: nothing is written.
- **Bands are pixel carve-outs anchored to the region's real content
  (`DragRegion.contentRect`), not fractions of the visible-scrolled slice** (Story 3
  re-plan, 2026-09-16 — replaces the original 20/60/20-of-rendered-height model
  entirely). At Board layer every region reserves one collapsed ghost card's height
  (`ghostCardHeightPx`, default 96px) for the drag's duration — two half-height dead
  zones ("Move Top"/"Move Bottom") when it's not the live hover target, a real ghost
  filling the same reserved height when it is (net height never changes). Divider lines
  sit a full `ghostCardHeightPx` from each edge (deliberately bisecting the first/last
  card for 2+ cards; halved for exactly one card, so it stays a real middle band); an
  empty or terminal region collapses to one full-height band
  (`dragRegions.ts::bandBoundaries`, drawn by `BandGuides.tsx::DragCarveFrame`, the one
  place `[data-drag-region]` is applied for both merged columns and sub-rows now). The
  reservation exists only at Board layer and collapses — not just hides — the instant
  anything is locked. Bands are measured against the region's `contentRect` *as it was
  on entry* — the ghost's own insertion moves things — and that frozen rect follows
  everything else that can move the region: a real scroll, or a sibling region's own
  carve-out reflow (`popSession.ts::followRegionTop`, generalized from a plain
  scroll-offset translation — wiki–code reconciliation #20/#21). Guides draw only at
  Board layer (`BandGuides.tsx`): dashed boundary lines on every region the card doesn't
  belong to, the hovered region's band tinted, from that same frozen rect.
- **A Card is a region too** (`card:<id>`, `dragRegions.ts::cardRegionKey`), reachable
  only by zooming in from the column/sub-row that contains it (`parentRegionKey`), never
  a Board-layer target in its own right (`nonCardRegionAt` excludes it unconditionally —
  so a column's own edge bands stay reachable no matter what Cards are drawn over them).
  Dropping onto one attaches the carried Card as its last Stub, inheriting its workphase
  (wiki §6; consequences are `docs/wiki/item-attachment/`'s rules, unmodified). The ghost
  migrates lists like any cross-column move: `Placement` gained an optional `parentId`
  (`itemListOps.ts`), and `renderedIsStub`/`renderedParentId` pull a previewing card out
  of its origin column's selector and into the target's `getAttachedChildrenFrom` at its
  slot — `computeChildCounts` and the inversion tripwire are placement-aware for the
  same reason a done item excludes itself. The rendered stand-in inside the target
  (`KanbanCard.tsx::AttachGhostRow`) is a plain visual placeholder with no
  `useSortable`/`useDroppable` registration, to keep the collision closure from ever
  reading a real Card as an `attached-child` mid-drag.
- **Both visible copies of a dragged Card collapse to a fixed shape** for the drag's
  duration (`KanbanCard.tsx`'s `isGhostLike`, covering the DragOverlay copy and the
  in-list `isDragging` row alike): title truncated to one line, description clamped to
  exactly one line (space reserved even when empty), attached-children indicator and
  count fully unrendered, not dimmed. Keeps a real card's otherwise-unbounded height
  close to the carve-out's `ghostCardHeightPx` approximation. Expands back to full
  height instantaneously on drop — no animation yet.
- **The ghost is an ordinal placement, never a position** (`itemListOps.ts` —
  `Placement = { workphaseId?, parentId?, slot: 'existing' | 'first' | 'last' |
  {anchorId, side} }`, layered over the position sort by every list selector, Stubs
  included). An item with no position to keep (a reopened done item, a first-time
  workphase assignment) previews at `'last'` rather than `'existing'`, matching the
  append fallback it will actually resolve to (`popSession.ts::placementFor`,
  `boardDndUtils.ts::pendingPlacementFor` — wiki–code reconciliation #29). Nothing in
  `items` is mutated during a drag; cancel restores the item's pre-drag placement if a
  write for it is still in flight, else clears it (reconciliation #22). On release the
  placement becomes the **pending marker** (`data-pending`) carrying the request's own
  relation, cleared by the response. `useItemManagement.ts::writes` sequences writes
  per item so a stale response's own row is dropped whole (DRAG-6.5), but if it
  disclosed a reindex, `complete` reports `needsResync` and the board reloads instead of
  silently losing the renumbering of other rows (reconciliation #15); a response landing
  mid-drag of the *active* item's own ghost is reasserted reactively rather than waiting
  for the machine's next state change; a rejected write clears the placement and
  reloads.
- **Every threshold and band is a dev/test-panel value** (`workflow/dragTuning.ts`,
  `DragTuningPanel.tsx`, toolbar → "Drag tuning"), persisted in `localStorage` under
  `kanban_drag_tuning`. E2E seeds that key with `addInitScript` and reads the numbers
  back from the same object — never a literal. Values are deliberately unlocked, tuned
  by feel; automated tests assert *reachability* and write correctness, never a timing
  sequence. The board root carries `data-drag-state` (`locked` / `popped-out`) and
  `data-drag-context` for tests. The panel itself is a tuning-phase tool, retired once
  the values lock and become constants.
- `workflow/DragSessionContext.ts` holds the whole drag (`activeItem`,
  `classification`, `pop`, `priorPlacement`) plus `PlacementsContext`;
  `useIsCardBeingDragged` replaced the drilled prop. `lib/isStub.ts` is the one
  "renders as a Stub" predicate.

---

## API Routes

Base URL: `http://localhost:3001`

| Prefix | Owns |
|---|---|
| `GET /api/health` | Health check |
| `/api/projects` | Project CRUD + hierarchy move (`PATCH /:id/move` — anchor-relative, see Position Field Pattern above) |
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
│   ├── agents/                  ← test-reconciler.md, auditor-*.md (subagent definitions — harness-discovered path, don't relocate)
│   ├── guides/                  ← audit-workflow.md, epic-done-checklist.md, pattern/library guides
│   └── personas/                ← architect.md, coder.md, test-planner.md, product-owner.md, auditor.md
├── docs/
│   ├── planning/                ← mvp-roadmap.md, epic-N-decisions.md
│   ├── audits/                  ← code-quality-audit-epicN.md
│   ├── walkthroughs/            ← epicN-codebase-walkthrough.md
│   ├── wiki/                    ← feature-organized source of truth (hardened, testable rules)
│   └── test-plans/              ← feature-organized test-case catalog, folder-aligned with wiki/
├── server/
│   ├── .env                     ← HOST, PORT, DB_PATH
│   ├── drizzle/                 ← migration SQL files (0000–0010)
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
│       │   ├── workflowItems.ts ← getWorkflowItems/getBoardScopeItems (items in/under a workflow's scope), effectiveWorkflowIdForProject
│       │   ├── boardCascade.ts  ← deleteBoardsById (transactional columns→boards delete, used by 3 delete paths)
│       │   ├── attachedCascade.ts ← cascadeWorkphaseToAttachedDescendants (attach/detach cascade, Epic 3)
│       │   ├── itemHierarchy.ts ← validateHierarchyRequest/applyHierarchyRequest — the one reparent/attach/workphase/placement implementation behind POST, PUT, and move (Epic 3.5)
│       │   ├── activityLog.ts   ← logActivity (one activity_log insert, optionally inside a tx)
│       │   ├── itemTree.ts      ← isSelfRefDescendant/assertValidReparent (items+projects) + walkItemDescendants, hierarchyDepth/subtreeHeight/assertWithinDepthCap + ITEM_DEPTH_CAP (items), all cycle-guarded
│       │   ├── reorder.ts       ← validateReorder/applyReorderEntries (shared PATCH /reorder — items, workphases, columns)
│       │   ├── positionResolver.ts ← table-generic anchor+side resolution, coarsest-fit, lazy reindex (Epic 3.2 — items + projects)
│       │   ├── coarsestFit.ts   ← the coarsest-decimal-that-fits search, factored out of positionResolver.ts for standalone unit tests
│       │   ├── itemPositionScope.ts ← items-only vocabulary atop positionResolver.ts: classifyPositionScope, positionScopeFor, withPositionScope, sharesPositionScope
│       │   ├── workphaseOrder.ts ← workphase rank/order helpers shared by columnRanges.ts and itemPositionScope.ts
│       │   ├── positions.ts     ← nextPosition (append-at-end math for workphases/boards/columns — non-nullable, no anchor/reindex)
│       │   ├── urlPart.ts       ← encodeURIComponent wrapper for MCP's interpolated URL segments
│       │   └── getOrNotFound.ts ← getByIdOrNotFound (fetch-by-id-or-404 helper, used across all route files)
│       └── routes/              ← one file per route prefix (boards.ts, columns.ts, workphases.ts, ...)
├── client/
│   ├── CLAUDE.md                ← you are here
│   ├── vite.config.ts           ← Tailwind plugin + /api proxy to :3001
│   └── src/
│       ├── App.tsx              ← state root, layout, workflow inheritance
│       ├── types.ts             ← TypeScript interfaces (manually synced with schema)
│       ├── lib/                 ← client-only shared logic
│       │   ├── hierarchy.ts     ← getAncestors/getDescendantLevels (the one BFS) + getDescendantIds/getSubtreeHeight derived from it, getDepth (cycle-guarded tree walks, items+projects)
│       │   └── isStub.ts        ← the one "renders as a Stub" predicate (positionScope === 'attached-siblings')
│       ├── test/                ← shared unit-test fixtures (itemFixture.ts::makeItem — the one Item factory; never hand-write a 15-field Item literal in a test; dragFixtures.ts::rect/region for the drag geometry)
│       ├── api/                 ← fetch wrappers, one file per domain (projects.ts,
│       │                          workflows.ts, items.ts, ...) + shared.ts (apiJson/apiVoid/
│       │                          apiRequest — always parses the server's real `{ error }`
│       │                          message with a fallback, plus the API base path) —
│       │                          mirrors server/src/routes/*.ts, no barrel index
│       └── components/
│           ├── ProjectSidebar.tsx    ← project tree, dnd-kit drag reorder (server-resolved, prevId/nextId)
│           ├── ProjectPage.tsx       ← project detail shell: breadcrumb, name edit-in-place + self-delete, tab bar
│           ├── ProjectOverviewTab.tsx ← Overview tab body: description edit-in-place, parent selector, subprojects list
│           ├── BoardView.tsx         ← board orchestration: loads active board, composes hooks, renders DnD board
│           ├── BoardToolbar.tsx      ← board switcher + board create/rename/delete, add-column/manage-workphases/drag-tuning entry points
│           ├── DragTuningPanel.tsx   ← dev/test panel: every drag threshold/band/overlay value, live machine state, inversion log (Epic 3.5)
│           ├── BandGuides.tsx        ← the drop bands made visible while a Card is carried: dashed boundary lines per region + the hovered band tinted (Epic 3.5)
│           ├── WorkphaseManagerPanel.tsx ← workphase rename/delete/add rows + column-shrink notices
│           ├── BoardColumn.tsx       ← droppable column (merged or per-workphase expanded sub-rows)
│           ├── UnsortedBucket.tsx    ← uncovered-workphase items, drag-source only
│           ├── ColumnEditorModal.tsx ← range picker (start/end workphase, display mode)
│           ├── KanbanCard.tsx        ← draggable card
│           ├── ItemDetailPanel.tsx   ← slide-in item detail (composes item-detail/* sections)
│           ├── InlineItemForm.tsx    ← shared "title + type select + Add/Cancel, Escape to dismiss" form (BoardColumn + ChildrenSection)
│           ├── ConfirmDeleteButton.tsx ← shared icon-trigger confirm-delete (columns, workphases, boards, agents)
│           ├── ConfirmDeleteInline.tsx ← shared inline confirm-delete for a row/heading being replaced outright (ProjectPage)
│           ├── NotificationsBell.tsx ← self-contained: poll, dropdown, mark-read/mark-all (no props)
│           ├── ModalShell.tsx        ← shared modal chrome (backdrop, header, footer, Esc) — all centered modals wrap this
│           ├── icons.tsx             ← shared inline SVG icon set + a couple of shared icon-button Tailwind constants
│           ├── SetupWorkflowModal.tsx
│           ├── CreateProjectModal.tsx
│           ├── AgentsModal.tsx
│           ├── item-detail/          ← ItemDetailPanel's sections (Children/Labels/Attachments/Parent/Agent/ActivityLog) + pillUtils.ts (shared Tailwind tokens) + DetailSection.tsx (section header + form-actions wrapper)
│           ├── sidebar/              ← SortableProjectRow.tsx + projectTreeUtils.ts (sidebar-only tree helpers)
│           └── workflow/             ← useBoardManagement, useColumnManagement, useWorkphaseManagement, useItemManagement (state atom + write tracker), useBoardDnd (the gesture's clocks, DOM measurement, dnd-kit plumbing) + pure, unit-tested modules: itemListOps.ts (selectors, ordinal placements, §5a reconciliation + tripwire), boardDndUtils.ts (collision, drop/band resolution, request shapes), dragClassification.ts (per-drag target classification), dragRegions.ts (regions, bands), popSession.ts (the pop machine), dragTuning.ts (tunable parameters + storage) + DragSessionContext.ts (useDragSession/useDropTargetState/useIsPending) + DragTuningContext.ts (the tuning values for the pieces that draw them)
├── tests/                       ← Playwright E2E
│   ├── api/                     ← REST endpoint tests via Playwright request fixture
│   ├── helpers/                 ← api.ts, db.ts, seed.ts (seedTemplatedWorkflow/seedBareWorkflow/addWorkphases/pickWorkphases + seedItem (asserts ok — never bare-POST an item in a spec), seedPositionedItems (plan → create → pin), fetchDefaultBoard), itemRepositioningScenario.ts, dragGesture.ts (the one dnd-kit pointer recipe: pickUp/hoverTo/release/cancel + dragTo, with every target measured in layout space via boxOf/atFraction/gapBetween — never hand-roll a drag or read boundingBox() for a drop target in a spec; awaitDragState/awaitDragContext assert the machine's state instead of sleeping past a threshold; a drag spec seeds `kanban_drag_tuning` and reads its thresholds back, never a literal, and imports region keys from the client's dragRegions.ts rather than re-spelling `column:`/`subrow:`)
│   ├── pages/                   ← ProjectSidebarPage (select/toggle rows; openBoard(name) = goto + select + Board tab)
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
- An item's **dependent-row cleanup is DB-owned** (migration `0009`): itemLabels,
  activityLog, notifications-by-item, attachments, chatThreads/chatMessages all
  `ON DELETE CASCADE`, so deleting an item (or a project's items) auto-clears them —
  adding a new item-dependent table means one CASCADE FK in `schema.ts`, not mirrored
  loops. Still hand-rolled: the **board+columns** cascade (`lib/boardCascade.ts`) and
  the workflow-delete chain (boards, workphases, notifications-by-`workflowId`) — the
  next DB-CASCADE conversion candidates. The `parent_id` subtree walk stays app-side
  by design (soft ref, "are you sure" delete).
- `npm audit` in `server/`: 4 moderate findings (esbuild dev-server advisories reached
  via drizzle-kit's bundled loader). Accepted, not fixed — `npm audit fix --force`
  would downgrade drizzle-kit to 0.18.1. Dev-tooling only; no production exposure for
  a localhost single-user app. Revisit on the next drizzle-kit major upgrade.

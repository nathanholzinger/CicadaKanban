# MVP Epics: Cicada Kanban

## Context

This plan is based on the current design doc (https://docs.google.com/document/d/1XXTmQsFitrAl_kqmYUrr2beUW8ectk5aXnk04_cB8XM). 

---

## Design Doc Summary

Key concepts from the design doc:

- **Projects** — Unlimited-depth hierarchical folders. Each project has a workflow (own or inherited from parent). Parent projects can collate descendants sharing the same workflow into a single board view.
- **Workflows** — Define statuses (columns) that work items move through. Currently implemented as `boards` in the codebase. Subprojects inherit or override.
- **Work Items** — Unlimited depth. Non-prescriptive hierarchy. Can be **attached** (follow parent when it moves columns) or **detached** (independent status). Full metadata: assignee, agent, tags, chat, activity.
- **Quick Items** — Checkbox-based (not kanban). Aggregate into buckets. Auto-complete bucket when all children checked.
- **Boards** — A project has one workflow (flat ordered list of statuses). Teams configure multiple boards as views of that workflow. Each board column covers a contiguous range of statuses; display mode per column is merged (all statuses in one swimlane) or expanded (each status as a sub-row). Different boards expose different levels of granularity — a PM board might group Dev+Review as "In Progress" while a dev board shows them separately.
- **Tags & Types** — Types are purely descriptive (color/name, no behavior). Tags organize into **And Buckets** (non-exclusive) and **Or Buckets** (mutually exclusive). Up to 3 priority tags shown on card header.
- **Inbox** — Collates items across workflows or outside workflow configurations. Saved filter configs become named inboxes. "Headlines" view for unopened items.
- **AI Agents** — Assignable to work items. Claude Chat and Claude Code configurations. "Visit {Agent}" deep links. Future: Claude Code auto-pickup of stories.
- **Dashboard & Navigation** — Tile-based dashboard. Configurable quick-nav sidebar (opens from any edge).
- **Events & Notifications** — Triggers for assignments/mentions → activity log + alerts. Alert inbox. Priority classification is post-MVP.

---

## Proposed MVP Epics (Ordered)

### Epic 1 — Projects & Workflow Architecture ✅ (complete)
**Why first:** Everything else sits on this. The `boards` table needs to become `workflows`; a new `projects` table (with `parent_id` for unlimited depth) needs to sit above it. Work items gain `project_id`. This is the foundational rename + restructure that prevents technical debt from compounding across every subsequent epic.

Rename `boards` → `workflows` throughout (schema, API routes, MCP tools, UI, types). Add `projects` table with `parent_id`. Projects reference a `workflow_id` (nullable = inherit from parent). Work items gain `project_id`. Migrate existing data into a default project. Update the UI from a flat board selector to a project-tree navigator.

---

### Epic 1.5 — Codebase Orientation & Hardening ✅ (complete)
**Why here:** Epic 1's rename left rough edges (`card`/`work-item`/`column` still leaking through code and docs), no unit-level safety net, and no onboarding docs for a fresh contributor. Settling this before Epic 2 means subsequent epics build on clean naming and a real test harness instead of compounding drift.

Finished the Epic 1 rename (`card`→`item`, `work-item`→`item`, `column`→`workphase`) across schema, routes, MCP tools, UI, and the Bruno collection. Ran a full code quality audit and fixed its findings (stale `workItemId` fields, a `boardId`/`workflowId` mix-up bug, a cascade-delete gap orphaning grandchildren). Split the oversized `CardDetailPanel.tsx` into `ItemDetailPanel.tsx` plus focused sub-components, and refactored Tailwind usage to best-practice patterns. Added a Vitest unit test suite (client + server) alongside the existing Playwright E2E suite. Added onboarding docs (`docs/walkthroughs/epic1and2-codebase-walkthrough.md`, rewritten `client/CLAUDE.md`) and persona/checklist scaffolding for future epics. Removed `node_modules` from git tracking.

---

### Epic 2 — Boards Layer ✅ (complete)
**Why second:** Board views define how the workflow is displayed and interacted with. This needs to exist cleanly before downstream epics (Inbox, Dashboard) that depend on how items are surfaced.

A workflow is a flat ordered list of statuses (columns). Boards are configurable views of a workflow. Add a `boards` table and a `board_columns` table where each board column covers a contiguous range of workflow statuses (`start_status_id`, `end_status_id`). Display mode per board column: `merged` (all statuses in one swimlane) or `expanded` (each status gets a sub-row). An unsorted column appears automatically when any workflow status is not covered by any board column's range, with a "needs attention" indicator. Dropping a card into a merged column assigns it to the first status in that column's range; for finer precision, use a board where individual statuses are their own columns.

---

### Epic 3 — Work Item Behaviors (Attached & Detached) ✅ (complete)
**Why third:** Once the project/workflow structure exists and columns are properly hierarchical, the rules for how work items move through that structure need to be defined. Attached vs. detached determines whether children follow parents — this affects drag-and-drop, column moves, and board display in every subsequent feature.

Work items gain an `is_attached` flag. Attached children move with their parent when the parent changes columns. Detached children keep their independent column assignment. Board display toggles: show attached children as indented list, or collapse/hide them. Attach/detach is driven from the item detail panel (checkbox) and the child badge; the board-level **drag-and-drop gesture** for it is split out to Epic 3.5 and is **not** required to close Epic 3.

---

### Epic 3.2 — Item Positioning & Board-Scoped Ordering
**Why here:** Surfaced while auditing Epic 3 — today's `items.position` is a
single workphase-scoped value with no manual reordering for attached
children, no recalculation when a column's merged/expanded display or range
changes, and (per further discussion) may need to become a board-level
concern so reordering on one board doesn't affect another. Sequenced before
Epic 3.5 because that epic's drag gesture builds on the same `useBoardDnd`
layer this would change — doing the gesture first would mean redoing it.

Rework item positioning: attached children become manually reorderable
relative to their siblings; merged↔expanded column changes (and range edits
that change a merged column's covered workphases) recompute ordering by
workphase-rank while preserving prior relative order; resolve whether
position should move from an item-level value to a board-scoped one. See
`epic-3.2-decisions.md` for the full design discussion —
nothing here is decided yet.

---

### Epic 3.5 — Drag-and-Drop Attach/Detach Gesture
**Why here:** The attach/detach *state* and all its behaviors shipped in Epic 3 (detail-panel checkbox + child-badge controls, cascade on parent move, nested render, cycle prevention). What's left is only the ergonomic **board gesture** for it. It's split out because it touches the dnd-kit board-interaction layer deeply and isn't required for the attached/detached model to be correct and usable — so Epic 3 closes without it (audit finding #13).

A drag gesture to attach/detach directly on the board: dropping a card onto another card attaches it as a child; dragging an attached child out of its parent detaches it. Builds on the existing dnd-kit layer (`useBoardDnd`) and the attach/detach endpoints already in place. Attached children currently render as non-draggable read-only rows, so this epic also makes them draggable for the detach direction. Guard the gesture with the same-project and cycle rules already enforced on the API (findings #11, cycle checks).

---

### Epic 4 — Quick Items
**Why fourth:** A high-value daily-use feature with relatively contained scope. Quick items are structurally distinct enough from kanban items to need their own treatment, but they build on the work item model and column structure established in Epics 1–3.

Work items gain a `kind` field (`kanban | quick`). Quick items display as checkbox lists rather than kanban cards. On completion, unattached quick items move to the Done column. Quick item buckets aggregate descendant quick items into a single moveable unit; the bucket auto-completes when all contained items are checked.

---

### Epic 5 — Tags & Type System
**Why fifth:** Tags are a primary organizational tool referenced throughout the design doc. The current labels system is too flat to support And/Or bucket logic. This needs to be right before the Inbox (Epic 6) since inboxes use filter configurations that will be tag-aware.

Types remain purely descriptive (name, color, no behavior). Introduce **tag buckets**: And Buckets (non-exclusive, e.g., "Teams") and Or Buckets (mutually exclusive, e.g., "Work Item Type"). Buckets have a priority that determines which tags show in the card header (up to 3 primary tag slots). Replace existing labels with the bucket system.

---

### Epic 6 — Inbox
**Why sixth:** The Inbox collates items across projects/workflows and outside workflow configurations. It requires clean project/workflow structure (Epics 1–2), settled item behavior (Epic 3), and tags (Epic 5) to be a useful filtering surface.

Inbox views collate work items across workflows or items not yet assigned to a column. Saved filter configurations become named, navigable inboxes. "Headlines" view for inbox items (title + priority tags, similar to kanban card but in list format). Personal task aggregation and high-level cross-project views are the primary use cases.

---

### Epic 7 — Work Item Detail & Chat UI
**Why seventh:** The full detail panel is a polish and integration layer. The schema for chat threads, attachments, and activity already exists — this epic surfaces it all in the UI. It's placed after core structure is stable so the detail view isn't rebuilt as the data model evolves.

Full work item detail panel: editable title/description, assignee, agent, status, tags, parent/child relationships. Chat thread UI (schema exists: `chat_threads`, `chat_messages`). Attachment display for link-type attachments (google_doc, github_file, local_file URLs — file uploads are post-MVP). "Visit {Agent}" deep links. Activity log timeline with all event types.

---

### Epic 8 — Dashboard, Navigation & Notifications
**Why last:** The UX cohesion layer. Tile-based navigation, the quick-nav sidebar, and a complete notification system make sense to build once all the views they link to exist.

Tile-based dashboard linking to projects, workflows/boards, inboxes, agent management, and global filters. Configurable quick-nav sidebar (opens from any edge, toggle visibility). Full event/notification system: triggers (assignment, mention, column moves) → activity log entries + alert notifications. Alert inbox with quick links. MVP: mark-read on click; priority tiers are post-MVP.

---

## Verification Approach (per epic)

Each epic verified by:
1. Running the app locally (`cd server && npm run dev` + `cd client && npm run dev`)
2. Manually exercising the new feature in the browser (golden path + edge cases)
3. Confirming MCP tools reflect any schema or API changes (`npm run mcp`)
4. Running the Playwright E2E suite (`npm run test:e2e`) for regressions
5. Each epic introduces new E2E regression tests covering its core flows

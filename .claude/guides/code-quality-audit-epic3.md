# Code Quality Audit — Epic 3 Complete (2026-07-17)

Scope note: this is the **Epic 3 close-out audit**. Because Epic 3's
attached-children work sits uncommitted on top of tag `epic-2-complete`, the
diff audited spans `epic-1.5-complete` → working tree — i.e. **Epic 2's
committed boards layer plus Epic 3's attached/detached work**, audited at
working-tree state. Run as four parallel passes per
`.claude/guides/audit-workflow.md`, plus a **focused supplemental
Correctness & Security pass** dedicated to the Epic 3 surface (parent-child
relationships and attach/detach semantics), since the broad passes spread
attention across ~70 files. Each finding is tagged with the pass(es) that
surfaced it. Tags: **Fix Now**, **Watch List**, **Informational**. No finding
qualified for a **Covered by Epic N** tag this round.

Schema drift check confirmed clean: new `boards`/`columns` tables,
`items.isAttached`, and `boards.showAttachedChildren` are correctly paired
camelCase/snake_case, use `position REAL NOT NULL`, and match
`client/src/types.ts` field-for-field. No `workItemId`/`cardId`/stale-`boardId`
leftovers; `WorkflowView.tsx` and `KanbanColumn.tsx` are fully gone with zero
dangling references.

Overall shape: the extraction discipline is genuinely good — the
`client/src/components/workflow/` hook decomposition and the new
`server/src/lib/` modules (`columnRanges.ts`, `boardCascade.ts`,
`attachedCascade.ts`, `workflowItems.ts`, `getOrNotFound.ts`) are model
examples. The Epic 3 core traced clean under a dedicated line-by-line pass:
the attached-descendant cascade fires on **every** server path that changes a
parent's workphase (move endpoint, PUT reparent/attach, MCP `move_item`, DnD
via `/move`); a detached middle node correctly halts its whole branch
(attached grandchildren under it do NOT follow — by construction); attach-ON
snaps to the parent's current workphase, detach-OFF keeps the item's own;
valid attached children never double-render; cycle prevention is enforced
server-side and mirrored in the UI via shared `lib/hierarchy.ts`. The
findings below are the edges that didn't get the same treatment.

---

## Fix Now

### 1. `workflows.ts` DELETE misses cascade cleanup its FKs require → FK-violation 500 + partial delete `[Correctness & Security]`
**File:** `server/src/routes/workflows.ts` lines 143–166 (correct pattern:
`server/src/routes/projects.ts:84–149`)

The workflow delete route cleans up only **same-project** items
(`items.projectId === workflow.projectId`), boards, workphases, and the
workflow. It never deletes:

- **`labels`** — `labels.workflowId` is a real FK (schema:127). With
  `PRAGMA foreign_keys = ON`, `db.delete(workflows)` throws
  `SQLITE_CONSTRAINT_FOREIGNKEY` if any label references the workflow.
- **Workflow-scoped `notifications`** — `notifications.workflowId` is a real
  FK (schema:195). Notifications created by `triggersNotification` moves
  (items.ts:232) carry `workflowId`; any that survive block the delete the
  same way.
- **Cross-project / inherited items** in this workflow's workphases —
  `items.workphaseId` is a real FK (schema:110). Only same-project items are
  removed, so an item from a child project inheriting this workflow still
  references a workphase and `db.delete(workphases)` throws. This contradicts
  the route's own GET, which serves items across "all projects that inherit
  it" via `getWorkflowItems`.

Any of these throws mid-sequence — after items/boards/workphases were already
deleted, with no wrapping transaction — leaving the DB half-torn-down and
returning a generic 500. `projects.ts::deleteProjectById` already does all
three correctly.

**Fix:** Mirror the workflow-scoped cleanup from `deleteProjectById` — gather
items by `projectId` OR `workphaseId ∈ workflow's workphases`, delete `labels`
and workflow-scoped `notifications` before the workflow (ideally via a shared
`deleteWorkflowById` helper), inside one `db.transaction()`.

---

### 2. Non-existent `parentId` is silently stored — and with attach-by-default, the item becomes invisible on every board `[Correctness & Security + Epic 3 focused pass]`
**Files:** `server/src/routes/items.ts` PUT (168, 175–183), POST (85–88, 115);
`client/src/components/workflow/useItemManagement.ts:16`

`items.parentId` is a self-referential FK that is **not** DB-enforced
(Drizzle SQLite caveat). POST and PUT persist any `parentId` without an
existence check; the subsequent parent lookup returns `undefined`, so the
workphase-sync/cascade silently skips. The focused pass traced the full
consequence: because `isAttached` defaults to `1`, an item with a bogus (or
later-deleted) parent is (i) excluded from top-level board rendering by
`getWorkphaseItemsFrom`'s `!(isAttached && parentId)` filter and (ii) never
nested, because no real parent card exists to render it under. **The item is
invisible on every board**, reachable only by detail deep-link. Cycle
protection exists (`isItemDescendant`); existence doesn't. Only reachable via
MCP/API (the UI dropdown offers real items), but MCP is a first-class client
in this app.

**Fix:** Validate `parentId` exists (400/404) before persisting, in both POST
and PUT. Same class, lower priority: `move`/`create` with an invalid
`workphaseId` surfaces as an opaque FK-driven 500 rather than a validated 400.

---

### 3. MCP `create_item` still requires `workphase_id`, contradicting the attached-child behavior it documents `[Consistency & Drift]`
**File:** `server/src/mcp.ts` line 82

`required: ['title', 'project_id', 'workphase_id']` — but the `is_attached`
description on line 80 says an attached item "is placed in the parent's
current workphase regardless of workphase_id", and the underlying route
(`POST /api/items`) never requires `workphaseId`. An agent creating an
attached child via MCP is forced to supply a bogus `workphase_id` the route
silently ignores.

**Fix:** Drop `workphase_id` from the `required` array (or require it only
when no `parent_id`/`is_attached` is given).

---

### 4. Item delete-cascade logic lives in a route file, and its dependent-table list is duplicated in `projects.ts` `[File Responsibility + Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts` lines 282–305 (`collectDescendantIds`,
`deleteItemById`); `server/src/routes/projects.ts` lines 104–116

Two related problems, one extraction:

- `deleteItemById` is exported from `items.ts` and imported by
  `workflows.ts:6` — cascade logic reused across route files but physically
  living inside one of them. This is exactly the shape
  `server/src/lib/boardCascade.ts` was created to solve.
- `deleteProjectById` re-inlines the same dependent-table list (itemLabels →
  activityLog → notifications → attachments → chatThreads/chatMessages →
  items) in its own per-item loop. The knowledge of which tables reference an
  item now lives in two places — when Epic 7 wires up chat/attachments more
  fully, forgetting one site orphans rows (the same class of bug Epic 1's
  audit flagged for grandchildren).

**Fix:** Extract `collectDescendantIds`/`deleteItemById` into
`server/src/lib/itemCascade.ts` (matching the `boardCascade.ts` convention)
and have `deleteProjectById`'s loop call it (or share one `itemChildTables`
cleanup routine). The label-by-`labelId` cross-project cascade stays separate.

---

### 5. Test file `itemFilters.test.ts` doesn't match the module it tests `[Consistency & Drift]`
**File:** `client/src/components/workflow/itemFilters.test.ts`

It imports `getWorkphaseItemsFrom`, `getAttachedChildrenFrom`,
`computeChildCounts` from `./useItemManagement` — there is no `itemFilters.ts`.
Every other new test this epic is co-located `module.test.ts`
(`boardDndUtils.test.ts`, `hierarchy.test.ts`, `positions.test.ts`).

**Fix:** Rename to `useItemManagement.test.ts`.

---

### 6. Dead export: `reloadBoards` from `useBoardManagement` `[Consistency & Drift]`
**File:** `client/src/components/workflow/useBoardManagement.ts` line 66

`reloadBoards: loadBoards` is returned but nothing in the repo destructures or
calls it (`BoardView.tsx` pulls only the other six return values).

**Fix:** Remove the unused `reloadBoards` key.

---

### 7. Stale file reference in `ColumnRow` comment `[Consistency & Drift]`
**File:** `client/src/types.ts` line 78

Comment says `ColumnRow` "Mirrors ColumnRow in server/src/routes/columns.ts";
the type is actually declared in `server/src/lib/columnRanges.ts:6`.

**Fix:** Point the comment at `server/src/lib/columnRanges.ts`.

---

### 8. Board form input/select class strings duplicated, ignoring existing `pillUtils` constants `[Duplication & Abstraction]`
**Files:** `client/src/components/BoardToolbar.tsx:163, :179` (input),
`:90, :147` (select); `WorkphaseManagerPanel.tsx:43`;
`ColumnEditorModal.tsx:130`

The exact input string
`px-3 py-1.5 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50`
appears verbatim in **4 places**, the matching select string in **2**.
`pillUtils.ts` already establishes the convention (`INPUT_BASE`,
`SELECT_BASE`, `BTN_PRIMARY`…) and these files already import from it — but
re-inlined the larger input/select variants. Near-variants have already
drifted: `ColumnEditorModal.tsx:130` adds `w-full`; `ChildrenSection.tsx:181`
and `BoardColumn.tsx:189` use `focus:border-blue-500/60` + `focus:ring`, so
the "same" control now has three focus treatments.

**Fix:** Add `INPUT_LG` and `SELECT_SM` constants to `pillUtils.ts` and
replace the inline strings (Tailwind guide §2: same 5+ classes in 3+ places →
named constant).

---

### 9. Confirm-delete button pattern (markup + state + error logic) duplicated across 3 components `[Duplication & Abstraction]`
**Files:** `client/src/components/BoardColumn.tsx:33, :53–62, :111–130`;
`WorkphaseManagerPanel.tsx:73–91, :116–127`; `AgentsModal.tsx:187`

BoardColumn (column delete) and WorkphaseManagerRow (workphase delete) each
independently re-implement: `confirmDelete` state + local error state + a
`handleDelete` that try/catches `onDelete`, sets an error message, and clears
confirm on failure + the inline Delete/Cancel button pair. The red Delete pill
class `text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded
bg-red-500/10` is identical in **3 files** (add AgentsModal). Markup *and*
behavior duplicated with the same reason to change.

**Fix:** Extract a `ConfirmDeleteButton` component (owns confirm/error state,
the two-button markup, and the try/catch) taking `onDelete: () =>
Promise<void>` + a label.

---

## Watch List

### 10. PUT re-syncs workphase and cascades on *every* attached-item update, even when parent/attach didn't change `[Epic 3 focused pass — Correctness]`
**File:** `server/src/routes/items.ts:175–183`

The post-update block computes `resultingAttached`/`resultingParentId` from
the *current* row when those fields aren't in the body — so a
title/description-only PUT on any attached child still re-writes
`workphaseId = parent.workphaseId` and runs
`cascadeWorkphaseToAttachedDescendants(...)`. Normally a redundant no-op write
(plus an `updatedAt` bump on every attached descendant per unrelated edit) —
but if the child's workphase has diverged from its parent's (see Finding 12),
an innocuous title edit **silently relocates** the child and its subtree.

**Fix:** Gate the re-sync on `parentId !== undefined || isAttached !==
undefined` — only run it when the parent link or attach flag actually changed.

---

### 11. Cross-project reparent/create isn't validated; `workphaseId` follows the new parent but `projectId` never updates `[Epic 3 focused pass — Correctness]`
**Files:** `server/src/routes/items.ts:83–97` (POST), `:168–183` (PUT);
`server/src/mcp.ts:171–201`

On reparent, the child's `workphaseId` snaps to the new parent's workphase but
`projectId` is untouched. A parent in a different project/workflow leaves the
item with `projectId = A` while sitting in a workphase owned by workflow B —
project and board no longer agree; it vanishes from project A's filtered view
and nests under the parent on workflow B's board. The UI dropdown scopes
candidates to the same project (`ChildrenSection.tsx:21–24`), so this is
MCP/API-only — but unguarded there. Related client note:
`getAttachedChildrenFrom`/`computeChildCounts` ignore `filterProjectId`, so a
filtered inherited view would nest/count a foreign-project child.

**Fix:** Reject a `parentId` whose `projectId` differs (or propagate the
parent's `projectId` to the item and its descendants). Pairs naturally with
Finding 2's existence check.

---

### 12. Migration 0007 defaults *all* existing items to `is_attached = 1` with no workphase backfill `[Epic 3 focused pass — Correctness]`
**File:** `server/drizzle/0007_attached_children.sql:1`

`ADD COLUMN is_attached INTEGER NOT NULL DEFAULT 1` is SQLite-safe, but it
makes every pre-existing child "attached": (1) children that had their own
board position silently collapse into their parent cards on first
post-migration load — a visible behavior change; (2) any existing child whose
stored `workphaseId` differs from its parent's is now divergent, and nothing
reconciles it until the parent next moves — at which point, per Finding 10,
even a title edit relocates it.

**Fix:** Either backfill `is_attached = 0` for rows that already have a
`parent_id` (preserving prior display), or document attached-by-default as
intentional and backfill those children's `workphaseId` to their parent's.

---

### 13. Roadmap's "drag-and-drop gesture to attach/detach" is not implemented `[Epic 3 focused pass — scope gap]`
**File:** `client/src/components/workflow/useBoardDnd.ts` (whole file);
`client/src/components/KanbanCard.tsx:160–193`

Epic 3's roadmap line names a DnD gesture to attach/detach. The DnD layer has
no attach/detach path — attach/detach exists only via the detail-panel
checkbox and child-badge button, and attached children are deliberately
non-draggable read-only rows (`onPointerDown` stops propagation), so there's
no drag affordance to detach either. Not a bug (the checkbox path works, and
non-draggable attached children make the "drag an attached child into a
column" inconsistency impossible by construction) — but it is an
**incomplete deliverable of this epic**, not a future one, so it's flagged
here rather than tagged Covered by Epic N.

**Fix:** Implement the gesture before calling Epic 3 done, or consciously
descope it (update the roadmap line if so).

---

### 14. Multi-step cascade/move/reorder mutations run without a transaction `[Correctness & Security]`
**Files:** `items.ts` DELETE cascade (294–319), move (197–246), PUT
reparent-then-sync-then-cascade (171–183); `workflows.ts` DELETE (143–166);
`projects.ts::deleteProjectById` (84–149);
`attachedCascade.ts::cascadeWorkphaseToAttachedDescendants` (25–34); reorder
loops in `items.ts` 257–262, `workphases.ts` 80–84, `columns.ts` 132–134

Each is a sequence of independent `.run()` calls; a mid-sequence failure
leaves partial state. Watch List for a single-user app, but it's the largest
class of latent inconsistency in this audit. Good in-repo examples to follow:
`boardCascade.ts::deleteBoardsById`, `workphases.ts` DELETE (101–105), and
`createDefaultBoard` (24–53) all wrap their work in `db.transaction()`.

**When to fix:** Wrap each cascade/move/reorder in `db.transaction()` as those
routes are next touched; Finding 1's fix should land inside one from day one.

---

### 15. Reorder endpoints diverge in validation rigor `[Correctness & Security + Consistency & Drift + Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts` 249–265, `workphases.ts` 72–85
(unvalidated) vs `columns.ts` 108–137, `projects.ts` 152–178 (hardened)

All four `PATCH /reorder` handlers share the same shape
(`Array.isArray` guard → loop of `db.update(...).set({ position })`), but the
two added/hardened recently validate each entry's `id`/`position` types and
404 on missing ids with `missingIds`, while `items` and `workphases` iterate
straight into the update: a missing/non-numeric `position` writes a
bad/`undefined` value; an unknown `id` silently no-ops. Pre-existing gap, only
reached via trusted client DnD — but two nearly-identical endpoint pairs now
enforce different rules.

**Fix:** A shared `applyReorder(table, orders)` helper with the array guard,
finite-number validation, and existence check built in, used by all four.
(The per-table Drizzle binding makes the abstraction slightly awkward — if it
fights back, just copying the `columns.ts` validation into `items`/
`workphases` closes the real gap.)

---

### 16. `ChildrenSection.tsx` owns two responsibilities: parent-editing and children-listing `[File Responsibility]`
**File:** `client/src/components/item-detail/ChildrenSection.tsx` lines 36–61,
98–126 (parent dropdown + attach toggle) vs 63–92, 128–207 (children list +
create form)

Roughly 40% of this 210-line file edits the *current item's own* parent
relationship — a different concern from listing/creating its children. The two
blocks share no state. Related error-surface inconsistency from the focused
pass: `handleChildAttachedToggle` (:63–70) logs failures to `console.error`
only, while its sibling `handleAttachedToggle` (:50–61) sets `parentError` for
the user to see.

**Fix:** Split out a `ParentSection` (reparent dropdown + attach toggle), or
rename to reflect both responsibilities; align the two toggles' error surfaces
while in there.

---

### 17. `ProjectPage.tsx` mixes concerns; its `buildParentOptions` re-implements `lib/hierarchy` tree math `[File Responsibility + Duplication & Abstraction]`
**File:** `client/src/components/ProjectPage.tsx` lines 27–49
(`buildParentOptions`), 58–109 (inline metadata editing), 111–168 (tab state),
328–400 (subprojects list + delete confirm); compare
`client/src/lib/hierarchy.ts:29`

At 418 lines this is the largest client file in the audit. The clearest seam:
its locally-defined `buildParentOptions` is a pure tree-walk with zero JSX
dependencies, and a *second implementation* of the
`lib/hierarchy.buildParentOptions` that `ChildrenSection` already uses — the
ProjectPage version adds depth-indented labels (`'·'.repeat(depth)`), which
the shared helper lacks. Per the established rule (shared tree math lives in
`client/src/lib` — extend it, never duplicate inline), the lib should grow the
feature rather than ProjectPage carrying its own walk.

**Fix:** Add an optional indent/`depthLabel` option to
`lib/hierarchy.buildParentOptions` and route both callers through it. The
metadata-editing and subprojects JSX are more debatable splits — leave unless
the file grows further.

---

### 18. `api.ts` is a single 499-line file spanning 9+ API domains `[File Responsibility]`
**File:** `client/src/api.ts`

Projects, Workflows, WorkPhases, Boards, Columns, Items, Attachments, Labels,
Notifications, Item Types, and Agents each get a `// ====` section in one
file. Each function is a uniform 5-line fetch wrapper, so readability isn't
badly hurt yet, but the natural seam — one module per domain mirroring
`server/src/routes/*.ts` — only gets more valuable as Epics 4/5/6 add domains.

**When to fix:** Before it crosses ~700 lines or the next epic's endpoints
land: split into `client/src/api/boards.ts` etc. with a barrel
`api/index.ts`.

---

### 19. `BoardToolbar.tsx` bundles five independent control clusters `[File Responsibility]`
**File:** `client/src/components/BoardToolbar.tsx` (190 lines)

Board switcher, board CRUD (each form with its own open-state), add-column
trigger, manage-workphases trigger, and child-default-workphase selector —
five clusters with independent local state. Scope is intentional (the header
comment says so) and each cluster is small.

**When to fix:** If any cluster grows, extract it as a sibling component
(e.g. `BoardSwitcher`) so the toolbar stays layout/composition.

---

### 20. Count badge and amber "attention" badge duplicated between BoardColumn and UnsortedBucket `[Duplication & Abstraction]`
**Files:** `BoardColumn.tsx:98` / `UnsortedBucket.tsx:30` (count badge);
`BoardColumn.tsx:104` / `UnsortedBucket.tsx:33` (amber badge)

Two exact 2-place duplications between sibling board components with the same
visual language and reason to change.

**Fix:** `COUNT_BADGE` / `ATTENTION_BADGE` constants (or tiny `<CountBadge>` /
`<AttentionBadge>` components) co-located with the board components.

---

### 21. Repeated workphase-header + card-list JSX in `BoardColumn.ExpandedSubRow` and `UnsortedBucket` `[Duplication & Abstraction]`
**Files:** `client/src/components/BoardColumn.tsx:240–266`;
`UnsortedBucket.tsx:42–64`

Both render a workphase sub-header + `SortableContext` wrapping a
`flex flex-col gap-1.5` of `<KanbanCard>` with the identical prop set
(`itemTypes`, `childCount`, `getAttachedChildren`, `defaultExpanded`,
`onCardClick`); ExpandedSubRow only adds a droppable ref + `isOver` highlight.

**Fix:** Extract a `WorkphaseCardList` sub-component taking items + optional
droppable id, so the card-prop wiring stays single-sourced as KanbanCard's
props evolve.

---

### 22. `KanbanCard` re-implements `pillUtils` tokens and helpers `[Duplication & Abstraction]`
**Files:** `client/src/components/KanbanCard.tsx:6–27` vs
`client/src/components/item-detail/pillUtils.ts:6–39`

KanbanCard defines its own `PILL_BASE`, `depthLabel`, and `typePillProps`,
duplicating pillUtils' `PILL`, `depthLabel`, `typePillClass`/`typePillStyle` —
and `PILL_BASE` hardcodes `text-[10px]` where `PILL` uses the `text-micro`
theme token. KanbanCard is the most-rendered component, so the drift risk is
real.

**Fix:** Import the helpers/tokens from `pillUtils.ts`; delete the local
copies.

---

### 23. Server-side item/project tree-walks are triplicated with no shared module `[Duplication & Abstraction + File Responsibility]`
**Files:** `server/src/routes/items.ts:136–142` (`isItemDescendant`),
`:282–292` (`collectDescendantIds`), `:27–35` (`computeDepth`);
`projects.ts:47–53` (`isDescendant`), `:62–71`, `:160–169`;
`workflows.ts:15–28` (`addDepths`);
`server/src/lib/attachedCascade.ts:7–22` (`getAttachedDescendantIds`)

`isDescendant` and `isItemDescendant` are byte-for-byte identical modulo the
table; the "parentId === id → 400" + descendant-check reparent guard is
copy-pasted into **3 handlers** (projects PUT, projects reorder, items PUT);
and three BFS/recursive walkers over `items.parentId` differ only in
predicate (collect-all / attached-only / membership short-circuit). The client
consolidated this exact math into `lib/hierarchy.ts`; the server never did.

**Fix:** A shared `isSelfRefDescendant(table, ofId, candidateId)` +
`assertValidReparent()` guard; optionally one parametrized
`walkDescendants(rootId, { predicate })` in `server/src/lib/itemTree.ts` —
natural to co-locate with Finding 4's `itemCascade.ts` extraction. The three
walkers have genuinely different needs, so consolidating them is a judgment
call, not a mandate.

---

### 24. `columns.ts` POST and PUT duplicate the full range-validation block `[Duplication & Abstraction]`
**File:** `server/src/routes/columns.ts:25–43` (POST), `:75–94` (PUT)

Both run the identical three-step validation (rankMap membership,
start-after-end, sibling-overlap with the same error strings and
`conflictingColumnId` payload). Two handlers that must stay in lockstep or
create/update enforce different rules.

**Fix:** `validateColumnRange({ startWorkphaseId, endWorkphaseId }, rankMap,
siblingColumns)` returning a discriminated result, called by both.

---

### 25. "Append at end" position math repeated in 5 places `[Duplication & Abstraction]`
**Files:** `server/src/routes/boards.ts:26`, `columns.ts:45`,
`workphases.ts:25–27`, `items.ts:102–106`, `server/src/mcp.ts:210`

`max(existing.position) + 1.0` (with empty-list base case) is hand-written in
four POST handlers plus the MCP `move_item` tool. The MCP copy is the
interesting one: it recomputes the append position caller-side because the
move endpoint takes `position` from the caller — the same rule now lives on
both sides of the API.

**Fix:** A `nextPosition(rows)` helper server-side; consider having the move
endpoint default the append position so MCP need not compute it.

---

## Informational

### 26. Board `unsorted.invalidItems` is unreachable dead logic — and if ever made live, attached children would double-render `[Correctness & Security + Epic 3 focused pass — reconciled]`
**Files:** `server/src/routes/boards.ts:113–122`,
`server/src/lib/columnRanges.ts:71–87`, `server/src/lib/workflowItems.ts:11–15`;
`client/src/components/BoardView.tsx:227–237`, `UnsortedBucket.tsx:66–79`

Two passes hit this from opposite sides; reconciled here. `computeUnsorted`'s
`invalidItems` (null or out-of-workflow `workphaseId`) is fed
`getWorkflowItems(...)`, which already filters to exactly the in-workflow set
— so `invalidItems` is **always `[]`** and the `needsAttention` safety net
never fires. The focused pass adds: the client renders `invalidItems`
unfiltered by attach state, so if the safety net is ever fed real data,
an attached child with an invalid workphase would render **twice** (top-level
"No valid status" card *and* nested under its parent) — and those cards get
`childCount` but no `getAttachedChildren`, so their expand toggle is a dead
control. Either drop the branch, or make it live correctly: feed it the
unfiltered item set server-side and exclude attached+parented rows (and wire
`getAttachedChildren`) client-side.

### 27. Attached-children edge-state notes `[Epic 3 focused pass]`
Small stored-state and UX inconsistencies, none currently user-visible:

- **Delete ignores attach state** (`items.ts:308–319`): deleting a parent
  deletes ALL descendants, detached ones included. Consistent with the
  pre-existing whole-subtree delete model, but "detached = independent" could
  lead a user to expect detached children to survive. **Product decision
  worth confirming.**
- **Stale position after detach**: neither `attachedCascade.ts:25–34` nor the
  PUT re-sync recompute `position` on workphase change — irrelevant while
  attached (nested render ignores position), but a later detach surfaces the
  item at an arbitrary position.
- **Attached-but-parentless is representable** (`items.ts:175`): reparenting
  to null with `isAttached = 1` leaves the flag set; harmless today (renders
  as a normal root card) but mildly inconsistent stored state.
- **Optimistic DnD state doesn't mirror the cascade**
  (`useBoardDnd.ts:125–140`): only the dragged item's `workphaseId` updates
  locally; cascaded descendants self-heal on `loadBoard()`. No visible glitch
  because attached children render nested regardless — noted for completeness.

### 28. Icon SVGs re-inlined per component `[Duplication & Abstraction]`
X/close path duplicated 5× (`App.tsx:237`, `AgentsModal.tsx:212`,
`BoardColumn.tsx:127`, `WorkphaseManagerPanel.tsx:124`,
`AttachmentsSection.tsx:56`); trash icon 2× within `ProjectPage.tsx`
(:236, :391). Note for whenever an icon set (`<XIcon>`, `<TrashIcon>`) is
introduced; not urgent.

### 29. `tests/ui/boards.spec.ts` covers five feature areas in one file `[File Responsibility]`
Board basics, inherited-workflow visibility, inherited read-only mode,
child-project-with-own-workflow, and workflow creation share one 371-line
file, while `boards-layer.spec.ts` already split board/column management out.
Each `describe` is cohesive; split (e.g. `inherited-workflow.spec.ts`) only if
it grows.

### 30. Pre-existing repo-wide notes, not regressions from this work `[Consistency & Drift]`
- The app is single-theme dark (no `prefers-color-scheme`/`data-theme`
  anywhere) — true of every epic to date, so Tailwind guide §7 doesn't apply
  as a new gap.
- Raw `prettier --check` flags nearly every file old and new alike (no
  `.prettierrc` overrides); manual spot-check shows the new files match the
  project's established class-ordering style.
- MCP still exposes no `boards`/`columns` tools — already logged in the Epic 1
  audit as an ongoing per-epic expansion item, not re-flagged.
- `mvp-roadmap.md` prose calls the range table `board_columns`; the
  implementation consistently uses `columns` everywhere. Code-internal naming
  is consistent; only the planning-doc wording differs.

### 31. Positive confirmations `[all passes]`
- **`ENABLE_TEST_ROUTES` guard is safe:** the DB-truncating `/api/test/reset`
  mounts only on exact `=== 'true'` (default off); only `playwright.config.ts`
  sets it, pointed at `./data/test.db`; the committed `server/.env` does not
  set it.
- **Global error middleware now present** (`server/src/index.ts:54–57`),
  closing the Epic-1-era backstop gap. No empty/swallowed catch blocks
  anywhere in the audited files; client hooks all log and roll back via
  `loadBoard()`.
- **No SQL injection surface:** the one raw-SQL site
  (`runMigrations.ts:89–103`) uses bound parameters; everything else is
  parameterized Drizzle (`attachedCascade.ts` uses `eq()` only).
- **Epic 3 core semantics traced clean** (focused pass): cascade fires on
  every server path that changes a parent's workphase; detached middle nodes
  halt their branch; attach snaps / detach keeps workphase; attaching under an
  already-attached parent snaps to the already-synced workphase; no
  double-render for valid attached children; `computeChildCounts` agrees with
  what `getAttachedChildren` renders; cycle prevention enforced server-side
  and mirrored in the UI; migration 0007 registered in `_journal.json` and
  SQLite-safe; `showAttachedChildren` matches the roadmap's
  "indented / collapse" behaviors.

---

## Epic 3 Test Coverage Gaps

Good coverage exists for the core semantics: parent-move cascade through
grandchildren, detached-middle halting, reattach snap + cascade, reparent
workphase shift, cycle rejection, create-time attach/detach inheritance
(`server/tests/routes/items.test.ts:236–343`,
`tests/api/attachedChildren.spec.ts`), board rendering/toggle/badge/detach
(`tests/ui/attached-children.spec.ts`), and pure DnD math
(`boardDndUtils.test.ts`). **No test at all** for:

1. **MCP paths** — `create_item`/`update_item`/`move_item` with `is_attached`
   (including Finding 3's required-`workphase_id` contradiction): zero
   coverage.
2. **DnD cascade integration** — drag a parent across columns, assert attached
   children follow on server + reloaded client (the optimistic-state edge in
   Finding 27).
3. **Cross-project / cross-workflow reparent** (Finding 11) — nothing asserts
   what happens to `projectId` or board visibility.
4. **Non-existent / foreign `parentId`** (Finding 2) — the invisible-item
   consequence is unverified; likewise reparent-to-null while attached.
5. **Create with `is_attached: true` and no `parentId`** — only
   attached-with-parent is covered.
6. **Delete semantics for detached descendants** (Finding 27) — the
   cascade-delete test uses only default (attached) children.
7. **Migration 0007 backfill behavior** (Finding 12) — no migration-level
   test (consistent with the repo's general lack of them).

---

## Covered by Future Epics

Nothing this round. No pass finding matched a gap the roadmap names under a
specific epic. Finding 13 (missing DnD attach/detach gesture) is explicitly
NOT tagged Covered-by-Epic — it's an Epic 3 deliverable, and this is the
Epic 3 audit. Roadmap-adjacent items (MCP endpoint coverage) were already
logged in the Epic 1 audit as ongoing and are noted under Finding 30.

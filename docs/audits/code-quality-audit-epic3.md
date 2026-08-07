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

*Status is tracked inline per finding below (added retroactively 2026-08-06,
when `project_progress.md` — the memory file that had been informally
tracking resolution status — was retired in favor of tracking it here; see
`.claude/guides/audit-workflow.md` step 5 for the convention going forward).*

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

**Status:** ✅ Resolved 2026-07-17 — superseded rather than patched. Instead
of adding the missing cascades, the delete was redesigned: `DELETE
/api/workflows/:id` no longer deletes items at all. `items.workphaseId` is
`ON DELETE SET NULL`, so removing a workflow's workphases nulls the reference
and items survive (across every project that inherited the workflow),
surfacing as "Unknown status." Verified in current `workflows.ts`: DELETE
wraps board/notification/workphase/workflow cleanup in one `db.transaction()`.
POST also picked up a transaction wrapper later (see the #10–14 sweep below).
See the `architecture-data-modeling` and `architecture-board-column-workflow`
memories for the full SET-NULL rationale.

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

**Status:** ✅ Fixed. Verified in current `items.ts`: POST 400s
("`parentId` does not reference an existing item") before storing anything
when the supplied `parentId` doesn't resolve; PUT does the same on reparent.
The `workphaseId` half (both create and move) is also validated → 400 in the
current code.

---

### 3. MCP `create_item` still requires `workphase_id`, contradicting the attached-child behavior it documents `[Consistency & Drift]`
**File:** `server/src/mcp.ts` line 82

`required: ['title', 'project_id', 'workphase_id']` — but the `is_attached`
description on line 80 says an attached item "is placed in the parent's
current workphase regardless of workphase_id", and the underlying route
(`POST /api/items`) never requires `workphaseId`. An agent creating an
attached child via MCP is forced to supply a bogus `workphace_id` the route
silently ignores.

**Fix:** Drop `workphase_id` from the `required` array (or require it only
when no `parent_id`/`is_attached` is given).

**Status:** ✅ Fixed. Verified in current `mcp.ts`: `create_item`'s
`required` array is `['title']` only.

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

**Status:** ✅ Fixed, via a different route than suggested — DB-level
`ON DELETE CASCADE` (migration `0009`) rather than an app-level
`itemCascade.ts` extraction. Verified: `deleteItemById`/`collectDescendantIds`
no longer exist anywhere in `server/src`; item DELETE is now one
`db.delete(items)` over the subtree collected by
`server/src/lib/itemTree.ts::walkItemDescendants`, and dependent rows
(itemLabels, activityLog, notifications, attachments, chat threads/messages)
clean up via FK cascade with no app code needed at all.
`deleteProjectById`'s per-item loop and the label-delete itemLabels sweep
were removed accordingly. See the `architecture-data-modeling` memory.

---

### 5. Test file `itemFilters.test.ts` doesn't match the module it tests `[Consistency & Drift]`
**File:** `client/src/components/workflow/itemFilters.test.ts`

It imports `getWorkphaseItemsFrom`, `getAttachedChildrenFrom`,
`computeChildCounts` from `./useItemManagement` — there is no `itemFilters.ts`.
Every other new test this epic is co-located `module.test.ts`
(`boardDndUtils.test.ts`, `hierarchy.test.ts`, `positions.test.ts`).

**Fix:** Rename to `useItemManagement.test.ts`.

**Status:** ✅ Fixed — the file is now `useItemManagement.test.ts`.

---

### 6. Dead export: `reloadBoards` from `useBoardManagement` `[Consistency & Drift]`
**File:** `client/src/components/workflow/useBoardManagement.ts` line 66

`reloadBoards: loadBoards` is returned but nothing in the repo destructures or
calls it (`BoardView.tsx` pulls only the other six return values).

**Fix:** Remove the unused `reloadBoards` key.

**Status:** ✅ Fixed — `reloadBoards` no longer appears anywhere in
`client/src`.

---

### 7. Stale file reference in `ColumnRow` comment `[Consistency & Drift]`
**File:** `client/src/types.ts` line 78

Comment says `ColumnRow` "Mirrors ColumnRow in server/src/routes/columns.ts";
the type is actually declared in `server/src/lib/columnRanges.ts:6`.

**Fix:** Point the comment at `server/src/lib/columnRanges.ts`.

**Status:** ✅ Fixed — the comment now correctly points at
`server/src/lib/columnRanges.ts`.

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

**Status:** ✅ Fixed as specified. Verified: `pillUtils.ts` now defines
`INPUT_LG`/`SELECT_SM`, imported and used by `WorkphaseManagerPanel.tsx`,
`ColumnEditorModal.tsx`, and `BoardToolbar.tsx`. Didn't separately verify
whether the `BoardColumn.tsx`/`ChildrenSection.tsx` focus-treatment drift
noted above was reconciled — worth a glance next time either file is touched.

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

**Status:** ✅ Fixed. Verified: `client/src/components/ConfirmDeleteButton.tsx`
exists and is used by `BoardColumn.tsx`, `WorkphaseManagerPanel.tsx`, and
`AgentsModal.tsx` — the exact 3 sites named. Later folded into the same
"unify confirm delete button" pass per git history.

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

**Status:** ✅ Fixed. Verified in current `items.ts` PUT: the re-sync block
is gated exactly on `parentId !== undefined || isAttached !== undefined`,
with a comment citing this finding directly.

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

**Status:** ✅ Fixed for the write paths. Verified in current `items.ts`:
both POST and PUT reject a `parentId` belonging to a different project
(comments cite this finding directly). MCP inherits the fix for free as a
thin wrapper over the same REST routes. The client-side
`filterProjectId`-ignoring note is now moot — a foreign-project attached
child can no longer exist to mis-nest.

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

**Status:** ✅ Fully resolved — no backfill was needed. Verified directly
against `server/data/kanban.db`: 19 items existed before migration 0007 ran,
and zero of them had `parent_id` set — the "existing children suddenly
become attached, workphaseId diverges" risk had no rows to apply to.
`schema.ts`'s "attached-by-default is intentional" comment (commit `3c55f93`)
documents the decision.

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

**Status:** ✅ Addressed via conscious descope. `docs/planning/mvp-roadmap.md` carves out
a dedicated **Epic 3.5 — Drag-and-Drop Attach/Detach Gesture**, whose
rationale explicitly cites this finding. Not yet built — verified
`KanbanCard.tsx` still stops pointer-down propagation on attached-child
interactive elements, so the gesture genuinely doesn't exist yet, consistent
with Epic 3.5 being unstarted. (Epic 3.2 — item positioning — is now
sequenced before it; see `docs/planning/epic-3.2-decisions.md`.)

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

**Status:** ✅ Fixed, verified by re-checking every function this finding
named against current code: `items.ts` move/PUT/reorder, `workflows.ts`
DELETE, `projects.ts::deleteProjectById`, `workphases.ts` reorder/DELETE,
and `columns.ts` reorder all wrap in `db.transaction()`; `items.ts` DELETE's
cascade collapsed to one atomic statement once finding #4 moved dependent-row
cleanup to DB CASCADE; `attachedCascade.ts::cascadeWorkphaseToAttachedDescendants`
is never called without a caller-supplied `tx`. One adjacent gap in the same
bug class, not originally named here, was found and fixed separately:
`workflows.ts` POST's template/source-workphase insert loop wasn't
transactional — it now wraps the workflow insert + workphase loop +
`createDefaultBoard` call in one `db.transaction()` (verified above).

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

**Status:** ✅ Fixed as specified. Verified: `server/src/lib/reorder.ts`
exports `applyReorder`; `items.ts`, `workphases.ts`, and `columns.ts`
`PATCH /reorder` all call it (columns.ts's original hand-rolled version
became the reference implementation, now deduped too). `projects.ts` reorder
intentionally stayed bespoke — it validates `parentId` cycles, a genuinely
different shape the shared helper doesn't cover.

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

**Status:** ✅ Fixed. Verified: `client/src/components/item-detail/ParentSection.tsx`
exists, owning the current item's own parent link; `ChildrenSection.tsx`
keeps only listing/creating children + per-child attach toggle. The two
render as siblings in `ItemDetailPanel.tsx`. The error-surface alignment was
done too — `handleChildAttachedToggle` now sets a visible `childError`
matching `ParentSection`'s pattern.

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

**Status:** ✅ Fixed as specified. Verified: `lib/hierarchy.ts`'s
`buildParentOptions` now takes an `indent` param (default `false`); when
`true` it groups depth-first and prefixes labels, matching ProjectPage's old
bespoke walk. `ProjectPage.tsx`'s local copy is gone; it now calls the shared
helper with `indent: true`. The metadata-editing/subprojects JSX split was
left alone as suggested.

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

**Status:** ✅ Fixed 2026-08-06 — done earlier than planned, for a different
reason than expected. Originally deferred (see the now-superseded discussion
below) to wait for Epic 5's endpoints to actually push the line count past
~700. Instead the trigger ended up being Prettier's `printWidth: 120`: several
consumer files' imports from the single `api.ts` were exploding to 8–12 lines
once the whole codebase went under real Prettier enforcement, independent of
`api.ts`'s own length. Split into `client/src/api/` — one file per domain
(`projects.ts`, `workflows.ts`, `workflowTemplates.ts`, `workphases.ts`,
`boards.ts`, `columns.ts`, `items.ts`, `attachments.ts`, `labels.ts`,
`notifications.ts`, `itemTypes.ts`, `agents.ts`) plus `shared.ts` for the one
shared `API` base-path constant. **No barrel `api/index.ts`** — deviated from
the fix suggested above on purpose: no barrel/re-export pattern exists
anywhere else in this codebase, and `server/src/routes/*.ts` (the thing this
split mirrors) doesn't use one either — `server/src/index.ts` imports each
route module directly by path. A barrel here would have partly undone the
point of splitting, since a consumer needing several domains could still pull
a long re-exported list from one place. Consumers import directly from each
domain module instead (`from '../api/items'`, `from '../api/workflows'`,
etc.) — matches the codebase's one real precedent.

<details>
<summary>Original deferral discussion (superseded — kept for history)</summary>

Deliberately deferred, not fixed. Discussed rather than split:
Epic 4 (Quick Items) is unlikely to push `api.ts` past the threshold (it
extends the existing Items domain); Epic 5 (tag buckets) and Epic 6 (Inbox)
are the more likely triggers. A forward-looking note was added to
`docs/planning/epic-5-decisions.md` to re-check and do the split when Epic 5's
endpoints are actually drafted. Verified current line count: 498 — essentially
unchanged, still well under the ~700 threshold.

</details>

---

### 19. `BoardToolbar.tsx` bundles five independent control clusters `[File Responsibility]`
**File:** `client/src/components/BoardToolbar.tsx` (190 lines)

Board switcher, board CRUD (each form with its own open-state), add-column
trigger, manage-workphases trigger, and child-default-workphase selector —
five clusters with independent local state. Scope is intentional (the header
comment says so) and each cluster is small.

**When to fix:** If any cluster grows, extract it as a sibling component
(e.g. `BoardSwitcher`) so the toolbar stays layout/composition.

**Status:** Deliberately deferred, not fixed. The board toolbar is expected
to change significantly in the Epic 8+ interface-rework pass, so splitting
it now would likely be thrown away. Revisit only if that rework doesn't
happen or a cluster grows before then.

---

### 20. Count badge and amber "attention" badge duplicated between BoardColumn and UnsortedBucket `[Duplication & Abstraction]`
**Files:** `BoardColumn.tsx:98` / `UnsortedBucket.tsx:30` (count badge);
`BoardColumn.tsx:104` / `UnsortedBucket.tsx:33` (amber badge)

Two exact 2-place duplications between sibling board components with the same
visual language and reason to change.

**Fix:** `COUNT_BADGE` / `ATTENTION_BADGE` constants (or tiny `<CountBadge>` /
`<AttentionBadge>` components) co-located with the board components.

**Status:** ✅ Fixed. Verified: `client/src/components/boardBadges.tsx`
exists, exporting a `COUNT_BADGE` class-string constant and an
`AttentionBadge` component (taking `title`/`children` as props, since
BoardColumn's "broken" and UnsortedBucket's "needs attention" are different
meanings sharing only the look); both files import from it.

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

**Status:** ✅ Fixed. Verified: `client/src/components/WorkphaseCardList.tsx`
exists, taking `droppable`/`containerRef`/`isOver`/`isCardBeingDragged` as
optional props; `BoardColumn`'s `ExpandedSubRow` and both of
`UnsortedBucket`'s call sites (workphase groups and the Unknown-status
bucket) now route through it.

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

**Status:** ✅ Fixed. Verified: `KanbanCard.tsx` now imports `PILL_DEPTH`,
`depthLabel`, `typePillClass`, `typePillStyle` from `./item-detail/pillUtils`;
the local duplicates are gone.

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

**Status:** ✅ Fixed as specified. Verified: `server/src/lib/itemTree.ts`
exists with `isSelfRefDescendant` (generic over `items`/`projects`),
`assertValidReparent`, and `walkItemDescendants` (a parametrized BFS with
`predicate`/`includeRoot` options) — used by `items.ts` and, per Finding 4,
by item DELETE too. `attachedCascade.ts::getAttachedDescendantIds` is now a
thin wrapper over `walkItemDescendants`. `computeDepth` (items.ts) and
`addDepths` (workflows.ts) were deliberately left untouched — genuinely
different shapes, not the duplication this finding was about.

---

### 24. `columns.ts` POST and PUT duplicate the full range-validation block `[Duplication & Abstraction]`
**File:** `server/src/routes/columns.ts:25–43` (POST), `:75–94` (PUT)

Both run the identical three-step validation (rankMap membership,
start-after-end, sibling-overlap with the same error strings and
`conflictingColumnId` payload). Two handlers that must stay in lockstep or
create/update enforce different rules.

**Fix:** `validateColumnRange({ startWorkphaseId, endWorkphaseId }, rankMap,
siblingColumns)` returning a discriminated result, called by both.

**Status:** ✅ Fixed as specified. Verified: `server/src/lib/columnRanges.ts`
exports `validateColumnRange`, called by both POST and PUT in `columns.ts`.

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

**Status:** ✅ Fixed, plus the suggested scope addition. Verified:
`server/src/lib/positions.ts` exports `nextPosition`, used by `boards.ts`,
`columns.ts`, `workphases.ts`, `items.ts` POST, and `items.ts`'s move
handler. `PATCH /api/items/:id/move` now defaults `position` to the end of
the target workphase's list when the caller omits it, so MCP's `move_item`
no longer needs to precompute it — it just sends `workphaseId`. An explicit
`position` on a move still wins outright. Also logged as Q4 in
`docs/planning/epic-8-decisions.md`'s Open Questions: whether items need a
global cross-workphase order (no schema support exists today) — flagged, not
built.

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

**Status:** ✅ Reconciled, no code changes needed for the original two
halves — both were already fixed by the same commit (`634593a`) that
authored this finding, which just never got marked resolved. Verified in
current code: `boards.ts` feeds `computeUnsorted` from `getBoardScopeItems`
(not the old pre-filtering `getWorkflowItems`), so `invalidItems` is
genuinely live; `UnsortedBucket.tsx` excludes attached+parented rows
(`!(i.isAttached && i.parentId)`) before rendering the Unknown-status bucket,
and wires `getAttachedChildren` through. One real gap was found and closed
on top: an attached child's own `workphaseId` can go invalid independent of
its parent (the attach-cascade only fires on a *parent* move, never when a
workphase is deleted out from under the child directly) — added a permanent
E2E test in `tests/ui/attached-children.spec.ts` reproducing exactly that,
confirming the child renders once, nested, never duplicated into Unknown
status.

---

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

**Status:** Mixed — confirmed intentional where it was worth confirming;
otherwise unchanged. The "delete ignores attach state" product question was
answered as **keep current behavior** (whole-subtree delete regardless of
attach state) and is now guarded by a regression test in `items.test.ts`
citing this finding. "Attached-but-parentless" is now also covered by a test
confirming the flag stays set on null-reparent, same conclusion (harmless,
intentional). The other two sub-bullets (stale position after detach,
optimistic DnD state not mirroring the cascade) were re-verified against
current code and still stand exactly as described — no action taken, still
real but low-priority.

---

### 28. Icon SVGs re-inlined per component `[Duplication & Abstraction]`
X/close path duplicated 5× (`App.tsx:237`, `AgentsModal.tsx:212`,
`BoardColumn.tsx:127`, `WorkphaseManagerPanel.tsx:124`,
`AttachmentsSection.tsx:56`); trash icon 2× within `ProjectPage.tsx`
(:236, :391). Note for whenever an icon set (`<XIcon>`, `<TrashIcon>`) is
introduced; not urgent.

**Status:** ✅ Fixed, fully. Verified: `client/src/components/icons.tsx`
exports shared `XIcon`/`TrashIcon` components; `ProjectPage.tsx` imports and
uses `TrashIcon` at both former inline sites. The X-icon consolidation
picked up 2 more variants beyond the original 5 found during a later
re-check (`ModalShell.tsx`, `ItemDetailPanel.tsx`) and folded those into the
same shared pattern too.

---

### 29. `tests/ui/boards.spec.ts` covers five feature areas in one file `[File Responsibility]`
Board basics, inherited-workflow visibility, inherited read-only mode,
child-project-with-own-workflow, and workflow creation share one 371-line
file, while `boards-layer.spec.ts` already split board/column management out.
Each `describe` is cohesive; split (e.g. `inherited-workflow.spec.ts`) only if
it grows.

**Status:** Not addressed, no action taken — matches the finding's own
"only if it grows" threshold, which hasn't been hit. Still open, still
low-priority.

---

### 30. Pre-existing repo-wide notes, not regressions from this work `[Consistency & Drift]`
- The app is single-theme dark (no `prefers-color-scheme`/`data-theme`
  anywhere) — true of every epic to date, so Tailwind guide §7 doesn't apply
  as a new gap.
- Raw `prettier --check` flags nearly every file old and new alike (no
  `.prettierrc` overrides); manual spot-check shows the new files match the
  project's established class-ordering style.
- MCP still exposes no `boards`/`columns` tools — already logged in the Epic 1
  audit as an ongoing per-epic expansion item, not re-flagged.
- `docs/planning/mvp-roadmap.md` prose calls the range table `board_columns`; the
  implementation consistently uses `columns` everywhere. Code-internal naming
  is consistent; only the planning-doc wording differs.

**Status:** All four re-verified 2026-08-06, all still accurate/unchanged.
Quotes/arrow-parens/printWidth conventions were separately discussed in
depth (informal conclusion: the codebase already follows a de facto
consistent style — single quotes, no arrow-parens on single params, wide
lines — worth codifying in `.prettierrc` eventually, but no config change
has been made, so `prettier --check` still flags nearly everything). The
other three sub-notes are simply still true as written — none require
action.

---

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

**Status (checked 2026-08-05, each re-verified against current test files
2026-08-06):**
- **#1 (MCP paths) — still genuinely open.** No `mcp`-specific test file
  exists in `server/tests/`. Lower priority pending a decision (logged as Q5
  in `docs/planning/epic-8-decisions.md`) on whether testing the MCP layer
  is worth it given it's a thin wrapper over the already-tested REST routes.
- **#2 (DnD cascade integration) — ✅ closed.** The "too unreliable to
  automate" assumption didn't hold up when tried: a real mouse-based drag
  simulation against this app's `PointerSensor` setup ran reliably.
  `tests/ui/attached-children.spec.ts` now has "dragging a parent card
  across columns cascades its attached child," asserting both the UI
  nesting and the server-side cascade.
- **#3 (cross-project reparent) — was already closed** by existing tests
  citing finding #11 (verified: `items.test.ts` has both a POST and a PUT
  case) — nothing new needed.
- **#4 (non-existent/foreign parentId) — ✅ closed.** The "non-existent
  parentId → 400" half was already tested for POST+PUT; added the missing
  half, "reparenting to null while attached leaves `isAttached` flagged, not
  cleared" (finding #27's stored-state note).
- **#5 (create with `is_attached: true`, no parentId) — ✅ closed.** Added,
  confirming a parentless item's `isAttached` and that an explicit
  `workphaseId` is respected with no parent to override it.
- **#6 (delete semantics for detached descendants) — ✅ closed.** Added a
  detached child + grandchild case confirming whole-subtree delete still
  fires regardless of attach state (finding #27's "product decision worth
  confirming" — confirmed as-is, not changed).
- **#7 (migration 0007 backfill) — moot, not testable.** Drizzle's migrator
  (`__drizzle_migrations` table) runs each migration exactly once ever;
  verified 0007 already ran against 0 `parent_id` rows and cannot run again.

---

## Covered by Future Epics

Nothing this round. No pass finding matched a gap the roadmap names under a
specific epic. Finding 13 (missing DnD attach/detach gesture) is explicitly
NOT tagged Covered-by-Epic — it's an Epic 3 deliverable, and this is the
Epic 3 audit. Roadmap-adjacent items (MCP endpoint coverage) were already
logged in the Epic 1 audit as ongoing and are noted under Finding 30.

# Code Quality Audit — Epic 1 Complete (2026-07-05)

Each finding is tagged: **Fix Now**, **Watch List**, or **Covered by Epic N**.

Schema drift check confirmed clean: all Epic 1 renames (`boards→workflows`,
`work_items→items`) landed correctly in both `schema.ts` and the actual SQLite DB.

---

## Fix Now

### 1. Stale field names in `client/src/types.ts`
**File:** `client/src/types.ts` lines 88, 103, 121

Three interfaces still use `workItemId` instead of `itemId`, left over from the
pre-rename era:

```typescript
// ActivityLogEntry.workItemId  → should be itemId
// Attachment.workItemId        → should be itemId
// Notification.workItemId      → should be workItemId renamed to itemId
```

The server returns Drizzle's camelCased column name (`itemId`), not `workItemId`.
The current UI doesn't access these fields directly (it just renders `type`, `content`,
`createdAt`), so this is dormant — no visible bugs. But it will bite as soon as any
component tries to use `entry.workItemId` for linking or filtering.

**Fix:** Rename `workItemId` → `itemId` in `ActivityLogEntry`, `Attachment`, and
`Notification` interfaces in `types.ts`.

---

### 2. Item delete only goes one level deep (orphans grandchildren)
**File:** `server/src/routes/items.ts` lines 251–267

The delete handler manually fetches direct children and deletes them, but doesn't
recurse to grandchildren:

```typescript
const children = db.select().from(items).where(eq(items.parentId, req.params.id)).all();
for (const child of children) {
  db.delete(activityLog).where(eq(activityLog.itemId, child.id)).run();
  db.delete(items).where(eq(items.id, child.id)).run();
}
// grandchildren are now orphaned — their parent_id points to a deleted row
```

SQLite foreign keys are enabled (`PRAGMA foreign_keys = ON`), but `items.parent_id`
has no `.references()` in the Drizzle schema (self-referential FKs aren't declared in
Drizzle's SQLite adapter), so there's no automatic cascade. Grandchildren remain in the
DB pointing to a deleted parent.

**Fix:** Replace the manual loop with a recursive delete (collect all descendant IDs
before deleting) or use a SQL recursive CTE.

---

### 3. `client/CLAUDE.md` is completely stale
**File:** `client/CLAUDE.md`

The file predates Epic 1. It still references `boards`, `work_items`, `work_item_types`,
`BoardView.tsx`, old route paths (`/api/boards`, `/api/work-items`), old component
structure, and describes the MCP server as "not yet built" (it is built). It also
documents a TODO about notification wiring that has since been implemented.

**Fix:** Full rewrite to reflect current architecture. (Done as part of this
orientation — see updated `client/CLAUDE.md`.)

---

### 4. `npm audit` findings — client Vite vulnerability (Windows)
**Severity:** High (client), Moderate × 5 + High × 1 (server dev deps)

- **Client:** `vite 8.0.0–8.0.15` — NTLMv2 hash disclosure via UNC path handling on
  Windows, and `server.fs.deny` bypass on Windows alternate paths. This is a dev server
  vulnerability; it does not affect the production build, but you're developing on
  Windows so it's worth fixing.
- **Server dev deps:** `drizzle-kit@0.31.10` (latest) has 4 moderate advisories tracing
  to `esbuild` inside drizzle-kit's studio command. `npm audit fix --force` would
  downgrade to 0.18.1 (breaking). We are already on latest; this is a stale advisory
  where npm's fix direction is wrong. **Intentionally unresolved** until drizzle-kit
  publishes a non-breaking fix. Impact: dev-only (drizzle studio), local machine only.

**Fix:** `npm audit fix` in `client/` only (done — 0 vulnerabilities). Server advisory
documented as exception above.

---

## Watch List

### 5. `effectiveWorkflow` not memoized in `App.tsx`
**File:** `client/src/App.tsx` lines 140–150

The workflow inheritance traversal runs as an IIFE inside the render function —
recomputed on every render. `getAncestors()` is O(depth) per call. At current scale
(small project trees) this is imperceptible. With deep trees (10+ levels) or frequent
re-renders (notification polling every 15s triggers a re-render) it could accumulate.

**When to fix:** If the UI shows jank with a large project tree, wrap with `useMemo`.
Not urgent now.

---

### 6. Notification polling — no WebSocket or SSE
**File:** `client/src/App.tsx` lines 50–57

Notifications are polled every 15 seconds with `setInterval`. This means up to a 15s
delay before a notification appears, and generates constant HTTP traffic even when idle.

**When to fix:** For a single-user local app this is fine. If the app ever runs as a
shared service, replace with WebSocket or Server-Sent Events. Not a concern for MVP.

---

### 7. `workflows.projectId` is nullable — no enforced ownership rule
**File:** `server/src/db/schema.ts` line 51

`workflows.projectId` is nullable by design — it allows workflows to exist
without a project association. This was intentional for the migration, but the current
app has no UI path to create an unowned workflow. An orphaned workflow would be
invisible in the UI.

**When to fix:** Consider making `projectId NOT NULL` once the migration period is
confirmed complete and no orphaned workflows remain. Check with `SELECT * FROM
workflows WHERE project_id IS NULL`.

---

## Bruno Collection Gaps

The Bruno collection (`/bruno/`) is useful for manual endpoint testing but is
significantly incomplete. Current coverage:

| Folder | Has | Missing |
|---|---|---|
| `projects/` | list, get, create, update, delete ✅ | reorder |
| `workflows/` | list, get, create | update, delete |
| `columns/` | create, delete | update, reorder |
| `items/` | get, create, move | update, delete, reorder, add comment |
| `workflow-templates/` | (assumed list) | — |
| `agents/` | nothing | all |
| `notifications/` | nothing | all |
| `labels/` | nothing | all |
| `attachments/` | nothing | all |
| `item-types/` | nothing | all |

Not a blocker — Bruno is a manual dev convenience, not part of the test suite. But
updating it alongside the API keeps it useful as a quick-test tool. Add missing
requests whenever you're working on a route.

---

## Covered by Future Epics (do not fix prematurely)

| Finding | Epic |
|---|---|
| Labels system is flat (no bucket structure, no And/Or logic) | Epic 5 |
| `chat_threads` / `chat_messages` have no API routes or UI | Epic 7 |
| `attachments` UI not built | Epic 7 |
| Notification `triggersNotification` wires to column moves only — no assignment/mention triggers | Epic 8 |
| No dashboard or quick-nav sidebar | Epic 8 |
| MCP exposes only 8 of ~20 API endpoints | Ongoing — expand per epic |

# Codebase Walkthrough — Epic 3 (Attached & Detached Items)

> Snapshot as of Epic 3 complete (2026-08-06). Covers only what Epic 3 added on
> top of Epics 1–2 — for the app's foundational architecture (data model,
> full server/client tour, how to run everything), see
> `epic1and2-codebase-walkthrough.md` first if you haven't already.

## Mental Model

Items already had a `parent_id` tree from Epic 1. Epic 3 gave that tree a real
behavioral meaning: every child is either **attached** (rides along with its
parent — always the same workphase) or **detached** (has its own independent
workphase). Attached is the default. The whole feature is, at its core: one
boolean column (`items.is_attached`), one cascade function that keeps attached
descendants in sync whenever a parent's workphase changes, and a client that
renders attached children nested inside their parent's card instead of as
siblings on the board.

What's deliberately **not** here yet: a board drag gesture to attach/detach.
Today it's checkbox/toggle-driven only (item detail panel, child badge) —
that gesture is split out to Epic 3.5.

---

## Suggested Reading Order

Read these in this order — each builds on the last.

1. **`server/drizzle/0007_attached_children.sql`** (2 lines) — the entire
   schema change: `items.is_attached` and `boards.show_attached_children`,
   both `INTEGER NOT NULL DEFAULT 1`. Start here so you know exactly what's
   new before anything else.
2. **`server/src/lib/attachedCascade.ts`** (~25 lines) — the feature's whole
   engine. `getAttachedDescendantIds` (BFS that stops descending at a
   detached child) and `cascadeWorkphaseToAttachedDescendants` (writes the
   parent's current `workphaseId` onto every attached descendant). Read this
   before anything that calls it.
3. **`server/src/lib/itemTree.ts`** — the shared descendant-walk and
   reparent-guard helpers `attachedCascade.ts` and `items.ts` both build on:
   `isSelfRefDescendant`, `assertValidReparent`, `walkItemDescendants`
   (the generic BFS `getAttachedDescendantIds` is a thin wrapper over).
4. **`server/src/routes/items.ts`** — where the cascade actually gets
   invoked. Look at, in order: POST (create-time attach inheritance —
   an attached child snaps to its parent's workphase immediately, ignoring
   any `workphaseId` passed in), PUT (reparent/attach-toggle re-sync — note
   it's gated on `parentId !== undefined || isAttached !== undefined`, so a
   plain title edit never touches workphase), `PATCH /:id/move` (the main
   board-drag path), DELETE (whole-subtree delete — deliberately ignores
   attach state; see Gotchas below).
5. **`server/src/mcp.ts`**, the `move_item` tool — same cascade, reached via
   MCP instead of the board.
6. **`server/src/routes/boards.ts`** + `server/src/lib/workflowItems.ts`'s
   `getBoardScopeItems` + `columnRanges.ts`'s `computeUnsorted` — how attach
   state affects what surfaces in the board's Unsorted bucket. An attached
   child with a stale/invalid workphase must **not** appear there
   double-rendered against its parent — see the client filter in the next step.
7. **`client/src/components/KanbanCard.tsx`** — the nested rendering:
   `AttachedChildRow` (recursive, so grandchildren nest too), the expandable
   `childCount` badge, and why attached rows are non-draggable
   (`onPointerDown` stops propagation — no drag gesture yet, see Mental Model).
8. **`client/src/components/UnsortedBucket.tsx`** — the client-side half of
   step 6: filters `invalidItems` to exclude `isAttached && parentId` rows
   before rendering the "Unknown status" bucket, so a stray attached child
   doesn't double-render.
9. **`client/src/components/item-detail/ParentSection.tsx`** and
   **`ChildrenSection.tsx`** — the two attach/detach control surfaces.
   `ParentSection` edits *this* item's own parent link + attach checkbox;
   `ChildrenSection` lists/creates children and toggles *each child's* attach
   state independently. Split into two files on purpose — different concerns,
   no shared state.
10. **`client/src/components/BoardToolbar.tsx`**'s `showAttachedChildren`
    checkbox — the board-level default (expanded/indented vs. collapsed),
    persisted on `boards.showAttachedChildren`.
11. **Tests, as the executable spec** — `server/tests/routes/items.test.ts`'s
    `describe('attached children', ...)` block, `tests/api/attachedChildren.spec.ts`,
    and `tests/ui/attached-children.spec.ts`. Once the code above makes sense,
    these confirm it and cover the edge cases called out below.

---

## Server Reference

### `server/src/lib/attachedCascade.ts`

```typescript
getAttachedDescendantIds(rootId, tx?)
  // BFS over rootId's children, only descending through attached ones.
  // A detached child stops its whole branch — its own children (even if
  // attached) never get visited, by construction.

cascadeWorkphaseToAttachedDescendants(rootId, tx?)
  // Reads rootId's current workphaseId, writes it onto every id returned by
  // getAttachedDescendantIds. No-ops if rootId isn't found.
```

Both take an optional trailing `tx?: Tx` — pass it to fold the call into a
caller's `db.transaction()` (every real caller does, since the cascade must
commit atomically with whatever changed the parent's workphase in the first
place); omit it only for standalone/test use.

### Where the cascade is called from

Every server path that can change a parent's workphase calls
`cascadeWorkphaseToAttachedDescendants` inside the same transaction as the
write that changed it:

| Path | File | Trigger |
|---|---|---|
| Board drag / move | `items.ts`, `PATCH /:id/move` | `workphaseId` actually changes |
| Reparent or attach-toggle | `items.ts`, `PUT /:id` | `parentId` or `isAttached` present in the request body |
| MCP | `mcp.ts`, `move_item` | same move endpoint under the hood |

Attach-ON (`isAttached: true`) snaps the item to its **parent's current**
workphase immediately, as part of the same PUT. Attach-OFF leaves the item's
`workphaseId` exactly where it was — detaching doesn't move anything.

### Create-time inheritance (`items.ts` POST)

```typescript
const attached = isAttached !== undefined ? Boolean(isAttached) : true;
const resolvedWorkphaseId = attached && parent ? parent.workphaseId : workphaseId;
```

An attached child (the default) ignores whatever `workphaseId` the caller
passed and takes its parent's instead. This is what finding #3 in the Epic 3
audit was about — MCP's `create_item` used to *require* `workphase_id` even
though attached children ignore it; that requirement is gone now.

### Reads: keeping attached children out of Unsorted

`boards.ts` builds its item set from `getBoardScopeItems` (project-scoped,
not workphase-filtered — see `epic1and2-codebase-walkthrough.md`'s Epic 2
notes on why), then `computeUnsorted` splits out anything with a
null/out-of-workflow `workphaseId` into `invalidItems`. That set is
**unfiltered by attach state on the server** — the client
(`UnsortedBucket.tsx`) is what excludes `isAttached && parentId` rows before
rendering, so an attached child whose workphase went stale still renders
exactly once, nested under its parent — never also as a top-level "No valid
status" card. If you're touching either `computeUnsorted` or
`UnsortedBucket`, keep that split in mind.

---

## Client Reference

### Nested rendering (`KanbanCard.tsx`)

`KanbanCard` renders a `childCount` badge when the item has attached
children; expanding it renders `AttachedChildRow` for each one.
`AttachedChildRow` calls itself recursively via `getAttachedChildren`, so
grandchildren (and further) nest correctly. Attached rows stop pointer-down
propagation, which is what makes them non-draggable today.

### Two separate control surfaces, on purpose

- **`ParentSection.tsx`** — this item's own parent dropdown + "Attached"
  checkbox. Candidates are scoped to the same project and exclude the item's
  own descendants (cycle prevention, via `lib/hierarchy.buildParentOptions` —
  the client-side counterpart to the server's `itemTree.ts`).
- **`ChildrenSection.tsx`** — lists/creates this item's children, with a
  per-child Attached/Detached toggle button. New children inherit
  `childDefaultWorkphaseId` (a board-level default) or fall back to the
  parent's own workphase.

They were one file before the Epic 3 audit (finding #16) flagged the mixed
concerns; kept split since.

### Board-level default: `showAttachedChildren`

`BoardToolbar.tsx` has a small checkbox bound to
`activeBoard.showAttachedChildren`, persisted via `PUT /api/boards/:id`. It
only controls the *default* expand/collapse state on load — each card's
expand toggle is still independent afterward.

---

## Gotchas / Non-Obvious Behavior

- **Delete ignores attach state.** Deleting a parent deletes its *entire*
  subtree, detached descendants included — this was a deliberate confirmed
  decision (audit finding #27), not an oversight. "Detached" only means
  "independent workphase," not "independent lifecycle."
- **Position goes stale after detach.** Neither the cascade nor the PUT
  re-sync recompute `position` on a workphase change. Irrelevant while
  attached (nested rendering ignores position), but a later detach can
  surface the item at an arbitrary position in its new workphase. Known,
  not fixed.
- **Attached-but-parentless is representable.** Reparenting to `null` while
  `isAttached: true` leaves the flag set. Harmless — it just renders as a
  normal root card — but it's a state worth knowing exists if you're
  debugging something that assumes attached always implies has-a-parent.
- **A detached child halts the cascade for its whole branch.** If A is
  attached to B, but B is detached from C, moving C does **not** move B —
  and therefore does not move A either, even though A itself is attached.
  Attachment only propagates through an unbroken attached chain.
- **Migration 0007 defaulted every pre-existing item to `is_attached = 1`
  with no backfill**, and that was fine: verified directly against the DB
  that zero pre-existing items had `parent_id` set at the time the migration
  ran, so nothing was actually reachable by the "existing child suddenly
  attached" risk this could otherwise have posed.

---

## Tests as Spec

If you want to see every behavior above asserted concretely rather than
described:

- `server/tests/routes/items.test.ts` → `describe('attached children', ...)`
  — cascade through grandchildren, detached-middle halting, reattach snap,
  reparent workphase shift, cycle rejection, create-time inheritance,
  parentless-but-attached, delete-ignores-attach-state.
- `tests/api/attachedChildren.spec.ts` — the same core semantics at the HTTP
  layer.
- `tests/ui/attached-children.spec.ts` — nested rendering, the
  show-by-default toggle, the child badge, the invalid-workphase-while-
  attached edge case, a real mouse-drag cascade test, and all three
  detail-panel controls (reparent dropdown, per-item attach checkbox,
  per-child attach toggle).

# Codebase Walkthrough — Epic 3.2 (Item Positioning & Board-Scoped Ordering)

> Snapshot as of Epic 3.2 complete (2026-09-07). Covers only what Epic 3.2
> changed/added on top of Epics 1–3 — for foundational architecture see
> `epic1and2-codebase-walkthrough.md`, and for attached/detached semantics
> see `epic3-codebase-walkthrough.md` first if you haven't already (this
> epic builds directly on both).

## Mental Model

Before this epic, `items.position` was resolved ad hoc per call site and
scoped to a single workphase — fine until you needed to reorder attached
children, or interleave items across a merged column's covered workphases,
or avoid two independently-empty workphases colliding at the same bootstrap
value. Epic 3.2 replaced all of that with one idea, applied uniformly:

**The client never computes or sends a final position number. It sends
relative intent — "put this immediately before/after that item, by id" —
and the server resolves the real value against that item's true current
neighbor, queried fresh, inside the same transaction as the write.**

Three things fall out of that one idea:

1. **Comparison scope had to become explicit and mostly-flat.** A
   detached/root item's position is comparable against every other active
   item in its *whole workflow*, not just its own workphase (§2). Attached
   children stay in their own narrower scope — `(parentId, isAttached)` —
   since they're a locally-sortable list under one parent, not a workflow-
   wide thing (§3).
2. **Done items needed a way out of the numbering entirely**, since their
   count only grows and would otherwise force runaway reindexing for no
   visible benefit — solved by dropping `position` to `null` on a terminal
   transition and ordering by `completedAt` instead (§6). This is also why
   there's now a computed `positionScope` field on every item response:
   `"attached-siblings"`, `"workflow"`, or `"none"` — telling a client what
   an item's `position` is even comparable against.
3. **Projects got pulled onto the exact same system.** The old batch
   `PATCH /projects/reorder` used to hand-roll its own loop with per-entry
   validation that couldn't see a colluding second entry in the same
   batch — a real, API-reachable cycle-write bug. `positionResolver.ts` was
   generalized to be table-generic specifically so projects could stop
   being a special case: `PATCH /projects/:id/move` now resolves one
   project at a time, the same way items do.

What's deliberately **not** here: the board-level drag gesture's visual
polish (a real anchor/side hover cue). This feature ships a minimal
functional default — dropping on card X resolves to anchor X, side
`before` — with the polished cue split out to Epic 3.5, which also owns a
known, currently-live limitation: dnd-kit's swap-preview reflow can
interfere with `resolveDropSide`'s rect measurement mid-drag, so some
bottom-half drops that should resolve `after` still resolve `before`
today (see Gotchas).

---

## Suggested Reading Order

1. **`docs/wiki/item-positioning/README.md`** — read this in full before
   touching code. It's the actual spec (resolution algorithm, comparison
   scope, reindexing triggers, active/done split) — everything below is
   "here's where that's implemented," not a restatement of the rules.
2. **`server/src/lib/coarsestFit.ts`** (~40 lines) — the standalone
   rounding primitive, worth reading in isolation first since everything
   else builds on it: given two neighbors, find the least-precise decimal
   value that still falls strictly between them.
3. **`server/src/lib/positionResolver.ts`** — the core algorithm, table-
   generic (works for both `items` and `projects`). Read
   `resolvePositionByAnchorAndSide` first (the public entry point/dispatch),
   then `resolveAfterTarget`/`resolveBeforeTarget` (the neighbor-lookup +
   coarsest-fit-or-reindex-and-retry loop), then `reindexPositionsInScope`
   and `exceedsMagnitudeThreshold` (the two lazy reindex triggers).
4. **`server/src/lib/itemPositionScope.ts`** — the items-only layer on top:
   `classifyPositionScope` (the `positionScope` field's actual rule),
   `positionScopeFor` (the same rule as a SQL predicate, workflow-wide
   expansion included), `sharesPositionScope` (anchor/subject scope-match
   guard), `withPositionScope` (attaches the computed field to an outgoing
   row).
5. **`server/src/routes/items.ts`, `PATCH /:id/move`** — where it all comes
   together for items: anchor validation (existence, has-a-position,
   `sharesPositionScope` check) *before* the transaction opens, then inside
   it — anchor-resolved position, or the workphaseId-only "keep existing
   position" exception, or append-fallback, followed by the Part 6
   terminal-transition override, then the attached-descendant cascade
   (Epic 3) and activity logging.
6. **`server/src/routes/projects.ts`, `PATCH /:id/move`** — the same shape
   for projects: `parentId`/`prevId`/`nextId` instead of
   `workphaseId`/`anchorId`/`side`, but the same "always re-derive the true
   current siblings, never trust the client's guess" principle. Read its
   header comment — it explains why `prevId`/`nextId` were chosen over the
   more natural-sounding `beforeId`/`afterId`.
7. **`server/src/routes/workphases.ts`, `PUT /:id`'s `isTerminal` flip
   handling** — the other place Part 6 shows up: flipping a workphase
   terminal/non-terminal has to re-validate every column covering it (a
   merged column can't span terminal + non-terminal) and backfill every
   item already sitting there, in the same transaction.
8. **`client/src/components/workflow/boardDndUtils.ts`** — the pure,
   unit-tested client-side layer: `resolveDropTarget` (decides
   reorder-vs-move from a dnd-kit drop), `resolveDropSide` (before/after
   from cursor geometry), `applyItemMove` (fires the request, updates
   local state or falls back to `loadBoard()` on rejection).
9. **`client/src/components/ProjectSidebar.tsx`** + **`sidebar/SortableProjectRow.tsx`**
   — the project-tree equivalent: `findPrevSibling`/`findNextSibling`
   resolve the dropped position's neighbors client-side, purely to name
   `prevId`/`nextId` in the request — the server still re-derives and
   verifies both before trusting them.
10. **Tests, as the executable spec** — `server/tests/lib/positionResolver.test.ts`
    and `server/tests/lib/itemPositionScope.test.ts` for the algorithm in
    isolation; `server/tests/routes/items.test.ts` (`describe` blocks
    tagged with `TC-2.*`/`TC-5.*`/`TC-6.*`) for the route-level contract;
    `tests/api/itemRepositioningAttachedSiblings.spec.ts` and
    `tests/ui/item-repositioning-cross-{column,project}-dnd.spec.ts` for
    end-to-end. `docs/test-plans/item-positioning/` is the human-readable
    index into all of it, organized by wiki section.

---

## Server Reference

### `positionResolver.ts` — the algorithm

```typescript
resolvePositionByAnchorAndSide(table, scopeWhere, tx, side, anchorId?)
  // Dispatch: anchorId given -> resolveBeforeTarget/resolveAfterTarget.
  // No anchorId -> resolvePrependAsFirst/resolveAppendAsLast (side still
  // matters: prepend queries the true first row, append the true last).

resolveAfterTarget(prevId, context) / resolveBeforeTarget(nextId, context)
  // 1. Query the anchor's true current position (fresh, every call).
  // 2. Look for a true bounding neighbor beyond it (gt/lt against the full
  //    scope, never limited to what the caller has loaded).
  // 3. coarsestFit(prev, next) — if it fits, done.
  // 4. If precision is exhausted (coarsestFit returns null): reindex the
  //    scope, then retry once (fitOrReindexAndRetry's recursion, capped at
  //    MAX_REINDEX_TRIES = 1 — a second failure is a bug, not a valid state).
  // 5. If no true neighbor exists at all: append/prepend fallback instead.

reindexPositionsInScope(context)
  // Reads the whole scope ordered by (position, createdAt) — isNotNull
  // guarded, so done items (null position) are never swept in — and
  // rewrites 1, 2, 3, ... preserving relative order.

exceedsMagnitudeThreshold(candidate, context)
  // candidate >= 1000 AND candidate >= (scope row count + 100) -> reindex
  // before appending. The +100/1000 floor means a scope that genuinely
  // holds 1000+ items doesn't reindex on every single append.
```

`resolveAppendPosition` is a thin, deliberately-kept wrapper over
`resolveAppendAsLast` for the 8 call sites that are pure "put this at the
end" appends (item creation, `PUT` reparent, workphase terminal-transition
backfill) — spelling those as
`resolvePositionByAnchorAndSide(table, scope, tx, 'after')` would read as
if a side/anchor choice were actually being made.

### `itemPositionScope.ts` — items-only vocabulary on top

This is where "workflow-wide, not workphase-wide" actually becomes a SQL
predicate. `positionScopeFor` expands a detached/root item's scope to
*every* workphase id in the same workflow (`workphaseIdsInSameWorkflow`),
always excluding attached children (they render nested, not as flat list
members) and — via `excludeId` — the subject's own possibly-just-updated
row. `classifyPositionScope` is the same rule expressed as a label instead
of a predicate, for the read-only `positionScope` API field.
`sharesPositionScope` exists because two different things can carry the
same `PositionScope` label ("workflow") while being genuinely
incomparable — two different workflows, or an attached child under a
*different* parent — so `PATCH /items/:id/move` uses it to reject an
anchor that isn't actually in the subject's resulting comparison space.

### `items.ts`, `PATCH /:id/move` — where it comes together

Read top to bottom: field validation, then anchor validation (existence,
`position !== null`, `sharesPositionScope`) *against plain `db`, before the
transaction opens* — deliberate, per audit Finding #12: a
`db.transaction` callback in better-sqlite3 only rolls back on `throw`, so
a bail-out signaled by returning `false` from *inside* it (after some
other write already ran) would still commit. None of these checks need
transaction-scoped consistency anyway, since this handler never
inserts/deletes the rows it's checking.

Inside the transaction, in order:
1. Resolve `position` — anchor-resolved, or the raw `position` field, or
   the workphaseId-only "keep existing position" exception (see next
   section), or append-fallback.
2. Part 6 terminal-transition override — if the item is detached/root and
   its target workphase just became terminal, `position` is forced to
   `null` and `completedAt` is stamped, *overriding* whatever step 1
   resolved. The reverse transition clears `completedAt`.
3. Write the update, then cascade to attached descendants (Epic 3),
   activity log, notification insert — same transaction, so a mid-failure
   can't strand any of it.

### `projects.ts`, `PATCH /:id/move` — the same shape, `prevId`/`nextId`

Structurally identical to the items handler, minus the attach/terminal
concerns projects don't have. The interesting part is the header comment
explaining the naming: `prevId`/`nextId` name the project's *resulting*
predecessor/successor, deliberately not `beforeId`/`afterId` ("I go before
X" vs. "X goes before me" reads ambiguously either direction). Both are
independently re-verified as real, current siblings in the *resulting*
scope before being trusted for the midpoint math — this is what fixes a
real sidebar bug by construction: even if the client's drag guessed wrong
because a collapsed parent's true children were hidden, the server always
re-derives the truth.

### `workphases.ts`, `PUT /:id` — the `isTerminal` flip

Flipping a workphase's `isTerminal` isn't just a field write: every board
column covering it has to be re-checked (`findColumnsMixingTerminalAfterFlip`
in `columnRanges.ts`) — a merged column can't legally span both a terminal
and non-terminal workphase (half its cards would sort by `completedAt`,
half by `position`) — and every item already sitting in that workphase
needs its `position`/`completedAt` backfilled in the same transaction,
mirroring the move handler's own terminal-transition logic. Non-terminal→
terminal preserves existing order via a synthetic `completedAt` sequence
(not just "now" for everyone); terminal→non-terminal re-appends via the
shared resolver.

---

## Client Reference

### `boardDndUtils.ts` — pure, unit-tested drop resolution

`resolveDropTarget` is the one function to understand if you're touching
board drag-and-drop: it decides same-visual-group reorder vs. genuine
cross-column move by checking whether the **active item's current
workphaseId** is already a member of the **target column's covered set** —
not by comparing to whichever specific card happens to be hovered. This is
what makes merged-column interleaving actually work (wiki §4). Note the
`activeWorkphaseId` parameter's doc comment: it must be the item's
pre-drag workphase, not a live lookup, because the caller's drag-over
handler optimistically re-buckets the dragged item for live visual
preview — re-deriving it mid-drag would see that already-mutated value and
misjudge the drop.

`applyItemMove` is the whole client-side contract for "what happens after
the server responds": success updates local state directly from the
response; rejection falls back to `loadBoard()` (full resync) rather than
trying to reconcile a stale local guess. It's dependency-injected
(`moveItem` passed in, not imported) purely so it's testable without
mocking the module — see `boardDndUtils.test.ts` for both paths asserted
directly (TC-2.11).

### `ProjectSidebar.tsx` / `sidebar/SortableProjectRow.tsx`

`findPrevSibling`/`findNextSibling` compute the dropped position's
neighbors from the client's current (rendered) view, purely to name
`prevId`/`nextId` in the `PATCH /projects/:id/move` request — same "send
relative intent, not a computed number" contract as items, and same
"server re-verifies, never trusts" backstop on the other end.

---

## Gotchas / Non-Obvious Behavior

- **A workphaseId-only move with no anchor does *not* get a fresh
  position** — a deliberate exception (wiki §2 addendum), not a bug. Since
  position is workflow-scoped, an item's existing value stays meaningful
  across a workphase change; recomputing one would be pointless churn.
  This is also exactly the shape the MCP `move_item` tool sends
  (`{workphaseId}` alone) — if you're debugging "why didn't this item's
  position change," check whether this exception is why. The one
  exception-to-the-exception: an item with *no* existing position
  (reopening a done item, first-time workphase assignment) still needs the
  append fallback.
- **Attaching/detaching, and reparenting while staying attached, both
  force a fresh position** — the opposite case from above. The rule (wiki
  §2's scope-change-reassignment table) is: fresh position exactly when the
  comparison *scope* changes without an explicit anchor, never when it's
  unchanged. A redundant re-attach to the same parent (no actual scope
  change) is a deliberate no-op (TC-2.23).
- **Anchoring against a done item is rejected**, not silently resolved
  against nothing — a done item has no stored `position` (Part 6), so
  there's nothing to anchor against. Real error, not an edge case to work
  around.
- **`positionScope: "none"` has two different causes that look identical
  over the wire**: a done item (terminal workphase, ordered by
  `completedAt`) and an item with no `workphaseId` at all (unsorted —
  e.g. its workphase was deleted, `SET NULL`'d). Same value, different
  reason — the wiki's §2 wording was broadened during the epic-done
  closeout specifically because this wasn't obvious from the field alone.
- **The two reindex triggers are genuinely independent and lazy** — no
  scheduled job, no whole-project sweep, ever. Tight-gap fires mid-insert
  when `coarsestFit` exhausts precision; magnitude fires on append past
  the `max(1000, count+100)` threshold. Active items reindex as *one*
  coordinated cross-workphase scope (never per-workphase independently) —
  this is what prevents two separately-reset scopes from later colliding.
- **Known, currently-live drag limitation, deferred to Epic 3.5**:
  dnd-kit's live swap-preview reflow can interfere with
  `resolveDropSide`'s rect measurement during a real mouse-driven drag, so
  several bottom-half card drops (intending `after`) still resolve to
  `before` in practice — see the `test.skip` cases in
  `tests/ui/item-repositioning-cross-column-dnd.spec.ts` and
  `-cross-project-dnd.spec.ts` (documented, not silently broken; the pure
  `resolveDropSide` function itself is correct and fully unit-tested — the
  gap is real-drag rect measurement, not the geometry logic).

---

## Tests as Spec

- `server/tests/lib/positionResolver.test.ts` — the algorithm in
  isolation: coarsest-fit, append/prepend fallback, tight-gap
  reindex-and-retry, bootstrap, scope isolation between attached-siblings
  and workflow-wide spaces.
- `server/tests/lib/itemPositionScope.test.ts` — `classifyPositionScope`'s
  full state table, `sharesPositionScope`'s mismatch cases.
- `server/tests/routes/items.test.ts` — the route-level contract, largely
  organized around the `TC-2.*`/`TC-5.*`/`TC-6.*` case IDs from
  `docs/test-plans/item-positioning/` (search for a `TC-` id in a test
  name to jump straight from a wiki rule to its automated proof).
- `tests/api/itemRepositioningAttachedSiblings.spec.ts` — attached-sibling
  reorder at the HTTP layer, with an isolation control group proving one
  parent's reorder doesn't touch another's children.
- `tests/ui/item-repositioning-cross-column-dnd.spec.ts` and
  `-cross-project-dnd.spec.ts` — real mouse-driven drag gestures,
  including the documented Epic-3.5-deferred skips above.
- `docs/test-plans/item-positioning/INDEX.md` — the rollup; each suite
  file under that folder is the human-readable spec-plus-test-pointer for
  one wiki section.

# Code Quality Audit — Epic 3.5 Story 1 (2026-09-11)

Scope note: audited commit `9f7ab91` ("implementing Story 1 — Server:
atomic reparent-with-placement"), the first story of the in-progress
**Epic 3.5** (last tagged epic: `epic-3-2-complete`). Story-scoped rather
than epic-scoped, per explicit request. Every changed file was in scope;
the bulk of what's new is the hierarchy primitive (`lib/itemHierarchy.ts`),
the depth-cap math added to `lib/itemTree.ts`, the reindex-disclosure
collector threaded through `lib/positionResolver.ts`, the shrunk
`routes/items.ts` handlers, and the new `items.hierarchy.test.ts` suite.
Run as four parallel passes per `.claude/guides/audit-workflow.md`; each
finding is tagged with the pass(es) that surfaced it. Both Fix Now
correctness findings and the highest-severity Watch List items were
re-traced by hand against current code before inclusion. Tags: **Fix
Now**, **Watch List**, **Covered by Epic N**, **Informational**. One
finding qualifies for **Covered by Epic 3.5** — the Epic 3.5 roadmap names
Story 2 as the client half of this work.

Overall shape: the refactor delivers what the story promised. The
primitive composes the existing tree/position/cascade helpers rather than
re-implementing any of them, PUT and PATCH /move are now genuinely plumbing
(validate → transaction → apply → respond), every write in
`applyHierarchyRequest` sits inside one `tx` with no early returns, cycle
and depth guards are consistent across lib/move/PUT/POST, and the
client/server/Bruno/wiki descriptions of the request shape agree. No pass
found anything that corrupts data. The real gaps are (a) two validation
holes in the new validator — a self-anchor that throws inside the
transaction and a cross-workflow workphase move that keeps an old-scope
position — (b) small-grain lookup helpers that were copied rather than
moved when the lib was extracted, and (c) the story's own atomicity claim
being asserted by structure but not by a test.

---

## Fix Now

### 1. A workphase change across workflows keeps a position resolved in the *old* workflow's scope `[Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:242–249`

```ts
} else if (req.workphaseId !== undefined && resulting.workphaseId) {
  if (!(workphaseChanged && item.position !== null)) updates.position = resolveAppendPosition(...);
}
```

The keep-position branch fires whenever `workphaseId` changed and the item
already has a position. That is only sound when the old and new workphases
belong to the same workflow (the positioning §2 addendum's premise —
"position is workflow-wide"). Two reachable paths violate it:

- **New in this commit:** `PATCH /move { parentId: <item in project B>,
  isAttached: false, workphaseId: <phase in B's workflow> }` — a Free
  cross-workflow reparent that names its target workphase in the same
  request. Traced by hand: `scopeChanged` is false (Free before and after),
  the keep branch fires, and `nullForeignWorkphasePositions` correctly sees
  the new workphase as *not* foreign and leaves the row alone — so the item
  lands in B's workflow-wide list carrying an A-scoped number. The existing
  test (`items.hierarchy.test.ts:412–424`) only covers the two-step version
  (reparent → nulled → re-file → append).
- **Pre-existing, carried forward by the rewrite:** `PATCH /move
  { workphaseId: <phase in another workflow> }` with no reparent (what MCP
  `move_item` can send). `projectChanged` is false so the nulling helper
  never runs; validation doesn't check that `workphaseId` belongs to the
  item's effective workflow at all.

Consequence is mis-placement (arbitrary order, possible position collision
that the next anchored move reindexes away), not corruption — but it
directly contradicts wiki positioning §7.3 ("re-filing takes the
no-position path") and the fix is small.

**Fix (as originally proposed):** In the keep branch, keep only when
`workflowIdForWorkphase(item.workphaseId, tx) === workflowIdForWorkphase(resulting.workphaseId, tx)`;
otherwise fall through to the append fallback. Optionally, in
`validateHierarchyRequest`, reject a `workphaseId` whose workflow isn't
`effectiveWorkflowIdForProject(resulting.projectId)` — closes the MCP path
with a 400. Add a one-step cross-workflow test beside the two-step one.

**Status (2026-09-11):** scope narrowed by decision, not yet fixed. Story
1's API exists for the board DnD, and a board renders exactly one workflow
— items on it may span projects, but never workflows — so neither path
above is reachable from the board gesture; only non-board callers (MCP
`move_item`, scripts) can hit it. Decision: `PATCH /items/:id/move` may
**reject** any request whose resulting `workphaseId` belongs to a workflow
other than `effectiveWorkflowIdForProject(resulting.projectId)` (a
route-level 400 in `routes/items.ts`, *not* in `validateHierarchyRequest`
— the primitive is shared with PUT, which will later carry legitimate
cross-workflow moves and must not inherit the restriction). The primitive's
keep-position branch stays as-is for now. The PUT-side mechanics of moving
an item into a project with a different workflow (re-filing the workphase,
taking the append path) are deferred — **Covered by Epic 7** on Nathan's
direction; the roadmap names Epic 7's surface (detail panel with editable
status and parent relationships) rather than this mechanic explicitly.
**Resolved (2026-09-11):** `crossWorkflowMoveError` in
`server/src/routes/items.ts`, run after `validateHierarchyRequest` in
`PATCH /move` only. Rejects both shapes — an explicit `workphaseId` whose
workflow isn't the resulting project's effective workflow, and a reparent
into a project on a different workflow that also names a `workphaseId` —
with distinct 400 messages. Compared project-to-project rather than
against the item's stored workphase, so the §7.3 re-file of an
already-foreign item still passes. Skipped when a project resolves to no
workflow. Tests under "workflow-changing workphaseId is rejected at the
route" in `items.hierarchy.test.ts`. The primitive is untouched.

### 2. `anchorId` equal to the moving item passes validation, then throws inside the transaction → 500 `[Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:147–172` (validation), `:225–232` (apply); `server/src/lib/positionResolver.ts:86–99`

Validation loads the anchor row, sees a non-null position, and
`sharesPositionScope` returns true when the item isn't changing scope — so
`{ anchorId: <self>, side: 'after' }` is accepted. `scope()` is then built
with `excludeId = item.id` (`itemPositionScope.ts:103`), so
`getTargetPosition` can't find the anchor inside the scope and throws
`positionResolver: could not find id …`. Verified by hand. The transaction
rolls back and the global handler (`index.ts:54`) logs it, so nothing
partial commits — but a client error surfaces as `Internal server error`.
Not covered by any test (`items.test.ts:483` uses a self-anchor only with
an invalid `side`, which 400s earlier). Same latent gap existed in the
pre-3.5 handler; this commit rewrote the validator and is the place to
close it.

**Fix:** At the top of the anchor block in `validateHierarchyRequest`:
`if (req.anchorId === item.id) return 'anchorId cannot be the item itself';`.
Add a test.

**Status (2026-09-11):** resolved as proposed — guard at the top of the
anchor block in `itemHierarchy.ts` (`validateHierarchyRequest`), so PUT
and `/move` both get it; test "rejects the item as its own anchor" in
`items.hierarchy.test.ts`.

### 3. `workphaseExists` copied verbatim between the route and the new lib `[Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:29–31`, `server/src/lib/itemHierarchy.ts:86–88` (byte-identical); same `select({id}).from(T).where(eq(T.id, id)).get()` shape inline at `routes/workphases.ts:24`, `routes/workflows.ts:99,112,120`, `routes/projects.ts:85,198`

This commit created the verbatim pair: `validateHierarchyRequest` needed
the check, so it was copied rather than moved, and the route kept its copy
for POST. Both also duplicate the 400 message string.

**Fix:** add `existsById(table: IdTable, id: string, tx?: Tx): boolean` to
`server/src/lib/getOrNotFound.ts` — it already defines `IdTable` and the
sibling `getByIdOrNotFound`. Delete both `workphaseExists` copies. The six
inline sites in other route files can migrate opportunistically.

**Status (2026-09-11):** resolved as proposed — `existsById(table, id, tx?)`
in `lib/getOrNotFound.ts`; both `workphaseExists` copies deleted and their
call sites (POST in `items.ts`, `validateHierarchyRequest`) use it. The six
inline sites in `workphases.ts` / `workflows.ts` / `projects.ts` were left
for opportunistic migration.

### 4. Single-workphase `isTerminal` lookup exists three times across the two files this commit touched `[Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:20–27` (`isTerminalOf`, returns `boolean | null`), `:162–166` (POST inline), `server/src/lib/itemHierarchy.ts:177–181` (`isTerminal`, returns `boolean`, takes `tx`)

Same query in all three; they differ only in `tx` plumbing and whether a
missing workphase is `null` or `false`. `itemPositionScope.ts:108–112`
already has the exact sibling helper for the other column
(`workflowIdForWorkphase(workphaseId, tx?)`).

**Fix:** add `workphaseIsTerminal(workphaseId: string, tx?: Tx): boolean | null`
beside `workflowIdForWorkphase` in `itemPositionScope.ts`; the three call
sites use it (`Boolean(...)` where a strict boolean is wanted).

**Status (2026-09-11):** deferred by decision. Epic 4 (quick items — the
roadmap names "move to the Done column" on completion) will refactor
workflows and the done column, and `isTerminal` may not survive it;
consolidating three lookups of a column that's about to be reworked isn't
worth the churn. Revisit when Epic 4 settles what "done" means — if
`isTerminal` remains, apply the fix above then.

### 5. `subtreeHeight` is a second items-BFS in the same file as `walkItemDescendants` `[Duplication & Abstraction]`
**File:** `server/src/lib/itemTree.ts:80–99` (`subtreeHeight`), `:140–160` (`walkItemDescendants`)

Both seed `visited` with the root, loop a frontier, select children by
`parentId`, skip visited, push. The only difference is level-by-level
processing so `subtreeHeight` can count levels. The previous audit's
positive confirmation ("no duplicated traversal") no longer holds — and
this is the exact re-accumulation shape `walkItemDescendants`'s own header
describes having collapsed once already. The cycle guard is now maintained
in two BFS bodies.

**Fix:** make the level-ordered BFS the single core — an internal
`walkItemDescendantLevels(rootId, opts): {id; isAttached}[][]` — and derive
both: `walkItemDescendants` flattens (keeping `predicate`/`includeRoot`),
`subtreeHeight` returns `levels.length`. Both already covered by
`server/tests/lib/itemTree.test.ts`.

**Status (2026-09-11):** resolved as proposed — private
`walkItemDescendantLevels(rootId, {predicate, tx}): ItemChild[][]` in
`itemTree.ts` is the one BFS (visited-before-predicate cycle guard lives
there once); `walkItemDescendants` flattens it (+ `includeRoot`),
`subtreeHeight` is `levels.length`. FIFO order is unchanged so existing
callers see identical id sequences. No new tests needed — `itemTree.ts`
measures 100% on all four metrics after the change.

### 6. Depth-chain builder loop copied four times in one test file, with a CAP-1 / CAP variation `[Duplication & Abstraction]`
**File:** `server/tests/routes/items.hierarchy.test.ts:87–90`, `:431–434`, `:547–550`, `:559–563`

Identical `let deepest = createItem(L1); for (d = 2; d <= N; d++) deepest = createItem({parentId: deepest.id})`.
The bound alternates between `ITEM_DEPTH_CAP - 1` and `ITEM_DEPTH_CAP` per
test intent — precisely the off-by-one that's hard to spot across four
hand-copies. (`itemTree.test.ts:60–69`'s `seedChain` deliberately bypasses
the POST cap by writing `parentId` directly — different reason to exist,
don't merge.)

**Fix:** one local `createChain(projectId, workphaseId, length)` returning
the deepest item, next to `cardWithTwoStubs`; four call sites become
one-liners with the bound visible at each.

**Status (2026-09-11):** resolved as proposed. Non-obvious detail: the
fourth copy's in-loop `expect(deepest.id).toBeDefined()` was doing real
work — `createItem` in `fixtures.ts` doesn't assert status, so a link
that 400s hands `parentId: undefined` to the next and silently flattens
the chain. The helper asserts every link, so all four sites now get that
guard.

---

## Watch List

### 7. Mid-transaction failure of `applyHierarchyRequest` is asserted by structure, not by a test `[Correctness & Security]`
**File:** `server/tests/routes/items.hierarchy.test.ts:428–445`

The "atomicity" describe only exercises *validation* rejections (depth
cap, out-of-scope anchor), which return before `db.transaction` opens —
they prove nothing about rollback. Every write does sit inside one `tx`
with no early returns and better-sqlite3 rolls back on throw, so the code
is atomic by construction — but the story's stated risk ("cross-workflow
nulling touches rows the caller never named … so a half-applied cascade
can't hide") is exactly the case with no test.

**Fix:** one test that `vi.spyOn`s a late step (e.g. `logActivity` or
`cascadeWorkphaseToAttachedDescendants`) to throw, then asserts the item, a
detached descendant, and an attached descendant are unchanged and the
response is 500.

### 8. `anchorId` has no type check — a non-scalar value reaches the SQLite binder and 500s `[Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:94–113`

`parentId`, `isAttached`, `workphaseId`, `side`, `position` are all
shape-checked; `anchorId` isn't. `anchorId: {}` hits `eq(items.id, …)` and
better-sqlite3 throws "can only bind numbers, strings, …" — outside the
transaction, logged, nothing written, but a 500 for bad input.

**Fix:** `if (req.anchorId !== undefined && typeof req.anchorId !== 'string') return 'anchorId must be a string';`.

### 9. Raw `position` escape hatch accepts `0` and negatives, which later break anchoring `[Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:107–109`, `:233–234`; `server/src/lib/positionResolver.ts:95–97`

`position: 0` is finite and written as-is. `getTargetPosition` uses
`!row?.position` to mean "no position", so anchoring against that item
afterwards throws → 500. Carried forward from the old handler.

**Fix:** require `req.position > 0`, or change `getTargetPosition` (and
`getLastPositionInScope:120`) to test `row.position === null`.

### 10. `effectiveWorkflowIdForProject` picks an arbitrary workflow when a project owns more than one `[Correctness & Security]`
**File:** `server/src/lib/workflowItems.ts:72`

`workflows.projectId` isn't unique and `POST /workflows` doesn't enforce
one-per-project, so `.get()` with no `ORDER BY` returns whichever row
SQLite yields first. `nullForeignWorkphasePositions` then treats items in
the *other* owned workflow as foreign and nulls their positions. The
roadmap (`mvp-roadmap.md:17`) states "A project has one workflow" as a
model invariant, and the client (`App.tsx:121`) also first-matches, but
nothing pins it in the schema or the route.

**Fix:** either a unique index on `workflows.project_id` (+ 409 on `POST
/workflows`), or `ORDER BY createdAt` in both server and client so they
agree deterministically. The first is the honest fix for a stated
invariant.

### 11. `workphaseId: null` on a move leaves a stale position on an item whose `positionScope` is now `'none'` `[Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:242–251`

Explicit un-assignment takes no position branch (`resulting.workphaseId`
is falsy), so the old position survives while `classifyPositionScope`
reports `'none'`. Pre-existing behavior, but this commit introduced the
principle "an item with no meaningful comparison scope has no stored
position" and applied it to the cross-workflow case only.

**Fix:** when `resulting.workphaseId === null && !resulting.isAttachedWithParent`,
set `updates.position = null`.

### 12. `positionScope` reported for a foreign-workphase item disagrees with the wiki, and the test pins the disagreement `[Correctness & Security → Consistency & Drift]`
**Files:** `server/tests/routes/items.hierarchy.test.ts:384`; `docs/wiki/item-positioning/README.md:447–448`; `server/src/lib/itemPositionScope.ts:19–32`

The wiki says a subtree item left holding a foreign workphase after a
cross-workflow reparent "sits in 'Unknown status' … (`positionScope` is
`"none"`)". The test asserts `'workflow'` for exactly that row, with the
comment "still classifies by its own workphase's workflow".
`classifyPositionScope` only looks at the row, not the project's effective
workflow, so the code is self-consistent and the position *is* nulled —
but the response field misdescribes the row's state, and the wiki and the
test now document opposite behaviors.

**Fix:** decide which is right. Cheapest: reword wiki §7.3 to say the
*position* is nulled while `positionScope` still classifies by the row's
own workphase. Correct: give `classifyPositionScope` the project's
effective workflow (boards already have it) and return `'none'` when the
row's workphase is foreign — then the test flips to match the wiki.

### 13. Coverage gate omits two lib modules this story added/extended `[Consistency & Drift]`
**File:** `server/vitest.config.ts:50–53`

The story's own step 9 says thresholds gain `items.ts` "and the new lib
modules". `itemHierarchy.ts` and `itemTree.ts` were added;
`lib/activityLog.ts` (brand-new) and `lib/workflowItems.ts` (gained
`effectiveWorkflowIdForProject`, now on the cross-workflow critical path,
with its own new test file) were not. Both are almost certainly covered in
practice, but the gate won't catch a future drop.

**Fix:** add both at 80/80/80/80 under the Epic 3.5 Story 1 comment.

### 14. `docs/wiki/item-attachment/README.md`'s "Test suite" line is stale `[Consistency & Drift]`
**File:** `docs/wiki/item-attachment/README.md:13`

Says `docs/test-plans/item-attachment/` is *(not yet written)*; that
directory holds `INDEX.md` plus seven suite files (37 cases). The
Build-status block two lines above was edited by this commit without
touching it. **Fix:** drop the qualifier, matching
`docs/wiki/item-positioning/README.md:10`.

### 15. `POST /items` still derives initial placement and the active/done split with its own copy of the rule `applyHierarchyRequest` owns `[File Responsibility + Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:131–133` (attached-inherits-parent's-workphase), `:155–176` (sibling-scope append / terminal → `completedAt` / workflow-scope append), `:98–105` (own `parentProjection` + "parentId does not reference an existing item"); vs `server/src/lib/itemHierarchy.ts:77–81`, `:235–265`, `:60–66` + `:121`

Story decision 3 scoped POST to "shares the legality guard" only — a
deliberate stopping point, not an oversight. Recorded because the two
copies encode the same wiki rules (attachment §2, positioning §2/§6) and
will drift the first time either changes; Epic 4's quick-item `kind` /
auto-complete is the obvious trigger, but the roadmap doesn't name this
consolidation. Looks deferred — verify against the roadmap.

**Proposed shape when picked up:** export
`resolveInitialPlacement(state, tx, reindexed): {position, completedAt}`
from `itemHierarchy.ts`, factored out of the `scopeChanged` branch + the
done split; POST calls it after deriving its state; `applyHierarchyRequest`
calls it in place of `:240–241` + `:258–265`. Exporting `getParent` lets
POST drop its own projection.

### 16. Two cycle-guarded ancestor walks, one per self-ref table `[Duplication & Abstraction]`
**Files:** `server/src/lib/itemTree.ts:63–74` (`hierarchyDepth`, items), `server/src/lib/workflowItems.ts:66–78` (`effectiveWorkflowIdForProject`, projects)

Both added by this commit; both `visited`-guarded `parentId` climbs that
differ only in table and per-step action. `itemTree.ts` already has the
table-generic `SelfRefTable` type and a generic *descendant* check built
for exactly this items/projects symmetry. Each is ten lines and tested,
so not Fix Now — but Story 2's client-side depth classification will
likely add a third "give me the ancestor chain" caller.

**Fix when touched:** `walkAncestorIds(table: SelfRefTable, id, tx?): string[]`
next to `isSelfRefDescendant`; `hierarchyDepth = walkAncestorIds(items, id, tx).length + 1`;
`effectiveWorkflowIdForProject` iterates `[projectId, ...walkAncestorIds(projects, …)]`.

### 17. Cross-project reparent walks the subtree two to three times, and the resulting-scope literal is built twice `[Duplication & Abstraction + Correctness & Security]`
**File:** `server/src/lib/itemHierarchy.ts:273`, `:278`, `:344` (walks); `:164–168`, `:225–230` (scope literal)

`walkItemDescendants(item.id, {tx})` runs for the project cascade and
again inside `nullForeignWorkphasePositions`, both gated on the identical
`projectChanged && resulting.projectId`; `cascadeWorkphaseToAttachedDescendants`
walks a third time when the workphase also changed — one query per node
each. Fine at single-user volume. Separately, `subjectScope` (validate)
and the `scope()` argument (apply) both spell
`{ isAttached: resulting.isAttachedWithParent, parentId: resulting.parentId, workphaseId: resulting.workphaseId }`
— the second one matters because `sharesPositionScope` and
`positionScopeFor` must be fed the same shape or the anchor check and the
write disagree.

**Fix:** compute `descendantIds` once under the `projectChanged` branch
and pass it to `nullForeignWorkphasePositions`; add a one-line
`positionScopeInputOf(resulting)` used at both sites.

### 18. Test scaffolding: seventh "project + workflow + phases" fixture, and `setPosition` copied across suites `[Duplication & Abstraction]`
**Files:** `server/tests/routes/items.hierarchy.test.ts:39–46` (`setupWorkflow`); pre-existing variants at `items.test.ts:306`, `:659`, `:996` (the `setupTwoPhases` naming collision is still there), `columns.test.ts:81`, `:278`, `positionResolver.test.ts:21`; `setPosition` byte-identical at `items.hierarchy.test.ts:22–24` and `positionResolver.test.ts:13–15`; `hierarchyEntries` (`items.hierarchy.test.ts:26–33`) vs the inline `status_change` filter at `:472–477`

The prior audit put the fixture spread below threshold at six; this commit
made it seven and added a second cross-file verbatim helper. **Fix:** in
`server/tests/fixtures.ts` add `seedWorkflowWithPhases(phases[])`,
`setItemPosition(id, position)`, `getItemRow(id)`; generalize
`hierarchyEntries` to `activityEntries(itemId, type)`.

### 19. `itemHierarchy.ts` bundles notification creation and the cross-workflow cascade with the hierarchy write `[File Responsibility]`
**File:** `server/src/lib/itemHierarchy.ts:307–319`, `:325–355`

The file earns its 356 lines: two clearly delineated halves matching the
validate-outside / apply-inside convention, every step commented with its
wiki section. Splitting it mechanically would scatter one atomic operation.
Two sub-concerns are a step removed from "reparent/attach/detach" and worth
watching as Epic 7 grows the file: the `notifications` insert on a
`triggersNotification` workphase (a side effect of a *workphase* change,
moved here verbatim — lift into `lib/notifications.ts` the moment a second
workphase-change entry point needs it) and `nullForeignWorkphasePositions`
(a peer of `attachedCascade.ts` in concept, kept here only because it's
coupled to the local `ResultingState` type). Not Fix Now.

### 20. `items.hierarchy.test.ts` (586 lines) vs `items.test.ts` (1200+) — clean seam, but watch growth `[File Responsibility]`

The split is by concept, not size: the hierarchy suite covers exactly the
`HierarchyRequest` surface, `describe`-per-wiki-section; `items.test.ts`
keeps CRUD, workphase-only move, reorder, comments, delete, and the
pre-existing attached-cascade suite (`:995–1234`, which tests
`attachedCascade.ts` via the same routes but a different concept —
defensible to leave). A future story adding another slice of items-route
behavior should open a third `items.*.test.ts` rather than grow either.

### 21. Client/server depth math — not duplicated yet; Story 2 is where it would be `[Duplication & Abstraction]`
**Files:** `server/src/lib/itemTree.ts:57–113` vs `client/src/lib/hierarchy.ts`

The client has no depth/height/cap logic today (only the display pill).
Verdict on a shared package: **traversals should stay parallel, the
formula should not.** Server walks are DB-backed; client walks are
in-memory over a flat array — different substrates. But
`D + 1 + h <= CAP` plus the constant is one line with one owner, and Story
2's target classification needs exactly that. When it lands, the client
should get `isWithinDepthCap(targetDepth, subtreeHeight)` + `ITEM_DEPTH_CAP`
from one shared source, fed by each side's own traversal — not a client
re-derivation. Story decision 1 defers the mechanism to Story 2; not named
in the roadmap — Watch List.

---

## Covered by Future Epics

### 22. `client/src/api/items.ts`'s `MoveItemInput` doesn't include `parentId`/`isAttached` `[Consistency & Drift]` — **Covered by Epic 3.5 (Story 2)**
**File:** `client/src/api/items.ts:37–43`

The server's move endpoint now accepts both; the client type wasn't
widened, and no call site sends them. Explicitly deferred: the story doc's
out-of-scope list and `epic-3-5-roadmap.md:85` ("Server half only; the
client half is Story 2") — spot-checked. Flagged so the type isn't
overlooked when Story 2 lands.

---

## Informational

### 23. Legacy `scopeWorkphaseIds`-only shape on an attached child with a diverged workphase now 400s `[Correctness & Security]`
**File:** `server/src/routes/items.ts:304`

The legacy shape is mapped to `workphaseId = item.workphaseId`; for an
attached child whose stored workphase differs from its parent's (the
stale-row shape a workphase delete produces), decision 4 rejects it.
Attached children aren't draggable today, so unreachable from the board —
noted so Story 2 (which makes them draggable) knows.

### 24. Positive confirmations `[all passes]`

- **Atomicity by structure.** Both entry points validate against plain
  `db` before `db.transaction`, then `applyHierarchyRequest` performs every
  write through `tx` with no early returns; every callee receives `tx`.
  Handlers are fully synchronous, so nothing interleaves between
  validation reads and the transaction.
- **Errors reach a log.** Global error middleware at `index.ts:54–57`; no
  empty catches in the changed files.
- **Cycle detection and depth cap.** `assertValidReparent` runs before the
  cap whenever `parentId` is a string; every walk (`hierarchyDepth`,
  `subtreeHeight`, `walkItemDescendants`, `effectiveWorkflowIdForProject`)
  is visited-guarded and tested against seeded cycles. Boundary tests at
  CAP / CAP+1 on lib, move, PUT, POST are consistent; cap correctly skipped
  for a same-parent attach toggle.
- **Reparent-then-resolve ordering.** `scope()` is built from `resulting`
  with `excludeId = item.id`, so resolution never depends on the old
  parent (TC-7.12 disjoint-range fixture proves it). Anchor validated
  against the resulting scope via `sharesPositionScope`, with done-item
  anchors rejected first.
- **Cascades.** Project cascade hits every descendant; workphase cascade
  stops at detached branches; cross-workflow nulling skips attached
  descendants and dedupes workflow lookups. `workphaseId` soft-ref
  tolerated throughout.
- **Activity log / notifications.** One `hierarchy_change` per effective
  change (none on redundant re-attach — tested); `status_change` +
  notification now also fire from PUT-driven attach snaps; `logActivity`
  has one definition and `insert(notifications)` one call site.
- **Reindex disclosure.** Collector pushed only by `reindexPositionsInScope`;
  the written item appended by `respondWithItem` only when a reindex fired.
  `projects.ts` / `workphases.ts` correctly don't pass one.
- **`itemHierarchy.ts` composes, it doesn't re-implement.** No position
  arithmetic, coarsest-fit, or reindex logic in the new module;
  `reorder.ts` / `columnRanges.ts` untouched.
- **Concept boundaries are legible** across `itemTree` / `itemPositionScope`
  / `positionResolver` / `attachedCascade` / `workflowItems` /
  `itemHierarchy` — no concept scattered, none owned twice.
- **Type sync / fan-out.** `client/src/types.ts`'s `Item` matches what
  `withPositionScope` returns; MCP tools unchanged per decision 7; Bruno,
  route comments, and wiki §1/§4–§11a agree; no "work item" language
  introduced; schema change is comment-only so no migration needed.
- **E2E drag helper extraction is complete.** `tests/helpers/dragGesture.ts`
  is the only file under `tests/` with `page.mouse.*`; all three specs
  import it. Prior audit Finding #9 is closed.
- **`ENABLE_TEST_ROUTES`** unchanged: strict `=== 'true'` at `index.ts:45`.
- **No raw SQL**; empty-`inArray` paths guarded by length checks.

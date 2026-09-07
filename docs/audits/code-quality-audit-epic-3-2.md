# Code Quality Audit — Epic 3.2 In Progress (2026-08-17)

Scope note: audited range is `epic-2-complete` → working tree, per explicit
request. This spans the now-closed **Epic 3** (Attached/Detached work item
behaviors — already covered by `code-quality-audit-epic3.md`) plus the
in-progress **Epic 3.2** (Item Positioning & Board-Scoped Ordering, 17
commits past `epic-3-complete`, not yet tagged complete). Findings that
re-touch Epic 3 surface are noted as such; the bulk of what's new here is the
position/reorder rework (`positionResolver.ts`, `reorder.ts`, the
`items.ts` move endpoint) and the client API-layer split
(`client/src/api/*.ts`, replacing the old monolithic `api.ts`). Run as four
parallel passes per `.claude/guides/audit-workflow.md`. Each finding is
tagged with the pass(es) that surfaced it. A handful of the highest-severity
Fix Now items were independently re-verified by hand against current code
before being included. Tags: **Fix Now**, **Watch List**, **Informational**.
No finding qualified for a **Covered by Epic N** tag — everything here sits
inside Epic 3/3.2's own surface, not a named future-epic gap.

Overall shape: the server-side position/tree math (`positionResolver.ts`,
`reorder.ts`, `itemTree.ts`, `columnRanges.ts`, `attachedCascade.ts`) is
genuinely well factored, with no duplicated traversal or position logic
between them, and several Epic 3-era findings (icon consolidation, confirm-delete
button, `applyReorder`, shared tree-walk helpers) have held up well under this
round's growth. The real gaps cluster in three places: validation rigor that
wasn't extended uniformly to every new/changed mutation path, a client API
layer that's structurally clean but functionally inconsistent about error
handling, and duplication that re-accumulated in new files (icons, modal
chrome, confirm-delete, E2E drag helpers) even though the patterns meant to
prevent it already existed. 

---

## Fix Now

### 1. `applyReorder`'s validation check is broken by an `Array.find` boolean mix-up — a falsy invalid entry skips validation entirely `[Correctness & Security]`
**File:** `server/src/lib/reorder.ts:36–42`

```ts
const invalidEntry = orders.find(
  (o) => typeof o?.id !== 'string' || typeof o?.position !== 'number' || !Number.isFinite(o.position),
);
if (invalidEntry) { ... return false; }
```

`Array.prototype.find` returns the *element*, not a boolean. If the first
invalid entry in the array is itself falsy (`null`, `0`, `''`, `false`),
`invalidEntry` is falsy and the `if` never fires — validation is skipped for
**every** entry, not just that one. Execution falls through to
`entries.map((o) => o.id)`, which throws on `null`/`undefined` (→ opaque
500) or silently binds `undefined` for `0`. Verified directly against the
file: this is the shared helper used by all three of `items`, `workphases`,
and `columns` `PATCH /reorder`, so the bug is live on all three. The existing
test (`server/tests/routes/items.test.ts:649`) only exercises a *truthy*
invalid entry (`{id, position: 'first'}`), so it passes either way and
doesn't catch this.

**Fix:** `const hasInvalid = orders.some((o) => o === null || typeof o !== 'object' || typeof o.id !== 'string' || typeof o.position !== 'number' || !Number.isFinite(o.position));` — replace `find`+truthiness with `some`.

**Status:** ✅ Fixed as specified — `reorder.ts:36–41` swapped `Array.find` +
truthiness for `Array.some`. Added a regression test (`items.test.ts`)
covering a falsy invalid entry (`null` in the array) that the original test
suite didn't catch; verified it fails without the fix and passes with it.

---

### 2. `PATCH /api/projects/reorder` doesn't use the shared `applyReorder` helper it was written to replace, and can write a parent cycle `[Correctness & Security + Duplication & Abstraction]`
**File:** `server/src/routes/projects.ts:124–154`

Verified directly: unlike `items`, `workphases`, and `columns`, the projects
reorder route hand-rolls its own loop instead of calling `applyReorder`
(`reorder.ts`'s own doc comment names "projects' id/position pairing" as
in scope, and says the point of the helper was eliminating exactly this
per-route rigor drift — see Epic 3 audit finding #15). Two concrete
consequences of staying bespoke:

- **No id/type validation.** Entries aren't checked for a valid `id`/
  `position` shape, and a non-existent `id` silently no-ops (200 OK) instead
  of 404ing with `missingIds`, unlike every other reorder route.
- **Cycle escape.** The pre-write validation loop (lines 133–141) checks
  each entry's reparent against *current* DB state one at a time, then a
  separate transaction (143–151) applies the whole batch. A two-entry batch
  `[{id: A, parentId: B}, {id: B, parentId: A}]` passes both individual
  checks (neither is currently a descendant of the other) and then writes a
  cycle. `projects.parentId` has no DB-level FK (self-referential caveat),
  so nothing else catches it. Once a cycle exists: `getAncestors`
  (`client/src/lib/hierarchy.ts:36–47`, called every render from
  `App.tsx:134`) loops forever and freezes the browser; `deleteProjectById`
  (`projects.ts:77–79`) recurses infinitely; `assertValidReparent`
  (`itemTree.ts`) stack-overflows on the next reparent attempt against the
  cyclic pair. The sidebar only ever sends one entry per call
  (`App.tsx:124`), so this is API-reachable, not UI-reachable today — but
  it's the only guard on an FK the DB can't enforce, and it's not sound.

**Fix:** Simulate the batch (build a `Map<id, resultingParentId>` overlaying
current tree state) and check each resulting chain for a cycle before
writing anything; and route id/type validation through `applyReorder` (widen
it to take a per-entry extra-fields callback for `parentId`) or extract its
validate-and-check-existence half into a helper projects can call ahead of
its own parentId-cycle loop.

**Status:** ✅ Resolved, via a different route than suggested — rather than
hardening the batch validation, the batch endpoint itself was retired.
`PATCH /projects/reorder` is gone; projects now unify onto the same
positioning system items already use (`server/src/lib/positionResolver.ts`,
generalized to be table-generic). The new single-item
`PATCH /projects/:id/move` (`{parentId?, prevId?, nextId?}`) removes the
cycle-escape at the API-contract level — there's no second batch entry to
collude with — and adds the id-existence check the old route lacked (both
for the moved project's new parent and for any supplied `prevId`/`nextId`
— the project's resulting predecessor/successor — verified as a real
current sibling before its position is trusted). `prevId`/`nextId` were
deliberately chosen over the more natural-sounding `beforeId`/`afterId`:
those read as ambiguous either direction ("I go before X" vs "X goes
before me"), while prev/next name a position in the sequence and match
`findPrevSibling`/`findNextSibling`, already in use client-side. `PUT /:id`
picked up the same parent-existence check. See
`docs/planning/mvp-roadmap.md`-adjacent design discussion in this session's
transcript for the full rationale; columns/workphases are a deliberately
separate, smaller-scope follow-up (bulk resequence stays appropriate there
— see the session's "two standards" discussion for why).

---

### 3. Empty `catch {}` on item-label assignment swallows every failure and reports fake success `[Correctness & Security]`
**File:** `server/src/routes/labels.ts:43–48`

```ts
try {
  db.insert(itemLabels).values({ itemId: req.params.itemId, labelId }).run();
} catch {
  // already assigned — ignore duplicate
}
res.status(201).json({ success: true });
```

Verified directly: the comment claims this only absorbs the PK-duplicate
case, but the bare `catch` absorbs everything — including FK violations from
a non-existent `itemId` or `labelId` (both are `NOT NULL ... REFERENCES ...
ON DELETE CASCADE`). Nothing is written, nothing is logged, and the client
is told `201 { success: true }` regardless. `LabelsSection.tsx`'s
`handleToggle` has no error handling of its own either (see Finding #16), so
a failed assignment renders as successfully applied until reload. This is
the only empty `catch` remaining anywhere in the audited scope.

**Fix:** Inspect the error (`err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'` →
treat as idempotent success; anything else → log + 400/500).

**Status:** ✅ Fixed as specified — `labels.ts:41–57` now checks `err.code`
against `SQLITE_CONSTRAINT_PRIMARYKEY` before treating an insert failure as
an idempotent duplicate; anything else (e.g. an FK violation from a bad
`itemId`/`labelId`) logs and returns 500. Also added explicit 404s for a
non-existent item or label (via `getByIdOrNotFound`) so bad input gets a
specific error instead of surfacing only as an opaque constraint failure.
Created `labels.test.ts` (no test file existed for this route before)
covering the 400/404 cases, a successful assignment, and the
idempotent-duplicate case. Note: tags/labels are slated for a heavier rework
in Epic 6, so this fix was kept minimal/cheap rather than extended into
broader labels-area cleanup.

---

### 4. `PATCH /items/:id/move`'s raw `position` field is written with no validation `[Correctness & Security]`
**File:** `server/src/routes/items.ts:418–419`

```ts
} else if (position !== undefined) {
  updates.position = position;
}
```

Verified directly: `position` is never checked for being a finite number
here, unlike the identical class of write in `reorder.ts` (Finding #1) or
the anchor-resolved branch just above it. `items.position` is `REAL`, and
SQLite's dynamic typing will happily store a non-numeric string as TEXT — so
`{position: "later"}` persists a text value into the ordering column, after
which every `gt()`/`lt()`/`ORDER BY position` comparison against that row is
governed by SQLite's type-ordering rules (TEXT sorts after all numerics),
silently corrupting the scope's order with no error anywhere.
`{position: {}}` throws at binding (opaque 500). This path is exercised by
the E2E seed helper (`tests/helpers/itemRepositioningScenario.ts:43`), so
it's a live, documented API surface, not a hypothetical one.

**Fix:** `if (typeof position !== 'number' || !Number.isFinite(position)) → 400`, matching the validation already present on the other fields in this handler (lines 376–387).

**Status:** ✅ Fixed as specified — added the missing check to
`PATCH /items/:id/move`, matching the pattern of the other validated fields
in the same handler. Added a regression test in `items.test.ts` covering
both a non-numeric string and a non-finite number (`Infinity`), verifying
the item's real position is untouched by the rejected requests.

---

### 5. `POST /api/items` resolves position, inserts, and logs activity outside any transaction `[Correctness & Security]`
**File:** `server/src/routes/items.ts:198–244`

Verified directly: unlike `PUT /:id` and `PATCH /:id/move`, which both wrap
their position resolution + write in `db.transaction`, this handler calls
`resolveAppendPosition` (lines 208/214) with no `tx`, then runs `db.insert`
(223) and `logActivity` (240) as separate implicit transactions.
`resolveAppendPosition` can itself trigger `reindexScope`
(`positionResolver.ts:66–79`), which issues one `UPDATE` per item in the
whole workflow-wide scope as independent statements — a mid-loop failure
there leaves the scope half-renumbered. A failure between the insert and the
activity log leaves an item with no creation activity entry.

**Fix:** Wrap lines 198–244 in `db.transaction((tx) => {...})` and thread
`tx` through `resolveAppendPosition`/`positionScopeFor`/`logActivity`,
matching the `PUT` handler's pattern.

**Status:** ✅ Fixed as specified, surfaced via a different angle than the
original finding — came up while discussing whether `reindexScope`'s
per-row `rows.forEach` loop (`positionResolver.ts`) could be a costly
sequence of unbatched commits; tracing every `resolveAppendPosition` call
site found this was the live instance of exactly that risk (SQLite
`journal_mode = WAL` with no `synchronous = NORMAL` relaxation, so an
untransacted reindex means one fsync per renumbered row, up to the
magnitude-threshold's ~1000-row ceiling). Verified in current `items.ts`:
POST now wraps position resolution + insert + activity log in one
`db.transaction`, `tx` threaded through `resolveAppendPosition`/
`positionScopeFor`/`logActivity`. `projects.ts`'s `POST /` had the identical
gap (introduced this session when its position resolution was unified onto
the same shared resolver) and was fixed the same way in the same pass.

---

### 6. `PUT /api/workphases/:id` can flip `isTerminal` without re-validating covering columns or backfilling affected items `[Correctness & Security]`
**File:** `server/src/routes/workphases.ts:44–65`

Verified directly: the handler updates `isTerminal` with no downstream
checks. Two consequences:

- **Column-range invariant breaks.** `validateColumnRange`
  (`server/src/lib/columnRanges.ts:110–120`) rejects a *new* column spanning
  both a terminal and non-terminal workphase, and the client relies on that
  guarantee — `BoardColumn.tsx:52–56` reads
  `column.subRows[0].workphase.isTerminal` and applies it to the entire
  covered range, with a comment stating the invariant. Nothing re-validates
  *existing* columns when a covered workphase's `isTerminal` flips, so a
  merged column can end up spanning both, after which half its cards sort
  by `completedAt ?? 0` (all zero → arbitrary) and half by `position`.
- **Item state goes stale.** Flipping 0→1 doesn't backfill items already in
  that workphase: they keep a real `position` and null `completedAt`, but
  `classifyPositionScope` now reports `'none'` for them and
  `getWorkphaseItemsFrom` sorts them by `completedAt ?? 0` — their order
  collapses. The reverse flip (1→0) leaves stale `completedAt` + null
  `position`, so they sort at `0` ahead of everything else.

**Fix:** On an `isTerminal` change, re-run `validateColumnRange` for every
column covering that workphase (reject or auto-shrink on conflict), and
inside the same transaction backfill affected items' `position`/
`completedAt`, mirroring the move handler's terminal-transition logic
(`items.ts:446–461`).

**Status:** ✅ Fixed, via reject rather than auto-shrink — `PUT
/api/workphases/:id` now checks every column covering the workphase (new
`findColumnsMixingTerminalAfterFlip` in `columnRanges.ts`) *before* writing
anything, rejecting with 400 + `conflictingColumnId` on conflict, then
backfills affected items' `position`/`completedAt` inside the same
transaction — non-terminal→terminal preserves order via a synthetic
`completedAt` sequence, terminal→non-terminal re-appends via the shared
position resolver, both skipping attached children per the existing Part 6
rule. Surfaced and fixed a real, independently-reachable bug in the shared
`positionResolver.ts` along the way: `getLastPositionInScope`/
`getFirstIdInScope` were missing the `isNotNull(position)` guard
`reindexScope` already has, so appending into a scope where every remaining
row is a done item threw instead of resolving as empty. 5 new tests in
`workphases.test.ts` plus a standalone regression test in
`positionResolver.test.ts` for the resolver bug.

---

### 7. `PATCH /items/:id/move` never checks that the anchor's position scope matches the subject's resulting scope `[Correctness & Security]`
**File:** `server/src/routes/items.ts:398–417`

Verified directly: the handler resolves the write position from the
*anchor's* scope with no check that the anchor lives in the same comparison
space the subject will end up in. Two reachable mismatches:

- **Attached-siblings vs. workflow-wide scope.** Anchoring a
  detached/root item against an attached child yields a number from that
  parent's `(parentId, isAttached)` space, then stores it on an item whose
  own scope is workflow-wide — the two spaces are deliberately isolated
  (`positionResolver.test.ts:573–631`), so the resulting order is
  arbitrary. The client guards this (`boardDndUtils.ts:26–37` filters
  attached-child droppables out of non-attached drags), but the API doesn't.
- **Cross-workflow anchor.** `positionScopeFor` expands the anchor's
  `workphaseId` to its whole workflow with no cross-check against
  `targetWorkphaseId`, so an anchor in workflow A can set the position for
  an item ending up in workflow B.

**Fix:** After resolving the subject's resulting `(isAttached, parentId,
targetWorkphaseId)`, compare its classified scope to the anchor's; on
mismatch, 400 with `anchorId is not in this item's position scope`.

**Status:** ✅ Fixed, comparing more than the classified label — added
`sharesPositionScope(anchor, subject, tx)` to `itemPositionScope.ts`,
comparing the anchor and subject on their actual comparison space
(attached-siblings + exact `parentId`, or workflow-wide + exact
`workflowId`) rather than just the `PositionScope` label, since two
different workflows both independently classify as `'workflow'` — a
label-only comparison wouldn't have caught the cross-workflow case.
`PATCH /items/:id/move`'s anchor branch now rejects with exactly the
suggested 400 message before resolving a position. Also catches an implicit
third mismatch the audit's two named examples didn't spell out: an attached
child anchored against a different attached child under a *different*
parent. 5 new tests in `items.test.ts` (3 rejection cases + 2 "still allows"
sanity checks against a false-positive reject); verified all 3 rejection
cases genuinely fail without the fix.

---

### 8. `client/src/api/*.ts` — hand-rolled fetch/error pattern repeated ~45 times, already drifted into two inconsistent error-handling levels `[Duplication & Abstraction]`
**Files:** `client/src/api/shared.ts` (1 line: `export const API = '/api';`) plus all 13 sibling modules

Every function in every domain module repeats one of two shapes by hand
(including `headers: { 'Content-Type': 'application/json' }` ~20 times).
This has already drifted, which is why it's Fix Now rather than a
theoretical cleanup: some call sites parse the server's `{ error }` body
(`items.ts:40–43`, `columns.ts:16–19`, `boards.ts:38–41`, `agents.ts:47–50`,
`itemTypes.ts:32–35`, `workphases.ts:38–41`) and surface the real message;
others discard it for a generic string (`items.ts:6,26,81,86`,
`projects.ts`/`workflows.ts`/`labels.ts` entirely, `attachments.ts`,
`notifications.ts`, `agents.ts:6,22,41`, `itemTypes.ts:6,16,26`). The routes
themselves return specific, useful 400 messages either way (e.g. `POST
/api/items` has four distinct validation messages) — whether the user sees
any of them is purely which module happened to write the fetch call.

**Fix:** Add `apiJson<T>(path, init, fallbackMessage): Promise<T>` and
`apiVoid(path, init, fallbackMessage)` to `shared.ts`, always parsing `{
error }` with a fallback. Every module function collapses to one line, and
the error contract stops being per-endpoint luck.

**Status:** ✅ Fixed as specified, plus one more primitive — added
`apiRequest`/`apiJson`/`apiVoid` to `shared.ts` (`apiRequest` returns the raw
`Response` for the one caller, `deleteWorkPhase`, that genuinely needs to
branch on status rather than always parsing JSON). Every one of the 12
domain modules collapsed to one-line functions built on these, always
trying the server's real `{ error }` message before falling back. Caught a
real bug while doing this: `deleteBoard` was first written against
`apiJson`, but `DELETE /boards/:id` returns 204 with no body — cross-checked
every DELETE route server-side before finishing the rest (all 204 except
`workphases.ts`'s conditional 200/204). New `shared.test.ts` (9 cases) — the
first test in the client suite to mock `fetch`.

---

### 9. Duplicated dnd-kit drag-gesture toolkit across three E2E spec files, one referencing a file that no longer exists `[Duplication & Abstraction]`
**Files:** `tests/ui/item-repositioning-cross-column-dnd.spec.ts:96–151`, `tests/ui/item-repositioning-cross-project-dnd.spec.ts:74–117`, `tests/ui/attached-children.spec.ts:184–204`

`dragTo`, `boxOf`, `center`, `topQuarter`, `bottomQuarter`, `pastColumnEnd`
are duplicated verbatim between the two repositioning specs — the
cross-project copy's own comments (lines 69–73, 111–113) point at
`tests/ui/item-repositioning-dnd.spec.ts`, a file that doesn't exist in this
scope (renamed/split since). `attached-children.spec.ts` then hand-rolls the
same pointerdown/move×N/up sequence a third time inline. These encode one
thing — how to satisfy dnd-kit's `PointerSensor` activation constraint and
rect re-measurement — with one shared reason to change; Epic 3.5's DnD
gesture work will need to touch all three copies identically.

**Fix:** Extract `tests/helpers/dragGesture.ts` exporting `dragTo`, `center`,
`topQuarter`, `bottomQuarter`, `pastColumnEnd`.

**Status:** 📋 Deferred to Epic 3.5, captured as
`docs/planning/epic-3-5-decisions.md` Q2 (2026-09-07) rather than fixed now —
Epic 3.5's own DnD gesture work is about to add two more drag-based E2E tests
(Q1) that would otherwise become a fourth/fifth copy of this same toolkit, so
the extraction is sequenced to happen there, before those new tests are
written, rather than as a standalone fix here.

---

### 10. Modal-chrome Tailwind strings re-typed inline 3–9× in files that already import from `pillUtils.ts` `[Duplication & Abstraction]`
**File (target):** `client/src/components/item-detail/pillUtils.ts:13–29`

Four independent violations, each in a file that already imports other
constants from this same module:

- **`BTN_ADD_TRIGGER` re-typed 5×:** `BoardToolbar.tsx:112,122,135,140` and
  `App.tsx:201` all write `text-[11px] text-zinc-500 transition-colors
  hover:text-blue-400` verbatim instead of importing the existing constant.
- **Modal cancel button, 3× identical:** `SetupWorkflowModal.tsx:63`,
  `CreateProjectModal.tsx:87`, `ColumnEditorModal.tsx:151`. Modal primary
  button, 2×: `CreateProjectModal.tsx:94`, `ColumnEditorModal.tsx:158`.
- **Field label, 9× across two silently-divergent variants:**
  `ColumnEditorModal.tsx:75,91,111,133` use `tracking-widest text-zinc-600`;
  `AgentsModal.tsx:248,259,273,287,300` use `tracking-wider text-zinc-500` —
  same element, same role, two styles from copy-paste drift.
- **`INPUT_LG` bypassed by four near-copies:** `ChildrenSection.tsx:136`,
  `BoardColumn.tsx:186`, `CreateProjectModal.tsx:65,77` each add a slightly
  different focus-ring treatment instead of using the token.

**Fix:** Add `BTN_MODAL_CANCEL`, `BTN_MODAL_PRIMARY`, `FIELD_LABEL` to
`pillUtils.ts`; replace the 5 inline `BTN_ADD_TRIGGER` copies with the
import; reconcile the `INPUT_LG` variants to one (or two, explicitly named).

**Status:** ✅ Fixed as specified, plus a fourth token — added
`BTN_MODAL_CANCEL`, `BTN_MODAL_PRIMARY`, `FIELD_LABEL`, and `INPUT_LG_RING`
(the "or two, explicitly named" option for the `INPUT_LG` bypasses, since
all three near-copies wanted a focus ring `INPUT_LG` itself doesn't have) to
`pillUtils.ts`. Replaced every named site: 5× `BTN_ADD_TRIGGER`, 3× cancel +
2× primary, 9× field label (standardized on `AgentsModal`'s
`tracking-wider`/`zinc-500` variant, matching `SECTION_LABEL`'s existing
convention), 4× `INPUT_LG` near-copies (standardized on `CreateProjectModal`'s
ring/border opacity, the 2-of-3 majority). Left the delete-trigger's
`hover:text-red-400` variant and a few section-header spans outside the
finding's named file list untouched — different role, out of scope. Verified
with a production build plus the full client test suite.

---

## Watch List

### 11. No cycle guard in six `parentId`/tree-walk functions `[Correctness & Security]`
**Files:** `server/src/lib/itemTree.ts:17–24` (`isSelfRefDescendant`), `:55–72` (`walkItemDescendants`, no visited set); `server/src/routes/items.ts:102–110` (`computeDepth`); `server/src/routes/workflows.ts:14–27` (`addDepths`, caches after recursing); `client/src/lib/hierarchy.ts:18–31` (`getDescendantIds`), `:36–47` (`getAncestors`)

None terminate on a cycle. Today the only guard is `assertValidReparent`,
which Finding #2 shows is bypassable via the projects-reorder batch path. A
`visited: Set<string>` guard in each converts a hang/stack-overflow into a
bounded result. `walkItemDescendants` backs `DELETE /items/:id` — a cycle
there means the delete never returns.

**Status:** ✅ Fixed as specified in all six, as a defense-in-depth measure
— Finding #2's specific bypass is already closed (the batch reorder route
is gone), but these six have no protection against a cycle introduced any
other way (direct DB access, a future migration, a bug elsewhere), so the
guard stands on its own merit. `isSelfRefDescendant` and
`walkItemDescendants` (`itemTree.ts`) thread a shared `visited: Set`
through their recursion/queue; `computeDepth` (`items.ts`) and
`getAncestors`/`getDescendantIds` (client `hierarchy.ts`) each track
visited ids walking their chain; `addDepths` (`workflows.ts`) needed a
second set (`visiting`, the current recursion stack) distinct from its
existing `depthCache`, since the cache only ever gets a node's entry
*after* its recursive call returns — a cycle would never reach that write.
Verified the fix is real, not just plausible: stashed `itemTree.ts` and
reran its new test under a hard `timeout` wrapper (for safety, since a true
infinite loop can't be killed by a test framework's own timeout) — it
crashed with `RangeError: Maximum call stack size exceeded` in seconds,
confirming the "stack-overflow" half of this finding concretely. New tests:
`server/tests/lib/itemTree.test.ts` (new file), plus cycle cases added to
`items.test.ts`, `workflows.test.ts`, and client `hierarchy.test.ts`.

### 12. `res.status(...)` sent inside `db.transaction`, with `return false` as the bail-out convention `[Correctness & Security]`
**Files:** `server/src/routes/items.ts:397–493`; same pattern via `applyReorder` at `items.ts:503`, `columns.ts:92`, `workphases.ts:71`

`db.transaction(cb)` in better-sqlite3 only rolls back on throw — returning
`false` commits. Safe today (all `return false` paths sit before any write),
but the pattern invites a future validation bail-out added *after* a write,
producing a silent partial commit. Sending the response inside the
transaction also means a later throw would hit the global handler with
headers already sent. Validate before opening the transaction, or throw a
typed error and map it to a status outside.

**Status:** ✅ Fixed, via "validate before opening the transaction" (the
first of the fix's two options) — in every case, the check that used to
bail out from inside the callback turned out not to need transaction-scoped
consistency at all: none of these transactions insert or delete the row(s)
the check reads, only update the subject itself, so nothing about an id's
existence/scope can change between a pre-transaction check and the
transaction that later uses it (single-threaded, synchronous
better-sqlite3). `reorder.ts`'s `applyReorder` split into `validateReorder`
(plain `db`, returns a typed `{ok:true,entries} | {ok:false,status,body}`
result) and `applyReorderEntries` (trusted, `tx`-scoped write only) — all
three call sites (`items.ts`, `columns.ts`, `workphases.ts`) updated.
`items.ts`'s `PATCH /:id/move` now validates the anchor (existence,
has-a-position, scope-match) before the transaction opens, reusing the
already-fetched row inside it rather than re-querying via `tx`. Also fixed
the identical pattern in `projects.ts`'s `PATCH /:id/move` (a
`let validationError` + `return false` variant of the same risk) even
though it wasn't in this finding's original file list — it didn't exist yet
when the audit was written, having been introduced by Finding #2's fix
later in the same session, but it's the same class of bug. Verified by
inspecting every remaining `db.transaction` call site in the routes: none
still write `res` or use a falsy-return bail-out internally.

### 13. Missing FK-existence checks on two create routes → opaque 500s for plain bad input `[Correctness & Security]`
**Files:** `server/src/routes/workflows.ts:54–64` (`projectId` unchecked → FK violation; `templateId`/`sourceWorkflowId` unchecked → silently creates a zero-workphase workflow); `server/src/routes/workphases.ts:14–21` (`workflowId` unchecked → FK violation)

`items.ts` already sets the precedent for this exact class (400 with a
specific message at lines 169–172, 192–196, 384–387). These two routes are
user-facing (`SetupWorkflowModal`, `WorkphaseManagerPanel`).

**Status:** ✅ Fixed as specified — still valid, confirmed by re-reading
both routes. `POST /api/workflows` now does a plain-`db` existence check
against `projects` for `projectId` (400 "projectId does not reference an
existing project"), and against `workflowTemplates`/`workflows` for
`templateId`/`sourceWorkflowId` when given (400 with a specific message
each) — all before `db.transaction` opens, matching `items.ts`'s
precedent. `POST /api/workphases` does the same existence check against
`workflows` for `workflowId`. Added 4 regression tests (one per checked
field) across `workflows.test.ts` and `workphases.test.ts`. `tsc --noEmit`
clean; full suite passing (247 tests, up from 243).

### 14. `deleteProjectById` can delete items belonging to a different, since-reparented project `[Correctness & Security]`
**File:** `server/src/routes/projects.ts:93–102`

`allItemIds` unions items owned by this project with items merely sitting in
one of its workphases. Descendant projects are recursed first (the common
inheritance case is fine), but a project that was reparented away — or had
its own workflow assigned — after its items were filed into the old
parent's workphases still has `workphaseId` pointing there. Deleting the old
parent then silently deletes the other project's items. Consider scoping
the delete to `projectId` only (letting `ON DELETE SET NULL` on
`workphase_id` surface the rest as "Unknown status"), or logging what's
cross-project before deleting it.

### 15. Deleting an item leaves its descendants stale in client state `[Correctness & Security]`
**File:** `client/src/components/workflow/useItemManagement.ts:112–114`

```ts
function handleItemDeleted(id: string) {
  setItems(prev => prev.filter(i => i.id !== id));
}
```

The server deletes the whole subtree (confirmed by the confirm-dialog copy
in `ItemDetailPanel.tsx:311`: "and all its children"), but the client
removes only the one id — detached descendants keep rendering as live
top-level cards until a reload; clicking one 404s. Fix: filter by descendant
set (`getDescendantIds` from `lib/hierarchy`) or call `loadBoard()` after
delete, matching every other structural mutation.

### 16. Client mutation handlers with no rejection path, and `.catch(() => {})` that discards the failure entirely `[Correctness & Security]`
**Files (no catch at all):** `App.tsx:66–94,108–119` (`handleMarkAllRead`, `handleDismissNotification`, `handleCreateWorkflow`, `handleCreateProject`, `handleUpdateProject`, `handleDeleteProject`); `item-detail/LabelsSection.tsx:28–51` (`handleToggle`, `handleCreate` — compounds Finding #3); `workflow/useColumnManagement.ts:40–47` (`handleDeleteColumn`, `handleReorderColumns` — sibling create/update handlers *do* have try/catch); `workflow/useBoardManagement.ts:9–20,51–59` (`loadBoards`, `handleDeleteBoard` — the server's `409 Cannot delete a workflow's last remaining board` never reaches the user)
**Files (`.catch(() => {})`):** `App.tsx:48,118,125–128`; `BoardView.tsx:81`; `item-detail/AgentSection.tsx:20`, `AttachmentsSection.tsx:29`, `LabelsSection.tsx:25`; `SetupWorkflowModal.tsx:28`

An uncaught async handler used directly as an event handler is an unhandled
rejection: no revert, no message, UI silently diverges from the DB. A `catch`
that logs nothing renders as a silently-empty list (no agents in the
dropdown, no labels, no templates) indistinguishable from "none exist." The
15s notification poll (`App.tsx:48`) is the one defensible instance of the
second pattern; the rest should at minimum `console.error`.
`handleReorderProject`'s catch (`App.tsx:125`) both discards the error *and*
reverts the UI, so a rejected reorder looks like an unexplained snap-back.

### 17. `withPositionScope` duplicated (differently) between `items.ts` and `boards.ts`, and left embedded in a route file rather than the lib module it pairs with `[Correctness & Security + Duplication & Abstraction + File Responsibility]`
**Files:** `server/src/routes/items.ts:14–114` (`withPositionScope`, `positionScopeFor`, `workphaseIdsInSameWorkflow`); `server/src/routes/boards.ts:17–30` (`withPositionScope`)

Three passes converged on this from different angles. Both `withPositionScope`
implementations wrap `classifyPositionScope` to attach the derived
`positionScope` field to an outgoing row, differing only in how a
workphase's `isTerminal` is looked up — `items.ts` does one query per item
(an N+1 that `boards.ts`'s prebuilt map already avoids). Separately,
`items.ts:14–114` is ~100 lines of pure scope-resolution logic sitting ahead
of the route handlers rather than in `server/src/lib/positionResolver.ts`,
the natural pairing (it's reused across three handlers and is dense enough
to warrant the same standalone unit tests `coarsestFit`/`resolveAnchorPosition`
already get). Worth noting `workflows.ts` GET `/:id` attaches no
`positionScope` at all — a third read path making its own independent call.

**Fix:** Move a single `withPositionScope(item, isTerminalOf: (id) => boolean | null)` into `positionResolver.ts`; `items.ts` passes a query closure, `boards.ts` passes `id => map.get(id) ?? null`; extract `positionScopeFor`/`workphaseIdsInSameWorkflow` alongside it, leaving `items.ts` as route handlers + thin wiring.

**Status:** ✅ Fixed, into a different lib module than suggested — all three
parts closed. Consolidated `withPositionScope` into one function in
`itemPositionScope.ts` (not `positionResolver.ts`) taking an `isTerminalOf`
lookup closure: `items.ts`'s GET `/:id` now batches its lookup across the
item + all its children in one query (closing the N+1), `boards.ts` passes
its existing prebuilt map unchanged. `positionScopeFor`/
`workphaseIdsInSameWorkflow` moved to `itemPositionScope.ts` alongside it
rather than `positionResolver.ts` — items-only vocabulary belongs with
`classifyPositionScope`, matching the precedent already set when that
function was pulled out of `positionResolver.ts`'s orbit for the same
reason (its own header comment says "not table-generic the way
positionResolver.ts is"). `workflows.ts` GET `/:id` now attaches
`positionScope` too, reusing already-fetched workphase rows with zero extra
queries — closing the third read path the finding flagged as a "worth
noting" gap. New tests in `workflows.test.ts` and `items.test.ts` (the
latter covering the N+1 fix specifically, with two distinct workphases in
one response).

### 18. `itemTypes.ts` PUT calls `.trim()` on an unvalidated value; POST/PUT diverge on empty-string acceptance `[Correctness & Security]`
**File:** `server/src/routes/itemTypes.ts:45`

`if (name !== undefined) updates.name = name.trim();` — `{"name": null}` or
`{"name": 5}` throws a `TypeError` → 500. POST correctly rejects an empty
`name` (`!name?.trim()`, line 19); PUT doesn't. Same class in `items.ts`:
POST rejects an empty `title` (line 157) but PUT (line 275) accepts one.

### 19. MCP interpolates tool arguments into URLs unescaped `[Correctness & Security]`
**File:** `server/src/mcp.ts:140,148,155,194,207,217`

Not SQL injection (Drizzle parameterizes everywhere) — an id containing
`/`, `?`, or `#` silently retargets the request to a different endpoint.
`encodeURIComponent` each interpolated value.

### 20. Test helper sorts on a possibly-null `position` `[Correctness & Security]`
**File:** `tests/helpers/itemRepositioningScenario.ts:110`

`a.position - b.position` yields `NaN` for a done/unsorted item (`position`
is `null` by design per Part 6); `NaN` comparators produce
implementation-defined order. The sibling helper at line 180 already guards
with `(a.position ?? 0)`. Not currently reachable (all scenario items are
active), but a real Part-6 ordering regression would read as flake rather
than a failure.

### 21. `WorkPhase` (capital P) naming in the client API/type layer diverges from the rest of the codebase's `workphase` convention `[Consistency & Drift]`
**Files:** `client/src/types.ts:27` (`export interface WorkPhase`); `client/src/api/workphases.ts` (mirrors the capitalization in every function name)

Every component/hook (`WorkphaseManagerPanel.tsx`, `WorkphaseCardList.tsx`,
`useWorkphaseManagement.ts`, schema field `workphaseId`, table `workphases`)
uses the lowercase-compound form. Cosmetic (TypeScript doesn't care) but a
real, consistent drift with a 22-file blast radius that a future
contributor could copy the wrong casing from. Not worth a mechanical rename
now; worth fixing opportunistically.

**Status:** ✅ Fixed, decided as a real convention rather than left
opportunistic — the user confirmed `workphase`/`Workphase` is deliberately
treated as one compound word (parallel to `workflow`), so `WorkPhase` is
wrong casing, not an acceptable alternate spelling. Renamed `WorkPhase` →
`Workphase` everywhere it appeared (28 occurrences across 8 client files:
`types.ts`'s interface, `api/workphases.ts`'s exported functions —
`createWorkphase`/`updateWorkphase`/`deleteWorkphase`/`reorderWorkphases` —
and every consumer of that type/those functions). Repo-wide scan confirmed
no `workPhase` (camelCase), `work phase` (two words), or `work-phase`/
`work_phase` variants exist anywhere — `WorkPhase` was the only drift.
Handled together with Finding #23 below, per the same request. Full client
suite + production build verified after.

### 22. `Tx` type redeclared locally in two files instead of importing the shared export `[Consistency & Drift + Duplication & Abstraction]`
**Files:** `server/src/lib/boardCascade.ts:5` (`type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]`); `server/src/lib/columnRanges.ts:146` (`type DbClient = … | typeof db`)

`server/src/db/index.ts` already exports `Tx`, imported everywhere else
(`positions.ts`, `getOrNotFound.ts`, `items.ts`, `attachedCascade.ts`,
`positionResolver.ts`, `boards.ts`, `projects.ts`). Harmless today since the
shapes are identical, but it's the same concept declared three times —
could silently diverge if the canonical `Tx` type changes.
`import type { Tx } from '../db/index.js';` and drop both local redeclarations.

**Status:** ✅ Fixed as specified — `boardCascade.ts`'s local `Tx` dropped
in favor of importing the canonical one; `columnRanges.ts`'s `DbClient`
(a genuinely distinct, wider type — `Tx | typeof db`, not a pure duplicate)
now builds on the imported `Tx` instead of re-deriving the same
`Parameters<Parameters<...>>` expression inline. `tsc --noEmit` stayed
clean after the swap, confirming the shapes really were identical. Full
suite (243 tests) passing.

### 23. "workphace" typo in doc comments `[Consistency & Drift]`
**Files:** `client/src/components/workflow/boardDndUtils.ts:64,71`; `useBoardDnd.ts:119`

E.g. `// Genuine cross-column move: workphaceId changes to targetWorkphaseId.`
Comment-only, but these are doc comments future contributors will read when
working in this file.

**Status:** ✅ Fixed, and far more widespread than this finding's file list
— a repo-wide scan (prompted by handling this together with Finding #21)
found the same typo in 9 living files, not 2: the two named here plus
`boardDndUtils.test.ts`, `server/tests/routes/items.test.ts`, and — the
bulk of it — five prose docs (`docs/wiki/item-positioning/README.md`,
`docs/test-plans/item-positioning/part-{2,4,5,6}-*.md`), where it had
spread well beyond code comments into permanent reference documentation.
Left two *historical* occurrences untouched on purpose: this finding's own
quoted illustration above (the evidence, not a live comment) and this
finding's own title. Fixed one more incidental, unrelated instance of the
same typo found along the way: `docs/audits/code-quality-audit-epic3.md:126`
(an older audit's prose, quoting the real `workphase_id` MCP field name
with the same one-letter typo).

### 24. `ConfirmDeleteButton` renders an X (close-style) icon for its delete trigger, not the trash icon `[Consistency & Drift]`
**File:** `client/src/components/ConfirmDeleteButton.tsx:85`

`icons.tsx`'s header comment frames `TrashIcon` as the delete affordance,
and `ProjectPage.tsx` (which implements its own separate hand-rolled
delete-confirm UI — see Finding #26) correctly uses `TrashIcon` for both its
delete buttons. But `ConfirmDeleteButton` — the shared component used by
`AgentsModal`, `BoardColumn`, and `WorkphaseManagerPanel` — shows `<XIcon />`
instead, which reads as "dismiss" rather than "delete." A real semantic
mismatch between two delete-affordance implementations living side by side.

### 25. `getWorkphaseItemsFrom` / `getMergedColumnItemsFrom` duplicate every filtering/sorting rule except the membership predicate `[Duplication & Abstraction]`
**File:** `client/src/components/workflow/useItemManagement.ts:20–61`

Both filter by workphase membership → apply `filterProjectId` → exclude
`positionScope === 'attached-siblings'` → sort by `completedAt` if
`isTerminal`, else by position-then-created. The only real difference is
`item.workphaseId === workphaseId` vs `coveredSet.has(item.workphaseId)`;
their own doc comments already cross-reference each other. Any future
filter change (Epic 4's `kind: quick`, Epic 5's tags) needs both edited in
lockstep. Consolidate into one `selectBoardItems(items, matchesWorkphase, filterProjectId?, isTerminal?)`; keep both exported names as thin wrappers.

### 26. Confirm-delete pattern hand-rolled again in `ProjectPage.tsx` (×2) and `SortableProjectRow.tsx`, despite `ConfirmDeleteButton` already existing for exactly this `[Duplication & Abstraction + File Responsibility]`
**Files:** `client/src/components/ProjectPage.tsx:208–228` (project self-delete), `:353–373` (subproject delete); `client/src/components/sidebar/SortableProjectRow.tsx:148–165`

`ProjectPage`'s two blocks are the clearest case: identical Yes/No markup,
byte-identical classes (`rounded bg-red-900/60 px-2 py-0.5 text-xs
font-medium text-red-300 transition-colors hover:bg-red-800/60` at both
`:218` and `:363`), and the same confirm/deleting state machine duplicated
under two different variable-name pairs
(`confirmDeleteProject`/`deletingProject` vs `confirmDeleteId`/`deletingId`).
This is also a File Responsibility signal — it's one of several reasons
`ProjectPage.tsx` (415 lines) mixes more than one concern (see Finding #29).
`SortableProjectRow`'s copy is a genuine third variant (hover-revealed,
different chrome) — fold in only if `ConfirmDeleteButton` grows a matching
mode, don't force it. Extract a `ConfirmDeleteInline` sub-component for the
two `ProjectPage` call sites now; they differ only in prompt text and the id
being deleted.

### 27. E2E "seed a templated workflow" logic duplicated 4×; API base URL hardcoded ~18× `[Duplication & Abstraction]`
**Files:** `tests/api/boards.spec.ts:10–18` (`createFlowWorkflow`); `tests/api/attachedChildren.spec.ts:10–20` (`setupWorkflow`); `tests/ui/attached-children.spec.ts:5–14` (`createTemplatedWorkflow`); `tests/ui/boards-layer.spec.ts:7–35` (`createBareWorkflow`/`addWorkphases`/a second `createTemplatedWorkflow`)

Four names for "POST project → GET workflow-templates → find by name → POST
workflow → pick phases out of the response." `tests/helpers/` already hosts
`db.ts` and `itemRepositioningScenario.ts` — an obvious home. Separately,
`const BASE`/`const API = 'http://localhost:3002/api'` is declared roughly
18 times across `tests/api/*`, `tests/ui/*`, and `tests/helpers/db.ts:2` —
18 edits if the E2E port ever moves. Add `tests/helpers/api.ts` (the `API`
constant) and `tests/helpers/seed.ts` (`seedTemplatedWorkflow`/
`seedBareWorkflow`/`addWorkphases`).

### 28. Item-detail section header/add-form/Escape-handler scaffolding duplicated across sections; `BoardColumn`'s inline add-item form duplicates `ChildrenSection`'s `[Duplication & Abstraction]`
**Files:** `ChildrenSection.tsx:84–91,144–166`; `LabelsSection.tsx:55–62,101–115`; `AttachmentsSection.tsx:49–56,109–130`; `ParentSection.tsx:61`; `AgentSection.tsx:66`; `BoardColumn.tsx:178–235` vs `ChildrenSection.tsx:129–168`

The section header row (label + conditional `+ Add` toggle using
`BTN_ADD_TRIGGER`) is written out identically 3 times, with 2 more files
using the label-only half; the add-form footer (`BTN_PRIMARY`/`BTN_CANCEL`
+ Escape-resets-draft handler) is duplicated 3 times. Separately,
`BoardColumn.tsx:178–235` and `ChildrenSection.tsx:129–168` implement the
same feature twice — "inline title input + type select + Add/Cancel, Escape
to dismiss" — with `BoardColumn`'s copy fully inlining classes that shadow
`INPUT_LG`/`SELECT_BASE`/`BTN_PRIMARY`/`BTN_CANCEL`. A `<DetailSection
label onAdd?>` wrapper and a `<FormActions submitLabel onCancel disabled?>`
would cover the first; a shared `<InlineItemForm>` (or at minimum swapping
`BoardColumn`'s inline classes for the existing constants) covers the
second.

### 29. Four inline SVGs re-duplicated next to an `icons.tsx` built specifically to prevent this `[Duplication & Abstraction]`
**File (target):** `client/src/components/icons.tsx` (whose header already cites Epic 3 audit finding #28: "X/close and trash paths were re-inlined across components")

- **Plus icon**, identical path, 3 copies: `ProjectSidebar.tsx:157–167`,
  `ProjectPage.tsx:332–342`, `SortableProjectRow.tsx:174–184`.
- **A second, different trash-icon path** at `SortableProjectRow.tsx:192–203`,
  while the existing `TrashIcon` is used at `ProjectPage.tsx:242,388` — two
  trash glyphs in one feature area.
- **Drag-handle 6-dot grid**, same shape at two sizes: `BoardColumn.tsx:93–100`,
  `SortableProjectRow.tsx:107–114`.
- Their container button classes duplicate too:
  `flex h-5 w-5 items-center justify-center rounded text-zinc-500
  transition-colors hover:bg-zinc-700 hover:text-zinc-200` is identical at
  `ProjectSidebar.tsx:153` and `ProjectPage.tsx:329`.

Add `PlusIcon` and `DragHandleIcon` to `icons.tsx`; point `SortableProjectRow`
at the existing `TrashIcon`.

### 30. `App.tsx` mixes the project/workflow shell with a fully self-contained notifications feature `[File Responsibility]`
**File:** `client/src/App.tsx:44–64,176–230`

Poll-on-interval fetch, outside-click-to-close dropdown, mark-read/mark-all
handlers, and ~55 lines of dropdown JSX for notifications sit inside the
same file as project selection, workflow-inheritance resolution, and page
layout — an unrelated sub-feature per the Component Composition guide.
Extract a self-contained `NotificationsBell.tsx`. Not urgent — no bug, just
an available seam.

### 31. `ProjectPage.tsx` mixes five concerns in one 415-line file `[File Responsibility]`
**File:** `client/src/components/ProjectPage.tsx:30–414`

Tab-shell (Overview/Board/Inbox), inline name/description edit-in-place
state machine, a parent-project selector, a subprojects list with its own
delete confirmation (Finding #26), a self-delete confirmation, and
board-tab rendering all live in one file — the largest client file in this
audit's scope. Split into `ProjectOverviewTab.tsx` (edit state, parent
selector, subprojects list) and keep `ProjectPage.tsx` as tab shell +
board-tab wiring; swap both confirm-delete blocks for `ConfirmDeleteButton`
per Finding #26 while there.

---

## Informational

### 32. Positive confirmations `[all passes]`
- **`ENABLE_TEST_ROUTES` guard is safe:** `server/src/index.ts:45` mounts
  `/api/test` only on an exact `=== 'true'` match, default off; the only
  setter is `playwright.config.ts:28`, pointed at `./data/test.db`; the
  committed `server/.env` doesn't set it.
- **Global error middleware present and correctly last**
  (`index.ts:54–57`) — every 500 mentioned in this audit does reach a
  server log; the findings above are about the client-facing signal, not a
  missing trace.
- **No SQL string interpolation anywhere** — all Drizzle; the three raw
  statements in `runMigrations.ts:89–103` use `?` bindings.
- **`reindexScope`'s `isNotNull(items.position)` guard is correct and
  necessary** — without it, SQLite's NULLS-FIRST ordering would sort done
  items first and write real positions onto them.
- **`inArray(col, [])` is safe** in the pinned drizzle-orm version — compiles
  to `false`, not a syntax error.
- **Migrations 0008/0009 use the correct SQLite table-rebuild pattern**,
  wrapped in `foreign_keys = OFF`; schema matches the resulting DDL.
- **Delete cascades reach the full descendant tree** — item DELETE collects
  the whole subtree in app code (no FK on `parentId`), `deleteProjectById`
  recurses into child projects first, and `boardCascade.ts`/`workflows.ts`
  DELETE order boards/columns before workphases correctly.
- **`coarsestFit` boundary behavior verified sound** against
  `positionResolver.test.ts:33–59` across negative inputs, zero, and
  round-half-up; the reindex-and-retry with `allowRetry=false` provably
  terminates.

### 33. Consistency pass — no other drift found `[Consistency & Drift]`
- Route shape convention (create/update return the full record; bulk/toggle
  return `{success:true}`) followed uniformly across every reviewed route
  file.
- `itemId`/`workflowId`/`workphaseId` naming (never `workItemId`/`boardId`)
  consistent everywhere, including the new `server/src/lib/*` modules and
  the client's `api/*.ts` split.
- The `positionScope` computed-field contract ("derived, never stored") is
  applied consistently everywhere it appears — no place re-derives
  `isAttached && parentId` inline where it should be used instead.
- Migration hygiene (0007–0010 + `meta/_journal.json`) matches `schema.ts`.
- The `client/src/api/*.ts` split is internally consistent — every export
  is imported and used from exactly the module that needs it, aside from
  Finding #34 below.

### 34. `fetchWorkflow(id)` (singular) has no client call sites `[Consistency & Drift]`
**File:** `client/src/api/workflows.ts:10`

Only `fetchWorkflows` (plural, list) is called from `App.tsx` — the board
view moved to `fetchBoard` (board-scoped) as its data source. The route
itself isn't dead (still used by MCP's `get_workflow`), just this client
wrapper. Worth pruning next time this file is touched.

### 35. `ItemDetail` type doesn't declare the `workflowId` field the server actually returns `[Consistency & Drift]`
**Files:** `client/src/types.ts` (`ItemDetail`); `server/src/routes/items.ts:140`

`GET /api/items/:id` sends `res.json({ ...withPositionScope(item),
workflowId, depth, children, activity })`, but `ItemDetail` has no
`workflowId` member. Not currently a bug (nothing reads it client-side) —
a real gap between the documented type and the wire shape.

### 36. `ProjectPage.tsx`'s disabled `'inbox'` tab is type-asserted rather than included in the state union `[Consistency & Drift]`
**File:** `client/src/components/ProjectPage.tsx`

`tabs` includes an `id: 'inbox'` entry, `disabled: true`, while
`useState<'overview' | 'board'>` doesn't include `'inbox'` — papered over
with `tab.id as 'overview' | 'board'`. Currently safe only because the
click handler path is unreachable while disabled. Looks like Epic 6 (Inbox)
scaffolding, but the roadmap doesn't explicitly name this placeholder tab
under Epic 6 — flagged Watch List with this note per the audit persona's
rule, not tagged Covered by Epic 6.

### 37. `mcp.ts` repeats the tool-result envelope 8 times `[Duplication & Abstraction]`
**File:** `server/src/mcp.ts:133–224`

`content: [{ type: 'text', text: JSON.stringify(x, null, 2) }]` appears 4×,
the plain-string `text:` variant 4× more. A `jsonResult(x)`/`textResult(s)`
pair would shrink the switch. Tidiness only, not risk-reducing.

### 38. Two fractional-position implementations, confirmed deliberate, not duplication `[Duplication & Abstraction]`
**Files:** `client/src/lib/positions.ts` (`positionBetween`, client-computed midpoint, project sidebar only) vs `server/src/lib/positionResolver.ts` (`coarsestFit` + reindex-and-retry, server-resolved, items only)

Two different position domains Epic 3.2 deliberately split — `positionResolver.ts`'s
"never trust a client-computed value" rationale was scoped to items and
never extended to project ordering. Recording so a future pass doesn't
mistake this for drift; whether project reordering should eventually move
to the same server-resolved contract is a roadmap scoping question, not a
duplication finding. Similarly, `server/src/lib/positions.ts::nextPosition`
(boards/columns/workphases — non-nullable, no scope predicate, no reindex)
vs `resolveAppendPosition` (items) are correctly separated, each used
consistently at its call sites — verified, no action.

### 39. Per-file test setup helpers scattered across `server/tests`, including a same-file naming collision `[Duplication & Abstraction + Consistency & Drift]`
**Files:** `server/tests/routes/items.test.ts:249,492,771`; `columns.test.ts:81,278`; `lib/positionResolver.test.ts:22`

Six local "createProject → createWorkflow → createWorkphase(s)" variants on
top of the shared `server/tests/fixtures.ts`, differing only in phase
names/flags — a `seedWorkflowWithPhases(...specs)` in `fixtures.ts` would
cover all six. Below Watch List threshold since each is already thin, but
`items.test.ts` has **two different functions both named `setupTwoPhases`**
in separate `describe` blocks (`:249` Todo+Done-terminal, `:771` Todo+In
Progress) — a naming collision a shared parameterized helper would
eliminate by construction.

### 40. `BoardToolbar.tsx` bundles five control clusters — unchanged since the Epic 3 audit, still deliberately deferred `[File Responsibility]`
**File:** `client/src/components/BoardToolbar.tsx` (218 lines)

Same finding as Epic 3 audit #19: board switcher/CRUD, add-column trigger,
manage-workphases trigger, and child-default-workphase selector share one
file. That audit deferred the split pending the Epic 8+ interface rework;
still true, still deferred — not re-flagged as new, noted for continuity
only.

### 41. `items.ts` PUT/move handlers embed several sub-steps inline `[File Responsibility]`
**File:** `server/src/routes/items.ts:250–356` (PUT), `:363–497` (PATCH `/move`)

Each handler embeds field update, reparent validation, position-scope
resync, attached-descendant cascade, terminal-transition handling, activity
logging, and notification insert inline rather than as named helper calls.
Complexity/readability observation more than a "wrong file" one — the
module-level extraction in Finding #17 would already pull out the densest
reusable piece.

---

## Notes on Prior Findings

- **Epic 3 audit finding #15** ("reorder endpoints diverge in validation
  rigor," fixed via `applyReorder`, with projects intentionally left
  bespoke to handle its cycle-guard shape) turns out to have left the
  bespoke path with real gaps — see Finding #2 above, which is a direct
  follow-up.
- **Epic 3 audit finding #28** (icon consolidation) held up for the
  original 5+2 sites, but Finding #29 above shows new duplicate icons
  (Plus, a second trash variant, drag-handle) accumulated in files added
  since — the pattern that fixed the last round wasn't picked up
  uniformly in this one.
- Confirm-delete consolidation (Epic 3 audit finding #9) held up at its
  original 3 sites but wasn't extended to `ProjectPage.tsx`/
  `SortableProjectRow.tsx`, which predate `ConfirmDeleteButton` and were
  never migrated — see Finding #26.

---

## Covered by Future Epics

Nothing this round. No finding matched a gap the roadmap names under a
specific numbered epic — everything above sits inside Epic 3/3.2's own
surface. (Finding #36's inbox-tab scaffolding looks Epic-6-adjacent but
isn't explicitly named there, so it's kept on the Watch List per the audit
persona's tagging rule rather than guessed at.)

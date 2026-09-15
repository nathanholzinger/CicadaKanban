# Code Quality Audit — Epic 3.5 Story 2 (2026-09-11)

Scope note: audited commit `fb3d5d8` ("implement Story 2 — Drop-target
validity + relationship overlays"), Epic 3.5 Story 2, HEAD with a clean
tree. Story-scoped per explicit request. Mostly client work — the new
per-drag classification module (`workflow/dragClassification.ts` +
`DragClassificationContext.ts`), depth/height additions to
`lib/hierarchy.ts`, the `useBoardDnd` cancel path, the reindex-disclosure
client half (`applyItemWriteResponse`), Card/Stub overlays in
`KanbanCard.tsx`, and a one-field server addition (`boards.ts` now returns
`itemDepthCap`). Run as four parallel passes per
`.claude/guides/audit-workflow.md`; each finding is tagged with the
pass(es) that surfaced it. The Fix Now correctness finding and the
highest-severity Watch List items were re-traced by hand against current
code before inclusion. Tags: **Fix Now**, **Watch List**, **Covered by
Epic N**, **Informational**. One finding qualifies for **Covered by Epic
3.5 (Story 5)** — the Epic 3.5 roadmap names Story 5 as the story that
opens the Stub drag-out path.

Story 1 follow-through: this commit closes Story 1 audit **#22**
(`MoveItemInput` now matches `HierarchyRequest` field-for-field) and the
constant half of **#21** (`ITEM_DEPTH_CAP` has one definition, reaches the
client as `board.itemDepthCap`, never hard-coded client-side). The formula
half of #21 was accepted as deliberate parallelism by Story 2 decision 1 —
see #10 below for the residual. Status lines added to the Story 1 doc.

Overall shape: the classification math is right. `getDepth` /
`getSubtreeHeight` / `isWithinDepthCap` agree with the server's
`hierarchyDepth` / `subtreeHeight` / `assertWithinDepthCap` on well-formed
data, including the cap boundary and detached-branch height; every client
walk is cycle-guarded with the same seed-with-self convention; the four
`DropTargetState` values are spelled identically across module, context,
component, E2E spec, wiki, and `client/CLAUDE.md`; nothing corrupts state or
opens a security surface. The real gaps: (a) the optimistic re-bucket
preview is now restored on Escape but still stranded on a no-op *drop*;
(b) `client/CLAUDE.md`'s Story 1 section contradicts the Story 2 section
added below it in the same commit; (c) `lib/hierarchy.ts` grew a second
descendant-BFS body — the exact shape Story 1 #5 collapsed server-side this
same epic — and classification walks the subtree twice per drag; (d) small
copies re-accumulated in the move call path, Card/Stub chrome, and test
fixtures ahead of Stories 3–6 adding to each.

---

## Fix Now

### 1. `handleDragEnd`'s no-op exits leave the live re-bucket preview in place — the same bug `handleDragCancel` now fixes, one function down `[Correctness & Security]`
**File:** `client/src/components/workflow/useBoardDnd.ts:85–94` (the cancel fix), `:122–124` (`if (!over) return;`), `:171–172` (`if (!resolution) return;`)

`handleDragOver` optimistically rewrites `workphaseId` on every genuine
cross-column hover (`:113–115`). The commit correctly identifies that an
Escape-cancel used to strand that preview and adds `handleDragCancel` to
restore from the `activeItem` snapshot. The same stranded state is
reachable via a *drop*: hover across column B (X now renders in B), then
release over the Unsorted bucket, a broken column, an expanded column's
outer wrapper, or dead space — `resolveDrop` returns null (or `over` is
null) and `handleDragEnd` returns without touching `items`. X is drawn in
B, the server still has A, nothing reconciles until a reload or the next
write. Worse, the next drag of X snapshots the wrong `workphaseId`, so
`resolveDrop` misjudges a real drop into B as a same-group reorder and the
server's legacy `scopeWorkphaseIds` fallback appends in A — X visibly
jumps back. Self-healing, but exactly the "silent wrong" this story set
out to close. Verified by hand.

**Fix:** lift `handleDragCancel`'s restore into a local
`restorePreview()` and call it before both early returns in
`handleDragEnd`. (Pre-existing and preview-only, no fix required: hovering
*back* over the origin column resolves to `'reorder'`, which
`handleDragOver` ignores, so X keeps rendering in the last previewed
column until release.)

**Status (2026-09-11):** resolved as proposed — `restorePreview()` in
`useBoardDnd.ts`, called from `handleDragCancel` and before both early
returns in `handleDragEnd`. Regression test 5.a in
`tests/ui/item-repositioning-cross-column-dnd.spec.ts` (hover Column Two,
release on an Unknown-status card in Unsorted — the `resolveDrop → null`
path); confirmed it fails with the restore disabled.

### 2. `client/CLAUDE.md`'s Story 1 section contradicts the Story 2 section added directly below it in the same commit `[Consistency & Drift]`
**File:** `client/CLAUDE.md:166`, `:177` vs `:180–203`

Two sentences in "Hierarchy Changes — One Primitive, Three Entry Points
(Epic 3.5 Story 1)" were written when Story 2 was future work and weren't
revisited when this commit added "Drag-Target Classification (Epic 3.5
Story 2)" right after it:

- `:166` *"The client doesn't consume it yet (Story 2 decides how it's
  shared)."* — false; `:185` says the cap is read as `board.itemDepthCap`.
- `:177` *"The client half (apply, then check inversions) is Story 2."* —
  only the *apply* half shipped; the inversion tripwire moved to Story 3
  (the wiki at `docs/wiki/item-positioning/README.md:7–10` states this
  correctly).

**Fix:** reword `:166` to say the cap is now consumed (point at the Story
2 section); reword `:177` to say apply landed in Story 2, inversion check
is Story 3 — matching the wiki's phrasing.

**Status (2026-09-11):** resolved — both sentences reworded; the
`lib/hierarchy.ts` file-structure line also updated for #3 and a
`src/test/` line added for #5.

### 3. `lib/hierarchy.ts` now has two descendant-BFS bodies, and classification walks the same subtree twice per drag `[Duplication & Abstraction]` (cross-ref: File Responsibility)
**Files:** `client/src/lib/hierarchy.ts:22–37` (`getDescendantIds`), `:74–98` (`getSubtreeHeight`), `:127–133` (`buildParentOptions`'s `byParent` index); `client/src/components/workflow/dragClassification.ts:48–49`

`getSubtreeHeight` (new) seeds `visited` with the root, loops a frontier,
skips visited, pushes — the same loop as `getDescendantIds`, differing
only in level-by-level processing so it can count generations. That is
byte-for-byte the shape Story 1 #5 collapsed server-side this epic
(`walkItemDescendantLevels`). The story plan said "level-ordered BFS
beside `getDescendantIds`", so the parallel was planned, but the server
precedent says fold; the cycle guard is now maintained in two client
loops. Compounding it, `classifyDragTargets` calls `getDescendantIds`
then `getSubtreeHeight` on the same root — two full walks per drag start
where one yields both. `getSubtreeHeight`'s `childrenOf` index is also
the same "group by parentId" builder as `buildParentOptions`'s
`byParent`.

**Fix:** one exported core `getDescendantLevels(id, nodes): string[][]`
(childrenOf-indexed, visited-guarded, FIFO); `getDescendantIds` =
`new Set(levels.flat())`, `getSubtreeHeight` = `levels.length`;
`classifyDragTargets` calls it once and derives both. Optionally lift
`childrenByParent(nodes)` for `buildParentOptions` too. All covered by
`hierarchy.test.ts`. (Adjacent, not this lane: `getDepth` rebuilds
`getAncestors`'s id→node `Map` once per target — fine at board size; a
single indexed pass would fix that as well.)

**Status (2026-09-11):** resolved as proposed — exported
`getDescendantLevels` (childrenOf-indexed, visited-guarded) is the one
walk; `getDescendantIds` and `getSubtreeHeight` derive from it;
`classifyDragTargets` calls it once. `buildParentOptions`'s `byParent` was
left alone — it groups node objects and re-roots dangling parents, a
different shape. The `getDepth` per-target `Map` rebuild is untouched.

### 4. Attached-sibling reorder in `useBoardDnd` is a hand copy of `applyItemMove`, and this commit edited both `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:158–168`; `client/src/components/workflow/boardDndUtils.ts:192–216`

Both are `try { const updated = await moveItem(activeId, …); setItems(prev => applyItemWriteResponse(prev, updated)); } catch { console.error; loadBoard(); }`,
differing only in the request literal and log string. The pair predates
this story (Epic 3.2 Part 3), but this commit had to change the `setItems`
line in both places identically — the drift signal. Stories 4/5/6 each add
another `moveItem` call path.

**Fix:** split `applyItemMove` into a pure `buildMoveInput(resolution, side): MoveItemInput`
(unit-testable, keeps TC-2.11) and `sendItemMove(moveItem, activeId, input, setItems, loadBoard)`
owning the one try/fold/reload block; the attached-child branch becomes a
one-line call. Re-point the existing `applyItemMove` tests at the halves.

**Status (2026-09-11):** resolved as proposed — `buildMoveInput` +
`sendItemMove` in `boardDndUtils.ts`; `applyItemMove` removed; both
`useBoardDnd` call paths go through `sendItemMove`; tests split into a
`buildMoveInput` describe (request shapes) and a `sendItemMove` describe
(fold/resync contract).

### 5. Third full `Item` fixture factory in `components/workflow/` tests `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragClassification.test.ts:10–28` (new), `useItemManagement.test.ts:16–37`, `boardDndUtils.test.ts:282–299`

Three 15-field `Item` literals with the same defaults. Two carry the same
`positionScope = isAttached && parentId ? 'attached-siblings' : 'workflow'`
derivation with the same "mirrors how the API sets it" comment; the third
omits `positionScope`. That rule is exactly what Story 1 #12 and Epic 4's
`kind` may change, and every remaining Epic 3.5 story adds `Item[]`
fixtures. No client test-helper module exists yet.

**Fix:** `client/src/test/itemFixture.ts` exporting
`makeItem(id, overrides?: Partial<Item>): Item` with the `positionScope`
derivation in one place; the three local factories become thin aliases.

**Status (2026-09-11):** resolved as proposed — `client/src/test/itemFixture.ts::makeItem`;
`useItemManagement.test.ts` aliases it directly, `dragClassification.test.ts`
keeps its positional `(id, parentId, attached)` wrapper over it,
`boardDndUtils.test.ts`'s `fakeItem` is a one-line override.

---

## Watch List

### 6. Server counts a dangling `parentId` as a level; the client reads it as a root — off by one at the cap boundary `[Correctness & Security]`
**Files:** `server/src/lib/itemTree.ts:63–74` (`hierarchyDepth`), `client/src/lib/hierarchy.ts:64–67` (`getDepth`); client behavior pinned at `hierarchy.test.ts:67–73`

`hierarchyDepth` does `visited.add(parentId); depth++;` *before* fetching
the parent row, so an item whose `parentId` points at a nonexistent row is
depth 2 on the server and depth 1 on the client (`getAncestors` breaks on
a map miss). Verified by hand. `items.parentId` is a soft ref, so the DB
can't rule it out. For a target at exactly `cap − 1 − h` with a dangling
link in its chain, the client shows `valid` and the server 400s. Only
stale/corrupt data produces it (POST rejects a missing parent, DELETE
walks the subtree), so Watch List — but the two sides disagree on the
definition and the server's own comment ("a root item is at depth 1")
describes the client's behavior. No server test pins either.

**Fix:** in `hierarchyDepth`, fetch the parent row first and increment only
when it exists; add a dangling-parent case to `itemTree.test.ts` asserting
depth 1.

### 7. Client classifies the active item's *current* parent through the cap formula; the server skips the cap for a same-parent request `[Correctness & Security]`
**Files:** `client/src/components/workflow/dragClassification.ts:71`; `server/src/lib/itemHierarchy.ts:121–126`

`validateHierarchyRequest` skips `assertWithinDepthCap` when
`req.parentId === item.parentId` ("the cap gates reparents, not existing
data"). The client has no equivalent: `P` is `valid` for its own child `X`
only while existing data is already within cap. Always true today; stops
being true the moment the constant is lowered (Story 7 re-derives it), at
which point every over-cap subtree shows its own parent as `depth-capped`
while the server would accept a re-attach. No drop outcome depends on it
yet (decision 3). Looks deferred — verify against the roadmap.

**Fix when Story 4 gives Card→Card a meaning:** in `classifyDragTargets`,
treat `item.id === active.parentId` as `valid` regardless of the formula;
add the case to `dragClassification.test.ts`.

### 8. `ItemDetailPanel`'s inner handler chain doesn't honor `ItemWriteResponse` — stray `reindexed` lands in Sheet state, and section props stay typed `Item` `[Correctness & Security + Consistency & Drift]`
**Files:** `client/src/components/ItemDetailPanel.tsx:220–223`, `:226–229`, `:232–239` (three local wrappers spread the raw response); `client/src/components/item-detail/AgentSection.tsx:9`, `ParentSection.tsx:12`, `ChildrenSection.tsx:13–14` (callback props typed `Item`)

`api/items.ts:19` says "`reindexed` is stripped so it never lands in an
Item", and `applyItemWriteResponse` honors that for the board. The Sheet's
three local handlers take `updated: Item` (structurally satisfied by
`ItemWriteResponse`, whose extra field is optional) and spread the whole
response into `detail` / `detail.children`, so after a reindexing PUT from
`ParentSection` / `ChildrenSection` the local row carries a stray
`reindexed` array. Nothing reads it today — a claim violation, not a bug.
The same structural loophole means the section callback props one layer
in are still typed `Item` even though the commit typed `onUpdate` /
`onChildCreated` as `ItemWriteResponse` one layer up "so the raw shape is
visible" — it isn't, past the first hop. `ParentSection.handleParentChange`
(`:36`) is exactly the reparent write that can reindex, and its signature
says nothing about it. Runtime is correct only because the same object
reference is passed straight through every wrapper; any future
reconstruction (`{...updated, x}`) would silently drop the disclosure with
no type error.

**Fix:** thread `ItemWriteResponse` through the three section callback
props and the three local wrappers; in the wrappers, strip before
spreading into local state (`const { reindexed: _, ...row } = updated;` or
a `stripReindexed()` beside `applyItemWriteResponse`) and forward the full
response to `onUpdate` unchanged.

### 9. Write responses disclose reindexed positions but not cascade side-effects, so descendants in board state go stale after any hierarchy write `[Correctness & Security]`
**Files:** `client/src/components/workflow/useItemManagement.ts:15–24`, `:148–150` (comment: "every write path lands through applyItemWriteResponse"); server cascades at `server/src/lib/itemHierarchy.ts:271–280`

`applyItemWriteResponse` upserts one row plus `{id, position}` pairs. A
move of a Card with attached Stubs cascades `workphaseId` to those Stubs
server-side; a Sheet reparent into another project cascades `projectId`
to every descendant and may null foreign positions. None of that reaches
the response, so the client's copies keep old `workphaseId` / `projectId`
/ `position` until a reload. Invisible for the board gesture today (Stubs
render by `parentId`), but `findWorkphaseForItem(stubId)` answers stale,
and a Sheet-driven cross-project reparent leaves the subtree under the old
project in a `filterProjectId` view. Pre-existing, not made worse; recorded
because this commit's comment now states a completeness guarantee the
response shape can't back. Looks deferred — verify against the roadmap
(Epic 7 names Sheet-level parent editing; nothing names cascade
disclosure).

**Fix when picked up:** either `loadBoard()` after any write whose request
carried `parentId` / `isAttached` (cheap, matches the error path), or
widen the disclosure to `{ id, workphaseId?, projectId?, position? }` for
cascaded rows and let `applyItemWriteResponse` apply whichever keys are
present.

### 10. Depth-cap ownership after Story 2: constant has one owner, formula has two — by decision `[Duplication & Abstraction]` (status of Story 1 #21)
**Files:** `server/src/lib/itemTree.ts:57`, `:91–97` (formula inline in `assertWithinDepthCap`); `server/src/routes/boards.ts:150`; `client/src/components/workflow/dragClassification.ts:33–35` (`isWithinDepthCap`); `useBoardDnd.ts:76`

Explicit about which parallelism is which: **constant — resolved** (one
definition, API-fed, pinned by `boards.test.ts:97`, E2E reads it off the
board; no `shared/` build exists between `client/` and `server/` and none
was needed for one number). **Traversals — acceptable parallelism** (DB
substrate vs in-memory; counting convention pinned on both sides).
**Formula — two owners, accepted by Story 2 decision 1**; the client names
it, the server leaves it as inline arithmetic, so a future rule change is
found by grepping for `+ 1 +`. **Reason vocabulary — not a duplicate**
(server 400 strings vs a UI enum with `valid`/`inert`; different reasons
to change).

**Fix (small):** name the server copy —
`export function isWithinDepthCap(targetDepth, subtreeHeight, cap = ITEM_DEPTH_CAP)`
in `itemTree.ts`, used by `assertWithinDepthCap` — so the two copies are
name-identical and greppable, with a "mirror of …" cross-reference on
each. Revisit a `shared/` module only if a second client/server rule
appears (#11 would be the trigger).

### 11. "Legal parent" now has two client encodings — the Sheet's dropdown lacks the depth half `[Duplication & Abstraction]`
**Files:** `client/src/components/item-detail/ParentSection.tsx:15–21`, `:58` (via `buildParentOptions` → `getDescendantIds`); `client/src/lib/hierarchy.ts:110–118`; `client/src/components/workflow/dragClassification.ts:57–71`

Before this story the client had one "who may be my parent" rule
(`buildParentOptions`: exclude self + descendants). `classifyDragTargets`
now encodes a superset (cycle + depth cap), while the Sheet's `<select>`
still offers depth-capped parents and relies on the server 400 surfacing
as `parentError`. Not a correctness bug — the API enforces — but the rule
is owned twice and only one copy is complete. Epic 7 covers the detail
panel's parent editing; it doesn't name the depth cap for the dropdown.
Looks deferred — verify against the roadmap.

**Fix when picked up:** factor the Card-drag core (cycle → depth → valid,
minus the Stub interim and `freeDescendantIds`) into `lib/hierarchy.ts` as
`illegalParentIds(id, nodes, cap): Set<string>`; give `buildParentOptions`
an `exclude?: Set<string>` so `ParentSection` passes the same set (`cap`
is on `board.itemDepthCap` wherever the Sheet opens from a board).

### 12. `isStub` predicate — five inline sites, one private name `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragClassification.ts:37–39` (named, private); `useItemManagement.ts:61`, `:112`, `:122`; `client/src/components/UnsortedBucket.tsx:34`

`positionScope === 'attached-siblings'` is the settled definition of
"Stub" and this commit named it — privately — while four older sites still
spell it out (`UnsortedBucket:33–35` and `selectBoardItems:57–62` are also
the same "not a Stub AND matches filterProjectId" filter). One definition
to change if Story 1 #12 flips `classifyPositionScope` or Epic 4's `kind`
adds a second nested representation.

**Fix:** `export function isStub(item: Pick<Item, 'positionScope'>)` in
`client/src/lib/` (or beside `Item` in `types.ts`), used at all five sites.

**Status (2026-09-13, Story 3 landed in `e77e31f`):** resolved as proposed
— `client/src/lib/isStub.ts`; no inline `positionScope === 'attached-siblings'`
survives outside `types.ts` and the test fixture's derivation.

### 13. Card and Stub drop-target chrome is the same six-line block in two components `[File Responsibility + Duplication & Abstraction]`
**File:** `client/src/components/KanbanCard.tsx:77–79`, `:107–110`, `:113–114` (Card) vs `:208–211`, `:218–220`, `:223–224` (`AttachedChildRow`)

Both call `useLiveDropSide(item.id, type)` and `useDropTargetState(id)`,
render `data-item-id` + `data-drop-state`, splice
`${isDragging ? 'opacity-30' : ''} ${dropTargetClass(dropTarget)}` into
`className`, and render the verbatim `DROP_INDICATOR_BEFORE` / `AFTER`
pair. The class strings are correctly single-owner constants (`OVERLAY_*`,
one `dropTargetClass`) — Tailwind §2 is satisfied and no 5+-class string
was duplicated. What's duplicated is the *structure*, and it grew by three
lines in each place; it's part of why the file is now 260 lines. Story 3
(pending marker, drop bands) and Story 8 (overlay restyle) will each add to
both again. Deliberate per the story doc ("same attribute and overlay as a
Card, so a test reads them alike") — the intent is right, the mechanism is
copy-paste.

**Fix when Story 3 adds the next per-target attribute:** a
`useDropTargetProps(itemId, activeType, { isOverlay })` hook returning
`{ dropSide, dataAttrs, className }` plus a three-line
`<DropSideIndicator side={dropSide} />`; both stay in `KanbanCard.tsx`
(sole consumer). Test-visible output (`data-drop-state`, `data-item-id` on
the same elements) unchanged.

**Status (2026-09-13, Story 3 landed in `e77e31f`):** resolved as proposed
— `useDropTargetProps` + `DropSideIndicator` in `KanbanCard.tsx`, used by
both `KanbanCard` and `AttachedChildRow`. Story 3's new per-target
attribute (`data-pending`) landed once, inside the hook — the fix held
under exactly the load this finding predicted.

### 14. `useBoardDnd`: twin drag-session states set in lockstep, and two channels for "an item drag is live" `[File Responsibility + Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:40`, `:45` (states), `:73,76` / `:92–93` / `:122–123` (set/cleared together), `:88–90` vs `:113–115` (restore is the mirror of preview); `client/src/components/BoardView.tsx:253` (context) vs `:266` (`isCardBeingDragged={activeItem !== null}` drilled through `BoardColumn.tsx:26,143,233` → `WorkphaseCardList.tsx:29,52`)

Story 2 added `classification` state, its computation in `handleDragStart`,
`handleDragCancel`, and clearing in `handleDragEnd` — thin wiring that
delegates the real logic, so the hook (178 lines, +47) doesn't yet own a
second *concept*. But `activeItem` and `classification` are set at one
site and cleared at two, always together; `DragClassification.activeId`
re-states `activeItem.id`; and the new context exists precisely to avoid
drilling a per-drag value, while the pre-existing `isCardBeingDragged`
prop is that same datum still drilled through three components. This is
the second story in a row to add a state atom + handler pair here; Story
3's pending-marker/ordinal-preview state would be the third.

**Fix when Story 3 reworks the drop highlights:** collapse into one
`dragSession: { activeItem; classification } | null`; fold
`isCardBeingDragged` into the context (or `useDndContext().active`); give
the over/cancel pair a local `withWorkphase(items, id, workphaseId)`.

**Status (2026-09-13, Story 3 landed in `e77e31f`):** resolved — one
`DragSession { activeItem, classification, pop }` atom in
`DragSessionContext.ts`; `useIsCardBeingDragged()` replaced the
BoardView → BoardColumn drill; the over/cancel mirror is gone with the
re-bucket itself (nothing in `items` mutates during a drag). Residual —
`WorkphaseCardList` still receives the flag as a prop two hops inside
`BoardColumn`, and `DragClassification.activeId` still re-states
`activeItem.id` — carried as Story 3 audit #24.

### 15. `useItemManagement.ts` bundles pure list ops with the hook, and `boardDndUtils.ts` (self-described "pure") now imports from the hook file `[File Responsibility]`
**Files:** `client/src/components/workflow/useItemManagement.ts:1–187` (pure functions `:15–127`, hook `:129–187`); `boardDndUtils.ts:4` (imports `applyItemWriteResponse`), `useBoardDnd.ts:15`

The file already mixed pure `Item[]` operations (`selectBoardItems`,
`getWorkphaseItemsFrom`, `computeChildCounts`, …) with the hook that
closes over state and delegates to them; Story 2 added a third concept,
the reindex-disclosure reducer (`applyItemWriteResponse` + `upsertItem`).
`boardDndUtils.ts` — whose header says "pure, no React/dnd-kit runtime" —
now has its one non-type import coming from a file named and structured as
a hook. Functionally fine; the layering reads wrong.

**Proposed split:** move `:15–127` into a pure
`workflow/itemListOps.ts`; `useItemManagement.ts` keeps only the hook;
`boardDndUtils` / `useBoardDnd` import the reducer from the pure module —
matching the `dragClassification.ts` / `DragClassificationContext.ts`
split this story established.

**Status (2026-09-13, Story 3 landed in `e77e31f`):** resolved — pure
selectors, placement layer, and write reconciliation live in
`workflow/itemListOps.ts`; `useItemManagement.ts` is hook-only. Residual:
the `ItemWriteTracker` interface stayed in the hook file, so
`boardDndUtils.ts` still has a (type-only) import from a hook-named
module — carried as Story 3 audit #4.

### 16. Test scaffolding: duplicated tree fixture, and the E2E spec's local helpers start a second helper set `[Duplication & Abstraction]`
**Files:** `client/src/lib/hierarchy.test.ts:20` vs `:53` (identical six-node fixture, second copy new); `tests/ui/drag-target-classification.spec.ts:22–26` (`createItem`), `:40–41` (two-step board fetch), `:60–63` (depth-chain loop), `:70–72` / `:123–125` (open-board three-liner); natural home `tests/helpers/seed.ts`

The `[node('root'), node('a','root'), …]` fixture is module-local in two
`describe`s — hoist to one `TREE`. The spec's `createItem(request, data)`
is the first E2E-side create helper that asserts `res.ok()` (the guard
Story 1 #6 found load-bearing) while the bare
`(await request.post(…/items)).json()` shape appears ~30× across
`attached-children.spec.ts`, `boards*.spec.ts`, and
`helpers/itemRepositioningScenario.ts`. `:60–63` is the first E2E copy of
the depth-chain loop Story 1 #6 consolidated server-side. The two-step
`boards?workflowId=` → `boards/:id` fetch appears ~15× and the
open-board three-liner ~45× across `tests/`.

**Fix:** in `tests/helpers/seed.ts` add `seedItem(request, data)` (asserts
ok) and `seedItemChain(request, { projectId, workphaseId, length })`; add
`fetchDefaultBoard(request, workflowId)`; add
`ProjectSidebarPage.openBoard(name)`. Migrate opportunistically; the next
Epic 3.5 spec uses them from day one.

**Status (2026-09-13, Story 3 landed in `e77e31f`):** open, made worse —
none of the four helpers were added and `tests/ui/drag-column-bands.spec.ts`
carries a fresh copy of each plus three spec-local geometry recipes.
Escalated to Story 3 audit #7 (Fix Now).

---

## Covered by Future Epics

### 17. Stub-drag target rule is encoded twice — collision detection and classification `[Duplication & Abstraction]` — **Covered by Epic 3.5 (Story 5)**
**Files:** `client/src/components/workflow/boardDndUtils.ts:27–38` (`boardCollisionDetection`: an `attached-child` drag collides only with `attached-child` containers sharing `parentId`); `dragClassification.ts:51–54`, `:65–69` (Stub drag: same-parent Stub → `valid`, else `inert`)

Same rule, two substrates, no link between them — classification says
`inert`, the collision filter independently refuses. Deliberate: Story 2
decision 3 keeps `boardCollisionDetection` unchanged and names the map as
"the per-drag truth Stories 3/4/6 consult"; the Epic 3.5 roadmap's Story 5
entry is "unblocks the drag-out path currently held closed in
`useBoardDnd`" — spot-checked. Flagged so that when Story 5 opens the
detach direction the *collision filter consults the classification*
(the hook can hold the map in a ref the `CollisionDetection` closure
reads) rather than a third re-encoding landing in `boardDndUtils`.

---

## Informational

### 18. A board payload without `itemDepthCap` fails closed `[Correctness & Security]`
`targetDepth + 1 + h <= undefined` is `false`, so every non-descendant
becomes `depth-capped` and nothing is wrongly `valid`. Not a real scenario
(client and server ship together; the field is typed required). Safe
direction; no action.

### 19. `valid` Stubs are excluded from collision during a Card drag — consistent with decision 3 `[Correctness & Security]`
`boardCollisionDetection` still filters `attached-child` containers out of
Card drags, so no client-`valid` / server-400 pair is reachable from the
gesture today. Noted so Stories 4/6 know the map is ahead of the collision
filter.

### 20. Test-plan "Automated: ⏳ pending triage" rows for DRAG-2 / ATT-4.8 weren't flipped `[Consistency & Drift]`
By design — the Test Reconciler's pass flips status, not story
implementation. Every DRAG-2.n / ATT-4.n / TC-5a.n id cited in code
resolves to a real test-plan case whose content matches the citing comment.

### 21. Sidebar drag-time descendant dimming and board classification are accidentally similar — do not unify `[Duplication & Abstraction]`
`ProjectSidebar` already does "compute `getDescendantIds(active)` at drag
start, dim self/descendants". The shared math is already shared via
`lib/hierarchy.ts`; everything else differs in every reason to change
(no cap, no attachment, disable vs highlight, Story 8 retunes only the
board). Recorded so nobody proposes a generic `useDragClassification`.

### 22. File boundaries that hold up `[File Responsibility]`
`DragClassificationContext.ts` as its own 25-line file is the right seam
(mirrors the `boardDndUtils` / `useBoardDnd` pure/React split; zero
classification logic in it, zero React in `dragClassification.ts`).
`ItemDetailPanel.tsx` (386) gained only two prop types; `BoardView.tsx`
(321) only the provider wrapper and `handleDragCancel` pass-through, with
`classification` correctly colocated in the hook. The four-way split
`hierarchy.ts` / `dragClassification.ts` / `boardDndUtils.ts` /
`useBoardDnd.ts` is legible: no cap policy leaked into `hierarchy.ts`, no
presentation mapping into `dragClassification.ts` (overlay constants live
in `KanbanCard.tsx`), and `resolveDropTarget` (what a specific `over.id`
resolves to, continuous) vs `classifyDragTargets` (what every item *is*
to the carried one, once) don't overlap.

### 23. Positive confirmations `[all passes]`

- **Depth math.** `getDepth` = ancestors + 1; `getSubtreeHeight` = BFS
  generation count; `isWithinDepthCap` = `D + 1 + h <= cap`. All agree
  with the server on well-formed data, including the `T_ok` / `T_over`
  boundary and detached-branch height. Client tests parameterize on `cap`
  (4/6/8); the E2E spec reads `board.itemDepthCap`, never a literal.
- **Cycle guards.** `getAncestors`, `getDescendantIds`, `getSubtreeHeight`
  seed `visited` with the subject and skip-before-queue, same as the
  server; both sides return identical depth/height for an A↔B cycle.
- **Completeness of the client list.** `getBoardScopeItems` returns every
  item in the workflow's project set; `boards.ts` places each in a column
  sub-row, an uncovered sub-row, or `invalidItems`, and `BoardView` unions
  all three — ancestor chains and subtrees are whole.
- **Cycle-forming precedence, Stub rules, free-descendant set** match the
  spec and `assertValidReparent`.
- **Per-drag freeze.** Classification computed once in `handleDragStart`
  from the latest render's `items`, never re-derived from `over`; cleared
  synchronously in both end and cancel; column drags leave it null; the
  DragOverlay copy gets no state. No hook-rule violations.
- **Reindex apply order.** Pairs first, written row last, unknown ids
  ignored, `reindexed` stripped from the upserted row, reference-stable on
  no-op; six behaviors tested. `applyItemWriteResponse` has one definition
  and five call sites; no bare `prev.map(… ? updated : …)` survives.
- **Failure paths.** Every `moveItem` / `updateItem` / `createItem` site
  catches, logs, and `loadBoard()`s (board) or surfaces `{ error }`
  (Sheet). A server 400 on the widened move input resyncs rather than
  leaving optimistic state.
- **Type sync.** `MoveItemInput` ↔ `HierarchyRequest`;
  `BoardWithDetails.itemDepthCap` ↔ the route; `ItemWriteResponse` ↔ every
  item-write response. `DropTargetState` spelled identically in seven
  places. No "work item" language.
- **Single-owner Tailwind.** `OVERLAY_*` / `DROP_INDICATOR_*` constants,
  one `dropTargetClass`; no 5+-class string duplicated.
- **`dragGesture.ts` remains the only pointer recipe** — `pickUp` /
  `hoverTo` / `release` / `cancel` added there, `dragTo` composed from
  them, no `page.mouse.*` elsewhere; all four consuming specs match its
  signature.
- **Wiki accuracy.** `board-drag-interaction` §4 and `item-positioning`
  §5/§5a precisely describe what shipped, including what's still Story 3's.
- **Server.** `boards.ts` change is a constant on an existing 404-guarded
  read; `ENABLE_TEST_ROUTES` still strict `=== 'true'`.

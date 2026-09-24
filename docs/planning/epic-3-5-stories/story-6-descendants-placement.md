# Story 6 — The Descendants layer: manual hierarchy placement

Implementation plan for Epic 3.5 Story 6. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: planned 2026-09-17; decisions ratified 2026-09-23; Phase A done
2026-09-23 (library + sidebar), Phase B done 2026-09-23 (flat `KanbanCard`
section), Phase C done 2026-09-23 (the carried copy becomes a Stub); the PO
hands-on gate on Phases B+C together has not happened yet; Phases D–E not
started.** Written
against the code as it
will stand after [Story 4.1](story-4-1-efficiency-refactor.md) and
[Story 5](story-5-stub-detach.md): the Descendants region exists as a
Stub's start state, a Stub drag runs inside the machine, and the release is
derived from a placement. This story makes the layer *enterable* from Card
layer, gives it its real within-action, and consolidates that within-action
with the project sidebar.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 6
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §1.1 (the Descendants row), §3 (Card → Descendants pop-in), §3.1 (the
  fourth clock), §3.2 (the tab-state exception), §6 (auto-drop vs. manual
  first child), **§7 (all of it)** · [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md)
  §4 (a reparent always resolves a fresh position), §5 (reparent first),
  §8 (the depth cap) · [`../../wiki/item-positioning/`](../../wiki/item-positioning/README.md)
  §7.1 (first/last as anchor forms)
- Cases: [`drag-4-attach-and-stub-placement.md`](../../test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md)
  TC-8, 9, 10, 11, 13, 18 · [`drag-1-contexts-and-popping.md`](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md)
  TC-21 · [`drag-5-detach-and-overflow.md`](../../test-plans/board-drag-interaction/drag-5-detach-and-overflow.md)
  TC-9 (the tab-right and over-cap bullets) · cap consequences:
  [`att-4-legal-parent-depth-cap.md`](../../test-plans/item-attachment/att-4-legal-parent-depth-cap.md)
- Prior story: [`story-5-stub-detach.md`](story-5-stub-detach.md)
- Depends on: Stories 1–5, 4.1. **Unblocks:** Story 7 (overflow — which
  needs a real hierarchy surface to decide against), Story 8 (the invalid
  cue's look).

**Verified by:** **unit tables on the shared placement library** carry the
weight — every §7.1 clause is a pure function over a fixture tree (the
worked example, the one-state gap, no-Top / no-Bottom, clamping, per-state
validity, subtree removal, a collapsed Top), and the sidebar's existing
`projectTreeUtils.test.ts` cases are re-expressed against the same
functions; **manual** for reachability (`card:<P>` → `descendants:<P>` by
a hold, back by a pop-out), the tab feel, `DESC_POP_IN`, the carried Stub
(Phase C), and the sidebar's changed behaviors. **E2E is deferred to Story
10** (decided 2026-09-23):
every E2E case this story touches is a precise-move one, which the roadmap
holds until tuning is done — the list and the `tabBy` helper are recorded
there (roadmap § Story 10).

---

## Goal

1. **Zoom in Card → Descendants** by resting over the Card's descendants
   section for `descendantsPopInDelayMs` (duration-only) — for a Free Card
   or a Stub from another Card. Pop-out returns to Card layer (shared
   clock). A childless Card has no section, so no layer (§1.1).
2. **The within-action is §7.1's gap + depth rule**, with §7.2's per-state
   validity, resolving to `{ parentId, anchor + side }` — one relation the
   same `toRequest` already sends.
3. **One shared placement library** for the board and the project sidebar.
   Where the sidebar does anything differently it is brought to the rule
   (roadmap: "if the sidebar is found doing anything differently, it is
   brought to the same rule here").
4. **A Card's descendants render as one flat, indented DFS list** — one
   sortable list per Card — so a cross-level tab state is one gesture, not
   a drag between nested lists.
5. **The carried copy is a Stub from the Card layer down** (Phase C, added
   2026-09-23; reopens Story 5 decision 6), so it looks like the rows it
   will be placed among and doesn't cover them.

---

## What's already settled (don't re-decide these)

- **The rule**, in full, in §7.1: `range = [Bottom's depth … Top's depth
  + 1]`; Top + 1 → Top's first child; Top's depth → sibling after Top (its
  whole subtree, in render order); each shallower level → sibling after
  Top's ancestor at that depth; nothing shallower than Bottom; the
  shallowest is the same placement as "before Bottom"; boundaries and
  clamping as listed; the root floor is the Card.
- **§7.2:** the dragged subtree travels and is never a Top/Bottom
  candidate (cycles unreachable, no cue); the cap is checked **per tab
  state** at absolute depth against the deepest descendant, with the
  same predicate as every parent-giving write (`isWithinDepthCap`); an
  over-cap state is reachable, marked, and a no-op on release — the one
  ruled exception to §3.2.
- **Auto-drop (last) and manual first-child are two gestures** (roadmap
  decisions of 2026-09-17); nothing here changes Card layer.
- **Server:** Story 1's move takes `{ parentId, isAttached: true, anchorId,
  side }` and enforces the same cap; a reparent always resolves a fresh
  position in the new scope (item-attachment §4). No server work.
- **The sidebar's `computeProjection` is this rule in different clothes** —
  `maxDepth = prev.depth + 1`, `minDepth = next.depth`, walk back for the
  parent, `findPrevSibling`/`findNextSibling` for the relation. The
  consolidation target, not a competitor.

---

## Where the sidebar differs today (found while planning)

Read from `ProjectSidebar.tsx` / `sidebar/projectTreeUtils.ts`, not run —
each is a **verify** before it's a change:

1. **n gaps, not n + 1.** The gap is always "above the `over` row"
   (`prev = sortableItems[overIndex − 1]`, `next = sortableItems[overIndex]`,
   `closestCenter`), so "after the last item at its own depth" appears
   unreachable — you can only go *before* the last row or become its
   child. §7.1's "Below the last item (no Bottom)" boundary requires the
   extra gap.
2. **Descendant-blocking instead of subtree removal.** The active item is
   removed from `sortableItems` but its descendants stay (rendered dimmed,
   `pointer-events-none`); `over` on one nulls the projection. §7.2 removes
   the whole subtree from the candidates, so the gap next to a descendant
   resolves against the nearest non-descendant instead of going dead.
3. **Depth reference is `activeItem.depth + round(delta.x / INDENT_WIDTH)`**
   — the item's starting depth plus horizontal travel. §7.1 says only
   "horizontal offset picks a depth." Kept (decision 3 below), since it's
   the tuned feel and it generalizes.
4. **Preview is an indicator line** at `overIndex` with `indicatorDepth`,
   not a ghost row. Kept for the sidebar (decision 4); the board draws a
   row.
5. **No validity predicate** (projects have no depth cap). The library
   takes one; the sidebar passes "always valid."
6. **A collapsed Top gets the new child last, not first.** *(Found
   2026-09-23; confirmed by reading, not run.)* `flattenTree` omits a
   collapsed project's children, so at Top's depth + 1 `findPrevSibling`
   and `findNextSibling` both find nothing, the sidebar sends no anchor, and
   the server appends (`projects.ts` move route, "both omitted/null").
   §7.1 says Top's **first** child. The library resolves it from the full
   tree (Phase A), and the sidebar sends `nextId` = the hidden first child —
   which the server already accepts, since it verifies a claimed sibling
   against the database, not against what the sidebar shows. The board
   never hits this today (Stub rows don't collapse), but Story 7's overflow
   may hide descendants there too.

---

## Decisions proposed while planning (2026-09-17) — to ratify

1. **Flat DFS rendering of a Card's descendants section.** The recursive
   nested `SortableContext`s (`AttachedChildRow` rendering its own
   children) become one `SortableContext` over `hierarchyRows(cardId)`,
   each row carrying `depth` and indenting by `depth × INDENT` — the
   sidebar's shape. Visible change: the nested `border-l` guides become
   per-row indentation. *(Alternative: keep DOM nesting and flatten only
   the sortable model — rejected; nested DOM fights a flat vertical
   strategy and the Descendants region needs one box.)* **Show the PO
   before the machine phase (Phase D since 2026-09-23's renumbering).**
2. **Gap = `over` row + side** (n + 1 gaps), side from `resolveDropSide`
   as at Column layer. The sidebar adopts it too (fixes difference 1).
3. **Depth = seed + horizontal delta**, clamped to the gap's range:
   `depth = seedDepth + round((pointerX − seedX) / INDENT)`. Seed: a
   Stub's own depth and pickup x (sidebar-identical); for an item entering
   from Card layer, the zoom-in instant — `seedX` = the pointer then,
   `seedDepth` = the entered gap's Top depth (aligned), so one tab right is
   "Top's first child" and one left walks the ancestors. *(Alternative:
   absolute pointer x against the section's indent origin. Rejected for
   feel parity with the sidebar; revisit only if hands-on says so.)*
4. **The board's ghost is the displaced active row, indented to the
   projected depth**, with the invalid cue when over cap; the sidebar keeps
   its indicator line. Both read the same projection. The projection
   (`{ gap, depth, valid }`) is **render state on the session**, not a
   placement field: mid-drag the placement stays whatever put the row in
   the list (`'existing'` for a Stub of this Card, `'last'` for an item
   that zoomed in), sortable displaces it vertically, the projection
   indents it; at release the placement is *resolved* from the projection
   (4.1 Phase 3's model — the release derives from a placement, the
   placement here derives from the projection).
5. **Subtree removal, both surfaces.** On the board the dragged item's
   children are already unrendered for the drag (§5a). In the sidebar the
   descendants stay drawn dimmed but leave `sortableItems` and the
   Top/Bottom candidates (fixes difference 2).
6. **The fourth clock is `descendantsPopInDelayMs`**, default equal to
   `cardPopInDelayMs` (800 ms), its own panel row — §3.1 already reserves
   the name and allows a shared value.
7. **Provisional invalid cue:** dashed red outline on the ghost row plus
   `data-placement-valid="false"`; Story 8 restyles. The board root
   exposes `data-drag-projection="<gap>:<depth>:<valid>"` for E2E.
8. **The library lives in `client/src/lib/hierarchyPlacement.ts`**, next
   to `lib/hierarchy.ts` (the one shared tree-math layer — its
   `getDepth`/`getDescendantIds`/`getSubtreeHeight` are the inputs), and
   is table-generic like the server's `positionResolver`: it never imports
   `Item` or `Project`, only `{ id, parentId, depth }` rows and a
   `childrenOf` callback.

**Ratified by the Product Owner, 2026-09-23 — all eight, as written.** One
note:

- **On 1 — ratified with a gate.** The structure is settled: one flat
  `SortableContext` per Card, each row carrying `depth`, one region box.
  What the PO hasn't seen is the *look*, so the look is gated instead of
  decided now: **a PO hands-on comes before the machine phase starts, and
  that phase waits for the PO's sign-off.** The gate first sat at the end
  of Phase B. On 2026-09-23 the Phase B hands-on added a new Phase C, and
  the gate moved to the end of Phase C; the machine phase is now Phase D
  (see the gate at the end of Phase C). If the
  hands-on asks for today's nested guide lines back, a flat row at depth
  *d* can draw its own guides (per-row indent guides). That's a styling
  change inside Phase B, not a reason to reopen the structure or the
  rejected alternative.

The separate question below (detached descendants: absent or greyed) is
not one of the eight. The PO decided it the same day: **absent**.

### Detached descendants in the section: absent, or greyed? — decided: absent

**Decided by the Product Owner, 2026-09-23: absent.** A Card's descendants
section on the board shows attached descendants only, as it does today.
Attachment is the board's way of saying which sub-items move with their
parent, and the section shows exactly those. Showing every related item
regardless of attachment is a job for the Sheet's descendants display, not
this story. The analysis below is kept as the record of the question.

*(Added 2026-09-21 from the Story 4 audit discussion. A Product Owner call
about what the user expects, not a technical constraint — but the option
space has one hard edge, recorded so it isn't rediscovered.)*

A Card's section today shows **attached** descendants only
(`getAttachedChildrenFrom` filters on `renderedIsStub`); a *detached*
descendant is a Free Card elsewhere on the board, gets the green "these are
yours" overlay while its ancestor is dragged (§4), and is listed and managed
in the Sheet's ChildrenSection. So "absent" is the current state and has a
home. The question is whether the section should *also* list detached
descendants, dimmed, so the hierarchy reads complete from the Card.

If "greyed" wins, two constraints follow from the data, not from taste:

- **A greyed row can never be Top or Bottom.** Its position is
  workflow-scope, not attached-siblings scope, so the server rejects an
  anchor on it ("anchor outside the resulting scope", 400). §7.1's Top and
  Bottom — "the item it will sit directly under / above" — would have to
  skip over greyed rows, and `flattenHierarchy` would carry them as
  non-candidates. The library's `Row` gains a flag, or the rows are
  filtered before the gap is computed.
- **It doesn't count toward the badge** (`computeChildCounts` counts
  attached only) and it isn't a drag source from the section — its drag
  starts in its own column, as a Card.

Neither option changes anything Story 5 builds; the interim sibling-scoped
within-action and the Descendants region are identical under both.

### Story 5 decision 6 reopened: the carried copy is a Stub from the Card layer down — decided 2026-09-23

**Decided by the Product Owner, 2026-09-23, from the Phase B hands-on.**
Story 5 decision 6 (ratified 2026-09-21) kept the carried copy (the
`DragOverlay`) a shortCard at every layer and made only the in-list ghost a
Stub. The alternative that decision listed and rejected — "the overlay
renders as a Stub row while at Card or Descendants layer" — is now the
rule.

The reason: a shortCard held inside a Card's box covers most of the
descendants section, so you can't see where the item will land. Phase D
makes that section the place you pick a depth, which needs the rows in
view. From the Card layer down, the carried copy looks like the Stubs it
will be placed among. At Board and Column layers it stays the shortCard.

Built in Phase C. Wiki §5a and §7 still state the old rule. Updating them
is the PO's; Phase E's report lists them.

---

## Build order

### Phase A — The shared library, and the sidebar onto it

`client/src/lib/hierarchyPlacement.ts` — pure, no React, no dnd-kit:

```ts
interface Row { id: string; parentId: string | null; depth: number }   // depth 0 = the root's direct children

flattenHierarchy(rootId, childrenOf, exclude: ReadonlySet<string>): Row[]   // DFS; `exclude` = the dragged subtree
gapIndexFor(rows, overId, side): number                                     // 0..rows.length
depthRangeFor(rows, gap): { lo: number; hi: number }                         // [bottom?.depth ?? 0, (top?.depth ?? -1) + 1]
resolvePlacement(rows, gap, depth, rootId, childrenOf, exclude?): { parentId: string | null; anchor: { id: string; side: 'before' | 'after' } | null }
tabStates(rows, gap, rootId, childrenOf, exclude, isValid): { depth: number; placement: …; valid: boolean }[]   // every state in the gap, for rendering and tests
```

`resolvePlacement` is §7.1 verbatim: no Top → `{ root, bottom ? before
bottom : null }`; `depth === top.depth + 1` → `{ top, firstChild ? before
firstChild : null }`; otherwise the ancestor `A` of Top at `depth` (Top
itself at Top's depth) → `{ A.parentId ?? root, after A }` — which is also
"before Bottom" at the shallowest level, sent as one relation (TC-10).
`firstChild` is Top's first child in the **full** tree (`childrenOf`, minus
the excluded subtree), not the next row: a collapsed Top has no child among
the rows (sidebar difference 6), so `resolvePlacement` takes `childrenOf`
and `exclude` too. The
validity predicate is injected: on the board
`isWithinDepthCap(getDepth(parentId), subtreeHeight, cap)` — the same
predicate classification already uses, fed the *resolved* parent (§7.2);
in the sidebar `() => true`.

**Unit tables:** TC-8's tree and every gap in it; TC-9 and TC-10's
relations; TC-11's five boundaries; TC-18's per-state validity with a
subtree height; `flattenHierarchy` with the dragged subtree excluded;
`gapIndexFor` at both ends; Top + 1 on a Top whose children aren't in the
rows → before its first child. Then `projectTreeUtils.test.ts`'s cases
re-expressed — the ones that encode difference 1, 2 or 6 change and are
recorded as such.

**Sidebar:** `computeProjection` / `findPrevSibling` / `findNextSibling`
become adapters over the library — `onReorderProject(id, parentId, prevId,
nextId)` maps from the one relation (`after A` → `prev = A`; `before B` →
`next = B`; the other `null`, the server re-derives). `handleDragMove`
gains the side (`resolveDropSide(active.rect.current.translated,
over.rect)` — the event carries both) and passes `delta.x` as today.
`descendantIds` leave `sortableItems`.

**Phase A done 2026-09-23**, all three behavior changes hands-on verified
live (a real drag against a scratch DB, not just the unit tables):
difference 1 (drop after the last item at a depth, both mid-list and at
root depth 0), difference 2 (hovering a dimmed descendant of the dragged
project resolves to the block's own gap instead of nulling), difference 6
(dragging a project into a *collapsed* project as its first child lands
before that parent's existing children, not appended last). One
consequence of difference 1: the sidebar's row (`SortableProjectRow.tsx`)
gained an "after" indicator line alongside its existing "before" one, since
the new gap needs somewhere to draw it — the indicator-line *look* (colour,
weight) is unchanged, so this stays inside "the sidebar's indicator-line
look... stays" (Out of scope), not a look change.

### Phase B — The flat section in `KanbanCard`

- `itemListOps.ts::hierarchyRows(cardId, items, placements)` — built by
  recursing `getAttachedChildrenFrom` (each level already placement-aware,
  so an item previewing into the hierarchy is in the rows at its slot) into
  `Row[]` via `flattenHierarchy`.
- `KanbanCard.tsx`: one `SortableContext` over `hierarchyRows`;
  `AttachedChildRow` takes `depth` and indents; the recursion goes; the
  section wrapper (Story 5's `descendants:` region element) is now the one
  list. The ghost row (`AttachGhostRow`, or the row component with a
  `ghost` flag if Story 5's single drag type made the separate component
  unnecessary) takes `depth` too.
- Collision at a Descendants context: candidates = **all rows of the
  section** (any depth), replacing Story 5's interim same-parent policy —
  the only place the interim rule lived.

**Built 2026-09-23**, three deviations from the letter above, each reasoned
through and verified rather than assumed:

- **`hierarchyRows(cardId, getAttachedChildren)`**, not `(cardId, items,
  placements)`: `KanbanCard.tsx` already receives a bound
  `getAttachedChildren` closure, not raw `items`/`placements` — taking the
  closure gets the identical recursive result with zero prop-drilling
  change. Built on `flattenHierarchy`, `byId` filled as a side effect of
  the same calls it already makes, one pass.
- **`AttachGhostRow` stays its own, non-sortable component** (not merged
  behind a `ghost` flag). Decision 4's uniform `role` field only fixed the
  *stale-role-on-remount* hazard its own comment named; it never touched
  the deeper one — dnd-kit has no support for two simultaneous sortable
  registrations of the same id, and the ghost row's real registration is
  still wherever it's actually being dragged from. Verified by reasoning
  through what a second registration would do to dnd-kit's active-item
  tracking, not by trying it and seeing it break.
- **Collision widening needed a correctness fix beyond itself.** Replacing
  the parentId-equality filter with a rect-containment one (`isStubRow(data)`
  inside the section's own measured rect — `descendantsSectionRect`,
  mirroring the rect test the Card/Board branch already used) makes `over`
  resolvable to *any* row, not just true siblings — exactly the point. But
  `placementFor`'s Descendants branch (`popSession.ts`, untouched this
  phase, per the machine phase's own note below — Phase D since the
  2026-09-23 renumbering) turns *whatever* `over` is into
  `{parentId: origin's own, anchor: over}` unconditionally; a non-sibling
  `over` would have produced a request anchored outside its own resolvable
  scope — a 400 on release. Fixed at the one call site that builds `over`
  in the first place: `useBoardDnd.ts::handleDragEnd`'s `placementOver`
  now checks `over` against `list.rows` (origin's true siblings) before
  treating it as a real anchor, falling back to "no anchor" otherwise —
  `popSession.ts`/`placementFor` needed no change at all.

**Verified:** full gate green (tsc/eslint/prettier, vitest 266/266, full
Playwright suite unchanged at 140 passed/6 skipped/146); live, hands-on
against a scratch DB (P with attached A, B, and B's own child B1) —
flat indentation renders correctly (12px/level, no `border-l`, decision 1's
expected visible change); dragging A to reorder past B still commits
correctly (Story 5's own gesture, unregressed); releasing directly on B1
(a non-sibling — B1's real parent is B, not P) is a clean no-op, zero
console errors, confirming the guard above.

**Hands-on, 2026-09-23.** The PO's first look at Phase B asked for the
carried copy to become a Stub from the Card layer down. That's Phase C
below. The gate that used to end Phase B moved to the end of Phase C, so
the PO signs off on both together.

### Phase C — The carried copy becomes a Stub from the Card layer down

*(Added 2026-09-23 from the Phase B hands-on. Reopens Story 5 decision 6;
see "Story 5 decision 6 reopened" above. The old Phases C and D are now D
and E.)*

While the drag is locked at a Card layer or a Descendants layer, the
carried copy (the `DragOverlay`) renders as a Stub row, like the rows it
will be placed among. At Board and Column layers it stays the shortCard
(§5a, unchanged). It switches at the zoom-in into a Card, and back at the
pop-out to a Column. A Stub's own drag starts at the Descendants layer, so
it's a Stub from pickup.

- **One Stub body.** `AttachedChildRow` and `AttachGhostRow` each draw the
  same type pill and one-line title today, and the overlay would be a third
  copy. Extract the presentational body once and use it in all three, so
  the carried Stub can't drift from the rows. The overlay keeps a "carried"
  treatment (a shadow) so it reads as held, not as a row; the exact look is
  the hands-on's call.
- **Which form** is a pure function of the session's pop state: locked at
  a `card` or `descendants` context → Stub, otherwise shortCard. Put it
  beside `placementRegion` in `popSession.ts` and unit-test it per layer and
  across a pop-in and a pop-out. `BoardView.tsx`'s `DragOverlay` reads it.
  The overlay element carries `data-drag-overlay-form` (`stub` or
  `short-card`) for Story 10's E2E.
- **Width:** as wide as a row in the context Card's section (read off the
  measured context region), not the shortCard's width. Depth isn't the
  overlay's job; the in-list ghost shows it (Phase D).
- **Keep it under the cursor.** dnd-kit draws the overlay at its pickup
  rect's top-left plus the drag delta. A copy that shrinks at the zoom-in
  can end up beside the pointer: a Card grabbed near its bottom edge leaves
  the pointer well below a one-line Stub. Re-anchor at the switch, in both
  directions, so the pointer stays on the copy (for example, keep the
  pointer's horizontal fraction and center the Stub on it vertically). Do it
  in the modifier (`clampToContext`), so the collision rect moves with it.
- **What the size change touches.** The modifier also runs at `DndContext`
  level (Story 4.1 F8), so the carried copy's measured rect is the collision
  rect, `resolveDropSide`'s input (`active.rect.current.translated`), and
  what `clampToCurrentContext` bounds. A Stub-sized rect should suit the
  Descendants layer better, since its center sits on one row. Verify:
  1. dnd-kit re-measures the overlay when its content changes shape. A
     stale frame would clamp and collide at the old size.
  2. The switch and the pop snap tween (`popSnapMs`) combine without a
     jump.
  3. Nothing that sizes the bands reads the overlay. Bands reserve the
     in-list ghost's height (decision 6's "one reservation" concern), and
     the overlay stays a shortCard wherever there are bands.
- **Comments.** The comments that say both drag copies are shortCard
  (`KanbanCard.tsx`'s header, `cardMetrics.ts`) change with the code. Code
  comments that name "Story 6 Phase C" for the gap + depth within-action
  (`popSession.ts`, `useBoardDnd.ts`, `KanbanCard.tsx`) now mean Phase D.

**Verified by:** the unit table on the form function; the full gate green;
and a hands-on covering a Free Card zoomed into a Card that has Stubs (the
Card layer, Story 4's Column → Card zoom-in, reachable today), a Stub's own
drag (the Descendants layer, where a Stub's drag starts), a pop-out back to
a column (shortCard again), and a Card grabbed near its bottom edge (the
Stub stays under the cursor). Entering the Descendants layer from the Card
layer is Phase D's; the form function already covers it (a `descendants`
context → Stub), so Phase D adds nothing here.

**Built 2026-09-23**, one deviation from the letter above, found through a
live drag rather than assumed, plus the width/re-anchor bullets built as
written but against a different measurement than either named:

- **One Stub body, but no separate `OverlayStub` component.** The first cut
  built one (`BoardView.tsx` choosing between it and `<KanbanCard
  isOverlay>` by `overlayForm`), matching "which form" read as "which
  component." A live drag showed the carried copy stuck at its *pickup*
  size after the very first form switch, permanently — traced to
  `@dnd-kit/core`'s own `DragOverlay`: it measures its rendered child's
  size once, via a `ResizeObserver` attached at the overlay's first mount,
  and never re-attaches it if a *different component type* takes that
  child's place — the observer is left watching a DOM node that's already
  been removed. Swapping `<KanbanCard>` for `<OverlayStub>` is exactly that
  swap. Fixed by folding the Stub body into `KanbanCard` itself
  (`overlayIsStub`, a new branch alongside the existing shortCard/full-card
  ones) — one component, one DOM node, at every layer; `BoardView.tsx` now
  always renders `<KanbanCard isOverlay overlayForm overlayWidthPx>` and
  never swaps types. `StubBody` (the pill + title fragment) is still
  extracted and shared by `AttachedChildRow`, `AttachGhostRow`, and this
  same branch.
- **The re-anchor modifier targets `overlayWidthFor`'s own number and a
  fixed `STUB_ROW_HEIGHT_PX`, not `draggingNodeRect`.** The same orphaned-
  measurement finding above means dnd-kit's own live size for the overlay
  can't be trusted as "how big is the Stub right now" — it can still be
  reporting the pickup form's size. The render side already computes the
  Stub's true width independently (`overlayWidthFor`, off the region's own
  rect); reusing it for the re-anchor's target sidesteps the measurement
  issue rather than working around it.
- **Compensates one direction only — into Stub form, never back out of
  it.** Shrinking (shortCard/Stub-elsewhere → Stub) is the case the plan
  names: the old pickup offset can land outside the new, smaller box.
  Growing back never can — the same offset, kept, still falls inside a
  *bigger* box than the one it was measured against, so the natural,
  uncompensated transform already keeps the pointer on the copy. This also
  keeps every other drag (nothing ever reaches Stub form) byte-identical to
  before this phase.
- **The re-anchor computes an absolute x/y from the tracked pointer, not an
  offset added to the incoming `transform`.** F8's own comment already
  notes this modifier array runs twice per frame, chained (once inside
  `DndContext`'s own transform tracking, again inside `DragOverlay`'s
  render) — safe for `clampAxis` (clamping an in-range value is a no-op)
  but not for an *additive* compensation, which would double itself on the
  second call. Reading `pointerRef.current` (already tracked independently
  of dnd-kit's own modifier pipeline) instead of deriving "where's the
  pointer" from the transform sidesteps the whole problem: both chained
  calls compute the identical absolute answer.

**Verified:** full gate green (tsc/eslint/prettier clean; vitest 272/272 —
the 266 from Phase B plus 6 new `overlayFormFor` cases, per layer and
across a real pop-in/pop-out; full Playwright suite unchanged at 140
passed/6 skipped/146); live, hands-on against a scratch DB — a Free Card
(Q) zoomed into a Card (P) that already has Stubs switches the overlay
shortCard → Stub exactly at the Column → Card pop-in
(`data-drag-overlay-form` flips, confirmed both by attribute and
screenshot); a Stub's own drag (A) starts as Stub from pickup, stays Stub
through the pop-out to Card layer (both Stub-form layers), and becomes
shortCard on the second pop-out to Column; a Card grabbed near its bottom
edge and dragged into a Card lands the Stub visually close to the cursor,
not floating off to one side the way the unfixed measurement did.

*One thing to watch, unrelated to this phase's own code:* holding the
pointer still for longer than a real hand ever manages (over a second, in
an automated script) can show a small, bounded offset from `perfect`
centering — `clampToCurrentContext` (Story 4.1 F8, untouched here) bounds
the re-anchored position against the locked region's *last-sampled* rect,
and that sample only refreshes on a pointermove or the pop timer, not on a
timer of its own. A live hand's natural jitter keeps it fresh in practice;
worth a note for whoever tunes Story 8's cue, not a Phase C regression.

**Gate — stop here. Don't start Phase D until the Product Owner has seen
Phases B and C and signed off** (decision 1's ratification condition; moved
here from the end of Phase B on 2026-09-23). When Phase C is green, hand
both over for a hands-on and wait for confirmation of:

- **The look** — per-row indentation where the nested `border-l` guides
  used to be, or per-row guides if the PO asks for them back (Phase B); the
  carried Stub (Phase C).
- **No regressions** — the Stub gestures Story 5 shipped (sibling reorder,
  detaching out to a column, attaching into a Card) still work in the flat
  list.
- **Known interim behavior, not a regression:** releasing a Stub on a row
  that isn't its direct sibling (a sibling's child, say) sends nothing.
  Story 5 would have reordered it among its siblings. Phase D's gap + depth
  rule replaces this.

Anything the hands-on asks for lands in Phase B or C before Phase D begins.

**Hands-on findings, 2026-09-23.** The PO's hands-on of Phases B and C
turned up two bugs in the Card zoom-in. Both are older than this story
(Stories 4–5 code) and neither was caught by E2E. Both are fixed here,
before Phase D.

1. **Fixed: no Card zoom-in after passing through Board layer.** A drag
   that entered a column from Board layer (a different column, or its own
   after popping out and back in) could never zoom into a Card there.
   - At Board layer, `DragCarveFrame` (`BandGuides.tsx`) puts its zones in
     front of a column's cards, which moves them to a different child slot,
     so React remounts every Card on the way in and out.
   - The pop machine re-resolves the region structure at a layer change,
     but synchronously, *before* that render. It kept the replaced
     elements, which measure as empty boxes, so their regions dropped out.
   - A Stub's drag never reaches Board layer, which is why DRAG-5.4 passed.
   - The fix: `useBoardDnd.ts::sampleRegions` re-resolves when
     `dragRegions.ts::hasDetachedElements` finds a cached element gone from
     the document.
   - Tests: a unit case in `dragRegions.test.ts`. New
     `tests/ui/drag-card-zoom-in.spec.ts` covers both routes; it failed
     before the fix and passes after.
   - Gate after the fix: typecheck, lint and prettier clean; vitest
     273/273; Playwright 142 passed, 6 skipped, 148 total.
2. **Open, next: the zoom-in hit box ignores a displaced card.**
   - `dragRegions.ts::layoutRect` subtracts dnd-kit's sortable transform
     from a Card's rect, so the hit box stays where the card sat before it
     moved to make room for the ghost, not where it's drawn.
   - E2E aims in the same pre-transform space (`dragGesture.ts::boxOf`),
     which is why no test caught it.

### Phase D — The machine and the within-action

- `dragRegions.ts`: `descendants:` regions register for **every Valid Card
  with ≥ 1 child** (Story 5 registered the origin's only); the candidate
  from a Card context is its own section via `parentRegionKey` —
  `childRegionAt` already finds it; `popInDelayFor('descendants') =
  descendantsPopInDelayMs`, no gate; `clampAxes` both (Story 5).
- `dragTuning.ts` + `DragTuningPanel.tsx`: `descendantsPopInDelayMs`
  (decision 6).
- **Forced expand**: `useIsAttachTarget` already forces a Card open while
  it's the locked context; the section must stay rendered through the
  Descendants layer too (`contextKey` starts with `descendants:` for this
  Card) — extend the predicate.
- **Projection** on the session (decision 4): set at the zoom-in
  transition (seed per decision 3) and on every sample while at
  Descendants layer, from dnd-kit's `over` + side (a ref written in
  `onDragMove`) and the pointer's x. Cleared on pop-out.
- `placementFor(…)` at Descendants layer, mid-drag: unchanged from
  whatever placed the row (Story 5's table) — the projection carries the
  visual. **At release:** `resolvePlacement(rows, projection.gap,
  projection.depth, P)` → `{ parentId, slot: anchor ?? 'first' }` with
  `valid` from the predicate → `toRequest` (an invalid state → `null`, the
  same path as identity: no request, marker restored — TC-18); a Stub of
  this Card released in its own slot → identity (TC-5 territory, already
  Story 5's).
- `data-drag-projection` on the board root (decision 7).
- `CLAUDE.md` (`client/src/components/workflow/`, and the root file's "one
  position math layer" guardrail if the library belongs in it): the flat
  section, the shared library, the fourth clock, the carried copy's form
  (Phase C) — with the code, not in Phase E.

### Phase E — Wiki report (the developer doesn't edit the wiki)

*(Reshaped 2026-09-23: the wiki is the Product Owner's to manage. E2E moved
to Story 10; skipped tests were always Story 10's.)*

This phase produces a **report**, not wiki edits. Deliver it with the
hand-off and copy it into "As built" below. Two lists:

1. **What can be marked built.** Each wiki passage that describes this
   story's work as future, with its section and file. Known at planning:
   §7's "Not yet built"; §1.1's Descendants row and §3's Card → Descendants
   sentence (their "Story 6" markers); §3.1's fourth clock (name and
   default); §3.2's over-cap exception; the header's build status; and
   anywhere the wiki describes the project sidebar's placement, which now
   runs on the same library. Search for others (`Story 6`, "not yet").
2. **Where the wiki and the code now disagree.** Any rule or behavior the
   wiki states that the built code doesn't do, or does differently: the
   section, what the wiki says, what the code does, and which side looks
   wrong. One is known: §5a and §7 say the carried copy stays a shortCard
   at every layer, and Phase C makes it a Stub from the Card layer down
   (Story 5 decision 6, reopened 2026-09-23; the code is right). Candidates
   to check (not presumed mismatches): the seed rule (decision 3) against
   §7.1's bare "horizontal offset picks a depth"; the collapsed-Top
   first-child resolution (sidebar difference 6); the loaded-items depth
   undercount (Risks); and anything else the Phase B/C hands-on changed.

Test-plan statuses (DRAG-4, DRAG-1.21) are Story 10's reconciler pass, not
this phase.

---

## Risks / things to watch

### From the Story 4 audit's #7/#8 fixes (2026-09-21) — read before Phase D

The region model was tightened after this plan was written; three things
it now assumes about a new kind:

- **`isCardList` is the one kind predicate, and `descendants` is not a
  card list.** Every former `kind !== 'card'` site in `useBoardDnd.ts` and
  `popSession.ts` now reads `isCardList(region)` — a flat list of Free
  items with bands and a workphase to write. A Descendants region is a
  *Stub* list: don't add it to the predicate. But the six sites don't all
  test the same property, and the audit's assumption that every one
  simply excludes the new kind is probably wrong for half of them:
  - **Card-list-only** (exclude Descendants, nothing to do): `hoverFor`'s
    band (`popSession.ts`), `placementFor`'s main body (the workphase
    placement — Descendants needs its own branch *before* it, and the
    narrowing will demand one: `attachToCardId` stops typechecking on the
    non-card-list branch), and the hook's `regionItems` (selects by
    workphase).
  - **"Has a sortable container" — a property Descendants shares**: the
    collision session's `hoverContainerId` and `context` (`useBoardDnd.ts`
    `collisionDetection`), `placementOver` at release, and the `others`
    list for identity. Descendants has a `containerId`, a meaningful
    `over` (the gap), and siblings to compare against. Decide per site:
    either a second predicate (`hasSortableList`, true for card lists and
    Descendants) or a Descendants branch. Not `isCardList`, and not a
    re-widened `isCardList`.
- **`measureRegions` spreads structural facts; it no longer lists fields
  per kind.** A structure entry is `{ dom: { element, scrollAncestor } } &
  Omit<Region, live facts>`. A `DescendantsRegion` interface + a
  `descendantsStructureFromKey` resolver in `resolveDragStructure`'s
  dispatch is the whole addition; the region then falls out of the spread
  — unless it needs a live count like `cardCount`, in which case that's
  the only extra line.
- **`placementRegion` is shared** (`popSession.ts`, called by
  `placementFor` and the hook's release). The projection's "which region"
  reads it too; don't derive the key a third way.
- **`CardList` is for Cards; the descendants section is not one.** Phase
  B's flat section is its own list (Stub rows, a depth per row), and it
  has no bands — so it does *not* go through `DragCarveFrame` (that
  component is the band/reservation chrome, and the place a card list
  gets its `[data-drag-region]`). The section registers
  `DRAG_REGION_ATTR` the way a Card does today (`KanbanCard.tsx` sets
  `card:<id>` on its own element), not the way a column does.
  `DROP_HIGHLIGHT_CLASS` (`CardList.tsx`) is reusable if the section wants
  the same "a row is over me" surface.

- **The flat re-render changes how Stubs look** (decision 1). It's the
  right shape for the rule, but the PO hasn't seen it — Phases B and C
  before Phase D, with a hands-on in between.
- **Depth of the resolved parent** comes from `lib/hierarchy::getDepth`
  over the *loaded* items. A Card whose ancestor lives in another
  workflow (cross-workflow reparent is accepted at the API) isn't loaded,
  so the client's absolute depth can undercount and offer a state the
  server rejects with a 400 — §3.2 drift, resynced by the existing failure
  path. Classification has the same exposure today; this story inherits
  it and should report it (Phase E), not fix it (Story 7 or a board-load
  change).
- **The ghost row's width changes as its indent changes** — hit-testing
  is by `over` (vertical), so this is cosmetic, but a wide indent at deep
  levels can truncate the title; §5a's one-line truncation covers it.
- **Sortable with the active row *in* the list (board) vs. removed
  (sidebar).** Both feed `gapIndexFor` the same `over` + side; the board's
  row is displaced by the strategy, the sidebar draws a line. The library
  doesn't know which — keep it that way.
- **`over` on the ghost row itself** (dnd-kit can report the active item
  as `over` while the pointer rests on it): keep the last projection, as
  the sidebar already does for the same case.
- **Coverage:** the library's unit tables are the gate that lets the E2E
  set stay small (reachability + one write per relation kind).

---

## Out of scope

§9 overflow (Story 7 decides whether a hierarchy deeper than the section
can show exists at all — this story assumes full context, §7.2); the
invalid cue's final look (Story 8); Story 9; keyboard placement; any change
to the sidebar beyond bringing it to the rule (its indicator-line look, its
collapse behavior, its own tree fetch all stay).

---

## As built

*(Empty until the story is done.)*

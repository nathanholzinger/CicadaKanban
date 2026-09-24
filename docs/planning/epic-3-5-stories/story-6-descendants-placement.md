# Story 6 — The Descendants layer: manual hierarchy placement

Implementation plan for Epic 3.5 Story 6. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: planned 2026-09-17; decisions ratified 2026-09-23; Phase A done
2026-09-23 (library + sidebar), Phase B done 2026-09-23 (flat `KanbanCard`
section), Phase C done 2026-09-23 (the carried copy becomes a Stub). The
PO's hands-on of B+C found three things (below the gate), all now built:
the Card zoom-in after Board layer, a column drop's anchor picked from the
ghost's slot (2026-09-24), and the zoom-in candidate itself — now the card
the blue line names, held through a dwell + cue (2026-09-24). One watch
item came out of the third: popping into a Card can visibly shift it,
carried to Story 8 (roadmap). Phase D — the machine and the within-action —
built 2026-09-24: `descendants:` regions now resolve for every Valid Card
with a section, `childRegionAt` zooms a locked Card into its own; the
Descendants layer's own live projection (gap + depth, §7.1) is tracked on
the session and resolved to a real placement at release
(`resolvePlacement`), with §7.2's depth-cap exception wired through to a
provisional invalid cue. The PO's Phase D hands-on (2026-09-24) found the
chosen depth invisible and the gap one off. Both were fixed the same day,
with a simple depth cue on the carried Stub (Phase D's hands-on finding,
below). The PO's sign-off on B+C+D together, and Phase E's wiki-status
report, are next.**
Written
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
   *Amended 2026-09-24 for the board (hands-on finding 2, below the gate):
   the gap is the ghost's slot, from dnd-kit's shuffle, so Top and Bottom
   are the ghost's neighbors, the same neighbors `dropAnchorFor` names at
   Column layer. The library is unchanged: `gapIndexFor(rows, anchorId,
   side)` returns the same gap for "after Top" and "before Bottom". The
   sidebar keeps `over` + `resolveDropSide`: it draws no ghost row, so its
   indicator line is its only cue, and it already matches the save.*
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
   *Amended 2026-09-24 (Phase D's hands-on finding): the carried copy is
   indented to the projected depth too. The ghost row this decision
   describes sits under the carried copy, so on its own it can't be seen.*
5. **Subtree removal, both surfaces.** On the board the dragged item's
   children are already unrendered for the drag (§5a). In the sidebar the
   descendants stay drawn dimmed but leave `sortableItems` and the
   Top/Bottom candidates (fixes difference 2).
   *Correction 2026-09-24 (Phase D's hands-on finding, item 3): true of a
   Card drag, not a Stub's own. Its descendants stay rendered and sortable
   below it in the flat section. They're out of the projection's rows, and
   `dropAnchorFor` steps past them, so they're never Top or Bottom.*
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

Built in Phase C. Wiki §5a and §7 updated by the PO 2026-09-24 (§5 now
says shortCard "at this layer").

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

**Hands-on findings, 2026-09-23 and 24.** The PO's hands-on of Phases B
and C turned up two problems with the Card zoom-in and one with column
placement. All three are older than this story (Stories 3–5 code), and E2E
caught none of them. They're handled here, before Phase D.

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
2. **Resolved another way: a column drop lands where the ghost is (Option
   A + lean). Ratified by the PO and merged 2026-09-24.**
   - *The finding.* The zoom-in hit box ignored a displaced card:
     `dragRegions.ts::layoutRect` subtracts dnd-kit's sortable transform,
     so the hit box stays where the card sat before it moved to make room.
     Measuring the drawn card instead was tried and rejected in the
     hands-on. Once the pointer is over a card, dnd-kit slides it away, so
     the zoom-in clock kept restarting: resting on a card meant both "move
     out of the way" and "let me in".
   - *What that exposed.* The ghost wasn't a reliable cue. The release took
     its side from `resolveDropSide` (which half of the hovered card the
     dragged copy's center is in), while dnd-kit drew the gap from list
     order, so a drop could land a slot away from the ghost. Stock dnd-kit
     drops where the gap is.
   - *Decided.* In a column/sub-row, **dnd-kit's shuffle decides the ghost's
     slot, and the drop lands there.** The dragged copy, above or below the
     ghost's middle, picks which neighbor names the slot: "after" the card
     above or "before" the card below, shown by the blue line. One function,
     `boardDndUtils.ts::dropAnchorFor`, feeds both the line and the release.
   - The dragged card's own row is a collision candidate again, as in stock
     dnd-kit, so resting over its own slot shuffles nothing. A release there
     still sends the anchor the line names: the two neighbors are one slot
     in the column but can differ in the workflow-wide order
     (item-positioning §2). That is what the item-repositioning suites'
     3.a/3.b exercise.
   - Card lists only. A Descendants section keeps `resolveDropSide` until
     Phase D (decision 2's amendment).
   - `layoutRect` is unchanged, so the zoom-in hit box still stands where
     the card was before it shifted. Finding 3 replaces it.
   - Tests: unit cases for `dropAnchorFor` and the own-row candidate
     (`boardDndUtils.test.ts`). Six E2E cases re-aimed at the new rule:
     DRAG-3.4, the decision-4 re-drag, and item-repositioning 3.a/3.b in
     both suites, now via `dragGesture.ts::setBackDownLeaning`. Gate:
     typecheck and lint clean; vitest 280/280; Playwright 142 passed, 6
     skipped, 148 total.
   - The wiki is the PO's to update; notes were handed over 2026-09-24 and
     the PO applied them the same day: board-drag §2 (the rule, five
     points), §1.1's table, §10's opening, §7.1 (the amended gap); item-
     positioning §2 (the set-down example), §4 and §7.1 (wording). The test
     plans' wording for these cases is the Test Planner's.
3. **Built 2026-09-24 (agreed 2026-09-23; reset rule and cue decided by
   the PO 2026-09-24): the zoom-in candidate is the card the blue line
   names.**
   - The Card region hit test stops choosing the zoom-in target. Card
     regions keep their other jobs: bounding the carried copy once inside a
     Card, and the pop-out test.
   - **Friction is intended.** Reparenting is the less common action, so
     zooming in should take a deliberate hold. Erring toward too hard is
     fine, and better than zooming in by accident while repositioning (§2's
     "assume reposition" bias).
   - **Two clocks, both panel values.** First a dwell (about 500 ms) on the
     same named relation before anything shows, so a pause while
     repositioning stays a reposition. Then the cue (about 800–1000 ms),
     ending in the pop. Suggested: a new `cardZoomDwellMs` for the dwell,
     and the existing `cardPopInDelayMs` (800 ms) for the cue.
   - **An invalid target never starts the dwell.** A cycle-forming or
     depth-capped card (§3.2) can still be named by the blue line for a
     reorder, but it isn't a zoom-in candidate.
   - **What resets both clocks: try Option 2 first.** Reset whenever the
     named relation changes: a different card, or the same card on its
     other side. "Same card, other side" only happens when the ghost moves
     past the named card, so it's always a visible reshuffle. Resetting there
     keeps the cue to moments when nothing on screen is moving, so a release
     commits the same thing it would have when the cue started. Also reset
     on pop-out and on Escape. A release before the pop commits the
     reposition.
     - *Option 1, left open:* reset only when the named card changes, so a
       wobble across that card keeps the cue running. Revisit only if the
       hands-on finds Option 2 too unforgiving. Its costs: the cue runs
       through a reshuffle, and what a release commits changes mid-cue with
       nothing to show it.
     - *Watch:* resting on the ghost's middle flips the named card back and
       forth, which resets under either option. If that bites, add a dead
       band as a panel value: the lean must cross a few pixels past the
       middle before it flips.
   - **The cue, simple for now.** Nothing new shows during the dwell beyond
     today's blue line. When the cue starts, the named card gets:
     - a **dashed outline** in the attach-preview blue, the same dashed
       style as the placeholder Stub row a Card shows once you're inside
       it;
     - a **thin bar along its inside bottom edge**, filling left to right
       over the cue's length.

     When the bar is full the pop happens, and today's visuals take over:
     the dashed outline becomes the solid locked-layer outline, the card
     opens with its dashed placeholder Stub, and the carried copy turns into
     a Stub (Phase C). Why this cue:
     - The named card sits beside the ghost, so its outline isn't hidden
       under the dragged copy the way the blue line is.
     - Dashed-to-solid reuses two looks that already mean "attach preview"
       and "locked here".
     - The fill shows how long to keep holding, and that letting go before
       it's full still just reorders.

     Accepted by the PO as good enough for this stage: it's there to test
     the two clocks and the reset rule, and it stands in for Story 8's morph
     so the morph can be pictured in its place. The dashed outline marks
     where the card will expand, the fill marks the morph's progress, and
     the pop at the end marks where the morph will hand over.
   - **The cue must never feed back into collision.** Draw it as one
     absolutely positioned, `pointer-events-none` overlay inside the card,
     the way the locked-layer outline and the blue line already are, so
     nothing changes size or layout. Drive the fill with a CSS animation
     whose duration is the cue clock, keyed on the named relation so a reset
     restarts it from empty.
   - **The full morph is Story 8's:** the card expanding, a dashed
     placeholder Stub growing, the carried copy shrinking toward it, with
     the pop landing partway through.
   - Expose the candidate and its phase (dwell or cue) on the board root
     for Story 10's E2E, in the same style as `data-drag-context`.
   - **Wiki:** board-drag §6 carries the rule as planned, not built (PO,
     2026-09-24), with pointers from §3's pop-in and §3.1's card clock.
     When it's built, the Phase E report lists those three passages as
     ready to mark built, and §3's current "resting on one of that column's
     own Cards" wording as superseded.

   **Built as written**, with the candidate resolved by looking the named
   card up among the pop machine's own regions rather than the pointer
   position: `popSession.ts::namedCardCandidate` reads
   `boardDndUtils.ts::dropAnchorFor`'s answer (computed in `useBoardDnd.ts`
   from dnd-kit's own `onDragMove`, since the hook isn't rendered under
   `DndContext` and can't read `useDndContext()` the way the blue line
   does), finds the region `card:<anchorId>` resolves to, and tracks `since`
   + `side` + `phase` (`'dwell'` then `'cue'`, recomputed every sample so a
   motionless hold still crosses the boundary) on the existing `PopHover`
   shape. `dragTuning.ts` gained `cardZoomDwellMs` (default 500 ms) beside
   `cardPopInDelayMs`, which is now the cue's own length — the total hold is
   their sum, one lookup (`popInDelayFor('card', …)`) read by both the
   pop-check and `popDueAt`. `popDueAt` schedules the dwell's own end as an
   intermediate milestone (not just the final pop), so the cue can mount
   with the timer alone, no pointermove required. An invalid target (§3.2)
   never becomes a candidate for free — `resolveDragStructure` never
   registers a `card:` region for one, so the lookup above simply finds
   nothing, the same guarantee `childRegionAt`'s callers already had. The
   cue itself (`KanbanCard.tsx::ZoomCue`, gated on a new
   `useZoomCandidatePhase` hook) is a dashed outline plus a fill bar
   animated via a static `@keyframes` (`index.css`) with the cue length as
   its inline `animation-duration`, so the dev panel's tuning takes effect
   live. `data-drag-zoom-candidate`/`data-drag-zoom-phase` on the board root
   expose the candidate + phase for Story 10, in `data-drag-context`'s
   style.

   **Verified:** the unit table (`popSession.test.ts`, a new describe —
   dwell → cue over a stationary hold; reset on a different named card;
   reset on the same card's other side; an anchor naming a card with no
   registered region never becomes a candidate; `popDueAt`'s two
   milestones) plus the fix to the one existing test that simulated a
   pop-in by hit test, now by named anchor instead (`overlayFormFor`'s
   pop-in/pop-out case); full gate green (tsc/eslint/prettier clean, vitest
   287/287); live, instrumented verification (temporary logging + a
   `MutationObserver` trace against the existing `drag-card-zoom-in.spec.ts`
   gestures, removed before commit) confirmed the candidate resolves to the
   card the blue line names — not wherever the cursor happens to sit — and
   holds correctly through both the dwell→cue transition and the final pop.

   *One thing found live, carried to Story 8 (roadmap), not fixed here —
   agreed with the PO 2026-09-24:* popping into a Card inserts the carried
   item's attach-preview ghost row *inside* it and drops the carried item's
   own row out of the column's list; if that row sat above the target Card,
   the target shifts up by a full row height at the exact instant the drag
   locks in. A `MutationObserver` trace confirmed the DOM genuinely reads
   `card:<id>` for one `popDelayMs` window and then bounces back to the
   column — not a logic bug, a real, visible jump whose blast radius this
   story's own longer hold (dwell + cue, versus the old hit test's
   instant commit-on-release) is what first made it matter. Two
   `tests/ui/drag-card-zoom-in.spec.ts` cases are skipped rather than
   chasing this with test-side timing (their own comment has the full
   writeup) — Story 8's morph is expected to settle it by construction, so
   it's a watch item, not a blocker for this story's own sign-off.

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
  Descendants layer, from the ghost's slot (its neighbors in dnd-kit's
  shuffled order, as `dropAnchorFor` finds them at Column layer; decision
  2's amendment) and the pointer's x. Cleared on pop-out.
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

**Built 2026-09-24.** Built as written above, with the following found
while building — each reasoned through and verified rather than assumed,
in the same spirit as Phase C's own deviations:

- **`boardDndUtils.ts::dropAnchorFor` had to widen to Stub rows, dropping
  its `ghostHeightPx` parameter.** The plan's "the ghost's slot, as
  `dropAnchorFor` finds them at Column layer" only works if the same
  function's ghost-slot math (not its which-half fallback — the function's
  own pre-Phase-D test named this exact gap: "over a Stub row (a
  Descendants section, until Story 6 Phase D)... over itself, on the
  which-half side") applies inside a Descendants section too. Widened the
  row-kind check from `isCardRow` alone to `isCardRow || isStubRow`, and
  the ghost's own height is no longer passed in — it's derived from which
  kind of row `over` actually is (`SHORT_CARD_HEIGHT_PX` for a Card,
  `STUB_ROW_HEIGHT_PX` for a Stub — moved to `cardMetrics.ts` alongside the
  Card constant it mirrors), since that's a fact about what's sliding
  through the list, not something every caller should have to know to
  supply. Every existing call site (the live blue line, `handleDragEnd`'s
  own anchor, Finding 3's named-card candidate) simplified by one argument.
- **A foreign item's first entry into a Descendants section needed its own
  branch in `popSession.ts::placementFor`**, not covered by "unchanged from
  whatever placed the row" as literally written — that sentence describes
  a Stub reordering within its *own* section, where `parentId` is
  `parentOpinionOf(origin)`. A Free Card (or a Stub detaching from a
  *different* Card) reaching a Descendants section for the first time has
  no such opinion to read, and needs `region.cardId` instead — mirroring
  the Card branch's own `attachToCardId === containingCardId` split one
  layer up. `region.cardId === containingCardId` is the same test,
  generalized.
- **The same foreign item needed to stop being the static Card-layer ghost
  once locked at Descendants.** Story 4's `AttachGhostRow` preview (no
  `useSortable` registration) is right for the Card layer's constant
  auto-drop, but the Descendants layer's own gap+depth rule needs
  `dropAnchorFor`'s shuffle math to see the item as a real member of the
  flat list — otherwise its own slot never participates in the sortable
  order at all. `KanbanCard.tsx`'s `attachGhostId` now only applies while
  `pop.contextKey === cardRegionKey(item.id)` (Card layer only); once
  `contextKey` moves to this Card's own `descendants:` key, the row falls
  through to the ordinary `AttachedChildRow` branch — the same one a
  same-section Stub reorder already used, so no new rendering path was
  needed, only a narrower gate on the old one.
- **The rendered depth of the active row previews the projection
  (decision 4's "indented to the projected depth"), for both cases above** —
  `KanbanCard.tsx` overrides the one row whose id matches the active
  drag's own, reading `session.projection.depth` instead of the row's
  stored depth. The provisional invalid cue (decision 7) rides the same
  row: a dashed red outline plus `data-placement-valid="false"` exactly
  when that row's own tab state is over cap.
- **§7.2's depth-cap check reads the resolved parent's absolute depth
  live**, via `lib/hierarchy.ts::getDepth` over the loaded items — the
  same predicate (`isWithinDepthCap`) classification already uses, fed the
  *projection's* resolved parent rather than a fixed one, recomputed every
  sample.
- **The dragged subtree's exclusion (§7.2) reuses classification's own
  cycle-forming set** (`excludeIdsFor`, `useBoardDnd.ts`) rather than a
  second tree walk: `classifyDragTargets` already marks exactly `{the
  active item} ∪ {its descendants}` as `'cycle-forming'`, which is §7.2's
  own definition of what a Card's Descendants section must never offer as
  a Top/Bottom candidate.

**Verified by:** the unit tables on the shared placement library
(`hierarchyPlacement.test.ts`, unchanged — Phase A's own coverage already
carries §7.1/§7.2's rules) plus new cases in `popSession.test.ts`
(`placementFor`'s foreign-entry branch, both same-section and
cross-Card; a locked Card's own zoom-in into Descendants, reachable and
duration-only, with no further child from there) and `itemListOps.test.ts`
(`descendantsChildrenOf`); `dragRegions.test.ts` updated for the
`childRegionAt`/`resolveDragStructure` widening; `boardDndUtils.test.ts`
updated for `dropAnchorFor`'s generalization. Full gate green
(tsc/eslint/prettier clean, vitest 300/300 — up from 287; full Playwright
suite unchanged at 140 passed/8 skipped/148, confirming zero regressions
from the core drag-machine changes touched here). Live, hands-on against a
scratch DB (a tree matching §7.1's own worked example — `S1 › S1a › S1a1 ›
S1a1a › S1a1a1`, then `S2` — plus a second Card `Q` with one child, and a
Free Card `X` to drag), covering:

- reachability, Column → Card(P) → Descendants(P), by holding;
- a same-section placement (`X` dropped on `S1a1`'s own gap resolves to
  "`S1a's` first child, before `S1a1`" — `2:2:true`, exactly the tab state
  §7.1's rule predicts);
- tab-depth choice at a gap with several states (`Top=S1a1a1`,
  `Bottom=S2`, range `[0,5]`): no horizontal move lands at the shallowest
  state (`5:0:true` → attaches to `P` itself, after `S1`); tabbing right
  ~4 steps lands at `Top`'s own depth (`5:4:true` → attaches to `S1a1a`,
  after `S1a1a1`) — confirming the seed (the entered gap's Top depth) and
  the 12px-per-step horizontal read both measure correctly;
- the depth-cap exception (§7.2, §3.2): tabbing to the deepest state in
  that same gap (`Top`'s own first-child depth, `5:5:false`) shows
  `data-placement-valid="false"` live, and a release there writes
  **nothing** — `X` comes back exactly as it went in, confirming the one
  ruled exception to "never enterable" holds at release, not just in the
  cue;
- a foreign item's first entry into a *different* Card's section (`X`
  zoomed into `Q`, released on `Q`'s only child `T1`'s own gap) resolves
  `0:0:true` → attached to `Q` itself, before `T1` — the "no Top" boundary,
  and confirmation that a cross-Card reparent takes `region.cardId`, never
  a stale relationship.

Zero console errors across the run. The scratch environment (its own
backend on port 3098, its own DB file, its own frontend on port 5199) was
torn down afterward; nothing here touched the dev database.

**Hands-on finding, 2026-09-24: the chosen depth couldn't be seen, and the
gap was one off.** In the PO's hands-on, a Stub couldn't be placed at a
chosen depth. A probe in the test stack (a real drag, the file deleted
afterward) found two causes, and a third while fixing them.

1. **The gap was one off: an Option A leftover.**
   - The Descendants branch of `boardDndUtils.ts::resolveBoardCollisions`
     still excluded the dragged row. Option A (hands-on finding 2) removed
     that exclusion for columns but not here.
   - So `over` was never the dragged row's own slot, and the ghost jumped
     into a neighbor's slot even while holding still.
   - In the probe: P › S1, S2, S3. S2, held still and tabbed right, became
     **S3's** child (gap "after S3") instead of S1's.
   - **Fix:** the exclusion is gone. The dragged Stub's own row is a
     candidate, as at a column. It's also the kind of leftover Story 6.1's
     rule-change trace looks for, found early.
2. **The depth changed, but nothing visible showed it.**
   - Depth follows the raw pointer, not the carried copy. 6 px of sideways
     travel changes one level (`DESCENDANTS_INDENT_PX`, rounded).
   - The carried Stub is exactly the section's width
     (`useBoardDnd.ts::overlayWidthFor`), so the clamp leaves it no
     sideways travel at all. It sat at x=285 through ±30 px of pointer
     movement.
   - Decision 4's cue, the ghost row's indent (12 → 24 px in the probe),
     sits at 30% opacity directly under the copy.
   - **Fix, a simple depth cue** (decision 4 amended): at the Descendants
     layer the carried Stub's visible box indents to the projected depth,
     `(depth + 1) × DESCENDANTS_INDENT_PX`, the same geometry as a ghost
     row, so its pill lines up with its would-be siblings.
     - A 75 ms margin transition makes each snap read as a step.
     - Over the cap, the copy carries the provisional invalid outline
       (decision 7), because the ghost row that shows it is hidden.
     - Only an inner box moves (`KanbanCard.tsx::overlayStubIndent`). The
       overlay's root keeps its width and position, so nothing dnd-kit
       measures changes.
     - `BoardView.tsx` passes `session.projection` as a prop
       (`overlayProjection`), since the overlay renders outside
       `DragSessionContext`.
   - The PO accepted it as good enough to test placement against. Story 8
     tunes it (roadmap § Story 8: travel per level, pinned vs. following,
     the snap, the over-cap look).
3. **Found while fixing: a Stub with children lost its slot.**
   - A dragged Stub's own descendants stay rendered, and sortable, below it
     in the flat section. They're excluded from the projection's rows,
     since they travel with it (§7.2; decision 5's "already unrendered" is
     true for a Card drag, not for a Stub's own).
   - Leaning down named its own child, `gapIndexFor` found no such row, and
     the gap jumped to the section's end. In the probe, S2 (with child S2a)
     set back down leaning down landed after S3.
   - **Fix:** `dropAnchorFor` takes an optional `travels` predicate and
     steps past those rows to the next one that stays.
   - `boardDndUtils.ts::travelingRowsFor` supplies it (the classification's
     cycle-forming set, the same one `excludeIdsFor` reads). It supplies it
     **only at a Descendants context**: at a column, a Free descendant of
     the dragged Card is a real anchor.
   - The blue line (`KanbanCard.tsx::useLiveDropSide`) and the gap
     (`useBoardDnd.ts::handleDragMove`) both read it, so they still agree.
   - Nothing on screen yet shows that the branch is off-limits: the
     children stay drawn at full strength. Carried to Story 8 (roadmap):
     grey them out, or carry them with the copy.

**Verified:**
- **Unit** (`boardDndUtils.test.ts`, vitest 304/304):
  - the dragged Stub's own row is a Descendants candidate;
  - `dropAnchorFor` steps past traveling rows, and names them without the
    predicate;
  - `travelingRowsFor` applies only at a Descendants context.
- **Probe** (test stack, deleted after):
  - S2 held still and tabbed right → S1's child;
  - S1a tabbed left → P's child between S1 and S2 (position 1.5);
  - S2 with child S2a, set back down leaning either way → keeps its slot;
  - tabbing past the cap → the copy steps to 72 px with the red outline,
    and a release writes nothing;
  - the overlay's root stayed at 285/246 px throughout while its inner
    box stepped 12/24/…/72 px.
- **Gate:** tsc (root and client), eslint and prettier clean on the
  touched files. Full Playwright suite: 139 passed, 8 skipped, 1 failed.
  The failure was a 30 s timeout in `drag-column-bands.spec.ts`'s
  reservation-invariant case, a Board-layer path this change doesn't
  touch. It passed 4/4 on repeat and in a full run of its file (16/16), so
  the suite matches Phase D's 140 passed / 8 skipped.

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
   wrong. *(The one known at planning — §5a/§7's carried copy — was fixed
   by the PO 2026-09-24.)* Candidates
   to check (not presumed mismatches): the seed rule (decision 3) against
   §7.1's bare "horizontal offset picks a depth"; the collapsed-Top
   first-child resolution (sidebar difference 6); the loaded-items depth
   undercount (Risks); and anything else the Phase B/C hands-on changed.
   The column-placement change (hands-on finding 2) already went to the PO
   as notes on 2026-09-24; list only what those notes didn't cover.

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

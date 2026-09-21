# Story 6 — The Descendants layer: manual hierarchy placement

Implementation plan for Epic 3.5 Story 6. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: planned 2026-09-17, not started.** Written against the code as it
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

**Verified by:** **unit tables on the shared placement library** carry most
of the weight — every §7.1 clause is a pure function over a fixture tree
(the worked example, the one-state gap, no-Top / no-Bottom, clamping,
per-state validity, subtree removal), and the sidebar's existing
`projectTreeUtils.test.ts` cases are re-expressed against the same
functions; **E2E reachability** — `card:<P>` → `descendants:<P>` by a hold,
back by a pop-out, and a release at a given gap + depth producing the
expected request (TC-9/10/11) or none (TC-18); **manual** for the tab feel,
`DESC_POP_IN`, and the sidebar's changed behaviors.

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
   before Phase C.**
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

### Open decision for this story — detached descendants in the section: absent, or greyed?

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

---

## Build order

### Phase A — The shared library, and the sidebar onto it

`client/src/lib/hierarchyPlacement.ts` — pure, no React, no dnd-kit:

```ts
interface Row { id: string; parentId: string | null; depth: number }   // depth 0 = the root's direct children

flattenHierarchy(rootId, childrenOf, exclude: ReadonlySet<string>): Row[]   // DFS; `exclude` = the dragged subtree
gapIndexFor(rows, overId, side): number                                     // 0..rows.length
depthRangeFor(rows, gap): { lo: number; hi: number }                         // [bottom?.depth ?? 0, (top?.depth ?? -1) + 1]
resolvePlacement(rows, gap, depth, rootId): { parentId: string; anchor: { id: string; side: 'before' | 'after' } | null }
tabStates(rows, gap, isValid): { depth: number; placement: …; valid: boolean }[]   // every state in the gap, for rendering and tests
```

`resolvePlacement` is §7.1 verbatim: no Top → `{ root, bottom ? before
bottom : null }`; `depth === top.depth + 1` → `{ top, firstChild ? before
firstChild : null }`; otherwise the ancestor `A` of Top at `depth` (Top
itself at Top's depth) → `{ A.parentId ?? root, after A }` — which is also
"before Bottom" at the shallowest level, sent as one relation (TC-10). The
validity predicate is injected: on the board
`isWithinDepthCap(getDepth(parentId), subtreeHeight, cap)` — the same
predicate classification already uses, fed the *resolved* parent (§7.2);
in the sidebar `() => true`.

**Unit tables:** TC-8's tree and every gap in it; TC-9 and TC-10's
relations; TC-11's five boundaries; TC-18's per-state validity with a
subtree height; `flattenHierarchy` with the dragged subtree excluded;
`gapIndexFor` at both ends. Then `projectTreeUtils.test.ts`'s cases
re-expressed — the ones that encode difference 1 or 2 change and are
recorded as such.

**Sidebar:** `computeProjection` / `findPrevSibling` / `findNextSibling`
become adapters over the library — `onReorderProject(id, parentId, prevId,
nextId)` maps from the one relation (`after A` → `prev = A`; `before B` →
`next = B`; the other `null`, the server re-derives). `handleDragMove`
gains the side (`resolveDropSide(active.rect.current.translated,
over.rect)` — the event carries both) and passes `delta.x` as today.
`descendantIds` leave `sortableItems`. Hands-on the two behavior changes.

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

### Phase C — The machine and the within-action

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

### Phase D — Tests and docs

- **E2E:** DRAG-1.21 (hold on the section → `descendants:<P>`; pop-out →
  `card:<P>`; a hold on P *outside* the section never zooms); DRAG-4 TC-8
  (the states offered — assert `data-drag-projection` while moving x by
  `INDENT` multiples read from the client constant, never a literal),
  TC-9 / TC-10 / TC-11 (release writes at gap + depth), TC-13 (a done
  parent), TC-18 (over-cap → no request; a shallower state commits);
  DRAG-5 TC-9's tab-right and over-cap bullets. The gesture helper gains a
  `tabBy(n)` that moves the pointer horizontally by `n × INDENT`.
- **Skipped Tests:** at this point we expect that DnD kinks have been worked out 
  and we can fix and unskip previously flaky tests. First verify that the 
  skipped tests are actually still testing something unique and haven't been
  replaced by new tests that are already passing
- **Wiki:** §7 "Not yet built" → built, with the seed rule (decision 3)
  recorded as the horizontal-offset definition; §1.1's Descendants row and
  §3's Card → Descendants sentence lose their "Story 6" markers; §3.1
  names the fourth clock; §3.2's exception "as built"; the header's build
  status; DRAG-4 / DRAG-1.21 statuses; CLAUDE.md (the flat section, the
  shared library, the fourth clock); the sidebar's rule now documented as
  "the same library" wherever its behavior is described.

---

## Risks / things to watch

### From the Story 4 audit's #7/#8 fixes (2026-09-21) — read before Phase C

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
  right shape for the rule, but the PO hasn't seen it — Phase B before
  Phase C, with a hands-on in between.
- **Depth of the resolved parent** comes from `lib/hierarchy::getDepth`
  over the *loaded* items. A Card whose ancestor lives in another
  workflow (cross-workflow reparent is accepted at the API) isn't loaded,
  so the client's absolute depth can undercount and offer a state the
  server rejects with a 400 — §3.2 drift, resynced by the existing failure
  path. Classification has the same exposure today; this story inherits
  it and should record it, not fix it (Story 7 or a board-load change).
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

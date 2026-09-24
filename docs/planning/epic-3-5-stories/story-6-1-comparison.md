# Story 6.1 — comparison: the drag layer against its current rules and stock dnd-kit

Working document for [`story-6-1-library-first-refactor.md`](story-6-1-library-first-refactor.md),
the counterpart of [`story-4-1-comparison.md`](story-4-1-comparison.md). It
holds the deliberation; the plan's ledger holds the outcomes. Written
2026-09-24 against `c225387` plus the uncommitted Phase D hands-on fixes
(the Descendants own-row collision, `travelingRowsFor`, the depth cue).
References are `file::function`, since line numbers will rot.

Findings I authored or shaped this session are marked ✱, so they can be
pushed on: the lean in `dropAnchorFor`, `hasDetachedElements`,
`travelingRowsFor`, and the depth cue.

Each finding carries a bucket — (a) leftover, (b) custom for a reason,
(c) same rule, different shape, (d) a later story absorbs it — and a
**proposed** disposition. Dispositions become final in the plan's ledger.

---

## 0. Verdict

Four things matter; the rest is small.

1. **Phase D and finding 3 each wrapped the shape before them instead of
   replacing it.** Story 5's interim Descendants release is still in the
   code, unreachable, with comments describing it as live (L1-5). Card
   regions still carry layout-space geometry for a hit test that finding 3
   retired (L1-8).
2. **`useBoardDnd.ts` is 1,122 lines**, up from 663 at the Story 5 audit.
   The Descendants projection is its biggest new concern, and it's spelled
   twice inside the hook (every sample, and again at release) and a third
   time in the sidebar (L2-1, L2-2). The carried file splits (C-1 to C-5)
   are all still open.
3. **The triggers read two different points.** Layer membership and depth
   read the cursor; the slot, the anchor, and the Column → Card zoom-in
   read the carried copy. That's the root of the jumps Story 8 now
   carries (L2-3). 6.1 records it; choosing one point is a feel decision
   for Story 8, not a refactor.
4. **Comment drift is heavy.** About 15 comments call the 2026-09-16
   carve-out rework "Story 8" (L1-11), and several module docs still
   describe the pre-finding-3 hover or the "identity at every layer" rule.

No finding needs a rule change. Two land in visible code and get a
hands-on check (L1-8, L1-13).

---

## 1. Lens 1 — rule-change trace

### R1 · The carried copy is a Stub from the Card layer down (2026-09-23)

No leftover footprint. Phase C reshaped the overlay in place
(`overlayFormFor`, `overlayWidthFor`, `reanchorOverlayTransform`), and the
comments it touched (`cardMetrics.ts`, `KanbanCard.tsx`'s header) are
current.

### R2 · Option A + lean (2026-09-24)

**L1-1 — The E2E quarter helpers still aim at "which half of the card".**
- `dragGesture.ts::topQuarter`/`bottomQuarter`/`atFraction` and their
  comment ("`resolveDropSide`, which half of it the dragged card's center
  is in") describe the retired rule. The lean picks the side now.
- Used in 4 specs (`topQuarter`) and 1 (`bottomQuarter`).
  `item-repositioning-cross-column-dnd.spec.ts` also cites
  `resolveDropSide` in a comment.
- Six specs are still skipped for "drag-gesture precision", a limitation
  of the old rule (roadmap § Story 10, item 3).
- **(a) for the comments, (d) for the specs.** Proposed: fix the helper
  and spec comments (Phase 0); defer re-aiming and the six skips to
  **Story 10**, which already owns them.

**L1-2 — Two docs still describe the pre-lean rule.** `PlacementOver`'s
doc says the side is "`resolveDropSide`'s side". `useBoardDnd.ts`'s header
says a release "resolves in-context through dnd-kit's `over` (anchor +
side)". **(a).** Proposed: Phase 0.

**L1-3 — `dropAnchorFor`'s fallback names a container as an anchor.**
- The `onOver` fallback (`resolveDropSide` on `over` itself) is reached
  in two cases:
  - **A non-row `over`** (a column's container at Column layer). It
    returns `{anchorId: <container id>, side}`. Harmless today:
    `handleDragEnd` checks for the container first, and
    `namedCardCandidate` finds no card for it. But `namedAnchorRef` carries
    a meaningless anchor.
  - **A row whose list doesn't contain the dragged item yet** (the frame
    after a layer change, before the placement re-renders the row into its
    new list). A which-half answer is a reasonable stand-in there.
- **(c).** Proposed: return `null` for a non-row `over`; keep the row
  case. Phase 3.

### R3 · The release always sends the named anchor (2026-09-24)

**L1-4 — "Identity writes nothing, at every layer" overstates.**
- `DragSession.origin`'s doc and `isIdentity`'s header both say it.
- At Column layer (and now Descendants), setting a card back down in its
  own slot writes the named anchor.
- Identity still applies at Card layer ("set back down"), to the
  terminal/bare-container fallbacks, and to a null placement.
- The code is right; `isIdentity`'s last sentence even says so.
- **(a).** Proposed: Phase 0, both docs.

### R4 · The Descendants gap is the ghost's neighbors (decision 2 amended; Phase D)

**L1-5 — Story 5's interim Descendants release is still there,
unreachable.** A Descendants release returns early into
`releaseDescendants`, and every mid-drag `placementFor` call passes
`over = null`. Unreachable:
- `useBoardDnd.ts::releaseListFor`'s `descendants` branch, and
  `siblingItems`, its only helper;
- the `list.containerId === null` branch of `handleDragEnd`'s
  `placementOver`;
- `popSession.ts::placementFor`'s Descendants `over` → anchor path. It is
  still unit-tested in `popSession.test.ts`, which is why coverage didn't
  flag it.

Comments that describe it as live:
- `handleDragEnd`'s "Story 5's interim direct-sibling reorder" paragraph,
  and "`releaseListFor`/`placementOver` below still resolve mid-drag"
  (they're release-time);
- `CollisionSession.descendantsSectionRect`'s "scoped to true siblings
  only";
- `placementFor`'s "this function's Descendants branch stays the mid-drag
  ghost's rule" framing;
- `workflow/CLAUDE.md`'s "(Story 5's interim ordering)";
- `siblingItems`' pointer to the retired `siblingScopeParentId`.

- Phase D added its release *beside* Story 5's instead of replacing it.
  This also supersedes Story 5 audit #16 (C-7).
- **(a).** Proposed: adopt, Phase 0. **Makes dead:** the two branches,
  `siblingItems`, the `over` path's `popSession.test.ts` cases, and the
  comments above.

**L1-6 ✱ — The Descendants collision excluded the dragged row.** Fixed on
2026-09-24 in Story 6 (Phase D's hands-on finding). Recorded so the
ledger shows it: **adopted → Story 6**.

**L1-7 ✱ — "The dragged subtree" is derived twice on the board and once
more in the sidebar.**
- `useBoardDnd.ts::excludeIdsFor` builds a `Set` from classification's
  cycle-forming states.
- `boardDndUtils.ts::travelingRowsFor` (mine, today) builds a predicate
  from the same states.
- The sidebar's `projectTreeUtils.ts::resolveGap` handles a named row
  inside the excluded block its own way: "after the nearest eligible
  predecessor".
- **(c).** Proposed:
  - **Board: adopt, Phase 2.** One derivation; `travelingRowsFor` reads
    the drag's excluded set.
  - **Sidebar: reject.** Decision 2's amendment keeps it on `over` +
    `resolveDropSide` with no ghost shuffle, so its gap rule differs by
    design.

### R5 · The zoom-in candidate is the card the blue line names (finding 3)

**L1-8 — Card regions keep layout-space geometry for a hit test that's
gone.**
- **What it was for.** `dragRegions.ts::layoutRect` backs a Card region's
  rect out of dnd-kit's sortable transform (`currentTranslate`, `size`),
  so a Card hit test matched dnd-kit's own measurement while the column
  shuffled. 4.1 kept it as (b)4, "the tuned feel" of hit-testing Cards.
  Finding 3 retired that test: `namedCardCandidate` looks the card up by
  key.
- **Who still reads a Card region's rect.** The Card-context inside test,
  `popOutDue`'s distance, the clamp, and `overlayWidthFor`. All at Card
  layer, where nothing shuffles (a Card context has no `over`). So the
  correction is a no-op except in the one frame of the Column → Card
  transition, when the target may still be mid-shift.
- **It also causes an inconsistency.** Story 5 audit #18: the correction
  is gated on `kind === 'card'`, so a Descendants region nested inside a
  shifted Card isn't corrected while the Card is. Deleting the correction
  makes both painted boxes (C-8).
- **Stock dnd-kit** already measures droppables transform-agnostic for
  collisions. Ours duplicated that for a job we no longer have.
  `tests/helpers/dragGesture.ts::boxOf` stays: it aims the test pointer at
  dnd-kit's own measurements (Story 4 audit #29's do-not-unify still
  holds).
- **(a), with a check.** Proposed: adopt, Phase 3. First probe the
  transition frame: whether the painted box, not the layout box, is the
  right one for the inside test while the target is mid-shift. **Makes
  dead:** `currentTranslate`, `size`, `layoutRect`'s `isCard` parameter,
  and the only uncovered lines in `dragRegions.ts`'s coverage.

**L1-9 — Column scope still measures every Valid Card's rect every
sample.** `namedCardCandidate` only needs to know the card's region
exists: it's Valid, and not scrolled out of view. **(c).** Proposed:
**reject.** The clip is what makes "scrolled out of view → no candidate"
work, and L1-8 removes the per-card `getComputedStyle` that made the
measurement costly.

**L1-10 — Docs still describe the hit-test candidate.**
- `PopSession.hover`: "the cursor is resting on one of *its* Cards" and
  "always, while locked into a Card: Story 4 has no further zoom-in".
- `hoverFor`'s header: "a locked column/sub-row's hover on one of its own
  Cards". It now serves Board-layer card lists and a Card's Descendants
  candidate.
- `childRegionAt`'s header: "or a locked column/sub-row's own Cards when
  `parentKey` is its key". It's never called with a column key now.
- `advancePopSession`'s locked-branch comment: "always null until then".
- `popDueAt`'s: "a locked hover's is always a Card today … before Story 5
  adds another".
- **(a).** Proposed: Phase 0.

**L1-14 ✱ — `hasDetachedElements` still has a job.**
- The candidate lookup and the Card context both read *measured* regions.
- Board-layer carve-outs remount a column's Cards, and a detached element
  measures as an empty box, so its region silently drops out.
- **(b).** Proposed: **reject deletion.**

### Drift not tied to one rule change

**L1-11 — "Story 8 re-plan" means Story 3's carve-out addendum.**
- About 15 comments call the 2026-09-16 carve-out rework "Story 8":
  `BandGuides.tsx`, `BoardColumn.tsx`, `dragRegions.ts` (×2),
  `test/dragFixtures.ts`, `drag-column-bands.spec.ts` (~10), and
  `attached-children.spec.ts`.
- The roadmap records that work as Story 3's addendum and says outright
  it isn't Story 8. With Story 8 now "visual cue polish and feel tuning",
  the comments send readers to the wrong story.
- **(a).** Proposed: Phase 0. Rename to "Story 3 addendum (carve-out
  rework, 2026-09-16)".

**L1-12 — Headers and module docs lag.**
- `dragRegions.ts`'s header lists Board/Column/sub-row/Card, no
  Descendants. `RegionCommon.key`'s doc has no `descendants:` form.
- `DragSessionContext.ts`'s header omits `containingCardId` and
  `projection`.
- `useBoardDnd.ts`'s header says the pointer is tracked "for the life of
  a Card drag" (it's every item drag). Its release summary omits the Card
  constant and the projection.
- `popSession.ts`'s header layer list (Board → Column → Card) says
  "manual placement among Stubs is Story 6's", in the future tense.
- `boardDndUtils.ts`'s header and its `workflow/CLAUDE.md` line say
  collision + request only. The file also names anchors and types row
  data.
- `sendItemMove`'s "attached-sibling reorders with a bare anchor": every
  path goes through `toRequest` now.
- The sidebar's `resolveGap` says the board "keeps the last known
  projection" when `over` is the dragged row. The board names a neighbor
  by the lean now.
- `BoardColumn.tsx`'s "Drop cards here" guard comment says "a Stub drag
  never reaches the pop machine".
- **(a).** Proposed: Phase 0.

**L1-13 — The blue line reads the dragged row's own `role`; the anchor it
mirrors doesn't.**
- `KanbanCard.tsx::useLiveDropSide` filters on `expectedActiveRoles`, an
  Epic 3.2 leftover from when a Stub drag had its own path.
- `namedAnchorRef` (the gap, the zoom-in candidate) has no such filter.
  In the frame after a Stub pops out into a column, before its row
  remounts as a Card, the line is missing from the card the release would
  anchor to.
- Decision 4 says policy never reads the active row's `role`. Since
  Option A, this line *is* the anchor cue, so its "Diagnostic-grade"
  header is out of date too.
- **(a).** Proposed: drop the role filter (collision already scopes
  `over`) and fix the header. Phase 3, a tiny visible change.

---

## 2. Lens 2 — who decides

For each question: where it's decided, where else it's computed, which
point it reads, and what stock dnd-kit already offers. "Cursor" = the raw
pointer (`pointerRef`); "copy" = the carried copy's clamped box (dnd-kit's
`collisionRect` and `active.rect.current.translated`, both after the
`DndContext` modifier).

| Question | Decided in | Also computed in | Reads | Stock dnd-kit | Verdict |
|---|---|---|---|---|---|
| Which layer? | `popSession.ts::advancePopSession` | — (the rest read `contextKey`) | cursor | nothing | (b) §1.1 |
| Board → column candidate | `childRegionAt` | — | cursor | nothing | (b) §5 |
| Column → Card candidate | `namedCardCandidate` | — | copy (via `over` + lean) | `over` | (b) §6 |
| Card → Descendants candidate | `childRegionAt` (via `hoverForChildRegion`) | — | cursor | nothing | (b) §3; see L2-3 |
| Ghost's slot, column | sortable shuffle | — | copy | the strategy | stock |
| Ghost's slot, Board | `bandFor` | `BandGuides` via `reservationFor` (shared) | cursor y | nothing | (b) §5 |
| Anchor + side ✱ | `dropAnchorFor` | sidebar: `resolveDropSide` + `resolveGap` | copy | `over.data.current.sortable` + `arrayMove` | lean is (b); sidebar split by design |
| Depth | board: `updateDescendantsProjection` | sidebar: `computeProjection` | cursor x (board) / `delta.x` (sidebar) | nothing | **L2-1** |
| What gets written, Descendants | `releaseDescendants` | `updateDescendantsProjection` (same `resolvePlacement`, every sample) | — | nothing | **L2-2** |
| What gets written, elsewhere | `toRequest` / `isIdentity` | — | — | nothing | (b) |
| Where each droppable is | dnd-kit (transform-agnostic) | our Card regions (`layoutRect`) | — | yes | **L1-8** |
| Where the copy may go | `clampToContext` (reanchor, clamp, snap) | — | cursor (reanchor) | modifiers | (b); pure math sits in the hook, C-1 |
| What the copy looks like | `overlayFormFor` / `overlayWidthFor` / `overlayStubIndent` ✱ | — | — | `DragOverlay` renders it | fine |
| Blue line | `useLiveDropSide` → `dropAnchorFor` | — | copy | nothing | **L1-13** |
| Valid targets | `classifyDragTargets` | `excludeIdsFor`, `travelingRowsFor` | — | nothing | **L1-7** |
| Clocks | `popInDelayFor` / `popDueAt` | — | — | nothing | (b) §3.1 |
| Which element scrolls | `findVerticalScrollAncestor` | dnd-kit's autoscroll | — | `getScrollableAncestors` | (b) — the Story 4 #29 quirk still holds |
| Which point each trigger reads | — | — | both | `closestCorners` reads the copy, `pointerWithin` the cursor | **L2-3** |

**L2-1 — The depth formula is spelled twice.**
- `depth = seedDepth + round(Δx / indent)`, clamped to `depthRangeFor`,
  then `resolvePlacement`.
- It lives inline in `useBoardDnd.ts::updateDescendantsProjection`, and
  as `projectTreeUtils.ts::computeProjection` in the sidebar.
- Decision 8's point was one library. The two differ only in the indent
  and where Δx comes from (the board's raw pointer, since its copy is
  clamped; the sidebar's `delta.x`, unclamped). Both are arguments.
- **(a).** Proposed: lift `computeProjection` into
  `lib/hierarchyPlacement.ts` with the indent as a parameter; both
  surfaces call it. Phase 2.

**L2-2 — The Descendants placement is resolved twice.**
- Every sample, `updateDescendantsProjection` builds the rows and calls
  `resolvePlacement`, for the cap check.
- At release, `releaseDescendants` rebuilds the rows and calls it again
  from the stored gap and depth.
- The cue and the write are meant to be one answer (§10).
- **(a).** Proposed: keep the last sample's resolved placement beside the
  projection (in the ref, not in render state); the release reads it.
  It's as fresh as the last sample, the same reasoning `regionsRef`
  already relies on. Phase 2.

**L2-3 — Two points of reference.**
- **Cursor:** layer membership, the pop-out clock and distance, the Board
  and Card → Descendants zoom-in candidates, and the depth.
- **The clamped copy:** the shuffle, the anchor and lean, the Column →
  Card candidate, and the Descendants gap.
- The two zoom-in edges below Column read different points. Once a layer
  change moves the copy away from the cursor, they disagree. That's the
  Story 8 bullet "things jump at a layer change".
- **Record only.** Proposed: **defer → Story 8.** Picking one point is a
  feel decision. It changes which trigger wins, which is a rule question,
  not a refactor.

**L2-4 — `resolveDropSide` lives in a board module, and the sidebar
imports it.** **(c).** Proposed: **reject a separate, sidebar-neutral
home** (such as `lib/`). It's one pure function, and a new shared module
just for it isn't worth it. It still moves, as part of C-3: to
`dragCollision.ts` with the anchor-naming half, and the sidebar's import
follows it there.

---

## 3. Lens 3 — dry run of Stories 7–10

**Story 7 (depth cap + overflow).**
- A "see X children" placeholder, or a depth limit, changes which rows the
  section renders.
- Today the rendered rows (`KanbanCard.tsx`'s `hierarchyRows(...)`) and
  the projection's rows (`flattenHierarchy(cardId,
  descendantsChildrenOf(getAttachedChildren), exclude)`, built twice in
  the hook) are separate derivations. `gapIndexFor` needs them to agree
  on order to turn dnd-kit's named row into a gap.
- Story 7 would have to change both in lockstep.
- **L3-1 (a).** Proposed: one "section rows" function that the render and
  the projection both read (the Descendants half of C-6). Phase 2.
- The cap check's loaded-items depth exposure is a known Story 6 risk,
  not a refactor.

**Story 8 (look and feel).**
- **L3-2 — The cues are scattered.** Nearly every cue lives in
  `KanbanCard.tsx`: the blue line, the zoom-in cue, the invalid outline,
  the overlay Stub classes and `overlayStubIndent` ✱, the pending pulse,
  the relationship overlays. The carve-outs and the context outline live
  in `BandGuides.tsx`. A restyle means editing a 619-line component file.
  **Fold into C-5:** a drag-chrome module makes Story 8's restyle one
  module.
- **L3-3 — The feel work edits the overlay math.** "Keep the cursor on
  the copy through layer changes" edits exactly `reanchorOverlayTransform`
  / `clampToCurrentContext` / the snap tween, today pure math inside the
  hook. **Fold into C-1:** extract it as a pure, unit-tested module.

**Story 9 (Free-item reparent keeping Free).** It needs a third
Card-layer meaning: `placementFor`'s Card branch, plus `toRequest`'s
parent branch, which hard-codes `isAttached: true`. It's small, and Story
9 may decide it isn't a board gesture at all. **L3-4 (c).** Proposed:
**reject pre-work.**

**Story 10 (automation catch-up).** The unread `data-*` surfaces (SW-5),
the quarter helpers and skipped specs (L1-1), and a `SUSTAINED_CARD`
preset and `tabBy` helper that don't exist yet. All test-side, and
already Story 10's. **L3-5 (d).** Proposed: **defer → Story 10.**

---

## 4. Sweep

Unused exports: a grep of every export in `workflow/`, `cardMetrics.ts`,
`lib/hierarchyPlacement.ts` and `lib/hierarchy.ts` for callers outside its
own file. Coverage: vitest over the pure modules — 92–98% of lines. Its
uncovered lines are DOM-only (`currentTranslate`'s matrix parse, which
L1-8 deletes) or defensive nulls. The production-dead paths it can't see
are unit-covered (L1-5), which is why the reading found them and coverage
didn't.

**SW-1 — `findWorkphaseForItem` is dead end to end.**
`useItemManagement.ts` builds it, `BoardView.tsx` passes it into
`BoardDndDeps`, and nothing calls it. It was retired with
`resolveDropTarget` (4.1 Phase 3). **(a).** Proposed: Phase 0.

**SW-2 — `dragRegions.ts::buildColumnForWorkphaseMap` is test-only.**
Its production caller was `resolveDropTarget` (4.1 Phase 3); the Story 4
audit's #4 moved it without noticing. **(a).** Proposed: Phase 0, with
its test.

**SW-3 — `lib/hierarchyPlacement.ts::tabStates` (+ `TabState`) is
test-only.**
- Its doc says it's "for rendering (the ghost's tab-right/tab-left
  states)". Neither surface renders from it: the board reads its
  projection, the sidebar `computeProjection`.
- It has 5 test uses, and `workflow/CLAUDE.md` names it.
- 4.1's precedent (F7) deleted a test-only production function.
- **(a).** Proposed: delete it, and rewrite its tests over
  `depthRangeFor` + `resolvePlacement`, which production calls. Phase 0.

**SW-4 — `STUB_ROW_HEIGHT_PX` is defined twice.** It's exported from
`cardMetrics.ts`, and `useBoardDnd.ts` redeclares it locally. Phase C
added the local one, and Phase D moved the constant without deleting it.
**(a).** Proposed: Phase 0.

**SW-5 — Seven `data-*` attributes have no reader.**
`data-active-context` and `data-inversion-count` have none anywhere.
Story 10's five (`data-drag-overlay-form`, `data-drag-zoom-candidate`,
`data-drag-zoom-phase`, `data-drag-projection`, `data-placement-valid`)
were written ahead of its E2E. **(d).** Proposed: **defer → Story 10**,
which reads them or deletes them.

**SW-6 — Optional chains on a field that's required since Story 5.**
`session?.pop` appears in `useBoardDnd.ts::machineActive`, `BoardView`'s
five board-root attributes, `BoardColumn.tsx`'s "Drop cards here" guard
(with its false comment, L1-12), and `BandGuides.tsx`. This is Story 5
audit #26's optional-chain half. **(a).** Proposed: Phase 0.

**SW-7 — Exported symbols with no outside caller.** Types and helpers
exported for readability or tests: `isCardRow`/`isStubRow`/`DragRowData`,
`VerticalRect`, `clipToVisible`, `BandRegion`, `isLocked`, `PopHover`,
`PopState`, `regionWorkphaseFor`, `renderedWorkphaseId`,
`byPositionThenCreatedAt`, `HierarchyRow`, `ItemListState`,
`PlacementSlot`, `BoardDndDeps`, `TuningStorage`, `CardListRegionProps`.
**(c).** Proposed: **reject.** Phase 1's splits re-decide each module's
surface anyway.

---

## 5. Carried findings, re-checked

Every structural finding the Story 4 and 5 audits carried is still open
at `c225387`: no `usePendingGhostGuard`, `endSession`,
`resolvePlacementOver`, `placement.ts`, `dragCollision.ts` or
`dragBands.ts` exists.

**C-1 — Split `useBoardDnd.ts`** (Story 4 #18 → Story 5 #19; 575 → 663 →
1,122 lines).
- It now holds:
  - drag start (two branches);
  - structure sampling;
  - the pop loop;
  - the Descendants projection (seeds, `updateDescendantsProjection`,
    `sameProjection`);
  - pointer tracking;
  - the collision session;
  - the overlay modifier (reanchor, clamp, snap tween);
  - placement helpers;
  - the two releases;
  - cancel;
  - the pending-ghost bookkeeping;
  - overlay form and width.
- Seams:
  1. **Overlay geometry** → a pure module with a unit table:
     `reanchorOverlayTransform`, `clampToCurrentContext`, `clampAxis`,
     `overlayWidthFor`. Story 5 #19 put the clamp in `dragRegions.ts`;
     these are overlay concerns, not region ones, so they get their own
     module. It carries L3-3.
  2. **The projection** → one pure function returning `{gap, depth, valid,
     placement}`, carrying L2-1, L2-2, L3-1 and L1-7's board half.
  3. **`resolvePlacementOver`** beside `placementFor`. After L1-5, the
     card-list release is one expression.
  4. **One `endSession()`** for the three teardowns.
  5. **`usePendingGhostGuard`**: `setGhost`, `wantedPlacementRef`, the
     reassert effect, and `restorePriorPlacement`.
- **(a).** Proposed: Phase 2.

**C-2 — `placement.ts` out of `popSession.ts`** (Story 5 #20).
`placementRegion`, `noAnchorSlot`, `placementFor`, `regionWorkphaseFor`,
`PlacementOver` and `overlayFormFor` move, about 190 lines; the machine
keeps about 440. L1-5 shrinks `placementFor`'s Descendants branch first.
**(a).** Proposed: Phase 1.

**C-3 — Split `boardDndUtils.ts`** (Story 5 #21, Story 4 #20 lineage).
- Row-data typing, collision (`resolveBoardCollisions`,
  `CollisionSession`) and anchor naming (`resolveDropSide`,
  `dropAnchorFor`, `travelingRowsFor`) → `dragCollision.ts`.
- `anchorFor`/`isIdentity`/`toRequest`/`sendItemMove` → `dragRequest.ts`,
  retiring the "Utils" name.
- **(a).** Proposed: Phase 1.

**C-4 — `dragBands.ts` out of `dragRegions.ts`** (Story 5 #22).
`reservationFor`, `bandBoundaries`, `bandFor`, `distanceOutside`,
`verticalDistance`, `clipToVisible` and their types move, about 110 lines.
The same move folds `verticalDistance` and its inline horizontal twin in
`distanceOutside` (Story 4 #27). **(c).** Proposed: adopt, Phase 1; it's
cheap and mechanical.

**C-5 — Split `KanbanCard.tsx`** (Story 4 #19, deferred to Story 6's Stub
rewrite; 619 lines).
- Phase B made the Stub tier self-contained: `StubBody` is shared by
  three renders.
- The split:
  - `StubRows.tsx` gets `StubBody`, `AttachGhostRow`, `AttachedChildRow`;
  - `dragChrome.tsx` gets `useLiveDropSide`, `useDropTargetProps`,
    `dropTargetClass`, `DropSideIndicator`, `ZoomCue`,
    `overlayStubIndent` and the cue class constants;
  - `KanbanCard.tsx` keeps the Card tier.
- It carries L3-2, and C-10 lands in it.
- **(a).** Proposed: Phase 1.

**C-6 — Lists derived in more than one place** (Story 4 #22 → Story 5
#24).
- **Descendants half:** the rendered rows and the projection's rows
  (L3-1). `siblingItems` goes with L1-5. **Adopt, Phase 2.**
- **Card-list half:** `useBoardDnd.ts::regionItems`, `BoardColumn`'s
  rendered lists, and `cardListStructureFromKey`'s column facts. The
  facts are the covered workphases and `isTerminal`. Each of the three
  derives them from the column definition and calls the same two
  selectors, so they agree by convention.
  - **Defer → Epic 4.** Epic 4 already plans to reshape exactly these
    lines:
    - its done-column rework may retire `isTerminal`, and the
      `epic4-done-column-rework` note says to defer `isTerminal`
      consolidation until then;
    - `epic-4-decisions.md` §11 (group-by and date buckets) names
      `regionItems` as "the site group-by touches": item selection
      becomes a fact the region carries.

    A shared derivation built now would be designed around the
    workphase-only, `isTerminal` shape both are about to change. Epic 7's
    project-owned boards reshape `Column` again later.
  - *(Corrected 2026-09-24 from "Epic 7": Epic 4 is the nearer
    reshaper.)*

Story 5 audit Watch List items this story touches:

| ID | Story 5 # | State | Proposed |
|---|---|---|---|
| C-7 | #16 — a no-`over` Descendants release re-sends `priorPlacement` | Superseded by Phase D's `releaseDescendants`; L1-5 deletes the path | Adopt: status line only, Phase 0 |
| C-8 | #18 — the transform correction misses a Descendants region inside a Card | Goes away with L1-8 | Adopt with L1-8, Phase 3 |
| C-9 | #23 — region-kind branching | `measureRegions`' `kind === 'card' \|\| kind === 'descendants'` still re-spells `!isCardList` | Adopt, Phase 0 |
| C-10 | #25 — the region-attribute registration idiom ×3 | Unchanged (`KanbanCard` ×2, `BandGuides`) | Adopt: a `dragRegionProps(key)` helper with C-5, Phase 1 |
| C-11 | #26 — two names for one value (`containingCardId` / `originCardId`) | The optional-chain half is SW-6 | Reject the rename: each name reads right from its own module, and renaming three modules for one value isn't worth it |
| C-12 | #28 — the "grandchild dead zone is identity" wording | Superseded: the gap + depth rule replaced sibling-only placement | Adopt: status line only, Phase 0 |

The rest of that list is correctness or test items, not leftovers: Story 5
#14, #15, #17, #27, #29, #30, #31, and Story 4 #12, #15, #16, #17. 6.1
doesn't touch them. The post-6.1 audit's carry-forward table re-checks
them.

---

## 6. Proposed phases (input to the plan's build order)

Deletions first, so the moves carry less. Splits next, so the hook's
extractions land in their final homes. Visible geometry last.

| Phase | Findings | Visible? |
|---|---|---|
| **0 — Delete and correct** | L1-5, SW-1, SW-2, SW-3, SW-4, SW-6, C-9; comments and docs: L1-1 (helpers), L1-2, L1-4, L1-10, L1-11, L1-12; status lines C-7, C-12 | No |
| **1 — Mechanical splits** | C-2, C-3, C-4, C-5 (+ L3-2, C-10) | No |
| **2 — The hook** | C-1 (+ L3-3), L2-1, L2-2, L3-1 (C-6's Descendants half), L1-7's board half | No |
| **3 — Geometry, test-first** | L1-8 (+ C-8), L1-3, L1-13 | Barely: one transition frame and the blue line. Hands-on check |

Deferred: L1-1's specs → Story 10; L2-3 → Story 8; L3-5 and SW-5 → Story
10; C-6's card-list half → Epic 4.

Rejected: L1-9, L1-14, L2-4, L3-4, SW-7, C-11, and L1-7's sidebar half.

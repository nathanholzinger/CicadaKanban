# Code Quality Audit — Epic 3.5 Story 6 + Story 6.1 (2026-09-25)

Scope note: every file touched from `7d3a76e` through HEAD `4c0cb34`
(diff base `39ab65f`, the Story 5 audit fixes) — eleven commits, 60
files, +7439 / −2233. Story 6 is `7d3a76e` (its message says "story 5
phases A B C"; the content is Story 6 Phases A–C), `6b7b00e`, `abc58ad`,
`c225387`, `3fb9849`, `eff2946`: the shared gap + depth library
(`lib/hierarchyPlacement.ts`) and the sidebar's move onto it, the flat
descendants list, the carried Stub, the Option A column anchor, the
named-anchor zoom-in candidate, and the Descendants layer's projection and
release. Story 6.1 is `4875793` (planning) and Phases 0–3 (`f1eae21`,
`014d492`, `97f3f05`, `4c0cb34`): the no-rule-change refactor that split
`boardDndUtils.ts`, `popSession.ts`, `dragRegions.ts` and `KanbanCard.tsx`.

Run as four parallel passes per `.claude/guides/audit-workflow.md`. **The
passes audited the code cold.** They didn't have the 6.1 plan, the
comparison doc, or the prior audits' status lines. The 6.1 disposition
ledger was used only at the merge step: to check its claims, and to route
findings that land on a deferred or rejected row (see "Story 6.1 ledger —
merge step" below).

Fix Now #1, #2 and #3 were re-traced by hand against the code before
inclusion. So were #4's cap formula (both 1-based, same `depth + 1 +
height ≤ cap` as the server), #5's `pastColumnEnd` selector, #6's
`TypePill` comment, and #8's row-height arithmetic. Every 6.1 "Makes dead"
item was checked by grep. Tags: **Fix Now** (#1–11 correctness and
drift, #12–16 structural), **Routed to a story's plan** (#17), **Watch
List** (correctness items only), **Covered by Story N / Epic N**,
**Informational**. Structural findings never go on a Watch List, since
carried structural items don't get done. They also don't wait for an N.1:
an N.1 follows a story only when its implementation revisions are expected
to have left dead or vestigial code, so it isn't a standing home. Test-plan
and wiki edits are routed to their owners (the Test Planner / Reconciler
and the PO), never assigned as developer fixes.

**Overall shape.** Story 6's placement rule is right. `resolvePlacement`
reproduces §7.1's worked example, handles every boundary (gap 0, the last
gap, a single row, an empty section, clamping to the far left or right, a
grandchild origin), and never produces an anchor outside the resolved
parent's scope. So every release request passes `itemHierarchy.ts`'s
resulting-scope check and lands where the indented ghost showed. §7.2's
over-cap state is reachable, marked, and a no-op on release. Cycles are
unreachable by construction. The sidebar's release is sound. Story 6.1 did
what its ledger says: every adopted row checked is done, every "Makes dead"
item is gone, and the import graph is clean. That means no cycles came back
under the new module names, `lib/` never imports `components/`, and
`workflow/` reaches `components/` only through the leaf `cardMetrics.ts`.
The new modules are single-concept, and each has its own test file.

What's left, in order of consequence:
- **The Descendants layer can't be entered on a collapsed Card.** Structure
  is re-read only when a cached element *detaches*, never when one
  *mounts*. That means every Card on a board with `showAttachedChildren`
  off.
- **A Stub released before dnd-kit's first move event lands at the end of
  its level.** A grandchild can be reparented. This is a near-click that
  writes.
- **The in-flight re-drag family, in its fourth audit.** Drag start still
  reads the stored row rather than the rendered one.
- **Duplication the 6.1 splits didn't reach.** The depth-cap rule is fed
  from two snapshots. Region keys are parsed by hand in five places, and
  one E2E helper already aims wrong once Stubs exist. `StubBody`
  re-implements `TypePill`: Story 4 #10's Stub half, tagged "Covered by
  Story 6", fell through both Story 6 and 6.1's ledger.
- **`useBoardDnd.ts` is 1013 lines.** It went 701 → 1122 across Story 6;
  6.1 took 109 lines out.

---

## Fix Now

### 1. A collapsed Card's Descendants layer can never be entered — the structure picks up detached elements, never newly mounted ones `[Correctness & Security]`
**Files:**
- `client/src/components/workflow/useBoardDnd.ts:355–360` (`sampleRegions`: re-resolves only when `hasDetachedElements`), `:478–485` (the hop loop re-resolves synchronously, *before* React renders the new layer)
- `client/src/components/workflow/dragRegions.ts:348–350` (`hasDetachedElements`)
- `client/src/components/KanbanCard.tsx:148–149` (`expanded = manualExpanded || isAttachTarget`), `:228–231` (rows only while expanded), `:318–319` (the `descendants:` element mounts only with rows)
- `client/src/components/BoardView.tsx:359`, `:376` (`defaultExpanded` = the board's `showAttachedChildren`)

**Scenario:**
1. Card Y has Stubs but is collapsed, either by hand or because the board
   has `showAttachedChildren = 0`. So no `descendants:Y` element exists at
   drag start.
2. Drag a Free Card and zoom into `card:Y`. The hop loop re-resolves the
   structure at that instant, still without the section.
3. React then renders Y forced open (`useIsAttachTarget`), and the section
   mounts.
4. Nothing cached detaches. `DragCarveFrame` keeps `children` at index 0
   across the locked→locked switch, so the column's list isn't remounted.
   The dragged row's own `card:` element was never in the structure, since
   it's cycle-forming. So `sampleRegions` never re-reads.
5. `descendants:Y` is never in `structureRef`, `childRegionAt` from
   `card:Y` finds nothing, and resting on the visible section never zooms
   in.
6. Pop out and back in: Y collapses on the way out and the same sequence
   repeats.

§7's zoom-in into a Card's Descendants is therefore unreachable on every
collapsed Card, and on a board with the setting off that is every Card.
Every E2E runs on a default (expanded) board. 6.1's Phase 3 gate item 3
("hold over its Stubs") was checked on an expanded Card.

**Fix:** treat the structure as stale when a region element is *new*, not
only when one is gone. Either option works:
- `resolveDragStructure` records the set (or count) of `[data-drag-region]`
  elements it saw, and `sampleRegions` re-resolves when the live query
  differs.
- A `useLayoutEffect` keyed on `session?.pop.contextKey` re-resolves and
  re-runs `evaluatePop` once after the new layer commits.

Unit-test the staleness predicate the way `hasDetachedElements` already is
(`dragRegions.test.ts`). Add the collapsed-Card variant to Story 10 item
4's DRAG-1.21 E2E. Doing this makes a *childless* Card's ghost-only
section reachable on purpose (Informational #26). Decide with the PO
whether it should be: §1.1 says a childless Card has no Descendants layer.

*Ledger:* 6.1 rejected deleting `hasDetachedElements` (L1-14) because
remounted elements measure empty. This finding doesn't reopen that. It
says the detector is one-sided.

**Status:** Fixed (2026-09-25) — `dragRegions.ts::hasNewRegionElements` is
`hasDetachedElements`' other half: the hook records every region element
seen at each resolve and `sampleRegions` re-resolves when a new one
appears. Reproducing it found a second bug behind the same symptom family:
Board layer's "Move Top" zone shifted a column's cards to a new child slot,
so React remounted every Card on the way into and out of Board layer, and
each hand-set expand/collapse reset to the board default. That is why #1
hid on a board with the setting on: the remount re-opened the Card and
triggered the re-read. Fixed at the source: `BandGuides.tsx::DragCarveFrame`
renders the cards through one keyed slot (`BandGuides.test.tsx`), so a drag
opens only the Card it zooms into and leaves every other Card as it was.
With the PO (#26): a childless Card has no Descendants layer (§1.1).
`KanbanCard.tsx` registers a section as a region only while it holds a real
child; zooming into a childless Card still opens it with the ghost Stub,
and the release attaches. The collapsed-Card E2E variant stays routed to
Story 10 item 4.

### 2. A Stub released before dnd-kit's first `onDragMove` is placed at the end of its level — a jittery click reorders it, and can reparent a grandchild `[Correctness & Security]`
**Files:**
- `client/src/components/workflow/useBoardDnd.ts:698` (`namedAnchorRef` reset at pickup), `:763–767` (the Stub's seed, then `updateDescendantsProjection` at pickup)
- `useBoardDnd.ts:409` (the gap falls back to `projectionRef.current?.gap ?? rows.length` when no anchor is named), `:288–292` (`endSession` clears no projection state), `:868–889` (`releaseDescendants` sends `session.projection.resolved`)

**Why the gap is wrong at pickup:**
- `namedAnchorRef` is only ever set in `handleDragMove`. dnd-kit fires no
  `onDragMove` for the pointermove that *activates* the drag: the sensor's
  activation returns from `handleStart` without `onMove`, and `DndContext`'s
  move effect keys on a translate that is still (0, 0).
- So the pickup projection's gap is the section's last gap, and the depth
  is the Stub's own, clamped into the last gap's range.
- Or the gap is a *previous* drag's gap, because `projectionRef` survives
  across drags. That gap is read against this section's rows.

**Scenarios** (release on the next pointer event after the 5px
activation — a sloppy click):
- Section `[S(0), A(0), B(0)]`, drag S. Gap 3, depth 0 → `{card, after B}`.
  S moves from first to last.
- Section `[A(0), A1(1), B(0), B1(1)]`, drag A1. Rows minus A1 are
  `[A, B, B1]`, gap 3, seed depth 1, range `[0, 2]`, depth 1, which resolves
  to "after B1" under B → `{parentId: B, isAttached: true, anchorId: B1,
  side: 'after'}`. A1 is **reparented from A to B** by a click.
- Leftover gap: if it's larger than `rows.length`, it resolves to `{card,
  'first'}`, and the Stub jumps to the top of the Card's direct children.

**Fix:**
- At Stub pickup, seed the gap at the Stub's own slot: its index in the
  unfiltered `hierarchyRows`, counting only the non-excluded rows above it.
  With its own depth, the pickup projection then resolves to its own slot.
- Clear `projectionRef` / `projectionSeedRef` in `endSession`.
- Null the projection at `:399`'s `if (!seed) return` rather than leaving
  the previous one (Informational #27).

Unit-test the seed as a pure `pickupGapFor(rows, activeId)` (it belongs
beside `gapIndexFor`). After this fix, a no-move release resolves to the
Stub's own slot but still sends a position-only reorder (see Informational
#21). That's harmless; whether to recognize it as identity is a separate
call.

**Status:** Fixed (2026-09-25), with #20 and #27 —
`updateDescendantsProjection` seeds on every entry into a section: the
drag's own section at the dragged row's own gap and depth
(`lib/hierarchyPlacement.ts::ownSlotOf`), any other at its last gap. The
seed carries that gap until a neighbor is named, and `endSession` clears
both projection refs. `ownSlotOf` stands in for the proposed
`pickupGapFor`: it returns the depth too, so the same call serves #20's
re-entry. Its tests check that the slot resolves back to the row's own
placement. A no-move release now lands in the Stub's own slot (a
position-only reorder, or nothing at all for an only child; #21 unchanged).

### 3. Re-dragging an item whose write is still in flight starts from the stored row, not the rendered one — fourth audit for the snapshot, now three symptoms `[Correctness & Security]`
**Files:**
- `client/src/components/workflow/useBoardDnd.ts:705` (`priorPlacement`, read and then not applied), `:727–781` (`isStub(activeItem)` / `containingCardIdOf` read the stored row), `:744`, `:800` (`origin` from the stored row), `:757` (`freshActiveItem` copies the containing Card's stored `workphaseId`)
- `client/src/components/workflow/placement.ts:143`, `:168`, `:175` (`priorPlacement` preferred in any locked region)
- `client/src/components/workflow/dragRequest.ts:93`

**Lineage:** story-3-reconciled #13 → Story 4 #12 → Story 5 (table:
"unchanged") → here. The Stub and ghost faces are Story 5 #14 and #15. None
has a status line.

The root is one fact. When `priorPlacement` exists, the row under the
pointer is drawn where that placement puts it, but `handleDragStart`
derives everything from `deps.items`, which still holds the pre-write row.
Three symptoms:
- **A silent wrong result.** X moves W1 → W2 (pending) and is re-dragged
  before the response. `activeItem.workphaseId` and `origin` say W1. The
  user drops it back in W1 with an anchor. `toRequest` omits `workphaseId`
  (W1 === W1). The server, which already has W2, keeps W2 and only
  repositions. A middle-band or bare-container drop in W1 reads as identity,
  nothing is sent, and the W2 marker is restored.
- **A phantom start context for a Stub whose detach/reparent is in
  flight.** The drag starts locked at `descendants:X` while the row is drawn
  in a column.
  - If X's section is gone, `setGhost(null)` clears the pending marker and
    the item jumps back into X.
  - If it isn't, a release within `popDelayMs` goes through
    `releaseDescendants`. It sends either a re-attach the user never asked
    for (`{parentId: Q, isAttached: true, …}` under a Stub Q of X) or a bare
    anchor that the server 400s.
- **The ghost stays in the old list** while the drag is locked in another
  (`placement.ts:168`). The release is still right, but it breaks §10's
  "the ghost only ever shows what a drop right now would do".

**Fix, at drag start, when `deps.writes.isPending(activeId)`:**
- Overlay `priorPlacement`'s `workphaseId` / `parentId` onto `activeItem`
  and `origin`.
- Decide Stub-ness and the containing Card from `hasParentOpinion(prior)`:
  a string `parentId` means a Stub of that parent; `null` means Free.
- In `placementFor`, prefer `priorPlacement` only when it names the
  region's own list.

The alternative is a recorded PO ruling that the in-flight window is
accepted (wiki §10). **Not a fifth carry.**

**Status:** Fixed (2026-09-25) — `handleDragStart` reads the item as drawn
for its Stub-ness, containing Card (and that Card's own workphase) and
`origin`: `itemListOps.ts::renderedIsStub`/`renderedParentId`/
`renderedWorkphaseId`, the reads the render already used, now exported.
`placement.ts::drawsInList` lets `priorPlacement` stand in for the ghost only
in the list it draws the item in. Every change sits behind a pending
placement, so an ordinary drag takes the old path. Reproduced first with a
probe that held each move request 6 s: the trip back sent no `workphaseId`,
and the server kept the new column. After the fix it sends the old column's
workphase, and a re-picked Stub whose detach is in flight starts in the
column it's drawn in. By hand it needs about 5 s of added latency (a DevTools
custom throttling profile); GPRS's ~0.5 s leaves too short a window.

### 4. The §7.2 depth-cap rule is fed from two derivations and two snapshots — the region gate and the over-cap cue can disagree about the same parent `[Duplication & Abstraction + Correctness & Security]`
**Files:**
- `client/src/components/workflow/dragClassification.ts:71–74`, `:87` (height from one `getDescendantLevels` walk; cap and depths from the drag-start `items`)
- `client/src/components/workflow/useBoardDnd.ts:243–245`, `:716` (`subtreeHeightRef`, a second walk for the same number), `:427–429` (`isWithinDepthCap(getDepth(parent, live items), subtreeHeightRef, board?.itemDepthCap ?? Number.POSITIVE_INFINITY)`)
- `useBoardDnd.ts:330` (the region gate reads `classification.states`)

The formula agrees with the server: both are 1-based, `depth + 1 + height
≤ cap`, with no off-by-one. The inputs don't agree:
- The region gate reads the drag-start snapshot. Validity reads live items
  and a live cap.
- A pending response that re-chains an ancestor mid-drag makes them
  disagree. A region stays reachable while the projection shows invalid, and
  a Card-layer auto-drop then 400s.
- Validity's `?? Infinity` fails open.

Since `classifyDragTargets` already classifies *every* item, including
Stubs, against the same rule, the projection's validity is simply
`classification.states.get(resolvedParentId) === 'valid'`. The cycle-forming
parents it would also reject are unreachable anyway. That is one source and
one snapshot, consistent with DRAG-2.4 ("computed once at drag start").

**Fix:**
- Add an `isValidParent(classification, id)` in `dragClassification.ts`,
  read by both `resolveStructure`'s `isValidCard` and
  `updateDescendantsProjection`.
- Delete `subtreeHeightRef` and the `getSubtreeHeight` import. If a height
  is still needed, expose `subtreeHeight` on `DragClassification`, as 6.1's
  L1-7a did for `subtreeIds`.

One remaining client/server difference: the server skips the cap for a
same-parent move (`itemHierarchy.ts:127`) and the client doesn't. That only
matters for data already over the cap. Note it in the predicate's comment.

### 5. Region keys have one builder and five hand-rolled parsers — and `pastColumnEnd` already aims at the wrong element once a column has Stubs `[Duplication & Abstraction + Correctness & Security]`
**Files:**
- Builders: `client/src/components/workflow/dragRegions.ts:187–205`. Its own comment at `:195–196` says "every region-key format has one owner".
- Parsers:
  - `dragRegions.ts:294–298` (three `startsWith`), `:401`, `:425` (`slice`), `:480` (`split(':')`)
  - `useBoardDnd.ts:376`, `:381`
  - `dragCollision.ts:292` (`travelingRowsFor`)
  - `tests/helpers/dragGesture.ts:211` (`pastColumnEnd`)
  - `client/src/test/dragFixtures.ts:35`, `:39`

`pastColumnEnd` selects `[data-drag-region]:not([data-drag-region^="card:"])`
and then `.last()`. The exclusion was written when `card:` was the only
region nested in a column. Story 5 and 6 nested `descendants:<id>` inside
every Card with Stubs, and in document order that section comes after the
column's own region element. So `.last()` now lands 5px above the bottom of
the last Card's Descendants section, not past the column's end. This is
latent: its three callers (`item-repositioning-cross-column-dnd.spec.ts:144`,
`:197`; `item-repositioning-cross-project-dnd.spec.ts:98`, `:164`) seed no
Stubs. The first spec that does will silently test something else.

**Fix:**
- In `dragRegions.ts`, add `parseRegionKey(key) → {kind, id, workphaseId?} |
  null` and `descendantsCardIdOf(key)`. Use them at `useBoardDnd.ts:375–381`
  and in `travelingRowsFor`.
- Add an exported `CARD_LIST_REGION_SELECTOR` (positive: column + sub-row
  prefixes) for `pastColumnEnd`.
- Optionally, fold `cardStructureFromKey` / `descendantsStructureFromKey`
  (`:392–429`, identical bodies apart from prefix, kind and id-field name)
  into one `cardScopedStructure(kind, …)`.

### 6. `StubBody` re-implements `TypePill` — Story 4 #10's Stub half was "Covered by Story 6" and neither Story 6 nor 6.1's ledger picked it up `[Duplication & Abstraction + Consistency & Drift]`
**Files:**
- `client/src/components/StubRows.tsx:20–22` (`resolveType`), `:30–42` (the pill span)
- `client/src/components/item-detail/TypePill.tsx:14–21`
- `TypePill.tsx:11–13` ("The Stub-tier duplicates (AttachGhostRow, AttachedChildRow in KanbanCard.tsx) are Story 6's to fold in") vs `StubRows.tsx:17–19` ("Still used directly by the Stub-tier rows")

The two are identical: same resolve, same hide-on-unknown rule, same
classes, same label. That rule is deliberately stricter than
`ItemDetailPanel`'s, and a Stub renders inside its Card, beside the Card's
own `TypePill`.

**Fix:** `StubBody` renders `<TypePill item={item} itemTypes={itemTypes} />`
plus its title span. Delete `resolveType` and both stale comments.

*Merge-step note:* the Story 4 audit tagged this "Covered by Story 6". Story
6's rewrite didn't do it, and 6.1's "Inputs already known" listed only the
structural carries, so it never got a ledger row. A Covered-by tag is only
safe if the target story's plan names the item.

### 7. The depth → indent formula is re-spelled at every site — three on the board, two on the sidebar `[Duplication & Abstraction]`
**Files:**
- `client/src/components/StubRows.tsx:59` (ghost, `marginLeft`), `:113` (row, `paddingLeft`)
- `client/src/components/KanbanCard.tsx:65` (`overlayStubIndent`, `marginLeft`)
- All three use `(depth + 1) * DESCENDANTS_INDENT_PX`. `KanbanCard.tsx:51–54` says the overlay indents "on the same geometry as a ghost row… so its pill lines up", and today three matching copies are the only thing holding that.
- Sidebar: `client/src/components/sidebar/SortableProjectRow.tsx:96`, `:102` (`12 + depth * INDENT_WIDTH`, with the literal 12 twice).

Story 8 (`epic-3-5-roadmap.md:482–485`) plans to separate pointer travel per
level from the visual indent. That change has to reach every board site,
or the carried Stub stops lining up with the rows.

**Fix:**
- `cardMetrics.ts::descendantsIndentPx(depth)`.
- `projectTreeUtils.ts::projectRowIndentPx(depth)`, with a named base
  constant.
- Margin vs padding stays per site. `computeProjection`'s `indentPx` stays a
  separate argument.
- Don't share one formula across the two surfaces. Their two 12s are
  unrelated `px-3` coincidences.

### 8. `STUB_ROW_HEIGHT_PX = 26` matches only one of the four rows it claims to describe, and the box classes it depends on are spelled three times `[Duplication & Abstraction + Correctness & Security]` (small)
**Files:**
- `client/src/components/cardMetrics.ts:31–37` (the constant and its derivation comment)
- Readers: `workflow/dragCollision.ts:255` (the lean's ghost centre), `workflow/dragOverlayGeometry.ts:100` (the re-anchor)
- Box classes: `StubRows.tsx:58` (`AttachGhostRow`), `:135` (`AttachedChildRow`'s button), `KanbanCard.tsx:48–49` (`OVERLAY_STUB_CLASS`) — `flex items-center gap-1.5 rounded px-1.5 py-1` ×3
- Hard-coded heights in `workflow/dragCollision.test.ts:252–369`

The comment derives 26 from "one line, `py-1`". But the row holds a type
pill: `text-micro` is 10px with no line-height of its own (`index.css:5`),
so it inherits preflight's 1.5 → 15px, plus `py-0.5`, plus a border = 21px.
That is taller than the 16px `text-xs` title. The resulting heights:

| Row | With a type pill | Without a pill |
|---|---|---|
| Sortable row (no border) | ≈29px | 24px |
| Ghost / overlay (bordered) | ≈31px | 26px |

26 matches only the pill-less ghost. The effect is small: the lean's
modelled centre is off by ≤1.5px, and the re-anchor puts the pointer ≤2.5px
off the copy's centre. But it's a stated fact that's false, on exactly the
rows Story 8 restyles.

**Fix:**
- Measure the rows once (Playwright `boundingBox` in a throwaway script,
  or devtools) rather than trusting the arithmetic.
- Correct the constant and comment. Split it into ghost vs row if they
  differ.
- Add `STUB_ROW_BOX_CLASS` beside it (the file already pairs
  `CARD_LIST_GAP_CLASS` with `CARD_LIST_GAP_PX`).
- Import the constants in `dragCollision.test.ts` instead of `96` / `26`.

### 9. The release tail is written twice — the no-op restore isn't inside the "one contract" `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:878–888` (`releaseDescendants`) and `:975–985` (`handleDragEnd`)

Both sites repeat the same four steps:
1. filter the active id out of the target rows;
2. `toRequest`;
3. `if (!input) { restorePriorPlacement(); return; }`;
4. `sendItemMove(moveItem, …, deps.writes, deps.loadBoard)`.

`dragRequest.ts:137–140` promises every release goes through `toRequest →
sendItemMove` "so the contract can't drift". But the restore-on-no-op half
(reconciliation #22) sits outside it, twice. A path that drops the restore
strands a re-dragged item's marker on that path only.

**Fix:** `commitRelease(session, placement, targetRows)`.

### 10. The pop-machine test preamble was copied into `placement.test.ts` by the C-2 split `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/popSession.test.ts:10–41` and `placement.test.ts:12–48`

The copy covers the three-column A/B/C board, `metrics {96, 8}`, the band
points, the tuning override, OUT/IN, `locked()`, `poppedOut()` and `run()`.
`locked` / `poppedOut` re-spell `startPopSession`, and `popSession.test.ts:45`
asserts that they're equal. Both suites hand-compute band edges from this
setup (y < 96, y > 304, the one-card edge at 52), so an edit to one copy
makes them quietly test different boards. 6.1 Phase 1's gate ("no test
changes except imports and file") forced the copy. Now that the split is
done, fold it.

**Fix:** `client/src/test/popFixtures.ts` (or an extension of
`dragFixtures.ts`): `threeColumnBoard()`, `POP_TEST_TUNING`,
`POP_TEST_METRICS`, `runPop(steps, start?)`, `hoverAt(point, regions?)`.
Use `startPopSession` directly.

### 11. Stale citations and comments — the 6.1 renames, plus Story 5 #5's four leftovers `[Consistency & Drift + File Responsibility]`
**Developer-owned:**

*Stale citations from the 6.1 renames:*
- `tests/ui/item-repositioning-cross-column-dnd.spec.ts:36` — "(`dropAnchorFor`, boardDndUtils.ts)". Written *in this range* (`abc58ad`), after Story 6.1 was already planned. Now `dragCollision.ts`.
- `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md:618` — "`isIdentity`/`toRequest` half is unit-covered in `boardDndUtils.test.ts`" → `dragRequest.test.ts`.
- `docs/planning/epic-4-decisions.md:284` — "`Placement` (`boardDndUtils.ts`)" → `itemListOps.ts`. It sits one line below text this range inserted.
- `client/src/api/items.ts:19` — "Apply it with useItemManagement's applyItemWriteResponse". Every path goes through `itemListOps.ts::completeItemWrite`, which wraps it.

*Status lines:*
- `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md:402–405` — Story 6.1 "…Not yet built." Phases 0–3 are committed, and the plan says "done 2026-09-24".
- `epic-3-5-roadmap.md:341` and `story-6-descendants-placement.md:6–25` — "the PO's sign-off on B+C+D together is what's left". If the sign-off happened (Story 6 is described as wrapped), record it.

*File header:*
- `client/src/components/workflow/itemListOps.ts:1–2` — the header names ordinal placements and the reindex fold-in. It omits the list selectors and Story 6's `hierarchyRows` / `descendantsChildrenOf`, two of the file's four concepts.

*Story 5 audit #5, still open ("still open for a future pass" — no 6.1 ledger row):*
- `client/src/components/DragTuningPanel.tsx:117` — `pop ? popState(pop) : session ? '(stub drag)' : '—'`. `pop` is null exactly when `session` is, so `'(stub drag)'` never renders.
- `client/src/components/workflow/itemListOps.ts:62` — names `pendingPlacementFor`, deleted in Story 4.1.
- `client/src/components/workflow/dragRegions.test.ts:127` — "this is the only place a `kind: 'card'` region is built". `dragFixtures.ts::cardRegion` exists.
- `client/src/components/workflow/useBoardDnd.ts:506` — "Pointer tracking for the life of a Card drag" should say item drag.

*Small:*
- `client/src/components/workflow/CLAUDE.md:175–177` — the board-root attribute list, edited in this range, omits `data-drag-band`, which has a writer (`BoardView.tsx:341`) and a reader (`drag-column-bands.spec.ts:184`).
- `tests/helpers/dragGesture.ts:260` — `NO_POP` "nothing pops, ever". It doesn't neutralize `descendantsPopInDelayMs` or `cardZoomDwellMs`. Harmless, since Card layer is unreachable under it, but the claim is broader than the preset.
- `tests/ui/drag-5-stub-detach.spec.ts:183`, `:195` — bare `TC-10` / `TC-2` in comments. The titles were fixed in Story 5; the comments weren't.

**Route to owner (not a developer edit):**
- **PO (wiki):** `docs/wiki/board-drag-interaction/README.md:1093` — "`popSession.ts::noAnchorSlot`" is now in `placement.ts`. 6.1's "After Phase 3" wiki report named two stale citations (lines 285, 1003) and missed this third.
- **Test Planner / Reconciler:** `boardDndUtils.test.ts` cited as the automation home at:
  - `docs/test-plans/item-attachment/att-7-detach-preserves-parent.md:114`
  - `docs/test-plans/item-positioning/cross-cutting-regression.md:99`
  - `docs/test-plans/item-positioning/part-2-anchor-resolution.md:242`
  - `docs/test-plans/item-positioning/part-3-attached-sibling-reorder.md:64`
  - `docs/test-plans/item-positioning/part-4-merged-column.md:39`, `:57`, `:71`, `:86`
  - `docs/test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md:139`

  The file is now `dragRequest.test.ts` / `dragCollision.test.ts`.

---

## Fix Now — structural (#12–16)

No N.1 is planned after Story 6.1, so Fix Now is the home for these. Do
them after #1–#3, which land in the same code:
- #12's projection hook carries #2's fix and its test;
- #12's `beginDragAt` means #3's drag-start overlay is written once, not
  per branch;
- #14's signature change meets #3's `placementFor` change.

Most of them touch `useBoardDnd.ts` or the Stub rows, which **Story 8**
(feel tuning, cue polish) edits heavily. Done first, they give Story 8
smaller pieces to edit.

### 12. `useBoardDnd.ts` (1013 lines, 13 concepts) — three seams, each already a named concept `[File Responsibility + Duplication & Abstraction]`
**Size history:** 701 at the Story 5 fixes → 1122 after Story 6 → 1013 after
6.1. 6.1's C-1 did exactly what it scoped, Story 5 #19's four extractions:
overlay geometry out, `resolvePlacementOver`, `endSession`,
`usePendingGhostGuard`. These are *new* seams, not a reopen of C-1.

**The seams:**
- **`useDescendantsProjection.ts`** — `updateDescendantsProjection` /
  `sameProjection` (`:362–440`), the seeding in `handleDragStart`
  (`:758–767`), and the resolver in `releaseDescendants` (`:868–889`).
  Fix Now #2 lands in exactly this code: fix it first, then extract with
  the fix's unit test.
- **`usePendingGhostGuard.ts`** — already a standalone function (`:167–196`)
  taking `(sessionRef, deps)`. A pure move.
- **`useSnapTween.ts`** — `startSnap`, `cancelSnap`, `SnapTween`,
  `overlayTranslate`, `snap`, `snapFrame`, `setSnapTick` (`:130–149`,
  `:267–273`, `:296–313`).
- **`handleDragStart`'s two branches** (`:727–781`, `:787–817`) end in the
  same five calls (`resolveStructure → sampleRegions → startPopSession →
  updateDescendantsProjection → beginSession`) → `beginDragAt(startContextKey,
  origin, containingCardId)`.

The rest (refs mirrored for dnd-kit's closures, the clocks, DOM
measurement) is real glue and stays.

### 13. `itemListOps.ts` (440) — write reconciliation is a clean one-way seam `[File Responsibility]`
`:334–441` (`applyItemWriteResponse`, `upsertItem`, `freeItemOrder`,
`findInversion`, `withPlacement`, `completeItemWrite`) only consumes the
file's placement and selector primitives, and is the contract root
`CLAUDE.md` names by path. Moving it to `itemWriteReconciliation.ts` makes
that contract findable (update root `CLAUDE.md`'s pointer with it).

### 14. `placementFor` keeps an 8-argument positional signature — reopens Story 5 #9's declined half `[Duplication & Abstraction]`
`placement.ts:100–109`, adapted only by the hook-private
`placementForSession` (`useBoardDnd.ts:656–679`). `placement.test.ts` makes
about 25 positional calls. `activeWorkphaseId` and `containingCardId` are
both `string | null` and adjacent, so swapping them type-checks. Story 5's
fix declined the subject-object form as "premature ahead of Story 6's
projection shape". Story 6 has landed, so that reason no longer applies.
**Fix:** move `PlacementSubject` into `placement.ts` and make
`placementFor(subject, regions, over = null)` the real signature.

### 15. Board and sidebar walk the tree with different code — and neither walk has a cycle guard `[Duplication & Abstraction]`
**Sites:**
- `lib/hierarchyPlacement.ts:42–57` (`flattenHierarchy`) is the canonical walk.
- `sidebar/projectTreeUtils.ts:44–61` (`flattenTree`) hand-rolls the same parents-before-children DFS, plus collapse and a payload.
- `projectTreeUtils.ts:84–92` (`eligibleRows`) rebuilds a by-parent map and walks again to drop the dragged subtree.
- `workflow/itemListOps.ts:277–287` (`hierarchyRows`) carries its payload through a side-effect map. `:279–284` and `:300–304` spell the same `childrenOf` adapter twice.

Collapse and each surface's child sort are real semantic differences, so
they stay as callbacks. The walk mechanics are accidental. Root
`CLAUDE.md`'s own rule for this library is "never duplicate its walk
inline". `hierarchy.ts`'s walks carry a cycle guard (audit #11) and these
three don't.

**Fix:** `flattenHierarchyOf<T>(rootId, childrenOf): (Row & { item: T })[]`
plus `toRows(rows, exclude)` in the library, with the cycle guard. Don't
hold it for Story 7's three-surface alignment
(`epic-3-5-roadmap.md:424–432`). That depends on whether Story 7 builds
an overflow modal at all, and the duplicated walk already breaks a
`CLAUDE.md` rule.

### 16. Smaller structural fixes `[Duplication & Abstraction + File Responsibility]`

*Derivations that must agree but are computed separately:*
- **Overlay shape derived twice.** `useBoardDnd.ts:601–611` (the modifier)
  and `:997–999` (the render) both run `placementRegion → overlayFormFor →
  overlayWidthFor`. `placement.ts:34–36` and `dragOverlayGeometry.ts:35–40`
  must agree that width is non-null exactly when the form is Stub. →
  `overlayShapeFor(pop, regions)`.
- **`dropAnchorFor` called three ways.** `useBoardDnd.ts:832–833` and
  `dragChrome.tsx:27–29` pass `travelingRowsFor`; the release's `anchorOn`
  (`useBoardDnd.ts:922`) passes nothing. They're equivalent today only
  because a Descendants release returns early. → `namedAnchorFor(active,
  over, session)`.
- **"Which of this Card's layers is locked", answered three times.**
  `DragSessionContext.ts:135–138`, `KanbanCard.tsx:173–178`, `:184–187`. →
  `useCardContextLayer(itemId)`. Story 7's modal would otherwise need three
  edits.

*Rules the types don't enforce:*
- **The dnd-kit `type` discriminator read as raw strings.**
  `useBoardDnd.ts:690`, `:831`, `:893`, `:900`; `dragCollision.ts:112`;
  `dragChrome.tsx:28`; tests `dragCollision.test.ts:59`, `:83`, `:135`,
  `:137`. → `isItemData` / `isColumnData` beside `isCardRow` / `isStubRow`,
  the same argument Story 5 #11 made for `role`.
- **The anchor-relation type declared four times.** `DropAnchor`, the
  inline slot in `PlacementSlot`, the inline in `PlacementOver`, and
  `hierarchyPlacement.ts::Anchor` (`id` rather than `anchorId`). The
  `'before' | 'after'` union is spelled about ten times. → `DropSide` /
  `AnchorRelation` in the dependency-free leaf.

*Repeated render code:*
- **Item-row registration spelled twice.** `KanbanCard.tsx:134–143`,
  `:202–207` and `StubRows.tsx:99–114` each combine `useSortable`,
  `itemRowData`, the CSS transform, `useDropTargetProps`,
  `DropSideIndicator` and `opacity-30` while dragging. → `useItemRow(item,
  role)` in `dragChrome.tsx`.
- **Drop-indicator line classes ×3.** `dragChrome.tsx:55–57` and
  `SortableProjectRow.tsx:95`. → a `DROP_INDICATOR_LINE` constant. Story 8
  restyles "the blue line", and the sidebar's copy wouldn't follow.
- **`ShortCardMetrics` literal ×2.** `useBoardDnd.ts:79` and
  `BandGuides.tsx:167–170`. → export `SHORT_CARD_METRICS` from
  `cardMetrics.ts`.

*File splits:*
- **`dragBands.ts::clipToVisible`** is scroll-viewport clipping, not band
  policy, and it's the one value `dragRegions.ts::measureRegions` imports
  back from the policy module. Move it into `dragRegions.ts`.
- **`ProjectSidebar.tsx` (227 lines)** holds the tree render plus its own
  full drag machine (`:55–163`). → `useProjectDragReorder`.

---

## Routed to a story's plan

### 17. E2E specs still bypass helpers that exist — route to Story 10's plan as an explicit input `[Duplication & Abstraction]`
**`drag-column-bands.spec.ts`** re-rolls what `dragGesture.ts` and
`seed.ts` now provide:
- `popThrough` (`:52`, +300) and `+ 2000` at `:469`, `:477`, `:496`, `:602`
  redo `clocksMargin` / `awaitPoppedOut`.
- `columnKeyOf` (`:121–123`) and `:102–103` redo `columnForWorkphase`.
- `:182` redoes `dragMachine`.

Story 5 #13's fix left it out as "outside the named file list".

**Elsewhere:**
- "A column's drag-region element" is located four ways. Two of them are
  called `regionOf` and mean different things (`drag-column-bands.spec.ts:229`,
  `drag-card-zoom-in.spec.ts:63`). → `boardLocators.ts::dragRegion(scope,
  key?)`.
- `item-repositioning-cross-column-dnd.spec.ts` re-rolls `article` /
  `column` about 30 times, including in the 3.a / 3.b cases this range
  rewrote.
- `drag-5-stub-detach.spec.ts` repeats `itemRow(...).getByRole('button')`
  seven times.
- The two skipped zoom-in cases (`drag-card-zoom-in.spec.ts:72–140`) differ
  only by target column.

This isn't Fix Now because Story 10, which is on the roadmap
unconditionally, re-touches every one of these specs. Doing it now would
mean editing them twice. But Story 10's roadmap entry
(`epic-3-5-roadmap.md:555`) doesn't name this yet. **Route to whoever owns
the roadmap** to add it there. Until it's named, it isn't Covered: #6 is
what happens to an unnamed Covered-by.

---

## Watch List

Correctness items only. #18 and #19 have been carried three or more times
and need a disposition (fix, or a recorded acceptance), not another carry.

### 18. `loadBoard()` during a drag unmounts the `DndContext` and orphans the session — Story 3 #16 → Story 4 #16 → Story 5 table → here `[Correctness & Security]`
**Files:** `client/src/components/BoardView.tsx:110`, `:244–250`; `workflow/dragRequest.ts:154–158`; `workflow/useBoardDnd.ts:184–193`, `:913`

**Trigger:** a failed or needs-resync write from the previous drag lands
during the next drag.

**What follows:**
- `setLoading(true)` swaps the board for "Loading board…". dnd-kit unmounts
  with no `onDragCancel`.
- `session` and the window pointermove listener survive.
- `usePendingGhostGuard`'s reassert effect re-adds the ghost into the
  reloaded `placements`.
- The pop machine keeps moving the ghost with the button released, and
  pointerup / Escape do nothing.
- It ends only when another drag starts, and an orphan ghost can outlive it
  until the next reload.

**Fix (small):** call `handleDragCancel` before the reload when
`sessionRef.current` is set, or don't flip `loading` for a background
resync.

**Status:** Fixed (2026-09-25) — `useBoardDnd.ts::resyncBoard`: every
reload the hook asks for (both `sendItemMove` resyncs and the
column-reorder failure) ends a live drag first, as Escape would. BoardView's
other `loadBoard` callers (workphase edits, a board switch) can't run
mid-drag.

### 19. The pop machine skips layers when the context region is missing, and now also when `popDelayMs = 0` — Story 4 #14 → Story 5 #17 → here `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:239–240`, `:261–264`, `:409–421`

A missing `contextRegion` (clipped out of the scroll box, or unmounted
before the next re-read) leaves only the time term. The target is then
`contextRegion?.parentRegionKey ?? null`, which is Board. That skips Card
and Column, against §1.1 rule 2.

New variant: the panel allows `popDelayMs = 0` (`DragTuningPanel.tsx:41`,
`min: 0`). `transitionTo`'s recursion samples regions scoped to the old
layer (`descendants:X`'s scope has no `card:X`), so it sees the new context
as missing and, with a zero delay, pops straight to Board.

**Fix:** take `parentRegionKey` from `structureRef` (it's structural) or
carry it on the `PopSession`. Or set the panel's `min` for `popDelayMs` to
1.

**Status:** Fixed (2026-09-25), both variants — `advancePopSession` takes a
structural `parentKeyOf` (the hook's, read off `structureRef`) for a
context with no region in the sample. `popOutDue`'s time term needs a clock
an earlier sample started, so a zero `popDelayMs` no longer cascades inside
a transition's own re-evaluation (read against regions scoped to the old
layer); the hook's hop loop re-reads each layer against its own regions.
The panel's `min` is unchanged.

### 20. Re-entering the Stub's own section seeds the depth from the section's last row, not the gap the ghost re-enters at `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:393–397`; `workflow/placement.ts:143`

The reseed always uses the last row's depth. That's right for a *foreign*
zoom-in: its ghost enters at `'last'`, per decision 3. But the origin
Card's section re-renders the ghost at `origin` (`placement.ts:143`).

**Example:** `[A(0), S(0), B(0), B1(1), B1a(2)]`. Pop S out to `card:X` and
back in. The seed is 2, clamped to 1 in S's own gap, and depth 1 there
means "A's first child". Releasing without moving sideways reparents S
under A, driven by an unrelated last row. The indent cue shows it, so it
isn't silent.

**Fix:** for the origin section, reseed at the Stub's own depth, as at
pickup. It's the same seed Fix Now #2 computes, so do them together.

**Status:** Fixed (2026-09-25) with #2 — re-entering the drag's own section
seeds at the Stub's own slot and depth (`ownSlotOf`), measured from the
pointer's x at re-entry.

---

## Covered by Story N / Epic N

- **The zoom-in candidate reads the carried copy while pop-out reads the cursor, so a zoom-in can start a pop-out at once**, bouncing on a still hand (`popSession.ts:245`, `:339–355`; the skip note at `drag-card-zoom-in.spec.ts:43–61`). **And after the Card → Stub form switch, dnd-kit's collision box may lag the drawn Stub** (`useBoardDnd.ts:587–594`; possibly only transient, since dnd-kit's `useDragOverlayMeasuring` re-observes; verify live). → **Story 8**, `epic-3-5-roadmap.md:493–520` ("the triggers disagree"). Ledger L2-3 deferred this with the same reason. *Covered.*
- **The snap tween eases twice per frame during `popSnapMs`** (the modifier runs on both `DndContext` and `DragOverlay`; the clamp and re-anchor themselves are idempotent). Story 4 #15, third audit. → **Story 8**, `epic-3-5-roadmap.md:443–444` ("makes its own parts disagree"). Check it in Story 8's feel pass.
- **The board steps past the dragged subtree in dnd-kit's order (`travelingRowsFor`); the sidebar maps to "after the nearest eligible predecessor" (`resolveGap`).** A semantic difference. → **Story 7**, `epic-3-5-roadmap.md:424–432`. Ledger L1-7b rejected merging for that reason. *Covered.*
- **No hook-level test of the Descendants chain** (`handleDragMove → namedAnchorRef → updateDescendantsProjection → sameProjection → releaseDescendants → toRequest`). The only Descendants-release E2E is a same-parent depth-0 reorder that asserts only that the position changed. → **Story 10** item 4 (`epic-3-5-roadmap.md:635–648`). **Add #1's collapsed-Card variant and #2's release-before-first-move variant to it.** The two skipped zoom-in specs, the quarter helpers and the seven reader-less `data-*` attributes → **Story 10** item 6 (`:655–665`; ledger L1-1b, SW-5). *Covered.*
- **Card-list facts derived in several places** (`Boolean(column.subRows[0]?.workphase.isTerminal)` at `BoardColumn.tsx:62` and `dragRegions.ts:492`; `regionItems`). → **Epic 4**, `epic-4-decisions.md` §11 (ledger C-6b). *Covered.*

---

## Informational

### 21. Every Descendants set-down writes
The resolved anchor is always a real sibling, so `isIdentity` never
matches, and a release in the Stub's own slot sends a position-only
reorder. It's harmless (same parent, same neighbours), and it's the
named-anchor rule's known shape at Column layer too. 6.1's L1-4 corrected
the "writes nothing at every layer" comments for this reason. Recognizing
Descendants identity (resolved anchor = origin's own neighbour) is a small
follow-up if the pending flash on a set-down bothers the PO.

### 22. `sameProjection` ignores `resolved`
`useBoardDnd.ts:436–440` compares gap, depth and valid only. If rows change
mid-drag at the same gap and depth (a pending write landing), the session
keeps the older `resolved`, and the release sends it. Reachable only
through an inversion-type response.

### 23. Two zoom-ins in one sample
With `descendantsPopInDelayMs = 0`, the hop loop (`useBoardDnd.ts:479–485`)
can go column → Card → Descendants in one sample, when the section was
already in the structure. Consistent with the "one layer per transition,
many per sample" reading; noted for the panel's `min`.

### 24. Hypotheses from earlier audits, ruled
- **Stale Stub `workphaseId`** (Story 5 #1): fixed for drag writes, since
  the session copies the containing Card's value. There is still no
  client-side cascade (`itemListOps.ts:342–356` upserts only the written
  row), so non-drag readers keep the stale copy. That's `epic-4-decisions.md`
  §9's open question.
- **`layoutRect`'s transform correction** (Story 5 #18): gone. The one
  remaining mixed-space comparison (`dragCollision.ts:126–130`) diverges only
  while the Card carries a sortable transform, which can't overlap a
  Descendants lock at default clocks.
- **Descendants release with no `over`** (Story 5 #16): no longer applies.
  The release reads only the projection.
- **Bare-container release is a no-op for a Card** (Story 4 #17, the open
  PO question): answered by Story 6's Option A rule, "the drop lands where
  the ghost is". dnd-kit doesn't shuffle when `over` is the container, so
  the ghost stays in its own slot and the no-op matches it.

### 25. Silent returns
`useBoardDnd.ts:693` (`!activeItem`) and `:729` (no containing Card) start
a dnd-kit drag with no session: nothing shown, nothing written, nothing
logged. A `console.warn` on each would make them diagnosable.

### 26. A childless Card's ghost-only section
Today it is reachable only if an unrelated detach happens to force a
re-read. It resolves to `{card, 'first'}`, the same as the auto-drop.
Fix Now #1 makes it reachable deliberately. Decide whether it should be.

**Status:** Decided with the PO (2026-09-25): not reachable. §1.1 stands, and
the section registers as a region only with a real child; see #1.

### 27. `if (!seed) return` leaves the previous projection in place
`useBoardDnd.ts:399` keeps the previous `projectionRef` rather than
nulling it. Folded into Fix Now #2's fix.

**Status:** Fixed (2026-09-25) with #2 — the branch nulls the projection.
It is unreachable now, since every entry into a section seeds.

### 28. Small repeats to fold when nearby code moves
- `dragRequest.test.ts:14`, `:56`, `:79` shadow the imported `freeOrigin`
  / `stubOrigin` with local consts.
- `dragCollision.test.ts:376`, `:381` spell region keys literally.
- `dragRegions.test.ts:326–335` hand-rolls a `CardRegion` that `cardRegion()`
  builds.
- `itemListOps.test.ts:155–160` and `:193–198` build the same tree.
- `popSession.ts:248` and `:441–442` both compute "the hover candidate's
  kind, else `'card'`".
- `dragRequest.ts:64`, `:112` both test `hasParentOpinion(origin) &&
  placement.parentId === origin.parentId` → `sameParentAsOrigin`.
- "Id plus its descendants" is spelled three times (`dragClassification.ts:74`,
  `ProjectSidebar.tsx:75`, `hierarchy.ts:141–142`).
- Production builds origins inline while tests use `freeOrigin` /
  `stubOrigin`. Promote the builders so tests build what production builds.

### 29. File shape, confirmed fine
- **`dragRegions.ts` (545)** covers one noun's whole lifecycle (type, keys,
  structure, measurement, hit test). Splitting it would only scatter shared
  types. Watch its size as Story 7 adds kinds.
- **`popSession.ts` (450)** is purely the transition and timing machine.
  Its growth is Story 6's dwell/cue and the Descendants child regions, at a
  high comment ratio.
- **`dragCollision.ts`, `dragRequest.ts`, `placement.ts`,
  `dragOverlayGeometry.ts`, `StubRows.tsx` and `dragChrome.tsx`** are each
  single-concept.
- **`DragSessionContext.ts` (164)** is still context, types and
  single-expression derivations.
- **`BoardView.tsx` (431)** is a composition root. Two ~10-line
  `localStorage` round-trips could become hooks if it keeps growing.
- **`KanbanCard.tsx` (356)**: the overlay-Stub branch stays here
  deliberately (the `DragOverlay` ResizeObserver binds at first mount).
  Story 8 grows this area.
- **Tests** map 1:1 to modules after the split, with no orphans.

### 30. Do-not-unify pairs, confirmed
- `travelingRowsFor` vs `resolveGap`: semantic, Story 7.
- The board vs sidebar projection seed: decision 3.
- The board's per-row blue line vs the sidebar's gap indicator: different
  mechanisms; only the class string is shared (#16).
- `siblingIdsFromAnchor` vs the release's anchor → slot: different APIs.
- The board's `(d+1)·12` vs the sidebar's `12 + d·14`: coincidental 12s.
- Client `isWithinDepthCap` vs server `assertWithinDepthCap`: a process
  boundary, same documented formula.
- The `CardList` vs Descendants `SortableContext`: different contents.
- `AttachGhostRow` vs `AttachedChildRow` JSX: decision 4; only the box class
  is shared (#8).
- `placementFor`'s Card vs Descendants branches: the Card branch
  deliberately skips `priorPlacement`.
- `clampToCurrentContext`'s `!== 'column'` vs `containmentRect`'s `===
  'column'`: F6, different reasons.
- `popInDelayFor`: a genuine per-kind table.
- `regionItems` vs `BoardColumn`'s render lists: the selectors are
  already shared.

### 31. Positive confirmations `[all passes]`

*Placement and requests:*
- **§7.1 library.** "After the row above" and "before the row below" give
  the same gap, because the rows are the sortable order minus the
  contiguous dragged-subtree block. The range is `[Bottom … Top + 1]`. Top +
  1 → the real first child, found with the subtree excluded (and through a
  collapsed Top on the sidebar). Top's depth → after Top. Shallower → after
  the matching ancestor. Every boundary resolves, and §7.1's worked example
  reproduces exactly.
- **`toRequest` for every placement Story 6 produces:**
  - same-parent reorder → anchor only;
  - reparent-with-anchor → `{parentId, isAttached: true, anchorId, side}`;
  - first child with no siblings → `{parentId, isAttached: true}`;
  - detach → `isAttached: false`;
  - Card append → `{parentId, isAttached: true, after last}`;
  - identity against `origin`.

  Story 5 #3's fix holds: an anchor slot for a different parent is a full
  reparent.
- **Server contract.** Every anchor `resolvePlacement` emits is a child of
  the resolved parent, so it passes `itemHierarchy.ts:148–177`. The pending
  marker lands where the indented ghost showed.

*Machine and gesture:*
- **§7.2.** Over-cap states are reachable (the clamp checks range, not
  validity), marked (`data-placement-valid`, the overlay outline), and a
  no-op on release (`useBoardDnd.ts:871–874`). The cap formula matches the
  server's.
- **Cycles are unreachable.** The subtree is excluded from rows, and
  `dropAnchorFor` never names the active row or a traveling row.
- **Hop loop** (Story 5 #2's fix). Regions are re-scoped after every hop.
  Outside #19 there's no null ghost, no missing clamp and no silent no-write.
- **Projection lifecycle.** Seeded at zoom-in, updated per sample, nulled on
  every pop-out. A release can't read another Card's projection mid-drag;
  #2 is the across-drags leak.
- **`dropAnchorFor`** agrees across the blue line, the zoom-in candidate and
  the release. It names one neighbour at the list's ends and none when
  alone, and a terminal region falls back to `'existing'`. It returns null
  for a bare container (6.1 L1-3).

*Sidebar and failure paths:*
- **Sidebar.** Cycles are unreachable, the anchor is always in the resolved
  parent's scope (re-checked server-side, `projects.ts:216–240`), and a
  collapsed Top resolves to its real first child. Failures log and resync.
- **Failure paths.** `sendItemMove` logs, fails the tracker and resyncs.
  The column-reorder catch logs and reloads. No server code changed;
  `ENABLE_TEST_ROUTES` is still `=== 'true'`.

*Structure and conventions:*
- **Import graph** clean (see "Overall shape").
- **Conventions in sync.** The dnd-kit registration shape
  (`itemRowData` / `columnData`) is spelled identically everywhere. The
  tuning keys agree across `dragTuning.ts`, `DragTuningPanel.tsx`, the
  `dragGesture.ts` presets and wiki §3.1. `MoveItemInput` matches the move
  route. No hand-written `Item` literal appears in any client test. Tailwind
  ordering follows the sorted convention. Both `test.skip` blocks carry a
  reason and a re-enable pointer.

---

## Story 6.1 ledger — merge step

**Claims verified:**
- Every **Makes dead** item is gone:
  - `siblingItems`, `findWorkphaseForItem`, `buildColumnForWorkphaseMap`,
    `tabStates` / `TabState` (only a history note remains in a test),
    `currentTranslate`, `layoutRect`'s `isCard` parameter,
    `expectedActiveRoles`, the "Diagnostic-grade" header;
  - the Descendants `over → anchor` path in `placementFor`,
    `releaseListFor`'s Descendants branch, `verticalDistance`;
  - the local `STUB_ROW_HEIGHT_PX` (one definition left);
  - the hook's `flattenHierarchy` builds (one `hierarchyRows` walk);
  - the three-site region-attribute idiom (`dragRegionProps` at all three);
  - every optional chain treating `pop` as optional;
  - `boardDndUtils.ts` itself (its name survives only in "moved out of"
    history notes, plus #11's stale citations).
- Adopted rows spot-checked done: L1-1a, L1-2, L1-3, L1-4, L1-8, L1-10,
  L1-11, L1-12, L1-13, L2-1, L2-2, L3-1 / C-6a, L3-2, L3-3, L1-7a, SW-1 – 4,
  SW-6, and C-1 – C-5, C-9, C-10.
- **One claim incomplete.** The "After Phase 3" wiki report found two stale
  wiki citations; there is a third (`README.md:1093`, #11).

**Collisions routed:**

| Finding | Ledger row | Outcome |
|---|---|---|
| Zoom-in / pop-out reference points; collision-box lag | L2-3 (deferred → Story 8) | Covered, same reason |
| `travelingRowsFor` vs `resolveGap` | L1-7b (rejected, Story 7 revisits) | Covered, same reason |
| Card-list facts ×N | C-6b (deferred → Epic 4) | Covered, same reason |
| Reader-less `data-*`; quarter helpers; skips | SW-5, L1-1b, L3-5 (deferred → Story 10) | Covered, same reason |
| #1's structure staleness | L1-14 (rejected deletion of `hasDetachedElements`) | Not reopened. #1 extends the detector; the rejection stands |
| `containingCardId` / `originCardId` | C-11 (rejected) | Not re-raised. The drift pass found no public alias |
| #12 further hook seams | C-1 (adopted, done as scoped) | New finding, not a reopen |
| #14 subject-object `placementFor` | none (Story 5 #9's declined half) | Reopened: the stated reason, "premature ahead of Story 6's projection shape", is gone |

**Fell through the ledger.** These were carried into 6.1's window but got
no row:
- Story 4 #10's Stub half (tagged "Covered by Story 6") → Fix Now #6.
- Story 5 #5's open stale comments → Fix Now #11.
- Story 5 #14, #15, #17 → Fix Now #3 and Watch #19. These are correctness,
  not structural, so 6.1 wasn't obliged to take them; they simply carried
  again.

Lesson for any story plan that inherits audit items (an N.1, when a story
warrants one, or a story named in a Covered-by tag): its inputs should
sweep every open item in the prior audits (no status line, or a Covered-by
pointing at that story), not only the structural carries.

---

## Prior audits — status at `4c0cb34`

| Audit | # | Finding | Status |
|---|---|---|---|
| Story 4 | 12 | Stale `activeItem` snapshot at release | **Still open, fourth audit** → Story 6 audit **#3** (Fix Now) |
| Story 4 | 15 | F8 snap tween eases twice | Unchanged → **Covered by Story 8** |
| Story 4 | 16 | `loadBoard` unmounts `DndContext` mid-drag | Unchanged → Story 6 audit **#18** (needs a disposition) |
| Story 4 | 17 | Bare-container release is a no-op (PO question) | **Answered** by Story 6's Option A rule |
| Story 5 | 5 | Stale-comment batch, remainder | Four lines still stale → Story 6 audit **#11** |
| Story 5 | 14 | `priorPlacement` wins in any locked region | Still open → Story 6 audit **#3** |
| Story 5 | 15 | Re-drag of an in-flight Stub starts from stale data | Still open → Story 6 audit **#3** |
| Story 5 | 17 | Clipped context pops to Board (three-layer skip) | Still open, new `popDelayMs = 0` variant → Story 6 audit **#19** |

Status lines have been added in place in both audit docs.

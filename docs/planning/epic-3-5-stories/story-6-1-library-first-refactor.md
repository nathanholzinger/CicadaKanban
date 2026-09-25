# Story 6.1 — Drag-layer refactor against stock dnd-kit (vestige removal after Story 6)

Implementation plan for Epic 3.5 Story 6.1. No rule changes: the wiki is
the spec, and this story makes the code look as if the rules on the page
had been there from the start. Same purpose as
[Story 4.1](story-4-1-efficiency-refactor.md), different method (below).
Becomes a historical record once done.

**Status: method agreed with the Product Owner 2026-09-24. Comparison
done and every disposition ratified by the PO 2026-09-24 (the ledger
below); the build order is ready. Phase 0 done 2026-09-24 (below); Phase
1 done 2026-09-24 (below); Phase 2 done 2026-09-24 (below); Phase 3
remains.** The deliberation is in
[`story-6-1-comparison.md`](story-6-1-comparison.md); this file holds the
outcomes.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 6.1
- Prior story: [`story-6-descendants-placement.md`](story-6-descendants-placement.md)
- Model: [`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md)
  (the plan) · [`story-4-1-comparison.md`](story-4-1-comparison.md) (its
  working document)
- Rules: the wiki as Story 6's Phase E leaves it —
  [`board-drag-interaction/`](../../wiki/board-drag-interaction/README.md),
  [`item-attachment/`](../../wiki/item-attachment/README.md),
  [`item-positioning/`](../../wiki/item-positioning/README.md)
- Depends on: Story 6. **Unblocks:** Stories 7–10 (lens 3 is aimed at them).

---

## Sequence

1. Story 6 finishes (Phase D, then Phase E's status report).
2. Story 6.1 — this.
3. The four-pass code-quality audit (`.claude/guides/audit-workflow.md`)
   over Stories 6 and 6.1 together, one report — as the Story 4 audit
   covered 4 and 4.1. It reviews the code cold and uses this plan's ledger
   only at the merge step (see "The ledger, and what the audit gets").
4. At epic close, the epic-wide four-pass audit.

---

## Why this story exists

Story 6 was built hands-on, and several rules changed along the way. One
of them reversed the drag layer's direction. Stories 3–4 kept adding our
own geometry (regions, bands, hit boxes). Option A (2026-09-24) handed the
column slot back to dnd-kit, and hands-on finding 3 then did the same for
the zoom-in candidate. The PO prefers library defaults over custom code
wherever the rules allow. Code written for the earlier direction is still
there, and some of it now decides things dnd-kit also decides.

## How it differs from Story 4.1, and why

Story 4.1 drafted a clean design from the settled rules first, then
compared the code with it. This story doesn't draft one:

- **The rule changes are written down.** 4.1 needed a draft because the
  rules had changed many times hands-on and nobody had a list. Story 6
  dates each change in its plan, so there's a list to trace from (lens 1).
- **A from-scratch design ignores the library.** 4.1's draft was naive in
  exactly one place: it dropped dnd-kit's sortable
  (`story-4-1-comparison.md` B1). With the direction now library-first,
  that risk is bigger. So the baseline is stock dnd-kit (lens 2).
- **Findings become phases, not a list.** The file splits flagged in the
  last two audits (see "Inputs already known") stayed on Watch Lists and
  never happened. 4.1's findings happened because they were a story with
  phases and gates. Same here.

What carries over from 4.1: the buckets (plus a fourth), phases that each
end green on every suite, no behavior change without a PO ruling first,
and hands-on checks only where a phase touches something visible. What's
new is a per-finding ledger and per-phase "makes dead" lists, so the
audit afterwards can verify outcomes instead of re-deriving them.

---

## Method — three lenses, one comparison document

The findings go in `story-6-1-comparison.md` (the counterpart of 4.1's),
then get condensed into a build order in this file.

### Lens 1 — Rule-change trace

For each rule Story 6 changed, find every code site, test, test helper and
comment that still follows the old rule. Seeds below; add a row for
anything Phase D's hands-on changes.

| Date | Change | Recorded in | Old-rule footprint to look for |
|---|---|---|---|
| 2026-09-23 | The carried copy is a Stub from the Card layer down (Story 5 decision 6 reopened) | Story 6 Phase C; `story-5-stub-detach.md` decision 6 | Anything still assuming the Card form below Column layer |
| 2026-09-24 | Option A + lean: the drop lands where the ghost is. dnd-kit's shuffle picks the slot, the dragged card's own row is a collision candidate, and `dropAnchorFor` names the anchor | Story 6 hands-on finding 2; decision 2's amendment | `resolveDropSide`'s remaining callers; collision filters still dropping the active row; comments describing "over's rect decides the side"; the E2E quarter helpers (`topQuarter`) and specs skipped for "drag-gesture precision" (e.g. `item-repositioning-cross-project-dnd.spec.ts` 1.a/2.a/2.b/4.b), which may be reachable now. Report these; un-skipping is Story 10's job |
| 2026-09-24 | The release always sends the named anchor, even in the item's own slot. This narrows 4.1 decision 2 ("identity writes nothing") at Column layer | Story 6 hands-on finding 2 | `isIdentity`'s paths at Column layer; tests asserting "nothing written" for a same-slot set-down there; comments quoting decision 2 unqualified |
| 2026-09-24 | The Descendants gap is the ghost's neighbors in dnd-kit's order | Story 6 decision 2's amendment; Phase D | Any gap derived another way once D lands |
| 2026-09-24 | The zoom-in candidate is the card the blue line names, held through a dwell + cue | Story 6 hands-on finding 3 | The geometry that used to pick the candidate: Card hit-testing in layout space (`dragRegions.ts::layoutRect`, `currentTranslate`, `childRegionAt` for `card`), the detached-element re-resolve (`hasDetachedElements` in `useBoardDnd.ts`), E2E `boxOf`'s transform correction, and 4.1's kept item (b)4 ("Card candidate hit-testing in layout space is the tuned feel"), which this change overturns. Some of it may still serve a Card context's own bounds (the inside test, the clamp): sort each piece, don't assume |

### Lens 2 — "Who decides" table, with stock dnd-kit as the baseline

One row per question the drag gesture answers. For each row the comparison
fills in:
- the one module that should own the answer;
- every other site that also computes it;
- what stock dnd-kit already provides;
- where the answer is custom, the wiki rule that makes it so.

A second site computing the same answer is a finding; 4.1's "request
resolved twice" came from this lens. Custom machinery with no rule behind
it is a finding too.

The baseline column, filled in now:

| Question | What stock dnd-kit provides |
|---|---|
| Which layer is the drag in? | Nothing. Custom (wiki §1.1) |
| Which region is the zoom-in candidate? | `over`, from collision detection |
| Which slot does the ghost sit in? | The sortable strategy's shuffle |
| Which neighbor names the slot (anchor + side)? | `over.data.current.sortable` (`index`, `items`) + `arrayMove` |
| Which depth, at Descendants layer? | Nothing. Custom (§7.1), shared with the sidebar |
| Which Board-layer band (top/middle/bottom)? | Nothing. Custom (§5) |
| Where is each droppable? | Droppable measuring, transform-agnostic by default. Compare with `layoutRect`, which also backs out the sortable transform |
| Where may the carried copy go? | Modifiers, on `DndContext` and `DragOverlay` |
| What does the carried copy look like? | `DragOverlay` renders whatever it's given |
| What does the blue line show? | Nothing. It reads the anchor |
| Which items are valid targets? | Nothing. Classification (§3.2) |
| What gets written? Is it a no-op? | Nothing. `toRequest` / `isIdentity` |
| When does a clock fire (pop-in, pop-out, dwell)? | Nothing. Custom (§3.1) |
| Which element scrolls? | `getScrollableAncestors`. Kept apart on purpose (Story 4 audit #29, the `overflow-x-auto` quirk); re-check |
| Which point does each trigger read: the cursor, the carried copy, or the ghost? | Both kinds exist in dnd-kit: `closestCorners` reads the copy's collision box, `pointerWithin` reads the cursor. Record per trigger which one it reads; the split is behind the jumps at a layer change (roadmap § Story 8, added 2026-09-24) |

### Lens 3 — Dry run of the next stories

For each of Stories 7–10, list the edits it would need against the code as
Story 6 leaves it:
- Story 7: depth cap and overflow.
- Story 8: the zoom-in morph, the half-hidden blue line, and the target
  shifting at zoom-in.
- Story 9: Free-item reparent.
- Story 10: the E2E helpers and the skipped specs.

If a change needs edits in many places, it's missing a shared home; fix
that here. Anything a later story will rewrite anyway goes in bucket (d)
instead.

Plus a mechanical sweep, since none of the lenses aims at code nothing
reaches:
- unused exports;
- branches under `client/src/components/workflow/` that no test reaches
  (the coverage report).

---

## Buckets and dispositions

Every difference goes in exactly one bucket (what kind of difference it
is), and gets one disposition (what we decided to do about it):

- **(a) Leftover.** It follows a rule that changed, or it wraps an earlier
  shape instead of reshaping it. Remove or reshape.
- **(b) Custom for a reason.** A wiki rule needs it, or dnd-kit can't do
  it. Keep it; the comparison names the reason.
- **(c) Same rule, different shape.** A judgment call. List it, and act
  only if it's cheap.
- **(d) A later story absorbs it.** One of Stories 7–10 will rewrite it.
  Record it in that story's roadmap entry and don't refactor it twice.

The dispositions, and how the buckets usually map to them:

| Disposition | Usual bucket | Must state |
|---|---|---|
| **Adopted → Phase N** | (a), or a cheap (c) | Which phase does it |
| **Deferred → Story N** | (d) | Which story, and that its roadmap entry names it |
| **Rejected** | (b), or a (c) not worth it | The reason: the wiki rule, the dnd-kit limit, or why the change isn't worth its cost |

---

## The ledger, and what the audit gets

*(Requested by the Auditor, agreed with the PO 2026-09-24.)*

**The ledger.** This plan carries one table with a row per finding: every
lens-1/2/3 finding, every sweep hit, and every carried finding below.
Each row has:
- an ID (`L1-n`, `L2-n`, `L3-n`, `SW-n`, `C-n`);
- the finding, in one line;
- its bucket and disposition;
- the reason, for anything deferred or rejected.

It records outcomes. The deliberation behind them stays in
`story-6-1-comparison.md`.

**What each phase makes dead.** Each phase in the build order lists, under
**Makes dead**, everything its new shape leaves with no job: functions,
types, branches, fields, data attributes, test cases and helpers, and
comment passages. Each is deleted in that same phase. Only the plan's
author can make this claim, since "dead" means "nothing in the new shape
needs it". It's also what makes the claim checkable afterwards.

**What the audit gets.**
- **The four passes review the code cold.** They get neither this plan
  nor the comparison doc. The Auditor doesn't pre-review the plan either:
  shaping it and then auditing the result would mix the two roles.
- **The merge step uses the ledger** (the orchestrating session, per the
  audit workflow). Two uses:
  1. **Verify claims.** Every adopted row is done, and every **Makes
     dead** item is gone.
  2. **Route collisions.** A finding that lands on a deferred or rejected
     row is marked *covered* if it repeats the reason already weighed. It
     *reopens* the row if it brings a reason or evidence the ledger
     didn't weigh, such as a rejected item turning out to cause a bug.
     "Don't re-deliberate" means not re-arguing on the same grounds; it
     never bars new evidence.

---

## Inputs already known — carried structural findings

None of these were done as of 2026-09-24: none of the named functions or
files exist yet. Re-check each at the start, since Story 6 may have done
some. Each gets a ledger row (`C-n`). Adopting it is the default. A deferral
or rejection needs a reason in the ledger, never another Watch List entry.

- **Split `useBoardDnd.ts`** (Story 4 audit #18 → Story 5 audit #19):
  - move the clamp math to `dragRegions.ts`, with a unit table;
  - put `resolvePlacementOver` beside `placementFor`;
  - fold the three teardowns into one `endSession()`;
  - extract the pending-ghost guard.

  The file was 575 lines at the Story 4 audit, 663 at Story 5's, and 920
  in the working tree on 2026-09-24.
- **Move `placement.ts` out of `popSession.ts`** (Story 5 audit #20): the
  transition machine and the placement rules are two separate halves.
- **Move `dragCollision.ts` out of `boardDndUtils.ts`** (Story 5 audit #21,
  Story 4 #20 lineage). `dropAnchorFor`, new in Story 6, belongs in the
  collision half.
- **Move `dragBands.ts` out of `dragRegions.ts`** (Story 5 audit #22): the
  band, reservation and clip math.
- **Split `KanbanCard.tsx` into its Card tier and Stub tier** (Story 4
  audit #19, deferred to Story 6's rewrite of the Stub rows). Check
  whether Phase B made the split natural.
- **Column facts derived in four places** (Story 4 #22 → Story 5 #24,
  "leave until Story 6's all-rows change"). That change has now landed.

---

## Ledger (ratified 2026-09-24)

One row per finding in [`story-6-1-comparison.md`](story-6-1-comparison.md),
where each is argued. ✱ marks findings about code authored in this
session. Phase numbers refer to the build order below.

| ID | Finding | Bucket | Disposition | Reason |
|---|---|---|---|---|
| L1-1a | E2E quarter helpers and spec comments describe the retired which-half rule | (a) | Adopted → Phase 0 | |
| L1-1b | Specs aimed with the quarter helpers; the six skips from the old rule | (d) | Deferred → Story 10 | Precise-move E2E is Story 10's (roadmap items 3 and 6) |
| L1-2 | `PlacementOver`'s doc and the hook header describe the pre-lean rule | (a) | Adopted → Phase 0 | |
| L1-3 | `dropAnchorFor` names a column container as an anchor | (c) | Adopted → Phase 3 | |
| L1-4 | "Identity writes nothing, at every layer" overstates since the named-anchor rule | (a) | Adopted → Phase 0 | |
| L1-5 | Story 5's interim Descendants release is unreachable but still there | (a) | Adopted → Phase 0 | |
| L1-6 ✱ | The Descendants collision excluded the dragged row | (a) | Adopted → Story 6 | Fixed in Phase D's hands-on finding, 2026-09-24 |
| L1-7a ✱ | "The dragged subtree" derived twice on the board | (c) | Adopted → Phase 2 | |
| L1-7b | The sidebar's `resolveGap` has its own excluded-row rule | (c) | Rejected | Different by design: decision 2's amendment keeps the sidebar on `over` + `resolveDropSide` with no ghost shuffle. Story 7 may revisit it if it aligns hierarchy dragging across the sidebar, the Descendants section and an overflow modal (roadmap § Story 7) |
| L1-8 | Card regions keep layout-space geometry for a retired hit test | (a) | Adopted → Phase 3 | Approved on the condition of a PO eyeball check (Phase 3 gate, items 1–3) |
| L1-9 | Column scope measures every Valid Card's rect every sample | (c) | Rejected | The clip is what makes "scrolled out of view → no candidate" work; L1-8 removes the costly part |
| L1-10 | Docs still describe the hit-test zoom-in candidate | (a) | Adopted → Phase 0 | |
| L1-11 | ~17 comments call Story 3's carve-out addendum "Story 8" | (a) | Adopted → Phase 0 | |
| L1-12 | Module headers and docs lag the current layers and paths | (a) | Adopted → Phase 0 | |
| L1-13 | The blue line filters on the dragged row's `role`; the anchor doesn't | (a) | Adopted → Phase 3 | Approved on the condition of a PO eyeball check (Phase 3 gate, items 4–5) |
| L1-14 ✱ | `hasDetachedElements` | (b) | Rejected (deletion) | The candidate lookup and the Card context read measured regions, and a remounted element measures empty |
| L2-1 | The depth formula is spelled in the hook and in the sidebar | (a) | Adopted → Phase 2 | |
| L2-2 | The Descendants placement is resolved every sample and again at release | (a) | Adopted → Phase 2 | |
| L2-3 | Triggers read two points: the cursor and the clamped copy | — | Deferred → Story 8 | Picking one reference point is a feel decision (roadmap § Story 8, "things jump at a layer change") |
| L2-4 | `resolveDropSide` has no sidebar-neutral home | (c) | Rejected | One pure function; a new shared module isn't worth it. It still moves to `dragCollision.ts` with C-3 |
| L3-1 | The section's rows are derived separately for render and for the projection | (a) | Adopted → Phase 2 | Same finding as C-6a |
| L3-2 | Nearly every drag cue lives in the 619-line `KanbanCard.tsx` | (a) | Adopted → Phase 1 | Lands with C-5 |
| L3-3 | The overlay math Story 8 will edit is inline in the hook | (a) | Adopted → Phase 2 | Lands with C-1 |
| L3-4 | Pre-work for Story 9 | (c) | Rejected | Small, and Story 9 may decide the gesture shouldn't exist |
| L3-5 | Story 10's test-side items | (d) | Deferred → Story 10 | Already its scope |
| SW-1 | `findWorkphaseForItem` is dead end to end | (a) | Adopted → Phase 0 | |
| SW-2 | `buildColumnForWorkphaseMap` is test-only | (a) | Adopted → Phase 0 | |
| SW-3 | `tabStates` (+ `TabState`) is test-only | (a) | Adopted → Phase 0 | |
| SW-4 | `STUB_ROW_HEIGHT_PX` is defined twice | (a) | Adopted → Phase 0 | |
| SW-5 | Seven `data-*` attributes have no reader | (d) | Deferred → Story 10 | It reads them or deletes them (roadmap item 6) |
| SW-6 | `session?.pop` optional chains on a required field | (a) | Adopted → Phase 0 | |
| SW-7 | Exported symbols with no outside caller | (c) | Rejected | Phase 1's splits re-decide each module's surface |
| C-1 | Split `useBoardDnd.ts` | (a) | Adopted → Phase 2 | |
| C-2 | `placement.ts` out of `popSession.ts` | (a) | Adopted → Phase 1 | |
| C-3 | Split `boardDndUtils.ts` into `dragCollision.ts` and `dragRequest.ts` | (a) | Adopted → Phase 1 | |
| C-4 | `dragBands.ts` out of `dragRegions.ts` | (c) | Adopted → Phase 1 | |
| C-5 | Split `KanbanCard.tsx` into the Card tier, the Stub tier and the drag chrome | (a) | Adopted → Phase 1 | |
| C-6a | Descendants rows derived separately (= L3-1) | (a) | Adopted → Phase 2 | |
| C-6b | Card-list facts derived in three places | (d) | Deferred → Epic 4 | Epic 4's done-column rework may retire `isTerminal`, and `epic-4-decisions.md` §11 already names `regionItems` as the site group-by reshapes |
| C-7 | Story 5 audit #16 | — | Adopted → Phase 0 | Status line only: superseded by `releaseDescendants`; L1-5 deletes the path |
| C-8 | Story 5 audit #18 | (a) | Adopted → Phase 3 | Goes away with L1-8 |
| C-9 | Story 5 audit #23: a re-spelled `!isCardList` in `measureRegions` | (a) | Adopted → Phase 0 | |
| C-10 | Story 5 audit #25: the region-attribute registration idiom ×3 | (a) | Adopted → Phase 1 | Lands with C-5 |
| C-11 | Story 5 audit #26's naming half (`containingCardId` / `originCardId`) | (c) | Rejected | A Watch List item with no priority then or now. Reopen if a future audit re-raises or elevates it |
| C-12 | Story 5 audit #28 | — | Adopted → Phase 0 | Status line only: superseded by the gap + depth rule |

---

## Build order

Deletions first, so later moves carry less. Splits next, so the hook's
extractions land in their final homes. The one visible phase last. Every
phase ends green on the unit suites, `tsc` (root and client), eslint,
prettier and the full Playwright suite, with `workflow/CLAUDE.md` updated
in the same phase. When a phase resolves a Story 4 or 5 audit finding, it
adds that finding's status line to the audit doc.

### Phase 0 — Delete and correct (no behavior change)

L1-1a, L1-2, L1-4, L1-5, L1-10, L1-11, L1-12, SW-1–4, SW-6, C-7, C-9,
C-12.

**Makes dead:**
- **`useBoardDnd.ts`:**
  - `siblingItems`;
  - `releaseListFor`'s `descendants` branch (its `containerId` becomes a
    plain `string`);
  - the `list.containerId === null` branch of `handleDragEnd`'s
    `placementOver`;
  - the local `STUB_ROW_HEIGHT_PX` (import `cardMetrics.ts`'s);
  - `BoardDndDeps.findWorkphaseForItem`.
- **`popSession.ts::placementFor`:** the Descendants `over` → anchor
  path. The branch keeps its `over === null` answers: same section →
  `priorPlacement ?? origin`; a foreign item → `{ parentId: cardId, slot:
  'last' }`.
- **The rest of `findWorkphaseForItem`:** its definition and export in
  `useItemManagement.ts`, and `BoardView.tsx`'s destructure and
  pass-through.
- **Test-only production functions:**
  `dragRegions.ts::buildColumnForWorkphaseMap`, and
  `lib/hierarchyPlacement.ts::tabStates` + `TabState`.
- **Redundancies:**
  - every optional chain that treats `pop` itself as optional
    (`session?.pop?.…`, `session?.pop != null`, `!session?.pop`), in
    `useBoardDnd.ts`, `BoardView.tsx`, `BoardColumn.tsx` and
    `BandGuides.tsx`. `BoardColumn.tsx`'s guard becomes `!session`;
  - `measureRegions`' re-spelled `!isCardList`.
- **Tests:**
  - `popSession.test.ts`'s cases for the Descendants `over` path;
  - `boardDndUtils.test.ts`'s `buildColumnForWorkphaseMap` describe.
  - *Rewritten, not deleted:* `hierarchyPlacement.test.ts`'s `tabStates`
    uses, now over `depthRangeFor` + `resolvePlacement`.
- **Comment passages** named in L1-1a, L1-2, L1-4, L1-5, L1-10, L1-11
  and L1-12, including `workflow/CLAUDE.md`'s `tabStates` mention and its
  "(Story 5's interim ordering)".

**Done 2026-09-24.** Every item above landed. SW-6 landed late, with Phase
2's commit: it missed three guards in `useBoardDnd.ts` that treat `pop` as
optional (`!current?.pop` in the reassert effect and in `evaluatePop`, and
`collisionDetection`'s `pop && current`). C-9 landed late too, with Phase
1's commit: `measureRegions`' `facts` has no live rects yet, so it isn't a
`DragRegion` and couldn't be passed to `isCardList(region: DragRegion)`.
`isCardList` now takes anything with a `kind`
(`<T extends Pick<DragRegion, 'kind'>>`, narrowing to
`Extract<T, { kind: CardListRegion['kind'] }>`), so `!isCardList(facts)`
type-checks with no cast. Existing callers are unchanged. The rename sweep for
L1-11 also went a little wider than the ledger's "about 15": three more
mislabeled "Story 8" mentions turned up in files the comparison doc didn't
list (`item-repositioning-cross-column-dnd.spec.ts` ×2,
`drag-target-classification.spec.ts` ×1) — same category, same fix,
folded in rather than left half-done. Full suites green throughout: `tsc`
(root + client), eslint, prettier, both unit suites (317 server + 301
client), and the full Playwright suite (140 passed, 8 skipped, matching
the pre-existing baseline) against the already-running test servers
(port 3002/5174, `test.db`, `ENABLE_TEST_ROUTES=true` — never `kanban.db`).
No wiki passage named a symbol this phase deleted or moved.

### Phase 1 — Mechanical splits (no behavior change) — done 2026-09-24

**Done 2026-09-24.** Every new module landed as listed, with two small
deviations, both mechanical:
- `react-refresh/only-export-components` flags every non-component
  export in a `.tsx` file that also exports a component: Fast Refresh then
  reloads the file in full instead of hot-swapping it. `dragChrome.tsx`
  first had three flagged exports; two were exported more widely than they
  needed to be:
  - `useLiveDropSide` had no importer outside the file, so it's no longer
    exported;
  - `overlayStubIndent` has one user, `KanbanCard.tsx`'s overlay branch, so
    it isn't chrome a Card and a Stub share, and it moved there,
    unexported. The module list below had it wrong.

  The one left, `useDropTargetProps`, is shared by both tiers and belongs
  next to `DropSideIndicator`, which draws what it returns. It carries a
  one-line suppression with its reason; splitting the file for a
  dev-convenience rule wasn't worth breaking that grouping.
- `boardDndUtils.test.ts`'s `subrowContainerId` describe block tested a
  `dragRegions.ts` export (misplaced in the older file, historically) —
  moved to `dragRegions.test.ts`, the file that actually owns the function
  under test, rather than orphaned in either `dragCollision.test.ts` or
  `dragRequest.test.ts`.

Full suites green throughout: `tsc` (root + client), eslint, prettier, both
unit suites (317 server + 301 client, same counts as Phase 0 — no test
gained or lost by the split), and the full Playwright suite (140 passed, 8
skipped, matching the baseline) against the already-running test servers
(port 3002/5174, `test.db`, `ENABLE_TEST_ROUTES=true` — never `kanban.db`).
`workflow/CLAUDE.md`'s module map is rewritten for the new files.

C-2, C-3, C-4, C-5 (with L3-2 and C-10).

New modules:
- `workflow/placement.ts`: `placementRegion`, `noAnchorSlot`,
  `placementFor`, `regionWorkphaseFor`, `PlacementOver`,
  `overlayFormFor`.
- `workflow/dragCollision.ts`: row-data typing, `resolveBoardCollisions`
  and `CollisionSession`, plus the anchor naming (`resolveDropSide`,
  `dropAnchorFor`, `travelingRowsFor`).
- `workflow/dragRequest.ts`: `anchorFor`, `isIdentity`, `toRequest`,
  `sendItemMove`.
- `workflow/dragBands.ts`: `reservationFor`, `bandBoundaries`, `bandFor`,
  `distanceOutside`, `clipToVisible`, and their types.
- `StubRows.tsx`: `StubBody`, `AttachGhostRow`, `AttachedChildRow`.
- `dragChrome.tsx`: `useLiveDropSide`, `useDropTargetProps`,
  `dropTargetClass`, `DropSideIndicator`, `ZoomCue`, and the cue class
  constants. (`overlayStubIndent` stays in `KanbanCard.tsx`, its only user;
  see the Done note.)
- `dragRegions.ts` gains `dragRegionProps(key)`.

Tests move with their modules. **The gate is that no test changes except
its imports and its file.**

**Makes dead:**
- `boardDndUtils.ts` (the file and its name) and `boardDndUtils.test.ts`,
  split into the two new suites;
- `dragRegions.ts`'s band section;
- `verticalDistance`'s inline horizontal twin in `distanceOutside`,
  folded in the move;
- the region-attribute idiom at its three sites;
- `workflow/CLAUDE.md`'s module map, rewritten.

### Phase 2 — The hook (no behavior change) — done 2026-09-24

**Done 2026-09-24.** Every item below landed. The overlay geometry's unit
table came late, before Phase 2's commit. "Unit table" had been read as a
table of coordinate spaces in the module's header, so the module shipped
with no test file. `dragOverlayGeometry.test.ts` now covers all four
functions, including the rule that running them twice gives the same
answer (the modifier chain runs twice per frame, F8). The header's table
is renamed "Coordinate spaces". "The three teardowns" are
the three sites Story 5 audit #19 named as the "teardown trio":
`handleDragCancel`, `handleDragEnd`'s top, and the pointer-tracking
effect's cleanup.
- `endSession()` (clear the pop timer, cancel the snap, clear the
  session) replaces the full sequence at the first two.
- The cleanup doesn't call `endSession()`. It runs after the session is
  already null, or on unmount, and never wrote the session, so calling it
  there would add a write that never existed.
- The cleanup used to write out the bodies of `clearPopTimer` and
  `cancelSnap` inline, because as hook-local functions they would have
  been dependencies `react-hooks/exhaustive-deps` asks the effect to list.
  Both now live at module scope and take their refs
  (`clearPopTimer(popTimer)`, `cancelSnap(snapFrame, snap)`). A `useRef`
  result is never a listed dependency, so the cleanup calls them too.

All three sites now share the clock steps, and only the two real ends of a
drag clear the session. `KanbanCard.tsx` needed no
edit at all for the "one section rows function" item — its own
`hierarchyRows(...)` call site is byte-identical before and after, since
only the function's return shape (each row's own `parentId`, alongside
`item`/`depth`) grew; the render side already wanted every row, so nothing
there had to change to keep it that way.

Full suites green throughout: `tsc` (root + client), eslint (0 warnings
after `usePendingGhostGuard` picked up its own `latest` ref, mirroring the
rest of the file's established pattern, instead of reading `deps` directly
across the hook-extraction boundary), prettier, both unit suites (317
server + 308 client — +7 over Phase 1, all in the tests this phase's new/
generalized functions needed: `resolvePlacementOver`, and
`computeProjection`'s move into `lib/hierarchyPlacement.ts`), and the full
Playwright suite (140 passed, 8 skipped, matching the baseline) against
the already-running test servers (port 3002/5174, `test.db`,
`ENABLE_TEST_ROUTES=true` — never `kanban.db`). The 15 changed client
files were CRLF in the working tree, which fails `prettier --check` with
no content difference; they're normalized to LF. After the late
unit table and SW-6 guards: 338 client unit tests (+30), and the full
Playwright suite unchanged (140 passed, 8 skipped). `workflow/CLAUDE.md`'s
module map is updated for `dragOverlayGeometry.ts`, the generalized
`lib/hierarchyPlacement.ts::computeProjection`, `dragClassification.ts`'s
`subtreeIds`, `itemListOps.ts::hierarchyRows`'s new field,
`placement.ts::resolvePlacementOver`, and `useBoardDnd.ts`'s
`usePendingGhostGuard`/`endSession`/`releaseDescendants` changes.

C-1 (with L3-3), L2-1, L2-2, L3-1 / C-6a, L1-7a.

- **Overlay geometry** (`reanchorOverlayTransform`,
  `clampToCurrentContext`, `clampAxis`, `overlayWidthFor`) moves to its
  own pure module with a unit table.
- **The depth step** lifts into `lib/hierarchyPlacement.ts`, with the
  indent as a parameter: the sidebar's `computeProjection`, generalized.
  The sidebar and the board both call it.
- **One "section rows" function**, beside `hierarchyRows` in
  `itemListOps.ts`, feeds both `KanbanCard`'s render and the projection.
  The projection's rows are the same list minus the dragged subtree.
- **The last sample's resolved placement** is kept beside the projection,
  and `releaseDescendants` sends it.
- **One derivation of "the dragged subtree"** in `dragClassification.ts`,
  read by both `excludeIds` and `travelingRowsFor`.
- **`resolvePlacementOver`** moves beside `placementFor`.
- **One `endSession()`** replaces the three teardowns (Story 5 audit
  #19's "teardown trio": cancel, end, and the pointer effect's cleanup).
- **`usePendingGhostGuard`**: `setGhost`, `wantedPlacementRef`, the
  reassert effect, `restorePriorPlacement`.

**Makes dead:**
- `updateDescendantsProjection`'s inline depth formula;
- `releaseDescendants`' rebuild of the rows and its second
  `resolvePlacement`;
- `KanbanCard.tsx`'s own `hierarchyRows(...)` walk and the hook's two
  `flattenHierarchy(...)` builds, replaced by the one function;
- the second spelling of the cycle-forming set;
- the three written-out teardown sequences (two full, one clock-only);
- the pure math at the bottom of `useBoardDnd.ts`.

### Phase 3 — Geometry, test-first (visible; hands-on)

L1-8 (with C-8), L1-3, L1-13.

**First, probe the Column → Card transition frame.** Record the target
Card's painted rect against its layout rect at the moment the pop lands,
and whether the Card-context inside test still holds with the painted
box. Only then delete.

**Makes dead:**
- `currentTranslate`, `size`, and `layoutRect`'s `isCard` parameter
  (`layoutRect` collapses to `toRect(getBoundingClientRect())`);
- `dropAnchorFor`'s `onOver` for a non-row `over`;
- `useLiveDropSide`'s `expectedActiveRoles` parameter;
- the blue line's "Diagnostic-grade" header.

**Gate: the PO eyeballs these areas before the phase closes.** L1-8 and
L1-13 were approved on this condition (PO, 2026-09-24). The suites passing
isn't enough, since both changes are about what's drawn in a single frame.
Hand the checklist over with the phase:

1. **Zooming into a Card from a shuffling column (L1-8).** Drag a card
   along a column so the cards shift to make room, then hold on a
   neighbor until it zooms in. *Fine:* the zoom-in lands on the card the
   blue line named; the drag doesn't pop straight back out; the carried
   Stub settles inside the target Card, not beside it.
2. **Popping back out of a Card (L1-8).** From inside a Card, move out
   past its edge. *Fine:* the pop-out fires at the Card's visible edge,
   not a row-height early or late.
3. **Zooming into a Card's Descendants section (L1-8, C-8).** From inside
   a Card, hold over its Stubs. *Fine:* the zoom-in fires over the
   visible section, and the depth cue appears.
4. **The blue line after a Stub leaves its Card (L1-13).** Drag a Stub
   out into a column and move over its cards. *Fine:* the blue line
   appears on the card the drop would anchor to from the first frame, and
   matches where the Stub lands on release.
5. **The blue line during an ordinary Card drag (L1-13).** Reorder a card
   within a column and a Stub within its section. *Fine:* no change from
   today; the line shows only on the named neighbor.

Anything that looks off gets recorded here, and goes back to the PO as a
decision before any fix.

### After Phase 3

- **Report to the PO** any wiki passage that names a symbol this story
  deleted or moved (report only; the wiki is the PO's).
- **Hand off to the four-pass audit** over Stories 6 and 6.1, with this
  ledger for the merge step only (see "The ledger, and what the audit
  gets").

---

## Ground rules (as in 4.1)

- **No rule changes.** A finding that would change behavior goes to the PO
  as a decision before any code moves (4.1's F6 is the precedent).
- **Each phase ends green** on every existing suite before the next
  starts. Deleted code takes its tests with it (the coverage gate).
- **Hands-on with the PO** only where a phase touches something visible.
- **E2E:** no new precise-move cases (those are Story 10's). The existing
  suites are the regression gate.
- **Wiki and test-plan catalogs:** report only, never edit. They belong to
  the PO and the Test Planner.
- **`client/src/components/workflow/CLAUDE.md`** is updated with the code,
  not after it.

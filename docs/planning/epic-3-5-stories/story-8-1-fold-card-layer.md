# Epic 3.5 Story 8.1 — Fold the Card layer into the Descendants layer

**Type:** story · **Written:** 2026-10-28 by the Architect, from Nathan's rulings of 2026-10-26, 2026-10-28 and 2026-10-29 · **Status:** in progress — Phases 1–3 committed; Phase 3b, the cleanup batch, built, for review

## Goal

Remove the Card layer from the drag's stack:
- **Zooming into a Card** from its column lands straight in its Descendants layer, bounded by the whole Card.
- **Every Card gets that layer,** a childless one included, whose only spot is its only child.
- **Leaving a Card is one pop,** to its column.
- **A Free Card zoomed into a section follows the cursor,** which is Story 8.2's fix, taken in (Inbound deferrals).

**Why** (Nathan, 2026-10-26): the Card layer hasn't proved useful hands-on. Story 7's hierarchy modal also brings an edge case only the Card layer raises: a Stub pulled out of the modal to the Card layer is "set back down" by a release there, into a slot the section can't draw. Taken in as Story 8's first story on 2026-10-28.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds it, and Nathan tries it hands-on.
- The PO and the Test Planner write the docs once he has approved it.
- A drag spec the change breaks is skipped with a one-line reason, for Story 10. No new drag specs.
- Unit tests of the pure modules work as usual.

**Out of scope:**
- **How a layer change feels:** the jumps under a still cursor, and which trigger reads which point. Those are the zoom-in morph's story.
- **A new zoom-in cue,** or any cue's look.
- **Tuning values,** beyond deleting the one this removes (`descendantsPopInDelayMs`).
- **The project sidebar,** which has no Card layer.
- **Free-item reparent as a board gesture.** Story 6.1's dry run put it at the Card layer. It's now a tech-debt story (`docs/planning/tech-debt-stories/free-item-reparent-gesture.md`), which starts from a board without that layer.

## Scope

- **Wiki passages:** none ahead of the build, under code first. The passages the fold changes are in the Living-docs handoff, for the PO once Nathan approves.
- **Test-plan cases:** the Test Planner's pass follows the live wiki diff. These are catalog changes; drag-spec rework remains Story 10's under code first.
  - **New, Open:** DRAG-1.35 (direct entry into Descendants), DRAG-4.34 (cursor placement after entry from outside), DRAG-5.15 (title and padding stay in the layer), DRAG-7.31 (a hidden Stub's own-slot set-down after reopening the modal).
  - **Reopened for changed expectations:** DRAG-1.14, DRAG-4.12, DRAG-4.19, DRAG-4.30, DRAG-5.5, DRAG-7.6, DRAG-7.14, DRAG-7.18. Their automation mappings need the Reconciler's fresh comparison; this pass makes no claim about test coverage.
  - **Revised:** DRAG-1.3, DRAG-1.5, DRAG-1.16, DRAG-1.18, DRAG-1.19, DRAG-1.28, DRAG-1.29; DRAG-3.20, DRAG-3.22; DRAG-4.1, DRAG-4.3, DRAG-4.5, DRAG-4.11, DRAG-4.13, DRAG-4.15, DRAG-4.17, DRAG-4.20; DRAG-5.1, DRAG-5.4, DRAG-5.10, DRAG-5.13; DRAG-7.2, DRAG-7.10, DRAG-7.16. The feature index follows the three-layer model.
  - **Deleted, IDs retired:** DRAG-1.21 (the separate Card → Descendants hold), DRAG-4.14 (position-independent auto-drop), DRAG-4.16 (pinned ghost), DRAG-5.11 (two pops to detach into the column), DRAG-5.12 (the intermediate Card-layer safe stop). The current two-pop cascade to Board is DRAG-1.19; one-pop detachment is DRAG-5.1, with distance logic in DRAG-1.14. There is no ID renumbering or reuse.
  - **Reviewed, unchanged:** DRAG-4.8, DRAG-4.29, DRAG-7.7, DRAG-7.9, DRAG-7.11, DRAG-7.13, ATT-7.1 and ATT-7.6. Their rules still hold; the attachment cases describe writes independently of the board's layers.

## Inbound deferrals

- **From the roadmap's Story 8 entry:** "The Card layer is a pass-through for a Card with children" (PO, 2026-09-25). This story settles it by removing the layer.
- **Story 8.2's defect,** folded in by Nathan on 2026-10-29. It's Phase 3.
  - **The defect:** a Free Card zoomed into a section reads the top rows wherever the cursor goes, and its projection sticks at gap 0. Its trace is in Story 7's plan (`docs/archive/story-7-depth-cap-and-hierarchy-modal.md`), Amendments, "2026-10-28, batch 7".
  - **Why it's here:** after the fold, every Free Card zoom lands in a section. Today the Card layer hides the defect, since its release always appends. Without the fix, attaching a Free Card could make it the first child, whether it's released at once or after moving, so the fold's main gesture would regress.
- No audit routed anything here.

## Approach and phases

### Decisions

Nathan ruled the fold itself. The roadmap's Story 8.1 entry records what carries over and what changes. These are the Architect's, to build that ruling.

**D1. Three layers: Board → Column/sub-row → a Card's Descendants.**
- **The Card is no longer a context.** Its region is its Descendants layer.
- **The zoom-in** from a locked column or sub-row targets the Card the side highlight names, with today's two-stage hold: a dwell (`cardZoomDwellMs`), then the cue (`cardPopInDelayMs`). It lands in that Card's Descendants layer.
- **The Card → Descendants clock goes,** and `descendantsPopInDelayMs` with it.
- **The pop out of Descendants** lands in the Card's column or sub-row. A pop out of a column lands at Board, as now.

**D2. The layer is bounded by the whole Card's box** on the board, and by the modal's dialog while the modal holds it, as now. On the board, the Card's box is:
- what the pop-out clock measures against, its time and its distance;
- what the carried copy is clamped to, on both axes, as a Card's box is today;
- what bounds the collision candidates. A Card's box holds only its own section's rows, so the section's rows stay the only candidates.

The carried Stub is as wide as a row of the section. On the board, that's the Card's box less the Card's inset, as `dragOverlayGeometry.ts::overlayWidthFor` computes it for the Card layer today. In the modal, it's the list's width, as now.

**D3. Every Card has the layer, a childless one included.**
- Its one spot is the only child: gap 0, depth 0 (wiki hierarchy-placement §2's empty hierarchy).
- `lib/hierarchyPlacement.ts` already handles an empty list. With no Top and no Bottom, `depthRangeFor` offers depth 0 only.

**D4. The zoom-in seeds the ghost where the Card layer showed it,** so a release right after the zoom commits what a release at the Card layer did:
- **An item from outside** seeds at the last gap, as the Card's last child (`descendantsProjection.ts::seedFor`).
- **The Card's own Stub, coming back in from the column,** seeds at its own slot, and a release there writes nothing. When the section hides that slot, it seeds at the last gap (`slotHidden`), so `slotHidden` stays. A Stub reaches this by leaving its Card, or the modal, and zooming back in.
- **The entry sample must not read the column's anchor.** At the zoom, the named anchor still names the Card itself, as a neighbor in the column, not a row of its section. Today a Card-layer context has no `over`, so the entry into a section reads no anchor and takes the seed. After the fold, the column's anchor reaches the entry sample.
  - `gapIndexFor` reads an anchor it can't find as the last gap, so an item from outside is unaffected.
  - The Card's own Stub would move from its own slot to the last gap, and a release right after the zoom would write a move.
  - **The rule:** on the entry sample, an anchor that isn't a row of this section names no gap, and the seed holds. A unit test pins it.

**D5. Detaching is one pop.**
- Past the pop-out threshold outside the Card's box, or the modal's, the item lands in the column, Free. The column's within-action places it from there.
- **The safe stop goes** (DRAG-5.12's set-down at the Card layer). A Stub drifted over its own Card's title is still in the layer, and a release there places it by gap and depth.

**D6. The hierarchy modal.**
- Pulling out of it is the pop out of Descendants. The modal closes, and the drag is in the Card's column, Free.
- The modal's list names its Card for its parent, and `dragStructure.ts` finds that Card's column (E2).

**D7. The carried copy's form doesn't change.** It's a Stub at the Descendants layer and a shortCard everywhere else. It switches at the zoom-in from a column and at the pop out to one, as now.

**D8. What a Card shows.**
- **It's forced open** while the drag is locked at its Descendants layer, as it is at either of its layers today. It carries `data-active-context` then.
- **The zoom-in cue** (`dragChrome.tsx::ZoomCue`) and its two stages are unchanged.
- **The static attach ghost goes** (`StubRows.tsx::AttachGhostRow`). From the zoom on, the ghost is a row of the section's shuffle, as at the Descendants layer today.

### For the build

These are the places where the decisions meet the drag layer's existing rules (`client/src/components/workflow/AGENTS.md`).

**E1. One region per Card, on its root.**
- `descendants:<id>` moves from the section's wrapper to the Card's root element, where `card:<id>` is today.
- It isn't on the DragOverlay's copy. While the Card's modal is open, the modal's list carries the key and the Card's root doesn't, so one element carries the key (Story 7's E2).
- **What goes:** `CardRegion`, `cardRegionKey`, the `'card'` kind and its `parseRegionKey` branch.
- **Comments that follow:** `dragRegions.ts`'s header and `childRegionAt`'s comment. `childRegionAt` is then read only at the Board layer and by `useBoardDnd.ts::beginDragAt`'s hit test.

**E2. The parent chain.**
- A Card's region finds its column or sub-row by walking up the DOM, as the `card:` region does today (`dragStructure.ts::findParentRegionKey`).
- **The modal's list can't walk:** it isn't inside the Card. Today it names `card:<id>` as its parent. After the fold, it names its Card, and `dragStructure.ts` reads the parent off that Card's element.
- **Not computed in `BoardView.tsx`** from the column's display mode. That would be a second answer to "which region holds this Card", beside the DOM's.

**E3. The pop machine** (`popSession.ts`).
- `namedCardCandidate` resolves the named Card's `descendants:` region.
- `hoverForChildRegion` goes: a Descendants context has no child region, so a locked context's only zoom-in is a card list's named Card.
- `popInDelayFor` and `popDueAt` give the dwell and the cue to that candidate.
- The comments on `PopSession.hover` and the module header follow.

**E4. Placement and the release.**
- `placement.ts::placementFor`'s Card branch goes.
- `overlayFormFor` draws a Stub at the Descendants layer only.
- `useBoardDnd.ts::handleDragEnd` keeps two paths: a Descendants release, and a card-list release.
- `DragSessionContext.ts::useCardContextLayer` answers only whether the drag is locked at this Card's Descendants. `useZoomCandidatePhase` keys on the `descendants:` key.

**E5. D4's entry sample,** in `descendantsProjection.ts::advanceProjection`, or wherever the Coder finds the anchor enters. The rule is D4's, and a unit test pins it beside the seed's existing tests.

**E6. Tests.**
- **Unit tests change in the same phase as the code:**
  - the Card layer's cases are deleted with its code;
  - the column → Card zoom-in cases are retargeted at the Descendants region;
  - new cases pin D3's one-spot layer and D4's entry sample.
- **Fixtures:**
  - `client/src/test/dragFixtures.ts`'s Card region goes, and its Descendants region's parent becomes the column;
  - `popFixtures.ts::threeColumnBoard`'s section follows;
  - `POP_TEST_TUNING` loses `descendantsPopInDelayMs`.
- **E2E: a drag spec that fails is skipped,** with a one-line reason that names this story. It isn't updated.
  - **Names the code no longer has** (`cardRegionKey`, `descendantsPopInDelayMs`) come out of the specs and out of `tests/helpers/dragGesture.ts`'s presets, so the suite still type-checks. Nothing else in a skipped spec changes.
  - **Expected:** `drag-5-stub-detach.spec.ts`'s three tests that wait for `card:`, `drag-7-hierarchy-modal.spec.ts`'s three `pullOutAndZoomBack` tests and the test at `:364`, and `drag-7-modal-hold.spec.ts`'s reopen test (`:738`). `drag-card-zoom-in.spec.ts`'s two tests are already skipped. The suite run decides the real list.
- **The tuning panel** loses its `descendantsPopInDelayMs` field. Check that a value a browser already stored for the deleted key is ignored.

**E7. Comments and the drag layer's `AGENTS.md` follow the code.**
- **The drag layer's `AGENTS.md`:** the mental model's stack, the Card's release, and the modal paragraph's "Card layer". Update its test surfaces too: `data-drag-context` is never `card:`.
- **Module headers and comments that name the Card layer,** among them: `popSession.ts`, `placement.ts`, `dragRegions.ts`, `dragStructure.ts`, `dragOverlayGeometry.ts`, `descendantsProjection.ts::seedFor`, `useBoardDnd.ts`, `DragSessionContext.ts`, `KanbanCard.tsx`, `StubRows.tsx` and `cardMetrics.ts`.
- **The check:** a search for "Card layer", `card:` and `descendantsPopInDelayMs` finds them only in the wiki, the test plans and `docs/archive/`. The PO and the Test Planner change the first two.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so. That runs on its own test stack.

**Phase 1: the fold** (D1–D8, E1–E5, E6's unit tests and fixtures, E7)
- One change across the pure modules, the hook and the components. The app works at the end of it.
- **Gate:** `npm run check`. The E2E specs are Phase 2's.

**Phase 2: the E2E pass** (E6)
- Run the suite.
- Skip each drag spec that fails, as E6 says.
- **Except a failure that is Story 8.2's defect:** a Free Card zoomed into a Card whose ghost or release lands at the section's top. That spec is catching a defect, so it isn't skipped (roadmap, Story 8, "A defect is fixed in Story 8"). It's listed for Phase 3, which runs it again.
- A failure outside the drag specs stops the phase, and it's reported.
- List each skipped test, with the case IDs in its title, under Living-docs handoff, "Test-plan cases whose tests were skipped".
- **Gate:** `npm run check`, and `npm run test:e2e` green apart from the specs listed for Phase 3.

**Phase 3: the Free Card's projection** (Story 8.2's defect, Inbound deferrals)
- **Reproduce it first, on the folded code.** By hand, on the deep stack (`npm run seed:deep`, then `npm run dev:deep`), or with a throwaway probe that's deleted afterwards.
- **What the trace points at:** dnd-kit's `draggingNodeRect`, the DragOverlay's measurement, which is stale after the form switch. It feeds both the clamp (`dragOverlayGeometry.ts::clampToCurrentContext`) and dnd-kit's collision rect. Story 7's throwaway experiment fixed the clamp alone, and the collision rect stayed displaced. The likely fix gives both of them the live rect.
- **Stop and report before changing the drag layer's core** if the fix reaches past the overlay's measurement.
- A pure module that carries the fix gets a unit test. The specs it unblocks (DRAG-1.21, 4.1, 7.10 and 7.13) stay Story 10's.
- **The specs Phase 2 listed** run again. Each passes, or fails because the spec is wrong and is skipped as E6 says.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Phase 3b: the cleanup batch** (Nathan, 2026-10-29)
- **Where it comes from:** a review of Phases 1–3's production code (`docs/audits/story-8-1-fold-cleanup-review.md`), not the story's close-out audit. It found no defect, and four optional tidy-ups the fold left behind. Nathan took them in as one batch.
- **Nothing the user sees changes.** The four items are independent, so any order works. Line numbers are at `004185b`.

1. **Delete `dragRegions.ts::RegionKind`** (review #5). Nothing reads it. One line.
2. **Narrow the Board hit test** (review #2).
   - `childRegionAt(regions, point, parentKey)` is only ever called with a null parent, and with null it can only return a column or sub-row. Replace it with `cardListAt(regions, point): CardListRegion | null`, which tests `isCardList` and containment.
   - **Its callers:** `popSession.ts::advancePopSession`'s Board branch drops its extra `isCardList` check, which only narrowed the type. `useBoardDnd.ts::beginDragAt`'s hit test reads the new name.
   - **Tests:** `dragRegions.test.ts`'s `childRegionAt` describe carries over, renamed. Its case that a Descendants region is never returned stays.
   - **Comments that name it follow:** `dragRegions.ts`'s header and `containsPoint`'s comment, and `popSession.ts`'s Board branch.
   - **`parentRegionKey` stays on every region:** the pop out, `parentKeyOf` and `measureRegions`' scope read it.
   - **Size:** two modules, the hook's one call and a test file, all pure but the call.
3. **Narrow the card-list release** (review #3).
   - In `useBoardDnd.ts::handleDragEnd`, once the Descendants release has returned, `region` is a column, a sub-row or nothing. So `releaseListFor`'s kind check and its `{rows, containerId}` wrapper do nothing.
   - **No region first,** through `commitRelease` with a null placement. That's what happens today, made explicit: `placementFor` returns null with no region, and `commitRelease` restores any pending marker. Don't call `restorePriorPlacement` directly; `commitRelease` stays the one tail.
   - **Then** read the rows once with `regionItems(region)`, and give `resolvePlacementOver` the region's `containerId`.
   - **What goes:** `releaseListFor`; `resolvePlacementOver`'s null-list branch, with its case in `placement.test.ts` (`:401`). Its comment no longer names `releaseListFor`.
   - **If the explicit version reads longer than today's,** keep today's and say so in an amendment. The review allows that.
   - **Two stale comments in the same file** name the Card layer:
     - `:641–642` says "What `placementFor`'s Card branch and `isIdentity` compare a release against". It's the Descendants branch now.
     - `:727`, `commitRelease`'s comment, says "card-list and Card releases alike". There's one card-list release.
   - **Size:** one hook function, and one pure function's signature. Every card-list release runs it, so the E2E suite gates it.
4. **Resolve the bounds elements once** (review #1).
   - `dragStructure.ts::resolveDragStructure` runs one `querySelector` per Descendants region, looking for a bounds element. Since the fold every Card is a Descendants region, and only the modal's list has bounds.
   - **The fix:** read every `DRAG_BOUNDS_ATTR` element once per resolve, into a map from region key to element, and look each region up in it. `boundsElementOf` goes.
   - **Not the review's alternative,** which looks bounds up only for a region that names its Card (`DRAG_PARENT_CARD_ATTR`). It would tie two attributes together, and nothing says they belong together.
   - **Optional, if it falls out of the same edit:** check a Card's validity (`isValidCard`, with the `originCardId` exception) before its DOM reads, keeping the rule in `descendantsStructure`. It saves little: in a Free Card's drag, most Cards are valid.
   - **Don't cache painted rects.** `measureRegions` reads them live each sample, and that stays.
   - **Size:** one function in one file. It runs at pickup, after a layer change, and when a remount outdates the structure, never each sample.

- **Not in the batch: the review's #4,** the repeated child scans.
  - Each step of a section's walk filters the board's whole item list, at every sample at the Descendants layer and in every Card's render. It predates the fold, and nobody has measured a slowdown.
  - It's for a profile first. If one shows it, a children index built once per item snapshot in `useItemManagement.ts` serves the render and the projection together.
- **The review's "Safeguards to retain"** are all still needed. None is a fold leftover, and the batch doesn't touch them.
- **Gate:** `npm run check` and `npm run test:e2e`, since item 3 changes the release's code. Then a stop for review and commit.
- **Report in an amendment:** which items landed, and any left as they were, with the reason.

**Phase 4: Nathan's hands-on**
- **What to try:**
  - **Attach a Free Card:** zoom in and release at once, which makes it the last child. Then zoom in from above the Card, and from below it, move a little, and release. The ghost now follows the carried copy, where the Card layer always appended. Coming from above, the first move can name the top row.
  - **A childless Card:** zoom in and release. It's the only child.
  - **Detach a Stub in one pop.** Drift a Stub over its own Card's title and release: the safe stop is gone, so it places by gap and depth.
  - **The modal:** the hold that opens it, and pulling out of it, which lands in the column.
  - **A Stub of `P` out to the column and back into `P`.** It comes back at its own slot, or as the last child when the section hides that slot.
  - **The zoom's length:** from the column into a section is the dwell plus the cue, about 1.3 s, where today a section took another 0.8 s after that.
- **Then** the Coder writes the handoff's behavior decisions, and the PO and the Test Planner work from the handoff.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories (roadmap, Story 8, "How each story closes"). Nathan may call one sooner.

## Code map

| Symbol | Carries |
|---|---|
| `dragRegions.ts::DescendantsRegion` | D1, D2, D3: a Card's whole box on the board, the modal's list while the modal holds the layer. Its `parentRegionKey` is the column or sub-row. `CardRegion`, `cardRegionKey` and the `'card'` kind are gone. |
| `dragRegions.ts::DRAG_CARD_ATTR`, `DRAG_PARENT_CARD_ATTR`, `dragRegionProps(key, parentCardId?)` | E1, E2: every Card's root names its id; the modal's list names its Card. |
| `dragRegions.ts::isModalList` | D2: tells the modal's list from a Card's box, for the carried Stub's width. |
| `dragStructure.ts::findParentRegionKey` | E2: walks up from the Card's element, found by `DRAG_CARD_ATTR` when the modal's list names it. |
| `popSession.ts::namedCardCandidate`, `zoomInDelay`, `popDueAt` | D1, E3: the named Card's `descendants:` region as the candidate, the dwell plus the cue as its clock. A hover's `phase` says which clock `popDueAt` reports. |
| `placement.ts::placementFor`, `overlayFormFor` | E4: no Card branch; a Stub at the Descendants layer only. |
| `descendantsProjection.ts::advanceProjection`, `namesRowOf` | D4, E5: on the entry sample, a named neighbor that isn't a row of the section names no gap. |
| `descendantsProjection.ts::pickupSlot`, `ProjectionSample.ownSlot`, `useBoardDnd.ts::ownSlotRef` | D4: the Stub's own slot, read once at pickup. |
| `DragSessionContext.ts::useIsLockedAtCard`, `useZoomCandidatePhase` | E4: whether the drag is locked at this Card's layer; the zoom candidate keyed on the `descendants:` key. |
| `KanbanCard.tsx` | D3, D8, E1: the region on the Card's root, always, a childless Card included; forced open while locked; no attach ghost. |
| `HierarchyModal.tsx` | D6, E2: the list names its Card for its parent. |
| `dragOverlayGeometry.ts::overlayWidthFor` | D2: the Card's box less its inset on the board, the list's width in the modal. |

## Amendments

**2026-10-29, the test-plan pass (Test Planner)**
- Derived from the live board-drag-interaction wiki and its diff, with the story supplying scope and the skipped-test handoff. No production or test code was read or edited.
- Applied the catalog changes listed in Scope. Immediate-release cases now say explicitly that the cursor hasn't moved after zoom; later movement places by gap and depth. Empty Cards, whole-Card bounds, one-pop exits, visible and hidden pickup-slot seeds, and return through the column to the modal are covered.
- The existing `slotHidden` question below doesn't require a speculative expectation in the catalog: wiki board-drag-interaction §7.1 and §7.3, with wiki hierarchy-placement §5, already say a release in the original gap and depth in the full modal writes nothing. DRAG-7.31 covers that return path. This is a reading of the wiki, not a finding about the implementation; a different intended outcome needs the PO to change the wiki first.
- **Checks:** no removed Card-layer terms or references to retired IDs remain in the test-plan catalog; suite tables, case bodies, statuses and Next IDs checked for agreement. `git diff --check` passes. `npm.cmd run check:docs` checks 386 files and reports exactly two references to retired IDs, both in test titles, listed under the Coder handoff below. No application tests were run for this documentation pass.

**2026-10-29, Phase 1 (Coder)**
- **D4 needed two rules, not one.** The entry sample's neighbor is the column's (D4, built as written). The Card's own Stub also has no row in its section on that sample: it is previewed Free in the column, so a read off the section's rows finds no own slot and seeds the last gap. Before the fold the Card layer put the Stub back in its section first, which hid this. The Stub's slot is now read once, at pickup (`pickupSlot`, kept in `useBoardDnd.ts::ownSlotRef`), and every entry seeds from it. Both rules have a unit test that fails when the rule is taken out.
- **E2's DOM contract.** The Card's root gives up the region key while the modal holds the layer, so the modal's list has no region element to walk to. Every Card's root now carries its id (`DRAG_CARD_ATTR`), and the list names its Card (`DRAG_PARENT_CARD_ATTR`, which replaces `DRAG_PARENT_REGION_ATTR`, whose value was a region key).
- **`useCardContextLayer` is now `useIsLockedAtCard`,** and returns a boolean. `popDueAt` lost its `regions` argument: a hover with a `phase` is the zoom-in candidate, and nothing else sets one.
- **E6's E2E edits started in Phase 1.** The gate is `npm run check`, whose root type-check covers `tests/`, so the removed names (`cardRegionKey`, `descendantsPopInDelayMs`) had to leave the specs and `dragGesture.ts`'s `NO_POP` now. Where a spec waited for the Card layer, or for the zoom back into a section by the removed clock, the lines using the names are gone and the test is skipped: DRAG-5.12, DRAG-5.13, DRAG-7.6/7.10/7.11 (the pop-out test), DRAG-7.2/7.6 (the three `pullOutAndZoomBack` tests) and DRAG-7.10/7.18 (the reopen test in `drag-7-modal-hold.spec.ts`). The test that zooms into a different Card (DRAG-5.4) and `drag-card-zoom-in.spec.ts`'s two skipped tests wait for `descendantsRegionKey` now. Phase 2 runs the suite and decides the rest.
- **A skip reason can't name a story.** `check:docs` refuses a story ID in a code comment, so each reason states the fact ("the Card layer is gone, and …"). The Living-docs handoff names the story.
- **Unit tests beyond E6's list:** `KanbanCard.test.tsx` pins the region on every Card's root (a childless Card, a Card the modal holds, the DragOverlay's copy), and `dragTuning.test.ts` pins that a stored value for a key the tuning doesn't have is ignored (E6's last bullet).
- **To watch in Phase 4:** a Card's region rect is its painted box. At a zoom-in from the column, the target Card may carry the column's shuffle for a moment, which would shift the clamp and the containment test until it settles. The pop-out clock outlasts it, but a jump under a still cursor is how a layer change feels, which this story leaves to the zoom-in morph.
- **Checks:** `npm run check` passes (430 server, 581 client, 217 script tests; `check:docs` 386 files, 0 hits). `drag-5-stub-detach.spec.ts` runs: 6 passed, 2 skipped. The full E2E suite is Phase 2's.

**2026-10-29, Phase 2 (Coder)**
- **The first run:** 222 passed, 1 failed, 15 skipped. The failure isn't Story 8.2's defect (no Free Card's ghost or release landed at a section's top), so no spec waits for Phase 3 from this pass. The 15 skips are Phase 1's 7 and 8 that predate the story: `drag-card-zoom-in.spec.ts`'s two, which skip for another reason, and six cross-column and cross-project specs.
- **The one failure was the hold's reach.** `drag-7-modal-hold.spec.ts`'s DRAG-7.14 test rests the cursor in P's padding, left of the section, and expects the hold to end. The hold ends when the cursor leaves the layer's box (`popSession.ts`, "Resting outside the context is no hold on anything inside it"), and the layer is the whole Card now (D2), so that point is inside it and the cue runs on. It failed the same way alone, so it isn't order. It is skipped, and the change is in the handoff as a passage to rule on (wiki §7.3 says "the section's box").
- **Passing tests that describe the removed layer.** They pass because they assert where the drag ends up, not how many pops it took. They aren't skipped, since nothing broke; they're listed in the handoff for Story 10's rework: DRAG-5.1/5.10, DRAG-5.11/1.14, DRAG-7.10's "second pop" test, and DRAG-5.4's comment.
- **Checks:** after the skip, `npm run test:e2e` runs 222 passed, 16 skipped, 0 failed. `npm run check` passes (430 server, 581 client, 217 script tests; `check:docs` 386 files, 0 hits). The skipped tests are listed under Living-docs handoff.

**2026-10-29, Phase 3 (Coder)**
- **Reproduced on the folded code,** with a throwaway probe (deleted; a copy is outside the repo). A Free Card `F0` in `P`'s column, picked up and held on `P` until the context reads `descendants:P`, then walked down `P`'s section over `A`, `T`, `B` and `X`. At the zoom the carried copy was painted 65px below the cursor, then pinned at the section's bottom edge from `T` on, and the projection read `0:0`, `1:1`, `1:1`, `1:1`. A Stub of `P` walked over the same rows (the control) reads `0:0`, `3:3`, `7:0`, `8:0`, `6:2`.
- **The cause is two things, and the plan's trace had the first one wrong in direction.**
  - **1. The re-anchor measured against the wrong origin.** dnd-kit holds the DragOverlay at the source's first rect for the whole drag (`PositionedOverlay`, `useInitialValue(activeNodeRect)`), and `draggingNodeRect`'s top and left are that origin too (only its width and height follow a resize). `reanchorOverlayTransform` was given `activeNodeRect`, the source's *live* rect, which stops being the Card's row once the item is a ghost row in a section, and which moved from 766 to 585 in the log. The translate was put against 585 and applied at 762, so the copy sat that far from the cursor, and the clamp and dnd-kit's collision rect (both the overlay's rect plus that translate) were displaced with it. The clamp and the collision rect were not stale; they were fed a translate from another origin. Giving them the live rect, as the plan's trace suggested, would have moved the error.
  - **2. The section's rows were measured while the Card was still sliding.** The rows mount at the zoom, in the render that clears the column's sortable shuffle, and the Card slides back to rest over its sortable transition. dnd-kit measures a mounting droppable once, with its own transform removed but its ancestors' kept, so `droppableRects` for the rows read `A@493, Q@521, R@549 …` where the rows settle at `417, 445, 473 …`, and are never measured again (`P`'s painted box read 104px lower at the zoom than where it settled, about the Free Card's height; I read the box, not `P`'s transform). As `P` settled, the lower rows' stale centers fell outside the section and stopped being candidates (8, then 5), so `over` stayed on `A` and the projection never followed the cursor. The comment in `dragCollision.ts` ("the two differ only while the Card carries a sortable transform, which at the default clocks can't overlap a Descendants lock") was true while a Card layer sat between the column and the section. After the fold it was not; that comment is gone with the code it sat on.
- **Both are needed.** The first alone leaves the copy under the cursor and the projection stuck. With both, the Free Card's walk reads the same as the control at every stop.
- **Decided (Nathan, 2026-10-29): B,** the collision measures the section's rows live. It was built, and it fixed the projection and the release. It did not fix what the board paints: the ghost row of the Free Card rested at the section's bottom (`translateY(+20)`) where its gap is, and the original last Stub `X` was shifted up (`-76`). dnd-kit's sortable strategy takes the active row's translate from the same stored rects (the over row's stored top less the live `activeNodeRect.top`), so a stored offset of 104 gives `104 - 84 = +20` where the control gets `-84`. B read the candidates live, but the strategy and `over.rect` (which `dropAnchorFor` reads) still read the stored ones. The stored rects were the thing to fix.
- **Built instead, at the source: the locked Card doesn't slide.** `KanbanCard.tsx` turns its sortable transition off while `lockedHere`, so the Card is at rest when its rows mount and they are measured there; the collision, `over.rect` and the rows' shuffle then all read right rects, with no live read and no timing. With it, the ghost row rests at `-84` like the control's and `T`, `B`, `X` open the gap (`+28`). B was taken out as redundant: the same probe, without it, reads the control's numbers in both entries tried.
- **Built, in all:**
  - **The pickup rect.** `useBoardDnd.ts` keeps the carried copy's rect from the first moment dnd-kit has one in a drag (`pickupRectRef`, cleared by `handleDragStart`) and gives that to `reanchorOverlayTransform` in place of `activeNodeRect`. `onDragStart` fires before dnd-kit has measured the source, so it can't be read there. The pure function is unchanged; its comment no longer says the source row is never swapped out. No unit test carries it: the choice of rect is in the hook, and no pure module holds it.
  - **The Card that holds the drag doesn't slide** (`KanbanCard.tsx`), with a unit test in `KanbanCard.test.tsx` that fails without the line.
  - **The drag layer's `AGENTS.md`** says what dnd-kit measures once and from where.
- **Both entries tried read the control's numbers:** a Free Card from outside zoomed into `P`, and a Stub of `P` popped out to the column and zoomed back in (`0:0`, `3:3`, `7:0`, `8:0`, `6:2`, the ghost at the control's place). These are probes of two gestures, not a spec; the specs the defect blocks (DRAG-1.21, 4.1, 7.10, 7.13) stay Story 10's.
- **Resolves Phase 1's watch item.** The "to watch in Phase 4" note above (a Card's painted rect carrying the column's shuffle at the zoom) was this: the Card now rests at the zoom, so the region's rect, the clamp and the containment test see its final box at once.
- **To watch in Phase 4:** `P` now snaps to rest at the zoom where it used to slide back over about 200ms, and the transition-off also drops its colour fade while it holds the drag. The zoom already redraws the Card (the section opens), so the snap may read as part of it; if it doesn't, the slide wants another way to be kept that leaves the rows measured at rest, which is the zoom-in morph's territory.
- **The two skipped zoom-in specs (`drag-card-zoom-in.spec.ts`), run un-skipped once for information and put back.** Their skip reason still holds, and nothing here changes it. The own-column one passes. The cross-column one passes or fails by timing: the zoom lands at about 1.9s, the drag is popped back out to the column about 150ms later (the Card moves out from under the frozen pointer at the lock, and the spec seeds a 150ms pop-out clock), and the spec's wait sees `descendants:` only if a poll falls in that window. The context timeline, recorded in the page, is the same on the Phase 2 code (zoom, bounce at +150ms, zoom again), so the bounce is not from this phase. Whether the poll lands in the window varied between samples on both trees (the Phase 2 code passed all but one run of those I did, this phase's tree failed 2 or 3 of 12 in each controlled sample), and I could not tell a small timing shift from noise. A poll from outside the page also changes the gesture's timing, so a probe has to observe from inside it.
- **Not verified:** by hand. The probes ran at one window size (1280x1800, nothing scrolls) on the overflow tree.
- **Checks:** `npm run check` passes (430 server, 582 client, 217 script tests; `check:docs` 386 files, 0 hits). `npm run test:e2e`: 222 passed, 16 skipped, 0 failed.

**2026-10-29, Phase 3b (Coder)**
- **All four items landed.** Nothing the user sees changes.
  1. **`RegionKind` is deleted** from `dragRegions.ts`. Nothing read it.
  2. **`childRegionAt` is `cardListAt(regions, point): CardListRegion | null`.** It tests `isCardList` and containment, so a Descendants region is excluded by its kind, where the parent-key match used to exclude it. `popSession.ts`'s Board branch lost its extra `isCardList` check, and `useBoardDnd.ts::beginDragAt` reads the new name. `dragRegions.test.ts`'s describe carries over, renamed, with the case that a Descendants region is never found. The header, `containsPoint`'s comment and the Board branch's comment follow.
  3. **The card-list release is narrower.** `releaseListFor` is gone. After the Descendants release returns, `handleDragEnd` sends no region through `commitRelease(current, null, [])`, which is what `placementFor` answering null did before, made explicit, with `commitRelease` still the one tail. Then it reads the rows once with `regionItems(region)` and gives `resolvePlacementOver` the region's `containerId`. `resolvePlacementOver(containerId, overId, anchor)` lost its null-list branch and its case in `placement.test.ts`, and its comment no longer names the helper. The explicit version is shorter than the helper it replaces, so today's was not kept. The two stale comments in `useBoardDnd.ts` are fixed (the Stub's `origin` names `placementFor`'s Descendants branch; `commitRelease` names the one card-list release).
  4. **The bounds elements are read once per resolve.** `boundsElementOf` is `boundsElements(root)`: one query for every `DRAG_BOUNDS_ATTR` element into a map from region key to element, and each Descendants region looks itself up. The first element in document order wins a key, as a query for that key found it.
- **Left as it was: item 4's optional validity check ahead of the DOM reads.** It saves little (in a Free Card's drag most Cards are valid), and doing it either takes the rule out of `descendantsStructure` or makes the reads lazy, which the batch asked to keep. The review's #4, the repeated child scans, was not in the batch.
- **Tests:**
  - **New, in `dragStructure.test.ts`:** each Descendants region takes the bounds element marked for its own key (a Card's own region takes none, an element marked for a region that isn't there is ignored, the first of two for a key is used); and the bounds elements are looked for once per resolve however many Cards are drawn (it counts the root's queries that name the attribute).
  - **Mutation checks, each restored:** a query per region again fails the once-per-resolve case; the last element winning a key fails the own-key case; any element serving any region fails the own-key case; `cardListAt` without its kind test fails the "column under a Card, not the Card" case.
  - **No unit test for the no-region early return:** it is in the hook. It takes the path today's code took.
- **For the Architect:** the roadmap still names `childRegionAt(…, null)` at `epic-3-5-roadmap.md:935`.
- **Checks:** `npm run check` passes (430 server, 583 client, 217 script tests; `check:docs` 386 files, 0 hits). `npm run test:e2e`: 222 passed, 16 skipped, 0 failed.

**2026-10-29, the wiki (PO)**
- **Written from the handoff's "Passages superseded"** and the drift review's wiki findings 1–9 (`docs/audits/story-8-1-wiki-comment-drift-review.md`), with Nathan's go-ahead after his hands-on. Board-drag-interaction's §1, §1.1, §3, §3.1, §5, §5a, §6, §6.1, §7, §7.1, §7.3, §8 and Open questions. No section was added, moved or removed.
- **Deduced (PO), for Nathan to overrule:**
  - **§7.3, the hold's reach** (DRAG-7.14's third case, Phase 2). The hold runs with the cursor inside the Card's box, and the cursor leaving that box resets it, where it said the section's. It follows from D2: the layer is the whole Card, and a hold runs only inside the locked context.
  - **§8, the Card's title and padding** are inside the layer, so a release over them places a Stub by gap and depth. It's D5's dropped safe stop, stated where DRAG-5.12's rule was.
  - **Whys that leaned on the Card layer, rewritten to stand alone:**
    - §1.1 gains "The Card has no layer of its own": a release there could only append or set a Stub back down, which the Descendants layer offers too, at the cost of one more hold and one more pop. It's the Goal's Why, put as a rule's reason.
    - §7's seed: "The zoom doesn't take the ghost's gap from the cursor", since the cursor rested there to name the Card (D4's entry sample).
    - §7's "Why not a band on the Card" loses the auto-drop.
    - §7.3's "Why not a layer of its own below Descendants" counts two pops to leave the Card, not three.
- **No other wiki page changes.** Hierarchy-placement §2 leaves each surface to say when its empty hierarchy arises, and §7.1 now does. Item-attachment and item-positioning name no Card layer.
- **For the Test Planner:** the handoff's sweep list stands. Three passages it touches are gone outright, not reworded: §3.1's Card → Descendants clock, §8's two-pop list, and §8's "The intermediate stop at Card layer". §6's auto-drop is now §7's seed.
- **Checks:** `check:docs` 386 files, 0 hits. A search of the wiki for "Card layer", `descendantsPopInDelayMs`, "auto-drop" and "placeholder Stub" finds nothing.

**2026-10-29, the comment drift pass (Coder)**
- **Written from** the drift review's findings 10–16 (production comments) and 17–23 (test-source comments). Comments and two test titles only; no code, assertion or behavior changed. The wiki references in the comments are untouched: the PO moved no section.
- **Production comments (10–16), all landed:**
  - `dragCollision.ts`: mixing the painted `sectionRect` with the stored `droppableRects` is safe because the Card holding the drag is at rest when its rows mount (`KanbanCard.tsx` turns its sortable transition off while locked), not because of the default clocks.
  - `descendantsProjection.ts::reseedProjection`: `slotHidden` no longer claims `own` is read from previewed rows; it says what the flag records. See the open question.
  - `placement.ts`: a card-list region is reached from the Descendants layer below it, not "either layer".
  - `dragClassification.ts::isValidParent`: the region gate is a Card's Descendants region, its root box or the modal's list.
  - `KanbanCard.tsx`: both drag copies are shortCards in a card list and at the Board; at Descendants the carried copy is a Stub and the in-list copy a section row.
  - `StubRows.tsx::StubBody`: the dashed ghost is out of the list of outer boxes.
  - `dragChrome.tsx::ZoomCue`: only a Card's zoom ends in a layer change; the modal hold opens another presentation of the same layer.
- **Test-source comments (17, 19 in part, 21–23), landed:**
  - `drag-5-stub-detach.spec.ts`: the detach, cascade-yank and reparent tests describe one pop to the column, then the named Card's dwell and cue. Two titles follow (`DRAG-5.1, DRAG-5.10` and `DRAG-5.11, DRAG-1.14`); their IDs are unchanged.
  - `drag-7-hierarchy-modal.spec.ts`: `pullOutAndZoomBack` leaves the drag in the column and zooms back from there; the `DRAG-7.10` title drops "second pop" and "two pops".
  - `drag-target-classification.spec.ts`, `itemListOps.test.ts`, `dragGesture.ts::pastColumnEnd`: the intermediate stop, the attach-ghost leaf and the separate section element are gone from their explanations. `pastColumnEnd` now gives the real reason for the positive selector: a region kind added later isn't swept in.
- **Left as it was: the skipped tests' comments and titles (18, 19's `:338`/`:362`, 20).** Their bodies still assert the removed behavior, so a comment rewritten to the current behavior would contradict the assertion beside it. Each carries a skip line that says why, and the Story 10 rework rewrites them.
- **Two more of the same, found in the sweep:** `dragRegions.ts::CARD_LIST_REGION_SELECTOR`'s comment said an "anything but `descendants:`" selector would sweep in the Cards (the same claim as 23, the other way round), and `hierarchyPlacement.ts::flattenHierarchyOf`'s header listed an attach ghost's children as something a caller leaves out. Both fixed.
- **Checks:** `npm run check` passes. E2E not re-run: the only test-file changes are comments and two titles.

## Open questions

- **Should `slotHidden` still be carried across the modal opening?** (Finding 11.) `reseedProjection` keeps the seed's flag. Its old reason, that `own` was read from rows that place the Stub as the Card's last child, is gone: `own` comes from the pickup snapshot. The comment now says only what the flag records. What the flag still does there is a behavior, which this pass left alone: the modal draws every level, so a hidden pickup slot is drawn in it, and with the flag carried a Stub put back in that slot counts as a move and writes (to where it already is), where cleared it would be its own slot and write nothing. Read from the code, not tried in the browser. For the PO to rule on with the Phase 4 behavior decisions.

## Living-docs handoff

- **Test Planner → Coder and Test Reconciler:**
  - The catalog sweep is applied; Scope lists every changed, new, reopened and retired case. Existing automation mappings are retained where expectations only needed wording changes. The eight reopened cases and four new ones are Open, with no asserted automation mapping.
  - **Coder cleanup needed for the docs gate now:** `check:docs` reports `tests/ui/drag-5-stub-detach.spec.ts:148` for the retired DRAG-5.12 and `:244` for the retired DRAG-5.11. Remove the obsolete skipped safe-stop test, and remove DRAG-5.11 from the distance-detach test's title, retaining DRAG-1.14 only if it still asserts that case. Do not relabel either with a new case ID unless the assertions cover the new case. The Test Planner leaves test code to the Coder.
  - **Story 10's rework:** use the current cases rather than restoring retired expectations. Direct zoom is DRAG-1.35; immediate release and initial seeds are DRAG-4.1 and DRAG-4.30; subsequent cursor placement is DRAG-4.34; one-pop exits are DRAG-5.1, DRAG-5.13 and DRAG-7.10; title/padding and modal-hold bounds are DRAG-5.15 and DRAG-7.14. DRAG-7.6, DRAG-7.18 and DRAG-7.31 cover returning from the column and reopening the modal. DRAG-1.19 covers the actual two-pop cascade, ending at Board.
  - **Reconciler:** compare the changed cases afresh, including the unskipped parts of DRAG-7.2 and DRAG-7.11. The story's report of remaining unit coverage isn't itself a mapping approval or proof of the revised cases. Restore Automated only when tests assert the whole current case.
- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder, in Phase 4.
- **Passages superseded,** for the PO once Nathan approves. These are wiki board-drag-interaction's, by what each says now. *Written 2026-10-29 (PO), as listed; Amendments, "the wiki", has the deductions.*
  - **§1:** "A Card" as a context goes. A Card's Descendants context is reached from its column, bounded by the whole Card.
  - **§1.1:**
    - the table becomes three layers;
    - "A Card with no attached children has no descendants section" becomes the one-spot layer;
    - rule 2's pop out of Descendants lands on the column, and its "two layers at once" text goes;
    - rule 3's example cascades through one pop fewer;
    - the exceptions list's "A Card the drag zooms into opens" stays.
  - **§3:**
    - a pop out of Descendants lands in the column;
    - "From inside a locked Card … zooms into Descendants" goes;
    - the zoom-in from a column lands in the Card's Descendants.
  - **§3.1:**
    - the "Pop-in, Card → Descendants" clock and `descendantsPopInDelayMs` go;
    - "Pop-in, Column/sub-row → Card" lands in the Card's Descendants.
  - **§5a:** "From the Card layer down — Card and Descendants" becomes the Descendants layer.
  - **§6:**
    - the attach is a zoom into the Card, and a release right after it makes the item the last child, from the seed;
    - any other spot is the cursor's, by gap and depth;
    - the auto-drop as a layer's within-action goes, with its "own Stub set back down" case and the pinned-ghost paragraph.
  - **§6.1:** the card "opens with its placeholder Stub" becomes the ghost in its last gap.
  - **§7:**
    - the layer is reached by zooming into the Card;
    - "commits what it would have at the Card layer" changes;
    - the Stub whose slot is hidden comes back in from its column;
    - the "Why not a band on the Card" reason loses "a Card's within-action is the auto-drop".
  - **§7.1:** "The hierarchy is never empty here" becomes the one-spot layer, wiki hierarchy-placement §2's empty hierarchy.
  - **§7.3:**
    - the hold's reach: it runs with the cursor inside the layer's box, the whole Card's, where it says "the section's box", and the cursor leaving that box resets it, not the section (DRAG-7.14's third case);
    - leaving the modal lands in the column, Free, so detaching takes one pop;
    - "three pops to leave the Card" becomes two;
    - a drag pulled out of a click-opened modal is in the column.
  - **§8:**
    - detaching is one pop;
    - the two-pop list, the distance-term paragraph and "The intermediate stop at Card layer" go;
    - "zooming into a different Card … or goes on into its Descendants" becomes one zoom.
  - **Elsewhere:** wiki hierarchy-placement needs no change, since §2's empty hierarchy now applies to the board. Wiki item-attachment names no Card layer.
- **Test-plan cases to sweep,** for the Test Planner once Nathan approves. These were found by searching the catalog for the Card layer, the Card → Descendants delay and a childless Card. They're a starting list, not a verdict. DRAG-1.14, 5.11, 7.14 and 7.18 were added from the E2E pass (Phase 2):
  - DRAG-1.14, 1.19, 1.21;
  - DRAG-3.22;
  - DRAG-4.1, 4.8, 4.14, 4.29;
  - DRAG-5.1, 5.5, 5.10, 5.11, 5.12;
  - DRAG-7.2, 7.7, 7.9, 7.10, 7.13, 7.14, 7.18;
  - ATT-7.1, 7.6.
- **Test-plan cases whose tests were skipped,** each skipped because the fold changed what it waits for, not because it found a defect. The skip comment states the fact, and the test's body is as it was. Story 10 reworks them:
  - `tests/ui/drag-5-stub-detach.spec.ts`:
    - **DRAG-5.12**, released back at the Stub's own Card's layer writes nothing. The Card layer is gone, so there's no stop to set it down at. It has no other automated test.
    - **DRAG-5.13**, a grandchild Stub popped out to its containing Card's layer keeps its row drawn. A pop out of the section lands in the column. The case's other test (DRAG-1.1, DRAG-5.13, the drag starts in the Card's whole section) still runs.
  - `tests/ui/drag-7-hierarchy-modal.spec.ts`:
    - **DRAG-7.6, DRAG-7.10, DRAG-7.11**, resting outside the modal's box pops out, and a release sets the Stub back down. A pop out of the modal lands in the column, where a release places the Stub Free. DRAG-7.10 and 7.11 have other tests that run. DRAG-7.6's coverage is now the unit tests (`descendantsProjection.test.ts`, `placement.test.ts`).
    - **DRAG-7.2, DRAG-7.6**, back in the section a Stub whose slot is behind an overflow row starts as the Card's last child. The way back into the section is now a zoom-in from the column.
    - **DRAG-7.2**, with R's only attached child dragged, back in the section R has no overflow row. The same reason.
    - **DRAG-7.6**, back in the section a Stub whose slot the section shows comes back in that slot, and a release writes nothing. The same reason. The unit tests pin the seed.
  - `tests/ui/drag-7-modal-hold.spec.ts`:
    - **DRAG-7.10, DRAG-7.18**, after leaving a modal a hold opened, a hold opens it again in the same drag. The way back into the section is now a zoom-in from the column. DRAG-7.18 has no other automated test.
    - **DRAG-7.14**, resting outside the section ends the hold. The layer is the whole Card's box now, so the Card's padding left of the section is inside it and the hold runs on. The case's other tests run. This one is a change to the rule, listed under §7.3 above.
- **Tests that still run and describe the removed layer.** They pass because they assert where the drag ends up, not how many pops it took, so they aren't skipped. Their titles and comments name two pops, or the Card layer, which is the Test Planner's and Story 10's to settle:
  - `drag-5-stub-detach.spec.ts`: DRAG-5.1, DRAG-5.10 ("two pops detach the Stub"), DRAG-5.11, DRAG-1.14 ("cascades Descendants -> Card -> Column": the Stub now takes one hop, so the multi-hop cascade is no longer what it exercises, though the release still detaches), and DRAG-5.4 (its comments count two pops before the zoom).
  - `drag-7-hierarchy-modal.spec.ts`: DRAG-7.10 ("a second pop, out of the Card's box … two pops").
  - `drag-card-zoom-in.spec.ts`'s two tests stay skipped for the reason they gave before this story: the target Card moves under the cursor as the ghost row draws. They now wait for `descendantsRegionKey`. Whether that reason still holds after the fold hasn't been tried.
- **For the Architect, at close:**
  - **Story 10's roadmap entry** names code this story deletes, in item 2: `placementFor`'s Card branch, `AttachGhostRow`, the `cardRegion` fixture and `useCardContextLayer`'s Card half. It also names `childRegionAt(…, null)`, which Phase 3b renames. Its items 1 and 4 name Card-layer cases too.
  - **The roadmap's "Decisions of 2026-09-17"** keep "No two-layer pop out of Descendants", which this story reverses.
  - **Story 8's carried-in items** that name the Card layer: the zoom-in morph's "popping into a Card", and the depth cue's.
- **Implementation passages to place:** none expected.

# Epic 3.5 Story 8.1 — Fold the Card layer into the Descendants layer

**Type:** story · **Written:** 2026-10-28 by the Architect, from Nathan's rulings of 2026-10-26, 2026-10-28 and 2026-10-29 · **Status:** planning

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
- **Test-plan cases:** none ahead of the build. The handoff lists the cases to sweep, for the Test Planner once Nathan approves.

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

These are the places where the decisions meet the drag layer's existing rules (`client/src/components/workflow/CLAUDE.md`).

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

**E7. Comments and the drag layer's `CLAUDE.md` follow the code.**
- **The drag layer's `CLAUDE.md`:** the mental model's stack, the Card's release, and the modal paragraph's "Card layer". Update its test surfaces too: `data-drag-context` is never `card:`.
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

Filled in by the Coder while building.

| Symbol | Carries |
|---|---|

## Amendments

## Open questions

None.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder, in Phase 4.
- **Passages superseded,** for the PO once Nathan approves. These are wiki board-drag-interaction's, by what each says now:
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
    - leaving the modal lands in the column, Free, so detaching takes one pop;
    - "three pops to leave the Card" becomes two;
    - a drag pulled out of a click-opened modal is in the column.
  - **§8:**
    - detaching is one pop;
    - the two-pop list, the distance-term paragraph and "The intermediate stop at Card layer" go;
    - "zooming into a different Card … or goes on into its Descendants" becomes one zoom.
  - **Elsewhere:** wiki hierarchy-placement needs no change, since §2's empty hierarchy now applies to the board. Wiki item-attachment names no Card layer.
- **Test-plan cases to sweep,** for the Test Planner once Nathan approves. These were found by searching the catalog for the Card layer, the Card → Descendants delay and a childless Card. They're a starting list, not a verdict:
  - DRAG-1.19, 1.21;
  - DRAG-3.22;
  - DRAG-4.1, 4.8, 4.14, 4.29;
  - DRAG-5.1, 5.5, 5.10, 5.12;
  - DRAG-7.2, 7.7, 7.9, 7.10, 7.13;
  - ATT-7.1, 7.6.
- **Test-plan cases whose tests were skipped:** filled in by the Coder, in Phase 2.
- **For the Architect, at close:**
  - **Story 10's roadmap entry** names code this story deletes, in item 2: `placementFor`'s Card branch, `AttachGhostRow`, the `cardRegion` fixture and `useCardContextLayer`'s Card half. Its items 1 and 4 name Card-layer cases too.
  - **The roadmap's "Decisions of 2026-09-17"** keep "No two-layer pop out of Descendants", which this story reverses.
  - **Story 8's carried-in items** that name the Card layer: the zoom-in morph's "popping into a Card", and the depth cue's.
- **Implementation passages to place:** none expected.

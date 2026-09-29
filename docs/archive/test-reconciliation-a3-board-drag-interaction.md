# Test Reconciliation: A3 batch 3, board-drag-interaction (proposing run)

**Run:** proposing (A3 batch 3, step 2), 2026-09-27. Nothing in `docs/test-plans/`, the wiki or any test was edited. This report is the only write.

**Scope:** `docs/test-plans/board-drag-interaction/` (DRAG-1 … DRAG-6, 111 cases), against `docs/wiki/board-drag-interaction/README.md` as swept by A2. The catalog-wide checks cover every suite.

**Skipped by instruction:** the 3 `Pending PO` cases (DRAG-3.24, 4.27, 4.28) aren't mapped. The Test Planner's 12 `Manual` cases aren't mapped, but tests that carry or plainly cover them are reported.

**After the Test Planner's response:** the Addendum at the end maps the cases the Test Planner reopened, revised, added and deleted. For every case it names, it supersedes the sections before it. Totals reflect the catalog as it stands after the response: 113 cases, 99 of them `Open`.

**After the confirming run:** "Confirming run (2026-09-28)", the last section, records what the catalog now says.

## How to read this report

**Outcome codes,** one per `Open` case:

| Code | Meaning | At the confirming run |
|---|---|---|
| **Stamp** | A surface test (Playwright UI or API, or a server route test) already asserts the case's *Then*. It needs only the ID in its title, in the README form. | `Automated` |
| **Internal** | Only internal tests (client modules, server `lib/`) assert the case. It counts once Nathan approves; the fallback is named. | `Automated` if approved |
| **A3** | A gap A3 can close. The layer and the assertion are given in Gaps. | `Automated` once written |
| **S10** | A gap that needs a precise-move or timer-dependent drag E2E, so it routes to Epic 3.5 Story 10. | stays `Open`, routed |

**Where I drew D10's line** (Nathan may redraw it):
- **A3** covers route and API tests, unit tests, and UI tests that use only pickup, data-attribute reads, route interception, or the drag recipes the current specs already run reliably. Those recipes are: `POP_OUT_ONLY` and `awaitPoppedOut` to reach Board layer; `settleOnBand`, which picks a band by reading the machine's own `data-drag-band`; `SUSTAINED` for a pop out and back in; a Stub's pop outs on the shared clock (the DRAG-5.1 and DRAG-5.12 tests); the Stub-origin zoom into a childless Card (the DRAG-5.4 test); and `setBackDownLeaning`.
- **S10** covers any test that needs one of these:
  - a Free Card zoomed from a column into a Card. Both E2Es that do this are skipped as flaky: `tests/ui/drag-card-zoom-in.spec.ts`, and Story 8's notes;
  - a Card → Descendants hold with a tab (`tabBy`, Story 10 item 4);
  - a pixel-precise point at a band divider, or scroll geometry;
  - a release timed inside a clock's window;
  - a negative assertion that waits out a clock ("nothing zooms in after the full hold").

**Title forms.** The README wants `'<ID>[, <ID>]: …'`, with full IDs at the start. Almost no existing title matches. They use slashes (`DRAG-3.1 / 3.2`), prefix-less tails (`3.2`, `5.10`), qualifiers (`DRAG-1.3 (momentary)`) and IDs in mid-title parentheses. A literal search therefore finds fewer cases than the titles suggest: `DRAG-3.2`, `DRAG-3.7`, `DRAG-5.2`, `DRAG-5.10` and `DRAG-6.2` appear only as tails. Every re-stamp is listed in Proposed Stamps.

**Skipped tests** count as no coverage.

**File aliases** used in the tables:

| Alias | File |
|---|---|
| bands | `tests/ui/drag-column-bands.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |
| classify | `tests/ui/drag-target-classification.spec.ts` |
| zoom | `tests/ui/drag-card-zoom-in.spec.ts` (both tests `test.skip`) |
| xcol | `tests/ui/item-repositioning-cross-column-dnd.spec.ts` |
| xproj | `tests/ui/item-repositioning-cross-project-dnd.spec.ts` |
| boardsRoute | `server/tests/routes/boards.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| popSession | `client/src/components/workflow/popSession.test.ts` |
| placement | `client/src/components/workflow/placement.test.ts` |
| dragRequest | `client/src/components/workflow/dragRequest.test.ts` |
| dragRegions | `client/src/components/workflow/dragRegions.test.ts` |
| dragBands | `client/src/components/workflow/dragBands.test.ts` |
| dragCollision | `client/src/components/workflow/dragCollision.test.ts` |
| dragClassification | `client/src/components/workflow/dragClassification.test.ts` |
| dragOverlay | `client/src/components/workflow/dragOverlayGeometry.test.ts` |
| descProj | `client/src/components/workflow/descendantsProjection.test.ts` |
| reconcile | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| listOps | `client/src/components/workflow/itemListOps.test.ts` |
| tuning | `client/src/components/workflow/dragTuning.test.ts` |
| bandGuides | `client/src/components/BandGuides.test.tsx` |
| hierPlace | `client/src/lib/hierarchyPlacement.test.ts` |
| projTree | `client/src/components/sidebar/projectTreeUtils.test.ts` |

---

## Coverage Mapping

"By ID" means a surface test already carries the literal full ID and asserts the case. Titles are quoted from their start.

### DRAG-1 — Contexts, the layer stack, and popping

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-1.1 | P0 | detach "DRAG-1.1 / DRAG-5.9 (sibling bullets): a Stub's drag starts…" (Stub, depth 1); detach "decision 1: a grandchild Stub's drag starts in its containing Card's whole section…" (depth 2); bands "popping out: the cursor outside the context…" reads the merged column's context at pickup, incidentally. Internal: popSession "DRAG-1.1: starts locked in the origin context with nothing tracked" | The Stub and merged bullets only. Nothing covers the expanded sub-row start or the Unsorted start | A3 |
| DRAG-1.2 | P0 | bands "DRAG-3.4 / DRAG-1.3 (sustained) / DRAG-1.5…" lands between A and B without asserting the named anchor. Internal: dragCollision `dropAnchorFor` "moving up onto B…", "moving down onto C…" | No. The {A, after} / {B, before} split and the side highlight aren't asserted at the surface | S10 |
| DRAG-1.3 | P0 | bands "DRAG-3.4 / DRAG-1.3 (sustained) / DRAG-1.5…" (by ID); bands "popping out: the cursor outside the context past THRESHOLD frees the card…" (no ID; the direct test). Internal: popSession "DRAG-1.3 (sustained): outside for >= THRESHOLD pops out…" | Yes | Stamp (by ID) |
| DRAG-1.5 | P0 | bands "DRAG-3.4 / … / DRAG-1.5…" and bands "a card is locked to each context it pops into in turn…" (bullet 1); detach "DRAG-5.4: …" (bullet 2, for an item from outside the Card). Internal: placement "after popping in, the new context is where the item sorts" | Bullets 1–2. Bullet 3 (a release at Descendants after Card → Descendants) isn't asserted | S10 |
| DRAG-1.6 | P0 | bands "DRAG-3.8 / DRAG-1.6…" covers the second paragraph (through Board to the sibling sub-row's band). Internal: dragRegions "is null in the gap between two sub-rows (DRAG-1.6: …)" | Second paragraph only. No test releases in `W2` before the pop out | A3 |
| DRAG-1.7 | P0 | Internal only: popSession "§3.2: a card with no registered region — an invalid target, cycle-forming or depth-capped, … is never a candidate even though it can still be named for a reorder"; dragRegions "an id isValidCard rejects resolves no region at all…"; dragClassification `isValidParent` "is true only for a Valid target…" | At machine level. The wiring from classification to regions in `useBoardDnd.ts` is untested | Internal, else S10 |
| DRAG-1.8 | P0 | The same three internal tests (the popSession test names both invalid kinds) | As DRAG-1.7 | Internal, else S10 |
| DRAG-1.9 | P0 | bands "Board layer, a release between columns or over Unsorted writes nothing…" (tests the gap only, despite its title); xcol "5.a — hover C over Column Two, then release on an Unknown-status card" (Unsorted). Internal: dragRegions `childRegionAt` "is null between columns…", "is a bounded box (reconciliation #20)…", "is null in the gap between two sub-rows…"; popSession "follows the cursor: over nothing there is no hover, and no pop pending"; placement "popped out over nothing: no placement…" | The gap and Unsorted. Not the header or footer, the toolbar, the sub-row gaps, a broken column, or "no request is made" | A3 |
| DRAG-1.10 | P1 | Internal: dragRegions "clips a sub-row's region to its column's visible scroll box", "a sub-row scrolled fully out of view registers no region at all", the `clipToVisible` describe | Yes, at measurement level | Internal, else S10 |
| DRAG-1.12 | P1 | bands "popping out: … it can then pop back into the column it left" (X alone, so no anchor is asserted). Internal: popSession "can pop back into the column it just left" | The pop back in only. Neither `{A, before}` nor the middle-band set-down | A3 |
| DRAG-1.13 | P1 | Internal: popSession "a drag from outside every region (Unsorted) starts popped out and locks in the same way"; dragCollision "no context (picked up in Unsorted) and no hover: nothing to collide with" | No surface test | A3 |
| DRAG-1.16 | P0 | bands "DRAG-1.3 (momentary): brushing across another column while reordering…" wanders, then releases back over A, never over the foreign place. Internal: dragCollision "in-context: only the context container and the cards inside it are candidates" | No | S10 (paragraph 1 can be written in A3) |
| DRAG-1.17 | P0 | bands "DRAG-3.3 / DRAG-1.3 (momentary)…" (bullet 1: at Board layer the card under the cursor is ignored). Internal: popSession describe "popping out of a context the sample has no region for"; placement `overlayFormFor` "across a real pop-in (Column → Card) and pop-out…"; dragRegions "scopes to exactly the context region and its own children…"; dragCollision "hovering another region: `over` is exactly that region's container, never a card in it" | Bullet 1 only | S10 |
| DRAG-1.20 | P0 | Internal: dragRegions "scopes to exactly the context region and its own children — never a sibling column, never a foreign card"; dragCollision "in-context: only the context container and the cards inside it are candidates" | The merged half. Not the expanded sub-row half | Internal, else S10 |
| DRAG-1.21 | P1 | detach "DRAG-5.12: …" (Descendants → Card pop out, for a Stub). Internal: popSession describe "locked Card: zoom-in into its own Descendants section (Story 6 Phase D)" (4 tests) | The pop-out half and the childless rule. The zoom in and its release aren't asserted at the surface | S10 (named) |
| DRAG-1.22 | P1 | Internal: dragCollision "in-context: the dragged card's own row is a candidate too"; `dropAnchorFor` "over its own slot, nothing shuffles, and the lean still names a neighbor…". xcol 3.a and 3.b assert the write, not the absence of a shuffle | No surface assertion | A3 |
| DRAG-1.23 | P0 | bands "DRAG-1.3 (momentary): brushing…" (first slot → CAB); bands "DRAG-6.5: …" write 2 (first slot); xcol "1.b — drag C below card E, into the empty column space" (last slot → after E); bands "a card is locked to each context it pops into in turn…" (a ghost alone → workphase-only, position kept). Internal: `dropAnchorFor` "at either end there is one neighbor, whichever way it leans", "alone in its list: nothing to anchor to" | Yes, across these tests | Stamp |
| DRAG-1.24 | P0 | xcol describe "3: interior moves that stay in column 1 (\"drop it back where it was\")" (3.a, 3.b); xproj "3.a"/"3.b" (same rule). Internal: dragRequest "same workphase, empty others: any slot is identity…", "same workphase, non-empty others, a real anchor found: not identity…" | Paragraph 1 yes. Paragraph 2 (a card alone writes nothing) isn't asserted at the surface | A3 (stamp, plus one small test) |
| DRAG-1.25 | P1 | Internal: popSession describe "merged-column boundsRect — the 'still inside' test reads the outer body…" (4 tests); dragRegions "a merged column's boundsRect is its own outer body…", "a sub-row's boundsRect is undefined…" | Yes at machine level. The release's reposition isn't asserted | Internal, else S10 |
| DRAG-1.26 | P2 | None (bandGuides renders a locked column but asserts only the mount count) | No | A3 |
| DRAG-1.27 | P2 | None | No | A3 |
| DRAG-1.28 | P1 | Internal: dragOverlay `clampToCurrentContext` "a merged column bounds x only", "a sub-row bounds both axes" | Internal only | A3 (or approve the internal mapping) |
| DRAG-1.31 | P1 | Internal: tuning "merges a partial override over the defaults", `saveDragTuning` "round-trips through storage". Every drag spec seeds the storage key, incidentally | Persistence only | A3 |
| DRAG-1.4, 1.11, 1.14, 1.18, 1.19, 1.29, 1.30, 1.32 | — | Test Planner's `Manual`. Not mapped; see Manual Cases Carried or Covered | — | — |

### DRAG-2 — Target classification at drag start

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-2.1 | P0 | classify "every visible target is classified at pickup, stays classified while hovering, and clears on cancel" (V valid; the ID is only in a comment). Internal: dragClassification "a legal target is Valid (DRAG-2.1)" | Yes | Stamp |
| DRAG-2.2 | P0 | The same classify test (X, D, D1 cycle-forming; S isn't rendered, per §5a). Internal: dragClassification "the dragged item and every descendant are Cycle-forming, regardless of attachment (DRAG-2.2)" covers S | Yes; S only internally (Test Quality 13) | Stamp |
| DRAG-2.3 | P0 | The same classify test (tOk valid, tOver depth-capped; the cap is read from `GET /boards/:id`; height counted through the detached branch). Internal: dragClassification "depth-caps a target one level too deep, parameterized on cap = %i (DRAG-2.3, 2.6)", "subtree height counts detached descendants (ATT-4.5 via classification)" | Yes | Stamp |
| DRAG-2.4 | P1 | The same classify test hovers across the board, but seeds `NO_POP` | In part: it never pops, enters or leaves a context | A3 (extend) |
| DRAG-2.5 | P1 | Internal: dragClassification "only the Free descendants carry the relationship marker (DRAG-2.5)" | Internal only; the overlay's presence isn't asserted | A3 |
| DRAG-2.6 | P2 | classify asserts only the `depth-capped` state | No (the dimming isn't asserted) | A3 |
| DRAG-2.7 | P0 | classify (tOk and tOver are nested Stubs). Internal: dragClassification "Stubs are classified individually — no blanket exclusion (DRAG-2.7)" | Yes | Stamp |
| DRAG-2.8 | P1 | classify "a Stub drag is classified exactly like a Card would be — no blanket exclusion (Story 5, DRAG-2.8)" (second paragraph). Internal: dragClassification describe "classifyDragTargets — Stub drag (Story 5, full classification, DRAG-2.8)" | Second paragraph only. Nothing asserts Inert | A3 (may surface a code gap, Test Quality 15) |
| DRAG-2.9 | P1 | Internal: dragClassification "cycle-forming wins over depth-capped for a deep descendant" | Internal only | A3 (or approve the internal mapping) |
| DRAG-2.10 | P1 | boardsRoute "carries the item depth cap the API enforces"; classify builds its fixture from the board's `itemDepthCap`; hier "enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not (ATT-4.4)" | Yes, through the shared constant (Test Quality 9) | Stamp |

### DRAG-3 — Board-layer drop bands, and the dragged card's shape

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-3.1 | P0 | bands "DRAG-3.1 / 3.2: the top band places before the first item…" (XABC, position < 1). Internal: dragRequest "first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, 3.2)" | Yes | Stamp (by ID) |
| DRAG-3.2 | P0 | The same bands test (ABCX); bands "popped out, a release in a column is still that column's band" | Yes | Stamp |
| DRAG-3.3 | P0 | bands "DRAG-3.3 / DRAG-1.3 (momentary): the middle band released before THRESHOLD is a workphase-only move…" (workphase In Progress, position 2.5, ABXC). Internal: dragRequest "cross-column, no anchor: workphaseId alone (DRAG-3.3 outsider…)" | Yes | Stamp (by ID) |
| DRAG-3.4 | P0 | bands "DRAG-3.4 / DRAG-1.3 (sustained) / DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side" | Yes (the landing slot differs from the case's example, Test Quality 16) | Stamp (by ID) |
| DRAG-3.5 | P1 | bands "DRAG-3.1 / 3.2 … (DRAG-3.5: at the configured carve-outs)" doesn't assert it (Test Quality 1). Internal: dragBands "switches exactly at the boundaries bandBoundaries reports…", "moves with the shortCard height — the gap plays no part in the 2+-card edge" | Divider positions internally only. Neither the dead-zone heights nor a release either side of a divider | S10 |
| DRAG-3.6 | P0 | bands "DRAG-3.6 / 3.7: a merged column takes the entry workphase for an outsider…" (top band) | Yes | Stamp (by ID) |
| DRAG-3.7 | P0 | The same bands test (Y). Internal: placement "DRAG-3.7: Board layer — a covered-set member keeps its own workphase in the preview"; dragRequest "same workphase, non-empty others… (DRAG-3.7 top/bottom)" | Yes | Stamp |
| DRAG-3.8 | P0 | bands "DRAG-3.8 / DRAG-1.6: an expanded column resolves per sub-row…" | Yes | Stamp (by ID) |
| DRAG-3.9 | P0 | bands "DRAG-3.9: a done column produces no anchor — every band is a workphase-only move" (one point of the single band). Internal: placement "DRAG-3.9: Board layer — a done region previews no positioned insert in any band…"; dragBands "a terminal region is a single band regardless of card count" | Yes | Stamp (by ID) |
| DRAG-3.10 | P1 | bands "DRAG-3.10: an empty column is a workphase-only move in any band". Internal: dragBands "an empty region is a single band"; dragRequest "empty others: first/last send a bare workphase move… (DRAG-3.10)" | Yes | Stamp (by ID) |
| DRAG-3.11 | P1 | bands "DRAG-3.1 / 3.2…" (the ghost first, mid-drag) and "DRAG-3.3 / …" (the ghost at its kept position). Internal: placement "DRAG-3.11: Board layer — the hovered band picks the slot…" | The top and middle bands. The bottom band isn't polled mid-drag | A3 (extend) |
| DRAG-3.12 | P0 | Internal: dragRequest "same workphase, slot existing: always identity (middle band member, TC-7.16)" | No surface test | A3 |
| DRAG-3.15 | P1 | Internal: dragBands "exactly one card halves the edge to (heightPx + gapPx) / 2…"; popSession "Board layer: the band also reads the region's live card count on every sample…" | Yes, at band-math level | Internal, else S10 |
| DRAG-3.16 | P1 | None. The dragRegions clipping tests are about whether the cursor is in the region, which is DRAG-1.10 | No | A3 (internal, new test), else S10 |
| DRAG-3.17 | P2 | bands "the reservation invariant: hovering a region never changes its own rendered height…"; bands "the reservation invariant: an expanded column's own empty sub-row doesn't shift… (audit epic-3-5-story-4 #2)" | The first half. The collapse while locked isn't asserted | A3 (extend) |
| DRAG-3.18 | P2 | None | No | A3 |
| DRAG-3.19 | P2 | classify asserts S is absent during X's drag. Internal: placement `overlayFormFor` "Board layer, merely hovering a column…: the shortCard", "locked in a column/sub-row: the shortCard"; dragOverlay `overlayShapeFor` "anywhere else, or with no drag: the shortCard…" | In part | A3 |
| DRAG-3.20 | P2 | None. bands reads `data-drag-band` and the divider positions as helpers, never as assertions | No | A3 (may need a ruling, Test Quality 15) |
| DRAG-3.21 | P1 | Internal: popSession "Board layer: the band reads the region's live rect on every sample, not one frozen at entry", "…live card count on every sample…". The bands reservation tests cover the second sentence | Yes, at machine level | Internal, else S10 |
| DRAG-3.22 | P2 | Internal: placement `overlayFormFor` "locked at a Card layer: the Stub", "locked at a Descendants layer: the Stub", "across a real pop-in … and pop-out…"; dragOverlay describes `overlayWidthFor`, `overlayShapeFor`, `reanchorOverlayTransform` | Internal, in part (no "held" shadow) | S10 (named, by content) |
| DRAG-3.23 | P0 | Internal: placement "a done region never anchors, even onto one of its own cards — same fallback as a bare container (audit epic-3-5-story-3-reconciled #4)" | No surface test | A3 |
| DRAG-3.24 | P1 | `Pending PO`, skipped | — | — |

### DRAG-4 — Card → Card attach and hierarchy placement

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-4.1 | P0 | zoom "a Card in the drag's own column: pop out, pop back in, then zoom into it and attach" (skipped). Internal: dragRequest "attach: parentId + isAttached, never an anchor…", "a detached child re-attaching to its own former parent is not identity…"; placement "TC-4: at a *different* Card, the within-action is attach as its last child". Route (consequence only): hier "attaches with placement… (TC-7.11, ATT-3.6)", "a detached child re-attached to the parent it still names is a real attach (ATT-7.6)" | No surface test | S10 (named) |
| DRAG-4.2 | P1 | Route (consequence only): hier "cascades projectId to the whole subtree… (ATT-5.1, ATT-5.2, TC-7.14)" | The gesture isn't covered | S10 |
| DRAG-4.3 | P1 | Route (consequence only): hier "attaching to a done parent inherits the terminal workphase… (ATT-6.1, TC-7.15)" | The gesture isn't covered | S10 |
| DRAG-4.5 | P0 | None. xcol and xproj's skipped "drag C onto card X" tests are the old interim default (Story 10 item 3) | No | S10 (named) |
| DRAG-4.8 | P0 | Internal: hierPlace describe "depthRangeFor" (5 tests), "depthRangeFor + resolvePlacement — every reachable depth in a gap" "enumerates every depth…", `flattenHierarchy` "excludes the given ids, and never walks into their children"; dragCollision "steps past rows that travel with the dragged item", "over a Stub row: the same shuffle-slot rule…"; descProj "the named row moves the gap; a sample naming none keeps it" | Yes, at rule level | Internal, else S10 (named) |
| DRAG-4.9 | P0 | Internal: hierPlace "TC-9: Top + 1 (depth 3) is Top's first child…", "TC-9: Top's own depth (2) is Top's sibling…"; descProj "with no anchor, the resolved parent's first child" | Yes | Internal, else S10 (named) |
| DRAG-4.10 | P0 | Internal: hierPlace "TC-10: one tab left (depth 1)…", "TC-10: two tabs left (depth 0, Bottom's depth)…" | Yes | Internal, else S10 (named) |
| DRAG-4.11 | P1 | Internal: hierPlace describe "resolvePlacement — TC-11's boundaries" (6 tests), the `depthRangeFor` boundary tests, `computeProjection` "clamps to the gap's own hi…" and "…lo…" | Nearly all; the "if the last item were nested" example isn't asserted | Internal, else S10 (named) |
| DRAG-4.12 | P1 | detach "DRAG-5.4: …" (Q is childless; X becomes its attached child). Internal: popSession "a childless Card (no Descendants region at all) never pops any further…"; dragRequest "attach: … never an anchor…". Route: hier "attaching into an empty Stub list takes the append fallback — bootstrap 1.0 (TC-7.7, ATT-3.3)" | In part: "sole child" and "no anchor, append fallback" aren't asserted in the UI | A3 (extend DRAG-5.4's test; Story 10 item 2 lists it) |
| DRAG-4.13 | P1 | Route (consequence only): hier ATT-6.1 / TC-7.15 | The gesture isn't covered | S10 (named) |
| DRAG-4.14 | P0 | Internal: placement "TC-4: …" passes no `over`, so it never exercises "wherever the cursor rests" | No | S10 (named) |
| DRAG-4.15 | P0 | zoom "a Card in a different column: pop out, pop into its column, then zoom into it and attach" (skipped) | No | S10 (named) |
| DRAG-4.16 | P1 | None | No | S10 (named) |
| DRAG-4.17 | P0 | Internal: the pop-out half of placement `overlayFormFor` "across a real pop-in … and pop-out…" | No | S10 (named) |
| DRAG-4.18 | P0 | Internal: descProj "over the cap the state is still offered, marked invalid", "writes nothing over the cap, or with no projection"; hierPlace "validity is per state, decided by the caller…", "excludes the dragged subtree, so no depth can ever resolve a cycle" | All but the visible cue | Internal, else S10 (named) |
| DRAG-4.19 | P0 | Internal: popSession "holding it through the cue pops into the named Card, wherever the bare cursor happens to be" | Yes, at machine level | Internal, else S10 |
| DRAG-4.20 | P1 | Internal: popSession "holding the named relation past the dwell shows the cue phase, still locked in the column…", "popDueAt schedules the dwell-end milestone first…" | The order, at machine level. Not the cue, the locked outline or the placeholder Stub | S10 |
| DRAG-4.21 | P1 | None | No | S10 |
| DRAG-4.22 | P1 | Internal: popSession "a different named card resets the hold from the dwell, even mid-cue", "the same card on its other side resets the hold too — wiki §6's own reset rule" | A change of relation, yes. The pop out, the cancel and the cue disappearing aren't asserted | S10 |
| DRAG-4.23 | P1 | Internal: popSession "nothing named (alone in the list, or hovering nothing): no candidate at all"; `dropAnchorFor` "alone in its list: nothing to anchor to" | Yes, at machine level | Internal, else S10 |
| DRAG-4.26 | P1 | Internal: hierPlace "a null root (the sidebar's virtual top)…", "an empty hierarchy under a null (sidebar virtual) root reads parentId null", describe "resolvePlacement — a Top whose children are hidden from rows (a collapsed Top)", the `computeProjection` describe; projTree `resolveGap`, `eligibleRows`, `fullChildrenOf`. No sidebar drag test at any layer (`tests/ui/project-sidebar.spec.ts` has none) | The shared rule only. The indicator line and "the release saves what the line shows" aren't asserted | S10, or the sidebar follow-up story |
| DRAG-4.24, 4.25 | — | Test Planner's `Manual` | — | — |
| DRAG-4.27, 4.28 | — | `Pending PO`, skipped | — | — |

### DRAG-5 — Stub → out: detach

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-5.1 | P0 | detach "DRAG-5.1 / 5.2 / 5.10: two pops detach the Stub into its own column…" (isAttached 0, parentId P, position not null, renders as a Card). Internal: dragRequest "detach (parentId: null on the placement): … (TC-1)"; placement "TC-1: a real anchor at the column layer resolves exactly like any Card's anchor+side" | In part: the anchor (`{Q, after}`) isn't asserted | A3 (extend) |
| DRAG-5.2 | P0 | The same detach test, in a one-workphase column where it can't fail (Test Quality 6). Internal: dragRequest "TC-2: detaching within the same covered set sends no workphaseId field at all" | No | A3 |
| DRAG-5.3 | P0 | Internal: placement "TC-3: Board layer (genuinely popped out) also previews Free at the append slot" | No surface test | A3 |
| DRAG-5.4 | P0 | detach "DRAG-5.4: zoomed into a different Card instead, it reparents…" | Yes (Test Quality 7) | Stamp (by ID) |
| DRAG-5.9 | P0 | detach "DRAG-1.1 / DRAG-5.9 (sibling bullets)…" commits a reorder but asserts no anchor. Internal: descProj "a Stub's pickup seeds at its own slot and depth…", "while held, the depth is the pointer's travel since entry, in indents", "over the cap the state is still offered, marked invalid", "writes nothing over the cap…"; dragRequest "a Descendants-layer sibling reorder…: sends only the anchor + side" | In part | S10 (named: the tab-right and over-cap bullets) |
| DRAG-5.10 | P1 | The same detach test (gone from P's section, an article in the column). Internal: placement `overlayFormFor` | In part: not the copies' form, the zoom into Q, or the cancel | A3 (extend) |
| DRAG-5.12 | P0 | detach "DRAG-5.12: released back at its own containing Card's layer, nothing is written…" | Yes | Stamp (by ID) |
| DRAG-5.13 | P1 | detach "decision 1: a grandchild Stub's drag starts in its containing Card's whole section…" (first half) | The first half only | A3 (extend) |
| DRAG-5.14 | P1 | Internal: placement "a terminal region still previews existing (nothing anchorable there) even for a detaching Stub" | No surface test | A3 |
| DRAG-5.5, 5.11 | — | Test Planner's `Manual` | — | — |

### DRAG-6 — Optimistic preview, reconciliation, and failure

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-6.1 | P0 | bands "DRAG-6.1 / 6.2: the drop is drawn at its slot and marked pending until the response lands…". Internal: listOps "TC-2.27: places an item after its anchor by index — its position is untouched" | Yes | Stamp (by ID) |
| DRAG-6.2 | P0 | The same bands test (the pending marker). Internal: listOps "a placement with a workphaseId moves the item into that list without changing the item (TC-2.30: position kept, not null)" | In part: "another item's response re-sorts the list" isn't exercised | A3 (extend) |
| DRAG-6.3 | P0 | Internal: reconcile "applies every reindexed pair the list holds, then the written item (§5a order)", "the written row wins over its own pair when they disagree…", "TC-5a.2: applies the reindex first, so a correct response is not read as an inversion; clears the placement" | Yes, at state level | Internal, else A3 (UI) |
| DRAG-6.4 | P1 | Internal: reconcile "DRAG-6.4: a response that inverts the previewed order is applied *and* recorded as an inversion" | In part: not the panel's log, the console, or surviving a reload | A3 |
| DRAG-6.5 | P0 | bands "DRAG-6.5: re-dragging a pending item — the later write wins even when its response lands first" | Yes | Stamp (by ID) |
| DRAG-6.6 | P0 | Internal: dragRequest "DRAG-6.6: a rejected move fails the write (the guess is dropped) and resyncs via loadBoard" (the tracker and `loadBoard` are mocked) | Internal only | A3 (UI), or approve the internal mapping |
| DRAG-6.7 | P1 | Internal: dragRequest "#15: a stale response's own row is still discarded, but resyncs instead of losing the reindex pairs it carried", "a stale response with no reindex disclosed needs no resync" (Test Quality 10) | In part | A3 |
| DRAG-6.8 | P1 | None. placement's "priorPlacement (a re-dragged item)" describe is about the ghost during a re-drag, not the restore on cancel | No | A3 |
| DRAG-6.9 | P1 | Internal: reconcile "a response for a write whose placement has since been replaced… leaves the current placement and the tripwire alone" | In part | A3 (see Proposed Manual) |
| DRAG-6.10 | P1 | Internal: placement "#29: Board layer — an active region with no anchor previews last, not existing…"; listOps `workphaseOnlySlot` "keeps the position sort when there is a position to keep, appends otherwise" | Yes, at state level | Internal, else A3 (UI) |
| DRAG-6.11 | P1 | Internal: listOps "draws an item with no completedAt at the end of a done list, where the server will stamp it" | Internal only | A3 |
| DRAG-6.12 | P1 | Internal: placement "TC-1/2/3: reaching a card-list region previews Free (parentId: null) and rests at \"last\"…", "TC-1: a real anchor at the column layer…", "TC-3: Board layer…" | Yes, at state level | Internal, else S10 |

---

## Lost Coverage

**None.** No case anywhere in the catalog is `Automated`:
- board-drag-interaction's cases are all `Open`, `Manual` or `Pending PO`;
- item-attachment and item-positioning still carry the legacy ✅/⏳ marks. Batches 4 and 5 convert them, and the unbacked-✅ check belongs to those batches' proposing runs.

## Unknown IDs

**None.**
- Every DRAG ID in a test title resolves to a case heading: DRAG-1.1, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.5, 2.7, 2.8, 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 5.1, 5.4, 5.9, 5.12, 6.1, 6.4, 6.5 and 6.6.
- The ATT and TC IDs in titles resolve too, per batch 3 step 1's `case-id` run (0 hits across the tests).
- `scripts/check-docs/check.test.mts` has DRAG-7.1 and DRAG-9.9, but inside assertion strings, as checker fixtures. They aren't test titles.

Two things aren't unknown IDs, but a Coder needs them:
- **Bare `TC-n` in 16 titles.** The checker's `bare-case-id` rule flags them, so they aren't resolvable IDs. They're the pre-rename DRAG-4 and DRAG-5 forms, and each is qualified in Proposed Stamps.
- **Known IDs whose meaning moved:**
  - popSession "DRAG-1.4: the clock runs wherever the cursor is outside…". DRAG-1.4 is now "Brushing past a Card while repositioning never attaches" (`Manual`).
  - The three titles tagged "DRAG-1.3 (momentary)". The momentary half became DRAG-1.30 (`Manual`).

  Details are under Manual Cases Carried or Covered.

## Manual Cases Carried or Covered (the Test Planner's)

These cases are left alone. Each entry is for the Test Planner to judge.

| Case | Test that carries or plainly covers it | Note |
|---|---|---|
| DRAG-1.4 | popSession "DRAG-1.4: the clock runs wherever the cursor is outside, from whenever it first left — wandering to a different foreign point never restarts it…" **carries the ID** | A stale meaning: the test's rule is §3.1's "the pop-out clock starts … wherever it goes", which no live case states on its own (Candidate New Cases 1). Recommend the Coder drop DRAG-1.4 from the title. |
| DRAG-1.30 | popSession "DRAG-1.3 (momentary): coming back inside before THRESHOLD resets the clock" **plainly covers it** | Parameterized on the tuning value, so its pass doesn't depend on the value. The reason "its pass depends on a tunable threshold" may not hold for a state-machine test. If the case reopens, this is an internal mapping for Nathan. |
| DRAG-1.11 | popSession "the top and bottom bands never pop in, however long; moving to another column restarts the clock", "the pop-in clock starts at the pop-out, not at the region entry…", "resting in a middle band past the pop-in threshold locks the card into that column" **plainly cover most of it** | Same point as DRAG-1.30. Not covered: time spent in the top band counting, then a slide into the middle band popping in at once. |
| DRAG-1.14 | popSession "the distance term pops out as soon as the cursor is far enough from the context (either satisfies)", "the distance term also measures against the outer body for a merged column"; dragBands `distanceOutside` **plainly cover it** | Same point. Not covered: the Card and Descendants layers, and `popDistancePx = 0`. |
| DRAG-5.11 | detach "audit #2 regression: a yank past both pop-out distances in one sample cascades Descendants -> Card -> Column, and an immediate release detaches" **plainly covers its first half** | Every clock is `NO_POP`, and only `popDistancePx: 10` fires, in one sample. It's deterministic, so "depends on tunable thresholds" may not hold for this path. The "stops inside P's box → only one pop" half isn't covered. |
| DRAG-1.32 | bands "DRAG-1.3 (momentary): brushing across another column while reordering never leaves the context" **claims the rule in its title** | It seeds `NO_POP`, so nothing can pop and the claim is guaranteed by the preset (Test Quality 3). Recommend re-stamping it DRAG-1.23. |
| DRAG-1.18, 1.19, 1.29, 4.24, 4.25, 5.5 | none | — |

---

## Proposed Stamps

These are surface tests, so they need no approval. Each row gives the prefix to add; the rest of the title is the Coder's, with provenance stripped. "Strip" names the provenance in each title.

### `tests/ui/drag-column-bands.spec.ts`

| Current title (start) | Proposed prefix | Notes |
|---|---|---|
| "DRAG-3.1 / 3.2: the top band places before the first item, the bottom band after the last (DRAG-3.5: at the configured carve-outs)" | `DRAG-3.1, DRAG-3.2, DRAG-3.11:` | Drop DRAG-3.5 (Test Quality 1). DRAG-3.11 stays partial until the bottom-band poll is added. |
| "the reservation invariant: hovering a region never changes its own rendered height…" | `DRAG-3.17:` | Partial until the lock-collapse check is added. |
| "the reservation invariant: an expanded column's own empty sub-row doesn't shift by its droppable padding either (audit epic-3-5-story-4 #2)" | `DRAG-3.17:` | Strip "(audit epic-3-5-story-4 #2)". |
| "DRAG-3.3 / DRAG-1.3 (momentary): the middle band released before THRESHOLD…" | `DRAG-3.3, DRAG-3.11:` | Drop DRAG-1.3: "momentary" here means `popInDelayMs` seeded at 60 s. |
| "DRAG-3.4 / DRAG-1.3 (sustained) / DRAG-1.5: holding in the middle band pops out, then in…" | `DRAG-3.4, DRAG-1.3, DRAG-1.5:` | DRAG-1.5 stays partial (S10). |
| "popping out: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left" | `DRAG-1.3, DRAG-1.12:` | DRAG-1.12 stays partial (A3 extends). |
| "popped out, a release in a column is still that column's band" | `DRAG-3.2:` | Duplicates the DRAG-3.1 test's bottom half. |
| "a card is locked to each context it pops into in turn — In Progress, then Review" | `DRAG-1.5, DRAG-1.23:` | DRAG-1.23's "ghost alone" bullet. |
| "DRAG-1.3 (momentary): brushing across another column while reordering never leaves the context" | `DRAG-1.23:` | Retitle to what it asserts, a first-slot reorder (C before A). Drop DRAG-1.3 (Test Quality 3). |
| "Board layer, a release between columns or over Unsorted writes nothing…" | `DRAG-1.9:` | Fix the title or add Unsorted (Test Quality 2). |
| "DRAG-3.6 / 3.7: a merged column takes the entry workphase…" | `DRAG-3.6, DRAG-3.7:` | — |
| "DRAG-3.8 / DRAG-1.6: an expanded column resolves per sub-row…" | `DRAG-3.8, DRAG-1.6:` | DRAG-1.6 stays partial (A3 adds paragraph 1). |
| "DRAG-6.1 / 6.2: the drop is drawn at its slot…" | `DRAG-6.1, DRAG-6.2:` | DRAG-6.2 stays partial. |
| "DRAG-3.9: …", "DRAG-3.10: …", "DRAG-6.5: …" | already in form | — |

### `tests/ui/drag-5-stub-detach.spec.ts`

| Current title (start) | Proposed prefix | Notes |
|---|---|---|
| "DRAG-1.1 / DRAG-5.9 (sibling bullets): a Stub's drag starts at its containing Card's Descendants layer…" | `DRAG-1.1, DRAG-5.9:` | Both stay partial. |
| "decision 1: a grandchild Stub's drag starts in its containing Card's whole section…" | `DRAG-1.1, DRAG-5.13:` | Strip "decision 1". DRAG-5.13 stays partial (A3 extends). |
| "DRAG-5.1 / 5.2 / 5.10: two pops detach the Stub into its own column…" | `DRAG-5.1, DRAG-5.10:` | **Drop DRAG-5.2** (Test Quality 6). |
| "DRAG-5.4: zoomed into a different Card instead, it reparents…" | `DRAG-5.4, DRAG-4.12:` | DRAG-4.12 lands with the A3 extension. |
| "audit #2 regression: a yank past both pop-out distances in one sample cascades…" | — | Strip "audit #2 regression". Whether it gets DRAG-5.11 is the Test Planner's call. |
| "decision 4 regression: immediately after a detach, the same item drags and reorders normally as a Card" | — | Strip "decision 4 regression". An uncatalogued regression guard. |

### `tests/ui/drag-target-classification.spec.ts`

| Current title (start) | Proposed prefix | Notes |
|---|---|---|
| "every visible target is classified at pickup, stays classified while hovering, and clears on cancel" | `DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10:` | DRAG-2.4 stays partial until it pops. |
| "a Stub drag is classified exactly like a Card would be — no blanket exclusion (Story 5, DRAG-2.8)" | `DRAG-2.8:` | Strip "Story 5". Partial until Inert is asserted. |

### Other surface files

| File | Current title (start) | Proposed prefix | Notes |
|---|---|---|---|
| `tests/ui/item-repositioning-cross-column-dnd.spec.ts` | "3.a — set C back down in its own slot, leaning up: \"after A\"" and "3.b — … leaning down: \"before E\"" (or their describe "3: interior moves that stay in column 1…") | `DRAG-1.24:` | Batch 5 may add TC IDs to the same tests. |
| same | "1.b — drag C below card E, into the empty column space" | `DRAG-1.23:` | The last-slot bullet. |
| same | "5.a — hover C over Column Two, then release on an Unknown-status card" | `DRAG-1.9:` | — |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | "3.a — set C back down…", "3.b — …" | `DRAG-1.24:` (optional) | Duplicates xcol's 3.a/3.b. |
| `server/tests/routes/boards.test.ts` | "carries the item depth cap the API enforces" | `DRAG-2.10:` | Test Quality 9. |
| `tests/ui/drag-card-zoom-in.spec.ts` (skipped) | "a Card in a different column: pop out, pop into its column, then zoom into it and attach" | `DRAG-4.15:` | When Story 10 un-skips it. |
| same (skipped) | "a Card in the drag's own column: pop out, pop back in, then zoom into it and attach" | `DRAG-4.1:` | When Story 10 un-skips it. |

### Bare `TC-n` in internal test titles

Batch 3's Coder step qualifies these whether or not Nathan approves the mappings below. Approval only decides whether they count.

| File | Current title | Qualified prefix |
|---|---|---|
| hierPlace | describe "resolvePlacement — TC-9 / TC-10's worked gap" | `DRAG-4.9, DRAG-4.10:` |
| hierPlace | "TC-9: Top + 1 (depth 3) is Top's first child…" and "TC-9: Top's own depth (2)…" | `DRAG-4.9:` |
| hierPlace | "TC-10: one tab left (depth 1)…" and "TC-10: two tabs left (depth 0, Bottom's depth)…" | `DRAG-4.10:` |
| hierPlace | describe "resolvePlacement — TC-11's boundaries" | `DRAG-4.11:` |
| placement | "TC-12: at its own containing Card, the within-action is origin itself…" | `DRAG-5.12:` |
| placement | "TC-4: at a *different* Card, the within-action is attach as its last child" | `DRAG-5.4:` |
| placement | "TC-9 (sibling bullets): at its own Descendants section, mid-drag (… Story 6 Phase D) sits at origin…" | `DRAG-5.9:` (strip "Story 6 Phase D"; Test Quality 14) |
| placement | "TC-1/2/3: reaching a card-list region previews Free (parentId: null) and rests at \"last\"… (decision 5)" | `DRAG-6.12:` (strip "(decision 5)"). The old TC-1/2/3 were DRAG-5.1–5.3, but the rule it asserts is now DRAG-6.12 |
| placement | "TC-1: a real anchor at the column layer resolves exactly like any Card's anchor+side" | `DRAG-5.1:` |
| placement | "TC-3: Board layer (genuinely popped out) also previews Free at the append slot" | `DRAG-5.3, DRAG-6.12:` |
| dragRequest | "a Stub's own origin, placed back at itself, is identity — TC-12's set-back-down" | `DRAG-5.12:` |
| dragRequest | "attach: parentId + isAttached, never an anchor — … (Story 4/5 TC-4, no manual placement among Stubs until Story 6)" | `DRAG-4.1, DRAG-5.4:` (strip the parenthetical). "Story 4 TC-4" was DRAG-4.4, which is deleted |
| dragRequest | "detach (parentId: null on the placement): isAttached false, … (TC-1)" | `DRAG-5.1:` |
| dragRequest | "TC-2: detaching within the same covered set sends no workphaseId field at all" | `DRAG-5.2:` |

**A conflict for the batch check.** The checker's `bare-case-id` rule also flags comments, and the batch runs `--rules case-id,bare-case-id` on every test file it touches. Comments are A4's. These touched files have bare `TC-n` in comments:

| File | Lines | Bare IDs |
|---|---|---|
| hierPlace | 14, 149, 176, 207, 282 | TC-8, TC-9, TC-10, TC-11, TC-18 |
| placement | 239 | TC-1/2/4/5/9/12 |
| dragRequest | 75, 84, 192 | TC-12; "Story 5's TC-1/2/4/9"; TC-1/2/3 |
| dragClassification | 134 | TC-4 |
| classify | 141 | TC-4 |

Either the Coder qualifies these comments in A3, or the check runs `--rules case-id` only on these files until A4. Nathan's call.

---

## Proposed Internal Mappings (need approval)

### Cases only internal tests cover (17)

If approved, each becomes `Automated` at the confirming run, with the file below on its pointer line. If not, the fallback applies.

| Case | File | Tests | Covers | If declined |
|---|---|---|---|---|
| DRAG-1.7 | popSession, dragRegions, dragClassification | "§3.2: a card with no registered region…"; "an id isValidCard rejects resolves no region at all…"; `isValidParent` "is true only for a Valid target…" | "Never a zoom-in candidate, still nameable". The classification → region wiring in `useBoardDnd.ts` is untested | S10 |
| DRAG-1.8 | same | same | same | S10 |
| DRAG-1.10 | dragRegions | "clips a sub-row's region to its column's visible scroll box"; "a sub-row scrolled fully out of view registers no region at all"; the `clipToVisible` describe | Whether the region is measured | S10 |
| DRAG-1.20 | dragRegions, dragCollision | "scopes to exactly the context region and its own children…"; "in-context: only the context container and the cards inside it are candidates" | The merged half; not the expanded sub-row half | S10 |
| DRAG-1.25 | popSession, dragRegions | describe "merged-column boundsRect…" (4); "a merged column's boundsRect is its own outer body…"; "a sub-row's boundsRect is undefined…" | Whether the context holds; not the release | S10 |
| DRAG-3.15 | dragBands, popSession | "exactly one card halves the edge to (heightPx + gapPx) / 2…"; "…live card count on every sample…" | Where the divider sits; the request per band is DRAG-3.1/3.3's | S10 |
| DRAG-3.21 | popSession (+ the bands reservation tests) | "Board layer: the band reads the region's live rect on every sample…"; "…live card count…" | Full, at machine level | S10 |
| DRAG-4.8 | hierPlace, dragCollision, descProj | describe "depthRangeFor"; "enumerates every depth in the gap's range…"; `flattenHierarchy` "excludes the given ids…"; "steps past rows that travel with the dragged item"; "the named row moves the gap…" | Full, at rule level | S10 (named) |
| DRAG-4.9 | hierPlace, descProj | the two "TC-9: …" tests; "with no anchor, the resolved parent's first child" | Full | S10 (named) |
| DRAG-4.10 | hierPlace | the two "TC-10: …" tests | Full | S10 (named) |
| DRAG-4.11 | hierPlace | describe "resolvePlacement — TC-11's boundaries"; the `depthRangeFor` boundary tests; `computeProjection` clamps | Nearly full | S10 (named) |
| DRAG-4.18 | descProj, hierPlace | "over the cap the state is still offered, marked invalid"; "writes nothing over the cap…"; "validity is per state…"; "excludes the dragged subtree, so no depth can ever resolve a cycle" | All but the visible cue | S10 (named) |
| DRAG-4.19 | popSession | "holding it through the cue pops into the named Card, wherever the bare cursor happens to be" | Full, at machine level | S10 |
| DRAG-4.23 | popSession, dragCollision | "nothing named (alone in the list, or hovering nothing): no candidate at all"; "alone in its list: nothing to anchor to" | All but "no side highlight shows" | S10 |
| DRAG-6.3 | reconcile | "applies every reindexed pair the list holds, then the written item (§5a order)"; "the written row wins over its own pair…"; "TC-5a.2: applies the reindex first…" | Full, at state level | A3 (UI through route interception) |
| DRAG-6.10 | placement, listOps | "#29: Board layer — an active region with no anchor previews last…"; `workphaseOnlySlot` "keeps the position sort … appends otherwise" | Full, at state level | A3 (UI) |
| DRAG-6.12 | placement | "TC-1/2/3: reaching a card-list region previews Free…"; "TC-1: a real anchor at the column layer…"; "TC-3: Board layer…" | Full, at state level | S10 |

### Optional supporting pointers

These cases are covered, or to be covered, at a surface. Approving these only adds the internal file to the pointer line:
- DRAG-2.1, 2.2, 2.3, 2.7, 2.8, 2.9: dragClassification. DRAG-2.2's attached Stub `S` is asserted only here.
- DRAG-3.3, 3.7, 3.9, 3.10, 3.11: placement, dragRequest, dragBands.
- DRAG-1.22, 1.23, 1.24: dragCollision `dropAnchorFor`, and dragRequest `isIdentity`.
- DRAG-1.28: dragOverlay `clampToCurrentContext`.
- DRAG-1.31: tuning.
- DRAG-2.5: dragClassification "only the Free descendants carry the relationship marker".
- DRAG-6.6: dragRequest "DRAG-6.6: …".

**Not proposed:** popSession "DRAG-1.1: starts locked in the origin context…" and "a drag from outside every region (Unsorted) starts popped out…". They check that `startPopSession` echoes its argument, not which context a pickup chooses (Test Quality 5).

---

## Proposed Manual (need approval)

**None.** No `Open` case is genuinely hard to automate. The precise and timed ones route to Story 10, whose item 8 makes the flakiness call case by case.

One conditional: DRAG-6.9's clause "at most a single render shows `X` without its ghost" can't be pinned through Playwright without instrumenting renders. If the Test Planner splits that clause into its own case, I'd propose that case `Manual`: a single-frame render isn't observable at the surface. The rest of DRAG-6.9 is in A3's list.

---

## Gaps

### Closable in A3 (38)

Layer UI means `tests/ui/`, and each UI test uses only the recipes named in "How to read this report".

| Case | Layer | What the test asserts |
|---|---|---|
| DRAG-1.1 | UI | At pickup with no further move, the starting context is:<ul><li>merged column → `data-drag-context` = `columnRegionKey`;</li><li>expanded column → `subrowRegionKey(col, wp)`;</li><li>an Unsorted item → `data-drag-state` = `popped-out` and no context;</li><li>a depth-2 Stub → `descendantsRegionKey(containing Card)`.</li></ul> |
| DRAG-1.6 | UI | Paragraph 1, with `NO_POP` and an expanded fold: X in the In Progress sub-row, cursor into the Review sub-row, release. X keeps its workphase and slot. |
| DRAG-1.9 | UI | With `POP_OUT_ONLY`, after `awaitPoppedOut`, release over a column header, the toolbar, the gap between sub-rows, below the last sub-row, and a broken column (the gap and Unsorted are already stamped). Each time: no `PATCH /move` request (`page.on('request')`), fields unchanged, the card back in place. |
| DRAG-1.12 | UI | Extend the stamped test with A, B before X. After popping back in, hover A: the ghost takes the first slot, so `{A, before}` whatever the lean. Order XAB. Second, with `POP_OUT_ONLY`: pop out, return to the column's own middle band, release. No request. |
| DRAG-1.13 | UI | Seed an item in an uncovered workphase, so it's in Unsorted. Pickup → popped out, no context. A release over Unsorted writes nothing. `settleOnTopBand` in a column → a workphase change, before the first card. `SUSTAINED` in the middle band → locked in that column. |
| DRAG-1.22 | UI | From A, X, B, pick X and hover its own centre. A and B don't move (`boxOf` before and after), and the ghost stays between them. |
| DRAG-1.24 | UI | Stamp xcol 3.a/3.b. Add: pick up a card alone in its column and release it in place. No request, position unchanged. |
| DRAG-1.26 | UI | Seed a distinctive `activeContextOutlineColor`. Exactly one outline at a time, in that colour:<ul><li>locked in a column → the column;</li><li>popped out → none;</li><li>a Stub's pickup → the section;</li><li>popped out to `card:P` (DRAG-5.12's recipe) → P;</li><li>DRAG-5.4's zoom recipe → Q.</li></ul> |
| DRAG-1.27 | UI | At pickup the DragOverlay copy has a non-identity rotation. |
| DRAG-1.28 | UI | With `NO_POP`, cursor far to the side: the overlay's box stays within the merged column's x-range and still tracks y. In a sub-row, y stays within the sub-row. (Or approve dragOverlay.) |
| DRAG-1.31 | UI | Open the panel (today, "Drag tuning" in the toolbar). The ten named values are present. Change one; after a reload it's still in effect, and a drag behaves by it. |
| DRAG-2.4 | UI | Extend the stamped classify test to use `POP_OUT_ONLY`, pop out and back in, and re-check every state. |
| DRAG-2.5 | UI | D carries the relationship overlay for the whole drag. This needs a DOM hook; the Coder decides which. (Or approve dragClassification.) |
| DRAG-2.6 | UI | Seed `overlayDepthCappedOpacity`. tOver is visible, with that computed opacity; V is at 1. |
| DRAG-2.8 | UI | At pickup, the Unsorted bucket, a broken column and an expanded column's outer wrapper are Inert. May fail (Test Quality 15). |
| DRAG-2.9 | UI | Extend classify: a descendant deep enough to fail the cap is `cycle-forming`. (Or approve dragClassification.) |
| DRAG-3.11 | UI | In the stamped DRAG-3.1 test, poll the ghost at the end while on the bottom band. |
| DRAG-3.12 | UI | Merged fold, Y in Review, `POP_OUT_ONLY`. Pop out over Todo, come back to the merged middle band, release. No request, Y unchanged. Expanded variant: X from the In Progress sub-row into the Review sub-row's middle band → workphase Review, position kept. |
| DRAG-3.16 | Internal (needs approval) | A new dragRegions/popSession test: a region whose visible slice is clipped still carves its bands from the unclipped content rect. A point at the top of the visible slice is the middle band while the content's top is scrolled off. The UI half → S10. |
| DRAG-3.17 | UI | Extend the stamped reservation test: while locked, zero `[data-carve-zone]` on the board; popped out, present; popped back in, zero. |
| DRAG-3.18 | UI | At Board layer, the carve-zone text reads "Move Top" and "Move Bottom" (positional region), "Move to Review" (empty), "Move to Done" (done, with cards). The hovered region shows none. |
| DRAG-3.19 | UI | X has a long description, an assignee and Stubs S1, S2. At Column and Board layers:<ul><li>`data-drag-overlay-form` = `short-card`, and the ghost row is short;</li><li>no assignee footer or child count;</li><li>both copies are the same height;</li><li>S1 and S2 aren't in the DOM.</li></ul>After the drop, S1 and S2 are back inside X. |
| DRAG-3.20 | UI | At Board layer every region shows `[data-carve-divider]` top and bottom, and the hovered band is tinted and equals `data-drag-band`. While locked, none. May need a ruling (Test Quality 15). |
| DRAG-3.23 | UI | `SUSTAINED` into Done's single band, `awaitDragContext(done)`, release. Workphase done, `completedAt` set, position null. |
| DRAG-4.12 | UI | Extend DRAG-5.4's test: X is Q's only attached child, at the append-fallback position. |
| DRAG-5.1 | UI | Extend the stamped test: the column order is P, X, Q (the ghost takes Q's slot, so the drop lands between P and Q whichever neighbor the lean names). |
| DRAG-5.2 | UI | Merged fold (In Progress + Review), P in Review, X its Stub. Detach with DRAG-5.1's recipe. `X.workphaseId` = Review, not In Progress. |
| DRAG-5.3 | UI | Stub X of P in Todo; the cursor rests in In Progress. Three pops on the shared clock to Board, then `settleOnTopBand`: detached, parentId P, workphase In Progress, before the first card. A `SUSTAINED` variant ends locked in In Progress. |
| DRAG-5.10 | UI | Extend the stamped test:<ul><li>after the two pops, `data-drag-overlay-form` = `short-card`;</li><li>zoomed into Q (DRAG-5.4's recipe) → `stub`;</li><li>a cancel after the pop out → X back in P's section, unchanged.</li></ul> |
| DRAG-5.13 | UI | Extend "decision 1": with `POP_OUT_ONLY`, hover P's title area → `card:P`, never S1. Release → S1a unchanged. |
| DRAG-5.14 | UI | P in Done with Stub X. Two pops into Done, release. isAttached false, parentId P, `completedAt` set, position null. |
| DRAG-6.2 | UI | Extend the stamped test: a second pending write's response lands first and re-sorts the list; X stays at its previewed slot. |
| DRAG-6.4 | UI | Route-fulfil the move with a position that contradicts the preview. The panel's inversion log gains one entry (`data-inversion-count`); nothing reaches the console (spy); the entry survives a board reload. |
| DRAG-6.6 | UI | Route-fulfil the move with a 400. A board reload follows, and X renders at its server position. (Or approve dragRequest.) |
| DRAG-6.7 | UI | DRAG-6.5's recipe, with write 1's delayed response rewritten to carry reindex pairs. A board reload follows, and the board matches the server. A variant without pairs: no reload. |
| DRAG-6.8 | UI | DRAG-6.5's recipe; while write 1 is in flight, pick X up again and cancel. X is shown pending at s1. After write 1 lands, no marker. |
| DRAG-6.9 | UI | DRAG-6.5's recipe; pick X up again and hold still; `waitForResponse` for write 1. X's ghost is present without further pointer movement, and the release commits. |
| DRAG-6.11 | UI | DRAG-3.9's recipe with a delayed response. X previews and is pending after the done column's last card, and stays there after the response. |

### Story 10 candidates (21)

**Named by Story 10's entry** (`docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, "Story 10"):
- **Item 2:** DRAG-4.1, 4.5, 4.14, 4.15, 4.16, 4.17. It also lists DRAG-4.12, which this report proposes closing in A3.
- **Item 4,** by the old in-suite IDs: DRAG-1.21; "DRAG-4 TC-13", now DRAG-4.13; "DRAG-5 TC-9's tab-right and over-cap bullets", now DRAG-5.9; and the carried Stub's overlay form, which is DRAG-3.22 by content (and DRAG-5.10, which A3 can close).

| Case | Named? | Needs |
|---|---|---|
| DRAG-1.2 | no | A precise lean of the carried copy against a ghost moved to a new slot, and a check that the side highlight names the same card |
| DRAG-1.5 | no | Bullet 3: a Card → Descendants hold and a release at a gap and depth (`tabBy`) |
| DRAG-1.16 | no | Paragraph 2: a Free-Card zoom into P, then leaving P's box. Paragraph 1 can be written in A3 with `NO_POP` and C1 = [A, X], so the ghost names A whatever the lean |
| DRAG-1.17 | no | Bullets 2–3: a Free-Card zoom into P |
| DRAG-1.21 | yes (item 4) | The Card → Descendants hold |
| DRAG-3.5 | no | Pixel-precise releases either side of a divider, and the dead-zone heights. A `DragCarveFrame` render test (internal) could pin the heights in A3 |
| DRAG-3.22 | by content (item 4) | A Free-Card zoom into P. The Stub-pickup and pop-out halves can be asserted in A3 (DRAG-5.10's extension) |
| DRAG-4.1 | yes (item 2) | A Free-Card zoom-in |
| DRAG-4.2 | no | A Free-Card zoom-in. The consequence is route-covered (ATT-5.1/5.2) |
| DRAG-4.3 | no | A Free-Card zoom into a done Card. The consequence is route-covered (ATT-6.1) |
| DRAG-4.5 | yes (item 2) | A quick release against a held one, on the same aim |
| DRAG-4.13 | yes (item 4, "TC-13") | A Descendants placement inside a done Card |
| DRAG-4.14 | yes (item 2) | A Free-Card zoom-in, released at several points |
| DRAG-4.15 | yes (item 2) | Three pops; the skipped zoom test is this case |
| DRAG-4.16 | yes (item 2) | The ghost pinned while the cursor moves inside P |
| DRAG-4.17 | yes (item 2) | A Free-Card zoom-in, then a pop out |
| DRAG-4.20 | no | Observing the visible cue within the hold's window |
| DRAG-4.21 | no | Geometry compared within the cue's window |
| DRAG-4.22 | no | The cue disappearing on a relation change, a pop out, or a cancel |
| DRAG-4.26 | no | A sidebar drag with horizontal offsets. Story 10 covers the board, not the sidebar, so this may belong to the sidebar follow-up story (A3 Open question 3) |
| DRAG-5.9 | yes (item 4) | The tab-right and over-cap bullets |

**If Nathan declines internal mappings,** these fall back to Story 10 too:
- already named: DRAG-4.8, 4.9, 4.10, 4.11 and 4.18 (item 4, as "TC-8/9/10/11/18");
- not named: DRAG-1.7, 1.8, 1.10, 1.20, 1.25, 3.15, 3.21, 4.19, 4.23 and 6.12.

**For the Architect's handoff** (A3 Handoff):
- item 1 still says "82 active cases … all currently ⏳";
- item 4 uses "DRAG-4 TC-8" and similar forms;
- the entry needs the qualified IDs above before the batch signs off (D10).

---

## Duplication (reported, not judged)

- **DRAG-3.2:**
  - bands "DRAG-3.1 / 3.2" (bottom half) and bands "popped out, a release in a column is still that column's band" both assert ABCX;
  - bands "DRAG-6.1 / 6.2" uses the bottom band;
  - xcol "2.b — drag C below card D…" is the same band across columns;
  - dragRequest "first/last resolve to a concrete anchor…"; dragBands.
- **DRAG-3.3:** bands "DRAG-3.3 / …"; bands "DRAG-3.10" (keeps position 2.5); xcol "4.a" and "4.b" (a middle band keeping 3.0); dragRequest "cross-column, no anchor…"; placement "DRAG-3.11".
- **DRAG-1.24:** xcol 3.a/3.b and xproj 3.a/3.b are the same gesture on different fixtures. The API twins in `tests/api/itemRepositioning*.spec.ts` pin the same positions (item-positioning's).
- **DRAG-1.9:** bands "Board layer, a release between columns…" and xcol "5.a".
- **DRAG-2.1, 2.2, 2.3, 2.7, 2.8:** classify, and dragClassification.
- **DRAG-3.7, 3.9:** bands, placement, dragRequest, and dragBands (3.9).
- **DRAG-6.1 / 6.2 against TC-2.27 / TC-2.30** (listOps), and **DRAG-6.3 against TC-5a.1 / TC-5a.2** (reconcile). The same tests serve both catalogs. DRAG-6's preamble says the reconciliation order is item-positioning's, yet DRAG-6.3 restates it (Candidate New Cases, note B).
- **Consequences in the route suite:** DRAG-4.2 (ATT-5.1/5.2), DRAG-4.3 and 4.13 (ATT-6.1, TC-7.15), DRAG-4.12 (ATT-3.3, TC-7.7), DRAG-5.1 (ATT-7.1, TC-7.13) and DRAG-5.14 (ATT-7.4) each assert an attachment consequence that hier already pins. DRAG-4's preamble says its cases assert which request the gesture produces.
- **DRAG-4.8–4.11 and 4.26:** hierPlace, descProj `computeProjection` and projTree drive the same `lib/hierarchyPlacement.ts` for the board and the sidebar.
- **DRAG-2.10:** boardsRoute, and classify (which reads the board's cap).

## Test Quality Concerns

1. **bands "DRAG-3.1 / 3.2 … (DRAG-3.5: at the configured carve-outs)".** `settleOnBand` nudges the cursor until the machine's own `data-drag-band` agrees, so a divider in the wrong place can't fail this test. It asserts DRAG-3.1/3.2's writes, not DRAG-3.5's geometry: "the dividers sit `h` in from each edge" (wiki board-drag-interaction §5). Drop DRAG-3.5 from the title.
2. **bands "Board layer, a release between columns or over Unsorted writes nothing…".** The title claims Unsorted; the body releases only in the gap. xcol "5.a" is the Unsorted case.
3. **bands "DRAG-1.3 (momentary): brushing across another column while reordering never leaves the context".** It seeds `NO_POP`, so the preset guarantees that nothing pops. Wiki §3.1's "never incidental" isn't under test (that's DRAG-1.32, `Manual`). What it does assert is a first-slot reorder (DRAG-1.23).
4. **bands "DRAG-3.3 / DRAG-1.3 (momentary)".** "Momentary" is again a preset (`popInDelayMs` 60 s). That's fine for DRAG-3.3's "released without popping in", which the case defines, but it says nothing about DRAG-1.3.
5. **popSession "DRAG-1.1: starts locked in the origin context with nothing tracked"** and **"a drag from outside every region (Unsorted) starts popped out…".** Both call `startPopSession(key)` and check it returns that key. The rule, which context a pickup chooses (wiki §1: the merged list box, the sub-row, none from Unsorted, the Stub's containing Card's section), lives in `useBoardDnd.ts::beginDragAt` and isn't exercised.
6. **detach "DRAG-5.1 / 5.2 / 5.10".**
   - For DRAG-5.2: Todo is a one-workphase column, so the entry workphase and the inherited one are the same, and "no workphase change" can't fail. Wiki §8: "a parent sitting in a *non-entry* workphase of a merged column". placement "TC-1/2/3" passes a null workphase for the Stub, so no unit test covers the non-entry case either.
   - For DRAG-5.1: `position not.toBeNull()` doesn't show the column's within-action placed X by `{Q, after}`.
7. **detach "DRAG-5.4".** Q is childless and in P's workphase, so "last among Q's children" and "workphase inherited from Q" hold trivially. Give Q a Stub, and put Q in a different covered workphase from P, to make them bite. I've kept DRAG-5.4 as Stamp; treat it as A3 if you'd rather the extension land first.
8. **detach "DRAG-1.1 / DRAG-5.9 (sibling bullets)".** It says outright that it doesn't assert which anchor ("the sortable strategy's own call"). DRAG-5.9's first bullet pins `{S1, before}`.
9. **boardsRoute "carries the item depth cap the API enforces".** It compares the response to the same `ITEM_DEPTH_CAP` the route reads, so it can't catch a board that reports a cap the API doesn't enforce. DRAG-2.10's *Then* is behavioral: read `itemDepthCap` from `GET /boards/:id`, then show that a write at that depth is accepted and one deeper is refused.
10. **dragRequest "DRAG-6.6: …", "#15: …" and "a stale response with no reindex disclosed needs no resync".** They mock the write tracker, so staleness is given, not detected. The per-item sequencing in `useItemManagement.ts` (DRAG-6.5, 6.7) is exercised only by bands "DRAG-6.5" end to end.
11. **dragRequest "same workphase, empty others: any slot is identity — nothing to order against (DRAG-3.10 / TC-7.5, DRAG-3.9 / TC-7.8)".** The DRAG refs are misattributed. DRAG-3.9 and 3.10 are an outsider's workphase change, which is never identity. The test asserts DRAG-1.24's "a card alone in its list, set back down, writes nothing".
12. **dragRequest "a done region never anchors — DRAG-3.9/TC-7.8 is placementFor's own fallback…".** The title admits `toRequest` never sees the case. It restates the adapter; supporting only.
13. **classify "every visible target is classified…" against DRAG-2.2.** S, X's attached Stub, is unrendered during X's drag (wiki §5a), so no surface can show its classification. Only dragClassification asserts it (Candidate New Cases, note A).
14. **placement "TC-9 (sibling bullets): …".** The title says this branch never sees a real `over`. It asserts that the mid-drag ghost stays at origin, not the reorder's write that DRAG-5.9 pins.
15. **Two rules the code may not implement.** Either test may fail, and then it's a ruling (README, "When a test for a case fails").
    - **DRAG-2.8's Inert.** `dragClassification.ts` declares `DropTargetState = … | 'inert'`, but I found nothing that assigns it.
    - **DRAG-3.20's tint.** A comment in bands ("the retired tinted band highlight") says the live ghost replaced it; wiki §5 still states it.
16. **bands "DRAG-3.4 / …".** It lands X between A and B, where the case's example is `{B, after}`. The rule, placement by the named neighbor rather than by band, is asserted. Minor.
17. **bands "DRAG-3.9: … every band is a workphase-only move".** It releases at one point. A done region is one band, and placement covers the rest. Minor.
18. **popSession "the same card on its other side resets the hold too — wiki §6's own reset rule".** The rule's anchor is now §6.1 (the A2 anchor table).

**Provenance in titles,** which the Coder strips when touching the title:
- bands: "(audit epic-3-5-story-4 #2)".
- detach: "decision 1:", "audit #2 regression:", "decision 4 regression:".
- classify: "(Story 5, DRAG-2.8)".
- dragClassification describe: "(Story 5, full classification, DRAG-2.8)".
- dragRequest: "(decision 2)", "(Story 4/5 TC-4, no manual placement among Stubs until Story 6)", "#15:", "(Story 6 seam)".
- placement: "#29:", "(audit epic-3-5-story-3-reconciled #4)", "(decision 5)", "Story 6 Phase D" (in a test title and a describe).
- popSession: "(re-plan 2026-09-16, rule 1: …)"; the describes "(Story 6, finding 3)" and "(Story 6 Phase D)".
- dragRegions: "(reconciliation #20)", "(Story 6 Phase D)", "(audit epic-3-5-story-4 #8)".

## Uncatalogued Tests

**Coverage-gate and implementation tests,** with no standalone business rule. Not to be mapped.
- **dragRegions:**
  - `subrowContainerId`;
  - the `parseRegionKey` describe;
  - `descendantsCardIdOf`;
  - `containsPoint`;
  - "hasDetachedElements: …";
  - "hasNewRegionElements: …";
  - "CARD_LIST_REGION_SELECTOR finds the column/sub-row regions…";
  - "a measured region carries no DOM handles…";
  - "resolves the origin's own card: region even when isValidCard rejects it";
  - the `isCardList` describe;
  - `clipToVisible` "keeps left/right/width from a DOMRect-shaped object…".
- **dragBands:** "clamps a point outside the rect to the nearer edge band"; `distanceOutside` (supports DRAG-1.14).
- **dragCollision:**
  - "never collides an item with itself";
  - "excludes Stub rows from a Card drag (the collision-hijack bug this guards against)";
  - the Descendants-scoping tests;
  - "never reads the active row's own role…";
  - the `resolveDropSide` describe (the fallback);
  - `isItemData`/`isColumnData`;
  - `travelingRowsFor`.
- **dragOverlay:** the `clampAxis` describe; the "(F8)" idempotence tests; `reanchorOverlayTransform`'s null-input cases.
- **placement:** the `resolvePlacementOver` describe; "a real drop always wins over priorPlacement…".
- **descProj:** `sameProjection`.
- **hierPlace:**
  - `flattenHierarchyOf` "a corrupted parentId cycle ends the walk…";
  - the `toRows` describe;
  - the `gapIndexFor` describe.
- **tuning:** "ignores malformed JSON, wrong types, non-finite numbers and unknown keys".
- **dragRequest:**
  - "same workphase, an anchor absent from others…";
  - "a null placement sends nothing…";
  - "begins the write with its pending placement…".
- **reconcile:** "leaves other pending placements alone"; "a write the board never previewed … no tripwire…".
- **popSession:** the `popDueAt` describe.

**Regression guards,** where the scenario isn't a wiki rule:
- detach "decision 4 regression: immediately after a detach, the same item drags and reorders normally as a Card";
- bandGuides "keeps its cards mounted through every layer change of a drag".

**Owned by other catalogs.** These are out of this feature's scope; batches 4 and 5 map them:
- xcol 1.b, 2.b, 4.a and 4.b, and xproj 1.b and 4.a (item-positioning);
- listOps's selector tests and reconcile's `applyItemWriteResponse` describe (item-positioning part 2 and 5a);
- `tests/ui/attached-children.spec.ts` "dragging a parent card across columns cascades its attached child" (item-attachment).

**Skipped (no coverage):**
- zoom ×2 (Story 10 items 2 and 7);
- xcol "1.a" and "2.a", and xproj "1.a", "2.a", "2.b" and "4.b" (Story 10 item 3).

## Candidate New Cases

None of these is added here.

| # | Scenario | Tests | Wiki? | Gap |
|---|---|---|---|---|
| 1 | The pop-out clock starts when the cursor leaves the context and doesn't restart as it moves between foreign places (a gap, another column) | popSession "DRAG-1.4: the clock runs wherever the cursor is outside…", "leaving the context starts the pop-out clock — into a gap as much as into another column…" | Yes: §3.1 "starts the moment the cursor leaves the context, wherever it goes" | Test Planner. It's threshold-timed at the surface, but pinned as a state-machine rule |
| 2 | A Stub picked up and set back down in its own slot at the Descendants layer resolves to its own placement, and what's written | hierPlace `ownSlotOf` "%s: its own gap and depth, which resolve to its own slot"; descProj "a Stub's pickup seeds at its own slot and depth…" | Yes: §2 rule 5 and "the same rule holds in a Card's descendants section (§7.1)" | Test Planner. DRAG-1.24 is column-only |
| 3 | Re-dragging a pending item: the ghost starts at the pending placement, not at the stale stored row | placement describe "priorPlacement (a re-dragged item)" (6 tests) | Partly: §10 covers the cancel restore (DRAG-6.8) and a mid-drag response (DRAG-6.9), not where a re-drag's ghost starts | PO, unless the PO reads it into §10's "the preview shows where the write will actually land" |
| 4 | A foreign item entering a Descendants section starts at the section's last gap, at the last row's depth | descProj "a foreign item enters at the section's last gap, at the last row's depth"; placement "a Free Card, mid-drag: previews attaching as last child of the section's own Card" | No; §7 doesn't say where the entry state starts | PO |
| 5 | Sidebar placement:<ul><li>a named row inside the dragged subtree maps to the gap after the nearest eligible predecessor;</li><li>a collapsed Top resolves Top + 1 to its real first child;</li><li>the dragged project's descendants are dimmed.</li></ul> | projTree "an excluded (dimmed descendant) over id resolves to the gap the whole dragged block collapsed to", "falls back to gap 0…", the `fullChildrenOf` describe; hierPlace describe "resolvePlacement — a Top whose children are hidden from rows (a collapsed Top)" | No sidebar page (A3 Open question 3). It bears on DRAG-4.27/4.28's `Pending PO` questions: these tests already pin "the sidebar reads the full tree under a collapsed project" | PO |
| 6 | A drag's layer changes never remount a Card, so its hand-set expand/collapse survives a drag | bandGuides "keeps its cards mounted through every layer change of a drag" | No | PO, if it's meant as a rule; otherwise it stays a regression guard |

**For the Test Planner,** from reading the cases against the tests (not new cases):
- **A.** DRAG-2.2's `S` can't be visible during X's drag (§5a). §4 classifies "every visible target".
- **B.** DRAG-4.2, 4.3 and 6.3 assert what DRAG-4's and DRAG-6's preambles assign to item-attachment and item-positioning.
- **C.** DRAG-1.20's *Then* ("a release commits C1's reposition") holds only if nothing in C1 is named for the full hold. With a neighbor named, the hold zooms into that neighbor. The *Given* could say X is alone in C1, or that the side highlight names nothing.
- **D.** No case in this feature differs only by the MCP surface.

---

## Totals

These reflect the catalog after the Test Planner's response, and the Addendum's mappings. The first run covered 111 cases, 96 of them `Open`. For those it proposed 12 by ID, 8 stamps, 17 internal, 38 A3 and 21 Story 10.

### Current, by status and priority

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Open | 47 | 43 | 9 | 99 |
| Manual (the Test Planner's) | 2 | 4 | 2 | 8 |
| Pending PO | 0 | 3 | 3 | 6 |
| Automated | 0 | 0 | 0 | 0 |
| **All** | **49** | **50** | **14** | **113** |

| Suite | Open | Manual | Pending PO | Total |
|---|---|---|---|---|
| DRAG-1 | 26 | 5 | 1 | 32 |
| DRAG-2 | 10 | 0 | 0 | 10 |
| DRAG-3 | 21 | 0 | 1 | 22 |
| DRAG-4 | 20 | 2 | 4 | 26 |
| DRAG-5 | 10 | 1 | 0 | 11 |
| DRAG-6 | 12 | 0 | 0 | 12 |

### Proposed outcome for the 99 `Open` cases

| Outcome | P0 | P1 | P2 | Total | Cases |
|---|---|---|---|---|---|
| Stamp: carries the ID today, by ID | 11 | 1 | 0 | 12 | 1.3, 3.1, 3.3, 3.4, 3.6, 3.8, 3.9, 3.10, 5.4, 5.12, 6.1, 6.5 |
| Stamp: needs the ID | 7 | 1 | 0 | 8 | 1.23, 2.1, 2.2, 2.3, 2.7, 2.10, 3.2, 3.7 |
| Internal (needs approval) | 7 | 9 | 0 | 16 | Fallback A3: 1.7, 1.8, 4.23, 6.10, 6.13. Fallback Story 10: 1.10, 1.25, 3.15, 3.21, 4.8, 4.9, 4.10, 4.11, 4.18, 4.19, 6.12 |
| Closable in A3 | 12 | 23 | 8 | 43 | 1.1, 1.6, 1.9, 1.12, 1.13, 1.14, 1.18, 1.19, 1.20, 1.22, 1.24, 1.26, 1.27, 1.28, 1.31, 2.4, 2.5, 2.6, 2.8, 2.9, 3.11, 3.12, 3.16, 3.17, 3.18, 3.19, 3.20, 3.23, 4.12, 5.1, 5.2, 5.3, 5.10, 5.11, 5.13, 5.14, 6.2, 6.4, 6.6, 6.7, 6.8, 6.9, 6.11 |
| Story 10 candidate | 10 | 9 | 1 | 20 | 1.2, 1.5, 1.16, 1.17, 1.21, 3.5, 3.22, 4.1, 4.3, 4.5, 4.13, 4.14, 4.15, 4.16, 4.17, 4.20, 4.21, 4.22, 4.26, 5.9 |
| Manual proposal | 0 | 0 | 0 | 0 | — |
| **Total** | **47** | **43** | **9** | **99** | |

### End state, under Nathan's two rulings

The two rulings:
- whether to approve the 16 internal mappings above;
- whether to approve the clock-logic category (Addendum). If he does, the Test Planner reopens DRAG-1.4, 1.11, 1.30 and 5.5, and the Reconciler maps them.

Each cell reads `Automated` / routed to Story 10 / `Manual` / `Pending PO`, and assumes every A3 gap closes.

| | Internal mappings approved | Internal mappings declined |
|---|---|---|
| **Clock category declined** | 79 / 20 / 8 / 6 | 68 / 31 / 8 / 6 |
| **Clock category approved** | 83 / 20 / 4 / 6 | 72 / 31 / 4 / 6 |

- **If the internal mappings are declined,** 5 of the 16 become A3 tests (1.7, 1.8, 4.23, 6.10 and 6.13) and 11 route to Story 10.
- **If the clock category is approved,** 103 cases are `Open`: DRAG-1.4 (P0) and 1.30 (P1) go to Internal, and DRAG-1.11 (P1) and 5.5 (P0) to A3. The outcome rows then read:
  - Internal: 18 (8 P0, 10 P1);
  - A3: 45 (13 P0, 24 P1, 8 P2).

  The category's own approval makes all four count, including the two new state-machine tests A3 writes.

---

## Addendum: after the Test Planner's response

**Run:** still proposing. The only write is to this report.

**Re-read** in `docs/test-plans/board-drag-interaction/`: every case named in A3's Amendments entry "batch 3 step 2", as each now reads.

**The catalog now:** 113 cases, of which 99 are `Open`, 8 `Manual` and 6 `Pending PO`. DRAG-1.33, 4.29 and 4.30 are new and `Pending PO`, so they're skipped, as are DRAG-3.24, 4.27 and 4.28.

**For every case named below, this section supersedes the earlier ones.** Totals, above, already reflect it.

### Deleted: dropped from outcomes, stamps and mappings

- **DRAG-4.2** (was S10).
  - No stamp named it. Its only coverage was hier's cascade test, which stays with ATT-5.1/5.2.
  - It leaves the Story 10 list and the Duplication note on consequences.
- **DRAG-6.3** (was Internal).
  - The reconcile tests proposed for it belong to item-positioning's TC-5a.1/5a.2, for batch 5's run: "applies every reindexed pair the list holds, then the written item (§5a order)", "the written row wins over its own pair when they disagree…" and "TC-5a.2: applies the reindex first…".
  - No test title carries DRAG-6.3. The three comment hits are already with the Coder.
  - It leaves the Internal mappings and the Duplication note on DRAG-6 against TC-5a.

### Reopened from `Manual`

| Case | P | Existing coverage | Asserts the *Then*? | Outcome |
|---|---|---|---|---|
| DRAG-1.14 | P2 | detach "audit #2 regression: a yank past both pop-out distances in one sample cascades Descendants -> Card -> Column…" pops the Descendants and Card layers by distance alone: every clock is `NO_POP`, with `popDistancePx: 10`. Internal: popSession "the distance term pops out as soon as the cursor is far enough from the context (either satisfies)", "the distance term also measures against the outer body for a merged column" | The Card and Descendants layers at the surface; the column layer only internally. "`popDistancePx` 0 → only the clock decides" isn't asserted, though every other popSession case runs at the default 0 | A3 |
| DRAG-1.18 | P1 | None. No popSession case sets `popDistancePx` for a zoom in | No | A3 |
| DRAG-1.19 | P1 | None for a Card zoomed into a Card. The audit #2 test is the Stub variant, DRAG-5.11. popSession "popDelayMs = 0: the exit only starts the clock, then pops one layer, not through to Board" is a related one-layer rule, not the cascade | No | A3 (see below) |
| DRAG-5.11 | P1 | detach "audit #2 regression: …" covers the first half. The write is a detach: isAttached 0, parentId P, workphase kept | In part. "Arrives locked in the column, shown as a Card", the column's reposition, and the second half ("stops inside P's box → only the first pop, set back down") aren't asserted | A3 (stamp + extend) |

What A3 writes for them. Each test is deterministic: the clocks it doesn't test are `NEVER`, and one cursor sample decides.
- **DRAG-1.14:**
  - Stamp the audit #2 test `DRAG-5.11, DRAG-1.14:`, and strip "audit #2 regression".
  - Add a UI test for a Free Card with every clock `NEVER`. A single hover to a point at least `popDistancePx` outside its column → `data-drag-state` = `popped-out`. The same move with `popDistancePx` 0 → still locked.
- **DRAG-1.18,** UI, with `popDistancePx` above 0 and the pop and zoom clocks `NEVER`:
  - **Column → Card:** column [P, X], so X's ghost names P whatever the lean. The cursor goes deep into P's box → `data-drag-context` stays the column, and `data-drag-zoom-phase` never gets past `dwell`. The release is a reposition, with parentId unchanged.
  - **Card → Descendants:** a Stub popped out to `card:P` (DRAG-5.12's recipe, with `descendantsPopInDelayMs` `NEVER`). The cursor goes deep into the section → the context stays `card:P`, and the release sets the Stub back down.
  - A new popSession case would do as well (internal).
- **DRAG-1.19,** UI via DRAG-5.4's Stub-origin zoom, with `popDelayMs` `NEVER` and `popDistancePx` seeded. The Stub leaves P0 by distance, rests on Q, and zooms into Q with a short dwell and cue. Then:
  - one hover to a point that far outside Q's box and the column → `popped-out`;
  - one hover instead to a point in the column outside Q → the column only.

  **Condition:** if Nathan reads the case's X as a Free Card zoomed in from its own column, this needs the skipped Free-Card zoom, and it's S10.
- **DRAG-5.11:**
  - Extend the stamped test: before the release, `data-drag-context` is the column and `data-drag-overlay-form` = `short-card`; after it, X's order in the column.
  - Add a second test: one hover to P's title area (inside P's box, at least `popDistancePx` outside the section) → `card:P`. The release writes nothing.

### Revised

- **DRAG-1.20 (P0): X is alone in C1. The outcome moves from Internal to A3 (UI).**
  - **Why it needs no clock:** with X alone, nothing is named. And a Card named for a zoom in shows as `data-drag-zoom-candidate` from the dwell's first sample (popSession sets the hover's phase to `dwell` at once), so no wait against a hold is needed.
  - **The test:** zoom and pop clocks `NEVER`; X alone in C1; the cursor rests on Q in C2 → no `data-drag-zoom-candidate`, and the context stays C1. The release makes no request. The expanded variant does the same with sub-rows W2 and W3.
  - **Positive control:** first name a Valid Card in another drag or column and see the attribute appear, so the absence isn't vacuous.
  - **Supporting internal tests:** dragRegions "scopes to exactly the context region…", dragCollision "in-context: only the context container…", popSession "nothing named (alone in the list, or hovering nothing): no candidate at all", and dragRequest "same workphase, empty others: any slot is identity…".
  - This closes the earlier note C for the Test Planner.
- **DRAG-2.2 (P0): no fixture change is needed.**
  - classify already seeds D detached (`isAttached: false`) and D1 with only a `parentId`, so D1 is an attached Stub shown inside D's Card. The test asserts X, D and D1 `cycle-forming`.
  - The test's check that S is absent (`toHaveCount(0)`) now matches the case's parenthetical.
  - The stamp stands. Test Quality 13 and note A are resolved.
- **DRAG-4.3 (P1): now the request only. The outcome stays S10.**
  - It still needs a zoom into a Card from a column, a done one. Story 10's entry doesn't name it.
  - dragRequest "attach: parentId + isAttached, never an anchor…" pins the request's shape for any parent, as internal support.
  - The Duplication note on its consequences is gone.
- **DRAG-6.9 (P1): the outcome stays A3, with the UI test in Gaps.** The conditional Manual proposal is withdrawn, so nothing is proposed `Manual`.

### Reclassified on re-reading

DRAG-1.20's reasoning also applies to DRAG-1.7, 1.8 and 4.23. "The dwell never starts" shows at once, as the absence of `data-drag-zoom-candidate`, so no wait is needed. Their internal proposals stand, but the fallback moves from S10 to A3:
- **DRAG-1.7 and 1.8:**
  - Column [D, X], or [T, X], with X last so its ghost names D (or T) whatever the lean. Zoom clocks `NEVER`.
  - No candidate appears on D. The release leaves X after D, with parentId unchanged.
  - Use the same positive control.
- **DRAG-4.23:** X alone. No candidate appears, and the release writes nothing.

### New

- **DRAG-6.13 (P1): Internal.**
  - **The tests:** placement's describe "priorPlacement (a re-dragged item)", 6 tests:
    - "in-context, no hover: the prior placement wins over a freshly computed slot" (the ghost starts at s1, not s0);
    - "locked in a list the prior placement doesn't draw it in, it gives way to that list's own slot";
    - "a pending attach (the prior names a parent) never stands in for a card list's ghost";
    - "a pending detach (parentId: null) into this list still stands in";
    - "a Board-layer hovered band ignores it…";
    - "with no prior placement (the ordinary drag)…".
  - **Coverage:** full, at state level.
  - **Stamp:** the describe, `DRAG-6.13: …`.
  - **If declined, A3 at UI:** DRAG-6.5's recipe. While write 1 is held, pick X up again and move no further than activation. X's ghost is still last in In Progress, and X isn't drawn in Todo, its stored slot.
- **DRAG-1.33, 4.29, 4.30: `Pending PO`, skipped.** They take this report's candidates 6, 2 and 4. The tests listed for those candidates wait for the PO's answers:
  - bandGuides "keeps its cards mounted…";
  - hierPlace `ownSlotOf`, and descProj "a Stub's pickup seeds at its own slot…";
  - descProj "a foreign item enters at the section's last gap…", and placement "a Free Card, mid-drag: previews attaching as last child…".

### DRAG-1.30, and the stamp guidance for popSession

DRAG-1.30 now includes §3.1's "wherever it goes", which closes Candidate New Case 1. These titles all move to DRAG-1.30:

| popSession title | Was | Now |
|---|---|---|
| "DRAG-1.4: the clock runs wherever the cursor is outside, from whenever it first left…" | drop the ID | `DRAG-1.30:` |
| "DRAG-1.3 (momentary): coming back inside before THRESHOLD resets the clock" | `DRAG-1.30:` | unchanged |
| "leaving the context starts the pop-out clock — into a gap as much as into another column … (re-plan 2026-09-16, rule 1: …)" | no ID | `DRAG-1.30:`, stripping the parenthetical |

While DRAG-1.30 is `Manual`, every run reports these as tests carrying a Test Planner `Manual` case's ID, until Nathan rules on the clock category.

Also, stamp popSession's two distance tests `DRAG-1.14:` (internal, supporting).

### The clock-logic category (for Nathan's ruling)

DRAG-1.4, 1.11, 1.30 and 5.5 stay `Manual` in Totals. If Nathan approves internal tests for "clock rules pinned in the pop state machine, with the threshold as a parameter", this is what would map, and what would still be uncovered:

| Case | P | Would map if approved | Still uncovered | Outcome if approved |
|---|---|---|---|---|
| DRAG-1.4 | P0 | popSession "holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone", "a different named card resets the hold from the dwell, even mid-cue", "the same card on its other side resets the hold too…". The release as a reposition naming the card is placement "a specific card: the anchor + side dnd-kit resolved…", an ordinary internal mapping | Only feel: whether the tuned hold is long enough, which is DRAG-1.32 (`Manual`) | Internal |
| DRAG-1.11 | P1 | popSession "the top and bottom bands never pop in, however long; moving to another column restarts the clock", "the pop-in clock starts at the pop-out, not at the region entry…", "resting in a middle band past the pop-in threshold locks the card into that column"; `popDueAt` "popped out: the pop-in clock only from a middle band" | Bullet 2: time in the top band counting toward the clock, then a slide into the middle band popping in at once. Also, leaving R for nowhere and coming back | A3: a new popSession case, inside the category |
| DRAG-1.30 | P1 | popSession "DRAG-1.3 (momentary)…", "DRAG-1.4: the clock runs wherever…", "leaving the context starts the pop-out clock…", "DRAG-1.3 (sustained)…" (which fires once `popDelayMs` has passed since leaving) | "A release is still the in-context reposition" is DRAG-1.16's rule, with placement's in-context tests as support | Internal |
| DRAG-5.5 | P0 | The release as a sibling reorder: dragRequest "a Descendants-layer sibling reorder…: sends only the anchor + side" (an ordinary internal mapping) | Every popSession reset case runs from a column. None runs the excursion out of a Descendants context and back | A3: a new popSession case with a Descendants context, inside the category |

The totals under both rulings are in Totals, above.

### Net changes to Proposed Stamps and Mappings

- **Added:**
  - detach, audit #2: `DRAG-5.11, DRAG-1.14:`;
  - placement, "priorPlacement (a re-dragged item)": `DRAG-6.13:` (internal);
  - popSession, three titles: `DRAG-1.30:`;
  - popSession, two distance tests: `DRAG-1.14:` (internal, supporting).
- **Removed:** the Internal rows for DRAG-6.3, and for DRAG-1.20, whose tests are now supporting. No title named DRAG-4.2 or DRAG-6.3.
- **Unchanged:** the classify stamp, including DRAG-2.2.
- **Story 10:** its candidates are now 20; 10 are named in its entry, and DRAG-4.2 is gone. If Nathan declines internal mappings, 11 of them fall back to Story 10.

---

## Confirming run (2026-09-28)

**Run:** confirming (A3 batch 3, step 4).

**Written:** the status and `**Automation test:**` line on the cases in `docs/test-plans/board-drag-interaction/`, in each case's heading block and its suite table, plus this section. No case text, title or priority, test file or wiki page was edited. The Test Planner's four `Manual` cases (DRAG-1.29, 1.32, 4.24 and 4.25) are untouched.

**Read:**
- A3's Amendments, from "batch 3 Stop 1" on;
- every case as it now reads, including the Test Planner's 2026-09-28 changes;
- every test title that carries a DRAG ID;
- the bodies of the Coder's new tests: popSession's two DRAG-1.11 tests and its DRAG-5.5 test, and descendantsProjection's DRAG-4.30 and DRAG-4.29 tests.

**How I judged:**
- **A test counts** if it's a surface test (`tests/ui/`, `tests/api/`, `server/tests/routes/`), or an internal test within Nathan's approvals:
  - the 16 mappings;
  - the clock-logic category for DRAG-1.4, 1.11, 1.30 and 5.5, as the Test Planner's 2026-09-28 note scopes it;
  - DRAG-4.29's and DRAG-4.30's descendantsProjection tests.
- **A case is `Automated`** when the counting tests that carry its ID assert its *Then* between them. Where a *Then* hands a clause to another case by cross-reference, that clause is the other case's to assert.
- **Pointer lines** list only the files of counting tests.

### Result

| Outcome | Cases |
|---|---|
| `Automated` | 42 |
| `Open`, routed to Story 10 | 64 |
| `Open`, routed to A5 | 3 (DRAG-4.26, 4.28, 4.31) |
| `Manual` | 4 |
| **Total** | **113** |

**This matches the expected result.** No case's outcome differs from it.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 27 | 15 | 0 | 42 |
| Open | 22 | 34 | 11 | 67 |
| Manual | 0 | 2 | 2 | 4 |
| **All** | **49** | **51** | **13** | **113** |

| Suite | Automated | Open, Story 10 | Open, A5 | Manual | Total |
|---|---|---|---|---|---|
| DRAG-1 | 9 | 21 | 0 | 2 | 32 |
| DRAG-2 | 5 | 5 | 0 | 0 | 10 |
| DRAG-3 | 11 | 11 | 0 | 0 | 22 |
| DRAG-4 | 9 | 12 | 3 | 2 | 26 |
| DRAG-5 | 3 | 8 | 0 | 0 | 11 |
| DRAG-6 | 5 | 7 | 0 | 0 | 12 |

### The 42 `Automated` cases

**By surface test (20):**

| Case | Counting tests |
|---|---|
| DRAG-1.3 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …", "DRAG-1.3, DRAG-1.12: the cursor outside the context past THRESHOLD frees the card…" |
| DRAG-1.23 | bands "DRAG-1.23: a reorder onto the first card lands in the first slot…", "DRAG-1.5, DRAG-1.23: a card is locked to each context…"; xcol "DRAG-1.23: 1.b — …" |
| DRAG-2.1, 2.2, 2.3, 2.7 | classify "DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified…" |
| DRAG-2.10 | the same classify test; boardsRoute "DRAG-2.10: carries the item depth cap the API enforces" |
| DRAG-3.1 | bands "DRAG-3.1, DRAG-3.2, DRAG-3.11: …" |
| DRAG-3.2 | the same, and bands "DRAG-3.2: popped out, a release in a column is still that column's band" |
| DRAG-3.3 | bands "DRAG-3.3, DRAG-3.11: …" |
| DRAG-3.4 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …" |
| DRAG-3.6, 3.7 | bands "DRAG-3.6, DRAG-3.7: …" |
| DRAG-3.8 | bands "DRAG-3.8, DRAG-1.6: …" |
| DRAG-3.9 | bands "DRAG-3.9: …" |
| DRAG-3.10 | bands "DRAG-3.10: …" |
| DRAG-5.4 | detach "DRAG-5.4, DRAG-4.12: …" |
| DRAG-5.12 | detach "DRAG-5.12: …" |
| DRAG-6.1 | bands "DRAG-6.1, DRAG-6.2: …" |
| DRAG-6.5 | bands "DRAG-6.5: …" |

**By approved internal test (22):**

| Case | Approval | Counting tests |
|---|---|---|
| DRAG-1.4 | clock | popSession "DRAG-1.4: holding the named relation past the dwell…", "DRAG-1.4: a different named card resets…", "DRAG-1.4: the same card on its other side resets…"; placement "DRAG-1.4, TC-2.11: a specific card…" |
| DRAG-1.7, 1.8 | mapping | popSession "DRAG-1.7, DRAG-1.8: a card with no registered region…"; dragRegions "DRAG-1.7, DRAG-1.8: an id isValidCard rejects…"; dragClassification "DRAG-1.7, DRAG-1.8: is true only for a Valid target…" |
| DRAG-1.10 | mapping | dragRegions "DRAG-1.10: clips a sub-row's region…", "DRAG-1.10: a sub-row scrolled fully out of view…", describe "DRAG-1.10: clipToVisible" |
| DRAG-1.11 | clock | popSession's six "DRAG-1.11: …" tests, the two new ones included |
| DRAG-1.25 | mapping | popSession describe "DRAG-1.25: merged-column boundsRect…"; dragRegions "DRAG-1.25: …" ×2 |
| DRAG-1.30 | clock | popSession "DRAG-1.30: …" ×3, and "DRAG-1.3, DRAG-1.30: outside for >= THRESHOLD pops out…" |
| DRAG-3.15 | mapping | dragBands "DRAG-3.15: exactly one card halves the edge…"; popSession "DRAG-3.15, DRAG-3.21: …" |
| DRAG-3.21 | mapping | popSession "DRAG-3.21: at Board layer the band reads the region's live rect…", "DRAG-3.15, DRAG-3.21: …" |
| DRAG-4.8 | mapping | hierPlace "DRAG-4.8: excludes the given ids…", describe "DRAG-4.8: depthRangeFor", "DRAG-4.8: enumerates every depth…"; descProj "DRAG-4.8: the named row moves the gap…"; dragCollision "DRAG-4.8: steps past rows that travel with the dragged item" |
| DRAG-4.9 | mapping | hierPlace "DRAG-4.9: …" ×2 and describe "DRAG-4.9, DRAG-4.10: …"; descProj "DRAG-4.9: with no anchor, the resolved parent's first child" |
| DRAG-4.10 | mapping | hierPlace "DRAG-4.10: …" ×2 |
| DRAG-4.11 | mapping | hierPlace "DRAG-4.11: …" ×5 and describe "DRAG-4.11: resolvePlacement — the boundaries" |
| DRAG-4.18 | mapping | hierPlace "DRAG-4.18: validity is per state…", "DRAG-4.18: excludes the dragged subtree…"; descProj "DRAG-4.18: over the cap…", "DRAG-4.18: writes nothing over the cap…" |
| DRAG-4.19 | mapping | popSession "DRAG-4.19: holding it through the cue pops into the named Card…" |
| DRAG-4.23 | mapping | popSession "DRAG-4.23: nothing named…"; dragCollision "DRAG-4.23: alone in its list: nothing to anchor to" |
| DRAG-4.29 | DRAG-4.29's | descProj "DRAG-4.29, DRAG-4.30: writes nothing at the Stub's own gap and depth…" |
| DRAG-4.30 | DRAG-4.30's | descProj "DRAG-4.30: a foreign item enters at the section's last gap…" (nested last row), "DRAG-4.30: leaving the section clears it; coming back reseeds at the own slot…", "DRAG-4.29, DRAG-4.30: …" |
| DRAG-5.5 | clock | popSession "DRAG-5.5: an excursion out of the section shorter than popDelayMs…"; dragRequest "DRAG-5.5: a Descendants-layer sibling reorder…" |
| DRAG-6.10 | mapping | placement "DRAG-6.10: Board layer — an active region with no anchor previews last…"; listOps "DRAG-6.10: keeps the position sort…" |
| DRAG-6.12 | mapping | placement "DRAG-6.12: reaching a card-list region previews Free…", "DRAG-5.1, DRAG-6.12: …", "DRAG-5.3, DRAG-6.12: …" |
| DRAG-6.13 | mapping | placement describe "DRAG-6.13: priorPlacement (a re-dragged item)" |

**Where a residual rides on an approval (for Nathan to confirm).** For these cases, the counting tests assert the rule at state level. A rendered or cross-referenced clause is left over, which my proposals disclosed when Nathan approved the mapping or the category. I've read the approval as covering it, and marked them `Automated`. If Nathan wants any of these clauses tracked on its own, the Test Planner splits it into a case, since each case gets one status.

| Case | Clause not asserted by its own tests |
|---|---|
| DRAG-1.7, 1.8 | The wiring from classification to regions in `useBoardDnd.ts`. For 1.8, "`T` stays a zoom-in target for another drag" rests on the classification being per drag |
| DRAG-1.25 | The release's reposition at the ghost's slot |
| DRAG-1.30 | "A release is still the in-context reposition", which is DRAG-1.16's rule, and DRAG-1.16 is `Open` |
| DRAG-1.11 | "The release commits the top band's meaning", which is DRAG-3.1's rule (`Automated`) |
| DRAG-3.21 | The second sentence, which bands' two "DRAG-3.17: …" tests assert |
| DRAG-4.11 | The "if the last item were nested" illustration |
| DRAG-4.18 | The drawn invalid cue: the state is asserted (`valid: false`), its rendering isn't |
| DRAG-4.23 | "No side highlight shows" is asserted as no anchor being named. The release's no-anchor slot isn't asserted |

### Open cases whose ID a test carries, for Story 10 to extend

Each of these cases stays `Open` with `—`.

**Carried by counting tests that assert only part of the case:**

| Case | Test | What it misses |
|---|---|---|
| DRAG-1.1 | detach "DRAG-1.1, DRAG-5.9: …", "DRAG-1.1, DRAG-5.13: …" | The merged, expanded and Unsorted starts; these tests cover only a Stub's |
| DRAG-1.5 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …", "DRAG-1.5, DRAG-1.23: …" | Bullets 2 and 3: the Card auto-drop, and the release at Descendants |
| DRAG-1.6 | bands "DRAG-3.8, DRAG-1.6: …" | A release in `W2` before the pop out |
| DRAG-1.9 | bands "DRAG-1.9: at Board layer, a release between columns…"; xcol "DRAG-1.9: 5.a — …" | The header or footer, the toolbar, the sub-row gaps, a broken column, and "no request is made" |
| DRAG-1.12 | bands "DRAG-1.3, DRAG-1.12: …" | `{A, before}` after the pop back in, and the middle-band set-down |
| DRAG-1.14 | detach "DRAG-5.11, DRAG-1.14: …" | The column layer by distance, and "`popDistancePx` 0 → only the clock" |
| DRAG-1.24 | xcol "DRAG-1.24: 3.a …", "DRAG-1.24: 3.b …"; xproj the same | Paragraph 2: a card alone writes nothing |
| DRAG-2.4 | classify "DRAG-2.1, … DRAG-2.4, …" | Popping, and entering and leaving contexts (it seeds `NO_POP`) |
| DRAG-2.8 | classify "DRAG-2.8: a Stub drag is classified exactly like a Card would be…" | Depth-capped for a Stub drag, and "no classification" on Unsorted, a broken column and an expanded column's wrapper |
| DRAG-3.11 | bands "DRAG-3.1, DRAG-3.2, DRAG-3.11: …", "DRAG-3.3, DRAG-3.11: …" | The bottom band's ghost mid-drag, and "no position value invented" |
| DRAG-3.17 | bands "DRAG-3.17: the reservation invariant — …" ×2 | The collapse while locked, and its return at Board layer |
| DRAG-4.12 | detach "DRAG-5.4, DRAG-4.12: …" | "No anchor, append fallback", and "the Descendants layer can't be reached" |
| DRAG-5.1 | detach "DRAG-5.1, DRAG-5.10: …" | The anchor `{Q, after}`: it asserts only that the position isn't null |
| DRAG-5.9 | detach "DRAG-1.1, DRAG-5.9: …" | The named anchors of bullets 1–2, the tab-right reparent, and the over-cap bullet |
| DRAG-5.10 | detach "DRAG-5.1, DRAG-5.10: …" | Both copies' form, the zoom into `Q`, and the cancel |
| DRAG-5.11 | detach "DRAG-5.11, DRAG-1.14: …" | "Arrives locked in the column, shown as a Card", the column's reposition, and the stop-inside-`P` half |
| DRAG-5.13 | detach "DRAG-1.1, DRAG-5.13: …" | The pop out to `P`'s Card layer, never `S1`, and the set-back-down |
| DRAG-6.2 | bands "DRAG-6.1, DRAG-6.2: …" | The position unchanged and not `null`, and "another item's response re-sorts the list" |

**Carried by internal tests without an approved mapping.** These are listed, not mapped:
- DRAG-1.1: popSession "DRAG-1.1: starts locked in the origin context…".
- DRAG-1.6: dragRegions "is null in the gap between two sub-rows (DRAG-1.6: …)".
- DRAG-1.14: popSession "DRAG-1.14: …" ×2.
- DRAG-2.5: dragClassification "only the Free descendants carry the relationship marker (DRAG-2.5)".
- DRAG-2.6: dragClassification "… (DRAG-2.3, 2.6)". The "2.6" is a prefix-less tail, and the attribution is wrong: a classification test can't assert de-emphasis.
- DRAG-2.8: dragClassification describe "classifyDragTargets — Stub drag (full classification, DRAG-2.8)".
- DRAG-3.11: placement "DRAG-3.11: …".
- DRAG-4.1: dragRequest "DRAG-4.1, DRAG-5.4: attach: …".
- DRAG-5.1: dragRequest "DRAG-5.1: detach…", and placement "DRAG-5.1, DRAG-6.12: …".
- DRAG-5.2: dragRequest "DRAG-5.2: …".
- DRAG-5.3: placement "DRAG-5.3, DRAG-6.12: …".
- DRAG-5.9: placement "DRAG-5.9: at its own Descendants section, mid-drag…".
- DRAG-6.4: reconcile "DRAG-6.4: …".
- DRAG-6.6: dragRequest "DRAG-6.6: …", which isn't approved (Stop 1).

**Automated cases with extra, non-counting internal tests.** These cases are `Automated` through the tests above, and these files don't go on their pointer lines:
- DRAG-1.3: popSession;
- DRAG-2.1, 2.2, 2.3, 2.7: dragClassification's mid-title IDs;
- DRAG-3.1, 3.3, 3.7, 3.9, 3.10: dragRequest and placement;
- DRAG-5.4 and 5.12: placement and dragRequest.

### Catalog-wide checks

- **Lost coverage: none.** No case outside this feature is `Automated`. item-attachment and item-positioning still carry the legacy marks, which batches 4 and 5 convert.
- **Unknown IDs: none.**
  - Every DRAG ID in a test title resolves.
  - No title carries a deleted ID (DRAG-4.2, 4.27 or 6.3).
  - `case-id` reports 0 across the plans and tests (Test Planner, 2026-09-28).
  - The one unresolved form left is dragClassification's prefix-less "2.6", above.
- **`Manual` cases carried by a test: none.** No title carries DRAG-1.29, 1.32, 4.24 or 4.25.
- **Skipped tests: 8, all known.**
  - zoom ×2 carry no IDs yet; they're DRAG-4.15's and DRAG-4.1's when Story 10 un-skips them;
  - xcol's and xproj's six "drag C onto card X" tests (Story 10 item 3).
- **Bare `TC-n` outside the files the Coder touched:**
  - `client/src/components/workflow/placement.ts` lines 88 and 128, old DRAG-5 in-suite IDs in source comments;
  - `server/tests/routes/items.hierarchy.test.ts` line 14, for batch 4 or 5.

  The Test Planner's 2026-09-28 note already records them.

### Destinations

**Story 10** (`docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, item 1):
- **It lists DRAG-4.29, which is now `Automated`.** Remove it, and change "65 cases" to 64.
- Every one of the 64 routed cases is named there by ID.
- Items 2 and 4 agree with the result:
  - item 2 routes DRAG-4.1, 4.5, 4.12 and 4.14–4.17 through item 1;
  - item 4 calls DRAG-4.8–4.11 and 4.18 no longer gaps, and keeps DRAG-1.21, 4.13 and 5.9.

**A5** (`docs/planning/tech-debt-stories/a5-wiki-and-test-plan-heirarchy-updates.md`, D1):
- It names DRAG-4.26, 4.28 and 4.31, which matches.
- **For A5, when the cases move:** tests already pin DRAG-4.28's and 4.31's rules without their IDs. They're candidate internal mappings, and would need approval:
  - hierPlace "a null root (the sidebar's virtual top) yields depth-0 rows with parentId null";
  - hierPlace "an empty hierarchy under a null (sidebar virtual) root reads parentId null";
  - hierPlace's describe "resolvePlacement — a Top whose children are hidden from rows (a collapsed Top)";
  - projTree's `fullChildrenOf` describe.

**No other mismatch, in either direction.**

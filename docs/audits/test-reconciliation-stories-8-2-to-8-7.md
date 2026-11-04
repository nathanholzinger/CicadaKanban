# Test reconciliation: Epic 3.5 Stories 8.2–8.7 (Story 8 close-out)

Writing run, story-done checklist step 5, at HEAD `ad4ac70` on `claude/stories-8-2-to-8-7-reconciliation`. No gate or test was run (no shell). Every verdict below comes from reading the test code. A skipped test counts for nothing (`docs/test-plans/README.md`, "Which tests count"), and the only internal pointers counted are the ones already approved (DRAG-7.2's `itemListOps.test.ts` test, DRAG-7.16's `modalPlacement.test.ts`) plus the README's two standing categories.

## In brief

- **The tier cases have no rendered-tier test on any surface.** That covers DRAG-2.14–2.23, DRAG-6.23, DRAG-6.24, DRAG-7.12 and TREE-2.4–2.8. Every test of the tiers is a classification test, a hook test or a jsdom class-list check. No test reads `data-drop-tier` or computed opacity in a rendered Descendants section, the modal or the sidebar. All of these cases stay `Open`, for Story 10.
- **Six `Automated` cases go back to `Open`.**
  - DRAG-7.12, DRAG-7.27 and TREE-2.1: their old-value specs are skipped. DRAG-7.12's running test checks only `data-drop-state`.
  - DRAG-7.15 and DRAG-7.17: their only tests for one clause each are skipped.
  - DRAG-6.15: the narrowed text names two triggers. The approved hook test drives neither of them (it uses a column-save failure), and no test drives the stale-reindex path.
- **Two cases move to `Automated`:**
  - DRAG-7.2: the surface overflow-row specs plus the approved `itemListOps.test.ts` pointer.
  - DRAG-7.11: the surface isolation spec plus `popSession.test.ts`'s clock test, which is in the standing drag-clock category.
- **No test covers the forced-stop banner staying across "Loading board…"** (DRAG-6.16). I looked: no `BoardView` test exists, no spec reads `data-forced-stop`, and the cue's two test files never render the loading branch. Nothing tests the flash either (DRAG-6.20, DRAG-6.21): no test reads `data-stop-flash`.
- **DRAG-3.25 has no rendered-height test**, and neither does DRAG-3.22's geometry. The tests are a class/number equality check (`cardMetrics.test.ts`), a class check (`TypePill.test.tsx`) and pure geometry math (`dragOverlayGeometry.test.ts`).
- **DRAG-2.11 could close on one approval.** The pending-tree hook tests in `useBoardDnd.test.ts` assert both of its setups. They need Nathan's approval and two ID stamps.
- **Not named by Story 10's entry, so they go to the Architect:** DRAG-1.36, DRAG-2.11 and DRAG-2.12. Story 10's item 1 also still lists the retired DRAG-2.5 and DRAG-2.6.
- **The roadmap's carried 8.1 block still lists DRAG-2.13 as `Open`.** That is stale: Story 8.5 retired it. I didn't look for it as a case, and no test or comment carries it.

## What this run wrote

`docs/test-plans/board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md`:
- DRAG-7.2: `Open` → `Automated`. Automation test: `tests/ui/drag-7-overflow-row.spec.ts`, `client/src/components/workflow/itemListOps.test.ts`.
- DRAG-7.11: `Open` → `Automated`. Automation test: `tests/ui/drag-7-hierarchy-modal.spec.ts`, `client/src/components/workflow/popSession.test.ts`.
- DRAG-7.12, DRAG-7.15, DRAG-7.17 and DRAG-7.27: `Automated` → `Open`, with the Automation test line set to `—`.

`docs/test-plans/board-drag-interaction/drag-6-preview-reconciliation.md`:
- DRAG-6.15: `Automated` → `Open`, with `—`. Nathan's approval of `useBoardDnd.test.ts` for this case stands. A later run can put the pointer back beside the tests that complete the case without asking him again.

`docs/test-plans/project-tree/tree-2-what-the-drag-shows.md`:
- TREE-2.1: `Automated` → `Open`, with `—`.

In each case the status-table row and the case body were changed together. Nothing else in the catalog was touched.

---

## Coverage Mapping

Each entry says which tests carry the ID, whether they run, and which clause of the *Then* none of them asserts. "Internal (unapproved)" means the test calls client code directly and needs Nathan's approval before it counts.

### 8.2 (built as 8.1's Phase 3): a Free Card zoomed into a section follows the cursor

- **DRAG-1.35, `Open`.**
  - What carries it:
    - `popSession.test.ts:266`, "DRAG-1.35: there is no further child to zoom into…". This is a clock test, in the standing category.
    - `placement.test.ts:369`, "DRAG-3.22, DRAG-1.35: across a real zoom-in…". Internal (unapproved): it covers the form switch.
  - Missing: no surface test shows that a full hold reaches Descendants at once, bounded by the whole Card, with both copies as Stub rows, for a Card with children and for one without.
- **DRAG-4.34, `Open`.**
  - What carries it: `dragRequest.test.ts:244`, "DRAG-4.34: a reparent with an anchor slot for a different parent…". This is a request rule, in the standing category.
  - Missing: every gesture clause. The carried Stub following within `P`'s box, rows shuffling, the three placements and their writes, and the popped-out-Stub reparent variant have no test.
- **DRAG-4.1, `Open`.**
  - What carries it:
    - `dragRequest.test.ts:189` (the request's last-child anchor). Standing category.
    - `descendantsProjection.test.ts:74, :153` (seeded as the last child). Internal (unapproved).
    - Both `drag-card-zoom-in.spec.ts` tests, which carry no ID and are skipped.
  - Missing: the committed write after a zoom (`parentId`, `isAttached`, workphase `W2`, last after `S2`), and the detached-child re-attach clause.
- **DRAG-7.10, `Open`.**
  - What runs:
    - `drag-7-hierarchy-modal.spec.ts:368`, "DRAG-7.10: a pop out of the modal, past the Card's box, detaches the item…".
    - `:401`, header pops nothing.
    - `:628`, brief excursion.
  - What is skipped: `:338`, and `drag-7-modal-hold.spec.ts:721`.
  - Missing:
    - one pop while still inside `P`'s box, landing in `K`, bounded and drawn as a shortCard;
    - the `{anchorId: Q, side: after}` write;
    - an item brought in Free staying Free;
    - the expanded sub-row clause;
    - the distance term against the modal's box.
- **DRAG-7.13, `Open`.**
  - What runs: `drag-7-modal-hold.spec.ts:81, :111, :132`, which cover the dwell, the cue, the open, an early release, and a hold below the overflow row by `B`.
  - Missing: the first clause's drag by a Free Card zoomed in from outside `P`. In every spec, `X` is a Stub of `P`.

### 8.3

- **DRAG-4.35, `Open`.**
  - What carries it: `useBoardDnd.test.ts:218`, "is the row dnd-kit announces over a move event that names the row before it". Untagged, internal.
  - What that test asserts: only that `projection.gap` becomes 2 after `onDragOver`.
  - Missing: the side highlight, the release writes (depth 0 to `A, B, X, C`; depth 1 to `B`'s first child), the carried `XC`, and both approach directions. I didn't take a painted ghost or a write from the test's title.
- **DRAG-7.15, `Automated` → `Open`.** Running in `drag-7-modal-hold.spec.ts`:
  - `:252`, from below to both gaps (`X`, then `B`);
  - `:374`, from above to the gap above;
  - `:401`, the same, with a child.

  Missing: from above to **the gap below** the overflow row, with and without a subtree. Both of those specs are skipped (`:322`, `:349`). The other 7.15 tests are internal and not approved for this case: `modalPlacement.test.ts`, `descendantsProjection.test.ts:464–498`, and `HierarchyModal.test.tsx:134`.
- **DRAG-7.27, `Automated` → `Open`.** Its only test, `drag-7-overflow-row.spec.ts:359`, is skipped. The revised clauses (drawn at Low, never a neighbor, the gap after `Q` running to `T`) have no running test.
- **DRAG-7.17, `Automated` → `Open`.** Its two specs, separately:
  - **Running:** `drag-7-modal-hold.spec.ts:617`, "DRAG-7.17: when R's children run longer than the modal…". It asserts the whole below-gap clause: the list is scrolled, the ghost is under the cursor, and the release commits last after `E19`.
  - **Skipped:** `:650`, "DRAG-7.17: from the gap above R's overflow row…". This is the above-gap clause (many rows before `R`; the release commits first among `R`'s children). Nothing else asserts it.
  - `modalPlacement.test.ts:42–67` carry the ID but are scroll math, internal, and not approved for this case. Even approved, they wouldn't reach the above-gap release.

### 8.4

- **DRAG-6.15, `Automated` → `Open`.**
  - What carries it: `useBoardDnd.test.ts:236` (approved), "DRAG-6.15: ends an item drag that began while the save was in flight…". The resync it drives is a failed **column save**.
  - The narrowed case names two triggers: another item's failed drop, and a stale response carrying reindex pairs. Neither is driven by a test carrying the ID.
  - The stale path, `dragRequest.ts:163–164`, which calls `resync('refresh')`, is not driven mid-drag by any test. `useBoardDnd.test.ts:318` simulates it through the panel's armed stop, which calls `resyncBoard` directly.
  - "X renders where the reloaded board has it" is asserted only by the untagged surface tests `drag-7-hierarchy-modal.spec.ts:689` (DRAG-7.23) and `drag-7-modal-hold.spec.ts:464` (DRAG-7.25), both on a Stub in the modal.
- **DRAG-6.16, `Open`.**
  - What partly covers it:
    - `useBoardDnd.test.ts:301` and `:318` report `{cause, itemId}` for `write-failed` and `refresh`;
    - `ForcedStopCue.test.tsx:15` puts the wording in the status element.
  - Missing:
    - **the banner staying visible over "Loading board…" and over the reloaded board.** I looked for it: `BoardView.tsx` has no test file, no spec reads `data-forced-stop`, and the two cue tests never render the loading branch;
    - the three surfaces (column, section, modal);
    - the literal wording. The cue test compares against `STOP_WORDING`, not the case's text.
- **DRAG-6.17, `Open`.**
  - What partly covers it: `ForcedStopCue.test.tsx:9`, an empty `role="status"` element, and `:15`, the text placed in it.
  - Missing: an announcement surviving the loading transition, with the cause unchanged.
- **DRAG-6.18, `Open`.**
  - What partly covers it: `useForcedStop.test.ts:28` calls `clear()` directly.
  - Missing: that a click leaves the cue up; that a pickup actually clears it (the `BoardView` wiring); and a clear during the fade.
- **DRAG-6.19, `Open`.**
  - What partly covers it: `useForcedStop.test.ts:12` (gone at `T`, with `T` as a parameter) and `ForcedStopCue.test.tsx:25` (`animationDuration` equals `T`).
  - Missing: fully visible for three quarters of `T`, then a fade. That lives in `index.css::forced-stop-fade` and is untested. Also missing: that the reload doesn't restart the lifetime.
- **DRAG-6.20 and DRAG-6.21, `Open`.** No test of any kind: nothing reads `data-stop-flash`, and `ForcedStopContext.ts` has no test.
- **DRAG-6.22, `Open`.**
  - What partly covers it: `useBoardDnd.test.ts:342` (cancel), `:353` (no-write release), `:364` (released before an armed stop) and `:266` (a column-save resync with no item drag).
  - Missing: a resync landing **during** a column drag. Also, these assert only that `onDragStopped` isn't called, not that no banner, announcement or flash renders.

### 8.5

All of DRAG-2.14–2.23, DRAG-6.23 and DRAG-6.24 stay `Open`. No test carries any of those IDs. The candidate internal tests, and what each asserts, are under Proposed Internal Mappings. **No test anywhere renders a tier in a live section, modal or sidebar.** One clause for each case:

| Case | Asserted by an untagged internal test | Missing on every surface |
|---|---|---|
| DRAG-2.14 | tier `parent` for a Valid Card and Stub (`dragClassification.test.ts:80`); no class and `data-drop-tier=parent` (`dragChrome.test.tsx:133`) | Full rendered in the section and the modal; no relationship color |
| DRAG-2.15 | a Free descendant and a Depth-capped Free Card are `anchor`, their Stub `neither` (`dragClassification.test.ts:84, :90`; `dragChrome.test.tsx:112`) | rendered at `overlayAnchorOpacity`; still namable for a reposition |
| DRAG-2.16 | Depth-capped Stub under a Valid parent `anchor`, the rows below `neither` (`dragClassification.test.ts:84, :90`) | rendered tiers; a valid shallower state beside a Low row (see DRAG-7.21's spec under Proposed Stamps) |
| DRAG-2.17 | a dragged Stub's descendants `neither`, a Free descendant `anchor` (`dragClassification.test.ts:112, :197`) | Low drawn in place, never Top or Bottom, unchanged after a pop or a zoom |
| DRAG-2.18 | overflow row `parent` for a Valid owner, `neither` otherwise, never `anchor` (`dragChrome.test.tsx:163`) | rendered; count meaning kept |
| DRAG-2.19 | none for the board (the sidebar has a hook test) | tiers held across layers, held through a response landing mid-drag, cleared on drop, cancel and forced stop, Full after a drop |
| DRAG-2.20 | ghost class on the root with no tier; carried copy and idle row with none (`dragChrome.test.tsx:133, :155`) | static rows under the backdrop; non-targets; independent `overlayGhostOpacity` |
| DRAG-2.21 | tier on the content wrapper and not the root; a Card's Stubs outside its wrapper, with no compounding (`dragChrome.test.tsx:126, :198, :211`) | the drop line at Full on a Mid named neighbor, rendered |
| DRAG-2.22 | none tagged; `popSession.test.ts:245` (an invalid Card is never a zoom candidate) | Depth-capped owner: no hold (running in DRAG-7.21's spec, untagged); Cycle-forming owner passed over (only in the skipped DRAG-7.27 spec) |
| DRAG-2.23 | pending detach is `cycle-forming`/`anchor`; pending attach into `X` is `neither`; the drawn-as-Stub test (`useBoardDnd.test.ts:146, :162`; `dragClassification.test.ts:122`) | `D` previewed under `P` (Mid) and under `Q` (Low); pending detach from `Q` (Mid while Depth-capped); rendered |
| DRAG-6.23 | a pending row keeps its tier class and gains the pulse class (`dragChrome.test.tsx:177`) | the relative endpoints (`index.css::drag-tier-pulse`), the ghost's pulse, and the pulse ending, all rendered |
| DRAG-6.24 | pulse on the content, not the root (`dragChrome.test.tsx:177`), and by structure a Card's Stubs sit outside its wrapper (`:211`) | pending `P` with a non-pending `S`, `S` alone, both pending; a line on a pending row not pulsing |

- **DRAG-7.12, `Automated` → `Open`.**
  - What runs: `drag-7-hierarchy-modal.spec.ts:280`, "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…". It asserts `data-drop-state` only.
  - What is skipped: `drag-7-modal-hold.spec.ts:686`, which pins the old opacity.
  - Missing: `R` and `R1` Full, `R1a` Mid, `Y` Low, no compounded dim, no recomputation on open, and no tier on the backdrop rows.
- **DRAG-7.27:** see 8.3 above.
- **DRAG-4.8 and DRAG-4.18 (reworded subtree text), stay `Automated`.** The approved pointers assert the reworded clause, that `X` and its subtree are passed over and never Top or Bottom:
  - `hierarchyPlacement.test.ts:53`, "DRAG-4.8: excludes the given ids, and never walks into their children";
  - `dragCollision.test.ts:461`, "DRAG-4.8: steps past rows that travel with the dragged item";
  - `hierarchyPlacement.test.ts:316`, "DRAG-4.18: excludes the dragged subtree, so no depth can ever resolve a cycle".
- **DRAG-4.35 (reworded):** see 8.3 above.

### 8.6

- **DRAG-3.25, `Open`.**
  - No test carries it, and no test measures a rendered height.
  - `cardMetrics.test.ts` checks that `STUB_ROW_HEIGHT_CLASS` matches `STUB_ROW_HEIGHT_PX`, and that the row box has no padding class.
  - `TypePill.test.tsx` checks the `leading-none` class.
  - Neither can see a border, a pill or content growing a box. Every representation the case lists (section, overflow, modal, backdrop, ghost, carried copy, typed and untyped) needs a Playwright spec reading boxes. The deleted probe is not coverage.
- **DRAG-3.22, `Open`.** Its tests:
  - `dragOverlayGeometry.test.ts:101, :118, :138`: internal (unapproved) width and pointer math;
  - `placement.test.ts:369`: internal (unapproved) form switch.

  Missing: the in-list ghost as a Stub row, the "held" shadow, the copy staying under the pointer through a real zoom and pop, and a Stub copy from pickup. All of these are rendered. The handoff's measured carried copy came from a Stub pickup, not a Free Card's zoom.
- **DRAG-7.17:** see 8.3 above.

### 8.7

- **TREE-2.1, `Automated` → `Open`.**
  - What is skipped: its only spec, `project-tree-drag.spec.ts:241`, which pins 0.4.
  - Untagged internal tests:
    - `useProjectDragReorder.test.ts:373` (no tiers before a pickup or after a release or cancel);
    - `:389` (descendants `neither`, own row none, `P1`–`P4` `parent` at cap 12);
    - `SortableProjectRow.test.tsx:68` (dragged row takes the ghost class).
  - Missing: Low rendered at `projectNeitherOpacity`, the dragged row at `projectDraggedOpacity`, and every row Full after the drag. All rendered.
- **TREE-2.4, `Open`.**
  - What partly covers it: `useProjectDragReorder.test.ts:399` (cap 5, `X` two levels: `P3` `anchor`, `P4` `neither`) and `lib/dragTargets.test.ts:62, :68`.
  - Missing: the rendered opacities, opacity as the only change, and no row removed.
- **TREE-2.5, `Open`.**
  - What partly covers it: `lib/dragTargets.test.ts:27, :33, :50` (a top-level row is `parent`, `anchor` when only the top level fits, `neither` when the subtree fits nowhere). This tests the walk, not the sidebar hook.
  - Missing: rendered tiers.
- **TREE-2.6, `Open`.**
  - What partly covers it: `useProjectDragReorder.test.ts:427` (a project added under `X` mid-drag; the `tiers` and `tierVars` identities are unchanged).
  - Missing: the case's own scenario, where `P` is reparented under `Q` and `P` stays Full; and the next pickup redrawing `P` as Mid. Rendered too.
- **TREE-2.7, `Open`.**
  - What partly covers it: `SortableProjectRow.test.tsx:85` (the line sits outside the dimmed box, by structure).
  - Missing: the line at full strength on a Mid row (rendered), and the gap after Low `P_CAP` offering the valid top-level state, whose release saves `parentId: null` after `P1`. No test exists for the second.
- **TREE-2.8, `Open`.**
  - What partly covers it: `useProjectDragReorder.test.ts:451, :461, :472` (strengths read from storage at pickup, never the board's three).
  - Missing: `ProjectSidebar.tsx` setting `tierVars` on its list (untested), the rendered values, and the board keeping its values when the sidebar's change.
- **Hierarchy-placement §7 references on DRAG-2.14–2.23, DRAG-6.24 and DRAG-7.12:** the reference changes don't change any verdict above. The shared walk (`lib/dragTargets.ts`) is tested once, for projects. That proves neither surface's rendering.
- **DRAG-2.16's valid shallower states beside Low rows:** no test carries it. The nearest running test is DRAG-7.21's spec at `drag-7-modal-hold.spec.ts:797–807`. There, `R` is Depth-capped for `X`, so `R`'s overflow row is Low, and tabbing to `L − 1` gives `6:2:true`, a valid state.
- **DRAG-2.19 and TREE-2.6, the response-landing clause:** only the sidebar has a test, and it uses a different scenario. The board has none.

### Carried from 8.1

- **DRAG-1.36, `Open`.** Untagged internal tests: `useBoardDnd.test.ts:96` (pending attach of an ancestor: the drag starts in `b`) and `:121` (pending detach: it starts in `c`). Both assert `containingCardId`. Missing: "bounded by the whole box" of `Q` or `P`.
- **DRAG-2.11, `Open`.** Untagged internal tests:
  - `useBoardDnd.test.ts:136`: cap 3, `A` pending under `B`; `Y` is `depth-capped` and `A` is `valid`. The fixture's `X` is `A`'s child rather than an unrelated leaf, which doesn't change the rule asserted.
  - `:170`: a pending detach still counts the kept parent.

  Together they assert the whole case once approved.
- **DRAG-2.12, `Open`.** Untagged internal tests:
  - `useBoardDnd.test.ts:146`: the pending-attached item itself is `cycle-forming`;
  - `:162`: a pending detach keeps the item a descendant.

  Missing: the first setup's chain, where `A`'s Free child `D` is Cycle-forming through `A`'s pending attach. The test checks only the pending item, not a descendant of it.
- **Phase 9's other tests** (`itemListOps.test.ts`, the "rendered reads" and `withPendingParents` blocks at `:30–95`) are helper-only safeguards that feed classification. I propose no stamp. DRAG-2.4 is untouched by them.
- **DRAG-7.2, `Open` → `Automated`.**
  - The surface tests: `drag-7-overflow-row.spec.ts:37` ("2 children", not counting `R1a` or `F`, and `T` with no overflow row), `:64` ("1 child"), and `:117` and `:147` ("3 children" after a release).
  - The approved pointer: `itemListOps.test.ts:346`, which covers the dragged item left out of the count, and no row when it was the only child.
  - Together they assert the whole case. The gesture path back into the section is DRAG-7.6's, and stays skipped there.
- **DRAG-7.31's category:** see Proposed Internal Mappings.
- **Re-check of Phase 5's coverage:**
  - **DRAG-1.14, `Open`.**
    - What carries it: `popSession.test.ts:101, :109, :144, :291` (column, off at 0, merged outer body, the Card's box), which have Nathan's A6 approval, and the surface spec `drag-5-stub-detach.spec.ts:206`.
    - Missing: the distance term measured against **the modal's box**.
  - **DRAG-1.28, `Open`.** `dragOverlayGeometry.test.ts:61` is internal and unapproved (its earlier proposal still stands). Missing: every surface clause.
  - **DRAG-1.35:** see 8.2 above.
  - **DRAG-3.22:** see 8.6 above.
  - **DRAG-4.1:** see 8.2 above.
  - **DRAG-4.12, `Open`.**
    - What carries it: `drag-5-stub-detach.spec.ts:240`, a surface test that attaches to a childless `Q`; `dragRequest.test.ts:182`, in a category; and `KanbanCard.test.tsx:97`, internal and unapproved.
    - Missing: one state under any offset; a release after moving; and the Free-children-only clause.
  - **DRAG-4.30, `Open`.** `descendantsProjection.test.ts:74, :122, :147, :153, :165, :434` are internal and unapproved. Missing: the surface seed, with the cursor over `S1` and a release attaching last.
  - **DRAG-4.34:** see 8.2 above.
  - **DRAG-5.1, `Open`.**
    - What carries it: the surface spec `drag-5-stub-detach.spec.ts:147` and the clock test `popSession.test.ts:285`.
    - Missing: the `{anchorId: Q, side: after}` write (the spec asserts only that the position isn't null), bounded by the column, and the expanded sub-row clause.
  - **DRAG-5.4, `Open`.**
    - What carries it: `drag-5-stub-detach.spec.ts:240`.
    - Missing: no intermediate detach write (the spec counts no writes); and "last among `Q`'s children", since `Q` has no children in that fixture.
  - **DRAG-5.13, `Open`.**
    - What carries it: `drag-5-stub-detach.spec.ts:84` (pickup context, running) and `popSession.test.ts:285` (one pop, clock); `:111` is skipped.
    - Missing: the release write (`{Q, after}`, `isAttached: false`, `parentId = S1`, `S1b` still attached), both copies as shortCard, and the section showing neither.
  - **DRAG-7.2:** see above.
  - **DRAG-7.11, `Open` → `Automated`.**
    - The surface test: `drag-7-hierarchy-modal.spec.ts:425`. With the cursor on `P`'s own section behind the backdrop, the projection stays among the modal's rows and the carried copy stays inside the modal's list.
    - The clock test, in the standing category: `popSession.test.ts:166`, where resting over a Card under the backdrop runs the pop-out clock to the column.
    - Together they assert the whole case, so no extra surface check is needed (Story 10 item 10's condition).
  - **DRAG-7.14, `Open`.**
    - What carries it: running `drag-7-modal-hold.spec.ts:154` and `:223`, plus clock tests `popSession.test.ts:460, :471, :482`.
    - Missing: the hold running on in the Card's title or padding and completing there. The skipped `:190` contradicts the current rule.

---

## Lost Coverage

I checked every `Automated` case in the catalog (309 before this run) for an ID-carrying test. I took all ID occurrences in `tests/`, `client/src/` and `server/tests/` and spot-checked 15 of them to make sure they sit in titles and not just comments.

- **TREE-2.1:** the only test carrying its ID is skipped (`project-tree-drag.spec.ts:241`). Moved to `Open`.
- **DRAG-7.27:** same (`drag-7-overflow-row.spec.ts:359`). Moved to `Open`.
- **No other `Automated` case lacks a test carrying its ID.** DRAG-7.12, DRAG-7.15, DRAG-7.17 and DRAG-6.15 still have running ID-carrying tests. They moved to `Open` for full-*Then* gaps, not lost coverage.

## Unknown IDs

- **No test title or code comment carries an ID the catalog lacks.** Every board-drag ID found in tests is a catalog case.
- **No test or comment carries a retired ID** (DRAG-1.21, 4.14, 4.16, 5.11, 5.12, 2.5, 2.6, 2.13). The DRAG-2.5 fixture comment Story 8.6 removed is gone.
- **A comment-only ID:** `drag-7-modal-hold.spec.ts:36` names DRAG-7.20, a `Manual` case set by the Test Planner, in a header comment. It's not a test title, so it needs no action.
- **Stale ID lists in planning docs** (planning docs are outside my write scope):
  - the roadmap's carried 8.1 block still names DRAG-2.13;
  - Story 10's item 1 still lists DRAG-2.5 and DRAG-2.6, and item 4 still describes DRAG-1.21's spec work, though it notes the retirement.
- **No Planner-set `Manual` case** (DRAG-1.29, 1.32, 4.24, 4.25, 7.20) has its ID on a test title.

---

## Proposed Stamps

Exact titles for the Coder. "Surface" means the test counts without approval once stamped. "Internal" means the stamp counts only after Nathan approves the mapping (next section).

**Surface:**
1. `tests/ui/drag-7-modal-hold.spec.ts:760` → `'DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits'`. In that fixture `R` is Depth-capped for `X`, so this covers DRAG-2.22's Depth-capped-owner clause. Adding `await expect(overflowRow(page, r.id)).toHaveAttribute('data-drop-tier', 'neither')` would also show DRAG-2.18 and DRAG-2.16's shallower-state clause on the surface.
2. `tests/ui/drag-7-hierarchy-modal.spec.ts:689` → `'DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open'`. This covers the failed-drop half of DRAG-6.15. The stale-reindex half still needs a test.

**Internal:**

3. `client/src/components/workflow/useBoardDnd.test.ts`:
   - `:136` → `'DRAG-2.11: counts depth through an ancestor whose attachment is still pending'`
   - `:170` → `'DRAG-2.11: still sits one level down, for the depth of what is put under it'`
   - `:146` → `'DRAG-2.12, DRAG-2.23: classifies an item a pending attachment puts in the dragged Card as its descendant'`
   - `:162` → `'DRAG-2.12, DRAG-2.23: is still a descendant of its parent, and now a Card of its own, so an anchor'`
   - `:96` → `'DRAG-1.36: is the Card it is drawn under, when an ancestor’s attachment is still pending'`
   - `:121` → `'DRAG-1.36: is a Card whose own detach is still pending, which is drawn Free'`
   - `:218` → `'DRAG-4.35: is the row dnd-kit announces over a move event that names the row before it'`
   - `:301` → `'DRAG-6.16: is reported once, with the cause, when a failed write reloads the board mid-drag'`
   - `:318` → `'DRAG-6.16: is reported with the cause "refresh" when an armed stop fires, once, and spends the arm'`
   - `:342` → `'DRAG-6.22: is not reported for Escape or any other cancel'`
   - `:353` → `'DRAG-6.22: is not reported for a release that writes nothing'`
   - `:364` → `'DRAG-6.22: is not reported when a drag is released before an armed stop fires'`
   - `:266` → `'DRAG-6.22: reloads the board when no drag is live'`
4. `client/src/components/workflow/useForcedStop.test.ts`:
   - `:12` → `'DRAG-6.19: holds a reported stop for the cue’s time, and then lets it go'`
   - `:28` → `'DRAG-6.18: lets it go at the next drag’s start, without waiting out the time'`
5. `client/src/components/ForcedStopCue.test.tsx`:
   - `:9` → `'DRAG-6.17: keeps an empty status element while no drag has been stopped, for assistive tech to announce into'`
   - `:15` → `'DRAG-6.16, DRAG-6.17: says why in the status element when the cause is %s'`. First change it to assert the case's literal sentences (Test Quality Concerns, 1).
   - `:25` → `'DRAG-6.19: times its fade to the cue time'`
6. `client/src/components/workflow/dragClassification.test.ts`:
   - `:80` → `'DRAG-2.14: is "parent" for a legal parent, a Free Card or a Stub'`
   - `:84` → `'DRAG-2.15, DRAG-2.16: is "anchor" for a Free Card that is no legal parent, whatever its parent, and for a Stub too deep under a legal parent'`
   - `:90` → `'DRAG-2.15, DRAG-2.16, DRAG-2.17: is "neither" for a Stub whose parent is no legal parent, at any depth below it'`
   - `:112` → `'DRAG-2.17: is one tier per item for a dragged Stub: its descendants "neither", its sibling and parent "parent"'`
   - `:122` → `'DRAG-2.23: reads a descendant by the Stub test it is handed, not its stored attachment'`
   - `:197` → `"DRAG-2.17: a Stub's own descendants are still Cycle-forming, the Free ones an anchor and the Stubs neither"`. Its describe already carries DRAG-2.8.
7. `client/src/components/dragChrome.test.tsx`:
   - `:112` → `'DRAG-2.15, DRAG-2.16: draws an anchor-only target and a target that is not even an anchor at their own strengths'`
   - `:126` → `'DRAG-2.21: draws the tier on the content and never on the root'`
   - `:133` → `'DRAG-2.14, DRAG-2.20: draws a legal parent, the carried copy and a row with no drag at full strength'`
   - `:155` → `"DRAG-2.20: draws the dragged row at the ghost's own strength on its root, and at no tier"`
   - `:163` → `'DRAG-2.18: draws an overflow row by its owner: a legal parent in full, anything else as neither'`
   - `:177` → `"DRAG-6.23, DRAG-6.24: pulses a pending row's content, which keeps its tier, and not its root"`
   - `:198` → `"DRAG-2.21: a Stub row's tier is on a wrapper around its button, and not on the row, which holds the drop line"`
   - `:211` → `"DRAG-2.21, DRAG-6.24: a Card's tier is on its own content, and its Stubs are outside it, each at its own tier"`
8. `client/src/components/sidebar/useProjectDragReorder.test.ts`:
   - `:373` → `'TREE-2.1: has none before a pickup, and none once the drag is released or cancelled'`
   - `:389` → `'TREE-2.1: is "neither" for the dragged project’s descendants at every depth, and none for its own row, on a shallow tree'`
   - `:399` → `'TREE-2.4: is "anchor" for a row past the cap whose own parent can take the project, and "neither" below it'`
   - `:427` → `'TREE-2.6: holds for the whole drag: a response that lands mid-drag redraws nothing'`
   - the describe at `:444` → `describe('TREE-2.8: the strengths', …)`
9. `client/src/lib/dragTargets.test.ts`:
   - the describe at `:26` → `describe('TREE-2.5: a top-level row', …)`
   - `:62` → `'TREE-2.4: is an "anchor" when its own parent can take the carried project'`
   - `:68` → `'TREE-2.4: is "neither" when its own parent can not, at any depth below it'`
   - `:92` → `'TREE-2.1, TREE-2.4: has no tier, and its descendants are "neither" at every depth'`
10. `client/src/components/sidebar/SortableProjectRow.test.tsx`:
    - `:68` → `'TREE-2.1, TREE-2.8: draws the dragged row at the ghost’s strength, and it has no tier'`
    - `:85` → `'TREE-2.7: draws the drop line outside the box the tier dims, so the line keeps its own strength'`

**Waiting on the Test Planner** (no stamp until a case exists): the two non-string `projectId` tests and the pickup-after-detach spec (Candidate New Cases).

## Proposed Internal Mappings (need approval)

Nathan has approved no mapping in this section. For each, the full assertion and whether a standing category covers it:

1. **DRAG-2.11 ← `client/src/components/workflow/useBoardDnd.test.ts`** (`:136`, `:170`).
   - What it asserts: classification counts pending parents. With `A` pending under `B` and cap 3, `Y` is `depth-capped` and `A` is `valid`. A pending detach keeps its kept parent's depth, so `C` is `depth-capped` for a two-level `Z`.
   - Category: neither. This is classification, not a clock and not an ordering or request rule.
   - **With approval, DRAG-2.11 becomes `Automated`.**
2. **DRAG-2.12 ← `useBoardDnd.test.ts`** (`:146`, `:162`).
   - What it asserts: a pending-attached item under the carried Card is `cycle-forming`, and so is a pending-detached child.
   - Category: neither. Partial even with approval: the transitive Free child `D` is missing.
3. **DRAG-1.36 ← `useBoardDnd.test.ts`** (`:96`, `:121`).
   - What it asserts: the session's `containingCardId` is the Card the pending tree draws.
   - Category: neither. Partial: "bounded by the whole box" isn't asserted.
4. **DRAG-4.35 ← `useBoardDnd.test.ts`** (`:218`).
   - What it asserts: the projection's gap follows `onDragOver`'s announced row over the stale move event.
   - Category: this is "which anchor a placement names", but it's tested in the hook, not in the pure modules the category names. I'd treat it as needing approval. Partial.
5. **DRAG-6.16, DRAG-6.18, DRAG-6.19, DRAG-6.22 ← `useBoardDnd.test.ts`, `useForcedStop.test.ts`, `ForcedStopCue.test.tsx`; DRAG-6.17 ← `ForcedStopCue.test.tsx`.**
   - What they assert: the cause is reported once with the item, and not for a cancel, a no-write release or no drag. The stop is held for `T` and cleared by `clear()`. The status element exists and holds the wording. The fade duration equals `T`.
   - Category: neither. All partial (see Coverage Mapping).
6. **DRAG-2.14–2.21, DRAG-2.23, DRAG-6.23, DRAG-6.24 ← `dragClassification.test.ts`'s tier block and `dragChrome.test.tsx`'s "the drag-target tiers".**
   - What they assert: each tier by target kind and parent, the overflow row by owner, the class on the content wrapper and never on the root, a Card's Stubs outside its wrapper, the pending class beside the tier class, and the ghost class on the root with no tier.
   - Category: neither. **None of them asserts a rendered tier,** so even with approval every one of these cases stays `Open`.
7. **TREE-2.1, TREE-2.4, TREE-2.5, TREE-2.6, TREE-2.7, TREE-2.8 ← `useProjectDragReorder.test.ts`'s "the tier each row is drawn at", `lib/dragTargets.test.ts` and `SortableProjectRow.test.tsx`.**
   - What they assert: tiers handed out once at pickup and cleared at the end; the cap boundary as `anchor` then `neither`; the top level's answer; tiers held through a list change; the sidebar's three strengths read from storage, never the board's; the board's classes on the row; and the line outside the dimmed box.
   - Category: neither. The board's categories don't extend to the shared walk or the sidebar. All partial.
8. **DRAG-7.31 ← `descendantsProjection.test.ts:399`** (already stamped).
   - What it asserts: after coming in with the slot hidden, a modal reading back at `R1`'s own gap and depth gives `atOwnSlot: true`, and `descendantsReleasePlacement` returns `null` (no request).
   - Category: **in my reading, the second standing category covers its no-request assertion.** Whether a release sends a request is a client request rule whose only surface is a drag, tested in the drag's pure release module. DRAG-4.29's pointer to the same module is only a comparison, as the roadmap says.
   - Even so, the case stays `Open`. The test uses `R1`, not `R2`, which doesn't matter, but the case's remaining clauses are surface clauses: `R2` keeps position `p`, attached, with `P`'s workphase, and the modal stays open showing it there. Nathan should confirm the category reading.
9. **Earlier proposals, still unapproved, unchanged:** DRAG-1.28 (`dragOverlayGeometry.test.ts:61`), DRAG-3.22 (`dragOverlayGeometry.test.ts:101, :118, :138`; `placement.test.ts:369`) and DRAG-4.12 (`KanbanCard.test.tsx:97`). None of them would close its case on its own.

## Proposed Manual (need approval)

None. Every open clause can be reduced to a precise surface assertion:
- a rendered tier through `data-drop-tier` plus computed opacity;
- the pulse and fade endpoints through the elements' `getAnimations()` keyframes;
- heights through boxes;
- the announcement through the `role="status"` text.

## Gaps

Every `Open` case in Scope, routed by ID. Story 10's entry is `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md` at line 1166.

**Named by Story 10's entry:**
- DRAG-1.14, 1.28, 1.35 (items 1 and 10)
- DRAG-2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20, 2.21, 2.22, 2.23 (item 10, "From Story 8.5"; 2.16 and 2.19 again under "From Story 8.7")
- DRAG-3.22, 3.25 (item 10)
- DRAG-4.1, 4.12, 4.30, 4.34, 4.35 (item 10)
- DRAG-5.1, 5.4, 5.13 (item 10)
- DRAG-6.16, 6.17, 6.18, 6.19, 6.20, 6.21, 6.22 (item 10, "From Story 8.4")
- DRAG-6.15: item 10 names it as "the separate stop/no-write case", but item 1 records it as closed in A6. The Architect should make its reopening explicit in the entry.
- DRAG-6.23, 6.24 (item 10)
- DRAG-7.10, 7.13 (item 9), DRAG-7.12, 7.14, 7.15, 7.27, 7.31 (item 10), DRAG-7.17 (items 8 and 10)
- TREE-2.1, 2.4, 2.5, 2.6, 2.7, 2.8 (item 10, "From Story 8.7")

**Not named by Story 10's entry, so they go to the Architect:**
- **DRAG-1.36, DRAG-2.11, DRAG-2.12** (Phase 9's pending-write cases). A surface test can reach each one, through the classification spec with delayed responses (`delayMoveResponses`). DRAG-2.11 can also close by approving item 1 of Proposed Internal Mappings.

**Cases that can't be closed without a new or reworked spec under "No new drag tests":** every tier case (rendered tier), DRAG-3.25 and DRAG-3.22 (rendered geometry), DRAG-6.16's across-loading clause, and DRAG-6.20 and DRAG-6.21 (the flash). Each is Story 10's.

**Skipped tests** (21 E2E; no client or server unit test is skipped):

| Spec:line | IDs in title | Reason (one line above it) | Story 10 names it |
|---|---|---|---|
| `drag-7-modal-hold.spec.ts:190` | DRAG-7.14 | the layer is the whole Card's box, so padding is inside it | yes, item 10 |
| `drag-7-modal-hold.spec.ts:322` | DRAG-7.15 | from above, `T`'s top quarter now reads the gap after `T` | yes, item 10 (8.3) |
| `drag-7-modal-hold.spec.ts:349` | DRAG-7.15 | same | yes, item 10 (8.3) |
| `drag-7-modal-hold.spec.ts:650` | DRAG-7.17 | fails about 1 run in 8 alone, cause not traced | yes, items 8 and 10 |
| `drag-7-modal-hold.spec.ts:686` | DRAG-7.12 | opacity now the tier's, on a wrapper | yes, item 10 (8.5) |
| `drag-7-modal-hold.spec.ts:721` | DRAG-7.10, DRAG-7.18 | Card layer gone; the way back is a zoom from the column | yes, item 10 |
| `drag-7-hierarchy-modal.spec.ts:338` | DRAG-7.6, 7.10, 7.11 | Card layer gone; a pop lands in the column | yes, item 10 |
| `drag-7-hierarchy-modal.spec.ts:548` | DRAG-7.2, DRAG-7.6 | Card layer gone | yes, item 10 |
| `drag-7-hierarchy-modal.spec.ts:579` | DRAG-7.2 | Card layer gone | yes, item 10 |
| `drag-7-hierarchy-modal.spec.ts:604` | DRAG-7.6 | Card layer gone | yes, item 10 |
| `drag-7-overflow-row.spec.ts:359` | DRAG-7.27 | from above, `X`'s top quarter now reads the gap after `X` | yes, item 10 (8.3, 8.5) |
| `drag-5-stub-detach.spec.ts:111` | DRAG-5.13 | Card layer gone | yes, item 10 |
| `project-tree-drag.spec.ts:241` | TREE-2.1 | pins the old 0.4 | yes, item 10 (8.7) |
| `drag-card-zoom-in.spec.ts:57`, `:97` | none (header names DRAG-4.15, 4.19, 4.20) | in the header comment (`:38–50`), not one line above | yes, items 7 and 10 |
| `item-repositioning-cross-column-dnd.spec.ts:98`, `:139` | none | no reason beside them | yes, item 3 |
| `item-repositioning-cross-project-dnd.spec.ts:65`, `:97`, `:112`, `:185` | none | no reason beside them | yes, item 3 |

DRAG-7.2 and DRAG-7.11 are now `Automated` despite their skipped specs, because running tests cover them. Their skips stay Story 10's to rework or delete.

## Duplication

Reported, not judged.
- **DRAG-7.15:** the spec, `modalPlacement.test.ts`, `descendantsProjection.test.ts:464–498` and `HierarchyModal.test.tsx:134` all carry it.
- **DRAG-7.17:** the spec and `modalPlacement.test.ts:42–67`.
- **DRAG-7.2:** the surface specs and `itemListOps.test.ts` (approved, intentional).
- **DRAG-7.11:** the surface spec and `popSession.test.ts`.
- **DRAG-4.12:** `drag-5-stub-detach.spec.ts:240`, `dragRequest.test.ts:182` and `KanbanCard.test.tsx:97`.
- **DRAG-1.14:** four `popSession.test.ts` tests and `drag-5-stub-detach.spec.ts:206`.
- **The tier rule:** tested on the shared walk (`lib/dragTargets.test.ts`), on the board's adapter (`dragClassification.test.ts`) and in the sidebar hook (`useProjectDragReorder.test.ts`). The "anchor / neither past the cap" cases appear at all three layers.
- **Forced-stop cause:** `useBoardDnd.test.ts` and `ForcedStopCue.test.tsx` both assert the two causes.

## Test Quality Concerns

1. **`ForcedStopCue.test.tsx:15` and `:21` don't check DRAG-6.16's wording.** Both compare against `STOP_WORDING`, the constant the component renders, and "words the two causes differently" only checks that the two strings differ. Changed wording would still pass. They should assert the case's two literal sentences.
2. **`ForcedStopCue.test.tsx:25`** checks only `animationDuration`. The rule (full strength for three quarters, then a fade) is in `index.css::forced-stop-fade`, which no test reads (DRAG-6.19).
3. **`useForcedStop.test.ts:28`** calls `clear()` itself. It doesn't show that a pickup clears the cue, which is the `BoardView` wiring (DRAG-6.18).
4. **`useBoardDnd.test.ts:236` (DRAG-6.15)** drives a column-save failure, which the narrowed case doesn't name. `:318`'s `refresh` path is the panel's simulation (`armedStop`), not a stale response through `dragRequest.ts:163–164`.
5. **The tier tests are class-list checks in jsdom.** That applies to `dragChrome.test.tsx` and `SortableProjectRow.test.tsx`: Tailwind isn't compiled there, so no opacity is computed. The "on the screen" tests check a class on a wrapper, not `data-drop-tier` on the rendered element. `SortableProjectRow.test.tsx:53` compares against `TIER_CLASS`, the constant the row uses.
6. **`useProjectDragReorder.test.ts:427` (TREE-2.6)** adds a project under `X` rather than reparenting a Full row into a Mid position. The identity check (`toBe(tiers)`) is good evidence that nothing is recomputed, but it isn't the case's scenario, and the next-pickup redraw isn't tested.
7. **`cardMetrics.test.ts` and `TypePill.test.tsx`** guard the implementation of DRAG-3.25 (a class matching a number, no padding, `leading-none`). They can't see a border, a pill or content growing a box. The rule needs measured boxes.
8. **`useBoardDnd.test.ts:146` (DRAG-2.12)** checks the pending item itself, not a Free descendant reached through it. `:136` (DRAG-2.11) makes `X` a child of `A`, where the case's `X` is unrelated. That's harmless to the rule.
9. **The auditor's two workflow-test questions** (`server/tests/routes/workflows.test.ts`):
   - **`:51`, "returns workphases ordered by position and items with computed depth".**
     - What it proves: `GET /api/workflows/:id` returns the workphase array (one entry), and computed item depths of 0 for a root and 1 for its child.
     - What it doesn't prove: any ordering. With one workphase, every order passes.
     - Missing: two or more workphases created out of position order (or reordered through `PUT /api/workphases/reorder`), and an assertion that `res.body.workphases` ids come back in position order.
     - Routing: a Coder test fix (extend it, or retitle it to what it proves). No catalog case covers the workflow-detail order.
   - **`:545`, "deletes a workflow with a null projectId without touching any project's items".**
     - What it proves: a workflow with a null owner can be deleted (204), and is gone afterwards (404).
     - What it doesn't prove: the title's claim. It seeds no project and no item, so "without touching any project's items" is never checked.
     - Missing: seed a project with its own workflow and items (and ideally an orphan-workflow workphase, board and column), delete the orphan, then assert the other project's items keep their `workphaseId` and still exist, and the orphan's workphases and boards are gone.
     - Routing: a Coder test fix. Orphan workflows have no wiki rule (CLAUDE.md, Known Issues), so this stays an uncatalogued test unless the PO writes one. The Architect routes the fix; it isn't DnD work, so not Story 10.
10. **`drag-5-stub-detach.spec.ts:147`** asserts only `position !== null` for a release that should write `{Q, after}` (DRAG-5.1). **`:240`** counts no writes (DRAG-5.4). Story 10 item 10 already records both.
11. **The six Epic 3.2-era skips** in the `item-repositioning-*` specs carry no reason line beside them. `drag-card-zoom-in.spec.ts` gives its reason in a header comment. These predate Story 8's one-line-reason convention.

## Uncatalogued Tests

**Coverage-gate or implementation guards, not standalone rules (no mapping proposed):**
- `lib/dragTargets.test.ts`: the shared walk. Its blocks are the internal half of TREE-2.1, 2.4 and 2.5 (proposed above). `:73`, "an anchor whatever its parent when naming a row sets no parent", is the board's Free-Card rule (DRAG-2.15's "never Low") at the walk level. A stamp there is optional.
- `useProjectDragReorder.test.ts`'s tier block: `:410` (cap unknown) and `:419` (rows a collapsed project hides). The PO left both out of the wiki (8.7 plan, Amendment 6), so they belong to no case. `:493` ("before the sidebar has the project cap") is likewise unruled.
- `SortableProjectRow.test.tsx:47`, `:62`, `:74`, `:80`: no tier outside a drag, `parent` drawn at full strength, and the descendants' `pointer-events-none`. The last is the mechanism behind TREE-1.6's outcome, not a rule of its own.
- `TypePill.test.tsx` and `cardMetrics.test.ts`: implementation guards for DRAG-3.25. Even approved they wouldn't assert it, so I don't propose them.
- `useBoardDnd.test.ts:60`, `:74` (the modal reporting its placement), and `:111` (nearest Free ancestor with nothing pending, a DRAG-1.1 neighbor the roadmap says not to stamp).
- `itemListOps.test.ts:30–95` ("rendered reads", `withPendingParents`): Phase 9 helper safeguards.
- `dragClassification.test.ts:98`, `:102`, `:169`, `:175`: no tier for the carried or unknown item, and every item classified.
- `dragChrome.test.tsx:20–35`: `DRAG_OVERLAY_ATTR` for the E2E helper.
- `workflows.test.ts:72` (a bounded depth under a `parentId` cycle) and `:90` (`positionScope` on the workflow detail). I didn't trace these against TC-2.13 to TC-2.16. A later run could check whether `:90` should carry those IDs.

**Genuine scenarios the catalog misses:** see Candidate New Cases.

## Candidate New Cases

1. **A malformed workflow owner reference** (open for the Test Planner).
   - The tests:
     - `workflows.test.ts:163`, "returns 400, and creates nothing, when projectId is not a string". For `true`, `false`, `7`, `0`, `{}`, `[]` and `[project.id]`: 400, an error naming `projectId`, and no workflow created for that project.
     - `:175`, "refuses a projectId that is not a string ahead of the ownership check". `[owner.id]`, for a project that already owns a workflow, gets a 400 naming `projectId`, not the "already has a workflow" message.
   - Wiki:
     - **The refusal is a Test Planner gap.** Wiki row-references §1 says a reference that names no row is refused with a 400 and nothing changes, and it lists "its project" among references. Project-tree §10 states the owner rules.
     - **The precedence is mostly derivable.** A value that names no row can't name "a project that already has one", so §1's 400 applies rather than §10's 409. If the Planner doesn't read it that way, it's a question for the PO.
     - **A third test needs the same case:** `workflows.test.ts:154`, "returns 400 with a specific message when projectId does not reference an existing project", which is also untagged. TREE-10.8 and TREE-10.9 cover only `templateId` and `sourceWorkflowId`.
   - Mapping: these are server route tests, so they count as they are. Once a TREE-10 case exists (or TREE-10.8 is widened to the owner), stamping `:154`, `:163` and `:175` with its ID makes it `Automated`.
2. **Pickup immediately after detaching** (open for the Test Planner).
   - The test: `drag-5-stub-detach.spec.ts:298`, "immediately after a detach, the same item drags and reorders normally as a Card". It detaches Stub `X` by a pop to the column (released there, then drawn as an `article`). Then it picks `X` up again as a Card, which starts in the column context (`awaitDragContext(… columnRegionKey …)`), and releases it on `P`'s slot. It asserts `parentId` is still `P`, `isAttached` is 0, and `X`'s position is below `P`'s.
   - Wiki: board-drag-interaction §8 ("`X` now renders as a Card") and §1 (a Free Card's drag starts in its column). The rule is in the wiki, so this is a **Test Planner gap**.
   - Mapping: it most naturally extends DRAG-5.10 ("now renders as a Card", plus "and drags as one"). I didn't open DRAG-5.10's full text in this run. If it's folded in there, the stamp is `'DRAG-5.10: immediately after a detach, the same item drags and reorders normally as a Card'`. As a new case, it takes that case's ID in the same place. Either way it's a surface test and counts without approval.
3. **Orphan-workflow deletion** (`workflows.test.ts:545`). There is no wiki rule, so this would be a **PO gap** if a case is wanted. Otherwise it stays an uncatalogued test, after the fix in Test Quality Concerns, 9.

## Totals

After this run's writes, across the whole catalog (418 cases):

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 111 | 134 | 60 | 305 |
| Open | 29 | 60 | 16 | 105 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |

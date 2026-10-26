# Test Reconciliation: A6 close, board-drag-interaction

**Scope:** `docs/test-plans/board-drag-interaction/` (DRAG-1 … DRAG-6, 113 cases), with the code at `57d3ca2` and the working tree's uncommitted docs as they stand (the A6 plan, the BCU-2 suite, wiki boards-columns-unsorted). This is one of five parallel instances of A6 batch 4's whole-catalog run; the other folders are other instances'. The catalog-wide checks below cover every DRAG- ID in every test title in the repo.

**Run:** confirming, for a tech-debt story's close (`.claude/guides/story-done-checklist.md`, "A tech-debt story"), 2026-10-22.

**Written:**
- DRAG-1.7, 1.8, 1.10 and 1.25: the `**Automation test:**` line. Batch 3e split `dragRegions.test.ts`, and these cases' tests are now in `client/src/components/workflow/dragStructure.test.ts`, with their IDs still at the start of their titles. Each stays `Automated`.
- DRAG-6.1: `Automated` → `Open`, in its heading block and the suite table, with `—` on its Automation line. The Test Planner revised it in A6, and the test that carries its ID no longer asserts all of it (Gaps).
- This report. No case text, title, priority, wiki page or test was edited. The Test Planner's four `Manual` cases are untouched.

**Read:** every case in the folder; wiki board-drag-interaction §10 and the sections the revised cases cite; the A6 plan's Open questions and Amendments; Story 10's entry in `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`; every test whose title or comment carries a DRAG- ID, and the bodies of the tests judged below.

**How I judged:**
- **A test counts** if it's a surface test (`tests/ui/`, `tests/api/`, `server/tests/routes/`), an internal test with an existing pointer (Nathan's A3 approvals), or an internal test in one of the two approved categories:
  - **clock:** a drag clock's logic in the pop state machine, threshold as a parameter;
  - **client rule:** a client ordering or request rule tested in `itemListOps.ts`, `itemWriteReconciliation.ts` or `dragRequest.ts`. Nathan extended it to board-drag cases at A3 batch 6 (Story 10's entry records it). His earlier decline of `dragRequest.test.ts`'s DRAG-6.6 test stands (Test Quality Concerns, item 14).
- `placement.ts`, `dragCollision.ts`, `dragRegions.ts`, `dragStructure.ts`, `dragBands.ts`, `dragClassification.ts`, `dragOverlayGeometry.ts` and `dragTuning.ts` tests outside the existing pointers are **unapproved** internal tests.
- **A case is `Automated`** when the counting tests carrying its ID assert its *Then* between them. A clause the *Then* hands to another case by cross-reference is that case's.
- **Automated cases the Test Planner didn't revise in A6** were re-checked for their IDs, their files and the assertions behind them. Their judgment otherwise stands from the A3 confirming run.
- **Skipped tests** count as no coverage.

**File aliases:**

| Alias | File |
|---|---|
| bands | `tests/ui/drag-column-bands.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |
| classify | `tests/ui/drag-target-classification.spec.ts` |
| zoom | `tests/ui/drag-card-zoom-in.spec.ts` (both tests `test.skip`) |
| xcol | `tests/ui/item-repositioning-cross-column-dnd.spec.ts` |
| xproj | `tests/ui/item-repositioning-cross-project-dnd.spec.ts` |
| boardsRoute | `server/tests/routes/boards.test.ts` |
| popSession, placement, dragRequest, dragRegions, dragStructure, dragBands, dragCollision, dragClassification, dragOverlay, tuning | `client/src/components/workflow/<name>.test.ts` (`dragOverlay` is `dragOverlayGeometry.test.ts`, `tuning` is `dragTuning.test.ts`) |
| descProj | `client/src/components/workflow/descendantsProjection.test.ts` |
| reconcile | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| listOps | `client/src/components/workflow/itemListOps.test.ts` |
| hierPlace | `client/src/lib/hierarchyPlacement.test.ts` |
| bandGuides | `client/src/components/BandGuides.test.tsx` |

---

## Coverage Mapping

### The 42 `Automated` cases

| Case | P | Counting tests (title starts) | Basis |
|---|---|---|---|
| DRAG-1.3 | P0 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …", "DRAG-1.3, DRAG-1.12: …" | surface |
| DRAG-1.4 | P0 | popSession "DRAG-1.4: …" ×3; placement "DRAG-1.4, TC-2.11: …" | clock; mapping |
| DRAG-1.7, 1.8 | P0 | popSession "DRAG-1.7, DRAG-1.8: a card with no registered region…"; **dragStructure** "DRAG-1.7, DRAG-1.8: an id isValidCard rejects…"; dragClassification "DRAG-1.7, DRAG-1.8: is true only for a Valid target…" | mapping. **File path updated** |
| DRAG-1.10 | P1 | **dragStructure** "DRAG-1.10: clips a sub-row's region…", "DRAG-1.10: a sub-row scrolled fully out of view…", describe "DRAG-1.10: clipToVisible" | mapping. **File path updated** |
| DRAG-1.11 | P1 | popSession "DRAG-1.11: …" ×6 | clock |
| DRAG-1.23 | P0 | bands "DRAG-1.5, DRAG-1.23: …", "DRAG-1.23: a reorder onto the first card…"; xcol "DRAG-1.23: 1.b …" | surface |
| DRAG-1.25 | P1 | popSession describe "DRAG-1.25: merged-column boundsRect…"; **dragStructure** "DRAG-1.25: …" ×2 | mapping. **File path updated** |
| DRAG-1.30 | P1 | popSession "DRAG-1.30: …" ×3, "DRAG-1.3, DRAG-1.30: …" | clock |
| DRAG-2.1, 2.2, 2.3, 2.7 | P0 | classify "DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: …" | surface |
| DRAG-2.10 | P1 | boardsRoute "DRAG-2.10: carries the item depth cap the API enforces"; the same classify test | surface |
| DRAG-3.1 | P0 | bands "DRAG-3.1, DRAG-3.2, DRAG-3.11: …" | surface |
| DRAG-3.2 | P0 | the same, and bands "DRAG-3.2: popped out, a release in a column is still that column's band" | surface |
| DRAG-3.3 | P0 | bands "DRAG-3.3, DRAG-3.11: …" | surface |
| DRAG-3.4 | P0 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …" | surface |
| DRAG-3.6, 3.7 | P0 | bands "DRAG-3.6, DRAG-3.7: …" | surface |
| DRAG-3.8 | P0 | bands "DRAG-3.8, DRAG-1.6: …" | surface |
| DRAG-3.9 | P0 | bands "DRAG-3.9: a done column produces no anchor…" | surface |
| DRAG-3.10 | P1 | bands "DRAG-3.10: …" | surface |
| DRAG-3.15 | P1 | dragBands "DRAG-3.15: …"; popSession "DRAG-3.15, DRAG-3.21: …" | mapping |
| DRAG-3.21 | P1 | popSession "DRAG-3.21: …", "DRAG-3.15, DRAG-3.21: …" | mapping |
| DRAG-4.8 | P0 | hierPlace "DRAG-4.8: excludes the given ids…", describe "DRAG-4.8: depthRangeFor", "DRAG-4.8: enumerates every depth…"; descProj "DRAG-4.8: …"; dragCollision "DRAG-4.8: …" | mapping |
| DRAG-4.9 | P0 | hierPlace describe "DRAG-4.9, DRAG-4.10: …" and "DRAG-4.9: …" ×2; descProj "DRAG-4.9: …" | mapping |
| DRAG-4.10 | P0 | hierPlace "DRAG-4.10: …" ×2 | mapping |
| DRAG-4.11 | P1 | hierPlace "DRAG-4.11: …" ×5 and describe "DRAG-4.11: resolvePlacement — the boundaries" | mapping |
| DRAG-4.18 | P0 | hierPlace "DRAG-4.18: …" ×2; descProj "DRAG-4.18: …" ×2 | mapping |
| DRAG-4.19 | P0 | popSession "DRAG-4.19: …" | mapping |
| DRAG-4.23 | P1 | popSession "DRAG-4.23: …"; dragCollision "DRAG-4.23: …" | mapping |
| DRAG-4.29 | P1 | descProj "DRAG-4.29, DRAG-4.30: …" | mapping |
| DRAG-4.30 | P1 | descProj "DRAG-4.30: …" ×2, "DRAG-4.29, DRAG-4.30: …" | mapping |
| DRAG-5.4 | P0 | detach "DRAG-5.4, DRAG-4.12: …" | surface |
| DRAG-5.5 | P0 | popSession "DRAG-5.5: …"; dragRequest "DRAG-5.5: …" | clock; mapping |
| DRAG-5.12 | P0 | detach "DRAG-5.12: …" | surface |
| DRAG-6.5 | P0 | bands "DRAG-6.5: …" | surface |
| DRAG-6.10 | P1 | placement "DRAG-6.10: …"; listOps "DRAG-6.10: …" | mapping |
| DRAG-6.12 | P1 | placement "DRAG-6.12: …", "DRAG-5.1, DRAG-6.12: …", "DRAG-5.3, DRAG-6.12: …" | mapping |
| DRAG-6.13 | P1 | placement describe "DRAG-6.13: priorPlacement (a re-dragged item)" | mapping |
| DRAG-6.14 | P2 | reconcile "DRAG-6.14: …" | mapping |

### The 67 `Open` cases

"Carried by" lists the tests whose titles carry the ID: counting ones first, then unapproved internal ones. **S10** is Story 10's list in `epic-3-5-roadmap.md`; every `Open` case is on it except DRAG-6.1.

**DRAG-1**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-1.1 | P0 | detach "DRAG-1.1, DRAG-5.9: …", "DRAG-1.1, DRAG-5.13: …" (a Stub at depth 1 and 2). Unapproved: popSession "DRAG-1.1: …" | The merged, expanded and Unsorted starts. bands "DRAG-1.3, DRAG-1.12" reads the merged start incidentally, without the ID | S10 |
| DRAG-1.2 | P0 | none | All at the surface. xcol 3.a/3.b show the lean picking the side; dragCollision `dropAnchorFor` "moving up onto B…", "moving down onto C…" are unapproved support | S10 |
| DRAG-1.5 | P0 | bands "DRAG-3.4, DRAG-1.3, DRAG-1.5: …", "DRAG-1.5, DRAG-1.23: …" | Bullets 2 and 3: the auto-drop after a zoom into a Card, and the placement after a zoom into Descendants | S10 |
| DRAG-1.6 | P0 | bands "DRAG-3.8, DRAG-1.6: …" (paragraph 2). Unapproved: dragRegions "DRAG-1.6: is null in the gap between two sub-rows…" | Paragraph 1: a release in `W2` before the pop out is `W1`'s reposition | S10 |
| DRAG-1.9 | P0 | bands "DRAG-1.9: …" (the gap between columns); xcol "DRAG-1.9: 5.a …" (Unsorted) | Header or footer, toolbar, sub-row gaps and below the last sub-row, a broken column, "no pop-in clock starts", and "no request is made" (asserted as unchanged fields) | S10 |
| DRAG-1.12 | P1 | bands "DRAG-1.3, DRAG-1.12: …" | `{A, before}` after the pop back in (X is alone in its column), and paragraph 2's middle-band set-down | S10 |
| DRAG-1.13 | P1 | none. Unapproved support: popSession "a drag from outside every region (Unsorted)…", dragCollision "no context (picked up in Unsorted)…" | All at the surface | S10 |
| DRAG-1.14 | P2 | detach "DRAG-5.11, DRAG-1.14: …" (Descendants and Card layers by distance). Unapproved: popSession "DRAG-1.14: …" ×2 (the column layer) | The column layer by distance, and "`popDistancePx` 0: only the clock decides" | S10 |
| DRAG-1.16 | P0 | none | All | S10 |
| DRAG-1.17 | P0 | none (ID in a comment, popSession:267) | All (Test Quality Concerns, item 4) | S10 |
| DRAG-1.18, 1.19 | P1 | none | All | S10 |
| DRAG-1.20 | P0 | none. Support: dragStructure "scopes to exactly the context region…", popSession "DRAG-4.23: …" | All at the surface | S10 |
| DRAG-1.21 | P1 | none (ID in a comment, popSession:216) | All (Test Quality Concerns, item 3) | S10 |
| DRAG-1.22 | P1 | none. Unapproved support: dragCollision "over its own slot, nothing shuffles…" | All at the surface | S10 |
| DRAG-1.24 | P0 | xcol "DRAG-1.24: 3.a …", "DRAG-1.24: 3.b …"; xproj the same | Paragraph 2, a card alone writes nothing. Its request half is dragRequest "same workphase, empty others…", without the ID (Proposed Stamps) | S10 |
| DRAG-1.26, 1.27 | P2 | none | All | S10 |
| DRAG-1.28 | P1 | none. Unapproved support: dragOverlay `clampToCurrentContext`'s `it.each` | All at the surface | S10 |
| DRAG-1.31 | P1 | none. Unapproved support: tuning's merge and round-trip tests | The panel and its live effect | S10 |
| DRAG-1.33 | P2 | none. Unapproved support: bandGuides "keeps its cards mounted through every layer change of a drag" | All | S10 |

**DRAG-2**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-2.4 | P1 | classify "DRAG-2.1, …, DRAG-2.4, …" | Popping, and entering and leaving contexts (the spec seeds `NO_POP`) | S10 |
| DRAG-2.5 | P1 | Unapproved: dragClassification "DRAG-2.5: only the Free descendants carry the relationship marker" | The overlay drawn on `D` | S10 |
| DRAG-2.6 | P2 | none | All | S10 |
| DRAG-2.8 | P1 | classify "DRAG-2.8: …" (Valid and Cycle-forming). Unapproved: dragClassification describe "DRAG-2.8: classifyDragTargets — Stub drag", which adds Depth-capped | Depth-capped at the surface; paragraph 2 (Unsorted, a broken column and an expanded column's wrapper carry no classification) | S10 |
| DRAG-2.9 | P1 | none. dragClassification "cycle-forming wins over depth-capped for a deep descendant" asserts it, without the ID | Proposed Internal Mappings | S10 |

**DRAG-3**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-3.5 | P1 | none (ID in a comment, dragBands:5) | Test Quality Concerns, item 1; Proposed Internal Mappings | S10 |
| DRAG-3.11 | P1 | bands "DRAG-3.1, DRAG-3.2, DRAG-3.11: …" (the top band's ghost first), "DRAG-3.3, DRAG-3.11: …" (the middle band's ghost where `p` falls). Unapproved: placement "DRAG-3.11: …" | The bottom band's ghost at the end, which the spec reads only after the release; "no position value is invented" | S10 |
| DRAG-3.12 | P0 | dragRequest "DRAG-3.12: same workphase, slot existing: always identity…" (client rule, counts; its ID moved to the start in batch 3f) | The gesture at the surface, both paragraphs | S10 |
| DRAG-3.16 | P1 | none | All | S10 |
| DRAG-3.17 | P2 | bands "DRAG-3.17: …" ×2 | The reservation collapsing when locked, and coming back on a pop out | S10 |
| DRAG-3.18, 3.19, 3.20, 3.22 | P2 | none | All | S10 |
| DRAG-3.23 | P0 | none. Its request half is dragRequest "a done region never anchors…", without the ID (Proposed Stamps); placement "a done region never anchors, even onto one of its own cards…" is unapproved | The popped-in release at the surface | S10 |
| DRAG-3.24 | P1 | none. Its request half is dragRequest "DRAG-3.12: same workphase, slot existing…" (Proposed Stamps) | The ghost staying still, and no request, at the surface | S10 |

**DRAG-4**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-4.1 | P0 | dragRequest "DRAG-4.1, DRAG-5.4: attach: …" (client rule, counts: the request names no anchor) | The gesture: inherited workphase, last after `S2`, rendered as a Stub, `P` unchanged, and the detached child's re-attach. It needs a Free Card's zoom into a Card, which zoom's two skipped tests attempt | S10 |
| DRAG-4.3 | P1 | none | All. Revised in A6 (Test Quality Concerns, item 11) | S10 |
| DRAG-4.5 | P0 | none | All | S10 |
| DRAG-4.12 | P1 | detach "DRAG-5.4, DRAG-4.12: …" (the item becomes the childless Card's sole child) | "No anchor", and "the Descendants layer can't be reached". Both are in approved-category tests without the ID (Proposed Stamps) | S10, closable now |
| DRAG-4.13, 4.14, 4.15, 4.16, 4.17, 4.21, 4.32, 4.33 | P0/P1 | none | All | S10 |
| DRAG-4.20, 4.22 | P1 | none. Support: popSession's DRAG-1.4 tests (the dwell and cue phases, and their resets) | All at the surface | S10 |

**DRAG-5**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-5.1 | P0 | detach "DRAG-5.1, DRAG-5.10: …" (detached, parent kept, rendered as a Card); dragRequest "DRAG-5.1: detach…" (client rule, counts: `isAttached: false` and the anchor, never `parentId`). Unapproved: placement "DRAG-5.1, DRAG-6.12: …" | That the release lands `X` after `Q`: the spec asserts only that the position isn't null | S10, closable now |
| DRAG-5.2 | P0 | dragRequest "DRAG-5.2: …" (client rule, counts) | The merged column's non-entry workphase at the surface (Test Quality Concerns, item 16) | S10 |
| DRAG-5.3 | P0 | Unapproved: placement "DRAG-5.3, DRAG-6.12: …" | All at the surface | S10 |
| DRAG-5.9 | P0 | detach "DRAG-1.1, DRAG-5.9: …". Unapproved: placement "DRAG-5.9: …" | The named anchors of bullets 1–2 (the spec asserts only that the position changed), the tab-right reparent, the over-cap bullet | S10 |
| DRAG-5.10 | P1 | detach "DRAG-5.1, DRAG-5.10: …" | The carried copy's form, Stub rows again inside `Q`, and the cancel | S10 |
| DRAG-5.11 | P1 | detach "DRAG-5.11, DRAG-1.14: …" | "Arrives locked in the column, shown as a Card", the column's reposition, and the stop-inside-`P` half | S10 |
| DRAG-5.13 | P1 | detach "DRAG-1.1, DRAG-5.13: …" (starts in `P`'s section); detach "DRAG-5.13: a grandchild Stub popped out to its containing Card's layer…" (pops to `card:P`; the release keeps parent, attachment and position) | Where the preview draws `S1a`: in its own slot under `S1`, with its child beneath it, and no attach preview. The spec asserts both rows are visible, not where (Test Quality Concerns, item 12) | S10, closable now |
| DRAG-5.14 | P1 | none. Unapproved support: placement "a terminal region still previews existing … for a detaching Stub" | All at the surface | S10 |

**DRAG-6**

| Case | P | Carried by | Missing | Route |
|---|---|---|---|---|
| DRAG-6.1 | P0 | bands "DRAG-6.1, DRAG-6.2: …" (a bottom-band drop drawn at its slot, pending, then settled unchanged) | The clause A6 added: a top-band release shown first while pending, the marker being the anchor and side, and no inversion. reconcile's TC-2.28 band test asserts the last two, without the ID | **Not routed** |
| DRAG-6.2 | P0 | bands "DRAG-6.1, DRAG-6.2: …" (the marker) | The position unchanged and not null, and the re-sort. reconcile "TC-2.30: a pending item keeps its position…" asserts both, without the ID | S10, closes on a stamp |
| DRAG-6.4 | P1 | reconcile "DRAG-6.4: …" (client rule, counts: the inversion recorded) | The panel's log, nothing to the console, kept across a reload | S10 |
| DRAG-6.6 | P0 | dragRequest "DRAG-6.6: …" (declined, Test Quality Concerns, item 14) | The resync on the board | S10 |
| DRAG-6.7 | P1 | none (ID in a comment, dragRequest:301) | Proposed Stamps, item 8 | S10 |
| DRAG-6.8 | P1 | none | All | S10 |
| DRAG-6.9 | P1 | none | Proposed Stamps, item 9 | S10 |
| DRAG-6.11 | P1 | none (ID in a comment, listOps:103) | Proposed Stamps, item 7 | S10, closable now |

---

## Lost Coverage

**None.** Every `Automated` case still has a counting test carrying its ID. Batch 3e's split moved DRAG-1.7, 1.8, 1.10 and 1.25's tests with their IDs. Batch 3f's retitles dropped one DRAG ID, DRAG-3.9 from dragRequest's "a done region never anchors…", which wasn't a counting test for it.

DRAG-6.1 moves to `Open` for a different reason: its text grew in A6, not its tests shrinking (Gaps).

## Unknown IDs

**None.** Every DRAG- ID in a test title resolves to a case. The `scripts/check-docs/` tests use DRAG- IDs only as fixture strings inside assertions, never as their own titles. No title carries a retired ID.

**`Manual` cases carried by a test: none.** No title carries DRAG-1.29, 1.32, 4.24 or 4.25.

**Skipped tests: 8, unchanged.** zoom ×2, which carry no ID, and xcol's and xproj's six "drag C onto card X" tests (Story 10 item 3).

---

## Proposed Stamps

A developer adds the ID; each test counts without approval, as a surface test or in an approved category. Where an extension is named, the case closes only with it.

| # | Test | New title start | Effect |
|---|---|---|---|
| 1 | reconcile "TC-2.28: a top or bottom band drop is marked pending as the anchor it sends…" | `DRAG-6.1:`, plus an assertion of the list's order before `completeItemWrite` (the preview: `X` before `B`, and after it). The alternative is a top-band release added to bands' DRAG-6.1 test | **DRAG-6.1 → `Automated`**, with bands. Whether TC-2.28 stays on the title is the item-positioning instance's call: the Test Planner ruled the band drop DRAG-6.1's and left TC-2.28 unchanged |
| 2 | reconcile "TC-2.30: a pending item keeps its position and its place when another item's response re-sorts the list" | `TC-2.30, DRAG-6.2:` | **DRAG-6.2 → `Automated`**, with bands. Story 10's entry already says so |
| 3 | dragRequest "DRAG-4.1, DRAG-5.4: attach: parentId + isAttached, never an anchor…" | `DRAG-4.1, DRAG-4.12, DRAG-5.4:` | DRAG-4.12's "no anchor" |
| 3a | popSession "a childless Card (no Descendants region at all) never pops any further…" | `DRAG-4.12:` | DRAG-4.12's "can't be reached". I read it as clock logic (the Descendants clock never starts without a region). With 3, **DRAG-4.12 → `Automated`** |
| 4 | dragRequest "same workphase, empty others: any slot is identity — nothing to order against" | `DRAG-1.24:` | DRAG-1.24 paragraph 2's request half. Its surface half stays with Story 10 |
| 5 | dragRequest "DRAG-3.12: same workphase, slot existing: always identity (middle band member)" | `DRAG-3.12, DRAG-3.24:` | DRAG-3.24's request half |
| 6 | dragRequest "a done region never anchors — placementFor falls back to 'existing'…" | `DRAG-3.23:` | DRAG-3.23's request half |
| 7 | listOps "draws an item with no completedAt at the end of a done list…" | `DRAG-6.11:`, plus one assertion: once the item's `completedAt` is stamped later than the others, it's still last | **DRAG-6.11 → `Automated`** |
| 8 | dragRequest "a stale response's own row is still discarded, but resyncs…", "a stale response with no reindex disclosed needs no resync" | `DRAG-6.7:` | Partial: staleness is mocked. The tracker's verdict, and the board matching the server after the resync, aren't asserted |
| 9 | reconcile "a response for a write whose placement has since been replaced…" | `DRAG-6.9:` | Partial: the state half. The ghost coming back without a cursor move, and the release against the reconciled board, aren't asserted |

**Extensions to tests that already carry the ID:**
- detach "DRAG-5.13: …": at the Card layer, read `P`'s section rows in order (`S1`, `S1a`, `S1a1`) and their count → **DRAG-5.13 → `Automated`**.
- detach "DRAG-5.1, DRAG-5.10: …": assert `X` lands after `Q` (its position above `Q`'s, or the column order `P, Q, X`) → **DRAG-5.1 → `Automated`**, with dragRequest's DRAG-5.1 test.
- bands "DRAG-3.1, DRAG-3.2, DRAG-3.11: …": before the bottom-band release, poll the column's titles for `A, B, C, X`. Then stamp listOps "TC-2.30: a placement with a workphaseId moves the item into that list without changing the item…" with `DRAG-3.11` for "no position value invented" → **DRAG-3.11 → `Automated`**.

A cheap tool for the "no request is made" clauses: batch 3g's `tests/helpers/projectTreeDrag.ts::watchWrites` records every non-GET request. DRAG-1.9, 1.24, 3.12, 3.24, 4.18, 5.12 and 5.13 each say "no request", and their specs assert unchanged fields instead.

## Proposed Internal Mappings (need approval)

| Case | Test | Covers | Note |
|---|---|---|---|
| DRAG-2.9 | dragClassification "cycle-forming wins over depth-capped for a deep descendant", titled `DRAG-2.9:` | All of it: the *Then* is a classification state | Or Story 10 extends classify with a descendant deep enough to be over the cap |
| DRAG-3.5 | dragBands "switches exactly at the boundaries bandBoundaries reports…" and "moves with the shortCard height…", titled `DRAG-3.5:`, plus a new `dragBands.ts::reservationFor` test for the `(h + gap) / 2` zones | All, with the new test. `reservationFor` has no test today | Story 10's alternative is a pixel-precise E2E |
| DRAG-1.14 | popSession "DRAG-1.14: …" ×2 (they already carry the ID), plus one assertion: with `popDistancePx` 0, a far point doesn't pop before `popDelayMs` | The column layer, and the distance-off rule. detach's test covers the other two layers | The distance term isn't a clock, so the clock category doesn't take it |

## Proposed Manual (need approval)

**None.** No open case looks too costly to automate. Story 10's item 8 makes the flakiness call case by case.

---

## Gaps

**Not routed: DRAG-6.1 (P0).** No story's Scope lists it, since it was `Automated` until this run. It closes with Proposed Stamps item 1: a title edit and one assertion in an existing test. Nathan's call: close it in A6 before sign-off, or add it to Story 10's list.

**Routed to Story 10: the other 66.** Story 10's list in `epic-3-5-roadmap.md` names each one, and no case on it is `Automated`.
- **Closable now, without new drag gestures** (stamps and small extensions above): DRAG-3.11, 4.12, 5.1, 5.13, 6.2 and 6.11. Story 10 or A6 can take them.
- **No counting test carries the ID (44):**
  - DRAG-1.2, 1.13, 1.16, 1.17, 1.18, 1.19, 1.20, 1.21, 1.22, 1.26, 1.27, 1.28, 1.31, 1.33;
  - DRAG-2.5, 2.6, 2.9;
  - DRAG-3.5, 3.16, 3.18, 3.19, 3.20, 3.22, 3.23, 3.24;
  - DRAG-4.3, 4.5, 4.13, 4.14, 4.15, 4.16, 4.17, 4.20, 4.21, 4.22, 4.32, 4.33;
  - DRAG-5.3, 5.14;
  - DRAG-6.6, 6.7, 6.8, 6.9, 6.11.
- **A counting test carries the ID but asserts only part (22):**
  - DRAG-1.1, 1.5, 1.6, 1.9, 1.12, 1.14, 1.24;
  - DRAG-2.4, 2.8;
  - DRAG-3.11, 3.12, 3.17;
  - DRAG-4.1, 4.12;
  - DRAG-5.1, 5.2, 5.9, 5.10, 5.11, 5.13;
  - DRAG-6.2, 6.4.
- **A broken column, either kind.** BCU-2.9 adds a second kind of broken column, one with an end outside its workflow. The Test Planner rests "takes no drop" on DRAG-1.9 and DRAG-2.8's broken-column bullets, which no test covers yet. An inverted column is enough for both tests, since the client reads `broken`, not why. Only a direct database edit makes the second kind.

---

## Duplication (reported, not judged)

- **DRAG-1.24's paragraph 1** runs twice, in xcol and xproj 3.a/3.b, on the cross-column and cross-project scenarios.
- **DRAG-2.1, 2.2, 2.3 and 2.7** are asserted by classify and again by dragClassification's titled tests. The internal ones aren't on the lines.
- **DRAG-3.1 and 3.2's request** is asserted at the surface (bands) and in dragRequest "TC-7.1, TC-7.2, TC-7.4, DRAG-3.1, DRAG-3.2: …".
- **DRAG-5.12's set-back-down** is asserted by detach, placement "DRAG-5.12: …" and dragRequest "DRAG-5.12: …".
- **DRAG-1.7 and 1.8** are asserted across three internal files, one link each (classification, region, candidate).
- **If Proposed Stamps 1, 2 and 5 land:**
  - reconcile's TC-2.28 band test serves DRAG-6.1, and its TC-2.30 test serves DRAG-6.2;
  - dragRequest's DRAG-3.12 test serves DRAG-3.24 as well.

---

## Test Quality Concerns

### The A6 plan's open questions that name a DRAG case or a DRAG-titled test

1. **`dragBands.test.ts:5` (DRAG-3.5), an ID only in a comment.**
   - **What the tests assert:** the `bandFor` describe's first two tests pin the dividers `heightPx` in from each edge and show them moving with the shortCard height, not the gap. That is DRAG-3.5's divider rule.
   - **What they miss:** nothing tests the dead zones' `(h + gap) / 2` height, since `dragBands.ts::reservationFor` has no unit test.
   - **The way forward:** an internal mapping, which needs approval (Proposed Internal Mappings), or Story 10's E2E. The comment itself is fine. Moving the ID to a title only helps once the mapping is approved.
2. **`dragClassification.test.ts:7` (DRAG-2.10).** The comment is gone: line 6 now says only that every depth case parameterizes on `cap`. DRAG-2.10 is `Automated` through boardsRoute and classify. `isWithinDepthCap`'s test, now in `client/src/lib/hierarchy.test.ts` with no ID, needs none: it would be an internal test beside a surface test that covers the whole case.
3. **`popSession.test.ts:216` (DRAG-1.21).** The describe "locked Card: zoom-in into its own Descendants section" is clock logic, so it can take `DRAG-1.21:` without approval. Its four tests assert three things:
   - the zoom in on `descendantsPopInDelayMs`, with no dwell or cue phase on the hover;
   - no zoom short of the delay;
   - a childless Card never going deeper.

   **Still missing:**
   - the Stub-row copies;
   - the release's hierarchy placement;
   - "on `P` but outside the section, nothing zooms in, and the release is the auto-drop";
   - the pop out to `P`'s Card layer and its release.

   DRAG-1.21 stays with Story 10's item 4.
4. **`popSession.test.ts:281`, now `:267` (DRAG-1.17).**
   - **What the describe asserts:** "popping out of a context the sample has no region for" covers bullet 2's "one layer, not Board" for a context clipped out of view, and the zero-delay case.
   - **Why it isn't a stamp:** it asserts the layer stack's transition, not a clock, so it needs approval.
   - **What it would still leave:** bullet 1, which bands "DRAG-3.3, DRAG-3.11" covers in part without the ID (a release at Board layer over a card is the band's meaning); bullet 3 (no hop to a sibling); and bullet 2 at the surface.

   I don't propose it. The case needs Story 10's zoom E2Es either way.
5. **`hierarchyPlacement.test.ts`'s DRAG-4.8 exclusion test** ("DRAG-4.8: excludes the given ids, and never walks into their children") proves DRAG-4.8's last sentence. The dragged item and its subtree are never rows, so they can't be Top or Bottom. hierPlace is already on DRAG-4.8's line.
6. **The E2E titles carrying IDs of `Open` cases.** Each covers part of its case, as the Open table says:
   - DRAG-1.1: the Stub's start only;
   - DRAG-1.5: bullet 1 only;
   - DRAG-1.9: the gap and Unsorted only;
   - DRAG-1.12: the pop back in, with `X` alone;
   - DRAG-1.14: the Card and Descendants layers;
   - DRAG-1.24: paragraph 1;
   - DRAG-3.17: hover invariance only;
   - DRAG-5.1: no anchor asserted;
   - DRAG-5.9: no anchors, tab or over-cap;
   - DRAG-5.10: the in-list copy only;
   - DRAG-5.11: the detach write only;
   - DRAG-5.13: the rows drawn, not where.

   Their `Open` status is right. The cheap closes are in Proposed Stamps.
7. **The `dragRegions.test.ts` → `dragStructure.test.ts` split (DRAG-1.7, 1.8, 1.10, 1.25).** Confirmed. Every title kept its ID at the start, and dragRegions now carries only DRAG-1.6, which is unapproved. The four Automation lines are updated.
8. **`dragRegions.test.ts:111–113` (no case exercises the DOMRect getter hazard).** Done, as batch 3g says:
   - dragStructure "keeps every field of the rect from an element whose getBoundingClientRect returns a DOMRect-shaped object" first checks that its fixture spreads to `{}`, then asserts all six fields;
   - `clipToVisible`'s describe has the same case.

   No case ID, rightly: it guards a browser API's shape, not a rule.
9. **The DRAG-4.11 retitle** ("below the last item (no Bottom) offers depth 0, the root's children, up to Top + 1") still proves DRAG-4.11's second bullet: `{lo: 0, hi: 1}` below `S2`. hierPlace's boundary tests cover the depth-0 and depth-1 placements.
10. **The title that lost DRAG-3.9** (dragRequest "a done region never anchors…"). Dropping it was right. DRAG-3.9 is whole on bands, and an internal test isn't mapped beside a surface test that covers the whole case. The test is in the client-rule category and asserts DRAG-3.23's request half, so it should carry `DRAG-3.23` (Proposed Stamps, item 6).
11. **DRAG-4.3, revised.** No test carries its ID. The revision makes it automatable whatever epic-4-decisions §12 settles: `P` is the ghost's only neighbor, so a test aims at `P` either way. It needs a Free Card zoomed into a Card in a done column, which is Story 10's zoom work. dragRequest's attach test pins the request shape for any parent, as support.
12. **DRAG-5.13, revised.**
    - **What the tests cover:** detach's two DRAG-5.13 tests cover the start in `P`'s section, the pop to `card:P` (never `S1`, which has no Card layer), and the release that keeps parent, attachment and position.
    - **What they miss:** the preview clause. "`P`'s section still shows it in its own slot under `S1`, with `S1b` beneath it, and no attach preview" is asserted only as both rows being visible. A preview that drew `S1a` as `P`'s last child at depth 0, with its child beneath, would pass.
    - **The close:** read the section's row order. In the code, a visible row also means no attach ghost for that item, since the two are drawn in place of each other, but that's the code's structure, not the rule.
13. **DRAG-6.1, revised.**
    - **What the test misses:** bands' DRAG-6.1 test is a bottom-band drop, drawn and settled, so it covers paragraph 1. The added band clause isn't asserted by anything carrying the ID, so DRAG-6.1 is `Open` this run.
    - **Which IDs the batch 3b test should carry,** the question left to me: `DRAG-6.1`. Its two cases go through `toRequest`, `sendItemMove` and `completeItemWrite`, and assert "the marker is the anchor" and "no inversion" for both bands. The test is in the client-rule category, so it counts as soon as it carries the ID. It doesn't assert the list while pending, so Proposed Stamps item 1 adds that.
    - **Whether TC-2.28 stays on its title** is the item-positioning instance's call.
14. **DRAG-6.6 and the category.** Nathan declined dragRequest's DRAG-6.6 test at A3 batch 3, before he extended the client-rule category to board-drag cases. The A3 close recorded that the decline stands, so I haven't counted it. If he now reads the category as taking it, it covers "the guess is dropped and the board resyncs" at the request level. The board's resync on screen would still be Story 10's.

### Other concerns

15. **"No request is made" asserted as unchanged fields.**
    - **Where:** detach's DRAG-5.12 and DRAG-5.13 tests, bands' DRAG-1.9 test and xcol's 5.a.
    - **The hole:** each asserts parent, attachment, position or workphase unchanged, so a request that rewrote the same values would pass.
    - **No status change:** the user-visible result is right.
    - **The fix:** `watchWrites` asserts the rule as the cases state it.
16. **detach's DRAG-5.1/5.10 test** carries a `// DRAG-5.2` comment on its `workphaseId` check. Its column covers one workphase, though, so the entry workphase and the item's own are the same. The check can't tell DRAG-5.2's rule from its failure. DRAG-5.2 needs a merged column with `P` in the non-entry workphase.
17. **bands "DRAG-1.3, DRAG-1.12"** claims DRAG-1.12 with `X` alone in Todo. There's no neighbor to name, so the case's `{A, before}` can't be asserted there.

---

## Uncatalogued Tests

**For the coverage gate, or a code hazard rather than a rule.** Listed, not mapped. These are new or changed in A6:
- dragStructure:
  - "keeps every field of the rect from an element whose getBoundingClientRect returns a DOMRect-shaped object";
  - "a measured region carries no DOM handles…";
  - "hasDetachedElements: …", "hasNewRegionElements: …".
- `client/src/components/workflow/useLatest.test.ts`.
- `client/src/components/dragChrome.test.tsx`: the overlay attribute the E2E wait counts.
- detach "immediately after a detach, the same item drags and reorders normally as a Card": a regression guard on dnd-kit's registration. DRAG-1.1's merged start states the rule.
- `client/src/components/workflow/useColumnManagement.test.ts` (new in 3e) tests the column-reorder drop, which is boards-columns-unsorted's (BCU-3.6). It's for that instance.

**Supporting tests without IDs that touch open DRAG cases.** Named in the Open table:
- placement "popped out over nothing: no placement…" (DRAG-1.9's render-back);
- placement "a terminal region still previews existing … for a detaching Stub" (DRAG-5.14);
- dragStructure "resolves the origin's own card: region even when isValidCard rejects it" (the pop back to a Stub's own Card);
- bandGuides "keeps its cards mounted…" (DRAG-1.33).

## Candidate New Cases

**From tests: none.** No test exercises a scenario the catalog lacks.

**Found while reading §10, for the Test Planner:** wiki board-drag-interaction §10 states "A reload that lands mid-drag stops the drag". When a failed drop's or a stale response's resync lands during a drag, the drag ends at once and nothing is written. No DRAG case states it, and no test exercises it.
- **Whose gap:** the wiki states the rule, so it's a Test Planner gap.
- **What it isn't:** DRAG-6.9 is a different rule, an ordinary response landing mid-drag. The cue for a stopped drag is `**Planned:**` and belongs to Story 8.

---

## Totals

After this run's writes.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 26 | 15 | 1 | 42 |
| Open | 23 | 34 | 10 | 67 |
| Manual | 0 | 2 | 2 | 4 |
| **All** | **49** | **51** | **13** | **113** |

| Suite | Automated | Open | Manual | Total |
|---|---|---|---|---|
| DRAG-1 | 9 | 21 | 2 | 32 |
| DRAG-2 | 5 | 5 | 0 | 10 |
| DRAG-3 | 11 | 11 | 0 | 22 |
| DRAG-4 | 9 | 14 | 2 | 25 |
| DRAG-5 | 3 | 8 | 0 | 11 |
| DRAG-6 | 5 | 8 | 0 | 13 |

**If Proposed Stamps 1, 2, 3, 3a and 7 and the three extensions land,** the next run moves DRAG-3.11, 4.12, 5.1, 5.13, 6.1, 6.2 and 6.11 to `Automated`, for 49 `Automated` and 60 `Open`. Approving the three internal mappings adds DRAG-1.14, 2.9 and 3.5.

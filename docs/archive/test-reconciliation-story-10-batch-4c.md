# Story 10 batch 4c — Stop 5 confirming reconciliation

**2026-11-12 · Confirming, run once at the batch's close.** Batch 4c had 15 cases. 14 are now `Automated`. DRAG-7.18 stays `Open`: its only tests are skipped, and it has moved to 4i. Acting on the coverage report and the range's skips, three `Automated` cases go back to `Open`: DRAG-3.16, DRAG-5.3 and DRAG-5.10, all routed to 4i. One Automation line gains a path (DRAG-7.2). Two title-only stamps were added: DRAG-2.22, on two DRAG-7.27 tests. No case text, title, priority or Rule changed.

**Inputs.**
- The plan's 4c and 4i sections and its whole Review log, in `docs/planning/epic-3-5-stories/story-10-batches.md`.
- The proof plan, `story-10-batch-4c-proof-plan.md`.
- The coverage report, run on the final tree `dbede7c9…`, whose tests subtree is `1c5d1bc7…`.
- The green run's record. The final full E2E run, `tests/output/batch4c-after-b21-skip-full-e2e.json`, had 439 passed, 22 skipped and 0 failed. The gate log is `batch4c-after-b21-skip-gate.log`, and D2's ledger is `batch4c-d2-repeat10.json`.
- The range's Playwright, Vitest/app and catalog diffs, from baseline tree `16fe9e07…` to the final tree.

**Limits.**
- I have no shell, so I ran nothing. I read the catalog, the cited wiki sections (board-drag-interaction §5a, §9 and others as each case needed), the five spec files, the helpers and the changed Vitest files from disk. I took the on-disk files to be the final tree's, which I couldn't check.
- At session start, git status showed `drag-5-stub-detach.spec.ts` and `drag-7-modal-hold.spec.ts` modified and uncommitted. That fits the post-commit skips the record describes.
- The two stamps need the QA Engineer's title-only diff and `npm run check:docs`. A fresh `npm run report:catalog` should then show no lost coverage and no stale lines.

## Coverage Mapping

The paths are the Automation lines as written. Spec files are under `tests/ui/`. "Hierarchy" is `drag-7-hierarchy-modal.spec.ts`, "Hold" is `drag-7-modal-hold.spec.ts`, "Overflow" is `drag-7-overflow-row.spec.ts`, "Stub-detach" is `drag-5-stub-detach.spec.ts`, "Heights" is `drag-stub-row-height.spec.ts`, and "popSession" is `client/src/components/workflow/popSession.test.ts`.

### Scope cases (the 4c table)

| Case (P) | Status | Automation line | Tests and whole-Then reading |
|---|---|---|---|
| DRAG-7.6 (P1) | Open → **Automated** | Hierarchy | "DRAG-7.6, DRAG-7.2: a Stub whose own slot is behind an overflow row starts back in the section as P’s last child…": on the Given's tree (`seedGivenTree`, B last), the pull-out is confirmed at the column (`/^column:/`), the ghost is at `6:0:true`, below B at level 1, and R's overflow row reads "1 child". The saved R1 is under P, attached, after B, and R1a is still under R1, attached. "DRAG-7.6: a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing": `2:L−1:true`, no write, R unchanged under Q. "DRAG-7.6: released in the column before zooming back in…": the request is `isAttached: false` with the anchor and side the drop line names; the saved item is Free, parent R, in Todo. Whole Then. |
| DRAG-7.9 (P0) | Open → **Automated** | Hierarchy | "DRAG-7.9, DRAG-7.28: … between R1 and R1a the one state is R1’s first child": the drag starts at Descendants; offsets −3, +3 and 0 all read `4:4:true`; saved under R1, attached, Todo, before R1a. "DRAG-7.9: in the gap R2 sits in, one tab right of its own depth…": Given asserted, `5:4:true`, saved under R1, attached, Todo, after R1a. "DRAG-7.9, DRAG-7.19: set back down in its own gap and depth…": `5:3:true`, no write, attached and Todo before and after. "DRAG-7.9, DRAG-7.12: a tab state past the depth cap…": CAP read from the board, `…:CAP−2:false`, no write, still attached in Todo. It uses its own deep tree carrying X, since the Terms' tree can't reach CAP. Every bullet and "each saved placement leaves R2 attached, with P’s workphase" is covered. The closing sentence describes where the first two bullets land, and they assert that. |
| DRAG-7.10 (P1) | Open → **Automated** | Hierarchy, popSession | The matrix "DRAG-7.10[, DRAG-1.14]: … pops once to … on …" has eight variants: click, hold-stub and hold-free, in a column and in a sub-row, on the clock, plus hold-stub on the distance. Each asserts:<br>• the modal is gone, the drag is locked, and the context is K;<br>• the row in K is an article, the overlay is short-card, and the ghost is the copy's height;<br>• the pop writes nothing;<br>• one request with `{anchorId: CardQ, side: after}`, no `parentId`, and `isAttached` not true;<br>• the saved item has `isAttached` 0, the same parent and Todo, and sits after CardQ;<br>• the overhang is at most 2 px ("bounded by K");<br>• for click, the rest point is in P's box.<br>"…resting beyond P’s box, inside its column…", "…reaching Board takes another pop out of the sub-row" and "…the sibling sub-row … is not reached by the one pop…" cover the sub-row clause. "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…" and "DRAG-7.10: an excursion … shorter than the pop-out distance…" cover the single excursion. "DRAG-7.10: the modal’s header is part of the modal…" covers the header. popSession's "DRAG-7.10: two excursions out of the hierarchy modal’s box, each shorter than popDelayMs, pop nothing: a return restarts the clock" covers the two-excursion sentence, which no surface test can tell from a single excursion. That test is in the approved clock category. Whole Then. |
| DRAG-7.12 (P2) | Open → **Automated** | Hold, Hierarchy | Hold's "DRAG-7.12: a modal a hold opens carries the drag’s tiers…" asserts:<br>• the Given, as `data-drop-state` valid, valid and depth-capped;<br>• `data-drop-tier` `parent`/`parent`/`anchor`/`neither` (Full, Full, Mid, Low) on R, R1, R1a and Y;<br>• R's tier equals its section tier before the modal opened;<br>• a static row "A" is visible in article P, then zero `[data-drop-tier]` there.<br>Hierarchy's "DRAG-7.9, DRAG-7.12: …" adds that the drag-start classification holds in a click-opened modal. Whole Then. |
| DRAG-7.13 (P1) | Open → **Automated** | Hold | "DRAG-7.13: a Free Card zoomed into P and held above R’s overflow row…": Given Free with a null parent; `3:3`; dwell with no `[data-drag-cue]`; cue present and visible; modal opens at Descendants; the hold clears. "…held below R’s overflow row, at its level, opens the modal as R’s last child". "DRAG-7.13: a release before the cue completes commits a Free Card zoomed in above/below… and the modal never opens" (first child and last child). "DRAG-7.13: any item at the layer opens it: B…". The Stub versions "DRAG-7.13: a hold above R’s overflow row is a silent dwell…" and "…a release before the cue completes commits where the ghost is…". Whole Then (Test Quality Concern 2). |
| DRAG-7.14 (P1) | Open → **Automated** | Hold, popSession | "DRAG-7.14: the hold starts over when the ghost changes level or gap" covers bullets 1–2: hold null, cue count 0, still at Descendants, projection not gap 6; a fresh dwell on tabbing back. "…the cursor leaving the whole Card’s box ends the hold…" covers bullet 3. "…moving into the Card’s title or padding during the dwell / cue…" covers bullet 4: the phase is unchanged 100 ms on, the modal opens, each side lies further than `MODAL_EDGE_MARGIN_PX` from the window's edge, the padding point is inside the modal, X is painted under it, and the projection reads `3:3:true`. "…the carried copy moving within the gap…" covers bullet 5. popSession's "DRAG-7.14: runs on from the same start while the cursor moves into the Card’s title or padding…" carries the dwell's run-on (same `since`), which a surface read can't tell from a restart (clock category). Whole Then. |
| DRAG-7.15 (P1) | Open → **Automated** | Hold | The five "DRAG-7.15: held from above/below, to the gap above/below…" variants, "DRAG-7.15, DRAG-7.19: the modal opens with the ghost’s spot under the cursor…" (up, no child, both gaps) and "DRAG-7.15: held from above, down to the gap above…" (down, no child) together cover all eight gap × approach × child cases. "DRAG-7.15: reaching R’s row in a single approach…" adds the single approach. Each asserts that the cursor is in the modal, the ghost is painted under it, the drag is at Descendants, and the release writes what the modal paints (parent R, `isAttached` 1, before R1 or after R2). With a child, the child is absent from the page for the whole drag, keeps its parent, and is drawn as the item's next modal row. Whole Then. |
| DRAG-7.17 (P2) | Open → **Automated** | Hold | "DRAG-7.17: when R’s children run longer than the modal…": `scrollTop` > 0, the ghost under the cursor, saved under R, attached, after E19. "DRAG-7.17: from the gap above R’s overflow row, a list that scrolls…": S has 20 children before R; `24:3:true` before and after the modal opens; `scrollTop` > 0; the ghost under the cursor; W saved under R, attached, before R1. The new Given ("within the modal list’s scroll reach") is shown by the outcome. Whole Then. |
| DRAG-7.18 (P2) | **Open** (unchanged) | — | Its only carriers are skipped: Hold's "DRAG-7.18: after leaving a modal a hold opened, P’s own Stub / a Free Card zoomed in…" (`test.skip`). It is routed to 4i with the cost study. |
| DRAG-7.27 (P2) | Open → **Automated** | Overflow | The R-carried test asserts:<br>• the Given ("2 children", and T's "1 child");<br>• R's overflow row and R1/R1a/R2 absent at pickup and at the aim below B;<br>• section rows `A, Q, R, T, overflow:T, B`;<br>• the line never on R's overflow row, and T's row still reading "1 child";<br>• saved under P, attached, after B, with R1 and R2 still under R;<br>• R1 and R2 at indent 1, R with no overflow row, and one write.<br>The cancel test brings the rows back with "2 children". The Q-carried test asserts its Given, then that R's row, T's row, R's overflow row and R1 are absent, and that "2 children" and T return after a cancel. The P-carried test asserts CAP ≥ 7 and P's two overflow rows in its Given, and none of P's overflow rows in the other Card's section. Whole Then. |
| DRAG-7.28 (P2) | Open → **Automated** | Hierarchy | "DRAG-7.28: a click on a row in the modal opens that item’s Sheet above it": heading R1 and not P; the modal's box and state unchanged; at a point inside both the Sheet and the modal, `elementFromPoint` lies in "Item details"; the Sheet's title opens an edit; nothing written. "DRAG-7.28: carrying a row in the modal opens no Sheet…": R1 is pressed and carried, the Sheet stays shut during and after, and R1 is saved under R, after R2, with R1a still under it. Whole Then. |
| DRAG-7.31 (P1) | Open → **Automated** | Hierarchy | "DRAG-7.31: a hidden Stub returned to its pickup slot after reopening the modal writes nothing…": Given asserted; the pull-out is confirmed at the column; `7:0:true`; reopened by a hold at `3:3:true`; back at `5:3:true`. No non-GET request from before the pickup through the release, which is stricter than "item write". Saved parent, attachment, position and workphase unchanged. The modal stays open with R2 after R1a and before T at indent 3. Whole Then. |
| DRAG-7.32 (P1) | Open → **Automated** | Hierarchy | Four "DRAG-7.32: closing the Sheet over the hierarchy modal by Escape / its X / its backdrop / its backdrop over the modal’s own X…" tests each assert:<br>• the Given: `scrollTop` 30 is read back, and the Sheet is in place;<br>• only the Sheet closes;<br>• the modal's box and `modalState` are equal, rows, indents and scroll included;<br>• no write, and the next Escape closes the modal.<br>"DRAG-7.32: Escape pressed while the Sheet is still sliding in…" slows animations through CDP (Chromium only, per the config) and asserts the Given: scroll 30, the Sheet visible and mid-entrance. It then asserts the same outcomes. The last sentence (an automatic close doesn't wait for the Sheet) is delegated to DRAG-7.26 and DRAG-7.35; see Candidate New Cases 1. |
| DRAG-1.14 (P2) | Open → **Automated** | Stub-detach, Hierarchy | Stub-detach:<br>• "DRAG-1.14: a yank past the pop-out distance, with every clock off, pops Descendants -> Column…" covers the Card's box, out to the column;<br>• "DRAG-1.14: a yank past the pop-out distance from an expanded sub-row, with every clock off, pops it to Board" covers a sub-row, out to Board, with the Given asserted;<br>• "DRAG-5.15, DRAG-1.14: B25 title / padding is inside the whole Card…" covers "the whole Card’s box": a point beyond the distance from the first row pops nothing.<br>Hierarchy:<br>• the two hold-stub distance variants of the DRAG-7.10 matrix cover the modal's box, by one sample with the clocks off;<br>• "DRAG-7.10, DRAG-1.14: with the distance off, an excursion…" covers distance 0 meaning only the clock decides.<br>Whole Then, with Test Quality Concern 1 on the modal-box discrimination. |
| DRAG-3.25 (P1) | Open → **Automated** | Heights | The section test covers typed, untyped and long-title rows and the overflow row at `s`, with the pill no taller than the title's line. The modal test covers modal rows and static rows under the backdrop at `s`; the static-row measure is first checked against a registered row. The eight pickup variants (section or modal × typed or untyped × branch or none) assert ghost and copy at `s` (the border inside), the branch line below the copy adding nothing, and no line on the ghost. `seedHeightTree` asserts each item's saved type, or that it has none. Heights are compared with each other only. Whole Then. |

### Other cases the range touches

| Case (P) | Status | Why in scope | Reading |
|---|---|---|---|
| DRAG-7.2 (P1) | Automated (line updated) | It is carried by the new "DRAG-7.6, DRAG-7.2: …" test, and by the deleted skipped test "DRAG-7.2: with R’s only attached child dragged…" | The new Hierarchy test carries "1 child while R1 is dragged". The only-child clause rests on the existing pointer `descendantsSection.test.ts` ("DRAG-7.2: leaves the dragged item out of the count, and draws none when it was the only child"). The deleted test was skipped, so nothing was lost. The line is now `tests/ui/drag-7-overflow-row.spec.ts`, `tests/ui/drag-7-hierarchy-modal.spec.ts`, `client/src/components/workflow/descendantsSection.test.ts`. |
| DRAG-7.11 (P1) | Automated (unchanged) | Its ID was dropped from the old, skipped pop-out test | It is still carried by Hierarchy's "DRAG-7.11: while the modal is open…" (unchanged) and by popSession. |
| DRAG-5.15 (P0) | Automated (unchanged) | The B25 titles gained DRAG-1.14 | Title-only change. |
| DRAG-3.22 (P2) | Automated (unchanged) | `dragOverlayGeometry.test.ts` "DRAG-3.22: locked at a Card’s Descendants layer, or the modal that holds it…" changed | Only a third `null` argument was added, with the expected values unchanged. The case's surface carriers, `drag-layer-transitions.spec.ts` and `drag-card-forms.spec.ts`, are unchanged and ran green in the final full run. No mapping is needed (Review Log Answers, Phase 2). |
| DRAG-5.3 (P0) | Automated → **Open**, `—` | The B18 parameterized test is now `test.skip` (coverage report: stale line) | See Coverage Report Findings and Gaps. |
| DRAG-5.10 (P1) | Automated → **Open**, `—` | The B21 parameterized test is now `test.skip` | B17 and B10 don't cover the whole Then; see Gaps. |
| DRAG-7.21 (P2) | Automated (unchanged) | `cueOn` now reads `[data-drag-cue]` | The absence check now reads a documented attribute that DRAG-7.13's tests show present and visible, so it can't pass vacuously. |
| DRAG-7.16 (P1) | Automated (unchanged) | `expectReleaseCommitsShown` now also asserts `isAttached` 1 | Stricter; the Then still holds. |
| DRAG-7.1, 7.3–7.5, 7.7, 7.8, 7.19, 7.22–7.26, 7.29, 7.33–7.35 | Automated (unchanged) | Their tests changed only through helpers (`seedTree`'s level guard, header comments) or not at all | All are still carried by running tests (coverage report). No clause changed. |
| DRAG-2.22 (P1, 4f) | Open (unchanged) | It is carried by "DRAG-7.21, DRAG-2.22: …", whose `cueOn` changed; open reviewer verdict | Stamped on two DRAG-7.27 tests (Stamps Added). Still partial; see Gaps. |
| DRAG-6.15 (P1, 4d) | Open (unchanged) | Open reviewer verdict | See Gaps. |

## Coverage Report Findings

- **Lost coverage: DRAG-3.16** is `Automated` with no running carrier. Its two variants in `tests/ui/drag-band-contracts.spec.ts` are skipped.
  - Set to `Open`, with the Automation line `—`, in both the table and its own line. It is routed to 4i.
  - Results' living-docs handoff says DRAG-3.16's line "already does" reflect the gap. It didn't, until now.
- **Manual cases a running test carries:** none.
- **Stale Automation lines:**
  - **DRAG-3.16:** fixed as above.
  - **DRAG-5.3:** its line named only `tests/ui/drag-5-stub-detach.spec.ts`, where only the skipped B18 tests carry it. Its running carriers are internal, and none was ever on its line:
    - `dragRequest.test.ts`'s "DRAG-5.3: append names no place among others…";
    - `placement.test.ts`'s "DRAG-5.3, DRAG-6.12: at Board layer…", "DRAG-5.3: the Board-layer middle band sends the detach and the region’s workphase, with no anchor" and "DRAG-3.2, DRAG-5.3: the bottom band still sends the anchor after the last row".

    They are in the approved request category, but they assert only the request half (Gaps). Set to `Open`, with the Automation line `—`.
- **Two statuses for one case:** none. Every edit above changed the table cell and the case's own line together.
- **Catalog fields not read:** none.

## Stamps Added

Title only, in `tests/ui/drag-7-overflow-row.spec.ts`:

1. "DRAG-7.27: a dragged R carries its overflow row and its branch…" became "**DRAG-7.27, DRAG-2.22:** a dragged R carries its overflow row and its branch…".
2. "DRAG-7.27: a dragged Q carries R and T, so their rows and R’s overflow row are all absent" became "**DRAG-7.27, DRAG-2.22:** a dragged Q carries R and T…".

Both assert DRAG-2.22's clause "An overflow row belonging to the carried branch is absent": R's own overflow row while R is carried, and R's while Q, whose branch holds R, is carried. Both are surface tests, so no approval is needed. The stamp claims part of the case; DRAG-2.22 stays `Open`. The QA Engineer runs the title-only diff and `check:docs`.

## Review Log Answers

**Phase 2 step 4, carried forward.**
- None of the declined internal mappings is proposed again.
- One declined mapping's test changed since: DRAG-3.22's, in `dragOverlayGeometry.test.ts` (a third argument). DRAG-3.22's surface tests cover the whole case, so no internal test is mapped beside them (README), and the change reopens nothing.
- Both mappings approved outright are in place:
  - DRAG-7.10's clock test, popSession's two-excursion test, now stamped;
  - DRAG-7.28's ID on DRAG-7.9's first-child test.

**Stop 1 desk replies.** The Planner's six answers (Open questions, Stop 1 items 1–6) and the catalog diff close every row the desk found silent:
- DRAG-7.10 r6: the two-excursion sentence is now in the Then, carried by popSession.
- DRAG-7.14 r5: the ghost's gap and level are now in the Then, and asserted.
- DRAG-7.18 r1: "opens a second time" is now in the Then. Its tests are skipped.
- DRAG-7.27 r3: T is now named, and asserted.
- DRAG-7.9 r2 and r3: the Then now reads "each saved placement…", and it is asserted.

The other rows:
- DRAG-7.15 r6 (contradicts): dropped by Planner answer 2. No test asserts it, correctly.
- DRAG-7.18 r2: the Then now says "No write occurs", and the skipped tests counted writes.
- DRAG-7.6 r1: resolved by `seedGivenTree`, the Given's tree without X.

**Test Reviewer, first pass.** Every gap was closed in later passes, and I confirmed each closure from the current tests:
- DRAG-7.6: the column step in `pullOutAndZoomBack`, and R1a's `isAttached`.
- DRAG-7.9: the ±3/0 offsets.
- DRAG-7.10: the ghost's height equals the copy's; owner P is asserted.
- DRAG-7.12: the static row is shown before the zero count.
- DRAG-7.13: the cue is visible, through `[data-drag-cue]`.
- DRAG-7.14: bullet 1's context and projection; the dwell's run-on in popSession.
- DRAG-7.15 and 7.17: `isAttached`.
- DRAG-7.27: indent 1.
- DRAG-7.28: the overlap point and R1 carried.
- DRAG-3.25: the static-row self-check and the saved types.

The rest of the first pass:
- DRAG-7.31's wording note: resolved by Planner answer 6.
- DRAG-7.32's lost-Escape note: resolved by the case's new paragraph, the Coder's `useEscapeKey`, and the early-Escape test.
- DRAG-1.14's B25 mapping: applied.
- Cross-cutting 1 (L pinned): answered by `seedTree`'s guard, which fails on a retune.
- Cross-cutting 2 (helper headers): done.
- The `awaitProjection` header: done.

**Test Reviewer, second pass.**
- DRAG-7.10's red click arrival: the PO ruled that the wiki stands (Amendments, 2026-11-11). The Coder's change makes it green unchanged, as seen in the third pass, and all five click tests run in the green run.
- DRAG-7.14's gap: closed by the popSession run-on test.
- DRAG-3.25's untyped residue: closed by `seedHeightTree`'s null-type assertions.
- DRAG-7.32's record note: settled in the fourth pass.
- Cost notes: decided by Nathan (Results).

**Test Reviewer, third pass.** Proposed mapping 1 (the two-excursion test needs an ID) is resolved: it is stamped DRAG-7.10, and Planner answer 1 put the clause in the Then. It counts outright (clock category), and it is on DRAG-7.10's Automation line.

**Test Reviewer, fourth pass.**
- Every "Proves the case" is confirmed, except DRAG-7.18's. That verdict was right for its tests, but they are now skipped, so DRAG-7.18 stays `Open`.
- The two optional notes, which the reviewer hasn't seen applied, are confirmed in the files:
  - the padding tests assert each side lies more than `MODAL_EDGE_MARGIN_PX + 0.5` from its edge;
  - the early-Escape test asserts `before.scrollTop` is `SCROLLED_BY` first.
- Cost note 1 (DRAG-7.18): Nathan skipped it and moved it to 4i. Notes 2 and 3 were kept, by Nathan's decision.

**Open in every pass.**
- **DRAG-2.22 (Test gap):** still open, and assigned to 4f. The two DRAG-7.27 mappings are applied (Stamps Added).
  - I decline the third mapping, onto "DRAG-7.13: a hold above R’s overflow row is a silent dwell…". That test never establishes its Given: it reads neither the owner's Valid state nor its Full tier, only the projection's valid flag.
  - Hold's "DRAG-7.12: …" test is the closer fit for 4f. It asserts R's tier `parent` and the Valid state, then opens the modal by a hold. No test reads the overflow row's own tier, since the row carries no `data-drop-tier`.
- **DRAG-6.15 (Test gap):** still open, and assigned to 4d (Gaps).

## Proposed Internal Mappings (need approval)

None. Where an internal test carries part of a scope case, it is either in an approved category (popSession's DRAG-7.10 and DRAG-7.14 clock tests) or beside a surface test that covers the whole case. DRAG-5.3's internal request tests are in the approved request category, but they don't cover the gesture. Its surface tests return in 4i.

## Proposed Manual (need approval)

None. DRAG-7.18's cost is 4i's study to weigh. Its options include simplifying the test.

## Gaps

- **DRAG-7.18 (P2, Open):** no running test. Both tests in `drag-7-modal-hold.spec.ts` are skipped. Batch 4i.
- **DRAG-3.16 (P1, now Open):** no running test. Both variants in `drag-band-contracts.spec.ts` are skipped. Batch 4i.
- **DRAG-5.3 (P0, now Open):** the running internal tests cover the band's request: a middle band with no anchor, a bottom band with its anchor, and the append preview. Nothing running asserts:
  - the gesture through C1, then Board, then C2;
  - the top band's `{anchorId: first, side: before}`;
  - the saved `parentId` still P, with C2's entry workphase or the sub-row's workphase;
  - the `popInDelayMs` lock in C2 and its reposition.

  B18's eight skipped variants asserted all of these. Batch 4i.
- **DRAG-5.10 (P1, now Open):**
  - B17, "DRAG-5.1, DRAG-5.2, DRAG-5.10: B17 …", covers the pop to the column: both copies shortCard, absent from P's section.
  - B10, "DRAG-4.30, DRAG-5.10: B10 …" in `drag-descendants-placement.spec.ts`, covers zooming back into P in the same drag (Stub copies) and a no-write release (saved row unchanged).
  - Nothing running covers "When X then zooms into a Card Q, then both copies are Stub rows again, inside Q".
  - Nothing running covers the cancel ending, or the rendering back as P's Stub after a no-write ending. B10 doesn't read X's row after its release.
  - The skipped B21 test covered all of these. Batch 4i.
- **DRAG-2.22 (P1, Open, 4f):**
  - Carried: the Depth-capped owner clause, by "DRAG-7.21, DRAG-2.22: …", whose Given reads only the projection's invalid flag, not R's `data-drop-state`; and the carried-branch overflow-row clause, by the two new stamps.
  - With no test: the Mid Card zoom-in clause, the Cycle-forming owner clause, and "A Full overflow row with a Valid owner retains the ordinary valid hold behavior" as stated.
- **DRAG-6.15 (P1, Open, 4d):** "DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal…" carries one cause in one context. The stale-reindex and column-reorder causes, and the column/sub-row and section contexts, have no surface test. `useBoardDnd.test.ts` carries the ID internally, without an approved mapping.

## Duplication

Reported, not judged. Most of it is the intended split between a surface test and an approved internal category.

- **DRAG-1.14:** three Stub-detach tests, two Hierarchy variants, and popSession's four DRAG-1.14 tests: either-satisfies, distance off, the merged column's outer body, and the Card's box.
- **DRAG-7.10:**
  - the header is covered by the surface test and by popSession's "DRAG-7.10: a Descendants region with a boundsRect is still inside over that box…";
  - the sub-row and bound behaviour also has carriers in `KanbanCard.test.tsx` and `dragStructure.test.ts`;
  - the Coder's new unnumbered `KanbanCard.test.tsx` ("the carried copy’s width") and `dragOverlayGeometry.test.ts` (`overlayClampRect`) tests back "bounded by K" internally.
- **DRAG-7.13:** the surface tests, popSession's two DRAG-7.13 tests and `descendantsProjection.test.ts`.
- **DRAG-7.14:** the surface tests and four popSession DRAG-7.14 tests.
- **DRAG-7.15:** the surface tests, `HierarchyModal.test.tsx`, `descendantsProjection.test.ts` and `modalPlacement.test.ts`.
- **DRAG-7.17:** the gap-above surface test and `modalPlacement.test.ts`'s DRAG-7.17 scroll tests. This is the reviewer's cost note; Nathan kept both.
- **DRAG-7.32:** the surface tests and `HierarchyModal.test.tsx`. The new unnumbered Escape tests in `ItemDetailPanel.test.tsx` and `ModalShell.test.tsx` overlap its early-Escape clause.
- **DRAG-7.9 and DRAG-7.19:** "DRAG-7.9, DRAG-7.28: …" and "DRAG-7.19: after a release in the modal it stays open…" both release R2 as R1's first child.
- **DRAG-7.12:** Hold's tier test and Hierarchy's "DRAG-7.9, DRAG-7.12" states test.
- **DRAG-7.2, DRAG-7.27 and DRAG-7.31:** each surface test is also mirrored by `descendantsSection.test.ts` or `descendantsProjection.test.ts`.
- **DRAG-3.25:** the surface tests, `KanbanCard.test.tsx` and `dragChrome.test.tsx`.

## Test Quality Concerns

No test hard-codes today's output in place of the rule. Each expected value traces to the Then: the anchor and side, the saved parent, attachment and workphase, the projection's gap and depth from the Terms' tree, and heights compared with each other.

1. **DRAG-1.14 and DRAG-7.10, the hold-stub distance variants, don't show their rest point lies in P's box** (`expectLeavesOnce`; owner P is asserted for the click arrival only).
   - A modal opened by a hold sits under the cursor and is far wider than P. The ≥150 px clearance probably finds no point in P, so `restPoint` falls back to CardQ.
   - A sample on CardQ that far from the modal is probably as far from P's box too. The test would then pass the same if the distance were measured against the Card's box while the modal holds the layer.
   - The point that tells the two apart is "a sample inside, or near, P's box but beyond `popDistancePx` from the modal pops". The four click-arrival distance variants carried it, and they were removed by the cost decision.
   - What still backs the clause: the click clock variants show the modal's box is the layer's context box (owner P is asserted), and wiki board-drag-interaction §3.1 has one pop-out rule per context box.
   - A cheap tightening: in the distance variants, assert where the rest point lies, or seed a `popDistancePx` small enough that a point in P's box clears the modal. The rule is wiki board-drag-interaction §3.1 and §7.3: "the modal’s box while the modal holds it". I read the case as covered, since the test asserts the Then's positive statement. I've raised the weakness so the QA Engineer can decide.
2. **DRAG-7.13, "The same holds below the overflow row".**
   - Below the row, the tests assert the hold opening the modal and the early release committing the last child.
   - The visible cue is asserted only above the row.
   - The phases below are read (dwell, then cue at `6:3`), but only in DRAG-7.14's "starts over" test.
   - I accept it, since the cue is the same element in either gap. A cue-visibility read in the below test would make the case stand on its own tests.
3. **DRAG-3.25, `staticRow`** measures a static row as its title's parent, after checking that this equals a registered row's box in the section. That holds only while static rows keep the live rows' structure. The reviewer accepted it, and so do I.
4. **DRAG-7.28's click test also asserts that Escape ends the Sheet's title edit before it closes anything.** Its Then doesn't say this. A test may pin a detail the wiki leaves open, so this is not a defect. It is recorded under Candidate New Cases 3.
5. **DRAG-7.9's over-cap bullet runs on its own deep tree, carrying X.** The Terms' tree can't reach CAP. I read this as within the Then.

## Uncatalogued Tests

Every new or changed Playwright test in the range carries an ID. These Vitest tests in the range carry none.

**For the coverage gate or the implementation, with no standalone business rule. Don't map them:**
- `client/src/components/ModalShell.test.tsx` (new): "closes the modal, and no other key does"; "closes it when a listener added to the document before its own re-renders it during the keypress"; "stops listening once the modal is gone".
- `client/src/components/ItemDetailPanel.test.tsx`, "the Sheet’s Escape": "closes it when a listener added to the document before its own re-renders it during the keypress". This is a regression test for the lost early Escape, behind DRAG-7.32's new paragraph.
- `client/src/components/workflow/dragStructure.test.ts`, `cardWidthOf`: both tests.
- `client/src/components/dragChrome.test.tsx`, "a hold’s cue": "marks its fill bar for a test to find…". This is the `data-drag-cue` hook's contract.
- `client/src/components/KanbanCard.test.tsx`, "the carried copy’s width": three declarations. These back DRAG-7.10's "bounded by K".
- `client/src/components/workflow/dragOverlayGeometry.test.ts`: `overlayShapeFor`'s two new tests, and `overlayClampRect`'s three. These back "bounded by K".

**Genuine scenarios (Candidate New Cases):**
- `dragOverlayGeometry.test.ts`, "reanchorOverlayTransform › a Stub’s drag drawn as a shortCard": six tests on the pointer staying on the copy as it narrows. See candidate 2.
- `ItemDetailPanel.test.tsx`, "the Sheet’s Escape": "closes the Sheet" and "leaves the Sheet open and ends a title edit instead". See candidate 3.

## Candidate New Cases

None was added; these are for their owners.

1. **The modal's automatic close when its Card is gone doesn't wait for an open Sheet.** This is a Test Planner gap: wiki board-drag-interaction §9 states it ("That close doesn't wait for a Sheet: it happens at once, with the Sheet still open"). DRAG-7.32's last sentence delegates it to DRAG-7.26 and DRAG-7.35. DRAG-7.26's Then has no Sheet, and DRAG-7.35 covers only the empty-hierarchy close. No case's Then holds the Card-gone close under a Sheet, and no test asserts it.
2. **A Stub's drag that pops out to its column keeps the carried copy under the pointer as the copy narrows,** including from the hierarchy modal's wider row to the column's shortCard. This is a Test Planner gap: wiki board-drag-interaction §5a says the copy "stays under the pointer through the switch in both directions". DRAG-3.22 states the back-out direction for a Card zoomed in, and DRAG-5.10 and DRAG-7.10 say nothing of the pointer. Only the unnumbered `dragOverlayGeometry.test.ts` re-anchor tests cover it.
3. **Escape in the Sheet backs out of the innermost thing open: a title or description edit, then the delete confirmation, then the Sheet.** This is a Product Owner gap: no wiki page states the Sheet's own Escape order. The wiki states only the Sheet-over-modal order (§9). It is asserted by `ItemDetailPanel.test.tsx` and, beyond its Then, by DRAG-7.28's click test. It is probably the Sheet epic's to rule.

## Totals

The coverage report's totals, with this run's changes applied:
- `Open` → `Automated`, 14 cases: DRAG-7.6, 7.9, 7.10, 7.12, 7.13, 7.14, 7.15, 7.17, 7.27, 7.28, 7.31, 7.32, DRAG-1.14 and DRAG-3.25. One is P0, eight are P1 and five are P2.
- `Automated` → `Open`, 3 cases: DRAG-3.16 (P1), DRAG-5.3 (P0) and DRAG-5.10 (P1).

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| P0       |       139 |    8 |      0 |       1 |          0 |   148 |
| P1       |       178 |   66 |      6 |       0 |          0 |   250 |
| P2       |        72 |   11 |      4 |       1 |          2 |    90 |
| Total    |       389 |   85 |     10 |       2 |          2 |   488 |

**4c's own count:** 14 of its 15 cases close. By kind:
- Extend: 2 (DRAG-7.28, DRAG-1.14).
- New: 3 (DRAG-7.13, 7.31, DRAG-3.25).
- Rework: 8 of 9 (DRAG-7.6, 7.9, 7.10, 7.14, 7.15, 7.17, 7.27, 7.32). DRAG-7.18 is in 4i.
- Split: 1 (DRAG-7.12).

4i now holds four Open cases: DRAG-3.16, DRAG-5.3, DRAG-5.10 and DRAG-7.18.

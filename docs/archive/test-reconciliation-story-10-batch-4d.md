# Story 10 batch 4d — Stop 5 confirming reconciliation

**2026-11-13 · Confirming, run once at the batch's close.** Batch 4d had 16 cases. 12 are now `Automated`: DRAG-6.8, 6.9, 6.15, 6.18, 6.19, 6.20, 6.21, 6.22, 6.25, 6.26, 6.27 and 6.28. Four stay `Open`, each held for 4j by a ruling of Nathan's: DRAG-6.7 (the discard clause with pairs), DRAG-6.16 (the top edge), DRAG-6.23 (the whole case) and DRAG-6.24 (the drop line). The coverage report had no finding to act on. I added no stamp and edited no test. Outside the scope, the range touches DRAG-6.1, 6.2, 6.5 and 6.6, which stay `Automated`, confirmed. It also touches the retired DRAG-6.17, which no test carries now, and DRAG-6.30, the Planner's `Manual`, which I left alone. TREE-5.3, ATT-10.7 and ATT-10.9 each lost a clause. ATT-10.9 is now `Automated` too. Its surface test and two internal tests cover it whole together, and Nathan approved the internal mapping in a follow-up (Proposed Internal Mappings). No case's text, title, priority or Rule changed.

**Inputs.**
- The plan: the 4d, 4i and 4j sections, the Amendments, the Results packet and the whole Review log of `docs/planning/epic-3-5-stories/story-10-batches.md`, and the proof plan `story-10-batch-4d-proof-plan.md`.
- The coverage report, `tests/output/batch4d-stop5-report-catalog.txt`, run on the green run's tree `39abbfa8…` (`tests/` subtree `f5777d10…`).
- The green run's record:
  - D2's ten repeats of the two specs at five workers, `tests/output/batch4d-d2-repeat10.json`: 460 expected, 0 unexpected, 0 flaky, 60 skipped;
  - the final full E2E run, `tests/output/batch4d-final-full-e2e.json`: 482 expected, 0 unexpected, 0 flaky, 28 skipped;
  - the root gate, `tests/output/batch4d-stop4-gate.log`, exit 0.
- The range's diffs, from baseline tree `13d925d5…` to the green run's tree: `tests/output/batch4d-stop5-diff-playwright.patch`, `…-diff-vitest-app.patch` and `…-diff-catalog.patch`.
- Nathan's approvals: every existing internal pointer, and the new DRAG-6.1 test in `client/src/components/workflow/itemWriteReconciliation.test.ts` (2026-11-13). No `Manual` proposal is approved.
- A follow-up, after this report's first version: Nathan approved the ATT-10.9 mapping onto the two ATT-10.9 tests in `client/src/components/ItemDetailPanel.test.tsx` (2026-11-13). It covers that one mapping only, not ATT-1.15, BCU-1.9 or BCU-1.10.

**Limits.**
- I have no shell, so I ran nothing. I read the catalog, wiki board-drag-interaction §10 (and boards-columns-unsorted §7 where a case cites it), both specs whole, the three helpers in the range and the changed Vitest files from disk. I took the files on disk to be the green run's tree, which I couldn't check.
- I added no stamp, so there's no title-only diff of mine to check. I changed two catalog files, and only status and Automation fields: `docs/test-plans/board-drag-interaction/drag-6-preview-reconciliation.md` for the 12 cases, and `docs/test-plans/item-attachment/att-10-creating-an-item.md` for ATT-10.9. A fresh `npm run report:catalog` and `npm run check:docs` should show no stale line and no status mismatch.

## Coverage Mapping

"Forced-stop" is `tests/ui/drag-forced-stop.spec.ts`. "Reconciliation" is `tests/ui/drag-preview-reconciliation.spec.ts`. "Hierarchy" is `tests/ui/drag-7-hierarchy-modal.spec.ts`. "The stop run" is the five running cells of forced-stop's matrix, all titled "DRAG-6.15, DRAG-6.16, DRAG-6.20: …":
- "… <a failed item drop | a stale response | a failed column reorder> stops an item drag in a column";
- "… a stale response stops a Stub's drag in a Card's descendants section";
- "… a stale response stops a row's drag in the hierarchy modal".

The other four cells are `test.skip` and don't count.

### Scope cases (the 4d table)

| Case (P) | Status | Automation line | Tests and whole-Then reading |
|---|---|---|---|
| DRAG-6.7 (P1) | **Open** (unchanged) | — | Reconciliation's "DRAG-6.7: a stale response with reindex pairs resyncs the board to the server once" and "DRAG-6.5, DRAG-6.7: a stale response without reindex pairs is discarded and the board does not reload" assert:<br>• the Given: write 1's answer is held and carries pairs only when the scope is pinned high, read from the held body; write 2's answer lands first, with A unmarked, BAC on the server and no board load;<br>• with pairs, one board load, then B, A, C on screen and BAC on the server;<br>• without pairs, no load, and A stays in write 2's slot (B, A, C), where applying the stale row would draw B, C, A.<br>**Missing:** with pairs, "its row for `X` is discarded" and "instead of applying the pairs". During the resync the board shows "Loading board…", and after it, every path ends in the server's order. The two `dragRequest.test.ts` DRAG-6.7 tests mock the write tracker's verdict, so they assert the resync and not the discard. Deferred to 4j (Nathan, 2026-11-13). |
| DRAG-6.8 (P1) | Open → **Automated** | Reconciliation | The four "DRAG-6.8: <Escape \| a release where nothing is written> on a re-drag with write 1 <still in flight \| already landed> leaves the item <pending at its dropped slot \| at its saved position, unmarked>" each assert:<br>• the Given: A, B, C, X, pending or unmarked as the state requires;<br>• after the re-drag ends: still A, B, C, X, no X in Todo, the marker as the state requires, and one write in all;<br>• once the held answer is released, the marker clears, and the server holds ABCX.<br>Write 1 is held for as long as the test needs, so a cleared placement would draw X back in Todo for that whole window, and the read after the cancel would see it. That is what "never shows `X` at its old slot" asks. Whole Then (Test Quality Concern 2). |
| DRAG-6.9 (P1) | Open → **Automated** | Reconciliation | "DRAG-6.9: a response that lands mid-drag of the same item leaves its ghost at the placement of the drag, and a release commits against the reconciled board":<br>• X is pending before the re-pickup;<br>• X is carried to Item B's top quarter and the cursor stays still;<br>• the held answer is released and awaited, and the marker clears;<br>• with no pointer movement, the painted order reaches A, X, B, C, where the answer alone would draw A, B, C, X;<br>• the release commits: the server holds AXBC, there are two moves for X, and the second names A or B.<br>Whole Then (Test Quality Concern 3). |
| DRAG-6.15 (P1) | Open → **Automated** | Forced-stop, Hierarchy | The stop run, forced-stop's "DRAG-6.15, DRAG-6.20: the flash is at the reloaded place of the stopped item when the reload moved it", and Hierarchy's "DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open". Each stop run asserts:<br>• the cause's Given, through `holdForcedStopCause`: a refusal, or a 200 with pairs whose later move has already answered;<br>• the drag over while the reload's read is held with "Loading board…" visible, and again on the reloaded board with the pointer still down (`expectDragOver`: no `data-drag-state`, no carried copy, no row with a drop state or tier);<br>• X where the server has it. In the column, X is in Todo, In Progress is ordered on screen and on the server, and the columns are unchanged. In the tree scenes, the rows are polled to the server's order, and X's saved parent and workphase are read back;<br>• no write naming X, and no new write after `mouse.up()`.<br>The moved-X test draws X in Review, not Todo. Hierarchy's test adds a failed drop in the modal. Every clause is asserted for each cause and in each place. Whole Then (Test Quality Concern 1 on the skipped cells). |
| DRAG-6.16 (P1) | **Open** (unchanged) | — | The stop run asserts:<br>• `expectBannerSays` while "Loading board…" shows: the banner visible, with its cause's sentence spelled from the case;<br>• the same text on the reloaded board;<br>• from the page-side recorder: one banner added, none removed, and no change in place to its cause attribute, its text or a child.<br>**Missing:** "along the window's top edge". No test reads where the banner is drawn: Nathan's text-only ruling (2026-11-12), and a 4j question since 2026-11-13. `ForcedStopCue.test.tsx`'s "DRAG-6.16: says why when the cause is %s" reads the text only. |
| DRAG-6.18 (P1) | Open → **Automated** | Forced-stop | The two "DRAG-6.18: a click leaves the banner up and the next drag's pickup removes it, in its <fully visible \| fade> part":<br>• the clock is frozen from before the stop, and the banner is on the reloaded board;<br>• fully visible: a click at the banner's centre and one on Done each leave the same sentence;<br>• fade: the clock moves to `ceil(0.75 × T)`, and the banner is still there;<br>• then a pickup of Item B removes it, and it stays gone after the cancel. The clock is frozen, so only the pickup can have removed it.<br>`T` comes from the seeded tuning. Whole Then. |
| DRAG-6.19 (P1) | Open → **Automated** | Forced-stop | The two "DRAG-6.19: the banner for <a failed item drop \| a stale response> stays until its lifetime passes, and the reload does not restart it": half of `T` passes while the read is held, with the banner present. The reloaded board draws with the banner present, and the banner is present at `T − 1` from the stop and gone at `T`. A restart at the reload would leave it up at `T`. Both sentences are covered. Whole Then. |
| DRAG-6.20 (P1) | Open → **Automated** | Forced-stop | The stop run and the moved-X test:<br>• exactly one row has `data-stop-flash`, and it is X's: a Free Card (each cause), a Stub in P's expanded section, and a row in the open modal (the stale response);<br>• the causing item isn't flashed instead: Item A in the column, Item B in the tree scenes;<br>• with X moved to Review on the server, it flashes there, and nothing in Todo does;<br>• no saved placement changes: In Progress, which holds the causing item, is read from the server, X's saved place is read back, and there's no write for X.<br>Whole Then. |
| DRAG-6.21 (P1) | Open → **Automated** | Forced-stop | The two "DRAG-6.21, DRAG-6.28: a stopped item hidden <in a collapsed section \| behind an overflow row> is not revealed, and flashes for the rest of the window once opened":<br>• X is moved on the server while it is held: into P2, or under R;<br>• before the stop, nothing is scrolled, and the hidden place lies below the fold, behind 12 filler Cards;<br>• after the reload, P2's section is collapsed (its "Show attached children" control), or R's overflow row is drawn with no modal and the section's rows lack X;<br>• X isn't drawn, no row flashes, and the banner explains;<br>• still nothing is scrolled, and the place is still below the fold.<br>The closed modal is the overflow row's place (Nathan, 2026-11-12). Whole Then. |
| DRAG-6.22 (P1) | Open → **Automated** | Forced-stop | The carriers:<br>• "DRAG-6.22: an Escape cancel shows no banner and no flash";<br>• "… a release where nothing is written …";<br>• "… a Stub released at its own gap and depth …", with projection `8:0:true` awaited;<br>• the six "DRAG-6.22: <cause> that resyncs the board with no drag running, after a drag was <released \| cancelled>, shows no banner and no flash".<br>Each asserts, through `expectNoCue`, no banner and no flash on screen, and none in the recorder since the page loaded, which is the Given. The first three write nothing. In the six, the board then matches the server. The closing sentence, an item drag stopped by a failed column save, points to DRAG-6.16, and the column cell of the stop run asserts it. Whole Then. |
| DRAG-6.23 (P1) | **Open** (unchanged) | — | Its one surface test, "DRAG-6.23: a pending item picked up again has a pending ghost that is no target, and the other rows have tiers", is `test.skip`: it was red and is deferred to 4j, along with the three tier variants. `dragChrome.test.tsx`'s "DRAG-6.23, DRAG-6.24: pulses a pending row's content, which keeps its tier, and not its root" is internal, with no mapping. The whole case is 4j's. |
| DRAG-6.24 (P1) | **Open** (unchanged) | — | Running:<br>• "DRAG-6.24: a pending Card is pending alone, and its Stub is not and keeps its tier": S keeps the tier Z's drag gave it before P was pending;<br>• "DRAG-6.24: a pending Stub is pending alone, and its Card is not";<br>• "DRAG-6.24: with a Card and its Stub both pending, each answer clears only its own marker".<br>**Missing:** "A drop line naming a pending row never acquires pending state, including beside a Mid Card or Stub". Its test, "DRAG-6.24: a drop line naming a pending Mid Card or a pending Stub has no pending state of its own", is skipped and deferred to 4j with the wording question. No internal test reads the line. |
| DRAG-6.25 (P1) | Open → **Automated** | Forced-stop | The three "DRAG-6.25, DRAG-6.26: <cause> stops a column drag, which saves no reorder and moves no item":<br>• the Given: `dragReviewTowardFirst` polls Review to be the first painted column before the stop. For a failed column reorder, Done's earlier reorder is held, so it is outstanding at Review's pickup;<br>• after the reload, the columns read Todo, In Progress, Review, Done in the DOM, and `fetchBoard` is unchanged;<br>• the reorder and item writes are the cause's own (reorders 1 or 0; item writes 1, 2 or 0), before and after `mouse.up()`. The pointer is still over the first slot, so a drag that survived would reorder on release;<br>• In Progress and X are where the server has them.<br>Whole Then. |
| DRAG-6.26 (P1) | Open → **Automated** | Forced-stop | The three DRAG-6.25/6.26 tests: the banner is visible, with its cause's sentence, during the load and after it, with one added, none removed and none changed. No row flashes, and the recorder logged no element given `data-stop-flash`, the column included. "DRAG-6.26: after a column drag is stopped, a click leaves the banner and the next drag clears it" covers a failed drop. "DRAG-6.26: the banner of a stopped column drag expires at its lifetime from the stop, and the reload does not restart it" covers a stale response: `T/2` while loading, present at `T − 1`, gone at `T`. Whole Then. |
| DRAG-6.27 (P1) | Open → **Automated** | Forced-stop | The carriers:<br>• the three "DRAG-6.27: after <cause>, a reload longer than the window spends none of it, and the flash ends at its length with the banner still up". The lifetime is 10,000 ms; `F + 100` passes while loading; the flash is on at the draw and at `t0 + F − 1`, and off at `t0 + F` with the banner up;<br>• "DRAG-6.27: a new drag before the window ends ends the flash at its pickup, and ending that drag does not replay it". A pickup at `t0 + F/2` ends it; after the cancel, no row flashes and the recorder has no new entry, again after `F`;<br>• "DRAG-6.27: another reload before the window ends ends the flash at its start, and draws none of its own". A second refused drop lands with no drag running at `t0 + F/2`, and X is redrawn without the flash. The clock is frozen inside the window, so a flash that survived the reload would show. The recorder has no new entry.<br>"Measured … even when the stopped item is hidden" points to DRAG-6.28, which asserts it. `F` is the client's `STOP_FLASH_MS`, the value the case names. Whole Then. |
| DRAG-6.28 (P1) | Open → **Automated** | Forced-stop | The two "DRAG-6.21, DRAG-6.28: …" open the hidden place at `F/2`: X flashes alone, on at `t0 + F − 1` and off at `t0 + F`, and its saved place and the write count are unchanged across the opening. The two "DRAG-6.28: a stopped item hidden <…> and opened once the window has ended does not flash" open it at `t0 + F`: X is drawn without the flash, the banner is up, and the saved place and writes are unchanged. X is read inside P2's Card, or inside the modal. Nothing opens by itself (`hiddenStop`). The collapsed section and the overflow row into the modal are both covered. Whole Then. |

### Other cases the range touches

| Case (P) | Status | Why in scope | Reading |
|---|---|---|---|
| DRAG-6.1 (P0) | Automated (unchanged) | A new test in its approved internal carrier | `itemWriteReconciliation.test.ts`, "DRAG-6.1: in a column of A, C and E, a drop beside A is drawn A, X, C, E before the request leaves, and the top and bottom bands send before A and after E", asserts for each of the three drops:<br>• the request sent: `{workphaseId: todo}` with `after A`, `before A` or `after E`;<br>• the order drawn as it leaves: A, X, C, E; X, A, C, E; or A, C, E, X;<br>• `X.position` untouched (9);<br>• the same order once the answer is applied.<br>The older "DRAG-6.1, TC-2.28: a top or bottom band drop is marked pending as the anchor it sends…" tells an anchor from a bare first slot (A, X, B, C). The surface "DRAG-6.1, DRAG-6.2: …" draws the bottom band on screen. Whole Then. The test is in the file already on the line, which stays as it is. |
| DRAG-6.2 (P0) | Automated (unchanged) | Its surface carrier's file changed | Its tests are unchanged, and confirmed as the reviewer read them. |
| DRAG-6.5 (P0) | Automated (unchanged) | Its old timed test was removed, and two tests carry it now | "DRAG-6.5, DRAG-6.7: a stale response without reindex pairs …" shows write 2's answer landing first (A unmarked, BAC, no load), then awaits write 1's: A stays in write 2's slot, B, A, C on screen and on the server. "DRAG-6.5: write 1's answer arriving before write 2's leaves the item in write 2's result" holds both answers with A pending, releases and awaits write 1's first, and ends at B, A, C and BAC. Both orders end in write 2's result. Whole Then. |
| DRAG-6.6 (P0) | Automated (unchanged) | Its test's file changed | The test is unchanged, and confirmed. |
| DRAG-6.17 | Retired (the Planner's pass) | Deleted from the catalog; its ID came off `ForcedStopCue.test.tsx` | No test or code carries it, by my search outside `docs/`, and the gate's `check:docs` had 0 hits. |
| DRAG-6.30 (P1) | Manual (unchanged) | "announcements" was removed from its text | The Planner set it, so I left it alone. No running test carries it. |
| TREE-5.3 (P1) | Automated (unchanged) | "exposed as disabled to assistive technology" was removed | Removing a clause can't lose coverage. `tests/ui/project-tree-create-cap.spec.ts` carries it and runs. |
| ATT-10.7 (P1) | Automated (unchanged) | The same clause was removed | Removing a clause can't lose coverage. `tests/ui/item-create-cap.spec.ts` carries it and runs. |
| ATT-10.9 (P1) | Open → **Automated** | The same clause was removed | The line is now `tests/ui/item-create-cap.spec.ts`, `client/src/components/ItemDetailPanel.test.tsx`. The surface test and the two internal tests cover the Then whole together, and Nathan approved the internal mapping. Each clause, and which test asserts it, is under Proposed Internal Mappings. |
| DRAG-2.22 (P1, 4f) | Open (unchanged) | It was open in every 4c reviewer pass | This range doesn't touch it. |

## Coverage Report Findings

- **Lost coverage:** none.
- **Manual cases a running test carries:** none.
- **Stale Automation lines:** none.
  - Each path I wrote names a file where a running test carries the case (the report's ID-to-files map).
  - DRAG-6.15's second path, `tests/ui/drag-7-hierarchy-modal.spec.ts`, carries it through "DRAG-7.23, DRAG-6.15: …".
  - ATT-10.9's two paths both carry it in running tests (the map's ATT-10.9 line).
- **Two statuses for one case:** none. Each of my 13 changes edited the table cell and the case's own line together.
- **Catalog fields not read:** none.

## Stamps Added

None. I edited no test file, so there's no title-only diff of mine to check.

ATT-10.9's approved mapping needed no stamp either. Both tests already start their own titles with the ID: "ATT-10.9: stays disabled at the cap when the read after the first reparent lands after the read after the second" and "ATT-10.9: ends the same when the two reads answer in the order they were sent", in `client/src/components/ItemDetailPanel.test.tsx`.

These ID changes in the range are the QA Engineer's and the Coder's, and are already in the green tree:
- `ForcedStopCue.test.tsx`: "DRAG-6.17: keeps an empty status element while no drag has been stopped, for assistive tech to announce into" became "draws nothing while no drag has been stopped". "DRAG-6.16, DRAG-6.17: says why in the status element when the cause is %s" became "DRAG-6.16: says why when the cause is %s". Both bodies changed too, following `ForcedStopCue.tsx`'s removal of the status element. Removing the retired ID is the Coder's living-docs handoff item.
- `itemWriteReconciliation.test.ts`: the new DRAG-6.1 test, stamped by the QA Engineer with Nathan's approval.

## Review Log Answers

**Phase 2 step 4, carried forward.**
- None of the declined internal mappings is proposed again.
- One declined mapping's test changed since: DRAG-6.26's, in `ForcedStopCue.test.tsx`, which now finds the banner by `data-forced-stop`.
- Forced-stop's tests cover DRAG-6.26 whole, so no internal test is mapped beside them (README), and the decline stands.

**Batch 4c entries.** The [4c report](test-reconciliation-story-10-batch-4c.md) answered them. Two stayed open in every pass:
- **DRAG-6.15 (Test gap):** resolved. The stop run covers each cause and each place, with Hierarchy's test adding a failed drop in the modal. DRAG-6.15 is `Automated`.
- **DRAG-2.22 (Test gap):** still open, and 4f's. This range doesn't touch it.

**Batch 4d, Stop 1: the desk's replies, with its corrections.** Each row is either asserted, or left unasserted for the reason given.
- **DRAG-6.7:** r1–r3 are asserted, except the with-pairs discard, which is 4j's.
- **DRAG-6.8:** r1–r4 are asserted. r5, the ghost during the re-drag, is DRAG-6.13's and correctly unasserted.
- **DRAG-6.9:** r1–r4 are asserted. For r3 the second move's anchor is read, and the Then leaves the side open.
- **DRAG-6.15:**
  - r1–r4 are asserted.
  - r5 (contradicts): the tests read the drag as over while "Loading board…" shows, which is the desk's reading.
  - r6 (contradicts: nine outcomes): the desk calls which pairs to run "a coverage judgment". Nathan made it: five cells (Amendments, 2026-11-13). Every clause is asserted for each cause and each place.
- **DRAG-6.16:** r1 (the full width, not stated) is correctly unasserted. r2–r5 are asserted, r4 on the five cells.
- **DRAG-6.17:** void. The case is retired.
- **DRAG-6.18–6.20:** every row is asserted.
- **DRAG-6.21:** r1–r4 are asserted. r5 is settled by Nathan's one-place ruling.
- **DRAG-6.22:** r1–r3's status-region parts went with the Planner's pass. Their banner and flash parts are asserted. r4 is asserted under DRAG-6.16.
- **DRAG-6.23:** r2 (contradicts: one tier per drag) is answered by the deferred variants, one drag each. r1 and r3 rest on the skipped test, all 4j's.
- **DRAG-6.24:** r1–r3 are asserted. r4's test is skipped.
- **DRAG-6.25 and DRAG-6.26, as corrected:** every row is asserted, r1′ and r4′ included. DRAG-6.26 r2 went with the Planner's pass.
- **DRAG-6.27:** every row is asserted. `F` is read from the app (r6).
- **DRAG-6.28:** r1–r4 are asserted. r5 is settled by Nathan's ruling.

**Batch 4d, Stop 2: the Test Reviewer's first pass.** I confirmed each closure in the current tests:
- **DRAG-6.1:** closed by the new Vitest test, which the reviewer hasn't seen (Other cases).
- **DRAG-6.5:** closed by the two held-answer tests. The timed test is retired.
- **DRAG-6.7:** held off, then deferred to 4j. It stays `Open`.
- **DRAG-6.16:**
  - "visible" is closed: `stopRun.ts::expectBannerSays` asserts `toBeVisible()`;
  - "replaced … during either transition" is closed: the recorder logs attribute, text and child changes, and the stop run asserts `changed()` is empty;
  - the top edge remains, so the case stays `Open`.
- **DRAG-6.21:** closed by the 12 fillers and `expectBelowFold`, checked before and after.
- **DRAG-6.22:** closed. The released and cancelled forms both run, six tests.
- **DRAG-6.23:** red, then skipped and deferred to 4j. `Open`.
- **DRAG-6.24 (case gap):** the drop-line test is skipped and the wording question deferred to 4j. `Open`.
- **DRAG-6.25:** closed by `dragReviewTowardFirst`.
- **DRAG-6.26:** closed by `expectBannerSays`.
- **DRAG-6.27:** all three gaps are closed: no replay straight after the cancel, X redrawn without the flash, and the window timed per cause.
- **DRAG-6.28:** closed. The saved place is compared across the opening, and `xRevealed` is scoped to P2's Card.
- **Corrections 1–7:** each is in the tests as described:
  1. `freezeClock` is `pauseAt(new Date())`, with no `install`;
  2. the column scene's stale setup moves A to the end, then above C;
  3. `treeScene` compares the saved position only where no reindex renumbers it;
  4. the collapsed place comes from the board's setting;
  5. the Stub goes back to the pickup point, with `8:0:true`;
  6. DRAG-6.9 polls the painted order;
  7. `seedPendingBoard` resets the database.
- **Proposed mappings:** the DRAG-6.5 mapping is stamped ("DRAG-6.5, DRAG-6.7: …"). The DRAG-6.22 internal carriers aren't needed.
- **Cost notes:** decided by Nathan (Amendments, 2026-11-13).

**Second pass.**
- The DRAG-6.22 released-only gap is closed, as the third pass found.
- Correction 8 is in the tests: `dragReviewTowardFirst` polls only the first painted column.
- The held-off DRAG-6.7 clause is 4j's.
- The reviewer's internal-test outline for it is not proposed, since Nathan deferred it.

**Third pass.** DRAG-6.22 is confirmed.

**What the reviewer hasn't seen** (Results):
- the two skips: DRAG-6.23 and DRAG-6.24 stay `Open`;
- DRAG-6.5's retired test, which bought nothing, by the reviewer's own note;
- the matrix cut to five cells, which I judged above for DRAG-6.15, 6.16 and 6.20;
- the DRAG-6.1 Vitest test, read above.

**Open questions.**
- **4d Stop 1, item 3 (the top edge):** DRAG-6.16 is held `Open`, as the item foresaw.
- **4d Stop 2:**
  - items 1–3 are 4j's;
  - item 4: DRAG-6.1's two gaps are closed, confirmed;
  - item 5: decided.
- **The standing entry, DRAG-6.5's response order:** resolved. The timed test is retired, and the two held-answer tests show which answer landed first before they assert the result.

## Proposed Internal Mappings (need approval)

None left to approve. The one this report proposed is approved and applied:

1. **ATT-10.9 onto `client/src/components/ItemDetailPanel.test.tsx`: approved by Nathan (2026-11-13), and applied.** The two tests are "ATT-10.9: stays disabled at the cap when the read after the first reparent lands after the read after the second" and "ATT-10.9: ends the same when the two reads answer in the order they were sent". I re-read them, and the surface test, before applying it. ATT-10.9 is now `Automated`, with the line `tests/ui/item-create-cap.spec.ts`, `client/src/components/ItemDetailPanel.test.tsx`. The approval covers this mapping only, not ATT-1.15, BCU-1.9 or BCU-1.10.

   Which test asserts each clause of the Then. "Surface" is `tests/ui/item-create-cap.spec.ts`, "ATT-10.9: a late shallow depth read cannot enable child creation after reparenting back to the cap". "First internal" and "second internal" are the two tests above.
   - **The Given:** CAP ≥ 3, and X, T and S at CAP, CAP − 1 and CAP − 2, read from the API; X in its Sheet with the control disabled, with the reason. Surface.
   - **The When:** X saved under S with its read held, then saved under T, the second read answering first. Surface, which awaits both reads in that order. First internal, which holds the first read as a promise.
   - **"The add-child control is drawn disabled, with hover reason exactly `At the depth cap (N levels)`" once the second read has answered.** Both: the surface test and the first internal test.
   - **The held answer lands, and the control stays disabled with the same reason.** The surface test asserts it after the stale read's response arrives. But nothing on the page changes when that answer is applied, so only the first internal test shows the state after it: it resolves the held read under `act`, then asserts the control is disabled, with the reason.
   - **X's saved parent remains T at depth CAP.** Surface: T polled from the server; a read writes nothing, and no write follows.
   - **"Takes no click or keyboard focus":** clicks in both. Keyboard focus in the first internal test only: `focus()` leaves it unfocused.
   - **No child-create input, and no create request:** both.
   - **"No child is created by either reparent or by applying either read":** surface (X has no children), and the first internal test (no create call).
   - **"If the Sheet remains open, this holds there":** both stay in the Sheet throughout.
   - **"Answering the reads in their original order ends with the same disabled control":** second internal only. It asserts the control disabled, with the reason, and no create.

## Proposed Manual (need approval)

None.

## Gaps

- **DRAG-6.7 (P1, Open, 4j):** the with-pairs discard and the pairs not being applied. No test exists, by Nathan's deferral. Its outline is in 4j and Open questions' 4d Stop 2 item 3.
- **DRAG-6.16 (P1, Open, 4j):** "along the window's top edge". 4j decides whether to assert it, wait for the UI message banners story's case, or move the clause in a Planner session.
- **DRAG-6.23 (P1, Open, 4j):** the whole case. The ghost test is skipped, and the three tier variants were never written.
  - For 4j: the skipped DRAG-6.24 drop-line test reaches the Mid tier's clause already. It reads F as `data-drop-tier="anchor"` and `data-pending="true"` during Z's drag. A Mid variant could start from that setup.
- **DRAG-6.24 (P1, Open, 4j):** the drop-line clause. Its test is skipped, and the "Mid Card or Stub" wording question is open.
- **ATT-10.9:** no longer a gap. It is `Automated` under the approved mapping.
  - Its archived plan, the Catalog Coverage Report story's, scheduled BCU-1.9, ATT-1.15 and BCU-1.10 with it.
  - They're outside this range, and the approval doesn't cover them, so I didn't judge them.
  - If that plan is their only Scope, they may be in no live Scope.
- **Not a gap against a Then, recorded for 4j:** the four skipped matrix cells (Test Quality Concern 1), and DRAG-6.22's two endings, which both run.

## Duplication

Reported, not judged.

- **DRAG-6.15:** the stop run, Hierarchy's "DRAG-7.23, DRAG-6.15", and `useBoardDnd.test.ts`'s "DRAG-6.15: ends an item drag that began while the save was in flight…".
- **DRAG-6.16, 6.18, 6.19, 6.20, 6.22, 6.26, 6.27:** the surface tests, alongside internal tests that carry the same IDs:
  - `ForcedStopCue.test.tsx` (DRAG-6.16, 6.19, 6.26);
  - `useForcedStop.test.ts` (DRAG-6.18, 6.19, 6.20, 6.22, 6.26, 6.27);
  - `useBoardDnd.test.ts` (DRAG-6.16, 6.22, 6.25, 6.26);
  - `dragChrome.test.tsx` (DRAG-6.20).
  None of them is mapped.
- **DRAG-6.18 and DRAG-6.26:** near-identical click-and-pickup tests, for an item's stop and a column's.
- **DRAG-6.19 and DRAG-6.26:** the same lifetime test, for an item's stop and a column's.
- **DRAG-6.21 and DRAG-6.28:** two tests carry both. DRAG-6.28's own two share their setups.
- **DRAG-6.1:** the surface bottom band, and two internal tests whose top and bottom bands overlap.
- **DRAG-6.5 and DRAG-6.7:** they share the no-pairs test.
- **DRAG-6.9:** the surface test, and `itemWriteReconciliation.test.ts`'s "DRAG-6.9: a response for a write whose placement has since been replaced…", which isn't mapped.
- **DRAG-6.7's resync:** the stop run's stale-response cells reach the same Given and the same resync as DRAG-6.7's with-pairs test, and carry other IDs.

## Test Quality Concerns

No test hard-codes today's output in place of the rule:
- the banner's sentences are spelled from the case, never imported;
- `T` is read from the seeded tuning, and `F` is the client's constant, which the case names as `F`;
- orders and saved places come from the cases' Givens and the server.

1. **The stop matrix runs five of nine cells** (DRAG-6.15, 6.16, 6.20).
   - A fault specific to one pair would go unseen, such as the section's or the modal's teardown under a failed column reorder.
   - Hierarchy's DRAG-7.23 test adds a failed drop in the modal. It reads no ghost rows, banner or flash.
   - I don't read this as a gap: each clause holds for each cause and in each place, and Nathan made the coverage judgment the desk left open.
   - 4j revisits it.
2. **DRAG-6.8's no-write release is the Board-layer "nowhere" (DRAG-1.9) only.** The When also cites DRAG-3.12's middle-band set-down in the item's own region.
   - I read the citations as defining "released where nothing is written", so one form proves it, as the desk (r2) and the reviewer did.
   - A middle-band variant would reach a second no-write release.
3. **DRAG-6.9's Given ("its ghost at the drag's current placement") isn't read before the answer.** The reviewer's hardening note stands. It can't pass wrongly, since only the ghost yields A, X, B, C.
4. **On the reloaded board, the stop run reads the banner's text, not its visibility:** `drag-forced-stop.spec.ts`'s `stopRun`, `toHaveText` after `read.release()`.
   - The recorder shows the banner was neither removed nor changed.
   - The DRAG-6.18 and DRAG-6.19 tests and the moved-X test assert it visible after the reload, but they don't carry DRAG-6.16.
   - DRAG-6.16 is `Open` anyway. If 4j adds a top-edge read, putting `expectBannerSays` there too would let "remains" stand on DRAG-6.16's own tests.
5. **`ForcedStopCue.test.tsx`'s "DRAG-6.19: times its fade to the cue time" pins the banner's animation duration to `cueMs`.**
   - The fade's painting is DRAG-6.30's, which DRAG-6.19's Then sets aside, so the ID claims more than the test shows of DRAG-6.19.
   - It isn't mapped, and it isn't a defect. The ID is live, so I can't remove it.
6. **The new DRAG-6.1 test builds the board's state from the marker `sendItemMove` recorded** (`withPlacement`), and reads `freeItemOrder` from it. Its expected orders and requests come from the Then. That is the approved request-and-reconciliation category, and the test isn't tautological.

## Uncatalogued Tests

Every Playwright test in the range carries an ID.

**For the coverage gate or the component's contract, with no standalone business rule. Don't map them:**
- `client/src/components/ForcedStopCue.test.tsx`, "draws nothing while no drag has been stopped": renamed from the retired DRAG-6.17 test. DRAG-6.22's no-banner rule is proved at the surface.
- `client/src/components/ForcedStopCue.test.tsx`, "words the two causes differently, each in its own sentence": changed to find the banner by `data-forced-stop`.

**Genuine scenarios:** none.

## Candidate New Cases

None from the tests.

- One note, already in Open questions as "Noted, no question": after a stop's reload, every Card's section returns to the board's "Show attached children by default".
- The collapsed-place tests rely on it by turning the setting off, and assert it as setup only.
- No wiki sentence says whether a reload keeps a section collapsed by hand. If Nathan wants that settled, it's a Product Owner gap.

## Totals

The coverage report's totals, with this run's changes applied: `Open` → `Automated`, 13 cases, all P1:
- 12 in 4d's scope: DRAG-6.8, 6.9, 6.15, 6.18, 6.19, 6.20, 6.21, 6.22, 6.25, 6.26, 6.27 and 6.28;
- ATT-10.9, under the approved mapping.

No case went the other way.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| P0       |       139 |    8 |      0 |       1 |          0 |   148 |
| P1       |       191 |   52 |      6 |       0 |          0 |   249 |
| P2       |        72 |   11 |      4 |       1 |          2 |    90 |
| Total    |       402 |   71 |     10 |       2 |          2 |   487 |

**4d's own count:** 12 of its 16 cases close. By kind:
- New: 9 of 11 (DRAG-6.8, 6.9, 6.15, 6.18, 6.21, 6.22, 6.25, 6.27, 6.28). DRAG-6.7 and 6.16 are 4j's.
- Split: 3 of 5 (DRAG-6.19, 6.20, 6.26). DRAG-6.23 and 6.24 are 4j's.

4j now holds five `Open` cases: DRAG-6.7, 6.16, 6.23, 6.24 and DRAG-7.18. 4i still holds DRAG-3.16, 5.3 and 5.10.

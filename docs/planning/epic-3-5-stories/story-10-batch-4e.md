# Epic 3.5 Story 10 — batch 4e. DRAG-8

**Type:** story plan, one batch of Story 10 · **Written:** 2026-11-13, moved from [Story 10's batch doc](story-10-batches.md), whose standing rules and four stops govern it · **Status:** Closed at Stop 4 on 2026-11-15, awaiting Nathan's review and commit: 11 of the 12 cases are `Automated`, and DRAG-8.10 is deferred and stays `Open`. The tree stayed frozen, D2's ten repeats were clean (110 of 110), the final suite passed on its untouched rerun (493 passed) after one connection reset that Nathan took as a one-off for 4i, and the gate is green. Nothing is committed

This file is the batch's plan. It holds the batch's cases, its Proof list, its suggested variants, its Results packet, its Open questions and its Review log, and the Reconciler reads it at the batch's close. A session for this batch reads root `AGENTS.md`, its persona, the batch doc's standing rules and stops, this file, and the cases and wiki sections in scope. It doesn't read the other batches' files or [the 4a to 4d log](story-10-batch-4a-4d-log.md).

## The batch

Moved word for word from the batch doc. "Above" and "below" in it refer to that doc as it stood before the split.

### 4e. DRAG-8

**Specs:** a new spec, since DRAG-8 has none.

| Kind  | Cases                                                         |
| ----- | ------------------------------------------------------------- |
| New   | DRAG-8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12 |
| Split | DRAG-8.2                                                      |

- **One setup for most of them:** the five-row branch with its Free-linked rows. Observe the branch's absence in the lists themselves; `data-carried-branch` identifies the carried copy's count line, not its hidden descendants. Read its counts as text.
- **DRAG-8.7** uses the cause helper.
- **DRAG-8.10** measures its boxes with `boxOf`, and proves the line lets the pointer through by hovering a row it covers.

## Test Planner handoff

**Scope:** ATT-1.16, added on 2026-11-16 from the PO's D1/D2 handoff, in [ATT-1 — Free / Attached state model](../../test-plans/item-attachment/att-1-free-attached-state.md). The rule belongs to wiki item-attachment §12, which already owns the Card's collapsible list. One new P1 case covers explicit collapsed and expanded choices after moves to another column or sub-row, a board reload from a column editor's save with no drag active, both directions of the default-setting change for set and unset lists, and the page-reload reset. DRAG-8.1, DRAG-8.6, DRAG-8.7 and DRAG-1.33 need no rewording. Switching boards remains the wiki's Open question and gets no assertion.

**Status:** the Planner's catalog handoff is applied. Nathan reported §12's marker cleared on 2026-11-16; the Planner confirmed the unmarked passage and changed ATT-1.16 to `Open`, with Automation `—`. The existing frozen DRAG-8 results cover their original scope; no automation assessment of ATT-1.16 is made here.

**Next owner:** the QA Engineer takes ATT-1.16's Then for automation assessment and any proposed mappings of the Coder's three unstamped tests; internal coverage needs Nathan's approval. The PO and Planner handoffs are complete. No layer, test file or mapping is chosen by this Planner pass. The matching candidate entry in Drag Automation Deferrals is resolved to this scoped case.

**Validation:** `npm.cmd run check:docs` passes (458 files, 0 hits); `git diff --check` passes for the three edited docs. App and test source were neither read nor edited, and no app test was run in this Planner pass.

## Proof list

**Scope:** DRAG-8.1 through DRAG-8.12, all currently `Open`, from the [current catalog](../../test-plans/board-drag-interaction/drag-8-carried-branch.md). Each row below proposes one Playwright UI test in `tests/ui/drag-8-carried-branch.spec.ts`, with named variants inside `test.step` loops. These are proposed titles, not authored tests or coverage claims. No new Vitest test or internal mapping is proposed.

**Authority:** read the current Then first, then the [baseline reconciliation's DRAG-8 rows](../../audits/test-reconciliation-story-10-baseline.md#drag-8). Its existing approved internal tests prove parts of the cases, but none of the twelve has whole surface coverage. Its residual tilt and count-line-height obligations are superseded by the Planner's current wording: tilt and the line turning with it belong to DRAG-1.27; the line's own height is excluded from DRAG-8.10 and recorded in [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md). Neither is an assertion below.

### One test per case

The observations column is the remaining proof, not an instruction to reproduce an internal implementation. Every test first confirms its setup: saved hierarchy, the rows/overflow its shown levels expose, the section preference, and any pending preview/held answer it needs. Expected IDs, counts, relations and outcomes come from the Then and its cited wiki. Tuning and the depth cap are read by name, not pinned to today's numbers.

| Case / proposed test title | Layer and named variants | Remaining observations |
| --- | --- | --- |
| DRAG-8.1: keeps the attached branch absent through every layer switch and restores the list preference | Surface gesture. Stub pickup in section and modal; Free Card pickup with expanded and collapsed list preference. Each origin exercises the gap/pop/zoom/modal changes its paragraph names; finish by cancelling. | All five branch descendants absent wherever that list could draw them, including static section content under the modal backdrop; unrelated rows retained. Free pickup leaves its section without the five rows; switching layers never brings them back. At the end the Card retains its prior preference. A collapsed list is checked collapsed, then opened explicitly to inspect its restored branch. |
| DRAG-8.2: leaves Free-linked rows outside the carried branch with their own tiers and counts | Surface gesture. Card and Stub origins; popping, zooming and modal opening within each journey. | F and D remain Cards with Mid assigned; F1 and D1 remain their Stubs with Low assigned. None is hidden with the attached branch or counted. The copy says `+ 2 children, 5 total descendants` throughout. Assert tier attributes, not painted opacity. Keep the modal destination unrelated to F and D so their sections remain the classified lists being observed. |
| DRAG-8.3: holds the pending tree's four-row branch from pickup through both answers | Surface gesture with two earlier answers held. Preview C attached to X and B detached while its parent remains X; pick up X before either answer; let the answers land separately in one order. | Before pickup confirm both pending previews and the held responses. At pickup, after each answer and through layer switches, A/A1/A1a/C are absent with `+ 2 children, 4 total descendants`; B and B1 remain outside the branch. Observe snapshot outcomes rather than synthesize contradictory responses or add a response-order matrix. Desk r1 accepted; r2 deferred. |
| DRAG-8.4: collapses only the carried branch's space and adds one ghost on zoom | Surface gesture and screen measurements. One full-five-row Stub witness followed by Z, plus the Free Card pickup and zoom into Q witness. | Measure the full branch's occupied extent/spacing before pickup and Z's rise afterward; ghost then Z with no branch-sized blank, no branch candidates, named neighbor directly beside the ghost. Card copies are shortCards with no extra branch reservation; Q gains one Stub-sized ghost and no branch rows. The Planner assigns overflow removal to DRAG-7.27; no reduced-level witness is part of this case. P1 is closed. |
| DRAG-8.5: restores the branch at Q's preview before the drop answer | Surface gesture with the successful drop answer held. One drop as Q's last attached child; inspect its limited section and then open its modal before releasing the answer. | At release X and the branch are already at Q: A then B under X, A1 under A, A1a under A1 and B1 under B. The old location has none. Copy/line are gone. The section shows its allowed levels/overflow; the modal shows the complete tree while the same answer is held. Accept the real answer, then confirm the saved last-child relation and the same drawn tree. |
| DRAG-8.6: cancels to the pickup tree or the earlier pending preview without a drag write | Surface gesture. Free Card expanded/different-gap cancel; Free Card collapsed/other-Card cancel; Stub earlier-pending re-drag/changed-gap cancel. This covering set is the desk's accepted r1. | No additional drag write; pickup placement and branch restored at once within shown levels; copy/line gone. Preserve both named preferences. The pending witness restores the captured earlier ordinal preview and retains its pending marker while that answer remains held. |
| DRAG-8.7: restores the reloaded branch under Q when a resync stops the drag | Surface gesture using one genuine failed-item-drop resync. Destination states: expanded section, already-open modal, collapsed section with modal closed. During the drag, move X under Q on the server and add attached leaf C. | Pickup confirms the old parent and five-row branch. Reload ends the drag, removes copy/line and shows X under Q with the six reloaded descendants, including C absent from the pickup snapshot. Release sends no drag write. The section limits levels/uses overflow; an open modal shows every level; collapsed/closed views stay closed until explicitly opened for inspection. No banner, lifetime, flash or cause matrix is added. Desk r1/r3 accepted; r2 deferred. |
| DRAG-8.8: reads every attached count including hidden levels on the carried copy | Surface gesture. The six named tree rows as both Card and Stub pickups (12 count witnesses), plus the named `sectionLevels + 1` chain picked up from a limited section and continued into its modal. | Assert the six exact strings/absences from the case's table, never from `carriedBranchLabel`. Only-Free children yield no line even with their own attached descendants. For the chain, Y equals the returned sectionLevels plus one; its last row is initially hidden, its count includes that row, opening the modal changes neither count, and X is excluded from the descendant total. Other table rows need no extra layer tour. |
| DRAG-8.9: keeps the same count line on the carried copy through every form switch | Surface gesture. Free Card journey through shortCard, section Stub, modal Stub, expanded sub-row shortCard, Board and section again; Stub section and modal pickup journeys pop to the column and return to a section. | At every named switch the copy alone has `+ 2 children, 5 total descendants`; its ghost never has a line. Read the actual copy's form attribute as well as the text. No tilt/rotation assertion. Desk r1/r2 accepted: no second complete Free Card tour solely to repeat its shortCard form in a plain column. |
| DRAG-8.10: leaves the drag box unchanged and lets the pointer reach beneath the count line | Surface gesture and screen measurements. Otherwise equal branch/no-branch setups in Stub and shortCard forms; section, plain column and expanded sub-row overlap contexts; section and sub-row bottom bounds. | Compare copy/ghost fixed heights to the same measured row/shortCard reference and to each other with/without branch, equal band reservations, named neighbors and clamps for equal pointer positions/list geometry. Observe line overlap with the named next row/Card/gap. Actually aim at the covered rows and gaps and observe the resulting target/placement, rather than only reading CSS pointer-events. At each named bottom bound the box reaches its normal edge and the line may extend beyond it. Do not measure the line's own height or rotation. Desk r2 rejected one-context top-overlap sampling, so both column and sub-row are included. |
| DRAG-8.11: sets the branch down at its pickup gap without a new write | Surface gesture. Section and modal pickups returned to their own gap/depth; include an earlier-pending pickup in the modal witness. | Ordinary witness: unchanged saved P and p, branch back at once, copy/line gone, no write from pickup through release. Pending witness: no additional write, captured earlier preview/marker retained while its answer is held; do not invent a numeric position for the preview. Desk r1 accepted this pending observation. |
| DRAG-8.12: rejects an over-cap set-down and restores the pickup branch | Surface gesture. Ordinary section pickup and earlier-pending modal pickup, each reaching a state whose deepest carried descendant exceeds the board's reported cap. Desk r1 accepted this covering set. | First confirm the original fields or earlier preview, subtree height and reachable over-cap state. Release sends no additional write; original parent/attachment/position or earlier pending preview/marker survive. Branch returns immediately within section levels or completely in the open modal, with none at the invalid preview. Copy/line disappear. Validity is read as a state, not judged from its colour. |

### Cost decisions for Nathan

**Nathan approved all seven Keep recommendations on 2026-11-13**, with the Planner's P1 resolution reflected in C6. Runtime and stability remain unmeasured. The three questions are: **Q1** which clause each wait/precise step buys; **Q2** what failure it detects that a cheaper test would miss; **Q3** whether the precision is in the Then or just the proposed test. A decision changes the proof layer or scope only through its owner; it never silently drops a Then clause.

| Decision / clauses | Signal | Q1: what the steps buy | Q2: cheaper evidence | Q3: precision source | Recommendation |
| --- | --- | --- | --- | --- | --- |
| C1 — 8.1, 8.2, 8.9: membership/tiers/line across named layer switches | More than two clocks and repeated journeys | Each pop/zoom/modal wait reaches a layer expressly named by the case; each observation checks absence, retained unrelated rows, tiers or copy-only line there. | Existing supplied-state units cannot detect branch/line reappearance on a real switch. A duplicate journey through an equivalent form buys no additional clause. | Named layers/origins are in the Then; no exact hold duration or cursor immobility is required. | **Keep**, using one journey per required origin, the accepted covering sets and state-based waits from returned tuning. No full origin-by-transition matrix. |
| C2 — 8.3: two pending writes and answers during a later drag | Complicated setup and held-response sequencing | Two preparatory surface moves create the two pending previews; explicit gates keep answers held until the pickup and observations exist. Releasing each gate establishes its mid-drag landing. | A saved-state fixture cannot establish a client pending preview; branch-selector units alone miss its integration with the live drag. | The Then names both pending writes and both arriving responses. It names no order matrix or wall-clock deadline. | **Keep** one gated sequence. Use real successful answers, not duration delays; compare the observable four IDs/counts at each boundary. |
| C3 — 8.5, 8.6, 8.11, 8.12: before-answer restoration and earlier pending previews | Held answers, additional setup gestures, several endings | A held answer proves the before-response clause. Earlier-pending witnesses need one real earlier preview; no-write counts bracket only the new gesture. Each ending restores the case's own placement/marker. | Settled-only checks miss a temporary disappearance or lost earlier preview. The existing supplied-session component tests do not exercise the actual ending. | Before-answer, earlier pending and the named endings are in the Then; response races and extra order permutations are not. | **Keep**, with the named displays/preferences covered once each, explicit answer gates and the desk's covering sets. No ending-by-origin-by-response-order product. |
| C4 — 8.7: reloaded membership/location and hidden destination | Earlier failure plus live drag, reload and multiple display states | The held cause makes the real resync land during X's drag. The new C proves the reloaded membership replaces the pickup snapshot. Three states check limited, full and unrevealed display. | A supplied stop/session cannot prove a real reload restores the new tree. The cue and cause matrix already have their own tests. | Parent, membership and display states are in the Then; three causes and cue timing are not. | **Keep** one existing cause across the three display states. Reuse its helper; add no cue or reconciliation hardening. |
| C5 — 8.8: count table and hidden chain | Repeated pickups across a named table | Each table pickup buys exactly its named text/absence; only the chain needs the additional modal transition. | Wording/branch units already prove arithmetic portions, but miss whether the board's actual Card/Stub copy receives the right branch. | The six trees, both pickup forms and hidden-chain count are named. No all-layers tour for each table row is named. | **Keep** the bounded table loop and one chain/modal witness, with setup seeded directly. Do not extend each row into a transition matrix. |
| C6 — 8.4: occupied branch space, neighbor and one-row zoom reservation | Exact geometry | Before/after extents and sibling adjacency prove the branch space actually collapses; zoom proves one ghost reservation. | Hidden IDs alone cannot detect a leftover blank reservation or a wrong named neighbor. | Row extent/spacing, adjacent neighbor and one ghost are explicit layout/placement clauses. Animation trajectory is excluded. | **Keep** the full-row and Free Card witnesses with measured references. Overflow removal belongs to DRAG-7.27; the Planner removed it from this Then, so there is no second depth setup or held overflow sub-variant. |
| C7 — 8.10: equal boxes/bands/bounds, overlap and pointer-through | Paired setups, precise geometry and covered-target aiming | Measurements isolate the line's effect on the measured box, reservation, neighbor and clamp. Pointer aims test that the visibly covered rows/gaps still work. Both bottom contexts buy their named bound clause. | Component style tests do not show whether collision/target selection still works through the overlay. CSS pointer-events alone would not establish reachability. | Equal geometry, both forms, named contexts and bounds are in the Then. Line height, tilt and exact painted styling are excluded. | **Keep** paired surface journeys with stable measured aims through the existing gesture helpers. No guessed pixel constants, copied drag arithmetic or line-height assertion. A second aim/timing correction stops this test for re-weighing. |

C1–C7 and the four-file Stop 2 list are approved. If a surface clause is later held off, first obtain the Test Reviewer's internal-coverage verdict and Nathan's approval; no internal test is pre-authorized by these Keep decisions. A Manual recommendation needs Nathan and its catalog owner. Questions routed to another owner also offer deferral and leaving the behavior as shipped with no rule.

### Fixtures, observations and proposed Stop 2 files

- **Fixture:** seed P, X, A/A1/A1a, B/B1, unrelated destination Q and unrelated visible siblings, adding F/F1 and D/D1 only where needed. Use `resetAndSeedDb`, `seedBoardFixture`/the seed helpers and `ProjectSidebarPage.ts::openBoard`. Seed parents before children and use anchor intent for ordering. API setup verifies saved fields; browser observations verify the displayed Given. The section-level variants and the cap are read from `seedDragTuning` and `fetchBoard`, respectively. No new database pin route is needed for this plan.
- **Reachability:** retain an unrelated overflow-bearing branch in the destination so a hold can open its modal even while X's entire branch is absent. Seed that branch before pickup; it is not part of X's count. For the full-five-row 8.4 witness, show enough levels; for 8.8's hidden chain, prove the last row is beyond the returned shown-level limit. Over-cap setups start legal and use the reported cap to choose an invalid tab state; no invalid API seed is proposed.
- **Observations:** `data-carried-branch` locates only the count line. Read actual live rows through `itemRow`/`rowIds` and painted order through `paintedItemIds`/`placementShown`; read static backdrop rows by their unique title text inside the source Card because static rows have no `data-item-id`. An unrendered-at-this-depth row's absence alone proves nothing: assert the relevant Given, unrelated rows and modal contents. Read form/tier/pending/invalid attributes independently of paint. After an ending, prove both copy and line gone.
- **Geometry and requests:** all aims/measurements use `dragGesture.ts` and the existing surface helpers. Compare measured references rather than import a computed expected placement. `watchWrites`, `holdNextWrite`, `settledWrites` and successful-answer observations supply request counts and answer gates. The successful hold reaches the server before its answer is released, so a pending branch is checked against the client preview, not assumed to be the database's old state. Release/dispose all holds even on assertion failure. Reuse `holdForcedStopCause` for 8.7.
- **Known Coder dependencies:** none identified in this read-only feasibility pass. Existing hooks expose count line, copy form, row IDs, tiers, pending state, invalid state, projection and drop side. Stop 2 may discover a missing observation or defect; that gets a handoff, not an app edit. The title-based static-row observation needs no new hook proposed now.

| Proposed file | Work allowed only when Nathan opens Stop 2 |
| --- | --- |
| `tests/ui/drag-8-carried-branch.spec.ts` (new) | The twelve case tests and their case-specific seed/observation routines; reuse existing helpers. Keep routines local unless a second caller requires sharing. |
| `tests/helpers/boardLocators.ts` | Add a shared count-line locator and, if necessary, a clearly documented locator for static section content. No behavior change to existing locators. |
| `tests/helpers/dragGesture.ts` (conditional) | A measured aim/state wait only if an existing gesture cannot express a required action. Report the exact proposed helper before changing it if this conditional file is not included in Nathan's list. |
| This batch file | Current Results packet, questions, decisions and append-only desk/reviewer log. |

Nathan approved these four files with “you may use those files”. Everything else is read-only in Stop 2, including existing specs, app source, seed/request/cause helpers, config, wiki and catalog. If infrastructure changes, run `/code-review` at `medium` on those changes before that stop's check-in. Ignored run logs and temporary snapshot indexes are execution artifacts.

## Suggested variants

Nathan approved these for later consideration on 2026-11-13. They get no test and move to [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) at the batch's close:

- **DRAG-8.3:** both answer orders as a separate matrix; the Then names arriving answers, not an order matrix, and out-of-order reconciliation is built and frozen (desk r2).
- **DRAG-8.7:** all three resync causes crossed with destination display states; the Then requires the branch-restoration result for a resync, not a cause matrix (desk r2).

No other new variant is proposed. Required column/sub-row overlap in DRAG-8.10 is in the proof list, not deferred. The already-routed count-line-height question stays at its existing destination; it is not added here as another variant.

## Results

**Current packet: batch 4e, closed at Stop 4 (frozen validation and closure), 2026-11-15, awaiting Nathan's review and commit.** The tree stayed frozen through D2's ten repeats (110 of 110), the final full E2E run, its untouched rerun and the gate. The Reconciler ran once and set 11 of the 12 cases `Automated`: DRAG-8.1 to 8.9, 8.11 and 8.12, each by the new Playwright test alone. DRAG-8.10 stays `Open`, since its test is skipped under Nathan's deferral. Nathan took F1, the final run's one connection reset in a batch 4d test, as a one-off to record in 4i, with nothing skipped. I made no app, test, helper or wiki change in this stop, and the catalog changed only by the Reconciler's status and Automation fields.

- **Trees.** Entry tree `ce7265596facc8a860110aa3313f9c03ee06b726`, the Planner's edits included. **Frozen tree: `c9d2e20d81bdf14781b25030ba69125b066a695c`**, taken at the start of Stop 4, with tests subtree `36c10d6eb5d68db91f29e8d1fa156c0c2b2430a3`, client subtree `2607a55dd4cb7386c9f879b0c51871f4063bc3c9` and server subtree `e5280bcd2eee9c80948fda9364585ef512693c3e`. The repeats, both full runs and the gate ran on it, and its subtrees were the same after the rerun. The real index is untouched. **Last review trees:** `4a8c720c091db11faea51f9269bc8046e9418e91` for the further confirming pass on 8.10's third correction and 8.8's Simplify, after which only 8.10's skip and its comment changed in the tests; and `04f93ab634e9f33998185cc5a4d86ea88e8ba6a1` for the one on 8.1, 8.6 and 8.7, after which one line of 8.6 changed (the pending-Stub poll), which Nathan accepted on its runs with no review.
- **The Coder's return, checked.** Its report lists D1 and D2 fixed in app source: `client/src/components/workflow/CardExpansionContext.ts` (new), `BoardView.tsx`, `KanbanCard.tsx`, `BandGuides.tsx` (a comment only) and `KanbanCard.test.tsx`. The working tree matches that list: nothing under `server/` changed, and the Coder touched nothing under `tests/`. I couldn't reproduce its end-tree id `0274ad122b0a8656db75bd5f383500ed3b4463a7` (it reconstructed its start tree, `cbdf3a5d48805ca18550afcda89039effb73e997`), so I rely on the diff scope and my own runs. Its full E2E run at no retries gave 493 passed, 28 skipped and 1 failed, the failure being DRAG-8.10 at T1. That is batch 4d's close (482 passed, 28 skipped) plus this spec's 12 tests, so the skips didn't move; 4d's close already had 28. Its `/code-review` at medium found five findings and acted on none; they are its to report. It flags one behavior: a Card whose list the user hasn't set keeps the setting as the board last loaded it, until the board reloads. Wiki item-attachment §12 words the rule as "from the board's next load".
- **Approved files:** `tests/ui/drag-8-carried-branch.spec.ts` (new), `tests/helpers/boardLocators.ts`, `tests/helpers/dragGesture.ts` only if needed, and this batch file, on Nathan's “you may use those files”. This session changed only the spec and this plan. `boardLocators.ts` and `dragGesture.ts` are as they were.
- **Next owner/action:** Nathan's review and commit; the Reconciler's report is `docs/audits/test-reconciliation-story-10-batch-4e.md`. The PO's marker is cleared and the Planner's ATT-1.16 handoff is complete on 2026-11-16. ATT-1.16 is `Open` for the QA Engineer's automation assessment, as scoped in Test Planner handoff above. 4f is next in order and doesn't start here.

| Case | State at close | Remaining work |
| --- | --- | --- |
| DRAG-8.1 to 8.9, 8.11 and 8.12 | `Automated`, each by its one test in `tests/ui/drag-8-carried-branch.spec.ts`: reviewed, clean in D2's ten repeats and green in the final suite | None |
| DRAG-8.10 | `Open`. Authored, with three corrections; its test is skipped on Nathan's deferral (T2) | In Drag Automation Deferrals. A skipped test never counts |

**Stop 4: the freeze and the runs.**

- **Stamps.** All twelve Playwright titles carry their IDs: a title check of the new spec finds none without a `DRAG-8.<n>:` prefix. The Coder changed no DRAG-1.33 title, and no Vitest mapping is proposed, so none is stamped. `check:docs` passes (458 files, 0 hits).
- **The frozen selection.** `tests/ui/drag-8-carried-branch.spec.ts`: 12 listed, 11 runnable and 1 skipped (DRAG-8.10), with 38 named variants (`tests/output/batch4e-stop4-selection-list.txt`). The count is each runnable test's named steps, and one for a test with none.
- **D2's ten repeats,** five workers, no retries (`tests/output/batch4e-stop4-d2-repeat10.json`): 110 runs of the 11 runnable tests, **110 passed, 0 failed, 0 flaky**, in 235 s. The ten runs of DRAG-8.10 are the deferral's skips. Per-test means at five workers: 8.1 16.1 s, 8.2 7.7, 8.3 7.4, 8.4 5.2, 8.5 3.2, 8.6 9.3, 8.7 11.0, 8.8 13.2, 8.9 18.4, 8.11 7.0, 8.12 7.2.
- **The final full E2E run** (`tests/output/batch4e-final-full-e2e.json`): 492 passed, 29 skipped, **1 failed**, 0 flaky, no retries, in 271 s. The skips are batch 4d's close's 28 plus DRAG-8.10. The failure is `DRAG-6.15, DRAG-6.16, DRAG-6.20: a failed item drop stops an item drag in a column` (`tests/ui/drag-forced-stop.spec.ts`, batch 4d's): `apiRequestContext.post: read ECONNRESET` on `POST /api/projects` in `seedProject`, 0.14 s into the test and before any gesture, on worker 1, 0.04 s after DRAG-8.9 ended there. F1 has it.
- **That test alone,** 20 repeats at five workers (`tests/output/batch4e-stop4-6-15-alone-repeat20.json`): 20 passed.
- **The final run, rerun untouched on the same tree** (`tests/output/batch4e-final-full-e2e-rerun.json`): **493 passed, 29 skipped, 0 failed, 0 flaky**, no retries, in 271 s. The tree and its tests, client and server subtrees were the same afterward.
- **The root gate on the frozen tree** (`tests/output/batch4e-stop4-gate.log`): **exit 0**, 444 server, 1,110 client and 327 scripts tests, `check:docs` 458 files with 0 hits.
- **`npm run report:catalog` on the frozen tree** (`tests/output/batch4e-stop4-report-catalog.txt`): lost coverage, `Manual` cases a running test carries, stale Automation lines, status mismatches and unread fields all "none". 487 cases: 402 `Automated`, 71 `Open`, 10 `Manual`, 2 `Planned`, 2 `Pending PO`. No DRAG-8 case is `Automated` yet, since the Reconciler writes that.
- **The Reconciler** ran once, with no follow-up (`docs/audits/test-reconciliation-story-10-batch-4e.md`). It set DRAG-8.1 to 8.9, 8.11 and 8.12 `Automated`, each Automation line naming `tests/ui/drag-8-carried-branch.spec.ts` only, and left DRAG-8.10 `Open`. It added no stamp and removed no ID, found no coverage-report finding to act on, proposed no mapping or `Manual`, and answered every Review log verdict. It confirmed 8.6's last fix itself, since that fix had no review. Afterward the tests, client, server and scripts subtrees were unchanged from the frozen tree, and only four docs differed from it: its report, the catalog's DRAG-8 file, the deferrals doc and this plan.
- **After the Reconciler:** `npm run report:catalog` (`tests/output/batch4e-stop4-after-report-catalog.txt`) is clean in all five sections, with 413 `Automated`, 60 `Open`, 10 `Manual`, 2 `Planned` and 2 `Pending PO` of 487 (P1: 202, 41, 6, 0, 0). The root gate again exits 0 (`tests/output/batch4e-stop4-after-gate.log`): 444 server, 1,110 client and 327 scripts tests, `check:docs` 458 files with 0 hits.

**Close-out.**

- **Cases closed, by kind:** 11, by surface Playwright tests alone (DRAG-8.1 to 8.9, 8.11 and 8.12). None by an internal test or as `Manual`. DRAG-8.10 stays `Open`.
- **Authored and run:** 12 Playwright tests in one new spec of 1,105 lines, 11 running with 38 named variants and 1 skipped. D2 gave 110 passes, and the final suite 493 passed with 29 skipped. The file runs in about 112 s at five workers.
- **Helpers:** one shared change, a five-line `carriedBranchLine` locator in `tests/helpers/boardLocators.ts`. The rest stays in the spec (`seedCase`, `seedCountTable`, `caseTuning`, `openCase`, `begin`, `expectLine`, `expectForms`, `expectEndedAt`, `visitQ` and others). `dragGesture.ts` is unchanged.
- **Coder handoffs:** one, for D1 and D2 (a Card's list stays as the user set it), after the PO's ruling in wiki item-attachment §12: `CardExpansionContext.ts` (new), `BoardView.tsx`, `KanbanCard.tsx`, `BandGuides.tsx` (a comment) and `KanbanCard.test.tsx`.
- **Cost:** the Test Reviewer ran one full pass and three confirming passes, one of them on the Coder's Vitest change. 8.10 took three corrections and 8.1 two. 8.8's Simplify cut its time alone from 18.9 s to 12.1 s. The deferral skipped one test, and F1's reset cost one full-suite rerun.
- **What remains:** DRAG-8.10, `Open` in Drag Automation Deferrals; ATT-1.16, `Open` for the QA Engineer's automation assessment after §12's marker clearance; the 8.4 changed-depth note and the connection-reset entry, both in Drag Automation Deferrals (D1, the keep-alive fix, would settle the reset's cause). 4e's two suggested variants moved there too.

**Review and cost.** The first full review proves 8.3, 8.5 and 8.8 and names nine test gaps. One confirming pass closed the six gaps submitted (8.2, 8.4, 8.9, 8.10, 8.11, 8.12), with no regressions. After the Coder's return, a second confirming pass took the four gaps held for the red tests (8.1, 8.6 twice, 8.7). It closed three and found the pending-Stub half of 8.6's changed-gap check still open, because the poll proved X left its pickup placement and not its pickup gap. It found no regression. I made the fix it named: the poll now waits for X directly above Z, the section's first gap. That fix passes alone and in the file; Nathan accepted it on its runs (R-8.6), so it has had no further review. A separate confirming pass accepted the Coder's setup-only change to DRAG-1.33's three Vitest tests, with no regression. A further confirming pass, limited to 8.10's third correction and 8.8's Simplify, accepted both with no regression. The eleven Keep verdicts agree with Nathan's approved recommendations. **8.8 was Simplify, and Nathan approved it on 2026-11-15:** the table's twelve pickups now share one seeded board for each origin, and all twelve pickups and the hidden-chain/modal witness stay. Alone it takes 12.1 s, from 18.9 s.

**Correction ledger.** All before/after changes were supplied to the reviewer without reasons; its acceptances are in the Review log. These counts describe false-failure corrections, not reviewer additions of missing assertions.

| Test | Corrections and disposition |
| --- | --- |
| 8.1 | 2: first, expanded Card root pickup → exact title. Second, the movement that was meant to change gaps (`ghost.y + 10`) → `aimBefore` the named row W, after the reviewer's new changed-gap assertion failed because the placement never left X's own gap. Branch-absence and preference assertions retained; green alone and in file. Second correction: stop work on the aim, with the three questions below. |
| 8.8 | 1: request attached-list expansion only when an attached branch exists, not for only-Free children. All count assertions retained; green. Then, on Nathan's cost decision (not a correction), the count table's twelve pickups moved to one seeded board per origin; every assertion is retained and the reviewer accepted it. |
| 8.9 | 1: modal-exit aim inside Q's Card instead of the entire column region. All form/count assertions retained; green. |
| 8.4 | 1: return to pickup point instead of leaning the copy out of its own slot. Z/before and geometry assertions retained; green. The later changed-depth/exclusion checks close its review gap. |
| 8.6 / 8.11 | 1 each: await delivery of the held successful answer before disposing/resetting the next fixture. Pending/no-write assertions retained. Both green. 8.6 also gained the reviewer's added changed-gap and restoration assertions, which aren't corrections. |
| 8.7 | 0. It gained the five parent-relation checks, which aren't a correction. Green. |
| 8.12 | 2: first, aim at W1 rather than W2 and fix answer cleanup; second, replace the extra W1-parent pin with the desk-confirmed observed absolute-depth/cap proof. All invalid-state/no-write/restoration clauses retained. Green; no third correction. Review additions strengthen restoration only. |
| 8.10 | 3: first, compare actual limiting endpoints instead of an extra outer-group zero-inset rule (desk-confirmed); second, reach Board by aiming into Review instead of above the origin list. Fixed sizes, bounds, neighbors, reservations, overlap and pointer assertions remain. It waited for an origin-column top carve zone that is absent. Stop at T1. **Third, authorized by Nathan on 2026-11-15:** read the reservation from the Done column's band, which the pointer isn't over, in place of the origin column's top and bottom zones. The origin list holds the ghost, which stands in for its bands. The reviewer accepted it, and the equality across the two setups is unchanged. T1 is cleared; the test then stops at T2. Nathan deferred the case on 2026-11-15, and its test is skipped, with no fourth change. |

**8.1's second correction, weighed.** Q1: the aim before W and the poll for a changed placement buy the Then's "They stay absent while the drag changes gaps": absence is now read at a gap that the screen shows is not the pickup's. Q2: the old movement never left X's gap, so a branch redrawn on a gap change would have gone unseen; a pickup-only check misses that clause too. Q3: "changes gaps" is in the Then, and the neighbor W is the test's choice, aimed with the spec's existing `aimBefore`, with no new pixel constant or duration. Recommendation: **Keep**, with no further aim correction. The reviewer's cost verdict for 8.1 was Keep, asking for no finer aiming, and `aimBefore` adds none.

**T1 re-weighing after correction 2.** Q1: Board entry and carve-zone reads buy the Then's equal band-reservation clause; the paired measurements and target aims buy its box/bound/neighbor/pointer clauses. Q2: supplied-state structural tests do not prove the real pointer route and render integration; reading a marker in the wrong region adds no proof. Q3: equal reservations and named contexts are in the Then, the particular origin-region locator is not. Recommend one explicitly authorized, targeted correction to observe the reservation in an appropriate non-hovered target list, followed by a specifically authorized third confirming review of that change; otherwise hold/defer the unproved case/clause. No internal test or mapping is pre-approved. This is an automation observation problem, not an established app defect. **After the Coder's return,** 8.10 failed at the same step, alone and in the file's run (spec line 162, `boxOf` waiting for `[data-carve-zone="top"]`), so the app change didn't move it. **Nathan approved that recommendation on 2026-11-15, and the third correction cleared T1** (the ledger above). 8.10 then completes the section and column setups for both shapes, including the equal-reservation comparison, and stops at T2.

**T2, the failure after the third correction.** In the sub-row context, the no-branch step fails its bottom-edge assertion, `expect(Math.abs(clamped.y + clamped.height - bound.y - bound.height)).toBeLessThanOrEqual(2)`, at spec line 151: received 4.75. It fails the same way alone (`tests/output/batch4e-stop2s-t1-alone-10.json`) and in the file's run (`tests/output/batch4e-stop2s-full-file.json`). The failing step has no branch, so the line isn't the cause. The sub-row's five-row step comes after it and hasn't run. The assertion is one the test has had since it was written; no earlier run reached the sub-row, because T1 stopped it first. Open questions, T2, has the diagnosis and the options. Nathan deferred the case on 2026-11-15, and its test is skipped.

**Validation/evidence.**

- **Coder-return reruns, tests unchanged:** `tests/output/batch4e-stop2r-alone-ledger.txt`. 8.1, 8.6 and 8.7 each passed 1/1 with their assertions exactly as they were red (`batch4e-stop2r-alone-1.json`, `-6.json`, `-7.json`). 8.10 failed at T1 (`batch4e-stop2r-alone-10.json`).
- **After the review-gap assertions:** `tests/output/batch4e-stop2r-gaps-alone-ledger.txt`. 8.6 and 8.7 passed. 8.1 failed at its new changed-gap assertion (`batch4e-stop2r-gaps-alone-1.json`: the placement stayed `{parentId: null, prevId: null, nextId: Z}`). After the aim correction it passed alone (`batch4e-stop2r-gaps-alone-1b.json`).
- **8.6's last fix:** passed alone (`batch4e-stop2r-gaps-alone-6b.json`).
- **Nathan's decisions, 2026-11-15:** 8.10 with its third correction, alone: `tests/output/batch4e-stop2s-t1-alone-10.json`, failed at spec line 151 (T2) after passing the section and column setups for both shapes. 8.8 after the Simplify, alone: `tests/output/batch4e-stop2s-simplify-alone-8.json`, passed in 12.1 s (18.9 s before, `batch4e-stop2-alone-8.json`), each of the twelve table steps taking about 0.6 to 0.7 s. The whole file with `openCase`'s tuning moved into `caseTuning`: `tests/output/batch4e-stop2s-full-file.json`, 11 passed, 1 failed (8.10 at T2), 0 skipped, 0 flaky, no retries, 124 s. The root gate on the final code: `tests/output/batch4e-stop2s-gate.log` with `.exit.txt`, **exit 0**, 444 server, 1,110 client and 327 scripts tests, `check:docs` 458 files with 0 hits. These runs are the new spec only, not the full E2E suite.
- **After the deferral, 2026-11-15:** 8.10 is skipped and nothing else in the tests changed. The whole file: `tests/output/batch4e-stop2t-full-file.json`, 11 passed, 0 failed, 1 skipped, 0 flaky, no retries, 112 s. The root gate: `tests/output/batch4e-stop2t-gate.log` with `.exit.txt`, **exit 0**, 444 server, 1,110 client and 327 scripts tests, `check:docs` 458 files with 0 hits. `tests/output/batch4e-stop2s-full-file.json` stays as the last run with 8.10 live, and it failed at T2.
- **Whole file:** `tests/output/batch4e-stop2r-full-file.json` after the assertions (11 passed, 1 failed at 8.10, 0 skipped, 0 flaky, no retries, 203 s), and `tests/output/batch4e-stop2r-full-file-2.json` after 8.6's last fix (the same, 203 s). The ledger is `tests/output/batch4e-stop2r-final-ledger.txt`. These are the new spec only, not the full E2E suite.
- **Root gate:** `tests/output/batch4e-stop2r-gate.log` (before 8.6's last fix) and `tests/output/batch4e-stop2r-gate2.log` with `.exit.txt` (the final code): **exit 0 both times**. 444 server, 1,110 client and 327 scripts tests pass. `check:docs` covered 458 files with 0 hits. Types, lint and formatting pass.
- **Infrastructure self-check:** this session changed no helper, fixture, page object or config, only the new spec, which the Test Reviewer covers, so no `/code-review` ran. The earlier self-check stands: medium, limited to the five-line `boardLocators.ts` addition, with no correctness or cleanup findings. The literal `/code-review` invocation was unavailable in that session's harness, so that record is a manual self-check.
- **Stop 2 evidence, kept:** startup attempts `tests/output/batch4e-stop2-first-journey.json` (a webServer startup failure, 0 tests) and `batch4e-stop2-membership-counts-a1.log` (a Windows command-shim regex failure, no tests); neither is a test correction. Early authored runs `first-journey-a1.json`, `first-journey-a2.json`, `membership-counts-a2.json`, `counts-switches-a3.json`, `layout-preview-a1.json`, `pending-endings-a1.json`, `endings-resync-a2.json`, `over-cap-a3.json`, `line-geometry-a1.json` and `line-geometry-a2.json`, all under `tests/output/batch4e-stop2-`, with matching `.log`/`.exit.txt`. Individual ledgers `batch4e-stop2-alone-ledger.json` (8/8) and `batch4e-stop2-confirmed-alone-ledger.json` (5/5). `batch4e-stop2-review-fixes-a1.json` (5 passed, 1 timed out at 8.10). The pre-return full new-spec run `batch4e-stop2-full-file.json`: 8 passed, 3 failed (8.1/8.6/8.7), 1 timed out (8.10), 240.5 s, with the failed traces and contexts preserved as `batch4e-stop2-full-file-DRAG-8-<number>-trace.zip`/`-context.md`. The D1/D2 evidence: `first-journey-a2-trace.zip`/`-context.md` for 8.1, and `endings-resync-a2-DRAG-8-6-…`/`-DRAG-8-7-…` for 8.6/8.7. The Stop 2 root gate `batch4e-stop2-gate.log`: exit 0, 457 files checked.
- **Unrun:** nothing Stop 4 names. The catalog's DRAG-8 statuses are the Reconciler's, as above. No internal mapping is proposed.

## Open questions

**P1 — Closed by the Planner, 2026-11-13.** Answer: the overflow clause is DRAG-7.27's, not DRAG-8.4's. The Planner removed the overflow sentence from DRAG-8.4's Then and added a closing ownership pointer; the five drawn rows have no overflow row in this setup. The Given, layout/neighbor clauses and Rule field are unchanged. DRAG-7.27 remains Automated and carries overflow removal. The proposed reduced-level witness and C6's held overflow sub-variant are removed. DRAG-8.4 is one full-five-row witness plus the Free Card zoom witness, with nothing waiting on P1. The return is recorded verbatim below; the desk entry that read the older Then stays as history, not an open verdict on the revised case.

**Stop 2 authorization:** Nathan approved the four proposed files. The Keep decisions and suggested deferrals are approved. No remaining case, rule or look/feel question precedes authoring.

**D1 — Fixed by the Coder, 2026-11-15, and checked. DRAG-8.1 lost the user's collapsed preference after cancellation.** The unchanged test passes now, alone and in the file (`tests/output/batch4e-stop2r-alone-1.json`). What follows is the Stop 2 report, kept as history. Case clause: “The Card's own list returns collapsed or expanded as the user set it when the drag ends; the pickup does not change that preference” (wiki board-drag-interaction §1.1). Reproducer: `npm run test:e2e -- tests/ui/drag-8-carried-branch.spec.ts --grep "DRAG-8\.1:" --trace on`, final `card, collapsed` step. The Given proves X's children are collapsed. Pick X up by its title, zoom into Q, open Q's hierarchy modal, then cancel. Expected: X still offers Show attached children, with its list collapsed. Observed: X offers Hide attached children and draws A/A1/A1a/B/B1. The preceding branch-absence observations pass. No expected value is changed. Evidence: first-journey-a2 JSON and preserved trace/context in Results. Diagnosis looked at the Card's local expansion state and its remount across forms; no fix is prescribed. Options: **fix the app** while retaining the assertion (recommended), **defer it** with the case/clause named, or **leave it as shipped, with no rule**, for Nathan/the PO/Planner to align before changing any test. No app source is changed here.

**D1 also reached DRAG-8.6, and is fixed there too (the unchanged test passes, `tests/output/batch4e-stop2r-alone-6.json`):** its first two variants (expanded Card and earlier-pending Stub) complete after answer-cleanup correction 1; its final collapsed-Card cancel adds all five branch rows to the captured collapsed tree. The same no-preference-change clause fails. Keep the row-order and preference assertions intact. Evidence: `tests/output/batch4e-stop2-endings-resync-a2-DRAG-8-6-trace.zip` and matching context.

**D2 — Fixed by the Coder, 2026-11-15, and checked. DRAG-8.7's reload expanded the collapsed destination section.** The unchanged test passes now (`tests/output/batch4e-stop2r-alone-7.json`). What follows is the Stop 2 report, kept as history. Case clause: “the stop does not expand a collapsed section or open a closed modal to reveal the branch” (wiki board-drag-interaction §7.2, §10). Reproducer: `npm run test:e2e -- tests/ui/drag-8-carried-branch.spec.ts --grep "DRAG-8\.7:" --trace on`, `collapsed section` step. Q is explicitly collapsed; an earlier failed drop is held, X is picked up, and the server moves X under Q and adds C before that real resync lands. Expected: Q stays collapsed and its modal closed until the user opens them. Observed: the reloaded Q offers Hide attached children instead of Show attached children. Expanded-section and open-modal witnesses complete, showing the reloaded six-row branch at Q and no interrupted write. Evidence: ending-resync-a2 JSON and `tests/output/batch4e-stop2-endings-resync-a2-DRAG-8-7-trace.zip`/`-context.md`. Options: **fix the app** while retaining the no-reveal assertion (recommended), **defer it** by clause/case ID, or **leave it as shipped, with no rule**, for Nathan/the PO/Planner to align. No cue or recovery rule is added, and no app fix is prescribed.

**D1 and D2 — ruled by the PO, 2026-11-15, on the Architect's rule.** The wiki now states it, as Planned: a Card's list of Stubs stays as the user set it after a move and through the board's own reloads, and the board's "Show attached children by default" setting only starts a list the user hasn't set (item-attachment §12, with pointers from board-drag-interaction §1.1 and §10). So "leave it as shipped, with no rule" is gone for both, and the Coder fixes the app; the assertions stay as written. DRAG-8.1's, DRAG-8.6's and DRAG-8.7's Thens already read right under it, and need no rewording. For a Planner session: the rule is not asserted by any case for a move to another column, for a reload no drag caused (a column or workphase editor's save), or for the setting's change leaving a set list alone; the PO recommends one case of its own, whose place the Planner decides. The PO clears the Planned marker once the build lands.

**T1 — Cleared on 2026-11-15, by the third correction Nathan approved. DRAG-8.10 stopped after two corrections.** The second correction reaches Board, but the test times out waiting for `[data-carve-zone="top"]` in the origin column during its no-branch witness. Both section witnesses complete; the remaining column/sub-row comparisons are authored but have not completed. The failure is in observing the band reservation, not evidence that the app violates the branch-line rule. The complete expected size/bound/neighbor/overlap/pointer assertions remain. Results answers the three cost questions and preserves the trace. Recommendation: **authorize one targeted third test correction**, to observe reservation in an appropriate non-hovered target list, **and a third confirming review limited to that correction**, since this test has already had its full and confirming passes. Alternatives: hold the clause off for an internal-coverage verdict/mapping with Nathan's approval, or defer the case/clause to Drag Automation Deferrals. No third correction, timeout increase, skip, internal test or mapping is made here. **After the Coder's return (2026-11-15):** the test failed at the same step, alone and in the file's run (`tests/output/batch4e-stop2r-alone-10.json`, `tests/output/batch4e-stop2r-full-file-2.json`), so the app change didn't move it. It is still Nathan's call. **Nathan approved the recommended correction and a review limited to it on 2026-11-15.** The test now reads the reservation from the Done column's band, the reviewer accepted it, and the test passes its section and column setups, then stops at T2.

**T2 — Deferred by Nathan on 2026-11-15, to [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md); DRAG-8.10's test is skipped. DRAG-8.10's sub-row box ended 4.75 px short of the sub-row's bottom edge.** Clause: “At a section's or sub-row's last row, bounding the copy's box at the bottom edge leaves its line able to hang past that edge. The bound does not move the box upward to fit the line.” Reproducer: `npm run test:e2e -- tests/ui/drag-8-carried-branch.spec.ts --grep "DRAG-8\.10:" --trace on`, step `sub-row, none`, which has no branch, so the line plays no part. Expected by the test: with the pointer pushed past the sub-row's bottom edge, the carried box's bottom is within 2 px of the sub-row region's bottom. Observed: 4.75 px short (`tests/output/batch4e-stop2s-t1-alone-10.json`). The section's last row passes the same check, and the column setups' horizontal checks pass. Where I looked: `client/src/components/workflow/AGENTS.md` says the clamp reads the width drawn and “never dnd-kit's measured one, which for a tilted shortCard is its bounding width”. A sub-row's copy is a tilted shortCard, so the clamp may hold the tilted copy's bounding rect inside the edge and leave the measured box a few px inside it. That is a reading of the code, not a measurement, and it isn't a finding. The 2 px tolerance is the test's: the case says “at the bottom edge” with no figure. What the case does state needs no tolerance, and the file already asserts it: the carried box reaches the same bound with and without the branch (`expect(endpoint).toBeCloseTo(priorEndpoint, 0)`), and with the branch the line hangs past the edge. Not reached: the sub-row's five-row step, which runs after this one. Options: **(1)** a fourth correction to the test, which needs Nathan since three already stand: replace the 2 px reach with the clause's own facts (the box ends at or inside the edge, and with the branch the line extends past it), keep the equal-endpoint comparison, and have a review limited to that change (recommended: it matches the Then and costs one edit); **(2)** a rule question for the PO, whether a tilted copy's bound is its painted bounds or its measured box (wiki board-drag-interaction §2 says only “the context's own extent”), with **defer it** and **leave it as shipped, with no rule** among its answers; **(3)** hold the sub-row's bottom-edge clause off and defer it to Drag Automation Deferrals, leaving the section's identical clause asserted. No fourth correction or tolerance change was made. Nathan took the deferral, option (3) widened to the whole case, on 2026-11-15: DRAG-8.10 is deferred and its test skipped, with its body untouched. The deferrals doc's entry holds the facts for whoever picks it up.

**R-cost-8.8 — Done on Nathan's decision, 2026-11-15: the Simplify is applied and a confirming pass accepts it.** The twelve table pickups share one seeded board per origin, and nothing was dropped. As first recorded, the Test Reviewer recommended Simplify. The count-table test is green and proves its case, but takes about 19 seconds and repeats full reset/project/workflow/board seeding and navigation for each named tree/form. Recommend sharing a board fixture while retaining all twelve table pickups plus the hidden-chain/modal witness. Choose to simplify now or keep the current isolation and route the suggestion to Drag Automation Deferrals at the close. The test stays as it is until Nathan decides. No case clause or variant is dropped.

**R-8.6 — Accepted by Nathan on 2026-11-15, on its runs and with no further review.** The confirming pass left one half of 8.6's changed-gap check open: its pending-Stub poll proved only that X left its pickup placement, where the clause needs its pickup gap. The fix is the reviewer's own named form: the poll now waits for X directly above Z, the section's first gap, which offers one state. 8.6 passes alone and in the file's full run. A third pass over the same test waits for Nathan. Options: **accept it on its runs**, with no further pass (recommended, since the form is the reviewer's and the change is one assertion); **one third pass limited to that line**; or **leave it for the Reconciler** at the batch's close. Nothing else in 8.6 is open.

**Post-Coder QA authoring handoff: done on 2026-11-15.** The original red 8.1/8.6/8.7 tests passed unchanged on the Coder's return. Their first-review gaps are closed by added assertions: 8.1 observes a changed gap before its layer switches (its aim took a second correction, in Results), 8.6 observes a changed gap or foreign preview before each cancel and checks the pending restoration's indents, parents and preview, and 8.7 checks all five reloaded parent relations in the modal. The one half of 8.6's gap the confirming pass left open is R-8.6.

**For a Planner session, with the PO's ruling above: the Coder's three unstamped Vitest tests** for wiki item-attachment §12's rule (a list stays as the user set it when a Card is drawn again, a list the user hasn't set starts from the setting, and a change of the setting leaves a set list alone) carry no case ID, because no case asserts the rule yet. They map to no case until a Planner session writes one, and an internal mapping needs Nathan's approval.

**Planner return, 2026-11-16:** the two Planner requests above are applied as ATT-1.16, with `Next ID` advanced to ATT-1.17. Its place, scope and remaining owners are in Test Planner handoff. The case is `Planned` until the PO clears §12's marker. No test is read, stamped or mapped by this pass; the three reported tests still have no mapping. This resolves the catalog-writing request, with marker clearance and automation assessment still outstanding.

**Marker-clearance follow-up, 2026-11-16:** Nathan reported the marker cleared; the Planner confirmed §12's list-preference passage is unmarked and set ATT-1.16 to `Open` in its summary and case. Automation stays `—`. The PO and Planner handoffs are complete, and automation assessment is the QA Engineer's next action.

**F1 — Resolved by Nathan on 2026-11-15: option (A), a one-off recorded in 4i with nothing skipped. The final run's one failure was a connection reset in another batch's test.** `DRAG-6.15, DRAG-6.16, DRAG-6.20: a failed item drop stops an item drag in a column` (batch 4d's, in `tests/ui/drag-forced-stop.spec.ts`) failed in the first final full run with `apiRequestContext.post: read ECONNRESET` on the `POST /api/projects` of its setup, 0.14 s into the test, before any gesture (`tests/output/batch4e-final-full-e2e.json`). It isn't one of 4e's tests, and nothing in the tree changed. The facts: it passed 20 of 20 alone at five workers (`tests/output/batch4e-stop4-6-15-alone-repeat20.json`), and the untouched rerun of the whole suite passed (`tests/output/batch4e-final-full-e2e-rerun.json`, 493 passed). The signature is the [flake investigation](../../audits/story-10-drag-flake-investigation.md)'s cause D: the first request of a test, 0.1 s in, on a worker whose previous test ran long with its API calls at its start. Here that was DRAG-8.9, 19.8 s, which ended 0.04 s before. The mechanism there is a keep-alive connection the server closes after 5 s idle. D1, a one-line Coder change giving the server a longer keep-alive timeout, would remove it, and D1 hasn't landed (`server/src/index.ts` sets no keep-alive timeout). The long tests 4e adds may raise how often a following test meets an idle connection, and I haven't measured that. The same signature put DRAG-3.16 and DRAG-5.3 in the 4i catalog, where D2 skipped both. Options: **(A) a one-off, recorded in 4i, with nothing skipped (recommended).** The failure isn't about this test, and the rerun is the green run. Skipping it wouldn't lower the reset's rate, since the next run's reset would land on another test, and D1 is the fix. This also leaves D1 undone, which is the deferral. The same session then spawns the Reconciler on this tree, and 4i's record names cause D and D1. **(B) skip it under D2,** as for DRAG-3.16 and DRAG-5.3: the test predates this batch, so D2 skips it and records it in 4i. That changes a test, so the freeze restarts with a new tree, a full suite and the gate, and then the Reconciler. DRAG-6.15, 6.16 and 6.20 keep their other carriers, and the Reconciler would judge whether losing the failed-drop column cell leaves them whole. **(C) land D1 first,** in a Coder session before this stop closes, and rerun, so the rate is measured with the cause removed. Nathan chose (A): the failure is recorded in [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md)'s 4i catalog, no test is skipped, and the Reconciler runs on the frozen tree and the green rerun.

## Review log

The QA Engineer appends the desk's questions and replies (each quoting the Then it read), every Test Reviewer verdict and Nathan's declined mappings here, word for word. Results may be replaced; these entries may not. At the close the Reconciler answers each open verdict from the tests.

### Stop 1 — desk questions, 2026-11-13

The desk ran read-only from the catalog, wiki and its definition, without the QA Engineer's code-reading context. Questions and replies below are verbatim; relative links inside replies are relative to the catalog files it read. Its rejected 8.10 sampling row is replaced by both named top-overlap contexts in the proof list; its silent 8.4 row is P1. No Test Reviewer verdict or internal mapping is requested at this stop.

**Initial questions:**

DRAG-8.3:
r1. Hold the two earlier successful write answers. At X pickup assert the four held branch rows A,A1,A1a,C absent, exact + 2 children, 4 total descendants text, B as a Free Card and B1 in its section. Release each answer separately during this drag and assert the same membership/count after each and through section/column/zoom/modal switches. These are the observable snapshot assertions; do not inject answers that contradict the accepted writes just to demonstrate whether an implementation recomputed a set.
r2. Add a separate response-order matrix for those two answers, despite no particular order named by the Then.

DRAG-8.7:
r1. During X's drag, change the server tree so X is under Q and a new attached leaf C joins X, then let one genuine resync land. Verify X and the six reloaded descendants, including C absent from the pickup snapshot, at Q; copy/line gone and releasing sends no drag write. This is one concrete witness of membership following the reloaded tree.
r2. Repeat this branch-restoration case for all three resync causes. The When names a resync, without listing its causes; the clause is proved with one cause.
r3. Cover an expanded destination section, an already-open destination modal, and a collapsed destination section with its modal closed. The collapsed/closed variant asserts neither opens automatically, then opens by user action to check the reloaded branch. These are the named display states, not a cross-product of causes and states.

DRAG-8.9:
r1. For the Free Card's column or expanded sub-row alternative, one journey through an expanded sub-row, then Board and back into a section, supplies the column/sub-row form-switch observation, without a second complete journey in a plain column solely for that alternative.
r2. Stub section and modal pickups each start with the line; each pops to the column and returns to a section with the line only on the copy. The former tilt assertion is omitted because the revised case assigns it to DRAG-1.27.

DRAG-8.10:
r1. In the otherwise equal branch/no-branch setups, compare fixed measured copy and ghost heights in Stub and shortCard forms against the same row/shortCard reference; compare band reservation, named neighbor and bound. Observe where the count line overlaps the next row/Card/gap and that underlying rows/gaps can actually receive the drag. Do not assert the count line's own height or rotation.
r2. Read 'column or sub-row' as one context representative for the top-of-next-Card/gap overlap, but cover both the section and sub-row last-row bounds because the Then explicitly names both bottom-bound contexts. If that representative reading is insufficient, identify the precise clause requiring both top-overlap contexts.

DRAG-8.11:
r1. For an earlier pending move, capture its preview slot and pending marker before the re-drag. Set X down at that pickup gap/depth and assert no additional write, the earlier preview and pending marker retained; only the non-pending variant asserts original saved P,p. Do not equate the preview's ordinal slot with a newly invented numeric position.

**Additional questions in the same task:**

One more reading question in the same task, to keep the named variants bounded. DRAG-8.6 r1: cover a Free Card with its list expanded and one collapsed (different-gap and other-Card cancel, respectively), plus a Stub re-drag of an earlier pending move cancelled at a changed gap; these witnesses cover Card/Stub, changed gap/another Card, both user preferences, and earlier-preview/pending restoration without multiplying every combination. DRAG-8.12 r1: cover an over-cap release in a section on an ordinary pickup and in a modal on an earlier-pending pickup; both assert the appropriate restored placement, branch, zero additional write and copy/line removal, the pending one also its marker. Do these covering sets follow the Then whole, or does a clause require a full cross-product? Please quote each additional Then whole and judge each row in the same form.

**Desk reply:**

**DRAG-8.3**

> the branch is `A`, `A1`, `A1a` and `C`. Those four rows are absent, and the line reads "+ 2 children, 4 total descendants". Free Card `B` and its attached Stub `B1` stay drawn outside the branch. The saved attachment flags awaiting their responses do not determine the branch.
>
> the same four rows stay excluded and the line keeps those counts, through every layer switch. The branch's membership and counts remain the pickup snapshot until the drag ends, rather than being recomputed when a write lands. A reload instead stops the drag, as in [DRAG-8.7](drag-8-carried-branch.md).

- r1. **Follows the Then:** “Those four rows are absent,” “Free Card `B` and its attached Stub `B1` stay drawn outside the branch,” and “the same four rows stay excluded and the line keeps those counts, through every layer switch.” Wiki board-drag-interaction §7.2 reads the branch from the drawn tree including pending writes; wiki hierarchy-placement §8 holds that branch from pickup until the drag ends. The requested observations assert those outcomes without requiring contradictory write answers.
- r2. **Ruled out of the MVP:** a separate response-order matrix adds a variant the Then does not name, under “Drag automation beyond one test per case”; “Out-of-order write reconciliation” is also built and frozen in the deferrals catalog.

**DRAG-8.7**

> the drag ends, its release writes nothing, and the carried copy and line disappear. `X` and its attached descendants are drawn where the reloaded board has them, under `Q`, not restored to the pickup parent or the drag's uncommitted preview. The branch's membership follows the reloaded tree, not the held pickup snapshot. Expanded sections draw their shown levels and overflow rows, and a modal that remains open draws every level; the stop does not expand a collapsed section or open a closed modal to reveal the branch.

- r1. **Follows the Then:** “The branch's membership follows the reloaded tree, not the held pickup snapshot” supports including newly attached `C` with the five existing descendants under `Q`; “the drag ends, its release writes nothing, and the carried copy and line disappear” supplies the remaining observations. Wiki board-drag-interaction §7.2 restores the branch where the reloaded board has it, and §10 defines the mid-drag reload as ending the drag.
- r2. **Ruled out of the MVP:** repeating the case for all three resync causes adds variants the Then does not name, under “Drag automation beyond one test per case.” Wiki board-drag-interaction §10 identifies the possible causes; this Then claims the branch-restoration outcome when a resync lands, without requiring a cause matrix.
- r3. **Follows the Then:** “Expanded sections draw their shown levels and overflow rows, and a modal that remains open draws every level; the stop does not expand a collapsed section or open a closed modal to reveal the branch.” Wiki board-drag-interaction §9 defines section limits, overflow rows and the open modal's complete hierarchy. These named display states require their observations; no clause requires crossing each with every resync cause.

**DRAG-8.9**

> its shortCard carried copy shows "+ 2 children, 5 total descendants", and its shortCard ghost has no line. *When* `X` zooms into a section and enters its hierarchy modal, *then* the carried Stub copy keeps that text and the Stub ghost has none. *When* it pops back out to the column or expanded sub-row and out to Board, *then* the shortCard copy still has that text and the ghost still has none. Zooming back into a section keeps the same line.
>
> its carried Stub copy has the line from pickup, while its ghost has none. Popping to the column and zooming back into a section preserves the line on the carried copy alone, with the same counts throughout.
>
> The shortCard copy's tilt, and the line turning with it, are checked in [DRAG-1.27](drag-1-contexts-and-popping.md).

- r1. **Follows the Then:** “it pops back out to the column or expanded sub-row and out to Board” followed by “the shortCard copy still has that text and the ghost still has none,” and “Zooming back into a section keeps the same line.” Wiki board-drag-interaction §5a defines both Column/sub-row and Board copies as shortCards. The expanded-sub-row journey supplies the named form switches; no clause requires a second complete journey through a plain column solely to repeat that form observation.
- r2. **Follows the Then:** “its carried Stub copy has the line from pickup, while its ghost has none” and “Popping to the column and zooming back into a section preserves the line on the carried copy alone, with the same counts throughout.” Wiki board-drag-interaction §§5a and 7.3 define the Stub form and modal pickup. The quoted closing sentence assigns tilt and the line turning with it to DRAG-1.27.

**DRAG-8.10**

> its measured box and its ghost are one fixed Stub-row height. In shortCard form, each measured box and ghost is shortCard's fixed height. The branch line hangs below the carried box and adds no height to it or the ghost. With equal pointer positions and list geometry, the bands reserve the same space, the side highlight chooses the same ghost neighbor, and the carried box reaches the same bound in both setups.
>
> in a section it covers the row directly below the ghost; in a column or sub-row it covers the top of the Card below the ghost and the gap above that Card. It takes no pointer: rows and gaps beneath it remain reachable by the drag, and the line itself is no target. At a section's or sub-row's last row, bounding the copy's box at the bottom edge leaves its line able to hang past that edge. The bound does not move the box upward to fit the line. The line's height, typography, fill and animation are not assertions of this case.

- r1. **Follows the Then:** “one fixed Stub-row height,” “shortCard's fixed height,” “the bands reserve the same space, the side highlight chooses the same ghost neighbor, and the carried box reaches the same bound,” and “rows and gaps beneath it remain reachable by the drag.” Wiki board-drag-interaction §5a defines the fixed boxes and excludes the line from their measurements; §5 derives reservation from shortCard height and gap; §2 defines the neighbor and bound. The line's own height and rotation need no assertion here.
- r2. **Contradicts the Then:** the precise top-overlap clause is “in a column or sub-row it covers the top of the Card below the ghost and the gap above that Card.” It names both top-overlap contexts, just as “At a section's or sub-row's last row” names both bottom-bound contexts. The catalog README requires covering each variant the Then names; one top-overlap context leaves the other named context unasserted.

**DRAG-8.11**

> no request is sent, `X.parentId = P` and `X.position = p` remain unchanged, and the branch is drawn under `X` again at once. The carried copy and count line disappear. If an earlier move of `X` is still pending, this set-down restores that move's preview and pending marker; it does not revert to the older saved placement.

- r1. **Follows the Then:** “If an earlier move of `X` is still pending, this set-down restores that move's preview and pending marker; it does not revert to the older saved placement.” Wiki board-drag-interaction §10 defines the preview as ordinal, with “no position value invented for it,” and retains the earlier pending marker when the re-drag writes nothing. Wiki hierarchy-placement §5 and board-drag-interaction §7.1 define the pickup-gap-and-depth set-down as writing nothing. The pending witness compares against its captured preview; the ordinary witness asserts unchanged saved `P,p`.

**DRAG-8.6**

> no drag write is sent, `X` returns to its pickup placement and the branch is drawn beneath it again at once, within each list's shown levels. The carried copy and its count line disappear. The Card's list keeps the user's collapsed or expanded preference. If the pickup was a re-drag of an earlier pending move, the restored placement is that earlier preview, with its pending marker retained while its write remains in flight.

- r1. **Follows the Then:** “`X` returns to its pickup placement,” “The Card's list keeps the user's collapsed or expanded preference,” and “the restored placement is that earlier preview, with its pending marker retained while its write remains in flight.” Wiki board-drag-interaction §1.1 defines preservation of the user's list preference, §7.2 restores the branch on cancellation, and §10 defines pending-preview restoration. The covering set supplies the stated witnesses; no clause requires a full cross-product.

**DRAG-8.12**

> no request is sent. `X` returns to its pickup placement with its original parent, attachment and position; its branch is drawn there again at once, within the section's shown levels or at every level in an open modal. The invalid preview receives none of the branch, and the carried copy and line disappear. If the pickup placement was an earlier pending preview, that preview and its pending marker are restored while its write remains in flight.

- r1. **Follows the Then:** “within the section's shown levels or at every level in an open modal” names the two restoration displays, and “If the pickup placement was an earlier pending preview, that preview and its pending marker are restored” supplies the pending witness. Both witnesses retain “no request,” branch restoration away from the invalid preview, and copy/line removal. Wiki hierarchy-placement §6 and board-drag-interaction §7.2 define the over-cap release as committing nothing; §10 defines pending-preview restoration. No clause requires ordinary and pending pickups in both display contexts.

**DRAG-8.4 question, continued with the same desk:**

Continue this same desk task for the DRAG-8.4 row sent just before your final reply; it was not in the reply. Read only that case and its cited wiki and give its full Then plus one row verdict: r1. Its first Given has all five actual branch rows drawn, needing enough section levels; that witness proves Z's rise and ghost adjacency. Also cover the conditional 'Any overflow row owned by X or its branch leaves too' using the same five-descendant tree with fewer shown levels, asserting the overflow's existence before pickup and absence afterward, while leaving the five-actual-row height assertion to the full-depth witness. Is this a valid named conditional variant of the case, or does the literal five-rows-drawn Given leave the overflow clause needing a Planner session? No code, tests or helper reading; no edits.

**Desk reply:**

**DRAG-8.4**

> those five rows leave and `Z` moves up by the height they occupied, including their row spacing. Any overflow row owned by `X` or its branch leaves too ([DRAG-7.27](drag-7-overflow-and-hierarchy-modal.md)). With the ghost in `X`'s own slot, `Z` is directly below it; no blank branch-sized space remains. The gap and depth choices still exclude the entire dragged subtree, and a named neighbor is the row directly beside the ghost ([DRAG-4.8](drag-4-attach-and-stub-placement.md)).
>
> its copies are shortCards and leave its Stubs out, with no additional branch-sized reservation. *When* `X` zooms into unrelated Card `Q`'s section, *then* it adds exactly one Stub-sized ghost row there, with none of its five descendant rows below it. This case asserts layout and placement, not how the collapse moves.

- r1. **The case is silent, so it needs a session:** the Then reads two ways. “Any overflow row owned by `X` or its branch leaves too” names a conditional outcome, but the Stub Given requires “its five branch rows drawn between it and next sibling `Z`.” The proposed fewer-levels witness changes that explicit Given. Wiki board-drag-interaction §7.2 states that owned overflow rows leave with the branch, but does not settle whether this case's conditional authorizes a separate setup in which some of those five rows are hidden. The full-depth witness follows the row-collapse clauses; whether the reduced-depth witness belongs to this case needs a session.

### Stop 1 — Planner return and Nathan's decisions, 2026-11-13

**Planner return, relayed by Nathan (verbatim):**

I read P1 as a case gap, and I fixed it a different way from the QA Engineer's recommendation. I didn't add a reduced-depth witness to DRAG-8.4. `check:docs` passes.

**Why a separate witness isn't needed.** The overflow rule is already DRAG-7.27's. DRAG-7.27 is `Automated` from 4c and covers it three ways:

- A dragged `R` has no overflow row for the whole drag.
- Picking up `Q` removes `R`'s overflow row, where `R` is in `Q`'s branch.
- A zoomed `P` draws none of its branch's overflow rows in another section.

DRAG-8.4 cited it in the same sentence. The Given and the sentence also contradict each other. With all five branch rows drawn there's no hidden level, so there's no overflow row for "Any overflow row … leaves too" to act on. A reduced-depth witness would build a second geometry setup to re-prove a rule that's already automated, and it would contradict the Given's own wording.

**What I changed in DRAG-8.4.** I took the overflow sentence out of the Then. A closing line, in the style of DRAG-8.2's pointer to DRAG-2.24, now says it's DRAG-7.27's and that none of the five drawn rows owns an overflow row. The Given, the layout clauses, the neighbor clause and the Rule field are unchanged. No coverage is lost, because DRAG-7.27 still carries the rule.

**For the QA Engineer to record against P1:**

- **Answer:** the overflow clause is DRAG-7.27's, not DRAG-8.4's.
- **Proof list:** the "reduced-level overflow witness" in 8.4's row and C6's "hold the overflow sub-variant" both drop out. 8.4 is one full-five-row witness plus the Free Card zoom witness.
- **Status:** P1 is closed, and the overflow assertion no longer waits on it.

I didn't edit the batch file, since the Open questions and Review log are the QA Engineer's.

The alternatives are the QA Engineer's reduced-depth witness, or deferring the clause. I'd only take the witness if you want 8.4 to prove overflow removal in its own layout, which costs a second setup. If you prefer it, I'd restore the sentence and add an explicit "or, with fewer shown levels" Given instead.

**Nathan's approval (verbatim):**

Also, I agree with all of your keeps and the suggested variants are good to be put in the derrals story for later consideration

**Recorded disposition:** P1 is closed by the Planner's applied catalog change; its reduced-level witness is dropped from the proof list and C6. C1–C7 are approved, and both suggested variants are approved for Drag Automation Deferrals at the batch's close. No new desk reading or Test Reviewer pass is needed for this removed clause. Nathan's exact Stop 2 file list is the only remaining handoff item; the proposed list has not been treated as approved by the Keep decision.

### Stop 2 — desk readings on the over-cap premise and comparative column bound, 2026-11-13

**DRAG-8.12 questions (verbatim):**

r1. The automated witness may use any reachable tab state whose resulting deepest carried descendant exceeds CAP. Observe the ghost's actual indent/gap, establish its absolute depth from the seeded hierarchy and the deepest carried descendant's height, and assert that the result exceeds the board's reported CAP. Then assert invalid state, zero additional request, the original or earlier-pending placement/marker and complete appropriate branch restoration, with no copy/line. This does not require a particular named destination parent.
r2. Add a requirement that the over-cap ghost must specifically have parent W1 in both the section and modal witnesses, even though DRAG-8.12 names no W1 and only says an over-cap tab state. Does this additional exact-parent requirement follow from the Then/wiki or is it an unstated test detail? No rewrite or case decision is requested.

**Desk reply (verbatim):**

**DRAG-8.12**

> no request is sent. `X` returns to its pickup placement with its original parent, attachment and position; its branch is drawn there again at once, within the section's shown levels or at every level in an open modal. The invalid preview receives none of the branch, and the carried copy and line disappear. If the pickup placement was an earlier pending preview, that preview and its pending marker are restored while its write remains in flight.

- r1. **Follows the Then:** “no request is sent,” restoration to the pickup placement or “earlier pending preview,” complete branch restoration within the appropriate shown levels, and disappearance of “the carried copy and line.” Wiki board-drag-interaction §7.2 defines the qualifying state by the deepest carried descendant's resulting absolute depth and makes an over-cap state reachable but invalid. Wiki hierarchy-placement §6 states that “The formula is the whole rule”: the ghost's resulting absolute depth plus the moving item's subtree height exceeds configured `CAP`. No particular destination parent is required.
- r2. **Not stated by the Then or the wiki:** neither requires destination parent `W1`. The case's rule is proved by a reachable over-cap tab state and the stated release outcomes without requiring that particular parent; the exact parent is a detail the case leaves open.

**DRAG-8.10 questions (verbatim):**

r1. For a plain merged column, compare the actual carried box's limiting horizontal endpoint in otherwise equal branch/no-branch setups under identical pointer positions and list geometry; both must reach the same endpoint. Preserve fixed-size, neighbor, reservation and pointer-through assertions, and preserve the explicit section/sub-row bottom-edge assertions.
r2. Add a separate requirement that the copy's right edge must coincide exactly with the outermost edge of a column's entire UI group, rather than prove the same drag bound in both setups; the case names no outer-group element or zero inset. Does that additional outer-group/zero-inset assertion follow from the Then/wiki, or is that a detail the case leaves open? This asks which geometry is the rule, not how any app is implemented.

**Desk reply (verbatim):**

**DRAG-8.10**

> its measured box and its ghost are one fixed Stub-row height. In shortCard form, each measured box and ghost is shortCard's fixed height. The branch line hangs below the carried box and adds no height to it or the ghost. With equal pointer positions and list geometry, the bands reserve the same space, the side highlight chooses the same ghost neighbor, and the carried box reaches the same bound in both setups.
>
> in a section it covers the row directly below the ghost; in a column or sub-row it covers the top of the Card below the ghost and the gap above that Card. It takes no pointer: rows and gaps beneath it remain reachable by the drag, and the line itself is no target. At a section's or sub-row's last row, bounding the copy's box at the bottom edge leaves its line able to hang past that edge. The bound does not move the box upward to fit the line. The line's height, typography, fill and animation are not assertions of this case.

- r1. **Follows the Then:** “With equal pointer positions and list geometry” the “carried box reaches the same bound in both setups.” Wiki board-drag-interaction §2 defines a merged column's carried-box constraint as a horizontal axis lock; §5a says the line adds nothing to the measured box or its bound. Comparing the actual limiting horizontal endpoint therefore supplies the merged-column bound observation. The fixed-size, neighbor, reservation, pointer-through and explicit section/sub-row bottom-edge assertions remain required by their quoted clauses.
- r2. **Not stated by the Then or the wiki:** neither identifies the outermost edge of the column's entire UI group as the carried box's exact endpoint or requires zero inset there. Wiki board-drag-interaction §2 bounds the carried box by its context and separately distinguishes the outer body used to judge whether the merged-column context still holds. The case's comparative bound rule can be proved without an exact outer-group-edge assertion.

### Stop 2 — Test Reviewer's first full pass, tree c814afbcd3b5c1d128afb50c2b21a0e1e22dd73e

The reply below is verbatim. The QA Engineer's disposition follows it separately.

### First full pass — DRAG-8.1 through DRAG-8.12

Reviewed the current cases, their cited wiki sections, the twelve carrier tests and their observation helpers. Scope widening adds no further IDs. No app source was read, no tests were run and no files were changed.

All carrier tests below are in `tests/ui/drag-8-carried-branch.spec.ts`.

### Case verdicts

- **DRAG-8.1 — Test gap.** `keeps the attached branch absent through every layer switch and restores the list preference` asserts absence by both row IDs and title occurrences, including static backdrop rows; unrelated-row presence; section/modal origins; column and foreign-section/modal transitions; and restoration of both Card list preferences. It does not confirm the named **change of gaps**: the `ghost.y + 10` movement has no assertion that the ghost actually reached another gap. The test can pass without exercising that clause.

- **DRAG-8.2 — Test gap.** `leaves Free-linked rows outside the carried branch with their own tiers and counts` asserts the five-row branch’s absence, the exact count line and the presence and assigned tiers of F, F1, D and D1 through pickup, popping, zooming and the modal. Its global `itemRow` assertions do not establish that **F and D remain Cards in their columns**, or that **F1 and D1 remain in those Cards’ sections**. Those rows could be drawn elsewhere and satisfy the assertions.

- **DRAG-8.3 — Proves the case.** `holds the pending tree four-row branch from pickup through both answers` confirms the pending attachment of C and pending detachment of B before picking up X. It asserts absence of A, A1, A1a and C, the exact two-child/four-descendant line, and continued drawing of Free Card B and B1. It releases both held answers during the drag and repeats those observations after delivery and through the reached layers. The final API observation confirms that detached B retains X as its parent.

- **DRAG-8.4 — Test gap.** `collapses only the carried branch space and adds one ghost on zoom` asserts all five rows initially drawn, their disappearance, Z’s upward displacement including spacing, immediate painted adjacency of X and Z, and Z/before as the named neighbor. Its Card step asserts shortCard form, no additional branch reservation and exactly one Stub-sized ghost on entry into Q. It does not establish that the offered **gap and depth choices exclude the entire dragged subtree**: it observes only the pickup placement and does not exercise or observe a changed depth choice against that exclusion. Overflow removal is correctly outside this case.

- **DRAG-8.5 — Proves the case.** `restores the branch at Q preview before the drop answer` confirms Q’s last-child preview and holds the response while checking the restored branch. `expectTreeAtQ` asserts row order and parent/sibling placement, including section overflow and every modal level. The old Card/location is absent, and the carried copy and line disappear before the answer. After acceptance, the same modal tree remains and API reads confirm the saved attachment, position and descendant relationships.

- **DRAG-8.6 — Test gap.** `cancels to the pickup tree or earlier pending preview without a drag write` asserts no new write, removal of the carried copy/line, restored row order and both Card list preferences. The pending variant retains its pending marker. Two clauses remain unproved:
  - The expanded-Card and pending-Stub steps do not confirm that their aiming movement actually produced the required **different gap or foreign preview** before cancellation.
  - In the pending-Stub step, `expectEndedAt` compares row IDs/order and visibility, without checking restored indents or parent placement. It therefore does not establish restoration of the **earlier preview’s depth and branch placement under X**.

- **DRAG-8.7 — Test gap.** `restores the reloaded branch under Q when a resync stops the drag` asserts drag termination, disappearance of the copy/line, no release write, removal from P, inclusion of newly added C, and the expanded/collapsed/modal visibility rules. It also checks X’s placement under Q and C’s placement under X. It does not check the restored placement of **A and B under X, A1 under A, A1a under A1, and B1 under B**. The expected modal ID order would also pass if those rows were drawn at incorrect depths in Q’s hierarchy; it does not prove the whole reloaded tree.

- **DRAG-8.8 — Proves the case.** `reads every attached count including hidden levels on the carried copy` covers every named count-table tree in Card and Stub form, including both no-line cases. The hidden-chain step uses the configured `sectionLevels`, confirms the last row is hidden before pickup, and checks `sectionLevels + 1` descendants before and after the modal opens. Its exact texts also exclude the carried item from the total.

- **DRAG-8.9 — Test gap.** `keeps the same count line on the carried copy through every form switch` asserts the exact carried-copy text and ghost-line absence at the named transitions, including section/modal pickup, column or sub-row, Board and re-entry. It asserts the carried copy’s form, but never the **ghost’s shortCard or Stub form**. A ghost in the wrong form with no line would pass. Tilt is correctly left to DRAG-1.27.

- **DRAG-8.10 — Test gap.** `leaves the drag box unchanged and lets the pointer reach beneath the count line` asserts equal branch/no-branch geometry, a Stub-sized copy and ghost, unchanged heights at the bound, equal reservations and named neighbors, overlap with the specified row/Card and gap, pointer-through behavior, equal limiting endpoints, and explicit section/sub-row bottom-edge overhang. It does not independently assert **shortCard’s fixed height**: the shortCard copy and ghost are compared with each other and with the other setup, so both setups could use the same incorrect height and pass. Line height and paint are correctly excluded.

- **DRAG-8.11 — Test gap.** `sets the branch down at its pickup gap without a new write` confirms a different placement, return of the ghost to the original gap/depth before release, no new request, disappearance of the copy/line, and unchanged saved parent/position for the ordinary pickup. The pending variant retains its marker. After release, however, `expectEndedAt` checks IDs/order and visibility without indents or parent placement. It does not establish that the **branch is restored under X**, or that the pending variant restores the **earlier preview’s depth**, rather than merely its row order.

- **DRAG-8.12 — Test gap.** `rejects an over-cap set-down and restores the pickup branch` reads `itemDepthCap`, observes the drawn relative depth, establishes that the deepest carried descendant would exceed the cap, and checks the invalid cue and zero new writes. The ordinary variant confirms unchanged saved parent, attachment and position; both variants remove the copy/line and restore the previous row IDs, with the pending marker retained when required. The ending assertions do not check restored indents or parent placement. They therefore do not establish the **pickup depth and branch placement under X**, including restoration of the pending preview. The same row order at an incorrect depth could pass.

### Corrections after red runs

1. **DRAG-8.1 — Accepted.** Picking up the Free Card by its exact title changes how the gesture reaches the source. Branch-absence and preference assertions remain intact. The gap-change finding above is separate.

2. **DRAG-8.8 — Accepted.** Requesting origin-Card expansion only when an attached branch exists preserves every count assertion and allows the Free-only/no-branch setup without requiring a nonexistent attached-children control.

3. **DRAG-8.9 — Accepted.** Finding the modal-exit point inside Q’s Card rather than the entire region changes the aim. The reached context, carried form and count assertions remain intact.

4. **DRAG-8.4 — Accepted.** Returning the pointer to `start` preserves the expected Z/before neighbor, pickup placement and geometry assertions. It does not weaken those clauses. The offered-depth-choice finding above remains.

5. **DRAG-8.6, DRAG-8.11 and DRAG-8.12 — Accepted for each test.** Awaiting successful delivery of the held answer before disposal changes cleanup after the pending-state assertions. Preview, marker, no-write and restoration assertions remain intact.

6. **DRAG-8.12 — Both corrections accepted.**
   - Aiming before W1 rather than W2 changes how the invalid state is reached; the Then names an over-cap state, not that neighbor.
   - Replacing the exact W1-parent expectation with observed drawn depth plus seeded P depth and subtree height directly checks the Then’s cap condition. The invalid cue, no-write and restoration assertions remain. The restoration gap above is separate.

7. **DRAG-8.10 — Accepted.** The Then requires the same limiting bound in both setups, not coincidence with the outer column group’s exact edge. Containment plus comparison of the actual limiting endpoints preserves that clause. The retained section/sub-row edge assertions cover their explicitly named bottom-edge behavior. The fixed-shortCard-height gap above is separate.

The brief supplied before-and-after corrections without reasons.

### Held-off cases

None supplied.

### Proposed mappings

None. No internal mappings are proposed.

### Cost verdicts

These recommendations carry the same weight as the test gaps. Nathan decides them; none accepts a missing clause.

All references below name tests in `tests/ui/drag-8-carried-branch.spec.ts`.

- **DRAG-8.1 — Keep.** `keeps the attached branch absent through every layer switch and restores the list preference` repeats a clock-driven route across named pickup surfaces and both named preferences. Those steps buy the case’s cross-layer absence and preference clauses. Confirm the changed gap using an app observation, without adding finer aiming precision.

- **DRAG-8.2 — Keep.** `leaves Free-linked rows outside the carried branch with their own tiers and counts` repeats the gesture for the named Card/Stub origins and traverses the named layers. The presence, tier and count assertions require those live states. Scope the existing observations to their Cards and columns.

- **DRAG-8.3 — Keep.** `holds the pending tree four-row branch from pickup through both answers` uses two held responses and several clocks. The gates let the test observe the pending tree and deliver each answer deliberately; these controls buy the pickup-snapshot and answer-delivery clauses.

- **DRAG-8.4 — Keep.** `collapses only the carried branch space and adds one ghost on zoom` uses precise displacement and pitch comparisons. The Then explicitly requires occupied-height removal and exactly one ghost-row reservation, so that precision measures stated behavior.

- **DRAG-8.5 — Keep.** `restores the branch at Q preview before the drop answer` holds a response and inspects both section and modal trees. Those observations distinguish immediate preview restoration from response-driven restoration and cover the named level limits.

- **DRAG-8.6 — Keep.** `cancels to the pickup tree or earlier pending preview without a drag write` repeats cancellation across expanded, collapsed and pending states. Those outcomes are named by the Then. The held answer buys the pending-marker clause; cleanup waits add no timing expectation.

- **DRAG-8.7 — Keep.** `restores the reloaded branch under Q when a resync stops the drag` needs an earlier failed gesture to produce a real resync, then repeats the stop for expanded, collapsed and open-modal displays. Each display proves a named visibility clause; the held cause controls delivery rather than racing a fixed delay.

- **DRAG-8.8 — Simplify.** `reads every attached count including hidden levels on the carried copy` repeats reset, full fixture seeding and board navigation for every count-table row and origin. Keep every named tree/form assertion and the hidden-chain/modal step, but reuse a board fixture for the count-table pickups where practical. Resetting and reopening for each row buys isolation rather than an additional Then clause.

- **DRAG-8.9 — Keep.** `keeps the same count line on the carried copy through every form switch` repeats a substantial clock-driven route for the three named origins. The form switches and ghost-line checks are the case’s substance. The revised modal exit preserves that route without requiring an exact endpoint.

- **DRAG-8.10 — Keep.** `leaves the drag box unchanged and lets the pointer reach beneath the count line` uses six comparative gestures, precise geometry and edge aims. The Then explicitly names fixed measured heights, reservations, neighbors, limiting bounds, overlap and pointer reachability. These are drag behavior measurements; no Manual recommendation follows from the excluded paint details.

- **DRAG-8.11 — Keep.** `sets the branch down at its pickup gap without a new write` deliberately moves away and returns, with a second pending/modal setup. Those steps distinguish an actual pickup-gap set-down from an untouched drag and cover the named pending outcome.

- **DRAG-8.12 — Keep.** `rejects an over-cap set-down and restores the pickup branch` shows the multiple-aim-correction signal and uses precise tabs plus a held pending answer. Its current observed-depth/cap check buys the stated over-cap prerequisite without requiring an exact parent. The two setups cover ordinary and pending restoration named by the Then.

### Deferred

None. No unnamed variants, hardening cases, final-look findings, assistive-tech findings or additional failure-recovery requirements are proposed.

**QA disposition:** fix and confirm the earlier gaps in 8.2, 8.4, 8.9, 8.10, 8.11 and 8.12. Keep 8.1, 8.6 and 8.7's red case bodies unchanged under the QA Engineer's genuine-failure rule; their remaining test gaps travel with D1/D2 for the post-Coder authoring return, before any freeze. The 8.8 Simplify verdict is a current cost decision for Nathan: recommend sharing the board fixture while retaining every count-table/form/hidden-chain assertion. Leave that passing test unchanged until he decides. The eleven other cost verdicts agree with the approved Keeps.

### Stop 2 — Test Reviewer's confirming pass, tree 8a016297052247c7484723af021e0430f971a453

The reply below is verbatim. Only the six earlier gaps were in the confirming brief.

- **DRAG-8.2 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.2: leaves Free-linked rows outside the carried branch with their own tiers and counts` now observes F and D as articles inside the Todo column, with F1 and D1 inside their corresponding Cards. These scoped observations retain the required presence, tier and count checks at each reached stage.

- **DRAG-8.4 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.4: collapses only the carried branch space and adds one ghost on zoom` now confirms a changed depth greater than one and checks that its observed parent and sibling references exclude X and the entire carried branch. Branch absence and the previously proved space, pickup-placement and neighbor assertions remain.

- **DRAG-8.9 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.9: keeps the same count line on the carried copy through every form switch` now checks the ghost’s rendered article role and measured height against the named Stub or shortCard size at each named transition. The carried-copy form, exact count text and ghost-line absence checks remain.

- **DRAG-8.10 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.10: leaves the drag box unchanged and lets the pointer reach beneath the count line` now independently compares the measured copy height with `SHORT_CARD_HEIGHT_PX` or `STUB_ROW_HEIGHT_PX`, alongside copy/ghost equality. The correction from an above-list aim to the Review column’s center is accepted: it changes how Board layer is reached, retains the context assertion and preserves the paired geometry, neighbor, reservation, pointer-through and bottom-edge assertions.

- **DRAG-8.11 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.11: sets the branch down at its pickup gap without a new write` now confirms X’s root placement and the visible branch parent relationships before pickup, then checks those relationships and the captured row indents after release. This establishes restored depth and branch placement for both the ordinary section pickup and earlier pending modal preview. Previous order, visibility, no-write, saved-field and pending-marker assertions remain.

- **DRAG-8.12 — Earlier gap closed.** In `tests/ui/drag-8-carried-branch.spec.ts`, `DRAG-8.12: rejects an over-cap set-down and restores the pickup branch` now checks the same before/after root placement, branch parent relationships and row indents. This establishes restoration of the pickup depth and branch placement, including the pending preview. The observed over-cap proof, invalid state, zero-write, saved-field and pending-marker assertions remain.

No regressions found in the reviewed changes.

### Stop 2 after the Coder's return: Test Reviewer, confirming pass on DRAG-1.33's Vitest setup change, 2026-11-15

The reply below is verbatim. The brief carried the Coder's one setup change to DRAG-1.33's three tests in `client/src/components/KanbanCard.test.tsx` as a before-and-after, with no reasons and no open gaps.

**Test Reviewer, batch 4e: confirming pass on DRAG-1.33's three Vitest tests (a setup change only)**

All three tests are in `client/src/components/KanbanCard.test.tsx`, inside `describe('a zoomed Card retaining its expansion after attachment')`, and all three build their tree through `twoCards`. The brief listed no open gaps from the earlier pass, only the Coder's one setup change. So this pass gives a verdict on that change and checks for regressions. The brief is in form: it gives no reasons and argues for no verdict.

**The change: `twoCards` now wraps the Cards in `BoardStore`. Accepted, for all three tests.**
- **It changes how the tests reach their state, not what they assert.** The header of `CardExpansionContext.ts` gives the store's contract. It holds the Cards whose list the user opened or closed by hand, by item id. `BoardView.tsx` holds it above everything a reload or a move unmounts. A Card with no entry starts from the board's setting. `BoardStore` provides the app's own `useCardExpansionStore()` in that same place, above the Cards.
- **The store lasts across rerenders.** `BoardStore` is declared at module level, so each `rerender(twoCards(…))` keeps the same instance, and the store lasts across the rerenders as it lasts across the board's reloads.
- **The tests still observe through the app.** The store starts empty. Only the user's click on C's "Hide attached children" writes C's entry, and nothing in the test seeds it. Every assertion reads the rendered Cards: which child titles are drawn, and what the toggle's title is.
- **A store that didn't keep the click would fail the tests, not pass them.** Tests 2 and 3 end by asserting C is collapsed again. Test 1 asserts C collapsed right after the click, and again after collapsing it by hand at the end.

**Regression: none.**
I couldn't see the file as it was before the change. I judged each assertion as it stands now against the Then, so this verdict doesn't rest on the brief's word that no assertion line changed.
- **DRAG-1.33, `DRAG-1.33: retains the zoomed target open from release through its saved answer for a Free item with retained parent %s, leaving another Card expanded` (both variants):**
  - **Given, before the When:** C collapsed by the user's click (CHILD not drawn), and E expanded (OTHER_CHILD drawn).
  - **The zoom into C opens C:** CHILD and X drawn.
  - **X attached into C, so C stays open after the release:** with the attach pending, C offers "Hide attached children" and draws X. After the saved answer, CHILD and X are drawn.
  - **E's list is still expanded after the release.**
- **DRAG-1.33, `DRAG-1.33: restores the collapsed target after %s without attachment and leaves another Card expanded` (pop-out, cancel):**
  - **The zoom opens C.**
  - **The drag leaves C without attaching, so C collapses again:** neither CHILD nor X is drawn, and C is still collapsed once the drag has ended.
  - **E is still expanded at the end.**
  - **Given:** the click sets C's Given, and the test goes to the When with no assertion in between, as before the change (the diff touches neither line). The end assertions fail if the click hadn't collapsed C, so the test can't pass on a C left open.
- **DRAG-1.33, `DRAG-1.33: a same-parent Stub reorder does not replace the target Card’s collapsed preference`:**
  - **C is drawn open** while the drag of its own Stub is at C's Descendants layer.
  - **C is collapsed again** after the drag ends.
  - **Given:** set the same way as in the test above, and the closing assertion covers it the same way.
- **E, in the two tests that check it:** the change doesn't touch it. E has no entry in the store and is drawn expanded from the board's setting, as before, and its assertions are unchanged.

**For the record, not a finding:** the batch 4a Reconciler report lists these three tests as internal inventory only, with no approved mapping (E116 to E118). DRAG-1.33's Automation line names `tests/ui/drag-layer-transitions.spec.ts` and `tests/ui/drag-card-forms.spec.ts`. This pass judges what the three tests assert, and changes no count.

**What I read in app source:**
- **`CardExpansionContext.ts`:** its header (lines 1 to 6), and past it the first few declarations (lines 8 to 30). The verdict rests on the header alone.
- **Otherwise:** only the header and imports of `KanbanCard.tsx`, and `client/src/components/workflow/AGENTS.md`.

Files:
- c:\Users\natha\Dev\KanbanApp\client\src\components\KanbanCard.test.tsx (`BoardStore` at lines 49 to 53; the describe at lines 140 to 237)
- c:\Users\natha\Dev\KanbanApp\client\src\components\workflow\CardExpansionContext.ts (header, lines 1 to 6)
- c:\Users\natha\Dev\KanbanApp\docs\test-plans\board-drag-interaction\drag-1-contexts-and-popping.md (DRAG-1.33, line 347)
- c:\Users\natha\Dev\KanbanApp\docs\audits\test-reconciliation-story-10-batch-4a.md (E116 to E118)

**QA disposition:** accepted for all three tests, with no regression. The reviewer reports reading `CardExpansionContext.ts` lines 8 to 30 past its header, where its definition allows the header only. It says the verdict rests on the header alone, and the brief had named no app file. No test change follows. The Coder's three unstamped Vitest tests carry no ID, weren't submitted, and map to no case.

### Stop 2 after the Coder's return: Test Reviewer, confirming pass on DRAG-8.1, 8.6 and 8.7, tree 04f93ab634e9f33998185cc5a4d86ea88e8ba6a1, 2026-11-15

The reply below is verbatim. Its four gaps are the earlier first full pass's, for 8.1, 8.6 (two) and 8.7. The brief carried each change as a before-and-after, and 8.1's aim change as a correction after a red run, without reasons.

Confirming pass, batch 4e. All three tests are in c:\Users\natha\Dev\KanbanApp\tests\ui\drag-8-carried-branch.spec.ts. Three of the four gaps are closed. The pending-Stub half of gap 2 is still open. No regressions.

**Gap 1: DRAG-8.1, closed.** Clause: "They stay absent while the drag changes gaps." Test: `DRAG-8.1: keeps the attached branch absent through every layer switch and restores the list preference`, section and modal steps.
- The test reads `placementShown(list, s.x.id)` at pickup, so it confirms the starting state before the aim.
- X is the first row in P's section and in P's modal. Its pickup gap, above Z, therefore offers one state only (wiki hierarchy-placement §2, "Above the first entry … one state"; §1 defines a gap separately from its depth). Any placement unequal to `pickup` must be in a different gap.
- So the poll `not.toEqual(pickup)` proves the gap changed, and `expectBranchAbsent` then asserts the branch is still absent.
- The same edit was also a correction after a red run: `center` plus `hoverTo(..., ghost.y + 10)` became `aimBefore(page, start, itemRow(list, s.w.id))`. It changes only how the gesture is aimed, and every clause still holds, so it is accepted.

**Gap 2: DRAG-8.6 gap A, partly closed.** Given: "its copy previewed at a different gap or in another Card." Test: `DRAG-8.6: cancels to the pickup tree or earlier pending preview without a drag write`.
- **Expanded-Card step: closed.** Before pickup the test asserts that X is painted below P in the column region, between P and Q. After the hover over P's top quarter it polls until X is no longer painted below P. That is a different column gap from X's pickup gap, confirmed before the cancel.
- **Pending-Stub step: not closed.** The poll `expect.poll(() => placementShown(scope, s.x.id)).not.toEqual(earlier)` proves X left its pickup placement, `{ parentId: null, prevId: s.w.id, nextId: null }`. It does not prove X left its pickup gap.
  - That gap is the last one in P's section, below W's run. Per wiki hierarchy-placement §1 it also offers deeper states: X under W after W1 (`{ parentId: W, prevId: W1, nextId: null }`), or under W1 after W2.
  - Either state is unequal to `earlier` while still in the same gap, so the poll passes without the different gap the Given names.
  - To close it, pin the gap the aim targets. For example, poll until X is painted before Z in P's section, or until `placementShown(scope, s.x.id)` equals `{ parentId: null, prevId: null, nextId: s.z.id }`.

**Gap 3: DRAG-8.6 gap B, closed.** Clauses: "the restored placement is that earlier preview, with its pending marker retained" and "the branch is drawn beneath it again at once, within each list's shown levels". Test: `DRAG-8.6: cancels to the pickup tree or earlier pending preview without a drag write`, pending-Stub step.
- Before pickup, the test records `rowIndents(scope)` and asserts `expectBranchHierarchy(scope, s, false)`. That confirms the starting branch: A and B under X, A1 under A, B1 under B.
- After the cancel, `expectEndedAt(..., beforeIndents, false)` asserts the overlay and count line are gone, the row order (including A1's overflow row) matches, and every row's indent equals its pickup indent. It also asserts X's parent is null, the same branch parents, and `data-pending="true"`. Separately, `placementShown(scope, s.x.id)` must equal `earlier`.
- A1a lies past the section's shown levels, so `complete = false` matches the Then's "within each list's shown levels".

**Gap 4: DRAG-8.7, closed.** Clause: "`X` and its attached descendants are drawn where the reloaded board has them, under `Q` … a modal that remains open draws every level." Test: `DRAG-8.7: restores the reloaded branch under Q when a resync stops the drag`, all three steps.
- `expectBranchHierarchy(modal, s, true)` asserts, in Q's modal, A and B under X, A1 under A, A1a under A1, and B1 under B.
- `placementShown` takes each parent from the drawn indent, and throws on a row that is not exactly one level below its parent, so the depths are proved as well.
- Together with the existing row order and X's and C's placements, this proves the whole reloaded tree under Q.

**Regressions: none.**
- DRAG-8.1 still asserts everything it did before: the branch absent at pickup, after the gap change, after leaving to the column, after zooming into Q, and in Q's modal. It also still checks that unrelated rows stay drawn, that the Card's collapsed or expanded preference returns, and that the branch is drawn again after the cancel.
- DRAG-8.6's expanded-Card and collapsed-Card steps assert what they did before. The pending-Stub step's earlier checks are all still inside `expectEndedAt`, which now asserts more.
- DRAG-8.7 only gained a line.

**QA disposition:** gaps 1, 3 and 4 are closed. For gap 2's pending-Stub half, I made the change the reviewer named: the poll now waits for X's placement to equal `{ parentId: null, prevId: null, nextId: Z }`, the section's first gap, in place of `not.toEqual(earlier)`. It passes alone and in the file's run and has had no review. A third pass over 8.6 waits for Nathan (R-8.6). The reviewer accepted 8.1's aim change as a correction that leaves every clause holding.

### Stop 2 after Nathan's decisions: Test Reviewer, further confirming pass on DRAG-8.10's third correction and DRAG-8.8's Simplify, tree 4a8c720c091db11faea51f9269bc8046e9418e91, 2026-11-15

The reply below is verbatim, from the same reviewer session as the pass above. Nathan authorized a third confirming pass over DRAG-8.10 limited to its one correction. The brief carried that correction as a before-and-after, and DRAG-8.8's change as the Simplify the first full pass recommended, without reasons.

Further confirming pass, batch 4e. Both tests are in c:\Users\natha\Dev\KanbanApp\tests\ui\drag-8-carried-branch.spec.ts. Both changes pass: the DRAG-8.10 correction is accepted, DRAG-8.8 still proves the case, and nothing regressed.

**DRAG-8.10 correction after a red run: accepted.** Test: `DRAG-8.10: leaves the drag box unchanged and lets the pointer reach beneath the count line`. Clause: "With equal pointer positions and list geometry, the bands reserve the same space."
- **What it now reads.** The 'column' and 'sub-row' setups read the height of the Done column's `single` band, through the app's `data-carve-zone` attribute, measured on screen. Before, they read the origin region's `top` and `bottom` zones.
- **Why the comparison is fair.** Both setups take the reading at Board layer, with the pointer on Review's centre (the existing `pointer` comparison covers that). `seedCase` seeds nothing in Done, so Done has the same contents in both setups.
- **Why one band is enough.** Every band shape in wiki board-drag-interaction §5 is built from the carried copy's height `h`, plus the fixed list gap. §5a says the line adds nothing to that height. So Done's single zone shows any effect of the line just as the origin's two zones did. The unchanged `expect(rest).toEqual(priorRest)` still requires the reading to be equal with and without the branch.
- **Nothing is weakened.** The Then names no region or band shape, so reading one band in another region is not a gap. The expected value is still equality, with no tolerance added. A missing zone makes `boxOf` throw rather than pass, so the reading can't pass vacuously.
- **It is a correction to how the test reaches its observation.** No clause is dropped, and the clause still holds.
- **Rest of the test unchanged.** I compared the test with my read of the file earlier this session. Only the `reservations` lines and the new import changed.

**DRAG-8.8 change: still proves the case.** Test: `DRAG-8.8: reads every attached count including hidden levels on the carried copy`.
- **The table's twelve pickups (six trees by two origins).** Each step checks its Given before the pickup:
  - through the API, X's saved parent and attachment: a root Free Card for the 'card' origin, an attached Stub of P for 'section';
  - through the API, each branch row attached under its seeded parent;
  - X shown on screen, and for the `free-only` tree, F expanded with F and F1 shown.

  The pickup forms are unchanged: Card by its title, Stub by its row button. `expectLine` still reads the carried copy's `data-carried-branch` text, exactly, or its absence for the two no-line rows, and still checks that the ghost has no line. So it still observes through the app.
- **What `expectGiven` checked that is dropped.** Only that Z and U were shown. Those rows belong to `seedCase`'s other scenarios, are not part of this case's trees, and are not seeded on the new board. Nothing in DRAG-8.8's Given is lost.
- **Sharing one board is not a weakness.** Each tree's X has its own id and a unique title, and the pickup and `expectLine` are scoped by id, so the repeated `A`/`B` titles across trees don't confuse them. A count that wrongly took in a sibling tree would fail the exact-text check.
- **Settings are unchanged.** Section levels stay at 3, so A1a is still hidden in the 'section' origin's `five` tree. `caseTuning` returns the same values `openCase` used before.
- **The second paragraph's hidden-chain step is unchanged.** It still proves "Y = sectionLevels + 1" before and after the modal opens.
- So the whole Then is still proved: all six table rows, both pickup forms, and the hidden-chain count.

**Regressions: none.**
- DRAG-8.10 keeps every other assertion as it was: box and ghost heights, the line hanging below the box, the hit test under the line, the drop-line neighbour, the bound, and the comparison of the two setups.
- DRAG-8.8 keeps the table, the pickup forms, `expectLine` and the hidden-chain step.
- Moving the tuning into `caseTuning` leaves `openCase`'s values, and so every test that opens its board through `openCase`, unchanged.

**QA disposition:** both accepted. The 8.10 correction is the third, and Nathan's. The test then fails at T2, an assertion the reviewer's pass didn't touch and the brief didn't ask about. No change follows from this pass.

## Amendments

- **2026-11-13 — Stop 1 proof list prepared (QA Engineer).** Applied the current one-test-per-case, four-stop and cost-review rules. Read the Planner's appearance changes without editing them. Corrected this plan's count-line observation note; added the twelve proposed tests, bounded variants, seven cost recommendations, helper/file proposal and current packet. The desk's 8.10 top-overlap verdict keeps both column and sub-row; its 8.4 verdict routes the overflow Given to a Planner session. No app, test, wiki or catalog change is made by this stop.
- **2026-11-13 — P1 closed and Keep decisions approved (Nathan and Planner return).** The Planner removed DRAG-8.4's overflow assertion and assigned that rule to DRAG-7.27. Updated its proof row and C6 to the full-five-row and Free Card zoom witnesses only, closed P1, recorded the Planner's return verbatim, and recorded Nathan's approval of C1–C7 and both suggested deferrals. Automation remains unauthored pending the Stop 2 file list.
- **2026-11-13 — Stop 2 opened on Nathan's four-file approval.** Entry tree `ce7265596facc8a860110aa3313f9c03ee06b726`; tests and the shared count-line locator are authored. P1 remains closed, and the existing Planner edits remain untouched. Results holds validation, corrections and D1/D2; the desk's two new readings are recorded above. No Coder, catalog or wiki change is made by this stop.
- **2026-11-13 — Stop 2 reaches its check-in.** Twelve tests authored; eight pass alone and in the full new-spec run. D1/D2 leave three tests red; 8.10 is stopped at T1 after two corrections. The root gate passes. The Test Reviewer gives one full pass and one confirming pass, closing six submitted gaps; the red cases' three remaining gaps travel with the post-Coder QA handoff. Its 8.8 Simplify verdict waits for Nathan. No skip, app fix, third attempt/review, freeze, reconciliation or commit is made.
- **2026-11-15 — A Card's list stays as the user set it (PO, on the Architect's rule).** The rule is in wiki item-attachment §12 as Planned, since §12 already owns the Card's collapsible list; board-drag-interaction §1.1 and §10 point to it. It settles D1 and D2 as app defects (Open questions). PO deductions, for Nathan to overrule:
  - **"The board's next load"** is the Architect's "from the next load". An unset list takes the setting as it stands when the board next draws it, and a list already drawn stays as it is.
  - **A switch to another board** isn't in the Architect's rule, so it isn't ruled. It sits in item-attachment's Open questions: does a set list follow the Card to the other board, or start from that board's setting? The PO recommends it follows the Card, since the choice is about the Card, and the setting then only starts an unset list. Nathan decides.
  - **The Card's open after an attach** (§1.1, "it stays open") isn't mentioned in the rule. It is left as it reads.
  - **One case of its own** is recommended to the Planner (D1 and D2's ruling line), not written by the PO.
- **2026-11-15 — The Coder's return for D1 and D2 (QA Engineer).** D1 and D2 are fixed in app source, and the original red 8.1, 8.6 and 8.7 pass unchanged. Their retained review gaps are closed with added assertions; 8.1's aim, which had never left X's gap, takes its second correction and is weighed in Results. A confirming pass accepts the Coder's setup-only change to DRAG-1.33's three Vitest tests. A second confirming pass on 8.1, 8.6 and 8.7 closes three of four gaps and leaves one half of 8.6's, which is fixed and has no review (R-8.6). 8.10 still fails at T1, unmoved by the app change. No app, wiki, catalog or Vitest change by this session, and no skip, freeze, reconciliation or commit. Recorded in Results, Open questions and the Review log.
- **2026-11-15 — Nathan approves the recommendations on T1, 8.8 and R-8.6 (QA Engineer).** The third correction to 8.10 reads the reservation from the Done column's band; the reviewer accepts it and T1 is cleared, and the test then fails at a new step, T2, in the sub-row's bottom-edge reach, which waits for Nathan. 8.8's Simplify is applied (one seeded board per origin for the twelve table pickups, 12.1 s alone from 18.9 s) and a confirming pass accepts it. 8.6's last fix is accepted on its runs, with no review. `openCase`'s tuning moved into `caseTuning`, with the same values, and the whole file passes with it. No app, wiki, catalog or Vitest change by this session, and no skip, freeze, reconciliation or commit. Recorded in Results, Open questions and the Review log.
- **2026-11-15 — DRAG-8.10 skipped and deferred to Drag Automation Deferrals (Nathan).** After the third correction cleared T1, the test failed at T2, the sub-row's bottom-edge reach (4.75 px short of the edge, where it allows 2). Nathan deferred the whole case, so the test is skipped with its body untouched, the way 4d skipped its deferred tests, and the entry is in Drag Automation Deferrals. The case stays `Open`. The whole file now runs 11 passed and 1 skipped, and the root gate is green. No app, wiki, catalog or Vitest change, and no freeze, reconciliation or commit. Recorded in Results and Open questions (T2).
- **2026-11-15 — Stop 4 runs to F1 and stops before the Reconciler (QA Engineer).** Stamps checked, tree frozen, D2's ten repeats clean (110 of 110), the final suite and the gate run. The final suite's one failure was a setup connection reset in a batch 4d test, and the untouched rerun was green, so F1 asks Nathan whether it is a one-off for 4i or a skip under D2. The Reconciler, which runs once, waits for that answer. 4e's two suggested variants moved to Drag Automation Deferrals. No app, test, helper, wiki or catalog change in the stop, and no commit. Recorded in Results and Open questions (F1).
- **2026-11-15 — Batch 4e closes at Stop 4 (QA Engineer, the Reconciler, Nathan).** The Reconciler runs once on the frozen tree and the green rerun, and sets DRAG-8.1 to 8.9, 8.11 and 8.12 `Automated`; DRAG-8.10 stays `Open` with its test skipped. Its one test-quality note and one candidate case go to Drag Automation Deferrals, which also answers three of its old questions about a collapsed section and a reload. No app, test, helper or wiki change in the stop, and no commit. Recorded in Results, Open questions (F1) and the Reconciler's report.
- **2026-11-16 — The Test Planner applies the PO's D1/D2 handoff.** Added ATT-1.16 for wiki item-attachment §12's list-preference lifecycle and advanced ATT-1's Next ID. It stays `Planned` while the wiki passage is marked. Added its separate handoff scope and remaining PO/Planner/QA owners here, and resolved the matching deferrals candidate to it. The existing DRAG cases and their coverage fields are unchanged. No code, tests or wiki edited, no mapping approved and no commit.
- **2026-11-16 — ATT-1.16 opens after the wiki marker is cleared (Test Planner).** Confirmed the unmarked §12 passage after Nathan's update, changed the case and its summary to `Open`, and updated the current handoff and deferrals routing. Its text and Automation `—` are unchanged. QA owns the next automation assessment.

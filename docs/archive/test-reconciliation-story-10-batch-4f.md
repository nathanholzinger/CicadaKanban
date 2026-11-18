# Story 10 batch 4f — Test reconciliation

Initial reconciliation, 2026-11-16. This is the batch's one cold run, not a follow-up.

The fixed inputs are the Scope, accepted dispositions and Review log in `docs/planning/epic-3-5-stories/story-10-batch-4f.md`, `tests/output/batch4f-stop4-catalog-before.md`, `tests/output/batch4f-stop4-green-run.md`, and the supplied test/catalog range diffs. The range starts at `2becfdd615689f3ebaf39696812362ec356dd289`; the accepted frozen tree is `5a2b7c6152c385ce52f6d90bf6ee8ef23320ed1e`. The catalog range diff is empty.

The supplied evidence records 140 D2 passes, ten planned skips and no failures, flakes or retries; the full E2E records 504 passes, 30 skips and no failures, flakes or retries. Its JSON reports are `tests/output/batch4f-stop4-d2-repeat10.json` and `tests/output/batch4f-stop4-final-full-e2e.json`. The root gate passed with 444 server, 1,110 client and 327 script tests. The green-run record establishes the frozen tests/catalog identity through those runs. No tests, Git, catalog commands or runtime forensics were run for this reconciliation.

Scope is 29 cases: the fourteen original assignments, the five inherited classification cases carried by the changed classification file, and the ten modal cases widened by the changed modal-hold file and Review log. All thirteen retained assignments have whole-case coverage. DRAG-2.8 and DRAG-7.18 remain Open and deferred. Seven legacy cases return to Open. DRAG-7.12 retains Automated through newly identified surface coverage, detailed below.

## Coverage Mapping

### Classification and API parity

The following title is shared by DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.7, DRAG-2.10 and ATT-4.9 in `tests/ui/drag-target-classification.spec.ts`:

> DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.7, DRAG-2.10, ATT-4.9: every visible target is classified at pickup and agrees with an attached-parent API move

Its checked root, attachment and parent-chain reads establish the moving height and cap-relative boundary before pickup. It independently enumerates all visible item IDs and checks their expected states. Each API replay restores and reads the same hierarchy, attachment, workphase and positions before submitting an attached-parent request with no workphase or anchor.

| Case | Whole-case judgment and resulting mapping |
|---|---|
| DRAG-2.1 | Automated retained. The shared carrier asserts Valid for unrelated legal targets. Automation remains `tests/ui/drag-target-classification.spec.ts`. |
| DRAG-2.2 | Automated retained. The shared carrier checks the detached `X → D` and attached `D → D1` links, then Cycle-forming for X, D and D1; X's carried Stub is absent. Automation remains `tests/ui/drag-target-classification.spec.ts`. |
| DRAG-2.3 | Automated retained. The shared carrier checks the detached branch contributing height 2 and the target-chain length, then Valid exactly at CAP and Depth-capped one level deeper. Automation remains `tests/ui/drag-target-classification.spec.ts`. |
| DRAG-2.7 | Automated retained; Automation adds `client/src/components/workflow/dragClassification.test.ts` beside the existing surface path. Its approved title, **“DRAG-2.7: Stubs are classified individually — no blanket exclusion”**, constructs separate root Cards P and Q1 and asserts Valid for P's Stub and Depth-capped for the Stub at Q's cap-depth chain end. This supplies the two-Card Given missing from the shared surface carrier. Nathan's explicit approval is in the Scope and Review log; the existing stamp stays unchanged. |
| DRAG-2.10 | Automated retained. The shared carrier constructs boundary targets from the board's `itemDepthCap` and checks both UI states and API acceptance/refusal. `server/tests/routes/boards.test.ts`, **“DRAG-2.10: carries the item depth cap the API enforces”**, also checks the returned cap against the configured API cap. Both existing Automation paths remain. |
| ATT-4.9 | Open → Automated. The shared carrier replays every visible item target, accepts Valid parents with attachment and inherited workphase, and rejects invalid parents while comparing the moving subtree's full API responses with its pre-request snapshot. The enumeration excludes carried hidden rows and submits no overflow/non-target control. Automation becomes `tests/ui/drag-target-classification.spec.ts`. |

All titles in the next table are in `tests/ui/drag-target-classification.spec.ts`. Each case changes Open → Automated and receives that Automation path. DRAG-2.22 additionally receives `tests/ui/drag-7-overflow-row.spec.ts`, whose existing carriers prove its carried-overflow absence clause.

| Case | Test title and clauses proved |
|---|---|
| DRAG-2.4 | **“DRAG-2.4: classifications stay fixed while the drag leaves and enters contexts”** checks all seeded targets at pickup, at Board, in another Column, in Descendants and after leaving Descendants. The independently checked parent chains ground Valid, Cycle-forming and Depth-capped. |
| DRAG-2.12 | **“DRAG-2.12: pending parent changes and detach keep visible descendants Cycle-forming”** gates a request before server save, checks old saved state and the pending preview, then picks up X and checks visible D is Cycle-forming. Attach supplies the Free-A pending-parent Given; detach supplies the kept-parent Given. The retained attached-A reparent branch is additional coverage, not the proof of the Free-A Given. |
| DRAG-2.14 | **“DRAG-2.14: a Valid Card and its Valid Stub are both Full”** checks the root/attached-Stub setup and asserts both Valid and Full (`parent`) on each target. |
| DRAG-2.15 | **“DRAG-2.15: Cycle-forming and Depth-capped Free Cards are Mid neighbors and their Stubs are Low”** covers both causes, checks the Card/Stub tiers, observes the named neighbor and absence of zoom/cue, then checks an anchor-only write retaining X's Free, parentless state. |
| DRAG-2.16 | **“DRAG-2.16: a capped Stub is Mid under a Valid parent and deeper Stubs stay Low”** checks the cap-relative fixture and row visibility, Full P, Mid S and Low deeper Stubs. It reaches a valid shallower state beside the deeper rows, tabs into the invalid deeper state and back, then saves X beside S under P at the cap boundary. |
| DRAG-2.17 | **“DRAG-2.17: the attached branch stays absent while Free-linked descendants keep their tiers”** covers section and Free-Card origins, branch absence at pickup, another gap, pop-out and another section; the observed placements and named relation exclude the branch from candidates. Free D and its Stub D1 remain present at Mid and Low. |
| DRAG-2.18 | **“DRAG-2.18: overflow rows are Full for Valid owners and Low for invalid owners”** checks the three controls' initial counts/order and both invalid-owner causes. Controls retain count/order/presence without an item ID, while the carried branch's overflow disappears. |
| DRAG-2.19 | **“DRAG-2.19, DRAG-7.12: pickup tiers survive layer changes and a write answer, then clear at every drag end”** checks pickup tiers across Board, Column, expanded sub-row, Descendants and modal, releases an earlier held answer during the drag, and checks tiers remain. Drop, cancel and an actual reload-driven stop clear tiers. The held drop preserves the previewed placement and independent pending marker until its answer. |
| DRAG-2.20 | **“DRAG-2.20, DRAG-7.12: the ghost, copy, backdrop rows and non-target places carry no target tier”** checks ghost state and untiered ghost/copy, all three named non-target places, the active modal's Full/Mid/Low targets, and the untiered static section under its backdrop. It makes no painted-strength judgment. |
| DRAG-2.21 | **“DRAG-2.21: nested rows keep their own tiers and the drop line takes none”** checks Mid P, Low S and its deeper Low Stub; present drop lines on both a named Mid Card and a named Mid Stub carry no target tier. |
| DRAG-2.22 | **“DRAG-2.22: dimmed targets start no entry cue while a Full overflow row can open its modal”** checks the Mid Cycle-forming Card's denied zoom/dwell/cue, its Low overflow, absent carried overflow, the Depth-capped owner's invalid overflow-level projection and absence of hold/cue/modal, then the Full-owner positive dwell/cue/opening. The two existing `drag-7-overflow-row.spec.ts` titles **“DRAG-7.27, DRAG-2.22: a dragged R carries its overflow row and its branch, which are never a neighbor; an unrelated overflow row stays; released as B’s next sibling, its children show at level 2”** and **“DRAG-7.27, DRAG-2.22: a dragged Q carries R and T, so their rows and R’s overflow row are all absent”** also assert carried-overflow absence. |
| DRAG-2.23 | **“DRAG-2.23: pickup tiers use pending parent and attachment state”** holds each write before server save, checks stored state and pending rendered form, then covers Stub-under-P Mid, Stub-under-Q Low, detach-from-Q Depth-capped/Mid, detach-from-X Cycle-forming/Mid and attach-into-X absence. Both attach and reparent variants establish independence from stored parent/attachment. |

DRAG-2.8 remains Open with Automation `—`; its partial and skipped carriers are recorded under Gaps.

### Widened modal coverage

**DRAG-7.12 — Automated retained, with new surface mappings.** The two newly stamped carriers in `tests/ui/drag-target-classification.spec.ts` are:

- **“DRAG-2.19, DRAG-7.12: pickup tiers survive layer changes and a write answer, then clear at every drag end”**;
- **“DRAG-2.20, DRAG-7.12: the ghost, copy, backdrop rows and non-target places carry no target tier”**.

Their shared `tests/helpers/dragTargetScenario.ts::modalTargets` builds root P and the attached chain A → Q → R → R1 → Mid → Low; `targetRoot`/`targetChild` read back root state, every parent link, attachment and inherited workphase. It builds X's checked attached branch of height `itemDepthCap - 6`, plus a shorter Free-linked branch. Thus R (depth 4) and R1 (depth 5) are legal, Mid (depth 6) is Depth-capped, and its attached child Low has an invalid parent; all fixture rows fit within CAP. This establishes the case's Given independently before the modal-opening When, with Mid and Low serving the case's R1a and Y.

The lifecycle carrier checks R's Full/Valid tier before and after modal opening and the same pickup tiers across layer transitions and a held answer. The modal/backdrop carrier explicitly asserts R and R1 Full/Valid, Mid Depth-capped/Mid and Low Depth-capped/Low inside the modal, and no tier on the static section. Together they assert the complete Then from checked fixtures. No internal mapping is needed.

Automation adds `tests/ui/drag-target-classification.spec.ts` while retaining the existing `tests/ui/drag-7-modal-hold.spec.ts` and `tests/ui/drag-7-hierarchy-modal.spec.ts` paths. Their existing **“DRAG-7.12: a modal a hold opens carries the drag’s tiers: R and R1 Full, R1a Mid, Y Low, R as it was, and the section rows under the backdrop take none”** and **“DRAG-7.9, DRAG-7.12: a tab state past the depth cap is reachable in the modal and writes nothing, and the rows carry the drag’s classification”** retain partial coverage; the original pre-When fixture limitation is not claimed repaired in those tests.

**DRAG-7.21 — Automated retained.** `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.21: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits”**, reads the cap, reaches both invalid overflow-adjacent states, waits beyond the hold opportunity, checks no modal/hold, checks no cue and no write on the invalid release, then tabs shallower to a valid state with no hold/cue/modal and cancels without a write. Its existing Automation path remains. The range's removal of the partial DRAG-2.22 stamp leaves this case's assertions intact.

DRAG-7.13, DRAG-7.14, DRAG-7.15, DRAG-7.16, DRAG-7.17, DRAG-7.19 and DRAG-7.25 change Automated → Open, with Automation `—`. DRAG-7.18 remains Open with `—`. The precise missing clauses and carriers follow under Gaps.

## Coverage Report Findings

The supplied whole-catalog report records none in each category: lost coverage, running Manual carriers, stale Automation paths, disagreeing statuses and unread fields. No manual catalog sweep was performed.

The seven downgrades above arise from whole-case assertion review, not a missing running ID. Every changed status was applied both in its suite table and on its case line. Confirmed cases received their eligible Automation paths; Open partial cases have `—`. DRAG-2.24's Planner-owned Manual disposition is untouched.

## Stamps Added

Two title-only additions in `tests/ui/drag-target-classification.spec.ts`:

| Existing title | Added ID |
|---|---|
| DRAG-2.19: pickup tiers survive layer changes and a write answer, then clear at every drag end | DRAG-7.12 |
| DRAG-2.20: the ghost, copy, backdrop rows and non-target places carry no target tier | DRAG-7.12 |

These are Playwright surface mappings and require no internal-mapping approval. No retained legacy title, describe title, test body or runnable selection changed. No ID was removed by this reconciliation. The prescribed post-stamp title-diff/docs validation remains with QA; this role ran no commands to rebuild the supplied evidence.

## Review Log Answers

- **R1 / retained classification verdicts:** independently confirmed by the checked fixtures, DOM attributes, controlled requests and saved API assertions described in Coverage Mapping. All thirteen retained assignments become Automated. Removing the parity hovers preserves enumeration, expected pickup states, cancellation and every-target replay. The listed aiming corrections do not replace the rule assertions with an implementation prediction.
- **R2 / DRAG-2.7:** resolved by Nathan's explicit approval and the two-Card internal carrier described above. Its approved Automation path is added; its existing title is unchanged.
- **R3(a):** resolved. The shared parity test retains all classified-target and API assertions; DRAG-2.4 separately observes the named transitions. No repeated static hover is needed for either case.
- **R3(b) / DRAG-2.12:** no case-level gap. Attach plus detach prove both catalog setups; the extra attached-A reparent branch remains as Nathan directed. Its cost question stays in Drag Automation Deferrals.
- **R3(c) / DRAG-2.23:** the full surface matrix proves all named outcomes and remains as Nathan directed. No internal replacement is proposed.
- **R4 / DRAG-7.12:** the original legacy-carrier Given limitation is confirmed, but whole-case coverage is resolved by the two new surface carriers and stamps above. The legacy tests are unchanged.
- **R4 / remaining seven legacy gaps:** confirmed and still open, as itemized below. Nathan's deferral routes their repair; it does not approve whole-case coverage. Their statuses and Automation fields now disclose that result.
- **T3 / DRAG-2.8:** its skipped surface carrier contributes no coverage. The existing internal classifiers prove only part, so it stays Open under Nathan's deferral.
- **Existing DRAG-7.18 hold-off:** both surface variants are skipped. Reset/restart clock tests do not prove repeated actual modal openings and final save; it stays Open.
- **Other proposed mappings:** the DRAG-7.14 padding carriers supply a fitted-window placement observation, but not DRAG-7.15's complete approach/subtree/release matrix from that Given; no stamp alone closes it. The old DRAG-2.22 stamp removed from the DRAG-7.21 carrier was partial; DRAG-2.22 is now proved by its dedicated surface carrier. No declined mapping is revived.
- **Cost verdicts and correction notices:** the Simplify/Keep dispositions remain settled as the Scope records. The tests' observations support the accepted correction verdicts; skipped DRAG-2.8 remains a gap. No further authoring, legacy repair, visual ruling or cost-only variant is requested by this reconciliation.

## Proposed Internal Mappings (need approval)

None unresolved. DRAG-2.7's approval is already explicit in the fixed plan. Newly confirmed cases have surface proof, so no parallel internal mapping is proposed. Existing approved DRAG-7.14 clock tests and DRAG-7.16 geometry tests were read; they do not supply the missing surface clauses below.

## Proposed Manual (need approval)

None. The gaps below are precise behavior or fixture assertions and are automatable; a skip or cost deferral supplies no Manual approval. The Planner-owned Manual looks/feel cases remain unchanged.

## Gaps

All nine cases below have status Open and Automation `—`. Their repair is deferred to `docs/planning/tech-debt-stories/drag-automation-deferrals.md` by the accepted dispositions and `docs/planning/mvp-deferrals.md`. Partial stamps remain; no app diagnosis or test repair is made here.

| Case | Test file and title | Missing proof |
|---|---|---|
| DRAG-2.8 | `tests/ui/drag-target-classification.spec.ts`, **“DRAG-2.8: a Stub drag uses the Card classification rules and non-target places have no classification”** (skipped). `client/src/components/workflow/dragClassification.test.ts`, under **“DRAG-2.8: classifyDragTargets — Stub drag (full classification)”**, titles **“a Stub is classified exactly like a Card would be — its own parent, its siblings, and every other Card/Stub included, no blanket exclusion”**, **“DRAG-2.17: a Stub's own descendants are still Cycle-forming, the Free ones an anchor and the Stubs neither”**, and **“depth-caps a target one level too deep for a Stub drag exactly like a Card, cap = %i”** are running partial carriers. | The internal tests cover Stub classification, not the complete named Unsorted/broken/expanded-wrapper no-classification, no-entry and no-write outcomes. The whole surface carrier is skipped. No new internal whole-case replacement is present. |
| DRAG-7.13 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.13: a Free Card zoomed into P and held above R’s overflow row: a silent dwell, then a cue on the row, ending in the modal opening”**, **“DRAG-7.13: a Free Card zoomed into P and held below R’s overflow row, at its level, opens the modal as R’s last child”**, **“DRAG-7.13: a release before the cue completes commits a Free Card zoomed in ${gap} R’s overflow row where its ghost is, and the modal never opens”** (`gap` above/below), and **“DRAG-7.13: any item at the layer opens it: B, below the overflow row, as R’s last child”**. | Stages, both gaps' early-release/save outcomes and Stub-origin opening are asserted, and the Free Card's root state is read back. The shared tree's parent/attachment/order Given is not asserted before these gestures: `seedOverflowTree` uses status-checked creates without topology assertions. The new DRAG-2.22 Full-overflow control does not supply this case's complete named tree, early-release and both-gap behavior. |
| DRAG-7.14 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.14: the hold starts over when the ghost changes level or gap”**. | It checks reset, disappearing cue and changed gap, but not modal absence after the final gap change. Other same-file DRAG-7.14 leaving/padding/within-gap carriers and `client/src/components/workflow/popSession.test.ts`, **“DRAG-7.14: resets when the gap, the depth or the side changes, and the cue goes at once”**, **“DRAG-7.14: runs on from the same start while the cursor moves into the Card’s title or padding, through the dwell and the cue, and completes there”**, **“DRAG-7.14: the hold starts over after it ended, with a fresh dwell”** and **“DRAG-7.14: resting outside the layer ends the hold: it runs with the cursor inside”**, cover the remaining logic, not that omitted modal outcome. |
| DRAG-7.15 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.15, DRAG-7.19: the modal opens with the ghost’s spot under the cursor, so a release right after commits the same placement, and the modal stays where it opened”**; **“DRAG-7.15: held ${approach}, to the gap ${gap} R’s overflow row, for an item ${child}, the modal opens with the ghost’s spot under the cursor and a release right after commits it”** (from above/below; above/below; with a child of its own/without one); and **“DRAG-7.15: held from above, down to the gap above R’s overflow row, the modal opens with the ghost’s spot under the cursor, and a release right after commits it”**. | The gap/approach/subtree/save matrix is asserted, but these carriers do not establish that placement under the cursor fits inside the window without edge shifting. `expectInside` establishes cursor containment only. The DRAG-7.14 padding tests check clearance from all four edges but cancel without this case's save/matrix. Stamped internal placement/reseed/render tests do not establish that missing Given in these surface scenarios. |
| DRAG-7.16 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.16: a modal kept inside the window at the bottom edge reads the ghost afresh from the cursor”**, **“DRAG-7.16: a modal kept inside the window at the top edge reads the ghost afresh from the cursor”**, and **“DRAG-7.16: a modal kept inside the window at the right edge reads the depth at the cursor’s x”**. | The Then requires the whole modal inside the window. Vertical-edge carriers check vertical bounds only (the top case checks its top coordinate); the right-edge carrier checks horizontal bounds only. `client/src/components/workflow/modalPlacement.test.ts`, **“DRAG-7.16: is pulled inside the window at %s”**, checks the relevant clamped coordinate and cursor containment, not all four rectangle bounds. Fresh reading/save assertions do not supply the omitted containment proof. |
| DRAG-7.17 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.17: when R’s children run longer than the modal, its list scrolls to put the ghost’s spot under the cursor”** and **“DRAG-7.17: from the gap above R’s overflow row, a list that scrolls puts the ghost’s spot under the cursor too”**. | Scroll, ghost/cursor placement, both selected gaps and saves are asserted. The long tree's parent/attachment/order Given is not asserted before the hold. The internal numeric scroll tests in `client/src/components/workflow/modalPlacement.test.ts` do not check these surface fixtures or final saved placements. |
| DRAG-7.18 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.18: after leaving a modal a hold opened, P’s own Stub held beside an overflow row opens it again in the same drag”** and **“DRAG-7.18: after leaving a modal a hold opened, a Free Card zoomed in held beside an overflow row opens it again in the same drag”** (both skipped). | No running carrier proves two reopenings in one drag, the required re-entry sequence, same Descendants layer, no intervening writes and final selected save together. `popSession.test.ts`'s **“DRAG-7.14: the hold starts over after it ended, with a fresh dwell”** and **“a pop out of the layer starts a fresh session, with no hold carried over”** prove mechanics only. |
| DRAG-7.19 | `tests/ui/drag-7-hierarchy-modal.spec.ts`, **“DRAG-7.19: after a release in the modal it stays open where it is, showing the item where it landed, marked pending until the response lands”**, **“DRAG-7.19: Escape during a drag in the modal cancels the drag and leaves it open; with no drag running, Escape closes it”**, and **“DRAG-7.9, DRAG-7.19: set back down in its own gap and depth, an item writes nothing, and the modal stays open where it is”**; plus the combined DRAG-7.15/DRAG-7.19 title above in `tests/ui/drag-7-modal-hold.spec.ts`. | Clicked-modal release/pending/answer/pickup/cancel/no-write behavior and held-open release persistence are covered. No carrier asserts same-position persistence after cancel in a held-open modal. The new DRAG-2.20 carrier cancels after checking modal tiers, without asserting its post-cancel position/persistence; it cannot close this clause. |
| DRAG-7.25 | `tests/ui/drag-7-modal-hold.spec.ts`, **“DRAG-7.25: after a reload that follows a release in it, a modal a hold opened is centered”** and **“DRAG-7.25: after a reload that lands mid-drag, a modal a hold opened is centered”**; `tests/ui/drag-7-hierarchy-modal.spec.ts`, **“DRAG-7.23, DRAG-7.25: after a release in the modal whose write failed, the reloaded board leaves it open, centered, with the rows as the server has them”**. | The held-open tests check off-center before and centered after reload. The clicked-modal carrier checks centered only afterward, leaving “stays centered across the reload” without its initial centered assertion. `HierarchyModal.test.tsx`, **“DRAG-7.25: a modal that mounts with the cursor’s anchor and no drag running is centered, as a click opens it”**, and `modalPlacement.test.ts`, **“DRAG-7.25: puts a dialog that fits in the middle of the window, with the list unscrolled”**, do not establish that clicked surface before/after sequence. |

## Duplication

Reported without a removal decision:

- DRAG-2.1/DRAG-2.2/DRAG-2.3: the shared surface carrier overlaps `client/src/components/workflow/dragClassification.test.ts`'s **“DRAG-2.1: a legal target is Valid”**, **“DRAG-2.2: the dragged item and every descendant are Cycle-forming, regardless of attachment”** and **“DRAG-2.3: depth-caps a target one level too deep, parameterized on cap = %i”**. No new internal Automation path is added beside their whole surface coverage.
- DRAG-2.14/DRAG-2.15/DRAG-2.16/DRAG-2.17/DRAG-2.23: their dedicated surface titles overlap the same file's **“DRAG-2.14: is "parent" for a legal parent, a Free Card or a Stub”**, **“DRAG-2.15, DRAG-2.16: is "anchor" for a Free Card that is no legal parent, whatever its parent, and for a Stub too deep under a legal parent”**, **“DRAG-2.15, DRAG-2.16, DRAG-2.17: is "neither" for a Stub whose parent is no legal parent, at any depth below it”**, and **“DRAG-2.23: reads a descendant by the Stub test it is handed, not its stored attachment”**. The internal tests cover parts rather than the complete surface outcomes; no new internal mapping is proposed.
- DRAG-2.12/DRAG-2.23: `client/src/components/workflow/useBoardDnd.test.ts`'s **“DRAG-2.12, DRAG-2.23: classifies an item a pending attachment puts in the dragged Card as its descendant”** and **“DRAG-2.12, DRAG-2.23: is still a descendant of its parent, and now a Card of its own, so an anchor”** overlap the new controlled-write surface tests. No new internal Automation path is added.
- DRAG-2.14–DRAG-2.21: partial rendering coverage in `client/src/components/dragChrome.test.tsx` overlaps the surface tier observations, including **“DRAG-2.14, DRAG-2.20: draws a legal parent, the carried copy and a row with no drag at full strength”**, **“DRAG-2.18: draws an overflow row by its owner: a legal parent in full, anything else as neither”**, and **“DRAG-2.21: draws the tier on the content and never on the root”**. Class/wrapper assertions are not painted-strength proof or new internal mappings.
- DRAG-7.12 now has the two newly stamped classification carriers plus its two existing partial modal carriers, detailed in Coverage Mapping. DRAG-2.22's carried-overflow clause appears in both its dedicated carrier and the two existing overflow-row titles listed there. DRAG-2.10 keeps its route and surface checks. The combined parity carrier intentionally maps five classification cases and ATT-4.9.
- DRAG-7.13–DRAG-7.17/DRAG-7.19/DRAG-7.25 retain their existing multi-carrier partial coverage, detailed under Gaps. DRAG-7.13/DRAG-7.21 also overlap `descendantsProjection.test.ts`'s **“DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state”**. No duplicate is removed or re-weighed here.

## Test Quality Concerns

No mapped whole-case proof was found tautological. The classification tests derive expected legality/tiers from checked topology and the wiki cap rule, observe live app attributes, and compare actual saved API responses. `restoreTargetRows` restores and reads state rather than computing expected classification. Deferred-write helpers gate the request before server save; held-answer helpers retain the real answer, so pending-state assertions distinguish stored and previewed trees.

The missing Given and assertion clauses are already the gaps above, grounded in wiki board-drag-interaction §7.3 and §9 and the testing strategy's Given-before-When rule. Their dispositions remain deferred. The DRAG-2.12 extra attached-A branch is not cited as the Free-A proof. No new cost-only concern is opened; the accepted R3 and legacy cost notes remain in Drag Automation Deferrals. Ghost classes/target-tier attributes are read as state, with no claim to prove DRAG-2.24's painted look.

## Uncatalogued Tests

No newly authored test in the range is without a catalog ID. `tests/helpers/dragTargetScenario.ts` declares helpers, not tests. The unchanged internal guards read while checking mappings—`dragClassification.test.ts`'s **“classifies every item on the board, and nothing else”**, **“returns an empty classification for an unknown active id”**, **“is none for the carried item”** and **“is none for an id that is not on the board, and a tier for every other item”**—check helper completeness/unknown-input behavior. They receive no forced standalone business-case mapping.

## Candidate New Cases

None raised. Additional drag variants, hardening and cost/flakiness re-weighing belong in `docs/planning/tech-debt-stories/drag-automation-deferrals.md` under the MVP deferrals catalog. The accepted DRAG-2.12 extra-branch and DRAG-2.23 matrix choices introduce no new case or current-scope work.

## Totals

The supplied report counted 488 cases in 44 suites, with 123 test files declaring 1,810 tests, 16 skipped. Those test/suite counts are unchanged by the two added title stamps.

Status changes: thirteen Open → Automated (DRAG-2.4, DRAG-2.12, DRAG-2.14, DRAG-2.15, DRAG-2.16, DRAG-2.17, DRAG-2.18, DRAG-2.19, DRAG-2.20, DRAG-2.21, DRAG-2.22, DRAG-2.23, ATT-4.9); seven Automated → Open (DRAG-7.13, DRAG-7.14, DRAG-7.15, DRAG-7.16, DRAG-7.17, DRAG-7.19, DRAG-7.25). DRAG-2.7 and DRAG-7.12 receive Automation-path changes while retaining Automated.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| P0 | 141 | 6 | 0 | 1 | 0 | 148 |
| P1 | 208 | 36 | 6 | 0 | 0 | 250 |
| P2 | 70 | 13 | 4 | 1 | 2 | 90 |
| Total | 419 | 55 | 10 | 2 | 2 | 488 |

Within this reconciliation's 29 cases: 20 Automated, nine Open; no Manual proposal, unresolved internal mapping or case-text change.

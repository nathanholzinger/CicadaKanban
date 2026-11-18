# Epic 3.5 Story 10 — batch 4h. The six legacy skips

**Type:** story plan, one batch of Story 10 · **Written:** 2026-11-13, moved from [Story 10's batch doc](story-10-batches.md), whose standing rules and four stops govern it · **Status:** closed at Stop 2 and committed in `e8cf4f2c`. Its Stop 4 is folded into Story 10's Phase 5, where [the close](story-10-close.md)'s slices 1 and 3 take this file's Review log and Living-docs handoff (Nathan, 2026-11-17)

This file is the batch's plan. It holds the batch's cases, its Proof list, its suggested variants, its Results packet, its Open questions and its Review log, and the Reconciler reads it at the batch's close. A session for this batch reads root `AGENTS.md`, its persona, the batch doc's standing rules and stops, this file, and the cases and wiki sections in scope. It doesn't read the other batches' files or [the 4a to 4d log](story-10-batch-4a-4d-log.md).

## The batch

Moved word for word from the batch doc. "Above" and "below" in it refer to that doc as it stood before the split.

### 4h. The six legacy skips

**DRAG-3.16 moved to 4i (Nathan, 2026-11-12).** It was restored here on 2026-11-10; its text is now in 4i.

The six legacy skips carry no catalog IDs. Their separate disposition remains as item 3 says:

1. re-check the precision problem they were skipped for, since a column drop now lands where the ghost is;
2. then re-derive each against DRAG-3 and 4b's DRAG-4.5, or delete it where its API twin pins the math.

## Proof list

Nathan changes this batch's opening step to a coverage-value assessment of the six old skips. Check whether a current case needs each gesture before attempting to repair it, and prefer a passing test that can inherit a residual clause. On 2026-11-17 he approves the resulting six-file scope and deletion of all six legacy skips. This approval concerns these six declarations, not the other deferred skips in the repository.

### Scope

| Approved file | Change |
| --- | --- |
| `tests/ui/item-repositioning-cross-column-dnd.spec.ts` | Delete skipped 1.a and 2.a; update obsolete comments. |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | Delete skipped 1.a, 2.a, 2.b and 4.b; remove their comments, unused imports and empty group. |
| `tests/ui/drag-contexts.spec.ts` | Add DRAG-1.23 to the existing re-entering variant's title only. |
| `client/src/components/workflow/dragCollision.test.ts` | Add DRAG-1.23 to the existing one-neighbor/both-leans test's title only. |
| `client/src/components/workflow/dragRequest.test.ts` | Nathan's additional one-line approval: add DRAG-1.23 to the existing empty-target bare-workphase request test's title. |
| This plan | Record the decisions, evidence, review and next stop. |
| [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) | Record the removed combinations and coverage/cost tradeoff. |

### Disposition of the six declarations

All six were unstamped and skipped, so none contributed a current mapping or counted coverage. Their numeric expectations remain valid for their intended anchor requests; their center/quarter aims did not establish the ghost, highlighted anchor or current context needed to derive those requests.

| Deleted declaration | Current proof retained; why no repair is needed |
| --- | --- |
| Cross-column 1.a — C onto A | DRAG-1.23's running first-slot gesture in `drag-column-bands.spec.ts`, the existing first-slot re-entry observations in `drag-contexts.spec.ts`, and API twin 1.a's prepend resolution. The interleaved-column prepend is an extra combination. |
| Cross-column 2.a — C onto B | DRAG-3.1's Board-layer top-band gesture, TC-7.4's API hidden-neighbor resolution and existing approved request-rule mapping in `dragRequest.test.ts`. The old direct center release asserts neither Board layer nor destination pop-in. DRAG-3.4 and DRAG-4.5 already distinguish target pop-in and quick placement versus held attach. |
| Cross-project 1.a — C onto A on the filtered inherited board | The same first-slot proof, API twin 1.a, and the still-running filtered-board 1.b/3.a/3.b gestures. A is the true first row too, so this is not a missing instance of TC-7.4's unseen-before-first condition. |
| Cross-project 2.a — C onto B on the root board | DRAG-1.2's running B/before gesture checks the gap, highlight, exact request and saved result. TC-2.33's API tests prove foreign-project anchor acceptance and retained membership; running UI 4.a also exercises a foreign-project anchor with membership retained. |
| Cross-project 2.b — C onto E, described as after D | DRAG-1.2 covers the named-neighbor gesture, running DRAG-1.24 3.b saves E/before at 4.5, and TC-2.33 API 2.b actually sends D/after. D/after and E/before share a number but are different requests: E is in C's project, so the old numeric-only test could pass without exercising a foreign-project anchor. |
| Cross-project 4.b — D onto A, then visit project 1b | The first-slot proof, API twin 4.b and running UI 4.a's reverse foreign-project placement/project-order flip. The deleted test's final `projectOrder` is an API sort, not a painted-order observation; no unique screen clause is removed. TC-1.1 separately proves that boards read one scalar. |

The historical comments report repeatable wrong-anchor outcomes, and commit `a6ea6d43` introduced the tests already skipped. This is not evidence of a current intermittent failure or a known green-then-flaky baseline. No old skip was unskipped to classify its flakiness, since restoring it would add no required clause.

### Mapping answer and the three title-only additions

Deleting these six removes **no case ID, Automation pointer or running case carrier**. The existing mappings for DRAG-1.2, DRAG-1.23, DRAG-1.24, DRAG-3.1, DRAG-3.4, DRAG-4.5, TC-7.4 and TC-2.33 stay in place. Their active tests and API twins remain unchanged.

Three existing tests additionally receive DRAG-1.23 stamps to make the finer clause evidence explicit:

| Existing test | Clause already asserted; mapping action |
| --- | --- |
| `tests/ui/drag-contexts.spec.ts` — the freely-following Board copy **re-enters and saves A/before** | First-slot A/before highlight, exact single request, painted X/A/B, unchanged workphase/parent/attachment. Only the re-entering variant receives DRAG-1.23; the own-middle/no-write variant does not. |
| `client/src/components/workflow/dragCollision.test.ts` — **at either end there is one neighbor, whichever way it leans** | First-slot A/before and last-slot B/after for both lean directions. This is the already-approved pure client ordering/request-rule category, which includes which anchor a placement names. Assertions, fixture and called code are unchanged. |
| `client/src/components/workflow/dragRequest.test.ts` — **empty others: first/last send a bare workphase move, no anchor to resolve** | A Free W1 origin, an empty W2 target and a first slot produce exactly `{ workphaseId: W2 }`. The reviewer proposes this supplementary request-adapter mapping; Nathan approves its seventh-file title-only edit. It proves neither the real pop-in nor saved position on its own; the retained empty-Review surface carrier supplies those observations. |

These are supplementary partial mappings, not replacement tests or a new whole-case certification. The existing first/last/empty-destination DRAG-1.23 carriers remain. Independent coverage confirmation and the catalog's additional Automation paths belong to reconciliation.

### Cost assessment

1. **What do the precise steps buy?** Another pointer route to the same first/interior slot or global scalar. The old scripts do not assert their intended ghost/context/anchor, so they also give weaker failure diagnosis than the current carriers.
2. **Would their failure reveal something cheaper evidence would not?** The API twins already distinguish workflow-wide scope from project/workphase scope; running gestures distinguish ghost placement, band placement and quick versus held release. The six combined fixtures are not additional named variants of those cases.
3. **Is this precision required by the Then?** Named ghost/anchor/band behavior is required. The old center/quarter aim, drag distance and exact numeric fixture combination are not additional gesture requirements.

**Decision:** Cut the six skipped declarations; reuse the existing observations above. Rough cleanup estimate: 0.5–1 h before independent review and validation gates. Repairing an old gesture is roughly 1–3 h each before review/repeats/full-suite gates, with additional investigation if reachability fails. Deleting already-skipped tests saves no measured runnable time. The removed combinations and tradeoffs are in Drag Automation Deferrals, with no required case deferred by this decision.

## Suggested variants

No new test variants are authored. The six removed legacy combinations are captured directly in [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) for future weighing; they are not commitments to restore them.

## Results

**Session:** batch 4h Stop 2, 2026-11-17. Stop 1's value assessment is approved. Stop 3 is not needed: no Coder, hook, app change or new internal test is required. Stop 4 has not started.

- **Baseline:** commit `b2f0b31920acabe42d80e4a7fb946af8b68ab78b`, tree `1e5a6e6cf7fb0bc52c8e4752bda6aa9341744069`. Focused E2E/root-gate and initial review snapshot: `16627c5a1048e3a6e216bbf79d9e9450289a8e05`. The only subsequent test-source change is the approved empty-request title stamp, assessed by the same reviewer and validated in its unit file; other edits update the docs packet.
- **Applied:** six unstamped static skips deleted; three existing tests stamped with DRAG-1.23; comments/imports/empty group cleaned up. No surviving test's assertions, setup, waits, gesture or expected value changed.
- **Files:** the six initially approved files plus the separately approved `dragRequest.test.ts` title-only addition, all in Scope. Helpers, app source, API twins, wiki and catalog remain unchanged.
- **Case state:** no case newly authored or held off by this cleanup. Existing mappings remain; the three additional DRAG-1.23 partial mappings await closing catalog reconciliation. Independent review may identify pre-existing limitations separately from deletion regressions.
- **Evidence before edits:** `tests/output/batch4h-analysis-catalog.md` (488 cases; 1,829 declarations; 15 static skips; no global catalog findings); `tests/output/batch4h-stop1-legacy-skip-analysis.md`; `tests/output/batch4h-stop1-root-check.log` (`npm run check` passed, 1,881 unit tests).
- **Prior runtime evidence reused for analysis:** `tests/output/batch4g-stop4-final-full-e2e-after-legacy-skip.json`. Cited running carriers passed; all six remained skipped. Its frozen tree `5a2cc31f2f74e5e71c151617a6611dded789d121` differs from the baseline in no `tests`, `client`, `server` or Playwright config source. This is not a new 4h certification.
- **Current checks:** `tests/output/batch4h-stop2-final-catalog.md` reports 488 cases, 1,823 declarations and 9 static skips, with no lost coverage, stale Automation paths or other global findings. Status totals are unchanged (450 Automated, 24 Open, 10 Manual, 2 Planned, 2 Pending PO). All three supplementary paths now carry DRAG-1.23. These are static catalog totals, not a new confirmation of every case's coverage.
- **Title/selection evidence:** `tests/output/batch4h-stop2-final-title-only.diff`; `tests/output/batch4h-stop2-final-surviving-body-check.json` confirms all surviving callbacks in the five test files are unchanged; `tests/output/batch4h-stop2-selection-comparison.json` confirms the three UI files retain the same 29 runnable variants after ID prefixes are stripped, with only the six skipped declarations removed. The list is `tests/output/batch4h-stop2-selection.json`.
- **Focused E2E:** `tests/output/batch4h-stop2-focused-e2e-local-stacks.json`: 29 passed, 0 skipped, 0 failed, 0 flaky, every test one attempt, at five workers; 18 `drag-contexts` variants, 7 cross-column and 4 cross-project tests. Duration 62.75 s. The newly stamped re-entry variant passed. The earlier sandbox attempt, `tests/output/batch4h-stop2-focused-e2e.json`, failed to start a configured web server before any test ran (0 test attempts); the permitted local-stack run used unchanged test/app source. No assertion, aim or timing correction followed either run.
- **Root gate:** `tests/output/batch4h-stop2-root-check.log`: `npm run check` passed, including 444 server, 1,110 client and 327 scripts tests, docs/lint/type/format checks. The newly stamped pure anchor test ran in that gate. No final full-suite run or formal repeats have run for 4h.
- **Additional title validation:** `tests/output/batch4h-stop2-drag-request-unit.log`: the empty-request file passed all 29 tests after its approved stamp. This is a rerun of existing unit tests, not 29 new tests.
- **Documentation:** final `check:docs` passed (461 files, 0 hits); final `git diff --check` passed. The handoff snapshot and evidence paths are recorded in `tests/output/batch4h-stop2-handoff.json`.
- **Independent review:** the one authorized read-only Test Reviewer confirms no deletion regression and accepts all three supplementary DRAG-1.23 associations as partial evidence. Its verbatim verdict below finds pre-existing verification gaps in DRAG-1.2, DRAG-1.12, DRAG-1.22, DRAG-1.23, DRAG-1.24 and DRAG-4.23. These are recorded with cost notes in Drag Automation Deferrals; no assertion/fixture repair is authored in this cleanup. Four other reviewed cases are proved. The seventh-file rename exemption avoids a new full review of its other 25 unchanged IDs. No shared infrastructure changed, so no shared-infrastructure code review is required.
- **Review limits:** DRAG-1.23 still lacks pre-release first/last ghost observations, an explicit last-slot outgoing request and a stamped complete no-comparable-position fallback. The two proposed pure fallback associations in the verdict are partial closing-handoff candidates, not additional approved edits or complete saved-append proof. The review's other gaps concern initial Given checks and DRAG-4.23's sustained-hold check. None was covered by the deleted skipped bodies.
- **Next owner/action:** Nathan reviews the Stop 2 packet. No Coder work is needed for the authorized cleanup. Stop 4 has not started; its Reconciler must judge the recorded gaps and case statuses independently, rather than treating the new stamps or static totals as whole-case certification. No further app/test command is queued for this stop. Final documentation verification is recorded below.

## Open questions

No PO, Planner or Coder rule/behavior question. Nathan's deletion, three stamps and file-scope decisions are applied. The widened review's pre-existing verification findings are recorded in Drag Automation Deferrals. No repair, new internal test or extra mapping outside the seven-file scope is silently added; the closing Reconciler receives the unresolved verdicts and proposed partial mappings.

## Living-docs handoff

For the closing Reconciler: deletion removes no ID-bearing declaration and no existing Automation path. Judge the three DRAG-1.23 additions against its current Then; add `tests/ui/drag-contexts.spec.ts`, `client/src/components/workflow/dragCollision.test.ts` and `client/src/components/workflow/dragRequest.test.ts` to its Automation line if confirmed. Preserve valid existing first/last/empty-destination associations, but judge whole-case status against the unresolved review findings. No approval to leave an unproved case Automated is implied by the deletion decision. QA does not edit the catalog.

## Review log

The QA Engineer appends the desk's questions and replies (each quoting the Then it read), every Test Reviewer verdict and Nathan's declined mappings here, word for word. Results may be replaced; these entries may not. At the close the Reconciler answers each open verdict from the tests.

### Stop 2 — Test Reviewer, first pass, 2026-11-17

Scope: original ten case IDs, plus the new DRAG-1.23 association in `dragRequest.test.ts`. Its other 25 IDs were not freshly reviewed: the seventh-file change is title-only, applying the QA persona’s rename exemption. No files were edited, tests run, or implementation bodies inspected.

### Case verdicts

- **DRAG-1.1 — Proves the case.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.1: pickup chooses exactly the ${kind} starting context”**, checks merged-column, expanded-sub-row, Unsorted and nested-Stub pickups against the app’s actual context and state attributes. Free pickups also check the single active region and its separation from the header/footer. `tests/ui/drag-5-stub-detach.spec.ts`, **“DRAG-1.1, DRAG-5.13: B22 nested pickup uses the whole containing Card and carries its child out of the section drawing”**, confirms the containing Free Card’s Descendants context for a nested Stub.

- **DRAG-1.2 — Test gap: the starting rendered order is not asserted before the gesture.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.2: the A/B gap saves its highlighted ${…} relation”**, seeds `A,B,Q,X` but first observes order after moving X. It could pass from an already reordered starting list. Its Then checks are otherwise complete: painted gap, both highlighted relations, exact outgoing request, saved placement and unchanged workphase/parent/attachment.

- **DRAG-1.3 — Proves the case together.** `tests/ui/drag-contexts.spec.ts`, both **“a freely-following Board copy …”** variants, observe the reached popped-out state, absent context/active region and independent pointer following on both axes. `tests/ui/drag-column-bands.spec.ts`, **“DRAG-1.3, DRAG-1.12: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left”**, explicitly confirms the initial locked context before leaving it. `client/src/components/workflow/popSession.test.ts`, **“DRAG-1.3, DRAG-1.30: outside for >= popDelayMs pops out — the card belongs to nothing and the pop-in clock starts now”**, checks the separate entry clock without depending on tuned durations.

- **DRAG-1.9 — Proves the case.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.9: Board release over ${place} has no candidate, pop-in or request”**, covers every named nowhere location. It confirms Board state, absent region/band/zoom candidate, no outgoing write, equality with the previously read saved item and rendering back in the origin. The retained Unknown-status and between-column carriers provide additional partial evidence.

- **DRAG-1.12 — Test gap: the named release precondition is not observed.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.3, DRAG-1.12, DRAG-1.23: a freely-following Board copy re-enters and saves A/before”**, observes re-entry, A’s before highlight, the exact request and final `X,A,B` order, but never observes the ghost directly above A before releasing. It also does not assert initial rendered `A,B,X`. The non-re-entering variant proves the required Board-middle-band no-write outcome. The older `drag-column-bands.spec.ts` carrier releases an alone Card and does not supply the missing first-slot observation.

- **DRAG-1.22 — Test gap: the starting rendered order is not asserted before resting over the pickup place.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.22, DRAG-1.24: the own-slot ghost leaves neighbors still and saves A/after ahead of an unseen U”**, first asserts `A,X,B` after `hoverTo(from)`. Its neighbor measurements do check that the resting movement leaves the post-pickup geometry unchanged, and its painted-order assertion checks the resulting own slot. The explicit Given should be confirmed before that movement.

- **DRAG-1.23 — Test gap: the supplementary mappings prove useful parts, not the whole case.**

  `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.3, DRAG-1.12, DRAG-1.23: a freely-following Board copy re-enters and saves A/before”**, proves A’s before highlight, the exact A/before request and saved first placement. It does not observe the first-slot ghost before release.

  `client/src/components/workflow/dragCollision.test.ts`, **“DRAG-1.23: at either end there is one neighbor, whichever way it leans”**, proves the pure endpoint relation rule: A/before and B/after despite the two carried-center inputs at each end.

  `tests/ui/item-repositioning-cross-column-dnd.spec.ts`, **“DRAG-1.23: 1.b — drag C below card E, into the empty column space”**, proves saved last placement, but neither observes the last-slot ghost nor captures the outgoing E/after request. Its numeric result alone cannot distinguish that anchor from an append.

  `tests/ui/drag-column-bands.spec.ts`, **“DRAG-1.5, DRAG-1.23: a card is locked to each context it pops into in turn — In Progress, then Review”**, proves reaching the empty destination and retaining the existing position. The newly stamped request-adapter test supplies the empty-target no-anchor request clause.

  The sentence about an item with no comparable position landing last also has no currently stamped DRAG-1.23 carrier; existing partial candidates are listed below.

- **DRAG-1.24 — Test gap: the unseen item’s starting relation is not asserted.** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.22, DRAG-1.24: the own-slot ghost leaves neighbors still and saves A/after ahead of an unseen U”**, verifies that U is hidden, but does not assert `A.position < U.position < X.position` before pickup. Seeding those values and checking successful setup responses does not independently confirm this explicit Given. The exact A/after request, final X-before-U relation and unchanged visible order are asserted. **“DRAG-1.24: an alone Card picked up and set down sends no request”** proves the singleton no-write branch. The retained cross-column/project 3.a and 3.b carriers provide additional saved-order evidence.

- **DRAG-4.8 — Proves the case together.** `tests/ui/drag-descendants-placement.spec.ts`, **“DRAG-4.8: B11 ${…} gap depth ${state.depth} saves the painted placement”**, covers all four worked-gap depths, both clamps, the sole-state parent/child gap, painted placement, distinct writes and saved relationships. Its carried-child variant checks branch absence and excludes X/XC from the named neighbor. `client/src/lib/hierarchyPlacement.test.ts`, **“DRAG-4.8: depthRangeFor”**, the worked-gap resolution group and **“DRAG-4.8: leaves the excluded entries, and their descendants, out of the rows”**, establish the exact ranges and subtree exclusion. `dragCollision.test.ts`’s two DRAG-4.8 tests check neighbor naming against Stub-sized ghosts.

- **DRAG-4.23 — Test gap: the required sustained hold is not exercised.** `client/src/components/workflow/dragCollision.test.ts`, **“DRAG-4.23: alone in its list: nothing to anchor to”**, proves no named neighbor. `client/src/components/workflow/popSession.test.ts`, **“DRAG-4.23: nothing named (alone in the list, or hovering nothing): no candidate at all”**, samples only time 0 and asserts `hover === null`. It never advances beyond the configured full zoom-in hold or asserts continued locking/no scheduled dwell or cue there. These carriers prove the initial state, not the complete post-hold Then.

### Deletion regressions

**None.** All six deleted callbacks were unstamped `test.skip` tests. Skipped tests never counted toward case coverage, so their deletion loses no previously proved clause. The surviving callbacks are unchanged. This does not close the pre-existing gaps above.

### Corrections after a red run

None supplied.

### Held-off cases

None supplied.

### Supplementary and proposed mappings

- **Accepted partial association:** `tests/ui/drag-contexts.spec.ts`, **“DRAG-1.3, DRAG-1.12, DRAG-1.23: a freely-following Board copy re-enters and saves A/before”** → DRAG-1.23’s first-edge highlight, exact request and saved first placement. It does not verify the displayed ghost before release or either other branch.
- **Accepted partial association:** `client/src/components/workflow/dragCollision.test.ts`, **“DRAG-1.23: at either end there is one neighbor, whichever way it leans”** → DRAG-1.23’s pure endpoint anchor rule. This falls within the catalog’s approved client ordering/request category; it is not whole-case surface coverage.
- **Accepted partial association:** `client/src/components/workflow/dragRequest.test.ts`, **“DRAG-1.23, DRAG-3.10: empty others: first/last send a bare workphase move, no anchor to resolve”** → DRAG-1.23’s empty-target request-adapter clause. Its actual assertion exercises `slot: 'first'` with empty `others` and exactly expects `{ workphaseId: 'w2' }`. It does not itself test popping, the painted ghost, retained position or a `last` input.
- **Proposed partial association:** `client/src/components/workflow/placement.test.ts`, **“DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep”** → DRAG-1.23’s no-comparable-position fallback. It includes a popped-in state and expects `append`.
- **Proposed supporting partial association:** `client/src/components/workflow/itemListOps.test.ts`, **“'append' draws at the end, as 'last' does, whatever the position sort says”** → DRAG-1.23’s ordinal end-placement clause. It establishes what `append` draws; it does not independently prove a saved server append.

The two proposed fallback associations are closing-handoff candidates, not additional edits for this stop or a claim of complete coverage.

### Cost verdicts

- **Keep — DRAG-1.23’s re-entry association.** It reuses the existing DRAG-1.3/1.12 gesture and exact request observation, adding no gesture or wait.
- **Keep — DRAG-1.23’s endpoint-unit association.** Four direct calls cheaply exercise the endpoint/lean rule without additional surface gestures.
- **Keep — DRAG-1.23’s empty-target adapter association.** One direct request-shape assertion adds no surface cost.

These cost verdicts do not resolve the coverage gaps.

### Deferred

Existing drag-test precision, waits and variant-cost reassessment belongs in Drag Automation Deferrals under the MVP deferral for re-weighing existing drag automation; no broader cost re-review was undertaken.

## Amendments

- **2026-11-17 — Nathan:** assess the six old skips for unique current coverage before repairing any gesture, and use a passing test for a residual clause where cheaper. Approves the analysis report's six-file scope and deletion of the six legacy skips. This replaces the old precision-first order for this batch; it does not authorize deletion of other deferred tests or a change to any case's Then.
- **2026-11-17 — Nathan:** authorizes one read-only Test Reviewer and then extends the file scope by `client/src/components/workflow/dragRequest.test.ts` for the prepared one-line DRAG-1.23 mapping. No assertion or fixture change is approved in that extension.
- **2026-11-17 — Nathan:** closes the batch at Stop 2 and folds its Stop 4 into Story 10's Phase 5. The six deleted tests were skipped and the reviewer found they added no coverage, and the three stamps change no test body, so a separate freeze, full suite and Reconciler would repeat what Phase 5 runs anyway. Phase 5's Reconciler is the "closing Reconciler" this file's Results and Living-docs handoff name. Results' "Stop 4 has not started" and its next-owner line are left as the Stop 2 packet wrote them.

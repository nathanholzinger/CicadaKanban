# Story 10 batch 4a — workload and review boundaries

**Author:** Test Planner · **Date:** 2026-11-08 · **Scope:** retrospective from existing plans, agent reports, run metadata and file-change metadata. No app or test source was read by the Planner, no tests were rerun and no implementation was changed for this investigation.

## Findings

Batch 4a combined several kinds of work in one persisting session: test design and helper development, product-defect investigation, six Coder round trips, coverage review, long repeat validation, interrupted-run recovery and catalog close-out. Smaller case batches would reduce some of that work, but separate review and execution stages can divide it without reducing the behavioral scope.

The batch covered **34 catalog cases**, not 34 independently authored tests. It added **31 authored Playwright test expressions expanding into 89 drag variants**, across six new UI spec files, and extended the existing TC-6.4 test. Related tests cover several cases, so case counts and test counts are not interchangeable. All 89 drag variants then required twenty accepted passes: **1,780 executions**.

For example, DRAG-1.16 has fifteen origin/place variants plus its Descendants reorder; DRAG-3.10 has active/terminal destinations at three release positions; DRAG-1.18 has two origins at two positive distances. Some individual runtime tests also exercise several fixtures or layers internally. Counting catalog IDs alone hid that expansion.

Nathan reports three full five-hour usage windows plus two partial sessions. Saved runner metadata does not measure model reasoning time, context reconstruction, token use or time spent by each agent. It cannot provide a defensible percentage allocation of those usage windows. The measurements below are runner time and observed wall-time spans, not an accounting of total agent effort.

## Measured execution

Source: `tests/output/batch4a-runtime-cost.json`, the interrupted-result timing, final D2 acceptance, cohort JSON and final validation lease. Durations are rounded; the separate target is recorded as 2.3 minutes.

| Work                                                                    |        Recorded time | Interpretation                                                                  |
| ----------------------------------------------------------------------- | -------------------: | ------------------------------------------------------------------------------- |
| Initial interrupted repeat command, outside the two long recorded spans |             28.0 min | Runner wall time outside those spans; not a CPU-time measurement                |
| Separate reservation target, twenty repeats                             |              2.3 min | Final corrected precision observer                                              |
| Fresh unchanged DRAG-1.2 variant, twenty repeats                        |              1.2 min | Replaced that variant's interrupted history in acceptance                       |
| First continuation, 384 executions                                      |             14.0 min | 32 variants × twelve further passes                                             |
| Second continuation, 715 executions                                     |             34.2 min | 55 variants × thirteen further passes                                           |
| **D2 runner time outside the two observed stall spans**                 |   **about 79.7 min** | Sum of the five rows above                                                      |
| Long overlay-observation span and worker cleanup                        |    **about 310 min** | About 4 h 15 min plus 55 min; timing supports suspension/tool-delay attribution |
| Final full E2E                                                          |              7.9 min | 329 passes, 24 existing skips                                                   |
| Final root gate                                                         |              1.4 min | Types/lint/format/docs and 444 server, 1,023 client, 258 scripts tests          |
| Ten saved preflight commands                                            |            21.24 min | 435 executed results, including failures used during authoring                  |
| Three diagnostic/confirmation commands with durations                   |             1.81 min | Observer identity, post-projection and post-render checks                       |
| Seven failed-only diagnostic commands                                   | Duration unavailable | 28 executions; no terminal duration in their saved summaries                    |

The final repeat segments and final checks account for about **89 minutes outside the two recorded stall spans**. Including the timed preflight/diagnostic commands gives about **112 minutes of recoverable runner time**. This still excludes untimed reproduction runs, other early focused work, Coder verification runs, implementation, test authoring and review. A further roughly two-hour delivery gap occurred after repeat completion and before final validation; no tests ran in that gap. Later completed validation results also waited for the usage-limit interruption to clear.

The ten preflight summaries are the `bands`, `complete`, `context`, `final`, `layer`, `locked`, `locked2`, `stable` and `surface` preflight logs plus `batch4a-focused-stable.log`, all under `tests/output/batch4a-*`. The other timed commands are `batch4a-observer-identity.log`, `batch4a-post-projection-fix.log` and `batch4a-post-render-fix.log`. Only count/status/duration summary records were read to reconstruct this ledger; failure source snippets were not read.

The interruption added work beyond waiting: reconstructing per-variant counts, excluding seven overlapping successes, freshly checking the affected variant, selecting exact continuation lists, verifying unchanged source/test hashes and independently checking the combined proof. The final evidence retained one failed attempt and 1,787 successful attempts, of which 1,780 were accepted. It did not rerun the completed cohorts wholesale. Early per-file progress claims were wrong and had to be corrected because the runner repeated the whole selected group.

## Work that was not separately timed

| Workstream                          | Concrete scope in 4a                                                                                                                 | Why it kept the session open                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Authoring and fixtures              | Six new UI specs; one extended UI spec; a new shared board-surface helper and extensions to three existing helpers                   | Many cases require multiple origins, destinations, forms and pending/saved states                   |
| Assertion and observation questions | DRAG-1.16 wording, DRAG-3.19 description-space observation, fractional geometry and pointer-driving corrections                      | The Planner had to distinguish the business expectation from how the test observed or reached it    |
| Coder work                          | Six round trips, including four behavior fixes                                                                                       | Each added a diagnose/fix/regression/surface-confirmation cycle                                     |
| Coverage review                     | A proposing review, strengthened missing clauses, final confirmation and whole-catalog identity checks                               | Useful review caught incomplete proofs; repeated report maintenance and coordination added overhead |
| Recovery and close-out              | Per-variant acceptance reconstruction, fingerprints, title/skip preservation, status-field masks, formatting and inventory alignment | A large batch made the final evidence and resume state substantial                                  |

The existing Reconciler report enumerates 147 evidence references, including existing carriers and internal tests inventoried without new mapping approval. That is evidence-management scope, not 147 newly written tests. Its mandatory global checks cover all 485 catalog cases; they are identity/metadata checks, not a new whole-Then review of all 485 cases.

## Production changes and the review boundary

The working diff contains **seven production files**, plus client regression tests/fixtures and the server route test title. The production changes came through these Coder rounds:

| Round | Kind             | Case and intended behavior                                                               | Production files                                                                                                                                                        |
| ----- | ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Observation hook | DRAG-1.26: expose exactly the currently active rendered column/sub-row context           | `client/src/components/BandGuides.tsx`                                                                                                                                  |
| 2     | Behavior fix     | DRAG-3.18: populated done region labels its workphase, not the column's display override | `client/src/components/BoardColumn.tsx`                                                                                                                                 |
| 3     | Behavior fix     | DRAG-1.33: successful attachment keeps the temporarily opened target Card expanded       | `client/src/components/KanbanCard.tsx`                                                                                                                                  |
| 4     | Test title only  | DRAG-3.10: stamp the existing TC-2.24 route proof of append fallback                     | None; `server/tests/routes/items.positioning.test.ts` changes only its title                                                                                            |
| 5     | Behavior fix     | DRAG-1.5: immediate release after zoom commits the last-child relation                   | `client/src/components/workflow/descendantsProjection.ts`                                                                                                               |
| 6     | Behavior fix     | DRAG-1.5: the visible ghost/selected line agrees with that committed gap                 | `client/src/components/dragChrome.tsx`, `workflow/DragSessionContext.ts`, `workflow/descendantsProjection.ts`, `workflow/useBoardDnd.ts` under `client/src/components/` |

Rounds 5 and 6 overlap in one file. No server production file changed. The two DRAG-1.5 fixes addressed separate saved-intent and visible-placement failures; treating the first green saved result as the end would have missed the preview defect.

The recorded rule bases are wiki board-drag-interaction §1.1 for the active context, wiki board-drag-interaction §5 for the done label, wiki board-drag-interaction §1.1 and §6.1 for the attachment preference, and wiki board-drag-interaction §6 and §7 plus wiki hierarchy-placement §1 for immediate placement and its visible gap.

The [batch results](../planning/epic-3-5-stories/story-10-batches.md) and [confirming reconciliation](test-reconciliation-story-10-batch-4a.md) record prior failures, focused red/green regressions and later surface confirmation. That evidence supports the reported fixes. It does not substitute for Nathan's review or an independent implementation review of collateral behavior and wiki conformance. The Planner has not inspected these source changes and cannot certify that broader claim.

Three separate test-plan/observer changes also deserve explicit review:

- **DRAG-1.16:** the Planner clarified that a foreign/nowhere release commits the current locked-list ghost relation at release, rather than freezing the pickup relation. This was justified from wiki board-drag-interaction §1.1 and §2. It is the sole catalog-body change in 4a.
- **DRAG-3.19:** equivalent reserved description space was accepted without requiring an empty paragraph itself to be visible. The case remained unchanged. Geometry still had to prove the reserved space in empty/long and collapsed/expanded fixtures.
- **DRAG-3.17:** an independently added rectangle sum differed by about 0.0000305 CSS pixels. Its comparison changed to three-decimal agreement; the reservation rule and exact zone/restoration checks remained. This was a test measurement correction, not an app fix.
- **Driver and lifecycle corrections:** the sibling continuation stopped accidentally re-entering the prior target; immediate release stopped awaiting an extra settling observation while separate strict painted-gap checks remained; pending tests waited for the released response before route disposal. These changed how the scenario was reached or observed and belong in the review trail alongside expected-value changes.

These explanations and the Reconciler's inspection reduce the risk of assertions simply following implementation, but they do not remove the need for the check-in Nathan wanted. A passing suite alone is insufficient evidence of independence.

The Reconciler's existing review supports the 34 current cases in their exercised scenarios, using case/wiki comparisons, geometry, exact requests and fresh saved outcomes. It does not establish whole-application wiki conformance, Manual appearance/feel or completion of later batches. Preserved titles prove retained identities, not unchanged assertions. The focused unit red/green milestones are recorded Coder evidence rather than tests independently rerun by the Reconciler.

## Why the scope boundary was unclear

The main story's prior D7 allowed a small app fix to land in its finding batch, and D12 explicitly allowed the Coder and Automator to work side by side. The batch table's Coder count of zero meant no case closed by Coder work alone; it did not mean no production work. The Automator's own instructions meanwhile say to preserve a failing test, report it and let Nathan decide whether a fix precedes commit. Those instructions were spread across files.

The Planner relied on the small-fix provision to continue with in-session Coder work. The earlier explicit Coder approval concerned Phase 3's DRAG-6.25 app defect. It should not have replaced an explicit check-in about the four behavior fixes and hook found during 4a. The production scope should have been made concrete before those edits.

**Nathan's new direction is applied:** remaining automation batches may delegate to the Test Automator and Reconciler. All Coder work requires a separate handoff/session and Nathan's check-in, including internal tests, hooks and small fixes. D7 and D12 now state that boundary. No app/test implementation is changed by this retrospective.

## Proposed horizontal checkpoints

These stages are recommendations for the next batch, not an approved change to D2 or batch assignments. A checkpoint can be a reviewable handoff without a commit.

| Stage                                  | Deliverable at the stop                                                                                                                       | Scope boundary                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Contract and variant budget         | Case clauses, planned scenario/variant matrix, helper needs, known Coder dependencies and a representative check of each new fixture/observer | Confirm the expected proof and support readiness before broad expansion                      |
| 2. Test authoring and defect discovery | Tests/helpers, focused results, missing clauses and concrete defect/hook handoffs                                                             | App stays fixed; stop for Nathan when Coder work is needed; no long repeat certification yet |
| 3. Separate Coder and review           | Wiki-linked change manifest, regressions, original failing-test evidence and return validation                                                | Nathan starts a separate Coder session and reviews the result before automation resumes      |
| 4. Reliability certification           | Frozen app/test fingerprints, exact variant list, twenty-repeat result JSON, final full suite and root gate                                   | Execution/recovery is a separate task; no authoring or app repair folded into it             |
| 5. Reconciliation and closure          | Final clause mapping, global checks, catalog statuses and remaining-work handoff                                                              | Reuse the prior review and inspect changed evidence; retain mandatory final global checks    |

Changes that would reduce effort as well as divide sessions:

- Budget batches by expanded variants, setup novelty and known defects, alongside case counts. A smaller number of cases can still generate a large execution matrix.
- Review proof design before expensive repeats. The early Reconciler strengthening in 4a was useful; preserve that benefit without maintaining a finished coverage report throughout every authoring revision.
- Save exact selections, per-variant completion records and fingerprints from the first long run. Resume from those records rather than reconstructing them after a suspension.
- Give one agent ownership of each active run and one compact summary artifact. Root and worker both polling and maintaining overlapping narrative progress adds coordination cost.
- Carry existing reconciliation evidence forward and review deltas. Avoid repeatedly rebuilding the entire evidence register when source/test fingerprints show what changed.
- End each stage with a small resume packet: case state, changed files, expected assertions, unresolved questions, exact next command/selection and completed evidence. A fresh context should not need to reconstruct the whole conversation.

Reducing the twenty-repeat bar would reduce execution time, but it would not remove Coder discovery cycles, test-observer questions or the missing review boundary. D2 remains unchanged pending Nathan's decision.

## Review handoff before accepting the 4a production changes

For a separate Architect/Coder review, with PO input on rule interpretation: inspect the seven production files above against the cited cases/wiki, review collateral drag-layer behavior, and compare the retained pre-fix failures with the post-fix tests. Give special attention to DRAG-1.5's saved/visible gap integration and to the DRAG-1.16 and DRAG-3.19 interpretations. The existing Reconciler report supplies the detailed evidence; it is not a substitute for this separate review.

No separate Architect/Coder review session has been started. This investigation changes no implementation, repeat bar or batch assignment and starts no 4b work.

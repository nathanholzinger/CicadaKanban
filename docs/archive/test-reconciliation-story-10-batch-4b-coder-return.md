# Story 10 batch 4b — Coder-return proposing delta review

**Reviewed 2026-11-09 · PROPOSING ONLY.** Scope is DRAG-4.19, DRAG-4.20 and DRAG-4.22. This is a test classification/clock-proof review of the externally supplied Coder return, not an architecture audit or confirming close. All three cases and all 26 batch cases remain Open, with Automation `—`. No catalog, case, wiki, app/test, plan, staging or prior-report edit is made.

**Decision:** leave the five new sync tests unstamped as implementation/regression support. The five clock-title stamps and three new lifecycle tests now supply the previously missing deterministic DRAG-4.20/DRAG-4.22 clock proof. Those use the README’s already-approved clock category; no new internal-mapping approval is requested. Rendered cue, named-Card entry and release outcomes still require the existing surface tests.

Inputs: current Reconciler instructions, catalog README/testing strategy, current case Then text, wiki board-drag-interaction §6.1 and the §2/§3/§10 reset/release rules, relevant Coder deltas and paired tests. The pre-Coder [proposing report](test-reconciliation-story-10-batch-4b-proposing.md) stays frozen. Its unchanged surface design analysis is carried forward; this review does not re-audit the other 23 cases or later authoring.

The external return changes four production files (`client/src/components/BoardView.tsx`, `client/src/components/dragChrome.tsx`, `client/src/components/workflow/useBoardDnd.ts`, `client/src/components/workflow/descendantsProjection.ts`), three paired unit files and workflow `AGENTS.md`. The render-time bridge is installed once under the drag context; the hook reevaluates when its named answer changes. The existing equality helper is exported. These describe the implementation delta, not a new business rule or a revived retired request-identity contract.

## Coverage Mapping

| Case           | Case/wiki obligation                                                                                                              | Targeted conclusion and future pointer disposition                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRAG-4.19 / P0 | The Card entered is the actual highlighted neighbor, on either named side, regardless of bare-cursor target.                      | Keep surface proof in `tests/ui/drag-zoom-cues.spec.ts` (B06) and `tests/ui/drag-descendants-placement.spec.ts` (the unchanged B13 representative). Five sync tests below are support, not additional case pointers. The existing pure completion test is inventory/complementary logic, not a replacement for the surface. No status promotion.                                                                                       |
| DRAG-4.20 / P1 | Silent dwell, visible cue, then named-Card opening/context/form; early release repositions.                                       | B07’s actual cue/entry/release proof remains in `tests/ui/drag-zoom-cues.spec.ts`. The three current DRAG-4.20 tests in `client/src/components/workflow/popSession.test.ts` supply deterministic dwell/completion scheduling. That file is an eligible clock complement at a later confirming run. No remaining static clock-proof gap identified.                                                                                     |
| DRAG-4.22 / P1 | Card/side change resets both stages; pop/cancel clears them; return/new pickup starts fresh; release follows the current context. | B08 in `tests/ui/drag-zoom-cues.spec.ts` and B27 in `tests/ui/drag-card-zoom-in.spec.ts` retain rendered reset/release proof. Four reset tests in `client/src/components/workflow/popSession.test.ts` plus the cancellation lifecycle test in `client/src/components/workflow/useBoardDnd.test.ts` now supply the missing logic. Both unit files are eligible clock complements later. No remaining static clock-proof gap identified. |

The unchanged surface filenames/titles and whole-Then analysis are enumerated in the frozen proposing report. The decisive current title remains `DRAG-4.19, DRAG-4.34, DRAG-5.4: B13 foreign-stub from above follows the cursor to first`. New runtime evidence is distinguished below; static completeness is not Stop 5 closure.

### Clock carriers inspected

Five existing titles gain IDs without changing their callback assertions. Three new tests cover outside/pop-return/cancel lifecycle. The table gives each current exact title and the clause its body proves.

| Exact file                                           | Exact current title                                                                                                                                               | Clock proof                                                                                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-1.4, DRAG-4.20: holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone`                | Supplied tuning advances dwell to cue, while the context stays Column; dwell alone does not zoom.                                                                                    |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-4.19, DRAG-4.20: holding it through the cue zooms straight into the named Card’s Descendants layer, wherever the bare cursor happens to be`                 | The complete dwell+cue enters the named Card and clears the candidate. This does not replace real highlighted-neighbor surface proof.                                                |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-1.4, DRAG-4.22: a different named card resets the hold from the dwell, even mid-cue`                                                                        | A different Card midway through cue starts dwell at the new sample, discarding earlier progress.                                                                                     |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-1.4, DRAG-4.22: the same card on its other side resets the hold too`                                                                                        | Changing side on the same Card starts a fresh dwell and discards earlier cue progress.                                                                                               |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-4.22: leaving the column mid-cue clears the cue at once, and nothing counts toward a zoom in but the pop-out`                                               | An outside sample immediately clears cue/candidate while the Column is still locked; only the pop-out deadline remains.                                                              |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-4.22: a pop out leaves nothing of the hold, so the column entered again starts a fresh dwell`                                                               | Actual pop resets the session; return through Column pop-in creates a newly timestamped dwell, with no carried progress.                                                             |
| `client/src/components/workflow/popSession.test.ts`  | `DRAG-4.20: popDueAt schedules the dwell-end milestone first (so the cue can mount with the cursor perfectly still), then the final pop once the cue has started` | The scheduled milestone is dwell-end first, then cue-end. Tuned values are inputs, not a feel assertion.                                                                             |
| `client/src/components/workflow/useBoardDnd.test.ts` | `DRAG-4.22: a cancel leaves no clock counting toward a zoom in, and the next pickup holds nothing`                                                                | Fake-timer hook lifecycle proves cancellation removes session/timers; a fresh pickup remains without inherited hold even after a full configured hold interval, and no write occurs. |

The pop tests receive thresholds through shared test tuning and advance explicit logical samples; their result is not a judgment of tuned delay. Cancellation is owned by the hook, so its fake-timer/session test supplies that lifecycle half. It proves clock cleanup/fresh pickup, not real cue disappearance or Board-band release; B08/B27 remain necessary. This is the already-approved clock category, not a proposed extra internal mapping to replace the surface.

## Lost Coverage

**None across the whole 484-case catalog.** Every one of 352 Automated cases has an active qualified-ID carrier; none is skip-only. All existing skipped tests remain excluded from coverage. Actual skipped declarations remain 21 after the previously authorized reworks. The unchanged case and title inventory is checked globally, not just these three cases.

## Unknown IDs

**None in current test/describe title claims. No active or skipped test carries a Manual case ID.** Retired DRAG-4.35 has no current title claim; B09’s deferred seed line-place guard is not reinstated. No new ID is invented for the bridge or its tests.

## Proposed Stamps

**None for the five sync tests.** Keep their generic titles. The five intended clock stamps are already present, with three newly ID-bearing lifecycle tests; no further clock title stamp is required by this delta review. Other pre-Coder proposals/corrections remain with the separate authoring handoff and are not applied here.

## Proposed Internal Mappings (need approval)

**No new approval requested.** DRAG-4.20 may later use `client/src/components/workflow/popSession.test.ts`; DRAG-4.22 may later use that file plus `client/src/components/workflow/useBoardDnd.test.ts`, specifically for their approved clock clauses beside real surface proof. No `NamedAnchorSync`/`syncNamedAnchor` pointer is proposed. The README forbids adding an internal companion beside a whole surface case; baseline declined proposals remain declined. Even where the synthetic hook regression relates to DRAG-4.19, it adds no independent missing business clause to the existing full surface obligation.

## Proposed Manual (need approval)

**None.** Functional clocks/state remain automated obligations. Existing Manual paint/feel decisions are unchanged; a repair or runtime uncertainty is not a Manual reason.

## Gaps

No residual deterministic clock clause is identified for DRAG-4.20/DRAG-4.22 in the targeted return. Real rendering, entry and write outcomes remain surface obligations and need the later accepted-snapshot reconciliation/validation boundary. There is no confirming coverage or status claim here.

The pre-Coder report’s broader authoring/proof gaps are not closed by adding these units or obtaining a green suite. In particular, its B03 bootstrap-value issue is a different assertion obligation; an existing finite-position test passing does not establish the missing 1.0 assertion. Remaining matrix authoring and other corrections are outside this review.

The first full suite’s two moved-B03 failures remain recorded. Concurrent client test edits are a reported possible explanation, not a demonstrated cause. Subsequent passing runs do not retrospectively prove that attribution or erase those failures. No repair or expected-value change is inferred from that explanation.

## Duplication

Component callback-delivery tests and hook named-answer tests guard different sides of the same implementation bridge. They are useful supporting regressions, not five additional business cases. The clock units complement the surface’s rendered order/reset/release checks; they do not duplicate a Manual look or authorize deletion of a surface path. No test deletion is proposed.

## Test Quality Concerns

The sync tests intentionally inspect internal contracts, often mocked context/callback delivery or object identity. That is acceptable implementation support, but insufficient independent proof of actual painted highlight, sustained hold and FIRST entered Card. The hook’s unchanged-answer identity check in particular does not itself demonstrate elapsed clock continuity. Do not stretch its title into an additional case clause.

The eight clock carriers assert concrete logical transitions, scheduling/reset timestamps, timer cleanup and fresh sessions. Their expected answers are grounded in the named case/wiki rules; they do not ask production code to compute the expected transition for them. New reset/cancel proof fills the previous missing lifecycle clauses. None establishes real cue paint or physical entry by itself.

This bounded delta review is not an independent architecture audit of synchronization, scheduling or all integration paths. The production changes and execution results belong to the external Coder. The Reconciler reads the relevant return and classifies evidence; it runs no unit, E2E or application process.

### Durable execution evidence versus Coder reports

Two provided artifacts can be inspected directly:

| Artifact under tests/output          | Recorded result                                                               | Important retained detail                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `coder-named-anchor-full-e2e.json`   | 379 passed, 21 skipped, 2 failed; no flaky/runner errors; all retries zero    | Failures are B03’s moved empty and moved Free-children-only variants. All twelve B13 variants pass once. |
| `coder-named-anchor-full-e2e-2.json` | 381 passed, 21 skipped, zero unexpected/flaky/runner errors; all retries zero | All twelve B13 variants again pass once.                                                                 |

The Reconciler independently parsed all 402 result records in each file. Therefore “the other eleven B13 variants were not run” is not accurate for the full suites: both files include them. No separate focused replay of those eleven is established here. The JSON supports the recorded executions, but by itself does not establish per-run source fingerprints or the proposed cause of the first B03 failures. It is not a D2 ledger or authority to close the batch.

The Coder additionally reports unchanged B13 failing on old source then passing three of three with the fix; B03 disabled-sync four of four, enabled-sync four of four plus sixteen repeats; and gate results of 444 server / 1,031 client / 258 script tests. These remain **Coder-reported** where no corresponding durable focused/unit/gate artifact is supplied in this review. The static addition of five support tests and three lifecycle tests is consistent with the reported client increase from 1,023 to 1,031; no independent test execution is claimed.

## Uncatalogued Tests

Keep these five new tests unstamped. Exact describe ancestry is included for identification.

| Exact file                                           | Exact current title                                                                                                                                   | Classification and limit                                                                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/components/dragChrome.test.tsx`          | `NamedAnchorSync > hands the drag’s active item and the row it is over on every render`                                                               | Mocked context plus callback calls verifies render-time delivery, including a rerender with the same objects. It does not draw a highlight, hold a real relation or enter a Card. Remain unstamped.                       |
| `client/src/components/dragChrome.test.tsx`          | `NamedAnchorSync > hands over nothing with no drag running, and nothing for a column’s drag`                                                          | Delivery guard for idle/column contexts. No standalone user-visible business rule is introduced. Remain unstamped.                                                                                                        |
| `client/src/components/workflow/useBoardDnd.test.ts` | `useBoardDnd: the row a drag names when only the carried copy changes > names the neighbor the line now names, and holds the zoom clock on that Card` | Synthetic copy-height change updates the internal candidate from one neighbor to the other. Useful regression for the fix, but it does not independently observe the painted line and real first entry. Remain unstamped. |
| `client/src/components/workflow/useBoardDnd.test.ts` | `useBoardDnd: the row a drag names when only the carried copy changes > keeps the clock running when the name did not change`                         | Preserves the internal hover object when the answer is unchanged. This guards repeated evaluation; object identity alone is not elapsed-clock or cue proof. Remain unstamped.                                             |
| `client/src/components/workflow/useBoardDnd.test.ts` | `useBoardDnd: the row a drag names when only the carried copy changes > names nothing for a column’s drag`                                            | The hook ignores a column input and retains its item candidate. Defensive bridge support, not an additional scoped business scenario. Remain unstamped.                                                                   |

## Candidate New Cases

**None.** Render-time delivery, equality guards and column-input rejection are implementation choices/support. The user-visible named-Card requirement already belongs to DRAG-4.19; clock/reset behavior already belongs to DRAG-4.20/DRAG-4.22. No standalone case/ID follows from a new component/function.

## Totals

All case fields are unchanged. This delta scope is three Open cases: one P0 / two P1. All 26 batch cases remain Open until final Stop 5. Whole-catalog totals remain 484: 352 Automated / 119 Open / 10 Manual / one Planned / two Pending PO.

| Status/scope              |  P0 |  P1 |  P2 | Total |
| ------------------------- | --: | --: | --: | ----: |
| Scoped Open               |   1 |   2 |   0 |     3 |
| Whole catalog: Automated  | 126 | 159 |  67 |   352 |
| Whole catalog: Open       |  19 |  84 |  16 |   119 |
| Whole catalog: Manual     |   0 |   6 |   4 |    10 |
| Whole catalog: Planned    |   0 |   0 |   1 |     1 |
| Whole catalog: Pending PO |   0 |   0 |   2 |     2 |

## Written file and validation boundary

Only `docs/audits/test-reconciliation-story-10-batch-4b-coder-return.md` is written. All catalog bytes and the baseline/Phase 3/4a/pre-Coder-4b reports are compared with this review’s starting snapshots and remain unchanged. Other owners’ in-progress round-table/planning documents are not edited. No staging, commit, application or test command is used.

All nine pre-Coder frozen Playwright/spec/helper raw hashes were independently checked and matched **at Coder-return review time, before resumed authoring**. This is a point-in-time preservation check, not a promise that those files stay frozen after Nathan’s later authorization to resume automation. The eight changed protected paths match the externally supplied Coder scope; their app/unit changes are not attributed to the Reconciler. The targeted pointer decision does not initiate authoring/runtime. The later authorization and any subsequent Playwright edits belong to the separate Automator continuation.

Mandatory whole-catalog lost/skip-only/unknown/Manual-ID checks are clean. Final checks pass: local report Prettier check, `npm.cmd run check:docs` (433 files, zero hits), `git diff --check`, global identity scans and the report-only byte/hash ownership mask. The eight external Coder app/unit/guide hashes remain stable during this review; resumed Playwright authoring is outside that immutability claim. These checks do not promote a case or replace final acceptance.

# Test reconciliation — Story 10 close slice 6

This cold pass covers **BCU-1.9 and BCU-1.10 only**, as Nathan requested. Other case IDs in the carrier files or range diffs are outside the slice. Both cases entered this pass as Open; the Planner had cleared BCU-1.10's Planned status.

The fixed inputs are in `tests/output/story10-close-bcu/inputs.json`: the captured Scope and Review log, current catalog and cited wiki snapshots, test read copies, test and catalog range diffs, editorial catalog delta since green, current coverage report, mapping approval and green-run record. The supplied record identifies green tree `e648bec815c2a86cf626f560b51efaa1e9da7162` and confirms both test source files are identical to it. It records a passing `npm run check` and two full E2E runs, each with 524 expected, 23 skipped, zero unexpected and zero flaky results; all three scoped surface tests passed in both. No test, runtime or repository-forensics command was run in this reconciliation.

## Coverage Mapping

| Case | Decision | Automation test field |
|---|---|---|
| BCU-1.9 | Open → Automated | `tests/ui/board-read-order.spec.ts` |
| BCU-1.10 | Open → Automated | `client/src/components/workflow/useBoardLoad.test.ts`, `tests/ui/board-read-order.spec.ts` |

**BCU-1.9** — `tests/ui/board-read-order.spec.ts`, **“BCU-1.9: a failed board switch leaves the selected board without the old board columns”**, covers the whole Then. It starts with A selected and its merged column drawn, selects B and holds B's failing read, observes loading, then asserts loading ends, the selected-board marker remains B, all A/B columns are absent and Manage columns is absent. These assertions establish the selected board without a drawn board or old columns to manage, with no required error wording. They verify the selected-board rule in wiki boards-columns-unsorted §3 through the UI.

**BCU-1.10** — the following five tests together cover the whole Then:

- `tests/ui/board-read-order.spec.ts`, **“BCU-1.10: a held switch read cannot undo a move answer applied while it ran”**: sends X's move from A, holds B's read before saving that move, accepts the successful move, verifies saved W2, releases the stale read, and keeps loading with no W1 column drawn until a current read completes. The completed view selects B, has empty W1 and X/Y in W2, and has no merged A column.
- `tests/ui/board-read-order.spec.ts`, **“BCU-1.10: a held reload cannot undo a move or start the stopped item flash early”**: reaches the same-board reload through a forced stop of Y while X's move is held. After applying the move and releasing the stale read it asserts loading continues and no flash is present. With the clock paused before the current read is released, it then checks empty W1, X/Y in W2, Y's unchanged saved W2, the flash present for the configured `STOP_FLASH_MS - 1`, and absent at `STOP_FLASH_MS`. Its duration reads the configured value, and its one-iteration assertion supports the single window. This proves that waiting for both reads consumes none of F; the painted pulse design and later cancellation variants are not part of this case's obligation.
- `client/src/components/workflow/useBoardLoad.test.ts`, **“on a switch to B, applies nothing from B’s older read and keeps B loading until the read made again shows X in W2”**, under the existing BCU-1.10 describe: applies X's successful answer to the real item-state hook and asserts X/Y both hold W2 before and after the stale read. The stale placement is not drawn, loading remains true, the draw callback is not called, and the reads are A/B/B. The current result ends loading, draws B's empty CB1 and X/Y in CB2, retains the W2 item state and calls the draw callback once.
- `client/src/components/workflow/useBoardLoad.test.ts`, **“on a reload of the selected B, ends with X and Y in CB2 the same way”**, under the existing BCU-1.10 describe: asserts W2 item state survives the old same-board snapshot, loading remains true, the current read produces empty CB1 and X/Y in CB2, loading ends, and the read sequence stays B/B/B. Its retained pre-reload board value is covered by loading; the surface test checks the displayed result.
- `client/src/components/workflow/useBoardLoad.test.ts`, **“leaves the stop cue to the one reload: it is neither completed by the older read nor started again by the read made again”**, under the existing BCU-1.10 describe: asserts the stale read leaves loading true and calls no draw callback, the reload-start callback stays at one through the repeated read, and the final result calls the draw callback once with the final B placement. Alongside the surface flash test, this proves that reading again is one reload, without canceling or restarting its waiting flash.

The approval input is the current brief's restatement of the existing 11-10 BCU-1.10 → `client/src/components/workflow/useBoardLoad.test.ts` mapping approval, limited to these three existing switch/reload/cue tests. It is one existing approved mapping, supplied again without reading an archived plan; it is not a new approval attributed to Nathan in this turn. The tests' direct item-state and once-only reload/cue assertions supply the parts the surface tests do not inspect directly. The approval was not used as a coverage verdict. The combined assertions follow wiki boards-columns-unsorted §3 and wiki board-drag-interaction §10.

## Coverage Report Findings

`tests/output/story10-close-bcu/catalog-before.md` reports no lost coverage, running carriers of Manual cases, stale Automation lines, disagreeing statuses or unread catalog fields. No corrective whole-catalog write was needed, and no manual catalog sweep was performed. Its map supplies both running carrier files for each scoped ID, with no scoped skipped carrier. The current report is the totals baseline; the original green report linked in the packet records the earlier catalog state before the editorial changes.

## Stamps Added

None. All three surface tests already carry their own case IDs. The three approved BCU-1.10 internal tests inherit the existing describe's ID, which the catalog conventions accept. No describe or test title was changed.

## Review Log Answers

No open Test Reviewer verdict or declined mapping is supplied for BCU-1.9 or BCU-1.10. The current brief's restatement of the existing BCU-1.10/useBoardLoad mapping approval was applied, limited to its three existing switch/reload/cue tests, as described in Coverage Mapping. There is no unanswered scoped verdict and no approval follow-up required.

## Proposed Internal Mappings (need approval)

None. BCU-1.10's needed internal mapping is already approved.

BCU-1.9's whole surface coverage makes a new internal mapping unnecessary under the catalog's layer rule. Its three existing internal describe carriers in `client/src/components/workflow/useBoardLoad.test.ts` are therefore not added to the Automation field: **“ends B’s loading with no board drawn: A’s columns are gone, not shown under B”**, **“leaves the selection with B: no read of A follows the failure”**, and **“draws B’s board when a later load of B succeeds”**. Their existing ID stamp remains; the last also exercises a later retry outside this case's Then. No standing internal category needs to be invoked for this surface-covered case.

## Proposed Manual (need approval)

None. Both scoped cases have precise behavior assertions and confirmed coverage.

## Gaps

None in BCU-1.9 or BCU-1.10. The exact mapped files and titles are listed in Coverage Mapping. No additional variant, assertion, test or application change is requested. The case's references to later flash lifetime and painted pulses do not import those separate cases into this slice.

## Duplication

- BCU-1.9: the surface test **“BCU-1.9: a failed board switch leaves the selected board without the old board columns”** in `tests/ui/board-read-order.spec.ts` overlaps the internal tests **“ends B’s loading with no board drawn: A’s columns are gone, not shown under B”** and **“leaves the selection with B: no read of A follows the failure”** in `client/src/components/workflow/useBoardLoad.test.ts`. The surface file alone is mapped; no deletion or test change is proposed.
- BCU-1.10: the surface switch and reload tests and the approved internal switch and reload tests named in Coverage Mapping overlap on stale-snapshot protection and final placement. The approved internal cue test overlaps the surface reload test on delaying the cue, while adding the once-only callback assertions. All five are counted together; duplication is recorded without a removal judgment.

## Test Quality Concerns

None that prevents counting the mapped tests. Their expected placements and selected-board outcomes come from the cases and cited wiki rules, rather than being derived from application output. The internal tests land successful answers and stale/current reads in the named order and inspect state across that boundary. Their cue callbacks are stand-ins; the surface reload test separately verifies the real displayed flash for its full configured length. No application source was read to infer coverage.

## Uncatalogued Tests

The supplied internal file also contains these tests outside the scoped Thens; none is newly mapped or stamped:

- `client/src/components/workflow/useBoardLoad.test.ts`, **“is not made when the answer was applied before the read began”**, under “a board read made again”: a request-count/implementation boundary check, without a separate user-visible business rule to force into the catalog.
- `client/src/components/workflow/useBoardLoad.test.ts`, **“is made again while answers keep landing, until a read lands with none applied since it began”**, under “a board read made again”: repeated-answer hardening of the same protection. The two-case slice requires the variants its Thens name; multiple intervening answers are not a missing variant of BCU-1.10.
- `client/src/components/workflow/useBoardLoad.test.ts`, **“keeps that board drawn, ends loading and finishes the cue”**, under “a failed reload of the board already drawn”, and **“that fails ends the loading and finishes the cue once, leaving the board that was drawn”**, under “a board read made again”: failure-recovery scenarios beyond the two current Thens; their deferred routing is recorded below.

No coverage-gate test is assigned a new case merely to acquire a catalog pointer.

## Candidate New Cases

`client/src/components/workflow/useBoardLoad.test.ts` — **“keeps that board drawn, ends loading and finishes the cue”** and **“that fails ends the loading and finishes the cue once, leaving the board that was drawn”** exercise selected-board reload-failure outcomes not specified by the cited wiki sections; defer this candidate to `docs/planning/mvp-deferrals.md` → Findings with no story yet (the outside-drag-suites destination), with no new case, rule question or current-slice work. No cue change or defect is proposed in the built-and-frozen area.

## Totals

Two P0 cases changed Open → Automated. There are no other status changes, Manual proposals, additional internal proposals or stamps. Both cases' table and own-line statuses were changed together, and both Automation fields were populated.

The supplied current coverage report's totals, with these two changes applied:

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
|---|---:|---:|---:|---:|---:|---:|
| P0 | 135 | 13 | 0 | 0 | 0 | 148 |
| P1 | 229 | 15 | 6 | 0 | 0 | 250 |
| P2 | 81 | 2 | 4 | 1 | 2 | 90 |
| Total | 445 | 30 | 10 | 1 | 2 | 488 |

The slice is 2 Automated, 0 Open. The report baseline remains 488 cases in 44 suites and 125 test files declaring 1823 tests, 9 skipped. Test counts are unchanged.

Changed files: `docs/test-plans/boards-columns-unsorted/bcu-1-boards-and-what-they-show.md` (only the two cases' paired statuses and Automation fields) and this report. The parent QA Engineer owns the post-write checks and any close-plan or deferred-destination handoff; no test source, wiki, close plan or Epic 4 file was edited here.

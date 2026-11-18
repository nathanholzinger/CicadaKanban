# Story 10 Phase 3 — static pointer maintenance

Static pointer-maintenance review at HEAD a9950252 during the authorized D4 helper/spec refactor, 2026-11-06, followed by a final metadata check after the coordinated Coder cleanup and diagnostic retirement. **Four existing Automated cases retain coverage and receive only a Playwright path repair.** No status, case text, priority, ID or approval changes; no new coverage or Reconciler runtime pass is claimed. The pre-D13 [baseline report](test-reconciliation-story-10-baseline.md) remains unchanged.

Read the current Reconciler definition, catalog conventions, workflow instructions, documentation standards and story plan (D13, Phase 2 approvals/step 5 and Phase 3); current cases and wiki board-drag-interaction §10, item-positioning §7.1 and positioning §8; committed pre-split tests, current moved tests, their helpers and the retained approved internal evidence. Every new baseline internal proposal was declined in Phase 2 step 4; this pass revives none.

## Coverage Mapping

The source comparison finds all three exact Playwright titles below active in the new file and absent from the old one. Their complete test declarations retain the same tokens after the extracted region helper's rename; assertions and scenario steps are intact. Inspected fixture/request helpers preserve the saved positions, delayed-answer sequencing, refusal and band-targeting semantics.

| Case | Current exact test evidence | Decision |
|---|---|---|
| DRAG-6.1 | `tests/ui/drag-preview-reconciliation.spec.ts` — `DRAG-6.1, DRAG-6.2: the drop is drawn at its slot and marked pending until the response lands, then settles unchanged`; `client/src/components/workflow/itemWriteReconciliation.test.ts` — `DRAG-6.1, TC-2.28: a top or bottom band drop is marked pending as the anchor it sends, so the board draws the same order before the server's answer and after it` | Retain Automated. The moved surface keeps the bottom-slot pending/settled order and saved readback. The existing approved internal top/bottom anchor preview and unchanged-position evidence remains on its pointer, completing the baseline mapping. |
| DRAG-6.2 | `tests/ui/drag-preview-reconciliation.spec.ts` — `DRAG-6.1, DRAG-6.2: the drop is drawn at its slot and marked pending until the response lands, then settles unchanged`; `client/src/components/workflow/itemWriteReconciliation.test.ts` — `TC-2.30, DRAG-6.2: a pending item keeps its position and its place when another item's response re-sorts the list` | Retain Automated. The moved surface preserves the pending marker and stable list. Existing approved reconciliation evidence retains X's numeric position and placement while another row's response re-sorts the list. |
| DRAG-6.5 | `tests/ui/drag-preview-reconciliation.spec.ts` — `DRAG-6.5: re-dragging a pending item — the later write wins even when its response lands first` | Retain Automated. The moved surface delays write 1's answer, re-drags X, applies write 2 first and checks the late answer leaves the second saved order intact. |
| DRAG-6.6 | `tests/ui/drag-preview-reconciliation.spec.ts` — `DRAG-6.6: a refused drop is not kept — the board reloads and shows the item where the server has it` | Retain Automated. The moved surface rejects the drop, observes reload and checks X at the distinct server-saved Review location without pending state or the rejected destination preview. |

All four Automation lines replace the old path with the new path. DRAG-6.1 and DRAG-6.2 keep their existing itemWriteReconciliation.test.ts pointer; DRAG-6.5 and DRAG-6.6 have no internal pointer to preserve. Existing partial/unmapped internal carriers are not promoted into new pointers.

## Lost Coverage

Final whole-catalog title/skip scan: **none** of the 318 Automated cases lacks an active ID-bearing test, and none is skip-only. No genuine loss was found in the initial four-case review. Global identity checks cover 485 actual case bodies and all client/server/Playwright test sources; unrelated cases did not receive a whole-Then review.

The 24 skipped E2E declarations remain unchanged, with no unit skip. The temporary helper smoke exercise has been retired and adds no coverage mapping. No case is reopened in this pass.

## Unknown IDs

**None** in test/describe title claims across the final whole catalog. The final scan also finds **no active or skipped ID carrier for any Manual case**.

**Initial snapshot, now resolved:** the Manual case TREE-2.8 had four active internal title carriers:

- `client/src/components/sidebar/SortableProjectRow.test.tsx` — `TREE-2.1, TREE-2.8: draws the dragged row at the ghost’s strength, and it has no tier`.
- `client/src/components/sidebar/useProjectDragReorder.test.ts` — `TREE-2.8: the strengths > are the defaults the panel starts at, when nothing is stored`.
- `client/src/components/sidebar/useProjectDragReorder.test.ts` — `TREE-2.8: the strengths > are read from storage at pickup, so a change in the panel takes effect on the next drag`.
- `client/src/components/sidebar/useProjectDragReorder.test.ts` — `TREE-2.8: the strengths > are apart from the board’s three, which the sidebar never reads`.

These were stale case-ID attributions on configuration/class-selection tests after D13, **not automated proof of the Manual appearance case**. The hook carriers inspect defaults, stored sidebar values and separation from board values; the component carrier inspects the ghost class and absence of a target tier. None judges painted opacity, colour independence or the full-strength line. The authorized Coder removed exactly those four TREE-2.8 claims while preserving the tests and the component's TREE-2.1 attribution. The final scan confirms no TREE-2.8 carrier remains; TREE-2.8 stays Manual with its existing manual Automation line.

## Proposed Stamps

None. The three moved titles already retain the required IDs; no stamp is needed to repair a file path.

## Proposed Internal Mappings (need approval)

None. Retain the approved DRAG-6.1/DRAG-6.2 reconciliation pointers. No declined baseline proposal is revived, and no internal file is added.

## Proposed Manual (need approval)

None. All ten current Manual decisions remain unchanged.

## Gaps

No new gap in the four scoped mappings. Other Open assignments remain the post-D13 inventory's responsibility.

DRAG-6.25 stays Open with Automation `—`, assigned to batch 4d. The initial Automator diagnostic exposed a column reorder on held-pointer release after a genuine forced stop. Following the authorized Coder fix, the Automator reports all six genuine-cause × item/column diagnostic variants passing 20 repeats each (120 passed, zero retries, about 5.6 minutes), including post-stop release checks. The temporary `tests/ui/phase3-helper-smoke.spec.ts` has been explicitly retired. These are external Automator results, not Reconciler runtime observations or a whole-Then reassessment.

The final title scan finds the new active internal regression in `client/src/components/workflow/useBoardDnd.test.ts`: `DRAG-6.25: a stopped column release writes nothing, and a fresh column drag can still reorder`. Its presence does not authorize an internal mapping; none is proposed or written in this metadata pass, and the full surface obligation remains with 4d.

## Duplication

DRAG-6.1 and DRAG-6.2 continue sharing one surface declaration and their complementary approved internal file. DRAG-6.5/DRAG-6.6 each retain one surface mapping. No duplicate Playwright declaration remains in drag-column-bands.spec.ts; no test deletion or consolidation is proposed.

## Test Quality Concerns

The existing case judgments remain justified by unchanged assertions and independently specified saved orders, pending states and refusal readbacks. The extracted request helper saves moves before delaying answers, while refused moves are not forwarded; the tests still distinguish response order from request order. The band helper locates the rendered carve-out and confirms its selected band rather than inventing saved positions.

The initial TREE-2.8 Manual-ID conflict is resolved as described above. DRAG-6.25's diagnostic failure and later successful fix check are external evidence, separate from these four moved mappings. No new broad whole-Then audit is made.

External Automator validation, supplied for this final metadata update: the 12 migrated/new spec files ran 20 repeats against the stable pre-fix app, with 2,200 passed, 400 expected skips, zero retries and no failures or flaky results (about one hour). The post-fix 120-pass genuine-cause diagnostic is recorded above. The final full E2E run and root gate are underway; no result is inferred for either here. The Reconciler did not run these suites and makes no independent runtime claim.

## Uncatalogued Tests

The temporary `tests/ui/phase3-helper-smoke.spec.ts` genuine-cause exercise was helper validation and is now absent, not retained as case evidence. The new support test in `client/src/components/workflow/useBoardDnd.test.ts`, `ignores a column release when no column drag is live, including after cancellation`, has no case-ID claim and supports lifecycle safety; no standalone case or mapping is proposed. Newly extracted helper functions are not standalone business cases. Other uncatalogued tests are outside this pointer-maintenance review.

## Candidate New Cases

None. The moved scenarios have existing IDs, and the reported stopped-column release obligation already belongs to DRAG-6.25.

## Totals

Statuses and priorities are unchanged. The maintenance scope is four P0 Automated cases.

| Scope/status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Scoped Automated | 4 | 0 | 0 | 4 |


Whole catalog:

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 111 | 147 | 60 | 318 |
| Open | 35 | 96 | 23 | 154 |
| Manual | 0 | 6 | 4 | 10 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **All** | 146 | 249 | 90 | 485 |

The final source inventory contains 1,593 leaf declarations in 107 files, after the temporary diagnostic's retirement and two permanent Coder additions. The original Playwright inventory remains exactly 153 ID-bearing test titles and 24 skipped declarations; an independent static comparison confirms the exact title multiset is unchanged across the split. Parameterized declarations are counted once, not as executed variants. The 152 in-scope Open batch assignments and two other Open cases remain unchanged.

## Written files and validation

The initial pointer-maintenance pass wrote two files; this final metadata follow-up updates only this report:

- docs/test-plans/board-drag-interaction/drag-6-preview-reconciliation.md: exactly four Automation lines, replacing only the old Playwright path.
- docs/audits/test-reconciliation-story-10-phase-3.md: this new report.

A before/after line mask proves exactly four changed lines, each the authorized path substitution; every other byte of the suite file, including statuses and internal pointers, is unchanged. The baseline report's SHA-256 is unchanged. No source/test, wiki, plan or other catalog field is edited by this pass; concurrent Automator/Planner work is outside that write claim.

Final validation: `npm.cmd run check:docs` passes (422 files checked, zero hits), and `git diff --check` passes. The four-line field mask and unchanged baseline SHA-256 pass; the entire catalog diff is the one suite's four path substitutions. No app or test suite is run by the Reconciler.


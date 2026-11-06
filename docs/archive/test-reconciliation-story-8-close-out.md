# Story 8 close-out test reconciliation

Confirming, scoped source reconciliation on 2026-11-06. The primary scope is the seven whole cases in `docs/planning/epic-3-5-stories/story-8-close-out-audit.md`, especially Test-plan scope, D13, batches 4b–4f, Open questions, Handoff and Amendments. Rules come from the catalog's cited wiki sections, not the implementation or audit's assertions. The PO's five marker removals and the Test Planner's five Planned-to-Open transitions precede this run.

Read `AGENTS.md`, `.claude/agents/test-reconciler.md`, `client/src/components/workflow/AGENTS.md`, `docs/test-plans/README.md` and `.claude/guides/documentation-standards.md`. Only two catalog statuses and their Automation lines change, with summary tables synchronized; the five partial cases retain Open and `—`. No case definitions, priorities, wiki, tests, production code, indexes, plans or existing reports are changed by this run. Existing dirty work is preserved.

This is source evidence, not a test result. No suites, installs, servers, browser sessions or behavioral probes were run. The whole-catalog checks below establish active title claims, not whole-case assertion quality outside the stated scope.

## Coverage Mapping

| Case | Final status | Catalog Automation test | Whole-case result |
|---|---|---|---|
| DRAG-6.29 | Automated | `client/src/components/workflow/useItemManagement.test.ts` | Both numerical givens, both answer orders and board write entry points are covered. |
| DRAG-1.37 | Automated | `client/src/components/workflow/popSession.test.ts`, `client/src/components/workflow/useBoardDnd.test.ts` | Settling, later entry, continued session and no write are covered for merged columns and expanded sub-rows. |
| DRAG-1.19 | Open | — | Both origins, context shapes and clock settings are covered, but ordered intermediate pops and shortCard form are not asserted. |
| TREE-1.1 | Open | — | New last-row-crossing regression is covered; original line-top-edge and full-strength assertions are absent from this ID's tests. |
| TREE-4.14 | Open | — | Final rename and move outcomes are covered; purported every-render checks omit intervening renders, and later-refresh coverage exercises only a rename. |
| BCU-1.7 | Open | — | Board identity, column IDs, item IDs/name, loading and cue callbacks are covered; required per-column item/workphase associations are not asserted. |
| BCU-1.8 | Open | — | Current-board reload and new workphase name are covered for B loaded/loading; item placement/content is not asserted. |

### DRAG-6.29

`client/src/components/workflow/useItemManagement.test.ts`, inherited describe `DRAG-6.29: answers for different items preserve positions set by the later write`, covers wiki positioning §7–§8 and wiki board-drag-interaction §10. The nested givens specify the case's exact successful responses. These leaf titles prove the numerical outcomes and displayed order through `getWorkphaseItems`:

- `keeps Y at 4 when X’s older answer lands second, with Z = 2 and X = 3 applied: Z, X, Y`;
- `keeps X at 1 when its older written row lands second: X, Z, Y`;
- `ends the same when the answers land in the order the writes were sent` under each given;
- under `an inline create`, `leaves the position of a row a later-sent drag set, when its answer lands after the drag’s` and `ends the same when the answers land in the order the writes were sent`;
- under `an answer the Sheet passes up`, `is the latest write: a drag sent before it, answered after, leaves what it set`, `holds a child the Sheet created to the same rule`, and `applies a drag’s answer in full when no Sheet write came after it`.

The additional `takes the rest of an older answer: its own row’s other fields, though not its position` checks that position currency does not discard the written row's other fields. The expected values are anchored in the catalog's saved-response fixtures, not a production-computed expected result. D13 and Nathan's final hook-approval amendment approve this mapping; no new approval is pending.

### DRAG-1.37

`client/src/components/workflow/popSession.test.ts`, describe `DRAG-1.37: a zero-delay pop cycle settles in the context it returns to`, runs under both `KINDS`: merged column and expanded sub-row. Its four titles are:

- `DRAG-1.37: a sample inside K, far from the Card P it names, zooms into P and pops back out to settle in K`;
- `DRAG-1.37: the same sample settles in K from any state K was in, a hold or an exit clock running`;
- `DRAG-1.37: a later sample inside P, with P still named, zooms into its Descendants layer: settling the earlier one bars nothing`;
- `DRAG-1.37: each sample far from P settles in K again, never in P`.

`client/src/components/workflow/useBoardDnd.test.ts` adds `DRAG-1.37: completes the sample, which settles in the list with the drag still running` and `DRAG-1.37: a later sample inside P, which is still named, zooms into its Descendants layer`, also parameterized over both context shapes. These inspect the live session and assert no `moveItem` call. Together they cover wiki board-drag-interaction §3.1 and §6.1. Parameterized drag-clock logic has standing approval; D13 explicitly schedules both files. No whole-case surface test exists to displace this mapping.

### DRAG-1.19

`client/src/components/workflow/popSession.test.ts`, describe `DRAG-1.19: a distant yank out of a Card cascades through two pops, one layer at a time`, contains:

- `DRAG-1.19: $origin, one sample past both bounds pops to K and on to Board`;
- `DRAG-1.19: $origin, a sample that rests inside K, far from P, pops once and stays in K`.

Both run for zoomed-in and Stub origins, set and zero clocks, merged outer-body bounds and expanded sub-row bounds. Each distant-yank test asserts the starting Descendants context and final Board context after one sample. The resting sample asserts final K. Missing assertions are in Gaps; these are approved drag-clock tests, but approval does not fill their assertion gaps.

### TREE-1.1

`tests/ui/project-tree-drag.spec.ts` has two active surface titles:

- `TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement`;
- `TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows`.

The first checks the gap/depth, name-column line offset, B's one-row shuffle, fixed A/A1/A1a positions, unchanged row count, saved A1 parent and position after A1a. The second checks the single last movement, exact `{parentId: null, prevId: B, nextId: null}` request, `B, A, C` after release and reload, and saved null parent. That request expresses the case's anchor B and side after.

`client/src/components/sidebar/useProjectDragReorder.test.ts`, inherited describe `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed`, supplies five approved hook tests:

- `after A’s last movement makes B the nearest row, a release without moving again saves A after B at the top level`;
- `draws the ghost at the announced row, with its line, before any further move`;
- `reads the depth from the announcement’s own offset, so a tab made with the announcement is saved`;
- `places the release from its own event: the row it names, not the last one a move or an announcement named`;
- `still writes nothing when the announcement names the project’s own row, which is its own gap`.

The new regression is covered at both layers. The whole original Then is still partial against wiki project-tree §1, §2 and §6 and wiki hierarchy-placement §1. Tests carrying another case ID cannot silently complete TREE-1.1; see Proposed Stamps.

### TREE-4.14

`client/src/components/sidebar/useProjectCollection.test.ts`, inherited describe `TREE-4.14: an older tree read preserves a write already applied in the sidebar`, supplies the three behavioral titles:

- `keeps an edit’s name when the first read lands with the tree as it was`;
- `keeps a move’s parent and order when the first read lands with the tree as it was`;
- `holds a later refresh to the same rule: its older read is dropped and the tree is read again`.

The first two hold the first StrictMode read while the second exposes the collection, then apply the successful write before landing the first read. Final assertions cover Renamed/Q and `A, X, B`/parent P/single X respectively. The third uses a refused move to begin a later refresh, then successfully renames P while its answer is held. The nested readiness tests `is not loaded by the first read, which the second superseded, landing`, `is loaded when the latest read fails, with nothing in it`, and `is not loaded by the failure of a read the latest superseded` add supporting load-state coverage. D13 approves the hook mapping. Whole-case gaps remain against wiki project-tree §4.

### BCU-1.7

`client/src/components/workflow/useBoardLoad.test.ts`, inherited describe `BCU-1.7: a late load for another board cannot replace the selected board or complete its loading or cue`, contains:

- `keeps B selected, showing CB1 with X1 and CB2 with X2, when A’s answer lands`;
- `keeps B’s items, not A’s older snapshot of them: X1 stays Current`;
- `leaves B loading when its own load is unanswered, and shows no board of A’s`;
- `keeps the stop cue waiting for B’s own reload, which A’s late answer neither ends nor draws`;
- `finishes the cue and the loading state for the selected board’s load that fails`.

The first four exercise the four givens. They assert B identity, CB1/CB2 IDs, flattened X1/X2 IDs, Current never replaced by Old, pending loading and no board A, and no `boardDrawn` callback until B's reload completes. D13 expressly approves the hook with `reloadStarted`/`boardDrawn` standing in for the cue; no actual drag or rendered cue is required for that clause. The final failure test is supporting coverage. Whole-case data gaps remain against wiki boards-columns-unsorted §3 and wiki board-drag-interaction §10.

### BCU-1.8

`client/src/components/workflow/useBoardLoad.test.ts`, inherited describe `BCU-1.8: a shared change begun on another board refreshes the board currently selected`, contains:

- `reads B again when the follow-up load starts after B loaded, and B shows CB1 as Doing`;
- `shows B with the new name when B was still loading, whichever read lands last`;
- `never returns the selection to A: the handler’s load asks for the board selected now`.

The approved hook abstraction retains A's loader closure, selects B, and invokes the follow-up load after the selection change. It checks the request is B, board identity is B, columns are CB1/CB2 and the first workphase name is Doing; the loading variant lands B's older Ready snapshot after the new result and checks Doing survives. The request history is A/B/B. No actual editor UI or rename network call is required by the approved abstraction. Whole-case item-placement gaps remain against wiki boards-columns-unsorted §1, §3 and §4.

## Lost Coverage

None. Every one of the 308 initially Automated IDs has at least one active test-title claim after inheriting enclosing describe IDs and skips. No mandatory out-of-scope Automated-to-Open transition is necessary. The two newly Automated cases also have active claims. A title claim alone does not certify out-of-scope whole-case coverage.

## Unknown IDs

None in test titles across the scanned canonical roots, including skipped titles and inherited describe IDs. ID-like prose in comments or test-source string fixtures is not an executable title claim.

## Proposed Stamps

For TREE-1.1, add its ID to these existing tests in `client/src/components/sidebar/SortableProjectRow.test.tsx`, currently inheriting `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move`:

- `draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet`;
- `keeps the line at full strength while the ghost is dimmed: it sits outside the dimmed box`.

They assert the two original Then clauses absent from TREE-1.1's currently stamped evidence. A developer must add the IDs; this run does not write the stamp or map unstamped evidence. See the separate internal-mapping approval limit below. No new case is needed for these obligations.

## Proposed Internal Mappings (need approval)

All D13 hook approvals are already granted, including TREE-1.1's new hook scenario. DRAG-1.19/DRAG-1.37's parameterized clock tests have standing approval. No renewed approval request is made for any of them.

Two additional proposals are report-only:

- TREE-1.1: after the proposed stamps, the two `SortableProjectRow.test.tsx` titles in Proposed Stamps could supplement the partial surface tests for full-strength/top-edge line behavior. Approval for this component mapping is not supplied by D13's approval of the new hook scenario. If a developer instead adds both assertions to the existing surface test, that whole surface coverage makes a new internal pointer unnecessary.
- TREE-2.9 (optional scheduled question): `client/src/components/sidebar/useProjectDragReorder.test.ts` plus `client/src/components/sidebar/SortableProjectRow.test.tsx`, under each file's `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse` describe, provide complementary whole-rule source evidence. Exact titles and limits are in Test Quality Concerns. No new internal approval for this optional case is supplied, no existing pointer approves it, and the mapping is outside the seven-case primary write scope. Leave its Open/`—` fields alone.

No approval request is needed to finish this source reconciliation; these proposals are handed back for a later developer/approval decision.

## Proposed Manual (need approval)

None. No Manual proposals are approved, and no Manual status is set. The missing primary assertions are precise, automatable obligations; neither the approved hook layer nor unrelated brittle E2E gestures justify changing those cases to Manual.

## Gaps

All five primary partial cases remain Open with `**Automation test:** —`, as the catalog convention requires:

| Case | Exact missing whole-Then assertions/scenarios | Relevant test title(s) |
|---|---|---|
| DRAG-1.19 | Assert that the single distant sample passes through its containing K before Board, in Descendants → K → Board order; final `null` alone also permits an illegal direct skip. Assert that the inside-K resting outcome is shortCard. Preserve both origins, both bounds and both clock settings when closing these gaps. | `popSession.test.ts`: `$origin, one sample past both bounds pops to K and on to Board`; `$origin, a sample that rests inside K, far from P, pops once and stays in K`, each prefixed DRAG-1.19. Neither checks a transition trace or overlay form. |
| TREE-1.1 | Assert that the original scenario's line is on the ghost's top edge and stays at full strength while the ghost is dimmed. Current stamped tests check containment/count/indent, not those two properties. | `tests/ui/project-tree-drag.spec.ts`: `TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement`. Existing component evidence for a proposed stamp is listed above. The added last-crossing regression needs no additional scenario. |
| TREE-4.14 | Assert every render after each applied write while the old read/follow-up lands; for the move, assert child order and absence of a top-level X throughout, not only final parent/position. Cover a later-refresh old read after a parent/order move, as well as the later-refresh rename already tested. | `useProjectCollection.test.ts`: `keeps an edit’s name when the first read lands with the tree as it was`, `keeps a move’s parent and order when the first read lands with the tree as it was`, `holds a later refresh to the same rule: its older read is dropped and the tree is read again`. |
| BCU-1.7 | Assert the retained board's associations CB1 → W1 → X1 and CB2 → W2 → X2 after A lands. The test asserts CB1/CB2 IDs and a flattened X1/X2 ID list, but neither each column's workphase/items nor the replacement items' workphase IDs. Those independent ID lists do not establish the case's placements. | `useBoardLoad.test.ts`: `keeps B selected, showing CB1 with X1 and CB2 with X2, when A’s answer lands`. The other stamped tests do not add these associations. |
| BCU-1.8 | Assert retained X1/X2 contents and placement under CB1/W1 and CB2/W2 in both loaded/loading variants after the follow-up, including after the late Ready read. The tests assert column IDs/name and board identity, but never item contents or workphase membership. | `useBoardLoad.test.ts`: `reads B again when the follow-up load starts after B loaded, and B shows CB1 as Doing`; `shows B with the new name when B was still loading, whichever read lands last`. |

For BCU-1.7/BCU-1.8, the missing assertions can be made against the accepted hook's returned board and replacement items. This is not a request for UI rendering or a rejection of D13's layer choice. A fixture containing correct associations is setup, not an assertion that the applied result preserves them.

These newly identified omissions are reported for follow-up, not automatically deferred to Story 10. That story's existing ownership of brittle skipped gesture specs does not establish a disposition for these gaps. TREE-1.14's cyclic-release gap is already accepted there and is not duplicated here.

## Duplication

- DRAG-1.37: `popSession.test.ts`'s four titles and `useBoardDnd.test.ts`'s two titles listed in Coverage Mapping overlap on settling and later zoom, across both context shapes. The hook adds continued live-session/no-write assertions. This is intentional-looking complementary coverage, not a removal recommendation.
- TREE-1.1: `useProjectDragReorder.test.ts`'s `after A’s last movement makes B the nearest row, a release without moving again saves A after B at the top level` overlaps with `tests/ui/project-tree-drag.spec.ts`'s `TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows`. The surface test adds persistence/reload evidence. No internal pointer is added beside the surface test; the whole case remains partial.
- TREE-1.8/TREE-1.9: the two hook leave-and-return tests overlap nearly line for line; their distinct obligations are addressed below. No test deletion or case consolidation is proposed by this reconciliation.
- TREE-2.9: hook count/label evidence and component wording evidence overlap deliberately; the component alone cannot establish hidden-subtree counting.

## Test Quality Concerns

**TREE-4.14's every-render claim is stronger than its assertion.** In `useProjectCollection.test.ts`, `rendersFromNow()` returns `seen.slice(seen.length - 1)`. The edit and move tests take that copied array before resolving the old read, then inspect that snapshot plus the final current result. Renders appended later to `seen` are absent. The later-refresh rename repeats the same pre-response `seen.slice(...)` pattern. A temporary rollback followed by correction could pass. Capture an index, then inspect the live array's suffix after the asynchronous work, checking each relevant name/parent/order; this is a test follow-up, not a finding that production rolls back. The existing final-state assertions are useful and grounded in wiki project-tree §4.

**TREE-2.9, optional seeded-count question.** `SortableProjectRow.test.tsx`'s inherited TREE-2.9 parameterized title `%i children and %i descendants: the copy says %j` supplies four count pairs directly to `DragGhost`. It proves those exact rendered strings, not how real or hidden descendants were counted. The stamped `TREE-2.9: has no line without a branch` adds the zero case. The complementary hook describe `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse` in `useProjectDragReorder.test.ts` has `%s: the line is %j` over all five actual trees, `with %j collapsed, the five descendants still count, and none is left among the rows drawn` over collapsed A, X and both, and `holds the counts and the membership for the whole drag, and never counts X itself`. It checks all five member IDs, shortened drawn rows, branch identity through movement and exclusion of X. Earlier stamped tests `TREE-1.16, TREE-2.9: counts the rows under a collapsed descendant, which were not drawn to begin with` and `TREE-1.16, TREE-2.9: counts the whole branch of a collapsed project, though none of it was drawn` support the same distinction. Together hook computation and component rendering provide the case's source evidence against wiki project-tree §2 and wiki hierarchy-placement §8. The seeded component test is valid presentation evidence, not sufficient hidden-tree evidence by itself. Report-only approval proposal; no optional status edit.

**TREE-1.8/TREE-1.9, optional leave-and-return question.** In `useProjectDragReorder.test.ts`, TREE-1.8's `sends nothing when the cursor leaves X’s row and comes back to its own gap` and TREE-1.9's `the cursor leaves for the gap above B and comes back to X’s row: the ghost is in X’s own gap, and a release sends nothing` execute the same core pickup/hover-B/hover-X/release sequence and assert the same slots/no reorder; TREE-1.8 additionally checks no expansion. That overlap does not make the cases identical: TREE-1.8 requires no request and unchanged parent/position/updatedAt for both returning and never leaving; TREE-1.9 requires the ghost and top-edge line to return to the own gap, then no write on release. Active surface tests with the corresponding complete case titles in `tests/ui/project-tree-drag.spec.ts` preserve that distinction: TREE-1.8 exercises both release variants and compares the stored row to its initial value; TREE-1.9 exercises return and counts the line. Neither the hook return test nor the surface line-count assertion establishes the line's returned top-edge location/strength by itself. This is an assertion distinction and reported overlap, not a request to duplicate the no-write gesture. Their Open statuses and `—` pointers remain unchanged in this scoped run.

**Other primary evidence.** DRAG-6.29's exact numbers and DRAG-1.37's parameterized clocks derive from case fixtures/rules; no expected outcome is calculated by the function under test. The DRAG-1.19 and BCU titles describe more than their assertions prove, as detailed in Gaps. Those are assertion omissions, not evidence of runtime failures. Approval of an internal layer does not certify whole-case coverage.

## Uncatalogued Tests

No forced mappings are added. Support/error-path tests inside inherited case describes still carry those case IDs for the mandatory title scan; inheriting a title does not make every leaf a proof of every Then. Examples are `useItemManagement.test.ts`'s `takes the rest of an older answer: its own row’s other fields, though not its position`, `useBoardLoad.test.ts`'s `finishes the cue and the loading state for the selected board’s load that fails`, and `useProjectCollection.test.ts`'s three readiness/failure titles listed in Coverage Mapping. Their extra assertions do not close the gaps above. Untitled helper/fixture and structural component tests inspected here remain support coverage unless a specific stamp is proposed. No repo-wide quality or coverage-gate purpose audit of unstamped tests was undertaken.

## Candidate New Cases

None established in this narrow run. The identified missing assertions already belong to existing case Thens. The optional questions concern complementary evidence and overlapping tests for existing cases, not missing business rules. No MCP-only scenario is proposed. Additional support/error-path tests are not promoted into product requirements from implementation alone; any future candidate requires a wiki rule or a PO question first.

## Totals

Final actual catalog totals, excluding all README/INDEX examples and counting case definitions once:

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 113 | 138 | 59 | 310 |
| Open | 33 | 102 | 24 | 159 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| Total | 146 | 243 | 89 | 478 |

Change from the prepared baseline: DRAG-6.29 and DRAG-1.37 move Open → Automated, both P0; 308 → 310 Automated and 161 → 159 Open. All priorities, case definitions, other statuses and Manual dispositions are unchanged.

**Whole-catalog scan method and limits:** disposable in-memory Node/TypeScript AST analysis read all 122 `.test`/`.spec` source files under `server/tests/`, `client/src/`, `tests/` and `scripts/` (including `.tsx`/`.mts`). It excluded dependency/build/coverage/output directories. It recognized `it`, `test`, `describe`, property chains, `.each(...)`/tagged-template call forms, literal/template titles, comma-separated leading IDs and enclosing describes. IDs inherited by nested tests are unioned; ancestor skips propagate, and skipped/fixme/todo declarations do not count as active. A companion text search found the actual skips, with no conditional skip/runIf/skipIf form requiring unresolved evaluation. Source-string fixtures in checker tests are not executable declarations. Template titles were inspected: the browser template retains a literal DRAG-7.35 prefix while substituting only the Sheet-closing way; script templates have no case ID. Parameterized title declarations count once for scan statistics, not once per runtime expansion.

The scan found 1,834 leaf title declarations, 22 skipped declarations and 428 distinct IDs with an active claim. Every Automated case has an active claim; unknown IDs: 0; Manual case IDs claimed by any actual test title, skipped or active: 0. No runtime pass, configured test collection, browser behavior or out-of-scope whole-Then quality conclusion follows from these source counts.

# Test reconciliation: Story 8.9 final narrow confirmation

Confirming writing run at committed HEAD `ef0b62d` (Batch 6), 2026-11-04. Scope: TREE-10.12, TREE-10.13, the four newly approved internal stamp groups, and the padding-test retitle. The current cases and their cited wiki passages govern these decisions. The Story 8.9 plan's Scope, Batch 6, Amendments 8–9, Open questions and handoff were read. This is source inspection, with mandatory whole-catalog checks; it is not a rerun of the preceding broad review.

**TREE-10.12 and TREE-10.13 close.** Their table/body statuses become Automated and their Automation test lines become `server/tests/routes/workflows.test.ts`. These are the only catalog edits. Approved partial internal mappings are confirmed below, but retain Open and `—` in the catalog, as its README requires. No Manual status or approval is inferred.

The baseline is [the follow-up report](test-reconciliation-story-8-9-follow-up.md), especially Coverage Mapping, Proposed Internal Mappings, Gaps and Test Quality Concerns. Its unchanged judgments and Story 10 routing stand. DRAG-2.11 remains Automated from that run; DRAG-6.26 remains Planned and unbuilt. Batch 6 changes tests/titles and the story plan, with no product implementation.

## Coverage Mapping

### Required workflow owner: TREE-10.12 — Automated

All three current tests are in `server/tests/routes/workflows.test.ts`:

| Key | Exact current test title |
|---|---|
| A1 | `TREE-10.12: returns 400 with a specific message when projectId does not reference an existing project` |
| A2 | `TREE-10.12: refuses a projectId that is left out, null, unknown, empty or not a string, and creates nothing` |
| A3 | `TREE-10.12: refuses a projectId that is not a string ahead of the ownership check` |

A2 now supplies the case's Given: P has no workflow and Q owns W. It sends an omitted owner, null, an unknown ID, an empty string, false, 0, 7, true, an object, an empty array and arrays holding P's and Q's IDs. Every request asserts 400 and an error naming projectId. It then compares the entire app's sorted workflow **ID set** with its pre-refusal set, checks P still has none and Q has W alone, and asserts a valid create naming P returns 201. This proves every revised Then clause, including no persisted ownerless creation. The equality is of IDs, not every workflow field; the case does not require existing workflow fields to be compared.

A3 separately checks that the array holding an owning project's ID gets 400, rejects the ownership-error wording, and preserves that project's workflow. A1 retains the unknown-ID message assertion. These are route tests and require no internal approval. The rule is required-reference refusal with no creation (wiki project-tree §10 and row-references §1), rather than acceptance of current implementation output.

The old untagged `returns 400 when projectId is missing` is removed. Its omitted-owner scenario is the first body of A2, now with the broader no-creation and recovery checks. Its removal loses no coverage.

### Workflow deletion: TREE-10.13 — Automated

`server/tests/routes/workflows.test.ts` adds the unskipped two-variant declaration:

`TREE-10.13: deletes an %s workflow with its boards, columns, workphases and notifications, and keeps every item`

Its `it.each(['owned', 'ownerless'])` gives each variant its own test execution. Both construct the full same fixture: W has two boards, two phases, four columns and two notifications, one on X; Q owns V with its board, column, phase V1 and notification. X holds W1, Q's Z holds W2, and Q's Y holds V1. The before-count assertions establish these dependents really exist. In the ownerless variant W's owner is set to null after that build. Z's foreign workphase and W's absent owner are intentional legacy starting states seeded directly, since legal create requests cannot produce them.

Every Then clause is asserted in **both** variants:

- DELETE returns 204, and direct table queries leave zero W workflow, board, column, workphase or notification rows, from before-counts 1/2/4/2/2.
- Complete stored rows for X and Z equal their snapshots with only workphaseId changed to null; Y equals its complete snapshot.
- Reading V's board puts Z alone in unsorted.invalidItems and Y alone among its column's items.
- V's workflow, board, columns, phases and notifications equal their complete before-rows. Both P and Q still return 200.

The expectations independently express deletion boundaries and item preservation in wiki project-tree §10 and boards-columns-unsorted §8/§10. Snapshot equality is appropriate here: unchanged non-phase fields and unaffected dependents are the rule, not a copy of a calculated implementation result. The whole case is covered without relying on the older partial tests or TREE-10.3's separate workflow-choice rule.

The four older tests now carry exactly these titles, also in `server/tests/routes/workflows.test.ts`:

| Key | Exact current test title |
|---|---|
| D1 | `TREE-10.13: deletes the workflow, its workphases, and boards/columns, but items survive with a null workphase` |
| D2 | `TREE-10.13: removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete` |
| D3 | `TREE-10.13: does not fail on cross-project items inheriting the workflow` |
| D4 | `TREE-10.13: deletes a workflow with a null projectId without touching any project's items` |

These stamps expose partial supporting coverage; they would not close the case alone. TREE-10.3 keeps its own mapping.

### Approved internal stamps: confirmed, still partial

Nathan's four named approval groups are recorded in the plan's Amendment 8 and Batch 6. Every required prefix is present. The keys retain the preceding report's evidence identities; these are report mappings, not catalog Automation pointers.

| Key | File | Exact current test title |
|---|---|---|
| U1 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.20: names the stopped item from the stop on, and has none before it` |
| U8 | `client/src/components/dragChrome.test.tsx` | `DRAG-6.20: flashes the row it names, for the flash’s length` |
| U9 | `client/src/components/dragChrome.test.tsx` | `DRAG-6.20: leaves every other row, and every row while none is named, without it` |
| U2 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.27: is held across the stop’s own reload, however long it takes: the clock starts when the board is drawn` |
| U3 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.27: is let go once it has played, while the banner stays for its own time` |
| U4 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.27: is let go when another reload starts after it has been drawn, so its rows don’t flash again` |
| U6 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.27: is let go at the next drag’s start, with the banner` |
| U5 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.22, DRAG-6.27: is not drawn at all by a reload that finishes with no stop behind it` |
| U10 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `TREE-1.14, TREE-1.15: holds the carried subtree, and the height the cap reads, for the whole drag` |

| Case | Confirmed part and remaining Then clauses |
|---|---|
| DRAG-6.20 | U1 names the reported item; U8/U9 check only its row hook receives the flash class, attribute and duration. Missing: actual interrupted-item identity versus the earlier write's item, two rendered amber pulses, all Free Card/expanded Stub/open-modal forms, following the reloaded saved location, and unchanged saved placements. |
| DRAG-6.27 | U2–U6 check waiting through a slow reload, the callback-started hook deadline, independent banner lifetime and clearing/no-report guards. Missing: all three real resync triggers through loading and board mount, the rendered pulses/deadline, an actual new pickup during the playing window, no replay after ending it or redrawing, and the board-based deadline when the item is hidden. U6 directly calls clear immediately after report; it is not a running-window gesture test. |
| DRAG-6.22 | U5 adds a flash-ID guard for reload/draw with no report. The baseline's B11–B14 remain approved partial evidence. Missing: no rendered banner, announcement or flash across the full cancel/no-write scenarios, all three no-live-drag resyncs and the live-column boundary. No new stamp covers that column boundary. |
| TREE-1.14 | U10 retains the pickup descendant set after a rerender adds X1a, and X1a is not in that set. Missing: the earlier saved Y move arriving, the visible placement candidate/gap and continuing gesture, sending the cyclic release, server 400, unchanged saved positions and preservation of the earlier move, and exclusion on the next pickup. |
| TREE-1.15 | U10 keeps the pre-growth valid cap result when the subtree grows. Missing: the case's pending saved-move scenarios and displayed positions, the grown-subtree release/400/unchanged positions, the entire shrink/no-request branch, and both new-pickup outcomes including the later valid saved move. |

U10 moves no existing descendant out, so TREE-1.16 receives no stamp or mapping. DRAG-6.28 receives none either: no test reveals an item partway through the original window or after its deadline across collapsed, overflow and modal surfaces. These unchanged gaps remain in Story 10.

## Lost Coverage

None. All 306 previously Automated cases have at least one unskipped ID-bearing test, directly or through an inherited describe. Both newly closed cases also do. No mandatory demotion is required.

The whole-catalog source scan covers all 94 Vitest/Playwright test files in client/src, server/tests and tests, including lettered TC-5a and cross-cutting TC-X suites. It handles inherited describes and excludes skipped/fixme/todo declarations and skipped ancestry. There remain 21 skipped E2E declarations and zero unit skips; none supplies coverage. This check does not expand the full-Then review to unrelated cases.

## Unknown IDs

None in test-title claims, inherited describes or the additional test-source text scan. No ID-bearing title violates the required prefix form. None of the five Planner-set Manual cases is claimed by a test title: DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25 and DRAG-7.20. All remain untouched.

## Proposed Stamps

No new proposal. Batch 6's exact approved internal titles and four existing delete-test stamps are confirmed above. A2's widened stamp supersedes the removed missing-owner-only test. No stamp is added or proposed for the intentionally untagged implementation safeguards, TREE-1.16, the hidden/late-reveal cases or the unbuilt column banner.

## Proposed Internal Mappings (need approval)

No new approval needed for Batch 6. All four named groups from the follow-up report's Proposed Stamps 3–5 are now approved and stamped, but partial, so their catalog Automation lines stay `—`.

Earlier named approvals, existing catalog pointers and the README's two standing internal categories remain valid. Earlier item 9 remains **unapproved**: DRAG-1.28 and DRAG-3.22 in dragOverlayGeometry.test.ts (plus DRAG-3.22 in placement.test.ts), and DRAG-4.12 in KanbanCard.test.tsx. Their exact titles, scope and still-missing surface clauses remain in [the baseline's Proposed Internal Mappings](test-reconciliation-story-8-9-follow-up.md#proposed-internal-mappings-need-approval); they remain routed to Story 10. Approval is not extended to neighboring tests or whole files.

## Proposed Manual (need approval)

None. No new Manual approval was supplied. The remaining scoped outcomes have precise assertions; this run makes no later flakiness/cost judgment.

## Gaps

The two server gaps assigned to Story 8.9 are closed. The partial internal cases' exact missing clauses are above. DRAG-3.25 remains Open: its full rendered-height assertions are not supplied by the class retitle below. Story 10 retains these and the unchanged gaps in [the baseline's Full-case decisions table and Gaps](test-reconciliation-story-8-9-follow-up.md#full-case-decisions-and-remaining-clauses), including the remaining unskipped/skipped surface work. No old gap is silently closed by an approved stamp.

DRAG-6.26 remains Planned, an Architect build handoff rather than a missing test on delivered behavior. When that passage is built, the Planner must remove only DRAG-6.22's column/no-cue clause and make DRAG-6.26 Open. No Batch 6 product change triggers that transition. DRAG-2.11's earlier closure is unchanged.

## Duplication

A1/A3 overlap parts of A2's rejection coverage while retaining message/order checks. D1–D4 overlap the new complete deletion test; D2 additionally checks project deletion, D3 legal inheritance, and D4 the smaller ownerless fixture. They remain in place; no deletion judgment is made. U2/U3 overlap expiry, U4/U5 no-stop reload behavior, as already reported. The shared-walk duplication question remains answered by [the baseline's Duplication](test-reconciliation-story-8-9-follow-up.md#duplication); Batch 6 changes no such assertions.

## Test Quality Concerns

1. **Required owner and full deletion:** A2 and the owned/ownerless `it.each` now assert the full revised cases, as detailed above. These resolve the baseline's current-story quality concerns 3–4. Direct legacy fixture writes establish otherwise unreachable starting data; they do not replace the route under test.
2. **Padding title:** `client/src/components/cardMetrics.test.ts` now says `has the height class, and no vertical padding class, in the classes of the box every Stub-sized row shares`. The diff changes only its title: it still checks the height class and absence of p/py/pt/pb classes on the constant. The title now accurately states those assertions and no longer claims padding adds outer height. It carries no case ID. It still measures no rendered height, pill, margin/list pitch, overflow/modal/static row, ghost or carried border, so DRAG-3.25 remains Open with `—` and routed to Story 10.
3. **Internal approvals do not complete surface clauses:** U1–U10 remain the same hook/class/snapshot assertions. Their new prefixes establish approved partial associations, not real trigger wiring, rendered pulse/fade progress, late-mount remaining time or saved-move/refusal scenarios. No new implementation discrepancy or runtime failure follows from the missing coverage. The remaining placement/flash concerns in the baseline are unchanged.
4. **Story open questions:** the padding question is resolved by the truthful retitle; the shared-walk overlap verdict is unchanged; the amended cases have the closures and exact remaining clauses above. The unbuilt column banner remains separately routed. No broader test-quality review was repeated.

## Uncatalogued Tests

Implementation safeguards stay untagged, without a forced mapping:

- `client/src/components/workflow/useForcedStop.test.ts`: `gives each stop its own key, so one that replaces a live stop is told apart from it`; `goes to a second stop’s item, which waits for its own reload`.
- `client/src/components/ForcedStopCue.test.tsx`: `draws a fresh banner for each stop, and keeps the one it has for a redraw of the same stop`.
- `client/src/components/cardMetrics.test.ts`: the retitled padding/class check above and its unchanged class/number consistency checks. These do not prove DRAG-3.25.

The preceding report's other implementation-only exclusions stand. The formerly untagged delete tests D1–D4 now carry an existing case ID; the omitted-owner-only test was absorbed into A2. No deleted probe counts as coverage.

## Candidate New Cases

None. The existing cases already describe the scoped scenarios. Missing assertions need coverage of those cases, not invented cases for implementation keys or classes. The baseline's intentional exclusions remain unchanged.

## Totals

The real suite tables contain **428 cases**, with **428 matching bodies and unique IDs**. There are no duplicate table/body IDs, differing ID sets, priority mismatches or status mismatches. The README's illustrative DRAG-5.1 row is excluded. Before this edit: 306 Automated, 113 Open, 5 Manual, 2 Planned, 2 Pending PO. One P0 and one P2 move from Open to Automated:

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 113 | 134 | 61 | 308 |
| Open | 29 | 66 | 16 | 111 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| Total | 142 | 203 | 83 | 428 |

Writes are limited to the two synchronized statuses and two Automation lines in `docs/test-plans/project-tree/tree-10-which-workflow.md`, plus this new report. No tests, product code, wiki, plans, previous reports or process definitions were edited; no commit or agents were launched. Shell use was read-only inspection/search and disposable in-memory source analysis. This Reconciler ran no app, tests, package installs or documentation gate.

The Coder's gate result in Amendment 9 (server 438, client 672, scripts 245) is reported build evidence, not this run's execution. The parent separately reports `npm.cmd run check:docs` passing (397 files, 0 hits) and `git diff --check` passing on the catalog edit before this report was completed. Final documentation verification, including this report, belongs to the parent.

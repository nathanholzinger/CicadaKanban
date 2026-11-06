# Story 8 close-out — confirming test reconciliation

Latest source review on 2026-11-06 covers **only DRAG-1.19 and TREE-4.14**, against each whole Then. Both residual gaps are resolved; both cases move Open → Automated. At Nathan's explicit request, this amends the existing confirming report rather than creating another. The earlier confirming review's five other mappings and approvals are carried forward below; they were not quality-reviewed again. No tests, servers, browser sessions or probes were run, and no runtime pass or failure is recorded.

Inputs: root `AGENTS.md`, `.claude/agents/test-reconciler.md` (Markdown body), the workflow directory's `AGENTS.md`, catalog conventions, documentation standards, the story plan's Test-plan scope/D13/step 5/Open questions/Handoff/Amendments, and the prior report's Coverage Mapping/Gaps/Test Quality Concerns/Proposed Stamps/Proposed Internal Mappings. Unchanged background remains in [the prior report](test-reconciliation-story-8-close-out.md).

Rules re-read for the latest two-case review: wiki board-drag-interaction §1.1, §2 and §5a; wiki project-tree §4. The earlier confirming review also read wiki board-drag-interaction §10; wiki project-tree §1, §2 and §6; wiki hierarchy-placement §1, §4, §5 and §8; wiki boards-columns-unsorted §1, §3 and §4.

## Coverage Mapping

Latest review: DRAG-1.19 and TREE-4.14 move Open → Automated. The five other Automated mappings below are unchanged results of the earlier seven-case confirming review, not five new promotions or rechecks.

File keys below name exact repository paths:

| Key | File |
|---|---|
| P | `client/src/components/workflow/popSession.test.ts` |
| U | `tests/ui/project-tree-drag.spec.ts` |
| S | `client/src/components/sidebar/SortableProjectRow.test.tsx` |
| H | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| C | `client/src/components/sidebar/useProjectCollection.test.ts` |
| L | `client/src/components/workflow/useBoardLoad.test.ts` |

Titles below are literal leaf titles; a named enclosing describe supplies the case ID where the leaf does not repeat it. None of these declarations is skipped.

| Case / final status / Automation files | Exact evidence and resolution |
|---|---|
| **DRAG-1.19 — Automated — P (latest recheck)** | P, describe `DRAG-1.19: a distant yank out of a Card cascades through two pops, one layer at a time`: `DRAG-1.19: $origin, one sample past both bounds pops to K and on to Board`; `DRAG-1.19: $origin, a sample that rests inside K, far from P, pops once and stays in K as a shortCard`; `DRAG-1.19: $origin, a sample far from P but short of popDistancePx outside K pops once and stays in K`. The distant call now asserts the exact parent-read trace `[Descendants → K, K → Board]`, initial Descendants/stub and final Board/shortCard. The inside-K and near-K calls each assert only `[Descendants → K]` and final K; inside-K also asserts shortCard. Both origins, merged outer-body/sub-row bounds and set/zero clocks remain. Whole Then covered; ordered-intermediate residual resolved. |
| **TREE-1.1 — Automated — U, S** | U: `TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement` checks gap A1a/B, depth 2, line ownership/name indent, B's one-row displacement, stationary ancestors, unchanged row count, saved A1 parent/position after A1a and drawn depth. U: `TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows` checks the last-crossing release, exact `{parentId: null, prevId: B, nextId: null}` request, B/A/C order, saved null parent and reload. S's two newly stamped line tests below complete top edge and full strength. Whole Then covered together. |
| **TREE-1.9 — Automated — U, S** | U: `TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap` checks A1a/B → B/end, the returned ghost's own single line at depth 0, no write and unchanged stored X. S's first line test below supplies the top-edge property. Whole Then covered together. |
| **TREE-2.9 — Automated — H, S** | H, describe `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse`: `%s: the line is %j` covers all five actual trees/expected labels; `with %j collapsed, the five descendants still count, and none is left among the rows drawn` covers collapsed A, X and both, exact five member IDs and drawn Q/X; `holds the counts and the membership for the whole drag, and never counts X itself` checks branch identity through movement and excludes X. S, same describe: `%i children and %i descendants: the copy says %j` checks four exact rendered labels and one line; `TREE-2.9: has no line without a branch` covers no second line. Real-tree computation plus rendering covers the whole Then. |
| **TREE-4.14 — Automated — C (latest recheck)** | C, under `TREE-4.14: an older tree read preserves a write already applied in the sidebar`: `keeps an edit’s name when the first read lands with the tree as it was`; `keeps a move’s parent and order when the first read lands with the tree as it was`; nested `a later refresh holds to the same rule: its older read is dropped and the tree is read again` → `after an edit` and `after a move`. A numeric render mark is captured after the applied write, and the live array's suffix is read after the old response/follow-up. Final and every captured post-edit sidebar render now assert P stays Renamed and Q retains `{name: 'Q', parentId: null, position: 2}`. Move final/history assertions retain A/X/B, one X under P at 1.5 and no top-level X. Later refresh covers both writes and every captured post-write render. Whole Then covered; Q-name residual resolved. |
| **BCU-1.7 — Automated — L** | Under `BCU-1.7: a late load for another board cannot replace the selected board or complete its loading or cue`: `keeps B selected, showing CB1 with X1 and CB2 with X2, when A’s answer lands`; `keeps B’s items, not A’s older snapshot of them: X1 stays Current`; `leaves B loading when its own load is unanswered, and shows no board of A’s`; `keeps the stop cue waiting for B’s own reload, which A’s late answer neither ends nor draws`. The first now asserts CB1→W1→X1 and CB2→W2→X2 on the returned board, plus replacement items' IDs/workphases/titles and one replacement call. Other givens assert no Old item, B pending/no A result, no cue completion until B's reload, and B's successful completion. Whole Then covered at D13's approved abstraction. |
| **BCU-1.8 — Automated — L** | Under `BCU-1.8: a shared change begun on another board refreshes the board currently selected`: `reads B again when the follow-up load starts after B loaded, and B shows CB1 as Doing`; `shows B with the new name when B was still loading, whichever read lands last`; `never returns the selection to A: the handler’s load asks for the board selected now`. Both loaded/loading variants now assert CB1→W1→X1 and CB2→W2→X2, replacement item IDs/workphases/titles, B identity/columns and Doing, including after the late Ready result. A/B/B request history establishes the current-selection reload. Whole Then covered at D13's approved abstraction. |

S's exact added shared line titles, inside `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move`, are:

- `TREE-1.1, TREE-1.9: draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet`;
- `TREE-1.1, TREE-1.9: keeps the line at full strength while the ghost is dimmed: it sits outside the dimmed box`.

The first checks one line with the top-edge class and no line without a gap. The second checks the dimmed ghost's classes, that the line is outside its dimmed content box, and that those classes do not dim the line. These assert the missing presentation contract rather than merely adding IDs.

Nathan explicitly approved all three requested mappings during the earlier confirming review: S for TREE-1.1 and TREE-1.9, and H+S for TREE-2.9. The parent relayed the exact response, “Approve all three mappings.” Those approvals are carried forward. D13's approval of C for TREE-4.14 and the standing drag-clock approval for DRAG-1.19 already authorize the latest mappings; no renewed approval is needed or inferred from the rerun request. No new H pointer is added beside U for TREE-1.1's or TREE-1.9's already surface-covered release behavior.

## Lost Coverage

None in the fresh whole-catalog check. All 315 cases Automated at this latest run's start have active title claims; both newly promoted cases also have active claims. No out-of-scope downgrade is required. This title-presence check does not certify the whole Then of out-of-scope cases.

## Unknown IDs

None in actual test titles, including skipped declarations and inherited describe claims, across the canonical roots. No Manual case ID is claimed by an active or skipped title. Strings containing sample test source in checker tests are fixtures, not executable declarations.

## Proposed Stamps

None remain. Latest review: every test used for DRAG-1.19 and TREE-4.14 carries its ID directly or by describe inheritance. Earlier result carried forward: the two line tests proposed in the prior report carry TREE-1.1 and TREE-1.9, and all evidence used for the other five mappings carries its case ID.

## Proposed Internal Mappings (need approval)

None pending. The earlier three approved additions remain applied. D13's approval of C and the standing drag-clock approval allow the two newly complete mappings to be applied now. D13's L approvals and mappings are carried forward unchanged. Approval of a layer is separate from the whole-Then review performed above.

## Proposed Manual (need approval)

None. No Manual proposal was approved or applied. Both formerly remaining obligations now have precise assertions. Story 10's accepted brittle-gesture skips and TREE-1.14's previously accepted cyclic-release route are carried forward unchanged.

## Gaps

**No gap remains in the latest two-case scope. DRAG-1.19's ordered-intermediate gap is resolved.** In P's `DRAG-1.19: $origin, one sample past both bounds pops to K and on to Board`, `readingParents` observes each region's `parentRegionKey` read, and the asserted `layersLeft` is exactly `[Descendants → K, K → Board]` for that one distant `advancePopSession` call. Supporting source inspection confirms this property is read only when the current locked region's pop is due and supplies `transitionTo`'s destination. The trace therefore establishes the intermediate K transition and its subsequent pop on the same sample, rather than merely naming K in a fixture or obtaining K from a different cursor input. Consecutive duplicate property reads are collapsed; no transition between distinct layers is removed by that collapse.

The inside-K and near-K tests additionally assert one parent transition only; inside-K retains the shortCard assertion fixed earlier. Both origins, both bound shapes and both clock variants remain. These complementary cursor inputs are not substituted for the distant call's own ordered evidence. The whole Then is now asserted under the standing approved parameterized drag-clock mapping.

**TREE-4.14's unchanged-Q-name gap is resolved.** C's `keeps an edit’s name when the first read lands with the tree as it was` now asserts Q's original `name: 'Q'` alongside its null parent and position 2, both finally and in every render from the post-write mark onward. `makeProject('Q', ...)` supplies the original name Q. P remains Renamed in those same observations. The previously fixed live-history, move-order/parent/no-root-copy and both later-refresh variants remain intact and satisfy the rest of the Then. D13 and Nathan's explicit 2026-11-06 approval already authorize this hook mapping.

The earlier confirming review's other five complete mappings remain carried forward. This latest review establishes closure of the two residual assertion obligations; it makes no production-defect or runtime-pass finding.

## Duplication

Latest two-case review: the three P titles complement one another's distant/inside/near-boundary inputs; C's initial-read and later-refresh rename/move titles test the case's distinct variants. No additional mapping is needed. The following observations are carried forward from the earlier review:

- TREE-1.1: U's last-crossing regression overlaps H's `after A’s last movement makes B the nearest row, a release without moving again saves A after B at the top level`. U adds real dnd-kit sequencing and persistence. H remains approved supporting evidence, with no unnecessary new catalog pointer.
- TREE-1.9: U's return/no-write test overlaps H's `the cursor leaves for the gap above B and comes back to X’s row: the ghost is in X’s own gap, and a release sends nothing`. U plus approved S suffices. TREE-1.8 still has its separate unchanged-data/never-leaves obligations; no case consolidation is proposed.
- TREE-2.9: H computes hidden-tree counts; S checks rendered copy text. They are complementary. Additional active stamped tests were found in H (the five TREE-1.16/TREE-2.9 branch tests), `client/src/lib/hierarchyPlacement.test.ts` (`holds every row under the item at any depth, with its children and the whole branch counted`; `counts a branch deeper than its children apart from them`; `is null for an item with nothing under it, since nothing is carried`; `never holds the item itself`, each prefixed `DRAG-8.8, TREE-2.9:`), and `client/src/components/dragChrome.test.tsx` (`says one child as “+ 1 child”, with no total when it is the whole branch`; `says the children alone when every descendant is a child`; `says both counts when the branch is deeper than its children`, with that same prefix). These add overlapping unit evidence; the approved H+S pair supplies the complete mapping, so no extra internal mapping is needed.

## Test Quality Concerns

**Resolved and rechecked — TREE-4.14's history/move coverage and Q's name.** `watchRenders` records `sidebarProjects`; `drawnNow` returns an index, and `drawnSince(mark)` slices the live history after asynchronous work. The asserted suffix therefore includes intermediate captured renders, unlike the pre-response copied array. `expectMoveDrawn` checks the child order, parent, one X and no root X for each render; later-refresh `after a move` retains that variant. Rename final and repeated-render assertions now protect Renamed and Q's original name, parent and position. The prior history/move fixes remain complete; the latest addition closes the narrow Q-name omission the first run missed. Expectations are literal case outcomes, not values computed by the hook under test.

**Resolved — BCU association assertions (carried forward; not re-reviewed).** `placedIn(shown())` inspects the applied board's column/workphase/item associations and compares them with literal case expectations. `handedOver(...)` separately inspects the replacement items' own workphase IDs and titles. Both inspect outputs, rather than relying on fixtures or unrelated flattened ID lists. The approved hook layer is sufficient; no UI evidence is demanded.

**Resolved — sidebar presentation and seeded-count questions (carried forward; not re-reviewed).** The S stamps, approved during the earlier confirming review, complete line placement/strength with U's returned ghost. S's seeded branch counts prove rendering; H's actual tree/collapse/pickup/movement tests prove computation and retained membership. Neither is treated as whole hidden-tree proof alone.

**Resolved and rechecked — DRAG-1.19.** The distant sample's exact ordered parent-read trace now supports the title's two-transition claim; Gaps explains why these are observations of due current-layer pops. Inside-K retains explicit `overlayFormFor(placementRegion(...)) === 'short-card'` and asserts its single pop. Literal expected parent destinations follow the wiki's stack and fixture topology; the test does not call the transition function to construct its own oracle. The bound/clock/origin matrix and near-K distance counterexample remain intact.

## Uncatalogued Tests

No forced mappings. Supporting readiness/error tests under inherited case describes still count in the fresh title scan, but are not substituted for the case's behavioral givens. C's `is loaded when the latest read fails, with nothing in it` is such support in the latest scope; L's `finishes the cue and the loading state for the selected board’s load that fails` is an earlier carried-forward example. Unstamped helpers/structural tests are support evidence; this latest two-case review does not audit every unstamped test's coverage-gate purpose.

## Candidate New Cases

None established in the latest two-case review. Both now-resolved residual obligations belong to existing case Thens. The earlier no-candidate result is carried forward; no MCP-only candidate or implementation-derived requirement is added.

## Totals

Actual case definitions counted once, excluding README/INDEX examples:

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 114 | 144 | 59 | 317 |
| Open | 32 | 96 | 24 | 152 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| Total | 146 | 243 | 89 | 478 |

Latest two-case run: from the independently verified 315 Automated / 154 Open baseline, two P1 cases move Open → Automated, yielding 317 / 152. The earlier seven-case confirming review's five promotions (one P0, four P1) are carried forward. Summary rows and body statuses/pointers are synchronized. Priorities, definitions and the other status classes are unchanged.

**Mandatory whole-catalog method and limits.** Disposable in-memory Node/TypeScript AST analysis read all 122 `.test`/`.spec` files under `server/tests/`, `client/src/`, `tests/` and `scripts/`, including TSX/MTS, excluding dependency/build/coverage/output directories. It recognized it/test/describe property chains, enclosing describe IDs, comma-separated IDs, literal/template titles, `.each(...)` and tagged-template builders; ancestor skips propagate and skip/fixme/todo declarations do not supply active claims. A companion search inspected actual skip and template forms: no conditional skipIf/runIf declarations were found. The browser template keeps its literal DRAG-7.35 prefix; script template titles have no IDs. A regex `.test(...)` call found during traversal is not a test declaration and supplies no claim. Checker source-string fixtures are not parsed as declarations. Each parameterized declaration is counted once, not once per runtime expansion.

The fresh scan found **1,836 leaf declarations, 22 skipped declarations and 428 distinct IDs with active claims**. Lost Automated claims: **0**; unknown title IDs: **0**; Manual IDs claimed by any actual title: **0**. Catalog totals were independently recomputed before and after the two updates. These are source/catalog results, not configured runner collection, runtime success or an out-of-scope quality judgment.

Final writes in the latest run are limited to DRAG-1.19's and TREE-4.14's Open/Automated statuses and Automation lines, and this explicitly authorized amendment to the existing confirming report. Its twelve required sections and the earlier five mappings/approvals are preserved. No new report was created; existing test/code/wiki changes and the prior report are preserved. The parent handles the story handoff and documentation checks.

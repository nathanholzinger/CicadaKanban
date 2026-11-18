# Story 10 batch 4b — Free/null-position return proposing delta

**Reviewed 2026-11-09 · PROPOSING ONLY.** Scope is the existing DRAG-3.3 request gap, DRAG-6.10 preview, TC-6.9 fallback and DRAG-3.12 own-region intersection. This carries unchanged analysis from the frozen [append return](test-reconciliation-story-10-batch-4b-append-return.md) and [post-Coder review](test-reconciliation-story-10-batch-4b-post-coder.md); it does not repeat the whole-26 review. The Reconciler ran no tests and wrote only this report. All 26 batch cases remain Open until accepted validation/Stop5; the four existing Automated cases reviewed here retain their fields.

**Conclusion:** the retained composed regression now proves the foreign Board-Middle/null-position request has no anchor or side, with an end preview. A permanent extra UI test is optional for that request branch under the approved internal category. A separate existing conditional gap remains: a Free/null-position item over its own Board-region Middle with peers would still write. That missing set-down suppression predates this return; the return changes the old anchored write to a workphase-only write. Physical reachability of that null-position own-region state is unproved. The valid tested locked-Column append must be preserved when the separate Board guard is addressed.

## Coverage Mapping

Authority is wiki board-drag-interaction §2, §5 and §10, wiki item-positioning §2, and the current cases. Board bands and a locked Column's within-action are different contexts; no wiki/case amendment or new ID is needed.

| Case / current status      | Delta assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRAG-3.3 / Automated / P0  | The new composed test in `client/src/components/workflow/placement.test.ts` reaches foreign Board-Middle with Free X from a done workphase, position null, and two destination rows. It independently requires only the destination workphase in the request. Existing positioned-X UI evidence remains in `tests/ui/drag-column-bands.spec.ts`; the new positive control preserves positioned foreign-Middle intent. Together with the already-linked preview and route cases below, the missing foreign-null request clause is statically covered. |
| DRAG-6.10 / Automated / P1 | Three existing expectations change representation: Board end preview, locked-Column end fallback, and the null-position helper. End drawing remains end drawing, using the generic end-placement regression reviewed in the append return. Existing approved paths `placement.test.ts` and `itemListOps.test.ts` remain valid. No representation terminology belongs in the living case.                                                                                                                                                             |
| TC-6.9 / Automated / P1    | Unchanged `server/tests/routes/items.positioning.test.ts`, `TC-6.9: a reopened done item takes the append fallback, not the position it had before`, proves a no-anchor reopen gets 7 after true workflow maximum 6. The new client regression proves the caller omits the anchor; the route proves what the server then does.                                                                                                                                                                                                                       |
| DRAG-3.12 / Automated / P0 | The new positioned own-region control preserves no-write, but it does not cover null position. With Free X/null, its own active covered region, Board-Middle and peers, the shared fallback still produces a request. Wiki §5 requires no request for this set-down; it contains no null-position exemption. The existing `tests/ui/drag-band-contracts.spec.ts` surface mapping remains unchanged. This review identifies a conditional branch gap, not a reproduced physical failure or a new regression.                                          |

### Exact retained regression register

All four new tests below are in `client/src/components/workflow/placement.test.ts`, under `what an item with no position asks the server for`:

| Exact title                                                                                                                   | What it proves / limit                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DRAG-3.3, DRAG-6.10: the Board-layer middle band sends the region’s workphase alone, with no anchor`                         | Composes the actual null-position preview with request conversion; literal exact request outcome, independent of the implementation's expected-value helper. This closes the prior foreign request gap.                                                                                          |
| `DRAG-6.10: a release on the bare container of the column it is already in names its workphase, which asks for the append`    | Explicitly starts **locked in its own Column**, releases on its bare container and expects the same-workphase field without an anchor. With no other row, it expects no request. It does not exercise a Board-layer set-down or establish physical reachability of this own-column/null fixture. |
| `DRAG-3.2: the bottom band still sends the anchor after the last row`                                                         | Free/null Bottom remains anchored after b; it is not converted to the no-anchor Middle meaning.                                                                                                                                                                                                  |
| `DRAG-3.3: an item with a position keeps it — the middle band sends the region’s workphase alone, and its own region nothing` | Foreign positioned Middle stays workphase-only and positioned own-region Middle stays no-write. Its own-region X has a real position, so it cannot discriminate the remaining null branch.                                                                                                       |

The existing DRAG-6.10 titles remain unchanged: `placement.test.ts` — `DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep`; `itemListOps.test.ts` — `DRAG-6.10: keeps the position sort when there is a position to keep, appends otherwise`. Their new end intent omits the anchor while preserving the ordinal preview. `dragRequest.test.ts` is byte-unchanged from the append return.

### Board set-down versus Column append

The extra same-workphase field is valid for the new test's locked-Column bare-container append: wiki item-positioning §2 permits an explicit same-workphase/no-anchor append, and a request with no fields places nothing. It is not a Board-band authorization.

The shared request path has no Board-only membership suppression for a Free/null-position own-region Middle release with peers. The release tail uses that shared result; it adds no later no-write guard. In the prior accepted append return, the same conditional input selected an after-last-neighbor request. This return makes it a no-anchor request naming the unchanged workphase. Both are writes, so the unsettled issue is **existing missing Board set-down suppression**, not invalidity of the Column field or a newly introduced regression. Terminal own-region handling and ordinary positioned set-down remain separate positive controls. No physical reproducer for the active own-region/null state is established here.

Precise separate Coder handoff: add an ID-bearing DRAG-3.12 regression in `placement.test.ts` for **Board layer + Free X/null + own covered region + Middle + peers**, expecting no request; address that guard while preserving the tested locked-Column bare-container append, foreign null-Middle no-anchor request, empty-list single-card no-write, positioned Middle and explicit Bottom. This follows an existing settled rule; no Pending PO/new-case text or expansion of the frozen 26/70 matrix is proposed. App/Vitest work still requires the separate Coder/check-in boundary.

## External execution evidence

The Reconciler independently counted these Coder-produced JSON results; it executed none. All recorded results have retry 0. Durable JSON metadata is not a claim that this review reproduced source mutations.

| Artifact in `tests/output/`                | Observed result                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coder-null-position-append-full-e2e.json` | 415 results: **394 passed /21 skipped /0 unexpected**, no flaky results or runner errors; duration 751754.812ms. The corrected expanded held B18 path also passes in this full run.                                                                                             |
| `coder-b18-expanded-held-after-null.json`  | Three passes of `DRAG-5.3: B18 expanded sub-row locked-after-A detach uses the destination meaning`; duration 21758.115ms. The prior driver correction is byte-unchanged. This is not D2.                                                                                       |
| `coder-reopen-append-red-oldslot.json`     | One failed historical scratch execution, `scratch: reopened done X released in a foreign middle band`, formerly `tests/ui/zz-coder-scratch.spec.ts`. Retained output records X/null in done, an anchored request, saved position 4 and destination A/B at 1/2.                  |
| `coder-reopen-append-green.json`           | One passing scratch execution, same title. Retained output records no anchor/side and saved position 7; A/B remain 1/2. The true workflow maximum of 6 is the Coder's reported fixture context, independently consistent with the permanent TC-6.9 route's explicit 6→7 oracle. |

The scratch source is deleted and carries no case ID: these executions are historical discriminating evidence, **not a durable regression or current mapping**. The Coder reports red/green/mutation checks for the permanent regressions and gate 444 server /1040 client /258 scripts, docs 433/0. This review assesses the retained assertions and available JSON; it does not independently certify unretained unit mutation executions or rerun that gate. The former stale-rectangle explanation is not promoted to a proven cause; the source-unchanged corrected held driver is now green in the retained focused and full runs. No D2 or Stop5 claim follows.

## Lost Coverage

None across 484 cases. All 352 Automated cases have active qualified-ID carriers; none is skip-only. All 26 batch cases still have carriers. Global skip declarations remain 21. This mandatory identity check is not a whole-Then audit of the unreviewed catalog.

## Unknown IDs

None in current test/describe claims. No active/skipped carrier claims a Manual case. Retired DRAG-4.35 and the deferred B09 seed-line guard remain absent.

## Proposed Stamps

No additional stamp is needed on the retained foreign-null regression: it already carries DRAG-3.3/DRAG-6.10. A separate DRAG-3.12 regression for the conditional Board set-down is still unwritten; the Coder adds its ID when authoring it. The existing positioned own-region control is not a substitute. No catalog field is written here.

## Proposed Internal Mappings (need approval)

No new approval requested. The README's outright-approved client ordering/request category applies; DRAG-3.3/DRAG-6.10/DRAG-3.12 are not among Nathan's specifically declined baseline mappings. For a later authorized application, `placement.test.ts` is an eligible DRAG-3.3 complement because the current UI carrier does not cover the foreign-null request branch. This does not add an internal pointer beside whole-case surface proof. Existing DRAG-6.10 internal pointers stay. The composed request regression, approved preview evidence and delegated TC-6.9 route suffice for the foreign branch; a permanent discriminating surface fixture is optional, not a requirement to resurrect the deleted scratch or expand 4b. The separate Board set-down gap must still be resolved; neither internal nor full-suite passes waive it.

## Proposed Manual (need approval)

None. No failing or conditional business clause is replaced with Manual.

## Gaps

Only the conditional Board own-region/null/peers no-write guard above is newly surfaced by this bounded review. Reachability remains unproved; the rule is settled. Existing 4b later validation and Stop5 obligations remain; no case is promoted. Stable scope analysis is carried from the earlier reports.

## Duplication

The new request composition and existing server fallback test cover different sides of the client/server boundary. DRAG-6.10's representation checks overlap end preview deliberately. The deleted scratch provides historical integration evidence only.

## Test Quality Concerns

The four permanent regressions distinguish contexts and use explicit request/no-write outcomes; no resolver-equals-itself oracle was found. The missing own-region/null control explains why current green tests do not settle that conditional branch. Do not generalize the locked-Column test's legal same-phase request into a Board Middle permission, or use unavailable scratch code as durable coverage. No claim of a reached physical Given is inferred from a unit title.

## Uncatalogued Tests

No new business scenario follows from an append representation. The deleted scratch is not a current test. Unchanged generic drawing/sync support retains its prior classification.

## Candidate New Cases

None. DRAG-3.3 and DRAG-3.12 already own the two request rules.

## Totals

No statuses or Automation fields change. Direct review: four existing Automated cases, two P0 /two P1. Batch 4b remains 26 Open, 13 P0 /13 P1, 26 expressions /70 variants plus unchanged control. Whole catalog:

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------- | ---- | ------ | ------- | ---------- | ----- |
| P0       | 126       | 19   | 0      | 0       | 0          | 145   |
| P1       | 159       | 84   | 6      | 0       | 0          | 249   |
| P2       | 67        | 16   | 4      | 1       | 2          | 90    |
| Total    | 352       | 119  | 10     | 1       | 2          | 484   |

## Raw identity and write mask

All six raw hashes supplied by Nathan match current files. Relative to the accepted 420-file append baseline, exactly five protected files changed externally: `client/src/components/workflow/itemListOps.ts`, `placement.ts` (return type only), `dragRequest.ts`, `placement.test.ts` and `itemListOps.test.ts`. `dragRequest.test.ts` is unchanged. All nine Playwright/helper hashes match the final append checkpoint, including the corrected held driver. Current hashes also match `tests/output/batch4b-null-return-accepted-before.json` (18:13:10.281UTC).

The six-file aggregate under the known recipe is `f15490ed6d46f8fb6ff4eba88c6d6a5f44d4253d014623651e888fb9a071528f`: SHA-256 of lexically sorted relative path + NUL + lowercase raw-file SHA-256 records, LF-joined with no trailing LF. Nathan's return reports `0cf3e77dfaa5e206715b954d1a7672b80eee58eee01c1e2d94185927bf030b9f` with recipe unspecified. The labels differ; individual raw identities match, so no raw source mismatch is claimed. The full accepted protected aggregate is `6479bf70f08fb2c40300450352759bbc014f696268a1013dfc2b3d1d03bf0293` under the documented path/hash recipe.

This report is the Reconciler's only write. Final checks preserve all 58 actual-start catalog/prior-report raw hashes and the captured workflow source/test baseline, with no catalog, old-report, wiki, plan, source/test, staging or commit changes by this role. Own report formatting, diff and global metadata checks are completed before handoff; the Planner owns the final whole-document check.

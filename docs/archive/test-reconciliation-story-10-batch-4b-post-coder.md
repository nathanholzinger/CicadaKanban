# Story 10 batch 4b — post-Coder Stop 2 proposing delta

**Reviewed 2026-11-09 · PROPOSING ONLY.** All 26 current cases remain Open with Automation `—`; no promotion or source/case change is made. The new all-authored freeze is `tests/output/batch4b-post-coder-frozen-checkpoint.json` (15:59:30.963UTC) and `batch4b-post-coder-frozen-list.json`: **26 scoped expressions /70 variants**, plus unchanged DRAG-1.14 control (**27/71**). No row remains unauthored. A full five-file run, D2 and final full E2E are not done.

**Current blocker:** merged B18’s final cursor is between real drawn dividers at Board layer, yet its single detach request adds B/after instead of the Middle band’s required no-anchor/no-side meaning. This is a current DRAG-5.3/DRAG-3.3 case-contract mismatch. The carried centre lies just below the lower guide; that is an unproved diagnostic lead, not authority to replace the cursor-based expected value. Evidence and limits are below.

This carries assertion-design analysis from the frozen [pre-Coder review](test-reconciliation-story-10-batch-4b-proposing.md) and [Coder-return classification](test-reconciliation-story-10-batch-4b-coder-return.md), only where case/statement inputs are unchanged. The prior 23 expressions/control were compared: only B01/B03/B09 changed; exactly B18/B19/B21/B24 were added. Old runtime passes are not silently certified against new assertions/app state. All 13 new variants and all three corrections were inspected. No further implementation diagnosis, app/test execution or architecture audit is performed.

Scope is the same 26: DRAG-4.1, DRAG-4.3, DRAG-4.5, DRAG-4.8, DRAG-4.12, DRAG-4.13, DRAG-4.15, DRAG-4.17, DRAG-4.19, DRAG-4.20, DRAG-4.21, DRAG-4.22, DRAG-4.30, DRAG-4.32, DRAG-4.33, DRAG-4.34, DRAG-5.1, DRAG-5.2, DRAG-5.3, DRAG-5.4, DRAG-5.9, DRAG-5.10, DRAG-5.13, DRAG-5.14, DRAG-5.15, DRAG-5.16. Retired DRAG-4.35/B14 and B09’s deferred line-place guard remain absent; the retired ID is not reused. Five new sync tests remain generic implementation support. Approved clock-pointer conclusions are unchanged; no Manual/internal replacement excuses a failing surface contract.

## Coverage Mapping

Whole-Then design is carried from the prior full review for unchanged callback bodies, not from titles alone. The current frozen file/title inventory supplies the file sets below. Exact unchanged titles remain in the earlier register; new 13 titles are listed here. All rows remain Open for later accepted validation/Stop5.

| Case / priority | Current UI files                                                                                                              | Delta or carried proof                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRAG-4.1 / P0   | `tests/ui/drag-attach-placement.spec.ts`, `tests/ui/drag-card-zoom-in.spec.ts`, `tests/ui/drag-descendants-placement.spec.ts` | B09 now carries this ID on both live seed-drawing variants; B01/B02 retain immediate release without settling waits. The former drawing identity gap is closed statically; later validation remains.                                                                                                                                              |
| DRAG-4.3 / P1   | `tests/ui/drag-attach-placement.spec.ts`                                                                                      | Carry prior B04 done-parent entry, immediate last-child attach and inherited terminal consequences. Assertion body/Then unchanged; no new gap identified.                                                                                                                                                                                         |
| DRAG-4.5 / P0   | `tests/ui/drag-attach-placement.spec.ts`                                                                                      | Carry B05 same-aim quick reposition versus full-hold attach. Required relation, parent and saved outcomes unchanged.                                                                                                                                                                                                                              |
| DRAG-4.8 / P0   | `tests/ui/drag-descendants-placement.spec.ts`                                                                                 | Carry B11 actual shuffle/depth, four worked states, sole state, branch exclusion and legal committed placements. No changed proof.                                                                                                                                                                                                                |
| DRAG-4.12 / P1  | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | All four B03 variants now require fresh position 1.0: empty/Free-children-only × immediate/moved. No-anchor, attached scope and unchanged Free rows remain. The former bootstrap gap is closed in design; these stronger observations are not certified by older finite-position passes.                                                          |
| DRAG-4.13 / P1  | `tests/ui/drag-attach-placement.spec.ts`                                                                                      | Carry B04’s two terminal-parent placements, fresh position/painted order, unchanged P/siblings and null completion. No changed proof.                                                                                                                                                                                                             |
| DRAG-4.15 / P0  | `tests/ui/drag-card-zoom-in.spec.ts`                                                                                          | B01 now treats raw children as membership and separately checks fresh position order/painted order. Immediate release, full cross-column layers/non-entry inheritance and B27 Board contrast remain. The unsupported enumeration oracle is removed.                                                                                               |
| DRAG-4.17 / P0  | `tests/ui/drag-attach-placement.spec.ts`                                                                                      | Carry B20’s one-pop exit, shortCard forms, no attach and exact Free Q/after saved reposition. No changed proof.                                                                                                                                                                                                                                   |
| DRAG-4.19 / P0  | `tests/ui/drag-descendants-placement.spec.ts`, `tests/ui/drag-zoom-cues.spec.ts`                                              | Carry B06 plus strict B13 named-P entry. The previously unchanged B13 representative passed 1/1 before PW edits; both Coder full-suite JSONs contain all 12 B13 passes. The earlier failure remains historical; no D2 or current all-file acceptance is implied.                                                                                  |
| DRAG-4.20 / P1  | `tests/ui/drag-zoom-cues.spec.ts`                                                                                             | Carry B07’s actual rendered phases/early release and approved clock proof from the Coder-return report. No residual static clock gap; no new internal approval.                                                                                                                                                                                   |
| DRAG-4.21 / P1  | `tests/ui/drag-zoom-cues.spec.ts`                                                                                             | Carry B07’s actual Card/ghost/line geometry and same named relation during cue. No changed proof.                                                                                                                                                                                                                                                 |
| DRAG-4.22 / P1  | `tests/ui/drag-card-zoom-in.spec.ts`, `tests/ui/drag-zoom-cues.spec.ts`                                                       | Carry B08/B27 rendered reset/current-context releases and the added pop/return/cancel clock lifecycle proof. No residual static clock gap.                                                                                                                                                                                                        |
| DRAG-4.30 / P1  | `tests/ui/drag-descendants-placement.spec.ts`                                                                                 | B09 title stamps add4.1 only; seed drawing/depth/save assertions are unchanged. B10 own-slot return/no-write remains. The deferred seed line guard stays absent.                                                                                                                                                                                  |
| DRAG-4.32 / P1  | `tests/ui/drag-descendants-placement.spec.ts`                                                                                 | Carry B15 legal deep fixture, invalid cue/release and valid shallower recovery. No changed proof or style contract.                                                                                                                                                                                                                               |
| DRAG-4.33 / P1  | `tests/ui/drag-descendants-placement.spec.ts`                                                                                 | Carry B12’s exact three nested-last states, clamping, painted placement and saved parents/orders. No changed proof.                                                                                                                                                                                                                               |
| DRAG-4.34 / P0  | `tests/ui/drag-descendants-placement.spec.ts`                                                                                 | B13 source is unchanged apart from another test’s title in the same file. Current replay repairs the known named-entry symptom; movement/depth/closed-origin design carries forward. Full current matrix/repeats remain to validate.                                                                                                              |
| DRAG-5.1 / P0   | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | Carry B17 merged/expanded containing context, both forms, Q/after, one detach and retained P. No changed proof.                                                                                                                                                                                                                                   |
| DRAG-5.2 / P0   | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | Carry B17 non-entry inherited workphase and absent workphase field. No changed proof.                                                                                                                                                                                                                                                             |
| DRAG-5.3 / P0   | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | All eight B18 variants are authored. They assert two outward pops, merged/exact-subrow destinations, top/middle/bottom meanings and held Column reposition. Merged middle has the confirmed request-contract mismatch below. Expanded middle also fails in bounded runs; latest held-path observer correction is UNRUN, not a proved app failure. |
| DRAG-5.4 / P0   | `tests/ui/drag-5-stub-detach.spec.ts`, `tests/ui/drag-descendants-placement.spec.ts`                                          | B19 now supplies populated same/other-column immediate last-child reparent with zero earlier writes, inherited workphase and fresh/painted order. Both passed focused. B03 childless and B13 moved foreign-Stub evidence remain; no missing static Then clause identified.                                                                        |
| DRAG-5.9 / P0   | `tests/ui/drag-5-stub-detach.spec.ts`, `tests/ui/drag-descendants-placement.spec.ts`                                          | Carry corrected B16 native placements and B15 cap paths, exact requests/saved state and no intermediate detach. No changed proof.                                                                                                                                                                                                                 |
| DRAG-5.10 / P1  | `tests/ui/drag-5-stub-detach.spec.ts`, `tests/ui/drag-descendants-placement.spec.ts`                                          | B21 now covers continuous P→Column→Q→Column→P→Column, both copy forms/dimensions and source absence, ending cancel/Board-nowhere. It verifies no writes, full saved X equality and original Stub/order restoration. Both corrected-Given variants passed focused.                                                                                 |
| DRAG-5.13 / P1  | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | Carry B22/B23 nested pickup, branch absence and direct containing-Column Q/after detach with retained parent/child. Planned skip replacement remains.                                                                                                                                                                                             |
| DRAG-5.14 / P1  | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | B24 now proves done-detach preview/newest landing, no workphase/anchor, retained P, same-write completion/null position and source-Stub absence. Focused pass follows visible-handle setup correction.                                                                                                                                            |
| DRAG-5.15 / P0  | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | Carry B25 whole-Card title/padding bounds, held Descendants/two Stub copies and chosen first-child save. No changed proof.                                                                                                                                                                                                                        |
| DRAG-5.16 / P1  | `tests/ui/drag-5-stub-detach.spec.ts`                                                                                         | Carry B26 immediate Free re-pickup and subsequent Q/after with former parent retained. No changed proof.                                                                                                                                                                                                                                          |

## Lost Coverage

**None across 484 cases.** Every 352 Automated case has an active qualified-ID carrier; none is skip-only. All 26 scoped Open cases now have ID-bearing surface tests. Global skipped declarations remain 21 after the three previously authorized reworks; no new scoped test is skipped. The unchanged DRAG-1.14 control is retained. Identity checks do not imply a whole-Then reassessment of458 unscoped cases.

## Unknown IDs

**None in current test/describe claims; no active/skipped test carries a Manual case ID.** No retired DRAG-4.35 title claim exists. The five generic sync tests stay unstamped, and no new case/ID follows from their implementation.

## Proposed Stamps

No new stamp is requested by this delta. Both B09 titles now begin `DRAG-4.1, DRAG-4.30`, closing the prior seed-drawing identity gap. B03 directly checks 1.0 in all four variants, so the wholly-childless TC-2.20 route need not receive a redundant DRAG-4.12 pointer. Clock stamps/additions are already assessed in the Coder-return report. No catalog pointer is written here.

## Proposed Internal Mappings (need approval)

**No new approval requested.** Clock complements remain eligible under the existing approved category: `popSession.test.ts` for DRAG-4.20/DRAG-4.22, plus `useBoardDnd.test.ts` for DRAG-4.22 cancellation. Five sync-support tests remain unmapped; baseline declined proposals remain declined. Surface failures are not replaced by an internal pass.

## Proposed Manual (need approval)

**None.** Existing ten Manual decisions remain unchanged. The request mismatch and unrun validation do not justify Manual treatment.

## Gaps

- **DRAG-5.3:** merged Middle’s confirmed no-anchor/no-side request clause fails. Preserve its unchanged assertion for a separate handoff; implementation cause remains unproved. Expanded Middle has bounded failures but is not granted the merged geometry confirmation by inference.
- **Held-middle paths:** the earlier observer wrongly waited for a Board band after entering Column. The final source correctly skips that Board-only observation after entry and checks Column reposition. Both latest held-path drivers are **unrun**; do not call their historical observer failures product defects or their current bodies validated.
- **Validation:** no current71-variant five-file pass/D2/final full E2E exists. The stronger B01/B03 proof corrections are statically reviewed, not certified by earlier weaker passes. B19/B21/B24 focused success does not close the batch. No unauthored row remains.

## Duplication

Shared case memberships and existing unit/surface overlaps retain the prior review’s disposition. B19 complements childless B03/moved B13; B21 completes the form/restoration round trip; B24 supplies the previously absent done detach. Their thirteen variants are four authored expressions, not thirteen extra case IDs. No deletion or extra internal pointer is proposed.

## Test Quality Concerns

The three proof corrections are appropriate: B09 adds IDs without changing the live drawing test; B03 checks 1.0 at both empty-attached-scope boundaries; B01 makes raw child enumeration order-insensitive while retaining fresh numeric position order, painted order and immediate release. No settling wait was added to B01/B02.

New B19 observes zero writes before a single final reparent and checks fresh/painted last-child order. B21 checks both copy forms/Stub dimensions throughout its continuous sequence and full saved-state/restoration after both no-write endings. B24’s visible handle/scroll setup makes the required pickup reachable, while preview, request and saved completion remain independent. No additional static Then gap is identified in these three new families.

B18 derives its Middle aim from actual rendered divider locations, not an app resolver. Metadata alone is insufficient; physical guides/cursor, popped-out state and the actual request were inspected. Its held paths use the new context’s reposition after entry; they no longer demand a Board-only cue there. Top/bottom helper steering and Middle geometry do not make the app’s own band label the correctness oracle.

## B18 representative: observed contract mismatch, cause unproved

Exact current title: `DRAG-5.3: B18 merged column middle detach uses the destination meaning`, in `tests/ui/drag-5-stub-detach.spec.ts`. The real gesture starts with X attached to P in C1, pops to C1, then to Board, and targets a different merged C2. Pop-in is disabled for this path. No request occurs before release.

In the final geometry replay, saved observations show popped-out/Board with no locked context and band `middle`. The last two recorded mouse moves in the trace are both **(712,424.75)**; release occurs without another move. The PNG visibly places the real dashed guides at approximately **y391 and y459**, with cursor y424.75 safely between them. The source reads the actual settled guide boxes to choose that midpoint; the screenshot supports that the aim remains between them, rather than relying only on an earlier stale rectangle or a label saying Middle.

| Final observation  | Value / significance                                             |
| ------------------ | ---------------------------------------------------------------- |
| Destination region | x576, y294.75, width272, height261                               |
| Actual cursor      | x712, y424.75; between the drawn guides                          |
| Carried box        | x583, y412.750015, logical width246/height96; centre y460.750015 |
| Ghost              | x576, y459.5, width272/height96; painted order A/B/X             |
| Request            | One detach to destination entry phase, with extra B/after        |
| Saved row          | P retained, detached, entry phase, workflow-scoped position5     |

Wiki board-drag-interaction §3 says a Board release uses the column/sub-row under the cursor and its band. Section5 assigns Middle no anchor/side meaning; §8 and DRAG-5.3 apply that meaning to a detach. DRAG-3.3 explicitly uses a **cursor between the dividers**. Those current authorities support the expected no-anchor/no-side request here. The observation is not an unreachable-band or stale-aim failure under that contract.

The carried centre is just below the lower guide, so a different point being read on release is a reasonable investigation lead. The evidence does **not** establish that implementation cause, nor does it establish a rule that the carried centre should define this Board release. It must not silently replace the current case premise. Also, the ghost being last does not uniquely prove Bottom: a detached item entering workflow scope without a position uses the Middle append fallback too. In this fixture both meanings can draw/save A/B/X at position5; the explicit request clause is the discriminator. This is separate from the retired Descendants equivalent-anchor issue.

Three confirmations in `tests/output/batch4b-post-coder-middle-confirm.json`, plus the independent geometry replay in `batch4b-post-coder-middle-geometry.json`, fail the retained request assertion with retry 0. The merged screenshot is `batch4b-post-coder-middle-geometry-artifacts/ui-drag-5-stub-detach-DRAG-a6930-ses-the-destination-meaning-chromium/B18-before-release.png`; its trace and source-free before/saved JSON attachments preserve the evidence. The separate Coder packet should preserve no anchor/side and fresh workflow fallback; no case/schema rewrite or repair is authorized by this report.

## Runtime evidence and limits

The unchanged strict B13 representative passed 1/1 before any PW edits (`batch4b-post-coder-preserved-b13.json`). As corrected in the Coder-return review, both Coder full-suite JSONs include all twelve B13 passes; their first two B03 failures still have unproved cause. None is a current all-authored71-variant acceptance ledger.

The post-Coder focused record has **29 executions:14 passed/15 failed, zero retries**. It includes initial failures, driver corrections, the current Middle confirmations and geometry replay; it is not 29 unique scenarios or D2 acceptance. B19 both pass; B21 both pass after correcting the fixture premise; B24 passes after making the pickup handle visible. Expanded-bottom’s later pilot passes. The latest held-middle observation correction is unrun. No current full five-file run, D2 or final full E2E was executed.

The external Automator’s root gate is green:444 server/1031 client/258 script tests, docs433/0, types/lint/format. Its log/checkpoint are read; the Reconciler runs no app/test suite. A green gate does not establish the missing current gesture validation or erase the failed request.

## Uncatalogued Tests

No new standalone business scenario is inferred. The five sync tests keep their generic support classification. All newly authored Playwright variants carry current case IDs; screenshots/history attachments are observations, not extra tests or fresh catalog cases.

## Candidate New Cases

**None.** DRAG-5.3 already owns the detach-band contract. Retired highlight issues retain their separate design story/future IDs. Copy-centre behavior is an unproved cause lead, not a new rule.

## Totals

All 26 scoped cases remain Open:13P0/13P1, four Extend/twenty New/two Rework. Catalog totals stay484:352 Automated/119 Open/10 Manual/one Planned/two Pending PO;117 active story assignments remain Open, plus two unrelated Open cases.

| Whole-catalog status |  P0 |  P1 |  P2 | Total |
| -------------------- | --: | --: | --: | ----: |
| Automated            | 126 | 159 |  67 |   352 |
| Open                 |  19 |  84 |  16 |   119 |
| Manual               |   0 |   6 |   4 |    10 |
| Planned              |   0 |   0 |   1 |     1 |
| Pending PO           |   0 |   0 |   2 |     2 |

Frozen five-file counts are3 zoom /6 attachment /9 cue /25 Descendants /28 Stub = 71, including one control. Scoped union is 70 from 26 expressions; no row is unwritten.

### New thirteen exact titles

All are in `tests/ui/drag-5-stub-detach.spec.ts`; existing exact titles and clock/support classifications remain in the earlier frozen reports.

| Ref | Exact current title                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------- |
| D01 | `DRAG-5.3: B18 merged column top detach uses the destination meaning`                                       |
| D02 | `DRAG-5.3: B18 merged column middle detach uses the destination meaning`                                    |
| D03 | `DRAG-5.3: B18 merged column bottom detach uses the destination meaning`                                    |
| D04 | `DRAG-5.3: B18 merged column locked-after-A detach uses the destination meaning`                            |
| D05 | `DRAG-5.3: B18 expanded sub-row top detach uses the destination meaning`                                    |
| D06 | `DRAG-5.3: B18 expanded sub-row middle detach uses the destination meaning`                                 |
| D07 | `DRAG-5.3: B18 expanded sub-row bottom detach uses the destination meaning`                                 |
| D08 | `DRAG-5.3: B18 expanded sub-row locked-after-A detach uses the destination meaning`                         |
| D09 | `DRAG-5.4: B19 populated target in the same column receives one immediate last-child reparent`              |
| D10 | `DRAG-5.4: B19 populated target in another column receives one immediate last-child reparent`               |
| D11 | `DRAG-5.10: B21 both copies switch through Q and back to P before cancel restores the original Stub`        |
| D12 | `DRAG-5.10: B21 both copies switch through Q and back to P before nowhere restores the original Stub`       |
| D13 | `DRAG-5.14: B24 detaching in a done column previews and saves the newest Free completion without an anchor` |

## Snapshot, artifact preservation and written file

Only `docs/audits/test-reconciliation-story-10-batch-4b-post-coder.md` is written. Every catalog byte and five earlier report hashes remain unchanged. App/test/wiki/plans/other owners’ round-table documents and staging are untouched; no runtime or Coder is started.

All 420 accepted protected files and nine allowed raw hashes independently match the new freeze. The recorded protected aggregate is `c68f5663ac08690385b9fee2388fddb913e3b6ea64104af46d054e41fdc8595f`; accepted unit raw hash is `236144eca540c3448e1559bd7d7e868e1434c580c32a989dab376a7c2c808c59`. Only Zoom/Stub/Descendants files differ from the accepted Coder baseline; the other files/helpers remain stable. The control body is unchanged.

**Historical evidence limitation:** the checkpoint audit records **37 of 40 original paths byte-identical**, not all 40. Default `tests/output/artifacts/.last-run.json` changed. The old default B14-before-release PNG path is absent, but its three named copies under `tests/output/batch4b-stop2-evidence/B14-attempt-{1,2,3}-before-release.png` are byte-identical. The old default B14 error-context path has no exact copy. Three fixed `B14-attempt-{1,2,3}-error-context.md` / `-trace.zip` bundles remain, but they are not claimed to reproduce that missing original byte-for-byte. These are observed preservation limits; no actor or cause is assigned without evidence. No blanket 40-artifacts-preserved claim is made.

Final global identity, 26-row/13-title inventory, frozen-hash, report-only ownership, local Prettier and diff checks pass. The parent performs the final whole-documentation check after its concurrent plan edits; no duplicate check is claimed here. All statuses remain unchanged; this is an early Stop2 handoff, not Stop4/5 authorization or closure.

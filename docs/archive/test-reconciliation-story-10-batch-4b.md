# Story 10 batch 4b — Stop5 confirming reconciliation

**2026-11-09, America/Phoenix · CONFIRMING.** Nathan authorized this finite close of the accepted 26-case scope. **All26 cases are Automated; no scoped Then remains incomplete.** Applied26 status/Automation updates and their mirrored summary statuses. Separately added the eligible `placement.test.ts` Automation complement to already-Automated DRAG-3.3; that maintenance is outside the26 batch closures. No case wording, ID, priority, rule or other case field changes.

Stable behavioral/assertion analysis carries from the frozen [initial review](test-reconciliation-story-10-batch-4b-proposing.md), [clock classification](test-reconciliation-story-10-batch-4b-coder-return.md), [all-authored review](test-reconciliation-story-10-batch-4b-post-coder.md), [append return](test-reconciliation-story-10-batch-4b-append-return.md) and [null return](test-reconciliation-story-10-batch-4b-null-return.md). Current26 case bodies match those reviewed inputs. Accepted source/test hashes match the Stop4 freeze. This is not another discovery, diagnosis or runtime run; the Reconciler executed no tests.

## Coverage Mapping

The table is the exact26-case scope: four Extend,20 New,two Rework;13P0/13P1. Paths below are the applied Automation fields. Each row's tests collectively prove its whole current Then; individual shared tests need not prove a whole case alone. Referenced consequences remain delegated to their existing cases. The eight clock titles/clauses are registered exactly in the frozen clock-classification report; only their genuinely missing timing/lifecycle clauses are mapped internally.

| Key | Exact mapped path                                    |
| --- | ---------------------------------------------------- |
| Z   | `tests/ui/drag-card-zoom-in.spec.ts`                 |
| A   | `tests/ui/drag-attach-placement.spec.ts`             |
| C   | `tests/ui/drag-zoom-cues.spec.ts`                    |
| D   | `tests/ui/drag-descendants-placement.spec.ts`        |
| S   | `tests/ui/drag-5-stub-detach.spec.ts`                |
| P   | `client/src/components/workflow/popSession.test.ts`  |
| U   | `client/src/components/workflow/useBoardDnd.test.ts` |

| Case / inventory kind / priority | Files      | Whole-Then disposition                                                                                                                                                                                | Status    |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| DRAG-4.1 /New /P0                | A, Z, D    | B01/B02/B09: immediate last-child attach, inherited workphase, reattachment and actual last-gap drawing; raw-child membership remains separate from fresh position/painted order.                     | Automated |
| DRAG-4.3 /New /P1                | A          | B04: a done Card can be entered and attached to as last child, with terminal inheritance and proper sibling position.                                                                                 | Automated |
| DRAG-4.5 /New /P0                | A          | B05: identical named aim gives quick reposition versus held attach, with distinct requests, parent state and saved order.                                                                             | Automated |
| DRAG-4.8 /New /P0                | D          | B11: actual painted shuffle/depth, all four worked states, sole-state boundary, carried-branch exclusion and committed hierarchy placements.                                                          | Automated |
| DRAG-4.12 /New /P1               | S          | B03: all four empty/Free-only × immediate/moved variants have only the legal child placement, no anchor, fresh attached position1.0 and unchanged Free children.                                      | Automated |
| DRAG-4.13 /New /P1               | A          | B04: both terminal-parent placements retain sibling positions, save the two required orders, inherit terminal workphase and leave attached completion null.                                           | Automated |
| DRAG-4.15 /Rework /P0            | Z          | B01/B27: full Column→Board→Column→P route, non-entry inherited workphase, immediate attach without a band anchor; Board release contrast commits its own band.                                        | Automated |
| DRAG-4.17 /New /P0               | A          | B20: one-layer exit removes the uncommitted attach, restores both shortCard forms and saves Free Q/after with original parent retained.                                                               | Automated |
| DRAG-4.19 /New /P0               | D, C       | B06/B13: the actual named/highlighted neighbor, on either side, is entered regardless of bare-cursor target; the strict foreign-Stub named-P representative is retained.                              | Automated |
| DRAG-4.20 /New /P1               | C, P       | B07 plus approved clock tests: silent dwell, visible cue, completion into named Descendants with opening/outline/Stub form; earlier release repositions. Pure scheduling covers stage boundaries.     | Automated |
| DRAG-4.21 /New /P1               | C          | B07: actual Card/ghost/highlight geometry and named relation stay fixed through the cue; release keeps that relation.                                                                                 | Automated |
| DRAG-4.22 /New /P1               | Z, C, P, U | B08/B27 plus approved clocks/cancel lifecycle: Card/side changes reset dwell, pop/cancel clears progress, return/new pickup starts fresh, and release uses current locked/Board meaning.              | Automated |
| DRAG-4.30 /New /P1               | D          | B09/B10: stationary foreign entry draws/saves the seeded last-child gap; own Stub returns to its pickup slot and writes nothing. No deferred seed-line guard is restored.                             | Automated |
| DRAG-4.32 /New /P1               | D          | B15: an over-cap tab has a visible invalid cue; the same gap at valid shallower depth clears it. Invalid release writes nothing and valid recovery saves.                                             | Automated |
| DRAG-4.33 /New /P1               | D          | B12: the nested-last gap exposes exactly the three required depths, each with distinct committed parent/slot and correct painted placement.                                                           | Automated |
| DRAG-4.34 /New /P0               | D          | B13: all three concrete placements, both approach directions and both origins show actual cursor-following/shuffle/depth and save required order, with the origin gap closed.                         | Automated |
| DRAG-5.1 /Extend /P0             | S          | B17: one pop lands Free/bounded in the containing Column or exact expanded sub-row; Q/after writes one detach, retains P and saves after Q.                                                           | Automated |
| DRAG-5.2 /New /P0                | S          | B17: non-entry inherited workphase is retained on detach; no workphase field silently selects the merged entry phase.                                                                                 | Automated |
| DRAG-5.3 /New /P0                | S          | B18: merged/exact-subrow destinations, two outward pops, all three bands, parent retention and fresh workflow fallback; held entry establishes painted A/X/B inside Review and saves A/after.         | Automated |
| DRAG-5.4 /Extend /P0             | S, D       | B03/B13/B19: childless and populated target reparent, same/other column and moved hierarchy placement; no intermediate committed detach, one final reparent, inherited phase and saved/painted order. | Automated |
| DRAG-5.9 /New /P0                | S, D       | B15/B16: precise sibling anchors and nested reparent inside Descendants, unchanged workphase/attachment throughout, cap rejection without a write and valid recovery.                                 | Automated |
| DRAG-5.10 /Extend /P1            | S, D       | B10/B17/B21: both copies switch correctly at layer changes and on Q/P return; cancel/nowhere restores original Stub/order/full saved state without writing.                                           | Automated |
| DRAG-5.13 /Rework /P1            | S          | B22/B23: nested pickup starts in the whole containing Card, carries its attached child out of all section drawings, pops to the containing Column and detaches Q/after with relationships retained.   | Automated |
| DRAG-5.14 /New /P1               | S          | B24: done detach previews/lands newest Free completion, sends no workphase/anchor, retains P and sets completion/null position in the same write.                                                     | Automated |
| DRAG-5.15 /New /P0               | S          | B25: title/padding stay within the whole Descendants box, both copies remain Stubs and release saves the chosen first-child gap.                                                                      | Automated |
| DRAG-5.16 /Extend /P1            | S          | B26: immediate re-pickup uses Column as a Free Card and later saves Q/after while retaining former parent.                                                                                            | Automated |

### Surface evidence register

The representative titles below are exact current titles, not inference from their names. Assertion/body review is carried only where unchanged. Each B row's full exact expanded titles are in `tests/output/batch4b-stop4-freeze.json::scopedInventory` and `batch4b-stop4-scoped-inventory.json`; the register counts sum to70 unique runtime variants. Shared case memberships are many-to-many, so per-case counts must not be added as unique totals. B14 is retired and absent.

| Row | File key | Variants | Exact representative title                                                                                               |
| --- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| B01 | Z        | 2        | `DRAG-4.1: B01 own-column return zoom immediately attaches last with the parent workphase`                               |
| B02 | A        | 1        | `DRAG-4.1: B02 a detached child already parented to P reattaches last and inherits its workphase again`                  |
| B03 | S        | 4        | `DRAG-5.4, DRAG-4.12: B03 empty target has one child placement after immediate release`                                  |
| B04 | A        | 2        | `DRAG-4.3, DRAG-4.13: B04 done-parent immediate last-child attach preserves sibling positions`                           |
| B05 | A        | 2        | `DRAG-4.5: B05 the same B/before aim released quickly only repositions`                                                  |
| B06 | C        | 2        | `DRAG-4.19: B06 A/after selects the named Card while the pointer is outside that Card`                                   |
| B07 | C        | 3        | `DRAG-4.20: B07 dwell release follows the cue phases without moving cards, ghost or line`                                |
| B08 | C        | 4        | `DRAG-4.22: B08 card clears the cue and starts fresh clocks`                                                             |
| B09 | D        | 2        | `DRAG-4.1, DRAG-4.30: B09 stationary foreign entry from column starts after the nested last subtree`                     |
| B10 | D        | 1        | `DRAG-4.30, DRAG-5.10: B10 own Stub returns to its pickup slot after a column excursion and writes nothing`              |
| B11 | D        | 5        | `DRAG-4.8: B11 worked gap depth 0 saves the painted placement`                                                           |
| B12 | D        | 3        | `DRAG-4.33: B12 nested-last gap depth 0 commits its distinct parent and slot`                                            |
| B13 | D        | 12       | `DRAG-4.34: B13 free from above follows the cursor to first`                                                             |
| B15 | D        | 2        | `DRAG-4.32, DRAG-5.9: B15 invalid depth cue clears at a valid shallower state in the same gap`                           |
| B16 | S        | 3        | `DRAG-1.1, DRAG-5.9: B16 native Stub first placement never detaches`                                                     |
| B17 | S        | 2        | `DRAG-5.1, DRAG-5.2, DRAG-5.10: B17 merged detach keeps the non-entry workphase and saves Q/after`                       |
| B18 | S        | 8        | `DRAG-5.3: B18 merged column top detach uses the destination meaning`                                                    |
| B19 | S        | 2        | `DRAG-5.4: B19 populated target in the same column receives one immediate last-child reparent`                           |
| B20 | A        | 1        | `DRAG-4.17: B20 exiting P cancels the uncommitted attachment and repositions Free X after Q`                             |
| B21 | S        | 2        | `DRAG-5.10: B21 both copies switch through Q and back to P before cancel restores the original Stub`                     |
| B22 | S        | 1        | `DRAG-1.1, DRAG-5.13: B22 nested pickup uses the whole containing Card and carries its child out of the section drawing` |
| B23 | S        | 1        | `DRAG-5.13: B23 nested Stub pops directly to its containing column, carrying S1b, then detaches after Q`                 |
| B24 | S        | 1        | `DRAG-5.14: B24 detaching in a done column previews and saves the newest Free completion without an anchor`              |
| B25 | S        | 2        | `DRAG-5.15: B25 title is inside the whole Card and releases the first-child gap`                                         |
| B26 | S        | 1        | `DRAG-5.16: B26 immediately picking up the detached Card uses Column and saves Q/after with its old parent retained`     |
| B27 | Z        | 1        | `DRAG-4.15, DRAG-4.22: B27 a cleared cue followed by a Board release over P uses the merged column band, not attachment` |

Additional exact evidence retained for the resolved points: B09's sub-row counterpart carries DRAG-4.1/4.30; B13's strict representative is `DRAG-4.19, DRAG-4.34, DRAG-5.4: B13 foreign-stub from above follows the cursor to first`; B18's held title is `DRAG-5.3: B18 expanded sub-row locked-after-A detach uses the destination meaning`. All expanded variants are accepted below, not merely these representatives.

**Associated DRAG-3.3 pointer maintenance:** `client/src/components/workflow/placement.test.ts` — `DRAG-3.3, DRAG-6.10: the Board-layer middle band sends the region’s workphase alone, with no anchor` supplies the foreign-null request clause missing from the existing positioned-X UI carrier. The approved preview proof and already-delegated TC-6.9 route supply end drawing and fresh workflow append. The current UI does not cover that whole branch, so the approved internal complement is warranted. DRAG-3.3 status/text and DRAG-6.10's existing pointers stay unchanged; no deleted scratch test is mapped.

### Accepted runtime evidence

Independently read `tests/output/batch4b-stop4-completion-verified.json`, the26 raw cohort JSONs, `batch4b-stop4-freeze.json`, `batch4b-stop4-ledger.json`, final E2E JSON and recorded root-gate metadata. Reconstructed each variant from its raw spec ID: **70 exact variants ×20 distinct passing spec IDs =1,400 passes**, zero failed/retry/skipped,26 cohorts. Playwright JSON does not serialize repeatEachIndex; the original ledger fallback repeatIndex was not used as identity. Completion issues are empty.

All28 commands are sequential and exit0. Final `batch4b-stop4-final-e2e.json` contains **394 passed /21 existing skips /0 failed**,415 total, zero retries/flaky/errors; all71 maintained five-file variants pass, including unchanged DRAG-1.14 control. Root gate passes444 server /1040 client /258 scripts and docs433/0. The420 protected and nine Playwright/helper raw hashes match the accepted freeze; protected aggregate remains `6479bf70f08fb2c40300450352759bbc014f696268a1013dfc2b3d1d03bf0293`. Runtime claims are external writer executions independently verified from retained evidence, not runs by this review. Background completion continued through the LLM delivery interruption; recovery reran zero commands.

## Lost Coverage

None across the whole484-case catalog. Every378 Automated case has an active qualified-ID carrier; none is skip-only. All26 new closures have accepted ID-bearing evidence. The21 existing skip declarations do not count toward coverage. No unrelated status is reopened.

## Unknown IDs

None in current test/describe title claims. No active/skipped carrier claims a Manual case. Retired DRAG-4.35 has no carrier; NextID remains4.36. No deferred request/highlight equality or B09 seed-line guard is reinstated.

## Proposed Stamps

None pending. Existing qualified IDs support all26 closures. The only associated field maintenance is the DRAG-3.3 Automation complement stated above. No test title/body is edited by the Reconciler.

## Proposed Internal Mappings (need approval)

No new approval requested. Applied the already-approved clock category only where surface proof misses deterministic clock logic: P for DRAG-4.20; P/U for DRAG-4.22 cancellation, resets and fresh lifecycle. Applied the approved request-rule category for associated DRAG-3.3. Earlier specific baseline declines remain declined; DRAG-4.12 closes through all-four B03 surface bootstrap checks, with no revived internal mapping. Whole-surface cases receive no redundant new internal pointer. Five generic sync tests remain unstamped support.

## Proposed Manual (need approval)

None. All26 close as Automated. Existing10 Manual cases remain untouched.

## Gaps

No unresolved scoped Then or held-off case. Nathan explicitly leaves the existing conditional DRAG-3.12 Board-own-region/Free-null/peers no-write issue **outside4b and nonblocking**; its physical reachability remains unproved. It is recorded in the null-return report, with no reopening, repair or further Coder cycle here. Deferred highlight-cue work retains its separate destination and retired ID boundary. The remaining93 Open catalog cases are not reassessed or reassigned in this finite close.

## Duplication

Intentional shared tests cover attach inheritance, terminal-parent placements, detach/workphase/form changes, invalid depth and return behavior across multiple IDs. Clock tests complement rendered cue/gesture proof, and the associated request test complements the positioned UI path and server fallback. No support-only internal pointer is added beside a whole surface case.

## Test Quality Concerns

Resolved material oracles remain intact: B01 immediate release with raw membership separate from numeric/painted order; B03 fresh1.0 across all four boundaries; B09 actual seeded drawing; strict B13 named-P entry; B18 actual A/X/B inside live Review before A/after, exact single request, retained parent, saved order and painted outcome. Actual DOM geometry supplies movement/depth checks; request counts, bodies and saved results remain separate. No current scoped tautology or missing business clause was found. Retired wire-identity/highlight requirements and unsupported earlier observers are not revived. Tuned feel/look remains with existing Manual cases, not invented residuals here.

## Uncatalogued Tests

The five generic NamedAnchorSync/syncNamedAnchor regressions and generic append-drawing support retain their prior support-only classification. Deleted scratch executions are historical evidence, not durable cases or mappings. No implementation concept is made a business case.

## Candidate New Cases

None from this close. The adjacent null set-down question already has DRAG-3.12 as its case home.

## Totals

All26 scoped cases: Automated,13P0/13P1; four Extend,20 New,two Rework. One additional existing Automated case gets pointer-only maintenance. Whole catalog changes352→378 Automated and119→93 Open; all other status counts stay fixed.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------- | ---- | ------ | ------- | ---------- | ----- |
| P0       | 139       | 6    | 0      | 0       | 0          | 145   |
| P1       | 172       | 71   | 6      | 0       | 0          | 249   |
| P2       | 67        | 16   | 4      | 1       | 2          | 90    |
| Total    | 378       | 93   | 10     | 1       | 2          | 484   |

## Applied files and verification

Catalog writes are limited to `docs/test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md` (16 statuses/Automation lines and mirrored summary cells), `drag-5-detach-and-overflow.md` (10 of each) and `drag-3-card-column-bands.md` (DRAG-3.3 Automation only), plus this new report. The actual-start mask matches the Planner's Stop5 doc baseline: every other byte, case body, title, priority, rule, NextID and existing line ending is preserved. All suite-summary statuses align, all484 IDs are unique, and all eight previous reports remain byte-identical. No app/test/wiki/plan/staging/commit mutation is made. Own formatting and diff checks complete before handoff; the Planner performs final whole-doc validation. This ends4b reconciliation; it starts no later batch.

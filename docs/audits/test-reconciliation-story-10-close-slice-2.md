# Test reconciliation — Story 10 close, slice 2

Cold reconciliation of the 26 cases named by `tests/output/story10-close-step4/slice-2-inputs.json`: DRAG-3's 23 cases, BCU-5.6, BCU-5.7 and TC-6.4. The limited workflow correction below applies the catalog README's standing approval to the initial run's three already-assessed mapping packages. It is neither a new cold review nor Nathan's approval follow-up; no approval proposal remains.

Evidence: frozen tree `e648bec815c2a86cf626f560b51efaa1e9da7162`, range start `bb7633cf`, the packet's test/catalog diffs and Review log, `tests/output/story10-close-catalog-report.md`, and `tests/output/story10-close-step4/green-run-record.json`. Tests and catalog were read from `tests/output/story10-close-step4/frozen/<repo path>`; cited wiki sections were read directly. No earlier Reconciler report or app source was read. The missing direct file-read tool was replaced, with the orchestrator's authorization, by read-only `Get-Content`/`rg` calls. No tests, runtime investigation or evidence reconstruction was performed.

The green record supplies `npm run check` (server 444, client 1,110, scripts 327; docs 0 hits) and two full E2E runs with 524 passed, 23 skipped, 0 failed and 0 flaky each, at `tests/output/story10-close-full-e2e-1.json` and `tests/output/story10-close-full-e2e-2.json`. Title stamps below leave test bodies unchanged.

## Coverage Mapping

**Result: 21 Automated, 5 Open.** Four Automated cases return to Open because their confirmed mappings do not assert the whole Then. DRAG-3.16 remains Open because both carriers are skipped. An ID stamp by itself does not approve an internal mapping; existing Automation pointers and the README's outright-approved categories provide the authority identified below. The limited correction restores DRAG-3.1, DRAG-3.2 and DRAG-3.11 using the exact packages already assessed in the initial run.

The following file keys expand to exact repo-relative paths throughout the tables; the quoted names are test titles. Braced alternatives describe the explicitly listed parameterized titles.

| Key | Test file |
| --- | --- |
| Bands | `tests/ui/drag-column-bands.spec.ts` |
| Contracts | `tests/ui/drag-band-contracts.spec.ts` |
| Forms | `tests/ui/drag-card-forms.spec.ts` |
| Layers | `tests/ui/drag-layer-transitions.spec.ts` |
| Heights | `tests/ui/drag-stub-row-height.spec.ts` |
| Placement | `client/src/components/workflow/placement.test.ts` |
| Band math | `client/src/components/workflow/dragBands.test.ts` |
| Pop | `client/src/components/workflow/popSession.test.ts` |
| Requests | `client/src/components/workflow/dragRequest.test.ts` |
| Lists | `client/src/components/workflow/itemListOps.test.ts` |
| Routes | `server/tests/routes/items.positioning.test.ts` |

### Confirmed cases

| Case | Mapped file and title | Whole-Then judgment |
| --- | --- | --- |
| DRAG-3.1 | Bands — "DRAG-3.1, DRAG-3.2, DRAG-3.11: the top band places before the first item, the bottom band after the last". Requests — "TC-7.1, TC-7.2, TC-7.4, DRAG-3.1, DRAG-3.2: first/last resolve to a concrete anchor beside others' own edge" and newly stamped "TC-7.3, DRAG-3.1, DRAG-3.2: first and last anchor on the rendered order, which breaks a position tie by creation time". | Automated. The previously assessed package combines surface band/result assertions with exact first-anchor/before requests and the rendered-order tie-break. The pure client drag-request rule qualifies for the README's standing approval; add Requests to the Automation line. |
| DRAG-3.2 | Bands — the joint edge-band title above and "DRAG-3.2: popped out, a release in a column is still that column's band". Requests — "TC-7.1, TC-7.2, TC-7.4, DRAG-3.1, DRAG-3.2: first/last resolve to a concrete anchor beside others' own edge" and newly stamped "TC-7.3, DRAG-3.1, DRAG-3.2: first and last anchor on the rendered order, which breaks a position tie by creation time". | Automated. The previously assessed package combines surface band/result assertions with exact last-anchor/after requests and the rendered-order tie-break. The pure client drag-request rule qualifies for standing approval; add Requests to the Automation line. The optional Placement alternative was not added. |
| DRAG-3.3 | Bands — "DRAG-3.3, DRAG-3.11: the middle band released before THRESHOLD is a workphase-only move — position kept, the hovered card ignored". Placement — "DRAG-3.3, DRAG-6.10: the Board-layer middle band sends the region’s workphase alone, with no anchor"; "DRAG-3.3: an item with a position keeps it — the middle band sends the region’s workphase alone, and its own region nothing"; newly stamped "DRAG-1.23, DRAG-3.3, DRAG-3.11, DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep". Routes — newly stamped "TC-2.24, DRAG-3.3, DRAG-3.10: an item with no position takes the append fallback when it is assigned a workphase". | Automated. The surface preserves `p` and changes phase; the existing approved Placement pointer proves the exact no-anchor request and append preview; the route proves a null position takes the true-scope append. Add Routes to the Automation line. |
| DRAG-3.5 | Band math — "DRAG-3.5, DRAG-3.15: switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers"; "DRAG-3.5: moves with the shortCard height — the gap plays no part in the 2+-card edge"; "DRAG-3.5: with two or more cards, each dead zone is (heightPx + gapPx) / 2 tall and each divider heightPx in — from the metrics alone". | Automated through its existing internal pointer. Independent expected coordinates assert both sides of each divider; changed metrics and card counts assert the derived reservation. |
| DRAG-3.9 | Contracts — "DRAG-3.9: done release at {top, bottom, D1, D2} has no positional bands or anchor and reserves newest completion at the bottom". | Automated. All four named release locations assert an exact workphase-only body, no dividers, the bottom reservation, completion/position fields and newest-last preview/result. |
| DRAG-3.10 | Contracts — "DRAG-3.10: empty {active, terminal} one-zone height equals the carried Card and release at {0.03, 0.5, 0.97} changes only workphase". Routes — "TC-2.24, DRAG-3.3, DRAG-3.10: an item with no position takes the append fallback when it is assigned a workphase". | Automated. The six UI runs cover the one-zone geometry and exact body, kept active position and terminal completion. The route covers the positionless append fallback. |
| DRAG-3.11 | Contracts — "DRAG-3.11: middle-band ghost previews the kept-position gap and bottom ghost previews the end before release". Bands — the joint edge-band title above and "DRAG-3.3, DRAG-3.11: the middle band released before THRESHOLD is a workphase-only move — position kept, the hovered card ignored". Lists — "TC-2.30, DRAG-3.11: a placement with a workphaseId moves the item into that list without changing the item (position kept, not null)" and newly stamped "DRAG-1.23, DRAG-3.11: 'append' draws at the end, as 'last' does, whatever the position sort says". Placement — newly stamped "DRAG-1.23, DRAG-3.3, DRAG-3.11, DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep". | Automated. The previously assessed package combines the three surface ordinal slots with unchanged stored values and positionless append selection/rendering. These are pure client drag ordering/preview rules, expressly within standing approval; add Lists and Placement to the Automation line. |
| DRAG-3.12 | Contracts — "DRAG-3.12: a middle release back into its merged covered set sends nothing" and "DRAG-3.12: a middle release between sibling sub-rows changes the exact phase". | Automated. The merged variant observes zero writes and unchanged position/phase; the expanded variant observes exactly the destination phase-only request and unchanged position. |
| DRAG-3.15 | Band math — "DRAG-3.15: exactly one card halves the edge to (heightPx + gapPx) / 2, leaving it a real, unlabeled middle band"; newly stamped "DRAG-3.5, DRAG-3.15: switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers". Pop — "DRAG-3.15, DRAG-3.21: at Board layer the band also reads the region's live card count on every sample, so the one-card exception never goes stale while a region is the hover target". | Automated through the two existing internal pointers. The one-card test asserts the derived boundaries and top/middle/bottom classification; live sampling reclassifies a still point when the card count changes, and the two-card test establishes the normal `h` regime. |
| DRAG-3.17 | Contracts — "DRAG-3.17, DRAG-3.20: exact Board reservations and dividers collapse in layout when locked in {column, sub-row, Descendants} and return at Board". | Automated. All three lock types assert positional/empty/done reservation amounts, equal heights while hovering, disappearance in layout rather than just paint, and restoration at Board. |
| DRAG-3.18 | Contracts — "DRAG-3.18: labels distinguish the empty region name from the done workphase name and yield to its ghost". | Automated. Distinct display-name overrides make the empty-region and done-workphase text assertions discriminating; Top/Bottom, absence of a middle label and labels yielding to the ghost are asserted. |
| DRAG-3.19 | Forms — "DRAG-3.19: both shortCard copies reserve the same line and box with long or empty descriptions ({expanded, collapsed})"; "DRAG-1.33, DRAG-3.19: release restores the carried branch's collapsed preference from {Board, Column}". | Automated. Both layers, copies, description states and expansion preferences are covered: pills, one-line title/description, retained empty-description space, omitted footer/ordinary indicator, fixed equal boxes, carried-only outside count, absent children, and full-height/restored-list drop result. |
| DRAG-3.20 | Contracts — "DRAG-3.17, DRAG-3.20: exact Board reservations and dividers collapse in layout when locked in {column, sub-row, Descendants} and return at Board". | Automated. Positional column and sub-row have two Board dividers; empty/terminal geometry has none; every divider disappears at each named lock and returns on pop-out. |
| DRAG-3.21 | Pop — "DRAG-3.21: at Board layer the band reads the region's live rect on every sample, not one frozen at entry"; "DRAG-3.15, DRAG-3.21: at Board layer the band also reads the region's live card count on every sample, so the one-card exception never goes stale while a region is the hover target". | Automated through its existing internal pointer. A still cursor changes from middle to top after a rect shift, and from top to middle after a card-count change. Expectations are grounded in the live content coordinates and derived boundary rule. |
| DRAG-3.22 | Layers — "DRAG-1.5, DRAG-1.26, DRAG-1.28, DRAG-1.35, DRAG-3.22: one hold from {column, sub-row} enters {populated, childless} P with both Stub copies and whole-Card bounds"; "DRAG-1.17, DRAG-1.26, DRAG-3.22: Descendants exits one layer before the {reorder, board, sibling} continuation". Forms — "DRAG-3.22: a {typed, untyped} Stub starts with two equal row boxes and a carried-only branch line". | Automated. The surfaces cover zoom-in and one-pop return, Stub/shortCard ghost and carried forms, equal row boxes/width, pointer containment through the switches, typed/untyped pickups and the carried-only outside branch line. |
| DRAG-3.23 | Contracts — "DRAG-3.23: popping into a done column previews and commits the newest completion without an anchor". | Automated. The test reaches the locked done context and asserts newest-last preview, exact phase-only body, null position, completion timestamp and persisted/rendered last place. |
| DRAG-3.24 | Contracts — "DRAG-3.24: an own done ghost stays D1/X/D2 through up/down moves and set-down writes nothing". | Automated. The test pins distinct completion order, checks no positions, unchanged painted order and neighboring boxes through up/down moves, zero writes and unchanged fetched rows. |
| DRAG-3.25 | Heights — "DRAG-3.25: a section’s typed, untyped and long-title Stub rows and its overflow row are one height, and a pill fits the title’s line"; "DRAG-3.25: the hierarchy modal’s typed and untyped rows and the section’s rows under its backdrop are one height"; "DRAG-3.25: a {typed, untyped} Stub {with a branch, without one} picked up from {its section, the modal} has a ghost and a carried copy of the fixed height{, and the branch line hangs below the copy}". | Automated. The eight pickup combinations and two static tests compare each required representation with a positive untyped reference height, including long titles, pill fit, overflow, modal/backdrop, carried border and outside branch line. They do not pin a pixel height. |
| BCU-5.6 | `tests/ui/unsorted-filing.spec.ts` — "BCU-5.6: filing an Unknown parent reconciles exactly its attached branch without reloading". | Automated. Exact initial invalid IDs and empty uncovered list; P/A/G visible expanded in Unsorted; successful held answer; P/A/G filed together and saved attached in W1; badge gone; fresh board clean; zero board loads or navigation. |
| BCU-5.7 | `tests/ui/unsorted-filing.spec.ts` — "BCU-5.7: filing an Unknown parent reconciles exactly its attached branch without reloading". | Automated. P/A file together while D/D1 remain Free/attached in Unsorted and null-phase; badge and exactly D/D1 invalid IDs remain; D retains P as parent; no reload/navigation. |
| TC-6.4 | `tests/ui/item-positioning.spec.ts` — "TC-6.4: a done column lists its items by when they were completed, oldest first". | Automated. D1/D2/D3 are created in that order, completed at distinct times in D2/D3/D1 order, then rendered D2/D3/D1 with null stored positions. |

### Partial and skipped cases

These retain their live title stamps. Their Automation lines are `—`; partial pointers belong here, not in the catalog.

| Case | Current carriers inspected | Missing part and disposition |
| --- | --- | --- |
| DRAG-3.4 | Bands — "DRAG-3.4, DRAG-1.3, DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side". | Automated → Open. Reaches the new locked column, then aims at B and asserts AXBC. It never asserts the case's B/X/C ghost with B's after-highlight, nor an exact B/after request. The no-hold band meaning is covered elsewhere, but cannot supply that named locked release. |
| DRAG-3.6 | Bands — "DRAG-3.6, DRAG-3.7: a merged column takes the entry workphase for an outsider and leaves a covered-set member alone". Requests — "DRAG-3.1, DRAG-3.2, DRAG-3.6: a different workphase is never identity, whatever the slot". | Automated → Open. The outsider's top-band persisted entry phase/order are checked. No exact request body is checked, and the merged outsider's bottom/middle meanings are not asserted. The identity test does not select an entry workphase or assert a request. |
| DRAG-3.7 | Bands — the joint merged-column title above. Placement — "DRAG-3.7: Board layer — a covered-set member keeps its own workphase in the preview". Requests — "DRAG-3.7: same workphase, non-empty others, a real anchor found: not identity — a genuine reorder (top/bottom)". | Automated → Open. Only the top release's persisted non-entry phase/order are checked. The Then names top and bottom, and requires the band's anchor/side with no workphase field. Sending the unchanged phase would also pass the surface assertions. The internals lack case pointers and do not by themselves fill the bottom-release gap. |
| DRAG-3.8 | Bands — "DRAG-3.8, DRAG-1.6: an expanded column resolves per sub-row — exact workphase, first/last of that sub-row". | Automated → Open. The test checks top/bottom persisted order and exact destination workphase. It does not inspect the top and bottom request bodies to assert the named first/last anchors and sides of the sub-row. |
| DRAG-3.16 | Contracts — skipped "DRAG-3.16: a clipped visible top remains middle while the content divider is above view" and skipped "DRAG-3.16: restoring the content top makes the top band reachable". | Open → Open. Neither skipped test counts. No running test found proves both the clipped-content release and the restored-content-top release. Do not infer a runtime outcome from the recorded setup problem. |

## Coverage Report Findings

The supplied report checks the whole catalog. Its Lost coverage, Manual cases a running test carries, Stale Automation lines, Two statuses for one case and Catalog fields not read sections all say **none**. There is therefore no global no-slice finding to apply and no other slice's case to edit. The semantic gaps above are judgments from the scoped cases and tests, not findings the mechanical report claimed to detect.

## Stamps Added

This slice added seven case-ID stamps across five distinct test titles. The limited workflow correction added four of those stamps through three further title-only edits. Every shared-title edit was reserved with the orchestrator first and released afterward. The table shows the current titles, preserving IDs added by other slices.

| Case | File | New title | Authority |
| --- | --- | --- | --- |
| DRAG-3.3 | `server/tests/routes/items.positioning.test.ts` | "TC-2.24, DRAG-3.3, DRAG-3.10: an item with no position takes the append fallback when it is assigned a workphase" | Route surface; no internal approval required. |
| DRAG-3.3, DRAG-3.11 | `client/src/components/workflow/placement.test.ts` | "DRAG-1.23, DRAG-3.3, DRAG-3.11, DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep" | DRAG-3.3's frozen Automation pointer approves its addition; DRAG-3.11's ordinal-preview mapping qualifies for the README's standing approval. |
| DRAG-3.15 | `client/src/components/workflow/dragBands.test.ts` | "DRAG-3.5, DRAG-3.15: switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers" | The frozen DRAG-3.15 Automation line already points to this internal file. |
| DRAG-3.1, DRAG-3.2 | `client/src/components/workflow/dragRequest.test.ts` | "TC-7.3, DRAG-3.1, DRAG-3.2: first and last anchor on the rendered order, which breaks a position tie by creation time" | Pure client drag request/tie-break rule, within the README's standing approval. |
| DRAG-3.11 | `client/src/components/workflow/itemListOps.test.ts` | "DRAG-1.23, DRAG-3.11: 'append' draws at the end, as 'last' does, whatever the position sort says" | Pure client ordinal-preview ordering rule, within the README's standing approval. |

No ID was removed. No assertion, setup or helper changed. The orchestrator owns the final title-only diff and `check:docs` check; this read/edit-only run did not execute them.

## Review Log Answers

The fixed Review log says "No open Review log verdicts for this slice." No verdict remains to answer, and no earlier batch's answered verdict was reopened.

## Proposed Internal Mappings (need approval)

**None remain.** The initial root brief incorrectly required fresh Nathan approval for every new internal mapping. The root subsequently withdrew that blanket restriction, authorizing a limited workflow correction over these three already-assessed packages only. No scope was rereviewed, no new tests were sought, no new finding was raised, and no other judgment was revisited. This correction does not consume Nathan's one approval follow-up.

The authority is `docs/test-plans/README.md`, "Which tests count, and what's manual": **"A second approved category: a client ordering or request rule whose only surface is a drag."** Its examples expressly include ordinal preview, tie-break and which anchor a placement names. All three packages qualify:

| Case | Already-assessed package | Standing-category disposition |
| --- | --- | --- |
| DRAG-3.1 | Requests' first/last exact-body test and rendered-order tie-break test, with the Bands surface test; full titles are in Confirmed cases. | Pure client drag-request anchor selection and tie-break. Applied the proposed title stamp and pointer; restored Automated. |
| DRAG-3.2 | The same Requests package, with its Bands surface tests. | Pure client drag-request anchor selection and tie-break. Applied the proposed title stamp and pointer; restored Automated. The optional Placement alternative was not added. |
| DRAG-3.11 | Lists' unchanged-value and append-order tests plus Placement's no-position append-selection test, with its Bands/Contracts surface tests; full titles are in Confirmed cases. | Pure client ordinal preview and ordering, including the internal no-invented-position clause. Applied the two proposed title stamps and both pointers; restored Automated. |

No new internal mapping was added beside a surface test that already proves its whole case. No nonqualifying package remains for Nathan, and the residual gaps on the other incomplete cases are unchanged.

## Proposed Manual (need approval)

None. The remaining clauses are precise behavior assertions. DRAG-3.16's setup-related skip alone does not establish that the rule should be Manual.

## Gaps

The Partial and skipped cases table supplies each ID, file/title and missing clause. The QA Engineer should route **DRAG-3.4, DRAG-3.6, DRAG-3.7 and DRAG-3.8**, one line per ID with this slice, to `docs/planning/tech-debt-stories/drag-automation-deferrals.md`, unless Nathan pulls them forward. DRAG-3.1, DRAG-3.2 and DRAG-3.11 are settled by the standing-category correction above and no longer require routing or approval.

**DRAG-3.16** is already named in that destination's returned 4i work, with both Contracts titles above. It remains there until both variants run and prove their whole Then. This report does not diagnose the old setup failure or rerun its evidence.

No other feature's cases were swept or judged; the no-slice coverage-report responsibility required no mutation.

## Duplication

Reported without a keep/delete judgment. The mapped titles above identify the coverage counted; additional stamped carriers below are not newly approved just because they exist.

| Cases | Overlap |
| --- | --- |
| DRAG-3.1, DRAG-3.2 | Bands' joint edge-band test overlaps the Requests first/last tests listed in Confirmed cases and "DRAG-3.1, DRAG-3.2, DRAG-3.6: a different workphase is never identity, whatever the slot". DRAG-3.2 also has its second Bands release test and Placement's "DRAG-3.2: the bottom band still sends the anchor after the last row" and "DRAG-3.2, DRAG-5.3: the bottom band still sends the anchor after the last row". Requests' exact-body/tie-break package is now counted under standing approval. |
| DRAG-3.3 | Bands' kept-position test overlaps Requests' "DRAG-3.3: cross-column, no anchor: workphaseId alone (outsider, middle band)" and the approved Placement request tests. The new Routes stamp supplies a different, previously missing append clause. |
| DRAG-3.6, DRAG-3.7 | Bands' joint merged test overlaps Requests' identity tests and DRAG-3.7's Placement covered-member preview test. Those internal carriers remain partial; no new pointer was added. |
| DRAG-3.9 | Contracts' four-location test set overlaps Bands' "DRAG-3.9: a done column produces no anchor — every band is a workphase-only move" and Placement's "DRAG-3.9: Board layer — a done region previews no positioned insert in any band, whatever the item's own position". Contracts is sufficient; no new internal pointer proposed. |
| DRAG-3.10 | Contracts' six UI variants overlap Bands' "DRAG-3.10: an empty column is a workphase-only move in any band" and Requests' "DRAG-1.23, DRAG-3.10: empty others: first/last send a bare workphase move, no anchor to resolve". Routes is complementary for the null-position clause. |
| DRAG-3.11 | Bands, Contracts, Placement and Lists all carry this case, as named above. The first two cover surface order; the counted standing-category package covers the otherwise unobserved stored-value/append clauses. |
| DRAG-3.12, DRAG-3.24 | Contracts' exact no-write tests overlap Requests' "DRAG-3.12, DRAG-3.24: same workphase, slot existing: always identity (middle band member)". Whole surface coverage needs no new internal pointer. |
| DRAG-3.15, DRAG-3.21 | Their existing Band math/Pop pointers overlap on the one-card/live-count rule, with distinct geometry and sampling assertions. |
| DRAG-3.17 | Contracts' lifecycle tests overlap Bands' "DRAG-3.17: the reservation invariant — hovering a region never changes its own rendered height, for a positional, an empty, and a terminal-with-cards region alike" and "DRAG-3.17: the reservation invariant — an expanded column's own empty sub-row doesn't shift by its droppable padding either". |
| DRAG-3.18 | Contracts' label test overlaps `client/src/components/BoardColumn.test.tsx`: "DRAG-3.18: a populated done region names its workphase rather than the column override (%s)", "DRAG-3.18: an empty active region names the region and populated active regions keep Top and Bottom", and "DRAG-3.18: the done label gives way to the incoming ghost". No new internal pointer needed. |
| DRAG-3.19, DRAG-3.22 | Whole surfaces overlap `client/src/components/KanbanCard.test.tsx`: "DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: says the branch’s counts in its %s form", "… says nothing in its %s form without a branch", and "… says nothing on the in-list row, which is no copy". DRAG-3.22 also overlaps Placement's "DRAG-3.22, DRAG-1.35: across a real zoom-in (Column → Card’s Descendants layer) and pop-out (back to the column), the form switches both ways" and the DRAG-3.22 width/form/re-anchor tests in `client/src/components/workflow/dragOverlayGeometry.test.ts`. No new internal pointer needed. |
| DRAG-3.23 | Contracts' exact done request overlaps Requests' "DRAG-3.23: a done region never anchors — placementFor falls back to 'existing' for one, so toRequest never sees a first/last/anchor slot for it". |
| DRAG-3.25 | Heights' complete surface set overlaps `client/src/components/KanbanCard.test.tsx`'s "DRAG-3.25, DRAG-8.10: keeps its shortCard form’s one height, with the line hung outside its flow and its root unclipped" and "DRAG-3.25, DRAG-8.10: hangs outside the flow of its Stub form’s box, and moves with the box through the depths", plus `client/src/components/dragChrome.test.tsx`'s "DRAG-3.25, DRAG-8.10: reads its branch’s wording, takes no pointer, and hangs out of the flow under the box it is in". No new internal pointer needed. |

## Test Quality Concerns

No tautological expectation was found in the tests counted here. Band expectations use independently stated coordinates/arithmetic; rendered invariants compare distinct representations and states; the filing and done-order tests assert concrete rule-derived rows, fields, writes and reload counts.

The result-only versus exact-request deficiencies in DRAG-3.4, DRAG-3.6, DRAG-3.7 and DRAG-3.8 remain the already-assessed gaps above, not separate deferred quality findings. DRAG-3.1 and DRAG-3.2's exact requests and DRAG-3.11's internal stored-value/append clauses are supplied by their already-assessed standing-category packages. No additional quality concern is raised for a case retained Automated.

## Uncatalogued Tests

No forced mappings. In the supplied range, the following supporting tests are implementation/coverage checks or supporting variants of rules already represented by the scoped surface cases:

- `client/src/components/dragChrome.test.tsx`: "hands the drag’s active item and the row it is over on every render", "hands over nothing with no drag running, and nothing for a column’s drag", and "marks its fill bar for a test to find, timed by the hold’s cue clock". These check event plumbing and test hooks, rather than a separate user rule.
- `client/src/components/KanbanCard.test.tsx`: "is the width the drag gives its %s form", "is left to the picked-up row’s in its %s form with none given", and "is never set on the in-list row". These check the width prop contract behind the scoped representation behavior.
- `client/src/components/workflow/dragOverlayGeometry.test.ts`: "takes the width the copy is drawn at, and keeps the rest of the measurement", "holds a copy as wide as its card list to the list’s own edges", "is the measurement itself when the drag sets no width, and null with none", and the added tests under "a Stub's drag drawn as a shortCard" (fractional pointer re-anchor, unchanged y, idempotence, equal/wider/no-width fallbacks). These support the representation/bounds rules; degenerate/no-input/idempotence branches are technical checks, not new standalone cases.
- `client/src/components/workflow/itemListOps.test.ts`: now "DRAG-1.23, DRAG-3.11: 'append' draws at the end, as 'last' does, whatever the position sort says" is mapped specifically to DRAG-3.11 by the limited standing-category correction above, rather than treated as a new case.

Shared files also contain other slices' and no-slice case IDs. They were not independently reconciled here. Unstamped expansion-store tests in the range support the existing list-preference family, which is outside this slice; this report does not invent a case or alter that family's mappings.

## Candidate New Cases

None identified within this slice. No missing variant was added to a complete Then. If the orchestrator routes any extra drag hardening or candidate from the supporting tests, its MVP destination is `docs/planning/tech-debt-stories/drag-automation-deferrals.md`, not this close's implementation scope.

## Totals

These are the supplied coverage report's totals with **this slice's changes only** applied. Other parallel slices are intentionally excluded from this arithmetic.

Its inventory remains 488 cases in 44 suites, with 125 test files declaring 1,823 tests, 9 declared skipped. The green E2E record's 23 runtime skips include parameterized instances; these are different counts.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P0 | 138 | 9 | 0 | 1 | 0 | 148 |
| P1 | 229 | 15 | 6 | 0 | 0 | 250 |
| P2 | 79 | 4 | 4 | 1 | 2 | 90 |
| Total | 446 | 28 | 10 | 2 | 2 | 488 |

Scope: 26 cases; **25 Automated / 1 Open → 21 Automated / 5 Open**. Net transitions from the frozen catalog: DRAG-3.4, DRAG-3.6, DRAG-3.7 and DRAG-3.8 Automated → Open; DRAG-3.16 remains Open. The limited workflow correction restored DRAG-3.1, DRAG-3.2 and DRAG-3.11, changing the initial run's 18 Automated / 8 Open to 21 Automated / 5 Open through the three already-assessed standing-category packages. No approval proposal, Manual change, retired-ID removal or global no-slice correction remains. Seven added case-ID stamps across five distinct titles; DRAG-3.3's Automation line gains Routes, DRAG-3.1 and DRAG-3.2 gain Requests, DRAG-3.11 gains Lists and Placement, and four partial lines remain `—`.

Changed files: this report, `docs/test-plans/board-drag-interaction/drag-3-card-column-bands.md`, `client/src/components/workflow/placement.test.ts` (one distinct title), `client/src/components/workflow/dragBands.test.ts` (one title), `server/tests/routes/items.positioning.test.ts` (one title), `client/src/components/workflow/dragRequest.test.ts` (one title), and `client/src/components/workflow/itemListOps.test.ts` (one title). The BCU and TC catalog files were confirmed without textual changes.

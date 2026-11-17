# Test reconciliation — Story 10, batch 4g

One cold closing pass under `.claude/agents/test-reconciler.md`. The fixed scope is the original 33 TREE cases, the 14 inherited IDs touched by the changed suites, and the approved DRAG-7.10 declaration skip: 48 cases. The original scope retains deferred TREE-1.14 and TREE-9.4.

Fixed inputs: `tests/output/batch4g-stop4-reconciler-plan-inputs.md`; `tests/output/batch4g-stop4-catalog-before-reconcile-after-legacy-skip.md`; `tests/output/batch4g-stop4-green-run-record.json`; `tests/output/batch4g-stop4-range-tests-after-legacy-skip.diff`; and `tests/output/batch4g-stop4-range-catalog-after-legacy-skip.diff`. Current cases, cited wiki sections, tests and observation helpers were read independently. No earlier batch plan/audit was used.

The supplied green-run record identifies frozen tree `5a2cc31f2f74e5e71c151617a6611dded789d121`: 310/310 D2 attempts, full E2E 524 passed / 29 declared skips, and root checks with 444 server / 1110 client / 327 script tests passing. It identifies the JSON reports and discloses the later transient metadata tree. This pass accepts that record; it does not regenerate runs, coverage, diffs, hashes or source verification.

Tool-access note: the prescribed Node REPL was unavailable. The parent authorized a bounded file-I/O adapter using only verbatim Get-Content and read-only rg for Read/Grep/Glob. Those calls read repo text only; they produced no replacement runtime or green-run evidence. All writes below used apply_patch.

## Coverage Mapping

31 cases move from Open to Automated, in both status locations, with 31 Automation lines written. The 14 inherited TREE cases remain Automated. DRAG-7.10 remains Automated. TREE-1.14 and TREE-9.4 remain Open with `—` Automation lines. No Manual case changes.

The table names each of the 45 running TREE carriers and the clauses counted from it. Cases are checked against the current Then. A stamped internal carrier is not automatically added to an Automation line: existing approved pointers are retained, the request-only supplements below supply missing clauses, and no internal companion is added where a surface test proves the whole case.

| Case | Test file and exact title | Confirmation / status |
|---|---|---|
| TREE-1.1 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement” | Remains Automated. Gap/depth, row displacement and one X row, saved A1-child relation; the second carrier proves a one-movement B/after release, answer and reload. |
| TREE-1.1 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows” | Remains Automated. Gap/depth, row displacement and one X row, saved A1-child relation; the second carrier proves a one-movement B/after release, answer and reload. |
| TREE-1.12 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.12: a release saves the placement as a move naming a neighbor, never a position” | Open → Automated. Both complete move bodies name parent and before/after neighbor with no position, and save the same placement the ghost/line showed. |
| TREE-1.4 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.4: the all-project subtree offers only its own place, without a line or a write” | Open → Automated. Every descendant disappears; movement leaves only depth 0 in the pickup slot, no line, no write and the complete saved tree unchanged. |
| TREE-1.11, TREE-3.9 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.11, TREE-3.9: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing” | TREE-1.11 Open → Automated; TREE-3.9 remains Automated. API-derived cap fixture offers the invalid state without writing, then accepts the adjacent valid state with X1 retained at the cap; line/copy cues are checked. The combined carrier uses the API-reported cap, distinguishes invalid/no-write from valid/saved boundary placement, and retains X1. The route supplement below establishes the reported/enforced value. |
| TREE-1.8 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing” | Open → Automated. Leave/return and own-row releases show the own gap and line, emit no write after settling and preserve the entire saved X, including updatedAt. |
| TREE-1.9 | `tests/ui/project-tree-drag.spec.ts` — “TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap” | Remains Automated. The ghost and its line return below B; release writes nothing and preserves saved X. The existing component supplement below supplies the top-edge clause. |
| TREE-2.1 | `tests/ui/project-tree-drag.spec.ts` — “TREE-2.1: the branch is absent, its space closes, and ghost and tiers clear at release or cancel” | Open → Automated. Descendants and their occupied space disappear, unrelated rows keep Full, ghost has no tier and follows its gap; release/cancel restore the branch and clear tiers/ghost, respecting collapse. |
| TREE-2.2 | `tests/ui/project-tree-drag.spec.ts` — “TREE-2.2: a child drop opens the collapsed parent before its answer and a sibling set-down leaves it collapsed” | Open → Automated. A held successful child move opens T at release and shows X before T1/T2 before the answer; sibling set-down retains collapse and writes nothing. |
| TREE-2.3 | `tests/ui/project-tree-drag.spec.ts` — “TREE-2.3: refusal restores X before the following read while the drop-opened parent stays expanded” | Open → Automated. The held refusal restores top-level X before the held following read is released, while T stays expanded and its children remain visible. |
| TREE-1.2 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.2: the four gap depths save their named placements and the parent-child gap has one state” | Open → Automated. All four case placements save with the named parents and sibling order; clamps and the parent-child gap are observed. The request supplement below proves that gap's precise first-child/before relation. |
| TREE-1.5 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.5: collapsed T supplies its real first child and complete subtree to both placements” | Open → Automated. Both collapsed-T placements save: before real hidden T1 as first child, or top-level after the complete T subtree and before U. |
| TREE-1.6 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.6: the own gap has two depths and no carried descendant can be a neighbor” | Open → Automated. The own gap offers exactly the two endpoints with X1/X2 absent; the child release retains their links. The request supplement below proves descendant exclusion across gaps. |
| TREE-1.10 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.10: own-row offset selects B first child, clamps right, and own depth writes nothing” | Open → Automated. One-tab and farther-right offsets choose the same B-first-child placement; own depth leaves the saved tree unchanged and emits no write. |
| TREE-1.13 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.13: a too-tall existing subtree is invalid at the root while the exact-fit subtree saves” | Open → Automated. Both existing cap-relative subtree heights are established; over-tall root release writes nothing, exact-fit release saves after B with all links retained. |
| TREE-1.15 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.15: edit and create growth retain the pickup height, and shrink retains it until the next drag” | Open → Automated. Edit/create growth reaches a real 400 with saved positions retained; shrink positively applies its answer during the drag. Displayed restoration and the new-pickup validity reversal are checked. |
| TREE-1.16 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.16: an edited-out or rolled-back descendant stays hidden until the drag ends” | Open → Automated. Edit and refused-drag answers positively change the live ghost while held Y remains hidden; the following read finishes during the drag. Own-gap no-write, restored Y-under-B and next-pickup placement are checked. |
| TREE-1.17 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.17: each nearest row has one slot across its middle and release saves the shown order” | Open → Automated. All five named nearest-row slots, both sides of each row middle, saved order and own-row no-write are checked. |
| TREE-1.18 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.18: the slot list contains only drawn rows while tab-right still precedes hidden T1” | Open → Automated. Only A/T/X/B are drawn during pickup; all three named slots are checked, then tab-right saves before hidden real T1 with X's children retained. |
| TREE-1.19 | `tests/ui/project-tree-placement.spec.ts` — “TREE-1.19: a still copy keeps the selected first or last gap throughout the row shuffle” | Open → Automated. Both boundary selections are recorded through shuffle; after selection every observed painted order remains selected, the copy stays stationary and the final neighbors match. |
| TREE-2.4 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.4: the configured cap chain retains every row with Full, Mid, Low and a separate ghost” | Open → Automated. The API-cap chain retains all unrelated rows, assigns every specified Full/Mid/Low tier, suppresses X1 and leaves the ghost untiered. |
| TREE-2.5 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.5: root fit makes unrelated top-level rows Mid and an over-tall branch makes every row Low” | Open → Automated. Root-fit height assigns both unrelated top-level rows Mid and nested rows Low; over-tall height makes all unrelated rows Low while retaining a separate untiered ghost. |
| TREE-2.6 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.6: the saved depth changes during a drag but pickup tiers persist until cancel and the next pickup” | Open → Automated. P's changed rendered depth confirms mid-drag application; P/M/L retain pickup tiers, cancel clears them, and the next pickup assigns P Mid. |
| TREE-2.7 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.7: Mid retains a sibling line and Low retains a valid shallower state while over-cap still writes nothing” | Open → Automated. The Mid sibling state retains a top-edge line without a tier; an over-cap release writes nothing; the Low-adjacent shallower state saves X top-level before B with X1 retained. |
| TREE-2.10 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.10: one count text line hangs outside the unchanged row box and lets B receive the drag” | Open → Automated. Independent leaf/source/copy/ghost boxes, one rendered count-text row, below-box overlap and unchanged sidebar spacing are measured. Browser hit-testing reaches B, then a B/after move saves the shown order. |
| TREE-2.11 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.11: narrow clipping never wraps or widens the sidebar and wide layout retains the same full counts” | Open → Automated. The same two-child/five-descendant string has one text row at both widths; narrow text overflows and clips within the row, wide text fits, and sidebar width/saved tree stay unchanged. |
| TREE-2.12 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.12: all four endings restore the branch immediately and respect A collapse preference” | Open → Automated. Valid pre-answer release, Escape, own-gap release and invalid release restore the branch and clear count/ghost/tiers; links/order, saved no-write outcomes and A's collapse preference are retained. |
| TREE-2.13 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.13: the line stays on top at every boundary and follows all four name columns” | Open → Automated. Pickup depth, one top-edge/name-column line at all boundaries, all four depths and increasing line starts are observed; the empty hierarchy still has no line after movement. The withdrawn onset clause is not counted. |
| TREE-2.14 | `tests/ui/project-tree-state.spec.ts` — “TREE-2.14: a late created row stays untiered and reachable until cancel then becomes Mid at the next pickup” | Open → Automated. A late Y is positively drawn under T during a live drag, remains untiered and a gap candidate while pickup T/M/L tiers hold, then becomes Mid at the next pickup; cancel writes no move. |
| TREE-4.3 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.3: the sidebar shows each project’s children by position, then creation time” | Remains Automated. Checked position/time pins establish child and top-level ties; displayed C/B/A and TC/TB/TA orders match the case. |
| TREE-4.8 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt” | Remains Automated. Refused drag/create/edit leave the original displayed placement; the existing App supplement below establishes immediate drag rollback while the read is held or also fails. |
| TREE-4.4 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.4: the sidebar sorts a project with no position as if its position were 0” | Remains Automated. Checked 0.5/2/null pins produce displayed N/A/B among P's children. |
| TREE-4.7 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.7: drag release, create and parent edit retain the server reindex order without reload” | Open → Automated. Drag/create/edit disclose real reindex pairs, display the written row at depth 1 in A/B/last order before reload, and match saved hierarchy; drag also retains the order after reload. |
| TREE-3.7 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-3.7: the sidebar shows every project of a tree past the project cap, flagging and repairing none” | Remains Automated. Every original depth is displayed, both over-cap rows retain ordinary row/wrapper state without invalid markers, no load write occurs and saved data is unchanged; route supplement covers accepted writes. |
| TREE-4.9 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.9: the branch appears between A1 and A2 before the answer and never returns to pickup on success” | Open → Automated. The held answer exposes X/X1 at their required depths between A1/A2; captured relation, recorded success frames, saved tree and reload preserve that placement. |
| TREE-4.11 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.11: an unanswered release contributes its whole branch and height to the next pickup” | Open → Automated. Before the first move's answer, P's next pickup suppresses X/X1 and reports the full branch; S Full/T Mid distinguish pickup height 2 from its saved leaf height. |
| TREE-4.15 | `tests/ui/project-tree-sidebar.spec.ts` — “TREE-4.15: older initial and refresh reads never remove a created child or restore a deleted subtree” | Open → Automated. Both initial/refresh reads and create/delete actions are held. Recorded frames preserve the applied result, saved N/position, unchanged Q and zero extra writes through any replacement read. |
| TREE-11.1 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.1: existing and newly created projects start open” | Remains Automated. Loaded ancestors are open; creating N1 then N1a shows each new first child without a manual opening. |
| TREE-11.2 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.2: a chevron collapse hides the subtree until opening or reload” | Remains Automated. Chevron collapse hides C/G and preserves Q1 and saved rows; reopening restores them, and reload clears both hand-set collapses. |
| TREE-11.3 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.3: a successful create opens its collapsed parent from either create entry point” | Remains Automated. Collapsed/hidden preconditions precede both create entry points; unanswered creates retain collapse and successful answers open P in child order while Q stays collapsed. |
| TREE-11.4 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.4: a failed create leaves its parent collapsed” | Remains Automated. Collapsed/hidden Given is confirmed before submission; both entry points retain collapse and hide children through failure, with no stored N. |
| TREE-11.5 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.5: a successful parent change opens the collapsed new parent” | Remains Automated. Collapsed P/Q and hidden children are confirmed before edit; the pending interval retains collapse, success opens P with C/X and preserves Q's collapse and X's saved parent. |
| TREE-11.6 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.6: a failed parent change leaves the new parent collapsed” | Remains Automated. Confirmed collapsed P retains hidden C through pending/failure; saved X is unchanged and remains outside P after it is opened. |
| TREE-11.7 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.7: a rename or an edit keeping the same parent leaves that parent collapsed” | Open → Automated. Ordinary child rename, explicit same-parent edit and parent rename retain collapse. All four queued action/request-order combinations start with collapsed P, observe drop opening, and keep it collapsed after later edit success. |
| TREE-11.8 | `tests/ui/project-tree-expansion.spec.ts` — “TREE-11.8: a top-level create or parent change opens no unrelated project” | Remains Automated. Collapsed P/Q and hidden children are confirmed before top-level create; create and removal of X's parent open neither unrelated project and X is saved top-level. |

### Supplements counted with those surface carriers

| Case | Test file and exact title | Contribution / approval treatment |
|---|---|---|
| TREE-1.1, TREE-1.9 | `client/src/components/sidebar/SortableProjectRow.test.tsx` — “TREE-1.1, TREE-1.9: draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet” | Existing approved Automation pointer retained for the structural top-edge clause. The two TREE-1.1 surface carriers and TREE-1.9 carrier above provide gesture, saved placement and no-write outcomes. |
| TREE-1.2 | `client/src/components/sidebar/useProjectDragReorder.test.ts` — describe “TREE-1.2: a gap offers the depths from Bottom’s to Top’s + 1, and each places the project differently”, test “the gap between A1 and A1a offers exactly one depth: A1’s first child, before A1a” | Across offsets, release names parent A1 and nextId A1a. This supplies the precise parent-child-gap request relation not released by the surface carrier. It is within the catalog's outright-approved category for a client ordering/request rule whose only surface is a drag; the Review log also identifies this approved hook portion. Automation lists the hook beside the surface file. |
| TREE-1.6 | `client/src/components/sidebar/useProjectDragReorder.test.ts` — describe “TREE-1.6: nearest the dragged project’s own row means its own gap, with its descendants absent”, test “no depth in any gap makes X a child of X1 or X2” | Tests every candidate row and boundary/interior offsets, then checks every sent parent/prev/next relation excludes X1/X2. This request-only supplement has the same outright-approved category; the surface carrier supplies actual absence, line and saved descendant links. Automation lists both files. |
| TREE-3.7 | `server/tests/routes/projects.test.ts` — “TREE-3.7: the cap gates writes that give a parent, not existing data” | Existing route pointer retained. All over-cap rows are returned, rename and same-parent sibling movement are accepted, and the parent stays unchanged. The sidebar carrier supplies unflagged/unrepaired display. |
| TREE-3.9 | `server/tests/routes/projects.test.ts` — “TREE-3.9: the cap the API reports is the one it enforces” | Existing route pointer retained. The reported integer cap builds an accepted boundary tree and refuses the next-depth create; the combined surface carrier checks subtree boundary states from that report. |
| TREE-4.8 | `client/src/App.pendingMove.test.tsx` — describe “TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt”, tests “puts X back as soon as the move fails, without waiting for the read of the tree” and “leaves X restored rather than retaining the refused placement when the read fails too” | Existing approved Automation pointer retained. Both establish optimistic child placement then immediate rollback with the subsequent read unanswered or failed; the surface carrier supplies create/edit failures too. |

No new internal pointer is needed for TREE-2.10, TREE-2.12, TREE-4.9, TREE-4.11 or TREE-11.7: the surface carriers above assert their complete Thens. Other ID-bearing internal files in the supplied map are listed under Duplication, not silently approved as new mappings.

### DRAG-7.10 after the approved declaration skip

Retain Automated and its existing Automation line, `tests/ui/drag-7-hierarchy-modal.spec.ts`, `client/src/components/workflow/popSession.test.ts`. The skip is not counted. It removes the extra release-over-sibling-sub-row carrier, while running carriers still prove modal exit to K, Free/shortCard state and bounds, Q/after request and stored outcome, the further pop out of K, header containment and non-accumulating excursions. The Then does not separately require a release while the bare cursor is over a foreign sibling sub-row.

In `tests/ui/drag-7-hierarchy-modal.spec.ts`, the running generated title is “DRAG-7.10: <arrival> pops once to <region> on the clock, Free, and a release after Card Q writes that placement”, expanded for each arrival below and each region “its column” / “its expanded sub-row”:

- “a Stub carried from a modal a click opened”;
- “P’s own Stub carried into a modal a hold opened”;
- “a Free Card zoomed into P, carried into a modal a hold opened”.

The same file also runs the two distance titles “DRAG-7.10, DRAG-1.14: P’s own Stub carried into a modal a hold opened pops once to its column on one sample of the distance, Free, and a release after Card Q writes that placement” and “DRAG-7.10, DRAG-1.14: P’s own Stub carried into a modal a hold opened pops once to its expanded sub-row on one sample of the distance, Free, and a release after Card Q writes that placement”. All these use the checked modal-exit helper, whose observations and requests were read.

Additional running carriers in that file:

- “DRAG-7.10: resting beyond P’s box, inside its column, pops once to the column, as the clock runs there too”;
- “DRAG-7.10: the modal’s header is part of the modal: a cursor resting over it pops nothing”;
- “DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row” — observes the first pop locked in K, then moves into the sibling region and observes the further pop reaching Board rather than entering that sibling directly;
- “DRAG-7.10, DRAG-1.14: with the distance off, an excursion out of the modal shorter than the pop-out delay leaves the drag in it”;
- “DRAG-7.10: an excursion out of the modal shorter than the pop-out distance leaves the drag in it”.

The existing approved clock mapping in `client/src/components/workflow/popSession.test.ts` includes “DRAG-7.10: two excursions out of the hierarchy modal’s box, each shorter than popDelayMs, pop nothing: a return restarts the clock” and “DRAG-7.10: a Descendants region with a boundsRect is still inside over that box, the hierarchy modal’s header above its list”. Their parameterized clock/bounds observations supply the reset and header clauses. No other unchanged legacy case is re-reconciled.

The skipped title is “DRAG-7.10: in an expanded sub-row, the sibling sub-row beside it is not reached by the one pop: a release over it is the sub-row’s own placement”, in `tests/ui/drag-7-hierarchy-modal.spec.ts`. It stays stamped and is recorded for batch 4i by the fixed Review log. No repair, replacement test or extra variant is commissioned here.

## Coverage Report Findings

The supplied whole-catalog report says: no lost coverage, no Manual case carried by a running test, no stale Automation line, no disagreeing case statuses, and no unread catalog fields. Each finding category therefore needs no global correction. The report's ID-to-files map, including skipped carriers apart, was used for scope mappings. The catalog was not swept or its checks rebuilt by hand.

The report's file-level DRAG-7.10 running carrier remains present despite the single skipped carrier; the scoped whole-Then review above supports retaining Automated. TREE-1.4 and TREE-2.1 now have running replacements, so their old skipped declarations supply no coverage and require no retained skip pointer.

## Stamps Added

None. All counted tests already carry their case IDs, on their own titles or inherited from existing describes. No retired ID was found in the range needing removal. No test title or body was changed.

## Review Log Answers

These answers confirm current test assertions, rather than adopting reviewer verdicts as rulings. The mapping table gives each case's exact file/title.

| Review-log item | Closing answer |
|---|---|
| TREE-1.14 desk Y1–Y4 | Still Open/deferred. The hook proves the held branch, late-Y display and next-pickup own gap, but not the offered cyclic state, sent release, real 400 or both retained saved trees. The desk's extra next-pickup own-gap clause remains part of the resumption contract. |
| TREE-2.10 desk B1–B5 and first-pass held gap | Resolved by the new surface carrier: independent leaf and branch measurements, one count text row under Nathan's recorded clarification, below-box overlap without added sidebar space, browser hit-testing and the resulting saved B/after placement. No decorative pixel-height rule is substituted. |
| TREE-2.11 desk N1–N5, accepted Range correction and Simplify finding | Resolved. The current helper observes the text span's row count, available bounds, scroll/client widths and clipping. Both widths retain the named counts and sidebar width. The removed whole-container comparison is not required by the Then. |
| TREE-1.15 first-pass synchronization/restoration gaps and confirming verdict | Resolved. Shrink changes the live ghost's Collapse control from visible to hidden before held-invalid assertions; growth/shrink restoration checks X/Y's rendered depths. Edit/create growth retains real 400 and saved-position checks, and new pickups read the changed height. Closing the held create dialog changes reachability, not a required outcome. |
| TREE-1.16 first-pass answer/read synchronization and displayed-parent gaps and confirming verdict | Resolved. The ghost's Collapse control positively changes while live; edit observes B in the breadcrumb; refusal waits for the successful following response to finish before checking live suppression. Ending restores Y at rendered depth 1 under B. Next pickup reads that tree. |
| TREE-3.7 first-pass unflagged/unrepaired gap and confirming verdict | Resolved by ordinary over-cap row/wrapper classes, absent invalid markers, every original rendered depth, zero page writes and complete saved-list equality. Existing route coverage supplies accepted rename/same-parent move. |
| TREE-4.7 first-pass immediate displayed child placement and confirming verdict | Resolved. After each answer and before reload the written row is at depth 1 in A/B/last order. The drag additionally checks the unanswered interval and reload; real reindex pairs and saved links/order remain. |
| TREE-11.3–TREE-11.6 and TREE-11.8 first-pass Given gaps and confirming verdicts | Resolved. Explicit collapsed chevrons and hidden-child assertions precede each named submission; required pending/success/failure, unrelated collapse and saved-parent outcomes remain. |
| TREE-11.7 first-pass ordinary/queued Given gaps and confirming verdict | Resolved. Ordinary rename begins with collapsed P and hidden X. Every queued fixture collapses P and hides C before release, then observes release opening P. Both edit kinds and both request-order variants retain later collapse, hidden C/X and saved parent/name checks. |
| TREE-2.13 first-pass onset assertion, Nathan's withdrawal, revised case and confirming verdict | Resolved against the revised Then. Pickup depth remains; only the withdrawn no-line-at-pickup assertion is absent. Boundary top edges, four name columns, increasing starts and the empty-hierarchy exception remain. Wiki project-tree §2 still says no line until first movement: its recorded PO alignment handoff remains open. No immediate-line rule or proof of the withdrawn condition is claimed. |
| TREE-2.10 request correction after red | Accepted. The current complete body names B/after with nextId null; the case requires the displayed relation, not both surrounding anchors. Actual saved B/X/Q order and retained A-under-X independently establish the outcome. |
| TREE-4.15 atomic observation correction after red | Accepted. One DOM/painted-rectangle snapshot and frame observations preserve the same required create/delete result, hierarchy, unchanged Q and no-extra-write assertions. |
| All first-pass Proves / Keep verdicts not singled out above | Confirmed by the per-case mappings. The required placements, variants, held-answer intervals, frame observations and stored outcomes remain asserted. No new reduction or optional matrix is introduced. |
| TREE-1.2 / TREE-1.6 / TREE-1.10 Simplify recommendations and Nathan's Keep decision | Settled for this close: current tests prove the Then and stay unchanged. Their cheaper-test candidates remain deferred to Drag Automation Deferrals. |
| TREE-9.4 held partial mapping and Nathan's Coder deferral | Still Open/deferred. The collection's X fixture/outcome contradicts the already-saved move-in Given, several-answer variants check only final IDs, and no real saved-delete outcome is established. Existing partial mapping is not promoted. |
| Nathan's TREE-1.14 / TREE-9.4 scope disposition and Stop 3 omission | Honored. Both cases retain their original requirements and Open/blank Automation fields. Their Coder dependencies and dependent proof stay in Drag Automation Deferrals. |
| Approved legacy DRAG-7.10 skip and Stop 4 restart | Honored exactly as fixed input. The skip counts for no coverage; the remaining mapped tests support the case, and 4i retains the skipped carrier's follow-up. The supplied complete green restart is the run evidence. |

No declined mapping is reversed. No open first-pass gap is silently treated as closed by a green result.

## Proposed Internal Mappings (need approval)

No new approval is needed for the 31 confirmations. TREE-1.2/TREE-1.6 use the catalog's outright-approved client request category only for the clauses the surface carriers miss. Existing approved pointers retained above need no new approval.

The prior partial TREE-1.14 candidate remains unapproved and deferred: `client/src/App.pendingMove.test.tsx`, describe “TREE-1.14: a move refused after an earlier edit landed leaves that edit”, test “returns X to its top-level place with Y still its child, each at its saved position”. It manually invokes release after a mocked edit and rejection; it proves only retained-edit rollback. It does not establish a reachable late-Y child state, a real 400, stored positions or the create path. Approval on resumption would still leave those gaps. No Automation line or stamp is added from this proposal.

## Proposed Manual (need approval)

None. No case is set to Manual. TREE-2.8 remains the Planner-owned Manual appearance case; no running test carries its ID in the supplied report. Precise count, state, relative geometry, branch and saved-placement assertions remain behavioral coverage.

## Gaps

- **TREE-1.14 — Open, deferred.** `client/src/components/sidebar/useProjectDragReorder.test.ts`, describe “TREE-1.14: a project added to the dragged subtree after pickup stays a candidate, and a cyclic release is refused”, generated test “after %s, Y is drawn under X and is no part of the held branch, and the next pickup of X holds it, hidden and out of placement”, proves both edit/create response fixtures and next-pickup exclusion/own-gap no-write. Its “TREE-1.14, TREE-1.15: holds the carried branch, and the height the cap reads, for the whole drag” also proves held membership/height. Neither selects and sends the cyclic late-Y child placement. The partial App candidate is identified above. The offered state, sent release, real 400 and retained saved edit/create outcomes remain unproved as a whole. Destination: `docs/planning/tech-debt-stories/drag-automation-deferrals.md`, per Nathan's recorded deferral.
- **TREE-9.4 — Open, deferred.** `client/src/components/sidebar/useProjectCollection.test.ts`, describe “TREE-9.4: earlier write answers cannot restore a deleted project or place another under it”: “$name, answered after P is deleted, brings back no row” preserves P/C/N absence, Q and write counts for its valid portions but retains moved-in X contrary to the Given; “several such answers land %s: none brings a row back” checks final IDs without the required per-answer Q/no-write safeguards; “opens no collapsed parent for the answer of a project created under a deleted one” covers only opening callbacks. The already-saved move-in/delete fixture, required per-answer checks and actual saved deletion outcome remain incomplete. Destination: `docs/planning/tech-debt-stories/drag-automation-deferrals.md`.

The TREE-2.13 PO wiki wording handoff is still open as recorded above; it is not a missing assertion in the revised case. The skipped DRAG-7.10 carrier remains a batch 4i follow-up, not a newly commissioned variant or an assertion of whole-case failure.

## Duplication

The supplied map reports multiple running ID-bearing files for the following scoped groups. This is a duplication inventory, not approval of every internal carrier or a request to consolidate:

- TREE-1.1 / TREE-1.9: `tests/ui/project-tree-drag.spec.ts`, `client/src/components/sidebar/SortableProjectRow.test.tsx`, `client/src/components/sidebar/useProjectDragReorder.test.ts`. TREE-1.1 additionally has two surface carriers for its two named scenarios.
- TREE-1.2 / TREE-1.6 / TREE-1.10 / TREE-1.15 / TREE-1.16: their surface files in the mapping table and `client/src/components/sidebar/useProjectDragReorder.test.ts`.
- TREE-1.4: `tests/ui/project-tree-drag.spec.ts`, `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`.
- TREE-1.5: `tests/ui/project-tree-placement.spec.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts`, `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`.
- TREE-1.8 / TREE-1.11: `tests/ui/project-tree-drag.spec.ts` and `client/src/components/sidebar/useProjectDragReorder.test.ts`.
- TREE-1.17 / TREE-1.18: `tests/ui/project-tree-placement.spec.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts`, `client/src/components/sidebar/useProjectDragReorder.test.ts`.
- TREE-1.14 has the two partial internal files named under Gaps / Proposed Internal Mappings.
- TREE-2.1: `tests/ui/project-tree-drag.spec.ts`, `client/src/components/sidebar/SortableProjectRow.test.tsx`, `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/dragTargets.test.ts`.
- TREE-2.4 / TREE-2.5: `tests/ui/project-tree-state.spec.ts`, `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/dragTargets.test.ts`. TREE-2.6 has the surface and hook files.
- TREE-2.7 / TREE-2.10: `tests/ui/project-tree-state.spec.ts` and `client/src/components/sidebar/SortableProjectRow.test.tsx`.
- TREE-2.12: `tests/ui/project-tree-state.spec.ts`, `client/src/App.pendingMove.test.tsx`, `client/src/components/sidebar/useProjectDragReorder.test.ts`. TREE-2.13 has the surface, row-component and hook files.
- TREE-3.7 / TREE-3.9: `server/tests/routes/projects.test.ts` and their sidebar/drag surface carriers respectively.
- TREE-4.8 / TREE-4.9: `tests/ui/project-tree-sidebar.spec.ts` and `client/src/App.pendingMove.test.tsx`. TREE-4.11 has the surface file and `client/src/components/sidebar/useProjectDragReorder.test.ts`.
- TREE-11.2: `tests/ui/project-sidebar.spec.ts` and `tests/ui/project-tree-expansion.spec.ts`. TREE-11.5 / TREE-11.7: the expansion file and `client/src/App.pendingMove.test.tsx`.
- DRAG-7.10: `tests/ui/drag-7-hierarchy-modal.spec.ts`, `client/src/components/KanbanCard.test.tsx`, `client/src/components/workflow/dragStructure.test.ts`, `client/src/components/workflow/popSession.test.ts`. Its skipped carrier in the surface file is separate and supplies no coverage.

The complete proof sets are the mappings above. Existing approved companions are retained; internal ID-bearing files that are unnecessary beside a complete surface proof are not added as new mappings.

## Test Quality Concerns

No new tautological test is found among the proof sets counted here. Expected parent/order outcomes derive from the named fixtures and wiki gap/cap/request rules; actual saved API rows, captured requests, painted neighbors, text layout and browser hit-testing are observations. Helper geometry is not fed back into the app. The two request supplements assert case-specified relations rather than copying a resolver's computed answer.

The known TREE-1.2 / TREE-1.6 / TREE-1.10 cost concerns are settled by Nathan's Keep decision for this batch and remain cheaper-test candidates in `docs/planning/tech-debt-stories/drag-automation-deferrals.md`. TREE-2.11's extra container-width constraint is removed while the required text clipping is retained. No additional cost/flakiness matrix is proposed.

## Uncatalogued Tests

No newly authored running test in the changed TREE suites lacks a case ID. No changed test needs a forced mapping solely for a coverage gate. Shared observation/seed helpers are not standalone tests. This pass does not inventory unchanged uncatalogued tests across the repository.

## Candidate New Cases

None raised. The recorded TREE-2.13 PO wording handoff, two deferred proof gaps, three cheaper-test candidates and existing 4i skip follow-up retain their stated destinations. Any future drag candidate/optional variant/quality hardening belongs in `docs/planning/tech-debt-stories/drag-automation-deferrals.md` under the MVP deferrals catalog, not this batch.

## Totals

Applied to the supplied coverage report's totals: P0 +1 Automated / −1 Open; P1 +21 Automated / −21 Open; P2 +9 Automated / −9 Open. No other status changes.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| P0       |       142 |    5 |      0 |       1 |          0 |   148 |
| P1       |       229 |   15 |      6 |       0 |          0 |   250 |
| P2       |        79 |    4 |      4 |       1 |          2 |    90 |
| Total    |       450 |   24 |     10 |       2 |          2 |   488 |

Scope totals: original 33 cases = 31 Automated / 2 Open; 14 inherited TREE cases = 14 Automated; changed DRAG-7.10 = Automated. All 48 scoped cases = 46 Automated / 2 Open. The whole-catalog source inventory remains the supplied 44 suites, 125 test files and 1829 declared tests / 15 statically identified skips; reconciliation adds no test or skip. These static catalog-report counts are distinct from the expanded Playwright run's 553 / 29 counts.

Written: 62 status locations and 31 Automation lines across `docs/test-plans/project-tree/tree-1-gap-and-depth.md` (14 cases), `tree-2-what-the-drag-shows.md` (12), `tree-4-sibling-order.md` (4) and `tree-11-sidebar-expansion.md` (1), plus this report. No case text/title/priority, wiki, app, test body, helper or fixture was edited. No stamp was added and no commit was made.


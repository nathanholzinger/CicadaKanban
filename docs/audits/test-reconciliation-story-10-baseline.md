# Story 10 — baseline test reconciliation

Static baseline at source HEAD dd0341be, 2026-11-06, after Phase 1 and the Planner's Phase 2 step 1 pass, including the settled TREE-2.14 ruling. **Five cases become Automated, four become Open, and one stale Automation path is repaired.** This completes Phase 2 step 2; it does not perform the Architect's inventory, approve new internal mappings or Manual calls, or start an Automator batch.

Only catalog status/Automation fields, synchronized summary-table statuses, and this report are written. No case wording, title, priority or ID, test, app code, wiki, plan or archive is changed. No app/test suite or browser probe was run. The documentation checks at the end are separate from runtime behavior verification.

## Coverage Mapping

### Exact scope and authority

Whole-case review covers **248 current cases**:

- every current case in board-drag-interaction DRAG-1 through DRAG-8;
- every current case in project-tree TREE-1, TREE-2, TREE-4 and TREE-11;
- TREE-9.4, ATT-4.9, BCU-5.6, BCU-5.7, TC-2.6, TC-2.16, TC-2.17 and TC-6.4.

This includes TREE-4.15 and TREE-2.14, all twelve revised live cases named in Scope, every existing Automated case in those suites, and every live case routed here by roadmap Story 10 items 1, 4, 9 and 10. The roadmap's retired IDs are not recreated. IDs used only as supporting references or in its expressly non-deferred notes are not extra independent assignments. The six legacy skipped repositioning declarations and two legacy zoom declarations are examined as candidate/skip obligations, even though their titles have no case IDs.

TC-6.13 is still Pending PO and routed to Quick Items. It is not assessed as live; no rule is inferred. ATT-1.10 remains Planned. TC-5.15, TC-6.11 and ATT-5.11 retain their separate destinations/statuses. D10's eventual routing inventory belongs to the Architect.

Read authority: root/workflow AGENTS, the Reconciler definition, catalog README, documentation standards and testing strategy; the story's Scope, Phase 2, Step 1 results, Inbound deferrals, Amendments and Living-docs handoff; the roadmap's Story 10 entry; current cases and cited wiki passages. Rules include board-drag-interaction, project-tree, item-attachment, item-positioning and boards-columns-unsorted, with hierarchy-placement, positioning and row-references. TREE-2.14 follows hierarchy-placement §7 and project-tree §1: newly drawn Y is untiered/full strength for the current drag, existing tiers stay fixed, and next pickup makes Y Mid in this fixture.

Starting evidence, read for their relevant mappings, gaps, approvals and quality findings and then checked against current test bodies:

- [A3 board drag](../archive/test-reconciliation-a3-board-drag-interaction.md), [A3 attachment](../archive/test-reconciliation-a3-item-attachment.md), [A3 positioning](../archive/test-reconciliation-a3-item-positioning.md), [A3 close](../archive/test-reconciliation-a3-close.md);
- [A6 board drag](../archive/test-reconciliation-a6-board-drag-interaction.md), [A6 project tree](../archive/test-reconciliation-a6-project-tree.md), [A6 attachment](../archive/test-reconciliation-a6-item-attachment.md), [A6 positioning](../archive/test-reconciliation-a6-item-positioning.md), [A6 boards/Unsorted](../archive/test-reconciliation-a6-boards-columns-unsorted.md), [A6 rerun](../archive/test-reconciliation-a6-rerun.md), [A6 recheck](../archive/test-reconciliation-a6-recheck.md), [A6 last round](../archive/test-reconciliation-a6-last-round.md);
- [Story 8.1](../archive/test-reconciliation-story-8-1-codex-trial.md), [Story 8.9 follow-up](../archive/test-reconciliation-story-8-9-follow-up.md), [Story 8.9 final](../archive/test-reconciliation-story-8-9-final.md);
- [8.8/8.11/8.12 fixes confirming](../archive/test-reconciliation-stories-8-8-8-11-8-12-fixes-confirming.md), [8.13 confirming](../archive/test-reconciliation-story-8-13-confirming.md), [8 close-out confirming](../archive/test-reconciliation-story-8-close-out-confirming.md).

An active title-prefix case ID, including one inherited from a describe, establishes identity, not complete coverage. Skipped declarations count for nothing. Surface tests count without approval. Existing internal pointers and the exact earlier approved partial associations remain authorized; their approval does not extend to new case/file associations. The README's parameterized drag-clock and pure drag-only ordering/request categories count within their limits. In particular, pure geometry, arbitrary hook/component behavior, and non-ordering workphase cascades are not approved merely because they are unit tests. Cross-referenced consequences delegated to another case are not demanded again here.

The following tables assess all scoped cases. Every E key resolves to an exact file/title in the evidence register, including literal parameter placeholders and inherited describe titles. Each Open row lists **every current ID-bearing declaration**, active and skipped, plus the exact residual Then. A listed internal test is not automatically a counting mapping: the row and approval section state its limit. Open Automation lines stay “—”.

### Open cases: complete residual inventory


#### DRAG-1

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-1.1 | P0 | E273, E405, E406 | Stub and nested-Stub pickup contexts are checked; the start-session unit accepts an already chosen context. Missing: actual Free pickup in merged and expanded modes (body versus header/footer and exact sub-row), Unsorted pickup at Board, and the no-Card-at-pickup invariant. |
| DRAG-1.2 | P0 | **no test carrying ID** | No test carrying ID. Missing: both leans in the A/B gap, painted highlight naming the same saved anchor, committed A/X/B order, and unchanged workphase, parent and attachment. |
| DRAG-1.3 | P0 | E276, E478, E479 | The two surface tests reach pop-out/no-context and pop back in; the clock test pins the parameterized transition. Missing: the carried copy following successive cursor positions freely after reaching Board; context-null metadata alone does not prove movement. |
| DRAG-1.5 | P0 | E478, E481 | Surface evidence covers Board-to-column entry and anchor placement after it. Missing: column/sub-row-to-Descendants release, immediate last-child attach and moved gap/depth release at that layer, plus the destination bounds. |
| DRAG-1.6 | P0 | E208, E485 | The sub-row release test reaches Board first; the region unit identifies the gap as nowhere. Missing: release in W2 before popping out still committing W1's ghost slot, and the middle-band hold into W2 followed by its within-action. |
| DRAG-1.9 | P0 | E483, E497 | Gap/Unsorted releases retain the saved row. Missing: header/footer, toolbar, expanded sub-row gap/below-last space and broken-column variants; explicit no request and no pop-in clock across those places. Unchanged fields do not establish zero writes. |
| DRAG-1.12 | P1 | E479 | The surface test pops back into a column containing only X. Missing: A/B neighbors, highlighted A/before and that saved request/order with unchanged fields; separate middle-band release before re-entry with zero request. |
| DRAG-1.13 | P1 | **no test carrying ID** | No test carrying ID. Missing: actual Unsorted pickup, free cursor following and no bound from the first movement, nowhere no-write, receiving-band write and pop into the column before a Card can be entered. |
| DRAG-1.14 | P2 | E278, E279, E283, E297, E409 | ID tests cover ordinary/merged-column distance, disabled distance, the board Card box and a distance-driven detach. Missing: modal-box and expanded-sub-row distance boundaries. The UI driver sends multiple samples; it is not single-sample evidence. |
| DRAG-1.16 | P0 | **no test carrying ID** | No test carrying ID. Missing: each stated foreign/nowhere release retaining the locked column's A/after relation and fields; the still-locked Descendants release retaining P and the S1/S2 gap instead of using a foreign region. |
| DRAG-1.17 | P0 | **no test carrying ID** | No test carrying ID. Missing: Board cannot enter P directly; Descendants exits to K with column bounds/ghost and a reorder release; Board needs the next pop; P-to-Q cannot hop directly. Unstamped pop-machine candidates cover only parts. |
| DRAG-1.18 | P1 | **no test carrying ID** | No test carrying ID. Missing: positive distance never substitutes for either zoom-in hold, and the early release remains the locked column reposition; test with parameterized thresholds rather than current tuned times. |
| DRAG-1.20 | P0 | **no test carrying ID** | No test carrying ID. Missing: holding foreign-column or sibling-sub-row Q while X is alone in its locked list never starts its zoom, never names Q, and releases without a write; the later required pop sequence. |
| DRAG-1.22 | P1 | **no test carrying ID** | No test carrying ID. Missing: painted own-slot ghost and unchanged neighboring cards while resting over pickup; no extra gap elsewhere. |
| DRAG-1.24 | P0 | E211, E495, E496, E498, E499 | Four active surface tests prove named own-slot ordering against unseen workflow items. The request unit proves identity for a list with no others. Missing: an actual alone-card pickup/set-down observing zero requests; the internal identity result alone does not drive that dispatch. |
| DRAG-1.26 | P2 | **no test carrying ID** | No test carrying ID. Missing: exactly one outline, at the current column/sub-row/Card through transitions, none at Board, using configured activeContextOutlineColor. |
| DRAG-1.27 | P2 | **no test carrying ID** | No test carrying ID. Missing: Free pickup's carried-copy tilt. A stamped component candidate can prove presence, without fixing its angle. |
| DRAG-1.28 | P1 | E204 | The ID-bearing geometry test covers x-only merged clamp and both-axis sub-row/Descendants clamp against supplied boxes; this geometry mapping still needs approval. Missing: whole-Card title/padding versus smaller section bound, continued movement inside it, and only P's placement rows. |
| DRAG-1.33 | P2 | **no test carrying ID** | No test carrying ID. Missing: C collapsed/E expanded through each pop and release; branch restoration respecting those preferences; zoom temporarily opens C, leaving restores collapse, attaching keeps C open. |
| DRAG-1.35 | P1 | E272, E294 | The pop machine proves there is no further child context, and the form unit switches representations. Missing: actual one-hold immediate entry for populated and childless P from column/sub-row, whole-Card bound, both rendered Stub copies, and no second hold. |
| DRAG-1.36 | P0 | E316, E317 | Approved pickup-hook tests identify Q or the detaching P as the containing Card with pending parents. Missing: its whole rendered box actually bounds the drag in both setups, rather than a former Card/column. |

#### DRAG-2

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-2.4 | P1 | E491 | The classification surface test seeds NO_POP and preserves classifications over hover. Missing: preservation through actual pop-out, pop-in and leaving/entering contexts. |
| DRAG-2.8 | P1 | E198, E199, E200, E492 | Inherited Stub-classification units cover legal, cycle and cap answers; the surface exercises legal/cycle Stub targets. Missing: explicit absence of classification on Unsorted, a broken column and an expanded wrapper, with corresponding no-enter/no-write outcomes. The Stub depth unit is useful approved classification evidence, not a non-target surface test. |
| DRAG-2.12 | P0 | E319, E320 | Approved hook evidence checks the pending child itself and a detaching descendant. Missing: the transitive visible Free D to A to X chain through A's pending attach/reparent, with D Cycle-forming before the response. |
| DRAG-2.14 | P1 | E014, E190 | Approved classification and chrome evidence supplies parent tier and undimmed classes. Missing: actual Full Card and Stub content with retained Valid state and no relationship color; class selection is not computed opacity/color. |
| DRAG-2.15 | P1 | E012, E191, E192 | Approved units assign anchor/neither and chrome classes. Missing: actual configured Mid/Low opacity with no relationship color for the stated Cycle-forming and Depth-capped Cards and their Stubs, and both Cards still usable as named column neighbors but never parents. |
| DRAG-2.16 | P1 | E012, E191, E192 | Approved units identify the cap-boundary Mid Stub and Low descendants. Missing: computed configured strengths, all unrelated rows remaining drawn, and a valid shallower placement beside a rendered Low row. DRAG-7.21 reaches such a cap state without this ID or Low-tier observation. |
| DRAG-2.17 | P1 | E192, E193, E199 | Approved classification units keep Free descendants anchor-only and attached descendants neither. Missing: actual carried-branch absence and non-neighbor status across gap changes/pop/zoom, Free D remaining Mid and D1 Low outside it, for both Stub and Free origins. |
| DRAG-2.18 | P1 | E016 | Approved chrome unit chooses Full or neither from the owner. Missing: rendered Full/Low strengths, no Mid, persistent unrelated overflow positions/count semantics, and absence of carried-owned overflow rows. |
| DRAG-2.19 | P1 | **no test carrying ID** | No test carrying ID. Missing: the Full/Mid/Low snapshot across Board, column/sub-row, Descendants and modal, a mid-drag response, each end mode clearing tiers, and Full post-drop base strength independent of pending pulse. |
| DRAG-2.20 | P1 | E014, E015 | Approved chrome tests separate overlay, ghost and idle classes. Missing: independent computed ghost/Low values, active modal rows versus static backdrop rows, and Unsorted/broken/wrapper no-tier with backdrop shading separate. |
| DRAG-2.21 | P1 | E013, E018, E019 | Approved structural tests put opacity on content wrappers and keep nested Stubs outside the Card's wrapper. Missing: computed nonmultiplying nested strengths and Full drop lines beside both a Mid Card and a Mid Stub. |
| DRAG-2.22 | P1 | E459 | The active surface proves Depth-capped overflow no-hold/no-modal at both invalid gaps and no hold at the valid shallower state. Missing: Mid Card no zoom dwell/cue/entry and Cycle-forming owner outside the carried branch unable to provide a modal hold; carried-owned overflow absence. |
| DRAG-2.23 | P1 | E194, E319, E320 | Approved hook/classification tests cover pending attach into carried X and pending-detached descendants. Missing: unrelated D previewed under legal P versus too-deep Q, the detached-from-Q Depth-capped/Mid boundary and actual rendered Stub/Card absence/strengths. |

#### DRAG-3

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-3.9 | P0 | E258, E486 | Reopened: the surface makes one incoming drop into a done list with one existing completion and checks done workphase, null position and completion stamp. The pure placement test supplies existing-slot previews at three aims. Missing: the stated two-completion fixture and top/bottom/over-each-item anchor-free requests; ID-bearing proof of no top/bottom bands and bottom-only newest-completion reservation. Useful unstamped single-band/request candidates are listed below. |
| DRAG-3.10 | P1 | E215, E487 | Reopened: the surface drops once into an empty active region and keeps X's position; the request unit supplies an anchor-free empty-list move. Missing: one-zone h geometry, release anywhere rather than only one sampled point, and empty-terminal geometry/completion behavior. The no-position append fallback is delegated to TC-2.24; it need not be duplicated here. |
| DRAG-3.11 | P1 | E237, E256, E474, E477 | The active tests cover top and kept-position middle previews and their saved orders; list/placement units prove ordinal values remain unchanged. Missing: observation of the bottom-band ghost at the end before release. No new numeric position is already covered by the stamped list unit. |
| DRAG-3.12 | P0 | E210 | The pure request unit makes a covered member's existing-slot placement an identity. Missing: merged W2/W3 pop-out-and-return gesture, zero network request with kept W3/position, and the expanded sibling-sub-row contrast. |
| DRAG-3.16 | P1 | **no test carrying ID** | No test carrying ID. Missing: scrolled-content top/divider out of view resolving the visible top as middle, then content-top re-entry resolving top; divider reachability must follow real content, not the clipped slice. |
| DRAG-3.17 | P2 | E475, E476 | Surface tests prove hover-height invariance for positional, empty, done and expanded-empty shapes. Missing: exact reserved zone heights/shapes and actual collapse of all reservations while locked at column/sub-row/Descendants, then restoration at Board. |
| DRAG-3.18 | P2 | **no test carrying ID** | No test carrying ID. Missing: exact Move Top/Move Bottom and Move to {name} labels, unlabeled middle, and zones/labels replaced by the ghost when hovered. |
| DRAG-3.19 | P2 | E039, E040, E041 | Approved components prove copy-only branch wording in supplied forms. Missing: both actual shortCard copies' pills/title/description/footer/indicator rules and constant box heights, full branch absence at Board/Column, and full-height return with collapse preference preserved. |
| DRAG-3.20 | P2 | **no test carrying ID** | No test carrying ID. Missing: two dividers on nonterminal positional columns and sub-rows at Board, single-band empty/terminal geometry, and no dividers on any region while column/sub-row/Descendants is locked. BandGuides' mounting-support test does not assert these cues. |
| DRAG-3.22 | P2 | E039, E040, E041, E205, E206, E207, E272 | Approved form/geometry candidates supply form switching, row width and pointer re-anchor portions, and approved components supply copy-only wording. Missing: both painted copies switching each way, held shadow, pointer continuity in each direction, Stub-origin copies and line through real transitions, and shared typed/untyped heights. Geometry/form mappings remain approval proposals. |
| DRAG-3.23 | P0 | E216 | The request adapter produces a bare done-workphase move. Missing: actual pop-in to a done column then release, completion stamp/null position and newest-completion preview/landing under this ID. |
| DRAG-3.24 | P1 | E210 | The request unit proves existing-slot identity. Missing: a real D1/X/D2 done-list ghost staying fixed through up/down movement with no shuffle, zero request, and unchanged completion/workphase/order. |
| DRAG-3.25 | P1 | E025, E042, E043 | Approved components structurally hang the branch line outside the box. Missing: measured equal s for typed/untyped section, overflow, modal, backdrop, ghost and carried rows; pill fits title line, carried border inside s, long content no growth, and branch line adds no measured height. |

#### DRAG-4

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-4.1 | P0 | E218 | The request unit proves populated last-child anchor shape. Missing: actual immediate no-cursor-movement zoom/release, saved last-child order, inherited different workphase, Stub rendering/unchanged P and single commit; repeat with X a detached child already parented to P. |
| DRAG-4.3 | P1 | **no test carrying ID** | No test carrying ID. Missing: done-column pop-in then neighbor P hold and immediate last-child attach, with the done-parent consequences delegated to ATT-6.1; Board's single band must not prevent that zoom. |
| DRAG-4.5 | P0 | **no test carrying ID** | No test carrying ID. Missing: same highlighted B/before aim giving a quick reposition with unchanged parent versus a full-hold immediate last-child attach. |
| DRAG-4.8 | P0 | E149, E176, E177, E178, E202, E203, E370, E375, E376, E377, E378, E379, E380, E381, E382, E383, E392 | Approved pure hierarchy/projection/collision evidence pins all four states, the one-state gap, subtree exclusion and neighbor calculation; approved branch drawing units remove branch/overflow rows. Missing: live rows opening the actual ghost gap with the named highlight directly beside it after branch removal. |
| DRAG-4.12 | P1 | E035, E217, E410 | Surface reparent into childless Q and request unit cover attachment/no anchor; the component draws a supplied one-row preview and still needs mapping approval. Missing: gap0/depth0 through offsets and movement, immediate versus moved release, append result and the Free-children-but-no-attached-children fixture leaving those Free rows untouched. |
| DRAG-4.13 | P1 | **no test carrying ID** | No test carrying ID. Missing: both done-parent placements from the same starting S1/S2 order, saved S1/S2/X and X/S1/S2 orders, terminal workphase with null completion and sibling-scope position, unchanged P/siblings, and exact named anchors. |
| DRAG-4.15 | P0 | **no test carrying ID** | No test carrying ID. The two legacy zoom specs are skipped and unstamped. Missing: the full C1 to Board to merged C2 to P sequence, inherited non-entry W3 rather than W2, no band anchor, and the Board release contrast. |
| DRAG-4.17 | P0 | **no test carrying ID** | No test carrying ID. Missing: zoomed-in Free X exits to C with Stub ghost gone and both copies shortCard, followed by Q/after reorder with unchanged original parent/Free state and no attach. |
| DRAG-4.19 | P0 | E289 | Approved pop-machine evidence enters the named Card independently of bare cursor. Missing: actual side highlights for A/after and B/before selecting their respective rendered Descendants contexts; no title-only credit for a live cue. |
| DRAG-4.20 | P1 | **no test carrying ID** | No test carrying ID. Missing: rendered silent dwell, visible cue, end-of-cue outline/opening/Stub copy in order and any earlier release remaining a reposition. Clock support without this ID is a candidate, not mapped evidence. |
| DRAG-4.21 | P1 | **no test carrying ID** | No test carrying ID. Missing: card/ghost/highlight positions and sizes unchanged from cue start to just before completion, same named Card and same release relation. |
| DRAG-4.22 | P1 | **no test carrying ID** | No test carrying ID. Missing: card/side change, pop-out and cancel clearing the cue/clocks, fresh dwell after resets and release using the then-current relation. |
| DRAG-4.30 | P1 | E148, E151, E152, E153, E154, E166 | Approved projection units pin nested-last-row foreign seed, own-slot return, entry anchor guards and no-write. Missing: actual zoom with still cursor over S1 showing the seeded last gap and committing last-child order; own Stub's pop/zoom-return showing its pickup slot and zero write. |
| DRAG-4.32 | P1 | **no test carrying ID** | No test carrying ID. Missing: visible invalid cue when tabbed over cap and removal at a valid shallower state in the same gap, without fixing its style. |
| DRAG-4.33 | P1 | **no test carrying ID** | No test carrying ID. Missing: nested-last S2a gap offering precisely depth0 after S2, depth1 after S2a and depth2 first-child, with each distinct release. |
| DRAG-4.34 | P0 | E222 | The request unit proves full reparent-with-placement to a different parent. Missing: actual cursor following and painted shuffle for all three concrete placements after zoom, committed order, both approach directions, closed origin gap, Free and foreign-Stub origins with inherited workphase. |
| DRAG-4.35 | P0 | E325 | Approved hook evidence changes projection from the move's stale row to the announced row. Missing: painted highlight and gap, both depth0/depth1 saved trees and named neighbor, retained workphase, carried XC excluded and preserved, and above/below final-crossing approaches without another move. |

#### DRAG-5

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-5.1 | P0 | E220, E270, E296, E408 | Approved request/placement/clock evidence pins detach shape and the one-layer parent; the surface confirms Free/kept-parent/inherited workphase and Card display. Missing: the actual Q/after highlight/request and saved position after Q, plus expanded containing-sub-row destination. A nonnull position does not establish the named slot. |
| DRAG-5.2 | P0 | E221 | The request unit omits workphaseId for an already covered member. Missing: merged W2/W3 fixture with P/X in non-entry W3, actual detach/release keeping W3 and no workphase field. The existing surface uses a one-workphase column and cannot distinguish this boundary. |
| DRAG-5.3 | P0 | E271 | The placement unit previews a popped-out Stub Free at last. Missing: the two outward pops, each C2 band request/anchor/workphase and retained P, expanded exact sub-row, and middle hold into C2 followed by its reposition. |
| DRAG-5.4 | P0 | E217, E266, E410 | Request/placement units and surface prove final reparent to Q with inheritance and nested rendering. Missing: zero writes during exit/hold and exactly one final reparent, and a populated Q saved-last-child order. Counting only final fields permits an intermediate committed detach. |
| DRAG-5.9 | P0 | E267, E405 | The surface proves Stub pickup and some same-parent position change; the placement unit preserves origin before projection. Missing: precise S1/before and S2/after anchors/orders, S1a first-child reparent, over-cap no-write, unchanged workphase and never-Free state through each. |
| DRAG-5.10 | P1 | E408 | The surface observes a Card in the column after pop and saved detach. Missing: both copies' exact forms, Stub forms on entry to Q and re-entry to P, and cancel/nowhere release restoring P's original Stub without writing. |
| DRAG-5.13 | P1 | E296, E406, E407 (skipped) | Active surface proves nested pickup in P's whole section; clock unit supplies one pop to the containing column. The second surface test is skipped and asserts obsolete Card-layer behavior. Missing: nested subtree fixture, actual containing-column pop, both shortCard copies, old section/branch absence, Q/after detach with retained S1 parent and attached S1b. |
| DRAG-5.14 | P1 | **no test carrying ID** | No test carrying ID. Missing: done-column detach request with no workphase/anchor, retained P, completion stamp/null position and newest-completion preview and landing. |
| DRAG-5.15 | P0 | **no test carrying ID** | No test carrying ID. Missing: title/padding inside whole Card holding Descendants beyond the pop clock and distance boundary, both Stub copies, and release above S1 saving that chosen placement rather than restoring pickup. |
| DRAG-5.16 | P1 | E411 | The surface proves immediate second pickup as a Column Card, kept parent and Free state. Its second drop is before P. Missing: release after Q, exact Q/after relation and saved position after Q. |

#### DRAG-6

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-6.7 | P1 | E224, E225 | Approved-category request tests discard a mocked stale row and choose refresh only when pairs exist. Missing: actual per-item write sequence producing the stale verdict and the resulting board/server equality for every reindexed item after resync. A mocked resync callback is not that readback. |
| DRAG-6.8 | P1 | **no test carrying ID** | No test carrying ID. Missing: re-drag cancel and each no-write release restoring write1's pending s1 while unanswered, and the already-answered contrast restoring saved data with no marker. |
| DRAG-6.9 | P1 | E240 | The approved reconciliation unit preserves a replaced live placement while applying response rows. Missing: live ghost restored immediately without pointer movement, continued drag and its release committing against the reconciled board. |
| DRAG-6.15 | P1 | E328, E430 | Approved hook covers a failed column save stopping an item drag; surface covers a failed item move stopping a modal drag/no later write. Missing: genuine stale response with reindex pairs and the complete three-cause coverage across column/sub-row, section and modal, with X at the server-loaded location and no carried copy/ghost/write. |
| DRAG-6.16 | P1 | E027, E330, E333 | Approved report/text tests cover failed-column-save cause, simulated armed refresh and exact sentences. Missing: actual stale-reindex cause, banner over loading and reloaded board without reset, top-edge placement and all three item representations. |
| DRAG-6.17 | P1 | E026, E027 | Approved component checks persistent empty status and cause text. Missing: real three-cause stop/loading transitions retaining announcement and focus, without substituting the other cause. |
| DRAG-6.18 | P1 | E341 | Approved lifetime hook calls clear directly. Missing: banner/board clicks leaving it up, actual next pickup clearing it during both fully visible and fade portions. |
| DRAG-6.19 | P1 | E029, E340 | Approved hook expires at configured T and component sets duration. Missing: computed full-strength first three quarters/last-quarter fade for both causes and reload not restarting the lifetime. |
| DRAG-6.20 | P1 | E020, E021, E342 | Approved hook/chrome units name X and select a flash class/duration only for that ID. Missing: rendered two amber pulses at reloaded server location in Free/expanded Stub/modal forms, identifying the interrupted item instead of trigger item and preserving saved placements. |
| DRAG-6.21 | P1 | **no test carrying ID** | No test carrying ID. Missing: each collapsed/overflow/closed-modal hidden-X state with no flash or substitute, no automatic opening/scrolling, and continuing explanation banner. |
| DRAG-6.22 | P1 | E329, E331, E332, E334, E336, E337, E339, E346 | Approved hooks now cover cancels, no-write release, failed-column-save no live drag, released/cancelled columns and empty-stop flash state. Narrowed case removes the obsolete live-column no-cue obligation. Missing: genuine failed-item/stale-pairs resync with no live drag and rendered no-banner/no-announcement/no-flash for all three listed silent paths. Armed refresh is a simulation. |
| DRAG-6.23 | P1 | E017 | Approved chrome unit chooses relative pulse/tier classes on content. Missing: computed Full/Mid/Low/ghost pulse endpoints and response clearing the pulse while keeping the live drag's tier. |
| DRAG-6.24 | P1 | E017, E019 | Approved structural tests isolate Card content and nested Stubs. Missing: P-only, S-only and both-pending computed independent strengths plus Full nonpulsing drop lines on Mid Card and Stub. |
| DRAG-6.25 | P1 | **no test carrying ID** | No test carrying ID. The new DRAG-6.26 failed-save hook is a partial candidate only. Missing: each real resync interrupting E's second column drag, saved A/C/E restoration, no reorder on interruption or later pointer release and no item write. |
| DRAG-6.26 | P1 | E028, E335, E338, E348, E349 | Phase 1 ID-bearing component/hooks prove cause text, a failed-column-save report with null item, simulated refresh, banner retention/expiry and no flash ID. These new mappings need approval. Missing: real failed-item and stale-pairs causes, top-edge banner over actual loading/reload, focus/announcement, click persistence, actual next pickup and computed three-quarter/fade lifecycle. Product rule is live; case stays Open. |
| DRAG-6.27 | P1 | E343, E344, E345, E346, E347 | Approved hooks now pin full post-draw window after slow load, expiry, later reload and direct clear. Missing: live board wiring/two pulses for all three causes, a new pickup during the playing window, row redraw/new-drag end not replaying, and hidden-item window starting at board draw. |
| DRAG-6.28 | P1 | **no test carrying ID** | No test carrying ID. Missing: reveal before F receiving only F-d versus reveal at/after F receiving none, for collapsed section/overflow/closed modal, with no substitute, automatic reveal or saved-placement change. |

#### DRAG-7

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-7.6 | P1 | E155, E162, E163, E164, E268, E419 (skipped), E425 (skipped), E427 (skipped) | Approved projection/placement units seed hidden own slots last and shown own slots at pickup. All three relevant re-entry surface declarations are skipped. Missing: continuous click-open modal pickup/exit/column/re-entry, hidden-last versus shown-own-slot writes, attached descendant retention, and column-detach alternative. |
| DRAG-7.9 | P0 | E415, E416 (skipped), E417, E418 | Reopened: three active surface tests cover R1's first child, own-gap no-write and over-cap no-write. The skipped second test alone covers R1's last child after R1a. Missing: that saved after-R1a placement with attachment/workphase retained; active first-child/identity/invalid tests cannot substitute for it. |
| DRAG-7.10 | P1 | E034, E231, E232, E284, E419 (skipped), E420, E421, E428, E458 (skipped) | Approved bounds/header units and active surfaces cover some modal detach, header containment and brief excursions. Missing: click/hold origins and column/expanded-sub-row matrix, distance exit, one pop with shortCard/bounds, exact Q/after release for attached and Free arrivals, and additional pop for Board/sibling sub-row. The hardcoded excursion timing needs deterministic clock treatment. |
| DRAG-7.12 | P2 | E418, E457 (skipped) | Active surface checks Valid/Depth-capped classifications only. Tier surface is skipped and has obsolete opacity expectations. Missing: rendered Full R/R1, Mid R1a, Low Y with independent configured content strength, unchanged pickup snapshot on opening and no target tier on static backdrop rows. |
| DRAG-7.13 | P1 | E160, E161, E311, E314, E439, E440, E441 | Clock/projection units and surfaces cover hold stages, early release and own-Stub B's last-child opening. The supposed X fixture is already P's Stub. Missing: Free Card zoomed in from outside P initiating the hold and the corresponding before-completion first/last-child releases, with a real visible cue and saved gap. |
| DRAG-7.14 | P1 | E312, E313, E315, E442, E443 (skipped), E444 | Approved clock tests reset gap/depth/exit; active surfaces cover gap/level reset and movement across the ghost's middle. Missing: title/padding continuation through dwell/cue to modal opening and actual whole-Card exit/reset/re-entry; skipped section-bound test encodes the superseded smaller bound. |
| DRAG-7.15 | P1 | E033, E169, E170, E171, E172, E173, E174, E243, E250, E251, E253, E254, E445, E446 (skipped), E447 (skipped), E448, E449 | Approved modal/projection/component tests plus active surfaces cover mapping and several approaches. Missing: from-above to below-overflow last-child outcome, with and without carried child (both skipped), a one-step arrival at each aim, and explicit carried-child absence/restoration throughout. The first-child active variant cannot replace last-child. |
| DRAG-7.17 | P2 | E245, E246, E247, E248, E455, E456 (skipped) | Approved geometry units and active surface cover long R children below-overflow, scrolled spot and last-child release. Missing: above-overflow case with many preceding sibling rows, correct scrolled first-child spot and release; that surface is skipped. Trace the historical intermittent full-run failure separately. |
| DRAG-7.18 | P2 | E458 (skipped) | Only a skipped test carries ID. Missing: live modal exit, column re-entry into P, second overflow hold reopening the modal in one drag, correct final gap/depth write and zero earlier writes. Rework its obsolete Card-layer assumptions before restoring. |
| DRAG-7.27 | P2 | E176, E177, E178, E471 (skipped) | Approved section units remove carried-owned overflow/branch rows and keep unrelated counts. The surface is skipped. Missing: live neighbor/gap after Q to T, whole-drag absence, saved B-next-sibling release with children retained and newly visible, Q/Free-P variants and cancel restoring 2 children. |
| DRAG-7.28 | P2 | E031, E433, E434 | Two active surfaces prove correct interactive Sheet, same modal geometry/hierarchy/no opening writes and drag suppression with projected gap/depth and saved parent. Missing: saved sibling order before R1a on the carried-row release. The active DRAG-7.9 first-child test supplies it but has no DRAG-7.28 stamp. |
| DRAG-7.31 | P1 | E165 | Approved projection unit now carries hidden-slot history into a modal reseed and produces no placement at original gap. Missing: actual exit/re-entry/reopen history, zero network request and saved original parent/position/workphase, plus modal staying open at the original slot. |
| DRAG-7.32 | P1 | E032, E435 (skipped) | The sole surface declaration is now skipped and counts for nothing. Approved component supplies Escape and own-X dismissal hold only. Missing active surface coverage of all three Sheet closes/backdrop layering, preserved list/depth/scroll and screen place, no writes, and next Escape closing the modal. The skipped body also lacks modal screen-place comparison. |

#### DRAG-8

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| DRAG-8.1 | P1 | E033, E036, E037, E038, E176, E177, E178, E322, E323, E324 | Approved hook/section/component tests remove supplied branch IDs, backdrop rows and owned overflow and restore after a supplied end. Missing: complete five-row branch absent across real gap/pop/zoom/modal switches from Stub and Free origins, unrelated rows retained and the original collapsed/expanded preference restored. |
| DRAG-8.2 | P1 | E179, E180, E181, E182, E322, E323, E324 | Approved branch units exclude Free-linked descendants/counts; hooks hold equivalent smaller branches. Missing: actual F/D Cards at Mid and F1/D1 Stubs at Low, exact +2 children/5 descendants excluding all four Free-linked rows, maintained through pop/zoom/modal. |
| DRAG-8.3 | P1 | E179, E180, E181, E182 | Approved branch selector counts pending placement membership. Missing: exact four held IDs and +2/+4 text with B/B1 outside, those four rows absent, and both responses landing mid-drag without recomputing membership/count across layer switches. |
| DRAG-8.4 | P1 | **no test carrying ID** | No test carrying ID. Missing: measured Z rise by five rows/spacing and removed overflow with no blank branch gap; correct neighbor/placement exclusion; Free pickup collapse and entry into Q adding exactly one ghost row without branch reservation. |
| DRAG-8.5 | P1 | E036, E037, E038 | Approved components restore supplied branch after session removal at original fixture. Missing: actual release into Q restoring full branch immediately before answer, old-location absence, copy/line gone and successful response retaining exact hierarchy in section/modal. |
| DRAG-8.6 | P1 | E036, E037, E038 | Approved components show rows again with no session. Missing: actual cancel at changed gap/Card with no write, original or earlier-pending placement/marker restored, copy/line gone and list preferences preserved. |
| DRAG-8.7 | P1 | **no test carrying ID** | No test carrying ID. Missing: resync into different Q ending drag/no write and restoring reloaded branch membership/location rather than pickup snapshot, with copy/line gone and no automatic section/modal opening. |
| DRAG-8.8 | P1 | E022, E023, E024, E039, E040, E041, E179, E180, E181, E182, E322, E323, E324, E371, E372, E373, E374 | Approved branch/wording/component/hook tests supply many count variants and hidden-depth inclusion. Missing: end-to-end exact board count table for actual Card and Stub pickups, sectionLevels+1 chain counting the hidden last row, and modal opening preserving count and excluding X. Sidebar TREE-2.9's whole mapping is not a board mapping. |
| DRAG-8.9 | P1 | E039, E040, E041 | Approved components show copy-only lines in supplied Stub/shortCard forms. Missing: uninterrupted Card/Stub-origin transitions through zoom/modal/pop/Board/re-entry, same exact counts and line rotating with shortCard, with no ghost line throughout. |
| DRAG-8.10 | P1 | E025, E042, E043 | Approved structural components set absolute nonpointer line outside copy flow. Missing: measured fixed box/ghost equality with/without branch in both forms, equal band reservations/neighbors/clamps, one-row line geometry/occlusion and actual pointer reaching covered gaps/rows including bottom-bound overflow. |
| DRAG-8.11 | P1 | **no test carrying ID** | No test carrying ID. Missing: own-gap no-write keeping original parent/position, branch returning immediately and copy/line ending, including earlier pending preview/marker restoration. |
| DRAG-8.12 | P1 | **no test carrying ID** | No test carrying ID. Missing: deepest-descendant over-cap release with zero request, original fields and branch restored/no branch at invalid preview, copy/line ended, and earlier pending preview/marker retained. |

#### TREE-1

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| TREE-1.2 | P0 | E085, E086, E087 | Approved hook tests pin four concrete move relations, clamping and the one-state parent/child gap. Missing: actual ghost drawn at each depth with its line following the top edge in both gaps, and saved outcomes through the surface. Callback arguments alone do not draw the line. |
| TREE-1.4 | P2 | E091, E092, E389, E504 (skipped) | Approved hook/pure hierarchy tests offer only top-level, no line and no callback for an empty candidate tree. Surface is skipped and still aims at absent descendants. Missing: real branch absence, ghost staying at pickup and no line/gap anywhere while moved, with zero request on release. |
| TREE-1.5 | P1 | E054, E055, E093, E094, E095, E390, E391 | Approved hook/pure helpers count collapsed T once and use real first child T1 for the two move relations. Missing: painted own-row ghost/line in that gap and the two persisted placements through the sidebar surface. |
| TREE-1.6 | P1 | E096, E097, E098 | Approved hook tests exclude X1/X2 and compute own-gap depths and parent-A callback. Missing: actual line on ghost's top edge, branch absence through that gesture and saved X under A with descendant parent links retained. |
| TREE-1.8 | P1 | E099, E100, E101, E102, E103, E506 | Active surface now checks ghost leaving/returning and complete unchanged saved row with zero observed writes for moved and unmoved set-downs. Missing: observation that the line moves with the ghost; the title and ghost metadata do not assert line placement. A same-ID stamp on existing line/return evidence could close it after review. |
| TREE-1.10 | P2 | E105 | Approved hook checks own-gap depth0/1, clamp past right and B-first-child callback. Missing: drawn ghost and top-edge line in that gap/depth plus persisted B-child outcome. |
| TREE-1.11 | P1 | E106, E107, E505 | Surface and hook verify offered invalid/valid states, visible line/copy invalid marker, no write and accepted boundary parent/position. Missing: line riding the ghost's top edge at both depths; margin/line presence alone do not assert that edge. Existing approved line component could be stamped for this clause. |
| TREE-1.12 | P1 | E503 | Surface proves exact parent/neighbor/no-position requests and both saved orders. Missing: line following the ghost's top edge during those placements. Existing line component candidates carry other IDs only. |
| TREE-1.13 | P2 | **no test carrying ID** | No test carrying ID. Missing: pinned over-cap source tree with H>=PCAP showing top-level invalid line and copy/no request/unchanged M, versus H=PCAP-1 valid save after B. This is a concrete cap-boundary test, not a Manual candidate. |
| TREE-1.14 | P0 | E011, E117, E136 | Approved hook tests preserve pickup branch through edit/create, draw new Y and hide it at next pickup. App refusal preservation is still a new mapping needing approval. Missing: reachable after-Y/deeper state and actual request/400 for both edit and create, with successful saved edit/create and both positions retained; next-pickup exclusion. The recorded placement defect remains accepted Story 10 work. |
| TREE-1.15 | P1 | E117, E137, E138 | Approved hooks check edit/create growth holding old height, next-pickup invalidity and shrink holding old branch/height before next valid callback. Missing: actual over-cap 400 and preserved saved X/Y positions, successful shrink's persisted legal save and real response composition. The App cycle-refusal test is not this near-cap scenario. |
| TREE-1.16 | P1 | E108, E109, E110, E111, E112, E139, E140 | Approved hooks now cover edit-out and earlier refused-move/read inputs, held exclusion, end restoration and next-pickup relation. Missing: actual saved edit/refusal/read composition and persisted later sibling placement under B; callbacks/rerendered rows are not server write/read outcomes. |
| TREE-1.17 | P1 | E047, E048, E049, E050, E051, E052, E053, E121, E122, E123 | Approved pure/hook evidence pins all five slots, unique gaps and no row-half split. Missing: actual painted ghost/row order and saved release at the shown depth for the stated nearest rows. Repeated supplied nearest-row inputs do not establish live shuffle. |
| TREE-1.18 | P1 | E047, E048, E049, E050, E051, E052, E053, E124, E125 | Approved pure/hook tests count A/T/X/B only and use hidden real T1 for tab-right placement. Missing: real collapsed/branch-absent rendered list with each nearest-row ghost gap, no hidden-child slot and saved placement before T1. |
| TREE-1.19 | P1 | **no test carrying ID** | No test carrying ID. Missing: physical shuffle under a still cursor near A and D settling the prescribed end gaps without alternation. Unstamped same-nearest-row pure/hook tests are partial candidates only. |

#### TREE-2

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| TREE-2.1 | P2 | E056, E113, E114, E126, E127, E365, E508 (skipped) | Approved hook/component/walk tests pin tiers, branch exclusion, ghost state and clearing on release/cancel. Surface is skipped with obsolete descendant-dimming expectations. Missing: measured B shift/no blank space, actual named ghost opacity/full unrelated rows and branch/strength restoration respecting collapse through live movement/end. |
| TREE-2.2 | P2 | E509, E510 | Both active surface variants check final child-drop expansion and sibling-drop collapse. Missing: held successful answer proving T opens at release with X/T1/T2 before that answer, rather than only after it. |
| TREE-2.3 | P2 | E511 | Surface proves final refused move leaves T expanded and X top-level. Missing: unanswered interval showing T opens at release, and immediate rollback before the subsequent tree read; TREE-4.8's approved rollback tests lack this ID/collapsed-T fixture. |
| TREE-2.4 | P1 | E115, E141, E363, E364, E365 | Approved full-chain hook tests cover cap boundaries at several caps, hidden X1 and separate ghost variables. Missing: actual computed projectAnchorOpacity/projectNeitherOpacity/ghost values, opacity-only/no added relationship color and all unrelated rows retained on the sidebar. |
| TREE-2.5 | P1 | E142, E143, E360, E361, E362 | Approved walk/hook tests correctly separate root-fit boundary (top-level Mid, nested Low) from already-too-tall (all Low). Missing: rendered configured Mid/Low strengths and separate ghost strength for both fixtures. |
| TREE-2.6 | P1 | E116, E144 | Approved hook tests use saved P-under-Q rerender, hold Full/Mid/Low snapshot, clear on cancel and take P as Mid next pickup. Missing: actual sidebar applying P's new drawn depth while retaining computed Full strength during current drag, then rendered Mid on next pickup. |
| TREE-2.7 | P1 | E057 | Approved component keeps line outside dimmed wrapper. Missing: computed Full top-edge line versus Mid S and ghost strength, plus valid shallower placement after Low P_CAP saving X after P1/before B with X1 retained. |
| TREE-2.8 | P1 | E056, E118, E119, E120 | Approved hook/component tests read independent configured sidebar values and ghost class. Missing: sidebar list wiring/computed strengths with distinct Low/ghost values and reciprocal rendered board/sidebar independence after each surface's configuration changes. |
| TREE-2.10 | P1 | E062, E064 | Approved component renders an absolute pointer-free copy-only count line and no ghost line. Missing: measured one-row box equal to leaf, one-row line covering B without widening/reserving another row or changing drag resolution, and actual pointer reach-through. |
| TREE-2.11 | P2 | **no test carrying ID** | No test carrying ID. Missing: narrow width clipping without wrap/widening, full text at sufficient width and identical underlying branch counts at both. |
| TREE-2.12 | P1 | E008, E128, E129 | Approved hook evidence restores branch/ends copy across all end modes; App release preview is a separate mapping proposal. Missing: actual full branch/line through release/cancel/own-gap/invalid release, persisted parent/position/no writes and pending-before-answer Q tree retaining links and collapse preference. Mocked valid callback does not itself apply the new tree. |
| TREE-2.13 | P1 | E058, E059, E060, E061, E130, E131, E132, E133 | Approved hook/component evidence covers onset, depth values and structural line placement/full-strength isolation. Missing: actual pixel top-edge/name-column alignment through live all-gap/four-depth gesture, plus no-line empty hierarchy after movement. |
| TREE-2.14 | P2 | **no test carrying ID** | No test carrying ID. Missing: held create adding Y after pickup, actual untiered opacity1 for the rest of that drag, fixed existing T/M/L Full/Mid/Low, Y still a placement candidate/outside branch, cancel with zero move and unchanged T parent, then Y Mid at next pickup. Existing TREE-2.6 late-row unit is a partial unstamped candidate, not a ruling or complete fixture. |

#### TREE-4

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| TREE-4.7 | P1 | E523, E524, E525 | Active surface variants show final drag/create/edit orders and drag reload. Missing: held drag answer proving A/B/X immediately at release before it arrives; final post-answer order cannot establish that interval. |
| TREE-4.9 | P1 | E004 | ID-bearing App scenario draws exact A/A1/X/X1/A2/B before answer and preserves it across captured success renders; its mapping still needs approval. Missing: reload of this same between-siblings branch fixture retaining hierarchy/order; another case's last-child reload is not interchangeable. |
| TREE-4.11 | P1 | E134, E135 | Approved hook consumes supplied pending move and counts branch/height/tier correctly. Missing: actual prior release to pending state followed by second pickup before its answer, with hidden X/X1 and rendered +1 child/2 descendants and cap-boundary strengths. |
| TREE-4.15 | P1 | **no test carrying ID** | No test carrying ID. Missing: both successful create and subtree delete surviving an older initial or refresh read at every render, exact retained C/N position2 or absent P/C, no row under deleted P and unchanged Q. Existing TREE-4.14 tests cover rename/move only; the unstamped read-after-delete App scenario covers a different concurrent Q move. |

#### TREE-11

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| TREE-11.7 | P2 | E009, E518 | Surface now explicitly observes ordinary renamed child hidden, same-parent edit and P rename preserving collapse. ID-bearing App candidate checks a queued rename leaves the collapse set, but mapping is unapproved. Missing: requested-before-move-answer fixture with existing C, both C/X hidden after rename, saved parent/new name, and explicit unchanged-parent edit equivalent. Approving the current single collapse-set assertion alone would not close the case. |

#### Additional scoped cases

| Case | Priority | Current ID-bearing tests | Covered portion and precise missing Then |
|---|---|---|---|
| BCU-5.6 | P1 | **no test carrying ID** | No test carrying ID. D11 hook candidate proves unknown P/C/G stops raising the attention predicate when P's answer lands; cascade unit changes attached descendants' workphases. Missing: actual initial exact invalidItems/uncovered/needsAttention, expanded Unsorted hierarchy/badge; filing through UI with no reload, W1 column and retained attachment tree, all three workphases and fresh board empty invalidItems/uncovered. Candidates require stamps and internal approval if used. |
| BCU-5.7 | P1 | **no test carrying ID** | No test carrying ID. D11 cascade boundary candidate leaves detached F/attached FG in their original known todo workphase. Missing: the actual all-Unknown fixture with P/A entering W1, D Free in Unsorted and D1 beneath it, both still no workphase, badge remaining without reload, exact fresh board invalidItems D/D1 and empty uncovered, retained D.parentId=P. Existing candidate proves the walk stops but not this Unknown-attention boundary. |
| ATT-4.9 | P0 | **no test carrying ID** | No test carrying ID. Existing target-classification surface is a candidate for extension. Missing: exhaustively enumerate every visible Card/Stub item target, reset the same starting state for each attached-parent API replay with no workphase/anchor, accepted Valid inheritance versus refused Cycle/Depth-capped unchanged M/subtree; do not replay overflow/non-target controls. |
| TC-6.4 | P0 | E493 | Reopened: surface now creates D1/D2/D3 then establishes distinct completion times in D2/D3/D1 order and checks that rendered order. Missing: all three saved positions explicitly absent. The completion-tie clause delegates to TC-6.10, so no duplicate tie case is demanded here; the existing ID test does not cover the no-position clause. |
| TREE-9.4 | P0 | E067, E068, E069 | Approved collection tests cover late P/C answers and new-child response suppression without new writes. Missing/counterfixture: for X whose move into P or C was already saved before deletion, the mocked post-delete list still retains X top-level and expects it to survive. It therefore does not establish X's deletion/continued absence. Several-answer variants cover P/C only and do not explicitly recheck Q/no extra writes after each answer. No real fresh read of the saved moved-in subtree is exercised. |

### Automated cases: whole-case decisions

These 89 cases have counting evidence for the whole case, individually or collectively under the stated abstraction/approval. Existing approvals permit the identified internal rule to be tested at that layer; they do not certify unasserted visual clauses. New partial proposals do not appear on Automation lines.

| Case | Before → after | Current ID-bearing tests | Behavioral assessment |
|---|---|---|---|
| DRAG-1.4 | Automated → Automated | E255, E288, E290, E291 | Parameterized clock assertions reset on changed Card/side and retain the locked column until full hold; approved placement assertion keeps the anchor relation and workphase. |
| DRAG-1.7 | Automated → Automated | E187, E228, E293 | Approved classifier, region-gate and pop-machine abstractions collectively exclude a Cycle-forming zoom target while leaving the locked column's named relation available. |
| DRAG-1.8 | Automated → Automated | E187, E228, E293 | The same approved abstractions reject a Depth-capped context per drag rather than globally; legal targets in the same cap fixture remain valid. |
| DRAG-1.10 | Automated → Automated | E226, E227, E233, E234, E235 | Existing approved geometry mapping clips partially visible sub-rows and removes wholly invisible ones, including DOMRect getter fields; no new surface approval is inferred. |
| DRAG-1.11 | Automated → Automated | E305, E306, E307, E308, E309, E310 | Clock tests independently pin region-time accumulation, top/bottom non-entry, entry from middle after elapsed time, leave/return reset and start at pop-out. |
| DRAG-1.19 | Automated → Automated | E302, E303, E304 | Both origins and context shapes check the ordered two-parent trace in one sample, final Board/shortCard, and one-pop-only resting/near-bound alternatives, including zero clocks. |
| DRAG-1.23 | Automated → Automated | E481, E482, E494 | Surface tests cover first and last one-neighbor slots and an empty destination preserving the kept position; anchored writes and bare empty move are distinguished by outcomes. |
| DRAG-1.25 | Automated → Automated | E229, E230, E280, E281, E282, E283 | Approved measured-structure fixtures distinguish content and merged outer body; parameterized clock samples hold below content but inside body, and leave the actual outer bound. |
| DRAG-1.30 | Automated → Automated | E274, E275, E276, E277 | Clock assertions pin leaving time, return reset and uninterrupted time while moving between foreign points; no tuned value is used as a pass oracle. |
| DRAG-1.37 | Automated → Automated | E298, E299, E300, E301, E326, E327 | Pure machine and approved live-hook tests settle a zero-clock cycle in K, complete the sample with usable drag/no move, and allow a later inside-P sample to enter, for both context forms. |
| DRAG-2.1 | Automated → Automated | E188, E491 | Surface classifies unrelated legal targets Valid at pickup against the API-provided cap. |
| DRAG-2.2 | Automated → Automated | E189, E491 | Surface covers the carried item, Free descendant and that descendant's attached Stub as Cycle-forming, while the carried attached branch is absent. |
| DRAG-2.3 | Automated → Automated | E195, E491 | Surface constructs cap-edge targets using a subtree with a detached branch; exactly-at-cap is Valid and next depth is Depth-capped. |
| DRAG-2.7 | Automated → Automated | E196, E491 | The visible chain includes individual Stub targets on both sides of the cap boundary, without a Stub-wide exclusion. |
| DRAG-2.9 | Automated → Automated | E197 | Existing approved classifier mapping makes the deep descendant Cycle-forming despite also exceeding the cap. |
| DRAG-2.10 | Automated → Automated | E397, E491 | Board route exposes the enforced item cap and checks accepted/refused boundaries; classification surface uses that returned cap for its equivalent boundaries. |
| DRAG-2.11 | Automated → Automated | E318, E321 | Approved pickup hook combines pending-parent depth and retained detach parent; cap boundaries distinguish the proposed tree from the old saved parent links. |
| DRAG-3.1 | Automated → Automated | E209, E214, E474 | Top-band surface release previews/saves before the first visible target in the receiving workphase; route arithmetic consequences are delegated. |
| DRAG-3.2 | Automated → Automated | E209, E214, E474, E480 | Bottom-band surface release saves after the last target and still resolves as a band while popped out. |
| DRAG-3.3 | Automated → Automated | E213, E477 | Surface middle-band release ignores the hovered Card, takes receiving workphase, retains 2.5 and saves ABXC. |
| DRAG-3.4 | Automated → Automated | E478 | Surface reaches destination lock after the hold and then releases in-context to the ghost's anchor slot rather than the old Board band. |
| DRAG-3.5 | Automated → Automated | E183, E184, E186 | Existing approved pure mapping checks independently calculated divider positions, band sides, metric variation and exact (h+gap)/2 reservation. |
| DRAG-3.6 | Automated → Automated | E209, E484 | Surface merged outsider drop takes the range entry workphase and first rendered slot. |
| DRAG-3.7 | Automated → Automated | E212, E257, E484 | Surface covered-member drop retains the non-entry workphase and reorders; pure placement support agrees. |
| DRAG-3.8 | Automated → Automated | E485 | Surface targets Review's actual expanded sub-row at its first/last ends and reads exact Review workphase and corresponding saved workflow order. |
| DRAG-3.15 | Automated → Automated | E185, E287 | Existing approved metric/clock tests preserve a middle band with one card and recompute the exception when live count changes. |
| DRAG-3.21 | Automated → Automated | E286, E287 | Approved clock sampling moves content rect and card count under a fixed pointer and reads the new band immediately. |
| DRAG-4.9 | Automated → Automated | E167, E380, E381, E382, E383 | Existing approved hierarchy/projection mappings resolve concrete Top and Top+1 parents/anchors, including first-child fallback. |
| DRAG-4.10 | Automated → Automated | E380, E381, E382, E383 | Existing approved hierarchy mapping walks ancestors to the stated depth1/depth0 parent and after-subtree anchors. |
| DRAG-4.11 | Automated → Automated | E377, E378, E379, E384, E385, E386, E387, E388, E389, E395, E396 | Approved hierarchy boundary tests pin top, bottom, empty, clamp and root floor with independent literal parent/anchor outcomes. |
| DRAG-4.18 | Automated → Automated | E150, E168, E393, E394 | Approved hierarchy/projection tests offer invalid depth without producing release placement, retain valid shallower alternatives and exclude the full dragged subtree. |
| DRAG-4.23 | Automated → Automated | E201, E292 | Approved named-neighbor and clock abstractions produce no anchor/candidate when alone; no zoom clock can run for a missing named Card. |
| DRAG-4.29 | Automated → Automated | E166 | Approved release-projection mapping returns no placement at own gap/depth initially and after leaving/returning, while another depth yields a write. |
| DRAG-5.5 | Automated → Automated | E219, E295 | Approved parameterized clock resets a brief whole-Card excursion; approved request mapping emits only sibling anchor/side with original parent attachment retained. |
| DRAG-6.1 | Automated → Automated | E241, E488 | Surface pending picture plus approved request/reconciliation integration retain ordinal placement and unchanged stored position before answer for top/bottom anchor requests. |
| DRAG-6.2 | Automated → Automated | E242, E488 | Surface pending marker and approved reconciliation test retain X's numeric position and pending relation while another row's answer re-sorts the list. |
| DRAG-6.4 | Automated → Automated | E239 | Approved reconciliation mapping applies the contrary saved number, removes preview/marker and immediately orders X after E without adjusting positions. |
| DRAG-6.5 | Automated → Automated | E489 | Surface holds the first answer, re-drags and settles the second first, then observes the older answer not undoing the saved second slot. |
| DRAG-6.6 | Automated → Automated | E223, E490 | Surface refuses the drop with a server location deliberately different from pickup/drop, observes reload and that location without pending preview. |
| DRAG-6.10 | Automated → Automated | E238, E259 | Approved pure list/placement mappings choose last for no comparable position and preserve ordinary positioned ordering. |
| DRAG-6.11 | Automated → Automated | E236 | Approved list mapping places a missing completion last and retains it once stamped later than both existing completions. |
| DRAG-6.12 | Automated → Automated | E269, E270, E271 | Approved placement mapping seeds a newly Free Stub at last and then accepts a real column anchor exactly as a Card; Board preview remains Free. |
| DRAG-6.13 | Automated → Automated | E260, E261, E262, E263, E264, E265 | Approved prior-placement tests preserve earlier pending relation at re-pickup, with contrasting destination/workphase/parent cases. |
| DRAG-6.29 | Automated → Automated | E350, E351, E352, E353, E354, E355, E356, E357, E358, E359 | Approved live collection hook exercises both cross-row reindex fixtures in both answer orders, plus inline-create and Sheet answers, retaining newer positions and applicable older fields. |
| DRAG-7.1 | Automated → Automated | E460, E461, E462, E467 | Four surfaces assert section-relative levels, correct shown IDs/overflow ownership, nested hidden rows, detached Card origin and increased-level placement behavior. |
| DRAG-7.2 | Automated → Automated | E175, E425 (skipped), E426 (skipped), E460, E461, E463, E464 | Surface count/pluralization/Free exclusion and released-child count are complemented by the already approved count logic, now in descendantsSection.test.ts, excluding a dragged child and removing sole-child overflow. |
| DRAG-7.3 | Automated → Automated | E156, E463 | Surface offers the single first-child state with offset clamps, saves before R1 and then hides X behind the 3-child overflow count. |
| DRAG-7.4 | Automated → Automated | E157, E158, E464, E465, E468 | Surfaces exercise last-child, next-sibling and shallow ancestor states with clamping and saved positions across hidden children. |
| DRAG-7.5 | Automated → Automated | E159, E466 | Surface saves T's first attached child, leaves G Free under T and renders the new 1-child overflow with X hidden. |
| DRAG-7.7 | Automated → Automated | E412, E413 | Surfaces compare full row identities/order/indents, Free exclusions, centered box/no writes and every overflow control opening the same hierarchy. |
| DRAG-7.8 | Automated → Automated | E414 | Surface exercises modal X, outside click and Escape without Sheet/drag, then checks unchanged section/count and zero writes. |
| DRAG-7.11 | Automated → Automated | E285, E419 (skipped), E422 | Surface proves only modal region/rows place the drag and carried painted bounds stay in its list; standing clock-category test completes the outside pop-out clock behind backdrop. |
| DRAG-7.16 | Automated → Automated | E244, E252, E452, E453, E454 | Approved geometry maps every edge, while surfaces at bottom/top/right compare painted placement with independent parent/anchor outcomes and save without another move. |
| DRAG-7.19 | Automated → Automated | E417, E423, E424, E445 | Surfaces retain modal box through pending/settled release, own-gap no-write and Escape, check the exact saved/nested row and allow another pickup. |
| DRAG-7.21 | Automated → Automated | E161, E459 | Surface outwaits supplied thresholds at both invalid overflow gaps and the legal shallower level, sees no cue/modal and observes no requests. |
| DRAG-7.22 | Automated → Automated | E469 | Surface moves a count press beyond activation distance yet sees no drag/copy/write; click opens modal with Sheet closed. |
| DRAG-7.23 | Automated → Automated | E429, E430 | Surfaces force refused modal release and mid-drag resync, restore server hierarchy, keep modal open and exclude interrupted release writes. |
| DRAG-7.24 | Automated → Automated | E470 | Surface identifies Card P as the carried overlay from overflow indent and opens P's Sheet by click, with no modal or write. |
| DRAG-7.25 | Automated → Automated | E030, E249, E429, E450, E451 | Surfaces begin genuinely off-center from a hold, then after failed-release or mid-drag reload assert centered modal; click-open reload also remains centered. |
| DRAG-7.26 | Automated → Automated | E431, E432 | Surface deletion and detachment fixtures reload into no Card or no attached hierarchy and observe automatic close; nonempty reload stays open in the companion mapped case. |
| DRAG-7.29 | Automated → Automated | E472, E473 | Both overflow-neighbor surface aims assert the line's owner and first/last-child saved placement, never an overflow-as-parent relation. |
| DRAG-7.33 | Open → Automated | E436 | Promoted: active child-only surface follows R to R1 to R1a, asserts one foreground Sheet identity, unchanged modal box/hierarchy/scroll at each replacement, return to modal and zero writes. |
| DRAG-7.34 | Automated → Automated | E437 | Surface renames the real Sheet item while modal stays open, verifies changed row title with unchanged IDs/indents/unrelated rows and stored child links, then updated dismissal snapshot. |
| DRAG-7.35 | Automated → Automated | E438 | All three Sheet dismissals follow automatic empty-modal close before dismissal, leaving Sheet interactive and board without a reopened modal; only one detach write is observed. |
| TC-2.6 | Automated → Automated | E399 | Revised active-workphase fixture is explicit: true last is 4.2 in a different active phase and no-anchor top-level create returns 5. |
| TC-2.16 | Automated → Automated | E398 | Revised Free-only reading is matched by a top-level stranded item after workphase deletion; API read returns none. Attached-child contrast is delegated to TC-2.13. |
| TC-2.17 | Automated → Automated | E400 | Test explicitly pins the parentless true-flag database state and reads workflow scope; it does not claim a normal API write can produce it. |
| TREE-1.1 | Automated → Automated | E060, E061, E080, E081, E082, E083, E084, E501, E502 | Surface painted shuffle, exact ghost placement/save and last-crossing release/reload combine with existing approved top-edge/full-strength line component assertions. |
| TREE-1.3 | Automated → Automated | E088, E089, E090, E369 | Existing approved hook/pure mapping pins top/bottom concrete placements and both clamps with top-level floor. |
| TREE-1.9 | Automated → Automated | E060, E061, E104, E507 | Surface leaves and returns to own gap with no write/unchanged saved row; existing approved line component supplies top-edge/full-strength line. |
| TREE-11.1 | Automated → Automated | E512 | Surface shows loaded expanded hierarchy and new project's first child/grandchild without hand opening, with Collapse controls once parents gain children. |
| TREE-11.2 | Open → Automated | E500, E513 | Promoted: current surface explicitly checks C/G hidden on collapse, unrelated Q1 visible, unchanged saved rows, same reopened order and both collapses discarded by reload. |
| TREE-11.3 | Automated → Automated | E514 | Surface holds actual successful creates through both entry points, explicitly observes hidden unanswered rows, then parent opening/correct saved child and unrelated collapsed Q. |
| TREE-11.4 | Open → Automated | E515 | Promoted: both real create entry points hold/refuse; C and candidate N are explicitly absent while unanswered and after failure, P stays collapsed and saved list contains only C/P. |
| TREE-11.5 | Automated → Automated | E010, E516 | Surface holds actual parent edit, observes collapsed/hidden interval then C/X after opening, correct saved parent and unrelated Q still collapsed. |
| TREE-11.6 | Open → Automated | E517 | Promoted: surface explicitly observes C absent during/after held refusal, retains exact saved X row/top-level place, and opening P shows only C there. |
| TREE-11.8 | Open → Automated | E519 | Promoted against current text: top-level create and removal of X's parent leave P/Q collapsed, X becomes saved top-level; P2 keeps the old-parent collapse assertion nonvacuous. New N's initial expansion belongs to TREE-11.1. |
| TREE-2.9 | Automated → Automated | E022, E023, E024, E062, E063, E065, E066, E108, E109, E110, E111, E112, E145, E146, E147, E371, E372, E373, E374 | Existing approved hook reads all real/hidden descendants and held membership through movement; component independently renders all specified count strings and no-line case. |
| TREE-4.1 | Automated → Automated | E404 | Route distinguishes resulting sibling scope from top-level values, reindexes only target siblings and leaves outside projects unchanged. |
| TREE-4.2 | Automated → Automated | E401 | Route deliberately pins equal positions and distinct creation values plus null position and returns N/C/B/A. |
| TREE-4.3 | Automated → Automated | E520 | Surface pins both child/top-level positions and creation times and observes C/B/A in each group. |
| TREE-4.4 | Automated → Automated | E522 | Surface pins N null against positive child values and observes P/N/A/B. |
| TREE-4.5 | Automated → Automated | E402 | Route checks exact moved-inclusive pair shapes by ID, written position equality and quiet no-disclosure append. |
| TREE-4.6 | Automated → Automated | E403 | Route independently resets create/edit fixtures and checks the full target-sibling disclosure for each. |
| TREE-4.8 | Automated → Automated | E002, E003, E521 | Surface covers all three failure entry points; approved App tests hold or fail recovery read and assert immediate rollback after the move refusal. |
| TREE-4.10 | Automated → Automated | E005, E006, E007 | Approved App tests retain exact simultaneous previewed child lists through both success answer orders and both refusal timings without undoing the independent saved move. |
| TREE-4.12 | Automated → Automated | E001, E044, E045, E046, E366, E367, E368 | Approved App and pure ordering tests distinguish slot preview from numbers, exact parent/neighbor request without position, authoritative 15 answer and unchanged other positions/tree. |
| TREE-4.13 | Automated → Automated | E070, E071, E072 | Approved collection tests keep newer X/Q/5 while applying older Y/R pairs, inspect captured render order and verify opposite written-row/pair currency. |
| TREE-4.14 | Automated → Automated | E073, E074, E075, E076, E077, E078, E079 | Approved collection tests cover older first/read refresh after rename/move and captured render history, including unchanged Q name/parent/position in rename fixture. |

### Manual cases retained

No Manual case is restamped or reclassified. None has an active or skipped ID-bearing test.

| Case | Priority | Existing reason |
|---|---|---|
| DRAG-1.29 | P2 | none — manual: judged by feel, and its length is a tunable value (`popSnapMs`). |
| DRAG-1.32 | P1 | none — manual: judged by feel against the tuned values. |
| DRAG-4.24 | P2 | none — manual: judged by feel. |
| DRAG-4.25 | P1 | none — manual: judged by feel against the tuned values. |
| DRAG-7.20 | P2 | none — manual: feel, whose pass depends on the tuned values of the modal hold's dwell and cue |

### File keys

These keys are exact repository-relative paths, not additional mapping approvals.

| Key | File |
|---|---|
| F01 | `client/src/App.pendingMove.test.tsx` |
| F02 | `client/src/components/ForcedStopCue.test.tsx` |
| F03 | `client/src/components/HierarchyModal.test.tsx` |
| F04 | `client/src/components/KanbanCard.test.tsx` |
| F05 | `client/src/components/dragChrome.test.tsx` |
| F06 | `client/src/components/sidebar/SortableProjectRow.test.tsx` |
| F07 | `client/src/components/sidebar/projectTreeUtils.test.ts` |
| F08 | `client/src/components/sidebar/useProjectCollection.test.ts` |
| F09 | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| F10 | `client/src/components/workflow/descendantsProjection.test.ts` |
| F11 | `client/src/components/workflow/descendantsSection.test.ts` |
| F12 | `client/src/components/workflow/dragBands.test.ts` |
| F13 | `client/src/components/workflow/dragClassification.test.ts` |
| F14 | `client/src/components/workflow/dragCollision.test.ts` |
| F15 | `client/src/components/workflow/dragOverlayGeometry.test.ts` |
| F16 | `client/src/components/workflow/dragRegions.test.ts` |
| F17 | `client/src/components/workflow/dragRequest.test.ts` |
| F18 | `client/src/components/workflow/dragStructure.test.ts` |
| F19 | `client/src/components/workflow/itemListOps.test.ts` |
| F20 | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| F21 | `client/src/components/workflow/modalPlacement.test.ts` |
| F22 | `client/src/components/workflow/placement.test.ts` |
| F23 | `client/src/components/workflow/popSession.test.ts` |
| F24 | `client/src/components/workflow/useBoardDnd.test.ts` |
| F25 | `client/src/components/workflow/useForcedStop.test.ts` |
| F26 | `client/src/components/workflow/useItemManagement.test.ts` |
| F27 | `client/src/lib/dragTargets.test.ts` |
| F28 | `client/src/lib/hierarchy.test.ts` |
| F29 | `client/src/lib/hierarchyPlacement.test.ts` |
| F30 | `server/tests/routes/boards.test.ts` |
| F31 | `server/tests/routes/items.positioning.test.ts` |
| F32 | `server/tests/routes/projects.test.ts` |
| F33 | `tests/ui/drag-5-stub-detach.spec.ts` |
| F34 | `tests/ui/drag-7-hierarchy-modal.spec.ts` |
| F35 | `tests/ui/drag-7-modal-hold.spec.ts` |
| F36 | `tests/ui/drag-7-overflow-row.spec.ts` |
| F37 | `tests/ui/drag-column-bands.spec.ts` |
| F38 | `tests/ui/drag-target-classification.spec.ts` |
| F39 | `tests/ui/item-positioning.spec.ts` |
| F40 | `tests/ui/item-repositioning-cross-column-dnd.spec.ts` |
| F41 | `tests/ui/item-repositioning-cross-project-dnd.spec.ts` |
| F42 | `tests/ui/project-sidebar.spec.ts` |
| F43 | `tests/ui/project-tree-drag.spec.ts` |
| F44 | `tests/ui/project-tree-expansion.spec.ts` |
| F45 | `tests/ui/project-tree-sidebar.spec.ts` |

### Current test evidence register

All 525 scoped ID-bearing source declarations are listed, rather than counting parameterized executions. The title shown is the literal leaf title preceded by each ID-bearing enclosing describe. **Internal evidence** in this register means “inspected”; authorization and complete-Then coverage are decided in the case tables and approval section. No assertion or application source excerpts are reproduced.

| Key | File | State | Exact title, with inherited describe where needed |
|---|---|---|---|
| E001 | F01 | active; internal | `TREE-4.12: a drawn move changes order by slot without computing any position` |
| E002 | F01 | active; internal | `TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt > puts X back as soon as the move fails, without waiting for the read of the tree` |
| E003 | F01 | active; internal | `TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt > leaves X restored rather than retaining the refused placement when the read fails too` |
| E004 | F01 | active; internal | `TREE-4.9: a release draws the move and its branch at once, and success keeps that placement > draws X between A1 and A2 under A, with X1 beneath it, before the answer, and a success leaves it` |
| E005 | F01 | active; internal | `TREE-4.10: moves released one after another settle independently by their own answers > keeps the other move drawn while its answer is out, whichever answers first (%s)` |
| E006 | F01 | active; internal | `TREE-4.10: moves released one after another settle independently by their own answers > puts X back when it fails while Y is unanswered, and Y stays there when it then succeeds` |
| E007 | F01 | active; internal | `TREE-4.10: moves released one after another settle independently by their own answers > keeps Y’s saved placement through X’s rollback and the read that follows it, when Y succeeds first` |
| E008 | F01 | active; internal | `TREE-2.12: every end of the drag draws the branch again under the project > draws X and its branch under Q at the release, before the answer, and a success leaves that tree` |
| E009 | F01 | active; internal | `TREE-11.7: leaves P collapsed when the user collapses it before the rename is answered` |
| E010 | F01 | active; internal | `TREE-11.5: still opens the parent for an edit that does put the project under it` |
| E011 | F01 | active; internal | `TREE-1.14: a move refused after an earlier edit landed leaves that edit > returns X to its top-level place with Y still its child, each at its saved position` |
| E012 | F05 | active; internal | `DRAG-2.15, DRAG-2.16: draws an anchor-only target and a target that is not even an anchor at their own strengths` |
| E013 | F05 | active; internal | `DRAG-2.21: draws the tier on the content and never on the root` |
| E014 | F05 | active; internal | `DRAG-2.14, DRAG-2.20: draws a legal parent, the carried copy and a row with no drag at full strength` |
| E015 | F05 | active; internal | `DRAG-2.20: draws the dragged row at the ghost's own strength on its root, and at no tier` |
| E016 | F05 | active; internal | `DRAG-2.18: draws an overflow row by its owner: a legal parent in full, anything else as neither` |
| E017 | F05 | active; internal | `DRAG-6.23, DRAG-6.24: pulses a pending row's content, which keeps its tier, and not its root` |
| E018 | F05 | active; internal | `DRAG-2.21: a Stub row's tier is on a wrapper around its button, and not on the row, which holds the drop line` |
| E019 | F05 | active; internal | `DRAG-2.21, DRAG-6.24: a Card's tier is on its own content, and its Stubs are outside it, each at its own tier` |
| E020 | F05 | active; internal | `DRAG-6.20: flashes the row it names, for the flash’s length` |
| E021 | F05 | active; internal | `DRAG-6.20: leaves every other row, and every row while none is named, without it` |
| E022 | F05 | active; internal | `DRAG-8.8, TREE-2.9: says one child as “+ 1 child”, with no total when it is the whole branch` |
| E023 | F05 | active; internal | `DRAG-8.8, TREE-2.9: says the children alone when every descendant is a child` |
| E024 | F05 | active; internal | `DRAG-8.8, TREE-2.9: says both counts when the branch is deeper than its children` |
| E025 | F05 | active; internal | `DRAG-3.25, DRAG-8.10: reads its branch’s wording, takes no pointer, and hangs out of the flow under the box it is in` |
| E026 | F02 | active; internal | `DRAG-6.17: keeps an empty status element while no drag has been stopped, for assistive tech to announce into` |
| E027 | F02 | active; internal | `DRAG-6.16, DRAG-6.17: says why in the status element when the cause is %s` |
| E028 | F02 | active; internal | `DRAG-6.26: says the same for a column drag’s stop, which names no item, when the cause is %s` |
| E029 | F02 | active; internal | `DRAG-6.19: times its fade to the cue time` |
| E030 | F03 | active; internal | `DRAG-7.25: a modal that mounts with the cursor’s anchor and no drag running is centered, as a click opens it` |
| E031 | F03 | active; internal | `DRAG-7.28: a click on a row opens that row’s Sheet` |
| E032 | F03 | active; internal | `DRAG-7.32: Escape closes the modal with no Sheet open, and leaves it for the Sheet with one open` |
| E033 | F03 | active; internal | `DRAG-7.15, DRAG-8.1: rests the cursor on the row of the ghost’s gap, with the carried item’s branch out of the rows, and reports the gap and depth there` |
| E034 | F04 | active; internal | `DRAG-7.10: while the hierarchy modal holds its rows the modal's list carries the key, so the Card keeps only its id` |
| E035 | F04 | active; internal | `DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there` |
| E036 | F04 | active; internal | `DRAG-8.1, DRAG-8.5, DRAG-8.6: draws none of the branch of a carried %s, and every other row where it was` |
| E037 | F04 | active; internal | `DRAG-8.1, DRAG-8.5, DRAG-8.6: draws none of it in the static rows under the hierarchy modal’s backdrop either` |
| E038 | F04 | active; internal | `DRAG-8.1, DRAG-8.5, DRAG-8.6: draws it again once the drag is over` |
| E039 | F04 | active; internal | `DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: says the branch’s counts in its %s form` |
| E040 | F04 | active; internal | `DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: says nothing in its %s form without a branch` |
| E041 | F04 | active; internal | `DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: says nothing on the in-list row, which is no copy` |
| E042 | F04 | active; internal | `DRAG-3.25, DRAG-8.10: keeps its shortCard form’s one height, with the line hung outside its flow and its root unclipped` |
| E043 | F04 | active; internal | `DRAG-3.25, DRAG-8.10: hangs outside the flow of its Stub form’s box, and moves with the box through the depths` |
| E044 | F07 | active; internal | `TREE-4.12: draws the project under its new parent, beside the sibling it names, whatever its position` |
| E045 | F07 | active; internal | `TREE-4.12: leaves every project’s position as the server sent it` |
| E046 | F07 | active; internal | `TREE-4.12: reads the same place in the real tree’s children, collapsed or not` |
| E047 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > puts the ghost after a row below its own slot, and before a row above it` |
| E048 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > leaves the ghost in its own gap when the copy is nearest its own row` |
| E049 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > gives every gap exactly one row to be nearest, the list’s two ends included` |
| E050 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > reads the order it is given, so the same row is the same gap however the rows have slid` |
| E051 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > counts a collapsed project once, and the children it hides not at all` |
| E052 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > counts the dragged project’s branch not at all, since it is not drawn` |
| E053 | F07 | active; internal | `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > reads an id that names no row as below everything` |
| E054 | F07 | active; internal | `TREE-1.5: fullChildrenOf — a collapsed Top > returns a project’s real children regardless of collapse state` |
| E055 | F07 | active; internal | `TREE-1.5: fullChildrenOf — a collapsed Top > a collapsed Top still resolves Top + 1 to its real first child` |
| E056 | F06 | active; internal | `TREE-2.1, TREE-2.8: draws the dragged row at the ghost’s strength, and it has no tier` |
| E057 | F06 | active; internal | `TREE-2.7: draws the drop line outside the box the ghost dims, so the line keeps its own strength` |
| E058 | F06 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > at depth %i, the ghost is drawn there and its line starts at its name` |
| E059 | F06 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > starts each deeper state farther right` |
| E060 | F06 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > TREE-1.1, TREE-1.9: draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet` |
| E061 | F06 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > TREE-1.1, TREE-1.9: keeps the line at full strength while the ghost is dimmed: it sits outside the dimmed box` |
| E062 | F06 | active; internal | `TREE-2.9, TREE-2.10: says the branch’s counts on a second line inside the copy, out of its box` |
| E063 | F06 | active; internal | `TREE-2.9: says one child as “+ 1 child”` |
| E064 | F06 | active; internal | `TREE-2.10: leaves the count line to the carried copy: the ghost in the list has none` |
| E065 | F06 | active; internal | `TREE-2.9: has no line without a branch` |
| E066 | F06 | active; internal | `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse > %i children and %i descendants: the copy says %j` |
| E067 | F08 | active; internal | `TREE-9.4: earlier write answers cannot restore a deleted project or place another under it > $name, answered after P is deleted, brings back no row` |
| E068 | F08 | active; internal | `TREE-9.4: earlier write answers cannot restore a deleted project or place another under it > several such answers land %s: none brings a row back` |
| E069 | F08 | active; internal | `TREE-9.4: earlier write answers cannot restore a deleted project or place another under it > opens no collapsed parent for the answer of a project created under a deleted one` |
| E070 | F08 | active; internal | `TREE-4.13: a late response preserves positions already set by a newer saved write > keeps X under Q at 5 when R’s older answer lands last, and never draws X before B` |
| E071 | F08 | active; internal | `TREE-4.13: a late response preserves positions already set by a newer saved write > ends with the same tree when the answers land in the order they were saved` |
| E072 | F08 | active; internal | `TREE-4.13: a late response preserves positions already set by a newer saved write > keeps a position a newer write set over the older answer’s own position for that row` |
| E073 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > keeps an edit’s name when the first read lands with the tree as it was` |
| E074 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > keeps a move’s parent and order when the first read lands with the tree as it was` |
| E075 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > after an edit` |
| E076 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > after a move` |
| E077 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > is not loaded by the first read, which the second superseded, landing` |
| E078 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > is loaded when the latest read fails, with nothing in it` |
| E079 | F08 | active; internal | `TREE-4.14: an older tree read preserves a write already applied in the sidebar > is not loaded by the failure of a read the latest superseded` |
| E080 | F09 | active; internal | `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed > after A’s last movement makes B the nearest row, a release without moving again saves A after B at the top level` |
| E081 | F09 | active; internal | `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed > draws the ghost at the announced row, with its line, before any further move` |
| E082 | F09 | active; internal | `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed > reads the depth from the announcement’s own offset, so a tab made with the announcement is saved` |
| E083 | F09 | active; internal | `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed > places the release from its own event: the row it names, not the last one a move or an announcement named` |
| E084 | F09 | active; internal | `TREE-1.1: a release saves the gap and depth the ghost shows, though no move followed the last row crossed > still writes nothing when the announcement names the project’s own row, which is its own gap` |
| E085 | F09 | active; internal | `TREE-1.2: a gap offers the depths from Bottom’s to Top’s + 1, and each places the project differently > between A1a and B, depth %i saves X under %s after %s` |
| E086 | F09 | active; internal | `TREE-1.2: a gap offers the depths from Bottom’s to Top’s + 1, and each places the project differently > none is shallower than B’s depth or deeper than A1a’s + 1` |
| E087 | F09 | active; internal | `TREE-1.2: a gap offers the depths from Bottom’s to Top’s + 1, and each places the project differently > the gap between A1 and A1a offers exactly one depth: A1’s first child, before A1a` |
| E088 | F09 | active; internal | `TREE-1.3: the boundaries > above the first row, one depth is offered, the top level, and X becomes the first top-level project` |
| E089 | F09 | active; internal | `TREE-1.3: the boundaries > below the last row, depths 0 to 2 are offered: after B, B’s child after B1, B1’s first child` |
| E090 | F09 | active; internal | `TREE-1.3: the boundaries > an offset past either end clamps to the nearest depth, and the top level is the floor` |
| E091 | F09 | active; internal | `TREE-1.4: when the dragged project’s subtree holds every project, one depth is offered, the top level > resting on its own row, at any offset, offers the top level` |
| E092 | F09 | active; internal | `TREE-1.4: when the dragged project’s subtree holds every project, one depth is offered, the top level > draws no line, since no row is left to place against, and a release sends nothing` |
| E093 | F09 | active; internal | `TREE-1.5: a collapsed project hides its subtree from view, not from placement > tabbed once right of T, X goes ahead of T’s first child, which isn’t shown` |
| E094 | F09 | active; internal | `TREE-1.5: a collapsed project hides its subtree from view, not from placement > aligned with T, X goes after T’s whole subtree, before U` |
| E095 | F09 | active; internal | `TREE-1.5: a collapsed project hides its subtree from view, not from placement > counts T once in the list the gap is read from, and T’s children not at all` |
| E096 | F09 | active; internal | `TREE-1.6: nearest the dragged project’s own row means its own gap, with its descendants absent > has no row of its own in the list: only X’s own row stands for it, in X’s own gap, between A and B` |
| E097 | F09 | active; internal | `TREE-1.6: nearest the dragged project’s own row means its own gap, with its descendants absent > released there as A’s first child, X is saved there` |
| E098 | F09 | active; internal | `TREE-1.6: nearest the dragged project’s own row means its own gap, with its descendants absent > no depth in any gap makes X a child of X1 or X2` |
| E099 | F09 | active; internal | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing > sends nothing when the cursor leaves X’s row and comes back to its own gap` |
| E100 | F09 | active; internal | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing > sends nothing when X is released before the cursor has left its row` |
| E101 | F09 | active; internal | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing > a nested project’s own gap is its own row’s, and a neighbor’s row is the neighbor’s gap` |
| E102 | F09 | active; internal | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing > a project with children, resting on its own row, is set down in its own gap too` |
| E103 | F09 | active; internal | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing > still writes at another depth in its own gap, or at its own depth in another gap` |
| E104 | F09 | active; internal | `TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap > the cursor leaves for the gap above B and comes back to X’s row: the ghost is in X’s own gap, and a release sends nothing` |
| E105 | F09 | active; internal | `TREE-1.10: nearest the dragged project’s own row, horizontal offset picks among its own gap’s depths > resting on X’s own row, an offset still picks a depth of that gap: tabbed right, X is B’s first child` |
| E106 | F09 | active; internal | `TREE-1.11: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing > marks a tab state that puts the subtree past the cap invalid, and a release in it sends nothing` |
| E107 | F09 | active; internal | `TREE-1.11: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing > leaves a tab state that fits the cap valid, and a release in it writes` |
| E108 | F09 | active; internal | `TREE-1.16, TREE-2.9: counts the rows under a collapsed descendant, which were not drawn to begin with` |
| E109 | F09 | active; internal | `TREE-1.16, TREE-2.9: counts the whole branch of a collapsed project, though none of it was drawn` |
| E110 | F09 | active; internal | `TREE-1.16, TREE-2.9: is none for a project with no children, and every row stays drawn` |
| E111 | F09 | active; internal | `TREE-1.16, TREE-2.9: holds the branch it began with: a descendant it moves out stays in the branch, and hidden` |
| E112 | F09 | active; internal | `TREE-1.16, TREE-2.9: does not take in a project it moves under the carried one: it is drawn where the tree puts it` |
| E113 | F09 | active; internal | `TREE-2.1: has none before a pickup, and none once the drag is released or cancelled` |
| E114 | F09 | active; internal | `TREE-2.1: is "neither" for the dragged project’s descendants at every depth, and none for its own row, on a shallow tree` |
| E115 | F09 | active; internal | `TREE-2.4: is "anchor" for a row past the cap whose own parent can take the project, and "neither" below it` |
| E116 | F09 | active; internal | `TREE-2.6: holds for the whole drag: a response that lands mid-drag redraws nothing` |
| E117 | F09 | active; internal | `TREE-1.14, TREE-1.15: holds the carried branch, and the height the cap reads, for the whole drag` |
| E118 | F09 | active; internal | `TREE-2.8: the strengths > are the defaults the panel starts at, when nothing is stored` |
| E119 | F09 | active; internal | `TREE-2.8: the strengths > are read from storage at pickup, so a change in the panel takes effect on the next drag` |
| E120 | F09 | active; internal | `TREE-2.8: the strengths > are apart from the board’s three, which the sidebar never reads` |
| E121 | F09 | active; internal | `TREE-1.17: the ghost takes the nearest row’s slot, never a row’s half > nearest %s, the ghost is between %j, and a release at the top level saves %j` |
| E122 | F09 | active; internal | `TREE-1.17: the ghost takes the nearest row’s slot, never a row’s half > reaches every gap, both ends included, from exactly one row` |
| E123 | F09 | active; internal | `TREE-1.17: the ghost takes the nearest row’s slot, never a row’s half > selects no second gap when the copy moves from above a row’s middle to below it` |
| E124 | F09 | active; internal | `TREE-1.18: the slot list counts a collapsed project once and leaves hidden children and the branch out > lists A, T, X and B, and takes the gap each nearest row names` |
| E125 | F09 | active; internal | `TREE-1.18: the slot list counts a collapsed project once and leaves hidden children and the branch out > still places X ahead of the real first child T1 when tabbed right of T: counting rows drawn hides nothing from placement` |
| E126 | F09 | active; internal | `TREE-2.1: the dragged project’s descendants are absent for the whole drag, and its own row is the ghost > leaves the branch out of the rows and out of placement, and keeps the ghost, untiered, following the gap` |
| E127 | F09 | active; internal | `TREE-2.1: the dragged project’s descendants are absent for the whole drag, and its own row is the ghost > clears the tiers and the ghost at a %s, and draws the branch again` |
| E128 | F09 | active; internal | `TREE-2.12: every end of the drag draws the branch again under the project > %s: the branch is drawn again, and the copy’s second line ends` |
| E129 | F09 | active; internal | `TREE-2.12: every end of the drag draws the branch again under the project > keeps A1 hidden after the drag when A was collapsed at pickup: drawing the branch again expands nothing` |
| E130 | F09 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > draws no line before the pointer’s first move, with the ghost at its pickup depth` |
| E131 | F09 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > draws one line on the ghost in any gap it takes: above the first row, between rows, below the last` |
| E132 | F09 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > draws the ghost, and the line with it, at each of the four depths of the gap between A1a and B` |
| E133 | F09 | active; internal | `TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move > draws no line when X’s subtree holds every project, even after the pointer has moved` |
| E134 | F09 | active; internal | `TREE-4.11: the next pickup counts earlier drag moves before their answers arrive > has X and X1 beneath P already: hidden in its carried branch, and counted on its copy’s line` |
| E135 | F09 | active; internal | `TREE-4.11: the next pickup counts earlier drag moves before their answers arrive > reads P’s subtree height as 2: S is Full, and T is Mid` |
| E136 | F09 | active; internal | `TREE-1.14: a project added to the dragged subtree after pickup stays a candidate, and a cyclic release is refused > after %s, Y is drawn under X and is no part of the held branch, and the next pickup of X holds it, hidden and out of placement` |
| E137 | F09 | active; internal | `TREE-1.15: cap states keep the pickup subtree height when a response grows or shrinks it > after %s, the state making X T’s child is still valid by the pickup height, and sent; the next pickup marks it invalid` |
| E138 | F09 | active; internal | `TREE-1.15: cap states keep the pickup subtree height when a response grows or shrinks it > after Y, X’s only child, is made top-level, the state stays invalid by the pickup height, and the next pickup finds it valid` |
| E139 | F09 | active; internal | `TREE-1.16: a descendant moved out after pickup stays excluded until the next drag > after an edit puts Y, X’s child, under B, Y stays hidden and out of placement for the drag, then is drawn under B and a candidate at the next pickup` |
| E140 | F09 | active; internal | `TREE-1.16: a descendant moved out after pickup stays excluded until the next drag > after an earlier drag of Y under X is refused, Y’s row stays hidden in the branch until the drag ends, and is drawn under B after` |
| E141 | F09 | active; internal | `TREE-2.4: legal parents are Full, the cap boundary is Mid, and deeper rows are Low > at cap %i, P1 to P_(CAP-2) are Full, P_(CAP-1) is Mid, P_CAP is Low, and X1 is absent` |
| E142 | F09 | active; internal | `TREE-2.5: top-level rows take the root’s legal-parent answer > with X’s subtree one level under the cap, the root takes it: every other top-level row is Mid, and their nested rows Low` |
| E143 | F09 | active; internal | `TREE-2.5: top-level rows take the root’s legal-parent answer > with X’s subtree at the cap, no root can take it: every other row is Low, top-level included, and the ghost has no tier` |
| E144 | F09 | active; internal | `TREE-2.6: a response landing mid-drag does not redraw the pickup tiers > keeps P Full through the rest of the drag, and every Mid and Low row as it was, then draws P Mid at the next pickup` |
| E145 | F09 | active; internal | `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse > %s: the line is %j` |
| E146 | F09 | active; internal | `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse > with %j collapsed, the five descendants still count, and none is left among the rows drawn` |
| E147 | F09 | active; internal | `TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse > holds the counts and the membership for the whole drag, and never counts X itself` |
| E148 | F10 | active; internal | `DRAG-4.30: a foreign item enters at the section's last gap as the Card's last child, even under a nested last row` |
| E149 | F10 | active; internal | `DRAG-4.8: the named row moves the gap; a sample naming none keeps it` |
| E150 | F10 | active; internal | `DRAG-4.18: over the cap the state is still offered, marked invalid` |
| E151 | F10 | active; internal | `DRAG-4.30: leaving the section clears it; coming back reseeds at the own slot, wherever the pointer is now` |
| E152 | F10 | active; internal | `DRAG-4.30: the Card's own Stub coming back in from its column seeds at its own slot, and a release there writes nothing` |
| E153 | F10 | active; internal | `DRAG-4.30: an item from outside seeds at the last gap as the Card’s last child, the column’s anchor or none` |
| E154 | F10 | active; internal | `DRAG-4.30: an overflow row of a row that is not in the section names no gap either` |
| E155 | F10 | active; internal | `DRAG-7.6: the pickup slot is read once, so a return finds it when the row is not in the section now` |
| E156 | F10 | active; internal | `DRAG-7.3: between R and its overflow row, one state: R’s first child` |
| E157 | F10 | active; internal | `DRAG-7.4: below R’s overflow row, R’s last child, or tabbed left R’s next sibling, and none right of the row` |
| E158 | F10 | active; internal | `DRAG-7.4: below R’s overflow row with only B below R’s subtree, the states run from the top level to R’s last child, and no further` |
| E159 | F10 | active; internal | `DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only child` |
| E160 | F10 | active; internal | `DRAG-7.13: names the overflow row the ghost sits directly above or below, at its level, and no other state` |
| E161 | F10 | active; internal | `DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state` |
| E162 | F10 | active; internal | `DRAG-7.6: comes in as an item from outside does: the last gap, as the Card’s last child` |
| E163 | F10 | active; internal | `DRAG-7.6: stays one when the ghost previews at the Card’s last child, so a release there still writes` |
| E164 | F10 | active; internal | `DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before` |
| E165 | F10 | active; internal | `DRAG-7.31: set down at its own slot in the modal, after coming in with the slot hidden, a release writes nothing` |
| E166 | F10 | active; internal | `DRAG-4.29, DRAG-4.30: writes nothing at the Stub's own gap and depth, however it got back there` |
| E167 | F10 | active; internal | `DRAG-4.9: with no anchor, the resolved parent's first child` |
| E168 | F10 | active; internal | `DRAG-4.18: writes nothing over the cap, or with no projection` |
| E169 | F10 | active; internal | `DRAG-7.15: takes the gap and depth it is given, measures the pointer’s travel from the new pointer, and drops the old reading` |
| E170 | F10 | active; internal | `DRAG-7.15: counts the pointer’s travel from the point the reading was taken at, whatever it has done since` |
| E171 | F10 | active; internal | `DRAG-7.15: the reading holds until the pointer moves > drops an anchor named with the pointer where it was read` |
| E172 | F10 | active; internal | `DRAG-7.15: the reading holds until the pointer moves > lets go once the pointer moves, along either axis, and takes the anchor named since` |
| E173 | F10 | active; internal | `DRAG-7.15: the reading holds until the pointer moves > does not hold again if the pointer comes back to where it was read` |
| E174 | F10 | active; internal | `DRAG-7.15: the reading holds until the pointer moves > says whether it holds, by the pointer it is asked about` |
| E175 | F11 | active; internal | `DRAG-7.2: leaves the dragged item out of the count, and draws none when it was the only child` |
| E176 | F11 | active; internal | `DRAG-4.8, DRAG-7.27, DRAG-8.1: draws none of its rows, and none of the overflow rows they owned` |
| E177 | F11 | active; internal | `DRAG-4.8, DRAG-7.27, DRAG-8.1: draws no overflow row for the carried Stub itself when all its children travel` |
| E178 | F11 | active; internal | `DRAG-4.8, DRAG-7.27, DRAG-8.1: keeps every other row, and every other overflow row with its count` |
| E179 | F11 | active; internal | `DRAG-8.2, DRAG-8.3, DRAG-8.8: counts the rows past the levels a section shows, as the walk is not cut there` |
| E180 | F11 | active; internal | `DRAG-8.2, DRAG-8.3, DRAG-8.8: leaves a Free child out, with everything under it` |
| E181 | F11 | active; internal | `DRAG-8.2, DRAG-8.3, DRAG-8.8: is null for a Stub with no attached descendants, a Free child apart` |
| E182 | F11 | active; internal | `DRAG-8.2, DRAG-8.3, DRAG-8.8: holds a row where the board draws it: a pending attach joins the branch, and a pending detach leaves it` |
| E183 | F12 | active; internal | `DRAG-3.5: switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers` |
| E184 | F12 | active; internal | `DRAG-3.5: moves with the shortCard height — the gap plays no part in the 2+-card edge` |
| E185 | F12 | active; internal | `DRAG-3.15: exactly one card halves the edge to (heightPx + gapPx) / 2, leaving it a real, unlabeled middle band` |
| E186 | F12 | active; internal | `DRAG-3.5: with two or more cards, each dead zone is (heightPx + gapPx) / 2 tall and each divider heightPx in — from the metrics alone` |
| E187 | F13 | active; internal | `DRAG-1.7, DRAG-1.8: is true only for a Valid target — never depth-capped, cycle-forming, or unknown` |
| E188 | F13 | active; internal | `DRAG-2.1: a legal target is Valid` |
| E189 | F13 | active; internal | `DRAG-2.2: the dragged item and every descendant are Cycle-forming, regardless of attachment` |
| E190 | F13 | active; internal | `DRAG-2.14: is "parent" for a legal parent, a Free Card or a Stub` |
| E191 | F13 | active; internal | `DRAG-2.15, DRAG-2.16: is "anchor" for a Free Card that is no legal parent, whatever its parent, and for a Stub too deep under a legal parent` |
| E192 | F13 | active; internal | `DRAG-2.15, DRAG-2.16, DRAG-2.17: is "neither" for a Stub whose parent is no legal parent, at any depth below it` |
| E193 | F13 | active; internal | `DRAG-2.17: is one tier per item for a dragged Stub: its descendants "neither", its sibling and parent "parent"` |
| E194 | F13 | active; internal | `DRAG-2.23: reads a descendant by the Stub test it is handed, not its stored attachment` |
| E195 | F13 | active; internal | `DRAG-2.3: depth-caps a target one level too deep, parameterized on cap = %i` |
| E196 | F13 | active; internal | `DRAG-2.7: Stubs are classified individually — no blanket exclusion` |
| E197 | F13 | active; internal | `DRAG-2.9: cycle-forming wins over depth-capped for a deep descendant` |
| E198 | F13 | active; internal | `DRAG-2.8: classifyDragTargets — Stub drag (full classification) > a Stub is classified exactly like a Card would be — its own parent, its siblings, and every other Card/Stub included, no blanket exclusion` |
| E199 | F13 | active; internal | `DRAG-2.8: classifyDragTargets — Stub drag (full classification) > DRAG-2.17: a Stub's own descendants are still Cycle-forming, the Free ones an anchor and the Stubs neither` |
| E200 | F13 | active; internal | `DRAG-2.8: classifyDragTargets — Stub drag (full classification) > depth-caps a target one level too deep for a Stub drag exactly like a Card, cap = %i` |
| E201 | F14 | active; internal | `DRAG-4.23: alone in its list: nothing to anchor to` |
| E202 | F14 | active; internal | `DRAG-4.8: over a Stub row: the same shuffle-slot rule, with a Stub row's own ghost height` |
| E203 | F14 | active; internal | `DRAG-4.8: names the row beside the ghost, leaning with the carried copy` |
| E204 | F15 | active; internal | `DRAG-1.28: %s` |
| E205 | F15 | active; internal | `DRAG-3.22: on the board is the Card's width minus its content inset on both sides` |
| E206 | F15 | active; internal | `DRAG-3.22: locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width` |
| E207 | F15 | active; internal | `DRAG-3.22: keeps the pointer at the same fraction across the Stub's width, and on its vertical middle` |
| E208 | F16 | active; internal | `DRAG-1.6: is null in the gap between two sub-rows (sub-rows are distinct contexts, and the gap belongs to neither)` |
| E209 | F17 | active; internal | `DRAG-3.1, DRAG-3.2, DRAG-3.6: a different workphase is never identity, whatever the slot` |
| E210 | F17 | active; internal | `DRAG-3.12, DRAG-3.24: same workphase, slot existing: always identity (middle band member)` |
| E211 | F17 | active; internal | `DRAG-1.24: same workphase, empty others: any slot is identity — nothing to order against` |
| E212 | F17 | active; internal | `DRAG-3.7: same workphase, non-empty others, a real anchor found: not identity — a genuine reorder (top/bottom)` |
| E213 | F17 | active; internal | `TC-2.11: toRequest > DRAG-3.3: cross-column, no anchor: workphaseId alone (outsider, middle band)` |
| E214 | F17 | active; internal | `TC-2.11: toRequest > TC-7.1, TC-7.2, TC-7.4, DRAG-3.1, DRAG-3.2: first/last resolve to a concrete anchor beside others' own edge` |
| E215 | F17 | active; internal | `TC-2.11: toRequest > DRAG-3.10: empty others: first/last send a bare workphase move, no anchor to resolve` |
| E216 | F17 | active; internal | `TC-2.11: toRequest > DRAG-3.23: a done region never anchors — placementFor falls back to 'existing' for one, so toRequest never sees a first/last/anchor slot for it` |
| E217 | F17 | active; internal | `TC-2.11: toRequest > DRAG-4.12, DRAG-5.4: an attach into a Card with no other children: parentId + isAttached, and no anchor to send` |
| E218 | F17 | active; internal | `TC-2.11: toRequest > DRAG-4.1: an attach as the last child of a Card with children: parentId + isAttached, and the anchor after its last child` |
| E219 | F17 | active; internal | `TC-2.11: toRequest > DRAG-5.5: a Descendants-layer sibling reorder (parentId matching origin, an anchor slot): sends only the anchor + side` |
| E220 | F17 | active; internal | `TC-2.11: toRequest > DRAG-5.1: detach (parentId: null on the placement): isAttached false, plus the anchor/workphase resolution otherwise` |
| E221 | F17 | active; internal | `TC-2.11: toRequest > DRAG-5.2: detaching within the same covered set sends no workphaseId field at all` |
| E222 | F17 | active; internal | `TC-2.11: toRequest > DRAG-4.34: a reparent with an anchor slot for a *different* parent is a full reparent-with-placement, not a bare reorder` |
| E223 | F17 | active; internal | `DRAG-6.6: a rejected move fails the write (the guess is dropped) and resyncs, as a failed write` |
| E224 | F17 | active; internal | `DRAG-6.7: a stale response's own row is still discarded, but resyncs instead of losing the reindex pairs it carried` |
| E225 | F17 | active; internal | `DRAG-6.7: a stale response with no reindex disclosed needs no resync` |
| E226 | F18 | active; internal | `DRAG-1.10: clips a sub-row's region to its column's visible scroll box` |
| E227 | F18 | active; internal | `DRAG-1.10: a sub-row scrolled fully out of view registers no region at all` |
| E228 | F18 | active; internal | `DRAG-1.7, DRAG-1.8: an id isValidCard rejects resolves no region at all — same as an unresolvable column key` |
| E229 | F18 | active; internal | `DRAG-1.25: a merged column's boundsRect is its own outer body, taller than the content-sized region` |
| E230 | F18 | active; internal | `DRAG-1.25: a sub-row's boundsRect is undefined — its own rect already is its full bound, nothing to add` |
| E231 | F18 | active; internal | `DRAG-7.10: a Descendants element inside a marked dialog gets that dialog’s box as its boundsRect` |
| E232 | F18 | active; internal | `DRAG-7.10: each Descendants region takes the bounds element marked for its own key` |
| E233 | F18 | active; internal | `DRAG-1.10: clipToVisible > clips the part of the rect outside the visible box, on either edge or both` |
| E234 | F18 | active; internal | `DRAG-1.10: clipToVisible > is null once none of the rect is left visible` |
| E235 | F18 | active; internal | `DRAG-1.10: clipToVisible > keeps left/right/width from a DOMRect-shaped object, not just a plain one` |
| E236 | F19 | active; internal | `DRAG-6.11: draws an item with no completedAt at the end of a done list, where the server will stamp it, and keeps it there once it is stamped` |
| E237 | F19 | active; internal | `TC-2.30, DRAG-3.11: a placement with a workphaseId moves the item into that list without changing the item (position kept, not null)` |
| E238 | F19 | active; internal | `DRAG-6.10: keeps the position sort when there is a position to keep, appends otherwise` |
| E239 | F20 | active; internal | `DRAG-6.4: a response that sorts the item after E is shown as the server saved it, never adjusted to the preview` |
| E240 | F20 | active; internal | `DRAG-6.9: a response for a write whose placement has since been replaced (a re-drag's ghost, or a different write) applies the rows but leaves the current placement alone` |
| E241 | F20 | active; internal | `DRAG-6.1, TC-2.28: a top or bottom band drop is marked pending as the anchor it sends, so the board draws the same order before the server's answer and after it` |
| E242 | F20 | active; internal | `TC-2.30, DRAG-6.2: a pending item keeps its position and its place when another item's response re-sorts the list` |
| E243 | F21 | active; internal | `DRAG-7.15: puts the spot under the cursor when the dialog fits` |
| E244 | F21 | active; internal | `DRAG-7.16: is pulled inside the window at %s` |
| E245 | F21 | active; internal | `DRAG-7.17: scrolls the list to bring a spot deep in it under the cursor` |
| E246 | F21 | active; internal | `DRAG-7.17: scrolls no further than the list goes, and not at all for a short one` |
| E247 | F21 | active; internal | `DRAG-7.17: stops the scroll where the spot reaches the top of the list, so the header never covers it` |
| E248 | F21 | active; internal | `DRAG-7.17: scrolls all the way to the spot when the cursor is low enough that it stays below the header` |
| E249 | F21 | active; internal | `DRAG-7.25: puts a dialog that fits in the middle of the window, with the list unscrolled` |
| E250 | F21 | active; internal | `DRAG-7.15: rests the cursor the inset past where a row at that depth is drawn` |
| E251 | F21 | active; internal | `DRAG-7.15: reads back the depth the cursor was placed at, at every level` |
| E252 | F21 | active; internal | `DRAG-7.16: a modal shifted sideways reads the depth the cursor is at, to the nearest level` |
| E253 | F21 | active; internal | `DRAG-7.15: the gap is the count of rows before the slot the ghost takes` |
| E254 | F21 | active; internal | `DRAG-7.15: slotForGap is the inverse, the row to rest the cursor on for a gap` |
| E255 | F22 | active; internal | `DRAG-1.4, TC-2.11: a specific card: the anchor + side dnd-kit resolved, under its own workphase` |
| E256 | F22 | active; internal | `DRAG-3.11: Board layer — the hovered band picks the slot — first, existing, last — under the region's target workphase` |
| E257 | F22 | active; internal | `DRAG-3.7: Board layer — a covered-set member keeps its own workphase in the preview` |
| E258 | F22 | active; internal | `DRAG-3.9: Board layer — a done region previews no positioned insert in any band, whatever the item's own position` |
| E259 | F22 | active; internal | `DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep` |
| E260 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > in-context, no hover: the prior placement wins over a freshly computed slot` |
| E261 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > locked in a list the prior placement doesn't draw it in, it gives way to that list's own slot` |
| E262 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > a pending attach (the prior names a parent) never stands in for a card list's ghost` |
| E263 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > a pending detach (parentId: null) into this list still stands in` |
| E264 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > a Board-layer hovered band ignores it — a genuine new region still computes its own slot` |
| E265 | F22 | active; internal | `DRAG-6.13: priorPlacement (a re-dragged item) > with no prior placement (the ordinary drag), in-context still computes the raw slot as before` |
| E266 | F22 | active; internal | `DRAG-5.4: at a *different* Card, the within-action is attach as its last child` |
| E267 | F22 | active; internal | `DRAG-5.9: at its own Descendants layer, mid-drag, it sits at origin — dnd-kit's own sortable strategy draws the reorder (this branch never sees a real `over`; a release there goes through releaseDescendants instead)` |
| E268 | F22 | active; internal | `DRAG-7.6: at its own Descendants layer with its own slot hidden, it previews as the last child` |
| E269 | F22 | active; internal | `DRAG-6.12: reaching a card-list region previews Free (parentId: null) and rests at "last", never the position-sort's stale slot` |
| E270 | F22 | active; internal | `DRAG-5.1, DRAG-6.12: a real anchor at the column layer resolves exactly like any Card's anchor+side` |
| E271 | F22 | active; internal | `DRAG-5.3, DRAG-6.12: at Board layer (genuinely popped out), it also previews Free at the append slot` |
| E272 | F22 | active; internal | `DRAG-3.22, DRAG-1.35: across a real zoom-in (Column → Card’s Descendants layer) and pop-out (back to the column), the form switches both ways` |
| E273 | F23 | active; internal | `DRAG-1.1: starts locked in the origin context with nothing tracked` |
| E274 | F23 | active; internal | `DRAG-1.30: leaving the context starts the pop-out clock — into a gap as much as into another column, and neither is tracked beyond that` |
| E275 | F23 | active; internal | `DRAG-1.30: coming back inside before popDelayMs resets the clock` |
| E276 | F23 | active; internal | `DRAG-1.3, DRAG-1.30: outside for >= popDelayMs pops out — the card belongs to nothing and the pop-in clock starts now` |
| E277 | F23 | active; internal | `DRAG-1.30: the clock runs wherever the cursor is outside, from whenever it first left — wandering to a different foreign point never restarts it, nor tracks anything about that point` |
| E278 | F23 | active; internal | `DRAG-1.14: the distance term pops out as soon as the cursor is far enough from the context (either satisfies)` |
| E279 | F23 | active; internal | `DRAG-1.14: with popDistancePx at 0 the distance term is off — a cursor far outside pops nothing until the clock runs out` |
| E280 | F23 | active; internal | `DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect > below the last card but still inside the outer body: still locked, nothing tracked` |
| E281 | F23 | active; internal | `DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect > past the outer body too: the pop-out clock starts, same as any other region` |
| E282 | F23 | active; internal | `DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect > a sub-row has no boundsRect to speak of — its own rect stays the containment test` |
| E283 | F23 | active; internal | `DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect > DRAG-1.14: the distance term also measures against the outer body for a merged column` |
| E284 | F23 | active; internal | `DRAG-7.10: a Descendants region with a boundsRect is still inside over that box, the hierarchy modal’s header above its list` |
| E285 | F23 | active; internal | `DRAG-7.11: resting outside the dialog, over a Card under the backdrop, runs the pop-out clock to the modal Card’s column` |
| E286 | F23 | active; internal | `DRAG-3.21: at Board layer the band reads the region's live rect on every sample, not one frozen at entry` |
| E287 | F23 | active; internal | `DRAG-3.15, DRAG-3.21: at Board layer the band also reads the region's live card count on every sample, so the one-card exception never goes stale while a region is the hover target` |
| E288 | F23 | active; internal | `DRAG-1.4: holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone` |
| E289 | F23 | active; internal | `DRAG-4.19: holding it through the cue zooms straight into the named Card’s Descendants layer, wherever the bare cursor happens to be` |
| E290 | F23 | active; internal | `DRAG-1.4: a different named card resets the hold from the dwell, even mid-cue` |
| E291 | F23 | active; internal | `DRAG-1.4: the same card on its other side resets the hold too` |
| E292 | F23 | active; internal | `DRAG-4.23: nothing named (alone in the list, or hovering nothing): no candidate at all` |
| E293 | F23 | active; internal | `DRAG-1.7, DRAG-1.8: a card with no registered region — an invalid target, cycle-forming or depth-capped, that resolveDragStructure never resolves a region for — is never a candidate even though it can still be named for a reorder` |
| E294 | F23 | active; internal | `DRAG-1.35: there is no further child to zoom into: resting in the layer, however long, holds it` |
| E295 | F23 | active; internal | `DRAG-5.5: an excursion out of the layer shorter than popDelayMs pops nothing, and coming back resets the clock` |
| E296 | F23 | active; internal | `DRAG-5.1, DRAG-5.13: leaving the Card’s box for popDelayMs is one pop, to the column the Card sits in` |
| E297 | F23 | active; internal | `DRAG-1.14: the pop-out distance term measures against the Card’s box` |
| E298 | F23 | active; internal | `DRAG-1.37: a zero-delay pop cycle settles in the context it returns to > DRAG-1.37: a sample inside K, far from the Card P it names, zooms into P and pops back out to settle in K` |
| E299 | F23 | active; internal | `DRAG-1.37: a zero-delay pop cycle settles in the context it returns to > DRAG-1.37: the same sample settles in K from any state K was in, a hold or an exit clock running` |
| E300 | F23 | active; internal | `DRAG-1.37: a zero-delay pop cycle settles in the context it returns to > DRAG-1.37: a later sample inside P, with P still named, zooms into its Descendants layer: settling the earlier one bars nothing` |
| E301 | F23 | active; internal | `DRAG-1.37: a zero-delay pop cycle settles in the context it returns to > DRAG-1.37: each sample far from P settles in K again, never in P` |
| E302 | F23 | active; internal | `DRAG-1.19: a distant yank out of a Card cascades through two pops, one layer at a time > DRAG-1.19: $origin, one sample past both bounds pops to K and on to Board` |
| E303 | F23 | active; internal | `DRAG-1.19: a distant yank out of a Card cascades through two pops, one layer at a time > DRAG-1.19: $origin, a sample that rests inside K, far from P, pops once and stays in K as a shortCard` |
| E304 | F23 | active; internal | `DRAG-1.19: a distant yank out of a Card cascades through two pops, one layer at a time > DRAG-1.19: $origin, a sample far from P but short of popDistancePx outside K pops once and stays in K` |
| E305 | F23 | active; internal | `DRAG-1.11: resting in a middle band past the pop-in threshold locks the card into that column` |
| E306 | F23 | active; internal | `DRAG-1.11: the pop-in clock starts at the pop-out, not at the region entry — the popped-out state is always reachable` |
| E307 | F23 | active; internal | `DRAG-1.11: the top and bottom bands never pop in, however long; moving to another column restarts the clock` |
| E308 | F23 | active; internal | `DRAG-1.11: time in the top band counts toward the pop-in clock, so sliding into the middle band after it has run pops in at once` |
| E309 | F23 | active; internal | `DRAG-1.11: leaving the region before the clock runs out and coming back starts it over` |
| E310 | F23 | active; internal | `DRAG-1.11: popped out, the pop-in clock only from a middle band` |
| E311 | F23 | active; internal | `DRAG-7.13: a silent dwell, then a cue, then the hold has run its length` |
| E312 | F23 | active; internal | `DRAG-7.14: resets when the gap, the depth or the side changes, and the cue goes at once` |
| E313 | F23 | active; internal | `DRAG-7.14: the hold starts over after it ended, with a fresh dwell` |
| E314 | F23 | active; internal | `DRAG-7.13: popDueAt reports the cue, then the end of the hold` |
| E315 | F23 | active; internal | `DRAG-7.14: resting outside the layer ends the hold: it runs with the cursor inside` |
| E316 | F24 | active; internal | `DRAG-1.36: is the Card it is drawn under, when an ancestor’s attachment is still pending` |
| E317 | F24 | active; internal | `DRAG-1.36: is a Card whose own detach is still pending, which is drawn Free` |
| E318 | F24 | active; internal | `DRAG-2.11: counts depth through an ancestor whose attachment is still pending` |
| E319 | F24 | active; internal | `DRAG-2.12, DRAG-2.23: classifies an item a pending attachment puts in the dragged Card as its descendant` |
| E320 | F24 | active; internal | `DRAG-2.12, DRAG-2.23: is still a descendant of its parent, and now a Card of its own, so an anchor` |
| E321 | F24 | active; internal | `DRAG-2.11: still sits one level down, for the depth of what is put under it` |
| E322 | F24 | active; internal | `DRAG-8.1, DRAG-8.2, DRAG-8.8: holds a Stub’s attached descendants and the two counts, a Free child left out` |
| E323 | F24 | active; internal | `DRAG-8.1, DRAG-8.2, DRAG-8.8: holds a Free Card’s attached descendants the same way, a Free child and what is under it left out` |
| E324 | F24 | active; internal | `DRAG-8.1, DRAG-8.2, DRAG-8.8: holds none for an item with no attached descendants, a Free child apart` |
| E325 | F24 | active; internal | `DRAG-4.35: is the row dnd-kit announces over a move event that names the row before it` |
| E326 | F24 | active; internal | `DRAG-1.37: completes the sample, which settles in the list with the drag still running` |
| E327 | F24 | active; internal | `DRAG-1.37: a later sample inside P, which is still named, zooms into its Descendants layer` |
| E328 | F24 | active; internal | `DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing` |
| E329 | F24 | active; internal | `DRAG-6.22: reloads the board when no drag is live` |
| E330 | F24 | active; internal | `DRAG-6.16: is reported once, with the cause, when a failed write reloads the board mid-drag` |
| E331 | F24 | active; internal | `DRAG-6.22: is not reported for Escape or any other cancel` |
| E332 | F24 | active; internal | `DRAG-6.22: is not reported for a release that writes nothing` |
| E333 | F24 | active; internal | `DRAG-6.16: is reported with the cause "refresh" when an armed stop fires, once, and spends the arm` |
| E334 | F24 | active; internal | `DRAG-6.22: is not reported when a drag is cancelled before an armed stop fires` |
| E335 | F24 | active; internal | `DRAG-6.26: is reported once, with the cause and no item, when a failed column save reloads the board mid-drag` |
| E336 | F24 | active; internal | `DRAG-6.22: is not reported for one released before the reload, whose own save is what failed` |
| E337 | F24 | active; internal | `DRAG-6.22: is not reported for one cancelled before the reload` |
| E338 | F24 | active; internal | `DRAG-6.26: is reported with the cause "refresh" and no item when an armed stop fires, once, and spends the arm` |
| E339 | F24 | active; internal | `DRAG-6.22: is not reported when the column is released before an armed stop fires, which stays armed` |
| E340 | F25 | active; internal | `DRAG-6.19: holds a reported stop for the cue’s time, and then lets it go` |
| E341 | F25 | active; internal | `DRAG-6.18: lets it go at the next drag’s start, without waiting out the time` |
| E342 | F25 | active; internal | `DRAG-6.20: names the stopped item from the stop on, and has none before it` |
| E343 | F25 | active; internal | `DRAG-6.27: is held across the stop’s own reload, however long it takes: the clock starts when the board is drawn` |
| E344 | F25 | active; internal | `DRAG-6.27: is let go once it has played, while the banner stays for its own time` |
| E345 | F25 | active; internal | `DRAG-6.27: is let go when another reload starts after it has been drawn, so its rows don’t flash again` |
| E346 | F25 | active; internal | `DRAG-6.22, DRAG-6.27: is not drawn at all by a reload that finishes with no stop behind it` |
| E347 | F25 | active; internal | `DRAG-6.27: is let go at the next drag’s start, with the banner` |
| E348 | F25 | active; internal | `DRAG-6.26: holds the banner and names no row to flash, through the reload and after it` |
| E349 | F25 | active; internal | `DRAG-6.26: takes the place of a stop with an item, with a fresh banner and no flash` |
| E350 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > keeps Y at 4 when X’s older answer lands second, with Z = 2 and X = 3 applied: Z, X, Y` |
| E351 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > ends the same when the answers land in the order the writes were sent` |
| E352 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > keeps X at 1 when its older written row lands second: X, Z, Y` |
| E353 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > ends the same when the answers land in the order the writes were sent` |
| E354 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > takes the rest of an older answer: its own row’s other fields, though not its position` |
| E355 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > leaves the position of a row a later-sent drag set, when its answer lands after the drag’s` |
| E356 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > ends the same when the answers land in the order the writes were sent` |
| E357 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > is the latest write: a drag sent before it, answered after, leaves what it set` |
| E358 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > holds a child the Sheet created to the same rule` |
| E359 | F26 | active; internal | `DRAG-6.29: answers for different items preserve positions set by the later write > applies a drag’s answer in full when no Sheet write came after it` |
| E360 | F27 | active; internal | `TREE-2.5: a top-level row > is a "parent" when it can take the carried project` |
| E361 | F27 | active; internal | `TREE-2.5: a top-level row > is an "anchor" when it is too deep for the carried project but the top level can take it` |
| E362 | F27 | active; internal | `TREE-2.5: a top-level row > is "neither" when the carried subtree, already past the cap, fits nowhere, not even at the top level` |
| E363 | F27 | active; internal | `TREE-2.4: is an "anchor" when its own parent can take the carried project` |
| E364 | F27 | active; internal | `TREE-2.4: is "neither" when its own parent can not, at any depth below it` |
| E365 | F27 | active; internal | `TREE-2.1, TREE-2.4: has no tier, and its descendants are "neither" at every depth` |
| E366 | F28 | active; internal | `TREE-4.12: changes the moved node’s parent and nothing else: no position moves` |
| E367 | F28 | active; internal | `TREE-4.12: puts the node under the parent it names, after the sibling it goes after, whatever its position` |
| E368 | F28 | active; internal | `TREE-4.12: does not change the nodes or the moves it is given, and skips a node that is gone` |
| E369 | F29 | active; internal | `TREE-1.3: a null root (the sidebar’s virtual top) yields depth-0 rows with parentId null` |
| E370 | F29 | active; internal | `DRAG-4.8: leaves the excluded entries, and their descendants, out of the rows` |
| E371 | F29 | active; internal | `DRAG-8.8, TREE-2.9: holds every row under the item at any depth, with its children and the whole branch counted` |
| E372 | F29 | active; internal | `DRAG-8.8, TREE-2.9: counts a branch deeper than its children apart from them` |
| E373 | F29 | active; internal | `DRAG-8.8, TREE-2.9: is null for an item with nothing under it, since nothing is carried` |
| E374 | F29 | active; internal | `DRAG-8.8, TREE-2.9: never holds the item itself` |
| E375 | F29 | active; internal | `DRAG-4.8: depthRangeFor > the gap between S1a1 (Top, depth 2) and S2 (Bottom, depth 0) offers depths 0–3` |
| E376 | F29 | active; internal | `DRAG-4.8: depthRangeFor > the gap between S1 and S1a (Bottom is Top’s own child) offers exactly one depth` |
| E377 | F29 | active; internal | `DRAG-4.8: depthRangeFor > DRAG-4.11: above the first item (no Top) offers depth 0 only` |
| E378 | F29 | active; internal | `DRAG-4.8: depthRangeFor > DRAG-4.11: below the last item (no Bottom) offers depth 0, the root’s children, up to Top + 1` |
| E379 | F29 | active; internal | `DRAG-4.8: depthRangeFor > DRAG-4.11: an empty hierarchy offers depth 0 only` |
| E380 | F29 | active; internal | `DRAG-4.8, DRAG-4.9, DRAG-4.10: resolvePlacement — the worked gap > DRAG-4.9: Top + 1 (depth 3) is Top’s first child — S1a1 has none, so no anchor` |
| E381 | F29 | active; internal | `DRAG-4.8, DRAG-4.9, DRAG-4.10: resolvePlacement — the worked gap > DRAG-4.9: Top’s own depth (2) is Top’s sibling, after Top’s whole subtree` |
| E382 | F29 | active; internal | `DRAG-4.8, DRAG-4.9, DRAG-4.10: resolvePlacement — the worked gap > DRAG-4.10: one tab left (depth 1) is a sibling of Top’s parent, after its subtree` |
| E383 | F29 | active; internal | `DRAG-4.8, DRAG-4.9, DRAG-4.10: resolvePlacement — the worked gap > DRAG-4.10: two tabs left (depth 0, Bottom’s depth) is a sibling of Top’s grandparent` |
| E384 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > above the first item: first child of the root, before S1` |
| E385 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > below the last item at depth 0: sibling after S2, under P` |
| E386 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > below the last item at depth 1 (Top + 1): first (and only) child of S2` |
| E387 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > Bottom is Top’s own child: first child of S1, before S1a` |
| E388 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > an empty hierarchy offers the root’s sole child, no anchor` |
| E389 | F29 | active; internal | `DRAG-4.11: resolvePlacement — the boundaries > TREE-1.4: an empty hierarchy under a null (sidebar virtual) root reads parentId null` |
| E390 | F29 | active; internal | `TREE-1.5: resolvePlacement — a Top whose children are hidden from rows (a collapsed Top) > Top + 1 still resolves to Top’s real first child, not the next row` |
| E391 | F29 | active; internal | `TREE-1.5: resolvePlacement — a Top whose children are hidden from rows (a collapsed Top) > the dragged subtree is excluded from that lookup too` |
| E392 | F29 | active; internal | `DRAG-4.8: enumerates every depth in the gap’s range with its resolved placement` |
| E393 | F29 | active; internal | `DRAG-4.18: validity is per state, decided by the caller from the resolved parentId — not per gap` |
| E394 | F29 | active; internal | `DRAG-4.18: excludes the dragged subtree, so no depth can ever resolve a cycle` |
| E395 | F29 | active; internal | `DRAG-4.11: clamps to the gap's own hi when the delta pushes past it` |
| E396 | F29 | active; internal | `DRAG-4.11: clamps to the gap's own lo when the delta pushes past it` |
| E397 | F30 | active; surface | `DRAG-2.10: carries the item depth cap the API enforces` |
| E398 | F30 | active; surface | `TC-2.16: surfaces items whose workphase was deleted as invalidItems (Unknown status)` |
| E399 | F31 | active; surface | `TC-2.6: a create with no anchor goes after the true last Free item, in whichever workphase it is` |
| E400 | F31 | active; surface | `TC-2.17: a parentless item that holds the attachment flag has positionScope "workflow"` |
| E401 | F32 | active; surface | `TREE-4.2: lists projects by position, then creation time, a missing position first` |
| E402 | F32 | active; surface | `TREE-4.5: a move that reindexes discloses every renumbered sibling, the moved project included` |
| E403 | F32 | active; surface | `TREE-4.6: a create, and an edit that changes the parent, disclose a reindex too` |
| E404 | F32 | active; surface | `TREE-4.1: a project write compares and renumbers positions only among the siblings the project ends with` |
| E405 | F33 | active; surface | `DRAG-1.1, DRAG-5.9: a Stub's drag starts at its containing Card's Descendants layer, and a same-parent reorder commits with no pop at all` |
| E406 | F33 | active; surface | `DRAG-1.1, DRAG-5.13: a grandchild Stub's drag starts in its containing Card's whole section, not its parent Stub's sub-list` |
| E407 | F33 | **skipped**; surface | `DRAG-5.13: a grandchild Stub popped out to its containing Card's layer keeps its row and its own children drawn, and a release there writes nothing` |
| E408 | F33 | active; surface | `DRAG-5.1, DRAG-5.10: a pop out of the section detaches the Stub into its own column — attachment clears, parentId and the inherited workphase are preserved, and it renders as a Card` |
| E409 | F33 | active; surface | `DRAG-1.14: a yank past the pop-out distance, with every clock off, pops Descendants -> Column, and an immediate release detaches` |
| E410 | F33 | active; surface | `DRAG-5.4, DRAG-4.12: zoomed into a different Card instead, it reparents — attached as that Card's last child, never a detach that leaves parentId at P` |
| E411 | F33 | active; surface | `DRAG-5.16: immediately after a detach, the same item drags and reorders normally as a Card` |
| E412 | F34 | active; surface | `DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered, with every attached descendant at its level` |
| E413 | F34 | active; surface | `DRAG-7.7: any of the section’s overflow rows opens the same modal, the Card’s whole hierarchy` |
| E414 | F34 | active; surface | `DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written` |
| E415 | F34 | active; surface | `DRAG-7.9: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child` |
| E416 | F34 | **skipped**; surface | `DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1’s last child, after R1a` |
| E417 | F34 | active; surface | `DRAG-7.9, DRAG-7.19: set back down in its own gap and depth, an item writes nothing, and the modal stays open where it is` |
| E418 | F34 | active; surface | `DRAG-7.9, DRAG-7.12: a tab state past the depth cap is reachable in the modal and writes nothing, and the rows carry the drag’s classification` |
| E419 | F34 | **skipped**; surface | `DRAG-7.6, DRAG-7.10, DRAG-7.11: resting outside the modal’s box pops out of it, the modal closes and the drag is at the Card layer, where a release sets the Stub back down and writes nothing` |
| E420 | F34 | active; surface | `DRAG-7.10: a pop out of the modal, past the Card’s box, detaches the item, as from the section` |
| E421 | F34 | active; surface | `DRAG-7.10: the modal’s header is part of the modal: a cursor resting over it pops nothing` |
| E422 | F34 | active; surface | `DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag` |
| E423 | F34 | active; surface | `DRAG-7.19: after a release in the modal it stays open where it is, showing the item where it landed, marked pending until the response lands` |
| E424 | F34 | active; surface | `DRAG-7.19: Escape during a drag in the modal cancels the drag and leaves it open; with no drag running, Escape closes it` |
| E425 | F34 | **skipped**; surface | `DRAG-7.2, DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card’s last child, and the overflow row leaves it out of its count` |
| E426 | F34 | **skipped**; surface | `DRAG-7.2: with R’s only attached child dragged, back in the section R has no overflow row` |
| E427 | F34 | **skipped**; surface | `DRAG-7.6: back in the section, a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing` |
| E428 | F34 | active; surface | `DRAG-7.10: a brief excursion out of the modal, shorter than the pop-out delay, leaves the drag in it` |
| E429 | F34 | active; surface | `DRAG-7.23, DRAG-7.25: after a release in the modal whose write failed, the reloaded board leaves it open, centered, with the rows as the server has them` |
| E430 | F34 | active; surface | `DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open` |
| E431 | F34 | active; surface | `DRAG-7.26: the modal closes when the reloaded board no longer has its Card` |
| E432 | F34 | active; surface | `DRAG-7.26: the modal closes when the reloaded board leaves its Card with no attached descendants` |
| E433 | F34 | active; surface | `DRAG-7.28: a click on a row in the modal opens that item’s Sheet above it` |
| E434 | F34 | active; surface | `DRAG-7.28: carrying a row in the modal opens no Sheet, and the release still places by gap and depth` |
| E435 | F34 | **skipped**; surface | `DRAG-7.32: closing the Sheet over the hierarchy modal, by Escape, its X or its backdrop, returns to the modal as it was` |
| E436 | F34 | active; surface | `DRAG-7.33: a child link in the Sheet replaces the Sheet over the same modal, down to the last child` |
| E437 | F34 | active; surface | `DRAG-7.34: an edit made in the Sheet appears in the open modal, which is not closed and reopened` |
| E438 | F34 | active; surface | `DRAG-7.35: the modal closes at once when its last attached descendant is detached from its open Sheet, and the Sheet closed by ${way} returns to the board` |
| E439 | F35 | active; surface | `DRAG-7.13: a hold above R’s overflow row is a silent dwell, then a cue on the row, ending in the modal opening` |
| E440 | F35 | active; surface | `DRAG-7.13: a release before the cue completes commits where the ghost is, and the modal never opens` |
| E441 | F35 | active; surface | `DRAG-7.13: any item at the layer opens it: B, below the overflow row, as R’s last child` |
| E442 | F35 | active; surface | `DRAG-7.14: the hold starts over when the ghost changes level or gap` |
| E443 | F35 | **skipped**; surface | `DRAG-7.14: the hold runs only with the cursor inside the section: resting outside it ends the hold` |
| E444 | F35 | active; surface | `DRAG-7.14: the carried copy moving within the gap, across the ghost’s middle, does not reset the hold` |
| E445 | F35 | active; surface | `DRAG-7.15, DRAG-7.19: the modal opens with the ghost’s spot under the cursor, so a release right after commits the same placement, and the modal stays where it opened` |
| E446 | F35 | **skipped**; surface | `DRAG-7.15: held from above, down to the gap below R’s overflow row, the modal opens with the ghost’s spot under the cursor, and a release right after commits it` |
| E447 | F35 | **skipped**; surface | `DRAG-7.15: the same hold for an item with a child of its own, whose subtree travels with it` |
| E448 | F35 | active; surface | `DRAG-7.15: held from above, down to the gap above R’s overflow row, the modal opens with the ghost’s spot under the cursor, and a release right after commits it` |
| E449 | F35 | active; surface | `DRAG-7.15: the same hold, down to the gap above R’s overflow row, for an item with a child of its own, whose subtree travels with it` |
| E450 | F35 | active; surface | `DRAG-7.25: after a reload that follows a release in it, a modal a hold opened is centered` |
| E451 | F35 | active; surface | `DRAG-7.25: after a reload that lands mid-drag, a modal a hold opened is centered` |
| E452 | F35 | active; surface | `DRAG-7.16: a modal kept inside the window at the bottom edge reads the ghost afresh from the cursor` |
| E453 | F35 | active; surface | `DRAG-7.16: a modal kept inside the window at the top edge reads the ghost afresh from the cursor` |
| E454 | F35 | active; surface | `DRAG-7.16: a modal kept inside the window at the right edge reads the depth at the cursor’s x` |
| E455 | F35 | active; surface | `DRAG-7.17: when R’s children run longer than the modal, its list scrolls to put the ghost’s spot under the cursor` |
| E456 | F35 | **skipped**; surface | `DRAG-7.17: from the gap above R’s overflow row, a list that scrolls puts the ghost’s spot under the cursor too` |
| E457 | F35 | **skipped**; surface | `DRAG-7.12: a modal a hold opens carries the drag’s classification: a row too deep for the dragged item is de-emphasized, and R is not` |
| E458 | F35 | **skipped**; surface | `DRAG-7.10, DRAG-7.18: after leaving a modal a hold opened, a hold beside an overflow row opens it again in the same drag` |
| E459 | F35 | active; surface | `DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits` |
| E460 | F36 | active; surface | `DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children` |
| E461 | F36 | active; surface | `DRAG-7.1, DRAG-7.2: the levels count from the Card, and one hidden child reads "1 child"` |
| E462 | F36 | active; surface | `DRAG-7.1: with the level count one higher, R1 and R2 show at the new last level, R1 has an overflow row for R1a, and R has none` |
| E463 | F36 | active; surface | `DRAG-7.3, DRAG-7.2: between a row and its overflow row, the one state is the row’s first child` |
| E464 | F36 | active; surface | `DRAG-7.4, DRAG-7.2: below an overflow row, the item is the row’s last child, and none lies right of the overflow row` |
| E465 | F36 | active; surface | `DRAG-7.4: tabbed left of the overflow row, the item is R’s next sibling, after its hidden levels` |
| E466 | F36 | active; surface | `DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only attached child` |
| E467 | F36 | active; surface | `DRAG-7.1: the drop math takes the level count the section is drawn with` |
| E468 | F36 | active; surface | `DRAG-7.4: with no row below the overflow row at its level, B is Bottom, and the states run from the first level to the hidden children’s level` |
| E469 | F36 | active; surface | `DRAG-7.22: a press and drag from an overflow row’s count starts no drag, and a click on it opens the modal, not the Card’s Sheet` |
| E470 | F36 | active; surface | `DRAG-7.24: a press on an overflow row’s indent is the Card’s: it carries the Card, and a click opens the Card’s Sheet, not the modal` |
| E471 | F36 | **skipped**; surface | `DRAG-7.27: a dragged R carries its overflow row, which is never a neighbor, and at the first level its children show` |
| E472 | F36 | active; surface | `DRAG-7.29: the side highlight can name an overflow row, and a release still places by gap and depth` |
| E473 | F36 | active; surface | `DRAG-7.29: from the gap below the overflow row, at its level, the line is drawn on the overflow row, and a release places by gap and depth` |
| E474 | F37 | active; surface | `DRAG-3.1, DRAG-3.2, DRAG-3.11: the top band places before the first item, the bottom band after the last` |
| E475 | F37 | active; surface | `DRAG-3.17: the reservation invariant — hovering a region never changes its own rendered height, for a positional, an empty, and a terminal-with-cards region alike` |
| E476 | F37 | active; surface | `DRAG-3.17: the reservation invariant — an expanded column's own empty sub-row doesn't shift by its droppable padding either` |
| E477 | F37 | active; surface | `DRAG-3.3, DRAG-3.11: the middle band released before THRESHOLD is a workphase-only move — position kept, the hovered card ignored` |
| E478 | F37 | active; surface | `DRAG-3.4, DRAG-1.3, DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side` |
| E479 | F37 | active; surface | `DRAG-1.3, DRAG-1.12: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left` |
| E480 | F37 | active; surface | `DRAG-3.2: popped out, a release in a column is still that column's band` |
| E481 | F37 | active; surface | `DRAG-1.5, DRAG-1.23: a card is locked to each context it pops into in turn — In Progress, then Review` |
| E482 | F37 | active; surface | `DRAG-1.23: a reorder onto the first card lands in the first slot, even with the cursor passing over another column on the way` |
| E483 | F37 | active; surface | `DRAG-1.9: at Board layer, a release between columns writes nothing and leaves the card where it was` |
| E484 | F37 | active; surface | `DRAG-3.6, DRAG-3.7: a merged column takes the entry workphase for an outsider and leaves a covered-set member alone` |
| E485 | F37 | active; surface | `DRAG-3.8, DRAG-1.6: an expanded column resolves per sub-row — exact workphase, first/last of that sub-row` |
| E486 | F37 | active; surface | `DRAG-3.9: a done column produces no anchor — every band is a workphase-only move` |
| E487 | F37 | active; surface | `DRAG-3.10: an empty column is a workphase-only move in any band` |
| E488 | F37 | active; surface | `DRAG-6.1, DRAG-6.2: the drop is drawn at its slot and marked pending until the response lands, then settles unchanged` |
| E489 | F37 | active; surface | `DRAG-6.5: re-dragging a pending item — the later write wins even when its response lands first` |
| E490 | F37 | active; surface | `DRAG-6.6: a refused drop is not kept — the board reloads and shows the item where the server has it` |
| E491 | F38 | active; surface | `DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified at pickup, stays classified while hovering, and clears on cancel` |
| E492 | F38 | active; surface | `DRAG-2.8: a Stub drag is classified exactly like a Card would be — no blanket exclusion` |
| E493 | F39 | active; surface | `TC-6.4: a done column lists its items by when they were completed, oldest first` |
| E494 | F40 | active; surface | `DRAG-1.23: 1.b — drag C below card E, into the empty column space` |
| E495 | F40 | active; surface | `DRAG-1.24: 3.a — set C back down in its own slot, leaning up: "after A"` |
| E496 | F40 | active; surface | `DRAG-1.24: 3.b — set C back down in its own slot, leaning down: "before E"` |
| E497 | F40 | active; surface | `DRAG-1.9: 5.a — hover C over Column Two, then release on an Unknown-status card` |
| E498 | F41 | active; surface | `DRAG-1.24: 3.a — set C back down in its own slot, leaning up: "after A"` |
| E499 | F41 | active; surface | `DRAG-1.24: 3.b — set C back down in its own slot, leaning down: "before E"` |
| E500 | F42 | active; surface | `TREE-11.2: collapses and expands subprojects via the chevron` |
| E501 | F43 | active; surface | `TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement` |
| E502 | F43 | active; surface | `TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows` |
| E503 | F43 | active; surface | `TREE-1.12: a release saves the placement as a move naming a neighbor, never a position` |
| E504 | F43 | **skipped**; surface | `TREE-1.4: when the dragged project’s subtree holds every project, no line is drawn and a release writes nothing` |
| E505 | F43 | active; surface | `TREE-1.11, TREE-3.9: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing` |
| E506 | F43 | active; surface | `TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing` |
| E507 | F43 | active; surface | `TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap` |
| E508 | F43 | **skipped**; surface | `TREE-2.1: the dragged project’s descendants are dimmed for the whole drag` |
| E509 | F43 | active; surface | `TREE-2.2: a collapsed project opens when a project is dropped into it as its child > as its child, T opens, showing X, T1 and T2 under it` |
| E510 | F43 | active; surface | `TREE-2.2: a collapsed project opens when a project is dropped into it as its child > as its sibling, T stays collapsed` |
| E511 | F43 | active; surface | `TREE-2.3: a collapsed project opened by a drop stays open if the move fails` |
| E512 | F44 | active; surface | `TREE-11.1: existing and newly created projects start open` |
| E513 | F44 | active; surface | `TREE-11.2: a chevron collapse hides the subtree until opening or reload` |
| E514 | F44 | active; surface | `TREE-11.3: a successful create opens its collapsed parent from either create entry point` |
| E515 | F44 | active; surface | `TREE-11.4: a failed create leaves its parent collapsed` |
| E516 | F44 | active; surface | `TREE-11.5: a successful parent change opens the collapsed new parent` |
| E517 | F44 | active; surface | `TREE-11.6: a failed parent change leaves the new parent collapsed` |
| E518 | F44 | active; surface | `TREE-11.7: a rename or an edit keeping the same parent leaves that parent collapsed` |
| E519 | F44 | active; surface | `TREE-11.8: a top-level create or parent change opens no unrelated project` |
| E520 | F45 | active; surface | `TREE-4.3: the sidebar shows each project’s children by position, then creation time` |
| E521 | F45 | active; surface | `TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt` |
| E522 | F45 | active; surface | `TREE-4.4: the sidebar sorts a project with no position as if its position were 0` |
| E523 | F45 | active; surface | `TREE-4.7: the sidebar applies the renumbered pairs, so it shows the server’s order without a reload > a drag of X under P, after B` |
| E524 | F45 | active; surface | `TREE-4.7: the sidebar applies the renumbered pairs, so it shows the server’s order without a reload > a create under P` |
| E525 | F45 | active; surface | `TREE-4.7: the sidebar applies the renumbered pairs, so it shows the server’s order without a reload > an edit of X’s parent to P` |


## Lost Coverage

### Whole-catalog mandatory scan

**No Automated case has lost every active ID-bearing test.** All 317 initially Automated cases have at least one unskipped leaf carrier, directly or through a describe. No Automated case is skip-only. The whole-catalog scan covers 482 real case bodies and 1,591 leaf test declarations across 106 Vitest/Playwright source files. README examples and duplicate summary-table rows are excluded. Parameterized/looped source declarations are counted once, not as runtime executions. Global checks inspect ID/skip identity; they do not claim a whole-Then review of the 234 out-of-scope cases.

**Four semantic reopenings are still required inside scope**, despite surviving active IDs:

| Case | Why active titles are insufficient | Disposition |
|---|---|---|
| DRAG-3.9 | One incoming done drop and pure preview do not assert the two-completion/all-aim anchor-free rule and complete single-band geometry. | Automated → Open; Automation — |
| DRAG-3.10 | One empty active drop plus request shape do not assert h-tall single-zone geometry/anywhere release and empty-terminal geometry. | Automated → Open; Automation — |
| DRAG-7.9 | The only last-child-after-R1a outcome is skipped. Three active tests cover three other outcomes. | Automated → Open; Automation — |
| TC-6.4 | Distinct completion-order rendering is checked, but absent stored positions are not. Tie behavior is separately delegated to TC-6.10. | Automated → Open; Automation — |

DRAG-7.2 retains Automated under its existing approved count abstraction plus surface count tests. Its internal test moved from itemListOps.test.ts to descendantsSection.test.ts; that old path is the only stale Automated pointer found in the whole catalog. The pointer is repaired to the current same-ID count test. This follows the existing mapping through the file split, rather than approving another internal rule. DRAG-7.11 retains its active painted modal-isolation surface plus the standing-category pop-clock test, so its skipped obsolete exit test does not erase whole coverage.

### Skipped declarations

There are **24 skipped E2E declarations in eight files: 16 with case IDs, eight without**. No unit test is skipped; no additional suite-level/conditional skip, fixme or todo declaration was found. A skipped declaration is listed below only for inventory and rework, never as passing coverage. The report does not decide the skips' fate; Phase 2 step 3 and D3 do.

| File | Exact skipped title | IDs |
|---|---|---|
| `tests/ui/drag-5-stub-detach.spec.ts` | `DRAG-5.13: a grandchild Stub popped out to its containing Card's layer keeps its row and its own children drawn, and a release there writes nothing` | DRAG-5.13 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1’s last child, after R1a` | DRAG-7.9 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.6, DRAG-7.10, DRAG-7.11: resting outside the modal’s box pops out of it, the modal closes and the drag is at the Card layer, where a release sets the Stub back down and writes nothing` | DRAG-7.6, DRAG-7.10, DRAG-7.11 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.2, DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card’s last child, and the overflow row leaves it out of its count` | DRAG-7.2, DRAG-7.6 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.2: with R’s only attached child dragged, back in the section R has no overflow row` | DRAG-7.2 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.6: back in the section, a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing` | DRAG-7.6 |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.32: closing the Sheet over the hierarchy modal, by Escape, its X or its backdrop, returns to the modal as it was` | DRAG-7.32 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.14: the hold runs only with the cursor inside the section: resting outside it ends the hold` | DRAG-7.14 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.15: held from above, down to the gap below R’s overflow row, the modal opens with the ghost’s spot under the cursor, and a release right after commits it` | DRAG-7.15 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.15: the same hold for an item with a child of its own, whose subtree travels with it` | DRAG-7.15 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.17: from the gap above R’s overflow row, a list that scrolls puts the ghost’s spot under the cursor too` | DRAG-7.17 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.12: a modal a hold opens carries the drag’s classification: a row too deep for the dragged item is de-emphasized, and R is not` | DRAG-7.12 |
| `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.10, DRAG-7.18: after leaving a modal a hold opened, a hold beside an overflow row opens it again in the same drag` | DRAG-7.10, DRAG-7.18 |
| `tests/ui/drag-7-overflow-row.spec.ts` | `DRAG-7.27: a dragged R carries its overflow row, which is never a neighbor, and at the first level its children show` | DRAG-7.27 |
| `tests/ui/drag-card-zoom-in.spec.ts` | `a Card in a different column: pop out, pop into its column, then zoom into it and attach` | none |
| `tests/ui/drag-card-zoom-in.spec.ts` | `a Card in the drag's own column: pop out, pop back in, then zoom into it and attach` | none |
| `tests/ui/item-repositioning-cross-column-dnd.spec.ts` | `1.a — drag C onto card A` | none |
| `tests/ui/item-repositioning-cross-column-dnd.spec.ts` | `2.a — drag C onto card B` | none |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | `1.a — drag C onto card A` | none |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | `2.a — from the root board, drag C onto card B` | none |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | `2.b — from the root board, drag C onto card E (same gap as "after D")` | none |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | `4.b — from the root board, drag D onto card A (before A)` | none |
| `tests/ui/project-tree-drag.spec.ts` | `TREE-1.4: when the dragged project’s subtree holds every project, no line is drawn and a release writes nothing` | TREE-1.4 |
| `tests/ui/project-tree-drag.spec.ts` | `TREE-2.1: the dragged project’s descendants are dimmed for the whole drag` | TREE-2.1 |

DRAG-7.32 was Open before its Phase 1 skip and stays Open: only its approved dismissal-guard component remains active, leaving all surface dismissal/list/scroll/place obligations to close. DRAG-7.18 has only a skipped carrier. The unlabelled six legacy repositioning and two zoom skips cannot be mapped just by their old scenario names; rederive their quick/held meanings against current DRAG-3/DRAG-4 before stamping, replacing or deleting them.

## Unknown IDs

**None across the whole catalog scan.** Every qualified ID claimed in a test or enclosing describe title names a current case. No title has an ID only in a trailing/mid-title position. Constructed parameter titles retain literal case prefixes and are included. No retired ID is restored from an archived report.

**Manual cases with ID-bearing tests: none**, active or skipped, across the whole catalog. DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25 and DRAG-7.20 are untouched.

## Proposed Stamps

These are writer-owned title changes or extensions for existing cases, **not catalog edits made here**. A candidate without the case ID counts for no coverage. An added ID does not close a residual assertion gap or supply internal approval. Exact file/title references follow.

| Case | Current candidate and proposed action | Countable portion / remaining limit |
|---|---|---|
| DRAG-7.28 | `tests/ui/drag-7-hierarchy-modal.spec.ts` — `DRAG-7.9: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child` | Add DRAG-7.28 alongside its current ID; it proves saved R2-before-R1a order missing from the current DRAG-7.28 drag. Alternatively extend the DRAG-7.28 release test. Surface mapping requires no approval. |
| ATT-4.9 | `tests/ui/drag-target-classification.spec.ts` — `DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.4, DRAG-2.7, DRAG-2.10: every visible target is classified at pickup, stays classified while hovering, and clears on cancel` | Extend this surface with exhaustive same-starting-state attached-parent API replay, then add ATT-4.9. Current classification by itself proves no parity replay. |
| BCU-5.6 | `client/src/components/workflow/useItemManagement.test.ts` — `takes the badge down once P’s answer lands, with its Attached descendants no longer unknown` | Coder may add BCU-5.6 for its predicate transition if the internal mapping is approved. Extend or add separate surface evidence for initial/exact board response, expanded rows, badge, W1 placement and fresh read. |
| BCU-5.6 | `client/src/components/workflow/itemWriteReconciliation.test.ts` — `moves the attached descendants of an item whose workphase the write changed, at any depth` | Candidate for workphase-propagation portion only after ID and approval; it starts from a known workphase and observes no board/badge. |
| BCU-5.7 | `client/src/components/workflow/itemWriteReconciliation.test.ts` — `stops at a detached child, which keeps its workphase with everything under it, and leaves other items` | Candidate for detached-link boundary only after ID and approval. Its F/FG stay in known todo, not Unknown; add the actual Unknown attention fixture and remaining outcomes. |
| DRAG-3.9 | `client/src/components/workflow/dragBands.test.ts` — `a terminal region is a single band regardless of card count` | Add ID only after accepting this geometry mapping; it proves no divider and middle result near both ends. It does not test bottom reservation, every surface aim or newest-completion placement. |
| DRAG-3.9 | `client/src/components/workflow/dragRequest.test.ts` — `TC-2.11: toRequest > DRAG-3.23: a done region never anchors — placementFor falls back to 'existing' for one, so toRequest never sees a first/last/anchor slot for it` | Add DRAG-3.9 for the already approved-category bare-workphase request with D1/D2 present. This needs a writer stamp but no new category approval; geometry and actual all-aim release still remain. |
| DRAG-3.10 | `client/src/components/workflow/dragBands.test.ts` — `an empty region is a single band` | Add ID after geometry approval; proves no divider and equal middle answers near the two ends, not h-zone reservation or empty terminal completion. |
| TREE-2.14 | `client/src/components/sidebar/useProjectDragReorder.test.ts` — `TREE-2.6: holds for the whole drag: a response that lands mid-drag redraws nothing` | Its newly added row has no snapshot entry and original tiers are held. Candidate partial stamp/approval only: it adds Late under X, not Y under near-cap T; no opacity, placement-candidate or next-pickup Mid assertion. |
| TREE-1.19 | `client/src/components/sidebar/projectTreeUtils.test.ts` — `TREE-1.17, TREE-1.18: resolveGap, the ghost takes the nearest row’s slot, counting the rows drawn > reads the order it is given, so the same row is the same gap however the rows have slid` | Candidate ID for pure row-order stability under supplied order, within approved ordering category. Physical still-pointer shuffle remains unproved. |
| TREE-1.19 | `client/src/components/sidebar/useProjectDragReorder.test.ts` — `keeps one gap under a still cursor, and the same row is the same gap however often it is hovered` | Candidate partial hook stamp needing approval; repeated supplied nearest-row inputs do not simulate moving hit boxes. |
| DRAG-1.17 | `client/src/components/workflow/popSession.test.ts` — `a Card’s Descendants layer is never a Board-layer target: the column under it is what a hover finds` | Candidate partial stack-rule stamp; no direct Board-to-Card target. New stack abstraction needs approval; remaining layer/gesture outcomes still need evidence. |
| DRAG-1.17 | `client/src/components/workflow/popSession.test.ts` — `a context clipped out of view pops to its structural parent, not straight to Board` | Candidate partial stack-parent stamp needing approval. It covers a missing-region parent transition, not the complete column/Descendants/sibling hop cases. |
| DRAG-1.27 | `client/src/components/KanbanCard.test.tsx` — `DRAG-3.25, DRAG-8.10: keeps its shortCard form’s one height, with the line hung outside its flow and its root unclipped` | Candidate tilt-presence stamp on supplied shortCard overlay, needing new component mapping approval. Actual pickup composition remains distinct from a component supplied as an overlay. |
| DRAG-4.20 / DRAG-4.22 | `client/src/components/workflow/popSession.test.ts` — `DRAG-1.4: holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone` | Potential additional clock-category ID for dwell-before-cue; the current same-Card/other-side and changed-Card reset tests can similarly take DRAG-4.22 for their asserted clock portions. A rendered cue/outcome still is not asserted by those tests. |

For TREE-1.8, TREE-1.11 and TREE-1.12, the existing approved line tests for TREE-1.1/TREE-1.9 are concrete candidates to supplement missing line clauses, but each new case/component association still needs approval and the writer's IDs. Their exact titles are in the scoped evidence register: SortableProjectRow.test.tsx, “TREE-1.1, TREE-1.9: draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet” and “TREE-1.1, TREE-1.9: keeps the line at full strength while the ghost is dimmed: it sits outside the dimmed box”. A surface extension avoids that new mapping.

## Proposed Internal Mappings (need approval)

No approval is granted by this report or the invocation. Approving a partial mapping counts only the stated part; every residual Open row remains a gap. No internal test is proposed beside a surface test already proving its whole case.

| Case/group | Exact candidates | Approval boundary |
|---|---|---|
| DRAG-1.28 | `client/src/components/workflow/dragOverlayGeometry.test.ts` — `DRAG-1.28: %s` | Carry the existing unapproved geometry proposal for supplied merged/sub-row/Card clamps; pure geometry is not either standing category. |
| DRAG-3.22 | `client/src/components/workflow/dragOverlayGeometry.test.ts` — `DRAG-3.22: on the board is the Card's width minus its content inset on both sides`; `client/src/components/workflow/dragOverlayGeometry.test.ts` — `DRAG-3.22: locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width`; `client/src/components/workflow/dragOverlayGeometry.test.ts` — `DRAG-3.22: keeps the pointer at the same fraction across the Stub's width, and on its vertical middle`; `client/src/components/workflow/placement.test.ts` — `DRAG-3.22, DRAG-1.35: across a real zoom-in (Column → Card’s Descendants layer) and pop-out (back to the column), the form switches both ways` | Carry existing visual form/width/re-anchor proposal. No rendered both-copy/shadow/continuous-gesture proof is inferred. |
| DRAG-4.12 | `client/src/components/KanbanCard.test.tsx` — `DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there` | Carry existing supplied one-row preview component proposal; no complete childless gesture or Free-child fixture. |
| TREE-1.14 | `client/src/App.pendingMove.test.tsx` — `TREE-1.14: a move refused after an earlier edit landed leaves that edit > returns X to its top-level place with Y still its child, each at its saved position` | Carry pending App retained-edit/refusal association. Current inherited describe correctly carries only TREE-1.14. It manually invokes release and mocks a cycle refusal, so cannot establish reachable Y or a real API 400/create path. |
| TREE-4.9 | `client/src/App.pendingMove.test.tsx` — `TREE-4.9: a release draws the move and its branch at once, and success keeps that placement > draws X between A1 and A2 under A, with X1 beneath it, before the answer, and a success leaves it` | Carry pending App released/success-tree association; exact before/answer tree and no-restoring render are meaningful, but same-fixture reload is absent. |
| TREE-2.12 | `client/src/App.pendingMove.test.tsx` — `TREE-2.12: every end of the drag draws the branch again under the project > draws X and its branch under Q at the release, before the answer, and a success leaves that tree` | App release/success tree is not included in the earlier approvals of this case's hook/component tests. Approve its release-state portion only; other ends, UI copy lifecycle and stored/no-write fields remain. |
| TREE-11.7 | `client/src/App.pendingMove.test.tsx` — `TREE-11.7: leaves P collapsed when the user collapses it before the rename is answered` | The 8.13 handoff explicitly leaves the TREE-11 App pair unapproved. This title checks collapse state after queued rename only. It lacks C, hidden C/X, saved new name/parent and explicit unchanged-parent variant. |
| DRAG-6.26 | `client/src/components/workflow/useBoardDnd.test.ts` — `DRAG-6.26: is reported once, with the cause and no item, when a failed column save reloads the board mid-drag`; `client/src/components/workflow/useBoardDnd.test.ts` — `DRAG-6.26: is reported with the cause "refresh" and no item when an armed stop fires, once, and spends the arm`; `client/src/components/workflow/useForcedStop.test.ts` — `DRAG-6.26: holds the banner and names no row to flash, through the reload and after it`; `client/src/components/workflow/useForcedStop.test.ts` — `DRAG-6.26: takes the place of a stop with an item, with a fresh banner and no flash`; `client/src/components/ForcedStopCue.test.tsx` — `DRAG-6.26: says the same for a column drag’s stop, which names no item, when the cause is %s` | Phase 1's new column-stop associations need approval; earlier item-stop approvals are not a blanket. Count cause/null-item, no flash ID, banner retention/expiry and text portions only. Real cause/load/focus/click/next-drag/fade gaps remain. |
| BCU-5.6 | `client/src/components/workflow/useItemManagement.test.ts` — `takes the badge down once P’s answer lands, with its Attached descendants no longer unknown`; `client/src/components/workflow/itemWriteReconciliation.test.ts` — `moves the attached descendants of an item whose workphase the write changed, at any depth` | New D11 hook and workphase cascade mappings require both IDs and approval. The non-ordering cascade and attention predicate are not pure drag-only ordering/request rules. Neither proves the complete surface/API case. |
| BCU-5.7 | `client/src/components/workflow/itemWriteReconciliation.test.ts` — `stops at a detached child, which keeps its workphase with everything under it, and leaves other items` | New D11 boundary association requires ID and approval, and actual Unknown-state/attention extensions. Do not call known todo preservation proof of an Unknown-attention outcome. |
| DRAG-3.9 / DRAG-3.10 | `client/src/components/workflow/dragBands.test.ts` — `a terminal region is a single band regardless of card count`; `client/src/components/workflow/dragBands.test.ts` — `an empty region is a single band` | New geometry associations require IDs and approval. The file's existing DRAG-3.5 approval is not approval of every case mapped to that file. |
| TREE-2.14 / TREE-1.19 / DRAG-1.27 / TREE-1.8 / TREE-1.11 / TREE-1.12 | The exact hook/component candidates in Proposed Stamps above. | New case associations only, not blanket approval of their files. Their other asserted or missing portions stay as listed. |
| DRAG-1.17 | `client/src/components/workflow/popSession.test.ts` — `a Card’s Descendants layer is never a Board-layer target: the column under it is what a hover finds`; `client/src/components/workflow/popSession.test.ts` — `a context clipped out of view pops to its structural parent, not straight to Board` | Stack rules are not automatically parameterized clock logic. Carry the narrow earlier candidate interpretation rather than expand the standing category. |

Existing approvals remain available for their exact earlier portions: the 8.9 classification/chrome/forced-stop hooks, the fixes story's board and sidebar hook/component partials, the approved App TREE-4.8/4.10/4.12 mappings, close-out TREE-1.1/TREE-1.9/TREE-2.9/TREE-4.14 and DRAG-6.29/DRAG-1.37, and TREE-9.4's collection mapping. None is asked again. DRAG-7.2's path correction follows its already approved count test through a split. Pure request/ordering and parameterized clock assertions already in the standing categories need writer IDs, not a new blanket approval.

## Proposed Manual (need approval)

**None.** The residual clauses have concrete outcomes. A flaky or skipped gesture is not itself a Manual ruling. Later D2/D3 evidence may support a cost/flakiness proposal, but this static baseline has no repeat-run evidence for one. The five existing feel/tuned-value Manual cases remain as written.

## Gaps

The 154 Open rows in Coverage Mapping are the complete scoped gap inventory; each names every ID carrier or explicitly “no test carrying ID”, the covered portion and the precise missing Then. The evidence register resolves every referenced path/title. This avoids giving the Architect a suite-level “needs more tests” task.

The following scheduling distinctions matter:

- **Reopened work now in this scope:** DRAG-3.9, DRAG-3.10 and TC-6.4 need the exact assertion extensions above, not a new product ruling. DRAG-7.9 needs last-child coverage even though three other active titles survive.
- **New cases:** TREE-2.14 and TREE-4.15 have no ID carrier. BCU-5.6/5.7 have no ID carrier and only the bounded D11 candidates above. Approval or a new stamp cannot substitute for their omitted surface/API clauses.
- **Existing implementation deferral:** TREE-1.14's newly arriving Y must remain a reachable candidate. The accepted story handoff records that current placement removes it along with its excluded parent. The manually called App refusal test bypasses the missing gesture. This is the existing accepted defect route, not a newly inferred runtime failure.
- **Modal/Sheet:** DRAG-7.28 needs saved order; DRAG-7.32 now needs active dismissal coverage as well as screen place; DRAG-7.33 closes against its current child-only rule.
- **Expansion:** TREE-11.2/11.4/11.6 now close on actual absence assertions. TREE-11.8 closes against its current delegation of initial N expansion. TREE-11.7 remains partial for the queued-edit window and its new mapping.
- **Response races:** TREE-9.4's moved-in X fixture must represent the saved subtree deletion. TREE-4.15 needs create/delete old-read scenarios in addition to TREE-4.14's rename/move cases.
- **Forced stops:** DRAG-6.22 follows the narrowed silent-cue rule, DRAG-6.25 still lacks an ID test, and live DRAG-6.26 has new unapproved partial internals. Keep the real failed-item, stale-pairs and failed-column-save causes distinct from an armed simulation.
- **Outside scope:** TC-6.13 remains Pending PO at Quick Items, TC-5.15/TC-6.11 retain that destination, ATT-5.11 retains its own pending route and ATT-1.10 its Planned boundary. This baseline neither invents those rulings nor completes D10's all-catalog destination inventory.

## Duplication

Reported without a deletion recommendation:

- DRAG-2.1/2.2/2.3/2.7 have both the classification surface and direct classifier tests; the surface is the counting whole-case mapping, so no redundant new classifier pointers are added.
- DRAG-6.1/6.2 deliberately combine the shared surface pending test with pure reconciliation, while DRAG-6.6 has request-level support beside its whole surface. The older A3 refusal of the latter internal mapping is not silently reversed.
- DRAG-4.8/4.9/4.10 have shared hierarchy worked-gap declarations plus projection/collision/branch drawing. They test different layers of the same relation; only the live drawing clause remains under DRAG-4.8.
- DRAG-7.2/7.3/7.4 share count-after-drop surfaces; current pure count evidence supplies the active dragged-child exclusions. DRAG-7.9/7.19 share own-gap no-write; DRAG-7.28's missing order overlaps the unshared first-child DRAG-7.9 surface proposed for stamping.
- TREE-1.8 and TREE-1.9 share a leave/return gesture but retain distinct obligations: unchanged/no-write versus returned ghost/line. TREE-1.1 and TREE-1.9's approved shared line component is additional structure evidence.
- TREE-2.9's branch hook, wording component, shared branch walk and wording formatter overlap intentionally: supplied counts do not independently prove hidden-tree counts.
- TREE-4.12's App request/preview test overlaps approved pure tree-order readers; TREE-4.8 combines surface failure paths with immediate-rollback App windows. TREE-4.9's App between-siblings fixture cannot borrow another case's reload.
- TREE-11.2's basic chevron surface duplicates the one-level part of the now-complete expansion surface. TREE-11.5's unapproved App parent-change candidate is unnecessary beside its complete surface, so no new mapping is proposed.
- D11's attached cascade unit and management-hook badge candidate overlap workphase propagation; only the hook observes the predicate. The detached unit's known-status scenario is not equivalent to BCU-5.7.

All exact duplicate test paths/titles are in the evidence register or Proposed Stamps; this report does not delete or consolidate them.

## Test Quality Concerns

1. **Skipped evidence is genuinely absent.** DRAG-7.9's active first-child, identity and invalid releases do not assert its skipped last-child outcome. DRAG-7.32's inactive surface cannot supply preserved order/scroll/dismissal behavior to its active component guard. Neither flake is attributed to Phase 1, and no stability pass is claimed.

2. **Current cases supersede archived gaps.** Expansion hidden-row assertions are now present and read the excluded names explicitly; filtered positive-name checks alone still would not prove absence. TREE-11.8 no longer owns N's initial preference. DRAG-7.33 now owns child links only. DRAG-6.22's removed live-column/no-cue clause is not demanded. TREE-2.14 is settled untiered, not Mid on its first draw.

3. **D11 is useful but partial.** The hook's P/C/G Unknown predicate transition is meaningful and would fail if attached descendants stayed Unknown. It does not render the attention badge or expanded tree and does not read board response lists. The direct cascade unit starts from known todo; preserving F/FG there cannot prove Unknown D/D1 keeps attention. These are not tautologies, but their titles must not be treated as complete BCU-5.6/5.7 outcomes.

4. **TREE-9.4's saved moved-in subtree is not represented.** Its seven scenario labels include a formerly unrelated X already saved under P or C; the shared delete response nevertheless returns X top-level, and the test expects X retained. The case/wiki project-tree §9 require that saved descendant to be removed with P. Fix that fixture/oracle before counting those variants. Other late P/C/N assertions remain useful partial coverage under the existing approval.

5. **Request count and saved order are separate oracles.** DRAG-5.4's final fields permit an intermediate committed detach. DRAG-1.9's unchanged fields permit redundant writes. DRAG-5.1's nonnull position does not establish after-Q. DRAG-5.16 drops before P, not after Q. DRAG-7.28's parent/projection does not establish saved sibling order. Each is kept Open for its exact residual.

6. **Geometry/classes do not prove painted outcomes.** Metadata and wrapper classes are meaningful unit evidence but do not establish computed tier/pulse strengths, equal rendered row heights, true pointer reach-through or physical shuffle. This is why DRAG-2.14–2.23, DRAG-3.19/3.22/3.25, DRAG-8 and the sidebar layout cases stay partial despite many stamped internals. Existing approved abstractions are retained within their asserted scope.

7. **The literal modal clock excursion is still the routed audit issue.** The active drag-7-hierarchy-modal.spec.ts DRAG-7.10 brief-excursion title runs two fixed 800ms excursions against a literal 1500ms setting. This baseline supplies no runtime flakiness verdict. Move the reset sequence to parameterized deterministic clock evidence and retain actual reachability/write outcomes in the browser; seed/read tuning through the helper. The mandatory case outcome remains, not those literal times.

8. **Obsolete skipped expectations need rederivation.** TREE-2.1's skipped title/body dims descendants rather than removing the branch; TREE-1.4 aims at rows now absent; several skipped modal/Stub tests still assume an intermediate Card layer or section-only bound. Unskipping them as written would assert old behavior. The exact titles appear in the skip register.

9. **Three new assertion-level reopenings are bounded.** DRAG-3.9/3.10 have useful release outcomes but do not prove all single-band geometry and anchor-free aims stated by the cases. TC-6.4 now waits for distinct completion stamps, so that ambiguity is fixed; it still never asserts stored positions absent. The tie rule is explicitly assigned to TC-6.10 and is not duplicated as a new gap.

10. **Expected values follow independent rules.** The cap-chain boundaries, fixed hierarchy parent/anchor examples, ordinal response fixtures and held read/write render histories use literal outcomes justified by the wiki. They are not expected results obtained by calling the function being tested. The DRAG-1.19 ordered parent-read trace now distinguishes one pop from its required two-pop cascade. For retained Automated cases the existing approved abstraction is respected; no automatic new surface requirement is imposed merely because a test is internal.

11. **Known uncertainty stays bounded.** No source finding here demonstrates a new runtime product failure. TREE-1.14 is the already recorded accepted implementation deferral. The seven modal flaky specs, DRAG-7.17's trace and two new skips retain Phase 4c/D2/D3 evaluation; no repeat count is invented, and nothing is made Manual for convenience.

## Uncatalogued Tests

Whole-catalog global checks did not force IDs onto the 760 leaf declarations lacking a catalog prefix. That count includes contract/support tests and old scenario tests, not 760 missing business cases. The scope's relevant candidates are separated above from these support examples.

| Kind | Exact file/title | Why no forced case |
|---|---|---|
| Support/contract | `client/src/components/workflow/dragStructure.test.ts` ? `keeps every field of the rect from an element whose getBoundingClientRect returns a DOMRect-shaped object` | DOMRect getter contract support; geometry premise rather than a standalone business scenario. |
| Support/contract | `client/src/components/BandGuides.test.tsx` — `keeps its cards mounted through every layer change of a drag` | Mount stability/coverage support; does not independently assert DRAG-3.20's guide visibility or DRAG-3.17's measured reservation. |
| Support/contract | `client/src/components/workflow/useBoardDnd.test.ts` — `does nothing with no drag running` | Callback guard outside a live drag; no new behavior case inferred. |
| Support/contract | `client/src/components/workflow/useForcedStop.test.ts` - `goes to a second stop’s item, which waits for its own reload` | Stop-key/replacement support, without a standalone case for the internal key. |
| Support/contract | `client/src/App.pendingMove.test.tsx` — `applies a read that no write has overtaken, as before` | Control for stale-read discrimination; does not supply TREE-4.15's missing create/delete scenarios. |
| Support/contract | `client/src/components/KanbanCard.test.tsx` — `does not slide: its sortable transition is off, so its rows are measured where it rests` | Measurement stability support; component transition-class expectation is not a separate product case. |

The D11 tests, terminal/empty band candidates, late-row candidate and unstamped shuffle/stack candidates in Proposed Stamps exercise parts of existing cases; they are not forced into new cases. Uncatalogued route shape/404 tests outside this scope remain outside the whole-Then review. MCP-only coverage remains a standing non-priority.

## Candidate New Cases

**No new case proposed in the scoped settled rules.** The current gaps fit existing IDs, including new TREE-2.14/TREE-4.15 and BCU-5.6/5.7. Do not add a new case to hide an existing missing clause.

One prior unresolved PO question remains visible from A6 rather than being codified: before the project cap has been read, the sidebar hook test “marks nothing invalid while the cap is unknown” in client/src/components/sidebar/useProjectDragReorder.test.ts pins permissive behavior. Wiki project-tree §3/hierarchy-placement §6 state common UI/API cap enforcement but do not settle this drag-loading window (create controls have their own explicit unread-cap rule). It is a PO gap if scheduled, not a new live case or a ruling for this story.

The earlier read-after-write candidate group is now represented by TREE-4.14/4.15; Unknown-status parent cascade by BCU-5.6/5.7. The source-read question, queued-write implementation, malformed-reference contract and live Unknown rename/delete candidates keep their existing destinations; this baseline creates no unrelated routing or catalog case.

## Totals

Counts are actual unique case bodies, excluding README examples and summary-table repetitions. Scoped and whole-catalog counts are kept separate. Priority is unchanged.


### Scoped cases after this run

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 29 | 49 | 11 | 89 |
| Open | 35 | 96 | 23 | 154 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 0 | 0 |
| Pending PO | 0 | 0 | 0 | 0 |
| **All** | 64 | 147 | 37 | 248 |

### Whole catalog after this run

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 111 | 147 | 60 | 318 |
| Open | 35 | 97 | 24 | 156 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **All** | 146 | 246 | 90 | 482 |

Before this run, scope held 88 Automated / 155 Open / 5 Manual; the whole catalog held 317 Automated / 157 Open / 5 Manual / 1 Planned / 2 Pending PO. Five Open → Automated promotions and four Automated → Open reopenings yield **scope 89 Automated / 154 Open / 5 Manual** and **whole 318 Automated / 156 Open / 5 Manual / 1 Planned / 2 Pending PO**. The two out-of-scope Open cases remain TC-5.15 and TC-6.11.

### Written fields and validation

- Promoted DRAG-7.33 and TREE-11.2/11.4/11.6/11.8, with their exact surface file pointers.
- Reopened DRAG-3.9/3.10/7.9 and TC-6.4, clearing each partial Automation pointer to —.
- Repointed DRAG-7.2's existing approved count test from itemListOps.test.ts to descendantsSection.test.ts.
- Synchronized only corresponding summary-table statuses. No Manual, Planned or Pending PO field changed.
- Validation: `npm.cmd run check:docs` passes (418 files, zero hits); `git diff --check` passes. A before/after field-mask check confirms only allowed fields changed in the four suite files. All 482 case bodies match their summary titles, priorities and statuses; the report has exactly 248 unique scoped decisions and 525 evidence entries. No app or test suite was run.

This report's exact residuals are the Architect's Phase 2 step 3 input. Proposed stamps, new internal associations, skip dispositions and any later Manual calls await their respective writer/approval steps; the baseline reconciliation itself is complete.


# Test reconciliation: Story 8.9 follow-up

Confirming writing run at committed HEAD `456581e` (Batch 5: `597d7c7`), 2026-11-04. The scope is the complete Story 8.9 plan, including Amendments 1–7, its open questions and handoff, the prior reconciliation's rulings, the audit's questions, and the roadmap's Story 8 close-out and Story 10 carry blocks. The current catalog and the wiki passages it cites govern the verdicts.

This is inspection of test source, not runtime validation. This Reconciler ran no application, tests, package installs or documentation gate. The parent's documentation checks are recorded under Totals. Shell use here was limited to reading/searching and disposable in-memory analysis; the catalog scan parsed the existing TypeScript test sources without executing them. Deleted probes are build evidence, never coverage. No agents were launched.

**Only DRAG-2.11 closes.** In `docs/test-plans/board-drag-interaction/drag-2-target-classification.md`, its table and body change from Open to Automated, and its Automation test line becomes `client/src/components/workflow/useBoardDnd.test.ts`. Nothing else in the catalog changes. All partial cases retain Open and `—`; DRAG-6.26 stays Planned. No Manual approval was given or inferred.

## Coverage Mapping

Evidence keys below identify the exact source file and test title. A key is a reference to that complete title, not an additional catalog pointer. All are unskipped unless explicitly marked. Internal approvals apply to the named mappings approved in the prior report, not to every test in the same file or every new case.

### Confirmed Batch 5 evidence

`client/src/components/workflow/useBoardDnd.test.ts`:

| Key | Exact test title | IDs and verdict |
|---|---|---|
| B1 | `DRAG-1.36: is the Card it is drawn under, when an ancestor’s attachment is still pending` | Approved, stamped, partial |
| B2 | `DRAG-1.36: is a Card whose own detach is still pending, which is drawn Free` | Approved, stamped, partial |
| B3 | `DRAG-2.11: counts depth through an ancestor whose attachment is still pending` | Approved, stamped |
| B4 | `DRAG-2.11: still sits one level down, for the depth of what is put under it` | Approved, stamped; B3 + B4 complete DRAG-2.11 |
| B5 | `DRAG-2.12, DRAG-2.23: classifies an item a pending attachment puts in the dragged Card as its descendant` | Approved, stamped, partial |
| B6 | `DRAG-2.12, DRAG-2.23: is still a descendant of its parent, and now a Card of its own, so an anchor` | Approved, stamped, partial |
| B7 | `DRAG-4.35: is the row dnd-kit announces over a move event that names the row before it` | Approved, stamped, partial |
| B8 | `DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing` | Existing approval; failed-column-save trigger, now explicitly in the case |
| B9 | `DRAG-6.16: is reported once, with the cause, when a failed write reloads the board mid-drag` | Approved, stamped; failed column save |
| B10 | `DRAG-6.16: is reported with the cause "refresh" when an armed stop fires, once, and spends the arm` | Approved, stamped; simulated refresh, not a stale response |
| B11 | `DRAG-6.22: is not reported for Escape or any other cancel` | Approved, stamped, partial |
| B12 | `DRAG-6.22: is not reported for a release that writes nothing` | Approved, stamped, partial |
| B13 | `DRAG-6.22: is not reported when a drag is cancelled before an armed stop fires` | Approved, stamped; correctly says cancelled |
| B14 | `DRAG-6.22: reloads the board when no drag is live` | Approved, stamped; failed column save without a live drag |

`client/src/components/workflow/dragClassification.test.ts`:

| Key | Exact test title |
|---|---|
| C1 | `DRAG-2.14: is "parent" for a legal parent, a Free Card or a Stub` |
| C2 | `DRAG-2.15, DRAG-2.16: is "anchor" for a Free Card that is no legal parent, whatever its parent, and for a Stub too deep under a legal parent` |
| C3 | `DRAG-2.15, DRAG-2.16, DRAG-2.17: is "neither" for a Stub whose parent is no legal parent, at any depth below it` |
| C4 | `DRAG-2.17: is one tier per item for a dragged Stub: its descendants "neither", its sibling and parent "parent"` |
| C5 | `DRAG-2.23: reads a descendant by the Stub test it is handed, not its stored attachment` |
| C6 | `DRAG-2.17: a Stub's own descendants are still Cycle-forming, the Free ones an anchor and the Stubs neither` (inside `DRAG-2.8: classifyDragTargets — Stub drag (full classification)`) |

These named internal mappings are approved and their stamps are present. They prove classification answers, not rendered opacity or gesture lifetime.

`client/src/components/dragChrome.test.tsx`:

| Key | Exact test title |
|---|---|
| R1 | `DRAG-2.15, DRAG-2.16: draws an anchor-only target and a target that is not even an anchor at their own strengths` |
| R2 | `DRAG-2.21: draws the tier on the content and never on the root` |
| R3 | `DRAG-2.14, DRAG-2.20: draws a legal parent, the carried copy and a row with no drag at full strength` |
| R4 | `DRAG-2.20: draws the dragged row at the ghost's own strength on its root, and at no tier` |
| R5 | `DRAG-2.18: draws an overflow row by its owner: a legal parent in full, anything else as neither` |
| R6 | `DRAG-6.23, DRAG-6.24: pulses a pending row's content, which keeps its tier, and not its root` |
| R7 | `DRAG-2.21: a Stub row's tier is on a wrapper around its button, and not on the row, which holds the drop line` |
| R8 | `DRAG-2.21, DRAG-6.24: a Card's tier is on its own content, and its Stubs are outside it, each at its own tier` |

These named mappings are approved and stamped. The hook/class and jsdom structure assertions do not measure compiled CSS.

Other approved/stamped cue tests:

| Key | File | Exact test title |
|---|---|---|
| F1 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.19: holds a reported stop for the cue’s time, and then lets it go` |
| F2 | `client/src/components/workflow/useForcedStop.test.ts` | `DRAG-6.18: lets it go at the next drag’s start, without waiting out the time` |
| F3 | `client/src/components/ForcedStopCue.test.tsx` | `DRAG-6.17: keeps an empty status element while no drag has been stopped, for assistive tech to announce into` |
| F4 | `client/src/components/ForcedStopCue.test.tsx` | `DRAG-6.16, DRAG-6.17: says why in the status element when the cause is %s` |
| F5 | `client/src/components/ForcedStopCue.test.tsx` | `DRAG-6.19: times its fade to the cue time` |

Sidebar/shared-walk evidence, all named approvals and stamps confirmed:

| Key | File | Exact test title or inherited describe + child title |
|---|---|---|
| S1 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `TREE-2.1: has none before a pickup, and none once the drag is released or cancelled` |
| S2 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `TREE-2.1: is "neither" for the dragged project’s descendants at every depth, and none for its own row, on a shallow tree` |
| S3 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `TREE-2.4: is "anchor" for a row past the cap whose own parent can take the project, and "neither" below it` |
| S4 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `TREE-2.6: holds for the whole drag: a response that lands mid-drag redraws nothing` |
| S5 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | describe `TREE-2.8: the strengths`; children `are the defaults the panel starts at, when nothing is stored`, `are read from storage at pickup, so a change in the panel takes effect on the next drag`, `are apart from the board’s three, which the sidebar never reads` |
| S6 | `client/src/components/sidebar/SortableProjectRow.test.tsx` | `TREE-2.1, TREE-2.8: draws the dragged row at the ghost’s strength, and it has no tier` |
| S7 | `client/src/components/sidebar/SortableProjectRow.test.tsx` | `TREE-2.7: draws the drop line outside the box the tier dims, so the line keeps its own strength` |
| T1 | `client/src/lib/dragTargets.test.ts` | describe `TREE-2.5: a top-level row`; children `is a "parent" when it can take the carried project`, `is an "anchor" when it is too deep for the carried project but the top level can take it`, `is "neither" when the carried subtree, already past the cap, fits nowhere, not even at the top level` |
| T2 | `client/src/lib/dragTargets.test.ts` | `TREE-2.4: is an "anchor" when its own parent can take the carried project` |
| T3 | `client/src/lib/dragTargets.test.ts` | `TREE-2.4: is "neither" when its own parent can not, at any depth below it` |
| T4 | `client/src/lib/dragTargets.test.ts` | `TREE-2.1, TREE-2.4: has no tier, and its descendants are "neither" at every depth` |

Surface evidence:

| Key | File | Exact test title |
|---|---|---|
| E1 | `tests/ui/drag-7-modal-hold.spec.ts` | `DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits` |
| E2 | `tests/ui/drag-7-hierarchy-modal.spec.ts` | `DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open` |
| E3 | `tests/ui/drag-5-stub-detach.spec.ts` | `DRAG-5.16: immediately after a detach, the same item drags and reorders normally as a Card` |
| E4 | `tests/ui/project-tree-drag.spec.ts` | **Skipped:** `TREE-2.1: the dragged project’s descendants are dimmed for the whole drag` |

All three Batch 5 surface stamps are present. E4 counts for no coverage.

### Full-case decisions and remaining clauses

| Case | Evidence | Decision and missing Then assertions |
|---|---|---|
| DRAG-1.36 | B1, B2 | Open: correct containing Card is asserted; its whole rendered box bounding the drag is not. |
| DRAG-2.11 | B3, B4 | **Automated:** pending-parent depth and the kept-parent depth of a pending detach are both asserted. The fixtures use equivalent cap/height boundaries; the approval stands. |
| DRAG-2.12 | B5, B6 | Open: pending item itself and pending detach are checked; no transitive Free `D → A → X` through `A`'s pending attach. |
| DRAG-2.14 | C1, R3 | Open: parent tier/class is checked; Full rendered Card and Stub content, unchanged legal-parent state and no relationship color are not jointly asserted. |
| DRAG-2.15 | C2, C3, R1 | Open: anchor/neither assignment is checked; actual named opacities, no relationship color, and both Free targets remaining namable for a column reposition are missing. |
| DRAG-2.16 | C2, C3, R1 | Open: cap boundary assignment is checked; rendered rows staying in place and a valid shallower state beside a rendered Low row are missing. E1 reaches a valid shallower state but carries neither DRAG-2.16 nor a Low-tier assertion. |
| DRAG-2.17 | C3, C4, C6 | Open: descendant tiers are checked; rendered Low descendants staying in place across pop/zoom, never becoming neighbors, and the branch's saved move are not jointly asserted. |
| DRAG-2.18 | R5 | Open: overflow-owner tier is checked; rendered Full/Low strengths, row staying in place and count semantics remain. |
| DRAG-2.19 | No ID-bearing test | Open: pickup tiers across every layer/modal and a response, clearing on drop/cancel/forced stop, and Full post-drop base strength lack a case-bearing test. Sidebar S4 is not this board scenario. |
| DRAG-2.20 | R3, R4 | Open: ghost/overlay/idle classes are checked; modal static rows and non-targets, rendered independent ghost/Low values and backdrop separation remain. |
| DRAG-2.21 | R2, R7, R8 | Open: wrapper isolation is checked; computed independent nested strengths and Full drop lines on Mid Card and Stub remain. |
| DRAG-2.22 | E1 | Open: Depth-capped owner's no-hold/no-modal clause is asserted. A Mid Card's no zoom dwell/progress/entry, and a Cycle-forming overflow owner passed over as a neighbor, remain; the latter's existing spec is skipped. |
| DRAG-2.23 | B5, B6, C5 | Open: pending attach into carried item and its pending-detached descendant are checked. Unrelated `D` previewed under `P` versus `Q`, and detached from `Q` while still Depth-capped, plus rendered results, remain. |
| DRAG-4.35 | B7 | Open: announced row updates projection gap. No painted side highlight, depth-0 `A,B,X,C`/depth-1 first-child writes, workphase, carried `XC`, or both approach directions are asserted. |
| DRAG-5.16 | E3 | Open: pickup is a column Card and saved Free/kept-parent fields are checked. Its second release targets `P` and asserts position before `P`; it never releases after `Q` or proves `{Q, after}`. Amendment 5's fallback stands. |
| DRAG-6.15 | B8, E2 | Open: failed column reorder stops a live item drag/no later write; failed item drop does so in the modal. No genuine stale response with reindex pairs lands mid-drag, and column/sub-row plus in-Card section outcomes are not covered for the complete trigger/surface matrix. |
| DRAG-6.16 | B9, B10, F4 | Open: cause report and literal sentences are now checked. Armed refresh is simulated. No actual stale-reindex cause path, banner over Loading board and reloaded board, or all three item surfaces. |
| DRAG-6.17 | F3, F4 | Open: persistent empty status and correct cause text are checked. No announcement retained across real loading/reload for the three resync causes, without changing focus. |
| DRAG-6.18 | F2 | Open: direct `clear()` is checked. Banner/board clicks keeping it up and real next pickup clearing it in both full/fade periods remain. |
| DRAG-6.19 | F1, F5 | Open: expiry and configured animation duration are checked. First three quarters fully visible, last-quarter fade, both causes and a reload not restarting lifetime remain. |
| DRAG-6.20 | No ID-bearing test; U1, U8, U9 below | Open: unstamped candidates identify the item/class/duration only. Two amber pulses, Free/expanded Stub/modal representations, changed server-saved location and unchanged placements remain. New internal mappings need approval. |
| DRAG-6.21 | No ID-bearing test | Open: no test leaves stopped `X` hidden in collapsed/overflow/closed-modal states and asserts no flash/substitute, no automatic open/scroll, and continuing banner. U9 is not that scenario. |
| DRAG-6.22 | B11–B14 | Open: cancel, no-write, cancelled arm and failed-column-save with no drag are partially checked. No complete no-live-drag item-failure/stale-response checks, live column interruption, or rendered no-banner/no-announcement/no-flash assertions. U5 is an unstamped partial candidate. |
| DRAG-6.23 | R6 | Open: pulse class beside tier is checked. Relative keyframe endpoints at Full/Mid/Low/ghost and ending the pending pulse while keeping the current tier remain. |
| DRAG-6.24 | R6, R8 | Open: content/root isolation and Stubs outside Card wrapper are checked. `P` alone/`S` alone/both pending, computed independent strengths and non-pulsing Full drop lines on Mid rows remain. |
| DRAG-6.25 | No ID-bearing or full candidate test | Open: no test starts the second column drag and interrupts it by each resync, restores `A,C,E`, then releases with no reorder/item write. B8 starts an item drag, not a column drag. |
| DRAG-6.26 | No test | **Planned, unbuilt:** cause-specific column banner/announcement/lifetime/no-flash is product work for the Architect. It is not a missing assertion on built behavior. |
| DRAG-6.27 | No ID-bearing test; U2–U6 | Open: hook candidates prove deadline start/expiry/early clears only. Board wiring, rendered two pulses, all real causes, a pickup during the playing window, and no replay on row redraw/new-drag end remain. New mapping requires approval and stamps. |
| DRAG-6.28 | No test driving late reveal | Open: neither hook nor row test opens a hidden item at `t0+d` or at/after `t0+F`. Remaining-window removal, no fresh full window, all three reveal surfaces, unchanged saved placements and no automatic reveal remain. This is a coverage gap, not a demonstrated implementation failure. |
| TREE-2.1 | S1, S2, S6, T4; skipped E4 | Open: tiers/classes/clearing checked; rendered named opacities, full-strength result after end and descendant non-neighbors through movement remain. |
| TREE-2.4 | S3, T2–T4 | Open: boundary assignment checked; computed strengths, opacity-only drawing and no removed row remain. |
| TREE-2.5 | T1 | Open: shared-walk root answer checked; sidebar's rendered all-top-level Mid/Low, descendants Low and separate dragged strength remain. |
| TREE-2.6 | S4 | Open: tier/variable identities survive a new row under `X`. Not the case's saved `P → Q` move, Full `P` retained on screen, clear on cancel and next pickup Mid. U10 covers a different pickup snapshot rule. |
| TREE-2.7 | S7 | Open: line outside dim box checked structurally. Computed Full line on Mid row, valid top-level state after Low `P_CAP`, and saved placement after `P1` before `B` with `X1` remain. |
| TREE-2.8 | S5, S6 | Open: configured sidebar values read at pickup, board values ignored and ghost class checked. Sidebar list property wiring, actual strengths and board retaining its own rendered values when sidebar changes remain. |
| TREE-1.14 | No ID-bearing test; U10 | Open: U10 retains descendant IDs when a new descendant appears. It does not drive `Y`'s saved response, offer/send the cyclic placement, receive 400, preserve both positions or exclude `Y` on next pickup. |
| TREE-1.15 | No ID-bearing test; U10 | Open: U10 retains a valid state after height growth. No release/refusal/no rollback of earlier save, next-pickup invalid/no-write, or shrink scenario followed by a valid next pickup/save. |
| TREE-1.16 | No test of moving a pickup descendant out | Open: no saved `Y → B` response, retained exclusion/own gap/no-write during this drag, or next-pickup inclusion and successful sibling placement. U10 only grows the subtree. |
| TREE-10.12 | W1–W3 below | Open: malformed/string/owner-order clauses have stamped route tests. Missing required `projectId` has only unstamped W4 and only a 400 assertion; null is absent. The full no-created-row and subsequent-valid-create assertions do not cover these omitted/null scenarios. |
| TREE-10.13 | No ID-bearing test; W5–W8 below | Open: existing delete tests are useful partial candidates. None proves the full owned and ownerless two-board/two-phase/dependent cleanup and cross-project-survivor scenario. Current follow-up server work, not Story 10. |

### Untagged and route evidence for the new/revised cases

`client/src/components/workflow/useForcedStop.test.ts`:

| Key | Exact current test title | What it actually asserts |
|---|---|---|
| U1 | `names the stopped item from the stop on, and has none before it` | Flash item ID initially null, then stopped `x` |
| U2 | `is held across the stop’s own reload, however long it takes: the clock starts when the board is drawn` | Wait for three flash lengths, full hook lifetime after `boardDrawn()` |
| U3 | `is let go once it has played, while the banner stays for its own time` | Flash expires independently while banner remains |
| U4 | `is let go when another reload starts after it has been drawn, so its rows don’t flash again` | Clear at another reload, stay clear at its draw, banner retained |
| U5 | `is not drawn at all by a reload that finishes with no stop behind it` | Reload/draw without report has no flash item ID |
| U6 | `is let go at the next drag’s start, with the banner` | Direct `clear()` immediately after report clears both; no actual pickup, no playing-window advance |
| U7 | `goes to a second stop’s item, which waits for its own reload` | A new reported stop resets waiting item/deadline |

| Key | File | Exact current test title |
|---|---|---|
| U8 | `client/src/components/dragChrome.test.tsx` | `flashes the row it names, for the flash’s length` |
| U9 | `client/src/components/dragChrome.test.tsx` | `leaves every other row, and every row while none is named, without it` |
| U10 | `client/src/components/sidebar/useProjectDragReorder.test.ts` | `holds the carried subtree, and the height the cap reads, for the whole drag` |
| U11 | `client/src/components/ForcedStopCue.test.tsx` | `draws a fresh banner for each stop, and keeps the one it has for a redraw of the same stop` |

U8/U9 call the row hook with a Card and a context ID, checking classes, data attribute and animation duration. They do not render a hidden-to-visible transition. U10 rerenders a new `X1a` under existing `X1`, retains the excluded-ID set and valid cap state, and never releases. U11 checks DOM element identity for equal/different stop keys, not computed fade progress through a reload.

All W keys are `server/tests/routes/workflows.test.ts`, surface tests that need no internal approval:

| Key | Exact current test title | Coverage |
|---|---|---|
| W1 | `TREE-10.12: returns 400 with a specific message when projectId does not reference an existing project` | 400 and projectId error; no explicit no-creation query here |
| W2 | `TREE-10.12: returns 400, and creates nothing, when projectId is empty or not a string` | Empty/boolean/number/object/arrays, no workflow for `P`, subsequent valid create accepted; neither omitted nor null |
| W3 | `TREE-10.12: refuses a projectId that is not a string ahead of the ownership check` | Array holding owning `Q`'s ID gets 400/projectId error, not ownership wording; `Q` retains `W` alone |
| W4 | `returns 400 when projectId is missing` | Untagged; 400 only |
| W5 | `deletes the workflow, its workphases, and boards/columns, but items survive with a null workphase` | Untagged owned delete, workflow and one board 404, one item survives with null workphase; no direct phase/column cleanup assertions |
| W6 | `removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete` | Untagged; workflow-level notifications removed through both delete routes, no unaffected notifications or ownerless variant |
| W7 | `does not fail on cross-project items inheriting the workflow` | Untagged; inherited child's item survives owned delete with null workphase |
| W8 | `deletes a workflow with a null projectId without touching any project's items` | Untagged; empty orphan workflow gone, other project's two items retain their phases, other workflow remains |
| W9 | `TREE-10.3: after the workflow a project uses is deleted, it uses the nearest one left above it, or none` | Existing separate case: owned-delete survivors enter inherited board's invalidItems; no ownerless or full cleanup fixture |

## Lost Coverage

Whole-catalog check: every one of the 305 Automated cases before this edit has at least one unskipped test carrying its ID in a qualifying title or inherited describe. No lost ID-bearing coverage and no required demotions were found. DRAG-2.11's added mapping makes 306 afterwards.

This check scans all 94 Vitest/Playwright test files under `client/src`, `server/tests` and `tests`, including lettered suites (`TC-5a`) and cross-cutting IDs (`TC-X`). It handles ID-bearing describes and excludes skipped/fixme/todo declarations and skipped ancestry. It does not claim a new full-Then review of every unrelated Automated case. Full-Then review in this run is the scope above.

## Unknown IDs

None in test titles, inherited describes, or the additional scan of test-file text/comments. No retired ID claim was found. All ID-bearing titles use the required prefix form.

None of the five Planner-set Manual IDs (DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25, DRAG-7.20) appears as a test-title claim. DRAG-7.20's explanatory comment is not coverage. All Manual cases remain untouched.

## Proposed Stamps

Batch 5's previously approved exact stamps are confirmed by the evidence tables. No further stamp is necessary to close DRAG-2.11. The following are **proposals only**, not catalog mappings; even after approval/stamping they remain partial unless the named missing Then clauses are added.

1. **Surface, TREE-10.12:** W4 becomes `TREE-10.12: returns 400 when projectId is missing`. First extend its no-creation assertions and add a null-owner scenario, plus complete the no-creation check for the missing-ID path W1. A stamp alone cannot close the revised case.
2. **Surface, TREE-10.13:** W5–W8 become respectively:
   - `TREE-10.13: deletes the workflow, its workphases, and boards/columns, but items survive with a null workphase`;
   - `TREE-10.13: removes the workflow's own notifications, which belong to no item, with a workflow delete and with a project delete`;
   - `TREE-10.13: does not fail on cross-project items inheriting the workflow`;
   - `TREE-10.13: deletes a workflow with a null projectId without touching any project's items`.

   These expose existing partial coverage only. Extend/add a route test for the whole two-variant fixture before marking Automated. W9 keeps its separate TREE-10.3 mapping; it is not a substitute for those missing assertions.
3. **Internal, new approval required, DRAG-6.20:** U1, U8 and U9 gain `DRAG-6.20: ` before their current exact titles above. This is identity/row-class coverage only.
4. **Internal, new approval required, DRAG-6.27:** U2, U3, U4 and U6 gain `DRAG-6.27: ` before their current exact titles. U5 becomes `DRAG-6.22, DRAG-6.27: is not drawn at all by a reload that finishes with no stop behind it`. These assert hook lifetime/no-report guards, not rendered timing or real trigger wiring.
5. **Internal, new approval required, TREE-1.14/TREE-1.15:** U10 becomes `TREE-1.14, TREE-1.15: holds the carried subtree, and the height the cap reads, for the whole drag`. This covers only retained membership on growth and retained height/validity. Do not add TREE-1.16: it never moves an existing descendant out.

No stamp is proposed for DRAG-6.21 or DRAG-6.28: none of the new tests drives a hidden item or a late reveal. No stamp is proposed for DRAG-6.25 or Planned DRAG-6.26. U11's stop-key mechanics do not independently prove a case's full lifecycle; leave it untagged.

## Proposed Internal Mappings (need approval)

**New named proposals, all partial:**

| Case | Candidate tests (exact titles/files in evidence above) | Why approval is needed |
|---|---|---|
| DRAG-6.20 | U1 (`useForcedStop.test.ts`), U8/U9 (`dragChrome.test.tsx`) | Hook/component identity and flash style, outside drag-clock and pure ordering/request categories |
| DRAG-6.27 | U2–U6 (`useForcedStop.test.ts`) | Post-stop display lifetime hook; not the parameterized pop-state-machine drag-clock category |
| DRAG-6.22 | U5 (`useForcedStop.test.ts`) | New named no-stop flash mapping; earlier approvals for other tests are not blanket approval |
| TREE-1.14, TREE-1.15 | U10 (`useProjectDragReorder.test.ts`) | Hook snapshot/growth behavior; not a pure request/order module or an approved earlier TREE-2.6 mapping |

Approval never removes the separate requirement for an ID stamp. Nothing above was written into an Automation test line.

**Earlier approvals:** items 1–8 of the prior report's Proposed Internal Mappings remain approved for their exact named tests. DRAG-6.15's hook approval and existing internal pointers stand. DRAG-7.2's `itemListOps.test.ts` and DRAG-7.16's `modalPlacement.test.ts` pointers stand. DRAG-7.31's `descendantsProjection.test.ts` test, `DRAG-7.31: set down at its own slot in the modal, after coming in with the slot hidden, a release writes nothing`, falls within the standing pure client request-rule category; its surface clauses remain partial, as previously reported. None of these approvals covers the new proposals above automatically.

**Earlier item 9 remains unapproved and routed to Story 10:**

- DRAG-1.28: `client/src/components/workflow/dragOverlayGeometry.test.ts`, `DRAG-1.28: %s` inside `clampToCurrentContext` (merged column, sub-row and Card Descendants bounds); no new approval inferred.
- DRAG-3.22: `client/src/components/workflow/dragOverlayGeometry.test.ts`, `DRAG-3.22: on the board is the Card's width minus its content inset on both sides`, `DRAG-3.22: locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width`, and `DRAG-3.22: keeps the pointer at the same fraction across the Stub's width, and on its vertical middle`; also `client/src/components/workflow/placement.test.ts`, `DRAG-3.22, DRAG-1.35: across a real zoom-in (Column → Card’s Descendants layer) and pop-out (back to the column), the form switches both ways`.
- DRAG-4.12: `client/src/components/KanbanCard.test.tsx`, `DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there`.

These would still leave surface assertions open even with approval.

## Proposed Manual (need approval)

None. The remaining assertions have precise outcomes: saved fields/request counts, computed opacities, animation keyframes/progress, bounding boxes, status text, deadline-relative mount/unmount and refusal outcomes. This does not decide Story 10's later case-by-case flakiness tradeoffs. No new Manual authorization was supplied.

## Gaps

The full-case table supplies each scoped gap's exact case ID, candidate file/title keys and missing assertions. Routing follows the current roadmap:

- **Story 10, existing partial drag coverage:** DRAG-1.36; DRAG-2.12 and DRAG-2.14–DRAG-2.23; DRAG-4.35; DRAG-5.16; DRAG-6.15–DRAG-6.25, DRAG-6.27, DRAG-6.28; TREE-2.1 and TREE-2.4–TREE-2.8; TREE-1.14–TREE-1.16. DRAG-2.11 has no remaining gap.
- **Current Story 8.9 follow-up, server coverage:** TREE-10.12 omitted/null owner and full refusal/no-creation checks; TREE-10.13 complete owned/ownerless deletion. Stamping W4–W8 alone is insufficient.
- **Architect build routing:** DRAG-6.26 remains Planned. At delivery the Planner removes only DRAG-6.22's column/no-cue clause and makes DRAG-6.26 Open. Current column-no-cue is not a product defect.
- **Other carried gaps unchanged:** DRAG-3.25 rendered row heights and the still-unapproved DRAG-1.28, DRAG-3.22, DRAG-4.12 mappings remain Story 10's. This confirming run does not reopen the earlier report's unrelated full-scope verdicts.

**Skip accounting:** 21 skipped E2E declarations, zero skipped/fixme/todo client or server unit declarations. None counts toward the missing Then clauses. The existing DRAG-7.2 and DRAG-7.11 Automated statuses have independent running coverage and are not demoted merely because they also have skipped tests.

The six old skips now each have their one-line reason immediately above them:

| File | Exact skipped test title | Recorded reason |
|---|---|---|
| `tests/ui/item-repositioning-cross-column-dnd.spec.ts` | `1.a — drag C onto card A` | Added while failing; topmost card moves in swap preview, drop selects different anchor consistently |
| same | `2.a — drag C onto card B` | Same limit on the other column's topmost card |
| `tests/ui/item-repositioning-cross-project-dnd.spec.ts` | `1.a — drag C onto card A` | Added while failing; aimed topmost anchor differs from saved anchor |
| same | `2.a — from the root board, drag C onto card B` | Same limit, project 1b's topmost card in root list |
| same | `2.b — from the root board, drag C onto card E (same gap as "after D")` | Same limit over the longer drag past B and D |
| same | `4.b — from the root board, drag D onto card A (before A)` | Same limit, longest drag from fourth card to topmost |

They remain skipped and Story 10 item 3 still takes their re-derivation/repair/deletion. The comments explain the recorded historical reason; this inspection does not establish that the same cause persists now.

The other 15 skips retain their existing disposition: `tests/ui/drag-7-modal-hold.spec.ts` (six: DRAG-7.14; two DRAG-7.15; DRAG-7.17; DRAG-7.12; DRAG-7.10/DRAG-7.18), `tests/ui/drag-7-hierarchy-modal.spec.ts` (four: DRAG-7.6/DRAG-7.10/DRAG-7.11; DRAG-7.2/DRAG-7.6; DRAG-7.2; DRAG-7.6), `tests/ui/drag-7-overflow-row.spec.ts` (DRAG-7.27), `tests/ui/drag-5-stub-detach.spec.ts` (DRAG-5.13), `tests/ui/project-tree-drag.spec.ts` (E4), and `tests/ui/drag-card-zoom-in.spec.ts` (two untagged Card-attach tests). The zoom-in file's reason is in its header; others retain adjacent reasons. DRAG-7.15's below-gap, DRAG-7.17's above-gap/scrolling, DRAG-7.12's rendered tiers and DRAG-7.27's overflow behavior remain Open; the stamps here do not restore those skipped clauses.

## Duplication

Reported for later judgment; no deletion is proposed or performed.

- **The audit's shared-walk question:** `client/src/lib/dragTargets.test.ts` T2/T3 versus `client/src/components/workflow/dragClassification.test.ts` C2/C3 both test the parent → anchor → neither cap progression. T4 and C3/C4/C6 also overlap descendant/cycle tiers. S3 in `useProjectDragReorder.test.ts` repeats the boundary at the sidebar hook layer. The board tests additionally exercise the Free-Card exception, detached links and supplied Stub predicate, so the entire blocks are not interchangeable. None of these overlapping checks proves rendered opacity.
- C1/R3 overlap valid-parent tier assignment; C2/R1 overlap anchor/neither assignment, at adapter and row-hook layers. S2/T4 overlap descendant tiers; S6 adds the ghost class.
- B9/B10 and F4 cover reporting versus wording of the two causes at different layers. F4 and `client/src/components/ForcedStopCue.test.tsx`, `words the two causes differently, each in its own sentence`, now both compare the rendered text with independently written case sentences.
- U2 and U3 overlap expiry after board draw; U3 additionally retains the banner. U4 and U5 overlap the no-flash result of a reload without a new stop. U11 plus `client/src/components/workflow/useForcedStop.test.ts`, `gives each stop its own key, so one that replaces a live stop is told apart from it`, test producer and consumer of the key.
- W5/W7/W9 overlap survivors losing deleted phases through owned workflow deletes; W8 adds ownerless deletion preserving unrelated phase assignments. Their overlap does not fill TREE-10.13's unasserted dependents or unchanged fields.

## Test Quality Concerns

1. **No-vertical-padding assertion: it does not prove its title or DRAG-3.25.** `client/src/components/cardMetrics.test.ts`, `puts that height on the box every Stub-sized row shares, with no vertical padding to add to it`, checks a height class and absence of `p/py/pt/pb` classes on one constant. Under the stated Tailwind border-box sizing, padding is inside the declared height; its absence does not prove an unchanged outer row height. Margin can change list pitch, and the test does not inspect it. It also cannot see a rendered pill, border, overflow or carried copy, nor prove every representation uses the constant. The adjacent `sets the Stub row's height by a class that is the same height as the number the drag math reads` is class/number consistency, not measurement. Keep DRAG-3.25 Open; any developer title correction and rendered geometry checks belong to the later work, not this catalog edit.
2. **Tier test duplication:** answered under Duplication. Both layers exercise the shared cap walk; the board's attachment-specific adapter behavior supplies distinct assertions. Report the overlap without deciding which test to delete.
3. **TREE-10.12 required owner:** W1–W3 are no longer enough after the Planner's clarification. W4 is unstamped and status-only; null appears in optional-source tests, not as `projectId: null` in a workflow create. W2 now covers `""`, no workflow for P and valid-create recovery; W3 asserts Q retains W alone. These are real improvements, but they do not supply omitted/null refusal with nothing created. Keep Open.
4. **TREE-10.13 full delete:** the orphan-test repair is meaningful: it now seeds two unrelated phased items and checks their phases plus their workflow. It deletes an orphan with no dependents, though. W5 seeds only one phase/board/item and its title's phase/column deletion is not directly checked. Missing across both ownership variants: two boards/columns and phase absence, targeted notifications, cross-project stale-phase Z on V's invalidItems, X/Z all non-phase fields unchanged, Y wholly unchanged/in its column, all V dependents and notifications unchanged, and projects surviving. W6 checks workflow-level notifications, not the full fixture's unaffected/deleted notification sets. Existing inheritance deletion tests do not complete this new case.
5. **Pickup membership/height:** U10 uses a rerendered added X1a, not an earlier saved move response. It retains the same descendant set, excludes no newly added ID and keeps `dropInvalid` false after growth. It does not hover that added row, call release, receive a server 400, check persisted positions, start again, shrink height or move an old descendant outside. S4's identity assertion remains useful for tier stability but does not run TREE-2.6's P/Q scenario. The new three placement cases and existing tier case must remain distinct.
6. **Flash lifetime versus rendered late reveal:** U2–U6 assert hook state and manual callbacks. U8 sets an animation duration and U9 rejects other/no IDs. No test renders a row after consuming part of the global window, advances through the original deadline, or checks both inside/after-window reveal for collapsed, overflow and modal surfaces. Consequently DRAG-6.28 has no demonstrated remaining-time assertion. A full duration specified on a row hook alone does not prove that a late mount gets a fresh full lifetime: a surrounding deadline could still remove its flash. This report establishes missing coverage, not an implementation mismatch or a runtime failure. No deleted probe substitutes for this test.
7. **Full flash/stop surface gaps:** U8/U9 do not check two amber pulses, saved location, CSS keyframes or hidden-item no-reveal. F2/U6 call `clear()` rather than starting a real drag. F1/F5 still do not inspect the three-quarter fade curve, and no test renders the banner across BoardView's loading transition. B10's armed stop is not a stale reindex response; B8/B9 now legitimately cover the newly explicit third resync, failed column reorder. No live-column stop test exists for DRAG-6.25/current DRAG-6.22 boundary. Planned DRAG-6.26 is not assessed against unbuilt behavior.
8. **Batch 5 wording/title repairs are confirmed:** F4 and `words the two causes differently, each in its own sentence` use independently written literal sentences rather than importing the component's STOP_WORDING. F4 rejects the other cause's sentence. B13 actually cancels and its final title now says so. These fixes close the earlier quality objections, without completing their broader cases.
9. **Workflow ordering and optional-value repairs are confirmed:** `server/tests/routes/workflows.test.ts`, `returns workphases ordered by position and items with computed depth`, creates three phases, reorders them to third/first/second and asserts that returned ID order plus root/child depths. It now proves ordering. `returns 400, and creates nothing, when %s is not a string` now checks true/false/7/0/object/empty array/array holding a real reference ID for each optional field, along with no workflow created. Neither repair needs a drag test or Story 10 routing.
10. **No new business discrepancy is established by absence of a test.** The existing current-story server gaps and the Architect's Planned banner routing are concrete handoffs. Classification answers, style-class assertions, fixture rerenders, prior test passes and deleted probes do not establish the missing surface behaviors.

## Uncatalogued Tests

**Implementation/coverage guards; no forced mapping:**

- `client/src/components/workflow/useForcedStop.test.ts`: `gives each stop its own key, so one that replaces a live stop is told apart from it`, plus U7, and `client/src/components/ForcedStopCue.test.tsx` U11. They safeguard stop replacement/key mechanics; no separate catalog rule requires a React node/key. U11's same-stop identity is not a rendered no-restart test.
- `client/src/components/cardMetrics.test.ts`'s three class/number/padding checks and `client/src/components/item-detail/TypePill.test.tsx`'s title-line class guard remain implementation checks, not DRAG-3.25 automation.
- `client/src/components/sidebar/useProjectDragReorder.test.ts`: `marks nothing past the cap while the cap is unknown: the descendants "neither", every other row a "parent"`, `counts a row a collapsed project hides, as the board counts a row the section does not draw`, and `marks nothing invalid while the cap is unknown` remain deliberately uncatalogued under the PO's ruling. Do not invent cases for them.
- `client/src/lib/dragTargets.test.ts`, `leaves every other row a tier of its own, off the same walk`, and the board's unknown-active-ID/every-item checks guard the classification contract. `is an "anchor" whatever its parent when naming a row sets no parent` overlaps the Free-Card rule, but a further internal mapping adds no complete case.
- The prior helper-only safeguards (`itemListOps.test.ts` rendered reads/pending parents, overlay attribute guards and non-live modal callback guards) are not promoted merely because this run confirmed neighboring stamps. MCP-only missing coverage is not reported.

**Real catalog scenarios, currently untagged:** U1–U6, U8–U10 and W4–W8 have the existing-case proposals above. Their missing IDs and approval status are kept separate from implementation guards. No invented candidate case is needed to absorb them.

## Candidate New Cases

None required by this follow-up. The Planner has already supplied the cases for the flash window/late reveal, stopped column, pickup membership/height and workflow deletion. The cap-loading/hidden-tier states are deliberately excluded. The banner key is an implementation mechanism, not a new business case. Any newly discovered product behavior would need a PO rule before a case; this inspection establishes none.

## Totals

Authoritative suite tables contain **428 cases**, with **428 matching case bodies and 428 unique IDs**; identical ID sets, no duplicate case IDs and matching table/body statuses. The README's illustrative DRAG-5.1 table is excluded. Before this edit: 305 Automated, 114 Open, 5 Manual, 2 Planned, 2 Pending PO. One P0 Open becomes Automated.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 112 | 134 | 60 | 306 |
| Open | 30 | 66 | 17 | 113 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| Total | 142 | 203 | 83 | 428 |

**Prior-count reconciliation:** the prior report prints 421; eight new cases would appear to imply 429. Its totals overcount one P0 Open case: the real pre-addition baseline is 420 (107 Open, rather than 108). The README includes exactly one illustrative P0/Open DRAG-5.1 row duplicating a real case; counting that sample produces 429 now, and excluding it produces 428. This precisely accounts for the discrepancy without forcing the current catalog to fit the earlier total or assuming how its counter was implemented.

The only catalog edit is DRAG-2.11's synchronized two statuses and single Automation line. All other writes are this report. The parent session reports `npm.cmd run check:docs` passing (397 files, 0 hits) and `git diff --check` passing for the catalog edit; that check preceded completion of this report. Final documentation verification belongs to the parent. No app-test pass is claimed here.

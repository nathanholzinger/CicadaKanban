# Story 8.1 test reconciliation — Codex trial

## Coverage Mapping

This ordinary reconciliation was delegated with `fork_turns=none`, using the current inherited Codex model and available tools; no YAML Claude model was requested. The Markdown body of `.claude/agents/test-reconciler.md` governed the run. Read/Grep/Glob/Edit/Write limits were preserved by explicit instructions, not a tool allowlist. Shell orchestration performed bounded local reads, searches and static parsing only. No application, test suite, docs checker, network, browser, dependency install, git mutation or temporary tooling/script file was run or created.

Inputs were the complete Story 8.1 plan (Scope, amendments, Open questions and handoff), root and workflow AGENTS, catalog README, documentation standards, testing strategy, story-done checklist, the current cases and their actual cited wiki sections. Board-drag-interaction §§1–3.2, 5–10; hierarchy-placement §§1–6; item-attachment §§1, 6–8, 11–12; item-positioning §§2, 4, 7.4; and positioning §5 supplied the rules. Production modules, fixtures and helpers were read only to interpret assertions. The two supporting code/comment reviews are not formal coverage audits or mapping approvals. The plan contains no Open question addressed to the Reconciler; its slotHidden question is addressed to the PO.

Scope is 44 live cases: four new, eight reopened, 24 revised and eight reviewed unchanged. Retired DRAG-1.21, DRAG-4.14, DRAG-4.16, DRAG-5.11 and DRAG-5.12 are excluded. No fresh internal-mapping or Manual approval was supplied. Existing internal pointers remain approved; the README's standing drag-clock and drag-only ordering/request categories were applied within their stated limits.

Whole-catalog method: read every real case heading under `docs/test-plans/**`, excluding README examples and index files; parse TypeScript test syntax under `server/tests/`, `client/src/**/*.test.ts(x)` and `tests/**/*.spec.ts`. String literal titles, including multiline call layouts, were inspected as syntax, not comments/imports. Describe IDs were inherited by every enclosed test and combined with the child's own IDs. Curried `it.each(...)(title,...)` declarations were included (notably TREE-10.9 and the four DRAG-7.16 window-edge rows), and loops inside tests were read as assertion variants. All observed ID titles have literal qualified-ID prefixes; no computed/template test titles were found. The skip scan found 16 unconditional leaf `test.skip` declarations, no suite skips, conditional skip/runIf/skipIf/fixme or only modifiers, and no standalone runtime skip statements. Hooks/configuration calls were excluded. Counts below describe source declarations, not an executed runner's expanded test count.

The scan found 1,211 leaf title declarations and 268 describe declarations, 347 distinct raw title IDs and 345 IDs with an unskipped leaf carrier. Two raw IDs are skipped-only: retired DRAG-5.12 and already-Open DRAG-7.18. Of the raw IDs, 345 are live catalog IDs; 344 live IDs have active carriers. A carrier establishes identity only, not full-Then coverage or approval.

The table gives the final status. Evidence labels resolve below to exact file paths and titles; a describe title includes its inherited leaf tests. “None” means no test/describe title carries this case ID. Partial tests are reported here but have no catalog Automation pointer.

| Case | Status before → after | Coverage and complete-Then assessment | Exact-title evidence |
|---|---|---|---|
| DRAG-1.3 | Automated → Open | Partial: sustained exit explicitly reaches Board with no context, then entering a column is separate; the parameterized clock test independently asserts that boundary. No ID-bearing active test measures the carried copy following the cursor freely after pop. Context/state labels do not prove that observable Then clause. | E27, E88, E89 |
| DRAG-1.5 | Open → Open | Partial: Board → column anchor release is exercised; direct column → Descendants immediate and later gap/depth releases and new-context bounds are not covered by this ID. | E88, E90 |
| DRAG-1.14 | Open → Open | Partial: enabled/disabled distance, merged outer-body bound and board-section yank are tested. Missing ID-bearing sub-row and modal distance variants; the Card-box unit is unstamped. The UI helper sends multiple pointer samples (quality concern below). | E28, E29, E30, E58 |
| DRAG-1.16 | Open → Open | None: missing foreign-column/band/Card, sibling-sub-row, header/gap/Unsorted releases while locked, exact saved anchor with unchanged parent/workphase, and Descendants release outside the Card before pop. | None |
| DRAG-1.18 | Open → Open | None: no ID-bearing distance-does-not-zoom-in case at Board and column, including the early release's reposition. | None |
| DRAG-1.19 | Open → Open | None: no title carrying this ID proves two ordered distance pops to Board or the inside-column one-pop contrast, from both entry origins. | None |
| DRAG-1.28 | Open → Open | None: geometry units are unstamped. Missing approved whole-case coverage of merged horizontal/sub-row vertical clamps and whole-Card title/padding movement/bounds with only its own hierarchy candidates. | None |
| DRAG-1.29 | Manual → Manual | Planner Manual left untouched: tween/chasing cursor and popSnapMs feel; no title carries the ID. | None |
| DRAG-1.35 | Open → Open | None: no ID-bearing test jointly proves direct named-Card zoom for populated and childless Cards/sub-rows, whole-Card bounds, both Stub copies and no deeper context. Relevant unlabelled units are proposed below. | None |
| DRAG-3.20 | Open → Open | None: no ID-bearing Board-only divider visibility check covering column, sub-row and Descendants locks. | None |
| DRAG-3.22 | Open → Open | None: unlabelled form/width/re-anchor units cover parts; neither both copies, held shadow nor full two-way pointer continuity is proved under this ID. | None |
| DRAG-4.1 | Open → Open | Partial internal request adapter only: parentId/isAttached for an empty append. Missing the surface immediate no-movement zoom, populated S1/S2 last-child order, W1→W2 inheritance, unchanged target, single commit, rendered Stub and detached-same-parent branch. | E17 |
| DRAG-4.3 | Open → Open | None: no ID-bearing zoom/attach from the newest-completion slot beside a done Card, immediate last-child release and separation from Board's done band. | None |
| DRAG-4.5 | Open → Open | None: no paired same-relation quick anchor-before-B release versus full-hold immediate attach, with unchanged parent on the quick branch. | None |
| DRAG-4.8 | Automated → Automated | Full through existing approved internal pointers: exact four-state/one-state ranges and placements, dragged-subtree exclusion, named-row gap movement and traveling-row anchor skip. Existing pointers retained; no new internal mapping added. | E7, E16, E38, E39, E40, E41, E42, E43, E44, E52 |
| DRAG-4.11 | Automated → Automated | Full existing approved internal boundary mapping: before-first, after-last depths, exact parent/anchor, both offset clamps and root floor. Empty hierarchy is also exercised; the childless-Card surface rule belongs to DRAG-4.12. | E42, E43, E44, E45, E46, E47, E48, E49, E50, E51, E53, E54 |
| DRAG-4.12 | Open → Open | Partial surface and internal carriers: childless-Q zoom/attach, one preview row and empty append request. Missing exact sole state under cursor movement/extreme offsets, immediate-versus-moved releases, the Free-children-only variant, and explicit no-anchor/fallback integration. Component mapping also needs approval. | E5, E17, E59 |
| DRAG-4.13 | Open → Open | None: no ID-bearing done-Card immediate attach plus later gap/depth anchored placement. Server TC-7.15 tests the API part, not this gesture. | None |
| DRAG-4.15 | Open → Open | None: skipped unlabelled zoom specs do not map. Missing three transitions, non-entry W3 inheritance rather than W2, immediate last-child release/no band anchor and Board-before-entry contrast. | None |
| DRAG-4.17 | Open → Open | None: no ID-bearing Free-origin attach-abandonment case proves one pop to column, both shortCards, original parent/Free state and exact Q/after request without attach. | None |
| DRAG-4.19 | Open → Open | Partial approved clock category: named-P/after full hold reaches P with bare cursor elsewhere. The named-B/before full-hold alternative is not asserted by this ID; other side-reset tests do not finish that hold. | E32 |
| DRAG-4.20 | Open → Open | None: no ID-bearing surface sequence for silent dwell, visible cue, locked outline/open ghost/Stub switch and pre-pop reposition. | None |
| DRAG-4.29 | Automated → Automated | Full existing approved projection/release mapping: own gap/depth yields null, away-and-back also null, other depth yields a real placement. This is the pure release decision; it does not validate the hidden-slot modal-return path. | E15 |
| DRAG-4.30 | Open → Open | Partial: nested-last foreign seed and own-slot reseed/null release are ID-bearing. Crucial same-entry sample carrying the column's P anchor while the Stub's row is absent is tested only by unlabelled D4 tests. No mapping written without those ID stamps. | E6, E8, E15 |
| DRAG-4.34 | Open → Open | None: no ID-bearing foreign-entry surface cursor walk, all three specified placements, shuffle/whole-Card following, both entry directions, closing origin gap or same-drag foreign-Stub one-write reparent. | None |
| DRAG-5.1 | Open → Open | Partial: active UI reaches column and persists detach/parent/workphase; pure placement/request asserts Q/after. Missing surface proof of exactly one pop, clamp and exact ghost/highlight/request relation, plus expanded sub-row landing. The unlabelled one-pop clock test cannot be mapped yet. | E19, E26, E57 |
| DRAG-5.4 | Automated → Open | Partial: active childless-Q UI reaches column then Q, releases without further movement and verifies reparent/attachment/workphase/rendering. It does not observe requests during exit/zoom or assert a single final write, so a committed intermediate detach could escape detection. Full Then explicitly excludes it. | E17, E24, E59 |
| DRAG-5.5 | Open → Automated | Full combined approved clock/request mapping. The threshold-parameterized whole-Card clock test starts an excursion, returns at OUT−1, equals the original locked session, then starts a fresh excursion whose outsideSince is OUT without popping at 2×OUT−1. Distance is explicitly disabled in POP_TEST_TUNING (popDistancePx: 0), so this is a permitted non-satisfied-distance setup. The request test uses stubOrigin(card-p), same parent and exact S2/after slot, and asserts ONLY {anchorId: S2, side: after}; no parent/attachment/workphase mutation is sent. Together they prove reset/no-detach plus the specified final sibling reorder/state preservation. No geometry/component mapping or fresh approval is inferred. | E18, E33 |
| DRAG-5.10 | Open → Open | Partial: UI shows X absent from P and present as an article in the column. It does not assert both copies' shortCard forms, both switches into Q/back into P, or cancel/no-write restoration unchanged. | E57 |
| DRAG-5.13 | Open → Open | Partial active pickup test and obsolete skipped pop test. Missing nested S1a with carried S1b, whole-Card bounds, one-pop column transition, both shortCards/subtree disappearance and exact Q/after detach preserving S1 and S1b. | E55, E56 |
| DRAG-5.15 | Open → Open | None: missing title/padding stay-in-layer beyond clock and distance thresholds, no exit clock, both Stub copies, and release at first gap rather than restoring pickup. | None |
| DRAG-7.2 | Automated → Open | Partial: active tests assert two/one child counts, exclusion of grandchildren/Free children, no Free-only overflow and count becoming three after drops. The two hidden-child-during-drag count tests remain skipped: count one with R1 excluded and no row when it is the sole child are not actively asserted through this ID. | E70, E71, E84, E85, E86, E87 |
| DRAG-7.6 | Open → Open | Partial internal seeds/hidden preview and skipped surface return tests. Missing active full modal→column→named-P zoom flow, hidden/visible immediate-release outcomes, live overflow count, preserved R1a subtree and release-in-column contrast. Cleared Planner pointers are not approval. | E9, E12, E13, E14, E25, E66, E70, E72 |
| DRAG-7.7 | Automated → Automated | Full active surface tests: centered whole hierarchy, exact order/depths, no Free F/G, no overflow via exact row set, no writes and same modal from either overflow control. | E60, E61 |
| DRAG-7.9 | Automated → Automated | Full active surface set: immediate Descendants pickup, first-child and deeper sibling placement, exact own-slot no-write and over-cap no-write, attachment/workphase assertions and persistent modal. | E62, E63, E64, E65 |
| DRAG-7.10 | Open → Open | Partial: click-modal detach, header containment and brief-excursion return are active; other old modal exit and hold-reopen tests are skipped. Missing one-pop exit while still inside the whole Card, expanded sub-row parent, hold-opened and Free-origin variants, exact Q/after request, and a further-pop requirement for Board/sibling row. | E4, E20, E21, E31, E66, E67, E68, E73, E83 |
| DRAG-7.11 | Automated → Open | Partial active dedicated isolation test proves sole registration, unchanged modal gap and painted clamp over backdrop Card. It seeds NO_POP, never waits for an outside clock transition and never reads outsideSince. Thus the Then's exit-clock-running assertion is missing. The old outside-pop carrier is skipped. | E66, E69 |
| DRAG-7.13 | Open → Open | Partial: dwell/cue/open, early first-child release and below-overflow last-child opening/release are active. Fixture X is an attached Stub of P, not a Free Card zoomed in from outside; that specified origin path is missing. Pure target/clock tests do not establish its surface reachability. | E10, E11, E34, E37, E74, E75, E76 |
| DRAG-7.14 | Open → Open | Partial: active gap/depth resets and steady-gap motion, plus parameterized clock resets. Card-title/padding continuation through completion and whole-Card exit/re-entry with no dwell outside are not ID-bearing assertions; the padding-stop test is skipped and contradicts current rules. | E35, E36, E77, E78, E79 |
| DRAG-7.16 | Automated → Automated | Full combined existing approved mapping: surface top/bottom/right edge geometry, cursor containment, fresh ghost and immediate committed placement; parameterized internal geometry covers all four edges including left and nearest-depth reading. Existing modalPlacement pointer retained, no new mapping proposed beside a complete surface mapping. | E22, E23, E80, E81, E82 |
| DRAG-7.18 | Open → Open | Skipped-only: hold-opened exit→column→zoom-back→hold reopen and final placement/no interim writes lack active coverage. | E83 |
| DRAG-7.31 | Open → Open | None: no ID-bearing test exercises hidden pickup→column→section→reopened full modal→original slot, no request, original parent/attachment/position/workphase and modal remaining open. The fresh-modal own-slot test has a different seed history. | None |
| ATT-7.1 | Automated → Automated | Full route test: detach returns attachment clear and original parent, workflow scope/position and inherited workphase. No new internal pointer needed. | E1 |
| ATT-7.6 | Automated → Automated | Full two route tests: detached same-parent reattach re-inherits workphase, changes to sibling scope/fresh last position and logs detach+attach; already-attached redundant reattach keeps position and logs nothing. | E2, E3 |

### Exact title evidence

This is the complete set of scoped ID-carrying source titles found, including skipped carriers and inherited IDs. It is an evidence inventory, not a list of approved mappings. Line numbers are convenience locations for this transient report. Titles within an ID-bearing describe inherit that suite's IDs even when their own title names another case.

| Evidence | File:line | Kind | Exact title and inherited describe |
|---|---|---|---|
| E1 | `server/tests/routes/items.hierarchy.test.ts:337` | Active test | `ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-9.4, TC-2.14, TC-7.13: detaches with placement into the workflow scope, keeping the parent` |
| E2 | `server/tests/routes/items.hierarchy.test.ts:364` | Active test | `ATT-7.6, ATT-8.2, TC-2.23: a redundant re-attach to the same parent is not a scope change and keeps its position` |
| E3 | `server/tests/routes/items.hierarchy.test.ts:378` | Active test | `ATT-7.6, ATT-8.1: a detached child re-attached to the parent it still names is a real attach` |
| E4 | `client/src/components/KanbanCard.test.tsx:66` | Active test | `DRAG-7.10: while the hierarchy modal holds its rows the modal's list carries the key, so the Card keeps only its id` |
| E5 | `client/src/components/KanbanCard.test.tsx:97` | Active test | `DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there` |
| E6 | `client/src/components/workflow/descendantsProjection.test.ts:73` | Active test | `DRAG-4.30: a foreign item enters at the section's last gap as the Card's last child, even under a nested last row` |
| E7 | `client/src/components/workflow/descendantsProjection.test.ts:106` | Active test | `DRAG-4.8: the named row moves the gap; a sample naming none keeps it` |
| E8 | `client/src/components/workflow/descendantsProjection.test.ts:121` | Active test | `DRAG-4.30: leaving the section clears it; coming back reseeds at the own slot, wherever the pointer is now` |
| E9 | `client/src/components/workflow/descendantsProjection.test.ts:183` | Active test | `DRAG-7.6: the pickup slot is read once, so a return finds it when the row is not in the section now` |
| E10 | `client/src/components/workflow/descendantsProjection.test.ts:309` | Active test | `DRAG-7.13: names the overflow row the ghost sits directly above or below, at its level, and no other state` |
| E11 | `client/src/components/workflow/descendantsProjection.test.ts:332` | Active test | `DRAG-7.13, DRAG-7.21: the hold keys on the gap and depth, and not in an over-cap state` |
| E12 | `client/src/components/workflow/descendantsProjection.test.ts:356` | Active test | `DRAG-7.6: comes in as an item from outside does: the last gap, as the Card’s last child` |
| E13 | `client/src/components/workflow/descendantsProjection.test.ts:374` | Active test | `DRAG-7.6: stays one when the ghost previews at the Card’s last child, so a release there still writes` |
| E14 | `client/src/components/workflow/descendantsProjection.test.ts:384` | Active test | `DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before` |
| E15 | `client/src/components/workflow/descendantsProjection.test.ts:414` | Active test | `DRAG-4.29, DRAG-4.30: writes nothing at the Stub's own gap and depth, however it got back there` |
| E16 | `client/src/components/workflow/dragCollision.test.ts:461` | Active test | `DRAG-4.8: steps past rows that travel with the dragged item` |
| E17 | `client/src/components/workflow/dragRequest.test.ts:182` | Active test | `DRAG-4.1, DRAG-4.12, DRAG-5.4: attach: parentId + isAttached, never an anchor — always an append for an item arriving from outside` — under `TC-2.11: toRequest` |
| E18 | `client/src/components/workflow/dragRequest.test.ts:192` | Active test | `DRAG-5.5: a Descendants-layer sibling reorder (parentId matching origin, an anchor slot): sends only the anchor + side` — under `TC-2.11: toRequest` |
| E19 | `client/src/components/workflow/dragRequest.test.ts:206` | Active test | `DRAG-5.1: detach (parentId: null on the placement): isAttached false, plus the anchor/workphase resolution otherwise` — under `TC-2.11: toRequest` |
| E20 | `client/src/components/workflow/dragStructure.test.ts:261` | Active test | `DRAG-7.10: a Descendants element inside a marked dialog gets that dialog’s box as its boundsRect` |
| E21 | `client/src/components/workflow/dragStructure.test.ts:285` | Active test | `DRAG-7.10: each Descendants region takes the bounds element marked for its own key` |
| E22 | `client/src/components/workflow/modalPlacement.test.ts:27` | Active test | `DRAG-7.16: is pulled inside the window at %s` |
| E23 | `client/src/components/workflow/modalPlacement.test.ts:110` | Active test | `DRAG-7.16: a modal shifted sideways reads the depth the cursor is at, to the nearest level` |
| E24 | `client/src/components/workflow/placement.test.ts:242` | Active test | `DRAG-5.4: at a *different* Card, the within-action is attach as its last child` |
| E25 | `client/src/components/workflow/placement.test.ts:254` | Active test | `DRAG-7.6: at its own Descendants layer with its own slot hidden, it previews as the last child` |
| E26 | `client/src/components/workflow/placement.test.ts:272` | Active test | `DRAG-5.1, DRAG-6.12: a real anchor at the column layer resolves exactly like any Card's anchor+side` |
| E27 | `client/src/components/workflow/popSession.test.ts:61` | Active test | `DRAG-1.3, DRAG-1.30: outside for >= popDelayMs pops out — the card belongs to nothing and the pop-in clock starts now` |
| E28 | `client/src/components/workflow/popSession.test.ts:101` | Active test | `DRAG-1.14: the distance term pops out as soon as the cursor is far enough from the context (either satisfies)` |
| E29 | `client/src/components/workflow/popSession.test.ts:109` | Active test | `DRAG-1.14: with popDistancePx at 0 the distance term is off — a cursor far outside pops nothing until the clock runs out` |
| E30 | `client/src/components/workflow/popSession.test.ts:144` | Active test | `DRAG-1.14: the distance term also measures against the outer body for a merged column` — under `DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect` |
| E31 | `client/src/components/workflow/popSession.test.ts:153` | Active test | `DRAG-7.10: a Descendants region with a boundsRect is still inside over that box, the hierarchy modal’s header above its list` |
| E32 | `client/src/components/workflow/popSession.test.ts:202` | Active test | `DRAG-4.19: holding it through the cue zooms straight into the named Card’s Descendants layer, wherever the bare cursor happens to be` |
| E33 | `client/src/components/workflow/popSession.test.ts:256` | Active test | `DRAG-5.5: an excursion out of the layer shorter than popDelayMs pops nothing, and coming back resets the clock` |
| E34 | `client/src/components/workflow/popSession.test.ts:433` | Active test | `DRAG-7.13: a silent dwell, then a cue, then the hold has run its length` |
| E35 | `client/src/components/workflow/popSession.test.ts:445` | Active test | `DRAG-7.14: resets when the gap, the depth or the side changes, and the cue goes at once` |
| E36 | `client/src/components/workflow/popSession.test.ts:456` | Active test | `DRAG-7.14: the hold starts over after it ended, with a fresh dwell` |
| E37 | `client/src/components/workflow/popSession.test.ts:461` | Active test | `DRAG-7.13: popDueAt reports the cue, then the end of the hold` |
| E38 | `client/src/lib/hierarchyPlacement.test.ts:53` | Active test | `DRAG-4.8: excludes the given ids, and never walks into their children` |
| E39 | `client/src/lib/hierarchyPlacement.test.ts:150` | Active describe | `DRAG-4.8: depthRangeFor` |
| E40 | `client/src/lib/hierarchyPlacement.test.ts:153` | Active test | `the gap between S1a1 (Top, depth 2) and S2 (Bottom, depth 0) offers depths 0–3` — under `DRAG-4.8: depthRangeFor` |
| E41 | `client/src/lib/hierarchyPlacement.test.ts:158` | Active test | `the gap between S1 and S1a (Bottom is Top’s own child) offers exactly one depth` — under `DRAG-4.8: depthRangeFor` |
| E42 | `client/src/lib/hierarchyPlacement.test.ts:163` | Active test | `DRAG-4.11: above the first item (no Top) offers depth 0 only` — under `DRAG-4.8: depthRangeFor` |
| E43 | `client/src/lib/hierarchyPlacement.test.ts:167` | Active test | `DRAG-4.11: below the last item (no Bottom) offers depth 0, the root’s children, up to Top + 1` — under `DRAG-4.8: depthRangeFor` |
| E44 | `client/src/lib/hierarchyPlacement.test.ts:171` | Active test | `DRAG-4.11: an empty hierarchy offers depth 0 only` — under `DRAG-4.8: depthRangeFor` |
| E45 | `client/src/lib/hierarchyPlacement.test.ts:208` | Active describe | `DRAG-4.11: resolvePlacement — the boundaries` |
| E46 | `client/src/lib/hierarchyPlacement.test.ts:211` | Active test | `above the first item: first child of the root, before S1` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E47 | `client/src/lib/hierarchyPlacement.test.ts:218` | Active test | `below the last item at depth 0: sibling after S2, under P` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E48 | `client/src/lib/hierarchyPlacement.test.ts:225` | Active test | `below the last item at depth 1 (Top + 1): first (and only) child of S2` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E49 | `client/src/lib/hierarchyPlacement.test.ts:229` | Active test | `Bottom is Top’s own child: first child of S1, before S1a` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E50 | `client/src/lib/hierarchyPlacement.test.ts:237` | Active test | `an empty hierarchy offers the root’s sole child, no anchor` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E51 | `client/src/lib/hierarchyPlacement.test.ts:241` | Active test | `TREE-1.4: an empty hierarchy under a null (sidebar virtual) root reads parentId null` — under `DRAG-4.11: resolvePlacement — the boundaries` |
| E52 | `client/src/lib/hierarchyPlacement.test.ts:289` | Active test | `DRAG-4.8: enumerates every depth in the gap’s range with its resolved placement` |
| E53 | `client/src/lib/hierarchyPlacement.test.ts:350` | Active test | `DRAG-4.11: clamps to the gap's own hi when the delta pushes past it` |
| E54 | `client/src/lib/hierarchyPlacement.test.ts:355` | Active test | `DRAG-4.11: clamps to the gap's own lo when the delta pushes past it` |
| E55 | `tests/ui/drag-5-stub-detach.spec.ts:84` | Active test | `DRAG-1.1, DRAG-5.13: a grandchild Stub's drag starts in its containing Card's whole section, not its parent Stub's sub-list` |
| E56 | `tests/ui/drag-5-stub-detach.spec.ts:111` | Skipped test | `DRAG-5.13: a grandchild Stub popped out to its containing Card's layer keeps its row and its own children drawn, and a release there writes nothing` |
| E57 | `tests/ui/drag-5-stub-detach.spec.ts:185` | Active test | `DRAG-5.1, DRAG-5.10: a pop out of the section detaches the Stub into its own column — attachment clears, parentId and the inherited workphase are preserved, and it renders as a Card` |
| E58 | `tests/ui/drag-5-stub-detach.spec.ts:244` | Active test | `DRAG-5.11, DRAG-1.14: a yank past the pop-out distance in one sample pops Descendants -> Column, and an immediate release detaches` |
| E59 | `tests/ui/drag-5-stub-detach.spec.ts:280` | Active test | `DRAG-5.4, DRAG-4.12: zoomed into a different Card instead, it reparents — attached as that Card's last child, never a detach that leaves parentId at P` |
| E60 | `tests/ui/drag-7-hierarchy-modal.spec.ts:92` | Active test | `DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered, with every attached descendant at its level` |
| E61 | `tests/ui/drag-7-hierarchy-modal.spec.ts:137` | Active test | `DRAG-7.7: any of the section’s overflow rows opens the same modal, the Card’s whole hierarchy` |
| E62 | `tests/ui/drag-7-hierarchy-modal.spec.ts:197` | Active test | `DRAG-7.9: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child` |
| E63 | `tests/ui/drag-7-hierarchy-modal.spec.ts:226` | Active test | `DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1’s last child, after R1a` |
| E64 | `tests/ui/drag-7-hierarchy-modal.spec.ts:252` | Active test | `DRAG-7.9, DRAG-7.19: set back down in its own gap and depth, an item writes nothing, and the modal stays open where it is` |
| E65 | `tests/ui/drag-7-hierarchy-modal.spec.ts:280` | Active test | `DRAG-7.9, DRAG-7.12: a tab state past the depth cap is reachable in the modal and writes nothing, and the rows carry the drag’s classification` |
| E66 | `tests/ui/drag-7-hierarchy-modal.spec.ts:338` | Skipped test | `DRAG-7.6, DRAG-7.10, DRAG-7.11: resting outside the modal’s box pops out of it, the modal closes and the drag is at the Card layer, where a release sets the Stub back down and writes nothing` |
| E67 | `tests/ui/drag-7-hierarchy-modal.spec.ts:368` | Active test | `DRAG-7.10: a pop out of the modal, past the Card’s box, detaches the item, as from the section` |
| E68 | `tests/ui/drag-7-hierarchy-modal.spec.ts:401` | Active test | `DRAG-7.10: the modal’s header is part of the modal: a cursor resting over it pops nothing` |
| E69 | `tests/ui/drag-7-hierarchy-modal.spec.ts:425` | Active test | `DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag` |
| E70 | `tests/ui/drag-7-hierarchy-modal.spec.ts:548` | Skipped test | `DRAG-7.2, DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card’s last child, and the overflow row leaves it out of its count` |
| E71 | `tests/ui/drag-7-hierarchy-modal.spec.ts:579` | Skipped test | `DRAG-7.2: with R’s only attached child dragged, back in the section R has no overflow row` |
| E72 | `tests/ui/drag-7-hierarchy-modal.spec.ts:604` | Skipped test | `DRAG-7.6: back in the section, a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing` |
| E73 | `tests/ui/drag-7-hierarchy-modal.spec.ts:628` | Active test | `DRAG-7.10: a brief excursion out of the modal, shorter than the pop-out delay, leaves the drag in it` |
| E74 | `tests/ui/drag-7-modal-hold.spec.ts:81` | Active test | `DRAG-7.13: a hold above R’s overflow row is a silent dwell, then a cue on the row, ending in the modal opening` |
| E75 | `tests/ui/drag-7-modal-hold.spec.ts:111` | Active test | `DRAG-7.13: a release before the cue completes commits where the ghost is, and the modal never opens` |
| E76 | `tests/ui/drag-7-modal-hold.spec.ts:132` | Active test | `DRAG-7.13: any item at the layer opens it: B, below the overflow row, as R’s last child` |
| E77 | `tests/ui/drag-7-modal-hold.spec.ts:154` | Active test | `DRAG-7.14: the hold starts over when the ghost changes level or gap` |
| E78 | `tests/ui/drag-7-modal-hold.spec.ts:190` | Skipped test | `DRAG-7.14: the hold runs only with the cursor inside the section: resting outside it ends the hold` |
| E79 | `tests/ui/drag-7-modal-hold.spec.ts:223` | Active test | `DRAG-7.14: the carried copy moving within the gap, across the ghost’s middle, does not reset the hold` |
| E80 | `tests/ui/drag-7-modal-hold.spec.ts:521` | Active test | `DRAG-7.16: a modal kept inside the window at the bottom edge reads the ghost afresh from the cursor` |
| E81 | `tests/ui/drag-7-modal-hold.spec.ts:558` | Active test | `DRAG-7.16: a modal kept inside the window at the top edge reads the ghost afresh from the cursor` |
| E82 | `tests/ui/drag-7-modal-hold.spec.ts:586` | Active test | `DRAG-7.16: a modal kept inside the window at the right edge reads the depth at the cursor’s x` |
| E83 | `tests/ui/drag-7-modal-hold.spec.ts:717` | Skipped test | `DRAG-7.10, DRAG-7.18: after leaving a modal a hold opened, a hold beside an overflow row opens it again in the same drag` |
| E84 | `tests/ui/drag-7-overflow-row.spec.ts:37` | Active test | `DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children` |
| E85 | `tests/ui/drag-7-overflow-row.spec.ts:64` | Active test | `DRAG-7.1, DRAG-7.2: the levels count from the Card, and one hidden child reads "1 child"` |
| E86 | `tests/ui/drag-7-overflow-row.spec.ts:117` | Active test | `DRAG-7.3, DRAG-7.2: between a row and its overflow row, the one state is the row’s first child` |
| E87 | `tests/ui/drag-7-overflow-row.spec.ts:147` | Active test | `DRAG-7.4, DRAG-7.2: below an overflow row, the item is the row’s last child, and none lies right of the overflow row` |
| E88 | `tests/ui/drag-column-bands.spec.ts:422` | Active test | `DRAG-3.4, DRAG-1.3, DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side` |
| E89 | `tests/ui/drag-column-bands.spec.ts:453` | Active test | `DRAG-1.3, DRAG-1.12: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left` |
| E90 | `tests/ui/drag-column-bands.spec.ts:513` | Active test | `DRAG-1.5, DRAG-1.23: a card is locked to each context it pops into in turn — In Progress, then Review` |

## Lost Coverage

The mandatory whole-catalog absent-active-carrier check found **zero** Automated cases with no active ID-carrying test. No unrelated case was reopened by that check. TREE-10.9 is carried by active `it.each(['templateId', 'sourceWorkflowId'])` in `server/tests/routes/workflows.test.ts`, title `TREE-10.9: returns 400, and creates nothing, when %s is an empty string`; a single-line grep would miss its curried title.

Four scoped cases were nevertheless reopened on semantic full-Then review: DRAG-1.3, DRAG-5.4, DRAG-7.2 and DRAG-7.11. Their active carriers remain present; their specific missing clauses are in Coverage Mapping. DRAG-7.18 was already Open with skipped-only coverage, so it is not a newly lost Automated case.

## Unknown IDs

Both unknown IDs are retired, and remain in the current sources:

| Unknown ID | File | Exact title | Activity |
|---|---|---|---|
| DRAG-5.12 | `tests/ui/drag-5-stub-detach.spec.ts:148` | `DRAG-5.12: released back at its own containing Card's layer, nothing is written — the Card layer's auto-drop for its own Stub is "set it back down"` | Unconditionally skipped; obsolete removed-layer expectation. |
| DRAG-5.11 | `tests/ui/drag-5-stub-detach.spec.ts:244` | `DRAG-5.11, DRAG-1.14: a yank past the pop-out distance in one sample pops Descendants -> Column, and an immediate release detaches` | Active; DRAG-1.14 is live but partial. |

No other unknown test-title IDs were found, including inherited, parameterized and skipped titles. No test title carries DRAG-1.21, DRAG-4.14 or DRAG-4.16. No test carries any Planner-set Manual case ID; all five Manual cases were left untouched.

Coder handoff: remove the obsolete safe-stop test and retired ID on the active distance test as the story requests; do not replace them with new IDs without matching assertions. No code was edited here.

## Proposed Stamps

These are developer title changes, not written mappings or claims of whole-case coverage. Exact current titles are supplied; stamping a partial test does not make its case Automated.

| Case(s) | File and exact current title | What it proves; what remains |
|---|---|---|
| DRAG-4.30 | `client/src/components/workflow/descendantsProjection.test.ts`: `D4: the Card's own Stub coming back in from its column seeds at its own slot, and a release there writes nothing`; `D4: an item from outside seeds at the last gap as the Card’s last child, the column’s anchor or none`; `D4: an overflow row of a row that is not in the section names no gap either` | Directly relevant entry-sample guard, including pickup snapshot while the row is absent and foreign entry ignoring P. Add qualified case prefixes, then re-reconcile together with current ID tests. No D4 title is currently a catalog ID. |
| DRAG-1.14 | `client/src/components/workflow/popSession.test.ts`: `the pop-out distance term measures against the Card’s box` | Clock-category board Card-box distance assertion. Modal/sub-row distance variants still need coverage. |
| DRAG-1.35 | `client/src/components/workflow/popSession.test.ts`: `there is no further child to zoom into: resting in the layer, however long, holds it` | Covers no deeper context, not the complete childless/populated zoom, bounds and copies. |
| DRAG-5.1, DRAG-5.13 | `client/src/components/workflow/popSession.test.ts`: `leaving the Card’s box for popDelayMs is one pop, to the column the Card sits in` | Generic one-pop clock logic; it does not itself carry nested subtree, form or request assertions. |
| DRAG-7.14 | `client/src/components/workflow/popSession.test.ts`: `resting outside the layer ends the hold: it runs with the cursor inside` | Whole-Card exit clock/hold reset. Add a current title/padding-continuation assertion as well; this test does not contain it. |
| DRAG-3.22, part of DRAG-1.35 | `client/src/components/workflow/placement.test.ts`: `across a real zoom-in (Column → Card’s Descendants layer) and pop-out (back to the column), the form switches both ways` | Pure form switch at both transitions; no rendered copies, shadow or pointer continuity. A new form mapping is outside the clock/request categories and needs approval below. |
| DRAG-1.28 | `client/src/components/workflow/dragOverlayGeometry.test.ts`, describe `clampToCurrentContext`, parameterized title `%s`, rows `a merged column bounds x only`, `a sub-row bounds both axes`, `a Card’s Descendants layer bounds both axes` | Geometric clamp portions only. Prefix the title, then seek the geometry mapping approval below; no ID currently permits a catalog pointer. |
| DRAG-3.22 | `client/src/components/workflow/dragOverlayGeometry.test.ts`: `on the board is the Card's width minus its content inset on both sides`; `locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width`; `keeps the pointer at the same fraction across the Stub's width, and on its vertical middle` | Width/form/re-anchor portions; component/shadow/both copies and reverse continuity remain. These mappings need separate approval. |

Unlabelled skipped `drag-card-zoom-in.spec.ts` titles `a Card in a different column: pop out, pop into its column, then zoom into it and attach` and `a Card in the drag's own column: pop out, pop back in, then zoom into it and attach` are not proposed as ready stamps: their original reasons still skip them, and their bodies need current-case rework first.

## Proposed Internal Mappings (need approval)

No fresh approval is assumed or written. Approving these partial mappings alone would leave the cases Open until all missing clauses and required title stamps are addressed.

| Case | Proposed internal file/title | Approval boundary |
|---|---|---|
| DRAG-4.12 | `client/src/components/KanbanCard.test.tsx`: `DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there` | Already ID-bearing, but a new component-render mapping is neither clock logic nor pure ordering/request logic. It adds the one-row display assertion the surface test does not explicitly make; it does not prove reachability or cursor clamping. |
| DRAG-1.28 | `client/src/components/workflow/dragOverlayGeometry.test.ts`, `clampToCurrentContext > %s` and its three rows listed in Proposed Stamps | New geometry mapping, conditional on developer ID stamp. The fact that the module is pure is insufficient approval. |
| DRAG-3.22 | `client/src/components/workflow/placement.test.ts`, exact transition title in Proposed Stamps, and `client/src/components/workflow/dragOverlayGeometry.test.ts`, the three exact width/form/re-anchor titles there | New visual form/geometry mappings, conditional on stamps. The standing ordering/request category does not approve arbitrary visual helpers. |

The only newly written internal pointers are DRAG-5.5's clock and request tests, explicitly covered by the README's standing categories. Existing DRAG-4.8, DRAG-4.11, DRAG-4.29 and DRAG-7.16 internal pointers remain approved. Cleared DRAG-4.30/DRAG-7.6 pointers and the story's unit-test discussion are not fresh approvals. No new internal mapping is added beside surface tests that alone cover an entire case.

## Proposed Manual (need approval)

None. The uncovered outcomes are precise reachability, geometry, ordering or write/no-write assertions. Skips and tuning friction do not by themselves justify changing these cases to Manual. DRAG-1.29 remains Planner Manual, with its original line and reason unchanged.

## Gaps

**34 scoped cases remain Open**, after one restoration and four semantic reopenings. Exact ID-bearing files/titles or explicit absence, and every missing Then portion, are recorded in Coverage Mapping. They are:

DRAG-1.3, DRAG-1.5, DRAG-1.14, DRAG-1.16, DRAG-1.18, DRAG-1.19, DRAG-1.28, DRAG-1.35;
DRAG-3.20, DRAG-3.22;
DRAG-4.1, DRAG-4.3, DRAG-4.5, DRAG-4.12, DRAG-4.13, DRAG-4.15, DRAG-4.17, DRAG-4.19, DRAG-4.20, DRAG-4.30, DRAG-4.34;
DRAG-5.1, DRAG-5.4, DRAG-5.10, DRAG-5.13, DRAG-5.15;
DRAG-7.2, DRAG-7.6, DRAG-7.10, DRAG-7.11, DRAG-7.13, DRAG-7.14, DRAG-7.18, DRAG-7.31.

### Disposition under Story 8 and Story 10

The roadmap's Story 8 provisions govern scheduling here. Its "How each story closes" explicitly departs from the ordinary story-done checklist: individual 8.N stories update the wiki and catalog once the code is settled; audit and reconciliation are discretionary. Story 8 as a whole ends with a close-out audit and reconciliation, when cases still lacking tests are routed to Story 10 by ID. A complete ID-level routing sweep is therefore due at that umbrella close-out, not a new prerequisite for closing Story 8.1.

The Open statuses above describe incomplete automation, not failures of the implemented behavior or instructions to repair every drag spec during Story 8.1. In particular:

- **Story 10:** repair/unskip the pointer-driven Playwright flows and add their missing assertions once the gesture settles. This includes the four semantic reopenings (DRAG-1.3, DRAG-5.4, DRAG-7.2, DRAG-7.11), the new and revised gesture paths, and the missing surface parts of the other Open cases. DRAG-7.13's foreign-origin path and DRAG-7.10's missing variants are already explicitly named in Story 10's item 9; its earlier handoff also names write observation in place of unchanged-field checks. These are catch-up findings, not additional Story 8.1 blockers. Story 10 may rework or retire obsolete specs rather than unskip removed behavior unchanged. Its flakiness call and any Manual approval remain case by case.
- **During Story 8:** continue the normal API/pure-module checks and address stable unit/request/clock work with its story, unless an explicit deferral applies. Existing pure-test ID stamps can land without rebuilding a Playwright gesture. The general DnD deferral is not a blanket exemption for all unit/API coverage; the roadmap also permits temporary unit skips for experimental changes on the stated terms. This report does not turn every partial unit mapping into an immediate Story 8.1 requirement.
- **Minimal docs-gate cleanup:** the two retired test-title IDs still need Coder cleanup so `check:docs`, and therefore `npm run check`, can pass. Removing obsolete references does not require restoring a brittle gesture or inventing replacement coverage now.
- **Possible product defect:** investigate the existing slotHidden question during Story 8. The static concern under Test Quality Concerns is not a reproduced defect, but if the implementation writes when the current wiki says a full-modal own-slot set-down writes nothing, the roadmap's "A defect is fixed in Story 8" rule applies. Defer the brittle surface regression test as appropriate; do not defer a confirmed behavior defect merely because Story 10 owns automation catch-up. A focused pure-module regression is compatible with Story 8's normal unit-test work.
- **Approval proposals:** the three partial internal-mapping proposals can remain pending until they are useful to the catch-up work. They are not an approval gate for Story 8.1 and do not change a case to Manual.

No catalog status is reversed by this scheduling clarification: an intentionally deferred case still stays Open while its full Then lacks approved, active coverage. This report does not amend the roadmap or certify that every new Open ID has already been recorded at its eventual destination.

The slotHidden question remains a PO-owned question in the story. DRAG-7.31 already has settled wiki support, not Pending PO status. Its missing automation is a developer coverage gap; a different desired behavior requires a PO ruling and wiki change before the Planner changes it.

## Duplication

Duplication is reported, not judged as waste:

- DRAG-1.3: `popSession.test.ts`'s parameterized outside-duration test and two `drag-column-bands.spec.ts` surface flows (exact titles in evidence).
- DRAG-1.14: three clock units plus the active `drag-5-stub-detach.spec.ts` distance test; they cover overlapping distance behavior with different omissions.
- DRAG-4.8: approved range/resolution, projection and collision tests in three files. Their assertions divide range, gap movement and subtree exclusion rather than all independently proving the full case.
- DRAG-4.12: request adapter, component row and UI childless-Q attach. They are distinct layers with incomplete joint coverage; the component pointer is only proposed.
- DRAG-5.1 and DRAG-5.4: request/placement units overlap active detach/reparent UI outcomes. Neither existing internal ID is automatically an approved whole-case mapping.
- DRAG-7.10: header-bound tests in popSession/dragStructure/KanbanCard overlap surface header containment. Do not add those internals merely to count more coverage; they do not close its missing exit variants.
- DRAG-7.13/DRAG-7.14: clock units and projection targets overlap UI hold/reset tests; foreign-entry and whole-Card padding behavior are still missing.
- DRAG-7.16: existing approved parameterized window geometry/depth mapping plus top/bottom/right UI tests. Retained as already approved, without proposing another pointer.
- ATT-7.6: the two route titles exercise complementary redundant and real-attach branches, rather than duplicate assertions.

## Test Quality Concerns

1. **DRAG-7.31 and slotHidden history.** The active `descendantsProjection.test.ts` title `in the hierarchy modal, which draws every level, its own slot is its own` creates a fresh projection with `sectionLevels: Infinity`. It never carries `slotHidden: true` through `reseedProjection`, unlike the story's exit/section/reopen path. The ID-bearing DRAG-4.29/DRAG-4.30 no-op test also has a visible own slot. Neither proves DRAG-7.31. Static reading shows `reseedProjection` retains the seed flag, and `advanceProjection`'s atOwnSlot requires its negation. This is evidence of a coverage risk aligned with the story question, not an executed failure or a product ruling. Add a current-rule test of that full history and no-request outcome; do not relabel today's output or change the case/wiki here.

2. **DRAG-7.2's active subset is insufficient.** Basic counts and post-drop counts are genuinely asserted. The count-one-with-dragged-child-excluded and sole-child-no-overflow tests in `drag-7-hierarchy-modal.spec.ts` are still skipped. File presence and the four active ID carriers cannot stand in for those two Then clauses.

3. **DRAG-7.11 isolates layout but not the clock.** The active test checks sole region registration, unchanged projected gap, and painted overlay bounds. NO_POP prevents an observed exit during the assertion; remaining locked cannot distinguish “outsideSince starts correctly” from “no outside clock ever starts.” The original skipped outside-pop test is unavailable evidence. A current test should observe/complete the outside clock while resting over the behind-backdrop Card, alongside the current isolation checks.

4. **DRAG-5.4 does not count writes.** Its final fetch and rendering would also pass if a detach had been committed on exit and an attach on release. Current wiki §8 and the case require no intermediate committed detach. Observe zero mutations before release and exactly the final reparent request. The same-Q-workphase setup also provides no distinct-workphase inheritance discrimination; the current case's column setup makes that unsurprising, but it should not be cited as cross-workphase proof.

5. **DRAG-7.13's X is not foreign.** `seedOverflowTree` creates X with `child('X', p)`; `holdAt` picks it up as a Stub at Descendants. The stage, early-release and below-row UI assertions are meaningful, but they do not exercise the revised Free-Card zoom-in origin stated by the case. Their file/title wording must not imply that missing path.

6. **The “one sample” UI title overclaims its driver.** `drag-5-stub-detach.spec.ts`'s active DRAG-5.11/DRAG-1.14 title calls `hoverTo` once, but the helper sends 15 then two mouse-move steps. Timer disabling proves distance-driven reachability, not one pointer sample or the two-pop cascade to Board. Do not stamp DRAG-1.19 on it. The direct pure `advancePopSession` distance tests are genuine single-sample clock assertions.

7. **The attach request adapter title is broader than its assertion.** `DRAG-4.1, DRAG-4.12, DRAG-5.4: attach: parentId + isAttached, never an anchor — always an append for an item arriving from outside` passes slot last and an empty target list. Its result is correct for that fixture, but it neither proves “never an anchor” for populated immediate-entry placements nor forbids later cursor-chosen anchors (current wiki §§6–7). Do not derive an invariant from the title; it is a narrow empty-scope request test.

8. **Existing mappings are rule grounded, with stated limits.** Hierarchy range tests assert independent concrete parents/anchors and boundary values from wiki hierarchy-placement; traveling-row tests contrast the wrong descendant anchor; route reattach tests use different workphases and inspect activity entries. They do more than mirror a returned object. DRAG-7.16 compares a painted placement with the committed result using `placementShown`, and also checks specific first/last-child and depth changes. That provides visual-versus-write consistency plus concrete rule oracles; a “preview equals request” comparison alone would not establish a correct placement.

No formal audit-doubted test was addressed to this run by the story's Open questions. No test execution result, timing stability, browser behavior, mutation-test claim from the story, or story sign-off is established by this static pass.

DRAG-1.3's active context-null/popped-out assertions establish a state transition, not the carried copy's free movement. A geometry assertion must compare the painted overlay with successive cursor positions after pop. Its reachability note does not remove that observable clause from the Then; the case is reopened until it is covered by an active ID-bearing test.

## Uncatalogued Tests

The whole-source inventory contains 638 leaf declarations with no case ID inherited or directly carried. This is an identity count, not a full semantic review of unrelated tests. The relevant unlabelled tests were read and kept in two groups.

Gate-only/internal safeguards with no separate product case proposed:

- `client/src/components/workflow/dragStructure.test.ts`: `looks for the bounds elements once per resolve, however many Cards are drawn` counts DOM queries; its first-key/own-key assertions protect lookup implementation, not a new user rule.
- `client/src/components/KanbanCard.test.tsx`: `does not slide: its sortable transition is off, so its rows are measured where it rests` protects dnd-kit measurement plumbing. The user-level foreign cursor walk is already DRAG-4.34; don't make “transition is none” a business case.
- `client/src/components/workflow/dragRegions.test.ts`: `finds the column under a Card, not the Card: the Card is reached by the named relation only` is lookup protection; broader layer rules already have cases.
- `client/src/components/workflow/dragOverlayGeometry.test.ts`: `is a no-op on its own output` and `gives the same answer on its own output, since the modifier chain runs it twice per frame` are idempotence safeguards, not new product cases.
- `client/src/lib/hierarchyPlacement.test.ts`: `a corrupted parentId cycle ends the walk instead of recursing forever` is defensive traversal behavior, not a cataloged valid-state business scenario.
- `client/src/components/BandGuides.test.tsx`: `keeps its cards mounted through every layer change of a drag` verifies mount stability; the user's retained expansion choice belongs to existing rules/cases, rather than a case requiring a particular React mount count.

Tests of existing business rules that are missing IDs appear under Proposed Stamps. The separate post-detach surface scenario below is a Planner candidate, not a coverage-gate requirement.

## Candidate New Cases

One candidate for the Test Planner to consider (no case added):

- **Immediate new drag after a completed detach.** `tests/ui/drag-5-stub-detach.spec.ts`, exact title `immediately after a detach, the same item drags and reorders normally as a Card`, commits a detach, picks X up again at its column, reorders before P and asserts parent retained, attachment clear and position before P. The state-driven pickup/reposition rules already live in wiki board-drag-interaction §§1–2 and item-attachment §11: this is a **Test Planner gap/possible existing-case extension**, not a PO request for new policy. The Planner may prefer extending an existing pickup/reposition case to a recently detached Free child rather than adding a standalone case.

No new business rule is proposed from the query-count, transition-style, idempotence or corruption guards. The existing slotHidden question is discussed under Test Quality Concerns and is not reclassified as an undocumented new-case proposal.

## Totals (by status and priority)

Real unique case headings only: README's illustrative DRAG-5.1 is excluded. The catalog contains **391 cases** throughout.

| Whole catalog, after this run | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 111 | 134 | 64 | 309 |
| Open | 25 | 36 | 13 | 74 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| Total | 136 | 172 | 83 | 391 |

Before: 312 Automated, 71 Open, 5 Manual, 1 Planned, 2 Pending PO. One Open → Automated (DRAG-5.5); four Automated → Open (DRAG-1.3, DRAG-5.4, DRAG-7.2, DRAG-7.11); net Automated −3/Open +3. No other catalog status or Automation line was changed.

| Scoped 44 cases, after this run | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 5 | 4 | 0 | 9 |
| Open | 12 | 18 | 4 | 34 |
| Manual | 0 | 0 | 1 | 1 |
| Planned | 0 | 0 | 0 | 0 |
| Pending PO | 0 | 0 | 0 | 0 |
| Total | 17 | 22 | 5 | 44 |

Scope before: 12 Automated, 31 Open, 1 Manual. Whole-catalog mandatory checks: zero absent-active-ID losses; two unknown IDs (one active, one skipped); zero Manual IDs carried by tests; 16 skipped source declarations. Approval proposals: three case-level internal-mapping proposals (DRAG-4.12, DRAG-1.28, DRAG-3.22), zero Manual proposals. No approvals were applied by this report.

Changed files are limited to:
- `docs/test-plans/board-drag-interaction/drag-1-contexts-and-popping.md` (one status, matching table/body, and its Automation line);
- `docs/test-plans/board-drag-interaction/drag-5-detach-and-overflow.md` (two statuses, matching table/body, and their Automation lines);
- `docs/test-plans/board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md` (two statuses, matching table/body, and their Automation lines);
- `docs/audits/test-reconciliation-story-8-1-codex-trial.md` (this report).

Story 8.1 readiness follows the roadmap's explicit 8.N close-out exception, not an added requirement to close these automation gaps now. The umbrella Story 8 close-out owns the full audit/reconciliation and routing of remaining gaps to Story 10. The possible slotHidden behavior issue remains distinct from deferred test repair. No check/test was executed, no execution success is claimed, and this reconciliation is not story sign-off.


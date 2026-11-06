# Confirming test reconciliation — Story 8.13

**Review complete; three scoped cases remain Open.** Eight cases move Open → Automated. DRAG-7.8 stays Automated; DRAG-7.28, DRAG-7.32 and DRAG-7.33 keep `—`. Reconciliation is complete; developer assertion work and the parent-navigation product decision remain outstanding.

Source review at HEAD `ff35aff`, including the uncommitted test updates and current wiki/catalog. Read the full story plan, latest stamped/gap-closing handoff, Amendments 5–6, Open questions, and the full prior report `docs/audits/test-reconciliation-story-8-13.md`. That report supplies the missing-Then baseline; the current rules control. Nathan approved its exact proposed component mappings, and the developer added their IDs. Approval does not make partial coverage whole. The previous DRAG-7.35 Pending PO disposition is superseded by the settled wiki and Planner's Open case.

Read root/workflow instructions, Reconciler definition, catalog conventions and documentation standards before relevant code. Review is narrow: the twelve scoped cases, their affected assertions, necessary helpers and integration code. The whole-catalog checks inventory IDs and skips; they do not re-review unrelated cases' full Then. No runtime suites, applications, browser probes, installations or commits were run. Reported Coder passes/failures are separate from this source assessment.

## Coverage Mapping

All titles below are active and stamped unless explicitly proposed. Paths identify the actual source inspected; partial cases receive no catalog pointer.

| Case | Exact test evidence and assessment |
|---|---|
| DRAG-7.8 | **Automated retained.** `tests/ui/drag-7-hierarchy-modal.spec.ts` — **“DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written”**. No Sheet/drag is opened; each dismissal is exercised, original section order/overflow count remain and the write list is empty. |
| DRAG-7.28 | **Open retained.** Same file — **“DRAG-7.28: a click on a row in the modal opens that item’s Sheet above it”** and **“DRAG-7.28: carrying a row in the modal opens no Sheet, and the release still places by gap and depth”**. Click verifies R1's identity, interactive title editing/cancel, same modal box and full hierarchy snapshot, and settled no writes. Drag checks Sheet suppression at pickup, carry and release, projected gap/depth `4:4:true`, and stored parent R1. It never checks the released row's stored order before R1a. That remaining gap is distinct from the preview metadata and persisted depth/parent. |
| DRAG-7.32 | **Open retained.** Same file — **“DRAG-7.32: closing the Sheet over the hierarchy modal, by Escape, its X or its backdrop, returns to the modal as it was”**. All three Sheet dismissals plus a click at the covered modal-X coordinate preserve IDs/titles/order/indents and explicitly nonzero scroll (30); settled writes are empty and a later Escape closes the modal. It does not capture/compare the modal's screen position after dismissal. Approved `client/src/components/HierarchyModal.test.tsx` — **“DRAG-7.32: Escape closes the modal with no Sheet open, and leaves it for the Sheet with one open”** uniquely calls the modal's own X with `sheetOpen: true` and checks no close callback, as well as Escape hold. Neither test supplies the missing position comparison. |
| DRAG-7.33 | **Open retained.** `tests/ui/drag-7-hierarchy-modal.spec.ts` — **“DRAG-7.33: a child link in the Sheet replaces the Sheet over the same modal, down to the last child”**. R → R1 → R1a child navigation checks one foreground Sheet, named identity, same modal box/hierarchy/scroll on each replacement, no writes and return to the modal. R1 → parent R is not built or tested: see Gaps. |
| DRAG-7.34 | **Open → Automated.** Same file — **“DRAG-7.34: an edit made in the Sheet appears in the open modal, which is not closed and reopened”**. Renames fixture R1 to `Renamed child`; the old row title disappears while the modal remains open. Row IDs/order/indents and all unrelated rows/titles match the pre-edit snapshot; server reads retain R1 under R and R1a under R1. Sheet dismissal returns to that updated snapshot. Fixture title `R1` serves the case's `First child` role. |
| DRAG-7.35 | **Open → Automated.** Same file — **“DRAG-7.35: the modal closes at once when its last attached descendant is detached from its open Sheet, and the Sheet closed by ${way} returns to the board”**, expanded for **its X**, **its backdrop**, **Escape**. Other P branches are detached during setup; detaching its last attached branch A empties P's modal, which disappears before Sheet dismissal. A's Sheet remains open with its heading; server read confirms detach. Each dismissal leaves the board, empty P section and no modal; exactly one observed write is the successful detach. The branch fixture exercises the settled empty-hierarchy outcome. No Pending PO change is made. |
| TREE-5.2 | **Open → Automated.** `tests/ui/project-tree-create-cap.spec.ts` — **“TREE-5.2: both Add subproject controls allow a child that reaches exactly the cap”** and **“TREE-5.2, TREE-5.3: both controls follow the project cap the server answers, not a limit of their own”**. Both real entry points open their named parent's dialog, submit valid names and read back distinct parents/depth exactly PCAP. Sidebar row hover reaches the actual enabled control. Supplemental cap-response fixture sets PCAP to 3 and checks both enabled at depth 2/disabled at depth 3. |
| TREE-5.3 | **Open → Automated.** Same file — **“TREE-5.3: both Add subproject controls stay drawn but disabled at the cap and past it, and start nothing”**, plus the shared TREE-5.2/TREE-5.3 title above. Real project cap is fetched; a test-route-pinned parent supplies depth PCAP + 1. Both projects stay readable, both controls are visible/native-disabled with exact feature-cap title, reject focus, and forced pointer/Enter activation opens no dialog and sends no write. The custom cap response exposes a client-local constant. |
| TREE-5.4 | **Open → Automated.** Same file — **“TREE-5.4: Add subproject stays offered until the cap is read, then follows it”**. Holds the actual GET response; both controls are enabled while unanswered and each opens the dialog. Sidebar create is cancelled; Overview submits an over-cap create, observes failure and confirms no stored row. Releasing the actual cap response disables both controls with exact reason at PCAP; selecting PCAP − 1 leaves both enabled. The API refusal is established here, not borrowed from another case's route test. |
| TREE-5.5 | **Open → Automated.** Same file — **“TREE-5.5: New project stays offered, and makes a top-level project, whatever the depth of the selected project and whether the cap is read”**; `tests/ui/project-sidebar.spec.ts` — **“TREE-5.5: creates a top-level project via the sidebar”**. Extended scenario selects an over-cap pinned project, creates with held-unread cap, then repeats after release with Add subproject disabled. Each top-level dialog has no `Under …`; persistence reads give `parentId = null`, depth 1. Ordinary sidebar spec supplies additional basic create coverage. |
| ATT-10.6 | **Open → Automated.** `tests/ui/item-create-cap.spec.ts` — **“ATT-10.6: the Sheet allows adding a child that reaches exactly the item cap”**. Reads actual board item cap, seeds a parent at absolute CAP − 1, opens its Sheet, activates/submits child create and reads the stored child at exact CAP, Attached to that parent with its workphase. Separately mocked project cap 3 cannot control the enabled item affordance. |
| ATT-10.7 | **Open → Automated.** Same file — **“ATT-10.7: the Sheet’s add-child control stays drawn but disabled at the item cap, and starts nothing”** and **“ATT-10.7: past the item cap, in data the API did not create, the control behaves the same way and the Sheet stays readable”**. Actual-cap fixture checks visible native-disabled control, exact item-cap title, focus exclusion, no child input or writes after forced pointer/Enter. Over-cap fixture retains real four-level server data but answers board item cap 3, independently of project cap 12; the readable Sheet's control is disabled with reason 3, not parent depth 4/project cap 12. Native disabled semantics apply in both fixtures. |

## Lost Coverage

Whole-catalog inventory: **470 actual cases**, excluding README examples; **102 test files**, **1,519 source test declarations** (parameterized/looped tests counted as declarations). All 298 initially Automated cases have an active title-prefix ID, including IDs inherited from `describe`. **No lost-ID downgrade.** This does not claim every out-of-scope Then was re-reviewed.

Skipped tests do not count. Found **22 skipped declarations in eight files**, 14 with IDs and eight without. Skip titles are unchanged from HEAD. Existing skipped occurrences do not erase active coverage elsewhere. Inventory includes inherited describe IDs/skips; source search found no additional conditional skip/fixme mechanism requiring another exclusion.

| File under `tests/ui/` | Skipped declarations | IDs (successive declarations separated by semicolons) |
|---|---:|---|
| `drag-7-hierarchy-modal.spec.ts` | 4 | DRAG-7.6/DRAG-7.10/DRAG-7.11; DRAG-7.2/DRAG-7.6; DRAG-7.2; DRAG-7.6 |
| `drag-7-modal-hold.spec.ts` | 6 | DRAG-7.14; DRAG-7.15; DRAG-7.15; DRAG-7.17; DRAG-7.12; DRAG-7.10/DRAG-7.18 |
| `drag-7-overflow-row.spec.ts` | 1 | DRAG-7.27 |
| `drag-5-stub-detach.spec.ts` | 1 | DRAG-5.13 |
| `project-tree-drag.spec.ts` | 2 | TREE-1.4; TREE-2.1 |
| `drag-card-zoom-in.spec.ts` | 2 | None |
| `item-repositioning-cross-column-dnd.spec.ts` | 2 | None |
| `item-repositioning-cross-project-dnd.spec.ts` | 4 | None |

Inherited drag skips retain their existing Story 10 routes. This review introduces none.

## Unknown IDs

**None** across test/describe titles in server tests, client `.test.ts(x)` and Playwright `.spec.ts` sources. **No Planner-set Manual case ID is claimed by any active or skipped test title.** All Manual fields remain untouched.

## Proposed Stamps

Previously proposed stamps are now present on the exact named component/surface candidates, including the renamed Overview title **“TREE-5.2: is offered one level short of the cap, and names the project as the parent”**. New surface titles are listed in Coverage Mapping.

One concrete remaining proposal: add **DRAG-7.28** beside DRAG-7.9 on `tests/ui/drag-7-hierarchy-modal.spec.ts` — **“DRAG-7.9: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child”**. It performs the same R2 drag and asserts stored parent R1, attachment/workphase and `R2.position < R1a.position`, supplying the missing committed gap order. Alternatively extend the already stamped DRAG-7.28 drag spec with that assertion. Developer owns either change; no mapping is written until a confirming run sees the stamp/assertion. No internal approval is needed for this surface proposal.

## Proposed Internal Mappings (need approval)

**No new approval request.** Nathan approved exactly the prior report's mappings: `client/src/components/HierarchyModal.test.tsx` → DRAG-7.32; `client/src/components/sidebar/SortableProjectRow.test.tsx` and `client/src/components/ProjectOverviewTab.test.tsx` → TREE-5.2/TREE-5.3/TREE-5.4; `client/src/components/ItemDetailPanel.test.tsx` → ATT-10.6/ATT-10.7. Those stamps are present. No blanket approval is inferred.

The project/Sheet cases now have whole surface coverage, so no new component pointer is added beside it. DRAG-7.32's approved component uniquely supplies actual modal-own-X hold, but the case remains partial and therefore keeps `—`; approval remains available when its remaining assertion gap closes. The callback-only DRAG-7.28 component is not a new approved mapping. Existing approved pointers and the README's two standing categories remain unchanged.

## Proposed Manual (need approval)

None. Remaining assertion gaps are concrete and automatable; DRAG-7.33 requires a product/build disposition. No Manual conversion or approval is proposed.

## Gaps

| Case | Precisely remaining Then and owner |
|---|---|
| DRAG-7.28 | **Committed sibling gap/order.** New stamped drag spec named in Coverage Mapping observes projection gap/depth and stored parent, not stored order before R1a. Developer extends it or stamps the exact existing DRAG-7.9 spec in Proposed Stamps; Reconciler later confirms. The Sheet interaction/hierarchy/no-write/suppression portions are closed. No app defect is inferred from this absent assertion. |
| DRAG-7.32 | **Modal's prior screen place through dismissals.** Named surface spec's `modalState` snapshot contains row ID/title/indent and list scroll only; `modalX` captures a click point, not a before/after position assertion. Developer captures `boxOf(modal)` before opening the Sheet and compares it in the existing `backToModal` helper after each dismissal, or adds equivalent stamped coverage. Order/depth/nonzero scroll, no writes, dismissal layering, actual own-X hold and later Escape are now covered. No new approval is needed. |
| DRAG-7.33 | **Parent navigation R1 → R, then child return.** Current wiki board-drag-interaction §9 and case explicitly require it. Production `client/src/components/item-detail/ParentSection.tsx` renders only a Parent select whose change calls `updateItem` (reparent/write), plus an Attached toggle; it accepts no navigation callback. `ItemDetailPanel.tsx` passes navigation to `ChildrenSection`, whose child buttons call it, but not to ParentSection. This is an actual documented-product/build mismatch, not merely an absent test. PO/Nathan decide whether to build the parent link or revise the rule; Planner follows any wiki ruling, developer completes the resulting scenario, Reconciler confirms. Do not silently delete the parent clause or restore Pending PO. Child-only title named above supplies useful partial evidence. |

The story plan already routes DRAG-7.33 to PO/Planner. DRAG-7.35 needs no further ruling: Amendment 5 settles immediate automatic empty close, and Amendment 6 supplies its live case. DRAG-7.32 tests the distinct nonempty hierarchy. All other missing Then portions in the prior report are closed by the named source assertions. These remaining tasks belong to 8.13 or its scheduled Story 8 close-out, with no automatic Story 10 deferral.

## Duplication

Report only; no removal judgment:

- DRAG-7.28's callback component **“DRAG-7.28: a click on a row opens that row’s Sheet”** repeats clicked-ID dispatch already covered through the surface. It is not added as a pointer.
- DRAG-7.32 component Escape hold overlaps surface dismissal; its actual own-X callback guard is unique. The surface click at the modal-X coordinate reaches the **Sheet backdrop**, not the covered modal button, and must not be described as firing that modal close request.
- Approved project components carry **“TREE-5.2, TREE-5.4: is offered one level short of the cap, and while the cap is not yet read”**, **“TREE-5.3: shows disabled, saying why, at the cap, and creates nothing”** (sidebar); **“TREE-5.2: is offered one level short of the cap, and names the project as the parent”**, the same TREE-5.3 title, and **“TREE-5.4: is offered at any depth until the cap is read”** (Overview). They overlap whole surface boundary/loading coverage.
- Approved Sheet components carry **“ATT-10.6: is offered for an item one level short of the cap”** and **“ATT-10.7: shows disabled, saying why, for an item at the cap, and opens no form”**; these overlap whole surface control coverage. Basic TREE-5.5 create also overlaps the extended surface scenario. No new redundant internal pointers are written.

## Test Quality Concerns

Assertions are grounded in the independent wiki formulas and case outcomes. Real-cap boundary creates/readbacks prove persisted fields; expectations are not computed by the helper under test. Project-response cap 3 and board-response item cap 3 are **mocked client-contract checks**, not proof that the running API enforces those substituted caps. The actual-cap scenarios use real server values/data; unread over-cap project submission proves actual refusal/persistence. Project over-cap data is pinned through the test helper; item over-cap behavior lowers the board's answered cap over real data. The latter does not claim the server accepted an illegal create or changed its own configured cap.

Native `disabled` plus exact `title` establish disabled accessibility, inertness, tab exclusion and native hover reason. Surface tests additionally observe visibility/reachability and no dialog/input/request at the relevant cap boundary. The Coder's “keyboard reach of sidebar hover actions not closed” is **not an extra missing Then**: the catalog requires offered hover actions and disabled controls taking no focus, not keyboard discoverability of enabled hover actions. No redundant OS-tooltip or disabled-keyboard test is demanded. Color/opacity/cursor, all-modal stacking and notifications are outside these cases.

Remaining quality limitations are the two bounded assertion gaps above. Preview gap/depth does not substitute for committed sibling order; a hierarchy/scroll snapshot does not include screen coordinates. DRAG-7.34's rename readback path updates the live modal, not only a Card. DRAG-7.35 asserts automatic close before Sheet close and exactly one successful detach write, rather than assuming all modal closure obeys the dismissal hold.

**Story Open questions:** DRAG-7.33 is addressed as the actual parent-navigation mismatch above. Full-run drag failures remain reported history, not this review's runtime verification: first run DRAG-7.10/7.3/7.29, second 7.16/7.4/7.29, latest third 7.10/7.16/7.4. Only 7.10/7.3/7.29 were reportedly tried at pre-Phase-1 `ed771e3`; 7.16 and 7.4 are not baseline-proven. Do not call all failures established baseline or claim a clean runtime suite. Coder reports the latest failures do not touch the added assertions; no new skip is present. Runtime status and assertion coverage are separate.

## Uncatalogued Tests

`client/src/lib/hierarchy.test.ts`, describe **“noChildReason”**: **“with a cap of %i: a parent one level short of it takes a child, one at it does not”** (4/12), **“refuses a parent already past the cap, from data that predates it”**, **“offers the control while the cap is not yet read”**. Supporting helper/coverage tests of already catalogued boundaries; no standalone mapping is proposed. The over-cap helper assertion now pins exact cap-6 wording.

`client/src/components/HierarchyModal.test.tsx` — **“a click centers it the same way”** remains preexisting supporting coverage, not a new 8.13 scenario. Existing different-ID route cap and response-forwarding tests are supporting context, not automatically borrowed mappings. All newly targeted business scenarios have catalog IDs; the only proposed additional stamp is the exact DRAG-7.9 surface assertion above.

## Candidate New Cases

None in the narrow scope. Existing cases cover the settled modal/cap scenarios. No cases for wiki Open questions, unspecified disabled appearance, other modal stacking or notifications. No case text, title, priority or ID was changed, added or deleted.

## Totals

Actual case bodies across the whole catalog, excluding README and not double-counting summary rows:

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 111 | 136 | 59 | 306 |
| Open | 31 | 100 | 24 | 155 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 2 | 2 |
| **All** | **142** | **239** | **89** | **470** |

Scoped twelve: **9 Automated** (P1 6 / P2 3), **3 Open** (P1 2 / P2 1). Entering this run: 298 Automated / 163 Open / 5 Manual / 2 Planned / 2 Pending PO; Planner's prior DRAG-7.35 resolution is preserved. This run promotes eight (P1 five / P2 three), with no demotions. DRAG-7.8 remains Automated; DRAG-7.28/7.32/7.33 remain Open with `—`.

Only summary/body status and Automation fields in the three affected catalog suites, plus this new report, were written. Prior report, preexisting test/code/wiki/story work and archives remain untouched. Parent handles documentation and allowed-field diff checks. Outstanding routes: developer for DRAG-7.28/7.32 assertions/stamps; PO/Nathan then Planner/developer for DRAG-7.33. No new internal or Manual approval is outstanding. This is a completed source reconciliation, with no runtime pass claim.

# Test reconciliation — Story 8.13

Source review at `ff35aff` (`7583f5b` modal/Sheet; `95577c3` child-create cap), compared with `ed771e3`. Scope is the complete story plan, Amendments 1–4, Open questions and Living-docs handoff; current wiki passages and case Rules control the judgments. Read the root and workflow `AGENTS.md`, Reconciler instructions, catalog conventions and documentation standards before reviewing tests.

This is source-only reconciliation. No suites, apps, browser probes, installations or commits were run. Test existence and assertion coverage are established; runtime passes are not. Review covers the revised/new cases below and related assertions necessary to assess them. Outside scope, the whole-catalog pass inventories IDs and skips, not full Then coverage.

## Coverage Mapping

Exact existing and candidate titles are named in this section or Proposed Stamps. A candidate is not a mapped test until stamped; an internal candidate additionally needs Nathan's approval. Partial cases keep `—` even if some tests carry their IDs.

| Case | Result | Source assessment |
|---|---|---|
| DRAG-7.8 | Automated → Automated; pointer unchanged | `tests/ui/drag-7-hierarchy-modal.spec.ts`, **“DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written”**. Setup opens no Sheet or drag. All three dismissals are asserted, followed by the original section IDs, overflow count and empty write list. The revised qualification is satisfied. |
| DRAG-7.28 | **Automated → Open; pointer → `—`** | Same file, **“DRAG-7.28: a click on a row in the modal opens that item’s Sheet above it”** asserts R1's Sheet heading/open state, surviving modal box and settled no-write observation. It does not assert unchanged hierarchy or a press becoming a drag opening no Sheet. `client/src/components/HierarchyModal.test.tsx`, **“DRAG-7.28: a click on a row opens that row’s Sheet”**, only asserts the callback receives the clicked ID; it supplies neither missing portion and has no approved internal pointer. |
| DRAG-7.32 | Open; `—` retained | Unstamped surface dismissal candidate plus unstamped component hold candidate, detailed below. Together still omit unchanged list order/depths/nonzero scroll, dismissal no-write observation, and modal-backdrop hold assertion. |
| DRAG-7.33 | Open; `—` retained | No stamped or unstamped test found that follows R1 → R → R1 → R1a over the same modal. No existing mapping. |
| DRAG-7.34 | Open; `—` retained | No test found that renames R1 in a Sheet over a live hierarchy modal and checks that modal. Existing Card-rename and Sheet response-forwarding tests do not assert this scenario. |
| TREE-5.2 | Open; `—` retained | Unstamped sidebar/Overview candidates assert enabled state one level below cap; only Overview asserts its parent callback. Neither proves actual dialog/submission at exactly PCAP or live server-cap wiring. |
| TREE-5.3 | Open; `—` retained | Unstamped sidebar/Overview candidates assert the native disabled button, exact cap title, and no create callback at PCAP. No component/surface over-cap fixture or actual sidebar hover-action visibility assertion. Native title supplies the hover reason. |
| TREE-5.4 | Open; `—` retained | Unstamped sidebar/Overview candidates start with `null` cap and assert enabled state. Neither opens the dialog there nor holds/resolves the cap request and verifies both controls' transitions at PCAP and PCAP − 1. |
| TREE-5.5 | Open; `—` retained | Ordinary top-level create surface candidate exists, but does not exercise selected/deep/over-cap projects, unread cap, or read back `parentId = null` and depth 1. |
| ATT-10.6 | Open; `—` retained | Unstamped Sheet candidate asserts enabled state at absolute CAP − 1. No boundary submission/readback proving attached child of P, same workphase, depth exactly CAP, or board item-cap wiring. |
| ATT-10.7 | Open; `—` retained | Unstamped Sheet candidate asserts native disabled state/title at CAP, with no child form after clicking. No over-cap Sheet fixture or live item-cap-versus-project-cap wiring assertion. Native title supplies the hover reason. |
| DRAG-7.35 | Pending PO; **all fields untouched** | No mapping judgment. The last-descendant detach while its Sheet stays open needs the PO/Nathan precedence decision in the wiki. Normal DRAG-7.32 and title-edit fixtures must retain a branch. |

Related existing coverage was read only as needed, without borrowing its IDs: `server/tests/routes/projects.test.ts`, **“TREE-3.5: a write that leaves the deepest descendant at PROJECT_DEPTH_CAP is accepted, and one past it isn’t”**, actually checks legal final-level create and refused next-level create with unchanged list; `server/tests/routes/items.hierarchy.test.ts`, **“ATT-4.10: POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused”**, checks refusal (the title alone overstates that individual test's assertions). Neither substitutes for UI create/control behavior or carries a new case's ID. TREE-3.4 is the nonexistent-parent rule, not the cap rule.

The changed helper setups also feed existing DRAG-7.25, DRAG-7.15/DRAG-8.1, TREE-2.9 and TC-5a.1 tests; their existing assertions/IDs were not removed or changed by the story. No status or pointer change was justified by those fixture-only additions. The existing TC-5a.1 internal pointer remains approved for its named response-forwarding tests; it does not approve ATT-10 or Sheet navigation/edit mappings. No broader re-audit of their prior-story Then coverage was performed.

## Lost Coverage

Across all 470 catalog cases, every initially Automated case has an active test carrying its ID, including IDs inherited from `describe`. **No lost-ID downgrade.** DRAG-7.28's downgrade is an expanded-rule coverage gap, not a lost stamp. The two code commits delete no test and drop no case ID; the previous DRAG-7.28 surface title is revised in place.

Skipped tests do not count. Inventory found 22 skipped tests in 8 files; 14 carry IDs and 8 have none. The inherited skips and their cases remain on their existing routes; no skip was introduced by Story 8.13. Cases also named by a skipped test can have active coverage elsewhere, so a skipped occurrence alone does not reopen an Automated case. Full inventory comparison and route details appear under Test Quality Concerns.

## Unknown IDs

None in test/describe titles across `server/tests`, `client/src/**/*.test.ts(x)` and `tests/**/*.spec.ts`. Whole-catalog title inventory also found **no Manual case ID claimed by a test**, skipped or active. Planner-set Manual cases remain untouched.

## Proposed Stamps

Developer owns stamps and any needed assertions. These are **partial candidates**, not instructions to mark a full case Automated. No test code was edited.

| Case ID to add | Exact file and current title | What the candidate establishes |
|---|---|---|
| DRAG-7.32 | `tests/ui/drag-7-hierarchy-modal.spec.ts` — **“closing the Sheet over the hierarchy modal, by Escape, its X or its backdrop, returns to the modal as it was”** | All three Sheet dismissals leave the modal visible at its prior box, then a later Escape closes it. Missing assertions are listed in Gaps. Surface test needs a stamp, not internal approval. |
| DRAG-7.32 | `client/src/components/HierarchyModal.test.tsx` — **“Escape closes the modal with no Sheet open, and leaves it for the Sheet with one open”** | Modal Escape/X hold with `sheetOpen: true`; ordinary Escape callback without Sheet. Internal approval also required for its unique hold portion. |
| TREE-5.2, TREE-5.4 | `client/src/components/sidebar/SortableProjectRow.test.tsx` — **“is offered one level short of the cap, and while the cap is not yet read”**, under **“SortableProjectRow’s Add subproject at the depth cap”** | Sidebar enabled/title below cap and enabled for unread cap. |
| TREE-5.3 | Same file/describe — **“shows disabled, saying why, at the cap, and creates nothing”** | Native disabled/title and absent create callback at PCAP. |
| TREE-5.2 | `client/src/components/ProjectOverviewTab.test.tsx` — **“is offered one level short of the cap, and creates under the project”**, under **“the Overview tab’s Add subproject at the depth cap”** | Enabled/title at PCAP − 1; click names correct parent to callback, not a persisted create. |
| TREE-5.3 | Same file/describe — **“shows disabled, saying why, at the cap, and creates nothing”** | Native disabled/title and absent create callback at PCAP. |
| TREE-5.4 | Same file/describe — **“is offered at any depth until the cap is read”** | One `null`-cap render enabled at PCAP, without an asynchronous response transition. |
| ATT-10.6 | `client/src/components/ItemDetailPanel.test.tsx` — **“is offered for an item one level short of the cap”**, under **“the Sheet’s add-child control at the depth cap”** | Enabled control at API-relative depth CAP − 2, hence absolute CAP − 1. |
| ATT-10.7 | Same file/describe — **“shows disabled, saying why, for an item at the cap, and opens no form”** | Native disabled/title at API-relative CAP − 1, hence absolute CAP; pointer activation opens no form. |
| TREE-5.5 | `tests/ui/project-sidebar.spec.ts` — **“creates a top-level project via the sidebar”** | Normal New project dialog/submission reaches visible sidebar row. Extend for the deep/over-cap/unread states and persisted root/depth checks before counting the full case. |

## Proposed Internal Mappings (need approval)

Nathan has supplied no new internal mapping approval. The component candidates above are ordinary create/Sheet behavior, not parameterized pop-clock logic or pure drag-only ordering/request rules. Their location in drag-related files and hands-on implementation approval do not authorize mapping.

If their partial evidence is retained in the eventual coverage, Nathan must approve these exact file-to-case mappings, and a developer must add the stamps, in either order: `HierarchyModal.test.tsx` → DRAG-7.32; `sidebar/SortableProjectRow.test.tsx` and `ProjectOverviewTab.test.tsx` → TREE-5.2, TREE-5.3, TREE-5.4; `ItemDetailPanel.test.tsx` → ATT-10.6, ATT-10.7 (all paths under `client/src/components/`, exact titles above). Approval and stamps alone leave them partial; the missing Then assertions remain necessary. Completing a surface test for a whole case avoids the need for an internal mapping beside it.

Do not add a new DRAG-7.28 internal pointer for the callback-only test: its current click evidence overlaps the surface test and closes no identified missing portion. The cap helper's tests are useful supporting checks, but no separate internal mapping is proposed for them: their over-cap/null return values do not establish the named controls' full UI behavior.

## Proposed Manual (need approval)

None. The unsettled visual look is outside the cases. Dismissal, Sheet replacement/edit propagation and cap controls admit concrete assertions; no evidence establishes that automating these cases is not worthwhile. Existing Manual cases stay unchanged.

## Gaps

These are assertion gaps, separate from the stamp/approval blockers above. The exact candidate files/titles are in Coverage Mapping and Proposed Stamps; adding their IDs or approving internals does not supply these assertions. Developer owns closure in Story 8.13 or its scheduled Story 8 close-out; none is automatically deferred to Story 10.

| Case | Missing Then / action |
|---|---|
| DRAG-7.28 | Extend the named surface spec, or focused companion carrying this ID: demonstrate the foreground Sheet is available for interaction over the modal; compare the hierarchy before/after opening it; start a row drag and assert no Sheet opens while carrying, with ordinary gap/depth placement retained. Current heading/open-class/box assertions alone do not prove every part. The existing DRAG-7.9 specs exercise modal placement but do not assert Sheet suppression and do not carry DRAG-7.28. |
| DRAG-7.32 | Extend the named dismissal surface candidate: preserve/compare order and depths and a meaningful nonzero list scroll after each X/backdrop/Escape; observe no writes; demonstrate that modal close requests cannot dismiss it during the Sheet. The component candidate already establishes its own X/Escape hold; it does not fire the modal backdrop, render two live surfaces, or check preserved list/scroll. Preserve a nonempty branch to avoid DRAG-7.35. |
| DRAG-7.33 | Add a focused surface test carrying DRAG-7.33: follow R1 → parent R → child R1 → child R1a; assert each replacement's identity, one foreground Sheet, same modal hierarchy/place/scroll throughout, no writes, and final dismissal returning there. No existing test title can be stamped to claim this sequence. |
| DRAG-7.34 | Add a focused surface test carrying DRAG-7.34: successful First child → Renamed child edit updates the already-open modal row, retaining R/R1/R1a relationships, ordinal places, unrelated titles/places, and updated state after Sheet dismissal. Keep other descendants attached. `tests/ui/unsorted-unknown-status.spec.ts`, **“a rename shows on its Card at once”**, proves Card rename propagation, not this modal scenario. |
| TREE-5.2 | Extend the two named control candidates or add whole surface coverage: activate both entry points at PCAP − 1, open P's actual dialog, submit and read back child parent/depth exactly PCAP. Check sidebar hover actions offer the enabled button and the app uses the server's project cap rather than another cap. A mocked callback is not persistence; a bare enabled assertion is not a dialog. |
| TREE-5.3 | Exercise both controls with existing parent at PCAP + 1 as well as PCAP; retain readable project. Verify sidebar hover actions actually reveal the control. Existing native disabled/title assertions establish drawn DOM control, disabled accessibility/inertness/tab exclusion and exact native hover reason for the PCAP fixture; redundant keyboard gestures or OS-tooltip automation are not required solely to re-prove those native semantics. Through-app assertions should establish that no create dialog/request starts in the tested states and the server's project cap is the one named. |
| TREE-5.4 | Hold the real project-cap response: both controls enabled and able to open dialog while unanswered; resolve it to the parent's depth and check both disabled with exact reason; repeat at parent PCAP − 1 and check both remain enabled. Existing route refusal supports the API rule but carries TREE-3.5, not TREE-5.4; stamp that proven API portion if used, or assert the attempted unread-state over-cap create is refused through the integrated scenario. |
| TREE-5.5 | Extend **“creates a top-level project via the sidebar”** in `tests/ui/project-sidebar.spec.ts`: selected projects at/past cap, loaded and held-unread cap states, enabled New project despite disabled Add subproject, top-level dialog, valid submit, and persisted `parentId = null` / absolute depth 1. No approval is needed for this surface test, but its TREE-5.5 stamp is missing. |
| ATT-10.6 | Extend the named Sheet candidate or a surface test: activate and submit under absolute CAP − 1, then verify actual child at CAP, attached to P with P's workphase. Prove the Sheet receives the board's item cap independent of the project cap. The preexisting `ItemDetailPanel.test.tsx` TC-5a.1 **“from creating a child”** test only checks a mocked response is forwarded; it does not prove this boundary or persisted fields. |
| ATT-10.7 | Add existing over-cap parent CAP + 1 fixture and confirm readable Sheet, visible/native-disabled control, same cap reason and no input/request on activation; prove item-cap source independent of project cap. Credit current native disabled/title semantics at CAP as above; do not invent a separate visual-style or tooltip-gesture requirement. |

**PO action, not an automation gap:** DRAG-7.35 remains Pending PO. PO takes the Sheet-open/empty-modal precedence to Nathan, then records the rule in the wiki before Planner resolves the case. Reconciler did not infer the answer from implementation or alter any field.

## Duplication

Report only; no test deletion judgment or proposal.

- DRAG-7.28 has the surface click spec and `HierarchyModal.test.tsx` callback test (exact titles above). The latter repeats clicked-ID dispatch at a narrower layer; it is not an approved pointer and supplies no new missing portion.
- DRAG-7.32's surface dismissal candidate and component Escape/X hold candidate overlap the modal surviving Escape. The component uniquely fires the modal's own X while `sheetOpen` is true, but does not prove full stacking/lifetime behavior. No mapped duplication is introduced.
- The cap candidates repeat the shared boundary at three component surfaces; `client/src/lib/hierarchy.test.ts`'s `noChildReason` tests repeat its arithmetic/wording underneath them. These cover distinct depth-base adapters as well as shared logic. No internal mapping is added, and no redundancy is judged removable.
- Existing cap route tests validate API legality, while control candidates validate affordances; neither substitutes for the other. Existing unrelated same-ID mappings were not broadly re-audited.

## Test Quality Concerns

The reviewed new assertions are grounded in wiki board-drag-interaction §9 and hierarchy-placement §6/project-tree §5/item-attachment §14, not tautological expectations generated by calling the implementation under test. Injecting explicit caps and testing boundary depths is appropriate. The helper's two supplied caps guard against a hidden constant. Hardcoded CSS translation classes/box equality observe only part of Sheet availability; class names are not themselves a settled stacking rule. Native `disabled` and `title` are meaningful behavior evidence, not reasons to require redundant keyboard or native-tooltip probes. The remaining problem is partial/integration coverage and missing stamps/approvals, not a finding that these useful assertions should be removed.

Specific concerns: the unstamped dismissal spec's comment **“the next Escape closes the modal”** is broader than its immediate sequence: it closes/reopens Sheets with the other methods before the final Escape. It does still demonstrate that one Escape closes only the Sheet and a later Escape with no Sheet closes the modal; it does not inspect preserved list/depth/scroll or writes. The Overview **“creates under the project”** title means callback dispatch in that component test, not an actual successful create. The Sheet cap tests correctly translate API root-at-0 depths to the wiki's absolute root-at-1 depths. `noChildReason`'s over-cap test checks only non-null, not the exact feature-cap wording, so it cannot substitute for over-cap control assertions.

**Story Open questions:** the full-run failures are reported timing history, not this run's verification. The plan names DRAG-7.10, DRAG-7.3 and DRAG-7.29 in one full run, DRAG-7.16, DRAG-7.4 and DRAG-7.29 in another. Only 7.10/7.3/7.29 were reportedly tried at base `ed771e3`; no claim is made that 7.16 or 7.4 was baseline-proven. Keep the existing Story 10 timing investigation. Any breakage caused by 8.13 must be fixed here, not newly skipped; source inspection found no new skips. No test status changes follow from unobserved runtime history.

Whole-catalog skipped-title inventory, compared with `ed771e3`: all counts and skipped titles/callees are unchanged. These are inherited exclusions, not active coverage claims:

| File (under `tests/ui/`) | Skipped tests | IDs carried |
|---|---:|---|
| `drag-7-hierarchy-modal.spec.ts` | 4 | DRAG-7.6, DRAG-7.10, DRAG-7.11; DRAG-7.2/DRAG-7.6; DRAG-7.2; DRAG-7.6 |
| `drag-7-modal-hold.spec.ts` | 6 | DRAG-7.14; DRAG-7.15 twice; DRAG-7.17; DRAG-7.12; DRAG-7.10/DRAG-7.18 |
| `drag-7-overflow-row.spec.ts` | 1 | DRAG-7.27 |
| `drag-5-stub-detach.spec.ts` | 1 | DRAG-5.13 |
| `project-tree-drag.spec.ts` | 2 | TREE-1.4; TREE-2.1 |
| `drag-card-zoom-in.spec.ts` | 2 | None |
| `item-repositioning-cross-column-dnd.spec.ts` | 2 | None |
| `item-repositioning-cross-project-dnd.spec.ts` | 4 | None |

The inherited drag gaps keep their existing Story 10 routes; this scoped run does not decide their full assertions. DRAG-7.2/7.11 also have active tests, so their skipped occurrences do not mean their IDs are lost. No whole-catalog Automated case relies solely on a skipped title by the ID inventory.

## Uncatalogued Tests

Distinguish unstamped coverage of an existing rule from a missing catalog scenario:

- The new Sheet-dismissal and create-control candidates in Proposed Stamps belong to existing DRAG-7.32, TREE-5.2–TREE-5.4 and ATT-10.6–ATT-10.7 cases. They are not new cases and are not mapped yet.
- `client/src/lib/hierarchy.test.ts`, describe **“noChildReason”**: **“with a cap of %i: a parent one level short of it takes a child, one at it does not”** (`[4, 12]`), **“refuses a parent already past the cap, from data that predates it”**, **“offers the control while the cap is not yet read”**. These are useful shared-helper supporting/coverage checks of the already-catalogued boundary, over-cap and unread-cap scenarios. No standalone implementation-level case or shared-rules catalog folder is needed; no mapping is proposed.
- The unstamped `HierarchyModal.test.tsx` **“a click centers it the same way”** predates 8.13 and supports the existing modal-opening rule; it creates no new 8.13 scenario. The new callback test is stamped DRAG-7.28 but not approved as an internal pointer. Related preexisting ordinary New project and Card-rename tests supply leads, not the missing cap/modal scenarios.

## Candidate New Cases

None identified within this scoped review. The settled scenarios already have cases. No cases were created, renamed or deleted. Shared hierarchy-placement rules get no feature catalog folder. No case is proposed for unspecified color/cursor/opacity, stacking over every other modal/notifications, or other item-sheet Open questions. DRAG-7.35 already records the unresolved rule intersection and remains for the PO.

## Totals

Counts are actual case headings/bodies across the catalog, excluding README examples; summary rows are not counted twice.

| Status | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| Automated | 111 | 131 | 56 | 298 |
| Open | 31 | 105 | 26 | 162 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 1 | 1 | 2 |
| Pending PO | 0 | 0 | 3 | 3 |
| **All** | **142** | **239** | **89** | **470** |

Scoped 12 cases: Automated 1 (P1), Open 10 (P1 7 / P2 3), Pending PO 1 (P2). Net catalog change: DRAG-7.28 Automated → Open in body and summary, Automation test → `—`. No promotions; nine new Open cases and DRAG-7.35 remain unchanged. Before this correction totals were Automated 299 / Open 161; other statuses unchanged.

**Review complete.** Outstanding work is external to reconciliation: developer adds the exact stamps and missing assertions above; Nathan approves any retained new internal mappings (no Manual proposal); PO/Nathan resolves DRAG-7.35 in the wiki, then Planner updates that case. A later reconciliation confirms the completed/stamped coverage. The present report is final source review, with no runtime pass claim. Only the allowed catalog fields and this new report were written; parent handles documentation/diff checks.

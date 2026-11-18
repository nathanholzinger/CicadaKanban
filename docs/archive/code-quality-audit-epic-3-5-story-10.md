# Epic 3.5 Story 10 close — code quality audit

**Review completed:** 2026-11-18 · **Status:** review complete; **13 required findings remain open**, #4 to #16; Nathan deferred #1 to #3 to MVP Deferrals. The Architect plans the fixes. Twelve structural findings are optional.

## Scope and execution

Nathan authorized `story-10-checkpoint-audited..0935c4e313864c38c55a2d9dfcb5af5fe94ed043`. The base tag resolves to `3b2349398260f09abb8daf4b964082bae1bca832`; the end is `0935c4e313864c38c55a2d9dfcb5af5fe94ed043`. The range excludes the base and holds **18 commits**. HEAD still matches that end. App source, tests and configuration were not edited by this audit.

The range includes the checkpoint audit's remaining fixes, Story 10 batches 4c–4h and the close-out. Earlier tech-debt work and batches 4a/4b were not re-audited as code-quality scopes. Step 8 of [the close plan](../planning/epic-3-5-stories/story-10-close.md) separately requires 4a's seven production files to be checked against the wiki; that supplement is recorded below.

The [allocation](epic-3-5-story-10-scopes/README.md) and [custom config](epic-3-5-story-10-scopes/config.json) produced **22 cold instances**, with at most three subagents active beside the orchestrator. The generator selected **80 files, 8,552 changed lines and 29 removal sites**, excluding **9 unchanged moved lines**. **46 files** were marked read whole, with no manual overrides, deleted paths or renamed paths. No eligible file was omitted or assigned twice within a lens.

| Pass                      | Instances                                                                                    | Files | Changed lines | Removal sites |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----: | ------------: | ------------: |
| Correctness & Security    | app-source, app-tests, board-modal, board-targets, board-responses, sidebar, harness-tooling |    64 |         8,490 |            29 |
| Consistency & Drift       | app-source, app-tests, board-modal, board-targets, board-responses, sidebar, harness-tooling |    80 |         8,552 |            29 |
| Duplication & Abstraction | app-source-tooling, app-tests, board-interaction, board-responses, sidebar                   |    64 |         8,490 |            29 |
| File Responsibility       | client-tooling, e2e-interaction, e2e-responses                                               |    46 |         8,316 |            18 |

The read-whole lists are the [18 client/tooling files](epic-3-5-story-10-scopes/scope-fileresp-client-tooling.md), [18 interaction files](epic-3-5-story-10-scopes/scope-fileresp-e2e-interaction.md), and [10 response/runtime files](epic-3-5-story-10-scopes/scope-fileresp-e2e-responses.md). Unmarked files were read at their changed/removal sites with the necessary caller context.

All 22 instances completed without an unread scope file or site. Each received its pass definition and scope without inherited conversation, story plans, prior audits, reconciliation reports or wiki input. Two usage-limit interruptions affected five instances; the same instances resumed without restarting or widening their scopes. The [execution ledger](epic-3-5-story-10-scopes/execution.json) and its linked raw returns preserve that record.

The orchestrator retraced every required finding and independently replayed all three correctness candidates. Painted-geometry drift from two passes is merged into #7; the checked-deletion bypass from Drift and Duplication is merged into #15. No mandatory file split was established.

### Plan and reconciliation checks

The merge read the main Story 10 and close plans, the relevant batch handoffs, the archived Catalog Coverage Report's audit-fix decisions/handoff, MVP Test-Process Trim, MVP Deferrals, and all six close reconciliation reports. The affected TREE note was also checked against batch 4g's reconciliation. The column-stop rule has enforcement pointers in `forcedStop.ts` / `useForcedStop.ts`; board-read protection has its pointer in `useBoardLoad.ts`. No silent inbound-deferral loss or missing built-rule index was identified.

These notes have one existing home and are not additional audit findings or Close-out rows:

- **DRAG-5.3/B18:** [slice 3, Gaps](test-reconciliation-story-10-close-slice-3.md#gaps) accounts for all eight skipped variants.
- **DRAG-7.14 dwell continuity:** [slice 5, Coverage Mapping](test-reconciliation-story-10-close-slice-5.md#coverage-mapping) includes approved pure clock assertions for the unchanged start through the padding move.
- **DRAG-6.27 reload-start clearing:** [slice 4, Test Quality Concerns](test-reconciliation-story-10-close-slice-4.md#test-quality-concerns) resolves the surface timing limitation through its approved hook mapping.
- **ATT-1.15 field observations:** incomplete proof remains Open and routed to Epic 4 in [the close's list](../planning/epic-3-5-stories/story-10-close.md#the-closes-list-d10); the archived review already records the observation limits. No certification changes here.

Five remaining quality/risk notes are recorded once in [Drag Automation Deferrals](../planning/tech-debt-stories/drag-automation-deferrals.md#story-10-close--code-audit-quality-notes): intermediate geometry samples, zero-timeout absence sampling, initial-read/StrictMode supersession, repeated tuning initialization, and saved-tree reads before write confirmation. The last two are unobserved flakiness risks, not demonstrated production defects. Under MVP Deferrals they commission no new case, variant, verdict or current reviewer session.

The existing sidebar-cap PO question and separately unsettled epic-wide audit remain in the close plan. The main plan's surface-cost README handoff still labels itself unapplied; the README has the standing internal categories but lacks the requested cost-exception pointer beside its surface preference. This remains the Test Planner's existing handoff, recorded again in the close; no third internal category is presumed approved.

### 4a production/wiki supplement

Read the seven-file production diff at `421ca5a7`, its retrospective/evidence boundary, current enforcement paths and paired regressions. This was a rule-conformance check, not another four-lens audit or fresh coverage certification.

| Production files                                                                        | Rule and result                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BandGuides.tsx`                                                                        | The active mark follows the exact locked region, transfers to the Card at Descendants, and is absent at Board/end. Consistent with wiki board-drag-interaction §1.1.                                                                                                                                                                                                      |
| `BoardColumn.tsx`                                                                       | Done labels use the entry workphase's name; expanded rows use their own workphase. Wiki board-drag-interaction §5 makes terminal workphase naming unconditional, including an empty terminal region.                                                                                                                                                                      |
| `KanbanCard.tsx`                                                                        | Zoom forces opening; attachment retains it through pending/saved state and the current expansion store; pop-out/cancel without attachment restores the user's choice. Consistent with wiki board-drag-interaction §1.1, wiki board-drag-interaction §6.1 and wiki item-attachment §12.                                                                                    |
| `descendantsProjection.ts`, `DragSessionContext.ts`, `useBoardDnd.ts`, `dragChrome.tsx` | DRAG-1.5 seeds a foreign entry at the final gap, depth zero. Stationary geometry changes cannot replace it; the session publishes the held-entry flag, the line uses the projected anchor, and release reads the same projection. Pointer movement releases the hold and resumes shuffle. Consistent with wiki board-drag-interaction §7 and wiki hierarchy-placement §1. |

**DRAG-1.16:** the current locked-list relation governs the release, rather than a frozen pickup slot or a foreign cursor region. Traced `placementRegion`, `placementFor`, named-anchor selection and both release paths against wiki board-drag-interaction §1.1 and §2. The catalog's reading is consistent with those rules.

**DRAG-3.19:** wiki board-drag-interaction §5a requires reserved description space, not a nonzero empty paragraph box. Both shortCard copies use the same fixed outer height, one-line clamp and suppressed footer/ordinary child count; the space remains without description text. Current source and [slice 2's mapping](test-reconciliation-story-10-close-slice-2.md#coverage-mapping) support the retrospective's reading. No additional PO question or production defect was confirmed in this supplement. Final paint/feel remains manual or deferred.

## Validation

- Scope generation and independent assignment validation passed: 22 instances, no omitted or duplicate primary assignments.
- `tests/output/story10-close-step4/green-run-record.json` records a passing root gate (444 server, 1,110 client, 327 scripts; docs 0 hits) and two five-worker full E2E runs, each **524 passed, 23 skipped, 0 failed, 0 flaky**.
- An independent comparison against green tree `e648bec815c2a86cf626f560b51efaa1e9da7162` confirms the twelve changed TS/JS/JSON source/test files differ only in case-ID title prefixes; production code and test bodies remain unchanged. Evidence: `tests/output/story10-audit-probes/source-equivalence.json`.
- After inspecting it, the orchestrator replayed `node tests/output/story10-audit-probes/correctness-app-source.mjs`. Both hook races reproduced. Real Chromium reproduced the during-drag modal Escape failure; the pre-mounted-modal control stayed open. Output: `tests/output/story10-audit-probes/orchestrator-replay.jsonl`. These disposable composition probes use no app server, DB or tracked test changes; they are not full app E2E or fixed-before/after proof.
- Final audit-document checks are recorded in the execution ledger. The full suites were not rerun for this read-only audit. The close's recorded coverage-goal shortfall is unchanged.

## Fix Now

### 1. Escape cancels a drag and also closes a modal opened during it [Correctness & Security]

**Locations:** `client/src/components/useEscapeKey.ts:17-24`, `ModalShell.tsx:47`, `HierarchyModal.tsx:177-182`.

When the modal mounts after PointerSensor's key listener, Escape first cancels the drag. React commits the cleared session and updates the Escape callback ref during that same event. The modal listener then sees `session === null` and closes it. A hold-opened modal disappears on the cancel Escape; the pre-mounted-modal control remains open.

**Fix:** retain the stable listener and ordinary latest-handler behavior, while preserving drag/layer eligibility at the beginning of this Escape. Cancellation must not make the same event eligible to close the modal. Do not restore listener re-registration or globally force stale callbacks, which would undo the existing Sheet/modal regression fix.

**Wiki bucket:** breaks in-force **wiki board-drag-interaction §7.3 and §9**. No new product ruling is needed. The probe uses real React/dnd-kit/Chromium with the hierarchy modal's exact close guard.

### 2. A delayed move answer restores a deleted item to the UI [Correctness & Security]

**Locations:** `client/src/components/workflow/useItemManagement.ts:98-113,176-178`; `itemWriteReconciliation.ts:172-175`; `client/src/lib/positionedWrite.ts:35-36`.

Move A and hold its committed answer. Its pending card is still clickable, so the Sheet can successfully delete A. Deletion removes the row but invalidates none of its outstanding write bookkeeping. The delayed move passes the sequence check and upserts A again, although SQLite no longer contains it. Pending answers for deleted descendants have the same lifecycle hole.

**Fix:** invalidate responses and clear pending/placement bookkeeping for the removed subtree, including untracked Sheet callbacks. Retain the resync obligation for committed reindex disclosures. A deleted row's old full response must not recreate it.

**Wiki bucket:** breaks in-force **wiki item-attachment §13**, which removes the subtree from the board. This is a successful-delete lifecycle failure, not deferred UI recovery after a server error. A fix changing frozen position/workphase currency still needs Nathan's routing decision.

### 3. Reversed Sheet answers restore an older hierarchy [Correctness & Security]

**Locations:** `client/src/components/workflow/useItemManagement.ts:160-169`; `client/src/components/ItemDetailPanel.tsx:230-232`; `item-detail/AgentSection.tsx:23-35`; `item-detail/ParentSection.tsx:31-44`.

Assign an agent and hold its committed answer. The independently enabled Parent control can attach that item under a parent in Doing. After the newer answer is applied, release the earlier agent answer: its full row contains the old null parent, Todo workphase and position. Arrival-time numbering makes it authoritative, undoing the newer hierarchy in the board and Sheet while the DB remains correct.

**Fix:** carry dispatch order through Sheet callbacks, or serialize item mutations centrally, and reject superseded full-row answers in both detail and board state. Preserve reindex disclosure handling. The site's existing reason excludes intervening **board** sends while the Sheet covers it; it does not exclude concurrent Sheet sends. This is new evidence beyond that reason, not the accepted close-Sheet/next-drag window.

**Wiki bucket:** breaks in-force **wiki positioning §8**; the attached-workphase consequence is governed by **wiki item-attachment §2 and §2a**. **MVP routing:** this directly touches frozen out-of-order position/workphase reconciliation. Nathan must choose its destination before implementation; the close plan holds the question.

### 4. The workflow directory map omits its expansion store [Consistency & Drift]

**Location:** `client/src/components/workflow/AGENTS.md:211-223`.

The board-state map omits `CardExpansionContext.ts`, which owns expansion choices above Card remounts and board reloads. **Fix:** add its ownership entry. Source comments naming it do not replace the directory map.

### 5. The overlay-width test title omits the Stub exception [Consistency & Drift]

**Location:** `client/src/components/workflow/dragOverlayGeometry.test.ts:125-134`.

“Anywhere else ... with no width” is unconditional, while the adjacent Stub-drag branch supplies its containing Card's width. **Fix:** qualify the title with the absent containing-Card width, or identify the Free-Card path. Assertions need not change.

### 6. The modal spec header gives every drag a modal pickup [Consistency & Drift]

**Location:** `tests/ui/drag-7-hierarchy-modal.spec.ts:74-75`; counterexamples at `444-467,574-583`.

The suite also brings a section Stub and a Free Card into a hold-opened modal. **Fix:** qualify the click-opened pickup description and name the other arrivals.

### 7. The geometry contract forbids its own painted-feedback gestures [Consistency & Drift]

**Location:** `tests/helpers/dragGesture.ts:25-33,234-236`; callers include `boardDragSurface.ts:93-107`, `dragTargetScenario.ts:88-95`, and `tests/ui/drag-8-carried-branch.spec.ts:109-126`.

“Every measurement is in layout space” and “never for aiming a drag” contradict intentional painted-position feedback and browser hit-testing used to choose pointer points. **Fix:** distinguish collision-slot targeting from gestures deliberately using visible geometry. Both Drift returns are merged here; gestures need not change.

### 8. The null-workphase comment claims an exclusive route that is not exclusive [Consistency & Drift]

**Location:** `tests/ui/attached-children.spec.ts:214-217`; counterexample in `server/src/lib/itemHierarchy.ts:196-211,229-249`.

An explicitly null-workphase Free child and its Attached grandchild can be created normally. **Fix:** retain why this test uses real workphase deletion, but remove the claim that deletion is the only route.

### 9. The picker comment omits first-parent attachment [Consistency & Drift]

**Location:** `tests/ui/attached-children.spec.ts:526`; counterexample in `ParentSection.tsx:31-39`.

The picker sends `isAttached: true` when a top-level item gains its first parent. **Fix:** qualify the parent-only comment to this already-parented child's reparent.

### 10. A gesture helper claims a nonexistent held answer [Consistency & Drift]

**Location:** `tests/ui/drag-preview-reconciliation.spec.ts:106-115,223-229`.

`dropXAtEndOfInProgress` has no `hold` and only performs the gesture; response control belongs to callers, and one uses an ordinary successful answer. **Fix:** correct that ownership description.

### 11. The own-slot comment confuses projection depth with the Card's level [Consistency & Drift]

**Location:** `tests/ui/drag-forced-stop.spec.ts:921-926`.

`8:0:true` means gap index 8 after eight rows, at depth zero among P's children, not P's own level or the eighth gap. **Fix:** describe that local gap/depth accurately.

### 12. The held-read comment promises a snapshot for a synthesized refusal [Consistency & Drift]

**Location:** `tests/helpers/requestHarness.ts:131-145`; refusal caller in `tests/ui/board-read-order.spec.ts:187-191`.

The refusal branch skips the server read and synthesizes a 400. **Fix:** limit the snapshot guarantee to success mode and describe the matching GET, including project reads.

### 13. The overlay locator's lifetime claim omits its drop animation [Consistency & Drift]

**Location:** `tests/helpers/boardLocators.ts:52-54`; callers in `dragGesture.ts:166-174,185-193`.

The overlay can outlive the live drag during its drop animation; the driver already waits for it after release. **Fix:** include the animation in this lifetime description and preserve the distinct live-session checks.

### 14. The expansion header applies create/edit timing to drops [Consistency & Drift]

**Location:** `tests/ui/project-tree-expansion.spec.ts:12-15`; counterexamples in `useProjectDragReorder.ts:199-211` and the spec at `383-398`.

A drop opens its destination before sending, and refusal leaves it open. The header promises success-only opening and no opening on failure for every write. **Fix:** limit that claim to create/parent-edit writes and state drop behavior separately.

### 15. Workphase setup bypasses checked deletion [Consistency & Drift + Duplication & Abstraction]

**Location:** `tests/ui/attached-children.spec.ts:229`; helper in `tests/helpers/seed.ts:85-87`.

The local DELETE duplicates `deleteWorkphase` but discards its status check, so refused setup continues to a later assertion. **Fix:** call `await deleteWorkphase(request, temp.id)` and remove the unused `API` import. This is an existing-helper bypass with different failure handling, not an optional abstraction; both passes are merged here.

### 16. Two project reads bypass the checked E2E helper [Consistency & Drift]

**Location:** `tests/ui/project-tree-expansion.spec.ts:62-67,227-229`; helper in `tests/helpers/seed.ts:188-202`.

The local name lookup duplicates `fetchProjects`; the refused-create assertion repeats a raw GET without checking status. **Fix:** use `fetchProjects` at both sites and remove the unused `API` import, restoring the explicit setup/read convention and refusal guard.

## Routed to a story's plan

No required finding is marked disposed by a later-story route. Nathan deferred #1 to #3 to MVP Deferrals, which names each one (Close-out). The five non-finding quality notes have the destination recorded above.

## Watch List

These twelve structural choices are optional. They add no cases, variants or current hardening work and do not override MVP freezes.

### 17. Board/sidebar stable-generation read loops could share a core [Duplication & Abstraction]

`client/src/components/workflow/useBoardLoad.ts:50-72` and `sidebar/useProjectCollection.ts:53-89` repeat currency and retry-after-applied-write logic. Extract only that loop if it grows; retain board selection/cue lifetime and sidebar application separately. The copies agree today.

### 18. The Escape event-ordering test harness is repeated [Duplication & Abstraction]

`client/src/components/ModalShell.test.tsx:25-41` and `ItemDetailPanel.test.tsx:324-340` repeat earlier-listener installation, replacement during dispatch and cleanup. A small harness could preserve that unusual ordering when extended. They agree today; **can ride along with #1** if its regression work touches these files.

### 19. The modal release helper repeats a broader response waiter [Duplication & Abstraction]

`tests/ui/drag-7-modal-hold.spec.ts:715-718` repeats `boardDragSurface.ts:72-76`'s `releaseMove` with a broader `/move` matcher. Use the shared item-specific waiter when revising it. No competing response was established in current scenarios.

### 20. Two overflow-modal opening recipes need parallel maintenance [Duplication & Abstraction]

`tests/ui/drag-8-carried-branch.spec.ts:896-905` repeats `dragTargetScenario.ts:255-278`'s two-pass aim, clock wait and context observation. Share the generic opening recipe if it changes; keep fixtures/assertions local. The implementations agree.

### 21. Cascade tests repeat descendant aiming [Duplication & Abstraction]

`tests/ui/attached-children.spec.ts:61-66,124-129` repeat `overflowTree.ts:65-82`'s `holdAt`. Delegate aiming while retaining projection and answer-order checks if worthwhile. No current failure was established; **can ride along with #15**.

### 22. Sidebar subproject creation repeats across four specs [Duplication & Abstraction]

`project-tree-expansion.spec.ts:40-58`, `project-tree-placement.spec.ts:285-289`, `project-tree-sidebar.spec.ts:190-194,441-444` and `project-tree-state.spec.ts:434-437` repeat the same entry/dialog sequence. A page-object method could own it while cases retain their gates. Copies agree; **can ride along with #14/#16** if worthwhile.

### 23. Ordinary seed-and-open tree setup is repeated [Duplication & Abstraction]

`project-tree-state.spec.ts:21-28`'s `openTree` composes helpers also used in placement, drag, sidebar and expansion. Share the ordinary recipe if it grows; keep interception-before-navigation and pinning arrangements explicit. No divergence established; **can ride along with #14/#16** where applicable.

### 24. Screen observation has a seam from pointer driving [File Responsibility]

`tests/helpers/dragGesture.ts:77-153,215-283` owns a generic geometry/text recorder as well as gestures. Non-drag collection tests use it too. A screen-observation helper could own measurements/recording, with the one drag driver importing it. Functions are already isolated; **can ride along with #7** only if the larger extraction is worth doing.

### 25. Sheet-over-modal coordination is a separate spec seam [File Responsibility]

`tests/ui/drag-7-hierarchy-modal.spec.ts:1158-1512` has localized Sheet stacking, closing, navigation and editing helpers. Move the complete block when either feature grows, reusing the existing fixture. It is independent today; **can ride along with #6**, but a comment correction alone does not justify a split.

### 26. Move round-trip tests sit beside pure reducer tests [File Responsibility]

`client/src/components/workflow/itemWriteReconciliation.test.ts:283-389` composes requests, send-time markers and reconciliation through a tracker. Those two scenarios could move together into a round-trip suite if expanded. They are localized and do not currently make reducer changes unsafe.

### 27. Forced-stop scenes are an extraction seam from their cases [File Responsibility]

`tests/ui/drag-forced-stop.spec.ts:79-283,456-603` defines a substantial base/hidden scene API. Extract constructors into one fixture helper when reused/extended, keeping cue/outcome assertions local. Closures already isolate state; **can ride along with #11** only if the larger change is worthwhile.

### 28. Pending presentation is distinct from answer reconciliation [File Responsibility]

`tests/ui/drag-preview-reconciliation.spec.ts:300-498` has a contiguous pending-marker/tier/line cluster with its own fixture. It could become a pending-state spec. The clusters are already independent; **can ride along with #10**, without making that comment fix require a split.

## Covered by

No additional required finding is assigned an epic merely because it looks related. Existing coverage deferrals and accepted limits retain their destinations.

## Informational

Other structural candidates retain coherent boundaries. Item-state/pure-reconciliation modules already separate React lifecycle from atomic folding; small held promises do not require another fixture; layout-effect Escape refs are not interchangeable with passive-effect latest-value refs; request-holding modes have different contracts. Raw returns record the comparisons. No further split or consolidation is required.

## Close-out

Review is complete; the audit stays open until required findings have dispositions. The Architect owns fix batches in the close plan and any optional ride-alongs. Case behavior/test changes follow its QA/Test Reviewer and scoped confirming-Reconciler steps. The Auditor made no implementation, catalog, wiki, tag or sign-off change.

| Finding | Disposition / next owner                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Deferred (Nathan, 2026-11-18) — [MVP Deferrals, Findings with no story yet](../planning/mvp-deferrals.md#findings-with-no-story-yet). |
| 2       | Deferred (Nathan, 2026-11-18) — [MVP Deferrals, Findings with no story yet](../planning/mvp-deferrals.md#findings-with-no-story-yet). |
| 3       | Deferred (Nathan, 2026-11-18) — [MVP Deferrals, Findings with no story yet](../planning/mvp-deferrals.md#findings-with-no-story-yet). |
| 4       | Open — Architect/Coder: directory ownership-map entry.                                                                                |
| 5       | Open — test owner: qualify overlay-width title.                                                                                       |
| 6       | Open — QA: modal-arrival header.                                                                                                      |
| 7       | Open — QA: geometry contract; duplicate reports merged.                                                                               |
| 8       | Open — QA: exclusive null-workphase claim.                                                                                            |
| 9       | Open — QA: parent-picker comment.                                                                                                     |
| 10      | Open — QA: gesture/response ownership comment.                                                                                        |
| 11      | Open — QA: local gap/depth explanation.                                                                                               |
| 12      | Open — QA: held-read success/refusal contract.                                                                                        |
| 13      | Open — QA: overlay lifetime comment.                                                                                                  |
| 14      | Open — QA: create/edit expansion timing.                                                                                              |
| 15      | Open — QA: checked workphase deletion.                                                                                                |
| 16      | Open — QA: checked project reads.                                                                                                     |

Nathan owns the eventual `epic-3-5-story-10-audited` tag. The separate epic-wide audit's scope remains unsettled and was not included here.

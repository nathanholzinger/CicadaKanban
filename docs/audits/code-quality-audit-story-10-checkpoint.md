# Story 10 checkpoint — code quality audit

**Date:** 2026-11-10 · **Status:** review complete; ten required findings remain open. Finding #2 needs a PO ruling before implementation. Three Watch List findings are optional.

## Scope and execution

Nathan confirmed the full range `epic-3-5-story-8-13-audited..f9fd73d7` on 2026-11-10. The base tag resolves to `23ea0ffd5f3f09d73ea6a9f6dcd8c2ecf249196e`; the end is `f9fd73d738b14ea6cc960b2cf7f68d384449c7b5`. `git rev-list --count` confirms **29 commits**. The working tree was clean when the audit started.

The range includes Story 8 close-out fixes, Story 10 through batch 4b, Testing Roles Refactor, Parallel E2E Workers, and Catalog Coverage Report. This is a checkpoint audit before the catalog-report story closes, not Story 10's final audit.

The scope generator ran with its default config:

```text
npm run audit:scope -- --out docs/audits/story-10-checkpoint-scopes --base epic-3-5-story-8-13-audited --end f9fd73d7
```

It selected **113 files**, with **9,479 changed lines**, **21 removal sites**, and **572 unchanged moved lines excluded**. Its 21 nonempty scope files are retained in [story-10-checkpoint-scopes](story-10-checkpoint-scopes/). No file was left unassigned.

| Pass                      | Scope instances                          | Files | Changed lines | Removal sites |
| ------------------------- | ---------------------------------------- | ----: | ------------: | ------------: |
| Correctness & Security    | C1, C1t, C2, S1, E2E, T                  |    97 |         9,396 |            21 |
| Consistency & Drift       | C1, C1t, C2, S1, S1t, E2E, T             |   113 |         9,479 |            21 |
| Duplication & Abstraction | client-src, client-tests, server, E2E, T |    97 |         9,396 |            21 |
| File Responsibility       | client, E2E, T                           |    69 |         9,210 |             9 |

The File Responsibility scopes enumerate all 69 files marked read whole: [28 client](story-10-checkpoint-scopes/scope-fileresp-client.md), [25 E2E](story-10-checkpoint-scopes/scope-fileresp-E2E.md), and [16 tooling](story-10-checkpoint-scopes/scope-fileresp-T.md). Other files were reviewed at their listed changes/removal sites with the surrounding context they need. No manual read-whole overrides were added.

All 21 scope instances completed. Three reviewers initially ran correctness in parallel over client, E2E and tooling. Reviewers then completed the remaining lenses by area, with separate results per lens/instance; two further reviewers handled app drift and app/server structural scopes. Cold passes received their scope and role instructions, without plans, prior audits, reconciliation reports or wiki passages. Two interrupted reviewers resumed their existing scopes after a usage-limit interruption. No scope was dropped.

The orchestrator re-traced every required correctness finding, checked the three Watch List comparisons, and independently reproduced #1–#5. No split was warranted by File Responsibility; no structural issue met the Fix Now bar.

### Plan and reconciliation checks

Only the orchestrator read the relevant plans after the cold reviews: Story 8.13's archived plan and its audit-fix amendments; the archived Story 8 close-out plan, especially D7–D13, Open questions and Handoff; the archived Testing Roles Refactor plan; the Parallel E2E Workers plan, which is actually stored at `docs/audits/e2e-parallel-workers.md`; Catalog Coverage Report; and Story 10's main/batch plans. The three tech-debt stories' commitments and handoffs were checked without treating their prose as a separate code-audit scope.

The close-out's five built passages still have index pointers in their enforcing modules: positioning §8 (`positionedWrite.ts`), board-drag-interaction §10 (`useItemManagement.ts`), board-drag-interaction §3.1 (`popSession.ts`), project-tree §4 (`useProjectCollection.ts`) and boards-columns-unsorted §3 (`useBoardLoad.ts`). Story 10's column-stop banner and cascade work have their board-drag-interaction §10 and item-attachment §2 pointers. The section extraction and request-harness handoffs landed. No new missing handoff or wiki-index finding emerged.

The latest 4b confirming reconciliation and the baseline's relevant rows were read; no reconciliation was repeated. Pass notes were handled as follows:

- **TREE-1.8/1.9's similar hook assertions:** already settled in the Story 8 close-out plan's Open questions. The shared return gesture has distinct no-write/saved-data and ghost/line obligations. No new consolidation or coverage verdict is made.
- **TREE-1.14's cyclic-release suite title:** merged by reference into the baseline's TREE-1.14/E136 residual (reachable placement and real request/400), already assigned to 4g. No separate audit finding or close-out row.
- **DRAG-6.5's inferred response ordering:** the baseline's E489 row certifies the scenario but does not address this specific observation question. Routed as a non-finding to the QA Engineer/Test Reviewer in [Story 10's Open questions](../planning/epic-3-5-stories/story-10-batches.md#open-questions), before 4d's freeze. The Auditor assigns no coverage status.

Accepted limits remain accepted. Story 8.13 Amendment 8 accepts a child created during the Sheet's one local refresh, and the close-out's D7 accepts numbering Sheet answers at arrival. This audit requests no fix for either. Finding #4 concerns two parent refreshes arriving in reverse, not that accepted child-create window. Finding #2 concerns a read arriving **after** a write answer; the accepted older-read discussion covers a read arriving **before** the answer, after which the answer restores the write. The new ordering has no such restoration.

The runner's accepted DRAG-7.10 failure and temporary DRAG-3.16 skips retain their 4c/4h destinations. The conditional DRAG-3.12 question and deferred highlight-cue work are not reopened. Finding #3 adds overlapping responses to the already-built cascade; it is not a repeat of the original D11 missing-cascade defect.

## Validation

`npm run check` passed at the audit end tree: type-check, lint (including the docs checker: 450 files, zero hits), format check, 444 server tests, 1,040 client tests, and 324 script tests. PowerShell requires `npm.cmd` in this environment; the npm script itself is unchanged.

No app, test, helper or checker code is changed by this audit. No E2E run has been started by the Auditor.

Four throwaway Vitest probes reproduced the app failures against unchanged code:

| Probe                                                                                      | Observed failure                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Load A, select B, reject B's read                                                          | Loading ended with `board.id === 'A'`.                                               |
| Start a B read, apply X's move to Doing, then answer the read with its older Todo snapshot | X changed back from Doing to Todo.                                                   |
| Answer P's move to Doing before an older attached C reorder response                       | P/C/G changed from Doing/Doing/Doing to Doing/Todo/Todo.                             |
| Reparent X up and then back to the cap; answer the second depth read before the first      | The cap-disabled Add child button became enabled and the depth pill returned to TOP. |

The first Sheet-probe attempt used the wrong depth-label text and was corrected to the actual TOP label before observing its final disabled-control assertion fail. These are diagnostic failures, separate from the passing root gate. Both temporary probe files were removed. An in-memory Markdown/catalog probe independently reproduced #5. No fix was made, so no post-fix pass is claimed.

## Fix Now

### 1. A failed board switch displays the previous board under the new selection [Correctness & Security]

**Locations:** `client/src/components/workflow/useBoardLoad.ts:44–71`; `client/src/components/BoardView.tsx:249–280`.

Load A, select B, and let B's GET fail. The loader ends loading but retains A's board object. BoardView renders A's columns beneath B's selected tab; column management now receives B's ID alongside A's columns. The failure is reproduced by the first probe.

**Fix:** invalidate a board belonging to another selection, or gate rendering on the loaded board matching the selected ID. Preserve the intentional same-board reload behavior and stale-load/cue guards.

**Wiki bucket:** breaks the in-force selected-board rule, **wiki boards-columns-unsorted §3**. This does not require a new product ruling.

### 2. A board read can replace an already-applied item write [Correctness & Security]

**Locations:** `client/src/components/workflow/useBoardLoad.ts:45–65`; `client/src/components/workflow/useItemManagement.ts:72–73`.

While X's move is outstanding, selecting another board of the same workflow starts a GET. Its snapshot predates the move. X's successful response applies first, then the GET passes the load/selection guard and replaces items wholesale with its older snapshot. The second probe changes X from Doing back to Todo; no later response remains to restore it.

**Proposed fix, subject to the ruling:** share item-write currency with board loading and discard/refetch a snapshot overtaken by an applied write. Keep selection/load ordering and pending-placement reconciliation intact; the sidebar's guarded reader is an existing pattern, not a second position algorithm to copy.

**Wiki bucket: PO ruling required before implementation.** **Wiki boards-columns-unsorted §3** states selected-board/cross-board answer currency; **wiki board-drag-interaction §10** states reload/response behavior. Neither explicitly states the board equivalent of **wiki project-tree §4**'s read-versus-applied-write guarantee. The precise question and probe are recorded for the PO in [Catalog Coverage Report's Open questions](../planning/tech-debt-stories/catalog-coverage-report.md#open-questions). The confirmed current behavior is reported without silently adding that rule.

### 3. An older child response undoes a newer parent workphase cascade [Correctness & Security]

**Locations:** `client/src/components/workflow/itemWriteReconciliation.ts:80–89,123`; `client/src/components/workflow/useItemManagement.ts:105–106`.

P, attached C and attached G start in W1. C's sibling reorder commits, with its W1 response delayed. P then moves to W2, and its answer cascades W2 to C/G locally, as the server did. C's older response then upserts W1 and cascades it to G. The server retains W2; the UI holds P=W2, C/G=W1. Cross-item protection covers positions only, and the per-item tracker sees no newer direct write of C. The third probe reproduces the mismatch. A stale unknown workphase can also restore the attention badge.

**Fix:** include cascade-affected rows/fields in response currency, or resync overlapping hierarchy writes whose captured state cannot safely be applied. Preserve positional disclosures and the server's stop-at-detached-child rule.

**Wiki bucket:** breaks the in-force inherited-workphase/cascade rule, **wiki item-attachment §2**, with the invalid-item consequence in **wiki boards-columns-unsorted §10**. Existing **wiki positioning §8** protection must remain intact.

### 4. An older parent refresh restores the wrong depth and enables Add child at the cap [Correctness & Security]

**Location:** `client/src/components/ItemDetailPanel.tsx:236–244`.

Reparent X to a shallower place, delaying its refresh GET. The parent picker is reenabled after the PUT, so reparent X back to the cap. The second GET disables Add child correctly; the first then overwrites depth with the shallower value and reenables it. The fourth probe reproduces this through the real parent picker and child control. The server still refuses an illegal create; the defect is the displayed depth/control.

**Fix:** invalidate prior refreshes when a newer reparent begins and apply only the refresh belonging to the current parent state. Limit this finding to depth currency; the separately accepted child-create/read window is not reopened.

**Wiki bucket:** breaks the in-force current-depth control rule, **wiki item-attachment §14**, using **wiki hierarchy-placement §6**'s cap formula. The Sheet's general layout/read mechanism remains a placeholder; that does not waive the control rule.

### 5. A fence-like content line ends a Markdown block early [Correctness & Security]

**Location:** `scripts/check-docs/extract.mts:113–115`.

The same prefix regex recognizes opening and closing fences. Inside a backtick fence, a line consisting of three backticks followed by `this is content` closes it even though the trailing text makes it content. Given opening fence, that content line, `## X-1.1 example`, real closing fence, and `after`, `unfencedLines` returns only the example heading. `readSuite` invents case X-1.1 and drops the real prose after the closing fence. The in-memory probe reproduced both effects.

**Fix:** recognize a closing fence only when the matching fence run is followed by permitted whitespace and the end of the line; retain info-string support for opening fences. Check both extraction and catalog consumers.

**Contract:** repository-tooling correctness, not an app-wiki behavior. It breaks the extractor's outside-fenced-block contract and Catalog Coverage Report decision 2. No PO product ruling is needed to repair the parser.

### 6. Database cleanup loses the actual filesystem failure [Correctness & Security]

**Location:** `tests/helpers/removeDatabasesReporter.ts:22–27`.

Every `rmSync` exception is discarded. If all retries fail, for example with persistent EACCES or EBUSY, the final warning names only the path. The user cannot distinguish a permissions problem from a lingering handle or another filesystem failure.

**Fix:** retain the final error and include its message/stack in the warning, preserving retries and the reporter's cleanup lifecycle.

**Contract:** tooling failure diagnostics; no app-wiki behavior is involved. The correctness pass requires the actual failure cause to reach a useful log. This does not request a new gate failure policy.

### 7. The final-crossing spec bypasses the shared gesture mechanism [Consistency & Drift]

**Location:** `tests/ui/project-tree-drag.spec.ts:89`.

The TREE-1.1 test calls `page.mouse.move` directly to preserve one final pointer sample. Its one-sample requirement is legitimate, but root guidance requires drag mechanics to live in `dragGesture.ts`.

**Fix:** add a one-sample movement operation or an explicit step option to the shared helper and call it here. Keep the immediate release and exact event sequence; replacing it with the current multi-sample `hoverTo` changes the scenario.

### 8. The item-row locator comment omits static Stub rows [Consistency & Drift]

**Location:** `tests/helpers/boardLocators.ts:33–35`; counterexample: `client/src/components/StubRows.tsx:176–184`.

The comment says every Card/Stub row except the overlay has `data-item-id`. A Card's static Stub rows intentionally omit that attribute while the hierarchy modal owns the live registrations.

**Fix:** describe live/sortable item rows and exclude both overlay copies and static section rows. No selector or app behavior change is requested.

### 9. The Stub pickup comment claims a stored-workphase invariant that does not hold [Consistency & Drift]

**Location:** `client/src/components/workflow/useBoardDnd.ts:684–689`.

The claim that an attached item's stored workphase always equals its nearest Free ancestor's excludes the explicitly supported divergent stored state. The server preserves it on non-hierarchy edits, and reconciliation preserves it when a parent's workphase does not change.

**Fix:** state the drag policy: snapshot the containing Card's rendered workphase because the Stub's stored workphase can lag or diverge. Keep the behavior. This comment correction is distinct from #3's overlapping-response defect.

### 10. Root guidance says Sheet writes are numbered at send [Consistency & Drift]

**Location:** `AGENTS.md:109–112`; counterexample: `client/src/components/workflow/useItemManagement.ts:152–159`.

The root's universal send-numbering claim omits Sheet writes, which are numbered when their answers land. The workflow directory guidance already documents that exception, and the close-out's D7 explicitly accepts it.

**Fix, for the Architect:** qualify the root claim to distinguish board drags/inline creates and sidebar sends from Sheet answers. Preserve the accepted behavior; this audit does not ask to thread send numbers through Sheet components.

## Routed to a story's plan

No required code finding is treated as disposed by a future story. #2's PO question is recorded in the catalog-report plan; #1–#10 remain open below. The DRAG-6.5 Test Reviewer question is a separate non-finding handoff recorded above.

## Watch List

### 11. A Playwright worker override can exceed the provisioned slot pool [Correctness & Security]

**Location:** `playwright.config.ts:7–8,15,41`.

With default `E2E_WORKERS`, five stacks start. Playwright's `--workers=6` overrides the configured test-worker count, so a sixth worker routes to unprovisioned ports 3015/5185. This is a risk outside the documented environment-variable path; the supported five-worker and serial commands agree with their pools.

**Optional fix:** derive or validate the effective worker count once, or reject conflicting CLI overrides. A lower override also starts unused stacks. No runtime trial was repeated for this finding.

### 12. The band fixture repeats common board/range setup [Duplication & Abstraction]

**Locations:** `tests/helpers/boardDragScenario.ts:45–49,69–81`; `tests/helpers/boardDragSurface.ts:18–22,45–56`.

The base workflow/default-board setup and delete-end-column/update-start-column sequence have two owners. The copies currently agree and no defect was demonstrated.

**Optional fix:** let the scenario-specific helper delegate common setup/range merging while retaining its A/B/X/C/Y seeding. Preserve the empty-Review fixture: the comment in `drag-column-bands.spec.ts:143–146` correctly rejects a helper that additionally seeds Y.

### 13. Two sidebar hook-test harnesses repeat the event contract [Duplication & Abstraction]

**Locations:** `client/src/components/sidebar/useProjectDragReorder.test.ts:23–83,1119–1167`.

`sidebarDrag` and `liveDrag` repeat hook mounting, pending-parent projection, pickup/release events, depth-offset conversion and gap observation. One supports collapsed fixtures and the other live responses; their shared mechanics currently agree.

**Optional fix:** extend one local harness with collapse options and `respond`, retaining thin wrappers where useful. There is no current Fix Now change in this file to ride along with.

## Covered by

No new finding receives a Covered-by disposition. Existing accepted routes and reconciliation entries are recorded in the opening rather than counted again.

## Informational

File Responsibility found no split warranted by the marked files. Catalog tooling separates arguments, disk reading, parsing, carriers, checks and rendering. Large drag hooks/specs still own their gesture integration or named contract; file length alone did not justify a finding. No required structural consolidation emerged.

## Close-out

| Finding | Current disposition        | Next action                                                                              |
| ------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| 1       | Open                       | Correct the failed-selection display.                                                    |
| 2       | Open; PO question recorded | PO rules in Catalog Coverage Report's Open questions before implementation or rejection. |
| 3       | Open                       | Correct overlapping cascade response currency.                                           |
| 4       | Open                       | Guard depth refreshes across parent changes.                                             |
| 5       | Open                       | Correct shared Markdown closing-fence recognition.                                       |
| 6       | Open                       | Preserve cleanup failure diagnostics.                                                    |
| 7       | Open                       | Keep the single pointer sample in a shared gesture helper.                               |
| 8       | Open                       | Correct the item-row locator comment.                                                    |
| 9       | Open                       | Correct the Stub workphase comment.                                                      |
| 10      | Open                       | Architect qualifies root send-numbering guidance.                                        |

This is the completed audit review, not closure of its findings or of Catalog Coverage Report. No source fix, commit, staging operation or tag was made. Nathan owns tagging the recorded end `f9fd73d7` as `story-10-checkpoint-audited` when appropriate; that tag is not present yet. Keep this report and its scope folder in `docs/audits/` until required dispositions are verified.

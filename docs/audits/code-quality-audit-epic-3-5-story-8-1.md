# Code Quality Audit — Epic 3.5 Story 8.1, Codex trial

**Range:** `3ede430f85612b9b87b183c2ab9a5003511bd059..c6d99c61ae57c90b7f88c0a498de3a5488b21cfb` — **19 commits**. Base tag: `epic-3-5-story-7-rerun-audited`; end: `c6d99c6`, the committed Phase 6 own-slot change. The base itself is excluded.

**Result:** 10 Fix Now findings (four correctness, six drift), three Watch List findings, one existing Story 10 route confirmed, and one Informational finding. No structural finding meets the Fix Now threshold. The review is complete; the audit remains open for required dispositions. No implementation fixes, commits, tags or instruction changes were made.

## Scope and execution

The working tree was clean when the end revision was frozen, and HEAD remained at that revision throughout the review. The range contains the previous audit's remaining fix batches and tests, the fold of the Card layer into Descendants, cleanup and comment updates, the instruction-file rename and tooling support, and reconciliation follow-up work. Findings can concern older code read in a marked whole file; this report does not claim that every finding was introduced in these 19 commits.

The existing `audit:scope` script selected **80 files**, **2,003 changed lines**, and **59 removal sites** for Drift, the superset of the other scopes. It excluded **32 moved lines** under the existing policy. **32 files** were marked read whole. The custom split keeps related client source together for duplication review and combines the small support areas. No file a pass should read was left unassigned; scope generation exited 0.

Rebuild the scopes with:

```text
npm.cmd run audit:scope -- --out docs/audits/epic-3-5-story-8-1-scopes --base 3ede430f85612b9b87b183c2ab9a5003511bd059 --end c6d99c61ae57c90b7f88c0a498de3a5488b21cfb --config docs/audits/epic-3-5-story-8-1-scopes/config.json
```

The split and per-instance inputs are retained in [the scope folder](epic-3-5-story-8-1-scopes/), with its [config](epic-3-5-story-8-1-scopes/config.json) and [script summary](epic-3-5-story-8-1-scopes/summary.txt).

| Pass / instance | Files | Changed lines | Removal sites | Completion |
|---|---:|---:|---:|---|
| Correctness / client | 15 | 488 | 19 | Complete |
| Correctness / client-tests | 18 | 693 | 23 | Complete |
| Correctness / support | 6 | 138 | 0 | Complete |
| Correctness / E2E | 12 | 326 | 15 | Complete |
| Correctness / tooling | 17 | 254 | 1 | Complete |
| Drift / client | 26 | 620 | 20 | Complete |
| Drift / tests | 32 | 1,022 | 38 | Complete |
| Drift / support | 22 | 361 | 1 | Complete |
| Duplication / client-src | 17 | 511 | 19 | Complete |
| Duplication / client-tests | 20 | 710 | 23 | Complete |
| Duplication / E2E | 12 | 326 | 15 | Complete |
| Duplication / support | 19 | 352 | 1 | Complete |
| File Responsibility / all | 32 | 1,577 | 38 | Complete |

These are pass counts, not additive counts of distinct files. Every instance confirmed its listed lines/removal sites and whole-file reads were complete.

All 13 workers ran **cold**, with `fork_turns: none`. Each explicitly read the existing Auditor persona, its agent definition, the relevant guide sections, applicable `AGENTS.md` files and its scope file. Claude's model/tool frontmatter was not treated as executable Codex configuration. The workers used the current Codex session model and read/search tools; they made no edits and ran no tests. They received no plans, wiki pages, previous audit, reconciliation report, ledger or other worker's findings. Three workers ran at a time. Three stopped at a usage limit in the second wave and resumed their own original contexts after Nathan requested continuation; no completed instance was repeated.

The orchestrator merged the lists, checked tiers and existing destinations, and independently re-traced **all four Fix Now correctness findings** and the six drift findings. Only during reconciliation did it read the current Story 8.1 plan, relevant MVP/epic roadmap entries, and applicable wiki passages. No earlier audit or reconciliation report was used to validate a finding. No additional closed story without an audit of its own was identified in this range, so no archived plan was needed.

The orchestrator previously implemented the instruction-file rename/tooling support in this conversation. Those files were reviewed by cold workers without that conversation history; the orchestrator still reconciled the report. This is a limitation of model separation for that small portion of the range, rather than a claim that every line had a different-model author and reviewer.

## Verification

| Check | Result |
|---|---|
| `npm.cmd run check` | Passed: type checks, lint, formatting, 430 server tests, 586 client tests, 218 script tests |
| Docs checker, within the gate | 386 files, 0 hits |
| `npm.cmd run test:e2e -- --reporter=line` | Suite reported 222 passed, 15 skipped, 0 failed |
| Focused audit probes | Five contract assertions exposed the four correctness findings below on unchanged production code |

The first E2E attempt failed before tests because the sandbox's Windows user-information call returned `uv_os_get_passwd` ENOMEM during tsx startup. The approved run outside the sandbox completed the suite in about four minutes. Its PowerShell command wrapper returned exit 1 despite the successful suite summary; the reported result above is the Playwright summary, not a claim of a clean wrapper exit. No skipped test was unskipped for this audit.

The probes exercised the actual hook pickup, projection/release functions, Express workflow route with the isolated Vitest database, and a temporary git repository scanned by the actual scope script. They were deleted after verification. No fix was applied, so none is claimed to have passed after a fix. The projection probe establishes the comparator/release-state discrepancy; the full modal-opening browser gesture was traced in code, not executed as a browser probe.

## Fix Now

### 1. Pending ancestor attachment starts a descendant drag in a context that no longer exists [Correctness & Security]

**Locations:** `client/src/components/workflow/useBoardDnd.ts:122–123`, `:606–607`, `:548–558`; rendered ancestry selectors in `client/src/components/workflow/itemListOps.ts:98–112,223–230`.

**Failure:** Free Card A has attached child X. Attach A under Free Card B and pick up X before A's request returns. The pending placement renders A as a Stub under B, with X nested beneath it. X's containing Card is therefore B. Pickup adjusts X's own rendered parent, but `containingCardIdOf` walks the remaining raw items and tests their raw Stub status. It finds A as Free and starts `descendants:A`.

A now renders as a Stub, so there is no A Card registering that region. The drag has no region for its supposed context: an immediate release cannot resolve its within-action, and popping out can skip the rendered containing layer. This is about another item's pending ancestor placement, not merely re-dragging the item whose own write is pending.

**Evidence:** a temporary `renderHook`/`handleDragStart` probe established the placement-aware selector tree B → A → X. It expected `session.containingCardId === 'B'` and received `'A'`. Region selection and release consequences were independently traced through sampling and `placementFor`.

**Fix:** use placement-aware parent and Stub status for every ancestor while finding the containing Card, retaining the existing shared cycle-safe hierarchy traversal. Use the same rendered ancestry for the pickup snapshot.

**Wiki bucket:** breaks a rule in force — wiki board-drag-interaction §1 (a Stub starts in its containing Card's layer), with §10's pending preview. No Planned passage or open product question exempts this state.

### 2. Modal opening can change own-slot release behavior without updating the session [Correctness & Security]

**Locations:** `client/src/components/workflow/descendantsProjection.ts:104–105,136,262–265`; `client/src/components/workflow/useBoardDnd.ts:385–388,672–681,709–712`.

**Failure:** with one section level shown, Card R contains A, whose attached children are X then Y. Pick up X in the full modal, pop out to the column, and return to R's truncated section. X's pickup slot is hidden, so the visit starts with `slotHidden` and `atOwnSlot: false`. Move the ghost to gap 1/depth 1, just before A's overflow row, and hold to reopen the modal where it fits under the cursor without changing those coordinates.

The full modal now draws the pickup slot. Phase 6 correctly computes `atOwnSlot: true`, but `sameProjection` compares only gap, depth and validity. When the pop object is unchanged too, `evaluatePop` suppresses `updateSession`: the ref has the refreshed projection while the session still has `atOwnSlot: false`. Release reads that stale session and sends a before-Y sibling move instead of taking the own-slot no-write path. The nontrivial anchor is not filtered out as an identity by `toRequest`.

**Evidence:** a temporary pure-module sequence produced the two projections with equal gap/depth/validity, verified that their release results differ (placement versus null), and failed because `sameProjection` returned true. The orchestrator independently traced the modal callback, unchanged-pop branch, session update guard and release reader. This extends the Phase 6 pure projection evidence; it does not reopen the already-answered question about retaining `slotHidden` for preview.

**Fix:** include release-relevant fields, particularly `atOwnSlot`, in session-update equality, or explicitly refresh the authoritative session projection when those fields change. Visual-coordinate equality must not suppress a changed release decision.

**Wiki bucket:** breaks rules in force — wiki board-drag-interaction §7.1 and §7.3, and shared wiki hierarchy-placement §5. A set-down in the original gap/depth in the full modal writes nothing. No new PO ruling is needed for that rule.

### 3. Malformed workflow owner references reach SQLite or are accepted as scalar IDs [Correctness & Security]

**Locations:** `server/src/routes/workflows.ts:120–130`; `server/src/lib/getOrNotFound.ts:32–34`.

**Failure:** `projectId` receives only a truthiness check before database binding. `POST /api/workflows` with `{"name":"W","projectId":true}` passes that check, throws from SQLite's binder and returns 500. With an existing project P, `projectId: [P.id]` passes the owner checks and returns 201: the array argument is flattened into the scalar SQLite binding. The shape validation added for template/source references does not protect the required owner reference.

**Evidence:** separate temporary Supertest probes against the actual route returned 500 for the boolean and 201 for the array; each expected 400. The boolean run logged the bind TypeError from `existsById`.

**Fix:** require a scalar string `projectId` before any owner lookup, preserving the existing required-value, existence and ownership checks. Add the malformed boolean/array cases to the route's validation coverage when implementing the fix.

**Wiki bucket:** breaks a rule in force — wiki row-references §1 applies to required and optional row references, alongside wiki project-tree §10's workflow ownership. Epic 3.8 plans schema-based validation, but the roadmap does not name this particular gap as deferred; Epic 3.5 explicitly keeps hand-written validation in the meantime.

### 4. Multiline template value edits can disappear from every generated audit scope [Correctness & Security]

**Locations:** `scripts/audit-scope/diff.mts:110–111,137–140,160–166`; `scripts/audit-scope/scan.mts:144–157`; `scripts/audit-scope/classify.mts:32`.

**Failure:** an existing TypeScript module contains:

```ts
export const text = `
a b
`;
```

Change only its middle line to `a  b`. The runtime string changes. Blame's `-w` contributes no changed line, and the zero-context diff hunk contains only the middle line. `writtenAlike` tokenizes that fragment without the opening backtick, reads identifiers `a` and `b` on both sides, and discards the removal site as formatting. With neither changed lines nor a removal site, the file is omitted from every pass.

**Evidence:** a temporary integration probe committed those two versions in an isolated git repository and called the real `scanRange`. It returned `files: []`, failing the assertion that the runtime-value change must be included. The orchestrator re-traced the complete blame → hunk comparison → classification path.

**Fix:** derive literal context from complete old/new source, preserving template text verbatim when comparing affected lines. If an isolated hunk cannot safely be proven formatting-only, keep a review site. Include a multiline-template regression, beyond the existing single-line literal cases.

**Classification:** internal tooling defect against the in-force scope contract in `.claude/guides/audit-workflow.md`, Scope: actual code changes must be reviewed; formatting alone is excluded. There is no applicable product-wiki rule or product behavior decision here. Fixing the scanner implements that existing process contract rather than changing the audit's intended scope.

### 5. Region documentation incorrectly says every release over unregistered space writes nothing [Consistency & Drift]

**Location:** `client/src/components/workflow/dragStructure.ts:11–16`.

The header unconditionally groups Unsorted, headers, gaps and other unregistered areas as places where a release writes nothing. During the pop-out delay, the drag remains locked and commits that context's within-action regardless of the cursor's location. `popSession.ts:193–225`, `placement.ts:23–26` and `useBoardDnd.ts:759–798` implement that behavior.

**Fix:** qualify no-target/no-write as Board-layer behavior and preserve the locked-context exception explicitly.

### 6. Overlay-clamp comment names a containment branch that does not exist [Consistency & Drift]

**Location:** `client/src/components/workflow/dragOverlayGeometry.ts:118–121`.

The comment contrasts the clamp with `containmentRect`'s supposed `=== 'column'` test. `popSession.ts:325–326` instead reads `region.boundsRect ?? region.rect`, supporting both merged-column and modal bounds.

**Fix:** describe supplied containment bounds versus the region rectangle used for overlay clamping, keeping the separate axis-lock rationale.

### 7. Shared drag-helper documentation describes foreign hover and release as if the origin were already unlocked [Consistency & Drift]

**Locations:** `tests/helpers/dragGesture.ts:19–36`.

The header says hovering another column previews there and release resolves that column's band unless its pop threshold elapsed. While the drag remains locked, both placement and release belong to the origin. With `NO_POP`, moving from A over B does not make B's bands authoritative. `placement.ts:23–26,160–177` selects the context first and applies bands at Board layer; the helper's own `POP_OUT_ONLY` explanation already states this correctly.

**Fix:** distinguish locked-origin placement, Board-layer band placement after pop-out, and a newly locked target after pop-in. Explain remeasurement without promising a foreign preview before those transitions.

### 8. Shared drag-helper documentation falsely attributes HTML5-only behavior to Playwright's drag APIs [Consistency & Drift]

**Locations:** `tests/helpers/dragGesture.ts:16–17`.

The header says `dragTo`/`dragAndDrop` simulate native HTML5 DnD and never trigger dnd-kit. The installed Playwright implementation performs mouse movement/down/up (`node_modules/playwright-core/lib/coreBundle.js:23190–23210`), and Locator `dragTo` delegates to that path (`:56870–56874`). The stated explanation for using the shared helper is false.

**Fix:** describe this helper's actual needs: activation movement, intermediate samples, clock control and target remeasurement. Do not claim that Playwright's APIs use an entirely different event mechanism.

### 9. Projection test title says no row follows the overflow row while its fixture retains B [Consistency & Drift]

**Locations:** `client/src/components/workflow/descendantsProjection.test.ts:280–282`; retained B at `:200,206`.

The test says “with no row below it,” but `withoutT` removes only T. B remains after R's subtree at the top level. The assertions exercise a gap with a top-level row below it, not an end-of-hierarchy gap. This is an objectively wrong description of the fixture, rather than an assessment of whether the test proves its catalog case.

**Fix:** title it for the actual arrangement, with B below the overflow row and allowable depths from the top level through R's last child. If a true end-of-hierarchy case is wanted, the Test Reconciler/Planner can decide that separately.

### 10. Workflow creation's client return type promises an `items` array the endpoint omits [Consistency & Drift]

**Locations:** `client/src/api/workflows.ts:19`; `client/src/types.ts:71–74`; `server/src/routes/workflows.ts:204`.

`createWorkflow` returns `Promise<WorkflowWithDetails>`, which requires `items: Item[]`. POST returns only the workflow and workphases. GET supplies the array at `workflows.ts:109`. The current App caller reads only workflow fields, so no present UI failure is claimed, but the declaration does not match the response it describes.

**Fix:** declare the creation response's actual shape, such as `Workflow & { workphases: Workphase[] }`, retaining `WorkflowWithDetails` for GET. This needs no new schema framework.

## Routed to a story's plan

No new implementation finding was routed away from Fix Now. The two test-quality questions under Routing notes were placed in the current plan for the Test Reconciler; they are not code-audit findings.

## Watch List

### 11. Three component suites repeat the DragSession fixture builder [Duplication & Abstraction]

**Locations:** `client/src/components/KanbanCard.test.tsx:19–28`; `client/src/components/HierarchyModal.test.tsx:33–42`; `client/src/components/BandGuides.test.tsx:18–28`.

Each builder assembles active item, classification, pop state, origin and the same remaining session defaults. Session-shape changes require keeping all three builders aligned. The copies currently agree and serve separate scenarios, so this is an optional fixture-maintenance improvement.

**Possible fix:** a shared test factory with explicit active items/context/cap and overrides, while each suite retains its scenario wrapper.

### 12. Ordered-workphase retrieval is repeated beside a DB-only shared helper [Duplication & Abstraction]

**Locations:** `server/src/routes/workflows.ts:62–67,188–193`; `server/src/lib/workphaseOrder.ts:30–37`; `server/src/routes/workphases.ts:28–33`; `server/src/lib/columnRanges.ts:161–167,219–226`.

These select a workflow's workphases in position order. A later ordering change would need to keep them aligned. The existing helper also builds ranks and accepts only the global DB; transaction callers cannot simply call it today. The copies agree, so there is no required abstraction on current evidence.

**Possible fix:** make ordered retrieval executor-aware and reuse it from DB/transaction callers, leaving rank/simulation needs with the callers where appropriate. Can ride along with #3 if its planner judges the extra work worthwhile; it remains optional.

### 13. Region-sampling cache ownership is a useful optional seam in the drag coordinator [File Responsibility]

**Locations:** `client/src/components/workflow/useBoardDnd.ts:167–178,248–286,321`.

The hook owns DOM structure/seen-element caches, invalidation, measurement and parent lookup alongside gesture timing, projection, collision adapters and writes. The cache has a coherent boundary, but refresh operations are already centralized and no failure caused by this structure was demonstrated.

**Possible fix:** extract a region-sampling helper/hook that owns the coupled caches and exposes resolve/sample/parent lookup; keep gesture decisions and transition order in the coordinator. Can ride along with #1 or #2 only if the fix planner chooses; neither correctness finding requires this split.

## Covered by

### 14. Column-band helper duplication and the reconciliation-spec split already belong to Story 10 [Duplication & Abstraction + File Responsibility]

**Locations:** `tests/ui/drag-column-bands.spec.ts:63–64,439,472,480,503,527,537,617` (timeouts/waits), `:745–849` (response reconciliation); shared timing helpers at `tests/helpers/dragGesture.ts:288–300,328–334`.

The spec retains local clock slack/pop waits beside shared helpers and also hosts independently changing pending-marker, out-of-order-response and refused-write tests. Current tests pass; neither pass established structural Fix Now evidence.

**Existing disposition:** **Covered by Story 10**, `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, Story 10 item 7. Its destination explicitly names replacing `popThrough`/inline helpers and separating the DRAG-6 reconciliation group. The current code and destination were checked during reconciliation. This confirms an existing deferral, rather than creating a second request.

**Planned fix:** use the shared timing/wait helpers and extract the reconciliation describe with its required scenario helpers when Story 10 reworks these specs. The optional structural work retains its optional rationale; the existing route is recorded below.

## Informational

### 15. Two short browser-storage override setups do not yet justify another fixture abstraction [Duplication & Abstraction]

**Locations:** `client/src/components/workflow/useBoardManagement.test.ts:16–26,49–54`; `client/src/lib/browserStorage.test.ts:5–9,21–27`.

Both save/restore a property descriptor and install a throwing storage getter. The short copies agree, and lifecycle-helper indirection is not currently worth introducing. If more suites need it, a reversible property override in `client/src/test/storageFixtures.ts` is a natural home. No change is requested.

## Reconciliation of plans and routing notes

- **Inbound deferrals:** Story 8.1's removal of the Card pass-through and its folded-in Free Card cursor-projection defect are implemented. The current source contains none of the deleted Card-region/helper symbols; the old tuning key remains only in its intentional storage-compatibility test. No audit inbound was silently dropped.
- **Built passages:** the handoff records superseded wiki passages and the PO's application. It has no “Planned passages now built” index list, so no missing-pointer finding was inferred from its broader sweep list. Its Code map has no “Makes dead” list. The scoped implementation pointers were read without imposing additional comment conventions on truthful comments.
- **Phase 6:** #2 supplies integration evidence beyond its pure-module fix. Retaining `slotHidden` for a stable preview is respected. The wiki already answers the own-slot release rule, so this report does not ask the PO the old question again.
- **Recorded separation rulings:** the workers found no new evidence against the existing board/sidebar seed separation, API-shape adapters, traveling-row handling or one draggable Card root. The modal's DOM/component versus numeric-placement boundary remains coherent. No split is required merely because these modules are long.
- **Existing skipped cases:** the E2E correctness and test-drift workers noted the skipped drag specs. Story 8.1's handoff and Story 10 items 9/10 already name their revised cases and disposition. These remain existing work; no additional coverage request or duplicate finding was filed.
- **New Test Reconciler notes, routed:** Story 8.1 **Open questions → “For the Test Reconciler — two workflow-test claims from the full Codex audit”** now names `server/tests/routes/workflows.test.ts:49–73` (ordered-workphases claim with one workphase/count-only assertion) and `:519–536` (orphan-workflow deletion claims item preservation without creating/asserting items). These are questions about what tests prove, not findings or permission for the auditor to rewrite tests.
- **No new PO ruling request:** product correctness findings #1–#3 conflict with rules already in force. #4 concerns the audit tool's existing scope contract. No finding was marked Covered by an epic merely because a broad future redesign could touch the code.

## Files marked read whole

The scope script marked the following 32 files. Each was read whole by every applicable instance; File Responsibility read the complete list.

| File | Script reason |
|---|---|
| `client/src/components/HierarchyModal.tsx` | 11 changed code lines |
| `client/src/components/KanbanCard.test.tsx` | New file |
| `client/src/components/KanbanCard.tsx` | 12 changed code lines |
| `client/src/components/workflow/descendantsProjection.test.ts` | 66 changed code lines |
| `client/src/components/workflow/descendantsProjection.ts` | 20 changed code lines |
| `client/src/components/workflow/dragRegions.test.ts` | 34 changed code lines |
| `client/src/components/workflow/dragRegions.ts` | 13 changed code lines |
| `client/src/components/workflow/dragStructure.test.ts` | 74 changed code lines |
| `client/src/components/workflow/dragStructure.ts` | 19 changed code lines |
| `client/src/components/workflow/modalPlacement.ts` | 14 changed code lines |
| `client/src/components/workflow/placement.test.ts` | 22 changed code lines |
| `client/src/components/workflow/popSession.test.ts` | 56 changed code lines |
| `client/src/components/workflow/popSession.ts` | 13 changed code lines |
| `client/src/components/workflow/useBoardDnd.test.ts` | 11 changed code lines |
| `client/src/components/workflow/useBoardDnd.ts` | 26 changed code lines |
| `client/src/components/workflow/useBoardManagement.test.ts` | New file |
| `scripts/audit-scope/config.mts` | 11 changed code lines |
| `scripts/audit-scope/config.test.mts` | 16 changed code lines |
| `scripts/audit-scope/diff.mts` | 61 changed code lines |
| `scripts/audit-scope/diff.test.mts` | 24 changed code lines |
| `scripts/audit-scope/testRepo.mts` | New file |
| `scripts/audit-scope/testRepo.test.mts` | New file |
| `server/src/routes/workflows.ts` | 19 changed code lines |
| `server/tests/routes/workflows.test.ts` | 51 changed code lines |
| `tests/helpers/overflowTree.ts` | 14 changed code lines |
| `tests/helpers/seed.ts` | 34 changed code lines |
| `tests/ui/blocked-site-data.spec.ts` | New file |
| `tests/ui/drag-7-hierarchy-modal.spec.ts` | 26 changed code lines |
| `tests/ui/drag-7-modal-hold.spec.ts` | 17 changed code lines |
| `tests/ui/drag-7-overflow-row.spec.ts` | 20 changed code lines |
| `tests/ui/drag-card-zoom-in.spec.ts` | 12 changed code lines |
| `tests/ui/drag-column-bands.spec.ts` | 14 changed code lines |

## Close-out

Required findings remain open until their dispositions are verified against the resulting code. The audit end is frozen above; Nathan owns creating `epic-3-5-story-8-1-audited` at that end revision under the existing workflow. No tag was created by this audit. Keep this report and the scope/config folder in `docs/audits/` while it is open.

| Finding | Disposition | Evidence / destination |
|---|---|---|
| 1 | Open — Fix Now | Placement-aware containing ancestry required |
| 2 | Open — Fix Now | Publish changed own-slot release state to the session |
| 3 | Open — Fix Now | Validate workflow owner reference shape before DB binding |
| 4 | Open — Fix Now | Preserve literal context in scope comparison |
| 5 | Open — Fix Now | Correct unregistered-space release claim |
| 6 | Open — Fix Now | Correct containment/clamp branch description |
| 7 | Open — Fix Now | Correct foreign-hover/drop description |
| 8 | Open — Fix Now | Correct Playwright event-mechanism claim |
| 9 | Open — Fix Now | Correct overflow fixture title |
| 10 | Open — Fix Now | Correct workflow creation response type |
| 14 | Deferred — existing destination verified | Epic 3.5 roadmap, Story 10 item 7 names both helper consolidation and reconciliation split |

Optional findings #11–#13 and #15 require no close-out row. The two new Reconciler questions are recorded in the current plan, so their routing does not depend on a future reader finding this report.

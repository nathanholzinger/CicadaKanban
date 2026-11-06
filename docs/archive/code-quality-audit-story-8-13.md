# Code quality audit — Story 8.13

**Status:** review complete; open for required dispositions. No application fixes, commits or tags made by this audit.

**Range:** `epic-3-5-story-8-12-audited..2c4b1246ecb6cdc9b96790ae175aae4c88476a6f`. The base tag resolves to `8a025230f16cf9b557d73a89fa2d1b9f36c1bd67`; the range contains **13 commits**. It includes the preceding audit's fix batches and their tests, plus Story 8.13's modal-to-sheet navigation and create-depth-cap work. The working tree was clean when the range was frozen.

The scope generator assigned **49 code/test/instruction files**, **2,402 changed lines**, **10 removal sites**, and left out **32 moved lines**. Git reports 71 changed paths including documentation. The split is one instance per lens, each covering all applicable areas, using `story-8-13-scopes/config.json`. Correctness and Duplication each received 40 files and 2,372 changed lines; Drift received all 49 files; File Responsibility received the 28 files marked read whole. Four fresh reviewer contexts ran cold against their scope files and the shared persona/agent instructions, without plans, wiki pages, earlier audits or reconciliation reports. The passes overlapped within the available concurrency: Duplication started after File Responsibility completed. Native Codex tools replaced Claude harness metadata.

The broader 8.N recheck is outside this audit.

## Method and verification

All four assigned scopes completed. Files marked read whole:

- Client root: `App.tsx`, `App.pendingMove.test.tsx`.
- Components: `BoardView.tsx`, `HierarchyModal.test.tsx`, `ItemDetailPanel.test.tsx`, `ProjectOverviewTab.tsx`, `ProjectOverviewTab.test.tsx`, `UnsortedBucket.test.tsx`.
- Item-detail: `ChildrenSection.tsx`, `DetailSection.tsx`.
- Sidebar: `SortableProjectRow.test.tsx`, `useProjectCollection.ts`, `useProjectDragReorder.test.ts`.
- Workflow: `itemListOps.ts`, `itemListOps.test.ts`.
- Tooling: `classify.test.mts`, `diff.mts`, `diff.test.mts`, `lineKinds.mts`, all in `scripts/audit-scope/`.
- Server: `server/src/routes/items.ts`, `server/tests/routes/items.test.ts`.
- Test helpers: `holdRequests.ts`, `overflowTree.ts`.
- UI specs: `drag-7-hierarchy-modal.spec.ts`, `item-create-cap.spec.ts`, `project-tree-create-cap.spec.ts`, `project-tree-expansion.spec.ts`, `unsorted-unknown-status.spec.ts`.

Other assigned files were read at their listed changes and removal sites, with their headers, governing instructions and necessary callees. Findings may predate the range when encountered in a whole-file or governing-instruction read; #6 and #8 do.

The orchestrator re-traced every required correctness finding through its current controls, state handlers and server behavior. Reconciliation then read Story 8.13's current plan, the archived preceding fixes plan and its superseded handoff, their inbound deferrals, amendments and living-doc handoffs; the applicable wiki passages; Story 10's accepted work; and the current 8.13 confirming reconciliation's existing questions. No archive was edited. Neither story handoff declares a newly built Planned passage, and neither has a Makes-dead list. The prior fixes' known routes remain named; these findings do not silently reopen a rejected or deferred item. #1/#2 explain the new evidence against the preceding fixes' D1/D2 reasoning.

**Gates at the frozen endpoint:**

- `npm run check`: **passed**, exit 0; type checks, lint/docs, format checks, **444 server + 889 client + 258 tooling = 1,591 tests**.
- `npm run test:e2e -- --reporter=line`: **241 passed, 22 skipped, 0 failed**, exit 0, 4.2 minutes. Existing skips remain deferred work. This run passed the timing-sensitive specs recorded as failing in the story's earlier runs; it does not establish that those flakes are fixed.
- The first Playwright attempt stopped before tests: the sandbox blocked `tsx`'s Windows user lookup (`uv_os_get_passwd`). An approved outside-sandbox retry used the configured isolated test database and ports and passed.
- Five throwaway client probes **failed as expected**: one each for #1, #2 and #4, and both directions of #3. A separate passing server probe confirmed the exact two successful API responses and final database order used for #2. These ran after the clean main gate; their intentional failures are not baseline failures.
- Probe files were removed. Retained logs are under `node_modules/.cache/audit-8-13/`: `check.log`, `e2e.log`, `e2e-startup.log`, `client-probes.log`, `server-probe.log`. No fixed-version pass is claimed.

## Fix Now

### 1. An older project response can resurrect a deleted project [Correctness & Security + Consistency & Drift]

**Locations:** `client/src/components/sidebar/useProjectCollection.ts:108–112`, `:124–128`, `:93–98`; `client/src/lib/positionedWrite.ts:31–32`. The collection header's guarantee at `:3–6` also omits this exception.

Release a move of X and hold its successful answer after the server has committed it. Delete X using its still-available sidebar controls, and let the delete's refresh remove it. Release the older move answer: `applyWriteResponse` upserts X again. The probe expected only Y and obtained Y plus X. An outstanding edit has the same upsert path; deleting an ancestor also affects outstanding writes to its deleted descendants.

`remove` bypasses the per-project queue. The read/version guard cannot help after the delete's authoritative snapshot has already applied. The preceding fixes deliberately left deletes outside D1 because D2 refreshed the tree; this interleaving is new evidence that the refresh alone is insufficient.

**Fix:** coordinate deletion with outstanding writes and prevent older responses from reintroducing deleted rows or subtrees, or ensure a later authoritative resync follows them. Serializing only the deleted ID does not cover descendant writes. Bring the header's sequencing guarantee into agreement with the resulting implementation; a prose-only qualification does not resolve the defect.

**Wiki bucket:** breaks in-force rules — wiki project-tree §9, with §4. A successful delete removes the subtree; an obsolete move/edit must not put a deleted row back in the sidebar.

### 2. An older reindex disclosure can overwrite another project's newer position [Correctness & Security]

**Locations:** `client/src/components/sidebar/useProjectCollection.ts:52–54`, `:124–127`; `client/src/lib/positionedWrite.ts:21–27`.

Queues are per project, but a position response can change other projects through its reindex disclosure. With root siblings X=1, Y=998, Z=999:

1. Move X after Z. The server reindexes Y=1 and Z=2, stores X=3 and discloses those values. Hold that answer.
2. Move Y after X. Its answer Y=4 arrives first and applies.
3. Release X's older answer. Its Y=1 pair overwrites Y=4. The client orders **Y, Z, X**, while the database orders **Z, X, Y**.

The client probe reproduced the wrong order. The separate server probe confirmed that both requests return 200 with precisely those values and that the final server order is Z, X, Y. Another project's drag is allowed while the first answer is outstanding, and ordinal placement permits anchoring against pending X.

The preceding fixes' D1 reason says ordered same-project answers make every reindex disclosure current. It does not consider a response that renumbers a different project's later-written row. Its preference for a queue over an unverified server-order assumption remains relevant; a same-ID queue simply does not cover the whole conflict.

**Fix:** preserve server ordering for every row a disclosure affects, using safe conflict serialization or suitable version/recovery handling. Dropping an older written row while blindly applying its pairs is insufficient. Keep current ordinal previews and the shared `applyWriteResponse` fold.

**Wiki bucket:** breaks in-force rules — wiki project-tree §4 and wiki positioning §7–§8. The settled list must show the server's order after applying disclosed positions.

### 3. The Sheet's add-child control keeps its pre-reparent depth [Correctness & Security]

**Locations:** `client/src/components/item-detail/ChildrenSection.tsx:67–68`; `client/src/components/ItemDetailPanel.tsx:233–235`.

The new cap guard reads `detail.depth` from the initial GET. Reparenting succeeds through the Sheet's Parent picker, but its PUT response has no computed depth. Merging that row leaves the old depth in the open Sheet.

At cap 5, open a leaf at API depth 4: Add is disabled. Reparent it to the root: Add stays disabled, blocking a legal child until the Sheet remounts. Conversely, a root leaf moved under a depth-3 parent remains enabled at resulting API depth 4 and offers a create the API refuses. Both probes failed at the final enabled/disabled assertion after confirming that the parent update succeeded.

**Fix:** refresh the detail or derive its current depth from authoritative hierarchy data after a parent change, and use that current value for the guard. Keep the shared `noChildReason` rule and its depth-base conversion.

**Wiki bucket:** breaks in-force rules — wiki item-attachment §14 and wiki hierarchy-placement §6. The Sheet's general design and parent-picker filtering remain open; the child-creation cap rule is settled and applies after legal reparenting too.

### 4. A rename queued behind a move can reopen a collapsed parent [Correctness & Security]

**Location:** `client/src/components/sidebar/useProjectCollection.ts:93–101`.

`before` is captured when the edit is requested, before its queued turn. Move root X under P with its answer held, then rename X while the move is pending. Let the move answer start the rename and collapse P before the rename answer arrives. The rename compares X's original root parent with P and calls `onParentOpened(P)`, reopening P even though that edit changed only the name.

The probe used the real collection and collapse hooks: P was collapsed before the rename response, and was open afterward.

**Fix:** compare against the authoritative parent immediately before the queued edit actually runs, or otherwise identify whether that edit changed parentage. The value must be current; moving the capture into a callback that still closes over an older render is not sufficient.

**Wiki bucket:** breaks an in-force rule — wiki project-tree §11. A rename leaves a collapsed parent collapsed.

### 5. The root guardrail points to the former reconciliation site [Consistency & Drift]

**Location:** `AGENTS.md:100–107`.

The guardrail still locates project-write folding in `App.tsx`. The range moved the actual `applyWriteResponse` calls to `client/src/components/sidebar/useProjectCollection.ts:82,97,126`; App delegates to the hook.

**Fix:** update the pointer to the hook. This is a root instruction change for the Architect, handed off in Story 8.13's Open questions.

### 6. The root table says attachments have no UI [Consistency & Drift]

**Location:** `AGENTS.md:49`; contrary implementation: `client/src/components/ItemDetailPanel.tsx:356`, `client/src/components/item-detail/AttachmentsSection.tsx:19–46,53–106`.

The table calls attachments schema-only, with no UI. The Sheet renders working attachment fetch/create/delete controls. The statement predates this range but was encountered in the governing project context.

**Fix:** describe the implemented link-attachment surface and remove the schema-only/no-UI claim. Handed to the root file's owner with #5.

### 7. Item reference guards copy an existing presence helper [Duplication & Abstraction]

**Locations:** `server/src/routes/items.ts:159–163`, `:284`; existing helper: `server/src/lib/getOrNotFound.ts:39`; established caller: `server/src/routes/workflows.ts:153–157`.

The item route repeats `value !== undefined && value !== null` before type/agent reference lookups, exactly the owned `namesARow` predicate. The copies currently agree; this is a small structural finding under the audit's existing-helper-copied-instead-of-called criterion, not a new runtime defect.

**Fix:** import `namesARow` and use it for the two create lookups and the update agent lookup. Preserve the shape checks, refusal order, and omitted/null/empty-string behavior.

## Routed to a story's plan

### 8. A modal E2E spec asserts a wall-clock sequence reserved for pure/manual tests [Consistency & Drift]

**Location:** `tests/ui/drag-7-hierarchy-modal.spec.ts:635–661`.

DRAG-7.10 seeds a literal 1,500 ms delay and asserts a reset sequence through two 800 ms excursions and two 100 ms returns. That contradicts the spec's “never a duration” header and the governing workflow testing convention. This is an existing test-layer/convention issue, not evidence of a new modal runtime defect. Story 8.13 already reports this case's load-sensitive failures, and Story 10 already owns DRAG-7.10 and the flakiness decisions.

**Fix:** assert deterministic clock reset in the pure pop-machine layer; retain browser assertions for reachable gesture/write outcomes. Read any browser thresholds from the value returned by `seedDragTuning`. A Manual classification remains Nathan's decision.

**Route:** accepted in `story-10-dnd-automation-catch-up.md`, Inbound deferrals, “Story 8.13 audit — #8”. Story 10 certainly reworks this case and its test layer, so a separate pre-Story-10 rewrite would duplicate that work.

## Watch List

### 9. Descendants-section modeling could separate from collection operations [File Responsibility]

**Locations:** `client/src/components/workflow/itemListOps.ts:274–377`; associated tests at `itemListOps.test.ts:323–564`.

The module holds both placement-aware collection reads/mutations and a descendants representation: hierarchy adapters, level policy, overflow identifiers and section entries. The latter already accepts a children callback or hierarchy rows, giving it a clean extraction boundary.

**Optional fix:** extract that section model and its tests, retaining placement types and collection reads/mutations together. No current entanglement makes the split mandatory.

### 10. Modal/Sheet integration could have its own E2E spec [File Responsibility]

**Location:** `tests/ui/drag-7-hierarchy-modal.spec.ts:786–1047`.

The file now combines modal drag/lifecycle scenarios with Sheet navigation, editing, dismissal and modal invalidation. The new integration block has a clean seam and uses the shared overflow-tree helpers.

**Optional fix:** move the Sheet interaction cases into a separate spec, leaving the row-carrying scenario at `:832–860` with drag behavior. This can accompany #8's later Story 10 work; it is not required for the present audit.

## Covered by

No additional Covered-by findings. #8's exact route is recorded above; the existing Story 10 and later-epic deferrals were not inferred to cover unrelated defects.

## Informational

### 11. The missing parent-navigation link is already an open product/build question [Orchestrator reconciliation]

**Locations:** `client/src/components/item-detail/ParentSection.tsx:32–43,70–83`; Story 8.13, Open questions; the confirming reconciliation's DRAG-7.33 row.

The Sheet offers a Parent picker, which reparents, and links to children, but no link that navigates to its parent. The wiki/case's parent-navigation half already has an explicit PO/Planner handoff in the story. This audit preserves that existing question and makes no new product request or coverage claim.

## Handoffs

- Story 8.13's Open questions names #1–#7 for the Architect/Coder, with root instruction ownership retained for #5/#6.
- The same section hands the optional overlap question about `App.pendingMove.test.tsx:147–175` and `:237–253` to the Test Reconciler. It is not a duplication finding or a demand to remove tests, and needs no repeated full reconciliation.
- Story 10's Inbound deferrals names #8's exact spec and timing issue. The existing DRAG-7.33 question remains where it was.

## Close-out

| Finding | Required disposition | Status |
|---|---|---|
| 1 | Fix stale post-delete project responses/subtree resurrection | Open |
| 2 | Fix cross-project reindex response ordering | Open |
| 3 | Keep the Sheet child-cap guard current after reparenting | Open |
| 4 | Preserve a collapsed parent after a queued rename | Open |
| 5 | Architect updates the project reconciliation pointer | Open |
| 6 | Architect corrects attachment UI context | Open |
| 7 | Use the existing reference-presence helper | Open |
| 8 | Deferred to Story 10, Inbound deferrals, “Story 8.13 audit — #8” | Destination names the issue; route recorded |

The report stays open for #1–#7. Optional #9–#10 need no recorded disposition. The broader 8.N review has not started.

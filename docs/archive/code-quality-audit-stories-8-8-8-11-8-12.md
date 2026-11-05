# Code quality audit — Stories 8.8, 8.11 and 8.12

**Status:** review complete; open for required dispositions. No application fixes, commits or tags made by this audit.

**Range:** `epic-3-5-story-8-7-audited..524b9e70ede85a4fd083cde1d453b8aef7559f16`. The base tag resolves to `f1b734a706659dfc62ec95f10018a88bafe925b5`; the range has **26 commits**. It includes the preceding audit's fix batches and Story 8.9, as well as the three named stories. Git reports 125 changed paths; the scope generator assigns **79 code, test and config files**, **3,757 changed lines**, **26 removal sites**, and excludes **4 moved lines**.

The working tree was clean when the range was frozen. HEAD stayed at that end commit. Other sessions subsequently changed planning and test-plan documents; those changes are outside this audit's frozen range and were preserved.

## Method and verification

The four lenses completed these 15 scope assignments:

| Lens | Instances |
|---|---|
| Correctness & Security | board, board-tests, sidebar, sidebar-tests, server, support |
| Consistency & Drift | board, board-tests, sidebar, support |
| Duplication & Abstraction | client-src, client-tests, support |
| File Responsibility | client, support |

The configuration and generated scopes are in `stories-8-8-8-11-8-12-scopes/`. There were 13 fresh reviewer contexts: after a usage-limit interruption and an orchestration thread limit, one Duplication reviewer covered client-tests and support, and one File Responsibility reviewer covered client and support. Each stayed in its lens. Workers received the role definition/persona and scope, with no parent conversation, plans, wiki, prior audit or findings from other workers. Claude tool/model frontmatter was treated as harness metadata; native Codex tools performed the review.

**Read whole (35 files):**

- Client root: `App.tsx`, `App.test.tsx`, `App.pendingMove.test.tsx`.
- `client/src/components/`: `BoardView.tsx`, `dragChrome.tsx`, `dragChrome.test.tsx`, `ForcedStopCue.test.tsx`, `HierarchyModal.test.tsx`, `KanbanCard.tsx`, `KanbanCard.test.tsx`, `ProjectSidebar.tsx`.
- `client/src/components/sidebar/`: `projectTreeUtils.ts`, `projectTreeUtils.test.ts`, `SortableProjectRow.tsx`, `SortableProjectRow.test.tsx`, `useCollapsedProjects.ts`, `useCollapsedProjects.test.ts`, `useProjectDragReorder.ts`, `useProjectDragReorder.test.ts`.
- `client/src/components/workflow/`: `itemListOps.test.ts`, `useBoardDnd.test.ts`, `useForcedStop.ts`, `useForcedStop.test.ts`.
- `client/src/lib/`: `hierarchy.ts`, `hierarchy.test.ts`, `hierarchyPlacement.ts`, `hierarchyPlacement.test.ts`; also `client/src/test/dragFixtures.ts`.
- Tooling: `scripts/audit-scope/lineKinds.mts`, `lineKinds.test.mts`.
- Server: `server/src/routes/columns.ts`, `server/tests/routes/columns.test.ts`, `server/tests/routes/workflows.test.ts`.
- E2E: `tests/helpers/projectTreeDrag.ts`, `tests/ui/project-tree-drag.spec.ts`.

Other files were read at the generated changed/removal sites, with their headers, governing instructions and necessary callees. Whole-file and dependency review can identify defects that predate the range; #3 and #4 are such findings.

The orchestrator retraced every required correctness finding. Reconciliation read the archived plans for **8.8, 8.9, 8.11 and 8.12**, including their inbound deferrals, amendments, code maps and handoffs, then the relevant wiki sections. No archive was edited. The separate current test-reconciliation report was consulted for existing coverage work; this audit does not replace that review.

**Gates:**

- Clean `npm run check`: **passed**, exit 0 — type checks, lint/docs, formatting, **438 server + 831 client + 245 tooling tests**.
- Full isolated Playwright run: **215 passed, 22 skipped, 0 failed**, exit 0, 4.3 minutes. The skipped cases remain deferred work, not passing coverage.
- The first Playwright startup failed inside the sandbox at `tsx`'s `uv_os_get_passwd` call; its approved outside-sandbox retry ran successfully on the configured test ports/database.
- The first full check overlapped a reviewer's two temporary race probes and therefore included their intentional failures. It is not a clean baseline result. The clean check above ran after all temporary test files were removed.
- Independent root probes reproduced #1 and #2 with two failing client tests; #3 with failing browser assertions after successful title-edit and DELETE responses; #4 with five failing route assertions (500 rather than 400); #5 with direct calls yielding equal stripped JSX, `reading = drift`, and no removal site. The first attempted Unknown-status drag probe timed out without a move and is **inconclusive**; it is not evidence for #3.
- Probe files were removed. Ignored local logs are in `node_modules/.cache/audit-8-8-8-11-8-12/`. These are defect reproductions, with no fixed-version pass claimed.

## Fix Now

### 1. An older project move can replace the latest saved move [Correctness & Security]

**Locations:** `client/src/App.tsx:146–153`, `client/src/App.tsx:169`.

Move project R under P, then re-drag it under Q before the first answer arrives. If Q's answer arrives first, settling that move exposes the older pending P placement. The later P answer then unconditionally overwrites the saved row. The sidebar ends with R under P while the server's latest save has it under Q. The root probe expected `P -C -D Q -R` and obtained `P -C -R -D Q`.

**Fix:** sequence same-project writes or track their generations through both pending placements and responses. An older placement must not become authoritative after a newer move settles. Discarding a stale row must also account for any reindex disclosure, resyncing when its currency cannot be established.

**Wiki bucket:** breaks an in-force rule — wiki project-tree §4, with wiki positioning §8. Successful moves must settle without replacing the current saved placement with an obsolete one.

### 2. A recovery snapshot can undo a newer successful project write [Correctness & Security]

**Locations:** `client/src/App.tsx:159–161`; the same replacement pattern exists after delete at `client/src/App.tsx:127–129`.

R's move fails and starts a recovery GET that captures the old project tree. While that read is outstanding, Q moves under P and its successful answer lands. The older GET then calls `setProjects` with Q's old top-level location. Q has no pending placement left to protect it, so the sidebar stays wrong until another refresh. The root probe reproduced that final overwrite.

**Fix:** give full-tree reads a mutation/version boundary. A snapshot taken before an intervening write must be discarded and refreshed or reconciled with those writes, rather than replacing the collection unconditionally. Cover the delete-refresh path as well.

**Wiki bucket:** breaks an in-force rule — wiki project-tree §4. Recovery from one write must not undo another write that succeeded.

### 3. Unknown-status cards retain a stale board-load snapshot [Correctness & Security]

**Locations:** `client/src/components/BoardView.tsx:162–167`, `client/src/components/BoardView.tsx:426–428`, `client/src/components/UnsortedBucket.tsx:33–36`.

Invalid items are loaded into the live item collection, but Unsorted renders `board.unsorted.invalidItems` separately. Editing or deleting an item updates the live collection without replacing that snapshot. Browser probes confirmed a successful title update leaves the old card title, and a successful DELETE leaves the deleted card visible.

**Fix:** derive Unknown-status rows from the current item state and applicable placements, using the workflow's valid workphase IDs and existing project/attachment filtering. Keep ordinary writes and Unsorted on the same source of item data. Add regressions for edit and deletion; verify reassignment too.

**Wiki bucket:** breaks in-force rules — wiki boards-columns-unsorted §3 and §10. A deleted item is not an item the board shows, and the bucket must show the current invalid item, not its obsolete data. Bucket styling being an Open question does not make stale item data intentional.

### 4. Item creation still looks up malformed references before checking their shape [Correctness & Security]

**Locations:** `server/src/lib/itemHierarchy.ts:229–234`, `server/src/routes/items.ts:106–145`.

`POST /api/items` with a valid title/project but `workphaseId: {}` reaches SQLite binding and returns `{error: "Internal server error"}` with status 500. The same happens for object values in `parentId`, `projectId`, `type` and `agentId`. All five route probes reproduced it. The range's other reference fixes do not cover these create paths.

**Fix:** use the shared `referenceShapeError` before these lookups, preserving each field's omitted/null/inherited semantics. Keep the create workphase check in `resolveCreate` so create and hierarchy updates share that decision. Assert the 400 and no mutation for malformed values.

**Wiki bucket:** breaks an in-force rule — wiki row-references §1, with wiki item-attachment §14. This is an unhandled binding path, not a preference between two reasonable client-error statuses.

### 5. JSX text changes can be excluded from the audit's substantive scope [Correctness & Security]

**Locations:** `scripts/audit-scope/lineKinds.mts:115–132`, `scripts/audit-scope/diff.mts:110–140`, `scripts/audit-scope/classify.mts:29–34`.

Changing `<pre>a b</pre>` to `<pre>a  b</pre>` changes rendered text, but `valueSpans` does not preserve `JsxText`. Both versions collapse to the same stripped code, and `readingOf` returns `drift`. When blame ignores that whitespace change, the diff scanner also treats the hunk as formatting and yields no removal site. The root direct-call probe reproduced both decisions.

**Fix:** preserve significant JSX text in code normalization and in the formatting/removal comparison, using JSX-aware source context. Add TSX classification and removal-site regressions alongside the existing string/regex/template cases. Also check leading and multiline JSX text rather than only this inline example.

**Classification:** a process/tooling contract violation, governed by audit-workflow §2's substantive-code scope rules; no product-wiki behavior or PO decision is involved. Story 8.9's literal-whitespace fix did not consider this additional value kind. No omission from this frozen range was demonstrated by the synthetic probe.

### 6. The sidebar order comment claims a board fallback it does not share [Consistency & Drift]

**Locations:** `client/src/lib/hierarchy.ts:65–69`; comparison: `client/src/components/workflow/itemListOps.ts:157–166`.

The sidebar comment says its pending-move rule is the board's `applyPlacements` rule. The sidebar appends when a named anchor is absent; the board falls back to the item's sorted place. The equivalence claim hides that difference.

**Fix:** limit the comparison to shared insertion beside a present anchor and unchanged position values, or remove the equivalence claim. Do not change either fallback as part of a prose correction.

### 7. A test title claims traversal pruning that the function does not perform [Consistency & Drift]

**Locations:** `client/src/lib/hierarchyPlacement.test.ts:54`; implementation: `client/src/lib/hierarchyPlacement.ts:85–91`.

The title says excluded entries' children are never walked. `flattenHierarchy` walks the hierarchy first and then filters rows with `toRows`.

**Fix:** title the test around exclusion from the returned rows, including descendants. Its assertions do not establish pruning of the traversal.

### 8. A hook comment incorrectly claims a unique non-component export [Consistency & Drift]

**Location:** `client/src/components/dragChrome.tsx:142–143`.

`useItemRow` is called the one export that is neither a component nor a constant. `tierClass`, `tierVars` and `carriedBranchLabel` are exported functions too.

**Fix:** remove the uniqueness claim while keeping the reason the hook belongs beside the indicator.

### 9. A branch-count comment disagrees with its fixture [Consistency & Drift]

**Location:** `client/src/components/workflow/itemListOps.test.ts:438–439`.

The comment says two children and three further rows. The fixture has S1/S2 and S1a/S1a1: two children and two further descendants, matching the asserted `[2, 4]`.

**Fix:** change “three” to “two”.

### 10. Hook event fixtures bypass the required row-data constructors [Consistency & Drift]

**Locations:** `client/src/components/workflow/useBoardDnd.test.ts:24–27`, `client/src/components/workflow/useBoardDnd.test.ts:248–259`.

The column drop and Stub `over` fixture hand-write registration data. The governing workflow `AGENTS.md` makes `columnData` and `itemRowData` the write path, which neighboring collision tests already use. These fixtures duplicate that shared contract.

**Fix:** use `columnData()` and `itemRowData(...)`, retaining event-only sortable metadata and the deliberately empty active data used to test lagging registrations. No gesture behavior needs to change.

### 11. Built branch rules lack wiki index pointers at their enforcement sites [Orchestrator handoff check]

**Locations:** `client/src/components/workflow/useBoardDnd.ts:643–645`, `client/src/components/workflow/itemListOps.ts:330–345`, `client/src/components/dragChrome.tsx:197–209`.

Story 8.8's “Planned passages now built” lists D1–D5, D7 and D8. The pickup snapshot, branch filtering, count wording and outside-box line have descriptive comments but no index pointers there. The existing §7.2 pointer on `dropAnchorFor` guards neighbor selection; it is not the main enforcement site of those other rules. The shared branch page added subsequently has no production-code `wiki hierarchy-placement §8` pointer.

**Fix:** add concise index pointers at the relevant decision sites: shared branch/count/line rules to wiki hierarchy-placement §8, and the board-specific pickup/filter behavior to wiki board-drag-interaction §7.2 or §5a as appropriate. Keep one pointer per enforced rule. This is the audit-workflow's explicit built-handoff index check, not a general comment-convention sweep.

## Routed to a story's plan

### 12. A skipped sidebar spec still describes drawn, dimmed descendants [Consistency & Drift]

**Location:** `tests/ui/project-tree-drag.spec.ts:257–258`.

The skip explanation says descendants are now drawn at opacity 0.3, and the title promises dimmed descendants. The branch is absent from `drawnItems`; the current TREE-2.1 case requires absence and a moving ghost.

**Fix and route:** replace the obsolete explanation/title and visibility assertions when Story 10 rewrites this skipped spec. That story is already planned to rework this exact file/case, so a separate rewrite now would be duplicated. Its **Inbound deferrals, “Audit follow-up — #12”** explicitly accepts this finding. The route does not make the skipped spec passing coverage.

## Watch List

### 13. App's project collection lifecycle has an extraction seam [File Responsibility]

**Location:** `client/src/App.tsx:36–46`, `client/src/App.tsx:81–169`, `client/src/App.tsx:183–270`.

App owns project CRUD, pending moves, settlement, recovery reads and collapse effects alongside selection, workflow inheritance and screen composition. A project-management hook could hold the collection and write lifecycle when this area next grows. Keep this optional: #1 and #2 can be fixed without making an extraction mandatory. **Can ride along with #1/#2** if the planner judges it useful.

## Covered by

No additional finding receives a Covered-by label. The known gesture skips, remaining case coverage and unbuilt column-stop banner already have destinations in Story 10; they are not new runtime defects from this audit. The future API-contract migration does not specifically dispose of #4.

## Informational

### 14. Review decisions and handoff checks [Orchestrator + structural passes]

**Code locations for the confirmations:** `client/src/components/sidebar/useCollapsedProjects.ts:1–4,14–19`, `client/src/components/KanbanCard.tsx:1–18`, `client/src/components/sidebar/useProjectDragReorder.test.ts:1`, `client/src/components/dragChrome.tsx:36–40`, `client/src/lib/hierarchy.ts:224–230`. No additional code change is requested for these confirmations.

- The sidebar collapse-header candidate is not retained as a required finding: its next clause identifies write-driven opening, and the adjacent `toggle` comment explicitly documents manual chevron opening. No new ruling or behavior change is needed.
- The board/sidebar indicator separation and client/server cap checks have reasons at their sites. Branch traversal, wording and tier styles already share primitives; Duplication found no additional actionable consolidation.
- Keep KanbanCard's overlay forms together: its documented mount/measurement constraint argues against splitting them into separate mounted components. The large sidebar hook tests remain focused on one hook.
- The closed plans' inbound routes were checked against the current roadmap and Story 10 plan. The 8.11 movement/depth work is implemented by 8.12. Its handoff expressly does not claim a scrolled-list or deep-stack exercise; this audit makes no automation-completion claim for those paths. The old `travelingRowsFor`, `AnchorSession` and trial collapse switch are absent. The ranks were replaced by slot ordering; #6 concerns the remaining comment, not a surviving rank implementation.
- Plans 8.9, 8.11 and 8.12 list no built wiki Planned passage. Story 8.8's listed built branch decisions produce #11. The stopped-column banner remains Planned and assigned to Story 10 rather than being reported as missing built behavior.
- A worker's note about immediate no-write assertions versus `settledWrites` is handed to the Test Reconciler in the follow-up plan. It is not a coverage finding or an instruction to add sleeps indiscriminately. The existing reconciliation report remains authoritative for its mapping review.

## Follow-up and close-out

The review handoff is `docs/planning/epic-3-5-stories/stories-8-8-8-11-8-12-audit-follow-ups.md`. No code fix is included. Suggested order: project-write races (#1/#2), Unknown-status state (#3), reference validation (#4), scope correctness (#5), then small documentation/convention work (#6–#11). Behavioral batches require the full gate and E2E; scope-tooling changes require their focused regressions and full gate. Nathan reviews and commits each batch under the normal workflow.

| Finding | Disposition | Evidence / destination |
|---|---|---|
| 1 | Open — Fix Now | Reproduced; code unchanged |
| 2 | Open — Fix Now | Reproduced; code unchanged |
| 3 | Open — Fix Now | Browser edit/delete reproduced; code unchanged |
| 4 | Open — Fix Now | Five route probes reproduced; code unchanged |
| 5 | Open — Fix Now | Normalization/classification/removal probe reproduced; code unchanged |
| 6 | Open — Fix Now | Comment and both fallback branches retraced |
| 7 | Open — Fix Now | Title and full-walk/filter implementation retraced |
| 8 | Open — Fix Now | Export declarations checked |
| 9 | Open — Fix Now | Fixture and count assertion checked |
| 10 | Open — Fix Now | Fixtures and governing constructor rule checked |
| 11 | Open — Fix Now | Built handoff and production pointer search checked |
| 12 | Routed | Story 10 plan, Inbound deferrals, “Audit follow-up — #12” |

**Totals:** 11 Fix Now (5 correctness, 5 consistency/drift, 1 built-handoff index check), 1 routed, 1 Watch List, 1 Informational. The audit remains open until required findings have recorded dispositions.

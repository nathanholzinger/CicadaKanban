# Code quality audit — Story 8 close-out

**Status:** review complete; open for required dispositions. **15 Fix Now findings: five runtime defects, with #5 awaiting a PO ruling before its fix, and ten comment/instruction corrections.** Five optional Watch List findings. No application fixes, commits or tags made by this audit.

**Range:** `epic-3-5-story-7-rerun-audited..e070ef1af682ce692651580a868db462d90ac35e`, **88 commits**. The base tag resolves to `3ede430f85612b9b87b183c2ab9a5003511bd059`; the endpoint is the committed Story 8.13 close-out. This deliberately overlaps the individual Story 8 audits. The only uncommitted file at scope freeze was the approved close-out plan update, which supplies the config and changes no application code.

## Scope and method

The agreed scope is the drag-related files read whole, rather than every file the range touched. The script classified **156 files**, leaving out **54 moved lines**. The launched Drift scopes contain **74 files**, **7,203 changed lines** and **61 removal sites**. All 74 files are marked read whole, totaling **18,791 lines** including the workflow instructions. The complete file list is `readWhole` in [the saved config](story-8-close-out-scopes/config.json); the generated scopes and [run summary](story-8-close-out-scopes/README.md) retain the assignments and deliberate exclusions.

| Group | Files | Whole-file lines |
|---|---:|---:|
| Board drag modules and workflow instructions | 19 | 4,614 |
| Board/sidebar surfaces and shared hierarchy/response helpers | 18 | 3,425 |
| Board unit tests and fixtures | 17 | 5,228 |
| Surface unit tests | 16 | 4,893 |
| E2E drag helpers | 4 | 631 |

All thirteen logical scope assignments completed, using twelve cold reviewer contexts, with at most three workers alongside the orchestrator. Correctness and Drift each have board, surfaces, board-tests and surface-tests instances; Duplication has source, board-tests and surface-tests; File Responsibility has source and tests. Every assignment confirmed its whole-file reads and removal-site review. `AGENTS.md` goes to Drift alone. The `out` instance of each pass is retained but not launched. Two interrupted reviewers resumed their original contexts after a usage limit; a harness thread limit required the same File Responsibility reviewer to take its test scope after its source scope. No worker received plans, wiki pages, earlier audits or another reviewer's findings. Claude harness frontmatter was replaced by native tools and the inherited Codex model.

The E2E specs remain Story 10's; they were run as a baseline, not reviewed. Server code was followed only to confirm the response contract used by the probes. Tooling, the Sheet/create caps, Unknown status and other exclusions remain outside the substantive audit. One worker's candidate concerning stale Unknown-status attention after filing a parent was excluded under that explicit topic boundary; it was not probed or classified here.

The orchestrator re-traced every retained correctness finding through current code and callers. The merge read this close-out plan; Story 10's Scope and Inbound deferrals; the drag-cues/morph deferral in `epic-8-decisions.md`; and `carried-copy-leaves-cursor.md`, `free-item-reparent-gesture.md` and `ui-message-banners.md`. It read the applicable wiki passages for correctness classification. Earlier audit scope/method records and git snapshots were consulted only to establish the historical attribution below. No archive, wiki or test-plan catalog was edited.

### Verification

- `npm run check`: **passed**, exit 0 — type checks, lint/docs, formatting and **444 server + 908 client + 258 tooling = 1,610 tests**.
- `npm run test:e2e -- --reporter=line`: **241 passed, 22 skipped, 0 failed**, exit 0, 4.3 minutes. These existing skips remain deferred work. A green run does not establish that timing-sensitive specs are no longer flaky.
- The first Playwright startup failed at the sandbox's Windows user lookup (`uv_os_get_passwd`); the approved outside-sandbox retry used the configured isolated test stack/database and passed.
- Six throwaway client probes failed at the intended final assertions: both directions of #1's position overwrite, and one each for #2–#5. The sidebar probe reproduces the hook's stale-event/release sequence; the event ordering was independently checked in the installed dnd-kit source.
- Two passing real-server probes confirmed that #1's exact response bodies and final stored positions arise from successful item moves using `anchorId`/`side`. This confirms the fixtures are legal server outcomes, not invented conflicting responses.
- Probe files were deleted. Logs remain locally under `node_modules/.cache/audit-story-8-close-out/`: `check.log`, `e2e.log`, `e2e-startup.log`, `client-probes.log`, `server-probes.log`. Intentional probe failures occurred after the green baseline gate. No fixed-version pass is claimed.

## Fix Now

### 1. An older board response can overwrite another item's newer position [Correctness & Security]

**Locations:** `client/src/components/workflow/useItemManagement.ts:84–98`; callee `client/src/components/workflow/itemWriteReconciliation.ts:90–95`; shared helper `client/src/lib/positionedWrite.ts:16–32`.

Per-item sequence numbers reject only an older answer for the same item. They establish no ordering between X's and Y's responses, even though a reindex can set both positions.

Concrete successful API sequence: start with X=1, Y=998, Z=999 in one workflow. Move X after Z: the server reindexes to Y=1, Z=2, X=3. Hold that response. Move Y after X: its response sets Y=4. Apply Y's response first, then the held X response. The board becomes **Y, Z, X**, while SQLite holds **Z, X, Y**. The old answer passes X's own sequence check and requests no resync.

The reverse direction fails too: first move X between Y and Z, returning X=998.5 without a reindex. A later Y move reindexes X=1, Z=2, Y=3. Apply the later reindex first and the old X row second: X becomes 998.5 again. Protecting only reindex pairs would leave this half unfixed. Both client probes failed; both server sequences passed.

**Fix:** establish response currency across affected rows, protecting both disclosed pairs and the written row, or resync when overlap makes an answer unsafe. The shared helper already accepts `newer`; the board reconciliation path does not pass it. Cover the board's other write entry points when defining the ordering boundary, rather than adding a second folding algorithm. This settles this plan's Inbound deferral as a reproduced finding.

**Wiki bucket:** breaks rules in force, wiki positioning §7–§8 and board-drag-interaction §10. This is not a cue/morph placeholder or Story 10 automation change.

### 2. Zero zoom clocks and distance popping can recurse until the stack overflows [Correctness & Security]

**Locations:** `client/src/components/workflow/popSession.ts:203–210`, `:236–246`, `:343–347`; outer evaluator `client/src/components/workflow/useBoardDnd.ts:383–388`.

Set `cardZoomDwellMs=0`, `cardPopInDelayMs=0`, `popDistancePx=10`, all accepted parameter values. In a column, name Card P while the pointer is still in the column but more than 10 pixels outside P. The machine immediately zooms into P's Descendants region, immediately distance-pops back into the column, and immediately zooms into P again. `transitionTo` recursively re-evaluates the same sample, so the hook's outer four-hop bound never gets control. The pure-machine probe threw `RangeError: Maximum call stack size exceeded`.

**Fix:** bound same-sample transitions within the pure machine, or prevent revisiting a context in one evaluation. Preserve legitimate outward cascades and the ability to configure zero delays; restricting the temporary panel alone would leave the pure machine unsafe.

**Wiki bucket:** breaks the parameterized gesture in force, wiki board-drag-interaction §3–§3.1. This concerns termination, not whether the tuned values feel right.

### 3. The sidebar can release an older gap than the sortable ghost shows [Correctness & Security]

**Locations:** `client/src/components/sidebar/useProjectDragReorder.ts:160–186`; `client/src/components/ProjectSidebar.tsx:89–95`.

The hook updates its cached gap/depth only on `onDragMove`. In the installed dnd-kit implementation, a move carries the previous `over`; the following `onDragOver` supplies the new row without requiring another translation change. The sidebar does not handle that event.

Pick up root A in [A, B, C]. The final movement crosses B's collision boundary: the move still names A, then the sortable state names B and draws A's ghost after B. Release while still. The hook still holds A's own gap and writes nothing. The probe supplied the stale move followed by the new `over` at release; it expected the move after B and received zero calls. Local dnd-kit source at `client/node_modules/@dnd-kit/core/dist/core.esm.js:3210–3286` confirms the event ordering.

**Fix:** refresh the same projection from `onDragOver` as well as `onDragMove`, with the current delta and new neighbor. Keep one projection calculation for both events and ensure release reads the latest resolved placement.

**Wiki bucket:** breaks the rule in force, wiki project-tree §1: a release saves exactly the gap/depth the ghost shows. This is a functioning gesture defect, not Story 10's spec rework.

### 4. A superseded initial project read can erase a completed write locally [Correctness & Security]

**Locations:** `client/src/components/sidebar/useProjectCollection.ts:66–74`; development root `client/src/main.tsx:8–10`.

Root StrictMode runs the initial effect twice. Neither execution has cleanup or a currency guard. Let the second GET complete and expose the app while the first GET's older snapshot remains held. Complete an edit, then release that first GET: it unconditionally resets both the collection and `appliedRows`. The probe observed the name change from Renamed back to Old after a successful edit. The same replacement can undo a completed move's displayed parent/order; the guarded recovery reader does not protect initialization.

**Fix:** ignore cleaned-up effect executions and give initialization the same response-currency guarantees as other collection reads. Gate both state application and initialization completion appropriately.

**Wiki bucket:** breaks settled write/list behavior, wiki project-tree §4 and §7; a stale initial snapshot is not a new authoritative write. No visual-design ruling is needed to retain successful writes.

### 5. A retained loader can display board A while board B is selected [Correctness & Security; PO ruling before the fix]

**Locations:** `client/src/components/BoardView.tsx:143–176`, `:193–199`.

`loadBoard` captures `activeBoardId`, and neither starting the load nor applying its result checks the current selection. Start a workphase rename on A, select B and let B finish loading, then release the rename response. Its handler resumes with A's old loader and installs A's columns/items while the toolbar and column-create target still identify B. A component probe retained that exact loader, switched to B, called it, and observed board A replace B.

**Fix proposed:** give board loads selection identity and request-generation guards, including old handlers that start a load after selection changed. Protect loading completion and stop-cue completion as well as the data assignment. Checking only which request finished last is insufficient: an obsolete handler can start its request last.

**Wiki bucket:** PO ruling required. Wiki boards-columns-unsorted §1 and §3 define board identity/data, but the page's introduction explicitly leaves board presentation as a placeholder and does not state asynchronous selection behavior. The source demonstrates a conflicting view; it does not supply the missing product ruling. The close-out plan asks the PO to confirm that a completed older edit/reload must preserve the current board selection and view before this fix lands.

### 6. Validity comments omit the origin Card's deliberate exception [Consistency & Drift]

**Locations:** `client/src/components/workflow/popSession.ts:257–262`; `useBoardDnd.ts:254–260`; `descendantsProjection.ts:175–176`.

These comments say invalid Cards never resolve as regions or start zoom-in. `dragStructure.ts:247–249` deliberately retains the Stub's own containing Card regardless of target validity, so it can return there. Qualify the statements with this origin exception, preserving the foreign-target gate. No behavior change is proposed.

### 7. The anchor comment incorrectly excludes Free descendants [Consistency & Drift]

**Location:** `client/src/components/workflow/dragCollision.ts:245–248`.

“The dragged item's own descendants are never rows” is broader than the carried branch. Pickup carries attached links; Free descendants stay as column Cards and can name a reposition anchor. Say attached descendants carried with the item are absent, while Free descendants remain in the column.

### 8. The DOM summary makes the Card root the unconditional region owner [Consistency & Drift]

**Location:** `client/src/components/workflow/AGENTS.md:355–357`.

The root retains `data-drag-card`, but gives up `data-drag-region` while its hierarchy modal owns the region key (`KanbanCard.tsx:256–259`). Qualify the summary by whether that modal is open; the instructions' earlier modal description already states the exception.

### 9. Placement documentation restricts its direct parent to a Card [Consistency & Drift]

**Location:** `client/src/components/workflow/itemListOps.ts:40–45`.

`Placement.parentId` says “this Card.” A nested Descendants placement can name a Stub as its direct parent, and the release sends that resolved parent unchanged. Describe the parent item, which may be a Card or Stub.

### 10. The sidebar comment falsely says branch removal leaves gap indexes unchanged [Consistency & Drift]

**Location:** `client/src/components/sidebar/useProjectDragReorder.ts:129–132`.

The comment says placement does not read `drawnItems` and removing the branch does not affect the indexes it uses. `handleDragMove` passes exactly `drawnItems` to `resolveGap`; removing the child in [P, child, Q] changes Q's index from 2 to 1. Document the actual division: gap lookup reads the branch-filtered list, projection reads subtree-filtered rows, and own-slot lookup uses `flatItems`, where the active row's own index stays fixed.

### 11. Gap documentation promises a pickup snapshot that is not held [Consistency & Drift]

**Location:** `client/src/components/sidebar/projectTreeUtils.ts:100–102`.

The sortable list's order is described as its order at pickup. The hook derives that list from current `flatItems` each render; its held pickup state freezes classification/subtree/branch, not list order. Describe the current sortable list supplied to the function.

### 12. ShortCard documentation says an empty description reserves a text line [Consistency & Drift]

**Location:** `client/src/components/KanbanCard.tsx:105–107`.

The empty paragraph has no text line and no explicit/minimum height. The card wrapper fixes the outer height. Say the description occupies at most one line, and the wrapper supplies the fixed card height.

### 13. The drag helper describes a pre-pickup target measurement it does not make [Consistency & Drift]

**Location:** `tests/helpers/dragGesture.ts:24–30`; implementation `:105–106`.

`dragTo` picks up before its first `resolveTarget` call. The two measurements are after pickup and after the first approach/reflow, rather than a pre-drag position followed by a post-drag one. Correct the documented sequence.

### 14. The no-column fixture is incorrectly said to start every drag in no context [Consistency & Drift]

**Locations:** `client/src/components/workflow/useBoardDnd.test.ts:20`; `client/src/components/workflow/AGENTS.md:332–333`.

That is true for the default Free Card pickup. The file's Stub cases start in their containing Card's Descendants context regardless of columns (`useBoardDnd.ts:587–589`). Qualify both descriptions and distinguish the Stub cases.

### 15. A tier fixture calls a child/grandchild chain two children [Consistency & Drift]

**Location:** `client/src/components/sidebar/useProjectDragReorder.test.ts:1310–1311`; fixture `:1317–1318`.

Q1 is Q's child; Q2 is Q1's child. That extra generation accounts for Mid versus Low. Describe the chain explicitly rather than calling both Q's children.

## Routed to a story's plan

No new required deferral. The reproduced runtime defects remain this close-out's work. Existing Story 10 routes are discussed below, without turning them into new defects or duplicating their handoffs.

## Watch List

### 16. Region-cache lifecycle has an extraction seam [File Responsibility]

**Locations:** `client/src/components/workflow/useBoardDnd.ts:188–197`, `:267–304`, `:337–340`.

Structure resolution, element invalidation, sampling and parent lookup form a bounded DOM adapter beside gesture orchestration. Extract that adapter if this hook grows; no demonstrated entanglement requires a split now. It touches the same hook as #2 and #6, so it can ride along if the Architect judges the scope worthwhile.

### 17. Descendants-row projection can separate from item-list operations [File Responsibility]

**Locations:** `client/src/components/workflow/itemListOps.ts:23–167`, `:274–377`.

Hierarchy rows, visible-level limits and overflow projection form a separate presentation concept from ordinal placement/list selection. A descendants-row module is a natural optional seam, without current breakage demanding it. It can ride along with #9's documentation edit, but that one-line fix does not justify a refactor by itself.

### 18. HTTP test controls can separate from gesture helpers [File Responsibility]

**Locations:** `tests/helpers/dragGesture.ts:271–296`; `tests/helpers/projectTreeDrag.ts:6–23`.

Request delay/refusal/observation has a lifecycle independent of pointer geometry. A request harness beside `holdRequests.ts` could own those exports. No current failure warrants the split; it can ride along with #13, or be considered when Story 10 reworks helpers.

### 19. Two unit suites copy the same overflow hierarchy fixture [Duplication & Abstraction]

**Locations:** `client/src/components/workflow/itemListOps.test.ts:379–391`; `descendantsProjection.test.ts:204–217`.

Both build the same eleven-item hierarchy; the projection suite adds mover X. A shared base-tree factory would keep their common rendering/placement setup aligned, with local case changes left in each suite. The copies currently agree, so consolidation is optional. This does not call for merging their different assertions.

### 20. The sidebar test suite has two similar gesture adapters [Duplication & Abstraction]

**Locations:** `client/src/components/sidebar/useProjectDragReorder.test.ts:23–69`, `:1036–1084`.

`sidebarDrag` and `liveDrag` both apply pending parents, flatten the tree, render the hook and adapt pickup/absolute-depth hover/slot/release. Their extra controls differ. One local fixture supporting collapsed IDs, pending moves, rerender, cancel and expansion observation could replace both. Preserve pickup depth across rerenders. There is no demonstrated defect, so this is optional; it can ride along with #15's fixture-comment correction, without making consolidation required.

## Covered by

No new required Covered-by finding. Story 10 already names TREE-1.14's placement gap and its incomplete cyclic-release test; its Inbound deferrals explicitly retain the missing hover/release/refusal work. The Correctness and Drift test reviewers' notes at `useProjectDragReorder.test.ts:1092–1124` match that exact accepted route. No duplicate PO or Reconciler request is needed.

## Informational

### 21. Broader consolidation is not justified by the current source [Duplication & Abstraction]

The board/sidebar already share hierarchy placement, classification, carried-branch counting and drag chrome where their rules agree. Other similarities have concrete deliberate-separation reasons. No duplication finding meets Fix Now. The static project heading class string at `ProjectSidebar.tsx:75` and `ProjectOverviewTab.tsx:129` needs no extraction by itself.

### 22. The large sidebar drag suite still owns one tested contract [File Responsibility]

**Location:** `client/src/components/sidebar/useProjectDragReorder.test.ts:76–1397`.

Placement, branches, tiers and arriving responses all exercise the same hook's gesture contract. Named scenario families supply useful internal boundaries; length alone does not justify splitting this file. The reviewer independently noticed the adapter repetition already covered by #20; it is one optional consolidation, not a second finding.

The remaining test-sufficiency notes concern TREE-2.9's component count inputs versus hook evidence (`SortableProjectRow.test.tsx:342–356`), and the similar TREE-1.8/TREE-1.9 leave-and-return tests (`useProjectDragReorder.test.ts:255–264`, `:319–328`). They are optional checks for the next planned Reconciler pass, handed off in this plan; they are not code-quality findings or a request for a separate reconciliation run.

## Earlier-audit attribution

This distinguishes a defect that an earlier pass actually had the code to find from an old line newly made faulty elsewhere. The evidence is the earlier reports' scope/method records plus source snapshots at their frozen endpoints, not a commit message or an assumption that every Story 8 audit read every drag file.

| Findings | Earlier read and historical evidence | Lens |
|---|---|---|
| #1 | Already a named inbound handoff. The per-item tracker predates this range; its relevant lines were not established as earlier changed-line/whole-file scope. No new missed-pass attribution. | Not attributed |
| #2, #6's pop-machine comment | The 8.1 audit's changed pop machine qualified for a whole-file read. Its `c6d99c6` snapshot already has the recursive transition, immediate named-card zoom, distance-pop branch and the origin-region exception, with the overbroad validity comment. | Correctness for #2; Drift for #6 |
| #3, #10, #11 | The 8.8/8.11/8.12 report explicitly lists the sidebar hook and tree utilities read whole. Their relevant source is unchanged from its `524b9e7` endpoint. | Correctness for #3; Drift for #10–#11 |
| #4 | The 8.13 report lists `useProjectCollection.ts` read whole. At `2c4b124`, the initial GET already applies unconditionally without cleanup; root StrictMode and successful-write state updates are present. The later fix adds `remember` but does not introduce the read race. | Correctness |
| #5 | The 8.13 report lists `BoardView.tsx` read whole. That file is unchanged from `2c4b124`, including the retained workphase-handler loader. Its PO classification does not invalidate the factual conflicting-view observation. | Correctness |
| #7 | The false branch comment was added by `1318c01`, inside the 8.8–8.12 audit range, after attached-only carrying already left Free descendants drawn. It was Drift's changed text. | Drift |
| #8 | The governing workflow instructions already contained the unconditional root-region summary while describing the modal's exception elsewhere. They governed the preceding workflow reviews. | Drift |
| #9 | The 8.13 report lists `itemListOps.ts` read whole; its Card-only parent description already coexisted with nested Stub parents. | Drift |
| #12 | The 8.8–8.12 report lists `KanbanCard.tsx` read whole. The empty-description claim predates that range and already disagreed with the same fixed-height wrapper/paragraph. | Drift |
| #13 | The comment predates Story 8, but an earlier actual read of these unchanged header lines was not established. Age alone is not a missed-pass attribution. | Not attributed |
| #14 | The 8.8–8.12 report lists `useBoardDnd.test.ts` read whole. Its `524b9e7` snapshot already has both the no-context claim and Stub-context cases. The directory summary repeats the same claim. | Drift |
| #15 | The 8.13 report lists the sidebar drag test read whole. At `2c4b124` the same comment and Q → Q1 → Q2 fixture coexist. | Drift |

These suggest strengthening Correctness's attention to response ordering across IDs, initialization/reload lifetimes and same-sample state-machine cycles, and Drift's handling of universal claims, hierarchy terms and exceptional paths. Instruction changes remain the Architect's separate decision; this audit edits no persona or agent definition.

## Close-out

Review completion does not close the audit. The Architect plans required batches in `story-8-close-out-audit.md`, with correctness first, then required drift corrections. Optional structural work remains optional. #5 needs the recorded PO answer before its behavior fix. Nathan's endpoint tag is `epic-3-5-story-8-close-out`, without `-audited`; no tag was created here.

| Finding | Disposition | Destination/evidence |
|---|---|---|
| #1 | Open — reproduced | This plan's board-response Inbound deferral; fix batches to be planned |
| #2 | Open — reproduced | Close-out plan, Architect/Coder handoff |
| #3 | Open — reproduced | Close-out plan, Architect/Coder handoff |
| #4 | Open — reproduced | Close-out plan, Architect/Coder handoff |
| #5 | Open — reproduced; PO answer required | Close-out plan, Open questions for PO and Architect |
| #6 | Open | Close-out plan, Architect/Coder handoff |
| #7 | Open | Close-out plan, Architect/Coder handoff |
| #8 | Open | Close-out plan, Architect/Coder handoff |
| #9 | Open | Close-out plan, Architect/Coder handoff |
| #10 | Open | Close-out plan, Architect/Coder handoff |
| #11 | Open | Close-out plan, Architect/Coder handoff |
| #12 | Open | Close-out plan, Architect/Coder handoff |
| #13 | Open | Close-out plan, Architect/Coder handoff |
| #14 | Open | Close-out plan, Architect/Coder handoff |
| #15 | Open | Close-out plan, Architect/Coder handoff |

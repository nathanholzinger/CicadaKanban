# Code Quality Audit — M1 Foundation (API contract migration)

**Date:** 2026-11-07 · **Auditor:** orchestrating session, four passes run cold

## Range and how it ran

- **Range:** `c1aa1de9..4ecd49bb` — 8 commits, linear (`git rev-list --count`). `c1aa1de9` is Story 8.3's close, the last commit before the spike's Batch 1 (`0565cde3`). The range covers the framework spike (Batches 1–4), the migration planning commit, and M1 Batches 1–3. Story 8.N commits are out: they are audited on `main`.
- **Base tag:** none applies. `git describe --match '*-audited'` gives `epic-3-5-story-8-1-audited`, which would pull in Story 8.3. The newer `*-audited` tags (`8-7`, `8-12`, `8-13`) are on `main`, not in this branch's history. Nathan confirmed the range. Nathan tags `m1-foundation-audited` on the docs-only commit that records this report (no code changes after `4ecd49bb`).
- **Split (default config, 14 instances):**
  - Correctness: `C2`, `S1`, `S1t`, `T`.
  - Drift: `C2`, `S1`, `S1t`, `T`.
  - Duplication: `client-src`, `server`, `T`.
  - File Responsibility: `client`, `server`, `T`.
- **What the passes got:** 40 files to read; changed lines per instance: C2 504, S1 544–560, S1t 3958 (mostly the 2701-line snapshot), T 487; 5 moved lines left out; removal sites: 4 (C2), 1 (S1). Read whole: every new file (`client/src/api/generated.ts`, `transportTypes.ts`; `server/src/{domain/positioning,lib/mcpItemTools,lib/parseRequest,schemas/*}.ts`; all of `server/tests/contracts/`; `server/contracts/openapi.json`) plus `itemHierarchy.ts`, `routes/items.ts`, `routes/projects.ts` (10+ changed code lines).
- **A scope gap, and the extra run it needed (#4).** `scripts/audit-scope/scan.mts::INCLUDE` has no `tools` entry, so the default run saw none of `tools/api-contracts/` (9 files, 414 changed lines: the generator, artifact writer, response checker and drills). Duplication-T caught it. I built a tools-only scope from a patched copy of the script kept in the scratchpad, leaving the repo script as it is, and ran four more passes (correctness, drift, duplication, file responsibility; one instance each, all files read whole). Their findings are merged below.
- **Cold:** the passes got only a scope-file path.
- **Re-traced by hand:** every Fix Now below, and the three old-code behaviors in #9–#11, against the code.
- **Plans read at Reconcile:** `m1-foundation-and-baseline.md` (Inbound deferrals, batches, handoff, amendments), `api-contract-compatibility-follow-ups.md` (CF1–CF7), and the Inbound deferrals of `m2-items-and-projects.md`. The spike's own plan was not read. No wiki-Planned passage is built by this range (M1 plan, handoff), so there are no `wiki <page> §N` pointers to check.
- **Not in this audit:** whether a test proves its case, or catalog coverage. That is the Test Reconciler's, who is running now.
- **Lens bleed:** none found. Two items crossed lanes, cross-tagged below (#5 and the `parseHierarchyShape` double run in #29).

## Fix Now

### Correctness

**#1 — A failing field drill discards the evidence for why it failed** [Correctness (tools)]
- `tools/api-contracts/fieldDrills.ts:83-84, 107-112, 125-126, 133`.
- The drill fills `report` as it goes but prints it only at line 133, after a fully successful run. Line 84 throws `optional.output` (the Vitest log) even when the compile diagnostics were the arm that failed. Lines 112 and 126 throw bare strings. `finally` restores the files and the error propagates; the report is never shown.
- Failure scenario: an `openapi-typescript` upgrade stops `contractNote` reaching `ItemWrite`. `compileConsumer(responseTypes, missingResponseConsumer)` returns `[]`, and the drill says only "Required response drift went undetected", with `report.requiredResponse.newFixtureDiagnostics: []` (the explanation) computed and dropped.
- Fix: print `report` from the `finally` (or to stderr before rethrowing), delete line 133, and put the failing stage's output and diagnostics into each thrown error.
- Wiki bucket: none (developer tooling).
- Can ride along: #24 (the nullability drill counts any failed run as a detection), #25 (the drill's file list and double compiles), #26 (an interrupted drill leaves its edits).

**#2 — A corpus case title is wrong about the code** [Correctness (S1t)]
- `server/tests/contracts/compatibilityCases.ts:126`, snapshot `__snapshots__/apiCompatibility.test.ts.snap:1575-1592`.
- `'item done anchor refused by scope before missing position'`. `positionScopeFor` (`itemPositionScope.ts:81-87`) puts every Free item in the workflow's workphases into a Free item's scope, terminal phases included. So the done anchor passes the scope check and is refused at `anchorRefusal`'s last step as `'no-position'` (`positionResolver.ts:120`). The snapshot holds that message, not the outside-scope one.
- Failure scenario: a reader takes the corpus to pin "scope refusal wins over missing position". Nothing does. Swapping those two checks in `anchorRefusal` passes this case unchanged.
- Fix: rename it (e.g. `'item done anchor in scope refused for missing position'`) and update the snapshot key, leaving the payload untouched. A key rename is an isolated metadata change under the M1 plan. If precedence was the intent, anchor on a done item in another workflow instead. That needs the PO and Reconciler, since no case pins the precedence.
- Wiki bucket: row-references and positioning §2 name anchor refusals, not their order. The behavior isn't changing, only the title. Can ride along with #8, which is in the same file.

**#3 — `discoverRoutes` says unknown layouts fail explicitly; an unmounted-path sub-app is skipped silently** [Correctness (S1t)]
- `server/tests/contracts/routeDiscovery.ts:1-2, 18-22`.
- Express wraps `app.use(subApp)` in a `mounted_app` layer (`express/lib/application.js:230`) whose handle has no `stack`. The `else if (layer.handle?.stack)` branch skips it, with no error.
- Failure scenario: a sub-app's operations never reach `business`. `assertRouteCoverage` passes, they have no contract and no pending entry, and the `toHaveLength(54)` stays green.
- Fix: throw in `discoverRoutes` on a layer whose `handle.name === 'mounted_app'` (or in `applicationRoutes` on an Express app passed to `app.use`), which makes the header true. Rewording the header to say what it doesn't cover also works.
- Wiki bucket: none (test tooling).

### Structural

**#4 — `audit-scope` and `check-docs` keep separate lists of the repo's code folders, and they no longer match** [Duplication (T) + Drift (tools)]
- `scripts/check-docs/files.mts:14-25` (`DEFAULT_SCOPE`, which gained `tools/api-contracts` at line 20) vs `scripts/audit-scope/scan.mts:16-30` (`INCLUDE`, which has no `tools` entry). Also `AGENTS.md` "Repo Layout" has no `tools/` line (drift, tools pass), which can ride along.
- Effect: `INCLUDE` is the git pathspec for the range diff, so nothing under `tools/` reaches any scope file, and the uncommitted-changes warning (`main.mts:47`) misses it too. This audit would have skipped the code that writes `openapi.json` and `generated.ts`, and every later audit will unless this is fixed. The worked-around run above covers this range only.
- Fix: add `'tools'` to `INCLUDE` (the `T` group's empty pattern already catches it, so the config needs no change). To stop the next new folder repeating this, build both lists from one exported list, or add a scripts test that every non-docs `DEFAULT_SCOPE` entry sits under some `INCLUDE` entry. Add a `tools/` line to the `AGENTS.md` repo-layout tree.
- Tier reason: a shared list written twice whose copies already differ, with a live effect.

**#5 — The reindex envelope is defined twice on the client, built three different ways, and its comments are false** [Duplication (client-src + T) + Drift (C2)]
- `client/src/api/shared.ts:1-5, 9-22` (hand-written `ReindexedPosition`, `PositionedWriteResponse`); `client/src/api/transportTypes.ts:11, 20`; `client/src/api/generated.ts:79-82`; `client/src/lib/positionedWrite.ts:4, 11-18`; callers `App.tsx:81, 104, 132`, `itemWriteReconciliation.ts:92-95`.
- `ItemWriteResponse` is `UiItem & Pick<ItemWrite,'reindexed'>`; `ProjectWriteResponse` is the bare generated `ProjectWrite`; neither uses `PositionedWriteResponse`. Its only users are `applyWriteResponse`'s parameter and its test. So the header (`shared.ts:4-5`) and the comment at `shared.ts:19-21` ("anything that hands a write's response on is typed with this") are wrong about the code.
- Failure scenario: the server renames or nests `reindexed` and the contract is regenerated. For items, the `Pick` stops compiling. For projects, `ProjectWrite` just lacks the optional key, and `applyWriteResponse(prev, updated)` at `App.tsx:81/104/132` still type-checks against the hand-spelled `reindexed?`. At runtime `response.reindexed` is undefined, so the sidebar folds in the written project and silently drops every renumbered sibling, with no error until a reload. This is the hazard `shared.ts:19-21` warns about, and the A6 audit consolidated these types to remove it.
- Fix: make `ReindexedPosition` an alias of `components['schemas']['ReindexedPosition']`; define `PositionedWriteResponse<Row>` once from the generated declarations with a `Pick` on `reindexed` (so a key change is a build error); build `ItemWriteResponse` and `ProjectWriteResponse` from it. This also makes the header and comment true.
- Wiki bucket: positioning §7 (the reindex disclosure) is in force; the code doesn't break it today, so it's structural.

### Drift (comments wrong about the code)

**#6 — A comment about project write responses now sits above the wrong function** [Drift (C2)]
- `client/src/api/projects.ts:6-7`. It described `ProjectWriteResponse`, which moved to `transportTypes.ts`, and now floats above `fetchProjectDepthCap`.
- Fix: delete it (`transportTypes.ts` carries the type), or move it above `createProject`.

**#7 — `schemas/common.ts` header promises numeric flags the file doesn't hold** [Drift (S1)]
- `server/src/schemas/common.ts:1-2` says the definitions include "numeric flags and the error envelope". There is an error envelope and no numeric flag; `isAttached` is defined in `schemas/items.ts`.
- Fix: reword to what's in the file (ids, timestamps, position scope and side enums, the reindexed pair, the error envelope, the id params, the forbidden-position guard, the schema message helper).

**#8 — `compatibilityCases.ts` header names "candidate validators" that no longer exist** [Drift (S1t)]
- `server/tests/contracts/compatibilityCases.ts:1`. The comparison spike's candidate libraries were retired. The corpus's consumers are `apiCompatibility.test.ts` (snapshots) and `apiContracts.test.ts` (checks against the production contract).
- Fix: "shared by route characterization (`apiCompatibility.test.ts`) and contract validation (`apiContracts.test.ts`)". Can ride along with #2.

## Routed to a story's plan

These three are existing behavior the migration froze and the wiki says nothing about, so they need a PO ruling before a fix lands, and M1 forbids changing them. The plan edits are for close-out. Until the destination names each one, each stays open.

**#9 — `POST /items` reads `isAttached` by truthiness; PUT and PATCH refuse a non-boolean** [Correctness (S1)]
- `server/src/routes/items.ts:100, 150`; `server/src/lib/itemHierarchy.ts:230-231` (`!parent && req.isAttached`, `Boolean(req.isAttached)`).
- Failure scenario: `POST /items {title, parentId: P, isAttached: "false"}` stores an attached child (`is_attached = 1`); `isAttached: null` with a parent stores a detached child. MCP `create_item` passes `is_attached` through unchanged. The same value to PUT or PATCH gets 400 "isAttached must be a boolean".
- Wiki bucket: item-attachment §14 says a create takes its flag under the move rules, but the wiki doesn't state non-boolean handling on create (searched the wiki: no match). Needs a PO ruling.
- Route to: M2 Batch 1 (captures create behavior deliberately) and the follow-ups queue as a new CF row.

**#10 — `PUT /items/:id` writes the old title into the notification when one request renames and moves** [Correctness (S1)]
- `server/src/routes/items.ts:276-279`; `server/src/lib/itemHierarchy.ts:458-469`. Re-traced: the route updates `title` inside the transaction, then calls `applyHierarchyRequest(tx, item, …)` with the `item` row read before the update; the message uses `item.title`.
- Failure scenario: MCP `update_item {title: "New", is_attached: true}` on a detached child whose parent sits in a `triggersNotification` workphase stores `"Old" moved to "Review"`.
- Wiki bucket: silent on notification text. Needs a PO ruling.
- Route to: M2 Batch 1 capture and the follow-ups queue.

**#11 — A deliberate move to no workphase is logged as `to "unknown"`** [Correctness (S1)]
- `server/src/lib/itemHierarchy.ts:454`. `newWorkphase?.name || 'unknown'` can't tell an intended `null` (filed into Unsorted) from a workphase row that doesn't resolve; the "from" side uses `'none'`. Re-traced.
- Failure scenario: `PATCH /items/:id/move {workphaseId: null}` logs `Moved from "Todo" to "unknown"`. ATT-9.11's snapshot (`apiCompatibility.test.ts.snap:351`) freezes this string, so the fix goes through the post-migration queue.
- Wiki bucket: silent. Needs a PO ruling.
- Route to: the follow-ups queue.

**#12 — The 400 mapping for a malformed field is written twice in the new staged parsers, and the copies differ** [Duplication (server)]
- `server/src/schemas/items.ts:43-52` (`parseHierarchyShape`) and `server/src/schemas/projects.ts:23-35` (`parseProjectMove`); older hand-written copies at `routes/workflows.ts:140-148` and `routes/projects.ts:41-44`.
- Both apply one rule (a body `position` is refused first; otherwise the first failing field gives `<field> must be a string or null`). They differ on a failure no listed field matches: items rethrows the `ZodError` (a 500 through the global handler), projects returns a joined 400. Re-traced: every field each schema can fail on is listed today, so the paths agree on all reachable input; the next field added to one schema and not its loop splits them by file.
- Tier reason: not Fix Now. The copies don't differ on any reachable input, so the code isn't harder to change correctly yet. M2 writes the next copies (item and project POST/PUT) and M3 the third (`POST /workflows`), so doing it now would be doing it twice.
- Fix (in M2): add `forbiddenPositionError(input, message)` and `firstFieldError(error, fields, messageFor)` to `schemas/common.ts`, with one fallthrough chosen deliberately. Cost about 15 lines across three files; `parseParity.test.ts` and the corpus cover it. The fallthrough choice is the Architect's ruling.
- Route to: M2 Batch 1 Inbound deferrals.

## Watch List

Optional findings; they last only as long as this audit. Ride-alongs name the Fix Now file they share.

- **#13 — A path-parameter constant named `itemId` serves the project operation too** [Drift (S1)] — `server/src/schemas/openapi.ts:66, 75, 88`. Rename to something neutral (e.g. `idPathParameter`). Cheap in M2 when this file is next edited.
- **#14 — `schemas/openapi.ts` (232 lines) holds the schema catalog, the endpoint table and the generator** [File Responsibility (server)] — lines 25-47, 66-120, 122-232. Fine today; the data half grows with each of ~50 pending operations. Split at the start of M2 or past ~350 lines: a data module (per resource) plus a stable `createContractDocument` module.
- **#15 — `compatibilityCases.ts` (326 lines) and its 2701-line snapshot are one corpus for three resources** [File Responsibility (server)] — split per resource when M2 adds cases. `apiContracts.test.ts:102` hardcodes `expect(scope.size).toBe(4)` and `routeDiscovery.test.ts:49` hardcodes `toHaveLength(54)`; both need hand edits as routes land (possibly an intended tripwire). Can ride along with #2 and #8.
- **#16 — `apiContracts.test.ts` covers two modules** [File Responsibility (server)] — the HTTP contract (42-160) and `lib/mcpItemTools.ts` (162-205), sharing `assertResponse`. Move the MCP describe to `mcpItemTools.test.ts` when the next MCP tool is added.
- **#17 — `routes/items.ts` (365 lines) and `routes/projects.ts` (281 lines) hold domain logic that belongs in `lib/`** [File Responsibility (server) + Duplication (server)] — old code, 14 and 10 changed lines in range. `POST /` (items.ts:99-226, about 125 lines) keeps the persistence half of a create, including its own copy of the active/done split (171-189 vs `itemHierarchy.ts:304-312, 380-408`); `projects.ts:27-78` holds project position helpers its own comment calls the counterpart of `positionScopeFor`. Both agree with their originals and have one caller. M2 reopens exactly these handlers; do it there (`resolveCreatePlacement` beside `resolveCreate`, `lib/projectPosition.ts`).
- **#18 — `parseRequest` returns `undefined` both for "400 already sent" and as a parsed value** [Correctness (S1)] — `server/src/lib/parseRequest.ts:8-13`; callers do `if (!x) return;`. A schema whose successful output is falsy would hang the request. Impossible with today's object schemas; M2–M4 apply it to ~45 more. Restrict the schema type or return `{ ok, data }`.
- **#19 — The compatibility harness discards the cause of any logged failure** [Correctness (S1t)] — `compatibilityHarness.ts:162, 171, 182`. `console.error` is mocked to a no-op and only a boolean is kept, so a refactor that makes a route throw fails with "expected 500 to be 200" and no cause. Put `response.body` and the logged errors into the status assertion's message (no snapshot churn).
- **#20 — The `foreign-item` fixture variant also gives an attached child a workphase other than its parent's** [Correctness (S1t)] — `compatibilityHarness.ts:149`, snapshot `:1018-1036`. `setItemWorkphase` moves only the parent; `fixtures.ts:195-197` lists that state as one no write produces. If M2+ changes how such a child is read, the corpus reports a diff for an impossible state.
- **#21 — `documentValidator` accepts everything for an unknown schema name** [Correctness (tools)] — `tools/api-contracts/document.ts:27`. `{...undefined, components}` is an unconstrained schema. If `ItemMove` is renamed in M2, `apiContracts.test.ts:156` and `conversionEdges.test.ts:59` pass vacuously. Throw on `!Object.hasOwn(document.components.schemas, name)`; `responses.ts:50`'s guard then becomes redundant.
- **#22 — The empty-body check fails a valid response when the caller omits `text`** [Correctness (tools)] — `tools/api-contracts/responses.ts:15, 42-45`, callers `apiContracts.test.ts:82, 125`. `observed.text !== ''` is true for `undefined`. No registered operation has a bodyless response yet; the first 204 would fail. Make `text` required or throw a distinct error.
- **#23 — `itemHierarchy.ts:242-244`'s validation-order comment leaves out a step** [Correctness (S1) note] — "shape → parent legality → …" omits the workphase-existence check at lines 248-250. The sequence it states is still right, so this isn't a wrong comment; add the step when the file is next edited.
- **#24 — The nullability drill counts any failed test run as a detection** [Correctness (tools)] — `fieldDrills.ts:117-126`. A renamed test file (Vitest "No test files found"), a lock failure on the shared test DB, or a killed child (`status === null`) all count as drift detected, and the type checks never require a clean baseline. Add `!/expected 400 to be 200/.test(nonNull.output)` and require the old diagnostics empty. Can ride along with #1.
- **#25 — `fieldDrills.ts` repeats itself** [Duplication (tools)] — it keeps its own list of files generation writes (11-16, `saved[0]/saved[1]`) from `artifacts.ts:14-25`, so a third generated output would not be restored by the `finally` and the header claim would become false; and it compiles each drill's diagnostics twice (80/83, 103/110, 121/125). Export the artifact targets and store each result in a `const`. Can ride along with #1.
- **#26 — An interrupted drill leaves its edits in the working tree** [Correctness (T) + Correctness (tools)] — `fieldDrills.ts:58-132`. Ctrl+C or a kill during one of the blocking `spawnSync` calls (up to 180 s each) skips `finally`, leaving `schemas/items.ts` edited, the artifacts regenerated, and `.field-drill.test.ts` in place. In drill 1 the leftover `clientNote` field would pass `npm run check` and be accepted by the real endpoint. The README's clean-tree/inspect-the-diff step catches it. A failed `writeFile` at line 128 also skips the remaining restores and the `unlink`. Restore each file in its own `try`; signal handlers are optional. Can ride along with #1.
- **#27 — Server test and handler duplication that M2–M4 will copy** [Duplication (server)] — each is a copy that still agrees: the id lookup and staged-parser 400 block in each migrated handler (`items.ts:53-56, 306-315`, `projects.ts:210-219`); `assertContractRegistration` re-implements `assertRouteCoverage` (`apiContracts.test.ts:30-40` vs `routeDiscovery.ts:30-41`); `scopeOf` hard-codes `items|projects` (`apiContracts.test.ts:26-28, 50`); the corpus runs twice, the second run re-implementing `setup.ts` (`apiContracts.test.ts:61-85`); two identical loops in `parseParity.test.ts:29-48`; near-identical `itemMove`/`projectMove` builders (`compatibilityCases.ts:42-70`); the MCP text-result shape and `'The item ID'` description now split between `mcpItemTools.ts` and `mcp.ts`; the "names a row" check written three ways (`namesARow`, `isNamed`, inline). One caution: `scopeOf` deliberately works out the expected registrations without reading the document it checks (a duplication pass from the tools run reached the same ruling), so don't share it by matching through the document.
- **#28 — The client rebuilds item shapes `types.ts` already defines, and the copies differ** [Duplication (client-src)] — `transportTypes.ts:7-14` (`UiItem`, `ItemDetailResponse`) vs `types.ts:48-72, 162-174`; `ItemDetailResponse` has `workflowId?`, `ItemDetail` doesn't, and `ItemDetailPanel.tsx:126` stores one in the other's state. The `types.ts` header's hand-sync ruling still holds for `Item` but not for `ItemDetail`/`ActivityLogEntry`, whose only producer is migrated. Alias them. Separately, each fetcher names its response schema by hand (`items.ts:8, 53`) where the generated `operations` already maps operation to 200 body; an `OkBody<Op>` helper settles it before the next routes migrate.

## Covered by

Nothing under this tier. The correctness pass left out CF1–CF7 and the ruling at `itemHierarchy.ts:295-296` as already recorded.

## Informational

- **#29 — `parseHierarchyShape` runs twice on `PATCH /items/:id/move`** (`schemas/items.ts:69` via `parseItemMove`, again at `itemHierarchy.ts:246`). The second run is the only shape check `PUT /items/:id` has, so it stays until M2 gives PUT a parser. Decide the owning layer then.
- **#30 — The generated request types accept bodies the server refuses** (`client/src/api/generated.ts:86-137, 220-228`). `{ "not": {} }` becomes `unknown`, so `ItemMove` accepts `{ position: 3 }` and `{ anchorId: 'x' }`. Nothing sends these (requests use the hand aliases in `transportTypes.ts`), and the spike results already record it. It matters if a later stage types a request straight from `components['schemas']`. A `transform` hook mapping `{ "not": {} }` to `never` in `tools/api-contracts/artifacts.ts::generateTypes` would encode the refusals.
- **#31 — Old-code 500s on non-string input** (`routes/items.ts:100, 237, 339-340`): a non-string comment `content`, and object `title`/`parentId`/`workphaseId` reaching better-sqlite3. The global handler logs each. Add to CF2's evidence and M2 Batch 1's capture of the create and comment routes.
- **#32 — `urlPart` doesn't stop `.` and `..`** (`lib/urlPart.ts:9-11`): `get_workflow {workflow_id: "."}` sends `GET /api/workflows/` and returns every workflow. No harmful write found. Changing tool behavior is CF5.
- **#33 — `validateHierarchyRequest` can throw** (`schemas/items.ts:51`, reached from `itemHierarchy.ts:246`) though it advertises a message or null. Both callers build the object themselves, so it can't happen today.
- **#34 — Smaller structure, considered and left:** `itemHierarchy.ts` (493 lines) is cohesive (revisit `applyHierarchyRequest`'s done/notification split if the Quick Items rework reopens it); `schemas/items.ts` and `projects.ts` mix request parsing with response shapes (split past ~200 lines); `compatibilityHarness.ts` combines a fixture seed with capture machinery; `mcpItemTools.ts` is a partial extraction whose `callMcpItemTool` treats any name but `get_item` as `move_item`; `generated.ts`, `openapi.json` and `appCompiler.ts`/`document.ts` are single-concept generated or small tooling files.
- **#35 — Behaviors in old code the S1t pass read through the corpus:** reindex bumps `updatedAt` on rows whose position doesn't change (`positionResolver.ts:300-305`; TC-5.2, TREE-4.5 snapshots); item-detail activity sorts by `created_at` alone, so ties are SQLite's incidental order (`routes/items.ts:83-88`; TC-2.13 snapshot); `apiContracts.test.ts:72-82` validates the relabeled body, equivalent while `idSchema = z.string()`.
- **#36 — Server and client copies of the reindex pair and Zod row restatements** are deliberate (root `AGENTS.md`: position arithmetic uses neutral types rather than HTTP schemas; the response-conformance test catches a mismatch).

## Notes for other roles

Not findings.

- **Architect / plan owner:**
  - `docs/planning/tech-debt-stories/api-contract-framework-spike-results.md:155` names `client/src/api/items.ts::MoveItemInput` and `api/projects.ts::MoveProjectInput` as handwritten declarations; both now live in `transportTypes.ts`. The spike plans still describe `server/tests/contracts/prototypes/` (gone).
  - `m1-progress.md:3` and `m1-foundation-and-baseline.md` still say Batch 3 is uncommitted; it is `4ecd49bb`.
  - The M1 plan says "do not replicate no-op string parsing at every handler", yet three retained pilot calls do (`parseRequest(idParamsSchema, req.params, res)` at `routes/items.ts:53, 306`, `routes/projects.ts:210`). They can never fail. Decide whether M2 removes them.
  - `HierarchyRequest` is now an alias of `HierarchyInput` (`itemHierarchy.ts:44`), so the A6 per-field comments went with it. I did not verify whether the rest survive elsewhere.
- **Test Reconciler (running now):** `generationBoundary.test.ts:65-78` has no positive control showing the DB module actually fails on a directory `DB_PATH`. No corpus case has both the scope and missing-position refusals apply (#2). `apiContracts.test.ts` and `routeDiscovery.test.ts` both prove a deleted `get /api/items/{id}` registration fails; agreement between `ItemMove` and the generated document is asserted in three places (`apiContracts.test.ts:43-53`, `parseParity.test.ts:22-36`, `conversionEdges.test.ts:53-61`). Possible overlap.
- **PO:** one ruling request, for #9–#11 (the wiki says nothing; M1 preserves the behavior).

## Close-out

Filled in as the audit closes. Optional findings need no row.

| # | Finding | Disposition | Where |
|---|---|---|---|
| 1 | Drill discards failure evidence | Open | |
| 2 | Wrong case title (`compatibilityCases.ts:126`) | Open | |
| 3 | `discoverRoutes` skips unmounted-path sub-apps | Open | |
| 4 | `audit-scope` `INCLUDE` omits `tools/` | Open | |
| 5 | Reindex envelope defined twice, comments false | Open | |
| 6 | Floating comment in `projects.ts` | Open | |
| 7 | `common.ts` header | Open | |
| 8 | `compatibilityCases.ts` header | Open | |
| 9 | `POST /items` `isAttached` by truthiness | Deferred by Nathan (fix after the migration; the suite must prove no regressions) | `m1-catalog-open-questions.md` OQ1 |
| 10 | Stale title in the notification | Deferred by Nathan, as #9 | `m1-catalog-open-questions.md` OQ2 |
| 11 | `to "unknown"` on a move to no workphase | Deferred by Nathan, as #9 | `m1-catalog-open-questions.md` OQ3 |
| 12 | Parser 400 mapping written twice | Routed (fallthrough ruled: rethrow) | `m2-items-and-projects.md` Inbound deferrals |

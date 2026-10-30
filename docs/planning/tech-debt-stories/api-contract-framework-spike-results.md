# API Contract Framework — Spike Results

**Written:** 2026-10-30 by the Architect · **Story:** `api-contract-framework-spike.md` · **Status:** Batch 1 complete; candidates not yet compared

This is the evidence record for the comparison, not a product specification. Observed behavior is captured for compatibility; it is not a ruling that every observation is correct. No candidate has been selected or installed, and no production handler has been changed.

## Batch 1 — Baseline

### Revision and environment

- **Branch:** `api-contract-framework-spike`.
- **Baseline HEAD:** `c1aa1de964235388ea3752a346b071c7b3433821`.
- **Initial working changes:** the new spike plan and the deferral notice in `api-contract-zod-openapi.md`; no application code or existing tests were modified.
- **Environment:** Windows, Node `v24.11.1`, npm `11.6.2`. Commands below run from the repository root. `npm.cmd` is used because this machine's PowerShell execution policy blocks `npm.ps1`; the npm scripts themselves are unchanged.
- **Isolation:** Vitest's existing configuration uses `server/data/vitest-test.db`, one worker, and `server/tests/setup.ts` calls `resetTestDb` before each case. Playwright uses its existing separate stack, client 5174 to server 3002 on `server/data/test.db`. No development database is used by the corpus.

| Check before adding the corpus | Result |
|---|---|
| `npm.cmd run check` | Passed: type checks, documentation checks, lint, formatting, 432 server tests in 23 files, 604 client tests in 34 files, and tooling tests |
| `npm.cmd run test:e2e` | Passed: 219 passed, 18 skipped, 237 discovered; approximately 3.8 minutes for the successful run |

The first sandboxed Playwright invocation failed before running tests: the backend's `tsx` process could not call Windows user-info lookup (`uv_os_get_passwd`, `ENOMEM`). The unchanged command succeeded when authorized to run outside the sandbox. This is an execution-environment failure, not an endpoint or test failure. The existing HTML report is under `tests/output/report/`; `tests/output/artifacts/.last-run.json` reports `passed` with no failed tests. Expected refusal/error scenarios can emit server/client console errors during a green run.

The 18 skipped tests remain skipped. The baseline does not claim that all 237 discovered tests executed.

### Endpoint inventory and failure order

#### PATCH /api/items/:id/move

Enforcement sites: `server/src/routes/items.ts`, then `server/src/lib/itemHierarchy.ts::validateHierarchyRequest`, followed by `applyHierarchyRequest` inside a transaction. Shared anchor checks and math remain in `positionResolver.ts`; legal-parent checks remain in `itemTree.ts`.

Order observed in the code and exercised by the corpus:

1. Look up the target item; missing target returns `404 { error: 'Item not found' }` before handler-level body checks.
2. Refuse any defined `position`, including `null`, with the existing anchor/side guidance.
3. Require intent: at least one defined `workphaseId`, `anchorId`, `parentId`, or `isAttached`, or a nonempty `scopeWorkphaseIds` array. A side alone is not intent. Unknown fields do not supply intent.
4. Check the shapes of `parentId`, `isAttached`, and `workphaseId`, in that order. Check that a defined anchor has a `before` or `after` side.
5. Check workphase existence, then parent legality, then resulting attachment/workphase/cross-workflow rules.
6. Check the anchor against the resulting position scope: self, existence, scope, then usable position.
7. Apply the mutation and its cascades, activity, notifications, and any reindex in the existing transaction.

Compatibility details:

- `parentId` and `workphaseId` permit explicit `null`; `isAttached` must be a boolean when supplied. Omitting them has different semantics from clearing them.
- `side` is checked only when `anchorId` is defined. An invalid side accompanying a valid workphase-only request is ignored.
- The anchor has no dedicated string-type guard today. Numeric/null values can reach row lookup, and an object can reach a binding exception and the global 500 handler. A schema must not silently turn those outcomes into a new 400 contract.
- A nonempty legacy scope array supplies intent without element validation: `[null]` is accepted. An empty array or a non-array alone does not. With explicit intent, an otherwise invalid legacy scope value is ignored. The array never narrows position scope.
- Other unknown fields are ignored. An empty JSON array reaches the handler and has no intent; a missing body reaches a destructuring exception. Invalid JSON and the JSON primitive `null` fail in the existing body-parser/error pipeline.
- Workphase-only moves, hierarchy changes, active/done transitions, and legacy append intent have different positioning effects. The captures keep the exact numbers, completion times, and side effects.

Success response: stored item fields plus required runtime `positionScope`, and `reindexed: {id, position}[]` when a reindex occurs. It is not the decorated detail response: `children`, `activity`, derived `workflowId`, and `depth` are not added by this handler.

#### PATCH /api/projects/:id/move

Enforcement site: `server/src/routes/projects.ts`, with shared parent and anchor helpers. The project keeps its existing `prevId`/`nextId` contract.

1. Look up the target project; missing target returns `404 { error: 'Project not found' }`.
2. Refuse any defined final `position`, including `null`.
3. Type-check `prevId`, then `nextId`: omitted/null or a string.
4. Resolve and validate the resulting parent, including the `parentId` shape.
5. Select a named string `prevId` in preference to a named string `nextId`. Validate only that selected neighbor's existence and scope, and then its position.
6. Resolve position and update the project in one transaction; disclose reindex pairs if needed.

The distinction between shape and entity validation is important: a valid `prevId` with `nextId: 'missing'` or `nextId: ''` succeeds, while the same valid `prevId` with `nextId: 42` returns `400 'nextId must be a string or null'`. A bad selected `prevId` does not fall back to a valid `nextId`.

An empty object, an array body, or unknown fields alone append the project. Omitted/null neighbor fields append; an explicit null parent makes the project top-level. A missing body reaches the global 500 handler. Unknown item-style fields do not unify the two move contracts.

Success response: stored project fields, plus optional reindex pairs. It does not include the project's nested workflow collection.

#### GET /api/items/:id

- Target lookup accepts an arbitrary path string; it does not require UUID syntax. A missing target returns the existing 404.
- Adds `positionScope`, derived `workflowId`, zero-based `depth`, direct `children`, and `activity` to the item row. Children carry their own `positionScope` and `depth`.
- `workflowId` derives from the stored workphase; an item filed in a foreign workflow can report that workflow ID while its position scope is `none`.
- Children have no explicit SQL ordering in this handler. Activity is queried in `createdAt` order. The captures preserve response-array order rather than sorting it for convenience.
- Attached, active Free, done, unsorted, and foreign-workflow reads are separate captured variants. Reads must not mutate stored state.

#### GET /api/workflows

- No structural query validator. Reads optional `projectId`; a truthy parsed value is filtered using `String(projectId)`, while an empty value means no filter.
- An unknown project produces an empty list rather than a reference-validation error.
- Repeated `projectId` keys become an array and stringify to a comma-joined value; the corpus receives an empty list for the two distinct projects used.
- With Express's current query parsing, `projectId[x]` is a literal unknown key and does not filter. Other unknown query keys are ignored too.
- Returns plain workflow rows in current query order, without workphases or items. The client API currently calls the unfiltered form.

### Shared corpus and reproducibility

| Route | Examples |
|---|---:|
| Item move, including missing target and body-parser cases | 42 |
| Project move, including missing target and missing body | 22 |
| Item detail variants and missing target | 6 |
| Workflow collection/query variants | 7 |
| **Total** | **77** |

Expected statuses: **36 successes (200), 33 refusals (400), 3 missing targets (404), and 5 existing global-error responses (500)**. The 500 observations are successes of the characterization test, not new failures introduced by this work.

Artifacts:

- `server/tests/contracts/compatibilityCases.ts`: library-independent transport examples, fixture references, expected statuses, and special fixture variants. Tests that cover cataloged behavior carry existing qualified case IDs; uncataloged transport observations do not invent new IDs.
- `server/tests/contracts/compatibilityHarness.ts`: setup using the checked server fixture helpers, capture against an injected Express application, full application-table state comparison, and compact database deltas.
- `server/tests/contracts/apiCompatibility.test.ts`: current handlers exercised against the shared examples, with exact baseline response/delta snapshots.
- `server/tests/contracts/__snapshots__/apiCompatibility.test.ts.snap`: 77 baseline captures; reviewable request, response, status, logged-error flag, and database changes. These are observations, not a second authored schema.

The existing server reset hook and `server/tests/fixtures.ts` are the reset/seed helpers for this in-process suite. No new Playwright setup or specs are introduced. Normal fixtures are created through the API; existing position/workphase pinning helpers prepare reindex, missing-position, and foreign-workflow states.

Each case starts from six projects, two workflows, four workphases, and ten items, including attached/detached children and done/unsorted/foreign items. The harness:

- fixes setup time at `1800000000000` and request time at `1800000060000` by spying on `Date.now`, without replacing timers;
- assigns stable symbolic labels to the 22 named fixture IDs and other generated row IDs, including IDs inside activity metadata;
- preserves all positions, attachment flags, completion times, payload fields, array order, and actual timestamp changes;
- captures all application tables before and after the request, excluding internal migration/SQLite tables;
- asserts full before/after equality for every refusal, global-error response, and GET; successful writes record added/removed rows and changed field values;
- preserves the error payload and whether the global handler logged an error, without comparing environment-dependent stack traces.

Commands:

```powershell
# Replay captures; no snapshot update during candidate comparisons.
npm.cmd --prefix server run test -- tests/contracts/apiCompatibility.test.ts

# Full gate, including the new corpus and all unchanged existing unit tests.
npm.cmd run check

# Existing Playwright baseline (unchanged specs, helpers, page objects and config).
npm.cmd run test:e2e
```

The initial capture used Vitest's explicit `--update` switch. A subsequent replay without it passed with fresh IDs, demonstrating reproducibility. A second explicit update only renamed snapshot keys to include the applicable existing test-plan IDs; it did not change the observed behavior. Candidate implementations must replay against these captures, not regenerate them to match their output.

The corpus is intentionally finite. It samples the high-risk validation and response boundaries and supplements the existing business-rule tests. It does not claim exhaustive equivalence, test every hierarchy depth, or exercise the MCP process or Bruno runner yet.

Verification after adding the corpus:

| Check | Result |
|---|---|
| Focused capture and replay | All 77 cases passed; replay without snapshot updates passed with newly seeded IDs |
| `npm.cmd run check` | Passed: 509 server tests in 24 files (432 existing plus 77 new), 604 client tests in 34 files, 235 tooling tests, type checks, lint, formatting, and documentation checks |
| `npm.cmd run check:docs` after the results write-up | Passed: 389 files checked, zero findings |
| `git diff --check` | Passed |
| Application/existing-test diff | No tracked changes under `server/src`, `client`, or `tests`, or to package manifests/lockfiles. The added tests are confined to `server/tests/contracts/`. |

The full gate's local log is `logs/api-contract-batch1-check.log` (ignored output, not a committed artifact). The successful unchanged Playwright baseline above remains the E2E evidence for Batch 1: no application or E2E code changed. Batch 1 is complete; prototype work has not started.

### Consumers and independent maintenance inventory

| Surface | Existing source and responsibility |
|---|---|
| Stored item/project/workflow rows | `server/src/db/schema.ts`: Drizzle definitions and inferred row types; storage fields legitimately differ from decorated responses |
| Item move runtime checks | `routes/items.ts` and `itemHierarchy.ts::validateHierarchyRequest`: intent, shapes, failure order, and domain rules |
| Item move server types | `itemHierarchy.ts::HierarchyRequest` and `positionResolver.ts::Side`: manually declared typed inputs, not runtime parsing |
| Project move runtime checks and internal types | `routes/projects.ts`: shape checks, inline neighbor type, parent/anchor checks, and response construction |
| Client item/project input types | `client/src/api/items.ts::MoveItemInput` and `api/projects.ts::MoveProjectInput`: independent handwritten declarations |
| Client responses | `client/src/types.ts`: `Item`, `ItemDetail`, `Project`, `Workflow`, and `PositionScope`; `api/shared.ts` adds handwritten reindex/write wrappers |
| Client calls | `api/items.ts::fetchItem` and `moveItem`, `api/projects.ts::moveProject`, `api/workflows.ts::fetchWorkflows`; fetch generics describe responses without validating them |
| UI consumers | `App.tsx` loads workflows and handles project moves; `ItemDetailPanel.tsx` reads item detail; `workflow/dragRequest.ts::toRequest` constructs item moves and `sendItemMove` handles completion/resync |
| MCP declarations and adapters | `server/src/mcp.ts`: separately handwritten advertised JSON schemas and switch handlers; snake_case IDs map to REST path/query/body fields |
| Bruno scenarios | `bruno/items/move-item.bru`, `items/get-item.bru`, `projects/move-project.bru`, `workflows/list-workflows.bru`: independent templated requests; move docs repeat shape and behavior information |
| Behavioral authority | wiki positioning, item-positioning, item-attachment, project-tree, and row-references: intended rules and outcomes, not generated implementation reference |
| Tests | Existing server/API/UI tests plus the new observed corpus: independent behavioral expectations, examples and response checks, not interchangeable schema copies |

For the selected contracts, there are currently **no generated API request schemas, response schemas, OpenAPI reference, or client transport types**. The new snapshots are generated observations only. Example payloads and prose are counted separately from independent type/constraint declarations; shared references are not counted as new definitions.

Representative field inventory for the comparison's recurring-edit exercise:

| Field | Independently authored shape/constraint sites today | Other maintenance or legitimate differences |
|---|---|---|
| Item move `workphaseId` | Server `HierarchyRequest`; runtime shape/null checks; client `MoveItemInput`; MCP advertised `workphase_id` schema | Four sites across REST and MCP, whose contracts differ: REST optional/nullable; current client input optional/string; MCP advertises required/string. MCP handler also maps the name, and Bruno supplies a templated example. Do not force identical requiredness. |
| Item move `side` | Server `Side` union; runtime conditional allowed-value check; client literal union | Three independent allowed-value definitions. Bruno prose repeats the enum and its example supplies a value. Current MCP exposes no side. |
| Project move `prevId`/`nextId` | Route-local neighbor type; route runtime type guards; client `MoveProjectInput` | Three authored shape sites per field. Selection precedence is behavior, not an enum to generate; Bruno prose and a two-neighbor example also need review. |
| Response `positionScope` | Server `PositionScope` union; client `PositionScope` union | Two enum definitions. Server decoration returns it; client `Item` marks it optional. Snapshot and behavioral tests verify actual output separately. |
| Detail response `workflowId` | Route constructs the field; no corresponding field on client `ItemDetail` | Generated response typing must represent the full wire response; it need not change the UI's behavior or make every consumer use the field. |

These counts are a scoped baseline, not a count of every occurrence in the repository. They distinguish storage/domain types from transport definitions and acknowledge curated MCP/client subsets. Batch 2 must report which independent declarations disappear and which adaptations remain necessary.

MCP-specific boundaries for the pilot:

- `get_item` advertises required `item_id`, calls the detail endpoint, and returns the JSON as text.
- `move_item` advertises required `item_id` and `workphase_id`; it sends only `{ workphaseId }`, discards the REST response body, and returns a human-readable confirmation. No move-project tool exists.
- `list_workflows` separately advertises optional `project_id` and maps it into the query string.
- Tool advertisements are handwritten; the low-level call switch does not parse arguments with those advertised schemas. Adding strict validation can therefore change current behavior and must be measured, not assumed compatible.
- `create_item` also resolves a type name or ID through item-type lookup. It is outside the selected pilot, but confirms why a generic case-conversion function alone cannot replace every adapter.

Bruno remains authored. The item-move request is a useful later contract-check candidate because it already has `{{baseUrl}}`, `{{itemId}}`, `{{workphaseId}}`, and `{{anchorId}}` variables. No import/regeneration or request editing was done in Batch 1.

### Observations and follow-up destinations

| Observation | Disposition |
|---|---|
| Project neighbor precedence applies after both fields' type checks; the Bruno docs say the unused next field is not checked | Preserve the observed behavior. Record a clarification request for the Bruno/code owner with the final spike handoff; do not change the request or prose during baseline capture. Move-shape redesign remains in `positioning-on-create-and-edit.md`. |
| Object item anchor, absent request bodies, malformed JSON and JSON null can produce generic 500 responses | Preserve in the compatibility corpus. If Nathan wants correctness changes, route them to a separately scoped validation/error-handling follow-up after the refactor baseline is proven. Batch 2 records the cost of preserving the existing pipeline. |
| Legacy scope arrays and repeated/unknown query keys are permissive | Preserve. Any tightening requires a later behavior decision; it is not a library-selection side effect. |
| Client transport types are narrower or incomplete relative to observed wire data | Use full wire shapes in the pilot's generated-type experiment and measure any adaptation. No manual type cleanup in Batch 1. Report any migration blocker in this results record for the broader epic's replan. |
| MCP advertisements do not themselves enforce the runtime contract | Batch 2/3 must distinguish schema reuse from new runtime restrictions. Additional tool capabilities remain outside scope. |
| The error-handling guide's worked example says the global middleware is absent, while `server/src/index.ts` contains it | Incidental documentation drift, deferred to the Architect's final spike handoff for a separate guide correction. No guide edit or behavior change here. |

No observation is treated as a confirmed product defect merely because it differs from a stricter library convention. The Architect keeps these items in the final review packet for Nathan and the deferred role input.

## Batch 2 — Comparison

Not started. Library versions, integration-library shortlist, three runnable prototypes, field-change measurements, contract-generation limitations, and the provisional recommendation belong here when measured.

## Batch 3 — Integrated pilot

Not started. Four-endpoint integration, consumer demonstrations, deliberate drift failures, and unchanged-suite verification belong here after the comparison.

## Batch 4 — Final recommendation

Not started. No stack selection or API-wide migration is authorized by the baseline results.

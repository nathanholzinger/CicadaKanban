# API Contract Framework — Spike Results

**Written:** 2026-10-30 by the Architect · **Story:** `api-contract-framework-spike.md` · **Status:** Batch 2 complete; integrated pilot not started

This is the evidence record for the comparison, not a product specification. Observed behavior is captured for compatibility; it is not a ruling that every observation is correct. Candidate tools are installed in an isolated test package. Native Zod conversion is provisionally recommended for the integrated pilot; no stack has been finally selected and no production handler has been changed.

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

### Revision, isolation, and reproduction

Batch 2 starts from committed Batch 1, `0565cde3c4c868877a9838610c8464bda939cfa7`. Both `api-contract-framework-spike` and the saved `api-spike-batch1-baseline` pointed there at the start. All comparison work is side by side on `api-contract-framework-spike`; no candidate branch or integration branch has been created and no commit has been made during this batch.

The comparison is under `server/tests/contracts/prototypes/`, with its own manifest, pinned lockfile, and ignored `node_modules`. Root, server, and client manifests/lockfiles are unchanged. A fresh checkout needs the nested package installed explicitly before running the server gate; that extra setup is a real cost of retaining this comparison package, not a new production dependency.

```powershell
npm.cmd ci --prefix server/tests/contracts/prototypes --ignore-scripts
npm.cmd --prefix server/tests/contracts/prototypes run generate
npm.cmd --prefix server/tests/contracts/prototypes run check:generated
npm.cmd --prefix server run test -- tests/contracts/prototypes tests/contracts/apiCompatibility.test.ts
npm.cmd run check
```

Generation does not import the application or open a database. Tests retain the existing Vitest reset/seed setup and separate database. npm registry access and the existing `tsx` launcher's Windows user-info lookup required authorized outside-sandbox commands; the test suite runs in the sandbox. No workaround, test configuration change, or development-database access was introduced.

### Versions and library shortlist

| Tool | Pinned version | Role |
|---|---|---|
| Zod | 4.6.7 | Both Zod candidates' authoritative shapes and runtime structural validation |
| zod-openapi | 6.0.2 | Library-backed document assembly |
| TypeBox (`typebox`) | 1.4.3 | JSON Schema authoring and schema composition |
| Ajv | 8.20.0 | TypeBox runtime checks; independent generated-schema checks for all candidates |
| openapi-typescript | 7.13.0 | Same client type generator for all candidates |
| Consumer TypeScript | 6.0.3 | The application's compiler, loaded explicitly for virtual consumer checks |

`openapi-typescript` 7.13.0 declares a TypeScript `^5.x` peer; npm installed 5.9.3 inside the isolated package. The generator uses that peer, while `typeChecks.ts` explicitly loads the server's TypeScript 6.0.3 to check consumers. This avoids mistaking compiler-5 success for application-compiler compatibility. All candidates share this constraint. An eventual migration must retain an isolated generator toolchain or select a generator with a compatible peer range; this spike does not override peers or downgrade the app.

`@asteasolutions/zod-to-openapi` 9.1.0 was inspected but not installed. Both integration libraries advertise Zod 4 support. `zod-openapi` was shortlisted because it uses native Zod metadata and provides input/output-aware document, component, and parameter assembly. Its current Node requirement is `>=22.14.0`, met by this machine's Node 24.11.1. Its published runtime dependencies are empty; Zod is its peer. The alternative offers an explicit registry and can also use native metadata, so the shortlist is not a claim that it requires monkey-patching for every usage.

The existing MCP SDK remains 1.29.0 and advertises a Zod peer range of `^3.25 || ^4.0`. No SDK upgrade is required by the installed Zod version's declared compatibility. High-level MCP registration and its behavior have not been migrated or runtime-proven here. TypeBox can supply JSON Schema to the existing low-level tool-list surface; reuse with the SDK's Zod-oriented high-level registration would need its own integration evidence.

Primary references consulted:

- [Zod JSON Schema conversion, registries, input/output context, and unsupported constructs](https://zod.dev/json-schema).
- [zod-openapi document assembly, parameters, components, and native metadata](https://github.com/samchungy/zod-openapi).
- [zod-to-openapi registry and generator](https://github.com/asteasolutions/zod-to-openapi).
- [TypeBox authoring and JSON Schema representation](https://github.com/sinclairzx81/typebox).
- [Ajv JSON Schema dialects](https://ajv.js.org/json-schema.html) and [data-modifying options](https://ajv.js.org/guide/modifying-data.html).
- [openapi-typescript's in-memory generation API](https://openapi-ts.dev/node).

Registry metadata and installed package declarations were checked alongside the documentation. The probes below record the installed versions' actual behavior where a broad documentation statement is insufficient.

### What was implemented and what parity establishes

| Candidate | Shape source | Runtime checks | Document path |
|---|---|---|---|
| `zod-library` | Shared `zod-shapes.ts` | Zod field and aggregate checks | `zod-openapi::createDocument` |
| `zod-native` | The same Zod definitions | The same Zod checks | Native registry conversion, with input/output exports and a small HTTP-document assembler |
| `typebox-ajv` | `typebox-ajv/index.ts` | Compiled Ajv checks; defaults, coercion, and removal of additional properties disabled | The authored JSON Schemas and the same small HTTP-document assembler |

The Zod request's intent and anchor/side conditions are represented with unions/intersections. They do not depend on a custom refinement being inferred by a generator. TypeBox expresses the same conditions with JSON Schema `anyOf`/`if`/`then`. The different encodings validate the same tested inputs; their different TypeScript results are discussed below.

The common adapter retains the application's CORS/body-parser pipeline, performs target lookup first, then staged structural checks with the existing error wording/order. It forwards accepted requests to the unchanged handlers for domain validation and writes. Both item and project move requests are actually validated by each candidate; the 13 GET cases are unchanged passthrough controls. There is no fabricated success response or alternative implementation of hierarchy/position math. Additional checks compare CORS and JSON headers for preflight and body-parser errors.

Each candidate replays all **77 cases** with exact equality of request capture, status, response, logged-error flag, and database deltas against a freshly seeded baseline. The original frozen 77 snapshots also replay unchanged. Candidate response validators and the emitted response schemas check every move response, including errors and reindex variants. Generated request acceptance is independently compared to runtime-schema acceptance across every body-bearing move example.

**Limit:** accepted requests still encounter the old handlers' checks. This proves the preflight schemas do not change the sampled behavior and that their documents agree on the tested shapes. It does not prove the old structural checks can be removed correctly, that parsed values have been threaded through typed handlers, or that a real client/MCP integration is complete. Those remain the purpose of Batch 3.

### Generated artifacts and measurable results

`generated/` contains one OpenAPI 3.1 development document and one client declaration file per candidate, plus `measurements.json`. Each document covers exactly two PATCH endpoints and nine named components, including both success rows, reindex pairs, and the error payload. No document is published as the full API reference.

| Measurement | Zod + library | Native Zod | TypeBox/Ajv |
|---|---:|---:|---:|
| Shared HTTP cases matched | 77/77 | 77/77 | 77/77 |
| Named schemas / endpoints | 9 / 2 | 9 / 2 | 9 / 2 |
| Component references | 19 | 19 | 12 |
| Formatted OpenAPI bytes | 8,490 | 8,490 | 7,772 |
| Formatted client declaration bytes | 6,071 | 6,071 | 5,379 |
| Representative handwritten consumer compile errors | 0 | 0 | 0 |
| Optional-field / response-field / nullability drills | All pass | All pass | All pass |

The two Zod OpenAPI documents are deeply equal as JSON, and their formatted client declarations are byte-identical. Native conversion uses a local registry and component-reference URIs; it is not an artificially limited inline-only comparison. TypeBox's inline reuse still comes from shared authored schema objects and propagates mechanically; a lower reference count is not a drift defect.

Supporting source counts in `measurements.json` are nonblank lines, including comments: shared Zod shapes 94, library adapter 46, native adapter 32, TypeBox shapes/validator adapter 104. Native and TypeBox additionally use the shared HTTP assembler in `model.ts`; the library supplies that function itself. Common compatibility staging and experimental harness code must not be charged to just one candidate. These counts do not establish a performance or quality ranking.

### Recurring field-change exercises

Each candidate's factory builds local variants in memory; no product field is patched into the application. Each drill changes one authoritative field declaration for the relevant shape, with shared response additions reused across item/project responses. The Zod candidates reuse the same authoring file. Request rules, baseline response snapshots, client consumer snippets, and baseline production handlers are not edited to accommodate a variant.

| Drill | Mechanical result for every candidate | Detection in independently authored material |
|---|---|---|
| Add optional request `clientNote: string` | Runtime validation, OpenAPI, and generated client types change | A typed consumer of the new field has one error before generation and zero after it; a numeric value accepted as an unknown field by the baseline is rejected by the changed declaration |
| Add required response `contractNote: string` | Both declared write responses, OpenAPI, and generated types change | A new-field reader has one error before and zero after; an unchanged real response and its typed fixture fail against the changed shape |
| Remove request workphase nullability | Runtime validation, OpenAPI, and generated types change | The existing caller sending null changes from zero compile errors to one; both runtime and emitted-schema validators reject it |

No generator, HTTP metadata, or client transport interface required a parallel field-definition edit. All baseline factories still accept the original null workphase after the exercises. Seven generated artifacts are checked for freshness in the server gate, and the standalone `check:generated` command also passes.

These are controlled contract exercises, not full feature implementations. Business semantics, UI use of a new field, authored scenarios, and compatibility error wording still need deliberate work. In particular, preserving exact legacy error messages requires `requestIssue`'s mapping; a changed field's human-facing wording does not automatically rewrite itself.

### Conversion and enforcement limits found by probes

- **Compiler enforcement is incomplete for every candidate.** All three generated types accept `{ workphaseId: null, position: 7 }` and an anchor with an invalid side, while both runtime and emitted-schema validators refuse them. In these versions, the generated types do not preserve all `not`/conditional semantics. Request validation and compatibility tests remain necessary.
- **The chosen encoding affects static coverage.** The Zod union/intersection encoding makes `{}` a compile error; the TypeBox `if`/`then` encoding permits it in generated TypeScript. Both runtime and emitted JSON schemas reject it. This is not a fundamental TypeBox limitation: another encoding could change the type generator's result. No candidate is rejected on this example alone.
- **Custom Zod refinements can silently disappear from a document.** A string `startsWith` custom refinement rejects a value at runtime while both generated schemas accept it. The selected request conditions therefore use representable unions/intersections, and generation/validation agreement is tested. Native and library conversion both have this risk.
- **Unsupported transforms fail loudly.** A string-to-length transform throws during output generation in both Zod approaches. Neither prototype uses `unrepresentable: 'any'` or a permissive fallback to hide this.
- **Coercion needs explicit wire representation.** With Zod 4.6.7 and zod-openapi 6.0.2, `z.coerce.number()` accepts `'7'` at runtime, but both emitted input schemas describe a number and reject that string when checked with Ajv. This observed gap is pinned by a probe. The selected move endpoints do not coerce values, so it does not invalidate their parity results. Batch 3's workflow-query conversion must describe the existing wire inputs explicitly rather than assuming a coercion schema documents them accurately.
- **Defaults distinguish input from output.** Both Zod paths correctly make a defaulted object's field optional in input and required in output. The native adapter exports both contexts and chooses request components using the endpoint metadata. More complex shared input/output differences still deserve a test during integration.
- **Ajv mutation is optional and observable.** A probe shows enabling `useDefaults`/`coerceTypes` changes inputs and outcomes. The TypeBox candidate disables those options and `removeAdditional`, and all candidates preserve unknown properties and input values in the checks.
- **Library parameter assembly is useful but not yet a demonstrated necessity.** A probe confirms automatic path/query parameter construction, including requiredness and integer bounds. The native prototype's assembler currently handles the two move endpoints' path parameter only. Its extension for the real GET/query surface is part of the next pilot, not an already measured full-API capability.

### Cost comparison and provisional recommendation

**Recommend native Zod 4 conversion plus a small OpenAPI assembly layer for the integrated pilot.** It met the same sampled compatibility and generation checks as the library-backed option, produced identical artifacts, and did not require another integration dependency. The assembly and registry code remained small and understandable for this slice. This is a modest cost/benefit preference, not evidence that an OpenAPI library has no value.

`zod-openapi` remains a close alternative. It removes ownership of generic document/component/parameter assembly, has no published runtime dependencies beyond its Zod peer, and already passes the same tests. If Batch 3's real query/decorated-response/MCP work makes the native layer grow into a framework, prefer the library; the shared Zod definitions and identical outputs make that switch inexpensive.

TypeBox/Ajv is viable and passed the same runtime, response, generation, and field-change checks. JSON Schema is directly executable and the conditional rules need no conversion. For this app, the measured slice did not demonstrate enough maintenance benefit to prefer it over Zod: it still needs the HTTP assembler and compatibility staging, introduces compiler configuration/optional-field handling, and needs separate high-level MCP integration consideration. This conclusion is about these prototypes and consumers, not a general ranking of the libraries.

What remains independently maintained regardless of choice:

- Database-dependent business rules and their intended behavior in the wiki.
- Legacy validation precedence and message mappings until a later behavior decision changes them.
- Endpoint methods/paths/status associations, with coverage checks to keep registration honest.
- MCP's curated fields, snake_case adapters, differing requiredness, and result text.
- Bruno variables, scenario intent, and business assertions.
- Technical explanations that cannot be generated from shapes, plus owner review/closeout/drift-audit responsibilities.

### Verification and next checkpoint

- The final root gate, `npm.cmd run check`, passed: **771 server tests in 28 files, 604 client tests in 34 files, 235 tooling tests**, type checks, lint, formatting, and documentation checks. It ran with the final application-compiler consumer probes and CORS checks. Its ignored local log is `logs/api-contract-batch2-check.log`.
- The 771 server tests include all 509 Batch 1 tests and **262 new prototype checks**: 231 HTTP replays, three runtime/document agreement checks, three header-parity checks, 12 field-change checks, 12 conversion/typing probes, and one seven-artifact freshness test.
- Generation followed by independent `check:generated` passed for all seven artifacts. The baseline generation remains current after all in-memory change exercises.
- Documentation checks passed with **409 files checked and zero findings**. `git diff --check` passed.
- No production route, client, MCP tool, Bruno request, existing test, or frozen compatibility snapshot changed. The saved baseline branch still points at `0565cde3c4c868877a9838610c8464bda939cfa7`.
- Playwright was not rerun for this isolated Batch 2 comparison. Its unchanged Batch 1 baseline remains 219 passed and 18 skipped; real-handler integration must run it again in Batch 3.

No integrated pilot, new branch, broad rollout, PO/Test Planner/Coder/Auditor handoff, or final stack decision is performed in Batch 2. Nathan receives this evidence and the provisional recommendation before Batch 3 starts.

## Batch 3 — Integrated pilot

Not started. Four-endpoint integration, consumer demonstrations, deliberate drift failures, and unchanged-suite verification belong here after the comparison.

## Batch 4 — Final recommendation

Not started. No stack selection or API-wide migration is authorized by the baseline results.

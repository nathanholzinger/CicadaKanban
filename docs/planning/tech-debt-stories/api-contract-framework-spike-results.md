# API Contract Framework — Spike Results

**Written:** 2026-10-30 by the Architect · **Story:** `api-contract-framework-spike.md` · **Status:** evaluation evidence complete; foundation selected after round-table input

**Decision update:** the [round table](../round-tables/api-contract-framework-decision) records Nathan's compatibility/deferral answers and accepted reuse/integration sequence. The [migration roadmap and story plans](../api-contract-migration/README.md) now receive the work. The Batch 1–4 recommendations and measurements below describe their original checkpoints; they do not supersede the later decision or certify compatibility with unfinished Epic 3.5.

This is the evidence record for the comparison, not a product specification. Observed behavior is captured for compatibility; it is not a ruling that every observation is correct. Candidate tools remain in an isolated test package pending M1 cleanup. Native Zod conversion is implemented on the pilot branch and selected for migration planning; no API-wide rollout has been performed.

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

`zod-openapi` remains a close alternative. It removes ownership of generic document/component/parameter assembly, has no published runtime dependencies beyond its Zod peer, and already passes the same tests. Under Nathan's amended direction, if Batch 3's real query/decorated-response/MCP work starts requiring general-purpose assembly machinery or repeated workarounds already provided by the library, preserve the native trial and add a `zod-openapi` integration trial. Compare both on the same four endpoints, baseline, compatibility/consumer checks, triggering feature, and maintenance criteria. This trigger expands the comparison; it does not automatically select the library or discard native assembly. The shared Zod definitions and identical Batch 2 outputs provide a practical starting point for that second trial.

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

### Branch and implementation boundary

The native integration is on **`api-contract-framework-pilot`**, branched from Batch 2 commit `843f132` and committed by Nathan as **`7410110be18f59263a3682e6843186e29c136ee3`**. The comparison branch and saved Batch 1 baseline retain their committed starting points. No application edits have been built for a second integration trial.

`server/src/schemas/` owns the selected request and response shapes. The item/project move handlers parse their bodies after target lookup, replacing their inline structural guards. The hierarchy primitive uses the shared structural schema while retaining database checks, their ordering, and application in the existing transaction. GET item parses the existing string path parameter; GET workflows describes raw string/repeated-string query values and keeps the handler's truthiness and `String()` conversion. No defaults or coercion are introduced by schemas.

Compatibility needs explicit adapters: exact legacy error wording/precedence; undefined-body exceptions; project array bodies as empty moves; item scope-array intent; conditional side validation. Item anchors remain `unknown` on the wire because imposing a string guard would change observed failures. The two localized `as string` assertions at the existing SQLite/position-helper boundary do not convert or validate values; the frozen numeric/null/object cases retain their outcomes. This is a retained legacy mismatch, not a new claim that arbitrary anchors are valid domain references. A migration cannot erase this adapter without a later behavior decision.

The shared hierarchy schema also serves the existing item edit primitive. Its structural behavior is unchanged; the remaining create/edit handler contracts are not declared migrated. No positioning, hierarchy, database, response serialization, or business-rule implementation is replaced.

### Generated document, client, MCP, and Bruno

- `server/src/schemas/openapi.ts` exports a partial four-operation OpenAPI 3.1 document with 21 named components. Metadata records method/path/status associations and ordinary path/query parameters. Native registry exports provide component references and input/output contexts; request conditions remain representable unions/intersections.
- `server/contracts/pilot.openapi.json` and `client/src/api/generated.ts` are generated artifacts. Generation does not import the database or start a server. There is no new public documentation endpoint or runtime response enforcement.
- The selected client API functions consume generated shapes. `pilotTypes.ts` derives their request subsets and UI compatibility aliases by reference. UI item rows keep optional `positionScope`, detail `depth`, and `workflowId` at the existing unloaded-data boundary; wire declarations require the fields actually returned. The client continues to expose string anchors, the two side values, and a string-only workphase field. Those are curated subsets of the permissive legacy REST input. Other client types remain manual; shared create/update response aliases derive from the same row shape without declaring those endpoint requests migrated. Existing UI code and tests are unchanged.
- Existing `get_item` and `move_item` tool advertisements reuse Zod primitives through `mcpItemTools.ts`. Tests pin the exact old JSON schemas, including descriptions, required snake_case names, and the open unknown-field policy. The adapter preserves URL escaping, raw forwarding, payloads, result text, and exceptions. The MCP dispatcher awaits the adapter inside its existing catch. No runtime tool validation or additional capabilities are introduced. HTTP-backed adapter tests exercise both endpoints; the stdio transport itself is not newly exercised.
- The unchanged `bruno/items/move-item.bru` is read externally, its authored variables resolved to checked fixture IDs, its JSON body validated against the emitted request component, and the PATCH executed against the app with response validation. Variables and scenario prose remain authored; no collection regeneration is required.
- Root `AGENTS.md` records the narrowly scoped generated pilot boundary in the committed implementation. It does not declare the remaining client types generated.

### Integrated field-change measurements

Run from the root:

```powershell
npm.cmd --prefix server/tests/contracts/prototypes run generate:pilot
npm.cmd --prefix server/tests/contracts/prototypes run check:pilot
npm.cmd --prefix server/tests/contracts/prototypes run drill:pilot
```

The comparison package still requires its explicit nested install, as documented in Batch 2. Zod 4.6.7 is now pinned directly in the server manifest/lockfile; OpenAPI generation and independent Ajv checks remain development-only. Generation uses the existing `openapi-typescript` installation; generated consumer probes compile with application TypeScript 6.0.3. Formatting resolves plugins relative to each generated target so the client's Tailwind formatter works from the nested tool package.

`.gitattributes` pins LF for the two pilot artifacts and the seven comparison artifacts. Their byte-for-byte freshness checks must survive a Windows checkout with `core.autocrlf=true`; ordinary source files retain the repository's existing line-ending policy.

`drill:pilot` temporarily edits the actual server schema, invokes fresh-process generation, and tests real handlers in fresh Vitest processes. It saves and restores the schema and both generated files in `finally`, and removes its temporary test. Run it alone: it shares the Vitest fixture database with the server suite and must not overlap another test invocation.

| Temporary edit | Authored shape edits / generated updates | Observed independent checks |
|---|---|---|
| Add optional item-move `clientNote: string` | 1 / OpenAPI + client declarations | New-field consumer diagnostics change from 1 to 0; real PATCH accepts a string (200) and refuses a number (400) |
| Add required item response `contractNote: string` | 1 / item row/write/detail components + client declarations | New-field reader compiles; unchanged response fixture changes from 0 to 1 diagnostic naming the missing property; real GET response fails Zod validation naming `contractNote` |
| Remove item request workphase nullability | 1 / request contract + client declarations | Existing null caller changes from 0 to 1 diagnostic; unchanged frozen `ATT-9.11` case fails, expected 200 and received 400 |

No generator, HTTP metadata, route, or parallel client field declaration was edited for the experiments. No experiment field remains. These measurements cover contract propagation: adding product semantics or exposing a new field in the curated UI/MCP subsets still requires implementation work. New legacy-specific error wording also remains an authored decision. The ignored local drill report is `logs/api-contract-batch3-drills.log`.

### Deliberate failures and ongoing checks

`pilotContracts.test.ts` checks real responses from the 77 shared cases against both production Zod shapes and independently compiled emitted JSON Schemas, including reindex disclosure, decorated children/activity/depth/workflow IDs, workflow collections, and error envelopes. That loop reuses a fixture only after the capture has asserted unchanged database state; successful writes and changed fixture variants trigger reseeding. This reduces local HTTP traffic without dropping cases. A separate test compares generated/runtime request acceptance for the body examples and raw query variants. The unchanged frozen snapshots independently check exact status, response, errors, and database effects.

| Introduced fault | Failure exposed |
|---|---|
| Change a generated artifact's contents | The same assertion used by `check:pilot` throws `Stale generated artifact: <path>` |
| Remove `title` in an interceptor on a real GET response | Zod refuses the response; independent JSON Schema assertion reports `ItemDetail response mismatch` and the missing `title` |
| Delete GET item from the document | Scope derived from the independent compatibility corpus reports `Missing pilot registration: get /api/items/{id}` |

Faults are local test variants, not retained broken artifacts. Freshness is part of the normal server gate and is available as a separate command. Registration coverage is explicitly the four characterized endpoints; it does not discover arbitrary unregistered Express routes or claim complete API coverage. Semantic wiki alignment and authored scenario intent still require owner review and drift audits.

### Native assembly complexity checkpoint

**D4's trigger was not reached in this slice.** The integrated native implementation uses a local registry, ordinary component references, explicit operation metadata, and literal OpenAPI parameter descriptors. The workflow query needs no generic parameter serializer or conversion override; the item detail uses normal schema composition. MCP consumes shared primitives directly and needs neither HTTP assembly path. No custom reference rewriting, naming engine, or repeated conversion workaround was added. The explicit list selecting input components is a small remaining maintenance responsibility; future context-dependent defaults or more involved parameter serialization would require renewed comparison under D4.

The metadata/assembly module is larger than the two-endpoint prototype because it now lists four operations and the complete decorated schemas. That alone does not establish a need for another dependency. This result supports continuing the provisional native recommendation; it does not compare a real library integration or remove the agreed trigger for a future concrete requirement.

Supporting source counts (nonblank lines, including comments): the complete metadata/assembly module is 163 lines; shared wire primitives 15, item schemas/adapters 103, project schemas/adapters 44, and workflow schemas 15. Much of this is endpoint/field metadata that every approach needs. The adapters preserve legacy behavior; changing OpenAPI assembly libraries would not remove them. These counts describe one-time implementation size, not a maintenance score. Subsequent fields change their schema declaration; curated consumer exposure, semantics, and error decisions remain separate work.

The three isolated candidate definitions remain comparison fixtures rather than additional production authorities. They do not need parallel edits for the integrated drills. Their eventual retention/removal and the broader migration's scope are Batch 4 decisions.

### Verification

The unchanged **`npm.cmd run test:e2e` passed: 219 passed and 18 skipped, 237 discovered, in 3.8 minutes**, matching the Batch 1 baseline. The report's `.last-run.json` says `passed` with no failed tests. No test, helper, page object, expectation, or Playwright configuration was changed. Its local log is `logs/api-contract-batch3-e2e-final.log`.

The final **`npm.cmd run check` passed: 780 server tests in 29 files, 604 client tests in 34 files, and 235 tooling tests**, plus type checks, lint, formatting, and documentation checks (422 files, zero findings). Its local log is `logs/api-contract-batch3-check-retained.log`. The 780 server tests retain all 771 Batch 2 tests, including the frozen 77-case corpus and snapshots. The nine new integration tests cover all 77 response cases in one loop with safe fixture reuse, plus eight consumer/contract/drift checks. No existing server/client test was edited or removed.

Generation followed by independent `check:pilot` passed for both integrated artifacts; the gate checks these and the seven comparison artifacts. All field experiments were restored. The Architect reviewed the route, hierarchy, MCP, client, dependency, and generated-artifact boundary diffs; `git diff --check` passed. The results retain the exact legacy adapters and the explicit UI boundary rather than claiming API-wide type adoption.

An initial full-gate invocation was contaminated when a second server test invocation overlapped its shared SQLite database, producing lock/foreign-key failures. Concurrent local HTTP traffic also produced Windows `EADDRINUSE` failures and contaminated an overlapping Playwright run, which was stopped. Sequential reruns still exhausted the local port range (over 16,000 `TIME_WAIT` connections); the last such run passed 855 tests and failed one connection. The additional response loop was then changed to reuse demonstrably unchanged fixture state instead of reseeding for each refusal/read. Those failed runs are discarded as verification evidence. Final verification passed sequentially after connections cleared, without changing existing tests or configuration. Sandboxed Playwright startup also encountered the same `tsx` Windows user-info failure as Batch 1; the authorized unchanged command succeeded outside the sandbox.

## Batch 4 — Final recommendation

### Recommendation for Nathan's decision

**Recommend adopting Zod 4.6.7 with native JSON Schema conversion, small OpenAPI 3.1 assembly, and generated client declarations as the foundation for a separately authorized, behavior-preserving migration.** Retain the committed four-endpoint pilot as its starting point. This is the Architect's recommendation, not Nathan's adoption decision or authorization to migrate more routes.

The two Zod candidates generated identical documents/types in the controlled comparison and passed the same compatibility and field-change exercises. Native conversion also completed the real four-endpoint integration without reaching D4's complexity trigger. Adding a library now has no demonstrated maintenance saving sufficient to justify the additional integration. Conversely, avoiding that dependency is not a reason to grow our own general-purpose converter. Preserve D4: a concrete need for parameter conversion, context-dependent component management, or repeated workarounds adds a comparable `zod-openapi` integration trial before selecting either implementation.

TypeBox/Ajv remains a viable alternative: it passed the same prototype gates and expresses JSON Schema directly. It did not demonstrate a maintenance advantage for these consumers, and its real-handler/client/MCP integration has not been trialed. The conclusion is limited to the pinned versions and measured contracts; it is not a general library ranking or a forecast of every remaining endpoint's cost.

### Criterion-by-criterion decision record

| Criterion | Native Zod | Zod + `zod-openapi` | TypeBox/Ajv | Decision implication |
|---|---|---|---|---|
| Behavior preserved | 77 frozen cases, real-handler replacement, full gate, unchanged Playwright passed | 77-case preflight comparison passed; no integrated trial | Same preflight scope passed; no integrated trial | Native has the most complete evidence; prototype parity alone does not prove the others' integration |
| Accurate contract | Request/document agreement; real write/detail/collection/error responses checked; no unsupported selected refinements | Same move documents as native in the prototype | Equivalent sampled request/response acceptance with a different conditional encoding | All viable; conversion/normalization must continue to be checked independently |
| Useful types | Actual client boundary compiles; explicit UI subsets preserve optionality | Byte-identical prototype client declarations | Representative callers compile; `{}` is statically permitted by its chosen encoding | Generation reduces duplication but does not encode every refusal; all three miss some conditional constraints |
| Independent definitions | Selected request/client declarations replaced by references; domain/UI duplication remains below | Same source-sharing potential as native | Shared TypeBox definitions propagate mechanically | No approach removes legitimate surface differences or independently authored business rules |
| Recurring edits | Three integrated drills: one shape edit, two generated artifacts, useful independent failures | Same three in-memory prototype drills pass | Same three prototype drills pass | Native's propagation is demonstrated through real handlers; feature semantics still need implementation |
| Drift detection | Stale file, intercepted response, and missing characterized operation fail usefully | Same checks could be retained with library assembly; not integrated | Same fallback principle; not integrated | Checks are part of the foundation, not a benefit supplied automatically by any library |
| Custom machinery | 163-line metadata/assembly module plus legacy parsing adapters | 46-line prototype library adapter plus shared shapes/staging; library owns document assembly | 104-line prototype schema/validator plus shared assembler/staging | Counts have different scope; no score based on line totals. Legacy adapters remain with every option |
| Operational cost | One direct runtime dependency; nested generator and freshness checks; client formatter resolution and LF policy | Additional development integration dependency; same generator/compiler peer issue | Validator configuration plus authoring package; same generator issue | Native's small current assembly cost is acceptable; generator isolation must become normal tooling if adopted |
| Human review | Wiki semantics, endpoint inventory, curated tool inputs, scenarios, and explanations remain reviewed | Same responsibility | Same responsibility | Retain closeout and drift audits; do not promise that nothing handwritten can disagree |

### What one authoritative shape does and does not mean here

The comparison fixtures are frozen evaluation definitions, not additional production authorities. Within the selected production API chain, shape edits feed runtime parsing, emitted schemas, and client declarations. Requests and responses legitimately have different optionality; MCP and UI subsets deliberately expose different contracts.

| Representative field | Baseline independent declarations | Retained pilot boundary |
|---|---|---|
| Item request `workphaseId` | Runtime guard, server request type, client input, MCP advertised primitive | REST schema supplies runtime/inferred/generated types; MCP references the same ID primitive. REST optional/nullable, UI optional/non-null, and MCP required/non-null are still three authored exposure policies |
| Item request `side` allowed values | Runtime check, domain `Side`, client literal union: 3 | Zod enum feeds parsing and generated UI type; domain `Side` remains separate: 2. The pilot has not unified all domain vocabulary |
| Project `prevId`/`nextId` | Route guards, route-local type, client input: 3 sites per field | Shared optional-reference schema supplies parsing/inferred/generated types. Neighbor selection/existence is still domain behavior, not a second shape definition |
| Response `positionScope` allowed values | Domain union and client union: 2 | Zod adds the wire enum, while both old unions remain: 3 authored enums plus generated references. This temporary increase must not be reported as completed consolidation |
| Detail `workflowId` | Produced by the handler, absent from the handwritten detail type | One response schema declaration reaches generated wire types and the optional UI alias; computation remains in the handler |

The next migration should replace remaining transport declarations as their consumers migrate and either derive domain vocabulary from a neutral shared source or check agreement where sharing would create undesirable dependencies. Do not make position math depend on HTTP schemas just to lower a count. Existing response checks cover the sampled scope values; they are not an exhaustive type-equality gate for all remaining declarations. No such consolidation was silently added during Batch 4.

MCP reuse is primitive-level, not automatic projection of the complete REST request. A future field-specific REST constraint still requires review of the curated MCP adapter and HTTP-backed checks; sharing `idSchema` alone cannot guarantee that every such change updates the tool correctly.

### Retained files, dependency boundaries, and cleanup disposition

| Area | Disposition and reason |
|---|---|
| `server/src/schemas/{common,items,projects,workflows,openapi}.ts`, `lib/parseRequest.ts`, selected route/hierarchy edits | Retain as the integrated implementation; legacy adapters are necessary for compatibility |
| `server/src/lib/mcpItemTools.ts` and selected `mcp.ts` changes | Retain current advertisement/adapter reuse; no SDK registration migration or new runtime validation |
| `server/contracts/pilot.openapi.json`, `client/src/api/{generated,pilotTypes}.ts`, selected API function edits | Retain partial development contract, generated declarations, and explicit temporary UI boundary |
| Frozen corpus, harness, snapshots, and `pilotContracts.test.ts` | Retain all expectations and all 77 cases; do not consolidate tests while proving compatibility |
| `pilotArtifacts.ts`, `generatePilot.ts`, `pilotFieldDrills.ts`, `documents.ts`, `typeChecks.ts` | Retain reproducible generation/check/drill tooling and application-compiler probes; migrate reusable tooling out of the comparison package before broader adoption |
| Three candidate directories, shared comparison modules/tests, seven `generated/` artifacts, nested manifest/lockfile | Retain as reproducible evidence through the decision/review checkpoint. They are test/development code, not application authorities. No prototype file is discarded in this batch |
| Server `zod` 4.6.7 | Retain exact direct runtime pin. It also satisfies the installed MCP SDK's declared peer range; no SDK upgrade is part of the proposal |
| Nested `zod-openapi`, `typebox`, `ajv`, `openapi-typescript`, Zod and generator TypeScript 5 peer | Retain development-only for reproduction. No TypeBox/Ajv/OpenAPI-library import exists under application source. Do not promote alternative candidates into runtime dependencies |
| `.gitattributes`, root `AGENTS.md`, tooling README | Retain generated LF policy and the explicit type boundary; update the README to distinguish comparison and integrated commands |
| Experimental fields/faults, scratch test, ignored install/build/test outputs | Field/fault edits were restored and scratch test removed in Batch 3. No experimental behavior remains to discard; local outputs are not review evidence to commit |

Inspection of `server/src`, `client/src/api`, and the application TypeScript configurations confirms that candidate machinery is already outside the runtime/build import paths. Batch 4 therefore removes no application dependency or implementation file. The nested package remains required by the retained server gate; its install and comparison-test overhead are real costs. After approval, separate normal contract tooling from comparison-only dependencies, while preserving the committed comparison and its reproduction instructions. Do not delete tests or resolve the generator's TypeScript 5 peer mismatch through an app downgrade.

### Revised epic proposal and earlier decisions

The proposed remaining sequence and gates are recorded in [the deferred epic](api-contract-zod-openapi.md). Reuse the pilot; do not repeat its implementation as another foundation story. Re-inventory remaining routes instead of inheriting the old count of 53 endpoints. Move symmetry and create/edit positioning are independent behavior work, not prerequisites for describing today's API.

| Earlier epic item | Proposed disposition |
|---|---|
| C1, request schemas | Keep full non-test API coverage as the eventual target; replace the requirement to eliminate every handwritten structural branch with shared shape definitions plus necessary compatibility staging/error mapping |
| C2, errors | Keep `{ error: string }`; replace generic flattening as a universal rule with preservation of current messages, precedence, and parser/global-error outcomes |
| C3, shape-test consolidation | Remove from this refactor. Keep existing tests and coverage unchanged; consider any test redesign separately after compatibility is established |
| C4, publication | Keep generation/freshness and completeness before publication. A public endpoint and its exact path remain a separately approved deliverable; no partial document is advertised as complete |
| C5 and OD3, MCP tiers | Replace with behavior-preserving reuse of existing advertised shapes and explicit adapters. Runtime validation, generic name conversion, SDK registration migration, `move_project`, and expanded `move_item` are independent decisions |
| C6, Bruno | Confirm authored variables/scenarios. Prefer focused external checks; do not regenerate collections merely to share shapes |
| C7, authority/documentation | Confirm wiki business authority and generated technical shape reference. Replace “nothing handwritten” and “nothing can drift” promises with generated shapes, checks, and owner review of remaining semantics |
| C8, responses | Confirm test-only response assertions. Defer `drizzle-zod`/table-derived schema adoption: the pilot did not evaluate it, and storage types are not automatically API contracts |
| C9, layout/parsing | Confirm resource schema modules and typed in-handler parsing. The small central operation catalog is adequate for the pilot; future colocation/registration changes must meet a concrete maintenance need |
| OD1, client source | Recommend OpenAPI-generated declarations; selected API consumers are integrated. Keep explicit view-model boundaries and migrate the rest incrementally rather than deleting `types.ts` wholesale |
| OD2, library | Recommend native Zod for current needs; preserve D4's additional-trial trigger. `zod-openapi` remains a supported comparison candidate, not a selected production integration |
| Move-shape symmetry, dual positions, create/edit placement, depth-cap delivery | Exclude behavior changes from migration. Positioning owns its decisions; optional consistency/capability changes have named follow-up scope below |

One-time costs still ahead: route inventory, normal generator packaging/install wiring, wider response fixtures, and remaining client/domain boundaries. Per-route recurring work: capture legacy behavior, author its technical shapes and HTTP associations, replace structural validation without moving domain checks, generate consumers, and run contract/behavior gates. Ongoing manual work: business-rule interpretation, intended exposure policies, response construction, endpoint completeness review, Bruno scenario intent, comments, and semantic drift audits. The spike does not supply a reliable full-API effort estimate; estimate the resource batches after inventory. The first migrated batch should check whether the measured maintenance benefit continues outside this pilot.

### Findings, review packet, and decision checkpoint

All observed disagreements and policy questions are routed with expected/observed behavior, evidence, and a decision owner in [API contract compatibility follow-ups](api-contract-compatibility-follow-ups.md). They include project-neighbor/wiki/Bruno semantics, generic 500 validation paths, permissive inputs, incomplete client declarations, MCP advertisement versus runtime acceptance, and the stale error-guide example. None is fixed or declared a confirmed product defect in this spike. Positioning receives the move-shape/dual-position deferral; no wiki or test-plan passage is changed.

[The review packet](api-contract-framework-spike-review.md) gives the exact commits/diff ranges, reproduction order, compatibility limits, retained artifacts, and questions for later Coder, PO, Test Planner, and Auditor input. It has been prepared, not sent; those roles have not been invoked. Nathan decides when to request their input and whether to adopt, extend a specified comparison, or stop. No merge, publication, broad rollout, or story sign-off follows automatically.

### Batch 4 verification

Batch 4 changes planning documents and the tooling README only. Runtime, generated artifacts, dependencies, tests, and configuration remain the committed `7410110` implementation. Its retained-code evidence is the passing Batch 3 full gate (780 server / 604 client / 235 tooling) and unchanged Playwright (219 passed / 18 skipped). No unchanged application suite was rerun for documentation-only edits.

`check:generated` passed for all seven comparison artifacts, and `check:pilot` passed for both integrated artifacts without rewriting them. `npm.cmd run check:docs` passed (422 checked files, zero findings); `git diff --check` passed. Local document link targets existed, and the Batch 4 diff contained no application/test/dependency/configuration changes. Nathan committed that checkpoint as `d703e6a`; subsequent role input and foundation selection are recorded in the round table and current migration plans. Archival/sign-off is not performed by the planning handoff.

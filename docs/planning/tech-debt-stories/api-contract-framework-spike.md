# API Contract Framework — Comparison Spike and Pilot

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** in progress — Batch 1 complete; Batch 2 not started · **Sequenced:** before any API-wide contract migration

This story is the next step in place of starting `api-contract-zod-openapi.md`. That epic remains a migration proposal to replan from this story's evidence, not authorization to adopt a particular library or change an endpoint. This story compares the options, pilots the preferred option, and stops for a decision before wider adoption.

## Goal

Choose an API contract foundation that reduces recurring hand maintenance while preserving current behavior.

The criterion is:

> A future field change has one authoritative shape definition, generated consumers update mechanically, and checks expose the remaining disagreements.

Deliver runnable comparison prototypes, one integrated pilot, and an evidence-backed recommendation with the costs and remaining manual responsibilities stated. A recommendation against proceeding is a valid result if the candidates do not meet the compatibility and maintenance requirements.

**Authority and maintenance:**
- The wiki is the primary source of business rules and observable product behavior. It does not prescribe technical implementation.
- Database definitions own storage structure; API definitions own exchanged data. Both implement the product rules. A table row and a response need not have the same shape.
- Generated technical documentation describes fields, types, parameters, and response contracts from the authoritative shape definitions. Endpoint metadata such as methods, paths, and response associations must still be supplied and kept in agreement with the routes.
- Generate where it removes more maintenance than it adds. Check independently authored material where generation would distort it. Use story closeout and drift audits for semantic relationships that tools cannot reliably check.
- The wiki informs technical design through human interpretation; generating contracts from wiki prose is not a goal.

**Compatibility:**
- Preserve all current REST and MCP behavior: successful writes and reads, accepted input forms, omitted versus null fields, defaults, ignored fields, expressly refused fields, normalization, status codes, error payloads and messages, validation precedence, and database effects.
- Existing Playwright tests must pass without changes to the tests, helpers, page objects, expectations, or configuration to accommodate the refactor. Keep existing server and client tests and their coverage intact too. Add focused compatibility and contract tests where needed; do not shrink or replace the existing tests during this story.
- Current implementation and unchanged tests establish the compatibility baseline. The wiki remains the authority for intended behavior. A disagreement between them is a finding for subsequent work, not permission to fix behavior during the spike.
- Preserve the hierarchy and positioning primitives. Schema adoption must not reorder structural and database-dependent failures just to fit a library's preferred parsing model.

**Out of scope:**
- API-wide migration, complete published OpenAPI documentation, Swagger UI, or a new public documentation endpoint. A partial document is a development artifact, not the API's complete reference.
- Endpoint redesign, unified item/project move fields, changed unknown-field policy, dual position values, new create/edit placement behavior, or consistent depth-cap delivery. `positioning-on-create-and-edit.md` retains its positioning decisions; other findings get a named follow-up destination.
- New MCP tools or expanded tool inputs, including `move_project` and anchor/side support for `move_item`. Existing REST and MCP differences remain intact.
- Database schema changes, database-to-response schema generation, whole-client type migration, framework replacement, or dependency upgrades unrelated to the evaluation.
- Runtime response validation in the app, regenerated Bruno collections, wiki or test-plan rewrites, and correctness fixes discovered while comparing implementations.

## Inbound deferrals

From Nathan's architecture discussion on 2026-10-30:
- Extract the library comparison and pilot from the broader API contract epic before committing to its stack or migration plan.
- Retain current functionality and establish a no-regression baseline before considering correctness fixes or API consistency changes.
- Evaluate generation, checks, and manual review by their cost and maintenance benefit, rather than trying to generate every surface from one definition.

The original epic's OD2 becomes the broader comparison in this story. Its client type and MCP adoption questions receive evidence here; the pilot does not authorize their API-wide rollout.

## Decisions

**D1. Compare three approaches to the same HTTP contract.**

| Candidate | Authoritative shapes | Validation | OpenAPI production |
|---|---|---|---|
| Zod plus an OpenAPI integration library | Zod schemas | Zod | Library conversion and document assembly |
| Zod 4 native JSON Schema conversion | Zod schemas | Zod | Native conversion plus a small document assembly layer |
| TypeBox plus Ajv | TypeBox schemas | Ajv | JSON Schema shapes plus document assembly/integration |

For the first candidate, inspect `@asteasolutions/zod-to-openapi` and `zod-openapi`, then prototype the better fit. Implement both only if a concrete unresolved difference would change the decision. Record the reason for shortlisting one.

"Zod alone" means evaluating whether native conversion removes the need for an OpenAPI integration dependency. It does not drop the HTTP document or pretend JSON Schema alone describes endpoints. OpenAPI 3.1 is the common output for comparison. Versions, dialects, SDK compatibility, and primary documentation consulted are recorded in the results.

**D2. Use the same difficult examples and expected outcomes.**

Compare the existing item and project move contracts, retaining their differences. Exercise optionality, nullability, ignored and refused fields, conditional requirements, normalization, failure order, and responses with optional reindex disclosure. Database-dependent rules remain in the existing domain code.

Capture expected behavior before modifying handlers. Include requests with multiple faults, missing target entities, both project neighbor fields, an invalid unused neighbor, missing or unmatched item anchor/side inputs, and explicit final positions. Determine each outcome from the current code and baseline execution rather than assuming what it should be.

**D3. Separate mandatory gates from maintenance comparisons.**

| Criterion | Evidence and decision rule |
|---|---|
| Behavior preserved | No observed differences in the compatibility corpus or existing tests; compare status, payload and error text, and resulting database state. A changed behavior cannot be offset by a better score elsewhere. |
| Accurate contract | Inspect generated inputs and outputs and exercise representative values against them. Record any validation constraint not expressible in the document; do not silently widen a schema to hide conversion failures. |
| Useful types | Representative client calls compile with inferred/generated types, without duplicate transport interfaces, `any`, or casts that bypass a mismatch. |
| Definition count | Count independent declarations of each representative field's type, requiredness, and nullability. References and generated copies are distinguished from authored copies. |
| Recurring edits | Perform the same temporary field changes and record manual edits, generated updates, and failures in handwritten consumers. Count contract edits separately from legitimate feature implementation work. |
| Drift detection | Deliberately introduce stale generated files, a response mismatch, and a missing pilot endpoint registration. Record whether each fails, where, and how actionable the failure is. |
| Custom machinery | Record shared assembly code, adapters, conversion overrides, error mappings, and per-endpoint exceptions. Separate reusable infrastructure from recurring glue. |
| Operational cost | Record setup effort, dependency/version constraints, generation and check commands, determinism, and failure clarity. Separate one-time setup from recurring maintenance. |

Do not reduce the decision to a weighted score. Raw evidence, source examples, and limitations accompany the recommendation. Lines of code and implementation time are supporting measures. Runtime benchmarking is secondary unless the pilot exposes a noticeable regression.

**D4. One preferred candidate gets integrated, not three full migrations.**

The comparison uses isolated prototypes and shared compatibility examples. The preferred candidate then gets a four-endpoint pilot:

| Endpoint | Purpose |
|---|---|
| `PATCH /items/:id/move` | Complex body, domain integration, and reindex disclosure |
| `PATCH /projects/:id/move` | Different legacy conventions and neighbor precedence |
| `GET /items/:id` | Path parameters and a decorated response |
| `GET /workflows` | Query parameters and a collection response |

Integrate only enough consumer work to demonstrate the chain: generated types in the corresponding client API functions, definition reuse for existing `get_item` and `move_item` tools, one existing Bruno scenario checked against the contract, and pilot generation/coverage checks. Do not expose REST fields that the current MCP tool does not expose. If SDK registration changes would force migrating the entire tool set, demonstrate the schema reuse in an isolated adapter and record the limitation rather than widening the pilot.

**D5. Exercise a field change without shipping one.**

Make identical temporary changes in each prototype: an optional request field, a response field, and a nullability change. Observe which definitions need editing, which outputs regenerate, which consumers fail, and which disagreements remain silent. Revert the experimental changes and confirm the final pilot preserves the baseline.

**D6. The spike ends at a decision checkpoint.**

Prefer the candidate that meets the mandatory gates with the least recurring custom machinery. Do not favor Zod simply because the branch or earlier epic names it, or favor fewer dependencies if that means owning a larger converter or framework.

The comparison has an initial timebox of roughly two working days, excluding the integrated pilot. At that checkpoint, report evidence and unresolved issues before extending the comparison. If the integrated pilot invalidates the shortlist, return to the comparison with the specific blocker recorded. Wider rollout requires the results to be reviewed and the migration plan to be revised.

**D7. Nathan and the Architect carry out the spike directly.**

At Nathan's direction, this story bypasses the standard Coder, PO, Test Planner, and Auditor workflow during the comparison and pilot. The Architect implements the prototypes, pilot, checks, and results record in direct collaboration with Nathan. There are no mandatory role handoffs, separate audits, or standard story-closeout ceremonies before the evidence is ready.

Batch gates remain technical evidence checkpoints, not role approvals or mandatory commit stops. Keep Nathan informed of results and scope decisions; commits follow his direction. Compatibility requirements, existing tests, automated checks, and the agreed scope remain in force.

Once the pilots and comparison are complete, prepare the evidence for Coder, PO, Test Planner, and Auditor input to the final decision. Their participation happens then, at Nathan's direction. Do not treat a provisional shortlist or a passing pilot as authorization for wider adoption. This workflow exception applies to this spike, not to the subsequent migration or the repository's general process.

## Work, in batches

### Batch 1 — Baseline and shared evaluation cases

**Complete, 2026-10-30:** baseline and post-corpus gates passed; Playwright passed unchanged (219 passed, 18 skipped). The 77-case corpus, endpoint/consumer inventory, and maintenance baseline are recorded in [the results](api-contract-framework-spike-results.md). No application code or existing tests changed.

- Inventory the selected routes' validation order, response variants, client consumers, MCP adaptations, and relevant Bruno requests. Read the domain modules and applicable wiki rules before changing their enforcement sites.
- Run `npm run check` and `npm run test:e2e` on the baseline and record the revision, commands, and results. Record existing failures separately; do not change behavior or weaken tests to clear them.
- Add a shared compatibility corpus based on current behavior, including malformed inputs and multi-fault precedence. Run against an isolated test database using the existing reset and seed helpers; do not use the development database.
- Capture response/database comparisons with deterministic fixtures or narrowly normalize nondeterministic IDs/timestamps. Do not normalize away ordering, meaningful timestamps, or other behavior under evaluation.
- Establish the baseline maintenance inventory: independently authored shapes, generated candidates, and relationships that remain manual.

**Gate:** baseline results and compatibility corpus are reviewable and reproducible. Report the baseline to Nathan before prototype work.

### Batch 2 — Comparable prototypes and shortlist

- Verify supported versions and primary documentation for the three candidates. Shortlist one Zod/OpenAPI integration library with reasons.
- Build isolated validators and response definitions for the two move contracts, produce a small OpenAPI document, and generate representative client types for each candidate. No candidate rewrites domain behavior.
- Use the same corpus, metadata, type checks, and field-change exercises. Check input versus output representation, defaults/coercion, unknown properties, conditional constraints, nullable fields, references, and response variants.
- Measure the criteria in D3. Any custom keyword, transform, or refinement needs an explicit account of how the published schema represents it. Ajv configuration that mutates input needs a compatibility check too.
- Record versions, commands, representative source/output, results, limitations, and the preferred candidate in `api-contract-framework-spike-results.md` beside this plan. Keep the record factual; a recommendation is provisional until the integrated pilot passes.

**Gate:** the same cases run against all three candidates, field-change experiments are reverted, and the shortlist and trade-offs are reviewable. Report the provisional choice and its evidence to Nathan before integrating the preferred candidate.

### Batch 3 — Integrated pilot and consumer checks

- Adopt the preferred candidate for the four endpoints only. Preserve lookup/parsing order, the existing hierarchy and positioning primitives, transactions, and response behavior.
- Add response contract assertions in tests, with no runtime response enforcement. Demonstrate reindex disclosure and the decorated/collection variants, not just a minimal success fixture.
- Consume generated types in the selected client API functions without changing runtime requests or UI behavior. Avoid replacing all of `types.ts`; record a temporary boundary where pilot and unmigrated consumers meet.
- Demonstrate existing MCP schema reuse and adaptations without new capabilities or changed tool behavior. Record any duplication that cannot be removed compatibly.
- Check one existing Bruno scenario against the contract while preserving its authored variables, assertions, and scenario intent. A focused external check is sufficient if embedding validation would add more maintenance.
- Demonstrate deterministic generation, a stale-output failure, a deliberate response-contract failure, and missing-registration detection against the explicit four-endpoint pilot scope. Restore each deliberate fault after recording it; do not imply API-wide coverage.
- Repeat the maintenance exercise on the integrated chain, revert its changes, and document the actual commands and manual steps.

**Gate:** `npm run check`, unchanged `npm run test:e2e`, and pilot acceptance checks pass. The Architect reviews the diff and records the results for Nathan. No separate Auditor pass is required during the pilot, and no broad migration follows automatically.

### Batch 4 — Recommendation and handoff

- Finish the results record with a criterion-by-criterion comparison, the integrated pilot's results, remaining risks, and a recommendation to adopt, reconsider, or stop.
- Route correctness and documentation disagreements to named follow-up work without fixing them here. State expected versus observed behavior and the evidence needed for a later ruling.
- List retained pilot files, discarded prototype files/dependencies, temporary boundaries, and what the broader migration can reuse. Remove unused candidate machinery from the app's runtime/build path while preserving reproducible comparison evidence.
- Propose the revised migration scope, sequencing, checks, and costs. State which earlier epic decisions are confirmed, replaced, or still open.
- Prepare a concise review packet for later Coder, PO, Test Planner, and Auditor input: the comparison, compatibility evidence, retained pilot diff, unresolved findings, and recommendation. Nathan decides when to seek their input for the final decision.

**Gate:** final gate/check results reflect the retained code, findings have dispositions or named follow-up destinations, and Nathan has a concrete recommendation and evidence ready for the other roles' input. Standard story closeout is bypassed for this spike under D7. Do not start the API-wide rollout in this story.

## Code map

Batch 1 adds only the corpus and results below. Later touch points remain planned; record exact prototype, schema, adapter, generator, and check paths as they are introduced. No candidate dependency or production implementation is added by Batch 1.

| File or area | Batch | Change |
|---|---|---|
| `server/tests/contracts/compatibilityCases.ts` | 1 | Shared transport examples and fixture variants, independent of candidate libraries |
| `server/tests/contracts/compatibilityHarness.ts` | 1 | Checked server fixture setup, deterministic IDs/time, response capture, and application-table deltas |
| `server/tests/contracts/apiCompatibility.test.ts` and its `__snapshots__/apiCompatibility.test.ts.snap` | 1 | 77 observed baseline cases with exact response and database-change snapshots |
| `server/src/routes/items.ts`, `projects.ts`, `workflows.ts` | 1, 3 | Baseline inventory; four selected handlers adopt the preferred validator |
| `server/tests/` and isolated prototype/test tooling | 1–3 | Shared compatibility cases, candidate comparisons, response and drift checks |
| Selected schema and OpenAPI assembly modules; exact paths chosen during comparison | 2–3 | Authoritative pilot shapes and partial document generation |
| `client/src/api/items.ts`, `projects.ts`, `workflows.ts`; pilot generated types | 2–3 | Type usability and selected client consumption |
| `server/src/mcp.ts` or an isolated MCP adapter | 3 | Existing tool definition reuse without capability changes |
| One existing request under `bruno/` plus validation tooling | 3 | Contract check preserving the scenario and variables |
| Relevant `package.json` and lockfiles | 2–3 | Candidate tooling and retained pilot commands; remove unused dependencies |
| `docs/planning/tech-debt-stories/api-contract-framework-spike-results.md` | 2–4 | Reproduction commands, measurements, decision evidence, findings, and retained-artifact inventory |

## Acceptance

- All three approaches are evaluated on the same two move contracts and shared compatibility examples. The Zod integration-library shortlist has a recorded rationale.
- A preferred candidate is piloted across the four named endpoints, or a reproducible blocker and evidence-backed recommendation against integration is recorded. A blocked or rejected pilot is not reported as a successful no-regression refactor.
- An integrated pilot preserves current REST/MCP behavior, passes the existing Playwright suite unchanged, keeps existing server/client tests intact, and passes `npm run check` plus focused compatibility checks. Baseline failures and comparison limits are disclosed; tests passing are evidence, not a claim to have proven every possible input equivalent.
- Generated output represents the pilot's actual HTTP inputs and responses; its scope is explicit, and no partial document is published as the full API contract.
- Representative generated client types, existing MCP reuse, and one Bruno contract check are demonstrated, with unresolved limitations stated.
- Temporary field-change exercises measure independent definitions, manual edits, mechanical updates, and silent disagreements. All experimental behavior changes are reverted.
- Stale-output, response mismatch, and missing pilot registration checks fail usefully when deliberately exercised and pass after restoration.
- The results distinguish mandatory compatibility gates, one-time setup, recurring maintenance, and human review. No candidate wins by trading away current behavior.
- Correctness findings are routed to subsequent work. The final recommendation lists what remains manual and how closeout and drift audits cover it.
- Prototype retention and cleanup are documented. Evidence is ready for Coder, PO, Test Planner, and Auditor input after the comparison and pilot; their standard workflow is not a prerequisite to producing that evidence. API-wide adoption remains a subsequent decision.

## Open questions

- **For the Architect, during Batch 2:** which Zod/OpenAPI integration library merits the prototype, and what evidence distinguishes it from native conversion?
- **For the Architect, working with Nathan during the pilot:** which compatibility cases require adapters or staged parsing, and does their recurring cost change the shortlist?
- **For Nathan, at the final checkpoint:** adopt the recommended foundation and authorize a replanned migration, extend the evaluation for a specific unresolved issue, or stop? No stack selection is presumed by this plan.

## Handoff

- **Broader API contract epic:** inherit the chosen approach, versions, commands, reusable pilot code, measured maintenance costs, and remaining decisions. Replan from this evidence; do not resume conflicting instructions from the original epic unchanged.
- **Behavior follow-ups:** move symmetry and dual-position design remain with `positioning-on-create-and-edit.md`. New MCP capabilities and depth-cap consistency need separate named scope if still wanted. Each new correctness finding gets an explicit destination in the results record.
- **Coder, PO, Test Planner, and Auditor, after the pilots and comparison:** review the prepared evidence at Nathan's direction to inform the final decision. These are deferred inputs, not intermediate implementation gates or required sign-offs during the spike.
- **PO, for later input:** receive implementation/wiki disagreements for a later ruling. No business-rule changes or Planned wiki passages are introduced by this story. Any future removal of duplicated API reference prose is a separate owner-applied handoff after complete generated documentation exists.
- **Test Planner, for later input:** receive compatibility coverage gaps or candidate cases, without deleting or weakening existing cases. Schema-test consolidation is subsequent work, not part of proving this refactor compatible.
- **Architect:** record the selected pilot type boundary. Root `AGENTS.md` currently requires manual type synchronization; if retained generated pilot types make that statement inaccurate, draft the narrowly scoped correction for Nathan's approval before retention, without declaring the whole client migrated.
- **Code owners:** maintain comments and applicable directory guidance for the retained implementation. Keep independent contract declarations out of explanatory prose where generated reference or a symbol pointer serves better.
- **Subsequent migration closeout and drift audits:** retain responsibility for semantic alignment among the wiki, implementation, comments, and authored scenarios where automated checks cannot establish it. This long-term responsibility does not impose the standard workflow on the spike.

## Amendments

- **2026-10-30:** Nathan approved creating a standalone comparison-and-pilot story after agreeing the compatibility constraint, maintenance criterion, three candidates, and staged evaluation. This plan records that scope; implementation has not started.
- **2026-10-30:** Nathan directed that he and the Architect carry out the spike directly, bypassing the standard Coder/PO/Test Planner/Auditor workflow until the pilots and comparison are ready. Added D7 and revised the gates and handoffs to defer those roles' input until the final decision stage while retaining the technical checks and compatibility requirements.
- **2026-10-30:** Nathan started Batch 1. Added the endpoint/consumer maintenance inventory and baseline evidence in `api-contract-framework-spike-results.md`, plus a reusable 77-case compatibility corpus. The existing handlers, client, MCP, Bruno requests, and existing tests remain unchanged.
- **2026-10-30:** Completed Batch 1: baseline and post-corpus gates passed, all 77 captures replayed successfully, and the unchanged Playwright baseline passed with 219 passed and 18 skipped. Batch 2 remains unstarted.

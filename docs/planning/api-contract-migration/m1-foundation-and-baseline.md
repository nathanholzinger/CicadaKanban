# API Contract M1 — Foundation, Integration and Baseline

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** Batches 1–2 complete; Batch 3 and normal story review pending · **Depends on:** preserved planning/evidence checkpoint and current-branch baseline; Epic 3.5 completion is not a prerequisite

**Execution update:** evidence is preserved on `api-contract-framework-spike-completed` at `5408bdb150cbb227298f53aba1cc57d3b7866d61`; tooling cleanup is committed as `575b33b`. Nathan clarified that all M1–M5 development may proceed while Epic 3.5 continues. [The progress ledger](m1-progress.md) distinguishes the current baseline from final integration evidence; completed-main verification belongs to the final merge gate.

## Goal

Turn the retained pilot into maintainable infrastructure, establish a current-branch compatibility baseline and independent inventory, then enable remaining resource migrations. The [roadmap decisions and shared gate](README.md) apply. Do not change REST/MCP capabilities, errors, input policy, UI behavior or database schema. Final integration with completed Epic 3.5 is a later merge gate, not an M1 dependency.

## Inbound deferrals

- Spike Batch 4 and round table Architect #6–#8, Coder #3–#4: normal install/generation, comparison evidence retirement, stable HTTP tests, database-free vocabulary, independent completeness and response/status checks.
- Coder asks A/B/D: preserve wording/precedence; improve route/domain separation without changing input behavior; assess a bounded parse-parity probe and query-key/parameter-name agreement.
- Architect #3 / Test Planner: verify existing compatibility case-ID claims before they count as catalog coverage. Generated/reference reading is permitted by Nathan; this grants no automatic test mapping.
- CF1/CF2/CF3/CF5 and future error policies remain preserved and queued after migration. This story cannot “simplify” them away.

## Decisions

- Reuse `7410110`'s implementation. Preserve `d703e6a`'s full comparison in a reachable named revision before cleanup; record its actual name/hash and reproduction commands.
- Comparison-only rejected candidates and their exclusive parity/measurement artifacts/tests may be retired from the active tree as the bounded cleanup selected with this plan. Preserve all product tests, the 77-case characterization corpus/snapshot data, integrated response checks, and valuable native conversion/typing probes and reversible drills. Record a file-by-file removal/move/replacement account before deletion; do not treat the whole prototype directory as disposable.
- Expose normal root generation/freshness commands, proposed as `contracts:generate` / `contracts:check`. Generation must not live behind a hidden manual install under `tests/`. Preserve the generator's compatible TypeScript peer isolation and application TypeScript 6 checks; select the simplest proven packaging/install wiring in Batch 2 without unrelated package restructuring or overrides/downgrades.
- Give retained files descriptive names, such as `server/contracts/openapi.json` and `client/src/api/transportTypes.ts`. Until complete, generated metadata/description must still label the document partial. Rename callers, LF rules and freshness checks together; do not rename wire fields.
- Describe path parameters through their owned schema/operation metadata. Do not replicate no-op string parsing at every handler when Express already supplies a string and no additional constraint is intended; document coverage and runtime validation are distinct responsibilities.

## Work, in batches

### Batch 1 — Preserve evidence, current-base baseline and inventory

**Complete against `575b33b`.** The [independent source inventory](m1-api-inventory.md) accounts for all 54 operations, status/response variants, client callers, eight MCP advertisements and 26 Bruno requests. A source-only TypeScript syntax-tree enumeration of actual mounts/handlers matched every inventory method/path; five test-helper operations are explicitly excluded. The [baseline and exclusions record](m1-baseline-and-exclusions.md) names the evidence revisions, reuses unchanged-code verification and assigns all 18 inherited E2E skips to existing Epic 3.5 receiving work. No fresh full-suite execution, runtime introspection, Auditor approval or catalog credit is implied. CF7 is routed to post-migration decisions, with M3/M4 responsible for HTTP characterization before replacement. Batch 3 still owns permanent discovery/association checks and the normal review handoff.

Record the existing evidence/migration references, current revision and main ancestry, passing gate/E2E results, frozen captures and owned baseline exclusions. Nathan has created both branches and committed Batch 2; reuse its verified test results where source content is unchanged rather than rerunning solely to change a status label. Build an independently reviewed method/path inventory now, including health, every non-test router, status/response variants and known consumers; assign each operation to the retained pilot or M2/M3/M4. Explicitly exclude test helpers and schema-only features.

Identify remaining response/precedence characterization work for the receiving resource batches; they capture behavior before replacement. The existing 54-operation scan is a starting point, not a coverage certificate. Preserve the original spike captures and record any confirmed current-base disagreement without updating snapshots merely to make the refactor pass. Current-base inventory, exclusions and development evidence can be completed while Epic 3.5 is still in progress.

At final integration, M5's merge gate records the completed-main revision/results, merges main into migration and resolves conflicts. Compare affected behavior with main without the refactor where necessary; attribute baseline refreshes to demonstrated intentional incoming changes and revalidate affected consumers plus the full suites. That future refresh does not prevent closing the current-base portion here.

**Gate:** preserved evidence, recorded current-base regression evidence/exclusions and an independently reviewed inventory/consumer-variant handoff. No resource migration starts from an unresolved current-base regression. Completed-Epic-3.5 integration is not part of this batch's completion gate.

### Batch 2 — Normal tooling, names and bounded comparison cleanup

**Complete and committed as `575b33b`.** Normal root workspace install/generation, descriptive names, comparison retirement and retained native/integrated checks pass. Gate: 525 server / 604 client / 235 tooling tests; unchanged Playwright: 219 passed / 18 skipped. [The progress ledger](m1-progress.md) records file/coverage disposition and limits. Batch 1 records the current-base inventory; Batch 3 and normal story review remain separate.

Move reusable generation, independent validation, type probes and drills out of comparison-only scaffolding. Prove a clean documented install makes normal generation and the gate work without an undocumented nested install. Keep runtime imports limited to the chosen foundation; keep developer-only validation/generation packages outside runtime/build imports.

Rename retained “pilot” artifacts/aliases/commands coherently, update regeneration messages and LF attributes, then execute the approved per-file comparison cleanup. Preserve evidence reachability/reproduction and all retained expectations. Update the tooling README and root architecture/type-sync guidance in the same change. No regeneration step opens a database or starts the application.

**Gate:** clean-install reproduction, deterministic generation, stale-output failure naming the command to run, artifact freshness and the shared gate. Report removed comparison-only test counts separately from unchanged product coverage.

### Batch 3 — Stable checks and shared vocabulary

Root-cause Windows port exhaustion with connection/server lifecycle evidence; trial persistent HTTP transport/agent or reduced redundant setup where suitable. If retiring comparison-only replays resolves the load, demonstrate that with before/after evidence; an additional agent refactor is not required for its own sake. Preserve fixture resets, database isolation, error/status assertions and existing external specs/helpers/configuration. A fixed sleep or a weakened test suite is not the fix. Prove a representative repeated HTTP-heavy run completes reliably, then stop repeating once stability is demonstrated.

Extract database-free domain tuples for `Side`/`PositionScope` (or prove equally small agreement checks where sharing is inappropriate). Schemas reference those tuples; existing unmigrated client boundaries remain explicit. Guard generation against importing database/app bootstrap. Record import-direction rules in owned architecture guidance.

Probe independent route discovery, preferably from actual mounted routers. Verify omissions and method/path normalization with an explicit test-route exclusion. If Express introspection is too fragile, use a separately reviewed route inventory plus a practical omission check; do not compare two lists derived from operation metadata. Extend the assembler for ordinary HTTP methods, 201, bodyless 204 and per-status error schemas without prematurely building a converter. Check query-schema keys against parameter descriptors.

Add operation/status-driven real-response validation and deliberate missing-operation, wrong-associated-schema and malformed-response failures. Retain independent expected outcomes and useful native conversion probes. Assess the Coder's parse-stage differential probe for a bounded deterministic test budget; a million generated bodies in every gate is not required without evidence of value.

**Gate:** shared gate, independent omission/association failures, conversion checks, no database imported by generation and documented transport stability. Reconciler verifies the corpus's catalog claims; retain snapshot response assertions even if their catalog mapping is unconfirmed. Any necessary ID metadata correction must be isolated from snapshot payload/expectation changes.

## Code map and makes-dead account

| Area | Change / makes dead |
|---|---|
| Root/server tooling manifests and lockfiles; chosen normal tool package | Supported install and generation; makes the hidden comparison-package install dependency dead after reusable tools move |
| `server/tests/contracts/prototypes/` | Per-file split: retain production checks/probes/drills; archive reference identifies retired alternative candidates and exclusive comparison tests/artifacts |
| `server/src/schemas/openapi.ts`, common schemas; database-free domain vocabulary | Ordinary operation/status support, independent context probes and shared enums; no domain database imports |
| Generated OpenAPI/client files and alias callers; `.gitattributes` | Descriptive names, correct partial scope, mechanical regeneration and LF policy |
| Contract test transport/fixtures; retained corpus/harness | Connection lifecycle stability and association checks; no discarded behavioral expectations |
| Root `AGENTS.md` and tooling instructions | Current ownership/import boundaries and one visible regeneration/check path |

## Acceptance

- Current-base revision and preserved evidence references are recorded; retained characterization and required suites pass against that development baseline. Final completed-main integration is explicitly handed to the merge gate, not an M1 blocker.
- A clean documented install supports the normal gate/generation; old hidden install and alternative runtime dependencies are absent.
- Retained evidence is reproducible; only enumerated comparison-only experiments are retired. Product tests, corpus data and useful coverage remain.
- Generation is deterministic, database-free and freshness-checked; stale failures explain regeneration. Domain vocabulary and generated/UI boundaries have explicit owners.
- Actual operation inventory and per-status response association have independent checks; status/metadata growth alone has not been mistaken for D4's trigger.
- HTTP tests are stable without waiting out port exhaustion as an operating procedure; all shared gates and normal structural-refactor audit/handoffs pass.

## Open questions and handoff

**Coder/Architect, within Batch 2/3:** choose proven peer-compatible packaging, HTTP lifecycle fix and independent route-discovery mechanism. These are implementation probes, not unresolved product policy. Record any concrete blocker before requesting a scope change. No Q3–Q6 ruling blocks this story.

**PO/Test Planner/Reconciler:** no new product rule or Planned passage is built. Confirm case mappings by full assertions; do not certify the corpus from its titles. Known wiki/observed disagreements stay in the named post-migration queue. No catalog edits are made by this plan.

**Coder/Architect:** hand M2 the current development revision, inventory, command paths, response variants, retained tests, stable transport and import rules. Fill the makes-dead inventory and normal review/closeout handoff before sign-off. Hand M5 the final-integration refresh requirements separately.

## Amendments

- **2026-10-30:** Drafted under Nathan's approved reuse/integration strategy. Planning only; no evidence tag, branch, merge, cleanup or implementation has been performed.
- **2026-10-30:** Nathan created the completed-evidence and migration branches, confirmed Epic 3.5 is still in progress, and authorized proceeding with cleanup. Started Batch 2 against the current base while retaining Batch 1's completed-main baseline as pending. No main merge, role sign-off or M1 completion is claimed.
- **2026-10-30:** Completed the tooling-cleanup batch with clean root workspace install, retained drills/conversion probes, unchanged contract data/product tests, passing final full gate and unchanged Playwright. The current-base gate → E2E → final-gate sequence passed without cooldown/connection failure. Completed-main integration, later vocabulary/inventory/association work and normal story review remain pending; changes are uncommitted.
- **2026-10-30:** Nathan committed cleanup as `575b33b` and clarified that all migration stories proceed alongside Epic 3.5. Corrected Batch 1 to use current-base evidence/inventory; moved completed-main comparison and refresh to the final merge gate. No remaining M1 batch waits for Epic 3.5 completion.
- **2026-10-30:** Finished Batch 1's current-base source inventory, consumer/response handoff and owned exclusion record. Independently matched all 54 method/path rows, counted 26 Bruno requests and traced 18 existing skipped specs. Added source-observed CF7 to receiving work without changing behavior. Planning documents only; Batch 3 and normal story review remain pending.

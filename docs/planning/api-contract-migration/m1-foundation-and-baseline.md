# API Contract M1 — Foundation, Integration and Baseline

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** reviewed planning/evidence checkpoint and completed Epic 3.5 for the operative integration baseline

## Goal

Turn the retained pilot into normal maintainable infrastructure and prove its compatibility with completed Epic 3.5 before migrating more endpoints. The [roadmap decisions and shared gate](README.md) apply. Do not change any REST/MCP capability, existing error, input policy, UI behavior or database schema.

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

### Batch 1 — Preserve evidence and establish the completed-main baseline

Verify the evidence reference and migration branch exist under Nathan's selected strategy; create them only under his subsequent direction. After Epic 3.5 closes, record finished-main revision, passing gate/E2E results and owned baseline exclusions. Merge `main` into the migration branch and resolve conflicts, respecting intended Epic 3.5 behavior.

Compare pilot behavior with the finished-main implementation. Where needed, run the characterization harness alone against a controlled main checkout, without carrying Zod handlers into that baseline. Preserve the original spike captures historically. Any baseline refresh must be attributable to an intentional main change demonstrated without the refactor, isolated in its own reviewed record; do not update snapshots because the feature branch disagrees. If conflicts affect drag/API consumers, verify those exact scenarios as well as the full suites.

Build an independent method/path inventory including health and every non-test router, response/status variants and known consumers. Record exclusions explicitly. The current 54-operation source scan is an input, not the target count after integration. Assign each operation to M2/M3/M4 or the retained pilot.

**Gate:** reviewed integration diff, reproducible completed-main versus pilot evidence, owned exclusions and an independently reviewed inventory. No remaining endpoint migration starts from an unresolved regression.

### Batch 2 — Normal tooling, names and bounded comparison cleanup

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

- Completed-main revision and retained evidence references are recorded; the integrated pilot is regression-free against that baseline.
- A clean documented install supports the normal gate/generation; old hidden install and alternative runtime dependencies are absent.
- Retained evidence is reproducible; only enumerated comparison-only experiments are retired. Product tests, corpus data and useful coverage remain.
- Generation is deterministic, database-free and freshness-checked; stale failures explain regeneration. Domain vocabulary and generated/UI boundaries have explicit owners.
- Actual operation inventory and per-status response association have independent checks; status/metadata growth alone has not been mistaken for D4's trigger.
- HTTP tests are stable without waiting out port exhaustion as an operating procedure; all shared gates and normal structural-refactor audit/handoffs pass.

## Open questions and handoff

**Coder/Architect, within Batch 2/3:** choose proven peer-compatible packaging, HTTP lifecycle fix and independent route-discovery mechanism. These are implementation probes, not unresolved product policy. Record any concrete blocker before requesting a scope change. No Q3–Q6 ruling blocks this story.

**PO/Test Planner/Reconciler:** no new product rule or Planned passage is built. Confirm case mappings by full assertions; do not certify the corpus from its titles. Known wiki/observed disagreements stay in the named post-migration queue. No catalog edits are made by this plan.

**Coder/Architect:** hand M2 the actual integrated revision, inventory, command names/paths, declared response variants, retained test account, stable transport and import rules. Fill the makes-dead inventory and normal story audit/closeout handoff before sign-off.

## Amendments

- **2026-10-30:** Drafted under Nathan's approved reuse/integration strategy. Planning only; no evidence tag, branch, merge, cleanup or implementation has been performed.

# API Contract M1 — Foundation, Integration and Baseline

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** Batches 1–3 committed (Batch 3 as `4ecd49b`); story audit and proposing Reconciler run done; audit Fix Now Batches 4–5 planned, not started · **Depends on:** preserved planning/evidence checkpoint and current-branch baseline; Epic 3.5 completion is not a prerequisite

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

**Technical batch complete and verified; normal story review pending.** [The progress ledger](m1-progress.md) records the tuples/import guard, actual-mount discovery with owned pending scope, per-status assembler and real-response associations, 487 bounded parse probes, fault checks and two repeated green contract-suite runs. [The corpus claim precheck](m1-corpus-coverage-review.md) reviews every original claimed ID, isolates one title/key correction and supplies the normal Reconciler handoff. No generated shape, endpoint behavior or external test changed. Final full gate: 536 server / 604 client / 235 tooling tests; unchanged Playwright: 219 passed / 18 inherited skips, both with native exit 0. Normal story audit/Reconciler approval is not claimed by this implementation account.

Root-cause Windows port exhaustion with connection/server lifecycle evidence; trial persistent HTTP transport/agent or reduced redundant setup where suitable. If retiring comparison-only replays resolves the load, demonstrate that with before/after evidence; an additional agent refactor is not required for its own sake. Preserve fixture resets, database isolation, error/status assertions and existing external specs/helpers/configuration. A fixed sleep or a weakened test suite is not the fix. Prove a representative repeated HTTP-heavy run completes reliably, then stop repeating once stability is demonstrated.

Extract database-free domain tuples for `Side`/`PositionScope` (or prove equally small agreement checks where sharing is inappropriate). Schemas reference those tuples; existing unmigrated client boundaries remain explicit. Guard generation against importing database/app bootstrap. Record import-direction rules in owned architecture guidance.

Probe independent route discovery, preferably from actual mounted routers. Verify omissions and method/path normalization with an explicit test-route exclusion. If Express introspection is too fragile, use a separately reviewed route inventory plus a practical omission check; do not compare two lists derived from operation metadata. Extend the assembler for ordinary HTTP methods, 201, bodyless 204 and per-status error schemas without prematurely building a converter. Check query-schema keys against parameter descriptors.

Add operation/status-driven real-response validation and deliberate missing-operation, wrong-associated-schema and malformed-response failures. Retain independent expected outcomes and useful native conversion probes. Assess the Coder's parse-stage differential probe for a bounded deterministic test budget; a million generated bodies in every gate is not required without evidence of value.

**Gate:** shared gate, independent omission/association failures, conversion checks, no database imported by generation and documented transport stability. Reconciler verifies the corpus's catalog claims; retain snapshot response assertions even if their catalog mapping is unconfirmed. Any necessary ID metadata correction must be isolated from snapshot payload/expectation changes.

### Audit fix batches — scope and sorting

The [story audit](../../audits/code-quality-audit-m1-foundation.md) (range `c1aa1de9..4ecd49bb`) and the [proposing Reconciler run](../../audits/m1-reconciler-report.md) are sorted by one rule. The existing suite passing unchanged is the migration's regression evidence, so:

- **Fixed here (Batches 4–5):** findings in code the migration wrote (contract tooling, contract tests, schemas, transport types) and their wrong comments or titles. None changes an app behavior or a product test's expectation.
- **Catalogued, not fixed:** anything that would change an app behavior or an existing test's expectation goes to [the open-questions catalog](m1-catalog-open-questions.md) (OQ1–OQ11), for after the migration.
- **Routed to the story that reworks the code:** M2 receives audit #12 and the Watch List items its handlers and contract files reopen; M4 receives #16; M5 receives the UI-touching #28 and the Epic 3.5 coverage checks for after the main merge.
- **Left to Epic 3.5 on `main`:** DRAG-7.27's lost coverage and DRAG-7.15's skipped specs (Story 10 and Story 8's close-out Reconcilers own them). Nothing in the drag catalog or specs is touched on this branch.

Every batch below changes tooling, test infrastructure, types or comments only. The one runtime file is `parseRequest.ts`, and its change is type-only. Each batch ends with `npm run check` and a stop for Nathan's review and commit. Neither needs `npm run test:e2e` (no runtime behavior changes). Run it once after Batch 5 as M1's closing evidence.

### Batch 4 — Contract tooling and test-infrastructure correctness

Audit Fix Now #1, #3 and #4, with the optional #18, #19, #21, #22 and #24–#26 and the Reconciler's two tooling notes.

- **#1, with #24, #25 and #26** (`tools/api-contracts/fieldDrills.ts`, `artifacts.ts`):
  - Print `report` from the `finally` (or to stderr before rethrowing) and put the failing stage's output and diagnostics in each thrown error.
  - #24: count the nullability drill as detected only on the expected `400`-for-`200` failure, and require a clean baseline before each drill. This also turns the Reconciler's note (TQ7: the drill picks its corpus example by the title filter `-t ATT-9.11`) into a loud failure if that example is ever retitled, rather than a false detection.
  - #25: export the generated-artifact targets from `artifacts.ts` instead of the drill's own list, and compile each drill's diagnostics once.
  - #26: restore each file in its own `try`. Signal handlers are not needed; the README's clean-tree step stays.
  - Probe (audit-workflow §8): break one drill on purpose and show the report and cause printed, then restore.
- **#3** (`server/tests/contracts/routeDiscovery.ts`): throw on a `mounted_app` layer so the header's "unknown layouts fail explicitly" is true. Add one fault test beside the existing ones in `routeDiscovery.test.ts`.
- **#21** (`tools/api-contracts/document.ts:27`): throw on an unknown schema name. Drop the now-redundant guard at `responses.ts:50`.
- **#22** (`tools/api-contracts/responses.ts`): make `ObservedResponse.text` required; both callers in `apiContracts.test.ts` already pass it. The first bodyless response M2–M4 registers then works.
- **#18** (`server/src/lib/parseRequest.ts`): restrict the schema parameter to object schemas, so a falsy successful parse can't be read as "400 sent". All four callers pass object schemas. Type-only, before M2–M4 add about 45 callers.
- **#19** (`compatibilityHarness.ts`): put `response.body` and the captured `console.error` calls into the status assertion's message. No snapshot changes.
- **Reconciler note, `generationBoundary.test.ts:65-78`:** add a positive control showing that opening the database module with that `DB_PATH` does fail, so the freshness subprocess passing proves generation never opened it.
- **#4** (`scripts/audit-scope/scan.mts`, root `AGENTS.md`): add `tools` to `INCLUDE`, add a scripts test that every non-docs `check-docs` `DEFAULT_SCOPE` entry falls under some `INCLUDE` entry, and add a `tools/` line to `AGENTS.md`'s repo layout. `scripts/audit-scope/` is shared with `main`; expect a one-line merge at final integration.

**Size and risk:** about nine files, all tooling or test code plus one type signature. Gate: `npm run check`, plus `npm run contracts:drill` once (its output is what #1 changes).

### Batch 5 — Client reindex envelope, titles and comments

Audit Fix Now #5, #2, #8, #6 and #7, and the audit's notes for the plan owner.

- **#5** (`client/src/api/shared.ts`, `transportTypes.ts`): make `ReindexedPosition` an alias of the generated schema. Build `PositionedWriteResponse<Row>` once from the generated declarations, with a `Pick` on `reindexed` so a renamed key is a build error. Define `ItemWriteResponse` and `ProjectWriteResponse` from it, keeping both names. This makes the `shared.ts` header and its comment true again.
  - **Boundary:** no file outside `client/src/api/` and `client/src/lib/positionedWrite.ts` changes. Every UI and drag caller (`App.tsx`, `components/`, `components/workflow/`) uses the existing names. If one stops compiling, stop and defer that part to M5's post-merge work rather than editing a UI file here.
- **#2** (`compatibilityCases.ts:126`, snapshot key): rename to `'item done anchor in scope refused for missing position'`. As with Batch 3's `TC-X.6` correction, it's a key rename only: compare all 77 payload strings before and after. The example carries no case ID, and the drill doesn't select it. No precedence case is added (the order of refusals is a detail the wiki leaves open).
- **#8** (`compatibilityCases.ts:1`): the header names the two current consumers, `apiCompatibility.test.ts` and `apiContracts.test.ts`, not the retired candidates.
- **#6** (`client/src/api/projects.ts:6-7`): delete the floating comment; `transportTypes.ts` carries the type.
- **#7** (`server/src/schemas/common.ts:1-2`): reword the header to what the file holds.
- **Audit note, `HierarchyRequest`:** it's now an alias of `HierarchyInput` (`itemHierarchy.ts:44`). Check that the A6 per-field comments survive on `HierarchyInput`, and restore any that were lost.
- **No change:** `api-contract-framework-spike-results.md:155` describes the spike's baseline, where those declarations did live in `items.ts`/`projects.ts`.

**Size and risk:** about six files. Client change is type-only; the one snapshot edit is a key rename. Gate: `npm run check`, the payload comparison, then the closing E2E run.

### M1 close-out after Batch 5

1. Fill the audit's close-out table from the current code (rows 1–8 fixed, 9–11 catalogued, 12 routed to M2), archive the report and delete `docs/audits/m1-foundation-scopes/`.
2. The confirming Reconciler run has nothing to write on this branch: DRAG-7.27 stays with `main`'s Story 10, and the ATT-7.1 stamp is OQ11. It records that and archives the report.
3. Update the progress ledger and this plan's status, and sign off.

## Code map and makes-dead account

| Area | Change / makes dead |
|---|---|
| Root/server tooling manifests and lockfiles; chosen normal tool package | Supported install and generation; makes the hidden comparison-package install dependency dead after reusable tools move |
| `server/tests/contracts/prototypes/` | Per-file split: retain production checks/probes/drills; archive reference identifies retired alternative candidates and exclusive comparison tests/artifacts |
| `server/src/schemas/openapi.ts`, common schemas; database-free domain vocabulary | Ordinary operation/status support, independent context probes and shared enums; no domain database imports |
| Generated OpenAPI/client files and alias callers; `.gitattributes` | Descriptive names, correct partial scope, mechanical regeneration and LF policy |
| Contract test transport/fixtures; retained corpus/harness | Connection lifecycle stability and association checks; no discarded behavioral expectations |
| Root `AGENTS.md` and tooling instructions | Current ownership/import boundaries and one visible regeneration/check path |

**Batch 3 symbol account:** `domain/positioning.ts::{sides, positionScopes}` replaces authored enum unions in the two domain helper exports and schemas; generated client vocabulary replaces its manual union. `openapi.ts::createContractDocument` owns status/parameter metadata validation, and `responses.ts::responseAssertion` replaces the retained loop's inferred success/error schema choice. `routeDiscovery.ts::{discoverRoutes, assertRouteCoverage}` and the owned pending-operation fixture replace corpus-only completeness as the migration gate; the original characterized-scope check remains as a narrower regression assertion. `generationBoundary.test.ts`, `operationMetadata.test.ts`, `parseParity.test.ts` and `routeDiscovery.test.ts` add eleven infrastructure tests. No product test/helper or captured payload is retired.

## Acceptance

- Current-base revision and preserved evidence references are recorded; retained characterization and required suites pass against that development baseline. Final completed-main integration is explicitly handed to the merge gate, not an M1 blocker.
- A clean documented install supports the normal gate/generation; old hidden install and alternative runtime dependencies are absent.
- Retained evidence is reproducible; only enumerated comparison-only experiments are retired. Product tests, corpus data and useful coverage remain.
- Generation is deterministic, database-free and freshness-checked; stale failures explain regeneration. Domain vocabulary and generated/UI boundaries have explicit owners.
- Actual operation inventory and per-status response association have independent checks; status/metadata growth alone has not been mistaken for the roadmap's D6 trigger.
- HTTP tests are stable without waiting out port exhaustion as an operating procedure; all shared gates and normal structural-refactor audit/handoffs pass.

## Open questions and handoff

**Coder/Architect, within Batch 2/3:** choose proven peer-compatible packaging, HTTP lifecycle fix and independent route-discovery mechanism. These are implementation probes, not unresolved product policy. Record any concrete blocker before requesting a scope change. No Q3–Q6 ruling blocks this story.

**PO/Test Planner/Reconciler:** no new product rule or Planned passage is built. Confirm case mappings by full assertions; do not certify the corpus from its titles. Known wiki/observed disagreements stay in the named post-migration queue. No catalog edits are made by this plan.

**Coder/Architect:** hand M2 the current development revision, inventory, command paths, response variants, retained tests, stable transport and import rules. Fill the makes-dead inventory and normal review/closeout handoff before sign-off. Hand M5 the final-integration refresh requirements separately.

**Answered by Nathan, 2026-11-08 (from the Reconciler run):**
- **`server/tests/contracts/` is not a counting surface** for lost-coverage scans. Its case IDs are supplementary claims; a case whose only ID-bearing test is in the corpus goes `Open`. Recorded in the [migration README's shared gate](README.md#shared-batch-gate).
- **A change to an ID-bearing corpus snapshot goes past the Reconciler.** Recorded in the same gate.

## Living-docs and review handoff

- **Behavior decisions / PO:** none newly made; no Planned passage built, superseded passage, wiki renumbering or product-field change. CF1–CF7 retain their receiving dispositions; capture current outcomes rather than correcting them during migration.
- **Implementation guidance:** root `AGENTS.md` and the tooling README now describe neutral vocabulary/import direction, actual-route/pending-scope checks and status-selected response validation. Applied with this change; no `.claude/` guide/persona edit requested.
- **Test Planner/Reconciler:** receive the [corpus claim review](m1-corpus-coverage-review.md). Only `TC-X.6` was removed from one mislabelled corpus title and its snapshot key; the true surface test remains. All payload expectations are unchanged. No case status or catalog pointer has been edited. The normal finished-code Reconciler still checks the whole catalog for lost coverage after Batch 2's file moves/retirement and decides any proposed additional mappings.
- **Auditor:** review the structural refactor under the normal committed scope, including retained checks, pending-operation accounting, import direction and metadata association faults. This implementation/precheck is not a cold audit or story sign-off.
- **M2–M4:** remove pending entries as their contracts land; retain direct expected-status/database assertions alongside metadata-selected validation. All 50 pending entries still require migration and per-resource pre-replacement HTTP characterization. Existing hierarchy shape parsing inside the domain primitive is unchanged; M2 still owns compatible route/domain separation.
- **Final integration:** refresh affected inventories/captures/consumers and combined suites after completed Epic 3.5 main is merged into the feature branch. This is the only Epic 3.5 completion dependency.

## Amendments

- **2026-10-30:** Drafted under Nathan's approved reuse/integration strategy. Planning only; no evidence tag, branch, merge, cleanup or implementation has been performed.
- **2026-10-30:** Nathan created the completed-evidence and migration branches, confirmed Epic 3.5 is still in progress, and authorized proceeding with cleanup. Started Batch 2 against the current base while retaining Batch 1's completed-main baseline as pending. No main merge, role sign-off or M1 completion is claimed.
- **2026-10-30:** Completed the tooling-cleanup batch with clean root workspace install, retained drills/conversion probes, unchanged contract data/product tests, passing final full gate and unchanged Playwright. The current-base gate → E2E → final-gate sequence passed without cooldown/connection failure. Completed-main integration, later vocabulary/inventory/association work and normal story review remain pending; changes are uncommitted.
- **2026-10-30:** Nathan committed cleanup as `575b33b` and clarified that all migration stories proceed alongside Epic 3.5. Corrected Batch 1 to use current-base evidence/inventory; moved completed-main comparison and refresh to the final merge gate. No remaining M1 batch waits for Epic 3.5 completion.
- **2026-10-30:** Finished Batch 1's current-base source inventory, consumer/response handoff and owned exclusion record. Independently matched all 54 method/path rows, counted 26 Bruno requests and traced 18 existing skipped specs. Added source-observed CF7 to receiving work without changing behavior. Planning documents only; Batch 3 and normal story review remain pending.
- **2026-10-30:** Nathan committed Batch 1 as `ee819ea` and directed Batch 3. Implemented shared vocabulary, independent mounted-route/pending-scope checks, ordinary status/parameter metadata, real response associations, database-free generation checks and bounded parse parity. Two focused runs and the first full gate pass. Corrected the corpus-ID counting omission and one incorrect `TC-X.6` title/key association without changing captured payloads. Final E2E/post-correction checks and normal M1 audit/Reconciler review remain pending; no commit or merge performed.
- **2026-10-30:** Completed Batch 3 verification: final full gate 536 server / 604 client / 235 tooling; unchanged Playwright 219 passed / 18 inherited skips in 3.8 minutes, native exit 0 for both. All 77 snapshot payload strings compare identically after the single key rename (Vitest sorts that entry alphabetically). Generated artifacts and external tests/configuration remain unchanged. Corrected library-trial cross-references to roadmap D6 without changing the decision. Batch ready for review/commit; normal M1 structural audit and finished-code Reconciler remain before story sign-off.
- **2026-11-08:** Batch 3 was committed as `4ecd49b`. The story audit and the proposing Reconciler run reported on 2026-11-07. Sorted their findings under Nathan's rule (fix migration code now; catalog behavior or test-expectation changes; defer Epic 3.5, drag and UI work until after the main merge). Added the sorting section, Batches 4–5, the close-out steps and two open questions. Extended the open-questions catalog to OQ11, and routed carry-forward findings into M2, M4 and M5's Inbound deferrals.
- **2026-11-08:** Nathan answered both open questions (the corpus is not a counting surface; ID-bearing snapshot changes go past the Reconciler), and both are now in the migration README's shared gate. The audit tag `m1-foundation-audited` goes on the docs-only commit that records the audit, the Reconciler run and this sorting, not on `4ecd49b`. That commit changes no code, so the next audit's range is the same either way.

# API Contract M5 — Completeness and Migration Acceptance

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** M4, completed Epic 3.5 integration and receiving evidence from M1–M4

## Goal

Prove the retained migration complete and regression-free, finish owner documentation handoffs, and prepare the feature-to-main merge. The [roadmap decisions and shared gate](README.md) apply. This story certifies technical coverage and compatibility within recorded evidence; it does not turn known legacy behavior into intended product rules.

Maintain a complete repository OpenAPI artifact and generated consumer declarations. Adding a public document endpoint, viewer or E2E-server response interception is not necessary for acceptance and remains a post-migration decision. If an actual new delivery requirement becomes essential, obtain a concrete ruling before changing the external surface/configuration.

## Inbound deferrals

- M1: independently established route inventory, normal install/generation/freshness, stable HTTP lifecycle, evidence reference and completed-main baseline.
- M2–M4: actual operation/status/response associations, request representation probes, consumer boundaries and all automated/manual scenario dispositions.
- Round table PO #1–#3 / Auditor #1/#3–#5: wiki owns meanings/refusals, generated reference owns exhaustive shapes, completeness has an independent reference, and catalog evidence is not inferred from a field's schema.
- Q3–Q6 and optional Q8/product/publication questions remain in receiving work after migration; they do not become open blockers simply because this story closes the refactor.

## Work, in batches

### Batch 1 — Independent coverage and conversion audit

Re-inventory actual mounted non-test operations and compare with the maintained contract, including health/read-only/nested paths. Account for methods, path/query fields, success statuses, absent bodies, richer errors, decorated/collection variants and optional disclosures. Confirm no route omitted from both examples and operation metadata can escape the independent check.

Audit actual operation/status/schema associations, not just component existence. Validate exercised real responses via the document's association and independently expected business outcome. Demonstrate failures for a missing operation, wrong association, stale generated file and response drift; restore faults afterward. Distinguish exercised variants from untested/manual ones and close gaps in migration scope.

Review every newly used refinement, default, normalization/coercion and input/output component context. Confirm D4 was checked on concrete needs and any triggered comparable trial was completed/selected with evidence. Runtime/emitted agreement is necessary but cannot prove a shared mistake matches the wiki.

**Gate:** complete inventory/disposition matrix, useful negative probes, restored artifacts and shared gate pass.

### Batch 2 — Reference and owner handoffs

Mark the repository artifact complete only after Batch 1. Retain generated ownership/regeneration instructions and a fresh-check command as the normal workflow. Use technical descriptions that reference business-rule wiki sections rather than duplicating their prose; verify those pointers. Assess a small wiki-route-to-operation check using agreed route notation, with a practical cost/value fallback if prose parsing is fragile.

PO reviews actual wiki overlap. Preserve API vocabulary, null/omission semantics, refusal/status/state rules and response meanings that a caller acts on; remove only genuinely redundant exhaustive shape reference if present. Do not presume a large wiki rewrite. PO owns any edits and planned-marker decisions; no business rule is changed for a matching generated document.

Architect drafts any necessary documentation-standard/Planner-guide/generated-reference ownership changes for the normal Nathan approval process. Nathan has already permitted generated-reference reading; a missing future generated page does not stop test planning. CF6's unrelated stale worked example remains in its named receiving task unless separately authorized.

Test Planner/Reconciler verify the full Given/When/Then for affected case mappings, including corpus IDs and existing skip ownership. Keep current catalog statuses/evidence requirements; generated fields alone confer no status. Do not resolve a rule conflict by silently making the case follow code. Existing known disagreements retain their named deferrals.

**Gate:** owner-applied handoffs or explicitly receiving work for nonessential corrections, documentation/pointer checks, justified catalog evidence and required audit/reconciliation complete. Any genuinely required approval has a concrete draft; no abstract blanket sign-off is requested.

### Batch 3 — Final regression and merge readiness

Verify the migration branch contains the final Epic 3.5 `main` revision and any subsequently accepted main changes. If `main` advanced, merge it into the feature branch, resolve conflicts and refresh the explicit baseline account before reporting final evidence. Do not substitute the old spike's 219/18 result or old snapshot captures for the operative baseline.

Run the full gate and unchanged Playwright suite plus contract/consumer checks against the retained implementation. Compare completed-main outcomes and distinguish pre-existing exclusions, intentional main changes and new regressions. Record all actual revisions, commands, operation/variant coverage, test replacements limited by the approved policy, catalog dispositions and remaining human maintenance. No deferred correction is slipped into this batch.

Complete normal structural-refactor audit/closeout, then prepare the reviewed feature-to-main merge for Nathan. The order is completed Epic 3.5 → main into migration with resolved/verified integration → migration into main. After an authorized merge, verify the resulting main revision, generated freshness and required gates; do not discard the pre-merge evidence if integration changes require another run.

**Gate:** no unresolved migration regression, accepted exclusions/follow-up destinations, owner handoffs and final retained-code evidence. Merge and sign-off remain Nathan's actions/directions, not consequences of passing tests.

## Code map

| Area | Change |
|---|---|
| Independent route/operation/response matrix and contract checks | Completeness and correct associations; do not merely compare registry-derived lists |
| Generated OpenAPI/client artifacts and normal tooling docs | Complete repository reference, mechanical updates and useful stale diagnostics |
| Wiki/test plans, root architecture and relevant process guides | Owner-applied factual/technical handoffs only; normal approvals for guide changes |
| Planning/evidence records and feature/main integration | Final revisions, actual test results, reconciliation and explicit follow-up ledger |

## Acceptance

- Every actual non-test operation is accounted for, with correct request/parameter/status/response associations, explicit bodyless cases and tested/manual variant dispositions. No partial document is called complete.
- Generated consumers update from owned shapes; remaining intentional independent declarations and authored scenarios have agreement checks or named review/audit responsibility.
- The integrated implementation passes the required suites against completed-main with unchanged external behavioral expectations. No test/library agreement is presented as exhaustive business correctness.
- Required PO/Test Planner/Reconciler/audit/architecture handoffs are complete. Known deferred behavior decisions are received after migration rather than blocking closure under a false “everything is settled” claim.
- The merge sequence and resulting-main verification are recorded when executed; no public endpoint/viewer, new MCP capability or E2E interception has been added as closeout cleanup.

## Open questions and handoff

**Migration owners:** implementation/coverage defects discovered here are fixed in the appropriate migration batch and rechecked. Concrete unavoidable compatibility changes go to Nathan; no new universal policy is inferred from a library limitation.

**Post-migration decision story:** receive Q3–Q6/CF findings and the future-wording, optional deprecation/MCP/publication/Q8 proposals, with the accepted baseline and evidence. Product correctness decisions may then change contracts, wiki, test plans and captures deliberately in separately authorized stories.

**Nathan:** authorize the prepared merge/sign-off when the concrete retained result is reviewable. Follow the normal story/epic archival process at sign-off, without rewriting the preserved comparison evidence.

## Amendments

- **2026-10-30:** Drafted with repository-artifact completeness as migration acceptance. Optional new reference delivery and response interception are deferred; no code, owner handoff, merge or sign-off is performed by this plan.

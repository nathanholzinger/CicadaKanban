# API Contract M5 — Completeness and Migration Acceptance

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** M4 and evidence from M1–M4; completed Epic 3.5 is required only for final integration/merge acceptance

## Goal

Prove the migration branch complete and regression-free against its recorded development baseline, finish owner handoffs, and prepare final integration/merge. All implementation, completeness review and current-branch validation can proceed alongside Epic 3.5. The [roadmap decisions and shared gate](README.md) apply. Final completed-main revalidation is a separate merge gate, not a prerequisite of M5 implementation. This story does not turn preserved legacy behavior into intended product rules.

Maintain a complete repository OpenAPI artifact and generated consumer declarations. Adding a public document endpoint, viewer or E2E-server response interception is not necessary for acceptance and remains a post-migration decision. If an actual new delivery requirement becomes essential, obtain a concrete ruling before changing the external surface/configuration.

## Inbound deferrals

- M1: current-branch route inventory, normal install/generation/freshness, stable HTTP lifecycle, evidence reference and development baseline. Final completed-main comparison is received as a merge-gate task, not a missing M1 deliverable blocking this story.
- M2–M4: actual operation/status/response associations, request representation probes, consumer boundaries and all automated/manual scenario dispositions.
- Round table PO #1–#3 / Auditor #1/#3–#5: wiki owns meanings/refusals, generated reference owns exhaustive shapes, completeness has an independent reference, and catalog evidence is not inferred from a field's schema.
- Q3–Q6 and optional Q8/product/publication questions remain in receiving work after migration; they do not become open blockers simply because this story closes the refactor.
- **After the main merge only:**
  - [M1 story audit](../../audits/code-quality-audit-m1-foundation.md) #28: `transportTypes.ts` rebuilds `UiItem`/`ItemDetailResponse` beside `types.ts`'s `ItemDetail`/`ActivityLogEntry`, and they differ (`workflowId?`). `ItemDetailPanel.tsx:126` stores one in the other's state. Alias the `types.ts` shapes to the generated declarations once Epic 3.5's UI changes are merged in.
  - [M1 Reconciler run](../../audits/m1-reconciler-report.md): confirm that `main`'s Story 10 and Story 8 Reconcilers settled DRAG-7.27 (only spec skipped, proposed `Open`) and DRAG-7.15 (two below-gap specs skipped). Any status they left unwritten is written by the post-merge Reconciler run.
  - OQ11 in [the M1 open-questions catalog](m1-catalog-open-questions.md) (the ATT-7.1 stamp) touches a test file shared with `main`. It's applied after the merge, if approved.

## Work, in batches

### Batch 1 — Independent coverage and conversion audit

Re-inventory actual mounted non-test operations and compare with the maintained contract, including health/read-only/nested paths. Account for methods, path/query fields, success statuses, absent bodies, richer errors, decorated/collection variants and optional disclosures. Confirm no route omitted from both examples and operation metadata can escape the independent check.

Audit actual operation/status/schema associations, not just component existence. Validate exercised real responses via the document's association and independently expected business outcome. Demonstrate failures for a missing operation, wrong association, stale generated file and response drift; restore faults afterward. Distinguish exercised variants from untested/manual ones and close gaps in migration scope.

Review every newly used refinement, default, normalization/coercion and input/output component context. Confirm roadmap D6 was checked on concrete needs and any triggered comparable trial was completed/selected with evidence. Runtime/emitted agreement is necessary but cannot prove a shared mistake matches the wiki.

**Gate:** complete inventory/disposition matrix, useful negative probes, restored artifacts and shared gate pass.

### Batch 2 — Reference and owner handoffs

Mark the repository artifact complete only after Batch 1. Retain generated ownership/regeneration instructions and a fresh-check command as the normal workflow. Use technical descriptions that reference business-rule wiki sections rather than duplicating their prose; verify those pointers. Assess a small wiki-route-to-operation check using agreed route notation, with a practical cost/value fallback if prose parsing is fragile.

PO reviews actual wiki overlap. Preserve API vocabulary, null/omission semantics, refusal/status/state rules and response meanings that a caller acts on; remove only genuinely redundant exhaustive shape reference if present. Do not presume a large wiki rewrite. PO owns any edits and planned-marker decisions; no business rule is changed for a matching generated document.

Architect drafts any necessary documentation-standard/Planner-guide/generated-reference ownership changes for the normal Nathan approval process. Nathan has already permitted generated-reference reading; a missing future generated page does not stop test planning. CF6's unrelated stale worked example remains in its named receiving task unless separately authorized.

Test Planner/Reconciler verify the full Given/When/Then for affected case mappings, including corpus IDs and existing skip ownership. Keep current catalog statuses/evidence requirements; generated fields alone confer no status. Do not resolve a rule conflict by silently making the case follow code. Existing known disagreements retain their named deferrals.

**Gate:** owner-applied handoffs or explicitly receiving work for nonessential corrections, documentation/pointer checks, justified catalog evidence and required audit/reconciliation complete. Any genuinely required approval has a concrete draft; no abstract blanket sign-off is requested.

### Batch 3 — Migration-branch regression and integration readiness

Record the migration branch revision and the main ancestry used for development. Run the full gate, unchanged Playwright and contract/consumer checks against the retained branch implementation; compare with recorded baseline behavior and distinguish existing exclusions from regressions. Record actual operation/variant coverage, approved internal-test replacements, catalog dispositions and human maintenance. Do not substitute the spike's old counts for new results or slip deferred corrections into closeout.

Complete applicable structural-refactor review/owner handoffs and prepare an explicit final-integration checklist for Nathan. This work can complete before Epic 3.5. Record any integration-dependent release acceptance as pending without blocking other M5 work or claiming that combined branches have already been verified.

**Development gate:** complete current-branch evidence, owner handoffs, no unresolved migration regression and a concrete final-integration checklist. M5 implementation is ready independently of Epic 3.5's completion; final merge/sign-off remains subject to the gate below.

### Final integration/merge gate — after Epic 3.5

Once Epic 3.5 finishes, record its final main revision/results, merge main into the migration feature branch and resolve conflicts. Preserve intentional incoming changes. Refresh affected inventory, response variants, consumer contracts and characterization, comparing against main without the refactor where necessary. Reopen affected completeness work if main adds or changes API surface; a previously complete feature-branch artifact is not proof for new incoming code.

Rerun required suites against the combined implementation and account for intentional main changes versus migration regressions. If main advances again, repeat affected integration checks. Then prepare the feature-to-main merge for Nathan and verify the resulting main revision after authorization. No feature-to-main merge occurs before Epic 3.5 completion and combined-result validation. This deferred gate does not prevent M1–M5 development or current-branch reviews from completing now.

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
- The migration branch passes required suites against its recorded development baseline with unchanged external behavioral expectations. Final completed-main integration refreshes affected evidence and reruns those suites before merge acceptance; it is not an implementation prerequisite. No test/library agreement is presented as exhaustive business correctness.
- Required PO/Test Planner/Reconciler/audit/architecture handoffs are complete. Known deferred behavior decisions are received after migration rather than blocking closure under a false “everything is settled” claim.
- The merge sequence and resulting-main verification are recorded when executed; no public endpoint/viewer, new MCP capability or E2E interception has been added as closeout cleanup.

## Open questions and handoff

**Migration owners:** implementation/coverage defects discovered here are fixed in the appropriate migration batch and rechecked. Concrete unavoidable compatibility changes go to Nathan; no new universal policy is inferred from a library limitation.

**Post-migration decision story:** receive Q3–Q6/CF findings and the future-wording, optional deprecation/MCP/publication/Q8 proposals, with the accepted baseline and evidence. Product correctness decisions may then change contracts, wiki, test plans and captures deliberately in separately authorized stories.

**Nathan:** authorize the prepared merge/sign-off when the concrete retained result is reviewable. Follow the normal story/epic archival process at sign-off, without rewriting the preserved comparison evidence.

## Amendments

- **2026-10-30:** Drafted with repository-artifact completeness as migration acceptance. Optional new reference delivery and response interception are deferred; no code, owner handoff, merge or sign-off is performed by this plan.
- **2026-10-30:** Nathan clarified parallel migration/Epic 3.5 work. Separated M5's implementation/reference/current-branch regression completion from the final completed-main integration/merge gate. No story waits for Epic 3.5 except that final gate.

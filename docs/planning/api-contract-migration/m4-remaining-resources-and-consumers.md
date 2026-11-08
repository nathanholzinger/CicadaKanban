# API Contract M4 — Remaining Resources and Consumers

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** M3 and M1's independent inventory/tooling

## Goal and scope

Complete the remaining non-test API contracts and client/MCP/Bruno agreement work under the [roadmap's compatibility policy and gate](README.md). Initial scope is 23 operations: agents (4), attachments (3), labels (6), item types (4), notifications (3), workflow templates (2) and health (1). M1 confirms the current-branch inventory and actual routes; final integration later accounts for incoming changes. Tables with no API create no new endpoints, and M4 does not wait for Epic 3.5 completion.

M2/M3 own their resource schemas; this story completes cross-resource consumer agreement instead of recreating those shapes. Preserve provisional labels, current tool capabilities, authored scenarios, and exact existing response/error/normalization behavior.

## Inbound deferrals and decisions

- M1's [source inventory](m1-api-inventory.md), I32–I54, supplies current variants/callers and all eight MCP/26 Bruno mappings. CF7's attachment and label missing-reference outcomes require HTTP/no-write characterization before replacement; preserve resource-specific statuses and defer policy changes until after migration.
- Round table Architect #8 and Auditor #4/#7: expand independent registration, shared-field MCP and authored Bruno checks without confusing schema compatibility with business correctness.
- Test Planner: bounded stdio evidence must cover tool listing, existing get/move success and error/result delivery, including a representative raw/malformed argument. HTTP-backed helper tests alone do not prove SDK dispatch.
- CF5/Q6: no runtime MCP argument validation, SDK registration migration, generic snake-case converter, new tools or expanded inputs. Reuse primitive/field contracts only where interfaces mean the same thing; requiredness and exposure can intentionally differ.
- No label consolidation, attachment UI, chat API, auth or polling redesign. No new field is introduced simply to make schemas uniform.
- [M1 story audit](../../audits/code-quality-audit-m1-foundation.md) #16 (optional): `apiContracts.test.ts` covers both the HTTP contract and `lib/mcpItemTools.ts`. Move the MCP describe to `mcpItemTools.test.ts` when MCP checks expand. OQ7 in [the M1 open-questions catalog](m1-catalog-open-questions.md) (`urlPart` lets `.` and `..` through) stays preserved with CF5.
- Preserve product tests. Technical shape/scenario checks are additions; a fresh generated schema is not an independent expected business outcome.

## Work, in batches

### Batch 1 — Agents, attachments and item types

Characterize current create/edit/list/delete and nested attachment forms, reference ordering, null/omission, defaults/normalization, status codes, errors and dependent effects. Add resource schemas/operation associations and derive the corresponding client transport declarations. Preserve raw paths and arbitrary string IDs, including nested `itemId` paths; operation metadata must not assume every parameter is named `id`.

Use shared reference/error vocabulary where accurate. Keep type-name/ID resolution in existing MCP create behavior; it is domain adaptation, not automatic casing. Check real response variants and refusal/no-write outcomes.

**Gate:** assigned batch operations, request/document acceptance, status/response associations and the shared gate pass.

### Batch 2 — Labels, notifications, templates and health

Migrate existing label CRUD/item association, notification list/read/read-all, read-only template list/detail and health. Preserve empty collection/absent-body behavior, idempotency/refusal details, numeric flags and JSON shape. Templates remain read-only; chat schema tables remain without APIs. Test-helper routes remain explicitly excluded from the document.

Finish corresponding client transport aliases. Keep deliberate UI models distinct from wire rows. Remove now-redundant manual transport declarations where all relevant consumers are migrated, but do not delete `types.ts` view/domain types wholesale or require optional UI fields as cleanup.

**Gate:** all assigned operations accounted for; no changed label semantics, polling, tool capabilities or template behavior; shared gate passes.

### Batch 3 — Existing MCP schema/transport agreement

Inventory the actual advertised tools after integration; do not assume an old tool count. Map curated snake_case arguments to their existing REST path/query/body fields. Derive common value kinds where useful and test agreement, explicitly documenting differences in requiredness, nullability and exposed fields. A field-specific REST change must flag the adapter for review; common ID reuse alone is not a complete agreement check.

Retain exact advertised schemas, names, descriptions, URL escaping, mapping/defaults, result text and errors unless a documented internal refactor proves identical output. Use explicit adapters for domain transformations such as type lookup. Do not let schema reuse begin rejecting inputs the dispatcher previously forwarded.

Add a bounded real stdio harness using isolated test data and an isolated backend or test-only seam. Preserve production API address defaults and avoid the user's development database/server. Exercise listing and existing `get_item`/`move_item` success, missing-target/error delivery and a raw-argument edge; add other transport cases only where mapping complexity warrants them. Keep protocol results and business assertions distinct.

**Gate:** existing tool interface snapshots and raw forwarding remain equal, shared-field disagreements fail usefully, bounded stdio checks and the shared gate pass. Known advertisement/runtime differences remain explicit, not “fixed.”

### Batch 4 — Bruno and remaining declaration audit

Inventory authored requests, operation associations, JSON body templates and variables. Expand external checks to bodies that can be resolved reproducibly with known fixtures; validate against the correct operation without regenerating collections, erasing variables or coercing values merely to fit. Keep intended-invalid scenarios identified as such. Where automation has poor cost/value or variables cannot be resolved safely, record the concrete limitation, manual check and owner instead of silently skipping or claiming coverage.

Retain authored assertions and scenario intent. Known CF1 prose/behavior disagreement remains a named post-migration correction, not a reason to tighten the handler or rewrite a business rule. Finish transport declaration/vocabulary accounting across client APIs and MCP, then hand M5 the independent inventory, all explicit exceptions and remaining authored-review responsibilities.

**Gate:** useful Bruno/MCP drift faults are demonstrated, generated files are fresh, no existing assertion is weakened and all shared gates/audit/handoffs pass.

## Code map

| Area | Change |
|---|---|
| Remaining resource routes/schemas; health registration in `server/src/index.ts` | Technical contracts and actual status associations; no new surface |
| Corresponding client API modules/generated declarations/view aliases | Complete transport derivation with explicit UI boundaries |
| `server/src/mcp.ts`, existing adapters and test-only transport harness | Derived common shapes, preserved low-level dispatch and bounded stdio evidence |
| Bruno collection plus external validation tooling | Checks against authored variables/scenarios; no collection codegen |
| Resource/consumer tests and independent inventory | Real response, refusal/no-write and explicit scenario coverage/dispositions |

## Acceptance

- Every assigned non-test operation is migrated; remaining resources preserve existing effects, defaults and responses. No schema-only feature gains an API.
- Client transport contracts are derived where meanings match; remaining view-model/domain declarations have explicit owners and rationale.
- Existing MCP advertisements, raw mapping and result/error delivery are preserved, common value-kind drift is detected, and bounded stdio evidence exists.
- Bruno remains authored; automated checks or named manual dispositions account for its relevant bodies/operations without claiming collection-wide business proof.
- All shared gates and normal audit/Reconciler handoffs pass; known behavioral findings remain routed after migration.

## Open questions and handoff

**Coder/Architect, in Batch 3/4:** choose the smallest isolated stdio seam and useful variable-resolution/check mechanism. Escalate only a concrete compatibility or scope issue. No Q5/Q6 product ruling is needed to preserve current behavior.

**PO/Test Planner:** use existing rules where present; do not invent wiki business cases solely for type-generation or transport plumbing. Reconciler verifies any claimed case coverage. No Planned product passage is built here.

**M5:** receive the full inventory and response/consumer matrix, command/install instructions, generated/reference boundaries, manual scenario dispositions, and all known deferred findings. Normal story closeout applies.

## Amendments

- **2026-10-30:** Drafted after consensus on the foundation and Nathan's instruction to defer optional behavior decisions until migration is regression-free. No tool/collection changes are authorized by drafting this plan.
- **2026-10-30:** Received M1 Batch 1's current-base resource/consumer inventory and CF7 characterization handoff. No operation or consumer has changed in this planning update.

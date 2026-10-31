# API Contract M3 — Workflows, Workphases, Boards and Columns

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** M2's shared rows/vocabulary and M1's integrated inventory/checks

## Goal and scope

Migrate this resource group's remaining requests, responses and client transport consumers without changing workflow/board behavior. The [roadmap decisions and shared gate](README.md) apply. At the planning revision there are 18 operations in this group; GET workflows is already piloted, leaving 17. M1 supplies current-branch counts/variants now; final integration later refreshes affected evidence for Epic 3.5 changes. M3 does not wait for that epic to finish.

Scope: workflows collection/detail/create/edit/delete; workphase create/edit/reorder/delete; board collection/detail/create/edit/delete; column create/edit/reorder/delete. Preserve any already migrated operation as a regression control.

Rule/catalog areas: [boards, columns and Unsorted](../../wiki/boards-columns-unsorted/), [project workflow inheritance](../../wiki/project-tree/), [item positioning](../../wiki/item-positioning/), [item attachment](../../wiki/item-attachment/) and [row references](../../wiki/row-references/). The PO/Test Planner select affected existing cases; no new rule, case ID or ownership redesign is invented here.

## Inbound deferrals and decisions

- M1's [source inventory](m1-api-inventory.md), I14–I31, supplies current variants and callers. Capture 409 conflicts, reorder `missingIds`, enriched range errors and workphase deletion's 200 report/204 alternative before replacement. CF7's board/column missing-reference statuses remain unchanged; this story records actual HTTP outcomes and no-write effects for the post-migration ruling.
- Reuse M2's item/depth/scope/reindex shapes by reference; do not duplicate decorated item definitions inside each collection.
- Round table Coder #3 / Auditor #4: metadata must associate real methods, status codes and schema variants correctly. In particular, the current workphase edit can return `400 { error, conflictingColumnId }`; do not force it into the strict generic error envelope or discard the additional field.
- Raw `projectId`/`workflowId` query values are represented before their existing truthiness and `String()` handling. Do not introduce coercion/defaults or UUID requirements as a convenience.
- Retain current board/workflow ownership and API payloads while adding no new dependency on that ownership beyond what a project-based future design needs. URL routing, project-owned boards, terminal-flag redesign and depth-cap delivery symmetry are out of scope.
- Existing workphase terminal backfill/reindex-disclosure questions remain with positioning work. Capturing the actual response does not resolve those questions or add new response fields.

## Work, in batches

### Batch 1 — Workflow contracts

Capture existing query/list behavior, decorated detail, create-from-template/copy/custom variants, edit/delete errors and database effects. Preserve inherited visibility, project attachment/ownership constraints, stored versus derived fields, workphase/item ordering, cascades and all actual failure precedence.

Add schemas and operation/status associations for remaining routes; keep GET workflows as the raw-query regression control. Compose detail rows from shared schemas. Migrate selected client functions and existing `list_workflows`/`get_workflow` advertisement/adapter references where compatible; preserve exact advertised inputs, URL mapping and error/result delivery.

**Gate:** request/runtime/document agreement, real detail/create/write/error/bodyless response checks and the shared gate pass. Record any deferred MCP/stdio or Bruno coverage with M4.

### Batch 2 — Workphase contracts

Capture name/flag updates, omitted fields, current boolean normalization, reorder collection forms and deletion effects. Represent what the existing handler accepts on the wire; a schema that merely accepts booleans is insufficient if the current handler also normalizes other inputs. Preserve column conflict checks, enriched error payloads, completion/notification/backfill behavior and transaction/no-write guarantees.

Move structural validation without duplicating range or item rules. Add exact per-status schemas and response assertions, including conflicting-column errors. Derive corresponding client transport types. Do not “repair” disclosure or terminal semantics while adopting schemas.

**Gate:** representative normalization and multi-fault cases, enriched error association, database effects and the shared gate pass.

### Batch 3 — Board and column contracts

Capture board query/detail/write/delete and column create/edit/reorder/delete. Cover derived column display names, resolved subrows, empty/contiguous ranges, broken-column variants, Unsorted buckets/reasons, depth-cap fields, item decoration and response-array ordering. Keep API board membership independent of item storage as it is today.

Preserve unknown fields, reference validation order, overlap/terminal-range refusals, reorder effects and deletion cascades. Consume generated transport types in the corresponding client functions without changing board interaction code. Read the drag directory's instructions if any consumer change actually requires entering that directory; prefer type-only API boundary changes.

**Gate:** independent range/inheritance/Unsorted assertions plus operation/status schema checks and the shared gate pass. Shape-valid collections alone do not establish correct board contents or order.

### Batch 4 — Shared component and inventory review

Account for all assigned operations, statuses, errors and query parameters. Tie query-schema keys to operation metadata. Check shared request/response component contexts; apply roadmap D6 if different input/output shapes require custom management. Confirm decorated item fields still compose from the authoritative schemas and that UI optionality has not tightened incidentally.

Resolve new regressions, route pre-existing disagreements to receiving work, complete normal audit/Reconciler handoffs, and restore any temporary conversion probes before reporting the retained gate results.

## Code map

| Area | Change |
|---|---|
| Resource route/schema modules and operation metadata | Structural parsing, real response associations and legacy error ordering |
| Workflow/column/cascade/position helpers | Reuse existing domain enforcement and transaction behavior; no inline clones |
| Client API modules, generated types and explicit view aliases | Shared transport types without UI or ownership redesign |
| Resource tests, independent inventory and conversion probes | Normalized wire examples, enriched errors, decorated variants and business-effect controls |
| Related Bruno scenarios and existing workflow MCP tools | Shared value-kind checks and preserved curated interfaces |

## Acceptance

- All assigned group operations and actual status variants are registered and exercised with correct schemas; GET workflows remains compatible.
- Workflow inheritance, ordering, board/column ranges, broken/Unsorted behavior, cascade effects and current flag normalization are unchanged.
- Rich error payloads and bodyless statuses are preserved. Raw query representations agree with runtime behavior and operation metadata.
- Shared item/vocabulary schemas are referenced, generation remains database-free, and client optionality/view policy remains explicit.
- No project-owned board, URL-routing, dual-position or depth-cap unification work is introduced. Shared gates, roadmap D6 checkpoint and normal audit/handoffs pass.

## Open questions and handoff

**Coder/Architect:** select compatible representations for existing normalization when its wire domain is broader than its stored value. Preserve and probe the input/output distinction; do not choose new product semantics. A concrete unrepresentable constraint triggers an explicit comparison, not silent widening.

**PO/Test Planner/Reconciler:** no Planned passages are built. Identify and verify relevant range/inheritance/refusal cases by actual assertions. Capture a known disagreement without changing the rule or crediting a schema test with unrelated business effects.

**M4/M5:** receive complete resource associations, normalization exceptions, shared response component inventory and scenario dispositions. Remaining product decisions stay with the post-migration/positioning plans. Normal story closeout applies.

## Amendments

- **2026-10-30:** Drafted under the adopted native foundation and deferred-behavior policy. Operation counts are pre-integration planning inputs, not publication evidence.
- **2026-10-30:** Received M1 Batch 1's current-base status/response inventory and CF7 characterization handoff. No operation has been migrated by this planning update.

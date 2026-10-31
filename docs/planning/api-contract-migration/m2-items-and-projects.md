# API Contract M2 — Items and Projects

**Type:** tech-debt story · **Written:** 2026-10-30 by the Architect · **Status:** planned; not started · **Depends on:** M1's current-branch baseline, tooling and independent inventory; no Epic 3.5 completion dependency

## Goal and scope

Migrate the remaining item/project contracts and their client transport consumers while preserving their current behavior. The [roadmap decisions and shared gate](README.md) govern every batch. Keep the three retained pilot operations integrated rather than rebuilding them.

Initial scope at `d703e6a`: item POST, PUT, comment POST and DELETE; project collection/detail/depth-cap GETs, POST, PUT and DELETE. M1 verifies these ten remaining operations and their status/response variants on the current branch. Existing GET item and both PATCH moves remain regression controls and receive necessary boundary cleanup. Final integration later refreshes the inventory/evidence for incoming Epic 3.5 changes.

Rule/catalog areas are [item attachment](../../wiki/item-attachment/), [item positioning](../../wiki/item-positioning/), [project tree](../../wiki/project-tree/), [positioning](../../wiki/positioning/) and [row references](../../wiki/row-references/). The PO/Test Planner identify affected existing cases before each batch; this plan adds no product rules or case IDs. Characterization is not an approval of a conflicting implementation.

## Inbound deferrals

- M1 supplies current route/status inventory and development regression evidence, normal command/artifact paths and stable HTTP fixtures. Completed-main revalidation is the final merge gate, not an M2 prerequisite.
- Round table Coder #1–#3: preserve structural and database failure order; separate route parsing from domain inputs; account for UI aliases and shared input/output contexts explicitly.
- CF4: derive transport shapes and shared vocabulary while preserving existing optional UI fields. Requiring `positionScope` or changing move/create/edit placement remains in the positioning story.
- CF1/CF2/CF3: retain unused-neighbor precedence, malformed-request outcomes, ignored inputs and legacy scope intent. No correction or deprecation is introduced here.

## Decisions

- API schemas describe delivered values, including omission/null, numeric flags, decorated rows, derived detail fields and optional reindex disclosures. Reuse common schemas/vocabulary; do not derive storage rows blindly or change response construction to fit a preferred DTO.
- Schema-derived client inputs may expose narrower intentional subsets, by reference rather than duplicated primitive declarations. Preserve callers' current requests and loading/view-model optionality. Record each relaxation and its response-test backstop; optional aliases do not prove required wire fields exist.
- Parse at the existing handler stage, preserving lookup before handler-level body errors. Keep hierarchy changes through `validateHierarchyRequest` / `applyHierarchyRequest` and create resolution through `resolveCreate`; domain rules and transaction boundaries stay intact.
- Once remaining item routes parse appropriately, restore a domain-oriented hierarchy input boundary where feasible. Do not keep the primitive dependent on loose HTTP objects unnecessarily. Any legacy raw-anchor assertion stays narrow and documented; it must not turn the retained binding/error behavior into a new refusal.
- Preserve exact existing messages. Schema-local error metadata and ordered adapters are implementation options only if the shared behavior tests prove equivalent results. No policy for hypothetical new product fields is required to migrate existing fields.

## Work, in batches

### Batch 1 — Characterization and shared item boundary

Capture current remaining operation inputs, 201/write/detail/delete responses, error forms, missing-target and multi-fault precedence, and affected database effects. Include create parent/project/type/agent/workphase combinations, absent versus null fields, ignored placement fields and body-parser edges where relevant. Read the domain helper headers and the referenced wiki rules before changing enforcement sites.

Derive request/domain types from the appropriate owned vocabulary without copying transport interfaces. Improve the retained move/detail parsing boundary only when behavior remains identical. Add a comment or focused probe for the required-key behavior of `z.unknown()` intent branches; do not rely on a library-version assumption without a tripwire.

**Gate:** pre-replacement captures and focused request/document agreement pass; boundary changes pass the shared batch gate. Existing snapshot payloads are not updated to accommodate the refactor.

### Batch 2 — Item create, edit, comments and delete

Replace structural guards with schemas and compatible error staging. Preserve `resolveCreate`, hierarchy validation/application, parent-derived project behavior, dependent cleanup and transaction atomicity. Include successful and refused comment writes and subtree deletes; keep activity, notification and reindex effects independently asserted.

Associate each actual status with its correct response, including bodyless delete semantics. Consume generated input/response types in the corresponding client functions without changing runtime payloads or UI behavior. Keep existing `create_item`, `update_item`, `add_item_comment`, `get_item` and `move_item` mappings intact; prepare shared primitive/field reuse and adapter checks for M4 without new validation.

**Gate:** operation/status-driven response tests, refusal/no-write cases, UI reconciliation controls and the shared gate pass. Demonstrate reindex disclosure present/absent, not just a minimal row.

### Batch 3 — Project reads and writes

Migrate collection/detail/depth-cap reads and project create/edit/delete. Preserve nested workflow/depth representations, arbitrary string IDs, nullable references, empty strings, append/reparent ordering, depth caps, delete cascades and reindex disclosures. The existing project move remains asymmetric with item move; do not validate an unused neighbor's existence merely because another rule would be more consistent.

Derive client transport declarations for the selected functions; preserve project view models and shared write reconciliation. Replace the pilot's remaining duplicated request declarations by references while retaining any deliberate UI subset. Check curated Bruno examples for covered operations using M1's mechanism or record a receiving M4 scenario disposition.

**Gate:** all assigned project operations and error/success variants are accounted for in the independent inventory; the shared gate passes.

### Batch 4 — Maintenance check and handoff

Repeat a reversible representative shape change through runtime/schema/document/types, confirm the expected producer/consumer or response failure, then restore it and verify freshness. Confirm generation imports no database. Inspect shared components for differing input/output forms and record an explicit D4 decision; a concrete context-management need adds the comparable library trial rather than a hidden converter.

Audit the retained API/domain/UI declarations, including `Side`, `PositionScope` and reindex pairs. Remove redundancy where meanings match and record independently checked intentional differences. Reconciler verifies affected catalog evidence and any ID-only metadata corrections without changing behavioral assertions.

**Gate:** restored artifacts, required audit/handoffs, full gate and unchanged Playwright pass on the retained implementation.

## Code map

| Area | Change |
|---|---|
| `server/src/routes/items.ts`, `projects.ts`; item/project schemas and operation metadata | Remaining requests and actual per-status responses; preserve existing serialization/domain calls |
| `server/src/lib/itemHierarchy.ts`, `itemTree.ts`, position/cascade helpers | Read/reuse existing primitives; narrow type/import-boundary changes only, no duplicated domain logic |
| `client/src/api/items.ts`, `projects.ts`, generated declarations and transport/view aliases | Derived inputs/responses and explicit optionality; retain reconciliation through existing helpers |
| Item/project contract/behavior tests and inventory | Additional independent captures, response variants and association checks; no lost product assertions |
| Existing MCP adapters and Bruno item/project requests | Curated field agreement; preserve tool behavior and authored variables/scenario intent |

## Acceptance

- Every M1-assigned item/project operation and status variant is migrated and independently checked, including the three pilot controls.
- No create/edit positioning, move symmetry, nullability/exposure policy, raw-anchor behavior or refusal order changes. Atomic hierarchy/position effects and reindex reconciliation remain correct against the baseline.
- Client transport shapes derive from the contracts; any UI relaxation is explicit and backed by wire-response assertions. Remaining domain duplication has a source or agreement check.
- Reversible maintenance exercise is restored; conversion/freshness/coverage checks and all shared gates pass. D4 outcome and normal audit/Reconciler handoffs are recorded.

## Open questions and handoff

**Coder/Architect, during the relevant batch:** choose the smallest compatible parsing/domain boundary and schema/error organization. No general error redesign or Q3–Q6 ruling is required. Escalate a concrete unavoidable conflict rather than silently changing behavior.

**PO/Test Planner:** no Planned rule is built or superseded. Identify relevant existing cases from the named rule areas, keep expected behavior independent and route any implementation/wiki disagreement to the post-migration queue with evidence.

**M3/M4:** receive migrated item/project component names, status associations, client alias boundaries, remaining MCP/Bruno checks and explicit legacy exceptions. Do not recopy item rows into decorated workflow/board schemas. Normal story closeout applies.

## Amendments

- **2026-10-30:** Drafted from the retained pilot and Nathan's behavior-preserving round-table policy. Implementation and role scope/mapping work have not started.

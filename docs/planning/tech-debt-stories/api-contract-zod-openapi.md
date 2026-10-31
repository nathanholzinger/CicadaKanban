# API Contract — Zod/OpenAPI Migration

**Type:** tech-debt epic · **Written:** 2026-09-26 by the Architect · **Replanned:** 2026-10-30 after the framework spike and round table · **Status:** M1 tooling cleanup committed; remaining migration work proceeds alongside Epic 3.5 · **Sequenced:** completed-main integration/revalidation is required before the final merge, not before M1–M5 development

## Goal and current plans

Migrate current API functionality onto Zod 4 native conversion, small OpenAPI 3.1 assembly and generated client declarations. A field has one authoritative technical shape, generated consumers update mechanically, and checks expose remaining disagreements. The wiki owns business rules and observable behavior; generated reference owns exhaustive technical shapes. Checks, owner review and drift audits cover remaining authored relationships.

[The migration roadmap](../api-contract-migration/README.md) holds the current shared decisions, compatibility policy, test evidence, integration order and gates. The [round-table checkpoint](../round-tables/api-contract-framework-decision) records Nathan's answers. This entry point replaces the earlier conflicting proposal; its C1–C9/OD1–OD3 history and dispositions remain in [the spike results](api-contract-framework-spike-results.md#revised-epic-proposal-and-earlier-decisions) and git revision `d703e6a`.

| Story | Deliverable |
|---|---|
| [M1 — Foundation and development baseline](../api-contract-migration/m1-foundation-and-baseline.md) | Preserve evidence, record current-base tests/inventory, normalize tooling/install, retire comparison-only experiments and establish stable checks/vocabulary |
| [M2 — Items and projects](../api-contract-migration/m2-items-and-projects.md) | Remaining request/response/client contracts; preserve hierarchy/position primitives and legacy outcomes |
| [M3 — Workflows, workphases, boards and columns](../api-contract-migration/m3-workflows-and-boards.md) | Query/decorated response contracts, ordinary status variants and enriched errors; retain domain effects |
| [M4 — Remaining resources and consumers](../api-contract-migration/m4-remaining-resources-and-consumers.md) | Remaining routes, transport types, existing MCP agreement/stdio checks and authored Bruno checks |
| [M5 — Completeness and acceptance](../api-contract-migration/m5-completeness-and-closeout.md) | Independent coverage proof, maintained repository reference, owner handoffs, final regression evidence and merge readiness |
| [Post-migration decisions and corrections](api-contract-compatibility-follow-ups.md) | Resolve deferred product/optional scope after migration acceptance; implement only separately approved changes |

## Confirmed boundaries

- Reuse the pilot lineage with forward cleanup. Finish the decision/story checkpoint here; evidence preservation and creation of `api-contract-migration` are subsequent actions. Do not unwind or reconstruct the pilot by partial cherry-picks.
- All M1–M5 work can proceed alongside Epic 3.5 using current-branch baseline/characterization. Before final merge: finish Epic 3.5 → merge `main` into migration, resolve conflicts and refresh/revalidate affected contracts/tests → merge accepted migration back into `main`. Old spike results do not certify the later combined branches.
- Preserve external behavior and tests, including exact existing errors/precedence and untested forms discovered during characterization. Internal unit tests directly broken or made irrelevant by the replacement require a documented coverage account before changing/removal. Comparison-only retirement is explicitly bounded in M1.
- Q3–Q6's outcomes stay unchanged through migration without being declared permanently intentional. Defer correctness, deprecation/retirement, MCP validation/capabilities and hypothetical new-field wording. Return only a concrete unavoidable implementation decision for earlier deliberation.
- The Planner may read generated reference for technical representation, without waiting for future docs or allowing generated output to override wiki expectations. Existing catalog evidence/approval rules remain; no automatic framework-covered status is adopted.
- Response enforcement stays in tests. A complete repository reference is included; a new public endpoint/viewer and broader E2E response interception are post-migration decisions.
- Normal role/audit/closeout responsibilities apply to migration implementation. The spike's direct Architect/Nathan exception does not extend here.

## Evidence and receiving work

Baseline `0565cde`, comparison `843f132`, integrated pilot `7410110`, completed spike evidence `d703e6a`. The pilot passed 77 frozen captures, the full gate (780 server / 604 client / 235 tooling tests) and unchanged Playwright (219 passed / 18 skipped). M1/M5 record current-branch development evidence now and refresh affected evidence after completed-main integration at the final merge gate.

D4 remains: a concrete need for general conversion, shared input/output component management or repeated library-provided workarounds adds a comparable `zod-openapi` trial while preserving native. Routine metadata, literal parameters and ordinary method/status growth do not trigger it alone.

[Positioning work](positioning-on-create-and-edit.md) owns move symmetry, dual positions, create/edit placement and UI `positionScope` requiredness. [Post-migration follow-ups](api-contract-compatibility-follow-ups.md) own CF1–CF6 and optional policy/delivery decisions. Storage/API schema generation and wholesale view-model removal are not assumed.

## Handoff

- Linked story plans supersede the old six-story proposal. They define batches, code maps, makes-dead/coverage accounts and owner handoffs; no code is implemented at this checkpoint.
- PO/Test Planner own living wiki/catalog changes; Architect drafts necessary guide/persona/ownership changes through normal approval. None of those living surfaces is edited by drafting these plans.
- A1's TSDoc convention question remains separate Architect process work. The old ESLint gap belongs to `tooling-gates.md`; neither becomes a migration prerequisite.
- Earlier `epic-4-decisions.md` and MVP pointers still reach this entry point. Do not restore old test-consolidation, universal error-flattening, new-MCP or positioning-prerequisite instructions from history.

## Amendments

- **2026-10-30:** Prepared the provisional post-spike replan at `d703e6a`, retaining earlier proposals as historical input.
- **2026-10-30:** Following Nathan's round-table answers and accepted reuse/integration order, replaced contradictory proposal text with this entry point and drafted M1–M5 plus post-migration receiving work. Step 1 is planning only; no implementation, tag, branch, commit, merge or archival sign-off is performed.
- **2026-10-30:** Corrected sequencing after Nathan clarified that M1–M5 proceed alongside Epic 3.5. Completed-main validation is a final integration/merge gate, not a dependency for current-base inventory, characterization, implementation or review.

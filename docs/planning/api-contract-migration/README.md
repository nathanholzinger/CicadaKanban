# API Contract Migration — Roadmap and Shared Decisions

**Type:** tech-debt epic · **Written:** 2026-10-30 by the Architect · **Status:** foundation selected; story plans drafted at Nathan's direction; implementation not started · **Sequenced:** integrate completed Epic 3.5 before migrating the remaining endpoints

## Goal

Implement the existing API on Zod 4 schemas, native JSON Schema conversion and small OpenAPI 3.1 assembly. A field change should have one authoritative technical shape, generated consumers should update mechanically, and checks should expose the remaining disagreements. Generated declarations serve transport contracts; intentional UI and MCP subsets remain explicit.

The foundation is selected from the [spike](../tech-debt-stories/api-contract-framework-spike.md) and [round table](../round-tables/api-contract-framework-decision). The four-endpoint integration is committed at `7410110`; the completed comparison/results/planning evidence is `d703e6a`. These revisions are historical evidence, not the final Epic 3.5 regression baseline.

## Decisions

**D1 — Authority.** The wiki owns product rules and observable behavior. It may name routes, fields, statuses, null/omission meanings and allowed values when a rule depends on them. Generated reference describes the exhaustive technical shapes. Storage remains Drizzle-owned; a table row is not automatically an API contract. No database change or storage-schema generator is included.

**D2 — Compatibility.** Preserve current accepted, ignored and refused forms, defaults/normalization, omission versus null, failure order, exact existing errors/statuses, response variants and database effects. This includes untested behavior discovered during characterization and the known CF1/CF2/CF3/CF5 observations. Do not adopt a behavior change merely because Zod prefers it, no test detects it, or it simplifies an adapter.

Keep external behavior tests, assertions, helpers and Playwright configuration unchanged. Internal unit tests directly broken or made irrelevant by replacing an implementation may be updated or removed with an explicit before/after coverage account. This is not permission to consolidate useful HTTP shape/refusal tests. M1 separately covers comparison-only experiment retirement after evidence preservation. If an unavoidable universal implementation decision would change behavior or invalidate external tests, stop that affected change, describe the concrete alternatives and ask Nathan for a ruling; no such blocker has been established by the pilot.

**D3 — Deferred decisions.** [Post-migration follow-up work](../tech-debt-stories/api-contract-compatibility-follow-ups.md) receives Q3–Q6 and their CF findings, future-field wording policy, optional deprecation/retirement, MCP runtime validation/capabilities, and Q8's broader E2E response interception. Preserve behavior through M5; deferral neither closes these questions as intentional nor rewrites conflicting wiki rules. Positioning redesign and UI `positionScope` requiredness remain in their [existing story](../tech-debt-stories/positioning-on-create-and-edit.md). CF4's technical transport/vocabulary work is included here; its product decisions are not.

**D4 — Planning and evidence.** Nathan permits the Test Planner to read generated reference for technical representation when available; absence of a future relevant page does not block planning. Expected behavior follows wiki rules first, then reasoned consistency with analogous behavior, then convention; broad outcomes can require reviewer judgment. Generated declarations do not override those expectations. No automatic “handled by the framework” status is introduced. The Reconciler maps a running test only when its assertions prove the full case and applies existing mapping/approval rules, including verification of HTTP versus internal evidence. A folder name supplies no exemption. Pure infrastructure checks need no artificial business case. Draft any needed persona/guide updates for the normal approval process without treating their current wording as a reason to reverse Nathan's instruction.

**D5 — Technical boundaries.** Keep database-dependent rules, transactions, hierarchy/position/cascade primitives and response construction in their domain layer. Schemas/generation import no database or app bootstrap. Shared enum tuples belong in a database-free domain vocabulary module; schemas can reference it, and client transport types derive from generated declarations. Avoid making domain math depend on HTTP schemas. Routes use typed parsed values while retaining compatible structural/error staging; domain primitives should have domain inputs rather than loose wire objects where migration permits that separation.

**D6 — Assembly and checks.** Ordinary method/status/parameter metadata and per-status response schemas are normal extension work, including 201, bodyless 204 and richer error envelopes. They do not by themselves trigger a new library trial. The first shared component needing different input/output representations, additional component-context machinery, general parameter conversion or repeated library-provided workarounds triggers a comparable `zod-openapi` trial. Preserve native, use a common baseline and compare the same requirements/gates before selection; do not automatically switch or build a generalized converter.

**D7 — Workflow.** The spike's direct Architect/Nathan workflow exception ends with the spike. These implementation stories follow normal PO/Test Planner/Coder/audit/Reconciler responsibilities as applicable to a structural refactor. Planning here invokes no roles and claims no sign-offs. Every implementation batch ends with reviewable changes and its required checks; commits, branch creation, evidence tags and merges follow Nathan's directions.

## Branch and integration sequence

1. Finish and review this planning checkpoint on `api-contract-framework-pilot`, including the currently untracked round-table record. Do not unwind spike commits or cherry-pick a partial dependency chain.
2. Preserve the completed evidence revision with a named tag/branch, then create `api-contract-migration` from the reviewed planning checkpoint. These are subsequent actions, not performed by drafting this roadmap. M1's comparison retirement must wait for that reachable preservation.
3. Finish Epic 3.5 on `main`. Record its final revision and test results, then **merge `main` into the migration feature branch** and resolve conflicts. Keep intended Epic 3.5 changes; do not resolve conflicts by restoring the older pilot UI/test behavior.
4. M1 compares the integrated pilot against completed-main behavior and establishes the migration baseline. M2–M4 then migrate remaining resources in order. If `main` advances again, repeat the integration/baseline accounting before final acceptance.
5. Complete M5 on the integrated migration branch, then **merge the feature branch back into `main`** when Nathan authorizes it. Verify the resulting main revision. Do not merge this work before Epic 3.5 is finished.

Planning can proceed now. This checkpoint authorizes neither branch/tag mutations nor implementation; the selected strategy is reuse plus forward cleanup. Post-migration behavior work starts from the accepted migration, rather than being bundled into its merge.

## Stories and initial inventory

| Story | Scope | Dependency / exit |
|---|---|---|
| [M1 — Foundation, integration and baseline](m1-foundation-and-baseline.md) | Evidence retention, completed-main integration, normal tool install/generation, comparison cleanup, port-exhaustion investigation, independent route inventory, vocabulary and check infrastructure | Epic 3.5 integration precedes the operative baseline; infrastructure and compatibility gates pass before remaining route migrations |
| [M2 — Items and projects](m2-items-and-projects.md) | Remaining item/project requests/responses/client transport shapes; retain and improve the existing pilot boundaries | M1; failure precedence, hierarchy, ordering, deletion and reindex variants preserved |
| [M3 — Workflows, workphases, boards and columns](m3-workflows-and-boards.md) | Remaining workflow operations and board/workphase/column contracts, query representations and decorated responses | M2; real method/status-specific associations, cascade and response variants checked |
| [M4 — Remaining resources and consumers](m4-remaining-resources-and-consumers.md) | Agents, attachments, labels, item types, notifications, templates, health; complete client/MCP/Bruno agreement checks | M3; inventory accounted for, existing transport capabilities unchanged |
| [M5 — Completeness and migration acceptance](m5-completeness-and-closeout.md) | Independent completeness, maintained technical artifact, owner documentation handoffs, final regression evidence and merge readiness | M4; no mandatory behavior ruling left in migration scope; no invented publication endpoint |
| [Post-migration decisions and corrections](../tech-debt-stories/api-contract-compatibility-follow-ups.md) | Resolve remaining Q/CF product and optional tooling decisions, then separately scope approved changes | After M5 regression acceptance and migration merge; no correction is a prerequisite of M1–M5 without a concrete unavoidable blocker |

At `d703e6a`, a source scan finds **53 non-test router handlers plus health = 54 operations**: items/projects 13 (three piloted), workflow/workphase/board/column 18 (one piloted), and remaining resources/health 23. Thus 50 remain to migrate at this revision. This is planning input, not a completeness certificate. M1 rebuilds the inventory from completed Epic 3.5 and assigns every operation and response variant to a story. Test helpers are explicitly excluded; schema-only chat tables create no API work.

## Shared batch gate

- Record the baseline revision, affected operations, captured wire behavior, existing tests/catalog references, authored scenarios and accepted legacy findings before replacing checks.
- Check request/runtime/emitted-schema agreement and actual operation/status/response association, including successes, errors and absent bodies. Compare business effects independently; schema agreement alone can preserve a mistake.
- Keep conversion probes for conditional constraints, defaults, coercion/refinements, nullability, unknown fields and input/output contexts. Unsupported generation fails explicitly; no widening fallback hides it.
- Generate declarations mechanically; freshness must fail usefully with the regeneration command. Check curated exposure policy separately from common value types.
- Run `npm run check`, focused new contract/compatibility checks and the unchanged Playwright suite for each implementation batch. Run HTTP-heavy suites sequentially. Stable test transport is an M1 deliverable, not a permanent requirement to wait out port exhaustion.
- Retain database isolation and refusal/no-write assertions. Log newly discovered correctness/wiki disagreements in receiving work; fix new regressions in the current story. Unit-test replacements and snapshot metadata changes need a specific evidence account, never a blanket coverage exemption.

No new product rule or Planned wiki passage is built by this migration. Each story lists impacted rule areas for the PO/Test Planner; catalog scope/mappings are their work, not invented in these drafts. Technical checks and independent characterization coexist with wiki-derived tests. Existing known disagreements remain explicitly deferred even when audit finds them again.

## Acceptance and remaining decisions

M5 must prove that every inventoried non-test operation and applicable status/response variant is registered, real exercised responses agree with the associated schema, selected request forms match runtime acceptance, and generated consumers are current. Existing external tests still prove the refactor did not change behavior against completed-main. Remaining hand-maintained relationships have an owner and a check or review/audit fallback.

Implementation choices such as generator packaging, stable test transport and route introspection are resolved in M1's bounded probes. They do not require product rulings unless a concrete compatibility/scope exception appears. Q3–Q6 and optional Q8 work stay in the post-migration story. A public OpenAPI endpoint/viewer is not needed for migration acceptance; delivery beyond a maintained repository artifact is deferred there too.

## Handoff and amendments

- The old epic entry point links here; earlier C1–C9/OD1–OD3 dispositions remain in the spike's Batch 4 results and git history. They are not parallel current instructions.
- M1 owns evidence preservation, reusable probe retention and normal install/check ergonomics. No test code is removed by writing these plans.
- PO/Architect own any wiki/reference vocabulary and guide drafts; Test Planner/Reconciler own catalog evidence. No living wiki/test-plan/persona/guide is edited at this checkpoint.
- **2026-10-30:** Nathan accepted reuse of the pilot lineage and the integration order “finish Epic 3.5 → merge main into migration and resolve conflicts → merge migration back to main,” and directed step 1: finish the decision record and story plans. Foundation selection and the behavior-preserving/deferred-decision policy are carried from his round-table answers. All implementation, tags, branches, commits and merges remain subsequent work.

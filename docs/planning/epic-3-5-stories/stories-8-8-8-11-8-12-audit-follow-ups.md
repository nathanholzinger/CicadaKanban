# Stories 8.8, 8.11 and 8.12 — audit follow-up handoff

**Status:** for the Architect/Coder and Test Reconciler; no implementation started by the Auditor.

**Audit:** `docs/audits/code-quality-audit-stories-8-8-8-11-8-12.md`, frozen range `epic-3-5-story-8-7-audited..524b9e70ede85a4fd083cde1d453b8aef7559f16` (26 commits, including the preceding fixes and 8.9).

## Scope

- Findings **#1–#11** need implementation or another recorded disposition. The audit gives exact sites, failure scenarios, fixes and verification.
- **#12** is already accepted by Story 10's Inbound deferrals, “Audit follow-up — #12”. Do not reopen the archived story plans to carry it.
- **#13** is an optional App extraction, not a prerequisite for correcting the write races.
- The Auditor changed no application code or tests permanently and created no tag/commit. Preserve other sessions' uncommitted planning/catalog work.

## Suggested implementation order

These are reviewable groups for the Architect to size and schedule, not started batches:

1. **Project response ordering (#1/#2).** Start in App's collection/write lifecycle; also audit its delete-refresh replacement path. Preserve ordinal previews and reindex handling. Gate both out-of-order same-project answers and stale full-tree recovery after an intervening success.
2. **Live Unknown-status rows (#3).** Unify their data with the board's live items/placements. Check successful edit, deletion and reassignment without a reload; keep attachment and project filtering.
3. **Create reference shape (#4).** Use the existing shared check at the item create references and create workphase resolver. Keep existing omitted/null/inherited behavior and assert no writes on refusal.
4. **Scope literal handling (#5).** Cover JSX text in both normalization and removal-site detection. Keep the already fixed string, regex and template regressions.
5. **Documentation and fixtures (#6–#11).** Small comment/title corrections, existing row-data factories, and the required built-rule wiki index pointers. These do not require a product-rule change.

Behavioral groups end with `npm run check` and `npm run test:e2e`; tooling and prose groups use the appropriate regressions and full gate. Each implementation batch ends for Nathan's review/commit. Do not treat the audit's intentionally failing reproduction probes as baseline suite failures; those files were removed and the clean gate passes.

## Open questions

- **For the Test Reconciler:** the Drift support worker noticed no-write assertions in `tests/ui/project-tree-drag.spec.ts` reading `watchWrites` immediately after the release helper returns. Check whether the existing release/settlement behavior proves each no-write case, or whether that case needs the already shared `projectTreeDrag.ts::settledWrites` helper. The separate reconciliation report does not appear to answer this specific timing question. Do not infer a runtime defect, automatically add waits, or repeat the completed full reconciliation; return a narrow decision.
- **For the Test Planner, after fixes are planned:** assess whether #1–#4 need additional catalog cases derived from the existing project-tree, Unsorted and row-reference rules. Regression tests can be added by the Coder; only the catalog owner changes the cases and only the Reconciler grants coverage status.

No product-wiki ruling is required by the retained findings. Copy-hold/glide styling and the Planned stopped-column banner remain under their existing decisions and routes.

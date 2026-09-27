# Epic Definition of Done

Apply this checklist before marking an epic ✅ in the MVP roadmap. Per-story work is closed by `.claude/guides/story-done-checklist.md`; this list covers what only makes sense for the epic as a whole.

The sections run in the order the work happens: stories, then the test-plan pass, then the audit. Item by item, though, it's a closing gate you consult after the fact. Check items off in whatever order is convenient.

## Stories and living docs
- [ ] Every story in the epic has closed through the story-done checklist, and its plan is in `docs/archive/`.
- [ ] The wiki pages this epic touched have no `**Planned:**` marker left on a passage the epic built.
- [ ] Root `CLAUDE.md` and the directory `CLAUDE.md` files reflect the epic's architecture and conventions (`.claude/guides/documentation-standards.md`).

## Tests
- [ ] **The end-of-epic test-plan pass.** The Test Planner re-reads each feature the epic touched against the finished wiki, adds, revises or deletes cases, and regroups suites where the story-by-story passes split them awkwardly (`docs/test-plans/README.md`).
- [ ] If that pass moved cases between suites, their tests are re-titled with the new IDs before the Reconciler runs. Otherwise it reports false gaps.
- [ ] **One Reconciler run** after that (`.claude/agents/test-reconciler.md`), with its report saved in `docs/audits/`. Its quality-flagged mappings and candidate cases are resolved, or routed to a destination that names them.
- [ ] Every test-plan case in the features the epic touched has a mapped automated test, or is approved as manual-only. There are two exceptions:
  - cases whose passage is still marked Planned;
  - cases routed by ID to a later story whose plan or roadmap entry names them.
- [ ] A code coverage goal of 80%+ has been attempted. It's a holistic sanity check, separate from the hard per-file thresholds in `server/vitest.config.ts`, and deliberately not a blanket rule: some code is legitimately awkward to test. But we should know *why* if we don't meet 80%.
- [ ] No skipped or pending tests left over from this epic.
- [ ] `npm run check` passes, and so does `npm run test:e2e`.

## Code Quality
- [ ] **The epic-wide audit has run and is closed out** (`.claude/guides/audit-workflow.md`). Run it after the Tests section settles, so its Fix Now changes are protected by real regression coverage.
- [ ] `npm audit fix` run in `server/` and `client/`; any remaining findings documented.

## Cleanup
- [ ] MCP tools in `server/src/mcp.ts` updated if the schema or API changed.
- [ ] The Bruno collection covers any new or changed endpoints.
- [ ] Every TODO comment from this epic is resolved or turned into a tracked item.

## Versioning
- [ ] Git tag created: `git tag -a epic-N-complete -m "Epic N: <name> complete"`
<!-- check-docs-ignore-next-line transient-link -- names where open work is tracked -->
- [ ] The epic is marked ✅ in `docs/planning/mvp-roadmap.md`.

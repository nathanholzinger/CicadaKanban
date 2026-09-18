# Epic Definition of Done

Apply this checklist before marking an epic ✅ in `docs/planning/mvp-roadmap.md`.
Listed in the order the underlying work actually happens (wiki → tests →
code-quality audit) so the dependencies are legible — but this is a closing
gate you consult after the fact, not a script to follow live; check items
off in whatever order is convenient.

## Documentation
- [ ] `docs/wiki/...` adequately captures feature details and business rules introduced in the epic
- [ ] Wiki page(s)' `Build status` line updated to reflect what actually shipped this epic
- [ ] `CLAUDE.md` updated if stack, architecture, conventions, or run instructions changed

## Tests
- [ ] `docs/test-plans/...` has been updated with test plans for the features introduced in this epic (derived from the wiki above, per `.claude/personas/test-planner.md`)
- [ ] Test reconciliation report run (`.claude/agents/test-reconciler.md`) and saved to `docs/audits/test-reconciliation-report-epic{N}.md`
- [ ] Quality-flagged mappings and candidate new cases from the reconciliation report are resolved or explicitly deferred with a reason
- [ ] All test-plan cases have a mapped automation test or have been explicitly acknowledged as a manual-only test
- [ ] A code coverage goal of 80%+ has been attempted — a holistic sanity check, separate from the hard per-file thresholds already enforced in `server/vitest.config.ts` (deliberately not a blanket hard rule: some code is legitimately awkward to test and we don't want to force coverage that isn't worth the cost — but we should know *why* if we don't meet 80%)
- [ ] No skipped or pending tests left over from this epic
- [ ] All Playwright tests passing: `npm run test:e2e` (from project root)
- [ ] All Vitest tests passing: `npm run test:unit` (from project root)

## Code Quality
- [ ] Code quality audit run (multi-pass workflow: `.claude/guides/audit-workflow.md`) — run after Tests above are settled, so **Fix Now** changes are protected by real regression coverage rather than hoping nothing broke
- [ ] All **Fix Now** findings from the audit resolved
- [ ] `npm audit fix` run in `server/` and `client/`; any remaining findings documented

## Cleanup
- [ ] MCP tools in `server/src/mcp.ts` updated if schema or API changed
- [ ] Bruno collection updated to cover any new or changed endpoints
- [ ] All TODO comments from this epic either resolved or turned into tracked issues

## Versioning
- [ ] Git tag created: `git tag -a epic-N-complete -m "Epic N: <name> complete"`
- [ ] `docs/planning/mvp-roadmap.md` epic marked ✅

---

## Orientation Checkpoint (recommended, not required)

Before starting the next epic, run an orientation session:

1. New session reads: `docs/planning/mvp-roadmap.md`, and the relevant epic plan
2. Create a new file `docs/walkthroughs/epic{n}-codebase-walkthrough.md` and walk through any significant new code with the user

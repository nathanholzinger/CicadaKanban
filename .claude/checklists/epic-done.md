# Epic Definition of Done

Apply this checklist before marking an epic ✅ in `.claude/plans/mvp-roadmap.md`.

## Versioning
- [ ] Git tag created: `git tag -a epic-N-complete -m "Epic N: <name> complete"`
- [ ] `.claude/plans/mvp-roadmap.md` epic marked ✅

## Tests
- [ ] All Playwright tests passing: `npm run test:e2e` (from project root)
- [ ] New E2E tests written covering the epic's core user flows
- [ ] New Vitest unit tests written for any new business logic functions
- [ ] No skipped or pending tests left over from this epic

## Code Quality
- [ ] Code quality audit run (multi-pass workflow: `.claude/guides/audit-workflow.md`)
- [ ] All **Fix Now** findings from the audit resolved
- [ ] `npm audit fix` run in `server/` and `client/`; any remaining findings documented

## Documentation
- [ ] Codebase walkthrough (`.claude/guides/codebase-walkthrough.md`) updated for
      any schema, route, or component changes in this epic
- [ ] `client/CLAUDE.md` updated if stack, architecture, or run instructions changed
- [ ] MCP tools in `server/src/mcp.ts` updated if schema or API changed
- [ ] Persona files in `.claude/personas/` updated if new conventions were established

## Cleanup
- [ ] Bruno collection updated to cover any new or changed endpoints
- [ ] Epic plan file moved to `.claude/plans/archive/` (or deleted if no longer useful)
- [ ] All TODO comments from this epic either resolved or turned into tracked issues

---

## Orientation Checkpoint (recommended, not required)

Before starting the next epic, run an orientation session:

1. New session reads: `.claude/plans/mvp-roadmap.md`, the relevant epic plan
   file, and `.claude/guides/codebase-walkthrough.md`
2. Walk through any significant new code with the user (use codebase-walkthrough.md
   as the template — update it as you go)
3. Agree on a prioritized list of "Fix Now" items before the next epic begins

# Epic Definition of Done

Apply this checklist before marking an epic ✅ in `docs/planning/mvp-roadmap.md`.

## Code Quality
- [ ] Code quality audit run (multi-pass workflow: `.claude/guides/audit-workflow.md`)
- [ ] All **Fix Now** findings from the audit resolved
- [ ] `npm audit fix` run in `server/` and `client/`; any remaining findings documented

## Tests
- [ ] All Playwright tests passing: `npm run test:e2e` (from project root)
- [ ] New E2E tests written covering the epic's core user flows
- [ ] New Vitest unit tests written for any new business logic functions
- [ ] No skipped or pending tests left over from this epic

## Documentation
- [ ] `client/CLAUDE.md` updated if stack, architecture, or run instructions changed
- [ ] MCP tools in `server/src/mcp.ts` updated if schema or API changed
- [ ] Persona files in `.claude/personas/` updated if new conventions were established

## Cleanup
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

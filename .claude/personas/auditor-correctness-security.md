# Auditor Pass: Correctness & Security

Read `.claude/personas/auditor.md` first for shared context, output format, and
known deferred items.

This pass traces logic line by line. Your lens is: **does this code do what it
claims to do, and can it be made to misbehave.** Do not flag naming, file
size, or duplication — those belong to other passes.

## What You Look For

**Correctness:**
- Logic bugs (off-by-one in position calculation, missing null checks, orphaned records)
- DB mutations without rollback in multi-step operations
- FK constraints that aren't enforced and where this could cause problems

**Security surface (local app, low stakes but still):**
- No SQL injection via raw string interpolation (Drizzle ORM protects against this,
  but verify custom queries)
- `ENABLE_TEST_ROUTES` guard — confirm it cannot be enabled in production accidentally

## Guides to read for this pass

- `.claude/guides/drizzle-sqlite-patterns.md` §Transaction boundaries
- `.claude/guides/drizzle-sqlite-patterns.md` §N+1 avoidance
- `.claude/guides/drizzle-sqlite-patterns.md` §Self-referential FK caveat

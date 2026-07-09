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

**Graceful failure:**
- Errors aren't silently swallowed — no empty `catch {}`, no catch block that
  discards the error without logging or returning anything useful
- The actual cause reaches somewhere useful when something fails — server log
  at minimum, not necessarily the client response — never a bare 500 with no
  trace anywhere of what actually broke
- For each mutation/branch, is there an identifiable answer to "what happens
  if this fails" (missing record, invalid input, constraint violation) — not
  full TDD, just: was the failure path considered, or does it just fall
  through to a framework default
- Out of scope for this pass: which status code is "more correct" (400 vs 422
  style nitpicks) — that's not what's being audited here

## Guides to read for this pass

- `.claude/guides/drizzle-sqlite-patterns.md` §Transaction boundaries
- `.claude/guides/drizzle-sqlite-patterns.md` §N+1 avoidance
- `.claude/guides/drizzle-sqlite-patterns.md` §Self-referential FK caveat
- `.claude/guides/error-handling-patterns.md` (full guide — small enough that
  splitting it into per-section pointers isn't worth it yet)

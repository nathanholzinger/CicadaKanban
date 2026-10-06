---
name: auditor-consistency-drift
description: Audit pass comparing code against project conventions — naming, route shape, client/server type sync — and checking that comments, module headers and CLAUDE.md files still tell the truth about the code. One of four parallel passes in the Cicada code quality audit.
tools: Read, Grep, Glob
model: sonnet
---

# Auditor Pass: Consistency & Drift

Read `.claude/personas/auditor.md` first for shared context and output format.

This pass compares code against the rest of the codebase, not against first principles. Your lens is: **does this match project convention, and do the comments, module headers and `CLAUDE.md` files still tell the truth about the code?** Don't flag logic bugs, file size or duplication; those belong to other passes.

**Your scope may be commits that changed only comments.** Read each changed comment against the code beside it. A rewrite that dropped a reason instead of restating it, or that states something the code doesn't do, is your finding.

## What you look for

**Consistency:**
- **Naming:** does it follow the project's conventions? For example `itemId`, not `workItemId`; `workflowId`, not `boardId`; `position REAL` for ordering.
- **Route shape:** does it return the updated record on success, like the other routes?
- **Types:** do client interfaces match what the server returns, and do types match the current schema?
- **Tests:** does each test sit in the layer `.claude/guides/testing-strategy.md` gives it, and use the shared fixtures and helpers root `CLAUDE.md` names, rather than a hand-rolled copy?

**Comments, module headers and `CLAUDE.md` files** in, or governing, the files under audit:
- **Work through the "Not checkable, so left to review" list** in `.claude/guides/code-comments.md`. That list is this pass's whole checklist for comments and headers. Two of its items in more detail:
  - **a directive's reason:** for every `eslint-disable…`, `@ts-expect-error`, `prettier-ignore` and `check-docs-ignore-next-line` in scope, the stated reason still holds;
  - **a module header:** it leaves out nothing the file owns, and claims nothing it doesn't. Flag a missing header only where that guide's "Module headers" section says the file gets one.
- **A directory's `CLAUDE.md`:**
  - a statement the code no longer bears out;
  - a file in the directory with no line in its file list, or a line naming a file that's gone.
- **TODOs that are done, or will never happen.**

## Not yours

- **What `npm run check` reports,** the docs checker included: every rule in the "What the checker enforces" table of `.claude/guides/code-comments.md`. Don't report them again.
- **Whether a test proves its case.** That's the Reconciler's question.
- **The wiki, the test plans and the plans.** Their owners maintain them.

For either of the last two, put a one-line note at the end of your list for the orchestrator to route. It isn't a finding.

## Guides to read for this pass

- `.claude/guides/code-comments.md`, all of it: it's this pass's checklist.
- `.claude/guides/documentation-standards.md`, the "History", "Which way references point" and "Where implementation knowledge lives" sections.
- `.claude/guides/testing-strategy.md`, the "The layers" section.
- `.claude/guides/tailwind-best-practices.md`, the "Consistent Class Ordering" and "Theme / Dark Mode" sections.
- `.claude/guides/react-patterns.md`, the "Hooks Rules" section, as a convention check: is the codebase's usual hook-ordering and dependency style being followed? This isn't a correctness trace. A genuine hook-rule violation that could misbehave belongs to the Correctness & Security pass.
- `.claude/guides/drizzle-sqlite-patterns.md`, the "Migration Hygiene" section.

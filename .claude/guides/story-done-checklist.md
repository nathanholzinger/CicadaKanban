# Story Done Checklist

What happens when a story's code is complete, in order, and what must hold before Nathan signs off. The order matters: each step reads what the one before it produced.

## The steps

1. **Write the handoff.** Whoever wrote the code (usually the Coder) fills in the story plan's living-docs handoff (`.claude/guides/story-plan-template.md`).
2. **Update the wiki.** The PO applies the handoff:
   - rulings on the handoff's behavior decisions go in;
   - the `**Planned:**` markers come off the passages the handoff lists as built, and the passages they replace are deleted;
   - sections added, changed, moved or removed are recorded in the handoff.

   This lands before the audit, because the audit checks code against the wiki.
3. **Run two passes in parallel:**
   - **The Test Planner's pass** (`docs/test-plans/README.md`).
     - It applies the handoff to the test plans wherever it lands, not only to the cases in the story's Scope, because changed rules, superseded passages and moved sections can touch any case.
     - It resolves Pending PO cases from the PO's rulings.
     - It adds any new or reopened case to the story's Scope, so step 4 covers it.
   - **The story's audit** (`.claude/guides/audit-workflow.md`).
4. **Land the remaining code work:**
   - the audit's Fix Now findings, in batches, each ending with the gate and a stop for review and commit;
   - tests for the cases in Scope that don't have one yet.
5. **Run the Reconciler once**, against the finished code. Running it earlier would map a test layout that step 4 is still changing.
   - It confirms the Scope's cases.
   - It checks the whole catalog for cases whose test is gone, since a story can delete the only test for a case it never scoped.
   - Gaps it finds go back to step 4, or get routed. It then re-checks only those.
6. **Sign off.** Nathan signs off, and the story plan, its audit and its Reconciler report move to `docs/archive/`.

## Before sign-off

- `npm run check` passes, and so does `npm run test:e2e`.
- Every test-plan case in the story's Scope has an automated test, or is approved as manual-only, or has been routed by ID to a later story whose plan or roadmap entry names it.
- Every case the Reconciler found without its test has one again, or is routed the same way.
- No Open question is still waiting on the PO.
- Every Inbound deferral is done, or re-routed to a destination that names it.
- The audit is closed out as `.claude/guides/audit-workflow.md` describes: every required finding has a disposition, and every route out of it has landed in a plan.
- The handoff has been applied by each owner: the wiki, the test plans, and root `CLAUDE.md`.

## A tech-debt story

A tech-debt story closes on less:
- the gate passes;
- its own acceptance checks pass;
- its handoff is applied.

**If it deleted, moved or split test files,** the Reconciler checks the whole catalog for cases whose test is gone, and the lost-coverage condition above applies. Refactors are where tests get split and deleted, so this is the check a tech-debt story needs most.

It gets an audit only when it restructures code. Its plan, and any Reconciler report, move to `docs/archive/` at sign-off like any other.

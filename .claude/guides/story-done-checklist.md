# Story Done Checklist

What happens when a story's code is complete, in order, and what must hold before Nathan signs off. The order matters: each step reads what the one before it produced.

**Before the build, the rules come first.** The PO writes the story's `**Planned:**` wiki passages, and the Test Planner writes their `Planned` cases. The Coder then builds against both, with the Vitest suites. A discovery made while building, or an audit finding that keeps the code, works back to the PO and the Planner through the handoff, but a story isn't planned that way.

## The steps

1. **Write the handoff.** Whoever wrote the code (usually the Coder) fills in the story plan's living-docs handoff (`.claude/guides/story-plan-template.md`).
2. **Update the wiki.** The PO applies the handoff:
   - rulings on the handoff's behavior decisions go in;
   - the `**Planned:**` markers come off the passages the handoff lists as built, and the passages they replace are deleted;
   - sections added, changed, moved or removed are recorded in the handoff.

   This lands before the audit, because the audit checks code against the wiki.
3. **The Test Planner's pass** (`docs/test-plans/README.md`).
   - It applies the handoff to the test plans wherever it lands, not only to the cases in the story's Scope, because changed rules, superseded passages and moved sections can touch any case.
   - It resolves Pending PO cases from the PO's rulings.
   - It adds any new or reopened case to the story's Scope, so steps 4 and 5 cover it.
4. **The Playwright tests.** The Test Planner spawns the Test Automator (`.claude/agents/test-automator.md`) for the Scope's `Open` cases.
   - It writes and updates their Playwright tests, each starting its title with the case's ID (`docs/test-plans/README.md`).
   - It names any case it holds off on, and why, and any test hook it needs, which the Coder adds.
   - The Coder's Vitest tests for the Scope's cases came in with the build.
5. **Run the Reconciler** against the finished tests, the Coder's and the Automator's alike. Running it earlier would map a test layout that step 4 is still changing.
   - It confirms the Scope's cases.
   - It weighs each case the Automator held off on against the internal tests.
   - It checks the whole catalog for cases whose test is gone, since a story can delete the only test for a case it never scoped.
   - Gaps it finds go back to the Automator for a Playwright test, or to the Coder for a Vitest test, or get routed. It then re-checks only those.
6. **The story's audit** (`.claude/guides/audit-workflow.md`). It runs last, so it reads the finished code with its tests in place.
   - Its Fix Now findings land in batches, each ending with the gate and a stop for review and commit.
   - A batch that changes a case's behavior or its tests gets its Playwright tests updated by the Automator. Then a confirming Reconciler run covers just the cases the batches touched.
7. **Sign off.** Nathan signs off, and the story plan, its audit and its Reconciler reports move to `docs/archive/`.

## Before sign-off

- `npm run check` passes, and so does `npm run test:e2e`.
- Every test-plan case in the story's Scope is `Automated` or `Manual`, or has been routed by ID to a later story whose plan or roadmap entry names it.
- Every case the Reconciler moved from `Automated` to `Open` has its test again, or is routed the same way.
- No Open question is still waiting on the PO, and no case in the Scope is `Pending PO`.
- Every Inbound deferral is done, or re-routed to a destination that names it.
- The audit is closed out as `.claude/guides/audit-workflow.md` describes: every required finding has a disposition, and every route out of it has landed in a plan.
- The handoff has been applied by each owner: the wiki, the test plans, and root `AGENTS.md`.

## A tech-debt story

A tech-debt story that also changes what the app does closes by the full checklist above, audit included. One that only reorganizes the code or the process closes on less:
- the gate passes;
- its own acceptance checks pass;
- its handoff is applied.

**If it deleted, moved or split test files,** the Reconciler checks the whole catalog for cases whose test is gone, and the lost-coverage condition above applies. Refactors are where tests get split and deleted, so this is the check a tech-debt story needs most.

It gets an audit only when it restructures code. Its plan, and any Reconciler report, move to `docs/archive/` at sign-off like any other.

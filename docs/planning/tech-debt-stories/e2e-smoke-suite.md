# E2E Smoke Suite

**Type:** tech-debt story. It changes how the Playwright suite is organized and run, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-09 by the Architect, from the [E2E run time round table](../round-tables/e2e-run-time-and-smoke-suite.md) · **Sequenced:** after Epic 3.5 Story 10 closes, on the runner from [Parallel E2E Workers](e2e-parallel-workers.md) · **Status:** a placeholder. It's groomed from the round table when it's picked up, and the round table stays open until then

## Goal

Add a smoke tier: a small, tagged subset of the Playwright suite with a time budget. It answers one question during the build loop: did I break the wiring? Add area tags too, so a run can be "the full set for the area I'm working on, plus smoke for everything else." The full suite still runs at the gates.

**Why:** the round table's Proposal 1 has the reasons. Feedback comes in a minute or two instead of a full run. The cost is concentrated, and much of it is variants of one case. Vitest already proves much of the logic. And a smoke run built from stable tests is one people stop for.

**Out of scope:**
- Changing which tests exist or what they assert. A test can gain tags; no test is removed to make room for smoke.
- The test-plan catalog. Tiers are about running tests, not business rules, so no case gains a tier status.
- The parallel runner, which the Parallel E2E Workers story builds first.

## Where the round table leans

Most responses agree on these, but none is decided yet. They're confirmed or changed at grooming.

- **Tiers:** smoke and full, plus area selection for focused work, with no fixed Standard tier. The Planner, Automator and Reconciler each leaned this way. Nathan listed Standard vs Full as open.
- **Budget:** aim for 90 seconds, with a two-minute ceiling that includes stack start-up, measured at the adopted worker count over repeated runs. An overrun calls for a selection review, never weaker assertions.
- **Tags:** in a test's details, not its title, so the title still starts with its case IDs. Area tags follow the test-plan folders, and a test that crosses areas carries several.
- **Command:** smoke is its own command, kept out of `npm run check`. The checklists call it where it's wanted.
- **API specs:** in smoke, provisionally. They cost about a second together, but they don't prove the browser's proxy wiring.
- **Selecting tests:** two lists are checked against the selection:
  - the round table's seam map, which covers each write path, the reindex fold, the forced stop, each drag context and layer, the tree drag, and boards and columns;
  - the Planner's list of consequences: a write persists; ordering and hierarchy survive it; an invalid action is refused with no write; a stop or cancel leaves no write; a refused write recovers visibly.

  Priority is an input, but not every P0 variant belongs in smoke.
- **Flow tests:** existing tests are tagged first. A smoke-only flow test is written only when shared setup measurably saves time, and it's always an extra test. It carries a case ID only if its setup and assertions prove that case. Otherwise it gets a descriptive title and counts as an uncatalogued integration check.
- **A flaky test:** one unexplained failure means investigation, not a skip or a retry-to-green. A test confirmed intermittent leaves smoke only; it stays in full, and the seam it covered is recorded as a gap or given a replacement. It returns after a fix and repeated clean runs at smoke's own worker count.
- **Ownership:**
  - the criteria go in `.claude/guides/testing-strategy.md` (the Architect, with Nathan's approval);
  - the Automator tags tests and proposes the selection;
  - the Reconciler checks the selected tests' assertions, the seam coverage and the measured budget;
  - each story's Automator proposes additions and removals, and its Reconciler checks them at the story's close.

## Still to decide at grooming

- Standard vs Full: whether there's a third tier.
- The first selection itself, and the seam map it's checked against.
- Who commissions a smoke flow test. The leaning is a Planner's brief naming each step's expected outcome and its seams. That extends the Automator's case-only brief, so it needs Nathan's approval.
- The repeat bar for a test returning to smoke. The Automator proposed twenty clean runs.
- Which checklist calls which tier: the story-done checklist, a batch's stops, an audit's fix batches.
- The exact tag names.

## Related, groomed with it

These came up at the round table. They speed up runs or diagnosis, but they aren't the smoke suite itself.

- **A shorter test-only timer profile** (round table 2b). The cautions from the Coder and Automator:
  - keep the values above zero, since zero-delay clocks are a bug class of their own;
  - keep representative tests per mechanism on the default profile, since some failures only show with real timers;
  - inventory each use before changing it;
  - fix a timing failure under load with a better wait, never a wider margin;
  - and land it apart from any other runner change.
- **Diagnosis without a re-run:** keep the trace of a failed test (`retain-on-failure`), measured against what recording costs.
- **Stopping a red smoke run early,** with `--max-failures`.
- **`--last-failed`** to re-run only the failures, as a diagnosis aid, never a gate.
- **The unit loop** (the Coder's levers): `vitest related` or `--changed` run only what a change touches; and `npm run check` could overlap its phases, once they're timed.

## Work, in batches

Planned at grooming. A likely shape:

1. The criteria into the testing guide (Architect, for Nathan's approval).
2. Tags and the tier scripts (the Automator tags; the Coder adds any config).
3. The first selection, proposed by the Automator and reviewed by the Planner.
4. The Reconciler's check of seam coverage and the measured budget.
5. The checklists name which tier each gate runs.

## Code map

| File | Batch | Change |
|---|---|---|

## Acceptance

Set at grooming. At minimum: smoke runs inside its budget over repeated runs at the adopted worker count; every seam on the map has a smoke test or a recorded gap; the full suite's test list is unchanged except for any added flow tests; and the gate passes.

## Open questions

- **For Nathan:** the items under "Still to decide at grooming".

## Handoff

## Amendments

# Test Reviewer and Reconciler Split

**Type:** tech-debt story. It changes how the test work is run, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-18 by the Architect, from a conversation with Nathan during Epic 3.5 Story 10's close · **Sequenced:** after Story 10's close batches A to C, before its batch D, which is this story's first use · **Status:** draft, for Nathan's review

## Goal

Split the two testing agents by job instead of by when they run. The Test Reviewer becomes the only agent that judges whether tests prove a case. The Test Reconciler becomes the only agent that writes the mapping between the catalog and the tests, and it checks the evidence it's given, never the tests themselves. The process moves out of the agent definitions into a workflow guide, the way the Auditor persona points to `audit-workflow.md`.

**Why now:** both definitions are written for a full pass. Every Reconciler run takes in every case a changed test carries, re-judges each against its whole Then, and sweeps for duplication, uncatalogued tests and candidate cases. A small task that needs only the agents' ability to read across the context gap pays for all of that. Story 10's batch D is the example: five Automation paths, after tests moved unchanged, would cost a Reconciler run over every case the batches' changed tests carry, from specs that carry 93 case IDs.

**The two guards stay:**
- the Test Planner reads no code, so it can't judge whether a test proves a case;
- the QA Engineer wrote the tests, so it can't make a case `Automated` on its own word.

**Out of scope:** the coverage report script (`npm run report:catalog`), the catalog's statuses and fields, and the MVP Test-Process Trim's rulings (one test per case, confirming passes, cost verdicts), which carry over as they stand.

## Decisions

All from the conversation with Nathan on 2026-11-18.

- **D1. Two agents, split by job.** The Test Reviewer is read-only and judges. The Test Reconciler writes and doesn't judge. They stay separate: their tools differ, and a judge that can't write plus a writer that can't judge means every status change passes through two hands.
- **D2. Why there's a guard, stated once and in the profiles.** The Test Planner writes cases from the rules, never from code, so a case can't be bent to fit what the code does; that's also why it can't check a test. The QA Engineer writes the tests, so its claim that they prove a case needs a check from outside. Both agents are independent of whoever wrote the code, the tests or the plan.
- **D3. The auditor pattern.** A new guide, `.claude/guides/test-coverage-workflow.md`, holds the process. The two definitions become short profiles: role, why, what each may read and write, and pointers into the guide.
- **D4. A current verdict, and when to dissect or confirm.** A current verdict is a Test Reviewer "Proves the case", recorded with the tree id it judged, on a test that hasn't changed since except in the ways D5 says need no check.
  - **Dissect,** judging the whole Then clause by clause, only where there's no current verdict: a new test; a changed assertion, Given or expected value; a case whose Then changed; a test proposed as covering a case whose ID it doesn't carry.
  - **Confirm** everything else. A confirming pass checks only the gaps its brief names. A test with a current verdict is shown unchanged, not judged again.
- **D5. Which check a test change needs,** one table in the guide, which `testing-strategy.md` and the QA Engineer and Coder personas point to:

  | Change | Check |
  |---|---|
  | A comment, or a title's wording outside its ID | The gate |
  | How a test reaches its state or aims its gesture, with the same state and every clause still asserted (an equivalent or checked helper swapped in) | A run of the spec |
  | A test moved to another file or renamed, otherwise unchanged | A run, then the Reconciler rewrites the Automation lines whose paths moved |
  | What a test asserts, its Given or an expected value; or a new test | The Test Reviewer, then the Reconciler writes from its verdict |

- **D6. The full review at a close is the Test Reviewer's,** run by a fresh spawn, cold, from the fixed inputs the Reconciler takes today: the plan's Scope and Review log, the coverage report, the green run's record and the range's diffs.
  - It follows D4: it dissects what changed in the range without a current verdict, and confirms the rest through the coverage report.
  - The zoom-out lives here and only here: gaps, lost coverage, duplication, test quality, uncatalogued tests and candidate cases, deferred by default as today.
  - Its instructions give it a different perspective from a review during authoring: the catalog and the suite as a whole, not the tests one stop wrote.
  - Its report is renamed (Open questions) so it doesn't read as the Reconciler's. The Reviewer can't write a file, so it returns the report as its message, and the Reconciler saves it word for word in `docs/audits/` as it applies the statuses.
  - The one follow-up stays: Nathan's approvals of internal mappings and `Manual` proposals, applied by the Reconciler.
- **D7. What the Reconciler accepts as evidence:**
  - **To make a case `Automated`,** or stamp a test with its ID: a current Test Reviewer verdict, or Nathan's approval. A request with only the QA Engineer's word goes back to the Test Reviewer.
  - **To make a case `Open` again:** the coverage report's lost-coverage finding. A downgrade needs nothing more.
  - **To change a path:** a diff showing the tests moved or were renamed unchanged.
  - **Internal mappings and `Manual`:** Nathan's approval, as today.

  It still corrects a stale Automation line and a status disagreement it set, from the coverage report. It judges nothing, so it can run on a smaller model (Open questions).
- **D8. The trade-off, accepted (Nathan).** A test is judged once per change instead of twice, but by two differently spawned and differently instructed reviewers across authoring and the close, both independent of the test's writer. A test with a current verdict is confirmed, not judged again, and that's where the saving is.
- **D9. Names.** The agents keep their names: the Reconciler still keeps the catalog reconciled with the suite, and a rename would reach about 25 files for no change in meaning. The close report gets a new name (Open questions).
- **D10. The test-plans README stays the Test Planner's.** Its lines that give the whole-Then confirmation to the Reconciler go to the Test Planner as a handoff (batch 2).

## Work, in batches

Each batch ends with `npm run check` (its lint runs `check:docs`) and a stop for Nathan's review and commit.

**Batch 1 — the Architect: the guide, the profiles, and the docs that name the agents' jobs.**
1. Write `.claude/guides/test-coverage-workflow.md`:
   - why the mapping is guarded (D2);
   - who stamps, who judges, who writes, and what evidence each write takes (D1, D7);
   - which check a test change needs (D5);
   - a current verdict, dissecting and confirming (D4);
   - the full review at a close: inputs, scope, what it looks for, the report's sections, the follow-up (D6).

   Today's Reconciler sections "How You Map", "On Every Close", "What You Look For" and "Output" move here, revised to D4 and D6, as does the Test Reviewer's "What you check".
2. Rewrite `.claude/agents/test-reviewer.md` as a profile: what it may read (never app source, with the module-header exception), D4's rule, its verdict forms and message, and the two kinds of brief it gets (a review during authoring, the full review at a close), each pointing into the guide.
3. Rewrite `.claude/agents/test-reconciler.md` as a profile: its role in bridging the gap, D2's why, what it may write, D7's evidence, and saving the full review's report. Its description and model change with it.
4. Update the files that describe either agent's job, listed in the Code map.

**Batch 2 — the Test Planner: the README handoff.** In `docs/test-plans/README.md`, the lines that say the Reconciler confirms or judges coverage say instead that the Test Reviewer judges and the Reconciler writes. The two writable fields, and who may set each status, don't change. The Architect's list of the lines goes in Handoff before batch 2 starts.

**Batch 3 — first use: Story 10's close batch D.** A QA Engineer session gives the Reconciler a brief, in the guide's form, with the #25 split's move diff and a fresh coverage report. The Reconciler rewrites the five Automation lines (DRAG-7.28 and DRAG-7.32 to 7.35) and acts on anything else the report flags. No Test Reviewer pass is needed: batch B's changes are D5's second row, and batch C's are its third.

## Code map

| File | Batch | Change |
|---|---|---|
| `.claude/guides/test-coverage-workflow.md` | 1 | New: the process (D2 to D7) |
| `.claude/agents/test-reviewer.md` | 1 | A profile; its checks move to the guide |
| `.claude/agents/test-reconciler.md` | 1 | A profile; its process moves to the guide; description and model |
| `.claude/personas/qa-engineer.md` | 1 | Spawning, the Test Reviewer and Reconciler sections; "A new spec gets the Test Reviewer" becomes a spec of new tests; points to D5 |
| `.claude/personas/test-planner.md` | 1 | What reaches it from the automation side, and the two agents' entries |
| `.claude/personas/product-owner.md` | 1 | A test asserting a rule the wiki doesn't state comes from the Test Reviewer's review |
| `.claude/personas/coder.md` | 1 | Points to D5 for a Vitest change |
| `.claude/guides/testing-strategy.md` | 1 | The two agents' line, and a pointer to D5 |
| `.claude/guides/story-done-checklist.md` | 1 | Step 5 (the full review, then the Reconciler writes), step 6's batch rule, the tech-debt paragraph, the report's name |
| `.claude/guides/epic-done-checklist.md` | 1 | The Reconciler close becomes the full review plus the write |
| `.claude/guides/audit-workflow.md` | 1 | Who answers what a test proves; §5 reads the renamed report |
| `.claude/guides/documentation-standards.md` | 1 | The report's name in the doc-type table and the archive list |
| `.claude/guides/story-plan-template.md` | 1 | The Review log is read by the close's full review |
| `.claude/agents/auditor-consistency-drift.md` | 1 | Whether a test proves its case is the Test Reviewer's question |
| `AGENTS.md` | 1 | The `docs/audits/` line names the renamed report |
| `docs/test-plans/README.md` | 2 | The Test Planner's handoff (D10) |
| `docs/test-plans/*/INDEX.md` | 2 | Only where a line names the Reconciler's report, for the Test Planner |

## Acceptance

- The two profiles hold no process the guide holds; each points to its section.
- No living doc, guide, persona or agent gives the Reconciler a judgment of whether a test proves a case, or the Test Reviewer a write.
- D5's table is in one place, and the docs that need it point to it.
- `npm run check` passes.
- Batch 3 runs as a write-only Reconciler task: five Automation lines, no other catalog field, no Test Reviewer pass.

## Open questions

- **For Nathan: the close report's name.** The Architect proposes "coverage review", saved as `docs/audits/coverage-review-<scope>.md`. Existing reports keep their names; they're transient and move to the archive at their stories' sign-off.
- **For Nathan: the Reconciler's model.** It judges nothing under D7. The Architect proposes `sonnet`, which two of the four audit passes already use.
- **For Nathan: Story 10's batches B and C run before this lands.** The Architect recommends they follow D5 now: a run of the specs that changed, and no Test Reviewer pass, since B changes only how tests reach their state and C only moves tests. The close's step 8 says a batch that changes a case's tests gets a Test Reviewer pass and a confirming Reconciler run; this would be the exception, recorded in the close's Amendments.

## Handoff

- **To the Test Planner, at batch 2:** the README lines, listed here when batch 1 is done.
- **To every later close:** the full review and the Reconciler's write replace the single Reconciler close. Drag Automation Deferrals' story, the E2E Smoke Suite and the Quick Items epic's stories inherit it.

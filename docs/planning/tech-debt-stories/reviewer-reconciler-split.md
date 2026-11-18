# Test Reviewer and Reconciler Split

**Type:** tech-debt story. It changes how the test work is run, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-18 by the Architect, from a conversation with Nathan during Epic 3.5 Story 10's close · **Sequenced:** after Story 10's close batches A to C, before its batch D, which is this story's first use · **Status:** approved by Nathan; batch 1 done, for his review and commit; batches 2 and 3 next, each needing only batch 1

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
- **D4. Dissect, confirm or survey** (as Nathan amended it in review).
  - **Dissect,** judging the whole Then clause by clause: a new test; a changed assertion, Given or expected value; a case whose Then changed; a test proposed as covering a case whose ID it doesn't carry. Such a test is dissected twice in a scope, and no more: on its first pass while it's written, and by the coverage review at the close, which reads the first verdict as evidence, not a ruling.
  - **Confirm** after a dissection. A confirming pass checks only the gaps and changes its brief names, and raises nothing new.
  - **Survey** a settled test, one whose case is `Automated`: read at a close for the questions only the whole suite raises, never re-judged clause by clause. It stays settled until D5's last row changes it, it's deleted, or its case's Then changes.
- **D5. Which check a test change needs,** one table in the guide, which `testing-strategy.md` and the QA Engineer and Coder personas point to:

  | Change | Check |
  |---|---|
  | A comment, or a title's wording outside its ID | The gate |
  | How a test reaches its state or aims its gesture, with the same state and every clause still asserted (an equivalent or checked helper swapped in) | A run of the spec, with the tests' times compared to their last green run |
  | A test moved to another file or renamed, otherwise unchanged | A run, then the Reconciler rewrites the Automation lines whose paths moved |
  | A test deleted, or a case ID dropped from its title | The handoff, then the coverage report: the Reconciler sets lost coverage `Open` |
  | What a test asserts, its Given or an expected value; a case ID added to its title; or a new test | The Test Reviewer now, and the coverage review at the close, whose verdict the Reconciler writes |

- **D6. The full review at a close is the Test Reviewer's,** run by a fresh spawn, cold, from the fixed inputs the Reconciler takes today: the plan's Scope and Review log, the coverage report, the green run's record and the range's diffs.
  - It follows D4: it dissects what the range changed, sorting each test by its diff, surveys the settled tests in its footprint, and checks the rest of the catalog through the coverage report.
  - The zoom-out lives here and only here: gaps, lost coverage, duplication, test quality, uncatalogued tests and candidate cases, deferred by default as today.
  - Its instructions give it a different perspective from a review during authoring: the catalog and the suite as a whole, not the tests one stop wrote.
  - Its report is renamed the coverage review, saved as `docs/audits/coverage-review-<scope>.md`, so it doesn't read as the Reconciler's (Nathan). The Reviewer can't write a file, so it returns the report as its message, and the Reconciler saves it word for word in `docs/audits/` as it applies the statuses.
  - One round settles what it leaves open, and there's no second coverage review: the fixed gaps and any case Nathan reopens get one confirming pass, and the Reconciler writes what it settles and Nathan's approvals in one follow-up.
- **D7. What the Reconciler accepts as evidence:**
  - **To make a case `Automated`,** or stamp a test with its ID: the coverage review's verdict, or the confirming pass's after it; or Nathan's approval. A request with only the QA Engineer's word, or a verdict given while the tests were written, waits for the coverage review.
  - **To make a case `Open` again:** the coverage report's lost-coverage finding, or a coverage review verdict naming the clause no test asserts.
  - **To change a path:** a diff showing the tests moved or were renamed unchanged.
  - **Internal mappings and `Manual`:** Nathan's approval, as today.

  It still corrects a stale Automation line and a status disagreement it set, from the coverage report. It judges nothing, so it runs on `sonnet` (Nathan).
- **D8. The trade-off (Nathan).** A new or changed test is still dissected twice per scope, as before the split: once while it's written and once by the coverage review, by two differently spawned and differently briefed reviewers, both independent of the test's writer. What goes is the recursion: no pass dissects what it has already judged, a settled test is surveyed rather than re-judged, the coverage review's gaps get one confirming pass rather than another review, and a small write between closes gets no review at all.
- **D9. Names.** The agents keep their names: the Reconciler still keeps the catalog reconciled with the suite, and a rename would reach about 25 files for no change in meaning. The close report becomes the coverage review (D6).
- **D10. The test-plans README stays the Test Planner's.** Its lines that give the whole-Then confirmation to the Reconciler go to the Test Planner as a handoff (batch 2).
- **D11. Story 10's batches B and C follow D5 before this lands (Nathan).** Neither changes a test's clauses, so neither gets a Test Reviewer pass. A run shows a helper swap caused no false failure, and comparing the tests' times with their last green run shows it added no real cost. Nathan's comparison is now part of D5's second row. The close records the exception to its step 8 in its Amendments.
- **D12. Details settled while writing batch 1, with Nathan's rulings (2026-11-18).** Each fills a gap the decisions left:
  - **D5 gains a row** (Nathan agreed): a test deleted, or a case ID dropped from its title, goes in the handoff, then the coverage report, and the Reconciler sets lost coverage `Open`. A case ID added to an existing test's title joins the last row, since a stamp is a claim the Test Reviewer judges.
  - **A case becomes `Automated` only at a scope's close** (Nathan kept it). The coverage review marks what's covered and reports the gaps; once they're addressed, no further layer of review follows. A verdict given while tests are written is evidence for that review, not for a status.
  - **A dissection takes in the changed test's own cases** (Nathan agreed), not every test in its file. This is where the old first-pass widening went.
  - **Settled tests are surveyed, not re-dissected** (Nathan agreed). An `Automated` case is trusted as the judgment that set it, until its tests change by D5's last row, are deleted, or its Then changes. The coverage review still reads the settled tests in its footprint for the whole-suite questions. One that may not prove its case becomes a proposal to reopen it, for Nathan, never a status change.
  - **The coverage review sorts every changed test by its diff** (Nathan agreed). One whose diff touches an assertion, a Given or an expected value is dissected, whatever row the Results gave it. So the QA Engineer's choice of row is never an unchecked way past the Test Reviewer, and the review doesn't depend on the Results, which are rewritten at every stop.
  - **For the Reconciler, a verdict counts only across a comment, title wording, move or rename** (Nathan agreed), which it can read off a diff without judging. Any other change goes back for a confirming pass.
  - **Two more records** (Nathan agreed). Each Review log verdict carries the tree id it judged: the log is append-only, so a later pass and the Reconciler can see what changed since. Each test change's D5 row, and its times where the check is a run, go in the Results as the stop's record for Nathan.

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
| `.claude/agents/auditor-consistency-drift.md`, `auditor-correctness-security.md`, `.claude/personas/auditor.md` | 1 | Whether a test proves its case is the Test Reviewer's question |
| `.claude/agents/auditor-duplication-abstraction.md` | 1 | Two tests on one case are the coverage review's to report |
| `AGENTS.md` | 1 | The `docs/audits/` line names the renamed report |
| `docs/test-plans/README.md` | 2 | The Test Planner's handoff (D10) |
| `docs/test-plans/*/INDEX.md` | — | None names the Reconciler or its report: nothing to hand off |

## Acceptance

- The two profiles hold no process the guide holds; each points to its section.
- No living doc, guide, persona or agent gives the Reconciler a judgment of whether a test proves a case, or the Test Reviewer a write.
- D5's table is in one place, and the docs that need it point to it.
- `npm run check` passes.
- Batch 3 runs as a write-only Reconciler task: five Automation lines, no other catalog field, no Test Reviewer pass.

## Open questions

None. Nathan settled the report's name (D6) and the Reconciler's model (D7). Existing Reconciler reports keep their names; they're transient and move to the archive at their stories' sign-off.

## Handoff

- **To the Test Planner, at batch 2:** the lines of `docs/test-plans/README.md` that give the Reconciler a judgment, or name its report, as they stood when batch 1 was done. Each now belongs to the Test Reviewer, the coverage report or the coverage review. The wording is the Test Planner's. The two writable fields, and who may set each status (lines 85 to 88), don't change, and lines 5, 48 and 128 stay true.
  - **Line 11:** the QA Engineer spawns "the Reconciler at the end of a scope". It now spawns the Test Reviewer for the coverage review at a close as well, and the Reconciler to write what they settle.
  - **Line 22:** "the Reconciler's report prints the totals". The coverage report (`npm run report:catalog`) and the coverage review print them.
  - **Line 58:** "A partial mapping belongs in the Reconciler's report". It belongs in the Test Reviewer's verdict, or the coverage review.
  - **Line 64:** "the Reconciler can check that the test asserts what the case says". That's the Test Reviewer.
  - **Line 90:** "the Reconciler moves them to `Automated` once ID-bearing tests prove the whole Then". The coverage review finds that they do; the Reconciler writes the status from its verdict.
  - **Line 93:** "the Reconciler's report names those tests and the part they miss". The coverage review names them.
  - **Line 94:** "the Reconciler confirms whole-Then coverage at the scope's close". The Test Reviewer judges it while tests are written and again in the coverage review, and the Reconciler writes the status from the coverage review at the scope's close. The line's rule holds: an authored or reviewed test makes no case `Automated` before then.
  - **Line 105:** "the Reconciler may find a new one at the close", and "stamps one it finds new". The coverage review finds it; the Reconciler stamps it once Nathan approves.
  - **Line 106:** "the Reconciler doesn't propose the internal test". The Test Reviewer doesn't.
  - **Line 113:** "The Reconciler may propose it". The Test Reviewer may, in a review or the coverage review. Applying an approval stays as the line says.
  - **Line 129:** "The Reconciler stamps only coverage it finds new at the close, and writes the Automation line for every case it confirms". It stamps only what the Test Reviewer or Nathan found new, and writes the line for every case its evidence confirms.
  - **Line 132:** "the Reconciler checks that" a case still has a test. The coverage report checks it.
  - **Lines 134 to 138, "What the Reconciler writes":** line 136's two fields and limits hold. Line 138's "runs cold once, at the end of a scope" from fixed inputs, reading the tests itself, is now the Test Reviewer's coverage review. The Reconciler writes from the evidence `.claude/guides/test-coverage-workflow.md` names ("What the Reconciler accepts"), at a close or when a plan asks.
  - **Line 147:** "every Test Reviewer verdict, including later passes". Each now carries the tree id it judged.
  - **Line 150:** "The Reconciler confirms verdicts from the tests and answers each open one at the close." The coverage review answers each open verdict.
- **To every later close:** the full review and the Reconciler's write replace the single Reconciler close. Drag Automation Deferrals' story, the E2E Smoke Suite and the Quick Items epic's stories inherit it.

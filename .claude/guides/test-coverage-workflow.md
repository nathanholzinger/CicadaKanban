# Test Coverage Workflow

How the test-plan catalog and the automated tests are kept in step: why the mapping between them is guarded, who judges and who writes, which check each kind of test change needs, and the coverage review at a close. The QA Engineer briefs both agents from it: the Test Reviewer (`.claude/agents/test-reviewer.md`), which judges, and the Test Reconciler (`.claude/agents/test-reconciler.md`), which writes. The catalog's conventions are in `docs/test-plans/README.md`, and the test layers in `.claude/guides/testing-strategy.md`.

## 1. Why the mapping is guarded

A case's status tells a reader whether the suite proves the case, so it's worth only as much as the check behind it.
- **The Test Planner writes cases from the rules, never from code,** so a case can't be bent to fit what the code does. For the same reason it can't check a test: that takes reading the test.
- **The QA Engineer and the Coder write the tests,** so their claim that a test proves a case needs a check from outside. A case ID stamped on a test's title is that claim.

So the check sits with two agents, both independent of whoever wrote the code, the tests or the plan. The Test Reviewer judges and can't write. The Test Reconciler writes and doesn't judge. Every status change passes through both.

## 2. Who does what

| Role | Does | Never |
|---|---|---|
| QA Engineer | Writes the Playwright tests and stamps its own, picks each change's check (Which check a test change needs), briefs both agents, and records the Test Reviewer's verdicts | Sets a status or writes an Automation line |
| Coder | Writes the Vitest suites with the build, and lists its changes to ID-bearing tests for the Test Reviewer | The same |
| Test Reviewer | Judges whether tests prove their cases, while they're written and in the coverage review at a close; proposes mappings, cost verdicts and `Manual` | Writes a file, or reads app source |
| Test Reconciler | Writes statuses, Automation lines and stamps from the evidence each takes (What the Reconciler accepts), and saves the coverage review | Judges whether a test proves a case |
| Test Planner | Writes the cases, and the statuses the catalog's README gives it | Reads a test |
| Nathan | Approves internal mappings, `Manual` calls and cost verdicts, and decides on reopening a settled case | — |

## 3. Which check a test change needs

The QA Engineer picks the row for each changed test and records it in the plan's Results. A change that fits two rows takes the later one.

| Change | Check |
|---|---|
| A comment, or a title's wording outside its case ID | The gate |
| How a test reaches its state or aims its gesture, with the same state and every clause still asserted, such as an equivalent or checked helper swapped in | A run of the file, with each Playwright test's time compared to its last green run |
| A test moved to another file or renamed, otherwise unchanged | A run, then the Reconciler rewrites the Automation lines whose paths moved, from the move's diff |
| A test deleted, or a case ID dropped from its title | The living-docs handoff, then the coverage report: the Reconciler sets a case with lost coverage back to `Open` |
| What a test asserts, its Given or an expected value; a case ID added to its title; or a new test | The Test Reviewer now, and the coverage review at the close, whose verdict the Reconciler writes |

- **A red run, or a test that's noticeably slower,** goes to Nathan before the change lands, with the times. Never change the test to make it pass.
- **A case becomes `Automated` only at a scope's close,** from the coverage review. A verdict given while tests are written is evidence for that review, not for a status. Between closes, the Reconciler writes only what a plan asks for, from the evidence What the Reconciler accepts names, such as paths a refactor moved or coverage the coverage report finds lost.

## 4. Dissect, confirm or survey

A test gets one of three depths of review.

**Dissect:** judge the case's whole Then, clause by clause (What a dissection checks). A dissection takes in every case the test carries, on its own title or its `describe`'s, and no other test in its file. It's for:
- a new test;
- a test changed by the table's last row;
- a test whose case's Then changed;
- a test proposed as covering a case whose ID it doesn't carry.

**Such a test is dissected twice in a scope, and no more:** on its first pass while it's written, and once by the coverage review at the close. The two reviewers are spawned apart and briefed for different views, and both are independent of the test's writer. The coverage review reads the first verdict as evidence, not a ruling.

**Confirm:** every pass after a dissection. A confirming pass checks only what its brief names: each gap an earlier pass found, and each change made since, as a before-and-after. It reports a regression, a clause an earlier pass found proved that a change no longer asserts. It raises nothing new: no gap, cost verdict, case gap or rule gap.

**Survey:** a settled test, read at a close for the questions only the whole suite raises (The coverage review), and never judged clause by clause. A case that's `Automated` is settled, and so are the tests its Automation line names. It stays settled until a test of it changes by the table's last row, a test of it is deleted, or its Then changes, and then that test is dissected. A comment fix, a helper swap or a move leaves it settled.

**A third pass over the same tests,** while they're written or after the coverage review, happens only when its brief says Nathan asked for one.

## 5. What a dissection checks

1. **The tests carrying a case's ID, alone or together, assert all of its Then.** Name each clause, and the test that asserts it. A clause no test asserts is a gap. A variant the Then doesn't name is never a gap (`.claude/guides/testing-strategy.md`, "How many tests a case gets").
2. **Each expected value is the Then's.** A value the Then names by name, such as a tunable value or a limit, is read from the configuration, never pinned as today's number. A detail the Then leaves open may come from anywhere, and a test may pin one, such as an exact error message. That isn't a gap.
3. **The test asserts its Given before its When.** A test that acts without confirming its starting state can pass for the wrong reason.
4. **The test observes through the app.** Each observation helper's header says whether it reads the screen or an attribute the app provides. An assertion that reads back what the test set, or a value the test computed itself, proves nothing.
5. **A correction after a red run still asserts the whole Then.** A weakened assertion, a widened tolerance, a dropped clause, a changed expected value or a skip is a gap, unless the Then supports the new form. A correction to how the test reaches its state or aims its gesture is fine if every clause still holds.
6. **Which tests count** (`docs/test-plans/README.md`, "Which tests count, and what's manual"). A test through a surface counts as it is. An internal test counts only once Nathan approves its mapping. A skipped test never counts.
7. **What a test costs against what it proves** (`.claude/guides/testing-strategy.md`, "When a surface test costs more than it proves"). Give a cost verdict for every test that shows one of these signals:
   - a precision the Then doesn't state, such as an exact position, offset or timing where the Then names only an outcome;
   - a wait or a step that buys no clause;
   - one gesture repeated across variants that differ in the outcome and not in the gesture;
   - a second correction to its aim or its timing, in the brief;
   - a flakiness risk: a race against a held response or one of the app's clocks, or an aim at a narrow band;
   - an assertion about how something looks, which the testing strategy's "What stays manual" leaves to a person.

   The verdict is **Keep**, **Simplify**, **Cut** or **Manual**. Name the clause, the cost, and the simpler form or the layer that would prove the same clause whole, or, for Cut, what would no longer be proved. A Cut or Manual that would leave a clause unproved says so: the case then stays `Open`, or goes `Manual`, as Nathan decides. A cost verdict carries the same weight as a gap, and is never a reason to accept a missing clause. Ask for more precision only where the Then states it.

**A held-off case:** look for internal tests that cover it. Say whether they cover all of its Then, part of it or none of it, and name them. If none do, say whether an internal test could. Nathan decides with the verdict in hand, and the QA Engineer writes a new test only after he approves. A case whose Then can't be pinned through any test is also a case gap.

**A test that covers a case but doesn't carry its ID:** propose the mapping, naming which test gets which ID. An internal test's mapping needs Nathan's approval.

**A `Manual` verdict is a recommendation only.** Nathan approves it, and a Planner session or the Reconciler applies it.

**An area ruled out of the MVP:** a finding in one, such as an outcome about assistive tech, goes under Deferred as one line, with no verdict. If a case's Then itself asks for it, say so: that case needs aligning, which Nathan routes. The areas are listed in
<!-- check-docs-ignore-next-line transient-link -- names where open work is tracked -->
`docs/planning/mvp-deferrals.md`.

## 6. A review while tests are written

The QA Engineer spawns the Test Reviewer after it writes or changes tests that the table sends to it, before the stop's check-in, and for the Vitest changes the Coder lists. Within one session it continues the same reviewer; a new session spawns a fresh one.

**The brief gives:**
- the tree id the pass judges;
- the case IDs, and the tests that carry each, by file and title, each marked for dissection, on its first pass, or for confirmation;
- the files changed since the reviewer's last pass, from `git diff --name-only` between the tree id at that pass and now;
- for a confirming pass, the gaps an earlier pass found, and the change made for each;
- every correction made after a red run, as a before-and-after with no reason given;
- the Coder's listed Vitest changes;
- the held-off cases, with the QA Engineer's reason for each.

It gives no reason for a change and argues no verdict. The QA Engineer records the verdicts in the plan's Review log, word for word with the tree id, and routes them (`.claude/personas/qa-engineer.md`, "The Test Reviewer").

## 7. The coverage review

At a scope's close (a story's, an epic's, a baseline, or a batch a plan names as a scope), a fresh Test Reviewer reviews the catalog against the suite as a whole. It runs once, cold: what it knows comes from its inputs, not from the work that led to the close. Its view is a reader of the catalog's, not the author of one stop's tests: does what the catalog claims hold across the suite?

**Its inputs are fixed.** The QA Engineer's brief hands them over, and a brief can't add to them:
- **The plan:** its Scope, and its Review log, which holds the verdicts with their tree ids, the desk's answers, and the mappings Nathan declined.
- **The coverage report,** from `npm run report:catalog`, run on the green run's tree. It checks the whole catalog for lost coverage, a `Manual` case a running test carries, a stale Automation line, and a case whose two statuses disagree. It also gives the ID-to-files map and the totals.
- **A record of a green run:** the suites that carry the scope's cases, the tree id they ran on, and the JSON report paths.
- **The range's diffs:** the test files' and the catalog's, from the scope's start to the green run's tree.

Neither agent has a shell: the QA Engineer runs the commands first, and hands over their output.

**Its scope:**
- **Each test the range changed, sorted by its diff.** A new test, or one whose diff touches an assertion, a Given or an expected value, is dissected, whatever its verdicts while it was written said. A test changed only by a comment, title wording, a move, a rename, or a helper swap that keeps its state and every clause leaves its case's status as it was. The sort reads the diff, never the row the Results give the change.
- **Each case whose Then changed in the range** is dissected.
- **Each case in the plan's Scope, and every case the range's diffs touch, gets a status:** `Automated`, from this review's dissection or a settled status the range left standing, or `Open`, with the clause no test asserts.
- **The settled tests in its footprint are surveyed:** those that carry a Scope case, or a case a changed test carries. Read them for the questions below, without judging them clause by clause.
- **A case in the Scope with no test carrying its ID:** look for a test that covers it anyway, whoever wrote it.
- **The whole catalog, through the coverage report.** Act on each of its findings, and never sweep the catalog by hand.
- **Every open verdict in the Review log:** answer each one, resolved and by what, or still open. A mapping Nathan declined stays declined unless its test changed since.

**What it looks for, here and nowhere else:**
- **Gaps:** an `Open` case with no test. One that looks genuinely hard to automate gets a `Manual` proposal, with the reason, and Nathan decides.
- **Lost coverage:** an `Automated` case no running test carries goes back to `Open`. List each one: a scope can delete the only test for a case it never named.
- **Duplication:** several tests, especially across layers, covering one case, a new test and a settled one included. It's often intended: report it, and don't judge it.
- **Test quality:** a mapped test that restates what the code does instead of asserting the rule, such as one that hardcodes today's output as its expected value. Flag it, with the rule it should check. A concern about a test still counted as covering its case is deferred by default. A test not counted leaves its case `Open`, as a gap.
- **A settled case that may not be proved,** such as one whose tests look thin taken together: propose reopening it, for Nathan, with the reason. It's never a status change. If he reopens it, the confirming pass dissects it.
- **Uncatalogued tests,** in two kinds kept apart. Tests that exist for the coverage gate and match no standalone rule are listed, never forced into a mapping. Tests of a real scenario the catalog missed are **candidate new cases**: say whether the rule is in the wiki (a Test Planner gap) or nowhere (a Product Owner gap).
- **A candidate is deferred by default,** to the destination the MVP's deferrals catalog names,
  <!-- check-docs-ignore-next-line transient-link -- names where open work is tracked -->
  `docs/planning/mvp-deferrals.md`, never the current scope. Nathan may pull one forward.
- **Not a gap:** missing coverage of the MCP tools (`server/src/mcp.ts`). A case that differs from another only in being made through an MCP tool is a candidate for removal from the catalog.

**The report** is the reviewer's message, in these sections: Tree (the tree id it judged), Coverage Mapping (each case's status, its tests by file and title, and the verdict behind it), Coverage Report Findings (the write each needs), Stamps to Add, Review Log Answers, Proposed Internal Mappings (need approval), Proposed Manual (need approval), Proposed Reopenings (need approval), Gaps, Duplication, Test Quality Concerns, Uncatalogued Tests, Candidate New Cases, and Totals (the coverage report's, with this review's statuses applied). Every verdict names the case, the clause, and the test's file and title, so the report stands as evidence on its own.

**Then the Reconciler** saves the report word for word as `docs/audits/coverage-review-<scope>.md`, and makes the writes it lists.

**After it, one round settles what it left open, and there's no second coverage review.** Its gaps go back to the QA Engineer or the Coder for a test, or get routed, and Nathan decides its proposals. The QA Engineer then continues the same reviewer for one confirming pass, over just the fixed gaps and any case Nathan reopened. In one follow-up, the Reconciler writes what that pass settles and applies Nathan's approvals, and adds a Follow-up section to the saved report.

**Out of its scope:** why a test fails (say it fails at clause X, and stop); rebuilding the green run's evidence, such as runtime forensics, hashes or write masks; and code quality, which `/code-review` and the audit cover.

The story's audit reads the coverage review at its Reconcile step (`.claude/guides/audit-workflow.md`).

## 8. What the Reconciler accepts

The Reconciler writes only from evidence, and checks the evidence, never the tests. A brief names each write and hands over its evidence. A write whose evidence is missing goes back, with what's missing.

| Write | Evidence |
|---|---|
| A case to `Automated`, or a case ID stamped on a test's title | The coverage review's "Proves the case" verdict, or the confirming pass's after it, cited with its tree id; or Nathan's approval |
| An internal test's mapping, or `Manual` | Nathan's approval |
| A case back to `Open` | The coverage report's lost-coverage finding, or a coverage review verdict naming the clause no test asserts |
| An Automation line's paths | A diff showing the tests moved or were renamed and nothing else, or the coverage report's stale-line finding |
| One of a case's two statuses, where they disagree | The coverage report, for a status the Reconciler set. Any other goes to the Test Planner |
| A retired ID removed from a title | The case is gone from the catalog |

- **The QA Engineer's word, or a verdict given while the tests were written, isn't evidence for a status.** A request that carries only one of them waits for the coverage review.
- **A verdict counts only if its tests haven't changed since its tree id,** or changed only by a comment, title wording, a move or a rename, which the brief's diff shows. Any other change goes back to the Test Reviewer, for a confirming pass over just that change.

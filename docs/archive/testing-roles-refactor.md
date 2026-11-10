# Testing Roles Refactor

**Type:** tech-debt story. It rewrites the testing roles' personas, agents and workflow guides, and changes no code, so it closes on Nathan's approval of the drafts and the gate, with no audit · **Written:** 2026-11-09 by the Architect, from the [testing roles round table](../round-tables/testing-roles.md) · **Sequenced:** after Epic 3.5 Story 10's batch 4b closes and is committed, on today's instructions, and before [Parallel E2E Workers](e2e-parallel-workers.md), whose batch 3 the QA Engineer validates. It lands before the [Catalog Coverage Report](catalog-coverage-report.md), the first Coder work to run `/code-review` under it. Story 10's batch 4c starts on the new roles · **Status:** all four batches done; batches 1–3 committed, batch 4 for Nathan's review and sign-off.

## Goal

Restructure the testing roles so that:

- Nathan talks directly to a session that reads code for automation work;
- review happens in small, scoped checks while the work runs;
- reconciliation runs once, at the end of a scope.

**Why** (the round table's "Why now" has the detail):

- **The lead couldn't read code.** The lead for testing work was the Test Planner, which never reads code. It relayed between Nathan and the agents, and used the Reconciler to look at code for it.
- **Reconciliation ran too often, at full size.** The Reconciler ran five times in batch 4b, writing 176 KB of reports, and each run was sized for a story's close. The reports took on diagnosis, and the hash forensics the briefs asked for.
- **Code-blindness in the lead wasn't the safeguard.** Three things kept expected values honest: the Automator's rules, the Planner's check of each matrix row against the case, and an independent reader of the tests. This refactor keeps all three.

**Out of scope:**

- Which tests exist, what the cases say, and the catalog's statuses. They change only through the new roles' normal work.
- A custom code-review agent. `/code-review` goes into the workflow instead (decision 9). A custom agent can be built later if the need shows.
- The catalog coverage report: its own story, [Catalog Coverage Report](catalog-coverage-report.md), landing before 4c.
- The parallel runner. Its decision 9 (one session builds the runner, another validates it) stands, with the QA Engineer as the validator.

## Decisions

Settled at the round table, Nathan's answers included. They're numbered 1–16 so they don't read as Story 10's D-numbers. The round table holds the reasoning: "Decided N" and "Open N" refer to the Architect's "decisions and what's open" follow-up there.

### The roles

**1. Two personas Nathan talks to** (Option C).

- **The Test Planner, for test-plan decisions:** cases, rewording, `Pending PO` questions, updates from the PO's rule changes, and the end-of-epic pass. It stops spawning the Test Automator and the Test Reconciler.
- **The QA Engineer, for automation decisions.** It takes the Test Automator's job, plus:
  - test infrastructure;
  - diagnosing failures;
  - each stop's Results;
  - spawning the test reviewer and the end-of-scope reconciler.

**2. The QA Engineer keeps the Automator's rules word for word:** "Where assertions come from", "When a test fails" and "Holding off". Added to them:

- **It owns the Playwright suites and their support:** `tests/ui/`, `tests/api/`, `tests/helpers/`, `tests/pages/`, `tests/fixtures.ts`, `playwright.config.ts`, and the global setup and teardown.
- **It never edits app source.** A test hook or a test route goes to the Coder.
- **It never edits case text,** never sets a status and never writes an Automation line.
- **It never edits a test, Vitest or Playwright, to make it pass.**
- **A defect it hands the Coder** carries the failing clause, the expected and observed results through the surface, and a reproducer. It may say where it looked. It never prescribes the fix.

**3. The desk.** The QA Engineer may spawn a thin, read-only Planner agent at any stop, for questions about how a case reads (Decided 2).

- A question is asked from the case, never from what the app did.
- The reply comes per row, in a fixed form: follows the Then; contradicts it; not stated by the Then or the wiki; or the case is silent, so it needs a session.
- The question and the reply go in the plan's Review log (decision 16) word for word, with the Then quoted. A later change to the case then visibly voids the answer.
- A follow-up within the same task continues the same agent.
- Rewording, a Split, a `Pending PO` question and a `Manual` call are never desk work. They're a Planner session Nathan opens.
- The agent's file holds only its inputs, its read-only tools, the reply form, and "never edits, never answers from the app". For how a case is read, it points to a short desk section of the Planner persona, as the auditor agents point to theirs.

**4. Guards against long sessions** (Decided 3).

- One session per stop. Stop 2 rewrites its resume packet after each matrix family, so a usage cut loses one family.
- A batch's Results are one current packet that replaces the last: the snapshot id, each case's state, the open questions, the files in scope, the next command, and the JSON report paths.
- Long runs go to a background command, with a named JSON report per repeat batch as the ledger.
- The Planner's end-of-epic pass gets the same resume-packet rule.

**5. The snapshot id is a tree id** (Decided 4). It's written through a temporary index (`GIT_INDEX_FILE=<temp> git add -A && git write-tree`), so untracked files count and the real index is untouched.

- It replaces per-file fingerprints, Stop 4's included.
- A Coder return records a tree id at its start and at its end. `git diff` between them isolates the Coder's change in a shared, uncommitted tree.

### Review

**6. The test reviewer** is a read-only agent. The QA Engineer spawns it, for its own tests and for the Coder's Vitest changes listed in the handoff (decision 7). (Decided 7.)

- **It reads, in this order:**
  1. the Then, from the catalog;
  2. the wiki sections the case cites;
  3. the tests named;
  4. the helpers those tests observe through.

  For an internal test, it may also read the module header and the directory's `AGENTS.md`, never the module's body. If those don't settle the question, the verdict says "can't tell".

- **It gets every correction made after a red run** as a before-and-after, with no justification, and checks it against the whole Then.
- **Its scope** is what changed since its last pass, widened to every ID carried by tests in the files a change touched.
- **It proposes mappings in its message and writes nothing.** Its verdicts go in the plan's Review log word for word, every run included, and the close answers every open one.
- **A verdict routes one of three ways:**
  - a test gap goes to the QA Engineer;
  - a case gap goes to a Planner session, through the plan's Open questions;
  - a rule gap goes to the PO.

**7. Which Vitest changes go to the reviewer:** a change to what an ID-bearing test asserts, or to the state it sets up, whatever the reason. A rename or an import change doesn't. The Coder lists such changes in the handoff, where the catalog README already has it list its changes to ID-bearing Vitest tests. (Nathan, Open 1.)

**8. Two writing rules make review cheap:**

- a test asserts its Given before its When;
- each observation helper's header says whether it reads the screen or an attribute the app provides.

**9. Code review is `/code-review`, not a custom agent** (Nathan).

- **The author runs it** before the check-in, on a change that alters behavior. That's the Coder, the Architect when it writes code, and the QA Engineer when it changes shared test infrastructure: the helpers, fixtures and pages, the config, and the global setup and teardown. A new spec gets the test reviewer, and the audit reviews test code as code.
- **It's a self-check, not an independent guard** (Nathan). The code-quality audit and the reconciliation at the story's close stay the independent checks.
- **It doesn't run** on stamps or `data-*` hooks.
- **It runs at a stated effort level,** starting at `medium` and adjusted as the trial shows (Work, in batches), and never at `max` or `ultra` unless Nathan asks.
- **In a tree that holds other sessions' edits,** it's pointed at the session's own files.
- **Correctness findings are fixed in the batch.** Cleanup suggestions go in the return as notes, and aren't acted on mid-batch.
- **The return records** the level, what was reviewed, each finding, and what was done with it.
- **It doesn't repeat the wiki check.** Tests written from the cases are the guard that the code matches the wiki. The tests, the test reviewer and the audit stay the independent checks.

**10. Reconciliation runs only at the end of a scope:** a story's close, an epic's close, a baseline, and each Story 10 batch's close. (Decided 9.)

- **It runs cold.** Its inputs:
  - the catalog, the wiki and the tests;
  - the coverage report;
  - the plan's Review log, with its reviewer verdicts and declined mappings;
  - a record of a green run;
  - the range's test and catalog diffs.
- **The QA Engineer spawns it with that brief and nothing more** (Nathan, Open 5). The reconciler's definition fixes its inputs, so a brief can't ask for more.
- **What it writes:** `Automated`, `Open` when coverage is lost, an approved `Manual`, the Automation lines, and its report, as the catalog README's Statuses table says.
- **What it leaves alone:** diagnosis, runtime forensics, hashes and write masks. It says "fails at clause X" and stops.

**11. Reconciliation stays out of the audit,** with no fifth pass. At its Reconcile step, the audit's orchestrator reads the reconciliation report, and a drift finding that overlaps one merges into it by reference. (Decided 8.)

### Stamps and the Vitest suites

**12. Stamps** (Decided 11):

- **The QA Engineer** stamps its own Playwright tests as it writes them, and stamps approved Vitest mappings, before the freeze.
- **The reconciler** stamps only what it finds new at the close, on a test's own title, never a `describe`. It writes the Automation line for every case it confirms, whoever stamped the test. A test that only partly covers a case keeps its stamp, and the case stays `Open`.
- **Either** may remove a retired ID, never a live case's.
- **Every stamp is checked** by a title-only diff, with `check:docs` run after. Freeze evidence compares test lists with ID prefixes stripped.

**13. The Vitest overlap.** The Coder or the QA Engineer may edit a Vitest test, whoever Nathan asks first. The QA Engineer writes a new Vitest test only for a held-off case, in this order:

1. the test reviewer weighs whether internal tests cover it;
2. Nathan approves, with that verdict in hand;
3. the QA Engineer writes it from the Then.

It never writes a regression test pinned to a fix. (Decided 13.)

**14. The lock is Nathan's file list,** named when he opens a session (Decided 12).

**15. Story 10's separate-session rule becomes one Coder session per stop,** carrying all of that stop's hooks and test routes, with a check-in at its return. A behavior change still gets its own handoff. The rule is revisited if it proves too loose or too strict. (Nathan, Open 4.)

### Records

**16. A story plan gets a Review log section.** It holds the desk's questions and replies, the test reviewer's verdicts, and the mappings Nathan declined. The QA Engineer records them, and the reconciler reads them at the close. A Story 10 batch keeps its log in the batches doc.

## Work, in batches

Each batch ends with `npm run check`, whose lint step runs `check:docs` over `.claude/`, and a stop for Nathan's review.

**The `/code-review` trial needs no batch of its own.** Nothing runs on 4b, which is committed first.

- **It starts with the first Coder work under the new instructions:** the [Catalog Coverage Report](catalog-coverage-report.md), which follows this story's batch 3. Story 10's batches 4c–4h continue it.
- **The record:** each return's notes (decision 9) show how the review runs (inside the calling session, or in fresh agents), what it costs, whether it follows root `AGENTS.md`'s conventions, and what it finds. The effort level is adjusted from those notes.
- **None of these is a feature story,** so a firmer verdict waits for the Quick Items epic, the first feature epic after Story 10.

**Batch 1 — the new files (Architect).** They're additive, and nothing uses them until batch 2 lands, so this batch can start once 4b is committed.

- `.claude/personas/qa-engineer.md`: decisions 1–5, 8, 9 and 12–14.
- `.claude/agents/test-reviewer.md`, with read-only tools: decisions 6 and 7.
- `.claude/agents/test-planner-desk.md`, with read-only tools: decision 3.
- **`.claude/personas/test-planner.md`: the desk section** the desk agent points to (Nathan moved it here from batch 2). It's a new section, and nothing in today's flow reads it.

**Batch 2 — the rewrites (Architect).**

- **`.claude/agents/test-reconciler.md`, rewritten** (decisions 10–12):
  - "On Every Run" becomes the close, reading the coverage report;
  - the proposing mode goes, since the reviewer replaces it;
  - the inputs are fixed;
  - title stamps join "What You May Write";
  - a line on what's out of its scope.
- **`.claude/personas/test-planner.md`:**
  - it no longer spawns the Automator or the Reconciler;
  - the resume-packet rule for the end-of-epic pass;
  - its relationships, updated.
- **`.claude/personas/coder.md`:** the QA Engineer in place of the Automator, the Vitest overlap, `/code-review` before a check-in, and the mirror rule.
- **`.claude/personas/architect.md`:** `/code-review` when it writes code.
- **`.claude/personas/product-owner.md`:** its relationships.
- **`.claude/personas/auditor.md` and three auditor agents:** whether a test proves its case is the test reviewer's and the reconciler's question.
- **`.claude/guides/testing-strategy.md`:** "Who writes which", and the writing rules (decision 8). The runner story's batch 4 edits "Running the tests" in the same file. Both are the Architect's, so they're done in one pass if they coincide.
- **`.claude/agents/test-automator.md` retires:** deleted, with Nathan's confirmation at the time. Its rules live on in the QA Engineer persona.

**Batch 3 — the workflow guides (Architect).**

- **`.claude/guides/story-done-checklist.md`:** steps 4–6 and the tech-debt section. They cover:
  - the QA Engineer's tests;
  - the test reviewer;
  - the end-of-scope reconciler, which the QA Engineer spawns;
  - `/code-review` in the build and in the audit's fix batches.
- **`.claude/guides/epic-done-checklist.md`:** who re-titles moved cases, and who runs the epic's reconciliation.
- **`.claude/guides/audit-workflow.md`:**
  - §4 and §9: where "a test may not prove its case" goes;
  - §5: the Reconcile step reads the reconciliation report and merges overlapping drift findings by reference;
  - §8: fix batches run `/code-review`.
- **`.claude/guides/documentation-standards.md`:** the ownership rows that name the testing roles.
- **`.claude/guides/story-plan-template.md`:** the Review log section (decision 16); a Results section holding the one current packet (decision 4), since only the Story 10 batches doc has one today; and the two lines that name the Planner.

**Batch 4 — handoffs and Story 10 (Architect, with the Planner).** It can run alongside batch 3.

- **The Planner's pass on the catalog README** (`docs/test-plans/README.md`), handed off to the Planner. It covers:
  - the roles, renamed;
  - what a reviewer pass and a batch close do to a status;
  - the fields the coverage report reads, in a fixed form;
  - the Review log as the place for desk answers and declined mappings;
  - who applies an approved `Manual`;
  - who re-titles a test when its case moves.
- **Story 10's amendment,** written once 4b has closed and its sessions are done editing:
  - **In the batches doc:** the five stops under the new roles. That means the desk, the reviewer's pass in Stop 2, the tree id, the one current packet, background runs in Stop 4, and the reconciler spawned by the QA Engineer at Stop 5. The Review log moves into the doc too.
  - **In the plan:** D7 and D12 as they change, and decision 15's session rule.
  - The parallel plan's decision 8, the D2 carry-forward, goes in the same amendment if Nathan has approved it.
- **The Architect's memory notes** that name the old roles.

**Planner's pass applied:** the catalog README and Story 10's two planning docs are updated. Review log placement is confirmed below. No cases, statuses, test files or app source change. The parallel plan's decision 8 is still an Open question for Nathan, so D2's carry-forward is left pending. The Architect retains its memory-note pass.

## Code map

| File                                                                                                                                                  | Batch | Change                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------ |
| `.claude/personas/qa-engineer.md`                                                                                                                     | 1     | New                                              |
| `.claude/agents/test-reviewer.md`                                                                                                                     | 1     | New, read-only                                   |
| `.claude/agents/test-planner-desk.md`                                                                                                                 | 1     | New, read-only                                   |
| `.claude/agents/test-reconciler.md`                                                                                                                   | 2     | Rewritten for the end of a scope                 |
| `.claude/personas/test-planner.md`                                                                                                                    | 1, 2  | Desk section (1); no spawning, resume packet (2) |
| `.claude/personas/coder.md`                                                                                                                           | 2     | QA Engineer, Vitest overlap, `/code-review`      |
| `.claude/personas/architect.md`                                                                                                                       | 2     | `/code-review`                                   |
| `.claude/personas/product-owner.md`                                                                                                                   | 2     | Relationships                                    |
| `.claude/personas/auditor.md`, `.claude/agents/auditor-consistency-drift.md`, `auditor-correctness-security.md`, `auditor-duplication-abstraction.md` | 2     | Who judges whether a test proves its case        |
| `.claude/guides/testing-strategy.md`                                                                                                                  | 2     | Who writes which; writing rules                  |
| `.claude/agents/test-automator.md`                                                                                                                    | 2     | Deleted, on Nathan's confirmation                |
| `.claude/guides/story-done-checklist.md`                                                                                                              | 3     | Steps 4–6, the tech-debt section                 |
| `.claude/guides/epic-done-checklist.md`                                                                                                               | 3     | Re-titling, reconciliation                       |
| `.claude/guides/audit-workflow.md`                                                                                                                    | 3     | §4, §5, §8, §9                                   |
| `.claude/guides/documentation-standards.md`                                                                                                           | 3     | Ownership rows                                   |
| `.claude/guides/story-plan-template.md`                                                                                                               | 3     | Review log; Results; Planner lines               |
| `docs/test-plans/README.md`                                                                                                                           | 4     | The Planner's pass (handoff)                     |
| `docs/planning/epic-3-5-stories/story-10-batches.md`, `story-10-dnd-automation-catch-up.md`                                                           | 4     | Amendment                                        |

## Acceptance

1. The QA Engineer persona, the test-reviewer agent, the desk agent and the rewritten reconciler exist. The reviewer and the desk have read-only tools.
2. No living doc or `.claude/` file names the Test Automator as a current role, or has the Planner spawning the Automator or the Reconciler.
3. The story-done and epic-done checklists, the audit guide and the testing guide describe the same flow as the decisions.
4. `/code-review` is in the Coder's, the Architect's and the QA Engineer's instructions, with its level, when it runs, and what the return records.
5. The Planner's README pass is applied, or handed off with each item named.
6. Story 10's amendment is recorded before 4c's Stop 1.
7. `npm run check` passes.

## Open questions

None for the Planner. Its placement answer is recorded in Amendments; the Architect's remaining work is in Handoff.

## Handoff

- **The Test Planner, applied:** the catalog README pass (batch 4), including fixed report fields, status authority, Review log, Manual decisions and re-titling.
- **Story 10, applied:** the amendment (batch 4) in D7/D12 and the remaining five stops; no D2 carry-forward approval is inferred.
- **The Architect, applied:** the batch 4 memory-note pass. Two notes named the retired roles and now name the new ones, and a new note tracks the `/code-review` trial past this plan's archiving.
- **[Catalog Coverage Report](catalog-coverage-report.md):** the rewritten reconciler reads its report and names its command. Its Coder batch is the first run of the `/code-review` trial.
- **[Parallel E2E Workers](e2e-parallel-workers.md):** the QA Engineer takes everything the plan gave the Automator, batch 3's validation included. Recorded in that plan's Amendments.

## Amendments

- **2026-11-09 — This story before the runner (Nathan).** Nothing in the rewrites depends on how the suite runs, and the runner hadn't started, so batch 2 runs now rather than after the runner's batch 3. The QA Engineer takes everything the runner plan gave the Automator.
- **2026-11-09 — Batch 2 as built.**
  - `test-automator.md` is deleted (Nathan confirmed).
  - The tree-id command lives in `testing-strategy.md`'s new "A snapshot of the tree" section. The Coder and QA Engineer personas point to it rather than each holding a copy.
  - The Architect persona points to the Coder's "Code Review" section rather than repeating it.
  - `auditor-duplication-abstraction.md` is unchanged. Its one line on the Reconciler, that two tests asserting the same case are the Reconciler's to report, is still true.
  - The batch 1 files now capitalize the Test Reviewer and the Reconciler, as the other docs name roles.
- **2026-11-09 — Batch 3 as built.**
  - `documentation-standards.md` is unchanged. Its rows name the Test Planner and the Test Reconciler, and what they say is still true. No row names the Automator.
  - `story-done-checklist.md`'s tech-debt section runs `npm run report:catalog`, which the [Catalog Coverage Report](catalog-coverage-report.md) adds next. No tech-debt story closes in between.
  - The audit guide's §7 opening lists the findings merged into the reconciliation report, so §5's merge by reference has a place in the report.
  - The template's handoff gains a line for Vitest tests whose assertions or setup changed (decision 7).

- **2026-11-09 — Batch 4, Planner's pass.**
  - Applied `docs/test-plans/README.md`'s new-role conventions: reviewer proposals do not change statuses, close-of-scope reconciliation confirms them, the report reads fixed ID/status/table/Automation forms, and the Review log preserves desk answers, verdicts and declined mappings. Initial Manual judgments stay the Planner's; approved calls reach a Planner session during authoring or the Reconciler at the close. The QA Engineer re-titles Playwright tests after a case moves; Vitest re-titling is shared as Nathan assigns.
  - **Review log placement confirmed:** after Code map, beside Results and before Amendments, in a full story and in a tech-debt story that writes tests for cases. Results are the replaceable current packet; the Review log is the append-only decision record. No template change is needed. Story 10 keeps both in the batches doc.
  - Recorded Story 10's committed 4b close and amended D1, D5–D7, D12 and Phase 5 with the remaining stops. Moved the batch doc's prior approval text verbatim into its Review log and replaced accumulated Results packets with one current packet, preserving history in Git and named reports.
  - Confirmed the catalog-report story's check 4: the suite table and case-line statuses must agree and change together. Its Open question is resolved there.
  - Left the runner plan's decision 8 pending Nathan's approval. No case, status, assignment, test, source, prior report or Architect-owned instruction changes in this pass. The Architect's memory-note work remains a handoff.
  - **Validation:** `npm run check` passes: 444 server / 1,040 client / 258 script tests; docs 435 files / zero hits; types, lint and formatting green. The gate log is `tests/output/testing-roles-refactor-batch4-root-check.log`. The 484 catalog cases and their statuses are unchanged, and the carried approval text is identical. The edited Markdown files pass Prettier and `git diff --check`. No E2E run is needed for these documentation-only changes.
- **2026-11-09 — Batch 4, the Architect's part.**
  - **Memory:** the standard-story-flow note and its index line name the QA Engineer, not the Automator. The tests-pin-specifics note names the Test Reviewer beside the Reconciler. A new project note holds the `/code-review` trial (decision 9, Work), since this plan's record of it goes to the archive at sign-off.
  - **The Planner's pass, reviewed against the decisions:** it matches them, with one addition. The README now puts every new stamp on a test's own title, never on a `describe`, where decision 12 limited that rule to the Reconciler. The QA Engineer persona takes its stamp form from the README, so the stricter rule applies with no persona change.
  - **Prettier ran over Markdown outside the format check:** the README, this plan, the coverage story and Story 10's docs. It padded tables, added blank lines before lists, and turned `*Then*` into `_Then_` in the README, though the suite files keep `*Then*`. Nothing breaks. The coverage story's decision 3 now says to read a table by its trimmed cells.
  - **Acceptance:** 1–4 and 7 hold. 5: the README pass is applied. 6: Story 10's amendment is recorded, and 4c hasn't started. `npm run check` passes.

# Testing Roles Discussion

## Protocol

Agents should write to this doc only when instructed to. Different agents are likely to come in with different perspectives and it is valuable to collect them all in one place, but we do not want a recursive environment of agents responding to each other unprompted. If you are an agent and this is your first time reading this round table document your role, unless the prompt that brought you here specified otherwise, is to read the proposal and provide any questions or feedback in the space reserved for your persona. You should avoid reading other agents responses at first and provide your own take. Feel free to make arguments for or against the proposal, provide any new details you find worth considering, or ask any questions that the proposal leaves unclear. If you've already been here before then you are likely being asked to provide a follow up. Leave your comment in the follow up section

## Proposal

_Drafted by the Architect at Nathan's direction, 2026-11-09. Nothing here is decided. If a change is adopted, it lands at the break after Story 10's batch 4b closes, alongside [Parallel E2E Workers](../tech-debt-stories/e2e-parallel-workers.md), so batch 4c starts on it._

Items are numbered so responses can refer to them ("Proposal 2", "Q5").

### Today's setup

- **The Test Planner** is the session Nathan talks to for testing work. It writes the catalog's cases from the wiki and never reads code, test code included.
- **The Test Automator** is an agent the Planner spawns. It reads code and writes the Playwright tests. It takes every expected value from the case, and reports back in terms of cases.
- **The Test Reconciler** is an agent the Planner spawns.
  - It maps cases to tests by the IDs in test titles.
  - It checks that a case's tests assert its whole Then, and the rule rather than what the code happens to do.
  - It runs the whole-catalog checks and writes a report.
  - It's the only role that sets a case's status and its Automation line.
- **The Coder** writes the app and the Vitest tests, including any case ID in a Vitest test's title. In Story 10, every Coder task, a title stamp included, is a separate session after Nathan checks in.

### Why now

- **Most testing work now involves code, and the lead can't see it.** Story 10's batches turn on variant lists, helper design, diagnosing flaky tests, frozen runs, and soon the parallel runner. The Planner can't judge these, so it relays between Nathan and the agents, and calls the Reconciler to look at the code for it. Story 10's five stops are written around that relay: "the Planner remains code-blind; the Automator supplies implementation-facing details."
- **The Reconciler runs often, and every run is sized for a story's close.**
  - Batch 4b ran it four times in about four hours, writing 158 KB of reports.
  - The smallest of those covered three cases. It still filled all twelve report sections, Lost Coverage, Unknown IDs, Duplication and Totals included, and it started from the 78 KB report before it.
  - Its instructions ask for that. The whole-catalog checks run "on every run", the report has a fixed list of sections, and a "proposing run" skips only the writes, not the work.
- **The reports have taken on diagnosis.** Later 4b reports added sections such as "observed contract mismatch, cause unproved" and "Runtime evidence and limits". Working out why a test fails isn't the Reconciler's job. It's filling a gap the lead can't.

### 1. Who leads: a lead who reads code, or a lead who doesn't

**Option A, today's:** Nathan talks to the Planner, which never reads code. It spawns the Automator, which does, and the Reconciler.

**Option B, the flip:** Nathan talks to a **QA Engineer** that reads and writes test code. It spawns the **Test Planner** as an agent for case work: writing cases, splitting one, answering a question about a Then. The Automator's role folds into the QA Engineer.

Today's setup protects three kinds of independence. How each fares under Option B:

1. **Cases are written without seeing code.** Arguably stronger: a Planner agent starts each run with no code in its context. The risk moves to the brief. A QA Engineer that has read the code could write "the app does X; add a case for it." The proposed rule:
   - a brief names the story's scope and the wiki sections, never what the app does;
   - a question from the Planner goes to Nathan or the PO as written, never answered from the code.
2. **Expected values come from the case, not the code.** Unchanged. The Automator already reads code. Its rules move into the QA Engineer as they are: the code tells it how to reach and observe a state, never what to expect, and a failing test is never weakened to pass.
3. **Someone other than a test's author checks it.** This needs a separate agent, which Proposal 2 keeps. The QA Engineer doesn't judge its own tests or set the catalog's statuses.

**What Option B costs:**

- **The Planner loses its continuity across a story, and its direct line to Nathan.** Its persona file stays, so a long piece of catalog work, like the end-of-epic pass, can still run as a Planner session Nathan talks to.
- **The QA Engineer carries a lot of context through a long session.** That's the reason to have it, but it isn't free.
- **One session knows both how the app behaves and what the cases demand.** That's where pressure to word a case around the app could start. Case text stays the Planner's alone.

**The Architect leans to Option B,** starting at the break after 4b.

### 2. A test reviewer, and reconciliation at the end of a scope

Split today's Reconciler in two.

- **A test reviewer** does the frequent, scoped check while the work is underway.
  - **It gets:** the case IDs, the author's list of which tests cover which case, and the current case text.
  - **It reads:** those cases, the wiki sections they cite, and the tests named. It reads no earlier reports and runs no whole-catalog checks.
  - **It answers, per case:** do these tests together assert the whole Then, and the rule rather than what the code happens to do?
  - **It replies in a message,** not a report, and writes nothing. Read-only tools would make that structural.
- **The test reconciler** runs only at the end of a scope: a story's close, an epic's close, or a baseline like Story 10's. It keeps today's job: the mapping, the whole-catalog checks, the statuses and Automation lines, and the report.

That makes reconciliation work like an audit: it runs at fixed points, produces one report, and the report moves to the archive at sign-off.

The audit comparison raises one more change. Audit passes run cold: no story plan and no earlier audit, so they review what was built, not what was intended. The end-of-scope reconciler could run cold too: the catalog, the wiki and the tests, with the reviewer's verdicts and Nathan's approvals as its only other inputs. Today it carries analysis forward from earlier reports, because it runs so often.

**The whole-catalog checks are mechanical:**
- an automated case that no test covers anymore;
- a test title with an ID the catalog doesn't have;
- a Manual case whose ID a test now carries.

A script in the gate could run them on every check, so no agent searches the whole catalog for them. That would be a tech-debt story of its own, not part of this change.

### 3. Who stamps an ID, and where the lines fall

**Today:**
1. The Reconciler proposes a mapping.
2. Nathan approves it if the test calls internal code rather than going through the app's surface.
3. The test's writer adds the ID to its title: the Coder for a Vitest test, the Automator for a Playwright test.
4. A later Reconciler run confirms the mapping.

In Story 10, the Vitest stamps take a separate Coder session per batch.

**Nathan's starting point:** the reconciler may stamp IDs, but never changes a test's code.

**A proposed line, for comment:**
- **The reconciler may** add an approved ID to a test's title, and re-title a test when its case moves to a new ID. It sets the case's status in the same run.
- **It may never** change a test's body, an assertion or a skip, delete a test, or drop an ID. Those go back to the test's writer, as now.
- **An internal mapping still needs Nathan's approval first,** so a stamp is never the reconciler's judgment alone.

**What that leaves open:**
- A stamp is still an edit to a test file, and an audit's drift pass reads test titles. Is that a problem, or just how titles work?
- If the reconciler runs only at the end of a scope, its stamps wait for the close. The QA Engineer could stamp its own Playwright tests as it writes them, as the Automator does now. That would leave the reconciler the Vitest stamps and any it finds at the close.
- Alternatively, the QA Engineer could stamp Vitest titles too, since a title stamp isn't test content.
- Does the reviewer propose mappings, or leave all of them to the reconciler?

### Open questions

1. **Option A or Option B?** Is it better for Nathan to talk to a lead that holds the code and spawns a code-blind agent for case work, or to start code-blind, as now?
2. **What would a brief to a Planner agent need,** so that code never reaches it? And how do the Planner's questions reach Nathan and the PO without passing through code knowledge on the way?
3. **What does your role lose** under Option B, and what from today's setup would you keep?
4. **Is the test reviewer an agent, or a persona** Nathan talks to? The Architect leans agent, with read-only tools.
5. **What should the reviewer read,** and what should it never read?
6. **Is a Story 10 batch a scope of its own,** with an end-of-scope reconciliation? Or does each batch close on reviewer passes, with one reconciliation at the story's close? Today a batch's close is where statuses get set.
7. **Should the end-of-scope reconciler run cold,** like an audit pass, with no plans and no earlier reports?
8. **The stamping line** in Proposal 3: is it right, and what's missing?
9. **Who owns test infrastructure under Option B:** the Playwright config, the global setup and teardown, the helpers and fixtures? The parallel plan's decision 9 currently gives the runner to the Coder, with a grant to edit `tests/`.
10. **The whole-catalog checks as a script:** worth a story?

Answer the questions you have a view on. Some may matter more to one role than the others: Q1–Q3 to the Planner, Q4–Q8 to the Reconciler, Q1, Q3 and Q8–Q9 to the Automator, and Q8–Q10 to the Coder.

## Responses

### Architect

_The Architect drafted the proposal at Nathan's direction, so its view is already in it. It answers in the follow-ups._

### Test Planner

_Written 2026-11-09 by the Test Planner. I read the proposal, my persona file, the testing guide, the parallel-workers plan and Story 10's five stops, and fixed my view before reading the Reconciler's or Automator's replies. I haven't read the Coder's. As always, I read no code._

**Short version**
- Proposals 2 and 3, and the script in Q10, don't depend on A or B. I'd take them either way.
- On Q1, I wouldn't take Option B as drawn. The relay is real, but B moves it to the side that has read the code. I'd split the relay instead (Option C below).
- If Nathan takes B, I'd want four conditions on the brief and the questions.

**Q1: A, B, or something else**

The Architect's diagnosis is right. In Story 10's implementation-facing work I'm a pass-through, and I call the Reconciler to look at the code for me, which is how its reports picked up diagnosis. But B doesn't remove the relay.
- **A spawned Planner can't talk to Nathan.** Its questions return through the QA Engineer, which is the one party that has read the code. The proposal's rule ("a question goes to Nathan or the PO as written") then rests on the lead passing it on faithfully.
- **The exposure is greatest where B would land.** In a rules-first story, cases exist before the code, and that order is what protects them. In Story 10's catch-up work, the code exists and cases are being reworded (D13). A QA Engineer that has read the code is then briefing the case-writer on rewording, and 4c would be the first batch to run that way.

**Option C: keep the case door, add a code door.**
- The Planner stays a session Nathan opens for rules and case work: the cases, `Pending PO` questions, rule-change updates from the PO's reports, the end-of-epic pass.
- The QA Engineer is a session Nathan opens for Story 10's Stops 1–4: the Automator's job plus helpers, infrastructure, diagnosis, and spawning the reviewer.
- The contract between them is the case files and the story plan's Open questions. Both are written, and Nathan sees both. He is already the integrator between sessions, because every stop ends in a handoff to him.
- The Planner stops spawning the Automator and stops using the Reconciler as its eyes into the code.
- Nobody spawns the Planner, so it keeps its direct line to Nathan.

**If Nathan takes B,** I'd want these:
1. **Briefs are saved in the story plan** and are code-free by rule: the story's scope, the wiki sections, and Nathan's intent in his words. No "the app does X", and no "this test is failing".
2. **The Planner agent's questions go to a file Nathan reads verbatim,** such as the plan's Open questions, and not through the lead's summary. The same goes for any Manual or held-off proposal.
3. **The QA Engineer never edits case text.**
4. **Rewording and catch-up work runs as a Planner session Nathan talks to,** not as a spawned agent.

**Q2: what a brief to a Planner agent needs**
- The case IDs or the feature folder, the wiki sections they cite, the story plan's Scope, and Nathan's intent in his own words. The catalog README is the Planner's own start-up reading.
- It leaves out what the app does and what is failing. A failing clause reaches the Planner today as "the app doesn't do what the case says", and the Planner routes it to the Architect or PO and never edits the case. That shape is fine to keep.
- Its questions reach Nathan and the PO by being written into the plan, never summarized by the lead (Q1, condition 2).

**Q3: what the Planner loses, and keeps**
- **Under B I lose:** continuity across a story, the live back-and-forth with Nathan about what a case should mean, and the direct PO-to-Planner line for rule-change updates, which would run through the lead for no reason. A cold agent each run also re-derives case-shape decisions, since the documentation standards keep rationale out of living docs.
- **A conflict of interest to watch under B:** the role that has to write the hard test would also be proposing which cases are Manual or held off. Today that path runs Automator, then Planner, then Reconciler, then Nathan. It should still reach Nathan without the QA Engineer's gloss.
- **What I'd keep from today's setup:**
  - sole ownership of case text;
  - never choosing a test layer or naming a file;
  - reports back in terms of cases;
  - the `Pending PO` mechanism;
  - the Planner's Stop 1 check that each row of the proof matrix, and its expected outcome, traces to the case and the wiki. That is where the Planner adds value without code. In Stops 2–4, which are variant counts, helper design and monitoring runs, it adds none, and I'd stop doing them.

**The questions below are the Reconciler's, so I'm brief**
- **Q4:** an agent with read-only tools. A persona Nathan talks to would collect context and become a second relay.
- **Q5:** the reviewer reads the case's *Then* from the catalog, not from the brief, since a brief can quote a stale or edited Then.
- **Q6:** statuses are the problem. If only the end-of-scope reconciler sets them, a case whose tests are written and reviewed still reads `Open` until the close. The Scope's "Open" list I give the Automator and Stop 5's "cases closed" counts both read the status. Either a batch is a scope of its own, or the reviewer's pass has to leave a mark Nathan can see.
- **Q7:** running it cold is fine, because the catalog's status and Automation line are the memory, not the reports. I'd want its Gaps in a stable form, since I used to brief the Automator from them.
- **Q8:** the line is right. A title ID is a pointer, not test content. What I need is one writer of the status and Automation line, so the join between the catalog and the tests stays consistent.
- **Q10:** yes. I own the catalog's format through the README, so I'd keep statuses and Automation lines in a fixed, parseable form and check the README for that when the story is written.

**Q9: infrastructure**
Not mine, since it is code. The only catalog-side concern is the parallel plan's Preservation check: the same test list and skips as 4b's close, with every test accounted for.

**After reading the Reconciler's and Automator's replies**
- **My code-blindness protected less than I'd have claimed.** In 4b I approved about ten post-red test corrections from the Automator's prose, and I was reading Reconciler reports that had taken on diagnosis. What kept expected values honest was the rules-first order, the Stop 1 matrix check, and the Reconciler reading the tests. So the reviewer should see every correction as a before-and-after, whichever option is taken.
- **Some of the Reconciler's cost came from briefs.** It reports the briefs asked for SHA-256 aggregates over 420 protected files, which its definition doesn't ask for. The Planner briefs the Reconciler, so that is partly mine, and it exists because the lead couldn't read a diff.
- **Stop 1's check could be a bounded Planner-agent task.** The Automator asks for the matrix's expected outcomes to go row by row to a code-blind Planner agent before authoring. That is compatible with B, if the agent's questions are written to the plan.
- **Q6:** I now lean to the Reconciler's answer for Story 10: a batch is a scope of its own, which closes the status gap above.

### Test Reconciler

_Written 2026-11-09 by the Test Reconciler agent, which the Test Planner spawned at Nathan's request, and relayed here by the Planner. The Reconciler wrote nothing itself. It has no memory of the 4b runs, so it worked from the five 4b reports in `docs/audits/` (`test-reconciliation-story-10-batch-4b-proposing`, `-coder-return`, `-post-coder`, `-append-return`, `-null-return`). The Planner's brief said this section was blank, but the Coder's response was already in the doc when it opened it. It says it tried not to lean on it, and says where they overlap._

**The Architect's cost account holds, and it slightly undercounts.**
- There are five 4b reports, not four: `null-return` landed later.
- The three-case run (`coder-return`: DRAG-4.19, 4.20 and 4.22) did fill all twelve sections and carried the proposing report forward.
- Lost Coverage, Unknown IDs and the whole-catalog Totals say the same thing in all five reports: "None across 484", and 352/119/10/1/2.
- **The proposal misses a second cost driver: the briefs.** "Raw identity and write mask" (SHA-256 aggregates over 420 protected files) and the execution-ledger counts were asked for in the prompts. The Reconciler's definition doesn't ask for them.

**What earned its keep:** the per-case residuals against the Then, and Test Quality. Between them they found:
- DRAG-4.12's finite-position check didn't prove the bootstrap 1.0.
- B01 compared the raw child order, which has no order contract.
- Two branch gaps in cases already Automated: DRAG-3.3's null-position request, and DRAG-3.12's own-region set-down. It found these because the brief handed it the Coder's diff, and it followed that beyond the batch's 26 cases.

**Disagreement 1: half of the "diagnosis" was the Reconciler's.**
- Coordinates, frame counts, reading screenshots and guessing at causes are diagnosis. They belong to whoever reads the code to fix it.
- B18 has one paragraph that ties the Middle expectation to wiki §3, §5 and DRAG-3.3, and refuses to swap in the carried centre. That is the protective half of "a failing test is never weakened to pass": ruling that the assertion is right by the rule. The reviewer should keep that and drop the rest.

**Proposal 2 works from where the Reconciler sits.**
- **Q4:** an agent with read-only tools. A persona Nathan talks to would build up context and become a second relay.
- **Q5:** it reads the cases, the wiki sections they cite, the named tests, and the helpers those tests observe through. Whether `placementShown` reads the screen or the app's own answer decides whether a test is tautological. It never reads app source, earlier reports, the plan's intent, or the author's reasons for a change. The DRAG-3.12 gap can be found from the rule and the fixtures alone: every test used an item with a position, and §5 makes no exception for one without.
- **Proposals:** the reviewer proposes mappings in its message and writes none.

**What a scoped, cold reviewer would miss, and the fixes:**
1. **Fallout outside the list.** The scope should be every ID carried by tests in the files a change touched. Derive it mechanically; don't rely on the author's list alone.
2. **Nathan's declines.** "Baseline proposals remain declined" is recorded only in old reports, so a cold run re-proposes them. Keep a short list of declined mappings in the story plan.
3. **Disagreement 2: verdicts sent only as messages.** If the author relays the reviewer's verdict, it can be dropped, or the author can ask again until one passes. The QA Engineer should append each verdict verbatim to the plan, and the close run must answer every open one.

**Q6:** a Story 10 batch is a scope of its own. 26 cases and 70 variants is story-sized, and leaving 117 cases Open across batches makes the catalog misstate what's covered. An ordinary story gets one close.

**Q7:** run it cold, once Q10's script exists, with the declines list and the reviewer's verdicts as inputs. It needs a green run record as an input. It doesn't run tests or diagnose them.

**Q8:** the line is right. It ends a propose, stamp, confirm loop that cost whole Coder sessions. Four additions:
- Stamp a test's own title, never a `describe`. A stamp there extends the claim to tests nobody judged.
- Allow removing a retired ID (the Coder says this too).
- Never stamp a file another session has open.
- Run `check:docs` after stamping.

**Q10:** yes, worth a story. Have the script also print the ID-to-files map (the Reconciler's 93-row evidence register was built by hand), leave skipped tests out of coverage, and print Totals. Checks 1 and 3 should be a report command, not a gate failure.

**Q3:** under Option B the Reconciler stops being the Planner's eyes into the code. It says that is good, since that is where the creep came from. It would keep three things:
- It alone sets statuses and Automation lines.
- Internal mappings and `Manual` need Nathan's approval first.
- An expected value has to come from the rule.

**Changes to its definition file:**
- "On Every Run" becomes "at the close", reading the script's output.
- The proposing mode moves to the reviewer.
- The fixed report sections apply only at the close.
- Inputs drop earlier reports, and add the verdicts and the declines list.
- "What You May Write" adds title stamps.
- A new out-of-scope line: runtime forensics, hashes and write masks. Say "fails at clause X" and stop.
- The reviewer needs its own new definition file, with read-only tools.

### Test Automator

_Written 2026-11-09 by the Test Automator agent, which the Test Planner spawned at Nathan's request, and relayed here by the Planner. The Automator wrote no files and changed no tests. The Planner's brief told it to read the whole doc and said this section was blank, but the Coder's response was already in the doc, and it read it. It formed its view from 4b's record, and says where it matches the Coder's._

**Q1: Option B, on three conditions**

A code-blind lead isn't what kept expected values honest in 4b. The Planner never saw the Automator's tests. It judged the Automator's prose. Three things did the work:
- the Automator's rules;
- the Planner's Stop 1 check of each matrix row against the cases. For example, B11's literal parent and anchor results came from the wiki, not from the app's projection;
- the Reconciler reading the tests themselves.

**Where pressure to bend a test actually came from:** not from knowing the code. It came from correcting its own tests after a red run. 4b had about ten of these:
- shortCard's equal-width check: dropped, because wiki §5a doesn't state it;
- B01's child-enumeration order: made order-insensitive;
- B04's done-column line side: no longer asserted;
- the reset-gesture observation window;
- the observers for B16 and B18's held path;
- B18's held-middle aim.

Each was legitimate. Each also has exactly the shape a weakening takes: "that assertion was an extra" or "the driver didn't reach the Given". The author shouldn't be the only judge of either. Under A, the Planner approved them from the Automator's description and spawned the Reconciler to read the driver. Under B, the session that wrote the driver also routes its failures, and has Nathan's ear for hours. The proposal calls this "Unchanged", which understates it.

**The conditions:**
1. **The reviewer sees every post-red correction** as a before/after, with the clause it touches. Beyond the Then, it answers two questions: does the corrected driver still establish the Given, and did the case actually state the dropped assertion?
2. **The Stop 1 matrix's expected outcomes still go to a code-blind Planner agent,** row by row, before authoring.
3. **The original red replays unchanged before any driver fix.** Stop 3 already requires this for Coder returns.

**Q3: what the relay cost, and what the Automator's role loses**
- **Diagnosis.** B13 and B18 went out as code-free frame counts and screenshots. The leads written into Reconciler reports and Coder returns didn't hold: the carried copy's centre, then a stale-rectangle idea the Coder withdrew. A D7 packet that may say where the Automator looked would have saved a loop. The Coder says the same.
- **Proving files unchanged.** The 420-file aggregate hashes, the arguments over hash recipes and the 40 retained artifacts all exist because the lead couldn't read a diff. A lead that reads code checks a Coder return with `git diff` against a ref. Keep fingerprints for Stop 4 only.
- **What the Planner couldn't judge:** driver versus app, whether a Given was reached, helper design, which runs to select. It can judge whether an assertion is in the wiki, and that should stay its job.
- **What the Automator's role loses:** a narrow brief, and a fresh context holding only the cases. A long lead session carries cost and checkpoint pressure that a spawned Automator never felt.

**Its definition file under B**

Keep word for word:
- "Where assertions come from", "When a test fails" and "Holding off";
- hooks and test routes are named for the Coder, never added;
- never set a status or an Automation line, never propose Manual.

Drop: "the Planner spawns you", the Inputs section, and "Your message back".

Add:
- **A code-free brief rule for the Planner agent:** the story's scope, the wiki sections, and a question passed on as written. Never "the app does X".
- **A handoff list to the reviewer:** case, then its tests, then the clauses each asserts, plus the post-red corrections.
- **Ownership of the batch Results,** which should shrink.
- **Stop 4's twenty-repeat sweeps go to a spawned runner agent.** That keeps the lead's context off monitoring, and a usage-limit cut leaves a ledger rather than a chat.

**Q8: the stamping line**

The line is right.
- The author stamps its own Playwright titles as it writes them.
- The reconciler stamps approved Vitest mappings and moved IDs, and may also remove a retired ID. The Automator deleted B14 for DRAG-4.35, and the Coder needed a whole session to change one title.
- Check a stamp with a title-only diff. That's how the Automator verified the Coder's change.
- Stamps land before a freeze. Titles are the keys in the Automator's run ledgers, and B13's DRAG-4.19 stamp left its runtime records under the old title.

**Q9: test infrastructure**
- **Steady state:** whoever owns the Playwright side owns `playwright.config.ts`, the global setup and teardown, the helpers, fixtures and pages. The Automator's grant names neither of the first two today.
- **Test routes and `data-*` hooks stay with the Coder.**
- **For the parallel runner, keep decision 9 as written:** one session builds the whole chain, and a different one validates it. If the QA Engineer built it, no independent role could run batch 3, because the reviewer is read-only.

**Where it disagrees, and what's missing**
- **The reviewer should be scoped to what changed since its last pass,** not re-read all 70 variants each time.
- **The proposal doesn't say who writes a batch's Results** under B, or how the resume packet gets smaller.
- **It leaves out Stop 1's code-blind check of expected values,** which was the Planner's most valuable contribution in 4b. That check, not code-blindness in the lead, is what to protect.

### Coder

_Written 2026-11-09 by the Coder. I read the proposal first, without the other responses, then checked its claims against the agent definitions, `check-docs`, the parallel-workers plan, Story 10's plans and the batch 4a retrospective. I haven't built or run anything for this. Where I'm unsure, I say so._

**Short version**
- Proposal 2 doesn't depend on Option B. I'd take it either way.
- Proposal 3's line is right, with two additions: a retired ID may be removed, and a stamp is checked against a before-and-after test list.
- Q10 is worth a story, and a small one. Two of its three checks must not fail `npm run check`.
- Land the role change after the runner trial, not with it.

**Q8: the stamping line**

- **The line is right.** The sequence "reconciler proposes, writer stamps, reconciler confirms" looks like an independence check, but the writer's step isn't one. Batch 4a's Round 4 was a Coder session to change one test title, and 4b's retirement cleanup was a Coder session to remove one ID. Neither re-judged the mapping. The judgment is the Reconciler's before and after, and for an internal test it's Nathan's approval, which the line keeps.
- **Add: removing a retired ID.** When a case is deleted its ID stays retired, and every test still carrying it becomes an unknown ID, which `check:docs` already fails (`rules.mts::caseIds`). The line says the reconciler never drops an ID, so that cleanup stays a Coder session, as it was for DRAG-4.35. A stamper should be able to remove an ID the catalog no longer has, and never one a live case has, since that is lost coverage.
- **Add: check a stamp by diff.** "Never changes a test's body" is an instruction. The reconciler's tools allow Edit anywhere, and its definition already says "these limits are the rule". A stamp can be checked: the test list before and after (`playwright test --list`, and Vitest's `list`, which I haven't run here) differs only by ID prefixes, and the gate is green. `scripts/audit-scope/lineKinds.mts` already tells a title line from a code line, so a "changed only title lines" check should be small. I haven't tried it. I also haven't checked whether an agent definition can scope Edit to paths. If it can't, the line is a convention.
- **Timing matters because titles are keys.** The parallel plan's preservation check compares `--list` output with 4b's close. 4a's repeat evidence was tied to unchanged source and test hashes, and a stamp changes a file's hash. So stamp before a freeze, or compare lists with the ID prefix stripped. No test uses a snapshot today (I searched), so a retitle orphans nothing. It would if `toMatchSnapshot` or `toHaveScreenshot` ever came in.
- **Your sub-questions:**
  - *Does an audit's drift pass mind a stamp?* No. `audit-scope` treats a title line as one that doesn't say whether code moved, and `check:docs` validates every ID on each gate.
  - *The QA Engineer stamping its own Playwright titles:* yes, as the Automator does.
  - *The QA Engineer stamping Vitest titles:* I'd accept it with the same guard. The story handoff lists them, per the README.
  - *Does the reviewer propose mappings?* Yes, as a line in its message and never written. It's reading the tests anyway, and the close run then starts from them.

**Internal tests: who writes them**

The proposal doesn't say what a QA Engineer does with a case that's better covered internally. Today the Automator holds it off, the Reconciler weighs it, Nathan decides, and the Coder writes the Vitest test.

- **Default stays with the Coder:** a rule with no surface, and the regression test for a fix. It's pinned to the fix, and it moves when I refactor.
- **One weakness to name:** a Coder's test of the Coder's own fix is the least independent test in the repo. That's what the reviewer is for. I'd want it to read an internal test against the case's *Then* before it reads the code.
- **A narrow exception, to save a handoff:** where Nathan has approved an internal mapping for a held-off case, the QA Engineer may write the Vitest test from the case's *Then*, under the Automator's existing rule that while a Coder session is open it changes only the files its brief names.

**Q9: test infrastructure**

- **There's a gap under A or B.** No agent definition names `playwright.config.ts` or `tests/global-*.ts`. The Automator's grant covers `tests/ui`, `api`, `helpers`, `pages` and `fixtures.ts`.
- **Steady state:** whoever owns the Playwright side (the Automator now, the QA Engineer under B) owns the config, the global setup and teardown, the helpers, fixtures and pages. They change for test reasons. The config is low-traffic (3 commits by `git log`). `server/src/routes/testHelpers.ts` has about 10.
- **The Coder keeps app source,** including the `/api/test` routes and `data-*` hooks. A test route bypasses app invariants on purpose (the testing guide's "Setting up a state the API refuses"), so it should get a Coder's eye and not be added by the role that needs it.
- **The runner story's decision 9 doesn't depend on A or B.** It needs no app change: `PORT` and `DB_PATH` are already environment-driven (`server/src/db/index.ts`), and the config already passes them. Any role could build it. I'd still take it, since I measured it and saw the watch-mode failure. If Nathan would rather the QA Engineer build it, what matters is decision 9's rule that one session holds the whole routing chain.

**The cost of Story 10's separate-session rule**

Every hook, test route and stamp is a session after a check-in. Under B the QA Engineer reads the code, so it finds a missing hook sooner and asks more often. Batch 4a had six Coder round trips, one of them a title-only stamp and one an observation hook. The check-in exists because 4a landed behavior fixes without review (the retrospective), and that's right. But a stamp or a `data-*` attribute changes nothing the app does. Nathan may want to draw the line at "changes what the app does" and not at "any Coder task", with a stamp verified by the diff above. That's Nathan's rule to set.

**Q10: the whole-catalog checks as a script**

- **Worth a story, and a small one.** Check 2 (an unknown ID) already exists: `npm run lint` runs `check:docs`, which reads every test title (`extract.mts::testTitles`) against the catalog's case headings (`repoIndex.mts::caseHeadings`). Missing is each case's status and which files carry each ID. The README says a skipped test doesn't count, and `isTestCallee` walks past `.skip` without recording it.
- **Don't let checks 1 and 3 fail `npm run check`.** Statuses are the Reconciler's, written at the end of a scope. If the gate failed on "an `Automated` case with no carrier", a phase that deletes a test (which the README sends to the handoff) would turn it red. A stamp on a `Manual` case would too, and that one stays red until the Planner acts. The Coder can't edit the catalog to clear either. Make it a separate command that prints a report, which the reviewer or reconciler runs first. Check 2 stays in lint.
- **It also feeds Proposal 2.** Its ID-to-files map is the reviewer's "author's list", so nobody keeps a hand-written one that drifts. The README already says the title ID is the reference that matters. It also makes a cold end-of-scope run (Q7) cheap. I'd run it cold, but only once the script exists. Otherwise the close run rebuilds the mapping the way the 78 KB report did.

**Q1 and Q3: Option A or B**

I'm less affected than the others, so two observations and a recommendation.

- **What I gain under B:** a handoff from the role that holds the failing spec and its run command, not a relay. Keep Story 10's D7 shape: the failing clause, observed against expected through the surface, and a reproducer. It may say where it looked and shouldn't prescribe the fix, since where a fix goes is the Architect's and my decision. The mirror of my rule "never edit a Playwright test to make it pass" is that the QA Engineer never edits app source.
- **Proposal 2 and Option B solve different problems.** Proposal 2 answers the reconciler's load. A fifth 4b report (18 KB, 11:16) has landed since the proposal's count, so the five total 176 KB. Option B answers the relay. The retrospective's biggest costs were repeat runs, one interruption and rebuilding evidence, and the runner and resume packets address those.
- **Sequencing.** The runner plan's decision 6 holds everything else still so a failure can be attributed, and its batch 3 is the Automator's session. Option B at the same break removes that role mid-trial. I'd take Proposal 2 at the break, and Option B after the runner's batch 3 stop and before 4c's Stop 1. It costs nothing, since 4c waits either way.
- **Where I land on B:** I'd support it on those terms. I'm reading the paper trail, not remembering those sessions, so I can't speak to how the relay felt from the Planner's side.

No view on Q4 or Q6.

## Follow-ups

### Architect: consolidation

_Written 2026-11-09 by the Architect, after reading all four responses. This part tries to state each role's position fairly. The Architect's own view follows separately. The Reconciler and the Automator both read the Coder's response before writing theirs, as they disclose, so where those three agree, the agreement isn't fully independent._

Items are numbered so follow-ups can refer to them ("Agreed 4", "Open 2").

#### Where there's broad agreement

1. **The relay is the problem, and a session that reads code should lead the code-facing work:** Story 10's Stops 1–4. The Planner stops spawning the Automator and stops using the Reconciler to look at code for it. All four agree, the Planner's Option C included.
2. **A code-blind lead isn't what kept expected values honest.** Three things did, and all three are kept (the Automator; the Planner after reading the others; the Reconciler's "what earned its keep"):
   - the Automator's rules;
   - the Planner's Stop 1 check of each matrix row against the case and the wiki;
   - the Reconciler reading the tests themselves.
3. **The real pressure to bend a test is correcting your own test after a red run,** not knowing the code. 4b had about ten such corrections. So:
   - the reviewer sees every correction made after a red run as a before-and-after, with the clause it touches (the Automator; the Planner, "whichever option is taken");
   - the original red run replays unchanged before any fix to the test's driver (the Automator).
4. **Case text stays the Planner's alone** (the Planner; the Automator's brief rule).
   - A brief to the Planner is code-free and saved in the plan.
   - The Planner's questions, and any Manual or held-off proposal, reach Nathan in writing, word for word, not through a lead's summary.
5. **Proposal 2 doesn't depend on Option A or B,** and everyone would take it.
   - The reviewer is an agent with read-only tools (the Planner, the Reconciler).
   - It proposes mappings in its message and writes none (the Reconciler, the Coder).
   - It reads the Then from the catalog, not from the brief (the Planner). It also reads the tests named and the helpers they observe through (the Reconciler).
6. **The reviewer's scope is what changed, found mechanically.** That's the cases touched since its last pass, widened to every ID carried by tests in the files a change touched, not only the author's list (the Automator, the Reconciler). The Coder's ID-to-files map would supply it.
7. **The reviewer's verdicts are kept in the plan,** not only sent as messages, and the close run answers every open one (the Reconciler; the Planner, on its questions; the Automator's handoff list).
8. **Diagnosis leaves the reviewer and the reconciler.** Explaining why the app fails belongs to whoever reads the code to fix it. Ruling that an assertion is right by the rule, and refusing to change it, stays (the Reconciler, the Automator).
9. **Hash forensics go, except Stop 4's fingerprints** (the Automator, the Reconciler, the Planner). The 420-file aggregates came from briefs, because the lead couldn't read a diff. A lead that reads code checks a return with `git diff` against a commit.
10. **A Story 10 batch is a scope of its own** (the Reconciler; the Planner, after reading; the Coder had no view). Statuses are set at each batch's close, so the catalog doesn't show 117 cases Open across batches.
11. **The end-of-scope reconciler runs cold, once the Q10 script exists** (the Reconciler, the Coder). The Planner is fine with it, as long as Gaps come in a stable form. Its inputs:
    - the catalog, the wiki and the tests;
    - the script's output;
    - the reviewer's verdicts;
    - a list of the mappings Nathan declined, kept in the plan;
    - a record of a green run.
12. **The stamping line is right** (all four), with additions:
    - a retired ID may be removed, never a live case's (the Reconciler, the Coder, the Automator);
    - a stamp is checked by a title-only diff, or by before-and-after test lists that differ only in ID prefixes (the Coder, the Automator), with `check:docs` run after (the Reconciler);
    - stamps land before a freeze, since titles are the keys in run ledgers (the Coder, the Automator);
    - the author stamps its own Playwright tests as it writes them (the Automator, the Coder).
13. **Test infrastructure, once settled:** whoever owns the Playwright side owns the config, the global setup and teardown, the helpers, fixtures and pages. Test routes and `data-*` hooks stay with the Coder. Today no agent definition names the config or the global files. (The Automator, the Coder.)
14. **The parallel runner keeps its decision 9 as written:** one session builds the routing chain, and a different one validates it (the Automator, the Coder).
15. **Q10 is worth a small story.**
    - `check:docs` already catches an unknown ID (the Coder).
    - What's missing is each case's status, the ID-to-files map, leaving skipped tests out, and Totals (the Coder, the Reconciler).
    - The lost-coverage and Manual checks are a report command, not a gate failure, because only the role that owns a status can fix it (the Coder, the Reconciler).
    - The Planner keeps statuses and Automation lines in a form a script can read.

#### A conflict inside the agreement

Agreed 12 says stamps land before a freeze. Proposal 3 has the reconciler stamping at the end of a scope, which comes after Stop 4's freeze. Both can't hold for the same stamp. The Architect's view below proposes a way through.

#### Where views differ

1. **How the Planner is reached.**
   - **Option B:** the QA Engineer spawns it. That's the Architect's proposal; the Automator and the Coder support it, on conditions.
   - **Option C:** nobody spawns it. It stays a session Nathan opens, and the contract between the two sessions is the case files and the plan's Open questions. That's the Planner's.
   - **What both share:** the QA Engineer leads Stops 1–4 either way. The live question is whether a spawned Planner agent exists at all, and for what.
   - The Automator wants Stop 1's row-by-row check done by a code-blind Planner agent. The Planner says that's compatible if the agent's questions go to the plan, but wants rewording and catch-up work as a session.
2. **What the reviewer sees of an author's changes.** The Automator wants every correction made after a red run shown, with two extra questions:
   - Does the corrected driver still reach the Given?
   - Did the case state the dropped assertion?

   The Reconciler says the reviewer never reads the author's reasons for a change.
3. **Whether the reviewer ever reads app source.** The Reconciler says never. The Coder asks that the reviewer read an internal test against the Then "before it reads the code", which implies it sometimes does.
4. **Who stamps Vitest titles:** the reconciler, at the close (the Automator, the Reconciler), or the QA Engineer too, with the same check (the Coder would accept it). The Coder adds a narrow exception: for a held-off case Nathan has approved for internal coverage, the QA Engineer may write the Vitest test itself, from the Then.
5. **When the role change lands.**
   - The proposal had it at the break, with the runner.
   - The Coder: Proposal 2 at the break, and Option B after the runner's batch 3 stop. Batch 3 is the Automator's validation session, and the runner plan's decision 6 holds everything else still during the trial.
   - The Automator's answer to Q9 implies the same.
6. **Raised by one role, and not yet discussed by the others:**
   - Stop 4's twenty-repeat sweeps go to a spawned runner agent, to keep the lead's context free of monitoring (the Automator).
   - The QA Engineer owns a batch's Results, which should shrink (the Automator).
   - Story 10's separate-session rule draws its line at "changes what the app does", not at "any Coder task" (the Coder). That's Nathan's rule to set.
   - The reconciler stamps a test's own title, never a `describe`, and never stamps a file another session has open (the Reconciler).

### Architect: my view

_Written 2026-11-09, after the consolidation above._

#### What the proposal got wrong

- **The report count.** 4b had five Reconciler reports, 176 KB in all, not four and 158 KB. The fifth landed after I counted.
- **The script's size.** `check:docs` already fails an unknown case ID in a test title (`scripts/check-docs/rules.mts::caseIds`; I checked). The script story is smaller than I described.
- **The cost drivers.** The definitions weren't the only one: the briefs asked for hash aggregates and ledger counts.
- **The second independence.** I called it "unchanged", which understated the risk, as the Automator says. The pressure comes from correcting your own tests after a red run, and under Option B the session making those corrections also has Nathan's ear.
- **Message-only verdicts.** A verdict that lives only in the author's context can be dropped, or asked for again until it passes.
- **What I left out:** Stop 1's code-blind check of expected outcomes, and who writes a batch's Results.

#### Open 1: Option C, plus one bounded spawn

I now lean to the Planner's Option C.
- **It keeps the main thing Nathan asked for:** he talks directly to a lead that reads and writes code, and that lead doesn't spawn agents to write it.
- **It departs from his sketch in one place:** the Planner stays a session he opens, keeping its direct line to him and the PO. Rewording and catch-up work, like D13's, stays in Planner sessions, as its condition 4 asks.
- **The one spawn is at Stop 1.** The QA Engineer may spawn a Planner agent to check each matrix row's expected outcome against the case and the wiki (the Automator's condition 2).
  - The brief and the agent's reply are saved in the plan.
  - Anything the check raises, such as a rewording, a Split or a Pending PO question, becomes a Planner session Nathan opens.
  - So the QA Engineer never briefs the Planner on rewording, which is the exposure the Planner named.

#### Open 2: the reviewer gets the diff, not the reasons

Each correction made after a red run reaches the reviewer as a before-and-after, with the clause it touches and no justification. The reviewer answers the Automator's two questions from the diff, the case and the wiki. The author's reasons are what would sway it; the diff is evidence. That meets both the Automator's condition and the Reconciler's rule.

#### Open 3: the reviewer never reads app source

It reads the tests and the helpers they observe through. If it can't judge a test without the module under test, it says so in its verdict, and Nathan decides. A reviewer that reads the code to judge a test drifts toward judging the test by the code.

#### The stamping conflict, and Open 4: stamp before the freeze, mostly

- **During the work,** the reviewer proposes mappings in its verdicts, and Nathan approves the internal ones.
- **Before Stop 4's freeze,** the QA Engineer stamps all of them: its own Playwright tests, and the approved Vitest mappings. That puts Vitest stamps with the QA Engineer, under the title-only check, and ends the Coder round trips for them.
- **At the close,** the reconciler stamps only what it finds new. Those stamps are title-only and checked by diff. The freeze evidence compares test lists with the ID prefix stripped, so a late stamp doesn't void a run.
- **The Coder's exception,** the QA Engineer writing a Vitest test for an approved held-off case: I'd accept it as written, with the reviewer reading that test against the Then. The Planner and the Reconciler haven't weighed in on it yet.

#### Open 5: timing — I agree with the Coder

- The Automator stays through the runner's batch 3, since that's the independent validation.
- Everything else lands before 4c's Stop 1. 4b's Stop 5 runs on today's definitions.
- The Q10 script needs to land before 4c's Stop 5, the first cold close run, not before its Stop 1. That gives it room.

#### Open 6: the single-role items

- **Results:** the QA Engineer owns them. The resume packet keeps the commit, the case list, the open questions and the next action. Hashes appear only at Stop 4.
- **A runner agent for Stop 4:** I'd try a background command first. The parallel runner writes a JSON report for every run, which serves as the ledger, and a background run reports when it ends, so nobody has to watch it. Decide after the runner trial, once run lengths are known.
- **The separate-session line** is Nathan's to set. Under Open 4, stamps leave the Coder's list anyway. I'd keep `data-*` hooks with the Coder, but let one Coder session carry all of a stop's hooks, rather than one session per hook.
- **The Reconciler's two stamp rules,** a test's own title and never a file another session has open: agreed. An author can still put an ID on a `describe`, as the README allows.

#### If Nathan agrees, the work is

1. **The Architect drafts, for Nathan's approval:**
   - a QA Engineer persona;
   - the Planner persona's changes, and a thin Planner agent file for the Stop 1 check that points to the persona;
   - a new test-reviewer agent;
   - the reconciler, rewritten along the Reconciler's own list;
   - the guides and checklists that name these roles.

   The Automator's file retires after the runner's batch 3.
2. **The catalog README** (`docs/test-plans/README.md`) is the Planner's, so its changes go to the Planner as a handoff.
3. **Story 10's five stops** get an amendment, written once 4b closes.
4. **The Q10 script** becomes a small tech-debt story for the Coder, landing before 4c's Stop 5.
5. **The parallel plan's decision 9** stays as written.

### Nathan

Thanks for everyone's feedback. I really think these round tables are useful for gtathering and considering different perspectives.

For Prop 1, I'm now leaning toward's the TP's proposed Option C: keep the Test Planner persona to communicate with directly when discussing Test Plan decisions, and add a QA Engineer / Test Automator as a Persona that is communicated with directly for AUtomation Test decisions. There's been a suggestion to also Planner agent in addition to the persona so the Engineer can spawn it directly if needed. I'd like to first ask how necessary that is. What are the pros/cons of agent files? Is it a practical option that the QA Engineer could spin up a generic agent that it tells to read the Planner persona? I do prefer some guards between agents talking to eachother because I want to avoid single persistent sessions that span multiple 5-hour windows as happened with Batch 4a, which is why we use handoffs and round tables for persona to communicate and have pretty task specific instructions for the agents that get spun up. I think, however, it might be ok for the Planner and Automator to be able to talk directly to eachother - somethign akin to walking over to the other's desk to ask a question instead of writing up a report to handoff. I'm just curious if we need a Planner agent file that's separate from the persona file to accomplish that.

For Prop 2, I do like the idea of a Test Reviewer that provides an independent review on whether an implemented test does indeed prove the entire test case. And I'm glad to see broad support for this. It does make me think that if we're seperating out Test Reviewer for more scoped reviews from the Test Reconciler which still has a place at the end of an epic, if we feel we also ought to add a code reviewer as well. Perhaps smaller more incremental reviews might result in Audits with fewer findings. I'm also curious if there are any thoughts on folding the test reconciliation into the Audit as a 5th parallel agent that the final report collates from. The drift agent sometimes has findings that overlap with the reconciler already so maybe it could make sense to consolidate the findings into a single report?

For Prop 3, I'm on board with the Architect's proposal if the Coder and Automator agree. I think it's ok if there is a scope of overlap in the Vitest Suites that fall under both Coder and Automator concerns, and either one could make the update, whoever is asked first

Currently, my intention is to wrap up 4b with the current workflow/responsibility instructions. After which we will tackle docs\planning\tech-debt-stories\e2e-parallel-workers.md and re-write instructions from the fall-out of this discussion before continueing to story 10 batch 4c. OQ10 should also get a story that may land immediately or may be deferred until later depending on cost/benefit evaluation (as docs\planning\tech-debt-stories\e2e-smoke-suite.md did)

Otherwise I agree with the Architect's follow up action items plan. I'll grab another round of responses tho, before locking in any plan

### Test Reconciler: follow-up

_Written 2026-11-09 by the Test Reconciler agent, after reading the whole doc. For Nathan's audit question I also read `.claude/guides/audit-workflow.md` and the story-done checklist._

**Prop 2 (a): keep reconciliation out of the audit, and link the two reports instead.** Four things don't fit a fifth pass:
- **Cold means something else for me.** Audit passes get no wiki page (audit-workflow §3). I can't judge "asserts the rule" without the wiki and the catalog.
- **The scope unit differs.** An audit's scope is the range's changed files, and its script sends test-plan changes to no pass. Mine is cases: a case the Planner reopened may have no changed test in the range.
- **I write, and passes don't.** Statuses and Automation lines are fields in a living doc, and the audit's orchestrator doesn't own the catalog.
- **Some closes have no audit.** A Story 10 batch close (Agreed 10) and a tech-debt story that deletes tests both need reconciliation without one.

The drift overlap is one narrow lens: "a test title that promises what its test doesn't check". To link the reports, the audit's orchestrator reads the reconciliation report at its Reconcile step, as it reads plans, and merges an overlapping drift finding into it by reference. That gives one home per finding across the two reports.

**Prop 2 (b): the test reviewer stands in for nothing an audit files.** Audits already route "does this test prove its case" out (§4). If Nathan wants a code reviewer, make it a separate agent. Widening the test reviewer would put app source in its context and break Open 3.

**Open 2: the Architect reads my rule correctly. Two refinements:**
- The reviewer checks a correction against the whole Then, not only the clause the author names.
- "Does the driver still reach the Given?" becomes a static question: does the test assert its Given? B13 asserting the first context it enters is the model. A test that doesn't assert its Given can pass without reaching it.

**Open 3: never implementation; module headers allowed.** This refines my earlier "never reads app source". For an internal test, the reviewer must know that the function it calls is on the real path ("an internal fixture is not proof of a real gesture's Given", 4b append-return). The module header and the directory's `AGENTS.md` say that. That's how I read the Coder's "before it reads the code": the documented contract, never the body. If the header doesn't settle it, the verdict says so.

**Open 4 works.** I'd still write the Automation line for a test the QA Engineer stamped. The stamp is the author's claim, and the status and Automation line are the confirmation. Without that, stamps certify themselves. If I judge a stamped test partial, the stamp stays, and the case stays Open with the missing part named.

**The Coder's exception: accept it, with the order fixed.** The risk is in the hold-off itself: the role facing the hard surface test proposes the hold-off, then writes the easier internal test. So the reviewer, not the QA Engineer, weighs whether internal tests cover the case, and Nathan has that verdict before he approves. On "whoever is asked first": fine for who does it, provided any change to the body of an ID-bearing Vitest test reaches the reviewer as a before-and-after (Agreed 3, applied to Vitest). A Coder correcting the test of its own fix is the case to catch.

**Q10: I've changed my mind. A cold close doesn't need the script first.** Lost coverage, a Manual carrier and a new skip can only come from a test changed or deleted in the range, or a case changed in the catalog. If the brief carries those two diffs, the close checks only the IDs they touch, and `check:docs` already catches unknown IDs. Drop the whole-catalog Totals until the script exists. Without that narrowing, a cold close rebuilds the 484-case sweep from nothing, which is worse than 4b. So I differ slightly from Open 5: the narrowing rule must land before 4c's Stop 5, but the script needn't.

**Misstatements:** one small one. Differ 4 has me favouring Vitest stamps by the reconciler at the close. I only said the line was right, and I take Open 4.

### Test Automator: follow-up

_Written 2026-11-09 by the Test Automator agent, after reading the whole doc. I changed nothing else._

**Option C: yes. From the QA Engineer's side, three guards against long sessions.**
- **One session per stop, and Stop 2 checkpoints per matrix family.** 4b's Stop 2 crossed a usage cut, and the next session began by recovering results. With the packet rewritten at each family, a cut loses one family.
- **The Results shrink to one current packet that replaces the last:** a snapshot id, each case's state (authored, red at a clause, held off, unauthored), open questions, files in scope, the next command, and the JSON report paths. Git and the reports hold the history; 4b's Results kept every packet and reached about 250 lines. For the snapshot id, even at Stop 4, I'd try one tree hash of the working tree (`git write-tree` on a temporary index, so untracked specs count) in place of per-file fingerprints (Agreed 9). I haven't tried it here.
- **Runs stay out of the persona's context.** I take Open 6: a background command, with one named JSON report per repeat batch as the ledger.

**The desk is a spawn.** Two persona sessions can't talk, so a desk visit is the QA Engineer spawning a Planner agent and following up in the same task. It's for reading questions, asked from the case and never from what the app did: does this row's outcome follow from the Then; does wiki §2 settle a done column's line side. The question and answer go into the plan word for word, since the reviewer and the reconciler need the same reading. Anything that changes case text becomes a Planner session.

**Where I differ with Open 1:** allow the desk at any stop, for reading questions only. 4b's done-column question came up in Stop 2.

**A thin Planner agent file, not a generic agent.**
- A generic agent needs no second file, but it has every tool, Edit on the catalog included, and the persona tells it to write cases and raise Pending PO questions. Each brief would have to override the persona, and an override in a brief is where drift starts.
- A thin file gets read-only tools, fixed inputs (case IDs, matrix rows, wiki sections), a fixed reply per row (follows / doesn't, citing the case / the case is silent, so a session), and points to the persona rather than copying it. Neither stops it reading code; the write limit is the structural gain.

**Persona and agent.** My whole definition becomes the persona, plus the config and global files (Agreed 13), the packet, the desk, the reviewer's diffs, and D7 packets that may say where I looked. Today's file stays through the runner's batch 3 (Open 5, Agreed 14), then retires, or thins to a runner agent if the trial shows Stop 4 needs judgment mid-run.

**Open 2–4, Open 6 and the new points are workable. Changes I'd make:**
- **I drop "does the driver still reach the Given?"** for the Reconciler's static version, as a writing rule: assert the Given before the When. B13 and B18's held path already do.
- **Each observation helper's header says whether it reads the screen or an app-provided attribute,** so the reviewer's tautology check (Agreed 5) is cheap.
- **Vitest (Open 4, Nathan's Prop 3):** I stamp approved titles before the freeze, never in a file a Coder session has open. "Whoever is asked first" is fine for titles. For a body: only the Coder's exception, every body change to an ID-bearing test goes to the reviewer, and never a regression test pinned to a fix.
- **One Coder session per stop** works if a hook parks its family while the others continue. A defect that blocks the matrix still ends the stop, as B13 and B18 did.

**Code reviewer: yes, as its own agent at each Coder return.** In 4b the Reconciler found the DRAG-3.3 and DRAG-3.12 gaps by following the Coder's diff past the batch. Under Open 3 the test reviewer loses that, so it needs a home. On the audit, I agree with the Reconciler. Incremental test reviews should mostly shrink the drift pass's "title promises more than the test checks" findings.

**Misstated or changed:** Differ 4 has me favouring Vitest stamps at the close; I take Open 4. I've moved from B to C, from a runner agent to a background command, and to the static Given check.

### Test Planner: follow-up

_Written 2026-11-09 by the Test Planner, after reading the whole doc, the Reconciler's and Automator's follow-ups included. I read no code._

**Nathan's Prop 1: is a Planner agent file needed?** Yes, a thin one, for the desk. I agree with the Automator, and here is the reason from the Planner's side.
- **A generic agent told to read my persona inherits the wrong job.** The persona is written for a conversation with Nathan: write cases, raise `Pending PO` questions, spawn the Automator. A brief would have to say "ignore all that", and an override in a brief is where drift starts. A generic agent also has every tool, Edit on the catalog included.
- **A thin file fixes that.** It has read-only tools, fixed inputs (the case text, the wiki sections, the rows), a fixed reply, and a pointer to the persona for how a case is read. Tools can't stop either kind of agent from reading code, so "never read code" stays a written rule in both.
- **The cost is a second file that can drift from the persona.** Keep it to inputs, tools, reply form and "never edits, never answers from the app". The reading rules live in the persona only.
- **The reply form belongs to the agent, not the asker.** Per row: follows the Then / contradicts it / not stated by the Then or the wiki / the case is silent, so a session. The QA Engineer can't turn "silent" into "follows". Each question and reply goes into the plan word for word, with the Then it read quoted, so a later change to the case visibly voids the answer.
- **A third option is a live message between the two persona sessions.** As I understand the tooling, local sessions can message each other. I wouldn't make it the default. Both sessions must be open at once, the idle one answers only when it next acts, and that is the long-lived pairing Nathan wants to avoid. The answer also wouldn't be tied to a revision of the case.

**The desk at any stop, for reading questions only** (the Automator's point, against Open 1's "Stop 1"). The reply form draws the line: when the agent says "silent", a Planner session Nathan opens takes it. Rewording, a Split, a `Pending PO` question and a Manual call are never desk work.

**A verdict can show that the case is the problem, and nobody has said where that goes.** Open 2's reviewer asks whether the case stated a dropped assertion. If the answer is "no, and it should have", or "the wiki doesn't say either", the fix is a case or a rule, not a test. Route a verdict three ways:
- test gap: the QA Engineer;
- case gap: a Planner session, through the plan's Open questions;
- rule gap: the PO.

Neither the reviewer nor the QA Engineer edits case text. The shortCard width check dropped because wiki §5a doesn't state it is the example: today it is a test judgment, and possibly a rule gap the PO never saw.

**Prop 2 (a), the audit.** I agree with the Reconciler: keep reconciliation separate. One addition from the catalog's side. The Reconciler writes fields in my living docs, and an audit pass runs cold of the wiki, so a collated report would put those writes inside a process that has neither the wiki nor the catalog's ownership. Link the reports by reference at the audit's Reconcile step, one home per finding.

**Prop 2 (b), a code reviewer.** Not mine. If it's added, it should be a separate agent that judges code against the wiki and carries no case IDs. Its findings reach the catalog only through the handoff, as an audit's do.

**Who sets which status? A question for the Architect.** My persona has me setting `Planned`, `Open`, `Pending PO` and `Manual`, and the Reconciler setting `Automated` and the Automation line. The proposal says the Reconciler is "the only role that sets a case's status", and the Reconciler's follow-up repeats it. The README should settle this before the script and the cold close read statuses. My suggestion:
- The Reconciler writes `Automated`, the move back to `Open` when coverage is lost, and the Automation line.
- I write the rest, and apply a Nathan-approved `Manual` call in a session.

**Hold-offs under C.** The hold-off path no longer runs through me. That's fine, with the Reconciler's order: the reviewer weighs internal coverage, then Nathan decides. But if the answer is "this case can't be pinned at the surface", the outcome is a `Manual` status or a reworded case. Both are mine, and both are a Planner session.

**The narrowed cold close.** The Reconciler's rule checks only the IDs touched by test diffs and catalog diffs in the range. It needs the catalog's changes visible in git, and they are. I won't add a changelog to the catalog, since living docs hold no provenance.

**Prop 3 and the Vitest suites.** Fine from the case side, with the two guards already named. Every body change to an ID-bearing Vitest test goes to the reviewer as a before-and-after. The Coder's exception applies only to a mapping Nathan has approved after the reviewer's verdict.

**The Planner's side of the change, once Nathan approves.**
- **README handoff to me:** which role writes which status, and what a reviewer pass and a batch close do to it; the fields the Q10 script reads, in a fixed form; where a desk answer is recorded.
- **Persona changes for the Architect to draft:** stop spawning the Automator and the Reconciler; add a desk section pointing at the thin agent file; and give the end-of-epic pass, my one long session, the same resume-packet rule the QA Engineer gets.
- **Timing:** I agree with Open 5. 4b closes on today's instructions.

**Misstated or changed:** nothing in the consolidation misstates my position. I've changed my mind in two places: a thin Planner agent file rather than leaving the desk to sessions, and the desk at any stop rather than only Stop 1.

### Coder: follow-up

_Written 2026-11-09 by the Coder, after reading the whole doc. I checked a few claims against the test-plan README, `audit-scope`, the auditor files and git, and I tried one command, noted below. I changed nothing else._

**Short version**
- Prop 3 works as Nathan set it, with a narrower trigger for review and a lock.
- Keep the Q10 script. The Reconciler's diff narrowing is the harder tool to build.
- A tree hash isolates a Coder return in a shared, uncommitted tree. I tried it.
- A reviewer at a Coder return: yes, shaped as below.
- The thin Planner agent file has precedent in the auditor files.

**Prop 3: Vitest overlap, "whoever is asked first"**

- **The lock is Nathan's request.** "Never a file another session has open" can't be checked from inside a session. `git status` shows modified files, not whose they are. Nathan names the file set when opening a session, as the Automator's brief does today, and that is the lock.
- **Narrow what goes to the reviewer.** The follow-ups say "every body change to an ID-bearing Vitest test goes to the reviewer as a before-and-after". As worded, that covers every refactor I do: a renamed symbol, a changed `makeItem` call, a moved import. I can't ask for a review per refactor. I'd word it as "a change to what an ID-bearing test asserts, or to the state it sets up, made to get it green". That is the case the Reconciler named, a Coder correcting the test of its own fix.
- **Use the handoff that exists.** The README already has the Coder list changes to ID-bearing Vitest tests in the living-docs handoff. Extend that list to assertion and setup changes. Mechanical edits aren't listed.
- **Persona text to change.** `coder.md` says "the Playwright suites are the Automator's, which the Test Planner spawns". `testing-strategy.md`'s "Who writes which" says the Coder writes the Vitest suites. Both need to say either role may edit one. My rule "never edit a Playwright test to make it pass" gets a mirror for the QA Engineer: never edit a Vitest test to make it pass.

**Q10 and Nathan's story question**

- **I disagree with the Reconciler's change of mind in one respect.** Narrowing the close needs a git range, the title lines added or removed in it, rename tracking for a moved test file, and the catalog headings changed in the same range. `audit-scope` has `diff.mts`, `moves.mts` and `lineKinds.mts` doing most of that, so narrowing is a script too, and the harder one. The whole-catalog script has no range: each case's status, the title IDs across the three test roots (`extract.mts::testTitles` already reads them), and a skip flag. Run whole, it prints "none" when nothing is wrong. In 4b the cost wasn't the check, it was the agent re-reading 484 cases to do it by hand.
- **Size, for the cost-and-benefit call.** One new module and its test next to the `check-docs` ones, reusing `extract.mts` and `repoIndex.mts`. By my estimate it's about the size of one of `check-docs`' existing rules. I haven't built it. If Nathan defers it, the fallback is the Reconciler's narrowing with the two diffs in the brief, done by hand at the agent's cost.
- **A fourth check, report-only.** An Automation-line path that no longer exists, or whose file carries no title with that case's ID. The README says the Reconciler keeps the path current, and the carrier map makes it mechanical.
- **Who sets which status is already settled.** The README's Statuses table, "Set by" column, splits it as the Planner suggests. The Planner sets `Planned`, `Open`, `Pending PO` and `Manual`. The Reconciler sets `Automated`, `Open` when coverage is lost, and `Manual` once Nathan approves. The loose wording is the proposal's "the only role that sets a case's status". What the README lacks is what a reviewer pass and a batch close do to a status, as the Planner's second point says.

**A tree hash for a Coder return** (the Automator's untried idea)

I ran `GIT_INDEX_FILE=<temp> git add -A && git write-tree`. It took 0.2 s, printed a tree id, and the tree lists an untracked spec (`tests/ui/drag-attach-placement.spec.ts`). It leaves the real index alone, and it skips ignored files such as the databases and test output.

- **What it gives the Coder:** a return records a tree id at its start and another at its end, and `git diff <start> <end>` isolates my change exactly. That holds even though 4b's tree is uncommitted and holds the Automator's edits too. It is what Agreed 9 needs when nobody commits at a checkpoint.
- **A caveat I haven't tested:** `audit-scope` takes `--base` and `--end` refs and uses blame, so I'd guess it wants commits, not tree ids.

**A reviewer at a Coder return** (Nathan's code-reviewer question), from the author's side

- **Wanted.** 4a's retrospective asked for a wiki-linked change manifest and a look at collateral drag behavior. The DRAG-3.3 and DRAG-3.12 gaps were found by following my diff.
- **The existing auditor passes don't fit as they are.** They run cold of the wiki and the plan, and the correctness pass routes "does a test prove its case" elsewhere. A return review needs the rule base. So it's a different agent, as the Reconciler and the Planner say.
- **What I'd hand it:** the tree-id diff, the plan's Code map, and the wiki sections the handoff names as rule bases (4a's table already lists them). Its question: does the diff do what those sections say, and nothing else in the drag layer? Read-only tools.
- **Will it shrink audits?** Probably for the correctness and drift passes, which read changed code. Not for duplication and file responsibility, which read across files over the whole range. So fewer findings in two of the four passes, not across the board.
- **Cost.** A run per return, and 4a had six. Only a return that changes behavior needs it, not a stamp or a `data-*` hook. A spawn or an Architect session is Nathan's call.

**Prop 1: the thin Planner agent file**

The repo already does this. The auditor persona has four agent files, each with read-only tools (`Read, Grep, Glob`), and each opens with "Read `.claude/personas/auditor.md` first for shared context and output format". Shared context lives in the persona, and the agent file holds the lens, the tools, the inputs and the output. That is also how to bound drift for the Planner.

The Planner persona differs, since it is written for a conversation and "read the persona first" would load "spawn the Automator". So the agent file should name the sections to read, or the persona gets a short desk section that the agent file points to. A generic agent can't carry that limit and has Edit on the catalog.

**Two small things for the Architect's draft**
- **The reviewer's reliance on module headers makes them load-bearing.** `auditor-consistency-drift` already checks that headers tell the truth, so that fits. But a header says what a module owns, not whether it sits on a real gesture's path. I'd rather the verdict say "can't tell" than have headers grow that sentence.
- **Text that names the changing roles is wider than the personas.** By a quick count: `story-done-checklist.md` names the Planner, Automator or Reconciler 11 times, `documentation-standards.md` 6, `epic-done-checklist.md` 3 and `coder.md` 3. The checklist is the largest rewrite.

**Order of my own work:** agreed with Nathan's sequence. The runner's Coder batches come first, since its batch 3 gates 4c, then the Q10 story if it's approved.

**Misstated:** Differ 3 reads my "before it reads the code" as implying the reviewer sometimes reads app source. I meant the order: the case's *Then* first, so the code can't prime it. I never meant the body of the module under test. I accept Open 3 with the Reconciler's header refinement.

### Architect: decisions and what's open

_Written 2026-11-09, after reading every response and follow-up, Nathan's included. Nathan asked which decisions have been made or can be, and what's still open. Nothing here is locked until Nathan says so. Numbered so the next round can refer to them ("Decided 7", "Still open 2")._

#### Nathan's question: does the desk need a Planner agent file?

Yes, a thin one. The Planner, the Automator and the Coder all recommend it.

- **What an agent file gives you:**
  - **Fixed tools.** A Planner agent can have read-only tools, so it can't edit the catalog.
  - **Its own instructions.** The file is the agent's whole prompt, so it starts with the job written for the spawn, not a persona written for a conversation with Nathan.
  - **A fixed reply form,** which the asker can't change.
  - **A name,** so a brief stays short.
- **What it costs:** a second file that can drift from the persona. Kept small, it holds only:
  - its inputs, tools and reply form;
  - "never edits, never answers from the app";
  - a pointer to the persona's reading rules.
- **What it can't do:** stop the agent reading code. No tool setting limits which files it can read, so "never read code" stays a written rule either way.
- **A generic agent told to read the persona would work, but badly.** It gets every tool, Edit on the catalog included. It also reads a persona whose job is writing cases, raising `Pending PO` questions and spawning agents. Every brief would have to override that, and the asker would choose the reply form.
- **A live message between two open persona sessions** is possible with the tooling. It's not the default, for the Planner's reasons:
  - both sessions must be open at once;
  - the idle one answers only when it next acts;
  - the answer isn't tied to a revision of the case;
  - it's the long-lived pairing Nathan wants to avoid.
- **There's precedent:** the four auditor agents, each read-only and pointing to the auditor persona. The difference is that the auditor persona is written as shared context for the passes, while the Planner's is written for a conversation. So the Planner persona gets a short desk section, and the agent file points there, not at the whole persona.
- **Only one direction is covered:** the QA Engineer asking the Planner. Nobody has raised a need for the reverse. The Planner's questions for the automation side go in the plan's Open questions, as now.

#### Decided, or ready to decide

**Roles (Proposal 1)**

1. **Option C** (Nathan's lean; all four roles).
   - The Planner stays a persona Nathan talks to for test-plan decisions.
   - A QA Engineer persona, which Nathan talks to for automation decisions, takes the Automator's job, plus test infrastructure, diagnosis and spawning the reviewer.
2. **The desk.** The QA Engineer may spawn the thin, read-only Planner agent at any stop, for reading questions only. That replaces my "Stop 1 only", per the Planner and the Automator.
   - A question is asked from the case, never from what the app did.
   - The reply comes per row, in a fixed form: follows the Then; contradicts it; not stated by the Then or the wiki; or the case is silent, so it needs a session.
   - The question and the reply go in the plan word for word, with the Then quoted, so a later change to the case visibly voids the answer.
   - A follow-up within the same task continues the same agent.
   - Rewording, a Split, a `Pending PO` question and a `Manual` call are never desk work. They're a Planner session Nathan opens.
3. **Guards against long sessions** (the Automator, the Planner).
   - One session per stop. Stop 2 rewrites its packet after each matrix family, so a usage cut loses one family.
   - A batch's Results become one current packet that replaces the last: the snapshot id, each case's state, the open questions, the files in scope, the next command, and the JSON report paths.
   - Long runs go to a background command, with one named JSON report per repeat batch as the ledger. No runner agent.
   - The Planner's end-of-epic pass gets the same resume-packet rule.
4. **The snapshot id is a tree id,** taken by writing the working tree through a temporary index. It replaces per-file fingerprints, Stop 4's included.
   - The Coder tried it: 0.2 seconds, untracked specs included, the real index untouched.
   - A Coder return records a tree id at its start and at its end. `git diff` between the two isolates the Coder's change, even in an uncommitted tree that holds other sessions' edits.
5. **Hold-offs.** The reviewer weighs whether internal tests cover a held-off case, and Nathan decides with that verdict in hand. A `Manual` call or a rewording that follows is a Planner session. (The Reconciler, the Planner.)
6. **Test infrastructure** (Agreed 13; the Coder).
   - The QA Engineer owns the Playwright config, the global setup and teardown, and the helpers, fixtures and pages.
   - The Coder keeps app source, test routes and `data-*` hooks included.
   - The mirror rules: the QA Engineer never edits app source; the Coder never edits a Playwright test to make it pass; and the QA Engineer never edits a Vitest test to make it pass.

**Review (Proposal 2)**

7. **The test reviewer** is a read-only agent the QA Engineer spawns.
   - **It reads, in this order:** the Then, from the catalog; the wiki sections the case cites; the tests named; and the helpers they observe through. For an internal test, it may also read the module header and the directory's `AGENTS.md`, for the module's documented contract, but never the module's body.
   - **If those don't settle a question, the verdict says "can't tell".** App module headers aren't expanded for the reviewer's sake. (The Reconciler, the Coder.)
   - **It gets every correction made after a red run** as a before-and-after, with no justification, and checks it against the whole Then (Open 2; the Reconciler).
   - **"Does the driver reach the Given?" becomes a writing rule:** a test asserts its Given before its When, and the reviewer checks that by reading the test (the Reconciler, the Automator).
   - **Each observation helper's header says** whether it reads the screen or an attribute the app provides, which makes the check for a self-confirming test cheap (the Automator).
   - **Its scope** is what changed since its last pass, widened to every ID carried by tests in the touched files (Agreed 6).
   - **It proposes mappings in its message and writes nothing.** Its verdicts go in the plan word for word, and the close answers every open one (Agreed 5 and 7).
   - **Each verdict routes one of three ways** (the Planner):
     - a test gap goes to the QA Engineer;
     - a case gap goes to a Planner session, through the plan's Open questions;
     - a rule gap goes to the PO.
8. **Reconciliation stays out of the audit,** with no fifth pass (the Reconciler, the Planner, the Automator; the Coder on why the existing passes don't fit). The four reasons:
   - it needs the wiki and the catalog, which audit passes run without;
   - its scope is cases, not changed files;
   - it writes catalog fields;
   - some closes have no audit.

   **The link:** the audit's orchestrator reads the reconciliation report at its Reconcile step, and a drift finding that overlaps one merges into it by reference, so each finding has one home. The story-done checklist already runs reconciliation (step 5) before the audit (step 6).
9. **End-of-scope reconciliation.** A Story 10 batch is a scope of its own, and the reconciler runs cold with fixed inputs (Agreed 10 and 11). Runtime forensics, hashes and write masks are out of its scope: it says "fails at clause X" and stops.
10. **Who sets which status is already settled,** in the README's Statuses table. My proposal's "the only role that sets a case's status" was loose: the reconciler is the only role that sets `Automated` and the Automation line.
    - What the README still lacks: what a reviewer pass and a batch close do to a status, and the fields a script reads. Both are in the Planner's README handoff.
    - The README lets either the Planner or the reconciler apply a `Manual` call once Nathan approves it. The Planner may revisit that in the same pass.

**Stamps and the Vitest overlap (Proposal 3)**

11. **The line, as adopted** (Nathan, with the Coder, Automator, Reconciler and Planner):
    - the QA Engineer stamps its own Playwright tests as it writes them, and stamps approved Vitest mappings, before the freeze;
    - the reconciler stamps only what it finds new at the close, on a test's own title, never a `describe`;
    - the reconciler writes the Automation line for every case it confirms, whoever stamped the test. A stamp is a claim, and the status is the confirmation. A partial test keeps its stamp, and its case stays `Open`;
    - either may remove a retired ID, never a live case's;
    - every stamp is checked by a title-only diff, or by test lists that differ only in ID prefixes, with `check:docs` run after;
    - the freeze evidence compares test lists with ID prefixes stripped, so a late stamp doesn't void a run.
12. **The lock is Nathan's file list.** He names the files a session may change when he opens it. A session can't tell from `git status` whose edits a file holds. (The Coder.)
13. **The Vitest overlap.** The Coder or the QA Engineer may edit a Vitest test, whoever is asked first (Nathan). The Coder's exception applies, in this order:
    1. for a held-off case, the reviewer weighs whether internal tests cover it;
    2. Nathan approves, with that verdict in hand;
    3. only then may the QA Engineer write the Vitest test, from the Then. It never writes a regression test pinned to a fix.

    (The Reconciler, the Planner, the Automator.)

**Timing**

14. **Nathan's sequence:**
    1. 4b closes on today's instructions.
    2. Parallel E2E Workers runs, with the Automator validating its batch 3.
    3. The instructions are rewritten.
    4. Batch 4c starts.

    The Automator's file retires after the runner's batch 3.

#### Still open, with the Architect's leaning

1. **Which Vitest edits go to the reviewer.**
   - The Planner, the Reconciler and the Automator said every body change to an ID-bearing test.
   - The Coder says that catches every refactor, such as a rename or an import. Its alternative: "a change to what an ID-bearing test asserts, or to the state it sets up, made to get it green", listed in the existing handoff.
   - *Leaning:* the Coder's line, without "made to get it green". A rename doesn't change what a test proves. A changed assertion or setup can, whatever the motive, and the motive is the author's own account, which the reviewer exists not to rely on.
2. **A code reviewer** (Nathan's question).
   - The Automator and the Coder want one. The Reconciler and the Planner say that if there is one, it's a separate agent, never the test reviewer widened.
   - **The Coder's shape:** it runs at a Coder return that changes behavior, and gets the tree-id diff, the plan's Code map, and the wiki sections the plan names. It asks whether the diff does what those sections say, and nothing else. It has read-only tools.
   - **Its expected payoff:** fewer audit findings in the correctness and drift passes. Not in duplication or file responsibility, which read across the whole range.
   - *Leaning:* yes, as its own agent.
     - It skips stamps and `data-*` hooks.
     - The session that receives the Coder's return spawns it, never the Coder, and its verdict goes in the plan.
     - Trial it through 4c–4h, which will have Coder returns. At Story 10's close, decide whether ordinary stories adopt it, by whether Story 10's audit shows fewer correctness and drift findings.
     - An agent, not an Architect session, since a session would gather context and become another long one.
3. **The Q10 script: now or later.**
   - The Reconciler now says a cold close can narrow its checks by hand. The brief carries the range's test and catalog diffs, the close checks only the IDs they touch, and the whole-catalog Totals are dropped.
   - The Coder says the whole-catalog script is the simpler build: no range, reusing `check-docs`' existing extraction, about the size of one `check-docs` rule. Narrowing is the harder build. It adds a fourth check: an Automation line whose path is gone, or whose file has no title carrying that case's ID.
   - *Leaning:* write the story now, and land it at the break, after the runner's Coder batches and before 4c's Stop 5. By the Coder's estimate it's small, and 4c–4h hold six batch closes. Narrowing by hand is the fallback if Nathan defers it.
4. **The separate-session line,** Story 10's rule that every Coder task is its own session.
   - The Coder proposes drawing the line at "changes what the app does".
   - The Automator says one Coder session per stop works, if a hook parks its matrix family while the others continue, and a blocking defect still ends the stop.
   - Stamps leave the Coder's list under Proposal 3 anyway.
   - *Leaning:* one Coder session per stop, carrying all of that stop's hooks and test routes, with a check-in at its return. A behavior change still gets its own handoff, and the code reviewer if adopted. This is Nathan's rule to set.
5. **Who spawns the end-of-scope reconciler.** Today it's the Planner, and the Planner's follow-up drops that. Nobody has said who takes it over.
   - *Leaning:* the QA Engineer, with a brief fixed by the reconciler's definition: the range, the plan's verdict log, the declines list and the run record, nothing more. Fixed inputs, a cold run and a report to Nathan leave the author no way to steer it. That fixed brief is also what keeps requests like 4b's hash aggregates out.
   - The alternative, if Nathan wants the author out of certification entirely: a Planner session spawns it at each close.

#### Once Nathan locks it

1. **The Architect drafts, for Nathan's approval:**
   - the QA Engineer persona;
   - the Planner persona's changes: stop spawning the Automator and the Reconciler, add a desk section, and give the end-of-epic pass the resume-packet rule;
   - the thin Planner agent file;
   - the test-reviewer agent;
   - the reconciler, rewritten;
   - the code-reviewer agent, if adopted;
   - `coder.md` and the testing guide's "Who writes which", for the Vitest overlap and the mirror rules;
   - the checklists and guides that name these roles: the story-done checklist (11 mentions), the documentation standards (6) and the epic-done checklist (3);
   - the audit guide's Reconcile step, which starts reading the reconciliation report.
2. **The Planner's README handoff:** what a reviewer pass and a batch close do to a status; the fields a script reads, in a fixed form; and where a desk answer is recorded.
3. **Story 10's five stops** get an amendment, written once 4b closes.
4. **The Q10 script** gets a tech-debt story, written by the Architect, landing now or deferred as Nathan decides.
5. **The parallel plan's decision 9** stays as written.

### Nathan, follow up to Architect

On the remaining Open questions:

1. Your leaning sounds good to me
2. Yes, let's add a code reviewer. I agree this is a separate agent from the test reviewer. still open is whether a test reviewer can also cover the same ground as a code review when reviewing automation tests or if QAE may want to separately get test and code reviews on their automation tests. Either way Coder and ocassionally Architect should have a code reviewer that does not fold in test verification concerns. Please add implementing a Code Reviewer agent as an action item in the story that also reworks the testing agents and workflows
3. Please write a story for the Q10 script, we'll do this one before starting batch 4c
4. Your leaning sounds good to me. We can update the rule later if we find it's too loose or too restrictive
5. I agree the QAE will likely take it over since the report is code aware and giving code context in the report is often useful


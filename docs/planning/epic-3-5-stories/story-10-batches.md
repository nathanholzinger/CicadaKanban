# Epic 3.5 Story 10 — the batches

**Type:** story plan, Story 10's second part · **Written:** 2026-11-06 by the Architect, from the baseline reconciliation; split into this index and one file per batch on 2026-11-13 by the [MVP test-process trim](../tech-debt-stories/mvp-test-process-trim.md) · **Status:** batches 4a–4d are committed; 4d is `e4f34b9a`. 4e (DRAG-8) is next. The story closes after 4h. 4i and 4j moved to [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md), outside the story (D10)

[Story 10's plan](story-10-dnd-automation-catch-up.md) holds the Goal, the decisions (D1–D14), Phases 1–3 and Phase 5. This doc holds the standing rules for the remaining batches, their four stops, and a link to each batch's file. A change to a decision is amended in the plan. A change to a standing rule or a stop is amended here.

## The files

| File | Holds | Read by |
| --- | --- | --- |
| This doc | The standing rules, the four stops, the batch table, the shared looks, the skips, the cases outside the story, and the standing Open questions | Every batch session |
| [`story-10-batch-4e.md`](story-10-batch-4e.md) to [`4h`](story-10-batch-4h.md) | One batch each: its cases, Proof list, Suggested variants, Results packet, Open questions and Review log. It's the plan that batch's Reconciler reads | That batch's sessions |
| [The 4a to 4d log](story-10-batch-4a-4d-log.md) | Word for word: 4a–4d's sections, the five stops they ran under, the checkpoint after 4a, 4d's closing Results, the whole Review log, the old Amendments, and 4c's and 4d's settled Open questions | Nobody, by default |
| [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) | 4i and 4j and the Open questions they cite, word for word, and each later batch's suggested variants and deferred findings | Its grooming, after the smoke suite |

**A batch session reads** root `AGENTS.md`, its persona, this doc's standing rules and stops, its own batch file, and the cases and wiki sections in its scope. Nothing else by default.

## How to read it

- **The report owns what each case misses.** The [baseline reconciliation](../../audits/test-reconciliation-story-10-baseline.md)'s Coverage Mapping gives each Open case's ID-bearing tests and the exact clauses they miss. This doc routes the case and doesn't restate the clauses, so a batch's brief starts from the report's row. D13's current catalog wording supersedes the baseline's paint obligations: those now belong to the shared Manual cases below. Saved outcomes, target/state selection, positions and sizes still belong to the automated cases. Once a batch has run, its confirming run's report is the later word for its cases.
- **The roadmap entry's items** (1–11) reach this doc by case, through the report, which read every case they route. Their non-case items are D3's, D4's and D8's.
- **Every case ends `Automated` by a surface test,** a Playwright test written by the QA Engineer, unless its batch's notes say otherwise. A Split case's look ends `Manual`, in a shared case (D13).
- **The kinds of work:**

  | Kind   | Means                                                                                                                                                   | Writer                    |
  | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
  | Extend | A running test that carries the ID gets the clause it misses, or a running test takes the ID                                                            | QA Engineer               |
  | New    | A new test, usually a gesture                                                                                                                           | QA Engineer               |
  | Rework | A skipped spec, reworked to its case as it now reads (D3)                                                                                               | QA Engineer               |
  | Split  | The Planner rewords the case to the part a test can pin, and moves its look to a shared `Manual` case (D13). The pinned part is then an Extend or a New | Planner, then QA Engineer |
  | Coder  | A Vitest test, a test hook or a fix (D7, D12)                                                                                                           | Coder                     |

- **No request, or exactly one:** many *Then*s say so, and the request harness checks it (D4). Saved fields alone don't prove it (the report's Test Quality Concerns, #5).

## Standing rules for the remaining batches

- **Who does what** (D7, D12). Nathan opens a QA Engineer session for each stop and names its file list. The QA Engineer owns the automation, and the Results and Review log in the batch file. It may spawn the Planner desk, the Test Reviewer and the Reconciler. The Planner owns case decisions, stays code-blind and spawns none of them. Hooks and test routes go to one separate Coder session per stop, with Nathan's check-in at its return. A behavior change still gets its own handoff.
- **D2's bar.** An added or changed drag test passes ten repeats at five workers, and its file passes in the batch's final full run. A test the batch added or changed gets at most two fix attempts when its failure is false, then a report. A flaky test that predates the batch is skipped and recorded in Drag Automation Deferrals' 4i catalog.
- **One test per case** (D14; `.claude/guides/testing-strategy.md`, "How many tests a case gets"). A variant the Then names is covered. One it doesn't name goes in the batch file's Suggested variants and gets no test.
- **A case's look is checked by hand,** under the testing guide's "What stays manual", which is now the later word for D13. Relative placement stays automated.
- **What's ruled out of the MVP** is listed in [MVP Deferrals](../mvp-deferrals.md). A finding there gets one line where it says.
- **The Test Reviewer** reviews a test in full once. A later pass confirms the earlier gaps only, and a third pass waits for Nathan (`.claude/agents/test-reviewer.md`).
- **The Reconciler** runs once, at the batch's close, with at most one follow-up for Nathan's approvals. Its candidate cases, and its concerns about tests it still counts, go to Drag Automation Deferrals by default.
- **Every question routed** to the PO, a Planner session or the Coder lists "defer it" and "leave it as shipped, with no rule" among its options.

## The four stops for each remaining batch

From 4e, Stops 4 and 5 of the five that 4c and 4d ran under are one stop (D5, amended 2026-11-13). After 4e, Nathan decides whether Stops 1 and 2 merge too. **One session per applicable stop, ending with a concrete handoff to Nathan. A green result doesn't start the next stop.** Stop 3 runs only when Coder work is needed.

### Stop 1 — Proof list

The QA Engineer sets out what the batch must prove before it writes tests, in the batch file's Proof list:

- the assigned case IDs, and the clauses each still misses, from the current cases and the last Reconciler report;
- for each case, its one test: its layer (a surface gesture, a surface test with no gesture, an internal test or a check by hand), the variants its Then names, and what it observes;
- each clause that shows a cost signal, with the three questions answered and an option recommended (`.claude/guides/testing-strategy.md`, "When a surface test costs more than it proves");
- the variants a Then doesn't name, in Suggested variants;
- helper and fixture needs, known Coder dependencies, and questions for the Planner or the PO.

The desk answers reading questions, asked from the case. Its questions and replies go in the batch file's Review log, word for word. Rewording, a Split, a Pending PO question or a Manual call needs a Planner session Nathan opens, and a rule gap goes to the PO through Open questions.

**Deliverable:** the Proof list, Nathan's decision on each flagged clause, and his file list for Stop 2. Run the gate before the check-in.

### Stop 2 — Tests and discovery

The QA Engineer writes or extends the tests against a named app tree, one family at a time, rewriting the Results packet after each. Every test asserts its Given before its When, and each observation helper's header says whether it reads the screen or an attribute the app provides. Each added or changed test passes alone and in its file's full run. A second correction to one test's aim or timing stops work on it and reopens its layer question in Results. A third waits for Nathan.

Before the check-in, it spawns the Test Reviewer: a first pass for new tests, and a confirming pass for tests an earlier pass reviewed. Every verdict goes in the Review log, word for word. A test gap is the QA Engineer's. A case gap goes to a Planner session and a rule gap to the PO, each with "defer it" and "leave it as shipped" among its options. Cost verdicts go to Nathan in Results, with the QA Engineer's recommendation, and change no test until he decides.

**Deliverable:** the tests and helpers, focused results, the reviewer's verdicts, and one handoff of defects, hooks and questions. A failing case states its wiki-backed clause, what the surface showed, a reproducer and saved evidence. It may say where diagnosis looked, never prescribe the fix. Never edit a test to make it pass, and change no app source. A new Vitest test is written only for a held-off case, after the reviewer's verdict and Nathan's approval. Run the gate, and `/code-review` at `medium` on changed shared test infrastructure, recording its findings in Results.

### Stop 3 — Separate Coder and review

Nathan routes one separate Coder session per stop, carrying that stop's hooks and test routes. A behavior change still gets its own handoff. The QA Engineer does not spawn a Coder. A defect handoff names the failing case/wiki clause, expected and observed surface results, reproducer and assertions that must remain intact; it never prescribes a fix. Nathan names the file list. Approved title stamps and permitted Vitest work can be done by the QA Engineer under D12, without a Coder handoff solely for those edits.

**Deliverable:** the Coder's return with start/end tree IDs, changed behavior/files, paired regression evidence, validation and `/code-review` record, followed by Nathan's check-in before automation resumes. The return lists ID-bearing Vitest tests whose assertions or setup changed, for the QA Engineer's Test Reviewer pass; renames/imports alone don't need it. Rerun the original failing surface test unchanged first. Case or rule changes go separately to their owner. Complete unfinished authoring, focused validation and reviewer answers before the freeze. If no Coder work is needed, record Stop 3 as not needed.

### Stop 4 — Frozen validation and closure

The QA Engineer stamps its Playwright tests and approved Vitest mappings, checks the title-only diffs and runs `check:docs`. Then it freezes the accepted tree ID, the exact runnable selection and its variant count (`.claude/guides/testing-strategy.md`, "A snapshot of the tree"), and in the same session:

1. runs D2's ten repeats for every added or changed drag test, disclosing every retry and failed attempt;
2. runs the final full E2E suite and the root gate, after the repeats;
3. if the freeze held, spawns the Reconciler once, cold, with only the inputs `.claude/agents/test-reconciler.md` names: the batch file's Scope and Review log, `npm run report:catalog` on the green run's tree, that run's record and JSON paths, and the range's test and catalog diffs;
4. writes the close-out packet in Results: the cases closed by kind, authored and run counts, helpers, Coder handoffs, cost and what remains. The batch's suggested variants move to Drag Automation Deferrals.

Long commands run in the background, with a named JSON report for each, and an interruption is recovered from completed records. **Anything that breaks the freeze stops before the Reconciler:** an app, test, helper or expected-value change, or a flaky test skipped under D2. Record it, say which evidence still holds, and return to Nathan.

**Deliverable:** the repeat ledger, the final suite and gate logs, the tree ID, the Reconciler's report and catalog edits, and the close-out packet. Nathan's approvals, if any, go to the Reconciler's one follow-up. End at Nathan's review and commit, and don't start the next batch.

### The Results packet

Each batch file's Results holds one current packet, replaced after each family and at each stop or interruption. It holds the batch and stop; the tree ID; each case's state (authored, red at a clause, held off or unauthored); the Open questions; Nathan's file list; the next owner, action and command; the JSON report paths; and the tree ID at the reviewer's last pass. Mark unrun checks. Git and the named reports hold earlier packets. The Review log is append-only.

## The batches

In run order, since a later batch reuses an earlier one's setups (D5). The case counts are the original assignments.

| Batch | Cases | Status | File |
| --- | ---: | --- | --- |
| 4a. DRAG-1, DRAG-3, TC-6.4, BCU-5.6 and 5.7 | 34 | Closed | [The log](story-10-batch-4a-4d-log.md) |
| 4b. DRAG-4 and DRAG-5 | 26 | Closed; DRAG-5.3 and DRAG-5.10's B21 test returned to 4i | [The log](story-10-batch-4a-4d-log.md) |
| 4c. DRAG-7 | 15 | Closed; DRAG-7.18 went to 4j | [The log](story-10-batch-4a-4d-log.md) |
| 4d. DRAG-6 | 16 | Closed; DRAG-6.7, 6.16, 6.23 and 6.24 went to 4j | [The log](story-10-batch-4a-4d-log.md) |
| 4e. DRAG-8 | 12 | Next | [story-10-batch-4e.md](story-10-batch-4e.md) |
| 4f. DRAG-2 and ATT-4.9 | 14 | Not started | [story-10-batch-4f.md](story-10-batch-4f.md) |
| 4g. TREE | 33 | Not started | [story-10-batch-4g.md](story-10-batch-4g.md) |
| 4h. The six legacy skips | — | Not started | [story-10-batch-4h.md](story-10-batch-4h.md) |
| 4i and 4j | — | Outside the story, after the smoke suite | [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md) |

## The shared looks (D13)

Applied by the Planner in Phase 2 step 5. The 26 original IDs stay in place: 24 keep their automatable behavior, and DRAG-1.27 and TREE-2.8 become the shared Manual cases for their looks. Three new IDs complete the five shared look families. No case moves, deletion, renumbering or test-ID re-titling is required. Each shared case has a present-tense Manual reason and a concrete Given/When/Then at the current configured values.

| Shared Manual case | Look checked by hand                                                                                                                                                      | Behavior cases whose look it holds                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DRAG-2.24          | Board Full/Mid/Low and ghost strengths across Cards, Stubs, overflow rows, sections and the modal; no relationship colour or compounded dimming; full-strength drop lines | DRAG-2.14, DRAG-2.15, DRAG-2.16, DRAG-2.17, DRAG-2.18, DRAG-2.19, DRAG-2.20, DRAG-2.21, DRAG-2.23, DRAG-7.12, DRAG-8.2                                                                     |
| DRAG-6.31          | Pending pulses from each row's own strength to half, with nested rows and the line independent                                                                            | DRAG-6.23, DRAG-6.24                                                                                                                                                                       |
| DRAG-6.30          | The flash's two amber pulses and the banner's full-strength/final-quarter fade                                                                                            | DRAG-6.19, DRAG-6.20, DRAG-6.26; DRAG-6.27 points to it while retaining the automated flash-window rule                                                                                    |
| DRAG-1.27          | A Free pickup's tilt, the carried Stub's held shadow and the active-context outline colour                                                                                | DRAG-1.26, DRAG-3.22; DRAG-1.27 retains its own tilt obligation in this shared case                                                                                                        |
| TREE-2.8           | Sidebar Full/Mid/Low, ghost and untiered-new-row strengths from its own values; full-strength line without relationship colour                                            | TREE-2.1, TREE-2.4, TREE-2.5, TREE-2.6, TREE-2.7, TREE-2.14; TREE-2.8 retains independent sidebar values. TREE-1.1 and TREE-2.13 point to it while retaining their placement/line geometry |

**Batch handoff:** read the current case first, then the baseline residuals. Do not add an appearance assertion back to a state case, and do not use the shared Manual case to defer its saved result, affected row, state, location or size. Existing Automated statuses and pointers are unchanged; these rewrites make no new coverage claim. The later confirming runs judge each revised Open case against its current Then.

## The skips (D3)

All 24, by the report's skip register.

| Spec                                           | Skipped test                                                | Fate                                                                                                          | Batch |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----- |
| `drag-5-stub-detach.spec.ts`                   | DRAG-5.13, a grandchild Stub popped out to its Card's layer | Rework to the case as it reads, with one pop to the containing column. Its Card-layer expectation is obsolete | 4b    |
| `drag-card-zoom-in.spec.ts`                    | The two zoom-ins, own column and another                    | Rework as one parameterized spec: own-column DRAG-4.1 / cross-column DRAG-4.15 (item 7)                       | 4b    |
| `drag-7-hierarchy-modal.spec.ts`               | DRAG-7.9, R1's last child after R1a                         | Trace, then Rework                                                                                            | 4c    |
|                                                | DRAG-7.6, 7.10, 7.11, resting outside the modal pops out    | Rework to DRAG-7.6 and 7.10, with no Card layer. DRAG-7.11 is `Automated` without it                          | 4c    |
|                                                | DRAG-7.2, 7.6, an own slot behind an overflow row           | Rework to DRAG-7.6, as one re-entry spec with the shown own slot's. DRAG-7.2 is `Automated` without it        | 4c    |
|                                                | DRAG-7.2, R's only attached child dragged                   | Delete: DRAG-7.2's count tests cover it                                                                       | 4c    |
|                                                | DRAG-7.6, an own slot the section shows                     | Rework, with the re-entry spec above                                                                          | 4c    |
|                                                | DRAG-7.32, the three ways to close the Sheet                | Trace, then Rework with the screen-place check                                                                | 4c    |
| `drag-7-modal-hold.spec.ts`                    | DRAG-7.14, resting outside the section ends the hold        | Rework to the whole Card's bound, which replaced the section's                                                | 4c    |
|                                                | DRAG-7.15, from above to below R's overflow row             | Rework at item 10's aims, as one spec parameterized over W alone and W with WC                                | 4c    |
|                                                | DRAG-7.15, the same with a child                            | Merged into the spec above                                                                                    | 4c    |
|                                                | DRAG-7.17, above the overflow row with a scrolling list     | Trace (item 8), then Rework                                                                                   | 4c    |
|                                                | DRAG-7.12, the modal carries the classification             | Rework as the tier-attribute test (D13)                                                                       | 4c    |
|                                                | DRAG-7.10, 7.18, reopening the modal in the same drag       | Rework, with no Card layer. Reworked in 4c; the DRAG-7.18 tests were then skipped for their cost (4j)         | 4c    |
| `drag-7-overflow-row.spec.ts`                  | DRAG-7.27, R carries its overflow row                       | Rework, at an aim that's been tried                                                                           | 4c    |
| `project-tree-drag.spec.ts`                    | TREE-1.4, a subtree that holds every project                | Rework, aimed at the dragged project's own row                                                                | 4g    |
|                                                | TREE-2.1, descendants dimmed                                | Rework to the branch's absence and the tier attributes, with #12's title and reason replaced                  | 4g    |
| `item-repositioning-cross-column-dnd.spec.ts`  | 1.a and 2.a                                                 | Re-check, then re-derive or delete (4h)                                                                       | 4h    |
| `item-repositioning-cross-project-dnd.spec.ts` | 1.a, 2.a, 2.b and 4.b                                       | The same                                                                                                      | 4h    |

Skips added since, each temporary: DRAG-3.16's two tests (2026-11-10), DRAG-5.3's eight B18 variants, DRAG-5.10's two B21 variants and DRAG-7.18's two tests (2026-11-12), all for 4i except DRAG-7.18's, which went on to 4j (2026-11-13).

## Outside this story (D10)

- **TC-5.15 and TC-6.11, `Open`, and TC-6.13 and ATT-5.11, `Pending PO`:** the Quick Items epic. `epic-4-decisions.md` names all four by ID.
- **ATT-1.10, `Planned`:** a Card shows its tags (wiki item-attachment §12). The Tags & Type System epic holds it. `epic-5-decisions.md` names it by ID, under "Test-plan cases routed here by ID".

- **Retired DRAG-4.35 and B09's seed line-place guard:** Nathan accepts the defects until [the Descendants highlight-cue story](../tech-debt-stories/descendants-highlight-cue.md). DRAG-4.35 is removed from the catalog and active batch; its automation is removed by the relevant test owner. DRAG-4.30 retains its functional seed and saved-last-child coverage. The retired ID is not reused.

## Open questions

### Standing entries

- **Separately recorded follow-up — existing conditional DRAG-3.12 Board set-down; nonblocking for 4b (Nathan):** the null-return review finds that Board layer + Free X with null position + its own covered active region + other positioned rows selects a write. DRAG-3.12/wiki board-drag-interaction §5 require no request for this own-region middle release. The branch existed before this return, and real-board reachability remains unproved. If Nathan later routes this work, add a deterministic composed regression for that exact context/peers/null boundary, then the minimal Board set-down guard if the regression confirms the static finding. Preserve the valid locked-Column bare-container append with explicit unchanged `workphaseId`, foreign-middle no-anchor fallback, positioned same-region no-write, empty-peer no-write, end preview and explicit Top/Bottom anchors. Do not remove the workphase field globally or alter case wording to match a write. The request-rule internal category is already approved; application/Vitest work still uses a separate session with exact changed files/source identity and paired red/green evidence. Nathan checks in before later automation. This adds no case ID or 4b assignment and does not hold up the batch close-out; the existing catalog status/pointer is unchanged for this deferred issue.

- **For a separate Architect review, with PO input if needed:** review 4a's seven production files and paired regressions against the wiki before accepting the app changes. The retrospective gives the review manifest and the two Planner/observer interpretations to spot-check. No new review or implementation session has been started.

## Amendments

- **2026-11-13 — Split into this index and one file per batch (Nathan, the [MVP test-process trim](../tech-debt-stories/mvp-test-process-trim.md)).** 4a–4d's history, the five stops, the Review log, the earlier Amendments and 4c's and 4d's settled Open questions moved word for word to [the 4a to 4d log](story-10-batch-4a-4d-log.md). 4e–4h moved to their own files, and 4i and 4j, with the Open questions they cite, to [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md). The stops are now four, and the standing rules gain one test per case (D14), the look rule's later word (D13), the deferrals catalog, the reviewer's confirming passes and the Reconciler's single follow-up. The plan's Goal, D2, D5, D10, D12, D13, Phase 4 and Phase 5 are amended to match.

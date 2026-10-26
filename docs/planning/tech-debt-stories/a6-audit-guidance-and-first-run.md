# A6 — Audit Guidance Revisit and First Run

**Type:** tech-debt story · **Written:** 2026-09-26 by the Auditor · **Revised:** 2026-09-26 (D3's tag adopted; the replay dropped); 2026-09-30 (renumbered A6; A4's handoff folded in) · **Status:** batches 1 and 2 done (batch 1 committed as `7443721`; the first run's report written 2026-10-07); batch 3a–3h done; batch 4 done apart from the archive, which moved to batch 6; batch 5 (the re-run) done; batch 6's instructions applied; its code is planned as 6a–6f (Coder), of which 6a–6f are done, with 6c's `testing-strategy.md` follow-up; the Architect's pointers to the scope script are next · **Sequenced:** after A4 and A5a–A5d, all closed

**Source:** the round table at `docs/planning/round-tables/documentation-purposes-and-standards`, plus the other tech-debt stories in this folder. Tags like "Auditor F7" point to round-table items, and "A1 D11" points to another story's decisions. This plan is transient, so it may cite them.

## Goal

A1's D11 rewrites the parts of the audit instructions that directly contradict the new standards. A6 finishes the job in three steps:
1. **Revisit.** Write down the audit rules that still live only in agent memory or habit, and fit the audit to what the tech-debt stories built: the story-plan template, the close order, `npm run check`, the docs checker, the `**Planned:**` marker and the archive.
2. **First run.** Run one full audit under the revised process, on real code that no audit has read yet: Story 6's fix batches and the tech-debt stories' code (D10). The test is whether the process produces an audit worth having.
3. **Correct.** Fix what the run exposes, in the instructions and in the code.

**Out of scope:**
- **Owned by A1:** D11's edits, the checker, persona pointers (D12) and the memory pass (D13). A6 builds on them and doesn't repeat them.
- **Owned by A5:** where the wiki's rules live, and the test cases that move with them. The first run classifies against the wiki as it stands on the day it runs.
- **Owned by the Reconciler and A3:** whether tests cover their cases. D8 below draws the line.

## Decisions

### D1. Audit rules that live only in memory move into the audit guide

Several rules the audits follow are written only in agent memory (`story-audit-cadence`, `audit-scope-from-tags`, `audit-fix-batches`), so any session that doesn't recall them breaks them. `audit-workflow.md` takes them on:
- **Cadence:** a four-pass audit at each story's close, at A1 D9's step 3, and an epic-wide pass at epic close.
- **N.1 refactor stories are conditional.** One follows a story only when that story's revisions probably left dead or vestigial code. An audit never routes a finding to an N.1 that hasn't been planned.
- **Structural findings never go on the Watch List.** They go to Fix Now (structural), ordered after any correctness fixes that touch the same code. The alternative is Routed to a story's plan, and only when that story is certain to happen and will rework the same code.
- **The passes run cold.** They get no story plan, prior audit or ledger. Only the orchestrator reads those, and only at the merge step (D4).
- **Fix Now is worked in batches, each ending with the gate and a stop for review and commit.** If a finding can't be reproduced by hand, a throwaway probe test settles it, not argument.
- **The scope comes from tags and commits, not commit messages** (D3).

Once the guide holds these rules, the Architect's memory pass converts those three memories into pointers to it, as A1 D13 does for the other guides.

### D2. The audit guide names the story-plan sections it depends on

A1 D10's template gives the audit the inputs it used to improvise, such as the N.1 disposition ledger. The guide should name them by section, as described in D4, rather than describe a ledger of its own. For an N.1 story:
- its disposition ledger is its Inbound deferrals section;
- its "Makes dead" list comes from its Code map.

### D3. An audit's range starts where the previous audit ended, and a tag marks that point

**Current practice** starts the range after the previous audit's fix batches. Story 6's range started at `39ab65f`, the Story 5 fixes, so fix batches are never audited. Story 6's four batches (`4c0cb34..06bd170`) came to 63 files, +3,877 / −1,887, including the split of the 1,013-line `useBoardDnd.ts`. No audit will ever read that code as things stand.

**The rule:**
- **Range.** An audit covers the previous audit's end commit through HEAD at A1 D9's step 3. That includes the previous story's fix batches and the tests written in its step 4.
- **The tag.** Nathan tags each audit's end commit `<name>-audited`, for example `epic-3-5-story-7-audited`. The next audit's base is then `git describe --tags --match '*-audited' --abbrev=0`, the way `epic-N-complete` marks epics. The report also states its range in its first line.
- **No gaps.** A tech-debt story with no audit of its own (A1 D10) still falls inside the next audit's range. "No four-pass audit" means no dedicated audit at that story's close. Its code still gets audited.
- **Formatting-only commits are left out.** A commit listed in `.git-blame-ignore-revs`, such as Tooling Gates' Prettier sweep, goes to no pass.
- **Commits proven to change only comments go to the drift pass only.** A4's batches are an example: A4 D8's comment-stripped comparison proves them. The other three passes see only files whose code changed.
- **Mixed work in the tree.** If the working tree holds uncommitted work from a different story, the orchestrator confirms the scope with Nathan before spawning passes.

### D4. What the orchestrator reads at the merge step

**The passes read none of this.** It comes in only after they've reported:
- **The open plan of the story being audited,** and the plan of every story in the range that closed without an audit of its own, from `docs/archive/`:
  - *Inbound deferrals:* confirm each one is done or deferred again with its new destination named. One that is silently missing becomes a required finding.
  - *Living-docs handoff, "Planned passages now built":* for each one, confirm the code has a `wiki <page> §N` index pointer at the rule's main enforcement site (A1 D7). A missing pointer is a small required finding. The handoff's list, not Scope's, because a Scope passage may have been deferred while the story was open.
  - *Amendments:* when judging whether code is vestigial, check which rules changed while the story was open.
  - *Code map:* only for an N.1 story, to check its "Makes dead" claims.
- **Handoffs addressed to the audit,** or to "the next story or audit" and not yet routed anywhere else. A4's are an example (D10 lists them). Each item either matches a pass's finding, or the orchestrator rules on it and the ruling gets a tier (D5).
- **The previous audit only, from `docs/archive/`,** for recurrence. Each report restates the full chain for anything it carries ("Story 3 #16 → Story 4 #16 → Story 5 → here"), so reading one report back is enough. Apart from the closed plans above, nothing else in the archive gets read.
- **The wiki passage each correctness finding touches,** for A1 D11's classification.

### D5. Tier details beyond A1 D11

- **Promotion at the third appearance.** An optional finding that shows up in a third consecutive audit becomes required by default. Keeping it optional needs a reason written in the report. Story 6's Watch List #18 was on its fourth audit and #19 on its third. As required findings, each would have had to be fixed, or rejected with a reason, which leads to the next rule.
- **A ruling becomes a site comment.** Examples are "deliberately separate", "looks wrong but isn't", and "rejected: can't happen because X". When no comment records the ruling yet, the finding is required, and its fix is a one-line present-tense comment at the site (A1 D7, Auditor F7). Without the comment, the next cold audit works the same question out again.
- **Passes respect rulings already in comments.** A pass that sees a site comment recording a ruling doesn't raise the finding again. If it has new evidence, it challenges the comment's stated reason directly, citing the comment.
- **The Watch List holds correctness items only.**

### D6. Every route out of an audit lands in a plan before sign-off

At sign-off the report goes into the archive, and nobody reads it again. So a route recorded only in the report is lost, which is Story 4 #10's failure. The report records that each route landed, and where:
- **PO rulings** (A1 D11's third bucket) go into the open story plan's Open questions, addressed to the PO.
- **Anything else for another role** (a coverage doubt, a wiki statement that looks wrong) goes to the same place, addressed to that role.
- **Deferrals** go into the destination story's Inbound deferrals.
  - If that plan hasn't been written yet, they go into the destination's roadmap entry. Whoever writes the plan moves them into Inbound deferrals (A1 D10).
  - Story 6 #17 (route to Story 10) is this case.

### D7. Checks only an audit can make under the new standards

`npm run check` covers types, lint and formatting (Tooling Gates), and its lint step runs the docs checker, which covers citation hygiene (A1 D8; A4 put it in `lint`). The audit treats a green gate as given and doesn't report what the gate reports. A cold pass can still judge what a script can't:
- **Ignore markers.** For every `check-docs-ignore-next-line` or `eslint-disable` added within the audit's range, the drift pass checks that its stated reason still holds.
- **Module headers against file content.** The drift pass flags a header that leaves out something the file owns, or claims something it doesn't. It flags a missing header only where `code-comments.md`'s "Which files get one" requires one, not on every module. The file-responsibility pass flags a file that owns too many things. When both fire on one file, the reconcile step merges them into one cross-tagged finding.
- **A directory `CLAUDE.md`'s file index.** Every file in the directory has its line, and no line names a file that no longer exists (the drift pass). If this proves mechanical, it moves into the checker.

### D8. Test code: where the audit stops and the Reconciler starts

**The audit reviews test code as code:** duplication, fixtures, helpers, file shape, and root `CLAUDE.md`'s E2E rules (Story 6 #10 and #17 are examples).

**The Reconciler owns what a test proves:** whether it covers its case, and whether it asserts the rule or just restates the code. An audit doesn't file either as a finding. If it notices one, it routes it (D6).

### D9. The epic-wide pass

- **Range and method:** it runs cold over the epic's whole range, from the previous `epic-N-complete` tag to HEAD.
- **Reading back:** at merge it reads the epic's last per-story audit for recurrence, one report back as in D4.
- **Close-out:** its required findings go through the same close-out as a story audit's.
- **Size:** it should be light. Anything it finds that the per-story audits missed points to a gap in some pass's lens, and the report says which lens.

### D10. The first run

This run happens once batch 1's drafts are applied, and uses the instructions as they leave them.

**Scope:** `epic-3-5-story-6-audited` (`4c0cb34`, tagged retroactively) through HEAD. Under D3, that range sorts into these groups:

| Source | What it contains | Passes |
|---|---|---|
| Story 6's fix batches (`4c0cb34..06bd170`) | Code: 63 files, including the `useBoardDnd` split | All four |
| Tooling Gates | The 12 lint fixes, and the new ESLint, tsconfig and script configs | All four |
| Tooling Gates' Prettier sweep | Formatting only, and on `.git-blame-ignore-revs` | None |
| A1 | New code: the `check:docs` checker in `scripts/check-docs/` | All four |
| A1, and the Architect's edits from A4's handoff | The `CLAUDE.md` files, and the module headers that received moved rationale | Drift |
| A3 | New tests | All four |
| A3 | test titles reworded (the IDs are the Reconciler's) | Drift |
| A4's 16 sweep commits (`359f093^..bae02c2`) | Comments, module headers, and test titles that named functions by old names. A4 D8 proves them comment-only | Drift |
| A4 batch 5 | Root `lint` runs `check:docs` | All four (one line) |
| A5a–A5d (`d298ff3..05e3f98`) | Code and tests, about 4,400 lines outside `docs/`: item movement rules in `itemHierarchy.ts` and the item routes, migration `0011`, the sidebar's set-down and drag, the boards, columns and workphases routes, and the project tree's fixes and depth cap | All four |
| A5a–A5d | The `CLAUDE.md` edits | Drift |
| A2, A3 and A5's wiki and test plans, A1's guides and personas | Docs outside the audit's code scope | None |

**A5a and A5d were full stories.** Each says it closes by the full story-done checklist, audit included, but neither has an audit report. This run is their audit (Nathan, 2026-10-06). So the merge step reads their archived plans' Scope, Inbound deferrals and handoffs to the audit (D4), as it does for the tech-debt stories in the range.

**Size.** Two shares are large:
- **The drift share:** every comment A4 rewrote. It runs as one pass per A4 commit, in parallel, merging neighbors where a commit is small, so no single pass holds the whole sweep. That's the check A4's own gates can't make: whether a rewrite dropped a reason instead of restating it, or states something the code doesn't do.
- **The code share:** Story 6's fix batches, A5a–A5d, and the rest. Each of the four passes runs as several instances, one per group in the table, so no instance reads all of it. Batch 2 measures each group and sets the split.

**Inputs at the merge step (D4).** A4's handoff "To A6" is empty: every tag's reason was recovered at its site. A4 left four items for "the next story or audit". Nathan routed two of them elsewhere, and they aren't audit concerns: the sidebar's set-down write went to A5's D1, and the Sheet parent picker's missing depth cap went to the Work Item Detail & Chat UI epic's entry in `mvp-roadmap.md`. A pass that finds either one again gets that route as its disposition, not a new finding. The run takes the other two:
- **Two redundant keys in `ProjectPage.tsx`.** A4 found them not wrong: `App.tsx` already keys the whole page on the project. At most a small Fix Now, or rejected with a reason.
- **wiki board-drag-interaction §2's rule 6 has no index pointer.** A4 didn't confirm how a done list stops the shuffle, so it left the rule unmarked. The run confirms it. If the code enforces the rule, the pointer is a small Fix Now; if it doesn't, it's a correctness finding.

**What the run should show:**
- **Real value.** It finds code problems no gate catches, in the fix batches, the checker, A5's rule changes and the new tests, or it shows credibly that there aren't any. That's the test Nathan named.
- **Doc findings are a minority, and none of them repeat what the checker reports.** The baseline is Story 6: doc drift was one finding, but it took one of the four fix batches.
- **The rulings A4 wrote at their sites** (Story 6 #24 and #30) aren't raised again without new evidence (D5). A4 wrote 15 of the 16. The 16th, a Descendants release with no `over`, got no comment because `handleDragEnd`'s Descendants branch already says the release reads only the projection. If a pass raises it anyway, that comment isn't enough, and the fix is a comment.
- **A4's handoff items are all resolved** (D4): each is ruled on, fixed, or routed.
- **Every route lands in a plan** (D6). This plan's Open questions is the place for items to the PO and the Test Planner, and Story 7's roadmap entry or plan is the place for deferrals.
- **The report closes and moves to the archive untouched.** Its end commit is tagged `a6-audited`, and that tag is Story 7's audit base.

## Work, in batches

Each batch ends with its checks and a stop for Nathan's review and commit.

### Batch 1: the revisit (Auditor drafts, Architect applies)

- Re-read `audit-workflow.md`, `auditor.md` and the four `auditor-*` agents as they stand after A1. Check them against:
  - A1's four guides;
  - the revised `epic-done-checklist.md`;
  - the wiki README (A2);
  - the test-plans README (A3);
  - `npm run check` (Tooling Gates), which now includes `check:docs`;
  - what A1 changed at its close: the module-header rule in `code-comments.md` (D7), the rewritten `testing-strategy.md` (D8), and the checker's wider `transient-link` and `symbol-ref` rules, which take mechanical work off the drift pass.
- Draft D1–D9 into the guide and the agents, plus any conflicts the re-read turns up. *Done 2026-10-06:* the drafts were applied and their folder deleted. What they changed is in Amendments.
- **Reviews:** the Architect reviews D2 and D4's references to the template, the Test Planner reviews D8, and Nathan approves. *Done:* D8's review sent a pass's doubt about a test to the Reconciler, which now reads those doubts from the plan's Open questions (`audit-workflow.md`'s Test code, and `test-reconciler.md`). Nathan committed batch 1 as `7443721`.
- **Check:** `npm run check:docs -- .claude` still reports zero hits.

### Batch 2: the first run (Auditor)

- Nathan tags `4c0cb34` as `epic-3-5-story-6-audited`. *Done:* an annotated tag on `4c0cb34`.
- Run D10 and write `docs/audits/code-quality-audit-a6.md`, opening with its range line, with every route landed (D6). *Done 2026-10-07:* the range is `epic-3-5-story-6-audited..7443721`, and the routes landed in Open questions and their destinations.

### Batch 3: corrections

- **Instructions:** whatever the run exposed. The Auditor drafts; the Architect applies. Two candidates from the report's account of the run: the passes split by code area instead of by commit, and their instances launched in waves.
- **The Architect's routes** (Open questions, "For the Architect"). The guides' fixes don't depend on the code and can land any time. Root `CLAUDE.md` and `coder.md` land after the code batches that change what they describe (3d and 3e).
- **Code (Coder):** the report's Fix Now, #1–42, plus Watch List #47 and #50, which sit in code 3d and 3g already rework (Nathan, 2026-10-21). The numbers are the report's. Seven batches, each ending with `npm run check`, plus `npm run test:e2e` where it touches behavior or E2E code, and a stop for Nathan's review and commit. Each batch fills in its rows in the report's Close-out table.

**Order.** Correctness comes first, as the audit guide says. After that the batches go area by area, and within an area the structural moves come before the comment fixes, the reverse of the guide's order. Many of the comments (#8, #10) sit in code that #19–#25 and #37 move or split, so this way each is written once, beside its final code.

| Batch | Findings | Notes |
|---|---|---|
| 3a. Server correctness | #1, #2, #6, with #20 | #6 lands through #20's shared parent check. #1 needs no backfill: the dev database has no attached row with a null position (checked 2026-10-21), and the test database is rebuilt for each run. Each fix gains the test its finding names. |
| 3b. Client correctness | #3, #5, #4 | #4 starts with a throwaway probe of DRAG-3.24's scenario on the test stack. If the probe fails as traced, keep a done list's rows still during a drag, and add rule 6's index pointer at the fix. If it passes, reject #4 with the reason, written at the site that enforces rule 6, beside its pointer. DRAG-3.24's permanent test stays with Story 10. |
| 3c. The checker | #7, #42, #18 | `scripts/check-docs/`, `eslint.config.mjs` and the Bruno requests only. `npm run check:docs` reports no new hits afterwards. |
| 3d. Server structure | #19, #21–#26, #47, then #8 | #47 rides with #19, which rebuilds `POST /items`' checks. #19 changes which error wins when an attached create also names a missing workphase; no wiki rule or test-plan case states which. |
| 3e. Client structure | #27–#37, then #9–#14 | Likely two commits: the drag layer (#30, #32, #34–#37, #9–#12), then the sidebar, `lib/` and `api/` (#27–#29, #31, #33, #13, #14). #9's last bullet asks whether `AttachGhostRow` stays apart from `AttachedChildRow`: restate the reason, or merge them if none holds. Bring that choice to Nathan within the batch. |
| 3f. Unit tests | #38, #39, #15, #16 | Test code only. |
| 3g. E2E | #40, #41, #50, #17 | #50 rides with #40's rework of `seed.ts`. |
| 3h. The checker reads Bruno | The Coder's 3c question, answered 2026-10-22 | Nathan: "the checker can verify the bruno files are up to date". `npm run check:docs` reads each `bruno/**/*.bru` file's `docs` block, keeping the file's line numbers, and runs it as Markdown outside the wiki. That checks IDs and dates, links to transient docs, the form of wiki pointers and whether they resolve, and `<file>::<symbol>` references. The rest of a `.bru` file (URL, body, vars) isn't prose and stays unread. Tests in `scripts/check-docs/`. Whether a `docs` block still describes its endpoint stays a review job. |

**Across the batches:**
- **A test that moves, splits or merges** (#31, #37, #39, #41) keeps its case ID at the start of its title. The test-plan Automation lines that name the old files go stale; the Reconciler run at close re-maps them.
- **Root `CLAUDE.md` is the Architect's.** A batch that moves or renames something it names (#19, #22, #24, #27, #28) lists the change in its note for the Architect, who applies it with that batch.
- **`client/src/components/workflow/CLAUDE.md` is the Coder's,** like any directory `CLAUDE.md`: #11 is fixed there, and its file list follows #36 and #37's moves.
- **The other Watch List items** (#46, #48, #49) stay optional.

### Batch 4: close

- **The Reconciler runs once** over the whole catalog, since batch 3 moves and splits test files (`story-done-checklist.md`'s tech-debt section). It runs after 3h is committed, on a clean commit (Nathan, 2026-10-22). It also answers the items addressed to it under Open questions.
  - *Run 2026-10-22,* one instance per test-plan folder, at `57d3ca2` plus the uncommitted docs. The reports are `docs/audits/test-reconciliation-a6-<folder>.md`. A short re-check follows the Coder's step after the run.
- **The Coder's step, after the run** (Nathan, 2026-10-22 and 2026-10-23): tests only, for what the code already does, apart from one code fix (the last item). A test that finds the code doesn't do what its case says isn't fixed here: its case goes to Story 10, or to the story that owns the code, and the Test Planner routes it. A test that checks a fine-tuned drag on the board or the sidebar isn't changed here either: that's Story 10's. Each test starts its title with its case's ID, and the reports give each test's file and line. The Reconciler then re-checks only these cases, and lists any test title whose ID has a prefix no test-plan folder uses, which no instance of the run looked for.
  - **Cases A6 revised or added:**
    - ATT-4.11: the accepted top-level edit by `PUT`, with `H` at `CAP − 1`.
    - ATT-9.12: the ID on `items.workphase.test.ts`'s create-and-move test, which gains the two moves (`R` left Free, `X` left attached to `A`) and a check that the moved row is unchanged.
    - ATT-10.4: the ID on `items.test.ts`'s missing-row create test, which gains a create naming the missing project with `P` as the parent.
    - ATT-5.12 and ATT-11.1: their IDs on the route tests the item-attachment report names.
    - ATT-11.2: an E2E test. The board's half has only a client test.
    - BCU-2.9: a route test in `columns.test.ts`. BCU-2.8's test takes the case's new title.
    - DRAG-6.1: the ID on batch 3b's band test, which also asserts the list while the write is pending.
  - **Internal tests Nathan approved (2026-10-23):**
    - DRAG-2.9: `dragClassification.test.ts`'s "cycle-forming wins over depth-capped" test.
    - DRAG-3.5: `dragBands.test.ts`'s first two `bandFor` tests, and a new test of `dragBands.ts::reservationFor`.
    - DRAG-1.14: `popSession.test.ts`'s two DRAG-1.14 tests, and an assertion that a distance of 0 never pops.
    - DRAG-6.6: `dragRequest.test.ts`'s test, for the request's half. This reverses the decline at A3's batch 3 review. The board's half is an E2E test: the move is answered with a 400, the board reloads, and the item renders where the server has it.
  - **Tests that can't fail, for cases already `Automated`:** TC-2.23 takes its ID on `items.hierarchy.test.ts`'s re-attach test; TC-2.25's and TC-5.1/5.4's setups change so a wrong order fails them. TC-2.9's ID goes on the cross-column API spec the report names. The item-positioning report has each fix.
  - **IDs on passing client tests, from the board-drag report's Proposed Stamps (Nathan, 2026-10-23):**
    - DRAG-6.2: `itemWriteReconciliation.test.ts`'s "TC-2.30: a pending item keeps its position…".
    - DRAG-4.12: `dragRequest.test.ts`'s "DRAG-4.1, DRAG-5.4: attach…" and `popSession.test.ts`'s "a childless Card … never pops any further…".
    - DRAG-6.11: `itemListOps.test.ts`'s "draws an item with no completedAt at the end of a done list…", which also asserts the item stays last once its `completedAt` is stamped.
    - **Request halves only,** so each case stays `Open` for Story 10: DRAG-1.24 (`dragRequest.test.ts`'s "same workphase, empty others…"), DRAG-3.24 (its "DRAG-3.12: same workphase, slot existing…"), DRAG-3.23 (its "a done region never anchors…"), DRAG-6.7 (its two stale-response tests), DRAG-6.9 (`itemWriteReconciliation.test.ts`'s "a response for a write whose placement has since been replaced…"), and DRAG-3.11 (`itemListOps.test.ts`'s TC-2.30 test).
  - **Test-quality fixes outside the drag specs,** which change no status: BCU-1.2's "nothing changes" compared with a read taken before the delete, and BCU-2.3's test without its `position` assertion (the boards-columns-unsorted report, Test Quality Concerns 3 and 4); TREE-3.9's route test matching the refusal's reason, and TREE-9.1's "unchanged" asserted as unchanged, not as survival (the project-tree report, Concerns 4 and 5); and TC-2.4's ID on the "A after C" route test, once its anchor sits at a value that shows the rounding (the item-positioning report).
  - **A test under the wrong ID:** `useProjectDragReorder.test.ts`'s "marks nothing invalid while the cap is unknown" moves out of TREE-1.11's describe, since no rule states what it asserts (Amendments, the run).
  - **The one code fix:** `PUT /items/:id` answers 400 for an `agentId` that names no agent, and changes nothing, as `POST /items` does since #47. Its route test carries no case ID, since no wiki page covers the agent field (Open questions, batch 3d's notes). It's a production change, so the step ends with `npm run check` and `npm run test:e2e`.
  - *Done 2026-10-23,* as batches 4a–4e, with nothing moved to Story 10. *Re-checked the same day:* `docs/audits/test-reconciliation-a6-recheck.md`.
  - **A last Coder item** (Nathan, 2026-10-23): `PUT /items/:id` handles `agentId: ''` the way the other writes handle an empty-string id; `POST /items` stores it as no agent. Its route test carries no case ID, and no re-check follows, since no case covers the agent field. It's a production change, so it ends with `npm run check` and `npm run test:e2e`.
  - **The re-check** also drops `positionResolver.test.ts` from TC-2.8's line: it throws for the wrong reason, and route tests prove the case.
- **Every Open question is answered,** or moved to the plan that will answer it. Batch 3 fixes behavior, so this story closes by the full checklist.
- The Architect's memory pass for the three audit memories (D1). **Done 2026-10-23 (Architect):** see Amendments.
- The archive moved to batch 6, after the re-run (Nathan, 2026-10-23). `a6-audited` is tagged on `f3fc213`, the commit that added the first report. That commit holds only docs, so it ends the same code range `7443721` would.

### Batch 5: the re-run (Auditor)

Batches 3 and 4 touched about 150 code files, so the audit runs again straight away, over them (Nathan, 2026-10-23). What they introduced is fixed in this story, not carried into Story 7's audit.

- **Range:** `a6-audited..b315a29`, 18 commits: batches 3a–3h, the Reconciler's two commits, and 4a–4f. Nathan tags the end commit `a6-rerun-audited`, and Story 7's audit starts from it.
- **Report:** `docs/audits/code-quality-audit-a6-rerun.md`. Its scope lists are in `docs/audits/a6-rerun-scopes/`, deleted before the report is archived.
- **Run as D10's first run was,** in the same seven groups, as 19 instances in waves of up to five. The scope lists add two things the first run's lacked: code that only moved between files, listed apart with the file it came from, and the places where lines were removed with nothing added, which blame can't see.
- **The previous audit is the first run.** The merge checks each finding its Close-out marks fixed against the code, and one that comes back is a recurrence under its first-run number. The re-run counts as an audit for the third-consecutive rule (`audit-workflow.md`'s Tiers).
- **No code changes while the passes run,** since they read the working tree, not a commit.
- *Done 2026-10-23:* 23 Fix Now as first written. re-tiered the same day under Nathan's rules (Amendments): 16 Fix Now (#1–#2, #4–#11, #13–#16, #20–#21), 4 routed (#12, #24–#26), 6 on the Watch List (#3, #17–#19, #27, #37) and 2 Covered by (#28, #29). Its routes are in Open questions. Code may change again.

### Batch 6: the re-run's corrections, and the close

- **Instructions (Auditor drafts, Architect applies):** what the re-run's cost showed. Reading depth follows how much a file changed; a file whose only change is its imports goes to the drift pass alone; moved code and removal sites are listed apart, as the re-run's prompts did. Nathan approved the direction on 2026-10-23. A second round the same day: comment conventions leave the audit, which flags only a wrong or misleading comment; a structural finding that's a judgment call goes on the Watch List or is Informational; and an optional finding in a file a Fix Now changes keeps its tier, with a note that it can ride along. The drafts are in `a6-batch-6-drafts/`, whose README lists each change and four judgment calls. Nathan applied them on 2026-10-23.
  - **A third round, from the Architect's review** (Nathan, 2026-10-23), applied by the Architect:
    - no audit reads an earlier one: the merge step's read of the previous report, the third-consecutive-audit rule and the recurring-finding line are gone. An optional finding lasts only as long as its audit, and anything that should outlive it is routed into a plan;
    - the persona limits what a pass reads, not what it reports: a defect found in old code is reported;
    - §6's structural sentence says plainly that a structural Fix Now is fixed, or Routed to a story certain to rework the code.
  - **Moved, unchanged code leaves the audit** (Nathan, 2026-10-23). It was audited when it was written, and the gates and tests prove a move safe; the Reconciler re-checks the cases whose tests move. No pass reads it, and it doesn't count toward a file's read-whole mark. Two guards stay:
    - **a copy isn't a move.** Lines whose source still holds them in the range count as changed, since a copy is what the duplication pass looks for;
    - **a move's source side stays a removal site,** so a comment left describing the code that moved away is still caught.
- **The scope script (Coder)** (Nathan, 2026-10-23): a repo script under `scripts/` that builds an audit's scope files, so every audit builds them the same way and the orchestrator stops building them by hand. Story 7's audit is the first to use it.
  - **It ports the Auditor's two scripts** from the re-run (`a6-batch-6-drafts/scope-scripts/`) to `.mts`, as the Auditor recommends (2026-10-23). The rest of the repo's tooling runs on node and is tested with `node --test`, so the port runs in `npm run check`, and the repo has no Python.
    - **The scripts' README** lists what they don't do yet, and the git details a port keeps:
      - bound the blame at the base;
      - blame each file twice;
      - leave a renamed file's old path out of "another file";
      - ignore whitespace and `.git-blame-ignore-revs`;
      - take removal sites from the diff;
      - read git's output as UTF-8.
    - **A check for the port:** over the re-run's range, `a6-audited..b315a29`, its changed-line and removal-site lists match `docs/audits/a6-rerun-scopes/`, which the Python reproduces byte for byte. The rest of its output differs on purpose, by the rules below. That folder stays until A6's close, after 6f.
  - **It takes** the base, by default the newest `*-audited` tag, and the end, by default HEAD.
  - **For each file in the range, it writes:**
    - its group from `audit-workflow.md` §2's sort table, judged per file over the whole range. A comments-and-test-titles-only change is proven by the script itself, comparing the file with comments stripped through `extract.mts::extractCode`, so a story no longer supplies that comparison;
    - its changed lines: `git blame -w -M -C -C` over the range, skipping `.git-blame-ignore-revs`;
    - its moved lines. A line counts as moved only when `git blame -M -C -C` traces it to a line from before the base. One traced to a commit inside the range is new code that moved after it was written, so it counts as changed, and so does a line whose source still holds it (a copy). Moved lines are left out of the scope, by the ruling above; the script still finds them, to tell them from changed lines;
    - its removal sites: the hunks of `git diff -U0` that add nothing;
    - its read-whole mark: a new file, or 10 or more changed lines of code, not counting imports, comments, test titles or blank lines. Sorting a line into those reuses the checker's TypeScript parse: `extract.mts::extractCode` finds the comment and test-title lines, and the same parse gives the import declarations, multi-line ones included. A regex can't tell these apart.

    It also writes the deleted and renamed paths, under their old names, so the drift pass can search for what still names them.
  - **Then the scope files,** one per pass instance, as §2 gives them out:
    - an imports-only or comments-only file goes to the drift pass alone;
    - File Responsibility gets only the files marked read whole;
    - moved lines are left out;
    - the drift pass also gets the deleted and renamed paths.
  - **The split is an input.** §2 leaves to the orchestrator which area groups a run uses, how many instances each pass gets, and any extra file marked read whole. So the script reads them from a small per-run config, with the seven area groups both A6 runs used as its default, instead of hard-coding paths and instances as the Python does.
  - **Tests** go beside it on `node:test`, as `scripts/check-docs/`'s do, and run in the gate.
  - **Then (Architect):** the guide's §2, the persona and the agents keep the policy: which group goes to which passes, what each list means to a pass, and the orchestrator's judgment. For how the lists are built, they point to the script.
- **Code (Coder):** the re-run's Fix Now, in the six batches below (planned 2026-10-23). Each batch ends with `npm run check`, plus `npm run test:e2e` where it touches behavior or E2E code, and a stop for Nathan's review and commit, and fills in its rows in the re-run's Close-out table.
  - **One item outside the report** (Nathan, 2026-10-23): `POST /items` refuses `agentId: ''` and `parentId: ''` with the 400 every other write gives an empty-string id, where today it stores each as none. No client path sends either: the detail panel sends `null`. An MCP agent sending `parent_id: ''` to `create_item` would get the 400. It's a production change to a request's shape, approved here, and its route test carries no case ID unless the PO's answer (Open questions, batch 4f's notes) brings one.

**Order.** As in batch 3, the batches go area by area. Each area's correctness fixes come first, then its structural moves, then its comment fixes, so each comment is written once, beside its final code. The areas go in order of risk:
- the regression, #1, goes first;
- the checker's #2 goes last, with the scope script, since nothing in the repo triggers it.

**Keep a comment-only file comment-only.** Under batch 6's rules, Story 7's audit gives a file whose only change is to its comments to the drift pass alone. The scope script judges that per file, over the whole range, so the commit a comment fix lands in doesn't matter. What matters is that the file gets no code change too. That's why #3 and #27 aren't pulled in: each would turn a comment-only file from #6 or #8 into a code change.

| Batch | Findings | Notes |
|---|---|---|
| 6a. Client correctness | #1, #5 | **#1:** `onColumnDrop` takes a resync callback, and `useBoardDnd`'s `handleDragEnd` passes `resyncBoard`, as the column drop did at the base. The report's other option, ending a live session on every board reload, would also cover the column and workphase CRUD reloads. But none of those can land mid-drag by hand, and `useColumnManagement` is built before `useBoardDnd`, so the two hooks would each need the other. #1 gains the hook-level test its finding names: a failed reorder that lands during an item drag ends the drag. **#5** is in the same test file. |
| 6b. Server source | `POST /items`' empty-string ids (above), #15, then #6 with #38 and #39 | **The `POST` fix** is the batch's one behavior change, and #38's comment sits beside its check. Its finding, #29, closes as fixed here rather than Covered by. **#6's `runMigrations.ts` bullet** narrows the comment; #3, which would move the `UPDATE`, stays on the Watch List. |
| 6c. Server tests | #4, then #16 with #17 and part of #37, then #10 with #41 and #42 | Test code only, likely in two commits, as 3f was.<br>**#4's second half:** `fixtures.ts`'s `create*` helpers assert their status.<br>**#16** moves `itemHierarchyFixtures.ts`'s helpers into `fixtures.ts`. **#17** moves the tests that sit in files whose headers say otherwise, since #16 changes the same files; each keeps its case ID.<br>**From #37:** `setItemWorkphase`, `createAgent` and `createItemType`, whose sites are all in files this batch changes. #37's extra-boards option on `workflowWithPhases` stays on the Watch List, since it would add `columns.test.ts`, which nothing else here touches. |
| 6d. Client structure | #13, #14, #20, then #7, #8, #9 | **#13 and #14** add `getSubtree` and `sortedChildrenByParent` to `lib/hierarchy.ts`, and point both callers of each at them. **#9:** its `hierarchy.test.ts` bullet is written beside #13's rewrite, and its `popSession.test.ts` titles beside #20. **#7 and #8** are comments only; keep their files that way. `workflow/CLAUDE.md` is the Coder's (#7). Runs `npm run test:e2e`, since #13 and #14 change code the board's drag and the sidebar share. |
| 6e. E2E | #21, then #11 | **#21's seed-helper rework** includes the test that can pass without its subject (`workflow-inheritance.spec.ts:221–226`). **#11's two files** are comments only. |
| 6f. Scripts | #2 with #23, then the scope script | **#2 and #23** are in `scripts/check-docs/`. **The scope script** is new (above), and reuses `extract.mts::extractCode`. `npm run check:docs` reports no new hits afterwards. |

**Across the batches:**
- **A test that moves keeps its case ID** at the start of its title.
- **The Reconciler re-checks** the cases whose tests 6c, 6d or 6e move, split or retitle, once 6e is done.
- **The Architect's follow-ups:**
  - after 6c, `testing-strategy.md` for #16's fixtures (Open questions, the re-run's "For the Architect"), done;
  - after 6f, `audit-workflow.md`'s §2, the persona and the four agents point at the script, and moved code leaves them;
  - a batch that changes something root `CLAUDE.md` names lists it for the Architect.
- **The optional findings left out:**
  - on the Watch List: #3, #18, #19, #27, and #37's extra-boards option;
  - every Informational finding except #23, #38, #39, #41 and #42.
- **Every route lands** in its destination before sign-off (D6).
- **Close:** `a6-scopes/`, `a6-rerun-scopes/` and `a6-batch-6-drafts/` are deleted (the drafts' `scope-scripts/` is needed until 6f lands), both reports move to `docs/archive/`, and this plan follows once it's signed off.

## Code map

| File | Batch | Change | Who |
|---|---|---|---|
| `.claude/guides/audit-workflow.md` | 1, 3, 6 | D1–D9; batch 6: the scope file and reading depth | Auditor drafts, Architect applies |
| `.claude/personas/auditor.md` | 1, 3, 6 | D1, D5; batch 6: how a pass reads its scope file | Auditor drafts, Architect applies |
| `.claude/agents/auditor-consistency-drift.md` | 1, 3, 6 | D5, D7; batch 6: imports-only files, moved code, removal sites | Auditor drafts, Architect applies |
| `.claude/agents/auditor-duplication-abstraction.md` | 1, 3, 6 | D5: respect site rulings; batch 6: how far to look | Auditor drafts, Architect applies |
| `.claude/agents/auditor-file-responsibility.md` | 1, 3, 6 | D7: the split with the drift pass over module headers; batch 6: only files read whole | Auditor drafts, Architect applies |
| `.claude/agents/auditor-correctness-security.md` | 1, 3, 6 | D5: respect site rulings; batch 6: moved code and removal sites | Auditor drafts, Architect applies |
| `.claude/guides/code-comments.md` | 6 | The conventions are the writer's and the reviewer's; an audit takes only a wrong claim | Auditor drafts, Architect applies |
| `.claude/guides/documentation-standards.md` | 6 | The same, in "What the checker checks" | Auditor drafts, Architect applies |
| `.claude/guides/story-plan-template.md` | 1 | The tech-debt template gains Inbound deferrals and Open questions; "N.1" becomes "a cleanup refactor"; a tech-debt story that changes what the app does closes by the full checklist | Architect |
| `.claude/guides/story-done-checklist.md` | 1 | The same full-checklist line, in its tech-debt section | Architect |
| `docs/audits/code-quality-audit-a6.md` | 2 | new, transient | Auditor |
| Code named by the report's Fix Now (#1–42) and Watch List #47 and #50 | 3a–3g | fixes | Coder |
| `server/src/lib/itemTree.ts` | 3a done | #20, #6: `parentRefusal`, the one legality sequence for items and projects: the parent exists, isn't the row or in its subtree, and the cap holds when the parent changes, the top level included. `assertWithinDepthCap` takes a null parent; `assertWithinProjectDepthCap` is private | Coder |
| `server/src/lib/itemHierarchy.ts`, `server/src/routes/items.ts`, `server/src/routes/projects.ts` | 3a done | #20: the item move and edit (through `validateHierarchyRequest`), `POST /items`, and the project create, edit and move ask `parentRefusal`, so #6 lands for all of them. #1: `POST /items` positions an attached child whatever its parent's workphase | Coder |
| `server/src/lib/workflowItems.ts`, `server/src/routes/workflows.ts` | 3a done | #2: `getProjectsUsingWorkflow` is exported, and `GET /workflows/:id` answers a position scope only for items of the projects that use the workflow | Coder |
| `server/tests/routes/items.test.ts`, `items.hierarchy.test.ts`, `workflows.test.ts` | 3a done | One test each for #1 (TC-3.4), #6 (ATT-4.11) and #2 (no ID); see Amendments | Coder |
| `scripts/check-docs/extract.mts` | 3c done | #7: `isTestCallee` reads the title after an `.each` table or tagged template. #42: `unfencedLines`, the one reading of which lines sit inside a fence | Coder |
| `scripts/check-docs/files.mts`, `rules.mts`, `check.mts`, `repoIndex.mts` | 3c done | #42: the transient folders (`TRANSIENT_FOLDERS`) and the docs layout (`isInWiki`, `isInTestPlans`, `wikiPageOfReadme`, `wikiPageAt`, `resolveLink`) each spelled once in `files.mts`, and the link pattern once in `rules.mts`. #18: the three headers | Coder |
| `scripts/check-docs/extract.test.mts`, `repoIndex.test.mts`, `files.test.mts` (new) | 3c done | The tests for #7 and #42 | Coder |
| `bruno/items/move-item.bru`, `create-item.bru`, `update-item.bru`; `eslint.config.mjs` | 3c done | #18: wiki pointers in the `wiki <page> §N` form, `move-item.bru`'s hierarchy block cut from about 30 lines of restated rules to a paragraph and a pointer, and the ESLint comment | Coder |
| `client/src/components/KanbanCard.tsx` | 3b done | #3: the attach ghost is drawn for a Card that isn't the drag's containing Card (`containingCardId`, the test `placementFor` uses), not for one that isn't the Stub's direct parent, so a grandchild keeps its row at its Card's layer | Coder |
| `client/src/components/workflow/dragRequest.ts` | 3b done | #5: `sendItemMove` records the placement with a `'first'`/`'last'` slot spelled as the anchor the request carries. `toRequest`'s sentence on the pending marker is scoped to a release that sends a request, which is #9's bullet for `dragRequest.ts:78–81`, done with it | Coder |
| `client/src/components/CardList.tsx` | 3b done | #4: a done list's `SortableContext` takes a strategy with no transforms, and the line carries rule 6's index pointer | Coder |
| `client/src/components/workflow/itemWriteReconciliation.test.ts`, `dragRequest.test.ts`, `tests/ui/drag-5-stub-detach.spec.ts` | 3b done | One test each for #5 (TC-2.28) and #3 (DRAG-5.13). #4 has none: its permanent test is Story 10's. `dragRequest.test.ts` gains a reworded comment only | Coder |
| `server/src/lib/itemHierarchy.ts`, `server/src/routes/items.ts` | 3d done | #19: `resolveCreate` holds a create's missing-workphase, parentless-flag, attached-workphase and foreign-workphase checks, in `validateHierarchyRequest`'s order and with its messages. The route keeps the parent, project and plain-reference checks, and reads the parent through `getParent`. #47: `POST /items` refuses a `projectId`, `type` or `agentId` that names no row. #21: the item anchor check is `anchorRefusal` over `resultingScope`. `foreignWorkphaseError` and `resolveCreateWorkphase` are no longer exported | Coder |
| `server/src/lib/positionResolver.ts`, `server/src/lib/itemPositionScope.ts`, `server/src/routes/projects.ts` | 3d done | #21: `anchorRefusal(table, scopeWhere, anchorId, subjectId)`, the one check of a named neighbor, over the resolver's own scope predicate. The item and project writes map its reason to their messages, and `itemPositionScope.ts::sharesPositionScope` is deleted. #22: `withReindexDisclosure`, the one disclosure builder, which `respondWithItem` and `projectResponse` call | Coder |
| `server/src/lib/itemTree.ts`, `server/src/lib/workflowItems.ts` | 3d done | #23: `ancestorsOf(table, id, tx?)`, the one walk up `parentId`. The depth, `itemHierarchy.ts`'s shown-with walk and `effectiveWorkflowIdForProject` each read it and keep their own stop rule | Coder |
| `server/src/lib/defaultBoard.ts`, `workflowCascade.ts`, `projectCascade.ts` (new); `server/src/lib/boardCascade.ts`, `server/src/routes/boards.ts`, `workflows.ts`, `projects.ts`, `server/src/db/runMigrations.ts` | 3d done | #24: `createDefaultBoard` moves to `lib/defaultBoard.ts`, so no route imports another and the migration path imports no route. #25: `deleteWorkflowsById` (boards and columns, notifications, workphases, then the workflows) is called by the workflow DELETE and by `projectCascade.ts::deleteProjectById`; `routes/projects.ts` now imports two tables, not seven | Coder |
| `server/src/routes/testHelpers.ts` | 3d done | #26: `writeOrNotFound` | Coder |
| `server/src/db/schema.ts`, `server/src/lib/columnRanges.ts`, `workphaseOrder.ts`, `attachedCascade.ts`, `server/src/mcp.ts`, `client/src/test/itemFixture.ts`, and the comments and headers of the files above | 3d done | #8, each written beside its final code | Coder |
| `server/tests/routes/items.test.ts`, `items.hierarchy.test.ts`, `workflows.test.ts`, `testHelpers.test.ts` (new); `server/tests/lib/positionResolver.test.ts`, `itemTree.test.ts` | 3d done | The tests for #19, #47, #21, #22, #23, #25 and #26; see Amendments | Coder |
| `client/src/components/workflow/dragRegions.ts`, `dragStructure.ts` (new), `dragRegions.test.ts`, `dragStructure.test.ts` (new) | 3e drag layer done | #37: the vocabulary (types, key builders, `parseRegionKey`, `dragRegionProps`, `containsPoint`, `childRegionAt`) stays; the DOM half (`resolveDragStructure`, `measureRegions`, `DropColumn`, the staleness checks, `clipToVisible`) moves, and `layoutRect` is `paintedRect`. The test file splits on the same line. #35: `DRAG_OVERLAY_ATTR` | Coder |
| `client/src/components/workflow/useBoardDnd.ts`, `useColumnManagement.ts`, `client/src/components/BoardView.tsx` | 3e drag layer done | #36: the column-reorder drop is `useColumnManagement.ts::onColumnDrop`, which takes the board, and `BoardDndDeps` carries it in place of `setBoard` and `handleReorderColumns`. #30: a local `step` in `evaluatePop`. #32: `useLatest` | Coder |
| `client/src/components/workflow/useLatest.ts` (new), `usePendingGhostGuard.ts`, `useSnapTween.ts` | 3e drag layer done | #32: the "latest value" ref, spelled once | Coder |
| `client/src/test/popFixtures.ts`, `popSession.test.ts`, `placement.test.ts` | 3e drag layer done | #30: `step`, the single-sample runner `runPop` and `hoverAt` build on; 45 calls that fit it go through it | Coder |
| `client/src/components/dragChrome.tsx`, `BandGuides.tsx`, `KanbanCard.tsx`, `sidebar/SortableProjectRow.tsx`, `cardMetrics.ts`; `tests/helpers/dragGesture.ts` | 3e drag layer done | #34: `ACTIVE_CONTEXT_OUTLINE` moves into `dragChrome.tsx`, `INVALID_DROP_INDICATOR_LINE` beside its one reader, and both lines are built from `DROP_LINE_SHAPE`. #35: the three spellings of the overlay attribute read `DRAG_OVERLAY_ATTR` | Coder |
| Comments and headers across the drag layer; `eslint-disable` directives in `dragChrome.tsx`, `BoardView.tsx`, `useBoardManagement.ts` | 3e drag layer done | #9, #10, #12, each written beside its final code | Coder |
| `client/src/lib/hierarchy.ts`, `hierarchy.test.ts`; `client/src/components/workflow/dragClassification.ts`, `dragClassification.test.ts` | 3e sidebar, lib and api done | #27: `isWithinDepthCap` moves from `dragClassification.ts` to `lib/hierarchy.ts`, beside the functions that feed it, and its test moves with it. #28: `byPositionThenCreatedAt`, generic over `Positioned`. #29: `buildParentOptions`' indented branch walks `flattenHierarchyOf` and sorts siblings with #28's comparator, so it now takes `T extends TreeNode & Positioned` | Coder |
| `client/src/components/sidebar/projectTreeUtils.ts`, `useProjectDragReorder.ts`, `projectTreeUtils.test.ts`; `client/src/components/workflow/itemListOps.ts`, `itemWriteReconciliation.ts`, `itemWriteReconciliation.test.ts`, `useBoardDnd.ts` | 3e sidebar, lib and api done | #27: the hook walks the dragged subtree once (`getDescendantLevels`) and asks `isWithinDepthCap` with the projection's depth, which is the dropped project's parent's depth. #28: the sidebar's sort and the board's both call the comparator. #31: `projectTreeUtils.ts::getDescendantIds` and `eligibleRows` and `itemWriteReconciliation.ts::applyItemWriteResponse` are deleted, and their callers call `getDescendantIds`, `toRows` and `applyWriteResponse`. The workphase-cascade caveat is at `completeItemWrite` | Coder |
| `client/src/api/shared.ts`, `items.ts`, `projects.ts`; `client/src/lib/positionedWrite.ts`; `client/src/components/ItemDetailPanel.tsx`, `item-detail/AgentSection.tsx`, `ChildrenSection.tsx`, `ParentSection.tsx`; `ItemDetailPanel.test.tsx` (new) | 3e sidebar, lib and api done | #33: `api/shared.ts::PositionedWriteResponse<Row>`; `ItemWriteResponse` and `ProjectWriteResponse` are aliases of it, `applyWriteResponse` takes it, and the Sheet's callbacks are typed with it. #13: `api/items.ts`'s unused re-export of `ReindexedPosition` is gone | Coder |
| `client/src/components/ProjectPage.tsx`, `ProjectOverviewTab.tsx` | 3e sidebar, lib and api done | #14: both inner keys and their six-line comment are gone. `ProjectOverviewTab`'s header says the remount on a project switch comes from `App.tsx` keying the whole page | Coder |
| Comments and headers in the sidebar, `lib/` and `api/`; `types.ts`, `BoardToolbar.tsx`, `ConfirmDeleteInline.tsx`, `SortableProjectRow.tsx`, `hierarchyPlacement.ts`, `hierarchyPlacement.test.ts` | 3e sidebar, lib and api done | #13, each written beside its final code | Coder |
| `client/src/test/projectFixture.ts` (new), `client/src/lib/positionedWrite.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts`, `useProjectDragReorder.test.ts` | 3f client tests done | #38: `makeProject`, shaped like `makeItem`; the three local `Project` factories are gone | Coder |
| `client/src/test/popFixtures.ts`, `client/src/components/workflow/popSession.test.ts`, `placement.test.ts` | 3f client tests done | #38: `threeColumnBoard` also builds column A's Cards P and Q and P's Descendants section, with the points in and above the section, so the five copies of that layer are one. #15: `POP_TEST_TUNING` pins the distance term and the three zoom delays as well as the two it pinned, and both suites say they read their waits from it | Coder |
| `client/src/test/dragFixtures.ts`, `client/src/components/workflow/dragStructure.test.ts`, `dragRegions.test.ts`, `dragCollision.test.ts`, `dragRequest.test.ts` | 3f client tests done | #38: `regionEl` and `mockRect` in the fixtures replace the DOM-building helpers in the two region test files; `dragCollision.test.ts` builds its rects with `rect()`; `dragRequest.test.ts` calls `freeOrigin` and `stubOrigin` where it shadowed them. #15: the fixture file's header and comments | Coder |
| `client/src/components/workflow/itemWriteReconciliation.test.ts`, `itemListOps.test.ts`, `dragClassification.test.ts`; `client/src/components/sidebar/useProjectDragReorder.test.ts`; `client/src/test/itemFixture.ts`; `client/src/components/BandGuides.test.tsx` | 3f client tests done | #38: the wiki's worked example is hoisted once in `itemWriteReconciliation.test.ts`. #15: case IDs at the start of titles, the cross-reference comments deleted, the smaller comment fixes | Coder |
| `server/tests/fixtures.ts`, `lib/positionResolver.test.ts`, `lib/itemTree.test.ts`, `lib/workflowItems.test.ts`, `routes/projects.test.ts`, `routes/workflows.test.ts` | 3f server tests done | #39: `setItemParent` and `setProjectParent` are the direct parent writes, and `positionResolver.test.ts` imports `setItemPosition` and `setProjectPosition` instead of copying them. The hand-rolled board lookups call `boardsOf` | Coder |
| `server/tests/fixtures.ts`; `routes/boards.test.ts`, `columns.test.ts`, `workphases.test.ts`, `items.test.ts`, `items.positioning.test.ts`, `items.attached.test.ts` | 3f server tests done | #39: `workflowWithPhases(phases, projectOverrides?)` returns the project, its workflow, the default board and the phases in order. 48 setups use it; the `setupTwoPhases` and `setupTodoAndInProgress` wrappers it makes redundant are gone | Coder |
| `server/tests/routes/items.test.ts` (split), `items.positioning.test.ts` (new), `items.attached.test.ts` (new) | 3f server tests done | #39: item CRUD stays; position resolution and attached children move out, each with the helpers it carried | Coder |
| `server/tests/routes/items.hierarchy.test.ts` (split), `items.crossProject.test.ts` (new), `items.workphase.test.ts` (new), `server/tests/itemHierarchyFixtures.ts` (new) | 3f server tests done | #39: the cross-project and cross-workflow block and the workphase-rule block move out. The helpers all three files use are written once, in `itemHierarchyFixtures.ts` | Coder |
| `server/tests/lib/columnRanges.test.ts` (new), `server/tests/routes/columns.test.ts` | 3f server tests done | #39: the eight tests of `lib/columnRanges.ts` leave the routes layer | Coder |
| Comments and titles across `server/tests/` | 3f server tests done | #16, each written beside its final code | Coder |
| `tests/helpers/seed.ts` | 3g done | #40: every call that returns a body asserts its status through `checkedJson`, so `seedTemplatedWorkflow`, `seedBareWorkflow`, `addWorkphases`, `fetchItem`, `fetchDefaultBoard`, `fetchProject` and `fetchProjectDepthCap` now check theirs. New: `seedProject`, `seedWorkflow`, `seedColumn` (on a workflow's default board) and `moveItem`. #50: `seedPositionedItems` creates every item, then pins each, and `seedProjects` throws when a parent isn't seeded before its child. #17: the comment above `seedItem`, and `SeededColumn` and `SeededBoard` carry the fields their callers read | Coder |
| `tests/pages/ProjectSidebarPage.ts`, `tests/helpers/boardLocators.ts`, `tests/helpers/projectTreeDrag.ts`; `client/src/components/ItemDetailPanel.tsx` | 3g done | #40: `openBoard` is `goto` then `showBoard`, which is `select` then `openBoardTab`; `projectNames(...)` is the sidebar's rows in render order; `itemPanel(page)` finds the detail panel by its role; `watchWrites(page)` records every non-GET request. The panel is the one production change: `role="complementary"` and `aria-label="Item details"` | Coder |
| `tests/helpers/itemRepositioningScenario.ts`; `tests/api/attachedChildren.spec.ts`, `itemRepositioningCrossColumn.spec.ts`, `itemRepositioningCrossProject.spec.ts`, `itemRepositioningAttachedSiblings.spec.ts` | 3g done | #40: the three scenario builders call `seedBareWorkflow`, `addWorkphases`, `seedProjects`, `seedWorkflow` and `seedItem`; the API specs call `seedItem`, `fetchItem` and `moveItem`, and the three local move wrappers and their `getItem`s are gone. #17: the pinning comment, and `position` typed `number \| null` | Coder |
| `tests/ui/attached-children.spec.ts`, `boards-layer.spec.ts`, `item-positioning.spec.ts`, `item-repositioning-cross-column-dnd.spec.ts`, `item-repositioning-cross-project-dnd.spec.ts`, `drag-column-bands.spec.ts`, `drag-5-stub-detach.spec.ts`, `drag-card-zoom-in.spec.ts`, `drag-target-classification.spec.ts`, `project-page.spec.ts` | 3g done | #40: 42 inline board openers are `openBoard`; the 18 `/test/reset` posts are `resetAndSeedDb`; the hand-rolled creates, reads and moves in these files call the checked helpers; the 9 board-lookup-and-POST column sites call `seedColumn`; the detail panel is `itemPanel`. #17: the zoom-in waits cover the dwell as well as the cue, and the comment fixes | Coder |
| `tests/ui/boards.spec.ts` (split), `workflow-inheritance.spec.ts` (new), `workflow-creation.spec.ts` (new) | 3g done | #41: board basics stay; workflow inheritance (three describes) and workflow creation move out, each with the setup it carried. #17: the two comments on what `App.tsx` loads and refreshes | Coder |
| `tests/ui/project-tree-drag.spec.ts`, `project-tree-sidebar.spec.ts` | 3g done | #40: `watchWrites` replaces four pasted recorders, and `projectNames` the eight hand-built order regexes. #50: TREE-1.1 polls for the saved parent before it reads the position | Coder |
| `tests/helpers/dragGesture.ts` and the comments across `tests/` | 3g done | #17, each written beside its final code | Coder |
| `client/src/test/reindexFixtures.ts` (new), `client/src/lib/positionedWrite.test.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts` | 3g done | #31's merge: the six `applyWriteResponse` tests over items move to `positionedWrite.test.ts`, beside the two over projects. The wiki's worked example is `reindexFixtures.ts`, which `itemWriteReconciliation.test.ts`'s `completeItemWrite` tests also read | Coder |
| `client/src/components/workflow/dragStructure.test.ts` | 3g done | A case that `measureRegions` keeps every field of an element's rect when `getBoundingClientRect` returns a getter-only DOMRect | Coder |
| `scripts/check-docs/extract.mts`, `extract.test.mts` | 3g done | `parseMarker` strips `*/` only, the one closing a caller can pass; its test uses a block-comment fixture | Coder |
| `scripts/check-docs/extract.mts`, `files.mts`, `check.mts` | 3h done | `extractBruno` reads a `.bru` file's `docs` block as Markdown and blanks every other line, so a finding keeps the file's line and column. `files.mts` has `BRUNO_DIR` and `isBruno`, `bruno/` is in the default scope, and a request is checkable and not code. `checkFile` picks the reader | Coder |
| `scripts/check-docs/extract.test.mts`, `check.test.mts`, `files.test.mts` | 3h done | Eleven tests: `extractBruno` (six), a request through `checkFile` (three), and the classifiers (two) | Coder |
| `server/tests/routes/items.hierarchy.test.ts`, `items.workphase.test.ts`, `items.test.ts`, `items.crossProject.test.ts` | 4a done | The Coder's step after the run, item-attachment: ATT-4.11's accepted top-level write runs by PUT as well as by move; ATT-9.12 and ATT-10.4 take their IDs and the writes they lacked; ATT-5.12 and ATT-11.1 take theirs, and ATT-11.1 is the case's own tree, deleted from `P` and from `A` | Coder |
| `server/tests/routes/items.positioning.test.ts`, `items.attached.test.ts`, `items.hierarchy.test.ts`; `tests/api/itemRepositioningCrossColumn.spec.ts` | 4a done | The item-positioning cases whose tests couldn't fail: TC-2.23 on the re-attach test in `items.hierarchy.test.ts`, with a sibling added to its own test; TC-2.25 pins the child off the values a re-placement would give; TC-5.1 and TC-5.4 create In Progress's item first and add a Todo item past it; TC-2.4 on the `A after C` test, with `C` at `3.4`; TC-2.9 on the cross-column spec's 3.b | Coder |
| `server/tests/fixtures.ts`, `server/tests/routes/columns.test.ts` | 4b done | `setColumnEnds`, the direct write of a column's start or end, with foreign keys off for the write. BCU-2.9 is a describe of two route tests over it: a column with an end outside the workflow, in the three ways the case names, and the edit that fixes it. BCU-2.8's test takes the case's title. BCU-2.3's test drops its `position` assertion, which is a test of its own | Coder |
| `server/tests/routes/boards.test.ts`, `projects.test.ts` | 4b done | BCU-1.2 compares the board with a read taken before the refused delete. TREE-3.9's refused create matches the cap's message, and `pastCap` is a module constant. TREE-9.1 compares Q's project, workflow, board and item with a read taken before the delete | Coder |
| `client/src/components/workflow/itemWriteReconciliation.test.ts`, `itemListOps.test.ts`, `dragRequest.test.ts`, `popSession.test.ts` | 4c done | The IDs Nathan ruled on for tests that already passed: DRAG-6.1 (with an assertion of the list while the write is pending), DRAG-6.2, DRAG-6.9, DRAG-4.12 (two tests), DRAG-6.11 (with an assertion that the item stays last once stamped) and DRAG-3.11; and the request halves of DRAG-1.24, DRAG-3.23, DRAG-3.24 and DRAG-6.7 | Coder |
| `client/src/components/workflow/dragClassification.test.ts`, `dragBands.test.ts`, `popSession.test.ts` | 4c done | The internal tests Nathan approved: DRAG-2.9, DRAG-3.5 (the two `bandFor` tests, and a new `reservationFor` test) and DRAG-1.14 (a new test that a distance of 0 pops nothing before the clock) | Coder |
| `client/src/components/sidebar/useProjectDragReorder.test.ts` | 4c done | "marks nothing invalid while the cap is unknown" leaves TREE-1.11's describe for one of its own | Coder |
| `tests/ui/attached-children.spec.ts`, `tests/ui/drag-column-bands.spec.ts` | 4d done | Two E2E tests: ATT-11.2 (a new describe, "deleting a Card"), the board's half of deleting an item's subtree; and DRAG-6.6, beside DRAG-6.1 and DRAG-6.5, the board's half of a refused drop | Coder |
| `server/src/routes/items.ts`, `server/tests/routes/items.test.ts` | 4e done | `PUT /items/:id` answers 400 for an `agentId` that names no agent, before anything is written, as `POST` does. Its route test carries no case ID | Coder |
| `server/src/routes/items.ts`, `server/tests/routes/items.test.ts`, `server/tests/lib/positionResolver.test.ts` | 4f done | `PUT /items/:id` refuses `agentId: ''` with the 400 an agent that doesn't exist gets, and its route test covers both. `positionResolver.test.ts`'s no-position test throws for that reason now, where it threw on a scope miss | Coder |
| `client/src/components/workflow/useBoardDnd.ts`, `useColumnManagement.ts`, `useColumnManagement.test.ts`, `useBoardDnd.test.ts` (new) | 6a done | #1: `onColumnDrop` takes a `resync` callback and calls it when the save fails, and `handleDragEnd` passes `resyncBoard`, so a failed reorder landing mid-drag ends that drag before the reload. #5: the test restores its `console.error` spy. `useBoardDnd.test.ts` is the hook's first test file | Coder |
| `scripts/check-docs/files.mts`, `rules.mts`, `files.test.mts`, `check.test.mts`, `repoIndex.test.mts` | 6f done | #2: `WIKI_PAGE_PATH`'s page segment has no dot, so the wiki's own `README.md` is no page, and `sectionRefs` reads a `#…` link target as the file's own page, which checks a section after a same-page anchor. Tests: `wikiPageAt('docs/wiki/README.md')`, a section after a link to the wiki index, and the same-page anchor with a section the page has and one it lacks. #23: `isSuiteFile`'s test moves to `files.test.mts`, and `check.test.mts` builds its marker with `IGNORE_MD` | Coder |
| `scripts/audit-scope/` (new), `package.json` | 6f done | The scope script, `npm run audit:scope`: `main.mts` (the command line), `scan.mts` (a range, file by file), `blame.mts`, `diff.mts` and `git.mts` (git's output), `moves.mts` (which traced lines count as moved), `lineKinds.mts` (blank, comment, title, import and code lines, from `check-docs/extract.mts::extractCode` and the same TypeScript parse), `classify.mts` (the sort table and the read-whole mark), `config.mts` (the area groups, the instances and the files marked by judgment), `scopes.mts` (the scope files). Nine test files, 75 tests, among them one that builds a throwaway repository with a range's worth of history | Coder |
| `tests/ui/workflow-inheritance.spec.ts`, `workflow-creation.spec.ts`, `boards.spec.ts`, `project-page.spec.ts` | 6e done | #21: every project, workflow and item the specs create goes through `seedProject`, `seedProjects`, `seedWorkflow`, `seedTemplatedWorkflow`, `pickWorkphases` and `seedItem`, so a refused create fails at its own line; the template lookup written six times is gone, and `workflow-inheritance.spec.ts` keeps the child item's id instead of looking it up. `workflow-inheritance.spec.ts` and `workflow-creation.spec.ts` find a column with `column` and a card with `article`. `project-page.spec.ts` converts every create in the file, not only its `beforeAll`. The test that could pass without its subject now looks for the item on its own board first | Coder |
| `tests/ui/attached-children.spec.ts`, `item-positioning.spec.ts`; `tests/helpers/itemRepositioningScenario.ts` | 6e done | #21: ATT-11.2 finds its cards with `article`; TC-2.11/TC-5a.1 creates and pins its two items with `seedPositionedItems`; `siblingOrder` reads through `fetchItem`. No title changed | Coder |
| `tests/helpers/dragGesture.ts`, `tests/ui/drag-5-stub-detach.spec.ts` | 6e done | Comments only. #11: `topQuarter` no longer says when `resolveDropSide` reads a side, and states its assumption instead (the dragged item is in the hovered row's list); the spec's two reflow comments state the reflow instead of pointing at a `dragTo` comment | Coder |
| `client/src/lib/hierarchy.ts`, `hierarchy.test.ts`; `client/src/components/sidebar/projectTreeUtils.ts`, `useProjectDragReorder.ts`; `client/src/components/workflow/dragClassification.ts` | 6d done | #13: `getSubtree(id, nodes)` returns `descendantIds`, `subtreeIds` and `height` from one walk, and both depth-cap callers use it; `getDescendantLevels` and `getSubtreeHeight` are gone, and `getDescendantIds` reads it. #14: `sortedChildrenByParent` keys a missing parent as a root; `buildParentOptions` and the sidebar use it, and `projectTreeUtils.ts`'s copy is deleted. `hierarchy.test.ts`: the height cases move to a `getSubtree` describe with two new cases for its sets, and `sortedChildrenByParent` gets three | Coder |
| `client/src/components/workflow/popSession.test.ts`, `dragTuning.ts` | 6d done | #20: the DRAG-1.7/DRAG-1.8 case calls `step`. #9: DRAG-1.30's and DRAG-1.3/DRAG-1.30's titles say `popDelayMs`, and the `THRESHOLD` alias leaves `DragTuning`'s comment | Coder |
| `client/src/components/KanbanCard.tsx`, `BoardColumn.tsx`, `dragChrome.tsx`, `ItemDetailPanel.tsx`, `workflow/dragRegions.ts`, `workflow/itemWriteReconciliation.ts`, `test/itemFixture.ts`, `sidebar/projectTreeUtils.test.ts` | 6d done | Comments only. #7: `KanbanCard.tsx`'s `.pop` sentence is gone; `dragRegions.ts` names `descendantsCardIdOf`'s real callers and `dragStructure.ts::clipToVisible`; `itemWriteReconciliation.ts` names the sort it reads; `BoardColumn.tsx` says "item drag"; `dragChrome.tsx` says "neither a component nor a constant". #8: `handleItemUpdated` names `ParentSection`. #9: `itemFixture.ts` names the three `'none'` cases, and `projectTreeUtils.test.ts` says what `soloItems` makes true | Coder |
| `server/tests/routes/items.attached.test.ts`, `items.crossProject.test.ts`, `items.hierarchy.test.ts`, `items.positioning.test.ts`, `items.workphase.test.ts` | 6c (2 of 2) done | #17: ten tests move to the file whose subject they are, each with its title and case ID, and headers and describes say what the files now hold. `items.workphase.test.ts`'s describe is "the workphase a write gives an item" | Coder |
| `server/tests/fixtures.ts`, `server/tests/lib/itemTree.test.ts`, `server/tests/lib/positionResolver.test.ts`, `server/tests/routes/boards.test.ts`, `server/tests/routes/items.positioning.test.ts` | 6c (2 of 2) done | Comments and one title: #10, #41, #42. `BoardBody` and `ResolvedColumn` drop the two fields no test reads | Coder |
| `server/tests/fixtures.ts`, `server/tests/itemHierarchyFixtures.ts` | 6c (1 of 2) done | #4: the `create*` helpers assert their status. #16: `getRow`, `move`, `put`, `countItems` and `setupWorkflow` move into `fixtures.ts`; `itemHierarchyFixtures.ts` keeps `hierarchyEntries` and `cardWithTwoStubs`. #37: `createAgent`, `createItemType` and `setItemWorkphase`. A board's items carry `positionScope` in `BoardBody` | Coder |
| `server/tests/routes/boards.test.ts`, `items.attached.test.ts`, `items.crossProject.test.ts`, `items.hierarchy.test.ts`, `items.positioning.test.ts`, `items.test.ts`, `items.workphase.test.ts`, `testHelpers.test.ts`, `workflows.test.ts`, `workphases.test.ts` | 6c (1 of 2) done | Every site points at the shared helpers (#16, #37). #4: TC-1.1 drops its refused `createColumn`, and `createChain` its by-hand status check. No title changed, and no test moved | Coder |
| `server/src/routes/items.ts`, `server/tests/routes/items.test.ts`, `bruno/items/create-item.bru`, `bruno/items/update-item.bru` | 6b done | `POST /items` refuses `parentId: ''` and `agentId: ''` with the 400 a missing row gets, where it stored each as none (#29). #38: the comment on the type and agent checks. The two Bruno `docs` blocks state the rule | Coder |
| `server/src/routes/projects.ts`, `server/tests/routes/projects.test.ts` | 6b done | #15: the move's own `parentId` type check is gone, and a test pins the one `parentError` makes. #6: the DELETE comment | Coder |
| `server/src/routes/workflows.ts`, `server/src/lib/workflowItems.ts`, `server/src/lib/positionResolver.ts`, `server/src/db/runMigrations.ts` | 6b done | Comments only. #6: `effectiveWorkflowIdForProject`'s callers, the workflow DELETE comment, `anchorRefusal`'s contract moved from its type to the function, and the backfill's header and section comment. #39: which items get a `positionScope` | Coder |
| `client/src/components/workflow/CLAUDE.md` | 3b done, 3e drag layer done, 3f client tests done, 6a done, 6d done | 3b: the done list is the exception to the shuffle it describes. 3e: #11, and its file list after #36 and #37. 3f: the testing conventions name `regionEl` and what the shared pop board and tuning hold. 6a: the column drop is handed `resyncBoard`, and the conventions name `useBoardDnd.test.ts`. 6d (#7): `dragStructure.ts`'s structure is resolved at pickup and again after a layer change or a remount, not once per drag | Coder |
| Root `CLAUDE.md` | 3, after 3d and 3e | The report's route to the Architect, and the names 3d and 3e move | Architect |
| `.claude/guides/testing-strategy.md`, `prettier-preemptive-practice.md`, `code-comments.md`, `documentation-standards.md`, `drizzle-sqlite-patterns.md` | 3 | The report's routes to the Architect | Architect |
| `.claude/guides/testing-strategy.md` | 6, after 6c, done | The Server routes row names the item-route helpers, the `create*` helpers' status check and `itemHierarchyFixtures.ts`; the direct-write line adds `setItemWorkphase` and `setItemParent`'s attachment flag | Architect |
| `.claude/personas/coder.md` | 3, after 3d | `createDefaultBoard`'s new home (#24) | Architect |
| `scripts/check-docs/` | 3h | Reads a `.bru` file's `docs` block | Coder |
| `scripts/` (the scope script, new) | 6 | Builds an audit's scope files (Batch 6) | Coder |
| `.claude/guides/audit-workflow.md`, `.claude/personas/auditor.md`, the four `.claude/agents/auditor-*.md` | 6, after the script | §2's build rules give way to a pointer to the script; moved, unchanged code leaves the audit | Architect |
| `.claude/guides/documentation-standards.md` | 3, after 3h, done | The `bruno/` row stops saying the checker doesn't read `.bru` files, and "What the checker checks" names Bruno's `docs` blocks among what it reads | Architect |
| The memory directory (outside the repo) | 4, done | D1's pointers | Architect |

## Acceptance

- **The guide holds the rules.** Every rule in D1 is in `audit-workflow.md`, and the three audit memories point to it rather than restating it.
- **Instructions use the template.** The audit files name story-plan sections (D2, D4), and none of them describes a ledger of its own.
- **Clean check.** `npm run check:docs -- .claude` reports zero hits.
- **The first run and the re-run:**
  - each report opens with its range line;
  - every required finding has a disposition;
  - every route is recorded as landed in a named plan section;
  - both reports are in `docs/archive/` and haven't been edited since.
- **Tags.** `epic-3-5-story-6-audited`, `a6-audited` and `a6-rerun-audited` all exist, so Story 7's base is mechanical.

## Handoff

- **To Story 7's plan (whoever writes it):** the run's deferrals, as Inbound deferrals. If the plan isn't written yet, they go into Story 7's roadmap entry (D6).
- **To Story 7's audit (Auditor):**
  - its base is `a6-audited`;
  - it's the first audit of a story's own diff under the finished rules. Its report notes whether anything in D1–D9 still needs changing.
- **To Epic 3.5's close:** D9's epic-wide pass.

## Open questions

- **For Nathan:** A5a and A5d each planned to close by the full checklist, audit included, and both signed off without an audit report. D10 assumes the first run is their audit. Is that right, or was one of them meant to have an audit of its own? And is folding a story's audit into a later run a practice you want? If it is, `story-done-checklist.md`'s "Before sign-off" should say so, since it requires the story's audit to be closed. (From the Auditor's batch 1 drafts.)
  - **Answered 2026-10-06 (Nathan):** the first run covers everything since `epic-3-5-story-6-audited`, so it's A5a's and A5d's audit. That answers this run only. The checklist stays as it is, so a story's audit still closes before its sign-off.

*From the first run's report, `docs/audits/code-quality-audit-a6.md` (2026-10-07). Numbers are the report's.*

- **For the PO:**
  - *Moved 2026-10-22 to `positioning-on-create-and-edit.md`'s Inbound deferrals, at Nathan's direction:* whether a workphase write discloses its reindex; "or none" in item-attachment §2a; and a project move naming both `prevId` and `nextId`. That story's answers change theirs.
  - **A behavior the wiki doesn't state,** which the report's drift fixes describe: a column whose start or end workphase is missing counts as broken (boards-columns-unsorted §9).
    - **Answered 2026-10-22 (Nathan):** §9 states it, as the PO recommended. Such a column is broken; it covers no workphases, so they're in `uncovered` unless another column covers them (§10); and it takes no drop until an edit fixes it.
    - **For the Architect, before the PO writes it:**
      - What does a board read say such a column covers: nothing, or the end that's left?
      - Does "missing" mean only an end that doesn't exist, or also one that belongs to another workflow?
      - Can anything besides a direct database edit make one, such as a foreign-key action when a workphase row is deleted?
      - Does the board refuse a drop into such a column, as it does into one whose start comes after its end? Added 2026-10-22 (PO): under Nathan's answer below, deduction a's "takes no drop" holds only if the code agrees.

      If the read covers something other than nothing, it goes back to Nathan: fix the code, or take what it does as the rule. **Answered 2026-10-22 (Nathan), ahead of the facts:** what the code does is the rule, whatever the read says. The Epic 8+ rework of columns (`epic-8-decisions.md`, "A board out of step with its workflow") revisits it, and the board is fine as it is until then. No code changes, so the facts decide only what the PO writes into §9.
      - **Answered 2026-10-22 (Architect),** from the code:
        - **A read says it covers nothing.** `columnRanges.ts::computeColumnRange` finds no range when either end is outside the workflow's order, so `getCoveredWorkphases` returns none. `GET /api/boards/:id` gives the column `broken: true` and no `subRows`, and names it "(empty range)" when it has no name of its own. `computeUnsorted` counts it as covering nothing, so its workphases are in `uncovered` unless another column covers them. That's Nathan's ruling, so nothing goes back to him.
        - **"Missing" means both.** The order a board reads is its own workflow's workphases (`workphaseOrder.ts::getOrderedWorkphases`), so an end in another workflow is missing, just as one that doesn't exist is.
        - **Nothing in the app makes one.**
          - Both ends are foreign keys to `workphases` with no ON DELETE action, and foreign keys are on, so SQLite refuses to delete a workphase a column names.
          - `DELETE /api/workphases/:id` first shrinks each column that covers the workphase, or deletes the column if it covered only that one (§8).
          - A workflow's delete removes its boards and columns before its workphases (`workflowCascade.ts::deleteWorkflowsById`).
          - A column write refuses an end outside the board's workflow (§5), and no write moves a workphase or a board to another workflow.

          So it takes a direct database edit, and §9's "Through the API, only a workphase reorder makes one" stays true. The test reset turns foreign keys off only while it empties every table.
        - **The board refuses a drop into it, as into any broken column.** The client reads `broken`, not why. A broken column registers no drag region (`BoardColumn.tsx`, `dragStructure.ts::cardListStructure`), so no drag enters it and a release over it writes nothing (wiki board-drag-interaction §4). Deduction a holds.
        - **One write besides a drop, for the PO:** its "+ Add item" form still shows, as an inverted column's does. It creates in the column's `entryWorkphaseId`, which falls back to the stored start when the column covers nothing. The API accepts that when the start is the workflow's, and the new item sits in `uncovered` unless another column covers it. It refuses a start that isn't (wiki item-attachment §2a). Whether §9 says anything about the form is yours.
    - **Written 2026-10-22 (PO),** from the Architect's facts. Wiki boards-columns-unsorted:
      - **§9:** a column is broken when its start comes after its end, or when an end isn't one of the workflow's workphases, one that doesn't exist or one of another workflow's. Only a direct database edit makes the second kind. Every broken column takes no drop. A column whose start comes after its end covers the workphases between its ends, as before; one with an end outside the workflow covers none, shows no items, and leaves its workphases in `uncovered` unless another column covers them. Each kind has an example.
      - **§4:** a column with no name of its own that covers none is named "(empty range)".
      - **§10:** the list of what puts a workphase in `uncovered` gains a column with an end outside the workflow.
      - **Open questions, "A board out of step with its workflow":** "Only a column whose start comes after its end is flagged" now reads "Of what a reorder leaves, …", since a column with an end outside the workflow is flagged too.
      - **The "+ Add item" form:** not on the page. No page states the form for any column, and what its create does follows rules already stated: an item in a workphase no column covers is in `uncovered` (§10), and a workphase outside the workflow is refused (item-attachment §2a).
    - **For the Test Planner:**
      - **BCU-2.8's title,** "A broken column still covers the workphases between its two ends", now holds only for a column whose start comes after its end. Its text and test are unchanged.
        - **Done 2026-10-22 (Test Planner):** it's "A column whose start comes after its end still covers the workphases between its two ends". Its text and status are unchanged.
      - **§9's new rules have no cases:** a column with an end outside the workflow is broken, covers none and leaves its workphases in `uncovered`; every broken column takes no drop; and §4's "(empty range)".
        - **Done 2026-10-22 (Test Planner):** BCU-2.9, `Open`, covers the new kind: a start or end at another workflow's workphase, or an end that names none, flags the column `broken`, it covers and shows nothing, it's named "(empty range)", its workphases are in `uncovered`, and an edit to a passing range fixes it. "Takes no drop" needs no new case: DRAG-1.9 and DRAG-2.8 already say a broken column is nowhere, whichever kind it is, and BCU-2.9 links them.
- **For the Architect:**
  - **Root `CLAUDE.md`:** "One position math layer" lists `itemPositionScope.ts` as table-generic, and it's items-only. The `/api/test` row omits the project pins (position, created-at, parent). The gates line says unit tests run across `client/`, `server/` and `tests/`; they run across `client/`, `server/` and `scripts/`, and lint runs `check:docs`.
  - **`testing-strategy.md`:** "both Vitest suites" (there are three, one on `node:test`), and no row in the layers table for `scripts/**/*.test.mts`.
  - **`prettier-preemptive-practice.md:3`:** the root config now covers `scripts/` and the root files too.
  - **The checker's rule tables:** `code-comments.md`'s and `documentation-standards.md`'s both omit `wiki-code-name`.
  - **`drizzle-sqlite-patterns.md`, "Self-Referential FK Caveat":** `projects.parentId` is a real FK now; only `items.parentId` is soft.
  - **`.claude/personas/coder.md:60`** names `createDefaultBoard`'s home, which report #24 moves to `lib/`.
  - **Done 2026-10-22 (Architect),** all six. The FK caveat also lost its premise, that Drizzle can't declare a self-reference: it now says how the two columns differ.
- **For the Test Reconciler, on its next run:**
  - **Tests that may not prove their case:** `server/tests/lib/positionResolver.test.ts:223–232` (TC-2.8 throws for the wrong reason) and `:167–182` (TC-2.9's positions follow creation order); `routes/items.hierarchy.test.ts:1179–1187` (asserts half its title); `routes/workflows.test.ts:86` (no foreign row); `itemWriteReconciliation.test.ts` (no `'first'`/`'last'` marker case); `dragRegions.test.ts:111–113` (no case exercises the DOMRect getter hazard); `scripts/check-docs/extract.test.mts:87–92` (its fixture has no `-->`).
  - **Case IDs only in comments:** `dragBands.test.ts:5` (DRAG-3.5), `dragClassification.test.ts:7` (DRAG-2.10), `itemListOps.test.ts:300–301`, `itemWriteReconciliation.test.ts:16–17, 108`, `popSession.test.ts:216` (DRAG-1.21) and `:281` (DRAG-1.17), `server/tests/routes/items.test.ts:708` (probably TC-2.4).
  - **Tests whose IDs the plan's Automation lines don't list:** the sidebar hook's TREE-1.4, 1.8, 1.9 and 1.11 tests; `hierarchyPlacement.test.ts`'s TREE-1.3/1.4 null-root tests and DRAG-4.8 exclusion test (check they prove those cases); E2E titles carrying DRAG-5.1, 5.9, 5.10, 5.11, 5.13, DRAG-1.1, 1.5, 1.9, 1.12, 1.14, 1.24, DRAG-3.17 and TREE-3.9, while the plan shows them `Open`; TC-7.18 in both a lib and a route test; ATT-4.10's cases in both `items.test.ts:1364–1402` and `items.hierarchy.test.ts`.
  - **One function tested under two names:** `itemWriteReconciliation.test.ts:18–76` and `positionedWrite.test.ts` (report #31 merges them).
- **For the Test Planner:**
  - TC-2.4's Automation line omits `tests/api/itemRepositioningAttachedSiblings.spec.ts`, whose header says it runs TC-2.4; its titles at `:58, 70, 89` omit TC-2.4 and TC-3.1.
    - **Re-addressed 2026-10-22 (Test Planner)** to the Test Reconciler's run (the Test Planner's section, below). The Automation line is the Reconciler's to keep, and the IDs in a test's title are the Coder's to add, as the run proposes.
  - Report #4's fix starts with a throwaway probe of DRAG-3.24's scenario. DRAG-3.24's permanent test stays with Story 10, where it's routed.
    - **Answered 2026-10-22 (Test Planner):** nothing changes. DRAG-3.24 stays `Open`, in Story 10's list in `epic-3-5-roadmap.md`.

*From the Coder, batch 3a (2026-10-21).*

- **For the Architect:** root `CLAUDE.md`'s "One hierarchy-write primitive" bullet names `itemTree.ts::assertWithinDepthCap` as how `POST /items` checks the cap. The create asks `itemTree.ts::parentRefusal` now, which checks that the parent exists and the cap in one call; `assertWithinDepthCap` is the formula beneath it, and it still exists. 3d's #19 rebuilds the same checks, so the bullet can be reworded once, after it. **Done 2026-10-22 (Architect),** with 3d's names.
- **For the Test Planner:**
  - *Moved 2026-10-22 to `positioning-on-create-and-edit.md`'s Inbound deferrals:* wiki item-positioning §2's third `"none"` case with no case among TC-2.13 to TC-2.17, and TC-3.4's setup. That story rewrites the scopes they test.
  - **ATT-4.11 names a root item as the shallower target.** wiki hierarchy-placement §6's "the top level included" isn't in its text. The test for the top level carries its ID, and runs it through both writes.
    - **Answered 2026-10-22 (Test Planner):** ATT-4.11 now also moves `M` to the top level, by either write. It's refused with `H` at `CAP` or more, and accepted with `H` at `CAP − 1`, where the deepest leaf lands at exactly `CAP`.

*From the Coder, batch 3b (2026-10-21).*

- **For the PO:**
  - **The blue line in a done list.** With #4 the rows hold still, but the line still names a neighbor as if the ghost had slid: with `X` carried over `D1` in `D1, X, D2`, it draws at `D1`'s top, where `X` isn't. wiki board-drag-interaction §2's rule 3 says the highlight and the release name the same card, and a done list's release names none. `epic-4-decisions.md` §12's zoom-in question uses that highlight to pick the Card, and the PO's recommendation there (zoom into the Card under the cursor) would settle what the line means, so it's left for that decision.
    - **Answered 2026-10-22 (Nathan):** it's decided with `epic-4-decisions.md` §12's zoom-in question, as the Coder and the PO recommended. The PO added it to §12's zoom-in bullet, to wiki board-drag-interaction §2's rule 6 (which Card the highlight names in a done list, and how it's drawn, isn't a rule yet), and to the page's Open question on zooming into a done-column Card.
    - **For the Test Planner:** DRAG-4.3's premise is a side highlight naming `P` in a done list, which rule 6 now leaves open. Whether the case stays as it is, is yours. In its scenario `P` is both beside the ghost and the last done Card, so the two readings agree there.
      - **Answered 2026-10-22 (Test Planner):** DRAG-4.3 no longer says what the highlight shows. The user holds the carried card over `P`, which is also the ghost's only neighbor, so the case holds however §12 settles which Card a done list zooms into. It stays `Open`, in Story 10's list.
  - **§10's pending marker.** It says the placement is the ghost during the drag and the pending marker after release. The marker is now that placement with a `'first'` or `'last'` slot spelled as the anchor the request carries (#5). Nothing the user sees differs; add a clause if the wiki should say it.
    - **Answered 2026-10-22 (Nathan):** no clause, as the PO recommended. §10 already says the placement is in the same terms as the request, and §5's top and bottom bands are "before the first item" and "after the last item". How the client holds the slot isn't a rule.
- **For the Test Planner:**
  - **DRAG-5.13's test says more than its text.** The case says a release at the Card layer sets the grandchild back down. The test also asserts its row, and its own children's rows, stay drawn there (#3). If the drawing belongs in the case, the ID is already on the test.
    - **Answered 2026-10-22 (Test Planner):** it belongs. The board previews where a release leaves an item (wiki board-drag-interaction §10), and this release leaves `S1a` where it was, so `P`'s section shows it in its own slot, with its child beneath it and no attach preview. DRAG-5.13 says so now, with `S1a`'s child in its *Given*, and cites §10.
  - **TC-2.28 and a band drop.** The case places `X` by an anchor under a narrow view. The new test is the same promise for a release in a top or bottom band, where the ghost's slot is `'first'` or `'last'` and the request carries an anchor. DRAG-6.1 says the board shows "the relation the request carries", first and last among them; for a band drop, the marker after release is the anchor.
    - **Answered 2026-10-22 (Test Planner):** the band drop is DRAG-6.1's. The board's placement is in the same terms as the request (§10), and a band's request names an anchor (wiki item-positioning §7.1). DRAG-6.1 gains a top-band and a bottom-band release: the placement is the anchor and side the request carries, not a bare first or last slot, and once the response is applied the order is the preview's, with no inversion recorded. TC-2.28 is unchanged. Which IDs the new test carries is the Reconciler's to propose.
  - **DRAG-3.24 stays `Open`, with no automated test.** The probe showed the report's trace, and #4's fix keeps the done list still. The permanent test is Story 10's.
    - **Answered 2026-10-22 (Test Planner):** nothing changes; it's in Story 10's list.
- **For the Test Reconciler:** the report's "`itemWriteReconciliation.test.ts` (no `'first'`/`'last'` marker case)" is answered by TC-2.28's new test. The same file's "case IDs only in comments" lines moved from `:16–17, 108` to `:18–19, 110`, two imports down.

*From the Coder, batch 3c (2026-10-21).*

- **For the Architect:** `bruno/` has no row in `documentation-standards.md`'s ownership table, and the checker doesn't read `.bru` files. The pointer and no-provenance rules hold in the request docs by hand: batch 3c fixed their pointers and cut `move-item.bru`'s hierarchy block, which restated about 30 lines of the wiki, and nothing keeps them that way. Whether the table names `bruno/`, and whether the checker reads a `.bru` file's `docs` block, is yours.
  - **Answered 2026-10-22 (Architect):** the table names `bruno/`. Whoever changes an endpoint owns its request and `docs` block, which follow the comment rules by hand. Whether the checker should read `docs` blocks is left to Nathan, as new checker code.
  - **Answered 2026-10-22 (Nathan):** yes, "the checker can verify the bruno files are up to date". It's batch 3h. **Done 2026-10-22 (Coder, batch 3h):** see Amendments.

*From the Coder, batch 3d (2026-10-21).*

- **For the Architect:**
  - **Root `CLAUDE.md` names three things 3d moved,** to reword now:
    - "One hierarchy-write primitive": `POST /items` checks a new item's parent and project at the route (`itemTree.ts::parentRefusal`: the parent exists and the cap holds; the project is the parent's), and takes its attachment flag and workphase from `itemHierarchy.ts::resolveCreate`. `resolveCreateWorkphase` and `foreignWorkphaseError`, the two names the bullet gives, are private now.
    - "Reindex disclosure": `positionResolver.ts::withReindexDisclosure` builds it. `routes/items.ts::respondWithItem` and `routes/projects.ts::projectResponse` still exist and call it.
    - "DB owns referential integrity": the workflow-delete chain is `workflowCascade.ts::deleteWorkflowsById`, and the project cascade is `projectCascade.ts::deleteProjectById`, beside `boardCascade.ts`.
  - **`.claude/personas/coder.md:60`** names `routes/boards.ts::createDefaultBoard`, which is `lib/defaultBoard.ts::createDefaultBoard` now. Until it's reworded, `npm run check:docs` reports that one `symbol-ref` hit, and `npm run check` fails at its lint step.
  - **Done 2026-10-22 (Architect),** both. `npm run check` passes again.
- **For the PO:** *moved 2026-10-22 to `positioning-on-create-and-edit.md`'s Inbound deferrals:* what a create refuses first, and an anchor with two faults. A create that takes an anchor, and a second scope, change both answers.
- **For the Test Planner:**
  - **A create that names a row that doesn't exist** (a project, a type, an agent, a workphase) has no case in wiki item-attachment §14, though it's a 400 now. The two tests have no ID: `items.test.ts`'s for a `projectId`, `type` or `agentId`, and the existing one for a `workphaseId`.
    - **Answered 2026-10-22 (Nathan, on the PO's recommendation),** after the Test Planner asked for a sentence on the project. The wiki's convention holds: a write that names a row that doesn't exist is refused with a 400, and nothing changes, whether the field is required or optional. Leaving an optional field out is how a write says "none". Every page that covers a reference states it so: item-attachment §7's parent, project-tree §3's parent, positioning §2's neighbor, item-attachment §2a's workphase, and boards-columns-unsorted §5's column ends.
      - **The project:** wiki item-attachment §14 states it now. The Test Planner writes ATT-10.4.
      - **The type and the agent:** no case, as the Test Planner proposed. No page covers either field yet, and types are due to be replaced. A page that comes to cover them states the same rule.
    - **Done 2026-10-22 (Test Planner):** ATT-10.4, `Open`. Its test is the one this note names, which carries no ID yet.
  - **A create and a move refusing a missing workphase alike** is `items.hierarchy.test.ts`'s new test. It carries no ID, since no case states it.
    - **Answered 2026-10-22 (PO):** item-attachment §2a states it already. An Attached item may name only its parent's workphase, and a Free item only one its project's workflow uses, so a create or a move naming a workphase that doesn't exist is refused. A case can cite §2a.
    - **Done 2026-10-22 (Test Planner):** ATT-9.12, `Open`. It covers a top-level create, an attached and a detached child's create, and a move that leaves the item Free or Attached. It doesn't say the writes share one message, since §2a doesn't.
  - *Moved 2026-10-22 to `positioning-on-create-and-edit.md`'s Inbound deferrals:* TC-7.10 and an item that ends with no workphase. Under that story, a child with no workphase gains a sibling scope.
- **For Nathan:** where the fix for `PUT /items/:id`'s unchecked `agentId` goes, the gap this batch's notes left since #47 named only the create. Under the convention above, an edit naming an agent that doesn't exist is refused with a 400, and nothing changes. Today it's a 500.
  - **Answered 2026-10-23 (Nathan):** in A6's Coder step after the run (Batch 4). **Done 2026-10-23 (Coder, batch 4e):** see Amendments.

*From the Coder, batch 3e, the drag layer (2026-10-21).*

- **For Nathan:** report #9's last bullet asks whether `AttachGhostRow` stays apart from `AttachedChildRow`. The reason the code gave doesn't hold: dnd-kit's registry keeps one entry per id, the last registered, and the dragged item's own row is unmounted while it previews attaching, so there is no second registration to conflict. I rendered the preview through `AttachedChildRow` as an experiment, and all 35 drag and attach E2E specs in the four drag suites still passed. What does hold is that the two are different things: `AttachedChildRow` is a live participant in the drag (a sortable registration, a handle, a click target, `data-item-id`, drop chrome, and the dimmed look a dragged item's own row gets), and the preview must be none of those and is drawn dashed blue. A merge would need a mode that skips the registration, which a hook can't do conditionally, so it would split into a body and a wrapper again. I restated the reason at `StubRows.tsx::AttachGhostRow` and kept the two apart. Merging is a follow-up if you'd rather.
  - **Answered 2026-10-23 (Nathan):** they stay apart, with no follow-up.
  - **Answered 2026-10-23 (Nathan):** they stay apart, as the Coder and the Architect recommended, with no follow-up.
- **For the Test Reconciler:** #37 moved the DOM half of `dragRegions.test.ts` to `dragStructure.test.ts`, so the Automation lines naming `dragRegions.test.ts` are stale for DRAG-1.7, DRAG-1.8, DRAG-1.10 and DRAG-1.25. The cases keep their IDs at the start of their titles. #15's first bullet, `dragRegions.test.ts:59–63`, is done with the move.

*From the Coder, batch 3e, the sidebar, `lib/` and `api/` (2026-10-21).*

- **For Nathan:**
  - **Should `Item.positionScope` be required?** **Answered 2026-10-21 (Nathan):** it stays optional, as the code has it. #13's `types.ts` bullet says the field's "optional because hand-built fixtures may omit it" reason sits on the wrong declaration, and `makeItem` always sets it. That reason is false now, so I moved the sentence onto the field and replaced it with what holds: every API response carries it, and so does `makeItem`'s. I tried `positionScope: PositionScope` required, and the client typechecks, so nothing in the client builds an Item without it. I haven't traced every server route that returns an item, so I left the type as it was. Required would let the compiler guard `isStub`, which reads a missing field as a Free item.
  - **The project page's Parent dropdown changes order.** **Answered 2026-10-21 (Nathan):** the new order stands. #29 routes it through the shared walk, so siblings come in the sidebar's order (position, then creation) and follow a sidebar reorder at once. Before, they came in the order of `App`'s `projects` array, which a write never re-sorts. The audit found no rule constraining the page, which is a placeholder under wiki project-tree's Open questions.
- **For the Test Reconciler:**
  - **Two test files test one function.** #31 deleted `applyItemWriteResponse`, so `itemWriteReconciliation.test.ts`'s describe now calls `applyWriteResponse`, as `positionedWrite.test.ts` does. I renamed the describe, kept its cases and their TC-5a.1 and TC-5a.4 IDs, and left the merge to you, as the report routes it. **Done 2026-10-22 (Coder, with 3g, at Nathan's request):** the six item tests are in `positionedWrite.test.ts`, with no title or ID changed, and the worked example both files used is `client/src/test/reindexFixtures.ts`. There is nothing here to merge.
  - **Tests of the deleted wrappers.** `projectTreeUtils.test.ts`'s `getDescendantIds` and `eligibleRows` describes are gone, two tests each. `hierarchy.test.ts`'s `getDescendantIds` tests and `hierarchyPlacement.test.ts`'s `toRows` tests cover the same ground, including "keeps only the row fields". `isWithinDepthCap`'s test moved from `dragClassification.test.ts` to `hierarchy.test.ts`, with no ID in its title.
  - **A title changed.** `hierarchyPlacement.test.ts`'s DRAG-4.11 case "below the last item" says "depth 0, the root's children" where it said "the root's depth", since the root is never a row (#13).

*From the Coder, batch 3f (1 of 2), the client tests (2026-10-21).*

- **For the Test Reconciler:**
  - **IDs that moved in titles.** `dragClassification.test.ts`, `dragRequest.test.ts` and `dragRegions.test.ts` now start every title that names an ID with it, and the Stub-drag describe in `dragClassification.test.ts` carries DRAG-2.8. In `useProjectDragReorder.test.ts`, TREE-1.10 moved out of TREE-1.9's describe into one of its own, and TREE-1.11, which was in no title, now heads the cap describe. It covers that describe's three cases, including "marks nothing invalid while the cap is unknown".
  - **A title lost an ID that wasn't its case.** `dragRequest.test.ts`'s "a done region never anchors" named DRAG-3.9, which `placement.test.ts` covers; it names nothing now.
- **For the Architect:** root `CLAUDE.md` and `testing-strategy.md` say items come from `makeItem`. Projects have the same factory now, `client/src/test/projectFixture.ts::makeProject`, if you want the rule stated for both. **Done 2026-10-22 (Architect):** both state it.

*From the Coder, batch 3f (2 of 2), the server tests (2026-10-21).*

- **For the Test Reconciler:**
  - **Server test files moved and split,** so the Automation lines that name them are stale. No test was lost: the 399 server tests are the same 399 titles, apart from the retitles below.

    | Was | Now |
    |---|---|
    | `routes/items.test.ts` | `routes/items.test.ts` (CRUD), `routes/items.positioning.test.ts` (position resolution), `routes/items.attached.test.ts` (attached children) |
    | `routes/items.hierarchy.test.ts` | `routes/items.hierarchy.test.ts`, `routes/items.crossProject.test.ts` (cross-project reparenting, with its cross-workflow cases), `routes/items.workphase.test.ts` (ATT-9) |
    | the eight "pure range helpers" tests in `routes/columns.test.ts` | `lib/columnRanges.test.ts`, under "column range helpers" (no case ID) |

  - **IDs that moved to the start of a title:** ATT-4.4 and ATT-4.5 in `lib/itemTree.test.ts`, and ATT-5.1 in `items.attached.test.ts`, whose title now says it is the PUT entry point.
- **For the Architect:** `testing-strategy.md` names `setItemPosition` as the server tests' fixture for writing the database. The direct-write fixtures are now `setItemPosition`, `setProjectPosition`, `setItemParent` and `setProjectParent`, and `workflowWithPhases` builds a project, workflow, board and phases, all in `server/tests/fixtures.ts`. **Done 2026-10-22 (Architect):** `testing-strategy.md` names all five, and the E2E pins beside them.

*From the Coder, batch 3g, the E2E specs (2026-10-22).*

- **For the Test Reconciler:**
  - **`tests/ui/boards.spec.ts` split.** Board basics stay in it. The three inheritance describes ("items visibility with inherited workflow", "inherited workflow is read-only", "child project with own workflow") are in `workflow-inheritance.spec.ts`, and "workflow creation" is in `workflow-creation.spec.ts`. None of those titles carries a case ID and no Automation line names `boards.spec.ts`, so there is nothing to re-map. The 172 E2E tests keep their describe and title; 164 pass and 8 are the `test.skip`s that were there.
  - **Three items from the Reconciler's block are done here,** at Nathan's request, since none has a case to be judged against and the Reconciler can't edit tests: `extract.test.mts`'s fixture with no `-->`, the `toRect` case behind `dragRegions.test.ts:111–113`, and #31's merge. For the merge, TC-5a.1's and TC-5a.4's Automation lines name `itemWriteReconciliation.test.ts`; both IDs are now also in `lib/positionedWrite.test.ts`.
- **For the Architect:**
  - **`testing-strategy.md`'s E2E setup section names only `pinItemPosition`.** The conventions the specs now follow are `ProjectSidebarPage::openBoard` to open a board, `resetAndSeedDb` to reset, and the `tests/helpers/seed.ts` helpers to create, read and move, which assert their statuses. Root `CLAUDE.md`'s conventions list could carry one line for them, beside "never hand-roll a drag". **Done 2026-10-22 (Architect):** root `CLAUDE.md` carries the line, and `testing-strategy.md`'s Playwright UI row names the seed helpers.

*From the Test Planner (2026-10-22).*

- **For the Test Reconciler:**
  - **Six cases to map in full,** since their text changed after their tests were written: ATT-4.11, DRAG-4.3, DRAG-5.13 and DRAG-6.1, revised; ATT-9.12 and ATT-10.4, new and `Open`, whose tests batch 3d's notes name and which carry no ID yet.
  - **BCU-2.9, new and `Open`,** from the PO's §9, and **BCU-2.8,** retitled for a column whose start comes after its end. Whether a test already covers BCU-2.9 is yours to propose.
  - **TC-2.4 and `tests/api/itemRepositioningAttachedSiblings.spec.ts`,** the report's item for the Test Planner: whether the spec's titles at `:58, 70, 89` should carry TC-2.4 and TC-3.1, and the Automation line that follows.
  - **The report's line numbers predate batch 3d's and 3f's moves and splits** (the table in batch 3f's server-test note). `items.hierarchy.test.ts:1179–1187`, which asserts half its title, has no ID or title to search for: say which test it is, if the files split from it show it, or that it can't be found.
  - **Three of the report's items are done** (batch 3g's note, below): `extract.test.mts`'s fixture, the `toRect` case behind `dragRegions.test.ts:111–113`, and #31's merge. Confirm them rather than raise them again.

*From the Coder, batch 3h, the checker reads Bruno (2026-10-22).*

- **For the Architect:** your note says you update `documentation-standards.md`'s `bruno/` row and its "What the checker checks" list once 3h lands. It has. A request's `docs` block gets the rules a Markdown file outside the wiki and the test plans gets: `transient-id` (IDs and dates), `transient-link`, `bare-section` and `wiki-pointer` (the pointer's form, and whether it resolves), and `symbol-ref`. It doesn't get `case-id`, `bare-case-id`, `claude-ref` or `wiki-code-name`. The rest of a `.bru` file is unread. A `.bru` file outside `bruno/` isn't checked. `code-comments.md`'s checker table, if it lists scope, has the same gap.
  - **Done 2026-10-22 (Architect).** `documentation-standards.md`'s "What the checker checks" names the `docs` blocks among what it reads, as Markdown, and says the rest of a `.bru` file isn't read. Its `bruno/` row says the checker reads a `docs` block, and that rule (g), naming no `.claude/` or `CLAUDE.md` file, holds there by hand. `case-id` and `bare-case-id` need no such line, since no request cites a test case. `wiki-code-name` needs none either, since it's the wiki's. `code-comments.md`'s table lists rules, not where they run, so it has no gap.

*From the Coder, batch 4a, the item tests (2026-10-23).*

- **For the Test Reconciler, on its re-check:** the tests that now carry these IDs, or carry them on a changed setup.
  - **ATT-4.11:** `items.hierarchy.test.ts`, the top-level test, which now accepts by a move and by PUT.
  - **ATT-5.12:** `items.crossProject.test.ts`. **ATT-9.12:** `items.workphase.test.ts`. **ATT-10.4:** `items.test.ts`'s missing-row create test.
  - **ATT-11.1:** `items.test.ts`, two places: the chain test, which carries the ID and asserts part of the case, and the describe "ATT-11.1: deleting an item deletes every descendant, attached and detached, and nothing else", whose two tests are the case's tree deleted from `P` and from `A`.
  - **TC-2.23:** `items.hierarchy.test.ts`'s re-attach test, now beside `items.positioning.test.ts`'s, which gained a sibling so it can fail. **TC-2.4:** `items.positioning.test.ts`'s `A after C` test, beside `positionResolver.test.ts`. **TC-2.9:** `tests/api/itemRepositioningCrossColumn.spec.ts`'s 3.b, beside `positionResolver.test.ts`.
  - **TC-2.25** (`items.attached.test.ts`) and **TC-5.1** and **TC-5.4** (`items.positioning.test.ts`) keep their titles and files; their setups changed.

*From the Coder, batch 4b, the boards, columns and projects tests (2026-10-23).*

- **For the Architect:** `testing-strategy.md`'s Server tests line lists the direct-write fixtures: `setItemPosition`, `setProjectPosition`, `setItemParent` and `setProjectParent`. `server/tests/fixtures.ts` has a fifth, `setColumnEnds`, which writes a column's start or end, including an id that names no workphase. **Done 2026-10-23 (Architect):** the line names all five.

*From the Coder, batch 4c, the client tests (2026-10-23).*

- **For the Test Reconciler, on its re-check:** the client tests that now carry these IDs, by file.
  - **`itemWriteReconciliation.test.ts`:** DRAG-6.1 and TC-2.28 on the band-drop test; TC-2.30 and DRAG-6.2; DRAG-6.9.
  - **`dragRequest.test.ts`:** DRAG-1.24 (`isIdentity` over an empty list), DRAG-3.12 and DRAG-3.24, DRAG-3.23, DRAG-4.1, DRAG-4.12 and DRAG-5.4, and DRAG-6.7 on both stale-response tests. DRAG-6.6's test already began with its ID, and is unchanged.
  - **`popSession.test.ts`:** DRAG-4.12 (the childless Card) and DRAG-1.14, which has a third test. **`dragBands.test.ts`:** DRAG-3.5 on two `bandFor` tests and a `reservationFor` test. **`dragClassification.test.ts`:** DRAG-2.9.
  - **`itemListOps.test.ts`:** DRAG-6.11, and TC-2.30 with DRAG-3.11.
  - **`useProjectDragReorder.test.ts`:** the cap-unknown test is no longer under TREE-1.11.

*From the Coder, batch 4d, the E2E tests (2026-10-23).*

- **For the Test Reconciler, on its re-check:** ATT-11.2 is `tests/ui/attached-children.spec.ts`'s "deleting a Card" describe. DRAG-6.6's board half is `tests/ui/drag-column-bands.spec.ts`'s test, beside `dragRequest.test.ts`'s, which has the request's half. Both specs are in the E2E count: 174 tests, 8 skipped as before.

*From the Coder, batch 4e, the `agentId` fix (2026-10-23).*

- **For Nathan:** `PUT /items/:id` with `agentId: ''` still answers 500, where `POST` stores it as none (`agentId || null`). The new check passes it, since `''` is falsy as it is in `POST`. Nothing sends it: the Sheet sends `null` to clear an agent. If you want `PUT` to agree with `POST`, it's `updates.agentId = agentId || null` and a test line. I left it, since the ruling was about an `agentId` that names no agent.
  - **Answered 2026-10-23 (Nathan):** `PUT` handles an empty-string `agentId` the way the other writes handle an empty-string id. It's the Coder's last item (Batch 4). **Done 2026-10-23 (Coder, batch 4f):** see Amendments.
  - *Superseded the same day, by the answer below:* ~~moved to `api-contract-zod-openapi.md`'s Inbound deferrals, as the Architect recommended.~~
  - **Answered again 2026-10-23 (Nathan), settling the two:** whichever makes the code consistent; the Work Item Detail & Chat UI epic will revisit the item's fields anyway. Batch 4f's probe shows every other write refusing an empty-string id with a 400, so 4f stands. `POST /items`'s two exceptions, `agentId: ''` and `parentId: ''`, which it stores as none, are refused the same way in batch 6's code. The deferral to the API contract epic is withdrawn.

*From the Coder, batch 4f, after the re-check (2026-10-23).*

- **For Nathan:** the plan records your answer on `PUT`'s `agentId: ''` twice, and the two disagree. The Test Planner's entries (Batch 4's "A last Coder item", and the Amendments) make it the Coder's last item. The Architect's make it a Story 2 deferral (`api-contract-zod-openapi.md`'s Inbound deferrals). I did the first, since it's the one that reached me. A probe showed what the other writes do with an empty-string id: `PUT` and `PATCH /move` answer 400 for `parentId: ''`, `PATCH /move` for `anchorId: ''` and `workphaseId: ''`, and `POST` for `workphaseId: ''` and `type: ''`. `PUT` answers 400 for `agentId: ''` now, the same. If you meant the deferral, putting it back is the check's `agentId &&` and the test's second entry.
  - **Answered 2026-10-23 (Nathan):** 4f stands, and `POST`'s two exceptions follow it in batch 6 (the 4e question's last answer).
- **For the Architect:** Inbound deferrals' first bullet says `PUT /items/:id` with `agentId: ''` answers 500. It answers 400 now. What stays for Story 2 is `POST`, which still stores `agentId: ''` as no agent, and `parentId: ''` as no parent (the probe's 201, which that bullet doesn't list).
  - **Done 2026-10-23 (Architect):** nothing stays for Story 2, since batch 6 fixes `POST`'s two exceptions. The deferral is gone from `api-contract-zod-openapi.md`, which has no Inbound deferrals now.
- **For the PO:** the convention says a write naming a row that doesn't exist is refused, and leaving a field out says "none" (wiki item-attachment §14, positioning §2). Nathan's answer above adds that an empty-string id names no row, so every write refuses one with a 400, `POST /items` included once batch 6 lands, and `null` stays the way to clear a field. He wants the rule defined now, for the Test Planner's cases. Whether a page states it, and where, is yours.

*From the Auditor, the re-run (2026-10-23).* The report is `docs/audits/code-quality-audit-a6-rerun.md`; the numbers below are its own.

- **For Nathan:**
  - **#12, `Item.positionScope`:** you ruled on 2026-10-21 that it stays optional. The only hold-back recorded was that not every server route returning an item had been traced. The re-run's drift pass traced them, and each attaches the field. Make it required, so the compiler guards `isStub`, or keep it optional as it is?
    - **Answered 2026-10-23 (Nathan):** deferred to `positioning-on-create-and-edit.md`, whose Decision 8 redefines `positionScope`. It's in that plan's Inbound deferrals.
  - **Three route additions to approve:** #24 and #25 add a fourth site and new evidence to `epic-4-decisions.md` §12's "Carried in from the A6 first-run audit" block (the first run's #44 and #45). #26 adds the DRAG-6.6 growth and the five hand-rolled column lookups to Story 10's item 7 bullet for the first run's #43. May I write them in?
    - **Answered 2026-10-23 (Nathan):** yes. Done: two sub-bullets in `epic-4-decisions.md` §12's block, and one under Story 10's item 7.
- **For the PO:**
  - Board-drag-interaction §10's "A reload that lands mid-drag stops the drag" names a failed drop's and a stale response's resyncs. Report #1 sends a failed column reorder down the same path. Should the rule name every reload?
  - Positioning §7 says the written entry is among the disclosed pairs "when it was part of the reindexed scope". `positionResolver.ts::withReindexDisclosure` adds it whenever any reindex fired and the row has a position. The client applies every pair, so nothing breaks; the wording and the code differ.
- **For the Architect:** `testing-strategy.md` names `server/tests/fixtures.ts` as the server's setup source, and doesn't mention `itemHierarchyFixtures.ts` or `setItemParent`'s attachment argument. Report #16 moves the item helpers into `fixtures.ts`, so the guide may only need the argument. **Done 2026-10-23 (Architect),** with 6c's note below.
- **For the Test Reconciler:**
  - Tests that may not prove their case: `server/tests/routes/items.attached.test.ts:137` and `items.positioning.test.ts:628` (TC-5.5) don't assert their move's status, so a refused move passes; `client/src/lib/hierarchy.test.ts:57–85` tests `getSubtreeHeight`, which neither cap check calls (moot once report #13 lands); `client/src/components/workflow/itemWriteReconciliation.test.ts:127–167` (DRAG-6.1, TC-2.28) rebuilds the board's write tracker by hand; `dragRegions.test.ts:72` (DRAG-1.6) checks only the gap between sub-rows; `client/src/lib/positionedWrite.test.ts:13` is titled TC-5a.4, which its third test exercises; `tests/ui/workflow-inheritance.spec.ts:221–226` passes if its setup is refused, until report #21 lands.
  - Case IDs on more than one test: ATT-9.1 (`items.hierarchy.test.ts:140`, `items.workphase.test.ts:40`); TC-2.24 (`items.test.ts:430`, `items.crossProject.test.ts:266`, with different claims); TC-2.6 and TC-2.7 (`items.test.ts:251`, `items.positioning.test.ts:36, 43`); ATT-4.10 in four files.
  - Report #17, #18 and #19 move tests between files if they're done (they're on the Watch List since the re-tier); their Automation lines need re-pointing after.
- **For the Test Planner:**
  - TC-5a.5's Automation line lists only `itemListOps.test.ts`; `client/src/lib/hierarchy.test.ts:105–123` tests the same tie-break, with no ID.
  - TREE-1.13 is `Open`; `hierarchy.test.ts:99–102` asserts its library half, with no ID.
  - `client/src/components/ItemDetailPanel.test.tsx` carries no case ID, and TC-5a.1's line doesn't list it.
  - `tests/ui/workflow-inheritance.spec.ts`'s header cites wiki project-tree §10, and no project-tree case covers inherited or own workflows, or copying one. Neither it nor `workflow-creation.spec.ts` carries an ID.

*From the Coder, batch 6a, client correctness (2026-10-23).*

- **For the Test Reconciler:** the 6a tests carry no case ID. They cover a failed column reorder landing during an item drag, which is a third reason beside the two DRAG-6.15's *Given* names (a failed item drop, a stale response). Whether the rule names every reload is the PO's question in the re-run's Routes. DRAG-6.15 is `Open`. If the PO extends it, `useBoardDnd.test.ts`'s first test is the one that would carry the ID.

*From the Coder, batch 6b, server source (2026-10-23).*

- **For the Test Reconciler:** the empty-string `POST /items` test in `items.test.ts` and the non-string project parent test in `projects.test.ts` carry no case ID. Whether the empty-string rule gets a page, and so cases, is the PO's question in the 4f notes above.

*From the Coder, batch 6c (1 of 2), the server fixtures (2026-10-23).*

- **For the Architect:** this is what `testing-strategy.md`'s server-test lines can say for the re-run's #16 (the "For the Architect" bullet above).
  - `server/tests/fixtures.ts` holds the item-route helpers every item route test shares: `move`, `put`, `getRow`, `countItems` and `setupWorkflow`, with `createAgent`, `createItemType` and the direct-write `setItemWorkphase`. `setItemParent` takes an attachment argument.
  - Its `create*` helpers assert their status, so a refused setup step fails at its own line. A test of a refusal sends the request itself.
  - `itemHierarchyFixtures.ts` is left with `hierarchyEntries` and `cardWithTwoStubs`, which only hierarchy tests use.
  - **Done 2026-10-23 (Architect).** The Server routes row names `move`, `put` and `getRow`, says the `create*` helpers assert their status and that a test of a refusal sends its own request, and names `itemHierarchyFixtures.ts` for what only the hierarchy tests share. The direct-write line adds `setItemWorkphase`, and `setItemParent`'s attachment flag. `countItems`, `setupWorkflow`, `createAgent` and `createItemType` aren't named: the guide names a few examples, and the file's own comments say what each helper does.

*From the Coder, batch 6c (2 of 2), the item tests' files (2026-10-23).*

- **For the Test Reconciler, once 6e is done:** ten tests changed files, keeping their titles. Their Automation lines can still name the old file.
  - `items.attached.test.ts` to `items.hierarchy.test.ts`: both ATT-4.10 tests ("rejects an item becoming its own parent…", "rejects reparenting to a non-existent parentId").
  - `items.attached.test.ts` to `items.crossProject.test.ts`: ATT-5.1. `items.hierarchy.test.ts` to `items.crossProject.test.ts`: ATT-5.2.
  - `items.attached.test.ts` to `items.positioning.test.ts`: TC-3.4 and TC-2.17. `items.crossProject.test.ts` to `items.positioning.test.ts`: TC-2.24.
  - `items.crossProject.test.ts` to `items.workphase.test.ts`: ATT-9.8 and ATT-9.9. `items.hierarchy.test.ts` to `items.workphase.test.ts`: ATT-9.1, which now sits beside the other test with that ID.
  - ATT-5.12 stays in `items.crossProject.test.ts`; it moved out of "across workflows", which its sibling-project case never was.
  - One test was retitled and carries no ID: `boards.test.ts`'s "POST /api/workflows creates exactly one board, with no columns while the workflow has no workphases".

*From the Coder, batch 6d, the client structure (2026-10-23).*

- **For the Test Reconciler, once 6e is done:** two titles in `popSession.test.ts` changed and kept their IDs: DRAG-1.30 ("coming back inside before popDelayMs resets the clock") and DRAG-1.3, DRAG-1.30 ("outside for >= popDelayMs pops out…"). The test plans' Automation lines name files, not titles, so none of them moves. `hierarchy.test.ts`'s `getDepth / getSubtreeHeight` describe is now two, `getDepth` and `getSubtree`; none of its tests has an ID.
- **For Nathan, outside the report:** `tests/ui/drag-column-bands.spec.ts` says `THRESHOLD` too: a comment (`:227`) and two titles (`:369`, DRAG-3.3 and DRAG-3.11; `:445`, DRAG-1.3 and DRAG-1.12). #9 is `client/src/`, and 6e's comment fixes (#11) don't include that spec. They would be one-word edits to the name `popSession.test.ts` no longer uses; say if you want them in 6e, and the two titles would go to the Reconciler's re-check with the rest.

*From the Coder, batch 6e, the E2E specs (2026-10-23).*

- **For the Test Reconciler, now that 6e is done:** 6e retitled and moved no test, so it adds nothing to the re-check; the cases to re-check are 6c's (ten moved tests) and 6d's (two retitles) above. TC-2.11 and TC-5a.1's test in `item-positioning.spec.ts` seeds its items through `seedPositionedItems` now, with the same title and the same assertions.
- **For Nathan, outside the report:**
  - The `THRESHOLD` names in `drag-column-bands.spec.ts` (batch 6d's note above) are still there. #11 is two other files.
  - #21 names the specs it converts. The same raw project creates remain in `project-sidebar.spec.ts` (four), and `boards-layer.spec.ts` posts a board by hand (`:239`). Neither is in the report, so both are left; say if you want them in a later batch.

*From the Coder, batch 6f, the scripts (2026-10-25).*

- **For the Architect:** the scope script exists, so the guide's §2, the persona and the four agents can point at it for how the lists are built.
  - **Running it:** `npm run audit:scope -- --out <dir>`. `--base` defaults to the newest `*-audited` tag, `--end` to HEAD, `--config <file>` to the defaults, `--repo <dir>` to this repository. It warns when the working tree has uncommitted changes, and exits 1 when a file a pass should read falls in no instance of that pass.
  - **What it writes:** `scope-<pass>-<instance>.md`, with up to five lists, each left out when empty: the files to read whole and why (new file, received moved code, N changed lines of code, or marked by the orchestrator); changed lines; moved lines, with the file each came from; removal sites; and, in the drift pass's files only, the deleted and renamed paths under their old names.
  - **The config** (JSON, each key replacing its default): `groups` (first match wins), `instances` (per pass, the groups each reads; `C2:src` and `C2:test` take a group's source or test files) and `readWhole` (files the orchestrator marks by judgment). The defaults are the seven area groups and 19 instances both runs used.
  - **Where it settles what the guide leaves open:**
    - a copy counts as changed, which the guide's moved-lines bullet doesn't say: a run of four or more lines from one source whose source still holds it at the end of the range (under its new name, if the range renamed it);
    - fewer than four lines from one source in a file count as changed, counted over the file, not per run; what's left of a source after copies come out is counted again;
    - a file changed in both its comments and its imports, with nothing else, goes to all four passes, since neither row of the sort table holds alone;
    - a file with no changed or moved lines and no removal site is left out, but a formatting commit that only deleted lines still leaves removal sites;
    - Markdown lines and test-title lines never count as code toward the read-whole mark.
  - **Root `CLAUDE.md`** names `scripts/` as "repo tooling (check-docs)"; it now holds the scope script too.
- **For Nathan, outside the report:** the check against the re-run's range, `a6-audited..b315a29`, is done (Amendments, batch 6f). Nothing needs `a6-rerun-scopes/`, `a6-scopes/` or `a6-batch-6-drafts/scope-scripts/` any more, so the close can delete them.

## Amendments

- **2026-10-06, batch 1 (Auditor):**
  - **D4:** the merge step reads the plans of stories in the range that closed without their own audit, from the archive. Before, their items were to be copied into the auditing plan. Nobody copied A5a's or A5d's, and reading is mechanical where copying depends on someone remembering.
  - **D10:** A5 landed first, as four stories. Its code goes to all four passes. A5a and A5d called for audits that didn't run, so this run is theirs unless Nathan says otherwise. The code passes split by group, as the drift pass already did.
  - **Batch 1's drafts** found three conflicts outside the audit files, for the Architect, and one question for Nathan. They're listed in `a6-batch-1-drafts/README.md`.
- **2026-10-06, batch 1 (Architect's review):**
  - **D4:** the index-pointer check reads the Living-docs handoff's "Planned passages now built", not Scope's wiki passages, since a Scope passage may be deferred while a story is open.
  - **D10:** the first run's items for the PO and the Test Planner go in this plan's new Open questions, not its Handoff, now that the tech-debt template has Open questions.
  - **The Architect's three conflicts** are resolved in two more drafts, `story-plan-template.md` and `story-done-checklist.md`. The changes to the Auditor's drafts are listed under "The Architect's review" in the drafts' README.
  - **The question for Nathan** moved to Open questions.
  - **Applying is still to do.** The session's permissions blocked the Architect from writing to `.claude/`, so Nathan copies the eight drafts over their live files, or allows the write.
- **2026-10-06, batch 1 applied (Architect):** Nathan copied the eight drafts over their live files and deleted `a6-batch-1-drafts/`, so the README the two entries above cite is gone. What it held, for the record:
  - **Conflicts inside the audit files, fixed by the Auditor's drafts:**
    - the persona sent "looks deferred" findings to the Watch List, which broke both of its rules;
    - the drift agent's "Not yours" restated the checker's rules and had fallen behind them. It now points at `code-comments.md`'s table;
    - the guide and the persona disagreed on who may tag Covered by a story. Now a pass tags an epic, and only the orchestrator tags a story;
    - classification predated the wiki README's page kinds (a page of shared rules, a page whose feature isn't designed yet);
    - the persona's position line left out workphases and boards.
  - **The Architect's three conflicts, resolved:**
    - the tech-debt template gained Inbound deferrals and Open questions, and the guide's Close-out dropped its tech-debt exception;
    - "N.1" left the template for "a cleanup refactor";
    - the epic-wide audit's routes have one home, the guide, so `epic-done-checklist.md` is unchanged.
  - **The Architect's review changes to the guide:**
    - the pointer check reads the handoff (D4 above);
    - an Open question in a plan the merge step read counts as already open;
    - root `CLAUDE.md` goes to the drift pass as well as a directory's;
    - a tech-debt story that changes what the app does gets its own audit and closes by the full checklist. The template and `story-done-checklist.md` say the same.
  - **Check:** `npm run check:docs -- .claude` reports 0 hits on 22 files.
- **2026-10-06, Nathan's answer (Architect):** the first run covers everything since `epic-3-5-story-6-audited`, A5a and A5d included, as D10 assumed. D10 and the Open question record it. Folding a story's audit into a later run isn't adopted as a practice, so `story-done-checklist.md` is unchanged.
- **2026-10-07, batch 2 (Auditor): the first run.** The report is `docs/audits/code-quality-audit-a6.md`; its scope lists are in `docs/audits/a6-scopes/`, deleted before the report is archived. Two departures from D10, both recorded in the report's opening:
  - the passes split by area, not by commit, so a file changed by several sources has one reader per lens. A4's comment rewrites went to the drift instance for their area, listed apart, in place of one drift pass per A4 commit;
  - 23 instances ran in waves of up to five, after a first launch of 20 hit the account's usage limit with none finished. A run this size takes about three usage windows.
- **2026-10-21, batch 3 planned (Architect):** batch 3's code is split into seven batches, 3a–3g, with correctness first and each area's structural moves before its comment fixes. Nathan added Watch List #47 and #50, which sit in code 3d and 3g rework anyway. Batch 4 gains the Reconciler run, which batch 3's test-file splits require, and the rule that every Open question is answered before sign-off. The status line had stayed at "batch 1 uncommitted": batch 1 was committed as `7443721`, with D8's review in it, before the first run began.
- **2026-10-21, batch 3a (the Coder): server correctness.** #1, #2, #6 and #20 are fixed, each with the test its finding names. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 1 | `POST /items` gives an attached child a position under a parent with no workphase, as a move does. No backfill: the dev database has no attached row with a null position (0 of 20, checked again today) | `items.test.ts`, TC-3.4: three children of a parent with no workphase get 1, 2 and 3 and `attached-siblings`; once the parent is filed, one is dropped before another. It replaces the test that made this state and asserted only the workphase |
    | 2 | `GET /workflows/:id` answers a position scope only for items of a project that uses the workflow, and `"none"` for any other | `workflows.test.ts`, no ID: the positionScope test gains an inheriting project's item and a foreign one, and compares every row with `GET /items/:id`, which its title had claimed |
    | 20 | `itemTree.ts::parentRefusal(tree, moving, parentId)`, for both trees. The item move and edit, `POST /items` and the three project writes ask it | The existing parent and cap tests, unchanged, and #6's |
    | 6 | Through #20: a reparent to the top level takes the cap too, for items as for projects | `items.hierarchy.test.ts`, ATT-4.11: a subtree too tall for the cap is refused the top level by move and by PUT, and one that just fits goes |
  - **Shown to fail without the fix.** Each fix reverted in turn, and the tests that fail:
    - #1's gate back (`resolvedWorkphaseId` required): TC-3.4.
    - #2's lookup back (every item answered for): the workflows positionScope test.
    - The cap skipping the top level, in `parentRefusal`: ATT-4.11 and TREE-3.8.
    - The primitive skipping `parentRefusal` for the top level: ATT-4.11.
    - The cap checking a parent the row already has: TREE-3.7.
    - The item create skipping the shared check: three ATT-4.10 tests.
    - The project routes treating every write as a create: six TREE tests.
  - **Two edges the findings don't state.**
    - **`POST /items`' error order moves.** The shared check runs before the route resolves the project, so a create that names a parent in another project that is also at the cap gets the cap's message, not "belongs to a different project". No wiki rule or test-plan case orders them. 3d rebuilds the create's checks (#19) and settles the order it keeps.
    - **`assertWithinProjectDepthCap` is private,** since only `itemTree.ts` calls it once the project routes ask `parentRefusal`. `assertWithinDepthCap` stays exported, and takes a null parent: its lib tests, `dragClassification.ts`'s comment and root `CLAUDE.md` name it.
  - **Checks.** `npm run check` passes: 379 server tests, 432 client, 75 script tests, and `check:docs` at 0 hits. `npm run test:e2e` passes: 163 passed, 8 skipped.
- **2026-10-21, batch 3b (the Coder): client correctness.** #3, #5 and #4 are fixed. #3 and #5 each gained the test their finding names; #4 gained none, as the batch's note says. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 3 | `KanbanCard.tsx` draws the attach ghost when `cardDragSession.containingCardId !== item.id`, the question `placementFor` asks, in place of the Stub's direct parent | `tests/ui/drag-5-stub-detach.spec.ts`, DRAG-5.13: `S1a`, a grandchild of `P` with a child of its own, is carried out to `P`'s Card layer. Its row and its child's stay drawn, and the release writes nothing |
    | 5 | `dragRequest.ts::sendItemMove` records the placement with an anchor's slot in place of `'first'`/`'last'`, when the request carries an anchor | `itemWriteReconciliation.test.ts`, TC-2.28: a top-band and a bottom-band release into a column whose list holds `B`, with the order the answer should leave and no inversion. It goes through `toRequest`, `sendItemMove` and `completeItemWrite`, so it fails if any link drops the anchor |
    | 4 | `CardList.tsx`: a done list's `SortableContext` takes a strategy that returns no transform, with rule 6's pointer beside it | None. Story 10 owns DRAG-3.24's permanent test |
  - **#4's probe.** A throwaway spec on the test stack seeded the report's `D1, X, D2` done column and, beside it, an active column for control. Carrying `X` over `D1` slid `D1` down 104px and `X`'s ghost up 82px into its slot, as in the control column, so the report's trace held. The release wrote nothing, and `X` stayed between `D1` and `D2`. After the fix every row in the done column kept `transform: none` over `D1` and `D2` alike, the control column still slid, and the release still wrote nothing. The probe is deleted.
  - **Where #5's fix sits.** The report names `useBoardDnd.ts::commitRelease`. It's in `sendItemMove`, the one send block `commitRelease` calls, so `sendItemMove`'s own unit tests reach the call and the hook isn't left with an untested line. The helper there is private.
  - **#9's two bullets for these files.** `dragRequest.ts:78–81` is done: #5 made its sentence false, so it was rewritten, scoped to a release that sends a request. `KanbanCard.tsx:141–148` is not: #3 changed what the comment says, but it still sits above `useDragSession()`, and 3e moves it.
  - **Shown to fail without the fix.** Each reverted in turn:
    - #3 back to the direct parent: DRAG-5.13's new test, on `element(s) not found` for `S1a`'s row, and no other.
    - #5's anchor dropped in the helper, and `sendItemMove` recording the placement as drawn: TC-2.28's new test, each time.
    - #4: nothing automated to run; the probe above is the before and after.
  - **One edge the findings don't state.** The blue line in a done list is left as it was, for the PO (Open questions).
  - **Line numbers.** The report's line numbers for open findings in `KanbanCard.tsx`, `CardList.tsx`, `dragRequest.ts`, the two test files and `drag-5-stub-detach.spec.ts` (#9, #15, #17, #34, #38) moved by a few lines.
  - **Checks.** `npm run check` passes: 379 server tests, 433 client, 75 script tests, and `check:docs` at 0 hits. `npm run test:e2e` passes: 164 passed, 8 skipped.
- **2026-10-21, batch 3c (the Coder): the checker.** #7, #42 and #18 are fixed, in `scripts/check-docs/`, `eslint.config.mjs` and the Bruno requests, as the batch's note says. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 7 | `extract.mts::isTestCallee` steps through a call or a tagged template to the identifier, so the title after `it.each(table)` or ``it.each`…` `` is read | `extract.test.mts`: the title test gains both forms, and a `helper(it)(…)` that isn't a test |
    | 42, fences | `extract.mts::unfencedLines`, which `extractMarkdown`, `headingSections` and `caseHeadings` all map over | `extract.test.mts` for `unfencedLines`, and one nested-fence case each for the two index functions in `repoIndex.test.mts` |
    | 42, folders | `files.mts::TRANSIENT_FOLDERS` builds `TRANSIENT_DIR`, the never-checked set and `rules.mts`'s path matcher | `files.test.mts` (new): for each folder in the list, it's never checked, counts as transient, and a file in it named in a comment is a `transient-link` |
    | 42, layout and links | `files.mts` holds `WIKI_DIR`, `TEST_PLANS_DIR`, `isInWiki`, `isInTestPlans`, `wikiPageOfReadme`, `wikiPageAt` and `resolveLink`. `check.mts::contextOf`, `repoIndex.mts::loadIndex` and both link readers in `rules.mts` use them, and the link pattern is spelled once | `files.test.mts`: the page a path names, the wiki against the test plans, and where a link resolves |
    | 18 | The headers of `rules.mts`, `check.mts` and `files.mts`; the Bruno pointers and the hierarchy block; the ESLint comment | None: comments and docs |
  - **#7 turns up nothing.** The 14 `.each` titles in `client/src` are read now, and `check:docs` reports no hit on any of them.
  - **Shown to fail without the fix.** Each reverted in turn, with the tests that fail:
    - `isTestCallee` back to property accesses only, and with calls but no tagged template: the title test, each time.
    - `headingSections` and `caseHeadings` flipping on any fence line again: their nested-fence cases. `unfencedLines` closing on any fence line: its own test and both of those.
    - The path matcher, the never-checked set and `TRANSIENT_DIR` each re-spelled without one folder: the new folder test, each time. The last also breaks the `transient-link` tests.
    - `resolveLink` resolving from the repo root: its test, and the `transient-link` and `wiki-pointer` tests.
  - **#18's Bruno part.** `move-item.bru`'s pointer for the rule that a request names an anchor and a side now says `wiki positioning §2`, and the others use `wiki <page> §N`. The hierarchy block no longer restates the wiki's rules. It keeps the request's shape and the response, and points at `wiki item-attachment` §2a, §4, §5, §7, §8 and §9. The checker doesn't read `.bru` files, so I ran it over a scratch Markdown copy of the three `docs` blocks: no hits, and the copy is deleted.
  - **Two edges the findings don't state.**
    - **A fence's closing line.** `unfencedLines` closes a fence on any line of the same character and length, as the old `extractMarkdown` did, so a line such as "```ts" inside a plain "```" fence ends it. CommonMark allows only spaces after a closing fence. No page nests fences that way, so nothing reads wrongly today.
    - **`bruno/` in the standards.** It's in Open questions, for the Architect.
  - **Checks.** `npm run check` passes: 379 server tests, 433 client, 83 script tests, and `check:docs` at 0 hits on 286 files. `npm run test:e2e` isn't run: nothing in this batch touches the app's behavior or the E2E code.
- **2026-10-21, batch 3d (the Coder): server structure.** #19, #21–#26, #47 and #8 are fixed. #8's last bullet also touches `client/src/test/itemFixture.ts`. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 19 | `itemHierarchy.ts::resolveCreate`, a create's one entry point, takes the parent row the route read (`getParent`) and the resolved project. It holds the missing-workphase, parentless-flag, attached-workphase and foreign-workphase checks, in `validateHierarchyRequest`'s order, with messages the two now share. The route keeps the parent (`parentRefusal`), the project and the plain references | `items.hierarchy.test.ts`, no ID: a top-level create, an attached child, a detached child and a move all refuse a `workphaseId` that names no workphase with one message |
    | 47 | `POST /items` answers 400 for a `projectId`, `type` or `agentId` that names no row | `items.test.ts`, no ID: each one, with nothing created, and an existing type and agent stored |
    | 21 | `positionResolver.ts::anchorRefusal(table, scopeWhere, anchorId, subjectId)`: self, missing, outside the scope, no position, in that order, over the scope predicate the resolver queries. `itemHierarchy.ts` and `routes/projects.ts` map its reason to today's messages, and `sharesPositionScope` is deleted | `positionResolver.test.ts`, no ID: the four reasons and their order, over items and projects. `items.hierarchy.test.ts`, TC-7.10: an item that ends with no workphase has no scope for an anchor |
    | 22 | `positionResolver.ts::withReindexDisclosure(row, reindexed)`, null-guarded, which `respondWithItem` and `projectResponse` call | `positionResolver.test.ts`, no ID: the row itself when none fired, its own pair appended, and no pair for a row with no position |
    | 23 | `itemTree.ts::ancestorsOf`. The depth, `itemHierarchy.ts`'s shown-with walk and `effectiveWorkflowIdForProject` read it and keep their own stop rules | `itemTree.test.ts`, no ID: nearest first, ending at a parentId with no row and on a cycle without the item itself, over both tables. `items.hierarchy.test.ts`, no ID: a detached child created under a parentId cycle still resolves |
    | 24 | `createDefaultBoard` moves to `lib/defaultBoard.ts`, and `workflows.ts`, `boards.ts` and `runMigrations.ts` import it there | The workflow and board tests that create a board |
    | 25 | `workflowCascade.ts::deleteWorkflowsById`, called by the workflow DELETE and by `projectCascade.ts::deleteProjectById` | `workflows.test.ts`, no ID: a workflow's own notification, with no item, is removed by a workflow delete and by a project delete. No test reached it before |
    | 26 | `testHelpers.ts::writeOrNotFound` | `testHelpers.test.ts` (new), no ID: the four routes' writes, 404s and 400s. They had no server test |
    | 8 | Each bullet, written beside the code it describes. The §14 pointer the report found missing was on the flag check already; it moved with the check into `resolveCreate`, and the route's POST now has one for the project and parent half | None: comments |
  - **Shown to fail without the fix.** Each fix reverted in turn, and the tests that fail:
    - `resolveCreate` without the missing-workphase check: the new create-and-move test, and the existing non-existent workphase test. With the check only on a top-level create: the new test alone.
    - `POST /items` without the project, type or agent check, each in turn: `items.test.ts`'s new test.
    - `anchorRefusal` asking the position before the scope: its order test, alone. Without the self check: its two unit tests, TC-7.10's self-anchor test and TREE-6.5. Without the scope check: nine tests, the unit tests and TC-7.10's among them.
    - An item anchor checked against the scope the item is in now: nine move tests, TC-7.11's among them. A project neighbor checked against the parent the project has now: TREE-4.1, 6.1 and 6.3.
    - `withReindexDisclosure` without the row's own pair, and without the null guard: its unit tests, and for the first TC-5.10 and TREE-4.5 among others. `projectResponse` and `respondWithItem` each without it: their TC-5 and TREE-4 tests.
    - `ancestorsOf` seeded without the item, and not ending at a missing parent: one test each. `selfRefDepth` without the item itself: fifteen. `shownWith` stopping at the item itself: the ATT-9.4 to 9.7 and 9.10 tests; with no fallback for a chain that ends: the cycle test. `effectiveWorkflowIdForProject` reading no ancestor: its inheritance test and the workflows positionScope test.
    - `deleteWorkflowsById` deleting the workphases before the boards: the project cascade tests and TREE-10.3. Leaving the notifications: the new test alone. `deleteProjectById` leaving its workflows: the project cascade tests and the new one.
    - `writeOrNotFound` answering 404 for a row it wrote: the new test file.
  - **Edges the findings don't state.**
    - **The order a create refuses in** is settled, as 3a's note asked. The route's parent checks come first, since the project resolves from the parent, then the project's, then a type or agent that names no row, then `resolveCreate`'s, in a move's relative order. A move or an edit checks the workphase's existence before its parent, so a request with both wrong answers by entry point. Open questions, for the PO.
    - **`anchorRefusal`'s order flips one case for items.** A neighbor outside the scope that also has no position is refused as outside it. Items had it the other way round and projects this way, and the wiki orders neither.
    - **A parentId that names no row no longer counts as a level** in `hierarchyDepth`: the old walk added one for it before finding no row. Only a direct database edit makes one.
    - **A create still takes no shape checks.** A move and an edit refuse a non-boolean `isAttached` and a `workphaseId` that isn't a string or null; a create coerces the flag and sends the rest to the existence check. #19 doesn't list them.
    - **`PUT /items/:id` takes an `agentId` without checking it,** so a bogus one is the same opaque 500 #47 fixed for `POST` (probed). #47 names only the create, so it's left.
    - **`npm run check:docs` has one hit that isn't the Coder's to fix:** `.claude/personas/coder.md:60` names `routes/boards.ts::createDefaultBoard`. Open questions, for the Architect.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 433 client, 83 script tests. `npm run check:docs` reports the one hit above and nothing else. `npm run test:e2e` passes: 164 passed, 8 skipped. A first run, on a machine that took 39 minutes for it, timed out in two tests, `item-positioning.spec.ts`'s TC-5a.1 and `item-repositioning-cross-column-dnd.spec.ts`'s DRAG-1.23; both passed alone, and the second full run was clean.
- **2026-10-21, batch 3e, the drag layer (the Coder): client structure, first half.** #30, #32, #34, #35, #36, #37 and #9–#12 are fixed, with #9's last bullet (`AttachGhostRow`) restated rather than merged, which is Nathan's call (Open questions). The sidebar, `lib/` and `api/` half (#27–#29, #31, #33, #13, #14) is still to do. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 37 | `dragStructure.ts` holds the DOM half of `dragRegions.ts`; `layoutRect` becomes `paintedRect`, which is what it returns | `dragStructure.test.ts` (new), the tests that were in `dragRegions.test.ts`, with their titles unchanged; the same count of tests as before |
    | 36 | `useColumnManagement.ts::onColumnDrop(activeId, overId)`, which takes the board and `setBoard`. `BoardDndDeps` carries it in place of `setBoard` and `handleReorderColumns` | `useColumnManagement.test.ts` (new), no ID: the order is applied at once and saved from position 1, a failed save reloads, and an unknown column or no board does nothing. E2E covered it only through BCU-3.6 |
    | 30 | `evaluatePop`'s local `step(from, sampled)`, the call's other six inputs written once. In tests, `popFixtures.ts::step`, which `runPop` and `hoverAt` build on | The suites it serves: 45 calls in `popSession.test.ts` and `placement.test.ts` go through it |
    | 32 | `useLatest.ts::useLatest`, used by `useBoardDnd.ts` (twice), `usePendingGhostGuard.ts` and `useSnapTween.ts` | `useLatest.test.ts` (new), no ID |
    | 34 | `ACTIVE_CONTEXT_OUTLINE` moves into `dragChrome.tsx`, so `KanbanCard.tsx` no longer imports `BandGuides.tsx`. `INVALID_DROP_INDICATOR_LINE` is private to `SortableProjectRow.tsx`. Both lines are `DROP_LINE_SHAPE` plus a color | None: class strings. The sidebar's E2E specs read the lines' `data-drop-invalid` |
    | 35 | `DRAG_OVERLAY_ATTR`, in `dragRegions.ts` beside `DRAG_REGION_ATTR`, read by `dragChrome.tsx`, `SortableProjectRow.tsx` and `tests/helpers/dragGesture.ts` | `dragChrome.test.tsx` (new), no ID: the board's carried copy and the sidebar's ghost both carry the attribute the wait counts |
    | 9, 10, 11, 12 | Each bullet, beside its code. #11's three statements are fixed in `workflow/CLAUDE.md`, whose file list follows #36 and #37 | None: comments and docs |
  - **Shown to fail without the fix.** Each reverted in turn:
    - `onColumnDrop` saving positions from 0, not reloading after a failed save, and without its unknown-column guard: one of `useColumnManagement.test.ts`'s tests each.
    - `useLatest` never updating: its test.
    - The board's carried copy, and the sidebar's ghost, each with another attribute name: `dragChrome.test.tsx`'s test for each.
    - `step` dropping the named anchor: six of the pop suites' tests, the named-card zoom-in ones among them.
  - **Two decisions in the rules.**
    - **#10 asked `useBoardDnd.ts` to point at `workflow/CLAUDE.md`'s concern map.** A comment may not name a `CLAUDE.md` file (the comment guide's rule (g)), so the hook keeps one header that lists the modules it composes, matching its imports.
    - **#9's `useBoardDnd.ts:95–96` fix became unnecessary.** It asked for "Item position values", because the column branch sent `position: i + 1`. #36 moved that branch out, so "Position values are never computed here" is true as it stands.
  - **Edges the findings don't state.**
    - **`step` took in more calls than #30 counted:** 45 in all, not the 13 it names, since the calls with a named anchor fit a five-argument `step`. The ones that stay direct pass a different tuning or a structural parent lookup.
    - **`useLatest` has to be listed in the dependency arrays that read it.** `exhaustive-deps` can't see a custom hook's ref as stable the way it does a `useRef` result. The refs' identity never changes, so listing them changes nothing.
    - **One change that is not a comment in #10's one-liners:** `BoardColumn.tsx`'s empty-column message drops `!(isOver && isCardBeingDragged)`, which `!session` already implies.
    - **`DRAG_OVERLAY_ATTR` lives in `dragRegions.ts`,** not `dragChrome.tsx`: it is plain TypeScript the E2E helper already imports from, where `dragChrome.tsx` would pull React into the spec runtime.
    - **#15's first bullet,** `dragRegions.test.ts:59–63`, is done with the split, since the sentence pointed at a block that moved.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 439 client, 83 script tests. `npm run check:docs` reports the one hit from 3d, `.claude/personas/coder.md:60`, and nothing else. `npm run test:e2e` passes: 164 passed, 8 skipped.
- **2026-10-21, batch 3e, the sidebar, `lib/` and `api/` (the Coder): client structure, second half.** #27, #28, #29, #31, #33, #13 and #14 are fixed, which closes 3e. The Close-out rows are filled in.
  - **The fixes and their tests.**

    | # | Fix | Test, in |
    |---|---|---|
    | 27 | `lib/hierarchy.ts::isWithinDepthCap`, called by `dragClassification.ts` and by `useProjectDragReorder.ts`, which also walks the dragged subtree once, not twice | `hierarchy.test.ts` (moved from `dragClassification.test.ts`, plus the sidebar's depth 0 case); the hook's cap tests pin the sidebar's side of the boundary |
    | 28 | `lib/hierarchy.ts::byPositionThenCreatedAt`, over `Positioned`; `projectTreeUtils.ts` and `itemListOps.ts` call it | `hierarchy.test.ts` (new, four cases); `flattenTree`'s and `getWorkphaseItemsFrom`'s own tests |
    | 29 | `buildParentOptions`' indented branch walks `flattenHierarchyOf`, siblings sorted with #28's comparator | `hierarchy.test.ts` (one new case: siblings by position, then creation, not by input order) |
    | 31 | `getDescendantIds`, `eligibleRows` and `applyItemWriteResponse` are deleted, and callers use the shared function | The existing tests, retargeted; see Open questions |
    | 33 | `api/shared.ts::PositionedWriteResponse<Row>`; the two API types, `applyWriteResponse` and the Sheet's callbacks use it | `ItemDetailPanel.test.tsx` (new, no ID, four cases): the parent picker, the agent picker, a child's attach toggle and a child create each hand the board the response with its `reindexed` pairs |
    | 14 | Both keys and the comment are gone | None: `App.tsx`'s key on the page still remounts it, and the E2E run passes |
    | 13 | Each bullet, beside its code | None: comments |
  - **Shown to fail without the fix.** Each reverted in turn:
    - `isWithinDepthCap` off by one: 12 tests, in the hook's cap suite, `descendantsProjection.test.ts`, `dragClassification.test.ts` and `hierarchy.test.ts`.
    - The sidebar converting the depth by hand again (`projected.depth + 1`): the hook's "fits the cap" test.
    - The comparator counting a missing position last, and without its `createdAt` tie-break: four and eight tests, across `hierarchy.test.ts`, `projectTreeUtils.test.ts`, `itemListOps.test.ts` and `dragRequest.test.ts`.
    - The dropdown without its sibling sort: `hierarchy.test.ts`'s new case.
    - `completeItemWrite` dropping the `reindexed` pairs: TC-5a.2.
    - Each of the seven places a response is handed on (three in the panel, four in the sections) copying the row without its pairs: the panel test for that path.
    - Renaming `reindexed` in `PositionedWriteResponse` alone: `tsc` fails in `positionedWrite.ts` and `useItemManagement.ts`. Before, it was spelled in three types, and a rename in one still compiled.
  - **Edges the findings don't state.**
    - **The projection's depth is already the cap's `targetDepth`.** #27 says the sidebar "converts a 0-based depth by hand". A project dropped at projection depth `p` has a parent at depth `p` in the cap's count (the virtual top is 0, a root project 1), so there is no conversion to keep: the hook passes `projected.depth` as it is, and says why.
    - **`buildParentOptions` now needs `position` and `createdAt`.** Its constraint is `T extends TreeNode & Positioned`, so the flat mode, which ignores both, asks for them too. Its two callers, items and projects, have both. The alternative was a second function for the indented mode.
    - **#31's merge of the two test files is not done,** per the report's route to the Reconciler.
    - **`positionScope` stays optional,** which Nathan confirmed. Only its comment changed.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 445 client, 83 script tests. `npm run check:docs` reports the one hit from 3d, `.claude/personas/coder.md:60`, and nothing else. `npm run test:e2e` passes: 164 passed, 8 skipped.
- **2026-10-21, batch 3f (1 of 2), the client tests (the Coder): #38 and #15.** I split 3f the way 3e was split: the client tests here, the server tests (#39, #16) next. No production file changed. The client still runs 445 tests: none added, none deleted.
  - **The fixes.**

    | # | Fix | Where |
    |---|---|---|
    | 38 | `makeProject`; the three local factories are gone | `test/projectFixture.ts` (new) |
    | 38 | The Card-and-section layer is built once, on `threeColumnBoard()` | `test/popFixtures.ts`; read by `popSession.test.ts` and `placement.test.ts` |
    | 38 | `regionEl(key, rect?, ...children)` and `mockRect`, built on `dragRegionProps`; the five builders, the two verbatim copies and the hand-spelled attribute and keys go | `test/dragFixtures.ts`; `dragStructure.test.ts`, `dragRegions.test.ts` |
    | 38 | `rect()` and `cardRegion()` where the fixtures already build the shape; `freeOrigin` and `stubOrigin` called, not shadowed | `dragCollision.test.ts`, `dragRegions.test.ts`, `dragRequest.test.ts` |
    | 38 | The wiki's worked example is written once | `itemWriteReconciliation.test.ts` |
    | 15 | `POP_TEST_TUNING` pins what the cases depend on, and the two suites say they read their waits from it | `test/popFixtures.ts`, `popSession.test.ts`, `placement.test.ts` |
    | 15 | IDs at the start of titles; the cross-reference comments deleted; TREE-1.10 out from under TREE-1.9's describe; `TREE_3` renamed `BOUNDARY_TREE` |`dragClassification.test.ts`, `dragRequest.test.ts`, `dragRegions.test.ts`, `itemListOps.test.ts`, `itemWriteReconciliation.test.ts`, `useProjectDragReorder.test.ts` |
    | 15 | The smaller comment fixes | `test/dragFixtures.ts`, `test/itemFixture.ts`, `dragStructure.test.ts`, `placement.test.ts`, `dragCollision.test.ts`, `dragClassification.test.ts`, `itemWriteReconciliation.test.ts`, `BandGuides.test.tsx` |
  - **Shown to bite.** These are test-code changes, so what I checked is that the pins hold and the restructured tests still catch what they did.
    - **The pins.** Before, a tuning value of the wrong kind broke the pop suites: `popDistancePx` at 50 failed 13 tests, `popInDelayMs` at 0 failed 11, `cardZoomDwellMs` or `cardPopInDelayMs` at 0 failed 4 each, and `descendantsPopInDelayMs` at 0 failed 2. After, setting the app's defaults for the distance term and the three zoom delays to 50, 0, 0 and 0 leaves both suites passing, 76 tests each time. `popInDelayMs` was pinned already.
    - **Source mutations the restructured tests catch.** Each reverted in turn:
      - `clipToVisible` not clipping the top edge: three tests.
      - `measureRegions` without its scope filter: one.
      - A Card the drag can't target still resolving: three.
      - The Descendants zoom waiting on the Card cue's delay: one. The Card zoom waiting on the cue without the dwell: one. These two are caught because the pinned delays differ.
      - The distance term on at 0: 14.
      - Every Descendants section read as the dragged Stub's own: two. A Card region that always attaches, never sets back down: two.
      - `dragRegionProps` registering another key: 12, so the tests do go through it.
  - **Edges the findings don't state.**
    - **The pop suites depend on four values, not the two #15 names.** The distance term must be off, and the dwell and the cue before a Card zoom, and the section's delay, must be above 0. I pinned all four, each to a value of its own, so a case that waits on the wrong clock fails.
    - **The shared Card layer is one geometry where the copies had three.** No case reads more than containment. The shared P is 100 tall with its section in the lower 60, Q sits beneath it, and `inA` is below both. `placement.test.ts`'s foreign-section cases now use P's section, with Q as the other Card, where they used a section of Q and P as the other.
    - **The finding's `dragRegions.test.ts` lines for the DOM cases are `dragStructure.test.ts`'s** since #37's split. The fixture comments that named `dragRegions.test.ts` no longer name a test file.
    - **`placement.test.ts`'s `origin` comment was wrong in more than #15 says.** "Neither ever changes the outcome" is false for a Stub: its `origin` decides the card-list branch, which previews it as Free. The comment says so.
    - **`dragCollision.test.ts`'s casts.** With `rect()`, `Over` accepts the object as it is, so two of the three `as unknown as Over` casts are gone too.
    - **Same pattern as the finding, not named by it:** `dragRequest.test.ts`'s DRAG-3.10 title with its ID at the end, and its "a done region never anchors" title that named DRAG-3.9.
    - **`itemFixture.ts`'s comment** now says what the fixture does: it never returns `'none'`, which the API gives an item in a terminal workphase.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 445 client, 83 script tests. `npm run check:docs` reports the one hit from 3d, `.claude/personas/coder.md:60`, and nothing else. `npm run test:e2e` wasn't run: no production file changed.
- **2026-10-21, batch 3f (2 of 2), the server tests (the Coder): #39 and #16.** This closes 3f, and the Close-out rows are filled in. No production file changed. The server still runs 399 tests, and their names are the same apart from the retitles in Open questions.
  - **The fixes.**

    | # | Fix | Where |
    |---|---|---|
    | 39 | `workflowWithPhases(phases, projectOverrides?)`, used by 48 setups; the two wrappers that held identical bodies under different names are gone | `fixtures.ts`; `boards`, `columns`, `workphases`, `items`, `items.positioning` and `items.attached` tests; `itemHierarchyFixtures.ts::setupWorkflow` |
    | 39 | `setItemParent` and `setProjectParent` for the direct parent writes; `positionResolver.test.ts` imports the two position setters instead of copying them | `fixtures.ts`; `itemTree`, `workflowItems`, `positionResolver`, `projects`, `workflows`, `items`, `items.hierarchy` and `items.workphase` tests |
    | 39 | The hand-rolled board lookups call `boardsOf`, or use the board `workflowWithPhases` returns | `boards`, `columns`, `projects`, `workflows`, `workphases` tests |
    | 39 | The eight `columnRanges` tests move to `lib/` | `lib/columnRanges.test.ts` |
    | 39 | `items.test.ts` splits into CRUD, positioning and attached children | `items.positioning.test.ts`, `items.attached.test.ts` |
    | 39 | `items.hierarchy.test.ts` splits, with the shared helpers written once | `items.crossProject.test.ts`, `items.workphase.test.ts`, `itemHierarchyFixtures.ts` |
    | 16 | Each bullet, beside its code | `fixtures.ts` and the test files above |
  - **Shown to bite.** These are test-code changes, so what I checked is that the new fixtures matter and the moved tests still run. Each reverted in turn:
    - `workflowWithPhases` creating the phases in reverse: 54 tests, across eight files.
    - `workflowWithPhases` dropping a phase's fields beyond its name, so a terminal phase isn't terminal: 19 tests, across six files.
    - `setItemParent` writing nothing: eight tests, in `itemTree.test.ts` and `items.hierarchy.test.ts`. `setProjectParent` writing nothing: two, in `projects.test.ts`.
    - `getRow` in the shared module reading the wrong row: 12 tests, in the three files split from the hierarchy file.
    - `columnRanges.ts` not resolving an inverted range by min and max: one test. Its overlap check looking at one side only: one test. Both are in the moved `lib/columnRanges.test.ts`.
    - **Not caught:** `setItemParent` dropping the attachment flag it writes with the parent. The two sites that pass it, the seeded chains, wrote that flag before this batch too, and no server test asserts on it. I kept the parameter so the seeded data is the data it was.
  - **Edges the findings don't state.**
    - **Two cycle tests pass whether or not the cycle is written.** `items.test.ts` and `workflows.test.ts` each assert only a 200 and a numeric depth, so they also pass when `setItemParent` writes nothing. That was true before this batch.
    - **A second board before the workphases is the site's own order.** `columns.test.ts::setupFour` and the isTerminal-flip case in `workphases.test.ts` each need two boards with no columns, and a board made after the phases gets one column per phase. They call `workflowWithPhases([])`, make the second board, and then make their phases.
    - **The wrappers made two phases at every call.** Inlining them kept that: five of the calls name only `todo`, and still ask for `In Progress`, so the workflow, and a board made after it, are as they were.
    - **13 setups are left as they were:** a project, a workflow and one phase with no name, in `positionResolver`, `items`, `workflows`, `projects` and `workphases` tests. The finding says "named workphases", and a fixture call with a name that nothing reads wouldn't be shorter by much.
    - **`GET /api/boards?workflowId=` stays hand-rolled once,** in the test of that filter, since its body is what the test reads.
    - **A stale pointer I made and removed.** The ATT-5.1 comment in `items.attached.test.ts` said the full cascade cases live in `items.hierarchy.test.ts`; they moved to `items.crossProject.test.ts`. The comment is gone, and the title says what the test is.
    - **`itemTree.test.ts`'s comment cited DRAG-2.10 for the cap parameter.** DRAG-2.10 is the case about the board carrying the cap; the comment now says which cases reach the cap and which two read none.
    - **`BoardBody` gained the two fields the board tests read,** `entryWorkphaseId` and `itemDepthCap`, so its comment is true.
    - **`items.hierarchy.test.ts:215–216` needed no change.** The comment there is accurate; the finding's other line in the file, `:82–83`, named the test plans and is fixed.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 445 client, 83 script tests. `npm run check:docs` reports the one hit from 3d, `.claude/personas/coder.md:60`, and nothing else. `npm run test:e2e` wasn't run: no production file changed.
- **2026-10-22, batch 3g, the E2E specs (the Coder): #40, #41, #50 and #17.** This closes batch 3's code, and the Close-out rows are filled in. One production file changed, by one attribute pair: the item detail panel's role and name. The suite still runs 172 tests under the same describes and titles; 164 pass and 8 are skipped, as they were.
  - **The fixes.**

    | # | Fix | Where |
    |---|---|---|
    | 40 | The 42 inline board openers call `openBoard`, which has `exact: true`. Three sites that must not reload the page call `showBoard`, and one calls `openBoardTab` | `attached-children`, `boards-layer`, `boards`, `workflow-inheritance`, `workflow-creation`, `item-positioning`, the two repositioning DnD specs |
    | 40 | Creates, reads and moves by hand call `seedItem`, `fetchItem`, `moveItem`, `addWorkphases`, `fetchDefaultBoard`; the three scenario builders call `seedBareWorkflow`, `addWorkphases`, `seedProjects`, `seedWorkflow` and `seedItem`; the three local move wrappers and their `getItem`s are deleted | `itemRepositioningScenario.ts`, `attached-children`, `boards-layer`, `api/attachedChildren`, `api/itemRepositioning*`, `item-positioning`, `drag-column-bands`, `workflow-inheritance` |
    | 40 | The 18 `/test/reset` posts call `resetAndSeedDb`, which throws on a failed reset | nine UI specs |
    | 40 | `seedColumn` replaces the 9 board-lookup-and-POST sites | `boards-layer`, the two repositioning DnD specs |
    | 40 | The detail panel has a role and `itemPanel(page)`; `watchWrites` replaces four pasted recorders; `projectNames` replaces eight hand-built regexes | `ItemDetailPanel.tsx`, `boardLocators.ts`, `projectTreeDrag.ts`, `ProjectSidebarPage.ts`, the specs that used them |
    | 41 | `boards.spec.ts` splits in three | `workflow-inheritance.spec.ts`, `workflow-creation.spec.ts` |
    | 50 | `seedPositionedItems` creates, then pins; `seedProjects` throws on an unseeded parent; TREE-1.1 polls for the saved parent | `seed.ts`, `project-tree-drag.spec.ts` |
    | 17 | The ten bullets, each beside its code | `tests/helpers/`, `drag-column-bands`, `drag-5-stub-detach`, `drag-card-zoom-in`, the cross-column DnD spec, `workflow-creation` |
  - **Shown to bite.** These are test-code changes, so I checked that the new helpers and fixes are what the specs depend on. Each reverted in turn:
    - `seedColumn` making every column one workphase wide: two `boards-layer` tests fail.
    - `projectNames` matching only its first name: eight tests fail, across the two project-tree specs.
    - `watchWrites` recording GETs too: the four "writes nothing" tests fail, so the recorder is live and those tests aren't passing on an empty list.
    - `showBoard` reloading the page the way `openBoard` does: the stale-copy test fails, which is why the two methods are separate.
    - The panel without its role: six tests fail, five in `attached-children` and one in `item-positioning`.
    - `seedPositionedItems` pinning as it creates, as it did: a probe that pins three items at 1100, 1200 and 1300 passes on the new helper and fails on the old, where a later create's reindex renumbers an earlier pin.
    - `seedProjects` without its throw: a probe that names a parent before it is seeded passes on the new helper and fails on the old, where the child came out top-level.
    - A refused setup move in DRAG-3.1: the spec now fails at the move, with `PATCH … → 400`, where the second half used to run from the wrong column.
    - The zoom-in wait: with `cardZoomDwellMs` seeded at 2200 ms, DRAG-5.4 passes on `clocksMargin(cardZoomDwellMs, cardPopInDelayMs)` and times out at 2150 ms on `clocksMargin(cardPopInDelayMs)`. At 3000 ms it fails on either, because the hold doesn't complete in that scenario, so 2200 is the probe that separates the two waits. The two skipped specs in `drag-card-zoom-in.spec.ts` carry the same change and weren't run.
  - **Edges the findings don't state.**
    - **The panel's role is `complementary`.** It is in the page when closed, slid out of view, so a `dialog` role would make `getByRole('dialog')` match two elements wherever a column modal is open, and an `<aside>` would collide with the sidebar, which the page object finds as `aside`.
    - **`showBoard` and `openBoardTab` exist because three sites mustn't reload.** The stale-copy test needs the page that loaded before the project was deleted; the inherited board's switch to its child, and the repositioning spec's `goToBoard`, are mid-visit.
    - **`seedProject` and `seedWorkflow` are new exports.** The cross-project scenario needs a workflow on a project that exists, with children made after it. `seedBareWorkflow` and `seedTemplatedWorkflow` are now a project and a `seedWorkflow` call.
    - **Created or read by hand, unchecked, and left:** the setups moved verbatim from `boards.spec.ts`, `project-page.spec.ts`, `project-sidebar.spec.ts`, the CRUD specs under `tests/api/` (where the create is the subject), the `PUT` in `api/attachedChildren.spec.ts`, the unchecked reorder and delete calls, and `orderOf` and `siblingOrder` in the scenario helper. The finding names none of them.
    - **18 reset sites, not 21.** I found 18 `request.post` resets by search, and all are converted; `db.ts` is the only file that spells the route.
    - **Board basics stay in `boards.spec.ts`,** rather than folding into `boards-layer.spec.ts`, which is already the longest board spec.
    - **The cross-column DnD spec's own `getC` wrapper and hand-rolled `column`s stay.** They are #53's, Story 10's.
    - **`SeededColumn` lost `displayName`,** which no caller reads, and `SeededBoard` gained `showAttachedChildren`, which `attached-children` does. `drag-column-bands.spec.ts` uses `SeededColumn` where it declared its own copy.
    - **The `DRAG-3.4` comment** in `drag-column-bands.spec.ts` now cites DRAG-1.5 for "locked to each context in turn", the case that title belongs to.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 445 client, 83 script tests. `npm run check:docs` reports the one hit from 3d, `.claude/personas/coder.md:60`, and nothing else. `npm run test:e2e` passes: 164 passed, 8 skipped. After that run I changed one line (`workflow-inheritance.spec.ts`'s move) and reran the three board specs: 17 passed.
- **2026-10-22, open questions moved (Architect):** Nathan widened `positioning-on-create-and-edit.md` to also give items a second stored position (one among all their siblings, one among Free items). Eight open questions whose answers that story changes moved into its Inbound deferrals: three of the report's for the PO, two of batch 3d's for the PO, and three for the Test Planner (two from 3a, one from 3d). Each left a one-line pointer here. They no longer block this story's close.
- **2026-10-22, the Architect's routes (Architect):** every Open question addressed to the Architect is done, in root `CLAUDE.md`, `testing-strategy.md`, `prettier-preemptive-practice.md`, `code-comments.md`, `documentation-standards.md`, `drizzle-sqlite-patterns.md` and `coder.md`. Root `CLAUDE.md` gained two rules: client tests build projects with `makeProject` as they build items with `makeItem`, and E2E setup goes through the checked helpers. `documentation-standards.md`'s ownership table gained `bruno/`. Whether the checker reads `.bru` files is left to Nathan. `npm run check` passes.
- **2026-10-22, batch 3h added (Architect):** Nathan answered the Coder's 3c question: the checker reads each `.bru` file's `docs` block as Markdown outside the wiki. It's a Coder batch, 3h. Once it lands, the Architect updates `documentation-standards.md`'s `bruno/` row and its "What the checker checks" list.
- **2026-10-22, the PO's open questions (PO):** Nathan took the PO's recommendation on all three.
  - **A column with a missing start or end:** the rule waits on the Architect's three facts (Open questions). Covering nothing is Nathan's ruling, on the PO's reasoning from boards-columns-unsorted §4: a column covers the workphases from its start to its end in the workflow's order, and with one end outside that order there's no range. *Deduction a,* from §9's "takes no drop until an edit gives it a range that passes §5": the no-drop rule holds for every broken column, this one included.
  - **The blue line in a done list:** wiki board-drag-interaction §2's rule 6 and its Open question, and `epic-4-decisions.md` §12, say it's decided with zooming into a done-column Card. No section number changed.
  - **§10's pending marker:** no change.
- **2026-10-22, a create naming a row that doesn't exist (PO):** Nathan kept the wiki's convention, on the PO's recommendation, over refusing a missing row only for a required field and ignoring it for an optional one. Every page that covers a reference already refuses one that doesn't exist (Open questions, the Coder's 3d section), and positioning §2 gives the reason: a write that names a row means that row. Wiki item-attachment §14 gains a sentence for the project. No section number changed.
  - *Deduction b,* from item-attachment §2a: a workphase that doesn't exist is neither the parent's nor one the project's workflow uses, so a create or a move that names one is refused.
  - **The gap the convention leaves in the code:** `PUT /items/:id`'s `agentId`, for Nathan to route (Open questions).
- **2026-10-22, the Test Planner's answers (Test Planner):** every Open question for the Test Planner is answered. ATT-4.11, DRAG-4.3, DRAG-5.13 and DRAG-6.1 are revised. ATT-9.12 and ATT-10.4 are new and `Open`, from the PO's deduction b and the ruling in item-attachment §14. TC-2.4's item goes to the Reconciler's run, which waits for 3h (Batch 4).
- **2026-10-22, the two cycle tests (Nathan):** no fix and no route. Batch 3f's note found that `items.test.ts`'s and `workflows.test.ts`'s cycle tests pass whether or not the cycle is written. What the behavior needs is that no write can make a cycle, and that's proven: ATT-4.2, 4.3 and 4.10 for items, and TREE-3.2 and 3.3 for projects, are all `Automated`. A read over a cycle already stored has no wiki rule, so the two tests stay as they are, with no case.
- **2026-10-22, with batch 3g, three items the Test Planner routed to the Coder (the Coder, at Nathan's request: option A, all three in the same change).** The Reconciler's block in Open questions lists them. None has a test-plan case to be judged against, and the Reconciler can't edit tests.
  - **`extract.test.mts`'s "strips the closing of an HTML comment"** had a fixture with no `-->`, and `parseMarker`'s `-->` half couldn't be reached: the code-comment caller passes a comment that ends in `*/` or has no closing, and the Markdown caller's pattern captures only what sits inside `<!-- -->`. `parseMarker` now strips `*/` only, with a comment saying why. The test is "strips the closing of a block comment", over a `/* … */` fixture, and fails when the strip is removed.
  - **`toRect` had no case that gives it a getter-only DOMRect.** With its body replaced by `{ ...domRect }`, all 445 client tests passed. `dragStructure.test.ts` gains "measureRegions over a DOMRect", which runs `measureRegions` over an element whose `getBoundingClientRect` returns the file's `fakeDomRect`, and fails on that replacement. It carries no case ID. The audit's `dragRegions.test.ts:111–113` is the `mockRect` helper, which has since moved to `dragFixtures.ts`.
  - **#31's merge.** The six `applyWriteResponse` tests over items move to `lib/positionedWrite.test.ts`, beside the two over projects. The wiki's worked example, which `completeItemWrite`'s tests read as well, is `client/src/test/reindexFixtures.ts`. Titles and IDs are unchanged, and `itemWriteReconciliation.test.ts` keeps the rest. With `applyWriteResponse` skipping the reindexed pairs, the three tests that fail are the item and project cases in `positionedWrite.test.ts` and `completeItemWrite`'s TC-5a.2.
  - **Checks.** `npm run typecheck`, `lint`'s client, server and root parts, `format:check` and `test:unit` pass: 399 server tests, 446 client, 83 script tests. `npm run check:docs` reports the same one hit. `npm run test:e2e` wasn't rerun, since no E2E or production file changed after its run.
- **2026-10-22, batch 3h, the checker reads Bruno (the Coder).** `npm run check:docs` reads each `bruno/**/*.bru` file's `docs` block as Markdown, the answer Nathan gave to my 3c question. No production file changed.
  - **What changed.** `extract.mts::extractBruno` keeps the lines between a `docs {` line and the next line that is only `}`, and blanks the rest, so a finding keeps the file's own line and column. A brace inside a line of the docs doesn't end the block. `files.mts` gains `BRUNO_DIR` and `isBruno`; `bruno/` joins `DEFAULT_SCOPE`; a request is checkable, and not code. `check.mts` picks the reader.
  - **What it checks.** The five Markdown rules outside the wiki: IDs and dates, links to transient docs, the form of a wiki pointer and whether it resolves, and `<file>::<symbol>` references. The URL, body and vars are unread.
  - **On the current requests,** all 27 `.bru` files report no hit: 3c's fixes already hold.
  - **Tests.** Eleven, in the three test files: `extractBruno` reads only the block, ends it at a lone brace, reads nothing from a file without one, skips fenced blocks, drops carriage returns and numbers a marker by the file; `checkFile` over a request reports each rule at the file's line and column, reads nothing outside the block and honors a marker; the classifiers.
  - **Shown to bite.** Five reverts, each caught: `extractBruno` reading every line (six tests fail), ending the block at any line that ends in a brace (two), `checkFile` reading a `.bru` as plain Markdown (two), `isCheckable` leaving `.bru` out (one), and the default scope leaving `bruno/` out (one). A date planted in `move-item.bru`'s docs is reported at `move-item.bru:23:14`, the line and column it sits at; the file is restored. The brace test's first fixture ended its line with a full stop, so the revert passed it; the line ends in a brace now.
  - **Edges.** A block ends at the first line that is only `}`, at column 0. The docs in the current requests are indented, so a `}` inside one never sits there. Whether a `docs` block still describes its endpoint stays a review job, as the plan row says. `bruno/bruno.json` isn't a `.bru` file and isn't read; `environments/local.bru` has no `docs` block.
  - **Checks.** `npm run typecheck`, `npm run lint` (its `check:docs` step reports no hits, and the known `coder.md` one is gone), `format:check` and `test:unit` pass: 399 server tests, 446 client, 94 script tests. `npm run test:e2e` wasn't run: only checker code and its tests changed.
- **2026-10-22, Nathan's answers before the Reconciler run (Test Planner):**
  - **A column with a missing start or end:** what the code does is the rule, with no code change; the Epic 8+ rework of columns revisits it. The PO writes §9 from the Architect's facts.
  - **Tests for the new cases, and the doubt whose line moved:** the run proposes and maps; it isn't preceded by a Coder step. Writing tests is the Coder's, and mapping them to the catalog and finding the gaps is the Reconciler's. ATT-9.12's and ATT-10.4's IDs, and any test they still lack, come after the run.
- **2026-10-22, the column facts and 3h's follow-up (Architect):**
  - **A column with a missing start or end:** the four facts are in Open questions, for the PO to write §9 from.
    - A read says it covers nothing, which matches Nathan's ruling, so nothing goes back to him.
    - "Missing" includes an end in another workflow.
    - Only a direct database edit makes one.
    - The board takes no drop into it, so deduction a holds.

    One new fact for the PO: the column's "+ Add item" form still creates in its stored start, when that start is the workflow's.
  - **3h's follow-up:** `documentation-standards.md`'s `bruno/` row and "What the checker checks" now say the checker reads a request's `docs` block as Markdown. Every Open question for the Architect is done again. The status line had stayed at "3h is next"; it now says batch 4 is next.
- **2026-10-22, boards-columns-unsorted §9 written (PO):** from the Architect's facts, under Nathan's ruling that what the code does is the rule. Every fact matched Nathan's earlier ruling, so nothing went back to him. Deduction a holds, as the Architect confirmed. The Open questions list each change, and no section number changed. The "+ Add item" form stays off the page: no page states it for any column, and existing rules decide what its create does.
- **2026-10-22, the Test Planner's pass on §9 (Test Planner):** BCU-2.8 is retitled for a column whose start comes after its end, and BCU-2.9 is new and `Open`, for a column with an end outside the workflow. The drag cases already cover "takes no drop" for any broken column. With §9 written, every folder of the catalog is ready for the Reconciler.
- **2026-10-22, the Reconciler's run (Test Planner):** five instances, one per folder. No case lost its test to batch 3's moves, and no test title carries an unknown ID. BCU-1.5 and TREE-3.9 moved to `Automated`; ATT-4.11 and DRAG-6.1 moved to `Open`, since their revised text asks more than their tests assert. 78 Automation lines were re-pointed after the moves.
  - **Three behaviors the runs found, which no rule states (Nathan):** the current behavior is acceptable, and none goes to the PO. The sidebar marks no tab state invalid until it has the project cap; a title-only edit leaves an attached child's drifted workphase as it is; a column edit can change its display mode and its own name.
  - **Cases the runs found missing (Test Planner):** ATT-11.1 and ATT-11.2 (wiki item-attachment §13, deleting an item's subtree), in a new suite; ATT-5.12 (a cross-project reparent on one workflow that leaves the item Free and names a workphase); DRAG-6.15 (a reload that lands mid-drag stops the drag); TREE-1.13 (the sidebar's top level for a subtree already taller than the project cap). All are `Open`. DRAG-6.15 and TREE-1.13 have no test and are on Story 10's list. ATT-11.1 and ATT-5.12 have route tests that carry no ID, and ATT-11.2 has only a client test.
- **2026-10-23, Nathan's rulings on the run (Test Planner):** the internal tests for DRAG-2.9, 3.5, 1.14 and 6.6 are approved. DRAG-2.9's and DRAG-6.6's reverse the declines at A3's batch 3 review, which predated the client-rule category. The Coder's step after the run is tests only, for what the code already does; a case whose test finds otherwise goes to Story 10, or to the story that owns the code. Batch 4 lists the step.
- **2026-10-23, IDs on passing tests (Nathan):** a passing test that needs only its case's ID gets it now, and so does a client test that needs one more assertion. Tests that check a fine-tuned drag wait for Story 10. Batch 4's Coder step lists both; Story 10's entry lists what waits.
- **2026-10-23, `PUT /items/:id`'s `agentId` (Nathan):** fixed in this story, in the Coder's step after the run, under the convention that a write naming a row that doesn't exist is refused with a 400.
- **2026-10-23, batch 4a, the Coder's step after the run: the item tests (the Coder).** Test code only; no production file changed. This covers Batch 4's item-attachment and item-positioning items that are route tests. The server tests for boards, columns and projects, the client tests, the two E2E tests and the `agentId` fix are the next sub-batches.
  - **ATT-4.11.** The top-level test ran its accepted write by a move only. Each entry point now seeds its own chain, since an accepted write takes its item out of it, and asserts the refusal, then the acceptance with the parent stored as null.
  - **ATT-9.12.** The create-and-move test takes the ID. It now makes the case's two moves, `R`'s (left Free) and `X`'s (left attached to `A`), where it attached a new item `F`, and reads `R` and `X` before and after. It no longer asserts that every refusal carries the move's exact message: wiki item-attachment §2a doesn't say the writes share one, and the Test Planner left it out of the case on purpose, so each refusal matches the message instead. That reverses a pin batch 3d added.
  - **ATT-10.4.** The missing-row create test takes the ID and a create naming the missing project with `P` as the parent, which the route answers with the same project message.
  - **ATT-5.12.** The same-workflow reparent test takes the ID and a title that claims what it does. It said it also made a re-file, which it never did. It now asserts the parent and the Free state, which the case states.
  - **ATT-11.1.** The two existing delete tests assert part of the case: no list read, no `Q`, no delete from the middle. The chain test takes the ID. The detached-descendants test became the case's own tree, deleted from `P` and from `A`, with `Q`, `P`, `D` and `D1` compared before and after the second. The old test's detached child had no workphase and the case's has one; the delete walks `parentId` only, so nothing depends on it.
  - **Tests that couldn't fail.**
    - **TC-2.23:** the ID is on `items.hierarchy.test.ts`'s re-attach test, where `S1` at `1.0` beside `S2` makes a re-append give `3`. `items.positioning.test.ts`'s own test had one child, so it gains a sibling after it.
    - **TC-2.25:** the child is pinned at `0.37`, which neither a re-placement among its siblings (`1.0`) nor one among the workflow's items (`2`) gives.
    - **TC-5.1, TC-5.4:** In Progress's item is created first and a Todo item sits at `6.0`, past it. Neither insertion order nor Todo-before-In-Progress gives the order by position, `T1, T2, P1, T3`, so the combined order is what the test proves.
    - **TC-2.4:** the `A after C` test takes the ID, with `C` at `3.4`, so the append is `4`, not `4.4`.
    - **TC-2.9:** the ID is on the cross-column API spec's 3.b, where `E`'s true predecessor `D` is unseen in the column and `C` lands at `4.5`.
  - **Shown to bite.** Thirteen source mutations, each caught by the test named for it:
    - PUT refusing a top-level move (ATT-4.11);
    - the missing-workphase check skipped in a move and in a create, and a refused move still touching the row (ATT-9.12);
    - a parent's project winning over the create's (ATT-10.4);
    - a delete that leaves detached descendants, one that takes the whole project, and one from the middle that takes the parent's subtree (ATT-11.1);
    - a same-workflow reparent counted as crossing (ATT-5.12);
    - a re-attach counted as a scope change (TC-2.23), a cascade that re-places its child (TC-2.25), an unrounded append (TC-2.4), and a reindex in creation order (TC-5.1 and TC-5.4).

    The HEAD version of each of the last four tests, run under the same mutation, still passes: those were the ones that couldn't fail.
  - **Checks.** `npm run check` passes: 400 server tests (ATT-11.1's old test is two now), 446 client, 94 script. `check:docs` reports no hits. The cross-column API spec passes with its new title. `npm run test:e2e` wasn't run, since no E2E test changed but a title.
- **2026-10-23, batch 4b, the Coder's step after the run: the boards, columns and projects tests (the Coder).** Test code only; no production file changed.
  - **BCU-2.9.** A describe of two route tests, over the case's setup (`A` from `W1` to `W3` with no name, `C` on `W4`, an item in each of `W1`, `W2` and `W3`, and `V1` of another workflow). The first makes each of the case's three changes by a direct write, and asserts that `A` is `broken`, covers and shows nothing, is named "(empty range)", leaves `W1`, `W2` and `W3` and their items in `uncovered`, and that `C` isn't broken. The second sets `A`'s end to `V1` and fixes it with an edit to `W1`–`W3`. The third variant, an id that names no workphase, needs foreign keys off for the write, as the test reset does, so `setColumnEnds` turns them off around it and back on.
  - **BCU-2.8.** The test takes the case's title. Its assertions are unchanged.
  - **BCU-2.3.** The test no longer asserts the new column's `position`, which isn't in the case. That was the only assertion of the append math for columns, so it is a test of its own: two new columns take `1.0` and `2.0`.
  - **BCU-1.2.** "Nothing changes" is the board read after the refused delete equalling the board read before it. It was a count of two columns.
  - **TREE-3.9.** The refused create matches the cap's message, as TREE-3.5's does, so the refusal is tied to the rule it proves. `pastCap` moved to the file's top to be shared.
  - **TREE-9.1.** The surviving project is compared with a read taken before the delete (its project, workflow, board and item), where each was only found. It passes, so the delete doesn't touch another project's rows, siblings' positions included.
  - **Shown to bite.** Eight source mutations, each caught by the test named for it:
    - a column with one end outside covering the end that is left;
    - such a column not flagged broken;
    - such a column not named "(empty range)";
    - an edit that can't repair it;
    - a new column always placed at `1.0`;
    - a refused board delete that changes a column;
    - a project create refused with another message;
    - a project delete that renames another project's item.

    The HEAD versions of the tests for the last three, and BCU-2.3's, pass under the same mutation.
  - **Checks.** `npm run check` passes: 403 server tests (BCU-2.9's two and the column-position test), 446 client, 94 script. `check:docs` reports no hits. No E2E test changed.
- **2026-10-23, batch 4c, the Coder's step after the run: the client tests (the Coder).** Test code only; no production file changed. The two E2E tests (ATT-11.2, and DRAG-6.6's board half) and the `agentId` fix are the next sub-batches.
  - **Two tests gain an assertion, as the plan says.**
    - **DRAG-6.1:** the band-drop test reads the list while the write is pending. `X` is drawn at the anchor the request carries (`A, X, B, C` for the top band, `A, B, X, C` for the bottom), and its position is still `4`. The title is `DRAG-6.1, TC-2.28:`, so TC-2.28 stays on it.
    - **DRAG-6.11:** once the item's `completedAt` is stamped later than the others', it is still last. No source mutation fails only this assertion: it states the case's second half, and the first expectation already fails for any wrong sort of a missing `completedAt`.
  - **IDs on tests that already passed.** DRAG-6.2 (`TC-2.30, DRAG-6.2:`), DRAG-6.9, DRAG-4.12 on `dragRequest.test.ts`'s attach test and `popSession.test.ts`'s childless-Card test, and DRAG-3.11 on `itemListOps.test.ts`'s TC-2.30 test. The request halves, which leave each case `Open` for Story 10, are DRAG-1.24, DRAG-3.23, DRAG-3.24 (the DRAG-3.12 test) and DRAG-6.7 (both stale-response tests). DRAG-6.6's request half needed nothing: `dragRequest.test.ts`'s test already began with its ID.
  - **The approved internal tests.**
    - **DRAG-2.9:** `dragClassification.test.ts`'s cycle-forming test takes the ID.
    - **DRAG-3.5:** the first two `bandFor` tests take it, and a new `reservationFor` test covers the part nothing tested: with two or more cards the dead zone is `(heightPx + gapPx) / 2` tall and the divider `heightPx` in, from the metrics alone.
    - **DRAG-1.14:** a new test that with `popDistancePx` at 0 a cursor far outside pops nothing until `popDelayMs`, where the two existing tests have a distance above 0.
  - **A test under the wrong ID.** "marks nothing invalid while the cap is unknown" is in its own describe, "before the sidebar has the project cap", and the chain it shares with TREE-1.11's describe is a constant above both. A comment says no wiki rule states what it pins; the Reconciler's report raises that as a question for the PO.
  - **Shown to bite.** Four source mutations, each caught by the test named for it: marking an item pending giving it a position (DRAG-6.1), a distance of 0 read as a 100px default (DRAG-1.14), the dead zone ignoring the gap (DRAG-3.5), and the divider of a two-card region sitting `heightPx + gapPx` in (DRAG-3.5). The HEAD versions of the DRAG-6.1 test, the two DRAG-1.14 tests and the `bandFor` tests miss the first three. The other IDs are on tests whose assertions did not change, so there is nothing to mutate.
  - **Checks.** `npm run check` passes: 403 server tests, 448 client (the two new ones), 94 script. `check:docs` reports no hits. No E2E test changed.
- **2026-10-23, batch 4d, the Coder's step after the run: the two E2E tests (the Coder).** Test code only; no production file changed. The `agentId` fix is the last sub-batch.
  - **ATT-11.2.** On a board with `P` in Todo, with an attached child as a Stub and a detached child in In Progress, and a bystander Card in each column, the test opens `P`'s panel and deletes it. With no reload of the page (a value set on `window` survives), the three items have no row on the board and each column lists only its bystander. A fresh load of the board then shows the same, so the server deleted what the board dropped.
  - **DRAG-6.6.** The server has `X` in Review, which the open board doesn't know, so it still draws `X` in Todo. The move that drags `X` into In Progress's bottom band is answered with a 400. The test waits for that response and for a read of the board, and then expects `X` in Review, not pending, with Todo no longer holding it and In Progress still `A, B, C`. The item sitting somewhere the board had never drawn it is what tells a resync from a dropped guess.
  - **Shown to bite.** Six source mutations, five caught by the test named for each:
    - the board removing the Card and keeping its descendants;
    - the board removing only the attached descendants;
    - the board removing every Card;
    - the server deleting only the attached descendants, which only the fresh load catches;
    - a refused drop that doesn't reload the board.

    The sixth, a refused drop that keeps its previewed placement, isn't caught and can't be: the reload replaces every placement, so the board ends the same either way. `dragRequest.test.ts` asserts the request half, that the write fails and the board resyncs.
  - **Checks.** `npm run check` passes: 403 server tests, 448 client, 94 script. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there. `check:docs` reports no hits.
- **2026-10-23, batch 4e, the Coder's step after the run: `PUT /items/:id`'s `agentId` (the Coder).** The one production change in the step, the fix Nathan placed here.
  - **The fix.** `routes/items.ts`'s edit answers 400, "agentId does not reference an existing agent", for an `agentId` that names no agent, as `POST` does since #47. The check follows the hierarchy check and precedes every write, so nothing in the edit is applied, the title and assignment included. `null` still clears the agent.
  - **The test.** `items.test.ts`'s "returns 400, not an opaque FK 500, for an agentId that names no agent, and changes nothing" carries no case ID, since no wiki page covers the agent field. It sends a title and an assignment with the missing agent, expects the 400 and the item, activity included, read as it was before, then assigns a real agent and clears it with `null`. Run before the fix, it failed with the 500 the audit described.
  - **Shown to bite.** Four mutations, each caught: the check removed, a refused edit having already written the title, `null` refused as an agent that doesn't exist, and an agent that exists refused.
  - **Not changed.** The `''` edge above. No Bruno docs line: `create-item.bru` doesn't state its reference refusals either.
  - **Checks.** `npm run check` passes: 404 server tests, 448 client, 94 script. `check:docs` reports no hits. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there.
- **2026-10-23, the last open questions for Nathan and the Architect (Architect):** every Open question addressed to Nathan, the PO, the Test Planner or the Architect is answered or done.
  - **`AttachGhostRow`:** it stays apart from `AttachedChildRow`, with no follow-up (Nathan).
  - **`agentId: ''`:** moved to `api-contract-zod-openapi.md`'s new Inbound deferrals section, where Story 2's request schemas decide what an empty string means for every optional id (Nathan).
  - **`setColumnEnds`:** `testing-strategy.md`'s server-test line names all five direct-write fixtures (Architect).
  - **Still open:** the Reconciler's re-check of batch 4a–4e's tests. Its five reports already answer the earlier items addressed to it, and the plan marks them answered once the re-check is done.
- **2026-10-23, the memory pass (Architect):** D1's three audit memories now point to `audit-workflow.md` instead of restating it. Every rule D1 lists is in the guide: cadence and cleanup refactors in §1, the range from tags in §2, cold passes in §3, structural findings off the Watch List in §6, batches and probes in §8, and the Close-out table in §9.
  - What each memory still holds, because no guide says it:
    - `story-audit-cadence`: that "N.1" was renamed "cleanup refactor", so the roadmap's Story 6.1 is one.
    - `audit-scope-from-tags`: the incident behind the rule, and that this run's base was a one-off.
    - `audit-fix-batches`: why Nathan wants batches, and that the Architect writes the batch plan into the story plan for a Coder session to work.
  - `audit-run-sizing` was never one of D1's three. It holds the usage-limit waves, which aren't a process rule, and it's unchanged.
  - Acceptance's "The guide holds the rules" is met.
- **2026-10-23, the Reconciler's re-check (Test Planner):** every case the Coder's step meant to close is `Automated`: ATT-4.11, 5.12, 9.12, 10.4, 11.1 and 11.2, BCU-2.9, and DRAG-1.14, 2.9, 3.5, 4.12, 6.1, 6.2, 6.6 and 6.11. DRAG-1.24, 3.11, 3.23, 3.24, 6.7 and 6.9 stay `Open` for Story 10, each missing only its on-screen half. No case lost its test, and no test title carries an unknown ID, whatever its prefix. DRAG-6.6's line names only its E2E test, which proves the whole case. The catalog stands at 350 cases: 279 `Automated`, 64 `Open`, 4 `Manual`, 1 `Planned` and 2 `Pending PO`.
- **2026-10-23, the last two rulings for Nathan (Test Planner):** `AttachGhostRow` and `AttachedChildRow` stay apart, with no follow-up. `PUT /items/:id` handles `agentId: ''` the way the other writes handle an empty-string id, as a last Coder item (Batch 4). Every Open question for Nathan is answered.
- **2026-10-23, batch 4f, after the re-check: the Coder's last two items (the Coder).** One production change, one test fix.
  - **`PUT /items/:id` and `agentId: ''`.** The edit answers 400, "agentId does not reference an existing agent", for an empty string, as it does for an agent that doesn't exist. The check is `agentId !== undefined && agentId !== null && …`, the shape `POST` uses for `type`: `null` still clears the agent, and a body with no `agentId` still leaves it alone. `POST` is untouched (Open questions).
  - **Its test** is 4e's, now looping over `'no-such-agent'` and `''`: each gets the 400 and the item, activity included, reads as it did before. No case ID.
  - **`positionResolver.test.ts`'s no-position test** (the re-check's concern 1) passed the scope `eq(items.workphaseId, 'anything')`, so it threw "could not find id" before it reached the no-position branch, and its bare `.toThrow()` couldn't tell. It passes the item's workphase now and matches `/does not have a position/`. The title had already lost its TC-2.8 ID in the working tree when I got to it, by another hand, and I left that.
  - **Shown to bite.** Five mutations, each caught by the test it concerns:
    - the old falsy check, which lets `''` through, and which 4e's committed test missed;
    - `null` refused as an agent that doesn't exist;
    - the check removed;
    - an agent that exists refused;
    - the resolver's no-position throw removed, which the old items-table test missed, since the scope miss threw anyway.
  - **Not done, because nothing routed them to the Coder:** the re-check's concern 2 (PO:110's fixture), concern 7 (the header of `itemRepositioningAttachedSiblings.spec.ts` still claiming TC-2.4), and the two optional pointer drops from TC-2.4's and TC-2.9's lines.
  - **Checks.** `npm run check` passes: 404 server tests, 448 client, 94 script, with no `check:docs` hits. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there.
- **2026-10-23, batches 5 and 6 added (Auditor, at Nathan's direction):** the audit runs again over batches 3 and 4 before this story closes (Batch 5), and its fixes land here (Batch 6). The archive moved from batch 4 to batch 6. The Coder landed 4f first, so the re-run's range takes it in.
- **2026-10-23, batch 5 (Auditor): the re-run.** The report is `docs/audits/code-quality-audit-a6-rerun.md`, over `a6-audited..b315a29`; its scope lists are in `docs/audits/a6-rerun-scopes/`, deleted before the report is archived. The 19 instances ran five at a time, across two usage limits. Every finding the first run's Close-out marks fixed is fixed in the code. What the fixes left is most of the report: one regression (#1, from the first run's #36), five fixes that stopped one site short (#13, #14, #20, #21, and #17's misplaced tests), and the comments the moves made stale. The first run's #43–#45 recur with new evidence, and their routes hold; adding the evidence to their destinations waits for Nathan (Open questions).
- **2026-10-23, batch 6's instructions drafted (Auditor, at Nathan's direction):** Nathan asked whether the audit's cost was worth it after the re-run, and approved three changes: a file whose only change is its imports goes to the drift pass alone; moved code and removal sites go into the scope lists, as the re-run's prompts had them; and a file is read whole only when it changed enough for its shape to matter, since that's what whole-file reading is for (Nathan: more likely in a story than in a fix of a few lines). The drafts are in `a6-batch-6-drafts/`, with batch 3's two open instruction candidates folded in.
- **2026-10-23, batch 6's instructions, a second round (Auditor, at Nathan's direction):** Nathan rated the re-run's Fix Now findings by whether they'd be agreed improvements, and decided three things. Comment conventions aren't an audit concern: they're for whoever writes the code, and an audit flags a comment only when it's wrong or misleading. A structural finding is usually a judgment call, so it may go on the Watch List or be Informational; the rule that it be Fix Now or nothing came from one carried split (`useBoardDnd`), and the third-consecutive-audit rule already covers that. And an optional finding beside a Fix Now keeps its tier with a ride-along note, for the batch planner to pull in. The drafts now include `code-comments.md` and `documentation-standards.md`.
- **2026-10-23, the re-run's report re-tiered (Auditor, at Nathan's direction):** under the second round's three rules, ahead of batch 6. Fix Now went from 23 to 17. #3 (the backfill, which no current data can trigger) and #17–#19 (test placement and two large test files) moved to the Watch List; #22 and #23 to Informational; #15's and #16's judgment-call parts became #44 and #37. 16 convention-only items left the drift findings, and six wording items became Informational (#38–#43). Optional findings in files a Fix Now changes carry a "can ride along" note. Numbers were kept, so the references above hold.
- **2026-10-23, the re-run's routes landed (Auditor, at Nathan's direction):** #12 (`Item.positionScope`) is deferred to `positioning-on-create-and-edit.md`'s Inbound deferrals, since its Decision 8 redefines the field. #24 and #25 are sub-bullets under the first run's #45 and #44 in `epic-4-decisions.md` §12, and #26 is one under Story 10's item 7. The report's Close-out records each; Fix Now is 16.
- **2026-10-23, empty-string ids (Architect, on Nathan's answer):** the plan held two answers on `agentId: ''`, batch 4f's fix and the Architect's deferral to the API contract epic. Nathan settled them: whichever makes the code consistent.
  - **4f stands**, since every other write refuses an empty-string id with a 400.
  - **`POST /items`'s two exceptions** follow it in batch 6's code, as one item outside the report: `agentId: ''` and `parentId: ''`.
  - **The deferral is withdrawn.** `api-contract-zod-openapi.md`'s Inbound deferrals section is gone, since it held only this item.
  - **For the PO, in Open questions:** whether a page states that an empty-string id names no row, for the Test Planner's cases.
- **2026-10-23, batch 6's instructions, a third round (Architect, on Nathan's answers):** Nathan applied the Auditor's drafts. The Architect's review raised six points, and Nathan took five of them.
  - **Applied to `audit-workflow.md` and `auditor.md`:** no audit reads an earlier one; a pass's limits are on reading, not reporting; §6's structural sentence is reworded.
  - **For the scope script,** a new Coder item in batch 6: a moved line traces to before the base, and deleted and renamed paths are listed.
  - **Still open:** whether moved, unchanged code is an audit concern at all.
  - **The README's four judgment calls stand as drafted:** the threshold of 10 lines, the waves sentence, imports-only files going to the drift pass, and where "wrong or misleading" stops.
- **2026-10-23, moved code, and batch 6's code planned (Architect, on Nathan's answers):**
  - **Moved, unchanged code leaves the audit.** It was audited when it was written, and tests prove the move. A copy still counts as changed, and a move's source side stays a removal site. The scope script's spec says so, and the `.claude/` changes follow once the script lands.
  - **Batch 6's code is six batches, 6a–6f:**
    - client correctness;
    - server source;
    - server tests;
    - client structure;
    - E2E;
    - scripts, with the scope script.
  - **Picked from the ride-along notes:** #17, three of #37's fixtures, #23, #38, #39, #41 and #42, each in a file its batch already changes.
  - **Left out:** #3 and #27, since each would turn a comment-only file into a code change.
  - **#29** closes as fixed in 6b, not Covered by, now that its deferral is withdrawn.
- **2026-10-23, the scope script's starting point (Architect, from the Auditor):** the Auditor saved the re-run's two Python scripts to `a6-batch-6-drafts/scope-scripts/`, with a README of their gaps and the git details they learned. It recommends a port to `.mts` under `scripts/`.
  - **6f's spec now says:** port rather than adopt; check the port's changed-line and removal-site lists against `a6-rerun-scopes/`; sort lines with the checker's TypeScript parse; take the area groups and instances as a per-run config; write the scope files the way §2 gives them out.
  - **The scripts already apply the boundary rule** the Architect's review raised: a line is moved only when its traced blame lands on the base. The ambiguity was in the guide's wording, not the implementation.
  - **Close** deletes `a6-batch-6-drafts/` too. Its `scope-scripts/` stays until 6f lands.
- **2026-10-23, batch 6a, client correctness (the Coder): #1 and #5.** One production change, two test files. The Close-out rows for #1 and #5 are filled in.
  - **#1.** `useColumnManagement.ts::onColumnDrop` takes a third argument, `resync`, and calls it where it called `reload` when the save fails. `useBoardDnd.ts`'s `handleDragEnd` passes `resyncBoard`, as the column drop did at `a6-audited`, and `BoardDndDeps.onColumnDrop` carries the signature. A failed column reorder that lands during an item drag now ends that drag before the reload. The report's other option, ending a live session on every board reload, isn't taken, for the reason in Batch 6's table. `resyncBoard`'s comment names the column reorder among the reloads that can land mid-drag.
  - **Its tests.** `useBoardDnd.test.ts` is new, the hook's first test file. It renders the hook on a board with no columns, which starts a drag in no context.
    - One test holds a column drop's save in flight, picks up an item, then fails the save. It expects the session gone, the ghost cleared, one reload, and a release afterwards that sends no move.
    - The other drops with no drag live and expects the reload.
    - `useColumnManagement.test.ts`'s failure test expects the `resync` it is given to be called once and its own `reload` not at all.
  - **#5.** That test restores its `console.error` spy, as `dragRequest.test.ts` does.
  - **No case ID** on the new tests (Open questions, for the Reconciler).
  - **`workflow/CLAUDE.md`** says the column drop is handed `resyncBoard`, and its testing conventions name the new test file.
  - **Shown to bite.** Five mutations, each caught by a new test:
    - `handleDragEnd` handing the column drop a bare reload;
    - `resyncBoard` not ending a live drag;
    - `resyncBoard` ending it without reloading;
    - `onColumnDrop` reloading by itself, the regression as it was, which the committed `useColumnManagement` test passed;
    - `onColumnDrop` swallowing the failure.
  - **Checks.** `npm run check` passes: 404 server tests, 450 client, 94 script, with no `check:docs` hits. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there.
- **2026-10-23, batch 6b, server source (the Coder): the `POST /items` item outside the report, #15, #6, #38 and #39.** One behavior change, one deleted check, and comments. The Close-out rows for #6, #15 and #29 are filled in.
  - **`POST /items` and empty-string ids.** `parentId: ''` and `agentId: ''` answer 400 ("parentId does not reference an existing item", "agentId does not reference an existing agent") and create nothing, where each was stored as none. `parentRefusal` takes `parentId ?? null`, the agent check is `agentId !== undefined && agentId !== null && …` as `PUT`'s is, and the insert writes `parentId ?? null` and `agentId ?? null`. `null` still says none.
    - A create with `parentId: ''` and no `projectId` answers with the parent's refusal now, where it answered "projectId is required".
    - Nothing in the client, the E2E helpers or the Bruno requests sends either. An MCP `create_item` with `parent_id: ''` gets the 400.
    - #29 closes as fixed, as Batch 6's table says.
  - **Its test** in `items.test.ts` refuses `parentId: ''` with a `projectId`, the same without one, and `agentId: ''`, each with its message and no row created, then creates with both `null`. No case ID (Open questions).
  - **The Bruno `docs` blocks** for Create Item and Update Item each gain one sentence: an id or `null` for none, and an empty string is a 400. The ownership table gives a request's docs to whoever changes its endpoint.
  - **#15.** `PATCH /projects/:id/move` drops its own `parentId` type check. `parentError` makes the same check, with the same message, for the create, the edit and the move. No test covered it, so `projects.test.ts` gains one for the edit and the move; it would have passed with both checks gone before.
  - **#6.**
    - `workflowItems.ts`: `effectiveWorkflowIdForProject`'s comment says the foreign-workphase check compares a workphase's workflow against it, and the cross-workflow check one project's against another's.
    - `projects.ts` and `workflows.ts`: each DELETE comment is one line naming its `lib/` cascade.
    - `positionResolver.ts`: `anchorRefusal`'s contract moves from `AnchorRefusal` to the function, with "this order" now naming the type's members.
    - `runMigrations.ts`: the header and the section comment say the items move only when some workflow had no project. #3, which would move the `UPDATE`, stays on the Watch List.
  - **#38 and #39,** which sat beside #6's files: `items.ts`'s comment on the type and agent checks, and `workflows.ts`'s on which items get a `positionScope`.
  - **Shown to bite.** Five mutations, each caught by a new test and passed by the committed ones:
    - `POST` reading an empty `parentId` as none;
    - `POST` letting an empty `agentId` through;
    - `POST` refusing a `null` agent;
    - `POST` refusing a `null` parent;
    - the project routes' `parentId` type check removed, which no committed test noticed.
  - **Checks.** `npm run check` passes: 406 server tests, 450 client, 94 script, with no `check:docs` hits. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there.
- **2026-10-23, batch 6c (1 of 2), the server fixtures (the Coder): #4, #16 and #37's three fixtures.** Test code only; no production file changed. The server still runs 406 tests, under the same titles. The Close-out rows for #4 and #16 are filled in. 6c (2 of 2) is #17's moves and #10's comments, with #41 and #42.
  - **#4.** TC-1.1 drops its refused `createColumn(boardTwo…)`: the default board predates `todo` and needs a column over it, and a board made after `todo` is bootstrapped with one, which the test now says. `fixtures.ts`'s `create*` helpers assert their status through one private `created`, naming the request and the response body when one is refused. The old TC-1.1 was the one refused setup call in the suite, and it fails against the new fixtures at that line. `items.hierarchy.test.ts::createChain` drops its by-hand `toBeDefined` checks and the comment about them.
  - **#16.** `getRow`, `move`, `put`, `countItems` and `setupWorkflow` move from `itemHierarchyFixtures.ts` into `fixtures.ts`. The file keeps `hierarchyEntries` and `cardWithTwoStubs`, which only hierarchy tests use, and its header says so.
    - `items.positioning.test.ts`: its copy of `move` is gone, and its 19 hand-rolled moves and 5 edits call `move` and `put`.
    - `items.attached.test.ts`: `countItems`, `getRow` for its two row reads, `setupWorkflow` for three setups, and `setItemParent(id, null, true)` for the flag TC-2.17 writes.
    - `items.test.ts`: `getRow` for `rowOf`, `countItems` for eight count reads. `testHelpers.test.ts`: `getRow`.
    - The board reads: `workflows.test.ts` (three) and `workphases.test.ts` (one) call `readBoard` and `columnOn`. `items.crossProject.test.ts` reads `invalidItems` through `readBoard`, which put `positionScope` on `BoardBody`'s items.
  - **#37's three fixtures.** `setItemWorkphase` replaces nine hand-written row updates (`items.workphase.test.ts` four, `items.attached.test.ts` two, `workflows.test.ts` one, `boards.test.ts` two). `createAgent` and `createItemType` replace the by-hand posts in `items.test.ts` (three and two). #37's extra-boards option stays on the Watch List.
  - **Shown to keep its bite.** The committed server tests and the current ones were each run against the same ten production mutations, and failed the same tests every time: the project check on `POST /items` off; the agent check on `PUT /items/:id` off; the cross-workflow rule off; an append 2 past the last; the depth cap one too generous; an item in another workflow's workphase not counted invalid; a workflow read giving every item a position scope; a parent's workphase move not reaching its attached children; a detach reading the stored workphase, not the one it was shown in; and a create under a parent reading the parent's stored workphase. `setItemWorkphase` writing nothing fails four tests. The drift setups in `items.workphase.test.ts` are not among them, since a stored copy equal to the shown one passes too: they exist for the last two mutations, which both trees fail.
  - **Checks.** `npm run check` passes: 406 server tests, 450 client, 94 script, with no `check:docs` hits. `npm run test:e2e` wasn't run: no production file changed.
- **2026-10-23, batch 6c (2 of 2), the item tests' files (the Coder): #17, #10, #41 and #42.** Test code only; no production file changed. The server still runs 406 tests. The Close-out row for #10 is filled in. This closes 6c; `testing-strategy.md` is the Architect's next (Open questions, 6c's note).
  - **#17: ten tests change files, keeping their titles and case IDs.**
    - Both ATT-4.10 parent-legality tests go from `items.attached.test.ts` to the shared-guards describe in `items.hierarchy.test.ts`.
    - ATT-5.1 (from attached) and ATT-5.2 (from hierarchy) go to `items.crossProject.test.ts`. ATT-5.12 moves up out of "across workflows", and with TC-2.24 gone every test left in that describe is about workflows.
    - TC-3.4 and TC-2.17 (from attached) and TC-2.24 (from crossProject) go to `items.positioning.test.ts`.
    - ATT-9.8 and ATT-9.9 (from crossProject) and the hierarchy file's ATT-9.1 go to `items.workphase.test.ts`. That file's describe, "the workphase a write leaves an item in", becomes "the workphase a write gives an item", since a create that names a foreign workphase is in it now.
    - A moved test's `request(app).put(…)` or `.patch(…/move)` becomes `put` or `move`, where the destination file uses those. Nothing else in a body changed.
    - The headers of `items.attached.test.ts`, `items.crossProject.test.ts` and `items.workphase.test.ts` say what each now holds.
  - **#10, #41 and #42.**
    - `fixtures.ts`: `workflowWithPhases`'s comment says only what it does (most of its callers don't build column ranges, and it isn't the one place that relies on the board predating the workphases); `setProjectParent` has its own comment again. `BoardBody` and `ResolvedColumn` drop `itemDepthCap` and `entryWorkphaseId`, which no test reads through them, so "narrowed to the fields the board tests read" is true.
    - `positionResolver.test.ts`: the second-table comment sits above the projects-table describe it describes.
    - `items.positioning.test.ts`: `siblingOrder` is named at `tests/helpers/itemRepositioningScenario.ts`, and T3 lands on an integer too.
    - `itemTree.test.ts`: ATT-4.6's last line needs a cap of at least 2, and the comment says so.
    - `boards.test.ts`: the first test's title says the board has no columns.
  - **Shown to keep its bite.** The committed server tests and the current ones were run against seventeen production mutations, and failed the same tests every time: the ten from 6c (1 of 2), and seven for the moved tests: a workphase of another workflow accepted; a flag on a parentless item reading as attached-siblings; a parent that names no item accepted; a cross-project reparent leaving the subtree in its old project; an attached child under a parent with no workphase getting no position; an attached item allowed to name a workphase other than its parent's; and a reparent within one workflow treated as crossing workflows. The 406 titles are the same set, apart from the one retitle.
    - Five of the seventeen first showed large, unrelated differences between the trees, and agreed on a rerun. Another session was probably using the shared test database; the extra failures (182 against 1, for one) were not the mutation's.
  - **Checks.** `npm run check` passes: 406 server tests, 450 client, 94 script, with no `check:docs` hits. `npm run test:e2e` wasn't run: no production file changed.
- **2026-10-23, 6c's follow-up (Architect):** `testing-strategy.md`'s server-test lines, for #16 and #37's fixtures (Open questions, 6c's note). Guide only. The status line had stayed at "6a–6f is next"; it now says 6d is next.
- **2026-10-23, batch 6d, the client structure (the Coder): #13, #14, #20, #7, #8 and #9.** Two shared functions in `lib/hierarchy.ts`, one test call moved onto its fixture, and comments. The Close-out rows for all six are filled in.
  - **#13.** `getSubtree(id, nodes)` returns `{ descendantIds, subtreeIds, height }` from one walk, with the cycle guard in its one loop.
    - `classifyDragTargets` and `useProjectDragReorder` call it, and their inline `levels.flat()`, `levels.length` and `[activeId, ...descendantIds]` are gone. The sidebar drag's `exclude` is the subtree's own ids.
    - `getDescendantLevels` and `getSubtreeHeight`, which only tests called, are deleted. `getDescendantIds` reads `getSubtree`, and `buildParentOptions` excludes its `subtreeIds`. The sets are `ReadonlySet`s.
  - **#14.** `sortedChildrenByParent(nodes)` is exported beside the private, unsorted `childrenByParent`, and keys a node whose parent isn't in the list as a root.
    - `buildParentOptions` calls it on the nodes left after its exclusion. The output is the same: a node under an excluded one is itself excluded.
    - `flattenTree` and `fullChildrenOf` in `projectTreeUtils.ts` call it, and that file's copy is deleted.
    - **One behavior differs, in a case the foreign key makes unreachable:** a project whose parent is missing from the list was hidden from the sidebar's tree. It is a root now, as the dropdown has it.
  - **Tests.**
    - `hierarchy.test.ts`: the `getSubtreeHeight` cases move to a `getSubtree` describe (a leaf, an unknown id, a cycle), and two new cases hold its sets. `getDepth` keeps its own describe. `sortedChildrenByParent` gets three: grouping and order, a missing parent, and not reordering its input.
    - The comment above them, which said `getSubtreeHeight` feeds the board and the sidebar, says what `getDepth` and a subtree's height feed (#9).
    - The sidebar's missing-parent change has no test of its own. `projectTreeUtils.test.ts` stays comment-only, and `sortedChildrenByParent`'s missing-parent case holds the rule both consumers read.
  - **#20.** The DRAG-1.7/DRAG-1.8 case calls `step(startPopSession(A.key), inA, 0, withCards, { anchorId: 'invalid', side: 'after' })`.
  - **#9.** `popSession.test.ts`'s two titles say `popDelayMs`, and `dragTuning.ts`'s comment drops the `THRESHOLD` alias. `itemFixture.ts` names the three cases the API gives `'none'`: a terminal workphase, no workphase and a workphase the project's workflow doesn't use, and points at `itemPositionScope.ts::classifyPositionScope`, not the wiki, which doesn't list them. `projectTreeUtils.test.ts` says D is first and has a descendant, as `soloItems` makes it.
  - **#7 and #8,** comments only. `KanbanCard.tsx`, `dragRegions.ts`, `itemWriteReconciliation.ts`, `BoardColumn.tsx`, `dragChrome.tsx`, `ItemDetailPanel.tsx`, `itemFixture.ts`, `projectTreeUtils.test.ts` and `dragTuning.ts` are each comment-only in this batch. `workflow/CLAUDE.md` says `dragStructure.ts`'s structure is resolved at pickup, again after a layer change, and again when a remount outdates it (`useBoardDnd.ts::resolveStructure`, `sampleRegions`).
  - **Left alone:** the `THRESHOLD`s in `drag-column-bands.spec.ts` (Open questions).
  - **Shown to bite.** Twelve mutations of the code this batch touches, each caught:
    - `getSubtree` counting a level for a leaf; leaving the node out of its subtree; putting the node among its descendants;
    - `sortedChildrenByParent` keying a missing parent under itself; leaving siblings unsorted;
    - `buildParentOptions` keeping the current node in its list, and (indented) grouping the nodes it excluded;
    - the sidebar drag keeping the dragged project among its rows, and reading the cap with a height of 0;
    - classification reading the cap with a height of 0, and not calling a descendant cycle-forming;
    - the sidebar drag dimming no descendants. No unit test reads the hook's `descendantIds`, as before this batch; TREE-2.1 (E2E) fails on it, run alone against the mutation.
  - **Checks.** `npm run check` passes: 406 server tests, 456 client (six new), 94 script, with no `check:docs` hits. `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there.
- **2026-10-23, batch 6e, the E2E specs (the Coder): #21 and #11.** Test code and two files' comments. The Close-out rows for both are filled in.
  - **#21, setup.** `workflow-inheritance.spec.ts`, `workflow-creation.spec.ts`, `boards.spec.ts` and `project-page.spec.ts` create through the seed helpers, which assert their status, where they posted by hand and read the body unchecked.
    - `seedProjects` builds the inheritance spec's parent and child, with `seedWorkflow(…, 'flow' | 'quick')` for the workflow: the six template lookups in the four specs are gone (`tests/api/` has its own, for the API specs).
    - `workflow-inheritance.spec.ts` keeps the child item's id from `seedItem`, and drops the workflow read that found it.
    - `project-page.spec.ts` converts every create in the file (seventeen beyond its `beforeAll`'s three), since a half-converted file would read as an oversight. `API` is no longer imported there.
    - `item-positioning.spec.ts`'s TC-2.11/TC-5a.1 test calls `seedPositionedItems`, which owns "every item is created before any is pinned", so the comment restating it is gone. The panel-detach test below it also pins by hand but creates a Stub between the pins, so it stays as it was.
    - `itemRepositioningScenario.ts::siblingOrder` reads through `fetchItem`.
  - **#21, locators.** `workflow-inheritance.spec.ts` and `workflow-creation.spec.ts` use `column(page, name)` and `article(scope, title)`, which match the whole name; ATT-11.2 uses `article(column, title)`. `boards.spec.ts` was named for its setup only, and its locators are as they were.
  - **The test that could pass without its subject.** "item in child own workflow is not visible on parent board" created its item unchecked and asserted only an absence. It now has the item created with `seedItem`, opens the child's own board first and expects the card in Todo there, then opens the parent's board and expects it absent.
  - **#11.** `dragGesture.ts::topQuarter`'s parenthetical is gone and its one assumption is stated: the drop lands by `dropAnchorFor`'s lean, so long as the dragged item is in the hovered row's list. `drag-5-stub-detach.spec.ts` says what the reflow is at both places, where it cited a `dragTo` comment this spec never calls and that holds no such text. Both files are comment-only.
  - **Shown to bite.** The reworked test fails with the child-only item never created, where the version at HEAD, with its create removed, passes: the absence it asserted held with no item to be absent.
  - **Checks.** `npm run check` passes (406 server, 456 client, 94 script, no `check:docs` hits). `npm run test:e2e` passes: 166 passed and 8 skipped, the 8 that were there..
- **2026-10-25, batch 6f, the scripts (the Coder): #2 with #23, then the scope script.** The Close-out row for #2 is filled in; #23 rode with it.
  - **#2.** `WIKI_PAGE_PATH`'s page segment is `([^/.]+)`, so `wikiPageAt('docs/wiki/README.md')` is null, and a section after a link to the wiki index (`../README.md`) is skipped as a link to a non-page. `sectionRefs` reads a link whose target starts with `#` as the file's own page, so a section after a same-page anchor is checked against it. Three tests: the wiki README, the link to it, and the same-page anchor with a section that exists and one that doesn't. Each fix, reverted, fails the tests written for it.
    - The same-page tests write their anchor as `#depth-cap`, not the heading's own `#8-depth-cap`: the transient-id rule reads `(#8` as an audit finding number in Markdown too. That is the rule as it stands, and it applies to a wiki page that anchors to a numbered heading.
  - **#23.** `isSuiteFile`'s test moves from `repoIndex.test.mts` to `files.test.mts`, beside the function. `check.test.mts` builds the Bruno marker with `IGNORE_MD`.
  - **The scope script,** `scripts/audit-scope/`, run as `npm run audit:scope`. It ports the Auditor's two Python scripts to `.mts` and adds the rules the live guide gives:
    - **Sort table.** A file's changes are sorted over the range from its two versions. Comments and test titles only is proven by stripping both with `extractCode`'s output and comparing; imports only, by the diff touching nothing but import declarations (the TypeScript parse, multi-line ones included), removed lines too. Both go to the drift pass alone, as does an agent-instruction file. A file that received moved code goes to all four.
    - **Moves.** Bounded at the base; `-w`, `-M -C -C` and `.git-blame-ignore-revs`; a line traced to a commit in the range is changed. A run whose source still holds it is a copy, and counts as changed.
    - **Read whole.** A new file, one that received moved code, or 10 or more changed lines of code, or one the config names. The file-responsibility pass gets only these.
    - **Removal sites** come from the diff. A rename is diffed under both its paths, so the removals inside a renamed file are found; the Python's single-path diff read a renamed file as new and found none.
    - **Deleted and renamed paths** are written under their old names, to the drift instance of the group each belongs to.
  - **Checked against the re-run's range** (`a6-audited..b315a29`, 148 files):
    - the blame and diff stages match the Python's scan on every file: status, changed lines, moved lines, total lines and removal sites;
    - the scope files' changed-line and removal-site lists match `a6-rerun-scopes/`, but for the rules this batch adds. 25 files go to the drift pass alone now (comments-only, imports-only or agent-instruction files: the two `CLAUDE.md` files, `eslint.config.mjs`, `schema.ts`, `types.ts`, `dragCollision.ts` and 18 others), so the other passes' scopes lack them and the drift scopes keep them all. And five lines of `server/tests/lib/positionResolver.test.ts` (13–17, an import list that `workphases.test.ts` still holds) are changed, not moved, as a copy;
    - the read-whole lists and the deleted and renamed lists are new, so there is nothing of theirs to compare.
  - **Tests.** 75 in nine files beside the script, run in the gate: each module on plain inputs, and `scan.test.mts` over a throwaway repository with a base tag and four commits (changed code, a block moved in, a block copied, a block copied from a file a later commit renames, a rename that also drops a line, a comment-only file, an imports-only file, a deleted file, a formatting commit named in the ignore list, code the range wrote and moved, and the command line's exit codes).
  - **Shown to bite.** Forty mutations of the script, each failing a test: git's flags (whitespace, the bound at the base, the ignore list, tracing), the own-path guard, the moved and copy rules and their minimum, the hunk and name-status parsing, line kinds (titles, markers, multi-line imports, comments beside code), every branch of the sort table, the read-whole mark and its threshold, which pass reads what, the unassigned report, the config's checks and the exit codes. One survived on the first run, the whitespace inside a line in the copy comparison, and a test now holds it.
  - **Checks.** `npm run check` passes: 406 server tests, 456 client, 171 script, no `check:docs` hits. No E2E run: the batch touches no app or spec code.

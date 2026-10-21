# A6 — Audit Guidance Revisit and First Run

**Type:** tech-debt story · **Written:** 2026-09-26 by the Auditor · **Revised:** 2026-09-26 (D3's tag adopted; the replay dropped); 2026-09-30 (renumbered A6; A4's handoff folded in) · **Status:** batches 1 and 2 done (batch 1 committed as `7443721`; the first run's report written 2026-10-07); batch 3's code, in seven batches, is next (Coder) · **Sequenced:** after A4 and A5a–A5d, all closed

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

**Across the batches:**
- **A test that moves, splits or merges** (#31, #37, #39, #41) keeps its case ID at the start of its title. The test-plan Automation lines that name the old files go stale; the Reconciler run at close re-maps them.
- **Root `CLAUDE.md` is the Architect's.** A batch that moves or renames something it names (#19, #22, #24, #27, #28) lists the change in its note for the Architect, who applies it with that batch.
- **`client/src/components/workflow/CLAUDE.md` is the Coder's,** like any directory `CLAUDE.md`: #11 is fixed there, and its file list follows #36 and #37's moves.
- **The other Watch List items** (#46, #48, #49) stay optional.

### Batch 4: close

- **The Reconciler runs once** over the whole catalog, since batch 3 moves and splits test files (`story-done-checklist.md`'s tech-debt section). It also answers the items addressed to it under Open questions.
- **Every Open question is answered,** or moved to the plan that will answer it. Batch 3 fixes behavior, so this story closes by the full checklist.
- The Architect's memory pass for the three audit memories (D1).
- The report moves to `docs/archive/`, followed by this plan once it's signed off. Nathan tags the report's end commit `a6-audited`.

## Code map

| File | Batch | Change | Who |
|---|---|---|---|
| `.claude/guides/audit-workflow.md` | 1, 3 | D1–D9 | Auditor drafts, Architect applies |
| `.claude/personas/auditor.md` | 1, 3 | D1, D5 | Auditor drafts, Architect applies |
| `.claude/agents/auditor-consistency-drift.md` | 1, 3 | D5, D7 | Auditor drafts, Architect applies |
| `.claude/agents/auditor-duplication-abstraction.md` | 1, 3 | D5: respect site rulings | Auditor drafts, Architect applies |
| `.claude/agents/auditor-file-responsibility.md` | 1, 3 | D7: the split with the drift pass over module headers | Auditor drafts, Architect applies |
| `.claude/agents/auditor-correctness-security.md` | 1, 3 | D5: respect site rulings | Auditor drafts, Architect applies |
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
| `client/src/components/workflow/CLAUDE.md` | 3b, 3e | 3b: the done list is the exception to the shuffle it describes. 3e: #11, and its file list after #36 and #37 | Coder |
| Root `CLAUDE.md` | 3, after 3d and 3e | The report's route to the Architect, and the names 3d and 3e move | Architect |
| `.claude/guides/testing-strategy.md`, `prettier-preemptive-practice.md`, `code-comments.md`, `documentation-standards.md`, `drizzle-sqlite-patterns.md` | 3 | The report's routes to the Architect | Architect |
| `.claude/personas/coder.md` | 3, after 3d | `createDefaultBoard`'s new home (#24) | Architect |
| The memory directory (outside the repo) | 4 | D1's pointers | Architect |

## Acceptance

- **The guide holds the rules.** Every rule in D1 is in `audit-workflow.md`, and the three audit memories point to it rather than restating it.
- **Instructions use the template.** The audit files name story-plan sections (D2, D4), and none of them describes a ledger of its own.
- **Clean check.** `npm run check:docs -- .claude` reports zero hits.
- **The first run:**
  - its report opens with its range line;
  - every required finding has a disposition;
  - every route is recorded as landed in a named plan section;
  - the report is in `docs/archive/` and hasn't been edited since.
- **Tags.** `epic-3-5-story-6-audited` and `a6-audited` both exist, so Story 7's base is mechanical.

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
  - **Does a workphase write disclose its reindex?** `PUT /workphases/:id`'s terminal-flag backfill appends items without disclosing the reindex it can trigger (`routes/workphases.ts:141`). Wiki positioning §7 and item-positioning §5.1 list only item writes.
  - **"Or none" in item-attachment §2a.** It says an Attached write "may name the parent's workphase, or none". The code refuses an explicit `workphaseId: null` for an Attached item whose parent has a workphase. If "none" means "omitted", nothing changes.
  - **Two behaviors the wiki doesn't state,** which the report's drift fixes describe: a project move naming both `prevId` and `nextId` uses `prevId` and ignores `nextId` (project-tree §6); a column whose start or end workphase is missing counts as broken (boards-columns-unsorted §9).
- **For the Architect:**
  - **Root `CLAUDE.md`:** "One position math layer" lists `itemPositionScope.ts` as table-generic, and it's items-only. The `/api/test` row omits the project pins (position, created-at, parent). The gates line says unit tests run across `client/`, `server/` and `tests/`; they run across `client/`, `server/` and `scripts/`, and lint runs `check:docs`.
  - **`testing-strategy.md`:** "both Vitest suites" (there are three, one on `node:test`), and no row in the layers table for `scripts/**/*.test.mts`.
  - **`prettier-preemptive-practice.md:3`:** the root config now covers `scripts/` and the root files too.
  - **The checker's rule tables:** `code-comments.md`'s and `documentation-standards.md`'s both omit `wiki-code-name`.
  - **`drizzle-sqlite-patterns.md`, "Self-Referential FK Caveat":** `projects.parentId` is a real FK now; only `items.parentId` is soft.
  - **`.claude/personas/coder.md:60`** names `createDefaultBoard`'s home, which report #24 moves to `lib/`.
- **For the Test Reconciler, on its next run:**
  - **Tests that may not prove their case:** `server/tests/lib/positionResolver.test.ts:223–232` (TC-2.8 throws for the wrong reason) and `:167–182` (TC-2.9's positions follow creation order); `routes/items.hierarchy.test.ts:1179–1187` (asserts half its title); `routes/workflows.test.ts:86` (no foreign row); `itemWriteReconciliation.test.ts` (no `'first'`/`'last'` marker case); `dragRegions.test.ts:111–113` (no case exercises the DOMRect getter hazard); `scripts/check-docs/extract.test.mts:87–92` (its fixture has no `-->`).
  - **Case IDs only in comments:** `dragBands.test.ts:5` (DRAG-3.5), `dragClassification.test.ts:7` (DRAG-2.10), `itemListOps.test.ts:300–301`, `itemWriteReconciliation.test.ts:16–17, 108`, `popSession.test.ts:216` (DRAG-1.21) and `:281` (DRAG-1.17), `server/tests/routes/items.test.ts:708` (probably TC-2.4).
  - **Tests whose IDs the plan's Automation lines don't list:** the sidebar hook's TREE-1.4, 1.8, 1.9 and 1.11 tests; `hierarchyPlacement.test.ts`'s TREE-1.3/1.4 null-root tests and DRAG-4.8 exclusion test (check they prove those cases); E2E titles carrying DRAG-5.1, 5.9, 5.10, 5.11, 5.13, DRAG-1.1, 1.5, 1.9, 1.12, 1.14, 1.24, DRAG-3.17 and TREE-3.9, while the plan shows them `Open`; TC-7.18 in both a lib and a route test; ATT-4.10's cases in both `items.test.ts:1364–1402` and `items.hierarchy.test.ts`.
  - **One function tested under two names:** `itemWriteReconciliation.test.ts:18–76` and `positionedWrite.test.ts` (report #31 merges them).
- **For the Test Planner:**
  - TC-2.4's Automation line omits `tests/api/itemRepositioningAttachedSiblings.spec.ts`, whose header says it runs TC-2.4; its titles at `:58, 70, 89` omit TC-2.4 and TC-3.1.
  - Report #4's fix starts with a throwaway probe of DRAG-3.24's scenario. DRAG-3.24's permanent test stays with Story 10, where it's routed.

*From the Coder, batch 3a (2026-10-21).*

- **For the Architect:** root `CLAUDE.md`'s "One hierarchy-write primitive" bullet names `itemTree.ts::assertWithinDepthCap` as how `POST /items` checks the cap. The create asks `itemTree.ts::parentRefusal` now, which checks that the parent exists and the cap in one call; `assertWithinDepthCap` is the formula beneath it, and it still exists. 3d's #19 rebuilds the same checks, so the bullet can be reworded once, after it.
- **For the Test Planner:**
  - **wiki item-positioning §2's third `"none"` case,** an item filed in a workphase of a workflow its project doesn't use, has no case among TC-2.13 to TC-2.17. `workflows.test.ts`'s positionScope test checks it and carries no ID.
  - **TC-3.4's setup has a parent with a workphase.** Its ID is on the test for a parent with none (wiki item-positioning §3: the scope is the parent's children, not a workphase). If that variation wants a case of its own, the test's ID follows.
  - **ATT-4.11 names a root item as the shallower target.** wiki hierarchy-placement §6's "the top level included" isn't in its text. The test for the top level carries its ID, and runs it through both writes.

*From the Coder, batch 3b (2026-10-21).*

- **For the PO:**
  - **The blue line in a done list.** With #4 the rows hold still, but the line still names a neighbor as if the ghost had slid: with `X` carried over `D1` in `D1, X, D2`, it draws at `D1`'s top, where `X` isn't. wiki board-drag-interaction §2's rule 3 says the highlight and the release name the same card, and a done list's release names none. `epic-4-decisions.md` §12's zoom-in question uses that highlight to pick the Card, and the PO's recommendation there (zoom into the Card under the cursor) would settle what the line means, so it's left for that decision.
  - **§10's pending marker.** It says the placement is the ghost during the drag and the pending marker after release. The marker is now that placement with a `'first'` or `'last'` slot spelled as the anchor the request carries (#5). Nothing the user sees differs; add a clause if the wiki should say it.
- **For the Test Planner:**
  - **DRAG-5.13's test says more than its text.** The case says a release at the Card layer sets the grandchild back down. The test also asserts its row, and its own children's rows, stay drawn there (#3). If the drawing belongs in the case, the ID is already on the test.
  - **TC-2.28 and a band drop.** The case places `X` by an anchor under a narrow view. The new test is the same promise for a release in a top or bottom band, where the ghost's slot is `'first'` or `'last'` and the request carries an anchor. DRAG-6.1 says the board shows "the relation the request carries", first and last among them; for a band drop, the marker after release is the anchor.
  - **DRAG-3.24 stays `Open`, with no automated test.** The probe showed the report's trace, and #4's fix keeps the done list still. The permanent test is Story 10's.
- **For the Test Reconciler:** the report's "`itemWriteReconciliation.test.ts` (no `'first'`/`'last'` marker case)" is answered by TC-2.28's new test. The same file's "case IDs only in comments" lines moved from `:16–17, 108` to `:18–19, 110`, two imports down.

*From the Coder, batch 3c (2026-10-21).*

- **For the Architect:** `bruno/` has no row in `documentation-standards.md`'s ownership table, and the checker doesn't read `.bru` files. The pointer and no-provenance rules hold in the request docs by hand: batch 3c fixed their pointers and cut `move-item.bru`'s hierarchy block, which restated about 30 lines of the wiki, and nothing keeps them that way. Whether the table names `bruno/`, and whether the checker reads a `.bru` file's `docs` block, is yours.

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

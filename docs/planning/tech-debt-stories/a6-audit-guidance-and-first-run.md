# A6 — Audit Guidance Revisit and First Run

**Type:** tech-debt story · **Written:** 2026-09-26 by the Auditor · **Revised:** 2026-09-26 (D3's tag adopted; the replay dropped); 2026-09-30 (renumbered A6; A4's handoff folded in) · **Ready for:** Nathan's review · **Starts after:** A4. Its order against A5 is Nathan's call, and D10 covers either order.

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
- **The open plan of the story being audited:**
  - *Inbound deferrals:* confirm each one is done or deferred again with its new destination named. One that is silently missing becomes a required finding.
  - *Scope:* for each Planned passage the story built, confirm the code has a `wiki <page> §N` index pointer at the rule's main enforcement site (A1 D7). A missing pointer is a small required finding.
  - *Amendments:* when judging whether code is vestigial, check which rules changed while the story was open.
  - *Code map:* only for an N.1 story, to check its "Makes dead" claims.
- **Handoffs addressed to the audit,** or to "the next story or audit" and not yet routed anywhere else. A4's are an example (D10 lists them). Each item either matches a pass's finding, or the orchestrator rules on it and the ruling gets a tier (D5).
- **The previous audit only, from `docs/archive/`,** for recurrence. Each report restates the full chain for anything it carries ("Story 3 #16 → Story 4 #16 → Story 5 → here"), so reading one report back is enough. Nothing else in the archive gets read.
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

This run happens once A4 is done. It uses the instructions as batch 1 leaves them.

**Scope:** `epic-3-5-story-6-audited` (`4c0cb34`, tagged retroactively) through HEAD. Under D3, that range sorts into these groups:

| Source | What it contains | Passes |
|---|---|---|
| Story 6's fix batches (`b300c1c..06bd170`) | Code: 63 files, including the `useBoardDnd` split | All four |
| Tooling Gates | The 12 lint fixes, and the new ESLint, tsconfig and script configs | All four |
| Tooling Gates' Prettier sweep | Formatting only, and on `.git-blame-ignore-revs` | None |
| A1 | New code: the `check:docs` checker in `scripts/check-docs/` | All four |
| A1, and the Architect's edits from A4's handoff | The `CLAUDE.md` files, and the module headers that received moved rationale | Drift |
| A3 | New tests | All four |
| A3 | The case IDs stamped into test titles | Drift |
| A4's 16 sweep commits (`359f093..bae02c2`) | Comments, module headers, and test titles that named functions by old names. A4 D8 proves them comment-only | Drift |
| A4 batch 5 | Root `lint` runs `check:docs` | All four (one line) |
| A5, if it lands before this run | Sorted by the same rules: code it changes goes to all four passes, comments it re-points to drift | By D3 |
| A2, A3's test plans, A1's guides and personas | Docs outside the audit's code scope | None |

**Size.** The drift pass's share is large: every comment A4 rewrote. It runs as one pass per A4 commit, in parallel, merging neighbors where a commit is small, so no single pass holds the whole sweep. That's the check A4's own gates can't make: whether a rewrite dropped a reason instead of restating it, or states something the code doesn't do. The code passes' share is the fix batches plus the three code-bearing tech-debt pieces.

**Inputs at the merge step (D4).** A4's handoff "To A6" is empty: every tag's reason was recovered at its site. A4 left four items for "the next story or audit". Nathan routed two of them elsewhere, and they aren't audit concerns: the sidebar's set-down write went to A5's D1, and the Sheet parent picker's missing depth cap went to the Work Item Detail & Chat UI epic's entry in `mvp-roadmap.md`. A pass that finds either one again gets that route as its disposition, not a new finding. The run takes the other two:
- **Two redundant keys in `ProjectPage.tsx`.** A4 found them not wrong: `App.tsx` already keys the whole page on the project. At most a small Fix Now, or rejected with a reason.
- **wiki board-drag-interaction §2's rule 6 has no index pointer.** A4 didn't confirm how a done list stops the shuffle, so it left the rule unmarked. The run confirms it. If the code enforces the rule, the pointer is a small Fix Now; if it doesn't, it's a correctness finding.

**What the run should show:**
- **Real value.** It finds code problems no gate catches, in the fix batches, the checker and the new tests, or it shows credibly that there aren't any. That's the test Nathan named.
- **Doc findings are a minority, and none of them repeat what the checker reports.** The baseline is Story 6: doc drift was one finding, but it took one of the four fix batches.
- **The rulings A4 wrote at their sites** (Story 6 #24 and #30) aren't raised again without new evidence (D5). A4 wrote 15 of the 16. The 16th, a Descendants release with no `over`, got no comment because `handleDragEnd`'s Descendants branch already says the release reads only the projection. If a pass raises it anyway, that comment isn't enough, and the fix is a comment.
- **A4's handoff items are all resolved** (D4): each is ruled on, fixed, or routed.
- **Every route lands in a plan** (D6). This plan's Handoff is the place for items to the PO and the Test Planner, and Story 7's roadmap entry or plan is the place for deferrals.
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
- Draft D1–D9 into the guide and the agents, plus any conflicts the re-read turns up.
- **Reviews:** the Architect reviews D2 and D4's references to the template, the Test Planner reviews D8, and Nathan approves.
- **Check:** `npm run check:docs -- .claude` still reports zero hits.

### Batch 2: the first run (Auditor)

- Nathan tags `4c0cb34` as `epic-3-5-story-6-audited`.
- Run D10 and write `docs/audits/code-quality-audit-a6.md`, opening with its range line, with every route landed (D6).

### Batch 3: corrections

- **Instructions:** whatever the run exposed. The Auditor drafts; the Architect applies.
- **Code:** the run's Fix Now, in the usual batches (Coder). Each batch passes `npm run check`, plus E2E where it touches behavior.

### Batch 4: close

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
| `docs/audits/code-quality-audit-a6.md` | 2 | new, transient | Auditor |
| Code named by the run's Fix Now | 3 | fixes | Coder |
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

# Code Quality Audit Workflow

How an audit runs: four focused passes in parallel, one reconciled report, then a close-out. Every pass reads the Auditor persona first (`.claude/personas/auditor.md`).

An audit is a transient doc (`.claude/guides/documentation-standards.md`). Its report is written to `docs/audits/` while the audit is open, moves to `docs/archive/` when it closes, and is never edited after that.

## 1. When an audit runs

- **A story's audit** runs at the step of `.claude/guides/story-done-checklist.md` that names it.
- **A tech-debt story** gets an audit of its own only when it restructures code or changes what the app does (the same checklist). Its commits still fall in the next audit's range, so no code goes unaudited (see Scope).
- **A cleanup refactor** follows a story only when that story's revisions probably left dead or vestigial code. It's never a standing step, so an audit never routes a finding to one that hasn't been planned. When one is planned:
  - it runs before the story's audit, and the audit covers both. An audit run first would find again what the cleanup removes;
  - the Architect and the Coder run it, not the Auditor. Its plan's Inbound deferrals hold each finding's disposition, and its Code map holds each phase's "Makes dead" list.
- **The epic-wide audit** runs at epic close (`.claude/guides/epic-done-checklist.md`). See The epic-wide audit.
- **An orientation audit** can cover named directories instead of a range.

## 2. Scope

**The range starts where the last audit ended.** Each audit's end commit is tagged `<scope>-audited`, with the same scope name as its report, `code-quality-audit-<scope>.md`. The next audit's base is the newest such tag:

```text
git describe --tags --match '*-audited' --abbrev=0
```

The range runs from that base to HEAD when the audit starts. It takes in the previous story's Fix Now batches and the tests written beside them, which no other audit reads. Nathan tags the end commit once the range is written down.

**Write the range in git's notation, and check its count.** `<base>..<end>` leaves out `<base>` itself, which is right for a base the last audit covered. A range named by its first commit is `<first>^..<end>`. `git rev-list --count` confirms how many commits a range holds.

**The range comes from tags and commits, never from commit messages,** since a message's label can lag the work. If the working tree holds uncommitted work, or the range holds commits from more than one story, confirm the scope with Nathan before spawning anything.

**Sort the range before spawning:**

| What changed | Passes |
|---|---|
| Formatting only, in commits listed in `.git-blame-ignore-revs` | None |
| Comments and test titles only, proven by the story's own comparison of the code with comments stripped | Drift |
| A file's imports only, with nothing else in that file changed over the range | Drift |
| A `CLAUDE.md` file, root or directory | Drift |
| Code moved unchanged from one file to another | All four, listed apart (see What each pass gets) |
| Any other code, tests or config | All four |
| Docs outside the code: the wiki, test plans, plans, guides, personas and agents | None |

Whether a file changed only in its imports is mechanical: its diff over the range touches nothing but import statements.

Write the scope down: the range, the files each group touches (`git diff --stat`), and which passes read each group.

**A share too large for one pass** runs as several instances of that pass, in parallel, each over its own part of the scope. Split it by code area, not by commit, so each file has one reader per lens however many commits changed it. Keep code that shares logic in one Duplication instance: a split between the two halves would hide the duplication that lens looks for.

### What each pass gets

**A scope file per instance.** It lists the instance's files with line numbers as they stand at HEAD, so a pass needs no git. Each file can have three lists:
- **Changed lines:** the lines `git blame` over the range attributes to a commit in it, skipping the commits in `.git-blame-ignore-revs`.
- **Moved lines,** listed apart with the file each came from: lines plain blame puts in the range, but `git blame -M -C -C`, bounded at the base, traces to an older line in another file. A run of fewer than four lines from one source counts as changed instead: short matches are usually braces and imports. A move doesn't change the code, so a pass checks only what a move can break, as its agent says.
- **Removal sites:** where lines were deleted with nothing added in their place, the hunks of `git diff -U0` over the range that add nothing. Blame can't see them, so they're listed for a pass to check what's left around each one.

**How far to read.** The orchestrator marks a file **read whole** when the range may have changed its shape: the file is new, it received moved code, or 10 or more of its changed lines are code: imports, comments, test titles and blank lines don't count. It marks any other file whose growth calls its shape into question too.
- **A marked file** is read whole, and each lens asks its questions of the file as a whole: whether it still owns one concept, whether its new code repeats code elsewhere, whether its header still covers it.
- **An unmarked file** is read at its listed lines, enough around them to understand them, and the code they call. A change of a few lines rarely changes what a file owns, and reading the whole file for it costs more than it finds.
- **File Responsibility's scope holds only the marked files.**

## 3. The four passes

Spawn the four audit agents in parallel:

| Agent | Its lens |
|---|---|
| `auditor-correctness-security` | Does the code do what it claims, and can it be made to misbehave? |
| `auditor-consistency-drift` | Does it match project convention, and do its comments, module headers and `CLAUDE.md` files still tell the truth? |
| `auditor-file-responsibility` | Does a file own more than one concept? |
| `auditor-duplication-abstraction` | Is the same logic in more than one place, and would sharing it reduce risk? |

- **The prompt carries only the scope:** the path of the instance's scope file. The persona says how to read it, and each agent's definition names the guide sections it reads.
- **The passes run cold.** They get no story plan, no earlier audit, no ledger and no wiki page. A pass that has read the plan audits what was intended, not what was built. What was planned or ruled is the orchestrator's input, at Reconcile.
- **Run them in the foreground** unless the scope is large. The reconcile step needs all four results.
- **Launch a large audit's instances a few at a time** when there are more than one usage window holds, so a usage limit stops some of them, not all. A stopped instance resumes where it left off.

## 4. Test code

**The audit reviews test code as code:** duplication, fixtures and helpers, file shape, the layer a test sits in, and how it sets up state (`.claude/guides/testing-strategy.md`). Each pass applies its lens to a test file as to any other.

**What a test proves belongs to the Reconciler** (`.claude/agents/test-reconciler.md`): whether it covers its case, and whether it asserts the rule or restates the code. An audit doesn't file either as a finding. A pass that notices one adds a one-line note for the orchestrator, who routes it to the Test Reconciler (see Close-out).

## 5. Reconcile

The orchestrating session does this itself; it's never delegated.

**Merge.** Combine the lists into one. When more than one pass found the same issue, keep one finding and tag every pass that found it, for example `[File Responsibility + Duplication & Abstraction]`. A drift finding on a module header and a File Responsibility finding on the same file usually describe one problem, so they merge too.

**Re-trace by hand** every Fix Now correctness finding, and any claim a fix depends on, against the code before it goes in the report.

**Read what the passes didn't.** Only now does the orchestrator read:
- **The plans:** the plan of the story whose close runs the audit, and the plan of every story in the range that closed without an audit of its own, from `docs/archive/`. From each, where the plan has the section:
  - *Inbound deferrals:* each one is done, or re-routed to a destination that names it. One that has silently gone missing becomes a required finding. A pass's finding that matches a row deferred or rejected with a reason is that row, not a new finding. If the pass brings evidence the reason didn't consider, the row is reopened as a finding that cites it.
  - *The handoff's Planned passages now built:* each has a `wiki <page> §N` index pointer at the rule's main enforcement site (`.claude/guides/code-comments.md`, rule (c)). A missing pointer is a small required finding. Read the handoff's list, not Scope's: the PO has already removed the built passages' markers, and a passage in Scope may have been deferred while the story was open.
  - *Amendments:* which rules changed while the story was open, when judging whether code is vestigial.
  - *Code map:* for a cleanup refactor, each item on a "Makes dead" list is gone.
  - *Handoff items addressed to the audit,* or to "the next story or audit" and not routed anywhere since. Each one matches a pass's finding, or the orchestrator rules on it and tiers the ruling.
- **The previous audit, and only that one,** from `docs/archive/`, for recurrence. Each report restates the full chain for anything it carries, so one report back is enough.
- **The wiki passage each correctness finding touches,** to classify it.

Nothing else in the archive gets read.

**Classify each correctness finding against the wiki.** Read the passage the behavior falls under. Where a feature's page points to a page of shared rules, read both: the feature's page may mark a shared rule Planned for that feature. Then:
- **The code breaks a rule that's in force:** a finding. Fix the code. A rule is in force when it has no `**Planned:**` marker, or when it's the passage a Planned marker will replace.
- **The code differs only from a Planned passage,** and follows the rule still in force: not a finding. That passage isn't built yet.
- **The question is already open:** a page's Open questions, a page whose feature isn't designed yet (what it does today is a placeholder), a `Pending PO` case in the test plans, or an Open question in a plan the merge step read. That's not a new finding or a new request. Report it as Informational at most, citing where the question is. A fix that would change the behavior waits for the answer. A placeholder that has stopped working altogether is still a finding.
- **Anything else needs a PO ruling before its fix lands:**
  - the wiki says nothing about the behavior;
  - the fix would change something the wiki or a test-plan case states;
  - the orchestrator thinks the rule, not the code, is wrong. The code isn't assumed right either: which one changes is a ruling.

  The request goes to the plan, addressed to the PO (see Close-out).

The finding records its bucket and its `wiki <page> §N` pointer.

**Tier every finding** (see Tiers). Check each Covered-by tag against its destination yourself; a pass mistagging one is a one-line fix here, not a re-run.

**Check for lens bleed.** These are signs a pass left its lane:
- Correctness & Security reporting file length or naming;
- File Responsibility reporting logic bugs;
- Consistency & Drift proposing new abstractions, reporting what `npm run check` reports, the docs checker included, or reporting a comment that breaks a convention of `.claude/guides/code-comments.md` but says nothing wrong about the code;
- Duplication & Abstraction reporting a lone logic bug with no duplication angle;
- any pass judging whether a test proves its case.

Some overlap at a real boundary is expected, such as a file that's large because of duplicated logic. Cross-tag it. A finding entirely outside its pass's lens means that agent's definition needs tightening.

## 6. Tiers

Passes tag findings Fix Now, Watch List, Covered by `<epic>` or Informational. Only the orchestrator routes a finding to a story's plan, or tags it Covered by a story, because only the orchestrator reads plans.

**Required: each needs a recorded disposition before the audit closes.**
- **Fix Now:** fixed in the story's remaining code work (see Working Fix Now).
- **Routed to a story's plan:** the fix belongs in a story that is certain to happen and reworks the same code, so doing it now would mean doing it twice. A cleanup refactor that hasn't been planned doesn't qualify.
- **Covered by `<story or epic>`:** the gap is already planned there.

**A route or a Covered-by tag counts only once its destination names it.** That's either the destination plan's Inbound deferrals, or its roadmap entry if the plan isn't written yet. Until then, the finding is still open.

**Optional: these may be skipped without comment.**
- **Watch List:** a correctness risk that isn't a defect yet, or structural work that's a judgment call: a split or a consolidation worth doing if the code grows, or when it's next reworked.
- **Informational:** confirmations and context, including structural work considered and judged not worth doing, with the reason.

**A structural finding is Fix Now only when the code is already harder to change correctly because of it:** a shared rule written twice whose copies have started to differ, a helper copied rather than called, a file whose concepts are tangled enough that a change to one breaks the other. Otherwise a file to split, or logic to consolidate, is a judgment call, and goes on the Watch List or Informational. Fix Now structural work is ordered after any correctness fixes that touch the same code, or it's Routed to a story's plan. A structural item carried on the Watch List isn't forgotten: the rule below makes it required on its third consecutive audit, or the report says why it stays optional.

**An optional finding becomes required on its third consecutive audit.** Keeping it optional needs a reason written in the report. A recurring finding lists the earlier audits it appeared in, and under which numbers.

**A ruling is required until its site records it.** The orchestrator may rule on a question a pass raised: "deliberately separate", "looks wrong but isn't", "can't happen, because …". If no comment at the site records that ruling yet, the ruling is a required finding. Its fix is a one-line present-tense comment there, with the reason (`.claude/guides/code-comments.md`, rule (f)). Without it, the next cold audit works the same question out again.

## 7. The report

Write it to `docs/audits/code-quality-audit-<scope>.md`.

**Opening:**
- the range, `<base>..<end>`, and the tag the base came from;
- the groups the range sorted into, and which passes read each (see Scope);
- what the passes got: how many lines changed and moved, how many removal sites there were, and which files were marked read whole;
- the number of files, and a sentence on what the range contains;
- how it ran: that the passes ran cold, which findings were re-traced by hand, and what the merge step read (which plans, and which earlier audit).

**Findings:**
- **Numbered once across the whole report,** not per section, so a finding's number identifies it on its own.
- **Sections, in this order:**
  1. Fix Now: correctness first, then drift, then structural;
  2. Routed to a story's plan;
  3. Watch List;
  4. Covered by;
  5. Informational.
- **Each finding has:**
  - a heading that states the problem, and the passes that found it;
  - `file:line` locations;
  - the problem, plus, for a correctness finding, a concrete failure scenario: which inputs or state lead to which wrong result;
  - the fix;
  - for a correctness finding, its wiki bucket and pointer;
  - for a recurring finding, the earlier audits and numbers it appeared under;
  - for an optional finding in a file a Fix Now finding already changes, a note naming that finding: "can ride along with #N".
- **An optional finding keeps its own tier,** even when it sits beside a Fix Now. The ride-along note tells whoever plans the fix batches that it costs little to include; folding it into the Fix Now would make that choice for them.

**Close-out:** a table at the end, filled in as the audit closes (see Close-out).

## 8. Working Fix Now

Fix Now lands in batches (`.claude/guides/story-done-checklist.md`):
- **Plan the batches up front:** correctness first, then duplication of a shared rule, then drift, then structural. Ask the decisions the findings need at the start, not mid-batch.
- **Pull in the optional findings worth it.** One marked "can ride along with #N" changes a file that #N's batch already changes, so including it adds little to the batch or to the next audit's scope. Whether it's worth including is the planner's call.
- **Say how large and how risky each change is,** concretely: the lines and files it touches, and what gates it (for example, "only runs when a pending placement exists").
- **Each batch ends with `npm run check`,** plus `npm run test:e2e` where it touches behavior, **and a stop** for Nathan's review and commit.
- **A finding that can't be reproduced by hand is settled by a probe,** not by argument: a throwaway test on the test stack, deleted afterwards. Where possible, show it failing before the fix and passing after, and say which probes weren't shown failing first.

## 9. Close-out

The audit stays open while its Fix Now work lands. It closes when every required finding has one of three dispositions:
- **fixed;**
- **deferred** to a destination that names it (see Tiers);
- **rejected,** with the reason. A ruling about the code is also written at its site (see Tiers).

**The Close-out table** has one row per required finding: its disposition and, for a route, the plan section where it landed. Optional findings need no row.

**Every route lands in a plan before the audit closes.** At close the report goes to the archive, where nobody reads it again, so a route recorded only in the report is lost.
- **Requests for a PO ruling:** the Open questions of the plan whose close runs the audit, addressed to the PO.
- **Anything else for another role,** such as a test that may not prove its case, for the Test Reconciler, or a wiki statement that looks wrong: the same place, addressed to that role.
- **Deferrals:** the destination's Inbound deferrals. If its plan isn't written yet, its roadmap entry; whoever writes the plan moves them in.

**Check each disposition against the current code, not against memory.** A finding can get fixed as a side effect of other work. A note can also say a finding is fixed when it isn't. Read the file before writing the row.

**Then the report moves to `docs/archive/`.** For a story's audit, that happens at the story's sign-off. After the move, nothing edits the report. A later audit that finds the same thing says so in its own report.

## 10. The epic-wide audit

- **Range:** from the previous `epic-N-complete` tag to HEAD, sorted and run cold like any other. It overlaps every story audit in the epic on purpose: its value is what no single story's range shows, such as duplication and drift between stories.
- **Merge** reads the epic's last story audit for recurrence, one report back as above.
- **Close-out** is the same as a story audit's. Routes land in the epic's roadmap, since no story plan is open.
- **It should be light.** A finding the story audits missed points to a gap in some pass's lens. The report names the lens, so that agent's definition can be tightened.

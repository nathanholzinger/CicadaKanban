# Code Quality Audit Workflow

How an audit runs: four focused passes in parallel, one reconciled report, then a close-out. Every pass reads the Auditor persona first (`.claude/personas/auditor.md`).

An audit is a transient doc (`.claude/guides/documentation-standards.md`). Its report is written to `docs/audits/` while the audit is open, moves to `docs/archive/` when it closes, and is never edited after that.

## 1. Scope

- **A story's audit** runs at the step of `.claude/guides/story-done-checklist.md` that names it, over the story's commit range.
- **The epic-wide audit** runs at epic close (`.claude/guides/epic-done-checklist.md`), over the epic's range.
- **An orientation audit** can cover named directories instead of a range.

Write the scope down before spawning anything: the range as `<base>..<end>`, and the files it touches (`git diff --stat <base>..<end>`). Every pass gets the same scope.

## 2. The four passes

Spawn the four audit agents in one message, so they run in parallel:

| Agent | Its lens |
|---|---|
| `auditor-correctness-security` | Does the code do what it claims, and can it be made to misbehave? |
| `auditor-consistency-drift` | Does it match project convention, and do its comments, module headers and `CLAUDE.md` files still tell the truth? |
| `auditor-file-responsibility` | Does a file own more than one concept? |
| `auditor-duplication-abstraction` | Is the same logic in more than one place, and would sharing it reduce risk? |

- **The prompt carries only the scope.** Each agent's definition names the guide sections it reads.
- **The passes run cold.** They get no story plan, no earlier audit and no wiki page. What was planned or ruled is the orchestrator's input, in the reconcile step.
- **Run them in the foreground** unless the scope is large. The reconcile step needs all four results.

## 3. Reconcile

The orchestrating session does this itself; it's never delegated.

**Merge.** Combine the four lists into one. When more than one pass found the same issue, keep one finding and tag every pass that found it, for example `[File Responsibility + Duplication & Abstraction]`.

**Re-trace by hand** every Fix Now correctness finding, and any claim a fix depends on, against the code before it goes in the report.

**Classify each correctness finding against the wiki.** Read the wiki passage the behavior falls under. Then:
- **The code breaks a rule that's in force:** a finding. Fix the code. A rule is in force when it has no `**Planned:**` marker, or when it's the passage a Planned marker will replace.
- **The code differs only from a Planned passage,** and follows the rule still in force: not a finding. That passage isn't built yet.
- **Anything else needs a PO ruling before its fix lands.** That covers three cases:
  - the wiki says nothing about the behavior;
  - the wiki lists it as an open question;
  - the fix would change something the wiki or a test-plan case states.

  The request goes to the story plan's Open questions, addressed to the PO.

The finding records its bucket and its `wiki <page> §N` pointer.

**Tier every finding** (see Tiers). Check each Covered-by tag against its destination yourself; a pass mistagging one is a one-line fix here, not a re-run.

**For a story's audit, check the plan's Inbound deferrals.** Each one is done, or re-routed to a destination that names it. One that has silently gone missing becomes a required finding.

**Check for lens bleed.** These are signs a pass left its lane:
- Correctness & Security reporting file length or naming;
- File Responsibility reporting logic bugs;
- Consistency & Drift proposing new abstractions, or re-reporting what `npm run check:docs` reports;
- Duplication & Abstraction reporting a lone logic bug with no duplication angle.

Some overlap at a real boundary is expected, such as a file that's large because of duplicated logic. Cross-tag it. A finding entirely outside its pass's lens means that agent's definition needs tightening.

## 4. Tiers

Passes tag findings Fix Now, Watch List, Covered by or Informational. Only the orchestrator routes a finding to a story's plan, at merge, because only the orchestrator reads plans.

**Required: each needs a recorded disposition before the audit closes.**
- **Fix Now:** fixed in the story's remaining code work, in batches (`.claude/guides/story-done-checklist.md`).
- **Routed to a story's plan:** the fix belongs in a story that is certain to happen and reworks the same code, so doing it now would mean doing it twice.
- **Covered by `<story or epic>`:** the gap is already planned there.

**A route or a Covered-by tag counts only once its destination names it.** That's either the destination plan's Inbound deferrals, or its roadmap entry if the plan isn't written yet. Until then, the finding is still open.

**Optional: these may be skipped without comment.**
- **Watch List:** a risk that isn't a defect yet.
- **Informational:** confirmations and context.

**An optional finding that keeps coming back can be promoted to required.** The finding lists the earlier audits it appeared in, and under which numbers.

## 5. The report

Write it to `docs/audits/code-quality-audit-<scope>.md`.

**Opening:**
- the range, `<base>..<end>`;
- the number of files, and a sentence on what the range contains;
- how it ran: that the passes ran cold, which findings were re-traced by hand, and what the merge step read (the story plan, an earlier audit).

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
  - for a recurring finding, the earlier audits and numbers it appeared under.

**Close-out:** a table at the end, filled in as the audit closes (see Close-out).

## 6. Close-out

The audit stays open while its Fix Now work lands. It closes when every required finding has one of three dispositions:
- **fixed;**
- **deferred** to a destination that names it (see Tiers);
- **rejected,** with the reason. When the reason is a ruling about the code, such as "deliberately separate" or "looks wrong but isn't", the ruling is also written at its site (`.claude/guides/code-comments.md`, rule (f)). Otherwise the next audit works the same question out again.

**The Close-out table** has one row per required finding: its disposition and, for a route, the plan section where it landed. Optional findings need no row.

**Every route lands in a plan before the audit closes:**
- **requests for a PO ruling:** the story plan's Open questions, addressed to the PO;
- **anything else for another role:** the same section, addressed to that role;
- **deferrals:** the destination's Inbound deferrals, or its roadmap entry.

**Check each disposition against the current code, not against memory.** A finding can get fixed as a side effect of other work. A note can also say a finding is fixed when it isn't. Read the file before writing the row.

**Then the report moves to `docs/archive/`.** For a story's audit, that happens at the story's sign-off. After the move, nothing edits the report. A later audit that finds the same thing says so in its own report.

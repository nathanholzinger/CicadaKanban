# Multi-Pass Audit Workflow

How to run a code quality audit as four parallel, focused passes instead of
one agent trying to hold five+ unrelated concerns at once. See
`.claude/personas/auditor.md` for why this is split the way it is.

---

## 1. Determine Scope

Decide what's in scope before spawning anything:
- A specific epic's changed files (`git diff <base>...HEAD --stat`), or
- The full codebase (for a periodic/orientation audit)

Pass this scope description into every subagent prompt in step 2 — all four
passes review the *same* scope, just through different lenses.

## 2. Spawn Four Passes in Parallel

Use the `Agent` tool with `subagent_type: general-purpose`, one call per pass,
**all in a single message** so they run in parallel. Each prompt is built the
same mechanical way — this is a lookup, not a judgment call:

1. Contents (or a pointer to) `.claude/personas/auditor.md` — shared context,
   output format, and the pointer to `.claude/plans/mvp-roadmap.md` for
   **Covered by Epic N** tagging
2. Contents (or a pointer to) `.claude/plans/mvp-roadmap.md` — needed so the
   subagent can tag findings against real epics instead of guessing
3. Contents (or a pointer to) the pass doc itself:
   - `.claude/personas/auditor-correctness-security.md`
   - `.claude/personas/auditor-consistency-drift.md`
   - `.claude/personas/auditor-file-responsibility.md`
   - `.claude/personas/auditor-duplication-abstraction.md`
4. The exact guide subsections listed under that pass doc's **"Guides to read
   for this pass"** heading — read only those subsections, not the whole
   guide, to keep the lens narrow
5. The scope from step 1

Each subagent returns its own findings list, tagged **Fix Now** / **Watch
List** / **Covered by Epic N** / **Informational**, with file path + line
range + problem + fix per finding — same format as
`.claude/guides/code-quality-audit-epic1.md`.

Run in the background if the audit covers a large scope; run in the
foreground (synchronously) if you need the results before continuing —
reconciliation in step 3 always needs all four results, so foreground is
usually simpler for an interactive audit session.

## 3. Reconcile (orchestrating session — do not delegate this step)

- Merge the four findings lists into one document
- Dedupe: if the same underlying issue was independently surfaced by more
  than one pass (e.g. a file that's both a File Responsibility split
  candidate and a Duplication source), merge into a single finding and note
  both pass-tags rather than listing it twice
- Tag each finding with which pass(es) surfaced it, e.g. `[Correctness &
  Security]` or `[File Responsibility + Duplication & Abstraction]`
- Spot-check any **Covered by Epic N** tags against
  `.claude/plans/mvp-roadmap.md` yourself before finalizing — a subagent
  mistagging something is a one-line fix here, not a re-run
- Write the combined report to
  `.claude/guides/code-quality-audit-epic{N}.md` (or a dated filename for a
  non-epic-scoped audit), matching the existing Epic 1 audit doc's structure:
  Fix Now / Watch List / Covered by Future Epics sections, findings numbered
  within each

## 4. Sanity Check

Before treating the report as final, skim it for lens bleed — a sign a pass
prompt didn't stay in its lane:
- Correctness & Security pass reporting file-length or naming issues
- File Responsibility pass reporting SQL injection or logic bugs
- Consistency & Drift pass proposing new abstractions
- Duplication & Abstraction pass reporting a lone logic bug with no
  duplication angle

A little overlap at real boundaries (e.g. a large file that's large *because*
of duplicated logic) is expected and fine — cross-tag it. Findings entirely
outside a pass's stated lens mean the prompt needs tightening next time.

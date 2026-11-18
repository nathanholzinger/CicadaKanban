# Story Plan Template

What a story plan contains, who fills in each part, and the lighter variant for tech-debt stories.

A plan is transient. It serves one story and moves to `docs/archive/` when the story signs off (`.claude/guides/story-done-checklist.md`). Anyone may write or edit one (`.claude/guides/documentation-standards.md`). Because it's transient, a plan is where provenance belongs: round-table items, audit finding numbers and dates all go here. They never go in the living docs the plan changes.

**Where plans live:** an epic's stories go in a `docs/planning/` folder of their own, next to the epic's roadmap. Tech-debt stories go in `docs/planning/tech-debt-stories/`.

## A full story

Each section says who fills it in. The skeleton at the end is for copying.

- **Goal** *(plan writer)*. What the story delivers, and what's deliberately out of scope.
- **Scope:**
  - **Wiki passages** *(PO)*. The `**Planned:**` passages this story builds, each as `wiki <page> §N`. The PO removes their markers at close.
  - **Test-plan cases** *(Test Planner)*. The qualified IDs of the cases in scope.
- **Inbound deferrals** *(whoever routes them; usually an audit)*.
  - Audit findings and other items routed to this story, each named by its source (report and number).
  - An item routed before this plan existed waits in the story's roadmap entry. Whoever writes the plan moves it here.
  - The story's audit confirms each one is done, or re-routed to a destination that names it.
- **Approach and phases** *(plan writer)*. The design decisions, then the work in phases. Each phase ends with the gate and a stop for review and commit.
- **Code map** *(whoever writes the code; usually the Coder)*.
  - Which symbols carry which decision. It's kept current while the story is open.
  - It replaces decision IDs in comments: comments state the fact, and the plan says which decision produced it.
  - A cleanup refactor's Code map also holds each phase's "Makes dead" list, which its audit checks.
- **Results** *(QA Engineer)*. One current resume packet for the test work, rewritten at each stop and replacing the last, so a fresh session can continue from it alone. What it holds is in `.claude/personas/qa-engineer.md`, "Sessions, Results and Runs".
- **Review log** *(QA Engineer)*. Recorded word for word as they happen:
  - the desk's questions and answers, each answer quoting the *Then* it read;
  - the Test Reviewer's verdicts, every pass included, each with the tree id it judged;
  - the mappings Nathan declined.

  Entries are appended, never rewritten. The coverage review reads the log at the close, and answers every open verdict.
- **Amendments** *(whoever changes the plan)*.
  - Once coding starts, or a decision is approved, a change is made in the section it affects.
  - Then a dated line goes here, saying what changed and why.
  - Lines are appended, never rewritten, so someone working partway through can see what moved.
- **Open questions** *(anyone)*. Each one is addressed to the role that answers it. The Test Planner's Pending PO cases and an audit's requests for a ruling go here, addressed to the PO. So do the QA Engineer's: a case gap for the Test Planner, a rule gap for the PO, and a defect or a test hook for the Coder. A question that would change the wiki or the code lists "defer it" and "leave it as shipped, with no rule" among its options.
- **Living-docs handoff** *(written by whoever wrote the code, before close; applied by the owners at close)*:
  - behavior decisions made while building. Each ships as implementation, with no rule, case or test, unless Nathan rules it in, and the PO takes each one to him;
  - Planned passages now built;
  - passages superseded;
  - implementation passages to place in a module header, a site comment or a directory `AGENTS.md`;
  - test-plan cases whose tests were deleted or lost their case ID;
  - ID-bearing Vitest tests whose assertions or setup changed, for the Test Reviewer;
  - wiki sections added, changed, moved or removed *(the PO fills this in at close)*.

```markdown
# <Epic> Story <N> — <title>

**Type:** story · **Written:** <date> by <role> · **Status:** <planning | approved | in progress>

## Goal
## Scope
- **Wiki passages:** wiki <page> §N, …
- **Test-plan cases:** <IDs>
## Inbound deferrals
## Approach and phases
## Code map
| Symbol | Carries |
|---|---|
## Results
## Review log
## Amendments
## Open questions
- **For <role>:** …
## Living-docs handoff
- **Behavior decisions made while building (implementation unless Nathan rules them in):**
- **Planned passages now built:**
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Vitest tests whose assertions or setup changed:**
- **Wiki sections added, changed, moved or removed** (PO, at close):
```

## A tech-debt story

For work that changes how the code or the process is organized. If it also changes what the app does, it closes by the full story-done checklist, audit included, though its plan keeps this shape.

- **Sections:** Goal (with what's out of scope), Inbound deferrals (once anything is routed to it), Decisions, Work (in batches), Code map (the files touched), Acceptance, Open questions, Handoff (what later work inherits), and Amendments once anything changes after approval. Inbound deferrals and Open questions work as in a full story. A story that writes or changes tests for cases adds Results and a Review log, as a full story has them.
- **Checks:** the gate, plus the story's own acceptance checks.
- **Audit:** only when the story restructures code or changes what the app does.

```markdown
# <Title>

**Type:** tech-debt story · **Written:** <date> by <role> · **Sequenced:** <what it follows or precedes>

## Goal
## Inbound deferrals
## Decisions
## Work, in batches
## Code map
| File | Batch | Change |
|---|---|---|
## Acceptance
## Open questions
- **For <role>:** …
## Handoff
## Amendments
```

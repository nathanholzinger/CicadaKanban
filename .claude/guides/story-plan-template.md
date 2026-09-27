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
  - An N.1 refactor story builds its "Makes dead" list from it.
- **Amendments** *(whoever changes the plan)*.
  - Once coding starts, or a decision is approved, a change is made in the section it affects.
  - Then a dated line goes here, saying what changed and why.
  - Lines are appended, never rewritten, so someone working partway through can see what moved.
- **Open questions** *(anyone)*. Each one is addressed to the role that answers it. The Test Planner's Pending PO cases and an audit's requests for a ruling go here, addressed to the PO.
- **Living-docs handoff** *(written by whoever wrote the code, before close; applied by the owners at close)*:
  - behavior decisions made while building, for the PO to rule on;
  - Planned passages now built;
  - passages superseded;
  - implementation passages to place in a module header, a site comment or a directory `CLAUDE.md`;
  - test-plan cases whose tests were deleted or lost their case ID;
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
## Amendments
## Open questions
- **For <role>:** …
## Living-docs handoff
- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:**
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Wiki sections added, changed, moved or removed** (PO, at close):
```

## A tech-debt story

For work that changes how the code or the process is organized, not what the app does.

- **Sections:** Goal (with what's out of scope), Decisions, Work (in batches), Code map (the files touched), Acceptance, Handoff (what later work inherits), and Amendments once anything changes after approval.
- **Checks:** the gate, plus the story's own acceptance checks.
- **Audit:** only when the story restructures code.

```markdown
# <Title>

**Type:** tech-debt story · **Written:** <date> by <role> · **Sequenced:** <what it follows or precedes>

## Goal
## Decisions
## Work, in batches
## Code map
| File | Batch | Change |
|---|---|---|
## Acceptance
## Handoff
## Amendments
```

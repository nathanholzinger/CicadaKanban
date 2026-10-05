# A5c — Write boards-columns-unsorted Out in Full

**Type:** tech-debt story · **Written:** 2026-09-30 by the PO, as A5's D3; split out the same day by the Architect · **Ready for:** planning, once A5a closes · **Sequenced:** after A5a and A5b, before A6

## Goal

*Added by the PO, from A4's handoff (2026-09-30):* Nathan folded this in. A2 handed it off as a follow-up story, which was never written.

The page states only the core rules so far, as unnumbered bullets, and it has no test plan. This story:
- **numbers its sections,** so code comments can cite them and the Test Planner can derive cases from them;
- **takes the rules the code has that the page doesn't state,** each as a ruling for Nathan before it's written, as with A4's handoff items:
  - `DELETE /boards/:id` refuses a workflow's last board with a 409;
  - `POST` and `PUT /api/columns` return a 400 for a range whose start comes after its end, or whose workphases aren't in the board's workflow;
  - `unsorted` also carries `needsAttention`, which the page doesn't describe;
- **gets the page a test plan,** written by the Test Planner. The page already uses the API's field names, which the Test Planner asked for during A2;
- **hands the Coder A4's D4 table for this page,** which maps each rule to its main enforcing site, so the new section numbers get their index pointers.

The page states today's behavior. A later epic reworks how columns and workphases relate (Nathan, 2026-09-30), and when isn't known.

*Split note (2026-09-30):* this was A5's D3, and became its own story when A5 split into A5a–c. It runs last because A5a changes what lands in Unsorted.

## Decisions

*Added by the Architect (2026-09-30), from A5's grooming:*
- **What Unsorted is for.** The API refuses what isn't allowed. Unsorted (the "needs attention" surface) catches what gets past: direct DB edits, and cascades not designed yet. The page describes it that way.
- **What lands there after A5a:**
  - **A full item with no workphase,** whatever the cause: created without one, or its workphase deleted. Every item today is a full item. Epic 4's status model may change this (`docs/planning/epic-4-decisions.md` §13).
  - **Items left in another workflow's workphase by a project move.** A5a refuses the item writes that would do it, but not project moves, since the sidebar offers them.
  - A5a's handoff to this story may add to the list.
- **The three rules above** (the last-board 409, the column range 400s, `needsAttention`) are each still a ruling for Nathan, in the first batch.

*Added by the PO, from A5b's sweep (2026-10-05):* one rule moves here (Nathan, A5b's call 7).
- **item-positioning §6's "Column range validation"**: a column's range never spans a terminal and a non-terminal workphase, since active and done items are never compared in one sorted list. It's a column rule, so it moves to this page, beside the column-range 400s. item-positioning §6 keeps the reason, the active/done split, and points here.
- The Test Planner moves any case that cites §6 for it, and the Coder re-points its index pointer (A4's D4 table: `columnRanges.ts::validateColumnRange`).

## Work, in batches

Written when this story is planned.

## Code map

A4's D4 table for this page (`docs/archive/a4-code-comment-sweep.md`, "the other three pages' index pointers") maps each of the page's bullets to its main enforcing site. The Coder adds the pointers once the sections are numbered.

## Acceptance

## Handoff

## Amendments

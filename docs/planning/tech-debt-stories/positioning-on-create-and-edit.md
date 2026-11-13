# Positioning on Create and Edit

**Type:** tech-debt story. It has no build of its own: the API contract epic's items and projects schemas build its answer. If that answer changes what a write accepts, it closes by the full story-done checklist · **Written:** 2026-10-05 by the Test Planner, at Nathan's request · **Revised:** 2026-10-22 by the Architect: widened to two position values at Nathan's direction, with eight of A6's open questions carried in · **Revised:** 2026-11-12 by the Architect: the two-position half moved to Epic 4 as its Story 3, at Nathan's direction, with the questions that depend on it (Amendments) · **Sequenced:** decided before the API contract epic's Story 2 reaches its items and projects batch, so those schemas encode the answer once. Epic 4's Story 1 follows it for the fields it adds · **Ready for:** grooming

## Goal

Decide how a create and an edit treat an item's position, then state that in the wiki and the API.

**What's known:**
- **A move refuses a final position.** When a body for `PATCH /items/:id/move` names `position`, it gets a 400 whose message says to name an anchor and side instead (TC-2.32).
- **A create or an edit ignores one.** `POST /items` and `PUT /items/:id` accept a body that names `position`, and drop the field. A5b's closing Reconciler run noticed this (`docs/archive/test-reconciliation-a5b.md`, under Candidate New Cases).
- **The wiki allows both behaviors.** wiki positioning §2: "The API takes no final position from any caller", and no endpoint sets positions outright. Ignoring a position meets that rule, so neither behavior is a bug.
- **Nathan's ruling (2026-10-05):** ignoring the field is acceptable for now. This story is for thinking it through, not a fix.

**The question, in Nathan's words:** "whether they ought to directly assign a position instead of taking relative params like anchor+side from which the position gets calculated."

**Projects are in scope too.** Item and project positions share one anchor-and-side layer (root `AGENTS.md`, "One position math layer"), and their tree operations are kept symmetrical. Whatever is decided for items' create and edit applies to projects' as well.

**Out of scope:**
- the move's refusal of a final position, which wiki positioning §2 and TC-2.32 settle;
- the resolution math itself: wiki positioning §3's coarsest fit and its fallbacks, and §6's reindex;
- an item's second stored position, among all its siblings. That's Epic 4's Story 3 ([`epic-4-roadmap.md`](../epic-4-stories/epic-4-roadmap.md), Q23–Q28). It decides which position a create or an edit sets, once this story has decided whether they set one at all;
- which write may name a status or a kind. Those fields are Epic 4's Story 1's, and it follows Decision 4's answer.

## Inbound deferrals

Carried in from A6's plan (`a6-audit-guidance-and-first-run.md`, Open questions) on 2026-10-22, at Nathan's direction. Each is a question this story's answers change, so answering it before them would mean answering it twice.

*From the A6 first-run audit's report (`docs/audits/code-quality-audit-a6.md`, 2026-10-07):*
- **For the PO: "or none" in item-attachment §2a.** It says an Attached write "may name the parent's workphase, or none". The code refuses an explicit `workphaseId: null` for an Attached item whose parent has a workphase. If "none" means "omitted", nothing changes. *Why here:* Decision 4 covers the same paragraph's `workphaseId: null` sentence, and which writes can name a workphase.

*From the Coder, A6 batch 3d (2026-10-21):*
- **For the PO: what a create refuses first.** wiki item-attachment §14 doesn't order a create's refusals, and a request can break several. The order now is the route's parent checks, then the project's, then a `type` or `agentId` that names no row, then `resolveCreate`'s: a workphase that doesn't exist, the flag on a parentless create, an attached child naming another workphase, a Free item's workphase from another workflow. A move or an edit takes its own parent checks after the workphase's existence, so a request with a bad parent and a bad workphase answers differently by entry point. *Why here:* if a create takes an anchor (Decision 3), the anchor's refusals join the list. Order it once, with the create's inputs final.

## Decisions

None yet. To groom:

1. **What each write takes today.** Grooming establishes this first. For `POST /items`, `PUT /items/:id`, and the projects' create and edit, it checks:
   - whether each write takes an anchor and side;
   - what each one does with a `position`.
2. **Whether a create or an edit should take a final position.** That would reverse wiki positioning §2's rule. That section gives its reason: a client's view can be narrower than the true order, so a number computed from it can jump past a neighbor the client never saw. A reversal needs an answer to that, so the PO rules on it, with the wiki.
3. **Whether a create or an edit should place an item at all,** or leave placement to the move. Today a create with no anchor goes after its scope's true last item (wiki positioning §3's step 5, TC-2.6).
4. **What a write does with a field it doesn't take.** It can ignore the field, as a create and an edit do today, or refuse it, as the move does. The API contract epic's request schemas (its C1) make this choice for every field, so the two answers should agree. The MCP tools that wrap these routes follow the same answer.
   - **Position isn't the only such field.** `PUT /items/:id` ignores a `workphaseId`, so on an edit only a move can name one (the Coder and the Reconciler, at A5b's close). wiki item-attachment §2a's sentence "A write that names `workphaseId: null` is accepted and leaves the item with no workphase" reads as if any write could, but an edit that names `null` gets "where it was shown" instead.
   - **That leaves a message wrinkle.** Suppose an edit detaches an item whose Card has no workphase. It's refused with wiki item-attachment §2a's message, and the message's first way out is to name a workphase in the same write, which an edit can't do.
   - **Epic 4 adds two more such fields,** a status and a kind. Its Story 1 says which write may name each, by this decision's answer.

## Work, in batches

None of its own. The API contract epic's Story 2 builds the answer, in its items and projects batch.

## Code map

## Acceptance

## Open questions

## Handoff

Whatever the decisions are, later work inherits them in these places:
- **The PO** states them in wiki positioning §2, and in item-attachment §2a for which writes can name a workphase. The PO also answers the carried-in PO questions.
- **The Test Planner** writes their cases. TC-2.32 covers only the move's refusal today.
- **The API contract epic's** items and projects schemas encode them.
- **Epic 4's Story 1** follows Decision 4 for a status and a kind, and its Story 3 decides which position a create or an edit sets.

## Amendments

- **2026-11-12 — the two-position half moved to Epic 4 (Nathan).** "Two position values" left this plan for [`epic-4-roadmap.md`](../epic-4-stories/epic-4-roadmap.md), as that epic's Story 3. Its direction and reasons are that roadmap's Group 6, and its decisions 5–9 are Q24–Q28 there. Story 9's note is Q23.
  - **Eight carried-in questions went with it,** to Story 3's Inbound: whether a workphase write discloses its reindex, a project move naming both `prevId` and `nextId`, item-positioning §2's third `"none"` case with TC-7.18, TC-3.4's setup, an anchor with two faults, TC-7.10, whether `Item.positionScope` becomes required, and Story 9's note on dual position values.
  - **Two out-of-scope notes went too:** the active/done split, which that epic's group 1 rules, and a project's coming to use a different workflow, which is under its Q24.
  - **Why:** the status model decides which items hold a Free position, so the second value is decided after it and built between that epic's status stories and its Quick Item stories. What's left here is the half the API contract epic's schemas need first.

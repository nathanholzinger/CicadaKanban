# Positioning on Create and Edit

**Type:** tech-debt story · **Written:** 2026-10-05 by the Test Planner, at Nathan's request · **Sequenced:** not yet. Grooming it before the API contract epic's Story 2 lets that story's items and projects schemas encode the answer once · **Ready for:** grooming

## Goal

Decide how a create and an edit treat an item's position, then state that in the wiki and the API.

**What's known:**
- **A move refuses a final position.** When a body for `PATCH /items/:id/move` names `position`, it gets a 400 whose message says to name an anchor and side instead (TC-2.32).
- **A create or an edit ignores one.** `POST /items` and `PUT /items/:id` accept a body that names `position`, and drop the field. A5b's closing Reconciler run noticed this (`docs/audits/test-reconciliation-a5b.md`, under Candidate New Cases).
- **The wiki allows both behaviors.** wiki positioning §2: "The API takes no final position from any caller", and no endpoint sets positions outright. Ignoring a position meets that rule, so neither behavior is a bug.
- **Nathan's ruling (2026-10-05):** ignoring the field is acceptable for now. This story is for thinking it through, not a fix.

**The question, in Nathan's words:** "whether they ought to directly assign a position instead of taking relative params like anchor+side from which the position gets calculated."

**Projects are in scope too.** Item and project positions share one anchor-and-side layer (root `CLAUDE.md`, "One position math layer"), and their tree operations are kept symmetrical. Whatever is decided for items applies to the projects' create and edit as well.

**Out of scope:**
- the move's refusal, which wiki positioning §2 and TC-2.32 settle;
- the resolution math itself: wiki positioning §3's coarsest fit and its fallbacks, and §6's reindex.

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

## Work, in batches

Planned once the decisions are made.

## Code map

## Acceptance

## Handoff

Whatever the decisions are, later work inherits them in three places:
- **The PO** states them in wiki positioning §2, and in item-attachment §2a for which writes can name a workphase.
- **The Test Planner** writes their cases. TC-2.32 covers only the move's refusal today.
- **The API contract epic's** items and projects schemas encode them.

# Positioning on Create and Edit, and Two Position Values

**Type:** tech-debt story. It changes what the app does (a second stored position for items), so it closes by the full story-done checklist, audit included · **Written:** 2026-10-05 by the Test Planner, at Nathan's request · **Revised:** 2026-10-22 by the Architect: widened to two position values at Nathan's direction, with eight of A6's open questions carried in · **Sequenced:** not yet. Grooming it before the API contract epic's Story 2 lets that story's items and projects schemas encode the answer once. It also has to land before the first surface that shows a parent's children together, attached and Free · **Ready for:** grooming

## Goal

Two decisions about item positions, made together because each changes what the other's writes take.

### Positioning on create and edit

Decide how a create and an edit treat an item's position, then state that in the wiki and the API.

**What's known:**
- **A move refuses a final position.** When a body for `PATCH /items/:id/move` names `position`, it gets a 400 whose message says to name an anchor and side instead (TC-2.32).
- **A create or an edit ignores one.** `POST /items` and `PUT /items/:id` accept a body that names `position`, and drop the field. A5b's closing Reconciler run noticed this (`docs/archive/test-reconciliation-a5b.md`, under Candidate New Cases).
- **The wiki allows both behaviors.** wiki positioning §2: "The API takes no final position from any caller", and no endpoint sets positions outright. Ignoring a position meets that rule, so neither behavior is a bug.
- **Nathan's ruling (2026-10-05):** ignoring the field is acceptable for now. This story is for thinking it through, not a fix.

**The question, in Nathan's words:** "whether they ought to directly assign a position instead of taking relative params like anchor+side from which the position gets calculated."

### Two position values

**Nathan's direction (2026-10-22):** an item gets at least two stored positions:
- **its order among its siblings,** all of its parent's children, attached or Free;
- **its order among its fellow Free items,** the order the board shows today.

**Why, in Nathan's words:** "there will be contexts outside of the board where all children should be displayed amongst each other regardless of attached/detached status."

**What it replaces.** wiki item-positioning §1 says an item's position is one scalar, and §2 compares it in one scope chosen by the item's state: its parent's attached children, the workflow's Free items, or none. So a detached child has no place among its parent's other children. That page's first Open question asks whether a Free child needs one, "if a surface ever shows all of a parent's children together". Nathan's direction answers yes; the PO states it.

**Projects are in scope too.** Item and project positions share one anchor-and-side layer (root `CLAUDE.md`, "One position math layer"), and their tree operations are kept symmetrical. Whatever is decided for items' create and edit applies to projects' as well. A project has no attached or Free state, so its one position is already a sibling order: the items' new sibling value is the same kind of value, and should share the projects' code where it can. The Free order stays items-only.

**Out of scope:**
- the move's refusal of a final position, which wiki positioning §2 and TC-2.32 settle;
- the resolution math itself: wiki positioning §3's coarsest fit and its fallbacks, and §6's reindex. The second value reuses them;
- the active/done split and the terminal flag. Epic 4's done-column rework owns them (`epic-4-decisions.md` §12, which holds the A6 audit's #44 and #45), and it changes which items have a Free position at all;
- what a project's coming to use a different workflow does to its items' Free positions, which is wiki item-positioning's second Open question. It concerns only the Free value, and nobody has scheduled it.

## Inbound deferrals

Carried in from A6's plan (`a6-audit-guidance-and-first-run.md`, Open questions) on 2026-10-22, at Nathan's direction. Each is a question this story's answers change, so answering it before them would mean answering it twice.

*From the A6 first-run audit's report (`docs/audits/code-quality-audit-a6.md`, 2026-10-07):*
- **For the PO: does a workphase write disclose its reindex?** `PUT /workphases/:id`'s terminal-flag backfill appends items without disclosing the reindex it can trigger (`routes/workphases.ts:141`). Wiki positioning §7 and item-positioning §5.1 list only item writes. *Why here:* this story decides which writes set which value and what each discloses. Epic 4 may retire the terminal flag, and the backfill with it.
- **For the PO: "or none" in item-attachment §2a.** It says an Attached write "may name the parent's workphase, or none". The code refuses an explicit `workphaseId: null` for an Attached item whose parent has a workphase. If "none" means "omitted", nothing changes. *Why here:* Decision 4 covers the same paragraph's `workphaseId: null` sentence, and which writes can name a workphase.
- **For the PO: a project move naming both `prevId` and `nextId`** uses `prevId` and ignores `nextId`, which wiki project-tree §6 doesn't state. *Why here:* with two orders, a move has to say which order its neighbor is in. That reopens the move's request shape, and the API contract plan's Story 1 already asks whether `anchorId`/`side` and `prevId`/`nextId` become one shape.

*From the Coder, A6 batch 3a (2026-10-21):*
- **For the Test Planner: wiki item-positioning §2's third `"none"` case,** an item filed in a workphase of a workflow its project doesn't use, has no case among TC-2.13 to TC-2.17. `workflows.test.ts`'s positionScope test checks it and carries no ID. *Why here:* this story redefines `positionScope`, so its cases are written once, against the new §2.
  - **Found 2026-10-22 (A6's Reconciler run):** TC-7.18 states it, for an item left in its old workflow by a project move, and its route test is `Automated`. It's rewritten with the scope cases.
- **For the Test Planner: TC-3.4's setup has a parent with a workphase.** Its ID is on the test for a parent with none (wiki item-positioning §3: the scope is the parent's children, not a workphase). If that variation wants a case of its own, the test's ID follows. *Why here:* the sibling scope widens to every child, so TC-3.4 is rewritten.

*From the Coder, A6 batch 3d (2026-10-21):*
- **For the PO: what a create refuses first.** wiki item-attachment §14 doesn't order a create's refusals, and a request can break several. The order now is the route's parent checks, then the project's, then a `type` or `agentId` that names no row, then `resolveCreate`'s: a workphase that doesn't exist, the flag on a parentless create, an attached child naming another workphase, a Free item's workphase from another workflow. A move or an edit takes its own parent checks after the workphase's existence, so a request with a bad parent and a bad workphase answers differently by entry point. *Why here:* if a create takes an anchor (Decision 3), the anchor's refusals join the list. Order it once, with the create's inputs final.
- **For the PO: an anchor with two faults.** wiki positioning §2 lists four ways a neighbor fails and orders none. A neighbor outside the scope that also has no position is now refused as outside the scope, for items as for projects; for items it was refused for having no position. *Why here:* with two scopes, "outside the scope" depends on which order the anchor names.
- **For the Test Planner: TC-7.10 and an item that ends with no workphase.** The new test carries the ID: an item with no workphase has no scope for a neighbor to be in. If the variation wants a case of its own, the ID follows. *Why here:* a child with no workphase gains a sibling scope under this story, so the premise changes.

## Decisions

None yet. To groom:

**Positioning on create and edit:**

1. **What each write takes today.** Grooming establishes this first. For `POST /items`, `PUT /items/:id`, and the projects' create and edit, it checks:
   - whether each write takes an anchor and side;
   - what each one does with a `position`.
2. **Whether a create or an edit should take a final position.** That would reverse wiki positioning §2's rule. That section gives its reason: a client's view can be narrower than the true order, so a number computed from it can jump past a neighbor the client never saw. A reversal needs an answer to that, so the PO rules on it, with the wiki.
3. **Whether a create or an edit should place an item at all,** or leave placement to the move. Today a create with no anchor goes after its scope's true last item (wiki positioning §3's step 5, TC-2.6).
4. **What a write does with a field it doesn't take.** It can ignore the field, as a create and an edit do today, or refuse it, as the move does. The API contract epic's request schemas (its C1) make this choice for every field, so the two answers should agree. The MCP tools that wrap these routes follow the same answer.
   - **Position isn't the only such field.** `PUT /items/:id` ignores a `workphaseId`, so on an edit only a move can name one (the Coder and the Reconciler, at A5b's close). wiki item-attachment §2a's sentence "A write that names `workphaseId: null` is accepted and leaves the item with no workphase" reads as if any write could, but an edit that names `null` gets "where it was shown" instead.
   - **That leaves a message wrinkle.** Suppose an edit detaches an item whose Card has no workphase. It's refused with wiki item-attachment §2a's message, and the message's first way out is to name a workphase in the same write, which an edit can't do.

**Two position values:**

5. **Each value's scope.** The sibling value compares among a parent's children, and top-level items among their project's top-level items, or not at all. The Free value compares among the workflow's Free items, as today. Which items have each value, and what the null cases become: done items (wiki item-positioning §6), an item with no workphase, an item in a foreign workflow.
6. **Which writes set which value.** A reorder among siblings, a board move, a reparent, an attach and a detach each set one value, both, or neither. Where a detached child lands among its siblings, and where an attached child lands in the Free order if it's detached later, follow from this.
7. **What each surface reads.** The board's Free lists read the Free value. Whether a Card's Descendants section orders its attached children by the sibling value, and what reads the sibling value first (the Sheet's children, MCP).
8. **The API's shape.** Both values in a response, `positionScope` redefined or replaced, how a move names which order its anchor is in (the carried-in `prevId`/`nextId` question), and reindex disclosure for each order (wiki positioning §7).
9. **The migration.** Every existing item needs a sibling value. Attached children already hold one; Free children and top-level items need one derived, for example from their current order or their creation time.

## Work, in batches

Planned once the decisions are made.

## Code map

## Acceptance

## Open questions

## Handoff

Whatever the decisions are, later work inherits them in these places:
- **The PO** states them in wiki positioning §2, and in item-attachment §2a for which writes can name a workphase. item-positioning §1 and §2 are rewritten for two values, and its first Open question comes off. The PO also answers the carried-in PO questions.
- **The Test Planner** writes their cases. TC-2.32 covers only the move's refusal today. The scope cases (TC-2.13 to TC-2.17, TC-3.4, TC-7.10) are rewritten against the new §2, with the carried-in Test Planner items.
- **The API contract epic's** items and projects schemas encode them.
- **Root `CLAUDE.md`** (the Architect): the data model's `items` row, and "One position math layer".

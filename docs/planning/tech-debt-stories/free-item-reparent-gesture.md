# Free-Item Reparent as a Board Gesture

**Type:** tech-debt story. If it builds the gesture, it changes what the app does, so it closes by the full story-done checklist, audit included · **Written:** 2026-10-28 by the Architect, from Epic 3.5's Story 9, which Nathan took out of that epic's roadmap the same day · **Sequenced:** not yet. It comes after Epic 3.5's Story 8, whose Story 8.1 removes the Card layer · **Ready for:** grooming

## Goal

Decide whether the board offers a drop that reparents a Free item and keeps it Free. The options are to build it, to defer it, or to conclude it isn't a board action that makes sense.

**What's known:**
- **The API already supports it** (wiki item-attachment §4). A request carries `parentId` and the attachment flag independently, and omitting the flag keeps the item's current state. Epic 3.5's Story 1 built it, so nothing is left to build on the server.
- **Both wiki pages hold it as open:** item-attachment's Open questions, "Free-item reparent *as a board gesture*", and board-drag-interaction's, which points there.
- **It adds a third meaning to a drop.** Today a release on the board either repositions the item or attaches it. A Free reparent has to be told apart from both.
- **Its candidate home is gone.** Story 6.1's dry run put it at the Card layer, as a third meaning of a release there. Story 8.1 folds the Card layer into the Descendants layer (Epic 3.5's roadmap), so this story starts from a board without that layer.
- **Why it waited:** it's judged best once the other gestures exist and feel settled, which is Story 8's work.

**Out of scope:** dual position values, which Epic 3.5's Story 9 also raised. They're Epic 4's Story 3 (`docs/planning/epic-4-stories/epic-4-roadmap.md`, Group 6), where Story 9's note on them is Q23. Until 2026-11-12 they were `positioning-on-create-and-edit.md`'s second half.

## Inbound deferrals

- **Story 8's close-out audit, #16 (Nathan, 2026-11-06), optional, if this story builds the gesture:** `client/src/components/workflow/useBoardDnd.ts`'s region cache could become a DOM adapter of its own, beside the gesture's orchestration: structure resolution, element invalidation, sampling and parent lookup. The hook is about 900 lines. A third meaning of a drop would make it larger, and this is the time the audit named for the split, "if this hook grows". From `docs/audits/code-quality-audit-story-8-close-out.md`, which moves to `docs/archive/` when that audit closes.

## Decisions

None yet. To groom:

1. **Whether the board offers the gesture at all,** or whether a Free reparent stays off the board, reached only through the API.
2. **If it does, where in the drag it lives,** and how the user tells it apart from an attach and a reposition (wiki board-drag-interaction §6's drop meanings).

## Work, in batches

Planned once the decisions are made.

## Code map

## Acceptance

## Open questions

## Handoff

- **The PO** states the decision in wiki item-attachment §4 and board-drag-interaction, and the two Open questions come off.
- **The Test Planner** writes the cases if the gesture is built.

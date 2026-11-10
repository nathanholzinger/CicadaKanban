# The Descendants Highlight Cue Links the Ghost to Its Anchor

**Type:** tech-debt story. It changes what the drag shows, so it closes by the full story-done checklist, audit included · **Written:** 2026-11-08 by the PO, at Nathan's direction, from Epic 3.5's Story 10 batch 4b · **Sequenced:** not yet. Nathan takes it on when he's ready to revamp the Descendants layer's cue · **Ready for:** design

## Goal

Revamp the cue that shows, in a Card's Descendants section, how the ghost relates to the hierarchy. Today the blue line is the cue, and it doesn't always sit beside the item the ghost relates to. Add a second rendering that links the ghost to that item more clearly. Nathan's suggestion is a vertical dashed line. The look is open (Decisions).

**How the line works today (Nathan, 2026-11-08), expected behavior that stays:** the blue line is drawn in the row the item falls into in the flattened hierarchy list. So it doesn't always render next to the anchor the release names. A placement that is the next sibling of an ancestor, or a child of one, is drawn in the list order of the rows, and the ghost's depth shows the level. This story doesn't change where the line is drawn. It adds a cue that makes the link visible.

**The known defect this story fixes.** The edge case below is small, and Nathan accepts it as it stands until this story.
- **Fixture:** Card `P` has attached children `S1` and `S2`, and `S2` has an attached child `S2a`. A Free Card `X` zooms into `P`'s section from the column and is not moved after the zoom.
- **What the section shows:** the ghost is in the last gap, below `S2a`, at depth 0, as `P`'s last child. The blue line is on `S2`'s bottom edge, which is also `S2a`'s top edge. It reads as a slot between `S2` and `S2a`, not as the place the ghost is.
- **What is right:** the release saves `X` as `P`'s last child, after `S2`'s whole branch (anchor `S2`, side after). `S2` is a legal anchor in `P`'s scope. `S2a`, its child, is not. Only the line's place is wrong.
- **When it shows:** on the zoom's default seed, before the pointer moves the ghost. As soon as the drag registers the cursor again, the line and the ghost agree, so a typical drag of a Stub through the section doesn't show it.
- **Cause, from reading the code:** at the seed, the line is drawn on the row of the projection's resolved anchor (`dragChrome.tsx::useItemRow`, the `holdSectionOrder` branch). Once the pointer moves, `useLiveDropSide` draws it on the ghost's named neighbor in list order (`namedAnchorFor`), which is the flattened list's row.

**The story is done** when the new cue links the ghost to the anchor in every state the section offers, the seed included, and the line and the cue never point at two different places.

**Also deferred here — the leaf final-crossing mismatch (Nathan, 2026-11-08).** In Card P with attached leaves A, B, C and X, one final pointer move leaves the ghost between B and C at depth 0. The highlight names C/before, but release sends B/after. Both save A/B/X/C in the observed fixture. Story 10's DRAG-4.35/B14 pilot reproduced the mismatch; Nathan and the PO accept it until this story rather than fixing it in the automation batch. The current case and its automation are removed, and the ID stays retired. At design, settle the highlight/request contract together with the flattened-list cue, then write fresh cases and automation for the decided behavior.

**What the Coder found when trying a fix (2026-11-08, Vitest only; no E2E spec ran against it).** The fix was reverted and not kept.
- **Cause:** the line is drawn on the ghost's neighbor in dnd-kit's list, `B` or `C` by where the carried copy sits against the ghost's middle (`dragCollision.ts::dropAnchorFor`, through `dragChrome.tsx::useLiveDropSide`). The release sends the projection's resolved anchor (`descendantsProjection.ts::descendantsReleasePlacement`), which `lib/hierarchyPlacement.ts::resolvePlacement` always spells as after the row to sit after, here `B`. A carried copy above the ghost's middle names `B`, so the two agree, and below it names `C`, so they don't. The DRAG-1.16 spec asserts the two agree and passes because its pointer leans up.
- **The fix tried:** `advanceProjection` took the named neighbor as the resolved anchor when that neighbor is a child of the resolved parent directly beside the gap. That is Top, or Bottom as the next sibling of the row to sit after, which is the same slot (hierarchy-placement §1). Another parent's row, an overflow row and the carried branch kept the rule's anchor, and so did a held reading (`holdsReading`). `sameProjection` already compares the anchor, so the session holding the release saw a change of neighbor. The depth, the attached-child scope and the own-slot no-write held, and mutation checks showed the unit tests catch each piece.
- **It changes the request in other states.** DRAG-7.4's sibling state beside `T` sends `T`, before, where it sent `R`, after, and a Vitest test that pinned the old anchor had to change. Whoever builds the fix reruns every E2E spec that reads a Descendants release's anchor.
- **Which way to fix it is part of the design.** The release can follow the line, as tried, or the line can move to the resolved relation. Moving the line to the rule's anchor alone would hide which side the carried copy leans to, which wiki board-drag-interaction §2 says picks the relation. The new cue may settle it.

**Out of scope:**
- **The look of the sidebar's line,** whose line rides the ghost's own top edge (`dragChrome.tsx`, above `useLiveDropSide`).
- **The zoom-in morph and the cues' final look,** which moved to the Dashboard, Navigation & Notifications epic (`epic-8-decisions.md`).

## Inbound deferrals

- **Epic 3.5 Story 10, batch 4b, B09 (`story-10-batches.md`, Stop 2):** the nested-last fixture above. Nathan ruled on 2026-11-08 that the wiki doesn't mention it and that the test case is removed, since this story fixes the defect. B09's saved last-child result stays a test of DRAG-4.30.
- **Epic 3.5 Story 10, batch 4b, retired DRAG-4.35/B14:** the leaf, depth-0 highlight/request mismatch above. Nathan's later direction defers this defect here too and removes its case and automation from Story 10. It is no longer an immediate Coder fix; the existing clock-test handoff in Story 10 is separate.

## Decisions

None yet.

- **The request defect waits for this story (Nathan and the PO, 2026-11-08).** It is not fixed in Story 10, because it changes no saved order and the cue may change the line it reads.
- **The extra cue's look is open,** to be chosen when the story designs it. A vertical dashed line from the ghost to the row of the entry it relates to is the first idea. Any other rendering that does the same job is fair.
- **The cue shows a sibling or a parent.** The ghost is placed as a sibling after an entry, or as a child of one, so the cue links the ghost to that entry (hierarchy-placement §1).
- **The wiki rule is the PO's, written when the look is chosen.** Wiki board-drag-interaction §2 (rule 3) says the highlight and the release always name the same card, and hierarchy-placement §1 resolves a depth to an ancestor. The line's place in the flattened list isn't stated yet, and the story's rule says it, with the new cue. It's a `**Planned:**` passage until the story builds it.
- **The sidebar is checked, not assumed.** Hierarchy-placement §1 is a shared rule, so whether the sidebar's drop line gets the same cue is settled at design time.

## Work, in batches

Planned when the story starts. It begins with these:

1. **Design.** The Architect and Nathan choose the cue's look and the states it draws in (seed, each depth, an overflow row, the hierarchy modal's list), and the PO writes the rule.
2. **Build.** The Coder adds the cue to the section, and corrects the seed's line to the flattened row. The new cue carries a test surface (a `data-` attribute) for the E2E specs.
3. **Tests.** The Planner writes the cases. The Automator's specs read the line's row and the new cue against the fixture above and against a moved-pointer drag.

## Code map

| File | Batch | Change |
|---|---|---|
| `client/src/components/dragChrome.tsx` | 2 | `useItemRow`'s `holdSectionOrder` branch, which draws the seed's line on the resolved anchor, and `DropSideIndicator`. |
| `client/src/components/workflow/descendantsProjection.ts` | 2 | The projection's resolved anchor and gap, which the release sends. The request defect is fixed here if the release follows the line. |
| `client/src/components/workflow/dragCollision.ts` | 2 | `dropAnchorFor`, which names the line's neighbor, if the line follows the release instead. |
| `client/src/components/StubRows.tsx`, `KanbanCard.tsx` | 2 | The rows that draw the line, and the section the new cue spans. |
| `client/src/components/workflow/AGENTS.md` | 2 | "The live drop line is drawn on the row the side highlight names", which the story corrects if the line's row changes. |

## Acceptance

- The fixture above shows the line and the ghost together at the seed, and the release is unchanged.
- The new cue links the ghost to its anchor in every state the section offers, and on the hierarchy modal's list if the design includes it.
- A Stub dragged through the section sees the line and the cue agree after every pointer move.
- The leaf final-crossing fixture follows the highlight/request contract settled at design, with the saved order preserved and fresh regression coverage. The retired DRAG-4.35 ID is not reused.
- The wiki states the rule, the cases cover it, and `npm run check` and `npm run test:e2e` pass.

## Open questions

- **For Nathan and the Architect: the cue's look and its states,** when the story starts.
- **For the PO, at design:** whether wiki board-drag-interaction §2 (rule 3) says "the highlight and the release always name the same card" once the line's place in the flattened list is stated. The fixture's line is on the anchor `S2` at the seed. In motion it is drawn in the flattened row, which can be another row.

## Handoff

The B09 line-place guard and the retired DRAG-4.35/B14 final-crossing obligation are this story's to cover with fresh cases/tests once the line, new cue and request contract are settled. B09's existing DRAG-4.30 last-gap/last-child assertions remain in Story 10. Story 10's close names this plan for both deferred defects.

## Amendments

- **2026-11-08 — Both highlight defects deferred (Nathan, after working through them with the PO).** Superseded the earlier exclusion of DRAG-4.35's leaf mismatch. It is accepted until this story; the Planner retires its current case and the relevant test writers remove its automation. No app fix is part of the retirement.

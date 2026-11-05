# The Carried Copy Sometimes Leaves the Cursor

**Type:** tech-debt story. A fix changes what the drag does, so it closes by the full story-done checklist, audit included · **Written:** 2026-11-04 by the Architect, from Epic 3.5's Story 8.10, which Nathan took out of that epic's roadmap the same day · **Sequenced:** not yet. It's picked up once it has steps to reproduce · **Ready for:** reproduction

## Goal

Find why the board drag's carried copy sometimes ends up away from the cursor, and fix it.

**The issue:** Nathan saw it a few times while testing Epic 3.5's Story 8.8 (2026-11-04). Moving in and out of contexts during a drag, the carried copy ended up off the cursor. It has popped up only in rare instances, and there are no reliable steps to reproduce it: a round of manual testing aimed at it, the same day, didn't make it happen. It may be older than Story 8.8.

**Not the issue: the offsets the drag has by design.**
- **The clamp.** While the cursor is outside the context and the pop-out clock runs, the copy is held at the context's edge (wiki board-drag-interaction §2), and it catches up at the pop. Since Story 8.8, a section is shorter by the carried branch, so the copy meets the Card's bottom sooner.
- **The jump at a layer change.** Rows move under a cursor that hasn't, and the copy re-anchors. It's momentary, and it belongs to the zoom-in morph, which moved from Epic 3.5 to the Dashboard, Navigation & Notifications epic (`epic-8-decisions.md`).
- **The issue is an offset that stays:** the copy stays off the cursor while the cursor moves around inside one context, after any pop has settled.

**When it happens, note:**
- what was picked up, a Card or a Stub, and where on it it was grabbed;
- how the drag started: a slow pickup or a fast flick;
- the switches on the way: a zoom into a Card, a pop out to a column, a move from one Card's section to another's, the hierarchy modal;
- whether the board or the window scrolled during the drag;
- whether the offset stays as the cursor moves inside one context;
- a screen recording, if one can be had.

**Out of scope:** the zoom-in morph, and the clamp's and the snap's designed behavior (wiki board-drag-interaction §2, §3).

## Decisions

None yet. The fix follows the cause.

## Work, in batches

Planned once it reproduces. An investigation starts from these.

**Leads, from reading the code and dnd-kit's source** (unconfirmed, most likely first):

1. **Where the item is grabbed: the re-anchor works one way.**
   - `dragOverlayGeometry.ts::reanchorOverlayTransform` puts the copy under the cursor only when a Card's pickup turns into a Stub. Every other form keeps dnd-kit's pickup offset.
   - The shortCard is `SHORT_CARD_HEIGHT_PX` (96px) tall, and a Card with descendants is taller. Grabbed below its first 96px (its footer, or the indent beside a Stub row), its shortCard hangs above the cursor by the difference. Since Story 8.8 the cursor may rest on the copy's branch line there, so the copy still looks attached.
   - One drag then goes: above the cursor in a column, under it in a section, above it again after a pop out.
   - A Stub's pickup drawn as a shortCard hangs from where the Stub was grabbed, with the cursor near the shortCard's top edge.
   - By this reading the offset is steady for a given grab point, not intermittent.
2. **How fast the drag starts: the copy's measured box.**
   - The copy keeps one root element in both forms (`KanbanCard.tsx`'s header), so dnd-kit's measurement of its size follows a form switch one render later. Story 8.10 had suspected that size lag. It's short-lived.
   - The position is what doesn't follow. dnd-kit measures the copy with `getBoundingClientRect` once, as it mounts (`@dnd-kit/core`'s `useDragOverlayMeasuring`), and afterward updates only its width and height. By the mount the copy has already moved: the 5px activation distance, plus whatever the pointer moved in the render or two before. The shortCard's `rotate-2` also widens the measured box a little.
   - The clamp reads that rect (`draggingNodeRect`). So, by dnd-kit's render order, does the re-anchor: `useBoardDnd.ts::pickupRectRef` takes the first non-null rect the modifier sees, which would be the copy's own mount measurement, not the source's first rect, which its comment says it is.
   - The pointer's travel before the mount would then be an offset for the whole drag: a few pixels on a slow pickup, possibly tens on a fast flick, pointing back toward where the drag started.
   - It would show where the copy is placed or held rather than following the cursor freely: the Stub in a Card's section, where the clamp leaves it only `2 × CARD_CONTENT_INSET_PX` (26px) of sideways room, and a shortCard held at a column's side.
   - Intermittent by nature, since it depends on the pickup's speed. A temporary log of `pickupRectRef` beside dnd-kit's `activeNodeRect` at pickup confirms or rules out the render-order reading.
3. **The snap tween is applied twice** after a pop, once for the collision rect and once for the copy (`useBoardDnd.ts`, the comment on `clampToContext`). Least likely: `useSnapTween.ts` always ends on its target, so it can't leave an offset that lasts. Setting "Snap to cursor (ms)" to 0 in the drag tuning panel rules it out on any repro.
4. **Scrolling** is unlikely. The copy is `position: fixed`, and dnd-kit adds no scroll to a DragOverlay's transform. The regions the clamp reads are re-sampled only on a pointer move or the pop timer (`useBoardDnd.ts::sampleRegions`), so an auto-scroll under a still cursor can hold the copy at an out-of-date edge until the next move.

**Is it Story 8.8's?** Everything in the leads is older than Story 8.8, so the board before it may show the issue too. Commit `c59a268` is the board before Story 8.8, and `b065b24` holds Story 8.8's trial behind its switch, so one build runs with the collapse and without it. Worth one check once there are steps.

**Without reliable steps,** a throwaway spec can look for it. Run against the test servers, it drives many switches through `tests/helpers/dragGesture.ts`, with pickups at different speeds and grab points, and checks the copy's box against the cursor after each one settles. It's a search, not coverage, so it's deleted afterward, as Story 8.8's Phase 1 did with its spec.

## Code map

## Acceptance

- Steps that reproduce the issue, and its cause.
- Through those steps, the copy stays on the cursor inside each context once any pop has settled.
- The gate passes (`npm run check`), and `npm run test:e2e` on the test servers.

## Open questions

- **For Nathan, if lead 1 is the cause:** whether the shortCard is put under the cursor too, at pickup and at every form switch, and not only at the switch into a Stub. That's a behavior choice, where lead 2 would be a plain defect. It waits until the story is revisited and the cause is better known (Nathan, 2026-11-04).

## Handoff

- **The PO,** if the fix changes a stated rule of the drag (wiki board-drag-interaction §2's clamp, §3's snap), or if lead 1's answer adds one.
- **The Test Planner,** a case for the steps that reproduce it.

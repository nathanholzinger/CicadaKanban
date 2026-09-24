# Story 6.1 — Drag-layer refactor against stock dnd-kit (vestige removal after Story 6)

Implementation plan for Epic 3.5 Story 6.1. No rule changes: the wiki is
the spec, and this story makes the code look as if the rules on the page
had been there from the start. Same purpose as
[Story 4.1](story-4-1-efficiency-refactor.md), different method (below).
Becomes a historical record once done.

**Status: method agreed with the Product Owner 2026-09-24; not started.
Begins after Story 6's sign-off (Phase D was in progress when this was
written).** This file holds the method and the inputs already known. The
comparison and the build order are written at the start, against the code
as Story 6 leaves it.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 6.1
- Prior story: [`story-6-descendants-placement.md`](story-6-descendants-placement.md)
- Model: [`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md)
  (the plan) · [`story-4-1-comparison.md`](story-4-1-comparison.md) (its
  working document)
- Rules: the wiki as Story 6's Phase E leaves it —
  [`board-drag-interaction/`](../../wiki/board-drag-interaction/README.md),
  [`item-attachment/`](../../wiki/item-attachment/README.md),
  [`item-positioning/`](../../wiki/item-positioning/README.md)
- Depends on: Story 6. **Unblocks:** Stories 7–10 (lens 3 is aimed at them).

---

## Sequence

1. Story 6 finishes (Phase D, then Phase E's status report).
2. Story 6.1 — this.
3. The four-pass code-quality audit (`.claude/guides/audit-workflow.md`)
   over Stories 6 and 6.1 together, one report — as the Story 4 audit
   covered 4 and 4.1.
4. At epic close, the epic-wide four-pass audit.

---

## Why this story exists

Story 6 was built hands-on, and several rules changed along the way. One
of them reversed the drag layer's direction. Stories 3–4 kept adding our
own geometry (regions, bands, hit boxes). Option A (2026-09-24) handed the
column slot back to dnd-kit, and hands-on finding 3 then did the same for
the zoom-in candidate. The PO prefers library defaults over custom code
wherever the rules allow. Code written for the earlier direction is still
there, and some of it now decides things dnd-kit also decides.

## How it differs from Story 4.1, and why

Story 4.1 drafted a clean design from the settled rules first, then
compared the code with it. This story doesn't draft one:

- **The rule changes are written down.** 4.1 needed a draft because the
  rules had changed many times hands-on and nobody had a list. Story 6
  dates each change in its plan, so there's a list to trace from (lens 1).
- **A from-scratch design ignores the library.** 4.1's draft was naive in
  exactly one place: it dropped dnd-kit's sortable
  (`story-4-1-comparison.md` B1). With the direction now library-first,
  that risk is bigger. So the baseline is stock dnd-kit (lens 2).
- **Findings become phases, not a list.** The file splits flagged in the
  last two audits (see "Inputs already known") stayed on Watch Lists and
  never happened. 4.1's findings happened because they were a story with
  phases and gates. Same here.

What carries over from 4.1: the buckets (plus a fourth), phases that each
end green on every suite, no behavior change without a PO ruling first,
and hands-on checks only where a phase touches something visible.

---

## Method — three lenses, one comparison document

The findings go in `story-6-1-comparison.md` (the counterpart of 4.1's),
then get condensed into a build order in this file.

### Lens 1 — Rule-change trace

For each rule Story 6 changed, find every code site, test, test helper and
comment that still follows the old rule. Seeds below; add a row for
anything Phase D's hands-on changes.

| Date | Change | Recorded in | Old-rule footprint to look for |
|---|---|---|---|
| 2026-09-23 | The carried copy is a Stub from the Card layer down (Story 5 decision 6 reopened) | Story 6 Phase C; `story-5-stub-detach.md` decision 6 | Anything still assuming the Card form below Column layer |
| 2026-09-24 | Option A + lean: the drop lands where the ghost is. dnd-kit's shuffle picks the slot, the dragged card's own row is a collision candidate, and `dropAnchorFor` names the anchor | Story 6 hands-on finding 2; decision 2's amendment | `resolveDropSide`'s remaining callers; collision filters still dropping the active row; comments describing "over's rect decides the side"; the E2E quarter helpers (`topQuarter`) and specs skipped for "drag-gesture precision" (e.g. `item-repositioning-cross-project-dnd.spec.ts` 1.a/2.a/2.b/4.b), which may be reachable now. Report these; un-skipping is Story 10's job |
| 2026-09-24 | The release always sends the named anchor, even in the item's own slot. This narrows 4.1 decision 2 ("identity writes nothing") at Column layer | Story 6 hands-on finding 2 | `isIdentity`'s paths at Column layer; tests asserting "nothing written" for a same-slot set-down there; comments quoting decision 2 unqualified |
| 2026-09-24 | The Descendants gap is the ghost's neighbors in dnd-kit's order | Story 6 decision 2's amendment; Phase D | Any gap derived another way once D lands |
| 2026-09-24 | The zoom-in candidate is the card the blue line names, held through a dwell + cue | Story 6 hands-on finding 3 | The geometry that used to pick the candidate: Card hit-testing in layout space (`dragRegions.ts::layoutRect`, `currentTranslate`, `childRegionAt` for `card`), the detached-element re-resolve (`hasDetachedElements` in `useBoardDnd.ts`), E2E `boxOf`'s transform correction, and 4.1's kept item (b)4 ("Card candidate hit-testing in layout space is the tuned feel"), which this change overturns. Some of it may still serve a Card context's own bounds (the inside test, the clamp): sort each piece, don't assume |

### Lens 2 — "Who decides" table, with stock dnd-kit as the baseline

One row per question the drag gesture answers. For each row the comparison
fills in:
- the one module that should own the answer;
- every other site that also computes it;
- what stock dnd-kit already provides;
- where the answer is custom, the wiki rule that makes it so.

A second site computing the same answer is a finding; 4.1's "request
resolved twice" came from this lens. Custom machinery with no rule behind
it is a finding too.

The baseline column, filled in now:

| Question | What stock dnd-kit provides |
|---|---|
| Which layer is the drag in? | Nothing. Custom (wiki §1.1) |
| Which region is the zoom-in candidate? | `over`, from collision detection |
| Which slot does the ghost sit in? | The sortable strategy's shuffle |
| Which neighbor names the slot (anchor + side)? | `over.data.current.sortable` (`index`, `items`) + `arrayMove` |
| Which depth, at Descendants layer? | Nothing. Custom (§7.1), shared with the sidebar |
| Which Board-layer band (top/middle/bottom)? | Nothing. Custom (§5) |
| Where is each droppable? | Droppable measuring, transform-agnostic by default. Compare with `layoutRect`, which also backs out the sortable transform |
| Where may the carried copy go? | Modifiers, on `DndContext` and `DragOverlay` |
| What does the carried copy look like? | `DragOverlay` renders whatever it's given |
| What does the blue line show? | Nothing. It reads the anchor |
| Which items are valid targets? | Nothing. Classification (§3.2) |
| What gets written? Is it a no-op? | Nothing. `toRequest` / `isIdentity` |
| When does a clock fire (pop-in, pop-out, dwell)? | Nothing. Custom (§3.1) |
| Which element scrolls? | `getScrollableAncestors`. Kept apart on purpose (Story 4 audit #29, the `overflow-x-auto` quirk); re-check |

### Lens 3 — Dry run of the next stories

For each of Stories 7–10, list the edits it would need against the code as
Story 6 leaves it:
- Story 7: depth cap and overflow.
- Story 8: the zoom-in morph, the half-hidden blue line, and the target
  shifting at zoom-in.
- Story 9: Free-item reparent.
- Story 10: the E2E helpers and the skipped specs.

If a change needs edits in many places, it's missing a shared home; fix
that here. Anything a later story will rewrite anyway goes in bucket (d)
instead.

Plus a mechanical sweep, since none of the lenses aims at code nothing
reaches:
- unused exports;
- branches under `client/src/components/workflow/` that no test reaches
  (the coverage report).

---

## Buckets

Every difference goes in exactly one:

- **(a) Leftover.** It follows a rule that changed, or it wraps an earlier
  shape instead of reshaping it. Remove or reshape.
- **(b) Custom for a reason.** A wiki rule needs it, or dnd-kit can't do
  it. Keep it; the comparison names the reason.
- **(c) Same rule, different shape.** A judgment call. List it, and act
  only if it's cheap.
- **(d) A later story absorbs it.** One of Stories 7–10 will rewrite it.
  Record it in that story's roadmap entry and don't refactor it twice.

---

## Inputs already known — carried structural findings

None of these were done as of 2026-09-24: none of the named functions or
files exist yet. Re-check each at the start, since Story 6 may have done
some. Each one goes into the build order as a phase or part of one, not
back onto a Watch List.

- **Split `useBoardDnd.ts`** (Story 4 audit #18 → Story 5 audit #19):
  - move the clamp math to `dragRegions.ts`, with a unit table;
  - put `resolvePlacementOver` beside `placementFor`;
  - fold the three teardowns into one `endSession()`;
  - extract the pending-ghost guard.

  The file was 575 lines at the Story 4 audit, 663 at Story 5's, and 920
  in the working tree on 2026-09-24.
- **Move `placement.ts` out of `popSession.ts`** (Story 5 audit #20): the
  transition machine and the placement rules are two separate halves.
- **Move `dragCollision.ts` out of `boardDndUtils.ts`** (Story 5 audit #21,
  Story 4 #20 lineage). `dropAnchorFor`, new in Story 6, belongs in the
  collision half.
- **Move `dragBands.ts` out of `dragRegions.ts`** (Story 5 audit #22): the
  band, reservation and clip math.
- **Split `KanbanCard.tsx` into its Card tier and Stub tier** (Story 4
  audit #19, deferred to Story 6's rewrite of the Stub rows). Check
  whether Phase B made the split natural.
- **Column facts derived in four places** (Story 4 #22 → Story 5 #24,
  "leave until Story 6's all-rows change"). That change has now landed.

---

## Ground rules (as in 4.1)

- **No rule changes.** A finding that would change behavior goes to the PO
  as a decision before any code moves (4.1's F6 is the precedent).
- **Each phase ends green** on every existing suite before the next
  starts. Deleted code takes its tests with it (the coverage gate).
- **Hands-on with the PO** only where a phase touches something visible.
- **E2E:** no new precise-move cases (those are Story 10's). The existing
  suites are the regression gate.
- **Wiki and test-plan catalogs:** report only, never edit. They belong to
  the PO and the Test Planner.
- **`client/src/components/workflow/CLAUDE.md`** is updated with the code,
  not after it.

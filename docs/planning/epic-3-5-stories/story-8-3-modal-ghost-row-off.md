# Epic 3.5 Story 8.3 — A hold from above draws the modal's ghost a row off

**Type:** story · **Written:** 2026-10-29 by the Architect, from Nathan's ruling of 2026-10-28 · **Status:** planning

## Goal

The hierarchy modal draws the ghost where a release writes it, whichever way the drag came to the overflow row, including for an item that carries a subtree.

**The defect** (Story 7's plan, `docs/archive/story-7-depth-cap-and-hierarchy-modal.md`: Amendments, "2026-10-28, batch 13", and Open questions, "For Nathan, from batch 13"):
- **The gesture:** `W` is first in `P`, with an attached child `WC`. It's picked up and moved in one step to the top quarter of `R`'s overflow row, then held.
- **What happens:** the modal opens with the projection at `3:3:true`, which is `R`'s first child, before `R1`.
  - The cursor is at y 532.
  - The modal draws `R1` at 507–531 and the ghost at 535–559, after `R1`.
  - A release writes `R`'s first child, before `R1`.
  - So the ghost is drawn a row away from what the release writes.
- **What Story 7 knew:**
  - The same cursor point reached by a ladder of small moves reads `6:2:true`, the gap below the overflow row. So the `3:3` comes from the path.
  - `W` alone, at that aim, reads `6:2` and runs no hold, which is right.
  - With the cursor inside the `3:3` zone, from 0 to 24px into `R`'s box, the modal draws the ghost where the release writes it, with or without `WC`.
- **What it didn't know:** where the extra row comes from. The modal reasons in layout space (`HierarchyModal.tsx::placeAtCursor`), and its list has `WC` in it, above the ghost's slot.

**The rule it breaks:** DRAG-7.15. The modal opens with the ghost's spot under the cursor, and a release right after commits what it would have before the modal opened. That holds for an item that carries a subtree, and whichever way the cursor came to the gap. Wiki board-drag-interaction §7.3 states it.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds it, and Nathan tries it hands-on.
- **No new drag specs.** The spec for the one-step move would carry DRAG-7.15, and it waits for Story 10.
- Unit tests of the pure modules work as usual.

**Out of scope:**
- **The same gap from every path.** The named neighbor flips at the ghost's middle, so the gap a point reads can depend on where the ghost was (wiki board-drag-interaction §2). The defect is that the drawing and the write disagree, not that the path matters. A trace that shows the path's reading is itself wrong goes to Open questions.
- **How a layer change feels,** and which trigger reads which point. These are the zoom-in morph's.
- **The hold's look and timing.**

## Scope

- **Wiki passages:** none. §7.3 already states the rule, and DRAG-7.15 states its subtree clause.
- **Test-plan cases:**
  - **DRAG-7.15** stays `Automated`, on the Test Planner's lean, which Nathan accepted on 2026-10-28. Its specs reach the gap in small steps, or aim at `R`'s own row, and pass.
  - **DRAG-7.17,** a watch item (Inbound deferrals).

## Inbound deferrals

- **From Story 7** (roadmap, Story 8.3, "Carried in from Story 7"): the defect above. Nathan routed it to Story 8 on 2026-10-28, since a defect in the code is fixed in Story 8.
- **From Story 8.1, Phase 7** (roadmap, Story 8.3, "A failure to watch for alongside it"):
  - `drag-7-modal-hold.spec.ts`'s DRAG-7.17 test failed once in a full E2E run, and didn't reproduce in 30 runs. It reads the same modal placement.
  - Story 7's batch 13 saw the same test fail once too, with the same symptom: the ghost not under the cursor (`expectGhostUnder`).
  - If the trace explains it, fix it here. If it fails again during this story, trace it with this one.
- No audit routed anything here.

## Approach and phases

### Decisions

**D1. The drawing comes to the write, not the write to the drawing.**
- DRAG-7.15 says a release right after the modal opens commits what it would have before. So the projection the hold read is what the release keeps, and the modal draws the ghost there.
- **The exception is a trace that shows the section's reading was already wrong before the hold completed.** That's the ghost drawn in the section somewhere other than the projection's gap. Then the fix is in the section, and the modal follows from it.

**D2. The fix goes where the disagreement starts,** and a unit test of the pure module that carries it pins it, failing first. That's likely `modalPlacement.ts`, `descendantsProjection.ts` or `dragCollision.ts`.

**D3. Stop and report before changing when dnd-kit measures, or what a trigger reads,** if the fix needs either. Story 8.1's Phase 3 found both are shared by every layer change, and the zoom-in morph owns how a layer change re-lays out. Nathan decides then whether the fix stays here.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so.

**Phase 1: reproduce, trace and fix**
- **Reproduce on today's code.** Story 8.1 changed this path since Story 7 saw the defect:
  - the Card layer is gone;
  - the Card that holds the drag no longer slides;
  - the overlay re-anchors from the pickup rect;
  - a modal reading now reaches the session whenever any projection field changes.

  The defect may have moved or gone. If it's gone, say so with the probe's readings, and the story closes with no fix.
- **The probe:** a throwaway spec, deleted afterwards. A copy outside the repo is fine.
  - **Start from** `drag-7-modal-hold.spec.ts`'s "the same hold, down to the gap above R's overflow row, for an item with a child of its own" (`:399`).
  - **Its aim:** batch 13's, `holdAt(page, w, p, () => topQuarter(overflowRow(page, r.id)), 0)`.
  - **Controls:** `W` alone at the same aim, and `W` with `WC` at the spec's own aim, `R`'s row center.
  - **What to log, at each step:**
    - the cursor, `data-drag-projection` and the named neighbor and its side;
    - the ghost row's painted box (`paintedBoxOf`);
    - as the modal opens, `placeAtCursor`'s slot, its spot row and its reading;
    - the first move event after it opens.
  - **Observe from inside the page** where timing matters. Story 8.1's Phase 3 found that a poll from outside changes a gesture's timing.
- **Find where the ghost and the projection first part:**
  - in the section, before the hold completes;
  - as the modal opens;
  - or on the first move event after it opens.
- **Leads, not conclusions:**
  - **The section.** Is the ghost drawn at `3:3` in the section, before the hold completes, on the one-step path? If not, the defect is there (D1's exception).
  - **The modal's layout space against dnd-kit's rects.**
    - `placeAtCursor` puts the spot row under the cursor in layout space. With `WC` travelling, `slotForGap` gives `R`'s row for gap 3, which the shuffle draws the ghost over.
    - dnd-kit's `over` is a collision of the carried copy's box against rects it measured once, as each row mounted.
    - If the rows were measured before the dialog moved into place, `over` can name `R1` while the reading says gap 3. So can a travelling row that shifts where dnd-kit sees the ghost's slot.
    - `descendantsProjection.ts::holdsReading` then keeps the reading's `3:3` until the pointer moves, so a release writes before `R1` while the shuffle draws after it.
  - **Why only a subtree.** `gapAtSlot` and `slotForGap` leave travelling rows out of the count. The sortable list still holds `WC`'s row, between `W`'s slot and the spot.
- **Then fix it** by D1 and D2, or stop by D3.
- **Gate:** `npm run check` and `npm run test:e2e`. Then a stop for review and commit.

**Phase 2: Nathan's hands-on**
- **What to try,** on the deep stack (`npm run seed:deep`, then `npm run dev:deep` in `server/` and `client/`), with an item that has a child of its own:
  - pick it up in a section and move it in one quick motion to the top of an overflow row below it, then hold until the modal opens. The ghost is where a release writes it;
  - the same from below, and with an item that has no children;
  - a slow approach to the same point, which may read the other gap. Each path's ghost and write agree.
- **Then** the Coder writes the handoff.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Filled in by the Coder while building.

| Symbol | Carries |
|---|---|

## Amendments

## Open questions

None yet.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder.
- **Planned passages now built:** none expected.
- **Passages superseded:** none expected.
- **Implementation passages to place:** none expected.
- **Test-plan cases affected:** DRAG-7.15's one-step spec, which waits for Story 10. DRAG-7.17, if the trace explains its failure.
- **For the Architect, at close:** add DRAG-7.15's one-step spec to Story 10's item 10, with the aim the probe used.

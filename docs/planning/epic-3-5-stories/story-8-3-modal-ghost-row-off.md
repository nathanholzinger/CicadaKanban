# Epic 3.5 Story 8.3 — A hold from above draws the modal's ghost a row off

**Type:** story · **Written:** 2026-10-29 by the Architect, from Nathan's ruling of 2026-10-28 · **Status:** in progress — Phase 1 built, for review; Phase 2 is Nathan's hands-on, then the handoff

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

| Symbol | Carries |
|---|---|
| `useBoardDnd.ts::nameAnchorFrom`, `handleDragMove`, `handleDragOver` | D1, D2: the named anchor, taken from dnd-kit's `onDragMove` and from `onDragOver`. A move event carries the previous render's `over`; `onDragOver` announces the row the pointer stopped in. `BoardView.tsx` wires both. |

## Amendments

**2026-10-29, Phase 1 (Coder)**
1. **Reproduced on today's code,** by a throwaway spec, deleted. `W` with `WC`, `holdAt(page, w, p, () => topQuarter(overflowRow(page, r.id)), 0)`: the section reads `3:3:true` and the hold runs. The modal opens with the ghost at 535–559 under a cursor at y 532, and a release writes `R`'s first child (position 0.5 against `R1`'s 1). The controls: `W` alone at that aim reads `6:2:true` and runs no hold; `W` with `WC` at `R`'s row center reads `3:3:true` with the ghost under the cursor (501–525 against 513), and the release agrees.
2. **Where the ghost and the projection first part: in the section, before the hold completes** (D1's exception). On the one-step path the ghost is painted after `R`'s overflow row (`W` at 529–553, the overflow row's slot), which is gap 6. The projection says gap 3, before it.
   - **The cause:** a move event carries the `over` of the render before it. The log, in order, for the last step (copy at 520):
     - `collide copy=520 -> overflow row`: dnd-kit's collision for this render;
     - `move … over=R, translated=520`: the move event, naming `R`;
     - `onDragOver over=overflow row`: the announcement of the new row.
   - dnd-kit paints the shuffle by the new `over`. The hook listened to `onDragMove` only, so its named anchor stayed `R`'s, gap 3. With the pointer then still, no further move arrives, and the section holds a picture and a projection a gap apart. The hold keys on the projection, so it runs, on a gap the section isn't showing.
   - **Why it depends on the path:** the stale `over` shows only when the pointer stops in the move that crosses into the new row. Any later move names the row the earlier one crossed into. The ladder of 6px steps had no mismatch at the 48 points scanned without the fix, and the one-step approach had them where its last step fell on a crossing.
   - **Why `WC` mattered:** as geometry, not as a subtree. With `WC` in the list the rows ahead of the overflow row sit a slot lower than for `W` alone, so the same cursor point is a different crossing. At 32px `W` alone reads `6:2` and its section and write agree. I didn't trace why that point isn't a crossing for it. The plan's lead about `gapAtSlot` and `slotForGap` leaving the travelling rows out was not the cause: the modal's reading (`placeAtCursor`) took gap 3 from the projection and placed it correctly.
3. **What the modal then did,** which made it visible there. It opened with the reading `3:3`, but the window's bottom edge pulled it up 13px (`placeModal`'s `fitInside`), so the cursor sat on the seam between `R`'s row (507–531) and `R1`'s (535–559). `placeAtCursor` reads the nearest row, `R`, gap 3. dnd-kit's collision names the row by the copy's corners, and named `R1`: the ghost was drawn after it. That is DRAG-7.16's by-design re-read from the cursor meeting a tie. It needed the stale reading to put the cursor there, and the scan below found no case of it without one.
4. **The fix:** `useBoardDnd.ts` names the anchor from `onDragOver` as well as `onDragMove`, through one function (`nameAnchorFrom`), and `BoardView.tsx` wires `onDragOver`. The section's projection then follows the `over` the shuffle draws by. The traced gesture now reads `6:2:true`: the ghost where the section draws it, no hold, and a release that agrees. It is the reading `W` alone and the ladder had.
5. **D3: nothing of dnd-kit's measuring changes, and no trigger reads a different thing.** What changes is when the named anchor is refreshed. The anchor feeds the pop machine at every layer (the zoom-in candidate, the hold, the Descendants gap), so the fix is shared by all of them. The full E2E run is the check for that.
6. **Test, failing first:** `useBoardDnd.test.ts`, "the row a Stub's drag names as the ghost's neighbor": a move event naming the row before it, then `onDragOver` naming the row the pointer stopped in, and the projection's gap is the second row's. It failed on `handleDragOver` not existing. **Mutation check, restored:** `handleDragOver` doing nothing fails it on the gap.
7. **A scan of the whole rule,** through the real board with the fix taken out and then in: the cursor at 17 points from 4px above `R`'s row top to 58px below it, by a one-step approach and by a ladder of 6px steps, at depth 0 and one indent right, for `W` with `WC`, `W` alone, and `X` with a child of its own from below (the ladder for the first and last only). Each point compares what the modal (or the section, when no modal opens) draws with what a release writes.
   - **Without the fix:** the original defect at 32px, at both depths (ghost after `R1`, a write before it); and four mismatches in the section with no modal, the same stale `over` (`2:2` projected with the ghost after `R`; `6:2` projected with the ghost after `T`). The point at 33px opens the modal with the ghost off the cursor (`4:4`), though what it draws is what a release writes.
   - **With it:** 170 points, no mismatch, and the ghost under the cursor in all 102 modals that opened (66 at `3:3`, 36 at `6:3`).
   - **Path:** for `W` with `WC` the one-step and ladder paths read the same at all 17 points, at both depths. For `X` from below they read differently at two (−4px and 52px), each a reading its own ghost agrees with. That is the path-dependence the plan puts out of scope.
8. **DRAG-7.17's one failure in a full run** (Inbound deferrals) is **not explained by this trace.** Both of its specs hold from below, and each awaits its projection before it asserts the ghost. The same mechanism could change which row the last move names, depending on frame timing, which fits a failure that doesn't repeat. That is a reading, not a finding, and the stability runs below don't settle it either way, since the failure didn't reproduce before the fix in 30 runs.
9. **For the Test Planner,** candidate new case, no ID: a drag that stops in the move that crosses into a new row has its ghost where a release writes it, at every layer. No test covers it at the surface; the unit test is the hook's alone.
10. **Three drag specs now fail, and are skipped** (How Story 8 runs: a spec giving a false failure is skipped, with a one-line reason, for Story 10). Each aimed from above at a row's top quarter, and passed because the move that got there named the row before it. Read where the ghost is painted, at each aim:
    - **`drag-7-modal-hold.spec.ts`, DRAG-7.15, "held from above, down to the gap below R's overflow row"** and **"the same hold for an item with a child of its own"** (`W` alone, then with `WC`). At `T`'s top quarter, one indent in, the section paints `W` after `T` (`A Q R overflow T W B X`). It reads `7:3:true` now, `T`'s first child, where the specs expect `6:3:true` and the modal. The gap they mean, after `R`'s whole subtree, still opens the modal with the ghost under the cursor and the write agreeing at the overflow row's band, 30 to 52px below `R`'s row top (the scan, item 7).
    - **`drag-7-overflow-row.spec.ts`, DRAG-7.27, "a dragged R carries its overflow row".** At `X`'s top quarter, the section paints `R` after `X` (`A Q overflow T B X R`). It reads `5:0:true` now, where the spec expects `4:0:true` and then asserts a release before `X`. The spec had pinned a projection that disagreed with its own picture.
    - **The rest of the E2E suite is unchanged** (Checks). DRAG-7.15's specs for the gap above `R`'s overflow row, which aim at `R`'s own row, still pass. For Story 10: aim each at a point where the section draws the gap it means. For the two below-gap specs the scan shows the overflow row's band does; I haven't tried an aim for DRAG-7.27.
11. **No new drag spec** (How Story 8 runs). The probes and the scan are in the scratchpad, not the repo.
12. **Checks:** `npm run check` passes (432 server, 604 client, 235 script tests; `check:docs` 386 files, 0 hits). The first full `npm run test:e2e` run with the fix failed the three specs in item 10 and nothing else. With them skipped it gives 219 passed and 18 skipped, none failed. DRAG-7.15 to DRAG-7.17's eight active specs also ran ten times each, 80 runs, none failing, which neither confirms nor rules out the one failure Story 8.1 saw (item 8).

## Open questions

- **For Nathan, from the trace:** the second part of the traced failure (item 3) is the modal's by-design re-read meeting a tie between rows, after the window pulled it off the spot. It was only reached through the stale reading, and the scan found it nowhere else. A taller or shorter window could put a legitimate reading on a seam, which this scan didn't try. If it shows hands-on, it is a trace of its own.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** none. The wiki already has the ghost, the line and the release agree (board-drag-interaction §2 and §7.1), and §7.3 has the modal open with the ghost's spot under the cursor. The fix makes the section follow it.
- **Planned passages now built:** none.
- **Passages superseded:** none.
- **Implementation passages to place:** none.
- **Test-plan cases affected:**
  - **Skipped specs** (Amendments, item 10): DRAG-7.15's two for the gap below `R`'s overflow row from above, and DRAG-7.27's. The Reconciler should not read them as failing: they are skipped for Story 10, with the reason on each. DRAG-7.15's clause for that gap has no running spec until then, though the scan (item 7) covers it.
  - **DRAG-7.15's one-step spec,** which waits for Story 10. Its gesture is a one-step approach for `W` with `WC`. The aim in Story 7's plan, `topQuarter(overflowRow(page, r.id))`, now reads `6:2:true` and runs no hold, as `W` alone does. The aim that opens the modal in one step is `R`'s row, `center(itemRow(page, r.id))`, which the spec at `drag-7-modal-hold.spec.ts:399` already uses.
  - **DRAG-7.17,** whose one failure this trace doesn't explain (Amendments, item 8).
  - **A candidate new case,** for the Test Planner (Amendments, item 9).
- **For the Architect, at close:** Story 10's skips gain the three above (it ends with none). Its item 10 adds the one-step spec for DRAG-7.15 with the aims above: `R`'s row center, where the modal opens and a release writes what it draws; and the overflow row's top quarter, where no hold runs, the ghost is after the overflow row, and a release writes the same.

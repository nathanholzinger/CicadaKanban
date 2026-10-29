# Test Reconciliation: Epic 3.5 Story 7 (run 4, writing, the last before sign-off)

**Scope:** the re-check of run 3's gaps at checklist step 5 (`.claude/guides/story-done-checklist.md`) for Epic 3.5 Story 7 (`docs/planning/epic-3-5-stories/story-7-depth-cap-and-hierarchy-modal.md`). It reads the working tree at HEAD `1b88a62`, after the second pass's batches 14 and 8–13 (`7ecc176` to `1b88a62`), plus two uncommitted Test Planner edits: TC-5a.2 narrowed in `item-positioning/part-5a-client-reconciliation.md`, and the plan's answer on it. It covers:

- **the Scope cases run 3 left `Open`:** DRAG-7.10, 7.13, 7.15, 7.16, 7.25, 7.26, 7.27, 7.29, TREE-10.5–10.8 and TREE-10.10, and TREE-10.11, now `Open`;
- **the cases the Test Planner reworded on 2026-10-28:** DRAG-6.1, DRAG-6.4, TC-5a.2, DRAG-7.1, DRAG-7.17 and DRAG-7.27;
- **the tests batch 14 removed or changed,** and the cases they carry (DRAG-6.1, DRAG-6.9, TC-2.28, TC-2.29);
- **the second audit's notes for the Reconciler** (`docs/audits/code-quality-audit-epic-3-5-story-7-rerun.md`, For other roles);
- **the whole catalog,** under "On Every Run".

**What this run wrote in `docs/test-plans/`:** 13 cases `Open` → `Automated`, each in its status table row and its body, each with its Automation test line. Nothing else.

- `board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md`: DRAG-7.15, 7.16, 7.25, 7.26, 7.27, 7.29.
- `board-drag-interaction/drag-6-preview-reconciliation.md`: DRAG-6.4.
- `project-tree/tree-10-which-workflow.md`: TREE-10.5, 10.6, 10.7, 10.8, 10.10, 10.11.

DRAG-7.16's line names `modalPlacement.test.ts`, the internal pointer Nathan approved (plan, Open questions, For Nathan, from the second pass: "all four as recommended"). No case went back to `Open`.

**The partial-case marker.** The brief asked for `½` on a partial case's Automation test line. `docs/test-plans/README.md` (Statuses) says `—`, and so does every partial case in the catalog, run 3's included. I kept `—`: the README is the catalog's convention, and the Test Planner's to change. DRAG-7.10 and DRAG-7.13 read `—`.

**Inputs read:**

- the plan's "The second pass's follow-ups, in batches" (Before the batches, Across these batches), the Amendments for batches 14 and 8–13, and the Open questions from "For Nathan, from the second pass" on, with "For the Test Planner", "From the second pass";
- run 3 (`docs/audits/test-reconciliation-epic-3-5-story-7-run-3.md`), and the second audit's For other roles;
- the DRAG-7 suite, DRAG-6, TREE-10 and TC-5a as they read now, and wiki board-drag-interaction §7–§9 and project-tree's Open questions;
- every test in `tests/ui/drag-7-*.spec.ts`, `server/tests/routes/workflows.test.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`, `modalPlacement.test.ts`, `HierarchyModal.test.tsx`, DRAG-6's specs in `drag-column-bands.spec.ts`, `tests/ui/blocked-site-data.spec.ts`, `useBoardManagement.test.ts`, `useBoardDnd.test.ts`, `server/tests/lib/deepSeed.test.ts`, and the DRAG-7.10 tests in `popSession.test.ts` and `dragStructure.test.ts`;
- the helpers the specs lean on (`overflowTree.ts`, `projectTreeDrag.ts`, `dragGesture.ts`);
- an ID sweep of every test title in `tests/`, `server/tests/`, `client/src/` and `scripts/` against all 392 status rows, and every file path on every Automation test line.

There was no shell, so no gate or test was run. The Coder's last results stand: `npm run check` passes (430 server, 565 client, 217 script tests), `npm run test:e2e` passes with 230 passed and 8 skipped, and `check:docs` read 384 files with 0 hits after the TC-5a.2 edit.

## In brief

- **Written: 13 cases `Automated`.** Twelve are in Scope. The thirteenth is DRAG-6.4, which the Test Planner reworded and the brief asked me to re-check. Its test is in the approved client-rule category.
- **Still `Open` in Scope: 2, both routed to Story 10** by ID (`epic-3-5-roadmap.md`, Story 10, item 9).
  - **DRAG-7.13:** misses only its first clause, the Free Card from outside `P`.
  - **DRAG-7.10:** misses the item from outside `P` and "bounded by `P`'s box", as run 3 found. **New this run:** it also misses the distance term against the modal's box, which no test drives. Routing by ID covers it, but item 9 doesn't name it (For sign-off).
- **DRAG-7.15 is whole across its set.** Every gap is driven from both directions, and the item with a child is driven at both gaps.
  - Batch 7's fix (`holdsReading`) is guarded by the gap-below specs and DP:411's describe. The new gap-above specs don't guard it. They don't need to: the fix doesn't depend on the gap.
  - **The batch 13 "seen, not traced" defect does contradict DRAG-7.15's text**: the ghost is drawn a row off the cursor. But it's a defect on an undriven resting point, not a clause no test asserts. It stays Nathan's call (Test Quality Concerns, item 1).
- **The reworded cases hold:** DRAG-6.1, DRAG-7.1, DRAG-7.17 and DRAG-7.27 are whole, TC-5a.2 stays `Automated`, and DRAG-6.4 is whole now.
- **Batch 14's changes hold:**
  - No test carries DRAG-1.31, DRAG-1.34, DRAG-7.30 or DRAG-6.14.
  - No `Automated` case lost its only test.
  - DRAG-6.1, TC-2.28 and TC-2.29 still prove their cases without the inversion assertion. DRAG-6.9 was `Open` before for other parts, and still is.
- **On every run:**
  - **Lost coverage: none.** All 308 cases `Automated` before this run still have a test title carrying their ID, and every path on every Automation line names a file that carries IDs.
  - **Unknown IDs: none.**
  - **No `Manual` case is carried by a test.**
- **Proposals needing Nathan's approval: none.** No internal mapping, and no `Manual`.

Aliases (line numbers at `1b88a62`):

| Alias | File |
|---|---|
| OR | `tests/ui/drag-7-overflow-row.spec.ts` |
| HM | `tests/ui/drag-7-hierarchy-modal.spec.ts` |
| MH | `tests/ui/drag-7-modal-hold.spec.ts` |
| WF | `server/tests/routes/workflows.test.ts` |
| DP | `client/src/components/workflow/descendantsProjection.test.ts` |
| PS | `client/src/components/workflow/popSession.test.ts` |
| MP | `client/src/components/workflow/modalPlacement.test.ts` |
| DS | `client/src/components/workflow/dragStructure.test.ts` |
| HMT | `client/src/components/HierarchyModal.test.tsx` |
| IWR | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| UBD | `client/src/components/workflow/useBoardDnd.test.ts` |

Run 3's reading still applies. A sentence that restates another case's rule, cites it, and adds no condition of its own belongs to the cited case. A clause that applies a rule under this case's own condition belongs to this case.

---

## Coverage Mapping

### The scoped cases at a glance

The Scope is now 37 cases: DRAG-7.1–7.29, TREE-3.11 and TREE-10.5–10.11. DRAG-1.34 and DRAG-7.30 were deleted and left it.

| Case | P | Was | Now | On | Missing (if `Open`) |
|---|---|---|---|---|---|
| DRAG-7.1 | P1 | Automated | Automated (reworded, holds) | OR | — |
| DRAG-7.2–7.9 | — | Automated | Automated | OR, HM | — |
| DRAG-7.10 | P1 | Open | Open (routed) | HM, MH | the item from outside `P`; "bounded by `P`'s box"; the distance term at the modal's box |
| DRAG-7.11, 7.12, 7.14 | — | Automated | Automated | HM, MH, PS | — |
| DRAG-7.13 | P1 | Open | Open (routed) | MH | the first clause: a Free Card from outside `P` |
| DRAG-7.15 | P1 | Open | **Automated** | MH | — |
| DRAG-7.16 | P1 | Open | **Automated** | MH, MP | — |
| DRAG-7.17 | P2 | Automated | Automated (reworded, holds) | MH | — |
| DRAG-7.18, 7.19 | — | Automated | Automated | MH, HM | — |
| DRAG-7.20 | P2 | Manual | Manual (the Test Planner's) | — | left alone |
| DRAG-7.21–7.24 | — | Automated | Automated | MH, OR, HM | — |
| DRAG-7.25 | P2 | Open | **Automated** | MH, HM | — |
| DRAG-7.26 | P2 | Open | **Automated** | HM | — |
| DRAG-7.27 | P2 | Open | **Automated** (reworded) | OR | — |
| DRAG-7.28 | P2 | Automated | Automated | HM | — |
| DRAG-7.29 | P2 | Open | **Automated** | OR | — |
| TREE-3.11 | P2 | Automated | Automated | `tests/ui/project-sidebar-resize.spec.ts` | — |
| TREE-10.5 | P1 | Open | **Automated** | WF | — |
| TREE-10.6 | P1 | Open | **Automated** | WF | — |
| TREE-10.7 | P2 | Open | **Automated** | WF | — |
| TREE-10.8 | P2 | Open | **Automated** | WF | — |
| TREE-10.9 | P2 | Automated | Automated | WF | — |
| TREE-10.10 | P2 | Open | **Automated** | WF | — |
| TREE-10.11 | P2 | Open (was Planned at run 3) | **Automated** | WF | — |

Outside Scope, re-checked at the brief's ask: **DRAG-6.4, `Open` → `Automated`** on IWR.

### Each written case against its _Then_

**DRAG-7.15 → Automated, on MH.** The case asks for the spot under the cursor at each gap, whichever way the cursor came, and for an item with a child.

| Gap | From below | From above | With a child |
|---|---|---|---|
| Above the overflow row (`R`'s first child) | MH:251, `X` | MH:371, `W` | MH:398, `W` + `WC` |
| Below it (`R`'s last child) | MH:251, `B` | MH:320, `W` | MH:346, `W` + `WC` |

- **MH:251** checks each case's parts:
  - the cursor inside the modal, and the ghost under it (`expectGhostUnder`, which reads `paintedBoxOf`);
  - the ghost painted between `R` and `R1`, at `3:3:true`, and the context still Descendants;
  - the release committing before `R1`. From below, it commits after `R2`.
- **MH:320, :346, :371 and :398** each check the cursor inside the modal and the ghost under it. Then `expectReleaseCommitsShown` awaits the write and holds the parent and both neighbors to what the modal paints. They expect:
  - `[R, R2]` at the gap below;
  - `[R, null, R1]` at the gap above;
  - `WC` still `W`'s, in the two child specs.
- **The aim at the gap above from above** is `center(itemRow(R))`, not run 3's `topQuarter(overflowRow(...))`. The Coder's reason holds, and the case doesn't fix an aim:
  - the rows between `W`'s slot and the ghost slide up as it passes, so the overflow row's layout box sits over the row below it;
  - the Coder's scan reads `3:3:true` from 0 to 24 px into `R`'s box.
- **The mutation note.** With `holdsReading` always false, MH:371 and :398 pass, and MH:320 and :346 fail.
  - The rule the case states is an outcome at each gap, and every cell above asserts it.
  - The mechanism is gap-independent. It's pinned once at the surface (MH:320, :346) and once at the projection (DP:411's describe, "DRAG-7.15: the reading holds until the pointer moves"). Guarding it at both gaps would add nothing the case asks.
  - So the case is whole across the set.
- **The batch 13 observation:** a hold from above with `WC` at run 3's aim draws the ghost a row low. It's Nathan's to rule, and it doesn't keep the case `Open` (Test Quality Concerns, item 1).

**DRAG-7.16 → Automated, on MH and MP.**
- MH:520 covers the bottom edge, MH:557 the top and MH:585 the right, unchanged since run 3.
- **The left edge** is MP:27–40, `it.each` "DRAG-7.16: is pulled inside the window at %s", its "the left" row at :30. It asserts the dialog at the margin, with the cursor still inside it. Nathan approved it.
- MP:110, "a modal shifted sideways reads the depth the cursor is at", also carries the ID. It isn't needed beside MH:585.

**DRAG-7.25 → Automated, on MH and HM.**
- **The hold-opened modal,** MH:435 after a failed release and MH:461 mid-drag. Each first asserts the modal at least 40 px off the window's middle (`expectOffCenter`), then centered after the reload (`expectCentered`, now in `overflowTree.ts`).
- **The click-opened modal,** HM:664, "DRAG-7.23, DRAG-7.25: …centered…". It asserts `expectCentered` after the failed release's reload.
  - The Coder notes nothing could move a click-opened modal, so no mutation exists.
  - The mid-drag reload of a click-opened modal (HM:693) doesn't read the centering. Low: the clause asks for "across the reload", and one reload shows it.

**DRAG-7.26 → Automated, on HM.**
- **HM:735:** `P` deleted, and a refused release reloads the board. The modal closes, and `P` is gone.
- **HM:757:** `A`, `B` and `X` detached (`moveItem(…, { isAttached: false })`). The modal closes, `P`'s section has no rows, `A` is still `P`'s child, and `A`'s Card is on the board.
  - The Coder's mutation fails it, the modal counting every child attached or not.
  - "No attached descendants" is now told apart from "no descendants": run 3's concern 1 is closed.
- The third sentence, the stays-open case, belongs to DRAG-7.23.
- Wording note for the Test Planner: Test Quality Concerns, item 8.

**DRAG-7.27 → Automated, on OR:358.** The Test Planner dropped the `L` = 2 clause. The last sentence now says that at level 1 `R` has no overflow row, and `R1` and `R2` show below it at level 2.
- **The overflow row travels with `R`:**
  - the projection reads `2:L−1:true` at `R`'s own place;
  - at `X`'s top it reads `4:0:true`, four rows before the gap (`A`, `Q`, `T`, `B`), which would be five if the overflow row were counted;
  - the drop line is never on the overflow row at either point.
- **The release:** `R.parentId = P`, after `B` and before `X`, with `R1` and `R2` still `R`'s.
- **The redraw:** the section reads `[A, Q, T, B, R, R1, R1a, R2, X]`. `R1` and `R2` drawn in `P`'s section shows they're attached and at the level under `R`. `overflowRow(R)` has a count of 0.
- Low, as in run 3: "never names it" is read at two points, not across the whole drag.

**DRAG-7.29 → Automated, on OR.**
- **OR:397, the gap above:** sweeping across the ghost's middle at `3:3:true`, the line is drawn on the overflow row. The release commits `R`'s first child, before `R1`.
- **OR:429, the gap below (new, batch 13):** at `6:L:true`, so level `L + 1`, `dropLineOn` polls to `{ row: overflow:R, side: after }`. The release commits `R`'s last child, after `R2`.
- The Coder's mutation fails OR:429, with `dropAnchorFor` never naming an overflow row as the row above.

**TREE-10.5 → Automated, on WF:287.**
- The template create is a 201.
- It reads the names in order, `triggersNotification` `[0, 0, 1, 0]` and `isTerminal` `[0, 0, 0, 1]`.
- `settingsOf` shows each phase's name, position and both flags equal to the template's own, with ids of its own.
- Run 3's concern 8 is closed.

**TREE-10.6 → Automated, on WF:314.**
- The copy: names, both flags and the board's columns.
- `W1`'s workphases are read before the create and after it, and they're equal.
- Renaming the clone's first workphase reads back on the clone, and `W1` is still equal to before.

**TREE-10.7 → Automated, on WF:346.** A 201 with no workphases, and a default board with no columns.

**TREE-10.8 → Automated, on WF:160 and :170.** Each is a 400 naming its field, and the project has no workflow after (`workflowsOf`). That is the case's "nothing is created": run 3 accepted the empty list in place of a later bare create.

**TREE-10.10 → Automated, on WF:213, :266 and :276.**
- WF:213: each field `null` gives a 201 with no workphases.
- WF:266: the template, with `sourceWorkflowId: null`, gives the template's phases.
- WF:276: the source, with `templateId: null`, gives the source's.

**TREE-10.11 → Automated, on WF:227 and :253.**
- **WF:227:** both fields named, each naming a row that exists.
  - A 400 whose message names both fields, and nothing created.
  - Then a create naming the template alone is a 201 with its four workphases. That was run 3's missing follow-up.
- **WF:253:** both fields name rows that don't exist. A 400 that isn't the existence message, and nothing created.
- "A field given as `null` isn't named" cites TREE-10.10, and is that case's.

**DRAG-6.4 → Automated, on IWR:63**, "DRAG-6.4: a response that sorts the item after E is shown as the server saved it, never adjusted to the preview".
- `X` is previewed after `A`, and the response gives `X` 1.9, past `E`'s 1.75. After `completeItemWrite`:
  - the order is `A, C, E, X`;
  - `X` is unmarked;
  - `X.position` is 1.9.
- That is the narrowed *Then* whole. "Without a reload" holds, since the fold is the board's one write path. "Doesn't adjust any item's position to match the preview" fails the order check if any position is moved toward `A, X, C, E`.
- **Why it counts without approval:** it's the approved client-rule category, the response-reconciliation module (`docs/test-plans/README.md`, Which tests count). The A3 and A6 runs counted this test, then `Open` only for the inversion log, the console and the reload, which the case no longer names.
- Story 10's roadmap item 1 lists DRAG-6.4. The Architect may drop it there.
- Low: the test reads the order through `freeItemOrder` (Test Quality Concerns, item 5).

### The scoped cases still `Open`

**DRAG-7.10 → Open, routed to Story 10** (roadmap item 9, which routes it by ID).
- **Asserted:**
  - **HM:344:** the pop out of a click-opened modal. The modal closes, the drag is at the Card layer, and a release sets the Stub back down, writing nothing (`settledWrites`).
  - **MH:715:** the same pop out of a hold-opened modal.
  - **HM:375:** the second pop, which detaches.
  - **HM:632:** the brief excursion.
  - **HM:408:** the header rest pops nothing.
- **Missing:**
  1. **An item from outside `P` attaching as `P`'s last child** at the Card layer. It's blocked by the Free Card defect, and named in item 9.
  2. **"Bounded by `P`'s box".** It's DRAG-1.28's rule, and named in item 9.
  3. **New this run: "or is `popDistancePx` outside it when that's above 0".**
     - Every DRAG-7 spec seeds a tuning with the distance term off.
     - PS:153 drives the delay clock against a Descendants region's `boundsRect`.
     - PS:144 (DRAG-1.14) drives the distance term against a merged column's `boundsRect`, through the same containment rect the modal's box goes through.
     - No test carrying DRAG-7.10 drives the distance term at the modal. Run 3 missed it.
     - **The cheap close:** a `popSession.test.ts` case that puts the distance term against a Descendants region's `boundsRect` and carries DRAG-7.10. That's the approved drag-clock category, so it counts without approval.
     - It's routed with the case by ID, but item 9 doesn't name it (For sign-off).
- **PS:153 and DS:237,** the audit's question, are answered under Test Quality Concerns: they prove the header clause's mechanism, and none of 1–3.

**DRAG-7.13 → Open, routed to Story 10** (item 9, "DRAG-7.13's first clause").
- MH:81, :111 and :132 and PS:452 and :480 are unchanged since run 3.
- The only miss is `X` as a Free Card zoomed in from outside `P`. Every stage spec drags a Stub of `P`.
- The plan's line for the Reconciler, "the outside-Free-Card clause is a known gap, not a lost test", is confirmed again. No test ever carried that clause.
- Low, a reading kept from run 3: the clause "the same holds below the overflow row" is asserted through its parts.
  - the stages below are MH:154's;
  - the modal opening and the commit below are MH:132's;
  - the release before the cue completes is asserted at the gap above only (MH:111).

  The Story 10 spec for the first clause could release early below as well.

### The reworded cases, against their tests

- **DRAG-6.1 holds**, on `tests/ui/drag-column-bands.spec.ts:746` and IWR:116.
  - "No inversion recorded" is gone from the case, and its assertion from IWR:116.
  - The rest stands: the order before and after the response, and `X.position` left at 4 while pending. The E2E spec never read the log.
- **DRAG-6.4:** written above.
- **TC-5a.2 stays `Automated`,** on IWR:57. The plan asks the Reconciler to confirm it, and I confirm it.
  - The case now says that once the response is applied the positions read `A = 1`, `X = 2`, `C = 3`, `E = 4`, and the list reads `A, X, C, E`.
  - The test asserts the order and `X` unmarked. The Coder's mutation fails it: with no `reindexed`, it reads `A, C, E, X`.
  - Under the response's `X = 2`, that order is only reachable with `C` and `E` above 2, which only the pairs give. The A6 run read it the same way.
  - Low: the positions aren't read directly (Test Quality Concerns, item 4).
- **DRAG-7.1 holds**, on OR:37, :64, :90 and :231.
  - OR:90, rewritten in batch 14, seeds `L + 1` and reads `[A, Q, R, R1, overflow:R1, R2, T, B, X]`, `R1`'s overflow row reading "1 child", and `R` with none. That is the case's new Given, a level count one higher.
  - The Coder's mutation fails it, with the count seeded at the default.
- **DRAG-7.17 holds**, on MH:614 and :646.
  - **The new Given:** the rows before the ghost's spot run longer than the modal, with a tree for each gap.
  - **MH:614, the gap below:** `R` with 20 more children.
  - **MH:646, the gap above:** a sibling `S` before `R`, with 20 children.
  - **Each asserts:**
    - the list's `scrollTop` above 0;
    - the cursor inside the modal, and the ghost under it;
    - the release committing after `E19`, or before `R1`.
  - The title matches too.
  - The gap-above spec failed once in one full E2E run and then passed in repeats. Noted, and nothing more.
- **DRAG-7.27:** written above.
- **The tuning-panel sweep** (DRAG-1.26, 1.32, 2.5, 2.6, 3.5, the terms, TC-5a's preamble) changed no case's ask.
  - Of the tests they map to, only DRAG-3.5's `dragBands.test.ts` is on an `Automated` case, and it didn't change.
  - DRAG-1.26, 2.5 and 2.6 are `Open`, and DRAG-1.32 is `Manual`.

### Tests batch 14 removed or changed

- **Removed:** `dragTuning.test.ts`, two `itemListOps.test.ts` tests, MH's DRAG-1.34 spec, OR's DRAG-7.30 spec, and IWR's DRAG-6.14 test.
  - No title anywhere carries DRAG-1.31, DRAG-1.34, DRAG-7.30 or DRAG-6.14.
  - No Automation line names `dragTuning.test.ts`.
  - The removed tests carried only deleted IDs, or none. DRAG-7.1 kept its specs, minus the DRAG-1.34 ID. So no `Automated` case lost its only test.
- **Changed: the inversion assertion removed from four tests.**
  - **DRAG-6.1's (IWR:116):** above.
  - **TC-2.28's (IWR:96):** still asserts the preview `A, X, C, E` and the same order after each narrow-view response. With `tests/api/itemRepositioningCrossColumn.spec.ts` for the server's half, it's whole.
  - **TC-2.29's (IWR:157):** still asserts `X` right after `Y` in the preview, after `Y` lands, and after both land. With `itemListOps.test.ts`, it's whole.
  - **DRAG-6.9's (IWR:81):** still asserts the rows applied and the live ghost's placement left alone. DRAG-6.9 stays `Open`, outside Scope and in Story 10's list, for its unchanged misses: the ghost back without a further cursor move, and the release against the reconciled board. The inversion check was never one of them.
- **Kept with no ID:** IWR:19, :35 and :40, `freeItemOrder`'s and `findInversion`'s tests, as a developer's diagnostic. Uncatalogued, by design.

---

## For sign-off

Every case in Scope that is still not `Automated` or `Manual`. The checklist needs each routed by ID to a later story whose plan or roadmap entry names it.

| Case | What's missing | Routed? |
|---|---|---|
| DRAG-7.13 | The first clause only: the hold by a Free Card zoomed in from outside `P`. | **Routed to Story 10** (`epic-3-5-roadmap.md`, Story 10, item 9: "DRAG-7.13's first clause"). |
| DRAG-7.10 | (1) An item from outside `P` attaching as `P`'s last child after leaving the modal. (2) "Bounded by `P`'s box", DRAG-1.28's rule. (3) The distance term against the modal's box (`popDistancePx` above 0), found this run. A `popSession.test.ts` case in the approved drag-clock category would close it. | **Routed to Story 10** by ID (item 9). Item 9 names (1) and (2). **For the Architect:** add (3) to its line, so Story 10 doesn't stop at two. |

Not for sign-off: DRAG-7.20 (`Manual`, the Test Planner's). Every other Scope case is `Automated`.

One Open question is still pending: batch 13's "seen, not traced" ghost a row off, which is Nathan's, not the PO's. It doesn't block a case's status (Test Quality Concerns, item 1). No Open question waits on the PO.

---

## Lost Coverage

**None.**

- Every case that was `Automated` before this run, 308 of them, has at least one test whose title, or whose `describe`, starts with its ID. I checked each against the sweep. I gave special attention to the files the second pass changed:
  - batch 14's deletions;
  - batch 12's helpers, with `expectCentered` and `expectInside` moved into `overflowTree.ts`;
  - batch 9's `scripts/audit-scope/testRepo.mts`.
- **Helpers carry no titles:** `overflowTree.ts` and `itemRepositioningScenario.ts` hold IDs only in comments, and `testRepo.mts` holds none.
- **Every test-file path the test plans name,** 380 mentions with the Automation lines among them, is a file the sweep found carrying IDs. None names a deleted file.

## Unknown IDs

**None.**

- Every ID in a test title is a case in the catalog.
- The IDs in `scripts/check-docs/check.test.mts:266` and `:312` are the checker's own fixtures, inside strings.

**A `Manual` case the Test Planner set, carried by a test:** none. No title carries DRAG-1.29, 1.32, 4.24, 4.25 or 7.20. MH's header comment names DRAG-7.20, which is fine.

**A `Planned` case carried by a test:** none. ATT-1.10 is the only `Planned` case left.

---

## Proposed Stamps

**None needed for sign-off.** Run 3's seven stamps all landed in batches 8 and 13, and this run mapped them.

## Proposed Internal Mappings (need approval)

**None.**

- **Run 3's item 1** (DRAG-7.16's left edge on MP) is approved and written.
- **Run 3's item 2** (DRAG-7.15 on DP's describe) is moot. MH:371 and :398 close the gap at the surface.

**Not proposed, beside whole surface tests:**
- HMT:102 and MP:84 (DRAG-7.25);
- HMT:134, the MP placement tests and DP:377, :387 and :411 (DRAG-7.15);
- MP:42–67 (DRAG-7.17);
- MP:110 (DRAG-7.16);
- DS:237 (DRAG-7.10's header clause, beside HM:408).

PS:153 is in the approved drag-clock category, so it would count as it is. Beside HM:408 it adds nothing.

## Proposed Manual (need approval)

**None.** DRAG-7.10's three misses are assertable and routed.

---

## Gaps

- **In Scope:** the For sign-off table, both routed.
- **Outside Scope:** the catalog's other `Open` cases, 61 of them. Run 3's 63 lost DRAG-1.31 (deleted) and DRAG-6.4 (written). DRAG-6.9, 6.7, 6.8 and the DRAG-1 to DRAG-5 cases are Story 10's. TREE-1.13, ATT-4.9, TC-5.15 and TC-6.11 are unchanged.
- **Hard to automate:** none in Scope.

---

## Duplication

Reported, not judged.

- **DRAG-7.15:** MH:251, :320, :346, :371, :398; MP:20, :98, :104, :124, :147; DP:377, :387, :411's describe; HMT:134.
- **DRAG-7.16:** MH:520, :557, :585; MP:27–40, :110.
- **DRAG-7.17:** MH:614, :646; MP:42, :50, :56, :67.
- **DRAG-7.25:** MH:435, :461, HM:664; HMT:102, MP:84.
- **DRAG-7.23, 7.25, 7.26:** one setup (`releaseRefusedMove`) across HM:664, :735 and :757. MH:435 and :461, and HM:693, use `refuseMoves` the same way.
- **DRAG-7.29:** OR:397 and :429, one per gap; DC's `dropAnchorFor` tests, with no ID.
- **DRAG-7.10:** HM:344, :375, :408, :632, MH:715; PS:153, DS:237.
- **DRAG-7.13, 7.14:** MH:81–249; PS:452, :464, :475, :480; DP:246, :269.
- **TREE-10.10 and TREE-10.11:** WF:266 and :276 (TREE-10.10's) share their subject with WF:227's follow-up create, whose template-alone create is TREE-10.5's in effect.
- **DRAG-6.1, TC-2.28:** IWR:116 carries both. TC-2.28 also has IWR:96 and the API spec.
- **DRAG-6.4 and TC-5a.2:** neighbors in IWR:57 and :63, one fixture apart (`workedList`).
- **Unchanged from run 3:** DRAG-7.2–7.6, 7.12, 7.19, 7.21; BCU-1.6, TC-7.18 and TC-7.20 (`boards.test.ts` and `items.crossProject.test.ts`); and TC-2.8.

---

## Test Quality Concerns

### The plan's questions to the Reconciler

- **"The outside-Free-Card clause is a known gap, not a lost test"** (For Nathan, from the test follow-ups): confirmed again (Coverage Mapping, DRAG-7.13).
- **TC-5a.2's status, "the Reconciler's to confirm"** (For the Test Planner, From the second pass): confirmed `Automated` (Coverage Mapping). There is a Low gap in what it reads (item 4 below).
- **DRAG-7.16 "closes on the internal test at the Reconciler's next run":** done.

### The second audit's notes for the Reconciler

1. **"DRAG-7.10, 7.13, 7.15, 7.16, 7.25, 7.26, 7.27 and 7.29 read `Open` though tests carry their IDs."** Six are `Automated` now.
   - An ID on a test doesn't make a case `Automated` while a clause is unasserted. That's why DRAG-7.10 and 7.13 stay `Open`, routed.
2. **The no-write checks straight after a release: closed.**
   - `projectTreeDrag.ts::settledWrites` waits 300 ms before reading what `watchWrites` saw.
   - It now serves all eight sites the audit named: HM:280, :370, :628 and :801 (it lists :626 and :796), MH:788 and :806, and OR:320 and :355.
   - It also serves HM:340 and :547, and HM:730, which now expects exactly one write.
   - HM:141 and :201 still read at once, but they follow a click with no drag, as the plan says. A click that wrote would send at once, and both reads come after several retried assertions. Fine.
3. **HM:344 carries DRAG-7.6, 7.10 and 7.11 "and its body checks 7.10": doesn't stand.** The body earns all three:
   - **DRAG-7.10:** the pop, the modal closed, the Card layer.
   - **DRAG-7.6:** "Released at `P`'s Card layer instead … set back down, and nothing is written". `R2`'s slot is hidden, as `R1`'s is.
   - **DRAG-7.11:** "the pop-out clock runs as it does anywhere outside the modal's box". The resting point is inside `P`'s box by construction, behind the backdrop, and the pop happens.
   - Low: it doesn't assert the point lies outside the modal's box. The pop proves it.
4. **HMT's DRAG-7.15 test runs with no scroll height: true, and no gap in the case.**
   - `stubLayout` stubs no `scrollHeight`, so HMT:134 places with nothing to scroll.
   - DRAG-7.17 doesn't rest on HMT. MH:614 and :646 drive the component's scroll end to end: `scrollTop` above 0, the ghost under the cursor, and the release.
   - **What stands, Low:** the component's wiring of the scroll (`maxScroll`, and batch 10's `listTop`) has no component test.
   - **Also Low:** batch 10's header cap (#16) is pinned only by MP:56. No spec drives a hold with the cursor in the window's top 90 px or so over a long list (Candidate New Cases, item 3).
5. **`deepSeed.test.ts:102` passes by the seed's shape (#17): stands, Low.**
   - The summary's `deepestItemDepth` counts from the nearest Free ancestor, and the API's `depth` from the root. They agree because the deepest chain hangs off a Card.
   - It's dev tooling with no ID, and batch 8 didn't take #17 ("the data is right today"). No catalog effect.
6. **HM:624 and OR:373 read `R`'s depth as `sectionLevels - 1`: stands, Low.**
   - `seedOverflowTree` builds a fixed tree ("with the section at its default of three levels"), so `R`'s depth is 2 whatever `L` is.
   - Both files mix readings relative to `L` (`${6}:${L}:true`) with literals (`'3:3:true'`, `'6:3:true'`).
   - A changed default would fail them loudly, never pass them on a wrong reading. So it's fragility, not a false pass.
   - The clean fix: the specs on that tree seed `sectionLevels: 3`, the tree's own, or read depths as literals throughout.
7. **DRAG-7.10's two unit tests of the dialog's bounds: they prove the header clause, and nothing else of the case.**
   - **DS:237:** the dialog marked `DRAG_BOUNDS_ATTR` becomes the section region's `boundsRect`, gone with the modal.
   - **PS:153:** a point over `boundsRect`, outside the list, starts no outside clock, where a bare region's does.
   - Together they are the mechanism of "a cursor over the header … no pop". HM:408 asserts it at the surface.
   - They don't touch DRAG-7.10's three misses. PS:153 drives the delay clock, not the distance term.
   - PS:153 is in the approved drag-clock category, and DS:237 isn't. Neither is proposed.

### Run 3's concerns, re-checked

1. DRAG-7.26's spec deleting, not detaching: **closed** (HM:757).
2. DRAG-7.15's gap above from above: **closed** (MH:371, :398).
3. HM:432's resting point inside `P`'s box: **closed** (`expectInside` at HM:461).
4. MH:654's opacity "below 1": **closed**. MH:681 seeds 0.25 and polls for it, and the Coder's fixed `opacity-50` mutation fails it.
5. DRAG-7.17's Given: **closed** by the Test Planner's rewording. See item 6 below for the wiki's side.
6. OR:325's Sheet: **closed** (heading `P`, OR:343).
7. HM:662's reloaded rows: **closed**. HM:664 moves `B` ahead of `A` on the server first, and the Coder's replayed-load mutation fails it.
8. WF:240's flags: **closed** (WF:287).
- **Run 2's items:**
  - **B, the server's cycle depth: closed.** WF:72 asserts `[1, 2]`. Those are the walk's own count for a cycle, which no wiki rule states, so it stays uncatalogued. It pins an unstated detail, which isn't a defect.
  - **O:** gone with `dragTuning.test.ts`.
  - **P, OR:37's levels checked by indent for two rows:** unchanged, Low.
- **Run 3's Fix Now guard items:**
  - **Item 3:** the hook half was deleted in batch 10, and DRAG-7.15's specs pass without it, as the ruling expected.
  - **Item 5:** batch 8's non-string test, WF:197, with no ID.

### Concerns from this run

1. **Batch 13's "seen, not traced" ghost a row off contradicts DRAG-7.15's text. Medium. Nathan's call; no status effect this run.**
   - **The gesture:** `W` with `WC`, one step to the top quarter of `R`'s overflow row. The hold reads `3:3:true` and completes.
   - **What the modal draws:** the ghost after `R1`, a row below the cursor. The release writes before `R1`.
   - **What the case says:** "the modal opens with the ghost's spot under the cursor … the gap before `R1` … The ghost is there", for an item that carries a subtree too. So the case's own text covers this path, and the code fails it there.
   - **Why it doesn't keep the case `Open`:** it's a defect on a resting point whose reading depends on the path (a ladder of small moves to the same point reads `6:2:true`). No clause of the case is left unasserted.
   - **When its spec is written,** in whichever story Nathan routes it to, that spec carries DRAG-7.15. Then the README's "When a test for a case fails" applies.
   - If Nathan would rather DRAG-7.15 not read `Automated` while a known reproduction fails it, the next run can return it to `Open`, routed with the defect. The catalog's rules don't require it.
2. **The new gap-above specs don't guard batch 7's fix. Low, by design.**
   - MH:371 and :398 pass with `holdsReading` always false. The fix is guarded at MH:320 and :346 and at DP:411.
   - A regression particular to the gap above would need a gap-dependent cause, and `holdsReading` has none.
3. **DRAG-7.10's distance term is unasserted. Low; routed with the case** (For sign-off).
4. **TC-5a.2's positions aren't read directly. Low.**
   - The case names `A = 1`, `X = 2`, `C = 3`, `E = 4`. IWR:57 reads the order and the marker.
   - The order implies the pairs were applied only while `X`'s own position is the response's 2.
   - `positionedWrite.test.ts:13` (TC-5a.1's) reads exactly those four positions on the same fixture, but through `applyWriteResponse`.
   - **The fix:** one `expect` of the four positions in IWR:57.
5. **IWR:57, :63 and :116 read the order through `freeItemOrder`, the inversion diagnostic's helper. Low.**
   - It's the board-wide order of Free positioned items with the placements layered on. For these single-workphase fixtures it agrees with the column selector the board draws from (`getWorkphaseItemsFrom`, which TC-2.28's IWR:96 uses).
   - Batch 14 says the diagnostic's tests "go when the panel does". If `freeItemOrder` goes with them, these three tests need the column selector. They'd fail to compile, not pass silently.
6. **MP:56 carries DRAG-7.17 but asserts something the case doesn't say. Low.**
   - With the cursor near the window's top over a long list, the scroll stops with the spot at the list's top edge, not under the cursor.
   - DRAG-7.17's *Then* is "scrolled so that the spot sits under the cursor".
   - The ID is a loose fit for a geometry the case and the wiki don't address (Candidate New Cases, item 3).
7. **Wiki §7.3 says "If `R`'s children run longer than the modal, its list scrolls". DRAG-7.17's Given now says "the rows before the ghost's spot". Low, for the Test Planner to raise with the PO.**
   - The case is the more accurate of the two: from the gap above, `R`'s children never put the spot out of view.
   - A Rule field should trace to the wiki's wording, so §7.3 may want "the rows before that spot".
8. **DRAG-7.26's "none of its descendants is attached" reads per item. Low, wording, for the Test Planner.**
   - HM:757 leaves `Q`, `R` and the rest attached to their own parents, under Free `A`.
   - The spec, §9 ("no attached descendants left") and the case's own third sentence ("shows `P` with at least one attached descendant") all mean `P`'s attached hierarchy, the set the section draws.
   - "None of `P`'s children is attached" would say that without the per-item reading.

No mapped test was found tautological.

---

## Uncatalogued Tests

These are the second pass's new or changed tests with no case ID. None needs one.

**Gate and support, with no standalone rule:**

- **WF:197**, "returns 400, and creates nothing, when %s is not a string". No case, by Nathan's ruling: wiki row-references §1–§2 settle it.
- **WF:72**, the cycle depth (above).
- **`tests/ui/blocked-site-data.spec.ts`**, "the app mounts and opens a board where the browser blocks its site data", and **`useBoardManagement.test.ts`** (3 tests).
  - The remembered selection is in wiki project-tree's Open questions ("The sidebar's other controls … the remembered selection"), so it derives no case.
  - Not a candidate while it's there.
- **`client/src/lib/browserStorage.test.ts`'s `removeStored` cases,** and the `removeItem` fakes in `client/src/test/storageFixtures.ts`.
- **UBD:56 and :70**, `readModalPlacement` with the drag out of the modal's layer, and with no drag.
  - They guard #15's race, a pop between the hold and the mount, which no spec can time.
  - §7.3's "while the modal is open during a drag, it's the Card's Descendants layer" implies it, but the race isn't a rule of its own.
- **IWR:19, :35 and :40**, the diagnostic (kept with no ID by design), and **IWR:71**, "leaves other pending placements alone".
- **HMT:121 and :149;** **MP:73, :88, :132, :137, :159** and `nearestRowIndex`; **DP:58, :96, :277, :323, :329, :404** and `sameProjection`. Unchanged in kind since run 3.
- **`scripts/audit-scope/`:** `testRepo.test.mts` (2 tests), and batch 9's new `diff.test.mts` and `config.test.mts` cases. Tooling.
- **`server/tests/lib/deepSeed.test.ts`:** dev tooling.

**Not uncatalogued, though new:** batch 10's cap cases carry DRAG-7.17 (MP:56, :67, see concern 6), and its reseed case carries DRAG-7.15 (DP:387).

## Candidate New Cases

1. **The level count read as a whole number** (run 3, item 1): **closed.** Nathan ruled it the tuning panel's and not a rule, and §9's "at least 1" is gone.
2. **An item's agent that names no row is refused** (carried since the A6 last round): **still open, a Test Planner gap.**
3. **New: a hold that completes with the cursor where the modal's header sits, over a list long enough to scroll.** **A PO gap. Low; it needn't block sign-off.**
   - §7.3 says the list scrolls to put the spot under the cursor, and the modal is kept inside the window. It says nothing of the spot landing under the header.
   - The code (batch 10's #16) stops the scroll with the spot at the list's top edge, and reads the ghost afresh from the cursor.
   - MP:56 pins it, and no spec drives it.
   - If the PO writes it, it reads as DRAG-7.16's rule, the ghost read afresh, applied to the header. A spec would hold near the window's top over a long list.
4. **Not a new case:** §7.3's scroll sentence against DRAG-7.17's Given (concern 7).

No other candidate. Every rule in wiki §7.1, §7.3, §9 and project-tree §10 has a case.

---

## Totals

**Status changes in this run:** 13, `Open` → `Automated`. No case went back to `Open`.

- P1: DRAG-6.4, DRAG-7.15, 7.16, TREE-10.5, 10.6.
- P2: DRAG-7.25, 7.26, 7.27, 7.29, TREE-10.7, 10.8, 10.10, 10.11.

**The whole catalog: 392 cases.** That is run 3's 396, less DRAG-1.31, DRAG-1.34, DRAG-7.30 and DRAG-6.14, which the Test Planner deleted. The Test Planner also moved TREE-10.11 from `Planned` to `Open`. Before this run the catalog stood at 308 `Automated` and 76 `Open`.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 115 | 140 | 66 | 321 |
| Open | 21 | 31 | 11 | 63 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **Total** | **136** | **173** | **83** | **392** |

**By folder:**

| Folder | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2) | Other |
|---|---|---|---|---|
| board-drag-interaction | 141 | 77 (32/32/13) | 59 (20/30/9) | 5 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25, 7.20; 0/2/3) |
| item-positioning | 80 | 77 (43/29/5) | 2 (0/1/1): TC-6.11, TC-5.15 | 1 `Pending PO` (TC-6.13) |
| item-attachment | 75 | 72 (30/26/16) | 1 (1/0/0): ATT-4.9 | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11) |
| project-tree | 62 | 61 (7/32/22) | 1 (0/0/1): TREE-1.13 | — |
| boards-columns-unsorted | 34 | 34 (3/21/10) | 0 | — |
| item-sheet | 0 | — | — | `INDEX.md` only |

**The story's Scope (37 cases):**

- 34 `Automated`.
- 2 `Open`, both routed to Story 10: DRAG-7.10 and DRAG-7.13.
- 1 `Manual`: DRAG-7.20.

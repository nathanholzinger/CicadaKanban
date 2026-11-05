# Epic 3.5 Story 10 — DnD automation catch-up

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's Story 10 entry · **Status:** planning. It starts after Story 8's close-out round (When it runs)

## Goal

Bring the drag automation up to the test-plan catalogs once, now that the gesture has stopped moving, and decide case by case what the suite is for (roadmap, Story 10). It ends with:
- no `test.skip` or `test.fixme` in `tests/`, and no skipped unit test;
- every case routed here `Automated` or `Manual`;
- `npm run check` and `npm run test:e2e` green;
- the epic-done checklist's Tests items checkable.

It also builds one rule: the banner for a column drag the board stops (DRAG-6.26, the roadmap entry's item 11).

**Where it sits in the epic's close.** The roadmap pulled the epic-done checklist's Tests section out into this story ("Why a story and not the checklist step"). So the story holds that section's steps, in their order:
1. the Test Planner's end-of-epic pass;
2. the tests;
3. the one Reconciler run.

The epic-wide audit comes after this story, by the checklist.

**When it runs:** after Story 8's close-out, in Nathan's order (2026-11-04; roadmap, Story 8, "How each story closes"):
1. the test reconciliation and code quality audit of Stories 8.8, 8.11 and 8.12, done 2026-11-04, and their findings fixed (`stories-8-8-8-11-8-12-fixes.md`);
2. Story 8.13;
3. one more round: a reconciliation if needed, and a code quality audit. It covers 8.13 and the code of step 1's fixes, or all of Story 8's stories again.

Phase 1 starts once that round is done, and Phase 2 starts from its reports.

**What it starts from** (counted 2026-11-04, from the working tree, the reconciliation now running included):
- **22 skipped E2E specs.** Each is already routed to an item in the roadmap entry:

  | Spec | Skips | Item |
  |---|---|---|
  | `drag-7-modal-hold.spec.ts` | 6 | 8, 10 |
  | `item-repositioning-cross-project-dnd.spec.ts` | 4 | 3 |
  | `drag-7-hierarchy-modal.spec.ts` | 4 | 10 |
  | `item-repositioning-cross-column-dnd.spec.ts` | 2 | 3 |
  | `drag-card-zoom-in.spec.ts` | 2 | 7, 10 |
  | `project-tree-drag.spec.ts` | 2 | 10 |
  | `drag-5-stub-detach.spec.ts` | 1 | 10 |
  | `drag-7-overflow-row.spec.ts` | 1 | 10 |

  Story 8.13 adds none: it fixes the specs its changes break within the story, rather than skipping them (Nathan, 2026-11-04).
- **No skipped unit test.** Story 8 skipped none that are still skipped.
- **About 155 Open cases in the drag suites:**
  - board-drag-interaction, 111: DRAG-1 22, DRAG-2 13, DRAG-3 11, DRAG-4 17, DRAG-5 10, DRAG-6 16, DRAG-7 10, DRAG-8 12;
  - project-tree, 44: TREE-1 17, TREE-2 13, TREE-4 6, TREE-11 8.

  Not every Open case is this story's: the roadmap counts TREE-11's eight as Story 8.11's, not drag work. Phase 2 settles which ones are.

**Out of scope:**
- **The cues' final look and the zoom-in morph.** They moved to the Dashboard, Navigation & Notifications epic (`epic-8-decisions.md`). A look the wiki keeps under Open questions has no case, and no spec pins it.
- **Code changes beyond item 11,** a test hook a spec needs, and a defect a spec finds (D7).
- **The wiki and the catalog.** They're the PO's and the Planner's. A case found wrong goes to them (D6).

## Scope

- **Wiki passages:** board-drag-interaction §10's Planned passage, "a column drag the board stops shows the banner too". The PO takes its marker off after Phase 1.
- **Test-plan cases:** settled in Phase 2. The starting list:
  - the roadmap entry's items 1, 4, 9 and 10, by ID;
  - ATT-4.9 (item 1);
  - DRAG-6.26 (item 11).

## Inbound deferrals

The roadmap entry's items 1–11; item 5 is done (A3). They stay in the roadmap entry until Phase 2, because Story 8's close-out (When it runs) may still add to item 10 there. Phase 2 moves them here, as the plan template has the plan writer do, once nothing else is routed to the entry. In short:

1. **A3's routed cases,** with A4's candidate tests, and the drag tests A6's run found short: 53 board-drag-interaction cases, ATT-4.9 and TREE-1.13.
2. **The Story 4 audit's #3.** What's left is DRAG-4.1's and 4.17's E2E half, which item 10 lists too.
3. **The six legacy `item-repositioning-*` skips:** re-derive each, or delete it where its API twin pins the math.
4. **Story 6's precise-move cases:** DRAG-4.13, 4.32, 4.33 and 5.9, plus `tabBy(n)` and the overlay form's attribute.
6. **Story 6.1's leftovers:** the quarter helpers, and seven unread `data-*` attributes.
7. **Specs that bypass helpers** (the Story 6 and 6.1 audit's #17), and the split of `drag-column-bands.spec.ts`.
8. **The flakiness call for each case,** starting with DRAG-7.17's trace.
9. **Story 7's leftovers:** DRAG-7.13's first clause and DRAG-7.10's three misses.
10. **Stories 8.1–8.12's routings:**
    - specs that pass but miss a clause;
    - the skips to rework or delete;
    - cases with no surface spec;
    - each story's Planner follow-up;
    - the mid-point reconciliation's three cases.
11. **The stopped column drag's banner,** DRAG-6.26.

**Audit follow-up — #12.** `docs/audits/code-quality-audit-stories-8-8-8-11-8-12.md`, finding 12: `tests/ui/project-tree-drag.spec.ts`'s skipped TREE-2.1 title and reason still claim descendants are drawn/dimmed at opacity 0.3. They are absent during the drag. Replace the obsolete explanation/title and visibility assertions when this story rewrites that exact skipped spec under item 10. The route is accepted here so the audit need not arrange a separate rewrite before the planned rework; it does not count as passing coverage.

**Audit follow-up — TREE-1.14's placement (Nathan, 2026-11-05).** Found writing the sidebar's mid-drag cases in `stories-8-8-8-11-8-12-fixes.md` (its Amendment 8), and deferred here. Wiki project-tree §1 says a project that an earlier create or parent edit puts under the dragged one mid-drag "stays a place to drop", and a release making a cycle is refused by the server. `useProjectDragReorder.ts` doesn't offer it: it builds its placement rows with `toRows(flatItems, exclude)`, which drops every row whose parent was dropped, so `Y`, drawn under the carried `X`, leaves placement with `X`, though it isn't in the held subtree. Hovering `Y` then gives placements against the rows beside it only, and the release that makes `X` `Y`'s child can't be made.
- **A fix is small:** leave out the rows of the held ids alone, not their children. The decision it needs is the depths a gap beside `Y` offers: the two shallower ones would name `X` itself, which the server refuses.
- **What exists:** the hook test asserts only that `Y` is drawn under `X`, no part of the held branch, and that the next pickup holds it hidden; the App test asserts the refusal leaves the earlier edit. The surface spec, the release that is sent, and the refusal that follows it are this story's, with the test of the placement (a gap after `Y`, tabbed one level deeper, saves `X` under `Y`). TREE-1.14 is `Open` until then.

**Story 8.13 audit — #8 (2026-11-05).** [Code quality audit](../../audits/code-quality-audit-story-8-13.md), finding #8: `tests/ui/drag-7-hierarchy-modal.spec.ts:635–661` (DRAG-7.10) asserts two 800 ms excursions and returns against a literal 1,500 ms delay. The clock-reset sequence belongs in deterministic pop-machine tests under the existing drag-testing convention; browser automation retains reachability/write outcomes and reads thresholds from `seedDragTuning`'s returned values. Carry this exact issue with Inbound deferrals item 9 and D2's flakiness/test-layer work; any Manual conversion remains Nathan's decision. This accepts the route without requiring a separate 8.13 rewrite.

## Approach and phases

### Decisions

**D1. Each case ends in one of four states** (`docs/test-plans/README.md`, "Which tests count, and what's manual"). "Flaky, kept anyway" isn't one (item 8).
- **Automated by a surface test:** an E2E spec, or a component test of what's on screen.
- **Automated by an internal test in an approved category:** a drag clock's logic, or a client ordering or request rule whose only surface is a drag.
- **Automated by an internal test Nathan approves,** one case at a time.
- **Manual, by Nathan's approval:** too flaky or too costly for what it checks. Its reason is a present-tense condition.

The Coder writes the tests, each titled with its case's ID. The Reconciler proposes the internal mappings and the Manual calls, Nathan approves them, and the Reconciler writes the statuses.

**D2. The flakiness bar** (item 8). A drag spec the story adds or changes stays only if:
- it passes 20 repeats on its own (`--repeat-each=20`);
- its file passes in the full run at the end of its batch.

A spec that misses the bar gets one of these, in order of preference:
- a fix to `dragGesture.ts`, such as a better aim or a better wait;
- a state-machine or pure-module test in place of its surface half;
- Manual, by Nathan's approval.

Nathan takes this as the starting point (2026-11-04). It's revisited during the batches, once it's clear how many specs miss it.

**D3. A skipped spec is never unskipped as it stands.** Each one is:
- reworked to its case as it now reads;
- merged into another spec;
- or deleted, when another test covers its case or the case goes Manual.

Its skip reason says why it was skipped, and its batch reads that first. Item 3 says the same of the legacy six.

**D4. The helpers come first** (items 4, 6 and 7), since every batch reuses them:
- **`boardLocators.ts::dragRegion(scope, key?)`,** in place of the four ways a spec finds a column's drag region. Two of them are both called `regionOf`, with different meanings.
- **`dragGesture.ts::tabBy(n)`:** the pointer moves sideways by `n × INDENT`, the constant read from the client, never a literal.
- **The quarter helpers:** `topQuarter`, `bottomQuarter` and `atFraction` are kept or retired by what each caller aims at. "Which half of a card" is no longer a rule; the lean picks the side.
- **`drag-column-bands.spec.ts`:**
  - its helpers move to a `tests/helpers/` module;
  - its re-rolls of `dragGesture.ts` and `seed.ts` give way to the originals, with `popThrough`'s `+ 2000` margins replaced by `clocksMargin`;
  - its DRAG-6 describe moves to a spec of its own. DRAG-1 and DRAG-3 share tests, so they may stay together.
- **The other re-rolls item 7 names:** `item-repositioning-cross-column-dnd.spec.ts`'s `article`/`column`, and `drag-5-stub-detach.spec.ts`'s row buttons.

No case's coverage changes in this phase. The specs it touches pass before and after.

**D5. One batch per suite,** ordered so a later batch reuses an earlier one's work (Phase 4). Each batch:
- reworks or deletes its suite's skips (D3);
- extends partial tests, or writes new ones, as Phase 2's inventory sets out;
- puts every drag spec it adds or changes through the bar (D2);
- lists its proposed Manual calls and internal mappings at its stop, for Nathan;
- ends with the gate and its spec files green, then a stop for review and commit.

**D6. Case IDs settle before any test is written** (Phase 2). The Planner's end-of-epic pass may revise, retire, move or renumber cases, and a test titled before it would need re-titling after (epic-done checklist, Tests).
- **A case found wrong or untestable** while its test is being written goes to the Planner, or through the Planner to the PO, as an Open question.
- **The Coder edits neither the catalog nor the wiki.**

**D7. A defect a spec finds** (Nathan, 2026-11-04). Story 8's rule fixed a defect in an 8.N story, and 8.13 is the last.
- **A small fix** lands in the batch that found it, with its own unit test, and the batch's stop names it.
- **A larger one** stops the batch, for Nathan to route.

**D8. The unread `data-*` attributes are settled last** (item 6).
- **An attribute no finished spec reads** is deleted from the client.
- **`data-active-context` and `data-inversion-count`** have no reader today, so they go unless a batch reads them.

**D9. Item 11: the column drag's stop shows the banner.**
- **Today:**
  - `useBoardDnd.ts::resyncBoard` reports a stop only for an item drag, the one `sessionRef` holds;
  - a column drag ends because the reload unmounts the board, and nothing reports it.
- **The build:**
  - `useBoardDnd` knows when a column drag is live, and `resyncBoard` reports its stop with the cause and no item.
  - `forcedStop.ts::ForcedStop` names an item only for an item drag.
  - The banner reads only the cause. The flash needs an item, so a column drag's stop has none, as §10's Planned passage says.
- **The wording is `STOP_WORDING`'s, unchanged,** since both sentences hold for a column drag. A line of its own for a column is a call for the PO, or for Nathan at the stop.
- **The dev/test panel's armed stop fires on the next drag of either kind,** so a column drag's stop can be tried by hand, and driven by a spec, as an item's is.
- **All three resyncs already go through `resyncBoard`:** a failed drop, a stale response, and a failed column reorder (`useColumnManagement.ts::onColumnDrop`'s `resync`). So one report covers them.
- **The unit tests,** in `useBoardDnd.test.ts`:
  - a resync during a column drag reports its stop, with its cause and no item;
  - a column drag released before the reload reports none.
- **The surface spec** waits until DRAG-6.26 is Open. It's written in batch 4a, with DRAG-6.22 and 6.25, which test the same stop (item 11's order).

### Phase 1: the column stop's banner (item 11, D9)

- **The build:** `forcedStop.ts`, `useBoardDnd.ts`, `BoardView.tsx` (the armed stop), and their unit tests.
- **Hands-on (Nathan):**
  - arm a stop in the panel, then drag a column;
  - release a column with its reorder refused, then start a second column drag before the refusal lands.
- **Then the gate,** and a stop for review and commit.
- **Then the docs,** in item 11's order:
  - the PO takes §10's Planned marker off;
  - the Planner removes only DRAG-6.22's column, no-cue clause, and makes DRAG-6.26 Open.

### Phase 2: the inventory

1. **The Planner's end-of-epic pass** (epic-done checklist, Tests, its first two items). It covers the features the epic touched: board-drag-interaction, project-tree, item-attachment and item-positioning. After it, the case IDs hold still.
2. **A baseline Reconciler run** over the drag suites and ATT-4.9. For each Open case, it lists the tests that carry its ID and what each one misses. It starts from what the earlier reports found, not from scratch:
   - A3's and A6's;
   - 8.1's;
   - 8.9's follow-up and final runs;
   - the close-out's (When it runs).
3. **The Architect writes the inventory into this plan:**
   - each case's batch (D5), and its intended end (D1);
   - each skip's fate (D3);
   - and moves the roadmap entry's items in.
4. **Nathan approves** the inventory, its proposed Manual calls and internal mappings, and the bar (D2). Then a stop.

### Phase 3: the helpers (D4)

The full E2E suite is green before the phase and after it. Then the gate, and a stop for review and commit.

### Phase 4: the batches (D5)

Each batch carries its suite's cases from the inventory. The skips and items listed here are what's known today.

- **4a. DRAG-1, DRAG-3 and DRAG-6:** `drag-column-bands.spec.ts` and the specs split from it in Phase 3. From item 10:
  - DRAG-1.3: the copy follows the cursor at Board;
  - DRAG-1.19: the one-sample yank and its two-pop cascade;
  - DRAG-6.15: the stale response that lands mid-drag;
  - the forced-stop cases, DRAG-6.16–6.28, with item 11's DRAG-6.26.
- **4b. DRAG-4 and DRAG-5:** `drag-card-zoom-in.spec.ts`, whose two skips become one parameterized spec (item 7), and `drag-5-stub-detach.spec.ts`, with DRAG-5.13's skip. Items 2 and 4: DRAG-4.1, 4.13, 4.17, 4.32, 4.33 and 5.9, by way of `tabBy`.
- **4c. DRAG-7:** `drag-7-hierarchy-modal.spec.ts` (4 skips), `drag-7-modal-hold.spec.ts` (6) and `drag-7-overflow-row.spec.ts` (1).
  - It starts with DRAG-7.17's trace (item 8).
  - Then item 9's cases, and from item 10, 8.3's three skips, DRAG-7.12's revised tiers and DRAG-7.27.
- **4d. DRAG-8,** the carried branch. It has no spec of its own yet.
- **4e. DRAG-2 and ATT-4.9:** `drag-target-classification.spec.ts`. ATT-4.9 replays each target the spec classifies against the move endpoint, A3's option (a).
- **4f. TREE:** `project-tree-drag.spec.ts`, with TREE-1.4's and TREE-2.1's skips, and the other sidebar specs. It covers:
  - TREE-1.13 (item 1);
  - TREE-1.8's and 1.9's tests, which pin the line's side rather than its row (A6);
  - Stories 8.7–8.12's follow-ups.
- **4g. Item 3's legacy specs:** `item-repositioning-cross-column-dnd.spec.ts` (2) and `item-repositioning-cross-project-dnd.spec.ts` (4).
  - First, re-check the precision problem they were skipped for. Since Story 6, a column drop lands where the ghost is, so it may be gone.
  - Then re-derive each against DRAG-3 and DRAG-4.5, or delete it where its API twin pins the math.

### Phase 5: the close

- D8's attributes.
- No `test.skip`, `test.fixme` or `.skip(` left in `tests/` or the unit suites.
- `npm run check`, then `npm run test:e2e` green twice in a row.
- **The one Reconciler run** (epic-done checklist), its report saved in `docs/audits/`. Its quality-flagged mappings and candidate cases are resolved, or routed to a destination that names them.
- The 80% coverage goal attempted, with the reason for any shortfall (epic-done checklist).
- A stop for review and commit. The epic-wide audit follows, as the epic's.

## Code map

Expected, from the Architect's reading. The Coder corrects it while building.

| Symbol | Carries |
|---|---|
| `forcedStop.ts::ForcedStop` (the item named only for an item drag) | D9 |
| `useBoardDnd.ts` (a live column drag, `resyncBoard`'s report, and the armed stop for either drag) | D9 |
| `tests/helpers/boardLocators.ts::dragRegion`, `dragGesture.ts::tabBy` and the quarter helpers | D4 |
| `drag-column-bands.spec.ts`, its helpers module, and the specs split from it | D4 |
| `tests/ui/*.spec.ts`, by batch | D3, D5 |
| The client's unread `data-*` attributes | D8 |

## Amendments

## Open questions

- **For Nathan, during the batches: the bar (D2).** It's the starting point, revisited once it's clear how many specs miss it.
- **For the Planner: the end-of-epic pass's reach (Phase 2):** which features it covers, and whether any suite is regrouped. A regrouping renumbers cases, so it lands before any test is titled.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:** board-drag-interaction §10, "a column drag the board stops shows the banner too" (Phase 1).
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:** DRAG-6.22, whose column, no-cue clause the Planner removes, and DRAG-6.26, which becomes Open (Phase 1).
- **Wiki sections added, changed, moved or removed** (PO, at close):

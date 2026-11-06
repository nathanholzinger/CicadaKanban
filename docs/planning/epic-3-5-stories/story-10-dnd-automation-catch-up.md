# Epic 3.5 Story 10 — DnD automation catch-up

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's Story 10 entry · **Status:** planning. Story 8 closed on 2026-11-06, so Phase 1 can start (When it runs)

## Goal

Bring the drag automation up to the test-plan catalogs once, now that the gesture has stopped moving, and decide case by case what the suite is for (roadmap, Story 10). It ends with:
- no `test.skip` or `test.fixme` in `tests/`, and no skipped unit test;
- every case in `docs/test-plans/` `Automated` or `Manual`, or named in the close with why it's still open and the plan that holds it (D10);
- `npm run check` and `npm run test:e2e` green;
- the epic-done checklist's Tests items checkable.

It also builds one rule: the banner for a column drag the board stops (DRAG-6.26, the roadmap entry's item 11).

**Where it sits in the epic's close.** The roadmap pulled the epic-done checklist's Tests section out into this story ("Why a story and not the checklist step"). So the story holds that section's steps, in their order:
1. the Test Planner's end-of-epic pass;
2. the tests;
3. the one Reconciler run.

The epic-wide audit comes after this story, by the checklist. Its scope isn't settled yet (Open questions).

**When it runs:** after Story 8's close-out, in Nathan's order (2026-11-04; roadmap, Story 8, "How each story closes"). All three steps are done:
1. the test reconciliation and code quality audit of Stories 8.8, 8.11 and 8.12, done 2026-11-04, and their findings fixed (`docs/archive/stories-8-8-8-11-8-12-fixes.md`);
2. Story 8.13, done 2026-11-05;
3. one more round, done 2026-11-06:
   - Story 8.13's audit and reconciliation;
   - the Story 8 close-out audit, which re-read Story 8's drag files in full (`docs/archive/story-8-close-out-audit.md`). Its 15 Fix Now findings are fixed, and its reconciliation is done.

Phase 2 starts from those reports.

**What it starts from** (recounted 2026-11-06, at `b1590b8`, Story 8's last commit):
- **24 skipped E2E specs:** the 22 of 2026-11-04, each routed to an item in the roadmap entry, and two that flaked in Phase 1's full runs, routed to 4c (Inbound deferrals):

  | Spec | Skips | Item |
  |---|---|---|
  | `drag-7-modal-hold.spec.ts` | 6 | 8, 10 |
  | `drag-7-hierarchy-modal.spec.ts` | 6 | 10; Inbound deferrals for DRAG-7.9's and DRAG-7.32's |
  | `item-repositioning-cross-project-dnd.spec.ts` | 4 | 3 |
  | `item-repositioning-cross-column-dnd.spec.ts` | 2 | 3 |
  | `drag-card-zoom-in.spec.ts` | 2 | 7, 10 |
  | `project-tree-drag.spec.ts` | 2 | 10 |
  | `drag-5-stub-detach.spec.ts` | 1 | 10 |
  | `drag-7-overflow-row.spec.ts` | 1 | 10 |

  Neither Story 8.13 nor the close-out's fixes added one. Each fixed the specs its changes broke, rather than skipping them (Nathan, 2026-11-04). Phase 1's two weren't broken by its changes: they flake at HEAD too.
- **No skipped unit test.** Story 8 skipped none that are still skipped.
- **148 Open cases in the drag suites,** and DRAG-6.26 Planned:
  - board-drag-interaction, 113: DRAG-1 21, DRAG-2 13, DRAG-3 11, DRAG-4 17, DRAG-5 10, DRAG-6 16, DRAG-7 13, DRAG-8 12;
  - project-tree, 35: TREE-1 15, TREE-2 12, TREE-4 3, TREE-11 5.

  Since 2026-11-04, Story 8.13 opened DRAG-7.28, 7.32 and 7.33 (Inbound deferrals). The close-out's reconciliation made DRAG-1.19, TREE-1.1, TREE-1.9 and TREE-2.9 Automated. The fixes story's confirming run made TREE-4.8, 4.10 and 4.12, and TREE-11.1, 11.3 and 11.5, Automated.
- **Six Open cases outside the drag work that no other plan names.** Story 8's stories left them Open, and with Story 8 closed, no plan holds them. The epic-done checklist needs every case in the features the epic touched to be `Automated` or `Manual`, or routed by ID to a later story. So this story settles them:
  - **TREE-9.4,** Story 8.13's: an earlier write's answer doesn't bring a deleted project back. Its hook test in `useProjectCollection.test.ts` carries the ID, under an internal mapping Nathan approved, but no reconciliation has assessed it yet.
  - **TREE-11.2, 11.4, 11.6, 11.7 and 11.8,** the fixes story's. Each of their specs in `project-tree-expansion.spec.ts` checks the rows it names but never that the hidden rows are hidden (`docs/archive/test-reconciliation-stories-8-8-8-11-8-12-fixes-confirming.md`).

  The other Open cases in those features are already routed: TC-5.15 and TC-6.11 to the Quick Items epic (`epic-4-decisions.md`), and ATT-4.9 here (item 1).

**Out of scope:**
- **The cues' final look and the zoom-in morph.** They moved to the Dashboard, Navigation & Notifications epic (`epic-8-decisions.md`). A look the wiki keeps under Open questions has no case, and no spec pins it.
- **Code changes beyond item 11,** a test hook a spec needs, a defect a spec finds (D7), and D11's probe and any fix it calls for.
- **The wiki and the catalog.** They're the PO's and the Planner's. A case found wrong goes to them (D6).

## Scope

- **Wiki passages:** board-drag-interaction §10's Planned passage, "a column drag the board stops shows the banner too". The PO takes its marker off after Phase 1.
- **Test-plan cases:** settled in Phase 2. The starting list:
  - the roadmap entry's items 1, 4, 9 and 10, by ID;
  - ATT-4.9 (item 1);
  - DRAG-6.26 (item 11);
  - DRAG-7.28, 7.32 and 7.33 (Inbound deferrals, Story 8.13's modal-Sheet cases);
  - TREE-9.4, and TREE-11.2, 11.4, 11.6, 11.7 and 11.8 (What it starts from).

## Inbound deferrals

The roadmap entry's items 1–11; item 5 is done (A3). Story 8's close-out added nothing to the entry, and nothing else is routed there now: since 2026-11-05, a new route lands here, below the list. The items still move here at Phase 2, as the plan template has the plan writer do, because the inventory restates what each case misses, and moving them first would mean writing them out twice. In short:

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

**Audit follow-up — #12.** `docs/archive/code-quality-audit-stories-8-8-8-11-8-12.md`, finding 12: `tests/ui/project-tree-drag.spec.ts`'s skipped TREE-2.1 title and reason still claim descendants are drawn/dimmed at opacity 0.3. They are absent during the drag. Replace the obsolete explanation/title and visibility assertions when this story rewrites that exact skipped spec under item 10. The route is accepted here so the audit need not arrange a separate rewrite before the planned rework; it does not count as passing coverage.

**Audit follow-up — TREE-1.14's placement (Nathan, 2026-11-05).** Found writing the sidebar's mid-drag cases in `stories-8-8-8-11-8-12-fixes.md` (its Amendment 8), and deferred here. Wiki project-tree §1 says a project that an earlier create or parent edit puts under the dragged one mid-drag "stays a place to drop", and a release making a cycle is refused by the server. `useProjectDragReorder.ts` doesn't offer it: it builds its placement rows with `toRows(flatItems, exclude)`, which drops every row whose parent was dropped, so `Y`, drawn under the carried `X`, leaves placement with `X`, though it isn't in the held subtree. Hovering `Y` then gives placements against the rows beside it only, and the release that makes `X` `Y`'s child can't be made.
- **A fix is small:** leave out the rows of the held ids alone, not their children. The decision it needs is the depths a gap beside `Y` offers: the two shallower ones would name `X` itself, which the server refuses.
- **What exists:** the hook test asserts only that `Y` is drawn under `X`, no part of the held branch, and that the next pickup holds it hidden; the App test asserts the refusal leaves the earlier edit. The surface spec, the release that is sent, and the refusal that follows it are this story's, with the test of the placement (a gap after `Y`, tabbed one level deeper, saves `X` under `Y`). TREE-1.14 is `Open` until then.

**Story 8.13 audit — #8 (2026-11-05).** [Code quality audit](../../archive/code-quality-audit-story-8-13.md), finding #8: `tests/ui/drag-7-hierarchy-modal.spec.ts:635–661` (DRAG-7.10) asserts two 800 ms excursions and returns against a literal 1,500 ms delay. The clock-reset sequence belongs in deterministic pop-machine tests under the existing drag-testing convention; browser automation retains reachability/write outcomes and reads thresholds from `seedDragTuning`'s returned values. Carry this exact issue with Inbound deferrals item 9 and D2's flakiness/test-layer work; any Manual conversion remains Nathan's decision. This accepts the route without requiring a separate 8.13 rewrite.
- **The same audit's #10, optional:** the spec's Sheet tests, `:786–1047`, could move to a spec of their own. DRAG-7.28's second test, which carries a row, would stay with the drag tests. Batch 4c decides, since it reworks this spec for #8 and for the Sheet cases below. It needs no case and no audit row.

**Story 8.13 — the modal-Sheet cases left Open (2026-11-05).** DRAG-7.28, 7.32 and 7.33 have specs in `drag-7-hierarchy-modal.spec.ts` that carry their IDs. 8.13's confirming reconciliation found each short of its case and left the rest "to 8.13 or its scheduled Story 8 close-out", but the close-out's reconciliation covered only its own seven cases (`docs/archive/test-reconciliation-story-8-13-confirming.md`, Gaps). What each still needs:
- **DRAG-7.28:** the saved order after the carried row's release. The spec checks the gap, the depth and the saved parent, but not that `R2` is saved before `R1a`.
- **DRAG-7.32:** the modal's place on screen, compared before the Sheet opens and after each way of closing it. Its rows, indents, scroll and writes are already checked. Its spec is skipped now, for flaking (below), so 4c traces the flake first, and then reworks the spec under D3 with this assertion added.
- **DRAG-7.33:** a check against the case as it now reads. The case was cut to child links only after that run (8.13's Amendment 8), so no run has compared its spec with the child-only case.

They go to batch 4c, with the DRAG-7 suite. None needs a drag past what its spec already does.

**Story 8.13 — the `drag-7` specs that fail in the full E2E run (item 8).** From 8.13's Open questions (`docs/archive/story-8-13-modal-sheet-and-create-cap.md`):
- 8.13's three full runs each failed three `drag-7` specs: DRAG-7.10, 7.3 and 7.29 in the first; DRAG-7.16, 7.4 and 7.29 in the second; DRAG-7.10, 7.16 and 7.4 in the third.
- Run alone at `ed771e3`, before 8.13 changed anything, DRAG-7.10, 7.3 and 7.29 failed about as often, so 8.13 didn't cause them. DRAG-7.16 and 7.4 weren't tried there.
- The close-out's batches ran a failing `drag-7` spec alone before blaming the batch, and left these five to this story.

Phase 1's two full runs added two more, one in each, and Nathan had them skipped until 4c (2026-11-06), so the skips are 24 now:
- **DRAG-7.9's second test** ("it is R1’s last child, after R1a") timed out once; it passed 6 of 6 run alone.
  - DRAG-7.9 stays `Automated` for now. Three of its tests still run and carry its ID, so no run's lost-coverage check reopens it.
  - But a skipped test doesn't count (`docs/test-plans/README.md`), so nothing running checks the last-child state now. Phase 2's baseline run judges whether the other three cover its *Then* without it. If they don't, it goes `Open`, for 4c.
- **DRAG-7.32** left the Sheet open after a way of closing it, once in the full run and 1 of 8 run alone. At HEAD (`bb7633c`), with Phase 1's changes stashed, it failed 2 of 16, so it isn't Phase 1's.

4c traces them with the five. Under D3, each is reworked to its case, not unskipped as it stands, and both leave the skips with the rest (Goal).

None of the seven has a cause yet. Phase 5 needs two green full runs in a row, and D2's bar applies to each of them once 4c touches it. So 4c traces them with DRAG-7.17's, before writing anything new in that suite.

**Story 8 close-out audit — #18 (Nathan, 2026-11-06).** [Code quality audit](../../archive/code-quality-audit-story-8-close-out.md), Watch List finding #18, optional: the E2E helpers' request controls have a lifecycle of their own, apart from the pointer's geometry. These are `dragGesture.ts::delayMoveResponses` and `refuseMoves`, and `projectTreeDrag.ts::watchWrites` and `settledWrites`. A request harness beside `holdRequests.ts` could own them. It's taken here because D4 reworks these helpers first, and this story's specs are their main callers (about 60 uses across 8 specs today), so a move now would have every import touched twice. Phase 3 decides whether to make it. Either way, it needs no case and no audit row.

## Approach and phases

### Decisions

**D1. Each case ends in one of four states** (`docs/test-plans/README.md`, "Which tests count, and what's manual"). "Flaky, kept anyway" isn't one (item 8).
- **Automated by a surface test:** a Playwright UI or API spec, or a server route test. A component test calls client code directly, so it's an internal test, as the README says.
- **Automated by an internal test in an approved category:** a drag clock's logic, or a client ordering or request rule whose only surface is a drag.
- **Automated by an internal test Nathan approves,** one case at a time.
- **Manual, by Nathan's approval:** too flaky or too costly for what it checks. Its reason is a present-tense condition.

The Test Automator writes the Playwright tests and the Coder the Vitest ones, each titled with its case's ID (D12). The Reconciler proposes the internal mappings and the Manual calls, Nathan approves them, and the Reconciler writes the statuses.

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
- ends with a confirming Reconciler run over its cases. The Planner passes it the cases the Automator held off on;
- lists that run's proposed Manual calls and internal mappings at its stop, for Nathan;
- ends with the gate and its spec files green, then a stop for review and commit.

**D6. Case IDs settle before any test is written** (Phase 2). The Planner's end-of-epic pass may revise, retire, move or renumber cases, and a test titled before it would need re-titling after (epic-done checklist, Tests).
- **A case found wrong or untestable** while its test is being written goes to the Planner, or through the Planner to the PO, as an Open question.
- **Neither the Coder nor the Automator edits the catalog or the wiki.**

**D7. A defect a spec finds** (Nathan, 2026-11-04). Story 8's rule fixed a defect in an 8.N story, and 8.13 is the last. The Automator names a failing clause in its message, and the Planner hands it to the Coder in Open questions.
- **A small fix** lands in the batch that found it, made by the Coder with its own unit test, and the batch's stop names it.
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
  - The banner reads only the cause. The flash needs an item, so a column drag's stop has none, as §10's Planned passage says. The flash is set in `useForcedStop.ts::report`, from the stop's item, so a stop with no item sets no flash there.
- **The wording is `STOP_WORDING`'s, unchanged,** since both sentences hold for a column drag. A line of its own for a column is a call for the PO, or for Nathan at the stop.
- **The dev/test panel's armed stop fires on the next drag of either kind,** so a column drag's stop can be tried by hand, and driven by a spec, as an item's is. Its timer is in `useBoardDnd.ts` and starts with the item drag's machine (`machineActive`). `BoardView.tsx` only keeps the armed stop across a reload, and `DragTuningPanel.tsx`'s comment says "the next item drag".
- **All three resyncs already go through `resyncBoard`:** a failed drop, a stale response, and a failed column reorder (`useColumnManagement.ts::onColumnDrop`'s `resync`). So one report covers them.
- **The unit tests:**
  - in `useBoardDnd.test.ts`, a resync during a column drag reports its stop, with its cause and no item, and a column drag released before the reload reports none;
  - in `useForcedStop.test.ts`, a stop with no item holds the banner and names no row to flash.
- **The surface spec** waits until DRAG-6.26 is Open. It's written in batch 4a, with DRAG-6.22 and 6.25, which test the same stop (item 11's order).

**D10. The close covers the whole catalog** (Nathan, 2026-11-06). The story closes only when every case in `docs/test-plans/` is one of these:
- `Automated` or `Manual`;
- still open for a reason the close states, held by a later plan that names it by ID. A Planned case's reason is the rule not yet built. A Pending PO case's reason is the ruling it waits for.

This story takes the open cases outside the drag work too, rather than leaving them for another story. The six in What it starts from are small. The ones already routed elsewhere go in the close's list, with their reasons:
- **TC-5.15 and TC-6.11, Open, and TC-6.13 and ATT-5.11, Pending PO:** the Quick Items epic holds them until its rework of the done column (`epic-4-decisions.md`, Nathan, 2026-09-30). The epic-done checklist allows no Pending PO case, so the close names that routing beside the two.
- **ATT-1.10, Planned:** a Card shows its tags (wiki item-attachment §12). No plan names it yet. Phase 2's inventory finds it one, probably the Tags & Type System epic.

**A case this story finds it can't close,** with no later plan that fits, gets a tech-debt story. The Architect writes its plan in `docs/planning/tech-debt-stories/` before this story closes, and the close names that plan.

**D11. The Unknown-status probe** (Nathan, 2026-11-06). A Correctness worker in the close-out audit raised this, and the audit left it out unprobed, since the Unknown status was outside its scope (`docs/archive/story-8-close-out-audit.md`, Open questions).
- **The candidate:** filing a parent with attached children out of Unknown status may leave the Unsorted bucket's "needs attention" badge up until a reload.
  - `itemWriteReconciliation.ts::completeItemWrite` updates only the written row. Its comment says the attached descendants' `workphaseId` copies stay stale until the next load, since "a drag never reads those copies".
  - But `itemListOps.ts::hasUnknownStatusItem` reads them, attached ones included, as wiki boards-columns-unsorted §10 counts attached items toward the badge. `BoardView.tsx` draws the badge from it.
- **The probe:** a hook or component test in Phase 1 files such a parent and checks the badge once the answer lands.
- **If it fails:** the fix is small, and it lands in Phase 1 under D7's small-fix rule, with its unit test. The Planner writes its case. §10 already states the rule.
- **If it passes:** it's dropped, and Phase 1's stop says so.

**D12. Who does what** (Nathan, 2026-11-06). The split follows `.claude/guides/testing-strategy.md`, "Who writes which": the Test Automator writes the Playwright suites, and the Coder the Vitest ones.

| Work | Who |
|---|---|
| Phase 1: D9's build and D11's probe, with their Vitest tests | Coder |
| Phase 2: the end-of-epic pass, and the baseline Reconciler run it spawns | Test Planner |
| Phase 2: the inventory | Architect |
| Phase 3: D4's helpers, all under `tests/` | Test Automator, which the Planner spawns |
| Phase 4: each batch's Playwright specs, skips included | Test Automator |
| Phase 4: what a batch needs outside `tests/`: a test hook, a defect's fix (D7), a state-machine or pure-module test in place of a surface half (D2), and any Vitest test the inventory routes, such as TREE-9.4's | Coder |
| Each batch's confirming Reconciler run (D5) | Test Planner |
| Phase 5: D8's attributes, and the coverage goal | Coder |
| Phase 5: the one Reconciler run | Test Planner |
| Phase 5: this story's audit | Auditor |

Within a batch, the two work side by side on separate files: the Automator on `tests/`, the Coder on the app and the Vitest suites. The Planner's brief names the Automator's files.

### Phase 1: the column stop's banner (item 11, D9)

- **The build:** `forcedStop.ts`, `useBoardDnd.ts` (the report and the armed stop), `useForcedStop.ts` (no flash without an item), `DragTuningPanel.tsx`'s comment, and their unit tests.
- **The Unknown-status probe (D11),** and its fix if the probe fails.
- **Hands-on (Nathan):**
  - arm a stop in the panel, then drag a column;
  - release a column with its reorder refused, then start a second column drag before the refusal lands.
- **Then the gate,** and a stop for review and commit.
- **Then the docs,** in item 11's order:
  - the PO takes §10's Planned marker off;
  - the Planner removes only DRAG-6.22's column, no-cue clause, and makes DRAG-6.26 Open.

### Phase 2: the inventory

1. **The Planner's end-of-epic pass** (epic-done checklist, Tests, its first two items). It covers the features the epic touched: board-drag-interaction, project-tree, item-attachment and item-positioning. boards-columns-unsorted is one too, since the close-out's #5 changed its §3 and added BCU-1.7 and 1.8. After the pass, the case IDs hold still.
2. **A baseline Reconciler run** over the drag suites, ATT-4.9, and the six cases outside the drag work (What it starts from). For each Open case, it lists the tests that carry its ID and what each one misses. It starts from what the earlier reports found, not from scratch. All of them are in `docs/archive/`:
   - A3's and A6's;
   - 8.1's;
   - 8.9's follow-up and final runs;
   - the fixes story's confirming run (`test-reconciliation-stories-8-8-8-11-8-12-fixes-confirming.md`);
   - 8.13's confirming run (`test-reconciliation-story-8-13-confirming.md`);
   - the close-out's confirming run (`test-reconciliation-story-8-close-out-confirming.md`), the later word for DRAG-1.19, TREE-1.1, TREE-1.9, TREE-2.9 and TREE-4.14.
3. **The Architect writes the inventory into this plan:**
   - each case's batch (D5), and its intended end (D1). A case this story won't close gets its reason and the plan that holds it instead (D10);
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
- **4c. DRAG-7:** `drag-7-hierarchy-modal.spec.ts` (6 skips, two of them from Phase 1), `drag-7-modal-hold.spec.ts` (6) and `drag-7-overflow-row.spec.ts` (1).
  - It starts with the traces (item 8): DRAG-7.17's, and those of the seven specs that fail in the full run, including DRAG-7.9's and DRAG-7.32's skipped ones (Inbound deferrals).
  - Then item 9's cases, and from item 10, 8.3's three skips, DRAG-7.12's revised tiers and DRAG-7.27.
  - Then the modal-Sheet cases DRAG-7.28, 7.32 and 7.33, and the 8.13 audit's #8, with its optional #10 (Inbound deferrals).
- **4d. DRAG-8,** the carried branch. It has no spec of its own yet.
- **4e. DRAG-2 and ATT-4.9:** `drag-target-classification.spec.ts`. ATT-4.9 replays each target the spec classifies against the move endpoint, A3's option (a).
- **4f. TREE:** `project-tree-drag.spec.ts`, with TREE-1.4's and TREE-2.1's skips, and the other sidebar specs. It covers:
  - TREE-1.13 (item 1);
  - TREE-1.8's and 1.9's tests, which pin the line's side rather than its row (A6);
  - Stories 8.7–8.12's follow-ups;
  - the sidebar's cases outside the drag work: the hidden rows TREE-11.2, 11.4, 11.6, 11.7 and 11.8 never check, in `project-tree-expansion.spec.ts`, and TREE-9.4 if the baseline run finds its hook test short (What it starts from).
- **4g. Item 3's legacy specs:** `item-repositioning-cross-column-dnd.spec.ts` (2) and `item-repositioning-cross-project-dnd.spec.ts` (4).
  - First, re-check the precision problem they were skipped for. Since Story 6, a column drop lands where the ghost is, so it may be gone.
  - Then re-derive each against DRAG-3 and DRAG-4.5, or delete it where its API twin pins the math.

### Phase 5: the close

- D8's attributes.
- No `test.skip`, `test.fixme` or `.skip(` left in `tests/` or the unit suites.
- `npm run check`, then `npm run test:e2e` green twice in a row.
- **The one Reconciler run** (epic-done checklist), its report saved in `docs/audits/`. Its quality-flagged mappings and candidate cases are resolved, or routed to a destination that names them.
- **The close's list (D10):** every case in `docs/test-plans/` that isn't `Automated` or `Manual`, each with its status, why it's still open, and the plan that names it. Any tech-debt story D10 calls for is written by now.
- The 80% coverage goal attempted, with the reason for any shortfall (epic-done checklist).
- A stop for review and commit.
- **This story's audit** (story-done checklist). Its range starts at `epic-3-5-story-8-13-audited`, the newest `*-audited` tag, since the close-out's end tag has no `-audited`. So it reads:
  - the close-out's Fix Now batches and the tests written beside them, which no audit has read (`docs/archive/story-8-close-out-audit.md`, D4 and Handoff);
  - the E2E drag specs, which the close-out left to it.

  Nathan tags its end commit `epic-3-5-story-10-audited`.
- The epic-wide audit follows, as the epic's, on the scope settled for it (Open questions).

## Code map

Expected, from the Architect's reading. The Coder corrects it while building.

| Symbol | Carries |
|---|---|
| `forcedStop.ts::ForcedStop` (`itemId` is null for a column drag) | D9 |
| `useBoardDnd.ts` (`columnDragRef` and `columnDragLive`, set by `handleDragStart` and cleared by `endSession`; `resyncBoard`'s report; the armed stop's effect, for either drag) | D9 |
| `useForcedStop.ts::report` (no flash for a stop with no item) and `DragTuningPanel.tsx`'s armed-stop comment | D9 |
| The probe's test (`useItemManagement.test.ts`, "filing a parent out of Unknown status"), and the fix it called for: `itemWriteReconciliation.ts::withWorkphaseCascaded`, run by `completeItemWrite`, with its tests in `itemWriteReconciliation.test.ts` | D11 |
| `drag-7-hierarchy-modal.spec.ts`'s Sheet tests (DRAG-7.28, 7.32, 7.33), and `project-tree-expansion.spec.ts` (TREE-11's hidden rows) | Inbound deferrals, What it starts from |
| `tests/helpers/boardLocators.ts::dragRegion`, `dragGesture.ts::tabBy` and the quarter helpers | D4 |
| `drag-column-bands.spec.ts`, its helpers module, and the specs split from it | D4 |
| `tests/ui/*.spec.ts`, by batch | D3, D5 |
| The client's unread `data-*` attributes | D8 |

## Amendments

- **2026-11-06 — Phase 1's two skips, into Phase 4 (Architect, at Nathan's direction).** The Coder skipped DRAG-7.9's second test and DRAG-7.32's spec for flaking, and recorded them in Inbound deferrals. Now:
  - What it starts from counts 24 skips;
  - 4c's traces take seven specs, not five;
  - the modal-Sheet deferral notes DRAG-7.32's skip;
  - Phase 2's baseline run judges whether DRAG-7.9 still has whole-case coverage without its skipped test.
- **2026-11-06 — Nathan's answers (Architect):**
  - **D10:** the story closes with every case in the catalog `Automated` or `Manual`, or named in the close with its reason and the plan that holds it. A case with no such plan gets a tech-debt story before the close. The Goal, Phase 2's inventory and Phase 5 now say so.
  - **D11:** the Unknown-status probe runs in Phase 1, as recommended. The Open question is removed.
  - **The epic-wide audit's scope** is discussed separately. It's now an Open question, with Nathan's starting points.
  - **D1's surface tests** now match `docs/test-plans/README.md`. D1 had counted a component test as a surface test, but it's an internal one, which needs Nathan's approval.
- **2026-11-06 — the Test Automator (Architect, at Nathan's direction):** the Test Planner now spawns a Test Automator (`.claude/agents/test-automator.md`) that writes the Playwright suites from the cases, and the Coder writes the Vitest suites. D12 assigns this story's work to match. D1 and D6 name both writers. D5's batches end with a confirming Reconciler run. D7 says how a failing clause reaches the Coder. The Open question for the Planner on the README is new.
- **2026-11-06 — brought up to date after Story 8 closed (Architect).** Read against Story 8.13's and the close-out's plans, audits and reconciliations, all now in `docs/archive/`, and against the code at `b1590b8`:
  - **Status and When it runs:** Story 8 is closed, so Phase 1 can start.
  - **What it starts from:** recounted. The skips are the same 22. The drag suites have 148 Open cases. Six more Open cases, outside the drag work, have no other plan now, and the epic-done checklist needs them settled.
  - **Inbound deferrals:** three of 8.13's handoffs had landed nowhere. They're now here: the modal-Sheet cases DRAG-7.28, 7.32 and 7.33; the five `drag-7` specs that fail in the full run; and the 8.13 audit's optional #10. New routes now land here, not in the roadmap entry.
  - **D9:** the build adds `useForcedStop.ts`, where a stop's flash is set. The armed stop's timer is in `useBoardDnd.ts`, not `BoardView.tsx`.
  - **Phases 2, 4 and 5:** the Planner's pass adds boards-columns-unsorted. The baseline run adds the six cases, and starts from the three confirming runs since. 4c and 4f take the new routes. Phase 5 gains this story's own audit, as the close-out's D4 and Handoff set it out.
  - **Links:** the audits it names are now in `docs/archive/`.

  Checked and unchanged: D4's helpers (only `dragGesture.ts`'s comment changed); TREE-1.14's `toRows(flatItems, exclude)`; #12's TREE-2.1 skip; and #8's lines.

## Open questions

- **For Nathan, during the batches: the bar (D2).** It's the starting point, revisited once it's clear how many specs miss it.
- **For Nathan and the Architect, separately: the epic-wide audit's scope** (Nathan, 2026-11-06). It doesn't hold up this story before Phase 5. Nathan's starting points:
  - **Choose the files, don't take the range.** audit-workflow §10's range, from the previous `epic-N-complete` tag, would take in nearly the whole repo, since the mid-epic refactors touched nearly everything. So it's scoped to the most important files, chosen the way the close-out audit chose its own.
  - **Weigh the cost against what it would find.** This story is mostly test files. So much of an epic-wide audit right after it would re-read code the close-out audit read in full, little changed since.

  This story's own audit (Phase 5) is part of the same question: what it reads, and whether the epic-wide audit takes it in.
- **For the Planner: `docs/test-plans/README.md` and the Test Automator.** Its opening section says "Developers write the tests", and its handoff line says "The developer doesn't edit the plan". Both still hold, but with the Automator, the first could say who writes which: the Coder the Vitest suites, and the Test Automator, which the Planner spawns, the Playwright suites (`.claude/guides/testing-strategy.md`, "Who writes which"). The Planner writes no test code either way.
- **For the Planner: the end-of-epic pass's reach (Phase 2):** which features it covers, and whether any suite is regrouped. A regrouping renumbers cases, so it lands before any test is titled.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:** board-drag-interaction §10, "a column drag the board stops shows the banner too" (Phase 1).
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:** DRAG-6.22, whose column, no-cue clause the Planner removes, and DRAG-6.26, which becomes Open (Phase 1).
- **A case for D11's fix, for the Planner to write** (Phase 1). The probe failed: filing a parent out of Unknown status left the Unsorted bucket's "needs attention" badge up until a reload, since the client moved only the written row, where the server also moves its attached descendants. Wiki boards-columns-unsorted §10 already states the rule (`needsAttention` counts an Attached item whose own workphase is unknown). The case: *given* a parent and its Attached descendants in Unknown status, *when* the parent is filed into a workflow workphase and the write's answer lands, *then* the badge goes without a reload. The Coder's tests carry no ID yet and take the Planner's: `useItemManagement.test.ts` ("filing a parent out of Unknown status") and `itemWriteReconciliation.test.ts` ("the workphase cascade").
- **Wiki sections added, changed, moved or removed** (PO, at close):

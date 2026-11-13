# Epic 3.5 Story 10 — DnD automation catch-up

**Type:** story · **Written:** 2026-11-04 by the Architect, from the roadmap's Story 10 entry · **Status:** in progress. Phases 1–3 and batches 4a–4b are committed; 4b is `857720b9`. All 26 cases in 4b are Automated, with 1,400 repeat passes, final E2E 394 passed / 21 existing skips / zero failed and root gate green. [Story 10's second part](story-10-batches.md) holds the current resume packet and Review log; 91 active story assignments remain Open. Batch 4c has not started and waits for the catalog coverage report and parallel-runner work. The remaining work uses the new testing roles. Conditional DRAG-3.12 stays separate and nonblocking; DRAG-4.35 stays retired/deferred.

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

  | Spec                                           | Skips | Item                                                 |
  | ---------------------------------------------- | ----- | ---------------------------------------------------- |
  | `drag-7-modal-hold.spec.ts`                    | 6     | 8, 10                                                |
  | `drag-7-hierarchy-modal.spec.ts`               | 6     | 10; Inbound deferrals for DRAG-7.9's and DRAG-7.32's |
  | `item-repositioning-cross-project-dnd.spec.ts` | 4     | 3                                                    |
  | `item-repositioning-cross-column-dnd.spec.ts`  | 2     | 3                                                    |
  | `drag-card-zoom-in.spec.ts`                    | 2     | 7, 10                                                |
  | `project-tree-drag.spec.ts`                    | 2     | 10                                                   |
  | `drag-5-stub-detach.spec.ts`                   | 1     | 10                                                   |
  | `drag-7-overflow-row.spec.ts`                  | 1     | 10                                                   |

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

- **Wiki passages:** board-drag-interaction §10's column-stop banner rule. The PO removed its Planned marker after Phase 1.
- **Test-plan cases:** settled in Phase 2. The starting list:
  - the roadmap entry's items 1, 4, 9 and 10, by ID;
  - ATT-4.9 (item 1);
  - DRAG-6.26 (item 11);
  - DRAG-7.28, 7.32 and 7.33 (Inbound deferrals, Story 8.13's modal-Sheet cases);
  - TREE-9.4, and TREE-11.2, 11.4, 11.6, 11.7 and 11.8 (What it starts from).
  - **Phase 2 step 1 additions:** BCU-5.6, BCU-5.7, TREE-4.15 and TREE-2.14, Open. TREE-2.14 follows the PO's ruling in hierarchy-placement §7: a new row stays untiered until the next pickup. Each is this story's to settle, or route under D10.
  - **Cases revised in that pass:** ATT-4.9; TC-2.6, TC-2.16, TC-2.17 and TC-6.4; DRAG-3.9, DRAG-3.10, DRAG-3.20 and DRAG-4.13; DRAG-6.22, DRAG-6.25 and DRAG-6.26. The baseline run rechecks the existing automation claims against the revised cases. TC-6.13's question was also rewritten without implementation observations; its Quick Items routing under D10 is unchanged.
  - **D13, Phase 2 step 5:** the 26 original Split cases are listed in [The shared looks](story-10-batches.md). DRAG-1.27 and TREE-2.8 keep their IDs as shared Manual cases; the other 24 retain their automatable clauses. New shared Manual cases: DRAG-2.24, DRAG-6.30 and DRAG-6.31. DRAG-6.27, TREE-1.1 and TREE-2.13 point their appearance clauses to those shared looks while keeping timing, placement and geometry. No existing ID moves or retires.

- **4a case clarification:** DRAG-1.16 now states that a foreign/nowhere release commits the current locked-list ghost/highlight relation at release, including concrete A/after, A/before and B/after examples. Vertical movement may change the own-list slot; it does not freeze the pickup relation. The Descendants clause, ID, priority and Rule stay unchanged; the confirming Reconciler sets its status and Automation fields. This follows wiki board-drag-interaction §1.1 and §2 and needs no new PO ruling.

- **4b case clarification:** DRAG-4.22 distinguishes a changed relation while locked, a Board release after a pop and cancellation with no request; return/new-pickup clocks start fresh. This corrects its overgeneralized final sentence from wiki board-drag-interaction §2, §3, §6.1 and §10 before test authoring. The ID, title, priority and Rule are unchanged; the confirming Reconciler owns its final coverage fields.

- **4b retirement at Nathan's direction:** DRAG-4.35 is removed from the catalog, active scope and automation; its defect and fresh future coverage are held by [the Descendants highlight-cue story](../tech-debt-stories/descendants-highlight-cue.md). The ID is retired; Next ID remains DRAG-4.36. Batch 4b has 26 cases / 70 validated scoped variants. The active story inventory has 151 assignments; 4a and 4b close 60, leaving 91 Open. B09's disputed line-place guard is removed under the PO's ruling; DRAG-4.30's functional seed/last-child assertions remain. No app fix is part of the retirement itself.

## Inbound deferrals

The roadmap entry's items 1–11; item 5 is done (A3). Story 8's close-out added nothing to the entry, and nothing else is routed there now: since 2026-11-05, a new route lands here, below the list. The items still move here at Phase 2, as the plan template has the plan writer do, because the inventory restates what each case misses, and moving them first would mean writing them out twice. In short:

1. **A3's routed cases,** with A4's candidate tests, and the drag tests A6's run found short: 53 board-drag-interaction cases, ATT-4.9 and TREE-1.13.
2. **The Story 4 audit's #3.** What's left is DRAG-4.1's and 4.17's E2E half, which item 10 lists too.
3. **The six legacy `item-repositioning-*` skips:** re-derive each, or delete it where its API twin pins the math.
4. **Story 6's precise-move cases:** DRAG-4.13, 4.32, 4.33 and 5.9, plus `tabBy(n)` and the overlay form's attribute.
5. **Story 6.1's leftovers:** the quarter helpers, and seven unread `data-*` attributes.
6. **Specs that bypass helpers** (the Story 6 and 6.1 audit's #17), and the split of `drag-column-bands.spec.ts`.
7. **The flakiness call for each case,** starting with DRAG-7.17's trace.
8. **Story 7's leftovers:** DRAG-7.13's first clause and DRAG-7.10's three misses.
9. **Stories 8.1–8.12's routings:**
   - specs that pass but miss a clause;
   - the skips to rework or delete;
   - cases with no surface spec;
   - each story's Planner follow-up;
   - the mid-point reconciliation's three cases.
10. **The stopped column drag's banner,** DRAG-6.26.

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
  - But a skipped test doesn't count (`docs/test-plans/README.md`), so nothing running checks the last-child state now. Phase 2's baseline run judges whether the other three cover its _Then_ without it. If they don't, it goes `Open`, for 4c.
- **DRAG-7.32** left the Sheet open after a way of closing it, once in the full run and 1 of 8 run alone. At HEAD (`bb7633c`), with Phase 1's changes stashed, it failed 2 of 16, so it isn't Phase 1's.

4c traces them with the five. Under D3, each is reworked to its case, not unskipped as it stands, and both leave the skips with the rest (Goal).

None of the seven has a cause yet. Phase 5 needs two green full runs in a row, and D2's bar applies to each of them once 4c touches it. So 4c traces them with DRAG-7.17's, before writing anything new in that suite.

**Story 8 close-out audit — #18 (Nathan, 2026-11-06).** [Code quality audit](../../archive/code-quality-audit-story-8-close-out.md), Watch List finding #18, optional: the E2E helpers' request controls have a lifecycle of their own, apart from the pointer's geometry. These are `dragGesture.ts::delayMoveResponses` and `refuseMoves`, and `projectTreeDrag.ts::watchWrites` and `settledWrites`. A request harness beside `holdRequests.ts` could own them. It's taken here because D4 reworks these helpers first, and this story's specs are their main callers (about 60 uses across 8 specs today), so a move now would have every import touched twice. D4 makes it (2026-11-06), since the batches need its write counts. It needs no case and no audit row.

## Approach and phases

### Decisions

**D1. Each case ends in one of four states** (`docs/test-plans/README.md`, "Which tests count, and what's manual"). "Flaky, kept anyway" isn't one (item 8).

- **Automated by a surface test:** a Playwright UI or API spec, or a server route test. A component test calls client code directly, so it's an internal test, as the README says.
- **Automated by an internal test in an approved category:** a drag clock's logic, or a client ordering or request rule whose only surface is a drag.
- **Automated by an internal test Nathan approves,** one case at a time.
- **Manual, by Nathan's approval:** too flaky or too costly for what it checks. Its reason is a present-tense condition.

The QA Engineer writes the Playwright tests and shares Vitest work with the Coder under D12, each test titled with its case's ID. The Test Reviewer proposes mappings during authoring; the Reconciler may find new ones at the close. Internal mappings outside approved categories need Nathan's approval. The Reconciler confirms statuses and Automation lines; an approved Manual call can also be applied in a Planner session. The QA Engineer never sets either field.

**D2. The flakiness bar** (item 8). A drag spec the story adds or changes stays only if:

- it passes 10 repeats on its own (`--repeat-each=10`). The bar was 20 for batches 4a and 4b;
- its file passes in the full run at the end of its batch.

A spec that misses the bar gets one of these, in order of preference:

- a fix to `dragGesture.ts`, such as a better aim or a better wait;
- a state-machine or pure-module test in place of its surface half;
- Manual, by Nathan's approval.

Nathan takes this as the starting point (2026-11-04). It's revisited at the checkpoint after batch 4a ([Story 10's second part](story-10-batches.md)), once it's clear how many specs miss it.

**On the parallel runner** (Nathan, 2026-11-09, [Parallel E2E Workers](../tech-debt-stories/e2e-parallel-workers.md)' decision 8):
- the 20-repeat evidence 4a and 4b earned on one worker stands, and isn't re-earned. The runner's contention check carries it onto the new runner;
- from 4c on, the repeats and each batch's final full run use the runner's adopted worker count, so the repeats also run under load;
- if no worker count passes the runner's acceptance, the suite stays on one worker and this bar is unchanged.

**Adopted count and exception (Nathan, 2026-11-10): five workers.** After the extended trial, Nathan selects five for its measured full-suite speed gain with no newly observed failing test identity or mode. Re-evaluate with the smoke suite, when E2E execution should occupy less of each story and capacity for simultaneous work may weigh more heavily; revisit sooner if failures or contention change. Nathan accepts the runner trial with the recorded DRAG-7.10 and DRAG-3.16 failures so the suite runs faster during this story. DRAG-7.10 remains active and is fixed in 4c. Both DRAG-3.16 variants are temporarily skipped and restored in 4i, a batch of returned cases (2026-11-12). The runner's raw stability/contention failures remain recorded; this adoption exception does not lower D2's repeat or batch-final-run requirements for the cases those batches add or change.

**Ten repeats, from 4c on (Nathan, 2026-11-11).** The [flake investigation](../../audits/story-10-drag-flake-investigation.md) found that the count is a weak detector at either size: a test that fails one run in fifty passes twenty repeats two times in three. Most of the recorded flakes also needed load, which the one-worker repeats never applied. Ten repeats at five workers still catch a test that fails often, at half the cost. 4a and 4b's twenty-repeat evidence stands. The order of remedies above is unchanged.

**A failing test during a batch (Nathan, 2026-11-12).** For the rest of this story, in place of D2's order of remedies for a test that existed before the batch:

- **A test that existed before the batch's work, and fails flakily** (it passes on its own or on a rerun): skip it and move it to batch 4i. The skip carries a comment that states the reason. The batch's Results and 4i record it, and the batch doesn't investigate or repair it. A skipped test never counts, so its case's status and Automation line are the Reconciler's to reflect.
- **A test the batch added or changed, when it fails:** the QA Engineer may investigate. If it finds the failure is false, a problem in how the test was written, it may fix the test, up to two attempts. If the test still fails after the second attempt, the QA Engineer stops and reports that the test is failing, with everything it has learned about why, and doesn't keep trying. A failure that is real, where the app doesn't do what the case says, follows the existing route: a defect handoff, with the test left as written.
- **Within a frozen Stop 4,** a fix is a test change, and it ends the frozen pass as before. The second attempt is also the persona's second correction, so its three questions are answered in Results.
- **What stays as it was:** the bar itself (ten repeats at five workers, and the file's pass in the batch's final full run). A test the two attempts don't settle gets D2's remedies in their order, by Nathan's decision.

The bar is this story's, set for its flaky drag specs. It isn't a process for other stories.

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
- **The request harness** (Inbound deferrals, #18). `dragGesture.ts::delayMoveResponses` and `refuseMoves`, and `projectTreeDrag.ts::watchWrites` and `settledWrites`, move beside `holdRequests.ts`. Then a board spec can check that a gesture sent no request, or exactly one, with its body. Saved fields alone don't prove that (the baseline report's Test Quality Concerns, #5).
- **The forced-stop cause helper.** It puts a live drag through each genuine resync: a refused drop, a stale response carrying reindex pairs, and a refused column reorder. Batches 4d and 4e use it. The stale response may need a test hook, which is the Coder's (D12).

No case's coverage changes in this phase. The specs it touches pass before and after.

**A helper found during a batch is written in that batch.** That's when a second spec needs the same action, or a spec would otherwise hand-roll a drag or a setup (root AGENTS.md).

- Its batch's stop names it, so the next brief uses it.
- An older spec moves onto it only where the batch already changes that spec, since D2's bar applies to every spec a batch changes.
- A helper that needs support in the app goes to the Coder (D12).

**D5. One batch per suite, or per two that share setups,** ordered so a later batch reuses an earlier one's work. The batches and their cases are in [Story 10's second part](story-10-batches.md), with a checkpoint after 4a, where Nathan decides how the rest runs. Each batch:

- reworks or deletes its suite's skips (D3);
- extends partial tests, or writes new ones, as Phase 2's inventory sets out;
- puts every drag spec it adds or changes through the bar (D2);
- gets Test Reviewer passes while tests are written, with verdicts and desk answers recorded word for word in the batch doc's Review log;
- ends with one cold Reconciler run, spawned by the QA Engineer from the agent's fixed inputs;
- lists unresolved held-off cases, proposed Manual calls and internal mappings at its stop, for Nathan;
- ends with the gate and its spec files green, then a stop for review and commit.

**For 4c–4j, the five session stops in [Story 10's second part](story-10-batches.md) govern execution under the [Testing Roles Refactor](../tech-debt-stories/testing-roles-refactor.md):** proof/variant review; tests/discovery with the desk and Test Reviewer; separate Coder/review when needed; frozen validation on a tree ID; one cold reconciliation/closure. One session per stop, with Nathan's file list and check-in. Results are one current packet, rewritten after each matrix family; the Review log is append-only. This changes the execution boundaries, not D2, the assigned cases or batch order. The parallel runner's five-worker adoption and bounded failure deferrals are recorded in D2 above.

**D6. Case IDs settle before any test is written** (Phase 2). The Planner's end-of-epic pass may revise, retire, move or renumber cases, and a test titled before it would need re-titling after (epic-done checklist, Tests).

- **A case found wrong or untestable** while its test is being written goes to the Planner, or through the Planner to the PO, as an Open question.
- **Neither the Coder nor the QA Engineer edits the catalog or the wiki.** The read-only Planner desk answers reading questions; rewording, a Split, a Pending PO question or a Manual call goes to a Planner session Nathan opens. The Planner spawns no automation or reconciliation agents.

**D7. A defect a spec finds** (Nathan, amended by the Testing Roles Refactor). The QA Engineer preserves the failing case-derived assertions and records the failing clause, expected and observed surface results, reproducer and evidence in Open questions. It may say where diagnosis looked, never prescribe the fix. It stops work on the case for Nathan to route the handoff.

- **One separate Coder session per stop** carries that stop's hooks and test routes, followed by Nathan's check-in. A behavior change still gets its own handoff. Neither the Planner nor the QA Engineer spawns an in-session Coder. Approved title stamps and permitted Vitest work may be done by the QA Engineer under D12; they don't require a Coder solely because they are internal tests or stamps.
- **A small fix may remain in this story,** with its regression test, but it requires the same handoff and review boundary. Nathan decides when the Coder starts and when the automation pass resumes.
- **A larger fix** also waits for Nathan to route it.
- **Before resuming automation,** the Coder's return identifies the wiki rule, changed behavior/files, start/end tree IDs, paired regression evidence, validation and `/code-review` record. It lists ID-bearing Vitest assertion/setup changes for the QA Engineer's Test Reviewer pass. Nathan checks in; then the original failing surface test is rerun unchanged first. Case or rule changes go separately to their owner. Neither test writer edits a test to make it pass.

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
- **The surface spec** waits until DRAG-6.26 is Open. It's written in batch 4d, with DRAG-6.22 and 6.25, which test the same stop (item 11's order).

**D10. The close covers the whole catalog** (Nathan, 2026-11-06). The story closes only when every case in `docs/test-plans/` is one of these:

- `Automated` or `Manual`;
- still open for a reason the close states, held by a later plan that names it by ID. A Planned case's reason is the rule not yet built. A Pending PO case's reason is the ruling it waits for.

This story takes the open cases outside the drag work too, rather than leaving them for another story. The six in What it starts from are small. The ones already routed elsewhere go in the close's list, with their reasons:

- **TC-5.15 and TC-6.11, Open, and TC-6.13 and ATT-5.11, Pending PO:** the Quick Items epic holds them until its rework of the done column (`epic-4-decisions.md`, Nathan, 2026-09-30). The epic-done checklist allows no Pending PO case, so the close names that routing beside the two.
- **ATT-1.10, Planned:** a Card shows its tags (wiki item-attachment §12). The Tags & Type System epic holds it. `epic-5-decisions.md` names it by ID, under "Test-plan cases routed here by ID" (Nathan, 2026-11-06).

**A case this story finds it can't close,** with no later plan that fits, gets a tech-debt story. The Architect writes its plan in `docs/planning/tech-debt-stories/` before this story closes, and the close names that plan.

**D11. The Unknown-status probe** (Nathan, 2026-11-06). A Correctness worker in the close-out audit raised this, and the audit left it out unprobed, since the Unknown status was outside its scope (`docs/archive/story-8-close-out-audit.md`, Open questions).

- **The candidate:** filing a parent with attached children out of Unknown status may leave the Unsorted bucket's "needs attention" badge up until a reload.
  - `itemWriteReconciliation.ts::completeItemWrite` updates only the written row. Its comment says the attached descendants' `workphaseId` copies stay stale until the next load, since "a drag never reads those copies".
  - But `itemListOps.ts::hasUnknownStatusItem` reads them, attached ones included, as wiki boards-columns-unsorted §10 counts attached items toward the badge. `BoardView.tsx` draws the badge from it.
- **The probe:** a hook or component test in Phase 1 files such a parent and checks the badge once the answer lands.
- **If it fails:** the fix is small, and it lands in Phase 1 under D7's small-fix rule, with its unit test. The Planner writes its case. §10 already states the rule.
- **If it passes:** it's dropped, and Phase 1's stop says so.

**D12. Who does what** (Nathan, amended by the Testing Roles Refactor). The split follows `.claude/guides/testing-strategy.md`, "Who writes which". The QA Engineer owns Playwright and its support, shares Vitest work with the Coder, and spawns the desk, Test Reviewer and end-of-scope Reconciler. The Planner owns case decisions and remains code-blind. Phases 1–3 and batches 4a–4b are complete; their results record the roles that ran them.

| Work                                                                                     | Who                                     |
| ---------------------------------------------------------------------------------------- | --------------------------------------- |
| Phase 1: D9's build and D11's probe, with their Vitest tests                             | Coder                                   |
| The end-of-epic pass and later case decisions                                            | Test Planner                            |
| A baseline Reconciler run                                                                | QA Engineer spawns the Reconciler       |
| Phase 2: the inventory, in [Story 10's second part](story-10-batches.md)                 | Architect                               |
| Phase 2: D13's rewording and its shared `Manual` cases                                   | Test Planner                            |
| D4's helpers and each remaining batch's Playwright specs, skips included                 | QA Engineer                             |
| Phase 4: app source, test hooks/routes and a defect's fix with its regression tests (D7) | Coder                                   |
| Existing Vitest tests and approved held-off-case tests, under D12's limits               | Coder or QA Engineer, as Nathan assigns |
| Each batch's Test Reviewer passes, Results and Review log                                | QA Engineer                             |
| Each batch's confirming Reconciler run (D5)                                              | QA Engineer spawns the Reconciler       |
| Phase 5: D8's attributes, and the coverage goal                                          | Coder                                   |
| Phase 5: the one Reconciler run                                                          | QA Engineer spawns the Reconciler       |
| Phase 5: D13 into the testing-strategy guide, for Nathan's approval                      | Architect                               |
| Phase 5: D13 into the catalog README                                                     | Test Planner                            |
| Phase 5: this story's audit                                                              | Auditor                                 |

**The remaining automation batches use one session per stop.** Nathan names the file list. The QA Engineer never edits app source, including hooks and test routes; those go through D7's separate Coder session and return check-in. It or the Coder may edit an existing Vitest test, whoever Nathan asks first. It writes a new Vitest test only for a held-off case, after the Test Reviewer's internal-coverage verdict and Nathan's approval, from the Then, never a fix-pinned regression. The Coder lists ID-bearing Vitest assertion/setup changes for review. The QA Engineer stamps its Playwright tests and approved Vitest mappings before the freeze; the Reconciler stamps only what it finds new at the close. Tree IDs replace per-file fingerprints, and the QA Engineer keeps the current Results packet and append-only Review log in [Story 10's second part](story-10-batches.md). D2 and the remaining assignments are unchanged.

**D13. A case's look is checked by hand; the rest is automated** (Nathan, 2026-11-06). Some cases say how something is drawn: a tier's strength, a pulse, a fade, a tilt, a colour. A test can read the attribute the client sets for it, such as `data-drop-tier`, `data-pending`, `data-stop-flash`, `data-active-context` or `data-drag-overlay-form`. It can't tell whether the result looks right.

- **A case that holds both becomes two** (`docs/test-plans/README.md`: one status per case). The Planner rewords it to the part a test can pin, such as "R1a is at the Mid tier". A Playwright test closes that part by reading the attribute before, during and after the drag.
- **The look goes to a shared `Manual` case, one per look,** not one per case, since a look checked once holds wherever it's drawn. A case that is only a look folds into its shared case, or becomes `Manual` itself, as the Planner decides.
- **Only how something is painted goes manual:** opacity, colour, a pulse, a fade, a tilt, a shadow. Never:
  - what's saved;
  - which row is affected;
  - which tier, form or state a row has.

  Where something is drawn, and how big, stays automated, through `dragGesture.ts::boxOf` and `paintedBoxOf`, since the drag's own logic reads those boxes.

- **A spec that reads an attribute keeps it** under D8.
- **The final look is the Dashboard, Navigation & Notifications epic's** (Out of scope). The shared cases check today's configured values, and their *Then*s follow the wiki as it changes.

The Split cases, and the shared looks proposed for them, are listed in [Story 10's second part](story-10-batches.md).

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

This phase is complete under the prior roles. The numbered sequence and results below are historical; D12 governs any new baseline or case work.

1. **The Planner's end-of-epic pass** (epic-done checklist, Tests, its first two items). It covers the features the epic touched: board-drag-interaction, project-tree, item-attachment and item-positioning. boards-columns-unsorted is one too, since the close-out's #5 changed its §3 and added BCU-1.7 and 1.8. After the pass, the case IDs hold still.
2. **A baseline Reconciler run** over the drag suites, ATT-4.9, the six cases outside the drag work (What it starts from), and the new or revised cases listed in step 1's results below. Pending PO cases wait for a ruling before coverage can be confirmed. For each Open case, it lists the tests that carry its ID and what each one misses. It starts from what the earlier reports found, not from scratch. All of them are in `docs/archive/`:
   - A3's and A6's;
   - 8.1's;
   - 8.9's follow-up and final runs;
   - the fixes story's confirming run (`test-reconciliation-stories-8-8-8-11-8-12-fixes-confirming.md`);
   - 8.13's confirming run (`test-reconciliation-story-8-13-confirming.md`);
   - the close-out's confirming run (`test-reconciliation-story-8-close-out-confirming.md`), the later word for DRAG-1.19, TREE-1.1, TREE-1.9, TREE-2.9 and TREE-4.14.
3. **The Architect writes the inventory,** in [Story 10's second part](story-10-batches.md). Done 2026-11-06, from the baseline report. It holds:
   - each Open case's batch (D5), the kind of work that closes it, and its intended end (D1);
   - D13's Split cases and their shared looks;
   - each skip's fate (D3);
   - the cases outside this story (D10);
   - the approvals for step 4.

   The roadmap entry's items reach it by case, through the report, which read every case they route.

4. **Nathan approves** the inventory, its recommendation to decline the Reconciler's proposed internal mappings, and the bar (D2). The baseline proposed no `Manual` call. Done 2026-11-06:
   - **Every proposed internal mapping is declined,** so each case gets a fresh look at whether a surface Playwright test can cover it. A batch that still finds an internal test the better fit proposes it again, one case at a time, through its confirming run (D5).
   - **ATT-1.10** goes to the Tags & Type System epic (D10).
   - **The roadmap entry's items stay as they are,** as the history of each route.
5. **The Planner applies D13:** rewords the Split cases, and writes the shared `Manual` cases. Done 2026-11-06; the results and IDs are below and in [The shared looks](story-10-batches.md). At the step 5 stop, after which the case IDs hold still (D6).

#### Step 1 results — Test Planner, 2026-11-06

Re-read all five feature pages and all 44 suites (478 existing cases), with positioning, hierarchy-placement and row-references as their shared rules. The pass reads no app or test code. The suites remain coherent: no case moves, retired IDs or old → new ID map, and no test re-titling is required. Existing IDs stay fixed; the four additions take each suite's Next ID.

| Feature                 | Result                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| board-drag-interaction  | Apply the PO's Phase 1 handoff to DRAG-6.22, DRAG-6.25 and DRAG-6.26. Clarify incoming-item fixtures for DRAG-3.9 and DRAG-3.10, limit DRAG-3.20's two-divider assertion to positional regions, and give DRAG-4.13 concrete saved child orders for the two placements.                                                      |
| project-tree            | Add TREE-4.15 for an older tree read after a successful create or subtree delete, complementing TREE-4.14's rename and move scenarios. Add TREE-2.14 for a row first drawn after pickup; the PO's ruling resolves it to Open, asserting no tier until the next drag.                                                        |
| item-attachment         | Clarify ATT-4.9's exhaustive comparison: every visible item target, from the same starting state, with the moving item ending Attached. Overflow controls are not item-parent references. No additional settled rule lacks a case.                                                                                          |
| item-positioning        | Clarify TC-2.6's active-workphase create, restrict TC-2.16's no-workphase `none` scope to Free items, and make TC-2.17's impossible-through-API fixture explicitly a direct database edit. Clarify TC-6.4's distinct completion times and tie-break; remove implementation observations from TC-6.13's unresolved question. |
| boards-columns-unsorted | Add BCU-5.6 for D11: filing the Unknown-status parent clears attention for its attached descendants without a reload. Add BCU-5.7 for the boundary: a detached descendant and its attached child stay Unknown and keep attention raised.                                                                                    |

**Status boundaries:** DRAG-6.26 moves from Planned to Open because the PO cleared its passage's marker. The other pre-existing automation mappings and statuses are left for the Reconciler; this pass makes no coverage judgment. BCU-5.6, BCU-5.7, TREE-4.15 and TREE-2.14 are Open, with no test mapping claimed. TREE-2.14 now cites wiki project-tree §1 and hierarchy-placement §7 after the PO's ruling. ATT-1.10 stays Planned for the tags passage. TC-5.15, TC-6.11, TC-6.13 and ATT-5.11 keep their D10 destinations and statuses; the Architect's inventory still needs to name a destination for ATT-1.10.

**For step 2:** include the four new Open cases and all twelve revised live cases named in Scope, even those currently stamped Automated. BCU-5.6 is the case D11's Coder handoff awaits; the Reconciler assesses the candidate tests named there before any mapping is claimed. Revisit DRAG-6.22's tests against its narrower no-cue rule, and assess DRAG-6.26 now that it is Open. TREE-2.14's ruling is folded in before the run: the added row is untiered for the current drag and Mid on the next pickup, with every existing pickup tier unchanged. No test layer or future test file is assigned by this pass.

**Catalog conventions:** the README now names the Coder, Automator and Reconciler split, the writer who re-titles a moved case's tests, and how an Automator's removed IDs reach the story handoff. The Planner still reads and writes no test code.

**Validation:** `npm run check:docs` passes (418 files, zero hits), the changed catalog tables match their case titles, priorities and statuses, and `git diff --check` passes. App and test suites were not run for this documentation pass.

#### Step 2 results — baseline reconciliation, 2026-11-06

**Report:** [Story 10 baseline test reconciliation](../../audits/test-reconciliation-story-10-baseline.md). The Reconciler assessed all 248 scoped cases against the current tests at source HEAD `dd0341be`, including TREE-2.14 after the PO's ruling, and ran the mandatory whole-catalog checks. Its coverage table has one decision per scoped case; its Open rows name the current ID-bearing tests and the exact clauses still missing. This is a static reconciliation, with no app or test suite execution.

| Scope         | Automated | Open | Manual | Planned | Pending PO | Total |
| ------------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| This run      |        89 |  154 |      5 |       0 |          0 |   248 |
| Whole catalog |       318 |  156 |      5 |       1 |          2 |   482 |

**Catalog changes:**

- Open → Automated: DRAG-7.33, TREE-11.2, TREE-11.4, TREE-11.6 and TREE-11.8. Their current surface tests prove their whole current cases.
- Automated → Open: DRAG-3.9 and DRAG-3.10 (incomplete single-band geometry and release assertions), DRAG-7.9 (its last-child-after-R1a outcome is only in the skipped test), and TC-6.4 (no assertion that the done items have no stored positions). Their Automation lines are now `—`.
- DRAG-7.2 keeps Automated; its approved count-test pointer follows the existing test to its current file.

**Global checks:** no Automated case lacks every active ID-bearing test, no unknown test ID, and no Manual case with an ID-bearing test. Those checks cover all 482 cases; the 234 cases outside the run did not receive a whole-Then review. The 24 skipped declarations remain, now listed by exact file/title in the report: 16 carry case IDs and eight legacy declarations do not. No new Manual call is proposed.

**For the Architect's inventory:**

- Use the report's 154 Open rows, Proposed Stamps and Proposed Internal Mappings to assign each case's batch and intended end; use its skip register for every D3 disposition. No new internal association is approved by this run, and adding an ID alone does not close a missing clause.
- TREE-2.14 and TREE-4.15 have no ID-bearing test. BCU-5.6/5.7 have useful D11 candidates but still need their exact Unknown-status, board-response and visible-attention obligations; their proposed internal associations also need IDs and approval.
- TREE-9.4 stays Open: the existing moved-in-project variants retain `X` top-level after the delete, rather than proving that `X`, already saved in the deleted subtree, is deleted and stays absent. This is a Coder-owned fixture/assertion gap against the unchanged case, not a product ruling.
- DRAG-7.28 still needs saved sibling order; DRAG-7.32 needs active Sheet-dismissal coverage plus the modal's preserved screen position. TREE-11.7 still needs its queued-edit window and remaining assertions. TREE-1.14 keeps its existing accepted implementation route.
- No new settled-rule case is proposed. The report preserves the prior unread-cap drag-loading question for the PO if it is scheduled; it makes no ruling or new live case for that window. D10's later-plan destinations remain for the inventory.

**Validation:** documentation checks pass (418 files, zero hits), catalog tables and case fields agree, all 248 coverage rows are present exactly once, and `git diff --check` passes. The Reconciler's field-mask check confirms that its catalog changes touch only its owned status/Automation fields. The Architect's inventory and the Automator's batches have not started.

#### Step 5 results — D13 rewording, 2026-11-06

All 26 listed Split cases are processed without reading app or test code. Twenty-four keep their existing IDs and Open status for behavior that can be pinned. DRAG-1.27 becomes the shared Manual carried-copy/outline case, and TREE-2.8 the shared Manual sidebar-appearance case. Three new Manual cases complete the shared looks: DRAG-2.24 for board tiers, DRAG-6.30 for forced-stop painting, and DRAG-6.31 for pending pulses. Each has a concrete Given/When/Then, wiki Rule citations and a present-tense Manual reason.

| Shared look                                                                  | Manual case |
| ---------------------------------------------------------------------------- | ----------- |
| Carried copy's tilt/held shadow and active-context outline colour            | DRAG-1.27   |
| Board tier and ghost strengths, nested isolation and full-strength drop line | DRAG-2.24   |
| Forced-stop flash's two amber pulses and banner's final-quarter fade         | DRAG-6.30   |
| Pending pulse endpoints and isolation of nested rows and the line            | DRAG-6.31   |
| Sidebar's own tier/ghost values, untiered new row and full-strength line     | TREE-2.8    |

The revised Open cases still assert saved outcomes, which row is affected, which tier/form/state is assigned, and where things are drawn and how big. DRAG-6.19 keeps the banner's configured lifetime and no-restart rule; DRAG-6.20 keeps the flash target; DRAG-6.23 and DRAG-6.24 keep independent pending-state ownership. DRAG-3.22 keeps both form switches, dimensions, pointer continuity and branch-line placement. Three supporting references in DRAG-6.27, TREE-1.1 and TREE-2.13 now point to the shared paint checks without moving their timing, placement or geometry into Manual.

**IDs and handoff:** no old → new map or test-ID re-titling is required. DRAG-2's Next ID is DRAG-2.25; DRAG-6's is DRAG-6.32. The batch inventory now has 152 Open assignments; the two reused Manual IDs are no longer automation assignments. Current catalog wording supersedes the baseline's painted-appearance residuals. Existing Automated statuses/pointers, wiki rules and baseline report are unchanged. The confirming runs judge the revised cases after their tests are written.

**Status snapshot after this pass:** the whole catalog has 485 cases: 318 Automated, 154 Open, 10 Manual, one Planned and two Pending PO. This is not a new reconciliation or a manual test run. Phase 3 and the Automator batches have not started; this is the requested step 5 stop.

**Validation:** documentation checks pass (418 files, zero hits), all 485 catalog cases agree with their summary tables and required metadata, and all 152 in-scope Open cases have exactly one batch assignment. `git diff --check` passes. App and test code were neither read nor changed for this pass.

### Phase 3: the helpers (D4)

Completed under the prior roles: the Test Automator wrote the helpers every batch needs from the start:

- D4's list, from items 4, 6 and 7, with `drag-column-bands.spec.ts`'s split;
- the request harness (#18);
- the forced-stop cause helper, with the Coder's test hook if the stale response needs one.

A helper found later is written in the batch that finds it (D4).

The full E2E suite is green before the phase and after it. Then the gate, and a stop for review and commit.

#### Phase 3 results — 2026-11-06

D4 is complete. The Planner delegated the Playwright work to the Test Automator, and Nathan authorized a Coder for the DRAG-6.25 defect the helper exercise exposed. The Planner did not read app or test code. No app hook was needed, no original Playwright assertion or ID was removed, and Phase 4 has not started.

**Helpers for the next briefs:**

| Helper                                        | Contract now available                                                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `boardLocators.ts`                            | Canonical `dragRegion(scope, key?)` and exact item-row buttons; the named column/card/row-button re-rolls are migrated.                                          |
| `dragGesture.ts`                              | `tabBy` reads the client's board indent. Quarter/fraction helpers remain as row/region aiming points, not before/after decisions. Pop waits use `clocksMargin`.  |
| `boardDragScenario.ts`                        | Shared fixtures and band aims extracted from `drag-column-bands.spec.ts`, using the existing reset, seed and gesture helpers.                                    |
| `requestHarness.ts`, beside `holdRequests.ts` | Delayed/refused answers and write observation, with method, URL and body; can hold a real successful answer. The board and sidebar request controls now use it.  |
| `forcedStopCause.ts`                          | Genuine resyncs from a refused item drop, a stale response carrying server-produced reindex pairs, or a refused column reorder. Existing setup support suffices. |

DRAG-6's three existing Playwright declarations now live in `tests/ui/drag-preview-reconciliation.spec.ts`; DRAG-1 and DRAG-3 remain together in `drag-column-bands.spec.ts`. The [Phase 3 Reconciler report](../../audits/test-reconciliation-story-10-phase-3.md) confirms the moved assertions and repairs only the Automation paths for DRAG-6.1, DRAG-6.2, DRAG-6.5 and DRAG-6.6. Their statuses and approved internal pointers stay unchanged.

**DRAG-6.25 defect and fix:** the genuine-cause exercise exposed an extra `PATCH /columns/reorder` when the held pointer was released after a column drag had stopped and reloaded. All three causes failed, confirmed in nine of nine column exercises; a quiet check before release ruled out a delayed setup write. Nathan authorized the small D7 fix. The Coder prepared it in isolation and applied its four client files only after the preservation run released the checkout, with baseline/revised hashes checked and no drift. A stopped or cancelled column gesture, or a release with no live column drag, now writes nothing; a fresh normal column gesture still reorders. The two permanent lifecycle regressions fail before the fix and pass afterward. Applied-checkout focused units passed 182/182, and the final gate includes the full 997-test client suite.

The Coder also removed four stale TREE-2.8 title claims in the sidebar's internal tests, preserving their assertions and TREE-2.1. The final Reconciler scan finds no Manual-ID conflict. TREE-2.8 stays Manual. DRAG-6.25 stays Open and unmapped for batch 4d's complete surface case; this helper pass makes no new catalog coverage claim.

**Validation reported by the Automator:**

| Check                                                                               | Result                                                                        |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Full E2E before edits                                                               | 240 passed, 24 existing skips; 4.1 minutes                                    |
| D2 preservation: 12 migrated/new spec files, 20 repeats each                        | 2,200 passed, 400 expected skipped runs; 1.0 hour                             |
| Post-fix genuine causes: item/column drags across all three causes, 20 repeats each | 120 passed; 5.6 minutes                                                       |
| Final full E2E                                                                      | 240 passed, 24 existing skips; 4.0 minutes                                    |
| Final root gate                                                                     | Passed: types, lint, formatting; 444 server, 997 client and 258 scripts tests |
| Documentation                                                                       | 422 files checked, zero hits; diff check passes                               |

The preservation run used the unchanged app throughout; the fix landed after it, followed by the intact post-fix diagnostic and final full run. Playwright retries were zero, with no failed, flaky or retry-only pass in the completed runs. The original 153 ID-bearing Playwright titles and 24 skip/fixme declarations match exactly. No skipped unit test is added.

The temporary `tests/ui/phase3-helper-smoke.spec.ts` was retained while its clause failed, passed all 120 post-fix exercises unchanged, and was then explicitly retired. It is not a coverage mapping or a substitute for batch 4d. The permanent unit regression remains.

Commands used:

```powershell
npm.cmd run test:e2e -- --reporter=line
npm.cmd run test:e2e -- tests/ui/attached-children.spec.ts tests/ui/drag-5-stub-detach.spec.ts tests/ui/drag-7-hierarchy-modal.spec.ts tests/ui/drag-7-modal-hold.spec.ts tests/ui/drag-7-overflow-row.spec.ts tests/ui/drag-card-zoom-in.spec.ts tests/ui/drag-column-bands.spec.ts tests/ui/drag-preview-reconciliation.spec.ts tests/ui/item-create-cap.spec.ts tests/ui/item-repositioning-cross-column-dnd.spec.ts tests/ui/project-tree-create-cap.spec.ts tests/ui/project-tree-drag.spec.ts --repeat-each=20 --reporter=line
npm.cmd run test:e2e -- tests/ui/phase3-helper-smoke.spec.ts --repeat-each=20 --reporter=line
npm.cmd run check
```

The diagnostic command above is historical: its temporary file is retired. Runtime evidence is in `tests/output/phase3-repeat.log`, `tests/output/phase3-cause-check.log` and `tests/output/phase3-final-e2e.log`.

**Catalog and stop:** 485 cases remain: 318 Automated, 154 Open, 10 Manual, one Planned and two Pending PO. The 152 Open batch assignments are unchanged. Whole-catalog lost/unknown/Manual-ID checks are clean, and the baseline report is unchanged. The only catalog diff is four Automation-path substitutions. Phase 3 is ready for review and commit; batch 4a has not started, and no commit was made.

### Phase 4: the batches (D5)

The batches, their cases, the skips' fates and the checkpoint after 4a are in [Story 10's second part](story-10-batches.md), and each batch's results go there. In run order:

- **4a.** DRAG-1 and DRAG-3, with TC-6.4, and BCU-5.6 and 5.7. Then the checkpoint.
- **4b.** DRAG-4 and DRAG-5.
- **4c.** DRAG-7, starting with the traces (Inbound deferrals).
- **4d.** DRAG-6, the forced stops.
- **4e.** DRAG-8, the carried branch.
- **4f.** DRAG-2 and ATT-4.9.
- **4g.** TREE, with TREE-9.4 and TREE-11.7.
- **4h.** Item 3's six legacy skips.
- **4i.** Work returned after its tests were skipped: DRAG-3.16 (from 4a, after the runner trial's setup connection reset), DRAG-5.3 and DRAG-5.10's B21 test (from 4b) and DRAG-7.18 (from 4c), and any later flaky test that predates its batch. DRAG-7.18 is also a case study in weighing a surface test's cost.
- **4j.** Deferred from 4c's close: the weak hold-opened distance variants of DRAG-7.10 and DRAG-1.14, and three candidate new cases (two for a Planner session, one for the PO).

#### Batch 4a results — 2026-11-08

The [confirming Reconciler report](../../audits/test-reconciliation-story-10-batch-4a.md) makes all 34 scoped cases Automated: 10 Extend, 22 New and two Split. The catalog totals are 352 Automated, 120 Open, 10 Manual, one Planned and two Pending PO; 118 of the original 152 story assignments remain Open. The [batch results](story-10-batches.md) record the per-kind case/test counts, helper contracts, measured cost and six resolved Coder round trips: DRAG-1.26's observation hook, DRAG-3.18's workphase label, DRAG-1.33's expansion preference, DRAG-3.10's title-only route stamp, and DRAG-1.5's saved-intent and visible-gap fixes. No Coder handoff remains open.

All 89 drag variants have twenty accepted passes each, zero retries: 1,780 total. The interrupted failed attempt and seven excluded overlapping successes remain explicit; raw per-variant JSON and matching source/test fingerprints support the combined proof. Both continuation cohorts pass. Final full E2E passes 329 tests with 24 existing skips, and the root gate passes types, lint, formatting, docs, 444 server, 1,023 client and 258 scripts tests. These checks ran sequentially and the temporary system-idle lease was restored. The usage-limit interruption was recovered from completed artifacts without rerunning them.

Stopped at the checkpoint for Nathan's decisions on D2, the remaining batches' scope/routing and their order. Batch 4b has not started, and no commit has been made.

#### Batch 4b results — confirming reconciliation complete

The [confirming Reconciler report](../../audits/test-reconciliation-story-10-batch-4b.md) makes all **26 scoped cases Automated**: four Extend, 20 New and two Rework. The [batch close-out](story-10-batches.md) records five specs, one changed shared helper, the separate Coder returns and final coverage complements. Authored/changed scope is 26 expressions / 70 variants; the maintained file union is 71 with unchanged DRAG-1.14. No scoped case is held off and no new Manual or mapping approval is needed. Associated DRAG-3.3 Automation-pointer maintenance adds no closure or assignment to this count.

All 70 scoped variants pass twenty distinct executions each, **1,400/1,400 with zero failures/retries/skips**. Final full E2E is **394 passed / 21 existing skips / zero failed**, and the root gate passes **444 server / 1,040 client / 258 script tests, docs 433 / zero hits**, on the unchanged snapshot. The existing background run finishes during a usage-limit delivery interruption; recovery reruns nothing. Stop 4 takes about two hours three minutes of executed command time; final reconciliation performs no test execution or source edit.

Catalog totals are **378 Automated / 93 Open / 10 Manual / one Planned / two Pending PO**, 484 cases total. Of 151 active story assignments, **91 remain Open** after 4a and 4b. Global identity checks are clean. Conditional DRAG-3.12 stays separately recorded and nonblocking; retired DRAG-4.35 remains outside the catalog. Batch 4b is committed in `857720b9`; no archive move, new Coder task or 4c work follows from that close.

### Phase 5: the close

- D8's attributes.
- No `test.skip`, `test.fixme` or `.skip(` left in `tests/` or the unit suites.
- `npm run check`, then `npm run test:e2e` green twice in a row.
- **The one cold Reconciler run, spawned by the QA Engineer** (epic-done checklist), from its fixed inputs: Scope/Review log, green-tree catalog report and run record, and the range's test/catalog diffs. Its report is saved in `docs/audits/`; open reviewer verdicts, quality-flagged mappings and candidate cases are resolved, or routed to a destination that names them. Reconciliation is not repeated inside the audit.
- **The close's list (D10):** every case in `docs/test-plans/` that isn't `Automated` or `Manual`, each with its status, why it's still open, and the plan that names it. Any tech-debt story D10 calls for is written by now.
- The 80% coverage goal attempted, with the reason for any shortfall (epic-done checklist).
- **D13 into the living docs.** The rule exists only in this plan, which goes to the archive at the close, so later stories would lose it. Each writes it as a standing rule, naming no story:
  - the Architect adds it to `.claude/guides/testing-strategy.md`'s "What stays manual", for Nathan's approval;
  - the Planner adds it to `docs/test-plans/README.md`'s "Which tests count, and what's manual", beside "One status per case" (Living-docs handoff).

  If a batch has changed the rule by then, its amendment is the later word.

- A stop for review and commit.
- **This story's audit** (story-done checklist). Its range starts at `epic-3-5-story-8-13-audited`, the newest `*-audited` tag, since the close-out's end tag has no `-audited`. So it reads:
  - the close-out's Fix Now batches and the tests written beside them, which no audit has read (`docs/archive/story-8-close-out-audit.md`, D4 and Handoff);
  - the E2E drag specs, which the close-out left to it.

  Nathan tags its end commit `epic-3-5-story-10-audited`.

- The epic-wide audit follows, as the epic's, on the scope settled for it (Open questions).

## Code map

Expected, from the Architect's reading. The Coder corrects it while building.

| Symbol                                                                                                                                                                                                                                                   | Carries                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `forcedStop.ts::ForcedStop` (`itemId` is null for a column drag)                                                                                                                                                                                         | D9                                     |
| `useBoardDnd.ts` (`columnDragRef` and `columnDragLive`, set by `handleDragStart` and cleared by `endSession`; `resyncBoard`'s report; the armed stop's effect, for either drag)                                                                          | D9                                     |
| `useForcedStop.ts::report` (no flash for a stop with no item) and `DragTuningPanel.tsx`'s armed-stop comment                                                                                                                                             | D9                                     |
| The probe's test (`useItemManagement.test.ts`, "filing a parent out of Unknown status"), and the fix it called for: `itemWriteReconciliation.ts::withWorkphaseCascaded`, run by `completeItemWrite`, with its tests in `itemWriteReconciliation.test.ts` | D11                                    |
| `drag-7-hierarchy-modal.spec.ts`'s Sheet tests (DRAG-7.28, 7.32, 7.33), and `project-tree-expansion.spec.ts` (TREE-11's hidden rows)                                                                                                                     | Inbound deferrals, What it starts from |
| `tests/helpers/boardLocators.ts::dragRegion`, `dragGesture.ts::tabBy` and the quarter helpers                                                                                                                                                            | D4                                     |
| The request harness beside `tests/helpers/holdRequests.ts`, and the forced-stop cause helper                                                                                                                                                             | D4                                     |
| `drag-column-bands.spec.ts`, its helpers module, and the specs split from it                                                                                                                                                                             | D4                                     |
| `tests/ui/*.spec.ts`, by batch                                                                                                                                                                                                                           | D3, D5                                 |
| The client's unread `data-*` attributes                                                                                                                                                                                                                  | D8                                     |

## Amendments

- **Stop 5 complete (Test Planner, from the confirming Reconciler).** Batch 4b closes all 26 scoped cases, four Extend / twenty New / two Rework, with accepted D2/full-suite/gate evidence and clean global checks. Eligible clock complements and associated DRAG-3.3 pointer maintenance need no new approval. Catalog totals become 378 Automated / 93 Open / 10 Manual / one Planned / two Pending PO; 91 active story assignments remain. DRAG-3.12 stays separate and nonblocking. Return the close-out for review/commit, without starting 4c or another discovery cycle.

- **Stop 5 authorized (Nathan).** Confirm the accepted 26-case batch against the fixed snapshot and completed Stop 4 validation, apply eligible catalog fields and write the final report. Keep DRAG-3.12 separately recorded and nonblocking. Return the close-out for review without a commit, new Coder task or next-batch work.

- **Stop 4 completion — recovered without reruns (Test Planner, from the Automator).** All 70 scoped variants meet twenty repeats with 1,400 passes and no failures/retries/skips; final E2E is 394/21/0 and root gate passes. The original background run completed during a usage-limit delivery interruption. Recovery verifies its ledger and unchanged app/test/configuration hashes without rerunning any command. Return at Stop 4 before confirming reconciliation; all 26 cases remain Open and DRAG-3.12 stays nonblocking outside scope.

- **2026-11-09 — Stop 4 authorized; DRAG-3.12 left separate (Nathan).** Proceed with 4b's accepted 26-case/70-variant scope. The same Automator freezes the app/tests/configuration and exact selection, runs the twenty-repeat requirement, then final full E2E/root gate. Conditional DRAG-3.12 is recorded outside the batch and is not a prerequisite. No further discovery/reconciliation cycle or source repair is authorized during frozen validation; return at Stop 4 before Stop 5.

- **2026-11-09 — Null-position return review (Test Planner, from Nathan, the Automator and Reconciler).** All supplied file hashes match. Recovered Coder results are 394 passed / 21 skipped / zero failed, including all 71 maintained batch/control variants; no rerun in this review. The DRAG-3.3 handoff is delivered, and DRAG-6.10 pointers retain their meaning. The extra workphase field is valid for locked-Column append; an existing conditional Board-own-region/null/peers DRAG-3.12 no-write gap is handed off separately with physical reachability unproved. No implementation/catalog edit, new ID, matrix expansion, D2 or final closure.

- **2026-11-09 — Append-slot return and bounded checkpoint (Test Planner, from Nathan, the Automator and Reconciler).** The six-file return passes unchanged merged/expanded middle representatives. A single test-only aim correction gives expanded held-middle one pass with its original request/save assertions; the post-edit gate passes. The return review confirms the wider bare-container behavior and existing DRAG-6.12 proof, and routes the existing DRAG-3.3 null-position request gap separately. The batch plan records frozen inputs, all four focused attempts and pending complete affected-file/D2/final validation. No new case/ID, application/Vitest edit or matrix expansion.

- **2026-11-09 — Post-Coder Stop 2 checkpoint (Test Planner, from the Automator and Reconciler).** Finished the 70-variant authoring scope and applied the three proposing proof corrections. A Board-middle Stub detach sends `B/after` despite the cursor being between the visible dividers; DRAG-5.3 requires no anchor/side. Preserved three failures plus a geometry replay, with correct saved fallback placement and no application/Vitest edits. The batch plan records the separate Coder packet, pending focused checks, source fingerprints and historical evidence limits. No coverage status changes or D2/final run.

- **2026-11-09 — Coder return accepted; unfinished Stop 2 resumed (Nathan).** The named-selection fix and DRAG-4.20/4.22 clock work are delivered. Keep five sync support tests unstamped; the clock tests use the already-approved category. Nathan authorizes resumption, and the unchanged B13 replay passes before any test edit. The batch plan records the returned evidence, its source/concurrency limits and the remaining thirteen variants/proof corrections. No case is promoted and no D2 run begins.

- **2026-11-09 — New Stop 2 selection blocker (Test Planner, from the Automator).** A stationary P/before highlight through dwell/cue enters Origin instead of P, confirmed three times with zero writes. The partial 57-variant snapshot is frozen; 13 variants remain unauthored. Root gate passes; the proposing Reconciler checks proof without catalog edits. Batch Results/Open questions hold the concrete separate Coder handoff; no in-session app fix or D2 run.

- **2026-11-09 — Proposing review completed (Test Planner, from the Reconciler).** The [report](../../audits/test-reconciliation-story-10-batch-4b-proposing.md) independently confirms the selection defect, reviews all 26 cases and finds clean global identity checks. Three concrete test-proof corrections and the existing clock-test work are carried into the next authoring handoff. All cases remain Open; no source/catalog change or validation advancement is implied by the review.

- **2026-11-08 — Retirement cleanup accepted; Stop 2 continues (Nathan).** The Coder removed DRAG-4.35's ID stamp from the internal regression and Nathan authorized continuation. The Automator verifies that title-only change, no retired-ID carrier and green retained Playwright pilots. Resume the reduced 26-case/70-variant matrix within the existing boundaries; no app repair or D2 sweep is authorized here.

- **2026-11-08 — DRAG-4.35 deferred and retired (Nathan, after working through the defect with the PO).** Superseded the immediate repair handoff. The Planner removes the case and active assignment; the relevant test writers remove its automation. Both highlight defects are routed to the Descendants highlight-cue story. B09's DRAG-4.30 functional coverage stays. The batch Results track the internal-test cleanup boundary and green retained Playwright pilots; this does not resume broad authoring or D2.

- **2026-11-08 — Batch 4b Stop 2 early checkpoint (Test Planner, from the Automator).** Authored five expressions / six variants and executed five unique representative variants before stopping expansion. Preserved DRAG-4.35's request/highlight mismatch and a separate nested-line question for the PO, each reproduced three times; saved orders are correct in the observed fixtures. No app/helper/Vitest edit or catalog promotion. The root gate passes; D2/full E2E/reconciliation remain unrun. Results/Open questions in the batch plan hold the separate-session handoff and unfinished-authoring scope.

- **2026-11-08 — Batch 4b Stop 1 (Test Planner, with the Test Automator).** Completed the [proof/variant review](story-10-batch-4b-proof-plan.md) for the 27 assigned cases; forecast 78 scoped runnable variants plus one unchanged test in the file union. Clarified DRAG-4.22 and the legacy own-/cross-column case stamps; retained the separate Coder boundary for clock support. No tests, app changes or runtime execution. Stopped for Nathan before Stop 2; the resume packet is in the batch plan's Results.

- **2026-11-08 — Five-stop workflow approved (Nathan).** D5/D12 now point to the mandatory session stops in the batch plan: proof/variant review, tests/discovery, separate Coder/review when needed, frozen validation and reconciliation/closure. Each stop provides a resume handoff and returns to Nathan before the next stage. D2, case assignments and batch order are unchanged.

- **2026-11-08 — Post-4a workflow direction (Nathan).** Superseded D7's in-batch small-fix execution and D12's side-by-side Coder workflow for the remaining automation batches. Every Coder task now requires a separate handoff/session and check-in, including internal tests, hooks and title stamps; the Planner may still delegate to the Automator and Reconciler. Added the workload retrospective and proposed horizontal stops. D2 and the remaining batch assignments are unchanged.

- **2026-11-06 — D13 into the living docs at the close (Architect, at Nathan's direction).** D13 lives only in this plan, so Phase 5 now writes it into the testing-strategy guide (Architect, for Nathan's approval) and the catalog README (Planner). D12's table and the Living-docs handoff say so.
- **2026-11-06 — Phase 2 step 4, Nathan's approvals (Architect).**
  - Every internal mapping the baseline proposed is declined, for a fresh look at whether a surface test can cover it. Where one still can't, an internal test is proposed again, case by case.
  - ATT-1.10 is routed to the Tags & Type System epic, and `epic-5-decisions.md` now names it.
  - The roadmap entry's items stay as written.
  - Step 5, the Planner's D13 rewording, is next.
- **2026-11-06 — the inventory (Architect, with Nathan).** Phase 2 step 3, from the baseline report:
  - **[Story 10's second part](story-10-batches.md) is new.** It holds the inventory, the batches, the skips' fates, the checkpoint and each batch's results. The decisions and Phases 1–3 and 5 stay here.
  - **D13 is new (Nathan):** a case's look is checked by hand, in a shared `Manual` case, and the rest of the case is automated through the attributes the client sets.
  - **D4:** the request harness (#18) and a forced-stop cause helper join Phase 3. A helper found later is written in the batch that finds it.
  - **The batches:**
    - DRAG-6 leaves 4a for 4d, after the Stub and modal batches whose setups its flash cases need. That also leaves 4a smaller before the checkpoint.
    - DRAG-8, DRAG-2, TREE and the legacy six each move down a letter, to 4e–4h. 4c is still DRAG-7.
    - D9's surface spec goes with DRAG-6, to 4d.
  - **D2 and D5:** the bar is revisited at the checkpoint after 4a.
  - **D10:** ATT-1.10 goes to the Tags & Type System epic, once Nathan agrees to a line in its decisions doc.
  - **Phase 2:** step 3 is done. Step 4 is the approvals, and step 5, D13's rewording, is new.
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

- **2026-11-06 — Phase 1's marker cleared (PO).** Read against `3952dfe`: `useBoardDnd.ts::resyncBoard` reports a live column drag (`columnDragRef`) with its cause and a null `itemId`, and `useForcedStop.ts::report` sets no flash for it. The banner reads only the cause. So board-drag-interaction §10's Planned paragraph is replaced by a bullet in the cue's list. My deduction, for Nathan to overrule: the wiki says nothing of the armed stop or `STOP_WORDING`'s sharing, since the panel is temporary and the wording is already stated by cause. DRAG-6.22's column clause and DRAG-6.26's status are the Planner's. The Planned marker at item-attachment §12 (tags) is unrelated and stays.

- **2026-11-06 — Phase 2 step 1 (Test Planner).** Completed the five-feature end-of-epic catalog pass, with the shared rules, and recorded its results under Phase 2. Added BCU-5.6, BCU-5.7, TREE-4.15 and Pending PO TREE-2.14; clarified the cases listed in Scope; applied Phase 1's live column-banner rule after the PO cleared its marker. No cases moved or retired. The README's Automator handoff is applied. The baseline Reconciler run and the Architect's inventory have not run as part of this pass.

- **2026-11-06 — TREE-2.14 ruled (PO, at Nathan's choice).** A row first drawn after pickup, such as the one an earlier create's answer adds, has no tier: it's drawn at full strength until the drag ends, and the next pickup tiers it. Every pickup tier stays fixed. Nathan chose this over tiering the row by the table, as recommended. It matches the build: `ProjectSidebar.tsx` reads `drag.tiers.get(item.id) ?? null`, and the map is built once at pickup (`useProjectDragReorder.ts::drawnAtPickup`), so no code change is needed. The rule is on the shared page, hierarchy-placement §7, with a pointer from project-tree §1. My deduction, for Nathan to overrule: the board follows the same rule, since its tier lookup (`DragSessionContext.ts`) also returns none for an id missing from the pickup's classification, so the shared page states it for both surfaces. The Planner can resolve TREE-2.14 against it: Mid is wrong for `Y`, and the case asserts `Y` untiered. No Rule field is needed beyond wiki project-tree §1 and hierarchy-placement §7.

- **2026-11-06 — TREE-2.14 folded in (Test Planner).** Resolved the case from Pending PO to Open against wiki project-tree §1 and hierarchy-placement §7. The case asserts the new row's untiered full strength through the current drag, unchanged existing Full/Mid/Low tiers, and Mid on the next pickup. Its ID is unchanged. Phase 2 step 2 includes it with the other additions and revised cases.

- **2026-11-06 — Phase 2 step 2 (Test Planner, from the Reconciler).** Recorded the completed baseline report and its exact scope, totals, five promotions, four reopenings, pointer repair and inventory handoff above. Whole-catalog ID checks are clean; the 24 skips and all residual clauses remain explicit inventory inputs. No new approval, case wording change, test edit or runtime validation is implied by the baseline. Phase 2 step 3 is next.

- **2026-11-06 — Phase 2 step 5 (Test Planner).** Applied D13 to the 26 listed cases, retained all existing IDs and added DRAG-2.24, DRAG-6.30 and DRAG-6.31 as Manual. Reused DRAG-1.27 and TREE-2.8 for the other shared looks. Kept functional and geometry obligations in the automated cases and updated three supporting paint references, both catalog indexes and the batch handoff. The batch total is now 152 Open assignments, with no new coverage claim. Stopped before Phase 3.

- **2026-11-06 — Phase 3 (Test Planner, from the Automator, Coder and Reconciler).** D4's helpers and spec split are complete. Nathan authorized the small DRAG-6.25 lifecycle fix exposed by the genuine-cause exercise; the fix and permanent regressions are applied. Four stale TREE-2.8 internal title claims are cleaned up, and four DRAG-6 Automation paths are repaired without changing coverage. The approved repeat bar, post-fix diagnostic, final E2E and root gate pass. Closed both Coder handoffs and stopped for review/commit before batch 4a.

- **2026-11-08 — Batch 4a (Test Planner, from the Automator, Coder and Reconciler).** Closed all 34 cases through surface evidence, with six Coder handoffs resolved. Recorded DRAG-1.16's wiki-grounded clarification, 1,780 accepted repeat passes with the failed attempt/overlaps disclosed, final E2E 329 passed/24 existing skips and the green root gate. The inventory now retains 118 Open story assignments. Stopped at the checkpoint for Nathan; no 4b work or commit.

- **2026-11-09 — Testing Roles Refactor, batch 4 (Test Planner).** With 4b committed in `857720b9`, applied the new roles to D1, D5–D7, D12, Phase 5 and the five stops in the batch doc. The QA Engineer owns automation and spawns the desk, Test Reviewer and one cold Reconciler per scope; the Planner owns case decisions and spawns none. One session per stop uses Nathan's file list, tree IDs, one current Results packet, an append-only Review log and background JSON ledgers. One separate Coder session carries each stop's hooks/routes, with Nathan's return check-in; a behavior change still gets its own handoff. Existing Vitest work is shared as Nathan assigns, and a new QA-authored Vitest test requires a held-off case, reviewer verdict and Nathan's approval. The catalog README pass is applied without changing any case/status/assignment. The catalog report and runner remain prerequisites for 4c. The runner's proposed D2 carry-forward is not adopted without Nathan's approval; earlier certification is not rerun here. This supersedes the post-4a workflow direction for future work and leaves historical results intact.

- **2026-11-09 — D2 on the parallel runner (Architect, Nathan's approval).** Nathan approved the runner plan's decision 8: 4a and 4b's one-worker repeat evidence stands, and from 4c on D2's repeats and each batch's final full run use the adopted worker count. Recorded in D2 and in the batches doc's execution boundary and Stop 4. D2 stays this story's bar only.

- **2026-11-10 — Three-worker adoption with bounded failures (Nathan).** Accept the parallel-runner trial's recorded flaky failures to reduce suite runtime during Story 10. DRAG-7.10 stays active and is fixed in 4c. Both DRAG-3.16 variants are temporarily skipped and restored in 4h alongside the six legacy skips. The [runner report](../tech-debt-stories/e2e-parallel-workers.md) holds all failures and comparisons; the batch plan holds the destinations. D2's bar and 4a/4b's prior evidence stand, and future repeats/final runs use three workers.

- **2026-11-10 — Five-worker default after the extended trial (Nathan).** Five replaces three for future D2 repeats and batch-final full runs. The full-suite median is 3m 25.1s, 38.2s faster than four, with no newly observed failing test identity or mode. Six is dropped for its small additional saving. Re-evaluate with the smoke suite, when full E2E runs should occupy less of each story and capacity for simultaneous work may matter more; revisit sooner if failures or contention change. The known-failure deferrals and D2's bar remain in force.

- **2026-11-11 — D2's repeats drop to ten (Nathan).** From 4c's Stop 4 on, an added or changed drag test passes ten repeats, not twenty, at the adopted five workers. The batch-final full run and the order of remedies are unchanged, and 4a and 4b's twenty-repeat evidence stands. The reason is in D2, from the [flake investigation](../../audits/story-10-drag-flake-investigation.md). Recorded in D2, in the batches doc's execution boundary and Stop 4, and in the 4c proof plan's decision 3 (61 variants, 610 passes). The batches doc's Results carries a note for the paused 4c session.

- **2026-11-12 — Batch 4i added (Nathan).** DRAG-3.16 moves from 4h to a new batch 4i, and DRAG-5.3 and DRAG-7.18 join it. Their tests are skipped: DRAG-5.3's eight B18 variants after the locked-after-A variant failed once in each form at five workers during 4c's Stop 4, and DRAG-7.18's two for their cost, about 24 s a pair, which Nathan wants kept as a cost and benefit study. A skipped test never counts, so the three cases' statuses and Automation lines are the Reconciler's to reflect. No decision changes: D2's bar and the order of remedies stand, and 4i applies them. The batches doc's 4i has the detail.

- **2026-11-12 — Failing tests in a batch (Nathan).** DRAG-5.10's B21 test joins 4i, skipped after one failure at five workers. D2 gains a rule for the rest of the story: a flaky test that predates the batch is skipped and moved to 4i, and a batch's own failing test gets up to two fix attempts when the failure is false, then a report instead of more attempts. The bar, the order of remedies for a test the attempts don't settle, and the five stops stand. The batches doc's stops point at it.

- **2026-11-12 — Batch 4j added (Nathan).** The Reconciler's report on 4c found a weak test (the hold-opened Stub distance variants of DRAG-7.10 and DRAG-1.14 don't show their rest point lies in P's box) and three candidate new cases. All four are deferred to a new batch 4j, after 4i. 4c closes without them. No decision changes. The batches doc's 4j has the detail.

## Open questions

- **Separately recorded, nonblocking for 4b (Nathan): existing conditional DRAG-3.12 Board no-write guard.** The foreign-middle DRAG-3.3 handoff is delivered. The null-return review finds an existing conditional path that writes for a Free null-position item released in its own region's middle at Board layer with peers, where DRAG-3.12 requires no request. Real-board reachability is unproved; the batch plan retains the precise regression/guard handoff for Nathan to route later, preserving valid locked-Column append. It adds no case or 4b assignment and does not hold up frozen validation. Any later implementation still requires a separate Coder session and Nathan's check-in.

- **For a separate Architect review, with PO input if needed: 4a's production changes.** Review the retrospective's seven-file manifest and paired evidence against the wiki, especially DRAG-1.5's saved/visible placement and the DRAG-1.16/DRAG-3.19 interpretations. The completed Reconciler run establishes scoped test coverage, not whole-application conformance. The Planner has not read the source or started a separate implementation-review session; the retrospective uses existing reports and metadata.

- **For the PO, not blocking: the sidebar drag before the project cap is read.** The baseline report's Candidate New Cases notes it. `useProjectDragReorder.test.ts`'s "marks nothing invalid while the cap is unknown" pins permissive behaviour, which neither wiki project-tree §3 nor hierarchy-placement §6 settles. No case exists for it, so D10 doesn't hold this story up for it.
- **For Nathan and the Architect, separately: the epic-wide audit's scope** (Nathan, 2026-11-06). It doesn't hold up this story before Phase 5. Nathan's starting points:
  - **Choose the files, don't take the range.** audit-workflow §10's range, from the previous `epic-N-complete` tag, would take in nearly the whole repo, since the mid-epic refactors touched nearly everything. So it's scoped to the most important files, chosen the way the close-out audit chose its own.
  - **Weigh the cost against what it would find.** This story is mostly test files. So much of an epic-wide audit right after it would re-read code the close-out audit read in full, little changed since.

  This story's own audit (Phase 5) is part of the same question: what it reads, and whether the epic-wide audit takes it in.

## Living-docs handoff

- **Catalog owner — temporary DRAG-3.16 proof gap:** both parameterized Playwright tests are skipped under Nathan's runner-adoption decision. Reconcile the existing Automated status/pointer with that temporary gap, and restore whole-Then certification when 4i fixes/re-enables them. The QA Engineer records the handoff without editing catalog fields. This does not convert the case to Manual or revise the frozen 4a evidence.

- **Test retirement (Nathan), applied:** DRAG-4.35 and its dedicated B14 Playwright test are deleted, keeping Next ID DRAG-4.36 and reusing no ID. The Coder removed the retired ID stamp from the existing internal projection regression; Nathan accepted that return, and the generic regression body remains unchanged. The Automator also removed B09's disputed line-place guard; DRAG-4.30's other assertions remain. No active automation claims the retired case. Future fresh cases belong to the deferred highlight-cue story; no wiki change is made in this retirement.

- **Workflow wording, applied by the Testing Roles Refactor:** D7/D12 and the five stops now follow the new roles, the desk/reviewer flow, tree IDs, one current Results packet and one cold reconciliation per scope. The refactor's Architect-owned instructions are already rewritten; this amendment applies them to the remaining batches. The parallel runner's adopted five-worker count and the bounded failure deferrals are recorded in D2; no further default-count approval remains pending.

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:** board-drag-interaction §10, "a column drag the board stops shows the banner too" (Phase 1).
- **Passages superseded:**
- **Implementation passages to place:**
- **Test-plan cases affected:** DRAG-6.22, whose column, no-cue clause the Planner removes, and DRAG-6.26, which becomes Open (Phase 1).
  - **Planner applied in Phase 2 step 1:** the column clause is removed, DRAG-6.26 is Open, and DRAG-6.25 points to its banner and no-flash rule.
- **D13's Split cases and their shared `Manual` cases, for the Planner** (Phase 2 step 5): the 26 cases listed in [Story 10's second part](story-10-batches.md), "The shared looks".
  - **Planner applied:** 24 existing IDs retain their automatable clauses. DRAG-1.27 and TREE-2.8 are reused as shared Manual cases; DRAG-2.24, DRAG-6.30 and DRAG-6.31 are added as Manual. The shared-look table records every source ID and its destination. No ID is retired or moved, and the 152 Open batch assignments exclude the two reused Manual IDs.
- **D13 as a catalog convention, for the Planner** (Phase 5). The rule goes in `docs/test-plans/README.md`, "Which tests count, and what's manual":
  - a case's look is checked by hand, in a shared `Manual` case, one per look;
  - the rest of the case is automated;
  - only how something is painted goes manual, never what's saved, which row is affected, which tier, form or state a row has, or where it's drawn and how big.
- **Weighing a surface test, for the Planner** (Nathan, 2026-11-11; not applied). The testing-strategy guide now says when a surface test costs more than it proves, and what the options are. `docs/test-plans/README.md` needs two things to match:
  - **A pointer,** where "Statuses" says a surface test is preferred for closing a partial gap: the guide's "When a surface test costs more than it proves" is the exception's home.
  - **A third approved category of internal test, if Nathan rules for it:** the variants of a rule that one surface test already reaches. Proposed wording, for "Which tests count, and what's manual": _A third approved category: the variants of a rule a surface test already reaches. One surface test shows that the gesture reaches the rule and makes the right write. The variants that change the outcome and not the gesture, such as the origin, the place or the form, are tested in the pure module that decides them, each from the case's Then. The case is `Automated` when the surface test and those tests together assert all of it._
  - Until that category exists, an internal test for a variant takes the README's existing route: the case is held off, the Test Reviewer weighs it, and Nathan approves it one case at a time.
- **A case for D11's fix, for the Planner to write** (Phase 1). The probe failed: filing a parent out of Unknown status left the Unsorted bucket's "needs attention" badge up until a reload, since the client moved only the written row, where the server also moves its attached descendants. Wiki boards-columns-unsorted §10 already states the rule (`needsAttention` counts an Attached item whose own workphase is unknown). The case: _given_ a parent and its Attached descendants in Unknown status, _when_ the parent is filed into a workflow workphase and the write's answer lands, _then_ the badge goes without a reload. The Coder's tests carry no ID yet and take the Planner's: `useItemManagement.test.ts` ("filing a parent out of Unknown status") and `itemWriteReconciliation.test.ts` ("the workphase cascade").
  - **Planner applied in Phase 2 step 1:** BCU-5.6 is the case for the fix; BCU-5.7 holds the detached-descendant boundary. Both are Open. The baseline Reconciler assesses the candidate tests above and names which need the ID or more assertions; no mapping is presumed here.
- **Wiki sections added, changed, moved or removed** (PO, at close): board-drag-interaction §10 (Phase 1). The Planned passage is gone, its marker with it. A column drag the board stops now sits in the cue's own list: the banner is the same, and a bullet says it flashes nothing. The cue's opening line says the three resyncs show it on an item's drag or a column's. Nothing else on the page changed. Phase 2 step 1: hierarchy-placement §7 gains a sentence in its "One tier for the whole drag" bullet (an entry first drawn after pickup has no tier), and project-tree §1's mid-drag paragraph points to it (TREE-2.14).

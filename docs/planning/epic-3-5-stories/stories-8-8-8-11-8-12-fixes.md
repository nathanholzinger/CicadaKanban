# Epic 3.5 — The fixes from the audit and reconciliation of Stories 8.8, 8.11 and 8.12

**Type:** story · **Written:** 2026-11-05 by the Architect, from the audit and reconciliation of Stories 8.8, 8.11 and 8.12 · **Status:** planning. Nathan's four calls (Open questions) come before Batch 7

## Goal

Land what the two close-out reports for Stories 8.8, 8.11 and 8.12 leave for the Coder, so the audit can close before Story 8.13 starts:
- **The code quality audit:** `docs/audits/code-quality-audit-stories-8-8-8-11-8-12.md`. Its Fix Now is #1–#11.
- **The test reconciliation:** `docs/audits/test-reconciliation-stories-8-8-8-11-8-12.md`. Its Proposed Stamps, its Proposed Internal Mappings (Nathan's to approve), and the Gaps it leaves with Stories 8.8, 8.11 and 8.12, which are closed, so they come here.

It has no 8.N number. Story 8.13 stays the last 8.N story (Nathan, 2026-11-04). This is step 1's "findings fixed" in the roadmap's order (Story 8, "How each story closes").

**What this story includes:**
- **Every Fix Now finding,** #1–#11.
- **The one optional finding,** Watch List #13: App's project collection moves into a hook. It's marked "can ride along with #1/#2", and its batch can be dropped without changing any other.
- **One ride-along of the planner's own:** `PUT /items/:id`'s `agentId` takes #4's check if a probe shows it's a 500 too (Batch 4).
- **The reconciliation's stamps,** the standing-category ones and the ones Nathan approves.
- **The reconciliation's test work that needs no drag:**
  - the sidebar expansion cases, TREE-11.1–TREE-11.8, which it says are not deferred drag work;
  - the state the sidebar's branch, tier and pickup cases leave at hook level: TREE-1.14–TREE-1.16, TREE-2.4, TREE-2.5, TREE-2.6 and TREE-2.9;
  - one test fix, TREE-2.8's default test (Test Quality Concerns, 7).
- **The two questions** the audit's handoff leaves for the Test Reconciler and the Test Planner (Open questions).

**It isn't a code-first story.** It fixes defects, comments and tests, so the usual order holds: build, gate, review. No hands-on is needed. No drag spec changes: a new drag gesture is Story 10's (its D3, D4).

**Out of scope:**
- **#12,** the skipped TREE-2.1 spec's obsolete title and reason. Story 10's plan accepts it (Inbound deferrals, "Audit follow-up — #12").
- **Every gesture and layout clause the reconciliation routes to Story 10's item 10,** among them:
  - the board's DRAG cases beyond their stamps (DRAG-1.33, DRAG-2.17, DRAG-2.18, DRAG-2.22, DRAG-3.19, DRAG-3.22, DRAG-3.25, DRAG-4.8, DRAG-7.15, DRAG-7.27, DRAG-8.1–DRAG-8.12);
  - the rendered ghost and top-edge line (TREE-1.1–TREE-1.12, TREE-2.13);
  - the measured layout (TREE-2.1, TREE-2.10, TREE-2.11);
  - the physical shuffle (TREE-1.19);
  - TREE-4.9's reload, which needs its own fixture's drag;
  - the delayed-answer drags (TREE-2.2, TREE-2.3, TREE-4.7).
- **The reconciliation's lesser test notes** (Test Quality Concerns 2, 4–6, 9–11). Read them when touching those files.
- **The probe for the inconclusive Unknown-status drag.** It isn't evidence for #3, and #3's fix doesn't touch the drag.

## Scope

- **Wiki passages:** none Planned. The fixes bring the code to rules already in force:
  - #1, #2: wiki project-tree §4, with wiki positioning §8;
  - #3: wiki boards-columns-unsorted §3 and §10;
  - #4: wiki row-references §1, with wiki item-attachment §14.

  The audit asks for no PO ruling.
- **Test-plan cases:**
  - **Expected to close at the confirming run, if Nathan approves their App mappings (call 1):** TREE-4.8 (with its existing surface test), TREE-4.10 and TREE-4.12.
  - **Expected to close if their new surface spec asserts every clause (Batch 8):** TREE-11.1–TREE-11.8.
  - **Stamped, and staying `Open`,** since each stamped test asserts only part of its case. Their remaining clauses are Story 10's:
    - DRAG-2.17, DRAG-2.18, DRAG-3.19, DRAG-3.22, DRAG-3.25, DRAG-4.8, DRAG-7.15, DRAG-7.27, DRAG-8.1–DRAG-8.10;
    - TREE-1.4, TREE-1.16, TREE-1.17, TREE-1.18, TREE-2.1, TREE-2.4, TREE-2.6–TREE-2.10, TREE-2.12, TREE-2.13, TREE-4.11.
  - **New tests at hook level,** whose cases stay `Open` for their gesture: TREE-1.14–TREE-1.16, TREE-2.4, TREE-2.5, TREE-2.6, TREE-2.9.
  - **New cases for #1–#4,** if the Planner derives any (Open questions).

## Inbound deferrals

- **From the code quality audit** (`docs/audits/code-quality-audit-stories-8-8-8-11-8-12.md`, 2026-11-04):
  - **Fix Now #1–#11:**
    - #1, an older project move can replace the latest saved one;
    - #2, a recovery read can undo a newer successful project write;
    - #3, Unknown-status cards keep the board load's snapshot;
    - #4, an item create looks up a malformed reference before checking its shape;
    - #5, the scope script folds JSX text as formatting;
    - #6–#11, comments, a test title, two test fixtures, and the wiki pointers for Story 8.8's built rules.
  - **Watch List #13,** as a ride-along (Batch 2).
- **From the audit's handoff** (`docs/planning/epic-3-5-stories/stories-8-8-8-11-8-12-audit-follow-ups.md`): its order of work is this plan's batch order, and its two questions are in Open questions. This plan replaces it.
- **From the test reconciliation** (`docs/audits/test-reconciliation-stories-8-8-8-11-8-12.md`, 2026-11-04):
  - **Proposed Stamps,** every row: Batch 7.
  - **Proposed Internal Mappings,** every row: Nathan's calls 1–3 (Open questions), then Batch 7.
  - **Gaps:**
    - "Story 8.11 expansion follow-up," TREE-11.1–TREE-11.8: Batch 8;
    - "Story 8.11 branch/line implementation follow-up," TREE-2.1, TREE-2.4, TREE-2.5, TREE-2.8–TREE-2.12: the stamps in Batch 7, and the deterministic tests for TREE-2.4, TREE-2.5 and TREE-2.9 in Batch 8;
    - "Story 8.12 implementation/stamp/approval follow-up," TREE-1.14–TREE-1.18, TREE-2.6, TREE-2.12, TREE-2.13, TREE-4.8–TREE-4.12: the stamps and approvals in Batch 7, and the response windows of TREE-1.14–TREE-1.16 and TREE-2.6 in Batch 8;
    - "Story 8.8 implementation/stamp follow-up," the DRAG cases: the stamps and approvals in Batch 7. Their remaining clauses are gesture or layout, so they go to Story 10;
    - "Story 10 item 10": named in the roadmap's Story 10 entry, item 10, now. The confirming run's table replaces it at this story's close.
  - **Test Quality Concerns, 7:** Batch 7.

## Approach and phases

### Decisions

**D1. A project's writes go to the server one at a time, in the order they're made** (#1).
- **The rule:** a move, or an edit, of a project that has an earlier write still unanswered waits to be sent until that answer lands, whether it succeeds or fails. It's still drawn at its release, as now (`pendingMoves`, the newest laid over last), so the sidebar shows the latest move at once.
- **Why it fixes #1:** the server saves the writes in the order they were made, and their answers land in that order. Each answer applies its row and its reindex pairs (`applyWriteResponse`) in the order the server saved them, and the last answer is the latest write. No answer is ever stale, so none is dropped, and no reindex disclosure needs its currency checked.
- **Why not generations,** which the audit offers too: a generation check assumes the server saves two writes in the order they were sent. Two requests in flight at once don't promise that. A queue makes the order the client's.
- **What it costs:** the second write's answer comes one round trip later. That happens only when the same project is written twice before the first answer.
- **What doesn't change:**
  - Different projects' writes still go out at once and settle independently (wiki project-tree §4; TREE-4.10's tests).
  - A failed write goes back at once, and its recovery read starts (D2). A write waiting behind it is then sent as made, since its relation names its own parent and neighbors.
- **Its scope:** a move (`handleReorderProject`) and an edit (`handleUpdateProject`), the two writes that answer with the project's own row. A create has no row before its answer, and a delete reads the tree again (D2).

**D2. A read of the whole tree is applied only when no write has landed since it started** (#2).
- **One function reads the tree after a write,** for both places that do: a failed move's recovery, and the refresh after a delete.
- **Its check:**
  - it notes a count of landed writes when it starts;
  - every project write's applied answer adds one to the count: a create, an edit, a move and a delete;
  - when the read lands and the count has moved, the snapshot is older than a write the sidebar already shows. It's dropped, and the tree is read again.
  - A read started later supersedes one still in flight.
- **Why not merge the snapshot with the writes:** that needs a version for each row, which the API doesn't have.
- **The first load** is untouched. No write can happen behind the loading screen.

**D3. App's project collection moves into a hook** (#13, optional).
- **What moves:** `projects`, `pendingMoves`, D1's queue and D2's count, the four write handlers, and the `sidebarProjects` overlay.
- **What stays in App:** selection, workflow inheritance, the create modal's state and the screen's composition.
- **No behavior changes.** App's tests run unchanged, as the gate.
- **Where:** beside `useCollapsedProjects` in `components/sidebar/`, or a better home the Coder finds. Its header says what it owns.

**D4. Unsorted's Unknown-status list and its "needs attention" read the board's live items** (#3).
- **The list:** a selector beside `getWorkphaseItemsFrom` in `itemListOps.ts`, through `selectBoardItems`, matching a workphase that's null or not one of the workflow's (`workphases`). It takes the placements and the project filter as the board's other lists do, and leaves Stubs out as they do. `useItemManagement` exposes it, as it does `getWorkphaseItems`.
- **The flag:** "needs attention" is true when a workphase is uncovered, or any live item's workphase is null or not the workflow's: Attached items and other projects' items included. That's what the API's `needsAttention` counts (§10), over the live items rather than the board load.
- **What stays the board load's:** `unsorted.uncovered`. It changes only by a workphase or a column write, and those reload the board.
- **So:** an edit, a delete and a reassignment show at once, with no reload. An item a pending move takes to a column leaves Unsorted at its release, as a column's items do.
- **Unchanged:** the bucket's look, and the badge over an empty bucket, which is still an Open question (boards-columns-unsorted, "The Unsorted bucket and its badges").

**D5. An item create checks a reference's shape before it looks the reference up** (#4).
- **At the route:** `parentId`, `projectId`, `type` and `agentId` each take `getOrNotFound.ts::referenceShapeError`, with `nullable` and `optional`, before any lookup.
- **In `itemHierarchy.ts::resolveCreate`:** `workphaseId` takes it, as `validateHierarchyRequest` does, so a create and an update still agree.
- **Every message and every omitted, null or inherited meaning stays as it is.** The only change is to a reference that isn't a string: a 400 where it was a 500.

**D6. JSX text compares by the text JSX makes of it** (#5).
- **What JSX does with its text:** within a line, every space is kept. A line break with its indentation is dropped or made one space. So `<pre>a b</pre>` to `<pre>a  b</pre>` changes what's rendered, and a reflow that only moves text between lines doesn't.
- **The decision:** both comparisons read a TSX file's JSX text as that rendered string: the code normalization (`lineKinds.mts::valueSpans`, `strippedCode`) and the formatting check for removal sites (`diff.mts::writtenAlike`, `codeTokens`).
- **Why not compare it exactly:** then every reflow Prettier makes to a TSX file would read as substantive.
- **The how is the Coder's.** `codeTokens` scans in standard mode today, so it can't see JSX text. It likely needs a parse of the TSX file, as `valueSpans` has.

### Batches

Each batch ends with `npm run check`, plus `npm run test:e2e` where it touches behavior, and a stop for Nathan's review and commit. The order is the audit's: correctness first, then the comments, then the stamps on the final titles, then the new tests. The reports' line numbers predate these batches, so find a test by its title.

**Batch 1: the project writes** (#1, #2)
- **#1, by D1;** **#2, by D2.** Both are in `App.tsx`.
- **Tests,** in `App.pendingMove.test.tsx`, with its held answers. Write them untagged; the Planner may give them IDs (Open questions).
  - **#1:** `R` moved under `P`, then under `Q` before `P`'s answer.
    - The second request isn't sent until `P`'s answer lands.
    - The sidebar draws `R` under `Q` from the second release on.
    - It ends with `R` under `Q`, as the server saved it.
    - Also run it with `P`'s move failing: `R` still ends under `Q`.
  - **#2:** `R`'s move fails, and its recovery read is held. `Q`'s move succeeds. Then the held read lands with the old tree.
    - The sidebar keeps `Q` where its answer put it.
    - A second read is made.
    - The same for a delete's refresh, with a move landing while it's held.
  - Both are the audit's probes, which failed before the fix. Show each failing first.
- **Size and risk:**
  - About 40 lines in `App.tsx`, and four or five tests.
  - The queue holds a write only when the same project has one unanswered.
  - The re-read happens only when a full read lands after a write.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 2: the project hook** (#13, by D3; optional)
- A move, plus the hook's header.
- **Size and risk:**
  - About 130 lines leave `App.tsx`.
  - No behavior changes, and App's tests are the gate.
  - `git diff --color-moved` shows what moved.
- **If Nathan drops it,** nothing else changes. The optional finding ends with the audit.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 3: Unknown status** (#3, by D4)
- **Files:**
  - `itemListOps.ts`, the selector;
  - `useItemManagement.ts`, which exposes it;
  - `UnsortedBucket.tsx`, which takes the list and the flag in place of `invalidItems` and `needsAttention`. Its own Stub and project filter goes, since the selector does both;
  - `BoardView.tsx`, which passes them.
- **Tests:**
  - **The selector,** in `itemListOps.test.ts`: a null workphase, a foreign one, a Stub left out, the project filter, and a pending placement into a column.
  - **The bucket,** in `UnsortedBucket.test.tsx`: the flag over the live items. ATT-9.3's test keeps its assertion.
  - **A surface spec** for the audit's browser probes: an Unknown-status item renamed, deleted and given a status through its Sheet. Each shows at once with no reload. The seed creates the item with no workphase (wiki item-attachment §14).
- **Size and risk:**
  - About 30 lines across the four files.
  - It changes what the bucket draws only after a write to one of its items.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 4: the item create's references** (#4, by D5)
- **Files:** `routes/items.ts`'s `POST /`, and `itemHierarchy.ts::resolveCreate`.
- **Tests,** in `server/tests/routes/items.test.ts`: one refusal test per field. Shape each as `workflows.test.ts`'s "returns 400, and creates nothing, when %s is not a string", and use its values (`true`, `7`, `{}`, an array holding a real id). Assert the 400 and that nothing was created.
- **Ride-along:** `PUT /items/:id`'s `agentId` is looked up with no shape check either.
  - Probe it with `{}` first.
  - If it's a 500, it takes the same check and test.
  - If not, say why in the batch's notes.
- **Size and risk:**
  - Five or six checks.
  - A request that was legal before is legal now, with the same response.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 5: the scope script** (#5, by D6)
- **Files:** `scripts/audit-scope/lineKinds.mts` and `diff.mts`.
- **Tests,** beside the string, regex and template cases:
  - `classify.test.mts`: `<pre>a b</pre>` to `<pre>a  b</pre>` reads `'all'`;
  - the diff's tests: that change yields a removal site;
  - JSX text that leads its line, and text across lines: a reflow reads as formatting, and a changed word reads as code.
- **Size and risk:** tooling only, with its own tests.
- **Gate:** `npm run check`, which runs the scripts' tests.

**Batch 6: comments, a title, fixtures and pointers** (#6–#11)
- **#6:** `lib/hierarchy.ts`'s comment on the pending move compares only what's shared with the board's `applyPlacements`: insertion beside an anchor that's there, and positions left as they are. Or it drops the claim. Neither fallback changes.
- **#7:** `hierarchyPlacement.test.ts`'s "excludes the given ids, and never walks into their children" is retitled for what it asserts: the excluded entries and their descendants are left out of the rows. Keep its `DRAG-4.8: ` prefix.
- **#8:** `dragChrome.tsx`'s comment on `useItemRow` drops "the one export that isn't a component or a constant", and keeps why the hook sits beside the indicator.
- **#9:** `itemListOps.test.ts`'s branch-count comment: "two further descendants", not three.
- **#10:** `useBoardDnd.test.ts`'s column-drop and Stub `over` fixtures use `columnData()` and `itemRowData(...)`. Keep the event-only sortable metadata, and the empty active data the lagging-registration tests rely on. Every expectation should hold unchanged. If one changes, stop and report it.
- **#11:** index pointers at the sites that enforce Story 8.8's built rules, one per rule:
  - the shared branch, count and line rules to wiki hierarchy-placement §8 (`itemListOps.ts`'s branch filter, `dragChrome.tsx`'s wording and its outside-the-box line);
  - the board's pickup snapshot and its filter to wiki board-drag-interaction §7.2 or §5a, whichever states it (`useBoardDnd.ts`'s pickup).

  Read each section before pointing at it.
- **Size and risk:** about seven files, comments and tests only. #10 changes test setup.
- **Gate:** `npm run check`.

**Batch 7: the reconciliation's stamps** (after Nathan's calls 1–3)
- **Use the reconciliation's own titles and tables,** on the titles as Batches 1–6 left them.
- **The standing category, needing no approval** (the catalog README's client ordering/request rule whose only surface is a drag):
  - DRAG-4.8 on `dragCollision.test.ts`'s two titles and `hierarchyPlacement.test.ts`'s DRAG-4.9/DRAG-4.10 worked-gap tests;
  - TREE-4.12 on `hierarchy.test.ts`'s three titles and `projectTreeUtils.test.ts`'s three (Proposed Stamps).
- **Nathan's approvals:** every other Proposed Stamps row, and each Proposed Internal Mappings row he approves. Leave out any row he declines.
- **The surface stamp:** TREE-11.2 on `project-sidebar.spec.ts`'s "collapses and expands subprojects via the chevron", for its one-level part. Batch 8's spec may supersede it.
- **TREE-2.8's default test** (Test Quality Concerns, 7): "are the defaults the panel starts at, when nothing is stored" asserts the panel's named defaults, not `tierVars`' output, so it can't pass by restating the code.
- **Size and risk:** titles in about 15 test files, and one test fix.
- **Gate:** `npm run check`.

**Batch 8: the tests the reconciliation asks for** (no drag)
- **TREE-11.1–TREE-11.8, a surface spec** (`tests/ui/project-tree-expansion.spec.ts`, or beside `project-sidebar.spec.ts`'s chevron test):
  - **A hold helper** in `tests/helpers/`: it holds a matching request's answer until the spec lets it go, or refuses it. The held request reaches the server at once, as `dragGesture.ts::delayMoveResponses`'s does. A refused one never does, so nothing is created.
  - **Each case's own *Given*,** both create entry points (the sidebar's Add subproject dialog, and the project page's subprojects list), the project page's parent dropdown, and the reload TREE-11.2 names.
  - **Check the unanswered state while the answer is held,** not after it.
  - **TREE-11.7's edit that names the parent `X` already has:** if the dropdown can't send it, say so in the handoff. The Reconciler judges the clause.
- **TREE-1.14–TREE-1.16 and TREE-2.6, at hook level** (`useProjectDragReorder.test.ts`): each case's own window, not a successful drag's answer.
  - a parent edit or a create that lands mid-drag: TREE-1.14, TREE-1.15, TREE-2.6;
  - a refused earlier move and the read after it: TREE-1.16.

  Assert the state each leaves: the branch and the height the cap reads held for the drag, the release's request, and the next pickup's branch and tiers. Their gesture stays Story 10's.
- **TREE-2.4, TREE-2.5 and TREE-2.9's tables,** at hook and component level:
  - TREE-2.4: the case's whole cap chain;
  - TREE-2.5: the root-derived Mid and Low tiers at both height boundaries;
  - TREE-2.9: every row of its table, the 2/5 with `A` collapsed and with `X` collapsed among them, and the line's wording in `SortableProjectRow.test.tsx`.
- **IDs:** a surface test takes its case's ID. A hook or component test takes one if Nathan's call 4 says so; otherwise it's left untagged, for the Reconciler to propose.
- **Size and risk:** one new spec and helper, and about ten unit tests. Tests only.
- **Gate:** `npm run check` and `npm run test:e2e`, and the new spec 20 times alone (Story 10's D2 bar) since it holds answers.

**Then: the confirming Reconciler run.** Nathan starts it once Batch 8 is committed.
- **Its scope:**
  - every case Batch 7 stamped or Batch 8 tested;
  - TREE-4.8, TREE-4.10 and TREE-4.12;
  - any cases the Planner derived for #1–#4;
  - the question for the Test Reconciler (Open questions).
- **Expected:**
  - TREE-4.8, TREE-4.10, TREE-4.12 and TREE-11.1–TREE-11.8 `Automated` if their tests assert every clause;
  - every other stamped case mapped, and still `Open`, with what it still misses in the run's table.

**Close** (the Architect):
- **The audit's Close-out table:** a row for each of #1–#11 and the route for #12, each checked against the code.
- **Story 10's item 10** names the confirming run's table for what each case still misses, in place of this reconciliation's Coverage Mapping.
- **The audit's end commit is tagged** `stories-8-8-8-11-8-12-audited`, on `524b9e7`. The next round's audit (the roadmap's step 3) starts there, so this story's commits fall in its range.
- **Archive:** the audit, the reconciliation, the confirming run and this plan go to `docs/archive/`, and the scope folder is deleted. The audit's handoff is deleted, since this plan replaces it.

## Code map

Filled in by the Coder.

| Symbol | Carries |
|---|---|
| `App.tsx::writeInTurn` | D1: a project's write is sent when its earlier one is answered, whether that succeeded or failed. A write with none out is sent at once, so a release still sends in the same tick. Kept in `writeTails`, a map of each project's last write still out |
| `App.tsx::refreshProjects` | D2: the one read of the whole tree after a write, for a failed move and for a delete. It is dropped and made again if `writesApplied` moved since it started, and dropped if a later read superseded it (`latestRead`) |
| `App.tsx::writesApplied` | D2's count: one for every applied project write answer: a create, an edit, a move and a delete |

## Amendments

**Amendment 1: Batch 1 built (Coder, 2026-11-05).** #1 and #2, in `App.tsx` only, by D1 and D2 as written.
- **D1's scope held:** a move and an edit go through `writeInTurn`. A create and a delete don't, as D1 says.
- **Tests,** in `App.pendingMove.test.tsx`, untagged (Open questions, for the Planner):
  - **#1:** the audit's order, `R` under `P` then under `Q` before `P`'s answer: the second request waits, `R` is drawn under `Q` from its release, and it ends there. The same with `P`'s move refused. Another project's move is still sent at once. An edit of `R` waits behind `R`'s move.
  - **#2:** a refused move's read held while another project's move lands, and the same for a delete's refresh: the older tree is dropped and a second read is made. A read that no write overtook is applied as before.
  - **Against the old `App.tsx`,** five of the seven fail: the second move sent early, the other project's move (its call count is the old code's), the edit sent early, and the two stale reads applied. The other two, the refused-first move and the plain read, pass either way, as they should: they pin what must not change.
- **The test file's mocks are reset between tests,** not only cleared. A held answer queued for a request that was never sent (the second move, behind the first) would otherwise reach the next test's.
- **The gate:** `npm run check` passes.

## Open questions

- **For Nathan, before Batch 7:** the reconciliation's Proposed Internal Mappings. Approval lets a named internal test count for the part of a case it asserts. It closes nothing that's still missing a clause.
  1. **The App mappings that close three cases:** `App.pendingMove.test.tsx`'s same-ID tests for TREE-4.8 (beside its surface test), TREE-4.10 and TREE-4.12. They render App with a stand-in sidebar and held answers, which is the only way to fix the answers' order. *Recommended: approve.*
  2. **The sidebar's partial hook and component mappings:** `useProjectDragReorder.test.ts` and `SortableProjectRow.test.tsx` for TREE-1.4, TREE-1.17, TREE-1.18, TREE-2.1, TREE-2.4, TREE-2.6–TREE-2.8, TREE-2.10, TREE-2.12, TREE-2.13 and TREE-4.11. Each stays `Open`. *Recommended: approve,* so Story 10's inventory starts from what's asserted.
  3. **The board's partial mappings:** the classification, chrome, list, hook, Card, modal, geometry and placement tests named for DRAG-2.17, DRAG-2.18, DRAG-3.19, DRAG-3.22, DRAG-3.25, DRAG-7.15, DRAG-7.27 and DRAG-8.1–DRAG-8.10. Each stays `Open`. *Recommended: approve,* for the same reason.
  4. **The hook and component tests Batch 8 writes** for TREE-1.14–TREE-1.16, TREE-2.4, TREE-2.5, TREE-2.6 and TREE-2.9: stamped with their case's ID as they're written, with the Reconciler judging what they assert. Otherwise they're left untagged, the confirming run proposes them, and a stamp batch follows. *Recommended: approve,* which saves that round.
- **For the Test Planner, before Batch 1** (the audit's handoff): do #1–#4 need cases of their own, derived from wiki project-tree §4, boards-columns-unsorted §10 and row-references §1? For example:
  - the same project moved twice before the first answer;
  - a recovery read landing after a newer write;
  - an Unknown-status item edited, deleted and reassigned;
  - an item create with a reference that isn't a string.

  If yes, the Coder titles the regressions with the new IDs. If they land after the batch, Batch 7 stamps them.
- **For the Test Reconciler, at the confirming run** (the audit's handoff): `tests/ui/project-tree-drag.spec.ts`'s no-write assertions read `watchWrites` right after the release helper returns. Does the release's settling prove each no-write case, or does a case need `projectTreeDrag.ts::settledWrites`? Answer it narrowly. Don't infer a runtime defect or add waits across the file.

## Living-docs handoff

Written by the Coder, before close.

- **Behavior decisions made while building, for the PO to rule on:**
- **Planned passages now built:** none.
- **Passages superseded:** none.
- **Implementation passages to place:**
- **Test-plan cases affected:**
- **Wiki sections added, changed, moved or removed** (PO, at close):

# Code Quality Audit — A6 re-run

**Range:** `a6-audited..b315a29`, 18 commits. The base is the tag on `f3fc213`, the commit that added the first run's report. It holds only docs, so it ends the same code range `7443721` would. The end is A6 batch 4f. Nathan tags the end commit `a6-rerun-audited`.

**What the range holds:** A6's corrections, audited straight after they landed so that what they introduced is fixed inside A6, not carried into Story 7's audit (Nathan, 2026-10-23). That's batch 3's eight code batches (3a–3h), which worked the first run's Fix Now; the Reconciler's two commits; and batch 4's six (4a–4f), which wrote the tests the Reconciler routed and the `agentId` fixes. Outside `docs/` and `.claude/`, that's 148 files.

**Re-tiered 2026-10-23,** under three rules Nathan set after reviewing the findings (the plan's Amendments): the audit flags a comment only when it's wrong or misleading about the code, not for breaking a convention; a structural finding that's a judgment call is optional; and an optional finding in a file a Fix Now changes keeps its tier, with a note that it can ride along. Numbers are kept, so the plan's references hold:
- #3 and #17–#19 moved to the Watch List, and #22 and #23 to Informational;
- #15 and #16 kept their clear parts, and the rest became #44 and #37;
- 16 convention-only items left the drift findings, and six wording items became Informational (#38–#43).

The report now holds 16 Fix Now, 4 routed, 6 on the Watch List and 2 Covered by. #12 was routed after the re-tier.

## How the range sorted

| Commits | Passes |
|---|---|
| 3a–3h, `23dd58e` (three test fixes), 4a–4f | All four |
| Root `CLAUDE.md` and `client/src/components/workflow/CLAUDE.md` | Drift |
| `d4f0709` (the Reconciler's run), and the docs in every other commit: the wiki, test plans, plans, guides, personas and agents | None |

No commit in the range is formatting-only or proven comment-only, so every code line went to all four lenses.

**How each pass knew what changed.** As in the first run, each pass got its files with line numbers at HEAD, from `git blame` over the range. Batch 3 moved and split a lot of code, so two lists were added:
- **Code that only moved between files** (`git blame -M -C -C`, bounded at the tag, so each line names the file it left during the range), listed apart with its source: 2,551 lines, mostly the server test splits (the first run's #39) and `dragStructure.ts` (#37). A correctness pass checked only that the move broke nothing; a drift pass, that its comments still hold in the new file; a duplication pass, that it moved rather than copied.
- **Lines removed with nothing added,** which blame can't see: 90 sites in 44 files, among them the first run's dropped keys (#14) and wrappers (#31). Each pass checked what was left around them.

The changed lines number 3,596.

**How the passes split.** The first run's seven groups (C1 the drag layer, C1t its tests and `client/src/test/`, C2 the rest of the client, S1 `server/src/` and root `CLAUDE.md`, S1t `server/tests/`, E2E `tests/`, T the checker, Bruno and configs), as 19 instances:
- **Correctness & Security** and **Consistency & Drift:** six each, with E2E and T together.
- **Duplication & Abstraction:** four: client source, client tests, server (source and tests), and E2E with T.
- **File Responsibility:** three: client, server, and E2E with T.

## How it ran

- **The passes ran cold.** Each got only its scope file.
- **The 19 instances ran five at a time,** across two usage limits. The ones a limit stopped were resumed with their progress intact.
- **Re-traced by hand** before going in the report: #1 against the code at the base (`git show a6-audited:…useBoardDnd.ts`), #2 against the checker's source, #3 with a read-only query of the dev database, and #4 and #5 against the fixtures and the client test config. The structural claims in #13–#16 and #20 were checked against the files.
- **What the merge step read:**
  - the previous audit, the first run (`docs/audits/code-quality-audit-a6.md`, not yet archived). Each finding its Close-out marks fixed was checked against the code, and a finding that comes back is a recurrence under its first-run number;
  - this story's plan, `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`: batches 3 and 4, their Open questions and Amendments, and the rulings made during them;
  - the destinations of the first run's routes: `epic-4-decisions.md` §12, `api-contract-zod-openapi.md`'s Inbound deferrals and C1, and Story 10's entry in `epic-3-5-roadmap.md`;
  - the wiki passages the correctness findings touch.

## Overall shape

**The first run's fixes hold.** Every finding its Close-out marks fixed is fixed in the code: the seven correctness fixes, and each structural fix's shared function, moved module, split file or fixture. The passes confirmed the moves and removals broke nothing, with one exception, #1.

**What the fixes left behind** is most of this report:
- one regression: #36's move of the column drop lost its drag-ending reload (#1);
- fixes that stopped one site short: #27 left the subtree walk inline twice (#13), #29's dropdown built a second copy of the sidebar's tree index (#14), #30 missed one pop-machine call (#20), and #41's split carried `boards.spec.ts`'s raw setup into two new specs (#21);
- splits whose files don't yet match their headers: #39's item test split left tests in the wrong files (#17), and two large test files were left whole (#18, #19), all three now on the Watch List;
- comments and titles the moves made wrong (#6–#11), in every group.

**The routes hold.** #43, #44 and #45 recur with new evidence, and their destinations still fit (#24–#26). #12 goes to the story that redefines `positionScope`.

Batch 6 could follow batch 3's order: correctness first (#1, #2, #4, #5), then each area's structural moves before its comment fixes, since #13, #16 and #21 rewrite lines that #9–#11 correct. The optional findings marked "can ride along" change files those batches already change.

---

## Fix Now — correctness

### 1. A failed column reorder reloads the board without ending a live item drag `[Correctness & Security]`
**Files:** `client/src/components/workflow/useColumnManagement.ts:56–70`; its `reload` is `BoardView.tsx:178`'s `loadBoard`; compare `useBoardDnd.ts::resyncBoard` (`:603–606`).

**Follows from the first run's #36.** At the base, the column drop sat in `useBoardDnd.ts` and caught a failed save with `resyncBoard()` (`a6-audited`'s `useBoardDnd.ts:687–690`), which ends a live drag session before reloading. #36 moved the drop into `useColumnManagement.ts::onColumnDrop`, whose `catch` calls `reload()` directly.

**Failure scenario:**
1. Drop column A on column B. The board reorders at once and `PATCH /columns/reorder` goes out.
2. Pick up a card while that request is in flight.
3. The server refuses it: say an MCP agent deleted a column, so `validateReorder` rejects an id.
4. `reload()` sets the board loading, which unmounts the `DndContext` without `onDragCancel`. `useBoardDnd`'s session stays live: the window `pointermove` listener keeps running the pop machine with no button held, the pop timer fires, and `usePendingGhostGuard` re-adds the ghost to the reloaded board.
5. The card is drawn at a phantom slot, following the bare cursor, until a later drag ends.

The window is one request's latency, so it's rare by hand, but it's a regression of behavior the code had.

**Fix:** route the failure through the hook. Either `onColumnDrop(activeId, overId, resync)`, with `handleDragEnd` passing `resyncBoard`, or have `useBoardDnd` end a live session whenever the board reloads, which also covers the column and workphase CRUD reloads. `useColumnManagement.test.ts` covers "reloads the board when the save fails", but not a failure that lands during an item drag; the hook-level case belongs with the fix.

**Wiki:** breaks an in-force rule, wiki board-drag-interaction §10 ("A failed drop resyncs the board from the server"; "A reload that lands mid-drag stops the drag"). That rule's text names the item writes' resyncs, which is why its wording goes to the PO (Routes).

### 2. `check:docs` reads `docs/wiki/README.md` as a wiki page, and skips a same-page anchor's section check `[Correctness & Security]`
**Files:** `scripts/check-docs/files.mts:62–67` (`WIKI_PAGE_PATH`, `wikiPageAt`); `scripts/check-docs/rules.mts:174–175` (`sectionRefs`).

`WIKI_PAGE_PATH`'s greedy `([^/]+)` captures `README.md` for the wiki's index, so `wikiPageAt('docs/wiki/README.md')` returns `"README.md"`, where its own comment says null. Separately, `resolveLink` returns null for a bare `#anchor`, and `sectionRefs` then treats the link as a non-wiki one and skips its `§N`.

**Failure scenarios:**
- A wiki page writes `[the wiki index](../README.md) §3`. The gate fails with `wiki-pointer: there is no wiki page "README.md"`, where the link should be skipped as non-wiki.
- A wiki page writes `[the cap](#99-gone) §99`, naming a section its own page doesn't have. It's never checked, and passes.

Nothing in the repo triggers either today.

**Fix:** make the page segment a folder name (`([^/.]+)`), and add `wikiPageAt('docs/wiki/README.md') === null` to `files.test.mts`. In `sectionRefs`, read a `#…` target as `context.wikiPage`. Add a same-page anchor case to `check.test.mts`.

**Wiki:** none (tooling).

### 4. TC-1.1's second board is built with a setup call that's refused, and the server's create fixtures don't check their status `[Correctness & Security]`
**Files:** `server/tests/routes/boards.test.ts:118–128`; `server/tests/fixtures.ts` (`createColumn` at `:35–46`, and the other `create*` helpers).

`boardTwo` is made by `createBoard` after `todo` exists, and `POST /api/boards` bootstraps a column per existing workphase, so it already has one covering `todo`. The next line, `createColumn(boardTwo.id, todo.id, todo.id)`, overlaps it and gets a 400. `createColumn` returns the error body without checking, so the test carries on. Its assertions still hold, since the bootstrapped column covers `todo`, but the comment at 118–121 describes a column that is never created.

**Fix:** drop line 128 and say why `boardOne` needs a column and `boardTwo` doesn't. Then have `fixtures.ts`'s `create*` helpers assert their status, as `tests/helpers/seed.ts`'s do since the first run's #40, so a refused setup step fails at its own line. `items.hierarchy.test.ts::createChain` works around the same hazard by hand.

**Wiki:** none (test setup).

### 5. A `console.error` spy is never restored, so the rest of its file runs with errors silenced `[Correctness & Security]`
**File:** `client/src/components/workflow/useColumnManagement.test.ts:43`.

"Reloads the board when the save fails" mocks `console.error` and never restores it, and neither the client's Vitest config nor `test-setup.ts` sets `restoreMocks`. The next test runs with errors swallowed, and so would any test added after it.

**Fix:** `log.mockRestore()` at the end of the test, as `dragRequest.test.ts:295` does.

**Wiki:** none (test hygiene).

---

## Fix Now — drift

Each item here is a comment, title or `CLAUDE.md` line that's wrong or misleading about the code. Convention-only items left the report at the re-tier.

### 6. Server comments that state what the code doesn't do `[Consistency & Drift]`
All under `server/src/`.
- `lib/workflowItems.ts:73–74`: "The cross-workflow and foreign-workphase checks compare a workphase's workflow against it." Only the foreign-workphase check does; `crossWorkflowError` compares two projects' workflows. Correct it, or drop the sentence.
- `routes/projects.ts:261`: the DELETE comment says the cascade runs "descendants → workflows → workphases → items". `lib/projectCascade.ts::deleteProjectById` deletes the project's own items before its workflows, deliberately. `routes/workflows.ts:224–228` describes `deleteWorkflowsById`'s cascade without its notifications. Cut each to one line naming the `lib/` function, which says the rest.
- `lib/positionResolver.ts:94–102`: `anchorRefusal`'s contract (its arguments, its return, the order of its checks) sits on `export type AnchorRefusal`, which it doesn't describe; the function has none. Move it.
- `db/runMigrations.ts:1–3, 116`: say items with no project move into the Default Project. The `UPDATE` runs only when a workflow has no project too. Narrow the comment, or move the `UPDATE` out of the `if` (#3, on the Watch List, rewrites that block if it's done).

### 7. Board drag-layer comments that the moves made wrong `[Consistency & Drift + File Responsibility]`
All under `client/src/components/`.
- `KanbanCard.tsx:158–160`: a sentence on reading `.pop` safely, though nothing there reads `.pop` now. Delete it.
- `workflow/dragRegions.ts:197–200`: says the gesture hook asks `descendantsCardIdOf`. Its callers are `dragCollision.ts::travelingRowsFor` and `descendantsProjection.ts::advanceProjection`. `:41`: names `clipToVisible` as if it were here; it moved to `dragStructure.ts::clipToVisible`.
- `workflow/CLAUDE.md:82–83`: "resolved once per drag" for `dragStructure.ts`. The hook re-resolves it after a layer change, and when a remount outdates it.
- `workflow/itemWriteReconciliation.ts:7–8`: says it reads `itemListOps.ts`'s sort; the sort is `lib/hierarchy.ts::byPositionThenCreatedAt`.
- `BoardColumn.tsx:178–182`: "shows only with no drag in progress". The gate is `!session`, which a column drag never sets; say "no item drag".
- `dragChrome.tsx:99–101`: "The one non-component export", in a file that exports four constants as well. Say "non-constant".

### 8. `ItemDetailPanel.tsx` names one caller of a handler that has two `[Consistency & Drift]`
`client/src/components/ItemDetailPanel.tsx:225`: "Called by AgentSection". `ParentSection`'s `onSelfUpdated` (`:350`) calls it too, and the new panel test goes through that path. Someone changing the handler for the agent section alone would break the parent picker.

### 9. Client test comments and titles `[Consistency & Drift + Correctness & Security]`
All under `client/src/`.
- `components/workflow/popSession.test.ts:43, 53`: titles name `THRESHOLD`, which nothing defines; the file's other titles say `popDelayMs`. Drop the `THRESHOLD` alias at `components/workflow/dragTuning.ts:14` with them.
- `test/itemFixture.ts:5–12`: says the scope "is never 'none', which the API gives an item in a terminal workphase". The API also gives `'none'` for no workphase and for a foreign one (`itemPositionScope.ts:29–31`). Name all three. What `makeItem` derives is #32's.
- `components/sidebar/projectTreeUtils.test.ts:97–98`: "imagine D were first and had descendants", where `soloItems` makes it so.
- `lib/hierarchy.test.ts:52–56`: says `getSubtreeHeight` feeds the board and the sidebar; neither calls it. #13 rewrites this.

### 10. Server test comments and titles `[Consistency & Drift]`
All under `server/tests/`.
- `lib/positionResolver.test.ts:345–349`: "Same resolver, a second table…" now sits above `describe('anchorRefusal')`; its subject is the projects-table describe at `:411`. Found by three passes.
- `fixtures.ts:180`: "The same for a project." now follows `setColumnEnds`, which was inserted above it. `:75–80`: says the tests that use `workflowWithPhases` build their own column ranges, which most don't, and that it's "the one place" relying on the board predating the workphases, which `columns.test.ts::setupFour` and BCU-1.4 do too. State the fact.
- `routes/items.positioning.test.ts:298–300`: points at a spec for `siblingOrder`, which lives in `tests/helpers/itemRepositioningScenario.ts`.
- `lib/itemTree.test.ts:107–109`: "read no cap", where ATT-4.6 depends on the cap being at least 2.
- `routes/boards.test.ts:24`: "creates exactly one board with 1:1 columns", for a test that asserts no columns.

### 11. E2E comments that point at the wrong thing `[Consistency & Drift]`
- `tests/helpers/dragGesture.ts:134–140`: `topQuarter`'s parenthetical says `resolveDropSide` reads a side "only for a row with no sortable position". `dragCollision.ts::dropAnchorFor` also falls back to it when the dragged item isn't in the hovered row's list, as its own comment says. Keep the helper's own assumption, and drop the claim.
- `tests/ui/drag-5-stub-detach.spec.ts:313` (and `:63–64`): points at "`dragTo`'s own header comment", a function this spec doesn't call and a comment that doesn't exist. State the assumption here.

---

## Fix Now — structural

### 13. The dragged subtree's ids and height are worked out inline twice, and `getSubtreeHeight` is called only by tests `[Duplication & Abstraction + Consistency & Drift]`
**Files:** `client/src/components/sidebar/useProjectDragReorder.ts:52–62`; `client/src/components/workflow/dragClassification.ts:64–69`; `client/src/lib/hierarchy.ts:125–132` (`getSubtreeHeight`), `:48–54`.

**Follows from the first run's #27,** which shared `isWithinDepthCap` but left both callers computing its height themselves: `getDescendantLevels`, then `new Set(levels.flat())`, `levels.length`, and the subtree with the active id added. That height is the rule `getSubtreeHeight` was written to hold (every descendant, attached or not, wiki item-attachment §8), and nothing in production calls it. A helper exists for the rule both depth-cap checks read, and neither calls it.

**Fix:** one `getSubtree(id, nodes): { descendantIds, subtreeIds, height }` in `lib/hierarchy.ts`, one walk, called by both. Delete `getSubtreeHeight` or build it on `getSubtree`, point its tests there, and correct `hierarchy.test.ts:52–56` (#9).

### 14. The project tree's parent-to-sorted-children index is built twice `[Duplication & Abstraction]`
**Files:** `client/src/components/sidebar/projectTreeUtils.ts:44–56` (`childrenByParent`); `client/src/lib/hierarchy.ts:171–179` (`buildParentOptions`' indented branch).

**Follows from the first run's #29,** whose fix routed the dropdown through `flattenHierarchyOf` with the shared comparator, by building its own grouped, sorted map: the steps the sidebar's `childrenByParent` already takes, for the same tree. The copies already differ on a `parentId` missing from the list (a root in the dropdown, hidden in the sidebar; the foreign key makes it unreachable). Root `CLAUDE.md`'s one tree math layer says not to duplicate the walk.

**Fix:** export one `sortedChildrenByParent` from `lib/hierarchy.ts` that keys a missing parent as a root. `buildParentOptions` calls it on the nodes left after its exclusion; `projectTreeUtils.ts` drops its copy. Use a name that doesn't clash with `hierarchy.ts`'s private, unsorted `childrenByParent`.

### 15. `PATCH /projects/:id/move` checks `parentId`'s type twice `[Duplication & Abstraction]`
`server/src/routes/projects.ts:208–211` checks it, then `parentError` checks it again at `:223` with the same message (`:39`). Delete the first. The other "must be a string or null" checks are #52's in the first run, Covered by the API contract epic.

### 16. Server test files copy helpers that exist `[Duplication & Abstraction + Consistency & Drift]`
All under `server/tests/`.
- **The item-route helpers** (`itemHierarchyFixtures.ts`: `getRow`, `move`, `put`, `countItems`, `setupWorkflow`) are copied or hand-rolled in their sibling files: a verbatim `move` at `routes/items.positioning.test.ts:26`, with the requests hand-rolled at `:232–280, 291–370, 458–494, 581, 628, 687`; a verbatim `countItems` at `routes/items.attached.test.ts:285`, inline row reads at `:83, 108–111`, and `setupWorkflow`'s three phases at `:51–54, 77–80, 97–100`; `routes/items.test.ts:533` (`rowOf`), `:127, 146`; `routes/testHelpers.test.ts:34, 74`. None of these is hierarchy-specific, so move them to `fixtures.ts`, which `testing-strategy.md` names as route tests' setup source, and point every site at them.
- `routes/items.attached.test.ts:311–312` writes the attachment flag by hand; it's exactly `setItemParent(id, null, true)`.
- **Board reads** hand-rolled beside `readBoard` and `columnOn`, already imported: `routes/workflows.test.ts:177–178, 201–202, 214–215`; `routes/workphases.test.ts:403–407`; `routes/items.crossProject.test.ts:256–258`.

New fixtures for the sites that have none are #37, on the Watch List.

### 20. One pop-machine case still runs the machine by hand `[Duplication & Abstraction]`
**File:** `client/src/components/workflow/popSession.test.ts:209–212`. **Follows from the first run's #30,** which gave `test/popFixtures.ts::step` a named-anchor parameter and moved this describe's cases onto it. The DRAG-1.7/DRAG-1.8 case still calls `advancePopSession(…, tuning, metrics, 0, {…})`, which is `step(startPopSession(A.key), inA, 0, withCards, {…})`. After it, the direct calls left vary the tuning or pass `parentKeyOf`, which `step` doesn't take.

### 21. The specs split out of `boards.spec.ts` kept its raw setup, and others skip helpers that exist `[Duplication & Abstraction + Correctness & Security]`
All under `tests/`. **Follows from the first run's #40 and #41.** Root `CLAUDE.md`: never hand-roll E2E setup.
- **Raw, unchecked setup** in `ui/workflow-inheritance.spec.ts:23–56, 93–96, 123–138, 186–218` and `ui/workflow-creation.spec.ts:17–28, 32, 45, 60, 87–93` (both moved from `boards.spec.ts` by #41), in what's left of `ui/boards.spec.ts:16–33, 61–63`, and in `ui/project-page.spec.ts:8–22`, whose `beforeAll` moved onto `resetAndSeedDb` with its creates left raw. The template lookup alone is written six times beside `seed.ts::seedWorkflow`. **A test that can pass without its subject:** `workflow-inheritance.spec.ts:216–218` creates "Child-only item" unchecked, and the test at `:221–226` asserts only that it's *not* on the parent board. Use `seedProject`, `seedProjects`, `seedWorkflow`, `seedTemplatedWorkflow`, `pickWorkphases` and `seedItem`; keep the item's id and drop `:93–96`.
- **Locators by hand** in the same two specs (`workflow-inheritance.spec.ts:63, 71, 79, 87, 104, 110, 157, 224–225`; `workflow-creation.spec.ts:41, 53–56, 72–73, 125`) and in the new ATT-11.2 test (`ui/attached-children.spec.ts:438–439, 444`), which imports `boardLocators.ts` yet writes `getByRole('article', …)`. The copies match substrings, and a merged column's name contains its entry phase's (`'Todo – In Progress'`). Use `article(column(page, N), T)`.
- `helpers/itemRepositioningScenario.ts:187`: a raw read beside `seed.ts::fetchItem`, after its writes moved to the seed helpers.
- `ui/item-positioning.spec.ts:58–63`: creates two items and then pins them, with a comment restating the ordering `seed.ts::seedPositionedItems` owns. Call it.

---

## Routed to a story's plan

### 12. `Item.positionScope` is optional, though every response carries it → `positioning-on-create-and-edit.md` `[Consistency & Drift]`
**File:** `client/src/types.ts:55–57`. Nathan ruled on 2026-10-21 that the field stays optional, as the code had it; the Coder had held back from making it required because not every server route returning an item had been traced (the plan's Open questions, batch 3e). The drift pass traced them: `respondWithItem`, `GET /items/:id` and its children, the board and the workflow detail all attach it, and the client typechecks with it required. Required would let the compiler guard `isStub`, which reads a missing field as a Free item. **Why routed:** that story's Decision 8 redefines or replaces `positionScope`, so the type is settled once, with it (Nathan, 2026-10-23).

### 24. `POST /items` places a new item with its own copy of the move's placement → Epic 4 `[Duplication & Abstraction + File Responsibility]`
**Files:** `server/src/routes/items.ts:152–183`; `server/src/lib/itemHierarchy.ts:379–417`, with `isTerminal` at `:320–328`; `routes/workphases.ts::backfillItemsForTerminalFlip`. **Recurring:** the first run's #45, routed to `epic-4-decisions.md` §12. Two passes raised it as Fix Now; the route still holds, since Epic 4's status model may retire the terminal flag the split reads. **New evidence:** the copies already differ in order. The move appends before its terminal check, then drops the position, so a no-anchor move into a done column can fire a reindex whose position it discards. The reindex is real and disclosed; it's only wasted. Added to §12's entry (Routes).

### 25. "This workphase belongs to the workflow the item's project uses" now has four copies → Epic 4 `[Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:29–39, 64–74`; `server/src/routes/workflows.ts:71–76`; `server/src/routes/boards.ts:64–65`, through `getBoardScopeItems`. **Recurring:** the first run's #44, routed to `epic-4-decisions.md` §12. The first run's fix for #2 added the `workflows.ts` copy, as its fix said to. One `withPositionScopes(rows, workphaseRows)` in `itemPositionScope.ts` is the eventual shape. The route still holds: ATT-5.11 is still `Pending PO`. The fourth site is added to §12's entry (Routes).

### 26. `drag-column-bands.spec.ts` grew its third suite → Story 10 `[File Responsibility + Duplication & Abstraction]`
**File:** `tests/ui/drag-column-bands.spec.ts` (858 lines). **Recurring:** the first run's #43, in Story 10's item 7. DRAG-6.6 (`:820–857`, batch 4d) grew the DRAG-6 describe. **New evidence:** the DRAG-6 describe (`:737–857`) uses only ten of the shared helpers, so it comes out cleanly with `delayMoveResponses`. The DRAG-1 and DRAG-3 cases share tests (`:414, 628`), so a split may stop at DRAG-6. Also for item 7: the spec looks up a column by its entry workphase by hand five times (`:109, 110, 129, 343, 344`) beside `seed.ts::columnForWorkphase`, whose failure names the workphase. Added to item 7's entry (Routes).

---

## Watch List

### 27. The item panel keeps a write's `reindexed` pairs in its own rows `[Correctness & Security + Consistency & Drift]`
**File:** `client/src/components/ItemDetailPanel.tsx:226–245`. The three handlers pass each write's response on whole, which is right, but also spread it into the panel's state, so `reindexed` lands on `detail` and its children, and a later write with no reindex doesn't clear it. `positionedWrite.ts::applyWriteResponse` strips the field so it "never lands in a row". Nothing reads it there today; a change that handed `detail` back to `onUpdate` would replay stale pairs over fresh positions. **Fix if it's touched:** strip the field before merging locally, and still pass the whole response on.

### 3. The Default Project backfill can give one project two workflows, and the two inheritance walks then disagree `[Correctness & Security + Duplication & Abstraction]`
**Files:** `server/src/db/runMigrations.ts:116–136`; `server/src/lib/workflowItems.ts:28–69` (`getProjectsUsingWorkflow`) and `:70–83` (`effectiveWorkflowIdForProject`).

The backfill moves every workflow with no project into one new "Default Project". With two such workflows, that project owns both, where project-tree §10 allows one and `POST /workflows` refuses a second with a 409. The two walks then disagree: `getProjectsUsingWorkflow` counts the project as using every workflow it owns, and `effectiveWorkflowIdForProject` takes the first row `.get()` returns. A database with two workflows that have no project would show their items on W2's board labeled `"workflow"`, label them `"none"` on `GET /items/:id`, and refuse every move into a W2 workphase as foreign.

**Why it's here, not Fix Now:** no current data can trigger it. The dev database has no workflow without a project, and no project owning two (queried 2026-10-23); the test database is rebuilt for each run; and nothing creates a workflow without a project now. **Fix if it's touched:** give each orphan workflow its own Default Project, so the one-workflow rule holds everywhere and the two walks agree. **Can ride along with #6,** which changes both files' comments.

### 17. The item test split left tests in files whose headers say otherwise `[File Responsibility + Consistency & Drift]`
All under `server/tests/routes/`. **Follows from the first run's #39.**
- `items.attached.test.ts`: the ATT-4.10 parent-legality tests (`:202–224`) belong with `items.hierarchy.test.ts`'s shared guards; ATT-5.1 (`:226–236`) with `items.crossProject.test.ts`; TC-3.4 (`:238–260`) and TC-2.17 (`:305–319`) with `items.positioning.test.ts`.
- `items.crossProject.test.ts`, inside `describe('across workflows')`: ATT-9.8 and ATT-9.9 (`:201–243`) name a foreign workphase with no cross-project move, so they belong in `items.workphase.test.ts`; TC-2.24 (`:266–276`) is a positioning case. The describe's name is false for TC-2.24 and ATT-5.12.
- `items.hierarchy.test.ts`: ATT-5.2 (`:932–947`) belongs with `items.crossProject.test.ts`'s ATT-5.2; ATT-9.1 (`:140–153`) with `items.workphase.test.ts`'s.

**Why it's here, not Fix Now:** where a test lives is a judgment call, and nothing is harder to change correctly for it. **Fix if it's touched:** move the tests, then make each header and describe say what its file holds. Each test keeps its case ID, and the Reconciler re-points the Automation lines. **Can ride along with #16,** which changes the same files.

### 18. `items.hierarchy.test.ts` still holds eight areas `[File Responsibility]`
**File:** `server/tests/routes/items.hierarchy.test.ts` (948 lines; header `:11–13`). Two blocks would come out cleanly, after #17:
- **Reindex:** its `reindex disclosure` describe (`:814–882`, TC-5.10 to 5.14) and `items.positioning.test.ts`'s reindex describes (`:557–702`) make one `items.reindex.test.ts` of about 215 lines, one test-plan group. It would set up through `workflowWithPhases` or `setupWorkflow`, since the positioning file's `setupTwoPhases` is closed over by its describe.
- **The activity log:** the `hierarchy activity log` describe (`:693–812`, ATT-8).

**Why it's here, not Fix Now:** a large test file is a judgment call. Split it if it keeps growing, or when it's next reworked.

### 19. `projects.test.ts` mixes four concepts `[File Responsibility]`
**File:** `server/tests/routes/projects.test.ts` (895 lines). The items tests were split by concept; this file, the same shape, wasn't. Two blocks would come out cleanly: the delete cascade (`:728–895`, TREE-9, the only user of nine schema imports) into `projects.delete.test.ts`, and the depth cap (`:606–726`, TREE-3.5 to 3.9, with its four helpers) into `projects.depthCap.test.ts`. `projectWithItem` (`:70–79`), used by both, would move to `fixtures.ts`.

**Why it's here, not Fix Now:** the same as #18.

### 37. Server test states with no fixture yet `[Duplication & Abstraction]`
All under `server/tests/`. Split from #16 at the re-tier: these need a new fixture, where #16's sites copy one that exists.
- **A workphase the API refuses,** written by hand at `routes/items.workphase.test.ts:140, 158, 174, 253`, `routes/items.attached.test.ts:192–193`, `routes/workflows.test.ts:107` and `routes/boards.test.ts:416, 456`: a `setItemWorkphase` beside `setItemPosition`.
- **A second board made before the workphases,** by hand at `routes/columns.test.ts:33–40`, `routes/workphases.test.ts:115–122` and `routes/boards.test.ts:274–277`: an option on `workflowWithPhases` for extra boards.
- **Agents and item types** created by hand three times in `routes/items.test.ts` (`:123–126, 314–316, 626, 639–641`): `createAgent` and `createItemType`.

**Can ride along with #16,** which changes `fixtures.ts` and most of these files.

---

## Covered by

### 28. `POST /items` coerces `isAttached` and `workphaseId`, where a move refuses them → the API contract epic
`server/src/lib/itemHierarchy.ts:229–247` (`resolveCreate`); `server/src/routes/items.ts:141`. `isAttached: "false"` creates an attached child, and `workphaseId: true` reaches the database as a 500. **Recurring:** the first run's #51, Covered by `api-contract-zod-openapi.md`'s C1 ("Zod validates every request, on every non-test route"), as that run's Close-out records. `workphaseId: true` is the same clause.

### 29. An empty-string id: `POST /items` stores it as none, `PUT` refuses it → the API contract epic
`server/src/routes/items.ts:105, 136, 197` against `:250–253`. `api-contract-zod-openapi.md`'s Inbound deferrals ("An empty string for an optional id", Nathan, 2026-10-23) name it. That entry's first bullet still says `PUT` answers 500; it answers 400 since batch 4f, which the plan's Open questions already put to the Architect.

---

## Informational

- **30. A done list's blue line and zoom-in candidate are worked out from a shuffle that isn't drawn.** `CardList.tsx:94–97` stops a terminal list's rows from sliding, but `dragCollision.ts::dropAnchorFor` still names the neighbor from dnd-kit's shuffled order. The release is right (`placementFor` ignores `over` in a terminal region). Wiki board-drag-interaction §2 rule 6 holds "which Card it names here, and how it's drawn" as an Open question.
- **31. An anchor at position 0** passes `anchorRefusal` (which refuses only null), then the resolver, which treats any falsy position as none, throws a 500 (`positionResolver.ts:145, 169, 283`). Only a test pin can set 0, and none does.
- **32. Second appearances:** `makeItem` never derives `'none'` (first run's #59; its comment is #9's); `placement.test.ts`'s `stub()` gives a Stub drag no workphase (`:239–240`; first run's Watch List #49); `PUT /items/:id` answers a detach with a remedy it can't accept (`itemHierarchy.ts:100–102`; first run's #56). Each becomes required if Story 7's audit raises it again.
- **33. Unchecked setup writes with no helper to use:** a workphase reorder, a board create and a column reorder in `tests/ui/boards-layer.spec.ts:173–180, 239, 317–324`; column deletes and edits in `drag-column-bands.spec.ts:111–114, 345–348`; a workphase delete in `attached-children.spec.ts:95`. Each is followed by an assertion a refused write fails, so none passes vacuously.
- **34. Placeholder pages' failure paths:** `ConfirmDeleteInline.tsx:42–46` stays on "Deleting…" if the delete is refused; `ProjectOverviewTab.tsx:39–45, 102–110` leave a refused save unhandled; the panel's depth labels go stale after a reparent from the Sheet. The project page and the Sheet are placeholders until their epics.
- **35. Considered, not findings:** `useBoardDnd.ts` at 719 lines (its phases share about ten refs; the only ref-free seam, `handleDragStart`'s derivation, is a testability gain); the sidebar importing `resolveDropSide` from the board's `dragCollision.ts`; `columnRanges.ts`'s pure and database halves; `workflows.ts::addDepths`; `coarsestFit.ts` tested inside `positionResolver.test.ts`; eleven `item-attachment §2a` pointers in `itemHierarchy.ts`; `assert*` helpers that return a message; two `page.on('request')` recorders; `seed.ts` and `itemRepositioningScenario.ts` without headers; `dragChrome.test.tsx` covering one invariant on two surfaces.
- **36. Moves and removals checked:** `dragStructure.ts` and its tests, `defaultBoard.ts`, `projectCascade.ts`, `workflowCascade.ts`, the four item test files, `columnRanges.test.ts`, `testHelpers.test.ts`, the two workflow specs, `projectFixture.ts` and `reindexFixtures.ts` each moved rather than copied, with every import and setup hook they relied on. The 90 removal sites left nothing dangling, apart from the comments in #7 and #10.
- **22. The "server refuses the write" route stub is written three times:** `tests/ui/drag-column-bands.spec.ts:834–836` (new with DRAG-6.6), `tests/ui/project-tree-drag.spec.ts:332–334` and `tests/ui/project-tree-sidebar.spec.ts:81–85`. Three one-line stubs; a shared `refuseWrites(page, urlGlob)` would be tidier, but nothing is at risk while there are three.
- **23. The checker's tests:** `scripts/check-docs/repoIndex.test.mts:58–65` tests `files.mts::isSuiteFile`, which `files.test.mts` now pairs with; `check.test.mts:390` writes out the marker its own `IGNORE_MD` (`:40`) builds. **Can ride along with #2,** which adds tests to both files.
- **38. `server/src/routes/items.ts:131`:** "So would a type or an agent that names no row" has lost its antecedent (`:117`) to the comment between them.
- **39. `server/src/routes/workflows.ts:66–70`:** "It answers only for the items of a project that uses this workflow" has no clear subject; the `usedBy` check at `:75` does the narrowing. **Can ride along with #6,** which changes the same file.
- **40. `client/src/components/workflow/dragCollision.ts:75–77`:** at a Descendants context there's no container candidate, so the parenthetical should replace "the context's container and the cards", not just "the cards".
- **41. `server/tests/fixtures.ts:102–104`:** `BoardBody` is "narrowed to the fields the board tests read", but `itemDepthCap` and `entryWorkphaseId` aren't read through it. **Can ride along with #10.**
- **42. `server/tests/routes/items.positioning.test.ts:584–587`:** lists T1, T2 and P1 as landing on integers; T3 does too. **Can ride along with #10.**
- **43. `tests/ui/boards-layer.spec.ts:8–11`:** chooses "quick" so its workphases exist at creation, which "flow"'s do too; any template gives 1:1 columns.
- **44. `server/src/lib/itemTree.ts:179–180`:** `parentRefusal` hand-rolls the existence check `lib/getOrNotFound.ts::existsById` makes. Split from #15 at the re-tier.

---

## Routes

**Landed** in the Open questions of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`, under the re-run.

**For the PO:**
- Board-drag-interaction §10's "A reload that lands mid-drag stops the drag" names a failed drop's and a stale response's resyncs. #1 sends a failed column reorder down the same path. Should the rule name every reload?
- Positioning §7 says the written entry is among the disclosed pairs "when it was part of the reindexed scope". `withReindexDisclosure` adds it whenever any reindex fired and the row has a position. The client applies every pair, so nothing breaks; the wording and the code differ.

**For the Architect:**
- `testing-strategy.md` names `server/tests/fixtures.ts` as the server's setup source, and doesn't mention `itemHierarchyFixtures.ts` or `setItemParent`'s attachment argument. #16 moves the item helpers into `fixtures.ts`.

**For the Test Reconciler:**
- Tests that may not prove their case: `server/tests/routes/items.attached.test.ts:137` and `items.positioning.test.ts:628` (TC-5.5) don't assert their move's status, so a refused move passes; `client/src/lib/hierarchy.test.ts:57–85` tests `getSubtreeHeight`, which neither cap check calls (moot after #13); `client/.../itemWriteReconciliation.test.ts:127–167` (DRAG-6.1, TC-2.28) rebuilds the board's write tracker by hand; `client/.../dragRegions.test.ts:72` (DRAG-1.6) checks only the gap between sub-rows; `client/src/lib/positionedWrite.test.ts:13` is titled TC-5a.4, which its third test exercises; `tests/ui/workflow-inheritance.spec.ts:221–226` until #21 lands.
- Case IDs on more than one test: ATT-9.1 (`items.hierarchy.test.ts:140`, `items.workphase.test.ts:40`); TC-2.24 (`items.test.ts:430`, `items.crossProject.test.ts:266`, with different claims); TC-2.6 and TC-2.7 (`items.test.ts:251`, `items.positioning.test.ts:36, 43`); ATT-4.10 in four files.
- #17, #18 and #19, on the Watch List, move tests between files if they're done; their Automation lines need re-pointing after.

**For the Test Planner:**
- TC-5a.5's Automation line lists only `itemListOps.test.ts`; `client/src/lib/hierarchy.test.ts:105–123` tests the same tie-break, with no ID.
- TREE-1.13 is `Open`; `hierarchy.test.ts:99–102` asserts its library half, with no ID.
- `ItemDetailPanel.test.tsx` carries no case ID, and TC-5a.1's line doesn't list it.
- `tests/ui/workflow-inheritance.spec.ts`'s header cites wiki project-tree §10, and no project-tree case covers inherited or own workflows or copying one; neither new spec's titles carry an ID.

---

## Close-out

Filled in as the audit closes. One row per required finding (#1–2, #4–16, #20–21, #24–26, #28–29).

| # | Disposition | Where it landed (routes) |
|---|---|---|
| 1 | Fixed | Batch 6a, `onColumnDrop` takes the drag layer's resync |
| 4 | Fixed | Batch 6c (1 of 2) |
| 5 | Fixed | Batch 6a |
| 2, 7–11, 13–14, 20–21 | open | — |
| 6 | Fixed | Batch 6b, with #38 and #39 |
| 15 | Fixed | Batch 6b |
| 16 | Fixed | Batch 6c (1 of 2) |
| 12 | Routed | `positioning-on-create-and-edit.md`, Inbound deferrals |
| 24 | Routed | `epic-4-decisions.md` §12, "Carried in from the A6 first-run audit", the #45 bullet |
| 25 | Routed | `epic-4-decisions.md` §12, the same block, the #44 bullet |
| 26 | Routed | Story 10's item 7, `epic-3-5-roadmap.md`, the `drag-column-bands.spec.ts` bullet |
| 28 | Covered | `api-contract-zod-openapi.md`, C1 |
| 29 | Fixed | Batch 6b: `POST /items` refuses `parentId: ''` and `agentId: ''`, and the Inbound deferral is withdrawn |

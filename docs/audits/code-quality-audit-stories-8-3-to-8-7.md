# Code Quality Audit — Epic 3.5 Stories 8.3 to 8.7

**Range:** `epic-3-5-story-8-1-audited..f920eb7`, 22 commits. The base is the newest `*-audited` tag, on `43f20d5`, the commit that added Story 8.1's audit. The end is the tip of `claude/stories-8-2-to-8-7-reconciliation`, after the reconciliation's own doc commits. Nathan tags the end commit `epic-3-5-stories-8-3-to-8-7-audited`.

**What the range holds:**

- **Story 8.1's Phases 7–9:** its audit's Fix Now, landed after the tag. The guide's range takes these in, since no other audit reads them.
- **Stories 8.3 to 8.7:**
  - 8.3: the drag names its neighbor from the row dnd-kit announces;
  - 8.4: the forced-stop cue;
  - 8.5: the traveling rows' tiers;
  - 8.6: one Stub row height;
  - 8.7: the sidebar drag's tiers.
- **The stories' planning, close and wiki follow-up commits,** which no pass reads.

Story 8.2 was built inside Story 8.1 (roadmap, Story 8.2), so it has no code here. Nathan asked for this audit at Story 8's mid-point, beside the test reconciliation on the same branch.

## How the range sorted

The scope came from `npm run audit:scope` (`docs/audits/stories-8-3-to-8-7-scopes/`). It found 59 files to read:

- 2,168 changed lines;
- 4 removal sites;
- no moved lines.

35 files were marked read whole. The config added no `readWhole` marks.

**The split.** Nearly all the code is client code, and the server, E2E and tooling changes are small. So the run used a config (`docs/audits/stories-8-3-to-8-7-scopes/config.json`), 13 instances in all:

- **Correctness & Security** and **Consistency & Drift:** four each: C1 the drag layer, C1t its tests, C2 the rest of the client, and "rest" (S1, S1t, E2E and T together).
- **Duplication & Abstraction:** three: client source, client tests, and rest.
- **File Responsibility:** two: client and rest.

## How it ran

- **The passes ran cold.** Each got only its scope file. They ran in two waves.
- **One pass came back short.** The drift pass over "rest" skipped the changed lines of eight test files. It was sent back to read them, and found nothing in them.
- **Re-traced by hand** before going in the report:
  - #1: against `workphases.ts`, `boards.ts` and `columns.ts`. The behavior with a value that isn't a string comes from the Story 7 re-run's probe of the same drizzle and better-sqlite3 lookup (`docs/audits/code-quality-audit-epic-3-5-story-7-rerun.md`, #1); `workflows.ts:117-118` records the array case.
  - #2: with a probe. `strippedCode` gives `export const SEP = ', ';` and `export const SEP = ',  ';` the same line.
  - #3: against `ForcedStopContext.ts`, `dragChrome.tsx` and `BoardView.tsx:363`, and wiki board-drag-interaction §10.
  - #7: against its test body.
- **What the merge step read:**
  - the plans of the stories in the range, none of which had an audit of its own: Story 8.3's, 8.4's, 8.5's and 8.6's in `docs/archive/`, and 8.7's in `docs/planning/epic-3-5-stories/`. From each, the Inbound deferrals, which no audit routed, and the handoff's Planned passages now built. Only Story 8.4 built one, board-drag-interaction §10's cue, and its enforcement sites carry the pointer (`forcedStop.ts`, `ForcedStopCue.tsx`, `useForcedStop.ts`);
  - Story 8.1's audit (`docs/archive/code-quality-audit-epic-3-5-story-8-1.md`) and its Close-out. Its correctness fixes are in the code: the workflow reference's shape check is `workflows.ts:117-122`. The passes found no regression in Phases 7–9;
  - `api-contract-zod-openapi.md`'s Story 2, for #1;
  - wiki board-drag-interaction §10, and row-references §1.

## Overall shape

**Stories 8.3–8.7 trace correct in their core.** The passes re-derived each of these and found them sound:

- the shared tier walk (`lib/dragTargets.ts::classifyTargets`) against hierarchy-placement §7 and board-drag-interaction §4.1;
- the forced-stop path's single report, its reload, and the cue staying mounted across "Loading board…";
- the pickup tree built from the pending writes;
- `sameProjection`'s fields.

**What the findings are:**

- **One rule left half-applied (#1).** Story 8.1 gave `POST /workflows` a check that a reference is a string. The three routes beside it that create rows from a reference still lack it, so a value that isn't a string is a 500, or slips through as an array.
- **The scope script's fold (#2).** Story 8.1's Phase 8 fixed the fold for a template's later lines. It still treats a whitespace change inside a one-line string as no change to the code.
- **The forced-stop flash replays (#3)** on any remount while the banner is up, including a silent reload §10 says shows nothing.
- **Comments the stories outgrew (#4–#11).** The drag layer's `AGENTS.md` lists and the `dragTuning.ts` header are the ones a reader is most likely to go to.

**Structural work is all optional.** No pass found a copy that has started to differ. The tier property names (#14) and the test helpers in `useBoardDnd.test.ts` (#18) are the cheapest consolidations.

**Plan the batches in this order:**

1. the server (#1, with #4 beside it);
2. the client flash (#3);
3. the scope script (#2);
4. the comments (#5–#11). #5, #7 and #18 share `useBoardDnd.test.ts`.

---

## Fix Now — correctness

### 1. Three create routes don't check that a reference is a string: a value that isn't one is a 500, and an array holding an id gets through `[Correctness & Security (rest) + Duplication & Abstraction (rest)]`

- **Where:**
  - `server/src/routes/workphases.ts:17-27` (`workflowId`);
  - `server/src/routes/boards.ts:110-116` (`workflowId`);
  - `server/src/routes/columns.ts:18-24` (`boardId`, `startWorkphaseId`, `endWorkphaseId`).
- **Problem:**
  - `POST /workflows` checks a required reference in three steps: present, a string, and naming a row (`workflows.ts:113-127`). Its comment gives the reason: better-sqlite3 throws on most values that aren't strings, and flattens an array to the id it holds.
  - These three routes check only present, then the lookup.
  - The rule for an optional reference ("a string or null") is also written inline at five sites: `itemHierarchy.ts:254-262`, `projects.ts:39, 217-224`, `workflows.ts:136-144` and `testHelpers.ts:76-77`.
  - `namesARow` is private to `workflows.ts:43`.
- **Failure scenarios:**
  - `POST /api/workphases` with `{ workflowId: true, name: 'X' }` or `{ workflowId: {} }`: the bind throws, and the caller gets a 500 where row-references §1 promises a 400.
  - `{ workflowId: [wfId], name: 'X' }`: the existence check reads the flattened id and passes, so a workphase is created from a request §1 refuses.
  - The same holds for a board's `workflowId` and a column's three references.
- **Fix:**
  - One helper in `server/src/lib/getOrNotFound.ts`, beside `existsById`. For example, `referenceShapeError(field, value, { required })` returns the 400's message or null, with `namesARow` moved beside it.
  - Call it from the three routes and the five inline sites.
  - Add one refusal test per route, shaped as `workflows.test.ts:163-171`.
  - Ride-along: `workphases.ts:24` writes out `existsById`'s body where the helper is already imported (line 7).
- **Wiki:** breaks a rule in force, row-references §1. The API contract epic's Story 2 moves these routes onto schemas later. It doesn't name this gap, and the fix is small.

### 2. The scope script sends a whitespace change inside a one-line string to the drift pass alone `[Correctness & Security (rest)]`

- **Where:** `scripts/audit-scope/lineKinds.mts:136-150` (`strippedCode`), with `classify.mts::readingOf` (lines 32-38) and `diff.mts::removalSites`.
- **Problem:**
  - Story 8.1's Phase 8 kept a multiline template's later lines exact.
  - Every other line still has its whitespace collapsed, inside a one-line string, regex or template too, and on a multiline template's first line.
  - `removalSites` compares a string by its value, so it marks the hunk a site. `readingOf` then finds the two versions strip alike and returns `'drift'`.
- **Failure scenario:** a commit changes `export const SEP = ', ';` to `export const SEP = ',  ';`, or `s.split('  ')` to `s.split(' ')`.
  - Blame `-w` lists no changed line.
  - The probe shows both versions strip to `export const SEP = ', ';`.
  - The file goes to drift alone, so the correctness pass never sees the value change.
- **Fix:** collapse whitespace only between tokens, for example by rebuilding a line from the scanner's tokens with string and regex text kept exact, and treat a template's first line from the backtick on as its later lines are. Add a `readingOf` case beside `classify.test.mts:62-66` for `'a b'` → `'a  b'` on one line.
- **Wiki:** none (repo tooling). It breaks `.claude/guides/audit-workflow.md`'s sort table: a code change goes to all four passes.

### 3. The forced-stop flash replays on any remount while the banner is up, including a reload §10 says is silent `[Correctness & Security (C1)]`

- **Where:**
  - `client/src/components/BoardView.tsx:363`: the flash context holds `forcedStop.stop?.itemId` for the whole cue, about 5 seconds;
  - `client/src/components/dragChrome.tsx:126, 145, 148`: a row with that id carries the one-shot `forced-stop-flash` class for as long as the context names it.
- **Problem:** the flash is a 1.4-second animation that plays when the class lands on a mounting row. Any mount of the stopped item's row during the cue plays it again.
- **Failure scenarios:**
  - **(a)** A stale response's refresh lands with no drag running, within 5 seconds of a stop. The resync correctly reports nothing, but the reload remounts every row, and the stopped item flashes again with no stop behind it. §10: "a failed drop with no drag running … that resync stays silent".
  - **(b)** The drag on Stub X is stopped while its Card is collapsed, so X gets no flash, as §10 says. The user opens the Card within 5 seconds, and X's row mounts and flashes, long after the reload.
- **Fix:** keep the flash's id apart from the banner, and clear it once the reload the stop caused has committed, or after the flash's 1.4 seconds. The banner keeps its own `forcedStopCueMs`.
- **Wiki:** breaks a rule in force, board-drag-interaction §10: the flash shows "where the reloaded board draws it", and no cue shows for a silent resync.
- Can ride along: #25's `key` on the banner.

---

## Fix Now — drift

### 4. `workphasesInOrder`'s comment names `existsById` as a standalone caller; it isn't one `[Consistency & Drift (rest)]`

- **Where:** `server/src/lib/workphaseOrder.ts:26-28`, "omit it to read standalone, as `existsById` does".
- **Problem:** `existsById` (`getOrNotFound.ts`) reads no workphases and doesn't call this. The standalone callers are `routes/workphases.ts:29` and `getOrderedWorkphases` (line 43).
- **Fix:** "omit it to read standalone, as `getOrderedWorkphases` does". Can ride along with #1.

### 5. `useBoardDnd.test.ts`'s header says it holds one case; it holds six `[Consistency & Drift (C1t) + File Responsibility (client) + Duplication & Abstraction (client tests)]`

- **Where:** `client/src/components/workflow/useBoardDnd.test.ts:1-3`, "the drag hook's handling of a column drop whose save fails", which it "holds only".
- **Problem:** the file also covers:
  - the modal's placement reading (59-82);
  - where a Stub's drag starts (95-129);
  - what targets are classified against (133-178);
  - the neighbor row (184-229);
  - a drag the board stops (283-382).
- **Fix:** name its concept, the cases that need the hook's live session. Keep the note that the gesture itself is tested through the pure modules and the E2E specs.
- Can ride along: #18.

### 6. A tier fixture's comment reverses which item fits under which `[Consistency & Drift (C1t) + Correctness & Security (C1t)]`

- **Where:** `client/src/components/dragChrome.test.tsx:62-64`, "V is a Free Card that fits under X", and X "fits under T1 only".
- **Problem:** the test asserts V is a legal parent for X (lines 133-140), so X fits under V. "T1 only" holds only within the T chain.
- **Fix:** "V is a Free Card X fits under; of the T chain, X fits under T1 only".

### 7. A test titled "released" cancels the drag `[Correctness & Security (C1t)]`

- **Where:** `client/src/components/workflow/useBoardDnd.test.ts:364`, "is not reported when a drag is released before an armed stop fires". The body calls `handleDragCancel()`.
- **Problem:** both paths end the drag today, but the title names a path the test doesn't run.
- **Fix:** "… cancelled before …", or drive `handleDragEnd`.

### 8. `cue-fill`'s comment points at `KanbanCard.tsx`; the keyframes are used in `dragChrome.tsx` `[Consistency & Drift (C2)]`

- **Where:** `client/src/index.css:8-11`; the use is `dragChrome.tsx`, about line 194 (`animationName: 'cue-fill'`).
- **Fix:** point at `dragChrome.tsx::ZoomCue`.

### 9. `useIsLockedAtCard`'s comment says `KanbanCard` reads it two ways; it reads it four `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/workflow/DragSessionContext.ts:145-150`.
- **Problem:** `KanbanCard.tsx` reads `lockedHere` for:
  - the forced-open section (147);
  - the projection (165);
  - `transition: 'none'` on its root (189);
  - the active-context outline and `data-active-context` (241, 245).
- **Fix:** list the four, or drop the count.

### 10. The drag layer's `AGENTS.md` leaves `forcedStop.ts` and `useForcedStop.ts` out of its lists of what each concern lives in `[Consistency & Drift (C1) + File Responsibility (client)]`

- **Where:** `client/src/components/workflow/AGENTS.md:129-183`, "Where each concern lives".
- **Problem:** the pure modules list has no `forcedStop.ts` (the stop's types, its wording and the armed stop), and the hooks list has no `useForcedStop.ts`. Both appear only in passing, in `useBoardDnd.ts`'s bullet. `ForcedStopContext.ts` has its own entry.
- **Fix:**
  - "`forcedStop.ts` — a stopped drag's signal, its wording and the armed stop";
  - "`useForcedStop.ts` — the cue's lifetime, held by `BoardView.tsx`".
  - Ride-along: `useBoardDnd.ts`'s header (1-33) lists the pure modules it composes, and doesn't name `forcedStop.ts` or the stop it reports.

### 11. `dragTuning.ts`'s header says it holds the board drag's parameters; it now holds the sidebar's tiers and the forced-stop cue too `[File Responsibility (client)]`

- **Where:** `client/src/components/workflow/dragTuning.ts:1-5`, "The tunable parameters of the board drag gesture". The file also carries:
  - the project sidebar's three tier opacities (71-81);
  - the forced-stop cue's length and flash switch (90-93).
- **Problem:** a reader looking for the sidebar's values wouldn't look in the board gesture's file.
- **Fix:** "The tunable values of the drag surfaces, the board's gesture, its cues and the sidebar's tiers, and where they persist". The pass tagged this Watch List as a header note; it's a header that's wrong about what the file holds, so it's Fix Now here.

---

## Fix Now — structural

None. No pass found a copy that has started to differ from its original.

---

## Routed to a story's plan

None.

---

## Watch List

### 12. The tier fixtures build top-level items flagged attached `[Correctness & Security (C1t)]`

- **Where:** `dragChrome.test.tsx:58, 66-76` (`stub('X', null)`, `stub('V', null)`, `stub('T1', null)`), and `dragClassification.test.ts:11`, whose `item()` defaults to attached.
- **Problem:** wiki item-attachment §1 has "attached ⇒ has a parent" in every stored row. The tests pass because `isStub` reads `positionScope`, which `makeItem` derives from the parent. A tier read that consults `isAttached` would change what these tests expect, for a reason they aren't about.
- **Fix:** build roots Free, or let `makeItem`'s own default decide.

### 13. The sidebar works out the carried project's subtree twice, once at pickup and once live `[Duplication & Abstraction (client src)]`

- **Where:** `useProjectDragReorder.ts:44-55` (`classifyTargets` returns `subtreeIds`, unused) and `:86-90` (a `useMemo` over the live `projects`).
- **Problem:** the tiers are fixed at pickup, while the descendants, the excluded rows and the cap's height follow the live tree. A project write landing mid-drag would make them disagree.
- **Fix:** keep the subtree on `Drawn`.

### 14. The three tier property names are typed out at four sites `[Duplication & Abstraction (client src, client tests)]`

- **Where:** `dragChrome.tsx:58-63` (`TIER_CLASS`, `GHOST_ROW`), `BoardView.tsx:261-266`, `useProjectDragReorder.ts:49-53`, and the test at `useProjectDragReorder.test.ts:454-458, 465-469, 481-485`.
- **Problem:** a renamed property breaks one surface with no type error, and the test copies the hook rather than the classes.
- **Fix:** a `tierVars({ anchor, neither, ghost })` beside `TIER_CLASS`.

### 15. The panel's stop causes repeat the `StopCause` union by hand `[Duplication & Abstraction (client src)]`

- **Where:** `DragTuningPanel.tsx:170-178` against `forcedStop.ts:7, 15-18`.
- **Problem:** a third cause would type-check and never appear in the panel.
- **Fix:** a `STOP_CAUSE_LABEL: Record<StopCause, string>`.

### 16. `DragTuningPanel.tsx`: the opacity fields' settings six times, and the arming controls `[Duplication & Abstraction (client src) + File Responsibility (client)]`

- **Where:** `step: 0.05, min: 0, max: 1` at 55-58 and 62-87; the arming controls at 158-210.
- **Fix:** an `opacityField(key, label)`, and an `ArmStopControls` component if the panel grows. #15 can ride along.

### 17. The `chain` test helper is in two files `[Duplication & Abstraction (client src, client tests)]`

- **Where:** `dragTargets.test.ts:15-19` (projects) and `dragClassification.test.ts:16-20` (items).
- **Fix:** a generic `chainOf(prefix, length, make)` in `client/src/test/`. The client-tests pass judged this not worth it, since the copy is a compiler-checked four-line loop.

### 18. `useBoardDnd.test.ts` has helpers its own tests don't call `[Duplication & Abstraction (client tests)]`

- **Where:**
  - `failingColumnSave` (288-299) sits in one describe, and DRAG-6.15 (236-264) writes the same setup by hand;
  - `pickupSession` (84-91) is written out in the two tests above its first caller (96-109, 111-119);
  - the two armed-stop tests repeat their deps and fake timers (318-340, 364-381).
- **Why not Fix Now:** each copy agrees and has one caller (the guide's structural rule).
- **Fix:** move the helpers to module scope, and add a `startDrag(overrides)` under them. Can ride along with #5 and #7.

### 19. A full `DragSession` literal is written in four test files `[Duplication & Abstraction (client tests)]`

- **Where:** `dragChrome.test.tsx:78-88` (new), `KanbanCard.test.tsx:19-29`, `HierarchyModal.test.tsx:33-43` and `BandGuides.test.tsx:18-29`.
- **Fix:** a `dragSession(...)` in `client/src/test/dragFixtures.ts`. This recurs from the Story 7 re-run's #24.

### 20. Two more test setups that bypass their file's helper `[Duplication & Abstraction (client tests)]`

- `useProjectDragReorder.test.ts:427-442` builds the hook by hand because `sidebarDrag` can't rerender.
- `dragChrome.test.tsx:141-147` rebuilds `rowIn`'s providers for the overlay case, and `inSession` (191-196) is a third copy.

### 21. `columnRanges.ts` writes the terminal-boundary check and the "columns of a workflow's boards" query twice each `[Duplication & Abstraction (rest)]`

- **Where:** the check at 101-104 and 220-224; the query at 152-157 and 207-212.
- **Problem:** the copies agree. The query depends on boards belonging to workflows, which the root `AGENTS.md` says is due to change, so that rework will have to find both.
- **Fix:** `spansTerminalBoundary(covered)` and `columnsOfWorkflow(client, workflowId)`.

### 22. `getOrderedWorkphases` takes no transaction client, so callers work around it both ways `[Duplication & Abstraction (rest)]`

- **Where:**
  - `columnRanges.ts:161-162` pairs `workphasesInOrder` and `buildRankMap` by hand inside a transaction;
  - `workflows.ts:85` and `boards.ts:118` call `getOrderedWorkphases` and discard the rank map.
- **Fix:** an optional client on `getOrderedWorkphases`, and `workphasesInOrder` at the two discarding sites. #4's comment names the same callers.

### 23. The scope script's parses and test helpers `[Duplication & Abstraction (rest) + File Responsibility (rest)]`

- **Parsing:** `lineKinds.mts` parses one text up to three times (67, 86, and `check-docs/extract.mts:53`). `importLines` numbers from 0 and `templateLines` from 1, read side by side at 142-144.
- **Test helpers:**
  - `scan.test.mts::commitFile` (484-489) and `git.test.mts:14-16` repeat what `testRepo.mts` could own;
  - `diff.test.mts::sitesOfLine` (89) is local to one test, and its body is written out at 84, 149, 154 and 157.
- **`scan.test.mts`:** it still holds `main.mts`'s CLI tests (about 420-473), which recurs from the Story 7 re-run's #21.

### 24. `useBoardDnd.ts` is at 885 lines, and `BoardView.tsx` at 498 `[File Responsibility (client)]`

- **`useBoardDnd.ts`:** the forced-stop path added about 30 lines. The release tail is still the cleanest seam.
- **`BoardView.tsx`:** it gained the forced-stop state and a provider layer. Its modal state is still a `useHierarchyModalState` candidate.
- Both recur from Story 7's audits. Split them when either is next reworked.

---

## Covered by

None.

---

## Informational

### 25. Edge cases the client can't reach today `[Correctness & Security (C2, C1)]`

- **A dangling parent:** `lib/dragTargets.ts:81` draws a node whose parent isn't in the list as low, where `getDepth` reads it as a root. It needs an orphaned item; it doesn't affect a project, whose parent has an FK.
- **The banner's `key`:** `ForcedStopCue.tsx:20-29` has none, so a stop replacing a live one wouldn't restart the fade. `BoardView.tsx::startDrag` clears the stop first, so it can't happen. It can ride along with #3.
- **A column drag:** one that a reload lands on is stopped with no cue (`useBoardDnd.ts:755-762`). That matches §10, which scopes the rule to an item drag. See For other roles.
- **The panel's arming choices:** they reset on every reload (`DragTuningPanel.tsx:102-103`), a dev-tool inconvenience. The armed stop itself is kept.

### 26. Small things in the scope script and server tests `[Correctness & Security (rest) + Duplication & Abstraction (rest)]`

- `lineKinds.mts:144`: a comment after a multiline template's closing backtick counts as code. It's an over-read only.
- `workflows.test.ts:163-171`: `false` and `0` stop at the "required" check, so they never reach the string check.
- `workflows.test.ts:392` writes out `workflowsOf` once.
- `config.test.mts:27` uses `workflow/CLAUDE.md` as a fixture path. The file is `AGENTS.md` now, but the test only checks which group a path falls in.

### 27. Repeats considered and left `[Duplication & Abstraction]`

- **Client:**
  - the timed animation style, twice;
  - `useForcedStop` as a general self-clearing value;
  - `sameAnchor` and `sameOverflowBeside`;
  - `tier ? TIER_CLASS[tier] : ''`, twice, which can ride along with #14;
  - `BoardView.tsx`'s message shells;
  - the Stub row shells;
  - `CreatedWorkflow` beside `WorkflowWithDetails`;
  - the three fake write trackers;
  - one `ItemType` and one `FlatItem` literal.
- **Scope script:** array equality twice; the `lines` helper and the template fixture across test files; `runMain` and `scanRange` repeats.
- **Server:** the two non-string loops; `itemIn` twice.
- **E2E:** the overflow board's opening sequence. The skipped specs are due for Story 10's rework, so a helper now would be done twice.
- **Rulings found intact:** the rulings at `TypePill.tsx:8-11`, `dragChrome.tsx:31-35`, `cardMetrics.ts:65-68` and `descendantsProjection.ts:245-250, 303-306`.

### 28. Considered and sound `[all passes]`

- **Client:**
  - `classifyTargets` against hierarchy-placement §7 and board-drag-interaction §4.1;
  - every tier fixture's depth arithmetic;
  - `CreatedWorkflow` against `POST /workflows`' response;
  - the cue's single mount across the reload;
  - `TypePill`'s 16px arithmetic;
  - `resyncBoard`'s single report and reload;
  - `writes.fail` before the resync;
  - the armed stop's cleanup;
  - `withPendingParents` and `containingCardIdOf`;
  - `loadDragTuning`'s checks of the new fields.
- **Server:** the transaction client now passed to `workphasesInOrder`. The read before the transaction in `findColumnsMixingTerminalAfterFlip` is a ruling recorded at its site.
- **Scope script:** `removalSites` and `templateLines` against every test case.
- **Not worth splitting:**
  - `dragChrome.tsx`, `KanbanCard.tsx`, `StubRows.tsx`, the forced-stop files, `dragTargets.ts`, `useProjectDragReorder.ts` and its test, and `dragChrome.test.tsx`;
  - `diff.mts`, whose formatting comparison is about 80 lines private to `removalSites`. It's the seam if it grows;
  - `lineKinds.mts`, `config.mts` and `workflows.test.ts`.

---

## For other roles

These go to the Open questions of Story 8.7's plan at close-out, addressed to each role.

- **PO, wiki board-drag-interaction §10:**
  - It names two resyncs that can land mid-drag, a failed drop's and a stale response's. The code has a third: a failed column reorder from an earlier drag (`useBoardDnd.ts:802`, through `onColumnDrop`). It stops a live item drag and shows the failed-write wording.
  - A column drag that a reload lands on is outside the rule as written (#25). Whether it should show the cue is for the PO.
- **Test Reconciler:**
  - `cardMetrics.test.ts:18-22` checks that a row has no vertical padding. Under Tailwind's border-box, padding doesn't change an `h-6` row's height, while a margin would change the list's pitch, so the test may not prove its title.
  - `dragTargets.test.ts`'s tier cases and `dragClassification.test.ts`'s tier block (62-131) may test the same walk twice, now that the board's classification hands off to `classifyTargets`.
  - `workflows.test.ts:227`'s list of values that aren't strings is narrower than line 165's.
  - #7's title, once fixed, names what its test drives.

## The audit rules, after this run

- **The guide's base rule took in Story 8.1's Fix Now phases,** which an "8.3 to 8.7" range would have left unread. The story plans don't say which commits a mid-point audit should start from, so the tag decided.
- **One pass skipped part of its scope and said so.** Sending it back cost one short round. The persona already says to read every listed file at its lines. A pass that reaches a limit could say which files it left, as this one did, so the orchestrator can catch it.
- **The new structural rule held.** "A copy that still agrees and has one caller doesn't pass" settled #18 without a judgment call.
- **The passes read an old instruction file's name.** Several notes said the root instructions point at a `workflow/CLAUDE.md` that doesn't exist. On disk both files are `AGENTS.md` and they agree; the passes had an older copy in their context. No finding came of it.

---

## Close-out

Filled in as the audit closes. One row per required finding (#1–#11).

| #   | Disposition | Where it landed (routes) |
| --- | ----------- | ------------------------ |
|     |             |                          |

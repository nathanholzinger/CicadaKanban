# Code Quality Audit — Epic 3.5 Story 7

**Range:** `a6-rerun-audited..da2bf56`, 18 commits. The base is the newest `*-audited` tag (`git describe --tags --match '*-audited' --abbrev=0`), on `7ccb35b`. The end is Story 7 Phase 5. Nathan tags the end commit `epic-3-5-story-7-audited`.

**What the range holds:** A6's batch 6 (6a–6g), the Fix Now batches of the A6 re-run, and the Reconciler's two commits after it. Story 7's plan says its range takes these in (Phases, "After Phase 5"). Then come Story 7's planning commit and its Phases 0–5:

- the resizable sidebar;
- the deep seed and the section's cut-off at a set number of levels, with the overflow row;
- the hierarchy modal, opened by a click and by a hold during a drag;
- both depth caps raised to 12.

The range also adds `scripts/audit-scope/`, the scope script this audit used for the first time.

## How the range sorted

The scope came from `npm run audit:scope` (`docs/audits/epic-3-5-story-7-scopes/`). It found 132 files to read:

- 7,192 changed lines;
- 37 removal sites;
- 128 moved lines left out.

72 files were marked read whole: the 30 new files, and 42 files with 10 or more changed lines of code. Of the new files, 22 are the scope script and its tests, plus the two `.env.deep` files. The config added no `readWhole` marks of its own.

**The split.** The seven default area groups (C1 the drag layer, C1t its tests, C2 the rest of the client, S1 `server/src/` and root `CLAUDE.md`, S1t `server/tests/`, E2E `tests/`, T everything else) ran as 23 instances. The run used a config, `docs/audits/epic-3-5-story-7-scopes/config.json`. It splits the default config's `E2E-T` instance into an E2E instance and a T instance for every pass, because E2E and T together came to about 3,800 changed lines in 50 files: the new Story 7 specs, plus the 22 new script files.

- **Correctness & Security** and **Consistency & Drift:** seven each (C1, C1t, C2, S1, S1t, E2E, T).
- **Duplication & Abstraction:** five: client source, client tests, server, E2E, T.
- **File Responsibility:** four: client, server, E2E, T.

## How it ran

- **The passes ran cold.** Each got only its scope file. They ran in four waves, so that a usage limit couldn't stop them all at once.
- **Re-traced by hand** before going in the report:
  - #1, against `itemPositionScope.ts::positionScopeFor` and the seed's counter;
  - #2, through `BoardView.tsx`'s loading branch and `HierarchyModal.tsx`'s layout effect;
  - #3, against `workflows.ts` and the client's only caller;
  - #4, through `scan.mts::onlyMovedIn` and `diff.mts::removalSites`;
  - #5, #18 and #19, against the files;
  - #6, against `boxOf`'s transform subtraction;
  - #7, against `watchWrites`, which counts a request when it's sent;
  - #8, against TC-2.8's body.
  - The structural claims in #28–#31 were checked against both copies.
- **What the merge step read:**
  - Story 7's plan (`docs/planning/epic-3-5-stories/story-7-depth-cap-and-hierarchy-modal.md`): its Inbound deferrals (none), the Amendments for each phase, Open questions, the Code map, and the Living-docs handoff;
  - the A6 plan's handoff entries that name `project-sidebar.spec.ts` (#27);
  - `api-contract-zod-openapi.md`, for what the API contract epic already covers (#19, #53);
  - the wiki passages the correctness findings touch: item-positioning §2, board-drag-interaction §7.3 and §9, and row-references §1 and §2.

## Overall shape

**The Story 7 build traces correct in its core.** The correctness passes re-derived the overflow row's gaps against `gapIndexFor`, the depth clamp at the overflow level, the inverse in `modalPlacement.ts`, the hold's timer and its resets, and the collision scoping by `sectionCardId`. None of them turned up a defect. Every route change in A6's batch 6 holds. That covers the empty-string refusals and `isNamed`.

**What the findings are:**

- **One real defect in the modal (#2):** a modal opened by a hold can come back after a resync with no drag to place it, and sits at the window's top-left corner.
- **The deep seed (#1, #9):** it orders Free items by workphase, which breaks the rule it says it follows, and its test locks that in. Its depth claims also went stale when Phase 5 set the cap to the seed's own depth.
- **Two new E2E specs that can pass without testing their subject (#6, #7).** One older server test has the same problem (#8).
- **The scope script's first audit found its own bug (#4).** It can drop a removal site, which is the one list blame can't produce.
- **Comments the phases outgrew (#10–#22):** the drag layer's `CLAUDE.md`, the cue, the pop clocks and the modal shell each still describe the pre-modal code.
- **Copies made where a call would do (#28–#35).** The sidebar width's storage copy (#28) already behaves differently from the drag tuning's.

**Plan the batches in this order.** Correctness first: #1–#8. Then the structural fixes, before the comment fixes in the same files: #28–#35 rewrite lines that #12, #16 and #17 correct. Then the remaining drift, and the required notes (#23–#27).

---

## Fix Now — correctness

### 1. The deep seed numbers Free items per workphase, but a Free item's position scope is the whole workflow `[Correctness & Security (S1, S1t) + Consistency & Drift (S1t) + Duplication & Abstraction (server)]`

- **Where:**
  - `server/src/db/deepSeed.ts:235-241` (`freePositions`, `nextFreePosition`, keyed by workphase), `:264`, and the comment at `:235`.
  - `server/tests/lib/deepSeed.test.ts:50` (the title, "as the API would write them … Free ones are ordered by workphase") and `:68-72`, which asserts that `workphaseId:position` is unique.
- **Problem:** a detached or root item's scope is every workphase of its workflow (`itemPositionScope.ts::positionScopeFor`). The seed keeps a counter for each workphase. The test checks the seed's rule rather than the API's, so it passes.
- **Failure scenario:**
  - In `deep.db`, the Todo Card "Replace the legacy invoice generator end to end" and `WIDE_CARD` in In Progress both get position 1, a tie in one scope that no API write produces.
  - On a column that covers both workphases, they order by `createdAt`. A drop between them names one as its neighbor. `resolveAfterTarget` then steps to the next row by `gt(1)`, and `resolveBeforeTarget` finds no row `lt(1)`, so the item lands one row away from where it was shown, and no reindex repairs the tie.
- **Fix:**
  - In the seed, give each Free item `resolveAppendPosition(items, positionScopeFor(…, tx), tx, [])` inside the existing transaction, or one counter shared by every Free item, since the seed has one workflow. The duplication pass prefers the first: it calls the shared position layer rather than copying its rule. Delete `freePositions` and `nextFreePosition`.
  - Assert that positions are unique among Free items.
  - Reword the test title and comment, and the comment at `deepSeed.ts:235`, to "ordered across the workflow".
- **Wiki:** breaks a rule in force, wiki item-positioning §2.
- Can ride along: #9, #36's Free-child item type, and the `P` wording at `deepSeed.ts:87-88` (Informational).

### 2. A hierarchy modal opened by a hold can remount with no drag running, and then sits at the window's top-left corner `[Correctness & Security (C1, C2)]`

- **Where:**
  - `client/src/components/BoardView.tsx:52, 108-113, 257-260, 401-409`;
  - `client/src/components/HierarchyModal.tsx:50, 125-134, 149`.
- **Problem:**
  - An open modal's `{cardId, anchor}` lives in BoardView's state for as long as the modal is open.
  - The modal renders at `UNPLACED` (`{left: 0, top: 0}`) whenever it has an anchor. Only its layout effect moves it from there, and the effect returns early when no drag session is running.
- **Failure scenarios:**
  - **(a) A resync after a release in the modal.** A release in a hold-opened modal leaves it open, as designed. If the move then fails, or a reply calls for a resync, `loadBoard()` sets `loading` and BoardView renders "Loading board…" in place of the board, which unmounts the modal. When the board comes back, `hierarchyModalOpen` still holds the anchor, so the modal remounts at (0,0), against the window's edge, with no drag to place it.
  - **(b) A release just after the hold runs out.** `useBoardDnd.ts::evaluatePop` calls `openHierarchyModalAt` from a timer or pointer handler, and the state update is committed later. A pointerup in that gap ends the session, so the commit that mounts the modal sees no session.
- **Fix:** decide once, at mount, whether the modal places itself at the cursor: `const [placesAtCursor] = useState(() => anchor !== null && session !== null)`. Use it both for `position` and as the effect's guard, so that a mount with no drag centers the modal as a click does.
  - Don't clear `anchor` in BoardView after placing. That flips `position` to `undefined`, which drops the hand-set `left`/`top` and moves the dialog.
- **Wiki:** breaks a rule in force, board-drag-interaction §7.3: a hold opens the modal under the cursor, and a click opens it centered. What a reload does to an open modal is DRAG-7.23, still `Pending PO`. Its lean, that the modal stays open on the reloaded hierarchy, is what the fix keeps. If the PO rules that a reload closes it instead, the fix becomes closing it.
- Can ride along: #36 (the placement's other early returns) and #75 (a `key` on the modal).

### 3. `POST /workflows` reads `templateId: ''` or `sourceWorkflowId: ''` as none, and creates a workflow with no workphases `[Duplication & Abstraction (server)]`

- **Where:** `server/src/routes/workflows.ts:110-121`, the `!templateId ||` and `!sourceWorkflowId ||` guards.
- **Problem:** an empty string skips the existence check. The route answers 201, and the new workflow has no workphases. The comment above says this guard exists to prevent exactly that.
- **Failure scenario:** an MCP agent or any API caller sends `{ name, projectId, templateId: '' }`. It gets a 201 and a workflow with no stages, and the project now owns it (a second create is a 409). The client never sends `''` (`SetupWorkflowModal.tsx` passes an id or nothing), so only the API can reach it.
- **Fix:** guard on `templateId !== undefined && templateId !== null` (and the same for `sourceWorkflowId`), and call `lib/getOrNotFound.ts::existsById` in place of the inline lookups. Add a refusal test for each field.
- **Wiki:** breaks a rule in force, row-references §1 ("An id that no row has names no row, and so does an empty string"; "every write that takes such a field applies them") and §2. The API contract epic doesn't name this.
- Can ride along: #53.

### 4. The scope script drops a removal site when the same hunk also re-indents or reformats a line `[Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/scan.mts:154-164` (`onlyMovedIn`) and `scripts/audit-scope/diff.mts:53-64` (`removalSites`).
- **Problem:**
  - A hunk is a removal site only when it adds nothing, or adds only moved or blank lines.
  - The hunks come from `git diff -U0`, which counts whitespace. The changed lines come from `git blame -w --ignore-revs-file`, which doesn't. So a re-indented line is added in the hunk, but blame puts it before the base. It is neither changed nor moved, and its hunk is no site.
- **Failure scenario:** a commit unwraps a guard, `if (!exists) {` / `doThing();` / `}` → `doThing();`. That's one hunk, `-10,3 +10`. Blame `-w` puts `doThing();` before the base, so nothing is changed, nothing moved, and there's no site. If that is the file's only change, the file goes to no pass at all. A guard removed next to a line that a formatting commit re-quoted goes the same way. A removed guard is exactly what the removal-site list exists to catch.
- **Fix:** a hunk is a site when it removes a non-blank line and none of its added lines is in the settled `changed` list. That covers moved, blank and older-by-blame lines alike. Adding `-w` to the diff alone would miss the formatting-commit case. Add a guard-unwrap commit to `scan.test.mts`'s fixture.
- **Wiki:** none (repo tooling). It breaks `.claude/guides/audit-workflow.md`'s "What each pass gets": removal sites are where lines were removed with nothing new in their place.

### 5. `audit:scope` replaces git's error with a guess when the base can't be found `[Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/main.mts:34-42`, a bare `catch` around `git describe`.
- **Failure scenario:** `--end typo-ref`, a shallow clone, or a missing git all print "no tag ending an audit (*-audited) is reachable; give --base". The user adds `--base`, and only then sees git's real message.
- **Fix:** print git's `error.message` after the guess.
- **Wiki:** none (repo tooling).
- Can ride along: #77's `parseConfig` and `showAt` notes.

### 6. DRAG-7.11 measures the carried copy without its transform, so its "stays inside the list" check can't fail `[Correctness & Security (E2E)]`

- **Where:** `tests/ui/drag-7-hierarchy-modal.spec.ts:409-414`.
- **Problem:** `boxOf` subtracts every CSS transform on the element and its ancestors. dnd-kit's DragOverlay sits at the dragged row's starting rect and follows the cursor only by `transform`. So `boxOf` returns R2's starting row, which is inside the modal's list whatever is actually painted.
- **Failure scenario:** the clamp to the section breaks, and the copy is painted over P's Card left of the modal. All four `expect`s still pass.
- **Fix:** measure the overlay with `paintedBoxOf`, whose own comment says it's for "asserting where something is drawn". The list carries no transform, so either helper works for it.
- **Wiki:** board-drag-interaction §7.3 (the carried copy stays inside the modal's box), which the code keeps. The defect is in the spec.

### 7. DRAG-7.16's bottom-edge spec can read X before its write lands, and compares positions from two scopes `[Correctness & Security (E2E)]`

- **Where:** `tests/ui/drag-7-modal-hold.spec.ts:337-342`.
- **Problem:**
  - `watchWrites` records a request when it's sent (`projectTreeDrag.ts:7-13`), so the poll can resolve before the PATCH commits.
  - X starts as P's child, so a stale read passes `placed.parentId !== r.id` whatever the release wrote.
  - The fallback compares X's position among R's children with R's own position among Q's children, two scopes (wiki item-positioning §3). It holds today only because both are first in their scopes.
- **Failure scenario:** the release writes X as R's first child, which is what the case rules out. The read beats the commit, and the case passes.
- **Fix:** poll until `parentId !== p.id`, or wait on the PATCH response. Then compare against R1, as the file's other cases do.
- **Wiki:** board-drag-interaction §7.3, kept by the code. The defect is in the spec.

### 8. Four setup creates in `items.positioning.test.ts` aren't checked, and TC-2.8 can pass on a refused one `[Duplication & Abstraction (server)]`

- **Where:** `server/tests/routes/items.positioning.test.ts:463-465, 559-561, 618-620, 691-693`.
- **Failure scenario:** in TC-2.8, if the done item's create were refused, `doneItem.body.id` would be `undefined`. The move would send `{ side: 'after' }`, the route would answer 400 for having no intent, and the test would pass without testing the done-anchor refusal.
- **Fix:** use `createItem(…)` from `fixtures.ts`, which fails at its own line, and read `.id` and `.completedAt` off the body it returns. Lines 140 and 230 test the create itself, so they stay raw.
- **Wiki:** item-positioning (the done-anchor refusal), which the code keeps. The defect is in the test.

---

## Fix Now — drift

### 9. The deep seed's test and header say "past the depth caps", but at the cap of 12 the project chain only reaches it `[Consistency & Drift (S1t)]`

- **Where:** `server/tests/lib/deepSeed.test.ts:37-48, 86-99`, and `server/src/db/deepSeed.ts:1-5` ("goes past any depth cap").
- **Problem:**
  - Phase 5 set both caps to 12, the seed's own depth. The project chain reaches depth 12, which is legal, so it doesn't go past the cap.
  - The test asserts `deepestProjectDepth + 1 >= 12`, with a literal, where `itemTree.test.ts:107` reads the constants.
  - The last test's `projectsRes.body.length >= 12` is a count of projects, not a depth.
  - "Past any depth cap" is false for any cap above the seed's depth.
- **Fix:**
  - Import `ITEM_DEPTH_CAP` and `PROJECT_DEPTH_CAP`, and title the cases "to the caps".
  - Assert on a depth in the last case.
  - Reword the header to say the seed writes directly, so it isn't held to a cap. Items do go one level past the cap, and projects reach it.
- Can ride along with #1.

### 10. `ModalShell.tsx`'s header still says it is for centered modals only `[Consistency & Drift (C2) + File Responsibility (client)]`

- **Where:** `client/src/components/ModalShell.tsx:1, 24-29`.
- **Problem:** the shell now takes `position`, `dialogRef` and `dialogProps`, and `HierarchyModal` places itself through them.
- **Fix:** "every modal wraps this; it centers the dialog unless given a `position`."

### 11. `hierarchy.test.ts` says the sidebar passes `getDepth` to `isWithinDepthCap`; it passes the projection's depth `[Consistency & Drift (C2)]`

- **Where:** `client/src/lib/hierarchy.test.ts:53-57`.
- **Problem:** only the board calls `getDepth` (`dragClassification.ts:79`). The sidebar passes `projected.depth` (`useProjectDragReorder.ts:80`).
- **Fix:** name the board for `getDepth`, and the projection's depth for the sidebar.
- The pass tagged this Watch List. It's a comment that's wrong about the code, so it's Fix Now here.

### 12. `ZoomCue`'s comment describes only the Card's zoom-in cue `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/dragChrome.tsx:142-155`.
- **Problem:** the comment says the cue is timed by `cardPopInDelayMs`, shown when `useZoomCandidatePhase` returns `'cue'`, and reset by `popSession.ts::namedCardCandidate`. `OverflowRow` now passes `modalHoldCueMs`, with its own phase (`useModalHoldPhase`) and its own reset (`nextModalHold`).
- **Fix:** describe `cueMs` as the caller's clock, and name both callers.

### 13. `dragRegions.ts` names two readers of `descendantsCardIdOf` as if they were all of them `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/workflow/dragRegions.ts:207-210` ("that … both ask").
- **Problem:** `useBoardDnd.ts` asks it too, in `levelsDrawnAt`, `evaluatePop` and `readModalPlacement`.
- **Fix:** "also read by", or drop the list.

### 14. `popDueAt`'s comment lists three pending clocks; the modal hold is a fourth `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/workflow/popSession.ts:388-399`.
- **Problem:** "At most one of {a locked pop-out, a locked zoom-in, a Board-layer pop-in}" and "one expression … covers every layer alike". Line 403 now returns `modalHoldDueAt(…)` ahead of the hover clock.
- **Fix:** add the modal hold, with its own clock, which runs only while `hover` is null.

### 15. The drag layer's `CLAUDE.md` gives an item row's registration two roles; it has three `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/workflow/CLAUDE.md` ("Every item row shares one dnd-kit registration", and "A Card row and a Stub row both register through `dragChrome.tsx::useItemRow`").
- **Problem:** `ItemRowRole` is `'card' | 'stub' | 'overflow'`, and the data carries `sectionCardId`. `OverflowRow` registers through `useItemRow` too. The same file's "Row data" bullet already says so, so the file contradicts itself.
- **Fix:** name the three roles and `sectionCardId`, and the overflow row among `useItemRow`'s callers.
- Ride-along (Informational): `dragChrome.tsx`'s header, the `useItemRow` comment and `ItemRowOptions.parentId` ("A Stub row's own parent") are silent on the overflow row, which passes its owner as `parentId`.

### 16. `StubBody` and `STUB_ROW_BOX_CLASS` each name a fixed set of users that has grown `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/StubRows.tsx:17-22` ("Extracted so the three can't drift apart"), and `client/src/components/cardMetrics.ts:49` ("The box all three Stub rows share").
- **Problem:** `StaticStubRow` is a fourth user of `StubBody`. The box class also feeds `OVERFLOW_TEXT_CLASS`, `StaticStubRow` and `OVERLAY_STUB_CLASS`.
- **Fix:** drop the counts.

### 17. `descendantsProjection.ts` documents `sectionLevels` as the tuning value, and gives a premise the cut-off removed `[Consistency & Drift (C1)]`

- **Where:** `client/src/components/workflow/descendantsProjection.ts:57`, and `:211-213`.
- **Problem:**
  - `useBoardDnd.ts::levelsDrawnAt` passes `Infinity` for the Card whose modal is open, so `sectionLevels` isn't always the tuning value.
  - The release comment says "with the whole hierarchy shown, no unseen item can sit between its neighbors", but a section now cuts off. The identity result still holds, for another reason: the gap is counted among all the rows.
- **Fix:** at line 57, "how many levels the section draws (the tuning value, or `Infinity` in the hierarchy modal)". At lines 211-213, "the gap is counted among all the section's rows".

### 18. `scan.test.mts` asserts against a section the scope files never write `[Consistency & Drift (T)]`

- **Where:** `scripts/audit-scope/scan.test.mts:338`, `assert.doesNotMatch(scope.text, /Code moved here/, …)`.
- **Problem:** `renderScope` writes no such section, and the string appears nowhere else, so the assertion can't fail. It reads as a guard that no scope lists moved lines.
- **Fix:** assert that no scope names the moved-from file as a source, or delete the line. Line 337 already checks `receiver.ts`'s lines.

### 19. `move-project.bru` says both neighbors are verified; the route checks only `prevId` when both are named `[Consistency & Drift (T)]`

- **Where:** `bruno/projects/move-project.bru:28-31`; `server/src/routes/projects.ts:242-253`.
- **Fix:** "the neighbor the move names is verified; when both are named, `prevId` is used and `nextId` is not checked". Whether that pair should be refused is `api-contract-zod-openapi.md`'s Story 1 ("The schema decides whether that's refused").

### 20. A DRAG-7 spec's comment counts R's children as three, and the assertion below it says two `[Consistency & Drift (E2E)]`

- **Where:** `tests/ui/drag-7-overflow-row.spec.ts:190` ("R keeps its three children") against line 196 (`'2 children'`).
- **Problem:** R has R1 and R2 attached, and F is Free. The overflow row counts attached children only.
- **Fix:** "R keeps its two attached children".

### 21. A DRAG-7.10 title promises a second pop the case doesn't drive `[Consistency & Drift (E2E) + Correctness & Security (E2E) + Duplication & Abstraction (E2E)]`

- **Where:** `tests/ui/drag-7-hierarchy-modal.spec.ts:297`, "…; a second pop detaches".
- **Problem:** the case ends at the first pop, and asserts R2 set back down. The detach is the next case (line 326).
- **Fix:** drop "; a second pop detaches". The `DRAG-7.10:` prefix stays.

### 22. Two unit tests carry DRAG-7.16, a case they don't cover; their rule is DRAG-7.10's `[Consistency & Drift (C1t)]`

- **Where:** `client/src/components/workflow/dragStructure.test.ts:238` and `popSession.test.ts:153`.
- **Problem:** both test that the modal's dialog is the layer's bounds, so a cursor over its header is still inside. DRAG-7.16 is "a modal kept inside the window at an edge reads the ghost afresh". The plan's handoff (Phase 4) puts the header rule under DRAG-7.10's box, and so does the E2E spec that covers it.
- **Fix:** retitle both `DRAG-7.10:`. The pass tagged this Watch List; it's Fix Now here, since a wrong ID maps the case to the wrong tests.

### 23. Board-drag-interaction §9, now built, has no wiki pointer at its enforcement site `[orchestrator, from the plan's handoff]`

- **Where:**
  - `client/src/components/workflow/itemListOps.ts:302-306`, `sectionEntries`, where the cut-off and the overflow row are enforced;
  - `client/src/components/HierarchyModal.tsx:1-11`, the modal's header.
- **Problem:** the handoff lists §9's set number of levels, the overflow row and its count (Phase 2), and the click-opened modal (Phase 3), as Planned passages now built. No code cites `wiki board-drag-interaction §9`. The other built passages (§3.1, §7, §7.1, §7.3) have pointers.
- **Fix:**
  - Add `(wiki board-drag-interaction §9)` to `sectionEntries`'s comment and to `HierarchyModal.tsx`'s header.
  - `sectionEntries` is also the site of item-attachment §12's set-number bullet, so it can carry `wiki item-attachment §12` too.
  - Required, under `.claude/guides/code-comments.md` rule (c).

### 24. Ruling to record: the reseed keeps `slotHidden` on purpose `[Correctness & Security (C1)]`

- **Where:** `client/src/components/workflow/descendantsProjection.ts:161-166`, `reseedProjection`.
- **Ruling:** looks wrong but isn't. Carrying `slotHidden` into the modal means a release at the Stub's true original slot sends a move that changes nothing. Clearing it would be worse: `ownSlotOf` would then read the placement-aware rows, where the Stub sits at its previewed last-child slot, and a real move there would be dropped as "own slot".
- **Fix:** a one-line rule (f) reason beside "The hold's own reading is dropped, and nothing else": `slotHidden` stays because the rows `own` is read from still place the Stub as the Card's last child.

### 25. Ruling to record: the sidebar resize spec drives its handle by hand `[Duplication & Abstraction (E2E) + Consistency & Drift (E2E)]`

- **Where:** `tests/ui/project-sidebar-resize.spec.ts:20-26`, `dragHandleBy`.
- **Ruling:** deliberately separate. It isn't a dnd-kit drag, and `dragGesture.ts::pickUp`'s +10px activation nudge would move the handle and change the width being measured.
- **Fix:** a one-line rule (f) reason at `dragHandleBy`, or move it to `ProjectSidebarPage.resizeBy(dx)` with the same note.

### 26. The overflow-row press case hand-rolls a drag and copies `dragMachine` `[Duplication & Abstraction (E2E) + Consistency & Drift (E2E)]`

- **Where:** `tests/ui/drag-7-hierarchy-modal.spec.ts:532-537`.
- **Problem:** root `CLAUDE.md`: never hand-roll a drag in an E2E spec. `pickUp` makes no claim that a drag started, so it fits a case that asserts nothing picks up.
- **Fix:** `pickUp(page, overflowRow(page, r.id))`, `hoverTo`, `expect(dragMachine(page)).toHaveCount(0)`, `release`.
- Ride-along: `drag-column-bands.spec.ts:188` copies `dragMachine` too.

### 27. `project-sidebar.spec.ts` still creates projects by hand `[Duplication & Abstraction (E2E)]`

- **Where:** `tests/ui/project-sidebar.spec.ts:18, 44, 65-67`. `tests/ui/boards-layer.spec.ts:239` posts a board by hand the same way.
- **Problem:** root `CLAUDE.md` says never to hand-roll E2E setup: a refused create lets the test carry on from the wrong state. A6's batch 6e left both spots, since neither was in that report, and asked whether to take them in a later batch (`docs/archive/a6-audit-guidance-and-first-run.md`, the batch 6e notes). Nothing routed them, so they come back here.
- **Fix:** `seedProject` / `seedProjects` (lines 65-67 become one `seedProjects` call), and the board through `seed.ts`. Drop the `API` import.

---

## Fix Now — structural

### 28. The sidebar width's storage copies the drag tuning's, and the copies already behave differently `[Duplication & Abstraction (client src, client tests)]`

- **Where:**
  - `client/src/components/sidebar/sidebarWidth.ts:12-25, 34-54`;
  - `client/src/components/workflow/dragTuning.ts:98-111, 116-139`;
  - the two test fakes, `sidebarWidth.test.ts:14-27` and `dragTuning.test.ts:10-19`.
- **Problem:** `WidthStorage` is `TuningStorage` under another name, and `browserStorage()` is copied line for line. The new copy guards `getItem` and `setItem` ("a full quota, blocked site data"); the old one doesn't. So a refused write throws out of `saveDragTuning`, through `BoardView.tsx:56-59::setDragTuning`, an unguarded `onChange` handler. A fix landed in one copy and not the other.
- **Fix:** one module, for example `client/src/lib/browserStorage.ts`: the storage interface, `browserStorage()`, and a guarded read and write. Both modules call it, and `dragTuning.ts` picks up the guard. One memory-storage fake in `client/src/test/`, with a refusing variant, for both test files.
- Optional ride-along: `App.tsx:35-89` and `useBoardManagement.ts:17, 36` call `localStorage` directly (older code).

### 29. `splitLines` is copied in the scope script, and the scan pairs the copies' output line by line `[Duplication & Abstraction (T)]`

- **Where:** `scripts/audit-scope/scan.mts:69` against `scripts/audit-scope/lineKinds.mts:29` (inside `cover`) and `:81`.
- **Problem:** `scan.mts:100, 145-150` index one copy's lines against the other's kinds, and the blame and hunk line numbers assume the same numbering. A change to one copy, such as handling a lone `\r`, pairs each line with another line's kind, silently.
- **Fix:** export `splitLines` from `lineKinds.mts`, the lower module, and call it in `cover`, in the non-script branch, and in `scan.mts`.

### 30. `modalPlacement.ts` writes out the row indent formula that `descendantsIndentPx` owns `[Duplication & Abstraction (client src)]`

- **Where:** `client/src/components/workflow/modalPlacement.ts:31-33` (`cursorXInList`) and `:38-40` (`depthAtCursor`), against `client/src/components/cardMetrics.ts:71`.
- **Problem:** the comment on `cursorXInList` names `descendantsIndentPx` and then copies its body. `descendantsIndentPx`'s own comment says it is "the one spelling every board render of it uses". The modal's rows are indented through it (`StubRows.tsx:97, 147`). If the formula changes, the modal places the cursor at one depth and reads back another, and nothing fails.
- **Fix:** `cursorXInList` returns `descendantsIndentPx(depth) + MODAL_CURSOR_INSET_PX`. `depthAtCursor` subtracts `descendantsIndentPx(0)` before dividing by the step, in place of its literal `- 1`.

### 31. `HierarchyModal.tsx` writes its own "rows that travel" check, where `travelingRowsFor` is the one reader `[Duplication & Abstraction (client src)]`

- **Where:** `client/src/components/HierarchyModal.tsx:66`, against `client/src/components/workflow/dragCollision.ts:308-315`.
- **Problem:** the drag layer's `CLAUDE.md` names `travelingRowsFor` as the one reader of `subtreeIds` for this question. `modalPlacement.ts::gapAtSlot` must give the gap that `dropAnchorFor` names, and `dropAnchorFor` reads `travelingRowsFor`. The copies differ in form (the modal's leaves out the active row and doesn't map overflow rows) but give the same result today.
- **Fix:** `placeAtCursor` passes `travelingRowsFor(session) ?? (() => false)`. At placement the context is always the Card's Descendants key, so the result is unchanged.
- Can ride along with #2.

### 32. `modalRowIds` copies `overflowTree.ts::sectionRows` `[Duplication & Abstraction (E2E) + File Responsibility (E2E)]`

- **Where:** `tests/ui/drag-7-hierarchy-modal.spec.ts:49-54` against `tests/helpers/overflowTree.ts:60-67`.
- **Problem:** the same `evaluateAll` and the same `overflow:<owner id>` encoding, differing only in scope. A change to the encoding needs two edits.
- **Fix:** export `rowIds(scope: Locator)` from `overflowTree.ts`. `sectionRows` calls it, and `modalRowIds` goes.

### 33. `modalRow` copies `itemRow`'s selector, in two specs `[Duplication & Abstraction (E2E) + File Responsibility (E2E)]`

- **Where:** `tests/ui/drag-7-hierarchy-modal.spec.ts:46` and `tests/ui/drag-7-modal-hold.spec.ts:53`, against `tests/helpers/boardLocators.ts:30-32`.
- **Fix:** widen `itemRow` to take `Page | Locator`, as `article` does, and delete both copies.
- Can ride along: #47, and #61's Stub-handle locator.

### 34. `boards.spec.ts` writes out `seedTemplatedWorkflow` `[Duplication & Abstraction (E2E)]`

- **Where:** `tests/ui/boards.spec.ts:16-20`, against `tests/helpers/seed.ts:47-54`.
- **Fix:** `const { project, workflow } = await seedTemplatedWorkflow(request, 'My First Project');`. The extra `description` is never read.

### 35. A `dragStructure` test builds by hand what `buildCardInColumn` builds `[Duplication & Abstraction (client tests)]`

- **Where:** `client/src/components/workflow/dragStructure.test.ts:220-221`, against the helper at line 69 of the same describe.
- **Fix:** call the helper.

---

## Routed to a story's plan

None.

---

## Watch List

### 36. The modal's other early returns also leave it unplaced and the drag unreseeded `[Correctness & Security (C2)]`

`client/src/components/HierarchyModal.tsx:62-73` (`!projection`, `!spotRow`). If the active row has no row in the modal's entries, `placeAtCursor` returns null. The dialog then stays at (0,0), `onPlaced` never runs, and the drag reads depth against the section's indents, with nothing logged. It can't be reached today. **Fix:** on a null result, fall back to centering (or to `placeModal` with the spot at the dialog's middle), warn, and report a reading derived from the cursor. Can ride along with #2.

Also on the deep seed, Informational, can ride along with #1: `deepSeed.ts:244, 258, 272`. A Free child's `level` isn't 0 as the comment says, so F and G get an attached child's type. Fix the call (`kindAt(isFree ? 0 : level)`) or the comment.

### 37. Two DRAG-7.10 cases read the database straight after the release `[Correctness & Security (E2E)]`

`tests/ui/drag-7-hierarchy-modal.spec.ts:350-353` reads R2 with no poll, where the same file polls at 185, 211, 441 and 515: it may fail intermittently. Line 322 expects no write but has no `watchWrites`, so a late wrong write is missed. **Fix:** `expect.poll` at 350, and at 322 `watchWrites` with `expect(writes).toEqual([])`.

### 38. One-shot DOM reads right after the action that renders them `[Correctness & Security (E2E)]`

`drag-7-hierarchy-modal.spec.ts:119, 124, 465`; `drag-7-overflow-row.spec.ts:92`. `evaluateAll` doesn't wait, so these may fail intermittently, but never pass falsely. **Fix:** `await expect(modal).toBeVisible()` first, or `expect.poll`.

### 39. ATT-11.2 clicks the centre of a Card that holds a Stub `[Correctness & Security (E2E)]`

`tests/ui/attached-children.spec.ts:444`. If the centre lands on "Doomed Stub", the Stub's panel opens and the case deletes the Stub. **Fix:** click the Card's title.

### 40. Unchecked setup delete `[Correctness & Security (E2E) + Duplication & Abstraction (E2E)]`

`tests/ui/workflow-creation.spec.ts:95`. A refused delete fails the case later, with a message that points away. **Fix:** assert `.ok()`. `attached-children.spec.ts:95` and `drag-column-bands.spec.ts:111-112, 345-346` are other raw setup writes; `seed.ts` has no delete or update helpers yet.

### 41. `resetTestDb` keeps every item type a test creates `[Correctness & Security (S1t)]`

`server/src/db/resetTestDb.ts:28-43`; the shared `fixtures.ts::createItemType` (70-75) is now used at `items.test.ts:127, 677`. Types build up across runs, though `/api/test/reset` says it clears all user data. **Fix:** delete item types other than the three seeded ids.

### 42. The test route for a project's parent answers 500 for an id that names no project `[Correctness & Security (S1t)]`

`server/src/routes/testHelpers.ts:74-81`. The FK throws, and the global handler answers 500. **Fix:** check that the parent exists, and answer 400.

### 43. The scope script's diffs inherit the user's git config `[Correctness & Security (T)]`

`scripts/audit-scope/scan.mts:85, 143`; `git.mts:10-18`. With `color.diff=always`, `HUNK_HEADER` never matches and every removal site disappears. With `diff.external`, the unified diff is replaced. **Fix:** `--no-color --no-ext-diff`. In `scan.test.mts`, point `GIT_CONFIG_GLOBAL` at an empty file. Can ride along with #4.

### 44. A copy beside a move is hidden as moved `[Correctness & Security (T)]`

`scripts/audit-scope/moves.mts:63-67`. Blame merges a moved block and an adjacent copied block into one run. `contains(source, run)` is false, so the copy counts as moved too, and the duplication pass never sees it. **Fix:** test the run in windows of `MOVE_MIN` code lines.

### 45. A re-run leaves the last run's scope files in place `[Correctness & Security (T)]`

`scripts/audit-scope/main.mts:51-53, 70`. An instance that comes out empty prints "no scope file written", but the old file stays in `--out`. **Fix:** clear `scope-*.md` in `--out` first, or refuse a folder that isn't empty.

### 46. A press in an overflow row's indent gutter picks up the Card; the comment says a press goes no further `[Consistency & Drift (C1)]`

`client/src/components/StubRows.tsx:129-133, 145-168`, and the drag layer's `CLAUDE.md` ("a press on it goes no further than the row"). Only the inner button stops the press. The wrapper's indent, `descendantsIndentPx(row.depth)`, bubbles to the Card's listeners. A Stub row's gutter behaves the same way, so the row is consistent with its siblings, and the comment overstates. What a press on the overflow row does is DRAG-7.22, `Pending PO`. **Fix:** narrow the comment to "a press on its label", or stop the press on the wrapper if the PO's ruling covers the whole row.

### 47. New specs spell `data-drag-region` and `data-drag-overlay` as literals `[Duplication & Abstraction (E2E)]`

`drag-7-hierarchy-modal.spec.ts:395, 397, 410, 507`, `drag-7-modal-hold.spec.ts:393, 433`, where `overflowTree.ts:61`, `drag-card-zoom-in.spec.ts:53-55` and `drag-column-bands.spec.ts:351, 637` use `DRAG_REGION_ATTR`, and `dragGesture.ts:81` uses `DRAG_OVERLAY_ATTR`. A rename in `dragRegions.ts` would type-check and leave the literals aiming at nothing. **Option:** a `region(scope, key)` locator in `boardLocators.ts`, and an exported overlay locator. Can ride along with #6 and #33.

### 48. The deep database's path is written twice, and `seed:deep` doesn't read the env file `dev:deep` reads `[Duplication & Abstraction (T)]`

`server/.env.deep:3`, `server/src/db/deepDbPath.ts:7`, `server/package.json:7-8`. **Option:** `seed:deep` runs with `--env-file=.env.deep`.

### 49. The scope script's config parses an instance spec twice, and an unknown kind falls through `[Duplication & Abstraction (T)]`

`scripts/audit-scope/config.mts:95, 112`. `C2:tests` passes the check and takes the whole group. **Option:** one `parseSpec` that refuses an unknown kind.

### 50. "Only the drift pass gets deleted and renamed paths" is written twice in `buildScopes` `[Duplication & Abstraction (T)]`

`scripts/audit-scope/scopes.mts:116-117, 136`. **Option:** compute each pass's lists once.

### 51. Two places decide what a `CLAUDE.md` file is `[Duplication & Abstraction (T)]`

`scripts/audit-scope/classify.mts:25` and `scripts/check-docs/files.mts:104-106`. **Option:** export the predicate from `files.mts`, which `lineKinds.mts` already imports from.

### 52. Copying workphases into a new workflow is written three times `[Duplication & Abstraction (server) + File Responsibility (server)]`

`server/src/db/deepSeed.ts:199-232`, and `server/src/routes/workflows.ts:146-166, 167-187`. They agree today; a new workphase column means three edits. **Option:** a `lib/` helper the route's two branches and the seed call. A seed can't import a route.

### 53. "A field that names no row" is checked several ways across the routes `[Duplication & Abstraction (server)]`

`items.ts:136, 140, 256`, `itemHierarchy.ts:233, 266`, `projects.ts:45` (`isNamed`), and `workflows.ts:94, 110-121`, which writes its own `existsById` three times. #3 is the copy that has drifted. **Option:** one `namesMissingRow(table, value)` beside `existsById`. The API contract epic's Story 2 moves every route's request onto schemas, so the remaining spellings may go there. Can ride along with #3.

### 54. Server test helpers that exist but aren't used, and some that don't exist yet `[Consistency & Drift (S1t) + Duplication & Abstraction (server)]`

- `items.test.ts` (moves at 402-492, puts at 335-387) and `items.attached.test.ts` (27-134, 158-253) still send raw requests that `fixtures.ts::move` and `put` wrap. The range moved four sibling suites onto the helpers.
- `items.positioning.test.ts:21-34`, `setupThreePhases`, is a near-copy of `fixtures.ts::setupWorkflow`; its `doneOverrides` parameter is never passed.
- `columns.test.ts` bypasses its own `postColumn` and `putColumn` (57, 227-274, 498-525), and so does `boards.test.ts:399`.
- No shared helper yet for reading an item by GET (five local copies and about 20 inline), for a project's move or edit (`projects.test.ts:47-49`, plus raw at `items.crossProject.test.ts:249` and `boards.test.ts:376`), or for the "both entry points" list (seven copies in `items.hierarchy.test.ts` and `items.workphase.test.ts`).

### 55. The modal's "every level" is a bare `Infinity` in two files `[Duplication & Abstraction (client src)]`

`HierarchyModal.tsx:123`, `useBoardDnd.ts:286-289::levelsDrawnAt`. **Option:** one exported constant beside `shownLevels`. Can ride along with #2.

### 56. A Card's section and the modal each assemble the sortable list, and `KanbanCard.tsx` carries about 70 lines of section wiring `[Duplication & Abstraction (client src) + File Responsibility (client)]`

`KanbanCard.tsx:172, 304-337`, `HierarchyModal.tsx:118, 160-168`. **Option:** a `useCardProjection(cardId)` hook, or a `CardSection` component beside `SectionRows`, if a third surface draws a section.

### 57. The dwell-then-cue hold timing is written twice in `popSession.ts` `[Duplication & Abstraction (client src)]`

`nextModalHold` and `modalHoldDueAt` (437-458) against `namedCardCandidate`, `popInDelayFor` and `popDueAt` (166-170, 300-316, 413-414). They agree today. **Option:** shared `holdPhase` and `holdDueAt` helpers.

### 58. `data-item-id` is a literal at the site that writes it and the site that queries it `[Duplication & Abstraction (client src)]`

`HierarchyModal.tsx:67`, `dragChrome.tsx:122`, `StubRows.tsx:149`. A rename leaves the modal unplaced (#36). **Option:** an exported `ITEM_ID_ATTR`, as `DRAG_OVERLAY_ATTR` is.

### 59. Client test fixtures repeated within and across suites `[Duplication & Abstraction (client tests)]`

- `dragCollision.test.ts`: the `CollisionSession` literal 8 times (79-266), which gained `descendantsCardId` in every copy in this range; and one row array twice (524-533).
- `descendantsProjection.test.ts:152-162`: `deepSample` is a second copy of `sample()`'s literal.
- The cut-off tree is in both `itemListOps.test.ts:262-274` and `descendantsProjection.test.ts:138-151`. The two suites test what "can't disagree" (the drag layer's `CLAUDE.md`), so the tree belongs in `client/src/test/`, as `popFixtures.ts` does for the pop suites.
- `hierarchy.test.ts`: one tree three times (26, 59, 81), and the cyclic list twice (75, 103).
- `popSession.test.ts`: `[A, P, descendantsP]` five times; line 365 writes out `startPopSession`'s result by hand.
- Can ride along with #22 (`popSession.test.ts`) and #35 (`dragStructure.test.ts`).

### 60. `dragCollision.test.ts`'s Descendants-scope test doesn't say candidates are limited to the context Card's rows `[Consistency & Drift (C1t)]`

Lines 73-77. It passes because every row carries `card-p`. **Fix:** add "of the context Card" to the title and comment.

### 61. E2E helper opportunities in the DRAG-7 specs `[Duplication & Abstraction (E2E)]`

- The open-the-overflow-board setup (about 30 cases), with a variant that also opens the modal.
- The "P's own box, left edge" aim point (6 sites).
- The two-pass hover, "rows slide aside, so aim again" (about 9 sites, plus copies inside `holdAt` and `dragTo`).
- Poll for a parent, then compare positions (about 15 sites).
- The Stub-handle locator, whose `exact` has started to drift in `drag-5-stub-detach.spec.ts`.
- Seeding a chain (3 loops).
- `seedLocalStorage`, copied from `seedDragTuning` at `project-tree-sidebar.spec.ts:209-212`.
- Three request watchers in three places.
- The sidebar delete sequence (`project-page.spec.ts:52-56`, `project-sidebar.spec.ts:54-58`). This one can ride along with #27.

### 62. `BoardView.tsx` holds the modal's state inline `[File Responsibility (client)]`

Lines 50-53 and 108-127. Every other concern there is a `workflow/` hook. **Seam:** a `useHierarchyModalState` hook beside `HierarchyModalContext.ts`; smaller, a pure `dragStateAttrs(session)` for lines 348-366. Do it when the modal gains state. If it moves, the drag layer's `CLAUDE.md` line "`BoardView.tsx` holds which Card's" moves with it.

### 63. `useBoardDnd.ts` keeps growing (788 lines) `[File Responsibility (client)]`

**Seams:** the overlay geometry (`collisionDetection`, `clampToContext`, `dragModifiers`, `overlayShape`, 395-489 and 773), and the release tail. Revisit near 900 lines.

### 64. `itemListOps.ts` has picked up a second concept, what a section draws `[File Responsibility (client)]`

Lines 269-328, with `hierarchyRows`. **Seam:** a `sectionEntries.ts` with its test block, if the section's vocabulary grows.

### 65. `drag-7-modal-hold.spec.ts` holds two concepts, and one case in `drag-7-hierarchy-modal.spec.ts` belongs elsewhere `[File Responsibility (E2E)]`

- The placement cases (DRAG-7.15–7.17, 247-404) and their three helpers could become `drag-7-modal-placement.spec.ts`.
- The overflow-row press case (`drag-7-hierarchy-modal.spec.ts:522-542`) belongs in `drag-7-overflow-row.spec.ts`. It can ride along with #26.
- `tests/helpers/dragGesture.ts` holds four concepts; its tuning seeding (237-294) is the clean lift if it grows again.

### 66. `server/tests/fixtures.ts` holds three concepts, and the deep seed mixes its data with its writes `[File Responsibility (server)]`

`fixtures.ts`: creators (8-121), readers (123-186), and direct-row writers (188-233), which gained three helpers in this range. The writers are the natural `rowFixtures.ts`. `deepSeed.ts`: the data (13-155) against the inserts (160-278); fine while a new tree is a data-only edit.

---

## Covered by

None. #19's question, whether a project move naming both neighbors is refused, is already `api-contract-zod-openapi.md`'s Story 1. #19 itself is only the doc.

---

## Informational

### 67. A `console.error` spy is restored only on its test's last line `[Correctness & Security (C1t)]`

`useColumnManagement.test.ts:51-59`, and `dragRequest.test.ts:288-295`. A failed assertion leaves the next test's errors silenced. `restoreMocks: true` in the client's vitest config would close both.

### 68. `seed:deep` deletes `deep.db` even while `dev:deep` has it open `[Correctness & Security (S1)]`

`server/src/db/seedDeep.ts:9`. On Linux the running server keeps the unlinked file; on Windows the delete fails loudly. A header line ("stop `dev:deep` before reseeding") covers it.

### 69. Wording slips that mislead nobody about behavior `[Consistency & Drift]`

- `deepSeed.ts:87-88`: the Card's title carries no `P ·`, though the comment implies the lettered titles include it. Can ride along with #1.
- `drag-7-modal-hold.spec.ts:458`: "X is a child of R at depth 5" means placed under R.
- `sidebarWidth.ts:7`: sized for depth 10 while the cap is 12. The plan already has this (Open questions, For Nathan).
- `HierarchyModalContext.ts:1-4`: only the Card reads the context; the overflow row gets `onOpen` as a prop.
- `itemListOps.ts:239-245` and `itemListOps.test.ts:202`: `hierarchyRows` names two consumers; `HierarchyModal.tsx` is a third.
- `useBoardDnd.ts:404-407` and `AttachedChildRow`'s comment: silent on overflow rows and `sectionCardId`.
- `dragCollision.test.ts:313-320`: the ghost-height header could add "or an overflow row".
- `popSession.ts:420-421` splits a `` `dragCollision.ts::dropAnchorFor` `` reference across a line, so `check:docs` can't read it.
- `scripts/audit-scope/config.mts:39`: `AttachGhostRow` names no file; the component lives in `StubRows.tsx`.
- `server/tests/fixtures.ts:106`: the local `created` shadows the module's `created()` helper.
- `deepSeed.test.ts` sits in `server/tests/lib/` but tests `server/src/db/`. See the notes for the guide's owner.

### 70. Unchecked setup moves in server tests `[Correctness & Security (S1t)]`

`items.crossProject.test.ts:64-66`, `items.hierarchy.test.ts:382, 749-752`. A refused move fails later with a TypeError rather than the status. Asserting `.status` would fix it.

### 71. The scope script's file shape `[File Responsibility (T) + Consistency & Drift (T)]`

Every module owns one concept and its header matches. `main.mts`'s CLI tests are split between `args.test.mts:36-51` and `scan.test.mts:345-379`; a `main.test.mts` would hold both if they grow. `scan.mts::INCLUDE` sits beside the scan though `config.mts` owns the other run settings. Not worth moving.

### 72. Repeats in the scope script considered and left `[Duplication & Abstraction (T)]`

- whitespace normalizing (`moves.mts:12`, `lineKinds.mts:106-107`);
- each file parsed several times (runtime only);
- test one-liners (`errorOf`, `lines`);
- `scan.test.mts`'s three `spawnSync` calls and its second git runner;
- the `R`/`D` filters in `scan.mts`;
- the two CLIs' entry and argument patterns;
- identical correctness and drift instances in `config.mts`;
- the deep ports in two env files.

### 73. Client repeats considered and left `[Duplication & Abstraction (client src, client tests)]`

- child-count pluralization (`StubRows.tsx:126`, `KanbanCard.tsx:288`);
- `sectionEntries`'s small child map;
- `gapAtSlot`'s own gap reading (its comment gives the reason);
- the two pointer sensors;
- the static overflow row's wrapper;
- the hook tests' minimal boards;
- `fakeDomRect`, deliberately not `mockRect` (its comment gives the reason);
- `positionedWrite.test.ts`'s inline responses;
- `itemListOps.test.ts`'s 4-item tree, twice.

### 74. Server repeats considered and left `[Duplication & Abstraction (server)]`

- the two chain seeders, whose comments record the difference;
- the item-type ids copied from migration `0001`;
- the two database-file wipes;
- the two near-threshold setups.

The seed's Free child workphase (`node.workphase ?? 'Todo'`) is `itemHierarchy.ts::resolveCreate`'s rule in a copy that agrees today. It goes with #1's fix if that moves the seed onto the shared layer.

### 75. A hold-opened modal reads its placement inputs one render late on any re-run `[Correctness & Security (C2)]`

`HierarchyModal.tsx:125-134` with `BoardView.tsx:401-409`. `useLatest` updates in a passive effect. Unreachable today: leaving the modal closes it before another hold can fire. `key={hierarchyModalOpen.cardId}` would make "once per open" structural. Can ride along with #2.

### 76. A hold-opened modal keeps its pixel spot after the drag ends `[Correctness & Security (C2)]`

It can sit partly outside a window that shrinks while it stays open. Cosmetic.

### 77. `parseConfig` checks keys but not value shapes, and `showAt` returns null on every failure `[Correctness & Security (T)]`

`config.mts:70-92`, `git.mts:20-27`. A string `readWhole` silently marks nothing. A bad regex throws outside the config try. Can ride along with #5.

### 78. Other confirmations from the passes

- the deep stack's env files, the seed's path guard, and `ENABLE_TEST_ROUTES` (unset in both `.env.deep` files);
- A6's empty-string refusals and `isNamed`;
- both caps at 12, with no copy of the value in code;
- the test-route guard;
- every removal site;
- the large but single-concept files: `popSession.ts`, `dragCollision.ts`, `StubRows.tsx`, `descendantsProjection.ts`, `projects.ts`, and the item test files.

---

## For other roles

These go to the Open questions of Story 7's plan at close-out, addressed to each role.

- **Test Reconciler:**
  - `popSession.test.ts:493-498` ("a layer change clears it") may not prove its case: the hold is already gone before the layer change.
  - `hierarchy.test.ts:76` asserts only that `getDepth` returns a number for a cycle.
  - `drag-7-modal-hold.spec.ts:341`: even with #7 fixed, `moved` holds for any write that keeps X out of R's first slot.
  - `deepSeed.test.ts:68-71` proves the wrong rule until #1 lands.
  - `boards.test.ts:365-385` (BCU-1.6) and `items.crossProject.test.ts:242-260` (TC-7.18, TC-7.20) build one scenario and assert overlapping outcomes.
  - DRAG-7.1–7.19 and DRAG-1.34 still read `Planned` in the test plans, though specs carry their IDs.
  - #6 and #7 bear on DRAG-7.11 and DRAG-7.16.
- **PO:**
  - item-attachment §12's set-number bullet still carries `**Planned:**`, now built.
  - item-attachment §8 grounds the cap on a 240px sidebar that is now resizable.
  - The handoff already lists both, for the close.
  - #2's fix follows DRAG-7.23's lean, and #46's wording waits on DRAG-7.22.
- **Owner of `.claude/guides/testing-strategy.md`:** the "Server lib" row covers `server/src/lib/`, while the new `server/tests/lib/deepSeed.test.ts` tests `server/src/db/`. Widen the row, or move the test.
- **Architect:** the root `CLAUDE.md` deep stack line is already in the plan (Open questions, For the Architect).

## The audit rules, after their first story audit

The plan asks whether anything in the finished rules still needs changing. Five things came up:

1. **The default split's E2E-T instance doesn't scale.** Story 7's specs and the new script came to about 3,800 changed lines in 50 files, so this run split them with a config. The default `config.mts` could give E2E and T an instance each, as this run's `config.json` does.
2. **The board group doesn't cover the modal.** `HierarchyModal.tsx` and `ModalShell.tsx` fell in C2, while the modal's drag logic is in C1. Two correctness passes found the same defect (#2) from either side, and C1 had to read outside its scope to trace it. Adding both files to `BOARD_COMPONENTS` would put the feature with one reader per lens. `AttachGhostRow` in that list names no file (#69).
3. **The script's removal sites have a gap (#4), and its git calls aren't isolated (#43).** Both decide what reaches the passes, so fix them before the next audit relies on the script.
4. **Tiering held up, with three corrections.** The E2E duplication pass tagged six Fix Now. One was a judgment call (#47) and went to the Watch List. Two passes tagged wrong comments Watch List (#11, #22), and they're Fix Now here. The persona's rule, that drift flags a comment only when it's wrong, could add: "a comment or test title that's wrong is Fix Now, however small".
5. **No lens bleed** beyond the expected overlap. One pass went past its lens: duplication-server's #3 is a correctness finding in a copy that drifted, which is that lens's own case. The passes kept "does it prove its case" to notes for the orchestrator.

---

## Close-out

Filled in as the audit closes. One row per required finding (#1–#35).

| #   | Disposition | Where it landed (routes)       |
| --- | ----------- | ------------------------------ |
| 6   | Fixed       | `31009c7`, the test follow-ups |
| 7   | Fixed       | `31009c7`, the test follow-ups |
| 8   | Fixed       | `31009c7`, the test follow-ups |
| 11  | Fixed       | `31009c7`, the test follow-ups |
| 20  | Fixed       | `31009c7`, the test follow-ups |
| 21  | Fixed       | `31009c7`, the test follow-ups |
| 22  | Fixed       | `31009c7`, the test follow-ups |
| 26  | Fixed       | `31009c7`, the test follow-ups |
| 2   | Fixed       | Batch 1, with #36 and #75      |
| 31  | Fixed       | Batch 1                        |
| 10  | Fixed       | Batch 1                        |
| 1   | Fixed       | Batch 2, with #9               |
| 9   | Fixed       | Batch 2, with #1               |
| 3   | Fixed       | Batch 2, with #52              |
| 19  | Fixed       | Batch 2                        |
| 28  | Fixed       | Batch 3                        |
| 30  | Fixed       | Batch 3                        |
| 35  | Fixed       | Batch 3                        |
| 12  | Fixed       | Batch 4                        |
| 13  | Fixed       | Batch 4                        |
| 14  | Fixed       | Batch 4                        |
| 15  | Fixed       | Batch 4                        |
| 16  | Fixed       | Batch 4                        |
| 17  | Fixed       | Batch 4                        |
| 23  | Fixed       | Batches 1 and 4                |
| 24  | Fixed       | Batch 4                        |
| 27  | Fixed       | Batch 5                        |
| 32  | Fixed       | Batch 5                        |
| 33  | Fixed       | Batch 5                        |
| 34  | Fixed       | Batch 5                        |
| 25  | Fixed       | Batch 5                        |
| 4   | Fixed       | Batch 6, with #43              |
| 5   | Fixed       | Batch 6, with #45 and #77      |
| 29  | Fixed       | Batch 6                        |
| 18  | Fixed       | Batch 6                        |

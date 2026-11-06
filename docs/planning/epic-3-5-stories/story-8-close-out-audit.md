# Epic 3.5 — Story 8's close-out audit: the drag's files, read whole

**Type:** audit story. Its Fix Now batches may change what a drag does, and they fall in Story 10's audit range (D4) · **Written:** 2026-11-05 by the Architect · **Sequenced:** after the Story 8.13 audit (`docs/archive/code-quality-audit-story-8-13.md`) closes, with its Fix Now batches committed; before Story 10

## Goal

Story 8 tuned the board's drag and the sidebar's over thirteen stories, 8.1 to 8.13, and each story's audit read the lines that story changed. This audit reads the files that make up a drag whole, once, for what no single story's range shows:
- logic repeated between the board's drag and the sidebar's, since 8.7 and 8.11 brought the board's cues and pickup to the sidebar;
- comments, module headers and the drag layer's `AGENTS.md` that still describe a design a later story replaced, such as the Card layer folded away in 8.1, the pickup's switch unwound in 8.8, or the ghost moved to the gap in 8.12;
- files whose shape has drifted as each story added to them.

It overlaps the story audits on purpose, as the epic-wide audit does (`.claude/guides/audit-workflow.md` §10).

**Out of scope:**
- **The E2E drag specs.** Story 10 reworks them, and its audit reads what it changes. The helpers they and Story 10 build on are in.
- **The server.** Story 8 changed it only in audit fixes to how a request's references are checked. The move path didn't change.
- **Story 8's other changes:**
  - the scope script and the docs checker;
  - the Unsorted bucket's Unknown status;
  - `App.tsx`, the API client and `types.ts`;
  - the item Sheet and the create caps from 8.13, except where they're in `HierarchyModal.tsx`;
  - the drag tuning panel, which is temporary.
- **Drag files Story 8 didn't change,** such as the server's position math, `itemWriteReconciliation.ts` and `BandGuides.tsx`. A pass reading a file in scope still follows its calls into them.

## Inbound deferrals

- **The board's item writes may have the Story 8.13 audit's #2 gap** (Story 8.13's plan, Amendment 8):
  - **The gap:** `useItemManagement.ts`'s tracker keeps writes in order per item only. Two items' answers fold in the order they land, so an older answer's `reindexed` pairs, or its own row, can overwrite a position that a newer answer for another item set.
  - **The sidebar's fix:** `useProjectCollection.ts::foldWrite`, with `positionSetBy` and `applyWriteResponse`'s `newer`, closes this for projects.
  - **Two mechanisms:** the board and the sidebar keep a write in order by different means. The board numbers each write and discards a stale answer; the sidebar queues each project's writes.
  - **For the orchestrator:** settle the gap with a probe (audit-workflow §8), tier it, and merge it with whatever the passes found in those two files. Both are in scope.
  - **Audit result (2026-11-05):** reproduced and merged as Fix Now #1 in `docs/audits/code-quality-audit-story-8-close-out.md`. Two failing client probes cover an older reindex pair overwriting a newer row and an older written row overwriting a newer reindex. Two passing real-API probes confirm both response sequences. The board needs currency across affected rows; its per-item tracker doesn't supply it. This handoff is settled as a finding, not fixed.

## Test-plan scope

Findings #1–#5 are this close-out's correctness work, not new Story 10 deferrals. The PO's four new passages still carry Planned markers, so their new cases are **Planned** until the PO clears those markers after the fixes land. Existing live cases retain their statuses. No automated coverage is claimed here.

| Finding / batch | Cases | Planner's disposition |
|---|---|---|
| #1 / 4b | **DRAG-6.29** (new, Planned) | Cross-item response currency: both an older reindex pair over a newer written row and an older written row over a newer reindex. Concrete saved positions and both answer orders; a fresh read is allowed when currency cannot be established. The board's position-bearing answers include drag, inline-create and Sheet paths. |
| #2 / 4c | **DRAG-1.37** (new, Planned); **DRAG-1.19** (extended, Open) | Zero-delay zoom/pop settles back in the column or sub-row, with another sample still able to zoom normally. The existing outward-cascade case explicitly keeps both outward pops in one sample, including zero clocks. |
| #3 / 4d | **TREE-1.1** (extended, Open) | Reuse the existing ghost/release case. Its added scenario moves `A` past `B` in `[A, B, C]`, stops, then releases without another movement: save `[B, A, C]`, parent `null`, anchor `B`, side `after`. |
| #4 / 4e | **TREE-4.14** (new, Planned) | An older initial read cannot restore a saved name, parent or order after another read exposed the sidebar and a write's answer was applied. The same obligation covers later refreshes. |
| #5 / 4f | **BCU-1.7**, **BCU-1.8** (new, Planned) | A late A load cannot replace selected B, end B's loading or complete B's waiting stop cue. A shared workphase edit begun on A refreshes B, including when its follow-up load starts after B was selected. |

**TREE-4.13** already states the sidebar's cross-project response rule and is unchanged. No duplicate sidebar case is added for #1. The new board case does not replace the per-item DRAG-6.5 or DRAG-6.7 cases. Test files and internal mappings remain the Coder's and Reconciler's work; the approval question below remains open.

## Decisions

**D1, which files.** A file is in when both hold:
1. **Story 8 changed it:** the range `epic-3-5-story-7-rerun-audited..<end>`. That tag (`3ede430`) is the newest `*-audited` tag before Story 8.1. The Story 7 fix commits between it and 8.1 add no file to the scope.
2. **It's part of a drag,** on the board or in the sidebar: the gesture, its targets, its cues, or how a released drag is drawn until its write is answered. A file's tests come in with it, and so do changed tests of unchanged drag modules, the drag fixtures and the E2E drag helpers. The E2E specs stay out for Story 10.

The config names each file rather than a directory, since a directory holds files of both kinds: `components/workflow/` also holds the board's CRUD hook, for one.

D1 applied at `e070ef1` (the Story 8.13 close-out commit):

| Group | Files | Lines |
|---|---|---|
| `board` | `components/workflow/`: `descendantsProjection`, `dragClassification`, `dragCollision`, `dragOverlayGeometry`, `dragRegions`, `dragRequest`, `DragSessionContext`, `dragStructure`, `dragTuning`, `forcedStop`, `ForcedStopContext`, `itemListOps`, `modalPlacement`, `placement`, `popSession`, `useBoardDnd`, `useForcedStop`, `useItemManagement`, and the directory's `AGENTS.md` | 4,614 |
| `surfaces` | `components/`: `BoardView`, `cardMetrics`, `dragChrome`, `ForcedStopCue`, `HierarchyModal`, `KanbanCard`, `ProjectSidebar`, `StubRows`. `components/sidebar/`: `projectTreeUtils`, `SortableProjectRow`, `useCollapsedProjects`, `useProjectCollection`, `useProjectDragReorder`. `lib/`: `dragTargets`, `hierarchy`, `hierarchyPlacement`, `positionedWrite`. `index.css` | 3,425 |
| `boardTests` | the tests of 14 `board` files, `itemWriteReconciliation.test.ts` (its module didn't change), `test/dragFixtures.ts`, `test/popFixtures.ts` | 5,228 |
| `surfaceTests` | the tests of 14 `surfaces` files (including `useProjectCollection` and `positionedWrite`), `BandGuides.test.tsx` (its component didn't change), `App.pendingMove.test.tsx` (a project move's pending state, through `App.tsx`) | 4,893 |
| `e2eHelpers` | `tests/helpers/`: `dragGesture`, `holdRequests`, `overflowTree`, `projectTreeDrag` | 631 |

That's 74 files, every one marked read whole. The added response-folding source and tests belong to the drag's pending-write behavior, including the Inbound deferral; they don't bring the rest of the Story 8.13 fixes into scope.

**D2, which passes read what.**
- **Source and the E2E helpers:** all four passes.
- **Unit tests and fixtures:** all four passes, subject to the scope script's usual classification (`AGENTS.md` and comment/title/import-only changes go to Drift alone). Correctness checks setup, fixtures and helper behavior; Drift checks titles, comments, conventions and test layers. What a test proves, missing case coverage and whether assertions prove the intended behavior remain the Reconciler's (audit-workflow §4). This doesn't bring the E2E specs or Story 10's spec rework into scope.
- **One Duplication instance holds the board's source and the sidebar's together,** since repetition between them is what this audit is most likely to find.

**D3, the split:** 13 instances, launched in batches of at most three workers alongside the orchestrator. The batches below fit the session's four total agent slots; wait for a slot before launching another instance. Each instance keeps its own scope and runs cold, regardless of launch order.

| Batch | Pass | Instance | Groups | Lines |
|---|---|---|---|---|
| 1 | Correctness | `board` | `board` | 4,257 (`AGENTS.md` is Drift's alone) |
| 1 | Correctness | `surfaces` | `surfaces`, `e2eHelpers` | 4,056 |
| 1 | Duplication | `source` | `board`, `surfaces` | 7,682 |
| 2 | Drift | `board` | `board` | 4,614 |
| 2 | Drift | `surfaces` | `surfaces`, `e2eHelpers` | 4,056 |
| 2 | File Responsibility | `source` | `board`, `surfaces`, `e2eHelpers` | 8,313 |
| 3 | Correctness | `board-tests` | `boardTests` | 5,228 |
| 3 | Correctness | `surface-tests` | `surfaceTests` | 4,893 |
| 3 | Duplication | `board-tests` | `boardTests` | 5,228 |
| 4 | Drift | `board-tests` | `boardTests` | 5,228 |
| 4 | Drift | `surface-tests` | `surfaceTests` | 4,893 |
| 4 | Duplication | `surface-tests` | `surfaceTests`, `e2eHelpers` | 5,524 |
| 5 | File Responsibility | `tests` | `boardTests`, `surfaceTests` | 10,121 |

**The rest of the range goes to an `out` instance in each pass, and those aren't launched.** The script exits 1 when a file a pass should read falls in no instance of that pass, so this is how the exclusion stays visible. The `out` scope files stay in the scope folder as the record of what was left out, and the report's opening says so.

**D4, the tag.** Nathan tags the end commit `epic-3-5-story-8-close-out`, without `-audited`.
- **Why:** the next audit's base is the newest `*-audited` tag (audit-workflow §2). If this audit's end carried one, the Story 8.13 audit's fixes to files outside this scope would fall in no audit's range.
- **What that gives:** Story 10's audit starts from the Story 8.13 audit's tag, and reads both audits' Fix Now batches.
- **Rebuilding the scope** takes `epic-3-5-story-7-rerun-audited`, this tag and the Config below.

**D5, what the merge step reads.** Every story in the range closed with an audit of its own, so the only plan audit-workflow §5 asks for is this one. The Covered-by destinations a drag finding is most likely to have are read too, so a finding already planned is tagged, not filed again:
- Story 10's plan (`story-10-dnd-automation-catch-up.md`): its Scope and Inbound deferrals;
- `epic-8-decisions.md`, "Deferred (not events-specific): the drag's final cues and the zoom-in morph, from Epic 3.5". It holds a cue's look, which is a working placeholder under the wiki's Open questions;
- the drag's tech-debt plans: `carried-copy-leaves-cursor.md`, `free-item-reparent-gesture.md`, and `ui-message-banners.md` for the forced stop's banner.

**D6, a finding the story audits missed.** Before calling a finding missed, establish both that the earlier pass read the relevant code (as changed lines or a read-whole file) and that the defect existed at that audit's endpoint. Then the report names the lens that missed it, as the epic-wide audit does (§10), so that agent's definition can be tightened. An old line made faulty by a later change elsewhere isn't evidence of an earlier miss. A finding in code no earlier pass read is an ordinary finding; where the historical evidence doesn't establish a miss, say so rather than attributing one.

### The fixes

D7 to D12 settle the report's Fix Now findings #1–#5 and the optional #17 and #19. The drift findings, #6–#15, need no decision: each says what its comment should say.

**D7, one record of which write set a row's position (#1).** The sidebar's `foldWrite` already numbers each write as it's sent. For each row, it keeps the number of the write whose answer last set that row's position (`writesSent`, `positionSetBy`). That bookkeeping moves to `lib/positionedWrite.ts`, beside `applyWriteResponse`, and becomes table-generic. It hands out a write's number at its send. At the answer, it names the rows a later-sent write has already set, which is the `newer` that `applyWriteResponse` takes, and records the rest as this write's. The sidebar's fold and the board's both use it, so the rule is written once: root `AGENTS.md`'s "One position math layer", and the report's "rather than adding a second folding algorithm". No duplication batch follows, since the rule is consolidated as it's fixed.
- **The board's per-item check stays.** It discards an older answer for the same item, whose other fields, such as `workphaseId` and `parentId`, are stale too. `newer` only protects positions. Its resync for a discarded answer's `reindexed` pairs stays as it is.
- **Each write the board sends is numbered at its send:** a drag in `writes.begin`, and an inline create in `handleCreateItem`.
- **The Sheet's answers are numbered as they land** (`handleItemUpdated`, `handleChildCreated`):
  - **Why:** the Sheet sends its own writes, from seven sites in four components, and passes only the answer up. Numbering them at their send would thread a number through every one of those sites.
  - **Why it's safe:** the Sheet covers the board while it's open, so the board sends nothing between a Sheet write and its answer. The one exception would be closing the Sheet and finishing a drag within a single local request.
  - **What's accepted:** that exception is the sidebar's accepted limit (Story 8.13's plan, Amendment 8), and the site states it.
  - **What it costs:** if it happened, a row's drawn position would lag until the next board load.
- **A board load leaves the record as it is.** An answer that lands after a load comes from a write the load either already holds, or one the server took after the load's read.

**D8, a sample enters each pop context once (#2).** `popSession.ts::transitionTo` carries the contexts this sample has been in, including the one it started in. A transition to one of them takes that context without evaluating the sample again, so a cycle stops in the context it started from.
- Outward cascades never revisit a context, so they're unchanged, and zero delays stay configurable.
- `useBoardDnd.ts`'s four-hop loop stays. It re-samples regions after each hop, which is a different job.

**D9, the sidebar's placement is resolved from every event that names a row (#3).** One function takes an event's `over` and `delta` and returns the gap and the projection.
- `onDragMove` and a new `onDragOver` both run it.
- The release runs it on the end event, and checks the cap against what it returns, instead of reading the last render's `gap` and `projected`. So a release can't save an older gap than the one the ghost shows (wiki project-tree §1).

**D10, the first project read is guarded like the others (#4).** `useProjectCollection.ts`'s first load goes through `refreshProjects`.
- A read that a later read superseded is dropped. React StrictMode's first run, in development, is one such read.
- A read that started before a write's answer was applied is read again.
- `loaded` turns true when the latest read is applied or fails.
- All three reads go through one reader, with no separate cleanup flag.

**D11, a reload shows the board selected when it runs (#5), as the PO ruled** (wiki boards-columns-unsorted §3). Every load reads the selected board when it starts, from a ref, not from the loader's closure.
- **The loader becomes a hook of its own,** `workflow/useBoardLoad.ts`, which `BoardView` composes as it does the other `workflow/` hooks. It takes the cue's `reloadStarted` and `boardDrawn` as callbacks. A forced stop starts inside the drag hook, so this is what lets a test hold a load and watch the cue without a drag (D13). About 50 lines move out of `BoardView.tsx`.
- **A handler begun on board A** that reloads after B is selected therefore reloads B. The boards one `BoardView` switches between share its workflow, so a workphase change made from A is B's too.
- **A load's effects:** it applies its result, ends the loading state and finishes the stop cue only while it's the latest load and its board is still selected.
- **Every caller is covered:** the selection change, the workphase and column handlers, and a drag's resync all call this one loader.

**D12, the Descendants section's own module (#17, #19).**
- **What moves:** `HierarchyRow`, `hierarchyRows`, `descendantsChildrenOf`, `shownLevels`, `EVERY_LEVEL`, `overflowRowId`, `overflowOwnerOf`, `OverflowRowData`, `SectionEntry` and `sectionEntries` move unchanged from `itemListOps.ts` to `components/workflow/descendantsSection.ts`, with their tests in `descendantsSection.test.ts`.
- **What stays:** `itemListOps.ts` keeps the ordinal placement and the list selectors, and its header says so.
- **Why it moves unchanged:** the scope script leaves code moved unchanged out of the next audit's scope. 4g's comment fixes land first, so the moved lines keep their text.
- **The fixture (#19):** the eleven-item overflow tree both suites build becomes one factory in `client/src/test/`, built on `makeItem`. Each suite adds its own changes to it, such as the projection suite's mover X.

**D13, each case's tests (Test-plan scope).** Each case's test is written at the layer its fix lives in. It's stamped with the case's ID as it's written, and asserts the whole case at that layer.

| Case | Batch | Tests | Counts by |
|---|---|---|---|
| DRAG-6.29 | 4b | `useItemManagement.test.ts` (new): both givens, each in both answer orders, with the order read through `getWorkphaseItems`. Also an inline create's and a Sheet answer's disclosed pairs, held to the same rule | Nathan's approval, 2026-11-06 |
| DRAG-1.37 | 4c | `popSession.test.ts`: the cycle settles in `K`, and in a sub-row; a later sample inside `P` zooms. `useBoardDnd.test.ts`: the sample completes, the drag goes on, and nothing is written | Standing category: drag-clock logic |
| DRAG-1.19 | 4c | `popSession.test.ts`: both pops in one sample, from either origin, against a merged column's body and against a sub-row, at set clocks and at zero; resting inside `K` pops once | Standing category: drag-clock logic |
| TREE-1.1, its new scenario | 4d | `useProjectDragReorder.test.ts`: a move still naming `A`, then an over naming `B`, then a release with no movement, sends `A` after `B` at the top level. `tests/ui/project-tree-drag.spec.ts`, beside the existing TREE-1.1 test: the same gesture in a browser, with `B, A, C` saved and kept after the answer and a reload | The E2E test, a surface test |
| TREE-4.14 | 4e | `useProjectCollection.test.ts`: both givens with the first read held, checking each render; also a later refresh's older read | Nathan's approval, 2026-11-06 |
| BCU-1.7, BCU-1.8 | 4f | `useBoardLoad.test.ts` (new, D11): BCU-1.7's four givens, with the cue's two callbacks standing in for the cue; BCU-1.8 both with B loaded and with B still loading | Nathan's approval, 2026-11-06 |

- **Nathan approved every hook test here as counting for its case** (2026-11-06), TREE-1.1's included. Whether a test covers its whole case or only part of it is the Reconciler's judgment.
- **Why only TREE-1.1 gets an E2E test:** #3 is about the order in which dnd-kit fires its events. A hook test can only assume that order, while a browser shows it. The others are about the order in which answers land. A hook test controls that exactly, and a browser would add only timing.
- **The E2E test uses the helpers:** `projectTreeDrag.ts` and `dragGesture.ts`, as root `AGENTS.md` requires. It's shown failing before the fix, which is the probe rule (audit-workflow §8).
- **The Planned cases stay Planned** until the PO clears their passages' markers at close (step 5). The Reconciler maps them after that.

## Work, in batches

1. **The scope,** once the Story 8.13 audit's fixes are committed:
   - Freeze the committed end hash. Save the Config below as `docs/audits/story-8-close-out-scopes/config.json`, and run `npm run audit:scope -- --out docs/audits/story-8-close-out-scopes --base epic-3-5-story-7-rerun-audited --end <end-hash> --config docs/audits/story-8-close-out-scopes/config.json`.
   - **Check the `out` scopes for a file D1 takes in.** The groups are D1 applied at `e070ef1`, including the Story 8.13 audit's relevant fixes. If the chosen end adds another file D1 takes in, add it to its group and to `readWhole`, then rerun. Refresh the file and line counts for that endpoint.
   - Write the range down, and Nathan tags its end (D4).
2. **The passes,** in D3's launch batches of at most three workers, each given its scope file alone (audit-workflow §3).
3. **Reconcile, and write the report** to `docs/audits/code-quality-audit-story-8-close-out.md` (audit-workflow §5, §7), with D5 and D6.
4. **The Fix Now batches** (audit-workflow §8): correctness first, then drift, then the optional structural batch. Each batch ends with its gate and a stop for Nathan's review and commit. Each of 4b–4f writes its cases' tests, stamped with their IDs, by D13. A test in a batch is the case's regression test too, so a batch's fix and its case's tests land together.

   **A `drag-7` spec that fails in a batch's E2E run** is run alone before the failure is put down to the batch. DRAG-7.3, 7.4, 7.10, 7.16 and 7.29 failed under load before any of these batches (Story 8.13's plan, Open questions), and their flakiness is Story 10's.

   - **4a. One record of which write set a row's position (#1, part 1; D7).**
     - **The change:** the sidebar's `writesSent` and `positionSetBy` move into `lib/positionedWrite.ts`, and `foldWrite` calls the shared record. No behavior changes.
     - **Tests:** the record's own, in `positionedWrite.test.ts`. The sidebar's existing tests (`useProjectCollection.test.ts`, `App.pendingMove.test.tsx`) pass unchanged, and that's the proof.
     - **Size and risk:** about 40 lines across 2 files, plus tests. Low risk: the sidebar's ordering tests pin the behavior that moves.
     - **Gate:** `npm run check`.
   - **4b. A board answer leaves a newer position as it is (#1, part 2; D7).**
     - **The change:** `useItemManagement.ts` numbers a drag at `writes.begin` and an inline create at its send, and a Sheet answer as it lands. It passes `newer` through `completeItemWrite` to `applyWriteResponse`.
     - **Tests, DRAG-6.29:** a new `useItemManagement.test.ts`. It has the case's two givens with their exact values, each answered out of order and then in order, with the board's order read through `getWorkphaseItems`. It also covers an inline create's answer and a Sheet answer, whose disclosed pairs are held to the same rule.
     - **Size and risk:** about 30 lines in 2 files, plus tests. What the board draws changes only when two items' answers land out of send order.
     - **Gate:** `check` and `test:e2e`.
   - **4c. A sample enters each pop context once (#2; D8).**
     - **The change:** `popSession.ts::transitionTo` carries the contexts the sample has been in.
     - **Tests, DRAG-1.37:** in `popSession.test.ts`, the case's zero clocks and a positive pop distance. The sample settles in `K`, and in an expanded column's sub-row, with no second zoom into `P`. A later sample inside `P` zooms in normally. In `useBoardDnd.test.ts`, the same sample through the hook: it completes, the drag goes on, and nothing is written.
     - **Tests, DRAG-1.19:** in `popSession.test.ts`, the whole case. A distant yank pops twice in one sample, Descendants to `K` to Board, from either origin, against a merged column's outer body and against a sub-row, at set clocks and at zero. Coming to rest inside `K` pops once.
     - **Size and risk:** about 15 lines in 1 file, plus tests. A sample does what it did before unless it would have entered a context twice.
     - **Gate:** `check` and `test:e2e`.
   - **4d. The sidebar releases the gap its ghost shows (#3, with #10 and #11; D9).**
     - **The change:** `useProjectDragReorder.ts` gains `handleDragOver`, which `ProjectSidebar.tsx` wires up, and the release resolves its own placement. Since this batch rewrites the code they describe, two comments are corrected with it: #10's in the same hook, and #11's at `projectTreeUtils.ts::resolveGap`.
     - **Tests, TREE-1.1's new scenario:**
       - In `useProjectDragReorder.test.ts`, the report's sequence: a move still naming `A`, then an over event naming `B`, then a release with no movement, which sends `A` after `B` with parent `null`. The test adapters gain an over event.
       - In `tests/ui/project-tree-drag.spec.ts`, beside the existing TREE-1.1 test, the same gesture in a browser. Pick up `A`, make one movement that makes `B` the nearest row, and release without moving. `B, A, C` is saved, with `A.parentId = null`, and the sidebar keeps it after the answer and a reload. Shown failing before the fix.
     - **Size and risk:** about 25 lines in 3 files, plus tests. Every sidebar release goes through it, so the project-tree E2E specs are what show nothing else moved.
     - **Gate:** `check` and `test:e2e`.
   - **4e. The first project read is guarded like the others (#4; D10).**
     - **The change:** `useProjectCollection.ts`'s first load goes through `refreshProjects`.
     - **Tests, TREE-4.14:** in `useProjectCollection.test.ts`, both of the case's givens. Two first reads start, the later one is applied, and a write is answered: the rename of `P` in one given, and `X`'s move under `P` after `A` in the other. Then the earlier read lands. The collection keeps the write, and no render in between shows the old tree. A later refresh's older read is held to the same rule.
     - **Size and risk:** about 15 lines in 1 file, plus tests.
     - **Gate:** `check` and `test:e2e`.
   - **4f. A reload shows the board selected when it runs (#5; D11).**
     - **The change:** `BoardView.tsx::loadBoard` becomes `workflow/useBoardLoad.ts`. The hook reads the selection from a ref. It applies its result, ends the loading state and finishes the stop cue only as the latest load of the board still selected.
     - **Tests, BCU-1.7 and BCU-1.8:** a new `useBoardLoad.test.ts`. It has BCU-1.7's four givens: `B`'s columns, its items, `B` still loading, and the cue still waiting, with the cue's two callbacks standing in for the cue. BCU-1.8: a reload asked for from `A`'s closure reads `B`, both once `B` has loaded and while it's still loading.
     - **Size and risk:** about 50 lines move to the new hook, with about 25 changed, plus tests. It touches every board load: a selection change, a workphase or column change, and a drag's resync.
     - **Gate:** `check` and `test:e2e`.
   - **4g. Comments that are wrong about the code (#6–#9, #12–#15).** Comments and instruction text only:
     - **#6:** the origin Card's exception, in `popSession.ts`, `useBoardDnd.ts` and `descendantsProjection.ts`;
     - **#7:** at `dragCollision.ts`'s anchor, the attached descendants that are carried, and the Free ones that stay in the column;
     - **#8, and #14's directory half:** `workflow/AGENTS.md`;
     - **#9:** `itemListOps.ts`'s `Placement.parentId`, which can be a Card or a Stub;
     - **#12:** `KanbanCard.tsx`'s ShortCard description;
     - **#13:** `tests/helpers/dragGesture.ts::dragTo`'s two measurements;
     - **#14:** `useBoardDnd.test.ts`'s no-column fixture comment;
     - **#15:** `useProjectDragReorder.test.ts`'s Q → Q1 → Q2 chain.

     **Size:** 10 files, comments only. **Gate:** `check`.
   - **4h. The Descendants section's own module (#17, #19; D12). Optional.**
     - **The change:** `descendantsSection.ts` and its test, from `itemListOps.ts` and its test; the imports in about 8 files; the overflow tree's factory in `client/src/test/`; `workflow/AGENTS.md`'s pointers.
     - **Size and risk:** about 105 lines of source and 240 of tests moved, across about 12 files. No behavior changes.
     - **Gate:** `check`.
5. **The close-out** (audit-workflow §9):
   - **the PO clears the Planned markers** of the passages the fixes built: positioning §8, board-drag-interaction §3.1 and §10, project-tree §4, and boards-columns-unsorted §3;
   - **a Reconciler run** over Test-plan scope's seven cases maps their stamped tests, under Nathan's approval (D13). It judges whether each test covers its whole case or only part of it, and sets each case's status;
   - the Close-out table;
   - each route lands in a plan. A drag route usually goes to Story 10's Inbound deferrals;
   - the report moves to `docs/archive/`, the scope folder is deleted, and this plan moves to `docs/archive/`.

## Code map

Expected, from the Architect's reading. The Coder corrects it while building.

| File | Batch | Change |
|---|---|---|
| `client/src/lib/positionedWrite.ts` | 4a | The record of which write set each row's position, beside `applyWriteResponse` (D7) |
| `client/src/components/sidebar/useProjectCollection.ts` | 4a, 4e | `foldWrite` on the shared record; the first load through `refreshProjects` (D10) |
| `client/src/components/workflow/useItemManagement.ts` | 4b | Each write numbered; `newer` passed to the fold (D7) |
| `client/src/components/workflow/itemWriteReconciliation.ts` | 4b | `completeItemWrite` takes `newer` |
| `client/src/components/workflow/popSession.ts` | 4c, 4g | `transitionTo`'s contexts entered (D8); #6's comment |
| `client/src/components/sidebar/useProjectDragReorder.ts` | 4d | `handleDragOver`, the release's own placement (D9); #10's comment |
| `client/src/components/ProjectSidebar.tsx` | 4d | `onDragOver` wired |
| `client/src/components/sidebar/projectTreeUtils.ts` | 4d | #11's comment |
| `client/src/components/workflow/useBoardLoad.ts` | 4f | New: the guarded loader, from `BoardView.tsx` (D11) |
| `client/src/components/BoardView.tsx` | 4f | Composes `useBoardLoad` |
| `useItemManagement.test.ts` (new) | 4b | DRAG-6.29 (D13) |
| `popSession.test.ts`, `useBoardDnd.test.ts` | 4c | DRAG-1.37, DRAG-1.19 |
| `useProjectDragReorder.test.ts`, `tests/ui/project-tree-drag.spec.ts` | 4d | TREE-1.1's new scenario |
| `useProjectCollection.test.ts` | 4e | TREE-4.14 |
| `useBoardLoad.test.ts` (new) | 4f | BCU-1.7, BCU-1.8 |
| `useBoardDnd.ts`, `descendantsProjection.ts`, `dragCollision.ts`, `workflow/AGENTS.md`, `itemListOps.ts`, `KanbanCard.tsx`, `tests/helpers/dragGesture.ts`, `useBoardDnd.test.ts`, `useProjectDragReorder.test.ts` | 4g | Comments |
| `client/src/components/workflow/descendantsSection.ts` and its test | 4h | New: the section's rows, moved from `itemListOps.ts` (D12) |
| A factory module in `client/src/test/` | 4h | The overflow tree both suites build (#19) |

## Acceptance

- The scope script runs with the Config and exits 0. Every file D1 takes is in a launched instance, marked read whole. A dry run at `e070ef1` places all 74 files; `out` scopes record intentional exclusions, including the E2E specs.
- Every required finding has a row in the Close-out table.
- Every batch passed its gate, and `test:e2e` where it changed behavior.
- When Story 10 starts, the newest `*-audited` tag is the Story 8.13 audit's, not this one's.

## Open questions

- **For the Test Reconciler, optional at the next planned pass:** assess TREE-2.9's seeded count-line component test (`SortableProjectRow.test.tsx:342–356`) together with hook evidence for hidden subtree counts; assess whether the TREE-1.8/TREE-1.9 leave-and-return tests (`useProjectDragReorder.test.ts:255–264`, `:319–328`) have distinct obligations. These are audit notes, not findings or a request for a separate reconciliation run. The TREE-1.14 cyclic-release note is already accepted in Story 10's Inbound deferrals and needs no duplicate request.

## Handoff

- **The Coder and Test Reconciler, from the Test Planner:** use the IDs and obligations in Test-plan scope for batches 4b–4f. Five new cases are Planned; TREE-1.1 and DRAG-1.19 are extended live cases. Tests can carry IDs while being written, but Planned cases wait for the PO's marker removal before reconciliation can mark them Automated. No test code was read or changed, no mappings were assigned, and the wiki was left as the PO wrote it.
- **The Architect:** all thirteen review scopes completed over `epic-3-5-story-7-rerun-audited..e070ef1af682ce692651580a868db462d90ac35e` (88 commits). Scope artifacts are in `docs/audits/story-8-close-out-scopes/`; the report records 15 required findings and their open Close-out rows. Historical missed-pass attribution is recorded per D6; changes to agent definitions remain a separate Architect decision.
- **Story 10's audit:** its range starts at the Story 8.13 audit's tag, so it takes in this audit's Fix Now batches and the tests written beside them (D4).

## Amendments

- **2026-11-06 — Test Planner follow-up for findings #1–#5:** read the close-out findings and the PO's uncommitted wiki changes. Added Planned DRAG-6.29, DRAG-1.37, TREE-4.14, BCU-1.7 and BCU-1.8; extended Open TREE-1.1 for the final row crossing and Open DRAG-1.19 for an uninterrupted outward cascade with zero clocks. Updated the three feature indexes and recorded the per-batch IDs in Test-plan scope. Resolved the Planner's case-selection question; retained Nathan's internal-approval question with exact IDs and flagged the proposed hooks' standing-category eligibility for the Reconciler. Nathan clarified that only test plans, not the wiki, should change. No code, tests, wiki, audit report or agent definition changed in this pass; no reconciliation was launched.
- **2026-11-05 — Nathan approved the Auditor's scope and split refinements:** included `positionedWrite` and its test, `useProjectCollection.test.ts` and `itemWriteReconciliation.test.ts`; restored all four lenses on included unit tests and fixtures while keeping E2E specs with Story 10; scheduled at most three concurrent workers; required historical evidence before attributing a missed finding. Refreshed the config and counts after the Story 8.13 close-out commit.
- **2026-11-05 — Close-out audit review complete:** froze the 88-commit range at `e070ef1`, completed all thirteen scopes and recorded the response-currency handoff as reproduced #1. Added Architect/Coder, PO and optional Reconciler handoffs; the report remains open for required dispositions. The clean check passed 1,610 tests; Playwright passed 241 with 22 skipped. No application code, living docs, commits or tags were changed.
- **2026-11-06 — the Fix Now batches (Architect, at Nathan's direction):** Decisions gains "The fixes", D7 to D12. Work step 4 gains sub-batches 4a to 4h, covering all 15 Fix Now findings and the optional #17 and #19. The other Watch List findings:
  - **#18:** routed to Story 10's Inbound deferrals, beside its D4 helper work.
  - **#16:** noted in `free-item-reparent-gesture.md`'s Inbound deferrals, as the time the hook would next grow.
  - **#20:** not taken.

  Step 4 answers the Open question for the Architect and Coder, so that question is removed. Open questions gain the Test Planner's question on cases for #1–#5, and Nathan's on stamping 4e's and 4f's tests.
- **2026-11-06 — the wiki for #1 to #5 (PO, at Nathan's direction):** the rules the fixes meet are written in, each marked **Planned:** until its fix lands, except the sidebar's built half of #1.
  - **#5, ruled as proposed:** the selected board wins. boards-columns-unsorted §3 says an answer to a write or a load begun on another board, however late, doesn't replace the selected board's data, end its loading or finish its cue, and a change from the other board that the selected board shows too, such as a workphase's, is read again for the selected board (D11). The Open question for the PO is removed, and 4f no longer waits. The page's introduction gains "and §3 which board the client shows", since §3 now states a client behavior. **For Nathan to overrule.**
  - **#1:** positioning §8, a **Planned:** paragraph: answers land in any order and the list shows the order the server saved; an answer never overwrites a position a later-sent write set, the written entry or a pair it discloses; where a client can't tell an answer is current it reads again. board-drag-interaction §10 gains a **Planned:** line that this holds across items, beside its per-item sequencing. project-tree §4 states the sidebar's half, built: an older answer never undoes a newer one, nor shows a deleted project back (§9). It doesn't name D7's mechanism, so the board may take a read instead where it can't tell.
  - **#2:** board-drag-interaction §3.1, **Planned:** whatever the values, zero included, a pointer sample settles, and a sample that would return the drag to a context it has been in during that sample leaves it there. Outward cascades are unchanged (D8). It names no function or hop bound.
  - **#4:** project-tree §4, **Planned:** a read of the tree that began before a write's answer was applied never undoes that write, the first read included (D10).
  - **#3 needs no change:** project-tree §1 already says a release saves exactly the gap and depth the ghost shows, and D9 is how the hook meets it.
  - **#6 to #15:** comments and instructions, not the wiki's.
  - **Deductions, for Nathan to overrule:**
    - **The rules are Planned, not in force,** though the audit calls them broken rules. The wiki had no sentence for #1's cross-item case, #2, #4 or #5, so each is a rule added, and the marker comes off at the fix's close.
    - **#1 is shared and #4 is the sidebar's,** since #1's cross-item case and the sidebar's older fix are one rule, and #4 is a read, which positioning doesn't cover.
    - **#2's and #5's rules are outcomes,** that the gesture settles and that the selected board stands, so the fixes' mechanisms (D8's visited set, D11's ref) can change without the wiki.
  - **For the Test Planner (Open questions):** #1 falls under positioning §8 and board §10, #2 under board §3.1, #4 under project-tree §4, and #5 under boards-columns-unsorted §3. #3 is project-tree §1, and TREE-1 may already have its case. The four new passages are Planned, so their cases start Planned or Open as the Planner's convention has it.
  - **Checks:** `check:docs` passes. Nothing is committed.
- **2026-11-06 — the cases' tests folded into the batches (Architect, at Nathan's direction):**
  - **D13** sets each case's test layer, file and what makes it count. 4b–4f each write and stamp their cases' tests.
  - **D11 follows the PO's ruling,** so 4f no longer waits. Its loader becomes `workflow/useBoardLoad.ts`, so that BCU-1.7's cue clause can be tested without a drag.
  - **TREE-1.1's new scenario** gets an E2E test beside the existing one, as well as its hook test.
  - **Step 5** gains the PO's marker removal and a Reconciler run over the seven cases.
  - **Open questions:** Nathan's approval question now names DRAG-6.29, and 4f's tests as hook tests.
- **2026-11-06 — Nathan approved the hook tests (D13):** the hook tests for DRAG-6.29, TREE-1.1's new scenario, TREE-4.14, BCU-1.7 and BCU-1.8 count for their cases. Whether each covers its whole case or only part of it is the Reconciler's to judge, in step 5's run. Two Open questions are removed: his approval question, and the Reconciler's standing-category check for DRAG-6.29 and TREE-1.1, which the approval settles.

## Config

D1 to D3, as the scope script reads them. It was checked by a dry run at `e070ef1`.

```json
{
  "groups": [
    {
      "name": "board",
      "pattern": "^client/src/components/workflow/(?:AGENTS\\.md|CLAUDE\\.md|(?:descendantsProjection|dragClassification|dragCollision|dragOverlayGeometry|dragRegions|dragRequest|DragSessionContext|dragStructure|dragTuning|forcedStop|ForcedStopContext|itemListOps|modalPlacement|placement|popSession|useBoardDnd|useForcedStop|useItemManagement)\\.ts)$"
    },
    {
      "name": "surfaces",
      "pattern": "^client/src/(?:index\\.css|components/(?:BoardView|cardMetrics|dragChrome|ForcedStopCue|HierarchyModal|KanbanCard|ProjectSidebar|StubRows)\\.tsx?|components/sidebar/(?:projectTreeUtils|SortableProjectRow|useCollapsedProjects|useProjectCollection|useProjectDragReorder)\\.tsx?|lib/(?:dragTargets|hierarchy|hierarchyPlacement|positionedWrite)\\.ts)$"
    },
    {
      "name": "boardTests",
      "pattern": "^client/src/(?:components/workflow/(?:descendantsProjection|dragClassification|dragCollision|dragOverlayGeometry|dragRegions|dragRequest|dragStructure|dragTuning|itemListOps|itemWriteReconciliation|modalPlacement|placement|popSession|useBoardDnd|useForcedStop)\\.test\\.ts|test/(?:dragFixtures|popFixtures)\\.ts)$"
    },
    {
      "name": "surfaceTests",
      "pattern": "^client/src/(?:App\\.pendingMove\\.test\\.tsx|components/(?:BandGuides|cardMetrics|dragChrome|ForcedStopCue|HierarchyModal|KanbanCard)\\.test\\.tsx?|components/sidebar/(?:projectTreeUtils|SortableProjectRow|useCollapsedProjects|useProjectCollection|useProjectDragReorder)\\.test\\.tsx?|lib/(?:dragTargets|hierarchy|hierarchyPlacement|positionedWrite)\\.test\\.ts)$"
    },
    { "name": "e2eHelpers", "pattern": "^tests/helpers/(?:dragGesture|holdRequests|overflowTree|projectTreeDrag)\\.ts$" },
    { "name": "out", "pattern": "" }
  ],
  "instances": {
    "correctness": {
      "board": ["board"],
      "surfaces": ["surfaces", "e2eHelpers"],
      "board-tests": ["boardTests"],
      "surface-tests": ["surfaceTests"],
      "out": ["out"]
    },
    "drift": {
      "board": ["board"],
      "surfaces": ["surfaces", "e2eHelpers"],
      "board-tests": ["boardTests"],
      "surface-tests": ["surfaceTests"],
      "out": ["out"]
    },
    "duplication": {
      "source": ["board", "surfaces"],
      "board-tests": ["boardTests"],
      "surface-tests": ["surfaceTests", "e2eHelpers"],
      "out": ["out"]
    },
    "fileresp": {
      "source": ["board", "surfaces", "e2eHelpers"],
      "tests": ["boardTests", "surfaceTests"],
      "out": ["out"]
    }
  },
  "readWhole": [
    "client/src/components/workflow/descendantsProjection.ts",
    "client/src/components/workflow/dragClassification.ts",
    "client/src/components/workflow/dragCollision.ts",
    "client/src/components/workflow/dragOverlayGeometry.ts",
    "client/src/components/workflow/dragRegions.ts",
    "client/src/components/workflow/dragRequest.ts",
    "client/src/components/workflow/DragSessionContext.ts",
    "client/src/components/workflow/dragStructure.ts",
    "client/src/components/workflow/dragTuning.ts",
    "client/src/components/workflow/forcedStop.ts",
    "client/src/components/workflow/ForcedStopContext.ts",
    "client/src/components/workflow/itemListOps.ts",
    "client/src/components/workflow/modalPlacement.ts",
    "client/src/components/workflow/placement.ts",
    "client/src/components/workflow/popSession.ts",
    "client/src/components/workflow/useBoardDnd.ts",
    "client/src/components/workflow/useForcedStop.ts",
    "client/src/components/workflow/useItemManagement.ts",
    "client/src/components/workflow/AGENTS.md",
    "client/src/index.css",
    "client/src/components/BoardView.tsx",
    "client/src/components/cardMetrics.ts",
    "client/src/components/dragChrome.tsx",
    "client/src/components/ForcedStopCue.tsx",
    "client/src/components/HierarchyModal.tsx",
    "client/src/components/KanbanCard.tsx",
    "client/src/components/ProjectSidebar.tsx",
    "client/src/components/StubRows.tsx",
    "client/src/components/sidebar/projectTreeUtils.ts",
    "client/src/components/sidebar/SortableProjectRow.tsx",
    "client/src/components/sidebar/useCollapsedProjects.ts",
    "client/src/components/sidebar/useProjectCollection.ts",
    "client/src/components/sidebar/useProjectDragReorder.ts",
    "client/src/lib/dragTargets.ts",
    "client/src/lib/hierarchy.ts",
    "client/src/lib/hierarchyPlacement.ts",
    "client/src/lib/positionedWrite.ts",
    "client/src/components/workflow/descendantsProjection.test.ts",
    "client/src/components/workflow/dragClassification.test.ts",
    "client/src/components/workflow/dragCollision.test.ts",
    "client/src/components/workflow/dragOverlayGeometry.test.ts",
    "client/src/components/workflow/dragRegions.test.ts",
    "client/src/components/workflow/dragRequest.test.ts",
    "client/src/components/workflow/dragStructure.test.ts",
    "client/src/components/workflow/dragTuning.test.ts",
    "client/src/components/workflow/itemListOps.test.ts",
    "client/src/components/workflow/itemWriteReconciliation.test.ts",
    "client/src/components/workflow/modalPlacement.test.ts",
    "client/src/components/workflow/placement.test.ts",
    "client/src/components/workflow/popSession.test.ts",
    "client/src/components/workflow/useBoardDnd.test.ts",
    "client/src/components/workflow/useForcedStop.test.ts",
    "client/src/test/dragFixtures.ts",
    "client/src/test/popFixtures.ts",
    "client/src/App.pendingMove.test.tsx",
    "client/src/components/BandGuides.test.tsx",
    "client/src/components/cardMetrics.test.ts",
    "client/src/components/dragChrome.test.tsx",
    "client/src/components/ForcedStopCue.test.tsx",
    "client/src/components/HierarchyModal.test.tsx",
    "client/src/components/KanbanCard.test.tsx",
    "client/src/components/sidebar/projectTreeUtils.test.ts",
    "client/src/components/sidebar/SortableProjectRow.test.tsx",
    "client/src/components/sidebar/useCollapsedProjects.test.ts",
    "client/src/components/sidebar/useProjectCollection.test.ts",
    "client/src/components/sidebar/useProjectDragReorder.test.ts",
    "client/src/lib/dragTargets.test.ts",
    "client/src/lib/hierarchy.test.ts",
    "client/src/lib/hierarchyPlacement.test.ts",
    "client/src/lib/positionedWrite.test.ts",
    "tests/helpers/dragGesture.ts",
    "tests/helpers/holdRequests.ts",
    "tests/helpers/overflowTree.ts",
    "tests/helpers/projectTreeDrag.ts"
  ]
}
```

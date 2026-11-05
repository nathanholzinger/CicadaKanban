# Epic 3.5 — Story 8's close-out audit: the drag's files, read whole

**Type:** audit story. Its Fix Now batches may change what a drag does, and they fall in Story 10's audit range (D4) · **Written:** 2026-11-05 by the Architect · **Sequenced:** after the Story 8.13 audit (`docs/audits/code-quality-audit-story-8-13.md`) closes, with its Fix Now batches committed; before Story 10

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

None yet.

## Decisions

**D1, which files.** A file is in when both hold:
1. **Story 8 changed it:** the range `epic-3-5-story-7-rerun-audited..<end>`. That tag (`3ede430`) is the newest `*-audited` tag before Story 8.1. The Story 7 fix commits between it and 8.1 add no file to the scope.
2. **It's part of a drag,** on the board or in the sidebar: the gesture, its targets, its cues, or how a released drag is drawn until its write is answered. A file's tests come in with it, and so do the drag fixtures and the E2E drag helpers.

The config names each file rather than a directory, since a directory holds files of both kinds: `components/workflow/` also holds the board's CRUD hook, for one.

D1 applied at `2c4b124`:

| Group | Files | Lines |
|---|---|---|
| `board` | `components/workflow/`: `descendantsProjection`, `dragClassification`, `dragCollision`, `dragOverlayGeometry`, `dragRegions`, `dragRequest`, `DragSessionContext`, `dragStructure`, `dragTuning`, `forcedStop`, `ForcedStopContext`, `itemListOps`, `modalPlacement`, `placement`, `popSession`, `useBoardDnd`, `useForcedStop`, `useItemManagement`, and the directory's `AGENTS.md` | 4,614 |
| `surfaces` | `components/`: `BoardView`, `cardMetrics`, `dragChrome`, `ForcedStopCue`, `HierarchyModal`, `KanbanCard`, `ProjectSidebar`, `StubRows`. `components/sidebar/`: `projectTreeUtils`, `SortableProjectRow`, `useCollapsedProjects`, `useProjectCollection`, `useProjectDragReorder`. `lib/`: `dragTargets`, `hierarchy`, `hierarchyPlacement`. `index.css` | 3,333 |
| `boardTests` | the tests of 14 `board` files, `test/dragFixtures.ts`, `test/popFixtures.ts` | 5,019 |
| `surfaceTests` | the tests of 12 `surfaces` files, `BandGuides.test.tsx` (its component didn't change), `App.pendingMove.test.tsx` (a project move's pending state, through `App.tsx`) | 4,488 |
| `e2eHelpers` | `tests/helpers/`: `dragGesture`, `holdRequests`, `overflowTree`, `projectTreeDrag` | 631 |

That's 70 files, every one marked read whole.

**D2, which passes read what.**
- **Source and the E2E helpers:** all four passes.
- **Unit tests and fixtures:** Duplication and File Responsibility. What a test proves is the Reconciler's (audit-workflow §4), so Correctness and Drift would find little there.
- **One Duplication instance holds the board's source and the sidebar's together,** since repetition between them is what this audit is most likely to find.

**D3, the split:** 9 instances, in two waves.

| Wave | Pass | Instance | Groups | Lines |
|---|---|---|---|---|
| 1 | Correctness | `board` | `board` | ~4,260 (`AGENTS.md` is Drift's alone) |
| 1 | Correctness | `surfaces` | `surfaces`, `e2eHelpers` | 3,964 |
| 1 | Drift | `board` | `board` | 4,614 |
| 1 | Drift | `surfaces` | `surfaces`, `e2eHelpers` | 3,964 |
| 1 | Duplication | `source` | `board`, `surfaces` | ~7,590 |
| 2 | Duplication | `board-tests` | `boardTests` | 5,019 |
| 2 | Duplication | `surface-tests` | `surfaceTests`, `e2eHelpers` | 5,119 |
| 2 | File Responsibility | `source` | `board`, `surfaces`, `e2eHelpers` | ~8,220 |
| 2 | File Responsibility | `tests` | `boardTests`, `surfaceTests` | 9,507 |

**The rest of the range goes to an `out` instance in each pass, and those aren't launched.** The script exits 1 when a file a pass should read falls in no instance of that pass, so this is how the exclusion stays visible. The `out` scope files stay in the scope folder as the record of what was left out, and the report's opening says so.

**D4, the tag.** Nathan tags the end commit `epic-3-5-story-8-close-out`, without `-audited`.
- **Why:** the next audit's base is the newest `*-audited` tag (audit-workflow §2). If this audit's end carried one, the Story 8.13 audit's fixes to files outside this scope would fall in no audit's range.
- **What that gives:** Story 10's audit starts from the Story 8.13 audit's tag, and reads both audits' Fix Now batches.
- **Rebuilding the scope** takes `epic-3-5-story-7-rerun-audited`, this tag and the Config below.

**D5, what the merge step reads.** Every story in the range closed with an audit of its own, so the only plan audit-workflow §5 asks for is this one. The Covered-by destinations a drag finding is most likely to have are read too, so a finding already planned is tagged, not filed again:
- Story 10's plan (`story-10-dnd-automation-catch-up.md`): its Scope and Inbound deferrals;
- `epic-8-decisions.md`, "Deferred (not events-specific): the drag's final cues and the zoom-in morph, from Epic 3.5". It holds a cue's look, which is a working placeholder under the wiki's Open questions;
- the drag's tech-debt plans: `carried-copy-leaves-cursor.md`, `free-item-reparent-gesture.md`, and `ui-message-banners.md` for the forced stop's banner.

**D6, a finding the story audits missed.** A finding may sit in lines an earlier Story 8 audit read, because they were in its changed lines. When it does, the report names the lens that missed it, as the epic-wide audit does (§10), so that agent's definition can be tightened. A finding in lines no earlier audit read is an ordinary finding.

## Work, in batches

1. **The scope,** once the Story 8.13 audit's fixes are committed:
   - Save the Config below as `docs/audits/story-8-close-out-scopes/config.json`, and run `npm run audit:scope -- --out docs/audits/story-8-close-out-scopes --base epic-3-5-story-7-rerun-audited --config docs/audits/story-8-close-out-scopes/config.json`.
   - **Check the `out` scopes for a file D1 takes in.** The groups are D1 applied at `2c4b124`, and the Story 8.13 audit's fixes may add a file in scope. Add any such file to its group and to `readWhole`, then rerun.
   - Write the range down, and Nathan tags its end (D4).
2. **The passes,** in D3's two waves, each given its scope file alone (audit-workflow §3).
3. **Reconcile, and write the report** to `docs/audits/code-quality-audit-story-8-close-out.md` (audit-workflow §5, §7), with D5 and D6.
4. **The Fix Now batches,** written into this plan by the Architect once the report is in (audit-workflow §8):
   - in order: correctness, then a shared rule's duplication, then drift, then structural;
   - each ends with `npm run check`, plus `npm run test:e2e` where it changes behavior, and a stop for Nathan's review and commit;
   - whether a batch's regression test needs a test-plan case is asked of the Test Planner when the batches are written.
5. **The close-out** (audit-workflow §9):
   - the Close-out table;
   - each route lands in a plan. A drag route usually goes to Story 10's Inbound deferrals;
   - the report moves to `docs/archive/`, the scope folder is deleted, and this plan moves to `docs/archive/`.

## Code map

Written with the Fix Now batches.

| File | Batch | Change |
|---|---|---|

## Acceptance

- The scope script runs with the Config and exits 0. Every file D1 takes is in a launched instance, marked read whole. A dry run at `2c4b124` placed all 70 files.
- Every required finding has a row in the Close-out table.
- Every batch passed its gate, and `test:e2e` where it changed behavior.
- When Story 10 starts, the newest `*-audited` tag is the Story 8.13 audit's, not this one's.

## Open questions

None.

## Handoff

- **Story 10's audit:** its range starts at the Story 8.13 audit's tag, so it takes in this audit's Fix Now batches and the tests written beside them (D4).

## Amendments

## Config

D1 to D3, as the scope script reads them. It was checked by a dry run at `2c4b124`.

```json
{
  "groups": [
    {
      "name": "board",
      "pattern": "^client/src/components/workflow/(?:AGENTS\\.md|CLAUDE\\.md|(?:descendantsProjection|dragClassification|dragCollision|dragOverlayGeometry|dragRegions|dragRequest|DragSessionContext|dragStructure|dragTuning|forcedStop|ForcedStopContext|itemListOps|modalPlacement|placement|popSession|useBoardDnd|useForcedStop|useItemManagement)\\.ts)$"
    },
    {
      "name": "surfaces",
      "pattern": "^client/src/(?:index\\.css|components/(?:BoardView|cardMetrics|dragChrome|ForcedStopCue|HierarchyModal|KanbanCard|ProjectSidebar|StubRows)\\.tsx?|components/sidebar/(?:projectTreeUtils|SortableProjectRow|useCollapsedProjects|useProjectCollection|useProjectDragReorder)\\.tsx?|lib/(?:dragTargets|hierarchy|hierarchyPlacement)\\.ts)$"
    },
    {
      "name": "boardTests",
      "pattern": "^client/src/(?:components/workflow/(?:descendantsProjection|dragClassification|dragCollision|dragOverlayGeometry|dragRegions|dragRequest|dragStructure|dragTuning|itemListOps|modalPlacement|placement|popSession|useBoardDnd|useForcedStop)\\.test\\.ts|test/(?:dragFixtures|popFixtures)\\.ts)$"
    },
    {
      "name": "surfaceTests",
      "pattern": "^client/src/(?:App\\.pendingMove\\.test\\.tsx|components/(?:BandGuides|cardMetrics|dragChrome|ForcedStopCue|HierarchyModal|KanbanCard)\\.test\\.tsx?|components/sidebar/(?:projectTreeUtils|SortableProjectRow|useCollapsedProjects|useProjectDragReorder)\\.test\\.tsx?|lib/(?:dragTargets|hierarchy|hierarchyPlacement)\\.test\\.ts)$"
    },
    { "name": "e2eHelpers", "pattern": "^tests/helpers/(?:dragGesture|holdRequests|overflowTree|projectTreeDrag)\\.ts$" },
    { "name": "out", "pattern": "" }
  ],
  "instances": {
    "correctness": {
      "board": ["board"],
      "surfaces": ["surfaces", "e2eHelpers"],
      "out": ["boardTests", "surfaceTests", "out"]
    },
    "drift": {
      "board": ["board"],
      "surfaces": ["surfaces", "e2eHelpers"],
      "out": ["boardTests", "surfaceTests", "out"]
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
    "client/src/components/workflow/descendantsProjection.test.ts",
    "client/src/components/workflow/dragClassification.test.ts",
    "client/src/components/workflow/dragCollision.test.ts",
    "client/src/components/workflow/dragOverlayGeometry.test.ts",
    "client/src/components/workflow/dragRegions.test.ts",
    "client/src/components/workflow/dragRequest.test.ts",
    "client/src/components/workflow/dragStructure.test.ts",
    "client/src/components/workflow/dragTuning.test.ts",
    "client/src/components/workflow/itemListOps.test.ts",
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
    "client/src/components/sidebar/useProjectDragReorder.test.ts",
    "client/src/lib/dragTargets.test.ts",
    "client/src/lib/hierarchy.test.ts",
    "client/src/lib/hierarchyPlacement.test.ts",
    "tests/helpers/dragGesture.ts",
    "tests/helpers/holdRequests.ts",
    "tests/helpers/overflowTree.ts",
    "tests/helpers/projectTreeDrag.ts"
  ]
}
```

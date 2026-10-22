# Code Quality Audit — A6 first run

**Range:** `epic-3-5-story-6-audited..7443721`, 67 commits. The base is the tag on `4c0cb34`, Story 6's audit end; the end is A6 batch 1's commit. Nathan tags the end commit `a6-audited`.

**What the range holds:** Story 6's four Fix Now batches, Tooling Gates, A1 to A4, A5a to A5d, and A6 batch 1. Outside `docs/` and `.claude/`, that's 176 files, of which 145 changed code and 31 changed only in comments.

## How the range sorted

| Commits | Passes |
|---|---|
| Story 6's fix batches (`4c0cb34..06bd170`); Tooling Gates' batches 1–4 but the sweep; A1's checker; A3's batches; A4 batch 5; A5a–A5d | All four |
| A4's 16 sweep commits (`359f093^..bae02c2`), proven comment-only by A4's comment-stripped comparison | Drift |
| Root `CLAUDE.md` and `client/src/components/workflow/CLAUDE.md` | Drift |
| The Prettier sweep `f8ca72e` (on `.git-blame-ignore-revs`) and `468b3fc`, which adds that file | None |
| The three `package-lock.json` files | None: dependency resolution, not code |
| Docs: the wiki, test plans, plans, guides, personas and agents | None |

**How each pass knew what changed.** The passes can't run git, so each got its files with line ranges at HEAD: the lines `git blame --ignore-revs-file .git-blame-ignore-revs epic-3-5-story-6-audited..HEAD` attributes to a commit in the range. Lines last touched by an A4 sweep commit went to the drift pass only, listed apart as comment rewrites. A line the Prettier sweep reformatted counts as changed only if its content changed in the range too.

**How the passes split.** The range is too large for one instance of each pass, so each ran as several, in parallel. The splits are by area, not by commit, so a file changed by several sources has one reader per lens:

| Group | Holds |
|---|---|
| C1 | The board's drag layer: `client/src/components/workflow/`, and the board components that draw it |
| C1t | The drag layer's unit tests, and `client/src/test/` |
| C2 | The rest of the client: the sidebar, `lib/`, `api/`, `App.tsx`, the Sheet's sections |
| S1 | `server/src/`, the migration, and root `CLAUDE.md` |
| S1t | `server/tests/` |
| E2E | `tests/` |
| T | The `check:docs` checker, configs, root `package.json`, and the Bruno requests |

- **Correctness & Security** and **Consistency & Drift:** one instance per group, seven each.
- **Duplication & Abstraction:** five instances. All client source is one, C1 and C2 together, since the board and the sidebar share placement logic and a split between them would hide exactly the duplication this lens looks for. Then client tests, server (source and tests), E2E, and T.
- **File Responsibility:** four instances: client, server, E2E, and T.

A4's plan asked for one drift pass per A4 commit. Splitting by area instead gives each file one drift reader for both its code changes and its comment rewrites.

## How it ran

- **The passes ran cold.** Each got only its scope file. None read a plan, an earlier audit or a wiki page except where a comment in its scope pointed at one.
- **The 23 instances ran in waves of up to five.** The first launch of 20 at once hit the account's usage limit before any finished, so they were resumed with their progress intact.
- **Re-traced by hand** before going in the report: #1, #2, #3, #5 and #6 against the code and the wiki passages they touch. #4 came from the merge step, not a pass, and was traced through the code but not observed; its fix starts with a probe. #7 was checked against the checker's source.
- **What the merge step read:**
  - the previous audit, `docs/archive/code-quality-audit-epic-3-5-story-6.md`, for recurrence;
  - this plan, `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`, including the two A4 handoff items D10 carries;
  - the plans of the stories in the range that closed without an audit of their own, from `docs/archive/`: Tooling Gates, A1 to A4, and A5a to A5d. Only A4's handed anything to an audit. A5a's and A5d's handoffs list the Planned passages they built; each has its index pointer, apart from #8's one gap;
  - the wiki passages each correctness finding touches, and the roadmap entries the Covered-by and routed findings name: Story 10 in `epic-3-5-roadmap.md`, `epic-4-decisions.md` §12, and the API contract epic's plan.

## Overall shape

The range is three kinds of work, and they audit differently.

- **Story 6's fix batches hold up.** Every Fix Now and Watch List item from the Story 6 audit was fixed, and no pass re-found one. The `useBoardDnd.ts` split left a hook that's one gesture, plus one branch that isn't (#36).
- **A5's rule changes are where the bugs are.** A5a and A5d changed what the API accepts, and two of the server findings come from the edges of those rules: an attached child created under a parent with no workphase gets no position (#1), and one read path still labels foreign-workflow items the old way (#2). Their checks were also written into the routes beside the primitive that owns them, so a create and a move give different errors for one request (#19).
- **A4's comment sweep did what it set out to do, and the drift pass found what its gates couldn't.** No provenance came back, and the 15 rulings A4 wrote at their sites stood, apart from one whose stated reason a pass disproved (#9). What the drift instances found is comments that were rewritten fluently but state something the code doesn't do: a collision rule for a context that gets no candidates, a pending marker a release clears, three statements in `workflow/CLAUDE.md`.
- **The tests and the checker** are sound on correctness. Their findings are duplication: helpers that exist and aren't used, and three copies of one rule in the checker.

---

## Fix Now — correctness

### 1. An attached child created under a parent with no workphase gets no position, where a move gives it one `[Correctness & Security + Consistency & Drift]`
**Files:** `server/src/routes/items.ts:194–209`; compare `server/src/lib/itemHierarchy.ts:385–388`.

`POST /items` appends a position for an attached child only when `attached && parentId && resolvedWorkphaseId`. `resolveCreateWorkphase` gives an attached child its parent's workphase, so under a parent with none, the child is stored with `position: null` while the API labels it `positionScope: "attached-siblings"`. A move that attaches the same item appends whenever `resulting.isAttachedWithParent || resulting.workphaseId`, so it gets 1.0.

**Failure scenario:**
1. Top-level item D has no workphase, so it sits in Unsorted.
2. Children A and B are added through the Sheet's add-child, or MCP `create_item` with `parent_id`. Both are attached by default, and both get `position: null`.
3. D is filed into Todo. The cascade moves A and B with it and leaves their positions null.
4. Dropping Stub B before Stub A sends `anchorId: A`, which is refused with "anchorId has no position to anchor against (it may be a done item)". The message is wrong, and neither Stub can be an anchor.
5. A third child C appends at 1, since the last-position query skips nulls, so C sorts after A and B though it was created last.

**Fix:** gate the attached branch on `attached && parentId` only; `positionScopeFor` ignores `workphaseId` for an attached subject. Backfill existing attached rows with a null position, or confirm none exist. `items.test.ts:1403` and ATT-9.7's setup (`items.hierarchy.test.ts:1373–1374`) create this state and assert only the workphase, so one of them gains a position assertion.

**Wiki:** breaks an in-force rule, wiki item-positioning §3 ("A new attached child's position is scoped to `(parentId, isAttached)` — not to `workphaseId` — via the append fallback"). §2's "no workphase at all" is one of the `"none"` cases, which it confines to detached and top-level items.

### 2. `GET /workflows/:id` labels a foreign-workflow item `"workflow"`, where every other read says `"none"` `[Correctness & Security + Duplication & Abstraction]`
**Files:** `server/src/routes/workflows.ts:72–78`; the rule at `server/src/lib/itemPositionScope.ts:19–21, 46–51`.

`getWorkflowItems` returns every item in the workflow's workphases, from any project, and `isTerminalLookup(workflowWorkphases)` answers for all of them. `itemPositionScope.ts`'s own comment says the lookup must answer only for the workphases of the workflow the item's project uses. `items.ts` and `boards.ts` honor that; `workflows.ts` doesn't.

**Failure scenario:**
1. Project P inherits workflow W1, and has items in W1's workphases.
2. P gets a workflow of its own, W2, or is reparented under an ancestor that has one.
3. `GET /items/:id` and P's board both report those items as `"none"`, in Unsorted. `GET /workflows/W1`, which MCP `get_workflow` reads, reports them as `"workflow"`.

**Fix:** build the lookup per item from the set of projects that use this workflow (`workflowItems.ts::getProjectsUsingWorkflow`, private today), and answer null for any other item. `workflows.test.ts:86` ("matching GET /api/items/:id for the same rows") has no foreign row, so it gains one.

**Wiki:** breaks an in-force rule, wiki item-positioning §2's third `"none"` case.

### 3. A grandchild Stub dragged out to its own Card's layer draws as an attach ghost `[Correctness & Security]`
**Files:** `client/src/components/KanbanCard.tsx:158–161`; compare `client/src/components/workflow/placement.ts:128`.

The Card decides whether to draw the dragged item as an attach ghost by comparing the Stub's *direct* parent with itself: `parentOpinionOf(cardDragSession.origin) !== item.id`. The placement asks the right question, the Stub's containing Card: `region.attachToCardId === containingCardId`. For a Stub at depth 2 or deeper, the direct parent is another Stub, so the two disagree.

**Failure scenario:**
1. Card B has Stub P, P has Stub S, and S has a child T.
2. Pick up S; the drag starts at B's Descendants layer.
3. Move into B's padding; the drag pops out to B's Card layer.
4. The placement is the set-down, and the release writes nothing. But B draws S as a dashed attach ghost under P: S loses its `data-item-id`, T disappears, and the section shrinks under the cursor.

A direct child in the same gesture keeps its row. The write is right; the drawing is wrong.

**Fix:** `cardDragSession.containingCardId !== item.id`, the test `placementFor` uses. Free Cards and other Cards' Stubs get the same answer as today.

**Wiki:** breaks an in-force rule, wiki board-drag-interaction §2's "the drop lands where the ghost is", for §6's set-down.

### 4. A done list's ghost follows dnd-kit's shuffle, though a done list has no slot to choose `[merge step: A4's handoff]`
**Files:** `client/src/components/CardList.tsx:86`; `client/src/components/workflow/dragCollision.ts:136–150`; `client/src/components/dragChrome.tsx:96–109`; compare `client/src/components/workflow/placement.ts:177, 186`.

The release half of the rule holds: in a done column, `placementFor` ignores `over` and falls back to the newest slot. Nothing holds the drawing:
- every card list, done or not, is a `SortableContext` with `verticalListSortingStrategy`;
- while locked in a column, the collision candidates are the column's container and the card rows inside it, with no exception for a done column;
- `useItemRow` applies dnd-kit's sortable transform unconditionally.

The ghost is drawn in the done list (its placement puts it there), so its id is in that list's sortable items, and hovering a done card shuffles it to that card's slot. The release then lands it as the newest completion.

**Failure scenario:** DRAG-3.24's: a done column shows `D1, X, D2`. Pick X up and move the cursor up the list. The ghost and the cards slide as in an active column. Release over `D1`'s slot, and X is set back down in its own place, not where the ghost showed.

This is traced through the code and not yet observed. It's also the premise of `epic-4-decisions.md` §12's zoom-in question ("a done list's ghost doesn't move").

**Fix:** start with a throwaway probe of DRAG-3.24's scenario. Its permanent test stays Story 10's, which DRAG-3.24 is routed to. If the probe fails as traced, keep a done list's rows still during a drag: for example, give a terminal list's `SortableContext` a strategy that returns no transforms, or leave its card rows out of the in-context collision candidates. Then give rule 6 its index pointer at the fix (A4 left it without one, since it couldn't confirm the enforcing code).

**Wiki:** breaks an in-force rule, wiki board-drag-interaction §2 rule 6.

### 5. The inversion tripwire logs false inversions for Board-layer top and bottom drops `[Correctness & Security]`
**Files:** `client/src/components/workflow/itemWriteReconciliation.ts:40–43, 108–110`; `client/src/components/workflow/itemListOps.ts` (`slotIndex`); slot sources `placement.ts:57, 186–189`.

`sendItemMove` records the ghost's placement as the pending marker. For a top or bottom band drop, its slot is the literal `'first'` or `'last'`, while the request carries a concrete anchor. `freeItemOrder` applies placements over the whole workflow's Free list, and `slotIndex` puts `'first'` at index 0 of whatever list it's given: first in the workflow, not in the column. Positions interleave across workphases, so the two orders disagree.

**Failure scenario:** Todo holds `a` (1) and `c` (3); Doing holds `b` (2); X (4) is in Todo. Pop X out and release it in Doing's top band. The request is "before `b`", and X gets 1.5. The tripwire expected `[X, a, b, c]`, gets `[a, X, b, c]`, and logs an inversion for a correct response. A detaching Stub's `'last'` into a non-empty column does the same. Nothing breaks, but the dev panel's inversion count stops meaning anything.

**Fix:** in `useBoardDnd.ts::commitRelease`, when the request has an anchor, record the pending marker with that anchor as its slot. It draws the same picture in the target list, and the tripwire then judges the anchor the server got. Add the `'first'`/`'last'` case to `itemWriteReconciliation.test.ts`.

**Wiki:** breaks an in-force rule, wiki board-drag-interaction §10 (the tripwire).

### 6. An item subtree already past the cap can be reparented to the top level `[Duplication & Abstraction]`
**Files:** `server/src/lib/itemHierarchy.ts:226–240`; compare `server/src/routes/projects.ts:47–48`.

The cap check runs only when `typeof req.parentId === 'string'`, so a reparent to the top level skips it. Projects check it there, and TREE-3.8 asserts that.

**Failure scenario:** a tree deeper than the cap exists, from a lowered `CAP` or a direct database edit. `PUT /items/:id` with `parentId: null` on its root succeeds, where the wiki says it fails for every target.

**Fix:** check the cap for a top-level target too, through the shared parent check in #20.

**Wiki:** breaks an in-force rule, wiki hierarchy-placement §6 ("A subtree that's already taller than the cap therefore fails the check for every target, the top level included"). Item-attachment §8 gives items no exception.

### 7. `check:docs` never reads titles written as `it.each(table)('title', fn)` `[Correctness & Security]`
**Files:** `scripts/check-docs/extract.mts:158–183` (`testTitles`, `isTestCallee`).

`isTestCallee` walks only property-access chains. For `it.each([…])('title', fn)` the outer call's callee is a call, so it isn't treated as a test, and the inner call's first argument is the table. The title is never extracted, so no rule reads it.

**Failure scenario:** `dragClassification.test.ts:77`'s title carries `DRAG-2.3`. If that case is renumbered, `case-id` stays silent. The same holds for provenance in any of the 14 `.each` titles in `client/src`, and the gate's silence implies they were checked.

**Fix:** let `isTestCallee` step through a call or a tagged template between the identifier and the title call, and add an `it.each(…)('title', …)` line to `extract.test.mts`'s title test. Run `npm run check:docs` after; no new hits are expected.

---

## Fix Now — drift

### 8. Server comments and headers that state what the code doesn't do `[Consistency & Drift + File Responsibility]`
- `server/src/lib/workflowItems.ts:70–75`: says `effectiveWorkflowIdForProject` decides whether a position is nulled. Nothing nulls one now. Say it resolves the workflow a project uses (wiki project-tree §10), which the cross-workflow and foreign-workphase checks compare against.
- `server/src/db/schema.ts:125`: `// self-referential FK to items.id`. There's no FK, and the routes and root `CLAUDE.md` call it a soft reference. Say so.
- `server/src/routes/projects.ts:246–256, 289–298`: says any given `prevId`/`nextId` is verified independently. When both are sent, only `prevId` is verified and used. The reason for not trusting an empty scope cites hidden collapsed children, which the sidebar no longer has (wiki project-tree §1). And "this handler's only write is to the subject project" is false once a reindex runs; the conclusion holds because validation runs before any write. State each as it is.
- `server/src/lib/itemPositionScope.ts:1–11`: "Shared by items.ts and boards.ts" omits `workflows.ts`, `workphases.ts` and `itemHierarchy.ts`, and the header doesn't mention `sharesPositionScope` or `workflowIdForWorkphase`. Say what the file owns, with "also used by". The foreign-workflow rule is stated three times (`:19–21`, `:27–30`, `:49–51`); keep it at `classifyPositionScope`.
- `server/src/lib/itemHierarchy.ts:1–5`: the header omits the exported `foreignWorkphaseError`, which `POST /items` calls.
- `server/src/db/runMigrations.ts:1–2, 115`: the header omits the move of orphan workflows to a "Default Project" and the project-position initialization; the step comment omits the items it reassigns.
- `server/src/lib/columnRanges.ts:30–38`: "broken only when start and end have crossed" omits the missing-endpoint branch.
- `server/src/mcp.ts:99`: `update_item`'s description says reparenting moves the item into the parent's workphase. That's true only when the item ends Attached; the next sentence of the same description says so.
- `server/src/lib/positionResolver.ts:36–37, 78–81`: the call-site list for `resolveAppendPosition` reads as complete and isn't; "workphases don't pass a collector" means the item backfill in `PUT /workphases/:id`.
- **Rule (e):** closed "shared by" lists at `boardCascade.ts:1, 7–10`, `columnRanges.ts:15–19` and `workphaseOrder.ts:1–2`; prose about other files' internals at `attachedCascade.ts:16–20` and `columnRanges.ts:67–69`; `routes/testHelpers.ts` restates the mount guard on every handler (`:18–19, 35, 52–53, 70`), where one file-level line would do.
- **A missing index pointer:** wiki item-attachment §14, "Creating an item", added by A5a, has no pointer at its enforcement site, `routes/items.ts`'s POST. `itemFixture.ts:12` cites §1 for the half §14 states.

### 9. Board drag-layer comments that state what the code doesn't do `[Consistency & Drift + Correctness & Security]`
All under `client/src/components/`.
- `workflow/dragCollision.ts:61, 79–85`: says a locked Card context restricts the collision candidates. The hook passes `context: null` for a locked Card, so there are none. Add "or locked at a Card" to the null cases.
- `workflow/dragRequest.ts:78–81`: says a no-op release's placement stays on as the pending marker. `commitRelease` restores the prior placement instead. Scope the sentence to a release that sends a request.
- `workflow/useBoardDnd.ts:95–96`: "Position values are never computed here". The column branch sends `position: i + 1`. Say "Item position values".
- `workflow/dragRegions.ts:80–81, 148–152`: the card count is "the number of real cards currently rendered". It's the *other* cards, without the carried item's own row, which is what the reservation needs. `:99–100` says `boundsRect` is undefined on a `CardRegion`, which has no such field; `:86` points at `bandFor`'s comment for what lives on `reservationFor`.
- `BandGuides.tsx:1–2`: "the hovered band tinted". Nothing tints a band.
- `workflow/dragClassification.ts:3–5` and `workflow/dragCollision.ts:52–54`: both call `dragCollision.ts` pure with no dnd-kit runtime; it imports three runtime functions. Delete `:52–54`, a second header mid-file, and let `dragClassification.ts` claim only its own purity.
- `CardList.tsx:76–78`: lists Unsorted as droppable; the same file and `UnsortedBucket.tsx` make it drag-source only.
- `KanbanCard.tsx:141–148` sits above `useDragSession()` but describes `attachGhostId` at `:158`; `:175–176` calls `overlayIsStub` the one place `overlayForm` matters, though `useItemRow` reads it too; `:4–5` says both overlay props come from `overlayFormFor`, where only one does.
- **A ruling's reason, disproved.** `StubRows.tsx:26–32` and `KanbanCard.tsx:315–320` keep `AttachGhostRow` apart from `AttachedChildRow` because dnd-kit can't hold two sortable registrations for one id, and "the item's real registration is wherever it's being dragged from". During a Card-layer attach preview, the item's own row is unmounted, so it has no registration at all. The comment also says the two share "only the box class"; they share `StubBody` and `descendantsIndentPx` too. Restate the reason as it actually holds, or, if none does, the separation is open to merging. That's a question for the fix batch, not a merge here.

### 10. Board drag-layer headers and coupling lists `[Consistency & Drift + File Responsibility]`
- **Headers that omit what the file owns, or claim what it doesn't:** `workflow/dragRegions.ts:1–23` ("pure geometry", though half the file reads the DOM; the key builders, `dragRegionProps` and the selectors are missing; see #37); `cardMetrics.ts:1–6` (the Stub tier's heights and box class, the descendants indent); `dragChrome.tsx:1–4, 29–30` (the sidebar's drop-line looks; see #34); `workflow/placement.ts:1–6` (`resolvePlacementOver`, `regionWorkphaseFor`); `workflow/dragOverlayGeometry.ts:5–11` (`overlayShapeFor` is missing from a table that claims every function); `workflow/itemWriteReconciliation.ts:1–6` (`ItemListState`, `EMPTY_ITEM_LIST_STATE`, `withPlacement`).
- **`workflow/useBoardDnd.ts`:** two "what this composes" lists (`:1–4`, `:70–80`) that disagree with each other and with the imports; keep one header and point at `workflow/CLAUDE.md`'s concern map. `:608–616` is an orphaned block describing `usePendingGhostGuard`'s internals, which that hook's header already says; delete it.
- **Closed coupling lists gone false (rule (e)):** `dragRegions.ts:506–508` (`containsPoint`, also read by `popSession.ts`); `:196–198` (`descendantsCardIdOf`, also read by `descendantsProjection.ts`); `dragCollision.ts:193–196` (the anchor's readers omit the zoom-in candidate); `itemListOps.ts:95–97` (`renderedIsStub`, also read by `itemWriteReconciliation.ts`); `dragRegions.ts:222–224` (the second site, `BoardColumn.tsx`'s `ExpandedSubRow`, is never named). Use "also read by".
- **`DragTuningPanel.tsx:1–2, 10–15`:** "band" values the tuning doesn't have; "retired once the values lock" is a forward reference (rule (d)); the second block repeats the header and a duplicate §3.1 pointer (rule (c)).
- **One-line fixes:** `BoardView.tsx:209–211` (the overlay colors are drawn by `dragChrome.tsx`, Stub rows included); `BoardColumn.tsx:178–181` (the "Move to" zone shows only at Board layer, and `!(isOver && isCardBeingDragged)` is redundant beside `!session`); `BoardColumn.tsx:59–61` and `dragClassification.ts:61–63` (prose about the server's internals; use a guard pointer); `useBoardDnd.ts:548–550` (the droppable `role` is registered in `dragChrome.tsx::useItemRow`, and it's load-bearing for the collision filters); `dragRegions.ts:388–395` (`layoutRect` returns the painted box; rename it or reword); `dragBands.ts:48–51` ("halve both edges" is 52 against 96, not half); `useItemManagement.ts:1–2` (the sequencing is the tracker's); `dragCollision.ts:93–105` (the registration rationale twice in one file, and a check spelled differently from the code); `BandGuides.tsx:18, 28` (name no `file::symbol`).

### 11. `workflow/CLAUDE.md` makes three statements the code doesn't bear out `[Consistency & Drift]`
**File:** `client/src/components/workflow/CLAUDE.md`. Whoever fixes the code in this directory fixes this file, in the same change.
- **`:14–16`:** a drag starts "deterministically, never hit-tested". True for a Stub; a Free Card's start context is a hit test (`useBoardDnd.ts:501–503`).
- **`:36–38`:** "Release resolves the placement via `resolvePlacement`". The release reads the last sample's `projection.resolved`; `resolvePlacement` runs per sample. `DragSessionContext.ts:26–32` says it right.
- **`:163–168`:** the test-surface list omits `data-pending`, `data-drag-overlay`, `data-drag-overlay-form`, `data-active-context`, `data-drag-region`, `data-drag-card-count`, `data-carve-zone` and `data-carve-divider`. Add them, or stop implying the list is complete.

### 12. All three `eslint-disable` directives in the client keep their reason above the line, not on it `[Consistency & Drift]`
**Files:** `client/src/components/dragChrome.tsx:93`; `client/src/components/BoardView.tsx:142`; `client/src/components/workflow/useBoardManagement.ts:31`.

The comment guide puts an `eslint-disable` directive's reason on its own line, after ` -- `. Each of these keeps it in a comment block above. The reasons still hold. Move a short form of each onto the directive.

### 13. Sidebar, `lib/` and `api/` comments `[Consistency & Drift]`
All under `client/src/`.
- `lib/hierarchyPlacement.ts:6–11`: says `hierarchy.ts`'s functions are what "a caller's own `isValid`" is built from. No caller has one, and the list is wrong for both. State this module's own assumption: it resolves the parent and never reads a cap.
- `components/sidebar/projectTreeUtils.ts:1–7`: "drop validation" (none lives here; the cap check is `useProjectDragReorder.ts`'s), and the header omits the indent constants it owns.
- `components/sidebar/projectTreeUtils.ts:31–32`: the board's 12 is its per-level step, not a `px-3` inset, as `cardMetrics.ts`'s half of the same ruling says. Correct the reason and name `cardMetrics.ts::DESCENDANTS_INDENT_PX`.
- `components/sidebar/useProjectDragReorder.ts:114–117`: names the wrong function for the mapping, describes the server (rule (e)), restates wiki positioning §5 (rule (c)), and wraps mid-token. One line will do.
- `api/items.ts:4`: an unused re-export of `ReindexedPosition`; delete it. `:43`: "any of the above" dangles.
- **Smaller:** `components/BoardToolbar.tsx:1–2, 22–24` (two overlapping comments, neither naming the "show attached children" toggle); `components/sidebar/SortableProjectRow.tsx:1` (omits `DragGhost`); `lib/hierarchy.test.ts:47–50` (`getSubtreeHeight` feeds the sidebar's cap, not classification); `lib/hierarchyPlacement.ts:119–124` and its test title at `:167` (depth 0 is the root's children, not the root); `lib/hierarchyPlacement.ts:106–110` (`ownSlotOf` is where the board's drag starts, not the sidebar's); `components/sidebar/useProjectDragReorder.ts:69–71` (`dropLine` is also null with no `over`); `components/sidebar/projectTreeUtils.ts:139–143` ("the whole tree in view"; the wiki's term is "full context"); `components/sidebar/projectTreeUtils.test.ts:164–168` and `lib/hierarchyPlacement.test.ts:281–285` (a map that doesn't exist; an unclosed parenthesis); `api/shared.ts:1–2, 14–17` (merge into one header naming `ReindexedPosition`); `types.ts:39–43` (the "optional because hand-built fixtures may omit it" reason sits on the wrong declaration, and `makeItem` always sets the field now); `components/ConfirmDeleteInline.tsx:18–22` (a "deliberately kept apart" ruling with no difference stated; rule (f) needs the reason).

### 14. `ProjectPage.tsx` keys two children on the project, which its parent already does `[merge step: A4's handoff]`
**Files:** `client/src/components/ProjectPage.tsx:186–193, 247`; compare `client/src/App.tsx:202`.

`App.tsx` keys the whole `ProjectPage` on the selected project, so a project switch remounts both `ConfirmDeleteInline` and `ProjectOverviewTab` anyway. The inner keys don't make the page self-sufficient either: its own state (`editingName`, `activeTab`) already relies on the parent's key. Their comment is accurate, but it explains keys that do nothing.

**Fix:** drop both keys and the six-line comment.

### 15. Client test comments and titles `[Consistency & Drift]`
All under `client/src/`.
- `components/workflow/dragRegions.test.ts:59–63`: says a locked column's Cards come from `childRegionAt` with `parentKey` set. They come from the named relation, `popSession.ts::namedCardCandidate`.
- `components/workflow/popSession.test.ts:13–14` and `components/workflow/placement.test.ts:20–21`: "the tests hold at any tuning". `POP_TEST_TUNING` (`test/popFixtures.ts:37`) pins only two delays. Several cases depend on `popDistancePx` being 0, and `placement.test.ts:382–405` on `descendantsPopInDelayMs` being above 0. Pin both in `POP_TEST_TUNING`, and say the tests read their thresholds from the tuning object.
- `components/workflow/dragRegions.test.ts:105–109` ("every case below runs both steps"); `components/workflow/placement.test.ts:32–36` (`origin` also decides the card-list branch for a Stub); `components/workflow/dragCollision.test.ts:150–153` ("the first case above" isn't a column drag).
- **Case IDs not at the start of the title:** `components/workflow/dragClassification.test.ts:77, 125`, and unlisted siblings at `:49, 54, 71, 86, 97`; `components/workflow/dragRequest.test.ts:14, 23, 97, 120`, and `:40`; `components/workflow/dragRegions.test.ts:80`. In `components/sidebar/useProjectDragReorder.test.ts`, the cap describe (`:333–365`) carries TREE-1.11 in no title, TREE-1.10 is nested inside TREE-1.9's describe (`:302–331`), and the fixture `TREE_3` reads as suite TREE-3.
- **Cross-reference comments naming cases tested elsewhere:** `components/workflow/itemListOps.test.ts:300–301`; `components/workflow/itemWriteReconciliation.test.ts:16–17, 108`. Delete them, or move the right IDs into titles.
- **Smaller:** `test/dragFixtures.ts` (the header covers geometry only, though the file also owns the Card and Descendants regions and the origin fixtures; `:21–25` narrates; `:50–52` invites an override the type never allows); `test/itemFixture.ts:5–10` ("the same way the API does", though it never returns `'none'`); `components/workflow/itemWriteReconciliation.test.ts:27` (write `wiki positioning §7`) and `:110–112` ("the reducer"); `components/workflow/dragClassification.test.ts:130–132` ("reparent-to-root-ish"); `components/BandGuides.test.tsx:24` (an origin matching neither documented shape; use `freeOrigin('todo')`).

### 16. Server test comments and titles `[Consistency & Drift]`
All under `server/tests/`.
- `routes/items.test.ts:367–369`: points at `toBeGreaterThan` checks "elsewhere in this describe block"; there are none.
- `lib/itemTree.test.ts:76–78`: "every case parameterizes on `ITEM_DEPTH_CAP` (DRAG-2.10)". Two cases don't, and DRAG-2.10 is a different case.
- **Case IDs not at the start of the title:** `lib/itemTree.test.ts:89, 104`; `routes/items.test.ts:1391` (ATT-5.1 only in the comment).
- `routes/items.hierarchy.test.ts:1074`: "how the entry reads isn't a rule" contradicts ATT-8.1, whose tests pin the strings. `:17–19`: the header omits a third of the file (see #39). `countItems` is declared at `:1256`, after its use at `:853`.
- **Test-plan notation that names nothing in the code:** `WF` (`routes/columns.test.ts:115, 472`; `routes/workphases.test.ts:18`; `routes/items.hierarchy.test.ts:1235`), `WF1`/`WF2` (`:714, 888`), `PCAP` (`routes/projects.test.ts:632, 642, 685, 714, 725`; the constant is `PROJECT_DEPTH_CAP`), and "ATT-5.9's setup:" style attributions. Use the identifiers.
- `fixtures.ts:81`: "the fields the board tests read" omits two they read.
- **Outside the listed lines, same pattern:** `lib/positionResolver.test.ts:194` (a garbled title) and `:398–407` ("legacy", "pre-migration": rule (b)); `routes/items.hierarchy.test.ts:82–83, 215–216`.

### 17. E2E comments and waits `[Consistency & Drift + Correctness & Security]`
All under `tests/`.
- `helpers/itemRepositioningScenario.ts:22–26`: says positions are pinned through `/move`'s raw `position`. `/move` refuses one; they're pinned through `seed.ts::seedPositionedItems`.
- `helpers/dragGesture.ts:133–138`: `resolveDropSide` is not "the fallback for a non-row `over`"; a non-row `over` names no anchor at all.
- `helpers/seed.ts:62–66` sits above `SeededItem`, not `seedItem`, and "every seeded item goes through here" isn't true (#40); `:190–191` "every caller reads" a field none reads.
- **The zoom-in wait omits the dwell:** `ui/drag-5-stub-detach.spec.ts:258–261, 281` and `ui/drag-card-zoom-in.spec.ts:90, 124` wait on `cardPopInDelayMs` alone. The zoom-in clock is `cardZoomDwellMs + cardPopInDelayMs`, and `dragGesture.ts:174–178` says a wait must cover every clock first. It passes only because the default dwell fits in the slack. Use `clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs)`.
- `ui/drag-column-bands.spec.ts:218–221` cites the wrong case; `:378`'s "(rule 1)" is a bare pointer.
- `helpers/dragGesture.ts:9` ("this app's board", though the sidebar drags through it too) and `:33–34` (prose about other suites, and untrue for one).
- `ui/item-repositioning-cross-column-dnd.spec.ts:57–69, 86`: merges the tuning by hand and discards what `seedDragTuning` returns, where `workflow/CLAUDE.md`'s convention is to read it back.
- `ui/boards.spec.ts:394–399, 413–415`: narrates `App.tsx`'s state handling, loosely.
- `helpers/itemRepositioningScenario.ts:103–109`: types `position` as `number` beside a comment saying it's null by design.
- `helpers/boardLocators.ts:3–4`: "one spelling for every drag and repositioning spec". `item-repositioning-cross-project-dnd.spec.ts` hand-rolls `column` four times (`:66, 74, 94, 174`). The cross-column spec's copies are Story 10's (#53).

### 18. The checker's headers, and the Bruno requests' pointers `[Consistency & Drift]`
- `scripts/check-docs/rules.mts:1–2`: says what each rule enforces is in "the comment guide". It's false for `wiki-code-name`, which neither guide's checker table lists, and it names a `.claude/` file by description (rule (g)). Say what the file owns, and drop the pointer. The two guides' tables are the Architect's (Routes).
- `scripts/check-docs/check.mts:10–13`: the reason given for running every rule under `only` isn't what the code does. The real reason is that a marker naming several rules counts as used when any of them fires (#48).
- `scripts/check-docs/files.mts:1–2`: omits the classifiers other modules import (`TRANSIENT_DIR`, `isSuiteFile`, `walkFiles`, `isCode`).
- **`bruno/items/*.bru`**, which the checker doesn't scan: `move-item.bru:33–35` points at item-positioning §2 for a rule that's positioning §2's; `create-item.bru:39`, `update-item.bru:32`, `move-item.bru:35, 68` write a file path and bare `§`s where the standard is `wiki <page> §N`; `move-item.bru:37` heads a block "Hierarchy (Epic 3.5)", and the block restates about 30 lines of the wiki.
- `eslint.config.mjs:15` names `page.evaluate`, which no spec calls.

---

## Fix Now — structural

### 19. `POST /items` runs the hierarchy primitive's workphase checks again at the route, in a different order `[Duplication & Abstraction + Correctness & Security]`
**Files:** `server/src/routes/items.ts:107–114, 146–176`; `server/src/lib/itemHierarchy.ts:68–79, 183–202, 207–268`.

Root `CLAUDE.md` says a create takes its workphase from the primitive's rules, "so a create and a move can't disagree". The route rebuilds the checks around `resolveCreateWorkphase` instead: the parentless-flag refusal, the workphase-exists check and the foreign-workphase check each repeat the primitive's, message for message, and the parent query repeats `getParent`. The orders already differ: an attached create naming a workphase that doesn't exist gets "an attached item inherits its parent's workphase…", and the same request as a move gets "workphaseId does not reference an existing workphase".

**Fix:** one create entry point in `itemHierarchy.ts`, taking the resolved project. It owns those checks, in `validateHierarchyRequest`'s order. The route keeps the three checks root `CLAUDE.md` assigns it: the parent exists, it's in the same project, and the depth cap. Update `CLAUDE.md`'s bullet if a name changes.

### 20. The parent-legality rules are put together separately for items and projects `[Duplication & Abstraction]`
**Files:** `server/src/routes/projects.ts:32–50`; `server/src/lib/itemHierarchy.ts:225–243`; `server/src/routes/items.ts:136–144`; `server/src/lib/itemTree.ts:111–138`.

The parts are shared, but the sequence and "the cap gates only a changed parent" are written twice, and they already differ at the top level (#6). **Fix:** one `parentRefusal(table, cap, …)` in `itemTree.ts`, called by both writes and by `POST /items`. Land #6 through it.

### 21. A claimed neighbor is validated separately for items and projects, against a restated scope `[Duplication & Abstraction]`
**Files:** `server/src/routes/projects.ts:289–324`; `server/src/lib/itemHierarchy.ts:272–306`; `server/src/lib/itemPositionScope.ts:125–148`.

Both check the same four things in different orders, and each restates the scope instead of using the predicate the resolver queries, which is why each needs its own self-anchor case. `sharesPositionScope` exists only for this. **Fix:** one `anchorRefusal(table, scopeWhere, anchorId, subjectId)` in `positionResolver.ts` over the resolver's own predicate; each caller maps its reason to today's message. Delete `sharesPositionScope`.

### 22. The reindex disclosure is built twice, and the two builders already differ `[Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:41–52`; `server/src/routes/projects.ts:71–78`.

Items leave the row's own pair out when its position is null; projects assert `position!`. The client already reads both through one function. **Fix:** one null-guarded `withReindexDisclosure(row, reindexed)` in `positionResolver.ts`. Update root `CLAUDE.md`'s pointer.

### 23. Three hand-written, cycle-guarded walks up `parentId` `[Duplication & Abstraction]`
**Files:** `server/src/lib/itemTree.ts:72–91`; `server/src/lib/itemHierarchy.ts:81–106`; `server/src/lib/workflowItems.ts:70–88`.

Each builds its visited set differently. The downward walk is already one function. **Fix:** one `ancestorsOf(table, id, tx?)` in `itemTree.ts`; each caller keeps its stop rule.

### 24. `createDefaultBoard` is shared domain logic in a route file `[File Responsibility + Consistency & Drift]`
**Files:** `server/src/routes/boards.ts:19–68`; imported by `server/src/routes/workflows.ts:15` and `server/src/db/runMigrations.ts:11`.

It's the repo's only route-to-route import, against root `CLAUDE.md`'s "routes import from `lib/`, never from each other", and it pulls a route module into the migration path. Nothing records it as deliberate, and no plan defers it. **Fix:** move it to `lib/`, next to `boardCascade.ts`'s `deleteBoardsById`, and repoint the importers. `.claude/personas/coder.md:60` names its current home (Routes).

### 25. A project's delete cascade lives in its route, and the workflow-delete order is written twice `[File Responsibility + Duplication & Abstraction]`
**Files:** `server/src/routes/projects.ts:182–237`; `server/src/routes/workflows.ts:231–253`.

The 55-line cascade is the only reason the project routes import five other tables. "Boards, then notifications, then workphases, then the workflow" is order-sensitive (columns reference workphases) and written in both files. Root `CLAUDE.md` calls these cascades candidates for `ON DELETE CASCADE`, but no plan schedules that. **Fix:** `lib/projectCascade.ts`, calling one `deleteWorkflowsById(ids, tx)` that the workflow DELETE uses too.

### 26. The test routes repeat one write-or-404 body four times `[Duplication & Abstraction]`
**File:** `server/src/routes/testHelpers.ts:26–31, 42–47, 60–65, 77–82`. `testing-strategy.md` gives each new kind of setup a route here, so the file grows by copying. **Fix:** a local `writeOrNotFound(res, table, id, values, message)`.

### 27. The sidebar writes the depth-cap formula inline instead of calling `isWithinDepthCap` `[Duplication & Abstraction]`
**Files:** `client/src/components/sidebar/useProjectDragReorder.ts:63, 79–83`; `client/src/components/workflow/dragClassification.ts:46–53`.

Both cite wiki hierarchy-placement §6. The sidebar converts a 0-based depth by hand and walks the subtree twice; each copy is tested only against itself. The predicate sits in a board-only module, which is why the sidebar couldn't reach it. **Fix:** move `isWithinDepthCap` to `lib/hierarchy.ts`, next to the functions it reads, and call it from both.

### 28. The sibling order (position with null as 0, then creation) is written twice `[Duplication & Abstraction]`
**Files:** `client/src/components/sidebar/projectTreeUtils.ts:53–57`; `client/src/components/workflow/itemListOps.ts:152–156`.

Both cite wiki positioning §1; root `CLAUDE.md` makes `lib/hierarchy.ts` the shared layer. **Fix:** one generic `byPositionThenCreatedAt` in `lib/hierarchy.ts`. Two more copies in `tests/helpers/itemRepositioningScenario.ts:128, 221` may stay as an independent read of the server's order.

### 29. The project parent dropdown walks the tree its own way, and orders siblings differently from the sidebar `[Duplication & Abstraction]`
**Files:** `client/src/lib/hierarchy.ts:144–161` (`buildParentOptions`' indented branch); its one caller `client/src/components/ProjectOverviewTab.tsx:113`.

It's a third group-then-walk over projects, beside `flattenHierarchyOf`, which root `CLAUDE.md` says never to duplicate. It groups in the order of App's `projects` array, which a write never re-sorts, so after a sidebar reorder the dropdown lists siblings in the old order until a reload. **Fix:** route it through `flattenHierarchyOf` with #28's comparator. The dropdown's order changes visibly; the project page is a placeholder under wiki project-tree's Open questions, so no rule constrains it.

### 30. The pop step is written out with eight positional arguments, twice in the hook and 56 times in tests `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:280–289, 319–328`; `client/src/components/workflow/popSession.test.ts` (52 calls); `client/src/components/workflow/placement.test.ts:395–402`.

The last two parameters have defaults, so leaving one out at one site compiles: drop `parentKeyOf` from the hop loop, and a cascaded pop-out from a context scrolled out of view lands on Board, on that path only. **Fix:** a local `step(from, regions)` in the hook; a single-sample `step` in `test/popFixtures.ts` that `runPop` and `hoverAt` build on, with the 13 calls that already fit them routed through.

### 31. Three wrappers rename shared helpers that the other surface calls directly `[Duplication & Abstraction]`
**Files:** `client/src/components/sidebar/projectTreeUtils.ts:84–86, 93–95` (`getDescendantIds`, `eligibleRows` = `toRows`); `client/src/components/workflow/itemWriteReconciliation.ts:20–30` (`applyItemWriteResponse` = `applyWriteResponse`).

A search for the shared helper's readers misses one side. **Fix:** call them directly; move the wrappers' comments to their call sites (the workphase-cascade caveat to `completeItemWrite`); update `useBoardDnd.ts:556`'s reference. The two test files that test the one function under two names then merge (Routes, for the Reconciler).

### 32. The "latest value" ref is hand-written four times, twice for the same object `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:164–170, 347–349`; `client/src/components/workflow/usePendingGhostGuard.ts:26–29`; `client/src/components/workflow/useSnapTween.ts:17–20`. **Fix:** a `useLatest<T>` in `workflow/`, called first at each site so effect order is unchanged.

### 33. The write-response envelope is typed three times, and the Sheet's callbacks narrow it to `Item` `[Duplication & Abstraction + Consistency & Drift]`
**Files:** `client/src/api/items.ts:15`; `client/src/api/projects.ts:8`; `client/src/lib/positionedWrite.ts:13`; `client/src/components/ItemDetailPanel.tsx:34–38, 219–233`; `client/src/components/item-detail/ChildrenSection.tsx:12–13`, `ParentSection.tsx:12`, `AgentSection.tsx:9`.

The field is optional, so renaming it in one spelling still type-checks, and the fold would drop the pairs silently. The panel's sections pass the response up typed as `Item`, so the disclosure reaches the board only because nothing copies it on the way. **Fix:** one `PositionedWriteResponse<T>` in `api/shared.ts`, with the two API types as aliases; type the panel's callbacks with it.

### 34. Two drag-cue constants sit in the wrong modules, and the drop lines repeat their shape `[File Responsibility + Duplication & Abstraction]`
**Files:** `client/src/components/dragChrome.tsx:62–66`; `client/src/components/BandGuides.tsx:60–65`; readers `sidebar/SortableProjectRow.tsx:9, 106` and `KanbanCard.tsx:23, 237`.

`INVALID_DROP_INDICATOR_LINE` is read only by the sidebar. `ACTIVE_CONTEXT_OUTLINE` is shared board chrome, but lives in `BandGuides.tsx`, so `KanbanCard.tsx` imports `BandGuides.tsx` for it alone, the edge `cardMetrics.ts`'s header guards against. The valid and invalid lines repeat seven classes, and the sidebar swaps one for the other on the same element, so a change to one makes the line jump. **Fix:** move the outline into `dragChrome.tsx`; move the invalid line beside its one reader; build both lines from one `DROP_LINE_SHAPE`. Trim `cardMetrics.ts`'s header after.

### 35. `data-drag-overlay` is spelled by hand on both drag surfaces and in the E2E wait `[Duplication & Abstraction]`
**Files:** `client/src/components/sidebar/SortableProjectRow.tsx:201–206`; `client/src/components/dragChrome.tsx:112–114`; `tests/helpers/dragGesture.ts:80`.

The helper waits for the attribute's count to reach 0, so a rename on one surface makes the wait pass at once: a silent race with the drop animation. **Fix:** export a `DRAG_OVERLAY_ATTR` constant, as `DRAG_REGION_ATTR` is, and use it at all three.

### 36. The item-gesture hook owns the column-reorder drop `[File Responsibility]`
**File:** `client/src/components/workflow/useBoardDnd.ts:17, 100, 111, 675–692`; compare `client/src/components/workflow/useColumnManagement.ts`.

The column branch finds the indexes, reorders optimistically, calls the API and resyncs on failure, a board-structure edit in a hook whose concept is the item gesture. `setBoard`, `handleReorderColumns` and the `arrayMove` import are there only for it, while `useColumnManagement.ts` owns the rest of column reorder. **Fix:** move it into `useColumnManagement` as one `onColumnDrop(activeId, overId)`; `BoardDndDeps` carries that callback instead of two. It also makes #9's "item position values" true without qualification.

### 37. `dragRegions.ts` holds the region vocabulary and a DOM resolver as two halves with disjoint readers `[File Responsibility + Consistency & Drift]`
**File:** `client/src/components/workflow/dragRegions.ts` (532 lines), and `dragRegions.test.ts` (444).

The vocabulary (types, key builders, `parseRegionKey`, `dragRegionProps`, `containsPoint`, `childRegionAt`) is read by the render components and every pure module. The DOM half (`resolveDragStructure`, `measureRegions` and their helpers, the only code that reads the live DOM) is read only by `useBoardDnd.ts` and the tests. **Recurring:** Story 6's audit (#29) judged the file one noun's lifecycle and left it, to watch "as Story 7 adds kinds". This pass brings new evidence: the two halves' readers don't overlap. **Fix:** move the DOM half to a sibling such as `dragStructure.ts`, and split the test file on the same line. The header's "pure geometry" (#10) then becomes true.

### 38. Client test fixtures: one missing, and several copied or bypassed `[Duplication & Abstraction + Consistency & Drift]`
All under `client/src/`.
- **No `makeProject`.** Three local `Project` factories: `lib/positionedWrite.test.ts:6–8`, `components/sidebar/useProjectDragReorder.test.ts:11–21` and `components/sidebar/projectTreeUtils.test.ts:15–25`. `types.ts::Project` is synced by hand, so a new field means three edits. Add `test/projectFixture.ts::makeProject`, shaped like `makeItem`.
- **The pop suites' Card-and-section layer is declared five times, and the copies differ:** `components/workflow/popSession.test.ts:221–224, 260–264, 284–285, 299`; `components/workflow/placement.test.ts:241–244, 358–360`. `test/popFixtures.ts` exists so these suites "can't drift into testing different boards", but covers only the column layer. Extend `threeColumnBoard()` with the Card, its section and their points.
- **`components/workflow/dragRegions.test.ts` re-spells region registration:** five builders (`:118–128, 152–166, 249–256, 283–301`), two verbatim copies (`:221–223`, `:237–239`), `'data-drag-region'` written 12 times and the key formats by hand. Use one `regionEl(key, rect?)` built on `dragRegionProps` and the key builders.
- **Shapes the fixtures already build:** `components/workflow/dragCollision.test.ts:231, 238, 307` (rects with hand-computed edges behind an `as unknown` cast; use `rect()`); `components/workflow/dragRegions.test.ts:368–376` (use `cardRegion()`); `components/workflow/dragRequest.test.ts:11, 15, 36, 53, 65, 75` (local `freeOrigin`/`stubOrigin` constants shadow the imported functions of the same names). **Recurring:** the shadowing and the hand-rolled `CardRegion` were Story 6's #28; this is their second audit.
- `components/workflow/itemWriteReconciliation.test.ts:19–37, 118–138`: the wiki's worked example, written twice. Hoist it.

### 39. Server test fixtures, and three test files that each hold more than one feature `[Duplication & Abstraction + File Responsibility + Consistency & Drift]`
All under `server/tests/`.
- **One setup, written by hand across five files:** a project, its workflow, the default board with no columns, and named workphases. `routes/items.test.ts:82–88` and `:1192–1198` are identical bodies under two names; more at `routes/items.test.ts:294–297, 324–327, 361–365, 383–395, 1255–1256, 1273–1274`, `routes/items.hierarchy.test.ts:72–80`, `routes/columns.test.ts:118–126, 474–483`, `routes/workphases.test.ts:18–29, 343–348`, `routes/boards.test.ts:284–290, 403–411`. Each relies on the board being created before the workphases, which boards becoming project-owned will change. Add `fixtures.ts::workflowWithPhases`.
- **Local copies of the direct-write fixtures:** `lib/positionResolver.test.ts:13–15, 32–34` copy `setItemPosition` and `setProjectPosition` (the second keeps the name and shadows it); `routes/projects.test.ts:66–70`, `lib/itemTree.test.ts:54–74` and `routes/items.hierarchy.test.ts:55–70, 940–943` write parents directly with no fixture. Import the two; add `setItemParent` and `setProjectParent`.
- **`boardsOf` hand-rolled** at `routes/columns.test.ts:105, 121`, `routes/boards.test.ts:27, 53, 77, 109, 124, 155, 173`, `routes/workflows.test.ts:157, 182, 194`, `routes/workphases.test.ts:406` and `routes/projects.test.ts:794`.
- **`routes/columns.test.ts:17–94`** unit-tests `lib/columnRanges.ts` with no HTTP. It's the only coverage of that module, and it's in the routes layer. Move it to `lib/columnRanges.test.ts`.
- **`routes/items.test.ts` (1506 lines)** holds item CRUD, position resolution (`:382–1065`) and attached children (`:1191–1477`), each block with its own helpers. Split it into `items.positioning.test.ts` and `items.attached.test.ts`.
- **`routes/items.hierarchy.test.ts` (1466)** also holds the cross-project and cross-workflow block (`:645–916`) and the workphase-rule block (`:1235–1466`), which its header (`:17–19`) leaves out. Move both, hoisting the shared helpers once, after the `items.test.ts` split.

### 40. E2E specs and helpers skip helpers that exist, and most of the copies don't check their status `[Duplication & Abstraction + Correctness & Security]`
All under `tests/`.
- **Opening a board.** About 45 inline copies of the three-line board opener, beside `pages/ProjectSidebarPage.ts::openBoard`, which exists for it: `ui/attached-children.spec.ts` (12, plus a local closure at `:473–477`), `ui/boards-layer.spec.ts` (12), `ui/boards.spec.ts` (15), `ui/item-positioning.spec.ts:46–48, 69–71, 107–109`, and `ui/item-repositioning-cross-project-dnd.spec.ts:60–67`. The copies drop `openBoard`'s `exact: true`, and a non-exact "Board" also matches "+ New board" once the tab shows.
- **Creates and reads by hand, unchecked:** `helpers/itemRepositioningScenario.ts:31–41, 77–90, 173–206` re-spell `seedBareWorkflow`, `addWorkphases`, `seedProjects` and `seedItem`; `ui/attached-children.spec.ts` hand-rolls about 20 creates and six reads before switching to `seedItem` at `:432`; so do `ui/boards-layer.spec.ts:98–100, 131–134, 299–301, 336–338` and `api/attachedChildren.spec.ts:16–34, 51–60, 69–73`. An unchecked create shows up steps later as a missing card.
- **Moves by hand, unchecked:** about ten sites spell `PATCH /items/:id/move`, and only `ui/item-positioning.spec.ts:41–42` checks the status. At `ui/drag-column-bands.spec.ts:265` that lets DRAG-3.1's second half pass without starting from Todo, if the setup move is refused. Add `seed.ts::moveItem`, which asserts like `seedItem`; delete the three local wrappers and their `getItem`s.
- **Resets, unchecked:** `request.post('/test/reset')` at 21 sites beside `helpers/db.ts::resetAndSeedDb`, which throws on a failed reset. At `ui/item-positioning.spec.ts:22–24`, a reused server without test routes would let TC-6.4 run against the dev database.
- **Columns:** nine hand-rolled board-lookup-and-POST sites in `ui/boards-layer.spec.ts` and the two repositioning specs; add `seed.ts::seedColumn`.
- **Smaller:** the detail panel located by its Tailwind classes at six sites (`ui/item-positioning.spec.ts:116`; `ui/attached-children.spec.ts:318, 364, 411, 446, 482`); give it a role, and one `itemPanel(page)` locator. The "writes nothing" recorder pasted four times in `ui/project-tree-drag.spec.ts:112–115, 159–162, 197–200, 233–236`. Sidebar order checks building the anchored regex by hand at eight sites in the two project-tree specs; one `ProjectSidebarPage` method.

### 41. `tests/ui/boards.spec.ts` holds three concepts, two of them workflows `[File Responsibility]`
**File:** `tests/ui/boards.spec.ts` (445 lines): board basics (`:9–83`), workflow inheritance (`:89–318`) and workflow creation (`:324–445`). Each describe seeds itself. **Fix:** `workflow-inheritance.spec.ts` and `workflow-creation.spec.ts`; the basics stay or fold into `boards-layer.spec.ts`.

### 42. The checker states three of its rules more than once, and the copies of one already disagree `[Duplication & Abstraction + Correctness & Security]`
All under `scripts/check-docs/`.
- **Which lines sit inside a code fence:** `extract.mts:81–93` closes a fence by the CommonMark rule; `repoIndex.mts:101–114` and `:116–129` flip on any fence line. A wiki page showing a nested-fence example would gain a phantom section that a pointer passes against, and a suite a phantom case. None nests fences today. Export one `unfencedLines(text)` from `extract.mts`, map both index functions over it, and add a nested-fence test.
- **The transient folders:** `files.mts:19, 21` and `rules.mts:238`. A fourth folder added to two of them leaves `transient-link` silent on the third's paths. Build all three from one array.
- **The docs layout:** `check.mts::contextOf` (`:30–37`) re-spells `repoIndex.mts:41`'s wiki-page pattern and `files.mts::isSuiteFile`'s prefix; `rules.mts:194–198` spells it a third way. If one changes alone, `case-id` stops running over the test plans, or section pointers go unchecked, silently. `files.mts` exports the predicates; batch with the folders.
- **Relative links:** resolved twice in `rules.mts` (`:194–198`, `:255–259`), with two copies of the link pattern. One `resolveLink`.

---

## Routed to a story's plan

### 43. Split `drag-column-bands.spec.ts` along its three suites → Story 10 `[File Responsibility]`
**File:** `tests/ui/drag-column-bands.spec.ts` (816 lines): helpers (`:46–233`), the DRAG-3 band cases and the DRAG-1 context cases mixed in one describe (`:235–732`), and the DRAG-6 describe (`:734–816`). Its header names all three. **Fix:** move the helpers to a `tests/helpers/` module, and make one spec per suite. **Why routed:** Story 10's item 7 already re-touches this spec's helpers (#53), so the split belongs in the same change.

### 44. One rule, "this workphase belongs to the workflow the item's project uses", written three ways → Epic 4 `[Duplication & Abstraction]`
**Files:** `server/src/routes/items.ts:23–39, 64–80`; `server/src/lib/itemHierarchy.ts:118–125`. The copies disagree for a project with no workflow: the create check accepts any workphase, the create appends a position, and the read labels the item `"none"`. **Why routed:** what a project with no workflow allows is open (item-attachment's Open questions), and `epic-4-decisions.md` §12 holds it with ATT-5.11. One lookup can't be written until that's decided, and Epic 4's status model may retire the terminal half.

### 45. The active/done split for items has three homes → Epic 4 `[File Responsibility + Duplication & Abstraction]`
**Files:** `server/src/routes/workphases.ts:102–149`; `server/src/routes/items.ts:182–212`; `server/src/lib/itemHierarchy.ts:401–413`. **Why routed:** Epic 4's done-column rework may retire the terminal flag these all read, so consolidating now would mean doing it twice.

---

## Watch List

### 46. A Stub's containing Card is found from stored attachment, not as drawn, while an ancestor's write is in flight `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:66–68, 551–552`; same root at `placement.ts:159–160`. The drag start reads the item as drawn, but swaps only its first hop; the walk above uses stored rows. Pick up a grandchild while its parent's detach is in flight, release without moving, and it's reparented under the old Card. The window is one write's latency, so a hand on localhost will hardly ever hit it. **Fix if it's ever seen:** walk the rendered tree.

### 47. `POST /items` with a bogus `projectId`, `type` or `agentId` returns an opaque 500 `[Correctness & Security]`
**Files:** `server/src/routes/items.ts:121–126, 169–176`. The project is checked for presence only, so the insert fails its foreign key and the caller (an MCP agent, say) gets "Internal server error". **Fix:** existence checks with a 400, as `workflows.ts:95–100` does.

### 48. A marker naming several rules counts as used when any one fires `[Correctness & Security]`
**File:** `scripts/check-docs/check.mts:39–67`. Once one of a marker's rules fires, the rest stay suppressed with nothing reported, so a stale rule in the marker silences a real hit later. No live marker names more than one rule. **Fix:** track and report per rule.

### 49. `placement.test.ts`'s Stub subjects carry a workphase the app never gives them `[Correctness & Security]`
**File:** `client/src/components/workflow/placement.test.ts:47, 246–247, 315, 324–329, 338–345`. A real Stub drag carries its Card's workphase; `stub()` passes null, so the "keeps its workphase in a merged column" path is never reached from a Stub, and a future case would encode a write the app never sends. Today's expected values are unaffected.

### 50. Three E2E seed helpers can build the wrong state silently `[Correctness & Security]`
All under `tests/`.
- `helpers/seed.ts:166–183`: `seedPositionedItems` creates and pins in turn, so a pin near 1000 is wiped by the next create's reindex while the helper reports it. Current callers pin at most 5. Create all, then pin all.
- `helpers/seed.ts:91–97`: `seedProjects` makes a project top-level when its parent isn't seeded yet. Throw instead.
- `ui/project-tree-drag.spec.ts:51–54`: TREE-1.1 reads the server straight after release, where the file's other tests poll.

---

## Covered by

### 51. `POST /items` coerces `isAttached` with `Boolean()`, where the move refuses a non-boolean → the API contract epic
`server/src/routes/items.ts:149, 153`. `{ parentId, isAttached: "false" }` creates an attached child. The epic's plan (`docs/planning/tech-debt-stories/api-contract-zod-openapi.md`, C1) parses every non-test route's request through a schema.

### 52. "x must be a string or null", hand-written five times → the API contract epic
`server/src/routes/projects.ts:38, 268–279`; `server/src/lib/itemHierarchy.ts:208–216`. Same plan, same clause.

### 53. `drag-column-bands.spec.ts`'s timing re-spellings, the cross-column spec's locators, and `drag-5-stub-detach.spec.ts`'s grab target → Story 10
Story 10's item 7 names each: `popThrough` and the `+ 2000` margins against `clocksMargin`/`awaitPoppedOut` (`ui/drag-column-bands.spec.ts:56, 461, 469, 485, 492, 593, 606`, and the orphaned comment at `:47–54`), `article`/`column` hand-rolled in `ui/item-repositioning-cross-column-dnd.spec.ts`, and the Stub grab target repeated in `ui/drag-5-stub-detach.spec.ts`.

### 54. The skipped repositioning and zoom-in cases, and their reasons → Story 10
`ui/item-repositioning-cross-column-dnd.spec.ts:115–121, 155–156` and `ui/item-repositioning-cross-project-dnd.spec.ts:82–86, 108–110, 127–129, 196–199`, with their "same 8 cases" headers; `ui/drag-card-zoom-in.spec.ts:39–51`. The drift pass found the stated reasons stale: the swap-preview shift they cite is what `dragGesture.ts::boxOf` removes, and under the current drop model at least one case resolves to its expected value. Story 10's item 3 already says to re-check before deleting any. When it does, the headers say which cases are skipped.

---

## Informational

- **55. The sidebar never draws a project whose parent is missing or in a cycle.** `projectTreeUtils.ts:62–72` walks down from the root, where `hierarchy.ts` reads a missing parent as a root. Only a direct database edit produces it. Treat an unknown `parentId` as null in `flattenTree` if wanted.
- **56. `PUT /items/:id` answers a detach with a remedy it can't accept.** "Name a workphaseId in the same write" (`itemHierarchy.ts:111–113, 258–261`), but PUT doesn't read one. The Sheet is a placeholder until its epic.
- **57. Items left in a foreign workphase, and projects with no workflow.** The code's behavior there (a re-filed item keeps its old position; a detach under a stranded ancestor strands the new Free item unchecked; a Free item crosses into a project with no workflow keeping its workphase) is under three open wiki questions: item-positioning's on a project coming to use a different workflow, and item-attachment's "Re-filing across workflows" and "A project that uses no workflow". The Bruno docs (`create-item.bru:36–37`, `move-item.bru:53–54`) state the strict reading.
- **58. The subtree walk queries once per node** (`itemTree.ts:176–188`). Harmless at this volume.
- **59. `makeItem` never yields `positionScope: 'none'`, and one alias builds parentless attached rows** (`test/itemFixture.ts:8–13, 29`; `dragClassification.test.ts:11–13`). Neither changes a result today.
- **60. Smaller checker notes:** paths resolve from the package root, not where the command ran (`main.mts:21–22`; use `INIT_CWD`); `files.mts:35` skips code files under `.claude/` with no reason or test; two test blocks sit in files named for other modules; `files.mts` has no tests of its own.
- **61. `scopeWorkphaseIds`** is accepted by `routes/items.ts:322–335`, and nothing sends it.
- **62. Considered, not findings:** `client/.prettierrc` repeating the root's options (Prettier doesn't merge configs, sharing them means renaming both to JS configs that two guides cite, and a divergence changes only formatting); `flattenHierarchy` with no production caller (a test convenience); `rules.mts` at 328 lines (its four rule families share helpers, and splitting it scatters the one list of rules); `dragBands.ts::reservationFor`'s `'empty'` and `'none'` shapes, rendered alike; `KanbanCard.tsx:37`'s `hover:bg-zinc-750`, not in the palette.
- **63. Rulings respected.** The duplication pass checked nine "deliberately separate" rulings A4 wrote and found nothing they missed. No pass raised the 16th, a Descendants release with no `over`, which got no comment.

---

## Routes

**Landed** in the Open questions of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md` (2026-10-07). The routed findings landed in their destinations on 2026-10-21 (#43–45; see Close-out). #51–54's destinations already named them.

**For the PO:**
- `PUT /workphases/:id`'s terminal-flag backfill appends items without disclosing the reindex it can trigger (`routes/workphases.ts:141`). Wiki positioning §7 and item-positioning §5.1 list only item writes. Is the workphase write meant to disclose?
- Item-attachment §2a says an Attached write "may name the parent's workphase, or none". The code refuses an explicit `workphaseId: null` for an Attached item whose parent has one. If "none" means "omitted", nothing changes; if it means an explicit null, one side does.
- The wiki is silent on two behaviors the drift fixes now state: a project move naming both `prevId` and `nextId` uses `prevId` (project-tree §6), and a column whose endpoint is missing counts as broken (boards-columns-unsorted §9).

**For the Architect:**
- Root `CLAUDE.md`: "One position math layer" lists `itemPositionScope.ts` as table-generic, and it's items-only. The `/api/test` row omits the project pins. The gates line (`:209–210`) says unit tests run across `client/`, `server/` and `tests/`; they run across `client/`, `server/` and `scripts/` (`tests/` is Playwright), and lint runs `check:docs`.
- `testing-strategy.md`: "both Vitest suites" (there are three, one on `node:test`), and no row in the layers table for `scripts/**/*.test.mts`.
- `prettier-preemptive-practice.md:3`: the root config now covers `scripts/` and the root files too.
- `code-comments.md`'s checker table and `documentation-standards.md`'s "What the checker checks" both omit `wiki-code-name`.
- `drizzle-sqlite-patterns.md`, "Self-Referential FK Caveat": `projects.parentId` is a real FK now (since migration `0003`); only `items.parentId` is soft.
- `.claude/personas/coder.md:60` names `createDefaultBoard`'s home, which #24 moves.

**For the Test Reconciler:**
- Tests that may not prove their case: `server/tests/lib/positionResolver.test.ts:223–232` (TC-2.8 throws for the wrong reason before reaching the null check); `:167–182` (TC-2.9's positions follow creation order); `routes/items.hierarchy.test.ts:1179–1187` (asserts half its title); `routes/workflows.test.ts:86` (no foreign row, see #2); `client/.../itemWriteReconciliation.test.ts` (no `'first'`/`'last'` marker case, see #5); `client/.../dragRegions.test.ts:111–113` (no case exercises the DOMRect getter hazard `toRect` guards); `scripts/check-docs/extract.test.mts:87–92` (its fixture has no `-->`, so it doesn't exercise the strip it names; the strip's `-->` half at `extract.mts:39` is unreachable).
- Case IDs only in comments, so the cases may read as untested: `dragBands.test.ts:5` (DRAG-3.5), `dragClassification.test.ts:7` (DRAG-2.10), `itemListOps.test.ts:300–301`, `itemWriteReconciliation.test.ts:16–17, 108`, `popSession.test.ts:216` (DRAG-1.21), `:281` (DRAG-1.17); `server/tests/routes/items.test.ts:708` (probably TC-2.4).
- Tests that carry IDs the plan's Automation lines don't list: the sidebar hook's TREE-1.4, 1.8, 1.9 and 1.11 tests; `hierarchyPlacement.test.ts`'s TREE-1.3/1.4 null-root tests and DRAG-4.8 exclusion test (check they prove those cases); E2E titles carrying DRAG-5.1, 5.9, 5.10, 5.11, 5.13, DRAG-1.1, 1.5, 1.9, 1.12, 1.14, 1.24, DRAG-3.17 and TREE-3.9 while the plan shows them `Open`; TC-7.18 carried by both a lib and a route test; ATT-4.10's cycle and missing-parent cases in both `items.test.ts:1364–1402` and `items.hierarchy.test.ts`.
- Duplicates: `itemWriteReconciliation.test.ts:18–76` and `positionedWrite.test.ts` test one function under two names (#31).

**For the Test Planner:**
- TC-2.4's Automation line omits `tests/api/itemRepositioningAttachedSiblings.spec.ts`, whose header says it runs TC-2.4; its titles at `:58, 70, 89` omit TC-2.4 and TC-3.1.
- #4's fix starts with a throwaway probe of DRAG-3.24's scenario. DRAG-3.24's permanent test stays with Story 10, where it's routed.

---

## Close-out

Filled in as the audit closes. One row per required finding (#1–54).

| # | Disposition | Where it landed (routes) |
|---|---|---|
| 1–2 | Fixed | Batch 3a |
| 3 | Fixed | Batch 3b |
| 4 | Fixed | Batch 3b, after a probe that reproduced it |
| 5 | Fixed | Batch 3b |
| 6 | Fixed | Batch 3a, through #20 |
| 7 | Fixed | Batch 3c |
| 8 | Fixed | Batch 3d |
| 9 | Fixed | Batch 3e, the drag layer. The last bullet, `AttachGhostRow`, is restated, not merged: Nathan's call |
| 10–12 | Fixed | Batch 3e, the drag layer |
| 13 | Fixed | Batch 3e, the sidebar, lib and api. The `types.ts` bullet fixes the comment; Nathan ruled `positionScope` stays optional |
| 14 | Fixed | Batch 3e, the sidebar, lib and api |
| 15 | Fixed | Batch 3f (1 of 2), the client tests |
| 16–17 | open | — |
| 18 | Fixed | Batch 3c |
| 19 | Fixed | Batch 3d |
| 20 | Fixed | Batch 3a |
| 21–26 | Fixed | Batch 3d |
| 27–28 | Fixed | Batch 3e, the sidebar, lib and api |
| 29 | Fixed | Batch 3e, the sidebar, lib and api. The project page's Parent dropdown changes order, which Nathan accepted |
| 30 | Fixed | Batch 3e, the drag layer |
| 31 | Fixed | Batch 3e, the sidebar, lib and api. The test files' merge is the Reconciler's |
| 32 | Fixed | Batch 3e, the drag layer |
| 33 | Fixed | Batch 3e, the sidebar, lib and api |
| 34–37 | Fixed | Batch 3e, the drag layer |
| 38 | Fixed | Batch 3f (1 of 2), the client tests |
| 39–41 | open | — |
| 42 | Fixed | Batch 3c |
| 43 | Routed | Story 10's item 7, `epic-3-5-roadmap.md` |
| 44 | Routed | `epic-4-decisions.md` §12, "Carried in from the A6 first-run audit" |
| 45 | Routed | `epic-4-decisions.md` §12, the same block |
| 47 | Fixed | Batch 3d, with #19 |
| 51–52 | Covered | `api-contract-zod-openapi.md`, C1 |
| 53–54 | Covered | Story 10's items 3 and 7, `epic-3-5-roadmap.md` |

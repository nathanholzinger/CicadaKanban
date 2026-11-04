# Epic 3.5 Story 8.9 — The mid-Story 8 audit's fixes

**Type:** story · **Written:** 2026-11-04 by the Architect, from Story 8's mid-point audit and test reconciliation · **Status:** Batches 1–5 built and committed; Batch 6, from the confirming Reconciler run, built, for review and commit; the handoff is updated

## Goal

Land what Story 8's two mid-point reports leave for the Coder, so the audit can close before Story 8.8 starts:
- **The code quality audit:** `docs/audits/code-quality-audit-stories-8-3-to-8-7.md`. Its Fix Now is #1–#11.
- **The test reconciliation:** `docs/audits/test-reconciliation-stories-8-2-to-8-7.md`, its "For the Coder" tasks.
- **The confirming reconciliation:** `docs/audits/test-reconciliation-story-8-9-follow-up.md`, the server coverage and stamps it leaves for this story (Batch 6).

**What this story includes:**
- **Every Fix Now finding,** #1–#11.
- **The optional findings that change a file a Fix Now already changes,** so they add little to a batch or to the next audit's range: #12, #13, #14, #18, #20 (one half), #22, #23 (one part), and Informational #25's banner `key`.
- **The reconciliation's Coder tasks:**
  - the approved stamps;
  - the test fixes;
  - the stamps for the two new cases;
  - reasons for six old skips.
- **The two workflow-test fixes,** which the reconciliation routed away from Story 10 as no drag work.

**It isn't a code-first story.** It fixes defects and comments, so the usual order holds: build, gate, review. No hands-on is needed. The one drag spec change is in Batch 5, and it isn't a new drag test.

**Out of scope,** the optional findings no Fix Now touches the files of:
- **#15 and #16:** `DragTuningPanel.tsx`'s stop causes and opacity fields.
- **#17:** the `chain` test helper. Its own pass judged it not worth it.
- **#19:** the `DragSession` literal in four test files. This is its second audit (the Story 7 re-run's #24), and three of the four files aren't otherwise touched here. It's a small task of its own when Nathan wants it.
- **#20's sidebar half:** `useProjectDragReorder.test.ts`'s hand-built hook. It's TREE-2.6's test, which the reconciliation found doesn't run the case's scenario (Test Quality Concerns, 6). Story 10 reworks it.
- **#21:** `columnRanges.ts`'s two repeats. Batch 1 opens the file only for one call.
- **#23's test helpers,** and `scan.test.mts`'s CLI tests.
- **#24:** the file sizes.
- **The reconciliation's lesser test notes** (Test Quality Concerns, items 2–8 and 10). Read them when touching those files.

## Scope

- **Wiki passages:** the fixes began against existing rules; Amendment 6 now also records the PO's updates to board-drag-interaction §8 and §10, boards-columns-unsorted §7, project-tree §1 and §10, and row-references' Related line. The column-stop banner in board-drag-interaction §10 is still Planned and not built by these batches.
- **Test-plan cases:**
  - **Closed at the confirming run:** DRAG-2.11, by its two approved hook tests together.
  - **Expected to close after Batch 6,** if their tests assert every clause:
    - TREE-10.12, including the required-owner clarification below. The confirming run left it `Open` on the left-out and `null` owner.
    - TREE-10.13, new: the owned and ownerless workflow delete.
  - **Stamped, but staying `Open`,** since each stamped test asserts only part of its case:
    - DRAG-1.36, DRAG-2.12, DRAG-2.14–2.18, DRAG-2.20–2.23, DRAG-4.35, DRAG-5.16;
    - DRAG-6.15–6.19, DRAG-6.22–6.24; DRAG-6.20 and DRAG-6.27 in Batch 6;
    - TREE-2.1 and TREE-2.4–2.8; TREE-1.14 and TREE-1.15 in Batch 6.

    Their remaining clauses are Story 10's (its item 10).

  - **Planner follow-up after Amendment 6:**
    - Revised DRAG-6.15, DRAG-6.16 and DRAG-6.17 for all three resyncs, DRAG-6.21 for the hidden-item boundary, and DRAG-6.22 for the failed-column-reorder/no-live-drag boundary. Existing statuses and Automation lines are unchanged.
    - **New Open:** DRAG-6.25 (column stop/no write), DRAG-6.27 (flash window), DRAG-6.28 (late reveal); TREE-1.14, TREE-1.15 and TREE-1.16 (pickup subtree membership and height across responses); TREE-10.13 (owned and ownerless workflow deletion, preserving items).
    - **New Planned:** DRAG-6.26, the column-stop banner with cause, announcement, lifetime and no flash. The Architect must route its build; it is not a missing automation assertion on built behavior. When its wiki marker comes off, remove only the column-drag/no-cue clause from DRAG-6.22 and make DRAG-6.26 Open.
    - TREE-10.12 now explicitly includes an omitted or null required owner; its Rule already names project-tree §10 and row-references §1. Re-check its full revised Then before marking it Automated.
    - DRAG-5.16 already matches §8's explicit next-pickup rule, so its case text is unchanged. Its after-`Q` release remains uncovered according to Amendment 5 and is carried to Story 10 by ID; Scope now records it among the partial stamps.
    - TREE-2.6 stays the tier-lifetime case, with cross-references to the new placement cases; it does not absorb them.

## Inbound deferrals

- **From the code quality audit** (`docs/audits/code-quality-audit-stories-8-3-to-8-7.md`, 2026-11-04):
  - **Fix Now #1–#11:**
    - #1, three create routes that don't check a reference is a string;
    - #2, the scope script's whitespace fold;
    - #3, the forced-stop flash replaying;
    - #4–#11, comments and a test title.
  - **Its "For other roles" items.** The report sent them to Story 8.7's plan. They're in this plan's Open questions instead, since this story's close is where the audit closes.
- **From the test reconciliation** (`docs/audits/test-reconciliation-stories-8-2-to-8-7.md`, 2026-11-04):
  - **For the Coder, items 1–6:**
    - the surface stamps, and the internal stamps Nathan approved on 2026-11-04;
    - the stamps for TREE-10.12 and DRAG-5.16;
    - the test fixes;
    - the confirming Reconciler run;
    - reasons for the six old skips.
  - **For the Architect, item 5:** the two workflow-test fixes (Test Quality Concerns, 9).
  - **For the PO, items 1–4:** in Open questions.
- **From the confirming reconciliation** (`docs/audits/test-reconciliation-story-8-9-follow-up.md`, 2026-11-04), into Batch 6:
  - **Gaps, "Current Story 8.9 follow-up":** TREE-10.12's left-out and `null` owner, and TREE-10.13's whole delete.
  - **Proposed Stamps 1–5:** the surface stamps for TREE-10.12 and TREE-10.13, and the internal stamps for DRAG-6.20, DRAG-6.27, DRAG-6.22 and TREE-1.14/1.15, which Nathan approved on 2026-11-04.
  - **Test Quality Concerns, 1:** the answer to the audit's question on `cardMetrics.test.ts`'s padding test.

## Approach and phases

### Decisions

**D1. One check for a reference's shape** (#1).
- **What it does:** returns the 400's message, or null, for a reference that's required or may be null.
- **Where:** `server/src/lib/getOrNotFound.ts`, beside `existsById`. `namesARow` leaves `workflows.ts` and goes beside it.
- **Every site that checks a reference's shape calls it:**
  - the three routes #1 names;
  - `POST /workflows`, the check those three lacked;
  - the five sites that write "a string or null" inline: `itemHierarchy.ts::validateHierarchyRequest`, `projects.ts`'s `parentError` and its `prevId`/`nextId` checks, and the test routes' project parent (`testHelpers.ts`).
- **Every message stays as it is,** and so does the order: present, then a string, then naming a row.
- **The only change is to a reference that isn't a string,** in the three routes. It's a 400 now, where it was a 500 or got through as an array.

**D2. The flash lives apart from the banner** (#3).
- **When it's set and cleared:**
  - a stop sets the item to flash;
  - it's cleared once the stop's reload has drawn the board and the flash has played (`index.css::forced-stop-flash`, 1.4 s);
  - or it's cleared sooner, when another reload starts.
- **The banner keeps `forcedStopCueMs`,** as now.
- **The audit's two scenarios:**
  - **(a) A stale response's reload during the banner** clears the flash before its rows mount, so nothing replays.
  - **(b) A collapsed Card opened after the flash has played** draws no flash. Opened inside the 1.4 s, it does. That's the flash's own window, and it's still where the reloaded board draws the item (§10).
- **The flash's length is one fact.** The code now reads it as well as the CSS. So either the code sets the duration inline, as `dragChrome.tsx::ZoomCue` does, or the constant names the CSS value it matches. The way is the Coder's.

**D3. A test titled for one path runs that path** (#7).
- `useBoardDnd.test.ts`'s "is not reported when a drag is released before an armed stop fires" cancels the drag. It's retitled "cancelled", for what it drives.
- Batch 5's DRAG-6.22 stamp takes the new title, not the reconciliation's proposed one.

**D4. DRAG-5.16 gets one added assertion, in a spec that already runs.**
- The case's last *Then* is the placement after `Q`. `drag-5-stub-detach.spec.ts`'s test reads the stored item at the end, so it can also check `X`'s position against `Q`'s. That's an assertion on stored data, not a new drag, so Story 8's "No new drag tests" doesn't stop it.
- **If it fails for a timing reason,** it comes out, and the clause goes to Story 10 by ID.
- **DRAG-2.22's optional `data-drop-tier` line** (the reconciliation's Proposed Stamps, item 1) is left for Story 10. It closes no case: DRAG-2.18 and DRAG-2.16 keep other open clauses.

### Batches

Each batch ends with `npm run check`, plus `npm run test:e2e` where it touches behavior, and a stop for Nathan's review and commit. The order is the audit's: correctness first, then the comments, then the stamps on the final titles. The reports' line numbers predate these batches, so find a test by its title.

**Batch 1: the server's references** (#1; #4, #22, and the server's test work ride along)
- **#1, by D1:**
  - Call the check from `workphases.ts`, `boards.ts`, `columns.ts`, `workflows.ts` and the five inline sites.
  - **Ride-along:** `workphases.ts`'s hand-written existence check becomes `existsById`, from the module its line 7 already imports.
  - **Tests:** one refusal test each in `workphases.test.ts`, `boards.test.ts` and `columns.test.ts`, shaped as `workflows.test.ts`'s "returns 400, and creates nothing, when projectId is not a string". The values include an array holding a real id, the one that got through.
- **#4:** `workphaseOrder.ts::workphasesInOrder`'s comment names the standalone callers, as they are after #22.
- **#22** (Watch List): `getOrderedWorkphases` takes an optional transaction client.
  - `columnRanges.ts`'s hand-paired `workphasesInOrder` and `buildRankMap` (about line 161) calls it.
  - `workflows.ts`'s `GET /:id` and `boards.ts`'s `POST /` call `workphasesInOrder`, since they drop the rank map.
  - Its comment's "workflows.ts GET /:id, for one" goes with them.
- **The reconciliation's server test work,** all in `workflows.test.ts`:
  - **TREE-10.12** on the three tests of a malformed owner: "returns 400 with a specific message when projectId does not reference an existing project", "… when projectId is not a string", and "refuses a projectId that is not a string ahead of the ownership check".
    - Add `""` to the not-a-string test's values, since the case names it. It's refused as missing, not as a non-string, so retitle the test if the title then says less than it tests.
  - **The optional fields' values** ("returns 400, and creates nothing, when %s is not a string") are fewer than the owner's: they have no `true`, `7` or array holding an id. Use the owner's values (the audit's note for the Test Reconciler).
  - **"returns workphases ordered by position …"** seeds one workphase, so it proves no order. Seed several out of position order, and assert the order.
  - **"deletes a workflow with a null projectId without touching any project's items"** seeds no project or item. Seed another project with its own workflow and items, delete the orphan, and assert that project's items still exist with their workphase.
- **Size and risk:** about ten server files, all request checks or tests.
  - `itemHierarchy.ts` and `projects.ts` change only how their shape check is spelled.
  - A request that was legal before is legal now, with the same response.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 2: the forced-stop flash** (#3; #25, #14, #27 and #13 ride along)
- **#3, by D2:**
  - **Files:** `useForcedStop.ts`, or a hook beside it, for the flash's lifetime; `BoardView.tsx`, which provides the flash (about line 363) and owns the reload; `ForcedStopContext.ts`'s comment.
  - **Tests:** the flash's lifetime, as a unit test. It's set by a stop, held across the reload, and cleared after the flash or at another reload.
    - Leave them untagged.
    - Whether they map to DRAG-6.20 or DRAG-6.21 is the Reconciler's to propose.
- **#25** (Informational): `ForcedStopCue.tsx`'s banner gets a `key` for each stop, so a stop that replaces a live one restarts the fade.
- **#14** (Watch List; `BoardView.tsx` and `dragChrome.tsx` are #3's files):
  - A `tierVars({ anchor, neither, ghost })` beside `dragChrome.tsx::TIER_CLASS` spells the three property names once. `BoardView.tsx` and `useProjectDragReorder.ts` call it.
  - `TIER_CLASS` keeps its literal class strings, since Tailwind finds a class by reading the source.
  - `useProjectDragReorder.test.ts`'s strength tests check that the sidebar's three values go in. They no longer re-spell the names.
  - **#27's** `tier ? TIER_CLASS[tier] : ''`, written twice, rides along.
- **#13** (Watch List; the same block of `useProjectDragReorder.ts` as #14):
  - **The problem:** the sidebar works out the dragged subtree twice, once at pickup for the tiers and once live (a `useMemo` over `projects`).
  - **The fix:** take the descendants, the excluded rows and the cap's height from the walk at pickup (`drawnAtPickup`), and keep them on `Drawn`. `classifyTargets` already returns the subtree's ids, unused today. The height comes from the same walk, so it's either returned beside them or read from one `getSubtree` call at pickup. They then hold for the whole drag, as the tiers do, and as the board's do.
- **Size and risk:**
  - #3 changes when one CSS class is on a row, and only after a stop, with the panel's flash switch on.
  - #14, #27 and #13 change no value that's drawn.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Batch 3: the scope script** (#2; part of #23 rides along)
- **#2:** `lineKinds.mts::strippedCode` collapses whitespace only between tokens.
  - String, regex and template text stays exact, on a one-line literal and on a multiline template's first line, from the backtick on.
  - **Tests:** `classify.test.mts` gets a case beside the multiline template's: `'a b'` to `'a  b'` on one line reads `'all'`. Add one for a regex too.
- **#23's parsing** (Watch List, the same function): parse the text once for `cover`, `importLines` and `templateLines`, and number their lines alike. Today `importLines` counts from 0 and `templateLines` from 1, read side by side.
  - **#26's note** rides along if the fix covers it: a comment after a multiline template's closing backtick reads as code.
- **Size and risk:** tooling only, with its own tests.
- **Gate:** `npm run check`, which runs the scripts' tests.

**Batch 4: comments and test titles** (#5–#11; #10's header, #12, #18 and half of #20 ride along)
- **#5:** `useBoardDnd.test.ts`'s header names what the file holds: the cases that need the hook's live session. It keeps the note that the gesture itself is tested through the pure modules and the E2E specs.
- **#6:** `dragChrome.test.tsx`'s tier fixture comment: "V is a Free Card X fits under; of the T chain, X fits under T1 only".
- **#7, by D3:** the test is retitled "cancelled".
- **#8:** `index.css`'s `cue-fill` comment points at `dragChrome.tsx::ZoomCue`.
- **#9:** `DragSessionContext.ts::useIsLockedAtCard`'s comment lists `KanbanCard`'s four reads, or drops the count.
- **#10:** `workflow/AGENTS.md`'s lists gain `forcedStop.ts` (a stopped drag's signal, its wording and the armed stop) and `useForcedStop.ts` (the cue's lifetime, held by `BoardView.tsx`). `useBoardDnd.ts`'s header names `forcedStop.ts` and the stop it reports.
- **#11:** `dragTuning.ts`'s header says it holds the drag surfaces' tunable values: the board's gesture, its cues, and the sidebar's tiers.
- **#12** (Watch List, with #6): the tier fixtures build a top-level item Free, in `dragChrome.test.tsx` and `dragClassification.test.ts`'s `item()`.
  - Every expectation should hold unchanged.
  - If one changes, stop and report it. Don't change the expectation.
- **#18** (Watch List, with #5 and #7): `useBoardDnd.test.ts`'s helpers go to module scope, with a `startDrag(overrides)` under them. That's `failingColumnSave`, `pickupSession`, and the armed-stop tests' setup.
- **#20's `dragChrome.test.tsx` half** (Watch List, with #6): the overlay case and `inSession` use `rowIn`'s providers.
- **Size and risk:** about ten client files. It's comments and tests only, with no app code. #12 and #18 change test setup.
- **Gate:** `npm run check`.

**Batch 5: the reconciliation's stamps and test fixes**
- **Surface stamps** (Proposed Stamps, items 1 and 2):
  - DRAG-2.22 on `drag-7-modal-hold.spec.ts`'s DRAG-7.21 test;
  - DRAG-6.15 on `drag-7-hierarchy-modal.spec.ts`'s DRAG-7.23 test.

  Use the titles the report gives.
- **Internal stamps** (Proposed Stamps, items 3–10; approved by Nathan, 2026-11-04). Use the titles the report gives, except:
  - **`useBoardDnd.test.ts`'s armed-stop test** takes #7's title: `'DRAG-6.22: is not reported when a drag is cancelled before an armed stop fires'`.
  - **`ForcedStopCue.test.tsx`'s "says why in the status element when the cause is %s" is fixed first** (Test Quality Concerns, 1). It and "words the two causes differently" should assert DRAG-6.16's two sentences as the case writes them, not the component's `STOP_WORDING`. Then the first is stamped.
- **DRAG-5.16, by D4:** on `drag-5-stub-detach.spec.ts`'s "immediately after a detach, the same item drags and reorders normally as a Card", with the one added assertion.
- **Six old skips get their reason** (Test Quality Concerns, 11): `item-repositioning-cross-column-dnd.spec.ts`'s two and `item-repositioning-cross-project-dnd.spec.ts`'s four.
  - Each gets one line above it, with the reason, from the commit that skipped it.
  - Story 10 takes the specs up either way.
- **Size and risk:** titles in about ten test files, one test fix, one assertion and six comments.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Then: the confirming Reconciler run.** Ran 2026-11-04 on Batch 5's commit: `docs/audits/test-reconciliation-story-8-9-follow-up.md`.
- **DRAG-2.11 is `Automated`.** Nothing else in the catalog changed.
- **TREE-10.12 stays `Open`:** no test refuses a left-out or `null` owner with nothing created. **DRAG-5.16 stays `Open`,** as Amendment 5 expected.
- **It answers** this plan's questions for the Test Reconciler (Open questions).

**Batch 6: the confirming run's follow-up** (its Gaps' "Current Story 8.9 follow-up", Proposed Stamps 1–5, and Test Quality Concerns 1). Tests and titles only. Find each test by the title the report gives.
- **TREE-10.12, the required owner** (Proposed Stamps 1; Test Quality Concerns 3):
  - **The route already refuses every value.** `workflows.ts`'s `!projectId` takes a left-out, `null`, `""`, `false` or `0` owner as missing, and `existsById` takes an id no project has. What's missing is one test that asserts the case's whole *Then* on its *Given*.
  - **Widen "TREE-10.12: returns 400, and creates nothing, when projectId is empty or not a string"** to the case:
    - Its fixture gains the case's `Q`, which owns `W`, beside `P`, which has no workflow.
    - Its values become the case's list: left out, `null`, an id no project has, `""`, `false`, `0`, `7`, `true`, `{}`, `[]`, and an array holding `Q`'s id. Keep the array holding `P`'s id, the value that got through before Batch 1.
    - After the refusals: `P` has no workflow, `Q` has `W` alone, and a create naming `P` by its id is accepted.
    - Retitle it for its wider values, keeping the `TREE-10.12: ` prefix.
  - **"returns 400 when projectId is missing" goes.** It's the widened test's first value now, which also checks that nothing was created.
  - The other two TREE-10.12 tests stay as they are: the unknown id's message, and the array refused ahead of the ownership check.
- **TREE-10.13, the workflow delete** (Proposed Stamps 2; Test Quality Concerns 4):
  - **One new route test** in `workflows.test.ts`'s delete block, run for both variants as the notifications test runs its two: `W` owned by `P`, and `W` with no owner, seeded directly as the orphan test does.
  - **Its *Given* is the case's:**
    - `W` with boards `B1` and `B2` and their columns, workphases `W1` and `W2`, and notifications naming `W`, one of them on item `X`. A notification carries a `workflowId` and no workphase, so `W`'s notifications are the rows that name `W`.
    - `Q` owning `V`, with its board and columns, workphase `V1`, and a notification naming `V`.
    - Items: `X` holding `W1`; `Z`, in `Q`, holding `W2`; `Y`, in `Q`, holding `V1`. If the API refuses to create `Z` in a workphase of a workflow its project doesn't use, seed it directly.
  - **Assert every clause after the delete:**
    - gone: `W`, `B1`, `B2`, their columns, `W1`, `W2` and `W`'s notifications;
    - `X` and `Z` survive with a null `workphaseId`, and every other field as it was; `Y` is as it was;
    - on `V`'s board, `Z` is in `unsorted.invalidItems`, and `Y` is in its column;
    - `V`, its board, columns, workphases and notification are as they were, and `P` and `Q` both exist.
  - **If a clause fails, stop and report it.** The PO wrote the rule from `workflowCascade.ts::deleteWorkflowsById`, so it should hold, but no test has asserted it whole. Change neither the expectation nor the code.
  - **The four existing delete tests are stamped** with the report's titles: the owned delete, the workflow's own notifications, the cross-project items, and the orphan. They're otherwise unchanged. "TREE-10.3: after the workflow a project uses is deleted, …" keeps its own ID.
- **The internal stamps** (Proposed Stamps 3–5; approved by Nathan, 2026-11-04). The report gives each exact title:
  - **DRAG-6.20:** `useForcedStop.test.ts`'s "names the stopped item from the stop on, and has none before it"; `dragChrome.test.tsx`'s "flashes the row it names, for the flash’s length" and "leaves every other row, and every row while none is named, without it".
  - **DRAG-6.27:** `useForcedStop.test.ts`'s "is held across the stop’s own reload, …", "is let go once it has played, …", "is let go when another reload starts after it has been drawn, …" and "is let go at the next drag’s start, with the banner".
  - **DRAG-6.22 and DRAG-6.27:** `useForcedStop.test.ts`'s "is not drawn at all by a reload that finishes with no stop behind it".
  - **TREE-1.14 and TREE-1.15:** `useProjectDragReorder.test.ts`'s "holds the carried subtree, and the height the cap reads, for the whole drag". Not TREE-1.16: the test never moves a descendant out.
  - **The rest stay untagged,** as the report says: the second stop's wait, the stop's key and the banner's key.
- **`cardMetrics.test.ts`'s padding test is retitled** (Test Quality Concerns 1, the audit's question).
  - "puts that height on the box every Stub-sized row shares, with no vertical padding to add to it" claims an outer height it can't show: under border-box, padding sits inside the height.
  - Retitle it for what it asserts, that the shared box's classes hold the height class and no vertical padding class. Its assertions stay.
  - It takes no ID. DRAG-3.25 stays `Open`, and Story 10's.
- **The handoff's test-plan list** gains Batch 6's stamps, the removed test and the retitles.
- **Size and risk:** five test files and no app code.
  - `workflows.test.ts`: one test widened, one added, one removed and four stamped.
  - The rest are titles: `useForcedStop.test.ts`, `dragChrome.test.tsx`, `useProjectDragReorder.test.ts` and `cardMetrics.test.ts`.
- **Gate:** `npm run check`. No spec changes, and no app code.

**Then: a narrow Reconciler run.** Nathan starts it once Batch 6 is committed.
- **Its scope:** TREE-10.12, TREE-10.13 and Batch 6's stamps.
- **Expected:**
  - TREE-10.12 and TREE-10.13 `Automated` if their tests assert every clause;
  - DRAG-6.20, DRAG-6.27, TREE-1.14 and TREE-1.15 mapped, and still `Open`.

**Close** (the Architect):
- **The audit's Close-out table:** a row for each of #1–#11, each checked against the code.
- **Story 10's item 10** names the confirming report's "Full-case decisions and remaining clauses" table for what each case still misses, in place of the first report's Coverage Mapping.
- **Archive:** the audit, the three reconciliation reports and this plan go to `docs/archive/`, and the scope folder is deleted.
- **No audit for this story alone.** Its commits fall in the next audit's range, from the tag on this audit's end: `epic-3-5-story-8-7-audited`, on `f18f530`. The report named another tag, on `f920eb7`. Only docs changed between the two commits, so the range is the same.

## Code map

Filled in by the Coder.

| Symbol | Carries |
|---|---|
| `server/src/lib/getOrNotFound.ts::referenceShapeError` | D1: the 400's message for a reference that isn't a string, or null. `nullable` lets it be `null`, `optional` lets it be left out. |
| `server/src/lib/getOrNotFound.ts::namesARow` | Moved from `workflows.ts`, beside the check that goes with it. |
| `server/src/lib/workphaseOrder.ts::getOrderedWorkphases` | #22: takes the optional `client`, as `workphasesInOrder` does. |
| `client/src/components/workflow/forcedStop.ts::STOP_FLASH_MS` | D2: the flash's one length. It is the row's inline `animation-duration` and how long the board holds the item once its reloaded board is drawn. |
| `client/src/components/workflow/useForcedStop.ts` | D2: the flash's lifetime, apart from the banner's. `flashItemId` is named by the stop, waits for its reload to draw the board (`boardDrawn`), plays for `STOP_FLASH_MS`, and is let go when another reload starts (`reloadStarted`). #25: `stopKey`, a number for each stop. |
| `client/src/components/BoardView.tsx::loadBoard` | D2: tells the hook when a reload starts and when it has drawn. It is the one place every reload of the board passes. |
| `client/src/components/dragChrome.tsx::tierVars`, `tierClass` | #14, #27: the three property names spelled once for the surfaces that set them, and a row's class for its tier, or none. `TIER_CLASS` is private now. |
| `client/src/components/sidebar/useProjectDragReorder.ts::Drawn.subtree` | #13: the carried project's descendants, excluded rows and height, from one `getSubtree` at pickup, held for the drag as the tiers are. |
| `scripts/audit-scope/lineKinds.mts::strippedCode`, `collapseOutside`, `valueSpans` | #2: whitespace collapses only between tokens. A string, a regular expression and the text of a template keep it exactly, on a line of their own or in the middle of one. |
| `scripts/audit-scope/lineKinds.mts` (one parse) | #23: the comment cover, the imports, the template lines and the value spans all read one parse, and every line number counts from 1. |
| `scripts/check-docs/extract.mts::parseScript`, `extractFromSource` | The parse and `extractCode`'s body, split so a caller that needs the same parse for more doesn't make a second. `extractCode` is unchanged for its other callers. |

## Amendments

**1. 2026-11-04, Batch 1 built** (Coder).
- **The check's options are `{ nullable, optional }`, not `{ required }`.** The test route's project parent must be given but may be `null`, and a request that leaves it out is refused today. `{ required }` has no word for that. Two flags cover all three cases, and every message and order is as D1 says.
- **Sites that call it:**
  - the three create routes and `POST /workflows`' `projectId`;
  - `POST /workflows`' two optional references, `itemHierarchy.ts::validateHierarchyRequest`'s `parentId` and `workphaseId`, `projects.ts`'s `parentError` and its `prevId`/`nextId`, and the test route's project parent.
- **A column's start and end** were already refused when they aren't strings, one step later: the rank map is keyed by id, so a lookup by an array finds nothing. They now get the shape message first. Only the board's id changed behavior. `PUT /columns/:id` is the same lookup and stays as it is.
- **Tests:**
  - **The three new refusal tests** fail on the old source for `workflowId` on a workphase and on a board, and for `boardId` on a column. The start and end cases pass on the old source too, and stay as the pin for the new message.
  - **TREE-10.12's three tests are stamped.** The owner's values table gained `""`, and the test is retitled "empty or not a string", since `""`, `false` and `0` are refused as missing, ahead of the shape check.
  - **Two assertions added, which the plan didn't list:** TREE-10.12 names two clauses no test asserted, that `Q` still has `W` alone and that a create naming `P` by its id is then accepted. The first is in the ownership-order test and the second at the end of the values test. Without them the case would stay partial at the confirming run.
  - **The optional references' values are the owner's,** with the array holding an id the field would name (a real template, a real workflow).
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 437, client 660, scripts 235). `npm run test:e2e` gives 216 passed, 21 skipped, 0 failed, as at the end of Story 8.7.

**2. 2026-11-04, Batch 2 built** (Coder).
- **The flash's lifetime (D2) is a small state in `useForcedStop`,** driven by `loadBoard`:
  - a stop names the item, and the flash waits;
  - the reload the stop caused draws the board, and the flash plays for `STOP_FLASH_MS`;
  - it's let go when it has played, at the next drag's start, or when another reload starts while it plays.
  - A reload that starts while the flash still waits is the stop's own, which starts right after the report, so it leaves the flash alone. The wait has no clock of its own, so a slow reload doesn't spend the flash.
  - The banner keeps `forcedStopCueMs`, and no reload takes it away.
- **The flash's length is set inline,** on the row in `useItemRow`, as `ZoomCue` sets its own. `index.css`'s class now holds the animation's name, timing and count, and no duration, so there is one length to change.
- **A check in the browser** (a throwaway spec, deleted):
  - the armed stop's flash computes to `forced-stop-flash` for `1.4s` and goes after its time, while a 6-second banner stays;
  - a board switch during the flash, which is a reload with no stop behind it, replays nothing;
  - with `loadBoard`'s `reloadStarted()` call taken out, the same check sees the flash replay on the other board.
- **#25's `key`:** `useForcedStop` numbers each stop, and `ForcedStopCue` takes it as an optional `stopKey`. The cue's other callers and tests pass none.
- **#14 and #27:**
  - `tierVars` is the one place that spells `--drag-tier-*`, and `BoardView.tsx` and `useProjectDragReorder.ts` call it. `TIER_CLASS` keeps its literal strings.
  - `tierClass(tier)` replaces the ternary at both sites and `TIER_CLASS` is no longer exported. The sidebar row's tests read `tierClass` instead.
- **#13:** the subtree is one `getSubtree` call at pickup, kept on `Drawn`. `classifyTargets` still walks its own copy for the tiers, so pickup walks the tree twice, from the same list. Returning the height from the classification would change `DragClassification`, which four test files build by hand (#19).
  - **A consequence, for the Architect:** the descendants, the excluded rows and the cap's height now hold for the whole drag. A project write that lands mid-drag and puts a project under the carried one leaves it a drop candidate, and a drop beside it would be refused by the server (a cycle, or past the cap). Before, the live subtree excluded it. The board avoids this by ending a drag at any reload, which the sidebar doesn't do.
- **Tests:**
  - `useForcedStop.test.ts` holds the flash's lifetime, untagged: named by the stop; held across a slow reload; let go after `STOP_FLASH_MS`; let go by another reload; a reload with no stop behind it draws nothing; let go at the next drag; a second stop's own wait. It also holds the stop's key.
  - `dragChrome.test.tsx` holds the row's side: it flashes the item the context names, with `STOP_FLASH_MS` set on it, and no other.
  - `ForcedStopCue.test.tsx` holds the key, and `useProjectDragReorder.test.ts` the subtree held for the drag (it fails on the old hook). Its strength tests no longer re-spell the property names.
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 437, client 672, scripts 235). `npm run test:e2e` gives 216 passed, 21 skipped, 0 failed.

**3. 2026-11-04, Batch 3 built** (Coder).
- **#2:** `strippedCode` now reads each line's value spans from the parse (strings, regular expressions, and template text from the backtick, or the `}` that resumes it, to the end of each line it reaches) and collapses whitespace outside them only.
  - A comment or a test title that sits on a value span still blanks, and wins over it: a test title is a string and isn't code.
  - A template's later lines are the same spans, so the special case that quoted a whole line is now the spans' own: the line is quoted only so a blank one of a template stays a line.
- **#26's note is covered:** the comment after a multiline template's closing backtick no longer reads as code, since that line's code is now stripped like any other.
- **#23's parsing:** `cover`, `importLines`, the template lines and the value spans read one parse, the one `lineKinds` and `strippedCode` make. That took one split in `check-docs/extract.mts` (`parseScript`, `extractFromSource`), which `extractCode` now calls, so the checker is unchanged.
  - `importLines` counted from 0 and the template lines from 1; both count from 1 now, as `skip` and the diff do.
  - `templateLines(fileName, text)`, which `diff.mts` calls, keeps its signature.
- **Tests:**
  - **`classify.test.mts`:** a string `', '` that becomes `',  '` on one line, and a regular expression's one space made two, each read `'all'`. Both fail on the old source.
  - **`lineKinds.test.mts`:**
    - a string, a regular expression and a one-line template, each differing when a space inside changes;
    - a multiline template's first line differing from its backtick on;
    - the whitespace between tokens still collapsing, a title still blanking, and the comment after a closing backtick.
    - Seven of the new tests fail on the old source. The other three pin what stays.
- **A check on real history:** the scope script ran over Batches 1 and 2 (`f18f530` to `HEAD`) and wrote its scope files.
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 437, client 672, scripts 245). The plan sets no E2E run for this batch, and none of its files is loaded by the app.

**4. 2026-11-04, Batch 4 built** (Coder).
- **Comments, as the audit words them:**
  - #5: `useBoardDnd.test.ts`'s header names the six cases that need the hook's live session, and keeps the note about the pure modules and the E2E specs.
  - #6: `dragChrome.test.tsx`'s fixture comment, "V is a Free Card X fits under; of the T chain, X fits under T1 only".
  - #8: `index.css`'s `cue-fill` comment points at `dragChrome.tsx::ZoomCue`, and names both lengths that drive it (`cardPopInDelayMs` and `modalHoldCueMs`). The same comment began with a story and a date, which the documentation standards leave out, so that prefix went with the rewrite.
  - #9: `useIsLockedAtCard` lists `KanbanCard`'s four reads: forced open, the projected depth, no transition on the root, and the active-context outline.
  - #10: `workflow/AGENTS.md` lists `forcedStop.ts` and `useForcedStop.ts`. Since Batch 2, `forcedStop.ts` also holds the flash's length and `useForcedStop.ts` the flash's lifetime, so the entries say so. `useBoardDnd.ts`'s header names `forcedStop.ts` and the stop the hook reports.
  - #11: `dragTuning.ts`'s header says it holds the drag surfaces' values: the board's gesture, its cues and the sidebar's tiers.
- **#7, by D3:** the armed-stop test that cancels is retitled "cancelled". Batch 5's DRAG-6.22 stamp takes that title.
- **#12:** `dragChrome.test.tsx` builds its roots Free (`stub` now takes a string parent, so a root can't be built attached), and `dragClassification.test.ts`'s `item()` defaults a root to Free and a child to attached, as stored rows are. Every expectation held unchanged.
- **#18:**
  - `useBoardDnd.test.ts` has `startDrag(overrides, id)`, `pickupSession` and `failingColumnSave` at module scope. The hand-written pickups in the modal, Stub-start, neighbor, cancel, release and armed-stop tests call them, and so does DRAG-6.15 for the failing save.
  - The two armed-stop tests sit in a nested describe, "with a stop armed for the next drag", with the fake timers in `beforeEach` and `afterEach` where each had a `try` and `finally`. A test's own title, which the stamps read, is unchanged apart from #7.
- **#20's `dragChrome.test.tsx` half:** `providers(session, placements)` is the one wrapper, which `rowIn`, the overlay case and `inSession` use. The overlay case and `inSession` now also supply an empty `PlacementsContext`, which is what they read by default. The sidebar half stays out, as the plan says.
- **No test added or removed,** so the counts hold. The batch changes no app code.
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 437, client 672, scripts 245).

**5. 2026-11-04, Batch 5 built** (Coder).
- **The surface stamps,** with the report's titles: DRAG-2.22 on the DRAG-7.21 spec, and DRAG-6.15 on the DRAG-7.23 spec that stops a drag by a reload. The optional `data-drop-tier` line stays for Story 10, as D4 says.
- **The internal stamps,** with the report's titles, in nine files: `useBoardDnd.test.ts` (13 tests), `useForcedStop.test.ts`, `ForcedStopCue.test.tsx`, `dragClassification.test.ts`, `dragChrome.test.tsx`, `useProjectDragReorder.test.ts`, `lib/dragTargets.test.ts` and `SortableProjectRow.test.tsx`. The armed-stop test that cancels takes D3's title.
- **`ForcedStopCue.test.tsx` was fixed first.** It reads DRAG-6.16's two sentences as the case writes them, and no longer the component's constant. Its "says why" test also checks the other cause's sentence is absent, which DRAG-6.17 asks. "Words the two causes differently" now renders both and compares them with the two sentences, so its title ends "each in its own sentence". It carries no ID, as the report proposed none.
- **The six skips each have their reason line,** in the form the drag specs already use. The reason is the skipping commit's: the tests were failing, to be fine-tuned with the drag work. Each line adds what its test's own comments say about its aim.
- **DRAG-5.16 is stamped, and gets no added assertion.** D4 expected the stored item could also be checked against `Q`'s, but the spec's second drag is released on `P`, not after `Q`, so no assertion on its stored data can show the case's last clause.
  - A throwaway copy measured it. After the detach, `X` already sits after `Q` (positions `P` 1, `Q` 2, `X` 3). Released on `Q`'s lower half, `X` lands at 1.5, between them, in 6 of 6 runs.
  - A release "after `Q`" needs another aim: past the column's end, or `X` set back down leaning up. That's a new drag, so the clause goes to Story 10 by ID, as D4's fallback says.
  - The spec still shows the drag starting in the column, `X` staying Free, and `parentId` staying `P`.
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 437, client 672, scripts 245). `npm run test:e2e` gives 216 passed, 21 skipped, 0 failed, with the three retitled specs among those that ran.

**6. 2026-11-04, the wiki (PO).** The Open questions for the PO, and the handoff's two decisions.
- **Q1, the third resync:** named. Board §10's stop paragraph names three resyncs: a failed drop's, a stale response's, and a failed column reorder's from a column drag released just before. Each shows the cue on an item's drag, with the failed-write wording. Boards-columns-unsorted §7 gains a line that a failed reorder reloads the board, and points to §10. A deduction: the code does it, and the failed-write wording ("Your last move didn’t save") fits.
- **Q2, a column drag a reload stops** (Nathan, 2026-11-04: the banner, no flash):
  - §10's stop now covers a column's drag: it ends at once, nothing is written, and the column is wherever the reloaded board has it. That much is built.
  - **A Planned passage:** the stopped column drag shows the banner, worded by its cause, with no flash.
  - **For the Architect:** the Planned passage is code work to route.
- **Q3, deleting a workflow with no owner:** a rule, in project-tree §10. `DELETE /api/workflows/:id` deletes the workflow with its boards and their columns, its workphases and its notifications, and never an item. An item holding one of its workphases survives with none. No other item changes, owned or not. The wiki had no rule for the delete itself, only the items' side. That side is folded in, and the old sentence goes. Read from `workflowCascade.ts::deleteWorkflowsById` and the route.
- **Q4, the workflow create's owner:** named in project-tree §10 as a required reference. One left out, or naming no project, is refused with a 400, and nothing is created. Row-references' Related line now cites project-tree §10.
- **Q5, the sidebar's unwritten states:** deliberately not rules, as Story 8.7's Amendment 6 deduced. The cap is unknown only until it loads, and a collapsed project's hidden rows are seen by no one. Their tests stay uncatalogued.
- **Q6, a detached item's pickup:** board §8 says it outright. A detached item is a Free Card like any other: keeping its parent doesn't make it a Stub, and its next drag starts in its column, from the moment the detach is released.
- **The handoff's flash window:** named in §10. The window opens once the reloaded board is drawn, and closes early at the next drag's start or when another reload starts. An item brought into view inside the window flashes for what's left of it, and one brought in after it doesn't. A deduction: D2 designed it this way, and §10 said nothing of a late mount.
- **The handoff's sidebar tree at pickup** (Nathan, 2026-11-04: accept it, and write it down): project-tree §1 says so.
  - The drag counts the tree as it was at pickup: the subtree left out of placement, and its height for the cap.
  - The user's own last move can land mid-drag. If it puts a project under the dragged one, that row stays a place to drop, and a release that would make a cycle, or pass the cap, is refused by the server. Nothing changes.
  - It's named as the one place hierarchy-placement §4's cycle is reachable. The Why: one response's window, and a refused drop costs one retry.
- **For the Test Planner:**
  - **§10, a column drag stopped by a reload** (built): it ends at once, nothing is written, and no cue shows until the Planned passage is built.
  - **§10's flash window:** `useForcedStop.test.ts`'s lifetime tests are its unit half, beside DRAG-6.20 and DRAG-6.21.
  - **§8's detached item as a Free Card** is DRAG-5.16's ground.
  - **Project-tree §10:**
    - the owner as a required reference is TREE-10.12's;
    - the workflow delete is a new rule, and `workflows.test.ts`'s orphan delete test can map to a case derived from it.
  - **Project-tree §1's tree at pickup:** `useProjectDragReorder.test.ts`'s "subtree held for the drag" test is its unit half.
- **Checks:** `check:docs` passes (397 files, 0 hits).

**7. 2026-11-04, Test Planner's follow-up after the PO's pass.**
- Applied the catalog changes listed in Scope: seven new Open cases and one Planned case, plus the existing-case clarifications. The INDEX lines and Next IDs follow them.
- No production or test code read, no test code written, no coverage status or existing mapping changed. The wiki and agent definitions are unchanged by this pass.
- The cap-loading interval and hidden-row tier tests remain deliberately uncatalogued, per Amendment 6 Q5. No case pins today's flash milliseconds or opacity values.
- **For the confirming Reconciler:** read the revised case text, not only the earlier report's expectations. `useForcedStop.test.ts` and `dragChrome.test.tsx` are candidates for DRAG-6.20, DRAG-6.21, DRAG-6.27 and DRAG-6.28; the hook's lifetime alone does not establish rendered late-reveal timing, two pulses, or hidden-row behavior. A deleted probe is not a running test. `useProjectDragReorder.test.ts`'s "subtree held for the drag" is a candidate for TREE-1.14, TREE-1.15 and TREE-1.16, distinct from TREE-2.6's tier lifetime. `workflows.test.ts`'s orphan delete is a candidate for TREE-10.13; check the owned variant, dependent cleanup and unaffected items too. New mappings still require the normal ID stamps and any applicable internal approval; the earlier approval covers its named mappings, not these new cases automatically.
- Added durable carry-forward in the roadmap for umbrella close-out and Story 10's remaining drag automation. TREE-10.13's server coverage belongs to the current follow-up, not Story 10. The Planned column-banner build remains with the Architect to route.
- **Checks:** `npm run check:docs` passes (397 files, 0 hits); `git diff --check` passes. No app tests run for this documentation-only Planner pass.

**8. 2026-11-04, Batch 6 added after the confirming Reconciler run** (Architect).
- **The run** (`docs/audits/test-reconciliation-story-8-9-follow-up.md`) closed DRAG-2.11 only.
  - TREE-10.12 stays `Open` on the left-out and `null` owner, which Amendment 7 added after Batch 1's tests.
  - TREE-10.13 has no test of its whole delete, and the Planner routed it to this story, not Story 10.
- **Nathan approved the run's four new internal mappings** (Proposed Stamps 3–5): DRAG-6.20, DRAG-6.27, DRAG-6.22 with DRAG-6.27, and TREE-1.14 with TREE-1.15. None of them closes a case.
- **Changed:**
  - the Status line;
  - Goal and Inbound deferrals, which add the confirming report;
  - Scope's cases;
  - Batches, with the run's outcome, Batch 6 and a narrow Reconciler run;
  - Close: Story 10's pointer, the third report, and the tag as Nathan set it;
  - the Test Reconciler's Open questions, now answered.

**9. 2026-11-04, Batch 6 built** (Coder).
- **TREE-10.12's value test is widened to the case,** and "returns 400 when projectId is missing" is gone, as the plan says.
  - Its fixture is the case's: `P`, with no workflow, and `Q`, which owns `W`.
  - Its bodies are the case's list, left out first, then `null`, an id no project has, `""`, `false`, `0`, `7`, `true`, `{}`, `[]`, an array holding `P`'s id and one holding `Q`'s.
  - After the refusals, the workflows of the whole app are as they were (so a create that dropped its owner shows too), `P` has none, `Q` has `W` alone, and a create naming `P` by its id is accepted.
  - It is retitled "refuses a projectId that is left out, null, unknown, empty or not a string, and creates nothing".
  - **The route already refused every value,** as the plan says, so the test passes on the unchanged source.
- **TREE-10.13 has one new route test,** run for both variants, and the four delete tests are stamped with the report's titles.
  - **Every clause of the case held,** on the first run, for the owned and the ownerless `W`. No code or expectation changed.
  - **The fixture is the case's:**
    - `W` has two boards and two workphases, `W1` and `W2`; `B1` is `W`'s default board, with a column added over each workphase, and `B2` is made after the workphases, so it starts with one over each. Four columns, two notifications naming `W`, one of them on `X`.
    - `Q` owns `V`, with a board, a column over `V1` and a notification.
    - `X` holds `W1`. `Z`, in `Q`, holds `W2`: a request refuses to file it so, as the plan expected (`itemHierarchy.ts::foreignWorkphaseError`), so its workphase is written directly. `Y`, in `Q`, holds `V1`.
  - **After the delete it asserts:**
    - every table's rows for `W`: none of its workflow, boards, columns, workphases and notifications are left, from a before-count of 1, 2, 4, 2 and 2;
    - `X` and `Z` as their stored rows were, with a null `workphaseId`, and `Y` unchanged;
    - on `V`'s board, `Z` alone in `unsorted.invalidItems` and `Y` alone in its column;
    - `V`'s rows in all five tables as they were, and both projects present.
  - **The ownerless variant builds `W` the same way, and then writes its owner to null.** The plan said to seed it directly, as the orphan test does; this keeps the two variants' boards, columns and workphases from one build, and the starting data is the same: a workflow with no owner.
  - **It is an `it.each` of the two variants,** not a loop in one test, so each reports on its own. It matches the plan's "run for both variants", and the title's `%s` is the variant.
  - **A check that it can fail:** with `deleteWorkflowsById` deleting every notification, not only `W`'s, both variants fail on `V`'s; the source is restored.
  - **The TREE-10.12 check:** with the route's shape check taken out, the widened test fails on `true` (a 500), and the ownership-order test on a 409; the source is restored.
- **The internal stamps,** with the report's titles: DRAG-6.20 on the hook's and the row's three tests, DRAG-6.27 on the hook's four lifetime tests, `DRAG-6.22, DRAG-6.27` on the one for a reload with no stop behind it, and `TREE-1.14, TREE-1.15` on the sidebar's held-subtree test. The second stop's wait, the stop's key and the banner's key stay untagged.
- **`cardMetrics.test.ts`'s padding test is retitled** for what it asserts, that the shared box's classes hold the height class and no vertical padding class. It takes no ID, and its assertions are as they were.
- **Gate:** `npm run check` passes (`check:docs` 397 files, 0 hits; server 438, client 672, scripts 245). The plan sets no E2E run, and the batch changes no spec and no app code.

## Open questions

The audit's "For other roles" and the reconciliation's "For the PO".

- **For the PO:** answered in Amendment 6.
  1. **Wiki board-drag-interaction §10 names two resyncs that can land mid-drag:** a failed drop's and a stale response's. The code has a third. A failed column reorder from an earlier drag (`useBoardDnd.ts`, through `onColumnDrop`) stops a live item drag and shows the failed-write wording. Does §10 name it? (audit)
  2. **A column drag that a reload lands on** is stopped with no cue. §10 scopes its rule to an item drag. Should a column drag show the cue? (audit, #25)
  3. **Orphan-workflow deletion** (`workflows.test.ts`'s null-projectId delete). The wiki has no rule on what deleting a workflow with no owning project does to other projects' items. Is there one to write? If yes, the Test Planner derives a case. If no, the test stays uncatalogued. (reconciliation)
  4. **The workflow create's owner field** (wiki project-tree §10). §10 calls `templateId` and `sourceWorkflowId` references (row-references §1), and doesn't say so of the owning project. TREE-10.12 rests on §1's general statement. Should §10 name the owner as a reference too? (reconciliation)
  5. **Three sidebar states have tests and no rule:** the tiers while the project cap is unknown, and the rows a collapsed project hides (`useProjectDragReorder.test.ts`). Rules, or deliberately not? (reconciliation)
  6. **A detached item's pickup** (DRAG-5.16) rests on §8's "once Free, the item's relationship to its former parent is preserved", with §1's layer rule. Should §8 say outright that a detached item picks up as a Free Card? (reconciliation)
- **For the Test Reconciler,** at the confirming run (audit): answered in its report.
  - Q1: the test doesn't prove its title. Batch 6 retitles it.
  - Q2: the two blocks overlap on the cap walk, and each also asserts what the other doesn't. Nothing is deleted.
  - Q3: its Full-case decisions table gives each case's remaining clauses. Batch 6 takes this story's part, and Story 10 the rest.

  The questions as asked:
  1. **`cardMetrics.test.ts` checks that a row has no vertical padding.** Under Tailwind's border-box, padding doesn't change an `h-6` row's height, while a margin would change the list's pitch. Does the test prove its title?
  2. **`lib/dragTargets.test.ts`'s tier cases and `dragClassification.test.ts`'s tier block** may test the same walk twice, now that the board's classification hands off to `classifyTargets`.
  3. **Planner's amended/new cases:** review the Scope and Amendment 7 candidates, including TREE-10.12's required owner, TREE-10.13's full delete, the three pickup-tree cases, and the flash window/late reveal. Which exact clauses remain after existing tests and approved stamps? Propose any additional stamps and approvals; do not infer whole-case coverage from a lifetime or snapshot hook alone.
- **For the Architect:** route the unbuilt column-stop banner (DRAG-6.26, wiki board-drag-interaction §10's Planned passage). Its build is distinct from Story 10's catch-up on already-built rules. At build close, coordinate removal of DRAG-6.22's current column/no-cue clause with the Planner.

## Living-docs handoff

Written by the Coder at the end of Batch 5, and updated at the end of Batch 6.

- **Behavior decisions made while building, for the PO to rule on:**
  - **The flash's window (D2).** Wiki board-drag-interaction §10 gives the flash as two pulses, about 1.4 seconds, "where the reloaded board draws it". It is built as follows:
    - it plays for 1.4 seconds from the moment the stop's reload has drawn the board, so a slow reload doesn't spend it;
    - it's let go sooner by the next drag's start, or by another reload starting while it plays, so a reload with no stop behind it flashes nothing;
    - an item that mounts inside the window, such as a collapsed Card opened within 1.4 seconds, flashes, and one that mounts after it doesn't.
    - §10 doesn't say what a late mount does. Should the window be named there?
  - **The sidebar counts its drag by the tree at pickup (#13).** The carried project's descendants, the rows left out of placement and the height the cap reads are fixed for the drag, as its tiers are. A project write that lands mid-drag and puts a project under the carried one leaves it a drop candidate, and a drop beside it is refused by the server (a cycle, or past the cap). The board avoids this by ending a drag at any reload (§10), which the sidebar doesn't. Is the sidebar's behavior a rule, or an edge to accept?
  - **No decision, a change to match the wiki as written:** a workphase, board or column create whose reference isn't a string is a 400 now (it was a 500, and an array holding a real id created the row). Wiki row-references §1 already says it.
- **Planned passages now built:** none.
- **Implementation passages to place:** the comments on `getOrNotFound.ts::referenceShapeError` and `namesARow`, the comments Batch 4 corrected, and `workflow/AGENTS.md`'s two new entries (`forcedStop.ts`, `useForcedStop.ts`). All of them are the Coder's own.
- **Test-plan cases affected:**
  - **Stamped on surface tests:** DRAG-2.22 and DRAG-6.15 (the DRAG-7.21 and DRAG-7.23 specs), and DRAG-5.16 (see below).
  - **Stamped on internal tests,** the mappings Nathan approved:
    - DRAG-1.36, DRAG-2.11, DRAG-2.12, DRAG-4.35;
    - DRAG-2.14 to DRAG-2.18, DRAG-2.20 to DRAG-2.23;
    - DRAG-6.16 to DRAG-6.19, DRAG-6.22 to DRAG-6.24;
    - TREE-2.1 and TREE-2.4 to TREE-2.8.
  - **Stamped on internal tests at Batch 6,** the mappings Nathan approved after the confirming run, each partial:
    - DRAG-6.20, on `useForcedStop.test.ts`'s test that names the stopped item and `dragChrome.test.tsx`'s two row tests;
    - DRAG-6.27, on the hook's four lifetime tests, and DRAG-6.22 with it on the one for a reload with no stop behind it;
    - TREE-1.14 and TREE-1.15, on `useProjectDragReorder.test.ts`'s held-subtree test. Not TREE-1.16: the test never moves a descendant out.
  - **Stamped on server tests:**
    - TREE-10.12, on its three tests in `workflows.test.ts`. The value test is widened at Batch 6 to the case's whole list and its *Given* (Amendment 9), and "returns 400 when projectId is missing" is removed, as it is that test's first body. Together they assert every clause, with two assertions the plan didn't list (Amendment 1).
    - TREE-10.13, on a new test of the whole delete, run for the owned and the ownerless workflow, and on the four existing delete tests, which assert a part each. Every clause held.
  - **Closed at the confirming run:** DRAG-2.11. **Expected to close at the narrow run:** TREE-10.12 and TREE-10.13. The others above stay `Open`, each stamped test asserting part of its case.
  - **DRAG-5.16 is stamped, and its last clause isn't asserted** (Amendment 5): the spec's second drag is released on `P`, not after `Q`. It stays `Open`, and the clause is Story 10's by ID.
  - **Retitled on the way:** TREE-10.12's value test ("left out, null, unknown, empty or not a string"), DRAG-6.22's armed-stop test ("cancelled"), and `cardMetrics.test.ts`'s padding test, which takes no ID. DRAG-3.25 stays `Open`, and Story 10's.
  - **Untagged tests added, for the Reconciler to map:** the hook's wait for a second stop and the stop's key in `useForcedStop.test.ts`, and the banner's key in `ForcedStopCue.test.tsx`. The report proposed no ID for them.
  - **The six old skips** carry their reasons now.
- **For the Architect, at close:**
  - **Story 10's item 10** takes DRAG-5.16's after-`Q` release by ID.
  - **The audit's Close-out table,** each Fix Now against the code:
    - #1: `getOrNotFound.ts::referenceShapeError`, called from the three create routes, `POST /workflows` and the five inline sites;
    - #2: `lineKinds.mts::strippedCode`;
    - #3: `useForcedStop.ts` and `BoardView.tsx::loadBoard`;
    - #4: `workphaseOrder.ts::workphasesInOrder`'s comment;
    - #5 to #11: `useBoardDnd.test.ts`'s header, `dragChrome.test.tsx`'s fixture comment, the retitled armed-stop test, `index.css`'s `cue-fill` comment, `DragSessionContext.ts::useIsLockedAtCard`, `workflow/AGENTS.md` with `useBoardDnd.ts`'s header, and `dragTuning.ts`'s header.
  - **The narrow Reconciler run** is Nathan's to start once Batch 6 is committed: TREE-10.12, TREE-10.13 and Batch 6's stamps.
- **Wiki sections added, changed, moved or removed** (PO, at close): board-drag-interaction §8 and §10, boards-columns-unsorted §7, project-tree §1 and §10, and row-references' Related line. Amendment 6.
- **Test Planner applied:** Amendment 7 and Scope list the revised cases and eight new IDs. Reconciliation is the next requested step, not run as part of this Planner pass. Existing mapping approvals remain as recorded; the new cases are not stamped or declared covered by the Planner.

# Epic 3.5 Story 8.9 — The mid-Story 8 audit's fixes

**Type:** story · **Written:** 2026-11-04 by the Architect, from Story 8's mid-point audit and test reconciliation · **Status:** in progress, Batch 3 built for review and commit

## Goal

Land what Story 8's two mid-point reports leave for the Coder, so the audit can close before Story 8.8 starts:
- **The code quality audit:** `docs/audits/code-quality-audit-stories-8-3-to-8-7.md`. Its Fix Now is #1–#11.
- **The test reconciliation:** `docs/audits/test-reconciliation-stories-8-2-to-8-7.md`, its "For the Coder" tasks.

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

- **Wiki passages:** none. #1 brings three routes to wiki row-references §1, and #3 brings the flash to board-drag-interaction §10, as both already read.
- **Test-plan cases:**
  - **Expected to close:**
    - DRAG-2.11: its two approved hook tests together assert the whole case.
    - TREE-10.12 and DRAG-5.16: new, and they close if their tests assert every clause.
  - **Stamped, but staying `Open`,** since each stamped test asserts only part of its case:
    - DRAG-1.36, DRAG-2.12, DRAG-2.14–2.18, DRAG-2.20–2.23, DRAG-4.35;
    - DRAG-6.15–6.19, DRAG-6.22–6.24;
    - TREE-2.1 and TREE-2.4–2.8.

    Their remaining clauses are Story 10's (its item 10).

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

**Then: the confirming Reconciler run.** Nathan starts it once Batch 5 is committed.
- **Expected:**
  - DRAG-2.11 `Automated`;
  - TREE-10.12 and DRAG-5.16 `Automated` if their tests assert every clause.
- **It also answers** this plan's questions for the Test Reconciler.

**Close** (the Architect):
- **The audit's Close-out table:** a row for each of #1–#11, each checked against the code.
- **Archive:** both reports go to `docs/archive/`, and the scope folder is deleted.
- **No audit for this story alone.** Its commits fall in the next audit's range, from the tag on this audit's end commit (`epic-3-5-stories-8-3-to-8-7-audited`, on `f920eb7`).

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

## Open questions

The audit's "For other roles" and the reconciliation's "For the PO".

- **For the PO:**
  1. **Wiki board-drag-interaction §10 names two resyncs that can land mid-drag:** a failed drop's and a stale response's. The code has a third. A failed column reorder from an earlier drag (`useBoardDnd.ts`, through `onColumnDrop`) stops a live item drag and shows the failed-write wording. Does §10 name it? (audit)
  2. **A column drag that a reload lands on** is stopped with no cue. §10 scopes its rule to an item drag. Should a column drag show the cue? (audit, #25)
  3. **Orphan-workflow deletion** (`workflows.test.ts`'s null-projectId delete). The wiki has no rule on what deleting a workflow with no owning project does to other projects' items. Is there one to write? If yes, the Test Planner derives a case. If no, the test stays uncatalogued. (reconciliation)
  4. **The workflow create's owner field** (wiki project-tree §10). §10 calls `templateId` and `sourceWorkflowId` references (row-references §1), and doesn't say so of the owning project. TREE-10.12 rests on §1's general statement. Should §10 name the owner as a reference too? (reconciliation)
  5. **Three sidebar states have tests and no rule:** the tiers while the project cap is unknown, and the rows a collapsed project hides (`useProjectDragReorder.test.ts`). Rules, or deliberately not? (reconciliation)
  6. **A detached item's pickup** (DRAG-5.16) rests on §8's "once Free, the item's relationship to its former parent is preserved", with §1's layer rule. Should §8 say outright that a detached item picks up as a Free Card? (reconciliation)
- **For the Test Reconciler,** at the confirming run (audit):
  1. **`cardMetrics.test.ts` checks that a row has no vertical padding.** Under Tailwind's border-box, padding doesn't change an `h-6` row's height, while a margin would change the list's pitch. Does the test prove its title?
  2. **`lib/dragTargets.test.ts`'s tier cases and `dragClassification.test.ts`'s tier block** may test the same walk twice, now that the board's classification hands off to `classifyTargets`.

## Living-docs handoff

Written by the Coder before close. What it's expected to hold:

- **Behavior decisions made while building, for the PO to rule on:**
  - the flash's window (D2);
  - the sidebar's descendants, excluded rows and cap height held from pickup (#13), as its tiers are.
- **Planned passages now built:** none.
- **Implementation passages to place:** the new check's comment in `getOrNotFound.ts`, and the comments Batch 4 corrects. All of them are the Coder's own.
- **Test-plan cases affected:** the stamps of Batches 1 and 5, any title retitled on the way, and the confirming run's result.
- **Wiki sections added, changed, moved or removed** (PO, at close):

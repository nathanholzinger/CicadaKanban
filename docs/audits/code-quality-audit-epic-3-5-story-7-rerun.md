# Code Quality Audit — Epic 3.5 Story 7, second pass

**Range:** `epic-3-5-story-7-audited..f8160c5`, 17 commits. The base is the newest `*-audited` tag, on `c6b6896`, the commit that formatted the first pass's report. The end is the tip of `claude/story-7-second-reconciliation`: Nathan's rulings on the third reconciliation run. Nathan tags the end commit `epic-3-5-story-7-rerun-audited`.

**What the range holds:** everything Story 7 did after its first audit (`docs/audits/code-quality-audit-epic-3-5-story-7.md`):

- the test follow-ups (`31009c7`);
- the Fix Now batches 1–6;
- batch 7: the hold-opened modal's reading held until the pointer moves, and `POST /workflows` refusing a create that names both references;
- the PO's, Test Planner's and Reconciler's doc commits, which no pass reads.

The story plan calls for this second pass after batch 7 (Phases, "After Phase 5").

## How the range sorted

The scope came from `npm run audit:scope` (`docs/audits/epic-3-5-story-7-rerun-scopes/`). It found 65 files to read:

- 2,078 changed lines;
- 15 removal sites;
- 45 moved lines left out.

29 files were marked read whole: the 6 new files, and 23 with 10 or more changed lines of code. The config added no `readWhole` marks.

**The split.** The range is a third of the first pass's size, so the run used a config (`docs/audits/epic-3-5-story-7-rerun-scopes/config.json`). It joins the drag layer and the rest of the client into one instance, and the server's source and tests into another. That gave each pass four instances, 16 in all, over the default seven groups:

- client (C1, C1t, C2);
- server (S1, S1t);
- E2E;
- T.

## How it ran

- **The passes ran cold.** Each got only its scope file. They ran in two waves of eight.
- **Re-traced by hand** before going in the report:
  - #1, with a probe: the same lookup through drizzle and better-sqlite3, in a scratch folder outside the repo, binding `0`, `false`, `{}` and `[]`. `0` returns no row; the other three throw.
  - #2, against `diff.mts::removalSites` and blame's `-w`.
  - #7, against `useBoardManagement.ts` and `App.tsx`.
  - #10, against both test files.
  - #9's and #11–#12's copies, against their helpers.
- **What the merge step read:**
  - the first pass's report and its Close-out. I checked each row marked Fixed against the code: the deep seed's append, the modal's once-at-mount decision, the two specs that couldn't fail, the shared storage module, `splitLines`, the indent formula, `travelingRowsFor`, the §9 pointers, the removal-site rule and the error message. All of them hold, and the passes confirmed the rest;
  - Story 7's plan: The audit's Fix Now, in batches (batches 1–7), the Amendments for each batch, and its Open questions;
  - Nathan's rulings of 2026-10-28 on the three Fix Now changes with no guard (`docs/audits/test-reconciliation-epic-3-5-story-7-run-3.md`, Fix Now guard tests, items 3–5);
  - the wiki passages the correctness findings touch: row-references §1 and §2, and board-drag-interaction §7.3 and §9.

## Overall shape

**The first pass's Fix Now holds.** Every one of its 35 required findings is fixed in the code, and the passes found no regression in what the fixes touched.

**What this pass finds is small and local:**

- **One correctness gap in batch 2 (#1).** `false`, `{}` and `[]` as a workflow's `templateId` or `sourceWorkflowId` are a 500, not the 400 the batch's record and Nathan's no-test ruling both take for granted.
- **One regression in batch 6 (#2).** The scope script's new formatting fold also hides a whitespace edit inside a string literal, so the file reaches no pass.
- **Comments the batches outgrew (#4–#8).** One of them, in the drag layer's `CLAUDE.md`, names `browserStorage.ts` as the one way to persist in the browser while a hook in its own directory doesn't use it.
- **Helpers this range added but didn't adopt everywhere (#9–#12).**

**Risks to watch (#13–#32).** The hold-opened modal's reading has two narrow timing paths left (#14, #15). Several helpers and specs keep growing past their headers, as in the first pass.

**Plan the batches in this order:**

1. the server (#1);
2. the scope script (#2, #3, #9, #10);
3. the client's comments (#5, #7);
4. the E2E helpers (#6, #8, #11, #12);
5. #4, beside #1's file.

Each batch is small.

---

## Fix Now — correctness

### 1. `POST /workflows` answers 500 for a `templateId` or `sourceWorkflowId` of `false`, `{}` or `[]` `[Correctness & Security (server)]`

- **Where:** `server/src/routes/workflows.ts:43, 142-149`. `namesARow` reads any value but `undefined` or `null` as a reference, and hands it straight to `lib/getOrNotFound.ts::existsById`.
- **Problem:** better-sqlite3 binds only numbers, strings, bigints, buffers and null. The probe showed what each value does:
  - `false` throws `TypeError: SQLite3 can only bind numbers, strings, bigints, buffers, and null`;
  - `{}` and `[]` throw `RangeError: Too few parameter values were provided`;
  - `0` binds, finds no row, and is the 400 it should be.
- **Failure scenario:**
  - An API caller or an MCP agent sends `{ name, projectId, templateId: false }`. The throw reaches the global middleware, which answers 500 and logs it.
  - Nothing is written, since the check runs before the transaction. But the caller gets a server error where wiki row-references §1 promises a 400.
  - Batch 2's record says `0` and `false` are refused, and Nathan's ruling of 2026-10-28 (run 3, Fix Now guard tests, item 5) rests on that: "the wiki settles it", so no test was written.
- **Fix:**
  - Refuse a named value that isn't a string with a 400 before either existence check, as `projects.ts:39` does for its own reference (`namesARow(x) && typeof x !== 'string'`).
  - The `String(...)` coercions in `startingWorkphases` can then go.
  - Since the ruling's premise didn't hold, a test for `false` is Nathan's call to reopen. One case covers the shape check.
- **Wiki:** breaks a rule in force, row-references §1 and §2.
- Can ride along: #18, the missing `orderBy`.

### 2. The scope script's formatting fold drops a whitespace edit inside a string, and the file then reaches no pass `[Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/diff.mts:57-59` (`foldFormatting`) and `:82`.
- **Problem:** `foldFormatting` strips whitespace, quotes, parentheses, commas and semicolons from the whole line, inside literals too. Blame runs with `-w`, so a whitespace-only edit inside a literal is never a changed line. Before batch 6, such a hunk was at least a removal site. Now it folds equal and is dropped, so `classify.mts::readingOf` gives `'none'`.
- **Failure scenario:** a commit changes `s.split(' ')` to `s.split('')`, splitting into characters instead of words. Blame `-w` puts the line before the base, both sides fold to `s.split`, and the file reaches no pass. `x === ' '` to `x === ''`, `join(', ')` to `join(',')`, and `/a b/` to `/ab/` go the same way.
- **Fix:**
  - Fold only between tokens. `ts.createScanner` (`lineKinds.mts` already depends on `typescript`) can compare string, template and regex literals by their exact value, so `"`↔`'` still folds.
  - Add a `diff.test.mts` case where `split(' ')` to `split('')` is a site.
  - The deeper cause is blame's `-w`. `-b` would still ignore re-indenting but count `' '` to `''` as a change. That is Watch List: #21 holds it with the script's other exit-path risks.
- **Wiki:** none (repo tooling). It breaks `.claude/guides/audit-workflow.md`'s "What each pass gets": removal sites list removed code that nothing a scope lists replaced.
- Can ride along: #3.

### 3. A `diff.test.mts` fixture describes a hunk its file doesn't have `[Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/diff.test.mts:74`.
- **Problem:** `hunk(2, 1, 2, 3)` claims three added lines, new lines 2 to 4. But `newLines` holds three lines in all, so line 4 doesn't exist. The case passes only because `newLines[line - 1] ?? ''` hides it.
- **Fix:** `hunk(2, 1, 2, 2)`.

---

## Fix Now — drift

### 4. `workflowWorkphases.ts`'s header names a route shape that's gone `[Consistency & Drift (server) + Duplication & Abstraction (server)]`

- **Where:** `server/src/lib/workflowWorkphases.ts:13-15`, "so the create route's two branches and the deep seed can't drift apart on a field".
- **Problem:** the route has one copy call now (`workflows.ts:170`); `startingWorkphases` only picks the source rows. The header also overstates what it shares. The seed still writes out the rest of the create (#27): the workflow row, the template query, the re-select and the default board.
- **Fix:** "so the create route, whichever source it starts from, and the deep seed copy a workphase's fields alike".

### 5. `useLiveDropSide`'s comment lists the rows `dropAnchorFor` can name, and leaves out the overflow row `[Consistency & Drift (client)]`

- **Where:** `client/src/components/dragChrome.tsx:17-27`, "a Card row or a Stub row, whichever the active drag happens to be".
- **Problem:** `dropAnchorFor` names an overflow row too. The file's own header, `useItemRow`'s comment and the drag layer's `CLAUDE.md` all say so.
- **Fix:** "a Card row, a Stub row or an overflow row". The "never narrowed to a subset of roles" reasoning stands.

### 6. `holdAt`'s comment says `depth` counts from where the item's row starts; it counts from the pickup point `[Consistency & Drift (E2E)]`

- **Where:** `tests/helpers/overflowTree.ts:34-37`. The code is `from.x + levels * DESCENDANTS_INDENT_PX` at line 50, where `from` is the centre of the item's title button.
- **Problem:** callers pass offsets that only make sense from the pickup point. DRAG-7.27 (`drag-7-overflow-row.spec.ts:373-380`) aims `L - 1` indents left of the grab, and several cases pass `L + 6` or `-6` to clamp.
- **Fix:** "`depth` indents right of where the pointer picked the item up (negative for left)", as `projectTreeDrag.ts::aim` words it.

### 7. The drag layer's `CLAUDE.md` gives `browserStorage.ts` as the one way to persist in the browser; a hook in its own directory, and `App.tsx`, don't use it `[Consistency & Drift (client) + Duplication & Abstraction (client)]`

- **Where:**
  - `client/src/components/workflow/CLAUDE.md`, "One way to do each of these", "Reading and writing what persists in the browser";
  - the `browserStorage.ts` header (lines 1-4);
  - `client/src/components/workflow/useBoardManagement.ts:17, 36`;
  - `client/src/App.tsx:34-36, 85-91`.
- **Problem:** the board hook reads and writes `kanban_active_board_*` through raw `localStorage`, and `App.tsx` does the same for `activeProjectId`. `App.tsx` reads it in a `useState` initializer, so where reaching storage throws (blocked site data), the app fails to mount. That is the failure `browserStorage.ts` exists to absorb.
- **Fix:** either one works.
  - **(a)** Move both sites onto `readStored` and `writeStored`. `App.tsx` also removes a key, so add a guarded `removeStored` (and `removeItem` to `KeyValueStorage` and `memoryStorage`). Then list the new callers in the header.
  - **(b)** Narrow the `CLAUDE.md` line and the header to the two values they cover.
  - (a) is the one the line describes.

### 8. `clocksMargin`'s comment calls it the one spelling of a wait past more than one clock; `outwait` waits with its own margin `[Duplication & Abstraction (E2E)]`

- **Where:** `tests/helpers/dragGesture.ts:290-294`, against `tests/ui/drag-7-modal-hold.spec.ts:58-59` (`outwait`: dwell plus cue plus 500).
- **Problem:** one is a sleep that proves a clock didn't fire. The other is the ceiling on a retrying assertion. They may be separate on purpose, but the comment says there's one spelling.
- **Fix:** call `clocksMargin` in `outwait`. Or, if the two are separate on purpose, add a one-line rule (f) reason at `outwait` and narrow the claim in `dragGesture.ts`.

---

## Fix Now — structural

### 9. `instancesOf` keeps unknown pass keys and returns a type that says every pass is there `[Duplication & Abstraction (T) + Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/config.mts:98-110`, and the readers that patch it, `config.mts:135` and `scopes.mts:112` (`config.instances[pass] ?? {}`).
- **Problem:**
  - `{ ...value } as Instances` keeps a misspelled key (`"corectness"`) and lets a pass be left out. The type then says every pass is present.
  - So each reader writes its own `?? {}`, and a third reader written to the type would throw on `Object.entries(undefined)`.
  - The error text, "with a key for each pass", isn't what the code checks.
  - A misspelled pass then shows as "no correctness instance takes …" for every file, which points at the wrong cause.
- **Fix:** refuse a key that isn't in `PASSES`, and fill a missing pass with `{}`, so `Instances` is true when returned. Then drop both `?? {}`, and make the message say what's checked.

### 10. The two throwaway-repo setups in the scope script's tests isolate git differently `[Duplication & Abstraction (T) + Correctness & Security (T)]`

- **Where:** `scripts/audit-scope/git.test.mts:13-32` (new), against `scripts/audit-scope/scan.test.mts:87-121, 250-255`.
- **Problem:** `scan.test.mts` points `GIT_CONFIG_GLOBAL` at an empty file, sets `core.autocrlf false` and restores the variable after, because "the user's own global git config … must not reach the repository or the script". `git.test.mts` copied the rest of the setup but not that. So `showAt` is tested against whatever the developer's global config holds: hooks, autocrlf, an external diff. The next test that needs a repo will copy one of the two.
- **Fix:** one helper, for example `scripts/audit-scope/testRepo.mts::makeTestRepo(prefix)`, with the isolation, the init and config, and the cleanup. Both files call it.

### 11. `boardLocators.ts::region` was added, and a copy and two inline spellings of it remain `[Duplication & Abstraction (E2E)]`

- **Where:**
  - the helper, `tests/helpers/boardLocators.ts:36-39`;
  - a copy, `tests/ui/drag-card-zoom-in.spec.ts:53-55` (`regionOf(group, regionKey)`, three callers);
  - inline, `tests/ui/drag-column-bands.spec.ts:352, 638`.
- **Fix:** call `region(...)` at all three, and delete `regionOf`. `drag-column-bands.spec.ts`'s own `regionOf(col)` (235-237) is a different query and stays.

### 12. `dragGesture.ts::refuseMoves` is copied in three specs `[Duplication & Abstraction (E2E) + Consistency & Drift (E2E) + File Responsibility (E2E)]`

- **Where:**
  - the helper, `tests/helpers/dragGesture.ts:269-273`;
  - a verbatim copy, `tests/ui/drag-column-bands.spec.ts:822-824`, followed by a hand-rolled board-GET wait at 831-833 that `boardReload` covers;
  - two copies of each other with a 1500 ms delay in front, `tests/ui/drag-7-hierarchy-modal.spec.ts:703-706` and `tests/ui/drag-7-modal-hold.spec.ts:445-448`.
- **Fix:** give `refuseMoves` an optional delay (`refuseMoves(page, { afterMs })`) and call it at all three. Use `boardReload(page)` at 831-833.

---

## Routed to a story's plan

None.

---

## Watch List

### 13. `writeStored` drops a refused write with no trace `[Correctness & Security (client)]`

- **Where:** `client/src/lib/browserStorage.ts:32-38`, and the two read-side catches.
- **Problem:** the header records why a refused write mustn't break the page, and the value then holds for the session. Nothing logs it, so a sidebar width that doesn't survive a reload leaves no sign why.
- **Why not Fix Now:** the pass tagged this Fix Now under the error-handling checklist. That checklist is for server routes. The same catch was confirmed as a deliberate no-op in the first pass, and the header's ruling covers the behavior.
- **Fix:** a `console.warn` in the catch is cheap if anyone wants the trace.

### 14. The modal's reading is taken at the hold's anchor, but reseeded at the live pointer `[Correctness & Security (client)]`

- **Where:** `useBoardDnd.ts:659-671` (`readModalPlacement`), with `HierarchyModal.tsx:151, 160`.
- **Failure scenario:** a pointermove lands between the hold opening the modal and the commit that mounts it. The depth's boundaries are then shifted by that move for the rest of the drag in the modal, and `held` is keyed to a point the reading wasn't taken at.
- **Fix:** `ModalReading` carries the point it read at, and the reseed takes `pointerX` and `held` from it.

### 15. `readModalPlacement` reseeds whatever Descendants context is live `[Correctness & Security (client)]`

- **Where:** `useBoardDnd.ts:662`.
- **Failure scenario:** a fast pop out to the Card layer between the hold and the mount leaves the modal open over a drag outside its layer, until a later sample closes it. In another Card's Descendants, the reading would reseed that Card's projection.
- **Fix:** check `contextKey === descendantsRegionKey(modalCardId)`, else close the modal.

### 16. `placeModal` can scroll the ghost's row under the header `[Correctness & Security (client)]`

- **Where:** `modalPlacement.ts:67-72`.
- **Problem:** with the cursor in the top 90px or so, over a long list, the scroll puts the spot above the list's visible top, and the reading lands two rows off.
- **Fix:** pass the list's offset in the dialog, and cap the scroll at it.

### 17. The deep seed's `deepestItemDepth` counts from the nearest Free ancestor, while the cap and the API count from the root `[Correctness & Security (server) + Duplication & Abstraction (server)]`

- **Where:** `server/src/db/deepSeed.ts:164-170, 237-266`; `server/tests/lib/deepSeed.test.ts:102`; `seedDeep.ts:19` ("levels below their Card").
- **Problem:** the test's comparison passes because the deepest chain hangs off a Card. A Free child's chain of 9 would break it, with the data fine.
- **Fix:** carry the root-counted depth in `insertNode`.
- Ride-along: `depthOf` is written twice in the test (46-49, 107-110). The duplication pass tagged that Fix Now; it's two inline closures that agree, so it rides here.

### 18. The created workflow's workphases are re-selected with no order `[Correctness & Security (server)]`

- **Where:** `workflows.ts:172`.
- **Problem:** the tests rely on insertion order.
- **Fix:** `.orderBy(workphases.position)`. Can ride along with #1.

### 19. `placementShown` can report a parent it never read `[Correctness & Security (E2E)]`

- **Where:** `tests/helpers/overflowTree.ts:84-91`.
- **Problem:**
  - a missing parent reads as `null`, the same as "under the Card";
  - the search for the parent row passes over a shallower row that ends its subtree;
  - the dragged item's own descendants aren't left out.
- **Fix:** stop at the first shallower row, and throw unless it's one level up. Also see `dropLineOn` (97-108, Informational): it returns a placeholder row id when it finds no row.

### 20. Setup writes whose status no spec checks `[Correctness & Security (E2E) + Duplication & Abstraction (E2E)]`

- **Where:**
  - `drag-column-bands.spec.ts:113-116, 346-349` (the column delete and widen);
  - `boards-layer.spec.ts:180-187, 324-331` (the reorders; at 324 the reorder is the subject, so assert it there).
- **Problem:** this recurs from the first pass's #40. The ruling at `drag-column-bands.spec.ts:340-343` didn't consider splitting the fold from the Y seed.
- **Fix:** checked `deleteColumn`, `updateColumn` and `reorder*` helpers in `seed.ts`, on a `checkedOk` that `deleteItem` and the `pin*` helpers share.

### 21. The scope script's other exit paths `[Correctness & Security (T) + File Responsibility (T) + Duplication & Abstraction (T)]`

- **Exit codes:** a mistyped `--base`, or a config whose groups lack a catch-all, exits 1 with a stack trace (`main.mts:47, 51-52`). 1 is the documented code for an unassigned file.
- **Blame's `-w`:** behind #2.
- **`scan.test.mts`:**
  - it now tests three modules: the scan, `buildScopes`, and the CLI at 414-494, which could be a `main.test.mts`;
  - it spawns `main.mts` six times (a `runMain` helper);
  - its `tracedFrom` builds its own `BlameRange` (`blameRangeOf`, exported from `scan.mts`).

### 22. `dragTo`'s local `settled` shadows the module's `settled()` `[Consistency & Drift (E2E)]`

- **Where:** `tests/helpers/dragGesture.ts:93`.
- **Fix:** rename the local.

### 23. The pointer is a second `Point` type, split and rebuilt `[Duplication & Abstraction (client)]`

- **Where:** `descendantsProjection.ts:40-43` (`Pointer`), 63-64, 104-105, 180-184; `useBoardDnd.ts:286-287, 664-668`.
- **Fix:** `ProjectionSample` carries `pointer: Point | null`. Can ride along with #14.

### 24. Test `DragSession` literals are built by hand twice `[Duplication & Abstraction (client)]`

- **Where:** `HierarchyModal.test.tsx:23-43`, `BandGuides.test.tsx:18-29`.
- **Fix:** a `dragSession(...)` builder in `client/src/test/dragFixtures.ts`.

### 25. Two `dragStructure` tests write the parent-region attribute by hand `[Duplication & Abstraction (client)]`

- **Where:** `dragStructure.test.ts:221-222, 239-240`.
- **Fix:** `regionEl` takes the parent key, as `dragRegionProps` does.

### 26. The modal is centered by CSS on a click and by `centerModal` after a reload, with different margins `[Duplication & Abstraction (client)]`

- **Where:** `ModalShell.tsx:55, 64` (16px, and a width tied to `MODAL_EDGE_MARGIN_PX` by nothing), against `modalPlacement.ts:16, 74-88` (8px) and `HierarchyModal.tsx:92-95` ("as a click opens it").
- **Problem:** they agree only when the window is wider than the dialog plus 32px.
- **Fix:** let the fallback drop `position`, so the shell centers it. Or tie the two with a cross-reference.

### 27. The deep seed repeats the rest of the workflow create `[Duplication & Abstraction (server) + File Responsibility (server)]`

- **Where:** `deepSeed.ts:206-219` against `workflows.ts:47-65, 158-181`.
- **Problem:** the workflow row, the template-phases query (four copies, with `workflowTemplates.ts:14-19, 28-33`), the re-select, and `createDefaultBoard` with `'Default Board'` (a third time at `runMigrations.ts:153`). They agree today.
- **Fix:** a `createWorkflowWithDefaultBoard` in `lib/workflowWorkphases.ts`, a `templatePhasesOf`, and a `DEFAULT_BOARD_NAME`. #4 rewrites the same header.

### 28. `namesARow` is route-local; the same predicate is inline at four other sites `[Duplication & Abstraction (server)]`

- **Where:** `workflows.ts:43`; `items.ts:136, 140, 256`; `itemHierarchy.ts:233`.
- **Problem:** this recurs from the first pass's #53. The copies agree on every input that reaches them.
- **Fix:** move it beside `existsById` in `lib/getOrNotFound.ts`. #1's shape check could live there too.

### 29. `pullOutAndZoomBack` is copied into the hold spec, where its reason doesn't hold `[Duplication & Abstraction (E2E)]`

- **Where:** `drag-7-hierarchy-modal.spec.ts:68-84`, copied at `drag-7-modal-hold.spec.ts:707-716`.
- **Problem:** the point "outside the modal, inside P" is spelled four more times. Its reason, at `drag-7-hierarchy-modal.spec.ts:360-361`, is about a centered modal, and the hold spec aims it at a modal placed under the cursor.
- **Why not Fix Now:** the spec passes, and the point is outside that modal too.
- **Fix:** `pullOutToCard` and `zoomBackIntoSection` in `overflowTree.ts`, with the point named once and its reason covering both.

### 30. E2E helper opportunities `[Duplication & Abstraction (E2E)]`

- the two-pass hover (9 sites, plus `holdAt` and `dragTo`);
- "R2 held above R1a" (4 times in `drag-7-hierarchy-modal.spec.ts`);
- opening the overflow board and the modal, about 55 tests, whose waits have drifted. `ProjectSidebarPage.ts:16-19`'s ruling, that callers await their own content, doesn't fit specs that always await `P`;
- the centered check, three ways;
- the row-title grip (5 sites);
- item-chain seeding and the item cap's read (`seed.ts`);
- the move-response wait;
- the post-release placement check (about 20);
- the tuning panel's toggle (7).

The first pass's #61 named most of these.

### 31. `useBoardDnd.ts` is at 806 lines `[File Responsibility (client)]`

The release tail, about 100 lines, is the cleanest seam if the file grows again.

### 32. The DRAG-7 spec files and `dragGesture.ts` hold more than their headers name `[File Responsibility (E2E)]`

- `drag-7-modal-hold.spec.ts` (828 lines): its placement half (DRAG-7.12, 7.15-7.17, 7.25, with helpers declared mid-file) is a `drag-7-modal-placement.spec.ts`. This recurs from the first pass's #65.
- `drag-7-hierarchy-modal.spec.ts` (798): its write-lifecycle group (476-518, 662-775) is the seam.
- `dragGesture.ts` (332): five concerns. Its route stubs (255-277) are the first to lift, as a `moveRoute.ts`.

---

## Covered by

None.

---

## Informational

### 33. Wording a reader won't be misled by `[Consistency & Drift]`

- `descendantsProjection.ts:172-177`: "The hold's own reading is dropped" sits beside `held`, which the function keeps; "the previous projection is dropped" is plainer.
- `workflow/CLAUDE.md` (160-161) names only the Card's cue among `DragTuningContext.ts`'s readers, as an example.
- `drag-7-modal-hold.spec.ts:37-38` names X and B as the dragged items; W is one too.
- `scripts/audit-scope/git.mts:1-3` describes `gitIn` and not `showAt`.
- `config.test.mts:109`'s title doesn't mention the non-object case it also asserts.
- `watchWrites` lives in `projectTreeDrag.ts`, a sidebar-named file, though the board specs use it.

### 34. Repeats considered and left `[Duplication & Abstraction]`

- client: the row-top formula twice in `placeAtCursor` (`HierarchyModal.tsx:105, 118`); the two loaders' shape; a spy storage in `sidebarWidth.test.ts`; `hierarchy.test.ts`'s tree three times;
- server: the append-a-Free-item composition (three sites, each one expression); `startingWorkphases`' source branch beside `getOrderedWorkphases`, which takes no `tx`; `workflowsOf` reads in one test file; the hand-pinned items in `items.positioning.test.ts`;
- T: the `lines` helper; `check-docs`' own line splits; `config.test.mts`'s full instance literals; the Bruno empty-string sentence;
- E2E: `rowIds` and `dropLineOn` run in the browser and can't share a Node function; the two `aim`s are only alike; `boards.spec.ts`'s old locators without `exact`; the three-line templated-workflow setup.

### 35. Considered and sound `[all passes]`

- **Server:** both transactions; `copyWorkphases` copying every field; the both-named check before the existence checks; `''` refused; the deep seed's appends.
- **Client:**
  - the modal's once-at-mount decision;
  - `UNPLACED` as a constant React never rewrites;
  - `overflowBesideGhost` against `sectionEntries`;
  - the storage module and its fixtures;
  - the shifted modal's half-indent rounding, which is the section's own model.
- **E2E:** every depth and gap the new specs expect, against the seed tree; every removal site's reset still in place.
- **T:** the Bruno docs against the routes; every name in `BOARD_COMPONENTS`; `parseSpec`'s refusals.
- **Not worth splitting:** `HierarchyModal.tsx`, `descendantsProjection.ts`, `modalPlacement.ts`, `workflows.ts`, `deepSeed.ts`, `workflows.test.ts`, `overflowTree.ts`, `drag-7-overflow-row.spec.ts`, `config.mts`, `diff.mts`.

---

## For other roles

These go to the Open questions of Story 7's plan at close-out, addressed to each role.

- **Nathan:** #1. The ruling on `0` and `false` (run 3, Fix Now guard tests, item 5) assumed they're refused; `false` is a 500 today. Whether the fix gets a test is yours to reopen.
- **PO:** project-tree §10 (wiki lines 266-271) still marks the both-named refusal and `null` as none `**Planned:**`. Batch 7 built both.
- **Test Planner:** TREE-10.10 and TREE-10.11's tests (`workflows.test.ts:178-238`) carry no ID yet, as the plan already records.
- **Test Reconciler:**
  - DRAG-7.10, 7.13, 7.15, 7.16, 7.25, 7.26, 7.27 and 7.29 read `Open` in the test plan, though specs and unit tests carry their IDs.
  - `drag-7-hierarchy-modal.spec.ts:344` carries DRAG-7.6, 7.10 and 7.11, and its body checks 7.10.
  - Several cases assert no write straight after a release, with no grace period: hierarchy-modal :280, :370, :626, :796; modal-hold :760, :778; overflow-row :322, :356. `drag-7-hierarchy-modal.spec.ts:726` waits a fixed 300 ms.
  - `HierarchyModal.test.tsx`'s DRAG-7.15 runs with no scroll height, so the modal's scroll path (DRAG-7.17) is tested only through `placeModal`.
  - `deepSeed.test.ts:102` passes by the shape of the seed (#17).
  - `drag-7-hierarchy-modal.spec.ts:622` and `drag-7-overflow-row.spec.ts:374` read R's depth as `sectionLevels - 1`, true at the default only.
  - DRAG-7.10 now labels the two unit tests of the dialog's bounds; whether they prove it is yours.

## The audit rules, after a second pass

- **The four-instance config fit the range.** Three files outside a pass's area were read for context (the server passes read routes the seed mirrors). No pass ran out of room.
- **The tier rule for wrong comments held.** Every drift Fix Now here is a comment that's wrong. No pass tagged a true-but-incomplete comment as a finding.
- **Three Fix Now tags were judgment calls,** and I re-tiered them:
  - `writeStored`'s silent catch, against a ruling the first pass had confirmed (#13);
  - two agreeing closures in one test (#17);
  - a spec copy whose point still works (#29).

  The persona's rule, that a structural finding is Fix Now only when the code is already harder to change correctly, could add: "a copy that agrees and has one caller isn't".

---

## Close-out

Filled in as the audit closes. One row per required finding (#1–#12).

| #   | Disposition | Where it landed (routes) |
| --- | ----------- | ------------------------ |
|     |             |                          |

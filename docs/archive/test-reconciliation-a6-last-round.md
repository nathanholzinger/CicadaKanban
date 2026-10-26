# Test Reconciliation: A6, the last Coder round

**Scope:** the confirming check after A6's last Coder round (`docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`, Batch 6's "The last Coder round"), run 2026-10-26 on the clean tree at `dee8e6e`. It follows `docs/audits/test-reconciliation-a6-rerun.md` (at `cd5e1fd`). Under `.claude/guides/story-done-checklist.md` step 5 it re-checks only:
- **the seven new cases for wiki row-references §1:** ATT-4.14, ATT-9.13, ATT-10.5, TC-2.34, TREE-3.10, TREE-6.7 and BCU-2.10;
- **IDs added to passing tests:** TC-5a.1 (approved by Nathan, 2026-10-26), TC-5a.5, BCU-1.5 and DRAG-6.15;
- **tests fixed so they can't pass without their subject:** TC-5.5, ATT-1.3, ATT-1.6 and TC-5a.4;
- **IDs taken off:** TC-2.6 and TC-2.7, from `items.test.ts`;
- **ATT-9.12,** whose test now calls a helper it shares with ATT-9.13;
- **one sweep:** lost coverage and unknown IDs in the twelve test files the round changed.

Every other case keeps the judgment of its earlier report.

**Inputs read:** Batch 6's "The last Coder round"; the Coder's note "From the Coder, the last Coder round (2026-10-26)" and its two Amendments entries; the 6a and 6b notes to the Reconciler; wiki row-references; each scoped case's suite file; the twelve changed test files, read in full where a case sits; `server/tests/lib/positionResolver.test.ts`'s TC-2.7 tests; `useBoardDnd.ts`'s `endSession`, `resyncBoard` and `handleDragEnd`, and `BoardView.tsx`'s `DragOverlay`; and the three route reads the Coder fixed (`routes/items.ts:115`, `routes/projects.ts:117`, `:242`), which are in the tree. This run had no shell, so no gate or test was run. The Coder's results stand: `npm run check` green (413 server, 456 client, 185 script, no `check:docs` hits) and `npm run test:e2e` green (166 passed, 8 skipped).

**In brief:**
- **Seven cases `Open` → `Automated`:** ATT-4.14, ATT-9.13, ATT-10.5, TC-2.34, TREE-3.10, TREE-6.7 and BCU-2.10. Each is whole on route tests.
- **Five Automation lines changed, with no status change:** TC-5a.1 adds the panel test (approved), TC-5a.5 adds `hierarchy.test.ts`, BCU-1.5 adds the inheritance spec, and TC-2.6 and TC-2.7 drop `items.test.ts`.
- **Still `Open`: DRAG-6.15.** Its test covers the whole *Then* at the hook, but it's a hook test, outside both approved categories. Proposed for Nathan below, recommended.
- **The fixed tests and ATT-9.12 hold.** TC-5.5, ATT-1.3, ATT-1.6 and TC-5a.4 now fail without their subject. TC-5a.4 is whole on one test.
- **Lost coverage: none. Unknown IDs: none.**
- **One candidate case:** an item's agent naming no row. Wiki row-references §1 names the agent as a reference, and three tests assert it, but no catalog has the field.

**After the run (2026-10-26):**
- **DRAG-6.15:** Nathan approved its internal mapping to dnd:57 as proposed. DRAG-6.15 is now `Automated`, with `client/src/components/workflow/useBoardDnd.test.ts` on its line. The totals below include it.
- **Nathan's rulings on the two notes:** TC-2.7 needs no change, since its mapped tests cover it whole (Proposed Stamps, item 1, and Test Quality Concerns, item 2). BCU-2.10's test may pin its error message, since a test may decide what the wiki leaves open (Test Quality Concerns, item 1).

Aliases used below:

| Alias | File |
|---|---|
| IT | `server/tests/routes/items.test.ts` |
| H | `server/tests/routes/items.hierarchy.test.ts` |
| WP | `server/tests/routes/items.workphase.test.ts` |
| PO | `server/tests/routes/items.positioning.test.ts` |
| AT | `server/tests/routes/items.attached.test.ts` |
| projects | `server/tests/routes/projects.test.ts` |
| columns | `server/tests/routes/columns.test.ts` |
| boards | `server/tests/routes/boards.test.ts` |
| resolver | `server/tests/lib/positionResolver.test.ts` |
| hier | `client/src/lib/hierarchy.test.ts` |
| pw | `client/src/lib/positionedWrite.test.ts` |
| panel | `client/src/components/ItemDetailPanel.test.tsx` |
| dnd | `client/src/components/workflow/useBoardDnd.test.ts` |
| itemListOps | `client/src/components/workflow/itemListOps.test.ts` |
| inherit | `tests/ui/workflow-inheritance.spec.ts` |
| ipSpec | `tests/ui/item-positioning.spec.ts` |

Line numbers are the files' at `dee8e6e`. A few differ from the Coder's note, since the fixes grew two tests after it was written (ATT-10.5 is IT:158, ATT-4.14's create is IT:184, and the test that dropped TC-2.6 and TC-2.7 is IT:305).

---

## Coverage Mapping

### Fields written

| Case | P | Status | Automation test line |
|---|---|---|---|
| ATT-4.14 | P1 | `Open` → `Automated` | — → H, IT |
| ATT-9.13 | P2 | `Open` → `Automated` | — → WP |
| ATT-10.5 | P2 | `Open` → `Automated` | — → IT |
| TC-2.34 | P2 | `Open` → `Automated` | — → PO |
| TREE-3.10 | P1 | `Open` → `Automated` | — → projects |
| TREE-6.7 | P2 | `Open` → `Automated` | — → projects |
| BCU-2.10 | P2 | `Open` → `Automated` | — → columns |
| TC-5a.1 | P0 | `Automated` | ipSpec, pw, `dragRequest.test.ts` → the same, and panel |
| TC-5a.5 | P1 | `Automated` | itemListOps → itemListOps, hier |
| BCU-1.5 | P1 | `Automated` | boards → boards, inherit |
| TC-2.6 | P1 | `Automated` | PO, IT → PO |
| TC-2.7 | P0 | `Automated` | PO, IT, resolver → PO, resolver |

### The seven row-references cases, against their *Then*

| Case | Tests | Against the *Then* |
|---|---|---|
| ATT-4.14 | H:60, "ATT-4.14: an empty-string parentId names no item: a move and a PUT refuse it, and null is how each says top-level"; IT:184, "ATT-4.14: returns 400 for an empty-string parentId or agentId, which names no row, and creates nothing" | **Whole.** H:60: top-level `X`, with a position; a move and a `PUT` naming `parentId: ""` each get a 400 with the "does not reference an existing item" message, and `X`'s whole row is unchanged. IT:184: a create in the project naming `""`, and one naming only `""`, are refused, and the item count is unchanged. Both tests also show `null` accepted, which is ATT-7.7's and ATT-10.1's ground. |
| ATT-9.13 | WP:152, "ATT-9.13: a workphase given as an empty string names no workphase, and is refused, where null leaves the item with none" | **Whole.** Through `expectEveryWriteRefusesWorkphase('')` (WP:44), the case's five writes on the case's setup: three creates (top-level in `P1`, attached to `A`, detached under `A`) and two moves (`R` left Free, `X` left attached to `A`). Each gets a 400 with the one message, the item count is unchanged, and `R`'s and `X`'s rows are unchanged. It then shows `null` clears `R`'s workphase, ATT-9.11's ground. |
| ATT-10.5 | IT:158, "ATT-10.5: a create whose projectId is an empty string is refused, with a parent or without, and nothing is stored" | **Whole.** `projectId: ""` with no parent, and with `P` as the parent, each get a 400, and the item count is unchanged. It then shows a create that leaves the project out, or names `null`, takes the parent's (ATT-5.6's ground). It fails with the old read (`projectId || parent?.projectId`) put back. |
| TC-2.34 | PO:443, "TC-2.34: an anchorId given as an empty string names no item, and a move is refused on either side, writing nothing" | **Whole.** The case's setup: `X` in `W1`, and `A`, `C` and `E` in `W2`. A move into `W2` naming `anchorId: ""`, with `before` and with `after`, gets a 400 with the "does not reference an existing item" message, and `X`'s whole row is unchanged each time, so it's still in `W1` at the same position. |
| TREE-3.10 | projects:304, "TREE-3.10: a parent given as an empty string names no project: a create, an edit and a move refuse it, and nothing changes" | **Whole.** A create naming `parentId: ""` gets a 400, and `GET /api/projects` lists the same projects as before. An edit and a move of top-level `X` naming `""` each get a 400, and `X`'s parent and position are unchanged. The create half fails with the old read (`parentId || null`) put back. |
| TREE-6.7 | projects:450, "TREE-6.7: a neighbor given as an empty string names no project, and is refused, as the one before or the one after" | **Whole.** The case's setup: `A`, `X` and `P`, with `P1` and `P2` under `P`. A move of `X` under `P` naming `prevId: ""` or `nextId: ""` gets a 400 with the "does not reference an existing project" message, and `X`'s parent and position are unchanged. It then shows a move naming `null` for both appends at `3`, after `P2`, which is TREE-6.2's ground. |
| BCU-2.10 | columns:149, "BCU-2.10: a start or end given as an empty string names no workphase: a create and an edit refuse it, and nothing changes" | **Whole.** A create from `""` to `W2`, and from `W1` to `""`, each get a 400, and the board still has no columns. An edit of `A` (`W1` to `W2`) to start at `""`, or end at `""`, each get a 400, and `A` still runs from `W1` to `W2`. A note on the create's message is under Test Quality Concerns, item 1. |

### IDs added to passing tests

- **TC-5a.1 ← panel:73's describe, "TC-5a.1: the Sheet hands a write's whole response to the board".** Approved by Nathan 2026-10-26, and written. Its four tests are as the re-run read them: from the parent picker, the agent picker, a child's attach toggle and creating a child, the board's callback receives the whole response, `reindexed` included. With pw:13 folding the pairs in, they cover the case's Sheet edits on paths no surface test reaches. TC-5a.1 stays `Automated`.
- **TC-5a.5 ← hier:160's describe, "TC-5a.5: byPositionThenCreatedAt".** Written, as a test in the README's second approved category.
  - **The category reading:** the README names "the tie-break" as an example of a client ordering rule, "tested in the client's pure modules for list order". `byPositionThenCreatedAt` is the comparator every client sort calls: the board's lists, the reconciliation's order and the sidebar's sibling order. `lib/hierarchy.ts` is a pure module, and this describe tests nothing else of it.
  - **Against the *Then*:** an exact tie goes by creation (:167), a missing position sorts as `0`, ahead of a positive one whatever its creation (:171), and the same as a stored `0` (:175). Position comes first (:163).
  - If Nathan reads `lib/hierarchy.ts` as outside "the client's pure modules for list order", strike `client/src/lib/hierarchy.test.ts` from TC-5a.5's line. The case is whole on itemListOps without it, so its status doesn't move either way.
- **BCU-1.5 ← inherit:58, "BCU-1.5: item created in child project also appears on the parent board", and inherit:157, "BCU-1.5: item in child own workflow is not visible on parent board".** Surface tests, so no approval is needed. Written. Between them they show both halves of the case on the owning project's board. A child with no workflow of its own puts its item on the ancestor's board. A child with its own keeps its item off it, and the test shows that item on the child's own board first. The case stays whole on boards:330. The describes carry no ID, as the re-run proposed, since inherit:46 and :52 are the wiki's placeholder.
- **DRAG-6.15 ← dnd:57, "DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing".** **Not written.** A hook test, outside both approved categories (Proposed Internal Mappings, item 1). The case stays `Open`, with `—`.

### Tests fixed so they can't pass without their subject

- **TC-5.5, PO:681, "TC-5.5: excludes a done item from an active-scope reindex". Whole, and now it can't pass without its subject.** The move expects its 200, and `reindexed` is exactly `T1 → 1`, `T2 → 2`, `P1 → 3` and the mover's own pair, so the reindex fired over both active workphases and named no done item. The done item's whole row equals a read taken before the move, which also asserts the case's "nothing else about it changes", and its position is still `null`. A refused move, or one that reindexed nothing, now fails it.
- **ATT-1.3 and ATT-1.6, AT:117, "ATT-1.3, ATT-1.6: a detached child halts the cascade for its whole branch". Both still hold.** The root's move expects its 200 and the root reads back in In Progress, so a refused move now fails the test where the children's Todo would have passed it. ATT-1.3 is whole on AT:18 (the attached chain follows) and AT:117 (the detached child and its attached child don't). ATT-1.6 is whole on AT:95, with AT:117 as support.
- **TC-5a.4, pw:25, "TC-5a.4: applies the pairs for ids the list holds and skips the rest — "not in this view," never missing data". Whole alone now.** The response holds the case's mix: a pair for `unseen` and one for `A`. `A` takes `1.25`, the list keeps its four rows, and no `unseen` row appears. `applyWriteResponse` is pure, so it can make no request. pw:13 now carries only TC-5a.1, which its response (pairs for held ids only) fits.

### IDs taken off

- **TC-2.6 and TC-2.7, from IT:305, "positions the first item in a workphase at 1.0 and the next at max + 1.0".** Neither ID is left in IT, so both lines drop it.
  - **TC-2.6 is whole on PO:45,** "TC-2.6: a create with no anchor goes after the true last Free item, in whichever workphase it is": the true last at `4.2` in another workphase, and the create at `5`.
  - **TC-2.7 stays whole on PO and resolver.** PO:52 has the empty workphase beside an item at `3.0` giving `4`, PO:214 the first attached child at `1.0`, resolver:268 an empty scope bootstrapping at `1.0`, and resolver:277 a scope of only rows with no position doing the same, the moved-in half. A note on the create half is under Test Quality Concerns, item 2.

### ATT-9.12

**WP:148, "ATT-9.12: a write that names a workphase that doesn't exist is refused, whether it leaves the item Free or Attached". Whole, as before.** It calls `expectEveryWriteRefusesWorkphase('no-such-workphase')` (WP:44). These are the case's five writes on its setup: each gets a 400 with the one message, the item count is unchanged, and `R`'s and `X`'s whole rows are unchanged. ATT-9.13 runs the same helper with `''`, so the two cases can't drift apart.

---

## Lost Coverage

**None.** The sweep covered every case whose Automation line names one of the twelve files the round changed:
- `client/src/components/ItemDetailPanel.test.tsx`, `client/src/components/workflow/useBoardDnd.test.ts` and `client/src/lib/hierarchy.test.ts`: no line named them before this run.
- `client/src/lib/positionedWrite.test.ts`: TC-5a.1 (pw:13, :39) and TC-5a.4 (pw:25).
- `columns.test.ts`: BCU-2.1 to 2.9 and BCU-3.1, 3.2, 3.3 and 3.5. Each still has a test carrying its ID; BCU-2.9 on its describe (:417).
- `items.attached.test.ts`: ATT-1.3, 1.4, 1.5, 1.6, 1.14 and 7.7, and TC-2.25, 6.5 and 6.6.
- `items.hierarchy.test.ts`: the 51 cases whose lines named it before this run, across ATT-1, 2, 3, 4, 6, 7, 8 and 9.4, and TC-2, 5 and 7. Each is carried.
- `items.positioning.test.ts`: the 41 cases whose lines named it before this run, across ATT-1.1, 3.1, 7.2 and 7.4, and TC-2, 3.4, 5, 6, 7 and X. Each is carried.
- `items.test.ts`: TC-2.24, TC-2.32, ATT-4.10, ATT-5.6, ATT-5.7, ATT-10.1 to 10.4 and ATT-11.1 are carried. **TC-2.6 and TC-2.7 aren't.** The round took those IDs off on purpose, the cases are whole elsewhere, and their lines are re-pointed (Coverage Mapping).
- `items.workphase.test.ts`: ATT-9.1, 9.2 and 9.4 to 9.12.
- `projects.test.ts`: TREE-3.1 to 3.9, 4.1, 4.2, 4.5, 4.6, 5.1, 6.1 to 6.6, 7.1, 7.2, 8.1 to 8.4, 9.1 to 9.3 and 10.2.
- `tests/ui/workflow-inheritance.spec.ts`: no line named it before this run.

The round moved, split and deleted no test file, so under the checklist's tech-debt section the rest of the catalog wasn't swept.

## Unknown IDs

**None.** Every ID leading a title in the twelve files (ATT, BCU, DRAG, TC and TREE) is a case in the catalog. The comment in WP:42 names ATT-9.12 and ATT-9.13, which are cases too.

**A Test Planner `Manual` case carried by a test:** none. No `.ts`, `.tsx` or `.mts` file anywhere carries DRAG-1.29, DRAG-1.32, DRAG-4.24 or DRAG-4.25.

---

## Proposed Stamps

Optional: the case is already `Automated`, and the test is a route test, so it needs no approval.

1. **TC-2.7 on IT:305, once it's retitled in workflow terms,** for example "the first item in an empty workflow is at 1.0, and the next goes after it". Its one workphase is the whole workflow, so its first create, at `1.0`, is the case's "created in it with no anchor" through the route. With the ID off, that half rests on resolver:268 (Test Quality Concerns, item 2). The re-run offered a retitle or dropping the IDs, and the round dropped them, which is fine. This puts back only the route half, under a title the rule doesn't contradict. TC-2.6 doesn't need it.

## Proposed Internal Mappings (need approval)

1. **DRAG-6.15 ← dnd:57, "DRAG-6.15: ends an item drag that began while the save was in flight, and the release writes nothing". Recommended.**
   - **Why it needs approval:** it renders `useBoardDnd` and calls its handlers. That's neither approved category. It isn't a drag clock in the pop machine. It isn't a list-order, reconciliation or request rule in a pure module either: its subject is a drag's lifecycle, in a hook.
   - **What it asserts:** a column reorder is dropped and its save held; an item drag starts; the save fails, and the reorder's resync runs.
     - The session is `null`: the drag has ended. `BoardView.tsx:363` draws the carried copy only from the session, so none is left.
     - `previewPlacement('x', null)`: the ghost is gone.
     - `loadBoard` was called once: the board reloads.
     - Releasing afterwards calls `moveItem` never: nothing is written.
   - **Why it proves "whatever caused the reload":** the resync it runs is `useBoardDnd.ts::resyncBoard`, the one path for every reload the hook asks for. The failed item drop and the stale response with pairs reach it through `sendItemMove(…, resyncBoard)` (`useBoardDnd.ts:637`), and the column reorder through `onColumnDrop` (:648). The case says a test of any reload asserts it.
   - **What it can't show:** that `X` renders where the reloaded board has it. `loadBoard` is a mock. With the placement cleared, the board draws `X` from the item state the reload replaces, which is `BoardView`'s rendering, not this rule's logic.
   - **The alternative:** a Playwright test that holds another item's failing write, as DRAG-6.6's test fails one, picks up `X`, releases the failure and checks that the overlay is gone, `X` is at the server's place and a release sends nothing. It would make this mapping unnecessary under the README, and it's Story 10's kind of test.
   - **If approved:** a later run, or this one on a confirming pass, writes `client/src/components/workflow/useBoardDnd.test.ts` to the line and moves DRAG-6.15 to `Automated`. The ID is already on the test.

**TC-5a.5's hier mapping** was written as an approved category (Coverage Mapping). It's listed here only so that Nathan can strike it if he reads the category otherwise.

**Dropping existing pointers:** the re-check's two optional drops (`positionResolver.test.ts` from TC-2.4's and TC-2.9's lines) are still Nathan's call. Nothing new.

## Proposed Manual (need approval)

**None.**

---

## Gaps

- **DRAG-6.15 (P1), `Open`.** dnd:57 asserts its whole *Then* at the hook, short of `X`'s rendered place (Proposed Internal Mappings, item 1). Either Nathan approves the mapping, or the case waits for Story 10's surface test.
- **The catalog's 64 other `Open` cases** are the re-run's 64. None was in scope, and their routes stand as the earlier reports give them.

---

## Duplication

Reported, not judged.

- **TC-5a.1:** ipSpec:57 and :92, pw:13 and :39, `dragRequest.test.ts`:267, and panel:73's four tests. They span three layers, and each takes a different write path or step.
- **TC-5a.5:** itemListOps:73 and :78, and hier:160's describe. The same comparator, through the board's list and on its own.
- **BCU-1.5:** boards:330 (the route, whole) and inherit:58 and :157 (the UI, each half).
- **TC-2.7:** PO:52, PO:214, resolver:268 and resolver:277.
- **ATT-9.12 and ATT-9.13:** one helper, two inputs. This is by design, not duplication.
- **Tests that go past their own case onto a neighbor's ground:**
  - ATT-10.5's second loop (IT:174), the project left out or `null`, on ATT-5.6's ground (IT:103);
  - TREE-6.7's last move (projects:466), on TREE-6.2's (projects:397);
  - ATT-9.13's `null` clear (WP:155), on ATT-9.11's (WP:310);
  - ATT-4.14's `null` writes (H:74, IT:203), on ATT-7.7's and ATT-10.1's.

  Each pins what an empty string is not, which is the case's own last sentence.

---

## Test Quality Concerns

### The Coder's note to the Reconciler (the last round)

- **IDs on tests that already passed:** TC-5a.1, TC-5a.5 and BCU-1.5 are confirmed and written. DRAG-6.15 is a proposal (above).
- **New tests where the code already refused the empty string** (ATT-4.14, ATT-9.13, TC-2.34, BCU-2.10): each is whole and confirmed.
- **New tests after the fixes** (ATT-10.5, TREE-3.10, TREE-6.7): each is whole and confirmed, and the three reads are in the tree.
- **The four fixed tests** (TC-5.5, ATT-1.3, ATT-1.6, TC-5a.4): each is confirmed. The re-run's Test Quality item 1 (TC-5.5, and AT's cascade-halt test) and item 5 (pw:13's title) are resolved.
- **IDs taken off** (TC-2.6 and TC-2.7): the lines are re-pointed. The re-run's "Other concerns" item 1 is resolved.
- **ATT-9.12 on the shared helper:** confirmed.

### The earlier notes to the Reconciler

- **6a, `useBoardDnd.test.ts` carries no case ID:** resolved. DRAG-6.15 now covers any reload, and dnd:57 carries it (proposal above). dnd:87 stays without an ID (Uncatalogued Tests).
- **6b, the empty-string `POST /items` test and the non-string project parent test carry no ID:** the first is now IT:184, which carries ATT-4.14. The second, projects:322, has no rule of its own (Uncatalogued Tests).

### Concerns from this run

None blocks a status.

1. **columns:149 (BCU-2.10) pins the create's "required" message. Low.**
   - **The issue:** the create's refusal says `startWorkphaseId and endWorkphaseId are required`, and the test matches it. So the create reads `""` as a field left out, then refuses it because the field is required. Wiki row-references §2 says an empty string is never none. For a required field the outcome is the same, a 400 with nothing changed, and that's all the case asks.
   - **Why it matters:** the test restates today's reading, not the rule. A change that treats `""` as a reference naming no workphase would give the edit's message (`belong to this board's workflow`) and fail this test, though it keeps the rule.
   - **The fix, if wanted:** assert the status and the unchanged board only, or match either message.
2. **TC-2.7's create half now rests on a lib test. Low.**
   - **The issue:** the full run counted IT's first create at `1.0` for "an item is created in it with no anchor … then its position is `1.0`". With the ID off IT:305, that half is carried by resolver:268, the append resolver on an empty scope, an existing internal pointer. That a create with no anchor takes the append is shown at the route by PO:45, which carries TC-2.6, not TC-2.7.
   - **Why it stays `Automated`:** the full run accepted resolver:277 for the moved-in half the same way, so the create half on resolver:268 is consistent with it.
   - **If wanted:** Proposed Stamps, item 1.
3. **AT:117's detached child sits under the root; ATT-1.3's sits under `C1`. Low, no action.** The cascade skips a detached child the same way at any depth, and AT:117 also shows that the detached child's own attached child doesn't follow. The full run judged ATT-1.3 whole on these two tests.
4. **The re-run's other items** (reconcile:127's hand-built tracker, PO:83's fixture, CP:88, PO:131's magnitude trigger for TC-5.4, `itemRepositioningAttachedSiblings.spec.ts`'s header) weren't in scope, and weren't re-checked.

No mapped test was found tautological.

---

## Uncatalogued Tests

In the twelve changed files only.

**Gate and contract support, with no standalone rule:**
- **dnd:87, "reloads the board when no drag is live".** The other branch of `resyncBoard`. No case covers a reload with no drag, and none needs to.
- **projects:322, "a parent that is neither a string nor null is refused, and nothing changes".** It covers an edit and a move. No page says what a reference of the wrong type does: wiki row-references §1 covers a reference that names no row. This is request-shape validation for the API contract epic. Since the Coder's `POST /projects` fix, a create refuses a non-string parent with the same type message, and no test covers the create.
- **IT:305, "positions the first item in a workphase at 1.0 and the next at max + 1.0".** It carries no ID now. It's on TC-2.6's and TC-2.7's ground, in the workphase terms TC-2.7 contradicts in general (Proposed Stamps, item 1).

**A genuine scenario the catalog lacks: an item's agent.**
- The `agentId` rows of IT:124 ("ATT-10.4: returns 400, not an opaque FK 500, for a projectId, type or agentId that names no row") and IT:184 ("ATT-4.14: … an empty-string parentId or agentId …").
- IT:366, "returns 400, not an opaque FK 500, for an agentId that names no agent, and changes nothing", on `PUT`.
- The re-check and the re-run listed the agent test as having no page. Wiki row-references §1 is that page now (Candidate New Cases).

## Candidate New Cases

1. **An item's agent that names no row is refused, and nothing changes.** For example: a create or an edit naming `agentId: ""`, or an id no agent has, gets a 400, no item is created and the edited item's agent is unchanged; naming `null` leaves it unassigned.
   - **The rule is in the wiki:** row-references §1 names "its agent" among the references, and its reason is a mistyped agent id. So it's a Test Planner gap.
   - **Where it lands is open:** the page says each feature's page lists which of its fields are references, and no feature page lists the agent. The shared page's tests live in item-attachment, item-positioning, project-tree and boards-columns-unsorted. The Test Planner may need the PO to say which page owns an item's agent field. item-sheet's page isn't designed yet.
   - **The tests that would carry it:** IT:124's and IT:184's agent rows, and IT:366. ATT-10.4's and ATT-4.14's titles cover the agent rows today in name only.

---

## Totals

**Status changes in this run:** seven, each `Open` → `Automated`: ATT-4.14, ATT-9.13, ATT-10.5, TC-2.34, TREE-3.10, TREE-6.7 and BCU-2.10.

**The whole catalog: 357 cases,** the re-run's 350 and the seven new ones.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 112 | 126 | 49 | 287 |
| Open | 21 | 31 | 11 | 63 |
| Manual | 0 | 2 | 2 | 4 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **Total** | **133** | **159** | **65** | **357** |

**By folder:**

| Folder | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2) | Other |
|---|---|---|---|---|
| board-drag-interaction | 114 | 51 (29/20/2) | 59 (20/30/9) | 4 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25) |
| item-positioning | 80 | 77 (43/29/5) | 2 (0/1/1): TC-6.11, TC-5.15 | 1 `Pending PO` (TC-6.13) |
| item-attachment | 75 | 72 (30/26/16) | 1 (1/0/0): ATT-4.9 | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11) |
| project-tree | 54 | 53 (7/30/16) | 1 (0/0/1): TREE-1.13 | — |
| boards-columns-unsorted | 34 | 34 (3/21/10) | 0 | — |
| item-sheet | 0 | — | — | `INDEX.md` only |

# Test Reconciliation: A6, after the re-run's fixes

**Scope:** the Reconciler run after A6's second audit and its fixes (`docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`, batches 5 and 6), run 2026-10-25 on the working tree at `cd5e1fd`, with the story plan's uncommitted edits. It follows the full run of 2026-10-22 (`docs/audits/test-reconciliation-a6-<folder>.md`) and the re-check of 2026-10-23 at `4b99868` (`docs/audits/test-reconciliation-a6-recheck.md`). Since then batches 4f and 6a–6g landed. Batch 6c moved tests between server test files, so under `.claude/guides/story-done-checklist.md`'s tech-debt section this run covers:
- **the whole catalog,** for lost coverage, stale Automation lines and unknown IDs;
- **the tests 6c moved and 6d retitled,** each checked against its case's whole *Then*;
- **the re-run's "For the Test Reconciler" items,** answered under Test Quality Concerns;
- **the Test Planner's four mapping questions** (its answer of 2026-10-25), answered under Proposed Stamps and Proposed Internal Mappings.

Every other case keeps the judgment of its earlier report.

**Inputs read:** the plan's Open questions from the Coder's 4e note on, the Auditor's re-run section with the Test Planner's answer, the Coder's 6a–6g notes and their Amendments; the re-check; every suite file; wiki project-tree §10 and boards-columns-unsorted §1 and §3; and every test carrying an ID in a moved or retitled test's case. This run had no shell, so no gate or test was run. The Coder's results stand: `npm run check` green at 6g (406 server, 456 client, 185 script, no `check:docs` hits), and `npm run test:e2e` green at 6e (166 passed, 8 skipped).

**In brief:**
- **No status changes.**
- **9 Automation lines re-pointed,** all left stale by 6c's moves (ten tests; ATT-4.10's two share a line). 6d's retitles change no line.
- **Lost coverage: none. Unknown IDs: none,** with any prefix.
- **Re-run items:** two are resolved (the `getSubtreeHeight` tests by 6d, the inheritance spec by 6e). Four still stand, none blocking a status: the TC-5.5 move and `items.attached.test.ts`'s cascade-halt move, neither of which checks its status; the DRAG-6.1 test's hand-built tracker; and `positionedWrite.test.ts`'s TC-5a.4 title. DRAG-1.6's partial test is partial by design.
- **Needs Nathan:** two internal mappings (TC-5a.1 ← `ItemDetailPanel.test.tsx`, recommended; TREE-1.13 ← `hierarchy.test.ts`'s cap test, not recommended). There are also three optional stamps that need no approval.

Aliases used below:

| Alias | File |
|---|---|
| H | `server/tests/routes/items.hierarchy.test.ts` |
| CP | `server/tests/routes/items.crossProject.test.ts` |
| WP | `server/tests/routes/items.workphase.test.ts` |
| IT | `server/tests/routes/items.test.ts` |
| AT | `server/tests/routes/items.attached.test.ts` |
| PO | `server/tests/routes/items.positioning.test.ts` |
| boards | `server/tests/routes/boards.test.ts` |
| projects | `server/tests/routes/projects.test.ts` |
| popSession, reconcile, dragRegions, bandsUnit | `client/src/components/workflow/<name>.test.ts` (`reconcile` is `itemWriteReconciliation.test.ts`) |
| hier | `client/src/lib/hierarchy.test.ts` |
| pw | `client/src/lib/positionedWrite.test.ts` |
| panel | `client/src/components/ItemDetailPanel.test.tsx` |
| bands | `tests/ui/drag-column-bands.spec.ts` |
| inherit | `tests/ui/workflow-inheritance.spec.ts` |
| ipSpec | `tests/ui/item-positioning.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |

Line numbers are the files' at `cd5e1fd`.

---

## Coverage Mapping

### Fields written

Only Automation lines were written. No status changed.

| Case | P | Status | Automation test line |
|---|---|---|---|
| ATT-4.10 | P0 | `Automated` | H, IT, AT → H, IT |
| ATT-5.1 | P0 | `Automated` | CP, AT → CP |
| ATT-5.2 | P0 | `Automated` | CP, H → CP |
| ATT-9.1 | P1 | `Automated` | WP, H → WP |
| ATT-9.8 | P1 | `Automated` | CP → WP |
| ATT-9.9 | P2 | `Automated` | CP → WP |
| TC-2.17 | P1 | `Automated` | AT → PO |
| TC-2.24 | P0 | `Automated` | IT, CP → IT, PO |
| TC-3.4 | P0 | `Automated` | PO, AT → PO |

### 6c's ten moved tests, against their cases

Each kept its title and ID. The moves turned raw `request(app)` calls into `fixtures.ts`'s `move` and `put`, which send the same request.

| Test now | Moved from | Against the *Then* |
|---|---|---|
| H:922, "ATT-4.10: rejects an item becoming its own parent or reparenting to a descendant" | AT | A part: `PUT` refuses the item itself and a descendant, each matched by message. |
| H:937, "ATT-4.10: rejects reparenting to a non-existent parentId" | AT | A part: `PUT` refuses a missing parent. **ATT-4.10 is whole on H and IT.** H:894 covers `PUT` and `POST` for a missing parent, the item itself, a descendant and a parent too deep. It shows the row unchanged and nothing created, and a leaf accepted under a parent at `CAP − 1`, created or moved there. H:51, :60 and :76 cover the move, and IT:184 a `POST` with a missing parent. |
| CP:88, "ATT-5.1: PUT accepts reparenting under a parent in a different project and adopts its projectId" | AT | A part: by `PUT`, the parent and the project only. Its projects have no workflow, so the case's attach and workphase clauses aren't in it. **ATT-5.1 is whole on CP:31:** a move on one workflow, then `parentId: Q`, `isAttached: 1`, Q's workphase and `projectId: P2`. |
| CP:100, "ATT-5.2: PUT cascades projectId to detached descendants on a cross-project reparent" | H | A part: by `PUT`, a detached child takes the new project. **ATT-5.2 is whole on CP:31:** `X1`, `X2` and `X2a` are in `P2`, `X1` takes the cascaded workphase, and `X2` and `X2a` keep theirs. |
| PO:305, "TC-3.4: an attached child of a parent with no workphase has none itself, and is still placed among its siblings" | AT | Beyond the case's *Given*: children at `1, 2, 3` under a parent with no workphase. **TC-3.4 is whole on PO:** PO:116 places the new child at `3`, after `P`'s `2.0`, though `Q1` sits at `5.0` and a Free item at `7.0`; PO:213 has the first child at `1.0`. |
| PO:329, "TC-2.17: a parentless item that holds the attachment flag has positionScope "workflow"" | AT | **Whole.** The flag is written onto a parentless row, and the read gives `isAttached: 1` and `positionScope: "workflow"`. |
| PO:83, "TC-2.24: an item with no position takes the append fallback when it is assigned a workphase" | CP | The case's second sentence: an item with no position, moved to another workphase, appends at `4`, past `3.0`. **TC-2.24 is whole on IT and PO together.** IT:456 has the first sentence: `7.5`, which no append gives, kept exactly. A note on the fixture is under Test Quality Concerns, item 2. |
| WP:312, "ATT-9.8: a move can't leave a Free item in a workphase its project's workflow doesn't use" | CP | **Whole.** Both moves (no reparent, and a reparent under `B` that leaves the item Free) name `v` and are refused with a 400 and the message, and `F` reads back unchanged. |
| WP:332, "ATT-9.9: a create can't name a workphase its project's workflow doesn't use" | CP | **Whole.** A top-level create and a detached child of `B`, each naming `v`, are refused, and the item count is unchanged. |
| WP:76, "ATT-9.1: rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one" | H | A part: an attach naming another workphase is refused, and one naming the parent's is accepted. **ATT-9.1 is whole on WP:46:** `X` naming `W3` is refused with the message and the row unchanged, `W2` or none is accepted, `F` attached to `A` is accepted with `W2` and refused with `W1`, and `X` detached with `W3` is accepted. |

### 6d's two retitles in popSession

| Test | Against the *Then* |
|---|---|
| popSession:43, "DRAG-1.30: coming back inside before popDelayMs resets the clock" | Unchanged apart from `THRESHOLD` → `popDelayMs`. The cursor leaves at 100, returns at 200 and leaves again at `250 + popDelayMs`; it's still locked, with the clock at the second exit. |
| popSession:53, "DRAG-1.3, DRAG-1.30: outside for >= popDelayMs pops out…" | Unchanged apart from the name. Locked at `100 + popDelayMs − 1`, popped out at `100 + popDelayMs`, and B's middle band is hovered from that moment. |

**DRAG-1.30 stays whole** on popSession :38, :43, :53 and :82, in the approved category for a clock's logic. **DRAG-1.3's line names only bands**, which is unchanged. popSession:53 still carries DRAG-1.3 as support.

### 6e's setup changes, no title changed

- **ipSpec:57 (TC-2.11, TC-5a.1)** now seeds through `seedPositionedItems`. It's still whole: the create sends no position, the reindexed pairs put `New C` last, and the board doesn't reload.
- **attachedUI:416 (ATT-11.2)** finds its cards with `article`. It's still whole, as the re-check judged it.

---

## Lost Coverage

**None.** Each of the 279 `Automated` cases has a test carrying its ID, in every file its Automation line names. The only stale paths in the catalog were the nine lines above, which 6c's moves left behind. The sweep covered every folder: item-attachment, item-positioning, board-drag-interaction, project-tree and boards-columns-unsorted.

## Unknown IDs

**None, with any prefix.**
- **IDs leading a title.** A search for `<letters>-<digit>` at the start of any `it`, `test` or `describe` title, `.each` and modifiers included, finds only ATT, BCU, DRAG, TC and TREE.
- **IDs anywhere else.** A search for any `<prefix>-<n>.<n>` token in `.ts`, `.tsx`, `.mts`, `.js` and `.mjs` files, with any other prefix, finds nothing.
- **The five prefixes.** Every ATT, BCU, DRAG, TC and TREE token in those files, in titles and comments alike, is a case in the catalog. The exceptions are the checker's own fixture strings in `scripts/check-docs/check.test.mts` and `repoIndex.test.mts` (`DRAG-7.1`, `DRAG-9.9`, `TC-X.2`, and titles such as `'TC-4: …'` inside asserted strings).
- **`tests/ui/drag-card-zoom-in.spec.ts`** names DRAG-4.15, DRAG-4.19 and DRAG-4.20 in comments only. Its two tests are skipped and carry no ID.

**A Test Planner `Manual` case carried by a test:** none. No title carries DRAG-1.29, DRAG-1.32, DRAG-4.24 or DRAG-4.25.

---

## Proposed Stamps

These are optional: each case is already `Automated`. Each test counts without approval, either as a surface test or under an approved category. A developer adds the ID, and a later run adds the file to the line.

1. **TC-5a.5 on hier:160's describe, `byPositionThenCreatedAt`.** Its tests assert three things: position first (:163), an exact tie by creation (:167), and a missing position as `0`, the same as a stored `0` (:171, :175).
   - That comparator is the one every client sort calls: the board's lists (`itemListOps.ts`), the reconciliation's order (`itemWriteReconciliation.ts`) and the sidebar's sibling order (`client/src/lib/hierarchy.ts::sortedChildrenByParent`). So it pins the "every client sort" the case's title claims, where `itemListOps.test.ts`'s two tests show one sort.
   - It falls in `docs/test-plans/README.md`'s second approved category, which names the tie-break among its examples. This answers the Test Planner's first question. If Nathan reads `lib/hierarchy.ts` as outside "the client's pure modules for list order", this becomes an internal mapping for his approval instead.
2. **BCU-1.5 on inherit:58, "item created in child project also appears on the parent board",** and **inherit:157, "item in child own workflow is not visible on parent board".**
   - Between them they show both halves of BCU-1.5 on the owning project's board in the UI. A child with no workflow of its own puts its item on the ancestor's board. A child with its own workflow keeps its item off it, and since 6e the item is first shown on the child's own board.
   - boards:330 already proves the whole case at the route. Stamp the two tests, not their describes: the describe at inherit:15 also holds the child's view of the inherited board, which is a placeholder (below).
   - This answers the Test Planner's fourth question, for BCU-1.5.

**TREE-10.1 to TREE-10.4: no proposal.** None of inherit's tests changes the workflow a project uses (a workflow given, a project moved, a workflow deleted), or tries a second workflow for a project. Inherit:157 seeds the child's own workflow before its item, which is the static case. TREE-10's preamble assigns that to BCU-1.5. inherit's remaining tests are on the wiki's Open questions (Uncatalogued Tests).

## Proposed Internal Mappings (need approval)

1. **TC-5a.1 ← panel's describe, "the Sheet hands a write's whole response to the board" (panel:73, four tests). Recommended.**
   - **What it asserts:** from the parent picker, the agent picker, a child's attach toggle and creating a child, the board's callback receives the whole response, `reindexed` pairs included.
   - **What it adds:** TC-5a.1 names a Sheet edit "whether or not it triggered a reindex". The only Sheet write a surface test covers is ipSpec:92, a detach through the Stub's own panel, with a reindex. These four paths are covered nowhere else. Folding the pairs in is pw:13's, already on the line, so the hand-off and the fold together cover those paths.
   - **Why it needs approval:** it's a component test, outside the approved categories.
   - **If approved:** a developer stamps the describe, and a later run adds `client/src/components/ItemDetailPanel.test.tsx` to TC-5a.1's line. TC-5a.1 stays `Automated` either way. This answers the Test Planner's third question.
2. **TREE-1.13 ← hier:154, "a target depth of 0, the sidebar's virtual top, fits a mover up to cap - 1 levels tall". Not recommended.**
   - **What it asserts:** the library half of the rule. At the top level, a mover of height `CAP − 1` fits and one of height `CAP` doesn't, which is the case's `1 + H` against `PCAP`.
   - **Why not:**
     - TREE-1.13 stays `Open` either way, for Story 10's sidebar test.
     - Once that test lands it covers the whole case, and the README rules out an internal pointer beside it.
     - The test also doesn't involve a subtree already over the cap, which is the case's premise.
   - **If Nathan wants the partial pointer now,** this is the test to carry the ID. This answers the Test Planner's second question.

**Dropping existing pointers:** the re-check's two optional drops (`positionResolver.test.ts` from TC-2.4's and TC-2.9's lines) are still Nathan's call. Nothing new.

## Proposed Manual (need approval)

**None.**

---

## Gaps

**No case changed status, and no gap opened.** The catalog's 64 `Open` cases are the re-check's, and their routes stand as the earlier reports give them. The ones this run touched:
- **TREE-1.13 (P2):** no test carries it. The library half exists (Proposed Internal Mappings, item 2). The sidebar half is Story 10's.
- **DRAG-1.6 (P0):** unchanged. dragRegions:72 asserts its last clause, and bands:628 asserts a release in the sibling sub-row after the pop. Still missing:
  - a release in `W2` before the pop, which commits `W1`'s reposition and leaves `X` in `W1`;
  - the pop into `W2` by `popInDelayMs` in its middle band.
- **DRAG-6.15 (P1):** unchanged. 6a's tests cover a third reason a reload lands mid-drag, a failed column reorder, which the case's *Given* doesn't name. Whether it should is the PO's question (Uncatalogued Tests).

---

## Duplication

Reported, not judged. Each case below still has tests that prove it. The re-run named the first four.

- **ATT-9.1:** WP:46 and WP:76, now in one file. WP:76 repeats WP:46's attach clause: the wrong workphase is refused and the parent's is accepted.
- **TC-2.24:** IT:456 (a position kept exactly) and PO:83 (no position, so the append). These are the "different claims" the re-run saw: the case's two sentences, one test each.
- **TC-2.6 and TC-2.7:** IT:279, beside PO:44 and PO:51 (and PO:213, plus `positionResolver.test.ts`:268 and :277 for TC-2.7). PO:44 and PO:51 tell the workflow scope from a workphase scope. IT:279 can't (Test Quality Concerns, item 1).
- **ATT-4.10:** now in two files: eight tests in H across two describes, and IT:184. 6c moved AT's two into H.
- **ATT-5.1 and ATT-5.2:** CP:31 by move, and CP:88 and CP:100 by `PUT`, now in one file.
- **TC-3.4:** PO:116, PO:213 and PO:305, now in one file.
- **DRAG-1.30:** four popSession tests. **DRAG-1.3:** bands:414 and :445 on the line, and popSession:53.
- **If the stamps land:** TC-5a.5 on `itemListOps.test.ts` and hier; BCU-1.5 on boards:330 and inherit:58 and :157.
- **If the panel mapping is approved:** TC-5a.1 on ipSpec:57 and :92, pw:13 and :32, `dragRequest.test.ts`:267, and panel.

---

## Test Quality Concerns

### The re-run's items for the Reconciler

From the Auditor's re-run section of the plan's Open questions. Its line numbers predate 6c's and 6d's moves; the current ones are given here.

1. **Tests whose move doesn't check its status. Both still stand.** 6c's #4 made the `create*` helpers check their status. `move`, `put` and a raw `request(app).patch` still don't, and these two tests don't check it themselves.
   - **PO:680 (TC-5.5, "excludes a done item from an active-scope reindex").**
     - **The gap:** `await move(mover.id, …)` checks neither the status nor that a reindex fired. A refused move, or one that reindexed nothing, leaves the done item with no position, and the test passes.
     - **The fix:** expect the 200 and the reindex (`res.body.reindexed` naming T1, T2, P1 and the mover, or T1 at `1`). Then compare the done item's whole row with a read taken before the move, which also asserts the case's "nothing else about it changes".
   - **AT:133 (ATT-1.3, ATT-1.6, "a detached child halts the cascade for its whole branch").**
     - **The gap:** the root's move isn't checked. A refused move leaves both children in Todo, and the test passes.
     - **Why it matters:** ATT-1.3's "and `D` doesn't" rests on this test alone, since AT:18 has no detached child. ATT-1.6 also has AT:95, which checks each status.
     - **The fix:** expect the 200, and that the root is now in In Progress.
   - **Status:** both cases stay `Automated`, as with the earlier tests that couldn't fail (TC-2.23, TC-2.25, TC-5.1 and TC-5.4 in batch 4). The fixes are one line each.
2. **hier's `getSubtreeHeight` tests. Resolved by 6d.** `getSubtreeHeight` is gone. Its cases are in `getSubtree`'s describe (hier:80), which both cap checks now call: the board's drag classification and the sidebar drag. They carry no ID, and need none.
3. **reconcile:127 (DRAG-6.1, TC-2.28) builds the write tracker by hand. Still stands; low, and accepted.**
   - **What it proves:** the marker `sendItemMove` records is the anchor the request carries, and that marker draws the same order before and after the response.
   - **Why the hand-built tracker is faithful:** its `begin` does what the real one's does. The real tracker in `useItemManagement.ts` sets the placement with `withPlacement`, which the test then calls itself.
   - **The real tracker's own part,** that `begin` puts the marker on the board, is proven at the surface by bands:751, for a bottom-band drop.
   - **If wanted:** render `useItemManagement` and use its `writes`, as `useBoardDnd.test.ts` now renders its hook, so the top band also runs through the real tracker.
4. **dragRegions:72 (DRAG-1.6) checks only the gap between sub-rows. Stands, as a partial test should.** DRAG-1.6 is `Open`. This test asserts the case's last clause at the hit-test level, and isn't on the line: `dragRegions.test.ts` isn't approved for DRAG-1.6. What the case still misses is under Gaps. No action.
5. **pw:13's title. Still stands; low.**
   - **The issue:** the test is "TC-5a.1, TC-5a.4: applies every reindexed pair the list holds, then the written item". Its response, `reindexFixtures.ts`'s worked example, has no pair for an id the list lacks, so it proves only that held pairs apply, which is TC-5a.1's ground. pw:25's response has only an unheld pair.
   - **Coverage:** together the two tests cover TC-5a.4's *Then*, so the case stays `Automated`. But neither has the case's *Given*, a mix of held and unheld ids.
   - **The fix:** give pw:25's response a held pair beside the unheld one, and assert both outcomes. pw:13 can then drop TC-5a.4.
6. **inherit's test that could pass with its setup refused. Resolved by 6e.** inherit:157 creates its item through `seedItem`, which fails on a refused request. It shows the item on the child's own board first, then asserts it's absent from the parent's.
7. **Case IDs on more than one test** (ATT-9.1, TC-2.24, TC-2.6 and TC-2.7, ATT-4.10): reported under Duplication. Each still proves its case. One quality note, on IT:279, is item 1 below.
8. **The re-run's #17** is done by 6c's moves (Coverage Mapping). **#18 and #19** weren't done and stay on the Watch List, so there's nothing to re-point for them.

### The Coder's notes to the Reconciler

- **6c (2 of 2), the ten moved tests:** confirmed (Coverage Mapping). The retitled `boards.test.ts` test carries no ID (Uncatalogued Tests).
- **6d, the two popSession retitles:** confirmed. hier's `getDepth` and `getSubtree` describes carry no ID, as the note says.
- **6e:** no title changed. The two setups it changed are still whole (Coverage Mapping).
- **6a and 6b:** listed under Uncatalogued Tests, as the brief asks.

### Other concerns

None blocks a status.

1. **IT:279, "TC-2.6, TC-2.7: positions the first item in a workphase at 1.0 and the next at max + 1.0".**
   - **The issue:** its one workphase is also the whole workflow, so it can't tell the workflow scope from a workphase scope. Its title states the rule in workphase terms, which TC-2.7's second sentence contradicts in general ("an empty workphase isn't an empty scope").
   - **Coverage:** PO:44 and PO:51 prove both cases.
   - **The fix:** retitle it in workflow terms ("the first item in an empty workflow is at 1.0, and the next goes after it"), or drop the two IDs.
2. **PO:83 (TC-2.24's second sentence).** The destination workphase's last item is also the workflow's, so a workphase-scoped append would give `4` too. The case asks only for the append fallback, so the test fits it; the scope is TC-2.6's and TC-2.10's. If wanted, pin the workflow's true last in another workphase.
3. **CP:88 (ATT-5.1 by `PUT`)** uses projects with no workflow, so it can't show the case's attach or workphase. It's support, and CP:31 proves the case. No action.
4. **Carried from the re-check, both still open:**
   - PO:130, TC-5.4's magnitude trigger (the re-check's PO:110). It still creates `A` (Todo) before `B` (In Progress), so on that trigger neither insertion order nor workphase order can be told from the combined order.
   - `tests/api/itemRepositioningAttachedSiblings.spec.ts:17`'s header still names TC-2.4, which its titles don't carry.

No mapped test was found tautological.

---

## Uncatalogued Tests

**Waiting on a PO question (listed as the brief asks, and no more):**
- **6a, `client/src/components/workflow/useBoardDnd.test.ts`:**
  - :57, "ends an item drag that began while the save was in flight, and the release writes nothing";
  - :87, "reloads the board when no drag is live";
  - with `useColumnManagement.test.ts`:49, "resyncs through the callback it is given when the save fails, never by reloading itself".
  - The question is whether DRAG-6.15 names every reload (the re-run's PO bullet on wiki board-drag-interaction §10).
- **6b:**
  - IT:158, "returns 400 for an empty-string parentId or agentId, which names no row, and creates nothing";
  - projects:304, "a parent that is neither a string nor null is refused, and nothing changes".
  - The question is whether a page states the empty-string rule (the 4f notes' PO bullet).

**Gate and contract support, with no standalone rule:**
- **IT's `PUT` agent test** (from 4e and 4f, now looping over `'no-such-agent'` and `''`). No page covers the agent field, as the re-check said.
- **boards:25, "POST /api/workflows creates exactly one board, with no columns while the workflow has no workphases"** (retitled in 6c). It's on wiki boards-columns-unsorted §1's ground, which BCU-1.1 and BCU-1.2 cover. "Exactly one" goes beyond the wiki's "at least one", so it isn't a candidate.
- **hier's `getSubtree` (:80) and `sortedChildrenByParent` (:111) describes** (new in 6d). These are library support. `sortedChildrenByParent`'s sibling order is TREE-4.3's ground, which the sidebar spec proves whole, so no internal mapping is proposed beside it. Its missing-parent case has no rule (6d: the foreign key makes it unreachable).

**On the wiki's Open questions, so no case:**
- inherit:46 and :52, the child's view of its inherited board, and the second half of inherit:64. Wiki boards-columns-unsorted §3 says what an inheriting project sees of its ancestor's board is a placeholder.
- inherit:82's describe: the banner, the hidden controls and the banner link. These are the project page's Open questions, as the Test Planner answered.
- `tests/ui/workflow-creation.spec.ts`: no page states how a workflow is created from a template. The Test Planner routed that to the PO, if wanted.

## Candidate New Cases

**None new.** The two scenarios above that the catalog lacks are already routed to the PO in the plan's Open questions: a failed column reorder ending a live drag, and the empty-string id.

---

## Totals

**Status changes in this run:** none.

**The whole catalog: 350 cases,** unchanged from the re-check.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 112 | 123 | 44 | 279 |
| Open | 21 | 32 | 11 | 64 |
| Manual | 0 | 2 | 2 | 4 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **Total** | **133** | **157** | **60** | **350** |

**By folder:**

| Folder | Cases | Automated (P0/P1/P2) | Open (P0/P1/P2) | Other |
|---|---|---|---|---|
| board-drag-interaction | 114 | 50 (29/19/2) | 60 (20/31/9) | 4 `Manual` (DRAG-1.29, 1.32, 4.24, 4.25) |
| item-positioning | 79 | 76 (43/29/4) | 2 (0/1/1): TC-6.11, TC-5.15 | 1 `Pending PO` (TC-6.13) |
| item-attachment | 72 | 69 (30/25/14) | 1 (1/0/0): ATT-4.9 | 1 `Planned` (ATT-1.10), 1 `Pending PO` (ATT-5.11) |
| project-tree | 52 | 51 (7/29/15) | 1 (0/0/1): TREE-1.13 | — |
| boards-columns-unsorted | 33 | 33 (3/21/9) | 0 | — |
| item-sheet | 0 | — | — | `INDEX.md` only |

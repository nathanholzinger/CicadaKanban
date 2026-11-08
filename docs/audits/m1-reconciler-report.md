# Test Reconciliation: M1, API contract migration (batches 1–3), proposing run

**Scope:** a proposing run for story M1 (`docs/planning/api-contract-migration/m1-foundation-and-baseline.md`), run 2026-11-07 on branch `api-contract-migration` at `4ecd49bb`, on a clean tree. It covers:
- **the whole-catalog checks:** lost coverage, unknown IDs, and any `Manual` case the Test Planner set whose ID a test now carries. Every search included `server/tests/contracts/`: its test titles, the corpus names in `compatibilityCases.ts` and the snapshot keys;
- **the 34 case IDs the HTTP compatibility corpus carries,** each checked against its full *Given/When/Then* and the route tests already mapped to it;
- **the two Test Quality questions the corpus review sends here,** on TC-6.9 and TC-5.2.

No catalog field was written. This run had no shell, so no test was run, and the results in `m1-progress.md` stand: the full gate passed (536 server, 604 client and 235 tooling tests), and Playwright passed 219 with 18 skipped.

**Inputs read:**
- **M1's planning docs:** `m1-progress.md`, `m1-corpus-coverage-review.md`, `m1-baseline-and-exclusions.md`, the M1 plan's handoff sections, and `docs/planning/tech-debt-stories/api-contract-compatibility-follow-ups.md`.
- **The catalog:** `docs/test-plans/README.md`, every suite's table (for the whole-catalog checks), and in full the suite files that hold the 34 cases: att-1, att-3, att-7, att-9, part-2, part-5, part-6, part-7, cross-cutting-regression, tree-3, tree-4 and tree-6.
- **The wiki:** positioning §1–§8, item-positioning §2, §2.1, §5 and §6, item-attachment §2 and §2a, and row-references.
- **The route tests:** the eight files that carry the 34 IDs, read where each case sits.
- **All of `server/tests/contracts/`:** the corpus, its harness, both test files that replay it, the 30 ID-bearing snapshots, and the untagged snapshots this report cites.
- **An ID search** across `server/tests/`, `client/src/`, `tests/`, `scripts/` and `tools/`.

**In brief:**
- **All 34 corpus IDs stay `Automated`.** Each still has route tests carrying its ID, and those tests assert its whole *Then*. The one low exception is ATT-7.1: its edit path is asserted only indirectly (Test Quality Concerns, item 5), and a stamp is proposed for it.
- **TC-6.9 and TC-5.2 hold.** Their route tests assert the catalog's own values. I worked out the corpus's golden values for both by hand from its fixture, and they agree with wiki positioning §6 and wiki item-positioning §2. TC-5.2's corpus example covers that case whole. TC-6.9's is partial, because its reopened item never had a position.
- **The corpus covers four cases whole:** TC-2.13, TC-2.15, TC-5.2 and TC-6.2. It covers the other 30 in part. I propose no mapping to the corpus, since route tests cover all 34 whole.
- **Lost coverage: DRAG-7.27.** Its only test is skipped, so it should be `Open`. M1 didn't cause this: the skip predates M1, and Story 10 on main owns it.
- **No unknown IDs, and no Test Planner `Manual` case whose ID a test carries.** The `TC-X.6` prefix is gone from both the corpus title and its snapshot key.
- **Two candidate cases, both PO gaps:**
  - what a move naming its neighbor as `null` means: items refuse it, and projects read it as no neighbor;
  - whether a write that leaves an item Attached may name `workphaseId: null`.

Aliases used below:

| Alias | File |
|---|---|
| AT | `server/tests/routes/items.attached.test.ts` |
| H | `server/tests/routes/items.hierarchy.test.ts` |
| WP | `server/tests/routes/items.workphase.test.ts` |
| POS | `server/tests/routes/items.positioning.test.ts` |
| IT | `server/tests/routes/items.test.ts` |
| XP | `server/tests/routes/items.crossProject.test.ts` |
| boards | `server/tests/routes/boards.test.ts` |
| projects | `server/tests/routes/projects.test.ts` |
| corpus | the examples in `server/tests/contracts/compatibilityCases.ts`, run as "HTTP compatibility corpus > …" by `server/tests/contracts/apiCompatibility.test.ts` against `server/tests/contracts/__snapshots__/apiCompatibility.test.ts.snap` (snap) |
| harness | `server/tests/contracts/compatibilityHarness.ts` |

**The corpus fixture, as this report reads its values** (harness:92–149):
- **Items:** Free items in Todo at `prevItem` 1, `movingItem` 2, `nextItem` 3, `parentItem` 4 and `detachedChild` 5, a detached child of `movingItem`. `attachedChild` (under `movingItem`) and `anchorChild` (under `parentItem`) each sit at 1 among their siblings. `doneItem` and `unsortedItem` have no position.
- **Projects:** top-level `Main` 1, `Foreign` 2, `Moving project` 3, `Previous project` 4 and `Next project` 5, and `Child project` 1 under `Main`.
- **Variants:** `item-reindex` pins `nextItem` at 1600, and `project-reindex` pins `Next project` at 1600.

---

## Coverage Mapping

Every case below is `Automated` now and stays `Automated`. Each Automation line already names the files listed, so no path changes. In the corpus column, "partial" means the example asserts only some of the case's *Then*.

| Case | P | Route tests carrying the ID | Whole *Then*? | Corpus example, and how much it covers |
|---|---|---|---|---|
| ATT-1.3 | P0 | AT:18 "ATT-1.3: moving a parent cascades through attached children and grandchildren"; AT:117 "ATT-1.3, ATT-1.6: a detached child halts the cascade for its whole branch" | Yes. AT:117's detached child sits under the root, not under `C1`. Earlier runs judged the rule to be the same at any depth, and I agree | "ATT-1.3, ATT-1.6, TC-2.24: item workphase-only cascades attached descendants and notifies": one attached child, no chain; partial |
| ATT-1.6 | P0 | AT:95 "ATT-1.6: a detached child keeps its workphase, position and completedAt through every move of its parent"; AT:117 | Yes: an active and a done detached child, through a live move, a terminal one and back out | Same example: one non-terminal move; partial |
| ATT-1.8 | P0 | H:139 "ATT-1.8: a move or an edit that would leave the flag on a parentless item is refused"; H:482 "ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position" | Yes: both refusals, by move and by PUT, with both rows unchanged; and the flagless null-parent write accepted, with the flag clear | "ATT-1.8: item parentless attach refused": the top-level refusal, by move only; partial |
| ATT-3.11 | P1 | H:399 "ATT-3.10, ATT-3.11: a top-level item reparented without the flag becomes a detached child, and keeps its position" | Yes, by move and by PUT: `X` in Todo, `B` in In Progress, the flag clear, and Todo and 7.5 kept | "ATT-3.11: item reparent without flag stays free": the parent is in the item's own workphase, so "still in `W1`" can't be told from "takes `B`'s"; partial |
| ATT-7.1 | P0 | H:337 "ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-9.4, TC-2.14, TC-7.13: detaches with placement into the workflow scope, keeping the parent" | Holds for the move. On "whichever write makes the change", the edit path is asserted only through ATT-8.1's log tests (Test Quality Concerns, item 5) | "ATT-7.1, ATT-9.4: item detach keeps parent and takes shown workphase": the move, as H:337 |
| ATT-7.7 | P0 | H:482; H:497 "ATT-7.7: reparent to root from under a done parent makes it a done Free item"; AT:244 "ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase" | Yes, together: accepted by move and by PUT, with the flag clear, the workphase kept and a fresh position (41, on the move), plus the terminal branch on the move | "ATT-7.7, ATT-9.5: item null parent clears attachment": a non-terminal move; partial |
| ATT-9.1 | P1 | WP:86 "ATT-9.1: a move that leaves an item Attached cannot name a workphase other than its parent's"; WP:116 "ATT-9.1: rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one" | Yes, together. WP:86 checks only the status when `F` names `W1`, and WP:116 checks the message for the same refusal | "ATT-9.1: item attached child rejects explicit null workphase": a scenario the case doesn't name (Test Quality Concerns, item 6; Candidate New Cases, item 2) |
| ATT-9.4 | P0 | WP:160 "ATT-9.4: a detach that names no workphase leaves the item in the one it was shown in"; H:337; `tests/ui/attached-children.spec.ts:245` "ATT-9.4: detaching a child via the detail panel keeps it in place when the parent moves" | Yes: by move and by PUT, `W2` and not `W1`, the drifted `W3` row, and `D`'s later move | "ATT-7.1, ATT-9.4: …": the shown, own and root's workphases are all Todo; partial |
| ATT-9.5 | P1 | WP:185 "ATT-9.5: a reparent to root of an Attached item that names no workphase leaves it in the one it was shown in" | Yes: by move and by PUT, and the drifted row | "ATT-7.7, ATT-9.5: …": the same all-Todo fixture; partial |
| ATT-9.8 | P1 | WP:329 "ATT-9.8: a move can't leave a Free item in a workphase its project's workflow doesn't use" | Yes: with and without the reparent, and `F` unchanged | "ATT-9.8: item foreign workphase refused": no reparent; partial |
| ATT-9.11 | P2 | WP:310 "ATT-9.11: naming workphaseId: null leaves an item Free with no workphase, whatever it was shown in" | Yes: the detach and the create | "ATT-9.11: item explicit null workphase clears it": a top-level item, not a detach; partial |
| TC-2.5 | P0 | POS:96 "TC-2.5: every prepend before the true first item stays above 0.0, through the reindex that repeating it forces"; POS:379 "TC-2.5: C before A — becomes the new true first item"; `tests/api/itemRepositioningAttachedSiblings.spec.ts:50` "TC-2.5, TC-3.1, TC-3.2, TC-3.5: C before A — becomes the new true first sibling" | Yes: 0.5, then every repeat stays above 0, through a reindex | "TC-2.5: item before anchor resolves position": the single prepend, at 0.5; partial |
| TC-2.13 | P1 | POS:571 'TC-2.13: GET returns positionScope = "attached-siblings" for an attached child' | Yes | "TC-2.13: attached item detail has sibling scope and depth": whole |
| TC-2.15 | P1 | POS:615 'TC-2.15: GET returns positionScope = "none" for a done item' | Yes | "TC-2.15: done item detail has completion and no scope": whole |
| TC-2.16 | P1 | boards:139 "TC-2.16: surfaces items whose workphase was deleted as invalidItems (Unknown status)" | Yes: the workphase is deleted, then `positionScope` reads `"none"` | "TC-2.16: unsorted item detail has null workflow and no scope": created with no workphase, none deleted; partial |
| TC-2.24 | P0 | IT:482 "TC-2.24: a workphaseId-only move with no anchor keeps the item's existing position exactly unchanged"; POS:84 "TC-2.24: an item with no position takes the append fallback when it is assigned a workphase" | Yes: 7.5 is kept, and an item with no position gets 4 | "ATT-1.3, ATT-1.6, TC-2.24: …": 2 is kept, with no fallback clause; partial |
| TC-2.32 | P1 | IT:413 "TC-2.32: a move that names a final position is refused, and no endpoint sets several outright" | Yes | "TC-2.32: item explicit position wins over other faults": `position: null` among other faults; partial |
| TC-2.34 | P2 | POS:443 "TC-2.34: an anchorId given as an empty string names no item, and a move is refused on either side, writing nothing" | Yes: the case's fixture, on both sides | "TC-2.34: item empty anchor is a missing row": one side, and no workphase change; partial |
| TC-5.2 | P0 | H:854 "TC-5.2, TC-5.10, TC-5.13, TC-5.14: PUT and POST disclose the same way" | Yes (Test Quality Concerns, item 2) | "TC-5.2, TC-5.9: item append after large anchor discloses reindex": whole for TC-5.2 |
| TC-5.9 | P0 | POS:629 "TC-2.12, TC-5.1, TC-5.4, TC-5.9, TC-5.13, TC-5.14: reindexes every non-terminal workphase in the workflow together, in one coordinated pass, in their combined order" | Yes: a tight gap, the reindex to 1–4, the mover at 1.5, and every renumbered pair disclosed | Same example: the magnitude trigger, not the tight gap; partial |
| TC-6.1 | P0 | POS:227 "TC-2.18, TC-6.1, TC-6.3: POST into a terminal workphase gets no position, but a completedAt timestamp"; POS:544 "TC-6.1, TC-6.3: moving into a terminal workphase clears position and sets completedAt" | Yes: the create and the move, each stamped within the write | "TC-6.1, TC-6.3: item terminal workphase clears position and sets completion": the move, stamped at exactly the write time; partial |
| TC-6.2 | P0 | POS:557 "TC-6.2, TC-6.9: moving out of a terminal workphase clears completedAt and assigns a fresh position" | Yes | "TC-6.2, TC-6.9: item reopening appends and clears completion": whole for TC-6.2 |
| TC-6.3 | P0 | POS:227; POS:544; POS:271 "ATT-7.4, TC-6.3: detaching into a terminal workphase clears position and sets completedAt" | Yes: created there, moved there and detached there | "TC-6.1, TC-6.3: …": the move; partial |
| TC-6.9 | P1 | POS:150 "TC-6.9: a reopened done item takes the append fallback, not the position it had before"; POS:557 | Yes (Test Quality Concerns, item 1) | "TC-6.2, TC-6.9: …": partial (Test Quality Concerns, item 1) |
| TC-7.10 | P1 | H:183 "ATT-3.7, TC-7.10: rejects an anchor outside the resulting scope, committing nothing"; H:198 "TC-7.10: rejects the item as its own anchor with a 400, not a 500"; H:211 "TC-7.10: rejects an anchor for an item that ends with no workphase, which has no scope"; POS:480 "TC-7.10: rejects anchoring a detached item against someone else's attached child"; POS:504 "TC-7.10: rejects anchoring against an item in a different workflow" | Yes: the attach and all three bullets, each leaving the item unchanged | "TC-7.10: item foreign anchor refused by scope": the other-workflow bullet; partial |
| TC-7.11 | P0 | H:173 "TC-7.11: validates the anchor against the resulting scope: a new sibling is accepted"; H:246 "ATT-1.7, ATT-3.6, TC-7.11: attaches with placement: every field and the cascade land in one commit" | Yes: H:246 uses the case's fixture, 50.0 → 1.5 | "TC-7.11: item attach and anchor use resulting sibling scope": one child, and the resolved 2 equals the old 2 (Test Quality Concerns, item 4); partial |
| TC-7.18 | P1 | XP:242 "TC-7.18, TC-7.20: an item a project move leaves in another workflow’s workphase shows in Unsorted, with no position scope" | Yes: the project move leaves the item there, and it then reads `"none"` | "TC-7.18: foreign item detail derives stored workflow but no scope": the state is written directly, not left by a move; partial |
| TREE-3.10 | P1 | projects:304 "TREE-3.10: a parent given as an empty string names no project: a create, an edit and a move refuse it, and nothing changes" | Yes | "TREE-3.10: project empty parent names missing row": the move; partial |
| TREE-4.5 | P1 | projects:499 "TREE-4.5: a move that reindexes discloses every renumbered sibling, the moved project included" | Yes: the reparent into `P`, its pairs, and the no-reindex control | "TREE-4.5: project append after large neighbor discloses reindex": top level, with no control; partial |
| TREE-6.1 | P0 | projects:375 "TREE-6.1: a move places the project next to the sibling it names" | Yes: 1.5, 2.5, and 2 with the mover's own place left out | "TREE-6.1: project null prev permits next neighbor": one before-neighbor placement, at 4.5; partial |
| TREE-6.2 | P1 | projects:397 "TREE-6.2: a move naming no neighbor places the project after its true last sibling, even under the same parent" | Yes: 4 at the top level, 1 under `Q`, and 4 under the same parent | "TREE-6.2: project empty body appends", "TREE-6.2: project both null neighbors append" and "TREE-6.2: project reparent appends in resulting sibling group" cover the same-parent move and the move into a parent. The child-to-top-level clause is in the untagged "project explicit null parent makes root"; partial |
| TREE-6.3 | P1 | projects:423 "TREE-6.3: a neighbor the move can’t use is refused, and nothing changes" | Yes: four neighbors, on both sides | "TREE-6.3: project neighbor outside resulting scope refused" and "TREE-6.3: project neighbor without position refused": two of the four, on the previous-neighbor side; partial |
| TREE-6.5 | P2 | projects:471 "TREE-6.5: a move naming the project itself as its neighbor is refused" | Yes: both sides, the message, and `X` unchanged | "TREE-6.5: project self neighbor refused": the previous-neighbor side; partial |
| TREE-6.6 | P1 | projects:485 "TREE-6.6: a move can’t name a position" | Yes | "TREE-6.6: project explicit position wins over all field shapes": `position: null` among bad shapes; partial |

## Lost Coverage

- **DRAG-7.27 (P2): `Automated` → `Open`, proposed, with `—` on its Automation line.**
  - **Why:** the only test carrying its ID, `tests/ui/drag-7-overflow-row.spec.ts:359` "DRAG-7.27: a dragged R carries its overflow row, which is never a neighbor, and at the first level its children show", is a `test.skip`, and no client test carries the ID.
  - **Not M1's:** the skip is row 18 of `m1-baseline-and-exclusions.md`, inherited from Story 8.3, and the Epic 3.5 roadmap routes the case to Story 10's catch-up.
  - **The file is shared with main,** where Story 10 is changing the drag specs.
  - **For Nathan:** should the confirming run on this branch write DRAG-7.27's two fields, or should main's Story 10 Reconciler, who owns the skip? Writing them here touches `docs/test-plans/board-drag-interaction/drag-7-overflow-and-hierarchy-modal.md`, a file Story 10's close-out will probably edit too, so the merge could conflict on that line. I'd leave it to Story 10. If Story 10 unskips the spec before the merge, the case may stay `Automated`.
- **Batch 2's moves and deletions lost no coverage.** No catalog Automation line names a file under `server/tests/contracts/` or in the retired `prototypes/` tree. Every other `Automated` case still has a running test whose title carries its ID, in `server/tests/`, `client/src/` or `tests/`.
- **DRAG-7.15 isn't lost, but part of it runs only in skipped specs.** Its running tests are `tests/ui/drag-7-modal-hold.spec.ts:252`, `:374` and `:401`, and the client modal tests. Its two below-gap specs, `:322` and `:349`, are skipped. Whether the running tests still assert its whole *Then* is outside this run's scope. The Epic 3.5 roadmap routes that check to Story 8's close-out Reconciler.
- **The 18 skips:** ten carry IDs:
  - `tests/ui/drag-5-stub-detach.spec.ts:111`;
  - `tests/ui/drag-7-hierarchy-modal.spec.ts:338`, `:548`, `:579` and `:604`;
  - `tests/ui/drag-7-modal-hold.spec.ts:190`, `:322`, `:349` and `:719`;
  - `tests/ui/drag-7-overflow-row.spec.ts:359`.

  Every ID they carry is an `Open` case's, except DRAG-7.15 and DRAG-7.27. The other eight skips carry no ID. No server or client Vitest test is skipped.

## Unknown IDs

None.
- **What was searched:** every test string in `server/tests/` (the contracts titles, the 77 corpus names and the 30 snapshot keys included), `client/src/`, `tests/ui/`, `tests/api/` and `tests/helpers/`. Every ID in a test title is a case in the catalog. No test string carries a prefix other than TC, ATT, TREE, DRAG or BCU.
- **`TC-X.6`:** the prefix is gone from the corpus. The example is now "item self anchor refused" at `compatibilityCases.ts:124`, under the matching snapshot key at snap:2023. The real TC-X.6 test is still POS:411.
- **IDs outside test titles, all real cases:**
  - `scripts/check-docs/check.test.mts` and `repoIndex.test.mts` hold IDs inside assertion strings, as the checker's own fixtures, not in titles;
  - `tools/api-contracts/fieldDrills.ts:117` names ATT-9.11 as a Vitest `-t` filter.
- **Test Planner `Manual` cases:** none of the five (DRAG-1.29, DRAG-1.32, DRAG-4.24, DRAG-4.25 and DRAG-7.20) is carried by a test title. DRAG-7.20 appears only in a comment, at `tests/ui/drag-7-modal-hold.spec.ts:36`.
- **Left out of the search:** Playwright's output under `tests/output/`, which is generated.

## Proposed Stamps

1. **ATT-7.1 onto WP:160,** "ATT-9.4: a detach that names no workphase leaves the item in the one it was shown in".
   - **The fix first:** a developer adds `parentId: a.id` to the `toMatchObject` at `server/tests/routes/items.workphase.test.ts:169`, then stamps the ID. That test detaches `X` from `A` by the move and by the PUT, so with the one added field it asserts ATT-7.1's "whichever write makes the change" in full.
   - **The file:** shared with main. Story 10's UI changes don't touch it, so a conflict is unlikely.
   - **A stamp-only alternative:** H:703, "ATT-8.1: each parent or attachment change logs one entry on the moving item, at both entry points, and none on the parents". After its PUT detach, the next reparent logs 'Reparented from "P" to "Q" (detached)', which shows the parent was kept. It asserts that through log text rather than the field, though, so I prefer the first option.
   - **No status change either way** (Test Quality Concerns, item 5).

No stamp onto the corpus is proposed. Every untagged corpus example that matches a case (Duplication) matches one a route test already covers whole.

## Proposed Internal Mappings (need approval)

None.

**One classification for Nathan: does `server/tests/contracts/` count as a surface?** Its tests reach the API through Supertest, the same way route tests do. But `docs/test-plans/README.md` names only `server/tests/routes/` as a server surface, and the corpus file's own header says its checks "do not replace the domain-rule tests or turn observed behavior into product rules". It matters on a future lost-coverage scan. If a route test for one of these 34 cases were deleted, the corpus title would still carry the ID, though for 30 of the 34 the corpus covers the case only in part.

My recommendation: don't treat the corpus as a counting surface. Its IDs stay as supplementary claims, and a case with no other test carrying its ID goes `Open`.

## Proposed Manual (need approval)

None.

## Gaps

- **Among the 34: none.**
- **DRAG-7.27, once it's `Open`** (Lost Coverage). It isn't hard to automate: its spec exists, and was skipped when the gesture's from-above aim changed. Story 10 rewrites it, so no `Manual` is proposed.
- **The catalog's other 79 `Open` cases** are outside this run's scope.

## Duplication

- **Corpus beside route tests, on all 34 cases** (Coverage Mapping names both for each).
  - **Whole twice:** for four cases the corpus covers the case whole, beside a route test that also does: TC-2.13 (POS:571), TC-2.15 (POS:615), TC-5.2 (H:854) and TC-6.2 (POS:557).
  - **The other 30:** the corpus adds a partial example beside whole route coverage.
- **Two of the 34 have a Playwright test as well:** ATT-9.4 (`tests/ui/attached-children.spec.ts:245`) and TC-2.5 (`tests/api/itemRepositioningAttachedSiblings.spec.ts:50`). Both files are shared with main.
- **Untagged corpus examples that match a case another test covers whole.** None is proposed for a stamp.

  | Corpus example | Case and clause | Covered whole by |
  |---|---|---|
  | "item self anchor refused" (400, "anchorId cannot be the item itself") | TC-7.10's third bullet, the anchor that is the moving item itself | H:198 |
  | "item done anchor refused by scope before missing position" | TC-2.8's first clause | POS:460, H:580 |
  | "project explicit null parent makes root" (`Child project` 1 → top level at 6) | TREE-6.2's first bullet | projects:397 |
  | "project invalid selected prev does not fall back to next" | TREE-6.3, a neighbor that's no project, and no fallback | projects:423 |
  | "item detail includes children activity workflow and depths" | TC-2.14, for both the top-level item and its detached child, and TC-2.13, for its attached child | TC-2.14: POS:606 and H:337; TC-2.13: POS:571 |

- **The corpus runs twice in every gate.** The two runs are `apiCompatibility.test.ts`, which compares each example with its snapshot, and `server/tests/contracts/apiContracts.test.ts:61`, "all characterized responses meet both contracts, reusing only unchanged fixture state". Through harness:170–171, both assert each example's expected status and, for reads and refusals, that nothing was written. The duplication looks intentional: one pins the payloads, the other validates the schemas.
- **TC-5.2's *Then* is also asserted under other IDs:** in POS:131, "TC-5.4, TC-5.13, TC-5.14: the magnitude trigger renumbers every active workphase in one sequence, and discloses them all", and H:835, "TC-5.10, TC-5.11, TC-5.14: move: the response carries every renumbered {id, position} pair, the moved item included". Each has n = 2 and lands at 3.

## Test Quality Concerns

1. **TC-6.9: the corpus review's question. It holds, and the corpus claim is partial.**
   - **The case:** the workflow's true last Free item is at `6.0`, and a reopened done item lands at `7`, with no earlier position coming back.
   - **The route test:** POS:150 is that fixture exactly. `X` is created at 1.0, `E` is pinned at 6.0, and `X` is moved to Done, where its position is asserted null. Reopened with no anchor, it lands at 7, and 7 ≠ 1.0 shows the earlier position doesn't come back. That's grounded in wiki item-positioning §2: an item with no position to keep, as a reopened done item has none, takes the append fallback. POS:557's check, `> existing.position`, is weaker, but POS:150 doesn't need it.
   - **The corpus:** `doneItem` reopens at 6 (snap:865, snap:896). The workflow's true last Free item is `detachedChild` at 5, and round(5 + 1.0) is 6, so the value is the rule's. But `doneItem` was created in Done and never had a position, so "no earlier position comes back" isn't exercised, and the fixture isn't the case's 6.0 → 7.
   - **Outcome:** no stamp and no change. The corpus review's note stands.
2. **TC-5.2: the corpus review's question. It holds, and the corpus covers it whole.**
   - **The case:** with n items in the scope, the next appended value would cross `max(1000, n + 100)`, so the scope is reindexed first, and the appended item takes n + 1.
   - **The route test:** H:854 has `A` 1100 and `B` 1200, so n = 2 and the next append would be 1201. The POST discloses `A` → 1, `B` → 2 and the new item → 3. The PUT attaches the item under `P`, whose only child `S1` is at 1500 (n = 1, next append 1501), and discloses `S1` → 1 and the item → 2.
   - **The corpus,** with `nextItem` pinned at 1600: `movingItem` is placed after `nextItem`, the true last item, so the append fallback would give 1601. Without the mover, the scope holds four items, so the threshold is max(1000, 104) = 1000. The scope is reindexed in order (`prevItem` 1, `parentItem` 2, `detachedChild` 3, `nextItem` 4), and the mover lands at 5 = n + 1 (snap:647–760). That matches wiki positioning §6, whose worked example, an entry placed after the last, has this same shape.
   - **The threshold:** neither test sits near its boundary (1201, 1501 and 1601 against 1000), so neither pins the formula. TC-5.2's *Then* doesn't ask it to: the scaling is TC-5.3's, in the lib test, and the done items' part is TC-5.15's, which is `Open`. Not a defect.
3. **The corpus's golden values are snapshots of the code's output.**
   - **What's asserted independently of the snapshots:** the expected status, which is written by hand in `compatibilityCases.ts` and asserted at harness:171, and, for reads and refusals, that nothing was written (harness:170). Every other value (positions, messages, fields) was captured from the code, and `vitest -u` would rewrite it without complaint.
   - **What I checked:** each of the 30 ID-bearing examples, against its case, on the clauses it bears on, working the values out from the fixture above. None contradicts its case.
   - **Recommendation:** an update to an ID-bearing snapshot goes past the Reconciler. The corpus is never the only basis for `Automated` (Proposed Internal Mappings).
   - **The files:** `server/tests/contracts/` exists on this branch only.
4. **Some corpus fixtures can't tell the rule from its failure.**
   - **TC-7.11:** the resolved position, 2, equals the item's old workflow position, 2, so the example can't tell a fresh resolution among `parentItem`'s children from a kept number. That's the failure TC-7.11 exists to catch.
   - **ATT-3.11:** the new parent shares the item's workphase.
   - **ATT-7.1, ATT-7.7, ATT-9.4 and ATT-9.5:** the shown, own and root's workphases are all Todo.
   - **ATT-9.11:** the example isn't a detach.
   - **TC-6.9:** the reopened item never had a position.

   That's why these claims are partial. No action is needed while the route tests cover the cases whole. M1 keeps the corpus frozen by design, so leaving these titles as partial claims is cheaper than giving the examples contrasting fixtures. (This branch only.)
5. **ATT-7.1: "whichever write makes the change" (low).**
   - **What's asserted:** the only route test carrying the ID, H:337, detaches by the move. On a PUT detach, the kept `parentId` is asserted only indirectly, through ATT-8.1's log content: H:703 at both entry points, and H:743 ("ATT-8.1: logs attach, detach, reparent and top-level with the right content, at both entry points").
   - **Status:** I'd keep it `Automated`. Earlier runs judged the case whole, and the PUT path is asserted, if through log text.
   - **The fix:** Proposed Stamps, item 1. The file is shared with main.
6. **ATT-9.1's corpus claim names a scenario outside its *Then*.** "ATT-9.1: item attached child rejects explicit null workphase" refuses `workphaseId: null` on an item that stays Attached. ATT-9.1's *Then* names `W3`, a real workphase. The refusal may or may not fall under ATT-9.1's rule, which turns on a question the wiki leaves open (Candidate New Cases, item 2). It isn't a wrong association like the `TC-X.6` one. I recommend no retitle until the PO rules.
7. **Retitling a corpus example has a tooling dependency.** `tools/api-contracts/fieldDrills.ts:117` selects the corpus's ATT-9.11 example by its title, with `-t ATT-9.11`. Any retitle of that example has to update the drill too. (This branch only.)
8. **Low, no action:**
   - **AT:244** asserts only `position` not null on the PUT reparent to root, which can't tell a fresh position from a kept one. H:482 pins the fresh value, 41, on the move, so ATT-7.7 holds on the two together.
   - **ATT-1.3's detached child** sits under the root rather than under `C1`. Earlier runs ruled the rule is the same at any depth.

**Answers to the M1 plan's handoff to the Reconciler:**
- **"Confirm case mappings by full assertions; do not certify the corpus from its titles":** done, case by case, in Coverage Mapping.
- **"Retain snapshot response assertions even if their catalog mapping is unconfirmed":** nothing here asks to remove one.
- **The whole-catalog check after Batch 2:** Lost Coverage.
- **"Decides any proposed additional mappings":** none is proposed.

## Uncatalogued Tests

**Infrastructure tests, which carry no business rule.** They aren't mapped:
- `server/tests/contracts/apiContracts.test.ts`: the integrated contract checks, its three MCP checks included. MCP is a known non-priority;
- `server/tests/contracts/conversionEdges.test.ts`: the seven native conversion probes;
- `server/tests/contracts/generationBoundary.test.ts`, `operationMetadata.test.ts`, `parseParity.test.ts` and `routeDiscovery.test.ts`: the infrastructure checks Batch 3 added, which per the M1 plan number eleven.

**The 47 untagged corpus examples:**
- **41 characterize transport behavior, with no standalone business rule.** They aren't mapped. Most are already queued in `api-contract-compatibility-follow-ups.md`:
  - **14 under CF3:** the four legacy `scopeWorkphaseIds` examples, the three unknown-field examples and the seven workflow-list query examples;
  - **5 under CF2:** the four body-parser and global-handler 500s, and the object anchor's 500;
  - **3 under CF1:** "project prev selects neighbor and ignores missing next row", "project prev selects neighbor and ignores empty next row" and "project unused next still gets type checked";
  - **19 request-shape checks and their order,** none queued:
    - the nine "… wins over …" precedence examples (six item, three project);
    - the two missing-target 404s;
    - the empty body and the two array bodies;
    - a side alone, an anchor without a side, an invalid side ignored without an anchor, and the numeric anchor;
    - "missing item detail returns 404 without ID format validation".

    These need no PO question: the order of refusals is a detail the wiki leaves open, and under Nathan's standing ruling a test may pin such a detail.
- **5 match a case already covered whole elsewhere** (Duplication).
- **1 is a genuine scenario the catalog misses:** "item null anchor is not omission" (Candidate New Cases, item 1).

## Candidate New Cases

1. **A move that names its neighbor as `null`: a PO gap.**
   - **Items refuse it.** `{anchorId: null, side: 'after'}` gets a 400, "anchorId does not reference an existing item": the corpus example "item null anchor is not omission" (snap:1927).
   - **Projects read it as no neighbor.** `{prevId: null, nextId: null}` appends, at 6: the corpus example "TREE-6.2: project both null neighbors append". `projects.test.ts:409` and `:466` assert it too, under TREE-6.2's and TREE-6.7's IDs, though neither case's text names `null`.
   - **Where the wiki stands:** wiki row-references §2 leaves what `null` means to the field's page, and neither wiki positioning §2 nor wiki project-tree §6 says, for a neighbor.
   - **Why it matters:** the two trees disagree, where item and project tree operations are meant to behave alike.
   - **Routing:** to the PO. CF1 covers an unused `nextId`, not a null one, so this is new to the post-migration queue. The behavior is preserved through the migration in the meantime.
2. **`workphaseId: null` on a write that leaves an item Attached: a PO gap,** or a Test Planner one if the PO confirms the reading below.
   - **Where the wiki stands:** wiki item-attachment §2a says such a write "may name the parent's workphase, or none. A write that names any other, a move or a create, is refused". It doesn't say whether naming `null` counts as "none" or as "any other". Nor does it say what happens when the parent itself has no workphase, so that `null` is the parent's.
   - **Today:** with the parent in a workphase, the write is refused with ATT-9.1's message (the corpus example "ATT-9.1: item attached child rejects explicit null workphase").
   - **If the PO reads "none" as "left out"** and "any other" as including `null`, this becomes a clause for the Test Planner to add under ATT-9.1.

## Totals

All 396 cases, by status and priority. This run changes none of them.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 111 | 134 | 64 | 309 |
| Open | 29 | 37 | 13 | 79 |
| Manual | 0 | 2 | 3 | 5 |
| Planned | 0 | 0 | 1 | 1 |
| Pending PO | 0 | 0 | 2 | 2 |
| **Total** | **140** | **173** | **83** | **396** |

By catalog:

| Catalog | Cases | Automated | Open | Manual | Planned | Pending PO |
|---|---|---|---|---|---|---|
| board-drag-interaction | 145 | 65 | 75 | 5 | 0 | 0 |
| item-positioning | 80 | 77 | 2 | 0 | 0 | 1 |
| item-attachment | 75 | 72 | 1 | 0 | 1 | 1 |
| project-tree | 62 | 61 | 1 | 0 | 0 | 0 |
| boards-columns-unsorted | 34 | 34 | 0 | 0 | 0 | 0 |
| item-sheet | 0 | — | — | — | — | — |

If the confirming run moves DRAG-7.27 (P2) to `Open`, `Automated` becomes 308 (P2: 63) and `Open` becomes 80 (P2: 14). In board-drag-interaction, that's 64 `Automated` and 76 `Open`.

# Test Reconciliation — A6 close, item-attachment

**Scope:** `docs/test-plans/item-attachment/`, the 69 ATT- cases, at `57d3ca2` plus the working tree's uncommitted docs (the A6 plan, `docs/test-plans/boards-columns-unsorted/bcu-2-a-column-and-its-range.md`, wiki boards-columns-unsorted). Batch 4 of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`, run 2026-10-22. It's one of five instances split by catalog folder. This one writes statuses and Automation lines only in `item-attachment/`, and runs the whole-repo checks (lost coverage, unknown IDs) for the ATT- prefix. The closing run aggregates the five.

**What changed in the catalog:**
- **Status:** ATT-4.11, `Automated` → `Open` (its tests miss one part of the revised case; see Gaps).
- **Automation lines:** 29 re-mapped after batch 3f split `items.test.ts` and `items.hierarchy.test.ts`. No ATT case lost a test.

Paths below are abbreviated:

| Key | File |
|---|---|
| H | `server/tests/routes/items.hierarchy.test.ts` |
| CP | `server/tests/routes/items.crossProject.test.ts` |
| WP | `server/tests/routes/items.workphase.test.ts` |
| AT | `server/tests/routes/items.attached.test.ts` |
| PO | `server/tests/routes/items.positioning.test.ts` |
| IT | `server/tests/routes/items.test.ts` |
| TR | `server/tests/lib/itemTree.test.ts` |
| UI | `tests/ui/attached-children.spec.ts` |
| ILO | `client/src/components/workflow/itemListOps.test.ts` |
| UB | `client/src/components/UnsortedBucket.test.tsx` |
| DC | `client/src/components/workflow/dragClassification.test.ts` |

## Coverage Mapping

### Test index: every test whose title carries an ATT- ID

| Test | Title |
|---|---|
| H:46 | ATT-4.1, ATT-4.10: rejects a parentId naming no item, and stores nothing |
| H:55 | ATT-2.2, ATT-4.2, ATT-4.3, ATT-4.10: rejects the item itself and its descendants as parents; accepts moving up the tree |
| H:71 | ATT-2.2, ATT-4.4, ATT-4.10: enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not |
| H:86 | ATT-4.5: the cap counts the deepest resulting leaf, through a detached branch |
| H:115 | ATT-1.8: a move or an edit that would leave the flag on a parentless item is refused |
| H:140 | ATT-9.1: rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one |
| H:174 | ATT-3.7, TC-7.10: rejects an anchor outside the resulting scope, committing nothing |
| H:216 | ATT-2.1: attaching A to B writes A; B's own row is untouched, at move and at PUT |
| H:237 | ATT-1.7, ATT-3.6, TC-7.11: attaches with placement: every field and the cascade land in one commit |
| H:256 | ATT-3.1, ATT-3.5, ATT-3.9, ATT-7.5: reparents while attached against the NEW parent's scope, never the old |
| H:278 | ATT-3.4: a reparent whose new position equals the old one is still a real reparent |
| H:303 | ATT-7.5: moving a Stub into another Card as its Stub is one reparent, never a detach |
| H:328 | ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-9.4, TC-2.14, TC-7.13: detaches with placement into the workflow scope, keeping the parent |
| H:355 | ATT-7.6, ATT-8.2: a redundant re-attach to the same parent is not a scope change and keeps its position |
| H:369 | ATT-7.6, ATT-8.1: a detached child re-attached to the parent it still names is a real attach |
| H:390 | ATT-3.10, ATT-3.11: a top-level item reparented without the flag becomes a detached child, and keeps its position |
| H:413 | ATT-3.9: a reparent that omits the flag keeps each child Free or Attached; one that names it lands in that state |
| H:445 | ATT-3.10: a Free reparent keeps its position with no anchor, and takes the anchor it names |
| H:473 | ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position |
| H:488 | ATT-7.7: reparent to root from under a done parent makes it a done Free item |
| H:499 | ATT-7.8: a Free child made top-level keeps its position with no anchor, and takes the anchor it names |
| H:525 | ATT-6.1, ATT-6.2, TC-2.20, TC-7.15: attaching to a done parent inherits the terminal workphase, no completedAt, keeps a position |
| H:546 | ATT-6.3: reopening a done parent makes its Stub not done, writing only the cascaded workphase on it |
| H:559 | ATT-7.4: a detached child moved into a terminal workphase is done like any Free item, and keeps its parent |
| H:582 | ATT-1.12: attaching a done Free item clears its completedAt, under a live parent or a done one |
| H:611 | ATT-3.7, ATT-4.4: a depth-cap rejection leaves the item and its subtree byte-identical |
| H:627 | ATT-4.7: a tree already past the cap loads, and takes every write that reparents nothing |
| H:652 | ATT-4.11: a move that brings an over-cap subtree up, but not within the cap, is refused |
| H:667 | ATT-4.11: the top level is no exception: a subtree too tall for the cap is refused it by move and by PUT, and one that fits is not |
| H:691 | ATT-8.1: each parent or attachment change logs one entry on the moving item, at both entry points, and none on the parents |
| H:731 | ATT-8.1: logs attach, detach, reparent and top-level with the right content, at both entry points |
| H:750 | ATT-8.2: a write that changes neither parent nor attachment logs no hierarchy entry |
| H:774 | ATT-8.3: an item created under a parent records that parent, and whether it's attached, in its own activity |
| H:797 | ATT-8.4: an attach that snaps the workphase logs the status change beside the hierarchy entry, at PUT as at move |
| H:882 | ATT-4.10: PUT enforces the depth cap |
| H:891 | ATT-4.10: POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused |
| H:901 | ATT-4.10: a refused PUT leaves the row unchanged, a refused POST creates nothing, and a legal parent is accepted |
| H:929 | ATT-5.2: PUT cascades projectId to detached descendants on a cross-project reparent |
| CP:29 | ATT-2.2, ATT-3.6, ATT-5.1, ATT-5.2, TC-7.14: cascades projectId to the whole subtree, detached descendants included, and places normally |
| CP:58 | ATT-8.1: records the project change in the hierarchy activity entry |
| CP:95 | ATT-5.9: a cross-workflow reparent that would leave a Free item in the moved subtree is refused |
| CP:134 | ATT-5.10: a cross-workflow reparent that leaves every moved item Attached is accepted |
| CP:201 | ATT-9.8: a move can't leave a Free item in a workphase its project's workflow doesn't use |
| CP:221 | ATT-9.9: a create can't name a workphase its project's workflow doesn't use |
| WP:40 | ATT-9.1: a move that leaves an item Attached cannot name a workphase other than its parent's |
| WP:70 | ATT-9.2: a create that makes an Attached child cannot name a workphase other than its parent's |
| WP:111 | ATT-9.4: a detach that names no workphase leaves the item in the one it was shown in |
| WP:136 | ATT-9.5: a reparent to root of an Attached item that names no workphase leaves it in the one it was shown in |
| WP:154 | ATT-9.6: a detached child created with no workphase takes the one its parent is shown in |
| WP:182 | ATT-9.7: when the nearest Free ancestor has no workphase, a write that leaves an item Free must name one |
| WP:226 | ATT-9.10: a detach that also reparents, naming no workphase, leaves the item in the one it was shown in |
| WP:261 | ATT-9.11: naming workphaseId: null leaves an item Free with no workphase, whatever it was shown in |
| AT:13 | ATT-1.3: moving a parent cascades through attached children and grandchildren |
| AT:49 | ATT-1.4, ATT-1.5, TC-6.5, TC-6.6: an attached child keeps its position when its parent cascades into a terminal workphase |
| AT:75 | ATT-1.5: a Stub reads done under a done parent and not done once it reopens, with only its workphase written |
| AT:95 | ATT-1.6: a detached child keeps its workphase, position and completedAt through every move of its parent |
| AT:120 | ATT-1.3, ATT-1.6: a detached child halts the cascade for its whole branch |
| AT:201 | ATT-4.10: rejects an item becoming its own parent or reparenting to a descendant |
| AT:216 | ATT-4.10: rejects reparenting to a non-existent parentId |
| AT:225 | ATT-5.1: PUT accepts reparenting under a parent in a different project and adopts its projectId |
| AT:279 | ATT-1.14: a create cannot set the flag without a parent, and a parentless create stores it clear |
| AT:322 | ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase |
| PO:238 | ATT-7.2, TC-2.19: detaching reassigns a fresh position scoped to the workflow |
| PO:250 | ATT-7.4, TC-6.3: detaching into a terminal workphase clears position and sets completedAt |
| PO:261 | ATT-3.1, TC-2.21: reparenting while staying attached reassigns a fresh position scoped to the new parent |
| PO:534 | ATT-1.1, TC-2.14: GET returns positionScope = "workflow" for a top-level item in a non-terminal workphase |
| IT:99 | ATT-5.6: inherits projectId from parentId when projectId is omitted |
| IT:150 | ATT-4.10: returns 400 for a non-existent parentId instead of storing an invisible orphan |
| IT:159 | ATT-5.7: rejects creating a child whose projectId differs from its parent, even on one workflow |
| IT:175 | ATT-10.1: a create names its project, its parent, or both, and is refused with neither |
| IT:195 | ATT-10.2: a child is created Attached unless the create clears the flag |
| IT:220 | ATT-10.3: a create may omit the workphase |
| TR:111 | ATT-4.6: a root item is at depth 1 and a leaf has height 0 |
| TR:121 | ATT-4.5: subtree height is the deepest resulting leaf, through a detached branch *(internal, not mapped)* |
| TR:136 | ATT-4.4: exactly CAP is legal, CAP + 1 is not *(internal, not mapped)* |
| DC:77 | ATT-4.5: subtree height counts detached descendants, as classification reads it *(internal, not mapped)* |
| UI:22 | ATT-1.1, ATT-1.9: shows attached children nested under the parent card, and the toggle collapses them |
| UI:44 | ATT-1.2: a detached child renders as its own top-level card, not nested |
| UI:161 | ATT-1.9: the child badge counts only attached children and nesting recurses through grandchildren |
| UI:245 | ATT-9.4: detaching a child via the detail panel keeps it in place when the parent moves |
| UI:313 | ATT-1.7: unchecking Attached in the item's own panel detaches it onto the board |
| UI:344 | ATT-1.7: checking Attached in a detached child's own panel makes it a Stub in its nearest Free ancestor's Card |
| UI:374 | ATT-3.9: reparenting a detached child from its own panel keeps it a Card |
| ILO:399 | describe "ATT-9.3: an attached item shows with its parent, whatever its own workphaseId says", test "is a Stub in its parent's list and a Card in no column" |
| UB:24 | describe "ATT-9.3: an attached item shows with its parent, whatever its own workphaseId says", test "is not listed in Unsorted" |

### Cases

A case marked "re-mapped" had a file on its line that batch 3f moved or split; its old line is in the last column.

| Case | P | Status | Tests | Line before this run |
|---|---|---|---|---|
| ATT-1.1 | P1 | Automated | PO:534, UI:22 | re-mapped: `items.test.ts`, UI |
| ATT-1.2 | P0 | Automated | H:328, UI:44 | — |
| ATT-1.3 | P0 | Automated | AT:13, AT:120 | re-mapped: `items.test.ts` |
| ATT-1.4 | P0 | Automated | AT:49 | re-mapped: `items.test.ts` |
| ATT-1.5 | P1 | Automated | AT:49, AT:75 | re-mapped: `items.test.ts` |
| ATT-1.6 | P0 | Automated | AT:95, AT:120 | re-mapped: `items.test.ts` |
| ATT-1.7 | P0 | Automated | H:237, H:328, UI:313, UI:344 | — |
| ATT-1.8 | P0 | Automated | H:115, H:473 | — |
| ATT-1.9 | P2 | Automated | UI:22, UI:161 | — |
| ATT-1.10 | P2 | Planned | none | — |
| ATT-1.12 | P1 | Automated | H:582 | — |
| ATT-1.14 | P0 | Automated | AT:279 | re-mapped: `items.test.ts` |
| ATT-2.1 | P0 | Automated | H:216 | — |
| ATT-2.2 | P0 | Automated | H:55, H:71, CP:29 (the project cascade is `B`'s, onto `A`'s subtree) | re-mapped: H |
| ATT-3.1 | P0 | Automated | H:256 (with an anchor), PO:261 (append fallback) | re-mapped: H, `items.test.ts` |
| ATT-3.4 | P2 | Automated | H:278 | — |
| ATT-3.5 | P0 | Automated | H:256 | — |
| ATT-3.6 | P0 | Automated | H:237, CP:29 (the cross-project half) | re-mapped: H |
| ATT-3.7 | P0 | Automated | H:174, H:611 | — |
| ATT-3.9 | P0 | Automated | H:256, H:413, UI:374 | — |
| ATT-3.10 | P1 | Automated | H:390, H:445 | — |
| ATT-3.11 | P1 | Automated | H:390 | — |
| ATT-4.1 | P0 | Automated | H:46 | — |
| ATT-4.2 | P0 | Automated | H:55 | — |
| ATT-4.3 | P0 | Automated | H:55 | — |
| ATT-4.4 | P0 | Automated | H:71, H:611 | — |
| ATT-4.5 | P0 | Automated | H:86 | — |
| ATT-4.6 | P1 | Automated | TR:111 (existing internal pointer) | — |
| ATT-4.7 | P1 | Automated | H:627 | — |
| ATT-4.9 | P0 | Open | none | — |
| ATT-4.10 | P0 | Automated | H:46, H:55, H:71, H:882, H:891, H:901, IT:150, AT:201, AT:216 | re-mapped: H, `items.test.ts` |
| ATT-4.11 | P1 | **Open** (was Automated) | H:652, H:667, partial; see Gaps | re-mapped: H |
| ATT-5.1 | P0 | Automated | CP:29 (move), AT:225 (PUT) | re-mapped: H |
| ATT-5.2 | P0 | Automated | CP:29 (move), H:929 (PUT) | re-mapped: H |
| ATT-5.6 | P1 | Automated | IT:99 | — |
| ATT-5.7 | P2 | Automated | IT:159 | — |
| ATT-5.9 | P1 | Automated | CP:95 | re-mapped: H |
| ATT-5.10 | P1 | Automated | CP:134 | re-mapped: H |
| ATT-5.11 | P2 | Pending PO | none | — |
| ATT-6.1 | P0 | Automated | H:525 | — |
| ATT-6.2 | P1 | Automated | H:525 | — |
| ATT-6.3 | P1 | Automated | H:546 | — |
| ATT-7.1 | P0 | Automated | H:328 | — |
| ATT-7.2 | P0 | Automated | H:328 (anchor), PO:238 (append fallback) | re-mapped: H, `items.test.ts` |
| ATT-7.4 | P1 | Automated | H:559 (moved into a terminal workphase), PO:250 (detached in place under a done parent) | re-mapped: H, `items.test.ts` |
| ATT-7.5 | P0 | Automated | H:256, H:303 | — |
| ATT-7.6 | P0 | Automated | H:355, H:369 | — |
| ATT-7.7 | P0 | Automated | H:473 (move), H:488 (terminal), AT:322 (PUT) | re-mapped: H, `items.test.ts` |
| ATT-7.8 | P1 | Automated | H:499 | — |
| ATT-8.1 | P1 | Automated | H:369, H:691, H:731, CP:58 | re-mapped: H |
| ATT-8.2 | P2 | Automated | H:355, H:750 | — |
| ATT-8.3 | P2 | Automated | H:774 | — |
| ATT-8.4 | P2 | Automated | H:797 | — |
| ATT-9.1 | P1 | Automated | WP:40, H:140 | re-mapped: H |
| ATT-9.2 | P2 | Automated | WP:70 | re-mapped: H |
| ATT-9.3 | P1 | Automated | ILO:399, UB:24 (existing internal pointers) | — |
| ATT-9.4 | P0 | Automated | WP:111, H:328, UI:245 | re-mapped: H, UI |
| ATT-9.5 | P1 | Automated | WP:136 | re-mapped: H |
| ATT-9.6 | P1 | Automated | WP:154 | re-mapped: H |
| ATT-9.7 | P1 | Automated | WP:182 | re-mapped: H |
| ATT-9.8 | P1 | Automated | CP:201 | re-mapped: H |
| ATT-9.9 | P2 | Automated | CP:221 | re-mapped: H |
| ATT-9.10 | P2 | Automated | WP:226 | re-mapped: H |
| ATT-9.11 | P2 | Automated | WP:261 | re-mapped: H |
| ATT-9.12 | P2 | Open | none carries the ID; WP:87 covers part (Proposed Stamps) | — |
| ATT-10.1 | P1 | Automated | IT:175 | — |
| ATT-10.2 | P1 | Automated | IT:195 | — |
| ATT-10.3 | P2 | Automated | IT:220 | — |
| ATT-10.4 | P2 | Open | none carries the ID; IT:120 covers part (Proposed Stamps) | — |

Each `Automated` case above was checked against its whole *Then*, with the mapped tests read together. The ones whose text changed since their tests were written (ATT-4.11, ATT-9.12, ATT-10.4) are under Gaps.

## Lost Coverage

None. Every `Automated` ATT case still has at least one test carrying its ID. Batch 3f's server-test splits lost no ATT test: each case's tests are in the file the split table names.

## Unknown IDs

None. Every ATT- ID in a test title anywhere in the repo is a case in the catalog. ATT- IDs also appear in a few code comments, all of them catalog cases: `tests/ui/drag-5-stub-detach.spec.ts:228` (ATT-7.1), `tests/ui/drag-target-classification.spec.ts:52` (ATT-4.5), `client/src/components/workflow/dragRequest.test.ts:205` (ATT-7.1), ILO:397 (ATT-9.3), H:380 (ATT-1.7), H:786 (ATT-8.1) and WP:249 (ATT-9.7).

No ATT case is `Manual`, so there's no Test Planner `Manual` case for a test to carry.

## Proposed Stamps

A developer adds each ID, and a later run confirms it. Neither stamp makes its case `Automated` alone. Each names the part still missing.

- **ATT-9.12 → WP:87, "a create and a move refuse a workphaseId that names no workphase with one message, attached or not".** It runs on the case's setup (`setupShownWithChain`: `R`, `D`, `A`, `X`). It asserts the three creates in full: a top-level item in `P1`, a child attached to `A`, and a detached child of `A`, each refused with a 400 and nothing created. Its one move attaches a new top-level item `F` to `A` and names the missing workphase, and it asserts the 400. **Missing:**
  - a move of `R` naming the missing workphase, which leaves it Free, refused with a 400;
  - a move that leaves `X` attached to `A`. The test's move attaches `F` instead. That reaches the same Attached branch, but ATT-9.1 treats "leaves `X` attached" and "attaches `F`" as separate writes, and this case names `X`'s;
  - "`R` and `X` are unchanged": the test doesn't read the moved row after the refusal.
- **ATT-10.4 → IT:120, "returns 400, not an opaque FK 500, for a projectId, type or agentId that names no row".** It asserts a create naming a missing project and no parent: a 400, the message, and no item created (it counts items before and after). **Missing:** a create naming the missing project **and** `P` as the parent, refused with a 400, with nothing created. The test's `type` and `agentId` rows go beyond the case; Nathan ruled they get no case, and they can stay in the test.

## Proposed Internal Mappings (need approval)

None. Three internal tests carry ATT IDs at the start of their titles but aren't proposed: TR:136 (ATT-4.4), TR:121 (ATT-4.5) and DC:77 (ATT-4.5). The route tests assert each case in full (ATT-4.4: H:71 and H:611; ATT-4.5: H:86). Under the README, no internal test is mapped beside a surface test that covers the whole case. They're listed under Duplication.

The two existing internal pointers stay: TR:111 for ATT-4.6, and ILO:399 and UB:24 for ATT-9.3. No route test carries either case, so neither pointer sits beside a whole surface test.

## Proposed Manual (need approval)

None. ATT-4.9 can be automated. Story 10 already plans its test (`docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, Story 10's list: extend the classification spec to replay each target it classifies against the move endpoint).

## Gaps

- **ATT-4.9 (P0, Open):** the UI and the API agree on every target's legality. No test. It's scheduled in Story 10's list (above).
- **ATT-4.11 (P1, Open, was Automated):** its tests assert all of it but one write.
  - H:652 asserts the first half in full: `M` at depth 3, with height `CAP − 1`, is moved under a root item, refused with "exceeds the cap", and unchanged.
  - H:667 asserts that a subtree of height `CAP` is refused the top level by a move and by a PUT, unchanged after each. It then moves the item of height `CAP − 1` to the top level and asserts that it's accepted, **by a move only**.
  - **Missing:** the accepted top-level write by editing the parent (`PUT /items/:id` with `parentId: null`, `H = CAP − 1`). The revised case says "by a move or by editing its parent" for both outcomes, and the Test Planner's answer says the same ("by either write. It's refused … and accepted …"). H:667's own title claims both writes for both outcomes.
  - A smaller difference that doesn't change what's proven: the case's *Given* puts `M` at depth 3 throughout, and H:667's too-tall item is at depth 2. A top-level move's result is `1 + H` whatever `M`'s depth, so the rule is still tested.
- **ATT-9.12 (P2, Open):** no test carries its ID. WP:87 covers part of it (Proposed Stamps).
- **ATT-10.4 (P2, Open):** no test carries its ID. IT:120 covers part of it (Proposed Stamps).

**Scheduling.** The README requires every `Open` case to be listed in some story's Scope. Nathan's ruling (the plan's Amendments, "Nathan's answers before the Reconciler run") puts ATT-9.12's and ATT-10.4's IDs and missing tests in the Coder's step after this run. ATT-4.11 needs the same step: one more accepted write in H:667, or a test beside it.

ATT-1.10 (`Planned`) and ATT-5.11 (`Pending PO`) aren't gaps.

## Duplication

Reported, not judged:

- **ATT-4.10's refusals at PUT, three times:** AT:201 (self, descendant) and AT:216 (missing parent) make the same refusals as H:901, at the same entry point. H:901 also asserts that the row is unchanged, which the AT pair doesn't. POST with a missing parent is asserted twice, at IT:150 and H:901. (This is the audit's "ATT-4.10 in both `items.test.ts:1364–1402` and `items.hierarchy.test.ts`"; see Test Quality Concerns.)
- **ATT-4.4** at three layers: route (H:71, H:611), server lib (TR:136, which adds the deeper-target variant), and the board's classification indirectly.
- **ATT-4.5** at three layers: route (H:86), server lib (TR:121) and client (DC:77, the board's copy of the formula).
- **ATT-9.1:** WP:40 asserts the whole case, and H:140 asserts its "parent after the write" bullet again.
- **ATT-9.4** at two layers: WP:111 (the whole case), H:328 (a detach under a top-level parent, where the nearest Free ancestor and the root coincide) and UI:245 (the board's side).
- **ATT-5.1 and ATT-5.2:** each is tested once per entry point, a move in CP:29 and a PUT in AT:225 and H:929. They're complementary.
- **ATT-9.12's ground,** besides WP:87: IT:112 ("returns 400 for a non-existent workphaseId rather than an opaque FK 500", a top-level create) and IT:320 ("returns 400 when moving to a non-existent workphaseId", a Free item's move). Neither carries an ID, and neither asserts that nothing changed.
- **ATT-7.1 on the drag surface:** `tests/ui/drag-5-stub-detach.spec.ts:185`, "DRAG-5.1, DRAG-5.10: two pops detach the Stub into its own column — attachment clears, parentId and the inherited workphase are preserved, and it renders as a Card", asserts the preserved parent, with ATT-7.1 only in its comment at `:228`. Story 10's list already routes that stamp. The other stamp that list names, ATT-5.1 on the PUT cross-project test, is done: AT:225 carries it.
- **ATT-9.3 on the board surface:** UI:67, "BCU-5.5: an attached child whose workphaseId goes invalid still renders only nested, never duplicated in Unknown status", proves ATT-9.3's "to none" half at the UI, under BCU-5.5's ID. The "to `W3`" half rests on ILO:399 alone.

## Test Quality Concerns

### The plan's Open questions addressed to the Reconciler

- **Batch 3f's server-test splits** (its server-test note): every ATT Automation line that named a moved or split file is re-mapped (Coverage Mapping, last column), 29 lines in all. No ATT case lost its test: each split moved a case's tests whole, and every ATT ID in a server test title is in the file the split table names.
- **"IDs that moved to the start of a title: ATT-4.4 and ATT-4.5 in `lib/itemTree.test.ts`, and ATT-5.1 in `items.attached.test.ts`":**
  - TR:136 and TR:121 now read as carrying their IDs. They're internal, and the route tests cover both cases in full, so they aren't mapped (Proposed Internal Mappings).
  - AT:225 is a route test, so it counts as it is, and ATT-5.1's line now names `items.attached.test.ts`.
- **"ATT-4.10's cases in both `items.test.ts:1364–1402` and `items.hierarchy.test.ts`":**
  - The `items.test.ts` pair moved to AT:201 and AT:216 with the split. Both assert the rule: a 400, with a message naming the reason.
  - They repeat H:901's PUT refusals, which also check the row is unchanged. That's duplication at one layer and one entry point (Duplication), with no consequence for ATT-4.10's status.
  - Whether to keep the pair is a test-code call, not the catalog's.
- **`routes/items.hierarchy.test.ts:1179–1187`, "asserts half its title":** it's **H:891–899, "ATT-4.10: POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused"**.
  - **How it was found:** the audit's scope lists (`docs/audits/a6-scopes/scope-correctness-S1t.md`) mark lines 1170, 1179 and 1189 of the old file as changed, and they map to the current `it(` lines of H:882, H:891 and H:901 at one offset (288). The three tests keep their spacing exactly (8 lines, a blank, 9 lines, a blank). The old range sits between the cross-project block (645–916, now CP) and the workphase block (1235–1466, now WP), the part of the file that stayed.
  - **The finding no longer holds as stated.** The test body asserts only the refusal: a POST under the chain's last link, at depth `CAP`, is a 400 with "exceeds the cap". But its setup, `createChain(…, ITEM_DEPTH_CAP)`, creates every link through POST and asserts each one exists, so a child created at depth `CAP` is asserted to succeed. H:901 then asserts it explicitly ("A leaf under a parent at depth CAP − 1 lands at exactly CAP": `create('deep enough', …)` is a 201).
  - I can't tell whether `createChain` asserted each link when the audit read the file.
  - ATT-4.10's status isn't affected. If the Coder wants the title's first half visible in the test body, that's a readability change, not a coverage one.
- **The revised ATT-4.11:** now `Open`, one write short (Gaps). The 3a note says the top-level test "runs it through both writes". That's true of the refusal and not of the acceptance, which runs by a move only.
- **ATT-9.12, new:** batch 3d's create-and-move test moved with 3f to WP:87. It's proposed for the ID, and what it misses is listed (Proposed Stamps).
- **ATT-10.4, new:** batch 3d's missing-project test is IT:120. It's proposed for the ID, and what it misses is listed (Proposed Stamps).

### Other observations

- **WP:87 pins more than ATT-9.12 says.** It asserts that every refusal carries the move's exact message (`toBe(moved.body.error)`). Wiki item-attachment §2a doesn't say the writes share a message, and the Test Planner left that out of the case on purpose. If the test takes ATT-9.12's ID, a change that gives one path its own message fails the test without breaking the rule. Low severity: the test is stricter, not wrong.
- **ATT-8.1's tests pin the activity entries' exact wording** (H:691, H:731, H:369, CP:58: `'Parented under "P" (attached)'` and the rest). The case asks only that each entry say what changed and name the parents involved, and H:786's comment says the wording is pinned on purpose. A rewording that still names the parents fails these tests without breaking the rule. That's stricter than the rule, not tautological: each string does carry the parents and the kind of change.
- **ATT-4.6's test (TR:111)** asserts the counting (root depth 1, leaf height 0, and the cap check passing for `L` under `R`). It makes no reparent, and doesn't read `L` at depth 2. The case says the test "pins the counting the formula depends on", and it does, so the pointer stands.
- **ATT-1.1's last sentence,** "Free isn't a state it can leave while it has no parent", is proven for writes by ATT-1.8's and ATT-1.14's tests, which don't carry ATT-1.1. I read it as restating the read-side assertions PO:534 and UI:22 make, and kept the case `Automated`. The read-side extreme is TC-2.17's AT:304: a parentless row that holds the flag still reads `"workflow"`. It could carry ATT-1.1 too, if the Test Planner reads the sentence more strictly.
- **No tautological test found** among the mapped ones. The expected positions (H:237's 1.5, H:473's 41, CP:29's 1.5, PO:238's 3, H:413's 3.0) each follow from the positioning rules the cases cite (a midpoint between true neighbors, max + 1 by the append fallback), and each test sets up neighbors that make them so.

## Uncatalogued Tests

This covers the tests without an ID in the files that hold ATT cases, where they touch item-attachment rules. The un-IDed tests in IT that belong to other features are left to the closing run: comments, PUT fields, notifications, the dependent-row and SET NULL deletes, and the read fields at IT:36. So is UI:122 ("unchecking "Show attached children by default" collapses cards on the next load", a board setting). The cycle tests Nathan ruled on are left as they are.

**For the gate or robustness, with no standalone rule. Listed, not mapped:**
- H:155, "rejects a non-boolean isAttached": request-shape validation, which no wiki page states. Shape checks are the API contract epic's ground.
- WP:170, "a detached child created under a parentId cycle still resolves its workphase, instead of walking forever": robustness over corrupted data (from batch 3d, #23). It's a third cycle test, not one of the two Nathan ruled on. His reason there, that a stored cycle has no wiki rule, applies to it as well.
- UI:282, "the Parent dropdown excludes descendants, and reparenting nests the item under its new parent": the Sheet's parent picker. Wiki item-attachment §7 leaves the Sheet's picker outside the UI/API agreement while the Sheet isn't designed, so there's no case for it.

**On ground an existing case covers.** Each could carry the ID, though none changes a status:
- IT:54, "a detached child created with workphaseId: null has no workphase, whatever its parent holds": ATT-9.11's create half.
- IT:92, "creates a root item given an explicit projectId", and IT:107, "returns 400 when neither projectId nor a resolvable parentId is given": ATT-10.1's first and third bullets.
- IT:112 and IT:320: ATT-9.12's ground (Duplication).
- AT:142, "reattaching snaps to the parent workphase and cascades to own attached descendants": ATT-7.6 by PUT. It asserts the workphase only, not the scope, position or log entry. The cascade to the item's own attached child is ATT-3.6's.
- AT:165, "reparenting an attached item shifts it and its attached descendants to the new parent workphase": ATT-3.9's `Y` half by PUT, plus the cascade.
- AT:261, "a detached child keeps its explicitly passed workphase": ATT-10.2's second half.
- UI:196, "dragging a parent card across columns cascades its attached child": ATT-1.3 on the board surface.
- UI:67 (BCU-5.5): ATT-9.3's "none" half on the board (Duplication).

**Candidate new cases:** see the next section.

## Candidate New Cases

- **Deleting an item deletes its whole subtree, attached and detached (wiki item-attachment §13). A Test Planner gap: the wiki states it, and no case in the catalog derives from §13.**
  - The ATT suites stop at §12 and §14.
  - TREE-9 covers a project's delete, not an item's.
  - The tests already exist: IT:456 ("cascades through a multi-level parent/child/grandchild chain") and IT:470 ("deleting a parent also deletes its detached descendants") through the API.
  - The board's half, "deleting a Card also removes the Cards of its detached descendants, wherever they sit", has only a client unit test: ILO:266, in `describe('removeItemAndDescendants')`, "removes the item and every descendant, attached or detached, at any depth". That's internal and would need approval, or a UI test.
  - This looks like P0 material (data integrity).
- **A Free item reparented across two projects on one workflow may name a workphase of that workflow. A Test Planner gap:** wiki item-attachment §9 (cross-project isn't a disqualifier) and §2a (a Free item's workphase is its project's workflow's).
  - The test is CP:278, "still allows a same-workflow reparent that names a workphaseId, and a re-file into the project's own workflow".
  - It's the accepted counterpart of ATT-9.8 and ATT-5.9, and guards against the cross-workflow refusal firing for sibling projects.
  - ATT-5.1 is an attach only. The Test Planner may prefer to widen ATT-5.1 rather than add a case. P2.
- **A write that changes no hierarchy field leaves an attached child's drifted workphase as it is. A PO gap, if it's wanted at all:**
  - The test is AT:182, "a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged".
  - Wiki item-attachment §2a says only a direct database edit makes an attached item's own `workphaseId` differ from its parent's, and that the board shows it with its parent anyway. It doesn't say whether a later write repairs the row.
  - ATT-4.7 states the matching rule for over-cap data ("nothing … repairs them"). No page states one for a drifted workphase.

## Totals

69 cases, after this run's changes:

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Automated | 29 | 23 | 11 | 63 |
| Open | 1 (ATT-4.9) | 1 (ATT-4.11) | 2 (ATT-9.12, ATT-10.4) | 4 |
| Planned | 0 | 0 | 1 (ATT-1.10) | 1 |
| Pending PO | 0 | 0 | 1 (ATT-5.11) | 1 |
| Manual | 0 | 0 | 0 | 0 |
| **Total** | **30** | **24** | **15** | **69** |

By suite: ATT-1 has 12 cases, ATT-2 2, ATT-3 8, ATT-4 10, ATT-5 7, ATT-6 3, ATT-7 7, ATT-8 4, ATT-9 12 and ATT-10 4.

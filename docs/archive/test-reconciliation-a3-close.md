# Test Reconciliation: A3 batch 6, close-out (proposing run)

**Run:** proposing, over the whole catalog (A3 batch 6, `docs/planning/tech-debt-stories/a3-test-plan-rules-and-sweep.md`, "Batch 6: close-out" and "Acceptance"). This report is the only file written. No case field, test file, wiki page or plan was edited.

**Baselines:** each feature's "Confirming run" section in `test-reconciliation-a3-board-drag-interaction.md`, `test-reconciliation-a3-item-attachment.md` and `test-reconciliation-a3-item-positioning.md`. Nathan's rulings from those runs stand. This run doesn't re-judge whether a case's tests assert all of it, except where a test sits in a file edited after its feature's confirming run.

**In brief:**
- **Lost coverage: none.** All 163 `Automated` cases have a test whose title, or an enclosing `describe`, starts with the case's ID, and every file on each case's Automation test line has such a test. Every case whose tests were edited after its confirming run still holds as that run judged it.
- **Unknown IDs: no test or comment names a deleted case.** The checker's two hits (`placement.ts` lines 88 and 128) are confirmed as DRAG-5.12 and DRAG-5.4. By hand I found one misattributed prefix-less tail in a title (A3's list), one in a comment, and prefix-less tails that name live cases.
- **`Manual` cases carried by a test: none.**
- **No status or Automation test line has to change.** Every edit proposed below is to a title or comment, and none changes the files a case's tests are in. A confirming step would have nothing to write.
- **Candidate new cases: four** for item-positioning, all Test Planner gaps, with two low-priority PO questions inside them.

---

## How to read this report

Line numbers are the files' current ones. Aliases:

| Alias | File |
|---|---|
| bands | `tests/ui/drag-column-bands.spec.ts` |
| classify | `tests/ui/drag-target-classification.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |
| xcol | `tests/ui/item-repositioning-cross-column-dnd.spec.ts` |
| xproj | `tests/ui/item-repositioning-cross-project-dnd.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| itemsUI | `tests/ui/item-positioning.spec.ts` |
| siblingsAPI | `tests/api/itemRepositioningAttachedSiblings.spec.ts` |
| crossColumnAPI | `tests/api/itemRepositioningCrossColumn.spec.ts` |
| crossProjectAPI | `tests/api/itemRepositioningCrossProject.spec.ts` |
| items | `server/tests/routes/items.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| boardsRoute | `server/tests/routes/boards.test.ts` |
| columnsRoute | `server/tests/routes/columns.test.ts` |
| workphasesRoute | `server/tests/routes/workphases.test.ts` |
| resolver | `server/tests/lib/positionResolver.test.ts` |
| itemTree | `server/tests/lib/itemTree.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| popSession, placement, dragRegions, dragBands, dragCollision, descProj, dragClassification, dragRequest, listOps, reconcile | `client/src/components/workflow/<name>.test.ts`, with descProj = `descendantsProjection`, listOps = `itemListOps`, reconcile = `itemWriteReconciliation` |
| hierPlace | `client/src/lib/hierarchyPlacement.test.ts` |

"Carries" means the ID starts the test's title or an enclosing `describe`'s (README form). An ID mid-title or at the end carries nothing.

---

## Coverage Mapping

### How the check ran

1. For each of the 163 `Automated` cases, every test title and `describe` in `tests/`, `server/tests/` and `client/src/` was searched for the ID at the front.
2. Each file on the case's Automation test line was checked for a test carrying the ID.
3. The 8 skipped tests were checked. They're the known ones: zoom ×2 (`tests/ui/drag-card-zoom-in.spec.ts`), xcol "1.a" and "2.a", and xproj "1.a", "2.a", "2.b" and "4.b". None carries an ID, so no case rests on a skipped test.
4. For each case whose ID sits on a test in a file edited after its feature's confirming run, the test's body was re-read against the case as that run judged it (below).

Every case passes steps 1 and 2. The tables list the tests that carry each ID.

### board-drag-interaction: 42 `Automated`

| Automation test line | Case: tests carrying its ID |
|---|---|
| bands | DRAG-1.3: :420, :451 · DRAG-3.1: :240 · DRAG-3.2: :240, :488 · DRAG-3.3: :375 · DRAG-3.4: :420 · DRAG-3.6, 3.7: :594 · DRAG-3.8: :634 · DRAG-3.9: :696 · DRAG-3.10: :724 · DRAG-6.1: :758 · DRAG-6.5: :789 |
| bands, xcol | DRAG-1.23: bands:511, :543; xcol:146 |
| classify | DRAG-2.1, 2.2, 2.3, 2.7: classify:35 |
| boardsRoute, classify | DRAG-2.10: boardsRoute:95; classify:35 |
| detach | DRAG-5.4: :248 · DRAG-5.12: :113 |
| popSession, placement | DRAG-1.4: popSession:176, :190, :198; placement:63 |
| popSession, dragRegions, dragClassification | DRAG-1.7, 1.8: popSession:211; dragRegions:189; dragClassification:37 |
| dragRegions | DRAG-1.10: :141, :149, describe :430 |
| popSession | DRAG-1.11: :349, :356, :372, :392, :404, :440 · DRAG-1.30: :36, :41, :51, :80 · DRAG-3.21: :144, :156 · DRAG-4.19: :184 |
| popSession, dragRegions | DRAG-1.25: popSession describe :106; dragRegions:256, :272 |
| dragBands, popSession | DRAG-3.15: dragBands:50; popSession:156 |
| hierPlace, descProj, dragCollision | DRAG-4.8: hierPlace:53, describe :150, :291; descProj:93; dragCollision:360 |
| hierPlace, descProj | DRAG-4.9: hierPlace describe :177, :181, :185; descProj:142 · DRAG-4.18: hierPlace:300, :318; descProj:100, :148 |
| hierPlace | DRAG-4.10: describe :177, :192, :199 · DRAG-4.11: :163, :167, :171, describe :208, :354, :359 |
| popSession, dragCollision | DRAG-4.23: popSession:206; dragCollision:308 |
| descProj | DRAG-4.29: :129 · DRAG-4.30: :63, :108, :129 |
| popSession, dragRequest | DRAG-5.5: popSession:279; dragRequest:201 |
| placement, listOps | DRAG-6.10: placement:141; listOps:389 |
| placement | DRAG-6.12: :265, :276, :284 · DRAG-6.13: describe :171 |

### item-attachment: 47 `Automated`

The batch 4 report's table has pre-batch-5 line numbers, so these are the current ones.

| Automation test line | Case: tests carrying its ID |
|---|---|
| hier | ATT-1.12: :595 · ATT-2.1: :239 · ATT-2.2: :100, :116, :634 · ATT-3.4: :301 · ATT-3.5: :279 · ATT-3.6: :260, :634 · ATT-3.7: :209, :835 · ATT-3.10: :413, :458 · ATT-4.1: :91 · ATT-4.2, 4.3: :100 · ATT-4.4: :116, :835 · ATT-4.5: :131 · ATT-4.7: :851 · ATT-4.11: :879 · ATT-5.1: :634 · ATT-5.2: :634, :1141 · ATT-5.4: :692 · ATT-5.5: :724, :746 · ATT-6.1, 6.2: :538 · ATT-6.3: :559 · ATT-7.1: :351 · ATT-7.5: :279, :326 · ATT-7.6: :378, :392 · ATT-7.8: :512 · ATT-8.1: :392, :663, :896, :936 · ATT-8.2: :378, :955 · ATT-8.3: :979 · ATT-8.4: :1002 |
| items | ATT-1.3: :1184, :1280 · ATT-1.4: :1214 · ATT-1.5: :1214, :1239 · ATT-1.6: :1257, :1280 · ATT-5.6: :85 |
| hier, items | ATT-3.1: hier:279; items:543 · ATT-4.10: hier:91, :100, :116, :1087, :1096, :1106; items:106, :1349, :1364 · ATT-7.2: hier:351; items:520 · ATT-7.4: hier:572; items:532 · ATT-7.7: hier:486, :501; items:1442 |
| items, attachedUI | ATT-1.1: items:817; attachedUI:12 |
| hier, attachedUI | ATT-1.2: hier:351; attachedUI:40 · ATT-1.7: hier:260, :351; attachedUI:385, :427 · ATT-3.9: hier:279, :413, :426; attachedUI:460 · ATT-7.3: hier:351; attachedUI:298 |
| attachedUI | ATT-1.9: :12, :185 |
| itemTree | ATT-4.6: :75 |

### item-positioning: 74 `Automated`

No test file changed after batch 5's confirming run, and that run's table is current line for line. Grouped by Automation test line:

| Automation test line | Cases |
|---|---|
| items | TC-2.6, 2.12, 2.13, 2.15, 2.17, 2.18, 2.19, 2.21, 2.23, 2.25, 2.31, 3.4, 5.1, 5.4, 5.5, 5.7, 5.8, 5.9, 6.1, 6.2, 6.3, 6.5, 6.6, 6.9, X.1, X.6 |
| hier | TC-5.2, 5.10, 5.11, 5.12, 7.11, 7.13, 7.14, 7.15, 7.17 |
| items, hier | TC-2.14, 2.20, 2.24, 5.13, 5.14, 7.10 |
| items, hier, resolver | TC-2.8 |
| items, resolver | TC-2.7 |
| resolver | TC-2.2, 2.4, 2.9, 5.3, 5.6 |
| items, siblingsAPI | TC-2.1, 2.5 |
| items, crossColumnAPI | TC-2.10 |
| siblingsAPI | TC-3.1, 3.2, 3.5 |
| boardsRoute | TC-1.1, 2.16 |
| columnsRoute | TC-6.7, 6.8 |
| itemsUI | TC-6.4 |
| itemsUI, dragRequest, placement | TC-2.11 |
| itemsUI, reconcile, dragRequest | TC-5a.1 |
| listOps | TC-2.27, 4.1, 5a.5 |
| reconcile | TC-5a.2, 5a.4, 5a.6 |
| crossColumnAPI, reconcile | TC-2.28 |
| listOps, reconcile | TC-2.29, 2.30 |
| items, dragRequest | TC-7.1, 7.2 |
| dragRequest | TC-7.3 |
| crossColumnAPI, dragRequest | TC-7.4 |

### Tests edited after their feature's confirming run

**board-drag-interaction (18 cases).** These IDs sit on tests in files edited after batch 3's confirming run:
- DRAG-1.7, 1.8 on dragClassification:37;
- DRAG-5.5 on dragRequest:201;
- DRAG-6.10 on listOps:389;
- DRAG-2.10 on boardsRoute:95;
- DRAG-1.3, 1.23, 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 6.1 and 6.5 on bands.

Each title and body is as batch 3's table describes it.
- dragClassification changed only in its line 8 comment (ATT-4.8 → DRAG-2.10).
- bands now imports `titlesIn` from `tests/helpers/boardLocators.ts`. That helper reads the Cards' `aria-label`s in render order, the same thing the local copy did, so no assertion changed.
- dragRequest, listOps and boardsRoute gained other cases' tests and stamps. These four tests are untouched.

**item-attachment (45 cases).** Every ATT case except ATT-1.9 (attachedUI only) and ATT-4.6 (itemTree only) sits on a test in items or hier, and batch 5 edited both files. The ATT-bearing tests batch 5 edited:

| Test | ATT cases | Batch 5's edit | Still holds |
|---|---|---|---|
| hier:260 | ATT-1.7, 3.6 | position tightened to `1.5` (TC-7.11) | Yes: parent, flag, inherited workphase, scope, the cascade to `X1`, and siblings untouched are all still asserted |
| hier:279 | ATT-3.1, 3.5, 3.9, 7.5 | deleted TC-7.12 dropped from the title | Yes: the body is unchanged |
| hier:351 | ATT-1.2, 1.7, 7.1, 7.2, 7.3 | position tightened to `10.5` (TC-7.13) | Yes: flag, kept parent, `"workflow"` scope and kept workphase are still asserted |
| hier:538 | ATT-6.1, 6.2 | anchored position tightened to `1.5` (TC-7.15) | Yes, with and without an anchor |
| hier:634 | ATT-2.2, 3.6, 5.1, 5.2 | TC-7.14 stamp, position `1.5` | Yes |
| hier:692, :724 | ATT-5.4, 5.5 | TC-7.17 stamps | Yes |
| items:520 | ATT-7.2 | position tightened to `3`, the "workflow" title fix | Yes: stricter than before |
| items:532, :543, :817, :1214 | ATT-7.4, 3.1, 1.1, 1.4, 1.5 | TC stamps | Yes: bodies unchanged |

Batch 4's disclosed readings (ATT-1.1, 2.1, 4.6, 7.3) are unaffected.

**item-positioning:** no file changed after batch 5's confirming run, so only the ID check applies. All 74 pass.

---

## Lost Coverage

**None.** No `Automated` case lacks a test carrying its ID, and no file on an Automation test line lacks one. No case goes back to `Open`.

---

## Unknown IDs

No test title, `describe` or comment names a deleted case, and the checker's `case-id` rule agrees. The table is the Coder's list for IDs, together with Proposed Stamps. **Required** means Acceptance's checker run needs it.

| # | Where | Today | Becomes | Whose |
|---|---|---|---|---|
| U1 | `client/src/components/workflow/placement.ts:88` (comment) | "(Story 5, §6/§8; TC-12)" | `DRAG-5.12`: a Stub released at its own parent's Card layer is set back down. Only the ID changes; the rest of the comment is A4's | A3, **required** (`bare-case-id`) |
| U2 | `placement.ts:128` (comment) | "Story 5 TC-4's reparent into a *different* Card" | `DRAG-5.4's reparent…`: a Stub zoomed into a different Card becomes its last child. Only the ID changes | A3, **required** (`bare-case-id`) |
| U3 | dragClassification:78 (title) | `…parameterized on cap = %i (DRAG-2.3, 2.6)` | `…parameterized on cap = %i (DRAG-2.3)`. The prefix-less "2.6" names DRAG-2.6 (de-emphasized, not hidden), which a classification test can't assert. The trailing ID carries nothing either way | A3 (close-out list) |
| U4 | classify:83 (comment) | `// DRAG-2.3, 2.6` on the `depth-capped` attribute check | `// DRAG-2.3`: the same misattribution as U3. The attribute is the classification, not the de-emphasis | Optional in A3, else A4 |
| U5 | dragRequest:17 (title) | `…whatever the slot (DRAG-3.1/3.2/3.6)` | `…whatever the slot (DRAG-3.1, DRAG-3.2, DRAG-3.6)`. Prefix-less tails naming live cases, mid-title, so they carry nothing | A3 (found this run; the only such tail in a title) |
| U6 | Comments with prefix-less tails naming live cases: classify:47 "DRAG-2.2/2.5's fixture", :56 "DRAG-2.3/2.7's fixture", :82 "DRAG-2.3, 2.7"; bands:101–102 "DRAG-3.6/3.7 and DRAG-3.8/1.6", :360 "DRAG-3.6/3.7"; listOps:298 "TC-2.27–2.30, DRAG-6.1/6.2"; dragRequest:84 "DRAG-3.1/3.2/3.6/3.7/3.9/3.10"; `dragRequest.ts:22` "(TC-7.1/7.2)" | as quoted | Each tail written in full, for example "DRAG-2.2's and DRAG-2.5's fixture", or "TC-2.27, TC-2.28, TC-2.29, TC-2.30, DRAG-6.1, DRAG-6.2". None is a deleted case, but a search for "DRAG-2.5" misses them | A4, unless the Coder is in the file anyway |
| U7 | dragRequest:261 (comment above the `sendItemMove` describe) | "TC-2.11: extracted from useBoardDnd's handleDragEnd…" | The describe's tests are TC-5a.1's (:280) and DRAG-6.6's (:295). Re-point to those, or drop the ID. Batch 5 flagged it | A4 |

**Not ID-shaped, so nothing to change here:** dragClassification:7's "DRAG-2.n" is a placeholder, and siblingsAPI's header ("A.5 / TC-3.5", "B.6 / TC-3.1", "B.7 / TC-3.2") uses finding numbers from an old audit. The header's provenance, and its wording "TC-2.5 (append fallback, no true predecessor)" (TC-2.5 is the prepend fallback), are A4's.

**After U1 and U2:** `npm run check:docs -- --rules case-id,bare-case-id -- tests server/tests client/src server/src` should report 0. None of U3–U7 is visible to the checker.

---

## Proposed Stamps

These are title edits for the batch 6 Coder, confirmed against the files as they stand. **None changes a case's status or Automation test line.**

| # | Test | Today | Proposed | Why | Field change? |
|---|---|---|---|---|---|
| S1 | hier:413 | `ATT-3.9, ATT-3.10: a Free item can be reparented and stay Free; without an anchor its position is untouched` | `ATT-3.10: a Free item can be reparented and stay Free; without an anchor its position is untouched` | Its `X` is created top-level with the flag clear (line 416), which is ATT-3.11's scenario. ATT-3.9 is whole without it, on hier:279, hier:426 and attachedUI:460. A5 may add `ATT-3.11` once that case is settled | None: hier still carries ATT-3.9 |
| S2 | scopeLib:11, :22, :34 | `…even under a terminal cascade (TC-6.6)`; `…(unsorted, not currently ordered) (TC-2.16)`; `…not attached-siblings (TC-2.17)` | The same titles without the trailing IDs | Trailing IDs in an unapproved internal file count for nothing. Route tests carry all three: items:1214 (TC-6.6), boardsRoute:133 (TC-2.16), items:1424 (TC-2.17) | None: scopeLib is on no pointer |
| S3 | items:577 (describe) | `detached siblings sharing one workphase` | `top-level items sharing one workphase` | `seedABC` (lines 590–596) creates `A`, `B` and `C` as top-level items in one workphase: no parent, nothing detached | None |
| S3a | items:598, :619 (inside S3's describe) | `TC-2.5: C before A — becomes the new true first sibling`; `A after C — becomes the new true last sibling` | `…becomes the new true first item`; `…becomes the new true last item` | The same fixture: these items have no siblings. Their attached-scope twins in siblingsAPI keep "sibling" | None |
| S4 (optional) | items:474 | `TC-2.18, TC-3.4: POST scopes a new attached child to its true siblings, not the whole workphase` | `TC-2.7, TC-2.18, TC-3.4: …` | It asserts a parent's first attached child at `1.0`, TC-2.7's clause "the first attached child of a parent that has none", at the route. Batch 5's judgment call. hier:368 shows the same `1.0` through an attach, but stamping it would add hier to TC-2.7's pointer. items:474 adds nothing | None: TC-2.7's line already lists items |
| S5 (found this run) | items:817 | `ATT-1.1, TC-2.14: GET returns positionScope = "workflow" for a detached item in a non-terminal workphase` | `ATT-1.1, TC-2.14: GET returns positionScope = "workflow" for a top-level item in a non-terminal workphase` | The item has no parent (line 819). ATT-1.1's *Given* is a top-level item and TC-2.14's is a Free one, so both cases stand; only the title is untrue | None |
| — | dragClassification:78, dragRequest:17 | — | Unknown IDs U3 and U5 | — | None |

**Checks for the Coder:** the checker run in Unknown IDs, and `npm run check`. No spec changes unless the Coder takes U4 or U6 in `tests/`, and a comment-only spec edit doesn't need `npm run test:e2e`.

---

## Proposed Internal Mappings (need approval)

**None for A3.** Every A3 case is settled. The question on the batch 5 category's reach into board-drag cases is under Gaps. It concerns routed cases only.

---

## Proposed Manual (need approval)

**None.** No `Open` case turned out harder to automate than its routing assumed.

---

## Gaps

### The 71 `Open` cases stay routed

| Destination | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| Story 10 | 66 DRAG, and ATT-4.9 | 23 | 34 | 10 |
| A5 | DRAG-4.26, 4.28, 4.31 | 0 | 2 | 1 |
| Epic 4 (`epic-4-decisions.md` §12) | TC-5.15 | 0 | 0 | 1 |
| **Total** | 71 | 23 | 36 | 12 |

The Test Planner has confirmed each destination names its cases. This run didn't repeat that check.

### What changed since they were routed (brief item 4)

Only board-drag cases are affected. ATT-4.9 and TC-5.15 have no new test, and A5's three sidebar cases are as batch 3's report left them.

**Tests added or retitled after batch 3's confirming run that cover part of a routed case:**

| Case (P, destination) | Test | What it covers | What's left |
|---|---|---|---|
| DRAG-6.2 (P0, Story 10) | reconcile:238 `TC-2.30: a pending item keeps its position and its place when another item's response re-sorts the list`, **added in batch 5** | Exactly the half bands:758 misses: `X`'s position is unchanged (`4`, not `null`), its placement is kept, and it doesn't move when another item's response re-sorts the list | Nothing, if this test counts for DRAG-6.2: bands:758 asserts the pending marker. DRAG-6.2 would then be whole on a stamp, with no new drag test |
| DRAG-1.24 (P0, Story 10) | dragRequest:32 `same workphase, empty others: any slot is identity — nothing to order against`, **retitled in batch 5** (TC-7.5 and 7.8 dropped) | Paragraph 2, at request level: a card alone in its list, set back down, makes no request. xcol and xproj 3.a/3.b cover paragraph 1 | Whether the release sends a request at the surface |
| DRAG-3.12 (P0, Story 10), DRAG-3.24 (P1, Story 10) | dragRequest:26 `same workphase, slot existing: always identity (middle band member, DRAG-3.12)`, **retitled in batch 5** (TC-7.16 dropped; DRAG-3.12 is mid-title, so it carries nothing) | The "nothing is written" half, at request level, for a merged-column member's middle-band set-down (DRAG-3.12), and for a done column, whose placement is always `'existing'` (DRAG-3.24) | DRAG-3.12's gesture; DRAG-3.24's ghost staying in its slot |

**Pre-existing tests in the same modules,** which batch 3 listed and which haven't changed:
- listOps:104, "draws an item with no completedAt at the end of a done list…": DRAG-6.11's preview half. Not covered: the pending marker, and staying put when the response lands.
- reconcile:146, `DRAG-6.4: …`: the inversion is recorded. Not covered: the panel's log, the console, and surviving a reload.
- dragRequest:317 and :331: DRAG-6.7's resync decision, with staleness mocked (batch 3's Test Quality 10).
- reconcile:172: DRAG-6.9 in part.

**A question for Nathan, for Story 10's planning, not for A3.** At batch 5's Stop 1, he approved a category: a client ordering or request rule whose only surface is a drag, tested in `itemListOps.ts`, `itemWriteReconciliation.ts` and `dragRequest.ts`. He approved it on item-positioning cases, after batch 3 had routed every board-drag UI gap to Story 10.
- Does the category reach board-drag's client rules too? The strongest instance is DRAG-6.2: its re-sort sentence is the rule TC-2.30's re-sort half states, which the category already covers.
- If it does, Story 10 can close DRAG-6.2 with a stamp. It can also cut the rows above down to their surface halves.
- DRAG-6.6 isn't listed: Nathan declined its dragRequest mapping at batch 3's Stop 1, and that ruling stands.

### Gaps closable in A3

**None.** A3's gaps closed in batches 3–5.

---

## Duplication

Reported, not judged. Only what this run noticed; the batch reports' lists stand.
- **The three anchor moves on two scopes.** The S3 describe (items:598, :608, :619) repeats siblingsAPI's three moves with the same values (`0.5`, `1.5`, `4.0`), in the Free scope instead of the attached one. crossColumnAPI "1.a" and "1.b" and crossProjectAPI "1.a" and "1.b" repeat them again. Batch 5 reported the four-layer anchor arithmetic.
- **DRAG-6.2 and TC-2.30.** reconcile:238 now asserts the re-sort half for both catalogs. Batch 5 reported the overlap inside the catalogs.
- **The terminal-range rule, at two write points.** columnsRoute's TC-6.7 tests reject a mixed range on a column write. workphasesRoute:72 rejects the same outcome through an `isTerminal` flip, with no ID (Candidate 2).
- **The attach and reparent cascades at PUT.** items:1299 'reattaching snaps to the parent workphase and cascades to own attached descendants' and items:1319 'reparenting an attached item shifts it and its attached descendants to the new parent workphase' repeat ATT-1.7's and ATT-3.6's cascades at PUT. They carry no ID, and batch 4 reported them.

---

## Test Quality Concerns

Only what this run noticed.
1. **items:577's describe and its tests (S3, S3a)** call top-level items "detached siblings". The values are right; the titles aren't.
2. **items:817 (S5)** calls a top-level item "detached".
3. **hier:279** carries ATT-7.5 but asserts neither the new `parentId` nor the inherited workphase. ATT-7.5 rests on hier:326, which asserts both, as batch 4 judged. No change needed; noted so the stamp isn't read as whole.
4. **siblingsAPI:91 and items:619** show the append fallback from an integer anchor (`3.0` gives `4.0`). That can't tell TC-2.4's rounding (`2.4` gives `3`, not `3.4`) from a plain `+ 1.0`. Neither should carry TC-2.4. resolver:184 remains its test.
5. **The `isTerminal` flip tests (workphasesRoute:102, :130)** assert order with `toBeLessThan` and a non-null `completedAt`. If Candidate 1 becomes a case, its *Then* should pin exact values: the positions after a reopen, and `completedAt` within the write's time window.
6. **classify:83's comment and dragClassification:78's title** claim DRAG-2.6 for a classification check (U3, U4).

---

## Uncatalogued Tests

Grouped by file. MCP tools are a known non-priority. No test imports `server/src/mcp.ts`; `urlPart.test.ts` tests a helper it uses.

### (a) Gate, guard and plumbing tests, with no standalone business rule

**Already listed by batches 3–5, unchanged:**
- the drag modules' implementation tests (batch 3: dragRegions, dragBands, dragCollision, dragOverlay, placement, descProj, hierPlace, tuning, dragRequest, reconcile, popSession);
- hier, items, itemTree and attachedUI's guards (batch 4);
- resolver's coarsest-fit and projects-table tests, scopeLib's lib copies, listOps' plumbing, reconcile's helpers, and items' request-shape tests (batch 5).

**New to this run:**

| File | Tests | Why none maps |
|---|---|---|
| `server/tests/errorHandling.test.ts` | the global error middleware's 500 payload | Error-handling plumbing |
| `server/tests/lib/urlPart.test.ts` | all five | URL escaping for the MCP server's tool calls |
| `client/src/api/shared.test.ts` | all nine | The API client's request and error plumbing |
| items | :20, :147, :190, :1052, :1078 (404s); :72, :93, :98, :164, :195, :202, :646 (request shape); :565 (a range the TC-2.1 tests pin exactly); :698 (a TC-7.10 instance with no re-read of the row); :733, :742 (false-rejection sanity checks); :796 (positionScope batching); :619, the untitled "A after C" (Test Quality 4) | Request-shape validation is the API contract epic's. The rest are guards or duplicates of carried tests |
| workflows | :64 (a bounded depth under a `parentId` cycle); :82 (every item's `positionScope` matches `GET /items/:id`: a consistency guard for TC-2.13–2.15 at another endpoint) | Guards |
| crossColumnAPI, crossProjectAPI | crossColumnAPI "1.a", "1.b", "2.b", "4.a", "4.b"; crossProjectAPI "1.a", "1.b" | Duplicates of the resolver's arithmetic (batch 5). crossProjectAPI's groups 2–4 are Candidate 4 |
| xcol, xproj | xcol "2.b", "4.a", "4.b"; xproj "1.b", "4.a" | Drag versions of the API suites' values (batches 3 and 5) |
| detach, attachedUI | detach:304 (a detached item drags normally at once); attachedUI:232 (a parent's drag cascades to its Stub) | A regression guard, and support for ATT-1.3 (batches 3 and 4) |

**Tests that pin today's answer to a `Pending PO` question.** A5's to check its answers against; batches 4 and 5 listed them for A5:
- TC-2.32: items:258 'an explicit position on a move is respected as-is…', and the items:992 describe 'PATCH /api/items/reorder'.
- TC-6.10: listOps:117 'breaks an exact completedAt tie by createdAt, oldest first'.
- TC-7.18: the `positionScope` assertion inside hier:692.
- ATT-1.13: items:1389 and hier:175.
- ATT-5.7: items:115.
- ATT-5.8: hier:795 and :807.
- ATT-3.11 and ATT-4.12: attachedUI:347; ATT-3.11 also items:1377.
- ATT-1.8: hier:160, :486 and :1134 carry its ID, as batch 4 reported.

### (b) Features with no catalog

Listed by file and feature. No cases are proposed for these.

| Feature | Files |
|---|---|
| Boards, columns and Unsorted (no catalog in A3, per D11) | boardsRoute (all but :95, :103, :133); columnsRoute (all but TC-6.7's and TC-6.8's four tests); workphasesRoute's delete describe, whose column repointing is at :268–:306; `tests/api/boards.spec.ts`, `tests/api/columns.spec.ts`; `tests/ui/boards-layer.spec.ts`; `tests/ui/boards.spec.ts` "board basics"; attachedUI:67 (Unknown status) and :136 (the board's show-attached-children setting) |
| Workflows, templates and workflow inheritance | `server/tests/routes/workflows.test.ts`, `workflowTemplates.test.ts`; workphasesRoute's create, update, reorder and delete tests; `server/tests/lib/workflowItems.test.ts`; `tests/api/workflows.spec.ts`, `workflowTemplates.spec.ts`; `tests/ui/boards.spec.ts`'s "items visibility with inherited workflow", "inherited workflow is read-only", "child project with own workflow" and "workflow creation" describes |
| Projects: CRUD, hierarchy, positioning, the sidebar and the project page | `server/tests/routes/projects.test.ts`, including `PATCH /:id/move`'s anchor tests, which use the shared resolver on the projects table; resolver's projects-table tests; `tests/api/projects.spec.ts`; `tests/ui/project-sidebar.spec.ts`, `project-page.spec.ts`; `client/src/components/sidebar/projectTreeUtils.test.ts`; hierPlace's sidebar tests. The sidebar's placement rules move with A5, alongside DRAG-4.26, 4.28 and 4.31 |
| Items: CRUD, comments, activity, deletion and foreign-key nulling | items: the GET, POST, PUT and DELETE basics; the comments describe; the DELETE cascade (:1091, :1105, :1123), including detached descendants, since no wiki page covers deleting an item; the SET NULL describe (:1458); "logs a Created activity entry" (:138); assignment logging (:175); `tests/api/items.spec.ts`:9 |
| Notifications | items:237 |
| Labels (the provisional tag system) | `server/tests/routes/labels.test.ts` |
| Item types | `server/tests/routes/itemTypes.test.ts` |
| Item panel display helpers | `client/src/components/item-detail/pillUtils.test.ts` |

### (c) Candidate new cases

These are for the three catalogued features: see the next section.

---

## Candidate New Cases

None is added here. None of the three batch reports' earlier candidates is still open: each became a case, a `Pending PO` question, or a decision not to catalog it.

"TP gap" means the rule is in the wiki. "PO gap" means it isn't written anywhere.

| # | Scenario | Tests | Wiki | Gap |
|---|---|---|---|---|
| 1 | **A workphase's terminal flag applies to the items already in it.**<ul><li>Made terminal: its Free items get `completedAt` and lose their positions.</li><li>Made non-terminal: `completedAt` is cleared and they get positions back.</li><li>Attached children are left alone (Candidate 3).</li></ul> | workphasesRoute:102 'backfills items on a non-terminal -> terminal flip…', :130 'backfills items on a terminal -> non-terminal flip…' | wiki item-positioning §6: "a workphase's terminal flag fully determines" the split; `completedAt` is set when an item's effective workphase "transitions to terminal", and cleared when it transitions back | **TP gap**, arguably P1. §6 names the transition, not its cause; if the Test Planner doesn't read a flag change as one, it's a PO gap. **Inside it, a PO gap (low):** both tests pin the order carried across the flip. Position order becomes `completedAt` order, and back again. Nothing states that, or which positions reopened items get: TC-6.9's append fallback is for one reopened item, not a batch |
| 2 | **A terminal-flag change that would leave a column mixing terminal and non-terminal workphases is refused, and nothing changes.** A change that leaves every column pure is accepted | workphasesRoute:72 'rejects a flip that would leave a covering column spanning both…'; :92 'allows a flip with no covering column to conflict' | wiki item-positioning §6, "Column range validation": a column's range "cannot span a terminal and a non-terminal workphase together" | **TP gap**, P1. TC-6.7 names only a column create or edit; this is the same rule reached from the workphase side |
| 3 | **An attached child keeps its position, and gets no `completedAt`, when its parent's workphase is made terminal** | workphasesRoute:160 "does not touch an attached child's position/completedAt when its parent's workphase flips terminal" | wiki item-positioning §6's exception: attached children keep their position under a terminal workphase | **TP gap**, P2. TC-6.5 covers the cascade of a move; its *When* could name the flag change instead of a new case |
| 4 | **A Free item's true neighbor may belong to another project on the same workflow.** Placed after `A` on project 1a's board, `C` lands before project 1b's `B`, which that board doesn't show. An anchor from the other project resolves the same way, and reorders the item among its own project's items | crossProjectAPI "2.a" (:74), "2.b" (:85), "3.a" (:98), "3.b" (:112), "4.a" (:126), "4.b" (:142); xproj "1.b", "4.a", and "3.a"/"3.b", which carry DRAG-1.24 | wiki item-positioning §2: the comparison scope is "every other active item in its whole workflow", and §2's own example of a narrow view is "a subproject board that doesn't load a parent project's full item set". §7.3; wiki item-attachment §9: the scope "never depends on the project" | **TP gap**, P1. TC-2.10 pins a neighbor in another workphase, and TC-2.9 a narrow view, both inside one project. Extending TC-2.10's *Given* would do. **Inside it, a PO gap (low):** all eight crossProjectAPI tests assert a move leaves the item's `projectId` alone, even when anchored against another project's item. §9 says a reparent changes the project; nothing says a plain move never does |

No candidate differs from an existing case only in being made through an MCP tool.

---

## Totals

The catalog as it stands. This run changes nothing, and no case is `Planned`.

### Overall

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 98 | 56 | 9 | 163 |
| `Open` | 23 | 36 | 12 | 71 |
| `Manual` (the Test Planner's) | 0 | 2 | 2 | 4 |
| `Pending PO` (all routed to A5) | 1 | 3 | 7 | 11 |
| `Planned` | 0 | 0 | 0 | 0 |
| **All** | **122** | **97** | **30** | **249** |

### board-drag-interaction

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 27 | 15 | 0 | 42 |
| `Open` (66 Story 10, 3 A5) | 22 | 36 | 11 | 69 |
| `Manual` (DRAG-1.29, 1.32, 4.24, 4.25) | 0 | 2 | 2 | 4 |
| **All** | **49** | **53** | **13** | **115** |

| Suite | `Automated` | `Open` | `Manual` | Total |
|---|---|---|---|---|
| DRAG-1 | 9 | 21 | 2 | 32 |
| DRAG-2 | 5 | 5 | 0 | 10 |
| DRAG-3 | 11 | 11 | 0 | 22 |
| DRAG-4 | 9 | 17 | 2 | 28 |
| DRAG-5 | 3 | 8 | 0 | 11 |
| DRAG-6 | 5 | 7 | 0 | 12 |

### item-attachment

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 27 | 15 | 5 | 47 |
| `Open` (ATT-4.9, Story 10) | 1 | 0 | 0 | 1 |
| `Pending PO` (A5) | 1 | 2 | 5 | 8 |
| **All** | **29** | **17** | **10** | **56** |

| Suite | `Automated` | `Open` | `Pending PO` | Total |
|---|---|---|---|---|
| ATT-1 | 9 | 0 | 3 | 12 |
| ATT-2 | 2 | 0 | 0 | 2 |
| ATT-3 | 7 | 0 | 1 | 8 |
| ATT-4 | 9 | 1 | 2 | 12 |
| ATT-5 | 5 | 0 | 2 | 7 |
| ATT-6 | 3 | 0 | 0 | 3 |
| ATT-7 | 8 | 0 | 0 | 8 |
| ATT-8 | 4 | 0 | 0 | 4 |

### item-positioning

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 44 | 26 | 4 | 74 |
| `Open` (TC-5.15, Epic 4) | 0 | 0 | 1 | 1 |
| `Pending PO` (A5) | 0 | 1 | 2 | 3 |
| **All** | **44** | **27** | **7** | **78** |

| Suite | `Automated` | `Open` | `Pending PO` | Total |
|---|---|---|---|---|
| TC-1 | 1 | 0 | 0 | 1 |
| TC-2 | 28 | 0 | 1 | 29 |
| TC-3 | 4 | 0 | 0 | 4 |
| TC-4 | 1 | 0 | 0 | 1 |
| TC-5 | 14 | 1 | 0 | 15 |
| TC-5a | 5 | 0 | 0 | 5 |
| TC-6 | 9 | 0 | 1 | 10 |
| TC-7 | 10 | 0 | 1 | 11 |
| TC-X | 2 | 0 | 0 | 2 |

---

## Confirming run (2026-09-29)

**Run:** confirming, after batch 6's step 3 (the story plan's "2026-09-29, batch 6 step 3 (Coder)"). The ID checks below are by search. This run had no shell, so the checker, `npm run check` and `npm run test:e2e` weren't rerun; the Coder's results stand for those.

**Fields written, and nothing else in the catalog:**
- **TC-2.33** (`docs/test-plans/item-positioning/part-2-anchor-resolution.md`): status `Open` → `Automated`, in its status line and its suite table. Its Automation test line `—` → `tests/api/itemRepositioningCrossProject.spec.ts`.

### TC-2.33: whole on the six stamped tests

The spec's seed isn't the case's fixture. It has `A` `1.0`, `B` `2.0`, `C` `3.0`, `D` `4.0` and `E` `5.0` in one workphase. `A`, `C` and `E` are in project 1a, and `B` and `D` in 1b. Both projects inherit the root project's workflow, and all five items are top-level, so Free. Each test re-reads the mover by GET.

| The *Then* | Tests (crossProjectAPI) | Exact values |
|---|---|---|
| Placed after `A`, `C` lands before the other project's `B` | "3.a" (:98) | `1.5`, the case's own value, and full order `ACBDE`. A project-limited scope would give `3` |
| The same, mirrored | "3.b" (:112) | `C` before `E` gets `4.5`, after 1b's `D`. A project-limited scope would give `3` |
| An anchor in the other project is accepted, and resolves between it and its own true neighbor | "2.b" (:85) | `C` after 1b's `D` gets `4.5`, before 1a's `E`. This is the case's `{anchorId: B, side: after}`: the anchor's true neighbor is in the mover's project |
| The same with side `before`, and in the other direction | "2.a" (:74), "4.a" (:126), "4.b" (:142) | `1.5`, then `6.0` and `0.5`: the append and the floor, for 1b items anchored on 1a's `E` and `A` |

- **Acceptance shows in the position, not the status.** Each mover starts somewhere else (`C` at `3.0`, `B` at `2.0`, `D` at `4.0`), so a refused move fails its test.
- **Groups 2 and 4 alone can't tell** a workflow-wide scope from a project scope that accepts a foreign anchor: both give the same values. The case's second half has the same property. Group 3 tells them apart, so the six together are whole.
- **They're surface tests,** so no approval is needed.

### Cases whose test titles changed in step 3

All hold, and each case's Automation test line names only files with a test carrying its ID. Each body still asserts what this report's proposing run read in it.

| Case | Tests carrying its ID | Result |
|---|---|---|
| TC-2.5 | items:356, :598; siblingsAPI:60 | Holds. :598 still asserts `0.5` and order `CAB` |
| TC-2.7 | items:126, :324, :474; resolver:267, :276 | Holds. **items:474 now carries a part it didn't before:** "the first attached child of a parent that has none" gets `1.0` at the route, with three Free items already in the workflow. Before, only resolver:267 carried that clause. "Moved in with no position to keep" still rests on resolver:276 alone. items was already on the line |
| TC-2.14 | items:817; hier:351 | Holds: a top-level item, and a detached child |
| TC-2.18 | items:474, :488 | Holds: a number, and `null` |
| TC-3.4 | items:377, :474 | Holds: `3` after `P`'s last child, and `1.0` for a parent with none |
| ATT-1.1 | items:817; attachedUI:12 | Holds |
| ATT-3.10 | hier:413, :458 | Holds. hier:458 is whole alone: its detached child keeps `7.5` with no anchor, and lands between `10.0` and `11.0` with one |
| ATT-3.9 | hier:279, :426; attachedUI:460 | Whole without hier:413. hier:426 has both halves with the case's `X` and `Y`, and all four named combinations. hier:279 has the attached reparent against the new parent's scope, and attachedUI:460 has the Card |
| DRAG-2.3 | classify:35 | Holds. dragClassification:78's "(DRAG-2.3)" is mid-title in an internal file, so it carries nothing, as before. The classify spec changed only in comments |

hier:413's `X` is top-level and the write omits the flag, so it also pins today's answer to ATT-3.11 (`Pending PO`, A5), beside attachedUI:347 and items:1377.

### Checks across the whole catalog

- **Lost coverage: none.** Each of the 164 `Automated` cases has a test whose title, or an enclosing `describe`'s, starts with its ID, in every file on its Automation test line.
- **Unknown IDs: none.** Every case ID in `tests/`, `server/tests/`, `client/src/` and `server/src/` names a live case, which agrees with the Coder's 0 hits. `placement.ts:88` and `:128` now read DRAG-5.12 and DRAG-5.4.
  - **Range tails:** the only range left is listOps:298's "TC-2.27–2.30". All four cases in it are live.
  - **Prefix-less tails:** none is left in a title. U3, U4, U5 and U7 are fixed, and so are U6's lines in `dragRequest.test.ts` (:84) and classify (:47, :56, :82). U6's other comments keep their tails, all naming live cases, and they're A4's by the brief: bands:101–102 and :360, listOps:298, and `dragRequest.ts:22`.
- **`Manual` cases carried by a test: none.** No file names DRAG-1.29, 1.32, 4.24 or 4.25.

### Left as they are

- **TC-6.11 and TC-6.12:** `Open`, with `—`, routed to Epic 4. `epic-4-decisions.md` §12 names both, and `workphases.test.ts` carries no ID, by Nathan's ruling.
- **TC-6.13:** `Pending PO`, routed to A5's D2. Untouched.

### Totals

These match the expected figures exactly: 164 `Automated`, 73 `Open`, 4 `Manual` and 12 `Pending PO`, for 253 cases.

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 98 | 57 | 9 | 164 |
| `Open`: Story 10 | 23 | 34 | 10 | 67 |
| `Open`: A5 (DRAG-4.26, 4.28, 4.31) | 0 | 2 | 1 | 3 |
| `Open`: Epic 4 (TC-5.15, 6.11, 6.12) | 0 | 2 | 1 | 3 |
| `Manual` (the Test Planner's) | 0 | 2 | 2 | 4 |
| `Pending PO` (all routed to A5) | 1 | 3 | 8 | 12 |
| `Planned` | 0 | 0 | 0 | 0 |
| **All** | **122** | **100** | **31** | **253** |

board-drag-interaction (115 cases) and item-attachment (56) are as the tables above give them. item-positioning:

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 44 | 27 | 4 | 75 |
| `Open` (Epic 4) | 0 | 2 | 1 | 3 |
| `Pending PO` (A5) | 0 | 1 | 3 | 4 |
| **All** | **44** | **30** | **8** | **82** |

Two suites changed. TC-2 has 29 `Automated` and 1 `Pending PO`, for 30 cases. TC-6 has 9 `Automated`, 2 `Open` and 2 `Pending PO`, for 13. The other suites are as the table above gives them.

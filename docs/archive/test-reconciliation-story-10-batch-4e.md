# Story 10 batch 4e — Stop 4 reconciliation

**2026-11-15 · Run once at the batch's close, no follow-up yet.** Batch 4e had 12 cases, DRAG-8.1 through DRAG-8.12. 11 are now `Automated`: DRAG-8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.11 and 8.12. Each one's Automation line names `tests/ui/drag-8-carried-branch.spec.ts` only. DRAG-8.10 stays `Open`: its one surface test is `test.skip` (Nathan's deferral, T2), and a skipped test never counts. The coverage report had no finding to act on. I added no stamp and edited no test. Outside the scope, the range touches DRAG-1.27, the Planner's `Manual`, which I left alone, and DRAG-1.33, which stays `Automated` with its line unchanged. No case's text, title, priority or Rule changed.

**Inputs.**
- The plan: `docs/planning/epic-3-5-stories/story-10-batch-4e.md`, its Scope (the Proof list), Results, Open questions and the whole Review log.
- The coverage report: `tests/output/batch4e-stop4-report-catalog.txt`, run on the green run's tree `c9d2e20d…` (`tests/` subtree `36c10d6e…`).
- The green run's record:
  - the final full E2E rerun, `tests/output/batch4e-final-full-e2e-rerun.json`: 493 passed, 29 skipped, 0 failed, 0 flaky;
  - D2's ten repeats of the new spec, `tests/output/batch4e-stop4-d2-repeat10.json`: 110 passed, 0 failed, 0 flaky;
  - the root gate, `tests/output/batch4e-stop4-gate.log`, exit 0.
- The range's diffs, HEAD `06c96313` to the green run's tree: `tests/output/batch4e-stop4-diff-tests.patch` and `tests/output/batch4e-stop4-diff-catalog.patch`.
- Nathan's approvals: none.

**Limits.**
- I have no shell, so I ran nothing. I read the catalog's DRAG-8 suite and DRAG-1.27/1.33, the wiki sections the twelve cases cite (board-drag-interaction §1.1, §4, §4.1, §5a, §7, §7.1–§7.3, §9, §10; hierarchy-placement §4–§8; item-attachment §11, §12), the new spec whole, its four helpers' relevant functions, and the changed Vitest file through the diff.
- I took the spec on disk to be the green run's tree's. It has the same 1105 lines and the same twelve titles at the same offsets as the patch, and the same `test.skip` on DRAG-8.10.
- I changed one catalog file, and only status and Automation fields: `docs/test-plans/board-drag-interaction/drag-8-carried-branch.md`, for the 11 cases, in each one's own line and in the summary table. A fresh `npm run report:catalog` and `npm run check:docs` should show no stale line and no status mismatch.

## Coverage Mapping

Every test below is in `tests/ui/drag-8-carried-branch.spec.ts` and carries only its own case's ID. Line numbers are the file's on disk. The helpers named are the spec's own:
- `expectBranchAbsent` (854–859) reads each branch row's `data-item-id` and every occurrence of its exact title on the page, which takes in the static rows under a modal's backdrop.
- `expectLine` (862–866) reads the carried copy's `data-carried-branch` text, or its absence, and that the ghost row has no line.
- `expectForms` (869–874) reads the overlay's `data-drag-overlay-form`, and the ghost's article role and fixed height.
- `expectEndedAt` (282–301) reads that the overlay and line are gone, the row order, and optionally the row indents, X's relative root, the branch's parents and the pending marker.
- `expectBranchHierarchy` (314–318) reads A and B under X, A1 under A, B1 under B, and A1a under A1 when the list shows every level, from drawn order and indent (`placementShown`).
- `visitQ` (965–976) is pickup, a pop to the column for a Stub, a zoom into Q's section, then a hold that opens Q's modal, with an observation at each.
- `watchWrites` records every non-GET request the page sends.

### Scope cases

| Case (P) | Status | Automation line | Tests and whole-Then reading |
|---|---|---|---|
| DRAG-8.1 (P1) | Open → **Automated** | the spec | "DRAG-8.1: keeps the attached branch absent through every layer switch and restores the list preference" (913–962), four steps: section, modal, expanded Card, collapsed Card.<br>• Given: saved fields through the API, and the branch drawn (or, for the collapsed Card, not drawn) before pickup. The modal origin opens P's modal and reads all five rows in it first.<br>• At pickup, the five rows are absent by ID and by every title occurrence, so from the section, the modal and the backdrop's static rows. Z, W and U stay drawn.<br>• Stub origins: the aim before W moves the placement off the pickup's. X is P's first row, so its own gap offers one state, and any other placement is another gap. Absent again there, after the pop to the column, after the zoom into Q's section and in Q's hold-opened modal.<br>• Card origins: absent after the zoom into Q's section and in Q's modal.<br>• After the cancel, the expanded Card offers "Hide attached children" and the collapsed one "Show attached children". The collapsed one is then opened by hand, and A and B are drawn.<br>Whole Then. |
| DRAG-8.2 (P1) | Open → **Automated** | the spec | "DRAG-8.2: leaves Free-linked rows outside the carried branch with their own tiers and counts" (978–1011), Card and Stub origins, through `visitQ`.<br>• Given: F (Free, of X) with F1 attached, and D (Free, of A) with D1 attached, read through the API and on screen.<br>• At every stage, the five branch rows are absent, and the line reads "+ 2 children, 5 total descendants" exactly, so none of F, F1, D or D1 is counted.<br>• F and D are articles in the Todo column with `data-drop-tier="anchor"` (Mid, wiki §4.1). F1 and D1 are rows inside those Cards with `data-drop-tier="neither"` (Low).<br>• The Stub origin pops, zooms and opens the modal. The Card origin zooms and opens the modal.<br>Whole Then. The painted strengths are DRAG-2.24's, which the case sets aside. |
| DRAG-8.3 (P1) | Open → **Automated** | the spec | "DRAG-8.3: holds the pending tree four-row branch from pickup through both answers" (320–377).<br>• Given: a real drag attaches C into X as its last child, and a real pop detaches B. Both answers are held, both requests reached the server (200), and both rows are marked pending. B is drawn as a Card, and B1 inside it.<br>• X is picked up before either answer lands. At pickup, in Q's section and in Q's modal: A, A1, A1a and C are absent, the line reads "+ 2 children, 4 total descendants", and B and B1 are drawn.<br>• C's answer is released and awaited at pickup, and B's in Q's section. The same checks are repeated after each.<br>• The client's own copy of the saved flags would give X's five-row branch and "5 total". The test reads 4, so the flags awaiting answers don't decide it.<br>• At the end, B's saved parent is still X, unattached.<br>Whole Then. |
| DRAG-8.4 (P1) | Open → **Automated** | the spec | "DRAG-8.4: collapses only the carried branch space and adds one ghost on zoom" (545–610), two steps.<br>• Stub step, with `sectionLevels` 4 so all five rows are drawn. The painted order is X, the five rows, Z. Z's rise is polled to the measured branch extent, from A's top to Z's, which includes the row spacing. Then X and Z are the first two painted rows, the drop line is Z/before, and the placement is `{parentId: null, prevId: null, nextId: Z}`.<br>• A changed depth (before W, tabbed once) names no branch row (Test Quality Concern 1).<br>• Free Card step: the overlay is `short-card`, the ghost is the copy's height, the branch is absent, and Q sits the original gap below the ghost, so there's no branch-sized reservation. On the zoom into Q, Q's rows gain X alone, X's row is U's height, and Q grows by one row pitch.<br>Whole Then. Overflow removal is DRAG-7.27's, as the case says. |
| DRAG-8.5 (P1) | Open → **Automated** | the spec | "DRAG-8.5: restores the branch at Q preview before the drop answer" (632–675).<br>• The zoom into Q previews X as Q's last child, after U.<br>• At release, with the answer held (the request reached the server, 200), X is pending and the overlay and line are gone. Q's section draws U, U1, U2, U2's overflow row, X, A, A1, A1's overflow row, B and B1, with each row's parent and siblings: the section's levels and overflow rows.<br>• X's old Card is gone, and none of the branch is in P.<br>• Q's modal, opened while the answer is still held, draws the whole tree with A1a under A1.<br>• After the answer, the marker clears and the modal draws the same tree. The API reads X under Q, attached and after U, with each branch row's saved parent. There was one write.<br>Whole Then. |
| DRAG-8.6 (P1) | Open → **Automated** | the spec | "DRAG-8.6: cancels to the pickup tree or earlier pending preview without a drag write" (379–436), three steps.<br>• Expanded Card: X is painted below P before pickup, and above P after the hover, so it's in another gap.<br>• Collapsed Card: zooms into Q, another Card.<br>• Pending Stub: a real attach into P is held (`preparePendingX`), and X is then picked up as P's Stub. The aim is polled until the placement equals `{parentId: null, prevId: null, nextId: Z}`, the section's first gap, where the earlier preview is the last.<br>• Each cancel sends no write, and the column's rows are as before.<br>• The Cards offer "Hide" or "Show attached children" as they started, X's Card rows are as before, and the overlay and line are gone.<br>• Pending Stub: row order, every indent, X at P's level, the branch's parents within the shown levels, `data-pending="true"` and the earlier placement are all as captured.<br>Whole Then. R-8.6's fix is confirmed (Review Log Answers). |
| DRAG-8.7 (P1) | Open → **Automated** | the spec | "DRAG-8.7: restores the reloaded branch under Q when a resync stops the drag" (189–252), three steps: expanded section, open modal, collapsed section.<br>• A failed drop of Y is held (`holdForcedStopCause`). X is picked up in P's section, and in the modal step it is carried into Q's hold-opened modal.<br>• While X is carried, the server moves X under Q and adds attached leaf C under X. C isn't drawn.<br>• On the resync, the overlay and line are gone with the pointer still down, and the release sends no write.<br>• Collapsed: Q still offers "Show attached children", X isn't drawn and no modal is open, until the test opens Q's section by hand. Expanded and collapsed: no modal opened, X and C are drawn in Q's section, and A1's overflow row is drawn.<br>• Q's modal, left open in the modal step and opened by a click in the others, draws U…U3, X, the five rows and C. X is after U at Q's first level, C is X's last child after B, and the whole branch's parents hold.<br>• None of X, its branch or C is in P.<br>Whole Then. |
| DRAG-8.8 (P1) | Open → **Automated** | the spec | "DRAG-8.8: reads every attached count including hidden levels on the carried copy" (1013–1069).<br>• The table: one seeded board per origin with all six trees, 12 steps. Each reads X's saved parent and attachment, and each branch row attached under its parent, before the pickup. The `free-only` tree's F and F1 are drawn. The Card is picked up by its title, the Stub by its row button. `expectLine` reads "+ 1 child", "+ 2 children", "+ 1 child, 2 total descendants", "+ 2 children, 5 total descendants", and no line for `none` and `free-only`.<br>• The chain: X with `sectionLevels + 1` attached descendants, the last not drawn in P's section. "+ 1 child, Y total descendants", with Y read from the returned tuning, at pickup, in the column, in Q's section and after Q's modal opens. The exact text excludes X.<br>Whole Then. |
| DRAG-8.9 (P1) | Open → **Automated** | the spec | "DRAG-8.9: keeps the same count line on the carried copy through every form switch" (1071–1105), three origins. The Free Card starts in an expanded sub-row.<br>• At every stage `expectLine` reads "+ 2 children, 5 total descendants" on the copy and no line on the ghost, and `expectForms` reads the copy's form and the ghost's.<br>• Card: shortCard at pickup; Stub in Q's section and Q's modal; shortCard after the pop out to the sub-row and at Board; Stub on the zoom back into Q.<br>• Section and modal Stubs: Stub at pickup; shortCard after the pop to the column; Stub in Q's section and modal; shortCard out again; Stub on re-entry.<br>No tilt assertion, as the case sends it to DRAG-1.27. Whole Then. |
| DRAG-8.10 (P1) | **Open** (unchanged) | — | Its one surface test, "DRAG-8.10: leaves the drag box unchanged and lets the pointer reach beneath the count line" (67–187), is `test.skip` (T2, Nathan, 2026-11-15). The internal carriers prove structural parts only (Gaps). |
| DRAG-8.11 (P1) | Open → **Automated** | the spec | "DRAG-8.11: sets the branch down at its pickup gap without a new write" (438–480): an ordinary section pickup, and an earlier pending preview in P's modal.<br>• Before pickup: row order, indents, X at P's level and the branch's parents.<br>• The aim moves the placement off the pickup's, and the return is polled back to it before the release.<br>• No write, and `expectEndedAt` with indents: the overlay and line are gone, and the order, indents, X's level and branch parents are back. That's every level in the modal.<br>• Ordinary: X's saved parent and position are unchanged. Pending: `data-pending="true"`, at the earlier preview's rows, not X's older saved Card.<br>Whole Then. |
| DRAG-8.12 (P1) | Open → **Automated** | the spec | "DRAG-8.12: rejects an over-cap set-down and restores the pickup branch" (501–543): an ordinary section pickup, and an earlier pending pickup in P's modal.<br>• `deepenP` puts P where the branch's deepest row sits at `itemDepthCap`, read from the board.<br>• Aiming before W1, tabbed twice, gives `data-placement-valid="false"`, and P's depth plus X's drawn depth plus the branch's height is past the cap.<br>• The release sends no write, and `expectEndedAt` with indents restores the order, indents, X's level and branch parents, within the section's levels or at every level in the modal. The invalid preview holds none of the branch.<br>• Ordinary: parent, attachment and position are unchanged. Pending: the marker is kept.<br>Whole Then. |

### Other cases the range touches

| Case (P) | Status | Why in scope | Reading |
|---|---|---|---|
| DRAG-1.27 (P2) | Manual (unchanged) | Its text changed: the count line turning with the tilt joined its manual check | The Planner set it, so I left it alone. No running test carries it. |
| DRAG-1.33 (P2) | Automated (unchanged) | A changed test carries it: `client/src/components/KanbanCard.test.tsx`'s `describe('a zoomed Card retaining its expansion after attachment')` | The diff wraps `twoCards` in the new `BoardStore` and changes no assertion or title. The Test Reviewer accepted it with no regression. The three tests are internal inventory with no mapping (batch 4a's E116 to E118). The Automation line names `tests/ui/drag-layer-transitions.spec.ts` and `tests/ui/drag-card-forms.spec.ts`. Neither file nor the Then changed in the range, and both carry the ID in the green run's map, so the line stays. |

## Coverage Report Findings

| Finding | Report | What I did |
|---|---|---|
| Lost coverage | none | Nothing. No `Automated` case lost its carrier in the range. |
| `Manual` cases a running test carries | none | Nothing. |
| Stale Automation lines | none | Nothing. The 11 new lines name a file whose running tests carry each ID (the map's DRAG-8 rows). DRAG-8.10's line stays `—`, so its skipped carrier makes no stale line. |
| Two statuses for one case | none | Nothing. I changed each case's own line and its table row together. |
| Catalog fields not read | none | Nothing. |

## Stamps Added

None. All twelve tests in the spec carry their own `DRAG-8.<n>:` prefix, and I found no new coverage in a test without the ID. I removed no ID.

## Review Log Answers

Each verdict is confirmed from the tests on disk.

**Desk, Stop 1 (2026-11-13).**

| Verdict | At the close |
|---|---|
| DRAG-8.3 r1, follows | Resolved. The test holds both real answers, reads the four rows and "+ 2 children, 4 total descendants" with B and B1 drawn, and repeats after each answer and at each layer (320–377). |
| DRAG-8.3 r2, ruled out | Resolved: no order matrix. Deferred to Drag Automation Deferrals, where it's recorded. |
| DRAG-8.7 r1, follows | Resolved. C is added under X while X is carried, and the six reloaded descendants are read under Q (216–243). |
| DRAG-8.7 r2, ruled out | Resolved: one cause, `failed-item-drop`. The variant is recorded in Drag Automation Deferrals. |
| DRAG-8.7 r3, follows | Resolved. All three display states, with the collapsed one opened by hand only after its no-reveal checks (195, 225–237). |
| DRAG-8.9 r1, follows | Resolved. The Free Card journey runs through an expanded sub-row, then Board and back into Q, with no second plain-column journey (1079, 1090–1101). |
| DRAG-8.9 r2, follows | Resolved. The section and modal Stubs start with the line, pop to the column and return. No tilt assertion. |
| DRAG-8.10 r1, follows; r2, contradicts | Still open, with the case. The skipped test covers section, column and sub-row, and both bottom bounds. It doesn't count while skipped. |
| DRAG-8.11 r1, follows | Resolved. The pending witness compares the captured preview's rows, indents and marker. Only the ordinary one reads the saved P and p (449–474). |
| DRAG-8.6 r1, follows | Resolved. Expanded Card at another gap, collapsed Card in another Card, and the pending Stub at a changed gap (385–414). |
| DRAG-8.12 r1, follows | Resolved. An ordinary section pickup and an earlier pending modal pickup (507–537). |
| DRAG-8.4 r1, needs a session | Resolved by P1. The Planner moved the overflow sentence out of DRAG-8.4's Then, which voids the answer. The test has no reduced-level witness. |

**Desk, Stop 2 (2026-11-13).**

| Verdict | At the close |
|---|---|
| DRAG-8.12 r1, follows; r2, not stated | Resolved. The test reads the observed depth against `itemDepthCap` (527) and names no W1 parent. |
| DRAG-8.10 r1, follows; r2, not stated | Still open, with the case. The skipped test compares limiting endpoints (149–151, 175–181) with no outer-group edge. |

**Test Reviewer, first full pass (tree `c814afbc…`).**

| Verdict | At the close |
|---|---|
| DRAG-8.1, test gap: the change of gaps | Resolved by the second confirming pass. The poll moves the placement off the pickup's, in a one-state first gap (937–940). |
| DRAG-8.2, test gap: Cards in their column, Stubs in their Cards | Resolved by the first confirming pass. `article(column(page, 'Todo'), …)` and `itemRow(card, …)` (1000–1004). |
| DRAG-8.3, proves the case | Confirmed. |
| DRAG-8.4, test gap: depth choices exclude the subtree | Resolved by the first confirming pass (573–578). Test Quality Concern 1 says which assertion carries the clause. |
| DRAG-8.5, proves the case | Confirmed. |
| DRAG-8.6, test gap A: a different gap or another Card, before the cancel | Expanded Card resolved by the second confirming pass (412–413). The pending-Stub half was left open there. It's resolved by R-8.6's fix, which had no review and which I confirm: the poll waits for `{parentId: null, prevId: null, nextId: Z}` (406–409), the section's first gap, which offers one state, where the earlier preview is the last gap, after W. That's the form the reviewer named. |
| DRAG-8.6, test gap B: the pending preview's depth and branch | Resolved by the second confirming pass (395–396, 419–420). |
| DRAG-8.7, test gap: the whole reloaded tree | Resolved by the second confirming pass (243). |
| DRAG-8.8, proves the case | Confirmed after the Simplify (the further confirming pass). |
| DRAG-8.9, test gap: the ghost's form | Resolved by the first confirming pass (`expectForms`, 869–874). |
| DRAG-8.10, test gap: shortCard's fixed height | Resolved in the test by the first confirming pass (101). The case stays `Open`, since the test is skipped. |
| DRAG-8.11, test gap: restored depth and branch | Resolved by the first confirming pass (455–458, 468). |
| DRAG-8.12, test gap: restored depth and branch | Resolved by the first confirming pass (519–521, 530). |
| Corrections 1 to 7, accepted | Confirmed. Each changes an aim, a cleanup or the observation route, and no assertion of a Then clause is gone in the current file. |
| Cost verdicts: Keep × 11, Simplify for DRAG-8.8 | Resolved. Nathan approved the Keeps, and the Simplify is applied (1027–1057). |
| Proposed mappings, held-off cases, deferred | None, and none now. |

**Test Reviewer, later passes.**

| Pass | At the close |
|---|---|
| DRAG-1.33's Vitest setup change, accepted | Confirmed from the diff: only the `BoardStore` wrapper changed. |
| Second confirming pass (tree `04f93ab6…`) | Gaps 1, 3 and 4 confirmed closed. Gap 2's pending-Stub half is closed by R-8.6, above. |
| Further confirming pass (tree `4a8c720c…`) | Confirmed. DRAG-8.10's third correction reads Done's `single` band (165), and DRAG-8.8 still proves its case. |

**Declined mappings:** none recorded.

## Proposed Internal Mappings (need approval)

None. A surface test covers each of the 11 cases whole, so no internal test is proposed beside it. DRAG-8.10's internal carriers can't make it whole (Gaps).

## Proposed Manual (need approval)

None. DRAG-8.10 doesn't look hard to automate. Its section and column setups passed for both shapes, and what stopped it is a 2 px tolerance the test chose at the sub-row's bottom edge. Drag Automation Deferrals records a one-edit option for it.

## Gaps

- **DRAG-8.10 (P1), `Open`, routed to Drag Automation Deferrals** ("DRAG-8.10, skipped and deferred").
  - **The surface carrier is skipped:** "DRAG-8.10: leaves the drag box unchanged and lets the pointer reach beneath the count line", in the spec.
  - **What the internal carriers show:**
    - `client/src/components/dragChrome.test.tsx`, "DRAG-3.25, DRAG-8.10: reads its branch’s wording, takes no pointer, and hangs out of the flow under the box it is in";
    - `client/src/components/KanbanCard.test.tsx`, "DRAG-3.25, DRAG-8.10: keeps its shortCard form’s one height, with the line hung outside its flow and its root unclipped";
    - the same file's "DRAG-3.25, DRAG-8.10: hangs outside the flow of its Stub form’s box, and moves with the box through the depths".

    All three are structural: a line out of the box's flow with no pointer events, on a supplied copy.
  - **What nothing running shows:**
    - measured copy and ghost heights in both forms, with and without a branch;
    - equal band reservations, side-highlight neighbor and bound for equal pointer and list geometry;
    - the line covering the row below in a section, and the next Card's top and the gap above it in a column and a sub-row;
    - rows and gaps beneath the line staying reachable;
    - the line hanging past a section's and a sub-row's bottom edge without moving the box.
  - The one-row line height is a separate entry in the same story, and not in this case.

No other case in the scope has a gap.

## Duplication

Reported, not judged. The internal tests below carry the case IDs in their titles. The baseline reconciliation treated them as approved within their asserted scope (structural parts). They aren't on the Automation lines, since the surface test covers each case whole, and their stamps stay.

| Case | Internal tests carrying the ID beside the spec |
|---|---|
| DRAG-8.1 | `client/src/components/KanbanCard.test.tsx`: "DRAG-8.1, DRAG-8.5, DRAG-8.6: draws none of the branch of a carried %s, and every other row where it was", "… draws none of it in the static rows under the hierarchy modal’s backdrop either", "… draws it again once the drag is over". `client/src/components/workflow/descendantsSection.test.ts`: the three "DRAG-4.8, DRAG-7.27, DRAG-8.1: …". `client/src/components/workflow/useBoardDnd.test.ts`: the three "DRAG-8.1, DRAG-8.2, DRAG-8.8: holds …". `client/src/components/HierarchyModal.test.tsx`: "DRAG-7.15, DRAG-8.1: rests the cursor on the row of the ghost’s gap, with the carried item’s branch out of the rows, and reports the gap and depth there". |
| DRAG-8.2 | `descendantsSection.test.ts`: the four "DRAG-8.2, DRAG-8.3, DRAG-8.8: …". `useBoardDnd.test.ts`: the three "DRAG-8.1, DRAG-8.2, DRAG-8.8: …". |
| DRAG-8.3 | `descendantsSection.test.ts`: the four "DRAG-8.2, DRAG-8.3, DRAG-8.8: …", including "… holds a row where the board draws it: a pending attach joins the branch, and a pending detach leaves it". |
| DRAG-8.5, DRAG-8.6 | `KanbanCard.test.tsx`: the three "DRAG-8.1, DRAG-8.5, DRAG-8.6: …". |
| DRAG-8.8 | `KanbanCard.test.tsx`: the three "DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: …". `client/src/components/dragChrome.test.tsx`: the three "DRAG-8.8, TREE-2.9: says …". `descendantsSection.test.ts`: four. `useBoardDnd.test.ts`: three. `client/src/lib/hierarchyPlacement.test.ts`: the four "DRAG-8.8, TREE-2.9: …". |
| DRAG-8.9 | `KanbanCard.test.tsx`: the three "DRAG-3.19, DRAG-3.22, DRAG-8.8, DRAG-8.9: …". |

**Across cases, at the surface:**
- **The Card list's preference after a drag** is asserted by DRAG-8.1's and DRAG-8.6's Card steps and by DRAG-1.33's carriers: `tests/ui/drag-card-forms.spec.ts` "DRAG-1.33, DRAG-3.19: release restores the carried branch's collapsed preference from Board | Column", and `tests/ui/drag-layer-transitions.spec.ts` "DRAG-1.33: C stays collapsed and E expanded through pops; …".
- **The pending-preview restoration** runs in DRAG-8.6, 8.11 and 8.12 through the same `preparePendingX` setup, one ending each.
- **Branch absence** is read in every DRAG-8 test as part of its own Given.

## Test Quality Concerns

1. **DRAG-8.4's changed-depth check can't fail for the reason its clause names. Deferred.** In "DRAG-8.4: collapses only the carried branch space and adds one ghost on zoom", lines 573–578 aim before W, tab once, and assert the chosen parent and siblings aren't X or a branch row. In the gap above W, Top is Z and Bottom is W, whether or not the hidden branch is excluded. So that `not.toContain` passes the same with the defect the clause guards against (wiki hierarchy-placement §4; §8, "Placement doesn't change").
   - **Why I still count the case covered:** the pickup-gap assertions carry the clause. They are the drop line Z/before and the placement `{parentId: null, prevId: null, nextId: Z}` (566–572). They read the gap where a branch left as a candidate would sit, between X and Z, as Bottom or as a deeper state.
   - **Destination:** Drag Automation Deferrals, if Nathan wants the sample replaced (for example, a tab right at X's own gap). Otherwise none.

No other concern. The DRAG-8.10 test's tolerance is already recorded in its deferral entry.

## Uncatalogued Tests

- **For the coverage gate only:** none in the range.
- **A genuine scenario the catalog misses:** `client/src/components/KanbanCard.test.tsx`, `describe('a Card’s list of Stubs, as the user set it')`, added with the Coder's D1/D2 fix, carrying no ID:
  - "stays %s when the Card is drawn again as a new instance" (open and closed);
  - "starts a list the user has not set from the setting the Card is given";
  - "is left as it is by a change of the setting, once the user has set it".

  This is Candidate 1 below. They're component tests, so even once a case exists, a mapping onto them needs Nathan's approval.

## Candidate New Cases

1. **A Card's list of Stubs stays as the user set it after a move to another column or sub-row, and through a reload no drag caused. An unset list starts from "Show attached children by default" from the board's next load, and a change of that setting leaves a set list alone.**
   - **The rule is in the wiki,** so this is a Test Planner gap: item-attachment §12, with pointers from board-drag-interaction §1.1 and §10. DRAG-8.1, 8.6, 8.7 and DRAG-1.33 cover it only within a drag and its forced stop.
   - **The PO has already recommended one case** for a Planner session to place (the plan's D1/D2 ruling).
   - **The Planned marker:** §12's passage still carries `**Planned:**`, though the build it waited for landed in this batch. The PO said they would clear it once the build landed, so until then a case written from it is `Planned`.
   - **Destination, deferred by default:** Drag Automation Deferrals, if the Planner places it in a board-drag-interaction suite; otherwise `docs/planning/mvp-deferrals.md`'s "Findings with no story yet" (the same, outside the drag suites). Nathan may pull it forward.
   - **For whoever grooms Drag Automation Deferrals:** this ruling answers the question three of its entries still ask, whether a section collapsed by hand stays collapsed across a reload. They are 4j's "A possible Product Owner gap", Batch 4d Stop 5 item 2, and the "Noted, no question" line under Batch 4d Stop 2.

## Totals

The coverage report's totals, with my 11 changes applied: DRAG-8.1–8.9, 8.11 and 8.12, all P1, `Open` → `Automated`.

| Priority | Automated | Open | Manual | Planned | Pending PO | Total |
| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |
| P0       |       139 |    8 |      0 |       1 |          0 |   148 |
| P1       |       202 |   41 |      6 |       0 |          0 |   249 |
| P2       |        72 |   11 |      4 |       1 |          2 |    90 |
| Total    |       413 |   60 |     10 |       2 |          2 |   487 |

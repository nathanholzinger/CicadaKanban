# Test Reconciliation: A6 close, confirming re-check

**Scope:** the confirming re-check that closes A6's Reconciler work (batch 4 of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`), run 2026-10-23 on the working tree at `4b99868`. It follows the full run of 2026-10-22, whose five reports are `docs/audits/test-reconciliation-a6-<folder>.md`, and the Coder's step after that run (batches 4a–4e, `77b1f8d..4b99868`). Per `.claude/guides/story-done-checklist.md` step 5, it covers:
- **the cases the step touched,** each checked against its whole *Then*: ATT-4.11, 5.12, 9.12, 10.4, 11.1, 11.2; BCU-2.9, 2.8, 1.2, 2.3; TREE-3.9, 9.1, 1.11; TC-2.4, 2.8, 2.9, 2.23, 2.25, 2.28, 2.30, 5.1, 5.4; DRAG-6.1, 6.2, 6.6, 6.11, 4.12, 1.14, 2.9, 3.5, 1.24, 3.11, 3.23, 3.24, 6.7, 6.9, 4.1, 5.4, 3.12;
- **sweep 1:** lost coverage on every Automation line that names a file the step changed;
- **sweep 2:** unknown IDs in every test title in the repo, whatever the prefix.

Every other case keeps the judgment of its folder's full-run report.

**Inputs read:** batch 4 and the Coder's notes "batch 4a" to "batch 4e" in the plan, with their Amendments; the five full-run reports; every suite file holding a case in scope; the wiki sections those cases cite, through the cases' *Then*; and every test that carries one of their IDs. This run had no shell, so no gate or test suite was run. The Coder's 4e results (`npm run check` and `npm run test:e2e` green) stand.

**Nathan's approvals used (2026-10-23):** DRAG-2.9's, DRAG-3.5's and DRAG-1.14's internal tests are written onto their lines. DRAG-6.6's request-half test (`dragRequest.test.ts`) was approved but isn't written, because the new E2E test covers the whole case (Proposed Internal Mappings).

**In brief:**
- **20 cases move from `Open` to `Automated`:** ATT-4.11, 5.12, 9.12, 10.4, 11.1, 11.2; BCU-2.9; DRAG-6.1, 6.2, 6.6, 6.11, 4.12, 1.14, 2.9, 3.5.
- **4 Automation lines change with no status change:** TC-2.4, TC-2.8 (drops `positionResolver.test.ts`), TC-2.9, TC-2.23.
- **Every case the step meant to close is closed.**
- **The six request-half cases stay `Open` for Story 10,** as planned: DRAG-1.24, 3.11, 3.23, 3.24, 6.7 and 6.9. DRAG-4.1 and 3.12, whose titles changed, stay `Open` too. Gaps says what each still misses.
- **Lost coverage: none. Unknown IDs: none,** with any prefix.
- **Needs Nathan:** nothing that blocks a status. There's one optional proposal: dropping two existing internal pointers that now sit beside whole surface tests.

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
| columns | `server/tests/routes/columns.test.ts` |
| projects | `server/tests/routes/projects.test.ts` |
| resolver | `server/tests/lib/positionResolver.test.ts` |
| xcolAPI | `tests/api/itemRepositioningCrossColumn.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| bands | `tests/ui/drag-column-bands.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |
| treeDrag | `tests/ui/project-tree-drag.spec.ts` |
| hook | `client/src/components/sidebar/useProjectDragReorder.test.ts` |
| reconcile, listOps, dragRequest, popSession, dragBands, dragClassification, placement | `client/src/components/workflow/<name>.test.ts` (`reconcile` is `itemWriteReconciliation.test.ts`, `listOps` is `itemListOps.test.ts`) |

Line numbers are the files' at `4b99868`.

---

## Coverage Mapping

### Fields written

| Case | P | Status | Automation test line |
|---|---|---|---|
| ATT-4.11 | P1 | `Open` → `Automated` | `—` → `server/tests/routes/items.hierarchy.test.ts` |
| ATT-5.12 | P2 | `Open` → `Automated` | `—` → `server/tests/routes/items.crossProject.test.ts` |
| ATT-9.12 | P2 | `Open` → `Automated` | `—` → `server/tests/routes/items.workphase.test.ts` |
| ATT-10.4 | P2 | `Open` → `Automated` | `—` → `server/tests/routes/items.test.ts` |
| ATT-11.1 | P0 | `Open` → `Automated` | `—` → `server/tests/routes/items.test.ts` |
| ATT-11.2 | P1 | `Open` → `Automated` | `—` → `tests/ui/attached-children.spec.ts` |
| BCU-2.9 | P2 | `Open` → `Automated` | `—` → `server/tests/routes/columns.test.ts` |
| TC-2.4 | P0 | `Automated` | adds `server/tests/routes/items.positioning.test.ts` before `server/tests/lib/positionResolver.test.ts` |
| TC-2.8 | P1 | `Automated` | drops `server/tests/lib/positionResolver.test.ts`; keeps PO and H |
| TC-2.9 | P0 | `Automated` | adds `tests/api/itemRepositioningCrossColumn.spec.ts` before `server/tests/lib/positionResolver.test.ts` |
| TC-2.23 | P1 | `Automated` | adds `server/tests/routes/items.hierarchy.test.ts` after PO |
| DRAG-6.1 | P0 | `Open` → `Automated` | `—` → `tests/ui/drag-column-bands.spec.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| DRAG-6.2 | P0 | `Open` → `Automated` | `—` → `tests/ui/drag-column-bands.spec.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| DRAG-6.6 | P0 | `Open` → `Automated` | `—` → `tests/ui/drag-column-bands.spec.ts` |
| DRAG-6.11 | P1 | `Open` → `Automated` | `—` → `client/src/components/workflow/itemListOps.test.ts` |
| DRAG-4.12 | P1 | `Open` → `Automated` | `—` → `tests/ui/drag-5-stub-detach.spec.ts`, `client/src/components/workflow/dragRequest.test.ts`, `client/src/components/workflow/popSession.test.ts` |
| DRAG-1.14 | P2 | `Open` → `Automated` | `—` → `client/src/components/workflow/popSession.test.ts`, `tests/ui/drag-5-stub-detach.spec.ts` |
| DRAG-2.9 | P1 | `Open` → `Automated` | `—` → `client/src/components/workflow/dragClassification.test.ts` |
| DRAG-3.5 | P1 | `Open` → `Automated` | `—` → `client/src/components/workflow/dragBands.test.ts` |

Each status change is written in both the suite table and the case's status line. No other field was touched.

### Each case against its *Then*

**item-attachment**

| Case | Tests carrying the ID | Against the *Then* |
|---|---|---|
| ATT-4.11 | H:652; H:667 | **Whole.** H:652: `M`, at depth 3 with height `CAP − 1`, moved under a root item is refused (`/exceeds the cap/`) and its row is unchanged. H:667 runs both entry points, each on a chain of its own. A subtree of height `CAP` (the chain's second link) made top-level is refused, with the row unchanged. One of height `CAP − 1` (the third link, at depth 3) made top-level is accepted, with `parentId` null in the response and in the stored row. The full run's gap, the accepted write by `PUT`, is closed. |
| ATT-5.12 | CP:278 | **Whole.** `P1` and `P2` share the root's workflow. `X` (in `P1`, at `w1`) is moved under `B` (in `P2`, at `w1`) with the flag clear, naming `w2`. The move is accepted, with `parentId: B`, `isAttached: 0`, `projectId: P2` and `workphaseId: w2`. The assertions read the response, which is the stored row. |
| ATT-9.12 | WP:87 | **Whole.** It runs on the case's setup (`setupShownWithChain`). Three creates (a top-level item, a child attached to `A`, a detached child of `A`) and two moves (`R`, left Free; `X`, left attached to `A`) each name a missing workphase. Each gets a 400 matching the missing-workphase message. The item count is unchanged, and `R` and `X` read back equal to their rows before. It no longer pins one shared message, which answers the full run's concern. |
| ATT-10.4 | IT:120 | **Whole.** A create naming the missing project with no parent, and one naming it with `P` as the parent, each get a 400 with the project message, and the item count is unchanged. The `type` and `agentId` rows go beyond the case, as Nathan ruled. |
| ATT-11.1 | IT:487; IT:501 (describe: :540, :553) | **Whole, through the describe.** It seeds the case's tree: `P` in `w1`, attached `A`, `A`'s detached `A1` in `w3`, `P`'s detached `D` in `w2`, `D`'s attached `D1`, and an unrelated `Q`. Deleting `P` returns 204. Each of `P`, `A`, `A1`, `D` and `D1` reads 404, `P1`'s items are exactly `[Q]`, and `Q`'s row is equal to before. Deleting `A` instead removes `A` and `A1`, and `P`, `D`, `D1` and `Q` are equal to before. "None left top-level or under another parent" follows from the 404s, since no row exists anywhere. IT:487, the chain test, asserts a part (Duplication). |
| ATT-11.2 | attachedUI:416 | **Whole.** `P` in Todo has an attached Stub, and its detached child is a Card in In Progress, beside a bystander. Todo holds another bystander. `P` is deleted from its panel. A value set on `window` survives, so the page didn't reload. None of the three items has a row (`data-item-id`), and each column lists only its bystander. A fresh load shows the same, which ties the board's result to the server's. |

**boards-columns-unsorted**

| Case | Tests | Against the *Then* |
|---|---|---|
| BCU-2.9 | columns:391 (describe: :407, :430) | **Whole.** :407 makes each of the three changes by direct write (`setColumnEnds`, with foreign keys off for the missing-id variant). Each time `A` is `broken`, has no sub-rows, so it covers no workphase and shows no item, and is named "(empty range)". `uncovered` is exactly `W1, W2, W3` with their three items, so `W4` isn't in it, and `C` isn't broken. :430 sets `A`'s end to `V1`, then edits it to `W1`–`W3`. The edit is accepted, `A` isn't broken, it covers `W1, W2, W3` with their items, and `uncovered` is empty. |
| BCU-2.8 | columns:371 | **Still whole.** The title now states the case's title. The assertions are unchanged. |
| BCU-1.2 | boards:240 | **Still whole, and tighter.** "Nothing changes" is now the board read after the refused delete equalling the read before it (the full run's concern 3). |
| BCU-2.3 | columns:106 | **Still whole.** `merged` by default and `expanded` on request. The `position` assertion is gone (the full run's concern 4) and is now columns:118, with no ID (Uncatalogued Tests). |

**project-tree**

| Case | Tests | Against the *Then* |
|---|---|---|
| TREE-3.9 | projects:607; treeDrag:138 | **Still whole.** The refused create now matches the cap's message (`pastCap`, `/exceeds the cap/i`), which ties the refusal to the rule (the full run's concern 4). The rest is unchanged. |
| TREE-9.1 | projects:742 | **Still whole, and tighter.** `Q`'s project, workflow, board and item are compared with a read taken before the delete (`readQ`), not just found (the full run's concern 5). |
| TREE-1.11 | treeDrag:138 | **Still whole.** Its line names only treeDrag, which is unchanged. The hook's TREE-1.11 describe (hook:331) now holds the case's two bullets only. The cap-unknown test is its own describe (hook:357), with no ID (Uncatalogued Tests). |

**item-positioning**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-2.4 | PO:339; resolver:185 | **Whole at the surface now.** In PO:339, `C` is pinned at `3.4`, the true last item, and `A` moved after `C` lands at exactly `4`, not `4.4`, with the order read back as `BCA`. That's the case's `2.4` → `3` with another anchor, and it tells rounding from the unrounded sum. resolver:185 is the existing pointer. It stays, and is proposed for dropping (Proposed Internal Mappings). |
| TC-2.8 | PO:374, PO:382; H:571 | **Whole at the route.** PO:374 names a missing anchor with a workphase change: a 400, and the row reads back with its workphase, position and `completedAt` unchanged. H:571 names a done anchor with a workphase change: a 400 matching `/no position to anchor against/`, and the row is unchanged. resolver:224 is dropped from the line as planned. It still carries the ID (Test Quality Concerns). |
| TC-2.9 | xcolAPI:106; resolver:168 | **Whole at the surface now.** In 3.b, Column One shows `A, C, E`, and `E`'s true predecessor `D` (`4.0`) is in Column Two. `C` placed before `E` lands at exactly `4.5`, never below `D`, and the full order reads `ABDCE`. A resolver blind to `D` would give `3` or less. It's the case's rule with another fixture, and it tells the rule from the leapfrog the case names. resolver:168 stays, and is proposed for dropping. |
| TC-2.23 | PO:273; H:355 | **Whole, and can fail now.** PO:273 (by PUT): the child is at `1.0` with a sibling at `2.0`, and the re-attach keeps `1.0`, where a re-append would give `3`. H:355 (by move): `S1` at `1.0` beside `S2` keeps `1.0`, with nothing logged. |
| TC-2.25 | AT:29 | **Whole, and can fail now.** The child is pinned at `0.37`, which neither a re-placement among siblings (`1.0`) nor one in the workflow (`2`) gives. Its workphase follows the parent's, and its position reads back `0.37`. |
| TC-5.1 | PO:562 | **Whole, and can fail now.** `P1` (In Progress, `5.0`) is created first, and `T3` (Todo, `6.0`) sits past it. The reindex gives `T1 = 1`, `T2 = 2`, `P1 = 3`, `T3 = 4`, the order by position. Insertion order would put `P1` first, and Todo-then-In-Progress would put `T3` before `P1`. |
| TC-5.4 | PO:562; PO:110 | **Whole.** PO:562 proves the one sequence and the combined order on the tight-gap trigger. PO:110 proves that the magnitude trigger renumbers In Progress's item in the same pass and discloses it. See Test Quality Concerns on PO:110's fixture. |
| TC-2.28 | xcolAPI:93, :106; reconcile:106, :127 | **Still whole.** reconcile:127's title gained `DRAG-6.1`, and TC-2.28 stays on it. |
| TC-2.30 | listOps:357; reconcile:198 | **Still whole.** The titles gained `DRAG-3.11` and `DRAG-6.2`, and TC-2.30 stays first on both. |

**board-drag-interaction: the cases the step closes**

| Case | Tests carrying the ID | Against the *Then* |
|---|---|---|
| DRAG-6.1 | bands:751; reconcile:127 | **Whole, together.** bands:751 covers paragraph 1 with a bottom-band drop. With the response held, `X` is drawn at the ghost's slot (`A, B, C, X`) and marked pending, and the same order holds after the response and on the server. reconcile:127 covers the band clause. A top-band and a bottom-band release go through `toRequest` and `sendItemMove`, and the marker the board records is the anchor the request carries. While pending, the board-wide order already reads `A, X, B, C` (top) or `A, B, X, C` (bottom), `X` keeps position `4`, so no number is invented, and the order is the same after `completeItemWrite`, with no inversion. "The request is `before A`" is TC-7.1's, which the case cross-references. |
| DRAG-6.2 | bands:751; reconcile:198 | **Whole, together.** bands:751 asserts the pending marker. reconcile:198 asserts that `X` keeps position `4`, not null, and its placement while another item's response re-sorts the list, and that `X` stays after `C` rather than jumping to the top (`E, A, C, X`). |
| DRAG-6.6 | bands:820 | **Whole at the surface.** The server holds `X` in Review, which the open board doesn't know, so the board still draws `X` in Todo. The drop into In Progress's bottom band is answered with a 400. The test waits for the board's GET, the resync. `X` then renders in Review, not pending, Todo no longer holds it, and In Progress reads `A, B, C`, also on the server. `X` landing where the board never drew it tells a resync from a dropped guess. No value of the preview survives, since `X` is neither pending nor at its previewed slot. |
| DRAG-6.11 | listOps:104 | **Whole** (approved category: list order). In a done list sorted by `completedAt`, an item with none draws after both stamped ones. Once it's stamped later than the others, it is still last. A drop into a done column previews with slot `existing`, which leaves the sort alone (listOps:321), so this sort is the preview and the pending marker's order. |
| DRAG-4.12 | detach:281; dragRequest:183; popSession:246 | **Whole, together.** detach:281: a Stub zoomed into `Q`, which has no Stubs, is released and becomes `Q`'s attached child, its sole one. dragRequest:183: the attach request is `{parentId, isAttached: true}` with no anchor. popSession:246: a Card with no Descendants region never pops further, so the auto-drop is the only outcome. The append's value is TC-2.20's, which the case cross-references. |
| DRAG-1.14 | popSession:92, :100, :135; detach:244 | **Whole, together** (popSession's tests approved by Nathan). Column layer: at time 0, a cursor 70 px outside with `popDistancePx` 50 pops to Board, and one 40 px outside doesn't (:92). The same holds against a merged column's outer body (:135). Column `A` in the shared fixture has no `boundsRect`, which is the containment a sub-row uses. Card and Descendants layers: detach:244 sets every clock to never and `popDistancePx` to 10, and one yank cascades Descendants → Card → Column, which the release's detach proves. `popDistancePx` 0 (:100): a cursor far outside pops nothing at time 0, and pops at `popDelayMs`. |
| DRAG-2.9 | dragClassification:98 | **Whole** (approved). `X`'s descendant chain runs to `D{CAP}`, at depth `CAP + 1`, which would also fail the cap. It classifies as `cycle-forming`, so a depth-first check would fail the test. |
| DRAG-3.5 | dragBands:15, :24, :60 | **Whole** (approved). Two cards: the dividers sit at `top + h` and `bottom − h`, and the band switches exactly there, with `top` above, `middle` between and `bottom` below (:15). The dividers move with `h` and not with `gap` (:24). `reservationFor` gives each dead zone `(h + gap) / 2` and each divider `h`, from the metrics alone, for 2 and for 5 cards (:60). Neither function takes a tuning value. That the divider cuts through a card is intent, not an assertion. |

**board-drag-interaction: cases that stay `Open`** (what each misses is under Gaps)

| Case | Tests carrying the ID | What they assert |
|---|---|---|
| DRAG-1.24 | xcol 3.a/3.b (`tests/ui/item-repositioning-cross-column-dnd.spec.ts:188`, `:200`), xproj 3.a/3.b (`tests/ui/item-repositioning-cross-project-dnd.spec.ts:133`, `:149`); dragRequest:29 | Paragraph 1 at the surface. Paragraph 2's request half: with no others, any slot is identity, so nothing is sent. |
| DRAG-3.11 | bands:239, :369; listOps:357 | The top band's ghost first, and the middle band's ghost where `p` falls (bands). No position invented (listOps:357). placement:96 carries the ID too, but it's outside the approved categories and isn't counted. |
| DRAG-3.23 | dragRequest:172 | The request half: an `existing` placement in a done region becomes a workphase-only request with no anchor. |
| DRAG-3.24 | dragRequest:23 | The request half: the same workphase with slot `existing` is identity, so nothing is sent. |
| DRAG-6.7 | dragRequest:304, :318 | With the tracker's verdict mocked, a stale response that needs a resync calls `loadBoard`, and one that doesn't, doesn't. |
| DRAG-6.9 | reconcile:90 | The state half: a response whose placement was replaced applies its rows and leaves the live ghost's placement and the tripwire alone. |
| DRAG-4.1 | dragRequest:183 | Unchanged: the request names no anchor. The title gained DRAG-4.12. |
| DRAG-3.12 | dragRequest:23 | Unchanged: the request half. The title gained DRAG-3.24. |

**DRAG-5.4** stays `Automated` on detach:281, whose title still starts with it. dragRequest:183 also carries it, off the line, as before.

---

## Lost Coverage

**None.** For every case whose Automation line names a file the step changed, a test in that file still carries the case's ID:

| File | Cases on whose lines it appears, all still carried |
|---|---|
| hook | TREE-1.2, 1.3, 1.5, 1.6, 1.10 |
| dragBands | DRAG-3.15, and now 3.5 |
| dragClassification | DRAG-1.7, 1.8, and now 2.9 |
| dragRequest | DRAG-5.5, 4.12 (new); TC-2.11, 5a.1, 7.1, 7.2, 7.3, 7.4 |
| listOps | DRAG-6.10, 6.11 (new); TC-2.27, 2.29, 2.30, 4.1, 5a.5, 6.10; ATT-9.3 |
| reconcile | DRAG-6.14, 6.1 and 6.2 (new); TC-2.28, 2.29, 2.30, 5a.2 |
| popSession | DRAG-1.4, 1.7, 1.8, 1.11, 1.25, 1.30, 3.15, 3.21, 4.19, 4.23, 5.5, and now 4.12 and 1.14 |
| boards | BCU-1.1 to 1.6, 5.1 to 5.4; TC-1.1, 2.16; DRAG-2.10 |
| columns | BCU-2.1 to 2.9, 3.1, 3.2, 3.3, 3.5 |
| AT | ATT-1.3, 1.4, 1.5, 1.6, 1.14, 4.10, 5.1, 7.7; TC-2.17, 2.25, 3.4, 6.5, 6.6 |
| CP | ATT-2.2, 3.6, 5.1, 5.2, 5.9, 5.10, 5.12, 8.1, 9.8, 9.9; TC-2.24, 7.14, 7.18, 7.19, 7.20 |
| H | 38 ATT cases (1.2, 1.7, 1.8, 1.12, 2.1, 2.2, 3.1, 3.4–3.7, 3.9–3.11, 4.1–4.5, 4.7, 4.10, 4.11, 5.2, 6.1–6.3, 7.1, 7.2, 7.4–7.8, 8.1–8.4, 9.1, 9.4); TC-2.8, 2.14, 2.20, 2.23, 5.2, 5.10–5.14, 7.10, 7.11, 7.13, 7.15 |
| PO | ATT-1.1, 3.1, 7.2, 7.4; 34 TC cases (X.1, X.6, 2.1, 2.4–2.8, 2.10, 2.12–2.15, 2.18–2.21, 2.23, 2.31, 3.4, 5.1, 5.4, 5.5, 5.7–5.9, 5.13, 5.14, 6.1–6.3, 6.9, 7.1, 7.2, 7.10) |
| IT | ATT-4.10, 5.6, 5.7, 10.1–10.4, 11.1; TC-2.6, 2.7, 2.24, 2.32 |
| WP | ATT-9.1, 9.2, 9.4–9.7, 9.10–9.12 |
| projects | TREE-3.1–3.9, 4.1, 4.2, 4.5, 4.6, 5.1, 6.1–6.6, 7.1, 7.2, 8.1–8.4, 9.1–9.3, 10.2 |
| xcolAPI | TC-2.9 (new), 2.10, 2.28, 7.4 |
| attachedUI | ATT-1.1, 1.2, 1.7, 1.9, 3.9, 9.4, 11.2 (new); BCU-5.5 |
| bands | DRAG-1.3, 1.23, 3.1–3.4, 3.6–3.10, 6.5, and now 6.1, 6.2, 6.6 |

The ID search behind sweep 2 also covered every other file on an Automation line. No `Automated` case anywhere in the catalog is left without a test that carries its ID.

## Unknown IDs

**None, with any prefix.**
- **IDs leading a title:** a search for any `<letters>-<digit>` at the start of an `it`, `test` or `describe` title, `.each` and modifiers included, finds only the five catalog prefixes: ATT, BCU, DRAG, TC and TREE.
- **IDs anywhere else:** a search for any `<prefix>-<n>.<n>` token in `.ts`, `.tsx`, `.mts`, `.js` and `.mjs` files, with every prefix other than those five, finds nothing.
- **The five prefixes:** every ATT, BCU, DRAG, TC and TREE token in those files, in titles and comments alike, is a case in the catalog.
- **Not titles:** the ID-shaped strings in `scripts/check-docs/check.test.mts` and `repoIndex.test.mts` that name no case, the bare and out-of-range ones included, are fixture strings inside the checker's own assertions.

**A Test Planner `Manual` case carried by a test:** none. No title carries DRAG-1.29, 1.32, 4.24 or 4.25.

---

## Proposed Stamps

**None needed.** Every case the step meant to close carries its ID on tests that assert it.

## Proposed Internal Mappings (need approval)

**None new.**

**DRAG-6.6's approved internal test isn't written.** bands:820 asserts the whole case through the board (Coverage Mapping). Under `docs/test-plans/README.md`, no internal test is mapped beside a surface test that covers the whole case, so dragRequest:282 stays off the line, as the brief for this run said. It still carries the ID and stays as support.
- The Coder's 4d note says why it isn't needed. A refused drop that kept its previewed placement can't be seen from the board, because the reload replaces every placement.
- So the rule holds at the surface either way. The internal test pins how: the write is failed before the reload.

**Proposed for dropping (optional, Nathan's call).** These are existing pointers, which stay unless dropped:
- **resolver from TC-2.4's line.** PO:339 now proves the rounding through the route. resolver:185 is correct and harmless.
- **resolver from TC-2.9's line.** xcolAPI:106 now proves the case at the surface. resolver:168 asserts the case's value, but its title claims "not the literal next row created", which its fixture doesn't exercise: the rows are inserted in position order (the full run's item 2).

## Proposed Manual (need approval)

**None.**

---

## Gaps

**Cases the step meant to close:** all closed.

**Cases that stay `Open`, with what they still miss.** All are on Story 10's list in `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`.
- **DRAG-1.24 (P0):** paragraph 2 at the surface. `X`, alone in its column's list, picked up and set back down in its own slot, sends no request. Only `isIdentity` asserts it today (dragRequest:29). `tests/helpers/projectTreeDrag.ts::watchWrites` would assert "no request" as the case states it.
- **DRAG-3.11 (P1):** the bottom band's ghost at the end of the list, read while the drag is still over the band. bands:239 reads the order only after the bottom-band release.
- **DRAG-3.23 (P0):** the popped-in release at the surface. `X`, popped into a done column at the Card layer over `D1` or `D2`, is released and sends a workphase-only move with no anchor, and lands as the newest completion. dragRequest:172 hands `toRequest` the `existing` slot directly. That a popped-in release in a done region produces it is `placement.ts`'s, whose test isn't counted. DRAG-3.9 covers only Board-layer releases.
- **DRAG-3.24 (P1):** at the surface. As the cursor moves up and down its own done column, the ghost stays in `X`'s slot between `D1` and `D2` and no card shuffles. A release anywhere in the column sends no request, and `X`'s workphase, `completedAt` and place are unchanged.
- **DRAG-6.7 (P1):** two parts.
  - The tracker's verdict. Write 1's response, arriving after write 2's and carrying reindex pairs, is the one judged stale with a resync due, and its row is discarded. dragRequest:304 and :318 mock that verdict.
  - After the resync, the board matching the server, every reindexed item included.
- **DRAG-6.9 (P1):** the drag half. When write 1's response lands mid-drag, the ghost is back at the drag's placement without further cursor movement, the drag carries on, and its release commits against the reconciled board. reconcile:90 asserts only the state.
- **DRAG-4.1 (P0):** unchanged by the step. The gesture end to end: a Free Card zoomed into `P`, inheriting `W2`, last after `S2`, rendered as a Stub, `P` unchanged, and the detached child's re-attach.
- **DRAG-3.12 (P0):** unchanged by the step. The set-down gesture at the surface, both paragraphs.

The folders' other `Open` cases are outside this re-check. Their routes stand as the full-run reports and the plan's Amendments give them.

---

## Duplication

Reported, not judged.

- **ATT-11.1:** IT:487 (a three-level attached chain, deleted from the top) and IT:501's describe (the case's own tree). IT:568, with no ID, asserts the dependent-row cascade on the same delete.
- **ATT-11.2:** attachedUI:416 on the board, and listOps's `removeItemAndDescendants` tests (listOps:267, :272, no ID) in the client list.
- **ATT-9.12's ground:** IT:112 (a top-level create) and IT:351 (a Free item's move), neither with an ID. Both repeat parts of WP:87.
- **TC-2.23:** PO:273 by PUT and H:355 by move. They're complementary entry points.
- **TC-2.4 and TC-2.9:** each now has a route or API test beside its resolver test (Proposed Internal Mappings).
- **TC-2.8:** PO:374, PO:382 and H:571 on the line. resolver:224 (now off the line) and resolver:351 (`anchorRefusal`, no ID) sit at the lib layer.
- **DRAG-6.6:** bands:820 (the board) and dragRequest:282 (the request half, off the line).
- **DRAG-6.1 and TC-2.28:** reconcile:127 serves both.
- **DRAG-6.2 and TC-2.30:** reconcile:198 serves both. reconcile:127 also asserts DRAG-6.2's "position unchanged" for a band drop.
- **DRAG-4.12, DRAG-4.1 and DRAG-5.4:** dragRequest:183 serves all three. detach:281 serves DRAG-5.4 and DRAG-4.12.
- **DRAG-1.14:** three popSession tests and detach:244. detach:244 also carries DRAG-5.11.
- **DRAG-3.12 and DRAG-3.24:** dragRequest:23 serves both.
- **BCU-2.9:** columns:391's describe. `server/tests/lib/columnRanges.test.ts:61` (no ID) asserts the missing-id variant's `broken` at the helper level.

---

## Test Quality Concerns

### The plan's Open questions to the Reconciler

These are the Coder's notes addressed to the Reconciler, batches 4a, 4c and 4d. Batch 4b's and 4e's notes hold nothing for the Reconciler.

- **4a, ATT-4.11 (H, the top-level test, by move and by PUT):** confirmed. The accepted write now runs at both entry points, each on its own chain (Coverage Mapping).
- **4a, ATT-5.12 (CP), ATT-9.12 (WP), ATT-10.4 (IT):** confirmed, each whole. ATT-9.12's per-refusal message match replaces the shared-message pin, which answers the full run's concern about WP:87.
- **4a, ATT-11.1 (IT, two places):** confirmed. The chain test (IT:487) asserts part, and the describe (IT:501) asserts the whole case, deleted from `P` and from `A`.
- **4a, TC-2.23, TC-2.4, TC-2.9:** confirmed.
  - TC-2.23: both tests can now fail.
  - TC-2.4: the `3.4` anchor shows the rounding.
  - TC-2.9: the cross-column spec's 3.b asserts the rule at the surface.
- **4a, TC-2.25, TC-5.1, TC-5.4 (setups changed):** confirmed. Each setup now tells the rule from the failure the full run named. One residue for TC-5.4 is below.
- **4c, the client IDs by file:** confirmed. Every title the note lists starts with the IDs it names.
  - The approved internal tests close DRAG-2.9, 3.5 and 1.14.
  - The stamps close DRAG-6.1, 6.2, 6.11 and 4.12.
  - The request halves leave DRAG-1.24, 3.11, 3.23, 3.24, 6.7 and 6.9 `Open` (Gaps).
- **4c, the cap-unknown test out of TREE-1.11's describe:** confirmed (hook:357). Nathan ruled on 2026-10-22 that the behavior is acceptable and goes to no PO, so it stays uncatalogued. The test's comment, "No wiki rule states what the sidebar does before it has the project cap", agrees with that.
- **4d, ATT-11.2 and DRAG-6.6's board half:** confirmed. Both are whole at the surface, and DRAG-6.6's request half isn't mapped beside it (Proposed Internal Mappings).

### Other concerns

None blocks a status.

1. **resolver:224 still carries TC-2.8 and still throws for the wrong reason.** It passes the scope `eq(items.workphaseId, 'anything')`, so the resolver throws "could not find id … within scope" before it reaches the no-position branch. The bare `.toThrow()` can't tell the two apart.
   - It's off TC-2.8's line now, so no status rests on it.
   - **For the Coder:** pass `eq(items.workphaseId, phase.id)` and match `/does not have a position/`, or drop the ID from the title.
2. **PO:110 (TC-5.4's magnitude trigger) can't tell the combined order from insertion order or from workphase order.** `A` (Todo, `1100`) is created before `B` (In Progress, `1200`), so either wrong order also gives `A = 1, B = 2`.
   - The combined order is proven on the tight-gap trigger (PO:562). PO:110 proves that the magnitude trigger renumbers the other workphase in the same pass.
   - The reindex is one operation whichever trigger fires it, so the case is whole.
   - **The fix, if wanted:** create `B` first, or pin `A` above `B` and add a Todo item past it. A wrong order would then fail the magnitude trigger too.
3. **DRAG-6.1's "before the request leaves the client" is asserted as "while the write is in flight."** bands:751 holds the response, not the request.
   - That's the observable form of the rule, since the board never shows its pre-drop order after the release.
   - That the placement is recorded before `moveItem` is called is `sendItemMove`'s order. dragRequest:267 (TC-5a.1) asserts both calls, not their order.
   - Low severity.
4. **reconcile:127 (DRAG-6.1's band clause) uses a cross-workphase fixture,** not the case's single column `A, C, E`: Todo holds `A, C`, Doing holds `B`, and `X` lands in Doing.
   - The values follow the rule, and they tell the anchor-shaped marker from a bare `first` slot, which is the failure the case names: a bare slot would draw `X` ahead of `A` board-wide and record an inversion.
   - Accepted under the full run's standard: the rule, with another fixture.
5. **DRAG-6.6's E2E refuses the move at the network** (`page.route` answers 400), so the server never sees the write. That fits the case, which is about the board's answer to a rejection. The server-side divergence the test sets up (`X` moved to Review behind the board) is what proves the resync.
6. **CP:278 (ATT-5.12) sits in `describe('across workflows')` but uses one workflow,** like CP:266 (TC-2.24), which the full run noted. Placement only. Where a test lives is the audit's concern (plan D8).
7. **Carried over:** `tests/api/itemRepositioningAttachedSiblings.spec.ts:17`'s header comment still says "and TC-2.4". It's the one comment in that spec claiming a case its titles don't carry. The full run's item 8 suggested rewording it as TC-3.5's append bullet.

No mapped test was found tautological. Every expected value in the tests above follows from its case's rule, against a setup built so the failure the case names gives a different value.

---

## Uncatalogued Tests

New or changed in the step, with no case ID:

**Gate and contract support, with no standalone rule (listed, not mapped):**
- **IT, "returns 400, not an opaque FK 500, for an agentId that names no agent, and changes nothing"** (batch 4e). No wiki page covers the agent field, and Nathan ruled that the type and the agent get no case until a page covers them. The `''` edge the Coder raised for Nathan is in the plan's Open questions, and no case covers it either.
- **columns:118, "appends a new column after the board's last"** (batch 4b, split from BCU-2.3's test). It's the append math root `CLAUDE.md` describes for column positions, not a wiki rule.
- **hook:357, "before the sidebar has the project cap" / "marks nothing invalid while the cap is unknown."** Nathan ruled the behavior acceptable, with no PO question. It isn't a candidate case.

**On ground an existing case covers:** IT:487 (ATT-11.1's chain test) carries its ID already. Nothing else is new.

## Candidate New Cases

**None.** The step added no test that exercises a scenario the catalog lacks.

---

## Totals

**Status changes in this run:** 20 cases moved `Open` → `Automated`: ATT-4.11, 5.12, 9.12, 10.4, 11.1, 11.2; BCU-2.9; DRAG-6.1, 6.2, 6.6, 6.11, 4.12, 1.14, 2.9, 3.5. None moved `Automated` → `Open`.

**The whole catalog after this run: 350 cases.**

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

**board-drag-interaction by suite:**

| Suite | Automated | Open | Manual | Total |
|---|---|---|---|---|
| DRAG-1 | 10 | 20 | 2 | 32 |
| DRAG-2 | 6 | 4 | 0 | 10 |
| DRAG-3 | 12 | 10 | 0 | 22 |
| DRAG-4 | 10 | 13 | 2 | 25 |
| DRAG-5 | 3 | 8 | 0 | 11 |
| DRAG-6 | 9 | 5 | 0 | 14 |

Since the full run, the catalog gained ATT-11.1, ATT-11.2, ATT-5.12, DRAG-6.15 and TREE-1.13 (the Test Planner's pass after the run), which is why the folder counts are higher than in those reports.

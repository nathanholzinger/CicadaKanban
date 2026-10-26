# Test Reconciliation: A6 close, item-positioning

**Run:** one of five parallel instances of A6's closing Reconciler run (batch 4 of `docs/planning/tech-debt-stories/a6-audit-guidance-and-first-run.md`), followed by a closing run. **Scope:** `docs/test-plans/item-positioning/`, all TC- cases, read against commit `57d3ca2` on `main` plus the uncommitted docs that are current (the plan, `bcu-2-a-column-and-its-range.md`, wiki boards-columns-unsorted). None of the uncommitted edits touches a TC- case or a test file, so every line number below is the file's at `57d3ca2`. The whole-catalog checks were run for TC- IDs only; the other instances own the other prefixes.

**Inputs read:** the nine suite files and `INDEX.md`; wiki positioning and wiki item-positioning in full; the plan's Open questions, Code map and Amendments for batches 3a to 3h; `docs/audits/code-quality-audit-a6.md`'s items for the Reconciler; the previous item-positioning runs (`docs/archive/test-reconciliation-a3-item-positioning.md`, `-a3-close.md`, `-a5d-close.md`) for their rulings; `epic-4-decisions.md` §12 and `epic-3-5-roadmap.md`'s Story 10 item-positioning line for routing; `positioning-on-create-and-edit.md`'s Inbound deferrals; every test that carries a TC- ID, and the other tests in the files they sit in. The ID checks were run by search. This run had no shell, so no gate or test suite was run; the Coder's 3g and 3h results stand.

**In brief:**
- **No status changes.** Every `Automated` case still has a test whose title starts with its ID, and neither `Open` case has one.
- **45 Automation lines re-pointed,** for batch 3f's split of `items.test.ts` and `items.hierarchy.test.ts` and #31's merge into `positionedWrite.test.ts`. No case lost a test, and no title in this prefix changed.
- **Lost coverage: none. Unknown IDs: none.**
- **Nothing needs Nathan's approval** to keep a status. One existing internal pointer is proposed for dropping (TC-2.8's `positionResolver.test.ts`, which throws for the wrong reason).
- **Three `Automated` cases rest on a test that can't tell the rule from a failure of it:** TC-2.23 (can't fail at all), TC-2.25 and TC-5.1 (Test Quality Concerns 3–5). The README lets the Reconciler move a case back to `Open` only when its test is gone, so they stay `Automated` here. Each fix is one line or a title stamp.
- **Gaps:** TC-5.15 and TC-6.11, both `Open` and routed to the Quick Items epic (`epic-4-decisions.md` §12). TC-6.13 stays `Pending PO`, routed with them.
- **The folder holds 79 cases,** not 77: 76 `Automated`, 2 `Open`, 1 `Pending PO`.

---

## How to read this report

A test *carries* an ID when its title, or an enclosing `describe`'s, starts with the ID. "Whole" means every clause of the case's *Then* is asserted by the tests that carry its ID, together. A test *asserts* a value when it pins an exact value that follows from the case's rule and tells the rule from the failure the case names, even with a different fixture (the A3 run's standard).

| Alias | File |
|---|---|
| pos | `server/tests/routes/items.positioning.test.ts` |
| items | `server/tests/routes/items.test.ts` |
| att | `server/tests/routes/items.attached.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| xproj | `server/tests/routes/items.crossProject.test.ts` |
| boards | `server/tests/routes/boards.test.ts` |
| workflows | `server/tests/routes/workflows.test.ts` |
| workphases | `server/tests/routes/workphases.test.ts` |
| resolver | `server/tests/lib/positionResolver.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| siblingsAPI | `tests/api/itemRepositioningAttachedSiblings.spec.ts` |
| crossColumnAPI | `tests/api/itemRepositioningCrossColumn.spec.ts` |
| crossProjectAPI | `tests/api/itemRepositioningCrossProject.spec.ts` |
| posUI | `tests/ui/item-positioning.spec.ts` |
| listOps | `client/src/components/workflow/itemListOps.test.ts` |
| reconcile | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| posWrite | `client/src/lib/positionedWrite.test.ts` |
| dragRequest | `client/src/components/workflow/dragRequest.test.ts` |
| placement | `client/src/components/workflow/placement.test.ts` |

**Which tests count.** Route and Playwright tests count as they are. The internal tests on these lines are existing pointers, approved earlier: resolver (TC-2.2, 2.4, 2.7, 2.8, 2.9, 5.3, 5.6), listOps, reconcile, dragRequest and placement under the approved category for client ordering and request rules, and posWrite, which holds the same approved tests #31 moved there.

---

## Coverage Mapping

### Fields written

Only Automation lines changed; no status did.

| Change | Cases |
|---|---|
| items → pos | TC-2.12, 2.13, 2.15, 2.18, 2.19, 2.21, 2.23, 2.31; TC-5.1, 5.4, 5.5, 5.7, 5.8, 5.9; TC-6.1, 6.2, 6.3, 6.9; TC-X.1, X.6 (20) |
| items → pos, inside a line naming other files too | TC-2.1, 2.5 (with siblingsAPI); TC-2.8 (with hier, resolver); TC-2.10 (with crossColumnAPI); TC-2.14, 2.20, 5.13, 5.14, 7.10 (with hier); TC-7.1, 7.2 (with dragRequest) (11) |
| items → pos, items | TC-2.6; and TC-2.7, which keeps resolver too (2) |
| items → att | TC-2.17, 2.25, 6.5, 6.6 (4) |
| items → pos, att | TC-3.4 (1) |
| hier → xproj | TC-7.14, 7.18, 7.19, 7.20; and TC-2.24, which keeps items (5) |
| reconcile → posWrite | TC-5a.1 (beside posUI and dragRequest), TC-5a.4 (2) |

Unchanged, and still exactly right: TC-1.1, 2.2, 2.4, 2.9, 2.11, 2.16, 2.27–2.30, 2.32, 2.33, 3.1, 3.2, 3.5, 4.1, 5.2, 5.3, 5.6, 5.10–5.12, 5a.2, 5a.5, 6.4, 6.10, 7.3, 7.4, 7.11, 7.13, 7.15, and the `—` of TC-5.15, 6.11 and 6.13.

### Each case against its *Then*

**TC-1, TC-3, TC-4, TC-X**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-1.1 (P2) | boards:109 | **Whole.** Two boards of one workflow each report the item's position, and the same one. |
| TC-3.1 (P0) | siblingsAPI:50 | **Whole.** `C` before `A`; the parent's children read back `C, A, B` through `GET`. |
| TC-3.2 (P0) | siblingsAPI:50, :62, :81 | **Whole.** After each reorder, `Q`'s child and the Free item keep their exact positions. |
| TC-3.4 (P0) | pos:96, pos:193; att:237 | **Whole.** `3` after `P`'s `2.0`, with `Q`'s child at `5.0` and a Free item at `7.0` above it (pos:96); `1.0` for `P`'s first child beside unrelated Free items (pos:193). att:237 is a parent with no workphase, a variation the case doesn't state (Gaps, "Variations"). |
| TC-3.5 (P1) | siblingsAPI:50, :62, :81 | **Whole.** `0.5`, `1.5` (from either anchor) and `4`. |
| TC-4.1 (P0) | listOps:142 | **Whole,** with the case's own values. |
| TC-X.1 (P1) | pos:170 | **Whole.** `D2` after `D1` lands at `1.5`, before `T`. Resolved among `P`'s children it would be `2`. |
| TC-X.6 (P1) | pos:347 | **Whole.** Exactly `2`. |

**TC-2 — Anchor and side resolution**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-2.1 (P0) | pos:326; siblingsAPI:62 | **Whole.** After `A` (`1.0`) with `B` next at `2.0` gives exactly `1.5`, from either anchor, and the order reads back. |
| TC-2.2 (P0) | resolver:157 | **Whole.** `1.5`, `2.0` → `1.8`, not `1.75`. |
| TC-2.4 (P0) | resolver:185 | **Whole.** `5.3` → `6`, which tells rounding from `6.3`. No surface test shows the rounding (Test Quality 6). |
| TC-2.5 (P0) | pos:75, pos:316; siblingsAPI:50 | **Whole.** The first prepend before `1.0` is `0.5`; repeated prepends stay above `0` through the reindex they force, and pos:75 asserts the reindex fired. |
| TC-2.6 (P1) | pos:36; items:245 | **Whole.** The true last at `4.2` in another workphase; a create gets `5`. |
| TC-2.7 (P0) | pos:43, pos:193; items:245; resolver:268, :277 | **Whole.** A first create gets `1.0` (items:245), a first attached child `1.0` (pos:193), an empty workphase beside an item at `3.0` gives `4` (pos:43), and a scope holding only rows with no position bootstraps at `1.0` (resolver:277, the moved-in half). |
| TC-2.8 (P1) | pos:371, pos:379; hier:571; resolver:224 | **Whole at the route.** A missing anchor, and a done one, each with a workphase change: 400, and the row re-read unchanged (pos:371, hier:571). resolver:224 throws for the wrong reason (Test Quality 1). |
| TC-2.9 (P0) | resolver:168 | **Whole,** with the case's values: before `C` (`3.0`), with `B` at `2.8`, gives `2.9`. Its fixture doesn't exercise its own title (Test Quality 2). |
| TC-2.10 (P0) | pos:50; crossColumnAPI:93 | **Whole.** `B`, in another workphase, is `A`'s true neighbor: `1.5`, with `A`'s attached child at `1.2` ignored (pos:50). |
| TC-2.11 (P0) | posUI:50; dragRequest:84 (describe); placement:59 | **Whole.** The inline create's `POST` body has no `position` (posUI:50). Every request shape in `toRequest`'s describe is an exact object with no `position`: a workphase alone, an anchor and a side, first and last as anchors, an attach, a sibling reorder, a detach, a reparent with placement. |
| TC-2.12 (P0) | pos:559 | **Whole.** A `1e-13` gap reindexes the scope to `1, 2, 3`, then the mover lands at `1.5` between the neighbors' new values, with a 200. |
| TC-2.13 (P1) | pos:499 | **Whole.** |
| TC-2.14 (P1) | pos:534 (top-level); hier:328 (detached child) | **Whole.** Both kinds of Free item. |
| TC-2.15 (P1) | pos:543 | **Whole.** |
| TC-2.16 (P1) | boards:140 | **Whole.** Its workphase deleted, the item reads `"none"` through `GET`. |
| TC-2.17 (P1) | att:304 | **Whole.** |
| TC-2.18 (P2) | pos:193 (a number), pos:206 (`null`) | **Whole.** |
| TC-2.19 (P0) | pos:238 | **Whole.** Detached with no anchor: `3`, past the workflow's last Free item at `2.0`, not `1.0` kept; `"workflow"`. |
| TC-2.20 (P0) | pos:219; hier:345, :525 | **Whole.** `5.0` isn't kept: `2.0` past one sibling, `"attached-siblings"` (pos:219); `3.0` past `2.0` (hier:525); `1.0` into an empty Stub list (hier:345). |
| TC-2.21 (P0) | pos:261 | **Whole.** `2.0` among `B`'s children, past `1.0`; `A`'s `1.0` isn't kept. |
| TC-2.23 (P1) | pos:273 | **Asserts the *Then*'s value, but can't fail:** `X` is `P`'s only child, so a reassignment gives `1.0` too (Test Quality 3). |
| TC-2.24 (P0) | items:396; xproj:266 | **Whole.** `7.5` kept exactly; with no position, the append gives `4`, past `3.0`. |
| TC-2.25 (P0) | att:29 | **Whole as asserted,** on a one-child fixture (Test Quality 4). |
| TC-2.27 (P0) | listOps:305 | **Whole.** `A, X, C, E` by index; `X` keeps `9`. |
| TC-2.28 (P0) | crossColumnAPI:93, :106; reconcile:106, :127 | **Whole.** The server's two answers (`1.5` between `A` and the unseen `B`; `4.5` between the unseen `D` and `E`), with Column One still reading `A, C, E`; the client sorts `1.5` and `2.5` into the previewed `A, X, C, E` with no inversion. |
| TC-2.29 (P1) | listOps:331; reconcile:165 | **Whole.** The preview, and both responses landed. |
| TC-2.30 (P0) | listOps:356; reconcile:194 | **Whole.** Position kept and not `null`, its marker kept, and its place held when another item's response re-sorts the list. |
| TC-2.31 (P2) | pos:64 | **Whole.** `1.0` → `3`, past `2.0`. |
| TC-2.32 (P1) | items:327 | **Whole.** |
| TC-2.33 (P1) | crossProjectAPI:64–132 | **Whole.** `C` after `A` gives `1.5`, since `B`, in the other project, is `A`'s true neighbor. Anchors in the other project are accepted and resolve against their true neighbors (`C` after `D`: `4.5`), the case's `C` after `B` in another fixture. |

**TC-5 — Reindexing and its disclosure**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-5.1 (P0) | pos:559 | **Asserts `1, 2, 3` in order,** on rows inserted in that same order (Test Quality 5). |
| TC-5.2 (P0) | hier:842 | **Whole.** `n = 2` at `1100` and `1200`; the `POST` reindexes, then appends at `3`. |
| TC-5.3 (P1) | resolver:311 | **Whole,** with its own numbers: 1,050 rows, `1100` → `1101`, earlier rows untouched. |
| TC-5.4 (P0) | pos:110, pos:559 | **Whole** against the failure the case names: by either trigger, In Progress's item is renumbered in one sequence with Todo's. See Test Quality 5 on "combined order". |
| TC-5.5 (P1) | pos:602 | **Whole.** Still `null`, and `completedAt` unchanged (Test Quality 7). |
| TC-5.6 (P1) | resolver:84 | **Whole.** The tied rows are inserted against their creation order. |
| TC-5.7 (P0) | pos:635 | **Whole.** |
| TC-5.8 (P0) | pos:663 | **Whole.** |
| TC-5.9 (P0) | pos:559 | **Whole.** A tight gap after `A`: reindexed to `1, 2, 3`, the mover at `1.5`, and `reindexed` holds every pair. |
| TC-5.10 (P1) | hier:823, :842 | **Whole.** `toEqual` on bare `{id, position}` pairs. |
| TC-5.11 (P0) | hier:823 | **Whole.** |
| TC-5.12 (P1) | hier:865 | **Whole.** A gap that fits, and an append under the threshold. |
| TC-5.13 (P0) | pos:110, pos:559 (the other workphase's items); hier:842 (`P`'s children) | **Whole.** |
| TC-5.14 (P1) | pos:110 (`POST`, magnitude), pos:559 (move, tight gap); hier:823 (move, magnitude), hier:842 (`POST`, and `PUT`'s scope-change append) | **Whole.** |
| TC-5.15 (P2) | none | `Open` (Gaps). |

**TC-5a — Client reconciliation order**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-5a.1 (P0) | posUI:50 (inline create), posUI:86 (Sheet edit); posWrite:13, :32; dragRequest:267 | **Whole.** Both no-drag writes render the server's reindexed order with no board reload, and each would sort wrong without the pairs. A drag write's fold, and its never calling `loadBoard`, are the approved internal tests. |
| TC-5a.2 (P0) | reconcile:57 | **Whole.** The case's values; `A, X, C, E`, no inversion, placement cleared. Without `C`'s and `E`'s pairs the order would be `A, C, E, X`, so the positions follow. |
| TC-5a.4 (P1) | posWrite:13, :25 | **Whole,** as approved: held pairs applied, unknown ids skipped, no rows gained. "Sends no request" holds by construction (a pure function). |
| TC-5a.5 (P1) | listOps:73, :78 | **Whole.** |

**TC-6 — Active/done split**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-6.1 (P0) | pos:206 (created), pos:470 (moved) | **Whole.** `completedAt` between timestamps read before and after the request. |
| TC-6.2 (P0) | pos:483 | **Whole.** |
| TC-6.3 (P0) | pos:206, :470, :250 | **Whole.** Created, moved and detached there. |
| TC-6.4 (P0) | posUI:26 | **Whole.** `D2, D3, D1`. |
| TC-6.5 (P0) | att:49 | **Whole.** The failure the case names, a dropped position, would fail it. |
| TC-6.6 (P0) | att:49 | **Whole.** |
| TC-6.9 (P1) | pos:129, pos:483 | **Whole.** Exactly `7` after `6.0`, the old `1.0` not back (pos:129). pos:483 asserts only `>`, as support. |
| TC-6.10 (P2) | listOps:117 | **Whole.** Both creation orders. |
| TC-6.11 (P1) | none carries it | `Open` (Gaps). |
| TC-6.13 (P2) | — | `Pending PO`, not mapped. No test carries it. |

**TC-7 — Placement intents from the board gesture**

| Case | Tests | Against the *Then* |
|---|---|---|
| TC-7.1 (P0) | pos:141; dragRequest:120 | **Whole.** The request is `{anchorId: A, side: before}` and nothing else; `A` at `2.0`, the true first, gives `1`. |
| TC-7.2 (P0) | pos:153; dragRequest:120 | **Whole.** `{anchorId: C, side: after}`; `5` with `C` the true last, `4.2` before an unseen `4.4`. |
| TC-7.3 (P1) | dragRequest:133 | **Whole.** |
| TC-7.4 (P0) | crossColumnAPI:59; dragRequest:120 | **Whole.** The first visible item is the anchor; the server gives `1.5`, after the unseen `A`, and Column Two reads `C, B, D`. |
| TC-7.10 (P1) | hier:174, :189; pos:400, :428; hier:202 | **Whole.** The case and each bullet, every refusal re-reading the row. hier:202 is a variation the case doesn't state (Gaps, "Variations"). |
| TC-7.11 (P0) | hier:164, :237 | **Whole.** `1.5` among `P`'s children; `50.0` isn't kept. |
| TC-7.13 (P0) | hier:328 | **Whole.** `10.5`, parent kept. |
| TC-7.14 (P1) | xproj:29, :68 | **Whole.** `1.5` across projects; a Free item reparented with no anchor keeps `5.0`. |
| TC-7.15 (P0) | hier:525 | **Whole.** |
| TC-7.18 (P1) | xproj:245 | **Whole.** `"none"` on the board's Unsorted list and through `GET`. scopeLib:25 also carries the ID (Test Quality 9). |
| TC-7.19 (P1) | xproj:172 | **Whole.** |
| TC-7.20 (P1) | xproj:245 | **Whole.** |

---

## Lost Coverage

**None in TC-.** All 76 `Automated` cases still have a test whose title starts with their ID. The checks:
- **Batch 3f's server split** moved every TC- test out of `items.test.ts` except TC-2.6/2.7 (items:245), TC-2.24 (items:396) and TC-2.32 (items:327), and moved TC-7.14, 7.18, 7.19, 7.20 and one TC-2.24 test from hier to xproj. Each moved title is unchanged, and each line now names its new file.
- **#31's merge** moved TC-5a.1's and TC-5a.4's three tests from reconcile to posWrite:13, :25 and :32, titles unchanged. reconcile still carries TC-2.28, 2.29, 2.30 and 5a.2.
- **No `Manual` case** is in this folder, so none is carried by a test.

## Unknown IDs

**None.** Every TC- ID in a test title anywhere in the repo is a case in this folder, and no title or comment carries a bare `TC-n`. The checker's own tests carry `TC-5a.1` and `TC-X.2` inside string fixtures (`scripts/check-docs/check.test.mts:31–32, 179, 262`; `repoIndex.test.mts:42–49`). They're fixtures, not titles; `TC-X.2` isn't a case on purpose.

---

## Proposed Stamps

Surface tests, so they need no approval. A developer adds the ID at the front of the title, and a later run confirms it.

| Test | Title now (start) | Proposed | What it gives |
|---|---|---|---|
| hier:355 | 'ATT-7.6, ATT-8.2: a redundant re-attach to the same parent is not a scope change and keeps its position' | `ATT-7.6, ATT-8.2, TC-2.23:` | **Recommended.** The test TC-2.23 needs: `S1` at `1.0` beside `S2` at `2.0` is re-attached and keeps `1.0`, where a re-append would give `3` (Test Quality 3). TC-2.23's line then adds hier. |
| crossColumnAPI:106 | 'TC-2.28: 3.b — move C to before E' | `TC-2.9, TC-2.28:` | **Recommended.** TC-2.9's rule through the API: `E`'s true predecessor `D` (`4.0`) is unseen in Column One, and `C` lands at `4.5`, not below `4.0`. A P0 that only a lib test proves today gains a surface test. |
| pos:337 | 'A after C — becomes the new true last item' | `TC-2.4:` | **Optional,** and only with its `C` pinned to a non-integer first (`2.4` → `3`). As it stands, `3.0` → `4.0` can't show the rounding. |
| pos:414 | 'rejects anchoring an attached child against an attached child of a different parent' | `TC-7.10:` | Optional. The same refusal as TC-7.10's bullets, for an attached child. TC-7.10 is whole without it. |
| workflows:87 | 'attaches positionScope to every item, matching GET /api/items/:id for the same rows' | `TC-2.13, TC-2.14, TC-7.18:` | Optional. The same scopes on the workflow read. Each case is whole without it. |

**For the board-drag-interaction instance, or the closing run:** reconcile:127 ("a top or bottom band drop is marked pending as the anchor it sends …") is DRAG-6.1's band clause, as the Test Planner ruled. Proposed title start: `DRAG-6.1, TC-2.28:`. It's internal, but in the approved category (the order a response is applied in, which anchor a placement names), so mapping it needs no approval. TC-2.28 may stay on it, since it's TC-2.28's promise in band form; TC-2.28 is whole without it.

## Proposed Internal Mappings (need approval)

**None.** No case needs an internal test it doesn't already have.

**Proposed for dropping:** resolver from TC-2.8's line. The route tests assert the whole case, and resolver:224 throws for a reason other than the one its title names (Test Quality 1). If the test is fixed instead, the pointer can stay. Once crossColumnAPI:106 carries TC-2.9, resolver could leave TC-2.9's line on the same grounds, though nothing is wrong with resolver:168's assertion.

## Proposed Manual (need approval)

**None.** Every rule in this folder reduces to stored values, response bodies, a request body or a rendered order.

---

## Gaps

### `Open`, no test carrying the ID

| Case | P | What exists | Where it's routed |
|---|---|---|---|
| TC-5.15 | P2 | No test. It fails today: the server counts done items in the threshold's `n`. | `epic-4-decisions.md` §12, for the Quick Items epic's done-column rework, by Nathan's A3 ruling. `epic-3-5-roadmap.md`'s Story 10 item-positioning line records the route. |
| TC-6.11 | P1 | workphases:163, :192, :223, under `describe('isTerminal flip')`, carry no ID by Nathan's A3 ruling. They assert that a terminal flip nulls positions and sets `completedAt`, that a reopen clears `completedAt` and gives positions in order, and that an attached child keeps its position and a `null` `completedAt` on the terminal flip. **Still missing if they were stamped:** `completedAt` as the time of the write (they assert only order); the reopened position by the append fallback past the workflow's last Free item outside `W` (`7`, not the old `4.0`), where :192 asserts only numbers in order; `S` keeping `1.0` through the reopen. | Same as TC-5.15. |

Neither is routed to `positioning-on-create-and-edit.md`. **TC-6.13** stays `Pending PO`, routed to §12 with them, and no test carries it.

### Variations that carry an ID, deferred

`positioning-on-create-and-edit.md`'s Inbound deferrals already hold both, so nothing new is routed:
- **att:237** carries TC-3.4 for a parent with no workphase. TC-3.4's *Given* has one.
- **hier:202** carries TC-7.10 for an item that ends with no workphase. TC-7.10's bullets don't list it.

Both assert the cases' rules in a setting the cases don't state. The cases are whole without them.

---

## Duplication

Reported, not judged. Most of it is layers backing each other on purpose.

- **Route, API and lib on one rule:**
  - TC-2.1: pos:326, siblingsAPI:62, plus pos:283, which carries no ID and asserts only a range.
  - TC-2.5: pos:75, pos:316, siblingsAPI:50, plus crossColumnAPI 1.a and crossProjectAPI 1.a (no ID), crossProjectAPI 4.b (which carries TC-2.33), and resolver:195.
  - TC-2.8: pos:371, :379, hier:571, resolver:224, plus resolver:351 (anchorRefusal, no ID).
  - TC-2.12: pos:559 and resolver:205 (no ID).
- **Client and surface halves:**
  - TC-2.11: posUI:50 and dragRequest:84, placement:59.
  - TC-2.28: crossColumnAPI:93, :106 and reconcile:106, :127.
  - TC-5a.1: posUI:50, :86 and posWrite, dragRequest:267.
  - TC-7.1, 7.2, 7.4: the server half (pos:141, :153, crossColumnAPI:59) and the request half (dragRequest:120). These complement each other rather than duplicate.
- **Three readings of `positionScope`:** route tests (pos:499, :534, :543, att:304, boards:140, xproj:245), the workflow read (workflows:87) and the classifier (scopeLib, seven tests). TC-7.18 is carried by both xproj:245 and scopeLib:25.
- **The disclosure:** route tests (pos:110, :559, hier:823, :842, :865), and resolver's `disclosure` describe (:109, :127, :142) and `withReindexDisclosure` (:390–:405), which carry no ID.
- **The three API specs share one piece of arithmetic,** relabeled across columns, projects and parents. crossColumnAPI 1.a, 1.b, 2.b, 4.a, 4.b and crossProjectAPI 1.a, 1.b carry no ID, and repeat TC-2.5's, TC-2.10's and TC-2.1's rules and an integer-anchor append.
- **Several tests of one case in one file:** TC-3.4 (pos:96, :193, att:237), TC-6.3 (pos:206, :250, :470), TC-6.9 (pos:129, :483), TC-7.10 (five tests), TC-2.20 (three tests).

---

## Test Quality Concerns

### The plan's open questions, answered

Each item in the plan addressed to the Test Reconciler that names a TC- case, or a file that covers TC- cases. Line numbers are found by title and content; the report's own predate batches 3d and 3f.

1. **resolver's TC-2.8 test "throws for the wrong reason."** *Confirmed.* resolver:224 passes the scope `eq(items.workphaseId, 'anything')`, which the anchor isn't in. `positionResolver.ts::getTargetPosition` therefore throws "could not find id … within scope" and never reaches the "does not have a position" branch. The bare `.toThrow()` can't tell the two apart. The fix is to pass `eq(items.workphaseId, phase.id)` and match `/does not have a position/`. Otherwise drop the pointer (Proposed Internal Mappings), since pos:371, :379 and hier:571 assert the whole case. resolver:351 (anchorRefusal) already checks the `'no-position'` reason properly, with no ID.
2. **resolver's TC-2.9 test: "positions follow creation order."** *Confirmed, with a narrower consequence than it sounds.* resolver:168 creates `A`, `B`, `C` at `1.0`, `2.8`, `3.0`, in that order. It asserts the case's own value, `2.9`, which a resolver that took `A` as the predecessor would fail (`2`), so the case is asserted. But its title claims the true neighbor "is not the literal next row created", and here it is: a resolver that found the predecessor by insertion order would pass. The fix is to insert `B` last (pin `created[0]` to `2.8` and `created[1]` to `1.0`). Separately, crossColumnAPI:106 asserts TC-2.9's rule at the surface and could carry its ID (Proposed Stamps).
3. **workflows' positionScope test, "no foreign row."** *Done in batch 3a.* workflows:87 now adds an item filed into this workflow's workphase from a project on another workflow (`:102–107`), asserts `"none"` for it (`:114`), and checks every row against `GET /api/items/:id` (`:116–119`). It carries no ID. It covers TC-2.13, TC-2.14 and TC-7.18's rule on the workflow read, though it reaches the foreign state by a direct write rather than TC-7.18's project move. All three cases are whole elsewhere, so the ID is optional (Proposed Stamps).
   - **A note for the Test Planner, for when `positioning-on-create-and-edit.md` runs:** its Inbound deferral says wiki item-positioning §2's third `"none"` case "has no case among TC-2.13 to TC-2.17". TC-7.18 is that case, it cites §2, and xproj:245 tests it.
4. **IDs only in comments.**
   - **listOps "300–301":** *gone.* listOps:300's comment ("The ordinal placement layer.") names no case. TC-2.27, 2.29 and 2.30 lead titles at :305, :331 and :356.
   - **reconcile "16–17, 108", later "18–19, 110":** *gone,* with batch 3f's #15. Every TC- ID in the file leads a title: :57, :106, :127, :165, :194.
   - **items "708, probably TC-2.4":** it's 'A after C — becomes the new true last item', now pos:337, whose comment at :341 reads "append fallback, C.position + 1.0". It sits beside TC-2.5's and TC-2.1's tests in `describe('top-level items sharing one workphase')`. A3's close named the same test items:619, and the file grew by about 90 lines before the audit. **It isn't TC-2.4 as it stands:** `3.0` → `4.0` can't tell `round(anchor + 1.0)` from `anchor + 1.0`, as A3's close ruled for it and for siblingsAPI:81. It needs no ID. Re-pinned to a non-integer anchor, it would give TC-2.4 a route test (Proposed Stamps).
   - **Still comment-only in this prefix:**
     - siblingsAPI:15–19's "and TC-2.4" (item 8).
     - resolver:107's "(TC-5.9)" above the `disclosure` describe. A4 found it and left it, as `epic-3-5-roadmap.md`'s Story 10 item-positioning line records.
     - Every other TC- ID in a comment sits inside a test whose title carries the same ID.
5. **TC-7.18 in both a lib and a route test.** xproj:245 asserts the whole case through the board and `GET`, so the line names only xproj. No internal test is mapped beside a whole surface test. scopeLib:25 hands the classifier `null` as the workphase lookup's answer, so it shows only that a lookup answering `null` gives `"none"`. Whether a foreign workphase gets that answer is the route's lookup, which it doesn't reach. Its ID can stay or go; that's the Coder's choice.
6. **Batch 3b's TC-2.28 test, answering "no `'first'`/`'last'` marker case".** *Confirmed.* reconcile:127 runs a top-band and a bottom-band release through `toRequest`, `sendItemMove` and `completeItemWrite`. The marker is the anchor the request carries, and the list then reads `A, X, B, C` and `A, B, X, C`, with no inversion. The Test Planner ruled that the band drop is DRAG-6.1's, and this test matches DRAG-6.1's band clause exactly. Proposed title start: `DRAG-6.1, TC-2.28:` (Proposed Stamps, for the board-drag-interaction instance).
7. **#31's merge.** *Done in batch 3g, and re-mapped here.* posWrite:13, :25 and :32 carry TC-5a.1 and TC-5a.4 with their titles unchanged, and reconcile carries neither ID now. TC-5a.1's line names posUI, posWrite and dragRequest; TC-5a.4's names posWrite. They're the same approved tests, moved, so the mapping needs no approval. No coverage was lost.
8. **TC-2.4 and siblingsAPI.** The spec's titles are now at :50, :62 and :81.
   - **TC-3.1:** :50 already carries it, and it's the case's own move: `C` before `A`, read back as `C, A, B`. :62 and :81 read back other moves. TC-3.1 on them is harmless but proves nothing :50 doesn't, so no change is proposed.
   - **TC-2.4:** :81 shouldn't carry it. Its anchor is at `3.0`, so its `4.0` can't show the rounding TC-2.4 pins. The third move is TC-3.5's append bullet, which :81 already carries.
   - **The Automation line follows:** TC-2.4's stays resolver. The header's "and TC-2.4" (`:17`) is the one comment in the spec claiming a case its titles don't carry. The Coder could reword it as TC-3.5's append bullet.
9. **Batch 3f's server splits.** Every TC- line that named a moved file is re-mapped (Coverage Mapping, "Fields written"), and every case still has a test. No TC- title changed in the split.

### Other concerns

1. **TC-2.8, resolver:224.** Answered in item 1 above.
2. **TC-2.9, resolver:168.** Answered in item 2 above.
3. **TC-2.23, pos:273, can't fail.** `X` is `P`'s only attached child, at `1.0`. A write that wrongly treated the redundant re-attach as a scope change would re-append `X` among `P`'s children. The resolver leaves `X` out of its own scope (TC-X.6), so that scope is empty and the bootstrap gives `1.0`, the value the test expects. The rule it should verify is wiki positioning §4 and item-positioning §2.1: no scope change, no new position. Either fix closes it:
   - put TC-2.23 on hier:355, which re-attaches `S1` (`1.0`) beside `S2` (`2.0`), where a re-append gives `3`;
   - or give pos:273's parent a second child after `X`.

   **The case stays `Automated`:** the README's statuses table lets the Reconciler move a case back to `Open` only when its test is gone. If Nathan wants it to read `Open` until the stamp lands, that's his call.
4. **TC-2.25, att:29: a one-child fixture.** `X` is `P`'s only child, at `1.0`, so a cascade that re-placed `X` among its siblings would also give `1.0`. The test does catch a cascade that dropped the position or re-resolved `X` in the workflow scope, which would give `2`. A second child after `X`, or `X` pinned at, say, `0.37`, would catch all three. It stays `Automated`.
5. **TC-5.1 and TC-5.4, pos:559: rows inserted in position order.**
   - `T1`, `T2` and `P1` are created in the order of their positions, so a reindex that renumbered in insertion order would pass. That's what a missing `ORDER BY` does in SQLite. resolver:84 would catch it, since it inserts against position order, but that test is internal and carries TC-5.6. The fixtures of pos:110, :635 and :663, hier:823 and :842 share the shape.
   - Every Todo item also sits below every In Progress item, so a reindex ordered by workphase, then position, would pass TC-5.4's "in their combined order" too.
   - **One fixture change covers both:** create `P1` before `T1` and `T2`, and add a Todo item at `6.0`. The expected values become `T1 = 1`, `T2 = 2`, `P1 = 3`, the new item `4`, and the mover `1.5`.
   - Both cases stay `Automated`.
6. **TC-2.4 has no surface test that shows rounding.** pos:337, siblingsAPI:81 and crossColumnAPI 1.b all append after an integer anchor. resolver:185 (`5.3` → `6`) is its only proof, an approved pointer. Items 4 and 8 above give the options.
7. **TC-5.5, pos:602, doesn't check that the reindex fired.** Its setup is pos:559's, so a reindex does fire, but if the setup stopped triggering one, the test would pass with nothing tested. One assertion on the move's `reindexed` fixes it.
8. **TC-6.9, pos:483, asserts only `>`.** pos:129 pins `7`, so the case is whole. No action.
9. **TC-7.18, scopeLib:25.** Answered in item 5 above.
10. **xproj:266 sits in `describe('across workflows')` but uses one workflow.** It's TC-2.24's no-position half, and it landed there in batch 3f's split, where it had been the re-file test. Where a test lives is the audit's concern (D8), so this is noted for the closing run only.

---

## Uncatalogued Tests

**For the coverage gate, or a contract below the rules.** Not mapped.
- **resolver:**
  - `coarsestFit` (:56–:79): TC-2.2's arithmetic.
  - `disclosure` (:109, :127, :142).
  - 'coarsest fit between 0.0 and the anchor …' (:195), and 'reindexes the scope and retries …' (:205).
  - The no-anchor forms (:235, :245, :255), and 'appends past the true last item' (:292).
  - 'reindexes before appending once the magnitude threshold is crossed' (:300, `< 10`).
  - `anchorRefusal` (:351, :365, :374) and `withReindexDisclosure` (:390–:405), from batch 3d's #21 and #22.
  - The projects-table block (:413–:470), which is project-tree's.
- **scopeLib:** six classifier tests with no ID, backing TC-2.13–2.17 and 6.6.
- **pos:**
  - :283 (a range; a weaker TC-2.1).
  - :337 (the audit's `items:708`; Test Quality item 4).
  - :364 (an invalid `side` gets a 400: request-shape validation, no standalone rule).
  - :450 and :459 (anchors in scope are accepted).
  - :513 (`positionScope` on a `GET`'s `children`: a batching guard).
- **posWrite:**
  - :20 (the written row wins over its own pair). §8's step order; TC-5.11 says the two never disagree.
  - :40 (a create is appended); :47 (an unchanged row keeps its reference).
  - :55, :78 (projects).
- **listOps:**
  - :89 and :160 (done lists sort by `completedAt`), behind TC-6.4.
  - :312 and :379 (other placements), behind TC-2.27.
  - :343 (an anchor missing from the list falls back to the sort).
  - The rest are board-drag-interaction's or the selectors'.
- **API specs:** the seven tests with no ID, under Duplication.

**Genuine scenarios the catalog misses:** none. The near-misses:
- **An anchor with two faults,** both outside the scope and with no position. resolver:365 pins that the scope is asked first. That's the PO's open question already in `positioning-on-create-and-edit.md`'s Inbound deferrals, so it's routed.
- **workflows:87's "every read agrees".** TC-2.13–2.17 already say "when it is read through the API", which covers any read.

## Candidate New Cases

**None.** The two variations that carry IDs (att:237, hier:202) are deferred with their cases (Gaps). The "third `"none"`" deferral is TC-7.18 already (Test Quality item 3).

---

## Totals

The folder after this run, 79 cases:

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 43 | 29 | 4 | 76 |
| `Open` | 0 | 1 (TC-6.11) | 1 (TC-5.15) | 2 |
| `Pending PO` | 0 | 0 | 1 (TC-6.13) | 1 |
| `Planned`, `Manual` | 0 | 0 | 0 | 0 |
| **Total** | **43** | **30** | **6** | **79** |

By suite: TC-1 1, TC-2 30, TC-3 4, TC-4 1, TC-5 15, TC-5a 4, TC-6 10, TC-7 12, TC-X 2.

`Automated` cases resting on internal tests alone: TC-2.2, 2.4, 2.9, 5.3, 5.6 (resolver); TC-2.27, 4.1, 5a.5, 6.10 (listOps); TC-2.29, 2.30 (listOps and reconcile); TC-5a.2 (reconcile); TC-5a.4 (posWrite); TC-7.3 (dragRequest). All are existing, approved pointers.

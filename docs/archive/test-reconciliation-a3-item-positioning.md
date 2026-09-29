# Test Reconciliation: A3 batch 5, item-positioning (proposing run)

**After the confirming run:** "Confirming run (2026-09-29)", the last section, records what the catalog now says, after Stop 1's rulings.

**The Addendum at the end ("Addendum: after the Test Planner's response") supersedes the earlier sections for every case it names. Totals reflect the catalog after that response: 78 cases.**

**Run:** proposing (A3 batch 5, step 2), 2026-09-28. Nothing in `docs/test-plans/`, the wiki or any test was edited. This report is the only write.

**Scope:** `docs/test-plans/item-positioning/`: TC-1 … TC-7, TC-5a and TC-X, 74 cases, against `docs/wiki/item-positioning/README.md` as swept. The catalog-wide checks cover every suite.

**State going in:** 46 cases carry the legacy ✅ and 28 are `Open`. None is `Planned` or `Pending PO`, so every case is mapped.

**Rules applied:**
- the README's many-to-many rule: a case is `Automated` once the tests carrying its ID assert all of it, alone or together;
- batch 3's Stop 1 rulings: a test that asserts part of a case still gets its ID, and pointer lines list only the tests that make a case `Automated`;
- Nathan's routing for this batch: UI drag gaps go to Epic 3.5 Story 10, and route, API and no-drag UI gaps go to A3's Coder;
- existing internal pointers count as approved. That covers `server/tests/lib/positionResolver.test.ts`, and `itemListOps.test.ts` for TC-4.1 (see TC-4.1 below).

---

## Rulings and questions for Stop 1

**After the Test Planner's response:** it revised the cases behind R1, R2 and R3, so those three no longer block a mapping (Addendum). R4 and R5 stand.

**R1. TC-7.17: a Free item left in a foreign workphase reads `positionScope: "workflow"` today; the wiki says `"none"`.** A test for the case fails today.
- **Wiki item-positioning §7.3:** "Those items sit in 'Unknown status,' which is not position-ordered (`positionScope` is `"none"`)".
- **Wiki §2's own definition of `"none"`** lists only a done item and an item with no `workphaseId`. A foreign-workphase item is neither, so §2 and §7.3 disagree with each other.
- **The code follows §2's list.** `itemPositionScope.ts::classifyPositionScope` returns `"workflow"` for any non-terminal workphase, whatever workflow it belongs to.
- **A test pins the code's answer:** hier:697, inside hier:677 'ATT-5.4: a Free reparent keeps every workphase, nulls foreign positions, and surfaces as Unknown status on the new board', asserts `positionScope` is `"workflow"`, with the comment "still classifies by its own workphase's workflow".
- **Everything else in TC-7.17 passes today** (Coverage Mapping, TC-7). ATT-5.4's *Then* doesn't mention `positionScope`, so its status is unaffected either way.
- **A code change** would make `classifyPositionScope` compare the workphase's workflow with the item's project's workflow, and flip hier:697.

**R2. TC-2.1: "created … with the item at `1.0` as its anchor".** A test of the create half fails today.
- `POST /items` accepts no `anchorId` or `side`. It ignores them and appends, so a create "after the item at `1.0`" lands after the scope's true last item, not at `1.5`.
- The wiki implies that a create can carry an anchor (§2 step 5: "Pure creation with no anchor resolves the same way"), but never says one can.
- **Either:**
  - the Test Planner narrows TC-2.1 to a move. The stamps below then make it `Automated`; or
  - Nathan rules that a create takes an anchor. That's a code change for a later story, and TC-2.11's "an inline create into a slot" presumes the same.

**R3. TC-5.9's values can't occur.** A test written to the case as it reads fails today.
- The case: a tight gap between `A` and `C`, `X` placed after `A`, "the scope is reindexed to `A = 1`, `X = 2`, `C = 3`, `E = 4`".
- **A tight gap reindexes the scope first and then retries the insert** (wiki §2's tight-gap trigger, and TC-2.12's own *Then*). `X` isn't in the scope while it's renumbered, so the result is `A = 1`, `C = 2`, `E = 3` and `X = 1.5`.
- **The response then discloses** `A → 1`, `C → 2`, `E → 3` and `X → 1.5`. The route appends the written item's pair (`items.ts::respondWithItem`).
- The case's values are §5.1's illustration ("a reindex to `A=1, X=2, C=3, E=4`"), which argues why silence is unsafe. No mechanism produces them.
- Per the README's "When a test for a case fails", this reads as a case misreading a clear page (§2's steps), so the Test Planner fixes the values. If the Test Planner reads §5.1's example as a rule instead, it's a question for the PO.
- TC-5a.2 uses the same values but feeds the client a synthetic response, so it's unaffected.

**R4. Exact values or ranges.** The Test Planner pinned exact values in this pass. Eight tests assert a range, or a fixture that can't show the value, where the case now names one:

| Case | Test | Asserts | Case pins |
|---|---|---|---|
| TC-2.9 | resolver:163 | between 2.8 and 3.0 | `2.9` |
| TC-2.19 | items:354 | `> 2.0` | the exact append (`3` in its fixture) and `positionScope` |
| TC-6.1 | items:328, items:577 | `completedAt > 0` | the time of the write |
| TC-7.11 | hier:260 | between 1.0 and 2.0 | `1.5` |
| TC-7.13 | hier:352 | between 10 and 11 | `10.5` |
| TC-7.14 | hier:636 | between 1.0 and 2.0 | `1.5` |
| TC-7.15 | hier:540 | between 1.0 and 2.0 | `1.5` |
| TC-X.6 | items:462 | between 1.5 and 3.0 | `2` |

- **Recommended:** tighten each one. It's one line per test, and it's what the README's "concrete expected values" is for.
- **If Nathan accepts a range** wherever the failure the case names falls outside it, six cases become `Automated` with no change: TC-2.9, 6.1, 7.11, 7.13, 7.15 and X.6. TC-2.19 and 7.14 still miss a clause either way.

**R5. Approvals.** They are the six whole internal mappings, and one proposed category for the client cases (Proposed Internal Mappings). Three pointers also name the wrong file:
- TC-2.16, 2.17 and 6.6 point at `positionResolver.test.ts`, which has none of their tests.
- Their tests are in `server/tests/lib/itemPositionScope.test.ts`.
- TC-6.6 is also asserted at the route (items:1034), so it needs no approval.

**Heads-ups, with no ruling asked:**
- **A3's Acceptance line for TC-4.4.** The snapping rule is `Automated` in DRAG-3.6 and 3.8 under batch 3's reading, and that still holds. But DRAG-3.6's "in any band" is tested for the top band only (bandsUI:598). The middle band, the "generic drop on column body" that TC-4.4 named, has no test.
- **TC-7.14's Free half needs `X` created Free explicitly** (`isAttached: false`). A top-level item created the ordinary way stores the flag, and a reparent that omits the flag then attaches it. That is Ruling A's territory: ATT-3.11, A5.
- **For A4 (code comments):** a few comments still say "§2 addendum" (`items.ts` near `crossWorkflowMoveError`, `itemHierarchy.ts::applyHierarchyRequest`, `itemListOps.ts::workphaseOnlySlot`), or cite the disclosure as §5 rather than §5.1.

---

## How to read this report

**Outcome codes,** one per case:

| Code | Meaning | At the confirming run |
|---|---|---|
| **Stamp** | Surface tests, or tests behind an existing internal pointer, assert the whole *Then*. They need only the ID at the front of the title. | `Automated` |
| **Mapped by ID** | A title already starts with the ID, and that test asserts all of the case. | `Automated` |
| **Stamp + tighten** | The tests assert the rule, but a range or fixture can't show the case's exact value. One assertion or fixture changes. | `Open` until tightened |
| **Stamp + A3 route** | Surface tests assert part. They get the ID now, and a route or Playwright API test closes the rest in A3. | `Open` until the gap closes |
| **A3 route** / **A3 UI** | No test yet. A route or API test, or a Playwright UI test with no drag, closes it in A3. | `Open` until written |
| **Internal** | Only a client or `lib/` test asserts it (Gaps, "Internal only"). | `Automated` if approved and whole |
| **Ruling** | A test fails today, or can't be written, until R1–R3 are settled. | `Open` |

**Exact values.** A test asserts a case's value when it pins an exact value that follows from the case's rule and tells the rule from the failure the case names, even with a different fixture. An example is TC-2.4: resolver:181's `5.3 → 6` tells rounding apart from `6.3`, as the case's `2.4 → 3` does. A range doesn't count where the case pins a value (R4).

**"Unchanged" after a refused or unrelated write.** I count it asserted when the test re-reads the fields that write would have changed.

**File aliases:**

| Alias | File |
|---|---|
| items | `server/tests/routes/items.test.ts` |
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| boardsRoute | `server/tests/routes/boards.test.ts` |
| columnsRoute | `server/tests/routes/columns.test.ts` |
| resolver | `server/tests/lib/positionResolver.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| siblingsAPI | `tests/api/itemRepositioningAttachedSiblings.spec.ts` |
| crossColumnAPI | `tests/api/itemRepositioningCrossColumn.spec.ts` |
| crossProjectAPI | `tests/api/itemRepositioningCrossProject.spec.ts` |
| bandsUI | `tests/ui/drag-column-bands.spec.ts` |
| crossColumnUI | `tests/ui/item-repositioning-cross-column-dnd.spec.ts` |
| crossProjectUI | `tests/ui/item-repositioning-cross-project-dnd.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| listOps | `client/src/components/workflow/itemListOps.test.ts` |
| reconcile | `client/src/components/workflow/itemWriteReconciliation.test.ts` |
| dragRequest | `client/src/components/workflow/dragRequest.test.ts` |
| placement | `client/src/components/workflow/placement.test.ts` |

Tests are cited as `alias:line`, with the title as it reads today.

**One trap in the existing lib pointer.** Every resolver test passes a one-workphase scope (`eq(items.workphaseId, phase.id)`). They test the resolver's arithmetic, never the comparison scope, which lives in `itemPositionScope.ts::positionScopeFor` and is reached only through the routes. So resolver tests can't back a case's "whole workflow" or "another workphase" clause (TC-2.6, 2.7, 2.10).

---

## Coverage Mapping

**Titles that already start with a TC ID:**
- surface: items:638 (TC-2.14), items:1034 (TC-6.5), hier:209 (TC-7.10), hier:260 (TC-7.11), hier:352 (TC-7.13), hier:540 (TC-7.15), hier:636 (TC-7.14), and hier:370 (the deleted TC-7.7);
- internal, with no approved mapping: listOps:292 (TC-2.27), listOps:318 (TC-2.29), reconcile:130 (TC-5a.2), placement:63 (TC-2.11).

Every other TC ID in a title is mid-title or at the end. "Tests" names the tests I propose to carry the ID; others that also touch a case are under Duplication.

### TC-1 and TC-4

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-1.1 ✅ | P2 | boardsRoute:103 'reports identical position for the same item across two different boards on one workflow (TC-1.1)' | Two boards of one workflow report the same `position` | — | Stamp |
| TC-4.1 ✅ | P0 | listOps:125 'union-sorts across the covered workphases, allowing genuine interleaving' | The case's own values: `1.0`, `1.5`, `2.0` across `W1` and `W2` read as one order | — | Stamp (existing pointer, see below) |

**TC-4.1's pointer.** The epic-3.2 reconciliation report (archived) mapped TC-4.1 to the `getMergedColumnItemsFrom` union-sort test in `useItemManagement.test.ts`. The selectors now live in `itemListOps.ts`, and listOps:125 is that test: the same function, and the case's own fixture. I treat the pointer as existing, so no approval is needed. A no-drag UI test (render a merged column seeded at those positions) would be the surface alternative, but it isn't needed.

### TC-2 — Anchor and side resolution

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-2.1 ✅ | P0 | items:441 'C after A / C before B — same true-neighbor midpoint from either anchor'; siblingsAPI:72 | A move after `1.0`, with `2.0` next, lands at exactly `1.5` | "Created … with the item at `1.0` as its anchor": `POST /items` takes no anchor. **✗ fails today (R2)** | Stamp + Ruling |
| TC-2.2 ✅ | P0 | resolver:152 'coarsest-fits between the anchor and its true next neighbor' (`1.5`, `2.0` → `1.8`) | All of it | — | Stamp (existing pointer) |
| TC-2.4 ✅ | P0 | resolver:181 'appends past the anchor when it is the true last item' (`5.3` → `6`) | `round(anchor + 1.0)`; `6.3` would fail it | — | Stamp (existing pointer) |
| TC-2.5 | P0 | items:431 'C before A — becomes the new true first sibling' (`1.0` → `0.5`); siblingsAPI:60 | The first prepend: exactly `0.5`, the floor-bounded fit | Repeated prepends: every position stays above `0.0`, through a reindex | Stamp + A3 route |
| TC-2.6 ✅ | P1 | items:126 'positions the first item in a workphase at 1.0 and the next at max + 1.0'; resolver:231, :288 (rounding, lib) | An append after the true last item, rounded | The true last item in *another* workphase: `4.2` in `W2`, then a create in `W1` gives `5`. items:126 has one workphase, and the lib can't show a workflow scope | Stamp + A3 route |
| TC-2.7 ✅ | P0 | items:126 (the first create gets `1.0`); hier:370 (a first Stub gets `1.0`); resolver:264, :273 (an empty scope, or one with only null rows, gets `1.0`) | The bootstrap for a create, a first attached child, and a scope with nothing positioned | The second sentence: with `W1` at `3.0` and `W2` empty, a create in `W2` gets `4`, not `1.0` | Stamp + A3 route |
| TC-2.8 ✅ | P1 | items:494 'move rejects anchoring to a done item … (TC-2.8)'; items:487 'move rejects a non-existent anchorId'; hier:588 'a done Free item cannot be an anchor (TC-7.8 server half, TC-2.8)'; resolver:220 | Both anchors are refused with a 400 | "Nothing in it is written": no test re-reads the row. hier:588 is the only one whose request also changes the workphase | Stamp + A3 route |
| TC-2.9 ✅ | P0 | resolver:163 'finds the true neighbor even when it is not the literal next row created' | Strictly between `2.8` and `3.0` | Exactly `2.9` (R4) | Stamp + tighten |
| TC-2.10 ✅ | P0 | crossColumnAPI:95 '3.a — move C to after A' (`A` at `1.0` in Column One, `B` at `2.0` in Column Two: `1.5`) | The true neighbor is in another workphase | "The attached child is … no neighbor of a Free item": no fixture has an attached child between the two. The pointer's resolver tests scope to one workphase, so they can't show this rule at all | Stamp + A3 route |
| TC-2.11 | P0 | placement:63 'DRAG-1.4, TC-2.11: a specific card: …' (asserts a placement, not a request); dragRequest's `toRequest` describe (:91) | Every board-drop and sibling-reorder request shape is an anchor and side, or a workphase, with no `position` | The inline create's request; approval for the internal tests | Internal (partial) + A3 UI |
| TC-2.12 ✅ | P0 | items:669 'reindexes every non-terminal workphase in the workflow together, in one coordinated pass (TC-5.4)'; resolver:201 | The reindex to `1, 2, 3` in order, then `1.5` between the new values, with a 200 | — | Stamp |
| TC-2.13 ✅ | P1 | items:603 'GET returns positionScope = "attached-siblings" for an attached child (TC-2.13)' | All of it | — | Stamp |
| TC-2.14 ✅ | P1 | items:638 (carries it; a top-level item); hier:352 (a detached child reads `"workflow"`) | Both kinds of Free item | — | Stamp (hier:352) |
| TC-2.15 ✅ | P1 | items:647 'GET returns positionScope = "none" for a done item (TC-2.15)' | All of it | — | Stamp |
| TC-2.16 ✅ | P1 | Its pointer names resolver, which has no such test. scopeLib:22 'classifies a null-workphase item as none (unsorted, not currently ordered) (TC-2.16)' | All of it, at the lib | — | Internal (approval), or one assertion added to boardsRoute:133 |
| TC-2.17 ✅ | P1 | Its pointer names resolver. scopeLib:34 'classifies an attached-but-parentless item as workflow, not attached-siblings (TC-2.17)' | All of it, at the lib | — | Internal (approval), or one assertion added to items:1244 |
| TC-2.18 ✅ | P2 | items:314 (a number), items:328 (`null`) | Both shapes | — | Stamp |
| TC-2.19 ✅ | P0 | items:354 'ATT-7.2: detaching reassigns a fresh position scoped to the workflow' | A fresh position past the workflow's last Free item | The exact append (`3` in its fixture), and `positionScope` `"workflow"` | Stamp + tighten |
| TC-2.20 ✅ | P0 | hier:540 (Free `Y`, at `1.0` in the workflow, attaches to `P`, whose last Stub is `2.0`: `3.0`, `"attached-siblings"`); hier:370 (an empty Stub list gives `1.0`; `50.0` isn't kept) | Both halves | — | Stamp. items:338 isn't proposed (Test Quality 1) |
| TC-2.21 ✅ | P0 | items:376 'ATT-3.1: reparenting while staying attached reassigns a fresh position scoped to the new parent' (`1.0` under `A`; `B`'s child is at `1.0`: `2.0`) | All of it | — | Stamp |
| TC-2.23 ✅ | P1 | items:388 'a redundant re-attach to the same parent leaves position untouched (TC-2.23)' | All of it | — | Stamp |
| TC-2.24 ✅ | P0 | items:284 (`7.5` kept exactly); hier:761 're-filing a foreign-workphase item into the new workflow assigns a fresh position (positioning §7.3)' (no position to keep: `4`, past `3.0`) | Both halves | — | Stamp |
| TC-2.25 ✅ | P0 | items:1017 "cascading a non-terminal-to-non-terminal move leaves an attached child's position untouched (TC-2.25)" | All of it | — | Stamp |
| TC-2.27 | P0 | listOps:292 'TC-2.27: places an item after its anchor by index — its position is untouched' | All of it | Approval | Internal |
| TC-2.28 | P0 | crossColumnAPI:95 and :108 (`C` after `A` gives `1.5`, before `E` gives `4.5`; Column One reads `A, C, E` either way) | The server's two answers, and the view order they sort into | The client's own list: the API test sorts positions itself. Its moving item is `C`, not a new `X`, which doesn't change the rule | Stamp + Internal |
| TC-2.29 | P1 | listOps:318 'TC-2.29: an item anchored against a still-pending item follows that item wherever it was placed' | The preview | After both responses land, `X` is still directly after `Y` | Internal (partial) |
| TC-2.30 | P0 | listOps:343 'a placement with a workphaseId moves the item into that list without changing the item (TC-2.30: position kept, not null)' | `position` is unchanged, and not `null`, while the item is placed | The separate pending marker; the item keeping its place when another item's response re-sorts the list | Internal (partial) |
| TC-2.31 | P2 | none | — | All of it | A3 route. **Passes today:** `applyHierarchyRequest` appends on a same-workphase move with no anchor |

### TC-3 — Attached-sibling reorder

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-3.1 ✅ | P0 | siblingsAPI:60 'C before A — becomes the new true first sibling (TC-2.5-equivalent)' | `C, A, B`, read back through `GET` on the parent | — | Stamp |
| TC-3.2 ✅ | P0 | siblingsAPI:60, :72, :91 (`expectIsolationUnaffected`) | `Q`'s child and the Free item keep their exact positions | — | Stamp |
| TC-3.4 ✅ | P0 | items:314 'POST scopes a new attached child to its true siblings, not the whole workphase' | `P` with no children gives `1.0`, with Free items at `1`–`3` in the workphase | The first half: `P`'s last child at `2.0`, with Free items and `Q`'s children above it, gives `3` | Stamp + A3 route |
| TC-3.5 ✅ | P1 | siblingsAPI:60 (`0.5`), :72 (`1.5`), :91 (`4.0`), each from a fresh `A, B, C` | All three bullets | — | Stamp |

### TC-5 — Reindexing and its disclosure

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-5.1 ✅ | P0 | items:669 (`T1`, `T2`, `P1` become `1`, `2`, `3`); resolver:82, :201 | All of it | — | Stamp |
| TC-5.2 ✅ | P0 | hier:1032 'PUT and POST disclose the same way' (the POST: `A` at `1100` and `B` at `1200` become `1` and `2`, and `C` is `3`, which is `n + 1`); resolver:122 | All of it | — | Stamp |
| TC-5.3 ✅ | P1 | resolver:307 'does not reindex when a large position is proportionate to a large item count' (1,050 items, last at `1100`: `1101`, earlier rows untouched) | All of it, with its own numbers | — | Stamp (existing pointer) |
| TC-5.4 ✅ | P0 | items:669 (a tight gap in Todo renumbers In Progress's `P1` in the same sequence) | The tight-gap trigger | "By either trigger": the magnitude trigger, across workphases | Stamp + A3 route |
| TC-5.5 ✅ | P1 | items:712 'excludes a done item from an active-scope reindex (TC-5.6)' | Still no position, and `completedAt` unchanged | — | Stamp, with its ID moved from TC-5.6 to TC-5.5 |
| TC-5.6 ✅ | P1 | resolver:82 'breaks exact ties by createdAt, oldest first' | Tied rows come out oldest first | "Whatever order the database holds them in": the tied rows were inserted in creation order, and can share a millisecond, so row order alone passes the test | Stamp + fixture fix |
| TC-5.7 ✅ | P0 | items:747 'an attached-siblings reindex does not touch an unrelated workflow-wide item' | All of it | — | Stamp |
| TC-5.8 ✅ | P0 | items:777 "a workflow-wide reindex does not touch an unrelated parent's attached children" | All of it | — | Stamp |
| TC-5.9 | P0 | hier:1013 'move: the response carries every renumbered {id, position} pair, the moved item included' (the magnitude trigger) | A pair for every renumbered item | The case's tight-gap fixture and values, which can't occur. **✗ fails as written (R3)** | Stamp + Ruling, then A3 route |
| TC-5.10 | P1 | hier:1013, :1032 (`toEqual` on bare `{id, position}` entries) | All of it | — | Stamp |
| TC-5.11 | P0 | hier:1013 (`X → 3` among the pairs, and `position` `3` in the body) | All of it | — | Stamp |
| TC-5.12 | P1 | hier:1055 'is absent when no reindex fired' (a prepend that fits) | A gap that fits | An append under the magnitude threshold | Stamp + A3 route |
| TC-5.13 | P0 | hier:1032 (a `PUT` attach: `P`'s renumbered children are all disclosed) | The attached-siblings half | A reindex a `W1` write triggers discloses `W2`'s renumbered items | Stamp + A3 route |
| TC-5.14 | P1 | hier:1013 (move), :1032 (`POST`, and `PUT`'s scope-change append) | Every write, by the magnitude trigger | The tight-gap trigger: a move beside its anchor | Stamp + A3 route |

### TC-5a — Client reconciliation order

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-5a.1 | P0 | reconcile:26 'applies every reindexed pair the list holds, then the written item (§5a order)'; reconcile:56 'with no reindex, replaces the written row by reference and leaves every other row untouched'; dragRequest:261 (a successful drag write never calls `loadBoard`) | The fold, and no reload after a drag write | The inline create and the Sheet edit: the internal tests can't show those paths fold without reloading; approval | Internal (partial) + A3 UI |
| TC-5a.2 | P0 | reconcile:130 'TC-5a.2: applies the reindex first, so a correct response is not read as an inversion; clears the placement' | All of it, with the case's values | Approval | Internal |
| TC-5a.4 | P1 | reconcile:49 'ignores pairs for ids not in the list — "not in this view," never missing data'; reconcile:26 | Held pairs applied, unknown ones skipped, no rows gained | "Sends no request": holds by construction, since the reducer is pure, but no test observes it | Internal (approval, disclosed) |
| TC-5a.5 | P1 | listOps:73 'breaks an exact position tie by createdAt, oldest first' (the tie arrives newest first) | The tie half | A missing `position` sorting as `0` | Internal (partial) |
| TC-5a.6 | P2 | reconcile:153 'a write the board never previewed (a Sheet edit, an inline create) is folded in with no tripwire, even when the id has an unrelated placement' | All of it | Approval | Internal |

### TC-6 — Active/done split

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-6.1 ✅ | P0 | items:328 (created in Done), items:577 (moved to Done) | `completedAt` is set on both | "The time of that write": both assert only `> 0` (R4) | Stamp + tighten |
| TC-6.2 ✅ | P0 | items:587 'moving out of a terminal workphase clears completedAt and assigns a fresh position' | All of it | — | Stamp |
| TC-6.3 ✅ | P0 | items:328 (created there), items:577 (moved there), items:365 'ATT-7.4: detaching into a terminal workphase clears position and sets completedAt' (detached there) | All three ways in | — | Stamp |
| TC-6.4 ✅ | P0 | none; its pointer is `—`. listOps:78 is a two-item version (see Test Quality 7) | — | All of it | A3 UI |
| TC-6.5 ✅ | P0 | items:1034 'ATT-1.4, ATT-1.5, TC-6.5: …' | All of it | — | Mapped by ID |
| TC-6.6 ✅ | P0 | items:1034 asserts `positionScope` is still `"attached-siblings"` after the terminal cascade. Its pointer names resolver; the lib version is scopeLib:11 | All of it | — | Stamp |
| TC-6.7 ✅ | P0 | columnsRoute:322 (`POST`, 400), :343 (`PUT`, 400) | Both are refused | "Nothing about the columns changes": no test re-reads the board | Stamp + A3 route |
| TC-6.8 ✅ | P1 | columnsRoute:333 (all terminal), :119 (all non-terminal) | Both are accepted | — | Stamp |
| TC-6.9 ✅ | P1 | items:587 (position `> 1.0`) | A fresh position | Exactly `7`, past `6.0`; "No earlier position comes back": the item was created done, so it never had one | Stamp + A3 route |

### TC-7 — Placement intents from the board gesture

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-7.1 | P0 | dragRequest:127 "first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, 3.2)" (internal) | The request form: `{anchorId: A, side: before}`, with nothing else to mark it as first | The server half: `A`, the true first at `2.0`, gives `1`; approval for the request half | A3 route + Internal |
| TC-7.2 | P0 | dragRequest:127 (internal) | The request form: `{anchorId: C, side: after}` | The server half: `5` when `C` is the true last, `4.2` with an unseen item at `4.4` | A3 route + Internal |
| TC-7.3 | P1 | listOps:73 (the tie sort) and dragRequest:127 (first and last), separately | Each half on its own | The two together: with a tied pair, "first" anchors the older and "last" the newer | Internal (new test) |
| TC-7.4 | P0 | crossColumnAPI:69 '2.a — move C to before B' (`B` is first in Column Two, `A` is unseen at `1.0`: `1.5`, and Column Two reads `C, B, D`) | The server's answer and the resulting order | The client choosing the first visible item as the anchor | Stamp + Internal |
| TC-7.10 | P1 | hier:209 'ATT-3.7, TC-7.10: …' (`X`'s and `X1`'s rows unchanged); items:510 "rejects anchoring a detached item against someone else's attached child" (a Free item's move with no reparent, 400) | Both halves | — | Stamp (items:510) |
| TC-7.11 | P0 | hier:260 'ATT-1.7, ATT-3.6, TC-7.11: …' (between `1.0` and `2.0`); hier:199 'validates the anchor against the resulting scope: a new sibling is accepted (TC-7.9)' | Accepted, and drawn from `P`'s children | Exactly `1.5` (R4) | Stamp + tighten |
| TC-7.13 | P0 | hier:352 (between `10` and `11`, parent kept) | All but the value | Exactly `10.5` (R4) | Stamp + tighten |
| TC-7.14 | P1 | hier:636 (between `1.0` and `2.0`) | The attach half, as a range | Exactly `1.5` (R4); a Free item reparented across projects with no anchor keeps `5.0` | Stamp + tighten + A3 route |
| TC-7.15 | P0 | hier:540 (done `P`; between `1.0` and `2.0`) | All but the value | Exactly `1.5` (R4) | Stamp + tighten |
| TC-7.17 | P1 | hier:677 (`X` and `X2` are `null`, `X1` stays `1.0`); hier:709 (attached: `1.0` among `B`'s children, `X2` `null`); hier:761 (re-filed: the append fallback) | Everything except `positionScope` | `positionScope` `"none"`: hier:697 asserts `"workflow"`. **✗ fails today (R1)** | Stamp + Ruling |

### TC-X — Cross-cutting guards

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| TC-X.1 ✅ | P1 | none. items:410's describe 'detached siblings sharing one workphase (TC-X.1)' names it, but its items are top-level with no parent | — | All of it | A3 route |
| TC-X.6 ✅ | P1 | items:462 'excludes the item itself from its own scope query on reposition (TC-X.6)' | The failure the case names (a value below `1.5`) | Exactly `2` (R4) | Stamp + tighten |

---

## Lost Coverage

- **item-positioning:** no case is `Automated`, so none can have lost coverage.
- **board-drag-interaction:** all 42 `Automated` cases still have a test whose title starts with their ID.
  - Checked: DRAG-1.3, 1.4, 1.7, 1.8, 1.10, 1.11, 1.23, 1.25, 1.30; 2.1, 2.2, 2.3, 2.7, 2.10; 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 3.15, 3.21; 4.8, 4.9, 4.10, 4.11, 4.18, 4.19, 4.23, 4.29, 4.30; 5.4, 5.5, 5.12; 6.1, 6.5, 6.10, 6.12, 6.13.
  - Nothing moves back to `Open`.
- **item-attachment:** all 47 `Automated` cases still have a test whose title starts with their ID.
  - Checked: ATT-1.1–1.7, 1.9, 1.12; 2.1, 2.2; 3.1, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10; 4.1–4.7, 4.10, 4.11; 5.1, 5.2, 5.4, 5.5, 5.6; 6.1–6.3; 7.1–7.8; 8.1–8.4.
  - Nothing moves back to `Open`.
- **`Manual` cases carried by a test:** none. No test carries DRAG-1.29, 1.32, 4.24 or 4.25, and item-positioning has no `Manual` case.

**The Test Planner's edits to other catalogs** (cross-references and Rule fields only). Every status still holds:

| Case | Status | Backing checked |
|---|---|---|
| DRAG-3.3 | `Automated` | bandsUI:379 asserts the workphase and position `2.5` exactly. The new pointers (TC-2.24, TC-6.9, DRAG-6.10) add no clause of its own |
| DRAG-3.6, DRAG-3.7 | `Automated` | bandsUI:598. See the heads-up on DRAG-3.6's "in any band" |
| DRAG-3.8 | `Automated` | bandsUI:638 |
| DRAG-3.9 | `Automated` | bandsUI:700 (and placement:124, internal) |
| DRAG-3.10 | `Automated` | bandsUI:728 |
| DRAG-4.12 | `Open`, routed to Story 10 | drag-5-stub-detach.spec.ts:248 carries it, in part |
| DRAG-5.2 | `Open`, routed to Story 10 | dragRequest:208 carries it (internal, unapproved) |
| DRAG-6.10 | `Automated` | placement:141, listOps:378 |
| ATT-3.1, ATT-3.5 | `Automated` | hier:280, items:376 |
| ATT-4.2 | `Automated` | hier:100 |
| ATT-5 (its preamble now points to TC-7.14 and TC-7.17) | ATT-5.1–5.6 unchanged | ATT-5.4's hier:677 is also the test R1 turns on, but ATT-5.4's *Then* doesn't mention `positionScope` |

**Tests of item-positioning §4's merged-column rule (DRAG-3.6–3.8).** No test ever carried TC-4.2–4.5. The tests for the rule are:
- bandsUI:598 'DRAG-3.6, DRAG-3.7: …' and bandsUI:638 'DRAG-3.8, DRAG-1.6: …', which already carry their IDs;
- placement:115 'DRAG-3.7: Board layer — a covered-set member keeps its own workphase in the preview': internal, carries DRAG-3.7, with no approved mapping. Supporting;
- dragRequest:17 'a different workphase is never identity, whatever the slot (DRAG-3.1/3.2/3.6)' and dragRequest:43 '… a genuine reorder (DRAG-3.7 top/bottom)': internal, with the IDs mid-title. Supporting;
- boardsRoute:59 'resolves columns into displayName/broken/entryWorkphaseId/subRows and computes unsorted': it pins that a column's entry workphase is the first in its range, which the snap relies on. That's boards-columns-unsorted's, which has no catalog.

All of these belong to DRAG-3.6–3.8. None needs a TC ID.

## Unknown IDs

**The 12 `case-id` hits, and where each goes:**

| Where | Reference | Proposal |
|---|---|---|
| dragRequest:26 (title) | 'same workphase, slot existing: always identity (middle band member, TC-7.16)' | Drop TC-7.16. The rule it describes is DRAG-3.12's: a covered member set back down in the middle band writes nothing. Stamping DRAG-3.12 at the front would be an unapproved internal mapping, so if an ID is wanted, keep DRAG-3.12 mid-title |
| dragRequest:32 (title), two hits | '… nothing to order against (TC-7.5, TC-7.8)' | Drop both. The test is an item set back down in its own otherwise-empty list, which is DRAG-3.12's set-down again. No done column is involved, so TC-7.8's successor (DRAG-3.9) doesn't apply |
| dragRequest:104 (title) | '… (DRAG-3.3 outsider / TC-7.16-shaped, middle band)' | Drop "/ TC-7.16-shaped"; DRAG-3.3 stays |
| dragRequest:160 (title) | "a done region never anchors — DRAG-3.9/TC-7.8 is …" | Drop "/TC-7.8"; DRAG-3.9 stays |
| `client/src/components/workflow/dragRequest.ts`:37 (comment) | "a covered-set member in the middle band, TC-7.16" | DRAG-3.12 |
| `dragRequest.ts`:38 (comment) | "an empty or done region, TC-7.5/7.8" | "DRAG-3.10/DRAG-3.24". DRAG-3.10 is the empty region's single band. DRAG-3.24 is a card set back down in its own done column, which writes nothing: the identity this comment means. The "7.8" tail is invisible to the checker (below) |
| hier:199 (title) | '… a new sibling is accepted (TC-7.9)' | `TC-7.11:` at the front (Proposed Stamps) |
| hier:280 (title) | '…, TC-7.12: reparents while attached …' | Drop TC-7.12. ATT-3.5 is already in the title |
| hier:370 (title) | 'TC-7.7: attaching into an empty Stub list …' | `TC-2.20:`, which holds the result. DRAG-4.12 makes the request |
| hier:588 (title) | '… (TC-7.8 server half, TC-2.8)' | Drop TC-7.8; `TC-2.8:` goes to the front |
| `client/src/components/workflow/itemWriteReconciliation.ts`:95 (comment) | "(TC-5a.3 — nothing is rebuilt when nothing changed)" | Drop the ID. It names §5a's dropped step 4. The remark about not rebuilding is an implementation note, and A4's |

**Deleted IDs the checker can't see** (the tail of a range or a slash, which has no prefix):
- `dragRequest.ts`:38, the "7.8" in "TC-7.5/7.8": as above.
- reconcile:108 (comment), "TC-5a.1–5a.3": the tail is the deleted TC-5a.3. It should read "TC-5a.1, TC-5a.2".

**Live IDs that now name the wrong case:**
- **items:658**, describe 'multi-workphase active-scope reindex (TC-5.4/TC-5.6)', and **items:712** '… (TC-5.6)': TC-5.6 is now the reindex tie-break. This test is TC-5.5's rule, that done items are never reindexed.
- **items:742**, a comment: "TC-5.6 (above) is proof …" means the same test, so it should say TC-5.5.
- **items:410**, describe 'detached siblings sharing one workphase (TC-X.1)': its three tests use top-level items. TC-X.1 is now a detached child's scope (Test Quality 3).
- **placement:63** 'DRAG-1.4, TC-2.11: …': it asserts the placement a release resolves to, not the request TC-2.11 is about. Keep the ID only if Nathan approves the placement and request tests together for TC-2.11 (Proposed Internal Mappings, category C).

**Tests that assert a deleted case's rule,** beyond the references above:

| Deleted | Where its rule lives now | Tests |
|---|---|---|
| TC-2.3 (`1.0` and `3.0` give `2`) | TC-2.2 | resolver:54 'takes the exact midpoint when it already fits at 0 decimals'. Supporting only, with no ID |
| TC-2.22 (a moved item lands between its neighbors) | TC-2.1 | items:441 (proposed for TC-2.1), items:398 (a range; supporting) |
| TC-4.2–4.5 | DRAG-3.6–3.8 | Listed under Lost Coverage |
| TC-5a.3 (re-sort only on an inversion) | none; §5a's step 4 was dropped | reconcile:56 and :71 keep row references when nothing changes. That's render efficiency, uncatalogued |
| TC-7.5 (an empty region) | DRAG-3.10; TC-2.24 on the server | bandsUI:728, dragRequest:140 |
| TC-7.6 (an empty workphase isn't an empty scope) | TC-2.7's second sentence | none. It's TC-2.7's gap |
| TC-7.7 | TC-2.20; DRAG-4.12 | hier:370; also hier:709 and hier:597, where the result is incidental |
| TC-7.8 (a done column) | DRAG-3.9; TC-6.1 and 6.3; TC-2.8 | bandsUI:700, placement:79, :124, hier:588 |
| TC-7.9 | TC-7.11 | hier:199 |
| TC-7.12 | ATT-3.5 | hier:280 |
| TC-7.16 (the middle band) | DRAG-3.3; DRAG-3.12; TC-2.24 | bandsUI:379, dragRequest:26, :104 |
| TC-X.2 (cycles) | ATT-4.2, ATT-4.3 | hier:100, items:1169, and `tests/api/attachedChildren.spec.ts`:66 and :81 |
| TC-2.26, TC-3.3, TC-X.3, TC-X.5 | superseded | No test carries them |

---

## Proposed Stamps

These are surface tests, so they need no approval. Each proposed title keeps the rest of its text, and drops the parenthesized IDs the stamp replaces. A case is marked partial where the stamped test asserts only part of it.

### items (`server/tests/routes/items.test.ts`)

| Line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| 126 | 'positions the first item in a workphase at 1.0 and the next at max + 1.0' | `TC-2.6, TC-2.7:` | Partial for both |
| 284 | "a workphaseId-only move with no anchor keeps … (TC-2.24)" | `TC-2.24:` | |
| 314 | 'POST scopes a new attached child to its true siblings, not the whole workphase' | `TC-2.18, TC-3.4:` | Partial for TC-3.4 |
| 328 | 'POST into a terminal workphase gets no position, but a completedAt timestamp' | `TC-2.18, TC-6.1, TC-6.3:` | TC-6.1: tighten |
| 354 | 'ATT-7.2: detaching reassigns a fresh position scoped to the workflow' | `ATT-7.2, TC-2.19:` | Tighten |
| 365 | 'ATT-7.4: detaching into a terminal workphase clears position and sets completedAt' | `ATT-7.4, TC-6.3:` | |
| 376 | 'ATT-3.1: reparenting while staying attached …' | `ATT-3.1, TC-2.21:` | |
| 388 | '… leaves position untouched (TC-2.23)' | `TC-2.23:` | |
| 410 | describe 'detached siblings sharing one workphase (TC-X.1)' | No ID on the describe | Its items are top-level (Test Quality 3) |
| 431 | 'C before A — becomes the new true first sibling' | `TC-2.5:` | Partial |
| 441 | 'C after A / C before B — same true-neighbor midpoint from either anchor' | `TC-2.1:` | The move half (R2) |
| 462 | '… on reposition (TC-X.6)' | `TC-X.6:` | Tighten |
| 487 | 'move rejects a non-existent anchorId' | `TC-2.8:` | Partial |
| 494 | 'move rejects anchoring to a done item … (TC-2.8)' | `TC-2.8:` | Partial |
| 510 | "rejects anchoring a detached item against someone else's attached child" | `TC-7.10:` | |
| 577 | 'moving into a terminal workphase clears position and sets completedAt' | `TC-6.1, TC-6.3:` | TC-6.1: tighten |
| 587 | 'moving out of a terminal workphase clears completedAt and assigns a fresh position' | `TC-6.2, TC-6.9:` | Partial for TC-6.9 |
| 603 | '… for an attached child (TC-2.13)' | `TC-2.13:` | |
| 647 | '… for a done item (TC-2.15)' | `TC-2.15:` | |
| 658 | describe 'multi-workphase active-scope reindex (TC-5.4/TC-5.6)' | No IDs on the describe | They go on its tests |
| 669 | 'reindexes every non-terminal workphase … (TC-5.4)' | `TC-2.12, TC-5.1, TC-5.4:` | Partial for TC-5.4 |
| 712 | 'excludes a done item from an active-scope reindex (TC-5.6)' | `TC-5.5:` | Today's ID is wrong |
| 747 | 'an attached-siblings reindex does not touch an unrelated workflow-wide item' | `TC-5.7:` | |
| 777 | "a workflow-wide reindex does not touch an unrelated parent's attached children" | `TC-5.8:` | |
| 1017 | "cascading a non-terminal-to-non-terminal move … (TC-2.25)" | `TC-2.25:` | |
| 1034 | 'ATT-1.4, ATT-1.5, TC-6.5: …' | `ATT-1.4, ATT-1.5, TC-6.5, TC-6.6:` | |

### hier (`server/tests/routes/items.hierarchy.test.ts`)

| Line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| 199 | 'validates the anchor against the resulting scope: a new sibling is accepted (TC-7.9)' | `TC-7.11:` | Replaces the deleted TC-7.9 |
| 280 | 'ATT-3.1, ATT-3.5, ATT-3.9, ATT-7.5, TC-7.12: …' | `ATT-3.1, ATT-3.5, ATT-3.9, ATT-7.5:` | Drops the deleted TC-7.12 |
| 352 | 'ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-7.3, TC-7.13: …' | `ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-7.3, TC-2.14, TC-7.13:` | TC-7.13: tighten |
| 370 | 'TC-7.7: attaching into an empty Stub list …' | `TC-2.20:` | Replaces the deleted TC-7.7 |
| 540 | 'ATT-6.1, ATT-6.2, TC-7.15: …' | `ATT-6.1, ATT-6.2, TC-2.20, TC-7.15:` | TC-7.15: tighten |
| 588 | 'a done Free item cannot be an anchor (TC-7.8 server half, TC-2.8)' | `TC-2.8:` | Partial; drops TC-7.8 |
| 677 | 'ATT-5.4: a Free reparent keeps every workphase, …' | `ATT-5.4, TC-7.17:` | R1 |
| 709 | "ATT-5.5: an attached reparent inherits the new workflow's workphase; …" | `ATT-5.5, TC-7.17:` | |
| 761 | 're-filing a foreign-workphase item into the new workflow assigns a fresh position (positioning §7.3)' | `TC-2.24, TC-7.17:` | "(positioning §7.3)" can go |
| 1013 | 'move: the response carries every renumbered {id, position} pair, the moved item included' | `TC-5.9, TC-5.10, TC-5.11, TC-5.14:` | Partial for TC-5.9 (R3) and TC-5.14 |
| 1032 | 'PUT and POST disclose the same way' | `TC-5.2, TC-5.10, TC-5.13, TC-5.14:` | Partial for TC-5.13 and TC-5.14 |
| 1055 | 'is absent when no reindex fired' | `TC-5.12:` | Partial |

### Other surface files

| File:line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| boardsRoute:103 | 'reports identical position … (TC-1.1)' | `TC-1.1:` | |
| columnsRoute:119 | 'creates a column spanning a range, defaulting displayMode to merged' | `TC-6.8:` | The all-non-terminal half |
| columnsRoute:311 | describe 'Epic 3.2 — terminal/non-terminal column ranges' | No ID | Provenance: drop "Epic 3.2 —" |
| columnsRoute:322 | 'POST rejects a range spanning a terminal and non-terminal workphase' | `TC-6.7:` | Partial |
| columnsRoute:333 | 'POST allows a range entirely within terminal workphases' | `TC-6.8:` | |
| columnsRoute:343 | 'PUT rejects extending a range to cross the terminal boundary' | `TC-6.7:` | Partial |
| siblingsAPI:60 | 'C before A — becomes the new true first sibling (TC-2.5-equivalent)' | `TC-2.5, TC-3.1, TC-3.2, TC-3.5:` | Partial for TC-2.5 |
| siblingsAPI:72 | 'C after A / C before B — … (TC-2.1-equivalent)' | `TC-2.1, TC-3.2, TC-3.5:` | |
| siblingsAPI:91 | 'A after C — becomes the new true last sibling (TC-2.4-equivalent)' | `TC-3.2, TC-3.5:` | No TC-2.4: `3.0 → 4.0` can't show rounding |
| crossColumnAPI:69 | '2.a — move C to before B' | `TC-7.4:` | The server half |
| crossColumnAPI:95 | '3.a — move C to after A' | `TC-2.10, TC-2.28:` | Partial for both |
| crossColumnAPI:108 | '3.b — move C to before E' | `TC-2.28:` | Partial |

**Counts:** 47 surface titles gain or change an ID: 24 in items, 12 in hier, 1 in boardsRoute, 4 in columnsRoute, 3 in siblingsAPI and 3 in crossColumnAPI. Three describes also lose their IDs or provenance: items:410, items:658 and columnsRoute:311. With these stamps alone, 27 cases are `Automated` at the confirming run.

### Internal stamps under existing pointers (no approval needed)

| File:line | Current title (start) | Proposed stamp |
|---|---|---|
| resolver:82 | 'breaks exact ties by createdAt, oldest first' | `TC-5.6:` (after the fixture fix) |
| resolver:152 | 'coarsest-fits between the anchor and its true next neighbor' | `TC-2.2:` |
| resolver:163 | 'finds the true neighbor even when it is not the literal next row created' | `TC-2.9:` (after tightening) |
| resolver:181 | 'appends past the anchor when it is the true last item' | `TC-2.4:` |
| resolver:220 | 'throws for an anchor with no position (a done item, per Part 6) (TC-2.8)' | `TC-2.8:` (the lib half; "per Part 6" can go) |
| resolver:264, :273 | 'returns 1.0 for a genuinely empty scope'; 'treats a scope holding only null-positioned rows … (regression: …)' | `TC-2.7:` (the bootstrap half). :273's "(regression: getLastPositionInScope missed an isNotNull guard)" is provenance |
| resolver:307 | 'does not reindex when a large position is proportionate to a large item count' | `TC-5.3:` |
| listOps:125 | 'union-sorts across the covered workphases, allowing genuine interleaving' | `TC-4.1:` |

Four cases are `Automated` by these alone: TC-2.2, 2.4, 4.1 and 5.3.

### For the Coder

- **Deleted and misattributed IDs:** Unknown IDs, above.
- **Provenance in titles,** in the files touched:
  - columnsRoute:311's "Epic 3.2 —";
  - resolver:273's "(regression: …)";
  - resolver:220's "per Part 6", which is optional, and items:1034's "(and stays out of Part 6 done-tracking)", which is optional too;
  - listOps:78's "(Epic 3.2 Part 6)" if it's touched.
  - "(wiki …)" and "(positioning §N)" pointers in titles can go, such as hier:761 and hier:1001's describe. hier:1001's "(wiki item-positioning §5)" should read §5.1 if it stays.
- **Comments in touched files** (Nathan's batch 3 ruling on bare and deleted IDs): reconcile:108's range tail, items:742's TC-5.6, and the `dragRequest.ts` and `itemWriteReconciliation.ts` lines above.

---

## Proposed Internal Mappings (need approval)

### A. Whole: each closes its case on approval

| Case | Test | Why internal |
|---|---|---|
| TC-2.16 | scopeLib:22 | Its pointer named the wrong file. **Surface alternative:** boardsRoute:133 already deletes a workphase out from under an item. One more line, `GET /items/:id` giving `positionScope` `"none"`, makes it a route test |
| TC-2.17 | scopeLib:34 | Its pointer named the wrong file. **Surface alternative:** items:1244 already creates a parentless item that holds the flag. One more line asserting `positionScope` `"workflow"` makes it a route test. It depends on a parentless create keeping the flag, which Ruling A allows (A5 writes it in) |
| TC-2.27 | listOps:292 | "`X.position` isn't given a value" isn't in the DOM; the rendered index needs a drag |
| TC-5a.2 | reconcile:130 | The inversion check only runs for a previewed write, so a surface test needs a drag and a stubbed response |
| TC-5a.4 | reconcile:49 with :26 | **Disclosed:** "sends no request" holds by construction (the reducer is pure), but no test observes it. **Surface alternative, no drag:** A3 UI, under Gaps |
| TC-5a.6 | reconcile:153 | A no-drag UI test can't fail (Gaps, "Internal only") |

**Recommended:** approve TC-2.27, 5a.2, 5a.4 and 5a.6. For TC-2.16 and 2.17, the one-line route tests are the surface form and cost almost nothing. Either way closes the case.

### B. Partial: the ID goes on, and the case stays `Open` until the rest lands

| Case | Test | The part it asserts | The rest |
|---|---|---|---|
| TC-2.11 | dragRequest's `describe('toRequest', …)` (:91), which covers every request shape inside it | Drag writes carry an anchor and a side, or a workphase, and no `position` | The inline create's body (A3 UI) |
| TC-2.29 | listOps:318 | The preview | A new internal test folding both responses |
| TC-2.30 | listOps:343 (the stamp moves to the front) | The position is kept and not `null` | A new internal test: another item's response lands while `X` is placed |
| TC-5a.1 | reconcile:26, :56; dragRequest:261 | The fold, and no reload after a drag write | Inline create and Sheet edit (A3 UI) |
| TC-5a.5 | listOps:73 | The tie | One assertion: a `null` position sorts as `0` |
| TC-7.1, TC-7.2, TC-7.4 | dragRequest:127 | The request form: first gives `others[0]` before, last gives `others[last]` after | TC-7.1 and 7.2's server values (A3 route); TC-7.4's server half is stamped on crossColumnAPI:69 |

### C. A category, like batch 3's clock-logic one

**Proposed:** "a client ordering or request rule whose only surface is a drag, tested in the pure modules `itemListOps.ts`, `itemWriteReconciliation.ts` and `dragRequest.ts`." It covers A, B, and four new internal tests:
- TC-2.28's client half: fold `X = 1.5` and `X = 2.5` into `A, C, E` and sort;
- TC-2.29's reconciled half;
- TC-2.30's re-sort half;
- TC-7.3: a tie given newest first, then `toRequest`'s first and last.

**With the category:** every client case closes in A3, and none goes to Story 10.

**Without it:** the drag-only halves go to Story 10 (Gaps). TC-5a.5's `null` half, TC-5a.6 and TC-7.3 have no surface test that can tell the rule from its failure.

**placement:63** ('DRAG-1.4, TC-2.11: …') asserts a placement, not a request. Under the category it can keep TC-2.11. Otherwise it drops it.

## Proposed Manual (need approval)

None. Every rule on this page reduces to stored values, response bodies, a request body, a rendered order or the tuning panel's inversion count. None depends on feel or on a tuned value.

---

## Gaps

### A3, route or API test

**Tightening an existing test** (R4 and fixtures):

| Case | P | What changes |
|---|---|---|
| TC-2.9 | P0 | resolver:163: exactly `2.9` |
| TC-2.19 | P0 | items:354: exactly `3` (past `Parent` at `2.0`), and `positionScope` `"workflow"` |
| TC-5.6 | P1 | resolver:82, or a route test: insert the tied rows newest first, or set `createdAt` so the older row is inserted later. The older still takes the lower value |
| TC-6.1 | P0 | items:328 and :577: `completedAt` lies between timestamps read just before and just after the request |
| TC-7.11 | P0 | hier:260: exactly `1.5` |
| TC-7.13 | P0 | hier:352: exactly `10.5` |
| TC-7.15 | P0 | hier:540: exactly `1.5` |
| TC-X.6 | P1 | items:462: exactly `2` |

**Partly asserted.** Extend a stamped test or write a new one; that's the Coder's call.

| Case | P | What the test asserts |
|---|---|---|
| TC-2.5 | P0 | Starting from a true first item at `1.0`, repeatedly place a new item before the current first until a response carries `reindexed` (about 40 steps at the resolver's 12 decimal places). Every resolved position is `> 0` |
| TC-2.6 | P1 | A Free item at `4.2` in `W2` (raw position); a top-level item created in `W1` with no anchor gets `5` |
| TC-2.7 | P0 | `W1` holds an item at `3.0` and `W2` is empty: a create in `W2` gets `4`, not `1.0` |
| TC-2.8 | P1 | hier:588 and items:487, each with a `workphaseId` in the request: 400, and the mover's `workphaseId` and `position` are unchanged |
| TC-2.10 | P0 | crossColumnAPI:95's scenario, or a route test, plus an attached child of `A` at `1.2`: `C` after `A` is still `1.5` |
| TC-3.4 | P0 | `P`'s attached children at `1.0` and `2.0`; Free items and `Q`'s children above them. A create under `P` gets `3` |
| TC-5.4, TC-5.13 | P0 | One test: `A` at `1100` in `W1`, `B` at `1200` in `W2`, then a create in `W1`. `B` is renumbered in the same sequence (`A = 1`, `B = 2`, new = `3`), and `reindexed` holds `B`'s pair |
| TC-5.12 | P1 | An append under the threshold (a plain `POST`) has no `reindexed`, or an empty one |
| TC-5.14 | P1 | A move beside its anchor into a tight gap carries `reindexed`. It can share a test with TC-5.9 once R3 is settled |
| TC-6.7 | P0 | After columnsRoute:322's refusal, the board has no new column. After :343's, the column's range is unchanged |
| TC-6.9 | P1 | `X` created active, then moved to Done, and `E` at `6.0`. `X` reopened with no anchor gets `7`, not its old value |
| TC-7.14 | P1 | Exactly `1.5` on hier:636. Also a Free `X` at `5.0`, created with `isAttached: false` (heads-up), reparented across projects of one workflow with no anchor, stays Free at `5.0` |

**No test yet:**

| Case | P | What the test asserts |
|---|---|---|
| TC-2.31 | P2 | Free `X` at `1.0` in `W1`, the workflow's other last Free item at `2.0`. `PATCH /move {workphaseId: W1}` gives `X.position` `3`. **Passes today** |
| TC-X.1 | P1 | `P` with detached children `D1` at `1.0` and `D2` at `3.0`, and top-level `T` at `2.0`. `D2` placed after `D1` gets `1.5` |
| TC-7.1 (server half) | P0 | `A`, `B`, `C` at `2.0`, `3.0`, `4.0`, with `A` the true first: `{anchorId: A, side: before}` gives `1` |
| TC-7.2 (server half) | P0 | After `C`, the true last at `4.0`: `5`. With an unseen item at `4.4`: `4.2` |

**After a ruling:** TC-5.9, once R3 fixes its values: a tight gap, `X` after `A`, and every pair asserted. TC-7.17's line in hier:677, if R1 changes the code.

### A3, UI without a drag

| Case | P | What the test asserts |
|---|---|---|
| TC-6.4 | P0 | Seed `D1`, `D2`, `D3` in order, then move `D2`, `D3`, `D1` to Done through the API, with a short wait between moves so the `completedAt` values differ. The Done column renders `D2, D3, D1` |
| TC-2.11 (part) | P0 | Add an item through a column's inline form. The captured `POST /api/items` body has no `position` |
| TC-5a.1 (part) | P0 | **An inline create** into a column seeded near the magnitude threshold (raw positions `1100` and `1200`): the column renders in the server's new order, and no board reload request follows the write. **A Sheet edit** (detach from the item's own panel): the item appears at the server's position with no reload |
| TC-5a.4 (alternative to the mapping) | P1 | On a child project's board, inherited workflow, with the parent project's items near the threshold: an inline create reindexes them. No `GET` goes out for their ids, and the board gains exactly one card |

### Story 10

None, if Nathan approves category C.

Without it, these need a drag:
- **TC-5a.1's board-move and sibling-reorder halves.** bandsUI:762 already makes a board move.
- **TC-2.11's drag requests:** capture the `/move` body in any drag spec.
- **TC-2.27:** the rendered index while pending. `X.position` can't be observed at all.
- **TC-2.28's client half:** crossColumnUI:219 and :231 already make the gesture and would add a rendered-order read.
- **TC-2.29:** two quick drops with delayed responses, like bandsUI:793.
- **TC-2.30:** `data-pending` and the slot while another write lands.
- **TC-5a.2:** a drop whose response `page.route` fulfills with synthetic pairs, then `data-inversion-count`.
- **TC-7.1, 7.2 and 7.4's request halves:** capture the `/move` body in bandsUI:244's band releases.

### Internal only

For each client case: the internal test that does it, and whether Playwright could observe the rule instead.

| Case | Internal test | Playwright could observe it through | Needs a drag? |
|---|---|---|---|
| TC-2.11 | dragRequest `toRequest` describe (the drag writes) | the request body | Drag writes: yes. The inline create: no (A3 UI) |
| TC-2.27 | listOps:292 | the rendered index while pending; not the position clause | Yes |
| TC-2.28 | new: fold and sort | the rendered column after the response | Yes |
| TC-2.29 | listOps:318, plus a new reconciled-half test | the rendered order after two responses | Yes |
| TC-2.30 | listOps:343, plus a new re-sort test | `data-pending` and the slot | Yes (`X` has to be pending from a drop) |
| TC-5a.1 | reconcile:26, :56; dragRequest:261 | the rendered order, and the absence of a reload request | Inline create and Sheet edit: no. Board move and sibling reorder: yes |
| TC-5a.2 | reconcile:130 | `data-inversion-count` after a drop with a stubbed response | Yes |
| TC-5a.4 | reconcile:49, :26 | the request log and the card count | No (A3 UI, optional) |
| TC-5a.5 | listOps:73, plus a `null` row | the rendered order of a tie | No drag, but it can't discriminate. Items arrive in creation order, so a board shows the same order with or without the tie-break. A `null`-position item in an active list can't be reached through the API |
| TC-5a.6 | reconcile:153 | `data-inversion-count` after a panel detach | No drag, but it can't fail: the Stub isn't in the positioned order before the write, so a tripwire has nothing to compare |
| TC-7.1, TC-7.2 | dragRequest:127 | the `/move` body of a top-band or bottom-band release | Yes |
| TC-7.3 | new: a tie given newest first, then `toRequest` | the request body. It can't discriminate, for the same arrival-order reason as TC-5a.5 | Yes |
| TC-7.4 | dragRequest:127 | the `/move` body of a drop into a column whose true first sits in another column | Yes |

### Manual proposal

None.

### Would fail against today's code

As the catalog now reads, after the Test Planner's response (Addendum):
- **TC-5.15**, new: the magnitude threshold counts done items today, so a test written to the case gets `1041` where the case expects `6`.
- **TC-7.18**, `Pending PO` and so not mapped: a test fails today if the PO answers `"none"`, since hier:697 pins `"workflow"`.

TC-2.1, 5.9 and 7.17 no longer fail: the Test Planner revised all three. Every other gap's test would pass today, **TC-2.31 included**.

---

## Duplication

Reported, not judged.

- **Anchor arithmetic on four layers,** with the same numbers (`0.5`, `1.5`, `4.0`/`6.0`, `4.5`):
  - the lib: resolver:152, :163, :181, :191;
  - the route: items:431, :441, :452, :398;
  - the API: siblingsAPI (the attached scope), crossColumnAPI and crossProjectAPI (eight each; the second file says it is the first relabeled from workphases to projects);
  - the UI: crossColumnUI and crossProjectUI repeat the API suites' expected values through drags.
- **Reindexing:** resolver:82, :201 and the projects-table copy at :349; route items:669, :747, :777; hier:1013, :1032.
- **Disclosure:** resolver:104, :122, :137 (lib) and hier:1013, :1032, :1055 (route) assert the same three facts.
- **`positionScope`:** scopeLib:5–:34 (all six classifications) and route items:603, :617, :638, :647, plus assertions across hier.
- **The tie-break in four places:** resolver:82 (the server's reindex), listOps:73 (the client's sort), and the test helpers `itemRepositioningScenario.ts::orderOf` and `siblingOrder`, which apply it themselves.
- **Done-list order:** listOps:78 (a workphase), listOps:143 (a merged column), and listOps:93 (no `completedAt` sorts last, DRAG-6.11's rule).
- **The attached-child terminal cascade:** items:1034 carries ATT-1.4, ATT-1.5, TC-6.5 and (proposed) TC-6.6; scopeLib:11 is the lib copy of TC-6.6.
- **Overlap inside the catalogs, for the Test Planner:**
  - TC-2.27 and DRAG-6.1: the pending index;
  - TC-2.30's re-sort half and DRAG-6.2's second sentence;
  - TC-7.1's and 7.2's request halves, and DRAG-3.1 and 3.2;
  - TC-7.4's server half and TC-2.9;
  - TC-2.1 and TC-2.2: both pin a coarsest fit;
  - TC-2.12 and TC-5.1;
  - TC-5.2 and TC-5.14's magnitude half;
  - TC-5.9 and TC-5a.2: the same illustrative values;
  - TC-2.24's second half and TC-6.9;
  - TC-2.19 and ATT-7.2 (items:354); TC-2.21 and ATT-3.1 (items:376); TC-2.20 and ATT-6.1 (hier:540);
  - TC-7.10 and ATT-3.7 (hier:209); TC-7.11 and ATT-1.7/3.6 (hier:260); TC-7.17 and ATT-5.4/5.5 (hier:677, :709);
  - TC-6.6 and ATT-1.4: both assert `"attached-siblings"` under a terminal cascade.

## Test Quality Concerns

1. **items:338 'attaching to a parent reassigns a fresh position scoped to the new siblings'** can't tell "fresh" from "kept".
   - The detached item's workflow position (`2.0`, after `Parent` at `1.0`) equals the expected sibling position (`2.0`, after the existing sibling at `1.0`).
   - TC-2.20's own fixture uses `5.0` for this reason. That's why hier:540 and hier:370 are proposed instead.
2. **items:258 'a workphaseId-only move (no position given) defaults to the end of the target workphase'** states the rule §2 replaced: a workphase-only move keeps its position.
   - It passes only because the moving item was created after the other one, so its kept position is already higher.
   - items:284 asserts the rule (TC-2.24). This test wants retitling or removing.
3. **items:410's describe 'detached siblings sharing one workphase (TC-X.1)'** holds three tests of top-level items, which assert TC-2.5, 2.1 and 2.4-style values. Nothing in it is a detached child, so TC-X.1 is unbacked.
4. **items:658 and :712 carry TC-5.6 for the done-item exclusion,** which is TC-5.5's rule. items:742's comment repeats it.
5. **resolver:82 'breaks exact ties by createdAt, oldest first'** can't tell a `createdAt` tie-break from row order.
   - The tied rows were inserted in creation order, and their `createdAt` values may share a millisecond.
   - It needs the older row inserted later (TC-5.6).
6. **The resolver tests scope by one workphase** (How to read this report). TC-2.10's pointer to them could never show a workflow-wide scope.
7. **listOps:78 'sorts by completedAt instead of position for a terminal workphase (Epic 3.2 Part 6)'** is a two-item fixture with equal `createdAt`. It shows `completedAt` beats list order, but not TC-6.4's "neither position nor creation time plays a part".
8. **items:587 (TC-6.9)** creates the item already done, so it never had a position to come back. It also asserts only `> existing.position`.
9. **hier:697** asserts `positionScope` `"workflow"` for an item wiki §7.3 says reads `"none"` (R1).
10. **placement:63 carries TC-2.11,** but asserts the placement a release resolves to, not the request TC-2.11 is about (Unknown IDs).
11. **items:398 'move resolves anchorId+side against the true neighbor, not a client-supplied guess'** asserts a range, and sends no client-supplied value to contrast with. items:441 pins the same rule exactly.
12. **The ranges in R4:** resolver:163, items:354, :462, :328, :577, hier:260, :352, :540, :636. Also resolver:296 asserts `< 10` where `n + 1 = 2` is exact, but TC-5.2 is pinned exactly elsewhere (hier:1032, resolver:122).
13. **`client/src/api/items.ts::reorderItems`** sends raw positions to `PATCH /api/items/reorder`, and nothing calls it. TC-2.11's request tests can't catch a future call. It's dead code for the Coder or the API contract epic, not a test fix.

## Uncatalogued Tests

**Guards and gate tests.** No standalone rule on this page matches them, so no mapping is forced:
- **Request-shape validation** (the API contract epic's):
  - items:209 'returns 400 for a non-numeric or non-finite raw position';
  - items:480 'move rejects an invalid side when anchorId is given';
  - hier:224 'rejects the item as its own anchor with a 400, not a 500' (candidate 1).
- **Sanity checks against a false rejection:** items:557 and items:566 'still allows anchoring within the same … scope'.
- **items:617 'GET attaches positionScope to the item and to every child in its children array':** a batching regression guard for TC-2.13–2.15.
- **items:224 'a position-only move does not add a new status_change entry beyond the one logged at creation':** activity logging.
- **The resolver's coarsest-fit tests:** resolver:54 (the deleted TC-2.3's example), :63, :67, :72 and :76. :76 (`null` at maximum precision) is what triggers TC-2.12.
- **resolver:241 and :251:** a no-anchor "before", the prepend-first path, which the project tree uses.
- **resolver:347–:408, the projects-table copy:** project positioning has no catalog. The sidebar's rules move with A5.
- **scopeLib:5, :26, :30:** lib copies of TC-2.13, 2.15 and 2.14.
- **listOps:**
  - the rendered-reads tests;
  - `getWorkphaseItemsFrom`'s project filter;
  - `getAttachedChildrenFrom`;
  - `hierarchyRows` and `descendantsChildrenOf`;
  - `removeItemAndDescendants` and `computeChildCounts`;
  - `applyPlacements`' other slots, including :330's anchor missing from a narrowed view;
  - the selectors-with-placements tests.

  These are board and drag plumbing, and DRAG's.
- **reconcile:**
  - :44 'the written row wins over its own pair' (candidate 4);
  - :64 (a create is appended);
  - :56 and :71 (row references kept, the deleted TC-5a.3's idea);
  - `freeItemOrder` and `findInversion`, which are DRAG-6.4's machinery;
  - :161 and :172 (other and replaced placements, DRAG-6.8 and 6.9 territory).
- **crossProjectUI '1.b — …' and '4.a — …', which carry no ID:** drag versions of crossProjectAPI's values.

**The raw-position escape hatch:** items:271 'an explicit position on a move is respected as-is, not overridden by the default', and items:812's describe 'PATCH /api/items/reorder' (five tests). Candidate 3.

## Candidate New Cases

"TP gap" means the rule is already in the wiki. "PO gap" means the wiki doesn't state it.

1. **An item named as its own anchor is refused with a 400, and nothing is written** (hier:224).
   - The mover is outside its own scope, so wiki §7.1's "an anchor outside the resulting scope is rejected" arguably covers it.
   - But the wiki never says so. **PO gap, low.** It's close to TC-X.6.
2. **An anchor from another workflow is refused** (items:537 'rejects anchoring against an item in a different workflow').
   - Wiki §2 makes the workflow the scope, and §7.1 refuses an anchor outside it.
   - TC-7.10 covers only an attached-scope mismatch. **TP gap, P2.**
3. **The API accepts a final number:** `PATCH /move` with a raw `position` (items:209, :271), and `PATCH /items/reorder` (items:812's describe).
   - §2 says writes send relative intent. The route comment calls the raw `position` "an escape hatch for non-drag callers (MCP, scripts, tests)", and the E2E seed helpers rely on it.
   - The wiki doesn't mention either. **PO gap:** document it, or retire it in the API contract epic.
4. **A response is applied pairs first, then the written row** (reconcile:44), as §5a's steps 1–2 say.
   - Against a correct server the two can't disagree, since TC-5.11 pins them equal. So the order is visible only to a client test.
   - **TP gap, low.** Its companion, "compare only after both" (step 3), is TC-5a.2.
5. **Two done items with the same `completedAt` sort by `createdAt`** (listOps:106).
   - §5a's tie-break names `position` then `createdAt`, and §6 says a done list is ordered by `completedAt`. No sentence says what breaks a `completedAt` tie. **PO gap, low.**
6. **Not from a test, but found reading the resolver:** the magnitude threshold's `n` counts every row in the scope, `null`-position done items included (`positionResolver.ts::exceedsMagnitudeThreshold` has no `isNotNull` filter).
   - §5 says "`n` is the number of items in the scope", and §6 excludes done items from reindexing.
   - Whether done items count toward `n` is unsettled. **PO gap, low.** No test exercises it.

No case here differs from another only in being made through an MCP tool.

---

## Totals

These are the figures after the Test Planner's response (78 cases), with the Addendum's mappings.

For the 74 cases the proposing run first mapped, the figures were:
- 27 `Automated` by surface stamps, and 4 under existing internal pointers;
- 6 internal mappings to approve;
- 8 to tighten, 13 to stamp with a route test to follow, 2 route tests with nothing yet, and 1 UI test with no drag;
- 10 split client cases;
- 3 waiting on a ruling (TC-2.1, 5.9, 7.17).

### The catalog as it stands (this run changes nothing)

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Legacy ✅ | 28 | 16 | 2 | 46 |
| `Open` | 16 | 10 | 3 | 29 |
| `Pending PO` | 0 | 1 | 2 | 3 |
| **Total** | **44** | **27** | **7** | **78** |

### Proposed outcomes

| Outcome | P0 | P1 | P2 | Total | Cases |
|---|---|---|---|---|---|
| `Automated` by surface stamps (TC-6.5 is already mapped by ID) | 17 | 9 | 2 | 28 | 1.1; 2.1, 2.12, 2.13, 2.14, 2.15, 2.18, 2.20, 2.21, 2.23, 2.24, 2.25; 3.1, 3.2, 3.5; 5.1, 5.2, 5.5, 5.7, 5.8, 5.10, 5.11; 6.2, 6.3, 6.5, 6.6, 6.8; 7.17 |
| `Automated` by stamps under an existing internal pointer | 3 | 1 | 0 | 4 | 2.2, 2.4, 4.1, 5.3 |
| Internal mapping, whole (approval) | 2 | 3 | 1 | 6 | 2.16, 2.17, 2.27, 5a.2, 5a.4, 5a.6 |
| A3: tighten or fix a fixture | 6 | 2 | 0 | 8 | 2.9, 2.19, 5.6, 6.1, 7.11, 7.13, 7.15, X.6 |
| A3: stamp now, route or API test for the rest | 8 | 7 | 0 | 15 | 2.5, 2.6, 2.7, 2.8, 2.10, 3.4, 5.4, 5.9, 5.12, 5.13, 5.14, 6.7, 6.9, 7.10, 7.14 |
| A3: route test, nothing yet | 0 | 1 | 2 | 3 | 2.31, X.1, 5.15 (fails today) |
| A3: UI with no drag | 1 | 0 | 0 | 1 | 6.4 |
| Client cases, split (Gaps, "Internal only") | 7 | 3 | 0 | 10 | 2.11, 2.28, 2.29, 2.30, 5a.1, 5a.5, 7.1, 7.2, 7.3, 7.4 |
| `Pending PO`, not mapped | 0 | 1 | 2 | 3 | 2.32, 6.10, 7.18 |
| **Total** | **44** | **27** | **7** | **78** | |

**Of the 46 ✅ cases:**
- 29 hold as stamps (TC-2.1 among them, now that it's a move), and 2 hold once Nathan approves the corrected internal pointer (TC-2.16, 2.17).
- 15 don't hold as they read now: TC-2.6, 2.7, 2.8, 2.9, 2.10, 2.19, 3.4, 5.4, 5.6, 6.1, 6.4, 6.7, 6.9, X.1 and X.6.
- Three pointers named the wrong file (TC-2.16, 2.17, 6.6), and TC-2.10's pointed at tests that can't assert its rule.

**Expected after the confirming run:**
- **If Stop 1 approves the six whole mappings and nothing else lands:** 38 `Automated`, 37 `Open` and 3 `Pending PO`.
- **If the A3 Coder also closes every tighten, route, API and no-drag UI gap:** 65 `Automated`. That's 38, plus 8 tightened, plus 18 route cases, plus TC-6.4. TC-5.15 counts only if its one-line code fix lands in A3 too.
- **The other 13:** the 10 client cases close in A3 under category C, and otherwise part-route to Story 10. The 3 `Pending PO` cases wait on questions 17, 19 and 20.

---

## Addendum: after the Test Planner's response

**Run:** still proposing, 2026-09-28. The source is the Test Planner's changes in A3's Amendments ("2026-09-28, batch 5 step 2") and Open questions 17–20. I re-read every changed case in `docs/test-plans/item-positioning/`.

**Where this supersedes the earlier sections:**
- the rows for TC-2.1, 2.11, 5.9, 5.13, 5.14, 7.10, 7.14 and 7.17 in Coverage Mapping, Proposed Stamps and Gaps;
- R1–R3;
- the earlier "Would fail" list, which is now updated in place.

### Revised cases

| Case | P | What changed | Tests | Asserted | Missing | Outcome now |
|---|---|---|---|---|---|---|
| TC-2.1 ✅ | P0 | A move only (R2) | items:441 'C after A / C before B — same true-neighbor midpoint from either anchor'; siblingsAPI:72 | Exactly `1.5` between `1.0` and `2.0`: both tests use `toBe(1.5)`, so R4 doesn't touch it | — | **Stamp.** `Automated` |
| TC-2.11 | P0 | "An inline create into a slot" is now "an inline create" | As before: dragRequest's `toRequest` describe (internal); placement:63 carries the ID | The drag writes' request shapes | The inline create's body: `useItemManagement.ts` sends `{type, title, projectId, workphaseId}` today, so a no-drag UI test passes | Unchanged: client, split. Internal (partial) + A3 UI |
| TC-5.9 | P0 | Tight gap: a reindex to `A = 1`, `C = 2`, `E = 3`, then `X` at `1.5`; the disclosure holds `A → 1`, `C → 2` and `E → 3` (R3) | items:669 'reindexes every non-terminal workphase in the workflow together, in one coordinated pass (TC-5.4)' makes exactly this write, a tight-gap move, but never reads `reindexed` | The reindex and the `1.5`, but not the disclosure | One assertion on items:669's response, below | **Stamp + A3 route.** Passes today |
| TC-7.10 | P1 | Two more rejected anchors: one in another workflow, and the moving item itself. Each is "rejected the same way, and changes nothing" | hier:209 (the attach, with `X`'s and `X1`'s rows unchanged); items:510 (`F` naming another parent's Stub); items:537 'rejects anchoring against an item in a different workflow'; hier:224 'rejects the item as its own anchor with a 400, not a 500' (the row unchanged) | All four are refused with a 400. hier:209 and hier:224 re-read the row | "Changes nothing" for items:510 and items:537: neither re-reads the mover | **Stamp + A3 route.** It was "Stamp" before, since the old text asked only for `F`'s rejection |
| TC-7.14 | P1 | `X` is now a detached child of an item in `P1`, which answers the Ruling A heads-up | hier:636 (the attach half; its `X` is top-level) | The cross-project attach, as a range | Exactly `1.5` on hier:636 (R4); the Free half: a detached `X` at `5.0`, reparented to `B` in `P2` with no anchor, stays Free at `5.0` | Unchanged: **Stamp + tighten + A3 route.** The Free half passes today, with no Ruling A dependency: `applyHierarchyRequest` leaves the position alone, and `nullForeignWorkphasePositions` finds nothing foreign on one workflow |
| TC-7.17 | P1 | The `positionScope` clause went to TC-7.18 (R1) | hier:677 (`X` and `X2` are `null`, `X1` stays `1.0`); hier:761 (the re-file appends: `4`, past `3.0`); hier:709 (attached: `X` takes `1.0` among `B`'s children, `X2` is `null`) | All of it | — | **Stamp.** `Automated`, and passes today |

**For TC-5.9, one assertion closes three cases.** Add `expect(res.body.reindexed).toEqual([...])` to items:669.

**What it pins:** `T1 → 1`, `T2 → 2`, `P1 → 3` and the mover `→ 1.5`. The route appends the written item's own pair, which is TC-5.11's rule, so the list is exactly these four.

**What it closes:**
- **TC-5.9:** every renumbered item is disclosed after a tight gap. The fixture differs: `P1` sits at `5.0` in another workphase, not just above `A`. The values are exact, and they tell disclosure from silence, which is the failure the case names.
- **TC-5.13's missing half:** `P1` is in In Progress, and the write is in Todo. That's a `W2` item disclosed for a reindex a `W1` write triggers.
- **TC-5.14's missing half:** the tight-gap trigger, on a move.

**If Nathan wants the case's own fixture** instead, a new route test works:
- the fixture: `A` at `1.0`, `C` at `1.0 + 1e-13`, `E` at `1.0 + 2e-13`, and `X` placed after `A`;
- the result: pairs `A → 1`, `C → 2`, `E → 3` and `X → 1.5`, and sorting by the applied pairs reads `A, X, C, E`.

**Passes today** either way: `reindexPositionsInScope` reports every renumbered row, and `respondWithItem` appends the written one.

TC-5.4's magnitude half still needs its own test, as before: `W1` at `1100`, `W2` at `1200`, then a create in `W1`.

### New and `Open`: TC-5.15 (P2)

**The case:** 950 done Free items and 5 active ones, the last at `1040`. An appended Free item should reindex the scope first and take `6`, since `n` is 5 and `1041` crosses `max(1000, 105)`.

**Tests:** none.

**A3 route:**
- **Seed:** the 950 done items by direct insert (`position` `null`, `completedAt` set, a terminal workphase, `isAttached` 0), as resolver:307 bulk-inserts its filler. The five active items go in at raw positions ending at `1040`.
- **Write:** `POST` a Free item in an active workphase.
- **Expect:** `position` `6`, and `reindexed` holding the five active items at `1`–`5` and the new item at `6`.

**Fails today.**
- `positionResolver.ts::exceedsMagnitudeThreshold` counts every row the scope matches, and the workflow scope includes terminal workphases. So `n` is `955`.
- `1041` doesn't reach `1055`, so nothing reindexes and the item gets `1041`.

**The fix is one filter:** `isNotNull(table.position)` on that count, as `getLastPositionInScope` already has. It's table-generic, but it changes nothing for projects, which have no done state.

**It waits on the PO's answer to Open question 18** (Ruling D) before A3's Coder makes the fix. The Test Planner reads the page as clear. If the fix doesn't land in A3, the case needs a routing.

### New and `Pending PO`: not mapped

These are the tests that pin today's behavior, so each answer can be checked against them.

**TC-2.32, a write that names a final position (question 19).** The API accepts one today, in both forms.
- **A raw `position` on `PATCH /move`:**
  - items:271 'an explicit position on a move is respected as-is, not overridden by the default';
  - items:209 'returns 400 for a non-numeric or non-finite raw position', which accepts `5` and refuses only non-finite values;
  - items:224 'a position-only move does not add a new status_change entry …'.
- **`PATCH /items/reorder`:** items:812's describe, five tests (:813, :818, :833, :844, :855). It sets positions outright and returns 200.
- **Test setup that depends on the raw position:**
  - `tests/helpers/seed.ts::seedPositionedItems` pins every interleaved scenario. That's crossColumnAPI, crossProjectAPI, bandsUI, crossColumnUI and crossProjectUI;
  - bandsUI:275;
  - `tests/api/attachedChildren.spec.ts`:38, attachedUI:330, and `tests/ui/boards.spec.ts`:182;
  - many route fixtures in items and hier: items:293, :470, :675–:683, :717–:722, :753–:759, :783–:791, plus hier's `setPosition`, which writes the database directly and so doesn't depend on the endpoint.
- **In the client,** `api/items.ts::reorderItems` and `MoveItemInput.position` exist, and no caller uses either.
- **The MCP server** doesn't send a position (`mcp.ts`, `move_item`).
- **If the PO retires both forms,** `seedPositionedItems` and the route fixtures need another way to seed, such as direct database writes.

**TC-6.10, two done items with the same `completedAt` (question 20).**
- listOps:106 'breaks an exact completedAt tie by createdAt, oldest first' pins today's answer: the one created first comes first.
- The same comparator (`itemListOps.ts::byCompletedAtThenCreatedAt`) orders a merged done column, and no test covers a tie there.
- The server never sorts a done list.

**TC-7.18, the `positionScope` of an item left in another workflow's workphase (question 17).**
- hier:697, inside hier:677 'ATT-5.4: …', asserts `"workflow"` today.
- scopeLib:30 'classifies a detached/root item in a non-terminal workphase as workflow' pins the classifier's inputs: it sees whether the workphase is terminal, and nothing about the item's project's workflow.
- **If the PO answers `"none"`:** hier:697 flips, `classifyPositionScope` needs the project's workflow as an input, and a TC-7.18 test fails until then. ATT-5.4's and TC-7.17's *Then*s don't mention `positionScope`, so neither is affected.

### Changes to Proposed Stamps

**New surface stamps (no approval):**

| File:line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| items:537 | 'rejects anchoring against an item in a different workflow' | `TC-7.10:` | Partial until it re-reads the row |
| hier:224 | 'rejects the item as its own anchor with a 400, not a 500' | `TC-7.10:` | Whole for its bullet |

**Changed stamps:**

| File:line | Proposed before | Proposed now | Why |
|---|---|---|---|
| items:669 | `TC-2.12, TC-5.1, TC-5.4:` | `TC-2.12, TC-5.1, TC-5.4, TC-5.9, TC-5.13, TC-5.14:` | Partial for TC-5.4. TC-5.9, 5.13 and 5.14 become whole for its part once the assertion lands |
| hier:1013 | `TC-5.9, TC-5.10, TC-5.11, TC-5.14:` | `TC-5.10, TC-5.11, TC-5.14:` | TC-5.9's tight gap is items:669's |

**Unchanged, but now whole:**
- items:441 and siblingsAPI:72 for TC-2.1;
- hier:677, :709 and :761 for TC-7.17.

**Counts:** 49 surface titles gain or change an ID, up from 47. The three describe edits are unchanged. Stamps alone make 28 cases `Automated`.

### Changes to Gaps

**A3, route or API test, added:**

| Case | P | What the test asserts |
|---|---|---|
| TC-5.9 (with TC-5.13's and TC-5.14's missing halves) | P0 | items:669's `reindexed`: `T1 → 1`, `T2 → 2`, `P1 → 3`, mover `→ 1.5`. **Passes today** |
| TC-7.10 | P1 | After items:510's and items:537's refusals, the mover's `position`, `workphaseId` and `parentId` are unchanged. **Passes today** (validation answers before any write) |
| TC-7.14 (Free half) | P1 | A detached child `X` at `5.0` in `P1`, reparented with no anchor to Free `B` in `P2` on the same workflow: Free, `5.0`, `projectId` `P2`. **Passes today** |
| TC-5.15 | P2 | As above. **Fails today;** closes with the one-line fix |

**Removed:** TC-5.13's and TC-5.14's separate rows (folded into TC-5.9's assertion), and the earlier "after a ruling" line.

**Unchanged:** A3's UI with no drag, Story 10, Internal only and Manual (none). TC-2.11's inline-create half stays an A3 UI test.

### Would fail against today's code

- **TC-5.15:** it gets `1041` where the case expects `6`.
- **TC-7.18** (`Pending PO`): a test fails if the PO answers `"none"`.

TC-2.1, 5.9 and 7.17 now pass today, and so does every other gap's test.

### Totals

Updated in place (Totals, above): 78 cases.
- 28 `Automated` by surface stamps, and 4 under existing pointers;
- 6 internal mappings to approve;
- 8 to tighten, 15 to stamp with a route test to follow, 3 route tests with nothing yet, and 1 UI test with no drag;
- 10 split client cases;
- 3 `Pending PO`.

---

## Confirming run (2026-09-29)

**Inputs:**
- A3's Amendments entry "2026-09-29, batch 5 Stop 1 (Nathan's rulings)": the rulings and the Coder's brief. The Coder left no notes, so everything below comes from the tests as they now stand.
- The catalog as Stop 1 left it: 78 cases, of which 46 carry ✅, 29 are `Open` and 3 are `Pending PO`.

**What this run wrote,** in `docs/test-plans/item-positioning/`. On 75 cases, it set the status in the suite table and on the status line, and the `**Automation test:**` line:
- the 46 ✅ cases and 28 of the `Open` ones → `Automated`;
- TC-5.15 stays `Open` with `—`, routed to Epic 4.

**Pointers corrected:** TC-2.16's line now names `server/tests/routes/boards.test.ts`, and TC-2.17's and TC-6.6's name `server/tests/routes/items.test.ts`. All three had named `positionResolver.test.ts`.

**Other ✅ pointers that changed,** because the tests carrying the ID moved:
- TC-2.1 is now route and API, with no resolver;
- TC-2.6 and 5.1 are now route only;
- TC-2.10 is now route and API;
- TC-5.2 is now `items.hierarchy.test.ts`;
- TC-2.7, 2.8, 2.14, 2.20 and 2.24 each gained a file.

**Left alone:**
- the 3 `Pending PO` cases (TC-2.32, 6.10, 7.18), which keep their status and `—`;
- every case's text, title and priority;
- every test and wiki page.

**Which tests count:**
- surface tests;
- the existing pointers: the resolver, and listOps for TC-4.1;
- the four approved mappings: TC-2.27, 5a.2, 5a.4, 5a.6;
- the approved client category: tests in `itemListOps.test.ts`, `itemWriteReconciliation.test.ts` and `dragRequest.test.ts`, plus placement:63 for TC-2.11.

Each Automation test line lists every counting file whose tests carry the case's ID in the README form. Titles in `itemPositionScope.test.ts` still end in "(TC-6.6)", "(TC-2.16)" and "(TC-2.17)". They count for nothing: the IDs aren't at the front, and the file isn't approved.

**One more alias:** itemsUI is `tests/ui/item-positioning.spec.ts`, the Coder's new spec. The others are as at the top of the report, and line numbers are the files' current ones.

### Result: as expected

**74 `Automated`, TC-5.15 `Open` and routed to Epic 4, and 3 `Pending PO` routed to A5.** No case differs from the expected result. Six cases rest on a reading, disclosed below.

**How they're backed:**
- 52 by surface tests alone;
- 14 by internal tests alone:
  - 6 under existing pointers: TC-2.2, 2.4, 2.9, 4.1, 5.3, 5.6;
  - 8 under the approvals: TC-2.27, 2.29, 2.30, 5a.2, 5a.4, 5a.5, 5a.6, 7.3;
- 8 by both: TC-2.7, 2.8, 2.11, 2.28, 5a.1, 7.1, 7.2, 7.4.

| Case | Tests carrying its ID | Automation test |
|---|---|---|
| TC-1.1 | boardsRoute:103 | boardsRoute |
| TC-2.1 | items:608; siblingsAPI:72 | items, siblingsAPI |
| TC-2.2 | resolver:156 | resolver |
| TC-2.4 | resolver:184 | resolver |
| TC-2.5 | items:356 (repeated prepends through a reindex, all `> 0`), :598; siblingsAPI:60 | items, siblingsAPI |
| TC-2.6 | items:126, :317 (`4.2` in another workphase gives `5`) | items |
| TC-2.7 | items:126, :324 (an empty `W2` gives `4`); resolver:267, :276 | items, resolver |
| TC-2.8 | items:653, :661; hier:584 (the row is unchanged after each refusal); resolver:223 | items, hier, resolver |
| TC-2.9 | resolver:167 (exactly `2.9`) | resolver |
| TC-2.10 | items:331 (`1.5`, with `A`'s attached child at `1.2`); crossColumnAPI:95 | items, crossColumnAPI |
| TC-2.11 | itemsUI:61 (the inline create's body); dragRequest's `toRequest` describe (:91); placement:63 | itemsUI, dragRequest, placement |
| TC-2.12 | items:842 | items |
| TC-2.13 | items:782 | items |
| TC-2.14 | items:817; hier:351 | items, hier |
| TC-2.15 | items:826 | items |
| TC-2.16 | boardsRoute:133 (`positionScope` `"none"` after the workphase is deleted) | boardsRoute |
| TC-2.17 | items:1424 (`positionScope` `"workflow"`) | items |
| TC-2.18 | items:474, :488 | items |
| TC-2.19 | items:520 (exactly `3`, `"workflow"`) | items |
| TC-2.20 | items:501 (fixture fixed: `5.0` becomes `2.0`); hier:368, :538 | items, hier |
| TC-2.21 | items:543 | items |
| TC-2.23 | items:555 | items |
| TC-2.24 | items:271; hier:776 | items, hier |
| TC-2.25 | items:1197 | items |
| TC-2.27 | listOps:303 (approved) | listOps |
| TC-2.28 | crossColumnAPI:95, :108; reconcile:188 (category) | crossColumnAPI, reconcile |
| TC-2.29 | listOps:329; reconcile:209 (category) | listOps, reconcile |
| TC-2.30 | listOps:354; reconcile:238 (category) | listOps, reconcile |
| TC-2.31 | items:345 | items |
| TC-3.1 | siblingsAPI:60 | siblingsAPI |
| TC-3.2 | siblingsAPI:60, :72, :91 | siblingsAPI |
| TC-3.4 | items:377 (`3`, above higher Free and `Q` items), :474 (`1.0`) | items |
| TC-3.5 | siblingsAPI:60, :72, :91 | siblingsAPI |
| TC-4.1 | listOps:136 (existing pointer) | listOps |
| TC-5.1 | items:842 | items |
| TC-5.2 | hier:1047 | hier |
| TC-5.3 | resolver:310 | resolver |
| TC-5.4 | items:391 (the magnitude trigger across workphases), :842 (a tight gap) | items |
| TC-5.5 | items:892 | items |
| TC-5.6 | resolver:82 (the older row is inserted later, and still takes the lower value) | resolver |
| TC-5.7 | items:927 | items |
| TC-5.8 | items:957 | items |
| TC-5.9 | items:842 (`reindexed` is exactly `T1 → 1`, `T2 → 2`, `P1 → 3`, mover `→ 1.5`) | items |
| TC-5.10 | hier:1028, :1047 | hier |
| TC-5.11 | hier:1028 | hier |
| TC-5.12 | hier:1070 (a gap that fits, and an append under the threshold) | hier |
| TC-5.13 | items:391, :842 (a `W2` item disclosed); hier:1047 (the attached half) | items, hier |
| TC-5.14 | items:391 (`POST`), :842 (a tight gap); hier:1028 (move), :1047 (`POST`, `PUT`) | items, hier |
| TC-5a.1 | itemsUI:61 (inline create), :98 (Sheet detach), both with a reindex and no board reload; reconcile:26, :56; dragRequest:280 (category) | itemsUI, reconcile, dragRequest |
| TC-5a.2 | reconcile:130 (approved) | reconcile |
| TC-5a.4 | reconcile:26, :49 (approved) | reconcile |
| TC-5a.5 | listOps:73 (tie), :78 (`null` as `0`) | listOps |
| TC-5a.6 | reconcile:153 (approved) | reconcile |
| TC-6.1 | items:488, :753 (`completedAt` between timestamps read just before and just after) | items |
| TC-6.2 | items:766 | items |
| TC-6.3 | items:488, :532, :753 | items |
| TC-6.4 | itemsUI:33 (Done renders `D2, D3, D1`) | itemsUI |
| TC-6.5 | items:1214 | items |
| TC-6.6 | items:1214 | items |
| TC-6.7 | columnsRoute:327, :349 (each re-reads the board) | columnsRoute |
| TC-6.8 | columnsRoute:119, :339 | columnsRoute |
| TC-6.9 | items:410 (exactly `7`, not its old `1.0`), :766 | items |
| TC-7.1 | items:422 (`A` at `2.0` gives `1`); dragRequest:127 | items, dragRequest |
| TC-7.2 | items:434 (`5`, and `4.2` before an unseen `4.4`); dragRequest:127 | items, dragRequest |
| TC-7.3 | dragRequest:140 (a tie given newest first) | dragRequest |
| TC-7.4 | crossColumnAPI:69; dragRequest:127 | crossColumnAPI, dragRequest |
| TC-7.10 | items:684, :712 (both re-read the row); hier:209, :224 | items, hier |
| TC-7.11 | hier:199, :260 (exactly `1.5`) | hier |
| TC-7.13 | hier:351 (exactly `10.5`) | hier |
| TC-7.14 | hier:634 (exactly `1.5`), :673 (a detached child keeps `5.0` across projects) | hier |
| TC-7.15 | hier:538 (exactly `1.5`) | hier |
| TC-7.17 | hier:692, :724, :776 | hier |
| TC-X.1 | items:451 (`1.5`) | items |
| TC-X.6 | items:629 (exactly `2`) | items |
| TC-5.15 | none. `Open`, routed to Epic 4 | — |
| TC-2.32, 6.10, 7.18 | none. `Pending PO`, routed to A5 | — |

### Judgment calls, disclosed

None of these changes a status. Each is a place where the Test Planner could make a case whole by rewording, as in batches 3 and 4, if Nathan reads it differently.

- **TC-2.7: two clauses rest on the resolver's bootstrap tests.**
  - The clauses are "moved in with no position to keep" and "the first attached child of a parent that has none".
  - resolver:267 bootstraps an empty scope at `1.0`, and :276 does the same for a scope holding only `null` rows. The resolver takes the scope as a parameter.
  - Choosing the parent's scope for a new child is TC-3.4's rule, and choosing the append for an item with no position is TC-2.24's.
  - The route tests that show both at `1.0` carry other IDs: items:474 carries TC-3.4, and hier:368 carries TC-2.20.
  - Adding TC-2.7 to items:474's title would carry the clause at the route. That's one title edit, for batch 6 if wanted.
- **TC-5.9: the fixture differs.** items:842's `P1` sits at `5.0` in another workphase, not "just above `A`" as the case's `C` and `E` do. The pairs are exact, and they tell disclosure from silence, which is the failure the case names. That's the Addendum's reading, and the brief follows it.
- **TC-7.14: the attach half is on hier:634, whose `X` is top-level,** not "a detached child of an item there". The attach's result doesn't depend on `X`'s former parent. The detached child matters for the Free half, which hier:673 asserts with the case's own `X`.
- **TC-2.11: the shapes the case lists are "an anchor and a side, or a workphase alone".**
  - An attach request is `{parentId, isAttached}` (dragRequest:190), and a detach adds `isAttached: false`. Neither is one of the listed shapes, though neither carries a position either.
  - I count it on the title's rule, relative intent only. The Test Planner may want the *Then* to name those two shapes.
- **TC-5a.1:** the two no-drag writes are tested with a reindex (itemsUI:61, :98). Without one, their fold is the reducer's (reconcile:56, under the category).
- **TC-2.30:** "a separate marker shows that it's pending" is asserted as the item's entry in the placements map (reconcile:238). The board's `data-pending` attribute is DRAG-6.2's.

### Destinations

**`Open` and `Pending PO` cases,** each named in its destination:
- **TC-5.15:** `docs/planning/epic-4-decisions.md` §12 names it by ID ("Routed here by ID from A3 batch 5").
- **TC-2.32, 6.10 and 7.18:** A5's D2 names all three by ID, in "Added by the Test Planner, from A3 batch 5's Stop 1".

**No mismatch either way.**
- Every `Open` and `Pending PO` case is named in its destination.
- Neither destination names an `Automated` item-positioning case.
- The roadmap's item 2 mentions TC-7.11 in a "Not deferred" note, which describes coverage and isn't a routing.

**Story 10:** `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, item 1, still reads "**item-positioning:** added when A3's batch 5 routes its gaps." It should now say:

> **item-positioning:** none. A3 batch 5 closed every gap in A3. TC-5.15 is routed to Epic 4 (`epic-4-decisions.md` §12), and TC-2.32, 6.10 and 7.18 to A5.

A3's Handoff has a matching line for the Architect: "Still owed: batch 5's routed item-positioning cases". Nothing is owed, so it can go.

**Two things in A5's D2, neither a routing mismatch:**
- **The batch 5 block sits in the middle of batch 4's.** It was inserted between batch 4's "Cases routed here by ID" and batch 4's "Tests to check the answers against", which now reads as if it followed batch 5's cases.
- **One line is stale.** Its list of tests that "carry no case ID, and pin today's answer" names `items.test.ts`'s "creates a parentless item with isAttached true (the default)…" for ATT-1.8. That test now carries TC-2.17 and asserts `positionScope` `"workflow"`.
  - It sends the flag explicitly, so TC-2.17 holds under Ruling A.
  - Its "(the default)" still pins today's create default, which A5 may reverse.

### Catalog-wide checks

- **Lost coverage: none.**
  - board-drag-interaction's 42 `Automated` cases and item-attachment's 47 each still have a test whose title starts with their ID.
  - The Coder's edits left every DRAG and ATT stamp in `items.test.ts`, `items.hierarchy.test.ts`, `dragRequest.test.ts` and `itemWriteReconciliation.test.ts` intact.
- **Unknown IDs: none.**
  - Every TC ID at the front of a title names a live case.
  - No title or comment names a deleted item-positioning case. The range tails are fixed too: reconcile:108 now reads "TC-5a.1, TC-5a.2".
  - That agrees with `check:docs`, which the coordinator reports finds only `placement.ts`'s two bare IDs (batch 6's).
- **`Manual` cases carried by a test: none.** No test carries DRAG-1.29, 1.32, 4.24 or 4.25.
- **`Pending PO` cases carried by a test: none.** hier:692 still asserts `positionScope` `"workflow"` inside its TC-7.17 test. That pins TC-7.18's question without carrying its ID, as the brief said to leave it.

### For batch 6

None of these changes a status.
- **Titles in `itemPositionScope.test.ts`** still end in "(TC-6.6)", "(TC-2.16)" and "(TC-2.17)". Route tests now back all three cases, so the IDs can go.
- **items:577's describe** still reads 'detached siblings sharing one workphase', though its items are top-level.
- **`dragRequest.test.ts`'s comment above the `sendItemMove` describe (line 261)** cites TC-2.11. That describe is TC-5a.1's and DRAG-6.6's. The comment is A4's.
- **TC-2.7's route carry** (Judgment calls), if Nathan wants it.

### Totals

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 44 | 26 | 4 | 74 |
| `Open` (TC-5.15, Epic 4) | 0 | 0 | 1 | 1 |
| `Pending PO` (A5) | 0 | 1 | 2 | 3 |
| **Total** | **44** | **27** | **7** | **78** |

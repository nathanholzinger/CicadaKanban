# Test Reconciliation Report — Epic 3.2 (Item Positioning & Board-Scoped Ordering)

**Run:** 2026-08-07, via the `test-reconciler` role (`.claude/agents/test-reconciler.md`)
**Test plan:** [`docs/test-plans/item-positioning/`](../test-plans/item-positioning/) — 55 cases
**Wiki:** [`docs/wiki/item-positioning/`](../wiki/item-positioning/)

**Scope:** only the 8 test files that changed since the `epic-3-complete` git
tag (`git diff epic-3-complete...HEAD --stat`) — this feature's automation
work began after that tag:
`server/tests/lib/positionResolver.test.ts`,
`server/tests/routes/columns.test.ts`, `server/tests/routes/items.test.ts`,
`client/src/components/workflow/boardDndUtils.test.ts`,
`client/src/components/workflow/useItemManagement.test.ts`,
`client/src/lib/hierarchy.test.ts`,
`client/src/components/item-detail/pillUtils.test.ts`,
`client/src/components/sidebar/projectTreeUtils.test.ts` (the last three
turned out to be Prettier-only reformatting in that diff — no relevant
content, no mappings from them below).

**Caveat that applies to every "gap" below:** some may already be covered
by tests that existed *before* `epic-3-complete`, outside the reconciled
scope by design — not confirmed, not searched for. Treat "not found in the
8 files" as the actual claim, not "does not exist anywhere."

---

## Status

- **32 clean mappings already applied** to the suite files' `Automated`
  columns (✅) — see the suite files under
  [`docs/test-plans/item-positioning/`](../test-plans/item-positioning/)
  for the full case-by-case detail; not repeated here.
- **9 quality-flagged mappings**, **14 automation gaps**, and **5 candidate
  new cases** were opened here originally — worked through below. Each item
  has a `**Status:**` line updated in place as decisions get made, same
  convention as the code-quality audit docs.
- **Update, 2026-08-17/18:** a same-day commit (`de80b59`, "fix item
  position to be scoped to per workflow instead of per workphase") landed
  between the original run and this working session, resolving both items
  in "resolve first" below plus four of section A's nine quality-flagged
  mappings (A.1, A.2, A.4, A.6 — see their `**Status:**` lines). It also
  surfaced a real gap sharper than originally flagged: `positionScope` was
  fully unwired from the API (A.3) — fixed same session, not just
  flagged, once manual testing confirmed the underlying scoping logic
  itself was sound. One new undocumented rule surfaced too — see the
  added item in section E. Also fixed in passing: `itemRepositioningCrossColumn.spec.ts`'s
  header comment still described itself as documenting a known
  workphase-vs-workflow-scope gap that `de80b59` had already closed — all
  8 of its tests pass, the numbers were never wrong, only the prose
  explaining them was stale.
- **Update, 2026-08-18 (cont'd):** A.5 (TC-3.5) resolved too, together with
  B.6 (TC-3.1) and B.7 (TC-3.2) — one new Playwright spec
  (`tests/api/itemRepositioningAttachedSiblings.spec.ts`) covers all
  three at once (user-designed scenario: 3 attached siblings, boundary +
  interior moves, plus an isolation control group). **Section A is now
  fully closed** (7 resolved, TC-4.6 removed from the catalog outright).
  Remaining open count: **0 of 9** quality concerns, **12 of 14** gaps
  (TC-3.1/TC-3.2 resolved), **6** (5 original + 1 new) candidate cases.

**Two items worth resolving first, before the smaller ones:**

1. **Possible real implementation gap, not just a test gap (TC-2.7/2.8).**
   The only mapped test for the rank-aware bootstrap rule asserts the
   *opposite* of what the wiki promises — a flat `1.0` for a new empty
   scope, not "anchor to the nearest non-empty workphase by rank." A
   comment in `positionResolver.ts` itself suggests the rank-aware
   refinement may not be implemented anywhere in scope. Needs an
   Architect/Coder check, not just a test-writing task.
   **Status:** Resolved (2026-08-17, commit `de80b59`) — position scope
   moved from per-workphase to workflow-wide, which is what actually
   eliminates the two-empty-workphases collision the rank-aware design was
   for. The wiki now documents this explicitly (§2) and the flat `1.0`
   test was correct all along. See [A.1](#a-test-quality-concerns-9) and
   [TC-2.7/TC-2.8 in part-2-anchor-resolution.md](../test-plans/item-positioning/part-2-anchor-resolution.md).
2. **The wiki's build-status line is stale.** `docs/wiki/item-positioning/README.md`
   says "Not yet implemented," but this reconciliation shows substantial
   working implementation and 41 mapped tests. Product Owner should update
   it — this is exactly the drift the wiki's own "keeping it honest" rule
   exists to catch.
   **Status:** Resolved — README now says "Implemented" (already true as
   of the `de80b59` commit, independent of this reconciliation).

---

## A. Test Quality Concerns (9)

Each of these has a mapped test, but the mapping is weaker than it looks —
decide per item whether to accept it as-is, request a better test, or
downgrade the case to a gap.

1. **TC-2.7** (Bootstrap: brand-new empty scope) — see item 1 above.
   **Status:** Resolved — mapping confirmed correct, no change needed.
2. **TC-2.3** (Coarsest-fit stops at minimum precision) — mapped test uses
   `coarsestFit(1, 3) === 2`, different neighbor values than the wiki's
   1.5/2.0 example. Probably an acceptable proxy; confirm or add a
   case matching the example directly.
   **Status:** Resolved — confirmed as the correct mapping, not just an
   acceptable proxy. TC-2.2 already separately covers the wiki's literal
   1.5/2.0 → 1.8 example; mapping TC-2.3 to that same assertion would
   duplicate TC-2.2 rather than add distinct coverage. `coarsestFit(1,3)
   === 2` is the sharper demonstration of TC-2.3's actual rule (stops at
   the coarsest precision, doesn't search deeper than needed).
3. **TC-2.13 / TC-2.14 / TC-2.15** (`positionScope` states) — all three
   only unit-tested on the pure `classifyPositionScope` function; never
   asserted on an actual API response. The case text says "when fetched
   via the API."
   **Status:** Resolved (2026-08-18) — was escalated (see below), then
   implemented rather than just flagged. `classifyPositionScope` was
   exported from `positionResolver.ts` but never imported/called anywhere
   else in `server/src` — no route computed `positionScope` on any
   response at all, despite the wiki (§2) documenting it as a real API
   field and `client/src/types.ts` declaring
   `positionScope?: PositionScope`. Wired into every item-serializing
   response in `items.ts` (GET/POST/PUT/:id, PATCH /:id/move) and into
   `boards.ts`'s board read path (the one the board UI actually renders
   from — items there needed a fresh `isTerminal` lookup per item since
   an "Unknown status" item's workphaseId can be misaligned/foreign to
   the board's own workflow). Added the three API-level tests this
   section originally asked for (`items.test.ts`, TC-2.13/14/15).
   Confirmed via manual testing (user) that the underlying scoping
   behavior itself was already correct — this closed the "declared but
   never surfaced" gap specifically, not a functional bug. Also fixed in
   passing: the catalog's TC-2.14 still said `positionScope = "workphase"`,
   stale after the `de80b59` rename to `"workflow"`.
   **Follow-up, same day:** the API wiring alone left the client side of
   the same gap open — `git diff --stat -- client/` was empty after the
   above, confirming no client code had started reading the new field yet,
   and `useItemManagement.ts` was still re-deriving the exact same
   `isAttached && parentId` classification inline (duplicating, not just
   ignoring, what `classifyPositionScope` computes). Also fixed:
   `getWorkphaseItemsFrom`/`getMergedColumnItemsFrom`/`getAttachedChildrenFrom`/
   `computeChildCounts` (`useItemManagement.ts`) and `UnsortedBucket.tsx`
   now read `item.positionScope === 'attached-siblings'` instead. Left
   alone: the `isTerminal`-driven sort-key choice (`position` vs
   `completedAt`) — a batch-level decision, not a per-item classification,
   so not actually the same duplication. Test fixtures updated to compute
   `positionScope` alongside `isAttached`/`parentId` so they stay
   consistent with real API shape.
4. **TC-6.6** (`positionScope` stays `"attached-siblings"` under terminal
   cascade) — the attached-siblings unit test only ever passes
   `workphaseIsTerminal: false`. Source branch order makes the precedence
   true by construction, but no test input combines `isAttached: true`
   with `workphaseIsTerminal: true`.
   **Status:** Resolved — added
   `positionResolver.test.ts` › `classifyPositionScope` › "classifies an
   attached child as attached-siblings even under a terminal cascade
   (TC-6.6)".
5. **TC-3.5** (Attached-sibling reorder reuses anchor+side resolution) —
   every `positionResolver.test.ts` test scopes with
   `eq(items.workphaseId, phase.id)`; none use a `(parentId, isAttached)`
   predicate. Architecturally should hold (resolver is scope-agnostic by
   design) but nothing literally instantiates it.
   **Status:** Resolved — new Playwright spec
   `tests/api/itemRepositioningAttachedSiblings.spec.ts` re-runs
   TC-2.1/TC-2.4/TC-2.5 (exactly what this case cross-references) against
   a real `(parentId, isAttached)` scope with three attached siblings,
   asserting exact resolved values. Closed together with B.6 (TC-3.1) and
   B.7 (TC-3.2) using the same scenario — see below.
6. **TC-6.9** (Reopening doesn't resurrect a stale position) — mapped
   assertion is `expect(res.body.position).not.toBeNull()`, which proves
   *a* position was assigned, not that it specifically followed
   append-fallback.
   **Status:** Resolved — strengthened the existing `items.test.ts`
   assertion to check the reopened item's position lands strictly past a
   true pre-existing sibling's position, proving append-fallback
   specifically.
7. **TC-4.6** (No forced regrouping in merged columns) — mapped test
   proves the mechanism has no regroup step, but doesn't simulate the
   "drifted over time, then re-rendered" scenario the case describes.
   **Status:** Resolved — removed from the catalog rather than accepted
   or tested further (user call). TC-4.1's interleaved-input →
   interleaved-output assertion structurally *is* the no-regroup proof; a
   regroup step would make TC-4.1's own setup fail. The case's distinct
   framing was "drift" (per-workphase position counters diverging over
   time), which isn't a real phenomenon anymore under workflow-wide scope
   (`de80b59`) — no separate counter exists to drift from. See
   part-4-merged-column.md.

---

## B. Automation Gaps (14)

No mapped test found in scope. Decide per item: write the test, mark it
deliberately manual, or accept as a known gap for now.

1. **TC-1.1** — no test fetches the same item through two different boards
   and compares `position`.
   **Status:** Open
2. **TC-2.8** — no test covers rank-aware bootstrap collision avoidance
   across two empty scopes (linked to item 1 in Status above).
   **Status:** Resolved as N/A — superseded, not a gap. Bootstrap scope is
   workflow-wide now (`de80b59`), so "two independently-empty workphases"
   bootstrapping and later colliding can no longer happen — there's only
   ever one bootstrap point per workflow. Catalog entry struck through in
   part-2-anchor-resolution.md rather than deleted, for traceability.
3. **TC-2.11** — no test simulates a client optimistic guess disagreeing
   with server resolution plus the `loadBoard()` resync path; that logic
   lives in `useBoardDnd.ts`, not covered by any file in scope.
   **Status:** Open
4. **TC-2.16** — no test asserts `position`'s shape (`number | null`)
   directly; only inferred incidentally from other tests' values.
   **Status:** Open
5. **TC-2.21** — no test asserts a child's `position` is unchanged
   specifically when its parent's workphase-cascade fires; existing
   cascade tests only check `workphaseId` propagation.
   **Status:** Open
6. **TC-3.1** — no test reorders 3+ attached siblings and checks
   persisted order on reload.
   **Status:** Resolved — closed alongside A.5, same
   `itemRepositioningAttachedSiblings.spec.ts`. Every case reads order back
   via `siblingOrder` (`GET /api/items/:parentId`'s `children` array), a
   different codepath than the move response — a genuine reload check.
7. **TC-3.2** — no test verifies reordering one parent's attached children
   leaves another parent's children and top-level items untouched.
   **Status:** Resolved — closed alongside A.5, same spec. Scenario seeds
   an isolation control group (a second parent's attached child + an
   unrelated top-level item, same workphase); every case calls
   `expectIsolationUnaffected` after its reorder.
8. **TC-5.4** — no test builds a multi-workphase "active scope" reindex
   and verifies it's coordinated as one operation; every `reindexScope`
   test uses a single-workphase predicate.
   **Status:** Open
9. **TC-5.5** — no test verifies two independently reindexed non-terminal
   workphases don't collide when merged.
   **Status:** Open
10. **TC-5.6** — no test verifies a done item is excluded/untouched by an
    active-scope reindex.
    **Status:** Open
11. **TC-6.5** — no test verifies an attached child's `position` survives
    when its parent transitions to terminal (only the inverse — a
    *detaching* child losing position into terminal — is tested).
    **Status:** Open
12. **TC-X.1** — no detached-sibling-only reorder test in scope; likely
    just pre-existing coverage outside scope, per the standing caveat.
    **Status:** Open
13. **TC-X.4** — no MCP tool test content exists in any of the 8 files at
    all.
    **Status:** Open
14. **TC-X.5** — the client's `DropResolution` type has no `side` field at
    all; nothing in scope verifies the client defaults to `side: 'before'`
    when translating a card-drop into an API call.
    **Status:** Open

---

## C. Duplication

Informational — report only, no action implied. Most of this is fine/
intentional (same rule covered at two layers, or two genuinely different
code paths).

- **TC-2.1/2.6** — unit layer (`positionResolver.test.ts`) + integration
  layer (`items.test.ts`), same rule. Fine.
- **TC-2.9/2.10** — a single `positionResolver.test.ts` test satisfies
  both catalog IDs at once (server-side resolution has no visibility
  concept, so "ignores visibility" and "finds the true neighbor" are
  structurally the same assertion).
- **TC-5.7** — tested independently server-side (reindex tie-break) and
  client-side (render-time sort tie-break) — same rule, two genuinely
  different code paths. Legitimate.
- **TC-6.1/TC-6.3** — one test (`'POST into a terminal workphase gets no
  position, but a completedAt timestamp'`) satisfies both catalog IDs.
- **TC-6.4** — tested independently for `getWorkphaseItemsFrom` and
  `getMergedColumnItemsFrom` — same rule, two call sites. Legitimate.
- **TC-4.2/TC-4.3** — two `boardDndUtils.test.ts` tests (container-hover
  vs. card-hover) both land on `kind: 'reorder'` for the same underlying
  rule — complementary branch coverage, not true duplication.

---

## D. Uncatalogued Tests

Exist for coverage-gate / implementation-detail purposes — no distinct
business rule beyond what's already mapped above. Listed here per the
reconciler's convention rather than forcing a mapping; may be worth
tracking some other way later.

- `positionResolver.test.ts` › `coarsestFit` › "self-corrects when a
  rounded candidate would collide with a boundary" and "returns null once
  the gap is exhausted even at max precision" — internal edge cases of the
  same algorithm already covered by TC-2.2/2.3/2.12.
- `boardDndUtils.test.ts` › "rejects dropping an item onto itself" and
  "never collides an item with itself" — generic dnd-kit safety guards,
  not an item-positioning business rule.
- `items.test.ts` › "move rejects an invalid side when anchorId is given"
  and "move rejects a non-existent anchorId" — standard input-validation
  guards.
- `useItemManagement.test.ts` › `getAttachedChildrenFrom` (both tests) and
  `computeChildCounts` — supporting UI plumbing for rendering already-
  covered reorder/position results.

---

## E. Candidate New Cases (5)

Real tested behavior with no matching catalog entry. Each needs a human
decision on ownership (per `.claude/agents/test-reconciler.md`'s routing
note: Product Owner if the wiki doesn't document the rule at all, Test
Planner if the wiki already covers it and the catalog just missed the
case) and then whether to actually add it.

1. **Anchoring against a done item is rejected.** Tested at both layers
   (`positionResolver.test.ts` and `items.test.ts`). A real corollary of
   combining §2 ("query the anchor's true current position") and §6
   ("done items get no stored position"), but the wiki never states the
   error contract explicitly. Borderline — could be "obvious enough" to
   just catalog, or the wiki should say it outright first.
   **Likely owner:** Product Owner (wiki gap, borderline) · **Status:** Open
2. **`classifyPositionScope` on a null `workphaseId`** → classifies as
   `"none"` (unsorted, not currently ordered). A fourth `positionScope`
   state the wiki's §2 description never mentions at all (only three
   states are listed).
   **Likely owner:** Product Owner (wiki gap) · **Status:** Open
3. **`classifyPositionScope` on `isAttached: true` with `parentId: null`**
   → classifies as `"workphase"`, not `"attached-siblings"`. The wiki does
   state the AND-condition, so this negative case is implied, just never
   enumerated as its own case.
   **Likely owner:** Test Planner (catalog gap, wiki already covers it) · **Status:** Open
4. **A redundant re-attach to the same parent is a no-op for position.**
   Corollary of the wiki's documented scope-change-reassignment table (no
   scope change → no reassignment), but that table doesn't name this
   specific scenario.
   **Likely owner:** Test Planner (catalog gap) · **Status:** Open
5. **An item excludes its own stale row from its own scope query when
   repositioning.** Regression-style guard, not mentioned anywhere in the
   wiki. Closer to an implementation-correctness detail than a stated
   business rule — may not need a wiki entry at all.
   **Likely owner:** Product Owner (wiki gap, judgment call on whether it
   needs one) · **Status:** Open
6. **A workphaseId-only move with no anchor keeps the item's existing
   position unchanged.** New as of `de80b59` (2026-08-17) — the wiki §2
   addendum states this explicitly as a deliberate exception, and
   `server/src/routes/items.ts`'s move handler implements it
   (`isGenuineWorkphaseChange && item.position !== null` short-circuits
   the append-fallback branch). Not in the original 55-case catalog at
   all — this is a genuinely new documented rule, not a missed case from
   the original scope. No automation found for it in the reconciled
   files either.
   **Likely owner:** Test Planner (wiki already covers it in detail,
   catalog just predates it) · **Status:** Open

---

## Applied Mappings (reference only)

The 32 clean mappings are recorded directly in the suite files, not
duplicated here: [`part-2-anchor-resolution.md`](../test-plans/item-positioning/part-2-anchor-resolution.md) (13),
[`part-3-attached-sibling-reorder.md`](../test-plans/item-positioning/part-3-attached-sibling-reorder.md) (2),
[`part-4-merged-column.md`](../test-plans/item-positioning/part-4-merged-column.md) (5),
[`part-5-reindex.md`](../test-plans/item-positioning/part-5-reindex.md) (4),
[`part-6-active-done-split.md`](../test-plans/item-positioning/part-6-active-done-split.md) (6),
[`cross-cutting-regression.md`](../test-plans/item-positioning/cross-cutting-regression.md) (2).
Each case's `**Automation test:**` line has the specific file/test-name
reference.

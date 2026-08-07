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
  new cases** are still open — worked through below. Each item has a
  `**Status:**` line to update in place as decisions get made, same
  convention as the code-quality audit docs.

**Two items worth resolving first, before the smaller ones:**

1. **Possible real implementation gap, not just a test gap (TC-2.7/2.8).**
   The only mapped test for the rank-aware bootstrap rule asserts the
   *opposite* of what the wiki promises — a flat `1.0` for a new empty
   scope, not "anchor to the nearest non-empty workphase by rank." A
   comment in `positionResolver.ts` itself suggests the rank-aware
   refinement may not be implemented anywhere in scope. Needs an
   Architect/Coder check, not just a test-writing task.
   **Status:** Open
2. **The wiki's build-status line is stale.** `docs/wiki/item-positioning/README.md`
   says "Not yet implemented," but this reconciliation shows substantial
   working implementation and 41 mapped tests. Product Owner should update
   it — this is exactly the drift the wiki's own "keeping it honest" rule
   exists to catch.
   **Status:** Open

---

## A. Test Quality Concerns (9)

Each of these has a mapped test, but the mapping is weaker than it looks —
decide per item whether to accept it as-is, request a better test, or
downgrade the case to a gap.

1. **TC-2.7** (Bootstrap: brand-new empty scope) — see item 1 above. The
   mapped test (`resolveAppendPosition` › "returns 1.0 for a genuinely
   empty scope") asserts the flat baseline the wiki explicitly says not to
   use.
   **Status:** Open
2. **TC-2.3** (Coarsest-fit stops at minimum precision) — mapped test uses
   `coarsestFit(1, 3) === 2`, different neighbor values than the wiki's
   literal 1.0/2.0 example. Probably an acceptable proxy; confirm or add a
   case matching the example directly.
   **Status:** Open
3. **TC-2.13 / TC-2.14 / TC-2.15** (`positionScope` states) — all three
   only unit-tested on the pure `classifyPositionScope` function; never
   asserted on an actual API response. The case text says "when fetched
   via the API."
   **Status:** Open
4. **TC-6.6** (`positionScope` stays `"attached-siblings"` under terminal
   cascade) — the attached-siblings unit test only ever passes
   `workphaseIsTerminal: false`. Source branch order makes the precedence
   true by construction, but no test input combines `isAttached: true`
   with `workphaseIsTerminal: true`.
   **Status:** Open
5. **TC-3.5** (Attached-sibling reorder reuses anchor+side resolution) —
   every `positionResolver.test.ts` test scopes with
   `eq(items.workphaseId, phase.id)`; none use a `(parentId, isAttached)`
   predicate. Architecturally should hold (resolver is scope-agnostic by
   design) but nothing literally instantiates it.
   **Status:** Open
6. **TC-6.9** (Reopening doesn't resurrect a stale position) — mapped
   assertion is `expect(res.body.position).not.toBeNull()`, which proves
   *a* position was assigned, not that it specifically followed
   append-fallback.
   **Status:** Open
7. **TC-4.6** (No forced regrouping in merged columns) — mapped test
   proves the mechanism has no regroup step, but doesn't simulate the
   "drifted over time, then re-rendered" scenario the case describes.
   **Status:** Open

---

## B. Automation Gaps (14)

No mapped test found in scope. Decide per item: write the test, mark it
deliberately manual, or accept as a known gap for now.

1. **TC-1.1** — no test fetches the same item through two different boards
   and compares `position`.
   **Status:** Open
2. **TC-2.8** — no test covers rank-aware bootstrap collision avoidance
   across two empty scopes (linked to item 1 in Status above).
   **Status:** Open
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
   **Status:** Open
7. **TC-3.2** — no test verifies reordering one parent's attached children
   leaves another parent's children and top-level items untouched.
   **Status:** Open
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

# Part 5 — Reindex mechanism

**Wiki:** [`../../wiki/item-positioning/#5-reindexing-precision--magnitude`](../../wiki/item-positioning/README.md#5-reindexing-precision--magnitude)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-5.1 | Reindex preserves current relative order | P0 | ✅ automated |
| TC-5.2 | Magnitude threshold triggers reindex before append | P0 | ✅ automated |
| TC-5.3 | Magnitude threshold scales with scope size | P1 | ✅ automated |
| TC-5.4 | Active items reindex as one coordinated cross-workphase scope | P0 | ✅ automated |
| TC-5.5 | ~~Two independently-reindexed active scopes never collide~~ — superseded, no longer applicable | P0 | N/A |
| TC-5.6 | Done items are never reindexed | P1 | ⚠️ automated, currently failing (real bug) |
| TC-5.7 | Tie-break on exact position equality | P1 | ✅ automated |

---

## TC-5.1 — Reindex preserves current relative order

**Priority:** P0 · **Automated:** ✅ automated

*Given* a comparison scope with items in some order (regardless of their
raw position values), *when* a reindex is triggered, *then* the items' new
clean sequential positions preserve their pre-reindex relative order
exactly.

**Automation test:** `server/tests/lib/positionResolver.test.ts` ›
`reindexScope` › "reassigns clean sequential positions while preserving
relative order"

## TC-5.2 — Magnitude threshold triggers reindex before append

**Priority:** P0 · **Automated:** ✅ automated

*Given* a scope where the next append-fallback value would cross
`max(1000, currentScopeItemCount + 100)`, *when* an append is attempted,
*then* the scope is reindexed first, and the append proceeds afterward
with a small, clean value.

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "reindexes before appending once the magnitude threshold is crossed"

## TC-5.3 — Magnitude threshold scales with scope size

**Priority:** P1 · **Automated:** ✅ automated

*Given* a scope that legitimately holds 1200 items with positions already
in a comparable range, *when* an append occurs, *then* it does *not*
trigger a reindex merely because a flat 1000 ceiling was crossed — the
threshold accounts for item count.

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "does not reindex when a large position is proportionate to a large item
count"

## TC-5.4 — Active items reindex as one coordinated cross-workphase scope

**Priority:** P0 · **Automated:** ✅ automated

*Given* multiple non-terminal workphaces whose combined items need
reindexing, *when* a reindex is triggered by either cause (tight-gap or
magnitude) affecting the active scope, *then* all active items across
every non-terminal workphace are reset together in one operation — not
workphace-by-workphace.

**Automation test:** `items.test.ts` › "reindexes every non-terminal
workphase in the workflow together, in one coordinated pass (TC-5.4)".
Uses the tight-gap trigger (crossing the magnitude threshold via real
appends would need 1000+ POSTs — `max(1000, count+100)` is never crossed
by a plain `count+1` append). Seeds a tight gap in one workphase, an item
in a second non-terminal workphase in the same workflow, forces the
reindex via a real `PATCH /:id/move` anchor+side call, and confirms the
second workphase's item was renumbered in the same pass — the
coordination proof.

## TC-5.5 — ~~Two independently-reindexed active scopes never collide~~ (superseded)

**Priority:** P0 (regression/guard) · **Automated:** N/A — scenario no longer applies

*Given* two non-terminal workphaces that both needed reindexing at
different times, *when* their items are later compared in a merged
column, *then* there is no position collision — because both were part of
the same coordinated reindex, not separate resets.

*(Superseded, same pattern as [TC-2.8](part-2-anchor-resolution.md):
`positionScopeFor`'s workflow-wide scope is the only scope any reindex
trigger ever uses for a detached item, and a board's columns are
hard-scoped to one `workflowId` (`getOrderedWorkphases`/
`getCoveredWorkphases`, `columnRanges.ts`) — a "merge" can never span two
workflows. There is no code path, real or hypothetical, that produces two
independently-reindexed non-terminal workphases colliding when merged —
TC-5.4's test demonstrates the single coordinated scope in practice. Kept
here, struck through, for traceability rather than deleted outright.)*

## TC-5.6 — Done items are never reindexed

**Priority:** P1 (regression/guard) · **Automated:** ⚠️ automated, currently failing — confirmed real bug

*Given* a terminal-workphace (done) item, *when* an active-scope reindex
occurs elsewhere, *then* the done item's data is untouched — done items
have no stored `position` to reindex (see [Part 6](part-6-active-done-split.md)).

**Automation test:** `items.test.ts` › "excludes a done item from an
active-scope reindex (TC-5.6)" — **written expecting failure, and it
currently fails.** `positionScopeFor`'s workflow-wide scope
(`workphaseIdsInSameWorkflow`) includes terminal workphase ids with no
`isTerminal`/`position IS NOT NULL` filter, so a done item (`position:
null`) remains a scope member by `workphaseId` alone. SQLite/
`better-sqlite3` sorts `NULL` first in `ASC` order, so `reindexScope`
assigns the done item a real position — contradicting this very rule. See
the `TODO(bug, ...)` comment directly above the test in `items.test.ts`
for fix candidates (exclude terminal workphase ids in `positionScopeFor`,
or filter `isNotNull(items.position)` in `reindexScope`). **Needs an
Architect/Coder decision before this test can go green** — not fixed as
part of this reconciliation pass, per explicit user call.

## TC-5.7 — Tie-break on exact position equality

**Priority:** P1 · **Automated:** ✅ automated

*Given* two items with identical `position` values in the same rendered
list, *when* the list is sorted client-side, *then* the item with the
earlier `createdAt` sorts first, deterministically, regardless of
underlying DB row order.

**Automation test:** `positionResolver.test.ts` › `reindexScope` ›
"breaks exact ties by createdAt, oldest first" (server reindex-time) and
`useItemManagement.test.ts` › `getWorkphaseItemsFrom` › "breaks an exact
position tie by createdAt, oldest first" (client render-time) — two
genuinely different code paths, not redundant

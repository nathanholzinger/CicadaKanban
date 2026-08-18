# Part 5 — Reindex mechanism

**Wiki:** [`../../wiki/item-positioning/#5-reindexing-precision--magnitude`](../../wiki/item-positioning/README.md#5-reindexing-precision--magnitude)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-5.1 | Reindex preserves current relative order | P0 | ✅ automated |
| TC-5.2 | Magnitude threshold triggers reindex before append | P0 | ✅ automated |
| TC-5.3 | Magnitude threshold scales with scope size | P1 | ✅ automated |
| TC-5.4 | Active items reindex as one coordinated cross-workphase scope | P0 | ✅ automated |
| TC-5.5 | Done items are never reindexed | P1 | ✅ automated |
| TC-5.6 | Tie-break on exact position equality | P1 | ✅ automated |
| TC-5.7 | Attached-siblings reindex doesn't leak into workflow-wide scope | P0 (regression/guard) | ✅ automated |
| TC-5.8 | Workflow-wide reindex doesn't leak into attached-siblings scope | P0 (regression/guard) | ✅ automated |

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

## TC-5.5 — Done items are never reindexed

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* a terminal-workphace (done) item, *when* an active-scope reindex
occurs elsewhere, *then* the done item's data is untouched — done items
have no stored `position` to reindex (see [Part 6](part-6-active-done-split.md)).

**Automation test:** `items.test.ts` › "excludes a done item from an
active-scope reindex (TC-5.6)". Found a real bug on first write (2026-08-18):
`positionScopeFor`'s workflow-wide scope (`workphaseIdsInSameWorkflow`)
includes terminal workphase ids with no `isTerminal` filter, so a done
item (`position: null`) was a scope member by `workphaseId` alone, and
SQLite sorts `NULL` first in `ASC` order — so `reindexScope` assigned the
done item a real position, contradicting this very rule. **Fixed** by
filtering `isNotNull(items.position)` directly in `reindexScope`
(`positionResolver.ts`) rather than narrowing `positionScopeFor`: the
append/anchor neighbor-lookup queries elsewhere in that file were already
safe (`gt()`/`lt()` against a real value can never match a null
position, and `ORDER BY position DESC` sorts `NULL` *last*, both
confirmed empirically) — `reindexScope`'s blind order-and-renumber loop
was the only exposed spot, so the fix lives there.

## TC-5.6 — Tie-break on exact position equality

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

## TC-5.7 — Attached-siblings reindex doesn't leak into workflow-wide scope

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* a tight-gap reindex triggered within one parent's attached-siblings
scope (`parentId = X AND isAttached = 1`), *when* the reindex runs, *then*
an unrelated workflow-wide item sharing the same workphase — and the
parent itself — are completely untouched by it.

**Automation test:** `items.test.ts` › `describe('reindex scope isolation:
attached-siblings vs. workflow-wide', ...)` › "an attached-siblings
reindex does not touch an unrelated workflow-wide item". Added 2026-08-18
after a direct question about whether `positionScopeFor`'s two branches
(attached-siblings vs. workflow-wide — literal complements of each other
by construction, see the describe block's own header comment) could
cross-contaminate under a real reindex, the same class of gap TC-5.6
turned out to hide. Verified empirically rather than trusting the
construction argument alone. The pre-existing isolation coverage in
`itemRepositioningAttachedSiblings.spec.ts` never actually triggers a
reindex (its gaps are always resolvable directly), so this is genuinely
new coverage, not a duplicate.

## TC-5.8 — Workflow-wide reindex doesn't leak into attached-siblings scope

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* a tight-gap reindex triggered in the workflow-wide scope, *when*
the reindex runs, *then* an unrelated parent's attached children, sharing
the same workphase, are completely untouched by it.

**Automation test:** `items.test.ts` › same describe block as TC-5.8 ›
"a workflow-wide reindex does not touch an unrelated parent's attached
children" — the reverse direction of TC-5.8, added alongside it.
